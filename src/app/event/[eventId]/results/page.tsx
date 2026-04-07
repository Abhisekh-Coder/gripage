"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getParticipant, getParticipants } from "@/lib/store";
import { STAGE_MAP } from "@/lib/formula";
import { generateResultPDF } from "@/lib/pdf";
import type { Participant, BioStage, Gender } from "@/lib/types";
import { StageBadge } from "@/components/results/StageBadge";

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

// Percentile distribution for bell curve viz
function bellBars(userPctl: number): { pctl: number; height: number; isUser: boolean }[] {
  const buckets = [10, 25, 50, 75, 90];
  return buckets.map(p => ({
    pctl: p,
    height: p <= 50 ? (p / 50) * 100 : ((100 - p) / 50) * 100 + 50,
    isUser: Math.abs(p - userPctl) < 15,
  }));
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center"><div className="w-6 h-6 border-2 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" /></div>}>
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

  if (!p) return <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center"><p className="text-slate-400 text-sm">Loading results...</p></div>;

  const delta = p.age - p.biologicalAge;
  const stage = STAGE_MAP[p.bioStage];
  const n = norms(p.age, p.gender);
  const percentile = pctl(p.gripAvgKg, p.age, p.gender);
  const gDiff = p.gripAvgKg - p.expectedGrip;
  const gaugeOffset = 553 - (553 * Math.min(100, Math.max(5, 50 + delta * 3.3)) / 100);
  const bars = bellBars(percentile);

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(circle at 0% 0%, #e0f2f1 0%, transparent 50%), radial-gradient(circle at 100% 0%, #e3f2fd 0%, transparent 50%), radial-gradient(circle at 100% 100%, #f1f8e9 0%, transparent 50%), radial-gradient(circle at 0% 100%, #fce4ec 0%, transparent 50%), #f7f9fb" }}>

      {/* ═══ TOP BAR ═══ */}
      <header className="bg-white/60 backdrop-blur-xl flex justify-between items-center px-6 py-4 w-full z-50 sticky top-0 border-b border-white/20">
        <button onClick={() => router.push(`/event/${eventId}`)} className="text-slate-400 hover:text-slate-600 text-sm inline-flex items-center gap-1.5 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5m7-7l-7 7 7 7"/></svg>
          Back
        </button>
        <span className="text-sm font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Grip<span className="text-emerald-600">Age</span></span>
        <span className="text-xs text-slate-400">#{rank} of {total}</span>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* ═══ HERO: Bio Age Gauge + KPI Cards ═══ */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Gauge + Description */}
          <div className="lg:col-span-7 vcard rounded-[2rem] p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-8">
            {/* Circular Gauge */}
            <div className="relative w-40 h-40 sm:w-48 sm:h-48 shrink-0 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle cx="50%" cy="50%" r="44%" fill="transparent" stroke="#e6e8ea" strokeWidth="12" />
                <circle cx="50%" cy="50%" r="44%" fill="transparent" stroke="#10b981" strokeWidth="12"
                  strokeDasharray="553" strokeDashoffset={gaugeOffset} strokeLinecap="round" />
              </svg>
              <div className="text-center z-10">
                <span className="block text-4xl sm:text-5xl font-extrabold text-emerald-700 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans'" }}>{p.biologicalAge}</span>
                <span className="block text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400 mt-1">Bio Age</span>
              </div>
            </div>

            <div className="flex-1 space-y-3 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans'" }}>Grip Vitality Report</h1>
              <p className="text-slate-500 text-sm leading-relaxed max-w-md">
                Your grip strength indicates a biological age{" "}
                <span className="text-emerald-600 font-bold">{delta > 0 ? `${delta} years younger` : delta < 0 ? `${Math.abs(delta)} years older` : "matching your age"}</span>
                {" "}than your chronological age ({p.age}).
              </p>
              <div className="flex gap-2 justify-center sm:justify-start flex-wrap">
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold uppercase tracking-wider border border-emerald-100">{stage.label}</span>
                <span className="px-3 py-1 rounded-full bg-slate-50 text-slate-500 text-[10px] font-semibold uppercase tracking-wider border border-slate-100">Rank #{rank}</span>
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-3">
            <KPI icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>} value={`${p.gripAvgKg}`} unit="kg" label="Max Grip" />
            <KPI icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12h-4l-3 9L9 3l-3 9H2"/></svg>} value={`P${percentile}`} unit="" label="Percentile" />
            <div className="col-span-2 vcard rounded-3xl p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v18M3 12h18"/></svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans'" }}>{p.gripLeftKg !== null && p.gripRightKg !== null ? Math.abs(p.gripLeftKg - p.gripRightKg).toFixed(1) : "—"}<small className="text-sm font-medium ml-1 text-slate-400">kg diff</small></p>
                  <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400">Balance Score</p>
                </div>
              </div>
              <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-md border border-emerald-100">
                {p.gripLeftKg !== null && p.gripRightKg !== null && Math.abs(p.gripLeftKg - p.gripRightKg) <= 2 ? "SYMMETRIC" : "ASYMMETRIC"}
              </span>
            </div>
          </div>
        </section>

        {/* ═══ HAND BREAKDOWN + POPULATION COMPARISON ═══ */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Hand Breakdown */}
          <div className="vcard rounded-[2rem] p-6 sm:p-8">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6" style={{ fontFamily: "'Plus Jakarta Sans'" }}>Hand Breakdown</h2>
            <div className="space-y-6">
              {p.gripLeftKg !== null && (
                <HandBar label="Left Hand" value={p.gripLeftKg} expected={p.expectedGrip} max={n.high} />
              )}
              {p.gripRightKg !== null && (
                <HandBar label="Right Hand" value={p.gripRightKg} expected={p.expectedGrip} max={n.high} />
              )}
            </div>
            {p.gripLeftKg !== null && p.gripRightKg !== null && (
              <div className="mt-6 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100/50">
                <p className="text-sm text-slate-500 leading-relaxed">
                  {Math.abs(p.gripLeftKg - p.gripRightKg) <= 2
                    ? "Your balance is within the optimal range (< 5% difference), reducing risk of injury."
                    : `${Math.abs(p.gripLeftKg - p.gripRightKg).toFixed(1)}kg imbalance detected. Consider training your weaker hand.`}
                </p>
              </div>
            )}
          </div>

          {/* Population Comparison — Bell Curve */}
          <div className="vcard rounded-[2rem] p-6 sm:p-8 flex flex-col">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6" style={{ fontFamily: "'Plus Jakarta Sans'" }}>Grip Comparison</h2>
            <div className="flex-1 relative flex items-end gap-2 pb-6 min-h-[200px]">
              {bars.map((b, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 relative">
                  {b.isUser && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-center whitespace-nowrap">
                      <span className="text-emerald-600 font-bold text-xs block">YOU</span>
                      <svg width="10" height="10" viewBox="0 0 10 10" className="mx-auto text-emerald-500"><path d="M5 10L0 3h10z" fill="currentColor"/></svg>
                    </div>
                  )}
                  <div
                    className={`w-full rounded-t-xl transition-all ${b.isUser ? "bg-emerald-500/80" : "bg-slate-200/60 hover:bg-slate-200"}`}
                    style={{ height: `${b.height}%` }}
                  />
                  <span className={`text-[9px] font-bold ${b.isUser ? "text-emerald-600" : "text-slate-300"}`}>P{b.pctl}</span>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
              <span className="text-xs font-medium text-slate-400">vs. {p.gender === "male" ? "Men" : "Women"} {n.group}</span>
              <span className="text-xs font-bold text-emerald-600">{gDiff >= 0 ? "+" : ""}{((gDiff / p.expectedGrip) * 100).toFixed(0)}% vs Expected</span>
            </div>
          </div>
        </section>

        {/* ═══ STAGE + REFERENCE ═══ */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Your Badge */}
          <div className="vcard rounded-[2rem] p-6 sm:p-8">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-5" style={{ fontFamily: "'Plus Jakarta Sans'" }}>Your Badge</h2>
            <div className="flex items-center gap-4 mb-5">
              <StageBadge stage={p.bioStage} size="lg" />
              <div>
                <p className="font-bold text-lg" style={{ color: stage.color, fontFamily: "'Plus Jakarta Sans'" }}>{stage.label}</p>
                <p className="text-sm text-slate-400">{stage.description}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[9px] text-slate-400 uppercase tracking-wider">Expected</p>
                <p className="text-sm font-bold text-slate-700">{p.expectedGrip} kg</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[9px] text-slate-400 uppercase tracking-wider">Performance</p>
                <p className="text-sm font-bold" style={{ color: gDiff >= 0 ? "#059669" : "#dc2626" }}>{gDiff >= 0 ? "+" : ""}{gDiff.toFixed(1)} kg</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[9px] text-slate-400 uppercase tracking-wider">Standing</p>
                <p className="text-sm font-bold text-slate-700">Top {100 - percentile}%</p>
              </div>
            </div>
          </div>

          {/* Stage Reference */}
          <div className="vcard rounded-[2rem] p-6 sm:p-8">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-5" style={{ fontFamily: "'Plus Jakarta Sans'" }}>Stage Reference</h2>
            <div className="space-y-1">
              {STAGES.map(s => {
                const info = STAGE_MAP[s.l]; const cur = s.l === p.bioStage;
                return (
                  <div key={s.l} className={`flex items-center gap-3 py-2 px-3 rounded-xl ${cur ? "bg-emerald-50 border border-emerald-100" : ""}`}>
                    <StageBadge stage={s.l} size="sm" />
                    <span className="text-[10px] text-slate-300 w-16 shrink-0 font-mono">{s.r}</span>
                    <span className={`text-sm ${cur ? "font-bold text-emerald-700" : "text-slate-400"}`}>{s.l}{cur ? " ←" : ""}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ═══ LONGEVITY INSIGHT BANNER ═══ */}
        <section className="vcard rounded-[2rem] overflow-hidden">
          <div className="p-6 sm:p-10 space-y-4">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans'" }}>Longevity Insight</h3>
            <p className="text-slate-500 leading-relaxed text-sm max-w-xl">
              High grip strength is closely correlated with skeletal muscle mass and lower all-cause mortality.
              {percentile >= 50 ? ` Your current grip puts you in the top ${100 - percentile}% for your demographic — a strong indicator of healthspan.` : ` Building grip strength through targeted exercises can significantly improve your biological markers.`}
            </p>
            <button onClick={pdf} className="mt-2 px-6 py-3 bg-emerald-500 text-white font-bold rounded-full shadow-lg shadow-emerald-200/50 hover:bg-emerald-600 transition-all inline-flex items-center gap-2 text-sm">
              Download PDF Report
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14m-7-7l7 7-7 7"/></svg>
            </button>
          </div>
        </section>

        {/* Actions */}
        <div className="flex gap-3 pb-6">
          <button onClick={() => router.push(`/event/${eventId}/leaderboard`)} className="flex-1 py-3 rounded-full text-sm font-semibold border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-all">Leaderboard</button>
          <button onClick={() => router.push(`/event/${eventId}/register`)} className="flex-1 py-3 rounded-full text-sm font-medium border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all">Next Player →</button>
        </div>
      </main>
    </div>
  );
}

/* ─── Sub-components ─── */

function KPI({ icon, value, unit, label }: { icon: React.ReactNode; value: string; unit: string; label: string }) {
  return (
    <div className="vcard rounded-3xl p-5 flex flex-col justify-between min-h-[120px]">
      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">{icon}</div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans'" }}>{value}<small className="text-sm font-medium ml-1 text-slate-400">{unit}</small></p>
        <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function HandBar({ label, value, expected, max }: { label: string; value: number; expected: number; max: number }) {
  const pct = Math.min(100, (value / (max * 1.1)) * 100);
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{label}</span>
        <span className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans'" }}>{value}<small className="text-xs ml-1 font-normal text-slate-300">kg</small></span>
      </div>
      <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: value >= expected ? "#10b981" : "#f87171", boxShadow: value >= expected ? "0 0 12px rgba(16,185,129,0.3)" : "none" }} />
      </div>
    </div>
  );
}
