import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, code } = body;

    // Method 1: Email whitelist
    if (email) {
      const whitelist = (process.env.ORGANIZER_EMAILS || "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
      const valid = whitelist.includes(email.trim().toLowerCase());
      return NextResponse.json({ valid, method: "email" });
    }

    // Method 2: Legacy code (fallback)
    if (code) {
      const expected = process.env.ORGANIZER_CODE;
      const valid = code?.trim() === expected?.trim();
      return NextResponse.json({ valid, method: "code" });
    }

    return NextResponse.json({ valid: false, error: "Provide email or code" }, { status: 400 });
  } catch {
    return NextResponse.json({ valid: false, error: "Invalid request" }, { status: 400 });
  }
}
