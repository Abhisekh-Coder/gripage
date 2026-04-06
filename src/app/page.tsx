"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getEventByCode } from "@/lib/store";

export default function HomePage() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleJoin() {
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    setJoinError("");
    setLoading(true);
    try {
      const event = await getEventByCode(code);
      if (event) router.push(`/event/${event.id}`);
      else setJoinError("Event not found. Check the code and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] overflow-x-hidden text-[#e5e2e1]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ═══ FULL-SCREEN HERO BACKGROUND ═══ */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/bodybuilder-training-arm-with-resistance-band.jpg"
          alt="Fitness"
          fill
          className="object-cover object-center"
          priority
        />
        {/* Radial dark overlay */}
        <div className="absolute inset-0" style={{ background: "radial-gradient(circle at center, rgba(10,10,10,0.4) 0%, rgba(10,10,10,0.95) 100%)" }} />
        {/* Subtle copper radial pulse */}
        <div className="absolute inset-0" style={{ background: "radial-gradient(circle, rgba(212,132,90,0.08) 0%, rgba(212,132,90,0) 70%)" }} />
      </div>

      {/* ═══ NAVBAR ═══ */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-4xl z-50">
        <nav className="bg-white/[0.03] backdrop-blur-xl rounded-full px-8 py-4 flex justify-between items-center border border-white/5" style={{ boxShadow: "0 40px 40px rgba(212,132,90,0.06)" }}>
          <div className="flex items-center gap-2">
            <svg width="22" height="22" viewBox="0 0 40 40" fill="none">
              <path d="M8 28c4-2 8-3 12-3s8 1 12 3" stroke="#d4845a" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M10 22c3-1.5 7-2.5 10-2.5s7 1 10 2.5" stroke="#d4845a" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M12 16c2.5-1 5.5-1.5 8-1.5s5.5.5 8 1.5" stroke="#d4845a" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M14 10c2-.5 4-1 6-1s4 .5 6 1" stroke="#d4845a" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            <span className="text-xl font-black tracking-tight">
              Grip<span className="text-[#ffb691]">Age</span>
            </span>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-8 text-[10px] font-bold uppercase tracking-[0.2em] text-[#d9c2b8]">
              <button onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-[#ffb691] transition-colors">How it works</button>
              <button onClick={() => document.getElementById("join")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-[#ffb691] transition-colors">Join Event</button>
            </div>
            <a
              href="/organizer/login"
              className="bg-white/5 hover:bg-white/10 text-[#ffb691] px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all active:scale-95 border border-[#ffb691]/10"
            >
              Organizers
            </a>
          </div>
        </nav>
      </header>

      {/* ═══ HERO SECTION ═══ */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 pt-20">
        <div className="max-w-3xl w-full text-center space-y-12">

          {/* Tag */}
          <p className="text-[#ffb691] text-[10px] font-bold uppercase tracking-[0.3em] opacity-80">Biological Metric Analysis</p>

          {/* Headline */}
          <h1 className="text-5xl md:text-8xl font-black leading-[0.9]" style={{ letterSpacing: "-0.05em" }}>
            Grip strength <br />
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(135deg, #ffb691 0%, #d4845a 100%)" }}>reveals age</span>
          </h1>

          {/* Subtext */}
          <p className="text-[#d9c2b8] text-lg md:text-xl max-w-xl mx-auto opacity-70 italic" style={{ fontFamily: "Georgia, serif" }}>
            &ldquo;The hand is the visible part of the brain.&rdquo; Our precision sensors translate kinetic energy into biological insights.
          </p>

          {/* Join Event Input */}
          <div id="join" className="relative max-w-md mx-auto">
            <div className="bg-[#201f1f]/40 backdrop-blur-md p-2 rounded-2xl border border-[#53433c]/15">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-grow">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a18d83" strokeWidth="1.5"><circle cx="12" cy="12" r="3"/><path d="M12 2v4m0 12v4m10-10h-4M6 12H2m15.07-7.07l-2.83 2.83M9.76 14.24l-2.83 2.83m12.14 0l-2.83-2.83M9.76 9.76L6.93 6.93"/></svg>
                  </div>
                  <input
                    type="text"
                    placeholder="EVENT CODE"
                    value={joinCode}
                    onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setJoinError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                    maxLength={6}
                    className="w-full bg-[#353534]/50 border-none rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-[#53433c] focus:outline-none focus:ring-1 focus:ring-[#d4845a]/40 uppercase font-black tracking-[0.4em] text-lg transition-all"
                  />
                </div>
                <button
                  onClick={handleJoin}
                  disabled={!joinCode.trim() || loading}
                  className="font-black uppercase tracking-widest text-xs px-8 py-4 rounded-xl shadow-lg transition-transform active:scale-95 whitespace-nowrap disabled:opacity-30 disabled:cursor-not-allowed text-[#552000]"
                  style={{ background: "linear-gradient(135deg, #ffb691 0%, #d4845a 100%)", boxShadow: "0 8px 24px rgba(212,132,90,0.15)" }}
                >
                  {loading ? "..." : "Join Event"}
                </button>
              </div>
            </div>

            {joinError && <p className="text-red-400 text-sm mt-3">{joinError}</p>}

            {/* Status indicators */}
            <div className="mt-8 flex justify-center gap-12 text-[10px] font-bold uppercase tracking-widest text-[#53433c]">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse" />
                LIVE CONNECTED
              </div>
              <div className="flex items-center gap-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                SECURE PROTOCOL
              </div>
            </div>
          </div>
        </div>

        {/* Floating stat card — desktop only */}
        <div className="absolute bottom-12 left-12 hidden lg:block">
          <div className="bg-white/[0.02] backdrop-blur-sm border border-white/5 p-6 rounded-2xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full border-2 border-[#d4845a]/20 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
                  <path d="M8 28c4-2 8-3 12-3s8 1 12 3" stroke="#d4845a" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M10 22c3-1.5 7-2.5 10-2.5s7 1 10 2.5" stroke="#d4845a" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <p className="text-[8px] text-[#a18d83] uppercase tracking-widest">Global Avg. Strength</p>
                <p className="text-2xl font-black tracking-tight">42.4 <span className="text-xs font-normal text-[#a18d83]">kg/f</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Vertical text — xl desktop only */}
        <div className="absolute top-1/2 right-12 -translate-y-1/2 hidden xl:block opacity-40">
          <div className="flex flex-col gap-8 items-center">
            <div className="h-32 w-px bg-gradient-to-b from-transparent via-[#d4845a]/30 to-transparent" />
            <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-[#53433c]" style={{ writingMode: "vertical-lr" }}>SYSTEM CALIBRATED: 0.002ms</p>
            <div className="h-32 w-px bg-gradient-to-b from-transparent via-[#d4845a]/30 to-transparent" />
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how-it-works" className="relative z-10 py-32 px-6 bg-[#0a0a0a]/80 backdrop-blur-3xl">
        <div className="max-w-6xl mx-auto">

          {/* Section header */}
          <div className="mb-20 text-center">
            <h2 className="text-3xl md:text-5xl font-black uppercase mb-4" style={{ letterSpacing: "-0.05em" }}>How it works</h2>
            <div className="w-12 h-1 bg-[#d4845a] mx-auto" />
          </div>

          {/* Steps grid */}
          <div className="grid md:grid-cols-3 gap-8">

            {/* Step 1 — Squeeze */}
            <div className="bg-white/[0.02] backdrop-blur-sm border border-white/5 rounded-2xl relative overflow-hidden group hover:border-[#d4845a]/30 transition-colors">
              <div className="absolute -right-4 -top-4 text-[150px] font-black text-white/[0.02] pointer-events-none group-hover:text-[#d4845a]/[0.03] transition-colors leading-none">1</div>

              {/* Image */}
              <div className="relative w-full h-52 overflow-hidden rounded-t-2xl">
                <Image src="/bodybuilder-training-arm-with-resistance-band.jpg" alt="Grip strength measurement" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />
                <div className="absolute bottom-4 left-6">
                  <div className="w-12 h-12 rounded-full bg-[#d4845a]/15 border border-[#d4845a]/25 flex items-center justify-center backdrop-blur-sm">
                    <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
                      <path d="M8 28c4-2 8-3 12-3s8 1 12 3" stroke="#ffb691" strokeWidth="2.5" strokeLinecap="round"/>
                      <path d="M10 22c3-1.5 7-2.5 10-2.5s7 1 10 2.5" stroke="#ffb691" strokeWidth="2.5" strokeLinecap="round"/>
                      <path d="M12 16c2.5-1 5.5-1.5 8-1.5s5.5.5 8 1.5" stroke="#ffb691" strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="p-8 pt-6">
                <h3 className="text-2xl font-black tracking-tight uppercase mb-3">Squeeze</h3>
                <p className="text-[#d9c2b8]/70 leading-relaxed text-sm">
                  Participants use a professional dynamometer to measure their max grip strength. Our high-fidelity sensors capture kinetic data points at sub-millisecond intervals.
                </p>
              </div>
            </div>

            {/* Step 2 — Analyze */}
            <div className="bg-white/[0.02] backdrop-blur-sm border border-white/5 rounded-2xl relative overflow-hidden group hover:border-[#d4845a]/30 transition-colors">
              <div className="absolute -right-4 -top-4 text-[150px] font-black text-white/[0.02] pointer-events-none group-hover:text-[#d4845a]/[0.03] transition-colors leading-none">2</div>

              {/* Superpower Score Card */}
              <div className="relative w-full h-52 overflow-hidden rounded-t-2xl flex items-center justify-center" style={{ background: "linear-gradient(145deg, #c46a35, #d4845a, #b85c2a)" }}>
                {/* Subtle hand silhouette bg */}
                <div className="absolute inset-0 opacity-10">
                  <Image src="/beautiful-girl-is-engaged-gym.jpg" alt="" fill className="object-cover blur-sm" />
                </div>
                <div className="relative text-center text-white z-10">
                  <p className="text-sm italic font-medium opacity-90 mb-3" style={{ fontFamily: "Georgia, serif" }}>superpower score</p>
                  {/* Arc gauge */}
                  <div className="relative inline-block mb-1">
                    <svg width="120" height="70" viewBox="0 0 120 70">
                      <path d="M 10 65 A 50 50 0 0 1 110 65" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="5" strokeLinecap="round" />
                      <path d="M 10 65 A 50 50 0 0 1 110 65" fill="none" stroke="white" strokeWidth="5" strokeLinecap="round"
                        strokeDasharray="157" strokeDashoffset={157 * (1 - 0.88)} />
                    </svg>
                    <div className="absolute inset-0 flex items-end justify-center pb-0">
                      <span className="text-4xl font-black leading-none">88</span>
                    </div>
                  </div>
                  <p className="text-xs opacity-60">out of 100</p>
                  <p className="text-sm font-medium mt-2 opacity-90">You&apos;re very healthy. Keep going!</p>
                </div>
              </div>

              <div className="p-8 pt-6">
                <h3 className="text-2xl font-black tracking-tight uppercase mb-3">Analyze</h3>
                <p className="text-[#d9c2b8]/70 leading-relaxed text-sm">
                  Our system instantly calculates your biological age and vitality score based on your unique biometric data, comparing it against the world&apos;s most comprehensive longevity database.
                </p>
              </div>
            </div>

            {/* Step 3 — Rank */}
            <div className="bg-white/[0.02] backdrop-blur-sm border border-white/5 rounded-2xl relative overflow-hidden group hover:border-[#d4845a]/30 transition-colors">
              <div className="absolute -right-4 -top-4 text-[150px] font-black text-white/[0.02] pointer-events-none group-hover:text-[#d4845a]/[0.03] transition-colors leading-none">3</div>

              {/* Trophy Card */}
              <div className="relative w-full h-52 overflow-hidden rounded-t-2xl flex items-center justify-center" style={{ background: "linear-gradient(145deg, #5b3f8c, #7b5ea7, #6a4d96)" }}>
                <div className="relative text-center z-10">
                  {/* Trophy SVG */}
                  <svg width="100" height="100" viewBox="0 0 100 100" className="mx-auto drop-shadow-lg">
                    {/* Base */}
                    <ellipse cx="50" cy="88" rx="18" ry="4" fill="#c47a3a"/>
                    <rect x="36" y="82" width="28" height="8" rx="2" fill="#d4945a"/>
                    {/* Stem */}
                    <rect x="44" y="60" width="12" height="24" rx="3" fill="url(#gold-stem)"/>
                    {/* Cup */}
                    <path d="M25 20 C25 50 40 60 50 60 C60 60 75 50 75 20 Z" fill="url(#gold-cup)" stroke="#e8c060" strokeWidth="1"/>
                    {/* Handles */}
                    <path d="M25 25 C15 25 12 35 18 42 C22 46 25 42 25 38" fill="none" stroke="#d4a44a" strokeWidth="3" strokeLinecap="round"/>
                    <path d="M75 25 C85 25 88 35 82 42 C78 46 75 42 75 38" fill="none" stroke="#d4a44a" strokeWidth="3" strokeLinecap="round"/>
                    {/* Star */}
                    <polygon points="50,28 53,36 62,36 55,41 58,50 50,44 42,50 45,41 38,36 47,36" fill="#e87040" className="drop-shadow-sm"/>
                    {/* Sparkles */}
                    <path d="M20 15 L22 18 L20 21 L18 18 Z" fill="#f0d080" opacity="0.7"/>
                    <path d="M80 50 L82 53 L80 56 L78 53 Z" fill="#f0d080" opacity="0.7"/>
                    <path d="M30 55 L31.5 57 L30 59 L28.5 57 Z" fill="#f0d080" opacity="0.5"/>
                    <defs>
                      <linearGradient id="gold-cup" x1="25" y1="20" x2="75" y2="60">
                        <stop offset="0%" stopColor="#f0d080"/>
                        <stop offset="50%" stopColor="#d4a44a"/>
                        <stop offset="100%" stopColor="#c49030"/>
                      </linearGradient>
                      <linearGradient id="gold-stem" x1="44" y1="60" x2="56" y2="84">
                        <stop offset="0%" stopColor="#d4a44a"/>
                        <stop offset="100%" stopColor="#c49030"/>
                      </linearGradient>
                    </defs>
                  </svg>
                  <p className="text-white/80 text-sm font-bold mt-2 tracking-wide">#1 on Leaderboard</p>
                </div>
              </div>

              <div className="p-8 pt-6">
                <h3 className="text-2xl font-black tracking-tight uppercase mb-3">Rank</h3>
                <p className="text-[#d9c2b8]/70 leading-relaxed text-sm">
                  See where you stand on the live event leaderboard and download your detailed bio-age report. Share your metrics and track your performance against peers in real-time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="relative z-10 py-12 px-6 bg-[#0a0a0a] border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 40 40" fill="none">
              <path d="M8 28c4-2 8-3 12-3s8 1 12 3" stroke="#d4845a" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M10 22c3-1.5 7-2.5 10-2.5s7 1 10 2.5" stroke="#d4845a" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M12 16c2.5-1 5.5-1.5 8-1.5s5.5.5 8 1.5" stroke="#d4845a" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            <span className="text-sm font-black tracking-tight">Grip<span className="text-[#d4845a]">Age</span></span>
          </div>
          <p className="text-[10px] text-[#53433c] uppercase tracking-widest">Biological Precision Analysis</p>
        </div>
      </footer>
    </div>
  );
}
