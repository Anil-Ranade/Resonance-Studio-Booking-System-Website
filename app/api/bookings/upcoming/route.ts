import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { escapeLike, getSessionPhone, publicBooking, rateLimit } from "@/lib/apiSecurity";

// GET /api/bookings/upcoming?email=xxx@example.com - Fetch only upcoming bookings by email
export async function GET(request: NextRequest) {
  try {
    const limited = await rateLimit(request, "bookings_lookup", 30, 600);
    if (limited) return limited;

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const phone = searchParams.get("phone"); // Keep phone support for backward compatibility

    if (!email && !phone) {
      return NextResponse.json(
        { error: "Email or phone number is required" },
        { status: 400 }
      );
    }

    // Get today's date in YYYY-MM-DD format (using IST timezone)
    const now = new Date();
    // Convert to IST (UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);
    const todayStr = istNow.toISOString().split('T')[0];
    const currentTime = istNow.toISOString().slice(11, 16); // HH:MM format

    let phoneToSearch: string | null = null;

    if (email) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email) || email.length > 254) {
        return NextResponse.json(
          { error: "Please enter a valid email address" },
          { status: 400 }
        );
      }

      // First, look up the user by email to get their phone number
      const { data: user, error: userError } = await supabaseServer
        .from("users")
        .select("phone_number")
        .ilike("email", escapeLike(email.trim()))
        .single();

      if (userError || !user) {
        // Also try to find directly in bookings table (for bookings that have email)
        const { data: bookingWithEmail } = await supabaseServer
          .from("bookings")
          .select("phone_number")
          .ilike("email", escapeLike(email.trim()))
          .limit(1)
          .single();
        
        if (bookingWithEmail) {
          phoneToSearch = bookingWithEmail.phone_number;
        } else {
          // No user or booking found for the provided email
          return NextResponse.json({ bookings: [] });
        }
      } else {
        phoneToSearch = user.phone_number;
      }
    } else if (phone) {
      // Normalize phone to digits only
      const normalizedPhone = phone.replace(/\D/g, "");
      if (normalizedPhone.length !== 10) {
        return NextResponse.json(
          { error: "Phone number must be exactly 10 digits" },
          { status: 400 }
        );
      }
      phoneToSearch = normalizedPhone;
    }

    if (!phoneToSearch) {
      return NextResponse.json({ bookings: [] });
    }

    // Now fetch bookings by phone number
    const { data: allBookings, error: bookingsError } = await supabaseServer
      .from("bookings")
      .select("*")
      .eq("phone_number", phoneToSearch)
      .in("status", ["confirmed"])
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });

    if (bookingsError) {
      console.error("[Upcoming Bookings API] Database error:", bookingsError);
      return NextResponse.json(
        { error: "Failed to fetch bookings" },
        { status: 500 }
      );
    }

    // Bookings query completed

    // Filter for upcoming bookings client-side for more reliable filtering
    const upcomingBookings = (allBookings || []).filter(booking => {
      // If date is in the future, include it
      if (booking.date > todayStr) {
        return true;
      }
      // If date is today, check if start time hasn't passed
      if (booking.date === todayStr) {
        return booking.start_time >= currentTime;
      }
      // Date is in the past
      return false;
    });

    // Personal fields (and the phone behind an email) only for the verified owner
    const isOwner = (await getSessionPhone(request)) === phoneToSearch;
    return NextResponse.json({
      bookings: isOwner ? upcomingBookings : upcomingBookings.map(publicBooking),
      ...(isOwner && { phone: phoneToSearch }),
    });
  } catch (error) {
    console.error("[Upcoming Bookings API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
