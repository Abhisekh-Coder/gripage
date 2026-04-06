export function BioAgeGauge({ age, biologicalAge, delta }: { age: number; biologicalAge: number; delta: number }) {
  const clamped = Math.max(-15, Math.min(15, delta));
  const angle = Math.max(8, Math.min(172, ((clamped + 15) / 30) * 180));
  const rad = Math.PI - (angle * Math.PI) / 180;
  const cx = 100, cy = 100, r = 80;

  // Dot position on arc
  const dx = cx + r * Math.cos(rad);
  const dy = cy - r * Math.sin(rad);

  // Needle end (shorter than radius)
  const nx = cx + (r * 0.65) * Math.cos(rad);
  const ny = cy - (r * 0.65) * Math.sin(rad);

  // Arc fill length
  const totalArc = Math.PI * r;
  const fillLen = (angle / 180) * totalArc;

  const positive = delta >= 0;

  return (
    <svg viewBox="0 0 200 130" className="w-full max-w-[280px] mx-auto block">
      {/* Track */}
      <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" strokeLinecap="round" />

      {/* Fill */}
      <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke={positive ? "#4ADE80" : "#f87171"} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${fillLen} ${totalArc}`} opacity="0.5" />

      {/* Needle */}
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="4" fill="rgba(255,255,255,0.15)" />

      {/* Dot on arc */}
      <circle cx={dx} cy={dy} r="6" fill={positive ? "#4ADE80" : "#f87171"} stroke="#0B0B0F" strokeWidth="2.5" />

      {/* Center number */}
      <text x={cx} y={cy - 10} textAnchor="middle" fill="white" fontSize="32" fontWeight="900" fontFamily="Inter,system-ui">{biologicalAge}</text>
      <text x={cx} y={cy + 8} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="7" fontWeight="600" letterSpacing="0.15em">BIO AGE</text>

      {/* Bottom labels */}
      <text x="20" y="118" fill="rgba(255,255,255,0.12)" fontSize="8" textAnchor="start">Older</text>
      <text x={cx} y="118" fill="rgba(255,255,255,0.15)" fontSize="8" textAnchor="middle">{age}</text>
      <text x="180" y="118" fill="rgba(255,255,255,0.12)" fontSize="8" textAnchor="end">Younger</text>
    </svg>
  );
}
