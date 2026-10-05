"use client";

import { Users, Drum, Radio, Guitar, Music, RotateCcw } from "lucide-react";
import {
  useBooking,
  KaraokeOption,
  LiveMusicianOption,
  BandEquipment,
  RecordingOption,
} from "../contexts/BookingContext";
import StepLayout from "./StepLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { optionCard } from "./optionStyles";
import { getStudioSuggestion, getStudioRate } from "../utils/studioSuggestion";

const KARAOKE_OPTIONS: {
  value: KaraokeOption;
  label: string;
  description: string;
}[] = [
  { value: "1_5", label: "1-5 participants", description: "Small group" },
  { value: "6_10", label: "6-10 participants", description: "Medium group" },
  { value: "11_20", label: "11-20 participants", description: "Large group" },
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
  description: string;
}[] = [
  { value: "1_2", label: "1-2 musicians", description: "Solo or duo" },
  { value: "3_4", label: "3-4 musicians", description: "Small band" },
  { value: "5", label: "5 musicians", description: "Medium band" },
  { value: "6_8", label: "6-8 musicians", description: "Medium ensemble" },
  { value: "9_12", label: "9-12 musicians", description: "Large ensemble" },
];

// Band equipment options
const BAND_EQUIPMENT: {
  value: BandEquipment;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: "drum", label: "Drums", icon: <Drum className="w-5 h-5" /> },
  { value: "amps", label: "Amps", icon: <Radio className="w-5 h-5" /> },
  { value: "guitars", label: "Guitars", icon: <Guitar className="w-5 h-5" /> },
  { value: "keyboard", label: "Keyboard", icon: <Music className="w-5 h-5" /> },
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
  const { draft, updateDraft, nextStep, setStep } = useBooking();

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

  const handleBandEquipmentToggle = (equipment: BandEquipment) => {
    const current = draft.bandEquipment;
    let newEquipment: BandEquipment[];

    if (current.includes(equipment)) {
      newEquipment = current.filter((e) => e !== equipment);
    } else {
      newEquipment = [...current, equipment];
    }

    if (newEquipment.length > 0) {
      const suggestion = getStudioSuggestion("Band", {
        bandEquipment: newEquipment,
      });
      const rate = getStudioRate(suggestion.recommendedStudio, "Band", {
        bandEquipment: newEquipment,
      });

      updateDraft({
        bandEquipment: newEquipment,
        recommendedStudio: suggestion.recommendedStudio,
        allowedStudios: suggestion.allowedStudios,
        studio: suggestion.recommendedStudio,
        ratePerHour: rate,
      });
    } else {
      updateDraft({
        bandEquipment: newEquipment,
        recommendedStudio: "",
        allowedStudios: [],
        studio: "",
        ratePerHour: 0,
      });
    }
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
                <span className="text-xs text-muted-foreground">{option.description}</span>
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
                <span className="text-xs text-muted-foreground">{option.description}</span>
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
                Drum practice is available exclusively in Studio A with our
                professional drum kit.
              </p>
              <Badge className="text-sm h-7 px-3">₹350/hour</Badge>
            </CardContent>
          </Card>
        );

      case "Band":
        return (
          <div className="space-y-2">
            <ToggleGroup
              type="multiple"
              value={draft.bandEquipment}
              onValueChange={(v) => {
                // Radix gives the full next set; toggle the one item that changed.
                const changed =
                  v.find((e) => !draft.bandEquipment.includes(e as BandEquipment)) ??
                  draft.bandEquipment.find((e) => !v.includes(e));
                if (changed) handleBandEquipmentToggle(changed as BandEquipment);
              }}
              className="grid w-full grid-cols-2 gap-2"
            >
              {BAND_EQUIPMENT.map((equipment) => (
                <ToggleGroupItem
                  key={equipment.value}
                  value={equipment.value}
                  className={`${optionCard} items-center text-center gap-1.5`}
                >
                  <span className="p-2 rounded-lg bg-primary/10 text-primary">
                    {equipment.icon}
                  </span>
                  <span className="font-medium text-sm">{equipment.label}</span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            {draft.bandEquipment.length > 0 && (
              <p className="text-xs text-muted-foreground px-1">
                Selected:{" "}
                {draft.bandEquipment
                  .map((e) => BAND_EQUIPMENT.find((eq) => eq.value === e)?.label)
                  .join(", ")}
              </p>
            )}
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
