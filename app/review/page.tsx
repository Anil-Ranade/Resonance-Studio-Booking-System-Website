'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  Mic, 
  Users, 
  Building2, 
  Calendar, 
  Clock, 
  Wallet, 
  ClipboardList,
  Check,
  AlertCircle,
  Loader2,
  Phone,
  User,
  Mail,
  Shield,
  RefreshCw
} from 'lucide-react';

interface BookingData {
  user_id?: string;
  sessionType: string;
  studio: string;
  date: string;
  start_time: string;
  end_time: string;
  rate: number;
  duration?: number;
  // Session-specific details
  karaokeOption?: string;
  karaokeLabel?: string;
  liveOption?: string;
  liveLabel?: string;
  bandEquipment?: string[];
  bandLabel?: string;
  recordingOption?: string;
  recordingLabel?: string;
  // Edit mode fields
  isEditMode?: boolean;
  originalBookingId?: string | null;
  editPhoneNumber?: string | null;
  editName?: string | null;
}

interface UserData {
  id: string;
  phone_number: string;
  name: string;
  email: string;
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

// Helper function to get session details label
const getSessionDetailsLabel = (bookingData: BookingData): string => {
  switch (bookingData.sessionType) {
    case 'Karaoke':
      return bookingData.karaokeLabel || '';
    case 'Live with musicians':
      return bookingData.liveLabel || '';
    case 'Band':
      return bookingData.bandLabel || '';
    case 'Recording':
      return bookingData.recordingLabel || '';
    case 'Only Drum Practice':
      return 'Drum practice session';
    default:
      return '';
  }
};

// Helper function to get session details for API
const getSessionDetails = (bookingData: BookingData): string => {
  const label = getSessionDetailsLabel(bookingData);
  return label || bookingData.sessionType;
};

export default function ReviewPage() {
  const router = useRouter();
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [error, setError] = useState<string>('');
  
  // User details state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isCheckingUser, setIsCheckingUser] = useState(false);
  const [needsSignup, setNeedsSignup] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);

  // OTP verification state
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  // Track if user is already verified from previous booking
  const [isAlreadyVerified, setIsAlreadyVerified] = useState(false);
  const [isConfirmingBooking, setIsConfirmingBooking] = useState(false);
  
  // Booking confirmation state
  const [confirmedBookingId, setConfirmedBookingId] = useState<string | null>(null);

  useEffect(() => {
    const storedData = sessionStorage.getItem('bookingData');
    if (storedData) {
      const parsed = JSON.parse(storedData);
      setBookingData(parsed);
      
      // If edit mode, pre-fill phone and name from the original booking
      if (parsed.isEditMode && parsed.editPhoneNumber) {
        setPhoneNumber(parsed.editPhoneNumber);
        if (parsed.editName) {
          setName(parsed.editName);
        }
        // Set as already verified since they already own this booking
        setIsAlreadyVerified(true);
        // Create a mock user data object for the edit flow
        setUserData({
          id: '',
          phone_number: parsed.editPhoneNumber,
          name: parsed.editName || '',
          email: '',
        });
      }
      // Check for verified user (from previous booking in same session) - only if not edit mode
      const storedVerifiedUser = sessionStorage.getItem('verifiedUser');
      if (storedVerifiedUser && !parsed.isEditMode) {
        const parsedUser = JSON.parse(storedVerifiedUser);
        setUserData(parsedUser);
        setPhoneNumber(parsedUser.phone_number);
        setName(parsedUser.name);
        setEmail(parsedUser.email || '');
        setIsAlreadyVerified(true);
      }
    } else {
      router.push('/booking');
    }
  }, [router]);

