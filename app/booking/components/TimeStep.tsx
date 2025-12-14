'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight, Loader2, AlertCircle, RotateCcw } from 'lucide-react';
import { useBooking, TimeSlot } from '../contexts/BookingContext';
import StepLayout from './StepLayout';

interface AvailableSlot extends TimeSlot {
  available: boolean;
}

interface ContinuousSlab {
  start: string;
  end: string;
  startHour: number;
  endHour: number;
  duration: number;
  label: string;
}

// Helper to normalize time to HH:MM format (strips seconds if present)
const normalizeTime = (time: string): string => {
  const parts = time.split(':');
  return `${parts[0]}:${parts[1]}`;
};

export default function TimeStep() {
  const { draft, updateDraft, nextStep } = useBooking();
  
  // Get today's date as default
  const getTodayDate = () => new Date().toISOString().split('T')[0];
  
  const [date, setDate] = useState(draft.date || getTodayDate());
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSlab, setSelectedSlab] = useState<ContinuousSlab | null>(null);
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [minBookingDuration, setMinBookingDuration] = useState(1);
  const [maxBookingDuration, setMaxBookingDuration] = useState(8);
  const [advanceBookingDays, setAdvanceBookingDays] = useState(30);
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Fetch booking settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          setMinBookingDuration(data.minBookingDuration || 1);
          setMaxBookingDuration(data.maxBookingDuration || 8);
          setAdvanceBookingDays(data.advanceBookingDays || 30);
        }
      } catch (err) {
        console.error('Error fetching booking settings:', err);
      }
    };
    fetchSettings();
  }, []);

  // Set today's date in draft on mount if not already set
  useEffect(() => {
    if (!draft.date) {
      const today = getTodayDate();
      updateDraft({ date: today });
    }
  }, [draft.date, updateDraft]);

  // Calculate min/max dates
  const getMinDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + advanceBookingDays);
    return maxDate.toISOString().split('T')[0];
  };

  // Fetch available slots when date or studio changes
  const fetchSlots = useCallback(async () => {
    if (!date || !draft.studio) return;

    setLoading(true);
    setError('');
    setSlots([]);
    setSelectedSlab(null);
    setStartTime('');
    setEndTime('');

    try {
      let url = `/api/availability?date=${date}&studio=${encodeURIComponent(draft.studio)}&duration=1`;
      if (draft.isEditMode && draft.originalBookingId) {
        url += `&excludeBookingId=${draft.originalBookingId}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch availability');
      }

      const data = await response.json();
      setSlots(data.slots || []);
      
      if (data.settings) {
        setMinBookingDuration(data.settings.minBookingDuration || 1);
        setMaxBookingDuration(data.settings.maxBookingDuration || 8);
        if (data.settings.advanceBookingDays) {
          setAdvanceBookingDays(data.settings.advanceBookingDays);
        }
      }
    } catch (err) {
      setError('Failed to load available time slots. Please try again.');
      console.error('Error fetching slots:', err);
    } finally {
      setLoading(false);
    }
  }, [date, draft.studio, draft.isEditMode, draft.originalBookingId]);

  useEffect(() => {
    if (date) {
      fetchSlots();
    }
  }, [date, fetchSlots]);

  // Generate continuous slabs from available slots
  const getContinuousSlabs = useCallback((): ContinuousSlab[] => {
    if (slots.length === 0) return [];

    const availableSlots = slots.filter(s => s.available);
    if (availableSlots.length === 0) return [];

    const slabs: ContinuousSlab[] = [];
    let currentSlabStart: string | null = null;
    let currentSlabStartHour = 0;
    let previousEndHour = -1;

    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      const [startHour] = slot.start.split(':').map(Number);
      const [endHour] = slot.end.split(':').map(Number);

      if (slot.available) {
        if (currentSlabStart === null) {
          // Start a new slab
          currentSlabStart = normalizeTime(slot.start);
          currentSlabStartHour = startHour;
          previousEndHour = endHour;
        } else if (startHour === previousEndHour) {
          // Continue the slab
          previousEndHour = endHour;
        } else {
          // End current slab and start a new one
          const slabEndTime = `${previousEndHour.toString().padStart(2, '0')}:00`;
          const duration = previousEndHour - currentSlabStartHour;
          slabs.push({
            start: currentSlabStart,
            end: slabEndTime,
            startHour: currentSlabStartHour,
            endHour: previousEndHour,
            duration,
            label: `${formatTimeDisplay(currentSlabStart)} - ${formatTimeDisplay(slabEndTime)}`,
          });
          currentSlabStart = normalizeTime(slot.start);
          currentSlabStartHour = startHour;
          previousEndHour = endHour;
        }
      } else {
        // Slot not available, close any open slab
        if (currentSlabStart !== null) {
          const slabEndTime = `${previousEndHour.toString().padStart(2, '0')}:00`;
          const duration = previousEndHour - currentSlabStartHour;
          slabs.push({
            start: currentSlabStart,
            end: slabEndTime,
            startHour: currentSlabStartHour,
            endHour: previousEndHour,
            duration,
            label: `${formatTimeDisplay(currentSlabStart)} - ${formatTimeDisplay(slabEndTime)}`,
          });
          currentSlabStart = null;
        }
      }
    }

    // Close any remaining open slab
    if (currentSlabStart !== null) {
      const slabEndTime = `${previousEndHour.toString().padStart(2, '0')}:00`;
      const duration = previousEndHour - currentSlabStartHour;
      slabs.push({
        start: currentSlabStart,
        end: slabEndTime,
        startHour: currentSlabStartHour,
        endHour: previousEndHour,
        duration,
        label: `${formatTimeDisplay(currentSlabStart)} - ${formatTimeDisplay(slabEndTime)}`,
      });
    }

    // Filter slabs that can accommodate at least min booking duration
    return slabs.filter(slab => slab.duration >= minBookingDuration);
  }, [slots, minBookingDuration]);

  // Get available start times within a slab
  const getStartTimes = useCallback(() => {
    if (!selectedSlab) return [];
    
    const times: { time: string; label: string }[] = [];
    for (let hour = selectedSlab.startHour; hour < selectedSlab.endHour; hour++) {
      const timeStr = `${hour.toString().padStart(2, '0')}:00`;
      times.push({
        time: timeStr,
        label: formatTimeDisplay(timeStr),
      });
    }
    return times;
  }, [selectedSlab]);

  // Get available end times based on selected start time
  const getEndTimes = useCallback(() => {
    if (!selectedSlab || !startTime) return [];
    
    const [startHour] = startTime.split(':').map(Number);
    const times: { time: string; label: string; duration: number }[] = [];
    
    // End time must be at least minBookingDuration hours after start
    const minEndHour = startHour + minBookingDuration;
    // End time cannot exceed slab end or maxBookingDuration
    const maxEndHour = Math.min(selectedSlab.endHour, startHour + maxBookingDuration);
    
    for (let hour = minEndHour; hour <= maxEndHour; hour++) {
      const timeStr = `${hour.toString().padStart(2, '0')}:00`;
      const duration = hour - startHour;
      times.push({
        time: timeStr,
        label: formatTimeDisplay(timeStr),
        duration,
      });
    }
    return times;
  }, [selectedSlab, startTime, minBookingDuration, maxBookingDuration]);

  // Format time for display in 12-hour format
  const formatTimeDisplay = (time: string) => {
    const [hours] = time.split(':').map(Number);
    const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    const period = hours >= 12 ? 'PM' : 'AM';
    return `${displayHour}:00 ${period}`;
  };

  // Handle date change
  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    updateDraft({ date: newDate, selectedSlot: null });
    setSelectedSlab(null);
    setStartTime('');
    setEndTime('');
  };

  // Navigate dates
  const navigateDate = (days: number) => {
    const current = date ? new Date(date) : new Date();
    current.setDate(current.getDate() + days);
    
    const minDate = new Date(getMinDate());
    const maxDate = new Date(getMaxDate());
    
    if (current >= minDate && current <= maxDate) {
      handleDateChange(current.toISOString().split('T')[0]);
    }
  };

  // Open date picker
  const openDatePicker = () => {
    dateInputRef.current?.showPicker();
  };

  // Handle slab selection
  const handleSlabSelect = (slab: ContinuousSlab) => {
    setSelectedSlab(slab);
    setStartTime('');
    setEndTime('');
    updateDraft({ selectedSlot: null });
  };

  // Handle start time selection
  const handleStartTimeSelect = (time: string) => {
    setStartTime(time);
    setEndTime('');
    updateDraft({ selectedSlot: null });
  };

  // Handle end time selection
  const handleEndTimeSelect = (time: string, duration: number) => {
    setEndTime(time);
    updateDraft({
      selectedSlot: {
        start: startTime,
        end: time,
      },
      duration,
    });
  };

  const handleNext = () => {
    if (date && draft.selectedSlot) {
      nextStep();
    }
  };

  // Format time slot for display
  const formatTimeSlot = (start: string, end: string) => {
    return `${formatTimeDisplay(start)} - ${formatTimeDisplay(end)}`;
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const continuousSlabs = getContinuousSlabs();
  const startTimes = getStartTimes();
  const endTimes = getEndTimes();

  // Calculate duration and price
  const getDuration = () => {
    if (!startTime || !endTime) return 0;
    const [startHour] = startTime.split(':').map(Number);
    const [endHour] = endTime.split(':').map(Number);
    return endHour - startHour;
  };

  const duration = getDuration();

  return (
    <StepLayout
      title={draft.isEditMode ? "Modify date & time" : "Select date & time"}
      subtitle={draft.isEditMode 
        ? "Your original slot is highlighted. Select to change or keep the same."
        : `Booking for ${draft.studio}`}
      showNext={true}
      onNext={handleNext}
      isNextDisabled={!date || !draft.selectedSlot}
    >
      <div className="space-y-4">
        {/* Edit Mode Banner */}
        {draft.isEditMode && draft.originalChoices && (
          <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center gap-2">
            <RotateCcw className="w-3 h-3 text-violet-400" />
            <span className="text-xs text-violet-400">
              Original: <span className="font-medium">{formatDate(draft.originalChoices.date)}</span> at{' '}
              <span className="font-medium">{formatTimeSlot(draft.originalChoices.start_time, draft.originalChoices.end_time)}</span>
            </span>
          </div>
        )}
        
        {/* Date selector */}
        <div className="space-y-2">
          <label className="text-xs text-zinc-400 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Select Date
          </label>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateDate(-1)}
              disabled={!date || date === getMinDate()}
              className="p-2.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <button
              onClick={openDatePicker}
              className="flex-1 p-3 rounded-lg bg-zinc-800 border border-violet-500/50 hover:border-violet-500 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-center gap-2">
                <Calendar className="w-5 h-5 text-violet-400" />
                <span className="text-white font-medium">
                  {date ? formatDate(date) : 'Select Date'}
                </span>
              </div>
            </button>
            
            <button
              onClick={() => navigateDate(1)}
              disabled={!date || date === getMaxDate()}
              className="p-2.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          {/* Hidden date input */}
          <input
            ref={dateInputRef}
            type="date"
            value={date}
            min={getMinDate()}
            max={getMaxDate()}
            onChange={(e) => handleDateChange(e.target.value)}
            className="sr-only"
          />
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
            <span className="ml-2 text-sm text-zinc-400">Loading availability...</span>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="flex items-center justify-center gap-2 py-4 text-amber-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Available Time Slabs */}
        {date && !loading && !error && (
          <div className="space-y-2">
            <label className="text-xs text-zinc-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Available Time Slots
            </label>
            
            {continuousSlabs.length === 0 ? (
              <div className="text-center py-4 text-zinc-500 text-sm">
                No available slots for this date
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {continuousSlabs.map((slab, index) => {
                  const isSelected = selectedSlab?.start === slab.start && selectedSlab?.end === slab.end;
                  
                  return (
                    <button
                      key={index}
                      onClick={() => handleSlabSelect(slab)}
                      className={`px-4 py-2.5 rounded-xl transition-all text-sm font-medium ${
                        isSelected
                          ? 'bg-violet-500 text-white ring-2 ring-violet-400'
                          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                      }`}
                    >
                      {slab.label}
                      <span className="ml-1.5 text-xs opacity-70">({slab.duration}hr{slab.duration > 1 ? 's' : ''})</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Start Time Selection */}
        {selectedSlab && (
          <div className="space-y-2">
            <label className="text-xs text-zinc-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Start Time
            </label>
            
            <div className="flex flex-wrap gap-2">
              {startTimes.map((timeOption) => {
                const isSelected = startTime === timeOption.time;
                
                return (
                  <button
                    key={timeOption.time}
                    onClick={() => handleStartTimeSelect(timeOption.time)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-violet-500 text-white ring-2 ring-violet-400'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {timeOption.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* End Time Selection */}
        {startTime && (
          <div className="space-y-2">
            <label className="text-xs text-zinc-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              End Time
            </label>
            
            <div className="flex flex-wrap gap-2">
              {endTimes.map((timeOption) => {
                const isSelected = endTime === timeOption.time;
                
                return (
                  <button
                    key={timeOption.time}
                    onClick={() => handleEndTimeSelect(timeOption.time, timeOption.duration)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-violet-500 text-white ring-2 ring-violet-400'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {timeOption.label}
                    <span className="ml-1.5 text-xs opacity-70">({timeOption.duration}hr{timeOption.duration > 1 ? 's' : ''})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected time display summary */}
        {draft.selectedSlot && (
          <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/30">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-violet-400">Your booking: </span>
                <span className="text-white font-semibold">
                  {formatTimeSlot(draft.selectedSlot.start, draft.selectedSlot.end)}
                </span>
                <span className="text-zinc-400 text-xs ml-2">({duration}hr{duration > 1 ? 's' : ''})</span>
              </div>
              <span className="text-violet-400 font-bold text-lg">₹{(draft.ratePerHour * duration).toLocaleString('en-IN')}</span>
            </div>
          </div>
        )}
      </div>
    </StepLayout>
  );
}
