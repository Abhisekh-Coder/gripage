"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getEvent, getParticipantCount, getParticipantByEmail } from "@/lib/store";
import type { GripEvent } from "@/lib/types";
import { QRCodeSVG } from "qrcode.react";

function formatEventDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

export default function EventLandingPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;
  const [event, setEvent] = useState<GripEvent | null>(null);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // View results by email
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

  if (loading) {
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><p className="text-white/30">Loading...</p></div>;
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-2xl mb-4 text-white/50">Event not found</p>
          <button onClick={() => router.push("/")} className="text-[#d4845a] hover:underline">Go Home</button>
        </div>
      </div>
    );
  }

  const eventUrl = typeof window !== "undefined" ? `${window.location.origin}/event/${event.id}` : "";
  const isLive = event.status === "live";
  const dateMonth = new Date(event.date + "T00:00:00").toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  const dateDay = new Date(event.date + "T00:00:00").getDate();

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6">

        {/* Back */}
        <button onClick={() => router.push("/")} className="text-white/30 hover:text-white/60 text-sm mb-8 block transition-colors">← Home</button>

        {/* ═══ TWO-COLUMN LAYOUT ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8 lg:gap-12">

          {/* ─── LEFT: Event Poster Card ─── */}
          <div>
            <div className="rounded-2xl overflow-hidden border border-white/[0.06] bg-gradient-to-br from-[#d4845a]/20 via-[#0a0a0a] to-[#1a1a2e] p-6 sm:p-8 text-center">
              {/* Logo */}
              <div className="inline-flex items-center gap-2 mb-6">
                <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
                  <path d="M8 28c4-2 8-3 12-3s8 1 12 3" stroke="#d4845a" strokeWidth="2.5" strokeLinecap="round"/>
                  <path d="M10 22c3-1.5 7-2.5 10-2.5s7 1 10 2.5" stroke="#d4845a" strokeWidth="2.5" strokeLinecap="round"/>
                  <path d="M12 16c2.5-1 5.5-1.5 8-1.5s5.5.5 8 1.5" stroke="#d4845a" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
                <span className="text-sm font-bold text-white/50">GripAge</span>
              </div>

              {/* Event name */}
              <h1 className="text-2xl sm:text-3xl font-black leading-tight mb-4">{event.name}</h1>

              {/* Subtitle */}
              {event.description && (
                <p className="text-sm text-white/40 mb-4 leading-relaxed">{event.description.length > 80 ? event.description.slice(0, 80) + "..." : event.description}</p>
              )}

              {/* Date + time */}
              <p className="text-sm text-white/50 mb-1">{formatEventDate(event.date)}</p>
              {event.duration && <p className="text-sm text-[#d4845a]/80">{event.duration}</p>}
              {event.location && <p className="text-sm text-white/30 mt-1">{event.location}</p>}

              {/* Participant count */}
              <div className="mt-6 pt-4 border-t border-white/5">
                <p className="text-xs text-white/25">{count} participants</p>
              </div>
            </div>

            {/* QR Code */}
            <div className="mt-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 text-center">
              <p className="text-[10px] text-white/25 uppercase tracking-wider mb-3">Share Event</p>
              {eventUrl && (
                <div className="inline-block p-3 bg-white rounded-xl">
                  <QRCodeSVG value={eventUrl} size={140} />
                </div>
              )}
              <p className="text-xs text-white/20 font-mono mt-3 break-all">{eventUrl}</p>
            </div>
          </div>

          {/* ─── RIGHT: Event Details ─── */}
          <div>
            {/* Title (large) */}
            <h2 className="text-3xl sm:text-4xl font-black mb-4">{event.name}</h2>

            {/* Date row */}
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl bg-white/[0.04] border border-white/[0.06] flex flex-col items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-semibold text-[#d4845a] uppercase">{dateMonth}</span>
                <span className="text-xl font-black leading-none">{dateDay}</span>
              </div>
              <div>
                <p className="font-semibold">{formatEventDate(event.date)}</p>
                {event.duration && <p className="text-sm text-[#d4845a]/70">{event.duration}</p>}
              </div>
            </div>

            {/* Location row */}
            {event.location && (
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">📍</span>
                </div>
                <div className="pt-1">
                  <p className="font-semibold">{event.location}</p>
                </div>
              </div>
            )}

            {/* Status + Code */}
            <div className="flex items-center gap-3 mb-6">
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${isLive ? "bg-green-500/15 text-green-400" : "bg-white/5 text-white/30"}`}>
                {isLive && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
                {isLive ? "LIVE" : "ENDED"}
              </span>
              <span className="text-sm text-white/30">Event Code: <span className="font-mono font-bold text-[#d4845a]">{event.code}</span></span>
              <span className="text-sm text-white/25">· {count} participants</span>
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
                  className="w-full py-3.5 px-6 rounded-2xl text-base font-semibold bg-[#d4845a]/10 border border-[#d4845a]/25 text-[#d4845a] hover:bg-[#d4845a]/20 transition-all">
                  View My Results
                </button>
              ) : (
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
                  <p className="text-sm text-white/40 mb-3">Enter the email you registered with</p>
                  <input type="email" placeholder="your@email.com" value={lookupEmail}
                    onChange={(e) => { setLookupEmail(e.target.value); setLookupError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleLookupResult()}
                    className="w-full py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-[#d4845a]/60 transition-all mb-3" />
                  {lookupError && <p className="text-red-400 text-sm mb-3">{lookupError}</p>}
                  <div className="flex gap-2">
                    <button onClick={handleLookupResult} disabled={!lookupEmail.trim() || lookingUp}
                      className="flex-1 py-3 px-4 bg-[#d4845a] hover:bg-[#c27548] disabled:bg-white/5 disabled:text-white/20 text-white font-semibold rounded-xl transition-all">
                      {lookingUp ? "Searching..." : "Find Results"}
                    </button>
                    <button onClick={() => { setShowResultLookup(false); setLookupEmail(""); setLookupError(""); }}
                      className="py-3 px-4 text-white/30 hover:text-white/60 transition-colors">Cancel</button>
                  </div>
                </div>
              )}

              <button onClick={() => router.push(`/event/${event.id}/leaderboard`)}
                className="w-full py-3.5 px-6 rounded-2xl text-base font-medium bg-white/[0.04] border border-white/[0.06] text-white/60 hover:text-white/80 hover:bg-white/[0.06] transition-all">
                View Leaderboard
              </button>
            </div>

            {/* ═══ ABOUT EVENT ═══ */}
            {event.description && (
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-3">About Event</h3>
                <div className="text-white/60 leading-relaxed whitespace-pre-wrap">{event.description}</div>
              </div>
            )}

            {/* Organizer link */}
            <div className="pt-4 border-t border-white/5">
              <button onClick={() => router.push(`/event/${event.id}/admin`)} className="text-sm text-white/20 hover:text-white/40 transition-colors">
                Organizer Access →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
