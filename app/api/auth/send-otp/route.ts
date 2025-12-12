import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import { sendOTPEmail } from '@/lib/email';

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
  const min = Math.pow(10, OTP_LENGTH - 1);
  const max = Math.pow(10, OTP_LENGTH) - 1;
  return Math.floor(min + Math.random() * (max - min + 1)).toString();
}

/**
 * Validate phone number (10 digits only)
 */
function isValidPhone(phone: string): boolean {
  const digitsOnly = phone.replace(/\D/g, '');
  return digitsOnly.length === 10 && /^\d{10}$/.test(digitsOnly);
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

export async function POST(request: Request) {
  try {
    // Parse request body with error handling
    let body;
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
      console.error('[Send OTP] JSON parse error:', parseError);
      return NextResponse.json(
        { error: 'Invalid request body. Please send valid JSON.' },
        { status: 400 }
      );
    }

    const phone = body.phone?.toString().trim();
    const email = body.email?.toString().trim();

    // Validate phone number is provided
    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Validate email is provided
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required for OTP verification' },
        { status: 400 }
      );
    }

    // Extract digits only
    const phoneDigits = phone.replace(/\D/g, '');

    // Validate phone number format (exactly 10 digits)
    if (!isValidPhone(phoneDigits)) {
      return NextResponse.json(
        { error: 'Invalid phone number. Please enter a valid 10-digit phone number.' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email address. Please enter a valid email.' },
        { status: 400 }
      );
    }

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
      // Development mode - log OTP to console
      console.log(`[Send OTP] Development mode - OTP for ${phoneDigits} (${email}): ${otp}`);
      return NextResponse.json({
        success: true,
        message: 'OTP sent successfully',
        // Include OTP in response only for development
        ...(process.env.NODE_ENV === 'development' && { debug_otp: otp }),
      });
    }

    // Send OTP via Email
    const result = await sendOTPEmail(email, otp);

    if (result.success) {
      console.log(`[Send OTP] OTP sent successfully to ${email}`);
      return NextResponse.json({
        success: true,
        message: 'OTP sent successfully to your email address',
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

