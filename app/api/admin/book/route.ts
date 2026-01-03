import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { supabaseServer } from "@/lib/supabaseServer";
import { createClient } from "@supabase/supabase-js";
import { createEvent } from "@/lib/googleCalendar";
import { sendAdminBookingConfirmationEmail } from "@/lib/email";
import { logNewBooking } from "@/lib/googleSheets";

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

  // Check if user is in admin_users table and is active
  const { data: adminUser, error: adminError } = await supabaseAdmin()
    .from("admin_users")
    .select("id, role, is_active")
    .eq("id", user.id)
    .eq("is_active", true)
    .single();

  if (adminError || !adminUser) {
    return { valid: false, error: "Insufficient permissions" };
  }

  return { valid: true, user, adminUser };
}

interface AdminBookRequest {
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
  notes?: string;
  skip_validation?: boolean; // Admin can skip some validations
  send_notification?: boolean; // Whether to send email notification
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
      email,
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

    // Calculate total amount if rate_per_hour is provided
    let total_amount: number | null = null;
    if (rate_per_hour) {
      total_amount = Math.round(rate_per_hour * durationHours);
    }

    // Use atomic function to prevent race conditions
    // Admin can still skip validation if needed, but we check conflicts first and show them
    if (!skip_validation) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: result, error: rpcError } = await supabaseServer.rpc(
        "create_booking_atomic",
        {
          p_phone_number: phone,
          p_name: name || null,
          p_email: email || null,
          p_studio: studio,
          p_session_type: session_type || "Walk-in",
          p_session_details: session_details || session_type || "Admin booking",
          p_date: date,
          p_start_time: start_time,
          p_end_time: end_time,
          p_total_amount: total_amount,
          p_notes: notes || "Booked by admin",
          p_created_by_staff_id: null,
        }
      ) as { data: { success: boolean; error?: string; booking_id?: string; booking?: any } | null; error: any };

      if (rpcError) {
        console.error("[Admin Book API] RPC error:", rpcError);
        return NextResponse.json(
          { error: rpcError.message || "Failed to create booking" },
          { status: 500 }
        );
      }

      if (!result || !result.success) {
        // Check if there are actual conflicts to report
        const { data: conflictingBookings } = await supabaseServer
          .from("bookings")
          .select("id, start_time, end_time, name, phone_number")
          .eq("studio", studio)
          .eq("date", date)
          .in("status", ["confirmed"])
          .lt("start_time", end_time)
          .gt("end_time", start_time);

        if (conflictingBookings && conflictingBookings.length > 0) {
          const conflicts = conflictingBookings.map(b => 
            `${b.start_time}-${b.end_time} (${b.name || b.phone_number})`
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
        console.error("[Admin Book API] Failed to fetch created booking:", fetchError);
        return NextResponse.json(
          { error: "Booking created but failed to retrieve details" },
          { status: 500 }
        );
      }

      // Continue with Google Calendar, email, etc. (booking variable is now defined)
      var createdBooking = booking;
    } else {
      // Skip validation - direct insert (admin override)
      const { data: booking, error: insertError } = await supabaseServer
        .from("bookings")
        .insert({
          phone_number: phone,
          name,
          email,
          studio,
          session_type: session_type || "Walk-in",
          session_details: session_details || session_type || "Admin booking",
          date,
          start_time,
          end_time,
          status: "confirmed",
          total_amount,
          notes: notes || "Booked by admin (validation skipped)",
        })
        .select()
        .single();

      if (insertError) {
        return NextResponse.json(
          { error: insertError.message },
          { status: 500 }
        );
      }
      var createdBooking = booking;
    }

    const booking = createdBooking;

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
          summary: `${studio} - ${session_type || 'Walk-in'} (${name || phone}) [Admin]`,
          description: `Booking ID: ${booking.id}\nPhone: ${phone}\nSession Type: ${session_type || 'Walk-in'}\nDetails: ${session_details || 'N/A'}\nNotes: ${notes || 'Booked by admin'}`,
          startDateTime,
          endDateTime,
          studioName: studio,
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

    // Send email booking confirmation if enabled
    if (send_notification) {
      const hasResendConfig =
        process.env.RESEND_API_KEY &&
        process.env.RESEND_FROM_EMAIL;

      // Get user email if not provided in request
      let userEmail = email;
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
          const emailResult = await sendAdminBookingConfirmationEmail(userEmail, {
            id: booking.id,
            name,
            studio,
            session_type: session_type || "Walk-in",
            session_details,
            date,
            start_time,
            end_time,
            total_amount: total_amount || undefined,
          });

          if (emailResult.success) {
            console.log("[Admin Book API] Email confirmation sent successfully:", emailResult.id);
            await supabaseServer
              .from("bookings")
              .update({ email_sent: true })
              .eq("id", booking.id);
          } else {
            console.error("[Admin Book API] Email confirmation failed:", emailResult.error);
          }
        } catch (emailError) {
          console.error("[Admin Book API] Failed to send email confirmation:", emailError);
        }
      }
    }

    // Log booking to Google Sheet
    try {
      await logNewBooking({
        id: booking.id,
        date,
        studio,
        session_type: session_type || "Walk-in",
        session_details,
        start_time,
        end_time,
        name,
        phone_number: phone,
        email,
        total_amount: total_amount ?? undefined,
        status: "confirmed",
        notes: notes || "Booked by admin",
      });
    } catch (sheetError) {
      console.error("[Admin Book API] Failed to log booking to Google Sheet:", sheetError);
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
