'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { BookingProvider, useBooking } from '@/app/booking/contexts/BookingContext';
import PhoneStep from '@/app/booking/components/PhoneStep';
import SessionStep from '@/app/booking/components/SessionStep';
import ParticipantsStep from '@/app/booking/components/ParticipantsStep';
import StudioStep from '@/app/booking/components/StudioStep';
import TimeStep from '@/app/booking/components/TimeStep';
import ReviewStep from '@/app/booking/components/ReviewStep';
import ConfirmStep from '@/app/booking/components/ConfirmStep';

function BookingSteps() {
  const { currentStep, skipOtp, setStep } = useBooking();

  // For admin/staff, skip OTP step - go directly from review to confirm
  const effectiveStep = currentStep === 'otp' && skipOtp ? 'confirm' : currentStep;

  // If we're on OTP step but should skip, move to confirm
  if (currentStep === 'otp' && skipOtp) {
    setStep('confirm');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-zinc-900 via-zinc-900 to-black">
        <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
      </div>
    );
  }

  switch (effectiveStep) {
    case 'phone':
      return <PhoneStep />;
    case 'session':
      return <SessionStep />;
    case 'participants':
      return <ParticipantsStep />;
    case 'studio':
      return <StudioStep />;
    case 'time':
      return <TimeStep />;
    case 'review':
      return <ReviewStep />;
    case 'confirm':
      return <ConfirmStep />;
    default:
      return <PhoneStep />;
  }
}

function BookingPageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-zinc-900 via-zinc-900 to-black">
      <div className="flex items-center gap-3">
        <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
        <span className="text-zinc-400">Loading...</span>
      </div>
    </div>
  );
}

export default function StaffNewBookingPage() {
  return (
    <Suspense fallback={<BookingPageLoading />}>
      <BookingProvider mode="staff">
        <BookingSteps />
      </BookingProvider>
    </Suspense>
  );
}
