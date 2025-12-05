'use client';

import { Building2, Lock, AlertCircle, RotateCcw } from 'lucide-react';
import { useBooking, StudioName } from '../contexts/BookingContext';
import StepLayout from './StepLayout';
import { getStudioRate, isStudioAllowed } from '../utils/studioSuggestion';

const STUDIOS: { name: StudioName; description: string; capacity: string; features: string[] }[] = [
  { 
    name: 'Studio C', 
    description: 'Cozy space for small groups', 
    capacity: '5 participants',
    features: ['Perfect for duets', 'Intimate setting']
  },
  { 
    name: 'Studio B', 
    description: 'Medium-sized versatile space', 
    capacity: '12 participants',
    features: ['Band rehearsal ready', 'Karaoke setup']
  },
  { 
    name: 'Studio A', 
    description: 'Our largest studio for big groups', 
    capacity: '30 participants',
    features: ['Full band setup', 'Recording equipment']
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
    if (draft.sessionType === 'Only Drum Practice') {
      setStep('session');
    } else {
      setStep('participants');
    }
  };

  const getStudioStatus = (studio: StudioName) => {
    const isAllowed = isStudioAllowed(studio, draft.allowedStudios);
    const isRecommended = studio === draft.recommendedStudio;
    const isOriginal = draft.isEditMode && draft.originalChoices?.studio === studio;
    
    return { isAllowed, isRecommended, isOriginal };
  };

  return (
    <StepLayout
      title={draft.isEditMode ? "Modify studio" : "Choose your studio"}
      subtitle={draft.isEditMode 
        ? "Your original choice is highlighted. Select to change."
        : (draft.recommendedStudio ? `We recommend ${draft.recommendedStudio} for your session` : 'Select a studio')}
      onBack={handleBack}
    >
      {/* Edit Mode Banner */}
      {draft.isEditMode && draft.originalChoices && (
        <div className="mb-2 p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-violet-400" />
          <span className="text-xs text-violet-400">
            Modifying booking • Original: <span className="font-medium">{draft.originalChoices.studio}</span>
          </span>
        </div>
      )}
      
      <div className="space-y-2">
        {STUDIOS.map((studio) => {
          const { isAllowed, isRecommended, isOriginal } = getStudioStatus(studio.name);
          
          // Calculate rate for display
          const rate = getStudioRate(studio.name, draft.sessionType as any, {
            karaokeOption: draft.karaokeOption as any,
            liveOption: draft.liveOption as any,
            bandEquipment: draft.bandEquipment,
            recordingOption: draft.recordingOption,
          });

          // Determine rate unit based on session type
          const rateUnit = draft.sessionType === 'Recording' ? '/song' : '/hr';

          // Get description based on session type
          const getDescription = () => {
            if (draft.sessionType === 'Recording') {
              return 'Professional recording studio';
            }
            return studio.description;
          };

          // Get capacity text based on session type
          const getCapacityText = () => {
            if (draft.sessionType === 'Recording') {
              return 'Recording equipment';
            }
            return `Up to ${studio.capacity}`;
          };

          return (
            <button
              key={studio.name}
              onClick={() => handleStudioSelect(studio.name)}
              disabled={!isAllowed}
              className={`relative w-full p-3 rounded-xl border transition-all text-left ${
                isOriginal && isAllowed
                  ? 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/15 hover:border-amber-500/50'
                  : isAllowed
                    ? 'bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600'
                    : 'bg-zinc-900/50 border-zinc-800 opacity-50 cursor-not-allowed'
              }`}
            >
              {/* Original Choice Badge */}
              {isOriginal && isAllowed && (
                <span className="absolute -top-2 left-3 px-2 py-0.5 text-xs font-medium bg-amber-500 text-black rounded-full">
                  Original
                </span>
              )}
              
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Building2 className={`w-4 h-4 ${isOriginal ? 'text-amber-400' : 'text-zinc-400'}`} />
                    <h3 className={`font-medium text-sm ${isAllowed ? 'text-zinc-200' : 'text-zinc-500'}`}>
                      {studio.name}
                    </h3>
                    {isRecommended && isAllowed && !isOriginal && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-400">
                        Recommended
                      </span>
                    )}
                    {!isAllowed && (
                      <Lock className="w-3 h-3 text-zinc-500" />
                    )}
                  </div>
                  <p className={`text-xs mt-0.5 ${isAllowed ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    {getDescription()}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${isAllowed ? 'bg-zinc-700 text-zinc-300' : 'bg-zinc-800 text-zinc-500'}`}>
                      {getCapacityText()}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  {isAllowed && (
                    <span className={`text-base font-semibold ${isOriginal ? 'text-amber-400' : 'text-violet-400'}`}>
                      ₹{rate.toLocaleString('en-IN')}{rateUnit}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}

        {/* Error message for disabled studios */}
        {draft.allowedStudios.length > 0 && draft.allowedStudios.length < 3 && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-400">
              Some studios are unavailable for your group size. Select an available studio above.
            </p>
          </div>
        )}
      </div>
    </StepLayout>
  );
}
