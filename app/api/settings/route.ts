import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

interface BookingSettings {
  minBookingDuration: number;
  maxBookingDuration: number;
  bookingBuffer: number;
  advanceBookingDays: number;
  defaultOpenTime: string;
  defaultCloseTime: string;
}

// GET /api/settings - Get booking settings (public endpoint for frontend)
export async function GET() {
  try {
    const { data: settings, error } = await supabaseServer
      .from('booking_settings')
      .select('key, value');

    if (error) {
      // If table doesn't exist or other error, return defaults
      console.error('[Settings API] Error fetching settings:', error);
      return NextResponse.json({
        minBookingDuration: 1,
        maxBookingDuration: 8,
        bookingBuffer: 0,
        advanceBookingDays: 30,
        defaultOpenTime: '08:00',
        defaultCloseTime: '22:00',
      });
    }

    // Transform array of key-value pairs into object with defaults
    const settingsObject: BookingSettings = {
      minBookingDuration: 1,
      maxBookingDuration: 8,
      bookingBuffer: 0,
      advanceBookingDays: 30,
      defaultOpenTime: '08:00',
      defaultCloseTime: '22:00',
    };

    if (settings) {
      for (const setting of settings) {
        switch (setting.key) {
          case 'min_booking_duration':
            settingsObject.minBookingDuration = Number(setting.value);
            break;
          case 'max_booking_duration':
            settingsObject.maxBookingDuration = Number(setting.value);
            break;
          case 'booking_buffer':
            settingsObject.bookingBuffer = Number(setting.value);
            break;
          case 'advance_booking_days':
            settingsObject.advanceBookingDays = Number(setting.value);
            break;
          case 'default_open_time':
            settingsObject.defaultOpenTime = String(setting.value).replace(/"/g, '');
            break;
          case 'default_close_time':
            settingsObject.defaultCloseTime = String(setting.value).replace(/"/g, '');
            break;
        }
      }
    }

    return NextResponse.json(settingsObject);
  } catch (error) {
    console.error('[Settings API] Error:', error);
    // Return defaults on error
    return NextResponse.json({
      minBookingDuration: 1,
      maxBookingDuration: 8,
      bookingBuffer: 0,
      advanceBookingDays: 30,
      defaultOpenTime: '08:00',
      defaultCloseTime: '22:00',
    });
  }
}
