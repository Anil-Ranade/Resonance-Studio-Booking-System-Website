import { NextRequest, NextResponse } from "next/server";

// POST /api/display/auth - Verify display page password
export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    const displayPassword = process.env.DISPLAY_PASSWORD;

    if (!displayPassword) {
      console.error("[Display Auth] DISPLAY_PASSWORD not configured in environment");
      return NextResponse.json(
        { error: "Authentication not configured" },
        { status: 500 }
      );
    }

    if (password === displayPassword) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Invalid password" },
      { status: 401 }
    );
  } catch (error) {
    console.error("[Display Auth] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
