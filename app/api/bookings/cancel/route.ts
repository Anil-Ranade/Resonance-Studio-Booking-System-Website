import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { verifyOTP } from "@/lib/otpStore";
import { deleteEvent } from "@/lib/googleCalendar";

// POST /api/bookings/cancel - Cancel a booking with OTP verification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, phone, otp, reason } = body;

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

    if (!otp) {
      return NextResponse.json(
        { error: "OTP is required" },
        { status: 400 }
      );
    }

    // Verify OTP
    const otpResult = await verifyOTP(normalizedPhone, otp);
    if (!otpResult.success) {
      return NextResponse.json(
        { error: otpResult.error },
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
