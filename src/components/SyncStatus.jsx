// src/components/SyncStatus.jsx
import React, { useEffect, useState } from 'react';
import { getSyncMeta } from '../utils/scheduler.js';

function fmt(ms) {
  if (!ms) return 'never';
  const s = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

export default function SyncStatus() {
  const [meta, setMeta] = useState(getSyncMeta());
  useEffect(() => {
    const t = setInterval(() => setMeta(getSyncMeta()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span
      title={`leader: ${meta.isLeader}, backoff: ${meta.backoffMs}ms`}
      className="text-xs px-2 py-1 rounded bg-slate-100 border"
    >
      last sync: {fmt(meta.lastSyncMs)} {meta.isLeader ? '• leader' : ''}
    </span>
  );
}
