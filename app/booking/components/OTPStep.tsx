'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Shield, Smartphone, Loader2, AlertCircle, RefreshCw, CheckCircle } from 'lucide-react';
import { useBooking } from '../contexts/BookingContext';
import StepLayout from './StepLayout';
import { getDeviceFingerprint, addTrustedPhone, isPhoneTrustedLocally } from '@/lib/deviceFingerprint';

export default function OTPStep() {
  const { draft, updateDraft, nextStep, prevStep } = useBooking();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [isCheckingDevice, setIsCheckingDevice] = useState(true);
  const [deviceVerified, setDeviceVerified] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Check if device is already trusted
  const checkDeviceTrust = useCallback(async () => {
    // If already verified (e.g., in edit mode coming from edit-booking page), skip
    if (draft.otpVerified) {
      nextStep();
      return;
    }

    setIsCheckingDevice(true);
    try {
      const digits = draft.phone.replace(/\D/g, '');
      
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
          updateDraft({ 
            deviceTrusted: true, 
            otpVerified: true,
            deviceFingerprint: fingerprint 
          });
          // Auto-proceed after a brief moment to show trusted status
          setTimeout(() => {
            nextStep();
          }, 1000);
          return;
        }
      }
    } catch (e) {
      console.error('Error checking device trust:', e);
    }
    setIsCheckingDevice(false);
  }, [draft.phone, draft.otpVerified, nextStep, updateDraft]);

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
    if (!isCheckingDevice && !deviceVerified && !otpSent && !draft.otpVerified) {
      sendOTP();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCheckingDevice, deviceVerified, draft.otpVerified]);

  const sendOTP = async () => {
    if (cooldown > 0) return;

    setIsSending(true);
    setError('');

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: draft.phone, email: draft.email }),
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
        
        setDeviceVerified(true);
        // Proceed to confirm step
        setTimeout(() => {
          nextStep();
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

  const isOtpComplete = otp.every(digit => digit !== '');

  const handleNext = () => {
    if (isOtpComplete) {
      verifyOTP(otp.join(''));
    }
  };

  const handleBack = () => {
    prevStep();
  };

  // Device check in progress
  if (isCheckingDevice) {
    return (
      <StepLayout
        title="Verifying device..."
        subtitle="Checking if this device is trusted"
        showNext={false}
        hideFooter={true}
      >
        <div className="flex flex-col items-center justify-center py-8">
          <div className={`p-4 rounded-full ${draft.isEditMode ? 'bg-blue-500/20' : 'bg-violet-500/20'} mb-4`}>
            <Smartphone className={`w-10 h-10 ${draft.isEditMode ? 'text-blue-400' : 'text-violet-400'}`} />
          </div>
          <div className="flex items-center gap-2">
            <Loader2 className={`w-5 h-5 ${draft.isEditMode ? 'text-blue-400' : 'text-violet-400'} animate-spin`} />
            <span className="text-white font-medium">Checking device...</span>
          </div>
        </div>
      </StepLayout>
    );
  }

  // Device is verified - showing success briefly
  if (deviceVerified) {
    return (
      <StepLayout
        title="Device Verified"
        subtitle={`Proceeding to ${draft.isEditMode ? 'update' : 'confirm'} your booking...`}
        showNext={false}
        hideFooter={true}
      >
        <div className="flex flex-col items-center justify-center py-8">
          <div className="p-4 rounded-full bg-green-500/20 mb-4">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <span className="text-white font-medium">Verified Successfully</span>
        </div>
      </StepLayout>
    );
  }

  return (
    <StepLayout
      title={draft.isEditMode ? "Verify to update booking" : "Verify to complete booking"}
      subtitle={`Enter the 6-digit code sent to ${draft.email}`}
      showBack={true}
      showNext={true}
      onBack={handleBack}
      nextLabel="Verify"
      onNext={handleNext}
      isNextDisabled={!isOtpComplete || isLoading}
      isLoading={isLoading}
      hideFooter={false}
    >
      <div className="flex flex-col items-center justify-center space-y-3">
        {/* OTP Icon */}
        <div className={`p-3 rounded-full ${draft.isEditMode ? 'bg-blue-500/20' : 'bg-violet-500/20'}`}>
          <Shield className={`w-8 h-8 ${draft.isEditMode ? 'text-blue-400' : 'text-violet-400'}`} />
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
              className={`w-11 h-12 text-center text-xl font-bold rounded-xl border transition-all focus:outline-none focus:ring-2 ${
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
          <div className="flex items-center gap-2 text-red-400 text-xs">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className={`flex items-center gap-2 text-sm ${draft.isEditMode ? 'text-blue-400' : 'text-violet-400'}`}>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Verifying...</span>
          </div>
        )}

        {/* Resend OTP */}
        <div className="text-center">
          {cooldown > 0 ? (
            <p className="text-zinc-400 text-xs">
              Resend OTP in <span className={`${draft.isEditMode ? 'text-blue-400' : 'text-violet-400'} font-medium`}>{cooldown}s</span>
            </p>
          ) : (
            <button
              onClick={sendOTP}
              disabled={isSending}
              className={`flex items-center gap-2 ${draft.isEditMode ? 'text-blue-400 hover:text-blue-300' : 'text-violet-400 hover:text-violet-300'} transition-colors text-xs`}
            >
              {isSending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              <span>{isSending ? 'Sending...' : 'Resend OTP'}</span>
            </button>
          )}
        </div>

        {/* Trust device info */}
        <div className="flex items-center gap-2 text-xs text-zinc-500 bg-zinc-800/50 rounded-lg px-3 py-2">
          <Smartphone className="w-3.5 h-3.5" />
          <span>This device will be remembered for future bookings</span>
        </div>
      </div>
    </StepLayout>
  );
}
