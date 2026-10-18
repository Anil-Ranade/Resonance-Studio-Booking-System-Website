import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { cleanText, getAdminUser, getSessionPhone, isPhone, rateLimit } from "@/lib/apiSecurity";

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

    // If user exists, only an authenticated owner/admin may receive account details.
    if (existingUser) {
      const canSeeDetails =
        (await getSessionPhone(request)) === phone || !!(await getAdminUser(request));

      if (!canSeeDetails) {
        // Do not let an unauthenticated caller enumerate customer records.
        return NextResponse.json({ needsSignup: true });
      }

      return NextResponse.json({
        user: existingUser,
        emailMasked: false,
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

// PATCH /api/check-user - Update the authenticated customer's saved name.
export async function PATCH(request: Request) {
  try {
    const limited = await rateLimit(request, "update_user", 10, 600);
    if (limited) return limited;

    const body = await request.json().catch(() => ({}));
    const phone = String(body.phone ?? "").replace(/\D/g, "");
    const name = cleanText(body.name, 100);
    const admin = await getAdminUser(request);
    const sessionPhone = await getSessionPhone(request);

    if (!isPhone(phone) || !name) {
      return NextResponse.json({ error: "Valid phone number and name are required" }, { status: 400 });
    }
    if (!admin && sessionPhone !== phone) {
      return NextResponse.json({ error: "Please verify this phone number first" }, { status: 403 });
    }

    const { data, error } = await supabaseServer
      .from("users")
      .update({ name })
      .eq("phone_number", phone)
      .select("phone_number, name, email")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Unable to update customer details" }, { status: 500 });
    }
    return NextResponse.json({ user: data });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
