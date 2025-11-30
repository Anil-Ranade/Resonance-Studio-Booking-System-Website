'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { getDeviceFingerprint, isPhoneTrustedLocally } from '@/lib/deviceFingerprint';

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
  CalendarX,
  X,
  ShieldCheck,
  Shield,
  Check,
  RefreshCw,
  Smartphone,
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

interface CancelModalState {
  isOpen: boolean;
  booking: Booking | null;
  step: 'confirm' | 'otp' | 'success' | 'trusted-confirm';
  otp: string[];
  reason: string;
  isLoading: boolean;
  error: string;
  otpSent: boolean;
  cooldown: number;
  deviceTrusted: boolean;
}

interface EditModalState {
  isOpen: boolean;
  booking: Booking | null;
  step: 'confirm' | 'otp' | 'success' | 'trusted-confirm';
  otp: string[];
  isLoading: boolean;
  error: string;
  otpSent: boolean;
  cooldown: number;
  deviceTrusted: boolean;
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

export default function MyBookingsPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [searched, setSearched] = useState(false);
  const [isDeviceTrusted, setIsDeviceTrusted] = useState(false);
  const [cancelModal, setCancelModal] = useState<CancelModalState>({
    isOpen: false,
    booking: null,
    step: 'confirm',
    otp: ['', '', '', '', '', ''],
    reason: '',
    isLoading: false,
    error: '',
    otpSent: false,
    cooldown: 0,
    deviceTrusted: false,
  });
  const [editModal, setEditModal] = useState<EditModalState>({
    isOpen: false,
    booking: null,
    step: 'confirm',
    otp: ['', '', '', '', '', ''],
    isLoading: false,
    error: '',
    otpSent: false,
    cooldown: 0,
    deviceTrusted: false,
  });
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const editOtpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();

