// src/components/AuthBar.jsx
import React, { useState, useEffect } from "react";
import { register, login, logout, me } from "../utils/sync.js";

export default function AuthBar() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [who, setWho] = useState(null);   // { email } or null
  const [msg, setMsg] = useState(null);   // toast text
  const [kind, setKind] = useState("ok"); // "ok" | "err"

  const notify = (text, k = "ok") => {
    setMsg(text);
    setKind(k);
    // auto-hide after 3s
    setTimeout(() => setMsg(null), 3000);
  };

  async function refreshWho() {
    try {
      const data = await me(); // { ok:true, email?:string }
      setWho(data?.email ? { email: data.email } : null);
    } catch {
      setWho(null);
    }
  }

  useEffect(() => {
    refreshWho(); // on mount
  }, []);

  const onRegister = async () => {
    try {
      if (!email || !pw) return notify("Email & password required", "err");
      const r = await register(email, pw);
      notify(r.message || "Registered successfully", "ok");
      refreshWho();
    } catch (e) {
      notify(e.message || "Register failed", "err");
    }
  };

  const onLogin = async () => {
    try {
      if (!email || !pw) return notify("Email & password required", "err");
      const r = await login(email, pw);
      notify(r.message || "Logged in", "ok");
      refreshWho();
    } catch (e) {
      notify(e.message || "Login failed", "err");
    }
  };

  const onLogout = async () => {
    try {
      const r = await logout();
      notify(r.message || "Logged out", "ok");
      setWho(null);
    } catch (e) {
      notify(e.message || "Logout failed", "err");
    }
  };

  return (
    <div className="mb-4 p-3 rounded-xl border flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between bg-white/70">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex flex-col">
          <label className="text-sm text-gray-600">Email</label>
          <input
            className="border rounded-lg px-3 py-2 w-72"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="username"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-gray-600">Password</label>
          <input
            className="border rounded-lg px-3 py-2 w-72"
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </div>

        <div className="flex gap-2">
          <button className="px-3 py-2 rounded-lg border" onClick={onRegister}>
            Register
          </button>
          <button className="px-3 py-2 rounded-lg border" onClick={onLogin}>
            Login
          </button>
          <button className="px-3 py-2 rounded-lg border" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {who ? (
          <div className="text-sm text-green-700">
            Logged in as <b>{who.email}</b>
          </div>
        ) : (
          <div className="text-sm text-gray-500">Not logged in</div>
        )}
      </div>

      {msg && (
        <div
          className={`fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg ${
            kind === "ok" ? "bg-green-600 text-white" : "bg-red-600 text-white"
          }`}
          role="status"
          aria-live="polite"
        >
          {msg}
        </div>
      )}
    </div>
  );
}
