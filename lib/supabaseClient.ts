import { createClient } from "@supabase/supabase-js";

/**
 * Browser-only Supabase client using the anonymous key.
 *
 * This client respects Row Level Security (RLS) policies and is safe
 * to use in client-side code (React components, browser scripts).
 *
 * Environment variables required:
 * - NEXT_PUBLIC_SUPABASE_URL: Your Supabase project URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY: Your Supabase anonymous (public) key
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// ============================================
// Type Definitions
// ============================================

export interface User {
  id: string;
  phone_number: string;
  name: string;
  email: string | null;
  created_at: string;
}

export interface CreateUserParams {
  phone_number: string;
  name: string;
  email?: string;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Retrieves a user by their phone number.
 *
 * @param phoneNumber - The phone number to search for (e.g., "+1234567890")
 * @returns The user object if found, null otherwise
 *
 * @example
 * const user = await getUserByPhone("+1234567890");
 * if (user) {
 *   console.log(`Found user: ${user.name}`);
 * } else {
 *   console.log("User not found");
 * }
 */
export async function getUserByPhone(
  phoneNumber: string
): Promise<User | null> {
  const { data, error } = await supabaseClient
    .from("users")
    .select("*")
    .eq("phone_number", phoneNumber)
    .single();

  if (error) {
    // PGRST116 = no rows found, which is not an error for our use case
    if (error.code === "PGRST116") {
      return null;
    }
    console.error("Error fetching user by phone:", error.message);
    throw new Error(`Failed to fetch user: ${error.message}`);
  }

  return data as User;
}

/**
 * Creates a new user in the database.
 *
 * @param params - The user data to create
 * @param params.phone_number - The user's phone number (required, must be unique)
 * @param params.name - The user's name (required)
 * @param params.email - The user's email address (optional)
 * @returns The newly created user object
 * @throws Error if user creation fails (e.g., duplicate phone number)
 *
 * @example
 * const newUser = await createUser({
 *   phone_number: "+1234567890",
 *   name: "John Doe",
 *   email: "john@example.com"
 * });
 * console.log(`Created user with ID: ${newUser.id}`);
 */
export async function createUser(params: CreateUserParams): Promise<User> {
  const { data, error } = await supabaseClient
    .from("users")
    .insert({
      phone_number: params.phone_number,
      name: params.name,
      email: params.email ?? null,
    })
    .select()
    .single();

  if (error) {
    // Check for unique constraint violation on phone_number
    if (error.code === "23505") {
      throw new Error(
        `User with phone number ${params.phone_number} already exists`
      );
    }
    console.error("Error creating user:", error.message);
    throw new Error(`Failed to create user: ${error.message}`);
  }

  return data as User;
}

/**
 * Example usage in a React component:
 *
 * import { getUserByPhone, createUser } from "@/lib/supabaseClient";
 *
 * function UserForm() {
 *   const handleSubmit = async (formData: FormData) => {
 *     const phone = formData.get("phone") as string;
 *     const name = formData.get("name") as string;
 *
 *     // Check if user exists
 *     let user = await getUserByPhone(phone);
 *
 *     if (!user) {
 *       // Create new user if not found
 *       user = await createUser({
 *         phone_number: phone,
 *         name: name,
 *       });
 *     }
 *
 *     console.log("User:", user);
 *   };
 *
 *   return <form onSubmit={handleSubmit}>...</form>;
 * }
 */
