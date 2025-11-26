import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { createEvent } from "@/lib/googleCalendar";
import { sendBookingConfirmation } from "@/src/lib/whatsapp";

interface BookRequest {
  whatsapp: string;
  name?: string;
  studio: string;
  session_type: string;
  session_details?: string;
  date: string;
  start_time: string;
  end_time: string;
  rate_per_hour?: number;
}

interface BookingSettings {
  minBookingDuration: number;
  maxBookingDuration: number;
  bookingBuffer: number;
  advanceBookingDays: number;
}

async function getBookingSettings(): Promise<BookingSettings> {
  const defaults: BookingSettings = {
    minBookingDuration: 1,
    maxBookingDuration: 8,
    bookingBuffer: 0,
    advanceBookingDays: 30,
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
        }
      }
    }
  } catch (error) {
    console.error('Failed to fetch booking settings:', error);
  }

  return defaults;
}

// POST /api/book - Create a new booking
export async function POST(request: Request) {
  try {
    const body: BookRequest = await request.json();
    const {
      name,
      studio,
      session_type,
      session_details,
      date,
      start_time,
      end_time,
      rate_per_hour,
    } = body;

    // Normalize whatsapp to digits only
    const whatsapp = body.whatsapp.replace(/\D/g, "");

    // Validate whatsapp number (exactly 10 digits)
    if (whatsapp.length !== 10) {
      return NextResponse.json(
        { error: "WhatsApp number must be exactly 10 digits" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!studio || !date || !start_time || !end_time) {
      return NextResponse.json(
        { error: "Missing required fields: studio, date, start_time, end_time" },
        { status: 400 }
      );
    }

    // Fetch booking settings and validate against them
    const bookingSettings = await getBookingSettings();

    // Calculate booking duration in hours
    const startParts = start_time.split(":").map(Number);
    const endParts = end_time.split(":").map(Number);
    const startMinutes = startParts[0] * 60 + startParts[1];
    const endMinutes = endParts[0] * 60 + endParts[1];
    const durationHours = (endMinutes - startMinutes) / 60;

    // Validate minimum booking duration
    if (durationHours < bookingSettings.minBookingDuration) {
      return NextResponse.json(
        { error: `Minimum booking duration is ${bookingSettings.minBookingDuration} hour(s)` },
        { status: 400 }
      );
    }

    // Validate maximum booking duration
    if (durationHours > bookingSettings.maxBookingDuration) {
      return NextResponse.json(
        { error: `Maximum booking duration is ${bookingSettings.maxBookingDuration} hours` },
        { status: 400 }
      );
    }

    // Validate advance booking limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bookingDate = new Date(date);
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + bookingSettings.advanceBookingDays);
    
    if (bookingDate > maxDate) {
      return NextResponse.json(
        { error: `Cannot book more than ${bookingSettings.advanceBookingDays} days in advance` },
        { status: 400 }
      );
    }

    // Re-check slot availability: query bookings for same studio+date
    // where status IN ('confirmed','pending') and overlapping times (with buffer)
    const bufferMinutes = bookingSettings.bookingBuffer;
    
    // Adjust times to account for buffer
    const adjustedStartMinutes = startMinutes - bufferMinutes;
    const adjustedEndMinutes = endMinutes + bufferMinutes;
    const adjustedStartTime = `${Math.floor(Math.max(0, adjustedStartMinutes) / 60).toString().padStart(2, '0')}:${(Math.max(0, adjustedStartMinutes) % 60).toString().padStart(2, '0')}`;
    const adjustedEndTime = `${Math.floor(Math.min(1439, adjustedEndMinutes) / 60).toString().padStart(2, '0')}:${(Math.min(1439, adjustedEndMinutes) % 60).toString().padStart(2, '0')}`;

    const { data: conflictingBookings, error: conflictError } = await supabaseServer
      .from("bookings")
      .select("id")
      .eq("studio", studio)
      .eq("date", date)
      .in("status", ["confirmed", "pending"])
      .lt("start_time", adjustedEndTime)
      .gt("end_time", adjustedStartTime);

    if (conflictError) {
      return NextResponse.json(
        { error: conflictError.message },
        { status: 500 }
      );
    }

    if (conflictingBookings && conflictingBookings.length > 0) {
      return NextResponse.json(
        { error: "Time slot is no longer available" },
        { status: 409 }
      );
    }

    // Calculate total amount if rate_per_hour is provided
    let total_amount: number | null = null;
    if (rate_per_hour) {
      const startParts = start_time.split(":").map(Number);
      const endParts = end_time.split(":").map(Number);
      const startMinutes = startParts[0] * 60 + startParts[1];
      const endMinutes = endParts[0] * 60 + endParts[1];
      const durationHours = (endMinutes - startMinutes) / 60;
      total_amount = Math.round(rate_per_hour * durationHours);
    }

    // Insert booking row with status 'confirmed'
    const { data: booking, error: insertError } = await supabaseServer
      .from("bookings")
      .insert({
        whatsapp_number: whatsapp,
        name,
        studio,
        session_type,
        session_details: session_details || session_type,
        date,
        start_time,
        end_time,
        status: "confirmed",
        total_amount,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    // Try to create Google Calendar event if env vars are present
    let googleEventId: string | null = null;
    const hasGoogleConfig =
      process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REFRESH_TOKEN &&
      process.env.OWNER_CALENDAR_ID;

    if (hasGoogleConfig) {
      try {
        // Construct ISO datetime strings for the event
        const startDateTime = `${date}T${start_time}:00`;
        const endDateTime = `${date}T${end_time}:00`;

        googleEventId = await createEvent({
          summary: `${studio} - ${session_type} (${name || whatsapp})`,
          description: `Booking ID: ${booking.id}\nWhatsApp: ${whatsapp}\nSession Type: ${session_type}\nDetails: ${session_details || 'N/A'}`,
          startDateTime,
          endDateTime,
        });

        // Update booking with google_event_id
        await supabaseServer
          .from("bookings")
          .update({ google_event_id: googleEventId })
          .eq("id", booking.id);

        booking.google_event_id = googleEventId;
      } catch (calendarError) {
        // Log error but don't fail the booking
        console.error("[Book API] Failed to create Google Calendar event:", calendarError);
      }
    }

    // Send WhatsApp booking confirmation
    const hasTwilioConfig = 
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_WHATSAPP_NUMBER;

    if (hasTwilioConfig) {
      const countryCode = process.env.WHATSAPP_COUNTRY_CODE || "+91";
      const toNumber = `${countryCode}${whatsapp}`;

      try {
        const whatsappResult = await sendBookingConfirmation(toNumber, {
          bookingId: booking.id,
          studio,
          date,
          start_time,
          end_time,
          total_amount: total_amount || undefined,
          user_name: name,
        });
        
        if (whatsappResult.success) {
          console.log("[Book API] WhatsApp confirmation sent successfully:", whatsappResult.sid);
        } else {
          console.error("[Book API] WhatsApp confirmation failed:", whatsappResult.error);
        }
      } catch (whatsappError) {
        // Log error but don't fail the booking
        console.error("[Book API] Failed to send WhatsApp confirmation:", whatsappError);
      }
    } else {
      console.log("[Book API] WhatsApp notifications disabled - Twilio credentials not configured");
    }

    // Insert reminders (immediate confirmation, 24h before, 1h before)
    const bookingDateTime = new Date(`${date}T${start_time}:00`);
    const reminders = [
      {
        booking_id: booking.id,
        scheduled_at: new Date().toISOString(),
        type: "confirmation",
        status: "sent",
      },
      {
        booking_id: booking.id,
        scheduled_at: new Date(bookingDateTime.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        type: "24h_reminder",
        status: "pending",
      },
      {
        booking_id: booking.id,
        scheduled_at: new Date(bookingDateTime.getTime() - 1 * 60 * 60 * 1000).toISOString(),
        type: "1h_reminder",
        status: "pending",
      },
    ];

    const { error: reminderError } = await supabaseServer
      .from("reminders")
      .insert(reminders);

    if (reminderError) {
      // Log error but don't fail the booking
      console.error("[Book API] Failed to insert reminders:", reminderError);
    }

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error("[Book API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
