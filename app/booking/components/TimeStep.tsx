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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { optionChip } from "./optionStyles";
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
  const { draft, updateDraft, nextStep, mode } = useBooking();

  // Get default date (tomorrow for customers, today for admin/staff)
  const getDefaultDate = () => {
    const today = new Date();
    if (mode === "customer") {
      today.setDate(today.getDate() + 1);
    }
    // Use local time YYYY-MM-DD
    return today.toLocaleDateString("en-CA");
  };

  const [date, setDate] = useState(draft.date || getDefaultDate());
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

  // Set default date in draft on mount if not already set
  useEffect(() => {
    if (!draft.date) {
      const defaultDate = getDefaultDate();
      updateDraft({ date: defaultDate });
    }
  }, [draft.date, updateDraft]);

  // Calculate min/max dates
  const getMinDate = () => {
    // For customers, minimum is tomorrow (same-day bookings not allowed)
    if (mode === "customer") {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toLocaleDateString("en-CA");
    }
    
    // For admin/staff, allow past dates (e.g., up to 1 year ago)
    const pastDate = new Date();
    pastDate.setFullYear(pastDate.getFullYear() - 1);
    return pastDate.toLocaleDateString("en-CA");
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + advanceBookingDays);
    return maxDate.toLocaleDateString("en-CA");
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
      // Allow past slots for admin/staff
      if (mode === "admin" || mode === "staff") {
        url += `&allowPastSlots=true`;
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
  }, [date, selectedStudio, draft.isEditMode, draft.originalBookingId, mode]);

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
          // Allow past slots for admin/staff
          if (mode === "admin" || mode === "staff") {
            url += `&allowPastSlots=true`;
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
  }, [date, draft.allowedStudios, draft.isEditMode, draft.originalBookingId, mode]);

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

  const sectionLabel =
    "text-[11px] text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider font-semibold";

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
      <div className="space-y-4">
        {draft.isEditMode && draft.originalChoices && (
          <Badge variant="outline" className="border-primary/40 text-primary h-auto whitespace-normal py-1">
            <RotateCcw />
            Original: {formatDate(draft.originalChoices.date)} at{" "}
            {formatTimeSlot(draft.originalChoices.start_time, draft.originalChoices.end_time)}
          </Badge>
        )}

        {!draft.isEditMode && (
          <Alert>
            <AlertCircle className="text-primary" />
            <AlertTitle>How to select your time</AlertTitle>
            <AlertDescription className="text-xs">
              <ol className="list-decimal list-inside space-y-0.5">
                <li>Select an available time slot</li>
                <li>Choose your preferred start time</li>
                <li>Choose your preferred end time</li>
              </ol>
            </AlertDescription>
          </Alert>
        )}

        {/* Date selector */}
        <div className="space-y-1.5">
          <Label className={sectionLabel}>
            <Calendar className="size-3" /> Select date
          </Label>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="icon-lg"
              onClick={() => navigateDate(-1)}
              disabled={!date || date === getMinDate()}
              aria-label="Previous day"
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              onClick={openDatePicker}
              className="flex-1 h-9 border-primary/50 hover:border-primary"
            >
              <Calendar className="text-primary" />
              {date ? formatDate(date) : "Select date"}
            </Button>
            <Button
              variant="secondary"
              size="icon-lg"
              onClick={() => navigateDate(1)}
              disabled={!date || date === getMaxDate()}
              aria-label="Next day"
            >
              <ChevronRight />
            </Button>
          </div>
          {/* Native picker, opened by the date button */}
          <input
            ref={dateInputRef}
            type="date"
            value={date}
            min={getMinDate()}
            max={getMaxDate()}
            onChange={(e) => handleDateChange(e.target.value)}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
          />
        </div>

        {/* Studio selector - only when several studios fit */}
        {draft.allowedStudios.length > 1 && (
          <div className="space-y-1.5">
            <Label className={sectionLabel}>
              <Building2 className="size-3" /> Studio
            </Label>
            <ToggleGroup
              type="single"
              value={selectedStudio}
              onValueChange={(v) => v && handleStudioChange(v as StudioName)}
              className="flex-wrap gap-1.5"
            >
              {draft.allowedStudios.map((studio) => {
                const hasNoSlots = !!date && studioAvailability[studio] === 0;
                return (
                  <ToggleGroupItem
                    key={studio}
                    value={studio}
                    disabled={hasNoSlots}
                    className={optionChip}
                  >
                    {studio.replace("Studio ", "")}
                    <span className="opacity-70">₹{getStudioRateForDisplay(studio)}/hr</span>
                    {isUpgrade(studio) && selectedStudio !== studio && (
                      <ArrowUp className="size-3 text-emerald-400" />
                    )}
                    {date && (
                      <span className={hasNoSlots ? "text-red-400" : "text-emerald-400"}>
                        {studioAvailability[studio] ?? 0}
                      </span>
                    )}
                  </ToggleGroupItem>
                );
              })}
            </ToggleGroup>
            {draft.allowedStudios.some((st) => isUpgrade(st)) && (
              <Badge
                variant="outline"
                className={
                  selectedStudio !== draft.recommendedStudio
                    ? "border-emerald-500/40 text-emerald-400"
                    : "border-primary/40 text-primary"
                }
              >
                <ArrowUp />
                {selectedStudio !== draft.recommendedStudio
                  ? `Upgraded to ${selectedStudio}`
                  : "Upgrade available"}
              </Badge>
            )}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground">
            <Spinner className="text-primary" /> Checking availability...
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        {/* Step 1: slab */}
        {date && !loading && !error && (
          <div className="space-y-1.5">
            <Label className={sectionLabel}>
              <Clock className="size-3" /> Step 1: Select available time slot
            </Label>
            {continuousSlabs.length === 0 ? (
              <p className="text-center py-2 text-muted-foreground text-xs">No available slots</p>
            ) : (
              <ToggleGroup
                type="single"
                value={selectedSlab ? `${selectedSlab.start}-${selectedSlab.end}` : ""}
                onValueChange={() => {}}
                className="flex-wrap gap-1.5"
              >
                {continuousSlabs.map((slab) => (
                  <ToggleGroupItem
                    key={`${slab.start}-${slab.end}`}
                    value={`${slab.start}-${slab.end}`}
                    onClick={() => handleSlabSelect(slab)}
                    className={optionChip}
                  >
                    {slab.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            )}
          </div>
        )}

        {/* Step 2: start */}
        {selectedSlab && (
          <div className="space-y-1.5">
            <Label className={sectionLabel}>
              <Clock className="size-3" /> Step 2: Select start time
            </Label>
            <ToggleGroup
              type="single"
              value={startTime}
              onValueChange={() => {}}
              className="flex-wrap gap-1.5"
            >
              {startTimes
                .filter((t) => !startTime || t.time === startTime)
                .map((t) => (
                  <ToggleGroupItem
                    key={t.time}
                    value={t.time}
                    onClick={() => handleStartTimeSelect(t.time)}
                    className={optionChip}
                  >
                    {t.label}
                  </ToggleGroupItem>
                ))}
            </ToggleGroup>
          </div>
        )}

        {/* Step 3: end */}
        {startTime && (
          <div className="space-y-1.5">
            <Label className={sectionLabel}>
              <Clock className="size-3" /> Step 3: Select end time
            </Label>
            <ToggleGroup
              type="single"
              value={endTime}
              onValueChange={() => {}}
              className="flex-wrap gap-1.5"
            >
              {endTimes
                .filter((t) => !endTime || t.time === endTime)
                .map((t) => (
                  <ToggleGroupItem
                    key={t.time}
                    value={t.time}
                    onClick={() => handleEndTimeSelect(t.time, t.duration)}
                    className={optionChip}
                  >
                    {t.label}
                  </ToggleGroupItem>
                ))}
            </ToggleGroup>
          </div>
        )}

        {draft.selectedSlot && (
          <Card size="sm" className="ring-primary/40 bg-primary/10">
            <CardContent className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-primary">Your booking:</span>
                <span className="font-semibold text-sm">
                  {formatTimeSlot(draft.selectedSlot.start, draft.selectedSlot.end)}
                </span>
                <Badge variant="outline" className="border-primary/40 text-primary">
                  {duration} {duration === 1 ? "hour" : "hours"}
                </Badge>
              </div>
              <span className="text-primary font-bold">
                ₹{(draft.ratePerHour * duration).toLocaleString("en-IN")}
              </span>
            </CardContent>
          </Card>
        )}
      </div>
    </StepLayout>
  );
}
