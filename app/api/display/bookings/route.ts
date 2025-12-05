import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

interface Booking {
  id: string;
  name: string | null;
  phone_number: string;
  start_time: string;
  end_time: string;
  status: string;
  session_type: string | null;
  session_details: string | null;
  studio: string;
  date: string;
}

// GET /api/display/bookings - Get bookings for display page (public, no auth required)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get("date");
    const studio = searchParams.get("studio");

    if (!date) {
      return NextResponse.json(
        { error: "Date is required" },
        { status: 400 }
      );
    }

    // Build query for bookings on the specified date
    let query = supabaseServer
      .from("bookings")
      .select("id, name, phone_number, start_time, end_time, status, session_type, session_details, studio, date")
      .eq("date", date)
      .in("status", ["confirmed", "pending"])
      .order("start_time", { ascending: true });

    if (studio && studio !== "all") {
      query = query.eq("studio", studio);
    }

    const { data: bookings, error: bookingsError } = await query;

    if (bookingsError) {
      console.error("[Display Bookings API] Database error:", bookingsError);
      return NextResponse.json(
        { error: "Failed to fetch bookings" },
        { status: 500 }
      );
    }

    return NextResponse.json({ bookings: bookings || [] });
  } catch (error) {
    console.error("[Display Bookings API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
