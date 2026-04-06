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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-[#1a1a3e]/40">Loading...</p></div>}>
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

  if (!participant) return <div className="min-h-screen flex items-center justify-center"><p className="text-[#1a1a3e]/40">Result not found</p></div>;

  const delta = participant.age - participant.biologicalAge;
  const stage = STAGE_MAP[participant.bioStage];
  const norms = getGripNorms(participant.age, participant.gender);
  const percentile = getPercentile(participant.gripAvgKg, participant.age, participant.gender);
  const gripDiff = participant.gripAvgKg - participant.expectedGrip;
  const vitality = Math.round(Math.max(0, Math.min(100, 50 + delta * 3.3)));

  // Arc calculations
  const gripArcRadius = 50;
  const gripArcCirc = Math.PI * gripArcRadius;
  const gripArcPct = Math.min(100, (participant.gripAvgKg / (participant.expectedGrip * 1.5)) * 100);

  const vitalityArcRadius = 46;
  const vitalityArcCirc = 2 * Math.PI * vitalityArcRadius;
  const vitalityPct = vitality / 100;

  return (
    <div className="min-h-screen relative">
      <div className="ambient-bg" />
      <div className="relative z-10 max-w-5xl mx-auto px-4 py-6 space-y-5">

        {/* ═══ GREETING + BIO AGE CARD ═══ */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <button onClick={() => router.push(`/event/${eventId}`)} className="text-[#6b5ce7]/50 hover:text-[#6b5ce7] text-sm mb-3 block transition-colors">← Back to Event</button>
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
              Hello,<br />
              <span className="text-[#1a1a3e] font-black">{participant.name.split(" ")[0].toUpperCase()}</span>
            </h1>
            <p className="text-[#6b6b8a] mt-2">#{rank} of {totalP} participants</p>
          </div>

          {/* Bio Age floating card */}
          <div className="result-card flex items-center gap-4 min-w-[200px]">
            <div className="w-12 h-12 rounded-xl bg-[#f07068]/15 flex items-center justify-center flex-shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f07068" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M5 20c0-4 3-7 7-7s7 3 7 7"/></svg>
            </div>
            <div>
              <p className="text-xs font-bold text-[#6b6b8a] uppercase tracking-wider">Biological Age</p>
              <p className="text-4xl font-black" style={{ color: stage.color }}>{animatedAge}</p>
              <p className="text-xs font-medium" style={{ color: stage.color }}>{stage.label}</p>
            </div>
          </div>
        </div>

        {/* ═══ THREE STAT CARDS ═══ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          {/* Grip Strength — Half arc */}
          <div className="result-card text-center">
            <p className="text-xs font-bold text-[#6b6b8a] uppercase tracking-wider mb-4">Grip Strength</p>
            <div className="relative inline-block mb-2">
              <svg width="140" height="80" viewBox="0 0 140 80">
                <path d="M 15 75 A 55 55 0 0 1 125 75" fill="none" stroke="#e8e0f4" strokeWidth="8" strokeLinecap="round" />
                <path d="M 15 75 A 55 55 0 0 1 125 75" fill="none" stroke="#6b5ce7" strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${gripArcPct * 1.73} 173`} />
              </svg>
              <div className="absolute inset-0 flex items-end justify-center pb-1">
                <span className="text-3xl font-black text-[#6b5ce7]">{participant.gripAvgKg}<span className="text-sm font-normal text-[#6b6b8a] ml-1">kg</span></span>
              </div>
            </div>
            <p className="text-sm text-[#6b6b8a]">
              <span style={{ color: gripDiff >= 0 ? "#22c55e" : "#f07068" }}>{gripDiff >= 0 ? "+" : ""}{gripDiff.toFixed(1)} kg</span> vs expected
            </p>
          </div>

          {/* Vitality Score — Circle */}
          <div className="result-card text-center">
            <p className="text-xs font-bold text-[#6b6b8a] uppercase tracking-wider mb-4">Vitality Score</p>
            <div className="relative inline-block mb-2">
              <svg width="110" height="110" viewBox="0 0 110 110">
                <circle cx="55" cy="55" r={vitalityArcRadius} fill="none" stroke="#f0e8f4" strokeWidth="8" />
                <circle cx="55" cy="55" r={vitalityArcRadius} fill="none" stroke="#f07068" strokeWidth="8"
                  strokeDasharray={`${vitalityPct * vitalityArcCirc} ${vitalityArcCirc}`}
                  strokeLinecap="round" transform="rotate(-90 55 55)" className="meter-animate" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-4xl font-black text-[#f07068]">{vitality}</span>
            </div>
            <p className="text-sm text-[#6b6b8a]">
              {delta > 0 ? `${delta}y younger` : delta < 0 ? `${Math.abs(delta)}y older` : "On track"}
            </p>
          </div>

          {/* Age Comparison */}
          <div className="result-card text-center">
            <p className="text-xs font-bold text-[#6b6b8a] uppercase tracking-wider mb-4">Age Comparison</p>
            {/* Delta circle */}
            <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-xl font-black text-white"
              style={{ backgroundColor: stage.color }}>
              {delta > 0 ? `+${delta}` : delta}
            </div>
            {/* Actual vs Bio */}
            <div className="flex items-center justify-center gap-6 mb-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-[#1a1a3e]">{participant.age}</p>
                <p className="text-xs text-[#6b6b8a]">Actual</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: stage.color }}>{participant.biologicalAge}</p>
                <p className="text-xs text-[#6b6b8a]">Bio age</p>
              </div>
            </div>
            {/* Mini bar chart */}
            <div className="flex items-end justify-center gap-1 h-8">
              {Array.from({ length: 7 }, (_, i) => {
                const h = 8 + i * 4;
                const isLast = i === 6;
                return <div key={i} className="w-3 rounded-sm" style={{ height: `${h}px`, backgroundColor: isLast ? stage.color : "#d8d0e8" }} />;
              })}
              <span className="text-[10px] text-[#6b6b8a] ml-1 self-end">{participant.biologicalAge}</span>
            </div>
          </div>
        </div>

        {/* ═══ GRIP DETAILS + PERCENTILE ═══ */}
        <div className="result-card">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            <div className="flex-1">
              <p className="text-xs font-bold text-[#6b6b8a] uppercase tracking-wider mb-4">Grip Details</p>
              {/* Your grip bar */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-sm text-[#6b6b8a] w-20 text-right">Your (kg)</span>
                <div className="flex-1 relative h-3 rounded-full bg-[#e8e0f4]">
                  <div className="h-full rounded-full" style={{
                    width: `${Math.min(100, (participant.gripAvgKg / (norms.high * 1.2)) * 100)}%`,
                    background: gripDiff >= 0 ? "linear-gradient(90deg, #6b5ce7, #8b7cf0)" : "linear-gradient(90deg, #f07068, #f09088)"
                  }} />
                  <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 shadow-sm" style={{
                    left: `${Math.min(96, (participant.gripAvgKg / (norms.high * 1.2)) * 100)}%`,
                    borderColor: gripDiff >= 0 ? "#6b5ce7" : "#f07068"
                  }} />
                </div>
              </div>
              {/* Expected bar */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#6b6b8a] w-20 text-right">Expected</span>
                <div className="flex-1 relative h-3 rounded-full bg-[#e8e0f4]">
                  <div className="h-full rounded-full bg-[#a8b8d8]" style={{
                    width: `${Math.min(100, (participant.expectedGrip / (norms.high * 1.2)) * 100)}%`,
                  }} />
                  <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-[#7888a8] shadow-sm" style={{
                    left: `${Math.min(96, (participant.expectedGrip / (norms.high * 1.2)) * 100)}%`,
                  }} />
                </div>
              </div>
            </div>

            {/* Percentile badge */}
            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-[#1a1a3e] text-white min-w-fit">
              <span className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-black" style={{ backgroundColor: stage.color }}>P{percentile}</span>
              <p className="text-sm">Stronger than <span className="font-bold" style={{ color: stage.color }}>{percentile}%</span> of {participant.gender === "male" ? "men" : "women"} aged {ageGroupLabel(participant.age)}</p>
            </div>
          </div>
        </div>

        {/* ═══ HAND DETAILS ═══ */}
        {(participant.gripLeftKg !== null || participant.gripRightKg !== null) && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {participant.gripLeftKg !== null && (
              <div className="result-card">
                <p className="text-xs font-bold text-[#6b6b8a] uppercase tracking-wider mb-3">Left Hand</p>
                <p className="text-4xl font-black text-[#6b5ce7]">{participant.gripLeftKg}<span className="text-sm font-normal text-[#6b6b8a] ml-1">kg</span></p>
                <div className="mt-3 relative h-2 rounded-full bg-[#e8e0f4]">
                  <div className="h-full rounded-full bg-[#6b5ce7]/40" style={{ width: `${Math.min(100, (participant.gripLeftKg / (norms.high * 1.2)) * 100)}%` }} />
                  <div className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white border-2 border-[#6b5ce7] shadow-sm" style={{
                    left: `${Math.min(96, (participant.gripLeftKg / (norms.high * 1.2)) * 100)}%`
                  }} />
                </div>
              </div>
            )}
            {participant.gripRightKg !== null && (
              <div className="result-card">
                <p className="text-xs font-bold text-[#6b6b8a] uppercase tracking-wider mb-3">Right Hand</p>
                <p className="text-4xl font-black text-[#6b5ce7]">{participant.gripRightKg}<span className="text-sm font-normal text-[#6b6b8a] ml-1">kg</span></p>
                <div className="mt-3 relative h-2 rounded-full bg-[#e8e0f4]">
                  <div className="h-full rounded-full bg-[#6b5ce7]/40" style={{ width: `${Math.min(100, (participant.gripRightKg / (norms.high * 1.2)) * 100)}%` }} />
                  <div className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white border-2 border-[#6b5ce7] shadow-sm" style={{
                    left: `${Math.min(96, (participant.gripRightKg / (norms.high * 1.2)) * 100)}%`
                  }} />
                </div>
              </div>
            )}
            {participant.gripLeftKg !== null && participant.gripRightKg !== null && (() => {
              const diff = Math.abs(participant.gripLeftKg - participant.gripRightKg);
              const ok = diff <= 2;
              return (
                <div className="result-card">
                  <p className="text-xs font-bold text-[#6b6b8a] uppercase tracking-wider mb-3">Hand Balance</p>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-center flex-1">
                      <p className="text-2xl font-black text-[#6b5ce7]">{participant.gripLeftKg}<span className="text-xs font-normal text-[#6b6b8a] ml-0.5">kg</span></p>
                      <p className="text-xs text-[#6b6b8a]">Left</p>
                    </div>
                    <div className="text-center px-3">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${ok ? "bg-[#22c55e]/15 text-[#22c55e]" : "bg-[#f59e0b]/15 text-[#f59e0b]"}`}>{diff.toFixed(1)} kg diff</span>
                    </div>
                    <div className="text-center flex-1">
                      <p className="text-2xl font-black text-[#6b5ce7]">{participant.gripRightKg}<span className="text-xs font-normal text-[#6b6b8a] ml-0.5">kg</span></p>
                      <p className="text-xs text-[#6b6b8a]">Right</p>
                    </div>
                  </div>
                  <p className="text-sm text-[#6b6b8a] text-center">{ok ? "Well balanced" : `${diff.toFixed(1)} kg imbalance`}</p>
                </div>
              );
            })()}
          </div>
        )}

        {/* ═══ ACTIONS ═══ */}
        <div className={`flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto pb-8 ${revealed ? "page-enter" : "opacity-0"}`}>
          <button onClick={handlePDF} className="btn-primary flex-1 py-4 px-6 rounded-2xl font-semibold text-lg transition-all active:scale-[0.98]">
            Download PDF Report
          </button>
          <button onClick={() => router.push(`/event/${eventId}/leaderboard`)} className="flex-1 py-4 px-6 bg-white/60 border border-white/80 rounded-2xl font-semibold text-lg text-[#1a1a3e]/70 hover:bg-white/80 transition-all active:scale-[0.98] shadow-sm">
            View Leaderboard
          </button>
          <button onClick={() => router.push(`/event/${eventId}/register`)} className="py-4 px-6 bg-white/40 border border-white/60 rounded-2xl font-semibold text-[#6b6b8a] hover:text-[#1a1a3e] transition-all active:scale-[0.98]">
            Next Player →
          </button>
        </div>
      </div>
    </div>
  );
}
