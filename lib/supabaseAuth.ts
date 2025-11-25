import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side Supabase client for auth operations
export const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Sign in with email and password
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabaseAuth.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
}

// Sign out
export async function signOut() {
  const { error } = await supabaseAuth.auth.signOut();
  if (error) {
    throw error;
  }
}

// Get current session
export async function getSession() {
  const { data, error } = await supabaseAuth.auth.getSession();
  if (error) {
    throw error;
  }
  return data.session;
}

// Get current user
export async function getUser() {
  const { data, error } = await supabaseAuth.auth.getUser();
  if (error) {
    throw error;
  }
  return data.user;
}

// Listen for auth state changes
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabaseAuth.auth.onAuthStateChange(callback);
}
