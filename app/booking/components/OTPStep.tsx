'use client';

import { useCallback, useEffect } from 'react';
import { useBooking } from '../contexts/BookingContext';
import StepLayout from './StepLayout';
import OTPVerification, { OTPVerifiedInfo } from '@/app/components/OTPVerification';

export default function OTPStep() {
  const { draft, updateDraft, nextStep, prevStep } = useBooking();

  // Already verified earlier (trusted device / edit flow) - nothing to do here
  useEffect(() => {
    if (draft.otpVerified) nextStep();
  }, [draft.otpVerified, nextStep]);

  const handleVerified = useCallback(
    ({ deviceTrusted, fingerprint }: OTPVerifiedInfo) => {
      updateDraft({ otpVerified: true, deviceTrusted, deviceFingerprint: fingerprint });
      nextStep();
    },
    [updateDraft, nextStep],
  );

  if (draft.otpVerified) return null;

  return (
    <StepLayout
      title={draft.isEditMode ? 'Verify to update booking' : 'Verify to complete booking'}
      subtitle="Enter the 6-digit code we emailed you"
      onBack={prevStep}
    >
      <OTPVerification
        phone={draft.phone}
        email={draft.email}
        onVerified={handleVerified}
        actionLabel={draft.isEditMode ? 'update booking' : 'complete booking'}
      />
    </StepLayout>
  );
}
