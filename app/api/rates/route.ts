import { NextRequest, NextResponse } from 'next/server';

// Rate card table: rates per hour by studio and session type
const rateCard: Record<string, Record<string, number>> = {
  'Studio C': {
    'Recording': 1500,
    'Mixing': 1200,
    'Podcast': 1000,
    'Voice Over': 800,
  },
  'Studio B': {
    'Recording': 2500,
    'Mixing': 2000,
    'Podcast': 1500,
    'Voice Over': 1200,
  },
  'Studio A': {
    'Recording': 4000,
    'Mixing': 3500,
    'Podcast': 2500,
    'Voice Over': 2000,
  },
};

// Studio capacity limits
const studioCapacity: Record<string, number> = {
  'Studio C': 3,
  'Studio B': 6,
  'Studio A': 15,
};

// Studio order from smallest to largest
const studioOrder = ['Studio C', 'Studio B', 'Studio A'];

function getSuggestedStudio(groupSize: number): string | null {
  for (const studio of studioOrder) {
    if (groupSize <= studioCapacity[studio]) {
      return studio;
    }
  }
  return null;
}

function getAllowedStudios(suggestedStudio: string): string[] {
  const index = studioOrder.indexOf(suggestedStudio);
  if (index === -1) return [];
  return studioOrder.slice(index);
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionType = searchParams.get('sessionType');
  const groupSizeParam = searchParams.get('groupSize');

  // Validate inputs
  if (!sessionType || !groupSizeParam) {
    return NextResponse.json(
      { error: 'Missing required parameters: sessionType and groupSize are required' },
      { status: 400 }
    );
  }

  const groupSize = parseInt(groupSizeParam, 10);
  if (isNaN(groupSize) || groupSize < 1) {
    return NextResponse.json(
      { error: 'Invalid groupSize: must be a positive integer' },
      { status: 400 }
    );
  }

  // Validate session type exists in rate card
  const validSessionTypes = Object.keys(rateCard['Studio C']);
  if (!validSessionTypes.includes(sessionType)) {
    return NextResponse.json(
      { error: `Invalid sessionType: must be one of ${validSessionTypes.join(', ')}` },
      { status: 400 }
    );
  }

  // Determine suggested studio based on group size
  const suggestedStudio = getSuggestedStudio(groupSize);
  if (!suggestedStudio) {
    return NextResponse.json(
      { error: `Group size ${groupSize} exceeds maximum capacity of ${studioCapacity['Studio A']}` },
      { status: 400 }
    );
  }

  const suggestedRate = rateCard[suggestedStudio][sessionType];
  const allowedStudios = getAllowedStudios(suggestedStudio);

  const explanation = `For a ${sessionType} session with ${groupSize} ${groupSize === 1 ? 'person' : 'people'}, ` +
    `we recommend ${suggestedStudio} (capacity: ${studioCapacity[suggestedStudio]}) ` +
    `at ₹${suggestedRate}/hour. ` +
    (allowedStudios.length > 1
      ? `You may also book ${allowedStudios.slice(1).join(' or ')} for more space.`
      : `This is our largest studio.`);

  return NextResponse.json({
    suggested_studio: suggestedStudio,
    suggested_rate: suggestedRate,
    allowed_studios: allowedStudios,
    explanation,
  });
}
