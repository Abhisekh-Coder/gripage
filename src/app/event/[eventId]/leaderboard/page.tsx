"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getEvent, getParticipants } from "@/lib/store";
import { STAGE_MAP } from "@/lib/formula";
import type { Participant, LeaderboardView, AgeGroup, Gender, GripEvent } from "@/lib/types";

export default function LeaderboardPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<GripEvent | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [view, setView] = useState<LeaderboardView>("delta");
  const [genderFilter, setGenderFilter] = useState<Gender | "all">("all");
  const [ageGroup, setAgeGroup] = useState<AgeGroup>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    getEvent(eventId).then((e) => setEvent(e));
    loadParticipants();
    const interval = setInterval(loadParticipants, 5000);
    return () => clearInterval(interval);
  }, [eventId]);

  function loadParticipants() {
    getParticipants(eventId).then(setParticipants);
  }

  const filtered = participants.filter((p) => {
    if (genderFilter !== "all" && p.gender !== genderFilter) return false;
    if (ageGroup === "17-29" && (p.age < 17 || p.age > 29)) return false;
    if (ageGroup === "30-39" && (p.age < 30 || p.age > 39)) return false;
    if (ageGroup === "40-49" && (p.age < 40 || p.age > 49)) return false;
    if (ageGroup === "50+" && p.age < 50) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (view === "delta") return (b.age - b.biologicalAge) - (a.age - a.biologicalAge);
    return b.gripAvgKg - a.gripAvgKg;
  });

  const views: { key: LeaderboardView; label: string; icon: string }[] = [
    { key: "delta", label: "Biggest Delta", icon: "⚡" },
    { key: "strongest", label: "Strongest Grip", icon: "💪" },
  ];


  // Top 3 separate from rest
  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  return (
    <div className="min-h-screen bg-[#0B0B0F]">

      {/* ═══ GRADIENT HERO BANNER with Top Rankers ═══ */}
      <div className="relative overflow-hidden">
        {/* Animated grain gradient background */}
        <div className="absolute inset-0" style={{
          background: "linear-gradient(135deg, #0a2818 0%, #0B0B0F 30%, #0f0a28 60%, #0B0B0F 100%)",
        }} />
        <div className="absolute inset-0 opacity-30" style={{
          background: "radial-gradient(ellipse at 25% 50%, rgba(74,222,128,0.15) 0%, transparent 50%), radial-gradient(ellipse at 75% 30%, rgba(99,102,241,0.12) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(177,158,239,0.08) 0%, transparent 50%)",
        }} />
        {/* Noise grain overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: "128px 128px",
        }} />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-8">
          {/* Back + header */}
          <button onClick={() => router.push(`/event/${eventId}`)} aria-label="Back" className="text-white/25 hover:text-white/50 text-[11px] inline-flex items-center gap-1 transition-colors mb-4">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5m7-7l-7 7 7 7"/></svg>
            Back to Event
          </button>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Leaderboard</h1>
              {event && <p className="text-white/25 text-sm mt-0.5">{event.name} · {sorted.length} participants</p>}
            </div>
          </div>

          {/* ═══ TOP 3 PODIUM ═══ */}
          {top3.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-2">
              {/* 2nd place */}
              <div className="order-1 self-end">
                {top3[1] && (
                  <div className="rounded-xl p-3 sm:p-4 bg-white/[0.04] border border-white/[0.08] text-center backdrop-blur-sm">
                    <p className="text-[10px] text-white/20 font-bold">2ND</p>
                    <div className="w-10 h-10 rounded-full bg-white/[0.06] flex items-center justify-center text-sm font-bold text-white/40 mx-auto mt-2">
                      {top3[1].name.charAt(0)}
                    </div>
                    <p className="font-semibold text-xs mt-2 truncate">{top3[1].name}</p>
                    <p className="text-lg font-black text-white/60 mt-0.5">{getMetric(top3[1], view)}</p>
                    <p className="text-[9px] text-white/15">{top3[1].bioStage}</p>
                  </div>
                )}
              </div>

              {/* 1st place — tallest */}
              <div className="order-2">
                {top3[0] && (
                  <div className="rounded-xl p-4 sm:p-5 bg-white/[0.06] border border-[#4ADE80]/15 text-center backdrop-blur-sm">
                    <p className="text-[10px] text-[#4ADE80]/50 font-bold">1ST</p>
                    <div className="w-12 h-12 rounded-full bg-[#4ADE80]/10 border border-[#4ADE80]/20 flex items-center justify-center text-base font-bold text-[#4ADE80]/70 mx-auto mt-2">
                      {top3[0].name.charAt(0)}
                    </div>
                    <p className="font-bold text-sm mt-2 truncate">{top3[0].name}</p>
                    <p className="text-2xl font-black text-[#4ADE80] mt-1">{getMetric(top3[0], view)}</p>
                    <p className="text-[10px] text-white/20">{top3[0].bioStage} · Age {top3[0].age}</p>
                  </div>
                )}
              </div>

              {/* 3rd place */}
              <div className="order-3 self-end">
                {top3[2] && (
                  <div className="rounded-xl p-3 sm:p-4 bg-white/[0.04] border border-white/[0.08] text-center backdrop-blur-sm">
                    <p className="text-[10px] text-white/20 font-bold">3RD</p>
                    <div className="w-10 h-10 rounded-full bg-white/[0.06] flex items-center justify-center text-sm font-bold text-white/40 mx-auto mt-2">
                      {top3[2].name.charAt(0)}
                    </div>
                    <p className="font-semibold text-xs mt-2 truncate">{top3[2].name}</p>
                    <p className="text-lg font-black text-white/60 mt-0.5">{getMetric(top3[2], view)}</p>
                    <p className="text-[9px] text-white/15">{top3[2].bioStage}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ LIST SECTION ═══ */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5">

        {/* Tabs + Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex gap-1">
            {views.map((v) => (
              <button key={v.key} onClick={() => setView(v.key)}
                className={`py-2 px-4 rounded-lg text-xs font-semibold transition-all ${view === v.key ? "bg-white/[0.08] text-white" : "text-white/25 hover:text-white/50"}`}>
                {v.label}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5 flex-wrap flex-1">
            {(["all", "male", "female"] as const).map((g) => (
              <FilterChip key={g} label={g === "all" ? "All" : g === "male" ? "Male" : "Female"} active={genderFilter === g} onClick={() => setGenderFilter(g)} />
            ))}
            <span className="w-px bg-white/5 mx-0.5" />
            {(["all", "17-29", "30-39", "40-49", "50+"] as AgeGroup[]).map((ag) => (
              <FilterChip key={ag} label={ag === "all" ? "All Ages" : ag} active={ageGroup === ag} onClick={() => setAgeGroup(ag)} />
            ))}
          </div>
        </div>

        {/* Search */}
        <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full py-2 px-4 bg-white/[0.03] border border-white/[0.05] rounded-lg text-white text-sm placeholder:text-white/15 focus:outline-none focus:border-white/10 transition-all mb-4" />

        {/* Participant list (4th onwards) */}
        <div className="space-y-1.5">
          {rest.map((p, i) => {
            const isHighlighted = searchQuery && p.name.toLowerCase().includes(searchQuery.toLowerCase());
            return <LeaderboardRow key={p.id} rank={i + 4} participant={p} view={view} highlighted={!!isHighlighted} />;
          })}

          {sorted.length === 0 && (
            <div className="rounded-xl p-12 text-center bg-white/[0.02]">
              <p className="text-white/30">No participants yet</p>
            </div>
          )}

          {sorted.length > 0 && rest.length === 0 && (
            <div className="rounded-xl p-8 text-center bg-white/[0.02]">
              <p className="text-white/20 text-sm">Only top {top3.length} participants so far</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all ${
        active ? "bg-white/[0.08] text-white" : "text-white/20 hover:text-white/40"
      }`}
    >
      {label}
    </button>
  );
}

function getMetric(p: Participant, view: LeaderboardView): string {
  if (view === "delta") {
    const d = p.age - p.biologicalAge;
    return d >= 0 ? `${d}y younger` : `${Math.abs(d)}y older`;
  }
  return `${p.gripAvgKg} kg`;
}

function LeaderboardRow({ rank, participant: p, view, highlighted }: { rank: number; participant: Participant; view: LeaderboardView; highlighted: boolean }) {
  const delta = p.age - p.biologicalAge;

  return (
    <div className={`rounded-xl p-3 flex items-center gap-3 transition-all bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] ${highlighted ? "border-white/[0.12]" : ""}`}>
      <span className="w-8 text-center text-xs font-bold text-white/20 shrink-0">
        {rank <= 3 ? <span className="text-white/50">#{rank}</span> : `#${rank}`}
      </span>

      <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-xs font-bold text-white/40 shrink-0">
        {p.name.charAt(0).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{p.name}</p>
        <p className="text-[10px] text-white/20">Age {p.age} · {p.gender} · {p.gripAvgKg}kg</p>
      </div>

      <div className="text-right shrink-0">
        <p className="font-bold text-sm text-white/70">
          {view === "delta" ? (delta > 0 ? `${delta}y younger` : delta < 0 ? `${Math.abs(delta)}y older` : "On track") : `${p.gripAvgKg} kg`}
        </p>
        <p className="text-[10px] text-white/15">{p.bioStage}</p>
      </div>
    </div>
  );
}

