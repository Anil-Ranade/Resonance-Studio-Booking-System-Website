import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

interface TimeSlot {
  start: string;
  end: string;
}

interface BlockedSlot {
  start_time: string;
  end_time: string;
}

interface Booking {
  start_time: string;
  end_time: string;
}

interface BookingSettings {
  minBookingDuration: number;
  maxBookingDuration: number;
  bookingBuffer: number;
  advanceBookingDays: number;
  defaultOpenTime: string;
  defaultCloseTime: string;
}

async function getBookingSettings(): Promise<BookingSettings> {
  const defaults: BookingSettings = {
    minBookingDuration: 1,
    maxBookingDuration: 8,
    bookingBuffer: 0,
    advanceBookingDays: 30,
    defaultOpenTime: '08:00',
    defaultCloseTime: '22:00',
  };

  try {
    const { data: settings } = await supabaseServer
      .from('booking_settings')
      .select('key, value');

    if (settings) {
      for (const setting of settings) {
        switch (setting.key) {
          case 'min_booking_duration':
            defaults.minBookingDuration = Number(setting.value);
            break;
          case 'max_booking_duration':
            defaults.maxBookingDuration = Number(setting.value);
            break;
          case 'booking_buffer':
            defaults.bookingBuffer = Number(setting.value);
            break;
          case 'advance_booking_days':
            defaults.advanceBookingDays = Number(setting.value);
            break;
          case 'default_open_time':
            defaults.defaultOpenTime = String(setting.value).replace(/"/g, '');
            break;
          case 'default_close_time':
            defaults.defaultCloseTime = String(setting.value).replace(/"/g, '');
            break;
        }
      }
    }
  } catch (error) {
    console.error('Failed to fetch booking settings:', error);
  }

  return defaults;
}

function formatTime(hours: number, minutes: number): string {
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return { hours, minutes };
}

function timeToMinutes(timeStr: string): number {
  const { hours, minutes } = parseTime(timeStr);
  return hours * 60 + minutes;
}

function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return formatTime(hours, minutes);
}

function splitIntoHourChunks(startTime: string, endTime: string): TimeSlot[] {
  const chunks: TimeSlot[] = [];
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  for (let current = startMinutes; current < endMinutes; current += 60) {
    const chunkEnd = Math.min(current + 60, endMinutes);
    if (chunkEnd - current === 60) {
      chunks.push({
        start: minutesToTime(current),
        end: minutesToTime(chunkEnd),
      });
    }
  }

  return chunks;
}

function chunksOverlap(chunk: TimeSlot, booking: Booking, bufferMinutes: number = 0): boolean {
  const chunkStart = timeToMinutes(chunk.start);
  const chunkEnd = timeToMinutes(chunk.end);
  // Add buffer to booking times to prevent bookings too close together
  const bookingStart = timeToMinutes(booking.start_time) - bufferMinutes;
  const bookingEnd = timeToMinutes(booking.end_time) + bufferMinutes;

  return chunkStart < bookingEnd && chunkEnd > bookingStart;
}

function chunkOverlapsBlocked(chunk: TimeSlot, blockedSlot: BlockedSlot): boolean {
  const chunkStart = timeToMinutes(chunk.start);
  const chunkEnd = timeToMinutes(chunk.end);
  const blockedStart = timeToMinutes(blockedSlot.start_time);
  const blockedEnd = timeToMinutes(blockedSlot.end_time);

  return chunkStart < blockedEnd && chunkEnd > blockedStart;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const studio = searchParams.get('studio');
  const date = searchParams.get('date');

  // Validate inputs
  if (!studio || !date) {
    return NextResponse.json(
      { error: 'Missing required parameters: studio and date are required' },
      { status: 400 }
    );
  }

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return NextResponse.json(
      { error: 'Invalid date format: must be YYYY-MM-DD' },
      { status: 400 }
    );
  }

  try {
    // Fetch booking settings
    const bookingSettings = await getBookingSettings();
    
    // Validate date is within advance booking limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(date);
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + bookingSettings.advanceBookingDays);
    
    if (selectedDate > maxDate) {
      return NextResponse.json(
        { error: `Cannot book more than ${bookingSettings.advanceBookingDays} days in advance` },
        { status: 400 }
      );
    }

    // Step 1: Generate all 1-hour slots based on default operating hours
    const allChunks = splitIntoHourChunks(
      bookingSettings.defaultOpenTime,
      bookingSettings.defaultCloseTime
    );

    // Step 2: Load blocked slots for the studio and date (is_available = false means blocked)
    const { data: blockedSlots, error: blockedError } = await supabaseServer
      .from('availability_slots')
      .select('start_time, end_time')
      .eq('studio', studio)
      .eq('date', date)
      .eq('is_available', false);

    if (blockedError) {
      return NextResponse.json(
        { error: `Failed to fetch blocked slots: ${blockedError.message}` },
        { status: 500 }
      );
    }

    // Step 3: Query bookings where studio/date match and status is 'pending' or 'confirmed'
    // Only active bookings should block slots (not cancelled, completed, or no_show)
    const { data: bookings, error: bookingsError } = await supabaseServer
      .from('bookings')
      .select('start_time, end_time')
      .eq('studio', studio)
      .eq('date', date)
      .in('status', ['pending', 'confirmed']);

    if (bookingsError) {
      return NextResponse.json(
        { error: `Failed to fetch bookings: ${bookingsError.message}` },
        { status: 500 }
      );
    }

    // Step 4: Filter out blocked slots
    let availableChunks = allChunks.filter((chunk) => {
      if (!blockedSlots || blockedSlots.length === 0) return true;
      return !blockedSlots.some((blocked: BlockedSlot) => 
        chunkOverlapsBlocked(chunk, blocked)
      );
    });

    // Step 5: Remove chunks that overlap confirmed bookings (with buffer)
    availableChunks = availableChunks.filter((chunk) => {
      if (!bookings || bookings.length === 0) return true;
      return !bookings.some((booking: Booking) => 
        chunksOverlap(chunk, booking, bookingSettings.bookingBuffer)
      );
    });

    // Sort chunks by start time
    availableChunks.sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));

    // Step 6: Filter out past time slots if the selected date is today
    const isToday = selectedDate.toDateString() === today.toDateString();
    if (isToday) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinutes = now.getMinutes();
      // Calculate current time in minutes since midnight
      const currentTimeInMinutes = currentHour * 60 + currentMinutes;
      
      // Filter out slots that have already ended
      // A slot is considered past if its END time is before or equal to current time
      // This allows users to see slots that are currently in progress or about to start
      availableChunks = availableChunks.filter((chunk) => {
        const slotEndMinutes = timeToMinutes(chunk.end);
        // Only show slots that haven't ended yet (end time is after current time)
        return slotEndMinutes > currentTimeInMinutes;
      });
    }

    return NextResponse.json(availableChunks);
  } catch (error) {
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
