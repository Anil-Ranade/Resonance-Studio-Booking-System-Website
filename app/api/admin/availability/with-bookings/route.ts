import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";

// Verify admin token from Authorization header
async function verifyAdminToken(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];
  
  // Create a client with the user's access token to verify it
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const { data: { user }, error } = await supabaseAuth.auth.getUser();
  
  if (error || !user) {
    console.error("[Admin With-Bookings] Auth error:", error?.message);
    return null;
  }

  // Use admin client to check admin_users table
  const supabase = supabaseAdmin();
  const { data: adminUser, error: adminError } = await supabase
    .from("admin_users")
    .select("*")
    .eq("id", user.id)
    .eq("is_active", true)
    .single();

  if (adminError || !adminUser) {
    console.error("[Admin With-Bookings] Admin check error:", adminError?.message);
    return null;
  }

  return { user, adminUser };
}

interface Booking {
  id: string;
  name: string | null;
  whatsapp_number: string;
  start_time: string;
  end_time: string;
  status: string;
  session_type: string | null;
}

interface AvailabilityWithBookings {
  id: string;
  studio: string;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  created_at: string;
  bookings: Booking[];
}

// GET /api/admin/availability/with-bookings - Get availability slots with their bookings
export async function GET(request: NextRequest) {
  const admin = await verifyAdminToken(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const studio = searchParams.get("studio");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const supabase = supabaseAdmin();

  // Build availability query
  let availabilityQuery = supabase
    .from("availability_slots")
    .select("*")
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });

  if (studio && studio !== "all") {
    availabilityQuery = availabilityQuery.eq("studio", studio);
  }
  if (startDate) {
    availabilityQuery = availabilityQuery.gte("date", startDate);
  }
  if (endDate) {
    availabilityQuery = availabilityQuery.lte("date", endDate);
  }

  const { data: slots, error: slotsError } = await availabilityQuery;

  if (slotsError) {
    return NextResponse.json({ error: slotsError.message }, { status: 500 });
  }

  if (!slots || slots.length === 0) {
    return NextResponse.json({ slots: [] });
  }

  // Get all bookings for the date range
  let bookingsQuery = supabase
    .from("bookings")
    .select("id, name, whatsapp_number, studio, date, start_time, end_time, status, session_type")
    .in("status", ["pending", "confirmed"]);

  if (studio && studio !== "all") {
    bookingsQuery = bookingsQuery.eq("studio", studio);
  }
  if (startDate) {
    bookingsQuery = bookingsQuery.gte("date", startDate);
  }
  if (endDate) {
    bookingsQuery = bookingsQuery.lte("date", endDate);
  }

  const { data: bookings, error: bookingsError } = await bookingsQuery;

  if (bookingsError) {
    return NextResponse.json({ error: bookingsError.message }, { status: 500 });
  }

  // Helper to check if booking overlaps with slot
  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const bookingOverlapsSlot = (
    booking: { studio: string; date: string; start_time: string; end_time: string },
    slot: { studio: string; date: string; start_time: string; end_time: string }
  ) => {
    if (booking.studio !== slot.studio || booking.date !== slot.date) {
      return false;
    }
    const bookingStart = timeToMinutes(booking.start_time);
    const bookingEnd = timeToMinutes(booking.end_time);
    const slotStart = timeToMinutes(slot.start_time);
    const slotEnd = timeToMinutes(slot.end_time);
    
    return bookingStart < slotEnd && bookingEnd > slotStart;
  };

  // Attach bookings to their slots
  const slotsWithBookings: AvailabilityWithBookings[] = slots.map((slot) => {
    const slotBookings = (bookings || []).filter((booking) =>
      bookingOverlapsSlot(booking, slot)
    );
    return {
      ...slot,
      bookings: slotBookings,
    };
  });

  return NextResponse.json({ slots: slotsWithBookings });
}
