// src/components/AuthBar.jsx
import React, { useState } from 'react';
import { register, login, logout } from '../utils/sync.js';

export default function AuthBar() {
  const [id, setId] = useState('');       // email or username
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState('');

  const handle = (fn) => async () => {
    setMsg('');
    try {
      const res = await fn(id.trim(), pw);
      setMsg(`✅ ${fn.name} ok: ${res.account || res.username || ''}`);
    } catch (e) {
      setMsg(`❌ ${fn.name} failed: ${e.message || e}`);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <input
        className="border rounded px-3 py-2"
        placeholder="email or username"
        value={id}
        onChange={(e) => setId(e.target.value)}
        name="email"  // helpful for autofill
        autoComplete="username"
      />
      <input
        className="border rounded px-3 py-2"
        placeholder="password"
        type="password"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        name="password"
        autoComplete="current-password"
      />

      <button className="px-3 py-2 rounded border" onClick={handle(register)}>Register</button>
      <button className="px-3 py-2 rounded border" onClick={handle(login)}>Login</button>
      <button className="px-3 py-2 rounded border" onClick={handle(logout)}>Logout</button>

      {msg && <span className="text-sm">{msg}</span>}
    </div>
  );
}
