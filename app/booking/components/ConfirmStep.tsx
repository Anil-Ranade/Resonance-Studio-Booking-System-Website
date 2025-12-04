'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Calendar, Clock, Building2, Loader2, AlertCircle, Home, CalendarPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useBooking } from '../contexts/BookingContext';

export default function ConfirmStep() {
  const router = useRouter();
  const { draft, resetDraft } = useBooking();
  const [isBooking, setIsBooking] = useState(true);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [error, setError] = useState('');
  const [bookingId, setBookingId] = useState('');

  // Create booking on mount
  useEffect(() => {
    createBooking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createBooking = async () => {
    setIsBooking(true);
    setError('');

    try {
      // Get session details string
      let sessionDetails: string = draft.sessionType || '';
      
      if (draft.sessionType === 'Karaoke' && draft.karaokeOption) {
        const labels: Record<string, string> = {
          '1_5': '1–5 participants',
          '6_10': '6–10 participants',
          '11_20': '11–20 participants',
          '21_30': '21–30 participants',
        };
        sessionDetails = labels[draft.karaokeOption] || draft.sessionType || '';
      } else if (draft.sessionType === 'Live with musicians' && draft.liveOption) {
        const labels: Record<string, string> = {
          '1_2': '1–2 musicians',
          '3_4': '3–4 musicians',
          '5': '5 musicians',
          '6_8': '6–8 musicians',
          '9_12': '9–12 musicians',
        };
        sessionDetails = labels[draft.liveOption] || draft.sessionType || '';
      } else if (draft.sessionType === 'Band' && draft.bandEquipment.length > 0) {
        const equipmentLabels: Record<string, string> = {
          'drum': 'Drums',
          'amps': 'Amps',
          'guitars': 'Guitars',
          'keyboard': 'Keyboard',
        };
        sessionDetails = draft.bandEquipment.map(e => equipmentLabels[e]).join(', ');
      } else if (draft.sessionType === 'Recording' && draft.recordingOption) {
        const labels: Record<string, string> = {
          'audio_recording': 'Audio Recording',
          'video_recording': 'Video Recording (4K)',
          'chroma_key': 'Chroma Key (Green Screen)',
        };
        sessionDetails = labels[draft.recordingOption] || draft.sessionType || '';
      }

      // Use PUT for modifications, POST for new bookings
      const isModification = draft.isEditMode && draft.originalBookingId;
      
      const response = await fetch('/api/book', {
        method: isModification ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: draft.phone,
          name: draft.name,
          email: draft.email,
          studio: draft.studio,
          session_type: draft.sessionType,
          session_details: sessionDetails,
          date: draft.date,
          start_time: draft.selectedSlot?.start,
          end_time: draft.selectedSlot?.end,
          rate_per_hour: draft.ratePerHour,
          original_booking_id: isModification ? draft.originalBookingId : undefined,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // For modifications, use the original booking ID; for new bookings, use the new ID
        setBookingId(isModification ? draft.originalBookingId.slice(0, 8) : (data.booking?.id?.slice(0, 8) || ''));
        setBookingComplete(true);
      } else {
        setError(data.error || (isModification ? 'Failed to update booking' : 'Failed to create booking'));
      }
    } catch (err) {
      setError(draft.isEditMode ? 'Failed to update booking. Please try again.' : 'Failed to create booking. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  const handleGoHome = () => {
    resetDraft();
    router.push('/');
  };

  const handleNewBooking = () => {
    resetDraft();
    router.push('/booking/new');
  };

  // Format time for display in 24-hour format
  const formatTime = (time: string) => {
    return time.slice(0, 5); // Returns "HH:MM" format
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  if (isBooking) {
    return (
      <div className={`h-[100dvh] flex flex-col overflow-hidden ${draft.isEditMode ? 'bg-gradient-to-b from-blue-950 via-zinc-900 to-black' : 'bg-gradient-to-b from-zinc-900 via-zinc-900 to-black'}`}>
        {/* Header */}
        <header className="flex-shrink-0 px-4 pt-4 pb-2">
          <div className="text-center mb-3">
            <h1 className={`text-lg font-bold ${draft.isEditMode ? 'text-blue-400' : 'text-violet-400'}`}>
              Resonance – Sinhgad Road
            </h1>
            <h2 className="text-sm text-zinc-400">Online Booking System</h2>
          </div>
          {draft.name && (
            <h3 className={`text-base font-medium text-center mb-3 ${draft.isEditMode ? 'text-blue-300' : 'text-violet-300'}`}>
              Welcome, {draft.name}!
            </h3>
          )}
        </header>
        
        {/* Main content */}
        <main className="flex-1 flex items-center justify-center px-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <Loader2 className={`w-16 h-16 ${draft.isEditMode ? 'text-blue-400' : 'text-violet-400'} animate-spin mx-auto mb-4`} />
            <h4 className="text-xl font-bold text-white mb-2">
              {draft.isEditMode ? 'Updating your booking...' : 'Confirming your booking...'}
            </h4>
            <p className="text-zinc-400">Please wait while we process your request</p>
          </motion.div>
        </main>
        
        {/* Footer with progress bar */}
        <footer className={`flex-shrink-0 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t ${draft.isEditMode ? 'border-blue-900/50' : 'border-zinc-800'} bg-zinc-900/80 backdrop-blur`}>
          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((step) => (
              <div
                key={step}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  step <= 8 
                    ? (draft.isEditMode ? 'bg-blue-500' : 'bg-violet-500') 
                    : 'bg-zinc-700'
                }`}
              />
            ))}
          </div>
          <p className="text-center text-xs text-zinc-500">
            Step 8 of 8
          </p>
        </footer>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`h-[100dvh] flex flex-col overflow-hidden ${draft.isEditMode ? 'bg-gradient-to-b from-blue-950 via-zinc-900 to-black' : 'bg-gradient-to-b from-zinc-900 via-zinc-900 to-black'}`}>
        {/* Header */}
        <header className="flex-shrink-0 px-4 pt-4 pb-2">
          <div className="text-center mb-3">
            <h1 className={`text-lg font-bold ${draft.isEditMode ? 'text-blue-400' : 'text-violet-400'}`}>
              Resonance – Sinhgad Road
            </h1>
            <h2 className="text-sm text-zinc-400">Online Booking System</h2>
          </div>
          {draft.name && (
            <h3 className={`text-base font-medium text-center mb-3 ${draft.isEditMode ? 'text-blue-300' : 'text-violet-300'}`}>
              Welcome, {draft.name}!
            </h3>
          )}
        </header>
        
        {/* Main content */}
        <main className="flex-1 flex items-center justify-center px-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center max-w-sm"
          >
            <div className="p-4 rounded-full bg-red-500/20 mx-auto w-fit mb-4">
              <AlertCircle className="w-12 h-12 text-red-400" />
            </div>
            <h4 className="text-xl font-bold text-white mb-2">
              {draft.isEditMode ? 'Update Failed' : 'Booking Failed'}
            </h4>
            <p className="text-red-400 mb-6">{error}</p>
            <div className="flex gap-3">
              <button
                onClick={handleGoHome}
                className="flex-1 px-4 py-3 rounded-xl bg-zinc-800 text-white font-medium hover:bg-zinc-700"
              >
                Go Home
              </button>
              <button
                onClick={createBooking}
                className={`flex-1 px-4 py-3 rounded-xl ${draft.isEditMode ? 'bg-blue-600 hover:bg-blue-500' : 'bg-violet-600 hover:bg-violet-500'} text-white font-medium`}
              >
                Try Again
              </button>
            </div>
          </motion.div>
        </main>
        
        {/* Footer with progress bar */}
        <footer className={`flex-shrink-0 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t ${draft.isEditMode ? 'border-blue-900/50' : 'border-zinc-800'} bg-zinc-900/80 backdrop-blur`}>
          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((step) => (
              <div
                key={step}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  step <= 8 
                    ? (draft.isEditMode ? 'bg-blue-500' : 'bg-violet-500') 
                    : 'bg-zinc-700'
                }`}
              />
            ))}
          </div>
          <p className="text-center text-xs text-zinc-500">
            Step 8 of 8
          </p>
        </footer>
      </div>
    );
  }

  return (
    <div className={`h-[100dvh] flex flex-col overflow-hidden ${draft.isEditMode ? 'bg-gradient-to-b from-blue-950 via-zinc-900 to-black' : 'bg-gradient-to-b from-zinc-900 via-zinc-900 to-black'}`}>
      {/* Header */}
      <header className="flex-shrink-0 px-4 pt-4 pb-2">
        <div className="text-center mb-3">
          <h1 className={`text-lg font-bold ${draft.isEditMode ? 'text-blue-400' : 'text-violet-400'}`}>
            Resonance – Sinhgad Road
          </h1>
          <h2 className="text-sm text-zinc-400">Online Booking System</h2>
        </div>
        {draft.name && (
          <h3 className={`text-base font-medium text-center mb-2 ${draft.isEditMode ? 'text-blue-300' : 'text-violet-300'}`}>
            Welcome, {draft.name}!
          </h3>
        )}
      </header>
      
      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 overflow-hidden">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="text-center"
        >
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className={`p-3 rounded-full ${draft.isEditMode ? 'bg-blue-500/20' : 'bg-green-500/20'} mx-auto w-fit mb-3`}
          >
            <CheckCircle2 className={`w-12 h-12 ${draft.isEditMode ? 'text-blue-400' : 'text-green-400'}`} />
          </motion.div>

          <h4 className="text-xl font-bold text-white mb-1">
            {draft.isEditMode ? 'Booking Updated!' : 'Booking Confirmed!'}
          </h4>
          {bookingId && (
            <p className="text-zinc-400 mb-4">
              Booking ID: <span className={`${draft.isEditMode ? 'text-blue-400' : 'text-violet-400'} font-mono`}>{bookingId}</span>
            </p>
          )}
        </motion.div>

        {/* Booking Details Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={`w-full max-w-sm bg-zinc-800/50 border ${draft.isEditMode ? 'border-blue-700/50' : 'border-zinc-700'} rounded-xl p-4 mt-3`}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Building2 className={`w-5 h-5 ${draft.isEditMode ? 'text-blue-400' : 'text-violet-400'}`} />
              <div>
                <p className="text-xs text-zinc-400">Studio</p>
                <p className="text-white font-medium text-sm">{draft.studio}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className={`w-5 h-5 ${draft.isEditMode ? 'text-blue-400' : 'text-violet-400'}`} />
              <div>
                <p className="text-xs text-zinc-400">Date</p>
                <p className="text-white font-medium text-sm">{formatDate(draft.date)}</p>
              </div>
            </div>

            {draft.selectedSlot && (
              <div className="flex items-center gap-3">
                <Clock className={`w-5 h-5 ${draft.isEditMode ? 'text-blue-400' : 'text-violet-400'}`} />
                <div>
                  <p className="text-xs text-zinc-400">Time</p>
                  <p className="text-white font-medium text-sm">
                    {formatTime(draft.selectedSlot.start)} - {formatTime(draft.selectedSlot.end)}
                  </p>
                </div>
              </div>
            )}

            <div className="border-t border-zinc-700 pt-3 mt-3">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 text-sm">Total Amount</span>
                <span className={`text-xl font-bold ${draft.isEditMode ? 'text-blue-400' : 'text-violet-400'}`}>
                  ₹{draft.ratePerHour * draft.duration}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">Pay at the studio</p>
            </div>
          </div>
        </motion.div>

        {/* SMS notification */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-xs text-zinc-500 mt-3 text-center"
        >
          {draft.isEditMode 
            ? 'Your booking has been updated. A confirmation SMS has been sent.'
            : 'A confirmation SMS has been sent to your phone'
          }
        </motion.p>
      </main>

      {/* Footer with Action Buttons and progress bar */}
      <footer className={`flex-shrink-0 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t ${draft.isEditMode ? 'border-blue-900/50' : 'border-zinc-800'} bg-zinc-900/80 backdrop-blur`}>
        {/* Progress bar */}
        <div className="flex items-center gap-1 mb-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((step) => (
            <div
              key={step}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                step <= 8 
                  ? (draft.isEditMode ? 'bg-blue-500' : 'bg-violet-500') 
                  : 'bg-zinc-700'
              }`}
            />
          ))}
        </div>
        <p className="text-center text-xs text-zinc-500 mb-3">
          Step 8 of 8 - Complete!
        </p>
        
        {/* Action Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex gap-3"
        >
          <button
            onClick={handleGoHome}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-zinc-800 text-white font-medium hover:bg-zinc-700"
          >
            <Home className="w-4 h-4" />
            Home
          </button>
          <button
            onClick={handleNewBooking}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl ${draft.isEditMode ? 'bg-blue-600 hover:bg-blue-500' : 'bg-violet-600 hover:bg-violet-500'} text-white font-medium`}
          >
            <CalendarPlus className="w-4 h-4" />
            New Booking
          </button>
        </motion.div>
      </footer>
    </div>
  );
}
