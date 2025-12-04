'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, Loader2 } from 'lucide-react';
import { useBooking } from '../contexts/BookingContext';
import StepLayout from './StepLayout';

// Helper function to safely parse JSON responses
async function safeJsonParse(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    console.error('Failed to parse response as JSON:', text.substring(0, 200));
    throw new Error('Server returned an invalid response. Please try again.');
  }
}

type SlotStatus = 'available' | 'booked' | 'past' | 'unavailable';

type AvailabilityData = {
  [date: string]: {
    [studio: string]: {
      [time: string]: SlotStatus;
    };
  };
};

interface TimeSlotType {
  start: string;
  end: string;
}

interface BookingSlot {
  start_time: string;
  end_time: string;
  studio: string;
  phone_number?: string;
  session_type?: string;
}

export default function AvailabilityStep() {
  const { draft } = useBooking();
  const [startDate, setStartDate] = useState(new Date());
  const [availability, setAvailability] = useState<AvailabilityData>({});
  const [bookingsData, setBookingsData] = useState<{ [dateKey: string]: BookingSlot[] }>({});
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [advanceBookingDays, setAdvanceBookingDays] = useState(30);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Fetch booking settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          setAdvanceBookingDays(data.advanceBookingDays || 30);
        }
      } catch (err) {
        console.error('Error fetching booking settings:', err);
      }
    };
    fetchSettings();
  }, []);

  // Calculate max date based on advance booking days
  const getMaxDate = useCallback(() => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + advanceBookingDays);
    return maxDate;
  }, [advanceBookingDays]);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Update current time every second for live indicator
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const studios = [
    { id: 'Studio A', name: 'Studio A', color: 'bg-blue-500', key: 'A' },
    { id: 'Studio B', name: 'Studio B', color: 'bg-amber-700', key: 'B' },
    { id: 'Studio C', name: 'Studio C', color: 'bg-green-500', key: 'C' },
  ];

  const timeSlots = [
    { label: '08:00 - 09:00', start: '08:00', end: '09:00' },
    { label: '09:00 - 10:00', start: '09:00', end: '10:00' },
    { label: '10:00 - 11:00', start: '10:00', end: '11:00' },
    { label: '11:00 - 12:00', start: '11:00', end: '12:00' },
    { label: '12:00 - 13:00', start: '12:00', end: '13:00' },
    { label: '13:00 - 14:00', start: '13:00', end: '14:00' },
    { label: '14:00 - 15:00', start: '14:00', end: '15:00' },
    { label: '15:00 - 16:00', start: '15:00', end: '16:00' },
    { label: '16:00 - 17:00', start: '16:00', end: '17:00' },
    { label: '17:00 - 18:00', start: '17:00', end: '18:00' },
    { label: '18:00 - 19:00', start: '18:00', end: '19:00' },
    { label: '19:00 - 20:00', start: '19:00', end: '20:00' },
    { label: '20:00 - 21:00', start: '20:00', end: '21:00' },
    { label: '21:00 - 22:00', start: '21:00', end: '22:00' },
  ];

  // Get dates - 1 for mobile, 3 for desktop
  const getDates = useCallback(() => {
    const numDays = isMobile ? 1 : 3;
    const dates = [];
    for (let i = 0; i < numDays; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [startDate, isMobile]);

  const dates = getDates();

  const formatDateForDisplay = (date: Date) => {
    return {
      day: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' }),
    };
  };

  const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const goToPreviousDays = () => {
    const newDate = new Date(startDate);
    const daysToMove = isMobile ? 1 : 3;
    newDate.setDate(startDate.getDate() - daysToMove);
    // Don't go before today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (newDate >= today) {
      setStartDate(newDate);
    }
  };

  const goToNextDays = () => {
    const newDate = new Date(startDate);
    const daysToMove = isMobile ? 1 : 3;
    newDate.setDate(startDate.getDate() + daysToMove);
    // Don't go beyond the advance booking limit
    const maxDate = getMaxDate();
    if (newDate <= maxDate) {
      setStartDate(newDate);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    if (!isNaN(newDate.getTime())) {
      // Ensure date is within allowed range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const maxDate = getMaxDate();
      if (newDate >= today && newDate <= maxDate) {
        setStartDate(newDate);
      }
    }
  };

  // Helper function to check if a time slot is in the past
  const isSlotInPast = (date: Date, timeStart: string): boolean => {
    const now = new Date();
    const slotDate = new Date(date);

    // If the date is before today, it's in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    slotDate.setHours(0, 0, 0, 0);

    if (slotDate < today) {
      return true;
    }

    // If it's today, check the time
    if (slotDate.getTime() === today.getTime()) {
      const [hours, minutes] = timeStart.split(':').map(Number);
      const slotTimeInMinutes = hours * 60 + minutes;
      const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();

      // Slot is past if its start time has already passed
      return slotTimeInMinutes <= currentTimeInMinutes;
    }

    return false;
  };

  // Check if a slot is available
  const getSlotStatus = (date: Date, studioKey: string, timeSlot: { label: string; start: string }): SlotStatus => {
    const dateKey = formatDateKey(date);

    // First check if slot is in the past
    if (isSlotInPast(date, timeSlot.start)) {
      return 'past';
    }

    // Then check availability data
    const status = availability[dateKey]?.[studioKey]?.[timeSlot.label];
    if (status) {
      return status;
    }

    return 'unavailable';
  };

  // Fetch availability from API
  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true);
      try {
        const currentDates = getDates();
        const availabilityData: AvailabilityData = {};

        // Initialize empty data structure
        currentDates.forEach(date => {
          const dateKey = formatDateKey(date);
          availabilityData[dateKey] = {
            A: {},
            B: {},
            C: {},
          };
        });

        // Fetch availability and bookings for each studio and date in parallel
        const fetchPromises: Promise<{ studioId: string; studioKey: string; dateKey: string; slots: TimeSlotType[] }>[] = [];
        const bookingPromises: Promise<{ dateKey: string; bookings: BookingSlot[] }>[] = [];

        for (const studio of studios) {
          for (const date of currentDates) {
            const dateKey = formatDateKey(date);
            fetchPromises.push(
              fetch(`/api/availability?studio=${encodeURIComponent(studio.id)}&date=${dateKey}`)
                .then(async (response) => {
                  if (response.ok) {
                    const slots: TimeSlotType[] = await safeJsonParse(response);
                    return { studioId: studio.id, studioKey: studio.key, dateKey, slots };
                  }
                  return { studioId: studio.id, studioKey: studio.key, dateKey, slots: [] };
                })
                .catch((err) => {
                  console.error(`Error fetching availability for ${studio.id} on ${dateKey}:`, err);
                  return { studioId: studio.id, studioKey: studio.key, dateKey, slots: [] };
                })
            );
          }
        }

        // Fetch bookings for each date using display bookings endpoint
        for (const date of currentDates) {
          const dateKey = formatDateKey(date);
          bookingPromises.push(
            fetch(`/api/display/bookings?date=${dateKey}`)
              .then(async (response) => {
                if (response.ok) {
                  const data = await safeJsonParse(response);
                  return { dateKey, bookings: data.bookings || [] };
                }
                return { dateKey, bookings: [] };
              })
              .catch((err) => {
                console.error(`Error fetching bookings for ${dateKey}:`, err);
                return { dateKey, bookings: [] };
              })
          );
        }

        const [availabilityResults, bookingResults] = await Promise.all([
          Promise.all(fetchPromises),
          Promise.all(bookingPromises)
        ]);

        // Create a map of booked slots
        const bookedSlotsMap: { [key: string]: boolean } = {};
        bookingResults.forEach(({ dateKey, bookings }) => {
          bookings.forEach((booking: BookingSlot) => {
            // Map studio name to key
            const studioKey = booking.studio === 'Studio A' ? 'A' :
                              booking.studio === 'Studio B' ? 'B' :
                              booking.studio === 'Studio C' ? 'C' : '';
            if (studioKey) {
              // Mark all time slots that overlap with this booking as booked
              timeSlots.forEach(slot => {
                const slotStartMinutes = parseInt(slot.start.split(':')[0]) * 60 + parseInt(slot.start.split(':')[1]);
                const slotEndMinutes = parseInt(slot.end.split(':')[0]) * 60 + parseInt(slot.end.split(':')[1]);
                const bookingStartMinutes = parseInt(booking.start_time.split(':')[0]) * 60 + parseInt(booking.start_time.split(':')[1]);
                const bookingEndMinutes = parseInt(booking.end_time.split(':')[0]) * 60 + parseInt(booking.end_time.split(':')[1]);

                // Check if slot overlaps with booking
                if (slotStartMinutes < bookingEndMinutes && slotEndMinutes > bookingStartMinutes) {
                  bookedSlotsMap[`${dateKey}-${studioKey}-${slot.label}`] = true;
                }
              });
            }
          });
        });

        // Process availability results
        availabilityResults.forEach(({ studioKey, dateKey, slots }) => {
          timeSlots.forEach(timeSlot => {
            const slotKey = `${dateKey}-${studioKey}-${timeSlot.label}`;

            // Check if this slot is booked
            if (bookedSlotsMap[slotKey]) {
              availabilityData[dateKey][studioKey][timeSlot.label] = 'booked';
            } else {
              // Check if slot is available from API
              const isAvailable = slots.some(
                (slot: TimeSlotType) => slot.start === timeSlot.start && slot.end === timeSlot.end
              );
              availabilityData[dateKey][studioKey][timeSlot.label] = isAvailable ? 'available' : 'unavailable';
            }
          });
        });

        setAvailability(availabilityData);
        
        // Store bookings data for block rendering
        const bookingsMap: { [dateKey: string]: BookingSlot[] } = {};
        bookingResults.forEach(({ dateKey, bookings }) => {
          bookingsMap[dateKey] = bookings;
        });
        setBookingsData(bookingsMap);
      } catch (error) {
        console.error('Error fetching availability:', error);
      }
      setLoading(false);
    };

    fetchAvailability();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, isMobile]);

  const canGoPrevious = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const prevDate = new Date(startDate);
    const daysToMove = isMobile ? 1 : 3;
    prevDate.setDate(startDate.getDate() - daysToMove);
    return prevDate >= today;
  };

  const canGoNext = () => {
    const maxDate = getMaxDate();
    const nextDate = new Date(startDate);
    const daysToMove = isMobile ? 1 : 3;
    nextDate.setDate(startDate.getDate() + daysToMove);
    return nextDate <= maxDate;
  };

  // Get the max date as ISO string for the date input
  const getMaxDateString = () => {
    return getMaxDate().toISOString().split('T')[0];
  };

  // Check if the selected studio is shown in the highlighted color
  const isSelectedStudio = (studioId: string) => {
    return draft.studio === studioId;
  };

  // Time slots array for the grid (8 AM to 10 PM)
  const timeSlotHours = Array.from({ length: 14 }, (_, i) => 8 + i);
  const startHour = 8;
  const endHour = 22;

  // Current time calculations
  const currentHour = currentTime.getHours();
  const currentMinutes = currentTime.getMinutes();

  // Calculate current time position as percentage (vertical)
  const getCurrentTimePosition = () => {
    const totalMinutes = (currentHour - startHour) * 60 + currentMinutes;
    const totalDuration = (endHour - startHour) * 60;
    return (totalMinutes / totalDuration) * 100;
  };

  // Check if a time slot is in the past for a given date
  const isPastSlotForDate = (hour: number, date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    if (checkDate < today) return true;
    if (checkDate.getTime() === today.getTime()) {
      return hour < currentHour;
    }
    return false;
  };

  // Build consolidated booking blocks for each date and studio
  const getStudioBlocks = useMemo(() => {
    const result: Record<string, Record<string, Array<{ start: number; end: number; booking: BookingSlot }>>> = {};
    
    dates.forEach(date => {
      const dateKey = formatDateKey(date);
      result[dateKey] = {};
      
      studios.forEach((studio) => {
        const studioBookings = (bookingsData[dateKey] || [])
          .filter((b) => b.studio === studio.id)
          .sort((a, b) => a.start_time.localeCompare(b.start_time));
        
        const blocks: Array<{ start: number; end: number; booking: BookingSlot }> = [];
        let currentBlock: { start: number; end: number; booking: BookingSlot } | null = null;

        studioBookings.forEach((b) => {
          const start = parseInt(b.start_time.split(':')[0], 10);
          const end = parseInt(b.end_time.split(':')[0], 10);
          
          if (currentBlock && currentBlock.end === start && currentBlock.booking.phone_number === b.phone_number) {
            // Merge consecutive bookings from same user
            currentBlock.end = end;
          } else {
            if (currentBlock) blocks.push(currentBlock);
            currentBlock = { start, end, booking: b };
          }
        });
        
        if (currentBlock) blocks.push(currentBlock);
        result[dateKey][studio.id] = blocks;
      });
    });
    
    return result;
  }, [bookingsData, dates, studios]);

  const getStudioColor = (studioId: string) => {
    if (studioId === 'Studio A') return 'bg-blue-600';
    if (studioId === 'Studio B') return 'bg-amber-600';
    if (studioId === 'Studio C') return 'bg-green-600';
    return 'bg-zinc-600';
  };

  const getStudioHeaderColor = (studioId: string) => {
    if (studioId === 'Studio A') return 'bg-blue-500';
    if (studioId === 'Studio B') return 'bg-amber-700';
    if (studioId === 'Studio C') return 'bg-green-500';
    return 'bg-zinc-600';
  };

  // Format hour to 12-hour format
  const formatTimeLabel = (hour: number) => {
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  return (
    <StepLayout
      title="Check Availability"
      subtitle={`View available slots for ${draft.studio || 'all studios'}`}
      showNext={true}
      nextLabel="Select Time"
    >
      <div className="flex flex-col h-full overflow-hidden">
        {/* Date Navigation - Compact */}
        <div className="flex items-center justify-between gap-2 mb-2 flex-shrink-0">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 border border-white/10 rounded-lg">
            <Calendar className="w-3 h-3 text-zinc-400" />
            <input
              type="date"
              value={startDate.toISOString().split('T')[0]}
              onChange={handleDateChange}
              min={new Date().toISOString().split('T')[0]}
              max={getMaxDateString()}
              className="bg-transparent text-white text-[11px] outline-none cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-1">
            <motion.button
              onClick={goToPreviousDays}
              disabled={!canGoPrevious()}
              className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:bg-white/10 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              whileHover={{ scale: canGoPrevious() ? 1.05 : 1 }}
              whileTap={{ scale: canGoPrevious() ? 0.95 : 1 }}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </motion.button>
            <motion.button
              onClick={goToNextDays}
              disabled={!canGoNext()}
              className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:bg-white/10 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              whileHover={{ scale: canGoNext() ? 1.05 : 1 }}
              whileTap={{ scale: canGoNext() ? 0.95 : 1 }}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </div>

        {/* Legend - Ultra Compact */}
        <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2 flex-shrink-0">
          {studios.map((studio) => (
            <div 
              key={studio.id} 
              className={`flex items-center gap-1 ${isSelectedStudio(studio.id) ? 'opacity-100' : 'opacity-50'}`}
            >
              <div className={`w-2.5 h-2.5 rounded ${studio.color} ${isSelectedStudio(studio.id) ? 'ring-1 ring-white' : ''}`} />
              <span className={`text-[10px] ${isSelectedStudio(studio.id) ? 'text-white font-medium' : 'text-zinc-400'}`}>
                {studio.key}{isSelectedStudio(studio.id) && '*'}
              </span>
            </div>
          ))}
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded bg-zinc-700 border border-zinc-600" />
            <span className="text-zinc-400 text-[10px]">Open</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded bg-zinc-900 border border-zinc-700" />
            <span className="text-zinc-400 text-[10px]">Past</span>
          </div>
        </div>

        {/* Availability Display - Like Display Page */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
          </div>
        ) : (
          <div className="flex-1 flex gap-2 overflow-hidden">
            {dates.map((date, dateIndex) => {
              const dateKey = formatDateKey(date);
              const formatted = formatDateForDisplay(date);
              const isToday = formatDateKey(new Date()) === dateKey;
              const showCurrentTimeLine = isToday && currentHour >= startHour && currentHour < endHour;
              const currentTimePosition = getCurrentTimePosition();

              return (
                <div key={dateIndex} className="flex-1 flex flex-col overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900">
                  {/* Date Header */}
                  <div className="h-10 flex-shrink-0 flex items-center justify-center bg-zinc-800 border-b border-zinc-700 rounded-t-lg">
                    <div className="text-center">
                      <span className="text-sm font-bold text-white">{formatted.day}</span>
                      <span className="text-zinc-400 text-xs ml-1">{formatted.month}</span>
                    </div>
                  </div>

                  {/* Studio Column Headers */}
                  <div className="h-7 flex-shrink-0 flex bg-zinc-800/50 border-b border-zinc-700">
                    <div className="w-10 md:w-12 flex-shrink-0 px-1 flex items-center justify-center text-[9px] md:text-[10px] font-bold text-zinc-400 border-r border-zinc-700">
                      TIME
                    </div>
                    {studios.map((studio) => (
                      <div 
                        key={studio.id} 
                        className={`flex-1 px-1 flex items-center justify-center text-[10px] md:text-xs font-bold text-white border-r border-zinc-700 last:border-r-0 ${getStudioHeaderColor(studio.id)} ${isSelectedStudio(studio.id) ? 'ring-1 ring-inset ring-white/50' : ''}`}
                      >
                        {studio.key}
                      </div>
                    ))}
                  </div>

                  {/* Grid Body */}
                  <div className="flex-1 flex overflow-hidden relative py-2">
                    {/* Current Time Indicator - Horizontal Line */}
                    {showCurrentTimeLine && (
                      <div 
                        className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                        style={{ top: `calc(0.5rem + ${currentTimePosition}% * (100% - 1rem) / 100%)` }}
                      >
                        <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 flex-shrink-0"></div>
                        <div className="flex-1 h-0.5 bg-red-500"></div>
                      </div>
                    )}

                    {/* Time Column */}
                    <div className="w-10 md:w-12 flex-shrink-0 flex flex-col border-r border-zinc-700 relative">
                      {timeSlotHours.map((hour) => (
                        <div 
                          key={hour} 
                          className="flex-1 relative border-b border-zinc-800 last:border-b-0 bg-zinc-900 flex items-start justify-center"
                        >
                          <span className="text-amber-400 font-semibold text-[8px] md:text-[9px] whitespace-nowrap -mt-1.5">
                            {formatTimeLabel(hour)}
                          </span>
                        </div>
                      ))}
                      {/* 10 PM label at bottom */}
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 text-amber-400 font-semibold text-[8px] md:text-[9px] whitespace-nowrap bg-zinc-900 px-0.5">
                        10 PM
                      </span>
                    </div>

                    {/* Studio Columns */}
                    {studios.map((studio) => (
                      <div key={studio.id} className={`flex-1 relative border-r border-zinc-700 last:border-r-0 ${isSelectedStudio(studio.id) ? 'bg-violet-500/5' : ''}`}>
                        {/* Grid lines for empty slots */}
                        <div className="absolute inset-0 flex flex-col">
                          {timeSlotHours.map((hour) => {
                            const isPast = isPastSlotForDate(hour, date);
                            return (
                              <div 
                                key={hour} 
                                className={`flex-1 border-b border-zinc-800 last:border-b-0 ${
                                  isPast ? 'bg-black/60' : 'bg-zinc-900/30'
                                }`}
                              />
                            );
                          })}
                        </div>

                        {/* Booking blocks - Vertical */}
                        {getStudioBlocks[dateKey]?.[studio.id]?.map((block, idx) => {
                          const topPercent = ((block.start - startHour) / timeSlotHours.length) * 100;
                          const heightPercent = ((block.end - block.start) / timeSlotHours.length) * 100;
                          const isPast = isPastSlotForDate(block.end, date);

                          return (
                            <div
                              key={idx}
                              className={`absolute left-0.5 right-0.5 ${getStudioColor(studio.id)} text-white flex flex-col items-center justify-center px-0.5 z-10 rounded shadow-lg border border-white/20 ${
                                isPast ? 'opacity-40' : ''
                              }`}
                              style={{
                                top: `${topPercent}%`,
                                height: `${heightPercent}%`,
                              }}
                            >
                              <span className="text-[8px] md:text-[10px] font-bold truncate w-full text-center">
                                Booked
                              </span>
                              {block.end - block.start > 1 && (
                                <span className="text-[7px] md:text-[8px] font-medium opacity-80 truncate w-full text-center">
                                  {block.booking.session_type || 'Session'}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>

                  {/* Bottom padding */}
                  <div className="h-2 flex-shrink-0 bg-zinc-900 rounded-b-lg border-t border-zinc-800"></div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </StepLayout>
  );
}
