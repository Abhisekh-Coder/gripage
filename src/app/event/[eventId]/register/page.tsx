"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Gender, FitnessAnswers } from "@/lib/types";
import { saveRegistration } from "@/lib/session";
import { getEvent, getParticipantByEmail } from "@/lib/store";

function isValidEmail(e: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
function isValidPhone(p: string) { return p.replace(/\D/g, "").length >= 10; }

const EXERCISE_TYPES = [
  { id: "weight_training", label: "Weight Training", icon: "🏋️" },
  { id: "cardio", label: "Cardio", icon: "🏃" },
  { id: "yoga", label: "Yoga", icon: "🧘" },
  { id: "sports", label: "Sports", icon: "⚽" },
  { id: "swimming", label: "Swimming", icon: "🏊" },
  { id: "cycling", label: "Cycling", icon: "🚴" },
  { id: "martial_arts", label: "Martial Arts", icon: "🥋" },
  { id: "none", label: "None", icon: "🚶" },
];

const ACTIVITY_LEVELS: { id: FitnessAnswers["activityLevel"]; label: string }[] = [
  { id: "sedentary", label: "Sedentary" },
  { id: "light", label: "Light" },
  { id: "moderate", label: "Moderate" },
  { id: "active", label: "Active" },
  { id: "very_active", label: "Very Active" },
];

export default function RegisterPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;
  const [eventName, setEventName] = useState("");

  useEffect(() => {
    getEvent(eventId).then((e) => e && setEventName(e.name));
  }, [eventId]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<Gender>("male");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [age, setAge] = useState("");
  const [doesGym, setDoesGym] = useState<FitnessAnswers["doesGym"]>("sometimes");
  const [gymFrequency, setGymFrequency] = useState("3-4 times/week");
  const [exerciseType, setExerciseType] = useState<string[]>([]);
  const [fitnessGoal, setFitnessGoal] = useState("Stay Healthy");
  const [activityLevel, setActivityLevel] = useState<FitnessAnswers["activityLevel"]>("moderate");

  function toggleExercise(id: string) {
    setExerciseType((prev) => prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]);
  }

  const isValid =
    name.trim().length >= 2 && isValidEmail(email) && isValidPhone(phone) &&
    Number(height) >= 100 && Number(height) <= 220 &&
    Number(weight) >= 30 && Number(weight) <= 200 &&
    Number(age) >= 17 && Number(age) <= 90;

  const [emailError, setEmailError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleNext() {
    if (!isValid || submitting) return;
    setEmailError("");
    setSubmitting(true);

    try {
      // Check for duplicate email
      const existing = await getParticipantByEmail(eventId, email.trim());
      if (existing) {
        setEmailError("This email has already been used for this event. Use a different email or view your results from the event page.");
        setSubmitting(false);
        return;
      }

      saveRegistration({
        name: name.trim(), email: email.trim().toLowerCase(), phone: phone.trim(), gender,
        heightCm: Number(height), weightKg: Number(weight), age: Number(age),
        fitnessAnswers: { doesGym, gymFrequency, exerciseType, fitnessGoal, activityLevel },
      });
      router.push(`/event/${eventId}/measure`);
    } catch {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen relative" style={{ background: "#080e1a" }}>
      <div className="absolute top-0 right-0 w-[600px] h-[600px] pointer-events-none" style={{ background: "radial-gradient(ellipse at 80% 10%, rgba(56,189,248,0.08) 0%, transparent 70%)" }} />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] pointer-events-none" style={{ background: "radial-gradient(ellipse at 20% 90%, rgba(212,132,90,0.05) 0%, transparent 60%)" }} />
      <div className="relative z-10 p-4 py-8">
        <div className="page-enter max-w-4xl mx-auto">

          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <button onClick={() => router.push(`/event/${eventId}`)} className="glass-card w-10 h-10 rounded-xl flex items-center justify-center text-white/50 hover:text-white transition-colors flex-shrink-0">←</button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Register</h1>
              <p className="text-white/30 text-sm">{eventName} · Step 1 of 2</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-8">
            <div className="step-dot step-dot-active" /><div className="step-dot" />
          </div>

          {/* Two-column grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Col 1: Personal */}
            <div className="space-y-4">
              <div className="glass-card rounded-2xl p-5 space-y-4">
                <p className="text-xs text-white/30 uppercase tracking-wider font-medium">Personal Info</p>

                <div>
                  <label className="block text-xs text-white/40 mb-1.5">Full Name *</label>
                  <input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className="glass-input w-full py-3 px-4 rounded-xl text-lg" />
                </div>

                <div>
                  <label className="block text-xs text-white/40 mb-1.5">Email *</label>
                  <input type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="glass-input w-full py-3 px-4 rounded-xl" />
                  {email && !isValidEmail(email) && <p className="text-red-400/80 text-xs mt-1">Invalid email</p>}
                </div>

                <div>
                  <label className="block text-xs text-white/40 mb-1.5">Phone *</label>
                  <input type="tel" placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} className="glass-input w-full py-3 px-4 rounded-xl" />
                  {phone && !isValidPhone(phone) && <p className="text-red-400/80 text-xs mt-1">Invalid phone</p>}
                </div>

                <div>
                  <label className="block text-xs text-white/40 mb-1.5">Gender *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["male", "female"] as Gender[]).map((g) => (
                      <button key={g} onClick={() => setGender(g)} className={`py-3 rounded-xl font-medium transition-all capitalize ${gender === g ? "glass-toggle-active" : "glass-toggle"}`}>
                        {g === "male" ? "🙋‍♂️ Male" : "🙋‍♀️ Female"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Body metrics inline */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs text-white/40 mb-1.5">Height cm</label>
                    <input type="number" placeholder="170" value={height} onChange={(e) => setHeight(e.target.value)} className="glass-input w-full py-3 px-3 rounded-xl text-center font-semibold" />
                  </div>
                  <div>
                    <label className="block text-xs text-white/40 mb-1.5">Weight kg</label>
                    <input type="number" placeholder="70" value={weight} onChange={(e) => setWeight(e.target.value)} className="glass-input w-full py-3 px-3 rounded-xl text-center font-semibold" />
                  </div>
                  <div>
                    <label className="block text-xs text-white/40 mb-1.5">Age</label>
                    <input type="number" placeholder="30" value={age} onChange={(e) => setAge(e.target.value)} className="glass-input w-full py-3 px-3 rounded-xl text-center font-semibold" />
                  </div>
                </div>
              </div>
            </div>

            {/* Col 2: Fitness */}
            <div className="space-y-4">
              <div className="glass-card rounded-2xl p-5 space-y-4">
                <p className="text-xs text-white/30 uppercase tracking-wider font-medium">🏋️ Fitness Profile</p>

                <div>
                  <label className="block text-xs text-white/40 mb-2">Do you workout?</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["yes", "sometimes", "no"] as const).map((o) => (
                      <button key={o} onClick={() => setDoesGym(o)} className={`py-2.5 rounded-xl text-sm font-medium transition-all capitalize ${doesGym === o ? "glass-toggle-active" : "glass-toggle"}`}>{o}</button>
                    ))}
                  </div>
                </div>

                {doesGym !== "no" && (
                  <div>
                    <label className="block text-xs text-white/40 mb-2">How often?</label>
                    <div className="flex flex-wrap gap-2">
                      {["Never", "1-2/wk", "3-4/wk", "5-6/wk", "Daily"].map((f) => (
                        <button key={f} onClick={() => setGymFrequency(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${gymFrequency === f ? "glass-toggle-active" : "glass-toggle"}`}>{f}</button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs text-white/40 mb-2">Activity Level</label>
                  <div className="flex flex-wrap gap-2">
                    {ACTIVITY_LEVELS.map((l) => (
                      <button key={l.id} onClick={() => setActivityLevel(l.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activityLevel === l.id ? "glass-toggle-active" : "glass-toggle"}`}>{l.label}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-2xl p-5 space-y-4">
                <p className="text-xs text-white/30 uppercase tracking-wider font-medium">Exercise Types</p>
                <div className="grid grid-cols-2 gap-2">
                  {EXERCISE_TYPES.map((e) => (
                    <button key={e.id} onClick={() => toggleExercise(e.id)} className={`px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 ${exerciseType.includes(e.id) ? "glass-toggle-active" : "glass-toggle"}`}>
                      <span>{e.icon}</span>{e.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="glass-card rounded-2xl p-5 space-y-3">
                <p className="text-xs text-white/30 uppercase tracking-wider font-medium">Fitness Goal</p>
                <div className="flex flex-wrap gap-2">
                  {["Build Strength", "Lose Weight", "Stay Healthy", "Build Muscle", "Improve Endurance", "Flexibility"].map((g) => (
                    <button key={g} onClick={() => setFitnessGoal(g)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${fitnessGoal === g ? "glass-toggle-active" : "glass-toggle"}`}>{g}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {emailError && (
            <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {emailError}
            </div>
          )}
          <button onClick={handleNext} disabled={!isValid || submitting} className="btn-primary w-full py-4 px-6 rounded-2xl text-lg mt-6">
            {submitting ? "Checking..." : "Next: Grip Test →"}
          </button>
        </div>
      </div>
    </div>
  );
}
