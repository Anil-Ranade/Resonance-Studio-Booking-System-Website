import { supabaseServer } from "@/lib/supabaseServer";

/**
 * Checks if a request should be rate limited.
 * 
 * @param ip The IP address of the requester
 * @param endpoint Identifier for the endpoint (e.g., 'booking_create')
 * @param limit Max number of requests allowed in the window
 * @param windowSeconds Duration of the window in seconds
 * @returns {Promise<boolean>} true if allowed, false if limited
 */
export async function checkRateLimit(
  ip: string,
  endpoint: string,
  limit: number = 5,
  windowSeconds: number = 3600
): Promise<boolean> {
  try {
    const { data, error } = await supabaseServer.rpc('check_rate_limit', {
      p_ip_address: ip,
      p_endpoint: endpoint,
      p_limit: limit,
      p_window_seconds: windowSeconds
    });

    if (error || typeof data !== 'boolean') {
      console.error("Rate limit check failed:", error);
      // Fail closed: sensitive endpoints must not become unlimited on DB failure.
      return false;
    }

    return data as boolean;
  } catch (err) {
    console.error("Unexpected rate limit error:", err);
    return false; // Fail closed
  }
}
