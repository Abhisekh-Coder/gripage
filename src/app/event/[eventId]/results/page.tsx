"use client";

import { Suspense, useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getParticipant, getParticipants } from "@/lib/store";
import { STAGE_MAP } from "@/lib/formula";
import { generateResultPDF } from "@/lib/pdf";
import type { Participant, BioStage, Gender } from "@/lib/types";

/* ─── gradient class per stage ─── */
const STAGE_BG: Record<BioStage, string> = {
  "Elite Vitality": "result-bg-elite",
  "Peak Fitness": "result-bg-peak",
  "Above Average": "result-bg-above",
  "On Track": "result-bg-ontrack",
  "Below Average": "result-bg-below",
  "Needs Attention": "result-bg-needs",
  "Critical Gap": "result-bg-critical",
};

const STAGE_EMOJI: Record<BioStage, string> = {
  "Elite Vitality": "👑",
  "Peak Fitness": "🔥",
  "Above Average": "💪",
  "On Track": "✅",
  "Below Average": "⚡",
  "Needs Attention": "🎯",
  "Critical Gap": "🏋️",
};

/* ─── Grip strength norms by age group & gender (kg) ─── */
function getGripNorms(age: number, gender: Gender) {
  // Based on population norms (LASI / Dodds et al.)
  const maleNorms: Record<string, { low: number; avg: number; high: number }> = {
    "17-29": { low: 35, avg: 45, high: 55 },
    "30-39": { low: 33, avg: 43, high: 53 },
    "40-49": { low: 30, avg: 40, high: 50 },
    "50-59": { low: 26, avg: 36, high: 46 },
    "60-69": { low: 22, avg: 32, high: 42 },
    "70+": { low: 18, avg: 27, high: 37 },
  };
  const femaleNorms: Record<string, { low: number; avg: number; high: number }> = {
    "17-29": { low: 20, avg: 28, high: 36 },
    "30-39": { low: 19, avg: 27, high: 35 },
    "40-49": { low: 18, avg: 25, high: 33 },
    "50-59": { low: 15, avg: 22, high: 30 },
    "60-69": { low: 13, avg: 19, high: 26 },
    "70+": { low: 10, avg: 16, high: 22 },
  };

  const norms = gender === "male" ? maleNorms : femaleNorms;
  let group = "17-29";
  if (age >= 70) group = "70+";
  else if (age >= 60) group = "60-69";
  else if (age >= 50) group = "50-59";
  else if (age >= 40) group = "40-49";
  else if (age >= 30) group = "30-39";

  return { ...norms[group], ageGroup: group };
}

function getGripPercentile(gripKg: number, age: number, gender: Gender): number {
  const norms = getGripNorms(age, gender);
  // Approximate percentile using normal-ish distribution
  const zScore = (gripKg - norms.avg) / ((norms.high - norms.low) / 3);
  // Sigmoid approximation of CDF
  const percentile = 100 / (1 + Math.exp(-1.7 * zScore));
  return Math.round(Math.min(99, Math.max(1, percentile)));
}

function getAgeGroupLabel(age: number): string {
  if (age >= 70) return "70+";
  if (age >= 60) return "60-69";
  if (age >= 50) return "50-59";
  if (age >= 40) return "40-49";
  if (age >= 30) return "30-39";
  return "17-29";
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-white/40">Loading results...</p>
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}

function ResultsContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = params.eventId as string;
  const pid = searchParams.get("pid") || "";

  const [participant, setParticipant] = useState<Participant | null>(null);
  const [animatedAge, setAnimatedAge] = useState(0);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    (async () => {
      const p = await getParticipant(pid);
      if (!p) return;
      setParticipant(p);
      setTimeout(() => setPhase(1), 400);
    })();
  }, [pid]);

  useEffect(() => {
    if (phase < 1 || !participant) return;
    const target = participant.biologicalAge;
    const start = participant.age;
    const duration = 1200;
    const startTime = Date.now();

    const frame = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (target - start) * eased);
      setAnimatedAge(current);
      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        setPhase(2);
      }
    };
    requestAnimationFrame(frame);
  }, [phase, participant]);

  const [rank, setRank] = useState(0);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [ageGroupRank, setAgeGroupRank] = useState({ rank: 0, total: 0 });

  useEffect(() => {
    if (!participant) return;
    (async () => {
      const all = await getParticipants(eventId);
      setTotalParticipants(all.length);
      const sorted = [...all].sort((a, b) => a.biologicalAge - b.biologicalAge);
      setRank(sorted.findIndex((p) => p.id === participant.id) + 1);

      // Age group ranking
      const ageGroup = getAgeGroupLabel(participant.age);
      const sameGroup = all.filter((p) => getAgeGroupLabel(p.age) === ageGroup);
      const groupSorted = [...sameGroup].sort((a, b) => a.biologicalAge - b.biologicalAge);
      setAgeGroupRank({
        rank: groupSorted.findIndex((p) => p.id === participant.id) + 1,
        total: sameGroup.length,
      });
    })();
  }, [participant, eventId]);

  const handleDownloadPDF = useCallback(() => {
    if (participant) generateResultPDF(participant);
  }, [participant]);

  if (!participant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Result not found</p>
      </div>
    );
  }

  const delta = participant.age - participant.biologicalAge;
  const stage = STAGE_MAP[participant.bioStage];
  const bgClass = STAGE_BG[participant.bioStage];
  const emoji = STAGE_EMOJI[participant.bioStage];
  const isYounger = delta > 0;

  const norms = getGripNorms(participant.age, participant.gender);
  const percentile = getGripPercentile(participant.gripAvgKg, participant.age, participant.gender);
  const gripDiff = participant.gripAvgKg - participant.expectedGrip;

  // Gauge: map bio age onto a meaningful scale
  // Scale from age-15 (younger end) to age+15 (older end)
  const gaugeMin = participant.age - 15;
  const gaugeMax = participant.age + 15;
  const gaugePosition = Math.min(100, Math.max(0, ((gaugeMax - participant.biologicalAge) / (gaugeMax - gaugeMin)) * 100));

  // Vitality score
  const vitalityScore = Math.round(Math.max(0, Math.min(100, 50 + delta * 3.3)));

  return (
    <div className={`min-h-screen ${bgClass} relative overflow-hidden`}>
      {phase >= 2 && <Particles color={stage.color} />}

      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-15 blur-[120px] pointer-events-none"
        style={{ background: stage.color }}
      />

      <div className="relative z-10 min-h-screen flex flex-col items-center px-4 py-6 max-w-5xl mx-auto">
        {/* Top bar */}
        <div className="w-full flex items-center justify-between mb-6 reveal-1">
          <button
            onClick={() => router.push(`/event/${eventId}`)}
            className="glass-card px-4 py-2 rounded-full text-sm text-white/70 hover:text-white transition-colors"
          >
            ← Back
          </button>
          <div className="flex items-center gap-3">
            <div className="glass-card px-4 py-2 rounded-full text-sm text-white/70">
              #{rank} of {totalParticipants}
            </div>
            {ageGroupRank.total > 1 && (
              <div className="glass-card px-4 py-2 rounded-full text-sm text-white/70 hidden sm:block">
                #{ageGroupRank.rank} in {getAgeGroupLabel(participant.age)} age group
              </div>
            )}
          </div>
        </div>

        {/* Name */}
        <div className="text-center mb-2 reveal-1">
          <p className="text-white/50 text-xs sm:text-sm tracking-[0.2em] uppercase">Results for</p>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mt-1">{participant.name}</h1>
        </div>

        {/* ─── BIG BIO AGE NUMBER ─── */}
        <div className="relative flex items-center justify-center my-6 sm:my-8 reveal-2">
          <div
            className="absolute w-44 h-44 sm:w-56 sm:h-56 rounded-full ring-pulse"
            style={{ border: `2px solid ${stage.color}30` }}
          />
          <div
            className="absolute w-32 h-32 sm:w-44 sm:h-44 rounded-full ring-pulse"
            style={{ border: `1px solid ${stage.color}20`, animationDelay: "1s" }}
          />
          <div className={`text-center ${phase >= 2 ? "number-pop" : ""}`}>
            <span className="dotted-number text-[90px] sm:text-[120px] leading-none font-black" style={{ color: stage.color }}>
              {animatedAge}
            </span>
            <span className="dotted-number text-3xl sm:text-4xl font-bold align-top ml-1" style={{ color: `${stage.color}99` }}>
              yrs
            </span>
          </div>
        </div>

        {/* Stage badge + delta */}
        <div className={`text-center mb-8 ${phase >= 2 ? "reveal-3" : "opacity-0"}`}>
          <div
            className="badge-shimmer inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-base"
            style={{
              color: stage.color,
              background: `linear-gradient(90deg, ${stage.bgColor}, ${stage.color}20, ${stage.bgColor})`,
              border: `1px solid ${stage.color}40`,
            }}
          >
            <span className="text-xl">{emoji}</span>
            {stage.label}
          </div>
          <p className="mt-3 text-base sm:text-lg text-white/80">
            {delta > 0 ? (
              <>
                You&apos;re{" "}
                <span className="font-bold" style={{ color: stage.color }}>
                  {Math.abs(delta)} years younger
                </span>{" "}
                biologically!
              </>
            ) : delta < 0 ? (
              <>
                You&apos;re{" "}
                <span className="font-bold" style={{ color: stage.color }}>
                  {Math.abs(delta)} years older
                </span>{" "}
                biologically
              </>
            ) : (
              <>Right on track for your age!</>
            )}
          </p>
        </div>

        {/* ═══════════ DESKTOP GRID LAYOUT ═══════════ */}
        <div className={`w-full ${phase >= 2 ? "reveal-4" : "opacity-0"}`}>
          {/* Row 1: Bio Age Gauge + Grip Comparison — side by side on desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

            {/* ─── BIOLOGICAL AGE GAUGE (Redesigned) ─── */}
            <div className="glass-card rounded-3xl p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white/50 text-xs uppercase tracking-wider font-medium">Biological Age Gauge</span>
                <span
                  className="text-xs px-3 py-1 rounded-full font-medium"
                  style={{ color: stage.color, background: stage.bgColor }}
                >
                  {stage.description}
                </span>
              </div>

              {/* Linear gauge — much clearer than arc */}
              <div className="relative mt-6 mb-8 px-2">
                {/* Scale labels */}
                <div className="flex justify-between text-xs text-white/30 mb-2">
                  <span>Older</span>
                  <span>Your Age</span>
                  <span>Younger</span>
                </div>

                {/* Track */}
                <div className="relative h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  {/* Gradient fill from red → yellow → green */}
                  <div className="absolute inset-0 rounded-full" style={{
                    background: "linear-gradient(to right, #ef4444, #f59e0b, #4ade80)",
                    opacity: 0.3,
                  }} />
                  {/* Center marker (actual age) */}
                  <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/40" />
                </div>

                {/* Bio age marker */}
                <div
                  className="absolute -bottom-1 transition-all duration-1000 ease-out"
                  style={{ left: `calc(${gaugePosition}% - 1px)`, top: "36px" }}
                >
                  <div className="relative">
                    <div
                      className="w-5 h-5 rounded-full border-2 shadow-lg"
                      style={{ backgroundColor: stage.color, borderColor: "white" }}
                    />
                    <div
                      className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ color: stage.color, background: stage.bgColor }}
                    >
                      Bio Age: {participant.biologicalAge}
                    </div>
                  </div>
                </div>

                {/* Number scale under the gauge */}
                <div className="flex justify-between mt-4 text-sm">
                  <div className="text-center">
                    <p className="text-lg sm:text-xl font-bold text-red-400">{participant.age + 15}</p>
                    <p className="text-[10px] text-white/30">+15 yrs</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg sm:text-xl font-bold text-yellow-400">{participant.age + 5}</p>
                    <p className="text-[10px] text-white/30">+5</p>
                  </div>
                  <div className="text-center relative">
                    <p className="text-lg sm:text-xl font-bold text-white/70">{participant.age}</p>
                    <p className="text-[10px] text-white/50 font-medium">Actual</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg sm:text-xl font-bold text-green-300">{participant.age - 5}</p>
                    <p className="text-[10px] text-white/30">-5</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg sm:text-xl font-bold text-green-400">{Math.max(1, participant.age - 15)}</p>
                    <p className="text-[10px] text-white/30">-15 yrs</p>
                  </div>
                </div>
              </div>

              {/* Delta summary */}
              <div className="flex items-center justify-center gap-6 mt-2 pt-4 border-t border-white/5">
                <div className="text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-white/80">{participant.age}</p>
                  <p className="text-xs text-white/40 mt-0.5">Actual Age</p>
                </div>
                <div className="flex flex-col items-center">
                  <span
                    className="text-xl sm:text-2xl font-black px-3 py-1 rounded-xl"
                    style={{ color: stage.color, background: stage.bgColor }}
                  >
                    {isYounger ? `−${Math.abs(delta)}` : delta === 0 ? "=" : `+${Math.abs(delta)}`}
                  </span>
                  <span className="text-[10px] text-white/30 mt-1">years diff</span>
                </div>
                <div className="text-center">
                  <p className="text-2xl sm:text-3xl font-bold" style={{ color: stage.color }}>
                    {participant.biologicalAge}
                  </p>
                  <p className="text-xs text-white/40 mt-0.5">Bio Age</p>
                </div>
              </div>
            </div>

            {/* ─── GRIP STRENGTH COMPARISON ─── */}
            <div className="glass-card rounded-3xl p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white/50 text-xs uppercase tracking-wider font-medium">Grip Strength Analysis</span>
                <span className="text-lg">💪</span>
              </div>

              {/* Your grip vs expected */}
              <div className="flex items-center justify-center gap-8 mb-5">
                <div className="text-center">
                  <p className="text-3xl sm:text-4xl font-black" style={{ color: stage.color }}>
                    {participant.gripAvgKg}
                  </p>
                  <p className="text-xs text-white/50 mt-1">Your Grip (kg)</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium px-3 py-1 rounded-full" style={{
                    color: gripDiff >= 0 ? "#4ade80" : "#f87171",
                    background: gripDiff >= 0 ? "rgba(74,222,128,0.15)" : "rgba(248,113,113,0.15)",
                  }}>
                    {gripDiff >= 0 ? "+" : ""}{gripDiff.toFixed(1)} kg
                  </p>
                  <p className="text-[10px] text-white/30 mt-1">vs expected</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl sm:text-4xl font-bold text-white/50">{participant.expectedGrip}</p>
                  <p className="text-xs text-white/50 mt-1">Expected (kg)</p>
                </div>
              </div>

              {/* Where you fall in age group range */}
              <div className="mb-5">
                <div className="flex justify-between text-xs text-white/40 mb-1.5">
                  <span>Grip range for {participant.gender === "male" ? "men" : "women"} aged {getAgeGroupLabel(participant.age)}</span>
                  <span>Top {100 - percentile}%</span>
                </div>
                <div className="relative h-4 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  {/* Range bar */}
                  <div className="absolute inset-0 rounded-full" style={{
                    background: "linear-gradient(to right, #ef444440, #f59e0b40, #4ade8040)",
                  }} />
                  {/* Your position marker */}
                  <div
                    className="absolute top-0 bottom-0 w-1 rounded-full transition-all duration-1000"
                    style={{
                      left: `${Math.min(98, Math.max(2, ((participant.gripAvgKg - norms.low) / (norms.high - norms.low)) * 100))}%`,
                      backgroundColor: stage.color,
                      boxShadow: `0 0 8px ${stage.color}`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs mt-1.5">
                  <span className="text-white/30">{norms.low} kg <span className="text-white/20">(weak)</span></span>
                  <span className="text-white/40">{norms.avg} kg <span className="text-white/20">(average)</span></span>
                  <span className="text-white/30">{norms.high} kg <span className="text-white/20">(strong)</span></span>
                </div>
              </div>

              {/* Percentile badge */}
              <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)" }}>
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black"
                  style={{ background: stage.bgColor, color: stage.color }}
                >
                  P{percentile}
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">
                    {percentile >= 75
                      ? "Stronger than most in your age group"
                      : percentile >= 50
                      ? "Above average for your age group"
                      : percentile >= 25
                      ? "Below average for your age group"
                      : "Weaker than most in your age group"}
                  </p>
                  <p className="text-xs text-white/40 mt-0.5">
                    You&apos;re stronger than {percentile}% of {participant.gender === "male" ? "men" : "women"} aged {getAgeGroupLabel(participant.age)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Left/Right hands + Vitality Score — 3 columns on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">

            {/* Left hand */}
            {participant.gripLeftKg !== null && (
              <div className="glass-card rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white/50 text-xs uppercase tracking-wider font-medium">Left Hand</span>
                  <span className="text-sm">🤛</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-black" style={{ color: stage.color }}>
                    {participant.gripLeftKg}
                  </p>
                  <span className="text-sm text-white/40">kg</span>
                </div>
                {/* How it compares */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-white/30 mb-1">
                    <span>vs expected {participant.expectedGrip} kg</span>
                    <span style={{ color: participant.gripLeftKg >= participant.expectedGrip ? "#4ade80" : "#f87171" }}>
                      {participant.gripLeftKg >= participant.expectedGrip ? "Above" : "Below"} expected
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full fill-animate"
                      style={{
                        width: `${Math.min(100, (participant.gripLeftKg / (participant.expectedGrip * 1.3)) * 100)}%`,
                        backgroundColor: participant.gripLeftKg >= participant.expectedGrip ? "#4ade80" : "#f87171",
                      }}
                    />
                  </div>
                </div>
                {/* Strength needed */}
                {participant.gripLeftKg < participant.expectedGrip && (
                  <p className="text-xs text-white/30 mt-2">
                    Need <span className="text-white/50 font-medium">{(participant.expectedGrip - participant.gripLeftKg).toFixed(1)} kg more</span> to reach expected
                  </p>
                )}
              </div>
            )}

            {/* Right hand */}
            {participant.gripRightKg !== null && (
              <div className="glass-card rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white/50 text-xs uppercase tracking-wider font-medium">Right Hand</span>
                  <span className="text-sm">🤜</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-black" style={{ color: stage.color }}>
                    {participant.gripRightKg}
                  </p>
                  <span className="text-sm text-white/40">kg</span>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-white/30 mb-1">
                    <span>vs expected {participant.expectedGrip} kg</span>
                    <span style={{ color: participant.gripRightKg >= participant.expectedGrip ? "#4ade80" : "#f87171" }}>
                      {participant.gripRightKg >= participant.expectedGrip ? "Above" : "Below"} expected
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full fill-animate"
                      style={{
                        width: `${Math.min(100, (participant.gripRightKg / (participant.expectedGrip * 1.3)) * 100)}%`,
                        backgroundColor: participant.gripRightKg >= participant.expectedGrip ? "#4ade80" : "#f87171",
                      }}
                    />
                  </div>
                </div>
                {participant.gripRightKg < participant.expectedGrip && (
                  <p className="text-xs text-white/30 mt-2">
                    Need <span className="text-white/50 font-medium">{(participant.expectedGrip - participant.gripRightKg).toFixed(1)} kg more</span> to reach expected
                  </p>
                )}
              </div>
            )}

            {/* Hand balance (only if both hands measured) */}
            {participant.gripLeftKg !== null && participant.gripRightKg !== null && (
              <div className="glass-card rounded-2xl p-5 sm:col-span-2 lg:col-span-1">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white/50 text-xs uppercase tracking-wider font-medium">Hand Balance</span>
                  <span className="text-sm">⚖️</span>
                </div>
                {(() => {
                  const diff = Math.abs(participant.gripLeftKg - participant.gripRightKg);
                  const dominant = participant.gripLeftKg > participant.gripRightKg ? "Left" : participant.gripRightKg > participant.gripLeftKg ? "Right" : "Equal";
                  const balanced = diff <= 2;
                  return (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-center flex-1">
                          <p className="text-2xl font-bold text-white/70">{participant.gripLeftKg}</p>
                          <p className="text-xs text-white/30">Left</p>
                        </div>
                        <div className="text-center px-3">
                          <p className="text-lg font-bold" style={{ color: balanced ? "#4ade80" : "#f59e0b" }}>
                            {diff.toFixed(1)} kg
                          </p>
                          <p className="text-[10px] text-white/30">difference</p>
                        </div>
                        <div className="text-center flex-1">
                          <p className="text-2xl font-bold text-white/70">{participant.gripRightKg}</p>
                          <p className="text-xs text-white/30">Right</p>
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
                        <p className="text-xs text-white/60">
                          {balanced ? (
                            <>Well balanced grip strength between both hands</>
                          ) : (
                            <>{dominant} hand dominant by {diff.toFixed(1)} kg. Some imbalance is normal; over 10% may indicate asymmetry to work on</>
                          )}
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Row 3: Vitality Score Card — full width */}
          <div className="glass-card-strong rounded-2xl p-5 sm:p-6 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0"
                  style={{ background: stage.bgColor }}
                >
                  {emoji}
                </div>
                <div>
                  <p className="font-bold text-lg sm:text-xl">{stage.label}</p>
                  <p className="text-white/40 text-sm">{stage.description}</p>
                </div>
              </div>

              {/* Vitality bar */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-xs text-white/40 mb-1.5">
                  <span>Vitality Score</span>
                  <span className="font-medium" style={{ color: stage.color }}>{vitalityScore}/100</span>
                </div>
                <div className="h-3 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full fill-animate"
                    style={{
                      width: `${Math.max(5, vitalityScore)}%`,
                      background: `linear-gradient(90deg, ${stage.color}80, ${stage.color})`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* What this means */}
            <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)" }}>
                <p className="text-xs text-white/40 mb-1">What your grip should be at {participant.age}</p>
                <p className="text-sm font-medium text-white/80">{participant.expectedGrip} kg average</p>
                <p className="text-xs text-white/30 mt-0.5">Based on your height, weight & age</p>
              </div>
              <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)" }}>
                <p className="text-xs text-white/40 mb-1">Your performance</p>
                <p className="text-sm font-medium" style={{ color: gripDiff >= 0 ? "#4ade80" : "#f87171" }}>
                  {gripDiff >= 0 ? `${gripDiff.toFixed(1)} kg above expected` : `${Math.abs(gripDiff).toFixed(1)} kg below expected`}
                </p>
                <p className="text-xs text-white/30 mt-0.5">
                  {percentile >= 50 ? "Better than average for your age" : "Room for improvement"}
                </p>
              </div>
              <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)" }}>
                <p className="text-xs text-white/40 mb-1">Age group standing</p>
                <p className="text-sm font-medium text-white/80">
                  Top {100 - percentile}% of {participant.gender === "male" ? "men" : "women"}
                </p>
                <p className="text-xs text-white/30 mt-0.5">Among {getAgeGroupLabel(participant.age)} year olds</p>
              </div>
            </div>
          </div>
        </div>

        {/* ─── BIO STAGE REFERENCE TABLE ─── */}
        <div className={`w-full mb-4 ${phase >= 2 ? "reveal-5" : "opacity-0"}`}>
          <div className="glass-card rounded-2xl p-5 sm:p-6">
            <h3 className="text-white/50 text-xs uppercase tracking-wider font-medium mb-4">Biological Stage Reference</h3>
            <div className="space-y-2">
              {[
                { range: "> +10", label: "Elite Vitality" as const },
                { range: "+6 to +10", label: "Peak Fitness" as const },
                { range: "+3 to +5", label: "Above Average" as const },
                { range: "-2 to +2", label: "On Track" as const },
                { range: "-5 to -3", label: "Below Average" as const },
                { range: "-10 to -6", label: "Needs Attention" as const },
                { range: "< -10", label: "Critical Gap" as const },
              ].map((row) => {
                const info = STAGE_MAP[row.label];
                const isCurrentStage = row.label === participant.bioStage;
                return (
                  <div
                    key={row.label}
                    className={`flex items-center gap-3 py-2 px-3 rounded-xl transition-all ${isCurrentStage ? "ring-1" : ""}`}
                    style={isCurrentStage ? { background: info.bgColor, outline: `1px solid ${info.color}40` } : {}}
                  >
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: info.color }} />
                    <span className="text-xs font-mono text-white/40 w-20 flex-shrink-0">{row.range}</span>
                    <span className={`text-sm flex-1 ${isCurrentStage ? "font-semibold" : "text-white/60"}`} style={isCurrentStage ? { color: info.color } : {}}>
                      {row.label}
                      {isCurrentStage && " ← You"}
                    </span>
                    <span className="text-xs text-white/30 hidden sm:block">{info.description}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-white/25 mt-3">Delta = Chronological Age − Biological Age. Positive means biologically younger.</p>
          </div>
        </div>

        {/* ─── SHARE CARD (hidden, used for screenshot) ─── */}
        <div id="share-card" className="fixed -left-[9999px] top-0 w-[600px] p-8 bg-[#0a0a0a]" style={{ fontFamily: "system-ui, sans-serif" }}>
          <div className="text-center mb-6">
            <p className="text-white/40 text-sm mb-1">GripAge Results</p>
            <h2 className="text-2xl font-bold text-white">{participant.name}</h2>
          </div>
          <div className="flex items-center justify-center gap-8 mb-6">
            <div className="text-center">
              <p className="text-5xl font-black" style={{ color: stage.color }}>{participant.biologicalAge}</p>
              <p className="text-white/50 text-sm mt-1">Biological Age</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: stage.color }}>
                {delta > 0 ? `${delta}y younger` : delta < 0 ? `${Math.abs(delta)}y older` : "On track"}
              </p>
              <p className="text-white/50 text-sm mt-1">vs actual age {participant.age}</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 py-3 rounded-xl" style={{ background: stage.bgColor }}>
            <span className="text-lg">{emoji}</span>
            <span className="font-semibold" style={{ color: stage.color }}>{stage.label}</span>
          </div>
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
            <p className="text-white/30 text-sm">Grip: {participant.gripAvgKg} kg</p>
            <p className="text-white/30 text-sm">Percentile: P{percentile}</p>
          </div>
        </div>

        {/* ─── ACTION BUTTONS ─── */}
        <div className={`w-full max-w-lg mx-auto space-y-3 pb-8 ${phase >= 2 ? "reveal-6" : "opacity-0"}`}>
          <div className="flex gap-3">
            <button
              onClick={handleDownloadPDF}
              className="flex-1 py-4 px-6 glass-card-strong rounded-2xl font-semibold text-lg text-white/90 hover:text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              PDF Report
            </button>
            <button
              onClick={async () => {
                const card = document.getElementById("share-card");
                if (!card) return;
                const { default: html2canvas } = await import("html2canvas");
                card.style.left = "0";
                card.style.position = "absolute";
                const canvas = await html2canvas(card, { backgroundColor: "#0a0a0a" });
                card.style.left = "-9999px";
                card.style.position = "fixed";
                canvas.toBlob(async (blob) => {
                  if (!blob) return;
                  const file = new File([blob], "gripage-results.png", { type: "image/png" });
                  if (navigator.share && navigator.canShare({ files: [file] })) {
                    await navigator.share({ files: [file], title: "My GripAge Results" });
                  } else {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "gripage-results.png";
                    a.click();
                    URL.revokeObjectURL(url);
                  }
                });
              }}
              className="flex-1 py-4 px-6 glass-card-strong rounded-2xl font-semibold text-lg text-white/90 hover:text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              Share
            </button>
          </div>
          <button
            onClick={() => router.push(`/event/${eventId}/leaderboard`)}
            className="w-full py-4 px-6 rounded-2xl font-semibold text-lg transition-all active:scale-[0.98]"
            style={{
              background: `linear-gradient(135deg, ${stage.color}, ${stage.color}cc)`,
              color: "#000",
              boxShadow: `0 8px 32px ${stage.color}40`,
            }}
          >
            View Leaderboard
          </button>
          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/event/${eventId}/register`)}
              className="flex-1 py-4 px-6 glass-card rounded-2xl font-semibold text-base text-white/80 hover:text-white transition-all active:scale-[0.98]"
            >
              Next Player →
            </button>
            <button
              onClick={() => router.push(`/event/${eventId}`)}
              className="py-4 px-6 glass-card rounded-2xl text-white/40 hover:text-white/70 transition-colors text-sm"
            >
              Back to Event
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Floating Particles ─── */
function Particles({ color }: { color: string }) {
  const particles = useMemo(
    () =>
      Array.from({ length: 20 }).map((_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        size: 3 + Math.random() * 6,
        delay: `${Math.random() * 3}s`,
        duration: `${2 + Math.random() * 3}s`,
        bottom: `${Math.random() * 40}%`,
      })),
    []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: p.left,
            bottom: p.bottom,
            width: p.size,
            height: p.size,
            backgroundColor: color,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
    </div>
  );
}
