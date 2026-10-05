"use client";

import { getSession } from "@/lib/supabaseAuth";

/** fetch() with the signed-in admin/staff Supabase token attached as a Bearer header. */
export async function adminFetch(input: string, init: RequestInit = {}) {
  let token: string | null = null;
  try {
    token = (await getSession())?.access_token ?? null;
  } catch {
    // fall through to the stored token
  }
  token ??= localStorage.getItem("accessToken") || localStorage.getItem("staffAccessToken");

  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}
