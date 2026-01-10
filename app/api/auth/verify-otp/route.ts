import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  getRefreshTokenExpiryDate,
  createCookieHeader,
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  ACCESS_TOKEN_MAX_AGE,
  REFRESH_TOKEN_MAX_AGE,
} from '@/lib/tokens';

// Initialize Supabase client with service role for database operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configuration
const OTP_LENGTH = 6;
const MAX_ATTEMPTS = 5;

/**
 * Validate phone number (10 digits only)
 */
function isValidPhone(phone: string): boolean {
  const digitsOnly = phone.replace(/\D/g, '');
  return digitsOnly.length === 10 && /^\d{10}$/.test(digitsOnly);
}

/**
 * Validate OTP format (6 digits)
 */
function isValidOTPFormat(code: string): boolean {
  return /^\d{6}$/.test(code);
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
      console.error('[Verify OTP] JSON parse error:', parseError);
      return NextResponse.json(
        { error: 'Invalid request body. Please send valid JSON.' },
        { status: 400 }
      );
    }

    const phone = body.phone?.toString().trim();
    const code = body.code?.toString().trim();
    const deviceFingerprint = body.deviceFingerprint?.toString().trim();
    const deviceName = body.deviceName?.toString().trim();

    // Validate phone number is provided
    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Validate OTP code is provided
    if (!code) {
      return NextResponse.json(
        { error: 'OTP code is required' },
        { status: 400 }
      );
    }

    // Extract digits only from phone
    const phoneDigits = phone.replace(/\D/g, '');

    // Validate phone number format
    if (!isValidPhone(phoneDigits)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Validate OTP format
    if (!isValidOTPFormat(code)) {
      return NextResponse.json(
        { error: `OTP must be ${OTP_LENGTH} digits` },
        { status: 400 }
      );
    }

    // Fetch the latest unexpired OTP for this phone number
    const { data: otpRecord, error: fetchError } = await supabase
      .from('login_otps')
      .select('id, code_hash, attempts, expires_at, email')
      .eq('phone', phoneDigits)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !otpRecord) {
      return NextResponse.json(
        { error: 'No valid OTP found. Please request a new OTP.' },
        { status: 400 }
      );
    }

    // Check if OTP has expired
    if (new Date(otpRecord.expires_at) < new Date()) {
      // Delete expired OTP
      await supabase.from('login_otps').delete().eq('id', otpRecord.id);
      return NextResponse.json(
        { error: 'OTP has expired. Please request a new OTP.' },
        { status: 400 }
      );
    }

    // Check if max attempts exceeded
    if (otpRecord.attempts >= MAX_ATTEMPTS) {
      // Delete the OTP record after max attempts
      await supabase.from('login_otps').delete().eq('id', otpRecord.id);
      return NextResponse.json(
        { error: 'Too many incorrect attempts. Please request a new OTP.' },
        { status: 429 }
      );
    }

    // Verify OTP using bcrypt
    const isValidOTP = await bcrypt.compare(code, otpRecord.code_hash);

    if (!isValidOTP) {
      // Increment attempts
      const newAttempts = otpRecord.attempts + 1;
      await supabase
        .from('login_otps')
        .update({ attempts: newAttempts })
        .eq('id', otpRecord.id);

      const remainingAttempts = MAX_ATTEMPTS - newAttempts;

      if (remainingAttempts <= 0) {
        // Delete the OTP record after max attempts
        await supabase.from('login_otps').delete().eq('id', otpRecord.id);
        return NextResponse.json(
          { error: 'Too many incorrect attempts. Please request a new OTP.' },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          error: `Invalid OTP. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.`,
          remainingAttempts,
        },
        { status: 400 }
      );
    }

    // OTP is valid
    
    // Check if we need to update the user's email (Admin/Staff override case)
    if (otpRecord.email) {
      // 1. Get the current user
      const { data: currentUser } = await supabase
        .from('users')
        .select('email')
        .eq('phone_number', phoneDigits)
        .single();

      if (currentUser && currentUser.email) {
        let shouldUpdate = false;

        // 2. Check if specific hardcoded email
        if (currentUser.email === 'ranade9@gmail.com') {
          shouldUpdate = true;
        } else {
          // 3. Check if the CURRENT email is an admin/staff email
          const { data: adminUser } = await supabase
            .from('admin_users')
            .select('id')
            .eq('email', currentUser.email)
            .single();
          
          if (adminUser) shouldUpdate = true;
        }

        // 4. If it is an admin/special email, update with the new email
        if (shouldUpdate) {
           const { error: updateError } = await supabase
            .from('users')
            .update({ email: otpRecord.email })
            .eq('phone_number', phoneDigits);
            
           if (updateError) {
             console.error('[Verify OTP] Failed to update user email:', updateError);
           } else {
             // Successfully updated user email
           }
        }
      }
    }

    // Delete the OTP record
    await supabase.from('login_otps').delete().eq('id', otpRecord.id);

    // Generate access and refresh tokens
    let accessToken: string;
    let refreshToken: string;
    try {
      accessToken = generateAccessToken(phoneDigits);
      refreshToken = generateRefreshToken(phoneDigits, deviceFingerprint);
    } catch (tokenError) {
      console.error('[Verify OTP] Token generation error:', tokenError);
      return NextResponse.json(
        { error: 'Failed to generate authentication token. Please try again.' },
        { status: 500 }
      );
    }

    // Store refresh token hash in database
    const refreshTokenHash = hashRefreshToken(refreshToken);
    const refreshTokenExpiresAt = getRefreshTokenExpiryDate();

    const { error: refreshTokenError } = await supabase
      .from('refresh_tokens')
      .insert({
        user_phone: phoneDigits,
        token_hash: refreshTokenHash,
        device_fingerprint: deviceFingerprint || null,
        device_name: deviceName || 'Unknown Device',
        expires_at: refreshTokenExpiresAt.toISOString(),
      });

    if (refreshTokenError) {
      console.error('[Verify OTP] Failed to store refresh token:', refreshTokenError);
      // Don't fail - the access token will still work
    }

    // Register device as trusted if fingerprint is provided
    let deviceTrusted = false;
    if (deviceFingerprint) {
      try {
        // Upsert trusted device record
        const { error: deviceError } = await supabase
          .from('trusted_devices')
          .upsert(
            {
              phone: phoneDigits,
              device_fingerprint: deviceFingerprint,
              device_name: deviceName || 'Unknown Device',
              last_used_at: new Date().toISOString(),
              is_active: true,
            },
            {
              onConflict: 'phone,device_fingerprint',
            }
          );

        if (deviceError) {
          console.error('[Verify OTP] Failed to register trusted device:', deviceError);
          // Don't fail the request, just log the error
        } else {
          deviceTrusted = true;
          // Device registered as trusted
        }
      } catch (deviceRegError) {
        console.error('[Verify OTP] Device registration error:', deviceRegError);
        // Continue without failing
      }
    }

    // OTP verified successfully

    // Create response with cookies
    const response = NextResponse.json({
      verified: true,
      deviceTrusted,
      message: 'OTP verified successfully',
    });

    // Set access token cookie
    response.headers.append(
      'Set-Cookie',
      createCookieHeader(ACCESS_TOKEN_COOKIE, accessToken, ACCESS_TOKEN_MAX_AGE)
    );

    // Set refresh token cookie
    response.headers.append(
      'Set-Cookie',
      createCookieHeader(REFRESH_TOKEN_COOKIE, refreshToken, REFRESH_TOKEN_MAX_AGE)
    );

    return response;
  } catch (error) {
    console.error('[Verify OTP] Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}

