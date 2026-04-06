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

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: "#080e1a" }}><p className="text-white/30">Loading...</p></div>;

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#080e1a" }}>
        <div className="text-center">
          <p className="text-xl mb-4 text-white/50">Event not found</p>
          <button onClick={() => router.push("/")} className="text-[#d4845a] hover:underline text-sm">← Go Home</button>
        </div>
      </div>
    );
  }

  const date = formatDate(event.date);
  const isLive = event.status === "live";
  const eventUrl = typeof window !== "undefined" ? `${window.location.origin}/event/${event.id}` : "";

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "#080e1a" }}>
      {/* Blue light beam */}
      <div className="absolute top-0 right-0 w-[700px] h-[700px] pointer-events-none" style={{ background: "radial-gradient(ellipse at 80% 10%, rgba(56,189,248,0.1) 0%, rgba(56,189,248,0.02) 40%, transparent 70%)" }} />

      {/* Copied toast */}
      {copied && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 text-sm font-medium rounded-full shadow-lg page-enter text-black" style={{ background: "linear-gradient(135deg, #ffb691, #d4845a)" }}>
          Link copied to clipboard
        </div>
      )}

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-8 py-6 sm:py-10">

        <button onClick={() => router.push("/")} className="text-white/30 hover:text-white/60 text-sm mb-6 sm:mb-8 inline-flex items-center gap-1 transition-colors">← Home</button>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">

          {/* ─── LEFT: Poster Card ─── */}
          <div className="w-full lg:w-[380px] flex-shrink-0">
            <div className="rounded-2xl overflow-hidden border border-white/[0.08] relative" style={{ background: "linear-gradient(135deg, rgba(56,189,248,0.08), rgba(212,132,90,0.12), rgba(56,189,248,0.05))" }}>
              {/* Event cover image or placeholder */}
              {event.imageUrl ? (
                <div className="relative w-full aspect-[4/3]">
                  <img src={event.imageUrl} alt={event.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080e1a] via-transparent to-transparent" />
                </div>
              ) : (
                <div className="relative w-full aspect-[4/3] flex flex-col items-center justify-center" style={{ background: "linear-gradient(135deg, #1a3a5c, #d4845a40, #1a2a4c)" }}>
                  {/* GripAge branded placeholder */}
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
                      <path d="M8 28c4-2 8-3 12-3s8 1 12 3" stroke="#ffb691" strokeWidth="2.5" strokeLinecap="round"/>
                      <path d="M10 22c3-1.5 7-2.5 10-2.5s7 1 10 2.5" stroke="#ffb691" strokeWidth="2.5" strokeLinecap="round"/>
                      <path d="M12 16c2.5-1 5.5-1.5 8-1.5s5.5.5 8 1.5" stroke="#ffb691" strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                    <span className="text-sm font-bold text-[#ffb691]">GripAge</span>
                  </div>
                  {/* Orange corner ribbon */}
                  <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                    <div className="absolute top-3 -right-4 w-20 py-1 text-[8px] font-black text-white/80 text-center rotate-45" style={{ background: "linear-gradient(135deg, #d4845a, #ffb691)" }}>BIO</div>
                  </div>
                  <h2 className="text-2xl font-black text-white/90 text-center px-6 mt-8">{event.name}</h2>
                </div>
              )}
              {/* Event info overlay at bottom of card */}
              <div className="p-5">
                {!event.imageUrl && (
                  <>
                    <p className="text-sm text-white/40">{date.full}</p>
                    {event.duration && <p className="text-sm text-[#d4845a]/70 mt-0.5">{event.duration}</p>}
                  </>
                )}
                <div className="mt-3 pt-3 border-t border-white/5 text-xs text-white/25">
                  {count} participant{count !== 1 ? "s" : ""}
                </div>
              </div>
            </div>

            {/* Share section */}
            <div className="mt-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
              <p className="text-sm font-bold text-white/60 mb-3">Share Event</p>
              <div className="flex gap-2">
                <button onClick={handleCopyLink} className="flex-1 py-3 px-4 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/[0.08] transition-all flex items-center justify-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
                  Copy Link
                </button>
                <button onClick={() => setShowQR(!showQR)} className="py-3 px-4 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/[0.08] transition-all flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                  QR
                </button>
              </div>
              {showQR && eventUrl && (
                <div className="flex justify-center mt-4">
                  <div className="p-3 bg-white rounded-xl"><QRCodeSVG value={eventUrl} size={140} /></div>
                </div>
              )}
            </div>
          </div>

          {/* ─── RIGHT: Details ─── */}
          <div className="flex-1 min-w-0">
            <h1 className="text-4xl sm:text-5xl font-black mb-5 leading-tight">{event.name}</h1>

            {/* Date + Time */}
            <div className="flex items-center gap-4 mb-3">
              <div className="w-14 h-14 rounded-xl bg-white/[0.04] border border-white/[0.06] flex flex-col items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold text-[#d4845a] leading-none">{date.month}</span>
                <span className="text-xl font-black leading-none mt-0.5">{date.day}</span>
              </div>
              <div>
                <p className="font-semibold text-sm sm:text-base">{date.full}</p>
                {event.duration && <span className="text-sm text-white/40"> · {event.duration}</span>}
              </div>
            </div>

            {/* Location */}
            {event.location && (
              <div className="flex items-center gap-2 mb-3 text-sm text-white/40">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 13a3 3 0 100-6 3 3 0 000 6z"/><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
                {event.location}
              </div>
            )}

            {/* Status */}
            <div className="flex items-center gap-3 mb-6">
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${isLive ? "bg-green-500/15 text-green-400" : "bg-white/5 text-white/30"}`}>
                {isLive && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
                {isLive ? "LIVE" : "ENDED"}
              </span>
              <span className="text-sm text-white/25">{count} participants</span>
            </div>

            {/* ═══ ACTIONS ═══ */}
            <div className="space-y-3 mb-8">
              {isLive && (
                <button onClick={() => router.push(`/event/${event.id}/register`)}
                  className="w-full py-4 px-6 rounded-full text-lg font-bold transition-all active:scale-[0.98] text-black"
                  style={{ background: "linear-gradient(135deg, #ffb691, #d4845a)", boxShadow: "0 8px 32px rgba(212,132,90,0.25)" }}>
                  Take the Grip Test ↗
                </button>
              )}

              {!showResultLookup ? (
                <div className="flex gap-3">
                  <button onClick={() => setShowResultLookup(true)}
                    className="flex-1 py-3.5 px-6 rounded-full text-base font-semibold border border-[#d4845a]/40 text-[#d4845a] hover:bg-[#d4845a]/10 transition-all">
                    View My Results
                  </button>
                  <button onClick={() => router.push(`/event/${event.id}/leaderboard`)}
                    className="flex-1 py-3.5 px-6 rounded-full text-base font-semibold border border-[#d4845a]/40 text-[#d4845a] hover:bg-[#d4845a]/10 transition-all">
                    View Leaderboard
                  </button>
                </div>
              ) : (
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
                  <p className="text-sm text-white/40 mb-3">Enter the email you registered with</p>
                  <input type="email" placeholder="your@email.com" value={lookupEmail}
                    onChange={(e) => { setLookupEmail(e.target.value); setLookupError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleLookupResult()}
                    className="w-full py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-[#d4845a]/50 transition-all mb-3" />
                  {lookupError && <p className="text-red-400 text-sm mb-3">{lookupError}</p>}
                  <div className="flex gap-2">
                    <button onClick={handleLookupResult} disabled={!lookupEmail.trim() || lookingUp}
                      className="flex-1 py-3 px-4 rounded-xl font-semibold text-black disabled:opacity-30 transition-all"
                      style={{ background: "linear-gradient(135deg, #ffb691, #d4845a)" }}>
                      {lookingUp ? "Searching..." : "Find Results"}
                    </button>
                    <button onClick={() => { setShowResultLookup(false); setLookupEmail(""); setLookupError(""); }}
                      className="py-3 px-4 text-white/25 hover:text-white/50 transition-colors text-sm">Cancel</button>
                  </div>
                </div>
              )}
            </div>

            {/* About Event */}
            {event.description && (
              <div>
                <h3 className="text-xl font-bold mb-3">About Event</h3>
                <p className="text-white/50 leading-relaxed text-sm whitespace-pre-wrap">{event.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
