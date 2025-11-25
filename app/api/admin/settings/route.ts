import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

interface BookingSettings {
  minBookingDuration: number;
  maxBookingDuration: number;
  bookingBuffer: number;
  advanceBookingDays: number;
  defaultOpenTime: string;
  defaultCloseTime: string;
}

// GET /api/admin/settings - Get all booking settings
export async function GET(request: NextRequest) {
  try {
    const { data: settings, error } = await supabaseServer
      .from('booking_settings')
      .select('key, value');

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Transform array of key-value pairs into object
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
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/settings - Update booking settings
export async function PUT(request: NextRequest) {
  try {
    // Verify admin auth
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: BookingSettings = await request.json();
    const {
      minBookingDuration,
      maxBookingDuration,
      bookingBuffer,
      advanceBookingDays,
      defaultOpenTime,
      defaultCloseTime,
    } = body;

    // Validate settings
    if (minBookingDuration < 1 || minBookingDuration > 24) {
      return NextResponse.json(
        { error: 'Minimum booking duration must be between 1 and 24 hours' },
        { status: 400 }
      );
    }
    if (maxBookingDuration < 1 || maxBookingDuration > 24) {
      return NextResponse.json(
        { error: 'Maximum booking duration must be between 1 and 24 hours' },
        { status: 400 }
      );
    }
    if (minBookingDuration > maxBookingDuration) {
      return NextResponse.json(
        { error: 'Minimum duration cannot be greater than maximum duration' },
        { status: 400 }
      );
    }
    if (bookingBuffer < 0 || bookingBuffer > 120) {
      return NextResponse.json(
        { error: 'Booking buffer must be between 0 and 120 minutes' },
        { status: 400 }
      );
    }
    if (advanceBookingDays < 1 || advanceBookingDays > 365) {
      return NextResponse.json(
        { error: 'Advance booking days must be between 1 and 365' },
        { status: 400 }
      );
    }

    // Update each setting using upsert
    const updates = [
      { key: 'min_booking_duration', value: minBookingDuration },
      { key: 'max_booking_duration', value: maxBookingDuration },
      { key: 'booking_buffer', value: bookingBuffer },
      { key: 'advance_booking_days', value: advanceBookingDays },
      { key: 'default_open_time', value: `"${defaultOpenTime}"` },
      { key: 'default_close_time', value: `"${defaultCloseTime}"` },
    ];

    for (const update of updates) {
      const { error } = await supabaseServer
        .from('booking_settings')
        .upsert(
          { key: update.key, value: update.value },
          { onConflict: 'key' }
        );

      if (error) {
        console.error(`[Settings API] Failed to update ${update.key}:`, error);
        return NextResponse.json(
          { error: `Failed to update ${update.key}: ${error.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    console.error('[Settings API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
