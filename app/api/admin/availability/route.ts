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
    console.error("[Admin Availability] Auth error:", error?.message);
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
    console.error("[Admin Availability] Admin check error:", adminError?.message);
    return null;
  }

  return { user, adminUser };
}

// GET /api/admin/availability - Get all availability slots
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

  let query = supabase
    .from("availability_slots")
    .select("*")
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });

  if (studio) {
    query = query.eq("studio", studio);
  }

  if (startDate) {
    query = query.gte("date", startDate);
  }

  if (endDate) {
    query = query.lte("date", endDate);
  }

  const { data: slots, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ slots });
}

// POST /api/admin/availability - Block a time slot (create blocked slot)
export async function POST(request: NextRequest) {
  const admin = await verifyAdminToken(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { studio, date, start_time, end_time } = body;
    // Blocked slots have is_available = false
    const is_available = false;

    if (!studio || !date || !start_time || !end_time) {
      return NextResponse.json(
        { error: "Missing required fields: studio, date, start_time, end_time" },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin();

    // Check for existing slot
    const { data: existing } = await supabase
      .from("availability_slots")
      .select("id")
      .eq("studio", studio)
      .eq("date", date)
      .eq("start_time", start_time)
      .eq("end_time", end_time)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "This slot is already blocked for this studio, date, and time" },
        { status: 409 }
      );
    }

    const { data: slot, error } = await supabase
      .from("availability_slots")
      .insert({
        studio,
        date,
        start_time,
        end_time,
        is_available,
        created_by: admin.user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log the action
    await supabase.from("audit_logs").insert({
      admin_id: admin.user.id,
      action: "block",
      entity_type: "availability_slot",
      entity_id: slot.id,
      new_data: slot,
    });

    return NextResponse.json({ success: true, slot });
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

// PUT /api/admin/availability - Update blocked slot
export async function PUT(request: NextRequest) {
  const admin = await verifyAdminToken(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, studio, date, start_time, end_time, is_available } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing required field: id" },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin();

    // Get existing slot for audit log
    const { data: existingSlot } = await supabase
      .from("availability_slots")
      .select("*")
      .eq("id", id)
      .single();

    if (!existingSlot) {
      return NextResponse.json({ error: "Slot not found" }, { status: 404 });
    }

    const updates: Record<string, any> = {};
    if (studio !== undefined) updates.studio = studio;
    if (date !== undefined) updates.date = date;
    if (start_time !== undefined) updates.start_time = start_time;
    if (end_time !== undefined) updates.end_time = end_time;
    if (is_available !== undefined) updates.is_available = is_available;

    const { data: slot, error } = await supabase
      .from("availability_slots")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log the action
    await supabase.from("audit_logs").insert({
      admin_id: admin.user.id,
      action: "update",
      entity_type: "availability_slot",
      entity_id: id,
      old_data: existingSlot,
      new_data: slot,
    });

    return NextResponse.json({ success: true, slot });
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

// DELETE /api/admin/availability - Unblock slot (delete blocked slot record)
export async function DELETE(request: NextRequest) {
  const admin = await verifyAdminToken(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Missing required parameter: id" },
      { status: 400 }
    );
  }

  const supabase = supabaseAdmin();

  // Get existing slot for audit log
  const { data: existingSlot } = await supabase
    .from("availability_slots")
    .select("*")
    .eq("id", id)
    .single();

  if (!existingSlot) {
    return NextResponse.json({ error: "Slot not found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("availability_slots")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log the action
  await supabase.from("audit_logs").insert({
    admin_id: admin.user.id,
    action: "unblock",
    entity_type: "availability_slot",
    entity_id: id,
    old_data: existingSlot,
  });

  return NextResponse.json({ success: true });
}
