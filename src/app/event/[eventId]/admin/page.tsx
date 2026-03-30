"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getEvent, getParticipants, exportParticipantsCSV, endEvent } from "@/lib/store";
import { STAGE_MAP } from "@/lib/formula";
import type { GripEvent, Participant } from "@/lib/types";

export default function AdminPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<GripEvent | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);

  useEffect(() => {
    getEvent(eventId).then((e) => setEvent(e));
  }, [eventId]);

  useEffect(() => {
    if (!authenticated) return;
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [authenticated, eventId]);

  function loadData() {
    getParticipants(eventId).then(setParticipants);
  }

  function handleLogin() {
    if (event && pin === event.adminPin) {
      setAuthenticated(true);
    }
  }

  async function handleEndEvent() {
    await endEvent(eventId);
    const e = await getEvent(eventId);
    setEvent(e);
  }

  async function handleExport() {
    const csv = await exportParticipantsCSV(eventId);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gripage_${event?.name || eventId}_results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Event not found</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="page-enter w-full max-w-sm text-center">
          <h1 className="text-2xl font-bold mb-2">Organizer Login</h1>
          <p className="text-gray-400 mb-6">{event.name}</p>
          <input
            type="password"
            placeholder="4-digit PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            maxLength={4}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="w-full py-3 px-4 bg-[#2a2a2a] rounded-xl border border-gray-700 focus:border-green-500 focus:outline-none text-2xl text-center tracking-[0.5em]"
          />
          <button
            onClick={handleLogin}
            disabled={pin.length !== 4}
            className="w-full py-4 px-6 bg-green-500 hover:bg-green-400 disabled:bg-gray-700 disabled:text-gray-500 text-black font-semibold rounded-xl transition-colors text-lg mt-4"
          >
            Login
          </button>
          <button
            onClick={() => router.push(`/event/${eventId}`)}
            className="mt-4 text-gray-500 hover:text-white transition-colors text-sm"
          >
            ← Back to Event
          </button>
        </div>
      </div>
    );
  }

  // Stats
  const totalCount = participants.length;
  const maleCount = participants.filter((p) => p.gender === "male").length;
  const femaleCount = participants.filter((p) => p.gender === "female").length;
  const avgBioAge =
    totalCount > 0
      ? Math.round(participants.reduce((s, p) => s + p.biologicalAge, 0) / totalCount)
      : 0;
  const avgGrip =
    totalCount > 0
      ? Math.round(
          (participants.reduce((s, p) => s + p.gripAvgKg, 0) / totalCount) * 10
        ) / 10
      : 0;

  const stageCounts: Record<string, number> = {};
  participants.forEach((p) => {
    stageCounts[p.bioStage] = (stageCounts[p.bioStage] || 0) + 1;
  });

  return (
    <div className="min-h-screen p-4 max-w-lg mx-auto">
      <div className="page-enter">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push(`/event/${eventId}`)}
            className="text-gray-500 hover:text-white transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold">Dashboard</h1>
          <div className="w-12" />
        </div>

        <p className="text-gray-400 mb-6">{event.name} · {event.date}</p>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard label="Total Participants" value={`${totalCount}`} />
          <StatCard label="Avg Bio Age" value={`${avgBioAge}`} />
          <StatCard label="Avg Grip Strength" value={`${avgGrip} kg`} />
          <StatCard label="Male / Female" value={`${maleCount} / ${femaleCount}`} />
        </div>

        {/* Stage distribution */}
        <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-4 mb-6">
          <h2 className="font-semibold mb-3">Stage Distribution</h2>
          {Object.entries(STAGE_MAP).map(([label, info]) => {
            const count = stageCounts[label] || 0;
            const pct = totalCount > 0 ? (count / totalCount) * 100 : 0;
            return (
              <div key={label} className="flex items-center gap-3 mb-2">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: info.color }}
                />
                <span className="text-sm flex-1">{label}</span>
                <span className="text-sm text-gray-400">{count}</span>
                <div className="w-20 h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: info.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Participant list */}
        <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-4 mb-6">
          <h2 className="font-semibold mb-3">Participants ({totalCount})</h2>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {participants
              .slice()
              .reverse()
              .map((p) => {
                const stage = STAGE_MAP[p.bioStage];
                return (
                  <div key={p.id} className="flex items-center gap-3 py-2 border-b border-gray-800 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{p.name}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {p.email} · {p.phone}
                      </p>
                      <p className="text-xs text-gray-500">
                        {p.gender} · {p.age}y · {p.gripAvgKg}kg
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm" style={{ color: stage.color }}>
                        Bio: {p.biologicalAge}
                      </p>
                      <p className="text-xs" style={{ color: stage.color, opacity: 0.7 }}>
                        {p.bioStage}
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleExport}
            disabled={totalCount === 0}
            className="w-full py-4 px-6 bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-gray-700 disabled:opacity-50 rounded-xl transition-colors text-lg"
          >
            Export CSV
          </button>
          {event?.status === "live" && (
            <button
              onClick={handleEndEvent}
              className="w-full py-4 px-6 bg-red-900/30 hover:bg-red-900/50 border border-red-800/50 rounded-xl transition-colors text-lg text-red-400"
            >
              End Event
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 bg-[#1a1a1a] rounded-xl border border-gray-800">
      <p className="text-gray-500 text-xs mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
