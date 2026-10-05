import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { getAdminUser, getSessionPhone, maskEmail, rateLimit } from "@/lib/apiSecurity";

interface CheckUserRequest {
  phone: string;
  name?: string;
  email?: string;
}

// POST /api/check-user - Does a customer exist for this phone?
// Full name/email only for that verified customer or an admin; everyone else
// gets a masked email so phone numbers can't be used to harvest contact details.
export async function POST(request: Request) {
  try {
    const limited = await rateLimit(request, "check_user", 20, 600);
    if (limited) return limited;

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
    
    if (!body.phone || body.phone.toString().trim() === '') {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

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
      .select("phone_number, name, email")
      .eq("phone_number", phone)
      .single();

    if (lookupError && lookupError.code !== "PGRST116") {
      // PGRST116 = no rows returned, any other error is a real error
      return NextResponse.json(
        { error: "Failed to look up user" },
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
      
      const canSeeDetails =
        (await getSessionPhone(request)) === phone || !!(await getAdminUser(request));

      return NextResponse.json({
        user: canSeeDetails
          ? existingUser
          : { phone_number: phone, name: existingUser.name, email: maskEmail(existingUser.email) },
        emailMasked: !canSeeDetails,
        isAdminEmail,
      });
    }

    // New customer: the account is created when their first booking is made
    return NextResponse.json({ needsSignup: true });
  } catch (error) {
    console.error('[Check User] Unexpected error:', error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
