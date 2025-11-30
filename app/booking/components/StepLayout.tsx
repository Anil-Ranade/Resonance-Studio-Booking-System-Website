'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Loader2, Edit3 } from 'lucide-react';
import { useBooking } from '../contexts/BookingContext';

interface StepLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  showBack?: boolean;
  showNext?: boolean;
  nextLabel?: string;
  onNext?: () => void;
  onBack?: () => void;
  isNextDisabled?: boolean;
  isLoading?: boolean;
  hideFooter?: boolean;
}

export default function StepLayout({
  title,
  subtitle,
  children,
  showBack = true,
  showNext = true,
  nextLabel = 'Next',
  onNext,
  onBack,
  isNextDisabled = false,
  isLoading = false,
  hideFooter = false,
}: StepLayoutProps) {
  const { draft, stepIndex, prevStep, nextStep, canProceed, currentStep } = useBooking();
  
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      prevStep();
    }
  };

  const handleNext = () => {
    if (onNext) {
      onNext();
    } else {
      nextStep();
    }
  };

  const canGoNext = !isNextDisabled && canProceed(currentStep);

  // Format phone for display
  const formatPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      return `${digits.slice(0, 5)} ${digits.slice(5)}`;
    }
    return phone;
  };

  // Get session details for display
  const getSessionDetails = () => {
    if (!draft.sessionType) return '';
    
    let details = draft.sessionType;
    
    if (draft.sessionType === 'Karaoke' && draft.karaokeOption) {
      const labels: Record<string, string> = {
        'upto_5': 'Up to 5 people',
        '10': '10 people',
        '20': '20 people',
        '21_30': '21-30 people',
      };
      details += ` • ${labels[draft.karaokeOption] || ''}`;
    } else if (draft.sessionType === 'Live with musicians' && draft.liveOption) {
      const labels: Record<string, string> = {
        'upto_2': 'Up to 2 musicians',
        'upto_4_or_5': '4-5 musicians',
        'upto_8': 'Up to 8 musicians',
        '9_12': '9-12 musicians',
      };
      details += ` • ${labels[draft.liveOption] || ''}`;
    } else if (draft.sessionType === 'Band' && draft.bandEquipment.length > 0) {
      const equipmentLabels: Record<string, string> = {
        'drum': 'Drums',
        'amps': 'Amps',
        'guitars': 'Guitars',
        'keyboard': 'Keyboard',
      };
      const eqList = draft.bandEquipment.map(e => equipmentLabels[e]).join(', ');
      details += ` • ${eqList}`;
    }
    
    return details;
  };

  return (
    <div className={`h-[100dvh] flex flex-col ${draft.isEditMode ? 'bg-gradient-to-b from-blue-950 via-zinc-900 to-black' : 'bg-gradient-to-b from-zinc-900 via-zinc-900 to-black'}`}>
      {/* Header with user info */}
      <header className="flex-shrink-0 px-4 pt-4 pb-2">
        {/* Edit Mode Banner */}
        {draft.isEditMode && (
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg px-3 py-2 mb-3 flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-blue-400" />
            <span className="text-blue-300 text-sm font-medium">Modifying Existing Booking</span>
          </div>
        )}
        
        {/* Progress indicator */}
        <div className="flex items-center gap-1 mb-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((step) => (
            <div
              key={step}
              className={`h-1 flex-1 rounded-full transition-colors ${
                step <= stepIndex + 1 
                  ? (draft.isEditMode ? 'bg-blue-500' : 'bg-violet-500') 
                  : 'bg-zinc-700'
              }`}
            />
          ))}
        </div>

        {/* User details bar - shown after phone step */}
        {stepIndex > 0 && draft.phone && (
          <div className="bg-zinc-800/50 rounded-lg px-3 py-2 mb-3 text-xs">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-zinc-400">
                📱 <span className="text-white">{formatPhone(draft.phone)}</span>
              </span>
              {draft.sessionType && (
                <span className="text-zinc-400">
                  🎵 <span className="text-white">{getSessionDetails()}</span>
                </span>
              )}
              {draft.date && (
                <span className="text-zinc-400">
                  📅 <span className="text-white">
                    {new Date(draft.date).toLocaleDateString('en-IN', { 
                      weekday: 'short', 
                      day: 'numeric', 
                      month: 'short' 
                    })}
                  </span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <h1 className="text-xl font-bold text-white">{title}</h1>
          {subtitle && <p className="text-sm text-zinc-400 mt-1">{subtitle}</p>}
        </motion.div>
      </header>

      {/* Main content - scrollable when needed */}
      <main className="flex-1 px-4 py-3 overflow-y-auto">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="pb-2"
        >
          {children}
        </motion.div>
      </main>

      {/* Footer with navigation */}
      {!hideFooter && (
        <footer className={`flex-shrink-0 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t ${draft.isEditMode ? 'border-blue-900/50' : 'border-zinc-800'} bg-zinc-900/80 backdrop-blur`}>
          <div className="flex items-center gap-3">
            {showBack && stepIndex > 0 && (
              <button
                onClick={handleBack}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-zinc-800 text-white font-medium hover:bg-zinc-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            )}
            
            {showNext && (
              <button
                onClick={handleNext}
                disabled={!canGoNext || isLoading}
                className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium transition-all ${
                  canGoNext && !isLoading
                    ? (draft.isEditMode 
                        ? 'bg-blue-600 text-white hover:bg-blue-500' 
                        : 'bg-violet-600 text-white hover:bg-violet-500')
                    : 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    {nextLabel}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </footer>
      )}
    </div>
  );
}
