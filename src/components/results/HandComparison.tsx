export function HandComparison({ left, right, expected }: { left: number | null; right: number | null; expected: number }) {
  const vals = [left, right].filter((v): v is number => v !== null);
  if (vals.length === 0) return null;

  const maxVal = Math.max(...vals, expected) * 1.2;
  const barH = (v: number) => Math.max(8, (v / maxVal) * 100);
  const expectedH = (expected / maxVal) * 100;

  const hasLeft = left !== null;
  const hasRight = right !== null;
  const hasBoth = hasLeft && hasRight;
  const diff = hasBoth ? Math.abs(left - right) : 0;
  const balanced = diff <= 2;

  return (
    <div className="w-full">
      <svg viewBox="0 0 240 140" className="w-full">
        {/* Expected line */}
        <line x1="20" y1={125 - expectedH} x2="220" y2={125 - expectedH} stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="4 3" />
        <text x="225" y={125 - expectedH + 3} fill="rgba(255,255,255,0.15)" fontSize="7">{expected}</text>

        {/* Left bar */}
        {hasLeft && (
          <>
            <rect x="50" y={125 - barH(left)} width="40" height={barH(left)} rx="4"
              fill={left >= expected ? "#4ADE80" : "#f87171"} opacity="0.7" />
            <text x="70" y={120 - barH(left)} textAnchor="middle" fill="white" fontSize="12" fontWeight="800">{left}</text>
            <text x="70" y="138" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="8">Left</text>
          </>
        )}

        {/* Right bar */}
        {hasRight && (
          <>
            <rect x="150" y={125 - barH(right)} width="40" height={barH(right)} rx="4"
              fill={right >= expected ? "#4ADE80" : "#f87171"} opacity="0.7" />
            <text x="170" y={120 - barH(right)} textAnchor="middle" fill="white" fontSize="12" fontWeight="800">{right}</text>
            <text x="170" y="138" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="8">Right</text>
          </>
        )}

        {/* Center difference */}
        {hasBoth && (
          <>
            <text x="120" y="55" textAnchor="middle" fill={balanced ? "#4ADE80" : "#f59e0b"} fontSize="14" fontWeight="800">{diff.toFixed(1)}</text>
            <text x="120" y="68" textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="7">kg diff</text>
            <text x="120" y="82" textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize="7">{balanced ? "Balanced" : "Imbalanced"}</text>
          </>
        )}
      </svg>
    </div>
  );
}
