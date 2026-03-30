"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createEvent, getLiveEvents, getPastEvents, getEventByCode } from "@/lib/store";
import type { GripEvent } from "@/lib/types";

export default function HomePage() {
  const router = useRouter();
  const [mode, setMode] = useState<"home" | "create" | "join">("home");
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState(new Date().toISOString().split("T")[0]);
  const [adminPin, setAdminPin] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [loading, setLoading] = useState(false);
  const [liveEvents, setLiveEvents] = useState<GripEvent[]>([]);
  const [pastEvents, setPastEvents] = useState<GripEvent[]>([]);

  useEffect(() => {
    getLiveEvents().then(setLiveEvents);
    getPastEvents().then(setPastEvents);
  }, []);

  async function handleCreate() {
    if (!eventName.trim() || adminPin.length !== 4) return;
    setLoading(true);
    try {
      const event = await createEvent(eventName.trim(), eventDate, adminPin);
      router.push(`/event/${event.id}`);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    setJoinError("");
    setLoading(true);
    try {
      const event = await getEventByCode(code);
      if (event) {
        router.push(`/event/${event.id}`);
      } else {
        setJoinError("Event not found. Check the code and try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="ambient-bg" />

      <div className="relative z-10">
        <div className="min-h-screen flex flex-col lg:flex-row">

          {/* Left: Content */}
          <div className="flex-1 flex items-center justify-center p-6 lg:p-16">
            <div className="page-enter w-full max-w-lg">

              <div className="flex flex-wrap gap-2 mb-6">
                <span className="glass-card px-4 py-1.5 rounded-full text-xs text-white/60 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />Grip Strength
                </span>
                <span className="glass-card px-4 py-1.5 rounded-full text-xs text-white/60 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />Biological Age
                </span>
                <span className="glass-card px-4 py-1.5 rounded-full text-xs text-white/60 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />Fitness Analysis
                </span>
              </div>

              <h1 className="text-5xl lg:text-7xl font-black leading-[0.95] mb-4">
                <span className="text-white/90">KNOW YOUR</span><br />
                <span className="bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">TRUE AGE</span>
              </h1>
              <p className="text-white/40 text-lg lg:text-xl mb-8 max-w-md leading-relaxed">
                Measure your grip strength, discover your biological age, and compete on the leaderboard.
              </p>

              <div className="flex flex-col gap-3 mb-10">
                {[
                  { icon: "💪", text: "Grip Strength Measurement" },
                  { icon: "🧬", text: "Biological Age Calculation" },
                  { icon: "🏆", text: "Real-time Leaderboard" },
                  { icon: "📊", text: "Fitness Analysis & PDF Report" },
                ].map((f) => (
                  <div key={f.text} className="glass-card-hover rounded-xl px-4 py-3 flex items-center gap-3 w-fit">
                    <span className="text-lg">{f.icon}</span>
                    <span className="text-white/70 text-sm font-medium">{f.text}</span>
                  </div>
                ))}
              </div>

              {mode === "home" && (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button onClick={() => setMode("create")} className="btn-primary py-4 px-8 rounded-2xl text-lg flex-1">Create Event</button>
                    <button onClick={() => setMode("join")} className="btn-secondary py-4 px-8 rounded-2xl text-lg flex-1">Join Event</button>
                  </div>

                  {/* Live Events */}
                  {liveEvents.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-white/5">
                      <p className="text-xs text-green-400/60 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />Live Events
                      </p>
                      <div className="space-y-2">
                        {liveEvents.map((e) => (
                          <a key={e.id} href={`/event/${e.id}`} className="glass-card-hover block py-3 px-4 rounded-xl">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-medium">{e.name}</span>
                                <span className="text-white/30 text-sm ml-2">{e.date}</span>
                              </div>
                              <span className="glass-card px-2 py-0.5 rounded text-xs text-green-400 font-mono">{e.code}</span>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Past Events */}
                  {pastEvents.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/5">
                      <p className="text-xs text-white/30 uppercase tracking-wider mb-3">Past Events</p>
                      <div className="space-y-2">
                        {pastEvents.slice(0, 5).map((e) => (
                          <a key={e.id} href={`/event/${e.id}`} className="glass-card-hover block py-3 px-4 rounded-xl opacity-60">
                            <span className="font-medium">{e.name}</span>
                            <span className="text-white/30 text-sm ml-2">{e.date}</span>
                            <span className="text-white/20 text-xs ml-2">(ended)</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {mode === "create" && (
                <div className="space-y-4 max-w-md">
                  <div className="flex items-center gap-3 mb-2">
                    <button onClick={() => setMode("home")} className="glass-card w-10 h-10 rounded-xl flex items-center justify-center text-white/50 hover:text-white transition-colors">←</button>
                    <h2 className="text-xl font-bold">Create New Event</h2>
                  </div>
                  <div className="glass-card rounded-2xl p-5 space-y-4">
                    <div>
                      <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">Event Name</label>
                      <input type="text" placeholder="e.g. Annual Wellness Day 2026" value={eventName} onChange={(e) => setEventName(e.target.value)} className="glass-input w-full py-3 px-4 rounded-xl text-lg" />
                    </div>
                    <div>
                      <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">Event Date</label>
                      <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="glass-input w-full py-3 px-4 rounded-xl text-lg" />
                    </div>
                    <div>
                      <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">Admin PIN</label>
                      <input type="text" placeholder="4-digit PIN" value={adminPin} onChange={(e) => setAdminPin(e.target.value.replace(/\D/g, "").slice(0, 4))} maxLength={4} className="glass-input w-full py-3 px-4 rounded-xl text-2xl text-center tracking-[0.5em] font-mono" />
                    </div>
                  </div>
                  <button onClick={handleCreate} disabled={!eventName.trim() || adminPin.length !== 4 || loading} className="btn-primary w-full py-4 px-6 rounded-2xl text-lg">
                    {loading ? "Creating..." : "Create Event"}
                  </button>
                </div>
              )}

              {mode === "join" && (
                <div className="space-y-4 max-w-md">
                  <div className="flex items-center gap-3 mb-2">
                    <button onClick={() => { setMode("home"); setJoinError(""); }} className="glass-card w-10 h-10 rounded-xl flex items-center justify-center text-white/50 hover:text-white transition-colors">←</button>
                    <h2 className="text-xl font-bold">Join Event</h2>
                  </div>
                  <div className="glass-card rounded-2xl p-5 space-y-3">
                    <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">Event Code</label>
                    <input
                      type="text"
                      placeholder="e.g. A3B7XK"
                      value={joinCode}
                      onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setJoinError(""); }}
                      onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                      className="glass-input w-full py-4 px-4 rounded-xl text-2xl text-center font-mono tracking-[0.3em] uppercase"
                    />
                    {joinError && <p className="text-red-400/80 text-sm text-center">{joinError}</p>}
                  </div>
                  <button onClick={handleJoin} disabled={!joinCode.trim() || loading} className="btn-primary w-full py-4 px-6 rounded-2xl text-lg">
                    {loading ? "Searching..." : "Join Event"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right: Hero visual (desktop) */}
          <div className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden">
            <div className="absolute top-[20%] right-[10%] w-72 h-72 rounded-full bg-green-500/10 blur-[100px]" />
            <div className="absolute bottom-[20%] left-[10%] w-56 h-56 rounded-full bg-emerald-500/8 blur-[80px]" />
            <div className="relative">
              <div className="w-80 h-80 rounded-full border border-white/5 flex items-center justify-center relative">
                <div className="w-64 h-64 rounded-full border border-white/8 flex items-center justify-center">
                  <div className="w-48 h-48 rounded-full glass-card-strong flex items-center justify-center flex-col">
                    <span className="text-7xl">💪</span>
                    <span className="text-green-400 font-black text-2xl mt-2">GripAge</span>
                  </div>
                </div>
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 glass-card-strong px-4 py-2 rounded-xl text-center hero-orbit-1">
                  <p className="text-xs text-white/40">Bio Age</p><p className="text-lg font-black text-green-400">31</p>
                </div>
                <div className="absolute -right-8 top-1/2 -translate-y-1/2 glass-card-strong px-4 py-2 rounded-xl text-center hero-orbit-2">
                  <p className="text-xs text-white/40">Grip</p><p className="text-lg font-black text-blue-400">45kg</p>
                </div>
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 glass-card-strong px-4 py-2 rounded-xl text-center hero-orbit-3">
                  <p className="text-xs text-white/40">Rank</p><p className="text-lg font-black text-amber-400">#1</p>
                </div>
                <div className="absolute -left-8 top-1/2 -translate-y-1/2 glass-card-strong px-4 py-2 rounded-xl text-center hero-orbit-4">
                  <p className="text-xs text-white/40">Score</p><p className="text-lg font-black text-rose-400">92</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
