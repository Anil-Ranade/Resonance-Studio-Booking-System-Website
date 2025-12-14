import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
 * POST /api/auth/auto-login
 * Check if a device fingerprint is trusted and return associated user info
 * This enables automatic login without requiring phone number or OTP
 */
export async function POST(request: NextRequest): Promise<NextResponse<AutoLoginResponse>> {
  try {
    // Parse request body
    let body;
    try {
      const text = await request.text();
      if (!text || text.trim() === '') {
        return NextResponse.json(
          { authenticated: false, message: 'Request body is empty' },
          { status: 400 }
        );
      }
      body = JSON.parse(text);
    } catch (parseError) {
      console.error('[Auto Login] JSON parse error:', parseError);
      return NextResponse.json(
        { authenticated: false, message: 'Invalid request body. Please send valid JSON.' },
        { status: 400 }
      );
    }

    const deviceFingerprint = body.deviceFingerprint?.toString().trim();

    // Validate device fingerprint is provided
    if (!deviceFingerprint) {
      return NextResponse.json({
        authenticated: false,
        message: 'Device fingerprint is required',
      });
    }

    // Look up trusted device by fingerprint only (not phone-specific)
    // Get the most recently used trusted device for this fingerprint
    console.log(`[Auto Login] Looking up device with fingerprint: ${deviceFingerprint.substring(0, 16)}...`);
    
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
      // Device is not trusted - this is normal for new devices
      console.log('[Auto Login] Device not found in trusted_devices table');
      return NextResponse.json({
        authenticated: false,
        message: 'Device is not trusted',
      });
    }

    const trustedDevice = trustedDevices[0];

    // Found trusted device - now get user info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('phone_number, name, email')
      .eq('phone_number', trustedDevice.phone)
      .single();

    if (userError || !user) {
      console.error('[Auto Login] User not found for phone:', trustedDevice.phone);
      return NextResponse.json({
        authenticated: false,
        message: 'User not found for trusted device',
      });
    }

    // Update last_used_at timestamp for the trusted device
    await supabase
      .from('trusted_devices')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', trustedDevice.id);

    console.log(`[Auto Login] Auto-authenticated user ${user.phone_number} via trusted device`);

    return NextResponse.json({
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
  } catch (error) {
    console.error('[Auto Login] Unexpected error:', error);
    return NextResponse.json(
      { authenticated: false, message: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
