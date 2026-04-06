"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { addParticipant } from "@/lib/store";
import { calculateBiologicalAge, getBioStage } from "@/lib/formula";
import { getRegistration, clearRegistration } from "@/lib/session";
import type { RegistrationData } from "@/lib/session";

type HandMode = "both" | "left" | "right";

export default function MeasurePage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const [reg, setReg] = useState<RegistrationData | null>(null);
  const [handMode, setHandMode] = useState<HandMode>("both");
  const [gripLeft, setGripLeft] = useState("");
  const [gripRight, setGripRight] = useState("");

  useEffect(() => {
    const data = getRegistration();
    if (!data) {
      router.replace(`/event/${eventId}/register`);
      return;
    }
    setReg(data);
  }, [eventId, router]);

  function gripValid(v: string) {
    const n = Number(v);
    return v !== "" && n >= 5 && n <= 100;
  }

  const isValid =
    handMode === "both"
      ? gripValid(gripLeft) && gripValid(gripRight)
      : handMode === "left"
        ? gripValid(gripLeft)
        : gripValid(gripRight);

  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!isValid || !reg || submitting) return;
    setSubmitting(true);

    const left = handMode !== "right" ? Number(gripLeft) : null;
    const right = handMode !== "left" ? Number(gripRight) : null;

    let gripAvg: number;
    if (left !== null && right !== null) {
      gripAvg = (left + right) / 2;
    } else {
      gripAvg = (left ?? right)!;
    }

    const result = calculateBiologicalAge(reg.gender, reg.heightCm, reg.weightKg, reg.age, gripAvg);
    const stage = getBioStage(result.delta);

    try {
      const participant = await addParticipant({
        eventId,
        name: reg.name,
        email: reg.email,
        phone: reg.phone,
        gender: reg.gender,
        heightCm: reg.heightCm,
        weightKg: reg.weightKg,
        age: reg.age,
        fitnessAnswers: reg.fitnessAnswers,
        gripLeftKg: left,
        gripRightKg: right,
        gripAvgKg: Math.round(gripAvg * 10) / 10,
        expectedGrip: result.expectedGrip,
        biologicalAge: result.biologicalAge,
        bioStage: stage.label,
      });

      clearRegistration();
      router.push(`/event/${eventId}/results?pid=${participant.id}`);
    } catch (e) {
      console.error(e);
      setSubmitting(false);
    }
  }

  // Live preview of grip average
  const previewGrip = (() => {
    const left = handMode !== "right" && gripValid(gripLeft) ? Number(gripLeft) : null;
    const right = handMode !== "left" && gripValid(gripRight) ? Number(gripRight) : null;
    if (left !== null && right !== null) return Math.round(((left + right) / 2) * 10) / 10;
    if (left !== null) return left;
    if (right !== null) return right;
    return null;
  })();

  if (!reg) {
    return (
      <div className="min-h-screen relative">
        <div className="ambient-bg" />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <p className="text-white/40">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <div className="ambient-bg" />

      <div className="relative z-10 desktop-center p-4 min-h-screen flex items-center justify-center">
        <div className="page-enter w-full max-w-md md:desktop-card">

          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.back()}
              className="glass-card w-10 h-10 rounded-xl flex items-center justify-center text-white/50 hover:text-white transition-colors flex-shrink-0"
            >
              ←
            </button>
            <div>
              <h1 className="text-2xl font-bold">Grip Test</h1>
              <p className="text-white/30 text-sm">Step 2 of 2</p>
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            <div className="step-dot step-dot-done" />
            <div className="step-dot step-dot-active" />
          </div>

          {/* Participant summary */}
          <div className="glass-card rounded-2xl p-4 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#d4845a]/20 to-[#b86d42]/20 border border-[#d4845a]/20 flex items-center justify-center text-sm font-bold text-[#d4845a]">
              {reg.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{reg.name}</p>
              <p className="text-white/30 text-xs">{reg.gender} · {reg.age}y · {reg.heightCm}cm · {reg.weightKg}kg</p>
            </div>
          </div>

          {/* Instructions */}
          <div className="glass-card rounded-2xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🤜</span>
              <div>
                <p className="font-medium text-sm">Squeeze the dynamometer</p>
                <p className="text-white/30 text-xs mt-1">
                  Grip as hard as you can and enter the reading from the device.
                </p>
              </div>
            </div>
          </div>

          {/* Hand mode selector */}
          <div className="mb-5">
            <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">Which hand(s)?</label>
            <div className="grid grid-cols-3 gap-2">
              {(["both", "left", "right"] as HandMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setHandMode(m)}
                  className={`py-3 rounded-xl font-medium transition-all text-sm ${
                    handMode === m ? "glass-toggle-active" : "glass-toggle"
                  }`}
                >
                  {m === "both" ? "🤲 Both" : m === "left" ? "🤛 Left" : "🤜 Right"}
                </button>
              ))}
            </div>
          </div>

          {/* Grip inputs */}
          <div className={`${handMode === "both" ? "form-grid-2" : ""} mb-6`}>
            {handMode !== "right" && (
              <div className="glass-card rounded-2xl p-5 text-center mb-3 sm:mb-0">
                <label className="block text-xs text-white/40 uppercase tracking-wider mb-3">
                  🤛 Left Hand
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  value={gripLeft}
                  onChange={(e) => setGripLeft(e.target.value)}
                  min={5}
                  max={100}
                  className="glass-input grip-input w-full py-5 px-4 rounded-2xl text-4xl text-center font-black"
                />
                <p className="text-white/20 text-xs mt-2">kilograms</p>
              </div>
            )}

            {handMode !== "left" && (
              <div className="glass-card rounded-2xl p-5 text-center">
                <label className="block text-xs text-white/40 uppercase tracking-wider mb-3">
                  🤜 Right Hand
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  value={gripRight}
                  onChange={(e) => setGripRight(e.target.value)}
                  min={5}
                  max={100}
                  className="glass-input grip-input w-full py-5 px-4 rounded-2xl text-4xl text-center font-black"
                />
                <p className="text-white/20 text-xs mt-2">kilograms</p>
              </div>
            )}
          </div>

          {/* Live preview */}
          {previewGrip !== null && (
            <div className="glass-card-strong rounded-2xl p-4 mb-6 text-center">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Average Grip Strength</p>
              <p className="text-3xl font-black text-[#d4845a]">
                {previewGrip} <span className="text-lg text-white/30 font-normal">kg</span>
              </p>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!isValid || submitting}
            className="btn-primary w-full py-5 px-6 rounded-2xl text-lg font-bold"
          >
            {submitting ? "Calculating..." : "🧬 Calculate My Bio Age"}
          </button>
        </div>
      </div>
    </div>
  );
}
