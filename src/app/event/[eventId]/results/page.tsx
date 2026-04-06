"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getParticipant, getParticipants } from "@/lib/store";
import { STAGE_MAP } from "@/lib/formula";
import { generateResultPDF } from "@/lib/pdf";
import type { Participant, BioStage, Gender } from "@/lib/types";

const STAGE_EMOJI: Record<BioStage, string> = {
  "Elite Vitality": "👑", "Peak Fitness": "🔥", "Above Average": "💪",
  "On Track": "✅", "Below Average": "⚡", "Needs Attention": "🎯", "Critical Gap": "🏋️",
};

function getGripNorms(age: number, gender: Gender) {
  const m: Record<string, { low: number; avg: number; high: number }> = {
    "17-29": { low: 35, avg: 45, high: 55 }, "30-39": { low: 33, avg: 43, high: 53 },
    "40-49": { low: 30, avg: 40, high: 50 }, "50-59": { low: 26, avg: 36, high: 46 },
    "60-69": { low: 22, avg: 32, high: 42 }, "70+": { low: 18, avg: 27, high: 37 },
  };
  const f: Record<string, { low: number; avg: number; high: number }> = {
    "17-29": { low: 20, avg: 28, high: 36 }, "30-39": { low: 19, avg: 27, high: 35 },
    "40-49": { low: 18, avg: 25, high: 33 }, "50-59": { low: 15, avg: 22, high: 30 },
    "60-69": { low: 13, avg: 19, high: 26 }, "70+": { low: 10, avg: 16, high: 22 },
  };
  const norms = gender === "male" ? m : f;
  let g = "17-29";
  if (age >= 70) g = "70+"; else if (age >= 60) g = "60-69"; else if (age >= 50) g = "50-59";
  else if (age >= 40) g = "40-49"; else if (age >= 30) g = "30-39";
  return { ...norms[g], ageGroup: g };
}

function getPercentile(gripKg: number, age: number, gender: Gender): number {
  const n = getGripNorms(age, gender);
  const z = (gripKg - n.avg) / ((n.high - n.low) / 3);
  return Math.round(Math.min(99, Math.max(1, 100 / (1 + Math.exp(-1.7 * z)))));
}

