// Server-side helpers shared by API routes: client IP, rate limiting,
// customer session (OTP cookie), admin bearer check, input validators.

import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit } from "@/lib/rateLimit";
import { supabaseServer } from "@/lib/supabaseServer";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  hashRefreshToken,
  parseCookies,
  verifyAccessToken,
  verifyRefreshToken,
} from "@/lib/tokens";

// ---------- client IP + rate limiting ----------

export function getClientIp(request: Request): string {
  // Set by the hosting proxy (Vercel); first x-forwarded-for hop is the client
  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    "unknown"
  );
}

/**
 * Returns a 429 response when `key` exceeded `limit` hits in `windowSeconds`, else null.
 * key defaults to the client IP; pass e.g. `otp:<phone>` to limit per target instead.
 */
export async function rateLimit(
  request: Request,
  endpoint: string,
  limit: number,
  windowSeconds: number,
  key: string = getClientIp(request),
): Promise<NextResponse | null> {
  const allowed = await checkRateLimit(key, endpoint, limit, windowSeconds);
  if (allowed) return null;
  return NextResponse.json(
    { error: "Too many requests. Please wait a few minutes and try again." },
    { status: 429, headers: { "Retry-After": String(windowSeconds) } },
  );
}

// ---------- customer session (set by verify-otp / auto-login) ----------

/** Phone number of the OTP-verified customer making this request, or null. */
export async function getSessionPhone(request: Request): Promise<string | null> {
  const cookies = parseCookies(request.headers.get("cookie"));

  const access = cookies[ACCESS_TOKEN_COOKIE];
  if (access) {
    const payload = verifyAccessToken(access);
    if (payload?.phone) return payload.phone;
  }

  // Access token lasts 15 min; fall back to the (DB-revocable) refresh token
  const refresh = cookies[REFRESH_TOKEN_COOKIE];
  if (refresh) {
    const payload = verifyRefreshToken(refresh);
    if (payload?.phone) {
      const { data } = await supabaseServer
        .from("refresh_tokens")
        .select("revoked_at")
        .eq("token_hash", hashRefreshToken(refresh))
        .single();
      if (data && !data.revoked_at) return payload.phone;
    }
  }
  return null;
}

/** Requires a verified session; if `phone` is given it must belong to that session. */
export async function requireCustomer(
  request: Request,
  phone?: string,
): Promise<{ phone: string } | NextResponse> {
  const sessionPhone = await getSessionPhone(request);
  if (!sessionPhone) {
    return NextResponse.json(
      { error: "Please verify your phone number to continue.", code: "AUTH_REQUIRED" },
      { status: 401 },
    );
  }
  if (phone && phone.replace(/\D/g, "") !== sessionPhone) {
    return NextResponse.json(
      { error: "This booking belongs to a different phone number." },
      { status: 403 },
    );
  }
  return { phone: sessionPhone };
}

// ---------- admin / staff bearer token ----------

/** Active admin_users row for the Supabase access token in Authorization, or null. */
export async function getAdminUser(request: Request) {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;

  const supabaseAuth = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: auth } } },
  );
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();
  if (!user) return null;

  const { data: adminUser } = await supabaseServer
    .from("admin_users")
    .select("id, email, name, role")
    .eq("id", user.id)
    .eq("is_active", true)
    .single();
  return adminUser ?? null;
}

