import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { cleanText, rateLimit } from "@/lib/apiSecurity";

export async function POST(request: Request) {
  const limited = await rateLimit(request, "password_reset_request", 3, 900);
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const phone = String(body.phone ?? "").replace(/\D/g, "");
  const name = cleanText(body.name, 100);
  if (!/^\d{10}$/.test(phone) || !name) {
    return NextResponse.json({ error: "Enter your 10-digit WhatsApp number and name." }, { status: 400 });
  }

  const { error } = await supabaseServer.from("password_reset_requests").insert({
    phone_number: phone,
    name,
  });
  if (error) {
    console.error("[Password Reset Request] Failed to save request:", error);
    return NextResponse.json({ error: "Unable to submit your request. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
