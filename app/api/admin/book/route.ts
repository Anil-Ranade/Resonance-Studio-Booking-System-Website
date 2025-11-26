import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { supabaseServer } from "@/lib/supabaseServer";
import { createClient } from "@supabase/supabase-js";
import { createEvent } from "@/lib/googleCalendar";
import { sendBookingConfirmation } from "@/src/lib/whatsapp";

// Verify admin token from Authorization header
async function verifyAdminToken(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { valid: false, error: "Missing or invalid Authorization header" };
  }

  const token = authHeader.replace("Bearer ", "");

  // Create a new Supabase client using the user's token
  const supabaseClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabaseClient.auth.getUser(token);

  if (error || !user) {
    return { valid: false, error: "Invalid or expired token" };
  }

  // Check if user has admin role
  const { data: profile } = await supabaseAdmin()
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { valid: false, error: "Insufficient permissions" };
  }

  return { valid: true, user };
}

interface AdminBookRequest {
  whatsapp: string;
  name?: string;
  studio: string;
  session_type: string;
  session_details?: string;
  date: string;
  start_time: string;
  end_time: string;
  rate_per_hour?: number;
  notes?: string;
  skip_validation?: boolean; // Admin can skip some validations
  send_notification?: boolean; // Whether to send WhatsApp notification
}

// POST /api/admin/book - Create a booking on behalf of a customer (admin only)
export async function POST(request: NextRequest) {
  // Verify admin authentication
  const authResult = await verifyAdminToken(request);
  if (!authResult.valid) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  try {
    const body: AdminBookRequest = await request.json();
    const {
      name,
      studio,
      session_type,
      session_details,
      date,
      start_time,
      end_time,
      rate_per_hour,
      notes,
      skip_validation = false,
      send_notification = true,
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

    // Calculate booking duration in hours
    const startParts = start_time.split(":").map(Number);
    const endParts = end_time.split(":").map(Number);
    const startMinutes = startParts[0] * 60 + startParts[1];
    const endMinutes = endParts[0] * 60 + endParts[1];
    const durationHours = (endMinutes - startMinutes) / 60;

    if (durationHours <= 0) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      );
    }

    // Check for conflicting bookings (admin can see conflicts but we still prevent double booking)
    const { data: conflictingBookings, error: conflictError } = await supabaseServer
      .from("bookings")
      .select("id, start_time, end_time, name, whatsapp_number")
      .eq("studio", studio)
      .eq("date", date)
      .in("status", ["confirmed", "pending"])
      .lt("start_time", end_time)
      .gt("end_time", start_time);

    if (conflictError) {
      return NextResponse.json(
        { error: conflictError.message },
        { status: 500 }
      );
    }

    if (conflictingBookings && conflictingBookings.length > 0 && !skip_validation) {
      const conflicts = conflictingBookings.map(b => 
        `${b.start_time}-${b.end_time} (${b.name || b.whatsapp_number})`
      ).join(", ");
      return NextResponse.json(
        { 
          error: "Time slot conflicts with existing bookings",
          conflicts: conflictingBookings,
          message: `Conflicting bookings: ${conflicts}`
        },
        { status: 409 }
      );
    }

    // Calculate total amount if rate_per_hour is provided
    let total_amount: number | null = null;
    if (rate_per_hour) {
      total_amount = Math.round(rate_per_hour * durationHours);
    }

    // Insert booking row with status 'confirmed' (admin bookings are auto-confirmed)
    const { data: booking, error: insertError } = await supabaseServer
      .from("bookings")
      .insert({
        whatsapp_number: whatsapp,
        name,
        studio,
        session_type: session_type || "Walk-in",
        session_details: session_details || session_type || "Admin booking",
        date,
        start_time,
        end_time,
        status: "confirmed",
        total_amount,
        notes: notes || "Booked by admin",
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
        const startDateTime = `${date}T${start_time}:00`;
        const endDateTime = `${date}T${end_time}:00`;

        googleEventId = await createEvent({
          summary: `${studio} - ${session_type || 'Walk-in'} (${name || whatsapp}) [Admin]`,
          description: `Booking ID: ${booking.id}\nWhatsApp: ${whatsapp}\nSession Type: ${session_type || 'Walk-in'}\nDetails: ${session_details || 'N/A'}\nNotes: ${notes || 'Booked by admin'}`,
          startDateTime,
          endDateTime,
        });

        await supabaseServer
          .from("bookings")
          .update({ google_event_id: googleEventId })
          .eq("id", booking.id);

        booking.google_event_id = googleEventId;
      } catch (calendarError) {
        console.error("[Admin Book API] Failed to create Google Calendar event:", calendarError);
      }
    }

    // Send WhatsApp booking confirmation if enabled
    if (send_notification) {
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
            console.log("[Admin Book API] WhatsApp confirmation sent successfully:", whatsappResult.sid);
          } else {
            console.error("[Admin Book API] WhatsApp confirmation failed:", whatsappResult.error);
          }
        } catch (whatsappError) {
          console.error("[Admin Book API] Failed to send WhatsApp confirmation:", whatsappError);
        }
      }
    }

    // Insert reminders
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
      console.error("[Admin Book API] Failed to insert reminders:", reminderError);
    }

    return NextResponse.json({ 
      success: true, 
      booking,
      message: "Booking created successfully by admin"
    });
  } catch (error) {
    console.error("[Admin Book API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
