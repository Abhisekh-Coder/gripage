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

function gripNorms(age: number, gender: Gender) {
  const m: Record<string, [number, number, number]> = {
    "17-29": [35, 45, 55], "30-39": [33, 43, 53], "40-49": [30, 40, 50],
    "50-59": [26, 36, 46], "60-69": [22, 32, 42], "70+": [18, 27, 37],
  };
  const f: Record<string, [number, number, number]> = {
    "17-29": [20, 28, 36], "30-39": [19, 27, 35], "40-49": [18, 25, 33],
    "50-59": [15, 22, 30], "60-69": [13, 19, 26], "70+": [10, 16, 22],
  };
  const tbl = gender === "male" ? m : f;
  let g = "17-29";
  if (age >= 70) g = "70+"; else if (age >= 60) g = "60-69"; else if (age >= 50) g = "50-59";
  else if (age >= 40) g = "40-49"; else if (age >= 30) g = "30-39";
  const [low, avg, high] = tbl[g];
  return { low, avg, high, group: g };
}

function percentile(grip: number, age: number, gender: Gender): number {
  const n = gripNorms(age, gender);
  const z = (grip - n.avg) / ((n.high - n.low) / 3);
  return Math.round(Math.min(99, Math.max(1, 100 / (1 + Math.exp(-1.7 * z)))));
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#080e1a]"><p className="text-white/40">Loading...</p></div>}>
      <Content />
    </Suspense>
  );
}

