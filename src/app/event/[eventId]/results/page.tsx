"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getParticipant, getParticipants } from "@/lib/store";
import { STAGE_MAP } from "@/lib/formula";
import { generateResultPDF } from "@/lib/pdf";
import type { Participant, BioStage, Gender } from "@/lib/types";

const STAGE_EMOJI: Record<BioStage, string> = {
  "Elite Vitality": "👑",
  "Peak Fitness": "🔥",
  "Above Average": "💪",
  "On Track": "✅",
  "Below Average": "⚡",
  "Needs Attention": "🎯",
  "Critical Gap": "🏋️",
};

function getGripNorms(age: number, gender: Gender) {
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
  const zScore = (gripKg - norms.avg) / ((norms.high - norms.low) / 3);
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]"><p className="text-white/40">Loading results...</p></div>}>
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
  const [totalParticipants, setTotalParticipants] = useState(0);

  useEffect(() => {
    (async () => {
      const p = await getParticipant(pid);
      if (!p) return;
      setParticipant(p);

      // Save to localStorage for re-viewing
      try {
        localStorage.setItem(`gripage_result_${eventId}`, JSON.stringify({ pid: p.id, name: p.name }));
      } catch {}

      // Animate bio age
      setTimeout(() => {
        const target = p.biologicalAge;
        const start = p.age;
        const duration = 1200;
        const startTime = Date.now();
        const frame = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setAnimatedAge(Math.round(start + (target - start) * eased));
          if (progress < 1) requestAnimationFrame(frame);
          else setRevealed(true);
        };
        requestAnimationFrame(frame);
      }, 500);

      // Rankings
      const all = await getParticipants(eventId);
      setTotalParticipants(all.length);
      const sorted = [...all].sort((a, b) => a.biologicalAge - b.biologicalAge);
      setRank(sorted.findIndex((x) => x.id === p.id) + 1);
    })();
  }, [pid, eventId]);

  const handleDownloadPDF = useCallback(() => {
    if (participant) generateResultPDF(participant);
  }, [participant]);

  if (!participant) {
    return <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]"><p className="text-white/40">Result not found</p></div>;
  }

  const delta = participant.age - participant.biologicalAge;
  const stage = STAGE_MAP[participant.bioStage];
  const emoji = STAGE_EMOJI[participant.bioStage];
  const norms = getGripNorms(participant.age, participant.gender);
  const percentile = getGripPercentile(participant.gripAvgKg, participant.age, participant.gender);
  const gripDiff = participant.gripAvgKg - participant.expectedGrip;
  const vitalityScore = Math.round(Math.max(0, Math.min(100, 50 + delta * 3.3)));

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">

        {/* ═══ TOP BAR ═══ */}
        <div className="flex items-center justify-between">
          <button onClick={() => router.push(`/event/${eventId}`)} className="text-white/40 hover:text-white text-sm transition-colors">
            ← Back to Event
          </button>
          <div className="flex items-center gap-2 text-sm text-white/30">
            <span>#{rank} of {totalParticipants}</span>
          </div>
        </div>

        {/* ═══ HERO: BIO AGE ═══ */}
        <div className="rounded-3xl p-6 sm:p-8 text-center" style={{ background: `linear-gradient(145deg, ${stage.color}15, ${stage.color}08, #0a0a0a)`, border: `1px solid ${stage.color}20` }}>
          <p className="text-white/40 text-sm tracking-widest uppercase mb-1">Results for</p>
          <h1 className="text-2xl sm:text-3xl font-bold mb-6">{participant.name}</h1>

          {/* Bio age number */}
          <div className="mb-4">
            <span className="text-[80px] sm:text-[100px] font-black leading-none" style={{ color: stage.color }}>
              {animatedAge}
            </span>
          </div>
          <p className="text-white/50 text-sm mb-4">Biological Age</p>

          {/* Stage badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold mb-3" style={{ color: stage.color, background: `${stage.color}18`, border: `1px solid ${stage.color}30` }}>
            <span>{emoji}</span>
            {stage.label}
          </div>

          {/* Delta */}
          <p className="text-base text-white/70">
            {delta > 0 ? (
              <><span className="font-bold" style={{ color: stage.color }}>{Math.abs(delta)} years younger</span> biologically</>
            ) : delta < 0 ? (
              <><span className="font-bold" style={{ color: stage.color }}>{Math.abs(delta)} years older</span> biologically</>
            ) : (
              <>Right on track for your age</>
            )}
          </p>
        </div>

        {/* ═══ ROW 1: AGE COMPARISON + GRIP STRENGTH ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Card: Age Comparison */}
          <Card title="Age Comparison">
            <div className="grid grid-cols-3 gap-4 text-center mb-6">
              <div>
                <p className="text-3xl font-bold text-white/70">{participant.age}</p>
                <p className="text-xs text-white/30 mt-1">Actual Age</p>
              </div>
              <div>
                <p className="text-2xl font-black px-3 py-1 rounded-xl inline-block" style={{ color: stage.color, background: `${stage.color}15` }}>
                  {delta > 0 ? `−${delta}` : delta < 0 ? `+${Math.abs(delta)}` : "="}
                </p>
                <p className="text-xs text-white/30 mt-1">Delta</p>
              </div>
              <div>
                <p className="text-3xl font-bold" style={{ color: stage.color }}>{participant.biologicalAge}</p>
                <p className="text-xs text-white/30 mt-1">Bio Age</p>
              </div>
            </div>

            {/* Gauge */}
            <div className="mb-2">
              <div className="flex justify-between text-[10px] text-white/25 mb-1.5">
                <span>Older</span>
                <span>Your Age</span>
                <span>Younger</span>
              </div>
              <div className="relative h-3 rounded-full bg-white/5">
                <div className="absolute inset-0 rounded-full" style={{ background: "linear-gradient(to right, #ef444450, #f59e0b50, #4ade8050)" }} />
                <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/30" />
                {/* Bio age marker */}
                {(() => {
                  const gaugeMin = participant.age - 15;
                  const gaugeMax = participant.age + 15;
                  const pos = Math.min(100, Math.max(0, ((gaugeMax - participant.biologicalAge) / (gaugeMax - gaugeMin)) * 100));
                  return (
                    <div className="absolute top-1/2 -translate-y-1/2" style={{ left: `${pos}%` }}>
                      <div className="w-4 h-4 rounded-full border-2 border-white -ml-2" style={{ backgroundColor: stage.color }} />
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Vitality score */}
            <div className="mt-5 pt-4 border-t border-white/5">
              <div className="flex justify-between text-xs text-white/40 mb-1.5">
                <span>Vitality Score</span>
                <span className="font-medium" style={{ color: stage.color }}>{vitalityScore}/100</span>
              </div>
              <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${Math.max(5, vitalityScore)}%`, background: `linear-gradient(90deg, ${stage.color}80, ${stage.color})` }} />
              </div>
            </div>
          </Card>

          {/* Card: Grip Strength */}
          <Card title="Grip Strength">
            <div className="grid grid-cols-3 gap-4 text-center mb-5">
              <div>
                <p className="text-3xl font-black" style={{ color: stage.color }}>{participant.gripAvgKg}</p>
                <p className="text-xs text-white/30 mt-1">Your Grip (kg)</p>
              </div>
              <div>
                <p className="text-sm font-medium px-2 py-1 rounded-full inline-block" style={{ color: gripDiff >= 0 ? "#4ade80" : "#f87171", background: gripDiff >= 0 ? "rgba(74,222,128,0.12)" : "rgba(248,113,113,0.12)" }}>
                  {gripDiff >= 0 ? "+" : ""}{gripDiff.toFixed(1)}
                </p>
                <p className="text-xs text-white/30 mt-1">vs expected</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-white/40">{participant.expectedGrip}</p>
                <p className="text-xs text-white/30 mt-1">Expected (kg)</p>
              </div>
            </div>

            {/* Range bar */}
            <div className="mb-4">
              <div className="flex justify-between text-[10px] text-white/25 mb-1">
                <span>{norms.low} kg</span>
                <span>{norms.avg} avg</span>
                <span>{norms.high} kg</span>
              </div>
              <div className="relative h-3 rounded-full bg-white/5">
                <div className="absolute inset-0 rounded-full" style={{ background: "linear-gradient(to right, #ef444430, #f59e0b30, #4ade8030)" }} />
                <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-white -ml-[7px]" style={{
                  left: `${Math.min(98, Math.max(2, ((participant.gripAvgKg - norms.low) / (norms.high - norms.low)) * 100))}%`,
                  backgroundColor: stage.color,
                }} />
              </div>
            </div>

            {/* Percentile */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/3">
              <div className="w-11 h-11 rounded-lg flex items-center justify-center text-sm font-black" style={{ background: `${stage.color}18`, color: stage.color }}>
                P{percentile}
              </div>
              <div>
                <p className="text-sm text-white/70">
                  Stronger than <span className="font-semibold" style={{ color: stage.color }}>{percentile}%</span> of {participant.gender === "male" ? "men" : "women"} aged {getAgeGroupLabel(participant.age)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* ═══ ROW 2: HAND DETAILS (if both recorded) ═══ */}
        {(participant.gripLeftKg !== null || participant.gripRightKg !== null) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {participant.gripLeftKg !== null && (
              <Card title="Left Hand">
                <div className="flex items-baseline gap-2 mb-3">
                  <p className="text-3xl font-black" style={{ color: stage.color }}>{participant.gripLeftKg}</p>
                  <span className="text-sm text-white/30">kg</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full" style={{
                    width: `${Math.min(100, (participant.gripLeftKg / (participant.expectedGrip * 1.3)) * 100)}%`,
                    backgroundColor: participant.gripLeftKg >= participant.expectedGrip ? "#4ade80" : "#f87171",
                  }} />
                </div>
                <p className="text-xs text-white/30 mt-2">
                  {participant.gripLeftKg >= participant.expectedGrip ? "Above" : "Below"} expected ({participant.expectedGrip} kg)
                </p>
              </Card>
            )}
            {participant.gripRightKg !== null && (
              <Card title="Right Hand">
                <div className="flex items-baseline gap-2 mb-3">
                  <p className="text-3xl font-black" style={{ color: stage.color }}>{participant.gripRightKg}</p>
                  <span className="text-sm text-white/30">kg</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full" style={{
                    width: `${Math.min(100, (participant.gripRightKg / (participant.expectedGrip * 1.3)) * 100)}%`,
                    backgroundColor: participant.gripRightKg >= participant.expectedGrip ? "#4ade80" : "#f87171",
                  }} />
                </div>
                <p className="text-xs text-white/30 mt-2">
                  {participant.gripRightKg >= participant.expectedGrip ? "Above" : "Below"} expected ({participant.expectedGrip} kg)
                </p>
              </Card>
            )}
            {participant.gripLeftKg !== null && participant.gripRightKg !== null && (
              <Card title="Hand Balance">
                {(() => {
                  const diff = Math.abs(participant.gripLeftKg - participant.gripRightKg);
                  const balanced = diff <= 2;
                  return (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-center flex-1">
                          <p className="text-2xl font-bold text-white/60">{participant.gripLeftKg}</p>
                          <p className="text-xs text-white/25">Left</p>
                        </div>
                        <div className="text-center px-3">
                          <p className="text-lg font-bold" style={{ color: balanced ? "#4ade80" : "#f59e0b" }}>{diff.toFixed(1)} kg</p>
                          <p className="text-[10px] text-white/25">diff</p>
                        </div>
                        <div className="text-center flex-1">
                          <p className="text-2xl font-bold text-white/60">{participant.gripRightKg}</p>
                          <p className="text-xs text-white/25">Right</p>
                        </div>
                      </div>
                      <p className="text-xs text-white/40">
                        {balanced ? "Well balanced grip strength" : `Some imbalance — ${diff.toFixed(1)} kg difference`}
                      </p>
                    </>
                  );
                })()}
              </Card>
            )}
          </div>
        )}

        {/* ═══ ROW 3: STAGE + METRICS ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Card: Your Stage */}
          <Card title="Your Stage">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ background: `${stage.color}15` }}>
                {emoji}
              </div>
              <div>
                <p className="font-bold text-lg" style={{ color: stage.color }}>{stage.label}</p>
                <p className="text-white/40 text-sm">{stage.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-white/3">
                <p className="text-xs text-white/30 mb-1">Expected grip</p>
                <p className="text-sm font-medium text-white/70">{participant.expectedGrip} kg</p>
              </div>
              <div className="p-3 rounded-xl bg-white/3">
                <p className="text-xs text-white/30 mb-1">Performance</p>
                <p className="text-sm font-medium" style={{ color: gripDiff >= 0 ? "#4ade80" : "#f87171" }}>
                  {gripDiff >= 0 ? "+" : ""}{gripDiff.toFixed(1)} kg
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/3">
                <p className="text-xs text-white/30 mb-1">Standing</p>
                <p className="text-sm font-medium text-white/70">Top {100 - percentile}%</p>
              </div>
            </div>
          </Card>

          {/* Card: Bio Stage Reference */}
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
              ]).map((row) => {
                const info = STAGE_MAP[row.label];
                const isCurrent = row.label === participant.bioStage;
                return (
                  <div key={row.label} className={`flex items-center gap-3 py-1.5 px-3 rounded-lg text-sm ${isCurrent ? "bg-white/5" : ""}`}>
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: info.color }} />
                    <span className="font-mono text-[11px] text-white/30 w-16 flex-shrink-0">{row.range}</span>
                    <span className={`flex-1 ${isCurrent ? "font-semibold" : "text-white/50"}`} style={isCurrent ? { color: info.color } : {}}>
                      {row.label}{isCurrent ? " ← You" : ""}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-white/20 mt-3">Delta = Chronological Age − Biological Age</p>
          </Card>
        </div>

        {/* ═══ ACTION BUTTONS ═══ */}
        <div className={`space-y-3 max-w-lg mx-auto pb-8 ${revealed ? "page-enter" : "opacity-0"}`}>
          <button
            onClick={handleDownloadPDF}
            className="w-full py-4 px-6 rounded-2xl font-semibold text-lg transition-all active:scale-[0.98]"
            style={{ background: `linear-gradient(135deg, ${stage.color}, ${stage.color}cc)`, color: "#000", boxShadow: `0 8px 32px ${stage.color}30` }}
          >
            Download PDF Report
          </button>
          <button
            onClick={() => router.push(`/event/${eventId}/leaderboard`)}
            className="w-full py-4 px-6 bg-white/5 border border-white/10 rounded-2xl font-semibold text-lg text-white/80 hover:bg-white/8 transition-all active:scale-[0.98]"
          >
            View Leaderboard
          </button>
          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/event/${eventId}/register`)}
              className="flex-1 py-4 px-6 bg-white/5 border border-white/10 rounded-2xl font-semibold text-base text-white/60 hover:text-white/80 transition-all active:scale-[0.98]"
            >
              Next Player →
            </button>
            <button
              onClick={() => router.push(`/event/${eventId}`)}
              className="py-4 px-6 rounded-2xl text-white/30 hover:text-white/60 transition-colors text-sm"
            >
              Event Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Reusable Card Component ─── */
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
      <p className="text-[11px] text-white/30 uppercase tracking-wider font-medium mb-4">{title}</p>
      {children}
    </div>
  );
}
