"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function EnterpriseLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/organizer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      });
      const { valid, error: err } = await res.json();
      if (valid) {
        sessionStorage.setItem("gripage_organizer", "true");
        sessionStorage.setItem("gripage_organizer_email", email.trim().toLowerCase());
        router.push("/organizer/dashboard");
      } else {
        setError(err || "Invalid credentials.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0B0F] flex relative overflow-hidden">

      {/* Left: Background image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <Image src="/hero-gym.jpg" alt="" fill className="object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0B0B0F]" />
        <div className="absolute inset-0 bg-[#0B0B0F]/40" />

        {/* Overlay text */}
        <div className="absolute bottom-12 left-12 right-12 z-10">
          <div className="flex items-center gap-2 mb-4">
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
              <path d="M7 22c3-1.5 6-2 9-2s6 .5 9 2" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round"/>
              <path d="M9 17.5c2.5-1 5-1.5 7-1.5s4.5.5 7 1.5" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round"/>
              <path d="M11 13c2-.5 3.5-1 5-1s3 .5 5 1" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span className="text-lg font-black">Grip<span className="text-[#4ADE80]">Age</span></span>
          </div>
          <p className="text-white/30 text-sm leading-relaxed max-w-sm">
            Enterprise dashboard for managing grip strength events, participants, and analytics.
          </p>
        </div>
      </div>

      {/* Right: Login form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
        <div className="page-enter w-full max-w-sm">

          {/* Logo — mobile only */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#4ADE80" fillOpacity="0.1"/>
              <path d="M7 22c3-1.5 6-2 9-2s6 .5 9 2" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round"/>
              <path d="M9 17.5c2.5-1 5-1.5 7-1.5s4.5.5 7 1.5" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round"/>
              <path d="M11 13c2-.5 3.5-1 5-1s3 .5 5 1" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span className="text-lg font-black">Grip<span className="text-[#4ADE80]">Age</span></span>
          </div>

          <h1 className="text-2xl font-black mb-1">Enterprise Login</h1>
          <p className="text-white/30 text-sm mb-8">Sign in with your registered email</p>

          <div className="space-y-3">
            <div>
              <label className="block text-[10px] text-white/30 uppercase tracking-wider mb-1.5 font-medium">Email</label>
              <input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                className="glass-input w-full py-3.5 px-4 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] text-white/30 uppercase tracking-wider mb-1.5 font-medium">Password</label>
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="glass-input w-full py-3.5 px-4 rounded-xl text-sm"
              />
            </div>
          </div>

          {error && <p className="text-red-400 text-sm mt-3 bg-red-500/5 border border-red-500/10 rounded-xl px-4 py-2">{error}</p>}

          <button onClick={handleLogin} disabled={!email.trim() || !password.trim() || loading} className="btn-primary w-full py-3.5 px-6 rounded-xl text-sm font-bold mt-5">
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <button onClick={() => router.push("/")} className="mt-6 text-white/20 hover:text-white/40 transition-colors text-xs block mx-auto">
            ← Back to home
          </button>
        </div>
      </div>
    </div>
  );
}
