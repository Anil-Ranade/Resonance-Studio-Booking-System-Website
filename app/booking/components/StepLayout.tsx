"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2, Edit3, X } from "lucide-react";
import { useBooking } from "../contexts/BookingContext";

interface StepLayoutProps {
  title: ReactNode;
  subtitle?: string;
  children: ReactNode;
  showBack?: boolean;
  showNext?: boolean;
  nextLabel?: string;
  onNext?: () => void;
  onBack?: () => void;
  onExit?: () => void;
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
  nextLabel = "Next",
  onNext,
  onBack,
  onExit,
  isNextDisabled = false,
  isLoading = false,
  hideFooter = false,
}: StepLayoutProps) {
  const {
    draft,
    stepIndex,
    prevStep,
    nextStep,
    canProceed,
    currentStep,
    totalSteps,
  } = useBooking();

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
    <div
      className={`h-[100dvh] flex flex-col overflow-hidden ${
        draft.isEditMode
          ? "bg-gradient-to-b from-blue-950 via-zinc-900 to-black"
          : "bg-gradient-to-b from-zinc-900 via-zinc-900 to-black"
      }`}
    >
      {/* Header */}
      <header className="flex-shrink-0 px-4 pt-2 pb-1 relative">
        {onExit && (
          <button
            onClick={onExit}
            className="absolute right-4 top-3 p-1.5 bg-zinc-800 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors z-20"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Main Headers - shown on ALL pages */}
        <div className="text-center mb-1">
          <h1
            className={`text-xl font-bold ${
              draft.isEditMode ? "text-blue-400" : "text-violet-400"
            }`}
          >
            Resonance – Sinhgad Road
          </h1>
          <h2 className="text-sm text-zinc-400 uppercase tracking-wider">Online Booking System</h2>
        </div>

        {/* Edit Mode Banner */}
        {draft.isEditMode && (
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg px-2 py-1 mb-2 flex items-center gap-2 justify-center">
            <Edit3 className="w-3 h-3 text-blue-400" />
            <span className="text-blue-300 text-xs font-medium">
              Modifying Existing Booking
            </span>
          </div>
        )}



        {/* Step Title */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="mb-1"
        >
          <h4 className="text-2xl font-bold text-white leading-tight">{title}</h4>
          {subtitle && <p className="text-sm text-zinc-400 mt-1 leading-tight">{subtitle}</p>}
        </motion.div>
      </header>

      {/* Main content - scrollable */}
      <main className="flex-1 px-4 py-1 overflow-y-auto no-scrollbar">
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

      {/* Footer with navigation and progress bar */}
      {!hideFooter && (
        <footer
          className={`flex-shrink-0 px-4 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] border-t ${
            draft.isEditMode ? "border-blue-900/50" : "border-zinc-800"
          } bg-zinc-900/90 backdrop-blur`}
        >
          {/* Progress bar at bottom of footer */}
          <div className="flex items-center gap-1 mb-2">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
              <div
                key={step}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  step <= stepIndex + 1
                    ? draft.isEditMode
                      ? "bg-blue-500"
                      : "bg-violet-500"
                    : "bg-zinc-700"
                }`}
              />
            ))}
          </div>
          
          <div className="flex items-center gap-3">
            {showBack && (stepIndex > 0 || onBack) && (
              <button
                onClick={handleBack}
                className="flex-[0.4] flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-zinc-800 text-white text-base font-medium hover:bg-zinc-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>
            )}
            {showNext && (
              <button
                onClick={handleNext}
                disabled={!canGoNext || isLoading}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-base font-bold transition-colors ${
                  canGoNext && !isLoading
                    ? draft.isEditMode
                      ? "bg-blue-600 text-white hover:bg-blue-500"
                      : "bg-violet-600 text-white hover:bg-violet-500"
                    : "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                }`}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {nextLabel}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            )}
          </div>
        </footer>
      )}

      {/* Progress bar shown even when footer is hidden */}
      {hideFooter && (
        <footer
          className={`flex-shrink-0 px-4 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] border-t ${
            draft.isEditMode ? "border-blue-900/50" : "border-zinc-800"
          } bg-zinc-900/90 backdrop-blur`}
        >
          <div className="flex items-center gap-1 mb-1">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
              <div
                key={step}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  step <= stepIndex + 1
                    ? draft.isEditMode
                      ? "bg-blue-500"
                      : "bg-violet-500"
                    : "bg-zinc-700"
                }`}
              />
            ))}
          </div>
          <p className="text-center text-[10px] text-zinc-500">
            Step {stepIndex + 1} of {totalSteps}
          </p>
        </footer>
      )}
    </div>
  );
}
