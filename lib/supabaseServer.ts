import { createClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client with service role privileges.
 * 
 * IMPORTANT: This client bypasses Row Level Security (RLS) and should
 * only be used in server-side code (API routes, server actions, etc.).
 * Never expose this client or the service role key to the browser.
 * 
 * Environment variables required:
 * - SUPABASE_URL: Your Supabase project URL
 * - SUPABASE_SERVICE_ROLE_KEY: Your Supabase service role key (secret)
 */

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Example usage:
 *
 * // In an API route (app/api/example/route.ts):
 * import { supabaseServer } from "@/lib/supabaseServer";
 *
 * export async function GET() {
 *   const { data, error } = await supabaseServer
 *     .from("users")
 *     .select("*");
 *
 *   if (error) {
 *     return Response.json({ error: error.message }, { status: 500 });
 *   }
 *
 *   return Response.json(data);
 * }
 *
 * // In a Server Action:
 * "use server";
 * import { supabaseServer } from "@/lib/supabaseServer";
 *
 * export async function createUser(name: string, email: string) {
 *   const { data, error } = await supabaseServer
 *     .from("users")
 *     .insert({ name, email })
 *     .select()
 *     .single();
 *
 *   if (error) throw new Error(error.message);
 *   return data;
 * }
 */
