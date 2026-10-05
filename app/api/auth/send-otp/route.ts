import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import { sendOTPEmail } from '@/lib/email';
import { maskEmail, rateLimit, resolveOtpTarget } from '@/lib/apiSecurity';
import { randomInt } from 'crypto';

// Initialize Supabase client with service role for database operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// OTP Configuration
const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 5;
const BCRYPT_SALT_ROUNDS = 10;

/**
 * Generate a random numeric OTP
 */
function generateOTP(): string {
  // Cryptographically secure, unlike Math.random()
  return randomInt(10 ** (OTP_LENGTH - 1), 10 ** OTP_LENGTH).toString();
}

export async function POST(request: Request) {
  try {
    const ipLimited = await rateLimit(request, 'otp_send', 10, 900);
    if (ipLimited) return ipLimited;

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body. Please send valid JSON.' }, { status: 400 });
    }

    // Phone + email (booking flow) or email only (manage-booking flow)
    const target = await resolveOtpTarget(body.phone?.toString(), body.email?.toString());
    if ('error' in target) {
      return NextResponse.json({ error: target.error }, { status: target.status });
    }
    const { phone: phoneDigits, email } = target;

    // Max 3 codes per phone per 15 minutes, wherever the requests come from
    const phoneLimited = await rateLimit(request, 'otp_send_phone', 3, 900, `otp:${phoneDigits}`);
    if (phoneLimited) return phoneLimited;

    // Generate 6-digit OTP
    const otp = generateOTP();

    // Hash OTP using bcrypt
    const codeHash = await bcrypt.hash(otp, BCRYPT_SALT_ROUNDS);

    // Calculate expiry time (5 minutes from now)
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

    // Delete any existing OTPs for this phone number
    await supabase
      .from('login_otps')
      .delete()
      .eq('phone', phoneDigits);

    // Store new OTP in database
    const { error: insertError } = await supabase
      .from('login_otps')
      .insert({
        phone: phoneDigits,
        code_hash: codeHash,
        expires_at: expiresAt,
        attempts: 0,
        email: email, // Store the email for reference
      });

    if (insertError) {
      console.error('[Send OTP] Database insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to generate OTP. Please try again.' },
        { status: 500 }
      );
    }

    // Check if Resend is configured
    const hasResendConfig =
      process.env.RESEND_API_KEY &&
      process.env.RESEND_FROM_EMAIL;

    if (!hasResendConfig) {
      // Development mode - OTP available via debug_otp in response only
      // Note: OTP intentionally not logged to console for security
      return NextResponse.json({
        success: true,
        message: 'OTP sent successfully',
        sentTo: maskEmail(email),
        // Include OTP in response only for development
        ...(process.env.NODE_ENV === 'development' && { debug_otp: otp }),
      });
    }

    // Send OTP via Email
    const result = await sendOTPEmail(email, otp);

    if (result.success) {
      // OTP sent successfully - intentionally not logging recipient email
      return NextResponse.json({
        success: true,
        message: 'OTP sent successfully to your email address',
        sentTo: maskEmail(email),
      });
    } else {
      console.error(`[Send OTP] Email send failed: ${result.error}`);
      // Clean up the stored OTP if sending failed
      await supabase
        .from('login_otps')
        .delete()
        .eq('phone', phoneDigits);

      return NextResponse.json(
        { error: 'Failed to send OTP. Please check your email address and try again.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Send OTP] Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}

