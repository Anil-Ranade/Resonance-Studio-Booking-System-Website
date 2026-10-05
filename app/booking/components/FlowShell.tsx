"use client";

// Full-screen frame shared by the new / edit / cancel booking flows:
// brand header, step title, scrollable body, progress bar and footer actions.

import { ReactNode } from "react";
import { ArrowLeft, ArrowRight, Music2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";

interface FlowShellProps {
  title: ReactNode;
  subtitle?: string;
  /** Shown under the brand, e.g. an edit-mode badge. */
  badge?: ReactNode;
  step: number;
  totalSteps: number;
  onExit?: () => void;
  footer?: ReactNode;
  /** Changing this remounts the body (resets scroll between steps). */
  contentKey?: string;
  children: ReactNode;
}

export function FlowShell({
  title,
  subtitle,
  badge,
  step,
  totalSteps,
  onExit,
  footer,
  contentKey,
  children,
}: FlowShellProps) {
  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-background">
      <header className="flex-shrink-0 px-4 pt-3 pb-2 relative">
        {onExit && (
          <Button
            variant="secondary"
            size="icon-sm"
            onClick={onExit}
            aria-label="Exit"
            className="absolute right-4 top-3 rounded-full"
          >
            <X />
          </Button>
        )}

        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
            <Music2 className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold leading-none text-foreground">Resonance Studio</span>
            <span className="text-xs text-muted-foreground font-medium tracking-wide">
              Sinhgad Road Branch
            </span>
          </div>
        </div>

        {badge && <div className="flex justify-center mb-2">{badge}</div>}

        <h1 className="text-lg font-bold text-foreground leading-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5 leading-snug">{subtitle}</p>}
      </header>

      <main className="flex-1 px-4 py-2 overflow-y-auto no-scrollbar">
        <div key={contentKey} className="pb-2 max-w-xl mx-auto">
          {children}
        </div>
      </main>

      <footer className="flex-shrink-0 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-border bg-background/90 backdrop-blur">
        <div className="max-w-xl mx-auto">
          <Progress value={(Math.min(step, totalSteps) / totalSteps) * 100} className="h-1.5 mb-1.5" />
          <p className="text-center text-[11px] text-muted-foreground mb-2">
            Step {Math.min(step, totalSteps)} of {totalSteps}
          </p>
          {footer}
        </div>
      </footer>
    </div>
  );
}

interface FlowNavProps {
  onBack?: () => void;
  backLabel?: string;
  onNext?: () => void;
  nextLabel?: ReactNode;
  nextDisabled?: boolean;
  loading?: boolean;
  /** Submit a <form id=...> elsewhere on the page instead of calling onNext. */
  nextForm?: string;
  destructive?: boolean;
}

/** Back / primary action row used in every flow footer. */
export function FlowNav({
  onBack,
  backLabel = "Back",
  onNext,
  nextLabel = "Next",
  nextDisabled,
  loading,
  nextForm,
  destructive,
}: FlowNavProps) {
  const hasNext = onNext || nextForm;
  return (
    <div className="flex items-center gap-3">
      {onBack && (
        <Button
          variant="secondary"
          onClick={onBack}
          className={hasNext ? "flex-[0.4] h-11" : "flex-1 h-11"}
        >
          <ArrowLeft /> {backLabel}
        </Button>
      )}
      {hasNext && (
        <Button
          type={nextForm ? "submit" : "button"}
          form={nextForm}
          onClick={onNext}
          disabled={nextDisabled || loading}
          className={`flex-1 h-11 font-semibold ${
            destructive ? "bg-destructive text-white hover:bg-destructive/90" : ""
          }`}
        >
          {loading ? (
            <Spinner />
          ) : (
            <>
              {nextLabel} {!destructive && <ArrowRight />}
            </>
          )}
        </Button>
      )}
    </div>
  );
}
