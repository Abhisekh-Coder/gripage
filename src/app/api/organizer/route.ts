import { NextRequest, NextResponse } from "next/server";

// Hardcoded credentials for enterprise users
const USERS: Record<string, string> = {
  "ab@foxo.club": "foxo@2026",
  "supratik@foxo.club": "foxo@2026",
  "subhendu@foxo.club": "foxo@2026",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, code } = body;

    // Method 1: Email + password
    if (email && password) {
      const normalizedEmail = email.trim().toLowerCase();
      const expectedPassword = USERS[normalizedEmail];
      if (!expectedPassword) {
        return NextResponse.json({ valid: false, error: "Email not registered." });
      }
      if (password.trim() !== expectedPassword) {
        return NextResponse.json({ valid: false, error: "Incorrect password." });
      }
      return NextResponse.json({ valid: true });
    }

    // Method 2: Legacy code (fallback)
    if (code) {
      const expected = process.env.ORGANIZER_CODE;
      const valid = code?.trim() === expected?.trim();
      return NextResponse.json({ valid });
    }

    return NextResponse.json({ valid: false, error: "Provide email and password." }, { status: 400 });
  } catch {
    return NextResponse.json({ valid: false, error: "Invalid request." }, { status: 400 });
  }
}
