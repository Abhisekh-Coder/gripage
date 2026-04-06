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

const STAGES: { r: string; l: BioStage }[] = [
  { r: "> +10", l: "Elite Vitality" }, { r: "+6 to +10", l: "Peak Fitness" },
  { r: "+3 to +5", l: "Above Average" }, { r: "−2 to +2", l: "On Track" },
  { r: "−5 to −3", l: "Below Average" }, { r: "−10 to −6", l: "Needs Attention" },
  { r: "< −10", l: "Critical Gap" },
];

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0B0B0F] flex items-center justify-center"><div className="w-6 h-6 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" /></div>}>
      <Results />
    </Suspense>
  );
}

function Results() {
  const { eventId } = useParams() as { eventId: string };
  const router = useRouter();
  const pid = useSearchParams().get("pid") || "";

  const [p, setP] = useState<Participant | null>(null);
  const [rank, setRank] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const part = await getParticipant(pid);
        if (!part) return;
        setP(part);
        const all = await getParticipants(eventId);
        setTotal(all.length);
        setRank([...all].sort((a, b) => a.biologicalAge - b.biologicalAge).findIndex(x => x.id === part.id) + 1);
      } catch (e) { console.error(e); }
    })();
  }, [pid, eventId]);

  const pdf = useCallback(() => { if (p) generateResultPDF(p); }, [p]);

  if (!p) return <div className="min-h-screen bg-[#0B0B0F] flex items-center justify-center"><p className="text-white/30 text-sm">Loading results...</p></div>;

  const delta = p.age - p.biologicalAge;
  const stage = STAGE_MAP[p.bioStage];
  const n = norms(p.age, p.gender);
  const percentile = pctl(p.gripAvgKg, p.age, p.gender);
  const gDiff = p.gripAvgKg - p.expectedGrip;
  const gripBarPos = Math.min(98, Math.max(2, ((p.gripAvgKg - n.low) / (n.high - n.low)) * 100));
  const ageBarPos = Math.min(98, Math.max(2, ((p.age + 15 - p.biologicalAge) / 30) * 100));

  return (
    <div className="min-h-screen bg-[#0B0B0F]">

      {/* ═══ BANNER ═══ */}
      <div className="relative h-40 sm:h-48 overflow-hidden bg-gradient-to-r from-[#0f1a10] via-[#0B0B0F] to-[#0B0B0F]">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 30% 50%, rgba(74,222,128,0.08) 0%, transparent 60%)" }} />
        <div className="absolute bottom-0 inset-x-0 h-px bg-white/[0.06]" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 h-full flex flex-col justify-end pb-5">
          <button onClick={() => router.push(`/event/${eventId}`)} aria-label="Back" className="text-white/20 hover:text-white/40 text-xs inline-flex items-center gap-1 transition-colors mb-3">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5m7-7l-7 7 7 7"/></svg>
            Back to Event
          </button>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-white/30 text-xs mb-1">Results for</p>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">{p.name}</h1>
            </div>
            <div className="text-right text-xs text-white/25">
              <p>Rank <span className="text-white/50 font-bold">#{rank}</span> of {total}</p>
              <p className="mt-0.5">{p.gender} · {p.age}y · {p.heightCm}cm · {p.weightKg}kg</p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ CONTENT ═══ */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 space-y-4">

        {/* Row 1 — Three key metrics */}
        <div className="grid grid-cols-3 gap-3">
          <Metric label="Biological Age" value={String(p.biologicalAge)} unit="years" sub={`${delta > 0 ? delta + "y younger" : delta < 0 ? Math.abs(delta) + "y older" : "On track"}`} subColor={delta >= 0 ? "#4ADE80" : "#f87171"} />
          <Metric label="Grip Strength" value={String(p.gripAvgKg)} unit="kg" sub={`${gDiff >= 0 ? "+" : ""}${gDiff.toFixed(1)} vs expected`} subColor={gDiff >= 0 ? "#4ADE80" : "#f87171"} />
          <Metric label="Percentile" value={`P${percentile}`} unit="" sub={`Top ${100 - percentile}% of ${p.gender === "male" ? "men" : "women"}`} subColor="#4ADE80" />
        </div>

        {/* Row 2 — Age gauge + Grip range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Age Gauge */}
          <Card title="Age Comparison">
            <div className="flex items-center justify-between mb-5">
              <div className="text-center"><p className="text-2xl font-bold text-white/50">{p.age}</p><p className="text-[10px] text-white/20">Actual</p></div>
              <svg width="32" height="16" viewBox="0 0 32 16" className="text-white/10"><path d="M0 8h12m8 0h12" stroke="currentColor" strokeWidth="1"/><path d="M18 4l6 4-6 4" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>
              <div className="text-center"><p className="text-2xl font-black text-[#4ADE80]">{p.biologicalAge}</p><p className="text-[10px] text-white/20">Bio Age</p></div>
              <div className="text-center"><p className="text-lg font-black px-2 py-0.5 rounded-md bg-[#4ADE80]/8 text-[#4ADE80]">{delta > 0 ? `−${delta}` : delta < 0 ? `+${Math.abs(delta)}` : "="}</p><p className="text-[10px] text-white/20">Delta</p></div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] text-white/15"><span>Older</span><span>Your Age</span><span>Younger</span></div>
              <div className="relative h-2 rounded-full bg-white/[0.05]">
                <div className="absolute inset-0 rounded-full" style={{ background: "linear-gradient(to right, rgba(248,113,113,0.12), rgba(255,255,255,0.03), rgba(74,222,128,0.12))" }} />
                <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/10" />
                <div className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-[#4ADE80] border border-white/50 -ml-[5px]" style={{ left: `${ageBarPos}%` }} />
              </div>
            </div>
          </Card>

          {/* Grip Range */}
          <Card title={`Grip Range — ${p.gender === "male" ? "Men" : "Women"} ${n.group}`}>
            <div className="flex items-center justify-between mb-5">
              <div className="text-center"><p className="text-2xl font-black text-[#4ADE80]">{p.gripAvgKg}</p><p className="text-[10px] text-white/20">Your (kg)</p></div>
              <div className="text-center"><p className="text-sm font-bold px-2 py-0.5 rounded-md" style={{ color: gDiff >= 0 ? "#4ADE80" : "#f87171", background: gDiff >= 0 ? "rgba(74,222,128,0.06)" : "rgba(248,113,113,0.06)" }}>{gDiff >= 0 ? "+" : ""}{gDiff.toFixed(1)}</p><p className="text-[10px] text-white/20">vs expected</p></div>
              <div className="text-center"><p className="text-2xl font-bold text-white/25">{p.expectedGrip}</p><p className="text-[10px] text-white/20">Expected</p></div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] text-white/15"><span>{n.low} kg</span><span>{n.avg} avg</span><span>{n.high} kg</span></div>
              <div className="relative h-2 rounded-full bg-white/[0.05]">
                <div className="absolute inset-0 rounded-full" style={{ background: "linear-gradient(to right, rgba(248,113,113,0.1), rgba(74,222,128,0.1))" }} />
                <div className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-[#4ADE80] border border-white/50 -ml-[5px]" style={{ left: `${gripBarPos}%` }} />
              </div>
            </div>
          </Card>
        </div>

        {/* Row 3 — Hands */}
        {(p.gripLeftKg !== null || p.gripRightKg !== null) && (
          <Card title="Hand Breakdown">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {p.gripLeftKg !== null && <HandBar label="Left Hand" value={p.gripLeftKg} expected={p.expectedGrip} max={n.high * 1.1} />}
              {p.gripRightKg !== null && <HandBar label="Right Hand" value={p.gripRightKg} expected={p.expectedGrip} max={n.high * 1.1} />}
              {p.gripLeftKg !== null && p.gripRightKg !== null && (() => {
                const diff = Math.abs(p.gripLeftKg - p.gripRightKg);
                return (
                  <div>
                    <p className="text-[10px] text-white/20 mb-2">Balance</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold" style={{ color: diff <= 2 ? "#4ADE80" : "#f59e0b" }}>{diff.toFixed(1)}</span>
                      <span className="text-xs text-white/20">kg diff</span>
                    </div>
                    <p className="text-[10px] text-white/25 mt-1">{diff <= 2 ? "Well balanced" : "Some imbalance — train weaker hand"}</p>
                  </div>
                );
              })()}
            </div>
          </Card>
        )}

        {/* Row 4 — Stage + Reference side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Card title="Your Stage">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
              <div>
                <p className="font-bold text-sm" style={{ color: stage.color }}>{stage.label}</p>
                <p className="text-[10px] text-white/25">{stage.description}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-white/[0.02]"><p className="text-[9px] text-white/15">Expected</p><p className="text-xs font-semibold text-white/40">{p.expectedGrip} kg</p></div>
              <div className="p-2 rounded-lg bg-white/[0.02]"><p className="text-[9px] text-white/15">Performance</p><p className="text-xs font-semibold" style={{ color: gDiff >= 0 ? "#4ADE80" : "#f87171" }}>{gDiff >= 0 ? "+" : ""}{gDiff.toFixed(1)} kg</p></div>
              <div className="p-2 rounded-lg bg-white/[0.02]"><p className="text-[9px] text-white/15">Standing</p><p className="text-xs font-semibold text-white/40">Top {100 - percentile}%</p></div>
            </div>
          </Card>

          <Card title="Stage Reference">
            <div className="space-y-px">
              {STAGES.map(s => {
                const info = STAGE_MAP[s.l]; const cur = s.l === p.bioStage;
                return (
                  <div key={s.l} className={`flex items-center gap-2 py-1.5 px-2 rounded text-[11px] ${cur ? "bg-[#4ADE80]/5" : ""}`}>
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: info.color }} />
                    <span className="text-[10px] text-white/12 w-14 shrink-0 font-mono">{s.r}</span>
                    <span className={cur ? "font-bold text-[#4ADE80]" : "text-white/20"}>{s.l}{cur ? " ←" : ""}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2 pb-6">
          <button onClick={pdf} className="btn-primary flex-1 py-3 rounded-xl text-sm font-bold">Download PDF Report</button>
          <button onClick={() => router.push(`/event/${eventId}/leaderboard`)} className="btn-outline-accent flex-1 py-3 rounded-xl text-sm font-semibold">Leaderboard</button>
          <button onClick={() => router.push(`/event/${eventId}/register`)} className="btn-secondary flex-1 py-3 rounded-xl text-sm">Next Player →</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Clean sub-components ─── */

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-4 bg-white/[0.025] border border-white/[0.05]">
      <p className="text-[10px] text-white/25 font-semibold uppercase tracking-[0.1em] mb-3">{title}</p>
      {children}
    </div>
  );
}

