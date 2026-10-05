"use client";

import { ReactNode } from "react";
import { Edit3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useBooking } from "../contexts/BookingContext";
import { FlowNav, FlowShell } from "./FlowShell";

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
  /** Replaces the Back/Next buttons (e.g. the final confirmation actions). */
  footer?: ReactNode;
  /** Progress override; defaults to the current step. */
  progressStep?: number;
}

/** FlowShell wired to the booking context (new booking + edit mode). */
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
  footer,
  progressStep,
}: StepLayoutProps) {
  const { draft, stepIndex, prevStep, nextStep, canProceed, currentStep, totalSteps } =
    useBooking();

  const showBackButton = showBack && (stepIndex > 0 || onBack);

  return (
    <FlowShell
      title={title}
      subtitle={subtitle}
      onExit={onExit}
      step={progressStep ?? stepIndex + 1}
      totalSteps={totalSteps}
      contentKey={currentStep}
      badge={
        draft.isEditMode && (
          <Badge variant="outline" className="border-primary/40 text-primary">
            <Edit3 /> Modifying existing booking
          </Badge>
        )
      }
      footer={
        footer ??
        (!hideFooter && (
          <FlowNav
            onBack={showBackButton ? onBack ?? prevStep : undefined}
            onNext={showNext ? onNext ?? nextStep : undefined}
            nextLabel={nextLabel}
            nextDisabled={isNextDisabled || !canProceed(currentStep)}
            loading={isLoading}
          />
        ))
      }
    >
      {children}
    </FlowShell>
  );
}
