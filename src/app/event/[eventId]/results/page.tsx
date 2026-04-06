"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getParticipant, getParticipants } from "@/lib/store";
import { STAGE_MAP } from "@/lib/formula";
import { generateResultPDF } from "@/lib/pdf";
import type { Participant, BioStage, Gender } from "@/lib/types";

const EMOJI: Record<BioStage, string> = {
  "Elite Vitality": "👑", "Peak Fitness": "🔥", "Above Average": "💪",
  "On Track": "✅", "Below Average": "⚡", "Needs Attention": "🎯", "Critical Gap": "🏋️",
};

function norms(age: number, gender: Gender) {
  const t: Record<string, [number, number, number]> = gender === "male"
    ? { "17-29": [35, 45, 55], "30-39": [33, 43, 53], "40-49": [30, 40, 50], "50-59": [26, 36, 46], "60-69": [22, 32, 42], "70+": [18, 27, 37] }
    : { "17-29": [20, 28, 36], "30-39": [19, 27, 35], "40-49": [18, 25, 33], "50-59": [15, 22, 30], "60-69": [13, 19, 26], "70+": [10, 16, 22] };
  let g = "17-29";
  if (age >= 70) g = "70+"; else if (age >= 60) g = "60-69"; else if (age >= 50) g = "50-59"; else if (age >= 40) g = "40-49"; else if (age >= 30) g = "30-39";
  const [low, avg, high] = t[g];
  return { low, avg, high, group: g };
}

function pctl(grip: number, age: number, gender: Gender): number {
  const n = norms(age, gender);
  const z = (grip - n.avg) / ((n.high - n.low) / 3);
  return Math.round(Math.min(99, Math.max(1, 100 / (1 + Math.exp(-1.7 * z)))));
}

// Single accent color for this page — use the stage color only for key highlights
const C = { card: "bg-white/[0.03] border border-white/[0.06]", accent: "#d4845a", dim: "text-white/30", muted: "text-white/45" };

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#080e1a]"><p className="text-white/30 text-sm">Loading...</p></div>}>
      <Content />
    </Suspense>
  );
}

