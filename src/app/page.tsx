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
  const [mobileMenu, setMobileMenu] = useState(false);

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

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileMenu(false);
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] overflow-hidden">

      {/* ═══════════ NAVBAR ═══════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
                <path d="M8 28c4-2 8-3 12-3s8 1 12 3" stroke="#d4845a" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M10 22c3-1.5 7-2.5 10-2.5s7 1 10 2.5" stroke="#d4845a" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M12 16c2.5-1 5.5-1.5 8-1.5s5.5.5 8 1.5" stroke="#d4845a" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M14 10c2-.5 4-1 6-1s4 .5 6 1" stroke="#d4845a" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
              <span className="text-xl font-black tracking-tight">
                Grip<span className="text-[#d4845a]">Age</span>
              </span>
            </div>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-8 text-sm text-white/50">
              <button onClick={() => scrollTo("how-it-works")} className="hover:text-white transition-colors">How it works</button>
              <button onClick={() => scrollTo("join")} className="hover:text-white transition-colors">Join Event</button>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <a
                href="/organizer/login"
                className="hidden sm:block text-sm font-semibold text-white bg-[#d4845a] hover:bg-[#c27548] transition-colors px-5 py-2.5 rounded-full"
              >
                Organizer Login
              </a>
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenu(!mobileMenu)}
                className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10"
              >
                <span className="text-white/60">{mobileMenu ? "✕" : "☰"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenu && (
          <div className="md:hidden bg-[#1a1a1a] border border-white/10 mx-4 rounded-2xl p-4 space-y-1 mt-1">
            <button onClick={() => scrollTo("how-it-works")} className="block w-full text-left px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-colors">How it works</button>
            <button onClick={() => scrollTo("join")} className="block w-full text-left px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-colors">Join Event</button>
            <a href="/organizer/login" className="block w-full text-left px-4 py-3 text-[#d4845a] hover:bg-white/5 rounded-xl transition-colors">Organizer Login</a>
          </div>
        )}
      </nav>

      {/* ═══════════ HERO SECTION ═══════════ */}
      <section className="relative min-h-screen flex items-center">
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/female-with-short-hair-doing-pull-ups-gym-club.jpg"
            alt="Fitness"
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/85 to-[#0a0a0a]/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-[#0a0a0a]/60" />
        </div>

        {/* Hero content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 pt-24 pb-16 w-full">
          <div className="max-w-xl">
            {/* Tag */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-white/50 mb-6">
              <span className="w-2 h-2 rounded-full bg-[#d4845a]" />
              Science-backed grip testing
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight mb-6">
              Your grip reveals
              <br />
              your <em className="not-italic text-[#d4845a]">biological age</em>
            </h1>

            {/* Subtext */}
            <p className="text-lg text-white/50 max-w-md mb-10 leading-relaxed">
              Grip strength is one of the strongest predictors of longevity. Test yours and discover how your body is really aging.
            </p>

            {/* Join Event CTA */}
            <div id="join" className="flex flex-col sm:flex-row gap-3 max-w-md">
              <input
                type="text"
                placeholder="Enter event code"
                value={joinCode}
                onChange={(e) => {
                  setJoinCode(e.target.value.toUpperCase());
                  setJoinError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                maxLength={6}
                className="flex-1 py-4 px-5 bg-white/5 border border-white/15 rounded-2xl text-white text-center text-lg tracking-[0.3em] uppercase placeholder:tracking-normal placeholder:text-white/25 focus:outline-none focus:border-[#d4845a]/60 focus:bg-white/8 transition-all"
              />
              <button
                onClick={handleJoin}
                disabled={!joinCode.trim() || loading}
                className="py-4 px-8 bg-[#d4845a] hover:bg-[#c27548] disabled:bg-white/5 disabled:text-white/20 text-white font-semibold rounded-2xl transition-all text-lg whitespace-nowrap"
              >
                {loading ? "..." : "Join Event"}
              </button>
            </div>
            {joinError && (
              <p className="text-red-400 text-sm mt-3">{joinError}</p>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section id="how-it-works" className="relative z-10 py-24 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16">
            <p className="text-[#d4845a] text-sm font-semibold tracking-widest uppercase mb-3">How it works</p>
            <h2 className="text-3xl sm:text-4xl font-bold">Three simple steps</h2>
          </div>

          {/* Steps grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative group">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-6 border border-white/5">
                <Image
                  src="/beautiful-brunette-female-sportswear-doing-lunge-with-barbell-fitness-club-gym.jpg"
                  alt="Register"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500 !relative"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
              </div>
              <div className="flex items-start gap-4">
                <span className="text-3xl font-black text-[#d4845a]/30">01</span>
                <div>
                  <h3 className="text-lg font-bold mb-1">Register</h3>
                  <p className="text-white/40 text-sm leading-relaxed">Enter your details — age, height, weight, and fitness background.</p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative group">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-6 border border-white/5">
                <Image
                  src="/bodybuilder-training-arm-with-resistance-band.jpg"
                  alt="Grip test"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500 !relative"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
              </div>
              <div className="flex items-start gap-4">
                <span className="text-3xl font-black text-[#d4845a]/30">02</span>
                <div>
                  <h3 className="text-lg font-bold mb-1">Grip test</h3>
                  <p className="text-white/40 text-sm leading-relaxed">Squeeze the dynamometer. We measure your grip strength in kilograms.</p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative group">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-6 border border-white/5">
                <Image
                  src="/man-moving-giant-tire-wheel-gym.jpg"
                  alt="Get results"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500 !relative"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
              </div>
              <div className="flex items-start gap-4">
                <span className="text-3xl font-black text-[#d4845a]/30">03</span>
                <div>
                  <h3 className="text-lg font-bold mb-1">Get results</h3>
                  <p className="text-white/40 text-sm leading-relaxed">See your biological age, delta score, and how you compare — instantly.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="relative z-10 border-t border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-white/25">
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 40 40" fill="none">
              <path d="M8 28c4-2 8-3 12-3s8 1 12 3" stroke="#d4845a" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M10 22c3-1.5 7-2.5 10-2.5s7 1 10 2.5" stroke="#d4845a" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M12 16c2.5-1 5.5-1.5 8-1.5s5.5.5 8 1.5" stroke="#d4845a" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            <span>GripAge</span>
          </div>
          <span>Science-backed biological age testing</span>
        </div>
      </footer>
    </div>
  );
}
