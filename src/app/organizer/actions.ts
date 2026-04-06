"use server";

export async function validateOrganizerCode(code: string): Promise<boolean> {
  const expected = process.env.ORGANIZER_CODE;
  console.log("[OrganizerAuth] expected length:", expected?.length, "input length:", code.trim().length);
  if (!expected) {
    console.log("[OrganizerAuth] ORGANIZER_CODE env var is not set");
    return false;
  }
  return code.trim() === expected.trim();
}
