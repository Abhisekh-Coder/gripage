"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getEventByCode } from "@/lib/store";

export default function HomePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function join() {
    const c = code.trim().toUpperCase();
    if (!c) return;
    setError(""); setLoading(true);
    try {
      const ev = await getEventByCode(c);
      if (ev) router.push(`/event/${ev.id}`);
      else setError("Event not found.");
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-[#0B0B0F] overflow-x-hidden">

      {/* ═══ NAV ═══ */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-[#0B0B0F]/70 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#4ADE80]/10 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2.5" strokeLinecap="round"><path d="M6 18c3-1.5 6-2.5 9-2.5s6 1 9 2.5"/><path d="M8 13c2.5-1 5-1.5 7-1.5s4.5.5 7 1.5"/><path d="M10 8c2-.5 4-1 5-1s3 .5 5 1"/></svg>
            </div>
            <span className="text-base font-black tracking-tight">Grip<span className="text-[#4ADE80]">Age</span></span>
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="hidden sm:flex items-center gap-6 text-[11px] font-medium uppercase tracking-[0.12em] text-white/35">
              <button onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-white/60 transition-colors">How it works</button>
              <button onClick={() => document.getElementById("join")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-white/60 transition-colors">Join</button>
            </div>
            <a href="/organizer/login" className="text-[10px] sm:text-[11px] font-semibold text-[#4ADE80]/70 hover:text-[#4ADE80] transition-colors uppercase tracking-wider">Enterprise</a>
          </div>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="relative min-h-screen flex items-center">
        {/* BG image — right half on desktop, full blurred on mobile */}
        <div className="absolute inset-0 lg:left-[35%]">
          <Image src="/bodybuilder-training-arm-with-resistance-band.jpg" alt="Athlete" fill className="object-cover" style={{ objectPosition: "70% 20%" }} priority />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to right, #0B0B0F 0%, rgba(11,11,15,0.75) 40%, rgba(11,11,15,0.2) 70%, rgba(11,11,15,0.15) 100%)" }} />
          <div className="absolute inset-0 lg:hidden bg-[#0B0B0F]/70" />
          {/* Green ambient glow */}
          <div className="absolute bottom-0 left-[20%] w-[500px] h-[400px] pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(74,222,128,0.06) 0%, transparent 70%)" }} />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-6 lg:px-10 pt-24 sm:pt-28 pb-16 sm:pb-20">
          <div className="max-w-lg">

            {/* Pill badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-[10px] sm:text-[11px] font-medium text-[#4ADE80]/80 mb-6 sm:mb-8 border-[#4ADE80]/15">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-pulse" />
              Science-backed biological age testing
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black leading-[1.08] tracking-tight mb-4 sm:mb-5">
              Elevate Your Fitness.{" "}
              <br className="hidden sm:block" />
              Know <span className="text-[#4ADE80]">Your True Age.</span>
            </h1>

            <p className="text-white/40 text-sm sm:text-base lg:text-lg leading-relaxed mb-8 sm:mb-10 max-w-md">
              Grip strength is one of the strongest predictors of longevity. Test yours at a live event and discover your biological age — instantly.
            </p>

            {/* Join input */}
            <div id="join" className="flex gap-2 max-w-xs sm:max-w-sm mb-4">
              <input
                type="text" placeholder="Event Code" value={code} maxLength={6} aria-label="Event code"
                onChange={e => { setCode(e.target.value.toUpperCase()); setError(""); }}
                onKeyDown={e => e.key === "Enter" && join()}
                className="glass-input flex-1 py-3 sm:py-3.5 px-3 sm:px-4 text-center uppercase font-bold tracking-[0.2em] sm:tracking-[0.25em] text-sm"
              />
              <button onClick={join} disabled={!code.trim() || loading} className="btn-primary px-5 sm:px-6 py-3 sm:py-3.5 text-sm font-bold whitespace-nowrap">
                {loading ? "..." : "Join"}
              </button>
            </div>
            {error && <p className="text-red-400 text-xs mb-4">{error}</p>}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how" className="relative z-10 py-16 sm:py-24 lg:py-32 px-5 sm:px-6">
        {/* Ambient glow */}
        <div className="absolute top-0 left-[50%] -translate-x-1/2 w-[800px] h-[400px] pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(74,222,128,0.04) 0%, transparent 70%)" }} />

        <div className="max-w-6xl mx-auto relative">
          <div className="mb-14">
            <p className="text-[11px] text-[#4ADE80]/60 font-semibold uppercase tracking-[0.2em] mb-2">Process</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">How It Works</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {/* Step 1 — Squeeze */}
            <div className="glass-hover rounded-2xl overflow-hidden group">
              <div className="relative h-48 flex items-center justify-center bg-gradient-to-br from-[#4ADE80]/[0.04] to-transparent">
                <span className="absolute top-4 left-5 text-[10px] font-bold text-[#4ADE80]/40 tracking-wider">01</span>
                {/* Hand gripping icon */}
                <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="text-[#4ADE80]/20 group-hover:text-[#4ADE80]/30 transition-colors">
                  <path d="M28 52V32a4 4 0 018 0v-6a4 4 0 018 0v-2a4 4 0 018 0v8a4 4 0 018 0v16c0 10-6 18-16 18H40c-8 0-12-6-12-14z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M36 32v12M44 26v18M52 30v14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
                  <circle cx="40" cy="62" r="3" fill="currentColor" opacity="0.3"/>
                </svg>
                {/* Floating kg badge */}
                <div className="absolute bottom-4 right-5 glass px-3 py-1.5 rounded-lg text-[10px] font-bold text-[#4ADE80]/60">
                  45.2 kg
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-base font-black uppercase tracking-tight mb-1.5">Squeeze</h3>
                <p className="text-white/35 text-sm leading-relaxed">Grip a professional dynamometer with each hand. We record your maximum strength in kilograms.</p>
              </div>
            </div>

            {/* Step 2 — Analyze */}
            <div className="glass-hover rounded-2xl overflow-hidden group">
              <div className="relative h-48 flex items-center justify-center bg-gradient-to-br from-[#4ADE80]/[0.04] to-transparent">
                <span className="absolute top-4 left-5 text-[10px] font-bold text-[#4ADE80]/40 tracking-wider">02</span>
                {/* Analysis/heartbeat icon */}
                <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="text-[#4ADE80]/20 group-hover:text-[#4ADE80]/30 transition-colors">
                  <rect x="14" y="16" width="52" height="48" rx="6" stroke="currentColor" strokeWidth="2"/>
                  <path d="M14 32h12l6-10 8 20 6-14 6 8h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="40" cy="52" r="8" stroke="currentColor" strokeWidth="1.5" opacity="0.4"/>
                  <text x="40" y="56" textAnchor="middle" fill="currentColor" fontSize="10" fontWeight="bold" opacity="0.5">28</text>
                </svg>
                {/* Floating bio age badge */}
                <div className="absolute bottom-4 right-5 glass px-3 py-1.5 rounded-lg text-[10px] font-bold text-[#4ADE80]/60">
                  Bio Age: 28
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-base font-black uppercase tracking-tight mb-1.5">Analyze</h3>
                <p className="text-white/35 text-sm leading-relaxed">Our algorithm compares your grip against population norms — adjusted for age, gender, height, and weight.</p>
              </div>
            </div>

            {/* Step 3 — Rank */}
            <div className="glass-hover rounded-2xl overflow-hidden group">
              <div className="relative h-48 flex items-center justify-center bg-gradient-to-br from-[#4ADE80]/[0.04] to-transparent">
                <span className="absolute top-4 left-5 text-[10px] font-bold text-[#4ADE80]/40 tracking-wider">03</span>
                {/* Podium/ranking icon */}
                <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="text-[#4ADE80]/20 group-hover:text-[#4ADE80]/30 transition-colors">
                  <rect x="10" y="40" width="16" height="24" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <rect x="32" y="28" width="16" height="36" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <rect x="54" y="46" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <text x="18" y="58" textAnchor="middle" fill="currentColor" fontSize="10" fontWeight="bold" opacity="0.5">2</text>
                  <text x="40" y="46" textAnchor="middle" fill="currentColor" fontSize="10" fontWeight="bold" opacity="0.5">1</text>
                  <text x="62" y="60" textAnchor="middle" fill="currentColor" fontSize="10" fontWeight="bold" opacity="0.5">3</text>
                  <path d="M36 22l4-6 4 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
                </svg>
                {/* Floating rank badge */}
                <div className="absolute bottom-4 right-5 glass px-3 py-1.5 rounded-lg text-[10px] font-bold text-[#4ADE80]/60">
                  #1 of 42
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-base font-black uppercase tracking-tight mb-1.5">Rank</h3>
                <p className="text-white/35 text-sm leading-relaxed">See your biological age, where you stand on the live leaderboard, and download your PDF report.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section className="relative z-10 py-16 sm:py-20 px-5 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-14">
            <p className="text-[11px] text-[#4ADE80]/60 font-semibold uppercase tracking-[0.2em] mb-2">Features</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">What You Get</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: "Biological Age", desc: "Your body's true age based on grip strength science", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 8V4m0 4a4 4 0 100 8 4 4 0 000-8z"/><path d="M3 12h4m10 0h4M5.6 5.6l2.8 2.8m7.2 7.2l2.8 2.8M5.6 18.4l2.8-2.8m7.2-7.2l2.8-2.8"/></svg> },
              { title: "Live Leaderboard", desc: "Compete and rank against others at the event in real-time", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 20V10M12 20V4M6 20v-6"/></svg> },
              { title: "Grip Analysis", desc: "Left vs right comparison, percentile, expected strength for your age", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 12h-4l-3 9L9 3l-3 9H2"/></svg> },
              { title: "PDF Report", desc: "Download a detailed report with all your metrics and recommendations", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/><path d="M14 2v6h6M16 13H8m8 4H8m2-8H8"/></svg> },
            ].map(f => (
              <div key={f.title} className="glass rounded-2xl p-5 group hover:border-[#4ADE80]/20 transition-all hover:bg-white/[0.05]">
                <div className="w-10 h-10 rounded-xl bg-[#4ADE80]/8 border border-[#4ADE80]/15 flex items-center justify-center text-[#4ADE80] mb-4 group-hover:bg-[#4ADE80]/12 transition-colors">
                  {f.icon}
                </div>
                <h3 className="text-sm font-bold mb-1.5">{f.title}</h3>
                <p className="text-xs text-white/30 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="relative z-10 py-16 sm:py-20 px-5 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="glass-strong rounded-3xl relative overflow-hidden">
            {/* Green gradient glow */}
            <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% -20%, rgba(74,222,128,0.12) 0%, transparent 60%)" }} />
            <div className="absolute -top-px left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-[#4ADE80]/30 to-transparent" />

            <div className="relative px-8 sm:px-14 py-12 sm:py-16 flex flex-col lg:flex-row items-center gap-8">
              <div className="flex-1 text-center lg:text-left">
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">Ready to discover your true age?</h2>
                <p className="text-white/35 text-sm max-w-md mx-auto lg:mx-0">Join a live event or ask your organizer for an event code to get started.</p>
              </div>
              <button onClick={() => document.getElementById("join")?.scrollIntoView({ behavior: "smooth" })} className="btn-primary px-8 py-4 text-sm font-bold whitespace-nowrap shrink-0">
                Enter Event Code
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="relative z-10 border-t border-white/[0.04] py-10 sm:py-12 px-5 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-md bg-[#4ADE80]/10 flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2.5" strokeLinecap="round"><path d="M6 18c3-1.5 6-2.5 9-2.5s6 1 9 2.5"/><path d="M8 13c2.5-1 5-1.5 7-1.5s4.5.5 7 1.5"/></svg>
                </div>
                <span className="text-sm font-black">Grip<span className="text-[#4ADE80]">Age</span></span>
              </div>
              <p className="text-xs text-white/20 leading-relaxed max-w-xs">Biological age through grip strength science. Backed by LASI population research.</p>
            </div>
            <div>
              <p className="text-[10px] text-white/25 font-semibold uppercase tracking-wider mb-3">Navigate</p>
              <div className="space-y-2">
                <button onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })} className="block text-xs text-white/25 hover:text-white/50 transition-colors">How it works</button>
                <button onClick={() => document.getElementById("join")?.scrollIntoView({ behavior: "smooth" })} className="block text-xs text-white/25 hover:text-white/50 transition-colors">Join Event</button>
                <a href="/organizer/login" className="block text-xs text-white/25 hover:text-white/50 transition-colors">Enterprise Login</a>
              </div>
            </div>
            <div>
              <p className="text-[10px] text-white/25 font-semibold uppercase tracking-wider mb-3">Connect</p>
              <div className="flex gap-2">
                <a href="https://www.linkedin.com/company/foxoclub" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="w-8 h-8 rounded-lg glass flex items-center justify-center text-white/25 hover:text-[#4ADE80] transition-colors">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
                <a href="https://www.instagram.com/foxo.club/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-8 h-8 rounded-lg glass flex items-center justify-center text-white/25 hover:text-[#4ADE80] transition-colors">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-white/[0.04] pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-[10px] text-white/12">GripAge — Grip Strength & Biological Age</p>
            <p className="text-[10px] text-white/12">Powered by <a href="https://foxo.club" target="_blank" rel="noopener noreferrer" className="text-[#4ADE80]/30 hover:text-[#4ADE80]/60 transition-colors">Foxo.club</a></p>
          </div>
        </div>
      </footer>
    </div>
  );
}
