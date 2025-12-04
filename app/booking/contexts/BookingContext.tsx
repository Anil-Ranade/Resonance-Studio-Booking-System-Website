'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getStudioSuggestion as getStudioSuggestionUtil } from '../utils/studioSuggestion';

// Types
export type SessionType = 'Karaoke' | 'Live with musicians' | 'Only Drum Practice' | 'Band' | 'Recording';
export type KaraokeOption = '1_5' | '6_10' | '11_20' | '21_30';
export type LiveMusicianOption = '1_2' | '3_4' | '5' | '6_8' | '9_12';
export type BandEquipment = 'drum' | 'amps' | 'guitars' | 'keyboard';
export type RecordingOption = 'audio_recording' | 'video_recording' | 'chroma_key';
export type StudioName = 'Studio A' | 'Studio B' | 'Studio C';

export interface TimeSlot {
  start: string;
  end: string;
}

export interface EditBookingData {
  originalBookingId: string;
  sessionType: string;
  sessionDetails: string;
  studio: string;
  date: string;
  start_time: string;
  end_time: string;
  phone_number: string;
  name: string;
  total_amount: number;
  group_size?: number;
}

// Store original booking choices for edit mode
export interface OriginalBookingChoices {
  sessionType: SessionType | '';
  sessionDetails: string;
  studio: StudioName | '';
  date: string;
  start_time: string;
  end_time: string;
  group_size: number;
}

export interface BookingDraft {
  // Step 1: Phone
  phone: string;
  name: string;
  email: string;
  isExistingUser: boolean;
  
  // Step 2: Session
  sessionType: SessionType | '';
  
  // Step 3: Participants
  karaokeOption: KaraokeOption | '';
  liveOption: LiveMusicianOption | '';
  bandEquipment: BandEquipment[];
  recordingOption: RecordingOption | '';
  participantCount: number;
  
  // Step 4: Studio
  studio: StudioName | '';
  recommendedStudio: StudioName | '';
  allowedStudios: StudioName[];
  ratePerHour: number;
  
  // Step 5: Time
  date: string;
  selectedSlot: TimeSlot | null;
  duration: number;
  
  // Device
  deviceFingerprint: string;
  deviceTrusted: boolean;
  
  // OTP verified
  otpVerified: boolean;
  
  // Edit mode
  isEditMode: boolean;
  originalBookingId: string;
  originalChoices: OriginalBookingChoices | null;
}

export type BookingStep = 'phone' | 'session' | 'participants' | 'studio' | 'availability' | 'time' | 'review' | 'otp' | 'confirm';

const STEP_ORDER: BookingStep[] = ['phone', 'session', 'participants', 'studio', 'availability', 'time', 'review', 'otp', 'confirm'];

const initialDraft: BookingDraft = {
  phone: '',
  name: '',
  email: '',
  isExistingUser: false,
  sessionType: '',
  karaokeOption: '',
  liveOption: '',
  bandEquipment: [],
  recordingOption: '',
  participantCount: 1,
  studio: '',
  recommendedStudio: '',
  allowedStudios: [],
  ratePerHour: 0,
  date: '',
  selectedSlot: null,
  duration: 1,
  deviceFingerprint: '',
  deviceTrusted: false,
  otpVerified: false,
  isEditMode: false,
  originalBookingId: '',
  originalChoices: null,
};

const STORAGE_KEY = 'resonance_booking_draft';

interface BookingContextType {
  draft: BookingDraft;
  currentStep: BookingStep;
  stepIndex: number;
  updateDraft: (updates: Partial<BookingDraft>) => void;
  setStep: (step: BookingStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  resetDraft: () => void;
  canProceed: (step: BookingStep) => boolean;
  getStepNumber: (step: BookingStep) => number;
  totalSteps: number;
  loadEditData: () => void;
  hasChangesFromOriginal: () => boolean;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<BookingDraft>(initialDraft);
  const [currentStep, setCurrentStep] = useState<BookingStep>('phone');
  const [isLoaded, setIsLoaded] = useState(false);

  // Helper function to parse session details and extract participant options
  const parseSessionDetails = (sessionType: string, sessionDetails: string, groupSize: number) => {
    let karaokeOption: KaraokeOption | '' = '';
    let liveOption: LiveMusicianOption | '' = '';
    let bandEquipment: BandEquipment[] = [];
    let recordingOption: RecordingOption | '' = '';

    // Parse based on session type
    if (sessionType === 'Karaoke') {
      // Match against known karaoke labels
      if (groupSize <= 5) karaokeOption = '1_5';
      else if (groupSize <= 10) karaokeOption = '6_10';
      else if (groupSize <= 20) karaokeOption = '11_20';
      else karaokeOption = '21_30';
    } else if (sessionType === 'Live with musicians') {
      if (groupSize <= 2) liveOption = '1_2';
      else if (groupSize <= 4) liveOption = '3_4';
      else if (groupSize === 5) liveOption = '5';
      else if (groupSize <= 8) liveOption = '6_8';
      else liveOption = '9_12';
    } else if (sessionType === 'Band') {
      // Parse equipment from session details
      const detailsLower = sessionDetails.toLowerCase();
      if (detailsLower.includes('drum')) bandEquipment.push('drum');
      if (detailsLower.includes('amp')) bandEquipment.push('amps');
      if (detailsLower.includes('guitar')) bandEquipment.push('guitars');
      if (detailsLower.includes('keyboard')) bandEquipment.push('keyboard');
      // If nothing parsed, default to drum
      if (bandEquipment.length === 0) bandEquipment.push('drum');
    } else if (sessionType === 'Recording') {
      const detailsLower = sessionDetails.toLowerCase();
      if (detailsLower.includes('audio')) recordingOption = 'audio_recording';
      else if (detailsLower.includes('video') && !detailsLower.includes('chroma')) recordingOption = 'video_recording';
      else if (detailsLower.includes('chroma') || detailsLower.includes('green')) recordingOption = 'chroma_key';
    }

    return { karaokeOption, liveOption, bandEquipment, recordingOption };
  };

  // Calculate duration from start and end time
  const calculateDuration = (startTime: string, endTime: string): number => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    return Math.round((endMinutes - startMinutes) / 60);
  };

