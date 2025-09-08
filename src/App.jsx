// src/App.jsx
import React from 'react';
import ContactManager from './components/ContactManager';
import AuthBar from './components/AuthBar';
import { syncNow } from './utils/sync.js';
import SyncStatus from './components/SyncStatus.jsx';

export default function App() {
  const handleSync = async () => {
    try {
      const { pushed, pulled } = await syncNow();
      alert(`Synced ✓  pushed: ${pushed}, pulled: ${pulled}`);
    } catch (e) {
      alert(`Sync failed: ${e.message || e}`);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="border-b bg-slate-50">
        <div className="max-w-3xl mx-auto p-4 flex items-center justify-between gap-4">
          <h1 className="text-xl font-semibold">Contact Manager</h1>
          <div className="flex items-center gap-2">
            <SyncStatus />
            <button
              className="px-3 py-2 rounded-lg border hover:bg-slate-100"
              onClick={handleSync}
            >
              Sync now
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 space-y-6">
        <AuthBar />
        <ContactManager />
      </main>
    </div>
  );
}
