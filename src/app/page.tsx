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
    <div className="min-h-screen bg-[#080e1a] text-[#e5e2e1]">

      {/* ═══ NAVBAR ═══ */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#080e1a]/80 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <svg width="22" height="22" viewBox="0 0 40 40" fill="none">
              <path d="M8 28c4-2 8-3 12-3s8 1 12 3" stroke="#d4845a" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M10 22c3-1.5 7-2.5 10-2.5s7 1 10 2.5" stroke="#d4845a" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M12 16c2.5-1 5.5-1.5 8-1.5s5.5.5 8 1.5" stroke="#d4845a" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M14 10c2-.5 4-1 6-1s4 .5 6 1" stroke="#d4845a" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            <span className="text-lg font-black tracking-tight">Grip<span className="text-[#ffb691]">Age</span></span>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-8 text-[11px] font-semibold uppercase tracking-[0.15em] text-white/40">
              <button onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-white/70 transition-colors">How it works</button>
              <button onClick={() => document.getElementById("join")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-white/70 transition-colors">Join Event</button>
            </div>
            <a href="/organizer/login" className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#d4845a] hover:text-[#ffb691] transition-colors">
              Organizers
            </a>
          </div>
        </div>
      </header>

      {/* ═══ HERO — Split Layout ═══ */}
      <section className="relative min-h-screen flex items-center overflow-hidden">

        {/* Background image — right side on desktop, full on mobile */}
        <div className="absolute inset-0 lg:left-[40%]">
          <Image
            src="/bodybuilder-training-arm-with-resistance-band.jpg"
            alt="Athlete training grip strength"
            fill
            className="object-cover"
            style={{ objectPosition: "center 20%" }}
            priority
          />
          {/* Gradient overlay: dark from left, subtle on right */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to right, #080e1a 0%, rgba(8,14,26,0.85) 30%, rgba(8,14,26,0.4) 60%, rgba(8,14,26,0.3) 100%)" }} />
          {/* Mobile: heavier overlay so text is readable */}
          <div className="absolute inset-0 lg:hidden" style={{ background: "rgba(8,14,26,0.6)" }} />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12 pt-24 pb-16">
          <div className="max-w-xl">

            {/* Tag */}
            <p className="text-[#d4845a] text-[11px] font-semibold uppercase tracking-[0.2em] mb-6">Biological Age Through Grip Strength</p>

            {/* Headline — left-aligned, clear */}
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black leading-[0.95] mb-6" style={{ letterSpacing: "-0.03em" }}>
              Know your{" "}
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(135deg, #ffb691, #d4845a)" }}>
                true age.
              </span>
            </h1>

            {/* Subtext */}
            <p className="text-white/50 text-base sm:text-lg max-w-md leading-relaxed mb-10">
              Grip strength is one of the strongest predictors of longevity and overall health. Test yours at a live event and discover your biological age — instantly.
            </p>

            {/* Join Event Input */}
            <div id="join" className="max-w-sm mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Event Code"
                  value={joinCode}
                  onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setJoinError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                  maxLength={6}
                  aria-label="Event code"
                  className="glass-input flex-1 rounded-2xl py-4 px-5 uppercase font-bold tracking-[0.3em] text-base text-center"
                />
                <button
                  onClick={handleJoin}
                  disabled={!joinCode.trim() || loading}
                  className="btn-primary px-6 py-4 rounded-2xl font-bold text-sm uppercase tracking-wider whitespace-nowrap"
                >
                  {loading ? "..." : "Join"}
                </button>
              </div>
              {joinError && <p className="text-red-400 text-sm mt-2">{joinError}</p>}
            </div>

            {/* Trust line */}
            <div className="flex items-center gap-6 text-[10px] font-medium uppercase tracking-wider text-white/20">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400/60 animate-pulse" />
                Science-backed
              </span>
              <span>Instant results</span>
              <span>PDF report</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how-it-works" className="relative z-10 py-24 sm:py-32 px-6">
        <div className="max-w-6xl mx-auto">

          <div className="mb-16">
            <p className="text-[11px] text-[#d4845a] font-semibold uppercase tracking-[0.2em] mb-3">Process</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black" style={{ letterSpacing: "-0.03em" }}>How it works</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                num: "01",
                title: "Squeeze",
                desc: "Use a professional dynamometer to measure your max grip strength — left and right hand.",
                img: "/beautiful-brunette-female-sportswear-doing-lunge-with-barbell-fitness-club-gym.jpg",
              },
              {
                num: "02",
                title: "Analyze",
                desc: "Our algorithm compares your grip against population norms for your age, gender, height, and weight.",
                img: "/beautiful-girl-is-engaged-gym.jpg",
              },
              {
                num: "03",
                title: "Rank",
                desc: "See your biological age, where you stand on the leaderboard, and download your detailed PDF report.",
                img: "/man-moving-giant-tire-wheel-gym.jpg",
              },
            ].map((step) => (
              <div key={step.num} className="group rounded-2xl overflow-hidden bg-white/[0.03] border border-white/[0.06] hover:border-[#d4845a]/25 transition-colors">
                <div className="relative h-52 overflow-hidden">
                  <Image src={step.img} alt={step.title} fill className="object-cover object-top group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080e1a] via-[#080e1a]/40 to-transparent" />
                  <span className="absolute top-4 left-5 text-[11px] font-bold text-[#d4845a]/60 uppercase tracking-wider">{step.num}</span>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-black uppercase tracking-tight mb-2">{step.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ STATS BAR ═══ */}
      <section className="relative z-10 py-16 px-6 border-y border-white/[0.04]">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {[
            { value: "5K+", label: "Grips tested" },
            { value: "120+", label: "Events hosted" },
            { value: "7", label: "Vitality stages" },
            { value: "±15y", label: "Age delta range" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-3xl sm:text-4xl font-black text-[#d4845a]">{s.value}</p>
              <p className="text-xs text-white/30 mt-1 uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="relative z-10 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mb-12">

            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
                  <path d="M8 28c4-2 8-3 12-3s8 1 12 3" stroke="#d4845a" strokeWidth="2.5" strokeLinecap="round"/>
                  <path d="M10 22c3-1.5 7-2.5 10-2.5s7 1 10 2.5" stroke="#d4845a" strokeWidth="2.5" strokeLinecap="round"/>
                  <path d="M12 16c2.5-1 5.5-1.5 8-1.5s5.5.5 8 1.5" stroke="#d4845a" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
                <span className="text-sm font-black">Grip<span className="text-[#d4845a]">Age</span></span>
              </div>
              <p className="text-xs text-white/25 leading-relaxed max-w-xs">
                Discover your biological age through grip strength science. Backed by large-scale population research (LASI).
              </p>
            </div>

            {/* Links */}
            <div>
              <p className="text-[10px] text-white/30 font-semibold uppercase tracking-wider mb-4">Navigate</p>
              <div className="space-y-2.5">
                <button onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })} className="block text-sm text-white/30 hover:text-white/60 transition-colors">How it works</button>
                <button onClick={() => document.getElementById("join")?.scrollIntoView({ behavior: "smooth" })} className="block text-sm text-white/30 hover:text-white/60 transition-colors">Join Event</button>
                <a href="/organizer/login" className="block text-sm text-white/30 hover:text-white/60 transition-colors">Organizer Login</a>
              </div>
            </div>

            {/* Social */}
            <div>
              <p className="text-[10px] text-white/30 font-semibold uppercase tracking-wider mb-4">Connect</p>
              <div className="flex items-center gap-4">
                <a href="https://www.linkedin.com/company/foxoclub" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/30 hover:text-[#d4845a] hover:border-[#d4845a]/20 transition-all">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
                <a href="https://www.instagram.com/foxo.club/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/30 hover:text-[#d4845a] hover:border-[#d4845a]/20 transition-all">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/[0.04] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[11px] text-white/15">GripAge — Grip Strength & Biological Age</p>
            <p className="text-[11px] text-white/15">
              Powered by{" "}
              <a href="https://foxo.club" target="_blank" rel="noopener noreferrer" className="text-[#d4845a]/50 hover:text-[#d4845a] transition-colors">Foxo.club</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