function Metric({ label, value, unit, sub, subColor }: { label: string; value: string; unit: string; sub: string; subColor: string }) {
  return (
    <div className="rounded-xl p-4 bg-white/[0.025] border border-white/[0.05]">
      <p className="text-[10px] text-white/25 font-semibold uppercase tracking-[0.1em] mb-2">{label}</p>
      <p className="text-3xl sm:text-4xl font-black leading-none">{value} <span className="text-sm font-normal text-white/20">{unit}</span></p>
      <p className="text-[11px] mt-1.5 font-medium" style={{ color: subColor }}>{sub}</p>
    </div>
  );
}

function HandBar({ label, value, expected, max }: { label: string; value: number; expected: number; max: number }) {
  const above = value >= expected;
  const pct = Math.min(100, (value / max) * 100);
  const expPct = Math.min(100, (expected / max) * 100);
  return (
    <div>
      <p className="text-[10px] text-white/20 mb-1">{label}</p>
      <p className="text-2xl font-black mb-2">{value} <span className="text-xs font-normal text-white/20">kg</span></p>
      <div className="relative h-2 rounded-full bg-white/[0.04]">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: above ? "#4ADE80" : "#f87171" }} />
        {/* Expected marker */}
        <div className="absolute top-0 bottom-0 w-px bg-white/20" style={{ left: `${expPct}%` }} />
      </div>
      <div className="flex justify-between mt-1 text-[9px] text-white/15">
        <span style={{ color: above ? "#4ADE80" : "#f87171" }}>{above ? "Above" : "Below"} expected</span>
        <span>{expected} kg expected</span>
      </div>
    </div>
  );
}