  // Cooldown timer for resend OTP
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Web OTP API - Auto-fill OTP from SMS on supported mobile browsers
  useEffect(() => {
    if (!showOtpVerification || !('OTPCredential' in window)) return;

    const abortController = new AbortController();
    
    const autoFillOtp = async () => {
      try {
        const credential = await navigator.credentials.get({
          otp: { transport: ['sms'] },
          signal: abortController.signal
        } as CredentialRequestOptions);
        
        if (credential && 'code' in credential) {
          const code = (credential as { code: string }).code;
          if (code && code.length === 6) {
            const newOtp = code.split('');
            setOtp(newOtp);
            otpInputRefs.current[5]?.focus();
            // Auto-submit when OTP is auto-filled
            handleVerifyOtpAndBook(code);
          }
        }
      } catch (err) {
        // User cancelled or API not supported - ignore silently
        console.log('OTP auto-fill not available:', err);
      }
    };

    autoFillOtp();

    return () => {
      abortController.abort();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showOtpVerification]);

  const handlePhoneCheck = async () => {
    if (phoneNumber.replace(/\D/g, '').length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setIsCheckingUser(true);
    setError('');

    try {
      const response = await fetch('/api/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber }),
      });

      const data = await safeJsonParse(response);

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.needsSignup) {
        setNeedsSignup(true);
      } else if (data.user) {
        setUserData(data.user);
        setName(data.user.name);
        setEmail(data.user.email || '');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check user');
    } finally {
      setIsCheckingUser(false);
    }
  };

  const handleSignup = async () => {
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }

    setIsCheckingUser(true);
    setError('');

    try {
      const response = await fetch('/api/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber, name, email }),
      });

      const data = await safeJsonParse(response);

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.user) {
        setUserData(data.user);
        setNeedsSignup(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setIsCheckingUser(false);
    }
  };

