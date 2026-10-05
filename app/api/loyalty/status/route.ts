import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { getAdminUser, getSessionPhone, isPhone, rateLimit } from '@/lib/apiSecurity';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = (searchParams.get('phone') || '').replace(/\D/g, '');

    if (!isPhone(phone)) {
      return NextResponse.json({ error: 'A valid 10-digit phone number is required' }, { status: 400 });
    }

    const limited = await rateLimit(request, 'loyalty_status', 60, 600);
    if (limited) return limited;

    // Only the verified customer themselves, or an admin, may see a balance
    const sessionPhone = await getSessionPhone(request);
    if (sessionPhone !== phone && !(await getAdminUser(request))) {
      return NextResponse.json({ error: 'Please verify your phone number to continue.' }, { status: 401 });
    }

    // Call the database function for loyalty progress
    const { data: loyaltyData, error: loyaltyError } = await supabase
      .rpc('get_loyalty_progress', { p_phone_number: phone });

    if (loyaltyError) {
      console.error('Error fetching loyalty status:', loyaltyError);
      return NextResponse.json({ error: 'Failed to fetch loyalty status' }, { status: 500 });
    }

    // Try to fetch first-time bonus status (may not exist if migration hasn't been run)
    let firstBookingBonus = null;
    try {
      const { data: bonusData, error: bonusError } = await supabase
        .rpc('get_first_booking_bonus_status', { p_phone_number: phone });
      
      if (!bonusError && bonusData) {
        firstBookingBonus = bonusData;
      }
    } catch {
      // Function may not exist yet, ignore
    }

    // Combine the responses
    return NextResponse.json({
      ...loyaltyData,
      first_booking_bonus: firstBookingBonus,
      // Updated reward amount
      reward_amount: 2000
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
