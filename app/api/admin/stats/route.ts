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

  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const studio = searchParams.get("studio");

  const supabase = supabaseAdmin();
  const today = new Date().toISOString().split('T')[0];

  try {
    // Helper function to apply filters to a query
    const applyFilters = (query: any) => {
      if (startDate) {
        query = query.gte("date", startDate);
      }
      if (endDate) {
        query = query.lte("date", endDate);
      }
      if (studio && studio !== "all") {
        query = query.eq("studio", studio);
      }
      return query;
    };

    // Get total bookings count (filtered)
    let totalQuery = supabase
      .from("bookings")
      .select("*", { count: "exact", head: true });
    totalQuery = applyFilters(totalQuery);
    const { count: totalBookings } = await totalQuery;

    // Get confirmed bookings count (filtered)
    let confirmedQuery = supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("status", "confirmed");
    confirmedQuery = applyFilters(confirmedQuery);
    const { count: confirmedBookings } = await confirmedQuery;

    // Get cancelled bookings count (filtered)
    let cancelledQuery = supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("status", "cancelled");
    cancelledQuery = applyFilters(cancelledQuery);
    const { count: cancelledBookings } = await cancelledQuery;

    // Get completed bookings count (filtered)
    let completedQuery = supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed");
    completedQuery = applyFilters(completedQuery);
    const { count: completedBookings } = await completedQuery;

    // Get today's bookings count (always today, but filtered by studio if specified)
    let todayQuery = supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("date", today)
      .in("status", ["confirmed"]);
    if (studio && studio !== "all") {
      todayQuery = todayQuery.eq("studio", studio);
    }
    const { count: todayBookings } = await todayQuery;

    // Get total revenue from confirmed/completed bookings (filtered)
    let revenueQuery = supabase
      .from("bookings")
      .select("total_amount")
      .in("status", ["confirmed", "completed"]);
    revenueQuery = applyFilters(revenueQuery);
    const { data: revenueData } = await revenueQuery;

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
      completedBookings: completedBookings || 0,
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
