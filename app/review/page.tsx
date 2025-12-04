'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  Music,
  CheckCircle,
  Loader2,
  AlertCircle,
  Phone,
  User,
  MapPin,
  IndianRupee,
} from 'lucide-react';

interface BookingDraft {
  sessionType: string;
  participants: number;
  studioId: string;
  studioName: string;
  date: string;
  startTime: string;
  endTime: string;
  totalHours: number;
  totalAmount: number;
  phone: string;
  name: string;
  isEditMode?: boolean;
  editBookingId?: string;
}

interface Studio {
  id: string;
  name: string;
  hourly_rate: number;
}

export default function ReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [draft, setDraft] = useState<BookingDraft | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [studios, setStudios] = useState<Studio[]>([]);

  // Fetch studios for rate information
  useEffect(() => {
    const fetchStudios = async () => {
      try {
        const response = await fetch('/api/studios');
        if (response.ok) {
          const data = await response.json();
          setStudios(data.studios || []);
        }
      } catch (err) {
        console.error('Failed to fetch studios:', err);
      }
    };
    fetchStudios();
  }, []);

  // Load draft from localStorage
  useEffect(() => {
    const loadDraft = () => {
      try {
        const savedDraft = localStorage.getItem('bookingDraft');
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          setDraft(parsed);
        } else {
          // No draft found, redirect to booking
          router.push('/booking/new');
        }
      } catch (err) {
        console.error('Failed to load draft:', err);
        router.push('/booking/new');
      } finally {
        setIsLoading(false);
      }
    };

    loadDraft();
  }, [router]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getStudioRate = useCallback(() => {
    if (!draft) return 0;
    const studio = studios.find(s => s.id === draft.studioId);
    return studio?.hourly_rate || 0;
  }, [draft, studios]);

  const handleConfirmBooking = async () => {
    if (!draft) return;

    setIsSubmitting(true);
    setError('');

    try {
      const endpoint = draft.isEditMode ? '/api/admin/book' : '/api/book';
      const payload = draft.isEditMode
        ? {
            bookingId: draft.editBookingId,
            sessionType: draft.sessionType,
            participants: draft.participants,
            studioId: draft.studioId,
            date: draft.date,
            startTime: draft.startTime,
            endTime: draft.endTime,
            totalHours: draft.totalHours,
            totalAmount: draft.totalAmount,
            phone: draft.phone,
            name: draft.name,
          }
        : {
            sessionType: draft.sessionType,
            participants: draft.participants,
            studioId: draft.studioId,
            date: draft.date,
            startTime: draft.startTime,
            endTime: draft.endTime,
            totalHours: draft.totalHours,
            totalAmount: draft.totalAmount,
            phone: draft.phone,
            name: draft.name,
          };

      const response = await fetch(endpoint, {
        method: draft.isEditMode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create booking');
      }

      // Clear draft and redirect to confirmation
      localStorage.removeItem('bookingDraft');
      localStorage.setItem('lastBooking', JSON.stringify(data.booking || data));
      router.push('/confirmation');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.push('/booking/new');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
          <p className="text-zinc-400">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!draft) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Review Booking</h1>
            <p className="text-sm text-zinc-400">Confirm your booking details</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Booking Summary Card */}
            <div className="bg-zinc-900/50 rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  Booking Summary
                </h2>
              </div>

              <div className="p-6 space-y-4">
                {/* Contact Info */}
                <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-violet-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-zinc-400">Contact</p>
                    <p className="text-white font-medium">{draft.name}</p>
                    <p className="text-zinc-400 text-sm flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      +91 {draft.phone}
                    </p>
                  </div>
                </div>

                {/* Session Type */}
                <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <Music className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-zinc-400">Session Type</p>
                    <p className="text-white font-medium capitalize">{draft.sessionType}</p>
                  </div>
                </div>

                {/* Participants */}
                <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-zinc-400">Participants</p>
                    <p className="text-white font-medium">{draft.participants} {draft.participants === 1 ? 'person' : 'people'}</p>
                  </div>
                </div>

                {/* Studio */}
                <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-zinc-400">Studio</p>
                    <p className="text-white font-medium">{draft.studioName}</p>
                    {getStudioRate() > 0 && (
                      <p className="text-zinc-400 text-sm">₹{getStudioRate()}/hour</p>
                    )}
                  </div>
                </div>

                {/* Date & Time */}
                <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-rose-500/20 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-rose-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-zinc-400">Date & Time</p>
                    <p className="text-white font-medium">{formatDate(draft.date)}</p>
                    <p className="text-zinc-400 text-sm flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(draft.startTime)} - {formatTime(draft.endTime)} ({draft.totalHours} {draft.totalHours === 1 ? 'hour' : 'hours'})
                    </p>
                  </div>
                </div>
              </div>

              {/* Total Amount */}
              <div className="p-6 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-400">Total Amount</p>
                    <p className="text-2xl font-bold text-white flex items-center">
                      <IndianRupee className="w-5 h-5" />
                      {draft.totalAmount.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="text-right text-sm text-zinc-400">
                    <p>{draft.totalHours} {draft.totalHours === 1 ? 'hour' : 'hours'}</p>
                    <p>@ ₹{getStudioRate()}/hr</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-red-400">{error}</p>
              </motion.div>
            )}

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={handleBack}
                className="flex-1 py-4 rounded-xl border border-white/10 text-zinc-400 font-medium hover:bg-white/5 transition-colors"
              >
                Go Back
              </button>
              <motion.button
                onClick={handleConfirmBooking}
                disabled={isSubmitting}
                className="flex-1 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold hover:from-violet-500 hover:to-fuchsia-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    {draft.isEditMode ? 'Update Booking' : 'Confirm Booking'}
                  </>
                )}
              </motion.button>
            </div>

            {/* Info Note */}
            <p className="text-center text-zinc-500 text-sm">
              By confirming, you agree to our booking terms and cancellation policy.
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
