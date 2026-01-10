import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  verifyAccessToken,
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

interface AutoLoginResponse {
  authenticated: boolean;
  user?: {
    phone: string;
    name: string;
    email: string;
  };
  deviceName?: string;
  trustedSince?: string;
  message?: string;
}

/**
 * Helper to get user info from database
 */
async function getUserInfo(phone: string) {
  const { data: user, error } = await supabase
    .from('users')
    .select('phone_number, name, email')
    .eq('phone_number', phone)
    .single();
  
  if (error || !user) return null;
  return user;
}

/**
 * POST /api/auth/auto-login
 * Check if user is authenticated via cookies or trusted device fingerprint
 * Priority: 1. Access token cookie, 2. Refresh token cookie, 3. Device fingerprint
 */
export async function POST(request: NextRequest): Promise<NextResponse<AutoLoginResponse>> {
  try {
    // First check for valid cookies
    const cookieHeader = request.headers.get('cookie');
    const cookies = parseCookies(cookieHeader);
    const accessToken = cookies[ACCESS_TOKEN_COOKIE];
    const refreshToken = cookies[REFRESH_TOKEN_COOKIE];

    // Try access token first
    if (accessToken) {
      const payload = verifyAccessToken(accessToken);
      if (payload) {
        const user = await getUserInfo(payload.phone);
        if (user) {
          // Successfully authenticated via access token
          return NextResponse.json({
            authenticated: true,
            user: {
              phone: user.phone_number,
              name: user.name || '',
              email: user.email || '',
            },
            message: 'Authenticated via access token',
          });
        }
      }
    }

    // Try refresh token if access token failed
    if (refreshToken) {
      const payload = verifyRefreshToken(refreshToken);
      if (payload) {
        // Verify refresh token is in database and not revoked
        const tokenHash = hashRefreshToken(refreshToken);
        const { data: tokenRecord, error: fetchError } = await supabase
          .from('refresh_tokens')
          .select('id, user_phone, device_fingerprint, revoked_at')
          .eq('token_hash', tokenHash)
          .single();

        if (!fetchError && tokenRecord && !tokenRecord.revoked_at) {
          const user = await getUserInfo(payload.phone);
          if (user) {
            // Generate new tokens
            const newAccessToken = generateAccessToken(payload.phone);
            const newRefreshToken = generateRefreshToken(payload.phone, tokenRecord.device_fingerprint || undefined);
            const newTokenHash = hashRefreshToken(newRefreshToken);
            const newExpiresAt = getRefreshTokenExpiryDate();

            // Revoke old refresh token
            await supabase
              .from('refresh_tokens')
              .update({ revoked_at: new Date().toISOString() })
              .eq('id', tokenRecord.id);

            // Store new refresh token
            await supabase
              .from('refresh_tokens')
              .insert({
                user_phone: payload.phone,
                token_hash: newTokenHash,
                device_fingerprint: tokenRecord.device_fingerprint,
                expires_at: newExpiresAt.toISOString(),
              });

            // Successfully refreshed tokens for user

            const response = NextResponse.json({
              authenticated: true,
              user: {
                phone: user.phone_number,
                name: user.name || '',
                email: user.email || '',
              },
              message: 'Authenticated via refresh token',
            });

            // Set new cookies
            response.headers.append(
              'Set-Cookie',
              createCookieHeader(ACCESS_TOKEN_COOKIE, newAccessToken, ACCESS_TOKEN_MAX_AGE)
            );
            response.headers.append(
              'Set-Cookie',
              createCookieHeader(REFRESH_TOKEN_COOKIE, newRefreshToken, REFRESH_TOKEN_MAX_AGE)
            );

            return response;
          }
        }
      }
    }

    // Fall back to device fingerprint lookup
    let body;
    try {
      const text = await request.text();
      if (text && text.trim() !== '') {
        body = JSON.parse(text);
      }
    } catch (parseError) {
      // Body parsing failed, that's ok for cookie-based auth
    }

    const deviceFingerprint = body?.deviceFingerprint?.toString().trim();

    if (!deviceFingerprint) {
      return NextResponse.json({
        authenticated: false,
        message: 'Not authenticated',
      });
    }

    // Look up trusted device by fingerprint
    // Looking up trusted device
    
    const { data: trustedDevices, error: fetchError } = await supabase
      .from('trusted_devices')
      .select('id, phone, device_name, last_used_at, created_at')
      .eq('device_fingerprint', deviceFingerprint)
      .eq('is_active', true)
      .order('last_used_at', { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error('[Auto Login] Database error:', fetchError);
      return NextResponse.json({
        authenticated: false,
        message: 'Database error',
      });
    }

    if (!trustedDevices || trustedDevices.length === 0) {
      // Device not found in trusted_devices table
      return NextResponse.json({
        authenticated: false,
        message: 'Device is not trusted',
      });
    }

    const trustedDevice = trustedDevices[0];
    const user = await getUserInfo(trustedDevice.phone);

    if (!user) {
      console.error('[Auto Login] User not found for trusted device');
      return NextResponse.json({
        authenticated: false,
        message: 'User not found for trusted device',
      });
    }

    // Update last_used_at timestamp
    await supabase
      .from('trusted_devices')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', trustedDevice.id);

    // Generate new tokens for the trusted device
    const newAccessToken = generateAccessToken(trustedDevice.phone);
    const newRefreshToken = generateRefreshToken(trustedDevice.phone, deviceFingerprint);
    const newTokenHash = hashRefreshToken(newRefreshToken);
    const newExpiresAt = getRefreshTokenExpiryDate();

    // Store refresh token
    await supabase
      .from('refresh_tokens')
      .insert({
        user_phone: trustedDevice.phone,
        token_hash: newTokenHash,
        device_fingerprint: deviceFingerprint,
        device_name: trustedDevice.device_name,
        expires_at: newExpiresAt.toISOString(),
      });

    // User auto-authenticated via trusted device

    const response = NextResponse.json({
      authenticated: true,
      user: {
        phone: user.phone_number,
        name: user.name || '',
        email: user.email || '',
      },
      deviceName: trustedDevice.device_name,
      trustedSince: trustedDevice.created_at,
      message: 'Auto-login successful',
    });

    // Set cookies
    response.headers.append(
      'Set-Cookie',
      createCookieHeader(ACCESS_TOKEN_COOKIE, newAccessToken, ACCESS_TOKEN_MAX_AGE)
    );
    response.headers.append(
      'Set-Cookie',
      createCookieHeader(REFRESH_TOKEN_COOKIE, newRefreshToken, REFRESH_TOKEN_MAX_AGE)
    );

    return response;
  } catch (error) {
    console.error('[Auto Login] Unexpected error:', error);
    return NextResponse.json(
      { authenticated: false, message: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}

