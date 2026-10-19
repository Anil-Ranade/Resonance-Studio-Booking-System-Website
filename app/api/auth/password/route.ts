import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";
import {
  ACCESS_TOKEN_COOKIE, ACCESS_TOKEN_MAX_AGE, REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_MAX_AGE, createCookieHeader, generateAccessToken,
  generateRefreshToken, getRefreshTokenExpiryDate, hashRefreshToken,
} from "@/lib/tokens";
import { rateLimit } from "@/lib/apiSecurity";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const validPhone = (phone: string) => /^\d{10}$/.test(phone);
// Existing accounts may still have older passwords; new ones must be a 6-digit PIN.
const validPassword = (password: string) => password.length >= 1 && password.length <= 128;

/** Customer password registration/login. Plaintext exists only during this request. */
export async function POST(request: Request) {
  const limited = await rateLimit(request, "customer_password", 10, 900);
  if (limited) return limited;
  const body = await request.json().catch(() => ({}));
  const phone = String(body.phone ?? "").replace(/\D/g, "");
  const name = String(body.name ?? "").trim().slice(0, 100);
  const password = String(body.password ?? "");
  const confirmPassword = String(body.confirmPassword ?? "");
  const deviceFingerprint = String(body.deviceFingerprint ?? "").trim().slice(0, 128);
  const deviceName = String(body.deviceName ?? "Unknown Device").trim().slice(0, 100);
  if (!validPhone(phone)) return NextResponse.json({ error: "Enter a valid 10-digit WhatsApp number." }, { status: 400 });
  const phoneLimited = await rateLimit(request, "customer_password_phone", 10, 900, `phone:${phone}`);
  if (phoneLimited) return phoneLimited;
  if (!validPassword(password)) return NextResponse.json({ error: "Please enter your password or PIN." }, { status: 400 });

  const { data: user, error: lookupError } = await supabase.from("users").select("phone_number, name, email, password_hash").eq("phone_number", phone).maybeSingle();
  if (lookupError) return NextResponse.json({ error: "Unable to verify your details." }, { status: 500 });
  if (user?.password_hash) {
    if (!(await bcrypt.compare(password, user.password_hash))) return NextResponse.json({ error: "Incorrect password. If this is another device, use Forgot password." }, { status: 401 });
  } else {
    if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });
    if (!/^\d{6}$/.test(password)) return NextResponse.json({ error: "Please use a 6-digit PIN (numbers only)." }, { status: 400 });
    if (password !== confirmPassword) return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
    const passwordHash = await bcrypt.hash(password, 12);
    const result = user
      ? await supabase.from("users").update({ name, password_hash: passwordHash }).eq("phone_number", phone)
      : await supabase.from("users").insert({ phone_number: phone, name, password_hash: passwordHash });
    if (result.error) return NextResponse.json({ error: "Unable to save your password." }, { status: 500 });
  }

  const accessToken = generateAccessToken(phone);
  const refreshToken = generateRefreshToken(phone, deviceFingerprint || undefined);
  const { error: tokenError } = await supabase.from("refresh_tokens").insert({
    user_phone: phone, token_hash: hashRefreshToken(refreshToken),
    device_fingerprint: deviceFingerprint || null, device_name: deviceName,
    expires_at: getRefreshTokenExpiryDate().toISOString(),
  });
  if (tokenError) console.error("[Customer Password] Failed to store refresh token:", tokenError);
  if (deviceFingerprint) {
    await supabase.from("trusted_devices").upsert({ phone, device_fingerprint: deviceFingerprint, device_name: deviceName, last_used_at: new Date().toISOString(), is_active: true }, { onConflict: "phone,device_fingerprint" });
  }
  const response = NextResponse.json({ authenticated: true, user: { phone, name: user?.password_hash ? user.name || name : name } });
  response.headers.append("Set-Cookie", createCookieHeader(ACCESS_TOKEN_COOKIE, accessToken, ACCESS_TOKEN_MAX_AGE));
  response.headers.append("Set-Cookie", createCookieHeader(REFRESH_TOKEN_COOKIE, refreshToken, REFRESH_TOKEN_MAX_AGE));
  return response;
}

export async function GET(request: Request) {
  const limited = await rateLimit(request, "customer_password_status", 20, 600);
  if (limited) return limited;
  const phone = new URL(request.url).searchParams.get("phone")?.replace(/\D/g, "") || "";
  if (!validPhone(phone)) return NextResponse.json({ error: "Invalid phone number." }, { status: 400 });
  // The booking flow needs the saved name to prefill existing customers.
  const { data: user, error } = await supabase
    .from("users")
    .select("name, password_hash")
    .eq("phone_number", phone)
    .maybeSingle();
  if (error) return NextResponse.json({ error: "Unable to check account." }, { status: 500 });
  return NextResponse.json({ exists: !!user, hasPassword: !!user?.password_hash, name: user?.name || "" });
}
