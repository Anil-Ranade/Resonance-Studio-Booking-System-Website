'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
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

interface ConsolidatedSlot {
  id: string;
  studio: string;
  startTime: string;
  endTime: string;
  name: string | null;
  phone_number: string;
  session_type: string | null;
  session_details: string | null;
  status: 'pending' | 'confirmed';
  slotCount: number;
  durationHours: number;
  totalAmount: number | null;
  notes: string | null;
}

export default function TodaysBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [studios, setStudios] = useState<string[]>([]);
  const [date, setDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await fetch('/api/todays-bookings');
      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
        setStudios(data.studios || []);
        setDate(data.date || '');
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    // Auto-refresh every 2 minutes
    const interval = setInterval(() => fetchBookings(true), 120000);
    return () => clearInterval(interval);
  }, []);

  // Helper to calculate duration in hours from time strings
  const calculateDuration = (startTime: string, endTime: string): number => {
    const [startHour] = startTime.split(':').map(Number);
    const [endHour] = endTime.split(':').map(Number);
    return endHour - startHour;
  };

  // Consolidate consecutive slots for each studio
  const consolidatedBookings = useMemo(() => {
    const result: Record<string, ConsolidatedSlot[]> = {};

    studios.forEach((studio) => {
      const studioBookings = bookings
        .filter((b) => b.studio === studio)
        .sort((a, b) => a.start_time.localeCompare(b.start_time));

      const consolidated: ConsolidatedSlot[] = [];
      let currentSlot: ConsolidatedSlot | null = null;

      studioBookings.forEach((booking) => {
        if (
          currentSlot &&
          currentSlot.endTime === booking.start_time &&
          currentSlot.phone_number === booking.phone_number
        ) {
          // Consecutive slot from same user - merge
          currentSlot.endTime = booking.end_time;
          currentSlot.slotCount += 1;
          currentSlot.durationHours = calculateDuration(currentSlot.startTime, booking.end_time);
          if (booking.total_amount) {
            currentSlot.totalAmount =
              (currentSlot.totalAmount || 0) + booking.total_amount;
          }
          // Use session_type/details from first booking or update if more specific
          if (!currentSlot.session_type && booking.session_type) {
            currentSlot.session_type = booking.session_type;
          }
          if (!currentSlot.session_details && booking.session_details) {
            currentSlot.session_details = booking.session_details;
          }
          if (!currentSlot.notes && booking.notes) {
            currentSlot.notes = booking.notes;
          }
          // Always take the name if available
          if (!currentSlot.name && booking.name) {
            currentSlot.name = booking.name;
          }
        } else {
          // New slot or different user
          if (currentSlot) {
            consolidated.push(currentSlot);
          }
          const duration = calculateDuration(booking.start_time, booking.end_time);
          currentSlot = {
            id: booking.id,
            studio: booking.studio,
            startTime: booking.start_time,
            endTime: booking.end_time,
            name: booking.name,
            phone_number: booking.phone_number,
            session_type: booking.session_type,
            session_details: booking.session_details,
            status: booking.status,
            slotCount: 1,
            durationHours: duration,
            totalAmount: booking.total_amount,
            notes: booking.notes,
          };
        }
      });

      if (currentSlot) {
        consolidated.push(currentSlot);
      }

      result[studio] = consolidated;
    });

    return result;
  }, [bookings, studios]);

  const formatTime = (time: string) => {
    const [hours] = time.split(':');
    const hour = parseInt(hours, 10);
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-500 text-white';
      case 'pending':
        return 'bg-amber-500 text-white';
      default:
        return 'bg-zinc-500 text-white';
    }
  };

  const getStudioHeaderColor = (studio: string) => {
    switch (studio) {
      case 'Studio A':
        return 'bg-violet-600';
      case 'Studio B':
        return 'bg-blue-600';
      case 'Studio C':
        return 'bg-emerald-600';
      default:
        return 'bg-zinc-600';
    }
  };

  const getStudioRowColor = (studio: string) => {
    switch (studio) {
      case 'Studio A':
        return 'bg-violet-500/10';
      case 'Studio B':
        return 'bg-blue-500/10';
      case 'Studio C':
        return 'bg-emerald-500/10';
      default:
        return 'bg-zinc-500/10';
    }
  };

  const totalBookingsToday = Object.values(consolidatedBookings).reduce(
    (acc, slots) => acc + slots.length,
    0
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Calendar className="w-8 h-8 text-violet-400" />
              Today's Bookings
            </h1>
            <p className="text-zinc-400 mt-2">{formatDate(date)}</p>
          </div>
          <button
            onClick={() => fetchBookings(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
            />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-violet-400 animate-spin" />
          </div>
        ) : totalBookingsToday === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              No Bookings Today
            </h2>
            <p className="text-zinc-400">
              There are no confirmed or pending bookings for today.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-700 bg-zinc-900/80 shadow-xl">
            {/* Calendar Grid Table */}
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-bold text-zinc-200 bg-zinc-800 sticky left-0 z-10">TIME</th>
                  {studios.map((studio) => (
                    <th key={studio} className="px-4 py-3 text-center text-sm font-bold text-zinc-200 bg-zinc-800">{studio.replace('Studio ', '')}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Define time slots from 8 AM to 10 PM */}
                {(() => {
                  // Time slots from 8 to 22 (8 AM to 10 PM)
                  const timeSlots = Array.from({ length: 14 }, (_, i) => 8 + i);
                  // For each studio, build a map of hour to booking (merged)
                  // Build a map: studio -> hour -> booking block (only at start hour)
                  const studioBlocks: Record<string, Record<number, { start: number, end: number, booking: Booking }>> = {};
                  studios.forEach((studio) => {
                    const studioBookings = bookings
                      .filter((b) => b.studio === studio)
                      .sort((a, b) => a.start_time.localeCompare(b.start_time));
                    const blockMap: Record<number, { start: number, end: number, booking: Booking }> = {};
                    studioBookings.forEach((b) => {
                      const start = parseInt(b.start_time.split(':')[0], 10);
                      const end = parseInt(b.end_time.split(':')[0], 10);
                      blockMap[start] = { start, end, booking: b };
                    });
                    studioBlocks[studio] = blockMap;
                  });

                  // For each row (hour), render cells for each studio
                  // Track for each studio how many hours to skip (because of colspan)
                  const skip: Record<string, number> = {};
                  studios.forEach((studio) => { skip[studio] = 0; });

                  return timeSlots.map((slotHour) => {
                    const endHour = slotHour + 1;
                    const label = `${slotHour === 12 ? 12 : slotHour % 12} ${slotHour < 12 ? 'AM' : 'PM'} - ${endHour === 12 ? 12 : endHour % 12} ${endHour < 12 ? 'AM' : 'PM'}`;
                    return (
                      <tr key={slotHour} className="border-b border-zinc-800">
                        <td className="px-4 py-3 text-zinc-200 font-medium bg-zinc-900 sticky left-0 z-10">{label}</td>
                        {studios.map((studio) => {
                          if (skip[studio] > 0) {
                            skip[studio]--;
                            return null;
                          }
                          const block = studioBlocks[studio][slotHour];
                          if (block) {
                            const colspan = block.end - block.start;
                            skip[studio] = colspan - 1;
                            let color = '';
                            if (studio === 'Studio A') color = 'bg-violet-500';
                            if (studio === 'Studio B') color = 'bg-blue-500';
                            if (studio === 'Studio C') color = 'bg-emerald-500';
                            return (
                              <td
                                key={studio}
                                rowSpan={colspan}
                                className={`px-2 py-2 align-middle text-center ${color} text-white font-semibold text-xs border-zinc-700 border-b-0`}
                                style={{ minHeight: 48 * colspan }}
                                title={`${block.booking.name || ''}${block.booking.session_type ? ' - ' + block.booking.session_type : ''}`}
                              >
                                <div className="flex flex-col items-center justify-center w-full h-full py-2">
                                  <span className="truncate w-full">{block.booking.name || ''}</span>
                                  <span className="truncate w-full text-[11px] font-normal">{block.booking.session_type || ''}</span>
                                </div>
                              </td>
                            );
                          } else {
                            return (
                              <td key={studio} className="px-2 py-2 text-center">
                                <div className="w-8 h-6 mx-auto rounded border border-zinc-700 bg-zinc-900/60"></div>
                              </td>
                            );
                          }
                        })}
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary Footer */}
        {totalBookingsToday > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 rounded-lg border border-zinc-700 bg-zinc-900 p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-zinc-400 text-sm font-medium">Total Bookings Today</p>
                <p className="text-3xl font-bold text-white">
                  {totalBookingsToday}
                </p>
              </div>
              <div className="flex gap-8">
                {studios.map((studio) => (
                  <div key={studio} className="text-center">
                    <p className="text-zinc-400 text-sm font-medium">{studio}</p>
                    <p className="text-xl font-bold text-white">
                      {consolidatedBookings[studio]?.length || 0}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
