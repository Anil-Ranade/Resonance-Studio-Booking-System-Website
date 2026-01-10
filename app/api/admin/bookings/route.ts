import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";
import { sendAdminBookingConfirmationEmail } from "@/lib/email";
import { deleteEvent, createEvent, updateEvent } from "@/lib/googleCalendar";
import { logBookingUpdate, logBookingCancellation } from "@/lib/googleSheets";

// Verify admin token from Authorization header
async function verifyAdminToken(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];
  
  // Create a client with the user's access token to verify it
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const { data: { user }, error } = await supabaseAuth.auth.getUser();
  
  if (error || !user) {
    console.error("[Admin Bookings] Auth error:", error?.message);
    return null;
  }

  // Use admin client to check admin_users table
  const supabase = supabaseAdmin();
  const { data: adminUser, error: adminError } = await supabase
    .from("admin_users")
    .select("*")
    .eq("id", user.id)
    .eq("is_active", true)
    .single();

  if (adminError || !adminUser) {
    console.error("[Admin Bookings] Admin check error:", adminError?.message);
    return null;
  }

  return { user, adminUser };
}

// GET /api/admin/bookings - Get all bookings
export async function GET(request: NextRequest) {
  const admin = await verifyAdminToken(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const limit = searchParams.get("limit");
  const status = searchParams.get("status");
  const studio = searchParams.get("studio");
  const date = searchParams.get("date");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const investorId = searchParams.get("investorId");
  const phone = searchParams.get("phone");

  const supabase = supabaseAdmin();

  let query = supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });

  if (phone) {
    query = query.ilike("phone_number", `%${phone}%`);
  }

  if (investorId) {
    query = query.eq("investor_id", investorId);
  }

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  if (studio) {
    query = query.eq("studio", studio);
  }

  // Exact date match (for Today's Overview)
  if (date) {
    query = query.eq("date", date);
  }

  if (startDate) {
    query = query.gte("date", startDate);
  }

  if (endDate) {
    query = query.lte("date", endDate);
  }

  if (limit) {
    query = query.limit(parseInt(limit, 10));
  }

  const { data: bookings, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ bookings: bookings || [] });
}

