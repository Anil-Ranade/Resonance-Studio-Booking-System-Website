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
import { getStudioSuggestion, getStudioRate } from "../utils/studioSuggestion";

const KARAOKE_OPTIONS: {
  value: KaraokeOption;
  label: string;
  description: string;
}[] = [
  { value: "1_5", label: "1–5 participants", description: "Small group" },
  { value: "6_10", label: "6–10 participants", description: "Medium group" },
  { value: "11_20", label: "11–20 participants", description: "Large group" },
  {
    value: "21_30",
    label: "21–30 participants",
    description: "Extra large group",
  },
];

// Live musician options (updated to match new requirements)
const LIVE_OPTIONS: {
  value: LiveMusicianOption;
  label: string;
  description: string;
}[] = [
  { value: "1_2", label: "1–2 musicians", description: "Solo or duo" },
  { value: "3_4", label: "3–4 musicians", description: "Small band" },
  { value: "5", label: "5 musicians", description: "Medium band" },
  { value: "6_8", label: "6–8 musicians", description: "Medium ensemble" },
  { value: "9_12", label: "9–12 musicians", description: "Large ensemble" },
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

  const handleBandContinue = () => {
    // This is now handled by the Sound Operator selection
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
          <div className="space-y-2">
            {!draft.isEditMode && (
              <div className="mb-1 p-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                <p className="text-xs text-zinc-300">
                  You have selected <span className="font-bold text-white">Karaoke</span>. 
                  Now select how many participants...
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              {KARAOKE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleKaraokeSelect(option.value)}
                  className={`w-full flexflex-col items-start p-3 rounded-lg border transition-all text-left ${
                    draft.karaokeOption === option.value
                      ? "bg-violet-500/20 border-violet-500"
                      : "bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600"
                  }`}
                >
                  <span className={`font-semibold text-sm ${
                    draft.karaokeOption === option.value ? "text-white" : "text-zinc-300"
                  }`}>
                    {option.label}
                  </span>
                  <p className="text-[10px] text-zinc-400 mt-0.5">{option.description}</p>
                </button>
              ))}
            </div>

          </div>
        );

      case "Live with musicians":
        return (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {LIVE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleLiveSelect(option.value)}
                  className={`w-full flex flex-col items-start p-3 rounded-lg border transition-all text-left ${
                    draft.liveOption === option.value
                      ? "bg-violet-500/20 border-violet-500"
                      : "bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600"
                  }`}
                >
                  <span className={`font-semibold text-sm ${
                    draft.liveOption === option.value ? "text-white" : "text-zinc-300"
                  }`}>
                    {option.label}
                  </span>
                  <p className="text-[10px] text-zinc-400 mt-0.5">{option.description}</p>
                </button>
              ))}
            </div>

          </div>
        );

      case "Only Drum Practice":
        return (
          <div className="flex flex-col items-center justify-center py-2 text-center">
            <div className="p-3 rounded-full bg-violet-500/20 mb-2">
              <Drum className="w-8 h-8 text-violet-400" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">
              Drum Practice Session
            </h3>
            <p className="text-zinc-400 text-xs max-w-xs">
              Drum practice is available exclusively in Studio A with our
              professional drum kit.
            </p>
            <div className="mt-2 px-3 py-1.5 bg-zinc-800 rounded-lg">
              <span className="text-violet-400 font-semibold text-sm">
                ₹350/hour
              </span>
            </div>

          </div>
        );

      case "Band":
        return (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {BAND_EQUIPMENT.map((equipment) => (
                <button
                  key={equipment.value}
                  onClick={() => handleBandEquipmentToggle(equipment.value)}
                  className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all ${
                    draft.bandEquipment.includes(equipment.value)
                      ? "bg-violet-500/20 border-violet-500 text-white"
                      : "bg-zinc-800/50 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${
                      draft.bandEquipment.includes(equipment.value)
                        ? "bg-violet-500 text-white"
                        : "bg-zinc-700 text-zinc-400"
                    }`}
                  >
                    {equipment.icon}
                  </div>
                  <span className="font-medium text-sm text-white">
                    {equipment.label}
                  </span>
                </button>
              ))}
            </div>
            {draft.bandEquipment.length > 0 && (
              <>
                <div className="mt-2 p-2 bg-zinc-800/50 rounded-lg text-xs text-zinc-400">
                  Selected:{" "}
                  {draft.bandEquipment
                    .map(
                      (e) => BAND_EQUIPMENT.find((eq) => eq.value === e)?.label
                    )
                    .join(", ")}
                </div>
    
              </>
            )}
          </div>
        );

      case "Recording":
        return (
          <div className="space-y-2">
            {RECORDING_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleRecordingSelect(option.value)}
                className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left ${
                  draft.recordingOption === option.value
                    ? "bg-violet-500/20 border-violet-500"
                    : "bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600"
                }`}
              >
                <div>
                  <span className={`font-semibold text-sm ${
                    draft.recordingOption === option.value ? "text-white" : "text-zinc-300"
                  }`}>
                    {option.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-violet-400">
                    {option.price}
                  </span>
                </div>
              </button>
            ))}

          </div>
        );

      default:
        return (
          <div className="text-center py-4 text-zinc-400">
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
      {/* Edit Mode Banner */}
      {draft.isEditMode && getOriginalDetails() && (
        <div className="mb-2 p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-violet-400" />
          <span className="text-xs text-violet-400">
            Original:{" "}
            <span className="font-medium">{getOriginalDetails()}</span>
          </span>
        </div>
      )}

      {renderContent()}
    </StepLayout>
  );
}
