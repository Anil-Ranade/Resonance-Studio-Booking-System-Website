import { NextResponse } from "next/server";
import { createClearCookieHeader, ADMIN_SESSION_COOKIE, STAFF_SESSION_COOKIE } from "@/lib/tokens";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.headers.append("Set-Cookie", createClearCookieHeader(ADMIN_SESSION_COOKIE));
  response.headers.append("Set-Cookie", createClearCookieHeader(STAFF_SESSION_COOKIE));
  return response;
}
