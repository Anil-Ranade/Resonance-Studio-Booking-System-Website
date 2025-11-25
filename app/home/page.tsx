"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Mic, 
  Music, 
  Radio, 
  Video, 
  MapPin, 
  Calendar, 
  ArrowRight, 
  ChevronDown,
  Headphones,
  Award,
  Clock,
  Users,
  Play,
  Star,
  Sparkles,
  Guitar,
  Speaker,
  MonitorPlay
} from "lucide-react";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" }
};

const fadeInLeft = {
  initial: { opacity: 0, x: -30 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.6, ease: "easeOut" }
};

const fadeInRight = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.6, ease: "easeOut" }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const floatingAnimation = {
  y: [0, -10, 0],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut" as const
  }
};

export default function HomePage() {
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
    { value: "8AM-10PM", label: "Daily Hours", icon: <Clock className="w-5 h-5" /> },
  ];

  const testimonials = [
    { name: "Rahul M.", text: "Best rehearsal space in Pune! The equipment is top-notch.", rating: 5 },
    { name: "Priya S.", text: "Amazing karaoke experience. Will definitely come back!", rating: 5 },
    { name: "Band Insignia", text: "Our go-to studio for practice sessions. Highly recommend!", rating: 5 },
  ];

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-grid opacity-20" />
        
        {/* Floating Orbs */}
        <motion.div 
          className="absolute top-20 left-10 w-72 h-72 bg-violet-600/30 rounded-full blur-[100px]"
          animate={{ 
            scale: [1, 1.3, 1],
            x: [0, 50, 0],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-20 right-10 w-96 h-96 bg-purple-600/25 rounded-full blur-[120px]"
          animate={{ 
            scale: [1.2, 1, 1.2],
            x: [0, -30, 0],
            opacity: [0.4, 0.2, 0.4]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-violet-600/10 to-purple-600/10 rounded-full blur-[150px]"
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        />

        {/* Floating Music Notes */}
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
            className="flex items-center justify-center gap-2 mb-10"
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

          {/* CTA Buttons */}
          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            variants={fadeInUp}
          >
            <Link href="/booking">
              <motion.button
                className="group relative bg-gradient-to-r from-violet-600 to-purple-600 text-white text-lg font-semibold px-10 py-4 rounded-2xl flex items-center gap-3 shadow-xl shadow-violet-500/25 overflow-hidden"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Calendar className="w-5 h-5 relative z-10" />
                <span className="relative z-10">Book Your Session</span>
                <motion.span
                  className="relative z-10"
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="w-5 h-5" />
                </motion.span>
              </motion.button>
            </Link>
            <Link href="/studios">
              <motion.button
                className="group bg-white/5 backdrop-blur-sm border border-white/10 text-white text-lg font-semibold px-10 py-4 rounded-2xl flex items-center gap-3 hover:bg-white/10 hover:border-white/20 transition-all"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Play className="w-5 h-5 text-violet-400" />
                Explore Studios
              </motion.button>
            </Link>
          </motion.div>

          {/* Quick Stats under CTA */}
          <motion.div 
            className="flex items-center justify-center gap-8 mt-12 pt-8 border-t border-white/5"
            variants={fadeInUp}
          >
            <div className="text-center">
              <p className="text-2xl font-bold text-white">₹200</p>
              <p className="text-xs text-zinc-500">Starting/hour</p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center">
              <p className="text-2xl font-bold text-white">3</p>
              <p className="text-xs text-zinc-500">Studios</p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center">
              <p className="text-2xl font-bold text-white">30</p>
              <p className="text-xs text-zinc-500">Max Capacity</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-xs text-zinc-500">Scroll to explore</span>
          <ChevronDown className="w-5 h-5 text-zinc-500" />
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

      {/* Testimonials Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <motion.span 
              className="inline-block px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium mb-4"
            >
              Reviews
            </motion.span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              What Our Customers Say
            </h2>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl p-6"
                variants={fadeInUp}
                whileHover={{ y: -5 }}
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-zinc-300 mb-4 leading-relaxed">&ldquo;{testimonial.text}&rdquo;</p>
                <p className="text-violet-400 font-medium text-sm">{testimonial.name}</p>
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
                <Link href="/booking">
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
    </div>
  );
}
