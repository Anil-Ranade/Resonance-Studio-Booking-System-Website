import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { hasDisplaySession, isDate, isStudio, rateLimit } from "@/lib/apiSecurity";

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

// GET /api/display/bookings - Bookings for a date. Public callers (availability page)
// get times only; the password-unlocked display screen also gets names and phones.
export async function GET(request: NextRequest) {
  try {
    const limited = await rateLimit(request, "display_bookings", 120, 600);
    if (limited) return limited;

    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get("date");
    const studio = searchParams.get("studio");

    if (!isDate(date)) {
      return NextResponse.json(
        { error: "A valid date is required" },
        { status: 400 }
      );
    }
    if (studio && studio !== "all" && !isStudio(studio)) {
      return NextResponse.json({ error: "Invalid studio" }, { status: 400 });
    }

    const fields = hasDisplaySession(request)
      ? "id, name, phone_number, start_time, end_time, status, session_type, session_details, studio, date"
      : "id, start_time, end_time, status, session_type, studio, date";

    // Build query for bookings on the specified date
    let query = supabaseServer
      .from("bookings")
      .select(fields)
      .eq("date", date)
      .in("status", ["confirmed"])
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