// PUT /api/admin/bookings - Update booking status
export async function PUT(request: NextRequest) {
  const admin = await verifyAdminToken(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, status, notes, studio, date, start_time, end_time, session_type, session_details, name, payment_status } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing required field: id" },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin();

    // Fetch the existing booking first to get google_event_id and old data
    const { data: existingBooking, error: fetchError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !existingBooking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const updates: Record<string, any> = {};
    if (status) updates.status = status;
    if (payment_status) updates.payment_status = payment_status;
    if (notes !== undefined) updates.notes = notes;
    if (studio !== undefined) updates.studio = studio;
    if (date !== undefined) updates.date = date;
    if (start_time !== undefined) updates.start_time = start_time;
    if (end_time !== undefined) updates.end_time = end_time;
    if (session_type !== undefined) updates.session_type = session_type;
    if (session_details !== undefined) updates.session_details = session_details;
    if (name !== undefined) updates.name = name;
    if (status === "cancelled") updates.cancelled_at = new Date().toISOString();

    const { data: booking, error } = await supabase
      .from("bookings")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Sync with Google Calendar
    const hasGoogleConfig =
      process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REFRESH_TOKEN &&
      process.env.OWNER_CALENDAR_ID;

    if (hasGoogleConfig && booking) {
      try {
        // If status changed to cancelled, delete the calendar event
        if (status === "cancelled" && existingBooking.google_event_id) {
          await deleteEvent(existingBooking.google_event_id);
          // Google Calendar event deleted due to cancellation
          
          // Clear the google_event_id from the booking
          await supabase
            .from("bookings")
            .update({ google_event_id: null })
            .eq("id", id);
        }
        // If booking was previously cancelled and is now confirmed/pending, create a new event
        else if (existingBooking.status === "cancelled" && (status === "confirmed") && !existingBooking.google_event_id) {
          const startDateTime = `${booking.date}T${booking.start_time}:00`;
          const endDateTime = `${booking.date}T${booking.end_time}:00`;

          const googleEventId = await createEvent({
            summary: `${booking.studio} - ${booking.session_type || 'Booking'} (${booking.name || booking.phone_number})`,
            description: `Booking ID: ${booking.id}\nPhone: ${booking.phone_number}\nSession Type: ${booking.session_type || 'N/A'}\nDetails: ${booking.session_details || 'N/A'}`,
            startDateTime,
            endDateTime,
            studioName: booking.studio,
          });

          await supabase
            .from("bookings")
            .update({ google_event_id: googleEventId })
            .eq("id", id);
          
          // Created new Google Calendar event for reactivated booking
        }
        // If booking details were updated (date, time, studio, etc.), update the calendar event
        else if (existingBooking.google_event_id && (date || start_time || end_time || studio || session_type || name)) {
          const updatedDate = date || existingBooking.date;
          const updatedStartTime = start_time || existingBooking.start_time;
          const updatedEndTime = end_time || existingBooking.end_time;
          const updatedStudio = studio || existingBooking.studio;
          const updatedSessionType = session_type || existingBooking.session_type;
          const updatedName = name || existingBooking.name;

          await updateEvent({
            eventId: existingBooking.google_event_id,
            summary: `${updatedStudio} - ${updatedSessionType || 'Booking'} (${updatedName || booking.phone_number})`,
            description: `Booking ID: ${booking.id}\nPhone: ${booking.phone_number}\nSession Type: ${updatedSessionType || 'N/A'}\nDetails: ${booking.session_details || 'N/A'}`,
            startDateTime: `${updatedDate}T${updatedStartTime}:00`,
            endDateTime: `${updatedDate}T${updatedEndTime}:00`,
          });
          
          // Google Calendar event updated
        }
      } catch (calendarError) {
        console.error("[Admin Bookings] Failed to sync Google Calendar:", calendarError);
        // Don't fail the request, just log the error
      }
    }

    // Send email notification when booking is confirmed
    if (status === "confirmed" && booking) {
      const hasResendConfig =
        process.env.RESEND_API_KEY &&
        process.env.RESEND_FROM_EMAIL;

      // Try to get user email
      const { data: userData } = await supabase
        .from("users")
        .select("email")
        .eq("phone_number", booking.phone_number)
        .single();

      if (hasResendConfig && userData?.email) {
        try {
          const emailResult = await sendAdminBookingConfirmationEmail(userData.email, {
            id: booking.id,
            name: booking.name,
            studio: booking.studio,
            session_type: booking.session_type,
            session_details: booking.session_details,
            date: booking.date,
            start_time: booking.start_time,
            end_time: booking.end_time,
            total_amount: booking.total_amount || undefined,
          });

          if (emailResult.success) {
            // Email confirmation sent successfully
            await supabase
              .from("bookings")
              .update({ email_sent: true })
              .eq("id", id);
          } else {
            console.error("[Admin Bookings] Email confirmation failed:", emailResult.error);
          }
        } catch (emailError) {
          console.error("[Admin Bookings] Failed to send email confirmation:", emailError);
        }
      }
    }

    // Log the action
    await supabase.from("audit_logs").insert({
      admin_id: admin.user.id,
      action: "update",
      entity_type: "booking",
      entity_id: id,
      old_data: existingBooking,
      new_data: updates,
    });

    // Log booking update/cancellation to Google Sheet
    try {
      if (status === "cancelled") {
        await logBookingCancellation({
          id: id,
          date: booking.date,
          studio: booking.studio,
          session_type: booking.session_type,
          session_details: booking.session_details,
          start_time: booking.start_time,
          end_time: booking.end_time,
          name: booking.name,
          phone_number: booking.phone_number,
          // Fetch email if not strictly available in booking object (it might not be)
          // valid_email logic could be complex here, so we might want to fetch user again or just let it be empty if not in booking
          // However, for update, we usually have the email if we just sent it.
          // Let's rely on what we have or fetch if needed.
          // Ideally we used `userData.email` above for sending email. 
          // Re-fetching just to be safe for logging is acceptable but inefficient.
          // But `logBookingCancellation` takes `email` as optional string.
          // Note: `userData` is defined in the block above for `status === confirmed`. It might not be available here. 
          // Let's attempt to use what we know.
          email: undefined, // We don't have email easily available here unless confirmed. 
          total_amount: booking.total_amount || undefined,
          cancellation_reason: notes || "Cancelled by admin",
        });
      } else {
         await logBookingUpdate({
          id: id,
          date: booking.date,
          studio: booking.studio,
          session_type: booking.session_type,
          session_details: booking.session_details,
          start_time: booking.start_time,
          end_time: booking.end_time,
          name: booking.name,
          phone_number: booking.phone_number,
          email: undefined,
          total_amount: booking.total_amount || undefined,
          status: booking.status,
          notes: booking.notes,
        });
      }
    } catch (sheetError) {
      console.error("[Admin Bookings] Failed to log to Google Sheet:", sheetError);
    }

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

// DELETE /api/admin/bookings?id=xxx - Permanently delete a booking
export async function DELETE(request: NextRequest) {
  const admin = await verifyAdminToken(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Missing required parameter: id" },
      { status: 400 }
    );
  }

  const supabase = supabaseAdmin();

  // Get booking data before deletion for audit log
  const { data: existingBooking } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .single();

  if (!existingBooking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // Delete Google Calendar event if it exists
  const hasGoogleConfig =
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REFRESH_TOKEN &&
    process.env.OWNER_CALENDAR_ID;

  if (hasGoogleConfig && existingBooking.google_event_id) {
    try {
      await deleteEvent(existingBooking.google_event_id);
      // Google Calendar event deleted for booking deletion
    } catch (calendarError) {
      console.error("[Admin Bookings] Failed to delete Google Calendar event:", calendarError);
      // Don't fail the request, just log the error
    }
  }

  // Log cancellation to Google Sheet BEFORE deleting (so we have the data)
  // Deleting a booking is effectively a "hard" cancellation or removal.
  // We should log it as CANCELLED in the sheet so the slot appears free or accounted for.
  try {
     await logBookingCancellation({
        id: existingBooking.id,
        date: existingBooking.date,
        studio: existingBooking.studio,
        session_type: existingBooking.session_type,
        session_details: existingBooking.session_details,
        start_time: existingBooking.start_time,
        end_time: existingBooking.end_time,
        name: existingBooking.name,
        phone_number: existingBooking.phone_number,
        email: undefined,
        total_amount: existingBooking.total_amount || undefined,
        cancellation_reason: "Deleted by admin",
      });
  } catch (sheetError) {
    console.error("[Admin Bookings] Failed to log deletion to Google Sheet:", sheetError);
  }

  // Delete the booking
  const { error } = await supabase
    .from("bookings")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log the action
  await supabase.from("audit_logs").insert({
    admin_id: admin.user.id,
    action: "delete",
    entity_type: "booking",
    entity_id: id,
    old_data: existingBooking,
  });

  return NextResponse.json({ success: true });
}
