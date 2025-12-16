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
    console.error("[Admin Stats] Auth error:", error?.message);
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
    console.error("[Admin Stats] Admin check error:", adminError?.message);
    return null;
  }

  return { user, adminUser };
}

// GET /api/admin/stats - Get dashboard statistics
export async function GET(request: NextRequest) {
  const admin = await verifyAdminToken(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = supabaseAdmin();
  const today = new Date().toISOString().split('T')[0];

  try {
    // Get total bookings count
    const { count: totalBookings } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true });

    // Get confirmed bookings count
    const { count: confirmedBookings } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("status", "confirmed");


    // Get cancelled bookings count
    const { count: cancelledBookings } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("status", "cancelled");

    // Get today's bookings count
    const { count: todayBookings } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("date", today)
      .in("status", ["confirmed"]);

    // Get total revenue from confirmed/completed bookings
    const { data: revenueData } = await supabase
      .from("bookings")
      .select("total_amount")
      .in("status", ["confirmed", "completed"]);

    const totalRevenue = revenueData?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;

    // Get available slots count for today
    const { count: availableSlots } = await supabase
      .from("availability_slots")
      .select("*", { count: "exact", head: true })
      .gte("date", today)
      .eq("is_available", true);

    return NextResponse.json({
      totalBookings: totalBookings || 0,
      confirmedBookings: confirmedBookings || 0,
      cancelledBookings: cancelledBookings || 0,
      todayBookings: todayBookings || 0,
      totalRevenue,
      availableSlots: availableSlots || 0,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
