import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// PUT /api/admin/staff/[id] - Update a staff member
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name, role, is_active } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Staff ID is required" },
        { status: 400 }
      );
    }

    // Validate role if provided
    const validRoles = ["staff", "admin"];
    if (role && !validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be: staff or admin" },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin();

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (role !== undefined) updateData.role = role;
    if (is_active !== undefined) updateData.is_active = is_active;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    // Update admin_users table
    const { data: staffMember, error: updateError } = await supabase
      .from("admin_users")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("[Staff API] Update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update staff member" },
        { status: 500 }
      );
    }

    if (!staffMember) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      );
    }

    // Also update user metadata in Supabase Auth if name changed
    if (name !== undefined) {
      await supabase.auth.admin.updateUserById(id, {
        user_metadata: { name, role: staffMember.role },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Staff member updated successfully",
      staff: staffMember,
    });
  } catch (error) {
    console.error("[Staff API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/staff/[id] - Permanently delete a staff member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Staff ID is required" },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin();

    // First, get the staff member to confirm they exist
    const { data: existingStaff, error: fetchError } = await supabase
      .from("admin_users")
      .select("id, email, name")
      .eq("id", id)
      .single();

    if (fetchError || !existingStaff) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      );
    }

    // Delete from admin_users table first
    const { error: deleteError } = await supabase
      .from("admin_users")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("[Staff API] Delete from admin_users error:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete staff member" },
        { status: 500 }
      );
    }

    // Then delete from Supabase Auth
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(id);

    if (authDeleteError) {
      console.error("[Staff API] Delete from auth error:", authDeleteError);
      // Note: admin_users record is already deleted, but auth user remains
      // This is a partial failure state
      return NextResponse.json({
        success: true,
        warning: "Staff record deleted but auth account may remain",
        message: "Staff member deleted from records",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Staff member permanently deleted",
    });
  } catch (error) {
    console.error("[Staff API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

