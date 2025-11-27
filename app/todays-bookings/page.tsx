'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Loader2,
  RefreshCw,
} from 'lucide-react';

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

export default function TodaysBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [studios, setStudios] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = async (date: string, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await fetch(`/api/todays-bookings?date=${date}`);
      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
        setStudios(data.studios || []);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings(selectedDate);
    const interval = setInterval(() => fetchBookings(selectedDate, true), 120000);
    return () => clearInterval(interval);
  }, [selectedDate]);

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

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Time slots from 8 AM to 10 PM (14 slots)
  const timeSlots = Array.from({ length: 14 }, (_, i) => 8 + i);
  const startHour = 8;

  const getStudioColor = (studio: string) => {
    if (studio === 'Studio A') return 'bg-violet-500';
    if (studio === 'Studio B') return 'bg-blue-500';
    if (studio === 'Studio C') return 'bg-emerald-500';
    return 'bg-zinc-600';
  };

  const formatTimeLabel = (hour: number) => {
    const endHour = hour + 1;
    const startLabel = `${hour === 12 ? 12 : hour % 12} ${hour < 12 ? 'AM' : 'PM'}`;
    const endLabel = `${endHour === 12 ? 12 : endHour % 12} ${endHour < 12 ? 'AM' : 'PM'}`;
    return `${startLabel} - ${endLabel}`;
  };

  return (
    <div className="h-screen w-screen bg-[#0a0a0f] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="h-12 flex items-center justify-between px-4 bg-zinc-900 border-b border-zinc-800 flex-shrink-0">
        <div className="flex items-center gap-4">
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <span className="text-white font-semibold text-lg">
            {formatDisplayDate(selectedDate)}
          </span>
        </div>
        <button
          onClick={() => fetchBookings(selectedDate, true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-violet-400 animate-spin" />
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Column Headers */}
          <div className="h-10 flex-shrink-0 flex bg-zinc-800 border-b border-zinc-700">
            <div className="w-[120px] flex-shrink-0 px-4 flex items-center text-base font-bold text-zinc-200 border-r border-zinc-700">
              TIME
            </div>
            {studios.map((studio) => (
              <div key={studio} className="flex-1 px-4 flex items-center justify-center text-xl font-bold text-zinc-200 border-r border-zinc-700 last:border-r-0">
                {studio.replace('Studio ', '')}
              </div>
            ))}
          </div>
          
          {/* Grid Body */}
          <div className="flex-1 flex overflow-hidden">
            {/* Time Column */}
            <div className="w-[120px] flex-shrink-0 flex flex-col border-r border-zinc-700">
              {timeSlots.map((hour) => (
                <div 
                  key={hour} 
                  className="flex-1 px-3 flex items-center text-zinc-200 font-medium bg-zinc-900 text-sm border-b border-zinc-800"
                >
                  {formatTimeLabel(hour)}
                </div>
              ))}
            </div>
            
            {/* Studio Columns */}
            {studios.map((studio) => (
              <div key={studio} className="flex-1 relative border-r border-zinc-700 last:border-r-0">
                {/* Grid lines for empty slots */}
                <div className="absolute inset-0 flex flex-col">
                  {timeSlots.map((hour) => (
                    <div 
                      key={hour} 
                      className="flex-1 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-center"
                    >
                      <div className="w-10 h-8 rounded border border-zinc-700/50 bg-zinc-800/30"></div>
                    </div>
                  ))}
                </div>
                
                {/* Booking blocks */}
                {studioBlocks[studio]?.map((block, idx) => {
                  const topPercent = ((block.start - startHour) / timeSlots.length) * 100;
                  const heightPercent = ((block.end - block.start) / timeSlots.length) * 100;
                  
                  return (
                    <div
                      key={idx}
                      className={`absolute left-0 right-0 ${getStudioColor(studio)} text-white flex flex-col items-center justify-center px-2 z-10`}
                      style={{
                        top: `${topPercent}%`,
                        height: `${heightPercent}%`,
                      }}
                    >
                      <span className="text-lg font-bold truncate w-full text-center">
                        {block.booking.name || ''}
                      </span>
                      <span className="text-sm font-normal opacity-90 truncate w-full text-center">
                        {block.booking.session_type || ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
