import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { getAdminUser, isPhone } from '@/lib/apiSecurity';

// POST /api/loyalty/claim - mark a customer's reward as claimed (admin only)
export async function POST(request: Request) {
  if (!(await getAdminUser(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const phone = String(body.phone ?? '').replace(/\D/g, '');

    if (!isPhone(phone)) {
      return NextResponse.json({ error: 'A valid 10-digit phone number is required' }, { status: 400 });
    }

    const { data, error } = await supabaseServer.rpc('claim_loyalty_reward', { p_phone_number: phone });

    if (error) {
      console.error('Error claiming reward:', error);
      return NextResponse.json({ error: 'Failed to claim reward' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
