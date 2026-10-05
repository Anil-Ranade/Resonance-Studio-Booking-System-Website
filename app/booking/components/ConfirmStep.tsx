"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Calendar,
  Clock,
  Building2,
  AlertCircle,
  Home,
  CalendarPlus,
  LayoutDashboard,
} from "lucide-react";
import { useBooking } from "../contexts/BookingContext";
import StepLayout from "./StepLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { getSession } from "@/lib/supabaseAuth";

export default function ConfirmStep() {
  const router = useRouter();
  const { draft, resetDraft, mode } = useBooking();
  const [isBooking, setIsBooking] = useState(true);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [error, setError] = useState("");
  const [bookingId, setBookingId] = useState("");

  // Get access token for admin/staff
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      const session = await getSession();
      if (session?.access_token) {
        return session.access_token;
      }
      // Fallback to localStorage
      const storageKey = mode === "admin" ? "accessToken" : "staffAccessToken";
      return localStorage.getItem(storageKey);
    } catch {
      const storageKey = mode === "admin" ? "accessToken" : "staffAccessToken";
      return localStorage.getItem(storageKey);
    }
  }, [mode]);

  // Create booking on mount - once, even if React mounts the effect twice
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    createBooking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const inFlight = useRef(false);
  const createBooking = async () => {
    if (inFlight.current) return; // "Try again" double-tap
    inFlight.current = true;
    setIsBooking(true);
    setError("");

    try {
      // Get session details string
      let sessionDetails: string = draft.sessionType || "";

      if (draft.sessionType === "Karaoke" && draft.karaokeOption) {
        const labels: Record<string, string> = {
          "1_5": "1-5 participants",
          "6_10": "6-10 participants",
          "11_20": "11-20 participants",
          "21_30": "21-30 participants",
        };
        sessionDetails = labels[draft.karaokeOption] || draft.sessionType || "";
      } else if (
        draft.sessionType === "Live with musicians" &&
        draft.liveOption
      ) {
        const labels: Record<string, string> = {
          "1_2": "1-2 musicians",
          "3_4": "3-4 musicians",
          "5": "5 musicians",
          "6_8": "6-8 musicians",
          "9_12": "9-12 musicians",
        };
        sessionDetails = labels[draft.liveOption] || draft.sessionType || "";
      } else if (
        draft.sessionType === "Band" &&
        draft.bandEquipment.length > 0
      ) {
        const equipmentLabels: Record<string, string> = {
          drum: "Drums",
          amps: "Amps",
          guitars: "Guitars",
          keyboard: "Keyboard",
        };
        sessionDetails = draft.bandEquipment
          .map((e) => equipmentLabels[e])
          .join(", ");
      } else if (draft.sessionType === "Recording" && draft.recordingOption) {
        const labels: Record<string, string> = {
          audio_recording: "Audio Recording",
          video_recording: "Video Recording (4K)",
          chroma_key: "Chroma Key (Green Screen)",
        };
        sessionDetails =
          labels[draft.recordingOption] || draft.sessionType || "";
      }

      // Sound Operator details removed
      // if (draft.soundOperator) {
      //   sessionDetails += ` | Sound Operator: ${draft.soundOperator}`;
      // }

      // Select API endpoint based on mode
      const getApiUrl = () => {
        if (mode === "admin") return "/api/admin/book";
        if (mode === "staff") return "/api/staff/book";
        return "/api/book";
      };

      // Use PUT for modifications, POST for new bookings
      const isModification = draft.isEditMode && draft.originalBookingId;
      const apiUrl = getApiUrl();

      // Get auth headers for admin/staff
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (mode !== "customer") {
        const token = await getAccessToken();
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
      }

      const response = await fetch(apiUrl, {
        method: isModification ? "PUT" : "POST",
        headers,
        body: JSON.stringify({
          phone: draft.phone,
          name: draft.name,
          email: draft.email,
          studio: draft.studio,
          session_type: draft.sessionType,
          session_details: sessionDetails,
          date: draft.date,
          start_time: draft.selectedSlot?.start,
          end_time: draft.selectedSlot?.end,
          // Admin/staff routes use this; the customer route ignores it and
          // computes the price from `options`
          rate_per_hour: draft.ratePerHour,
          options: {
            karaokeOption: draft.karaokeOption || undefined,
            liveOption: draft.liveOption || undefined,
            bandEquipment: draft.bandEquipment,
            recordingOption: draft.recordingOption || undefined,
          },
          is_prompt_payment: draft.isPromptPayment,
          original_booking_id: isModification
            ? draft.originalBookingId
            : undefined,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // For modifications, use the original booking ID; for new bookings, use the new ID
        const newBookingId = isModification
          ? draft.originalBookingId.slice(0, 8)
          : data.booking?.id?.slice(0, 8) || "";
        setBookingId(newBookingId);
        setBookingComplete(true);
      } else {
        setError(
          data.error ||
            (isModification
              ? "Failed to update booking"
              : "Failed to create booking")
        );
      }
    } catch (err) {
      setError(
        draft.isEditMode
          ? "Failed to update booking. Please try again."
          : "Failed to create booking. Please try again."
      );
    } finally {
      setIsBooking(false);
      inFlight.current = false;
    }
  };

  const handleGoHome = () => {
    resetDraft();
    // Navigate based on mode
    if (mode === "admin") {
      router.push("/admin/dashboard");
    } else if (mode === "staff") {
      router.push("/staff/dashboard");
    } else {
      router.push("/");
    }
  };

  const handleNewBooking = () => {
    resetDraft();
    // Navigate based on mode
    if (mode === "admin") {
      router.push("/admin/booking/new");
    } else if (mode === "staff") {
      router.push("/staff/booking/new");
    } else {
      router.push("/booking/new");
    }
  };

  // Format time for display in 12-hour format
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHour}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  // Context counts OTP and confirm as one visible step, so pin progress to the last step.
  const lastStep = 7;

  if (isBooking) {
    return (
      <StepLayout
        title={draft.isEditMode ? "Updating your booking..." : "Confirming your booking..."}
        subtitle="Please wait while we process your request"
        hideFooter
        progressStep={lastStep}
      >
        <div className="flex justify-center py-12">
          <Spinner className="size-14 text-primary" />
        </div>
      </StepLayout>
    );
  }

  if (error) {
    return (
      <StepLayout
        title={draft.isEditMode ? "Update failed" : "Booking failed"}
        progressStep={lastStep}
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleGoHome} className="flex-1 h-11">
              Go home
            </Button>
            <Button onClick={createBooking} className="flex-1 h-11 font-semibold">
              Try again
            </Button>
          </div>
        }
      >
        <div className="flex flex-col items-center text-center gap-4 py-8">
          <div className="p-4 rounded-full bg-destructive/15 text-destructive">
            <AlertCircle className="w-12 h-12" />
          </div>
          <p className="text-destructive max-w-sm">{error}</p>
        </div>
      </StepLayout>
    );
  }

  return (
    <StepLayout
      title={draft.isEditMode ? "Booking updated!" : "Booking confirmed!"}
      progressStep={lastStep}
      footer={
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleGoHome} className="flex-1 h-11">
            {mode !== "customer" ? (
              <>
                <LayoutDashboard /> Dashboard
              </>
            ) : (
              <>
                <Home /> Home
              </>
            )}
          </Button>
          <Button onClick={handleNewBooking} className="flex-1 h-11 font-semibold">
            <CalendarPlus /> New booking
          </Button>
        </div>
      }
    >
      <div className="flex flex-col items-center gap-4 pt-2">
        <div className="p-3 rounded-full bg-emerald-500/15 text-emerald-400">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        {bookingId && (
          <p className="text-muted-foreground">
            Booking ID: <span className="text-primary font-semibold tracking-wider">{bookingId}</span>
          </p>
        )}

        <Card className="w-full max-w-sm">
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="size-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="font-medium text-sm">{formatDate(draft.date)}</p>
              </div>
            </div>
            {draft.selectedSlot && (
              <div className="flex items-center gap-3">
                <Clock className="size-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Time</p>
                  <p className="font-medium text-sm">
                    {formatTime(draft.selectedSlot.start)} - {formatTime(draft.selectedSlot.end)}
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Building2 className="size-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Studio</p>
                <p className="font-medium text-sm">{draft.studio}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Total amount</span>
              <span className="text-xl font-bold text-primary">
                ₹{(draft.ratePerHour * draft.duration).toLocaleString("en-IN")}
              </span>
            </div>
            {!draft.isPromptPayment && (
              <p className="text-xs text-muted-foreground">Pay at the studio</p>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center">
          {draft.isEditMode
            ? "Your booking has been updated. A confirmation email has been sent."
            : "A confirmation email has been sent to your email address"}
        </p>
      </div>
    </StepLayout>
  );
}