function Content() {
  const { eventId } = useParams() as { eventId: string };
  const router = useRouter();
  const pid = useSearchParams().get("pid") || "";

  const [p, setP] = useState<Participant | null>(null);
  const [bioAge, setBioAge] = useState(0);
  const [ready, setReady] = useState(false);
  const [rank, setRank] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    (async () => {
      const part = await getParticipant(pid);
      if (!part) return;
      setP(part);
      setTimeout(() => {
        const target = part.biologicalAge, start = part.age, dur = 1000, t0 = Date.now();
        const tick = () => {
          const prog = Math.min((Date.now() - t0) / dur, 1);
          setBioAge(Math.round(start + (target - start) * (1 - Math.pow(1 - prog, 3))));
          if (prog < 1) requestAnimationFrame(tick); else setReady(true);
        };
        requestAnimationFrame(tick);
      }, 200);
      const all = await getParticipants(eventId);
      setTotal(all.length);
      setRank([...all].sort((a, b) => a.biologicalAge - b.biologicalAge).findIndex(x => x.id === part.id) + 1);
    })();
  }, [pid, eventId]);

  const pdf = useCallback(() => { if (p) generateResultPDF(p); }, [p]);

  if (!p) return <div className="min-h-screen flex items-center justify-center bg-[#080e1a]"><p className="text-white/30 text-sm">Result not found</p></div>;

  const delta = p.age - p.biologicalAge;
  const stage = STAGE_MAP[p.bioStage];
  const emoji = EMOJI[p.bioStage];
  const n = norms(p.age, p.gender);
  const percentile = pctl(p.gripAvgKg, p.age, p.gender);
  const gDiff = p.gripAvgKg - p.expectedGrip;
  const gaugePos = Math.min(100, Math.max(0, ((p.age + 15 - p.biologicalAge) / 30) * 100));
  const gripPos = Math.min(98, Math.max(2, ((p.gripAvgKg - n.low) / (n.high - n.low)) * 100));

  return (
    <div className="min-h-screen bg-[#080e1a]">
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">

        {/* Header */}
        <div className="mb-6">
          <button onClick={() => router.push(`/event/${eventId}`)} aria-label="Back" className="text-white/25 hover:text-white/50 text-xs mb-3 inline-flex items-center gap-1 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5m7-7l-7 7 7 7"/></svg>
            Back to Event
          </button>
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Hello, <span className="text-[#d4845a]">{p.name.split(" ")[0]}</span>
              </h1>
              <p className="text-white/30 text-sm mt-0.5">Here are your GripAge results</p>
            </div>
            <span className="text-xs text-white/20 bg-white/[0.04] border border-white/[0.06] px-2.5 py-1 rounded-lg">#{rank} of {total}</span>
          </div>
        </div>

        {/* Hero stats — 2 cols */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className={`rounded-2xl p-5 text-center ${C.card}`}>
            <p className="text-[10px] text-white/25 uppercase tracking-[0.15em] mb-2">Biological Age</p>
            <p className="text-5xl sm:text-6xl font-black leading-none text-[#d4845a]">{bioAge}</p>
            <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold text-[#d4845a] bg-[#d4845a]/10">
              {emoji} {stage.label}
            </div>
            <p className="text-xs text-white/35 mt-1.5">
              {delta > 0 ? `${delta}y younger` : delta < 0 ? `${Math.abs(delta)}y older` : "On track"} biologically
            </p>
          </div>
          <div className="rounded-2xl p-5 text-center bg-[#d4845a]/[0.06] border border-[#d4845a]/15">
            <p className="text-[10px] text-[#d4845a]/40 uppercase tracking-[0.15em] mb-2">Grip Strength</p>
            <p className="text-5xl sm:text-6xl font-black leading-none text-[#d4845a]">{p.gripAvgKg}</p>
            <p className="text-xs text-white/25 mt-1">kg average</p>
            <p className="text-xs mt-1.5" style={{ color: gDiff >= 0 ? "#6ee7a0" : "#f87171" }}>
              {gDiff >= 0 ? "+" : ""}{gDiff.toFixed(1)} kg vs expected
            </p>
          </div>
        </div>

        {/* Detail cards — 2 cols */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          {/* Age Comparison */}
          <div className={`rounded-2xl p-4 ${C.card}`}>
            <p className="text-[10px] text-white/25 uppercase tracking-[0.15em] mb-3">Age Comparison</p>
            <div className="grid grid-cols-3 text-center mb-4">
              <div><p className="text-2xl font-bold text-white/55">{p.age}</p><p className="text-[10px] text-white/20">Actual</p></div>
              <div><span className="text-lg font-black px-2 py-0.5 rounded-lg inline-block text-[#d4845a] bg-[#d4845a]/10">{delta > 0 ? `−${delta}` : delta < 0 ? `+${Math.abs(delta)}` : "="}</span><p className="text-[10px] text-white/20 mt-0.5">Delta</p></div>
              <div><p className="text-2xl font-bold text-[#d4845a]">{p.biologicalAge}</p><p className="text-[10px] text-white/20">Bio Age</p></div>
            </div>
            <div className="flex justify-between text-[9px] text-white/15 mb-1"><span>Older</span><span>Your Age</span><span>Younger</span></div>
            <div className="relative h-2 rounded-full bg-white/[0.04]">
              <div className="absolute inset-0 rounded-full" style={{ background: "linear-gradient(to right, #d4845a30, #d4845a15, #6ee7a030)" }} />
              <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/10" />
              <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white/80 -ml-1.5 shadow" style={{ left: `${gaugePos}%`, backgroundColor: "#d4845a" }} />
            </div>
          </div>

          {/* Grip Details */}
          <div className="rounded-2xl p-4 bg-[#d4845a]/[0.04] border border-[#d4845a]/10">
            <p className="text-[10px] text-[#d4845a]/35 uppercase tracking-[0.15em] mb-3">Grip Details</p>
            <div className="grid grid-cols-3 text-center mb-4">
              <div><p className="text-2xl font-black text-[#d4845a]">{p.gripAvgKg}</p><p className="text-[10px] text-white/20">Your (kg)</p></div>
              <div><span className="text-sm font-bold px-2 py-0.5 rounded-lg inline-block" style={{ color: gDiff >= 0 ? "#6ee7a0" : "#f87171", background: gDiff >= 0 ? "rgba(110,231,160,0.08)" : "rgba(248,113,113,0.08)" }}>{gDiff >= 0 ? "+" : ""}{gDiff.toFixed(1)}</span><p className="text-[10px] text-white/20 mt-0.5">vs expected</p></div>
              <div><p className="text-2xl font-bold text-white/25">{p.expectedGrip}</p><p className="text-[10px] text-white/20">Expected</p></div>
            </div>
            <div className="flex justify-between text-[9px] text-white/15 mb-1"><span>{n.low}kg</span><span>{n.avg} avg</span><span>{n.high}kg</span></div>
            <div className="relative h-2 rounded-full bg-white/[0.04]">
              <div className="absolute inset-0 rounded-full" style={{ background: "linear-gradient(to right, #d4845a20, #d4845a10, #6ee7a020)" }} />
              <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white/80 -ml-1.5 shadow" style={{ left: `${gripPos}%`, backgroundColor: "#d4845a" }} />
            </div>
            <div className="flex items-center gap-2 mt-3 p-2 rounded-lg bg-white/[0.03]">
              <span className="text-[10px] font-black text-[#d4845a] bg-[#d4845a]/10 px-1.5 py-0.5 rounded">P{percentile}</span>
              <p className="text-xs text-white/40">Stronger than <span className="text-white/60 font-medium">{percentile}%</span> of {p.gender === "male" ? "men" : "women"} aged {n.group}</p>
            </div>
          </div>
        </div>

        {/* Hands row */}
        {(p.gripLeftKg !== null || p.gripRightKg !== null) && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
            {p.gripLeftKg !== null && <HandCard label="Left Hand" grip={p.gripLeftKg} expected={p.expectedGrip} />}
            {p.gripRightKg !== null && <HandCard label="Right Hand" grip={p.gripRightKg} expected={p.expectedGrip} />}
            {p.gripLeftKg !== null && p.gripRightKg !== null && (() => {
              const diff = Math.abs(p.gripLeftKg - p.gripRightKg);
              return (
                <div className={`rounded-2xl p-4 col-span-2 sm:col-span-1 ${C.card}`}>
                  <p className="text-[10px] text-white/25 uppercase tracking-[0.15em] mb-3">Hand Balance</p>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-center flex-1"><p className="text-xl font-bold text-white/40">{p.gripLeftKg}</p><p className="text-[9px] text-white/15">Left</p></div>
                    <div className="text-center px-2"><p className="text-base font-black" style={{ color: diff <= 2 ? "#6ee7a0" : "#d4845a" }}>{diff.toFixed(1)}</p><p className="text-[9px] text-white/15">kg diff</p></div>
                    <div className="text-center flex-1"><p className="text-xl font-bold text-white/40">{p.gripRightKg}</p><p className="text-[9px] text-white/15">Right</p></div>
                  </div>
                  <p className="text-[10px] text-white/25 text-center bg-white/[0.02] rounded-lg py-1.5">{diff <= 2 ? "Well balanced grip strength" : `${diff.toFixed(1)} kg imbalance`}</p>
                </div>
              );
            })()}
          </div>
        )}

        {/* Stage row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <div className="rounded-2xl p-4 bg-[#d4845a]/[0.04] border border-[#d4845a]/10">
            <p className="text-[10px] text-[#d4845a]/35 uppercase tracking-[0.15em] mb-3">Your Stage</p>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-[#d4845a]/10">{emoji}</div>
              <div><p className="font-bold text-[#d4845a]">{stage.label}</p><p className="text-xs text-white/30">{stage.description}</p></div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 rounded-lg bg-white/[0.03]"><p className="text-[9px] text-white/20">Expected</p><p className="text-xs font-medium text-white/50">{p.expectedGrip} kg</p></div>
              <div className="p-2 rounded-lg bg-white/[0.03]"><p className="text-[9px] text-white/20">Perform.</p><p className="text-xs font-medium" style={{ color: gDiff >= 0 ? "#6ee7a0" : "#f87171" }}>{gDiff >= 0 ? "+" : ""}{gDiff.toFixed(1)} kg</p></div>
              <div className="p-2 rounded-lg bg-white/[0.03]"><p className="text-[9px] text-white/20">Standing</p><p className="text-xs font-medium text-white/50">Top {100 - percentile}%</p></div>
            </div>
          </div>

          <div className={`rounded-2xl p-4 ${C.card}`}>
            <p className="text-[10px] text-white/25 uppercase tracking-[0.15em] mb-3">Stage Reference</p>
            <div className="space-y-0.5">
              {([
                { r: "> +10", l: "Elite Vitality" as const }, { r: "+6 to +10", l: "Peak Fitness" as const },
                { r: "+3 to +5", l: "Above Average" as const }, { r: "−2 to +2", l: "On Track" as const },
                { r: "−5 to −3", l: "Below Average" as const }, { r: "−10 to −6", l: "Needs Attention" as const },
                { r: "< −10", l: "Critical Gap" as const },
              ]).map(s => {
                const info = STAGE_MAP[s.l]; const cur = s.l === p.bioStage;
                return (
                  <div key={s.l} className={`flex items-center gap-2 py-1 px-2 rounded text-xs ${cur ? "bg-white/[0.04]" : ""}`}>
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: info.color }} />
                    <span className="font-mono text-[10px] text-white/15 w-16 shrink-0">{s.r}</span>
                    <span className={cur ? "font-semibold" : "text-white/30"} style={cur ? { color: info.color } : {}}>{s.l}{cur ? " ← You" : ""}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className={`space-y-2 ${ready ? "page-enter" : "opacity-0"}`}>
          <button onClick={pdf} className="btn-primary w-full py-3.5 rounded-2xl font-bold text-sm">Download PDF Report</button>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => router.push(`/event/${eventId}/leaderboard`)} className="py-3 rounded-2xl text-sm font-medium border border-[#d4845a]/30 text-[#d4845a] hover:bg-[#d4845a]/5 transition-all">Leaderboard</button>
            <button onClick={() => router.push(`/event/${eventId}/register`)} className="py-3 rounded-2xl text-sm font-medium border border-white/[0.08] text-white/50 hover:bg-white/[0.03] transition-all">Next Player →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function HandCard({ label, grip, expected }: { label: string; grip: number; expected: number }) {
  const above = grip >= expected;
  return (
    <div className={`rounded-2xl p-4 ${C.card}`}>
      <p className="text-[10px] text-white/25 uppercase tracking-[0.15em] mb-2">{label}</p>
      <div className="flex items-baseline gap-1.5 mb-2">
        <p className="text-2xl font-black text-[#d4845a]">{grip}</p>
        <span className="text-xs text-white/20">kg</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden mb-1.5">
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, (grip / (expected * 1.3)) * 100)}%`, backgroundColor: above ? "#6ee7a0" : "#f87171" }} />
      </div>
      <p className="text-[10px] text-white/25"><span style={{ color: above ? "#6ee7a0" : "#f87171" }}>{above ? "Above" : "Below"}</span> expected ({expected} kg)</p>
    </div>
  );
}
