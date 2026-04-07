"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getEvent, getParticipantCount, getParticipantByEmail } from "@/lib/store";
import type { GripEvent } from "@/lib/types";
import { QRCodeSVG } from "qrcode.react";

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return {
    full: d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }),
    month: d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
    day: d.getDate(),
    year: d.getFullYear(),
    weekday: d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(),
  };
}

export default function EventLandingPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;
  const [event, setEvent] = useState<GripEvent | null>(null);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const [showResultLookup, setShowResultLookup] = useState(false);
  const [lookupEmail, setLookupEmail] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [lookingUp, setLookingUp] = useState(false);

  useEffect(() => {
    (async () => {
      const e = await getEvent(eventId);
      setEvent(e);
      if (e) setCount(await getParticipantCount(e.id));
      setLoading(false);
    })();
  }, [eventId]);

  async function handleLookupResult() {
    if (!lookupEmail.trim() || lookingUp) return;
    setLookupError("");
    setLookingUp(true);
    try {
      const p = await getParticipantByEmail(eventId, lookupEmail.trim());
      if (p) router.push(`/event/${eventId}/results?pid=${p.id}`);
      else setLookupError("No results found for this email.");
    } finally { setLookingUp(false); }
  }

  function handleCopyLink() {
    const url = `${window.location.origin}/event/${event?.id || eventId}`;
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  function handleCopyCode() {
    if (!event) return;
    navigator.clipboard.writeText(event.code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: "#0B0B0F" }}><p className="text-white/30">Loading...</p></div>;

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#0B0B0F" }}>
        <div className="text-center">
          <p className="text-xl mb-4 text-white/50">Event not found</p>
          <button onClick={() => router.push("/")} className="text-[#4ADE80] hover:underline text-sm">← Go Home</button>
        </div>
      </div>
    );
  }

  const date = formatDate(event.date);
  const isLive = event.status === "live";
  const eventUrl = typeof window !== "undefined" ? `${window.location.origin}/event/${event.id}` : "";

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "#0B0B0F" }}>
      {/* Ambient light beams */}
      <div className="absolute top-0 right-0 w-[700px] h-[700px] pointer-events-none" style={{ background: "radial-gradient(ellipse at 80% 10%, rgba(56,189,248,0.1) 0%, rgba(56,189,248,0.02) 40%, transparent 70%)" }} />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] pointer-events-none" style={{ background: "radial-gradient(ellipse at 20% 90%, rgba(212,132,90,0.06) 0%, transparent 60%)" }} />

      {/* Copied toast */}
      {copied && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 text-sm font-medium rounded-full shadow-lg page-enter text-black" style={{ background: "linear-gradient(135deg, #4ADE80, #4ADE80)" }}>
          Copied to clipboard
        </div>
      )}

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-8 py-6 sm:py-10">

        {/* Back button */}
        <button onClick={() => router.push("/")} className="text-white/30 hover:text-white/60 text-sm mb-6 sm:mb-8 inline-flex items-center gap-1.5 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5m7-7l-7 7 7 7"/></svg>
          Home
        </button>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">

          {/* ─── LEFT: Poster Card ─── */}
          <div className="w-full lg:w-[420px] flex-shrink-0 space-y-4">
            <div className="rounded-3xl overflow-hidden border border-white/[0.08] relative" style={{ background: "linear-gradient(160deg, rgba(56,189,248,0.06), rgba(212,132,90,0.1), rgba(56,189,248,0.04))" }}>

              {/* Event cover image or branded placeholder */}
              {event.imageUrl ? (
                <div className="relative w-full aspect-[4/3]">
                  <img src={event.imageUrl} alt={event.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0F] via-transparent to-transparent" />
                </div>
              ) : (
                <div className="relative w-full aspect-[4/3] flex flex-col items-center justify-center overflow-hidden" style={{ background: "linear-gradient(160deg, #0f2035, #4ADE8020, #0f1a30)" }}>
                  {/* Grid pattern overlay */}
                  <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
                    backgroundSize: "40px 40px",
                  }} />
                  {/* GripAge branded logo */}
                  <div className="absolute top-5 left-5 flex items-center gap-2">
                    <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
                      <path d="M8 28c4-2 8-3 12-3s8 1 12 3" stroke="#4ADE80" strokeWidth="2.5" strokeLinecap="round"/>
                      <path d="M10 22c3-1.5 7-2.5 10-2.5s7 1 10 2.5" stroke="#4ADE80" strokeWidth="2.5" strokeLinecap="round"/>
                      <path d="M12 16c2.5-1 5.5-1.5 8-1.5s5.5.5 8 1.5" stroke="#4ADE80" strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                    <span className="text-sm font-bold text-[#4ADE80]/80">GripAge</span>
                  </div>
                  {/* Status badge */}
                  <div className="absolute top-5 right-5">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-full ${isLive ? "bg-green-500/20 text-green-400 border border-green-400/30" : "bg-white/5 text-white/30 border border-white/10"}`}>
                      {isLive && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
                      {isLive ? "LIVE" : "ENDED"}
                    </span>
                  </div>
                  {/* Event name centered */}
                  <h2 className="text-2xl sm:text-3xl font-black text-white/90 text-center px-8 mt-8 leading-tight">{event.name}</h2>
                  {/* Date badge */}
                  <div className="mt-4 flex items-center gap-2">
                    <div className="bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-2 flex items-center gap-3">
                      <div className="text-center">
                        <span className="text-[10px] font-bold text-[#4ADE80] block leading-none">{date.month}</span>
                        <span className="text-2xl font-black leading-none mt-0.5 block">{date.day}</span>
                      </div>
                      <div className="w-px h-8 bg-white/10" />
                      <div>
                        <span className="text-xs text-white/50 block">{date.weekday}</span>
                        <span className="text-xs text-white/30 block">{date.year}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Event info bar */}
              <div className="p-5 space-y-3">
                {event.imageUrl && (
                  <>
                    <p className="text-sm text-white/40">{date.full}</p>
                    {event.duration && <p className="text-sm text-[#4ADE80]/70">{event.duration}</p>}
                  </>
                )}

                {/* Stats row */}
                <div className="flex items-center gap-4 py-3 px-4 rounded-xl glass">
                  <div className="flex-1 text-center">
                    <p className="text-2xl font-black">{count}</p>
                    <p className="text-[10px] text-white/30 uppercase tracking-wider">Participants</p>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="flex-1 text-center">
                    <p className="text-2xl font-black font-mono tracking-wider text-[#4ADE80]">{event.code}</p>
                    <p className="text-[10px] text-white/30 uppercase tracking-wider">Event Code</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Share section */}
            <div className="glass rounded-2xl p-5">
              <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Share Event</p>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={handleCopyLink} className="py-3 px-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/[0.08] transition-all flex flex-col items-center gap-1.5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
                  <span className="text-[10px]">Link</span>
                </button>
                <button onClick={handleCopyCode} className="py-3 px-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/[0.08] transition-all flex flex-col items-center gap-1.5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                  <span className="text-[10px]">Code</span>
                </button>
                <button onClick={() => setShowQR(!showQR)} className="py-3 px-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/[0.08] transition-all flex flex-col items-center gap-1.5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                  <span className="text-[10px]">QR</span>
                </button>
              </div>
              {showQR && eventUrl && (
                <div className="flex justify-center mt-4 p-4 bg-white/[0.02] rounded-xl border border-white/[0.05]">
                  <div className="p-3 bg-white rounded-xl"><QRCodeSVG value={eventUrl} size={160} /></div>
                </div>
              )}
            </div>

            {/* Organizer login link */}
            <a href={`/event/${event.id}/admin`} className="block text-center py-3 text-sm text-white/20 hover:text-white/40 transition-colors">
              Organizer Login →
            </a>
          </div>

          {/* ─── RIGHT: Details ─── */}
          <div className="flex-1 min-w-0">
            {/* Event title + status */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${isLive ? "bg-green-500/15 text-green-400 border border-green-400/20" : "bg-white/5 text-white/30 border border-white/10"}`}>
                  {isLive && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
                  {isLive ? "LIVE NOW" : "EVENT ENDED"}
                </span>
                <span className="text-xs text-white/20">{count} participant{count !== 1 ? "s" : ""}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-3 leading-tight">{event.name}</h1>
            </div>

            {/* Date + Location row */}
            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                </div>
                <div>
                  <p className="font-semibold text-sm sm:text-base">{date.full}</p>
                  {event.duration && <p className="text-sm text-white/40">{event.duration}</p>}
                </div>
              </div>

              {event.location && (
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="1.5"><path d="M12 13a3 3 0 100-6 3 3 0 000 6z"/><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
                  </div>
                  <p className="text-sm text-white/60">{event.location}</p>
                </div>
              )}
            </div>

            {/* ═══ MAIN ACTIONS ═══ */}
            <div className="space-y-3 mb-8">
              {isLive && (
                <button onClick={() => router.push(`/event/${event.id}/register`)}
                  className="w-full py-5 px-8 rounded-2xl text-lg font-black transition-all active:scale-[0.98] text-[#1a0800] uppercase tracking-wider"
                  style={{ background: "linear-gradient(135deg, #4ADE80, #4ADE80)", boxShadow: "0 8px 32px rgba(212,132,90,0.3)" }}>
                  Take the Grip Test
                </button>
              )}

              {!showResultLookup ? (
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setShowResultLookup(true)}
                    className="py-4 px-6 rounded-2xl text-sm font-bold border border-white/[0.1] bg-white/[0.03] text-white/60 hover:text-white hover:bg-white/[0.06] transition-all flex items-center justify-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                    View My Results
                  </button>
                  <button onClick={() => router.push(`/event/${event.id}/leaderboard`)}
                    className="py-4 px-6 rounded-2xl text-sm font-bold border border-white/[0.1] bg-white/[0.03] text-white/60 hover:text-white hover:bg-white/[0.06] transition-all flex items-center justify-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
                    Leaderboard
                  </button>
                </div>
              ) : (
                <div className="glass rounded-2xl p-5 page-enter">
                  <p className="text-sm text-white/40 mb-3">Enter the email you registered with</p>
                  <input type="email" placeholder="your@email.com" value={lookupEmail}
                    onChange={(e) => { setLookupEmail(e.target.value); setLookupError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleLookupResult()}
                    className="w-full py-3.5 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-[#4ADE80]/50 transition-all mb-3" />
                  {lookupError && <p className="text-red-400 text-sm mb-3">{lookupError}</p>}
                  <div className="flex gap-2">
                    <button onClick={handleLookupResult} disabled={!lookupEmail.trim() || lookingUp}
                      className="flex-1 py-3.5 px-4 rounded-xl font-bold text-[#1a0800] disabled:opacity-30 transition-all"
                      style={{ background: "linear-gradient(135deg, #4ADE80, #4ADE80)" }}>
                      {lookingUp ? "Searching..." : "Find Results"}
                    </button>
                    <button onClick={() => { setShowResultLookup(false); setLookupEmail(""); setLookupError(""); }}
                      className="py-3 px-4 text-white/25 hover:text-white/50 transition-colors text-sm rounded-xl border border-white/5">Cancel</button>
                  </div>
                </div>
              )}
            </div>

            {/* About Event */}
            {event.description && (
              <div className="mb-8">
                <h3 className="text-lg font-bold mb-3 text-white/70">About This Event</h3>
                <div className="glass rounded-2xl p-5">
                  <p className="text-white/50 leading-relaxed text-sm whitespace-pre-wrap">{event.description}</p>
                </div>
              </div>
            )}

            {/* What to expect */}
            <div className="mb-8">
              <h3 className="text-lg font-bold mb-4 text-white/70">What to Expect</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: "🤝", title: "Grip Strength Test", desc: "Squeeze a dynamometer — left and right hand" },
                  { icon: "🧬", title: "Biological Age", desc: "Get your bio age based on population norms" },
                  { icon: "📊", title: "Live Leaderboard", desc: "See where you rank among all participants" },
                  { icon: "📄", title: "PDF Report", desc: "Download your detailed results as a PDF" },
                ].map((item) => (
                  <div key={item.title} className="flex gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                    <span className="text-xl">{item.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-white/70">{item.title}</p>
                      <p className="text-xs text-white/30 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* How to join info */}
            <div className="glass rounded-2xl p-5">
              <p className="text-xs font-bold text-white/30 uppercase tracking-wider mb-3">How to Join</p>
              <div className="flex items-start gap-4">
                <div className="space-y-3 text-sm text-white/50">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#4ADE80]/15 text-[#4ADE80] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                    <p>Click &quot;Take the Grip Test&quot; above or share the event code <button onClick={handleCopyCode} className="font-mono font-bold text-[#4ADE80] hover:text-[#4ADE80] transition-colors">{event.code}</button> with participants</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#4ADE80]/15 text-[#4ADE80] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                    <p>Fill in your details and complete the grip strength measurement</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#4ADE80]/15 text-[#4ADE80] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                    <p>Get your biological age result instantly and check the leaderboard</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-white/5 flex items-center justify-between text-xs text-white/15">
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 40 40" fill="none">
              <path d="M8 28c4-2 8-3 12-3s8 1 12 3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M10 22c3-1.5 7-2.5 10-2.5s7 1 10 2.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            <span>GripAge</span>
          </div>
          <span>Powered by Foxo.club</span>
        </div>
      </div>
    </div>
  );
}
