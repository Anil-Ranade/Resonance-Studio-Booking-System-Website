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

  const supabase = supabaseAdmin();
  const { data: adminUser, error: adminError } = await supabase
    .from("admin_users")
    .select("*")
    .eq("id", user.id)
    .eq("is_active", true)
    .single();

  if (adminError || !adminUser) {
    return null;
  }

  return { user, adminUser };
}

// POST /api/admin/whatsapp-reminder - Mark a booking reminder as sent
export async function POST(request: NextRequest) {
  const admin = await verifyAdminToken(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { booking_id } = body;

    if (!booking_id) {
      return NextResponse.json(
        { error: "Missing required field: booking_id" },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin();

    // Update the booking with the reminder sent timestamp
    const { data: booking, error } = await supabase
      .from("bookings")
      .update({ whatsapp_reminder_sent_at: new Date().toISOString() })
      .eq("id", booking_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log the action
    await supabase.from("audit_logs").insert({
      admin_id: admin.user.id,
      action: "whatsapp_reminder_sent",
      entity_type: "booking",
      entity_id: booking_id,
      new_data: { whatsapp_reminder_sent_at: booking.whatsapp_reminder_sent_at },
    });

    return NextResponse.json({ 
      success: true, 
      whatsapp_reminder_sent_at: booking.whatsapp_reminder_sent_at 
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
