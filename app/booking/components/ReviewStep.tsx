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
import { useBooking } from "../contexts/BookingContext";
import StepLayout from "./StepLayout";

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
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-amber-400 font-medium text-xs">
                No Changes Made
              </h4>
              <p className="text-amber-400/80 text-xs mt-0.5">
                Please go back and modify the session, studio, date, or time
                slot.
              </p>
            </div>
          </div>
        )}

        {/* Date & Time */}
        <div
          className={`p-2.5 rounded-xl bg-zinc-800/50 border ${
            draft.isEditMode ? "border-blue-700/30" : "border-zinc-700"
          }`}
        >
          <h3 className="text-xs font-medium text-zinc-400 mb-1.5">
            Date & Time
          </h3>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Calendar
                className={`w-3.5 h-3.5 ${
                  draft.isEditMode ? "text-blue-400" : "text-violet-400"
                }`}
              />
              <span className="text-white text-xs">
                {formatDate(draft.date)}
              </span>
            </div>
            {draft.selectedSlot && (
              <div className="flex items-center gap-2">
                <Clock
                  className={`w-3.5 h-3.5 ${
                    draft.isEditMode ? "text-blue-400" : "text-violet-400"
                  }`}
                />
                <span className="text-white text-xs">
                  {formatTime(draft.selectedSlot.start)} -{" "}
                  {formatTime(draft.selectedSlot.end)}
                </span>
                <span className="text-zinc-400 text-xs">
                  ({draft.duration}hr{draft.duration > 1 ? "s" : ""})
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Session Details */}
        <div
          className={`p-2.5 rounded-xl bg-zinc-800/50 border ${
            draft.isEditMode ? "border-blue-700/30" : "border-zinc-700"
          }`}
        >
          <h3 className="text-xs font-medium text-zinc-400 mb-1.5">
            Session Details
          </h3>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Mic
                className={`w-3.5 h-3.5 ${
                  draft.isEditMode ? "text-blue-400" : "text-violet-400"
                }`}
              />
              <span className="text-white text-xs">{draft.sessionType}</span>
            </div>
            {getSessionDetails() && (
              <div className="flex items-center gap-2">
                <Users
                  className={`w-3.5 h-3.5 ${
                    draft.isEditMode ? "text-blue-400" : "text-violet-400"
                  }`}
                />
                <span className="text-zinc-300 text-xs">
                  {getSessionDetails()}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Building2
                className={`w-3.5 h-3.5 ${
                  draft.isEditMode ? "text-blue-400" : "text-violet-400"
                }`}
              />
              <span className="text-white text-xs">{draft.studio}</span>
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        <div
          className={`p-2.5 rounded-xl ${
            draft.isEditMode
              ? "bg-blue-500/10 border border-blue-500/20"
              : "bg-violet-500/10 border border-violet-500/20"
          }`}
        >
          <h3
            className={`text-xs font-medium ${
              draft.isEditMode ? "text-blue-400" : "text-violet-400"
            } mb-1.5`}
          >
            Payment Summary
          </h3>
          <div className="space-y-1">
            {/* Base Rate Calculation */}
            {draft.soundOperator === "Not Required" ? (
              <>
                 <div className="flex items-center justify-between">
                  <span className="text-zinc-400 text-xs">Standard Rate</span>
                  <span className="text-zinc-400 text-xs line-through">
                    ₹{(draft.ratePerHour + 50).toLocaleString("en-IN")}/hour
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-green-400 text-xs">No Sound Op Discount</span>
                  <span className="text-green-400 text-xs">
                    -₹50/hour
                  </span>
                </div>
              </>
            ) : null}

            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-xs">Final Rate</span>
              <span className="text-white text-xs">
                ₹{draft.ratePerHour.toLocaleString("en-IN")}/hour
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-xs">Duration</span>
              <span className="text-white text-xs">
                {draft.duration} hour{draft.duration > 1 ? "s" : ""}
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
            
            {draft.soundOperator === "Not Required" && (
              <div className="flex items-center justify-between">
                <span className="text-green-400 text-xs">Total Discount</span>
                <span className="text-green-400 text-xs">
                  -₹{(50 * draft.duration).toLocaleString("en-IN")}
                </span>
              </div>
            )}

            {/* Prompt Payment Discount */}
            {draft.isPromptPayment && (
              <div className="flex items-center justify-between">
                <span className="text-amber-400 text-xs">Prompt Payment Discount</span>
                <span className="text-amber-400 text-xs">
                  -₹{(20 * draft.duration).toLocaleString("en-IN")}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-dashed border-white/10">
              <span className="text-white font-medium text-xs">
                Final Payable
              </span>
              <span
                className={`text-lg font-bold ${
                  draft.isEditMode ? "text-blue-400" : "text-violet-400"
                }`}
              >
                ₹{(totalAmount - (draft.isPromptPayment ? 20 * draft.duration : 0)).toLocaleString("en-IN")}
              </span>
            </div>


          </div>
        </div>

        {/* Prompt Payment Option */}
        {!draft.isEditMode && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <label className="flex items-start gap-3 cursor-pointer">
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  checked={draft.isPromptPayment}
                  onChange={(e) => updateDraft({ isPromptPayment: e.target.checked })}
                  className="w-4 h-4 rounded border-amber-500/50 bg-amber-900/20 text-amber-500 focus:ring-amber-500 focus:ring-offset-0"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium text-amber-400">Pay Now & Save</span>
                </div>
                <p className="text-xs text-amber-200/80 mb-2">
                  Get <span className="text-amber-400 font-bold">₹20 off per hour</span> by paying immediately via UPI.
                </p>
                
                {draft.isPromptPayment && (
                  <div className="mt-3 p-3 bg-black/40 rounded-lg border border-amber-500/20">
                    <div className="flex gap-2 items-start mb-2 text-red-400">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <p className="text-xs font-medium">Important: STRICTLY NON-CANCELLABLE. Rescheduling allowed 24h prior.</p>
                    </div>
                    <div className="aspect-square bg-white p-2 rounded-lg w-72 mx-auto mb-2 relative h-72">
                       <Image
                        src="/public-qr.jpeg"
                        alt="UPI QR Code"
                        fill
                        className="object-contain p-2"
                       />
                    </div>
                    <p className="text-[10px] text-zinc-400 text-center">Scan to pay securely</p>
                  </div>
                )}
              </div>
            </label>
          </div>
        )}

        {/* Note */}
        {draft.isEditMode && (
          <p className="text-xs text-zinc-500 text-center">
            Your booking will be updated with these new details.
          </p>
        )}
      </div>
    </StepLayout>
  );
}
