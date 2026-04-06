"use server";

export async function validateOrganizerCode(code: string): Promise<boolean> {
  const expected = process.env.ORGANIZER_CODE;
  if (!expected) return false;
  return code === expected;
}
