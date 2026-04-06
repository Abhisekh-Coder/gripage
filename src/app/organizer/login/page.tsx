"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { validateOrganizerCode } from "../actions";

export default function OrganizerLoginPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!code.trim()) return;
    setError("");
    setLoading(true);
    try {
      const valid = await validateOrganizerCode(code.trim());
      if (valid) {
        sessionStorage.setItem("gripage_organizer", "true");
        router.push("/organizer/dashboard");
      } else {
        setError("Invalid organizer code.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="page-enter w-full max-w-sm text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
            <path d="M8 28c4-2 8-3 12-3s8 1 12 3" stroke="#d4845a" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M10 22c3-1.5 7-2.5 10-2.5s7 1 10 2.5" stroke="#d4845a" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M12 16c2.5-1 5.5-1.5 8-1.5s5.5.5 8 1.5" stroke="#d4845a" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M14 10c2-.5 4-1 6-1s4 .5 6 1" stroke="#d4845a" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          <span className="text-xl font-black tracking-tight">
            Grip<span className="text-[#d4845a]">Age</span>
          </span>
        </div>

        <h1 className="text-2xl font-bold mb-2">Organizer Login</h1>
        <p className="text-white/40 mb-8">Enter your organizer code to continue</p>

        <input
          type="password"
          placeholder="Organizer code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          className="w-full py-4 px-5 bg-white/5 border border-white/10 rounded-2xl text-white text-center text-lg tracking-widest placeholder:tracking-normal placeholder:text-white/25 focus:outline-none focus:border-[#d4845a]/60 transition-all mb-4"
        />

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <button
          onClick={handleLogin}
          disabled={!code.trim() || loading}
          className="w-full py-4 px-6 bg-[#d4845a] hover:bg-[#c27548] disabled:bg-white/5 disabled:text-white/20 text-white font-semibold rounded-2xl transition-all text-lg"
        >
          {loading ? "Verifying..." : "Login"}
        </button>

        <button
          onClick={() => router.push("/")}
          className="mt-6 text-white/30 hover:text-white/60 transition-colors text-sm"
        >
          ← Back to home
        </button>
      </div>
    </div>
  );
}
