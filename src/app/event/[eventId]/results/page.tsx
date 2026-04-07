"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getParticipant, getParticipants } from "@/lib/store";
import { STAGE_MAP, calculateBiologicalAge } from "@/lib/formula";
import { generateResultPDF } from "@/lib/pdf";
import type { Participant, BioStage } from "@/lib/types";
import {
  RadialBarChart, RadialBar, PolarAngleAxis,
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
  BarChart, Bar, Cell, Line
} from "recharts";
import { ArrowLeft, Download, Trophy, ChevronRight, Activity, Gauge, TrendingUp, Info } from "lucide-react";

const stages: { label: BioStage; min: number; color: string; bg: string }[] = [
  { label: "Elite Vitality", min: 10, color: "#34d399", bg: "rgba(52,211,153,0.1)" },
  { label: "Peak Fitness", min: 6, color: "#10b981", bg: "rgba(16,185,129,0.1)" },
  { label: "Above Average", min: 3, color: "#4ade80", bg: "rgba(74,222,128,0.1)" },
  { label: "On Track", min: -2, color: "#64748b", bg: "rgba(100,116,139,0.1)" },
  { label: "Below Average", min: -5, color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  { label: "Needs Attention", min: -10, color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
  { label: "Critical Gap", min: -Infinity, color: "#991b1b", bg: "rgba(153,27,27,0.1)" },
];
const rangeLabels = ["> +10", "+6 to +10", "+3 to +5", "−2 to +2", "−5 to −3", "−10 to −6", "< −10"];
const getStage = (d: number) => stages.find(s => d >= s.min)!;

function pctl(grip: number, age: number, gender: string) {
  const m: Record<string, [number, number, number]> = { "17-29": [35, 45, 55], "30-39": [33, 43, 53], "40-49": [30, 40, 50], "50-59": [26, 36, 46], "60-69": [22, 32, 42], "70+": [18, 27, 37] };
  const f: Record<string, [number, number, number]> = { "17-29": [20, 28, 36], "30-39": [19, 27, 35], "40-49": [18, 25, 33], "50-59": [15, 22, 30], "60-69": [13, 19, 26], "70+": [10, 16, 22] };
  const t = gender === "male" ? m : f;
  let g = "17-29";
  if (age >= 70) g = "70+"; else if (age >= 60) g = "60-69"; else if (age >= 50) g = "50-59"; else if (age >= 40) g = "40-49"; else if (age >= 30) g = "30-39";
  const [low,avg,high] = t[g];
  const z = (grip - avg) / ((high - low) / 3);
  return { pctl: Math.round(Math.min(99, Math.max(1, 100 / (1 + Math.exp(-1.7 * z))))), low, avg, high, group: g };
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0B0B0F] flex items-center justify-center"><div className="w-6 h-6 border-2 border-white/10 border-t-[#10b981] rounded-full animate-spin" /></div>}>
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
  const stage = getStage(delta);
  const grip = p.gripAvgKg;
  const { pctl: percentile, avg: normAvg, high: normHigh, group: ageGroup } = pctl(grip, p.age, p.gender);
  const gDiff = grip - p.expectedGrip;

  // Grip-by-age curve data
  const curveData = Array.from({ length: 50 }, (_, i) => {
    const a = 18 + i;
    const exp = calculateBiologicalAge(p.gender, p.heightCm, p.weightKg, a, 0).expectedGrip;
    return { age: a, expected: +exp.toFixed(1), you: a === p.age ? grip : undefined };
  });

  // What-if sensitivity
  const sensitivity = Array.from({ length: 21 }, (_, i) => {
    const g = grip - 10 + i;
    const r = calculateBiologialAge_safe(p, g);
    return { grip: g, bioAge: r, isYou: g === Math.round(grip) };
  });

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-white p-4 sm:p-6" style={{ fontFamily: "'Inter', system-ui" }}>
      <div className="max-w-[1400px] mx-auto">

        {/* HEADER */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push(`/event/${eventId}`)} className="w-10 h-10 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.08] transition-colors">
              <ArrowLeft className="w-4 h-4 text-white/60" />
            </button>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-white/30 font-semibold">Grip Vitality Report</div>
              <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight">{p.name}</h1>
              <div className="text-xs text-white/40 mt-0.5">
                {p.gender} · {p.age}y · {p.heightCm}cm · {p.weightKg}kg
                <span className="mx-2 text-white/10">•</span>
                <span className="inline-flex items-center gap-1 text-[#10b981] font-semibold">
                  <Trophy className="w-3 h-3" /> Rank #{rank} of {total}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={pdf} className="px-4 py-2.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-sm font-semibold text-white/70 hover:bg-white/[0.08] flex items-center gap-2 transition-colors">
              <Download className="w-3.5 h-3.5" /> PDF
            </button>
            <button onClick={() => router.push(`/event/${eventId}/register`)} className="px-4 py-2.5 rounded-full bg-[#10b981] text-black text-sm font-bold flex items-center gap-1 hover:bg-[#0ea472] transition-colors">
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* KPI STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <KPI icon={<Gauge className="w-3.5 h-3.5" />} label="Bio Age" value={String(p.biologicalAge)} sub={`${Math.abs(delta)}y ${delta >= 0 ? "younger" : "older"}`} accent />
          <KPI icon={<Activity className="w-3.5 h-3.5" />} label="Max Grip" value={String(grip)} unit="kg" sub={`Expected ${p.expectedGrip}kg`} />
          <KPI icon={<TrendingUp className="w-3.5 h-3.5" />} label="Standing" value={`Top ${100 - percentile}%`} sub={`${p.gender === "male" ? "Men" : "Women"} aged ${ageGroup}`} />
          <KPI icon={<Activity className="w-3.5 h-3.5" />} label="Balance" value={p.gripLeftKg !== null && p.gripRightKg !== null ? Math.abs(p.gripLeftKg - p.gripRightKg).toFixed(1) : "—"} unit="kg" sub={`L ${p.gripLeftKg ?? "—"} · R ${p.gripRightKg ?? "—"}`} />
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

          {/* BIO AGE GAUGE */}
          <div className="card lg:col-span-5 p-6 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-[#10b981]/5 blur-3xl" />
            <div className="relative">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-white/30 font-semibold">Biological Age</div>
                  <div className="text-[10px] text-white/20 mt-0.5">Derived from grip strength model</div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md" style={{ background: stage.bg, color: stage.color }}>{stage.label}</span>
              </div>

              <div className="h-56 relative">
                <ResponsiveContainer>
                  <RadialBarChart innerRadius="72%" outerRadius="100%" data={[{ value: Math.max(0, Math.min(100, 50 + delta * 3.33)) }]} startAngle={210} endAngle={-30}>
                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                    <RadialBar dataKey="value" cornerRadius={20} fill="#10b981" background={{ fill: "rgba(255,255,255,0.04)" }} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                  <div className="text-6xl font-black text-white leading-none">{p.biologicalAge}</div>
                  <div className="text-[10px] uppercase tracking-widest text-white/25 mt-1">Bio Age</div>
                  <div className="text-xs text-white/40 mt-0.5">Chrono: {p.age}</div>
                </div>
              </div>

              <div className="flex justify-between text-[9px] text-white/20 px-4 -mt-1"><span>OLDER</span><span>YOUNGER</span></div>

              <div className="mt-4 pt-4 border-t border-white/[0.05] flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-white/30">Grip vs Expected</div>
                  <div className="text-xl font-black" style={{ color: gDiff >= 0 ? "#10b981" : "#ef4444" }}>{gDiff >= 0 ? "+" : ""}{gDiff.toFixed(1)} kg</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-white/30">Age Delta</div>
                  <div className="text-xl font-black text-white">{delta > 0 ? "−" : "+"}{Math.abs(delta)} yrs</div>
                </div>
              </div>
            </div>
          </div>

          {/* GRIP TRAJECTORY CURVE */}
          <div className="card lg:col-span-7 p-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-white/30 font-semibold">Grip Trajectory</div>
                <div className="text-lg font-bold text-white mt-0.5">You vs. Population Norm</div>
              </div>
              <div className="flex gap-3 text-[10px]">
                <span className="flex items-center gap-1 text-white/30"><span className="w-3 h-px bg-white/20" />Expected</span>
                <span className="flex items-center gap-1 text-[#10b981] font-semibold"><span className="w-2 h-2 rounded-full bg-[#10b981]" />You</span>
              </div>
            </div>
            <div className="h-48">
              <ResponsiveContainer>
                <AreaChart data={curveData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="age" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.2)" }} tickLine={false} axisLine={{ stroke: "rgba(255,255,255,0.05)" }} />
                  <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.2)" }} tickLine={false} axisLine={false} domain={[10, 55]} />
                  <Tooltip contentStyle={{ background: "#1a1a1f", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, color: "#fff", fontSize: 11 }} />
                  <Area type="monotone" dataKey="expected" stroke="rgba(255,255,255,0.15)" strokeWidth={2} fill="url(#gA)" strokeDasharray="4 4" />
                  <ReferenceLine x={p.age} stroke="#10b981" strokeDasharray="2 2" strokeOpacity={0.4} />
                  <Line type="monotone" dataKey="you" stroke="#10b981" strokeWidth={0} dot={{ r: 7, fill: "#10b981", stroke: "#0B0B0F", strokeWidth: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 p-3 bg-[#10b981]/5 border border-[#10b981]/10 rounded-xl text-xs text-[#10b981]/80 flex gap-2">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              At age {p.age}, your grip of <b>{grip}kg</b> matches the expected strength of a <b>{p.biologicalAge}-year-old</b>.
            </div>
          </div>

          {/* HAND BREAKDOWN */}
          <div className="card lg:col-span-4 p-6">
            <div className="text-[10px] uppercase tracking-widest text-white/30 font-semibold mb-4">Hand Breakdown</div>
            <div className="flex items-end justify-around gap-4 h-40">
              {[{ label: "Left", val: p.gripLeftKg }, { label: "Right", val: p.gripRightKg }].filter(h => h.val !== null).map(h => (
                <div key={h.label} className="flex flex-col items-center flex-1">
                  <div className="text-2xl font-black text-white mb-2">{h.val}</div>
                  <div className="w-full relative flex items-end" style={{ height: 90 }}>
                    <div className="w-full bg-white/[0.03] rounded-t-xl" style={{ height: "100%" }} />
                    <div className="absolute bottom-0 w-full rounded-t-xl bg-gradient-to-t from-[#10b981] to-[#34d399]" style={{ height: `${((h.val ?? 0) / (normHigh * 1.1)) * 100}%` }} />
                  </div>
                  <div className="text-[10px] text-white/30 mt-2">{h.label}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-white/[0.05] flex justify-between text-[10px]">
              <span className="text-white/30">Symmetry</span>
              <span className="font-semibold text-[#10b981]">
                {p.gripLeftKg !== null && p.gripRightKg !== null ? `${Math.abs(p.gripLeftKg - p.gripRightKg).toFixed(1)} kg · ${Math.abs(p.gripLeftKg - p.gripRightKg) <= 2 ? "Balanced" : "Imbalanced"}` : "—"}
              </span>
            </div>
          </div>

          {/* COMPARISON BARS */}
          <div className="card lg:col-span-4 p-6">
            <div className="text-[10px] uppercase tracking-widest text-white/30 font-semibold mb-4">Grip Comparison</div>
            {[
              { label: "You", val: grip, color: "#10b981", bold: true },
              { label: "Expected", val: p.expectedGrip, color: "rgba(255,255,255,0.15)", bold: false },
              { label: `Avg ${p.gender === "male" ? "Male" : "Female"} ${ageGroup}`, val: normAvg, color: "rgba(255,255,255,0.08)", bold: false },
              { label: "Strong (P90)", val: normHigh, color: "rgba(255,255,255,0.06)", bold: false },
            ].map(r => (
              <div key={r.label} className="mb-3 last:mb-0">
                <div className="flex justify-between text-[10px] mb-1">
                  <span className={r.bold ? "font-semibold text-white" : "text-white/30"}>{r.label}</span>
                  <span className={r.bold ? "font-semibold text-white" : "text-white/30"}>{r.val} kg</span>
                </div>
                <div className="h-2 bg-white/[0.03] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(r.val / (normHigh * 1.1)) * 100}%`, background: r.color }} />
                </div>
              </div>
            ))}
            <div className="mt-4 pt-3 border-t border-white/[0.05] flex items-center justify-between">
              <div>
                <div className="text-[10px] text-white/25">Standing</div>
                <div className="text-2xl font-black text-[#10b981]">Top {100 - percentile}%</div>
              </div>
              <div className="text-right text-[10px] text-white/25">Top {100 - percentile}%<br />{p.gender === "male" ? "Men" : "Women"} {ageGroup}</div>
            </div>
          </div>

          {/* STAGE REFERENCE */}
          <div className="card lg:col-span-4 p-6">
            <div className="text-[10px] uppercase tracking-widest text-white/30 font-semibold mb-4">Stage Reference</div>
            <div className="space-y-1">
              {stages.map((s, i) => {
                const active = s.label === (STAGE_MAP[p.bioStage]?.label || p.bioStage);
                return (
                  <div key={s.label} className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-all" style={{ background: active ? s.bg : "transparent" }}>
                    <div className="w-1 h-6 rounded-full" style={{ background: s.color }} />
                    <div className="text-[10px] text-white/15 font-mono w-16">{rangeLabels[i]}</div>
                    <div className={`text-xs flex-1 ${active ? "font-bold" : "text-white/30"}`} style={{ color: active ? s.color : undefined }}>{s.label}</div>
                    {active && <ChevronRight className="w-3.5 h-3.5" style={{ color: s.color }} />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* SENSITIVITY MODEL */}
          <div className="card lg:col-span-7 p-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-white/30 font-semibold">Sensitivity Model</div>
                <div className="text-lg font-bold text-white mt-0.5">Bio Age vs. Grip Strength</div>
                <div className="text-[10px] text-white/20">How your biological age shifts per kg</div>
              </div>
            </div>
            <div className="h-44">
              <ResponsiveContainer>
                <BarChart data={sensitivity} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <XAxis dataKey="grip" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.2)" }} tickLine={false} axisLine={{ stroke: "rgba(255,255,255,0.05)" }} interval={4} />
                  <YAxis tick={{ fontSize: 9, fill: "rgba(255,255,255,0.2)" }} tickLine={false} axisLine={false} domain={[Math.min(...sensitivity.map(s => s.bioAge)) - 2, Math.max(...sensitivity.map(s => s.bioAge)) + 2]} />
                  <Tooltip contentStyle={{ background: "#1a1a1f", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, color: "#fff", fontSize: 11 }} formatter={(v) => [`${v} yrs`, "Bio Age"]} labelFormatter={(v) => `Grip ${v}kg`} />
                  <ReferenceLine y={p.age} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
                  <Bar dataKey="bioAge" radius={[4, 4, 0, 0]}>
                    {sensitivity.map((d, i) => (
                      <Cell key={i} fill={d.isYou ? "#059669" : d.bioAge < p.age ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.2)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* EVENT COHORT */}
          <div className="card lg:col-span-5 p-6">
            <div className="text-[10px] uppercase tracking-widest text-white/30 font-semibold mb-1">Event Leaderboard</div>
            <div className="text-lg font-bold text-white mb-4">Your Position</div>
            <div className="flex items-center gap-3 mb-4">
              <div className="text-3xl font-black text-[#10b981]">#{rank}</div>
              <div className="text-xs text-white/30">of {total} participants</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => router.push(`/event/${eventId}/leaderboard`)} className="flex-1 py-2.5 rounded-xl text-xs font-semibold border border-[#10b981]/20 text-[#10b981] hover:bg-[#10b981]/5 transition-colors">View Leaderboard</button>
              <button onClick={() => router.push(`/event/${eventId}/register`)} className="flex-1 py-2.5 rounded-xl text-xs font-medium border border-white/[0.06] text-white/40 hover:bg-white/[0.03] transition-colors">Next Player →</button>
            </div>
          </div>
        </div>

        <footer className="text-center text-[10px] text-white/15 mt-6 pb-4">
          Model anchored to LASI Indian population norms · Grip represents one biological system · Dampened 0.4× · Clamped ±15y
        </footer>
      </div>
    </div>
  );
}

/* ─── KPI Card ─── */
function KPI({ icon, label, value, unit, sub, accent }: { icon: React.ReactNode; label: string; value: string; unit?: string; sub: string; accent?: boolean }) {
  return (
    <div className={accent ? "rounded-2xl p-4" : "card p-4"} style={accent ? { background: "linear-gradient(135deg, #064e3b, #047857)" } : {}}>
      <div className={`flex items-center gap-1.5 text-[9px] uppercase tracking-widest font-semibold ${accent ? "text-emerald-300" : "text-white/25"}`}>
        {icon}{label}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className={`text-3xl font-black ${accent ? "text-white" : "text-white"}`}>{value}</span>
        {unit && <span className={`text-sm ${accent ? "text-emerald-200" : "text-white/25"}`}>{unit}</span>}
      </div>
      <div className={`text-[10px] mt-0.5 ${accent ? "text-emerald-200" : "text-white/30"}`}>{sub}</div>
    </div>
  );
}

/* ─── Sensitivity helper ─── */
function calculateBiologialAge_safe(p: Participant, gripOverride: number): number {
  try {
    const r = calculateBiologicalAge(p.gender, p.heightCm, p.weightKg, p.age, gripOverride);
    return r.biologicalAge;
  } catch {
    return p.age;
  }
}
