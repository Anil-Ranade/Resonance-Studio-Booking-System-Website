import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/admin/staff - List all staff members
export async function GET() {
  try {
    const supabase = supabaseAdmin();

    const { data: staffMembers, error } = await supabase
      .from("admin_users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Staff API] Error fetching staff:", error);
      return NextResponse.json(
        { error: "Failed to fetch staff members" },
        { status: 500 }
      );
    }

    return NextResponse.json({ staff: staffMembers });
  } catch (error) {
    console.error("[Staff API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/admin/staff - Create a new staff member
export async function POST(request: NextRequest) {
  try {
    const { name, email, password, role } = await request.json();

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ["staff", "admin"];
    if (role && !validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be: staff or admin" },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin();

    // Step 1: Create user in Supabase Auth
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          name: name || email.split("@")[0],
          role: role || "staff",
        },
      });

    if (authError) {
      console.error("[Staff API] Auth error:", authError);

      // Handle duplicate email
      if (authError.message.includes("already been registered")) {
        return NextResponse.json(
          { error: "A user with this email already exists" },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: authError.message || "Failed to create user account" },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Failed to create user account" },
        { status: 500 }
      );
    }

    // Step 2: Insert into admin_users table
    const { data: staffMember, error: insertError } = await supabase
      .from("admin_users")
      .insert({
        id: authData.user.id,
        email: email,
        name: name || email.split("@")[0],
        role: role || "staff",
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error("[Staff API] Insert error:", insertError);

      // Rollback: Delete the auth user if admin_users insert fails
      await supabase.auth.admin.deleteUser(authData.user.id);

      return NextResponse.json(
        { error: "Failed to create staff record" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Staff member created successfully",
        staff: staffMember,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Staff API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
