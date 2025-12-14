import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { createEvent, deleteEvent, updateEvent } from "@/lib/googleCalendar";
import { sendBookingConfirmationEmail, sendBookingUpdateEmail } from "@/lib/email";
import { logNewBooking, logBookingUpdate } from "@/lib/googleSheets";

interface BookRequest {
  phone: string;
  name?: string;
  email?: string;
  studio: string;
  session_type: string;
  session_details?: string;
  date: string;
  start_time: string;
  end_time: string;
  rate_per_hour?: number;
  is_modification?: boolean;
  original_booking_id?: string; // For updating existing booking
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
      email,
      studio,
      session_type,
      session_details,
      date,
      start_time,
      end_time,
      rate_per_hour,
      is_modification,
    } = body;

    // Normalize phone to digits only
    const phone = body.phone.replace(/\D/g, "");

    // Validate phone number (exactly 10 digits)
    if (phone.length !== 10) {
      return NextResponse.json(
        { error: "Phone number must be exactly 10 digits" },
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
      .in("status", ["confirmed"])
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

    // Check if user exists, if not create them
    const { data: existingUser } = await supabaseServer
      .from("users")
      .select("*")
      .eq("phone_number", phone)
      .single();

    if (!existingUser && name && email) {
      // Create new user
      const { error: createUserError } = await supabaseServer
        .from("users")
        .insert({ phone_number: phone, name, email });

      if (createUserError) {
        console.error("Failed to create user:", createUserError.message);
        // Don't fail the booking, just log the error
      }
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
        phone_number: phone,
        name,
        email,
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
          summary: `${studio} - ${session_type} (${name || phone})`,
          description: `Booking ID: ${booking.id}\nPhone: ${phone}\nSession Type: ${session_type}\nDetails: ${session_details || 'N/A'}`,
          startDateTime,
          endDateTime,
          studioName: studio,
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

    // Send email booking confirmation
    const hasResendConfig = 
      process.env.RESEND_API_KEY &&
      process.env.RESEND_FROM_EMAIL;

    // Get user email if not provided in request
    let userEmail = body.email;
    if (!userEmail) {
      const { data: userData } = await supabaseServer
        .from("users")
        .select("email")
        .eq("phone_number", phone)
        .single();
      userEmail = userData?.email;
    }

    if (hasResendConfig && userEmail) {
      try {
        const emailResult = await sendBookingConfirmationEmail(userEmail, {
          id: booking.id,
          name,
          studio,
          session_type,
          session_details,
          date,
          start_time,
          end_time,
          total_amount: total_amount || undefined,
        });
        
        if (emailResult.success) {
          console.log("[Book API] Email confirmation sent successfully:", emailResult.id);
          // Update booking to mark email as sent
          await supabaseServer
            .from("bookings")
            .update({ email_sent: true })
            .eq("id", booking.id);
        } else {
          console.error("[Book API] Email confirmation failed:", emailResult.error);
        }
      } catch (emailError) {
        // Log error but don't fail the booking
        console.error("[Book API] Failed to send email confirmation:", emailError);
      }
    } else {
      console.log("[Book API] Email notifications disabled - Resend credentials not configured or no user email");
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

    // Log booking to Google Sheet
    try {
      await logNewBooking({
        id: booking.id,
        date,
        studio,
        session_type,
        session_details,
        start_time,
        end_time,
        name,
        phone_number: phone,
        email: userEmail,
        total_amount: total_amount ?? undefined,
        status: "confirmed",
      });
    } catch (sheetError) {
      console.error("[Book API] Failed to log booking to Google Sheet:", sheetError);
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

// PUT /api/book - Update an existing booking
export async function PUT(request: Request) {
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
      original_booking_id,
    } = body;

    // Normalize phone to digits only
    const phone = body.phone.replace(/\D/g, "");

    // Validate booking ID
    if (!original_booking_id) {
      return NextResponse.json(
        { error: "Original booking ID is required for updates" },
        { status: 400 }
      );
    }

    // Validate phone number (exactly 10 digits)
    if (phone.length !== 10) {
      return NextResponse.json(
        { error: "Phone number must be exactly 10 digits" },
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

    // Fetch the original booking
    const { data: originalBooking, error: fetchError } = await supabaseServer
      .from("bookings")
      .select("*")
      .eq("id", original_booking_id)
      .eq("phone_number", phone)
      .single();

    if (fetchError || !originalBooking) {
      return NextResponse.json(
        { error: "Booking not found or does not belong to this phone number" },
        { status: 404 }
      );
    }

    // Check if booking can be modified
    if (originalBooking.status === "cancelled") {
      return NextResponse.json(
        { error: "Cannot modify a cancelled booking" },
        { status: 400 }
      );
    }

    if (originalBooking.status === "completed") {
      return NextResponse.json(
        { error: "Cannot modify a completed booking" },
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

    // Re-check slot availability (excluding the current booking)
    const bufferMinutes = bookingSettings.bookingBuffer;
    const adjustedStartMinutes = startMinutes - bufferMinutes;
    const adjustedEndMinutes = endMinutes + bufferMinutes;
    const adjustedStartTime = `${Math.floor(Math.max(0, adjustedStartMinutes) / 60).toString().padStart(2, '0')}:${(Math.max(0, adjustedStartMinutes) % 60).toString().padStart(2, '0')}`;
    const adjustedEndTime = `${Math.floor(Math.min(1439, adjustedEndMinutes) / 60).toString().padStart(2, '0')}:${(Math.min(1439, adjustedEndMinutes) % 60).toString().padStart(2, '0')}`;

    const { data: conflictingBookings, error: conflictError } = await supabaseServer
      .from("bookings")
      .select("id")
      .eq("studio", studio)
      .eq("date", date)
      .in("status", ["confirmed"])
      .neq("id", original_booking_id) // Exclude the current booking
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
      total_amount = Math.round(rate_per_hour * durationHours);
    }

    // Update the booking
    const { data: updatedBooking, error: updateError } = await supabaseServer
      .from("bookings")
      .update({
        name,
        studio,
        session_type,
        session_details: session_details || session_type,
        date,
        start_time,
        end_time,
        total_amount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", original_booking_id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    // Update Google Calendar event if it exists
    const hasGoogleConfig =
      process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REFRESH_TOKEN &&
      process.env.OWNER_CALENDAR_ID;

    if (hasGoogleConfig) {
      try {
        const startDateTime = `${date}T${start_time}:00`;
        const endDateTime = `${date}T${end_time}:00`;

        if (originalBooking.google_event_id) {
          // Update existing calendar event
          await updateEvent({
            eventId: originalBooking.google_event_id,
            summary: `${studio} - ${session_type} (${name || phone})`,
            description: `Booking ID: ${original_booking_id}\nPhone: ${phone}\nSession Type: ${session_type}\nDetails: ${session_details || 'N/A'}\n\n[UPDATED]`,
            startDateTime,
            endDateTime,
          });
        } else {
          // Create new calendar event if none exists
          const googleEventId = await createEvent({
            summary: `${studio} - ${session_type} (${name || phone})`,
            description: `Booking ID: ${original_booking_id}\nPhone: ${phone}\nSession Type: ${session_type}\nDetails: ${session_details || 'N/A'}`,
            startDateTime,
            endDateTime,
            studioName: studio,
          });

          await supabaseServer
            .from("bookings")
            .update({ google_event_id: googleEventId })
            .eq("id", original_booking_id);

          updatedBooking.google_event_id = googleEventId;
        }
      } catch (calendarError) {
        console.error("[Book API PUT] Failed to update Google Calendar event:", calendarError);
      }
    }

    // Send email notification about the update
    const hasResendConfig = 
      process.env.RESEND_API_KEY &&
      process.env.RESEND_FROM_EMAIL;

    // Get user email if not provided in request
    let userEmail = body.email;
    if (!userEmail) {
      const { data: userData } = await supabaseServer
        .from("users")
        .select("email")
        .eq("phone_number", phone)
        .single();
      userEmail = userData?.email;
    }

    if (hasResendConfig && userEmail) {
      try {
        const emailResult = await sendBookingUpdateEmail(userEmail, {
          id: original_booking_id,
          name,
          studio,
          session_type,
          session_details,
          date,
          start_time,
          end_time,
          total_amount: total_amount || undefined,
        });
        
        if (emailResult.success) {
          console.log("[Book API PUT] Email update notification sent successfully:", emailResult.id);
        } else {
          console.error("[Book API PUT] Email update notification failed:", emailResult.error);
        }
      } catch (emailError) {
        console.error("[Book API PUT] Failed to send email update notification:", emailError);
      }
    }

    // Update reminders - cancel old ones and create new ones
    try {
      // Cancel existing pending reminders
      await supabaseServer
        .from("reminders")
        .update({ status: "cancelled" })
        .eq("booking_id", original_booking_id)
        .eq("status", "pending");

      // Create new reminders based on updated date/time
      const bookingDateTime = new Date(`${date}T${start_time}:00`);
      const reminders = [
        {
          booking_id: original_booking_id,
          scheduled_at: new Date(bookingDateTime.getTime() - 24 * 60 * 60 * 1000).toISOString(),
          type: "24h_reminder",
          status: "pending",
        },
        {
          booking_id: original_booking_id,
          scheduled_at: new Date(bookingDateTime.getTime() - 1 * 60 * 60 * 1000).toISOString(),
          type: "1h_reminder",
          status: "pending",
        },
      ];

      await supabaseServer
        .from("reminders")
        .insert(reminders);
    } catch (reminderError) {
      console.error("[Book API PUT] Failed to update reminders:", reminderError);
    }

    // Log booking update to Google Sheet
    try {
      await logBookingUpdate({
        id: original_booking_id,
        date,
        studio,
        session_type,
        session_details,
        start_time,
        end_time,
        name,
        phone_number: phone,
        email: userEmail,
        total_amount: total_amount ?? undefined,
        status: updatedBooking.status,
      });
    } catch (sheetError) {
      console.error("[Book API PUT] Failed to log booking update to Google Sheet:", sheetError);
    }

    return NextResponse.json({ success: true, booking: updatedBooking });
  } catch (error) {
    console.error("[Book API PUT] Unexpected error:", error);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
