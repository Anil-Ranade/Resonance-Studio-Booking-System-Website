'use client';

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar, Clock, Loader2, CalendarDays } from "lucide-react";

interface BookingSlot {
  start_time: string;
  end_time: string;
  studio: string;
}

interface BookingBlock {
  start: number;
  end: number;
  studio: string;
}

export default function AvailabilityPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [bookings, setBookings] = useState<BookingSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [startHour, setStartHour] = useState(8);
  const [endHour, setEndHour] = useState(22);
  const [advanceBookingDays, setAdvanceBookingDays] = useState(30);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const studios = ["Studio A", "Studio B", "Studio C"];

  // Format selected date for API
  const formattedDate = selectedDate.toISOString().split("T")[0];

  // Calculate max date based on advance booking days
  const getMaxDate = useCallback(() => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + advanceBookingDays);
    return maxDate;
  }, [advanceBookingDays]);

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/settings");
        if (response.ok) {
          const data = await response.json();
          const openHour = parseInt(
            (data.defaultOpenTime || "08:00").split(":")[0],
            10
          );
          const closeHour = parseInt(
            (data.defaultCloseTime || "22:00").split(":")[0],
            10
          );
          setStartHour(openHour);
          setEndHour(closeHour);
          setAdvanceBookingDays(data.advanceBookingDays || 30);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };
    fetchSettings();
  }, []);

  // Fetch bookings
  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/display/bookings?date=${formattedDate}`);
      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [formattedDate]);

  // Navigate to previous day
  const goToPreviousDay = () => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() - 1);
      // Don't go before today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (newDate >= today) {
        return newDate;
      }
      return prev;
    });
  };

  // Navigate to next day
  const goToNextDay = () => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + 1);
      // Don't go beyond advance booking limit
      if (newDate <= getMaxDate()) {
        return newDate;
      }
      return prev;
    });
  };

  // Check if can navigate
  const canGoPrevious = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const prevDate = new Date(selectedDate);
    prevDate.setDate(selectedDate.getDate() - 1);
    return prevDate >= today;
  };

  const canGoNext = () => {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(selectedDate.getDate() + 1);
    return nextDate <= getMaxDate();
  };

  // Check if selected date is today
  const isToday = useMemo(() => {
    const today = new Date();
    const todayString = today.toISOString().split("T")[0];
    const selectedString = selectedDate.toISOString().split("T")[0];
    return todayString === selectedString;
  }, [selectedDate]);

  // Build booking blocks for each studio
  const studioBlocks = useMemo(() => {
    const result: Record<string, BookingBlock[]> = {};

    studios.forEach((studio) => {
      const studioBookings = bookings
        .filter((b) => b.studio === studio)
        .sort((a, b) => a.start_time.localeCompare(b.start_time));

      const blocks: BookingBlock[] = [];
      let currentBlock: BookingBlock | null = null;

      studioBookings.forEach((b) => {
        const start = parseInt(b.start_time.split(":")[0], 10);
        const end = parseInt(b.end_time.split(":")[0], 10);

        if (currentBlock && currentBlock.end === start) {
          // Merge consecutive bookings
          currentBlock.end = end;
        } else {
          if (currentBlock) blocks.push(currentBlock);
          currentBlock = { start, end, studio };
        }
      });

      if (currentBlock) blocks.push(currentBlock);
      result[studio] = blocks;
    });

    return result;
  }, [bookings, studios]);

  // Time slots based on admin settings
  const timeSlots = useMemo(() => {
    return Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  }, [startHour, endHour]);

  // Get current time
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const currentHour = currentTime.getHours();
  const currentMinutes = currentTime.getMinutes();

  // Calculate current time position
  const getCurrentTimePosition = () => {
    const totalMinutes = (currentHour - startHour) * 60 + currentMinutes;
    const totalDuration = (endHour - startHour) * 60;
    return (totalMinutes / totalDuration) * 100;
  };

  const currentTimePosition = getCurrentTimePosition();
  const showCurrentTimeLine =
    isToday && currentHour >= startHour && currentHour < endHour;

  // Check if a time slot is in the past
  const isPastSlot = (hour: number) => {
    if (!isToday) return false;
    return hour < currentHour;
  };

  const getStudioColor = (studio: string) => {
    if (studio === "Studio A") return "bg-blue-500";
    if (studio === "Studio B") return "bg-yellow-700";
    if (studio === "Studio C") return "bg-emerald-500";
    return "bg-zinc-600";
  };

  // Format hour to 12-hour format
  const formatTimeLabel = (hour: number) => {
    if (hour === 12) return "12 PM";
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  // Short format for mobile
  const formatTimeLabelShort = (hour: number) => {
    if (hour === 12) return "12P";
    if (hour < 12) return `${hour}A`;
    return `${hour - 12}P`;
  };

  // Format date for display
  const formatDisplayDate = () => {
    return selectedDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  // Short date for mobile
  const formatDisplayDateShort = () => {
    return selectedDate.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="h-screen w-screen bg-[#0a0a0f] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="h-14 md:h-16 flex items-center justify-between bg-zinc-900/50 border-b border-zinc-800 flex-shrink-0 px-3 md:px-6">
        {/* Back button and title */}
        <div className="flex items-center gap-3">
          <Link
            href="/home"
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
          </Link>
          <h1 className="text-lg md:text-xl font-bold text-white">Availability</h1>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center gap-1 md:gap-2">
          <button
            onClick={goToPreviousDay}
            disabled={!canGoPrevious()}
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Previous day"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Date Display with Calendar Picker */}
          <div className="relative">
            {/* Clickable Date Display */}
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex flex-col items-center min-w-[100px] md:min-w-[280px] hover:bg-zinc-800/50 px-2 md:px-4 py-1 rounded-lg transition-colors group"
            >
              <span className="hidden md:flex items-center gap-2 text-lg font-semibold text-white group-hover:text-violet-300 transition-colors">
                {formatDisplayDate()}
                <CalendarDays className="w-5 h-5 text-zinc-400 group-hover:text-violet-400 transition-colors" />
              </span>
              <span className="md:hidden flex items-center gap-1.5 text-sm font-semibold text-white group-hover:text-violet-300 transition-colors">
                {formatDisplayDateShort()}
                <CalendarDays className="w-4 h-4 text-zinc-400 group-hover:text-violet-400 transition-colors" />
              </span>
              {isToday && (
                <span className="text-[10px] md:text-xs text-amber-400 font-medium">
                  Today
                </span>
              )}
            </button>

            {/* Date Picker Dropdown */}
            {showDatePicker && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-4 min-w-[260px]">
                <div className="flex flex-col gap-3">
                  <label className="text-sm text-zinc-400 font-medium">Select a date</label>
                  <input
                    type="date"
                    value={selectedDate.toISOString().split("T")[0]}
                    min={new Date().toISOString().split("T")[0]}
                    max={getMaxDate().toISOString().split("T")[0]}
                    onChange={(e) => {
                      const newDate = new Date(e.target.value);
                      if (!isNaN(newDate.getTime())) {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const maxDate = getMaxDate();
                        if (newDate >= today && newDate <= maxDate) {
                          setSelectedDate(newDate);
                          setShowDatePicker(false);
                        }
                      }
                    }}
                    className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-4 py-3 text-white text-base outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent cursor-pointer"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedDate(new Date());
                        setShowDatePicker(false);
                      }}
                      className="flex-1 px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Today
                    </button>
                    <button
                      onClick={() => setShowDatePicker(false)}
                      className="flex-1 px-3 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={goToNextDay}
            disabled={!canGoNext()}
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next day"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Book button */}
        <Link
          href="/booking/new"
          className="hidden md:flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Calendar className="w-4 h-4" />
          Book Now
        </Link>
        <Link
          href="/booking/new"
          className="md:hidden p-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors"
        >
          <Calendar className="w-5 h-5" />
        </Link>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-violet-400 animate-spin" />
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden p-2 md:p-4">
          {/* Grid Container */}
          <div className="flex-1 flex flex-col overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900">
            {/* Column Headers */}
            <div className="h-10 md:h-12 flex-shrink-0 flex bg-zinc-800 border-b border-zinc-700 rounded-t-xl">
              <div className="w-[40px] md:w-[80px] flex-shrink-0 px-1 md:px-4 flex items-center justify-center text-xs md:text-base font-bold text-zinc-400 border-r border-zinc-700">
                <span className="hidden md:inline">TIME</span>
                <Clock className="w-4 h-4 md:hidden" />
              </div>
              {studios.map((studio) => (
                <div
                  key={studio}
                  className={`flex-1 px-1 md:px-4 flex items-center justify-center text-xs md:text-xl font-bold text-white border-r border-zinc-700 last:border-r-0 ${getStudioColor(
                    studio
                  )}`}
                >
                  <span className="hidden md:inline">{studio}</span>
                  <span className="md:hidden">{studio.split(" ")[1]}</span>
                </div>
              ))}
            </div>

            {/* Grid Body */}
            <div className="flex-1 flex overflow-hidden relative my-1 md:my-2">
              {/* Current Time Indicator */}
              {showCurrentTimeLine && (
                <div
                  className="absolute left-0 right-0 z-50 pointer-events-none flex items-center"
                  style={{
                    top: `${currentTimePosition}%`,
                    transform: "translateY(-50%)",
                  }}
                >
                  <div className="w-[40px] md:w-[80px] flex-shrink-0 flex justify-end pr-0.5 md:pr-1">
                    <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-red-500"></div>
                  </div>
                  <div className="flex-1 h-[2px] bg-red-500"></div>
                </div>
              )}

              {/* Time Column */}
              <div className="w-[40px] md:w-[80px] flex-shrink-0 flex flex-col border-r border-zinc-700 relative bg-zinc-900">
                {timeSlots.map((hour) => (
                  <div
                    key={hour}
                    className="flex-1 relative border-b border-zinc-600 last:border-b-0"
                  >
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 text-amber-400 font-semibold text-[10px] md:text-xs whitespace-nowrap bg-zinc-900 px-0.5 md:px-1">
                      <span className="hidden md:inline">{formatTimeLabel(hour)}</span>
                      <span className="md:hidden">{formatTimeLabelShort(hour)}</span>
                    </span>
                  </div>
                ))}
                {/* End time label */}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 text-amber-400 font-semibold text-[10px] md:text-xs whitespace-nowrap bg-zinc-900 px-0.5 md:px-1 z-10">
                  <span className="hidden md:inline">{formatTimeLabel(endHour)}</span>
                  <span className="md:hidden">{formatTimeLabelShort(endHour)}</span>
                </span>
              </div>

              {/* Studios Grid Container */}
              <div className="flex-1 flex relative">
                {/* Studio Columns */}
                {studios.map((studio) => (
                  <div
                    key={studio}
                    className="flex-1 relative border-r border-zinc-700 last:border-r-0"
                  >
                    {/* Grid lines for empty slots */}
                    <div className="absolute inset-0 flex flex-col">
                      {timeSlots.map((hour) => {
                        const isPast = isPastSlot(hour);
                        return (
                          <div
                            key={hour}
                            className={`flex-1 border-b border-zinc-600 last:border-b-0 ${
                              isPast ? "bg-black/40" : "bg-zinc-900/30"
                            }`}
                          />
                        );
                      })}
                    </div>

                    {/* Busy blocks - Shows "Busy" instead of booking details */}
                    {studioBlocks[studio]?.map((block, idx) => {
                      const topPercent =
                        ((block.start - startHour) / timeSlots.length) * 100;
                      const heightPercent =
                        ((block.end - block.start) / timeSlots.length) * 100;
                      const isPast = isToday && block.end <= currentHour;

                      return (
                        <div
                          key={idx}
                          className={`absolute left-0.5 right-0.5 md:left-1 md:right-1 ${getStudioColor(
                            studio
                          )} text-white flex items-center justify-center z-10 rounded-md shadow-lg border border-white/30 overflow-hidden ${
                            isPast ? "opacity-50" : ""
                          }`}
                          style={{
                            top: `${topPercent}%`,
                            height: `${heightPercent}%`,
                            minHeight: "28px",
                          }}
                        >
                          <span className="text-xs md:text-sm font-bold uppercase tracking-wider">
                            Busy
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-2 md:mt-3 flex flex-wrap items-center justify-center gap-3 md:gap-6">
            {studios.map((studio) => (
              <div key={studio} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded ${getStudioColor(studio)}`} />
                <span className="text-zinc-400 text-xs md:text-sm">{studio}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-zinc-800 border border-zinc-600" />
              <span className="text-zinc-400 text-xs md:text-sm">Available</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
