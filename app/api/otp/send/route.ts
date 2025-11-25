import { NextResponse } from "next/server";
import { sendOTP } from "@/src/lib/whatsapp";
import { generateOTP, storeOTP, getCooldownRemaining, deleteOTP } from "@/lib/otpStore";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const whatsapp = body.whatsapp?.replace(/\D/g, "");

    // Validate whatsapp number
    if (!whatsapp || whatsapp.length !== 10) {
      return NextResponse.json(
        { error: "WhatsApp number must be exactly 10 digits" },
        { status: 400 }
      );
    }

    // Check cooldown
    const cooldownRemaining = getCooldownRemaining(whatsapp);
    if (cooldownRemaining > 0) {
      return NextResponse.json(
        { error: `Please wait ${cooldownRemaining} seconds before requesting a new OTP` },
        { status: 429 }
      );
    }

    // Generate and store new OTP
    const otp = generateOTP();
    storeOTP(whatsapp, otp);

    // Check Twilio config
    const hasTwilioConfig =
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_WHATSAPP_NUMBER;

    if (!hasTwilioConfig) {
      // For development/testing without Twilio
      console.log(`[OTP API] Development mode - OTP for ${whatsapp}: ${otp}`);
      return NextResponse.json({
        success: true,
        message: "OTP sent successfully",
        // Include OTP in response only for development
        ...(process.env.NODE_ENV === "development" && { debug_otp: otp }),
      });
    }

    // Send OTP via WhatsApp
    const countryCode = process.env.WHATSAPP_COUNTRY_CODE || "+91";
    const toNumber = `${countryCode}${whatsapp}`;

    const result = await sendOTP(toNumber, otp);

    if (result.success) {
      console.log(`[OTP API] OTP sent to ${whatsapp}`);
      return NextResponse.json({
        success: true,
        message: "OTP sent successfully to your WhatsApp",
      });
    } else {
      console.error(`[OTP API] Failed to send OTP: ${result.error}`);
      // Clear the stored OTP if sending failed
      deleteOTP(whatsapp);
      return NextResponse.json(
        { error: "Failed to send OTP. Please try again." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[OTP API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to send OTP" },
      { status: 500 }
    );
  }
}
