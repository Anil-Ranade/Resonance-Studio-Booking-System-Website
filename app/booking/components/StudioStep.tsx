"use client";

import { Building2, Lock, AlertCircle, RotateCcw, Sparkles } from "lucide-react";
import { useBooking, StudioName } from "../contexts/BookingContext";
import StepLayout from "./StepLayout";
import { getStudioRate, isStudioAllowed } from "../utils/studioSuggestion";

const STUDIOS: {
  name: StudioName;
  description: string;
  capacity: string;
  features: string[];
}[] = [
  {
    name: "Studio C",
    description: "Cozy space for small groups",
    capacity: "5 participants",
    features: ["Perfect for duets", "Intimate setting"],
  },
  {
    name: "Studio B",
    description: "Medium-sized versatile space",
    capacity: "10 participants",
    features: ["Band rehearsal ready", "Karaoke setup"],
  },
  {
    name: "Studio A",
    description: "Our largest studio for big groups",
    capacity: "30 participants",
    features: ["Full band setup", "Recording equipment"],
  },
];

export default function StudioStep() {
  const { draft, updateDraft, nextStep, setStep } = useBooking();

  const handleStudioSelect = (studio: StudioName) => {
    // Check if studio is allowed
    if (!isStudioAllowed(studio, draft.allowedStudios)) {
      return;
    }

    // Calculate rate for this studio
    const rate = getStudioRate(studio, draft.sessionType as any, {
      karaokeOption: draft.karaokeOption as any,
      liveOption: draft.liveOption as any,
      bandEquipment: draft.bandEquipment,
      recordingOption: draft.recordingOption,
    });

    updateDraft({
      studio,
      ratePerHour: rate,
    });

    // Auto-advance to next step
    setTimeout(() => nextStep(), 150);
  };

  // Handle back navigation - skip participants step for Only Drum Practice
  const handleBack = () => {
    if (draft.sessionType === "Only Drum Practice") {
      setStep("session");
    } else {
      setStep("participants");
    }
  };

  const getStudioStatus = (studio: StudioName) => {
    const isAllowed = isStudioAllowed(studio, draft.allowedStudios);
    const isRecommended = studio === draft.recommendedStudio;
    const isOriginal =
      draft.isEditMode && draft.originalChoices?.studio === studio;

    return { isAllowed, isRecommended, isOriginal };
  };

  const upgradeOptions = STUDIOS.filter(
    (s) =>
      s.name !== draft.recommendedStudio &&
      isStudioAllowed(s.name, draft.allowedStudios)
  ).map((s) => s.name);

  return (
    <StepLayout
      title={draft.isEditMode ? "Modify studio" : "Choose your studio"}
      subtitle={
        draft.isEditMode
          ? "Your original choice is highlighted. Select to change."
          : "Select the perfect studio for your session"
      }
      onBack={handleBack}
    >
      {/* Edit Mode Banner */}
      {draft.isEditMode && draft.originalChoices && (
        <div className="mb-4 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-violet-400" />
          <span className="text-xs text-violet-400">
            Modifying booking • Original:{" "}
            <span className="font-medium">{draft.originalChoices.studio}</span>
          </span>
        </div>
      )}

      {/* Recommendation and Teaser Section */}
      {!draft.isEditMode && draft.recommendedStudio && (
        <div className="mb-4">
          {/* Recommendation Message */}
          <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50 shadow-sm mb-2">
            <p className="text-xs text-zinc-300 leading-tight">
              Recommended: <span className="font-bold text-white">{draft.recommendedStudio}</span>
              {upgradeOptions.length > 0 && (
                <span className="text-zinc-400"> (or upgrade to {upgradeOptions.join(" / ")})</span>
              )}
            </p>
          </div>

          {/* Discount & Cashback Teaser */}
          <div className="flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
            <div className="p-1 rounded bg-emerald-500/20 text-emerald-400">
              <Sparkles className="w-3 h-3" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-400 leading-none">
                Instant discounts available
              </p>
              <p className="text-[10px] text-emerald-400/80 leading-none mt-0.5">
                Plus fixed cashback per hour
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {STUDIOS.map((studio) => {
          const { isAllowed, isRecommended, isOriginal } = getStudioStatus(
            studio.name
          );

          // Calculate rate for display
          const rate = getStudioRate(studio.name, draft.sessionType as any, {
            karaokeOption: draft.karaokeOption as any,
            liveOption: draft.liveOption as any,
            bandEquipment: draft.bandEquipment,
            recordingOption: draft.recordingOption,
          });

          // Determine rate unit based on session type
          const rateUnit = draft.sessionType === "Recording" ? "/song" : "/hr";

          // Get description based on session type
          const getDescription = () => {
            if (draft.sessionType === "Recording") {
              return "Professional recording studio";
            }
            return studio.description;
          };

          // Get capacity text based on session type
          const getCapacityText = () => {
            if (draft.sessionType === "Recording") {
              return "Recording equipment";
            }
            return `Up to ${studio.capacity}`;
          };

          return (
            <button
              key={studio.name}
              onClick={() => handleStudioSelect(studio.name)}
              disabled={!isAllowed}
              className={`relative w-full p-2.5 rounded-lg border-2 transition-all text-left ${
                isOriginal && isAllowed
                  ? "bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/15 hover:border-amber-500/50"
                  : isRecommended && isAllowed
                  ? "bg-gradient-to-br from-violet-500/15 to-purple-500/10 border-violet-500/50 hover:border-violet-400 shadow-lg shadow-violet-500/10"
                  : isAllowed
                  ? "bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600"
                  : "bg-zinc-900/50 border-zinc-800 opacity-50 cursor-not-allowed"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <div className="flex items-center gap-1.5">
                      <Building2
                        className={`w-3.5 h-3.5 ${
                          isOriginal
                            ? "text-amber-400"
                            : isRecommended
                            ? "text-violet-400"
                            : "text-zinc-400"
                        }`}
                      />
                      <h3
                        className={`font-bold text-lg leading-tight ${
                          isAllowed
                            ? isRecommended
                              ? "text-white"
                              : "text-zinc-200"
                            : "text-zinc-500"
                        }`}
                      >
                        {studio.name}
                      </h3>
                    </div>
                    
                    {/* Badges inline or close to title */}
                    {isOriginal && isAllowed && (
                      <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium bg-amber-500 text-black rounded-full leading-none">
                        Original
                      </span>
                    )}
                    {isRecommended && isAllowed && !isOriginal && (
                      <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold bg-violet-500 text-white rounded-full leading-none shadow-sm">
                        Recommended
                      </span>
                    )}
                     {!isAllowed && <Lock className="w-3 h-3 text-zinc-500" />}
                  </div>

                  <p
                    className={`text-[10px] leading-tight truncate ${
                      isAllowed ? "text-zinc-400" : "text-zinc-600"
                    }`}
                  >
                    {getDescription()}
                  </p>
                  
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        isAllowed
                          ? "bg-zinc-700 text-zinc-300"
                          : "bg-zinc-800 text-zinc-500"
                      }`}
                    >
                      {getCapacityText()}
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col items-end flex-shrink-0">
                  {isAllowed && (
                    <span
                      className={`text-lg font-bold whitespace-nowrap ${
                        isOriginal
                          ? "text-amber-400"
                          : isRecommended
                          ? "text-violet-300"
                          : "text-violet-400"
                      }`}
                    >
                      ₹{rate.toLocaleString("en-IN")}
                      {rateUnit}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}

        {/* Error message for disabled studios */}
        {draft.allowedStudios.length > 0 && draft.allowedStudios.length < 3 && (
          <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertCircle className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-400 leading-tight">
              Some studios are unavailable for your group size. Select an available studio above.
            </p>
          </div>
        )}
      </div>
    </StepLayout>
  );
}
