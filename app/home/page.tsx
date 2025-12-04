"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mic, 
  Music, 
  Radio, 
  Video, 
  MapPin, 
  Calendar, 
  ArrowRight, 
  Headphones,
  Award,
  Clock,
  Users,
  Sparkles,
  Guitar,
  Speaker,
  MonitorPlay,
  Plus,
  Edit3,
  X,
  Eye,
  Phone,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Building2,
  Check,
  Shield,
  RefreshCw
} from "lucide-react";
import { useDevicePerformance } from '@/lib/useDevicePerformance';

// Helper function to safely parse JSON responses
async function safeJsonParse(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    console.error('Failed to parse response as JSON:', text.substring(0, 200));
    throw new Error('Server returned an invalid response. Please try again.');
  }
}

interface Booking {
  id: string;
  studio: string;
  session_type: string;
  session_details?: string;
  date: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  total_amount: number;
  phone_number: string;
  name?: string;
}

type ActionMode = 'change' | 'cancel' | 'view' | null;

// Optimized animation variants - shorter durations for better performance
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: "easeOut" }
};

const fadeInLeft = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.3, ease: "easeOut" }
};

const fadeInRight = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.3, ease: "easeOut" }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05
    }
  }
};

// Simplified floating animation for better mobile performance
const floatingAnimation = {
  y: [0, -6, 0],
  transition: {
    duration: 4,
    repeat: Infinity,
    ease: "easeInOut" as const
  }
};

