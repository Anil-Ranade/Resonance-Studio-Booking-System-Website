"use client";

import { Building2, Lock, AlertCircle, RotateCcw, Sparkles } from "lucide-react";
import { useBooking, StudioName } from "../contexts/BookingContext";
import StepLayout from "./StepLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { optionCard } from "./optionStyles";
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
      {draft.isEditMode && draft.originalChoices && (
        <Badge variant="outline" className="mb-3 border-primary/40 text-primary">
          <RotateCcw /> Original: {draft.originalChoices.studio}
        </Badge>
      )}

      {!draft.isEditMode && draft.recommendedStudio && (
        <div className="mb-3 space-y-2">
          <p className="text-sm text-muted-foreground">
            Recommended:{" "}
            <span className="font-semibold text-foreground">{draft.recommendedStudio}</span>
            {upgradeOptions.length > 0 && <> (or upgrade to {upgradeOptions.join(" / ")})</>}
          </p>
          <Alert className="border-emerald-500/25 bg-emerald-500/10 text-emerald-300">
            <Sparkles />
            <AlertTitle>Earn cashback on every booking</AlertTitle>
            <AlertDescription className="text-emerald-300/80 text-xs">
              Join our Rolling Milestone program
            </AlertDescription>
          </Alert>
        </div>
      )}

      <ToggleGroup
        type="single"
        orientation="vertical"
        value={draft.studio || ""}
        onValueChange={() => {}}
        className="w-full gap-2"
      >
        {STUDIOS.map((studio) => {
          const { isAllowed, isRecommended, isOriginal } = getStudioStatus(studio.name);
          const rate = getStudioRate(studio.name, draft.sessionType as any, {
            karaokeOption: draft.karaokeOption as any,
            liveOption: draft.liveOption as any,
            bandEquipment: draft.bandEquipment,
            recordingOption: draft.recordingOption,
          });
          const isRecording = draft.sessionType === "Recording";

          return (
            <ToggleGroupItem
              key={studio.name}
              value={studio.name}
              onClick={() => handleStudioSelect(studio.name)}
              disabled={!isAllowed}
              className={`${optionCard} flex-row items-start justify-between gap-3 ${
                isRecommended && isAllowed ? "border-primary/50" : ""
              }`}
            >
              <span className="flex-1 min-w-0 space-y-1">
                <span className="flex items-center gap-2 flex-wrap">
                  <Building2 className="text-primary" />
                  <span className="font-semibold text-sm">{studio.name}</span>
                  {isOriginal && isAllowed && (
                    <Badge variant="outline" className="border-primary/40 text-primary">Original</Badge>
                  )}
                  {isRecommended && isAllowed && !isOriginal && <Badge>Recommended</Badge>}
                  {!isAllowed && <Lock className="text-muted-foreground" />}
                </span>
                <span className="block text-xs text-muted-foreground truncate">
                  {isRecording ? "Professional recording studio" : studio.description}
                </span>
                <Badge variant="secondary" className="font-normal">
                  {isRecording ? "Recording equipment" : `Up to ${studio.capacity}`}
                </Badge>
              </span>
              {isAllowed && (
                <span className="text-sm font-semibold text-primary whitespace-nowrap">
                  ₹{rate.toLocaleString("en-IN")}
                  {isRecording ? "/song" : "/hr"}
                </span>
              )}
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>

      {draft.allowedStudios.length > 0 && draft.allowedStudios.length < 3 && (
        <Alert className="mt-3 border-amber-500/25 bg-amber-500/10 text-amber-300">
          <AlertCircle />
          <AlertDescription className="text-amber-300/90 text-xs">
            Some studios are unavailable for your group size. Select an available studio above.
          </AlertDescription>
        </Alert>
      )}
    </StepLayout>
  );
}
