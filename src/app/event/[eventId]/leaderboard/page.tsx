"use client";

import { useEffect, useState, useRef } from "react";
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
  const [isProjector, setIsProjector] = useState(false);
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

  if (isProjector) {
    return <ProjectorMode event={event} sorted={sorted} view={view} onExit={() => setIsProjector(false)} />;
  }

  return (
    <div className="min-h-screen relative bg-[#0B0B0F] overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] pointer-events-none" style={{ background: "radial-gradient(ellipse at 80% 10%, rgba(56,189,248,0.08) 0%, transparent 70%)" }} />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] pointer-events-none" style={{ background: "radial-gradient(ellipse at 20% 90%, rgba(74,222,128,0.05) 0%, transparent 60%)" }} />

      <div className="relative z-10 min-h-screen p-4 lg:p-8">
        <div className="page-enter max-w-5xl mx-auto">

          {/* Header */}
          <div className="mb-6">
            <button onClick={() => router.push(`/event/${eventId}`)} aria-label="Back to event" className="text-white/30 hover:text-white/60 text-sm mb-4 inline-flex items-center gap-1.5 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5m7-7l-7 7 7 7"/></svg>
              Back to Event
            </button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl lg:text-3xl font-black">Leaderboard</h1>
                {event && <p className="text-white/30 text-sm mt-1">{event.name}</p>}
              </div>
              <button
                onClick={() => setIsProjector(true)}
                className="px-4 py-2 rounded-2xl text-sm bg-white/[0.04] border border-white/[0.06] text-white/50 hover:text-white hover:bg-white/[0.06] transition-all hidden sm:block"
              >
                Projector Mode
              </button>
            </div>
          </div>

          {/* View tabs */}
          <div className="glass-card rounded-2xl p-1.5 mb-4 flex gap-1">
            {views.map((v) => (
              <button
                key={v.key}
                onClick={() => setView(v.key)}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  view === v.key
                    ? "glass-toggle-active"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                <span className="hidden sm:inline">{v.icon}</span>
                {v.label}
              </button>
            ))}
          </div>

          {/* Search + Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <input
              type="text"
              placeholder="Search participant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 py-2 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-[#4ADE80]/60 transition-all"
            />
            <div className="flex gap-2 overflow-x-auto pb-1 flex-wrap">
              {(["all", "male", "female"] as const).map((g) => (
                <FilterChip
                  key={g}
                  label={g === "all" ? "All" : g === "male" ? "Male" : "Female"}
                  active={genderFilter === g}
                  onClick={() => setGenderFilter(g)}
                />
              ))}
              <span className="w-px bg-white/10 mx-1 self-stretch" />
              {(["all", "17-29", "30-39", "40-49", "50+"] as AgeGroup[]).map((ag) => (
                <FilterChip
                  key={ag}
                  label={ag === "all" ? "All Ages" : ag}
                  active={ageGroup === ag}
                  onClick={() => setAgeGroup(ag)}
                />
              ))}
            </div>
          </div>

          {/* Stats bar */}
          <div className="glass-card rounded-xl px-4 py-2 mb-6 flex items-center justify-between">
            <span className="text-white/40 text-sm">{sorted.length} participants</span>
            {sorted.length > 0 && (
              <span className="text-white/30 text-xs">
                Best: <span className="text-[#4ADE80] font-medium">{getMetric(sorted[0], view)}</span>
              </span>
            )}
          </div>

          {/* Desktop: side by side podium + list */}
          <div className="lg:grid lg:grid-cols-[340px_1fr] lg:gap-6">

            {/* Podium */}
            {sorted.length >= 1 && (
              <div className="mb-6 lg:mb-0">
                <div className="glass-card rounded-3xl p-6 lg:sticky lg:top-8">
                  <p className="text-xs text-white/30 uppercase tracking-wider mb-4">Top Performers</p>

                  {/* 1st place hero */}
                  {sorted[0] && (
                    <div className="podium-gold glass-card-strong rounded-2xl p-5 text-center mb-4">
                      <span className="text-4xl">🥇</span>
                      <p className="text-xl font-bold mt-2">{sorted[0].name}</p>
                      <p className="text-3xl font-black mt-1" style={{ color: STAGE_MAP[sorted[0].bioStage].color }}>
                        {getMetric(sorted[0], view)}
                      </p>
                      <p className="text-xs mt-1" style={{ color: STAGE_MAP[sorted[0].bioStage].color, opacity: 0.7 }}>
                        {sorted[0].bioStage}
                      </p>
                      <p className="text-xs text-white/30 mt-1">Age {sorted[0].age} · {sorted[0].gender}</p>
                    </div>
                  )}

                  {/* 2nd and 3rd */}
                  <div className="grid grid-cols-2 gap-3">
                    {sorted[1] && (
                      <div className="podium-silver glass-card rounded-2xl p-4 text-center">
                        <span className="text-2xl">🥈</span>
                        <p className="font-semibold text-sm mt-1 truncate">{sorted[1].name}</p>
                        <p className="text-lg font-black mt-1" style={{ color: STAGE_MAP[sorted[1].bioStage].color }}>
                          {getMetric(sorted[1], view)}
                        </p>
                        <p className="text-xs text-white/30">{sorted[1].bioStage}</p>
                      </div>
                    )}
                    {sorted[2] && (
                      <div className="podium-bronze glass-card rounded-2xl p-4 text-center">
                        <span className="text-2xl">🥉</span>
                        <p className="font-semibold text-sm mt-1 truncate">{sorted[2].name}</p>
                        <p className="text-lg font-black mt-1" style={{ color: STAGE_MAP[sorted[2].bioStage].color }}>
                          {getMetric(sorted[2], view)}
                        </p>
                        <p className="text-xs text-white/30">{sorted[2].bioStage}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Full list */}
            <div className="space-y-2">
              {sorted.map((p, i) => {
                const isHighlighted = searchQuery && p.name.toLowerCase().includes(searchQuery.toLowerCase());
                return (
                  <LeaderboardRow
                    key={p.id}
                    rank={i + 1}
                    participant={p}
                    view={view}
                    highlighted={!!isHighlighted}
                  />
                );
              })}

              {sorted.length === 0 && (
                <div className="glass-card rounded-2xl p-12 text-center">
                  <p className="text-white/40 text-lg">No participants yet</p>
                  <p className="text-white/20 text-sm mt-1">Be the first to take the grip test!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
        active ? "glass-toggle-active" : "glass-toggle"
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
  const stage = STAGE_MAP[p.bioStage];
  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
  const delta = p.age - p.biologicalAge;

  return (
    <div
      className={`glass-card-hover rounded-xl p-3 lg:p-4 flex items-center gap-3 transition-all ${highlighted ? "ring-2 ring-[#4ADE80]/50 bg-[#4ADE80]/5" : ""}`}
    >
      <span className="w-10 text-center font-bold text-sm flex-shrink-0">
        {medal || <span className="text-white/30">#{rank}</span>}
      </span>

      {/* Avatar circle */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
        style={{ background: stage.bgColor, color: stage.color }}
      >
        {p.name.charAt(0).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{p.name}</p>
        <p className="text-xs text-white/30">Age {p.age} · {p.gender} · {p.gripAvgKg}kg</p>
      </div>

      <div className="text-right flex-shrink-0">
        <p className="font-bold text-sm" style={{ color: stage.color }}>
          {view === "delta" ? (
            <>{delta > 0 ? `${delta}y younger` : delta < 0 ? `${Math.abs(delta)}y older` : "On track"}</>
          ) : (
            <>{p.gripAvgKg} kg</>
          )}
        </p>
        <p className="text-xs" style={{ color: stage.color, opacity: 0.6 }}>
          {p.bioStage}
        </p>
        {view === "strongest" && (
          <p className="text-xs text-white/30">Bio: {p.biologicalAge}</p>
        )}
        {view === "delta" && (
          <p className="text-xs text-white/30">{p.gripAvgKg}kg grip</p>
        )}
      </div>
    </div>
  );
}

function ProjectorMode({
  event,
  sorted,
  view,
  onExit,
}: {
  event: GripEvent | null;
  sorted: Participant[];
  view: LeaderboardView;
  onExit: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || sorted.length <= 10) return;

    let scrollPos = 0;
    const speed = 0.5; // pixels per frame
    let animId: number;

    function scroll() {
      scrollPos += speed;
      if (scrollPos >= el!.scrollHeight - el!.clientHeight) {
        scrollPos = 0;
      }
      el!.scrollTop = scrollPos;
      animId = requestAnimationFrame(scroll);
    }

    // Start after 3 seconds
    const timeout = setTimeout(() => {
      animId = requestAnimationFrame(scroll);
    }, 3000);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(animId);
    };
  }, [sorted.length]);

  return (
    <div className="min-h-screen relative bg-[#0B0B0F] cursor-pointer overflow-hidden" onClick={onExit}>
      <div className="absolute top-0 right-0 w-[600px] h-[600px] pointer-events-none" style={{ background: "radial-gradient(ellipse at 80% 10%, rgba(56,189,248,0.08) 0%, transparent 70%)" }} />
      <div ref={scrollRef} className="relative z-10 min-h-screen max-h-screen overflow-y-auto p-8 lg:p-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-3">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <path d="M8 28c4-2 8-3 12-3s8 1 12 3" stroke="#4ADE80" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M10 22c3-1.5 7-2.5 10-2.5s7 1 10 2.5" stroke="#4ADE80" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M12 16c2.5-1 5.5-1.5 8-1.5s5.5.5 8 1.5" stroke="#4ADE80" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
              <h1 className="text-5xl lg:text-6xl font-black">
                Grip<span className="text-[#4ADE80]">Age</span>
              </h1>
            </div>
            {event && <p className="text-2xl text-white/30 mt-2">{event.name}</p>}
            <p className="text-lg text-white/20 mt-1">
              {view === "delta" ? "Biggest Delta" : "Strongest Grip"} Leaderboard
            </p>
          </div>

          {/* Top 3 large */}
          {sorted.length >= 1 && (
            <div className="grid grid-cols-3 gap-6 mb-12">
              {[1, 0, 2].map((i) => {
                const p = sorted[i];
                if (!p) return <div key={i} />;
                const stage = STAGE_MAP[p.bioStage];
                const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉";
                const podiumClass = i === 0 ? "podium-gold" : i === 1 ? "podium-silver" : "podium-bronze";
                return (
                  <div key={p.id} className={`${podiumClass} glass-card-strong p-8 rounded-3xl text-center ${i === 0 ? "transform -translate-y-6 scale-105" : ""}`}>
                    <span className="text-6xl">{medal}</span>
                    <p className="text-3xl font-bold mt-4">{p.name}</p>
                    <p className="text-4xl font-black mt-3" style={{ color: stage.color }}>
                      {getMetric(p, view)}
                    </p>
                    <p className="text-xl mt-2" style={{ color: stage.color, opacity: 0.7 }}>
                      {p.bioStage}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Rest */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {sorted.slice(3, 30).map((p, i) => (
              <LeaderboardRow key={p.id} rank={i + 4} participant={p} view={view} highlighted={false} />
            ))}
          </div>

          <p className="text-center text-white/20 mt-10 text-sm">Click anywhere to exit</p>
        </div>
      </div>
    </div>
  );
}