  // Load edit mode data from sessionStorage
  const loadEditData = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        const editData = sessionStorage.getItem('editBookingData');
        if (editData) {
          const parsed = JSON.parse(editData);
          if (parsed.editMode) {
            const { karaokeOption, liveOption, bandEquipment, recordingOption } = 
              parseSessionDetails(parsed.sessionType, parsed.sessionDetails || '', parsed.group_size || 1);
            
            const duration = calculateDuration(parsed.start_time, parsed.end_time);
            
            // Create original choices for display
            const originalChoices: OriginalBookingChoices = {
              sessionType: parsed.sessionType as SessionType || '',
              sessionDetails: parsed.sessionDetails || '',
              studio: parsed.studio as StudioName || '',
              date: parsed.date || '',
              start_time: parsed.start_time || '',
              end_time: parsed.end_time || '',
              group_size: parsed.group_size || 1,
            };

            // Calculate allowed studios based on session type and options
            const studioSuggestion = getStudioSuggestionUtil(
              parsed.sessionType as SessionType,
              {
                karaokeOption: karaokeOption as any,
                liveOption: liveOption as any,
                bandEquipment,
                recordingOption,
              }
            );

            // Pre-fill the draft with edit data
            setDraft(prev => ({
              ...prev,
              phone: parsed.phone_number || '',
              name: parsed.name || '',
              sessionType: parsed.sessionType as SessionType || '',
              karaokeOption,
              liveOption,
              bandEquipment,
              recordingOption,
              participantCount: parsed.group_size || 1,
              studio: parsed.studio as StudioName || '',
              recommendedStudio: studioSuggestion.recommendedStudio,
              allowedStudios: studioSuggestion.allowedStudios,
              ratePerHour: parsed.total_amount ? parsed.total_amount / duration : 0,
              date: parsed.date || '',
              selectedSlot: {
                start: parsed.start_time || '',
                end: parsed.end_time || '',
              },
              duration,
              isEditMode: true,
              originalBookingId: parsed.originalBookingId || '',
              originalChoices,
            }));
            // Clear the edit data from sessionStorage after loading
            sessionStorage.removeItem('editBookingData');
          }
        }
      } catch (e) {
        console.error('Failed to load edit booking data:', e);
      }
    }
  }, []);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // First check for edit mode
        const editData = sessionStorage.getItem('editBookingData');
        if (editData) {
          const parsed = JSON.parse(editData);
          if (parsed.editMode) {
            const { karaokeOption, liveOption, bandEquipment, recordingOption } = 
              parseSessionDetails(parsed.sessionType, parsed.sessionDetails || '', parsed.group_size || 1);
            
            const duration = calculateDuration(parsed.start_time, parsed.end_time);
            
            // Create original choices for display
            const originalChoices: OriginalBookingChoices = {
              sessionType: parsed.sessionType as SessionType || '',
              sessionDetails: parsed.sessionDetails || '',
              studio: parsed.studio as StudioName || '',
              date: parsed.date || '',
              start_time: parsed.start_time || '',
              end_time: parsed.end_time || '',
              group_size: parsed.group_size || 1,
            };

            // Calculate allowed studios based on session type and options
            const studioSuggestion = getStudioSuggestionUtil(
              parsed.sessionType as SessionType,
              {
                karaokeOption: karaokeOption as any,
                liveOption: liveOption as any,
                bandEquipment,
                recordingOption,
              }
            );

            // Pre-fill the draft with edit data
            setDraft({
              ...initialDraft,
              phone: parsed.phone_number || '',
              name: parsed.name || '',
              sessionType: parsed.sessionType as SessionType || '',
              karaokeOption,
              liveOption,
              bandEquipment,
              recordingOption,
              participantCount: parsed.group_size || 1,
              studio: parsed.studio as StudioName || '',
              recommendedStudio: studioSuggestion.recommendedStudio,
              allowedStudios: studioSuggestion.allowedStudios,
              ratePerHour: parsed.total_amount ? parsed.total_amount / duration : 0,
              date: parsed.date || '',
              selectedSlot: {
                start: parsed.start_time || '',
                end: parsed.end_time || '',
              },
              duration,
              isEditMode: true,
              originalBookingId: parsed.originalBookingId || '',
              originalChoices,
            });
            // Clear the edit data from sessionStorage after loading
            sessionStorage.removeItem('editBookingData');
            setIsLoaded(true);
            return;
          }
        }
        
        // Otherwise load from localStorage
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setDraft(prev => ({ ...prev, ...parsed.draft }));
          // Don't restore step - always start at phone for security
        }
      } catch (e) {
        console.error('Failed to load booking draft:', e);
      }
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage on draft change
  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ draft }));
      } catch (e) {
        console.error('Failed to save booking draft:', e);
      }
    }
  }, [draft, isLoaded]);

  const updateDraft = useCallback((updates: Partial<BookingDraft>) => {
    setDraft(prev => ({ ...prev, ...updates }));
  }, []);

  const setStep = useCallback((step: BookingStep) => {
    setCurrentStep(step);
  }, []);

  const stepIndex = STEP_ORDER.indexOf(currentStep);

  const nextStep = useCallback(() => {
    const nextIndex = stepIndex + 1;
    if (nextIndex < STEP_ORDER.length) {
      setCurrentStep(STEP_ORDER[nextIndex]);
    }
  }, [stepIndex]);

  const prevStep = useCallback(() => {
    const prevIndex = stepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEP_ORDER[prevIndex]);
    }
  }, [stepIndex]);

  const resetDraft = useCallback(() => {
    setDraft(initialDraft);
    setCurrentStep('phone');
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const canProceed = useCallback((step: BookingStep): boolean => {
    switch (step) {
      case 'phone':
        return draft.phone.replace(/\D/g, '').length === 10;
      case 'session':
        return draft.sessionType !== '';
      case 'participants':
        if (draft.sessionType === 'Karaoke') return draft.karaokeOption !== '';
        if (draft.sessionType === 'Live with musicians') return draft.liveOption !== '';
        if (draft.sessionType === 'Only Drum Practice') return true;
        if (draft.sessionType === 'Band') return draft.bandEquipment.length > 0;
        if (draft.sessionType === 'Recording') return draft.recordingOption !== '';
        return false;
      case 'studio':
        return draft.studio !== '' && draft.allowedStudios.includes(draft.studio);
      case 'availability':
        return true; // Availability step is informational, always allow proceeding
      case 'time':
        return draft.date !== '' && draft.selectedSlot !== null;
      case 'review':
        return true;
      case 'otp':
        return draft.otpVerified; // OTP is always required
      case 'confirm':
        return true;
      default:
        return false;
    }
  }, [draft]);

  const getStepNumber = useCallback((step: BookingStep): number => {
    return STEP_ORDER.indexOf(step) + 1;
  }, []);

  // Check if there are any changes from the original booking
  const hasChangesFromOriginal = useCallback((): boolean => {
    if (!draft.isEditMode || !draft.originalChoices) {
      return true; // Not in edit mode, always allow
    }

    const original = draft.originalChoices;

    // Compare session type
    if (draft.sessionType !== original.sessionType) return true;

    // Compare studio
    if (draft.studio !== original.studio) return true;

    // Compare date
    if (draft.date !== original.date) return true;

    // Compare time slot
    if (draft.selectedSlot?.start !== original.start_time) return true;
    if (draft.selectedSlot?.end !== original.end_time) return true;

    // Compare participant options based on session type
    if (draft.sessionType === 'Karaoke') {
      // Compare karaoke option by checking if group size category changed
      const originalKaraokeOption = (() => {
        const size = original.group_size || 1;
        if (size <= 5) return '1_5';
        if (size <= 10) return '6_10';
        if (size <= 20) return '11_20';
        return '21_30';
      })();
      if (draft.karaokeOption !== originalKaraokeOption) return true;
    }

    if (draft.sessionType === 'Live with musicians') {
      // Compare live option by checking if group size category changed
      const originalLiveOption = (() => {
        const size = original.group_size || 1;
        if (size <= 2) return '1_2';
        if (size <= 4) return '3_4';
        if (size === 5) return '5';
        if (size <= 8) return '6_8';
        return '9_12';
      })();
      if (draft.liveOption !== originalLiveOption) return true;
    }

    // No changes detected
    return false;
  }, [draft]);

  if (!isLoaded) {
    return null; // Or loading spinner
  }

  return (
    <BookingContext.Provider
      value={{
        draft,
        currentStep,
        stepIndex,
        updateDraft,
        setStep,
        nextStep,
        prevStep,
        resetDraft,
        canProceed,
        getStepNumber,
        totalSteps: STEP_ORDER.length,
        loadEditData,
        hasChangesFromOriginal,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
}
