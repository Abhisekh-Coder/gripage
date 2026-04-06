export function GripBarChart({ grip, expected, normAvg, normHigh, gender, ageGroup }: {
  grip: number; expected: number; normLow: number; normAvg: number; normHigh: number; gender: string; ageGroup: string;
}) {
  const maxVal = Math.max(normHigh * 1.1, grip * 1.05, expected * 1.05);
  const pct = (v: number) => `${Math.max(3, (v / maxVal) * 100)}%`;

  return (
    <div className="space-y-4 py-1">
      {/* Bar: You */}
      <div>
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-white/40 font-medium">You</span>
          <span className="text-white/60 font-bold">{grip} kg</span>
        </div>
        <div className="h-4 rounded-full bg-white/[0.04] overflow-hidden">
          <div className="h-full rounded-full bg-[#4ADE80]" style={{ width: pct(grip) }} />
        </div>
      </div>

      {/* Bar: Expected */}
      <div>
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-white/25">Expected</span>
          <span className="text-white/30">{expected} kg</span>
        </div>
        <div className="h-4 rounded-full bg-white/[0.04] overflow-hidden">
          <div className="h-full rounded-full bg-white/[0.10]" style={{ width: pct(expected) }} />
        </div>
      </div>

      {/* Bar: Population Average */}
      <div>
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-white/20">Avg ({gender === "male" ? "M" : "F"} {ageGroup})</span>
          <span className="text-white/20">{normAvg} kg</span>
        </div>
        <div className="h-4 rounded-full bg-white/[0.04] overflow-hidden">
          <div className="h-full rounded-full bg-white/[0.06]" style={{ width: pct(normAvg) }} />
        </div>
      </div>

      {/* Range label */}
      <div className="flex justify-between text-[8px] text-white/10 pt-1 border-t border-white/[0.03]">
        <span>0 kg</span>
        <span>{normHigh} kg (strong)</span>
      </div>
    </div>
  );
}