  const handleSendOtp = async () => {
    if (!userData) return;

    setIsSendingOtp(true);
    setError('');

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: userData.phone_number }),
      });

      const data = await safeJsonParse(response);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      setOtpSent(true);
      setShowOtpVerification(true);
      setResendCooldown(60); // 60 second cooldown
      setOtp(['', '', '', '', '', '']);
      
      // Focus first OTP input
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (value && index === 5 && newOtp.every(digit => digit !== '')) {
      handleVerifyOtpAndBook(newOtp.join(''));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      otpInputRefs.current[5]?.focus();
      // Auto-verify when pasting complete OTP
      handleVerifyOtpAndBook(newOtp.join(''));
    }
  };

  // Combined function to verify OTP and create booking immediately
  const handleVerifyOtpAndBook = async (otpValue?: string) => {
    const code = otpValue || otp.join('');
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    if (!userData || !bookingData) return;

    setIsVerifyingOtp(true);
    setError('');

    try {
      // Step 1: Verify OTP
      const verifyResponse = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: userData.phone_number,
          code 
        }),
      });

      const verifyData = await safeJsonParse(verifyResponse);

      if (!verifyResponse.ok) {
        throw new Error(verifyData.error || 'Failed to verify OTP');
      }

      // Step 1.5: If edit mode, cancel the original booking first
      if (bookingData.isEditMode && bookingData.originalBookingId) {
        try {
          const cancelResponse = await fetch('/api/bookings/cancel-silent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bookingId: bookingData.originalBookingId,
              phone: userData.phone_number,
              reason: 'Booking modified by user',
            }),
          });
          
          if (!cancelResponse.ok) {
            const cancelData = await safeJsonParse(cancelResponse);
            console.warn('Failed to cancel original booking:', cancelData.error);
          }
        } catch (cancelErr) {
          console.warn('Error cancelling original booking:', cancelErr);
        }
      }

      // Step 2: OTP verified - immediately create booking
      const bookResponse = await fetch('/api/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: userData.phone_number,
          name: userData.name,
          session_type: bookingData.sessionType,
          session_details: getSessionDetails(bookingData),
          studio: bookingData.studio,
          date: bookingData.date,
          start_time: bookingData.start_time,
          end_time: bookingData.end_time,
          rate_per_hour: bookingData.rate,
          is_modification: bookingData.isEditMode || false,
        }),
      });

      const bookData = await safeJsonParse(bookResponse);

      if (!bookResponse.ok || !bookData.success) {
        throw new Error(bookData.error || 'Failed to create booking');
      }

      // Success! Show confirmation
      setBookingConfirmed(true);
      setConfirmedBookingId(bookData.booking.id);
      setShowOtpVerification(false);
      
      // Store verified user for potential rebooking without OTP
      sessionStorage.setItem('verifiedUser', JSON.stringify(userData));
      
      // Store booking ID for confirmation page
      sessionStorage.removeItem('bookingData');
      sessionStorage.setItem('lastBookingId', bookData.booking.id);
      
      // Redirect to confirmation page after a short delay
      setTimeout(() => {
        router.push('/confirmation');
      }, 2500);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify OTP');
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    handleVerifyOtpAndBook();
  };

  // Direct booking for already verified users (no OTP needed) or edit mode
  const handleDirectBooking = async () => {
    if (!userData || !bookingData) return;

    setIsConfirmingBooking(true);
    setError('');

    try {
      // If in edit mode, first cancel the original booking (silently)
      if (bookingData.isEditMode && bookingData.originalBookingId) {
        try {
          const cancelResponse = await fetch('/api/bookings/cancel-silent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bookingId: bookingData.originalBookingId,
              phone: userData.phone_number,
              reason: 'Booking modified by user',
            }),
          });
          
          if (!cancelResponse.ok) {
            const cancelData = await safeJsonParse(cancelResponse);
            console.warn('Failed to cancel original booking:', cancelData.error);
            // Continue with new booking anyway - old booking will remain
          }
        } catch (cancelErr) {
          console.warn('Error cancelling original booking:', cancelErr);
          // Continue with new booking anyway
        }
      }

      const bookResponse = await fetch('/api/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: userData.phone_number,
          name: userData.name,
          session_type: bookingData.sessionType,
          session_details: getSessionDetails(bookingData),
          studio: bookingData.studio,
          date: bookingData.date,
          start_time: bookingData.start_time,
          end_time: bookingData.end_time,
          rate_per_hour: bookingData.rate,
          is_modification: bookingData.isEditMode || false,
        }),
      });

      const bookData = await safeJsonParse(bookResponse);

      if (!bookResponse.ok || !bookData.success) {
        throw new Error(bookData.error || 'Failed to create booking');
      }

      // Success! Show confirmation
      setBookingConfirmed(true);
      setConfirmedBookingId(bookData.booking.id);
      
      // Store booking ID for confirmation page
      sessionStorage.removeItem('bookingData');
      sessionStorage.setItem('lastBookingId', bookData.booking.id);
      
      // Redirect to confirmation page after a short delay
      setTimeout(() => {
        router.push('/confirmation');
      }, 2500);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create booking');
    } finally {
      setIsConfirmingBooking(false);
    }
  };

  const calculateDuration = (start: string, end: string): number => {
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    return (endMinutes - startMinutes) / 60;
  };

  if (!bookingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-12 h-12 text-violet-500" />
        </motion.div>
      </div>
    );
  }

  const duration = calculateDuration(bookingData.start_time, bookingData.end_time);
  const totalCost = duration * bookingData.rate;
  const sessionDetails = getSessionDetailsLabel(bookingData);

  const summaryItems = [
    { icon: <Mic className="w-5 h-5" />, label: 'Session Type', value: bookingData.sessionType },
    ...(sessionDetails ? [{ icon: <Users className="w-5 h-5" />, label: 'Details', value: sessionDetails }] : []),
    { icon: <Building2 className="w-5 h-5" />, label: 'Studio', value: bookingData.studio },
    { 
      icon: <Calendar className="w-5 h-5" />, 
      label: 'Date', 
      value: new Date(bookingData.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    },
    { icon: <Clock className="w-5 h-5" />, label: 'Time', value: `${bookingData.start_time} - ${bookingData.end_time}` },
    { icon: <Wallet className="w-5 h-5" />, label: 'Rate per Hour', value: `₹${bookingData.rate.toLocaleString('en-IN')}` },
  ];

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
            href="/booking"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Booking
          </Link>
          
          <h1 className="text-4xl font-bold text-white mb-2">
            {bookingData?.isEditMode ? 'Update Your Booking' : 'Review Your Booking'}
          </h1>
          <p className="text-zinc-400">
            {bookingData?.isEditMode 
              ? 'Review your updated booking details before confirming'
              : 'Please confirm your booking details before proceeding'
            }
          </p>
        </motion.div>

        {/* Booking Summary Card */}
        <motion.div 
          className="glass-strong rounded-3xl p-8 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <motion.div 
            className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Booking Summary</h2>
              <p className="text-zinc-400 text-sm">ID: {bookingData.user_id}</p>
            </div>
          </motion.div>

          <motion.div 
            className="space-y-4"
            initial="initial"
            animate="animate"
            variants={{
              animate: { transition: { staggerChildren: 0.05 } }
            }}
          >
            {summaryItems.map((item, index) => (
              <motion.div 
                key={index}
                className="flex justify-between items-center py-3 border-b border-white/5"
                variants={fadeInUp}
              >
                <div className="flex items-center gap-3">
                  <span className="text-zinc-500">{item.icon}</span>
                  <span className="text-zinc-400">{item.label}</span>
                </div>
                <span className="text-white font-medium">{item.value}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Total */}
          <motion.div 
            className="mt-6 pt-6 border-t border-white/10"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex justify-between items-center">
              <div>
                <span className="text-zinc-400">Total Amount</span>
                <p className="text-zinc-500 text-sm">{duration} hour{duration !== 1 ? 's' : ''}</p>
              </div>
              <motion.span 
                className="text-3xl font-bold gradient-text-accent"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6, type: "spring", stiffness: 300 }}
              >
                ₹{totalCost.toLocaleString('en-IN')}
              </motion.span>
            </div>
          </motion.div>
        </motion.div>

        {/* User Details Card */}
        <motion.div 
          className="glass-strong rounded-3xl p-8 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <motion.div 
            className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <User className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Your Details</h2>
              <p className="text-zinc-400 text-sm">Enter your phone number to continue</p>
            </div>
          </motion.div>

          {!userData && !needsSignup && (
            <motion.div className="space-y-4" variants={fadeInUp}>
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
                      const value = e.target.value.replace(/\D/g, '');
                      setPhoneNumber(value);
                    }}
                    placeholder="Enter 10-digit number"
                    className="w-full py-3.5 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                    maxLength={10}
                    autoComplete="tel"
                    inputMode="numeric"
                  />
                </div>
              </div>
              <motion.button
                type="button"
                onClick={handlePhoneCheck}
                disabled={isCheckingUser || phoneNumber.replace(/\D/g, '').length !== 10}
                className="w-full btn-accent py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isCheckingUser ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Checking...
                  </>
                ) : (
                  'Continue'
                )}
              </motion.button>
            </motion.div>
          )}

          {needsSignup && !userData && (
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-zinc-400 text-sm mb-4">
                Welcome! Please enter your details to create an account.
              </p>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-zinc-400 mb-2.5">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full py-3.5 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                    autoComplete="name"
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-zinc-400 mb-2.5">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full py-3.5 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>
              <motion.button
                type="button"
                onClick={handleSignup}
                disabled={isCheckingUser || !name.trim() || !email.includes('@')}
                className="w-full btn-accent py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isCheckingUser ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account & Continue'
                )}
              </motion.button>
            </motion.div>
          )}

          {userData && (
            <motion.div 
              className="space-y-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-3">
                <Check className="w-5 h-5 text-green-400" />
                <span className="text-green-400">Account verified</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-zinc-500" />
                  <span className="text-zinc-400">Name</span>
                </div>
                <span className="text-white font-medium">{userData.name}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-zinc-500" />
                  <span className="text-zinc-400">Phone</span>
                </div>
                <span className="text-white font-medium">{userData.phone_number}</span>
              </div>
              {userData.email && (
                <div className="flex justify-between items-center py-3">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-zinc-500" />
                    <span className="text-zinc-400">Email</span>
                  </div>
                  <span className="text-white font-medium">{userData.email}</span>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* OTP Verification Card */}
        {userData && !bookingConfirmed && (
          <motion.div 
            className="glass-strong rounded-3xl p-8 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <motion.div 
              className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className={`w-12 h-12 rounded-xl ${isAlreadyVerified ? 'bg-green-500/20' : 'bg-amber-500/20'} flex items-center justify-center`}>
                <Shield className={`w-6 h-6 ${isAlreadyVerified ? 'text-green-400' : 'text-amber-400'}`} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {isAlreadyVerified ? 'Confirm Booking' : 'Verify & Confirm Booking'}
                </h2>
                <p className="text-zinc-400 text-sm">
                  {isAlreadyVerified ? 'Your phone number is already verified' : 'Enter OTP to confirm your booking'}
                </p>
              </div>
            </motion.div>

            {/* Already verified - Direct confirm */}
            {isAlreadyVerified ? (
              <motion.div 
                className="text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center gap-3 mb-6">
                  <Check className="w-5 h-5 text-green-400" />
                  <span className="text-green-400">Phone verified from previous booking</span>
                </div>
                <p className="text-zinc-400 mb-6">
                  Click below to confirm your booking for <span className="text-white font-medium">{userData.phone_number}</span>
                </p>
                <motion.button
                  type="button"
                  onClick={handleDirectBooking}
                  disabled={isConfirmingBooking}
                  className="btn-accent py-3 px-8 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isConfirmingBooking ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Confirming Booking...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Confirm Booking
                    </>
                  )}
                </motion.button>
              </motion.div>
            ) : !showOtpVerification ? (
              <motion.div 
                className="text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <p className="text-zinc-400 mb-6">
                  Click below to receive a 6-digit verification code on your phone number
                  <span className="text-white font-medium ml-1">{userData.phone_number}</span>
                </p>
                <motion.button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isSendingOtp}
                  className="btn-accent py-3 px-8 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isSendingOtp ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5" />
                      Send OTP via SMS
                    </>
                  )}
                </motion.button>
              </motion.div>
            ) : (
              <motion.div 
                className="space-y-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-400" />
                  <span className="text-green-400">OTP sent to your phone!</span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-4 text-center">
                    Enter the 6-digit OTP
                  </label>
                  <div className="flex justify-center gap-2 sm:gap-3 max-w-sm mx-auto">
                    {otp.map((digit, index) => (
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
                        className="w-11 h-13 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-bold rounded-xl bg-white/5 border border-white/10 text-white focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all"
                      />
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <motion.button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={isVerifyingOtp || otp.join('').length !== 6}
                    className="flex-1 btn-accent py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isVerifyingOtp ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Confirming Booking...
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        Verify & Confirm
                      </>
                    )}
                  </motion.button>

                  <motion.button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={isSendingOtp || resendCooldown > 0}
                    className="flex-1 btn-secondary py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <RefreshCw className={`w-5 h-5 ${isSendingOtp ? 'animate-spin' : ''}`} />
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Booking Confirmed Success */}
        {bookingConfirmed && (
          <motion.div 
            className="glass-strong rounded-3xl p-8 mb-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center">
              <motion.div 
                className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <Check className="w-10 h-10 text-green-400" />
              </motion.div>
              <motion.h2 
                className="text-2xl font-bold text-white mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {bookingData?.isEditMode ? 'Your booking has been updated!' : 'Your booking is confirmed!'}
              </motion.h2>
              <motion.p 
                className="text-zinc-400 mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {bookingData?.isEditMode 
                  ? 'An update confirmation SMS has been sent to your phone.'
                  : 'A confirmation SMS has been sent to your phone.'
                }
              </motion.p>
              {confirmedBookingId && (
                <motion.p 
                  className="text-sm text-zinc-500"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  Booking ID: {confirmedBookingId.slice(0, 8)}
                </motion.p>
              )}
              <motion.div 
                className="mt-6 flex items-center justify-center gap-2 text-violet-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Redirecting to confirmation page...</span>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div 
              className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <p className="text-red-400">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons - Only show when booking is not yet confirmed */}
        {!bookingConfirmed && (
          <motion.div 
            className="flex flex-col sm:flex-row gap-3 sm:gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.button
              type="button"
              onClick={() => router.push('/booking')}
              disabled={isVerifyingOtp}
              className="w-full sm:flex-1 btn-secondary py-4 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Edit Booking
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
