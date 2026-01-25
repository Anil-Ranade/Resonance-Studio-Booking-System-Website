import { supabaseServer } from "@/lib/supabaseServer";

export const PLACEHOLDER_EMAIL = 'ranade9@gmail.com';

/**
 * Checks if an email is considered a placeholder (admin/staff email used for user bookings).
 * Returns true if it matches the hardcoded placeholder or belongs to an admin user.
 */
export async function isPlaceholderEmail(email: string): Promise<boolean> {
  if (!email) return false;
  
  // Check hardcoded placeholder
  if (email.toLowerCase().trim() === PLACEHOLDER_EMAIL.toLowerCase()) {
    return true;
  }

  // Check against admin_users table
  // We generally expect the hardcoded one, but this adds robustness
  try {
    const { data: adminUser } = await supabaseServer
      .from("admin_users")
      .select("id")
      .eq("email", email)
      .single();
    
    return !!adminUser;
  } catch (error) {
    console.warn("Error checking admin email status:", error);
    return false;
  }
}
