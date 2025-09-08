// src/utils/scheduler.js
const LS_KEY = 'lastSyncMs';

export function getSyncMeta() {
  const last = Number(localStorage.getItem(LS_KEY) || 0);
  return {
    lastSyncMs: Number.isFinite(last) ? last : 0,
    isLeader: true,   // stub for now
    backoffMs: 0
  };
}

// handy helper you can call after a successful sync:
export function setLastSync(ms = Date.now()) {
  localStorage.setItem(LS_KEY, String(ms));
}
