"use client";

import { Users, Drum, Radio, Guitar, RotateCcw } from "lucide-react";
import {
  useBooking,
  KaraokeOption,
  LiveMusicianOption,
  RecordingOption,
} from "../contexts/BookingContext";
import StepLayout from "./StepLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { optionCard } from "./optionStyles";
import { Button } from "@/components/ui/button";
import { getStudioSuggestion, getStudioRate, DRUM_STICKS_RATE } from "../utils/studioSuggestion";

const KARAOKE_OPTIONS: {
  value: KaraokeOption;
  label: string;
  description: string;
}[] = [
  { value: "1_8", label: "1-8 participants", description: "Small group" },
  { value: "9_12", label: "9-12 participants", description: "Medium group" },
  { value: "13_20", label: "13-20 participants", description: "Large group" },
  {
    value: "21_30",
    label: "21-30 participants",
    description: "Extra large group",
  },
];

// Live musician options (updated to match new requirements)
const LIVE_OPTIONS: {
  value: LiveMusicianOption;
  label: string;
}[] = [
  { value: "1_2", label: "1-2 musicians" },
  { value: "3_4", label: "3-4 musicians" },
  { value: "5", label: "5 musicians" },
  { value: "6_8", label: "6-8 musicians" },
  { value: "9_12", label: "9-12 musicians" },
];

// Recording options
const RECORDING_OPTIONS: {
  value: RecordingOption;
  label: string;
  price: string;
}[] = [
  { value: "audio_recording", label: "Audio Recording", price: "₹700/song" },
  {
    value: "video_recording",
    label: "Video Recording (4K)",
    price: "₹800/song",
  },
  {
    value: "chroma_key",
    label: "Chroma Key (Green Screen)",
    price: "₹1,200/song",
  },
];

