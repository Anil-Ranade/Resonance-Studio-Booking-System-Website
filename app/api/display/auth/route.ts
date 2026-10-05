import { NextRequest, NextResponse } from "next/server";
import {
  DISPLAY_COOKIE,
  displayToken,
  hasDisplaySession,
  rateLimit,
  safeEqual,
} from "@/lib/apiSecurity";

// GET /api/display/auth - Whether the display session cookie is still valid
export async function GET(request: NextRequest) {
  return NextResponse.json({ authenticated: hasDisplaySession(request) });
}

// POST /api/display/auth - Check the display password and start a display session
export async function POST(request: NextRequest) {
  try {
    const limited = await rateLimit(request, "display_auth", 10, 900);
    if (limited) return limited;

    const { password } = await request.json().catch(() => ({}));
    if (typeof password !== "string" || !password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    const displayPassword = process.env.DISPLAY_PASSWORD;
    const token = displayToken();
    if (!displayPassword || !token) {
      console.error("[Display Auth] DISPLAY_PASSWORD not configured in environment");
      return NextResponse.json({ error: "Authentication not configured" }, { status: 500 });
    }

    if (!safeEqual(password, displayPassword)) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    // httpOnly cookie unlocks names/phones in /api/display/bookings for 12 hours
    const response = NextResponse.json({ success: true });
    response.cookies.set(DISPLAY_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 12 * 60 * 60,
    });
    return response;
  } catch (error) {
    console.error("[Display Auth] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
