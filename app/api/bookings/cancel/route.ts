import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { deleteEvent } from "@/lib/googleCalendar";
import { sendBookingCancellationEmail } from "@/lib/email";
import { logBookingCancellation, logOriginalBooking } from "@/lib/googleSheets";

// POST /api/bookings/cancel - Cancel a booking (no OTP verification required)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, phone, reason } = body;

    // Validate inputs
    if (!bookingId) {
      return NextResponse.json(
        { error: "Booking ID is required" },
        { status: 400 }
      );
    }

    const normalizedPhone = phone?.replace(/\D/g, "");
    if (!normalizedPhone || normalizedPhone.length !== 10) {
      return NextResponse.json(
        { error: "Phone number must be exactly 10 digits" },
        { status: 400 }
      );
    }

    // Get the booking and verify it belongs to the user
    const { data: booking, error: fetchError } = await supabaseServer
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .eq("phone_number", normalizedPhone)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json(
        { error: "Booking not found or does not belong to this phone number" },
        { status: 404 }
      );
    }

    // Check if booking can be cancelled
    if (booking.status === "cancelled") {
      return NextResponse.json(
        { error: "This booking is already cancelled" },
        { status: 400 }
      );
    }

    if (booking.status === "completed") {
      return NextResponse.json(
        { error: "Cannot cancel a completed booking" },
        { status: 400 }
      );
    }

    // Check if booking is in the past
    const bookingDate = new Date(`${booking.date}T${booking.start_time}`);
    if (bookingDate < new Date()) {
      return NextResponse.json(
        { error: "Cannot cancel a past booking" },
        { status: 400 }
      );
    }

    // Check if booking is within 24 hours
    const hoursUntilBooking = (bookingDate.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntilBooking < 24) {
      return NextResponse.json(
        { error: "Cannot cancel a booking within 24 hours of the session. Please contact us directly for assistance." },
        { status: 400 }
      );
    }

    // Update the booking status to cancelled
    const { data: updatedBooking, error: updateError } = await supabaseServer
      .from("bookings")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason || "Cancelled by user",
      })
      .eq("id", bookingId)
      .select()
      .single();

    if (updateError) {
      console.error("[Cancel Booking] Update error:", updateError);
      return NextResponse.json(
        { error: "Failed to cancel booking" },
        { status: 500 }
      );
    }

    // Delete Google Calendar event if it exists
    const hasGoogleConfig =
      process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REFRESH_TOKEN &&
      process.env.OWNER_CALENDAR_ID;

    if (hasGoogleConfig && booking.google_event_id) {
      try {
        await deleteEvent(booking.google_event_id);
        console.log(`[Cancel Booking] Google Calendar event ${booking.google_event_id} deleted`);
      } catch (calendarError) {
        // Log error but don't fail the cancellation
        console.error("[Cancel Booking] Failed to delete Google Calendar event:", calendarError);
      }
    }

    // Send cancellation email
    const hasResendConfig = 
      process.env.RESEND_API_KEY &&
      process.env.RESEND_FROM_EMAIL;

    // Get user email
    const { data: userData } = await supabaseServer
      .from("users")
      .select("email")
      .eq("phone_number", normalizedPhone)
      .single();

    if (hasResendConfig && userData?.email) {
      try {
        const emailResult = await sendBookingCancellationEmail(userData.email, {
          id: bookingId,
          name: booking.name || undefined,
          studio: booking.studio,
          session_type: booking.session_type,
          date: booking.date,
          start_time: booking.start_time,
          end_time: booking.end_time,
        });
        
        if (emailResult.success) {
          // Email notification sent successfully
        } else {
          console.error("[Cancel Booking] Email notification failed:", emailResult.error);
        }
      } catch (emailError) {
        console.error("[Cancel Booking] Failed to send email notification:", emailError);
      }
    }

    // Booking cancelled successfully

    // Log cancellation to Google Sheet
    try {
      // First log the original booking state
      await logOriginalBooking({
        id: booking.id,
        date: booking.date,
        studio: booking.studio,
        session_type: booking.session_type,
        session_details: booking.session_details,
        start_time: booking.start_time,
        end_time: booking.end_time,
        name: booking.name,
        phone_number: booking.phone_number,
        email: userData?.email,
        total_amount: booking.total_amount ?? undefined,
        status: booking.status,
        notes: booking.notes || "Original booking before user cancellation",
        created_at: booking.created_at
      });

      // Then log the cancellation
      await logBookingCancellation({
        id: bookingId,
        date: booking.date,
        studio: booking.studio,
        session_type: booking.session_type,
        session_details: booking.session_details,
        start_time: booking.start_time,
        end_time: booking.end_time,
        name: booking.name,
        phone_number: normalizedPhone,
        email: userData?.email,
        total_amount: booking.total_amount ?? undefined,
        cancellation_reason: reason || "Cancelled by user",
      });
    } catch (sheetError) {
      console.error("[Cancel Booking] Failed to log cancellation to Google Sheet:", sheetError);
    }

    return NextResponse.json({
      success: true,
      message: "Booking cancelled successfully",
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("[Cancel Booking] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
