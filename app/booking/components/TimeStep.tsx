'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight, Loader2, AlertCircle, RotateCcw, Minus, Plus } from 'lucide-react';
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
    if (date && duration) {
      fetchSlots();
    }
  }, [date, duration, fetchSlots]);

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

  // Generate combined duration slots directly from available slots
  const generateDurationSlots = () => {
    if (slots.length === 0) return [];
    
    const durationSlots: { start: string; end: string; available: boolean }[] = [];
    
    for (let i = 0; i <= slots.length - duration; i++) {
      const startSlot = slots[i];
      const endSlotIndex = i + duration - 1;
      const endSlot = slots[endSlotIndex];
      
      // Check if all consecutive slots for the duration are available
      let allAvailable = true;
      for (let j = 0; j < duration; j++) {
        if (!slots[i + j]?.available) {
          allAvailable = false;
          break;
        }
      }
      
      durationSlots.push({
        start: startSlot.start,
        end: endSlot.end,
        available: allAvailable,
      });
    }
    
    return durationSlots;
  };

  const durationSlots = generateDurationSlots();

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
      <div className="space-y-3">
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
        
        {/* Date and Duration in a row */}
        <div className="flex gap-3">
          {/* Date selector */}
          <div className="flex-1 space-y-1">
            <label className="text-xs text-zinc-400 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Date
            </label>
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigateDate(-1)}
                disabled={!date || date === getMinDate()}
                className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <button
                onClick={openDatePicker}
                className="flex-1 p-2 rounded-lg bg-zinc-800 border border-violet-500/50 hover:border-violet-500 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-center gap-1">
                  <Calendar className="w-4 h-4 text-violet-400" />
                  <span className="text-white font-medium text-sm">
                    {date ? formatDate(date) : 'Select'}
                  </span>
                </div>
              </button>
              
              <button
                onClick={() => navigateDate(1)}
                disabled={!date || date === getMaxDate()}
                className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
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

          {/* Duration selector */}
          <div className="space-y-1">
            <label className="text-xs text-zinc-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Duration
            </label>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  if (duration > minBookingDuration) {
                    handleDurationChange(duration - 1);
                  }
                }}
                disabled={duration <= minBookingDuration}
                className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Minus className="w-4 h-4" />
              </button>
              <div className="px-3 py-2 rounded-lg bg-zinc-800 border border-violet-500/50 min-w-[60px] text-center">
                <span className="text-white font-medium text-sm">{duration} hr{duration > 1 ? 's' : ''}</span>
              </div>
              <button
                onClick={() => {
                  if (duration < maxBookingDuration) {
                    handleDurationChange(duration + 1);
                  }
                }}
                disabled={duration >= maxBookingDuration}
                className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Time slots */}
        {date && duration > 0 && (
          <div className="space-y-1">
            <label className="text-xs text-zinc-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Select Time Slot
            </label>
            
            {loading ? (
              <div className="flex items-center justify-center py-3">
                <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
                <span className="ml-2 text-xs text-zinc-400">Loading...</span>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center gap-2 py-3 text-amber-400">
                <AlertCircle className="w-4 h-4" />
                <span className="text-xs">{error}</span>
              </div>
            ) : durationSlots.length === 0 ? (
              <div className="text-center py-3 text-zinc-500 text-xs">
                No slots available for {duration}-hour booking
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1.5 max-h-[140px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                {durationSlots.map((slot) => {
                  const isOriginal = isOriginalSlot(slot);
                  const isSelected = draft.selectedSlot?.start === slot.start && draft.selectedSlot?.end === slot.end;
                  
                  return (
                    <button
                      key={slot.start}
                      onClick={() => handleSlotClick(slot as AvailableSlot)}
                      disabled={!slot.available}
                      className={`relative py-2 px-1 rounded-lg text-xs font-medium transition-all ${
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
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full"></span>
                      )}
                      {formatTimeSlot(slot.start, slot.end)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Selected time display - compact */}
        {draft.selectedSlot && (
          <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/30">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-violet-400">Selected: </span>
                <span className="text-white font-semibold">
                  {formatTimeSlot(draft.selectedSlot.start, draft.selectedSlot.end)}
                </span>
                <span className="text-zinc-400 text-xs ml-2">({duration}hr{duration > 1 ? 's' : ''})</span>
              </div>
              <span className="text-violet-400 font-bold">₹{draft.ratePerHour * duration}</span>
            </div>
          </div>
        )}
      </div>
    </StepLayout>
  );
}