function ageGroupLabel(age: number): string {
  if (age >= 70) return "70+"; if (age >= 60) return "60-69"; if (age >= 50) return "50-59";
  if (age >= 40) return "40-49"; if (age >= 30) return "30-39"; return "17-29";
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: "#080e1a" }}><p className="text-white/40">Loading...</p></div>}>
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
  const [revealed, setRevealed] = useState(false);
  const [rank, setRank] = useState(0);
  const [totalP, setTotalP] = useState(0);

  useEffect(() => {
    (async () => {
      const p = await getParticipant(pid);
      if (!p) return;
      setParticipant(p);
      try { localStorage.setItem(`gripage_result_${eventId}`, JSON.stringify({ pid: p.id, name: p.name })); } catch {}

      setTimeout(() => {
        const target = p.biologicalAge, start = p.age, dur = 1200, t0 = Date.now();
        const frame = () => {
          const prog = Math.min((Date.now() - t0) / dur, 1);
          setAnimatedAge(Math.round(start + (target - start) * (1 - Math.pow(1 - prog, 3))));
          if (prog < 1) requestAnimationFrame(frame); else setRevealed(true);
        };
        requestAnimationFrame(frame);
      }, 400);

      const all = await getParticipants(eventId);
      setTotalP(all.length);
      setRank([...all].sort((a, b) => a.biologicalAge - b.biologicalAge).findIndex((x) => x.id === p.id) + 1);
    })();
  }, [pid, eventId]);

  const handlePDF = useCallback(() => { if (participant) generateResultPDF(participant); }, [participant]);

  if (!participant) return <div className="min-h-screen flex items-center justify-center" style={{ background: "#080e1a" }}><p className="text-white/40">Result not found</p></div>;

  const delta = participant.age - participant.biologicalAge;
  const stage = STAGE_MAP[participant.bioStage];
  const emoji = STAGE_EMOJI[participant.bioStage];
  const norms = getGripNorms(participant.age, participant.gender);
  const percentile = getPercentile(participant.gripAvgKg, participant.age, participant.gender);
  const gripDiff = participant.gripAvgKg - participant.expectedGrip;
  const vitality = Math.round(Math.max(0, Math.min(100, 50 + delta * 3.3)));
  const circumference = 2 * Math.PI * 42;

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "#080e1a" }}>
      {/* Blue light beam — matches event page */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] pointer-events-none" style={{ background: "radial-gradient(ellipse at 80% 10%, rgba(56,189,248,0.12) 0%, rgba(56,189,248,0.03) 40%, transparent 70%)" }} />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] pointer-events-none" style={{ background: "radial-gradient(ellipse at 20% 90%, rgba(212,132,90,0.06) 0%, transparent 60%)" }} />

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-6 space-y-5">

        {/* ═══ GREETING HEADER ═══ */}
        <div>
          <button onClick={() => router.push(`/event/${eventId}`)} className="text-white/30 hover:text-white/60 text-sm mb-4 block transition-colors">← Back to Event</button>
          <h1 className="text-3xl sm:text-4xl font-bold">
            Hello, <span style={{ color: stage.color }}>{participant.name.split(" ")[0]}</span>
          </h1>
          <p className="text-white/40 mt-1">Here are your GripAge results · <span className="text-white/25">#{rank} of {totalP}</span></p>
        </div>

        {/* ═══ HERO STAT CARDS (3 columns) ═══ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          {/* Bio Age */}
          <div className="rounded-2xl p-6 text-center relative overflow-hidden bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm">
            <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 50% 0%, ${stage.color}12, transparent 70%)` }} />
            <div className="relative">
              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-3">Biological Age</p>
              <p className="text-7xl font-black leading-none" style={{ color: stage.color }}>{animatedAge}</p>
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ color: stage.color, background: `${stage.color}18` }}>
                {emoji} {stage.label}
              </div>
            </div>
          </div>

          {/* Grip Strength */}
          <div className="rounded-2xl p-6 text-center bg-[#d4845a]/8 border border-[#d4845a]/20 backdrop-blur-sm">
            <p className="text-[10px] text-[#d4845a]/60 uppercase tracking-wider mb-3">Grip Strength</p>
            <p className="text-6xl font-black text-[#d4845a]">{participant.gripAvgKg}</p>
            <p className="text-sm text-white/30 mt-1">kg</p>
            <p className="text-sm mt-3 font-medium" style={{ color: gripDiff >= 0 ? "#4ade80" : "#f87171" }}>
              {gripDiff >= 0 ? "+" : ""}{gripDiff.toFixed(1)} kg vs expected
            </p>
          </div>

          {/* Vitality Score — Circular */}
          <div className="rounded-2xl p-6 text-center bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm">
            <p className="text-[10px] text-white/30 uppercase tracking-wider mb-3">Vitality Score</p>
            <div className="relative inline-block">
              <svg width="110" height="110" viewBox="0 0 110 110">
                <circle cx="55" cy="55" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="7" />
                <circle cx="55" cy="55" r="42" fill="none" stroke={stage.color} strokeWidth="7"
                  strokeDasharray={`${(vitality / 100) * circumference} ${circumference}`}
                  strokeLinecap="round" transform="rotate(-90 55 55)"
                  className="meter-animate" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-3xl font-black" style={{ color: stage.color }}>
                {vitality}
              </span>
            </div>
            <p className="text-sm text-white/40 mt-2">
              {delta > 0 ? `${delta}y younger` : delta < 0 ? `${Math.abs(delta)}y older` : "On track"}
            </p>
          </div>
        </div>

        {/* ═══ DETAIL GRID ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Age Comparison */}
          <Card title="Age Comparison">
            <div className="grid grid-cols-3 gap-4 text-center mb-5">
              <div>
                <p className="text-3xl font-bold text-white/70">{participant.age}</p>
                <p className="text-xs text-white/25 mt-1">Actual</p>
              </div>
              <div>
                <p className="text-2xl font-black px-3 py-1 rounded-xl inline-block" style={{ color: stage.color, background: `${stage.color}15` }}>
                  {delta > 0 ? `−${delta}` : delta < 0 ? `+${Math.abs(delta)}` : "="}
                </p>
                <p className="text-xs text-white/25 mt-1">Delta</p>
              </div>
              <div>
                <p className="text-3xl font-bold" style={{ color: stage.color }}>{participant.biologicalAge}</p>
                <p className="text-xs text-white/25 mt-1">Bio Age</p>
              </div>
            </div>
            {/* Gauge */}
            <div className="mb-2">
              <div className="flex justify-between text-[10px] text-white/20 mb-1"><span>Older</span><span>Your Age</span><span>Younger</span></div>
              <div className="relative h-3 rounded-full bg-white/5">
                <div className="absolute inset-0 rounded-full" style={{ background: "linear-gradient(to right, #ef444440, #f59e0b40, #4ade8040)" }} />
                <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/20" />
                {(() => {
                  const pos = Math.min(100, Math.max(0, ((participant.age + 15 - participant.biologicalAge) / 30) * 100));
                  return <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white -ml-2" style={{ left: `${pos}%`, backgroundColor: stage.color }} />;
                })()}
              </div>
            </div>
            {/* Vitality bar */}
            <div className="mt-5 pt-4 border-t border-white/5">
              <div className="flex justify-between text-xs text-white/30 mb-1.5">
                <span>Vitality Score</span>
                <span className="font-medium" style={{ color: stage.color }}>{vitality}/100</span>
              </div>
              <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${Math.max(5, vitality)}%`, background: `linear-gradient(90deg, ${stage.color}80, ${stage.color})` }} />
              </div>
            </div>
          </Card>

          {/* Grip Details */}
          <Card title="Grip Details" variant="accent">
            <div className="grid grid-cols-3 gap-3 text-center mb-4">
              <div>
                <p className="text-3xl font-black" style={{ color: stage.color }}>{participant.gripAvgKg}</p>
                <p className="text-xs text-white/25 mt-1">Your (kg)</p>
              </div>
              <div>
                <p className="text-sm font-medium px-2 py-1 rounded-full inline-block" style={{ color: gripDiff >= 0 ? "#4ade80" : "#f87171", background: gripDiff >= 0 ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)" }}>
                  {gripDiff >= 0 ? "+" : ""}{gripDiff.toFixed(1)}
                </p>
                <p className="text-xs text-white/25 mt-1">vs expected</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-white/35">{participant.expectedGrip}</p>
                <p className="text-xs text-white/25 mt-1">Expected</p>
              </div>
            </div>
            {/* Range */}
            <div className="mb-4">
              <div className="flex justify-between text-[10px] text-white/20 mb-1"><span>{norms.low}kg</span><span>{norms.avg} avg</span><span>{norms.high}kg</span></div>
              <div className="relative h-3 rounded-full bg-white/5">
                <div className="absolute inset-0 rounded-full" style={{ background: "linear-gradient(to right, #ef444430, #f59e0b30, #4ade8030)" }} />
                <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-white -ml-[7px]" style={{
                  left: `${Math.min(98, Math.max(2, ((participant.gripAvgKg - norms.low) / (norms.high - norms.low)) * 100))}%`,
                  backgroundColor: stage.color,
                }} />
              </div>
            </div>
            {/* Percentile */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03]">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-black" style={{ background: `${stage.color}15`, color: stage.color }}>P{percentile}</div>
              <p className="text-sm text-white/60">Stronger than <span className="font-semibold" style={{ color: stage.color }}>{percentile}%</span> of {participant.gender === "male" ? "men" : "women"} aged {ageGroupLabel(participant.age)}</p>
            </div>
          </Card>
        </div>

        {/* ═══ HAND DETAILS ═══ */}
        {(participant.gripLeftKg !== null || participant.gripRightKg !== null) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {participant.gripLeftKg !== null && (
              <Card title="Left Hand">
                <div className="flex items-baseline gap-2 mb-3">
                  <p className="text-3xl font-black" style={{ color: stage.color }}>{participant.gripLeftKg}</p>
                  <span className="text-sm text-white/25">kg</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, (participant.gripLeftKg / (participant.expectedGrip * 1.3)) * 100)}%`, backgroundColor: participant.gripLeftKg >= participant.expectedGrip ? "#4ade80" : "#f87171" }} />
                </div>
                <p className="text-xs text-white/25 mt-2">{participant.gripLeftKg >= participant.expectedGrip ? "Above" : "Below"} expected ({participant.expectedGrip} kg)</p>
              </Card>
            )}
            {participant.gripRightKg !== null && (
              <Card title="Right Hand">
                <div className="flex items-baseline gap-2 mb-3">
                  <p className="text-3xl font-black" style={{ color: stage.color }}>{participant.gripRightKg}</p>
                  <span className="text-sm text-white/25">kg</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, (participant.gripRightKg / (participant.expectedGrip * 1.3)) * 100)}%`, backgroundColor: participant.gripRightKg >= participant.expectedGrip ? "#4ade80" : "#f87171" }} />
                </div>
                <p className="text-xs text-white/25 mt-2">{participant.gripRightKg >= participant.expectedGrip ? "Above" : "Below"} expected ({participant.expectedGrip} kg)</p>
              </Card>
            )}
            {participant.gripLeftKg !== null && participant.gripRightKg !== null && (
              <Card title="Hand Balance">
                {(() => {
                  const diff = Math.abs(participant.gripLeftKg - participant.gripRightKg);
                  const ok = diff <= 2;
                  return (<>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-center flex-1"><p className="text-2xl font-bold text-white/50">{participant.gripLeftKg}</p><p className="text-[10px] text-white/20">Left</p></div>
                      <div className="text-center px-3"><p className="text-lg font-bold" style={{ color: ok ? "#4ade80" : "#f59e0b" }}>{diff.toFixed(1)} kg</p><p className="text-[10px] text-white/20">diff</p></div>
                      <div className="text-center flex-1"><p className="text-2xl font-bold text-white/50">{participant.gripRightKg}</p><p className="text-[10px] text-white/20">Right</p></div>
                    </div>
                    <p className="text-xs text-white/30">{ok ? "Well balanced" : `${diff.toFixed(1)} kg imbalance`}</p>
                  </>);
                })()}
              </Card>
            )}
          </div>
        )}

        {/* ═══ STAGE ROW ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card title="Your Stage" variant="accent">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ background: `${stage.color}15` }}>{emoji}</div>
              <div>
                <p className="font-bold text-lg" style={{ color: stage.color }}>{stage.label}</p>
                <p className="text-white/35 text-sm">{stage.description}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-white/[0.03]"><p className="text-[10px] text-white/25 mb-0.5">Expected</p><p className="text-sm font-medium text-white/60">{participant.expectedGrip} kg</p></div>
              <div className="p-3 rounded-xl bg-white/[0.03]"><p className="text-[10px] text-white/25 mb-0.5">Performance</p><p className="text-sm font-medium" style={{ color: gripDiff >= 0 ? "#4ade80" : "#f87171" }}>{gripDiff >= 0 ? "+" : ""}{gripDiff.toFixed(1)} kg</p></div>
              <div className="p-3 rounded-xl bg-white/[0.03]"><p className="text-[10px] text-white/25 mb-0.5">Standing</p><p className="text-sm font-medium text-white/60">Top {100 - percentile}%</p></div>
            </div>
          </Card>

          <Card title="Stage Reference">
            <div className="space-y-1.5">
              {([
                { range: "> +10", label: "Elite Vitality" as const },
                { range: "+6 to +10", label: "Peak Fitness" as const },
                { range: "+3 to +5", label: "Above Average" as const },
                { range: "-2 to +2", label: "On Track" as const },
                { range: "-5 to -3", label: "Below Average" as const },
                { range: "-10 to -6", label: "Needs Attention" as const },
                { range: "< -10", label: "Critical Gap" as const },
              ]).map((r) => {
                const info = STAGE_MAP[r.label];
                const cur = r.label === participant.bioStage;
                return (
                  <div key={r.label} className={`flex items-center gap-3 py-1.5 px-3 rounded-lg text-sm ${cur ? "bg-white/5" : ""}`}>
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: info.color }} />
                    <span className="font-mono text-[11px] text-white/25 w-16 flex-shrink-0">{r.range}</span>
                    <span className={`flex-1 ${cur ? "font-semibold" : "text-white/40"}`} style={cur ? { color: info.color } : {}}>{r.label}{cur ? " ← You" : ""}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-white/15 mt-3">Delta = Chronological − Biological Age</p>
          </Card>
        </div>

        {/* ═══ ACTIONS ═══ */}
        <div className={`space-y-3 max-w-lg mx-auto pb-8 ${revealed ? "page-enter" : "opacity-0"}`}>
          <button onClick={handlePDF} className="w-full py-4 px-6 rounded-full font-semibold text-lg transition-all active:scale-[0.98] text-black"
            style={{ background: "linear-gradient(135deg, #e8a03c, #f0a830)", boxShadow: "0 8px 32px rgba(232,160,60,0.25)" }}>
            Download PDF Report
          </button>
          <div className="flex gap-3">
            <button onClick={() => router.push(`/event/${eventId}/leaderboard`)} className="flex-1 py-4 px-6 rounded-full font-semibold text-lg border-2 border-[#d4845a] text-[#d4845a] hover:bg-[#d4845a]/10 transition-all active:scale-[0.98]">
              View Leaderboard
            </button>
            <button onClick={() => router.push(`/event/${eventId}/register`)} className="flex-1 py-4 px-6 rounded-full font-semibold text-lg border-2 border-[#d4845a] text-[#d4845a] hover:bg-[#d4845a]/10 transition-all active:scale-[0.98]">
              Next Player →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ title, children, variant = "dark" }: { title: string; children: React.ReactNode; variant?: "dark" | "accent" }) {
  return (
    <div className={`rounded-2xl p-5 backdrop-blur-sm ${variant === "dark" ? "bg-white/[0.04] border border-white/[0.08]" : "bg-[#d4845a]/8 border border-[#d4845a]/20"}`}>
      <p className={`text-[10px] uppercase tracking-wider font-medium mb-4 ${variant === "dark" ? "text-white/30" : "text-[#d4845a]/60"}`}>{title}</p>
      {children}
    </div>
  );
}
