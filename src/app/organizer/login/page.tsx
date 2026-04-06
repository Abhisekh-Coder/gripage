"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
      const res = await fetch("/api/organizer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const { valid } = await res.json();
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
    <div className="min-h-screen relative">
      <div className="ambient-bg" />
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="page-enter w-full max-w-sm text-center">
          <div className="flex items-center justify-center gap-2 mb-8">
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
              <path d="M8 28c4-2 8-3 12-3s8 1 12 3" stroke="#6b5ce7" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M10 22c3-1.5 7-2.5 10-2.5s7 1 10 2.5" stroke="#6b5ce7" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M12 16c2.5-1 5.5-1.5 8-1.5s5.5.5 8 1.5" stroke="#6b5ce7" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M14 10c2-.5 4-1 6-1s4 .5 6 1" stroke="#6b5ce7" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            <span className="text-xl font-black tracking-tight text-[#1a1a3e]">
              Grip<span className="text-[#6b5ce7]">Age</span>
            </span>
          </div>

          <h1 className="text-2xl font-bold mb-2 text-[#1a1a3e]">Organizer Login</h1>
          <p className="text-[#6b6b8a] mb-8">Enter your organizer code to continue</p>

          <input
            type="password"
            placeholder="Organizer code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="glass-input w-full py-4 px-5 rounded-2xl text-center text-lg tracking-widest placeholder:tracking-normal mb-4"
          />

          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

          <button
            onClick={handleLogin}
            disabled={!code.trim() || loading}
            className="btn-primary w-full py-4 px-6 rounded-2xl text-lg font-semibold"
          >
            {loading ? "Verifying..." : "Login"}
          </button>

          <button
            onClick={() => router.push("/")}
            className="mt-6 text-[#6b6b8a] hover:text-[#1a1a3e] transition-colors text-sm"
          >
            ← Back to home
          </button>
        </div>
      </div>
    </div>
  );
}
