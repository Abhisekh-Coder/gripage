import type { Gender, BioStage, BioStageInfo } from "./types";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function calculateExpectedGrip(
  gender: Gender,
  heightCm: number,
  weightKg: number,
  age: number
): number {
  if (gender === "male") {
    return -17 + 0.3 * heightCm + 0.2 * weightKg - 0.33 * age;
  }
  return -3 + 0.18 * heightCm + 0.12 * weightKg - 0.27 * age;
}

export function calculateBiologicalAge(
  gender: Gender,
  heightCm: number,
  weightKg: number,
  age: number,
  observedGrip: number
): { biologicalAge: number; expectedGrip: number; offset: number; delta: number } {
  const expectedGrip = calculateExpectedGrip(gender, heightCm, weightKg, age);
  const divisor = gender === "male" ? 0.33 : 0.27;
  const offset = (observedGrip - expectedGrip) / divisor;
  const dampened = clamp(offset * 0.4, -15, 15);
  const biologicalAge = Math.round(age - dampened);
  const delta = age - biologicalAge;

  return { biologicalAge, expectedGrip: Math.round(expectedGrip * 10) / 10, offset, delta };
}

export function getBioStage(delta: number): BioStageInfo {
  if (delta > 10) return STAGE_MAP["Elite Vitality"];
  if (delta > 5) return STAGE_MAP["Peak Fitness"];
  if (delta > 2) return STAGE_MAP["Above Average"];
  if (delta >= -2) return STAGE_MAP["On Track"];
  if (delta >= -5) return STAGE_MAP["Below Average"];
  if (delta >= -10) return STAGE_MAP["Needs Attention"];
  return STAGE_MAP["Critical Gap"];
}

export const STAGE_MAP: Record<BioStage, BioStageInfo> = {
  "Elite Vitality": {
    label: "Elite Vitality",
    color: "#fbbf24",
    bgColor: "rgba(251, 191, 36, 0.15)",
    description: "Exceptional biological fitness",
  },
  "Peak Fitness": {
    label: "Peak Fitness",
    color: "#4ade80",
    bgColor: "rgba(74, 222, 128, 0.15)",
    description: "Significantly younger biologically",
  },
  "Above Average": {
    label: "Above Average",
    color: "#86efac",
    bgColor: "rgba(134, 239, 172, 0.15)",
    description: "Healthier than expected",
  },
  "On Track": {
    label: "On Track",
    color: "#38bdf8",
    bgColor: "rgba(56, 189, 248, 0.15)",
    description: "Age-appropriate grip strength",
  },
  "Below Average": {
    label: "Below Average",
    color: "#fb923c",
    bgColor: "rgba(251, 146, 60, 0.15)",
    description: "Slightly weaker than expected",
  },
  "Needs Attention": {
    label: "Needs Attention",
    color: "#f87171",
    bgColor: "rgba(248, 113, 113, 0.15)",
    description: "Consider strength training",
  },
  "Critical Gap": {
    label: "Critical Gap",
    color: "#dc2626",
    bgColor: "rgba(220, 38, 38, 0.15)",
    description: "Strongly recommend fitness consultation",
  },
};
