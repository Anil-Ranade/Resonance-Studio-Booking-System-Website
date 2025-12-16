import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";

// Verify staff token from Authorization header
async function verifyStaffToken(request: NextRequest) {
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
    return null;
  }

  // Use admin client to check admin_users table for staff role
  const supabase = supabaseAdmin();
  const { data: staffUser, error: staffError } = await supabase
    .from("admin_users")
    .select("*")
    .eq("id", user.id)
    .eq("is_active", true)
    .eq("role", "staff")
    .single();

  if (staffError || !staffUser) {
    return null;
  }

  return { user, staffUser };
}

// GET /api/staff/stats - Get stats for bookings created by this staff member
export async function GET(request: NextRequest) {
  const staff = await verifyStaffToken(request);
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = supabaseAdmin();
  const today = new Date().toISOString().split("T")[0];

  // Get all bookings created by this staff member
  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("status, total_amount, date")
    .eq("created_by_staff_id", staff.user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Calculate stats
  const totalBookings = bookings?.length || 0;
  const confirmedBookings = bookings?.filter(b => b.status === "confirmed").length || 0;
  const cancelledBookings = bookings?.filter(b => b.status === "cancelled").length || 0;
  const completedBookings = bookings?.filter(b => b.status === "completed").length || 0;
  const todayBookings = bookings?.filter(b => b.date === today && b.status === "confirmed").length || 0;

  return NextResponse.json({
    totalBookings,
    confirmedBookings,
    cancelledBookings,
    completedBookings,
    todayBookings,
    availableSlots: 0, // Staff don't have access to availability management
  });
}
