import { NextResponse } from 'next/server';
import { supabaseClient as supabase } from '@/lib/supabaseClient';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // Call the database function
    const { data, error } = await supabase
      .rpc('claim_loyalty_reward', { p_phone_number: phone });

    if (error) {
      console.error('Error claiming reward:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
