"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getEvent, getParticipantCount, getParticipantByEmail } from "@/lib/store";
import type { GripEvent } from "@/lib/types";
import { QRCodeSVG } from "qrcode.react";

export default function EventLandingPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;
  const [event, setEvent] = useState<GripEvent | null>(null);
  const [count, setCount] = useState(0);
  const [showQR, setShowQR] = useState(false);
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
      if (e) {
        const c = await getParticipantCount(e.id);
        setCount(c);
      }
      setLoading(false);
    })();
  }, [eventId]);

  async function handleLookupResult() {
    if (!lookupEmail.trim() || lookingUp) return;
    setLookupError("");
    setLookingUp(true);
    try {
      const p = await getParticipantByEmail(eventId, lookupEmail.trim());
      if (p) {
        router.push(`/event/${eventId}/results?pid=${p.id}`);
      } else {
        setLookupError("No results found for this email.");
      }
    } finally {
      setLookingUp(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen relative">
        <div className="ambient-bg" />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <p className="text-white/40">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen relative">
        <div className="ambient-bg" />
        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
          <div className="text-center">
            <p className="text-2xl mb-4 text-white/60">Event not found</p>
            <button onClick={() => router.push("/")} className="text-[#d4845a] hover:underline">Go Home</button>
          </div>
        </div>
      </div>
    );
  }

  const eventUrl = typeof window !== "undefined" ? `${window.location.origin}/event/${event.id}` : "";
  const isLive = event.status === "live";

  return (
    <div className="min-h-screen relative">
      <div className="ambient-bg" />
      <div className="relative z-10 desktop-center p-4 min-h-screen flex items-center justify-center">
        <div className="page-enter w-full max-w-md md:desktop-card text-center">

          {/* Back to home */}
          <div className="flex justify-start mb-6">
            <button onClick={() => router.push("/")} className="glass-card px-4 py-2 rounded-full text-sm text-white/50 hover:text-white transition-colors">
              ← Home
            </button>
          </div>

          <div className="logo-glow inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#d4845a]/20 to-[#b86d42]/20 border border-[#d4845a]/20 mb-5">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path d="M8 28c4-2 8-3 12-3s8 1 12 3" stroke="#d4845a" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M10 22c3-1.5 7-2.5 10-2.5s7 1 10 2.5" stroke="#d4845a" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M12 16c2.5-1 5.5-1.5 8-1.5s5.5.5 8 1.5" stroke="#d4845a" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M14 10c2-.5 4-1 6-1s4 .5 6 1" stroke="#d4845a" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-3xl font-black">{event.name}</h1>
          <div className="flex items-center justify-center gap-3 mt-3 flex-wrap">
            <span className="glass-card px-3 py-1 rounded-full text-sm text-white/50">{event.date}</span>
            <span className="glass-card px-3 py-1 rounded-full text-sm text-[#d4845a]/80">{count} participants</span>
            <span className={`glass-card px-3 py-1 rounded-full text-sm font-mono ${isLive ? "text-[#d4845a]" : "text-white/30"}`}>
              {isLive ? "LIVE" : "ENDED"}
            </span>
          </div>

          {/* Event code */}
          <div className="glass-card-strong rounded-xl px-4 py-2 mt-4 inline-block">
            <p className="text-xs text-white/40">Event Code</p>
            <p className="text-2xl font-mono font-black text-[#d4845a] tracking-wider">{event.code}</p>
          </div>

          <div className="space-y-3 mt-8 mb-6">
            {isLive && (
              <button onClick={() => router.push(`/event/${event.id}/register`)} className="btn-primary w-full py-5 px-6 rounded-2xl text-lg">
                Take the Grip Test
              </button>
            )}

            {/* View Results Section */}
            {!showResultLookup ? (
              <button
                onClick={() => setShowResultLookup(true)}
                className="w-full py-4 px-6 rounded-2xl text-lg font-semibold bg-[#d4845a]/10 border border-[#d4845a]/30 text-[#d4845a] hover:bg-[#d4845a]/20 transition-all"
              >
                View My Results
              </button>
            ) : (
              <div className="glass-card rounded-2xl p-5 text-left">
                <p className="text-sm text-white/50 mb-3">Enter the email you registered with</p>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={lookupEmail}
                  onChange={(e) => { setLookupEmail(e.target.value); setLookupError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleLookupResult()}
                  className="w-full py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/25 focus:outline-none focus:border-[#d4845a]/60 transition-all mb-3"
                />
                {lookupError && <p className="text-red-400 text-sm mb-3">{lookupError}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={handleLookupResult}
                    disabled={!lookupEmail.trim() || lookingUp}
                    className="flex-1 py-3 px-4 bg-[#d4845a] hover:bg-[#c27548] disabled:bg-white/5 disabled:text-white/20 text-white font-semibold rounded-xl transition-all"
                  >
                    {lookingUp ? "Searching..." : "Find Results"}
                  </button>
                  <button
                    onClick={() => { setShowResultLookup(false); setLookupEmail(""); setLookupError(""); }}
                    className="py-3 px-4 text-white/40 hover:text-white/60 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <button onClick={() => router.push(`/event/${event.id}/leaderboard`)} className="btn-secondary w-full py-4 px-6 rounded-2xl text-lg">
              View Leaderboard
            </button>
          </div>

          {/* QR */}
          <div className="glass-card rounded-2xl p-4">
            <button onClick={() => setShowQR(!showQR)} className="w-full flex items-center justify-center gap-2 text-white/40 hover:text-white/70 transition-colors py-1">
              <span className="text-sm">{showQR ? "Hide QR Code" : "Share via QR Code"}</span>
            </button>
            {showQR && eventUrl && (
              <>
                <div className="mt-4 flex justify-center"><div className="p-4 bg-white rounded-2xl"><QRCodeSVG value={eventUrl} size={180} /></div></div>
                <p className="mt-3 text-xs text-white/30 font-mono break-all">{eventUrl}</p>
              </>
            )}
          </div>

          <div className="mt-6">
            <button onClick={() => router.push(`/event/${event.id}/admin`)} className="text-sm text-white/20 hover:text-white/50 transition-colors">
              Organizer Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
