export function BioAgeGauge({ age, biologicalAge, delta }: { age: number; biologicalAge: number; delta: number }) {
  // Map delta (-15 to +15) to angle (0 to 180 degrees)
  const clampedDelta = Math.max(-15, Math.min(15, delta));
  const angle = ((clampedDelta + 15) / 30) * 180;
  const clampedAngle = Math.max(5, Math.min(175, angle));

  // Arc parameters
  const cx = 100, cy = 110, r = 85;
  const totalArcLength = Math.PI * r; // ~267

  // Fill arc length (from left to needle position)
  const fillLength = (clampedAngle / 180) * totalArcLength;

  // Needle endpoint
  const needleAngle = Math.PI - (clampedAngle * Math.PI) / 180;
  const nx = cx + (r - 10) * Math.cos(needleAngle);
  const ny = cy - (r - 10) * Math.sin(needleAngle);

  // Dot on arc
  const dotX = cx + r * Math.cos(needleAngle);
  const dotY = cy - r * Math.sin(needleAngle);

  const isPositive = delta >= 0;

  return (
    <div className="w-full">
      <svg viewBox="0 0 200 125" className="w-full">
        {/* Background arc */}
        <path
          d="M 15 110 A 85 85 0 0 1 185 110"
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="8"
          strokeLinecap="round"
        />

        {/* Colored fill arc */}
        <path
          d="M 15 110 A 85 85 0 0 1 185 110"
          fill="none"
          stroke={isPositive ? "#4ADE80" : "#f87171"}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${fillLength} ${totalArcLength}`}
          strokeOpacity="0.6"
        />

        {/* Tick marks */}
        {[0, 90, 180].map(deg => {
          const rad = Math.PI - (deg * Math.PI) / 180;
          const x1 = cx + (r + 4) * Math.cos(rad);
          const y1 = cy - (r + 4) * Math.sin(rad);
          const x2 = cx + (r + 9) * Math.cos(rad);
          const y2 = cy - (r + 9) * Math.sin(rad);
          return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />;
        })}

        {/* Needle line */}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" />

        {/* Dot on arc */}
        <circle cx={dotX} cy={dotY} r="5" fill={isPositive ? "#4ADE80" : "#f87171"} stroke="#0B0B0F" strokeWidth="2" />

        {/* Center: Bio Age value */}
        <text x={cx} y={cy - 15} textAnchor="middle" fill="white" fontSize="28" fontWeight="900" fontFamily="Inter, system-ui">{biologicalAge}</text>
        <text x={cx} y={cy + 2} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="8" fontWeight="500" letterSpacing="0.1em">BIO AGE</text>

        {/* End labels */}
        <text x="8" y="122" fill="rgba(255,255,255,0.15)" fontSize="7">Older</text>
        <text x={cx} y="122" textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize="7">{age}</text>
        <text x="192" y="122" textAnchor="end" fill="rgba(255,255,255,0.15)" fontSize="7">Younger</text>
      </svg>
    </div>
  );
}
