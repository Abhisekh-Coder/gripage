"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleJoin() {
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    setJoinError("");
    setLoading(true);
    try {
      const event = await getEventByCode(code);
      if (event) router.push(`/event/${event.id}`);
      else setJoinError("Event not found. Check the code and try again.");
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#050a08]">

      {/* ─── HERO SECTION ─── */}
      <section className="relative min-h-screen">

        {/* Background image with overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero-gym.jpg"
            alt="Fitness"
            fill
            className="object-cover object-center"
            priority
          />
          {/* Dark gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#050a08] via-[#050a08]/85 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050a08] via-transparent to-[#050a08]/40" />
          {/* Green accent glow */}
          <div className="absolute bottom-0 left-[30%] w-[500px] h-[300px] bg-green-500/8 blur-[120px] rounded-full" />
        </div>

        {/* Nav bar */}
        <nav className="relative z-20 flex items-center justify-between px-6 lg:px-16 py-5">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💪</span>
            <span className="text-xl font-black">Grip<span className="text-green-400">Age</span></span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-white/50">
            <span className="hover:text-white/80 cursor-pointer transition-colors">How it works</span>
            <span className="hover:text-white/80 cursor-pointer transition-colors">Leaderboard</span>
          </div>
        </nav>

        {/* Hero content */}
        <div className="relative z-10 flex flex-col lg:flex-row min-h-[calc(100vh-80px)]">

          {/* Left: Text + CTA */}
          <div className="flex-1 flex items-center px-6 lg:px-16 py-12 lg:py-0">
            <div className="page-enter w-full max-w-xl">

              {/* Tag pills */}
              <div className="flex flex-wrap gap-2 mb-8">
                {[
                  { dot: "bg-green-400", label: "Grip Strength" },
                  { dot: "bg-blue-400", label: "Biological Age" },
                  { dot: "bg-amber-400", label: "Fitness Analysis" },
                ].map((t) => (
                  <span key={t.label} className="glass-card px-4 py-1.5 rounded-full text-xs text-white/60 flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />{t.label}
                  </span>
                ))}
              </div>

              {/* Headline */}
              <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black leading-[0.9] mb-6 tracking-tight">
                <span className="text-white">TRAIN YOUR</span>
                <br />
                <span className="text-white">GRIP.</span>
                <br />
                <span className="bg-gradient-to-r from-green-400 via-emerald-300 to-green-400 bg-clip-text text-transparent">
                  KNOW YOUR AGE.
                </span>
              </h1>

              <p className="text-white/40 text-lg lg:text-xl mb-10 max-w-md leading-relaxed">
                Measure your grip strength, discover your biological age, and compete on the leaderboard.
              </p>

              {/* Feature pills - horizontal on desktop */}
              <div className="flex flex-wrap gap-3 mb-10">
                {[
                  { icon: "💪", text: "Grip Test" },
                  { icon: "🧬", text: "Bio Age" },
                  { icon: "🏆", text: "Leaderboard" },
                  { icon: "📄", text: "PDF Report" },
                ].map((f) => (
                  <div key={f.text} className="glass-card rounded-full px-5 py-2.5 flex items-center gap-2">
                    <span>{f.icon}</span>
                    <span className="text-white/60 text-sm font-medium">{f.text}</span>
                  </div>
                ))}
              </div>

              {/* CTA / Forms */}
              {mode === "home" && (
                <div>
                  <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <button onClick={() => setMode("create")} className="btn-primary py-4 px-10 rounded-2xl text-lg font-bold">
                      Create Event
                    </button>
                    <button onClick={() => setMode("join")} className="btn-secondary py-4 px-10 rounded-2xl text-lg">
                      Join Event
                    </button>
                  </div>
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
                      <input type="text" placeholder="e.g. Annual Wellness Day" value={eventName} onChange={(e) => setEventName(e.target.value)} className="glass-input w-full py-3 px-4 rounded-xl text-lg" />
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
                      type="text" placeholder="e.g. A3B7XK" value={joinCode}
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

          {/* Right: Image side (desktop) — the overlaid photos */}
          <div className="hidden lg:flex flex-1 items-end justify-center relative">
            {/* Floating stat cards over the image */}
            <div className="absolute top-[15%] right-[15%] z-20 glass-card-strong px-5 py-3 rounded-2xl text-center hero-orbit-1">
              <p className="text-xs text-white/40">Bio Age</p>
              <p className="text-2xl font-black text-green-400">31</p>
              <p className="text-[10px] text-white/30">years</p>
            </div>
            <div className="absolute top-[40%] right-[5%] z-20 glass-card-strong px-5 py-3 rounded-2xl text-center hero-orbit-2">
              <p className="text-xs text-white/40">Grip</p>
              <p className="text-2xl font-black text-blue-400">45</p>
              <p className="text-[10px] text-white/30">kg</p>
            </div>
            <div className="absolute bottom-[25%] right-[20%] z-20 glass-card-strong px-5 py-3 rounded-2xl text-center hero-orbit-3">
              <p className="text-xs text-white/40">Rank</p>
              <p className="text-2xl font-black text-amber-400">#1</p>
            </div>

            {/* Green accent line behind images */}
            <div className="absolute bottom-0 right-[25%] w-1 h-[70%] bg-gradient-to-t from-green-400/0 via-green-400/30 to-green-400/0 z-10" />

            {/* Person images */}
            <div className="relative z-10 flex items-end gap-0 mr-8">
              <div className="relative w-[240px] h-[500px] -mr-8">
                <Image
                  src="/hero-man.jpg"
                  alt="Male athlete"
                  fill
                  className="object-cover object-top rounded-t-3xl"
                  style={{ maskImage: "linear-gradient(to bottom, black 70%, transparent 100%)" }}
                />
                {/* Green glow outline */}
                <div className="absolute inset-0 rounded-t-3xl ring-2 ring-green-400/20" />
              </div>
              <div className="relative w-[220px] h-[460px]">
                <Image
                  src="/hero-woman.jpg"
                  alt="Female athlete"
                  fill
                  className="object-cover object-top rounded-t-3xl"
                  style={{ maskImage: "linear-gradient(to bottom, black 70%, transparent 100%)" }}
                />
                <div className="absolute inset-0 rounded-t-3xl ring-2 ring-green-400/10" />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile: small hero image peek */}
        <div className="lg:hidden relative h-48 -mt-4 overflow-hidden">
          <Image src="/hero-gym.jpg" alt="Fitness" fill className="object-cover object-center opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050a08] to-transparent" />
        </div>
      </section>

      {/* ─── EVENTS SECTION ─── */}
      {(liveEvents.length > 0 || pastEvents.length > 0) && (
        <section className="relative z-10 px-6 lg:px-16 py-12 max-w-5xl mx-auto">
          {/* Live Events */}
          {liveEvents.length > 0 && (
            <div className="mb-8">
              <p className="text-xs text-green-400/60 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />Live Events
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {liveEvents.map((e) => (
                  <a key={e.id} href={`/event/${e.id}`} className="glass-card-hover rounded-2xl p-5 block">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-bold text-lg">{e.name}</p>
                        <p className="text-white/30 text-sm">{e.date}</p>
                      </div>
                      <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse mt-2" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="glass-card px-3 py-1 rounded-lg text-xs text-green-400 font-mono tracking-wider">{e.code}</span>
                      <span className="text-xs text-white/30">Join now →</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Past Events */}
          {pastEvents.length > 0 && (
            <div>
              <p className="text-xs text-white/20 uppercase tracking-wider mb-4">Past Events</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {pastEvents.slice(0, 6).map((e) => (
                  <a key={e.id} href={`/event/${e.id}`} className="glass-card rounded-2xl p-5 block opacity-50 hover:opacity-70 transition-opacity">
                    <p className="font-medium">{e.name}</p>
                    <p className="text-white/30 text-sm">{e.date}</p>
                  </a>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Footer */}
      <footer className="relative z-10 px-6 lg:px-16 py-8 border-t border-white/5">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-white/20 text-xs">
          <span>GripAge — Grip Strength & Biological Age Game</span>
          <span>Powered by Indian Population Norms (LASI)</span>
        </div>
      </footer>
    </div>
  );
}
