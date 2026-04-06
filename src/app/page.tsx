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

  return (
    <div className="min-h-screen bg-[#0a0a0a] overflow-hidden relative">

      {/* ═══ FULL-SCREEN BACKGROUND IMAGE ═══ */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/female-with-short-hair-doing-pull-ups-gym-club.jpg"
          alt="Fitness"
          fill
          className="object-cover object-center"
          priority
        />
        {/* Dark overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/70 via-[#0a0a0a]/40 to-[#0a0a0a]/90" />
        <div className="absolute inset-0 bg-[#0a0a0a]/30" />
      </div>

      {/* ═══ NAVBAR ═══ */}
      <nav className="relative z-50 px-6 lg:px-12 pt-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-16 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
              <path d="M8 28c4-2 8-3 12-3s8 1 12 3" stroke="#6b5ce7" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M10 22c3-1.5 7-2.5 10-2.5s7 1 10 2.5" stroke="#6b5ce7" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M12 16c2.5-1 5.5-1.5 8-1.5s5.5.5 8 1.5" stroke="#6b5ce7" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M14 10c2-.5 4-1 6-1s4 .5 6 1" stroke="#6b5ce7" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            <span className="text-lg font-black tracking-tight">
              Grip<span className="text-[#6b5ce7]">Age</span>
            </span>
          </div>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-6 text-sm text-white/50">
            <button onClick={() => document.getElementById("join")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-white transition-colors">Join Event</button>
          </div>

          {/* CTA */}
          <a
            href="/organizer/login"
            className="text-sm font-semibold text-white bg-[#6b5ce7] hover:bg-[#5a4bd6] transition-colors px-5 py-2 rounded-full"
          >
            Organizer
          </a>
        </div>

        {/* Mobile menu */}
        {mobileMenu && (
          <div className="sm:hidden bg-[#1a1a1a]/90 backdrop-blur-xl border border-white/10 mx-4 rounded-2xl p-4 space-y-1 mt-2">
            <a href="/organizer/login" className="block px-4 py-3 text-[#6b5ce7] rounded-xl">Organizer Login</a>
          </div>
        )}
      </nav>

      {/* ═══ HERO CONTENT — CENTERED ═══ */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-6 text-center">

        {/* Tag pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/8 backdrop-blur-sm border border-white/10 text-sm text-white/60 mb-8">
          YOUR FITNESS INDICATOR
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight mb-6 max-w-3xl">
          Grip strength
          <br />
          reveals <em className="not-italic font-black italic text-[#6b5ce7]" style={{ fontFamily: "Georgia, serif" }}>age</em>
        </h1>

        {/* Subtext */}
        <p className="text-lg sm:text-xl text-white/50 max-w-xl mb-12 leading-relaxed">
          Grip strength is one of the strongest predictors of longevity. Test yours at a live event and discover your biological age.
        </p>

        {/* Join Event CTA */}
        <div id="join" className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
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
            className="flex-1 py-4 px-5 bg-white/8 backdrop-blur-sm border border-white/15 rounded-full text-white text-center text-lg tracking-[0.3em] uppercase placeholder:tracking-normal placeholder:text-white/25 focus:outline-none focus:border-[#6b5ce7]/60 transition-all"
          />
          <button
            onClick={handleJoin}
            disabled={!joinCode.trim() || loading}
            className="py-4 px-8 bg-[#6b5ce7] hover:bg-[#5a4bd6] disabled:bg-white/10 disabled:text-white/20 text-white font-semibold rounded-full transition-all text-lg whitespace-nowrap"
          >
            {loading ? "..." : "Join Event →"}
          </button>
        </div>
        {joinError && <p className="text-red-400 text-sm mt-3">{joinError}</p>}
      </div>
    </div>
  );
}
