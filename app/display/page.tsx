"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Lock,
  Eye,
  EyeOff,
  X,
  Clock,
  User,
  Phone,
  Music,
  Calendar,
  IndianRupee,
  FileText,
  Users,
  CalendarDays,
} from "lucide-react";

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

interface BookingBlock {
  start: number;
  end: number;
  booking: Booking;
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
  const [showPhoneNumbers, setShowPhoneNumbers] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Always show all three studios
  const studios = ["Studio A", "Studio B", "Studio C"];

  const toLocalDateString = (date: Date) => date.toLocaleDateString("en-CA"); // YYYY-MM-DD in local time

  // Format selected date for API
  const formattedDate = toLocalDateString(selectedDate);

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
    const todayString = toLocalDateString(today);
    const selectedString = toLocalDateString(selectedDate);
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
            10,
          );
          const closeHour = parseInt(
            (data.defaultCloseTime || "22:00").split(":")[0],
            10,
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
        `/api/display/bookings?date=${formattedDate}`,
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

  const getStudioColorBorder = (studio: string) => {
    if (studio === "Studio A") return "border-blue-500";
    if (studio === "Studio B") return "border-yellow-700";
    if (studio === "Studio C") return "border-emerald-500";
    return "border-zinc-600";
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

  // Short date for mobile
  const formatDisplayDateShort = () => {
    return selectedDate.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
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

  // Short time for mobile
  const formatDisplayTimeShort = () => {
    return currentTime.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Handle booking click
  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking(booking);
  };

  // Close modal
  const closeModal = () => {
    setSelectedBooking(null);
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
            <p className="text-zinc-400 mt-2">
              Enter password to view bookings
            </p>
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
                <label
                  htmlFor="display-password"
                  className="block text-sm font-medium text-zinc-300 mb-2.5"
                >
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
      {/* Date Navigation Header - Responsive */}
      <div className="h-16 md:h-20 flex items-center justify-between md:justify-center bg-zinc-900/50 border-b border-zinc-800 flex-shrink-0 px-2 md:px-4 relative">
        <div className="flex items-center gap-2 md:gap-6">
          {/* Previous Day Button */}
          <button
            onClick={goToPreviousDay}
            className="p-2 md:p-3 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white transition-colors duration-200"
            aria-label="Previous day"
          >
            <ChevronLeft className="w-5 h-5 md:w-8 md:h-8" />
          </button>

          {/* Date Display with Calendar Picker - Responsive */}
          <div className="flex flex-col items-center min-w-[120px] md:min-w-[400px] relative">
            {/* Clickable Date Display */}
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex flex-col items-center hover:bg-zinc-800/50 px-3 py-1 rounded-lg transition-colors group"
            >
              {/* Desktop date */}
              <span className="hidden md:flex items-center gap-2 text-2xl lg:text-3xl font-bold text-white group-hover:text-violet-300 transition-colors">
                {formatDisplayDate()}
                <CalendarDays className="w-6 h-6 text-zinc-400 group-hover:text-violet-400 transition-colors" />
              </span>
              {/* Mobile date */}
              <span className="md:hidden flex items-center gap-1.5 text-base font-bold text-white group-hover:text-violet-300 transition-colors">
                {formatDisplayDateShort()}
                <CalendarDays className="w-4 h-4 text-zinc-400 group-hover:text-violet-400 transition-colors" />
              </span>
              {isToday && (
                <span className="text-xs md:text-sm text-amber-400 font-medium mt-0.5 md:mt-1">
                  Today
                </span>
              )}
            </button>

            {/* Date Picker Dropdown */}
            {showDatePicker && (
              <div className="absolute top-full mt-2 z-50 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-4 min-w-[260px]">
                <div className="flex flex-col gap-3">
                  <label className="text-sm text-zinc-400 font-medium">
                    Select a date
                  </label>
                  <input
                    type="date"
                    value={toLocalDateString(selectedDate)}
                    onChange={(e) => {
                      const newDate = new Date(e.target.value);
                      if (!isNaN(newDate.getTime())) {
                        setSelectedDate(newDate);
                        setShowDatePicker(false);
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

          {/* Next Day Button */}
          <button
            onClick={goToNextDay}
            className="p-2 md:p-3 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white transition-colors duration-200"
            aria-label="Next day"
          >
            <ChevronRight className="w-5 h-5 md:w-8 md:h-8" />
          </button>
        </div>

        {/* Current Time & Phone Toggle - Desktop only for toggle */}
        <div className="flex items-center gap-2 md:gap-4 md:absolute md:right-6">
          {/* Phone Number Visibility Toggle - Hidden on mobile */}
          <button
            onClick={() => setShowPhoneNumbers(!showPhoneNumbers)}
            className={`hidden md:flex p-2 rounded-lg transition-all duration-200 items-center gap-2 ${
              showPhoneNumbers
                ? "bg-violet-600/20 text-violet-400 hover:bg-violet-600/30"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
            aria-label={
              showPhoneNumbers ? "Hide phone numbers" : "Show phone numbers"
            }
            title={
              showPhoneNumbers ? "Hide phone numbers" : "Show phone numbers"
            }
          >
            {showPhoneNumbers ? (
              <Eye className="w-5 h-5" />
            ) : (
              <EyeOff className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">Phone</span>
          </button>
          {/* Desktop time */}
          <span className="hidden md:block text-xl lg:text-2xl font-bold text-amber-400 tabular-nums">
            {formatDisplayTime()}
          </span>
          {/* Mobile time */}
          <span className="md:hidden text-sm font-bold text-amber-400 tabular-nums">
            {formatDisplayTimeShort()}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-violet-400 animate-spin" />
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden p-2 md:p-4">
          {/* Table Container - Vertical Layout */}
          <div className="flex-1 flex flex-col overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900">
            {/* Column Headers - Responsive */}
            <div className="h-10 md:h-12 flex-shrink-0 flex bg-zinc-800 border-b border-zinc-700 rounded-t-xl">
              <div className="w-[40px] md:w-[80px] flex-shrink-0 px-1 md:px-4 flex items-center justify-center text-xs md:text-base font-bold text-zinc-400 border-r border-zinc-700">
                <span className="hidden md:inline">TIME</span>
                <Clock className="w-4 h-4 md:hidden" />
              </div>
              {studios.map((studio) => (
                <div
                  key={studio}
                  className={`flex-1 px-1 md:px-4 flex items-center justify-center text-xs md:text-xl font-bold text-white border-r border-zinc-700 last:border-r-0 ${getStudioColor(
                    studio,
                  )}`}
                >
                  {/* Desktop: Full name, Mobile: Letter only */}
                  <span className="hidden md:inline">{studio}</span>
                  <span className="md:hidden">{studio.split(" ")[1]}</span>
                </div>
              ))}
            </div>

            {/* Grid Body - with vertical padding for time labels */}
            <div className="flex-1 flex overflow-hidden relative my-1 md:my-2">
              {/* Current Time Indicator - Google Calendar Style (spans full width) */}
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

              {/* Time Column - Responsive */}
              <div className="w-[40px] md:w-[80px] flex-shrink-0 flex flex-col border-r border-zinc-700 relative bg-zinc-900">
                {timeSlots.map((hour) => (
                  <div
                    key={hour}
                    className="flex-1 relative border-b border-zinc-600 last:border-b-0"
                  >
                    {/* Time label positioned at the top of each slot */}
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 text-amber-400 font-semibold text-[10px] md:text-xs whitespace-nowrap bg-zinc-900 px-0.5 md:px-1">
                      {/* Desktop: Full format, Mobile: Short */}
                      <span className="hidden md:inline">
                        {formatTimeLabel(hour)}
                      </span>
                      <span className="md:hidden">
                        {formatTimeLabelShort(hour)}
                      </span>
                    </span>
                  </div>
                ))}
                {/* End time label */}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 text-amber-400 font-semibold text-[10px] md:text-xs whitespace-nowrap bg-zinc-900 px-0.5 md:px-1 z-10">
                  <span className="hidden md:inline">
                    {formatTimeLabel(endHour)}
                  </span>
                  <span className="md:hidden">
                    {formatTimeLabelShort(endHour)}
                  </span>
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

                    {/* Booking blocks - Vertical, Clickable */}
                    {studioBlocks[studio]?.map((block, idx) => {
                      const topPercent =
                        ((block.start - startHour) / timeSlots.length) * 100;
                      const heightPercent =
                        ((block.end - block.start) / timeSlots.length) * 100;
                      const isPast = isToday && block.end <= currentHour;

                      return (
                        <button
                          key={idx}
                          onClick={() => handleBookingClick(block.booking)}
                          className={`absolute left-0.5 right-0.5 md:left-1 md:right-1 ${getStudioColor(
                            studio,
                          )} text-white flex flex-col justify-center items-center px-1 md:px-2 z-10 rounded-md shadow-lg border border-white/30 overflow-hidden cursor-pointer hover:brightness-110 active:scale-[0.98] transition-all ${
                            isPast ? "opacity-50" : ""
                          }`}
                          style={{
                            top: `${topPercent}%`,
                            height: `${heightPercent}%`,
                            minHeight: "28px",
                          }}
                        >
                          {/* Mobile: Compact view */}
                          <div className="md:hidden flex flex-col items-center justify-center w-full overflow-hidden">
                            <span className="text-[10px] font-bold leading-tight truncate w-full text-center">
                              {block.booking.name?.split(" ")[0] || "Guest"}
                            </span>
                          </div>

                          {/* Desktop: Full view */}
                          <div className="hidden md:flex items-center justify-between w-full gap-2 overflow-hidden">
                            <span className="text-xs font-semibold text-amber-300 leading-none truncate flex-shrink-0 max-w-[80px]">
                              {block.booking.session_type || "Session"}
                            </span>
                            <div className="flex flex-col items-center flex-1 min-w-0 overflow-hidden">
                              <span className="text-base lg:text-lg font-bold leading-tight truncate w-full text-center">
                                {block.booking.name || "Guest"}
                              </span>
                              {showPhoneNumbers && (
                                <span className="text-xs font-medium opacity-80 leading-none truncate w-full text-center">
                                  {block.booking.phone_number}
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-semibold text-white/90 leading-none truncate flex-shrink-0 max-w-[120px] text-right">
                              {formatBookingTime(block.booking.start_time)} -{" "}
                              {formatBookingTime(block.booking.end_time)}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className={`w-full max-w-lg bg-zinc-900 rounded-2xl border-2 ${getStudioColorBorder(selectedBooking.studio)} shadow-2xl overflow-hidden`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className={`${getStudioColor(selectedBooking.studio)} px-4 md:px-6 py-4 flex items-center justify-between`}
            >
              <div>
                <h2 className="text-lg md:text-xl font-bold text-white">
                  {selectedBooking.studio}
                </h2>
                <p className="text-sm text-white/80">
                  {formatBookingTime(selectedBooking.start_time)} -{" "}
                  {formatBookingTime(selectedBooking.end_time)}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 md:p-6 space-y-4">
              {/* Customer Name */}
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-zinc-800 text-violet-400">
                  <User className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-zinc-500 uppercase tracking-wide">
                    Customer
                  </p>
                  <p className="text-lg font-semibold text-white truncate">
                    {selectedBooking.name || "Guest"}
                  </p>
                </div>
              </div>

              {/* Phone Number */}
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-zinc-800 text-emerald-400">
                  <Phone className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-zinc-500 uppercase tracking-wide">
                    Phone
                  </p>
                  <p className="text-lg font-semibold text-white">
                    {selectedBooking.phone_number}
                  </p>
                </div>
              </div>

              {/* Session Type */}
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-zinc-800 text-amber-400">
                  <Music className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-zinc-500 uppercase tracking-wide">
                    Session Type
                  </p>
                  <p className="text-lg font-semibold text-white">
                    {selectedBooking.session_type || "Not specified"}
                  </p>
                  {selectedBooking.session_details && (
                    <p className="text-sm text-zinc-400 mt-0.5">
                      {selectedBooking.session_details}
                    </p>
                  )}
                </div>
              </div>

              {/* Date & Time */}
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-zinc-800 text-blue-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-zinc-500 uppercase tracking-wide">
                    Date & Time
                  </p>
                  <p className="text-lg font-semibold text-white">
                    {new Date(selectedBooking.date).toLocaleDateString(
                      "en-US",
                      {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      },
                    )}
                  </p>
                  <p className="text-sm text-zinc-400">
                    {formatBookingTime(selectedBooking.start_time)} -{" "}
                    {formatBookingTime(selectedBooking.end_time)}
                  </p>
                </div>
              </div>

              {/* Amount */}
              {selectedBooking.total_amount && (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-zinc-800 text-green-400">
                    <IndianRupee className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-zinc-500 uppercase tracking-wide">
                      Amount
                    </p>
                    <p className="text-lg font-semibold text-white">
                      ₹{selectedBooking.total_amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {/* Group Size */}
              {selectedBooking.group_size > 0 && (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-zinc-800 text-pink-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-zinc-500 uppercase tracking-wide">
                      Group Size
                    </p>
                    <p className="text-lg font-semibold text-white">
                      {selectedBooking.group_size}{" "}
                      {selectedBooking.group_size === 1 ? "person" : "people"}
                    </p>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedBooking.notes && (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-zinc-800 text-orange-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-zinc-500 uppercase tracking-wide">
                      Notes
                    </p>
                    <p className="text-sm text-zinc-300 mt-1">
                      {selectedBooking.notes}
                    </p>
                  </div>
                </div>
              )}

              {/* Status Badge */}
              <div className="pt-2 flex justify-center">
                <span
                  className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium ${
                    selectedBooking.status === "confirmed"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  }`}
                >
                  {selectedBooking.status === "confirmed"
                    ? "Confirmed"
                    : "Pending"}
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-4 md:px-6 py-4 bg-zinc-800/50 border-t border-zinc-700">
              <button
                onClick={closeModal}
                className="w-full py-3 px-4 bg-zinc-700 hover:bg-zinc-600 text-white font-medium rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
