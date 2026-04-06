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

  async function handleCreateEvent() {
    if (!newName.trim() || !newDate || !newPin) return;
    setCreating(true);
    try {
      await createEvent(newName.trim(), newDate, newPin, newDesc.trim(), newLocation.trim(), newDuration.trim());
      setNewName(""); setNewDate(""); setNewPin(""); setNewDesc(""); setNewLocation(""); setNewDuration("");
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

      {/* ═══ CREATE EVENT MODAL ═══ */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
          <div className="relative bg-[#141414] border border-white/10 rounded-2xl p-8 w-full max-w-md page-enter">
            <h2 className="text-xl font-bold mb-6">Create Event</h2>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-white/30 uppercase tracking-wider mb-1.5 block">Event Name</label>
                <input type="text" placeholder="e.g. Fitness Expo 2026" value={newName} onChange={(e) => setNewName(e.target.value)}
                  className="w-full py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-[#d4845a]/60 transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-white/30 uppercase tracking-wider mb-1.5 block">Date</label>
                  <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)}
                    className="w-full py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#d4845a]/60 transition-all" />
                </div>
                <div>
                  <label className="text-[10px] text-white/30 uppercase tracking-wider mb-1.5 block">Duration</label>
                  <input type="text" placeholder="e.g. 6–8 PM" value={newDuration} onChange={(e) => setNewDuration(e.target.value)}
                    className="w-full py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-[#d4845a]/60 transition-all" />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-white/30 uppercase tracking-wider mb-1.5 block">Location</label>
                <input type="text" placeholder="e.g. HSR Layout, Bengaluru" value={newLocation} onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-[#d4845a]/60 transition-all" />
              </div>
              <div>
                <label className="text-[10px] text-white/30 uppercase tracking-wider mb-1.5 block">Description</label>
                <textarea placeholder="About this event..." value={newDesc} onChange={(e) => setNewDesc(e.target.value)} rows={3}
                  className="w-full py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-[#d4845a]/60 transition-all resize-none" />
              </div>
              <div>
                <label className="text-[10px] text-white/30 uppercase tracking-wider mb-1.5 block">Admin PIN (4 digits)</label>
                <input type="text" placeholder="1234" value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))} maxLength={4}
                  className="w-full py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-center text-lg tracking-[0.3em] placeholder:text-white/20 placeholder:tracking-normal focus:outline-none focus:border-[#d4845a]/60 transition-all" />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={handleCreateEvent}
                disabled={!newName.trim() || !newDate || newPin.length !== 4 || creating}
                className="btn-primary flex-1 py-3.5 rounded-xl text-base font-semibold disabled:opacity-30"
              >
                {creating ? "Creating..." : "Create Event"}
              </button>
              <button onClick={() => setShowCreateModal(false)} className="px-6 py-3.5 rounded-xl text-white/40 hover:text-white/60 transition-colors">
                Cancel
              </button>
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
