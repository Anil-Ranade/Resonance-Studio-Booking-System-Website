import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

interface CheckUserRequest {
  whatsapp: string;
  name?: string;
  email?: string;
}

// POST /api/check-user - Check if user exists or create new user
export async function POST(request: Request) {
  try {
    const body: CheckUserRequest = await request.json();
    const { name, email } = body;

    // Normalize whatsapp to digits only
    const whatsapp = body.whatsapp.replace(/\D/g, "");

    // Validate exactly 10 digits
    if (whatsapp.length !== 10) {
      return NextResponse.json(
        { error: "WhatsApp number must be exactly 10 digits" },
        { status: 400 }
      );
    }

    // Look up user in 'users' table
    const { data: existingUser, error: lookupError } = await supabaseServer
      .from("users")
      .select("*")
      .eq("whatsapp_number", whatsapp)
      .single();

    if (lookupError && lookupError.code !== "PGRST116") {
      // PGRST116 = no rows returned, any other error is a real error
      return NextResponse.json(
        { error: lookupError.message },
        { status: 500 }
      );
    }

    // If user exists, return the user
    if (existingUser) {
      return NextResponse.json({ user: existingUser });
    }

    // User does not exist - check if name and email are provided
    if (!name || !email) {
      return NextResponse.json({ needsSignup: true });
    }

    // Create new user
    const { data: newUser, error: createError } = await supabaseServer
      .from("users")
      .insert({ whatsapp_number: whatsapp, name, email })
      .select()
      .single();

    if (createError) {
      return NextResponse.json(
        { error: createError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ user: newUser });
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
