import { NextResponse } from "next/server";
import { verifyOTP, OTP_CONFIG } from "@/lib/otpStore";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const whatsapp = body.whatsapp?.replace(/\D/g, "");
    const userOtp = body.otp?.trim();

    // Validate inputs
    if (!whatsapp || whatsapp.length !== 10) {
      return NextResponse.json(
        { error: "WhatsApp number must be exactly 10 digits" },
        { status: 400 }
      );
    }

    if (!userOtp || userOtp.length !== OTP_CONFIG.LENGTH) {
      return NextResponse.json(
        { error: `OTP must be ${OTP_CONFIG.LENGTH} digits` },
        { status: 400 }
      );
    }

    // Verify OTP using the shared store
    const result = verifyOTP(whatsapp, userOtp);

    if (!result.success) {
      const status = result.remainingAttempts === 0 ? 429 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    console.log(`[OTP API] OTP verified successfully for ${whatsapp}`);

    return NextResponse.json({
      success: true,
      verified: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.error("[OTP API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to verify OTP" },
      { status: 500 }
    );
  }
}
