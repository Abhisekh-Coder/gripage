"use client";

import { Suspense, useEffect, useState, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getParticipant, getParticipants } from "@/lib/store";
import { STAGE_MAP } from "@/lib/formula";
import { generateResultPDF } from "@/lib/pdf";
import type { Participant, BioStage } from "@/lib/types";

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

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-white/40">Loading results...</p></div>}>
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
  const [phase, setPhase] = useState(0); // 0=loading, 1=counting, 2=revealed

  useEffect(() => {
    (async () => {
      const p = await getParticipant(pid);
      if (!p) return;
      setParticipant(p);
      setTimeout(() => setPhase(1), 400);
    })();
  }, [pid]);

  // Animate the number counting up/down
  useEffect(() => {
    if (phase < 1 || !participant) return;
    const target = participant.biologicalAge;
    const start = participant.age;
    const duration = 1200;
    const startTime = Date.now();

    const frame = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
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

  useEffect(() => {
    if (!participant) return;
    (async () => {
      const all = await getParticipants(eventId);
      setTotalParticipants(all.length);
      const sorted = [...all].sort((a, b) => a.biologicalAge - b.biologicalAge);
      setRank(sorted.findIndex((p) => p.id === participant.id) + 1);
    })();
  }, [participant, eventId]);

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

  // Arc gauge: map delta (-15 to +15) to angle (0 to 180)
  const gaugeAngle = Math.min(180, Math.max(0, ((delta + 15) / 30) * 180));

  // Grip strength as percentage of expected (for the circular meter)
  const gripPct = Math.min(150, Math.max(50, (participant.gripAvgKg / participant.expectedGrip) * 100));
  const gripStrokeDash = (gripPct / 150) * 283;

  return (
    <div className={`min-h-screen ${bgClass} relative overflow-hidden`}>
      {/* Floating particles */}
      {phase >= 2 && <Particles color={stage.color} />}

      {/* Ambient glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-20 blur-[100px] pointer-events-none"
        style={{ background: stage.color }}
      />

      <div className="relative z-10 min-h-screen flex flex-col items-center px-4 py-6 max-w-md mx-auto">
        {/* Top bar */}
        <div className="w-full flex items-center justify-between mb-4 reveal-1">
          <button
            onClick={() => router.push(`/event/${eventId}`)}
            className="glass-card px-4 py-2 rounded-full text-sm text-white/70 hover:text-white transition-colors"
          >
            ← Back
          </button>
          <div className="glass-card px-4 py-2 rounded-full text-sm text-white/70">
            #{rank} of {totalParticipants}
          </div>
        </div>

        {/* Name + greeting */}
        <div className="text-center mb-2 reveal-1">
          <p className="text-white/50 text-sm tracking-wider uppercase">Results for</p>
          <h1 className="text-2xl font-bold mt-1">{participant.name}</h1>
        </div>

        {/* ─── BIG BIO AGE NUMBER ─── */}
        <div className="relative flex items-center justify-center my-6 reveal-2">
          {/* Pulsing ring behind */}
          <div
            className="absolute w-56 h-56 rounded-full ring-pulse"
            style={{ border: `2px solid ${stage.color}30` }}
          />
          <div
            className="absolute w-44 h-44 rounded-full ring-pulse"
            style={{ border: `1px solid ${stage.color}20`, animationDelay: "1s" }}
          />

          <div className={`text-center ${phase >= 2 ? "number-pop" : ""}`}>
            <span
              className="dotted-number text-[120px] leading-none font-black"
              style={{ color: stage.color }}
            >
              {animatedAge}
            </span>
            <span
              className="dotted-number text-4xl font-bold align-top ml-1"
              style={{ color: `${stage.color}99` }}
            >
              yrs
            </span>
          </div>
        </div>

        {/* Stage badge */}
        <div className={`text-center mb-6 ${phase >= 2 ? "reveal-3" : "opacity-0"}`}>
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

          {/* Delta callout */}
          <p className="mt-3 text-lg text-white/80">
            {delta > 0 ? (
              <>
                You&apos;re <span className="font-bold" style={{ color: stage.color }}>{Math.abs(delta)} years younger</span> biologically!
              </>
            ) : delta < 0 ? (
              <>
                You&apos;re <span className="font-bold" style={{ color: stage.color }}>{Math.abs(delta)} years older</span> biologically
              </>
            ) : (
              <>Right on track for your age!</>
            )}
          </p>
        </div>

        {/* ─── ARC GAUGE (like sun path) ─── */}
        <div className={`w-full mb-6 ${phase >= 2 ? "reveal-4" : "opacity-0"}`}>
          <div className="glass-card rounded-3xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/40 text-xs uppercase tracking-wider">Biological Age Gauge</span>
              <span className="text-xs px-2 py-1 rounded-full" style={{ color: stage.color, background: stage.bgColor }}>
                {stage.description}
              </span>
            </div>

            {/* SVG Arc */}
            <div className="relative h-32 flex items-end justify-center">
              <svg viewBox="0 0 200 110" className="w-full max-w-[280px]">
                {/* Background arc */}
                <path
                  d="M 15 100 A 85 85 0 0 1 185 100"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="3"
                  strokeDasharray="4 4"
                />
                {/* Colored arc fill */}
                <path
                  d="M 15 100 A 85 85 0 0 1 185 100"
                  fill="none"
                  stroke={stage.color}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${(gaugeAngle / 180) * 267} 267`}
                  className="arc-glow"
                  style={{ transition: "stroke-dasharray 1.5s ease-out" }}
                />
                {/* Needle dot */}
                {phase >= 2 && (
                  <circle
                    cx={100 + 85 * Math.cos(Math.PI - (gaugeAngle * Math.PI) / 180)}
                    cy={100 - 85 * Math.sin((gaugeAngle * Math.PI) / 180)}
                    r="6"
                    fill={stage.color}
                    className="arc-glow"
                    style={{ transition: "cx 1.5s ease-out, cy 1.5s ease-out" }}
                  />
                )}
                {/* Labels */}
                <text x="10" y="108" fill="rgba(255,255,255,0.3)" fontSize="8" textAnchor="start">Older</text>
                <text x="100" y="108" fill="rgba(255,255,255,0.3)" fontSize="8" textAnchor="middle">On Track</text>
                <text x="190" y="108" fill="rgba(255,255,255,0.3)" fontSize="8" textAnchor="end">Younger</text>
              </svg>
            </div>

            {/* Chrono vs Bio comparison */}
            <div className="flex items-center justify-between mt-2 px-2">
              <div className="text-center">
                <p className="text-2xl font-bold text-white/90">{participant.age}</p>
                <p className="text-xs text-white/40">Actual Age</p>
              </div>
              <div className="flex-1 mx-4 h-px bg-gradient-to-r from-white/10 via-white/30 to-white/10 relative">
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#1a1a1a] px-2 text-xs text-white/50">
                  {isYounger ? `−${Math.abs(delta)}` : delta === 0 ? "=" : `+${Math.abs(delta)}`}
                </span>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: stage.color }}>{participant.biologicalAge}</p>
                <p className="text-xs text-white/40">Bio Age</p>
              </div>
            </div>
          </div>
        </div>

        {/* ─── METRIC CARDS (glassmorphic, like weather widgets) ─── */}
        <div className={`w-full grid grid-cols-2 gap-3 mb-6 ${phase >= 2 ? "reveal-5" : "opacity-0"}`}>
          {/* Grip Strength circular meter */}
          <div className="glass-card rounded-2xl p-4 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/40 text-xs uppercase tracking-wider">Grip Power</span>
              <span className="text-lg">💪</span>
            </div>
            <div className="flex items-center justify-center my-2">
              <svg width="80" height="80" viewBox="0 0 100 100" className="transform -rotate-90">
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={stage.color}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${gripStrokeDash} 283`}
                  className="meter-animate arc-glow"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-2xl font-black" style={{ color: stage.color }}>
                  {participant.gripAvgKg}
                </span>
                <span className="text-xs text-white/50 block">kg</span>
              </div>
            </div>
            <div className="text-center">
              <span className="text-xs text-white/40">
                Expected: {participant.expectedGrip} kg
              </span>
            </div>
          </div>

          {/* Delta / Mood card (like Enhance Mood widget) */}
          <div className="glass-card rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/40 text-xs uppercase tracking-wider">Age Delta</span>
              <span className="text-lg">{isYounger ? "⬆️" : delta === 0 ? "➡️" : "⬇️"}</span>
            </div>
            <div className="text-center my-3">
              <span className="text-5xl font-black" style={{ color: stage.color }}>
                {isYounger ? "−" : delta === 0 ? "" : "+"}{Math.abs(delta)}
              </span>
              <span className="text-white/50 text-sm block mt-1">years</span>
            </div>
            {/* Mini bar chart */}
            <div className="flex items-end justify-center gap-[3px] h-6">
              {Array.from({ length: 15 }).map((_, i) => {
                const barDelta = i - 7;
                const isActive = isYounger ? barDelta <= delta && barDelta >= 0 : barDelta >= delta && barDelta <= 0;
                const isCurrent = barDelta === (isYounger ? delta : delta);
                return (
                  <div
                    key={i}
                    className="w-[4px] rounded-full transition-all duration-500"
                    style={{
                      height: `${8 + Math.abs(barDelta) * 1.5}px`,
                      backgroundColor: isActive || isCurrent ? stage.color : "rgba(255,255,255,0.08)",
                      opacity: isCurrent ? 1 : isActive ? 0.6 : 0.3,
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Left hand */}
          {participant.gripLeftKg !== null && (
            <div className="glass-card rounded-2xl p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-white/40 text-xs uppercase tracking-wider">Left Hand</span>
                <span className="text-sm">🤛</span>
              </div>
              <p className="text-3xl font-black mt-2" style={{ color: stage.color }}>
                {participant.gripLeftKg}
                <span className="text-sm text-white/40 font-normal ml-1">kg</span>
              </p>
              <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full fill-animate"
                  style={{
                    width: `${Math.min(100, (participant.gripLeftKg / participant.expectedGrip) * 100)}%`,
                    backgroundColor: stage.color,
                  }}
                />
              </div>
            </div>
          )}

          {/* Right hand */}
          {participant.gripRightKg !== null && (
            <div className="glass-card rounded-2xl p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-white/40 text-xs uppercase tracking-wider">Right Hand</span>
                <span className="text-sm">🤜</span>
              </div>
              <p className="text-3xl font-black mt-2" style={{ color: stage.color }}>
                {participant.gripRightKg}
                <span className="text-sm text-white/40 font-normal ml-1">kg</span>
              </p>
              <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full fill-animate"
                  style={{
                    width: `${Math.min(100, (participant.gripRightKg / participant.expectedGrip) * 100)}%`,
                    backgroundColor: stage.color,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ─── XP / SCORE CARD ─── */}
        <div className={`w-full mb-6 ${phase >= 2 ? "reveal-5" : "opacity-0"}`}>
          <div className="glass-card-strong rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ background: stage.bgColor }}
              >
                {emoji}
              </div>
              <div>
                <p className="font-bold text-lg">{stage.label}</p>
                <p className="text-white/40 text-sm">{stage.description}</p>
              </div>
            </div>

            {/* XP bar */}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-white/40 mb-1">
                <span>Vitality Score</span>
                <span>{Math.round(Math.max(0, Math.min(100, 50 + delta * 3.3)))}/100</span>
              </div>
              <div className="h-3 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full fill-animate"
                  style={{
                    width: `${Math.max(5, Math.min(100, 50 + delta * 3.3))}%`,
                    background: `linear-gradient(90deg, ${stage.color}80, ${stage.color})`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ─── ACTION BUTTONS ─── */}
        <div className={`w-full space-y-3 pb-8 ${phase >= 2 ? "reveal-6" : "opacity-0"}`}>
          {/* Download PDF */}
          <button
            onClick={() => generateResultPDF(participant)}
            className="w-full py-4 px-6 glass-card-strong rounded-2xl font-semibold text-lg text-white/90 hover:text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            📄 Download PDF Report
          </button>
          <button
            onClick={() => router.push(`/event/${eventId}/leaderboard`)}
            className="w-full py-4 px-6 rounded-2xl font-semibold text-lg transition-all active:scale-[0.98]"
            style={{
              background: `linear-gradient(135deg, ${stage.color}, ${stage.color}cc)`,
              color: "#000",
              boxShadow: `0 8px 32px ${stage.color}40`,
            }}
          >
            🏆 View Leaderboard
          </button>
          <button
            onClick={() => router.push(`/event/${eventId}/register`)}
            className="w-full py-4 px-6 glass-card rounded-2xl font-semibold text-lg text-white/80 hover:text-white transition-all active:scale-[0.98]"
          >
            Next Player →
          </button>
          <button
            onClick={() => router.push(`/event/${eventId}`)}
            className="w-full py-3 text-white/30 hover:text-white/60 transition-colors text-sm"
          >
            Back to Event
          </button>
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
