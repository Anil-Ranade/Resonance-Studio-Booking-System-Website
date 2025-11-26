'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Mic, 
  Users, 
  Calendar, 
  Clock, 
  ChevronRight,
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

function BookingPageLoading() {
  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
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

  // Mobile step state (1 = session details, 2 = studio, 3 = date/time)
  const [mobileStep, setMobileStep] = useState(1);

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
          const data = await response.json();
          setBookingSettings(data);
          // Initialize numberOfHours with minBookingDuration
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

    if (urlDate) {
      setDate(urlDate);
    }
    if (urlStudio) {
      setStudio(urlStudio as StudioName);
    }
    if (urlTime) {
      setPrefilledTime(urlTime);
    }
  }, [searchParams]);

  // Reset sub-options when session type changes
  useEffect(() => {
    setKaraokeOption('');
    setLiveOption('');
    setBandEquipment([]);
    setRecordingOption('');
    setRatesData(null);
    setStudio('');
    setStudioError('');
  }, [sessionType]);

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
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to fetch rates');
        }
        const data: RatesResponse = await response.json();
        setRatesData(data);
        // Auto-select suggested studio if no studio selected
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
    
    // Check if the studio is allowed (upgrade only)
    if (!ratesData.allowed_studios.includes(selectedStudio)) {
      setStudioError('Your group size does not fit in this studio. Please select a larger studio.');
      return;
    }
    
    setStudioError('');
    setStudio(selectedStudio);
    
    // Update rate based on selected studio
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
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to fetch availability');
        }
        const data: TimeSlot[] = await response.json();
        setAvailableSlots(data);
        
        // Auto-select prefilled time slot if it exists in available slots
        if (prefilledTime) {
          const startIndex = data.findIndex(slot => slot.start === prefilledTime);
          if (startIndex !== -1) {
            // Select slots based on numberOfHours
            const slotsToSelect = data.slice(startIndex, startIndex + numberOfHours);
            // Only select if all consecutive slots are available
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

  // Check if a slot can be selected as start time (has enough consecutive slots)
  const canSelectAsStartTime = (slotIndex: number): boolean => {
    // Check if there are enough slots remaining
    if (slotIndex + numberOfHours > availableSlots.length) return false;
    
    const potentialSlots = availableSlots.slice(slotIndex, slotIndex + numberOfHours);
    
    // Make sure we actually have the required number of slots
    if (potentialSlots.length < numberOfHours) return false;
    
    return areConsecutiveSlots(potentialSlots);
  };

  // Time slot selection - now selects based on numberOfHours
  const handleSlotSelect = (slot: TimeSlot, slotIndex: number) => {
    // If already selected as start, deselect
    if (selectedSlots.length > 0 && selectedSlots[0].start === slot.start) {
      setSelectedSlots([]);
      return;
    }

    // Check if we can select this slot with the required number of hours
    if (!canSelectAsStartTime(slotIndex)) {
      // Show error or just don't select
      return;
    }

    // Select consecutive slots based on numberOfHours
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
          // Clear selection if not enough consecutive slots
          setSelectedSlots([]);
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numberOfHours]);

  // Check if a slot is part of the current selection
  const isSlotSelected = (slot: TimeSlot): boolean => {
    return selectedSlots.some(s => s.start === slot.start && s.end === slot.end);
  };

  // Check if a slot is the start of the current selection
  const isStartSlot = (slot: TimeSlot): boolean => {
    return selectedSlots.length > 0 && selectedSlots[0].start === slot.start;
  };

  const handleReviewBooking = () => {
    if (!selectedSlot || selectedSlots.length === 0) return;
    
    if (selectedSlots.length < bookingSettings.minBookingDuration) {
      setSlotsError(`Minimum booking duration is ${bookingSettings.minBookingDuration} hour(s). Please select more time slots.`);
      return;
    }
    
    // Build booking details based on session type
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
    };
    sessionStorage.setItem('bookingData', JSON.stringify(bookingData));
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

  const steps = [
    { number: 1, label: 'Session Details', active: true },
    { number: 2, label: 'Choose Studio', active: canFetchRates() },
    { number: 3, label: 'Choose Time', active: !!studio && canFetchRates() },
    { number: 4, label: 'Review', active: selectedSlot !== null },
  ];

  // Mobile step navigation helpers
  const canProceedToStep2 = canFetchRates();
  const canProceedToStep3 = !!studio && canFetchRates();

  const handleMobileNext = () => {
    if (mobileStep === 1 && canProceedToStep2) {
      setMobileStep(2);
    } else if (mobileStep === 2 && canProceedToStep3) {
      setMobileStep(3);
    }
  };

  const handleMobileBack = () => {
    if (mobileStep > 1) {
      setMobileStep(mobileStep - 1);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link 
            href="/home"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </Link>
          
          <h1 className="text-4xl font-bold text-white mb-2">
            Book Your Session
          </h1>
          <p className="text-zinc-400">
            Select your session type and preferences to find the perfect studio
          </p>
        </motion.div>

        {/* Progress Steps */}
        <motion.div 
          className="flex items-center justify-between mb-10 glass rounded-2xl p-4 overflow-x-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className="flex items-center gap-2">
                <motion.div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                    step.active 
                      ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white' 
                      : 'bg-white/5 text-zinc-500'
                  }`}
                >
                  {step.number}
                </motion.div>
                <span className={`hidden sm:block text-xs font-medium ${
                  step.active ? 'text-white' : 'text-zinc-500'
                }`}>
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-8 sm:w-16 h-0.5 mx-2 rounded transition-colors duration-300 ${
                  steps[index + 1].active ? 'bg-violet-500' : 'bg-white/10'
                }`} />
              )}
            </div>
          ))}
        </motion.div>

        {/* Mobile Step Indicator */}
        <div className="lg:hidden mb-6">
          <div className="glass rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-zinc-400 text-sm">Step {mobileStep} of 3</span>
              <span className="text-white font-medium">
                {mobileStep === 1 && 'Session Details'}
                {mobileStep === 2 && 'Choose Studio'}
                {mobileStep === 3 && 'Date & Time'}
              </span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
                initial={false}
                animate={{ width: `${(mobileStep / 3) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </div>

        {/* Booking Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Session Type Card - Step 1 on mobile */}
            <motion.div 
              className={`glass rounded-2xl p-6 ${mobileStep !== 1 ? 'hidden lg:block' : ''}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Mic className="w-5 h-5 text-violet-400" />
                Session Type
              </h2>
              
              <div className="space-y-3">
                {SESSION_TYPES.map((type) => (
                  <motion.button
                    key={type.name}
                    type="button"
                    onClick={() => setSessionType(type.name)}
                    className={`w-full p-4 rounded-xl border text-left transition-all flex items-center gap-4 ${
                      sessionType === type.name
                        ? 'bg-violet-500/20 border-violet-500 text-white'
                        : 'bg-white/5 border-white/10 text-zinc-400 hover:border-white/20 hover:text-white'
                    }`}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <span className={`p-2 rounded-lg ${sessionType === type.name ? 'bg-violet-500/30 text-violet-400' : 'bg-white/5 text-zinc-500'}`}>
                      {type.icon}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium">{type.name}</p>
                      <p className="text-sm text-zinc-500">{type.description}</p>
                    </div>
                    {sessionType === type.name && (
                      <CheckCircle2 className="w-5 h-5 text-violet-400" />
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Sub-option Card - Shows based on session type - Step 1 on mobile */}
            <AnimatePresence mode="wait">
              {sessionType && sessionType !== 'Only Drum Practice' && (
                <motion.div 
                  className={`glass rounded-2xl p-6 ${mobileStep !== 1 ? 'hidden lg:block' : ''}`}
                  initial={{ opacity: 0, x: -20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto' }}
                  exit={{ opacity: 0, x: -20, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-violet-400" />
                    {sessionType === 'Karaoke' && 'How many participants?'}
                    {sessionType === 'Live with musicians' && 'How many musicians?'}
                    {sessionType === 'Band' && 'Select Equipment'}
                    {sessionType === 'Recording' && 'Recording Package'}
                  </h2>

                  {/* Karaoke Options */}
                  {sessionType === 'Karaoke' && (
                    <div className="space-y-2">
                      {KARAOKE_OPTIONS.map((option) => (
                        <motion.button
                          key={option.value}
                          type="button"
                          onClick={() => setKaraokeOption(option.value)}
                          className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                            karaokeOption === option.value
                              ? 'bg-violet-500/20 border-violet-500 text-white'
                              : 'bg-white/5 border-white/10 text-zinc-400 hover:border-white/20 hover:text-white'
                          }`}
                          whileTap={{ scale: 0.99 }}
                        >
                          <span>{option.label}</span>
                          {karaokeOption === option.value && (
                            <Check className="w-4 h-4 text-violet-400" />
                          )}
                        </motion.button>
                      ))}
                    </div>
                  )}

                  {/* Live with Musicians Options */}
                  {sessionType === 'Live with musicians' && (
                    <div className="space-y-2">
                      {LIVE_OPTIONS.map((option) => (
                        <motion.button
                          key={option.value}
                          type="button"
                          onClick={() => setLiveOption(option.value)}
                          className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                            liveOption === option.value
                              ? 'bg-violet-500/20 border-violet-500 text-white'
                              : 'bg-white/5 border-white/10 text-zinc-400 hover:border-white/20 hover:text-white'
                          }`}
                          whileTap={{ scale: 0.99 }}
                        >
                          <span>{option.label}</span>
                          {liveOption === option.value && (
                            <Check className="w-4 h-4 text-violet-400" />
                          )}
                        </motion.button>
                      ))}
                    </div>
                  )}

                  {/* Band Equipment Checkboxes */}
                  {sessionType === 'Band' && (
                    <div className="grid grid-cols-2 gap-3">
                      {BAND_EQUIPMENT.map((equipment) => (
                        <motion.button
                          key={equipment.value}
                          type="button"
                          onClick={() => toggleBandEquipment(equipment.value)}
                          className={`p-4 rounded-xl border text-left transition-all flex items-center gap-3 ${
                            bandEquipment.includes(equipment.value)
                              ? 'bg-violet-500/20 border-violet-500 text-white'
                              : 'bg-white/5 border-white/10 text-zinc-400 hover:border-white/20 hover:text-white'
                          }`}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                            bandEquipment.includes(equipment.value)
                              ? 'bg-violet-500 border-violet-500'
                              : 'border-zinc-500'
                          }`}>
                            {bandEquipment.includes(equipment.value) && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <span className={bandEquipment.includes(equipment.value) ? 'text-violet-300' : ''}>
                            {equipment.icon}
                          </span>
                          <span className="font-medium">{equipment.label}</span>
                        </motion.button>
                      ))}
                    </div>
                  )}

                  {/* Recording Options */}
                  {sessionType === 'Recording' && (
                    <div className="space-y-2">
                      {RECORDING_OPTIONS.map((option) => (
                        <motion.button
                          key={option.value}
                          type="button"
                          onClick={() => setRecordingOption(option.value)}
                          className={`w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between ${
                            recordingOption === option.value
                              ? 'bg-violet-500/20 border-violet-500 text-white'
                              : 'bg-white/5 border-white/10 text-zinc-400 hover:border-white/20 hover:text-white'
                          }`}
                          whileTap={{ scale: 0.99 }}
                        >
                          <div>
                            <p className="font-medium">{option.label}</p>
                            <p className="text-sm text-amber-400">{option.price}</p>
                          </div>
                          {recordingOption === option.value && (
                            <Check className="w-5 h-5 text-violet-400" />
                          )}
                        </motion.button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mobile Next Button - Step 1 */}
            {mobileStep === 1 && (
              <div className="lg:hidden">
                <motion.button
                  type="button"
                  onClick={handleMobileNext}
                  disabled={!canProceedToStep2}
                  className={`w-full py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                    canProceedToStep2
                      ? 'bg-violet-500 hover:bg-violet-600 text-white'
                      : 'bg-white/5 text-zinc-500 cursor-not-allowed'
                  }`}
                  whileHover={canProceedToStep2 ? { scale: 1.02 } : {}}
                  whileTap={canProceedToStep2 ? { scale: 0.98 } : {}}
                >
                  Next: Choose Studio
                  <ChevronRight className="w-5 h-5" />
                </motion.button>
              </div>
            )}

            {/* Studio Selection Card - Step 2 on mobile */}
            <AnimatePresence mode="wait">
              {canFetchRates() && (
                <motion.div 
                  className={`glass rounded-2xl p-6 ${mobileStep !== 2 ? 'hidden lg:block' : ''}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Music className="w-5 h-5 text-violet-400" />
                    Select Studio
                  </h2>

                  {/* Loading State */}
                  {loadingRates && (
                    <div className="p-6 rounded-xl bg-white/5 flex items-center justify-center gap-3">
                      <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
                      <span className="text-zinc-400">Finding the best studio for you...</span>
                    </div>
                  )}

                  {/* Error State */}
                  {ratesError && !loadingRates && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-red-400" />
                      <span className="text-red-400">{ratesError}</span>
                    </div>
                  )}

                  {/* Studio Cards */}
                  {ratesData && !loadingRates && (
                    <>
                      {/* Suggestion Message */}
                      <div className="mb-4 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
                        <p className="text-violet-300 text-sm flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          {ratesData.explanation}
                        </p>
                      </div>

                      {/* Studio Error */}
                      {studioError && (
                        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                          <p className="text-red-400 text-sm flex items-start gap-2">
                            <X className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            {studioError}
                          </p>
                        </div>
                      )}

                      {/* Studio Cards Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                              className={`relative p-4 rounded-xl border text-left transition-all ${
                                isSelected
                                  ? 'bg-violet-500/20 border-violet-500 ring-2 ring-violet-500/50'
                                  : isAllowed
                                    ? 'bg-white/5 border-white/10 hover:border-violet-500/50 hover:bg-violet-500/10'
                                    : 'bg-zinc-900/50 border-zinc-800 opacity-50 cursor-not-allowed'
                              }`}
                              whileHover={isAllowed ? { scale: 1.02 } : {}}
                              whileTap={isAllowed ? { scale: 0.98 } : {}}
                            >
                              {/* Suggested Badge */}
                              {isSuggested && (
                                <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-violet-500 text-white text-xs font-medium rounded-full">
                                  Suggested
                                </div>
                              )}

                              {/* Not Available Badge */}
                              {!isAllowed && (
                                <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-zinc-700 text-zinc-400 text-xs font-medium rounded-full">
                                  Too Small
                                </div>
                              )}

                              <h3 className={`font-bold mb-1 ${isSelected ? 'text-white' : isAllowed ? 'text-zinc-300' : 'text-zinc-500'}`}>
                                {studioInfo.name}
                              </h3>
                              <p className={`text-xs mb-2 ${isAllowed ? 'text-zinc-500' : 'text-zinc-600'}`}>
                                {studioInfo.description}
                              </p>
                              
                              {studioRate && isAllowed && (
                                <p className={`text-lg font-bold ${isSelected ? 'text-amber-400' : 'text-amber-500/70'}`}>
                                  ₹{studioRate}/hr
                                </p>
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mobile Navigation Buttons - Step 2 */}
            {mobileStep === 2 && canFetchRates() && (
              <div className="lg:hidden flex gap-3">
                <motion.button
                  type="button"
                  onClick={handleMobileBack}
                  className="flex-1 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back
                </motion.button>
                <motion.button
                  type="button"
                  onClick={handleMobileNext}
                  disabled={!canProceedToStep3}
                  className={`flex-1 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                    canProceedToStep3
                      ? 'bg-violet-500 hover:bg-violet-600 text-white'
                      : 'bg-white/5 text-zinc-500 cursor-not-allowed'
                  }`}
                  whileHover={canProceedToStep3 ? { scale: 1.02 } : {}}
                  whileTap={canProceedToStep3 ? { scale: 0.98 } : {}}
                >
                  Next: Date & Time
                  <ChevronRight className="w-5 h-5" />
                </motion.button>
              </div>
            )}

            {/* Date & Time Card - Step 3 on mobile */}
            <AnimatePresence mode="wait">
              {studio && canFetchRates() && (
                <motion.div 
                  className={`glass rounded-2xl p-6 ${mobileStep !== 3 ? 'hidden lg:block' : ''}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-violet-400" />
                    Select Date & Time
                  </h2>

                  {/* Date Picker */}
                  <div className="mb-6">
                    <label htmlFor="date" className="block text-sm font-medium text-zinc-400 mb-2.5">
                      Date <span className="text-zinc-500 font-normal">(up to {bookingSettings.advanceBookingDays} days in advance)</span>
                    </label>
                    <input
                      type="date"
                      id="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      min={getMinDate()}
                      max={getMaxDate()}
                      className="input"
                    />
                  </div>

                  {/* Number of Hours */}
                  <div className="mb-6">
                    <label htmlFor="numberOfHours" className="block text-sm font-medium text-zinc-400 mb-2.5">
                      Number of Hours <span className="text-zinc-500 font-normal">({bookingSettings.minBookingDuration}-{bookingSettings.maxBookingDuration} hours)</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setNumberOfHours(prev => Math.max(bookingSettings.minBookingDuration, prev - 1))}
                        disabled={numberOfHours <= bookingSettings.minBookingDuration}
                        className={`w-12 h-12 rounded-xl border flex items-center justify-center text-xl font-bold transition-all ${
                          numberOfHours <= bookingSettings.minBookingDuration
                            ? 'bg-zinc-800/50 text-zinc-600 border-zinc-700 cursor-not-allowed'
                            : 'bg-white/5 text-white border-white/10 hover:border-violet-500 hover:bg-violet-500/20'
                        }`}
                      >
                        -
                      </button>
                      <div className="flex-1 text-center">
                        <span className="text-3xl font-bold text-white">{numberOfHours}</span>
                        <span className="text-zinc-400 ml-2">hour{numberOfHours > 1 ? 's' : ''}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNumberOfHours(prev => Math.min(bookingSettings.maxBookingDuration, prev + 1))}
                        disabled={numberOfHours >= bookingSettings.maxBookingDuration}
                        className={`w-12 h-12 rounded-xl border flex items-center justify-center text-xl font-bold transition-all ${
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
                    <label className="block text-sm font-medium text-zinc-400 mb-3">
                      Available Time Slots
                    </label>
                    
                    {loadingSlots && (
                      <div className="p-6 rounded-xl bg-white/5 flex items-center justify-center gap-3">
                        <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
                        <span className="text-zinc-400">Loading slots...</span>
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
                        <p className="text-amber-300 text-sm mb-4">
                          Unfortunately, there are no available time slots for {studio} on{' '}
                          {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}.
                        </p>
                        <p className="text-zinc-400 text-sm">
                          Try selecting a different date or studio to find available slots.
                        </p>
                      </div>
                    )}
                    
                    {!loadingSlots && !slotsError && availableSlots.length > 0 && (
                      <>
                        <div className="mb-4 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
                          <p className="text-violet-300 text-sm">
                            📍 Select your preferred {numberOfHours} hour{numberOfHours > 1 ? '' : ''} time slot.
                            {selectedSlots.length > 0 && (
                              <span className="block mt-1 text-violet-400 font-medium">
                                Selected: {formatTimeDisplay(selectedSlots[0].start)} - {formatTimeDisplay(selectedSlots[selectedSlots.length - 1].end)}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {availableSlots.map((slot, index) => {
                            // Only show slots that can be valid start times for the selected duration
                            const canSelect = canSelectAsStartTime(index);
                            if (!canSelect) return null;
                            
                            const isStart = isStartSlot(slot);
                            // Calculate the end time based on numberOfHours
                            const endSlot = availableSlots[index + numberOfHours - 1];
                            // Skip if end slot doesn't exist (shouldn't happen due to canSelect check, but safety first)
                            if (!endSlot) return null;
                            const endTime = endSlot.end;
                            
                            return (
                              <button
                                key={`${slot.start}-${endTime}`}
                                type="button"
                                onClick={() => handleSlotSelect(slot, index)}
                                className={`px-3 py-3 text-sm rounded-xl border transition-all font-medium ${
                                  isStart
                                    ? 'bg-violet-500 text-white border-violet-500 shadow-lg shadow-violet-500/25'
                                    : 'bg-zinc-800 text-white border-zinc-600 hover:border-violet-500 hover:bg-violet-500/20'
                                }`}
                              >
                                {formatTimeDisplay(slot.start)} - {formatTimeDisplay(endTime)}
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
            </AnimatePresence>

            {/* Mobile Back Button - Step 3 */}
            {mobileStep === 3 && studio && canFetchRates() && (
              <div className="lg:hidden">
                <motion.button
                  type="button"
                  onClick={handleMobileBack}
                  className="w-full py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back to Studio Selection
                </motion.button>
              </div>
            )}
          </div>

          {/* Right Column - Summary - Show on step 3 on mobile */}
          <motion.div 
            className={`lg:col-span-1 ${mobileStep !== 3 ? 'hidden lg:block' : ''}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div className="glass-strong rounded-2xl p-6 lg:sticky lg:top-24">
              <h2 className="text-lg font-semibold text-white mb-4">Booking Summary</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-zinc-400 text-sm">Session Type</span>
                  <span className="text-white font-medium text-right">{sessionType || '-'}</span>
                </div>
                
                {sessionType && sessionType !== 'Only Drum Practice' && (
                  <div className="flex justify-between items-start py-2 border-b border-white/10">
                    <span className="text-zinc-400 text-sm">Details</span>
                    <span className="text-white font-medium text-right max-w-[60%]">
                      {getSubOptionLabel() || '-'}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-zinc-400 text-sm">Studio</span>
                  <span className="text-white font-medium">{studio || '-'}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-zinc-400 text-sm">Date</span>
                  <span className="text-white font-medium">
                    {date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-zinc-400 text-sm">Time</span>
                  <span className="text-white font-medium">
                    {selectedSlot ? `${formatTimeDisplay(selectedSlot.start)} - ${formatTimeDisplay(selectedSlot.end)}` : '-'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-zinc-400 text-sm">Duration</span>
                  <span className="text-white font-medium">
                    {selectedSlots.length > 0 ? `${selectedSlots.length} hour(s)` : '-'}
                  </span>
                </div>
                
                {ratesData && ratesData.suggested_rate !== undefined && (
                  <motion.div 
                    className="flex justify-between items-center py-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <span className="text-zinc-400 text-sm">Rate</span>
                    <span className="text-amber-400 font-bold text-lg">
                      ₹{ratesData.suggested_rate.toLocaleString('en-IN')}
                      {sessionType === 'Recording' && recordingOption !== 'sd_card_recording' ? '/song' : '/hr'}
                    </span>
                  </motion.div>
                )}

                {/* Estimated Total */}
                {ratesData && ratesData.suggested_rate !== undefined && selectedSlots.length > 0 && sessionType !== 'Recording' && (
                  <motion.div 
                    className="flex justify-between items-center py-3 bg-violet-500/10 rounded-xl px-3 -mx-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <span className="text-violet-300 text-sm font-medium">Estimated Total</span>
                    <span className="text-white font-bold text-xl">
                      ₹{(ratesData.suggested_rate * selectedSlots.length).toLocaleString('en-IN')}
                    </span>
                  </motion.div>
                )}
              </div>

              {/* Duration validation message */}
              {selectedSlots.length > 0 && selectedSlots.length < bookingSettings.minBookingDuration && (
                <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <p className="text-amber-400 text-sm">
                    ⚠️ Minimum booking is {bookingSettings.minBookingDuration} hour(s). 
                    Please select {bookingSettings.minBookingDuration - selectedSlots.length} more slot(s).
                  </p>
                </div>
              )}

              <motion.button
                type="button"
                onClick={handleReviewBooking}
                disabled={!selectedSlot || !sessionType || !studio || !date || selectedSlots.length < bookingSettings.minBookingDuration}
                className={`w-full py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                  selectedSlot && sessionType && studio && date && selectedSlots.length >= bookingSettings.minBookingDuration
                    ? 'btn-accent'
                    : 'bg-white/5 text-zinc-500 cursor-not-allowed'
                }`}
                whileHover={selectedSlot && sessionType && studio && date && selectedSlots.length >= bookingSettings.minBookingDuration ? { scale: 1.02 } : {}}
                whileTap={selectedSlot && sessionType && studio && date && selectedSlots.length >= bookingSettings.minBookingDuration ? { scale: 0.98 } : {}}
              >
                Review Booking
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
