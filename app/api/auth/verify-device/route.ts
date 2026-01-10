import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for database operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * POST /api/auth/verify-device
 * Check if a device is trusted for a given phone number
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
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
      console.error('[Verify Device] JSON parse error:', parseError);
      return NextResponse.json(
        { error: 'Invalid request body. Please send valid JSON.' },
        { status: 400 }
      );
    }

    const phone = body.phone?.toString().trim();
    const deviceFingerprint = body.deviceFingerprint?.toString().trim();

    // Validate phone number is provided
    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Validate device fingerprint is provided
    if (!deviceFingerprint) {
      return NextResponse.json(
        { error: 'Device fingerprint is required' },
        { status: 400 }
      );
    }

    // Extract digits only from phone
    const phoneDigits = phone.replace(/\D/g, '');

    // Validate phone number format
    if (phoneDigits.length !== 10) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Check if device is trusted for this phone number
    const { data: trustedDevice, error: fetchError } = await supabase
      .from('trusted_devices')
      .select('id, device_name, last_used_at, created_at')
      .eq('phone', phoneDigits)
      .eq('device_fingerprint', deviceFingerprint)
      .eq('is_active', true)
      .single();

    if (fetchError || !trustedDevice) {
      // Device is not trusted
      return NextResponse.json({
        trusted: false,
        message: 'Device is not trusted for this phone number',
      });
    }

    // Update last_used_at timestamp
    await supabase
      .from('trusted_devices')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', trustedDevice.id);

    // Device verified for user

    return NextResponse.json({
      trusted: true,
      deviceName: trustedDevice.device_name,
      trustedSince: trustedDevice.created_at,
      message: 'Device is trusted',
    });
  } catch (error) {
    console.error('[Verify Device] Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/auth/verify-device
 * Remove device trust for a phone number
 */
export async function DELETE(request: NextRequest) {
  try {
    // Parse request body
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
      console.error('[Verify Device] JSON parse error:', parseError);
      return NextResponse.json(
        { error: 'Invalid request body. Please send valid JSON.' },
        { status: 400 }
      );
    }

    const phone = body.phone?.toString().trim();
    const deviceFingerprint = body.deviceFingerprint?.toString().trim();

    // Validate inputs
    if (!phone || !deviceFingerprint) {
      return NextResponse.json(
        { error: 'Phone number and device fingerprint are required' },
        { status: 400 }
      );
    }

    const phoneDigits = phone.replace(/\D/g, '');

    // Deactivate the trusted device
    const { error: updateError } = await supabase
      .from('trusted_devices')
      .update({ is_active: false })
      .eq('phone', phoneDigits)
      .eq('device_fingerprint', deviceFingerprint);

    if (updateError) {
      console.error('[Verify Device] Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to remove device trust' },
        { status: 500 }
      );
    }

    // Device trust removed successfully

    return NextResponse.json({
      success: true,
      message: 'Device trust removed successfully',
    });
  } catch (error) {
    console.error('[Verify Device] Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
