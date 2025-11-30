import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

// GET /api/bookings?phone=XXXXXXXXXX&upcoming=true - Fetch bookings by phone number
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");
    const upcomingOnly = searchParams.get("upcoming") === "true";

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

    // Query bookings where phone_number = normalized and status IN ('confirmed','pending')
    const { data: bookings, error: bookingsError } = await supabaseServer
      .from("bookings")
      .select("*")
      .eq("phone_number", normalizedPhone)
      .in("status", ["confirmed", "pending"])
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });

    if (bookingsError) {
      return NextResponse.json(
        { error: bookingsError.message },
        { status: 500 }
      );
    }

    // If upcoming only, filter to only future bookings
    if (upcomingOnly) {
      const now = new Date();
      // Convert to IST (UTC+5:30)
      const istOffset = 5.5 * 60 * 60 * 1000;
      const istNow = new Date(now.getTime() + istOffset);
      const todayStr = istNow.toISOString().split('T')[0];
      const currentTime = istNow.toISOString().slice(11, 16);

      const upcomingBookings = (bookings || []).filter(booking => {
        if (booking.date > todayStr) return true;
        if (booking.date === todayStr) return booking.start_time >= currentTime;
        return false;
      });

      return NextResponse.json({ bookings: upcomingBookings });
    }

    return NextResponse.json({ bookings: bookings || [] });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
