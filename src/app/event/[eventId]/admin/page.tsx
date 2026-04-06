"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getEvent, getParticipants, exportParticipantsCSV, endEvent, reopenEvent, deleteParticipant } from "@/lib/store";
import { STAGE_MAP } from "@/lib/formula";
import type { GripEvent, Participant } from "@/lib/types";

export default function AdminPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<GripEvent | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (sessionStorage.getItem("gripage_organizer") === "true") {
        setAuthenticated(true);
      } else {
        router.replace("/organizer/login");
      }
    }
  }, [router]);

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

  async function handleToggleStatus() {
    if (!event) return;
    if (event.status === "live") {
      await endEvent(eventId);
    } else {
      await reopenEvent(eventId);
    }
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

  async function handleDeleteParticipant(participantId: string) {
    if (!confirm("Delete this participant entry?")) return;
    await deleteParticipant(participantId);
    loadData();
  }

  if (!authenticated || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white/30">Loading...</p>
      </div>
    );
  }

  // Stats
  const totalCount = participants.length;
  const maleCount = participants.filter((p) => p.gender === "male").length;
  const femaleCount = participants.filter((p) => p.gender === "female").length;
  const avgBioAge = totalCount > 0 ? Math.round(participants.reduce((s, p) => s + p.biologicalAge, 0) / totalCount) : 0;
  const avgGrip = totalCount > 0 ? Math.round((participants.reduce((s, p) => s + p.gripAvgKg, 0) / totalCount) * 10) / 10 : 0;

  const stageCounts: Record<string, number> = {};
  participants.forEach((p) => {
    stageCounts[p.bioStage] = (stageCounts[p.bioStage] || 0) + 1;
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-4 max-w-lg mx-auto">
      <div className="page-enter">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push("/organizer/dashboard")}
            className="text-white/30 hover:text-white transition-colors text-sm"
          >
            ← Dashboard
          </button>
          <h1 className="text-xl font-bold">Event Admin</h1>
          <div className="w-20" />
        </div>

        <div className="flex items-center gap-3 mb-6">
          <p className="text-white/40">{event.name} · {event.date}</p>
          <span className={`text-xs px-2 py-0.5 rounded-full ${event.status === "live" ? "bg-green-500/15 text-green-400" : "bg-white/5 text-white/30"}`}>
            {event.status}
          </span>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard label="Total Participants" value={`${totalCount}`} />
          <StatCard label="Avg Bio Age" value={`${avgBioAge}`} />
          <StatCard label="Avg Grip Strength" value={`${avgGrip} kg`} />
          <StatCard label="Male / Female" value={`${maleCount} / ${femaleCount}`} />
        </div>

        {/* Stage distribution */}
        <div className="bg-[#141414] rounded-xl border border-white/5 p-4 mb-6">
          <h2 className="font-semibold mb-3 text-sm">Stage Distribution</h2>
          {Object.entries(STAGE_MAP).map(([label, info]) => {
            const count = stageCounts[label] || 0;
            const pct = totalCount > 0 ? (count / totalCount) * 100 : 0;
            return (
              <div key={label} className="flex items-center gap-3 mb-2">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: info.color }} />
                <span className="text-sm flex-1 text-white/60">{label}</span>
                <span className="text-sm text-white/30">{count}</span>
                <div className="w-20 h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: info.color }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Participant list */}
        <div className="bg-[#141414] rounded-xl border border-white/5 p-4 mb-6">
          <h2 className="font-semibold mb-3 text-sm">Participants ({totalCount})</h2>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {participants.slice().reverse().map((p) => {
              const stage = STAGE_MAP[p.bioStage];
              const delta = p.age - p.biologicalAge;
              return (
                <div key={p.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0 group">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{p.name}</p>
                    <p className="text-xs text-white/30 truncate">{p.email} · {p.phone}</p>
                    <p className="text-xs text-white/30">{p.gender} · {p.age}y · {p.gripAvgKg}kg</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm" style={{ color: stage.color }}>Bio: {p.biologicalAge}</p>
                    <p className="text-xs text-white/40">
                      {delta > 0 ? `${delta}y younger` : delta < 0 ? `${Math.abs(delta)}y older` : "On track"}
                    </p>
                    <p className="text-xs" style={{ color: stage.color, opacity: 0.6 }}>{p.bioStage}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteParticipant(p.id)}
                    className="opacity-0 group-hover:opacity-100 text-red-400/60 hover:text-red-400 text-sm transition-all px-2"
                    title="Delete entry"
                  >
                    ✕
                  </button>
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
            className="w-full py-4 px-6 bg-[#141414] hover:bg-[#1e1e1e] border border-white/5 disabled:opacity-50 rounded-xl transition-colors text-lg"
          >
            Export CSV
          </button>
          <button
            onClick={handleToggleStatus}
            className={`w-full py-4 px-6 rounded-xl transition-colors text-lg ${
              event.status === "live"
                ? "bg-red-900/20 hover:bg-red-900/40 border border-red-800/30 text-red-400"
                : "bg-green-900/20 hover:bg-green-900/40 border border-green-800/30 text-green-400"
            }`}
          >
            {event.status === "live" ? "Close Registration" : "Reopen Registration"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 bg-[#141414] rounded-xl border border-white/5">
      <p className="text-white/30 text-xs mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
