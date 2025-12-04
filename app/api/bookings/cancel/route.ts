import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { deleteEvent } from "@/lib/googleCalendar";
import { sendSMS } from "@/lib/sms";

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

    // Cancel any pending reminders for this booking
    try {
      const { error: reminderError } = await supabaseServer
        .from("reminders")
        .update({ status: "cancelled" })
        .eq("booking_id", bookingId)
        .eq("status", "pending");

      if (reminderError) {
        console.error("[Cancel Booking] Failed to cancel reminders:", reminderError);
      } else {
        console.log(`[Cancel Booking] Pending reminders for booking ${bookingId} cancelled`);
      }
    } catch (reminderError) {
      // Log error but don't fail the cancellation
      console.error("[Cancel Booking] Error cancelling reminders:", reminderError);
    }

    // Send cancellation SMS
    const hasTwilioConfig = 
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_SMS_NUMBER;

    if (hasTwilioConfig) {
      const countryCode = process.env.SMS_COUNTRY_CODE || "+91";
      const toNumber = `${countryCode}${normalizedPhone}`;

      try {
        const formattedDate = new Date(booking.date).toLocaleDateString('en-IN', { 
          weekday: 'short', 
          day: 'numeric', 
          month: 'short' 
        });
        const message = `Booking Cancelled\n\nYour booking at ${booking.studio} on ${formattedDate} (${booking.start_time} - ${booking.end_time}) has been cancelled.\n\nBooking ID: ${bookingId.slice(0, 8)}\n\nWe hope to see you again at Resonance Studio!`;
        
        const smsResult = await sendSMS(toNumber, message);
        
        if (smsResult.success) {
          console.log("[Cancel Booking] SMS notification sent successfully:", smsResult.sid);
        } else {
          console.error("[Cancel Booking] SMS notification failed:", smsResult.error);
        }
      } catch (smsError) {
        console.error("[Cancel Booking] Failed to send SMS notification:", smsError);
      }
    }

    console.log(`[Cancel Booking] Booking ${bookingId} cancelled successfully`);

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