function Content() {
  const { eventId } = useParams() as { eventId: string };
  const router = useRouter();
  const pid = useSearchParams().get("pid") || "";

  const [p, setP] = useState<Participant | null>(null);
  const [age, setAge] = useState(0);
  const [ready, setReady] = useState(false);
  const [rank, setRank] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    (async () => {
      const part = await getParticipant(pid);
      if (!part) return;
      setP(part);
      // animate
      setTimeout(() => {
        const t = part.biologicalAge, s = part.age, dur = 1200, t0 = Date.now();
        const tick = () => {
          const prog = Math.min((Date.now() - t0) / dur, 1);
          setAge(Math.round(s + (t - s) * (1 - Math.pow(1 - prog, 3))));
          if (prog < 1) requestAnimationFrame(tick); else setReady(true);
        };
        requestAnimationFrame(tick);
      }, 300);
      const all = await getParticipants(eventId);
      setTotal(all.length);
      setRank([...all].sort((a, b) => a.biologicalAge - b.biologicalAge).findIndex(x => x.id === part.id) + 1);
    })();
  }, [pid, eventId]);

  const pdf = useCallback(() => { if (p) generateResultPDF(p); }, [p]);

  if (!p) return <div className="min-h-screen flex items-center justify-center bg-[#080e1a]"><p className="text-white/40">Result not found</p></div>;

  const delta = p.age - p.biologicalAge;
  const stage = STAGE_MAP[p.bioStage];
  const emoji = STAGE_EMOJI[p.bioStage];
  const norms = gripNorms(p.age, p.gender);
  const pctl = percentile(p.gripAvgKg, p.age, p.gender);
  const gDiff = p.gripAvgKg - p.expectedGrip;
  const gaugePos = Math.min(100, Math.max(0, ((p.age + 15 - p.biologicalAge) / 30) * 100));
  const gripPos = Math.min(98, Math.max(2, ((p.gripAvgKg - norms.low) / (norms.high - norms.low)) * 100));

  return (
    <div className="min-h-screen bg-[#080e1a] relative overflow-hidden">
      {/* Ambient lights */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] pointer-events-none" style={{ background: "radial-gradient(ellipse at 80% 10%, rgba(56,189,248,0.10) 0%, transparent 70%)" }} />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] pointer-events-none" style={{ background: "radial-gradient(ellipse at 20% 90%, rgba(212,132,90,0.05) 0%, transparent 60%)" }} />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        {/* ═══ HEADER ═══ */}
        <div className="mb-8">
          <button onClick={() => router.push(`/event/${eventId}`)} aria-label="Back to event" className="text-white/30 hover:text-white/60 text-sm mb-4 inline-flex items-center gap-1.5 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5m7-7l-7 7 7 7"/></svg>
            Back to Event
          </button>
          <div className="flex items-end justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">
                Hello, <span style={{ color: stage.color }}>{p.name.split(" ")[0]}</span>
              </h1>
              <p className="text-white/35 mt-1 text-sm sm:text-base">Here are your GripAge results</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-white/25">
              <span className="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] font-medium">#{rank} of {total}</span>
            </div>
          </div>
        </div>

        {/* ═══ TOP ROW — Bio Age + Grip Strength ═══ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-5">

          {/* Bio Age — hero card */}
          <div className="rounded-3xl p-6 sm:p-8 relative overflow-hidden bg-white/[0.03] border border-white/[0.06]">
            <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 20%, ${stage.color}10, transparent 70%)` }} />
            <div className="relative text-center">
              <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] mb-4 font-medium">Biological Age</p>
              <p className="text-8xl sm:text-9xl font-black leading-none tracking-tight" style={{ color: stage.color }}>{age}</p>
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold" style={{ color: stage.color, background: `${stage.color}15`, border: `1px solid ${stage.color}25` }}>
                {emoji} {stage.label}
              </div>
              <p className="text-sm text-white/40 mt-3">
                {delta > 0 ? <><span className="font-semibold" style={{ color: stage.color }}>{delta} years younger</span> biologically</> : delta < 0 ? <><span className="font-semibold" style={{ color: stage.color }}>{Math.abs(delta)} years older</span> biologically</> : "Right on track for your age"}
              </p>
            </div>
          </div>

          {/* Grip Strength — hero card */}
          <div className="rounded-3xl p-6 sm:p-8 relative overflow-hidden" style={{ background: "rgba(212,132,90,0.06)", border: "1px solid rgba(212,132,90,0.15)" }}>
            <div className="relative text-center">
              <p className="text-[10px] text-[#d4845a]/50 uppercase tracking-[0.2em] mb-4 font-medium">Grip Strength</p>
              <p className="text-8xl sm:text-9xl font-black leading-none tracking-tight text-[#d4845a]">{p.gripAvgKg}</p>
              <p className="text-white/30 text-sm mt-1">kg average</p>
              <p className="text-sm mt-4 font-semibold" style={{ color: gDiff >= 0 ? "#4ade80" : "#f87171" }}>
                {gDiff >= 0 ? "+" : ""}{gDiff.toFixed(1)} kg vs expected ({p.expectedGrip} kg)
              </p>
            </div>
          </div>
        </div>

        {/* ═══ DETAIL ROW — Age Comparison + Grip Range ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 mb-5">

          {/* Age Comparison */}
          <div className="rounded-2xl p-5 sm:p-6 bg-white/[0.03] border border-white/[0.06]">
            <p className="text-[10px] text-white/30 uppercase tracking-[0.15em] font-medium mb-5">Age Comparison</p>
            <div className="grid grid-cols-3 text-center mb-6">
              <div>
                <p className="text-4xl font-bold text-white/60">{p.age}</p>
                <p className="text-xs text-white/25 mt-1">Actual</p>
              </div>
              <div className="flex flex-col items-center justify-center">
                <div className="px-4 py-2 rounded-xl" style={{ color: stage.color, background: `${stage.color}12` }}>
                  <p className="text-2xl font-black">{delta > 0 ? `−${delta}` : delta < 0 ? `+${Math.abs(delta)}` : "="}</p>
                </div>
                <p className="text-xs text-white/25 mt-1">Delta</p>
              </div>
              <div>
                <p className="text-4xl font-bold" style={{ color: stage.color }}>{p.biologicalAge}</p>
                <p className="text-xs text-white/25 mt-1">Bio Age</p>
              </div>
            </div>

            {/* Gauge bar */}
            <div>
              <div className="flex justify-between text-[10px] text-white/20 mb-1.5">
                <span>Older</span><span>Your Age</span><span>Younger</span>
              </div>
              <div className="relative h-3 rounded-full" style={{ background: "rgba(255,255,255,0.04)" }}>
                <div className="absolute inset-0 rounded-full" style={{ background: "linear-gradient(to right, #ef444435, #f59e0b35, #4ade8035)" }} />
                <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/15" />
                <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-lg -ml-2 transition-all duration-700" style={{ left: `${gaugePos}%`, backgroundColor: stage.color, boxShadow: `0 0 12px ${stage.color}60` }} />
              </div>
            </div>
          </div>

          {/* Grip Range */}
          <div className="rounded-2xl p-5 sm:p-6" style={{ background: "rgba(212,132,90,0.05)", border: "1px solid rgba(212,132,90,0.12)" }}>
            <p className="text-[10px] text-[#d4845a]/50 uppercase tracking-[0.15em] font-medium mb-5">Grip Details</p>
            <div className="grid grid-cols-3 text-center mb-6">
              <div>
                <p className="text-4xl font-black" style={{ color: stage.color }}>{p.gripAvgKg}</p>
                <p className="text-xs text-white/25 mt-1">Your (kg)</p>
              </div>
              <div className="flex flex-col items-center justify-center">
                <div className="px-3 py-1.5 rounded-lg" style={{ color: gDiff >= 0 ? "#4ade80" : "#f87171", background: gDiff >= 0 ? "rgba(74,222,128,0.08)" : "rgba(248,113,113,0.08)" }}>
                  <p className="text-lg font-bold">{gDiff >= 0 ? "+" : ""}{gDiff.toFixed(1)}</p>
                </div>
                <p className="text-xs text-white/25 mt-1">vs expected</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-white/30">{p.expectedGrip}</p>
                <p className="text-xs text-white/25 mt-1">Expected</p>
              </div>
            </div>

            {/* Range bar */}
            <div className="mb-5">
              <div className="flex justify-between text-[10px] text-white/20 mb-1.5"><span>{norms.low} kg</span><span>{norms.avg} avg</span><span>{norms.high} kg</span></div>
              <div className="relative h-3 rounded-full" style={{ background: "rgba(255,255,255,0.04)" }}>
                <div className="absolute inset-0 rounded-full" style={{ background: "linear-gradient(to right, #ef444425, #f59e0b25, #4ade8025)" }} />
                <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-lg -ml-2 transition-all duration-700" style={{ left: `${gripPos}%`, backgroundColor: stage.color, boxShadow: `0 0 12px ${stage.color}60` }} />
              </div>
            </div>

            {/* Percentile badge */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03]">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black shrink-0" style={{ background: `${stage.color}12`, color: stage.color }}>P{pctl}</div>
              <p className="text-sm text-white/50">Stronger than <span className="font-semibold" style={{ color: stage.color }}>{pctl}%</span> of {p.gender === "male" ? "men" : "women"} aged {gripNorms(p.age, p.gender).group}</p>
            </div>
          </div>
        </div>

        {/* ═══ HANDS ROW ═══ */}
        {(p.gripLeftKg !== null || p.gripRightKg !== null) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-5">
            {p.gripLeftKg !== null && <HandCard label="Left Hand" grip={p.gripLeftKg} expected={p.expectedGrip} color={stage.color} />}
            {p.gripRightKg !== null && <HandCard label="Right Hand" grip={p.gripRightKg} expected={p.expectedGrip} color={stage.color} />}
            {p.gripLeftKg !== null && p.gripRightKg !== null && (
              <div className="rounded-2xl p-5 bg-white/[0.03] border border-white/[0.06] sm:col-span-2 lg:col-span-1">
                <p className="text-[10px] text-white/30 uppercase tracking-[0.15em] font-medium mb-4">Hand Balance</p>
                {(() => {
                  const diff = Math.abs(p.gripLeftKg - p.gripRightKg);
                  const ok = diff <= 2;
                  return (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-center flex-1"><p className="text-3xl font-bold text-white/50">{p.gripLeftKg}</p><p className="text-[10px] text-white/20 mt-0.5">Left</p></div>
                        <div className="text-center px-4"><p className="text-xl font-black" style={{ color: ok ? "#4ade80" : "#f59e0b" }}>{diff.toFixed(1)}</p><p className="text-[10px] text-white/20 mt-0.5">kg diff</p></div>
                        <div className="text-center flex-1"><p className="text-3xl font-bold text-white/50">{p.gripRightKg}</p><p className="text-[10px] text-white/20 mt-0.5">Right</p></div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white/[0.02]">
                        <p className="text-xs text-white/35 text-center">{ok ? "Well balanced grip strength" : `${diff.toFixed(1)} kg imbalance — consider training your weaker hand`}</p>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* ═══ STAGE ROW ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 mb-8">
          {/* Your Stage */}
          <div className="rounded-2xl p-5 sm:p-6" style={{ background: "rgba(212,132,90,0.05)", border: "1px solid rgba(212,132,90,0.12)" }}>
            <p className="text-[10px] text-[#d4845a]/50 uppercase tracking-[0.15em] font-medium mb-4">Your Stage</p>
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0" style={{ background: `${stage.color}12` }}>{emoji}</div>
              <div>
                <p className="font-bold text-xl" style={{ color: stage.color }}>{stage.label}</p>
                <p className="text-white/35 text-sm">{stage.description}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Expected" value={`${p.expectedGrip} kg`} />
              <Stat label="Performance" value={`${gDiff >= 0 ? "+" : ""}${gDiff.toFixed(1)} kg`} color={gDiff >= 0 ? "#4ade80" : "#f87171"} />
              <Stat label="Standing" value={`Top ${100 - pctl}%`} />
            </div>
          </div>

          {/* Stage Reference */}
          <div className="rounded-2xl p-5 sm:p-6 bg-white/[0.03] border border-white/[0.06]">
            <p className="text-[10px] text-white/30 uppercase tracking-[0.15em] font-medium mb-4">Stage Reference</p>
            <div className="space-y-1">
              {([
                { range: "> +10", label: "Elite Vitality" as const },
                { range: "+6 to +10", label: "Peak Fitness" as const },
                { range: "+3 to +5", label: "Above Average" as const },
                { range: "−2 to +2", label: "On Track" as const },
                { range: "−5 to −3", label: "Below Average" as const },
                { range: "−10 to −6", label: "Needs Attention" as const },
                { range: "< −10", label: "Critical Gap" as const },
              ]).map(r => {
                const info = STAGE_MAP[r.label];
                const cur = r.label === p.bioStage;
                return (
                  <div key={r.label} className={`flex items-center gap-3 py-2 px-3 rounded-lg text-sm transition-colors ${cur ? "bg-white/[0.05]" : ""}`}>
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: info.color }} />
                    <span className="font-mono text-[11px] text-white/20 w-20 shrink-0">{r.range}</span>
                    <span className={cur ? "font-bold flex-1" : "text-white/35 flex-1"} style={cur ? { color: info.color } : {}}>{r.label}{cur ? " ← You" : ""}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-white/15 mt-3">Delta = Chronological − Biological Age</p>
          </div>
        </div>

        {/* ═══ ACTIONS ═══ */}
        <div className={`max-w-xl mx-auto pb-10 space-y-3 ${ready ? "page-enter" : "opacity-0"}`}>
          <button onClick={pdf} className="w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all active:scale-[0.98] text-[#1a0800]"
            style={{ background: "linear-gradient(135deg, #ffb691, #d4845a)", boxShadow: "0 8px 32px rgba(212,132,90,0.25)" }}>
            Download PDF Report
          </button>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => router.push(`/event/${eventId}/leaderboard`)}
              className="py-4 px-6 rounded-2xl font-semibold text-base border border-[#d4845a]/40 text-[#d4845a] hover:bg-[#d4845a]/8 transition-all active:scale-[0.98]">
              Leaderboard
            </button>
            <button onClick={() => router.push(`/event/${eventId}/register`)}
              className="py-4 px-6 rounded-2xl font-semibold text-base border border-white/10 text-white/60 hover:bg-white/[0.04] transition-all active:scale-[0.98]">
              Next Player →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Reusable sub-components ─── */

function HandCard({ label, grip, expected, color }: { label: string; grip: number; expected: number; color: string }) {
  const above = grip >= expected;
  return (
    <div className="rounded-2xl p-5 bg-white/[0.03] border border-white/[0.06]">
      <p className="text-[10px] text-white/30 uppercase tracking-[0.15em] font-medium mb-4">{label}</p>
      <div className="flex items-baseline gap-2 mb-3">
        <p className="text-4xl font-black" style={{ color }}>{grip}</p>
        <span className="text-sm text-white/25">kg</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, (grip / (expected * 1.3)) * 100)}%`, backgroundColor: above ? "#4ade80" : "#f87171" }} />
      </div>
      <p className="text-xs text-white/30 mt-2">
        <span style={{ color: above ? "#4ade80" : "#f87171" }}>{above ? "Above" : "Below"}</span> expected ({expected} kg)
      </p>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="p-3 rounded-xl bg-white/[0.03]">
      <p className="text-[10px] text-white/25 mb-1">{label}</p>
      <p className="text-sm font-semibold" style={{ color: color || "rgba(255,255,255,0.6)" }}>{value}</p>
    </div>
  );
}
