"use client";

import { Mic, Music, Drum, Guitar, Radio, RotateCcw, Users } from "lucide-react";
import { useBooking, SessionType } from "../contexts/BookingContext";
import StepLayout from "./StepLayout";
import { getStudioSuggestion, getStudioRate } from "../utils/studioSuggestion";

const SESSION_TYPES: {
  name: SessionType;
  icon: React.ReactNode;
  description: string;
}[] = [
  {
    name: "Karaoke",
    icon: <Mic className="w-6 h-6" />,
    description: "Sing along with lyrics",
  },
  {
    name: "Live with musicians",
    icon: <Music className="w-6 h-6" />,
    description: "Live performance session",
  },
  {
    name: "Only Drum Practice",
    icon: <Drum className="w-6 h-6" />,
    description: "Drum practice only",
  },
  {
    name: "Band",
    icon: <Guitar className="w-6 h-6" />,
    description: "Full band rehearsal",
  },
  {
    name: "Recording",
    icon: <Radio className="w-6 h-6" />,
    description: "Professional recording",
  },
  {
    name: "Meetings / Classes",
    icon: <Users className="w-6 h-6" />,
    description: "Without Sound Operator",
  },
];

export default function SessionStep() {
  const { draft, updateDraft, nextStep, setStep } = useBooking();

  const handleSelect = (sessionType: SessionType) => {
    // Reset dependent fields when session type changes
    updateDraft({
      sessionType,
      karaokeOption: "",
      liveOption: "",
      bandEquipment: [],
      recordingOption: "",
      studio: "",
      recommendedStudio: "",
      allowedStudios: [],
    });

    // Auto-advance after selection
    // Special Rule: Only Drum Practice and Meetings/Classes skip participants page and go directly to studio
    if (sessionType === "Only Drum Practice" || sessionType === "Meetings / Classes") {
      const suggestion = getStudioSuggestion(sessionType, {});
      const rate = getStudioRate(
        suggestion.recommendedStudio,
        sessionType,
        {}
      );

      // Use setTimeout to allow state update first
      setTimeout(() => {
        updateDraft({
          recommendedStudio: suggestion.recommendedStudio,
          allowedStudios: suggestion.allowedStudios,
          studio: suggestion.recommendedStudio,
          ratePerHour: rate,
        });
        setStep("studio");
      }, 150);
    } else {
      setTimeout(() => {
        nextStep();
      }, 150);
    }
  };

  // Check if this is the original choice in edit mode
  const isOriginalChoice = (sessionName: SessionType) => {
    return (
      draft.isEditMode && draft.originalChoices?.sessionType === sessionName
    );
  };

  return (
    <StepLayout
      title={draft.isEditMode ? "Modify session type" : "What type of session?"}
      subtitle={
        draft.isEditMode
          ? "Your original choice is highlighted. Select to change."
          : "Select the type of session you want to book"
      }
    >
      {/* Edit Mode Banner */}
      {draft.isEditMode && draft.originalChoices && (
        <div className="mb-3 p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-violet-400" />
          <span className="text-sm text-violet-400">
            Modifying booking • Original:{" "}
            <span className="font-medium">
              {draft.originalChoices.sessionType}
            </span>
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {SESSION_TYPES.map((session) => {
          const isOriginal = isOriginalChoice(session.name);
          const isRecording = session.name === "Recording";

          return (
            <button
              key={session.name}
              disabled={isRecording}
              onClick={() => !isRecording && handleSelect(session.name)}
              className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-center ${
                isRecording
                  ? "bg-zinc-900/40 border-zinc-800/50 text-zinc-600 cursor-not-allowed opacity-70"
                  : isOriginal
                  ? "bg-amber-500/10 border-amber-500/30 text-zinc-300 hover:bg-amber-500/15 hover:border-amber-500/50"
                  : "bg-zinc-800/50 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600"
              }`}
            >
              {/* Original Choice Badge */}
              {isOriginal && !isRecording && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-amber-500 rounded-full" title="Original Choice" />
              )}

              {/* Coming Soon Badge */}
              {isRecording && (
                <span className="absolute top-2 right-2 px-2 py-1 text-xs font-medium bg-zinc-800 text-zinc-500 border border-zinc-700 rounded-full">
                  Soon
                </span>
              )}

              <div
                className={`p-2 rounded-lg ${
                  isRecording
                    ? "bg-zinc-800/50 text-zinc-700"
                    : isOriginal
                    ? "bg-amber-500/20 text-amber-400"
                    : "bg-zinc-700 text-zinc-400"
                }`}
              >
                {session.icon}
              </div>
              <div className="w-full min-w-0">
                <h3
                  className={`font-semibold text-lg leading-tight mb-1 ${
                    isRecording ? "text-zinc-600" : "text-white"
                  }`}
                >
                  {session.name}
                </h3>
              </div>
            </button>
          );
        })}
      </div>
    </StepLayout>
  );
}
