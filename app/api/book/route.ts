import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { createEvent, deleteEvent, updateEvent } from "@/lib/googleCalendar";
import { sendBookingConfirmationEmail, sendBookingUpdateEmail } from "@/lib/email";
import { logNewBooking, logBookingUpdate, logOriginalBooking } from "@/lib/googleSheets";

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
  is_prompt_payment?: boolean;
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

import { checkRateLimit } from "@/lib/rateLimit";
import { headers } from "next/headers";

// POST /api/book - Create a new booking
export async function POST(request: Request) {
  try {
    // Check Rate Limit (5 requests per hour per IP)
    const headersList = await headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0] : "unknown";
    
    const isAllowed = await checkRateLimit(ip, "booking_create", 5, 3600);
    
    if (!isAllowed) {
      return NextResponse.json(
        { error: "Too many booking requests. Please try again later." },
        { status: 429 }
      );
    }

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
    bookingDate.setHours(0, 0, 0, 0);

    // Users cannot book same-day slots
    if (bookingDate.getTime() === today.getTime()) {
      return NextResponse.json(
        { error: "Same-day bookings are not allowed. Please book for tomorrow or later." },
        { status: 400 }
      );
    }

    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + bookingSettings.advanceBookingDays);
    
    if (bookingDate > maxDate) {
      return NextResponse.json(
        { error: `Cannot book more than ${bookingSettings.advanceBookingDays} days in advance` },
        { status: 400 }
      );
    }

    // Calculate total amount if rate_per_hour is provided
    let total_amount: number | null = null;
    if (rate_per_hour) {
      total_amount = Math.round(rate_per_hour * durationHours);
    }

    // Use atomic function to prevent race conditions
    // This function acquires row-level locks before checking for conflicts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: result, error: rpcError } = await supabaseServer.rpc(
      "create_booking_atomic",
      {
        p_phone_number: phone,
        p_name: name || null,
        p_email: email || null,
        p_studio: studio,
        p_session_type: session_type,
        p_session_details: session_details || session_type,
        p_date: date,
        p_start_time: start_time,
        p_end_time: end_time,
        p_total_amount: total_amount,
        p_notes: null,
        p_created_by_staff_id: null,
        p_is_prompt_payment: body.is_prompt_payment || false,
      }
    ) as { data: { success: boolean; error?: string; booking_id?: string; booking?: any } | null; error: any };

    if (rpcError) {
      console.error("[Book API] RPC error:", rpcError);
      return NextResponse.json(
        { error: rpcError.message || "Failed to create booking" },
        { status: 500 }
      );
    }

    if (!result || !result.success) {
      return NextResponse.json(
        { error: result?.error || "Time slot is no longer available" },
        { status: 409 }
      );
    }

    // Get the full booking record
    const { data: booking, error: fetchError } = await supabaseServer
      .from("bookings")
      .select("*")
      .eq("id", result.booking_id)
      .single();

    if (fetchError || !booking) {
      console.error("[Book API] Failed to fetch created booking:", fetchError);
      return NextResponse.json(
        { error: "Booking created but failed to retrieve details" },
        { status: 500 }
      );
    }

    // Check if user exists, if not create them (after successful booking)
    const { data: existingUser } = await supabaseServer
      .from("users")
      .select("*")
      .eq("phone_number", phone)
      .single();

    if (!existingUser && name && email) {
      const { error: createUserError } = await supabaseServer
        .from("users")
        .insert({ phone_number: phone, name, email });

      if (createUserError) {
        console.error("Failed to create user:", createUserError.message);
      }
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
          // Email confirmation sent successfully
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
      // Email notifications disabled - Resend credentials not configured or no user email
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

    // Check 24-hour modification restriction
    const bookingStartDateTime = new Date(`${originalBooking.date}T${originalBooking.start_time}:00`);
    const now = new Date();
    const hoursUntilBooking = (bookingStartDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilBooking < 24) {
      return NextResponse.json(
        { error: "Cannot modify a booking within 24 hours of its start time." },
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

    // Calculate total amount if rate_per_hour is provided
    let total_amount: number | null = null;
    if (rate_per_hour) {
      total_amount = Math.round(rate_per_hour * durationHours);
    }

    // Use atomic function to prevent race conditions during update
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: result, error: rpcError } = await supabaseServer.rpc(
      "update_booking_atomic",
      {
        p_booking_id: original_booking_id,
        p_phone_number: phone,
        p_name: name || null,
        p_studio: studio,
        p_session_type: session_type,
        p_session_details: session_details || session_type,
        p_date: date,
        p_start_time: start_time,
        p_end_time: end_time,
        p_total_amount: total_amount,
        p_is_prompt_payment: body.is_prompt_payment,
      }
    ) as { data: { success: boolean; error?: string; booking_id?: string; booking?: any } | null; error: any };

    if (rpcError) {
      console.error("[Book API PUT] RPC error:", rpcError);
      return NextResponse.json(
        { error: rpcError.message || "Failed to update booking" },
        { status: 500 }
      );
    }

    if (!result || !result.success) {
      return NextResponse.json(
        { error: result?.error || "Time slot is no longer available" },
        { status: 409 }
      );
    }

    // Get the full updated booking record
    const { data: updatedBooking, error: updateFetchError } = await supabaseServer
      .from("bookings")
      .select("*")
      .eq("id", original_booking_id)
      .single();

    if (updateFetchError || !updatedBooking) {
      console.error("[Book API PUT] Failed to fetch updated booking:", updateFetchError);
      return NextResponse.json(
        { error: "Booking updated but failed to retrieve details" },
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
          // Email update notification sent successfully
        } else {
          console.error("[Book API PUT] Email update notification failed:", emailResult.error);
        }
      } catch (emailError) {
        console.error("[Book API PUT] Failed to send email update notification:", emailError);
      }
    }

    // Log booking update to Google Sheet
    try {
      // First log the original booking state
      await logOriginalBooking({
        id: originalBooking.id,
        date: originalBooking.date,
        studio: originalBooking.studio,
        session_type: originalBooking.session_type,
        session_details: originalBooking.session_details,
        start_time: originalBooking.start_time,
        end_time: originalBooking.end_time,
        name: originalBooking.name,
        phone_number: originalBooking.phone_number,
        email: originalBooking.email,
        total_amount: originalBooking.total_amount ?? undefined,
        status: originalBooking.status,
        notes: originalBooking.notes || "Original booking before user update",
        created_at: originalBooking.created_at
      });

      // Then log the updated booking
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