export default function ParticipantsStep() {
  const { draft, updateDraft, nextStep } = useBooking();

  const sticks = draft.bandEquipment.includes("sticks");
  const sticksToggle = (
    <label className="flex items-center gap-2 text-sm cursor-pointer">
      <input
        type="checkbox"
        checked={sticks}
        onChange={(e) => {
          const on = e.target.checked;
          const rest = draft.bandEquipment.filter((x) => x !== "sticks");
          updateDraft({
            bandEquipment: on ? [...rest, "sticks"] : rest,
            ratePerHour:
              (draft.sessionType === "Band" ? 500 : 350) + (on ? DRUM_STICKS_RATE : 0),
          });
        }}
        className="size-4 accent-violet-400"
      />
      I need drum sticks from the studio (+₹{DRUM_STICKS_RATE}/hour)
    </label>
  );

  const handleKaraokeSelect = (option: KaraokeOption) => {
    const suggestion = getStudioSuggestion("Karaoke", {
      karaokeOption: option,
    });
    const rate = getStudioRate(suggestion.recommendedStudio, "Karaoke", {
      karaokeOption: option,
    });

    updateDraft({
      karaokeOption: option,
      recommendedStudio: suggestion.recommendedStudio,
      allowedStudios: suggestion.allowedStudios,
      studio: suggestion.recommendedStudio,
      ratePerHour: rate,
    });
    nextStep();
  };

  const handleLiveSelect = (option: LiveMusicianOption) => {
    const suggestion = getStudioSuggestion("Live with musicians", {
      liveOption: option,
    });
    const rate = getStudioRate(
      suggestion.recommendedStudio,
      "Live with musicians",
      { liveOption: option }
    );

    updateDraft({
      liveOption: option,
      recommendedStudio: suggestion.recommendedStudio,
      allowedStudios: suggestion.allowedStudios,
      studio: suggestion.recommendedStudio,
      ratePerHour: rate,
    });
    nextStep();
  };

  const handleRecordingSelect = (option: RecordingOption) => {
    const suggestion = getStudioSuggestion("Recording", {
      recordingOption: option,
    });
    const rate = getStudioRate(suggestion.recommendedStudio, "Recording", {
      recordingOption: option,
    });

    updateDraft({
      recordingOption: option,
      recommendedStudio: suggestion.recommendedStudio,
      allowedStudios: suggestion.allowedStudios,
      studio: suggestion.recommendedStudio,
      ratePerHour: rate,
    });
  };



  const renderContent = () => {
    switch (draft.sessionType) {
      case "Karaoke":
        return (
          <>
            {!draft.isEditMode && (
              <p className="mb-2 text-xs text-muted-foreground">
                You have selected <span className="font-semibold text-foreground">Karaoke</span>.
                Now select how many participants.
              </p>
            )}
          <ToggleGroup
            type="single"
            value={draft.karaokeOption || ""}
            onValueChange={() => {}}
            className="grid w-full grid-cols-2 gap-2"
          >
            {KARAOKE_OPTIONS.map((option) => (
              <ToggleGroupItem key={option.value} value={option.value}
              onClick={() => handleKaraokeSelect(option.value)} className={optionCard}>
                <span className="font-semibold text-sm">{option.label}</span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          </>
        );

      case "Live with musicians":
        return (
          <ToggleGroup
            type="single"
            value={draft.liveOption || ""}
            onValueChange={() => {}}
            className="grid w-full grid-cols-2 gap-2"
          >
            {LIVE_OPTIONS.map((option) => (
              <ToggleGroupItem key={option.value} value={option.value}
              onClick={() => handleLiveSelect(option.value)} className={optionCard}>
                <span className="font-semibold text-sm">{option.label}</span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        );

      case "Only Drum Practice":
        return (
          <Card className="items-center text-center">
            <CardContent className="flex flex-col items-center gap-2">
              <div className="p-3 rounded-full bg-primary/15 text-primary">
                <Drum className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-semibold">Drum Practice Session</h3>
              <p className="text-muted-foreground text-xs max-w-xs">
                Drums are available in Studio A only. Drum sticks are not provided; if the studio provides them, ₹50/hour is charged extra.
              </p>
              {sticksToggle}
              <Badge className="text-sm h-7 px-3">₹350/hour</Badge>
            </CardContent>
          </Card>
        );

      case "Band":
        return (
          <div className="space-y-3">
            <Card>
              <CardContent className="space-y-2 text-sm">
                <h3 className="font-semibold">College Students Band · ₹500/hour</h3>
                <p className="text-muted-foreground">Includes drums, keyboard, 2 electric guitars, 2 guitar amps, and 1 bass amp.</p>
                <p className="text-muted-foreground">Drum sticks are not provided. If the studio provides them, ₹50/hour is charged extra.</p>
                {sticksToggle}
              </CardContent>
            </Card>
            <Button className="w-full" onClick={() => {
              updateDraft({
                bandEquipment: sticks
                  ? ["drum", "keyboard", "guitars", "amps", "sticks"]
                  : ["drum", "keyboard", "guitars", "amps"],
                recommendedStudio: "Studio A",
                allowedStudios: ["Studio A"],
                studio: "Studio A",
                ratePerHour: 500 + (sticks ? DRUM_STICKS_RATE : 0),
              });
              nextStep();
            }}>Continue with College Students Band</Button>
          </div>
        );

      case "Recording":
        return (
          <ToggleGroup
            type="single"
            orientation="vertical"
            value={draft.recordingOption || ""}
            onValueChange={() => {}}
            className="w-full gap-2"
          >
            {RECORDING_OPTIONS.map((option) => (
              <ToggleGroupItem
                key={option.value}
                value={option.value}
              onClick={() => handleRecordingSelect(option.value)}
                className={`${optionCard} flex-row items-center justify-between`}
              >
                <span className="font-semibold text-sm">{option.label}</span>
                <span className="text-xs font-medium text-primary">{option.price}</span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        );

      default:
        return (
          <div className="text-center py-4 text-muted-foreground">
            Please select a session type first
          </div>
        );
    }
  };

  const getTitle = () => {
    const prefix = draft.isEditMode ? "Modify " : "";
    switch (draft.sessionType) {
      case "Karaoke":
        return (
          <span className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {prefix}How many participants
          </span>
        );
      case "Live with musicians":
        return (
          <span className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {prefix}How many musicians
          </span>
        );
      case "Only Drum Practice":
        return (
          <span className="flex items-center gap-2">
            <Drum className="w-5 h-5" />
            {prefix}Drum Practice
          </span>
        );
      case "Band":
        return (
          <span className="flex items-center gap-2">
            <Guitar className="w-5 h-5" />
            {prefix}Select your equipment needs
          </span>
        );
      case "Recording":
        return (
          <span className="flex items-center gap-2">
            <Radio className="w-5 h-5" />
            {prefix}Select recording type
          </span>
        );
      default:
        return prefix + "Session details";
    }
  };

  // Get the original session details for display
  const getOriginalDetails = () => {
    if (!draft.isEditMode || !draft.originalChoices?.sessionDetails)
      return null;
    return draft.originalChoices.sessionDetails;
  };

  return (
    <StepLayout
      title={getTitle()}
      subtitle={
        draft.isEditMode
          ? "Your original choice is highlighted. Select to change."
          : draft.sessionType === "Only Drum Practice"
          ? "Available in Studio A only"
          : "This helps us to recommend the best suitable studio for you."
      }
      showNext={
        draft.sessionType === "Band" ||
        draft.sessionType === "Only Drum Practice" ||
        draft.sessionType === "Recording"
      }
      onNext={nextStep}
      isNextDisabled={false}
    >
      {draft.isEditMode && getOriginalDetails() && (
        <Badge variant="outline" className="mb-3 border-primary/40 text-primary">
          <RotateCcw /> Original: {getOriginalDetails()}
        </Badge>
      )}

      {renderContent()}
    </StepLayout>
  );
}
