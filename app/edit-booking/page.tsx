"use client";

import { userMessage } from "@/lib/errors";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Edit3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { checkAuthStatus } from "@/lib/authClient";
import { FlowNav, FlowShell } from "../booking/components/FlowShell";
import {
  Booking,
  BookingPicker,
  BookingSummary,
  PhoneNameSearch,
  LoadingCard,
  SEARCH_FORM_ID,
  isValidPhone,
  safeJsonParse,
  signInCustomer,
} from "../components/ManageBooking";

type Step = "search" | "select" | "verify" | "confirm";
const STEPS: Step[] = ["search", "select", "verify", "confirm"];

const TITLES: Record<Step, { title: string; subtitle: string }> = {
  search: { title: "Find your booking", subtitle: "Enter your mobile number and name" },
  select: { title: "Select a booking to modify", subtitle: "Free online changes are available more than 24 hours before the session" },
  verify: { title: "Verify it's you", subtitle: "Checking your mobile number and name" },
  confirm: { title: "Modify this booking?", subtitle: "You'll pick the new details next" },
};

export default function EditBookingPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [error, setError] = useState("");
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [searched, setSearched] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [step, setStep] = useState<Step>("search");

  // Trusted devices skip OTP and load bookings straight away
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const status = await checkAuthStatus();
        if (status.authenticated && status.user?.phone) {
          setPhone(status.user.phone);
          setName(status.user.name || "");
          await fetchBookings(status.user.phone, status.user.name || "", false);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkAuth();
  }, []);

  const fetchBookings = async (phoneToFetch: string, nameToFetch: string, requirePassword = true) => {
    if (!isValidPhone(phoneToFetch) || !nameToFetch.trim()) {
      setError("Please enter a valid 10-digit mobile number and name");
      return;
    }

    setIsLoading(true);
    setError("");
    setSearched(true);

    try {
      if (requirePassword) await signInCustomer(phoneToFetch.replace(/\D/g, ""), nameToFetch.trim(), password);
      const response = await fetch(
        `/api/bookings/upcoming?phone=${encodeURIComponent(phoneToFetch.replace(/\D/g, ""))}&name=${encodeURIComponent(nameToFetch.trim())}`,
      );
      const data = await safeJsonParse(response);
      if (!response.ok) throw new Error(data.error || "Failed to fetch bookings");

      const upcoming = (data.bookings || []).filter((b: Booking) => b.status === "confirmed");
      setBookings(upcoming);
      if (upcoming.length > 0) setStep("select");
    } catch (err) {
      setError(userMessage(err, "Failed to fetch bookings"));
      setBookings(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setStep("confirm");
  };

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
      total_amount: selectedBooking.total_amount,
      group_size: selectedBooking.group_size || 1,
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
        nextDisabled={!isValidPhone(phone) || !name.trim() || !password}
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
          <PhoneNameSearch
            phone={phone}
            name={name}
            password={password}
            onPhoneChange={setPhone}
            onNameChange={setName}
            onPasswordChange={setPassword}
            onSubmit={() => fetchBookings(phone, name)}
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