  // Check if device is trusted for this phone number when phone changes
  useEffect(() => {
    const checkDeviceTrust = async () => {
      const normalized = phoneNumber.replace(/\D/g, '');
      if (normalized.length !== 10) {
        setIsDeviceTrusted(false);
        return;
      }

      // Verify with server (the source of truth for trusted devices)
      try {
        const deviceInfo = await getDeviceFingerprint();
        const response = await fetch('/api/auth/verify-device', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: normalized,
            deviceFingerprint: deviceInfo.fingerprint,
          }),
        });

        const data = await safeJsonParse(response);
        const isTrusted = data.trusted === true;
        setIsDeviceTrusted(isTrusted);
        
        // Sync local storage with server state
        if (isTrusted && !isPhoneTrustedLocally(normalized)) {
          const { addTrustedPhone } = await import('@/lib/deviceFingerprint');
          addTrustedPhone(normalized);
        }
      } catch {
        setIsDeviceTrusted(false);
      }
    };

    checkDeviceTrust();
  }, [phoneNumber]);

  const handleSearch = async () => {
    const normalized = phoneNumber.replace(/\D/g, '');
    if (normalized.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Fetch only upcoming bookings
      const response = await fetch(`/api/bookings/upcoming?phone=${normalized}`);
      const data = await safeJsonParse(response);

      if (data.error) {
        throw new Error(data.error);
      }

      setBookings(data.bookings);
      setSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bookings');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusClasses = (status: Booking['status']) => {
    const config = statusConfig[status];
    return {
      bg: `bg-${config.color}-500/10`,
      border: `border-${config.color}-500/20`,
      text: `text-${config.color}-400`,
    };
  };

  const openCancelModal = async (booking: Booking) => {
    // First show modal with loading state
    setCancelModal({
      isOpen: true,
      booking,
      step: 'confirm', // Default to confirm, will update after trust check
      otp: ['', '', '', '', '', ''],
      reason: '',
      isLoading: true, // Show loading while checking device trust
      error: '',
      otpSent: false,
      cooldown: 0,
      deviceTrusted: false,
    });

    // Re-verify device trust in real-time when opening cancel modal
    const normalized = phoneNumber.replace(/\D/g, '');
    let isTrusted = false;
    
    if (normalized.length === 10) {
      try {
        const deviceInfo = await getDeviceFingerprint();
        const response = await fetch('/api/auth/verify-device', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: normalized,
            deviceFingerprint: deviceInfo.fingerprint,
          }),
        });

        const data = await safeJsonParse(response);
        isTrusted = data.trusted === true;
        setIsDeviceTrusted(isTrusted);
        
        // Sync local storage with server state
        if (isTrusted && !isPhoneTrustedLocally(normalized)) {
          const { addTrustedPhone } = await import('@/lib/deviceFingerprint');
          addTrustedPhone(normalized);
        }
      } catch {
        isTrusted = false;
      }
    }

    // Update modal with verified trust status
    setCancelModal(prev => ({
      ...prev,
      step: isTrusted ? 'trusted-confirm' : 'confirm',
      isLoading: false,
      deviceTrusted: isTrusted,
    }));
  };

  const closeCancelModal = () => {
    setCancelModal(prev => ({
      ...prev,
      isOpen: false,
      booking: null,
      step: 'confirm',
      otp: ['', '', '', '', '', ''],
      reason: '',
      isLoading: false,
      error: '',
    }));
  };

  const sendOtp = async () => {
    setCancelModal(prev => ({ ...prev, isLoading: true, error: '' }));

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber }),
      });

      const data = await safeJsonParse(response);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      setCancelModal(prev => ({
        ...prev,
        step: 'otp',
        otpSent: true,
        isLoading: false,
        cooldown: 60,
      }));

      // Focus first OTP input
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);

      // Start cooldown timer
      const interval = setInterval(() => {
        setCancelModal(prev => {
          if (prev.cooldown <= 1) {
            clearInterval(interval);
            return { ...prev, cooldown: 0 };
          }
          return { ...prev, cooldown: prev.cooldown - 1 };
        });
      }, 1000);
    } catch (err) {
      setCancelModal(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to send OTP',
      }));
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...cancelModal.otp];
    newOtp[index] = value;
    setCancelModal(prev => ({ ...prev, otp: newOtp, error: '' }));

    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !cancelModal.otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      const newOtp = pastedData.split('');
      setCancelModal(prev => ({ ...prev, otp: newOtp, error: '' }));
      otpInputRefs.current[5]?.focus();
    }
  };

  // Cancel with trusted device (no OTP needed)
  const confirmTrustedCancellation = async () => {
    if (!cancelModal.booking) {
      setCancelModal(prev => ({ ...prev, error: 'No booking selected' }));
      return;
    }

    setCancelModal(prev => ({ ...prev, isLoading: true, error: '' }));

    try {
      const deviceInfo = await getDeviceFingerprint();
      
      const response = await fetch('/api/bookings/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: cancelModal.booking.id,
          phone: phoneNumber,
          deviceFingerprint: deviceInfo.fingerprint,
          reason: cancelModal.reason || 'Cancelled by user',
        }),
      });

      const data = await safeJsonParse(response);

      if (!response.ok) {
        // If device verification failed, fall back to OTP
        if (data.error?.includes('OTP is required')) {
          setCancelModal(prev => ({
            ...prev,
            step: 'confirm',
            deviceTrusted: false,
            isLoading: false,
            error: 'Device verification failed. Please use OTP.',
          }));
          return;
        }
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

  const confirmCancellation = async () => {
    const otpValue = cancelModal.otp.join('');
    if (!cancelModal.booking || otpValue.length !== 6) {
      setCancelModal(prev => ({ ...prev, error: 'Please enter a valid 6-digit OTP' }));
      return;
    }

    setCancelModal(prev => ({ ...prev, isLoading: true, error: '' }));

    try {
      // Get device fingerprint to register as trusted device
      const deviceInfo = await getDeviceFingerprint();

      const response = await fetch('/api/bookings/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: cancelModal.booking.id,
          phone: phoneNumber,
          otp: otpValue,
          deviceFingerprint: deviceInfo.fingerprint,
          deviceName: deviceInfo.deviceName,
          reason: cancelModal.reason || 'Cancelled by user',
        }),
      });

      const data = await safeJsonParse(response);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel booking');
      }

      // Store phone as trusted locally if device was registered
      if (data.deviceTrusted) {
        const { addTrustedPhone } = await import('@/lib/deviceFingerprint');
        addTrustedPhone(phoneNumber);
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
        otp: ['', '', '', '', '', ''],
      }));
      // Focus first OTP input on error
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    }
  };

  const canCancelBooking = (booking: Booking) => {
    // Only allow cancellation for pending or confirmed bookings (case-insensitive)
    const status = booking.status?.toLowerCase();
    if (status !== 'pending' && status !== 'confirmed') {
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
      // If we can't parse the date properly, allow cancellation for pending/confirmed bookings
      // This is a fallback to ensure users can always cancel their bookings
      return true;
    }
    
    // Allow cancellation if booking is in the future or present (not in the past)
    return bookingDateTime >= now;
  };

  // Edit booking functions - similar logic to cancel but redirects to booking flow
  const openEditModal = async (booking: Booking) => {
    // First show modal with loading state
    setEditModal({
      isOpen: true,
      booking,
      step: 'confirm',
      otp: ['', '', '', '', '', ''],
      isLoading: true,
      error: '',
      otpSent: false,
      cooldown: 0,
      deviceTrusted: false,
    });

    // Re-verify device trust in real-time when opening edit modal
    const normalized = phoneNumber.replace(/\D/g, '');
    let isTrusted = false;
    
    if (normalized.length === 10) {
      try {
        const deviceInfo = await getDeviceFingerprint();
        const response = await fetch('/api/auth/verify-device', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: normalized,
            deviceFingerprint: deviceInfo.fingerprint,
          }),
        });

        const data = await safeJsonParse(response);
        isTrusted = data.trusted === true;
        setIsDeviceTrusted(isTrusted);
        
        // Sync local storage with server state
        if (isTrusted && !isPhoneTrustedLocally(normalized)) {
          const { addTrustedPhone } = await import('@/lib/deviceFingerprint');
          addTrustedPhone(normalized);
        }
      } catch {
        isTrusted = false;
      }
    }

    // Update modal with verified trust status
    setEditModal(prev => ({
      ...prev,
      step: isTrusted ? 'trusted-confirm' : 'confirm',
      isLoading: false,
      deviceTrusted: isTrusted,
    }));
  };

  const closeEditModal = () => {
    setEditModal(prev => ({
      ...prev,
      isOpen: false,
      booking: null,
      step: 'confirm',
      otp: ['', '', '', '', '', ''],
      isLoading: false,
      error: '',
    }));
  };

  const sendEditOtp = async () => {
    setEditModal(prev => ({ ...prev, isLoading: true, error: '' }));

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber }),
      });

      const data = await safeJsonParse(response);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      setEditModal(prev => ({
        ...prev,
        step: 'otp',
        otpSent: true,
        isLoading: false,
        cooldown: 60,
      }));

      // Focus first OTP input
      setTimeout(() => {
        editOtpInputRefs.current[0]?.focus();
      }, 100);

      // Start cooldown timer
      const interval = setInterval(() => {
        setEditModal(prev => {
          if (prev.cooldown <= 1) {
            clearInterval(interval);
            return { ...prev, cooldown: 0 };
          }
          return { ...prev, cooldown: prev.cooldown - 1 };
        });
      }, 1000);
    } catch (err) {
      setEditModal(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to send OTP',
      }));
    }
  };

  const handleEditOtpChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...editModal.otp];
    newOtp[index] = value;
    setEditModal(prev => ({ ...prev, otp: newOtp, error: '' }));

    // Auto-focus next input
    if (value && index < 5) {
      editOtpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleEditOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !editModal.otp[index] && index > 0) {
      editOtpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleEditOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      const newOtp = pastedData.split('');
      setEditModal(prev => ({ ...prev, otp: newOtp, error: '' }));
      editOtpInputRefs.current[5]?.focus();
    }
  };

  // Proceed to edit with trusted device (no OTP needed)
  const proceedToEditTrusted = () => {
    if (!editModal.booking) return;
    
    // Store the original booking data in sessionStorage for the edit flow
    const editBookingData = {
      editMode: true,
      originalBookingId: editModal.booking.id,
      phone_number: phoneNumber,
      name: editModal.booking.name || '',
      sessionType: editModal.booking.session_type,
      sessionDetails: editModal.booking.session_details,
      studio: editModal.booking.studio,
      date: editModal.booking.date,
      start_time: editModal.booking.start_time,
      end_time: editModal.booking.end_time,
      group_size: editModal.booking.group_size,
      total_amount: editModal.booking.total_amount,
    };
    
    sessionStorage.setItem('editBookingData', JSON.stringify(editBookingData));
    closeEditModal();
    router.push('/booking/new');
  };

  // Verify OTP and proceed to edit
  const verifyAndProceedToEdit = async () => {
    const otpValue = editModal.otp.join('');
    if (!editModal.booking || otpValue.length !== 6) {
      setEditModal(prev => ({ ...prev, error: 'Please enter a valid 6-digit OTP' }));
      return;
    }

    setEditModal(prev => ({ ...prev, isLoading: true, error: '' }));

    try {
      // Verify OTP with server
      const deviceInfo = await getDeviceFingerprint();
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phoneNumber,
          otp: otpValue,
          deviceFingerprint: deviceInfo.fingerprint,
          deviceName: deviceInfo.deviceName,
        }),
      });

      const data = await safeJsonParse(response);

      if (!response.ok) {
        throw new Error(data.error || 'Invalid OTP');
      }

      // Store phone as trusted locally if device was registered
      if (data.deviceTrusted) {
        const { addTrustedPhone } = await import('@/lib/deviceFingerprint');
        addTrustedPhone(phoneNumber);
      }

      // Store the original booking data in sessionStorage for the edit flow
      const editBookingData = {
        editMode: true,
        originalBookingId: editModal.booking.id,
        phone_number: phoneNumber,
        name: editModal.booking.name || '',
        sessionType: editModal.booking.session_type,
        sessionDetails: editModal.booking.session_details,
        studio: editModal.booking.studio,
        date: editModal.booking.date,
        start_time: editModal.booking.start_time,
        end_time: editModal.booking.end_time,
        group_size: editModal.booking.group_size,
        total_amount: editModal.booking.total_amount,
      };
      
      sessionStorage.setItem('editBookingData', JSON.stringify(editBookingData));
      closeEditModal();
      router.push('/booking/new');
    } catch (err) {
      setEditModal(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to verify OTP',
        otp: ['', '', '', '', '', ''],
      }));
      // Focus first OTP input on error
      setTimeout(() => {
        editOtpInputRefs.current[0]?.focus();
      }, 100);
    }
  };

  const canEditBooking = (booking: Booking) => {
    // Only allow editing for pending or confirmed bookings
    const status = booking.status?.toLowerCase();
    if (status !== 'pending' && status !== 'confirmed') {
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
    
    // Allow editing if booking is in the future
    return bookingDateTime >= now;
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            href="/home"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </Link>

          <h1 className="text-4xl font-bold text-white mb-2">My Bookings</h1>
          <p className="text-zinc-400">
            Enter your phone number to view your bookings
          </p>
        </motion.div>

        {/* Search Card */}
        <motion.div
          className="glass-strong rounded-3xl p-8 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <Phone className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Find Your Bookings</h2>
              <p className="text-zinc-400 text-sm">
                Enter the phone number used during booking
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-zinc-400 mb-2.5">
                Phone Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  id="phone"
                  value={phoneNumber}
                  onChange={(e) => {
                    // Only allow digits
                    const value = e.target.value.replace(/\D/g, '');
                    setPhoneNumber(value);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Enter 10-digit number"
                  className="w-full py-3.5 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                  maxLength={10}
                  autoComplete="tel"
                  inputMode="numeric"
                />
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <span className="text-red-400">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="button"
              onClick={handleSearch}
              disabled={isLoading || phoneNumber.replace(/\D/g, '').length !== 10}
              className="w-full btn-accent py-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                  <Search className="w-5 h-5" />
                  Search Bookings
                </>
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {searched && bookings && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {bookings.length === 0 ? (
                <motion.div
                  className="glass rounded-2xl p-8 text-center"
                  variants={fadeInUp}
                >
                  <CalendarX className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Bookings Found</h3>
                  <p className="text-zinc-400 mb-6">
                    We couldn&apos;t find any bookings associated with this phone number.
                  </p>
                  <Link
                    href="/booking/new"
                    className="inline-flex items-center gap-2 btn-accent px-6 py-3"
                  >
                    Book Your First Session
                  </Link>
                </motion.div>
              ) : (
                <>
                  <motion.p
                    className="text-zinc-400 mb-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    Found {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
                  </motion.p>

                  {bookings.map((booking, index) => {
                    const status = statusConfig[booking.status];
                    const StatusIcon = status.icon;

                    return (
                      <motion.div
                        key={booking.id}
                        className="glass rounded-2xl p-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        {/* Header with Status */}
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                              <Mic className="w-5 h-5 text-violet-400" />
                            </div>
                            <div>
                              <h3 className="text-white font-semibold">{booking.session_type}</h3>
                              <p className="text-zinc-500 text-sm">{booking.studio}</p>
                            </div>
                          </div>
                          <div
                            className={`px-3 py-1.5 rounded-full flex items-center gap-2 text-sm font-medium bg-${status.color}-500/10 border border-${status.color}-500/20 text-${status.color}-400`}
                          >
                            <StatusIcon className="w-4 h-4" />
                            {status.label}
                          </div>
                        </div>

                        {/* Booking Details */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-zinc-500" />
                            <div>
                              <p className="text-zinc-500 text-xs">Date</p>
                              <p className="text-white text-sm">{formatDate(booking.date)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-zinc-500" />
                            <div>
                              <p className="text-zinc-500 text-xs">Time</p>
                              <p className="text-white text-sm">
                                {booking.start_time} - {booking.end_time}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Building2 className="w-5 h-5 text-zinc-500" />
                            <div>
                              <p className="text-zinc-500 text-xs">Studio</p>
                              <p className="text-white text-sm">{booking.studio}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Users className="w-5 h-5 text-zinc-500" />
                            <div>
                              <p className="text-zinc-500 text-xs">Group Size</p>
                              <p className="text-white text-sm">
                                {booking.group_size} {booking.group_size === 1 ? 'person' : 'people'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                          <span className="text-zinc-400 text-sm">Total Amount</span>
                          <span className="text-xl font-bold gradient-text-accent">
                            ₹{booking.total_amount.toLocaleString('en-IN')}
                          </span>
                        </div>

                        {/* Action Buttons */}
                        {(canEditBooking(booking) || canCancelBooking(booking)) && (
                          <div className="mt-4 flex gap-3">
                            {/* Modify Booking Button */}
                            {canEditBooking(booking) && (
                              <motion.button
                                onClick={() => openEditModal(booking)}
                                className="flex-1 py-3 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 font-medium hover:bg-violet-500/20 transition-colors flex items-center justify-center gap-2"
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                              >
                                <Edit3 className="w-4 h-4" />
                                Modify
                              </motion.button>
                            )}
                            {/* Cancel Button */}
                            {canCancelBooking(booking) && (
                              <motion.button
                                onClick={() => openCancelModal(booking)}
                                className="flex-1 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-medium hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
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
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cancel Booking Modal */}
        <AnimatePresence>
          {cancelModal.isOpen && cancelModal.booking && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Backdrop */}
              <motion.div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={closeCancelModal}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />

              {/* Modal */}
              <motion.div
                className="relative w-full max-w-md glass-strong rounded-2xl p-6"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
              >
                {/* Close Button */}
                <button
                  onClick={closeCancelModal}
                  className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Loading State - Checking Device Trust */}
                {cancelModal.isLoading && cancelModal.step === 'confirm' && !cancelModal.otpSent && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-10 h-10 text-violet-400 animate-spin mb-4" />
                    <p className="text-zinc-400 text-sm">Verifying device...</p>
                  </div>
                )}

                {/* Step: Trusted Device Confirm (No OTP needed) */}
                {cancelModal.step === 'trusted-confirm' && !cancelModal.isLoading && (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                        <Smartphone className="w-6 h-6 text-green-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Cancel Booking</h3>
                        <p className="text-green-400 text-sm flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4" />
                          Welcome back, {cancelModal.booking?.name?.split(' ')[0] || 'there'}!
                        </p>
                      </div>
                    </div>

                    {/* Trusted Device Info Banner */}
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 mb-6">
                      <p className="text-green-400 text-sm text-center">
                        <span className="font-medium">No OTP required — your device is trusted</span>
                      </p>
                    </div>

                    {/* Booking Summary */}
                    <div className="bg-white/5 rounded-xl p-4 mb-6">
                      <div className="flex items-center gap-3 mb-3">
                        <Mic className="w-5 h-5 text-violet-400" />
                        <span className="text-white font-medium">{cancelModal.booking?.session_type}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2 text-zinc-400">
                          <Calendar className="w-4 h-4" />
                          {cancelModal.booking && formatDate(cancelModal.booking.date)}
                        </div>
                        <div className="flex items-center gap-2 text-zinc-400">
                          <Clock className="w-4 h-4" />
                          {cancelModal.booking?.start_time} - {cancelModal.booking?.end_time}
                        </div>
                      </div>
                    </div>

                    {/* Reason Input */}
                    <div className="mb-6">
                      <label htmlFor="cancel-reason-trusted" className="block text-sm font-medium text-zinc-400 mb-2.5">
                        Reason for cancellation (optional)
                      </label>
                      <textarea
                        id="cancel-reason-trusted"
                        value={cancelModal.reason}
                        onChange={(e) => setCancelModal(prev => ({ ...prev, reason: e.target.value }))}
                        placeholder="Let us know why you're cancelling..."
                        className="input min-h-[80px] resize-none"
                        rows={3}
                      />
                    </div>

                    {cancelModal.error && (
                      <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                        <span className="text-red-400 text-sm">{cancelModal.error}</span>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={closeCancelModal}
                        className="flex-1 py-3 rounded-xl border border-white/10 text-zinc-400 font-medium hover:bg-white/5 transition-colors"
                      >
                        Keep Booking
                      </button>
                      <motion.button
                        onClick={confirmTrustedCancellation}
                        disabled={cancelModal.isLoading}
                        className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {cancelModal.isLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <XCircle className="w-4 h-4" />
                            Cancel Booking
                          </>
                        )}
                      </motion.button>
                    </div>

                    {/* Option to use OTP instead */}
                    <button
                      onClick={() => setCancelModal(prev => ({ ...prev, step: 'confirm', deviceTrusted: false }))}
                      className="w-full mt-4 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      Use OTP verification instead
                    </button>
                  </>
                )}

                {/* Step: Confirm */}
                {cancelModal.step === 'confirm' && !cancelModal.isLoading && (
                  <>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                        <XCircle className="w-6 h-6 text-red-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Cancel Booking</h3>
                        <p className="text-zinc-400 text-sm">This action requires verification</p>
                      </div>
                    </div>

                    {/* Booking Summary */}
                    <div className="bg-white/5 rounded-xl p-4 mb-6">
                      <div className="flex items-center gap-3 mb-3">
                        <Mic className="w-5 h-5 text-violet-400" />
                        <span className="text-white font-medium">{cancelModal.booking.session_type}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2 text-zinc-400">
                          <Calendar className="w-4 h-4" />
                          {formatDate(cancelModal.booking.date)}
                        </div>
                        <div className="flex items-center gap-2 text-zinc-400">
                          <Clock className="w-4 h-4" />
                          {cancelModal.booking.start_time} - {cancelModal.booking.end_time}
                        </div>
                      </div>
                    </div>

                    {/* Reason Input */}
                    <div className="mb-6">
                      <label htmlFor="cancel-reason" className="block text-sm font-medium text-zinc-400 mb-2.5">
                        Reason for cancellation (optional)
                      </label>
                      <textarea
                        id="cancel-reason"
                        value={cancelModal.reason}
                        onChange={(e) => setCancelModal(prev => ({ ...prev, reason: e.target.value }))}
                        placeholder="Let us know why you're cancelling..."
                        className="input min-h-[80px] resize-none"
                        rows={3}
                      />
                    </div>

                    {cancelModal.error && (
                      <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                        <span className="text-red-400 text-sm">{cancelModal.error}</span>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={closeCancelModal}
                        className="flex-1 py-3 rounded-xl border border-white/10 text-zinc-400 font-medium hover:bg-white/5 transition-colors"
                      >
                        Keep Booking
                      </button>
                      <motion.button
                        onClick={sendOtp}
                        disabled={cancelModal.isLoading}
                        className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {cancelModal.isLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4" />
                            Verify & Cancel
                          </>
                        )}
                      </motion.button>
                    </div>
                  </>
                )}

                {/* Step: OTP */}
                {cancelModal.step === 'otp' && (
                  <>
                    <motion.div 
                      className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                        <Shield className="w-6 h-6 text-amber-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Verify Your Number</h3>
                        <p className="text-zinc-400 text-sm">Enter the OTP sent to your phone</p>
                      </div>
                    </motion.div>

                    <motion.div 
                      className="space-y-6"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-3">
                        <Check className="w-5 h-5 text-green-400" />
                        <span className="text-green-400">OTP sent to +91 {phoneNumber}</span>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-4 text-center">
                          Enter the 6-digit OTP
                        </label>
                        <div className="flex justify-center gap-2 sm:gap-3 max-w-sm mx-auto">
                          {cancelModal.otp.map((digit, index) => (
                            <input
                              key={index}
                              ref={(el) => { otpInputRefs.current[index] = el; }}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={digit}
                              onChange={(e) => handleOtpChange(index, e.target.value)}
                              onKeyDown={(e) => handleOtpKeyDown(index, e)}
                              onPaste={handleOtpPaste}
                              className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-xl bg-white/5 border border-white/10 text-white focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all"
                            />
                          ))}
                        </div>
                      </div>

                      {cancelModal.error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                          <span className="text-red-400 text-sm">{cancelModal.error}</span>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row gap-3">
                        <motion.button
                          onClick={confirmCancellation}
                          disabled={cancelModal.isLoading || cancelModal.otp.join('').length !== 6}
                          className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {cancelModal.isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <>
                              <Check className="w-5 h-5" />
                              Confirm Cancellation
                            </>
                          )}
                        </motion.button>

                        <motion.button
                          onClick={sendOtp}
                          disabled={cancelModal.isLoading || cancelModal.cooldown > 0}
                          className="flex-1 py-3 rounded-xl border border-white/10 text-zinc-400 font-medium hover:bg-white/5 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <RefreshCw className={`w-5 h-5 ${cancelModal.isLoading ? 'animate-spin' : ''}`} />
                          {cancelModal.cooldown > 0 ? `Resend in ${cancelModal.cooldown}s` : 'Resend OTP'}
                        </motion.button>
                      </div>

                      <button
                        onClick={() => setCancelModal(prev => ({ ...prev, step: 'confirm', otp: ['', '', '', '', '', ''], error: '' }))}
                        className="w-full text-center text-zinc-500 hover:text-zinc-300 text-sm font-medium transition-colors"
                      >
                        ← Back to booking details
                      </button>
                    </motion.div>
                  </>
                )}

                {/* Step: Success */}
                {cancelModal.step === 'success' && (
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
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edit Booking Modal */}
        <AnimatePresence>
          {editModal.isOpen && editModal.booking && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Backdrop */}
              <motion.div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={closeEditModal}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />

              {/* Modal */}
              <motion.div
                className="relative w-full max-w-md glass-strong rounded-2xl p-6"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
              >
                {/* Close Button */}
                <button
                  onClick={closeEditModal}
                  className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Loading State - Checking Device Trust */}
                {editModal.isLoading && editModal.step === 'confirm' && !editModal.otpSent && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-10 h-10 text-violet-400 animate-spin mb-4" />
                    <p className="text-zinc-400 text-sm">Verifying device...</p>
                  </div>
                )}

                {/* Step: Trusted Device Confirm (No OTP needed) */}
                {editModal.step === 'trusted-confirm' && !editModal.isLoading && (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
                        <Edit3 className="w-6 h-6 text-violet-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Modify Booking</h3>
                        <p className="text-green-400 text-sm flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4" />
                          Welcome back, {editModal.booking?.name?.split(' ')[0] || 'there'}!
                        </p>
                      </div>
                    </div>

                    {/* Trusted Device Info Banner */}
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 mb-6">
                      <p className="text-green-400 text-sm text-center">
                        <span className="font-medium">No OTP required — your device is trusted</span>
                      </p>
                    </div>

                    {/* Current Booking Summary */}
                    <div className="bg-white/5 rounded-xl p-4 mb-6">
                      <p className="text-xs text-violet-400 font-medium mb-3">Current Booking</p>
                      <div className="flex items-center gap-3 mb-3">
                        <Mic className="w-5 h-5 text-violet-400" />
                        <span className="text-white font-medium">{editModal.booking?.session_type}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2 text-zinc-400">
                          <Building2 className="w-4 h-4" />
                          {editModal.booking?.studio}
                        </div>
                        <div className="flex items-center gap-2 text-zinc-400">
                          <Calendar className="w-4 h-4" />
                          {editModal.booking && formatDate(editModal.booking.date)}
                        </div>
                        <div className="flex items-center gap-2 text-zinc-400">
                          <Clock className="w-4 h-4" />
                          {editModal.booking?.start_time} - {editModal.booking?.end_time}
                        </div>
                        <div className="flex items-center gap-2 text-zinc-400">
                          <Users className="w-4 h-4" />
                          {editModal.booking?.group_size} {editModal.booking?.group_size === 1 ? 'person' : 'people'}
                        </div>
                      </div>
                    </div>

                    <p className="text-zinc-400 text-sm mb-6 text-center">
                      You&apos;ll be redirected to the booking flow where you can modify your session details. Your original choices will be shown as pre-selected.
                    </p>

                    {editModal.error && (
                      <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                        <span className="text-red-400 text-sm">{editModal.error}</span>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={closeEditModal}
                        className="flex-1 py-3 rounded-xl border border-white/10 text-zinc-400 font-medium hover:bg-white/5 transition-colors"
                      >
                        Cancel
                      </button>
                      <motion.button
                        onClick={proceedToEditTrusted}
                        disabled={editModal.isLoading}
                        className="flex-1 py-3 rounded-xl bg-violet-500 text-white font-medium hover:bg-violet-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {editModal.isLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <Edit3 className="w-4 h-4" />
                            Proceed to Edit
                          </>
                        )}
                      </motion.button>
                    </div>

                    {/* Option to use OTP instead */}
                    <button
                      onClick={() => setEditModal(prev => ({ ...prev, step: 'confirm', deviceTrusted: false }))}
                      className="w-full mt-4 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      Use OTP verification instead
                    </button>
                  </>
                )}

                {/* Step: Confirm (Request OTP) */}
                {editModal.step === 'confirm' && !editModal.isLoading && (
                  <>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
                        <Edit3 className="w-6 h-6 text-violet-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Modify Booking</h3>
                        <p className="text-zinc-400 text-sm">Verify your identity to proceed</p>
                      </div>
                    </div>

                    {/* Current Booking Summary */}
                    <div className="bg-white/5 rounded-xl p-4 mb-6">
                      <p className="text-xs text-violet-400 font-medium mb-3">Current Booking</p>
                      <div className="flex items-center gap-3 mb-3">
                        <Mic className="w-5 h-5 text-violet-400" />
                        <span className="text-white font-medium">{editModal.booking.session_type}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2 text-zinc-400">
                          <Building2 className="w-4 h-4" />
                          {editModal.booking.studio}
                        </div>
                        <div className="flex items-center gap-2 text-zinc-400">
                          <Calendar className="w-4 h-4" />
                          {formatDate(editModal.booking.date)}
                        </div>
                        <div className="flex items-center gap-2 text-zinc-400">
                          <Clock className="w-4 h-4" />
                          {editModal.booking.start_time} - {editModal.booking.end_time}
                        </div>
                        <div className="flex items-center gap-2 text-zinc-400">
                          <Users className="w-4 h-4" />
                          {editModal.booking.group_size} {editModal.booking.group_size === 1 ? 'person' : 'people'}
                        </div>
                      </div>
                    </div>

                    <p className="text-zinc-400 text-sm mb-6 text-center">
                      We&apos;ll send an OTP to verify your identity before you can modify this booking.
                    </p>

                    {editModal.error && (
                      <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                        <span className="text-red-400 text-sm">{editModal.error}</span>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={closeEditModal}
                        className="flex-1 py-3 rounded-xl border border-white/10 text-zinc-400 font-medium hover:bg-white/5 transition-colors"
                      >
                        Cancel
                      </button>
                      <motion.button
                        onClick={sendEditOtp}
                        disabled={editModal.isLoading}
                        className="flex-1 py-3 rounded-xl bg-violet-500 text-white font-medium hover:bg-violet-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {editModal.isLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4" />
                            Verify & Edit
                          </>
                        )}
                      </motion.button>
                    </div>
                  </>
                )}

                {/* Step: OTP */}
                {editModal.step === 'otp' && (
                  <>
                    <motion.div 
                      className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                        <Shield className="w-6 h-6 text-amber-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Verify Your Number</h3>
                        <p className="text-zinc-400 text-sm">Enter the OTP sent to your phone</p>
                      </div>
                    </motion.div>

                    <motion.div 
                      className="space-y-6"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-3">
                        <Check className="w-5 h-5 text-green-400" />
                        <span className="text-green-400">OTP sent to +91 {phoneNumber}</span>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-4 text-center">
                          Enter the 6-digit OTP
                        </label>
                        <div className="flex justify-center gap-2 sm:gap-3 max-w-sm mx-auto">
                          {editModal.otp.map((digit, index) => (
                            <input
                              key={index}
                              ref={(el) => { editOtpInputRefs.current[index] = el; }}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={digit}
                              onChange={(e) => handleEditOtpChange(index, e.target.value)}
                              onKeyDown={(e) => handleEditOtpKeyDown(index, e)}
                              onPaste={handleEditOtpPaste}
                              className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-xl bg-white/5 border border-white/10 text-white focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all"
                            />
                          ))}
                        </div>
                      </div>

                      {editModal.error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                          <span className="text-red-400 text-sm">{editModal.error}</span>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row gap-3">
                        <motion.button
                          onClick={verifyAndProceedToEdit}
                          disabled={editModal.isLoading || editModal.otp.join('').length !== 6}
                          className="flex-1 py-3 rounded-xl bg-violet-500 text-white font-medium hover:bg-violet-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {editModal.isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <>
                              <Check className="w-5 h-5" />
                              Proceed to Edit
                            </>
                          )}
                        </motion.button>

                        <motion.button
                          onClick={sendEditOtp}
                          disabled={editModal.isLoading || editModal.cooldown > 0}
                          className="flex-1 py-3 rounded-xl border border-white/10 text-zinc-400 font-medium hover:bg-white/5 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <RefreshCw className={`w-5 h-5 ${editModal.isLoading ? 'animate-spin' : ''}`} />
                          {editModal.cooldown > 0 ? `Resend in ${editModal.cooldown}s` : 'Resend OTP'}
                        </motion.button>
                      </div>

                      <button
                        onClick={() => setEditModal(prev => ({ ...prev, step: 'confirm', otp: ['', '', '', '', '', ''], error: '' }))}
                        className="w-full text-center text-zinc-500 hover:text-zinc-300 text-sm font-medium transition-colors"
                      >
                        ← Back to booking details
                      </button>
                    </motion.div>
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
