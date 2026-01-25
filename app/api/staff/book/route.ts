import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { supabaseServer } from "@/lib/supabaseServer";
import { createClient } from "@supabase/supabase-js";
import { createEvent, updateEvent } from "@/lib/googleCalendar";
import { sendAdminBookingConfirmationEmail } from "@/lib/email";
import { logNewBooking, logBookingUpdate, logOriginalBooking } from "@/lib/googleSheets";
import { isPlaceholderEmail } from "@/lib/bookingUtils";

// Verify staff token from Authorization header
async function verifyStaffToken(request: NextRequest) {
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

  // Check if user is in admin_users table with staff role and is active
  const { data: staffUser, error: staffError } = await supabaseAdmin()
    .from("admin_users")
    .select("id, role, is_active, name")
    .eq("id", user.id)
    .eq("is_active", true)
    .in("role", ["staff", "investor"])
    .single();

  if (staffError || !staffUser) {
    return { valid: false, error: "Insufficient permissions - staff or investor role required" };
  }

  return { valid: true, user, staffUser };
}

interface StaffBookRequest {
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
  skip_validation?: boolean;
  send_notification?: boolean;
}

// POST /api/staff/book - Create a booking on behalf of a customer (staff)
export async function POST(request: NextRequest) {
  // Verify staff authentication
  const authResult = await verifyStaffToken(request);
  if (!authResult.valid) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  try {
    const body: StaffBookRequest = await request.json();
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
    // Staff can skip validation if needed, but we check conflicts first
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
          p_session_details: session_details || session_type || "Staff booking",
          p_date: date,
          p_start_time: start_time,
          p_end_time: end_time,
          p_total_amount: total_amount,
          p_notes: notes || `Booked by ${authResult.staffUser?.role}: ${authResult.staffUser?.name || 'User'}`,
          p_created_by_staff_id: authResult.user!.id,
          p_investor_id: authResult.staffUser?.role === 'investor' ? authResult.user!.id : null,
        }
      ) as { data: { success: boolean; error?: string; booking_id?: string; booking?: any } | null; error: any };

      if (rpcError) {
        console.error("[Staff Book API] RPC error:", rpcError);
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
      const { data: fetchedBooking, error: fetchError } = await supabaseServer
        .from("bookings")
        .select("*")
        .eq("id", result.booking_id)
        .single();

      if (fetchError || !fetchedBooking) {
        console.error("[Staff Book API] Failed to fetch created booking:", fetchError);
        return NextResponse.json(
          { error: "Booking created but failed to retrieve details" },
          { status: 500 }
        );
      }

      // Use fetched booking for subsequent operations
      var booking = fetchedBooking;
    } else {
      // Skip validation - direct insert (staff override)
      const { data: insertedBooking, error: insertError } = await supabaseServer
        .from("bookings")
        .insert({
          phone_number: phone,
          name,
          email,
          studio,
          session_type: session_type || "Walk-in",
          session_details: session_details || session_type || "Staff booking",
          date,
          start_time,
          end_time,
          status: "confirmed",
          total_amount,
          notes: notes || `Booked by ${authResult.staffUser?.role}: ${authResult.staffUser?.name || 'User'} (validation skipped)`,
          created_by_staff_id: authResult.user!.id,
          investor_id: authResult.staffUser?.role === 'investor' ? authResult.user!.id : null,
        })
        .select()
        .single();

      if (insertError) {
        return NextResponse.json(
          { error: insertError.message },
          { status: 500 }
        );
      }
      var booking = insertedBooking;
    }

    // Check if user exists, if not create them (after successful booking)
    const { data: existingUser } = await supabaseServer
      .from("users")
      .select("*")
      .eq("phone_number", phone)
      .single();

    if (existingUser) {
      // Check if the current email is a placeholder (admin email)
      const isPlaceholder = await isPlaceholderEmail(existingUser.email);
      
      // If it is a placeholder and we have a new valid email, update the user's profile
      if (isPlaceholder && email && email.trim() !== "") {
        const isNewEmailPlaceholder = await isPlaceholderEmail(email);
        
        if (!isNewEmailPlaceholder) {
          console.log(`[Staff Book API] Updating user ${phone} email from ${existingUser.email} to ${email}`);
          const { error: updateUserError } = await supabaseServer
            .from("users")
            .update({ 
               email: email, 
               name: name || existingUser.name 
            })
            .eq("phone_number", phone);

          if (updateUserError) {
            console.error("[Staff Book API] Failed to update user email:", updateUserError.message);
          }
        }
      }
    }

    if (!existingUser && name && email) {
      const { error: createUserError } = await supabaseServer
        .from("users")
        .insert({ phone_number: phone, name, email });

      if (createUserError) {
        console.error("[Staff Book API] Failed to create user:", createUserError.message);
      } else {
        // Created new user for booking
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
        const startDateTime = `${date}T${start_time}:00`;
        const endDateTime = `${date}T${end_time}:00`;

        googleEventId = await createEvent({
          summary: `${studio} - ${session_type || 'Walk-in'} (${name || phone}) [Staff]`,
          description: `Booking ID: ${booking.id}\nPhone: ${phone}\nSession Type: ${session_type || 'Walk-in'}\nDetails: ${session_details || 'N/A'}\nNotes: ${notes || 'Booked by staff'}\nBooked by: ${authResult.staffUser?.name || 'Staff'}`,
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
        console.error("[Staff Book API] Failed to create Google Calendar event:", calendarError);
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
            // Email confirmation sent successfully
            await supabaseServer
              .from("bookings")
              .update({ email_sent: true })
              .eq("id", booking.id);
          } else {
            console.error("[Staff Book API] Email confirmation failed:", emailResult.error);
          }
        } catch (emailError) {
          console.error("[Staff Book API] Failed to send email confirmation:", emailError);
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
        notes: notes || `Booked by staff: ${authResult.staffUser?.name || 'Staff'}`,
      });
    } catch (sheetError) {
      console.error("[Staff Book API] Failed to log booking to Google Sheet:", sheetError);
    }

    return NextResponse.json({ 
      success: true, 
      booking,
      message: "Booking created successfully by staff"
    });
  } catch (error) {
    console.error("[Staff Book API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

// PUT /api/staff/book - Update an existing booking (staff)
export async function PUT(request: NextRequest) {
  // Verify staff authentication
  const authResult = await verifyStaffToken(request);
  if (!authResult.valid) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      original_booking_id,
      phone: newPhoneRaw,
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
      is_prompt_payment,
      send_notification = true,
    } = body;

    if (!original_booking_id) {
      return NextResponse.json(
        { error: "Missing required field: original_booking_id" },
        { status: 400 }
      );
    }

    // Normalize phone to digits only
    const newPhone = newPhoneRaw.replace(/\D/g, "");

    if (newPhone.length !== 10) {
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

    const supabase = supabaseAdmin();

    // Fetch the existing booking
    const { data: existingBooking, error: fetchError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", original_booking_id)
      .single();

    if (fetchError || !existingBooking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Use atomic update function
    const { data: result, error: rpcError } = await supabaseServer.rpc(
      "update_booking_atomic",
      {
        p_booking_id: original_booking_id,
        p_phone_number: existingBooking.phone_number,
        p_name: name || undefined,
        p_studio: studio,
        p_session_type: session_type,
        p_session_details: session_details,
        p_date: date,
        p_start_time: start_time,
        p_end_time: end_time,
        p_total_amount: total_amount,
        p_is_prompt_payment: is_prompt_payment,
      }
    ) as { data: { success: boolean; error?: string; booking_id?: string; booking?: any } | null; error: any };

    if (rpcError) {
      console.error("[Staff Book API] RPC update error:", rpcError);
      return NextResponse.json(
        { error: rpcError.message || "Failed to update booking" },
        { status: 500 }
      );
    }

    if (!result || !result.success) {
      // Check for conflicts
      if (result?.error === 'Time slot is no longer available') {
        const { data: conflictingBookings } = await supabaseServer
          .from("bookings")
          .select("id, start_time, end_time, name, phone_number")
          .eq("studio", studio)
          .eq("date", date)
          .in("status", ["confirmed"])
          .neq("id", original_booking_id)
          .lt("start_time", end_time)
          .gt("end_time", start_time);

        if (conflictingBookings && conflictingBookings.length > 0) {
          const conflicts = conflictingBookings.map((b: any) =>
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
      }

      return NextResponse.json(
        { error: result?.error || "Failed to update booking" },
        { status: 409 }
      );
    }

    // If phone number changed, update it manually
    if (newPhone !== existingBooking.phone_number) {
      const { error: phoneUpdateError } = await supabase
        .from("bookings")
        .update({ phone_number: newPhone })
        .eq("id", original_booking_id);

      if (phoneUpdateError) {
        console.error("[Staff Book API] Failed to update phone number:", phoneUpdateError);
      } else {
        // Check/create user for new phone
        const { data: newUser } = await supabase
          .from("users")
          .select("*")
          .eq("phone_number", newPhone)
          .single();

        if (!newUser && name && email) {
          await supabase.from("users").insert({ phone_number: newPhone, name, email });
        }
      }
    }

    const { data: booking, error: refetchError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", original_booking_id)
      .single();

    if (refetchError || !booking) {
      return NextResponse.json({ success: true, message: "Updated but failed to refetch details" });
    }

    // Update Google Calendar
    if (existingBooking.google_event_id && process.env.GOOGLE_CLIENT_ID) {
      try {
        await updateEvent({
          eventId: existingBooking.google_event_id,
          summary: `${studio} - ${session_type || 'Walk-in'} (${name || newPhone}) [Staff]`,
          description: `Booking ID: ${booking.id}\nPhone: ${newPhone}\nSession Type: ${session_type || 'Walk-in'}\nDetails: ${session_details || 'N/A'}\nNotes: ${notes || 'Updated by staff'}`,
          startDateTime: `${date}T${start_time}:00`,
          endDateTime: `${date}T${end_time}:00`
        });
      } catch (calError) {
        console.error("[Staff Book API] Failed to update calendar event:", calError);
      }
    } else if (!existingBooking.google_event_id && process.env.GOOGLE_CLIENT_ID) {
      // Create event if it didn't exist
      try {
        const googleEventId = await createEvent({
          summary: `${studio} - ${session_type || 'Walk-in'} (${name || newPhone}) [Staff]`,
          description: `Booking ID: ${booking.id}\nPhone: ${newPhone}\nSession Type: ${session_type || 'Walk-in'}\nDetails: ${session_details || 'N/A'}\nNotes: ${notes || 'Updated by staff'}`,
          startDateTime: `${date}T${start_time}:00`,
          endDateTime: `${date}T${end_time}:00`,
          studioName: studio
        });
        await supabase.from("bookings").update({ google_event_id: googleEventId }).eq("id", booking.id);
      } catch (calError) {
        console.error("[Staff Book API] Failed to create missing calendar event:", calError);
      }
    }

    // Send email confirmation
    if (send_notification) {
      const hasResendConfig =
        process.env.RESEND_API_KEY &&
        process.env.RESEND_FROM_EMAIL;

      let userEmail = email;
      if (!userEmail) {
        const { data: userData } = await supabase
          .from("users")
          .select("email")
          .eq("phone_number", newPhone)
          .single();
        userEmail = userData?.email;
      }

      if (hasResendConfig && userEmail) {
        try {
          await sendAdminBookingConfirmationEmail(userEmail, {
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
        } catch (emailError) {
          console.error("[Staff Book API] Failed to send update email:", emailError);
        }
      }
    }

    // Log update to Google Sheets
    try {
      // First log the original booking state
      await logOriginalBooking({
        id: existingBooking.id,
        date: existingBooking.date,
        studio: existingBooking.studio,
        session_type: existingBooking.session_type || "Walk-in",
        session_details: existingBooking.session_details,
        start_time: existingBooking.start_time,
        end_time: existingBooking.end_time,
        name: existingBooking.name,
        phone_number: existingBooking.phone_number,
        email: existingBooking.email,
        total_amount: existingBooking.total_amount ?? undefined,
        status: existingBooking.status,
        notes: existingBooking.notes || "Original booking before staff update",
        created_at: existingBooking.created_at
      });

      // Then log the updated booking
      await logBookingUpdate({
        id: booking.id,
        date,
        studio,
        session_type: session_type || "Walk-in",
        session_details,
        start_time,
        end_time,
        name,
        phone_number: newPhone,
        email,
        total_amount: total_amount ?? undefined,
        status: existingBooking.status,
        notes: notes || `Updated by staff: ${authResult.staffUser?.name || 'Staff'}`
      });
    } catch (sheetError) {
      console.error("[Staff Book API] Failed to log update to sheets:", sheetError);
    }

    return NextResponse.json({
      success: true,
      booking,
      message: "Booking updated successfully by staff"
    });

  } catch (error) {
    console.error("[Staff Book API] Unexpected error in PUT:", error);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
