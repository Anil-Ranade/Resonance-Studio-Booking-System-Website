"use client";

/** Fetch admin/staff APIs using the HttpOnly session cookie set at login. */
export async function adminFetch(input: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  return fetch(input, { ...init, headers, credentials: "include" });
}
