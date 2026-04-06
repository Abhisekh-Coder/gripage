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

export default function OrganizerDashboard() {
  const router = useRouter();
  const [events, setEvents] = useState<GripEvent[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  // Create event form
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newPin, setNewPin] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("gripage_organizer") !== "true") {
      router.replace("/organizer/login");
      return;
    }
    loadEvents();
  }, [router]);

  async function loadEvents() {
    const evts = await getEvents();
    setEvents(evts);
    const countMap: Record<string, number> = {};
    await Promise.all(evts.map(async (e) => {
      countMap[e.id] = await getParticipantCount(e.id);
    }));
    setCounts(countMap);
  }

  async function handleCreateEvent() {
    if (!newName.trim() || !newDate || !newPin) return;
    setCreating(true);
    try {
      await createEvent(newName.trim(), newDate, newPin);
      setNewName("");
      setNewDate("");
      setNewPin("");
      setShowCreate(false);
      await loadEvents();
    } finally {
      setCreating(false);
    }
  }

  async function handleExpandEvent(eventId: string) {
    if (expandedEvent === eventId) {
      setExpandedEvent(null);
      setParticipants([]);
      return;
    }
    setExpandedEvent(eventId);
    setLoadingParticipants(true);
    const p = await getParticipants(eventId);
    setParticipants(p);
    setLoadingParticipants(false);
  }

  async function handleToggleStatus(event: GripEvent) {
    if (event.status === "live") {
      await endEvent(event.id);
    } else {
      await reopenEvent(event.id);
    }
    await loadEvents();
  }

  async function handleDeleteEvent(eventId: string) {
    if (!confirm("Delete this event and all its participants? This cannot be undone.")) return;
    await deleteEvent(eventId);
    if (expandedEvent === eventId) {
      setExpandedEvent(null);
      setParticipants([]);
    }
    await loadEvents();
  }

  async function handleDeleteParticipant(participantId: string) {
    if (!confirm("Delete this participant entry?")) return;
    await deleteParticipant(participantId);
    if (expandedEvent) {
      const p = await getParticipants(expandedEvent);
      setParticipants(p);
      const count = await getParticipantCount(expandedEvent);
      setCounts((prev) => ({ ...prev, [expandedEvent]: count }));
    }
  }

  async function handleExport(eventId: string, eventName: string) {
    const csv = await exportParticipantsCSV(eventId);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gripage_${eventName}_results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleLogout() {
    sessionStorage.removeItem("gripage_organizer");
    router.push("/");
  }

  // Stats for expanded event
  const totalCount = participants.length;
  const maleCount = participants.filter((p) => p.gender === "male").length;
  const femaleCount = participants.filter((p) => p.gender === "female").length;
  const avgBioAge = totalCount > 0 ? Math.round(participants.reduce((s, p) => s + p.biologicalAge, 0) / totalCount) : 0;
  const avgGrip = totalCount > 0 ? Math.round((participants.reduce((s, p) => s + p.gripAvgKg, 0) / totalCount) * 10) / 10 : 0;
  const avgAge = totalCount > 0 ? Math.round(participants.reduce((s, p) => s + p.age, 0) / totalCount) : 0;

  const stageCounts: Record<string, number> = {};
  participants.forEach((p) => {
    stageCounts[p.bioStage] = (stageCounts[p.bioStage] || 0) + 1;
  });

  const activityCounts: Record<string, number> = {};
  participants.forEach((p) => {
    const level = p.fitnessAnswers.activityLevel;
    activityCounts[level] = (activityCounts[level] || 0) + 1;
  });

  const liveEvents = events.filter((e) => e.status === "live");
  const pastEvents = events.filter((e) => e.status === "ended");

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-4 sm:p-8">
      <div className="max-w-4xl mx-auto page-enter">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
              <path d="M8 28c4-2 8-3 12-3s8 1 12 3" stroke="#d4845a" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M10 22c3-1.5 7-2.5 10-2.5s7 1 10 2.5" stroke="#d4845a" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M12 16c2.5-1 5.5-1.5 8-1.5s5.5.5 8 1.5" stroke="#d4845a" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            <h1 className="text-2xl font-bold">Organizer Dashboard</h1>
          </div>
          <button onClick={handleLogout} className="text-white/30 hover:text-white/60 text-sm transition-colors">
            Logout
          </button>
        </div>

        {/* Create Event */}
        <div className="mb-8">
          {!showCreate ? (
            <button
              onClick={() => setShowCreate(true)}
              className="w-full py-4 border-2 border-dashed border-white/10 hover:border-[#d4845a]/40 rounded-2xl text-white/40 hover:text-[#d4845a] transition-all text-sm font-medium"
            >
              + Create New Event
            </button>
          ) : (
            <div className="bg-[#141414] border border-white/10 rounded-2xl p-6">
              <h2 className="font-semibold mb-4">New Event</h2>
              <div className="grid sm:grid-cols-3 gap-3 mb-4">
                <input
                  type="text"
                  placeholder="Event name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/25 focus:outline-none focus:border-[#d4845a]/60 transition-all"
                />
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#d4845a]/60 transition-all"
                />
                <input
                  type="text"
                  placeholder="4-digit PIN"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  maxLength={4}
                  className="py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/25 focus:outline-none focus:border-[#d4845a]/60 transition-all"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCreateEvent}
                  disabled={!newName.trim() || !newDate || newPin.length !== 4 || creating}
                  className="py-3 px-6 bg-[#d4845a] hover:bg-[#c27548] disabled:bg-white/5 disabled:text-white/20 text-white font-semibold rounded-xl transition-all"
                >
                  {creating ? "Creating..." : "Create"}
                </button>
                <button onClick={() => setShowCreate(false)} className="py-3 px-6 text-white/40 hover:text-white/60 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Live Events */}
        {liveEvents.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-4">Live Events</h2>
            <div className="space-y-3">
              {liveEvents.map((evt) => (
                <EventCard
                  key={evt.id}
                  event={evt}
                  count={counts[evt.id] || 0}
                  isExpanded={expandedEvent === evt.id}
                  onExpand={() => handleExpandEvent(evt.id)}
                  onToggleStatus={() => handleToggleStatus(evt)}
                  onDelete={() => handleDeleteEvent(evt.id)}
                  onExport={() => handleExport(evt.id, evt.name)}
                  onViewLeaderboard={() => router.push(`/event/${evt.id}/leaderboard`)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-4">Past Events</h2>
            <div className="space-y-3">
              {pastEvents.map((evt) => (
                <EventCard
                  key={evt.id}
                  event={evt}
                  count={counts[evt.id] || 0}
                  isExpanded={expandedEvent === evt.id}
                  onExpand={() => handleExpandEvent(evt.id)}
                  onToggleStatus={() => handleToggleStatus(evt)}
                  onDelete={() => handleDeleteEvent(evt.id)}
                  onExport={() => handleExport(evt.id, evt.name)}
                  onViewLeaderboard={() => router.push(`/event/${evt.id}/leaderboard`)}
                />
              ))}
            </div>
          </div>
        )}

        {events.length === 0 && (
          <p className="text-center text-white/30 py-12">No events yet. Create your first event above.</p>
        )}

        {/* Expanded Event Details */}
        {expandedEvent && (
          <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 mb-8">
            {loadingParticipants ? (
              <p className="text-white/40 text-center py-8">Loading participants...</p>
            ) : (
              <>
                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  <StatCard label="Participants" value={`${totalCount}`} />
                  <StatCard label="Avg Bio Age" value={`${avgBioAge}`} />
                  <StatCard label="Avg Grip" value={`${avgGrip} kg`} />
                  <StatCard label="Male / Female" value={`${maleCount} / ${femaleCount}`} />
                  <StatCard label="Avg Chronological Age" value={`${avgAge}`} />
                  <StatCard label="Avg Delta" value={totalCount > 0 ? `${Math.round(participants.reduce((s, p) => s + (p.age - p.biologicalAge), 0) / totalCount * 10) / 10}` : "0"} />
                </div>

                {/* Stage Distribution */}
                <div className="bg-[#1a1a1a] rounded-xl border border-white/5 p-4 mb-6">
                  <h3 className="font-semibold mb-3 text-sm">Stage Distribution</h3>
                  {Object.entries(STAGE_MAP).map(([label, info]) => {
                    const count = stageCounts[label] || 0;
                    const pct = totalCount > 0 ? (count / totalCount) * 100 : 0;
                    return (
                      <div key={label} className="flex items-center gap-3 mb-2">
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: info.color }} />
                        <span className="text-sm flex-1 text-white/60">{label}</span>
                        <span className="text-sm text-white/30 w-8 text-right">{count}</span>
                        <div className="w-24 h-2 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: info.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Activity Level */}
                <div className="bg-[#1a1a1a] rounded-xl border border-white/5 p-4 mb-6">
                  <h3 className="font-semibold mb-3 text-sm">Activity Level</h3>
                  {["sedentary", "light", "moderate", "active", "very_active"].map((level) => {
                    const count = activityCounts[level] || 0;
                    const pct = totalCount > 0 ? (count / totalCount) * 100 : 0;
                    return (
                      <div key={level} className="flex items-center gap-3 mb-2">
                        <span className="text-sm flex-1 text-white/60 capitalize">{level.replace("_", " ")}</span>
                        <span className="text-sm text-white/30 w-8 text-right">{count}</span>
                        <div className="w-24 h-2 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-[#d4845a]/60 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Participant List */}
                <div className="bg-[#1a1a1a] rounded-xl border border-white/5 p-4">
                  <h3 className="font-semibold mb-3 text-sm">Participants ({totalCount})</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {participants.map((p) => {
                      const stage = STAGE_MAP[p.bioStage];
                      const delta = p.age - p.biologicalAge;
                      return (
                        <div key={p.id} className="flex items-center gap-3 py-3 px-3 border-b border-white/5 last:border-0 hover:bg-white/3 rounded-lg group">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{p.name}</p>
                            <p className="text-xs text-white/30 truncate">{p.email} · {p.phone}</p>
                            <p className="text-xs text-white/30">
                              {p.gender} · {p.age}y · {p.gripAvgKg}kg grip
                            </p>
                          </div>
                          <div className="text-right mr-2">
                            <p className="font-bold text-sm" style={{ color: stage.color }}>
                              Bio: {p.biologicalAge}
                            </p>
                            <p className="text-xs text-white/40">
                              {delta > 0 ? `${delta}y younger` : delta < 0 ? `${Math.abs(delta)}y older` : "On track"}
                            </p>
                            <p className="text-xs" style={{ color: stage.color, opacity: 0.6 }}>{p.bioStage}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteParticipant(p.id)}
                            className="opacity-0 group-hover:opacity-100 text-red-400/60 hover:text-red-400 text-sm transition-all px-2 py-1 rounded"
                            title="Delete entry"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                    {totalCount === 0 && (
                      <p className="text-white/30 text-sm text-center py-4">No participants yet</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EventCard({
  event,
  count,
  isExpanded,
  onExpand,
  onToggleStatus,
  onDelete,
  onExport,
  onViewLeaderboard,
}: {
  event: GripEvent;
  count: number;
  isExpanded: boolean;
  onExpand: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
  onExport: () => void;
  onViewLeaderboard: () => void;
}) {
  return (
    <div className={`bg-[#141414] border rounded-2xl p-4 sm:p-5 transition-all ${isExpanded ? "border-[#d4845a]/30" : "border-white/5"}`}>
      <div className="flex items-center gap-4">
        {/* Event info */}
        <button onClick={onExpand} className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="font-semibold truncate">{event.name}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${event.status === "live" ? "bg-green-500/15 text-green-400" : "bg-white/5 text-white/30"}`}>
              {event.status}
            </span>
          </div>
          <p className="text-sm text-white/30">
            Code: <span className="font-mono text-white/50">{event.code}</span> · {event.date} · {count} participants
          </p>
        </button>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={onViewLeaderboard} className="text-xs text-white/30 hover:text-white/60 px-3 py-2 rounded-lg hover:bg-white/5 transition-all" title="Leaderboard">
            📊
          </button>
          <button onClick={onExport} className="text-xs text-white/30 hover:text-white/60 px-3 py-2 rounded-lg hover:bg-white/5 transition-all" title="Export CSV">
            📥
          </button>
          <button onClick={onToggleStatus} className="text-xs text-white/30 hover:text-white/60 px-3 py-2 rounded-lg hover:bg-white/5 transition-all" title={event.status === "live" ? "End event" : "Reopen event"}>
            {event.status === "live" ? "🔴" : "🟢"}
          </button>
          <button onClick={onDelete} className="text-xs text-red-400/40 hover:text-red-400 px-3 py-2 rounded-lg hover:bg-red-500/5 transition-all" title="Delete event">
            🗑
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 bg-[#1a1a1a] rounded-xl border border-white/5">
      <p className="text-white/30 text-xs mb-1">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
