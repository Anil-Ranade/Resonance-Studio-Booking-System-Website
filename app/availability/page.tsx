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

type AvailabilityData = {
  [date: string]: {
    [studio: string]: {
      [time: string]: boolean;
    };
  };
};

interface TimeSlot {
  start: string;
  end: string;
}

export default function AvailabilityPage() {
  const [startDate, setStartDate] = useState(new Date());
  const [availability, setAvailability] = useState<AvailabilityData>({});
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const studios = [
    { id: "Studio A", name: "Studio A", color: "bg-blue-500", key: "A" },
    { id: "Studio B", name: "Studio B", color: "bg-amber-500", key: "B" },
    { id: "Studio C", name: "Studio C", color: "bg-emerald-500", key: "C" },
  ];

  const timeSlots = [
    { label: "8-9 AM", start: "08:00", end: "09:00" },
    { label: "9-10 AM", start: "09:00", end: "10:00" },
    { label: "10-11 AM", start: "10:00", end: "11:00" },
    { label: "11 AM-12 PM", start: "11:00", end: "12:00" },
    { label: "12-1 PM", start: "12:00", end: "13:00" },
    { label: "1-2 PM", start: "13:00", end: "14:00" },
    { label: "2-3 PM", start: "14:00", end: "15:00" },
    { label: "3-4 PM", start: "15:00", end: "16:00" },
    { label: "4-5 PM", start: "16:00", end: "17:00" },
    { label: "5-6 PM", start: "17:00", end: "18:00" },
    { label: "6-7 PM", start: "18:00", end: "19:00" },
    { label: "7-8 PM", start: "19:00", end: "20:00" },
    { label: "8-9 PM", start: "20:00", end: "21:00" },
    { label: "9-10 PM", start: "21:00", end: "22:00" },
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
    setStartDate(newDate);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    if (!isNaN(newDate.getTime())) {
      setStartDate(newDate);
    }
  };

  // Check if a slot is available
  const isSlotAvailable = (date: Date, studioKey: string, timeLabel: string): boolean | null => {
    const dateKey = formatDateKey(date);
    // Returns: true = available, false = booked, null = no availability set
    if (availability[dateKey]?.[studioKey]?.[timeLabel] !== undefined) {
      return availability[dateKey][studioKey][timeLabel];
    }
    return null; // No availability data means slot is not available for booking
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

        // Fetch availability for each studio and date in parallel
        const fetchPromises: Promise<{ studioId: string; studioKey: string; dateKey: string; slots: TimeSlot[] }>[] = [];
        for (const studio of studios) {
          for (const date of currentDates) {
            const dateKey = formatDateKey(date);
            fetchPromises.push(
              fetch(`/api/availability?studio=${encodeURIComponent(studio.id)}&date=${dateKey}`)
                .then(async (response) => {
                  if (response.ok) {
                    const slots: TimeSlot[] = await safeJsonParse(response);
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
        
        const results = await Promise.all(fetchPromises);
        
        // Process results
        results.forEach(({ studioKey, dateKey, slots }) => {
          // Mark available slots based on API response
          // If a slot is returned by API, it's available for booking
          // If not returned, it's either not configured or already booked
          timeSlots.forEach(timeSlot => {
            const isAvailable = slots.some(
              (slot: TimeSlot) => slot.start === timeSlot.start && slot.end === timeSlot.end
            );
            availabilityData[dateKey][studioKey][timeSlot.label] = isAvailable;
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

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link 
            href="/home"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Studio Availability</h1>
              <div className="flex flex-wrap items-center gap-4 md:gap-6">
                {studios.map((studio) => (
                  <div key={studio.id} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded ${studio.color}`} />
                    <span className="text-zinc-400 text-sm">{studio.name}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-zinc-700 border border-zinc-600" />
                  <span className="text-zinc-400 text-sm">Available</span>
                </div>
              </div>
            </div>

            {/* Date Navigation */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                <Calendar className="w-4 h-4 text-zinc-400" />
                <input
                  type="date"
                  value={startDate.toISOString().split('T')[0]}
                  onChange={handleDateChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="bg-transparent text-white text-sm outline-none cursor-pointer"
                />
              </div>
              <motion.button
                onClick={goToPreviousDays}
                disabled={!canGoPrevious()}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:bg-white/10 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                whileHover={{ scale: canGoPrevious() ? 1.05 : 1 }}
                whileTap={{ scale: canGoPrevious() ? 0.95 : 1 }}
              >
                <ChevronLeft className="w-5 h-5" />
              </motion.button>
              <motion.button
                onClick={goToNextDays}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:bg-white/10 hover:text-white transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Availability Table */}
        <motion.div 
          className="glass rounded-2xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                {/* Date Headers */}
                <tr className="border-b border-white/10">
                  <th className="p-4 text-left" rowSpan={2}>
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">TIME</span>
                    </div>
                  </th>
                  {dates.map((date, index) => {
                    const formatted = formatDateForDisplay(date);
                    return (
                      <th 
                        key={index} 
                        colSpan={3} 
                        className={`p-4 text-center ${index < dates.length - 1 ? 'border-r border-white/10' : ''}`}
                      >
                        <div className="text-2xl font-bold text-white">{formatted.day}</div>
                        <div className="text-zinc-400 text-sm">{formatted.month}</div>
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
                        className={`p-3 text-center font-medium text-zinc-300 ${
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
                    <td className="p-4 text-zinc-400 font-medium whitespace-nowrap">
                      {timeSlot.label}
                    </td>
                    {dates.map((date, dateIndex) => (
                      studios.map((studio, studioIndex) => {
                        const availableStatus = isSlotAvailable(date, studio.key, timeSlot.label);
                        // null = no slot configured, true = available, false = booked
                        const isAvailable = availableStatus === true;
                        const isBooked = availableStatus === false;
                        const noSlot = availableStatus === null;
                        
                        return (
                          <td 
                            key={`${dateIndex}-${studio.key}-${timeSlot.label}`}
                            className={`p-2 text-center ${
                              studioIndex === 2 && dateIndex < dates.length - 1 ? 'border-r border-white/10' : ''
                            }`}
                          >
                            <motion.div
                              className={`w-full h-8 rounded-lg ${
                                isAvailable 
                                  ? 'bg-zinc-800/50 border border-zinc-700/50 cursor-pointer hover:bg-zinc-700/50' 
                                  : isBooked
                                  ? `${studio.color} cursor-not-allowed`
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
                                  : `${studio.name} - Not available`
                              }
                            />
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

        {/* Legend & Info */}
        <motion.div 
          className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-zinc-500 text-sm">
            Click on an available slot to book. Colored slots are already booked.
          </p>
          <Link href="/booking">
            <motion.button
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-violet-500 hover:bg-violet-600 text-white font-medium rounded-xl transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Calendar className="w-4 h-4" />
              Book a Session
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
