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
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-8 text-[11px] font-medium uppercase tracking-[0.12em] text-white/35">
              <button onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-white/60 transition-colors">How it works</button>
              <button onClick={() => document.getElementById("join")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-white/60 transition-colors">Join</button>
            </div>
            <a href="/organizer/login" className="text-[11px] font-semibold text-[#4ADE80]/70 hover:text-[#4ADE80] transition-colors uppercase tracking-wider">Organizers</a>
          </div>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="relative min-h-screen flex items-center">
        {/* BG image — right half on desktop, full blurred on mobile */}
        <div className="absolute inset-0 lg:left-[35%]">
          <Image src="/bodybuilder-training-arm-with-resistance-band.jpg" alt="Athlete" fill className="object-cover" style={{ objectPosition: "70% 20%" }} priority />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to right, #0B0B0F 0%, rgba(11,11,15,0.75) 40%, rgba(11,11,15,0.2) 70%, rgba(11,11,15,0.15) 100%)" }} />
          <div className="absolute inset-0 lg:hidden bg-[#0B0B0F]/65" />
          {/* Green ambient glow */}
          <div className="absolute bottom-0 left-[20%] w-[500px] h-[400px] pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(74,222,128,0.06) 0%, transparent 70%)" }} />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-10 pt-28 pb-20">
          <div className="max-w-lg">

            {/* Pill badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass text-[11px] font-medium text-[#4ADE80]/80 mb-8 border-[#4ADE80]/15">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-pulse" />
              Science-backed biological age testing
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight mb-5">
              Elevate Your<br />
              Fitness. Know<br />
              <span className="text-[#4ADE80]">Your True Age.</span>
            </h1>

            <p className="text-white/40 text-base sm:text-lg leading-relaxed mb-10 max-w-md">
              Grip strength is one of the strongest predictors of longevity. Test yours at a live event and discover your biological age — instantly.
            </p>

            {/* Join input */}
            <div id="join" className="flex gap-2 max-w-sm mb-4">
              <input
                type="text" placeholder="Event Code" value={code} maxLength={6} aria-label="Event code"
                onChange={e => { setCode(e.target.value.toUpperCase()); setError(""); }}
                onKeyDown={e => e.key === "Enter" && join()}
                className="glass-input flex-1 py-3.5 px-4 text-center uppercase font-bold tracking-[0.25em] text-sm"
              />
              <button onClick={join} disabled={!code.trim() || loading} className="btn-primary px-6 py-3.5 text-sm font-bold whitespace-nowrap">
                {loading ? "..." : "Join"}
              </button>
            </div>
            {error && <p className="text-red-400 text-xs mb-4">{error}</p>}

            {/* Powered by badge */}
            <div className="mt-10 flex items-center gap-2 text-[10px] text-white/15">
              <span>Powered by</span>
              <a href="https://foxo.club" target="_blank" rel="noopener noreferrer" className="text-[#4ADE80]/30 hover:text-[#4ADE80]/50 font-medium transition-colors">Foxo.club</a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how" className="relative z-10 py-24 sm:py-32 px-6">
        {/* Ambient glow */}
        <div className="absolute top-0 left-[50%] -translate-x-1/2 w-[800px] h-[400px] pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(74,222,128,0.04) 0%, transparent 70%)" }} />

        <div className="max-w-6xl mx-auto relative">
          <div className="mb-14">
            <p className="text-[11px] text-[#4ADE80]/60 font-semibold uppercase tracking-[0.2em] mb-2">Process</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">How It Works</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              { n: "01", t: "Squeeze", d: "Grip a professional dynamometer with each hand. We record your max strength.", img: "/beautiful-brunette-female-sportswear-doing-lunge-with-barbell-fitness-club-gym.jpg" },
              { n: "02", t: "Analyze", d: "Our algorithm compares your grip against population norms — age, gender, height, weight.", img: "/beautiful-girl-is-engaged-gym.jpg" },
              { n: "03", t: "Rank", d: "Get your biological age, percentile ranking, and download a detailed PDF report.", img: "/man-moving-giant-tire-wheel-gym.jpg" },
            ].map(s => (
              <div key={s.n} className="group glass-hover rounded-2xl overflow-hidden">
                <div className="relative h-48 overflow-hidden">
                  <Image src={s.img} alt={s.t} fill className="object-cover object-top group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0F] via-[#0B0B0F]/40 to-transparent" />
                  <span className="absolute top-4 left-5 text-[10px] font-bold text-[#4ADE80]/40 tracking-wider">{s.n}</span>
                </div>
                <div className="p-5">
                  <h3 className="text-base font-black uppercase tracking-tight mb-1.5">{s.t}</h3>
                  <p className="text-white/35 text-sm leading-relaxed">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-14">
            <p className="text-[11px] text-[#4ADE80]/60 font-semibold uppercase tracking-[0.2em] mb-2">Features</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">What You Get</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: "🧬", title: "Biological Age", desc: "Your body's true age based on grip strength science" },
              { icon: "📊", title: "Live Leaderboard", desc: "Compete and rank against others at the event" },
              { icon: "💪", title: "Grip Analysis", desc: "Left/right comparison, percentile, expected strength" },
              { icon: "📄", title: "PDF Report", desc: "Download a detailed report with all your metrics" },
            ].map(f => (
              <div key={f.title} className="glass rounded-2xl p-5 group hover:border-[#4ADE80]/15 transition-colors">
                <span className="text-2xl block mb-3">{f.icon}</span>
                <h3 className="text-sm font-bold mb-1">{f.title}</h3>
                <p className="text-xs text-white/30 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="glass-strong rounded-3xl p-10 sm:p-14 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 50% 0%, rgba(74,222,128,0.08) 0%, transparent 60%)" }} />
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-3">Ready to discover your true age?</h2>
              <p className="text-white/35 text-sm mb-8 max-w-md mx-auto">Join a live event or ask your organizer for an event code to get started.</p>
              <button onClick={() => document.getElementById("join")?.scrollIntoView({ behavior: "smooth" })} className="btn-primary px-8 py-3.5 text-sm font-bold">
                Enter Event Code
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="relative z-10 border-t border-white/[0.04] py-12 px-6">
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
                <a href="/organizer/login" className="block text-xs text-white/25 hover:text-white/50 transition-colors">Organizer Login</a>
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
