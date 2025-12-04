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
  showNext = false,
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

  return (
    <div className={`h-[100dvh] flex flex-col overflow-hidden ${draft.isEditMode ? 'bg-gradient-to-b from-blue-950 via-zinc-900 to-black' : 'bg-gradient-to-b from-zinc-900 via-zinc-900 to-black'}`}>
      {/* Header */}
      <header className="flex-shrink-0 px-4 pt-4 pb-2">
        {/* Main Headers - shown on ALL pages */}
        <div className="text-center mb-3">
          <h1 className={`text-lg font-bold ${draft.isEditMode ? 'text-blue-400' : 'text-violet-400'}`}>
            Resonance – Sinhgad Road
          </h1>
          <h2 className="text-sm text-zinc-400">Online Booking System</h2>
        </div>
        
        {/* Edit Mode Banner */}
        {draft.isEditMode && (
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg px-3 py-2 mb-3 flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-blue-400" />
            <span className="text-blue-300 text-sm font-medium">Modifying Existing Booking</span>
          </div>
        )}

        {/* Welcome message - shown when user name is known (after phone step) */}
        {draft.name && (
          <h3 className={`text-base font-medium text-center mb-3 ${draft.isEditMode ? 'text-blue-300' : 'text-violet-300'}`}>
            Welcome, {draft.name}!
          </h3>
        )}

        {/* Step Title */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <h4 className="text-xl font-bold text-white">{title}</h4>
          {subtitle && <p className="text-sm text-zinc-400 mt-1">{subtitle}</p>}
        </motion.div>
      </header>

      {/* Main content - fixed height */}
      <main className="flex-1 px-4 py-2 overflow-hidden">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="h-full"
        >
          {children}
        </motion.div>
      </main>

      {/* Footer with navigation and progress bar */}
      {!hideFooter && (
        <footer className={`flex-shrink-0 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t ${draft.isEditMode ? 'border-blue-900/50' : 'border-zinc-800'} bg-zinc-900/80 backdrop-blur`}>
          {/* Progress bar at bottom of footer */}
          <div className="flex items-center gap-1 mb-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((step) => (
              <div
                key={step}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  step <= stepIndex + 1 
                    ? (draft.isEditMode ? 'bg-blue-500' : 'bg-violet-500') 
                    : 'bg-zinc-700'
                }`}
              />
            ))}
          </div>
          <p className="text-center text-xs text-zinc-500 mb-3">
            Step {stepIndex + 1} of 9
          </p>
          
          <div className="flex items-center gap-3">
            {showBack && stepIndex > 0 && (
              <button
                onClick={handleBack}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-zinc-800 text-white font-medium hover:bg-zinc-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            )}
            {showNext && (
              <button
                onClick={handleNext}
                disabled={!canGoNext || isLoading}
                className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium transition-colors ${
                  canGoNext && !isLoading
                    ? (draft.isEditMode 
                        ? 'bg-blue-600 text-white hover:bg-blue-500' 
                        : 'bg-violet-600 text-white hover:bg-violet-500')
                    : 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
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
      
      {/* Progress bar shown even when footer is hidden */}
      {hideFooter && (
        <footer className={`flex-shrink-0 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t ${draft.isEditMode ? 'border-blue-900/50' : 'border-zinc-800'} bg-zinc-900/80 backdrop-blur`}>
          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((step) => (
              <div
                key={step}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  step <= stepIndex + 1 
                    ? (draft.isEditMode ? 'bg-blue-500' : 'bg-violet-500') 
                    : 'bg-zinc-700'
                }`}
              />
            ))}
          </div>
          <p className="text-center text-xs text-zinc-500">
            Step {stepIndex + 1} of 9
          </p>
        </footer>
      )}
    </div>
  );
}
