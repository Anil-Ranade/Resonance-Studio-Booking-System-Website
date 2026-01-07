"use client";

import { useEffect, useState, useMemo } from "react";
import { Loader2, ChevronLeft, ChevronRight, Lock, Eye, EyeOff } from "lucide-react";

interface Booking {
  id: string;
  phone_number: string;
  name: string | null;
  studio: string;
  session_type: string | null;
  session_details: string | null;
  group_size: number;
  date: string;
  start_time: string;
  end_time: string;
  status: "pending" | "confirmed";
  total_amount: number | null;
  notes: string | null;
}

const DISPLAY_AUTH_KEY = "displayAuthenticated";

export default function DisplayPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [startHour, setStartHour] = useState(8);
  const [endHour, setEndHour] = useState(22);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Always show all three studios
  const studios = ["Studio A", "Studio B", "Studio C"];

  // Format selected date for API
  const formattedDate = selectedDate.toISOString().split("T")[0];

  // Check for existing authentication on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const authenticated = localStorage.getItem(DISPLAY_AUTH_KEY);
        if (authenticated === "true") {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Error checking auth:", error);
      } finally {
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, []);

  // Handle password submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");

    try {
      const response = await fetch("/api/display/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setAuthError(data.error || "Invalid password");
        setAuthLoading(false);
        return;
      }

      // Store authentication in localStorage (never expires)
      localStorage.setItem(DISPLAY_AUTH_KEY, "true");
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Login error:", error);
      setAuthError("Failed to authenticate. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Navigate to previous day
  const goToPreviousDay = () => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() - 1);
      return newDate;
    });
  };

  // Navigate to next day
  const goToNextDay = () => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + 1);
      return newDate;
    });
  };

  // Check if selected date is today - using string comparison for reliability
  const isToday = useMemo(() => {
    const today = new Date();
    const todayString = today.toISOString().split("T")[0];
    const selectedString = selectedDate.toISOString().split("T")[0];
    return todayString === selectedString;
  }, [selectedDate]);

  // Fetch settings on mount
  useEffect(() => {
    if (!isAuthenticated) return;
    
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
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };
    fetchSettings();
  }, [isAuthenticated]);

  const fetchBookings = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);

    try {
      const response = await fetch(
        `/api/display/bookings?date=${formattedDate}`
      );
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
    if (!isAuthenticated) return;
    
    fetchBookings();
    // Auto-refresh every 10 seconds for real-time updates
    const interval = setInterval(() => fetchBookings(true), 10000);
    return () => clearInterval(interval);
  }, [formattedDate, isAuthenticated]);

  // Build consolidated booking blocks for each studio
  const studioBlocks = useMemo(() => {
    const result: Record<
      string,
      Array<{ start: number; end: number; booking: Booking }>
    > = {};

    studios.forEach((studio) => {
      const studioBookings = bookings
        .filter((b) => b.studio === studio)
        .sort((a, b) => a.start_time.localeCompare(b.start_time));

      const blocks: Array<{ start: number; end: number; booking: Booking }> =
        [];
      let currentBlock: {
        start: number;
        end: number;
        booking: Booking;
      } | null = null;

      studioBookings.forEach((b) => {
        const start = parseInt(b.start_time.split(":")[0], 10);
        const end = parseInt(b.end_time.split(":")[0], 10);

        if (
          currentBlock &&
          currentBlock.end === start &&
          currentBlock.booking.phone_number === b.phone_number
        ) {
          // Merge consecutive bookings from same user
          currentBlock.end = end;
        } else {
          if (currentBlock) blocks.push(currentBlock);
          currentBlock = { start, end, booking: b };
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

  // Get current time for determining past slots and current time indicator
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update every second for live clock
    return () => clearInterval(timer);
  }, []);

  const currentHour = currentTime.getHours();
  const currentMinutes = currentTime.getMinutes();

  // Calculate current time position as percentage (vertical)
  const getCurrentTimePosition = () => {
    const totalMinutes = (currentHour - startHour) * 60 + currentMinutes;
    const totalDuration = (endHour - startHour) * 60;
    return (totalMinutes / totalDuration) * 100;
  };

  const currentTimePosition = getCurrentTimePosition();
  const showCurrentTimeLine =
    isToday && currentHour >= startHour && currentHour < endHour;

  // Check if a time slot is in the past (only applies to today)
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

  // Format time string (HH:MM) to 12-hour format
  const formatBookingTime = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${hour12}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  // Format date for display (using selected date)
  const formatDisplayDate = () => {
    return selectedDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  // Format time for display (12-hour with seconds)
  const formatDisplayTime = () => {
    return currentTime.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  // Show loading spinner while checking auth
  if (checkingAuth) {
    return (
      <div className="h-screen w-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-violet-400 animate-spin" />
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="h-screen w-screen bg-[#0a0a0f] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 mb-4 shadow-lg shadow-violet-500/25">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Display Access</h1>
            <p className="text-zinc-400 mt-2">Enter password to view bookings</p>
          </div>

          {/* Login Form */}
          <div className="bg-zinc-900/80 backdrop-blur-sm rounded-2xl p-8 border border-zinc-800">
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Error Message */}
              {authError && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  {authError}
                </div>
              )}

              {/* Password Field */}
              <div>
                <label htmlFor="display-password" className="block text-sm font-medium text-zinc-300 mb-2.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none z-10" />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="display-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter display password"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 pl-12 pr-12 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    required
                    disabled={authLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                {authLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    Access Display
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <p className="text-center text-zinc-500 text-sm mt-6">
            Protected area. Admin access only.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#0a0a0f] flex flex-col overflow-hidden">
      {/* Date Navigation Header */}
      <div className="h-20 flex items-center justify-center bg-zinc-900/50 border-b border-zinc-800 flex-shrink-0">
        <div className="flex items-center gap-6">
          {/* Previous Day Button */}
          <button
            onClick={goToPreviousDay}
            className="p-3 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white transition-colors duration-200"
            aria-label="Previous day"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>

          {/* Date Display */}
          <div className="flex flex-col items-center min-w-[400px]">
            <span className="text-3xl font-bold text-white">
              {formatDisplayDate()}
            </span>
            {isToday && (
              <span className="text-sm text-amber-400 font-medium mt-1">
                Today
              </span>
            )}
          </div>

          {/* Next Day Button */}
          <button
            onClick={goToNextDay}
            className="p-3 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white transition-colors duration-200"
            aria-label="Next day"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </div>

        {/* Current Time */}
        <div className="absolute right-6">
          <span className="text-2xl font-bold text-amber-400 tabular-nums">
            {formatDisplayTime()}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-violet-400 animate-spin" />
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden p-4">
          {/* Table Container - Vertical Layout */}
          <div className="flex-1 flex flex-col overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900">
            {/* Column Headers */}
            <div className="h-12 flex-shrink-0 flex bg-zinc-800 border-b border-zinc-700 rounded-t-xl">
              <div className="w-[80px] flex-shrink-0 px-4 flex items-center justify-center text-base font-bold text-zinc-400 border-r border-zinc-700">
                TIME
              </div>
              {studios.map((studio) => (
                <div
                  key={studio}
                  className={`flex-1 px-4 flex items-center justify-center text-xl font-bold text-white border-r border-zinc-700 last:border-r-0 ${getStudioColor(
                    studio
                  )}`}
                >
                  {studio}
                </div>
              ))}
            </div>

            {/* Grid Body - with vertical padding for time labels */}
            <div className="flex-1 flex overflow-hidden relative my-2">
              {/* Current Time Indicator - Google Calendar Style (spans full width) */}
              {showCurrentTimeLine && (
                <div
                  className="absolute left-0 right-0 z-50 pointer-events-none flex items-center"
                  style={{
                    top: `${currentTimePosition}%`,
                    transform: "translateY(-50%)",
                  }}
                >
                  <div className="w-[80px] flex-shrink-0 flex justify-end pr-1">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  </div>
                  <div className="flex-1 h-[2px] bg-red-500"></div>
                </div>
              )}

              {/* Time Column */}
              <div className="w-[80px] flex-shrink-0 flex flex-col border-r border-zinc-700 relative bg-zinc-900">
                {timeSlots.map((hour, index) => (
                  <div
                    key={hour}
                    className="flex-1 relative border-b border-zinc-600 last:border-b-0"
                  >
                    {/* Time label positioned at the top of each slot */}
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 text-amber-400 font-semibold text-xs whitespace-nowrap bg-zinc-900 px-1">
                      {formatTimeLabel(hour)}
                    </span>
                  </div>
                ))}
                {/* End time label */}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 text-amber-400 font-semibold text-xs whitespace-nowrap bg-zinc-900 px-1 z-10">
                  {formatTimeLabel(endHour)}
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

                    {/* Booking blocks - Vertical */}
                    {studioBlocks[studio]?.map((block, idx) => {
                      const topPercent =
                        ((block.start - startHour) / timeSlots.length) * 100;
                      const heightPercent =
                        ((block.end - block.start) / timeSlots.length) * 100;
                      const isPast = isToday && block.end <= currentHour;

                      return (
                        <div
                          key={idx}
                          className={`absolute left-1 right-1 ${getStudioColor(
                            studio
                          )} text-white flex flex-col items-center justify-center px-1 z-10 rounded-md shadow-lg border border-white/30 ${
                            isPast ? "opacity-50" : ""
                          }`}
                          style={{
                            top: `${topPercent}%`,
                            height: `${heightPercent}%`,
                            minHeight: "40px",
                          }}
                        >
                          <span className="text-[11px] font-semibold text-amber-200 text-center leading-none truncate w-full">
                            {block.booking.session_type || "Session"}
                          </span>
                          <span className="text-[10px] font-medium text-white/90 text-center leading-none truncate w-full mt-0.5">
                            {formatBookingTime(block.booking.start_time)} -{" "}
                            {formatBookingTime(block.booking.end_time)}
                          </span>
                          <span className="text-sm font-bold text-center leading-tight truncate w-full mt-0.5">
                            {block.booking.name || "Guest"}
                          </span>
                          <span className="text-[10px] font-medium opacity-80 text-center leading-none truncate w-full">
                            {block.booking.phone_number}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
