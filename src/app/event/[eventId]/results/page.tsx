"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getParticipant, getParticipants } from "@/lib/store";
import { STAGE_MAP } from "@/lib/formula";
import { generateResultPDF } from "@/lib/pdf";
import type { Participant, BioStage, Gender } from "@/lib/types";

function norms(age: number, gender: Gender) {
  const t: Record<string, [number, number, number]> = gender === "male"
    ? { "17-29": [35, 45, 55], "30-39": [33, 43, 53], "40-49": [30, 40, 50], "50-59": [26, 36, 46], "60-69": [22, 32, 42], "70+": [18, 27, 37] }
    : { "17-29": [20, 28, 36], "30-39": [19, 27, 35], "40-49": [18, 25, 33], "50-59": [15, 22, 30], "60-69": [13, 19, 26], "70+": [10, 16, 22] };
  let g = "17-29";
  if (age >= 70) g = "70+"; else if (age >= 60) g = "60-69"; else if (age >= 50) g = "50-59"; else if (age >= 40) g = "40-49"; else if (age >= 30) g = "30-39";
  return { low: t[g][0], avg: t[g][1], high: t[g][2], group: g };
}

function pctl(grip: number, age: number, gender: Gender): number {
  const n = norms(age, gender);
  const z = (grip - n.avg) / ((n.high - n.low) / 3);
  return Math.round(Math.min(99, Math.max(1, 100 / (1 + Math.exp(-1.7 * z)))));
}

const EMOJI: Record<BioStage, string> = {
  "Elite Vitality": "👑", "Peak Fitness": "🔥", "Above Average": "💪",
  "On Track": "✅", "Below Average": "⚡", "Needs Attention": "🎯", "Critical Gap": "🏋️",
};

export default function ResultsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Content />
    </Suspense>
  );
}

