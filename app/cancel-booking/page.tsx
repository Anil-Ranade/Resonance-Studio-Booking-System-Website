"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Home, XCircle } from "lucide-react";
import OTPVerification from "../components/OTPVerification";
import { checkAuthStatus } from "@/lib/authClient";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FlowNav, FlowShell } from "../booking/components/FlowShell";
import {
  Booking,
  BookingPicker,
  BookingSummary,
  EmailSearch,
  ErrorAlert,
  LoadingCard,
  SEARCH_FORM_ID,
  isValidEmail,
  safeJsonParse,
} from "../components/ManageBooking";

type Step = "search" | "select" | "verify" | "confirm" | "success";
const STEPS: Step[] = ["search", "select", "verify", "confirm", "success"];

const TITLES: Record<Step, { title: string; subtitle: string }> = {
  search: { title: "Find your booking", subtitle: "Enter the email you booked with" },
  select: { title: "Select a booking to cancel", subtitle: "Bookings within 24 hours can't be cancelled" },
  verify: { title: "Verify it's you", subtitle: "Enter the 6-digit code we emailed you" },
  confirm: { title: "Cancel this booking?", subtitle: "Check the details before you confirm" },
  success: { title: "Booking cancelled", subtitle: "Your booking has been successfully cancelled" },
};

export default function CancelBookingPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [error, setError] = useState("");
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [searched, setSearched] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [step, setStep] = useState<Step>("search");
  const [isCancelling, setIsCancelling] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // Trusted devices skip OTP and load bookings straight away
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const status = await checkAuthStatus();
        if (status.authenticated && status.user && status.user.email) {
          setEmail(status.user.email);
          setIsVerified(true);
          await fetchBookingsForEmail(status.user.email);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkAuth();
  }, []);

  const fetchBookingsForEmail = async (emailToFetch: string) => {
    if (!isValidEmail(emailToFetch)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    setError("");
    setSearched(true);

    try {
      const response = await fetch(
        `/api/bookings/upcoming?email=${encodeURIComponent(emailToFetch.trim())}`,
      );
      const data = await safeJsonParse(response);
      if (!response.ok) throw new Error(data.error || "Failed to fetch bookings");

      const upcoming = (data.bookings || []).filter((b: Booking) => b.status === "confirmed");
      setBookings(upcoming);
      if (upcoming.length > 0) setStep("select");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch bookings");
      setBookings(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setError("");
    setStep(isVerified ? "confirm" : "verify");
  };

  const handleVerified = useCallback(() => {
    setIsVerified(true);
    setStep("confirm");
  }, []);

  const confirmCancellation = async () => {
    if (isCancelling) return;
    if (!selectedBooking) {
      setError("No booking selected");
      return;
    }

    setIsCancelling(true);
    setError("");

    try {
      const response = await fetch("/api/bookings/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: selectedBooking.id,
          reason: "Cancelled by user",
        }),
      });
      const data = await safeJsonParse(response);
      if (!response.ok) throw new Error(data.error || "Failed to cancel booking");
      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel booking");
    } finally {
      setIsCancelling(false);
    }
  };

  const resetFlow = () => {
    setStep("search");
    setSelectedBooking(null);
    setBookings(null);
    setSearched(false);
    setEmail("");
    setError("");
    setIsVerified(false);
  };

  const footer = {
    search: (
      <FlowNav
        onBack={() => router.push("/booking")}
        nextForm={isCheckingAuth ? undefined : SEARCH_FORM_ID}
        nextLabel="Find my bookings"
        nextDisabled={!isValidEmail(email)}
        loading={isLoading}
      />
    ),
    select: <FlowNav onBack={() => setStep("search")} />,
    verify: <FlowNav onBack={() => setStep("select")} />,
    confirm: (
      <FlowNav
        onBack={() => setStep("select")}
        backLabel="Keep booking"
        onNext={confirmCancellation}
        nextLabel="Confirm cancellation"
        loading={isCancelling}
        destructive
      />
    ),
    success: (
      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => router.push("/")} className="flex-1 h-11">
          <Home /> Home
        </Button>
        <Button onClick={resetFlow} className="flex-1 h-11 font-semibold">
          Cancel another
        </Button>
      </div>
    ),
  }[step];

  return (
    <FlowShell
      {...TITLES[step]}
      step={STEPS.indexOf(step) + 1}
      totalSteps={STEPS.length}
      onExit={step === "success" ? undefined : () => router.push("/booking")}
      contentKey={step}
      badge={
        <Badge variant="outline" className="border-destructive/40 text-destructive">
          <XCircle /> Cancel booking
        </Badge>
      }
      footer={footer}
    >
      {step === "search" &&
        (isCheckingAuth ? (
          <LoadingCard label="Checking for your bookings..." />
        ) : (
          <EmailSearch
            email={email}
            onEmailChange={setEmail}
            onSubmit={() => fetchBookingsForEmail(email)}
            error={error}
            noResults={searched && !!bookings && bookings.length === 0}
          />
        ))}

      {step === "select" && bookings && (
        <BookingPicker
          bookings={bookings}
          lockedMessage="Cannot cancel within 24 hours of session"
          onSelect={handleSelectBooking}
        />
      )}

      {step === "verify" && selectedBooking && (
        <OTPVerification
          phone={selectedBooking.phone_number || ""}
          email={email}
          onVerified={handleVerified}
          actionLabel="cancel booking"
          destructive
        />
      )}

      {step === "confirm" && selectedBooking && (
        <div className="space-y-4">
          <BookingSummary booking={selectedBooking} />
          <Alert variant="destructive" className="border-destructive/30 bg-destructive/10">
            <AlertTriangle />
            <AlertDescription className="text-destructive">
              This action cannot be undone.
            </AlertDescription>
          </Alert>
          {error && <ErrorAlert message={error} />}
        </div>
      )}

      {step === "success" && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="p-4 rounded-full bg-emerald-500/15 text-emerald-400">
            <Check className="size-8" />
          </div>
          <p className="text-muted-foreground text-sm">
            You can book a new session any time.
          </p>
        </div>
      )}
    </FlowShell>
  );
}
