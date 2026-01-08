"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Phone,
  Smartphone,
  Shield,
  RotateCcw,
  User,
  Mail,
  Loader2,
  CheckCircle,
  UserCheck,
  ArrowRight,
} from "lucide-react";
import { useBooking } from "../contexts/BookingContext";
import StepLayout from "./StepLayout";
import {
  getDeviceFingerprint,
  isPhoneTrustedLocally,
  getTrustedPhones,
  checkAutoLogin,
} from "@/lib/deviceFingerprint";

export default function PhoneStep() {
  const router = useRouter();
  const { draft, updateDraft, nextStep, resetDraft, mode } = useBooking();

  // Format phone for display - ensure we always start with properly formatted phone
  const formatPhoneForDisplay = (phoneDigits: string) => {
    const digits = phoneDigits.replace(/\D/g, "").slice(0, 10);
    if (digits.length > 5) {
      return `${digits.slice(0, 5)} ${digits.slice(5)}`;
    }
    return digits;
  };

  const [phone, setPhone] = useState(() => formatPhoneForDisplay(draft.phone));
  const [name, setName] = useState(draft.name);
  const [email, setEmail] = useState(draft.email);
  const [isTrustedDevice, setIsTrustedDevice] = useState(false);
  const [isCheckingDevice, setIsCheckingDevice] = useState(true);
  const [isCheckingUser, setIsCheckingUser] = useState(false);
  const [isExistingUser, setIsExistingUser] = useState(draft.isExistingUser);
  const [canOverrideEmail, setCanOverrideEmail] = useState(false);
  const [userChecked, setUserChecked] = useState(false);

  // Auto-login state
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(true);
  const [autoLoginUser, setAutoLoginUser] = useState<{
    phone: string;
    name: string;
    email: string;
  } | null>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);

  // Check if user exists when phone number is complete
  const checkExistingUser = useCallback(
    async (phoneDigits: string) => {
      if (phoneDigits.length !== 10) {
        setUserChecked(false);
        setIsExistingUser(false);
        return;
      }

      setIsCheckingUser(true);
      try {
        const response = await fetch("/api/check-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: phoneDigits }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            // Existing user - populate name and email
            setName(data.user.name || "");
            setEmail(data.user.email || "");
            setIsExistingUser(true);
            setCanOverrideEmail(!!data.isAdminEmail);
            updateDraft({
              name: data.user.name || "",
              email: data.user.email || "",
              isExistingUser: true,
            });
          } else if (data.needsSignup) {
            // New user - clear fields
            setName("");
            setEmail("");
            setIsExistingUser(false);
            updateDraft({ name: "", email: "", isExistingUser: false });
          }
        }
      } catch (error) {
        console.error("Error checking user:", error);
      } finally {
        setIsCheckingUser(false);
        setUserChecked(true);
      }
    },
    [updateDraft]
  );

  // Auto-login check on mount - check if device is trusted for auto-authentication
  useEffect(() => {
    // Skip auto-login check in edit mode (user already identified)
    if (draft.isEditMode) {
      setIsAutoLoggingIn(false);
      setShowManualEntry(true);
      return;
    }

    // Skip auto-login for admin and staff modes - they book on behalf of customers
    if (mode === "admin" || mode === "staff") {
      setIsAutoLoggingIn(false);
      setShowManualEntry(true);
      return;
    }

    const performAutoLogin = async () => {
      setIsAutoLoggingIn(true);

      try {
        const result = await checkAutoLogin();

        if (result.authenticated && result.user) {
          // Auto-login successful!
          setAutoLoginUser(result.user);
          setPhone(formatPhoneForDisplay(result.user.phone));
          setName(result.user.name);
          setEmail(result.user.email);
          setIsExistingUser(true);
          setUserChecked(true);
          setIsTrustedDevice(true);

          // Update draft with user info and authentication flags
          updateDraft({
            phone: result.user.phone,
            name: result.user.name,
            email: result.user.email,
            isExistingUser: true,
            deviceTrusted: true,
            otpVerified: true, // Skip OTP since device is trusted
          });

          // Don't auto-proceed - let user confirm
        } else {
          // Not auto-authenticated from server, check for locally cached data
          const trustedPhones = getTrustedPhones();
          const hasTrustedPhone = trustedPhones.length > 0;

          // Check if we have complete cached user data from a previous session
          if (draft.phone && draft.name && draft.email && hasTrustedPhone) {
            // We have cached data and a trusted phone - show as returning user
            const phoneDigits = draft.phone.replace(/\D/g, "");
            if (trustedPhones.includes(phoneDigits)) {
              // This phone is in our local trusted phones list
              setAutoLoginUser({
                phone: phoneDigits,
                name: draft.name,
                email: draft.email,
              });
              setPhone(formatPhoneForDisplay(phoneDigits));
              setName(draft.name);
              setEmail(draft.email);
              setIsExistingUser(true);
              setUserChecked(true);
              setIsTrustedDevice(true);

              // Update draft with authentication flags
              updateDraft({
                deviceTrusted: true,
                otpVerified: true, // Skip OTP since this is a returning trusted user
              });

              // Don't show manual entry - show welcome screen instead
              return;
            }
          }

          // Fall back to normal flow with manual entry
          setShowManualEntry(true);

          // Use cached draft data if available
          if (draft.phone) {
            setPhone(formatPhoneForDisplay(draft.phone));
            setName(draft.name || "");
            setEmail(draft.email || "");
            if (draft.name && draft.email) {
              setIsExistingUser(true);
              setUserChecked(true);
            } else {
              checkExistingUser(draft.phone);
            }
          } else if (hasTrustedPhone) {
            // Try to auto-populate from local trusted phones
            const lastTrustedPhone = trustedPhones[trustedPhones.length - 1];
            setPhone(formatPhoneForDisplay(lastTrustedPhone));
            updateDraft({ phone: lastTrustedPhone });
            checkExistingUser(lastTrustedPhone);
          }
        }
      } catch (error) {
        console.error("Auto-login check failed:", error);
        setShowManualEntry(true);
      } finally {
        setIsAutoLoggingIn(false);
      }
    };

    performAutoLogin();
  }, []); // Run only on mount

  // Verify existing phone number on mount (for page reload scenarios)
  useEffect(() => {
    // If phone is already in draft (from localStorage), verify it
    if (draft.phone && !userChecked && !isCheckingUser) {
      const digits = draft.phone.replace(/\D/g, "");
      if (digits.length === 10) {
        // Check if user exists
        checkExistingUser(digits);
      }
    }
  }, [draft.phone, userChecked, isCheckingUser, checkExistingUser]);

  // Check device trust on mount
  useEffect(() => {
    const checkDevice = async () => {
      setIsCheckingDevice(true);
      try {
        const { fingerprint, deviceName } = await getDeviceFingerprint();
        updateDraft({ deviceFingerprint: fingerprint });

        // Check if device is trusted locally
        const digits = phone.replace(/\D/g, "");
        if (digits.length === 10 && isPhoneTrustedLocally(digits)) {
          setIsTrustedDevice(true);

          // Verify with server
          const response = await fetch("/api/auth/verify-device", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              phone: digits,
              deviceFingerprint: fingerprint,
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
        console.error("Error checking device:", e);
      }
      setIsCheckingDevice(false);
    };

    checkDevice();
  }, [phone, updateDraft]);

  // Format phone number as user types
  const handlePhoneChange = (value: string) => {
    // Only allow digits
    const digits = value.replace(/\D/g, "");

    // Limit to 10 digits
    const limited = digits.slice(0, 10);

    setPhone(formatPhoneForDisplay(limited));
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
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 10) {
      updateDraft({ phone: digits, name, email, isExistingUser });
      nextStep();
    }
  };

  const handleBack = () => {
    if (draft.isEditMode) {
      resetDraft();
      router.push("/my-bookings");
    } else {
      router.push("/booking");
    }
  };

  // Validate: phone must be 10 digits, and for new users name and email are required
  const phoneValid = phone.replace(/\D/g, "").length === 10;
  const emailValid =
    email.trim() === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isValid =
    phoneValid &&
    userChecked &&
    (isExistingUser ||
      (name.trim() !== "" && email.trim() !== "" && emailValid));

  // Handle confirming the auto-detected user
  const handleConfirmUser = () => {
    nextStep();
  };

  // Show auto-login checking state
  if (isAutoLoggingIn && !showManualEntry) {
    return (
      <StepLayout
        title="Checking device..."
        subtitle="Please wait while we verify your device"
        showNext={false}
        hideFooter={true}
      >
        <div className="flex flex-col items-center justify-center py-8">
          <div className="p-4 rounded-full bg-violet-500/20 mb-4">
            <Smartphone className="w-10 h-10 text-violet-400" />
          </div>
          <div className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
            <span className="text-white font-medium">
              Detecting trusted device...
            </span>
          </div>
        </div>
      </StepLayout>
    );
  }

  // Show auto-login success state - ask user to confirm
  if (autoLoginUser && !showManualEntry) {
    return (
      <StepLayout
        title="Confirm your details"
        subtitle="Tap continue to proceed with booking"
        showBack={true}
        onBack={() => router.push("/home")}
        showNext={true}
        onNext={handleConfirmUser}
        nextLabel="Continue"
      >
        <div className="flex flex-col gap-3">
          {/* User Info Card */}
          <div className="bg-zinc-800/80 border border-zinc-700 rounded-xl p-4">
            {/* User Avatar and Name */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-base font-bold shadow-lg shadow-violet-500/20">
                {(autoLoginUser.name || "U").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold text-base leading-tight">
                  {autoLoginUser.name || "User"}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Shield className="w-3 h-3 text-green-400" />
                  <span className="text-green-400 text-[10px] font-medium">
                    Trusted device
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="space-y-2 pt-2 border-t border-zinc-700">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                  <Phone className="w-3.5 h-3.5 text-violet-400" />
                </div>
                <div>
                  <p className="text-zinc-400 text-[10px] uppercase font-medium">Phone</p>
                  <p className="text-white text-sm font-medium">
                    +91 {formatPhoneForDisplay(autoLoginUser.phone)}
                  </p>
                </div>
              </div>

              {autoLoginUser.email && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                    <Mail className="w-3.5 h-3.5 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-zinc-400 text-[10px] uppercase font-medium">Email</p>
                    <p className="text-white text-sm font-medium truncate max-w-[200px]">
                      {autoLoginUser.email}
                    </p>
                  </div>
                </div>
              )}

              {/* Device hint message */}
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-zinc-700/50">
                <Smartphone className="w-3 h-3 text-amber-400" />
                <p className="text-amber-400 text-[10px] font-medium">
                  Use this number only for this device
                </p>
              </div>
            </div>
          </div>
        </div>
      </StepLayout>
    );
  }

  return (
    <StepLayout
      title={draft.isEditMode ? "Verify your phone" : "Enter your WhatsApp mobile number"}
      showBack={true}
      showNext={true}
      onBack={handleBack}
      onExit={() => router.push('/booking')}
      onNext={handleNext}
      isNextDisabled={!isValid || isCheckingUser}
    >
      <div className="space-y-2">
        {/* Edit Mode Banner */}
        {draft.isEditMode && draft.originalChoices && (
          <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center gap-2">
            <RotateCcw className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-[10px] text-violet-400">
              Modifying your{" "}
              <span className="font-medium">
                {draft.originalChoices.sessionType}
              </span>{" "}
              booking
            </span>
          </div>
        )}

        {/* Phone input */}
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-zinc-400">
            <Phone className="w-4 h-4" />
            <span className="text-white font-medium text-sm">+91</span>
          </div>
          <input
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder="98765 43210"
            className="w-full bg-zinc-800/50 border-2 border-zinc-600 rounded-xl pl-[4.5rem] pr-10 py-2.5 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all text-base"
            autoFocus
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isCheckingUser && (
              <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
            )}
            {!isCheckingUser && isTrustedDevice && phoneValid && (
              <Shield className="w-4 h-4 text-green-400" />
            )}
          </div>
        </div>

        {/* Name input */}
        {phoneValid && userChecked && (
          <div className="relative animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder={
                isExistingUser ? "Your name" : "Your name (required)"
              }
              className={`w-full bg-zinc-800/50 border-2 rounded-xl pl-10 pr-4 py-2.5 text-white text-base placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all ${
                isExistingUser ? "border-zinc-600" : "border-zinc-600"
              } ${isExistingUser ? "opacity-75" : ""}`}
              readOnly={isExistingUser}
            />
          </div>
        )}

        {/* Email input */}
        {phoneValid && userChecked && (
          <div className="relative animate-in fade-in slide-in-from-top-2 duration-300 delay-75">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder={
                isExistingUser ? "Your email" : "Your email (required)"
              }
              className={`w-full bg-zinc-800/50 border-2 rounded-xl pl-10 pr-4 py-2.5 text-white text-base placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all ${
                isExistingUser ? "border-zinc-600" : "border-zinc-600"
              } ${isExistingUser && !canOverrideEmail ? "opacity-75" : ""}`}
              readOnly={isExistingUser && !canOverrideEmail}
            />
          </div>
        )}

        {/* Info text */}
        <p className="text-[10px] text-zinc-500 leading-tight px-1">
          We will use this number for booking confirmations & reminders. Cashback amount will be accumulated against this number only.
        </p>
      </div>
    </StepLayout>
  );
}
