// src/components/AuthBar.jsx
import React, { useState } from 'react';
import { register, login, logout, syncNow } from '../utils/sync';
import { useToast } from '../App'; // if you don't have this yet, we’ll add next step

export default function AuthBar() {
  const toast = useToast ? useToast() : (() => {});
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function doRegister() {
    try { await register(email.trim(), password); toast('Registered & logged in', 'success'); }
    catch { toast('Register failed', 'error'); }
  }
  async function doLogin() {
    try { await login(email.trim(), password); toast('Logged in', 'success'); }
    catch { toast('Login failed', 'error'); }
  }
  async function doLogout() {
    try { await logout(); toast('Logged out', 'info'); }
    catch { toast('Logout failed', 'error'); }
  }
  async function doSync() {
    try { const r = await syncNow(); toast(`Synced (↑${r.pushed} ↓${r.pulled})`, 'success'); }
    catch { toast('Sync failed (are you logged in?)', 'error'); }
  }

  return (
    <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center', marginBottom:12 }}>
      <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
      <button onClick={doRegister}>Register</button>
      <button onClick={doLogin}>Login</button>
      <button onClick={doLogout}>Logout</button>
      <button onClick={doSync}>Sync now</button>
    </div>
  );
}
