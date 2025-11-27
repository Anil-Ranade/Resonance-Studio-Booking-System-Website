import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/todays-bookings - Get bookings for a specific date (defaults to today)
export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseAdmin();

    // Get date from query params or default to today
    const searchParams = request.nextUrl.searchParams;
    const dateParam = searchParams.get("date");
    const today = dateParam || new Date().toISOString().split("T")[0];

    // Fetch all bookings for today that are confirmed or pending
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("date", today)
      .in("status", ["confirmed", "pending"])
      .order("studio", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      console.error("[Today's Bookings] Error fetching bookings:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get list of studios
    const { data: studios } = await supabase
      .from("studios")
      .select("name")
      .eq("is_active", true)
      .order("name", { ascending: true });

    const studioNames = studios?.map((s) => s.name) || [
      "Studio A",
      "Studio B",
      "Studio C",
    ];

    return NextResponse.json({
      date: today,
      studios: studioNames,
      bookings: bookings || [],
    });
  } catch (error) {
    console.error("[Today's Bookings] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
