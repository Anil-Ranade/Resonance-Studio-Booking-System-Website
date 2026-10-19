"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Phone,
  Smartphone,
  Shield,
  RotateCcw,
  User,
  Eye,
  EyeOff,
} from "lucide-react";
import { useBooking } from "../contexts/BookingContext";
import StepLayout from "./StepLayout";
import { adminFetch } from "@/lib/adminFetch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { takeReturnTo } from "../utils/returnTo";
import {
  getDeviceFingerprint,
  isPhoneTrustedLocally,
  getTrustedPhones,
  checkAutoLogin,
} from "@/lib/deviceFingerprint";

const CUSTOMER_DETAILS_KEY = "resonance_customer_details";

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
  const [isTrustedDevice, setIsTrustedDevice] = useState(false);
  const [isCheckingDevice, setIsCheckingDevice] = useState(true);
  const [isCheckingUser, setIsCheckingUser] = useState(false);
  const [isExistingUser, setIsExistingUser] = useState(draft.isExistingUser);
  const [userChecked, setUserChecked] = useState(false);

  // Auto-login state
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(true);
  const [autoLoginUser, setAutoLoginUser] = useState<{
    phone: string;
    name: string;
  } | null>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMode, setPasswordMode] = useState<"existing" | "new" | null>(null);
  const [isCheckingPassword, setIsCheckingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const checkPasswordAccount = useCallback(async (phoneDigits: string) => {
    if (mode !== "customer" || phoneDigits.length !== 10) return;
    setIsCheckingPassword(true);
    setPasswordError("");
    try {
      const response = await fetch(`/api/auth/password?phone=${phoneDigits}`);
      const data = await response.json();
      if (response.ok) {
        setPasswordMode(data.exists && data.hasPassword ? "existing" : "new");
        if (data.name) {
          setName(data.name);
          updateDraft({ name: data.name });
        }
        setUserChecked(true);
      }
    } finally {
      setIsCheckingPassword(false);
    }
  }, [mode, updateDraft]);

  // Check if user exists when phone number is complete
  const checkExistingUser = useCallback(
    async (phoneDigits: string) => {
      if (mode === "customer") return;
      if (phoneDigits.length !== 10) {
        setUserChecked(false);
        setIsExistingUser(false);
        return;
      }

      setIsCheckingUser(true);
      try {
        // Staff/admin see full customer details.
        const response = await adminFetch("/api/check-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: phoneDigits }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            // Existing user - populate name and email
            setName(data.user.name || "");
            setIsExistingUser(true);
            updateDraft({
              name: data.user.name || "",
              isExistingUser: true,
            });
          } else if (data.needsSignup) {
            // New user - clear fields
            setName("");
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
    [updateDraft, mode]
  );

  useEffect(() => {
    if (showManualEntry && mode === "customer") checkPasswordAccount(phone.replace(/\D/g, ""));
  }, [phone, showManualEntry, mode, checkPasswordAccount]);

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
        let storedDetails: { phone: string; name: string } | null = null;
        try {
          const stored = localStorage.getItem(CUSTOMER_DETAILS_KEY);
          if (stored) storedDetails = JSON.parse(stored);
        } catch {
          storedDetails = null;
        }

        const result = await checkAutoLogin();

        if (result.authenticated && result.user) {
          if (storedDetails && storedDetails.phone !== result.user.phone) {
            setShowManualEntry(true);
            setPhone(formatPhoneForDisplay(storedDetails.phone));
            setName(storedDetails.name);
            setIsExistingUser(false);
            setUserChecked(true);
            updateDraft({
              phone: storedDetails.phone,
              name: storedDetails.name,
              isExistingUser: false,
              deviceTrusted: false,
              otpVerified: false,
            });
            return;
          }

          const savedName = storedDetails?.phone === result.user.phone
            ? storedDetails.name
            : result.user.name;
          // Auto-login successful!
          setAutoLoginUser({ ...result.user, name: savedName });
          setPhone(formatPhoneForDisplay(result.user.phone));
          setName(savedName);
          setIsExistingUser(true);
          setUserChecked(true);
          setIsTrustedDevice(true);

          // Update draft with user info and authentication flags
          updateDraft({
            phone: result.user.phone,
            name: savedName,
            email: "",
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
          if (draft.phone && draft.name && hasTrustedPhone) {
            // We have cached data and a trusted phone - show as returning user
            const phoneDigits = draft.phone.replace(/\D/g, "");
            if (trustedPhones.includes(phoneDigits)) {
              // This phone is in our local trusted phones list
              setAutoLoginUser({
                phone: phoneDigits,
                name: draft.name,
              });
              setPhone(formatPhoneForDisplay(phoneDigits));
              setName(draft.name);
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
            if (draft.name) {
              setIsExistingUser(true);
              setUserChecked(true);
            } else {
              checkExistingUser(draft.phone);
            }
          } else if (storedDetails) {
            setPhone(formatPhoneForDisplay(storedDetails.phone));
            setName(storedDetails.name);
            setIsExistingUser(false);
            setUserChecked(true);
            updateDraft({
              phone: storedDetails.phone,
              name: storedDetails.name,
            });
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

  // Sync phone from draft if it comes in late (e.g. from sessionStorage)
  useEffect(() => {
    const draftDigits = draft.phone.replace(/\D/g, "");
    const currentDigits = phone.replace(/\D/g, "");
    
    // If draft has phone but local state doesn't (or diff value on load), update it
    if (draftDigits.length === 10 && currentDigits !== draftDigits) {
      setPhone(formatPhoneForDisplay(draftDigits));
    }
  }, [draft.phone, phone]);

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

    if (draft.phone.replace(/\D/g, "") !== limited) {
      updateDraft({ otpVerified: false, deviceTrusted: false });
    }

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

  const handleNext = async () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 10) {
      if (mode === "customer" && !isTrustedDevice) {
        setPasswordError("");
        if (passwordMode === "new" && password !== confirmPassword) {
          setPasswordError("Passwords do not match.");
          return;
        }
        setIsSavingDetails(true);
        try {
          const { fingerprint, deviceName } = await getDeviceFingerprint();
          const response = await fetch("/api/auth/password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone: digits, name: name.trim(), password, confirmPassword, deviceFingerprint: fingerprint, deviceName }),
          });
          const data = await response.json();
          if (!response.ok) {
            setPasswordError(data.error || "Unable to verify password.");
            return;
          }
          updateDraft({ deviceFingerprint: fingerprint, deviceTrusted: true });
        } catch {
          setPasswordError("Unable to verify password. Please try again.");
          return;
        } finally {
          setIsSavingDetails(false);
        }
      }
      if (isExistingUser && name.trim() && (isEditingDetails || mode !== "customer")) {
        setIsSavingDetails(true);
        try {
          await (mode === "customer" ? fetch : adminFetch)("/api/check-user", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone: digits, name: name.trim() }),
          });
        } catch (error) {
          console.error("Failed to save customer details:", error);
        } finally {
          setIsSavingDetails(false);
        }
      }
      try {
        localStorage.setItem(
          CUSTOMER_DETAILS_KEY,
          JSON.stringify({ phone: digits, name: name.trim() }),
        );
      } catch {
        // Device persistence is best effort; booking flow remains usable.
      }
      updateDraft({ phone: digits, name, email: "", isExistingUser, otpVerified: true });
      nextStep();
    }
  };

  const handleBack = () => {
    const returnTo = takeReturnTo();
    if (returnTo) {
      resetDraft();
      router.push(returnTo);
    } else if (draft.isEditMode) {
      resetDraft();
      router.push(mode === "customer" ? "/my-bookings" : `/${mode}/bookings`);
    } else {
      router.push(mode === "customer" ? "/booking" : `/${mode}/booking`);
    }
  };

  // Validate: phone and name are required.
  const phoneValid = phone.replace(/\D/g, "").length === 10;
  // Jump to Name once a full number is entered and the user lookup finishes.
  const nameEditable = !(isExistingUser && mode === "customer" && !isEditingDetails);
  useEffect(() => {
    if (phoneValid && userChecked && nameEditable) document.getElementById("booking-name")?.focus();
  }, [phoneValid, userChecked, nameEditable]);
  const passwordValid = mode !== "customer" || isTrustedDevice || (passwordMode !== null && (passwordMode === "existing" ? password.length > 0 : /^\d{6}$/.test(password) && password === confirmPassword));
  const isValid =
    phoneValid &&
    name.trim() !== "" &&
    passwordValid &&
    !isCheckingPassword;

  // Handle confirming the auto-detected user
  const handleConfirmUser = () => {
    nextStep();
  };

  const handleEditUser = () => {
    setAutoLoginUser(null);
    setShowManualEntry(true);
    setIsEditingDetails(true);
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
        <div className="flex flex-col items-center justify-center gap-4 py-8">
          <div className="p-4 rounded-full bg-primary/15 text-primary">
            <Smartphone className="w-10 h-10" />
          </div>
          <span className="flex items-center gap-2 font-medium">
            <Spinner className="size-5 text-primary" /> Detecting trusted device...
          </span>
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
        backLabel="Edit"
        onBack={handleEditUser}
        showNext={true}
        onNext={handleConfirmUser}
        nextLabel="Continue"
      >
        <Card>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-base font-bold">
                {(autoLoginUser.name || "U").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-base leading-tight">
                  {autoLoginUser.name || "User"}
                </p>
                <Badge variant="outline" className="mt-1 border-emerald-500/40 text-emerald-400">
                  <Shield /> Trusted device
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                <Phone className="size-3.5" />
              </div>
              <div>
                <p className="text-muted-foreground text-[10px] uppercase font-medium">Phone</p>
                <p className="text-sm font-medium">+91 {formatPhoneForDisplay(autoLoginUser.phone)}</p>
              </div>
            </div>

            <Separator />

            <p className="flex items-center gap-2 text-amber-400 text-xs font-medium">
              <Smartphone className="size-3.5" /> Use this number only for this device
            </p>
          </CardContent>
        </Card>
      </StepLayout>
    );
  }

  return (
    <StepLayout
      title={draft.isEditMode ? "Verify your phone" : "Enter your WhatsApp mobile number"}
      showBack={true}
      showNext={true}
      onBack={handleBack}
      onExit={() => router.push(takeReturnTo() ?? (mode === "customer" ? "/booking" : `/${mode}/booking`))}
      onNext={handleNext}
      isLoading={isSavingDetails}
      isNextDisabled={!isValid || isCheckingUser}
    >
      <div className="space-y-3">
        {draft.isEditMode && draft.originalChoices && (
          <Badge variant="outline" className="border-primary/40 text-primary">
            <RotateCcw /> Modifying your {draft.originalChoices.sessionType} booking
          </Badge>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="booking-phone">WhatsApp number</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-muted-foreground text-sm">
              <Phone className="size-4" />
              <span className="text-foreground font-medium">+91</span>
            </span>
            <Input
              id="booking-phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="98765 43210"
              className="h-11 pl-[4.5rem] pr-10 text-base"
              autoFocus
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2">
              {isCheckingUser && <Spinner className="text-primary" />}
              {!isCheckingUser && isTrustedDevice && phoneValid && (
                <Shield className="size-4 text-emerald-400" aria-label="Trusted device" />
              )}
            </span>
          </div>
          <p className="text-sm text-foreground">
            Please provide <strong>WhatsApp number only</strong> so that you will get instant “Booking Confirmation” &amp; one day in advance “Booking Reminder” on Whatsapp.
          </p>
        </div>

        {phoneValid && userChecked && (
          <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
            <Label htmlFor="booking-name">
              Name {!isExistingUser && <span className="text-muted-foreground">(required)</span>}
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="booking-name"
                autoComplete="name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Your name"
                className="h-11 pl-10 text-base read-only:opacity-75"
                readOnly={isExistingUser && mode === "customer" && !isEditingDetails}
              />
            </div>
          </div>
        )}

        {mode === "customer" && showManualEntry && phoneValid && userChecked && !isTrustedDevice && passwordMode && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="space-y-1.5">
              <Label htmlFor="booking-password">{passwordMode === "new" ? "Create 6-digit PIN" : "Password"}</Label>
              <div className="relative">
                <Input id="booking-password" type={showPassword ? "text" : "password"} autoComplete={passwordMode === "new" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(passwordMode === "new" ? e.target.value.replace(/\D/g, "").slice(0, 6) : e.target.value)} placeholder={passwordMode === "new" ? "6-digit PIN" : "Password or PIN"} inputMode={passwordMode === "new" ? "numeric" : undefined} maxLength={passwordMode === "new" ? 6 : 128} className="h-11 pr-11 text-base" />
                <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            {passwordMode === "new" && (
              <div className="space-y-1.5">
                <Label htmlFor="booking-confirm-password">Confirm PIN</Label>
                <div className="relative">
                  <Input id="booking-confirm-password" type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="Enter the PIN again" inputMode="numeric" maxLength={6} className="h-11 pr-11 text-base" />
                  <button type="button" onClick={() => setShowConfirmPassword((value) => !value)} aria-label={showConfirmPassword ? "Hide confirmed password" : "Show confirmed password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
            )}
            {passwordMode === "existing" && <Link href="/forgot-password" className="text-xs text-primary underline">Forgot password? Request a reset.</Link>}
            {passwordError && <p className="text-sm text-destructive" role="alert">{passwordError}</p>}
          </div>
        )}
      </div>
    </StepLayout>
  );
}
