"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Edit3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import OTPVerification from "../components/OTPVerification";
import { checkAuthStatus } from "@/lib/authClient";
import { FlowNav, FlowShell } from "../booking/components/FlowShell";
import {
  Booking,
  BookingPicker,
  BookingSummary,
  EmailSearch,
  LoadingCard,
  SEARCH_FORM_ID,
  isValidEmail,
  safeJsonParse,
} from "../components/ManageBooking";

type Step = "search" | "select" | "verify" | "confirm";
const STEPS: Step[] = ["search", "select", "verify", "confirm"];

const TITLES: Record<Step, { title: string; subtitle: string }> = {
  search: { title: "Find your booking", subtitle: "Enter the email you booked with" },
  select: { title: "Select a booking to modify", subtitle: "Bookings within 24 hours can't be changed" },
  verify: { title: "Verify it's you", subtitle: "Enter the 6-digit code we emailed you" },
  confirm: { title: "Modify this booking?", subtitle: "You'll pick the new details next" },
};

export default function EditBookingPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [error, setError] = useState("");
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [searched, setSearched] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [step, setStep] = useState<Step>("search");
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
    selectedId.current = booking.id;
    setStep(isVerified ? "confirm" : "verify");
  };

  // Before verification the list has no personal fields (phone etc.); now that the
  // session proves ownership, reload it so the booking handed to the flow is complete.
  const selectedId = useRef<string | null>(null);
  const emailRef = useRef(email);
  emailRef.current = email;
  const handleVerified = useCallback(async () => {
    setIsVerified(true);
    try {
      const res = await fetch(
        `/api/bookings/upcoming?email=${encodeURIComponent(emailRef.current.trim())}`,
      );
      const data = await safeJsonParse(res);
      const full = (data.bookings || []).find((b: Booking) => b.id === selectedId.current);
      if (full) setSelectedBooking(full);
    } catch {
      // keep the list version; confirmEdit falls back gracefully
    }
    setStep("confirm");
  }, []);

  const confirmEdit = () => {
    if (!selectedBooking) return;

    // Hand the booking to the booking flow, which runs in edit mode
    const editData = {
      editMode: true,
      originalBookingId: selectedBooking.id,
      sessionType: selectedBooking.session_type,
      sessionDetails: selectedBooking.session_details,
      studio: selectedBooking.studio,
      date: selectedBooking.date,
      start_time: selectedBooking.start_time,
      end_time: selectedBooking.end_time,
      phone_number: selectedBooking.phone_number || "",
      name: selectedBooking.name || "",
      email: email,
      total_amount: selectedBooking.total_amount,
      group_size: selectedBooking.group_size || 1,
      // Already verified here, so the booking flow can skip OTP
      otpVerified: true,
    };

    sessionStorage.setItem("editBookingData", JSON.stringify(editData));
    router.push("/booking/new");
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
        onNext={confirmEdit}
        nextLabel={
          <>
            <Edit3 /> Modify booking
          </>
        }
      />
    ),
  }[step];

  return (
    <FlowShell
      {...TITLES[step]}
      step={STEPS.indexOf(step) + 1}
      totalSteps={STEPS.length}
      onExit={() => router.push("/booking")}
      contentKey={step}
      badge={
        <Badge variant="outline" className="border-primary/40 text-primary">
          <Edit3 /> Modify booking
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
          lockedMessage="Cannot modify within 24 hours of session"
          onSelect={handleSelectBooking}
        />
      )}

      {step === "verify" && selectedBooking && (
        <OTPVerification
          phone={selectedBooking.phone_number || ""}
          email={email}
          onVerified={handleVerified}
          actionLabel="edit booking"
        />
      )}

      {step === "confirm" && selectedBooking && (
        <div className="space-y-4">
          <BookingSummary booking={selectedBooking} />
          <p className="text-muted-foreground text-sm">
            Your original booking will be cancelled when you confirm the new booking.
          </p>
        </div>
      )}
    </FlowShell>
  );
}
