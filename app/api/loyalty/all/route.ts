import { NextResponse } from 'next/server';
import { supabaseClient as supabase } from '@/lib/supabaseClient';

export async function GET() {
  try {
    const { data, error } = await supabase
      .rpc('get_all_loyalty_statuses');

    if (error) {
      console.error('Error fetching all loyalty statuses:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Sort by hours descending (most loyal first)
    // Supabase RPC returns an array of objects
    const sortedData = (data as any[]).sort((a, b) => b.hours - a.hours);

    return NextResponse.json(sortedData);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
