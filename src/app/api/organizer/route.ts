import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { code } = await req.json();
  const expected = process.env.ORGANIZER_CODE;

  if (!expected) {
    return NextResponse.json({ valid: false, error: "ORGANIZER_CODE not configured" });
  }

  const valid = code?.trim() === expected.trim();
  return NextResponse.json({ valid });
}
