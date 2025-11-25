import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

// GET /api/bookings?whatsapp=XXXXXXXXXX - Fetch bookings by WhatsApp number
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const whatsapp = searchParams.get("whatsapp");

    if (!whatsapp) {
      return NextResponse.json(
        { error: "WhatsApp number is required" },
        { status: 400 }
      );
    }

    // Normalize whatsapp to digits only
    const normalizedWhatsapp = whatsapp.replace(/\D/g, "");

    // Validate exactly 10 digits
    if (normalizedWhatsapp.length !== 10) {
      return NextResponse.json(
        { error: "WhatsApp number must be exactly 10 digits" },
        { status: 400 }
      );
    }

    // Query bookings where whatsapp_number = normalized and status IN ('confirmed','pending')
    const { data: bookings, error: bookingsError } = await supabaseServer
      .from("bookings")
      .select("*")
      .eq("whatsapp_number", normalizedWhatsapp)
      .in("status", ["confirmed", "pending"])
      .order("date", { ascending: true });

    if (bookingsError) {
      return NextResponse.json(
        { error: bookingsError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ bookings: bookings || [] });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
