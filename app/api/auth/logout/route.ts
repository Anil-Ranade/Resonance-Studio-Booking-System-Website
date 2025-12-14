import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  parseCookies,
  hashRefreshToken,
  createClearCookieHeader,
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from '@/lib/tokens';

// Initialize Supabase client with service role for database operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * POST /api/auth/logout
 * Log out the user by clearing cookies and revoking refresh token
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get refresh token from cookies to revoke it
    const cookieHeader = request.headers.get('cookie');
    const cookies = parseCookies(cookieHeader);
    const refreshToken = cookies[REFRESH_TOKEN_COOKIE];

    // Revoke refresh token in database if present
    if (refreshToken) {
      const tokenHash = hashRefreshToken(refreshToken);
      const { error: revokeError } = await supabase
        .from('refresh_tokens')
        .update({ revoked_at: new Date().toISOString() })
        .eq('token_hash', tokenHash);

      if (revokeError) {
        console.error('[Logout] Failed to revoke refresh token:', revokeError);
        // Continue anyway - we'll still clear the cookies
      } else {
        console.log('[Logout] Refresh token revoked');
      }
    }

    console.log('[Logout] User logged out successfully');

    // Create response clearing both cookies
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    // Clear access token cookie
    response.headers.append(
      'Set-Cookie',
      createClearCookieHeader(ACCESS_TOKEN_COOKIE)
    );

    // Clear refresh token cookie
    response.headers.append(
      'Set-Cookie',
      createClearCookieHeader(REFRESH_TOKEN_COOKIE)
    );

    return response;
  } catch (error) {
    console.error('[Logout] Unexpected error:', error);
    
    // Still try to clear cookies even on error
    const response = NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );

    response.headers.append(
      'Set-Cookie',
      createClearCookieHeader(ACCESS_TOKEN_COOKIE)
    );

    response.headers.append(
      'Set-Cookie',
      createClearCookieHeader(REFRESH_TOKEN_COOKIE)
    );

    return response;
  }
}
