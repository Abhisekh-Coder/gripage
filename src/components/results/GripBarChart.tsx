export function GripBarChart({ grip, expected, normLow, normAvg, normHigh, gender, ageGroup }: {
  grip: number; expected: number; normLow: number; normAvg: number; normHigh: number; gender: string; ageGroup: string;
}) {
  const maxVal = Math.max(normHigh * 1.15, grip * 1.1, expected * 1.1);
  const barW = (v: number) => Math.max(4, (v / maxVal) * 260);
  const markerX = 30 + (expected / maxVal) * 260;

  return (
    <div className="w-full">
      <svg viewBox="0 0 320 110" className="w-full">
        {/* Bar 1: Your Grip */}
        <text x="0" y="18" fill="rgba(255,255,255,0.35)" fontSize="8" fontWeight="600">You</text>
        <rect x="30" y="8" width="260" height="16" rx="3" fill="rgba(255,255,255,0.03)" />
        <rect x="30" y="8" width={barW(grip)} height="16" rx="3" fill="#4ADE80" />
        <text x={30 + barW(grip) + 6} y="19" fill="rgba(255,255,255,0.6)" fontSize="9" fontWeight="700">{grip} kg</text>

        {/* Bar 2: Expected */}
        <text x="0" y="50" fill="rgba(255,255,255,0.25)" fontSize="8">Expected</text>
        <rect x="30" y="40" width="260" height="16" rx="3" fill="rgba(255,255,255,0.03)" />
        <rect x="30" y="40" width={barW(expected)} height="16" rx="3" fill="rgba(255,255,255,0.12)" />
        <text x={30 + barW(expected) + 6} y="51" fill="rgba(255,255,255,0.35)" fontSize="9">{expected} kg</text>

        {/* Bar 3: Population Average */}
        <text x="0" y="82" fill="rgba(255,255,255,0.2)" fontSize="8">Avg</text>
        <rect x="30" y="72" width="260" height="16" rx="3" fill="rgba(255,255,255,0.03)" />
        <rect x="30" y="72" width={barW(normAvg)} height="16" rx="3" fill="rgba(255,255,255,0.06)" />
        <text x={30 + barW(normAvg) + 6} y="83" fill="rgba(255,255,255,0.25)" fontSize="9">{normAvg} kg</text>

        {/* Expected marker dashed line */}
        <line x1={markerX} y1="4" x2={markerX} y2="92" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3 2" />

        {/* Range label at bottom */}
        <text x="30" y="105" fill="rgba(255,255,255,0.12)" fontSize="7">{normLow}kg</text>
        <text x="290" y="105" textAnchor="end" fill="rgba(255,255,255,0.12)" fontSize="7">{normHigh}kg</text>
        <text x="160" y="105" textAnchor="middle" fill="rgba(255,255,255,0.12)" fontSize="7">{gender === "male" ? "Men" : "Women"} {ageGroup}</text>
      </svg>
    </div>
  );
}
