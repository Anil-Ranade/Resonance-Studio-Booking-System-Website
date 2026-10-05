"use client";

import {
  Calendar,
  Clock,
  Building2,
  Users,
  Mic,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import { useBooking } from "../contexts/BookingContext";
import StepLayout from "./StepLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function ReviewStep() {
  const { draft, nextStep, hasChangesFromOriginal, updateDraft } = useBooking();

  // Check if there are changes in edit mode
  const hasChanges = hasChangesFromOriginal();

  // Format phone for display
  const formatPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 10) {
      return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
    }
    return phone;
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
      year: "numeric",
    });
  };

  // Get session details for display
  const getSessionDetails = () => {
    if (!draft.sessionType) return "";

    if (draft.sessionType === "Karaoke" && draft.karaokeOption) {
      const labels: Record<string, string> = {
        "1_5": "1-5 participants",
        "6_10": "6-10 participants",
        "11_20": "11-20 participants",
        "21_30": "21-30 participants",
      };
      return labels[draft.karaokeOption] || "";
    }

    if (draft.sessionType === "Live with musicians" && draft.liveOption) {
      const labels: Record<string, string> = {
        "1_2": "1-2 musicians",
        "3_4": "3-4 musicians",
        "5": "5 musicians",
        "6_8": "6-8 musicians",
        "9_12": "9-12 musicians",
      };
      return labels[draft.liveOption] || "";
    }

    if (draft.sessionType === "Band" && draft.bandEquipment.length > 0) {
      const equipmentLabels: Record<string, string> = {
        drum: "Drums",
        amps: "Amps",
        guitars: "Guitars",
        keyboard: "Keyboard",
      };
      return draft.bandEquipment.map((e) => equipmentLabels[e]).join(", ");
    }

    if (draft.sessionType === "Recording" && draft.recordingOption) {
      const labels: Record<string, string> = {
        audio_recording: "Audio Recording",
        video_recording: "Video Recording (4K)",
        chroma_key: "Chroma Key (Green Screen)",
      };
      return labels[draft.recordingOption] || "";
    }

    return "";
  };

  const totalAmount = draft.ratePerHour * draft.duration;

  const handleNext = () => {
    nextStep();
  };





  return (
    <StepLayout
      title={draft.isEditMode ? "Review your changes" : "Review your booking"}
      subtitle={
        draft.isEditMode
          ? hasChanges
            ? "Confirm the updated details below"
            : "No changes detected"
          : ""
      }
      showNext={true}
      nextLabel={draft.isEditMode ? "Confirm Update" : "Confirm Booking"}
      onNext={handleNext}
      isNextDisabled={draft.isEditMode && !hasChanges}
    >
      <div className="space-y-3">
        {draft.isEditMode && !hasChanges && (
          <Alert className="border-amber-500/25 bg-amber-500/10 text-amber-300">
            <AlertCircle />
            <AlertTitle>No changes made</AlertTitle>
            <AlertDescription className="text-amber-300/80 text-xs">
              Please go back and modify the session, studio, date, or time slot.
            </AlertDescription>
          </Alert>
        )}

        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              Date & time
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <p className="flex items-center gap-2">
              <Calendar className="size-4 text-primary" /> {formatDate(draft.date)}
            </p>
            {draft.selectedSlot && (
              <p className="flex items-center gap-2">
                <Clock className="size-4 text-primary" />
                {formatTime(draft.selectedSlot.start)} - {formatTime(draft.selectedSlot.end)}
                <span className="text-muted-foreground text-xs">({draft.duration} hr)</span>
              </p>
            )}
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              Session details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <p className="flex items-center gap-2">
              <Mic className="size-4 text-primary" /> {draft.sessionType}
            </p>
            {getSessionDetails() && (
              <p className="flex items-center gap-2 text-muted-foreground">
                <Users className="size-4 text-primary" /> {getSessionDetails()}
              </p>
            )}
            <p className="flex items-center gap-2">
              <Building2 className="size-4 text-primary" /> {draft.studio}
            </p>
          </CardContent>
        </Card>

        <Card size="sm" className="ring-primary/30 bg-primary/10">
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground uppercase font-medium">Rate × duration</span>
              <span>
                ₹{draft.ratePerHour.toLocaleString("en-IN")} × {draft.duration} hr
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm">Payable amount</span>
              <span className="text-2xl font-bold text-primary leading-none">
                ₹{totalAmount.toLocaleString("en-IN")}
              </span>
            </div>
            {!draft.isPromptPayment && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CreditCard className="size-3.5" /> Pay at the studio
              </p>
            )}
          </CardContent>
        </Card>

        {draft.isEditMode && (
          <p className="text-xs text-muted-foreground text-center">
            Your booking will be updated with these new details.
          </p>
        )}
      </div>
    </StepLayout>
  );
}
