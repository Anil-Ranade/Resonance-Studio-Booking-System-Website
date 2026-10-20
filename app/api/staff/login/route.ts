import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAdminUser } from "@/lib/apiSecurity";
import { createCookieHeader, STAFF_SESSION_COOKIE } from "@/lib/tokens";

// POST /api/staff/login - Verify staff status after Supabase auth
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

    if (staffUser.role !== "staff") {
      return NextResponse.json(
        { error: "Unauthorized - This login is for staff only. Admins should use /admin" },
        { status: 403 }
      );
    }

    // Update last login timestamp
    await supabase
      .from("admin_users")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", userId);

    const response = NextResponse.json({
      success: true,
      staff: {
        id: staffUser.id,
        email: staffUser.email,
        name: staffUser.name,
        role: staffUser.role,
      },
    });
    response.headers.append("Set-Cookie", createCookieHeader(STAFF_SESSION_COOKIE, request.headers.get("authorization")!.slice("Bearer ".length), 60 * 60 * 8));
    return response;
  } catch (error) {
    console.error("[Staff Login API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
