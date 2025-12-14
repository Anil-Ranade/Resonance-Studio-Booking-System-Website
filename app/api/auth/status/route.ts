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

/**
 * GET /api/auth/status
 * Check authentication status using cookies
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get tokens from cookies
    const cookieHeader = request.headers.get('cookie');
    const cookies = parseCookies(cookieHeader);
    const accessToken = cookies[ACCESS_TOKEN_COOKIE];
    const refreshToken = cookies[REFRESH_TOKEN_COOKIE];

    // First try to verify access token
    if (accessToken) {
      const payload = verifyAccessToken(accessToken);
      if (payload) {
        // Access token is valid - get user info
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('phone_number, name, email')
          .eq('phone_number', payload.phone)
          .single();

        if (!userError && user) {
          return NextResponse.json({
            authenticated: true,
            user: {
              phone: user.phone_number,
              name: user.name,
              email: user.email,
            },
          });
        }
      }
    }

    // Access token invalid/expired - try refresh token
    if (refreshToken) {
      const payload = verifyRefreshToken(refreshToken);
      if (payload) {
        // Check if refresh token is in database and not revoked
        const tokenHash = hashRefreshToken(refreshToken);
        const { data: tokenRecord, error: fetchError } = await supabase
          .from('refresh_tokens')
          .select('id, user_phone, device_fingerprint, revoked_at')
          .eq('token_hash', tokenHash)
          .single();

        if (!fetchError && tokenRecord && !tokenRecord.revoked_at) {
          // Get user info
          const { data: user, error: userError } = await supabase
            .from('users')
            .select('phone_number, name, email')
            .eq('phone_number', payload.phone)
            .single();

          if (!userError && user) {
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

            console.log(`[Auth Status] Refreshed tokens for ${payload.phone}`);

            // Return authenticated with new cookies
            const response = NextResponse.json({
              authenticated: true,
              user: {
                phone: user.phone_number,
                name: user.name,
                email: user.email,
              },
            });

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

    // Not authenticated
    return NextResponse.json({
      authenticated: false,
      message: 'Not authenticated',
    });
  } catch (error) {
    console.error('[Auth Status] Unexpected error:', error);
    return NextResponse.json({
      authenticated: false,
      message: 'An error occurred checking authentication',
    });
  }
}
