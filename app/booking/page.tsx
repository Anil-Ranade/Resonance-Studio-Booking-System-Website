'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

// Helper function to safely parse JSON responses
async function safeJsonParse(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    console.error('Failed to parse response as JSON:', text.substring(0, 200));
    throw new Error('Server returned an invalid response. Please try again.');
  }
}
import { 
  ArrowLeft, 
  Mic, 
  Users, 
  Calendar, 
  Clock, 
  ChevronRight,
  ChevronLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Music,
  Drum,
  Guitar,
  Radio,
  Check,
  X
} from 'lucide-react';

// Types
type SessionType = 'Karaoke' | 'Live with musicians' | 'Only Drum Practice' | 'Band' | 'Recording';
type KaraokeOption = 'upto_5' | 'upto_8' | '10' | '20' | '21_30';
type LiveMusicianOption = 'upto_2' | 'upto_4' | '5' | 'upto_8' | '9_12';
type BandEquipment = 'drum' | 'amps' | 'guitars' | 'keyboard';
type RecordingOption = 'audio_recording' | 'video_recording' | 'chroma_key' | 'sd_card_recording';
type StudioName = 'Studio A' | 'Studio B' | 'Studio C';

interface TimeSlot {
  start: string;
  end: string;
}

interface RatesResponse {
  suggested_studio: StudioName;
  suggested_rate: number;
  allowed_studios: StudioName[];
  explanation: string;
  rate_breakdown?: Record<string, number>;
}

interface BookingSettings {
  minBookingDuration: number;
  maxBookingDuration: number;
  bookingBuffer: number;
  advanceBookingDays: number;
  defaultOpenTime: string;
  defaultCloseTime: string;
}

// Session type options
const SESSION_TYPES: { name: SessionType; icon: React.ReactNode; description: string }[] = [
  { name: 'Karaoke', icon: <Mic className="w-5 h-5" />, description: 'Sing along with friends' },
  { name: 'Live with musicians', icon: <Music className="w-5 h-5" />, description: 'Live performance session' },
  { name: 'Only Drum Practice', icon: <Drum className="w-5 h-5" />, description: 'Drum practice only' },
  { name: 'Band', icon: <Guitar className="w-5 h-5" />, description: 'Full band rehearsal' },
  { name: 'Recording', icon: <Radio className="w-5 h-5" />, description: 'Special recording packages' },
];

// Karaoke participant options
const KARAOKE_OPTIONS: { value: KaraokeOption; label: string }[] = [
  { value: 'upto_5', label: 'Group of up to 5 participants' },
  { value: 'upto_8', label: 'Group of up to 8 participants' },
  { value: '10', label: '10 participants' },
  { value: '20', label: '20 participants' },
  { value: '21_30', label: '21-30 participants' },
];

// Live musician options
const LIVE_OPTIONS: { value: LiveMusicianOption; label: string }[] = [
  { value: 'upto_2', label: 'Up to 2 musicians' },
  { value: 'upto_4', label: 'Up to 4 musicians' },
  { value: '5', label: '5 musicians' },
  { value: 'upto_8', label: 'Up to 8 musicians' },
  { value: '9_12', label: '9-12 musicians' },
];

// Band equipment options
const BAND_EQUIPMENT: { value: BandEquipment; label: string; icon: React.ReactNode }[] = [
  { value: 'drum', label: 'Drum', icon: <Drum className="w-4 h-4" /> },
  { value: 'amps', label: 'Amps', icon: <Radio className="w-4 h-4" /> },
  { value: 'guitars', label: 'Guitars', icon: <Guitar className="w-4 h-4" /> },
  { value: 'keyboard', label: 'Keyboard', icon: <Music className="w-4 h-4" /> },
];

// Recording options
const RECORDING_OPTIONS: { value: RecordingOption; label: string; price: string }[] = [
  { value: 'audio_recording', label: 'Audio Recording', price: '₹700/song' },
  { value: 'video_recording', label: 'Video Recording (4K)', price: '₹800/song' },
  { value: 'chroma_key', label: 'Chroma Key (Green Screen)', price: '₹1,200/song' },
  { value: 'sd_card_recording', label: 'SD Card Recording', price: '₹100/hour' },
];

// Studio info
const STUDIOS: { name: StudioName; description: string; features: string[] }[] = [
  { 
    name: 'Studio A', 
    description: 'Our largest studio for big groups', 
    features: ['Capacity: 30 people', 'Full band setup', 'Recording equipment']
  },
  { 
    name: 'Studio B', 
    description: 'Medium-sized versatile space', 
    features: ['Capacity: 12 people', 'Band rehearsal ready', 'Karaoke setup']
  },
  { 
    name: 'Studio C', 
    description: 'Cozy space for small groups', 
    features: ['Capacity: 5 people', 'Perfect for duets', 'Intimate setting']
  },
];

