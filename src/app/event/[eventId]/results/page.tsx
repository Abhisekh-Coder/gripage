"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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

      {/* ═══ BANNER ═══ */}
      <div className="relative h-36 sm:h-44 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f1a10] via-[#0B0B0F] to-[#0B0B0F]" />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 20% 50%, rgba(74,222,128,0.06) 0%, transparent 50%)" }} />
        <div className="absolute bottom-0 inset-x-0 h-px bg-white/[0.05]" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 h-full flex flex-col justify-end pb-4">
          <button onClick={() => router.push(`/event/${eventId}`)} aria-label="Back" className="text-white/20 hover:text-white/40 text-[11px] inline-flex items-center gap-1 transition-colors mb-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5m7-7l-7 7 7 7"/></svg>
            Back to Event
          </button>
          <div className="flex items-end justify-between gap-4">
            <div className="flex items-center gap-3">
              <StageBadge stage={p.bioStage} size="md" />
              <div>
                <p className="text-white/25 text-[10px] uppercase tracking-wider">Results for</p>
                <h1 className="text-lg sm:text-xl font-black tracking-tight">{p.name}</h1>
              </div>
            </div>
            <div className="text-right text-[10px] text-white/20 shrink-0">
              <p>Rank <span className="text-white/50 font-bold">#{rank}</span> of {total}</p>
              <p>{p.gender} · {p.age}y · {p.heightCm}cm · {p.weightKg}kg</p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ CONTENT ═══ */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 space-y-3">

        {/* Row 1: Three key metrics */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <Card>
            <Label>Biological Age</Label>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl sm:text-3xl font-black">{p.biologicalAge}</span>
              <span className="text-[10px] text-white/20">years</span>
            </div>
            <p className="text-[10px] mt-1" style={{ color: delta >= 0 ? "#4ADE80" : "#f87171" }}>
              {delta > 0 ? `${delta}y younger` : delta < 0 ? `${Math.abs(delta)}y older` : "On track"}
            </p>
          </Card>
          <Card>
            <Label>Grip Strength</Label>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl sm:text-3xl font-black">{p.gripAvgKg}</span>
              <span className="text-[10px] text-white/20">kg</span>
            </div>
            <p className="text-[10px] mt-1" style={{ color: gDiff >= 0 ? "#4ADE80" : "#f87171" }}>
              {gDiff >= 0 ? "+" : ""}{gDiff.toFixed(1)} vs expected
            </p>
          </Card>
          <Card>
            <Label>Percentile</Label>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl sm:text-3xl font-black">P{percentile}</span>
            </div>
            <p className="text-[10px] text-white/25 mt-1">Top {100 - percentile}% of {p.gender === "male" ? "men" : "women"}</p>
          </Card>
        </div>

        {/* Row 2: Gauge + Bar Chart */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          <Card>
            <Label>Age Gauge</Label>
            <BioAgeGauge age={p.age} biologicalAge={p.biologicalAge} delta={delta} />
          </Card>
          <Card>
            <Label>Grip Comparison</Label>
            <GripBarChart grip={p.gripAvgKg} expected={p.expectedGrip} normLow={n.low} normAvg={n.avg} normHigh={n.high} gender={p.gender} ageGroup={n.group} />
          </Card>
        </div>

        {/* Row 3: Hand Breakdown */}
        {(p.gripLeftKg !== null || p.gripRightKg !== null) && (
          <Card>
            <Label>Hand Breakdown</Label>
            <HandComparison left={p.gripLeftKg} right={p.gripRightKg} expected={p.expectedGrip} />
          </Card>
        )}

        {/* Row 4: Stage + Reference */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          <Card>
            <Label>Your Stage</Label>
            <div className="flex items-center gap-3 mt-2 mb-3">
              <StageBadge stage={p.bioStage} size="lg" />
              <div>
                <p className="font-bold text-sm" style={{ color: stage.color }}>{stage.label}</p>
                <p className="text-[10px] text-white/25">{stage.description}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <StatBox label="Expected" value={`${p.expectedGrip} kg`} />
              <StatBox label="Performance" value={`${gDiff >= 0 ? "+" : ""}${gDiff.toFixed(1)} kg`} color={gDiff >= 0 ? "#4ADE80" : "#f87171"} />
              <StatBox label="Standing" value={`Top ${100 - percentile}%`} />
            </div>
          </Card>

          <Card>
            <Label>Stage Reference</Label>
            <div className="space-y-0.5 mt-1">
              {STAGES.map(s => {
                const info = STAGE_MAP[s.l]; const cur = s.l === p.bioStage;
                return (
                  <div key={s.l} className={`flex items-center gap-2 py-1 px-1.5 rounded text-[11px] ${cur ? "bg-white/[0.04]" : ""}`}>
                    <StageBadge stage={s.l} size="sm" />
                    <span className="text-[9px] text-white/12 w-14 shrink-0 font-mono">{s.r}</span>
                    <span className={cur ? "font-bold" : "text-white/20"} style={cur ? { color: info.color } : {}}>{s.l}{cur ? " ←" : ""}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 pt-1 pb-6">
          <button onClick={pdf} className="btn-primary flex-1 py-3 rounded-xl text-sm font-bold">Download PDF Report</button>
          <button onClick={() => router.push(`/event/${eventId}/leaderboard`)} className="btn-outline-accent flex-1 py-3 rounded-xl text-sm font-semibold">Leaderboard</button>
          <button onClick={() => router.push(`/event/${eventId}/register`)} className="btn-secondary flex-1 py-3 rounded-xl text-sm">Next Player →</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Simple sub-components ─── */

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl p-3 sm:p-4 bg-white/[0.025] border border-white/[0.05]">{children}</div>;
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[9px] text-white/25 font-semibold uppercase tracking-[0.1em]">{children}</p>;
}

function StatBox({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="p-2 rounded-lg bg-white/[0.02]">
      <p className="text-[8px] text-white/15">{label}</p>
      <p className="text-[11px] font-semibold" style={{ color: color || "rgba(255,255,255,0.4)" }}>{value}</p>
    </div>
  );
}
