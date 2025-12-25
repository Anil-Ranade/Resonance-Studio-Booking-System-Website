import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { deleteEvent } from "@/lib/googleCalendar";

// POST /api/bookings/cancel-silent - Cancel a booking for modifications
// This endpoint is used when a user modifies their booking after OTP verification
// NOTE: OTP verification must be done before calling this endpoint
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

    // Update the booking status to cancelled
    const { data: updatedBooking, error: updateError } = await supabaseServer
      .from("bookings")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason || "Booking modified by user",
      })
      .eq("id", bookingId)
      .select()
      .single();

    if (updateError) {
      console.error("[Cancel Silent] Update error:", updateError);
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
        console.log(`[Cancel Silent] Google Calendar event ${booking.google_event_id} deleted`);
      } catch (calendarError) {
        console.error("[Cancel Silent] Failed to delete Google Calendar event:", calendarError);
      }
    }

    console.log(`[Cancel Silent] Booking ${bookingId} cancelled for modification`);

    return NextResponse.json({
      success: true,
      message: "Booking cancelled for modification",
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("[Cancel Silent] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
