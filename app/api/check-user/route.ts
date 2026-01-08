import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

interface CheckUserRequest {
  phone: string;
  name?: string;
  email?: string;
}

// POST /api/check-user - Check if user exists or create new user
export async function POST(request: Request) {
  try {
    // Parse request body with error handling
    let body: CheckUserRequest;
    try {
      const text = await request.text();
      if (!text || text.trim() === '') {
        return NextResponse.json(
          { error: 'Request body is empty' },
          { status: 400 }
        );
      }
      body = JSON.parse(text);
    } catch (parseError) {
      console.error('[Check User] JSON parse error:', parseError);
      return NextResponse.json(
        { error: 'Invalid request body. Please send valid JSON.' },
        { status: 400 }
      );
    }

    // Validate phone is provided
    console.log('[Check User] Received body:', JSON.stringify(body));
    
    if (!body.phone || body.phone.toString().trim() === '') {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    const { name, email } = body;

    // Normalize phone to digits only
    const phone = body.phone.toString().trim().replace(/\D/g, "");

    // Validate exactly 10 digits
    if (phone.length !== 10) {
      return NextResponse.json(
        { error: "Phone number must be exactly 10 digits" },
        { status: 400 }
      );
    }

    // Look up user in 'users' table
    const { data: existingUser, error: lookupError } = await supabaseServer
      .from("users")
      .select("*")
      .eq("phone_number", phone)
      .single();

    if (lookupError && lookupError.code !== "PGRST116") {
      // PGRST116 = no rows returned, any other error is a real error
      return NextResponse.json(
        { error: lookupError.message },
        { status: 500 }
      );
    }

    // If user exists, check if their email belongs to an admin/staff
    if (existingUser) {
      let isAdminEmail = false;

      // Check specific hardcoded email
      if (existingUser.email === 'ranade9@gmail.com') {
        isAdminEmail = true;
      } else {
        // Check if this email matches any admin/staff email
        const { data: adminUser } = await supabaseServer
          .from("admin_users")
          .select("id")
          .eq("email", existingUser.email)
          .single();
        
        isAdminEmail = !!adminUser;
      }
      
      return NextResponse.json({ 
        user: existingUser,
        isAdminEmail 
      });
    }

    // User does not exist - check if name and email are provided
    if (!name || !email) {
      return NextResponse.json({ needsSignup: true });
    }

    // Create new user
    const { data: newUser, error: createError } = await supabaseServer
      .from("users")
      .insert({ phone_number: phone, name, email })
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
    console.error('[Check User] Unexpected error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
