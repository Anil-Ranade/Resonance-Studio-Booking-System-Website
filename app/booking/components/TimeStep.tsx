'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight, Loader2, AlertCircle, RotateCcw } from 'lucide-react';
import { useBooking, TimeSlot } from '../contexts/BookingContext';
import StepLayout from './StepLayout';

interface AvailableSlot extends TimeSlot {
  available: boolean;
}

export default function TimeStep() {
  const { draft, updateDraft, nextStep } = useBooking();
  const [date, setDate] = useState(draft.date || '');
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>([]);
  const [duration, setDuration] = useState(draft.duration || 1);
  const [maxBookingDuration, setMaxBookingDuration] = useState(8);
  const [minBookingDuration, setMinBookingDuration] = useState(1);
  const [advanceBookingDays, setAdvanceBookingDays] = useState(30);
  const [startTime, setStartTime] = useState(draft.selectedSlot?.start || '');
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

  // Calculate min/max dates
  const getMinDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + advanceBookingDays);
    return maxDate.toISOString().split('T')[0];
  };

  // Check if slot is the original slot in edit mode
  const isOriginalSlot = (slot: { start: string; end: string }) => {
    if (!draft.isEditMode || !draft.originalChoices) return false;
    return date === draft.originalChoices.date && 
           slot.start === draft.originalChoices.start_time &&
           slot.end === draft.originalChoices.end_time;
  };

  // Fetch available slots when date, studio, or duration changes
  const fetchSlots = useCallback(async () => {
    if (!date || !draft.studio) return;

    setLoading(true);
    setError('');
    setSlots([]);
    setSelectedSlots([]);

    try {
      let url = `/api/availability?date=${date}&studio=${encodeURIComponent(draft.studio)}&duration=${duration}`;
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
  }, [date, draft.studio, duration, draft.isEditMode, draft.originalBookingId]);

  useEffect(() => {
    if (date && startTime && duration) {
      fetchSlots();
    }
  }, [date, startTime, duration, fetchSlots]);

  // Initialize selected slots from draft when in edit mode
  useEffect(() => {
    if (draft.selectedSlot && slots.length > 0) {
      const startSlot = slots.find(s => s.start === draft.selectedSlot?.start);
      if (startSlot) {
        const slotsToSelect: TimeSlot[] = [];
        for (let i = 0; i < duration; i++) {
          const slotIndex = slots.findIndex(s => s.start === draft.selectedSlot?.start);
          if (slotIndex >= 0 && slots[slotIndex + i]) {
            slotsToSelect.push({ start: slots[slotIndex + i].start, end: slots[slotIndex + i].end });
          }
        }
        if (slotsToSelect.length > 0) {
          setSelectedSlots(slotsToSelect);
        }
      }
    }
  }, [slots, draft.selectedSlot, duration]);

  // Handle date change
  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    setStartTime('');
    updateDraft({ date: newDate, selectedSlot: null });
    setSelectedSlots([]);
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

  // Handle slot selection
  const handleSlotClick = (slot: AvailableSlot) => {
    if (!slot.available) return;

    if (draft.selectedSlot && draft.selectedSlot.start === slot.start) {
      setSelectedSlots([]);
      updateDraft({ selectedSlot: null });
      return;
    }

    setSelectedSlots([slot]);
    setError('');
    updateDraft({
      selectedSlot: {
        start: slot.start,
        end: slot.end,
      },
      duration,
    });
  };

  // Handle duration change
  const handleDurationChange = (newDuration: number) => {
    setDuration(newDuration);
    updateDraft({ duration: newDuration, selectedSlot: null });
    setSelectedSlots([]);
  };

  // Handle start time selection
  const handleStartTimeChange = (time: string) => {
    setStartTime(time);
    updateDraft({ selectedSlot: null });
    setSelectedSlots([]);
  };

  const handleNext = () => {
    if (date && draft.selectedSlot) {
      nextStep();
    }
  };

  // Format time for display in 24-hour format (e.g., "08:00", "14:00")
  const formatTime = (time: string) => {
    return time.slice(0, 5);
  };

  // Format time slot for display (e.g., "08:00 - 09:00")
  // Format time slot for display (e.g., "08:00 - 09:00")
  const formatTimeSlot = (start: string, end: string) => {
    return `${formatTime(start)} - ${formatTime(end)}`;
  };

  // Generate available start times from slots
  const getAvailableStartTimes = () => {
    if (slots.length === 0) return [];
    
    const startTimes: { time: string; available: boolean }[] = [];
    
    for (let i = 0; i <= slots.length - duration; i++) {
      const startSlot = slots[i];
      
      // Check if all consecutive slots for the duration are available
      let allAvailable = true;
      for (let j = 0; j < duration; j++) {
        if (!slots[i + j]?.available) {
          allAvailable = false;
          break;
        }
      }
      
      startTimes.push({
        time: startSlot.start,
        available: allAvailable,
      });
    }
    
    return startTimes;
  };

  // Generate display slots based on selected start time and duration
  const generateDisplaySlots = () => {
    if (slots.length === 0 || !startTime) return [];
    
    const displaySlots: { start: string; end: string; available: boolean; originalSlots: AvailableSlot[] }[] = [];
    const startIndex = slots.findIndex(s => s.start === startTime);
    
    if (startIndex === -1) return [];
    
    // Generate slots starting from the selected start time
    for (let i = startIndex; i <= slots.length - duration; i++) {
      const startSlot = slots[i];
      const endSlotIndex = i + duration - 1;
      const endSlot = slots[endSlotIndex];
      
      let allAvailable = true;
      const originalSlots: AvailableSlot[] = [];
      
      for (let j = 0; j < duration; j++) {
        const currentSlot = slots[i + j];
        originalSlots.push(currentSlot);
        if (!currentSlot.available) {
          allAvailable = false;
        }
      }
      
      displaySlots.push({
        start: startSlot.start,
        end: endSlot.end,
        available: allAvailable,
        originalSlots,
      });
    }
    
    return displaySlots;
  };

  const availableStartTimes = getAvailableStartTimes();
  const displaySlots = generateDisplaySlots();

  // Format date for display
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <StepLayout
      title={draft.isEditMode ? "Modify date & time" : "Select date & time"}
      subtitle={draft.isEditMode 
        ? "Your original slot is highlighted. Select to change or keep the same."
        : `Booking for ${draft.studio}`}
      onNext={handleNext}
      isNextDisabled={!date || !draft.selectedSlot}
    >
      <div className="space-y-4">
        {/* Edit Mode Banner */}
        {draft.isEditMode && draft.originalChoices && (
          <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-violet-400" />
            <span className="text-sm text-violet-400">
              Original: <span className="font-medium">{formatDate(draft.originalChoices.date)}</span> at{' '}
              <span className="font-medium">{formatTimeSlot(draft.originalChoices.start_time, draft.originalChoices.end_time)}</span>
            </span>
          </div>
        )}
        
        {/* Date selector - Click to select */}
        <div className="space-y-2">
          <label className="text-sm text-zinc-400 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Select Date
          </label>
          
          {!date ? (
            /* No date selected - show "Click here to select date" */
            <button
              onClick={openDatePicker}
              className="w-full p-4 rounded-xl border-2 border-dashed border-zinc-600 bg-zinc-800/50 hover:bg-zinc-800 hover:border-violet-500/50 transition-all text-center"
            >
              <div className="flex items-center justify-center gap-2 text-zinc-400">
                <Calendar className="w-5 h-5 text-violet-400" />
                <span className="text-base font-medium">Click here to select date</span>
              </div>
            </button>
          ) : (
            /* Date selected - show date with navigation arrows */
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateDate(-1)}
                disabled={date === getMinDate()}
                className="p-3 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <button
                onClick={openDatePicker}
                className="flex-1 p-4 rounded-xl bg-zinc-800 border-2 border-violet-500/50 hover:border-violet-500 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-center gap-2">
                  <Calendar className="w-5 h-5 text-violet-400" />
                  <span className="text-white font-semibold text-lg">{formatDate(date)}</span>
                </div>
              </button>
              
              <button
                onClick={() => navigateDate(1)}
                disabled={date === getMaxDate()}
                className="p-3 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
          
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

        {/* Duration selector - Only show after date is selected */}
        {date && (
          <div className="space-y-2">
            <label className="text-sm text-zinc-400 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Select Duration
            </label>
            <div className="flex gap-2 flex-wrap">
              {Array.from(
                { length: maxBookingDuration - minBookingDuration + 1 }, 
                (_, i) => i + minBookingDuration
              ).map((hrs) => (
                <button
                  key={hrs}
                  onClick={() => handleDurationChange(hrs)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    duration === hrs
                      ? 'bg-violet-500 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                  }`}
                >
                  {hrs} hour{hrs > 1 ? 's' : ''}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Start Time selector - Only show after date and duration are selected */}
        {date && duration > 0 && (
          <div className="space-y-2">
            <label className="text-sm text-zinc-400 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Select Start Time
            </label>
            
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
                <span className="ml-2 text-sm text-zinc-400">Loading times...</span>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center gap-2 py-4 text-amber-400">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">{error}</span>
              </div>
            ) : availableStartTimes.length === 0 ? (
              <div className="text-center py-4 text-zinc-500 text-sm">
                No available start times for {duration}-hour booking
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {availableStartTimes.map((timeOption) => (
                  <button
                    key={timeOption.time}
                    onClick={() => timeOption.available && handleStartTimeChange(timeOption.time)}
                    disabled={!timeOption.available}
                    className={`p-2.5 rounded-xl text-sm font-medium transition-all ${
                      startTime === timeOption.time
                        ? 'bg-violet-500 text-white ring-2 ring-violet-400'
                        : timeOption.available
                          ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                          : 'bg-zinc-900 text-zinc-600 cursor-not-allowed line-through'
                    }`}
                  >
                    {formatTime(timeOption.time)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Time slots grid - Only show after start time is selected */}
        {date && startTime && displaySlots.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm text-zinc-400 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Confirm Your Slot
            </label>
            <div className="grid grid-cols-3 gap-2">
              {displaySlots.map((slot) => {
                const isOriginal = isOriginalSlot(slot);
                const isSelected = draft.selectedSlot?.start === slot.start && draft.selectedSlot?.end === slot.end;
                
                return (
                  <button
                    key={slot.start}
                    onClick={() => handleSlotClick(slot)}
                    disabled={!slot.available}
                    className={`relative p-3 rounded-xl text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-violet-500 text-white ring-2 ring-violet-400'
                        : isOriginal && slot.available
                          ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/50 hover:bg-amber-500/30'
                          : slot.available
                            ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                            : 'bg-zinc-900 text-zinc-600 cursor-not-allowed line-through'
                    }`}
                  >
                    {isOriginal && !isSelected && slot.available && (
                      <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-amber-500 rounded-full"></span>
                    )}
                    {formatTimeSlot(slot.start, slot.end)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected time display */}
        {draft.selectedSlot && (
          <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/30">
            <div className="flex items-center justify-between">
              <span className="text-sm text-violet-400">Selected time</span>
              <span className="text-white font-semibold text-lg">
                {formatTimeSlot(draft.selectedSlot.start, draft.selectedSlot.end)}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-zinc-400">Duration</span>
              <span className="text-zinc-300">{duration} hour{duration > 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-zinc-400">Estimated total</span>
              <span className="text-violet-400 font-bold text-lg">₹{draft.ratePerHour * duration}</span>
            </div>
          </div>
        )}
      </div>
    </StepLayout>
  );
}
