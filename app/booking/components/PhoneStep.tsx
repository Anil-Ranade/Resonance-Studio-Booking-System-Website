'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, Smartphone, Shield, RotateCcw, User, Mail, Loader2, CheckCircle } from 'lucide-react';
import { useBooking } from '../contexts/BookingContext';
import StepLayout from './StepLayout';
import { getDeviceFingerprint, isPhoneTrustedLocally } from '@/lib/deviceFingerprint';

export default function PhoneStep() {
  const router = useRouter();
  const { draft, updateDraft, nextStep, resetDraft } = useBooking();
  const [phone, setPhone] = useState(draft.phone);
  const [name, setName] = useState(draft.name);
  const [email, setEmail] = useState(draft.email);
  const [isTrustedDevice, setIsTrustedDevice] = useState(false);
  const [isCheckingDevice, setIsCheckingDevice] = useState(true);
  const [isCheckingUser, setIsCheckingUser] = useState(false);
  const [isExistingUser, setIsExistingUser] = useState(draft.isExistingUser);
  const [userChecked, setUserChecked] = useState(false);

  // Check if user exists when phone number is complete
  const checkExistingUser = useCallback(async (phoneDigits: string) => {
    if (phoneDigits.length !== 10) {
      setUserChecked(false);
      setIsExistingUser(false);
      return;
    }

    setIsCheckingUser(true);
    try {
      const response = await fetch('/api/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneDigits }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          // Existing user - populate name and email
          setName(data.user.name || '');
          setEmail(data.user.email || '');
          setIsExistingUser(true);
          updateDraft({ 
            name: data.user.name || '', 
            email: data.user.email || '',
            isExistingUser: true 
          });
        } else if (data.needsSignup) {
          // New user - clear fields
          setName('');
          setEmail('');
          setIsExistingUser(false);
          updateDraft({ name: '', email: '', isExistingUser: false });
        }
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setIsCheckingUser(false);
      setUserChecked(true);
    }
  }, [updateDraft]);

  // Check device trust on mount
  useEffect(() => {
    const checkDevice = async () => {
      setIsCheckingDevice(true);
      try {
        const { fingerprint, deviceName } = await getDeviceFingerprint();
        updateDraft({ deviceFingerprint: fingerprint });
        
        // Check if device is trusted locally
        const digits = phone.replace(/\D/g, '');
        if (digits.length === 10 && isPhoneTrustedLocally(digits)) {
          setIsTrustedDevice(true);
          
          // Verify with server
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
              updateDraft({ deviceTrusted: true });
            }
          }
        }
      } catch (e) {
        console.error('Error checking device:', e);
      }
      setIsCheckingDevice(false);
    };
    
    checkDevice();
  }, [phone, updateDraft]);

  // Format phone number as user types
  const handlePhoneChange = (value: string) => {
    // Only allow digits
    const digits = value.replace(/\D/g, '');
    
    // Limit to 10 digits
    const limited = digits.slice(0, 10);
    
    // Format as XXXXX XXXXX
    let formatted = limited;
    if (limited.length > 5) {
      formatted = `${limited.slice(0, 5)} ${limited.slice(5)}`;
    }
    
    setPhone(formatted);
    updateDraft({ phone: limited });
    
    // Reset user check state when phone changes
    if (limited.length !== 10) {
      setUserChecked(false);
      setIsExistingUser(false);
    }
    
    // Check trust when phone changes
    if (limited.length === 10) {
      setIsTrustedDevice(isPhoneTrustedLocally(limited));
      // Check if user exists
      checkExistingUser(limited);
    } else {
      setIsTrustedDevice(false);
    }
  };

  const handleNameChange = (value: string) => {
    setName(value);
    updateDraft({ name: value });
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    updateDraft({ email: value });
  };

  const handleNext = () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      updateDraft({ phone: digits, name, email, isExistingUser });
      nextStep();
    }
  };

  const handleBack = () => {
    // In edit mode, go back to my-bookings page and reset draft
    resetDraft();
    router.push('/my-bookings');
  };

  // Validate: phone must be 10 digits, and for new users name and email are required
  const phoneValid = phone.replace(/\D/g, '').length === 10;
  const emailValid = email.trim() === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isValid = phoneValid && userChecked && (isExistingUser || (name.trim() !== '' && email.trim() !== '' && emailValid));

  return (
    <StepLayout
      title={draft.isEditMode ? "Verify your phone" : "Enter your phone number"}
      subtitle={draft.isEditMode 
        ? "Confirm your phone number to modify this booking"
        : "We'll use this to send booking confirmations"}
      showBack={draft.isEditMode}
      showNext={true}
      onBack={draft.isEditMode ? handleBack : undefined}
      onNext={handleNext}
      isNextDisabled={!isValid || isCheckingUser}
    >
      <div className="space-y-3">
        {/* Edit Mode Banner */}
        {draft.isEditMode && draft.originalChoices && (
          <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-violet-400" />
            <span className="text-xs text-violet-400">
              Modifying your <span className="font-medium">{draft.originalChoices.sessionType}</span> booking
            </span>
          </div>
        )}
        
        {/* Phone input */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-zinc-400">
            <Phone className="w-4 h-4" />
            <span className="text-white font-medium text-sm">+91</span>
          </div>
          <input
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder="98765 43210"
            className="w-full bg-zinc-800/50 border-2 border-zinc-600 rounded-xl pl-20 pr-10 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
            autoFocus
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {isCheckingUser && (
              <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
            )}
            {!isCheckingUser && isTrustedDevice && phoneValid && (
              <Shield className="w-4 h-4 text-green-400" />
            )}
          </div>
        </div>

        {/* User status indicator */}
        {phoneValid && userChecked && !isCheckingUser && (
          <div className={`flex items-center gap-2 text-xs rounded-lg px-3 py-2 ${
            isExistingUser 
              ? 'text-green-400 bg-green-500/10' 
              : 'text-amber-400 bg-amber-500/10'
          }`}>
            {isExistingUser ? (
              <>
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Welcome back! Your details have been auto-filled.</span>
              </>
            ) : (
              <>
                <User className="w-3.5 h-3.5" />
                <span>New user - please enter your name and email below.</span>
              </>
            )}
          </div>
        )}

        {/* Name input */}
        {phoneValid && userChecked && (
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder={isExistingUser ? "Your name" : "Your name (required)"}
              className={`w-full bg-zinc-800/50 border-2 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all ${
                isExistingUser ? 'border-zinc-600' : 'border-zinc-600'
              } ${isExistingUser ? 'opacity-75' : ''}`}
              readOnly={isExistingUser}
            />
          </div>
        )}

        {/* Email input */}
        {phoneValid && userChecked && (
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder={isExistingUser ? "Your email" : "Your email (required)"}
              className={`w-full bg-zinc-800/50 border-2 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all ${
                isExistingUser ? 'border-zinc-600' : 'border-zinc-600'
              } ${isExistingUser ? 'opacity-75' : ''}`}
              readOnly={isExistingUser}
            />
          </div>
        )}

        {/* Info text */}
        <p className="text-xs text-zinc-500">
          By continuing, you agree to receive SMS messages from Resonance Studio for booking confirmations.
        </p>
      </div>
    </StepLayout>
  );
}
