'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
  Phone,
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
  X,
  Check,
  Edit3,
  Shield,
  Gift,
  Award,
  TrendingUp,
} from 'lucide-react';

interface LoyaltyStatus {
  hours: number;
  target: number;
  eligible: boolean;
  window_start: string | null;
  window_end: string | null;
  reward_amount?: number;
  first_booking_bonus?: boolean;
}

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
}

interface CancelModalState {
  isOpen: boolean;
  booking: Booking | null;
  step: 'confirm' | 'success';
  reason: string;
  isLoading: boolean;
  error: string;
}

interface EditModalState {
  isOpen: boolean;
  booking: Booking | null;
  step: 'confirm' | 'success';
  isLoading: boolean;
  error: string;
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

export default function MyBookingsPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState<{ phone: string; name: string } | null>(null);
  const [error, setError] = useState('');
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [searched, setSearched] = useState(false);
  const [cancelModal, setCancelModal] = useState<CancelModalState>({
    isOpen: false,
    booking: null,
    step: 'confirm',
    reason: '',
    isLoading: false,
    error: '',
  });
  const [editModal, setEditModal] = useState<EditModalState>({
    isOpen: false,
    booking: null,
    step: 'confirm',
    isLoading: false,
    error: '',
  });
  const [loyaltyStatus, setLoyaltyStatus] = useState<LoyaltyStatus | null>(null);

