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

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-[#6b6b8a]">Loading...</p></div>;

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-xl mb-4 text-[#6b6b8a]">Event not found</p>
          <button onClick={() => router.push("/")} className="text-[#6b5ce7] hover:underline text-sm">← Go Home</button>
        </div>
      </div>
    );
  }

  const date = formatDate(event.date);
  const isLive = event.status === "live";
  const eventUrl = typeof window !== "undefined" ? `${window.location.origin}/event/${event.id}` : "";

  return (
    <div className="min-h-screen relative">
      <div className="ambient-bg" />

      {/* Copied toast */}
      {copied && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 bg-[#6b5ce7] text-white text-sm font-medium rounded-full shadow-lg page-enter">
          Link copied to clipboard
        </div>
      )}

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-8 py-6 sm:py-10">

        <button onClick={() => router.push("/")} className="text-[#6b5ce7]/50 hover:text-[#6b5ce7] text-sm mb-6 sm:mb-8 inline-flex items-center gap-1 transition-colors">
          ← Home
        </button>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">

          {/* ─── LEFT: Poster Card ─── */}
          <div className="w-full lg:w-[340px] flex-shrink-0">
            <div className="rounded-2xl overflow-hidden border border-white/80 bg-gradient-to-br from-[#6b5ce7]/10 via-white/60 to-[#f07068]/5 backdrop-blur-xl p-6 sm:p-8 text-center shadow-sm">
              <div className="inline-flex items-center gap-2 mb-5 opacity-60">
                <svg width="18" height="18" viewBox="0 0 40 40" fill="none">
                  <path d="M8 28c4-2 8-3 12-3s8 1 12 3" stroke="#6b5ce7" strokeWidth="2.5" strokeLinecap="round"/>
                  <path d="M10 22c3-1.5 7-2.5 10-2.5s7 1 10 2.5" stroke="#6b5ce7" strokeWidth="2.5" strokeLinecap="round"/>
                  <path d="M12 16c2.5-1 5.5-1.5 8-1.5s5.5.5 8 1.5" stroke="#6b5ce7" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
                <span className="text-xs font-bold text-[#6b6b8a]">GripAge</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black leading-tight mb-3 text-[#1a1a3e]">{event.name}</h2>

              {event.description && (
                <p className="text-xs text-[#6b6b8a] mb-3 leading-relaxed line-clamp-3">{event.description}</p>
              )}

              <p className="text-sm text-[#1a1a3e]/60">{date.full}</p>
              {event.duration && <p className="text-sm text-[#6b5ce7]/70 mt-0.5">{event.duration}</p>}
              {event.location && <p className="text-xs text-[#6b6b8a] mt-1">{event.location}</p>}

              <div className="mt-5 pt-4 border-t border-[#1a1a3e]/8 text-xs text-[#6b6b8a]">
                {count} participant{count !== 1 ? "s" : ""}
              </div>
            </div>

            {/* Share section */}
            <div className="mt-4 bg-white/50 border border-white/80 rounded-2xl p-4 backdrop-blur-xl shadow-sm">
              <p className="text-[10px] text-[#6b6b8a] uppercase tracking-wider mb-3 text-center">Share Event</p>
              <div className="flex gap-2 mb-3">
                <button onClick={handleCopyLink} className="flex-1 py-2.5 px-4 bg-white/50 border border-[#6b5ce7]/15 rounded-xl text-sm text-[#6b6b8a] hover:text-[#1a1a3e] hover:bg-white/70 transition-all text-center">
                  Copy Link
                </button>
                <button onClick={() => setShowQR(!showQR)} className="py-2.5 px-4 bg-white/50 border border-[#6b5ce7]/15 rounded-xl text-sm text-[#6b6b8a] hover:text-[#1a1a3e] hover:bg-white/70 transition-all">
                  {showQR ? "Hide" : "QR"}
                </button>
              </div>
              {showQR && eventUrl && (
                <div className="flex justify-center">
                  <div className="p-3 bg-white rounded-xl shadow-sm">
                    <QRCodeSVG value={eventUrl} size={120} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ─── RIGHT: Details ─── */}
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl sm:text-4xl font-black mb-5 leading-tight text-[#1a1a3e]">{event.name}</h1>

            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl bg-white/60 border border-white/80 flex flex-col items-center justify-center flex-shrink-0 shadow-sm">
                <span className="text-[10px] font-bold text-[#6b5ce7] leading-none">{date.month}</span>
                <span className="text-xl font-black leading-none mt-0.5 text-[#1a1a3e]">{date.day}</span>
              </div>
              <div>
                <p className="font-semibold text-sm sm:text-base text-[#1a1a3e]">{date.full}</p>
                {event.duration && <p className="text-sm text-[#6b5ce7]/70">{event.duration}</p>}
              </div>
            </div>

            {event.location && (
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-xl bg-white/60 border border-white/80 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#6b6b8a]">
                    <path d="M12 13a3 3 0 100-6 3 3 0 000 6z"/><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                  </svg>
                </div>
                <p className="text-sm sm:text-base text-[#6b6b8a]">{event.location}</p>
              </div>
            )}

            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${isLive ? "bg-green-500/15 text-green-600" : "bg-[#1a1a3e]/5 text-[#6b6b8a]"}`}>
                {isLive && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
                {isLive ? "LIVE" : "ENDED"}
              </span>
              <span className="text-sm text-[#6b6b8a]">{count} participants</span>
            </div>

            <div className="space-y-3 mb-8">
              {isLive && (
                <button onClick={() => router.push(`/event/${event.id}/register`)} className="w-full py-4 px-6 rounded-full text-lg font-semibold bg-gradient-to-r from-[#e8a03c] to-[#f0a830] text-black shadow-lg shadow-[#e8a03c]/25 hover:shadow-[#e8a03c]/40 transition-all active:scale-[0.98]">
                  Take the Grip Test ↗
                </button>
              )}

              {!showResultLookup ? (
                <div className="flex gap-3">
                  <button onClick={() => setShowResultLookup(true)}
                    className="flex-1 py-3.5 px-6 rounded-full text-base font-semibold border-2 border-[#e8a03c] text-[#e8a03c] hover:bg-[#e8a03c]/10 transition-all">
                    View My Results
                  </button>
                  <button onClick={() => router.push(`/event/${event.id}/leaderboard`)}
                    className="flex-1 py-3.5 px-6 rounded-full text-base font-semibold border-2 border-[#e8a03c] text-[#e8a03c] hover:bg-[#e8a03c]/10 transition-all">
                    View Leaderboard
                  </button>
                </div>
              ) : (
                <div className="bg-white/60 border border-white/80 rounded-2xl p-5 backdrop-blur-xl shadow-sm">
                  <p className="text-sm text-[#6b6b8a] mb-3">Enter the email you registered with</p>
                  <input type="email" placeholder="your@email.com" value={lookupEmail}
                    onChange={(e) => { setLookupEmail(e.target.value); setLookupError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleLookupResult()}
                    className="glass-input w-full py-3 px-4 rounded-xl mb-3" />
                  {lookupError && <p className="text-red-600 text-sm mb-3">{lookupError}</p>}
                  <div className="flex gap-2">
                    <button onClick={handleLookupResult} disabled={!lookupEmail.trim() || lookingUp}
                      className="flex-1 py-3 px-4 rounded-xl font-semibold bg-gradient-to-r from-[#e8a03c] to-[#f0a830] text-black">
                      {lookingUp ? "Searching..." : "Find Results"}
                    </button>
                    <button onClick={() => { setShowResultLookup(false); setLookupEmail(""); setLookupError(""); }}
                      className="py-3 px-4 text-[#6b6b8a] hover:text-[#1a1a3e] transition-colors text-sm">Cancel</button>
                  </div>
                </div>
              )}
            </div>

            {event.description && (
              <div>
                <h3 className="text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider mb-3">About Event</h3>
                <p className="text-[#1a1a3e]/60 leading-relaxed text-sm whitespace-pre-wrap">{event.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
