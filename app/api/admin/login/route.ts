import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAdminUser } from "@/lib/apiSecurity";

// POST /api/admin/login - Verify admin status after Supabase auth
export async function POST(request: NextRequest) {
  try {
    // Identity comes from the Supabase access token, never from the request body
    const tokenUser = await getAdminUser(request);
    if (!tokenUser) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in again" },
        { status: 401 }
      );
    }
    const userId = tokenUser.id;

    const supabase = supabaseAdmin();

    // Check if user exists in admin_users table
    const { data: adminUser, error: adminError } = await supabase
      .from("admin_users")
      .select("*")
      .eq("id", userId)
      .eq("is_active", true)
      .single();

    if (adminError || !adminUser) {
      return NextResponse.json(
        { error: "Unauthorized - Not an admin user" },
        { status: 403 }
      );
    }

    // Check if role is 'admin' or 'super_admin' (not staff)
    if (adminUser.role !== "admin" && adminUser.role !== "super_admin") {
      return NextResponse.json(
        { error: "Unauthorized - This login is for administrators only. Staff should use /staff" },
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
      admin: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
      },
    });
  } catch (error) {
    console.error("[Admin Login API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