  const router = useRouter();

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const status = await checkAuthStatus();
        if (status.authenticated && status.user) {
          setIsAuthenticated(true);
          setAuthenticatedUser({ phone: status.user.phone, name: status.user.name });
          setPhoneNumber(status.user.phone);
          
          // Auto-fetch bookings and loyalty for authenticated user
          await Promise.all([
            fetchBookingsForPhone(status.user.phone),
            fetchLoyaltyStatus(status.user.phone)
          ]);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    
    checkAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchBookingsForPhone = async (phone: string) => {
    if (phone.replace(/\D/g, '').length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setIsLoading(true);
    setError('');
    setSearched(true);

    if (phone) {
        fetchLoyaltyStatus(phone);
    }

    try {
      const response = await fetch(`/api/bookings?phone=${phone}`);
      const data = await safeJsonParse(response);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch bookings');
      }

      setBookings(data.bookings || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bookings');
      setBookings(null);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLoyaltyStatus = async (phone: string) => {
    try {
      const response = await fetch(`/api/loyalty/status?phone=${phone}`);
      const data = await safeJsonParse(response);
      if (response.ok) {
        setLoyaltyStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch loyalty status:', err);
    }
  };



  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setPhoneNumber(value);
  };

  const fetchBookings = async () => {
    await fetchBookingsForPhone(phoneNumber);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBookings();
  };

  const openCancelModal = (booking: Booking) => {
    setCancelModal({
      isOpen: true,
      booking,
      step: 'confirm',
      reason: '',
      isLoading: false,
      error: '',
    });
  };

  const closeCancelModal = () => {
    setCancelModal(prev => ({
      ...prev,
      isOpen: false,
      booking: null,
      step: 'confirm',
      reason: '',
      isLoading: false,
      error: '',
    }));
  };

  const confirmCancellation = async () => {
    if (!cancelModal.booking) {
      setCancelModal(prev => ({ ...prev, error: 'No booking selected' }));
      return;
    }

    setCancelModal(prev => ({ ...prev, isLoading: true, error: '' }));

    try {
      const response = await fetch('/api/bookings/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: cancelModal.booking.id,
          phone: phoneNumber,
          reason: cancelModal.reason || 'Cancelled by user',
        }),
      });

      const data = await safeJsonParse(response);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel booking');
      }

      // Update bookings list - update the cancelled booking's status
      setBookings(prev => 
        prev?.map(b => 
          b.id === cancelModal.booking?.id 
            ? { ...b, status: 'cancelled' as const } 
            : b
        ) || null
      );

      setCancelModal(prev => ({
        ...prev,
        step: 'success',
        isLoading: false,
      }));

      // Auto close after 2 seconds
      setTimeout(() => {
        closeCancelModal();
      }, 2000);
    } catch (err) {
      setCancelModal(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to cancel booking',
      }));
    }
  };

  const canCancelBooking = (booking: Booking) => {
    // Only allow cancellation for confirmed bookings
    const status = booking.status?.toLowerCase();
    if (status !== 'confirmed') {
      return false;
    }
    
    // Parse the booking date and time
    const bookingDateStr = booking.date;
    const bookingTimeStr = booking.start_time;
    
    // Ensure time has proper format (HH:MM:SS)
    const formattedTime = bookingTimeStr.includes(':') 
      ? (bookingTimeStr.split(':').length === 2 ? `${bookingTimeStr}:00` : bookingTimeStr)
      : '00:00:00';
    
    // Create date from ISO string format
    const bookingDateTime = new Date(`${bookingDateStr}T${formattedTime}`);
    const now = new Date();
    
    // Check if date parsing was successful
    if (isNaN(bookingDateTime.getTime())) {
      return true;
    }
    
    // Allow cancellation if booking is in the future
    return bookingDateTime >= now;
  };

  // Edit booking functions
  const openEditModal = (booking: Booking) => {
    setEditModal({
      isOpen: true,
      booking,
      step: 'confirm',
      isLoading: false,
      error: '',
    });
  };

  const closeEditModal = () => {
    setEditModal(prev => ({
      ...prev,
      isOpen: false,
      booking: null,
      step: 'confirm',
      isLoading: false,
      error: '',
    }));
  };

  const confirmEdit = () => {
    if (!editModal.booking) return;
    
    // Store booking data in sessionStorage for the booking flow
    const editData = {
      editMode: true,
      originalBookingId: editModal.booking.id,
      sessionType: editModal.booking.session_type,
      sessionDetails: editModal.booking.session_details,
      studio: editModal.booking.studio,
      date: editModal.booking.date,
      start_time: editModal.booking.start_time,
      end_time: editModal.booking.end_time,
      phone_number: phoneNumber,
      name: editModal.booking.name || '',
      total_amount: editModal.booking.total_amount,
      group_size: editModal.booking.group_size || 1,
    };
    
    sessionStorage.setItem('editBookingData', JSON.stringify(editData));
    
    // Navigate to booking flow
    router.push('/booking/new');
  };

  const canEditBooking = canCancelBooking; // Same rules as cancellation

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
            href="/"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-4 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          
          <h1 className="text-2xl font-bold text-white">My Bookings</h1>
          <p className="text-zinc-400 text-sm mt-1">View and manage your studio bookings</p>
        </motion.div>

        {/* Loading Auth State */}
        {isCheckingAuth && (
          <motion.div 
            className="glass-strong rounded-2xl p-6 mb-6 flex items-center justify-center gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
            <span className="text-zinc-300">Checking authentication...</span>
          </motion.div>
        )}

        {/* Authenticated User Banner */}
        {!isCheckingAuth && isAuthenticated && authenticatedUser && (
          <div className="space-y-6 mb-6">
            <motion.div 
              className="glass-strong rounded-2xl p-4 border border-green-500/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Welcome back{authenticatedUser.name ? `, ${authenticatedUser.name}` : ''}!</p>
                  <p className="text-zinc-400 text-sm">Your bookings are loaded automatically</p>
                </div>
              </div>
            </motion.div>

            {/* Loyalty Progress */}
            {loyaltyStatus && (
              <motion.div 
                className="glass-strong rounded-2xl p-6 relative overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-amber-400" />
                      <h3 className="text-lg font-bold text-white">Loyalty Status</h3>
                    </div>
                    {loyaltyStatus.eligible && (
                      <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/20 animate-pulse">
                        Reward Available!
                      </span>
                    )}
                  </div>
                  
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-zinc-400">Progress</span>
                    <span className="text-white font-medium">
                      {loyaltyStatus.hours} / {loyaltyStatus.target} hours
                    </span>
                  </div>

                  <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-4">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((loyaltyStatus.hours / loyaltyStatus.target) * 100, 100)}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>

                  <div className="flex items-start gap-2 text-xs text-zinc-400">
                    <TrendingUp className="w-3.5 h-3.5 mt-0.5 text-zinc-500" />
                    <p>
                      {loyaltyStatus.eligible 
                        ? `Congratulations! You've unlocked a ₹${(loyaltyStatus.reward_amount || 2000).toLocaleString('en-IN')} discount on your next booking.`
                        : `Complete ${loyaltyStatus.target - loyaltyStatus.hours} more hours to unlock a ₹${(loyaltyStatus.reward_amount || 2000).toLocaleString('en-IN')} reward.`
                      }
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Phone Search - Only show if not authenticated */}
        {!isCheckingAuth && !isAuthenticated && (
          <>
            <motion.div 
              className="glass-strong rounded-2xl p-4 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <form onSubmit={handleSubmit}>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                      placeholder="Enter your phone number"
                      className="w-full py-3 pl-12 pr-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                      maxLength={10}
                      inputMode="numeric"
                    />
                  </div>
                  <motion.button
                    type="submit"
                    disabled={isLoading || phoneNumber.length !== 10}
                    className="btn-accent py-3 px-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                        Search
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>

            {/* Loyalty Progress for Non-Authenticated Users (shown after search) */}
            {searched && loyaltyStatus && (
              <motion.div 
                className="glass-strong rounded-2xl p-6 mb-6 relative overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-amber-400" />
                      <h3 className="text-lg font-bold text-white">Loyalty Status</h3>
                    </div>
                    {loyaltyStatus.eligible && (
                      <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/20 animate-pulse">
                        Reward Available!
                      </span>
                    )}
                  </div>
                  
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-zinc-400">Progress</span>
                    <span className="text-white font-medium">
                      {loyaltyStatus.hours} / {loyaltyStatus.target} hours
                    </span>
                  </div>

                  <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-4">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((loyaltyStatus.hours / loyaltyStatus.target) * 100, 100)}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>

                  <div className="flex items-start gap-2 text-xs text-zinc-400">
                    <TrendingUp className="w-3.5 h-3.5 mt-0.5 text-zinc-500" />
                    <p>
                      {loyaltyStatus.eligible 
                        ? `Congratulations! You've unlocked a ₹${(loyaltyStatus.reward_amount || 2000).toLocaleString('en-IN')} discount on your next booking.`
                        : `Complete ${loyaltyStatus.target - loyaltyStatus.hours} more hours to unlock a ₹${(loyaltyStatus.reward_amount || 2000).toLocaleString('en-IN')} reward.`
                      }
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}



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

        {/* Bookings List */}
        {searched && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {bookings && bookings.length > 0 ? (
              <div className="space-y-4">
                {bookings.map((booking, index) => {
                  const config = statusConfig[booking.status] || statusConfig.confirmed;
                  const StatusIcon = config.icon;
                  const canCancel = canCancelBooking(booking);
                  const canEdit = canEditBooking(booking);

                  return (
                    <motion.div
                      key={booking.id}
                      className="glass-strong rounded-2xl p-4 overflow-hidden"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
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

                      {/* Actions */}
                      {(canEdit || canCancel) && (
                        <div className="mt-3 pt-3 border-t border-white/10 flex gap-2">
                          {canEdit && (
                            <motion.button
                              onClick={() => openEditModal(booking)}
                              className="flex-1 py-2 px-4 rounded-lg bg-blue-500/20 text-blue-400 text-sm font-medium hover:bg-blue-500/30 transition-colors flex items-center justify-center gap-2"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Edit3 className="w-4 h-4" />
                              Modify
                            </motion.button>
                          )}
                          {canCancel && (
                            <motion.button
                              onClick={() => openCancelModal(booking)}
                              className="flex-1 py-2 px-4 rounded-lg bg-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <XCircle className="w-4 h-4" />
                              Cancel
                            </motion.button>
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <motion.div 
                className="glass-strong rounded-2xl p-8 text-center"
                {...fadeInUp}
              >
                <Calendar className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-white mb-1">No Bookings Found</h3>
                <p className="text-zinc-400 text-sm">No bookings found for this phone number.</p>
                <Link 
                  href="/booking/new"
                  className="inline-block mt-4 btn-accent py-2 px-6 text-sm"
                >
                  Make a Booking
                </Link>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Cancel Modal */}
        <AnimatePresence>
          {cancelModal.isOpen && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeCancelModal}
            >
              <motion.div
                className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-md"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close Button */}
                <button
                  onClick={closeCancelModal}
                  className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                {cancelModal.step === 'confirm' && (
                  <>
                    <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
                      <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                        <XCircle className="w-6 h-6 text-red-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Cancel Booking</h3>
                        <p className="text-zinc-400 text-sm">This action cannot be undone</p>
                      </div>
                    </div>

                    {cancelModal.booking && (
                      <div className="p-4 rounded-xl bg-white/5 mb-6">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Session</span>
                            <span className="text-white">{cancelModal.booking.session_type}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Studio</span>
                            <span className="text-white">{cancelModal.booking.studio}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Date</span>
                            <span className="text-white">{formatDate(cancelModal.booking.date)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Time</span>
                            <span className="text-white">
                              {formatTime(cancelModal.booking.start_time)} - {formatTime(cancelModal.booking.end_time)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {cancelModal.error && (
                      <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-400" />
                          <p className="text-red-400 text-sm">{cancelModal.error}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <motion.button
                        onClick={closeCancelModal}
                        className="flex-1 btn-secondary py-3"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Keep Booking
                      </motion.button>
                      <motion.button
                        onClick={confirmCancellation}
                        disabled={cancelModal.isLoading}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {cancelModal.isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Cancelling...
                          </>
                        ) : (
                          'Cancel Booking'
                        )}
                      </motion.button>
                    </div>
                  </>
                )}

                {cancelModal.step === 'success' && (
                  <div className="text-center py-6">
                    <motion.div 
                      className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200 }}
                    >
                      <Check className="w-8 h-8 text-green-400" />
                    </motion.div>
                    <h3 className="text-xl font-bold text-white mb-2">Booking Cancelled</h3>
                    <p className="text-zinc-400 text-sm">Your booking has been successfully cancelled.</p>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edit Modal */}
        <AnimatePresence>
          {editModal.isOpen && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeEditModal}
            >
              <motion.div
                className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-md"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close Button */}
                <button
                  onClick={closeEditModal}
                  className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                {editModal.step === 'confirm' && (
                  <>
                    <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                        <Edit3 className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Modify Booking</h3>
                        <p className="text-zinc-400 text-sm">Change your booking details</p>
                      </div>
                    </div>

                    {editModal.booking && (
                      <div className="p-4 rounded-xl bg-white/5 mb-6">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Session</span>
                            <span className="text-white">{editModal.booking.session_type}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Studio</span>
                            <span className="text-white">{editModal.booking.studio}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Date</span>
                            <span className="text-white">{formatDate(editModal.booking.date)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Time</span>
                            <span className="text-white">
                              {formatTime(editModal.booking.start_time)} - {formatTime(editModal.booking.end_time)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <p className="text-zinc-400 text-sm mb-6">
                      You&apos;ll be redirected to the booking flow to make changes. Your original booking will be cancelled when you confirm the new booking.
                    </p>

                    {editModal.error && (
                      <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-400" />
                          <p className="text-red-400 text-sm">{editModal.error}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <motion.button
                        onClick={closeEditModal}
                        className="flex-1 btn-secondary py-3"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        onClick={confirmEdit}
                        disabled={editModal.isLoading}
                        className="flex-1 btn-accent py-3 disabled:opacity-50 flex items-center justify-center gap-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {editModal.isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <Edit3 className="w-4 h-4" />
                            Modify Booking
                          </>
                        )}
                      </motion.button>
                    </div>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
