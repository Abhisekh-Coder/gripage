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
    short: d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
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

  // View results
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
      else setLookupError("No results found for this email. Make sure you use the same email you registered with.");
    } finally { setLookingUp(false); }
  }

  function handleCopyLink() {
    const url = `${window.location.origin}/event/${event?.id || eventId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><p className="text-white/30">Loading...</p></div>;

  if (!event) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
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
    <div className="min-h-screen bg-[#0a0a0a]">

      {/* Copied toast */}
      {copied && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 bg-[#d4845a] text-white text-sm font-medium rounded-full shadow-lg page-enter">
          Link copied to clipboard
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6 sm:py-10">

        {/* Back */}
        <button onClick={() => router.push("/")} className="text-white/30 hover:text-white/60 text-sm mb-6 sm:mb-8 inline-flex items-center gap-1 transition-colors">
          ← Home
        </button>

        {/* ═══ LAYOUT: Stack on mobile, side-by-side on desktop ═══ */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">

          {/* ─── LEFT: Poster Card ─── */}
          <div className="w-full lg:w-[340px] flex-shrink-0">
            <div className="rounded-2xl overflow-hidden border border-white/[0.06] bg-gradient-to-br from-[#d4845a]/15 via-[#151520] to-[#0d1520] p-6 sm:p-8 text-center">
              {/* Logo */}
              <div className="inline-flex items-center gap-2 mb-5 opacity-50">
                <svg width="18" height="18" viewBox="0 0 40 40" fill="none">
                  <path d="M8 28c4-2 8-3 12-3s8 1 12 3" stroke="#d4845a" strokeWidth="2.5" strokeLinecap="round"/>
                  <path d="M10 22c3-1.5 7-2.5 10-2.5s7 1 10 2.5" stroke="#d4845a" strokeWidth="2.5" strokeLinecap="round"/>
                  <path d="M12 16c2.5-1 5.5-1.5 8-1.5s5.5.5 8 1.5" stroke="#d4845a" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
                <span className="text-xs font-bold text-white/50">GripAge</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black leading-tight mb-3">{event.name}</h2>

              {event.description && (
                <p className="text-xs text-white/35 mb-3 leading-relaxed line-clamp-3">{event.description}</p>
              )}

              <p className="text-sm text-white/45">{date.full}</p>
              {event.duration && <p className="text-sm text-[#d4845a]/70 mt-0.5">{event.duration}</p>}
              {event.location && <p className="text-xs text-white/25 mt-1">{event.location}</p>}

              <div className="mt-5 pt-4 border-t border-white/5 text-xs text-white/20">
                {count} participant{count !== 1 ? "s" : ""}
              </div>
            </div>

            {/* Share section */}
            <div className="mt-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
              <p className="text-[10px] text-white/20 uppercase tracking-wider mb-3 text-center">Share Event</p>
              <div className="flex gap-2 mb-3">
                <button onClick={handleCopyLink} className="flex-1 py-2.5 px-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/8 transition-all text-center">
                  Copy Link
                </button>
                <button onClick={() => setShowQR(!showQR)} className="py-2.5 px-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/8 transition-all">
                  {showQR ? "Hide" : "QR"}
                </button>
              </div>
              {showQR && eventUrl && (
                <div className="flex justify-center">
                  <div className="p-3 bg-white rounded-xl">
                    <QRCodeSVG value={eventUrl} size={120} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ─── RIGHT: Details ─── */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-black mb-5 leading-tight">{event.name}</h1>

            {/* Date + Time */}
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl bg-white/[0.04] border border-white/[0.06] flex flex-col items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold text-[#d4845a] leading-none">{date.month}</span>
                <span className="text-xl font-black leading-none mt-0.5">{date.day}</span>
              </div>
              <div>
                <p className="font-semibold text-sm sm:text-base">{date.full}</p>
                {event.duration && <p className="text-sm text-[#d4845a]/70">{event.duration}</p>}
              </div>
            </div>

            {/* Location */}
            {event.location && (
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/40">
                    <path d="M12 13a3 3 0 100-6 3 3 0 000 6z"/><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                  </svg>
                </div>
                <p className="text-sm sm:text-base text-white/60">{event.location}</p>
              </div>
            )}

            {/* Status */}
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${isLive ? "bg-green-500/15 text-green-400" : "bg-white/5 text-white/30"}`}>
                {isLive && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
                {isLive ? "LIVE" : "ENDED"}
              </span>
              <span className="text-sm text-white/20">{count} participants</span>
            </div>

            {/* ═══ ACTIONS ═══ */}
            <div className="space-y-3 mb-8">
              {isLive && (
                <button onClick={() => router.push(`/event/${event.id}/register`)} className="btn-primary w-full py-4 px-6 rounded-2xl text-lg font-semibold">
                  Take the Grip Test
                </button>
              )}

              {/* View Results */}
              {!showResultLookup ? (
                <button onClick={() => setShowResultLookup(true)}
                  className="w-full py-3.5 px-6 rounded-2xl text-base font-semibold bg-[#d4845a]/10 border border-[#d4845a]/20 text-[#d4845a] hover:bg-[#d4845a]/18 transition-all">
                  View My Results
                </button>
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
                      className="flex-1 py-3 px-4 bg-[#d4845a] hover:bg-[#c27548] disabled:bg-white/5 disabled:text-white/20 text-white font-semibold rounded-xl transition-all">
                      {lookingUp ? "Searching..." : "Find Results"}
                    </button>
                    <button onClick={() => { setShowResultLookup(false); setLookupEmail(""); setLookupError(""); }}
                      className="py-3 px-4 text-white/25 hover:text-white/50 transition-colors text-sm">Cancel</button>
                  </div>
                </div>
              )}

              <button onClick={() => router.push(`/event/${event.id}/leaderboard`)}
                className="w-full py-3.5 px-6 rounded-2xl text-base font-medium bg-white/[0.04] border border-white/[0.06] text-white/50 hover:text-white/70 hover:bg-white/[0.06] transition-all">
                View Leaderboard
              </button>
            </div>

            {/* About Event */}
            {event.description && (
              <div>
                <h3 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">About Event</h3>
                <p className="text-white/50 leading-relaxed text-sm whitespace-pre-wrap">{event.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