function Loading() {
  return (
    <div className="min-h-screen bg-[#0B0B0F] flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#4ADE80]/30 border-t-[#4ADE80] rounded-full animate-spin mx-auto mb-3" />
        <p className="text-white/30 text-sm">Loading results...</p>
      </div>
    </div>
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
      try {
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
      } catch (e) { console.error("Failed to load results:", e); }
    })();
  }, [pid, eventId]);

  const pdf = useCallback(() => { if (p) generateResultPDF(p); }, [p]);

  if (!p) return (
    <div className="min-h-screen bg-[#0B0B0F] flex items-center justify-center">
      <div className="text-center">
        <p className="text-white/40 text-sm">Result not found</p>
        <button onClick={() => router.push(`/event/${eventId}`)} className="text-[#4ADE80]/60 hover:text-[#4ADE80] text-xs mt-2 transition-colors">← Back to Event</button>
      </div>
    </div>
  );

  const delta = p.age - p.biologicalAge;
  const stage = STAGE_MAP[p.bioStage];
  const emoji = EMOJI[p.bioStage];
  const n = norms(p.age, p.gender);
  const percentile = pctl(p.gripAvgKg, p.age, p.gender);
  const gDiff = p.gripAvgKg - p.expectedGrip;

  return (
    <div className="min-h-screen bg-[#0B0B0F]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* ═══ HEADER ═══ */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button onClick={() => router.push(`/event/${eventId}`)} aria-label="Back" className="text-white/20 hover:text-white/40 text-xs inline-flex items-center gap-1 transition-colors mb-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5m7-7l-7 7 7 7"/></svg>
              Back to Event
            </button>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Results for <span className="text-[#4ADE80]">{p.name.split(" ")[0]}</span>
            </h1>
          </div>
          <div className="text-right">
            <span className="text-xs text-white/20">Rank</span>
            <p className="text-lg font-black text-white/60">#{rank} <span className="text-xs font-normal text-white/20">of {total}</span></p>
          </div>
        </div>

        {/* ═══ TOP ROW — 3 hero cards ═══ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">

          {/* Bio Age */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <CardLabel>Biological Age</CardLabel>
              <Icon color="#4ADE80"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></Icon>
            </div>
            <p className="text-4xl sm:text-5xl font-black text-[#4ADE80] leading-none">{bioAge}</p>
            <div className="flex items-center gap-2 mt-3">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#4ADE80]/10 text-[#4ADE80]">{emoji} {stage.label}</span>
            </div>
            <p className="text-xs text-white/30 mt-2">
              {delta > 0 ? `${delta}y younger` : delta < 0 ? `${Math.abs(delta)}y older` : "On track"} biologically
            </p>
          </Card>

          {/* Grip Strength */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <CardLabel>Grip Strength</CardLabel>
              <Icon color="#4ADE80"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12h-4l-3 9L9 3l-3 9H2"/></svg></Icon>
            </div>
            <p className="text-4xl sm:text-5xl font-black leading-none">{p.gripAvgKg} <span className="text-lg font-normal text-white/25">kg</span></p>
            <p className="text-xs mt-3" style={{ color: gDiff >= 0 ? "#4ADE80" : "#f87171" }}>
              {gDiff >= 0 ? "+" : ""}{gDiff.toFixed(1)} kg vs expected ({p.expectedGrip} kg)
            </p>
          </Card>

          {/* Age Delta */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <CardLabel>Age Comparison</CardLabel>
              <Icon color="#4ADE80"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg></Icon>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-white/50">{p.age}</p>
                <p className="text-[9px] text-white/20 mt-0.5">Actual</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-black px-2.5 py-1 rounded-lg bg-[#4ADE80]/10 text-[#4ADE80]">
                  {delta > 0 ? `−${delta}` : delta < 0 ? `+${Math.abs(delta)}` : "="}
                </p>
                <p className="text-[9px] text-white/20 mt-0.5">Delta</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-[#4ADE80]">{p.biologicalAge}</p>
                <p className="text-[9px] text-white/20 mt-0.5">Bio Age</p>
              </div>
            </div>
          </Card>
        </div>

        {/* ═══ MIDDLE ROW — Grip range + hands ═══ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">

          {/* Grip Range */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <CardLabel>Grip Range — {p.gender === "male" ? "Men" : "Women"} {n.group}</CardLabel>
            </div>
            <div className="flex items-center justify-between text-xs text-white/20 mb-1">
              <span>{n.low} kg</span><span>{n.avg} avg</span><span>{n.high} kg</span>
            </div>
            <div className="relative h-2 rounded-full bg-white/[0.06] mb-4">
              <div className="absolute inset-0 rounded-full" style={{ background: "linear-gradient(to right, rgba(248,113,113,0.15), rgba(74,222,128,0.15))" }} />
              <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white/70 -ml-1.5 shadow-lg" style={{ left: `${Math.min(98, Math.max(2, ((p.gripAvgKg - n.low) / (n.high - n.low)) * 100))}%`, backgroundColor: "#4ADE80" }} />
            </div>
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.04]">
              <div className="w-8 h-8 rounded-lg bg-[#4ADE80]/8 flex items-center justify-center text-[10px] font-black text-[#4ADE80]">P{percentile}</div>
              <p className="text-xs text-white/40">Stronger than <span className="text-white/60 font-semibold">{percentile}%</span> of {p.gender === "male" ? "men" : "women"} aged {n.group}</p>
            </div>
          </Card>

          {/* Left + Right hands */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <CardLabel>Hand Details</CardLabel>
            </div>
            {p.gripLeftKg !== null && p.gripRightKg !== null ? (
              <div className="space-y-3">
                <HandRow label="Left Hand" grip={p.gripLeftKg} expected={p.expectedGrip} />
                <HandRow label="Right Hand" grip={p.gripRightKg} expected={p.expectedGrip} />
                <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
                  <span className="text-[10px] text-white/20">Balance</span>
                  {(() => {
                    const diff = Math.abs(p.gripLeftKg - p.gripRightKg);
                    return <span className="text-xs font-medium" style={{ color: diff <= 2 ? "#4ADE80" : "#f59e0b" }}>{diff.toFixed(1)} kg diff — {diff <= 2 ? "Balanced" : "Imbalanced"}</span>;
                  })()}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {p.gripLeftKg !== null && <HandRow label="Left Hand" grip={p.gripLeftKg} expected={p.expectedGrip} />}
                {p.gripRightKg !== null && <HandRow label="Right Hand" grip={p.gripRightKg} expected={p.expectedGrip} />}
              </div>
            )}
          </Card>
        </div>

        {/* ═══ BOTTOM ROW — Stage + Reference ═══ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">

          {/* Your Stage */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <CardLabel>Your Stage</CardLabel>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-[#4ADE80]/8 flex items-center justify-center text-xl">{emoji}</div>
              <div>
                <p className="font-bold text-[#4ADE80]">{stage.label}</p>
                <p className="text-xs text-white/30">{stage.description}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <StatBox label="Expected" value={`${p.expectedGrip} kg`} />
              <StatBox label="Performance" value={`${gDiff >= 0 ? "+" : ""}${gDiff.toFixed(1)} kg`} color={gDiff >= 0 ? "#4ADE80" : "#f87171"} />
              <StatBox label="Standing" value={`Top ${100 - percentile}%`} />
            </div>
          </Card>

          {/* Stage Reference */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <CardLabel>Stage Reference</CardLabel>
            </div>
            <div className="space-y-0.5">
              {([
                { r: "> +10", l: "Elite Vitality" as const },
                { r: "+6 to +10", l: "Peak Fitness" as const },
                { r: "+3 to +5", l: "Above Average" as const },
                { r: "−2 to +2", l: "On Track" as const },
                { r: "−5 to −3", l: "Below Average" as const },
                { r: "−10 to −6", l: "Needs Attention" as const },
                { r: "< −10", l: "Critical Gap" as const },
              ]).map(s => {
                const info = STAGE_MAP[s.l]; const cur = s.l === p.bioStage;
                return (
                  <div key={s.l} className={`flex items-center gap-2.5 py-1.5 px-2.5 rounded-lg text-xs ${cur ? "bg-[#4ADE80]/5 border border-[#4ADE80]/10" : ""}`}>
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: info.color }} />
                    <span className="font-mono text-[10px] text-white/15 w-16 shrink-0">{s.r}</span>
                    <span className={cur ? "font-bold text-[#4ADE80]" : "text-white/25"}>{s.l}{cur ? " ← You" : ""}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* ═══ ACTIONS ═══ */}
        <div className={`space-y-2 max-w-md mx-auto ${ready ? "page-enter" : "opacity-0"}`}>
          <button onClick={pdf} className="btn-primary w-full py-3.5 rounded-2xl text-sm font-bold">
            Download PDF Report
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => router.push(`/event/${eventId}/leaderboard`)} className="btn-outline-accent py-3 rounded-2xl text-sm font-semibold">
              Leaderboard
            </button>
            <button onClick={() => router.push(`/event/${eventId}/register`)} className="btn-secondary py-3 rounded-2xl text-sm font-medium">
              Next Player →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Reusable sub-components ─── */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-4 sm:p-5 bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm">
      {children}
    </div>
  );
}

function CardLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] text-white/30 font-semibold uppercase tracking-[0.12em]">{children}</p>;
}

function Icon({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}10`, color }}>
      {children}
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
      <p className="text-[9px] text-white/20 mb-0.5">{label}</p>
      <p className="text-xs font-semibold" style={{ color: color || "rgba(255,255,255,0.5)" }}>{value}</p>
    </div>
  );
}

function HandRow({ label, grip, expected }: { label: string; grip: number; expected: number }) {
  const above = grip >= expected;
  const pct = Math.min(100, (grip / (expected * 1.3)) * 100);
  return (
    <div className="flex items-center gap-3">
      <div className="w-16 shrink-0">
        <p className="text-[10px] text-white/25">{label}</p>
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-sm font-bold">{grip} <span className="text-[10px] font-normal text-white/20">kg</span></span>
          <span className="text-[10px]" style={{ color: above ? "#4ADE80" : "#f87171" }}>{above ? "Above" : "Below"}</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: above ? "#4ADE80" : "#f87171" }} />
        </div>
      </div>
    </div>
  );
}
