"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

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
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  CalendarX,
  X,
  Check,
  Mic,
  Users,
} from "lucide-react";

interface Booking {
  id: string;
  studio: string;
  session_type: string;
  session_details?: string;
  group_size: number;
  date: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  rate_per_hour: number;
  total_amount: number;
  created_at: string;
}

interface CancelModalState {
  isOpen: boolean;
  booking: Booking | null;
  step: 'confirm' | 'success';
  reason: string;
  isLoading: boolean;
  error: string;
}

const statusConfig: Record<string, { color: string; icon: typeof CheckCircle2; label: string }> = {
  pending: { color: 'amber', icon: Clock, label: 'Pending' },
  confirmed: { color: 'green', icon: CheckCircle2, label: 'Confirmed' },
  cancelled: { color: 'red', icon: XCircle, label: 'Cancelled' },
  completed: { color: 'violet', icon: CheckCircle2, label: 'Completed' },
  no_show: { color: 'zinc', icon: XCircle, label: 'No Show' },
};

export default function ViewBookingsPage() {
  const [phone, setPhone] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [cancelModal, setCancelModal] = useState<CancelModalState>({
    isOpen: false,
    booking: null,
    step: 'confirm',
    reason: '',
    isLoading: false,
    error: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBookings([]);
    setSearched(false);

    // Normalize to digits only
    const normalized = phone.replace(/\D/g, "");

    // Validate exactly 10 digits
    if (normalized.length !== 10) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }

    setLoading(true);

    try {
      // Fetch only upcoming bookings
      const response = await fetch(`/api/bookings/upcoming?phone=${normalized}`);
      const data = await safeJsonParse(response);

      if (!response.ok) {
        setError(data.error || "Failed to fetch bookings");
        return;
      }

      setBookings(data.bookings || []);
      setSearched(true);
    } catch (err) {
      setError("An error occurred while fetching bookings");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5); // Returns "HH:MM" format (24-hour)
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
    setCancelModal({
      isOpen: false,
      booking: null,
      step: 'confirm',
      reason: '',
      isLoading: false,
      error: '',
    });
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
          phone: phone.replace(/\D/g, ''),
          reason: cancelModal.reason || 'Cancelled by user',
        }),
      });

      const data = await safeJsonParse(response);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel booking');
      }

      // Update bookings list
      setBookings(prev => 
        prev.map(b => 
          b.id === cancelModal.booking?.id 
            ? { ...b, status: 'cancelled' as const } 
            : b
        )
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
    const status = booking.status?.toLowerCase();
    if (status !== 'pending' && status !== 'confirmed') {
      return false;
    }
    
    const bookingDateStr = booking.date;
    const bookingTimeStr = booking.start_time;
    const formattedTime = bookingTimeStr.includes(':') 
      ? (bookingTimeStr.split(':').length === 2 ? `${bookingTimeStr}:00` : bookingTimeStr)
      : '00:00:00';
    
    const bookingDateTime = new Date(`${bookingDateStr}T${formattedTime}`);
    const now = new Date();
    
    if (isNaN(bookingDateTime.getTime())) {
      return true;
    }
    
    return bookingDateTime >= now;
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
          
          <h1 className="text-2xl font-bold text-white">View Bookings</h1>
          <p className="text-zinc-400 text-sm mt-1">Check your upcoming bookings</p>
        </motion.div>

        {/* Phone Search */}
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
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter your phone number"
                  className="w-full py-3 pl-12 pr-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                  maxLength={10}
                  inputMode="numeric"
                />
              </div>
              <motion.button
                type="submit"
                disabled={loading || phone.length !== 10}
                className="btn-accent py-3 px-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
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
                  const config = statusConfig[booking.status] || statusConfig.pending;
                  const StatusIcon = config.icon;
                  const canCancel = canCancelBooking(booking);

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

                      {/* Cancel Button */}
                      {canCancel && (
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <motion.button
                            onClick={() => openCancelModal(booking)}
                            className="w-full py-2 px-4 rounded-lg bg-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <XCircle className="w-4 h-4" />
                            Cancel Booking
                          </motion.button>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <motion.div 
                className="glass-strong rounded-2xl p-8 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <CalendarX className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-white mb-1">No Upcoming Bookings</h3>
                <p className="text-zinc-400 text-sm">No upcoming bookings found for this phone number.</p>
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
      </div>
    </div>
  );
}
