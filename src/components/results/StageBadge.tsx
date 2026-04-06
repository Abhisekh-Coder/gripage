import { STAGE_MAP } from "@/lib/formula";
import type { BioStage } from "@/lib/types";

const ICONS: Record<BioStage, string> = {
  "Elite Vitality": "M40 25l5-12 5 12 13 2-10 9 3 13-11-6-11 6 3-13-10-9z", // star
  "Peak Fitness": "M40 28l-14 16h28z M40 38l-10 12h20z", // double chevron up
  "Above Average": "M40 26l-10 14h20z M35 50h10v10h-10z", // arrow up
  "On Track": "M28 48l8 8 16-16", // checkmark
  "Below Average": "M40 58l-10-14h20z M35 34h10v10h-10z", // arrow down
  "Needs Attention": "M37 30h6v18h-6z M37 54h6v6h-6z", // exclamation
  "Critical Gap": "M40 56l-14-16h28z M40 46l-10-12h20z", // double chevron down
};

const SIZES = { sm: "w-4 h-5", md: "w-8 h-10", lg: "w-16 h-20" };

export function StageBadge({ stage, size = "md" }: { stage: BioStage; size?: "sm" | "md" | "lg" }) {
  const info = STAGE_MAP[stage];
  const color = info.color;

  return (
    <div className={`${SIZES[size]} relative shrink-0`}>
      {/* Glow behind */}
      {size === "lg" && <div className="absolute inset-0 rounded-full blur-xl opacity-20" style={{ backgroundColor: color }} />}
      <svg viewBox="0 0 80 96" fill="none" className="w-full h-full relative">
        {/* Shield shape */}
        <path
          d="M40 2 L74 18 L74 52 Q74 72 40 94 Q6 72 6 52 L6 18 Z"
          fill={`${color}20`}
          stroke={color}
          strokeWidth="1.5"
          strokeOpacity="0.4"
        />
        {/* Inner icon */}
        <path
          d={ICONS[stage]}
          fill="none"
          stroke={color}
          strokeWidth={size === "sm" ? "3" : "2.5"}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
