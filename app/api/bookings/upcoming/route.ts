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

    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const currentTime = today.toTimeString().slice(0, 5); // HH:MM format

    // Query upcoming bookings where:
    // - phone_number matches
    // - status is 'confirmed' or 'pending'
    // - date is today or in the future
    // For today's date, only include bookings where start_time hasn't passed
    const { data: bookings, error: bookingsError } = await supabaseServer
      .from("bookings")
      .select("*")
      .eq("phone_number", normalizedPhone)
      .in("status", ["confirmed", "pending"])
      .or(`date.gt.${todayStr},and(date.eq.${todayStr},start_time.gte.${currentTime})`)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });

    if (bookingsError) {
      console.error("[Upcoming Bookings API] Database error:", bookingsError);
      return NextResponse.json(
        { error: bookingsError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ bookings: bookings || [] });
  } catch (error) {
    console.error("[Upcoming Bookings API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
