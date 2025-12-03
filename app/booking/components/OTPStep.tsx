'use client';

import { useState, useRef, useEffect } from 'react';
import { Shield, Smartphone, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useBooking } from '../contexts/BookingContext';
import StepLayout from './StepLayout';
import { getDeviceFingerprint, addTrustedPhone } from '@/lib/deviceFingerprint';

export default function OTPStep() {
  const { draft, updateDraft, nextStep, stepIndex } = useBooking();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // OTP is ALWAYS required - no device trust skip

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Send OTP on mount - always required
  useEffect(() => {
    if (!otpSent) {
      sendOTP();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendOTP = async () => {
    if (cooldown > 0) return;

    setIsSending(true);
    setError('');

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: draft.phone }),
      });

      const data = await response.json();

      if (response.ok) {
        setOtpSent(true);
        setCooldown(30);
        // Focus first input
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
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1);
    
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Clear error on input
    if (error) setError('');

    // Move to next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all digits entered
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
          phone: draft.phone,
          code,
          deviceFingerprint: fingerprint,
          deviceName,
        }),
      });

      const data = await response.json();

      if (response.ok && data.verified) {
        // Mark device as trusted locally
        addTrustedPhone(draft.phone);
        
        updateDraft({
          otpVerified: true,
          deviceTrusted: data.deviceTrusted,
          deviceFingerprint: fingerprint,
        });
        
        // Proceed to confirm step
        nextStep();
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

  // Format phone for display
  const formatPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
    }
    return phone;
  };

  return (
    <StepLayout
      title={draft.isEditMode ? "Verify to update booking" : "Verify your phone"}
      subtitle={`Enter the 6-digit code sent to ${formatPhone(draft.phone)}`}
      showNext={false}
      hideFooter={false}
    >
      <div className="flex flex-col items-center justify-center space-y-4">
        {/* OTP Icon */}
        <div className={`p-4 rounded-full ${draft.isEditMode ? 'bg-blue-500/20' : 'bg-violet-500/20'}`}>
          <Shield className={`w-10 h-10 ${draft.isEditMode ? 'text-blue-400' : 'text-violet-400'}`} />
        </div>

        {/* OTP Input */}
        <div className="flex gap-2">
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
              className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border transition-all focus:outline-none focus:ring-2 ${
                draft.isEditMode ? 'focus:ring-blue-500' : 'focus:ring-violet-500'
              } ${
                error
                  ? 'bg-red-500/10 border-red-500 text-red-400'
                  : 'bg-zinc-800 border-zinc-700 text-white'
              } disabled:opacity-50`}
            />
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className={`flex items-center gap-2 ${draft.isEditMode ? 'text-blue-400' : 'text-violet-400'}`}>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Verifying...</span>
          </div>
        )}

        {/* Resend OTP */}
        <div className="text-center">
          {cooldown > 0 ? (
            <p className="text-zinc-400 text-sm">
              Resend OTP in <span className={`${draft.isEditMode ? 'text-blue-400' : 'text-violet-400'} font-medium`}>{cooldown}s</span>
            </p>
          ) : (
            <button
              onClick={sendOTP}
              disabled={isSending}
              className={`flex items-center gap-2 ${draft.isEditMode ? 'text-blue-400 hover:text-blue-300' : 'text-violet-400 hover:text-violet-300'} transition-colors text-sm`}
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

        {/* Trust device info */}
        <div className="flex items-center gap-2 text-xs text-zinc-500 bg-zinc-800/50 rounded-lg px-3 py-2">
          <Smartphone className="w-4 h-4" />
          <span>This device will be remembered for future bookings</span>
        </div>
      </div>
    </StepLayout>
  );
}
