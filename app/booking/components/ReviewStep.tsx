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
import Image from "next/image";
import { useBooking, SoundOperatorOption } from "../contexts/BookingContext";
import StepLayout from "./StepLayout";
import { getStudioRate } from "../utils/studioSuggestion";

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
        "1_5": "1–5 participants",
        "6_10": "6–10 participants",
        "11_20": "11–20 participants",
        "21_30": "21–30 participants",
      };
      return labels[draft.karaokeOption] || "";
    }

    if (draft.sessionType === "Live with musicians" && draft.liveOption) {
      const labels: Record<string, string> = {
        "1_2": "1–2 musicians",
        "3_4": "3–4 musicians",
        "5": "5 musicians",
        "6_8": "6–8 musicians",
        "9_12": "9–12 musicians",
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
      <div className="space-y-2">
        {/* No Changes Warning for Edit Mode */}
        {draft.isEditMode && !hasChanges && (
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-amber-400 font-medium text-xs">
                No Changes Made
              </h4>
              <p className="text-amber-400/80 text-[10px] mt-0.5 leading-tight">
                Please go back and modify the session, studio, date, or time slot.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          {/* Date & Time */}
          <div
            className={`p-2 rounded-lg bg-zinc-800/50 border ${
              draft.isEditMode ? "border-blue-700/30" : "border-zinc-700"
            }`}
          >
            <h3 className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 mb-1">
              Date & Time
            </h3>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Calendar
                  className={`w-3 h-3 ${
                    draft.isEditMode ? "text-blue-400" : "text-violet-400"
                  }`}
                />
                <span className="text-white text-xs truncate">
                  {formatDate(draft.date)}
                </span>
              </div>
              {draft.selectedSlot && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Clock
                    className={`w-3 h-3 ${
                      draft.isEditMode ? "text-blue-400" : "text-violet-400"
                    }`}
                  />
                  <span className="text-white text-xs whitespace-nowrap">
                    {formatTime(draft.selectedSlot.start)} -{" "}
                    {formatTime(draft.selectedSlot.end)}
                  </span>
                  <span className="text-zinc-400 text-[10px]">
                    ({draft.duration}hr)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Session Details */}
          <div
            className={`p-2 rounded-lg bg-zinc-800/50 border ${
              draft.isEditMode ? "border-blue-700/30" : "border-zinc-700"
            }`}
          >
            <h3 className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 mb-1">
              Session Details
            </h3>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Mic
                  className={`w-3 h-3 ${
                    draft.isEditMode ? "text-blue-400" : "text-violet-400"
                  }`}
                />
                <span className="text-white text-xs truncate">{draft.sessionType}</span>
              </div>
              {getSessionDetails() && (
                <div className="flex items-center gap-1.5">
                  <Users
                    className={`w-3 h-3 ${
                      draft.isEditMode ? "text-blue-400" : "text-violet-400"
                    }`}
                  />
                  <span className="text-zinc-300 text-xs truncate">
                    {getSessionDetails()}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Building2
                  className={`w-3 h-3 ${
                    draft.isEditMode ? "text-blue-400" : "text-violet-400"
                  }`}
                />
                <span className="text-white text-xs">{draft.studio}</span>
              </div>
            </div>
          </div>
        </div>



        {/* Payment Summary */}
        <div
          className={`p-2.5 rounded-lg ${
            draft.isEditMode
              ? "bg-blue-500/10 border border-blue-500/20"
              : "bg-violet-500/10 border border-violet-500/20"
          }`}
        >
          <div className="space-y-0.5">


            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-xs text-[10px] uppercase font-medium">rate x duration</span>
              <span className="text-zinc-300 text-xs">
                ₹{draft.ratePerHour.toLocaleString("en-IN")} x {draft.duration}hr
              </span>
            </div>
            
            <div
              className={`border-t ${
                draft.isEditMode ? "border-blue-500/20" : "border-violet-500/20"
              } my-1`}
            />

            {/* Total Calculation */}
            <div className="flex items-center justify-between">
               <span className="text-zinc-400 text-xs">Total Amount</span>
               <span className="text-white text-xs">
                 ₹{((draft.soundOperator === "Not Required" ? draft.ratePerHour + 50 : draft.ratePerHour) * draft.duration).toLocaleString("en-IN")}
               </span>
            </div>
            
            {/* Sound Operator discount support removed */}

            {/* Prompt Payment Discount */}
            {/* Prompt payment discount support removed */}

            <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-dashed border-white/10">
              <span className="text-white font-medium text-xs">
                PAYABLE AMOUNT
              </span>
              <span
                className={`text-lg font-bold leading-none ${
                  draft.isEditMode ? "text-blue-400" : "text-violet-400"
                }`}
              >
                ₹{totalAmount.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        {/* Prompt Payment Option Removed */}

        {/* Note */}
        {draft.isEditMode && (
          <p className="text-[10px] text-zinc-500 text-center">
            Your booking will be updated with these new details.
          </p>
        )}
      </div>
    </StepLayout>
  );
}
