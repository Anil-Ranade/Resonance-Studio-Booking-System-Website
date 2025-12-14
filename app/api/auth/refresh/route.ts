import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  verifyRefreshToken,
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  getRefreshTokenExpiryDate,
  createCookieHeader,
  parseCookies,
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  ACCESS_TOKEN_MAX_AGE,
  REFRESH_TOKEN_MAX_AGE,
} from '@/lib/tokens';

// Initialize Supabase client with service role for database operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * POST /api/auth/refresh
 * Refresh the access token using a valid refresh token
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get refresh token from cookies
    const cookieHeader = request.headers.get('cookie');
    const cookies = parseCookies(cookieHeader);
    const refreshToken = cookies[REFRESH_TOKEN_COOKIE];

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'No refresh token provided' },
        { status: 401 }
      );
    }

    // Verify the refresh token
    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }

    // Check if the refresh token is in the database and not revoked
    const tokenHash = hashRefreshToken(refreshToken);
    const { data: tokenRecord, error: fetchError } = await supabase
      .from('refresh_tokens')
      .select('id, user_phone, device_fingerprint, revoked_at')
      .eq('token_hash', tokenHash)
      .single();

    if (fetchError || !tokenRecord) {
      console.log('[Refresh] Token not found in database');
      return NextResponse.json(
        { error: 'Refresh token not found' },
        { status: 401 }
      );
    }

    if (tokenRecord.revoked_at) {
      console.log('[Refresh] Token has been revoked');
      return NextResponse.json(
        { error: 'Refresh token has been revoked' },
        { status: 401 }
      );
    }

    // Token is valid - generate new tokens
    const phone = payload.phone;
    const deviceFingerprint = tokenRecord.device_fingerprint;

    // Generate new access token
    const newAccessToken = generateAccessToken(phone);

    // Generate new refresh token (token rotation)
    const newRefreshToken = generateRefreshToken(phone, deviceFingerprint || undefined);
    const newTokenHash = hashRefreshToken(newRefreshToken);
    const newExpiresAt = getRefreshTokenExpiryDate();

    // Revoke the old refresh token
    await supabase
      .from('refresh_tokens')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', tokenRecord.id);

    // Store the new refresh token
    const { error: insertError } = await supabase
      .from('refresh_tokens')
      .insert({
        user_phone: phone,
        token_hash: newTokenHash,
        device_fingerprint: deviceFingerprint,
        expires_at: newExpiresAt.toISOString(),
      });

    if (insertError) {
      console.error('[Refresh] Failed to store new refresh token:', insertError);
      return NextResponse.json(
        { error: 'Failed to refresh token' },
        { status: 500 }
      );
    }

    console.log(`[Refresh] Tokens refreshed for ${phone}`);

    // Create response with new cookies
    const response = NextResponse.json({
      success: true,
      message: 'Tokens refreshed successfully',
    });

    // Set new access token cookie
    response.headers.append(
      'Set-Cookie',
      createCookieHeader(ACCESS_TOKEN_COOKIE, newAccessToken, ACCESS_TOKEN_MAX_AGE)
    );

    // Set new refresh token cookie
    response.headers.append(
      'Set-Cookie',
      createCookieHeader(REFRESH_TOKEN_COOKIE, newRefreshToken, REFRESH_TOKEN_MAX_AGE)
    );

    return response;
  } catch (error) {
    console.error('[Refresh] Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
