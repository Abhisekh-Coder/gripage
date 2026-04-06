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
    <div className="min-h-screen bg-[#080e1a] overflow-x-hidden text-[#e5e2e1]">

      {/* ═══ FULL-SCREEN HERO BACKGROUND ═══ */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/bodybuilder-training-arm-with-resistance-band.jpg"
          alt="Fitness"
          fill
          className="object-cover"
          style={{ objectPosition: "center 25%" }}
          priority
        />
        {/* Radial dark overlay — lighter so image shows through */}
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center 40%, rgba(8,14,26,0.1) 0%, rgba(8,14,26,0.7) 70%, rgba(8,14,26,0.92) 100%)" }} />
        {/* Subtle copper radial pulse */}
        <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 35%, rgba(212,132,90,0.06) 0%, rgba(212,132,90,0) 60%)" }} />
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
            The hand is the <br />
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(135deg, #ffb691 0%, #d4845a 100%)" }}>visible part</span> of <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(135deg, #ffb691 0%, #d4845a 100%)" }}>the brain.</span>
          </h1>

          {/* Subtext */}
          <p className="text-[#d9c2b8] text-lg md:text-xl max-w-xl mx-auto opacity-80 leading-relaxed">
            Our precision sensors translate kinetic energy into biological insights. Discover your true biological age through grip strength science.
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
      <section id="how-it-works" className="relative z-10 py-32 px-6 bg-[#080e1a]/80 backdrop-blur-3xl">
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
              <div className="relative w-full h-56 overflow-hidden rounded-t-2xl">
                <Image src="/beautiful-brunette-female-sportswear-doing-lunge-with-barbell-fitness-club-gym.jpg" alt="Grip strength measurement" fill className="object-cover object-top group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#080e1a] via-[#080e1a]/30 to-transparent" />
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

              <div className="p-6">
                <h3 className="text-xl font-black tracking-tight uppercase mb-2">Squeeze</h3>
                <p className="text-[#d9c2b8]/60 leading-relaxed text-sm">
                  Use a professional dynamometer to measure your max grip strength with sub-millisecond precision sensors.
                </p>
              </div>
            </div>

            {/* Step 2 — Analyze */}
            <div className="bg-white/[0.02] backdrop-blur-sm border border-white/5 rounded-2xl relative overflow-hidden group hover:border-[#d4845a]/30 transition-colors">
              <div className="absolute -right-4 -top-4 text-[150px] font-black text-white/[0.02] pointer-events-none group-hover:text-[#d4845a]/[0.03] transition-colors leading-none">2</div>

              <div className="relative w-full h-56 overflow-hidden rounded-t-2xl">
                <Image src="/beautiful-girl-is-engaged-gym.jpg" alt="Bio analysis" fill className="object-cover object-top group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#080e1a] via-[#080e1a]/30 to-transparent" />
                <div className="absolute bottom-4 left-6">
                  <div className="w-12 h-12 rounded-full bg-[#d4845a]/15 border border-[#d4845a]/25 flex items-center justify-center backdrop-blur-sm">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffb691" strokeWidth="2"><path d="M21 12h-4l-3 9L9 3l-3 9H2"/></svg>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-black tracking-tight uppercase mb-2">Analyze</h3>
                <p className="text-[#d9c2b8]/60 leading-relaxed text-sm">
                  Our algorithm compares your grip against population norms for your age, gender, height, and weight — revealing your true biological age.
                </p>
              </div>
            </div>

            {/* Step 3 — Rank */}
            <div className="bg-white/[0.02] backdrop-blur-sm border border-white/5 rounded-2xl relative overflow-hidden group hover:border-[#d4845a]/30 transition-colors">
              <div className="absolute -right-4 -top-4 text-[150px] font-black text-white/[0.02] pointer-events-none group-hover:text-[#d4845a]/[0.03] transition-colors leading-none">3</div>

              <div className="relative w-full h-56 overflow-hidden rounded-t-2xl">
                <Image src="/man-moving-giant-tire-wheel-gym.jpg" alt="Leaderboard ranking" fill className="object-cover object-center group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#080e1a] via-[#080e1a]/30 to-transparent" />
                <div className="absolute bottom-4 left-6">
                  <div className="w-12 h-12 rounded-full bg-[#d4845a]/15 border border-[#d4845a]/25 flex items-center justify-center backdrop-blur-sm">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffb691" strokeWidth="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-black tracking-tight uppercase mb-2">Rank</h3>
                <p className="text-[#d9c2b8]/60 leading-relaxed text-sm">
                  See where you stand on the live event leaderboard and download your detailed bio-age report in real-time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="relative z-10 py-12 px-6 bg-[#080e1a] border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-5">
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 40 40" fill="none">
              <path d="M8 28c4-2 8-3 12-3s8 1 12 3" stroke="#d4845a" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M10 22c3-1.5 7-2.5 10-2.5s7 1 10 2.5" stroke="#d4845a" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M12 16c2.5-1 5.5-1.5 8-1.5s5.5.5 8 1.5" stroke="#d4845a" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            <span className="text-sm font-black tracking-tight">Grip<span className="text-[#d4845a]">Age</span></span>
          </div>
          <p className="text-xs text-white/30">
            Powered by{" "}
            <a href="https://foxo.club" target="_blank" rel="noopener noreferrer" className="text-[#d4845a] hover:text-[#ffb691] font-semibold transition-colors">
              Foxo.club
            </a>
          </p>
          <div className="flex items-center gap-4">
            <a href="https://www.linkedin.com/company/foxoclub" target="_blank" rel="noopener noreferrer" className="text-white/25 hover:text-[#d4845a] transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </a>
            <a href="https://www.instagram.com/foxo.club/" target="_blank" rel="noopener noreferrer" className="text-white/25 hover:text-[#d4845a] transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
