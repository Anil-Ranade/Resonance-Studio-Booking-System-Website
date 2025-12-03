'use client';

import { useEffect, useState, useMemo } from 'react';
import { Loader2 } from 'lucide-react';

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
  status: 'pending' | 'confirmed';
  total_amount: number | null;
  notes: string | null;
}

export default function DisplayPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [studios, setStudios] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Always use today's date
  const todayDate = new Date().toISOString().split('T')[0];

  const fetchBookings = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);

    try {
      const response = await fetch(`/api/display/bookings?date=${todayDate}`);
      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
        // Extract unique studios from bookings or use default
        const uniqueStudios = [...new Set((data.bookings || []).map((b: Booking) => b.studio))] as string[];
        setStudios(uniqueStudios.length > 0 ? uniqueStudios.sort() : ['Studio A', 'Studio B', 'Studio C']);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    // Auto-refresh every 10 seconds for real-time updates
    const interval = setInterval(() => fetchBookings(true), 10000);
    return () => clearInterval(interval);
  }, []);

  // Build consolidated booking blocks for each studio
  const studioBlocks = useMemo(() => {
    const result: Record<string, Array<{ start: number; end: number; booking: Booking }>> = {};
    
    studios.forEach((studio) => {
      const studioBookings = bookings
        .filter((b) => b.studio === studio)
        .sort((a, b) => a.start_time.localeCompare(b.start_time));
      
      const blocks: Array<{ start: number; end: number; booking: Booking }> = [];
      let currentBlock: { start: number; end: number; booking: Booking } | null = null;

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
      result[studio] = blocks;
    });
    
    return result;
  }, [bookings, studios]);

  // Time slots from 8 AM to 10 PM (14 slots)
  const timeSlots = Array.from({ length: 14 }, (_, i) => 8 + i);
  const startHour = 8;
  const endHour = 22; // 10 PM

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
  const showCurrentTimeLine = currentHour >= startHour && currentHour < endHour;

  // Check if a time slot is in the past
  const isPastSlot = (hour: number) => {
    return hour < currentHour;
  };

  const getStudioColor = (studio: string) => {
    if (studio === 'Studio A') return 'bg-blue-600';
    if (studio === 'Studio B') return 'bg-amber-600';
    if (studio === 'Studio C') return 'bg-green-600';
    return 'bg-zinc-600';
  };

  // Format hour to 12-hour format
  const formatTimeLabel = (hour: number) => {
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  // Format date for display
  const formatDisplayDate = () => {
    return currentTime.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Format time for display (12-hour with seconds)
  const formatDisplayTime = () => {
    return currentTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  // Mask phone number: show last 4 digits
  const maskPhoneNumber = (phone: string) => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.length >= 4) {
      return `***${digits.slice(-4)}`;
    }
    return phone;
  };

  return (
    <div className="h-screen w-screen bg-[#0a0a0f] flex flex-col overflow-hidden">
      {/* Date and Time Display */}
      <div className="h-16 flex items-center justify-center gap-8 bg-zinc-900/50 border-b border-zinc-800 flex-shrink-0">
        <span className="text-2xl font-semibold text-white">
          {formatDisplayDate()}
        </span>
        <span className="text-3xl font-bold text-amber-400 tabular-nums">
          {formatDisplayTime()}
        </span>
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
                <div key={studio} className={`flex-1 px-4 flex items-center justify-center text-xl font-bold text-white border-r border-zinc-700 last:border-r-0 ${getStudioColor(studio)}`}>
                  {studio}
                </div>
              ))}
            </div>
          
            {/* Grid Body */}
            <div className="flex-1 flex overflow-hidden relative py-4">
              {/* Current Time Indicator - Horizontal Line */}
              {showCurrentTimeLine && (
                <div 
                  className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                  style={{ top: `calc(1rem + ${currentTimePosition}% * (100% - 2rem) / 100%)` }}
                >
                  <div className="w-3 h-3 rounded-full bg-red-500 -ml-1.5 flex-shrink-0"></div>
                  <div className="flex-1 h-0.5 bg-red-500"></div>
                </div>
              )}
              
              {/* Time Column */}
              <div className="w-[80px] flex-shrink-0 flex flex-col border-r border-zinc-700 relative">
                {timeSlots.map((hour, index) => (
                  <div 
                    key={hour} 
                    className="flex-1 relative border-b border-zinc-800 last:border-b-0 bg-zinc-900 flex items-start justify-center"
                  >
                    <span className="text-amber-400 font-semibold text-sm whitespace-nowrap -mt-2.5">
                      {formatTimeLabel(hour)}
                    </span>
                  </div>
                ))}
                {/* 10 PM label at bottom */}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 text-amber-400 font-semibold text-sm whitespace-nowrap bg-zinc-900 px-1">
                  10 PM
                </span>
              </div>
              
              {/* Studio Columns */}
              {studios.map((studio) => (
                <div key={studio} className="flex-1 relative border-r border-zinc-700 last:border-r-0">
                  {/* Grid lines for empty slots */}
                  <div className="absolute inset-0 flex flex-col">
                    {timeSlots.map((hour) => {
                      const isPast = isPastSlot(hour);
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
                  {studioBlocks[studio]?.map((block, idx) => {
                    const topPercent = ((block.start - startHour) / timeSlots.length) * 100;
                    const heightPercent = ((block.end - block.start) / timeSlots.length) * 100;
                    const isPast = block.end <= currentHour;
                    
                    return (
                      <div
                        key={idx}
                        className={`absolute left-1 right-1 ${getStudioColor(studio)} text-white flex flex-col items-center justify-center px-2 z-10 rounded-lg shadow-lg border-2 border-white/20 ${
                          isPast ? 'opacity-40' : ''
                        }`}
                        style={{
                          top: `${topPercent}%`,
                          height: `${heightPercent}%`,
                        }}
                      >
                        <span className="text-lg font-bold truncate w-full text-center">
                          {maskPhoneNumber(block.booking.phone_number)}
                        </span>
                        <span className="text-sm font-medium opacity-90 truncate w-full text-center">
                          {block.booking.session_type || 'Session'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Bottom padding */}
            <div className="h-3 flex-shrink-0 bg-zinc-900 rounded-b-xl border-t border-zinc-800"></div>
          </div>
        </div>
      )}
    </div>
  );
}
