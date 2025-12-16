'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import OTPVerification from '../components/OTPVerification';
import { checkAuthStatus } from '@/lib/authClient';

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

import {
  ArrowLeft,
  Mail,
  Search,
  Calendar,
  Clock,
  Building2,
  Users,
  Mic,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Edit3,
  Shield,
} from 'lucide-react';

interface Booking {
  id: string;
  studio: string;
  session_type: string;
  session_details: string;
  group_size: number;
  date: string;
  start_time: string;
  end_time: string;
  status: 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  rate_per_hour: number;
  total_amount: number;
  created_at: string;
  name?: string;
  email?: string;
  phone_number?: string;
}

const fadeInUp = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25 }
};

const statusConfig = {
  confirmed: { color: 'green', icon: CheckCircle2, label: 'Confirmed' },
  cancelled: { color: 'red', icon: XCircle, label: 'Cancelled' },
  completed: { color: 'violet', icon: CheckCircle2, label: 'Completed' },
  no_show: { color: 'zinc', icon: XCircle, label: 'No Show' },
};

export default function EditBookingPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState<{ name: string; email: string } | null>(null);
  const [error, setError] = useState('');
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [searched, setSearched] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [step, setStep] = useState<'search' | 'select' | 'verify' | 'confirm'>('search');
  const [isVerified, setIsVerified] = useState(false);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const status = await checkAuthStatus();
        if (status.authenticated && status.user && status.user.email) {
          setIsAuthenticated(true);
          setAuthenticatedUser({ name: status.user.name, email: status.user.email });
          setEmail(status.user.email);
          setIsVerified(true); // Skip OTP for trusted devices
          
          // Auto-fetch bookings for authenticated user
          await fetchBookingsForEmail(status.user.email);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    
    checkAuth();
  }, []);

  // Validate email format
  const isValidEmail = (emailStr: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr.trim());
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const fetchBookingsForEmail = async (emailToFetch: string) => {
    if (!isValidEmail(emailToFetch)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError('');
    setSearched(true);

    try {
      const response = await fetch(`/api/bookings/upcoming?email=${encodeURIComponent(emailToFetch.trim())}`);
      const data = await safeJsonParse(response);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch bookings');
      }

      const upcomingBookings = (data.bookings || []).filter((b: Booking) => 
        b.status === 'confirmed'
      );
      
      setBookings(upcomingBookings);
      
      if (upcomingBookings.length > 0) {
        setStep('select');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bookings');
      setBookings(null);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBookings = async () => {
    await fetchBookingsForEmail(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBookings();
  };

  const canEditBooking = (booking: Booking) => {
    const status = booking.status?.toLowerCase();
    if (status !== 'confirmed') {
      return { canEdit: false, reason: 'Invalid status' };
    }
    
    const bookingDateStr = booking.date;
    const bookingTimeStr = booking.start_time;
    
    const formattedTime = bookingTimeStr.includes(':') 
      ? (bookingTimeStr.split(':').length === 2 ? `${bookingTimeStr}:00` : bookingTimeStr)
      : '00:00:00';
    
    const bookingDateTime = new Date(`${bookingDateStr}T${formattedTime}`);
    const now = new Date();
    
    if (isNaN(bookingDateTime.getTime())) {
      return { canEdit: true, reason: '' };
    }
    
    if (bookingDateTime < now) {
      return { canEdit: false, reason: 'Past booking' };
    }
    
    // Check 24-hour restriction
    const hoursUntilBooking = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursUntilBooking < 24) {
      return { canEdit: false, reason: 'Within 24 hours' };
    }
    
    return { canEdit: true, reason: '' };
  };

  const handleSelectBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    // If already verified, go directly to confirm
    if (isVerified) {
      setStep('confirm');
    } else {
      setStep('verify');
    }
  };

  const handleVerified = () => {
    setIsVerified(true);
    setStep('confirm');
  };

  const confirmEdit = () => {
    if (!selectedBooking) return;
    
    // Store booking data in sessionStorage for the booking flow
    const editData = {
      editMode: true,
      originalBookingId: selectedBooking.id,
      sessionType: selectedBooking.session_type,
      sessionDetails: selectedBooking.session_details,
      studio: selectedBooking.studio,
      date: selectedBooking.date,
      start_time: selectedBooking.start_time,
      end_time: selectedBooking.end_time,
      phone_number: selectedBooking.phone_number || '',
      name: selectedBooking.name || '',
      email: email,
      total_amount: selectedBooking.total_amount,
      group_size: selectedBooking.group_size || 1,
      // Mark as already verified so the booking flow can skip OTP
      otpVerified: true,
    };
    
    sessionStorage.setItem('editBookingData', JSON.stringify(editData));
    
    // Navigate to booking flow
    router.push('/booking/new');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-900 to-black py-6 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link 
            href="/booking"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-4 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Booking
          </Link>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Edit3 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Edit Booking</h1>
              <p className="text-zinc-400 text-sm">Modify your existing studio booking</p>
            </div>
          </div>
        </motion.div>

        {/* OTP Verification Step */}
        {step === 'verify' && selectedBooking && (
          <OTPVerification
            phone={selectedBooking.phone_number || ''}
            email={email}
            onVerified={handleVerified}
            onCancel={() => setStep('select')}
            actionLabel="edit booking"
            accentColor="blue"
          />
        )}

        {/* Confirm Edit */}
        {step === 'confirm' && selectedBooking && (
          <motion.div 
            className="glass-strong rounded-2xl p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Edit3 className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Modify Booking</h3>
                <p className="text-zinc-400 text-sm">Change your booking details</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/5 mb-6">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Session</span>
                  <span className="text-white font-medium">{selectedBooking.session_type}</span>
                </div>
                {selectedBooking.session_details && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Details</span>
                    <span className="text-white">{selectedBooking.session_details}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-zinc-400">Studio</span>
                  <span className="text-white">{selectedBooking.studio}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Date</span>
                  <span className="text-white">{formatDate(selectedBooking.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Time</span>
                  <span className="text-white">
                    {formatTime(selectedBooking.start_time)} - {formatTime(selectedBooking.end_time)}
                  </span>
                </div>
                <div className="flex justify-between pt-3 border-t border-white/10">
                  <span className="text-zinc-400">Total Amount</span>
                  <span className="text-white font-bold">₹{selectedBooking.total_amount?.toLocaleString('en-IN') || 0}</span>
                </div>
              </div>
            </div>

            <p className="text-zinc-400 text-sm mb-6">
              You&apos;ll be redirected to the booking flow to make changes. Your original booking will be cancelled when you confirm the new booking.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <motion.button
                onClick={() => setStep('select')}
                className="flex-1 btn-secondary py-3"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Go Back
              </motion.button>
              <motion.button
                onClick={confirmEdit}
                className="flex-1 btn-accent py-3 flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Edit3 className="w-4 h-4" />
                Modify Booking
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Select Booking */}
        {step === 'select' && bookings && bookings.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="mb-4">
              <button
                onClick={() => setStep('search')}
                className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Change Email
              </button>
            </div>
            
            <h3 className="text-lg font-medium text-white mb-4">Select a booking to modify</h3>
            
            <div className="space-y-4">
              {bookings.map((booking, index) => {
                const config = statusConfig[booking.status] || statusConfig.confirmed;
                const StatusIcon = config.icon;
                const editCheck = canEditBooking(booking);

                // Skip past or invalid bookings entirely
                if (editCheck.reason === 'Invalid status' || editCheck.reason === 'Past booking') return null;

                const isWithin24Hours = editCheck.reason === 'Within 24 hours';

                return (
                  <motion.div
                    key={booking.id}
                    className={`w-full glass-strong rounded-2xl p-4 overflow-hidden text-left transition-all ${
                      isWithin24Hours 
                        ? 'opacity-60 cursor-not-allowed' 
                        : 'hover:border-blue-500/30 cursor-pointer'
                    }`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => editCheck.canEdit && handleSelectBooking(booking)}
                  >
                    {/* 24 Hour Warning */}
                    {isWithin24Hours && (
                      <div className="mb-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <p className="text-amber-400 text-xs flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5" />
                          Cannot modify within 24 hours of session
                        </p>
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-full bg-${config.color}-500/20`}>
                        <StatusIcon className={`w-3.5 h-3.5 text-${config.color}-400`} />
                        <span className={`text-xs font-medium text-${config.color}-400`}>{config.label}</span>
                      </div>
                      <span className="text-xs text-zinc-500">ID: {booking.id.slice(0, 8)}</span>
                    </div>

                    {/* Booking Details */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Mic className="w-4 h-4 text-violet-400" />
                        <span className="text-white font-medium">{booking.session_type}</span>
                      </div>
                      {booking.session_details && (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-violet-400" />
                          <span className="text-zinc-300 text-sm">{booking.session_details}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-violet-400" />
                        <span className="text-zinc-300 text-sm">{booking.studio}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-violet-400" />
                        <span className="text-zinc-300 text-sm">{formatDate(booking.date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-violet-400" />
                        <span className="text-zinc-300 text-sm">
                          {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                        </span>
                      </div>
                    </div>

                    {/* Total */}
                    <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                      <span className="text-zinc-400 text-sm">Total Amount</span>
                      <span className="text-white font-bold">₹{booking.total_amount?.toLocaleString('en-IN') || 0}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Email Search - Initial Step */}
        {step === 'search' && (
          <>
            <motion.div 
              className="glass-strong rounded-2xl p-4 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <p className="text-zinc-400 text-sm mb-4">Enter your email address to find your bookings</p>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="Enter your email address"
                    className="w-full py-3 pl-12 pr-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                  />
                </div>
                <motion.button
                  type="submit"
                  disabled={isLoading || !isValidEmail(email)}
                  className="w-full btn-accent py-3 px-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      Search Bookings
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* No Bookings Found */}
            {searched && bookings && bookings.length === 0 && (
              <motion.div 
                className="glass-strong rounded-2xl p-8 text-center"
                {...fadeInUp}
              >
                <Calendar className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-white mb-1">No Bookings Found</h3>
                <p className="text-zinc-400 text-sm">No upcoming bookings found for this email address.</p>
                <Link 
                  href="/booking/new"
                  className="inline-block mt-4 btn-accent py-2 px-6 text-sm"
                >
                  Make a Booking
                </Link>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
