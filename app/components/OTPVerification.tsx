'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Loader2, AlertCircle, RefreshCw, Smartphone, CheckCircle, X } from 'lucide-react';
import { getDeviceFingerprint, addTrustedPhone, isPhoneTrustedLocally } from '@/lib/deviceFingerprint';

interface OTPVerificationProps {
  phone: string;
  email: string;
  onVerified: () => void;
  onCancel?: () => void;
  actionLabel?: string; // e.g., "cancel booking", "edit booking", "complete booking"
  accentColor?: 'violet' | 'red' | 'blue';
}

export default function OTPVerification({
  phone,
  email,
  onVerified,
  onCancel,
  actionLabel = 'proceed',
  accentColor = 'violet',
}: OTPVerificationProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [isCheckingDevice, setIsCheckingDevice] = useState(true);
  const [deviceVerified, setDeviceVerified] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const colorClasses = {
    violet: {
      bg: 'bg-violet-500/20',
      text: 'text-violet-400',
      ring: 'focus:ring-violet-500',
      hover: 'hover:text-violet-300',
    },
    red: {
      bg: 'bg-red-500/20',
      text: 'text-red-400',
      ring: 'focus:ring-red-500',
      hover: 'hover:text-red-300',
    },
    blue: {
      bg: 'bg-blue-500/20',
      text: 'text-blue-400',
      ring: 'focus:ring-blue-500',
      hover: 'hover:text-blue-300',
    },
  };

  const colors = colorClasses[accentColor];

  // Check if device is already trusted
  const checkDeviceTrust = useCallback(async () => {
    setIsCheckingDevice(true);
    try {
      const digits = phone.replace(/\D/g, '');
      
      // First check local trust
      if (!isPhoneTrustedLocally(digits)) {
        setIsCheckingDevice(false);
        return;
      }

      // Verify with server
      const { fingerprint } = await getDeviceFingerprint();
      const response = await fetch('/api/auth/verify-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: digits, 
          deviceFingerprint: fingerprint 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.trusted) {
          setDeviceVerified(true);
          // Auto-proceed after a brief moment to show trusted status
          setTimeout(() => {
            onVerified();
          }, 1000);
          return;
        }
      }
    } catch (e) {
      console.error('Error checking device trust:', e);
    }
    setIsCheckingDevice(false);
  }, [phone, onVerified]);

  useEffect(() => {
    checkDeviceTrust();
  }, [checkDeviceTrust]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Send OTP after device check (if not trusted)
  useEffect(() => {
    if (!isCheckingDevice && !deviceVerified && !otpSent) {
      sendOTP();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCheckingDevice, deviceVerified]);

  const sendOTP = async () => {
    if (cooldown > 0) return;

    setIsSending(true);
    setError('');

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, email }),
      });

      const data = await response.json();

      if (response.ok) {
        setOtpSent(true);
        setCooldown(30);
        inputRefs.current[0]?.focus();
      } else {
        setError(data.error || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (error) setError('');

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (digit && index === 5) {
      const fullOtp = newOtp.join('');
      if (fullOtp.length === 6) {
        verifyOTP(fullOtp);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    
    if (pasted.length === 6) {
      const newOtp = pasted.split('');
      setOtp(newOtp);
      verifyOTP(pasted);
    }
  };

  const verifyOTP = async (code: string) => {
    setIsLoading(true);
    setError('');

    try {
      const { fingerprint, deviceName } = await getDeviceFingerprint();

      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          code,
          deviceFingerprint: fingerprint,
          deviceName,
        }),
      });

      const data = await response.json();

      if (response.ok && data.verified) {
        addTrustedPhone(phone);
        setDeviceVerified(true);
        setTimeout(() => {
          onVerified();
        }, 500);
      } else {
        setError(data.error || 'Invalid OTP');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
    }
    return phone;
  };

  // Device check in progress
  if (isCheckingDevice) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-strong rounded-2xl p-6 text-center"
      >
        <div className={`w-16 h-16 rounded-full ${colors.bg} flex items-center justify-center mx-auto mb-4`}>
          <Smartphone className={`w-8 h-8 ${colors.text}`} />
        </div>
        <div className="flex items-center justify-center gap-2 mb-2">
          <Loader2 className={`w-5 h-5 ${colors.text} animate-spin`} />
          <span className="text-white font-medium">Checking device...</span>
        </div>
        <p className="text-zinc-400 text-sm">Verifying if this device is trusted</p>
      </motion.div>
    );
  }

  // Device is verified - showing success briefly
  if (deviceVerified) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-strong rounded-2xl p-6 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4"
        >
          <CheckCircle className="w-8 h-8 text-green-400" />
        </motion.div>
        <h3 className="text-lg font-bold text-white mb-1">Device Verified</h3>
        <p className="text-zinc-400 text-sm">Proceeding to {actionLabel}...</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-strong rounded-2xl p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center`}>
            <Shield className={`w-6 h-6 ${colors.text}`} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Verify to {actionLabel}</h3>
            <p className="text-zinc-400 text-sm">Enter the OTP sent to your email</p>
          </div>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        )}
      </div>

      {/* Email info */}
      <div className="mb-6 p-3 rounded-xl bg-white/5 text-center">
        <p className="text-zinc-400 text-sm">
          OTP sent to <span className="text-white font-medium">{email}</span>
        </p>
        <p className="text-zinc-500 text-xs mt-1">
          Phone: {formatPhone(phone)}
        </p>
      </div>

      {/* OTP Input */}
      <div className="flex justify-center gap-2 mb-4">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => { inputRefs.current[index] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleOtpChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={isLoading}
            autoFocus={index === 0}
            className={`w-12 h-14 text-center text-xl font-bold rounded-xl border transition-all focus:outline-none focus:ring-2 ${colors.ring} ${
              error
                ? 'bg-red-500/10 border-red-500 text-red-400'
                : 'bg-zinc-800 border-zinc-700 text-white'
            } disabled:opacity-50`}
          />
        ))}
      </div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-center gap-2 text-red-400 text-sm mb-4"
          >
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading indicator */}
      {isLoading && (
        <div className={`flex items-center justify-center gap-2 text-sm ${colors.text} mb-4`}>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Verifying...</span>
        </div>
      )}

      {/* Verify button */}
      <motion.button
        onClick={() => verifyOTP(otp.join(''))}
        disabled={otp.some(d => !d) || isLoading}
        className={`w-full py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
          accentColor === 'red'
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : accentColor === 'blue'
            ? 'bg-blue-500 hover:bg-blue-600 text-white'
            : 'bg-violet-500 hover:bg-violet-600 text-white'
        }`}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        {isLoading ? 'Verifying...' : `Verify & ${actionLabel.charAt(0).toUpperCase() + actionLabel.slice(1)}`}
      </motion.button>

      {/* Resend OTP */}
      <div className="text-center mt-4">
        {cooldown > 0 ? (
          <p className="text-zinc-400 text-sm">
            Resend OTP in <span className={`${colors.text} font-medium`}>{cooldown}s</span>
          </p>
        ) : (
          <button
            onClick={sendOTP}
            disabled={isSending}
            className={`flex items-center justify-center gap-2 mx-auto ${colors.text} ${colors.hover} transition-colors text-sm`}
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span>{isSending ? 'Sending...' : 'Resend OTP'}</span>
          </button>
        )}
      </div>

      {/* Trust info */}
      <div className="flex items-center justify-center gap-2 text-xs text-zinc-500 mt-4 bg-zinc-800/50 rounded-lg px-3 py-2">
        <Smartphone className="w-3.5 h-3.5" />
        <span>This device will be remembered for future actions</span>
      </div>
    </motion.div>
  );
}
