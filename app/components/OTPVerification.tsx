'use client';

// The one OTP screen for new / edit / cancel booking flows.
// Skips straight to onVerified if this device is already trusted for the phone.

import { useState, useEffect, useCallback, useRef } from 'react';
import { Shield, AlertCircle, RefreshCw, Smartphone, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Spinner } from '@/components/ui/spinner';
import { getDeviceFingerprint, addTrustedPhone, isPhoneTrustedLocally } from '@/lib/deviceFingerprint';

export interface OTPVerifiedInfo {
  deviceTrusted: boolean;
  fingerprint: string;
}

interface OTPVerificationProps {
  /** Omit to verify by email alone (the server finds the phone and uses its stored email). */
  phone?: string;
  email: string;
  onVerified: (info: OTPVerifiedInfo) => void;
  actionLabel?: string; // e.g. "cancel booking", "edit booking", "complete booking"
  /** Red verify button, for destructive actions like cancelling. */
  destructive?: boolean;
}

export default function OTPVerification({
  phone,
  email,
  onVerified,
  actionLabel = 'proceed',
  destructive = false,
}: OTPVerificationProps) {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [isCheckingDevice, setIsCheckingDevice] = useState(true);
  const [deviceVerified, setDeviceVerified] = useState(false);
  const [sentTo, setSentTo] = useState('');
  const inFlight = useRef(false);
  // Who the code is for: phone when known, otherwise the email
  const identity = phone ? { phone } : { email };

  const checkDeviceTrust = useCallback(async () => {
    setIsCheckingDevice(true);
    try {
      // Device trust is per phone; email-only verification always uses a code
      if (!phone) {
        setIsCheckingDevice(false);
        return;
      }
      const digits = phone.replace(/\D/g, '');
      if (!isPhoneTrustedLocally(digits)) {
        setIsCheckingDevice(false);
        return;
      }

      const { fingerprint } = await getDeviceFingerprint();
      const response = await fetch('/api/auth/verify-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: digits, deviceFingerprint: fingerprint }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.trusted) {
          setDeviceVerified(true);
          // Brief pause so the "verified" state is visible
          setTimeout(() => onVerified({ deviceTrusted: true, fingerprint }), 1000);
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

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Send OTP once we know the device isn't trusted
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
        body: JSON.stringify({ ...identity, email }),
      });
      const data = await response.json();

      if (response.ok) {
        setOtpSent(true);
        setSentTo(data.sentTo || '');
        setCooldown(30);
      } else {
        setError(data.error || 'Failed to send OTP');
      }
    } catch {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const verifyOTP = async (code: string) => {
    // onComplete + the button can both fire; only one request at a time
    if (inFlight.current) return;
    inFlight.current = true;
    setIsLoading(true);
    setError('');

    try {
      const { fingerprint, deviceName } = await getDeviceFingerprint();
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...identity, code, deviceFingerprint: fingerprint, deviceName }),
      });
      const data = await response.json();

      if (response.ok && data.verified) {
        if (phone) addTrustedPhone(phone);
        setDeviceVerified(true);
        setTimeout(() => onVerified({ deviceTrusted: !!data.deviceTrusted, fingerprint }), 500);
      } else {
        setError(data.error || 'Invalid OTP');
        setOtp('');
      }
    } catch {
      setError('Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
      inFlight.current = false;
    }
  };

  const formatPhone = (p: string) => {
    const digits = p.replace(/\D/g, '');
    return digits.length === 10 ? `+91 ${digits.slice(0, 5)} ${digits.slice(5)}` : p;
  };

  const label = actionLabel.charAt(0).toUpperCase() + actionLabel.slice(1);

  if (isCheckingDevice) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <div className="p-4 rounded-full bg-primary/15 text-primary">
          <Smartphone className="size-8" />
        </div>
        <span className="flex items-center gap-2 font-medium">
          <Spinner className="size-5 text-primary" /> Checking device...
        </span>
        <p className="text-muted-foreground text-sm">Verifying if this device is trusted</p>
      </div>
    );
  }

  if (deviceVerified) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <div className="p-4 rounded-full bg-emerald-500/15 text-emerald-400">
          <CheckCircle className="size-8" />
        </div>
        <h3 className="text-lg font-bold">Verified</h3>
        <p className="text-muted-foreground text-sm">Proceeding to {actionLabel}...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 pt-2">
      <div className="p-3 rounded-full bg-primary/15 text-primary">
        <Shield className="size-8" />
      </div>

      <div className="w-full rounded-xl bg-muted p-3 text-center">
        <p className="text-muted-foreground text-sm">
          Code sent to <span className="text-foreground font-medium">{sentTo || 'your email'}</span>
        </p>
        {phone && <p className="text-muted-foreground text-xs mt-1">Phone: {formatPhone(phone)}</p>}
      </div>

      <InputOTP
        maxLength={6}
        value={otp}
        onChange={(v) => {
          setOtp(v);
          if (error) setError('');
        }}
        onComplete={verifyOTP}
        disabled={isLoading}
        inputMode="numeric"
        pattern="^[0-9]*$"
        autoFocus
        aria-label="6-digit verification code"
      >
        <InputOTPGroup className="gap-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <InputOTPSlot
              key={i}
              index={i}
              aria-invalid={!!error}
              className="size-12 rounded-xl border text-xl font-bold first:rounded-xl last:rounded-xl"
            />
          ))}
        </InputOTPGroup>
      </InputOTP>

      {error && (
        <Alert variant="destructive" className="w-auto">
          <AlertCircle />
          <AlertDescription className="text-destructive">{error}</AlertDescription>
        </Alert>
      )}

      <Button
        onClick={() => verifyOTP(otp)}
        disabled={otp.length < 6 || isLoading}
        className={`w-full h-11 font-semibold ${
          destructive ? 'bg-destructive text-white hover:bg-destructive/90' : ''
        }`}
      >
        {isLoading ? (
          <>
            <Spinner /> Verifying...
          </>
        ) : (
          `Verify & ${label}`
        )}
      </Button>

      {cooldown > 0 ? (
        <p className="text-muted-foreground text-sm">
          Resend code in <span className="text-primary font-medium">{cooldown}s</span>
        </p>
      ) : (
        <Button variant="link" onClick={sendOTP} disabled={isSending}>
          {isSending ? <Spinner /> : <RefreshCw />}
          {isSending ? 'Sending...' : 'Resend code'}
        </Button>
      )}

      <p className="flex items-center gap-2 text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">
        <Smartphone className="size-3.5" />
        This device will be remembered for future bookings
      </p>
    </div>
  );
}
