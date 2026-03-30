import type { Gender, FitnessAnswers } from "./types";

export interface RegistrationData {
  name: string;
  email: string;
  phone: string;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  age: number;
  fitnessAnswers: FitnessAnswers;
}

const SESSION_KEY = "gripage_registration";

export function saveRegistration(data: RegistrationData): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

export function getRegistration(): RegistrationData | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearRegistration(): void {
  sessionStorage.removeItem(SESSION_KEY);
}
