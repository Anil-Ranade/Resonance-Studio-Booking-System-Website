'use client';

import { useEffect } from 'react';

const CACHE_KEYS = [
  'resonance_booking_draft',
  'resonance_phone_verified',
  'resonance_otp_verified',
  'resonance_device_fingerprint',
  'resonance_user_data',
];

const SESSION_KEYS = [
  'editBookingData',
  'bookingConfirmation',
  'phoneVerified',
  'otpVerified',
];

export default function ClearCache() {
  useEffect(() => {
    // Only run on initial app load (first visit or browser refresh)
    const isInitialLoad = !sessionStorage.getItem('app_session_active');
    
    if (isInitialLoad) {
      // Clear localStorage cache keys
      CACHE_KEYS.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.warn(`Failed to remove localStorage key: ${key}`, e);
        }
      });

      // Clear sessionStorage cache keys
      SESSION_KEYS.forEach(key => {
        try {
          sessionStorage.removeItem(key);
        } catch (e) {
          console.warn(`Failed to remove sessionStorage key: ${key}`, e);
        }
      });

      // Clear any form data that might be cached
      try {
        // Clear all keys that start with 'resonance_'
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('resonance_')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      } catch (e) {
        console.warn('Failed to clear prefixed localStorage keys', e);
      }

      // Mark session as active to prevent clearing on navigation
      sessionStorage.setItem('app_session_active', 'true');
    }
  }, []);

  return null;
}
