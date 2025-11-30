'use client';

import { useState, useEffect, useCallback } from 'react';
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

  // Calculate min/max dates
  const getMinDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    return maxDate.toISOString().split('T')[0];
  };

  // Check if slot is the original slot in edit mode
  const isOriginalSlot = (slot: TimeSlot) => {
    if (!draft.isEditMode || !draft.originalChoices) return false;
    return date === draft.originalChoices.date && 
           slot.start === draft.originalChoices.start_time;
  };

  // Check if the current date is the original date in edit mode
  const isOriginalDate = () => {
    if (!draft.isEditMode || !draft.originalChoices) return false;
    return date === draft.originalChoices.date;
  };

  // Fetch available slots when date or studio changes
  const fetchSlots = useCallback(async () => {
    if (!date || !draft.studio) return;

    setLoading(true);
    setError('');
    setSlots([]);
    setSelectedSlots([]);

    try {
      // In edit mode, exclude the current booking from availability check
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
      
      // Update booking settings from API response
      if (data.settings) {
        setMinBookingDuration(data.settings.minBookingDuration || 1);
        setMaxBookingDuration(data.settings.maxBookingDuration || 8);
      }
    } catch (err) {
      setError('Failed to load available time slots. Please try again.');
      console.error('Error fetching slots:', err);
    } finally {
      setLoading(false);
    }
  }, [date, draft.studio, duration, draft.isEditMode, draft.originalBookingId]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  // Initialize selected slots from draft when in edit mode
  useEffect(() => {
    if (draft.selectedSlot && slots.length > 0) {
      // Find and set the selected slots from draft
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

  // Handle slot selection
  const handleSlotClick = (slot: AvailableSlot) => {
    if (!slot.available) return;

    // For single hour bookings, just select/deselect
    if (duration === 1) {
      if (selectedSlots.length === 1 && selectedSlots[0].start === slot.start) {
        setSelectedSlots([]);
        updateDraft({ selectedSlot: null });
      } else {
        setSelectedSlots([slot]);
        updateDraft({ selectedSlot: { start: slot.start, end: slot.end } });
      }
      return;
    }

    // For multi-hour bookings, select consecutive slots
    const slotIndex = slots.findIndex(s => s.start === slot.start);
    const slotsNeeded = duration;
    const consecutiveSlots: TimeSlot[] = [];

    for (let i = 0; i < slotsNeeded; i++) {
      const currentSlot = slots[slotIndex + i];
      if (!currentSlot || !currentSlot.available) {
        setError(`Cannot book ${duration} consecutive hours starting from this time.`);
        return;
      }
      consecutiveSlots.push({ start: currentSlot.start, end: currentSlot.end });
    }

    setError('');
    setSelectedSlots(consecutiveSlots);
    updateDraft({
      selectedSlot: {
        start: consecutiveSlots[0].start,
        end: consecutiveSlots[consecutiveSlots.length - 1].end,
      },
      duration,
    });
  };

  // Handle duration change
  const handleDurationChange = (newDuration: number) => {
    setDuration(newDuration);
    updateDraft({ duration: newDuration });
    setSelectedSlots([]);
    updateDraft({ selectedSlot: null });
  };

  const handleNext = () => {
    if (date && draft.selectedSlot) {
      nextStep();
    }
  };

  // Check if a slot is selected
  const isSlotSelected = (slot: TimeSlot) => {
    return selectedSlots.some(s => s.start === slot.start);
  };

  // Format time for display (e.g., "8am", "12pm")
  const formatTime = (time: string) => {
    const [hours] = time.split(':').map(Number);
    const period = hours >= 12 ? 'pm' : 'am';
    const displayHours = hours % 12 || 12;
    return `${displayHours}${period}`;
  };

  // Format time slot for display (e.g., "8am - 9am")
  const formatTimeSlot = (start: string, end: string) => {
    return `${formatTime(start)} - ${formatTime(end)}`;
  };

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
        
        {/* Date selector */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateDate(-1)}
            disabled={date === getMinDate()}
            className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex-1 relative">
            <input
              type="date"
              value={date}
              min={getMinDate()}
              max={getMaxDate()}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full bg-zinc-800 border-2 border-zinc-500 rounded-xl px-4 py-3 text-white text-center appearance-none focus:outline-none focus:border-violet-500 cursor-pointer [color-scheme:dark]"
            />
            {date && (
              <div 
                className="absolute inset-0 flex items-center justify-center bg-zinc-800 border-2 border-zinc-500 rounded-xl cursor-pointer"
                onClick={() => {
                  const input = document.querySelector('input[type="date"]') as HTMLInputElement;
                  input?.showPicker();
                }}
              >
                <Calendar className="w-4 h-4 mr-2 text-violet-400" />
                <span className="text-white font-medium">{formatDate(date)}</span>
              </div>
            )}
          </div>
          
          <button
            onClick={() => navigateDate(1)}
            disabled={date === getMaxDate()}
            className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Duration selector */}
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-zinc-400" />
          <span className="text-sm text-zinc-400">Duration:</span>
          <div className="flex gap-1 flex-wrap">
            {Array.from(
              { length: maxBookingDuration - minBookingDuration + 1 }, 
              (_, i) => i + minBookingDuration
            ).map((hrs) => (
              <button
                key={hrs}
                onClick={() => handleDurationChange(hrs)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  duration === hrs
                    ? 'bg-violet-500 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {hrs}h
              </button>
            ))}
          </div>
        </div>

        {/* Time slots grid */}
        <div className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
              <span className="ml-2 text-zinc-400">Loading slots...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center gap-2 py-8 text-amber-400">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          ) : !date ? (
            <div className="text-center py-8 text-zinc-400">
              Select a date to see available time slots
            </div>
          ) : slots.length === 0 ? (
            <div className="text-center py-8 text-zinc-400">
              No slots available for this date
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {slots.map((slot) => {
                const isOriginal = isOriginalSlot(slot);
                const isSelected = isSlotSelected(slot);
                
                return (
                  <button
                    key={slot.start}
                    onClick={() => handleSlotClick(slot)}
                    disabled={!slot.available}
                    className={`relative p-2 rounded-lg text-sm font-medium transition-all ${
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
          )}
        </div>

        {/* Selected time display */}
        {draft.selectedSlot && (
          <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
            <div className="flex items-center justify-between">
              <span className="text-sm text-violet-400">Selected time</span>
              <span className="text-white font-medium">
                {formatTimeSlot(draft.selectedSlot.start, draft.selectedSlot.end)}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm text-zinc-400">Duration</span>
              <span className="text-zinc-300">{duration} hour{duration > 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm text-zinc-400">Estimated total</span>
              <span className="text-violet-400 font-semibold">₹{draft.ratePerHour * duration}</span>
            </div>
          </div>
        )}
      </div>
    </StepLayout>
  );
}
