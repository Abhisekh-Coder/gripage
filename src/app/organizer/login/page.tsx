"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OrganizerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim()) return;
    if (!email.includes("@foxo.club")) {
      setError("Only @foxo.club emails can access the organizer dashboard.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/organizer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const { valid } = await res.json();
      if (valid) {
        sessionStorage.setItem("gripage_organizer", "true");
        sessionStorage.setItem("gripage_organizer_email", email.trim().toLowerCase());
        router.push("/organizer/dashboard");
      } else {
        setError("This email is not authorized. Contact admin.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0B0F] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] pointer-events-none" style={{ background: "radial-gradient(ellipse at 80% 10%, rgba(16,185,129,0.06) 0%, transparent 70%)" }} />
      <div className="relative z-10 page-enter w-full max-w-sm text-center">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-[#10b981]/10 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round"><path d="M6 18c3-1.5 6-2.5 9-2.5s6 1 9 2.5"/><path d="M8 13c2.5-1 5-1.5 7-1.5s4.5.5 7 1.5"/></svg>
          </div>
          <span className="text-xl font-black tracking-tight">Grip<span className="text-[#10b981]">Age</span></span>
        </div>

        <h1 className="text-2xl font-black mb-2">Enterprise Login</h1>
        <p className="text-white/30 text-sm mb-8">Sign in with your @foxo.club email</p>

        <input
          type="email"
          placeholder="you@foxo.club"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          className="glass-input w-full py-4 px-5 rounded-2xl text-center text-base mb-4"
        />

        {error && <p className="text-red-400 text-sm mb-4 bg-red-500/5 border border-red-500/10 rounded-xl px-4 py-2">{error}</p>}

        <button onClick={handleLogin} disabled={!email.trim() || loading} className="btn-primary w-full py-4 px-6 rounded-2xl text-base font-bold">
          {loading ? "Verifying..." : "Login"}
        </button>

        <button onClick={() => router.push("/")} className="mt-6 text-white/25 hover:text-white/50 transition-colors text-sm">
          ← Back to home
        </button>
      </div>
    </div>
  );
}
