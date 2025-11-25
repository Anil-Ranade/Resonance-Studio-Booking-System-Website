import { NextResponse } from "next/server";

// GET /api/studios - Fetch all studios
export async function GET() {
  // TODO: Implement Supabase query to fetch studios
  const studios = [
    {
      id: "studio-a",
      name: "Studio A",
      type: "Recording Studio",
      hourlyRate: 50,
      available: true,
    },
    {
      id: "studio-b",
      name: "Studio B",
      type: "Mixing Suite",
      hourlyRate: 75,
      available: true,
    },
    {
      id: "studio-c",
      name: "Studio C",
      type: "Podcast Room",
      hourlyRate: 35,
      available: true,
    },
  ];
  
  return NextResponse.json({ studios });
}
