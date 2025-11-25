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
  Radio,
  Video
} from 'lucide-react';

interface TimeSlot {
  start: string;
  end: string;
}

interface RatesResponse {
  suggested_studio: string;
  suggested_rate: number;
  allowed_studios: string[];
  explanation: string;
}

interface BookingSettings {
  minBookingDuration: number;
  maxBookingDuration: number;
  bookingBuffer: number;
  advanceBookingDays: number;
  defaultOpenTime: string;
  defaultCloseTime: string;
}

const SESSION_TYPES = [
  { name: 'Recording', icon: <Mic className="w-5 h-5" /> },
  { name: 'Mixing', icon: <Music className="w-5 h-5" /> },
  { name: 'Podcast', icon: <Radio className="w-5 h-5" /> },
  { name: 'Voice Over', icon: <Video className="w-5 h-5" /> },
];

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

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

  // Form state
  const [sessionType, setSessionType] = useState<string>('');
  const [groupSize, setGroupSize] = useState<number>(1);
  const [studio, setStudio] = useState<string>('');
  const [date, setDate] = useState<string>('');
  // Selected slots for multi-hour booking
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>([]);

  // Calculated combined slot from selected slots
  const selectedSlot = selectedSlots.length > 0 ? {
    start: selectedSlots[0].start,
    end: selectedSlots[selectedSlots.length - 1].end
  } : null;
  
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

  // Fetch booking settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          setBookingSettings(data);
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
      setStudio(urlStudio);
    }
    if (urlTime) {
      setPrefilledTime(urlTime);
    }
  }, [searchParams]);

  // Fetch rates when sessionType or groupSize changes
  useEffect(() => {
    if (!sessionType || groupSize < 1) {
      setRatesData(null);
      // Don't clear studio if it was pre-filled from URL
      if (!searchParams.get('studio')) {
        setStudio('');
      }
      return;
    }

    const fetchRates = async () => {
      setLoadingRates(true);
      setRatesError('');
      try {
        const response = await fetch(
          `/api/rates?sessionType=${encodeURIComponent(sessionType)}&groupSize=${groupSize}`
        );
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to fetch rates');
        }
        const data: RatesResponse = await response.json();
        setRatesData(data);
        // Only set suggested studio if no studio was pre-filled from URL
        if (!studio) {
          setStudio(data.suggested_studio);
        }
      } catch (err) {
        setRatesError(err instanceof Error ? err.message : 'Failed to fetch rates');
        setRatesData(null);
        // Don't clear studio if it was pre-filled from URL
        if (!searchParams.get('studio')) {
          setStudio('');
        }
      } finally {
        setLoadingRates(false);
      }
    };

    fetchRates();
  }, [sessionType, groupSize, searchParams, studio]);

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
          const matchingSlot = data.find(slot => slot.start === prefilledTime);
          if (matchingSlot) {
            setSelectedSlots([matchingSlot]);
          }
          // Clear prefilled time after attempting to use it
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
  }, [studio, date, prefilledTime]);

  // Check if a slot is consecutive to currently selected slots
  const isSlotConsecutive = (slot: TimeSlot): boolean => {
    if (selectedSlots.length === 0) return true;
    
    const firstSlot = selectedSlots[0];
    const lastSlot = selectedSlots[selectedSlots.length - 1];
    
    // Check if this slot comes right before the first selected slot
    if (slot.end === firstSlot.start) return true;
    // Check if this slot comes right after the last selected slot
    if (slot.start === lastSlot.end) return true;
    
    return false;
  };

  // Check if selecting this slot would exceed max duration
  const wouldExceedMaxDuration = (slot: TimeSlot): boolean => {
    const currentDuration = selectedSlots.length;
    return currentDuration >= bookingSettings.maxBookingDuration;
  };

  // Check if a slot is currently selected
  const isSlotSelected = (slot: TimeSlot): boolean => {
    return selectedSlots.some(s => s.start === slot.start && s.end === slot.end);
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    // If slot is already selected, handle deselection
    if (isSlotSelected(slot)) {
      // Only allow deselecting if it's at the start or end of selection
      const slotIndex = selectedSlots.findIndex(s => s.start === slot.start);
      if (slotIndex === 0 || slotIndex === selectedSlots.length - 1) {
        setSelectedSlots(selectedSlots.filter(s => s.start !== slot.start));
      }
      return;
    }

    // If no slots selected, just select this one
    if (selectedSlots.length === 0) {
      setSelectedSlots([slot]);
      return;
    }

    // Check if this slot is consecutive and won't exceed max
    if (!isSlotConsecutive(slot)) {
      // Start a new selection
      setSelectedSlots([slot]);
      return;
    }

    if (wouldExceedMaxDuration(slot)) {
      return; // Don't allow selection
    }

    // Add to selection in correct order
    const firstSlot = selectedSlots[0];
    if (slot.end === firstSlot.start) {
      // Add at the beginning
      setSelectedSlots([slot, ...selectedSlots]);
    } else {
      // Add at the end
      setSelectedSlots([...selectedSlots, slot]);
    }
  };

  const handleReviewBooking = () => {
    if (!selectedSlot || selectedSlots.length === 0) return;
    
    // Validate minimum booking duration
    if (selectedSlots.length < bookingSettings.minBookingDuration) {
      setSlotsError(`Minimum booking duration is ${bookingSettings.minBookingDuration} hour(s). Please select more time slots.`);
      return;
    }
    
    // Store booking data in sessionStorage for review page
    const bookingData = {
      sessionType,
      groupSize,
      studio,
      date,
      start_time: selectedSlot.start,
      end_time: selectedSlot.end,
      rate: ratesData?.suggested_rate,
    };
    sessionStorage.setItem('bookingData', JSON.stringify(bookingData));
    router.push('/review');
  };

  // Check if studio was pre-filled from URL (allows direct booking from availability page)
  const hasPrefilledStudio = !!searchParams.get('studio');
  const isStudioDisabled = !hasPrefilledStudio && (ratesData?.suggested_studio === 'Studio A');
  const allStudios = ['Studio A', 'Studio B', 'Studio C'];

  const steps = [
    { number: 1, label: 'Session Details', active: true },
    { number: 2, label: 'Choose Time', active: sessionType && studio },
    { number: 3, label: 'Review & Confirm', active: selectedSlot },
  ];

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
            Select your preferences and find the perfect time slot
          </p>
        </motion.div>

        {/* Progress Steps */}
        <motion.div 
          className="flex items-center justify-between mb-10 glass rounded-2xl p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className="flex items-center gap-3">
                <motion.div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    step.active 
                      ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white' 
                      : 'bg-white/5 text-zinc-500'
                  }`}
                  animate={step.active ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  {step.active && index === steps.findIndex(s => s.active && !steps[steps.indexOf(s) + 1]?.active) ? (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500 }}
                    >
                      {step.number}
                    </motion.span>
                  ) : (
                    step.number
                  )}
                </motion.div>
                <span className={`hidden sm:block text-sm font-medium ${
                  step.active ? 'text-white' : 'text-zinc-500'
                }`}>
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-12 sm:w-24 h-0.5 mx-4 rounded transition-colors duration-300 ${
                  steps[index + 1].active ? 'bg-violet-500' : 'bg-white/10'
                }`} />
              )}
            </div>
          ))}
        </motion.div>

        {/* Booking Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Session Type Card */}
            <motion.div 
              className="glass rounded-2xl p-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Mic className="w-5 h-5 text-violet-400" />
                Session Type
              </h2>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {SESSION_TYPES.map((type) => (
                  <motion.button
                    key={type.name}
                    type="button"
                    onClick={() => setSessionType(type.name)}
                    className={`p-4 rounded-xl border text-sm font-medium transition-all flex flex-col items-center gap-2 ${
                      sessionType === type.name
                        ? 'bg-violet-500/20 border-violet-500 text-white'
                        : 'bg-white/5 border-white/10 text-zinc-400 hover:border-white/20 hover:text-white'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className={sessionType === type.name ? 'text-violet-400' : 'text-zinc-500'}>
                      {type.icon}
                    </span>
                    {type.name}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Group Size & Studio Card */}
            <motion.div 
              className="glass rounded-2xl p-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-violet-400" />
                Group Size & Studio
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Group Size */}
                <div>
                  <label htmlFor="groupSize" className="block text-sm font-medium text-zinc-400 mb-2.5">
                    Number of People
                  </label>
                  <input
                    type="number"
                    id="groupSize"
                    min={1}
                    max={15}
                    value={groupSize}
                    onChange={(e) => setGroupSize(parseInt(e.target.value) || 1)}
                    className="input"
                  />
                </div>

                {/* Studio */}
                <div>
                  <label htmlFor="studio" className="block text-sm font-medium text-zinc-400 mb-2.5">
                    Studio
                  </label>
                  <select
                    id="studio"
                    value={studio}
                    onChange={(e) => setStudio(e.target.value)}
                    disabled={isStudioDisabled && !hasPrefilledStudio}
                    className={`select ${isStudioDisabled && !hasPrefilledStudio ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <option value="">Select a studio</option>
                    {(hasPrefilledStudio ? allStudios : ratesData?.allowed_studios || allStudios).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Loading/Error/Info States */}
              <AnimatePresence mode="wait">
                {loadingRates && (
                  <motion.div 
                    className="mt-4 p-4 rounded-xl bg-white/5 flex items-center gap-3"
                    {...fadeInUp}
                  >
                    <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
                    <span className="text-zinc-400">Loading studio suggestions...</span>
                  </motion.div>
                )}
                {ratesError && (
                  <motion.div 
                    className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3"
                    {...fadeInUp}
                  >
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <span className="text-red-400">{ratesError}</span>
                  </motion.div>
                )}
                {ratesData && (
                  <motion.div 
                    className="mt-4 p-4 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center gap-3"
                    {...fadeInUp}
                  >
                    <CheckCircle2 className="w-5 h-5 text-violet-400" />
                    <p className="text-violet-300 text-sm">{ratesData.explanation}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Date & Time Card */}
            <motion.div 
              className="glass rounded-2xl p-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
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
                        📍 Select {bookingSettings.minBookingDuration === bookingSettings.maxBookingDuration 
                          ? `${bookingSettings.minBookingDuration} consecutive hour(s)`
                          : `${bookingSettings.minBookingDuration}-${bookingSettings.maxBookingDuration} consecutive hours`
                        }. Click consecutive slots to extend your booking.
                        {selectedSlots.length > 0 && (
                          <span className="block mt-1 text-violet-400 font-medium">
                            Selected: {selectedSlots.length} hour(s) 
                            {selectedSlots.length < bookingSettings.minBookingDuration && 
                              ` (need at least ${bookingSettings.minBookingDuration})`
                            }
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {availableSlots.map((slot) => {
                        // Format time for display (e.g., "08:00" -> "8:00 AM")
                        const formatTimeDisplay = (time: string) => {
                          const [hours, minutes] = time.split(':').map(Number);
                          const period = hours >= 12 ? 'PM' : 'AM';
                          const displayHours = hours % 12 || 12;
                          return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
                        };
                        
                        const selected = isSlotSelected(slot);
                        const consecutive = isSlotConsecutive(slot);
                        const maxReached = wouldExceedMaxDuration(slot);
                        const disabled = !selected && (selectedSlots.length > 0 && (!consecutive || maxReached));
                        
                        return (
                          <button
                            key={`${slot.start}-${slot.end}`}
                            type="button"
                            onClick={() => handleSlotSelect(slot)}
                            disabled={disabled}
                            className={`px-3 py-3 text-sm rounded-xl border transition-all font-medium ${
                              selected
                                ? 'bg-violet-500 text-white border-violet-500 shadow-lg shadow-violet-500/25'
                                : disabled
                                  ? 'bg-zinc-800/50 text-zinc-500 border-zinc-700 cursor-not-allowed opacity-50'
                                  : 'bg-zinc-800 text-white border-zinc-600 hover:border-violet-500 hover:bg-violet-500/20'
                            }`}
                          >
                            {formatTimeDisplay(slot.start)} - {formatTimeDisplay(slot.end)}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
                
                {!loadingSlots && !slotsError && (!studio || !date) && (
                  <div className="p-6 rounded-xl bg-white/5 text-center">
                    <Clock className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                    <p className="text-zinc-500">Select a studio and date to see available slots</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Right Column - Summary */}
          <motion.div 
            className="lg:col-span-1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div className="glass-strong rounded-2xl p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-white mb-4">Booking Summary</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-zinc-400 text-sm">Session Type</span>
                  <span className="text-white font-medium">{sessionType || '-'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-zinc-400 text-sm">Group Size</span>
                  <span className="text-white font-medium">{groupSize} {groupSize === 1 ? 'person' : 'people'}</span>
                </div>
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
                    {selectedSlot ? `${selectedSlot.start} - ${selectedSlot.end}` : '-'}
                  </span>
                </div>
                {ratesData && (
                  <motion.div 
                    className="flex justify-between items-center py-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <span className="text-zinc-400 text-sm">Rate</span>
                    <span className="text-amber-400 font-bold text-lg">₹{ratesData.suggested_rate.toLocaleString('en-IN')}/hr</span>
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
