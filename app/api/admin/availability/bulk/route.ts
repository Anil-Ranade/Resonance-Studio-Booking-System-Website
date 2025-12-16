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
    console.error("[Admin Bulk] Auth error:", error?.message);
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
    console.error("[Admin Bulk] Admin check error:", adminError?.message);
    return null;
  }

  return { user, adminUser };
}

// POST /api/admin/availability/bulk - Block multiple time slots at once
export async function POST(request: NextRequest) {
  const admin = await verifyAdminToken(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { studio, dates, start_time, end_time } = body;
    // Blocked slots have is_available = false
    const is_available = false;

    if (!studio || !dates || !Array.isArray(dates) || dates.length === 0 || !start_time || !end_time) {
      return NextResponse.json(
        { error: "Missing required fields: studio, dates (array), start_time, end_time" },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin();

    // Check for past dates (using IST timezone)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    const istNow = new Date(now.getTime() + istOffset);
    const istToday = istNow.toISOString().split('T')[0];
    const istCurrentTime = istNow.toISOString().split('T')[1].substring(0, 5);

    // Filter out past dates and today if time has passed
    const validDates = dates.filter((date: string) => {
      if (date < istToday) return false;
      if (date === istToday && start_time < istCurrentTime) return false;
      return true;
    });

    if (validDates.length === 0) {
      return NextResponse.json(
        { error: "All provided dates/times are in the past" },
        { status: 400 }
      );
    }

    // Check for conflicting bookings for all valid dates
    const { data: conflictingBookings } = await supabase
      .from("bookings")
      .select("id, date")
      .eq("studio", studio)
      .in("date", validDates)
      .eq("status", "confirmed")
      .lt("start_time", end_time)
      .gt("end_time", start_time);

    // Filter out dates that have conflicting bookings
    const conflictingDates = new Set(conflictingBookings?.map(b => b.date) || []);
    const finalDates = validDates.filter((date: string) => !conflictingDates.has(date));

    if (finalDates.length === 0) {
      return NextResponse.json(
        { error: "All slots conflict with existing confirmed bookings" },
        { status: 409 }
      );
    }

    // Create blocked slots for each valid date
    const slotsToInsert = finalDates.map((date: string) => ({
      studio,
      date,
      start_time,
      end_time,
      is_available,
      created_by: admin.user.id,
    }));

    const { data: slots, error } = await supabase
      .from("availability_slots")
      .upsert(slotsToInsert, {
        onConflict: "studio,date,start_time,end_time",
        ignoreDuplicates: false,
      })
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log the action
    await supabase.from("audit_logs").insert({
      admin_id: admin.user.id,
      action: "bulk_block",
      entity_type: "availability_slot",
      new_data: { count: slots?.length, studio, dates, start_time, end_time },
    });

    return NextResponse.json({ success: true, slots, count: slots?.length });
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

// DELETE /api/admin/availability/bulk - Unblock multiple slots (delete blocked slot records)
export async function DELETE(request: NextRequest) {
  const admin = await verifyAdminToken(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { ids, studio, startDate, endDate } = body;

    const supabase = supabaseAdmin();

    if (ids && Array.isArray(ids) && ids.length > 0) {
      // Delete by IDs
      const { error } = await supabase
        .from("availability_slots")
        .delete()
        .in("id", ids);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Log the action
      await supabase.from("audit_logs").insert({
        admin_id: admin.user.id,
        action: "bulk_unblock",
        entity_type: "availability_slot",
        old_data: { ids },
      });

      return NextResponse.json({ success: true, deletedCount: ids.length });
    } else if (studio && startDate && endDate) {
      // Delete by studio and date range
      const { data: deletedSlots, error } = await supabase
        .from("availability_slots")
        .delete()
        .eq("studio", studio)
        .gte("date", startDate)
        .lte("date", endDate)
        .select();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Log the action
      await supabase.from("audit_logs").insert({
        admin_id: admin.user.id,
        action: "bulk_unblock",
        entity_type: "availability_slot",
        old_data: { studio, startDate, endDate, count: deletedSlots?.length },
      });

      return NextResponse.json({ success: true, deletedCount: deletedSlots?.length });
    } else {
      return NextResponse.json(
        { error: "Must provide either 'ids' array or 'studio', 'startDate', and 'endDate'" },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
