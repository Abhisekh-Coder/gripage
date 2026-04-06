"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { getParticipant, getParticipants } from "@/lib/store";
import { STAGE_MAP } from "@/lib/formula";
import { generateResultPDF } from "@/lib/pdf";
import type { Participant, BioStage, Gender } from "@/lib/types";
import { StageBadge } from "@/components/results/StageBadge";
import { BioAgeGauge } from "@/components/results/BioAgeGauge";
import { GripBarChart } from "@/components/results/GripBarChart";
import { HandComparison } from "@/components/results/HandComparison";

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

  return (
    <div className="min-h-screen bg-[#0B0B0F]">

      {/* ═══ BANNER — Full width with image ═══ */}
      <div className="relative h-48 sm:h-56 overflow-hidden">
        <Image src="/hero-gym.jpg" alt="" fill className="object-cover object-center opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0F] via-[#0B0B0F]/70 to-[#0B0B0F]/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0F]/60 to-transparent" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 h-full flex flex-col justify-end pb-5">
          <button onClick={() => router.push(`/event/${eventId}`)} aria-label="Back" className="text-white/25 hover:text-white/50 text-[11px] inline-flex items-center gap-1 transition-colors mb-3">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5m7-7l-7 7 7 7"/></svg>
            Back to Event
          </button>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight uppercase">{p.name}</h1>
          <div className="flex items-center gap-4 mt-1.5 flex-wrap">
            <span className="text-sm text-white/40">{p.gender} — {p.age}y</span>
            <span className="text-sm text-white/40">Weight — {p.weightKg}kg</span>
            <span className="text-sm text-white/40">Height — {p.heightCm}cm</span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-white/70 mt-3">Rank <span className="text-white">#{rank}</span> of {total}</p>
        </div>
      </div>

      {/* ═══ CONTENT ═══ */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 space-y-3">

        {/* Row 1: Age Gauge + Grip Comparison — side by side (as in wireframe) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Card label="Age Gauge">
            <BioAgeGauge age={p.age} biologicalAge={p.biologicalAge} delta={delta} />
          </Card>
          <Card label="Grip Comparison">
            <GripBarChart grip={p.gripAvgKg} expected={p.expectedGrip} normLow={n.low} normAvg={n.avg} normHigh={n.high} gender={p.gender} ageGroup={n.group} />
          </Card>
        </div>

        {/* Row 2: Hand Breakdown + Percentile — side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Card label="Hand Breakdown">
            <HandComparison left={p.gripLeftKg} right={p.gripRightKg} expected={p.expectedGrip} />
          </Card>
          <Card label="Percentile">
            <div className="flex items-center gap-6 py-2">
              {/* You vs Expected — simple visual bars */}
              <div className="flex-1 space-y-3">
                <div>
                  <div className="flex justify-between text-[10px] text-white/30 mb-1">
                    <span>You</span>
                    <span>{p.gripAvgKg} kg</span>
                  </div>
                  <div className="h-3 rounded-full bg-white/[0.04]">
                    <div className="h-full rounded-full bg-[#4ADE80]" style={{ width: `${Math.min(100, (p.gripAvgKg / (n.high * 1.1)) * 100)}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-white/20 mb-1">
                    <span>Expected</span>
                    <span>{p.expectedGrip} kg</span>
                  </div>
                  <div className="h-3 rounded-full bg-white/[0.04]">
                    <div className="h-full rounded-full bg-white/10" style={{ width: `${Math.min(100, (p.expectedGrip / (n.high * 1.1)) * 100)}%` }} />
                  </div>
                </div>
              </div>
              {/* Percentile number */}
              <div className="text-center shrink-0">
                <p className="text-3xl sm:text-4xl font-black text-[#4ADE80]">P{percentile}</p>
                <p className="text-[10px] text-white/25 mt-0.5">Top {100 - percentile}%</p>
                <p className="text-[9px] text-white/15">{p.gender === "male" ? "Men" : "Women"} {n.group}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Row 3: Your Badge + Stage Reference — side by side (as in wireframe) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Your Badge — large centered badge */}
          <Card label="Your Badge">
            <div className="flex flex-col items-center py-3">
              <StageBadge stage={p.bioStage} size="lg" />
              <p className="font-bold text-sm mt-3" style={{ color: stage.color }}>{stage.label}</p>
              <p className="text-[10px] text-white/25 mt-0.5">{stage.description}</p>
            </div>
            <div className="grid grid-cols-3 gap-1.5 mt-3">
              <StatBox label="Expected" value={`${p.expectedGrip}kg`} />
              <StatBox label="Performance" value={`${gDiff >= 0 ? "+" : ""}${gDiff.toFixed(1)}kg`} color={gDiff >= 0 ? "#4ADE80" : "#f87171"} />
              <StatBox label="Standing" value={`Top ${100 - percentile}%`} />
            </div>
          </Card>

          {/* Stage Reference — with mini badges */}
          <Card label="Stage Reference">
            <div className="space-y-1 mt-1">
              {STAGES.map(s => {
                const info = STAGE_MAP[s.l]; const cur = s.l === p.bioStage;
                return (
                  <div key={s.l} className={`flex items-center gap-2.5 py-1.5 px-2 rounded-lg ${cur ? "bg-white/[0.04]" : ""}`}>
                    <StageBadge stage={s.l} size="sm" />
                    <span className="text-[10px] text-white/15 w-16 shrink-0 font-mono">{s.r}</span>
                    <span className={`text-sm ${cur ? "font-bold" : "text-white/20"}`} style={cur ? { color: info.color } : {}}>{s.l}{cur ? " ←" : ""}</span>
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

function Card({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-3 sm:p-4 bg-white/[0.025] border border-white/[0.05]">
      <p className="text-[9px] text-white/25 font-semibold uppercase tracking-[0.1em] mb-2">{label}</p>
      {children}
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.03]">
      <p className="text-[8px] text-white/15">{label}</p>
      <p className="text-[11px] font-semibold" style={{ color: color || "rgba(255,255,255,0.4)" }}>{value}</p>
    </div>
  );
}
