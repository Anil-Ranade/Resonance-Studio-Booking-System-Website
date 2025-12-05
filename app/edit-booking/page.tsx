'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

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
  Edit3,
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
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  rate_per_hour: number;
  total_amount: number;
  created_at: string;
  name?: string;
}

const fadeInUp = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25 }
};

const statusConfig = {
  pending: { color: 'amber', icon: Clock, label: 'Pending' },
  confirmed: { color: 'green', icon: CheckCircle2, label: 'Confirmed' },
  cancelled: { color: 'red', icon: XCircle, label: 'Cancelled' },
  completed: { color: 'violet', icon: CheckCircle2, label: 'Completed' },
  no_show: { color: 'zinc', icon: XCircle, label: 'No Show' },
};

export default function EditBookingPage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [searched, setSearched] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [step, setStep] = useState<'search' | 'select' | 'confirm'>('search');

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setPhoneNumber(value);
  };

  const fetchBookings = async () => {
    if (phoneNumber.replace(/\D/g, '').length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setIsLoading(true);
    setError('');
    setSearched(true);

    try {
      const response = await fetch(`/api/bookings/upcoming?phone=${phoneNumber}`);
      const data = await safeJsonParse(response);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch bookings');
      }

      const upcomingBookings = (data.bookings || []).filter((b: Booking) => 
        b.status === 'pending' || b.status === 'confirmed'
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBookings();
  };

  const canEditBooking = (booking: Booking) => {
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

  const handleSelectBooking = (booking: Booking) => {
    setSelectedBooking(booking);
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
      phone_number: phoneNumber,
      name: selectedBooking.name || '',
      total_amount: selectedBooking.total_amount,
      group_size: selectedBooking.group_size || 1,
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
    return time.slice(0, 5);
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
                Change Phone Number
              </button>
            </div>
            
            <h3 className="text-lg font-medium text-white mb-4">Select a booking to modify</h3>
            
            <div className="space-y-4">
              {bookings.map((booking, index) => {
                const config = statusConfig[booking.status] || statusConfig.pending;
                const StatusIcon = config.icon;
                const canEdit = canEditBooking(booking);

                if (!canEdit) return null;

                return (
                  <motion.button
                    key={booking.id}
                    onClick={() => handleSelectBooking(booking)}
                    className="w-full glass-strong rounded-2xl p-4 overflow-hidden text-left hover:border-blue-500/30 transition-all"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
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
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Phone Search - Initial Step */}
        {step === 'search' && (
          <>
            <motion.div 
              className="glass-strong rounded-2xl p-4 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <p className="text-zinc-400 text-sm mb-4">Enter your phone number to find your bookings</p>
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
                <p className="text-zinc-400 text-sm">No upcoming bookings found for this phone number.</p>
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
