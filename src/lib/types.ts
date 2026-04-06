export type Gender = "male" | "female";

export interface FitnessAnswers {
  doesGym: "yes" | "no" | "sometimes";
  gymFrequency: string; // e.g. "3-4 times/week"
  exerciseType: string[]; // e.g. ["weight_training", "cardio"]
  fitnessGoal: string;
  activityLevel: "sedentary" | "light" | "moderate" | "active" | "very_active";
}

export interface Participant {
  id: string;
  eventId: string;
  name: string;
  email: string;
  phone: string;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  age: number;
  fitnessAnswers: FitnessAnswers;
  gripLeftKg: number | null;
  gripRightKg: number | null;
  gripAvgKg: number;
  expectedGrip: number;
  biologicalAge: number;
  bioStage: BioStage;
  createdAt: number;
}

export interface GripEvent {
  id: string;
  code: string;
  name: string;
  date: string;
  adminPin: string;
  status: "live" | "ended";
  createdAt: number;
}

export type BioStage =
  | "Elite Vitality"
  | "Peak Fitness"
  | "Above Average"
  | "On Track"
  | "Below Average"
  | "Needs Attention"
  | "Critical Gap";

export interface BioStageInfo {
  label: BioStage;
  color: string;
  bgColor: string;
  description: string;
}

export type LeaderboardView = "delta" | "strongest";
export type AgeGroup = "all" | "17-29" | "30-39" | "40-49" | "50+";
