"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getEvents,
  createEvent,
  getParticipants,
  getParticipantCount,
  exportParticipantsCSV,
  endEvent,
  reopenEvent,
  deleteEvent,
  deleteParticipant,
} from "@/lib/store";
import { STAGE_MAP } from "@/lib/formula";
import type { GripEvent, Participant } from "@/lib/types";

function getDateLabel(dateStr: string): string {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;

  if (dateStr === todayStr) return "Today";
  if (dateStr === tomorrowStr) return "Tomorrow";
  if (dateStr === yesterdayStr) return "Yesterday";

  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function groupByDate(events: GripEvent[]): { label: string; date: string; events: GripEvent[] }[] {
  const groups: Record<string, GripEvent[]> = {};
  events.forEach((e) => {
    if (!groups[e.date]) groups[e.date] = [];
    groups[e.date].push(e);
  });
  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, evts]) => ({ label: getDateLabel(date), date, events: evts }));
}

export default function OrganizerDashboard() {
  const router = useRouter();
  const [events, setEvents] = useState<GripEvent[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newPin, setNewPin] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newDuration, setNewDuration] = useState("");
  const [newStartTime, setNewStartTime] = useState("16:30");
  const [newEndTime, setNewEndTime] = useState("17:30");
  const [newEndDate, setNewEndDate] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("gripage_organizer") !== "true") {
      router.replace("/organizer/login");
      return;
    }
    loadEvents();
  }, [router]);

  // Lock scroll when modal open
  useEffect(() => {
    document.body.style.overflow = showCreateModal ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showCreateModal]);

  async function loadEvents() {
    const evts = await getEvents();
    setEvents(evts);
    const countMap: Record<string, number> = {};
    await Promise.all(evts.map(async (e) => { countMap[e.id] = await getParticipantCount(e.id); }));
    setCounts(countMap);
  }

  function formatTime12(t: string) {
    if (!t) return "";
    const [h, m] = t.split(":").map(Number);
    const suffix = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return m === 0 ? `${h12} ${suffix}` : `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
  }

  async function handleCreateEvent() {
    if (!newName.trim() || !newDate || !newPin) return;
    setCreating(true);
    try {
      const duration = newStartTime && newEndTime ? `${formatTime12(newStartTime)} – ${formatTime12(newEndTime)}` : newDuration.trim();
      await createEvent(newName.trim(), newDate, newPin, newDesc.trim(), newLocation.trim(), duration);
      setNewName(""); setNewDate(""); setNewPin(""); setNewDesc(""); setNewLocation(""); setNewDuration("");
      setNewStartTime("16:30"); setNewEndTime("17:30"); setNewEndDate("");
      setShowCreateModal(false);
      await loadEvents();
    } finally { setCreating(false); }
  }

  async function handleExpandEvent(eventId: string) {
    if (expandedEvent === eventId) { setExpandedEvent(null); setParticipants([]); return; }
    setExpandedEvent(eventId);
    setLoadingParticipants(true);
    setParticipants(await getParticipants(eventId));
    setLoadingParticipants(false);
  }

  async function handleToggleStatus(event: GripEvent) {
    event.status === "live" ? await endEvent(event.id) : await reopenEvent(event.id);
    await loadEvents();
  }

  async function handleDeleteEvent(eventId: string) {
    if (!confirm("Delete this event and all participants?")) return;
    await deleteEvent(eventId);
    if (expandedEvent === eventId) { setExpandedEvent(null); setParticipants([]); }
    await loadEvents();
  }

  async function handleDeleteParticipant(participantId: string) {
    if (!confirm("Delete this entry?")) return;
    await deleteParticipant(participantId);
    if (expandedEvent) {
      setParticipants(await getParticipants(expandedEvent));
      setCounts((prev) => ({ ...prev, [expandedEvent]: (prev[expandedEvent] || 1) - 1 }));
    }
  }

  async function handleExport(eventId: string, eventName: string) {
    const csv = await exportParticipantsCSV(eventId);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `gripage_${eventName}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  const upcomingEvents = events.filter((e) => e.status === "live");
  const pastEvents = events.filter((e) => e.status === "ended");
  const displayEvents = activeTab === "upcoming" ? upcomingEvents : pastEvents;
  const dateGroups = groupByDate(displayEvents);

  // Stats for expanded event
  const total = participants.length;
  const maleCount = participants.filter((p) => p.gender === "male").length;
  const femaleCount = total - maleCount;
  const avgBioAge = total > 0 ? Math.round(participants.reduce((s, p) => s + p.biologicalAge, 0) / total) : 0;
  const avgGrip = total > 0 ? Math.round((participants.reduce((s, p) => s + p.gripAvgKg, 0) / total) * 10) / 10 : 0;
  const avgDelta = total > 0 ? Math.round(participants.reduce((s, p) => s + (p.age - p.biologicalAge), 0) / total * 10) / 10 : 0;
  const stageCounts: Record<string, number> = {};
  participants.forEach((p) => { stageCounts[p.bioStage] = (stageCounts[p.bioStage] || 0) + 1; });

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-4 sm:p-8">
      <div className="max-w-3xl mx-auto page-enter">

        {/* ═══ HEADER ═══ */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black">Events</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowCreateModal(true)} className="btn-primary px-5 py-2.5 rounded-xl text-sm font-semibold">
              + Create Event
            </button>
            <button onClick={() => { sessionStorage.removeItem("gripage_organizer"); router.push("/"); }} className="text-white/30 hover:text-white/60 text-sm transition-colors">
              Logout
            </button>
          </div>
        </div>

        {/* ═══ TABS ═══ */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl mb-8 max-w-xs">
          {(["upcoming", "past"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all capitalize ${activeTab === tab ? "glass-toggle-active" : "text-white/40 hover:text-white/60"}`}
            >
              {tab} {tab === "upcoming" ? `(${upcomingEvents.length})` : `(${pastEvents.length})`}
            </button>
          ))}
        </div>

        {/* ═══ TIMELINE ═══ */}
        {dateGroups.length === 0 && (
          <div className="text-center py-16">
            <p className="text-white/30 text-lg">
              {activeTab === "upcoming" ? "No active events. Create one to get started." : "No past events yet."}
            </p>
          </div>
        )}

        {dateGroups.map((group) => (
          <div key={group.date} className="mb-8">
            {/* Date label */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-1 h-5 rounded-full bg-[#d4845a]" />
              <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider">{group.label}</h3>
            </div>

            {/* Event cards */}
            <div className="space-y-3 ml-4 border-l border-white/5 pl-5">
              {group.events.map((evt) => (
                <div key={evt.id}>
                  {/* Event card */}
                  <div className={`bg-white/[0.03] border rounded-xl p-4 transition-all ${expandedEvent === evt.id ? "border-[#d4845a]/30" : "border-white/[0.06] hover:border-white/10"}`}>
                    <div className="flex items-center gap-4">
                      {/* Status */}
                      <div className="flex-shrink-0">
                        {evt.status === "live" ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-500/15 text-green-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                            LIVE
                          </span>
                        ) : (
                          <span className="text-xs text-white/30 px-2.5 py-1">Ended</span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">{evt.name}</h4>
                        <p className="text-sm text-white/30">
                          {counts[evt.id] || 0} participants · Code: <span className="font-mono text-white/50">{evt.code}</span>
                          {evt.location && <> · {evt.location}</>}
                          {evt.duration && <> · {evt.duration}</>}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {evt.status === "live" && (
                          <button onClick={() => router.push(`/event/${evt.id}`)} className="btn-primary px-4 py-2 rounded-lg text-sm">
                            Check In
                          </button>
                        )}
                        <button
                          onClick={() => handleExpandEvent(evt.id)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${expandedEvent === evt.id ? "bg-[#d4845a]/15 text-[#d4845a]" : "bg-white/5 text-white/50 hover:text-white/70"}`}
                        >
                          {expandedEvent === evt.id ? "Close" : "Manage"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ─── EXPANDED MANAGE PANEL ─── */}
                  {expandedEvent === evt.id && (
                    <div className="mt-2 bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 page-enter">
                      {loadingParticipants ? (
                        <p className="text-white/30 text-center py-6">Loading...</p>
                      ) : (
                        <>
                          {/* Action bar */}
                          <div className="flex items-center gap-2 mb-5 flex-wrap">
                            <button onClick={() => router.push(`/event/${evt.id}/leaderboard`)} className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-white/50 hover:text-white/70 transition-all">Leaderboard</button>
                            <button onClick={() => handleExport(evt.id, evt.name)} className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-white/50 hover:text-white/70 transition-all">Export CSV</button>
                            <button onClick={() => handleToggleStatus(evt)} className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-white/50 hover:text-white/70 transition-all">
                              {evt.status === "live" ? "End Event" : "Reopen"}
                            </button>
                            <button onClick={() => handleDeleteEvent(evt.id)} className="text-xs text-red-400/50 hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500/5 ml-auto transition-all">
                              Delete
                            </button>
                          </div>

                          {/* Stats */}
                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-5">
                            <Stat label="Participants" value={`${total}`} />
                            <Stat label="Avg Bio Age" value={`${avgBioAge}`} />
                            <Stat label="Avg Grip" value={`${avgGrip}kg`} />
                            <Stat label="M / F" value={`${maleCount}/${femaleCount}`} />
                            <Stat label="Avg Delta" value={`${avgDelta > 0 ? "+" : ""}${avgDelta}`} />
                            <Stat label="Code" value={evt.code} />
                          </div>

                          {/* Stage distribution */}
                          <div className="mb-5">
                            <p className="text-[10px] text-white/25 uppercase tracking-wider mb-2">Stage Distribution</p>
                            <div className="space-y-1.5">
                              {Object.entries(STAGE_MAP).map(([label, info]) => {
                                const count = stageCounts[label] || 0;
                                const pct = total > 0 ? (count / total) * 100 : 0;
                                return (
                                  <div key={label} className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: info.color }} />
                                    <span className="text-xs text-white/40 flex-1 truncate">{label}</span>
                                    <span className="text-xs text-white/25 w-6 text-right">{count}</span>
                                    <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: info.color }} />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Participant list */}
                          <div>
                            <p className="text-[10px] text-white/25 uppercase tracking-wider mb-2">Participants ({total})</p>
                            <div className="space-y-1 max-h-64 overflow-y-auto">
                              {participants.map((p) => {
                                const st = STAGE_MAP[p.bioStage];
                                const d = p.age - p.biologicalAge;
                                return (
                                  <div key={p.id} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-white/[0.02] group">
                                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{ background: `${st.color}18`, color: st.color }}>
                                      {p.name.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">{p.name}</p>
                                      <p className="text-[10px] text-white/25">{p.gender} · {p.age}y · {p.gripAvgKg}kg</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm font-bold" style={{ color: st.color }}>Bio: {p.biologicalAge}</p>
                                      <p className="text-[10px] text-white/30">{d > 0 ? `${d}y younger` : d < 0 ? `${Math.abs(d)}y older` : "On track"}</p>
                                    </div>
                                    <button onClick={() => handleDeleteParticipant(p.id)} className="opacity-0 group-hover:opacity-100 text-red-400/50 hover:text-red-400 text-xs px-1 transition-all">✕</button>
                                  </div>
                                );
                              })}
                              {total === 0 && <p className="text-white/20 text-sm text-center py-4">No participants yet</p>}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ═══ CREATE EVENT MODAL — Luma Style ═══ */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
          <div className="relative bg-[#1a1a2e] border border-white/10 rounded-3xl w-full max-w-4xl page-enter overflow-hidden">
            <div className="flex flex-col lg:flex-row">

              {/* ─── LEFT: Poster Card ─── */}
              <div className="lg:w-[340px] flex-shrink-0 p-6 lg:p-8 flex items-center justify-center bg-gradient-to-br from-[#8b5cf6]/20 via-[#1a1a2e] to-[#d4845a]/10">
                <div className="w-full aspect-[3/4] max-h-[400px] rounded-2xl bg-gradient-to-br from-[#a78bfa]/30 via-[#7c3aed]/20 to-[#d4845a]/20 border border-white/[0.08] flex flex-col items-center justify-center relative overflow-hidden">
                  {/* Decorative blobs */}
                  <div className="absolute inset-0">
                    <div className="absolute top-8 left-6 w-12 h-16 bg-[#e74c8b]/40 rounded-full rotate-[-20deg] blur-[1px]" />
                    <div className="absolute top-12 right-10 w-8 h-20 bg-[#4ade80]/40 rounded-full rotate-[30deg] blur-[1px]" />
                    <div className="absolute top-20 left-1/2 -translate-x-1/2 w-16 h-16 bg-[#f0a0b0]/50 rounded-[40%] blur-[1px]" />
                    <div className="absolute bottom-20 left-10 w-10 h-10 bg-[#3b82f6]/50 rounded-full blur-[1px]" />
                    <div className="absolute bottom-16 right-8 w-14 h-10 bg-[#fbbf24]/50 rounded-full blur-[1px]" />
                    <div className="absolute top-1/3 right-6 w-6 h-14 bg-[#22d3ee]/40 rounded-full rotate-[15deg] blur-[1px]" />
                  </div>
                  {/* GripAge branding */}
                  <div className="relative z-10 text-center">
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="mx-auto mb-3 opacity-60">
                      <path d="M8 28c4-2 8-3 12-3s8 1 12 3" stroke="#d4845a" strokeWidth="2.5" strokeLinecap="round"/>
                      <path d="M10 22c3-1.5 7-2.5 10-2.5s7 1 10 2.5" stroke="#d4845a" strokeWidth="2.5" strokeLinecap="round"/>
                      <path d="M12 16c2.5-1 5.5-1.5 8-1.5s5.5.5 8 1.5" stroke="#d4845a" strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                    <p className="text-xs font-bold text-white/40 tracking-wider">GRIPAGE</p>
                  </div>
                </div>
              </div>

              {/* ─── RIGHT: Form ─── */}
              <div className="flex-1 p-6 lg:p-8 overflow-y-auto max-h-[85vh]">
                {/* Top bar: Public badge */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2 text-xs text-white/30">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/30">
                      <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
                    </svg>
                    Public
                  </div>
                  <button onClick={() => setShowCreateModal(false)} className="text-white/30 hover:text-white/60 transition-colors p-1">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                </div>

                {/* Event Name */}
                <input
                  type="text"
                  placeholder="Event Name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full text-3xl lg:text-4xl font-light text-white placeholder:text-white/20 bg-transparent border-none outline-none mb-8 focus:ring-0"
                  style={{ fontFamily: "serif" }}
                />

                {/* Start / End date-time */}
                <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl mb-4 overflow-hidden">
                  {/* Start row */}
                  <div className="flex items-center px-5 py-4 gap-4">
                    <div className="flex items-center gap-2 w-14 flex-shrink-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-white/30" />
                      <span className="text-sm text-white/50">Start</span>
                    </div>
                    <div className="flex-1 flex items-center gap-3">
                      <input
                        type="date"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        className="bg-white/[0.06] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#d4845a]/50 transition-all"
                      />
                      <input
                        type="time"
                        value={newStartTime}
                        onChange={(e) => setNewStartTime(e.target.value)}
                        className="bg-white/[0.06] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#d4845a]/50 transition-all"
                      />
                    </div>
                    <div className="hidden sm:flex items-center gap-1.5 text-xs text-white/25 flex-shrink-0">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/25">
                        <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
                      </svg>
                      <span>{Intl.DateTimeFormat().resolvedOptions().timeZone.split("/").pop()}</span>
                    </div>
                  </div>

                  {/* Divider with dotted line */}
                  <div className="relative px-5">
                    <div className="border-t border-dashed border-white/[0.06]" />
                    <div className="absolute left-[1.85rem] -top-1 w-px h-2 border-l border-dotted border-white/20" />
                  </div>

                  {/* End row */}
                  <div className="flex items-center px-5 py-4 gap-4">
                    <div className="flex items-center gap-2 w-14 flex-shrink-0">
                      <span className="w-2.5 h-2.5 rounded-full border border-white/30" />
                      <span className="text-sm text-white/50">End</span>
                    </div>
                    <div className="flex-1 flex items-center gap-3">
                      <input
                        type="date"
                        value={newEndDate || newDate}
                        onChange={(e) => setNewEndDate(e.target.value)}
                        className="bg-white/[0.06] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#d4845a]/50 transition-all"
                      />
                      <input
                        type="time"
                        value={newEndTime}
                        onChange={(e) => setNewEndTime(e.target.value)}
                        className="bg-white/[0.06] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#d4845a]/50 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div
                  className="bg-white/[0.04] border border-white/[0.08] rounded-2xl px-5 py-4 mb-4 flex items-center gap-3 cursor-text group hover:border-white/[0.12] transition-all"
                  onClick={() => document.getElementById("create-location-input")?.focus()}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/30 flex-shrink-0">
                    <path d="M12 13a3 3 0 100-6 3 3 0 000 6z"/><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                  </svg>
                  <input
                    id="create-location-input"
                    type="text"
                    placeholder="Add Event Location"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
                  />
                </div>

                {/* Description */}
                <div
                  className="bg-white/[0.04] border border-white/[0.08] rounded-2xl px-5 py-4 mb-4 flex items-start gap-3 cursor-text group hover:border-white/[0.12] transition-all"
                  onClick={() => document.getElementById("create-desc-input")?.focus()}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/30 flex-shrink-0 mt-0.5">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 7h10M7 12h10M7 17h6"/>
                  </svg>
                  <textarea
                    id="create-desc-input"
                    placeholder="Add Description"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    rows={3}
                    className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none resize-none"
                  />
                </div>

                {/* Admin PIN */}
                <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl px-5 py-4 mb-6 flex items-center gap-3">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/30 flex-shrink-0">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                  </svg>
                  <input
                    type="text"
                    placeholder="Admin PIN (4 digits)"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    maxLength={4}
                    className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none tracking-[0.3em]"
                  />
                </div>

                {/* Create button */}
                <button
                  onClick={handleCreateEvent}
                  disabled={!newName.trim() || !newDate || newPin.length !== 4 || creating}
                  className="btn-primary w-full py-4 rounded-2xl text-base font-semibold disabled:opacity-30 transition-all"
                >
                  {creating ? "Creating..." : "Create Event"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-white/[0.03] rounded-lg border border-white/[0.04]">
      <p className="text-[10px] text-white/25 mb-0.5">{label}</p>
      <p className="text-sm font-bold">{value}</p>
    </div>
  );
}