/** 401/403 response unless the caller is an active admin (optionally with one of `roles`). */
export async function requireAdmin(
  request: Request,
  roles?: string[],
): Promise<{ id: string; role: string } | NextResponse> {
  const admin = await getAdminUser(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (roles && !roles.includes(admin.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return admin;
}

// ---------- validators ----------

export const STUDIOS = ["Studio A", "Studio B", "Studio C"] as const;
export const SESSION_TYPES = [
  "Karaoke",
  "Live with musicians",
  "Only Drum Practice",
  "Band",
  "Recording",
  "Meetings / Classes",
] as const;

export const isPhone = (v: unknown): v is string => typeof v === "string" && /^\d{10}$/.test(v);
export const isEmail = (v: unknown): v is string =>
  typeof v === "string" && v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
export const isUuid = (v: unknown): v is string =>
  typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
export const isDate = (v: unknown): v is string =>
  typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(Date.parse(v));
export const isTime = (v: unknown): v is string =>
  typeof v === "string" && /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(v);
export const isStudio = (v: unknown): v is (typeof STUDIOS)[number] =>
  STUDIOS.includes(v as (typeof STUDIOS)[number]);
export const isSessionType = (v: unknown): v is (typeof SESSION_TYPES)[number] =>
  SESSION_TYPES.includes(v as (typeof SESSION_TYPES)[number]);

/** Escapes LIKE/ILIKE wildcards so user input matches literally. */
export const escapeLike = (v: string) => v.replace(/[\\%_]/g, (c) => `\\${c}`);

/** Trims and caps free text; strips angle brackets so it can't become HTML. */
export const cleanText = (v: unknown, max = 200): string =>
  typeof v === "string" ? v.replace(/[<>]/g, "").trim().slice(0, max) : "";

/** a****@gmail.com - enough to recognise, not enough to harvest. */
export function maskEmail(email?: string | null): string {
  if (!email || !email.includes("@")) return "";
  const [user, domain] = email.split("@");
  return `${user.slice(0, 2)}${"*".repeat(Math.max(user.length - 2, 3))}@${domain}`;
}

/** Booking row without personal or internal fields, for unauthenticated callers. */
export function publicBooking<T extends Record<string, unknown>>(b: T) {
  const {
    name: _n,
    email: _e,
    phone_number: _p,
    notes: _no,
    google_event_id: _g,
    created_by_staff_id: _s,
    ...rest
  } = b;
  return rest;
}

// ---------- OTP recipient ----------

/**
 * Who gets an OTP. Existing customers always get it at their stored email, so a
 * stranger can't type someone's phone plus their own email and log in as them.
 * The typed email is only used for new customers, or when the stored email is an
 * admin placeholder. With only an email, the phone is looked up from it.
 */
export async function resolveOtpTarget(
  phoneInput?: string,
  emailInput?: string,
): Promise<{ phone: string; email: string } | { error: string; status: number }> {
  const { isPlaceholderEmail } = await import("@/lib/bookingUtils");
  const typedEmail = emailInput?.trim();

  let phone = phoneInput?.replace(/\D/g, "");
  if (!phone) {
    if (!isEmail(typedEmail)) return { error: "A valid email address is required", status: 400 };
    const pattern = escapeLike(typedEmail);
    const { data: user } = await supabaseServer
      .from("users")
      .select("phone_number")
      .ilike("email", pattern)
      .limit(1)
      .maybeSingle();
    const { data: booking } = user
      ? { data: null }
      : await supabaseServer
          .from("bookings")
          .select("phone_number")
          .ilike("email", pattern)
          .limit(1)
          .maybeSingle();
    phone = user?.phone_number || booking?.phone_number;
    if (!phone) return { error: "No bookings found for this email address", status: 404 };
  }
  if (!isPhone(phone)) return { error: "Invalid phone number", status: 400 };

  const { data: user } = await supabaseServer
    .from("users")
    .select("email")
    .eq("phone_number", phone)
    .maybeSingle();

  if (user?.email && !(await isPlaceholderEmail(user.email))) {
    return { phone, email: user.email };
  }
  if (!isEmail(typedEmail)) return { error: "A valid email address is required", status: 400 };
  return { phone, email: typedEmail };
}

// ---------- display screen session ----------


export const DISPLAY_COOKIE = "display_session";

/** Cookie value proving the display password was entered (changes if the password does). */
export function displayToken(): string | null {
  const pw = process.env.DISPLAY_PASSWORD;
  return pw ? createHmac("sha256", pw).update("display-session-v1").digest("hex") : null;
}

/** Constant-time string comparison (avoids leaking secrets through response timing). */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function hasDisplaySession(request: Request): boolean {
  const token = displayToken();
  const cookie = parseCookies(request.headers.get("cookie"))[DISPLAY_COOKIE];
  return !!token && !!cookie && safeEqual(cookie, token);
}