export default function HomePage() {
  const router = useRouter();
  
  // Modal state for Change/Cancel/View flows
  const [actionMode, setActionMode] = useState<ActionMode>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [step, setStep] = useState<'phone' | 'select' | 'view' | 'cancel-confirm' | 'success'>('phone');
  
  // Loading state for cancel
  const [isCancelling, setIsCancelling] = useState(false);

  const resetModal = () => {
    setActionMode(null);
    setPhoneNumber('');
    setError('');
    setBookings([]);
    setSelectedBooking(null);
    setStep('phone');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5); // Returns "HH:MM" format (24-hour)
  };

  const handleFetchBookings = async () => {
    const normalized = phoneNumber.replace(/\D/g, '');
    if (normalized.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/bookings/upcoming?phone=${normalized}`);
      const data = await safeJsonParse(response);

      if (data.error) {
        throw new Error(data.error);
      }

      setBookings(data.bookings || []);
      
      if ((data.bookings || []).length === 0) {
        setError('No upcoming bookings found for this phone number');
      } else {
        setStep('select');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bookings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    
    if (actionMode === 'view') {
      setStep('view');
    } else if (actionMode === 'cancel') {
      setStep('cancel-confirm');
    } else if (actionMode === 'change') {
      // Navigate to booking page with edit mode and pre-filled data
      const bookingData = {
        editMode: true,
        originalBookingId: booking.id,
        sessionType: booking.session_type,
        sessionDetails: booking.session_details,
        studio: booking.studio,
        date: booking.date,
        start_time: booking.start_time,
        end_time: booking.end_time,
        phone_number: booking.phone_number,
        name: booking.name,
        total_amount: booking.total_amount,
      };
      sessionStorage.setItem('editBookingData', JSON.stringify(bookingData));
      router.push('/booking/new');
    }
  };

  // Cancel booking directly without OTP
  const handleConfirmCancel = async () => {
    if (!selectedBooking) {
      setError('No booking selected');
      return;
    }

    setIsCancelling(true);
    setError('');

    try {
      const response = await fetch('/api/bookings/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: selectedBooking.id,
          phone: phoneNumber,
          reason: 'Cancelled by user',
        }),
      });

      const data = await safeJsonParse(response);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel booking');
      }

      setStep('success');
      
      setTimeout(() => {
        resetModal();
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel booking');
    } finally {
      setIsCancelling(false);
    }
  };

  const services = [
    {
      icon: <Guitar className="w-7 h-7" />,
      title: "Rehearsal Studios",
      description: "Three professional studios for bands, musicians & karaoke sessions",
      color: "from-violet-500 to-purple-600",
      shadowColor: "shadow-violet-500/25",
    },
    {
      icon: <Mic className="w-7 h-7" />,
      title: "Audio Recording",
      description: "Professional recording, mixing & mastering at ₹700/song",
      color: "from-blue-500 to-cyan-500",
      shadowColor: "shadow-blue-500/25",
    },
    {
      icon: <Video className="w-7 h-7" />,
      title: "Video Recording",
      description: "True 4K quality video with professional editing at ₹800/song",
      color: "from-red-500 to-orange-500",
      shadowColor: "shadow-red-500/25",
    },
    {
      icon: <MonitorPlay className="w-7 h-7" />,
      title: "Green Screen",
      description: "Professional chroma key setup for music videos at ₹1,200/song",
      color: "from-emerald-500 to-teal-500",
      shadowColor: "shadow-emerald-500/25",
    },
    {
      icon: <Radio className="w-7 h-7" />,
      title: "Live Streaming",
      description: "Facebook Live & social media streaming setup available",
      color: "from-purple-500 to-pink-500",
      shadowColor: "shadow-purple-500/25",
    },
    {
      icon: <Speaker className="w-7 h-7" />,
      title: "Sound System Rental",
      description: "Professional PA system for outside shows and events",
      color: "from-amber-500 to-orange-500",
      shadowColor: "shadow-amber-500/25",
    },
  ];

  const studios = [
    { name: "Studio A", size: "Large", capacity: "Up to 30 people", price: "From ₹350/hr", color: "bg-red-500", id: "studio-a" },
    { name: "Studio B", size: "Medium", capacity: "Up to 12 people", price: "From ₹250/hr", color: "bg-amber-500", id: "studio-b" },
    { name: "Studio C", size: "Compact", capacity: "Up to 5 people", price: "From ₹200/hr", color: "bg-emerald-500", id: "studio-c" },
  ];

  const stats = [
    { value: "10+", label: "Years Experience", icon: <Award className="w-5 h-5" /> },
    { value: "3", label: "Professional Studios", icon: <Headphones className="w-5 h-5" /> },
    { value: "1,000+", label: "Happy Customers", icon: <Users className="w-5 h-5" /> },
    { value: "08:00-22:00", label: "Daily Hours", icon: <Clock className="w-5 h-5" /> },
  ];

  // Get device performance info to optimize animations
  const { shouldReduceAnimations, isMobile } = useDevicePerformance();

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-grid opacity-20" />
        
        {/* Floating Orbs - Only show on desktop or when not reducing animations */}
        {!shouldReduceAnimations && (
          <>
            <motion.div 
              className="absolute top-20 left-10 w-72 h-72 bg-violet-600/30 rounded-full blur-[100px] will-change-transform"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.4, 0.3]
              }}
              transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div 
              className="absolute bottom-20 right-10 w-96 h-96 bg-purple-600/25 rounded-full blur-[120px] will-change-transform"
              animate={{ 
                scale: [1.1, 1, 1.1],
                opacity: [0.3, 0.2, 0.3]
              }}
              transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            />
          </>
        )}
        
        {/* Static orbs for mobile/reduced motion */}
        {shouldReduceAnimations && (
          <>
            <div className="absolute top-20 left-10 w-72 h-72 bg-violet-600/20 rounded-full blur-[100px]" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-600/15 rounded-full blur-[120px]" />
          </>
        )}
        
        {/* Central gradient - static on mobile */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-violet-600/10 to-purple-600/10 rounded-full blur-[150px]" />

        {/* Floating Music Notes - only on desktop */}
        {!isMobile && !shouldReduceAnimations && (
          <>
            <motion.div 
              className="absolute top-1/4 right-[15%] text-violet-500/20"
              animate={floatingAnimation}
            >
              <Music className="w-16 h-16" />
            </motion.div>
            <motion.div 
              className="absolute bottom-1/3 left-[10%] text-purple-500/20"
              animate={{ ...floatingAnimation, transition: { ...floatingAnimation.transition, delay: 1 } }}
            >
              <Headphones className="w-20 h-20" />
            </motion.div>
            <motion.div 
              className="absolute top-1/3 left-[20%] text-violet-500/15"
              animate={{ ...floatingAnimation, transition: { ...floatingAnimation.transition, delay: 0.5 } }}
            >
              <Mic className="w-12 h-12" />
            </motion.div>
          </>
        )}
        
        <motion.div 
          className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
          initial="initial"
          animate="animate"
          variants={staggerContainer}
        >
          {/* Badge */}
          <motion.div 
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-violet-500/10 border border-violet-500/20 mb-8"
            variants={fadeInUp}
            whileHover={{ scale: 1.05 }}
          >
            <motion.span 
              className="w-2 h-2 bg-emerald-400 rounded-full"
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-sm font-medium text-zinc-300">Professional Studios in Pune</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </motion.div>

          {/* Main Heading */}
          <motion.h1 
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight"
            variants={fadeInUp}
          >
            <span className="text-white">Where Music</span>
            <br />
            <motion.span 
              className="gradient-text inline-block"
              animate={{ 
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              style={{ backgroundSize: "200% 200%" }}
            >
              Comes Alive
            </motion.span>
          </motion.h1>

          {/* Subheading */}
          <motion.p 
            className="text-lg sm:text-xl text-zinc-400 max-w-3xl mx-auto mb-6 leading-relaxed"
            variants={fadeInUp}
          >
            State-of-the-art rehearsal studios, professional recording services, and karaoke rooms.
            <br className="hidden sm:block" />
            <span className="text-violet-400">Your creative space awaits.</span>
          </motion.p>

          {/* Location */}
          <motion.div 
            className="flex flex-wrap items-center justify-center gap-2 mb-10"
            variants={fadeInUp}
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20">
              <MapPin className="w-4 h-4 text-amber-400" />
              <span className="text-amber-300 font-medium text-sm">Panmala, Dattawadi, Pune - 411 030</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-300 font-medium text-sm">8AM - 10PM Daily</span>
            </div>
          </motion.div>

          {/* Four Action Buttons */}
          <motion.div 
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto"
            variants={fadeInUp}
          >
            {/* New Booking */}
            <Link href="/booking/new">
              <button
                className="group relative bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold px-4 sm:px-6 py-4 rounded-2xl flex flex-col items-center gap-2 shadow-lg shadow-violet-500/20 w-full transition-all duration-200 active:scale-[0.98]"
              >
                <Plus className="w-6 h-6" />
                <span className="text-sm sm:text-base">New</span>
              </button>
            </Link>

            {/* Change Booking */}
            <button
              onClick={() => { setActionMode('change'); setStep('phone'); }}
              className="group bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold px-4 sm:px-6 py-4 rounded-2xl flex flex-col items-center gap-2 shadow-lg shadow-blue-500/20 w-full transition-all duration-200 active:scale-[0.98]"
            >
              <Edit3 className="w-6 h-6" />
              <span className="text-sm sm:text-base">Change</span>
            </button>

            {/* Cancel Booking */}
            <button
              onClick={() => { setActionMode('cancel'); setStep('phone'); }}
              className="group bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-semibold px-4 sm:px-6 py-4 rounded-2xl flex flex-col items-center gap-2 shadow-lg shadow-red-500/20 w-full transition-all duration-200 active:scale-[0.98]"
            >
              <X className="w-6 h-6" />
              <span className="text-sm sm:text-base">Cancel</span>
            </button>

            {/* View Booking */}
            <button
              onClick={() => { setActionMode('view'); setStep('phone'); }}
              className="group bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold px-4 sm:px-6 py-4 rounded-2xl flex flex-col items-center gap-2 shadow-lg shadow-emerald-500/20 w-full transition-all duration-200 active:scale-[0.98]"
            >
              <Eye className="w-6 h-6" />
              <span className="text-sm sm:text-base">View</span>
            </button>
          </motion.div>

          {/* Explore Studios link */}
          <motion.div 
            className="mt-6"
            variants={fadeInUp}
          >
            <Link href="/studios">
              <motion.button
                className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm"
                whileHover={{ x: 5 }}
              >
                Explore Studios <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Studios Preview Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-950/10 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <motion.span 
              className="inline-block px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-medium mb-4"
              whileInView={{ scale: [0.9, 1] }}
              viewport={{ once: true }}
            >
              Our Spaces
            </motion.span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Three Unique Studios
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Each studio is acoustically treated and equipped with professional gear for rehearsals, recording, and karaoke
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {studios.map((studio, index) => (
              <Link key={index} href={`/studios#${studio.id}`}>
                <motion.div
                  className="group relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 rounded-3xl p-8 overflow-hidden hover:border-violet-500/30 transition-all duration-500 h-full"
                  variants={fadeInUp}
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                >
                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-600/0 to-purple-600/0 group-hover:from-violet-600/5 group-hover:to-purple-600/5 transition-all duration-500" />
                  
                  <div className={`w-3 h-3 ${studio.color} rounded-full mb-4`} />
                  <h3 className="text-2xl font-bold text-white mb-1">{studio.name}</h3>
                  <p className="text-violet-400 text-sm font-medium mb-4">{studio.size}</p>
                  <div className="space-y-2 mb-6">
                    <p className="text-zinc-400 text-sm flex items-center gap-2">
                      <Users className="w-4 h-4" /> {studio.capacity}
                    </p>
                    <p className="text-amber-400 font-semibold">{studio.price}</p>
                  </div>
                  <motion.span 
                    className="inline-flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors"
                    whileHover={{ x: 5 }}
                  >
                    View Details <ArrowRight className="w-4 h-4" />
                  </motion.span>
                </motion.div>
              </Link>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <motion.span 
              className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-4"
            >
              What We Offer
            </motion.span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Complete Audio-Video Services
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              From rehearsals to professional recordings, we have everything you need under one roof
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {services.map((service, index) => (
              <motion.div
                key={index}
                className="group relative bg-gradient-to-br from-white/[0.05] to-transparent backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300"
                variants={fadeInUp}
                whileHover={{ y: -5, scale: 1.02, transition: { duration: 0.2 } }}
              >
                <motion.div 
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center text-white mb-5 shadow-lg ${service.shadowColor}`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  {service.icon}
                </motion.div>
                <h3 className="text-xl font-bold text-white mb-2">{service.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{service.description}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div 
            className="text-center mt-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Link href="/rate-card">
              <motion.button
                className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 font-medium transition-colors"
                whileHover={{ x: 5 }}
              >
                View Full Pricing <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-y border-white/5 bg-gradient-to-r from-violet-950/20 via-purple-950/20 to-violet-950/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {stats.map((stat, index) => (
              <motion.div 
                key={index} 
                className="text-center"
                variants={fadeInUp}
              >
                <motion.div 
                  className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 mx-auto mb-4"
                  whileHover={{ scale: 1.1, rotate: 10 }}
                >
                  {stat.icon}
                </motion.div>
                <motion.div 
                  className="text-3xl sm:text-4xl font-bold text-white mb-1"
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, type: "spring" }}
                >
                  {stat.value}
                </motion.div>
                <div className="text-zinc-500 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="relative rounded-[2rem] overflow-hidden"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-violet-700" />
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            
            {/* Floating elements */}
            <motion.div 
              className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <motion.div 
              className="absolute bottom-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-xl"
              animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.3, 0.5] }}
              transition={{ duration: 5, repeat: Infinity }}
            />
            
            <div className="relative z-10 p-10 sm:p-16 text-center">
              <motion.h2 
                className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                Ready to Make Some Noise?
              </motion.h2>
              <motion.p 
                className="text-white/80 text-lg max-w-2xl mx-auto mb-10"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                Book your session today. No advance payment required – just show up and create!
              </motion.p>
              <motion.div
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
              >
                <Link href="/booking/new">
                  <motion.button
                    className="bg-white text-violet-600 font-bold text-lg px-10 py-4 rounded-xl flex items-center gap-3 shadow-xl hover:shadow-2xl transition-shadow"
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Calendar className="w-5 h-5" />
                    Book Now
                  </motion.button>
                </Link>
                <Link href="/contact">
                  <motion.button
                    className="bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold text-lg px-10 py-4 rounded-xl flex items-center gap-3 hover:bg-white/20 transition-all"
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Contact Us
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Modal for Change/Cancel/View flows */}
      <AnimatePresence>
        {actionMode && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={resetModal}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Modal Content */}
            <motion.div
              className="relative w-full max-w-lg glass-strong rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
            >
              {/* Close Button */}
              <button
                onClick={resetModal}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Phone Input Step */}
              {step === 'phone' && (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      actionMode === 'change' ? 'bg-blue-500/20' : 
                      actionMode === 'cancel' ? 'bg-red-500/20' : 'bg-emerald-500/20'
                    }`}>
                      {actionMode === 'change' && <Edit3 className="w-6 h-6 text-blue-400" />}
                      {actionMode === 'cancel' && <X className="w-6 h-6 text-red-400" />}
                      {actionMode === 'view' && <Eye className="w-6 h-6 text-emerald-400" />}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {actionMode === 'change' && 'Change Booking'}
                        {actionMode === 'cancel' && 'Cancel Booking'}
                        {actionMode === 'view' && 'View Booking'}
                      </h3>
                      <p className="text-zinc-400 text-sm">Enter your phone number to find your bookings</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-zinc-400 mb-2.5">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                        <input
                          type="tel"
                          id="phone"
                          value={phoneNumber}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            setPhoneNumber(value);
                            setError('');
                          }}
                          onKeyDown={(e) => e.key === 'Enter' && handleFetchBookings()}
                          placeholder="Enter 10-digit number"
                          className="w-full py-3.5 pl-12 pr-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                          maxLength={10}
                          autoComplete="tel"
                          inputMode="numeric"
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                        <span className="text-red-400 text-sm">{error}</span>
                      </div>
                    )}

                    <motion.button
                      type="button"
                      onClick={handleFetchBookings}
                      disabled={isLoading || phoneNumber.replace(/\D/g, '').length !== 10}
                      className={`w-full py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                        actionMode === 'change' ? 'bg-blue-500 hover:bg-blue-600' :
                        actionMode === 'cancel' ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'
                      } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        <>
                          Find My Bookings
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </motion.button>
                  </div>
                </>
              )}

              {/* Booking Selection Step */}
              {step === 'select' && (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      actionMode === 'change' ? 'bg-blue-500/20' : 
                      actionMode === 'cancel' ? 'bg-red-500/20' : 'bg-emerald-500/20'
                    }`}>
                      <Calendar className={`w-6 h-6 ${
                        actionMode === 'change' ? 'text-blue-400' : 
                        actionMode === 'cancel' ? 'text-red-400' : 'text-emerald-400'
                      }`} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Select Booking</h3>
                      <p className="text-zinc-400 text-sm">
                        {actionMode === 'change' && 'Choose the booking you want to modify'}
                        {actionMode === 'cancel' && 'Choose the booking you want to cancel'}
                        {actionMode === 'view' && 'Choose the booking you want to view'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4 max-h-[50vh] overflow-y-auto">
                    {bookings.map((booking) => (
                      <motion.button
                        key={booking.id}
                        type="button"
                        onClick={() => handleSelectBooking(booking)}
                        className={`w-full p-4 rounded-xl border text-left transition-all ${
                          selectedBooking?.id === booking.id
                            ? actionMode === 'change' ? 'bg-blue-500/20 border-blue-500' :
                              actionMode === 'cancel' ? 'bg-red-500/20 border-red-500' : 'bg-emerald-500/20 border-emerald-500'
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                        }`}
                        whileTap={{ scale: 0.99 }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Mic className="w-4 h-4 text-violet-400" />
                              <span className="text-white font-medium">{booking.session_type}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="flex items-center gap-2 text-zinc-400">
                                <Building2 className="w-4 h-4" />
                                {booking.studio}
                              </div>
                              <div className="flex items-center gap-2 text-zinc-400">
                                <Calendar className="w-4 h-4" />
                                {formatDate(booking.date)}
                              </div>
                              <div className="flex items-center gap-2 text-zinc-400 col-span-2">
                                <Clock className="w-4 h-4" />
                                {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                              </div>
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedBooking?.id === booking.id
                              ? actionMode === 'change' ? 'bg-blue-500 border-blue-500' :
                                actionMode === 'cancel' ? 'bg-red-500 border-red-500' : 'bg-emerald-500 border-emerald-500'
                              : 'border-zinc-500'
                          }`}>
                            {selectedBooking?.id === booking.id && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  <button
                    onClick={() => { setStep('phone'); setSelectedBooking(null); setError(''); }}
                    className="w-full text-center text-zinc-500 hover:text-zinc-300 text-sm font-medium transition-colors"
                  >
                    ← Back to phone number
                  </button>
                </>
              )}

              {/* View Booking Details Step */}
              {step === 'view' && selectedBooking && (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                      <Eye className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Booking Details</h3>
                      <p className="text-zinc-400 text-sm">ID: {selectedBooking.id.slice(0, 8)}</p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center py-3 border-b border-white/10">
                      <div className="flex items-center gap-3">
                        <Mic className="w-5 h-5 text-zinc-500" />
                        <span className="text-zinc-400">Session Type</span>
                      </div>
                      <span className="text-white font-medium">{selectedBooking.session_type}</span>
                    </div>
                    {selectedBooking.session_details && (
                      <div className="flex justify-between items-center py-3 border-b border-white/10">
                        <div className="flex items-center gap-3">
                          <Users className="w-5 h-5 text-zinc-500" />
                          <span className="text-zinc-400">Details</span>
                        </div>
                        <span className="text-white font-medium">{selectedBooking.session_details}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-3 border-b border-white/10">
                      <div className="flex items-center gap-3">
                        <Building2 className="w-5 h-5 text-zinc-500" />
                        <span className="text-zinc-400">Studio</span>
                      </div>
                      <span className="text-white font-medium">{selectedBooking.studio}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-white/10">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-zinc-500" />
                        <span className="text-zinc-400">Date</span>
                      </div>
                      <span className="text-white font-medium">{formatDate(selectedBooking.date)}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-white/10">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-zinc-500" />
                        <span className="text-zinc-400">Time</span>
                      </div>
                      <span className="text-white font-medium">
                        {formatTime(selectedBooking.start_time)} - {formatTime(selectedBooking.end_time)}
                      </span>
                    </div>
                    {selectedBooking.total_amount && (
                      <div className="flex justify-between items-center py-3">
                        <div className="flex items-center gap-3">
                          <span className="text-zinc-400">Total Amount</span>
                        </div>
                        <span className="text-emerald-400 font-bold text-lg">
                          ₹{selectedBooking.total_amount.toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => { setStep('select'); setSelectedBooking(null); }}
                      className="flex-1 py-3 rounded-xl border border-white/10 text-zinc-400 font-medium hover:bg-white/5 transition-colors"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={resetModal}
                      className="flex-1 py-3 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </>
              )}

              {/* Cancel Confirmation Step */}
              {step === 'cancel-confirm' && selectedBooking && (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                      <X className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Confirm Cancellation</h3>
                      <p className="text-zinc-400 text-sm">This action requires verification</p>
                    </div>
                  </div>

                  {/* Booking Summary */}
                  <div className="bg-white/5 rounded-xl p-4 mb-6">
                    <div className="flex items-center gap-3 mb-3">
                      <Mic className="w-5 h-5 text-violet-400" />
                      <span className="text-white font-medium">{selectedBooking.session_type}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Building2 className="w-4 h-4" />
                        {selectedBooking.studio}
                      </div>
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Calendar className="w-4 h-4" />
                        {formatDate(selectedBooking.date)}
                      </div>
                      <div className="flex items-center gap-2 text-zinc-400 col-span-2">
                        <Clock className="w-4 h-4" />
                        {formatTime(selectedBooking.start_time)} - {formatTime(selectedBooking.end_time)}
                      </div>
                    </div>
                  </div>

                  <p className="text-zinc-400 text-sm mb-6 text-center">
                    Are you sure you want to cancel this booking? This action cannot be undone.
                  </p>

                  {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                      <span className="text-red-400 text-sm">{error}</span>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => { setStep('select'); setSelectedBooking(null); setError(''); }}
                      className="flex-1 py-3 rounded-xl border border-white/10 text-zinc-400 font-medium hover:bg-white/5 transition-colors"
                    >
                      Keep Booking
                    </button>
                    <motion.button
                      onClick={handleConfirmCancel}
                      disabled={isCancelling}
                      className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isCancelling ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <X className="w-4 h-4" />
                          Cancel Booking
                        </>
                      )}
                    </motion.button>
                  </div>
                </>
              )}

              {/* Success Step */}
              {step === 'success' && (
                <div className="text-center py-4">
                  <motion.div
                    className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 15 }}
                  >
                    <CheckCircle2 className="w-8 h-8 text-green-400" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-white mb-2">Booking Cancelled</h3>
                  <p className="text-zinc-400">Your booking has been successfully cancelled.</p>
                  <p className="text-zinc-500 text-sm mt-2">A cancellation SMS has been sent to your phone.</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
