import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseServer } from "@/lib/supabaseServer";
import { getAdminUser } from "@/lib/apiSecurity";

async function requireAdmin(request: NextRequest) {
  const admin = await getAdminUser(request);
  if (!admin || !["admin", "super_admin"].includes(admin.role)) return null;
  return admin;
}

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await supabaseServer
    .from("password_reset_requests")
    .select("id, phone_number, name, status, admin_note, created_at, resolved_at")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Unable to load password requests." }, { status: 500 });
  return NextResponse.json({ requests: data || [] });
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const requestId = String(body.id ?? "");
  const password = String(body.password ?? "");
  const note = String(body.note ?? "").trim().slice(0, 300);
  if (!requestId || password.length < 8 || password.length > 128) {
    return NextResponse.json({ error: "A valid request and an 8–128 character password are required." }, { status: 400 });
  }

  const { data: resetRequest, error: requestError } = await supabaseServer
    .from("password_reset_requests")
    .select("id, phone_number, name")
    .eq("id", requestId)
    .single();
  if (requestError || !resetRequest) return NextResponse.json({ error: "Password request not found." }, { status: 404 });

  const passwordHash = await bcrypt.hash(password, 12);
  const { data: existingUser } = await supabaseServer
    .from("users")
    .select("phone_number")
    .eq("phone_number", resetRequest.phone_number)
    .maybeSingle();

  const userResult = existingUser
    ? await supabaseServer.from("users").update({ password_hash: passwordHash, name: resetRequest.name }).eq("phone_number", resetRequest.phone_number)
    : await supabaseServer.from("users").insert({ phone_number: resetRequest.phone_number, name: resetRequest.name, password_hash: passwordHash });
  if (userResult.error) return NextResponse.json({ error: "Unable to update the customer password." }, { status: 500 });

  const { error: updateError } = await supabaseServer
    .from("password_reset_requests")
    .update({ status: "resolved", admin_note: note || null, resolved_at: new Date().toISOString() })
    .eq("id", requestId);
  if (updateError) return NextResponse.json({ error: "Password changed, but request status could not be updated." }, { status: 500 });

  return NextResponse.json({ success: true, phone: resetRequest.phone_number });
}
