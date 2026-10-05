'use client';

import { Suspense } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { BookingProvider, useBooking } from '../contexts/BookingContext';
import PhoneStep from '../components/PhoneStep';
import SessionStep from '../components/SessionStep';
import ParticipantsStep from '../components/ParticipantsStep';
import StudioStep from '../components/StudioStep';
import TimeStep from '../components/TimeStep';
import ReviewStep from '../components/ReviewStep';
import OTPStep from '../components/OTPStep';
import ConfirmStep from '../components/ConfirmStep';

function BookingSteps() {
  const { currentStep } = useBooking();

  switch (currentStep) {
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
    case 'otp':
      return <OTPStep />;
    case 'confirm':
      return <ConfirmStep />;
    default:
      return <PhoneStep />;
  }
}

function BookingPageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex items-center gap-3">
        <Spinner className="size-6 text-primary" />
        <span className="text-muted-foreground">Loading...</span>
      </div>
    </div>
  );
}

export default function NewBookingPage() {
  return (
    <Suspense fallback={<BookingPageLoading />}>
      <BookingProvider>
        <BookingSteps />
      </BookingProvider>
    </Suspense>
  );
}
