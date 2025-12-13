import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// POST /api/staff/login - Verify staff status after Supabase auth
export async function POST(request: NextRequest) {
  try {
    const { userId, email } = await request.json();

    if (!userId || !email) {
      return NextResponse.json(
        { error: "Missing userId or email" },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin();

    // Check if user exists in admin_users table with role 'staff'
    const { data: staffUser, error: staffError } = await supabase
      .from("admin_users")
      .select("*")
      .eq("id", userId)
      .eq("is_active", true)
      .single();

    if (staffError || !staffUser) {
      return NextResponse.json(
        { error: "Unauthorized - Not a staff user" },
        { status: 403 }
      );
    }

    // Check if role is 'staff' (not admin or super_admin)
    if (staffUser.role !== "staff") {
      return NextResponse.json(
        { error: "Unauthorized - This login is for staff members only. Admins should use /admin" },
        { status: 403 }
      );
    }

    // Update last login timestamp
    await supabase
      .from("admin_users")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", userId);

    return NextResponse.json({
      success: true,
      staff: {
        id: staffUser.id,
        email: staffUser.email,
        name: staffUser.name,
        role: staffUser.role,
      },
    });
  } catch (error) {
    console.error("[Staff Login API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
