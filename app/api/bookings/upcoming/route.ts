import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

// GET /api/bookings/upcoming?phone=XXXXXXXXXX - Fetch only upcoming bookings by phone number
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Normalize phone to digits only
    const normalizedPhone = phone.replace(/\D/g, "");

    // Validate exactly 10 digits
    if (normalizedPhone.length !== 10) {
      return NextResponse.json(
        { error: "Phone number must be exactly 10 digits" },
        { status: 400 }
      );
    }

    // Get today's date in YYYY-MM-DD format (using IST timezone)
    const now = new Date();
    // Convert to IST (UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);
    const todayStr = istNow.toISOString().split('T')[0];
    const currentTime = istNow.toISOString().slice(11, 16); // HH:MM format

    // First, get all confirmed/pending bookings for this phone
    const { data: allBookings, error: bookingsError } = await supabaseServer
      .from("bookings")
      .select("*")
      .eq("phone_number", normalizedPhone)
      .in("status", ["confirmed", "pending"])
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });

    if (bookingsError) {
      console.error("[Upcoming Bookings API] Database error:", bookingsError);
      return NextResponse.json(
        { error: bookingsError.message },
        { status: 500 }
      );
    }

    // Filter for upcoming bookings client-side for more reliable filtering
    const upcomingBookings = (allBookings || []).filter(booking => {
      // If date is in the future, include it
      if (booking.date > todayStr) {
        return true;
      }
      // If date is today, check if start time hasn't passed
      if (booking.date === todayStr) {
        return booking.start_time >= currentTime;
      }
      // Date is in the past
      return false;
    });

    return NextResponse.json({ bookings: upcomingBookings });
  } catch (error) {
    console.error("[Upcoming Bookings API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
