"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  getEvents,
  createEvent,
  uploadEventImage,
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
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
  if (dateStr === todayStr) return "Today";
  if (dateStr === tomorrowStr) return "Tomorrow";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function groupByDate(events: GripEvent[]): { label: string; date: string; events: GripEvent[] }[] {
  const groups: Record<string, GripEvent[]> = {};
  events.forEach((e) => { if (!groups[e.date]) groups[e.date] = []; groups[e.date].push(e); });
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)).map(([date, evts]) => ({ label: getDateLabel(date), date, events: evts }));
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
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState("");
  const [creating, setCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("gripage_organizer") !== "true") {
      router.replace("/organizer/login");
      return;
    }
    loadEvents();
  }, [router]);

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

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setNewImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleCreateEvent() {
    if (!newName.trim() || !newDate || !newPin) return;
    setCreating(true);
    try {
      let imageUrl = "";
      if (newImageFile) {
        try { imageUrl = await uploadEventImage(newImageFile); } catch { /* ignore upload errors */ }
      }
      await createEvent(newName.trim(), newDate, newPin, newDesc.trim(), newLocation.trim(), newDuration.trim(), imageUrl);
      setNewName(""); setNewDate(""); setNewPin(""); setNewDesc(""); setNewLocation(""); setNewDuration("");
      setNewImageFile(null); setNewImagePreview("");
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

        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black">Events</h1>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowCreateModal(true)} className="btn-primary px-5 py-2.5 rounded-xl text-sm font-semibold">+ Create Event</button>
            <button onClick={() => { sessionStorage.removeItem("gripage_organizer"); router.push("/"); }} className="text-white/30 hover:text-white/60 text-sm transition-colors">Logout</button>
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl mb-8 max-w-xs">
          {(["upcoming", "past"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all capitalize ${activeTab === tab ? "glass-toggle-active" : "text-white/40 hover:text-white/60"}`}>
              {tab} {tab === "upcoming" ? `(${upcomingEvents.length})` : `(${pastEvents.length})`}
            </button>
          ))}
        </div>

        {/* TIMELINE */}
        {dateGroups.length === 0 && (
          <div className="text-center py-16"><p className="text-white/30 text-lg">{activeTab === "upcoming" ? "No active events. Create one to get started." : "No past events yet."}</p></div>
        )}

        {dateGroups.map((group) => (
          <div key={group.date} className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-1 h-5 rounded-full bg-[#d4845a]" />
              <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider">{group.label}</h3>
            </div>
            <div className="space-y-3 ml-4 border-l border-white/5 pl-5">
              {group.events.map((evt) => (
                <div key={evt.id}>
                  <div className={`bg-white/[0.03] border rounded-xl p-4 transition-all ${expandedEvent === evt.id ? "border-[#d4845a]/30" : "border-white/[0.06] hover:border-white/10"}`}>
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        {evt.status === "live" ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-500/15 text-green-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />LIVE
                          </span>
                        ) : (<span className="text-xs text-white/30 px-2.5 py-1">Ended</span>)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">{evt.name}</h4>
                        <p className="text-sm text-white/30">{counts[evt.id] || 0} participants · Code: <span className="font-mono text-white/50">{evt.code}</span>{evt.location && <> · {evt.location}</>}{evt.duration && <> · {evt.duration}</>}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {evt.status === "live" && (<button onClick={() => router.push(`/event/${evt.id}`)} className="btn-primary px-4 py-2 rounded-lg text-sm">Check In</button>)}
                        <button onClick={() => handleExpandEvent(evt.id)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${expandedEvent === evt.id ? "bg-[#d4845a]/15 text-[#d4845a]" : "bg-white/5 text-white/50 hover:text-white/70"}`}>
                          {expandedEvent === evt.id ? "Close" : "Manage"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {expandedEvent === evt.id && (
                    <div className="mt-2 bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 page-enter">
                      {loadingParticipants ? (<p className="text-white/30 text-center py-6">Loading...</p>) : (<>
                        <div className="flex items-center gap-2 mb-5 flex-wrap">
                          <button onClick={() => router.push(`/event/${evt.id}/leaderboard`)} className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-white/50 hover:text-white/70 transition-all">Leaderboard</button>
                          <button onClick={() => handleExport(evt.id, evt.name)} className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-white/50 hover:text-white/70 transition-all">Export CSV</button>
                          <button onClick={() => handleToggleStatus(evt)} className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-white/50 hover:text-white/70 transition-all">{evt.status === "live" ? "End Event" : "Reopen"}</button>
                          <button onClick={() => handleDeleteEvent(evt.id)} className="text-xs text-red-400/50 hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500/5 ml-auto transition-all">Delete</button>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-5">
                          <Stat label="Participants" value={`${total}`} /><Stat label="Avg Bio Age" value={`${avgBioAge}`} /><Stat label="Avg Grip" value={`${avgGrip}kg`} />
                          <Stat label="M / F" value={`${maleCount}/${femaleCount}`} /><Stat label="Avg Delta" value={`${avgDelta > 0 ? "+" : ""}${avgDelta}`} /><Stat label="Code" value={evt.code} />
                        </div>
                        <div className="mb-5">
                          <p className="text-[10px] text-white/25 uppercase tracking-wider mb-2">Stage Distribution</p>
                          <div className="space-y-1.5">
                            {Object.entries(STAGE_MAP).map(([label, info]) => {
                              const count = stageCounts[label] || 0;
                              const pct = total > 0 ? (count / total) * 100 : 0;
                              return (<div key={label} className="flex items-center gap-2"><span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: info.color }} /><span className="text-xs text-white/40 flex-1 truncate">{label}</span><span className="text-xs text-white/25 w-6 text-right">{count}</span><div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: info.color }} /></div></div>);
                            })}
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] text-white/25 uppercase tracking-wider mb-2">Participants ({total})</p>
                          <div className="space-y-1 max-h-64 overflow-y-auto">
                            {participants.map((p) => { const st = STAGE_MAP[p.bioStage]; const d = p.age - p.biologicalAge; return (
                              <div key={p.id} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-white/[0.02] group">
                                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{ background: `${st.color}18`, color: st.color }}>{p.name.charAt(0)}</div>
                                <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{p.name}</p><p className="text-[10px] text-white/25">{p.gender} · {p.age}y · {p.gripAvgKg}kg</p></div>
                                <div className="text-right"><p className="text-sm font-bold" style={{ color: st.color }}>Bio: {p.biologicalAge}</p><p className="text-[10px] text-white/30">{d > 0 ? `${d}y younger` : d < 0 ? `${Math.abs(d)}y older` : "On track"}</p></div>
                                <button onClick={() => handleDeleteParticipant(p.id)} className="opacity-0 group-hover:opacity-100 text-red-400/50 hover:text-red-400 text-xs px-1 transition-all">✕</button>
                              </div>); })}
                            {total === 0 && <p className="text-white/20 text-sm text-center py-4">No participants yet</p>}
                          </div>
                        </div>
                      </>)}
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
          <div className="relative bg-[#141414] border border-white/10 rounded-2xl w-full max-w-md page-enter max-h-[90vh] overflow-y-auto">

            {/* Image upload area */}
            <div className="p-6 pb-0">
              <div className="flex items-center justify-between mb-4">
                <p className="text-lg font-bold">Create Event</p>
                <button onClick={() => setShowCreateModal(false)} className="text-white/30 hover:text-white/60 transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>

              {/* Image upload */}
              <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageSelect} className="hidden" />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-white/10 hover:border-[#d4845a]/40 flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative group"
              >
                {newImagePreview ? (
                  <>
                    <img src={newImagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-white text-sm font-medium">Change Image</p>
                    </div>
                  </>
                ) : (
                  <>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-white/15 mb-3">
                      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
                    </svg>
                    <p className="text-white/25 text-sm">Upload cover image</p>
                    <p className="text-white/15 text-xs mt-1">Optional</p>
                  </>
                )}
              </div>
            </div>

            {/* Form fields */}
            <div className="p-6 space-y-4">
              <input type="text" placeholder="Event Name" value={newName} onChange={(e) => setNewName(e.target.value)}
                className="w-full py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-lg font-semibold placeholder:text-white/20 placeholder:font-normal focus:outline-none focus:border-[#d4845a]/60 transition-all" />

              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
                <div className="flex items-center px-4 py-3 gap-3">
                  <span className="text-white/30 text-sm w-10">Start</span>
                  <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)}
                    className="flex-1 bg-transparent text-white text-sm focus:outline-none" />
                </div>
                <div className="border-t border-white/[0.06] flex items-center px-4 py-3 gap-3">
                  <span className="text-white/30 text-sm w-10">Time</span>
                  <input type="text" placeholder="e.g. 9 AM – 5 PM" value={newDuration} onChange={(e) => setNewDuration(e.target.value)}
                    className="flex-1 bg-transparent text-white text-sm placeholder:text-white/20 focus:outline-none" />
                </div>
              </div>

              <div className="flex items-center gap-3 px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/30 flex-shrink-0">
                  <path d="M12 13a3 3 0 100-6 3 3 0 000 6z"/><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                </svg>
                <input type="text" placeholder="Choose Location" value={newLocation} onChange={(e) => setNewLocation(e.target.value)}
                  className="flex-1 bg-transparent text-white text-sm placeholder:text-white/20 focus:outline-none" />
              </div>

              <div className="flex items-start gap-3 px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/30 flex-shrink-0 mt-0.5">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 7h10M7 12h10M7 17h6"/>
                </svg>
                <textarea placeholder="Add Description" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} rows={3}
                  className="flex-1 bg-transparent text-white text-sm placeholder:text-white/20 focus:outline-none resize-none" />
              </div>

              <div className="flex items-center gap-3 px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/30 flex-shrink-0">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
                <input type="text" placeholder="Admin PIN (4 digits)" value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))} maxLength={4}
                  className="flex-1 bg-transparent text-white text-sm placeholder:text-white/20 focus:outline-none tracking-[0.3em]" />
              </div>

              <button onClick={handleCreateEvent} disabled={!newName.trim() || !newDate || newPin.length !== 4 || creating}
                className="w-full py-4 rounded-xl text-base font-semibold disabled:opacity-30 transition-all"
                style={{ background: "linear-gradient(135deg, #ffb691, #d4845a)", color: "#000" }}>
                {creating ? "Creating..." : "Create Event"}
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
