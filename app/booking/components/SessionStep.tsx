'use client';

import { Mic, Music, Drum, Guitar, Radio, RotateCcw } from 'lucide-react';
import { useBooking, SessionType } from '../contexts/BookingContext';
import StepLayout from './StepLayout';

const SESSION_TYPES: { name: SessionType; icon: React.ReactNode; description: string }[] = [
  { name: 'Karaoke', icon: <Mic className="w-6 h-6" />, description: 'Sing along with friends' },
  { name: 'Live with musicians', icon: <Music className="w-6 h-6" />, description: 'Live performance session' },
  { name: 'Only Drum Practice', icon: <Drum className="w-6 h-6" />, description: 'Drum practice only' },
  { name: 'Band', icon: <Guitar className="w-6 h-6" />, description: 'Full band rehearsal' },
  { name: 'Recording', icon: <Radio className="w-6 h-6" />, description: 'Professional recording' },
];

export default function SessionStep() {
  const { draft, updateDraft, nextStep } = useBooking();

  const handleSelect = (sessionType: SessionType) => {
    // Reset dependent fields when session type changes
    updateDraft({
      sessionType,
      karaokeOption: '',
      liveOption: '',
      bandEquipment: [],
      recordingOption: '',
      studio: '',
      recommendedStudio: '',
      allowedStudios: [],
    });
  };

  const handleNext = () => {
    if (draft.sessionType) {
      nextStep();
    }
  };

  // Check if this is the original choice in edit mode
  const isOriginalChoice = (sessionName: SessionType) => {
    return draft.isEditMode && draft.originalChoices?.sessionType === sessionName;
  };

  return (
    <StepLayout
      title={draft.isEditMode ? "Modify session type" : "What type of session?"}
      subtitle={draft.isEditMode ? "Your original choice is highlighted. Select to change or keep the same." : "Select the type of session you want to book"}
      onNext={handleNext}
    >
      {/* Edit Mode Banner */}
      {draft.isEditMode && draft.originalChoices && (
        <div className="mb-4 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-violet-400" />
          <span className="text-sm text-violet-400">
            Modifying booking • Original: <span className="font-medium">{draft.originalChoices.sessionType}</span>
          </span>
        </div>
      )}
      
      <div className="grid gap-3">
        {SESSION_TYPES.map((session) => {
          const isOriginal = isOriginalChoice(session.name);
          const isSelected = draft.sessionType === session.name;
          
          return (
            <button
              key={session.name}
              onClick={() => handleSelect(session.name)}
              className={`relative flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                isSelected
                  ? 'bg-violet-500/20 border-violet-500 text-white'
                  : isOriginal
                    ? 'bg-amber-500/10 border-amber-500/30 text-zinc-300 hover:bg-amber-500/15 hover:border-amber-500/50'
                    : 'bg-zinc-800/50 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600'
              }`}
            >
              {/* Original Choice Badge */}
              {isOriginal && !isSelected && (
                <span className="absolute -top-2 left-3 px-2 py-0.5 text-xs font-medium bg-amber-500 text-black rounded-full">
                  Original
                </span>
              )}
              
              <div
                className={`p-3 rounded-lg ${
                  isSelected
                    ? 'bg-violet-500 text-white'
                    : isOriginal
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-zinc-700 text-zinc-400'
                }`}
              >
                {session.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-medium">{session.name}</h3>
                <p className="text-sm text-zinc-400">{session.description}</p>
              </div>
              {isSelected && (
                <div className="ml-auto">
                  <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </StepLayout>
  );
}
