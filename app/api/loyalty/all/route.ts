import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { getAdminUser } from '@/lib/apiSecurity';

// GET /api/loyalty/all - every customer's loyalty status (admin only)
export async function GET(request: Request) {
  if (!(await getAdminUser(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data, error } = await supabaseServer.rpc('get_all_loyalty_statuses');

    if (error) {
      console.error('Error fetching all loyalty statuses:', error);
      return NextResponse.json({ error: 'Failed to fetch loyalty statuses' }, { status: 500 });
    }

    // Most loyal first
    const sortedData = ((data as { hours: number }[]) || []).sort((a, b) => b.hours - a.hours);
    return NextResponse.json(sortedData);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
