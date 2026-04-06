export function HandComparison({ left, right, expected }: { left: number | null; right: number | null; expected: number }) {
  const vals = [left, right].filter((v): v is number => v !== null);
  if (vals.length === 0) return null;

  const maxVal = Math.max(...vals, expected) * 1.15;
  const barPct = (v: number) => Math.max(8, (v / maxVal) * 100);
  const expPct = (expected / maxVal) * 100;

  const hasLeft = left !== null;
  const hasRight = right !== null;
  const hasBoth = hasLeft && hasRight;
  const diff = hasBoth ? Math.abs(left - right) : 0;
  const balanced = diff <= 2;

  return (
    <div className="py-2">
      <div className="flex items-end justify-center gap-6 sm:gap-10" style={{ height: "140px" }}>
        {/* Left bar */}
        {hasLeft && (
          <div className="flex flex-col items-center gap-1.5 flex-1 max-w-[60px]">
            <span className="text-lg font-black">{left}</span>
            <div className="w-full bg-white/[0.04] rounded-lg relative" style={{ height: "100px" }}>
              <div
                className="absolute bottom-0 w-full rounded-lg"
                style={{ height: `${barPct(left)}%`, backgroundColor: left >= expected ? "#4ADE80" : "rgba(74,222,128,0.4)" }}
              />
              {/* Expected line */}
              <div className="absolute w-[130%] -left-[15%] border-t border-dashed border-white/15" style={{ bottom: `${expPct}%` }} />
            </div>
            <span className="text-[10px] text-white/25">Left</span>
          </div>
        )}

        {/* Center: difference */}
        {hasBoth && (
          <div className="text-center shrink-0 self-center">
            <p className="text-xl font-black" style={{ color: balanced ? "#4ADE80" : "#f59e0b" }}>{diff.toFixed(1)}</p>
            <p className="text-[9px] text-white/20">kg diff</p>
            <p className="text-[9px] text-white/15 mt-0.5">{balanced ? "Balanced" : "Imbalanced"}</p>
          </div>
        )}

        {/* Right bar */}
        {hasRight && (
          <div className="flex flex-col items-center gap-1.5 flex-1 max-w-[60px]">
            <span className="text-lg font-black">{right}</span>
            <div className="w-full bg-white/[0.04] rounded-lg relative" style={{ height: "100px" }}>
              <div
                className="absolute bottom-0 w-full rounded-lg"
                style={{ height: `${barPct(right)}%`, backgroundColor: right >= expected ? "#4ADE80" : "rgba(74,222,128,0.4)" }}
              />
              <div className="absolute w-[130%] -left-[15%] border-t border-dashed border-white/15" style={{ bottom: `${expPct}%` }} />
            </div>
            <span className="text-[10px] text-white/25">Right</span>
          </div>
        )}
      </div>

      {/* Expected legend */}
      <div className="flex items-center justify-center gap-2 mt-3 text-[9px] text-white/15">
        <span className="w-4 border-t border-dashed border-white/20" />
        <span>Expected: {expected} kg</span>
      </div>
    </div>
  );
}
