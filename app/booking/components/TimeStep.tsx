"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  RotateCcw,
  Building2,
  ArrowUp,
} from "lucide-react";
import { useBooking, TimeSlot, StudioName } from "../contexts/BookingContext";
import StepLayout from "./StepLayout";
import { getStudioRate } from "../utils/studioSuggestion";

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
  const parts = time.split(":");
  return `${parts[0]}:${parts[1]}`;
};

export default function TimeStep() {
  const { draft, updateDraft, nextStep } = useBooking();

  // Get today's date as default
  const getTodayDate = () => new Date().toISOString().split("T")[0];

  const [date, setDate] = useState(draft.date || getTodayDate());
  const [selectedStudio, setSelectedStudio] = useState<StudioName>(
    draft.studio as StudioName
  );
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedSlab, setSelectedSlab] = useState<ContinuousSlab | null>(null);
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [minBookingDuration, setMinBookingDuration] = useState(1);
  const [maxBookingDuration, setMaxBookingDuration] = useState(8);
  const [advanceBookingDays, setAdvanceBookingDays] = useState(30);
  const [studioAvailability, setStudioAvailability] = useState<
    Record<StudioName, number>
  >({} as Record<StudioName, number>);
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Fetch booking settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/settings");
        if (response.ok) {
          const data = await response.json();
          setMinBookingDuration(data.minBookingDuration || 1);
          setMaxBookingDuration(data.maxBookingDuration || 8);
          setAdvanceBookingDays(data.advanceBookingDays || 30);
        }
      } catch (err) {
        console.error("Error fetching booking settings:", err);
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
    return new Date().toISOString().split("T")[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + advanceBookingDays);
    return maxDate.toISOString().split("T")[0];
  };

  // Fetch available slots when date or studio changes
  const fetchSlots = useCallback(async () => {
    if (!date || !selectedStudio) return;

    setLoading(true);
    setError("");
    setSlots([]);
    setSelectedSlab(null);
    setStartTime("");
    setEndTime("");

    try {
      let url = `/api/availability?date=${date}&studio=${encodeURIComponent(
        selectedStudio
      )}&duration=1`;
      if (draft.isEditMode && draft.originalBookingId) {
        url += `&excludeBookingId=${draft.originalBookingId}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch availability");
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
      setError("Failed to load available time slots. Please try again.");
      console.error("Error fetching slots:", err);
    } finally {
      setLoading(false);
    }
  }, [date, selectedStudio, draft.isEditMode, draft.originalBookingId]);

  // Fetch availability summary for all allowed studios when date changes
  const fetchStudioAvailability = useCallback(async () => {
    if (!date || draft.allowedStudios.length === 0) return;

    const availability: Record<StudioName, number> = {} as Record<
      StudioName,
      number
    >;

    try {
      await Promise.all(
        draft.allowedStudios.map(async (studio) => {
          let url = `/api/availability?date=${date}&studio=${encodeURIComponent(
            studio
          )}&duration=1`;
          if (draft.isEditMode && draft.originalBookingId) {
            url += `&excludeBookingId=${draft.originalBookingId}`;
          }
          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();
            const availableCount = (data.slots || []).filter(
              (s: AvailableSlot) => s.available
            ).length;
            availability[studio] = availableCount;
          }
        })
      );
      setStudioAvailability(availability);
    } catch (err) {
      console.error("Error fetching studio availability:", err);
    }
  }, [date, draft.allowedStudios, draft.isEditMode, draft.originalBookingId]);

  useEffect(() => {
    if (date) {
      fetchSlots();
      fetchStudioAvailability();
    }
  }, [date, fetchSlots, fetchStudioAvailability]);

  // Helper to convert time string (HH:MM) to minutes from midnight
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  // Helper to convert minutes from midnight to time string (HH:MM)
  const minutesToTime = (minutes: number): string => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };

  // Format time for display in 12-hour format
  const formatTimeDisplay = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    const period = hours >= 12 ? "PM" : "AM";
    return `${displayHour}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  // Generate continuous slabs from available slots
  const getContinuousSlabs = useCallback((): ContinuousSlab[] => {
    if (slots.length === 0) return [];

    const availableSlots = slots.filter((s) => s.available);
    if (availableSlots.length === 0) return [];

    const slabs: ContinuousSlab[] = [];
    let currentSlabStart: string | null = null;
    let previousEndMinutes = -1;

    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      const startMinutes = timeToMinutes(slot.start);
      const endMinutes = timeToMinutes(slot.end);

      if (slot.available) {
        if (currentSlabStart === null) {
          // Start a new slab
          currentSlabStart = normalizeTime(slot.start);
          previousEndMinutes = endMinutes;
        } else if (startMinutes === previousEndMinutes) {
          // Continue the slab
          previousEndMinutes = endMinutes;
        } else {
          // End current slab and start a new one
          const slabEndTime = minutesToTime(previousEndMinutes);
          const currentSlabStartMinutes = timeToMinutes(currentSlabStart);
          const duration = (previousEndMinutes - currentSlabStartMinutes) / 60;
          
          slabs.push({
            start: currentSlabStart,
            end: slabEndTime,
            startHour: currentSlabStartMinutes / 60, // Keep for backward compat if needed, but duration is better
            endHour: previousEndMinutes / 60,
            duration,
            label: `${formatTimeDisplay(
              currentSlabStart
            )} - ${formatTimeDisplay(slabEndTime)}`,
          });
          currentSlabStart = normalizeTime(slot.start);
          previousEndMinutes = endMinutes;
        }
      } else {
        // Slot not available, close any open slab
        if (currentSlabStart !== null) {
          const slabEndTime = minutesToTime(previousEndMinutes);
          const currentSlabStartMinutes = timeToMinutes(currentSlabStart);
          const duration = (previousEndMinutes - currentSlabStartMinutes) / 60;

          slabs.push({
            start: currentSlabStart,
            end: slabEndTime,
            startHour: currentSlabStartMinutes / 60,
            endHour: previousEndMinutes / 60,
            duration,
            label: `${formatTimeDisplay(
              currentSlabStart
            )} - ${formatTimeDisplay(slabEndTime)}`,
          });
          currentSlabStart = null;
        }
      }
    }

    // Close any remaining open slab
    if (currentSlabStart !== null) {
      const slabEndTime = minutesToTime(previousEndMinutes);
      const currentSlabStartMinutes = timeToMinutes(currentSlabStart);
      const duration = (previousEndMinutes - currentSlabStartMinutes) / 60;
      
      slabs.push({
        start: currentSlabStart,
        end: slabEndTime,
        startHour: currentSlabStartMinutes / 60,
        endHour: previousEndMinutes / 60,
        duration,
        label: `${formatTimeDisplay(currentSlabStart)} - ${formatTimeDisplay(
          slabEndTime
        )}`,
      });
    }

    // Filter slabs that can accommodate at least min booking duration
    return slabs.filter((slab) => slab.duration >= minBookingDuration);
  }, [slots, minBookingDuration]);

  // Get available start times within a slab
  const getStartTimes = useCallback(() => {
    if (!selectedSlab) return [];

    const times: { time: string; label: string }[] = [];
    const slabStartMinutes = timeToMinutes(selectedSlab.start);
    const slabEndMinutes = timeToMinutes(selectedSlab.end);

    // Increment by 30 minutes
    for (
      let m = slabStartMinutes;
      m < slabEndMinutes;
      m += 30
    ) {
      const remainingDuration = (slabEndMinutes - m) / 60;
      if (remainingDuration < minBookingDuration) break;

      const timeStr = minutesToTime(m);
      times.push({
        time: timeStr,
        label: formatTimeDisplay(timeStr),
      });
    }
    return times;
  }, [selectedSlab, minBookingDuration]);

  // Get available end times based on selected start time
  const getEndTimes = useCallback(() => {
    if (!selectedSlab || !startTime) return [];

    const startMinutes = timeToMinutes(startTime);
    const slabEndMinutes = timeToMinutes(selectedSlab.end);
    
    const times: { time: string; label: string; duration: number }[] = [];

    // Valid end times must be:
    // 1. At least minBookingDuration after start
    // 2. At most maxBookingDuration after start
    // 3. Not after slab end
    // 4. In 30 min increments

    const minEndMinutes = startMinutes + (minBookingDuration * 60);
    const maxEndMinutes = Math.min(
      slabEndMinutes,
      startMinutes + (maxBookingDuration * 60)
    );

    for (let m = minEndMinutes; m <= maxEndMinutes; m += 30) {
      const timeStr = minutesToTime(m);
      const duration = (m - startMinutes) / 60;
      
      times.push({
        time: timeStr,
        label: formatTimeDisplay(timeStr),
        duration,
      });
    }
    return times;
  }, [selectedSlab, startTime, minBookingDuration, maxBookingDuration]);

  // Handle date change
  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    updateDraft({ date: newDate, selectedSlot: null });
    setSelectedSlab(null);
    setStartTime("");
    setEndTime("");
  };

  // Handle studio change
  const handleStudioChange = (studio: StudioName) => {
    if (!draft.allowedStudios.includes(studio)) return;

    setSelectedStudio(studio);
    setSelectedSlab(null);
    setStartTime("");
    setEndTime("");

    // Calculate new rate for the selected studio
    const newRate = getStudioRate(studio, draft.sessionType as any, {
      karaokeOption: draft.karaokeOption as any,
      liveOption: draft.liveOption as any,
      bandEquipment: draft.bandEquipment,
      recordingOption: draft.recordingOption,
    });

    updateDraft({
      studio,
      ratePerHour: newRate,
      selectedSlot: null,
    });
  };

  // Check if a studio is an upgrade from the recommended studio
  const isUpgrade = (studio: StudioName): boolean => {
    const studioOrder: StudioName[] = ["Studio C", "Studio B", "Studio A"];
    const recommendedIndex = studioOrder.indexOf(
      draft.recommendedStudio as StudioName
    );
    const studioIndex = studioOrder.indexOf(studio);
    return studioIndex > recommendedIndex;
  };

  // Get rate for a studio
  const getStudioRateForDisplay = (studio: StudioName): number => {
    return getStudioRate(studio, draft.sessionType as any, {
      karaokeOption: draft.karaokeOption as any,
      liveOption: draft.liveOption as any,
      bandEquipment: draft.bandEquipment,
      recordingOption: draft.recordingOption,
    });
  };

  // Navigate dates
  const navigateDate = (days: number) => {
    const current = date ? new Date(date) : new Date();
    current.setDate(current.getDate() + days);

    const minDate = new Date(getMinDate());
    const maxDate = new Date(getMaxDate());

    if (current >= minDate && current <= maxDate) {
      handleDateChange(current.toISOString().split("T")[0]);
    }
  };

  // Open date picker
  const openDatePicker = () => {
    dateInputRef.current?.showPicker();
  };

  // Handle slab selection
  const handleSlabSelect = (slab: ContinuousSlab) => {
    setSelectedSlab(slab);
    setStartTime("");
    setEndTime("");
    updateDraft({ selectedSlot: null });
  };

  // Handle start time selection
  // Handle start time selection
  const handleStartTimeSelect = (time: string) => {
    if (startTime === time) {
      setStartTime("");
      setEndTime("");
      updateDraft({ selectedSlot: null });
    } else {
      setStartTime(time);
      setEndTime("");
      updateDraft({ selectedSlot: null });
    }
  };

  // Handle end time selection
  // Handle end time selection
  const handleEndTimeSelect = (time: string, duration: number) => {
    if (endTime === time) {
      setEndTime("");
      updateDraft({ selectedSlot: null });
    } else {
      setEndTime(time);
      updateDraft({
        selectedSlot: {
          start: startTime,
          end: time,
        },
        duration,
      });
    }
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
    return new Date(dateStr).toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const continuousSlabs = getContinuousSlabs();
  const startTimes = getStartTimes();
  const endTimes = getEndTimes();

  // Calculate duration and price
  // Calculate duration and price
  const getDuration = () => {
    if (!startTime || !endTime) return 0;
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    return (endMinutes - startMinutes) / 60;
  };

  const duration = getDuration();

  return (
    <StepLayout
      title={draft.isEditMode ? "Modify date & time" : "Select date & time"}
      subtitle={
        draft.isEditMode
          ? "Your original slot is highlighted. Select to change or keep the same."
          : `Booking for ${selectedStudio}`
      }
      showNext={true}
      onNext={handleNext}
      isNextDisabled={!date || !draft.selectedSlot}
    >
      <div className="space-y-3">
        {/* Edit Mode Banner */}
        {draft.isEditMode && draft.originalChoices && (
          <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center gap-2">
            <RotateCcw className="w-3 h-3 text-violet-400" />
            <span className="text-xs text-violet-400">
              Original:{" "}
              <span className="font-medium">
                {formatDate(draft.originalChoices.date)}
              </span>{" "}
              at{" "}
              <span className="font-medium">
                {formatTimeSlot(
                  draft.originalChoices.start_time,
                  draft.originalChoices.end_time
                )}
              </span>
            </span>
          </div>
        )}

        {/* Guidance Message */}
        {!draft.isEditMode && (
          <div className="space-y-3 mb-2">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-300">
                <p className="font-medium mb-1">How to select your time:</p>
                <ol className="list-decimal list-inside space-y-0.5 text-blue-300/90">
                  <li>Select an available time slot</li>
                  <li>Choose your preferred start time</li>
                  <li>Choose your preferred end time</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* Date selector */}
        <div className="space-y-1">
          <label className="text-[10px] text-zinc-400 flex items-center gap-1 uppercase tracking-wider font-semibold">
            <Calendar className="w-3 h-3" />
            Select Date
          </label>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateDate(-1)}
              disabled={!date || date === getMinDate()}
              className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={openDatePicker}
              className="flex-1 py-2 px-3 rounded-lg bg-zinc-800 border border-violet-500/50 hover:border-violet-500 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-white font-medium text-sm">
                  {date ? formatDate(date) : "Select Date"}
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

        {/* Studio Selector - Only show if multiple studios are allowed */}
        {draft.allowedStudios.length > 1 && (
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-400 flex items-center gap-1 uppercase tracking-wider font-semibold">
              <Building2 className="w-3 h-3" />
              Studio
            </label>

            <div className="flex flex-wrap gap-1.5">
              {draft.allowedStudios.map((studio) => {
                const isSelected = selectedStudio === studio;
                const isRecommended = studio === draft.recommendedStudio;
                const availableSlots = studioAvailability[studio] ?? 0;
                const hasNoSlots = !!date && studioAvailability[studio] === 0;
                const rate = getStudioRateForDisplay(studio);
                const showUpgrade = isUpgrade(studio);

                return (
                  <button
                    key={studio}
                    onClick={() => handleStudioChange(studio)}
                    disabled={hasNoSlots}
                    className={`px-2.5 py-1.5 rounded-lg transition-all text-xs font-medium flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-violet-500 text-white ring-1 ring-violet-400"
                        : hasNoSlots
                        ? "bg-zinc-900 text-zinc-600 cursor-not-allowed opacity-60"
                        : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                    }`}
                  >
                    <span>{studio.replace("Studio ", "")}</span>
                    <span className="opacity-70">₹{rate}/hr</span>
                    {showUpgrade && !isSelected && (
                      <span className="flex items-center gap-0.5 text-emerald-400">
                        <ArrowUp className="w-2.5 h-2.5" />
                      </span>
                    )}
                    {date && (
                      <span
                        className={`text-[10px] ${
                          hasNoSlots ? "text-red-400" : "text-emerald-400"
                        }`}
                      >
                        {hasNoSlots ? "0" : availableSlots}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Clear upgrade message - always show when upgrades are available */}
            {draft.allowedStudios.some((s) => isUpgrade(s)) && (
              <div
                className={`mt-1 p-1.5 rounded-lg flex items-center gap-2 ${
                  selectedStudio !== draft.recommendedStudio
                    ? "bg-emerald-500/10 border border-emerald-500/30"
                    : "bg-blue-500/10 border border-blue-500/30"
                }`}
              >
                <ArrowUp
                  className={`w-3 h-3 ${
                    selectedStudio !== draft.recommendedStudio
                      ? "text-emerald-400"
                      : "text-blue-400"
                  }`}
                />
                <span
                  className={`text-[10px] ${
                    selectedStudio !== draft.recommendedStudio
                      ? "text-emerald-400"
                      : "text-blue-400"
                  }`}
                >
                  {selectedStudio !== draft.recommendedStudio
                    ? `Upgraded to ${selectedStudio}`
                    : `Upgrade available`}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Loading state */}

        {loading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
            <span className="ml-2 text-xs text-zinc-400">
              Checking availability...
            </span>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="flex items-center justify-center gap-2 py-2 text-amber-400">
            <AlertCircle className="w-3 h-3" />
            <span className="text-xs">{error}</span>
          </div>
        )}

        {/* Available Time Slabs */}
        {date && !loading && !error && (
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-400 flex items-center gap-1 uppercase tracking-wider font-semibold">
              <Clock className="w-3 h-3" />
              Step 1: Select Available Time Slot
            </label>

            {continuousSlabs.length === 0 ? (
              <div className="text-center py-2 text-zinc-500 text-xs">
                No available slots
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {continuousSlabs.map((slab, index) => {
                  const isSelected =
                    selectedSlab?.start === slab.start &&
                    selectedSlab?.end === slab.end;

                  return (
                    <button
                      key={index}
                      onClick={() => handleSlabSelect(slab)}
                      className={`px-2.5 py-1.5 rounded-lg transition-all text-xs font-medium ${
                        isSelected
                          ? "bg-violet-500 text-white ring-1 ring-violet-400"
                          : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                      }`}
                    >
                      {slab.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Start Time Selection */}
        {selectedSlab && (
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-400 flex items-center gap-1 uppercase tracking-wider font-semibold">
              <Clock className="w-3 h-3" />
              Step 2: Select Start Time
            </label>

            <div className="flex flex-wrap gap-1.5">
              {startTimes
                .filter((t) => !startTime || t.time === startTime)
                .map((timeOption) => {
                  const isSelected = startTime === timeOption.time;

                  return (
                    <button
                      key={timeOption.time}
                      onClick={() => handleStartTimeSelect(timeOption.time)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isSelected
                          ? "bg-violet-500 text-white ring-1 ring-violet-400"
                          : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
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
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-400 flex items-center gap-1 uppercase tracking-wider font-semibold">
              <Clock className="w-3 h-3" />
              Step 3: Select End Time
            </label>

            <div className="flex flex-wrap gap-1.5">
              {endTimes
                .filter((t) => !endTime || t.time === endTime)
                .map((timeOption) => {
                  const isSelected = endTime === timeOption.time;

                  return (
                      <button
                      key={timeOption.time}
                      onClick={() =>
                        handleEndTimeSelect(
                          timeOption.time,
                          timeOption.duration
                        )
                      }
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isSelected
                          ? "bg-violet-500 text-white ring-1 ring-violet-400"
                          : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                      }`}
                    >
                      {timeOption.label}
                    </button>
                  );
                })}
            </div>
          </div>
        )}

        {/* Selected time display summary */}
        {draft.selectedSlot && (
          <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <span className="text-xs text-violet-400">
                    Your booking:{" "}
                  </span>
                  <span className="text-white font-semibold text-sm">
                    {formatTimeSlot(
                      draft.selectedSlot.start,
                      draft.selectedSlot.end
                    )}
                  </span>
                </div>
                <div className="px-2 py-0.5 rounded bg-violet-500/20 border border-violet-500/30">
                  <span className="text-violet-300 font-medium text-xs">
                    {duration} {duration === 1 ? "hour" : "hours"}
                  </span>
                </div>
              </div>
              <span className="text-violet-400 font-bold">
                ₹{(draft.ratePerHour * duration).toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        )}
      </div>
    </StepLayout>
  );
}
