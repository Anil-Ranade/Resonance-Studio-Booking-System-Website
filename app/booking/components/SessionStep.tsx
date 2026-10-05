"use client";

import { Mic, Music, Drum, Guitar, Radio, RotateCcw, Users } from "lucide-react";
import { useBooking, SessionType } from "../contexts/BookingContext";
import StepLayout from "./StepLayout";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { optionCard } from "./optionStyles";
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
      {draft.isEditMode && draft.originalChoices && (
        <Badge variant="outline" className="mb-3 border-primary/40 text-primary">
          <RotateCcw /> Original: {draft.originalChoices.sessionType}
        </Badge>
      )}

      <ToggleGroup
        type="single"
        value={draft.sessionType || ""}
        onValueChange={() => {}}
        className="grid w-full grid-cols-2 gap-2"
      >
        {SESSION_TYPES.map((session) => {
          const isOriginal = isOriginalChoice(session.name);
          const isRecording = session.name === "Recording";

          return (
            <ToggleGroupItem
              key={session.name}
              value={session.name}
              onClick={() => handleSelect(session.name)}
              disabled={isRecording}
              className={`${optionCard} relative items-center text-center py-4 gap-2`}
            >
              {isRecording && (
                <Badge variant="secondary" className="absolute top-2 right-2 text-[10px]">
                  Soon
                </Badge>
              )}
              {isOriginal && !isRecording && (
                <Badge variant="outline" className="absolute top-2 right-2 text-[10px] border-primary/40 text-primary">
                  Original
                </Badge>
              )}
              <span className="p-2 rounded-lg bg-primary/10 text-primary [&_svg]:size-6!">
                {session.icon}
              </span>
              <span className="font-semibold text-sm leading-tight">{session.name}</span>
              <span className="text-[11px] text-muted-foreground leading-tight">
                {session.description}
              </span>
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>
    </StepLayout>
  );
}