// Step definitions
const STEPS = [
  { number: 1, label: 'Session Type', icon: <Mic className="w-4 h-4" /> },
  { number: 2, label: 'Details', icon: <Users className="w-4 h-4" /> },
  { number: 3, label: 'Studio', icon: <Music className="w-4 h-4" /> },
  { number: 4, label: 'Date & Time', icon: <Calendar className="w-4 h-4" /> },
  { number: 5, label: 'Review', icon: <CheckCircle2 className="w-4 h-4" /> },
];

function BookingPageLoading() {
  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="h-6 w-32 bg-white/10 rounded animate-pulse mb-6" />
          <div className="h-10 w-64 bg-white/10 rounded animate-pulse mb-2" />
          <div className="h-5 w-80 bg-white/10 rounded animate-pulse" />
        </div>
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
            <span className="text-zinc-400">Loading booking page...</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<BookingPageLoading />}>
      <BookingPageContent />
    </Suspense>
  );
}

function BookingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Current step (1-5)
  const [currentStep, setCurrentStep] = useState(1);

  // Edit mode state for changing existing booking
  const [isEditMode, setIsEditMode] = useState(false);
  const [originalBookingId, setOriginalBookingId] = useState<string | null>(null);
  const [editPhoneNumber, setEditPhoneNumber] = useState<string | null>(null);
  const [editName, setEditName] = useState<string | null>(null);
  const [originalStartTime, setOriginalStartTime] = useState<string | null>(null);
  const [originalEndTime, setOriginalEndTime] = useState<string | null>(null);
  const [originalSessionType, setOriginalSessionType] = useState<string | null>(null);
  const [originalSessionDetails, setOriginalSessionDetails] = useState<string | null>(null);

  // Form state
  const [sessionType, setSessionType] = useState<SessionType | ''>('');
  const [karaokeOption, setKaraokeOption] = useState<KaraokeOption | ''>('');
  const [liveOption, setLiveOption] = useState<LiveMusicianOption | ''>('');
  const [bandEquipment, setBandEquipment] = useState<BandEquipment[]>([]);
  const [recordingOption, setRecordingOption] = useState<RecordingOption | ''>('');
  const [studio, setStudio] = useState<StudioName | ''>('');
  const [date, setDate] = useState<string>('');
  const [numberOfHours, setNumberOfHours] = useState<number>(1);
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>([]);
  const [studioError, setStudioError] = useState<string>('');

  // URL params for pre-filling
  const [prefilledTime, setPrefilledTime] = useState<string | null>(null);

  // Booking settings from admin
  const [bookingSettings, setBookingSettings] = useState<BookingSettings>({
    minBookingDuration: 1,
    maxBookingDuration: 8,
    bookingBuffer: 0,
    advanceBookingDays: 30,
    defaultOpenTime: '08:00',
    defaultCloseTime: '22:00',
  });

  // API response state
  const [ratesData, setRatesData] = useState<RatesResponse | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingRates, setLoadingRates] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [ratesError, setRatesError] = useState<string>('');
  const [slotsError, setSlotsError] = useState<string>('');

  // Calculated combined slot from selected slots
  const selectedSlot = selectedSlots.length > 0 ? {
    start: selectedSlots[0].start,
    end: selectedSlots[selectedSlots.length - 1].end
  } : null;

  // Fetch booking settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await safeJsonParse(response);
          setBookingSettings(data);
          setNumberOfHours(data.minBookingDuration || 1);
        }
      } catch (error) {
        console.error('Failed to fetch booking settings:', error);
      }
    };
    fetchSettings();
  }, []);

  // Calculate min and max dates based on booking settings
  const getMinDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + bookingSettings.advanceBookingDays);
    return maxDate.toISOString().split('T')[0];
  };

  // Read URL parameters and pre-fill form on mount
  useEffect(() => {
    const urlDate = searchParams.get('date');
    const urlStudio = searchParams.get('studio');
    const urlTime = searchParams.get('time');
    const mode = searchParams.get('mode');

    if (urlDate) {
      setDate(urlDate);
    }
    if (urlStudio) {
      setStudio(urlStudio as StudioName);
    }
    if (urlTime) {
      setPrefilledTime(urlTime);
    }

    // Handle edit mode
    if (mode === 'edit') {
      const editData = sessionStorage.getItem('editBookingData');
      if (editData) {
        try {
          const parsed = JSON.parse(editData);
          setIsEditMode(true);
          setOriginalBookingId(parsed.originalBookingId);
          setEditPhoneNumber(parsed.phone_number);
          setEditName(parsed.name);
          
          if (parsed.sessionType) {
            setSessionType(parsed.sessionType as SessionType);
            setOriginalSessionType(parsed.sessionType);
          }
          if (parsed.sessionDetails) {
            setOriginalSessionDetails(parsed.sessionDetails);
          }
          if (parsed.studio) {
            setStudio(parsed.studio as StudioName);
          }
          if (parsed.date) {
            setDate(parsed.date);
          }
          if (parsed.start_time) {
            setPrefilledTime(parsed.start_time);
            setOriginalStartTime(parsed.start_time);
          }
          if (parsed.end_time) {
            setOriginalEndTime(parsed.end_time);
          }
          
          if (parsed.start_time && parsed.end_time) {
            const [startH, startM] = parsed.start_time.split(':').map(Number);
            const [endH, endM] = parsed.end_time.split(':').map(Number);
            const duration = (endH * 60 + endM - startH * 60 - startM) / 60;
            if (duration > 0) {
              setNumberOfHours(duration);
            }
          }
        } catch (e) {
          console.error('Failed to parse edit booking data:', e);
        }
      }
    }
  }, [searchParams]);

  // Check if session type needs sub-options
  const needsSubOptions = sessionType && sessionType !== 'Only Drum Practice';

  // Check if we have all required fields to fetch rates
  const canFetchRates = (): boolean => {
    if (!sessionType) return false;
    
    switch (sessionType) {
      case 'Karaoke':
        return !!karaokeOption;
      case 'Live with musicians':
        return !!liveOption;
      case 'Only Drum Practice':
        return true;
      case 'Band':
        return bandEquipment.length > 0;
      case 'Recording':
        return !!recordingOption;
      default:
        return false;
    }
  };

  // Build the API URL for rates
  const buildRatesUrl = (): string => {
    const params = new URLSearchParams();
    params.set('sessionType', sessionType);
    
    switch (sessionType) {
      case 'Karaoke':
        params.set('subOption', karaokeOption);
        break;
      case 'Live with musicians':
        params.set('subOption', liveOption);
        break;
      case 'Band':
        params.set('equipment', bandEquipment.join(','));
        break;
      case 'Recording':
        params.set('subOption', recordingOption);
        break;
    }
    
    if (studio) {
      params.set('studio', studio);
    }
    
    return `/api/rates?${params.toString()}`;
  };

  // Fetch rates when form values change
  useEffect(() => {
    if (!canFetchRates()) {
      setRatesData(null);
      return;
    }

    const fetchRates = async () => {
      setLoadingRates(true);
      setRatesError('');
      try {
        const response = await fetch(buildRatesUrl());
        const data = await safeJsonParse(response);
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch rates');
        }
        setRatesData(data as RatesResponse);
        if (!studio) {
          setStudio(data.suggested_studio);
        }
      } catch (err) {
        setRatesError(err instanceof Error ? err.message : 'Failed to fetch rates');
        setRatesData(null);
      } finally {
        setLoadingRates(false);
      }
    };

    fetchRates();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionType, karaokeOption, liveOption, bandEquipment, recordingOption]);

  // Handle studio selection
  const handleStudioSelect = (selectedStudio: StudioName) => {
    if (!ratesData) return;
    
    if (!ratesData.allowed_studios.includes(selectedStudio)) {
      setStudioError('Your group size does not fit in this studio. Please select a larger studio.');
      return;
    }
    
    setStudioError('');
    setStudio(selectedStudio);
    
    if (ratesData.rate_breakdown && selectedStudio in ratesData.rate_breakdown) {
      setRatesData(prev => prev ? {
        ...prev,
        suggested_rate: prev.rate_breakdown![selectedStudio]
      } : null);
    }
  };

  // Toggle band equipment
  const toggleBandEquipment = (equipment: BandEquipment) => {
    setBandEquipment(prev => {
      if (prev.includes(equipment)) {
        return prev.filter(e => e !== equipment);
      } else {
        return [...prev, equipment];
      }
    });
  };

  // Fetch availability when studio or date changes
  useEffect(() => {
    if (!studio || !date) {
      setAvailableSlots([]);
      setSelectedSlots([]);
      return;
    }

    const fetchAvailability = async () => {
      setLoadingSlots(true);
      setSlotsError('');
      setSelectedSlots([]);
      try {
        const response = await fetch(
          `/api/availability?studio=${encodeURIComponent(studio)}&date=${date}`
        );
        const data = await safeJsonParse(response);
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch availability');
        }
        setAvailableSlots(data as TimeSlot[]);
        
        if (prefilledTime) {
          const startIndex = (data as TimeSlot[]).findIndex((slot: TimeSlot) => slot.start === prefilledTime);
          if (startIndex !== -1) {
            const slotsToSelect = data.slice(startIndex, startIndex + numberOfHours);
            if (slotsToSelect.length === numberOfHours && areConsecutiveSlots(slotsToSelect)) {
              setSelectedSlots(slotsToSelect);
            } else {
              setSelectedSlots([data[startIndex]]);
            }
          }
          setPrefilledTime(null);
        }
      } catch (err) {
        setSlotsError(err instanceof Error ? err.message : 'Failed to fetch availability');
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchAvailability();
  }, [studio, date, prefilledTime, numberOfHours]);

  // Helper to check if slots are consecutive
  const areConsecutiveSlots = (slots: TimeSlot[]): boolean => {
    for (let i = 1; i < slots.length; i++) {
      if (slots[i - 1].end !== slots[i].start) {
        return false;
      }
    }
    return true;
  };

  // Check if a slot can be selected as start time
  const canSelectAsStartTime = (slotIndex: number): boolean => {
    if (slotIndex + numberOfHours > availableSlots.length) return false;
    const potentialSlots = availableSlots.slice(slotIndex, slotIndex + numberOfHours);
    if (potentialSlots.length < numberOfHours) return false;
    return areConsecutiveSlots(potentialSlots);
  };

  // Time slot selection
  const handleSlotSelect = (slot: TimeSlot, slotIndex: number) => {
    if (selectedSlots.length > 0 && selectedSlots[0].start === slot.start) {
      setSelectedSlots([]);
      return;
    }

    if (!canSelectAsStartTime(slotIndex)) {
      return;
    }

    const slotsToSelect = availableSlots.slice(slotIndex, slotIndex + numberOfHours);
    setSelectedSlots(slotsToSelect);
  };

  // Update selected slots when numberOfHours changes
  useEffect(() => {
    if (selectedSlots.length > 0 && availableSlots.length > 0) {
      const startSlotIndex = availableSlots.findIndex(s => s.start === selectedSlots[0].start);
      if (startSlotIndex !== -1) {
        if (canSelectAsStartTime(startSlotIndex)) {
          const slotsToSelect = availableSlots.slice(startSlotIndex, startSlotIndex + numberOfHours);
          setSelectedSlots(slotsToSelect);
        } else {
          setSelectedSlots([]);
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numberOfHours]);

  // Check if a slot is the start of the current selection
  const isStartSlot = (slot: TimeSlot): boolean => {
    return selectedSlots.length > 0 && selectedSlots[0].start === slot.start;
  };

  // Step validation
  const canProceedFromStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!sessionType;
      case 2:
        // Skip this step for 'Only Drum Practice'
        if (sessionType === 'Only Drum Practice') return true;
        return canFetchRates();
      case 3:
        return !!studio && !studioError;
      case 4:
        return selectedSlot !== null && selectedSlots.length >= bookingSettings.minBookingDuration;
      default:
        return false;
    }
  };

  // Get the actual step number (accounting for skipped steps)
  const getActualStep = (step: number): number => {
    if (sessionType === 'Only Drum Practice' && step >= 2) {
      return step; // Step 2 (Details) will be skipped
    }
    return step;
  };

  // Get display steps based on session type
  const getDisplaySteps = () => {
    if (sessionType === 'Only Drum Practice') {
      return STEPS.filter(s => s.number !== 2);
    }
    return STEPS;
  };

  // Navigate to next step
  const handleNext = () => {
    if (currentStep === 1 && sessionType === 'Only Drum Practice') {
      // Skip step 2 for 'Only Drum Practice'
      setCurrentStep(3);
    } else if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Navigate to previous step
  const handleBack = () => {
    if (currentStep === 3 && sessionType === 'Only Drum Practice') {
      // Skip step 2 when going back for 'Only Drum Practice'
      setCurrentStep(1);
    } else if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleReviewBooking = () => {
    if (!selectedSlot || selectedSlots.length === 0) return;
    
    if (selectedSlots.length < bookingSettings.minBookingDuration) {
      setSlotsError(`Minimum booking duration is ${bookingSettings.minBookingDuration} hour(s). Please select more time slots.`);
      return;
    }
    
    let sessionDetails: Record<string, unknown> = { sessionType };
    
    switch (sessionType) {
      case 'Karaoke':
        sessionDetails.karaokeOption = karaokeOption;
        sessionDetails.karaokeLabel = KARAOKE_OPTIONS.find(o => o.value === karaokeOption)?.label;
        break;
      case 'Live with musicians':
        sessionDetails.liveOption = liveOption;
        sessionDetails.liveLabel = LIVE_OPTIONS.find(o => o.value === liveOption)?.label;
        break;
      case 'Band':
        sessionDetails.bandEquipment = bandEquipment;
        sessionDetails.bandLabel = bandEquipment.map(e => BAND_EQUIPMENT.find(b => b.value === e)?.label).join(', ');
        break;
      case 'Recording':
        sessionDetails.recordingOption = recordingOption;
        sessionDetails.recordingLabel = RECORDING_OPTIONS.find(o => o.value === recordingOption)?.label;
        break;
    }
    
    const bookingData = {
      ...sessionDetails,
      studio,
      date,
      start_time: selectedSlot.start,
      end_time: selectedSlot.end,
      rate: ratesData?.suggested_rate,
      duration: selectedSlots.length,
      isEditMode,
      originalBookingId: isEditMode ? originalBookingId : null,
      editPhoneNumber: isEditMode ? editPhoneNumber : null,
      editName: isEditMode ? editName : null,
    };
    sessionStorage.setItem('bookingData', JSON.stringify(bookingData));
    
    if (isEditMode) {
      sessionStorage.removeItem('editBookingData');
    }
    
    router.push('/review');
  };

  // Format time for display
  const formatTimeDisplay = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Get sub-option label for display
  const getSubOptionLabel = (): string => {
    switch (sessionType) {
      case 'Karaoke':
        return KARAOKE_OPTIONS.find(o => o.value === karaokeOption)?.label || '';
      case 'Live with musicians':
        return LIVE_OPTIONS.find(o => o.value === liveOption)?.label || '';
      case 'Band':
        return bandEquipment.map(e => BAND_EQUIPMENT.find(b => b.value === e)?.label).join(', ') || '';
      case 'Recording':
        return RECORDING_OPTIONS.find(o => o.value === recordingOption)?.label || '';
      default:
        return '';
    }
  };

  // Animation variants
  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link 
            href="/home"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </Link>
          
          <h1 className="text-3xl font-bold text-white mb-1">
            {isEditMode ? 'Change Your Booking' : 'Book Your Session'}
          </h1>
          <p className="text-zinc-400 text-sm">
            {isEditMode 
              ? 'Modify your booking details below'
              : 'Complete each step to book your session'
            }
          </p>
        </motion.div>

        {/* Progress Bar */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-3">
            {getDisplaySteps().map((step, index) => {
              const displaySteps = getDisplaySteps();
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              
              return (
                <div key={step.number} className="flex items-center">
                  <motion.div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isActive 
                        ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-500/30' 
                        : isCompleted
                          ? 'bg-violet-500/20 text-violet-400 border border-violet-500/50'
                          : 'bg-white/5 text-zinc-500 border border-white/10'
                    }`}
                    animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : step.icon}
                  </motion.div>
                  {index < displaySteps.length - 1 && (
                    <div className={`w-8 sm:w-12 md:w-16 h-1 mx-1 rounded transition-colors duration-300 ${
                      isCompleted ? 'bg-violet-500' : 'bg-white/10'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
          <div className="text-center">
            <span className="text-zinc-400 text-sm">
              Step {getDisplaySteps().findIndex(s => s.number === currentStep) + 1} of {getDisplaySteps().length}:
            </span>
            <span className="text-white font-medium ml-2">
              {STEPS.find(s => s.number === currentStep)?.label}
            </span>
          </div>
        </motion.div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {/* Step 1: Session Type */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="glass rounded-2xl p-6"
            >
              <h2 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
                <Mic className="w-5 h-5 text-violet-400" />
                What type of session do you want?
              </h2>
              <p className="text-zinc-400 text-sm mb-6">Choose the session type that best fits your needs</p>
              
              {/* Show original session type when in edit mode */}
              {isEditMode && originalSessionType && (
                <div className="mb-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <p className="text-amber-400 text-xs uppercase tracking-wide mb-1">Currently Booked</p>
                  <p className="text-amber-300 font-semibold text-lg">{originalSessionType}</p>
                </div>
              )}

              {isEditMode && (
                <p className="text-zinc-400 text-sm mb-3">Choose a new session type:</p>
              )}
              
              <div className="space-y-3">
                {SESSION_TYPES.map((type) => (
                  <button
                    key={type.name}
                    type="button"
                    onClick={() => setSessionType(type.name)}
                    className={`w-full p-4 rounded-xl border text-left transition-all flex items-center gap-4 ${
                      sessionType === type.name
                        ? 'bg-violet-500/20 border-violet-500 text-white'
                        : 'bg-white/5 border-white/10 text-zinc-400 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <span className={`p-3 rounded-lg ${sessionType === type.name ? 'bg-violet-500/30 text-violet-400' : 'bg-white/5 text-zinc-500'}`}>
                      {type.icon}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-lg">{type.name}</p>
                      <p className="text-sm text-zinc-500">{type.description}</p>
                    </div>
                    {sessionType === type.name && (
                      <CheckCircle2 className="w-6 h-6 text-violet-400" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2: Sub-options (Details) */}
          {currentStep === 2 && needsSubOptions && (
            <motion.div
              key="step2"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="glass rounded-2xl p-6"
            >
              <h2 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
                <Users className="w-5 h-5 text-violet-400" />
                {sessionType === 'Karaoke' && 'How many participants?'}
                {sessionType === 'Live with musicians' && 'How many musicians?'}
                {sessionType === 'Band' && 'What equipment do you need?'}
                {sessionType === 'Recording' && 'Choose your recording package'}
              </h2>
              <p className="text-zinc-400 text-sm mb-6">This helps us find the best studio for you</p>

              {/* Show original session details when in edit mode */}
              {isEditMode && originalSessionDetails && (
                <div className="mb-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <p className="text-amber-400 text-xs uppercase tracking-wide mb-1">Currently Booked</p>
                  <p className="text-amber-300 font-semibold text-lg">{originalSessionDetails}</p>
                </div>
              )}

              {isEditMode && (
                <p className="text-zinc-400 text-sm mb-3">Choose new details:</p>
              )}

              {/* Karaoke Options */}
              {sessionType === 'Karaoke' && (
                <div className="space-y-3">
                  {KARAOKE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setKaraokeOption(option.value)}
                      className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                        karaokeOption === option.value
                          ? 'bg-violet-500/20 border-violet-500 text-white'
                          : 'bg-white/5 border-white/10 text-zinc-400 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      <span className="font-medium">{option.label}</span>
                      {karaokeOption === option.value && (
                        <Check className="w-5 h-5 text-violet-400" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Live with Musicians Options */}
              {sessionType === 'Live with musicians' && (
                <div className="space-y-3">
                  {LIVE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setLiveOption(option.value)}
                      className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                        liveOption === option.value
                          ? 'bg-violet-500/20 border-violet-500 text-white'
                          : 'bg-white/5 border-white/10 text-zinc-400 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      <span className="font-medium">{option.label}</span>
                      {liveOption === option.value && (
                        <Check className="w-5 h-5 text-violet-400" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Band Equipment */}
              {sessionType === 'Band' && (
                <div className="grid grid-cols-2 gap-4">
                  {BAND_EQUIPMENT.map((equipment) => (
                    <button
                      key={equipment.value}
                      type="button"
                      onClick={() => toggleBandEquipment(equipment.value)}
                      className={`p-4 rounded-xl border text-left flex items-center gap-3 transition-all ${
                        bandEquipment.includes(equipment.value)
                          ? 'bg-violet-500/20 border-violet-500 text-white'
                          : 'bg-white/5 border-white/10 text-zinc-400 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                        bandEquipment.includes(equipment.value)
                          ? 'bg-violet-500 border-violet-500'
                          : 'border-zinc-500'
                      }`}>
                        {bandEquipment.includes(equipment.value) && (
                          <Check className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <span className={bandEquipment.includes(equipment.value) ? 'text-violet-300' : ''}>
                        {equipment.icon}
                      </span>
                      <span className="font-medium">{equipment.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Recording Options */}
              {sessionType === 'Recording' && (
                <div className="space-y-3">
                  {RECORDING_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setRecordingOption(option.value)}
                      className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                        recordingOption === option.value
                          ? 'bg-violet-500/20 border-violet-500 text-white'
                          : 'bg-white/5 border-white/10 text-zinc-400 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      <div>
                        <p className="font-medium">{option.label}</p>
                        <p className="text-sm text-amber-400">{option.price}</p>
                      </div>
                      {recordingOption === option.value && (
                        <Check className="w-5 h-5 text-violet-400" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Step 3: Studio Selection */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="glass rounded-2xl p-6"
            >
              <h2 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
                <Music className="w-5 h-5 text-violet-400" />
                Select Your Studio
              </h2>
              <p className="text-zinc-400 text-sm mb-6">We&apos;ve suggested the best studio for your session</p>

              {loadingRates && (
                <div className="p-8 rounded-xl bg-white/5 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                  <span className="text-zinc-400">Finding the best studio for you...</span>
                </div>
              )}

              {ratesError && !loadingRates && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <span className="text-red-400">{ratesError}</span>
                </div>
              )}

              {ratesData && !loadingRates && (
                <>
                  <div className="mb-6 p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
                    <p className="text-violet-300 flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      {ratesData.explanation}
                    </p>
                  </div>

                  {studioError && (
                    <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                      <p className="text-red-400 text-sm flex items-start gap-2">
                        <X className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        {studioError}
                      </p>
                    </div>
                  )}

                  <div className="space-y-4">
                    {STUDIOS.map((studioInfo) => {
                      const isAllowed = ratesData.allowed_studios.includes(studioInfo.name);
                      const isSelected = studio === studioInfo.name;
                      const isSuggested = ratesData.suggested_studio === studioInfo.name;
                      const studioRate = ratesData.rate_breakdown?.[studioInfo.name];

                      return (
                        <motion.button
                          key={studioInfo.name}
                          type="button"
                          onClick={() => handleStudioSelect(studioInfo.name)}
                          disabled={!isAllowed}
                          className={`relative w-full p-5 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'bg-violet-500/20 border-violet-500 ring-2 ring-violet-500/50'
                              : isAllowed
                                ? 'bg-white/5 border-white/10 hover:border-violet-500/50 hover:bg-violet-500/10'
                                : 'bg-zinc-900/50 border-zinc-800 opacity-50 cursor-not-allowed'
                          }`}
                          whileHover={isAllowed ? { scale: 1.01 } : {}}
                          whileTap={isAllowed ? { scale: 0.99 } : {}}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className={`font-bold text-lg ${isSelected ? 'text-white' : isAllowed ? 'text-zinc-300' : 'text-zinc-500'}`}>
                                  {studioInfo.name}
                                </h3>
                                {isSuggested && (
                                  <span className="px-2 py-0.5 bg-violet-500 text-white text-xs font-medium rounded-full">
                                    Recommended
                                  </span>
                                )}
                                {!isAllowed && (
                                  <span className="px-2 py-0.5 bg-zinc-700 text-zinc-400 text-xs font-medium rounded-full">
                                    Too Small
                                  </span>
                                )}
                              </div>
                              <p className={`text-sm mb-2 ${isAllowed ? 'text-zinc-400' : 'text-zinc-600'}`}>
                                {studioInfo.description}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {studioInfo.features.map((feature, i) => (
                                  <span key={i} className="text-xs px-2 py-1 bg-white/5 rounded text-zinc-500">
                                    {feature}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="text-right">
                              {studioRate && isAllowed && (
                                <p className={`text-xl font-bold ${isSelected ? 'text-amber-400' : 'text-amber-500/70'}`}>
                                  ₹{studioRate}
                                  <span className="text-sm font-normal">/hr</span>
                                </p>
                              )}
                              {isSelected && (
                                <CheckCircle2 className="w-6 h-6 text-violet-400 mt-2 ml-auto" />
                              )}
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* Step 4: Date & Time */}
          {currentStep === 4 && (
            <motion.div
              key="step4"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="glass rounded-2xl p-6"
            >
              <h2 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-violet-400" />
                Choose Date & Time
              </h2>
              <p className="text-zinc-400 text-sm mb-6">Select when you want to book {studio}</p>

              {/* Date Picker */}
              <div className="mb-6">
                <label htmlFor="date" className="block text-sm font-medium text-zinc-300 mb-2">
                  Select Date
                </label>
                <input
                  type="date"
                  id="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={getMinDate()}
                  max={getMaxDate()}
                  className="input text-lg"
                />
                <p className="text-xs text-zinc-500 mt-1">
                  Book up to {bookingSettings.advanceBookingDays} days in advance
                </p>
              </div>

              {/* Number of Hours */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Duration
                </label>
                <div className="flex items-center gap-4 justify-center bg-white/5 rounded-xl p-4">
                  <button
                    type="button"
                    onClick={() => setNumberOfHours(prev => Math.max(bookingSettings.minBookingDuration, prev - 1))}
                    disabled={numberOfHours <= bookingSettings.minBookingDuration}
                    className={`w-14 h-14 rounded-xl border flex items-center justify-center text-2xl font-bold transition-all ${
                      numberOfHours <= bookingSettings.minBookingDuration
                        ? 'bg-zinc-800/50 text-zinc-600 border-zinc-700 cursor-not-allowed'
                        : 'bg-white/5 text-white border-white/10 hover:border-violet-500 hover:bg-violet-500/20'
                    }`}
                  >
                    -
                  </button>
                  <div className="text-center min-w-[100px]">
                    <span className="text-4xl font-bold text-white">{numberOfHours}</span>
                    <span className="text-zinc-400 ml-2 text-lg">hour{numberOfHours > 1 ? 's' : ''}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNumberOfHours(prev => Math.min(bookingSettings.maxBookingDuration, prev + 1))}
                    disabled={numberOfHours >= bookingSettings.maxBookingDuration}
                    className={`w-14 h-14 rounded-xl border flex items-center justify-center text-2xl font-bold transition-all ${
                      numberOfHours >= bookingSettings.maxBookingDuration
                        ? 'bg-zinc-800/50 text-zinc-600 border-zinc-700 cursor-not-allowed'
                        : 'bg-white/5 text-white border-white/10 hover:border-violet-500 hover:bg-violet-500/20'
                    }`}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Time Slots */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-3">
                  Select Start Time
                </label>
                
                {loadingSlots && (
                  <div className="p-8 rounded-xl bg-white/5 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
                    <span className="text-zinc-400">Loading available slots...</span>
                  </div>
                )}
                
                {!loadingSlots && slotsError && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <span className="text-red-400">{slotsError}</span>
                  </div>
                )}
                
                {!loadingSlots && !slotsError && studio && date && availableSlots.length === 0 && (
                  <div className="p-6 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                    <Calendar className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                    <h3 className="text-white font-semibold mb-2">No Slots Available</h3>
                    <p className="text-amber-300 text-sm">
                      No available time slots for {studio} on this date. Try a different date.
                    </p>
                  </div>
                )}
                
                {!loadingSlots && !slotsError && availableSlots.length > 0 && (
                  <>
                    {/* Show original slot when in edit mode */}
                    {isEditMode && originalStartTime && originalEndTime && (
                      <div className="mb-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                        <p className="text-amber-400 text-xs uppercase tracking-wide mb-1">Currently Booked Slot</p>
                        <p className="text-amber-300 font-semibold text-lg">
                          {formatTimeDisplay(originalStartTime)} - {formatTimeDisplay(originalEndTime)}
                        </p>
                      </div>
                    )}
                    
                    {selectedSlots.length > 0 && (
                      <div className="mb-4 p-3 rounded-xl bg-violet-500/20 border border-violet-500/30">
                        <p className="text-violet-400 text-xs uppercase tracking-wide mb-1">
                          {isEditMode ? 'New Selected Slot' : 'Selected'}
                        </p>
                        <p className="text-violet-300 font-medium text-center">
                          {formatTimeDisplay(selectedSlots[0].start)} - {formatTimeDisplay(selectedSlots[selectedSlots.length - 1].end)}
                        </p>
                      </div>
                    )}

                    {isEditMode && (
                      <p className="text-zinc-400 text-sm mb-3">Choose a new time slot:</p>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-1">
                      {availableSlots.map((slot, index) => {
                        const canSelect = canSelectAsStartTime(index);
                        if (!canSelect) return null;
                        
                        const isStart = isStartSlot(slot);
                        const endSlot = availableSlots[index + numberOfHours - 1];
                        if (!endSlot) return null;
                        
                        // Format time range display (e.g., "8-9 AM" for 1hr, "8-10 AM" for 2hrs, "8-11 AM" for 3hrs)
                        const formatTimeRange = (start: string, endTime: string) => {
                          const [startH] = start.split(':').map(Number);
                          const [endH] = endTime.split(':').map(Number);
                          const startPeriod = startH >= 12 ? 'PM' : 'AM';
                          const endPeriod = endH >= 12 ? 'PM' : 'AM';
                          const startDisplay = startH % 12 || 12;
                          const endDisplay = endH % 12 || 12;
                          
                          if (startPeriod === endPeriod) {
                            return `${startDisplay}-${endDisplay} ${endPeriod}`;
                          } else {
                            return `${startDisplay} ${startPeriod}-${endDisplay} ${endPeriod}`;
                          }
                        };
                        
                        return (
                          <button
                            key={`${slot.start}-${endSlot.end}`}
                            type="button"
                            onClick={() => handleSlotSelect(slot, index)}
                            className={`px-3 py-3 text-sm rounded-xl border transition-all font-medium ${
                              isStart
                                ? 'bg-violet-500 text-white border-violet-500 shadow-lg shadow-violet-500/25'
                                : 'bg-white/5 text-white border-white/10 hover:border-violet-500 hover:bg-violet-500/20'
                            }`}
                          >
                            {formatTimeRange(slot.start, endSlot.end)}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
                
                {!loadingSlots && !slotsError && !date && (
                  <div className="p-6 rounded-xl bg-white/5 text-center">
                    <Clock className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                    <p className="text-zinc-500">Select a date to see available slots</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 5: Review */}
          {currentStep === 5 && (
            <motion.div
              key="step5"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="glass rounded-2xl p-6"
            >
              <h2 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-violet-400" />
                Review Your Booking
              </h2>
              <p className="text-zinc-400 text-sm mb-6">Please confirm your booking details</p>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center py-3 border-b border-white/10">
                  <span className="text-zinc-400">Session Type</span>
                  <span className="text-white font-medium">{sessionType}</span>
                </div>
                
                {sessionType && sessionType !== 'Only Drum Practice' && (
                  <div className="flex justify-between items-start py-3 border-b border-white/10">
                    <span className="text-zinc-400">Details</span>
                    <span className="text-white font-medium text-right max-w-[60%]">
                      {getSubOptionLabel()}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between items-center py-3 border-b border-white/10">
                  <span className="text-zinc-400">Studio</span>
                  <span className="text-white font-medium">{studio}</span>
                </div>
                
                <div className="flex justify-between items-center py-3 border-b border-white/10">
                  <span className="text-zinc-400">Date</span>
                  <span className="text-white font-medium">
                    {date ? new Date(date).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'long', 
                      day: 'numeric' 
                    }) : '-'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-3 border-b border-white/10">
                  <span className="text-zinc-400">Time</span>
                  <span className="text-white font-medium">
                    {selectedSlot ? `${formatTimeDisplay(selectedSlot.start)} - ${formatTimeDisplay(selectedSlot.end)}` : '-'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-3 border-b border-white/10">
                  <span className="text-zinc-400">Duration</span>
                  <span className="text-white font-medium">{selectedSlots.length} hour(s)</span>
                </div>
                
                {ratesData && (
                  <>
                    <div className="flex justify-between items-center py-3 border-b border-white/10">
                      <span className="text-zinc-400">Rate</span>
                      <span className="text-amber-400 font-bold">
                        ₹{ratesData.suggested_rate.toLocaleString('en-IN')}
                        {sessionType === 'Recording' && recordingOption !== 'sd_card_recording' ? '/song' : '/hr'}
                      </span>
                    </div>

                    {sessionType !== 'Recording' && (
                      <div className="flex justify-between items-center py-4 bg-violet-500/10 rounded-xl px-4 -mx-1">
                        <span className="text-violet-300 font-medium">Estimated Total</span>
                        <span className="text-white font-bold text-2xl">
                          ₹{(ratesData.suggested_rate * selectedSlots.length).toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>

              <motion.button
                type="button"
                onClick={handleReviewBooking}
                className="w-full py-4 rounded-xl font-semibold btn-accent flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Proceed to Confirmation
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <motion.div 
          className="flex gap-4 mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {currentStep > 1 && (
            <motion.button
              type="button"
              onClick={handleBack}
              className="flex-1 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </motion.button>
          )}
          
          {currentStep < 5 && (
            <motion.button
              type="button"
              onClick={handleNext}
              disabled={!canProceedFromStep(currentStep)}
              className={`flex-1 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                canProceedFromStep(currentStep)
                  ? 'bg-violet-500 hover:bg-violet-600 text-white'
                  : 'bg-white/5 text-zinc-500 cursor-not-allowed'
              }`}
              whileHover={canProceedFromStep(currentStep) ? { scale: 1.02 } : {}}
              whileTap={canProceedFromStep(currentStep) ? { scale: 0.98 } : {}}
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
