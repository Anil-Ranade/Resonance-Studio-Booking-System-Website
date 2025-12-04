'use client';

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar, Clock, Loader2 } from "lucide-react";

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

interface TimeSlot {
  start: string;
  end: string;
}

interface BookingSlot {
  start_time: string;
  end_time: string;
  studio: string;
}

export default function AvailabilityPage() {
  const [startDate, setStartDate] = useState(new Date());
  const [availability, setAvailability] = useState<AvailabilityData>({});
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [advanceBookingDays, setAdvanceBookingDays] = useState(30);

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

  const studios = [
    { id: "Studio A", name: "Studio A", color: "bg-blue-500", key: "A" },
    { id: "Studio B", name: "Studio B", color: "bg-amber-700", key: "B" },
    { id: "Studio C", name: "Studio C", color: "bg-green-500", key: "C" },
  ];

  const timeSlots = [
    { label: "08:00 - 09:00", start: "08:00", end: "09:00" },
    { label: "09:00 - 10:00", start: "09:00", end: "10:00" },
    { label: "10:00 - 11:00", start: "10:00", end: "11:00" },
    { label: "11:00 - 12:00", start: "11:00", end: "12:00" },
    { label: "12:00 - 13:00", start: "12:00", end: "13:00" },
    { label: "13:00 - 14:00", start: "13:00", end: "14:00" },
    { label: "14:00 - 15:00", start: "14:00", end: "15:00" },
    { label: "15:00 - 16:00", start: "15:00", end: "16:00" },
    { label: "16:00 - 17:00", start: "16:00", end: "17:00" },
    { label: "17:00 - 18:00", start: "17:00", end: "18:00" },
    { label: "18:00 - 19:00", start: "18:00", end: "19:00" },
    { label: "19:00 - 20:00", start: "19:00", end: "20:00" },
    { label: "20:00 - 21:00", start: "20:00", end: "21:00" },
    { label: "21:00 - 22:00", start: "21:00", end: "22:00" },
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
        const fetchPromises: Promise<{ studioId: string; studioKey: string; dateKey: string; slots: { start: string; end: string; available: boolean }[] }>[] = [];
        const bookingPromises: Promise<{ dateKey: string; bookings: BookingSlot[] }>[] = [];
        
        for (const studio of studios) {
          for (const date of currentDates) {
            const dateKey = formatDateKey(date);
            fetchPromises.push(
              fetch(`/api/availability?studio=${encodeURIComponent(studio.id)}&date=${dateKey}`)
                .then(async (response) => {
                  if (response.ok) {
                    const data = await safeJsonParse(response);
                    // API returns { slots: [...], settings: {...} }
                    const slots = data.slots || [];
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
            
            // Check if this slot is booked from display bookings
            if (bookedSlotsMap[slotKey]) {
              availabilityData[dateKey][studioKey][timeSlot.label] = 'booked';
            } else {
              // Check if slot is available from API (using the available property)
              const slotFromApi = slots.find(
                (slot: { start: string; end: string; available: boolean }) => 
                  slot.start === timeSlot.start && slot.end === timeSlot.end
              );
              
              if (slotFromApi && slotFromApi.available) {
                availabilityData[dateKey][studioKey][timeSlot.label] = 'available';
              } else if (slotFromApi && !slotFromApi.available) {
                // Slot exists but is not available (could be booked or blocked)
                availabilityData[dateKey][studioKey][timeSlot.label] = 'booked';
              } else {
                availabilityData[dateKey][studioKey][timeSlot.label] = 'unavailable';
              }
            }
          });
        });
        
        setAvailability(availabilityData);
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

  return (
    <div className="h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] flex flex-col py-2 px-2 md:py-4 md:px-4 overflow-hidden">
      <div className="max-w-6xl mx-auto w-full flex flex-col h-full overflow-hidden">
        {/* Compact Header */}
        <motion.div 
          className="mb-2 md:mb-3 flex-shrink-0"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4">
            <div className="flex items-center gap-4">
              <Link 
                href="/home"
                className="inline-flex items-center gap-1 text-zinc-400 hover:text-white transition-colors text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </Link>
              <h1 className="text-xl md:text-2xl font-bold text-white">Studio Availability</h1>
            </div>

            {/* Date Navigation */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                <input
                  type="date"
                  value={startDate.toISOString().split('T')[0]}
                  onChange={handleDateChange}
                  min={new Date().toISOString().split('T')[0]}
                  max={getMaxDateString()}
                  className="bg-transparent text-white text-xs outline-none cursor-pointer"
                />
              </div>
              <motion.button
                onClick={goToPreviousDays}
                disabled={!canGoPrevious()}
                className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:bg-white/10 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                whileHover={{ scale: canGoPrevious() ? 1.05 : 1 }}
                whileTap={{ scale: canGoPrevious() ? 0.95 : 1 }}
              >
                <ChevronLeft className="w-4 h-4" />
              </motion.button>
              <motion.button
                onClick={goToNextDays}
                disabled={!canGoNext()}
                className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:bg-white/10 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                whileHover={{ scale: canGoNext() ? 1.05 : 1 }}
                whileTap={{ scale: canGoNext() ? 0.95 : 1 }}
              >
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
          
          {/* Legend - Compact */}
          <div className="flex flex-wrap items-center gap-3 md:gap-4 mt-2">
            {studios.map((studio) => (
              <div key={studio.id} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded ${studio.color}`} />
                <span className="text-zinc-400 text-xs">{studio.key}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-zinc-700 border border-zinc-600" />
              <span className="text-zinc-400 text-xs">Open</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-zinc-900 border border-zinc-700" />
              <span className="text-zinc-400 text-xs">Past</span>
            </div>
          </div>
        </motion.div>

        {/* Availability Table */}
        <motion.div 
          className="glass rounded-xl overflow-hidden flex-1 min-h-0 flex flex-col"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
            </div>
          ) : (
          <div className="overflow-auto flex-1">
            <table className="w-full mb-2">
              <thead className="sticky top-0 z-10 bg-zinc-900/95 backdrop-blur-sm">
                {/* Date Headers */}
                <tr className="border-b border-white/10">
                  <th className="p-2 md:p-3 text-left" rowSpan={2}>
                    <div className="flex items-center gap-1 text-zinc-400">
                      <Clock className="w-3 h-3" />
                      <span className="font-medium text-xs">TIME</span>
                    </div>
                  </th>
                  {dates.map((date, index) => {
                    const formatted = formatDateForDisplay(date);
                    return (
                      <th 
                        key={index} 
                        colSpan={3} 
                        className={`p-2 text-center ${index < dates.length - 1 ? 'border-r border-white/10' : ''}`}
                      >
                        <div className="text-lg md:text-xl font-bold text-white">{formatted.day}</div>
                        <div className="text-zinc-400 text-xs">{formatted.month}</div>
                      </th>
                    );
                  })}
                </tr>
                {/* Studio Headers */}
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  {dates.map((_, dateIndex) => (
                    studios.map((studio, studioIndex) => (
                      <th 
                        key={`${dateIndex}-${studio.key}`} 
                        className={`p-1.5 md:p-2 text-center font-medium text-zinc-300 text-xs ${
                          studioIndex === 2 && dateIndex < dates.length - 1 ? 'border-r border-white/10' : ''
                        }`}
                      >
                        {studio.key}
                      </th>
                    ))
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((timeSlot, timeIndex) => (
                  <tr 
                    key={timeSlot.label} 
                    className={`${timeIndex < timeSlots.length - 1 ? 'border-b border-white/5' : ''} hover:bg-white/[0.02] transition-colors`}
                  >
                    <td className="p-1.5 md:p-2 text-zinc-400 font-medium whitespace-nowrap text-[10px] md:text-xs">
                      {timeSlot.start}
                    </td>
                    {dates.map((date, dateIndex) => (
                      studios.map((studio, studioIndex) => {
                        const slotStatus = getSlotStatus(date, studio.key, timeSlot);
                        const isAvailable = slotStatus === 'available';
                        const isBooked = slotStatus === 'booked';
                        const isPast = slotStatus === 'past';
                        
                        return (
                          <td 
                            key={`${dateIndex}-${studio.key}-${timeSlot.label}`}
                            className={`p-0.5 md:p-1 text-center ${
                              studioIndex === 2 && dateIndex < dates.length - 1 ? 'border-r border-white/10' : ''
                            }`}
                          >
                            <motion.div
                              className={`w-full h-5 md:h-6 rounded flex items-center justify-center text-[8px] md:text-[10px] font-medium ${
                                isAvailable 
                                  ? 'bg-zinc-800/50 border border-zinc-700/50 cursor-pointer hover:bg-zinc-700/50 text-zinc-400' 
                                  : isBooked
                                  ? `${studio.color} cursor-not-allowed text-white/80`
                                  : isPast
                                  ? 'bg-zinc-900/80 border border-zinc-800/50 cursor-not-allowed text-zinc-600'
                                  : 'bg-zinc-900/50 border border-zinc-800/30 cursor-not-allowed opacity-50'
                              } transition-all`}
                              whileHover={isAvailable ? { scale: 1.05 } : {}}
                              whileTap={isAvailable ? { scale: 0.95 } : {}}
                              onClick={() => {
                                if (isAvailable) {
                                  window.location.href = `/booking?date=${formatDateKey(date)}&studio=${encodeURIComponent(studio.id)}&time=${encodeURIComponent(timeSlot.start)}`;
                                }
                              }}
                              title={
                                isAvailable 
                                  ? `Book ${studio.name} at ${timeSlot.label}` 
                                  : isBooked 
                                  ? `${studio.name} - Booked`
                                  : isPast
                                  ? `${studio.name} - Past`
                                  : `${studio.name} - Not available`
                              }
                            >
                              {isPast && '—'}
                            </motion.div>
                          </td>
                        );
                      })
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </motion.div>

        {/* Footer - Compact */}
        <motion.div 
          className="mt-2 flex items-center justify-between gap-2 flex-shrink-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-zinc-500 text-xs">
            Click available slots to book
          </p>
          <Link href="/booking/new">
            <motion.button
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-violet-500 hover:bg-violet-600 text-white text-sm font-medium rounded-lg transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Calendar className="w-3.5 h-3.5" />
              Book
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
