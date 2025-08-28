// src/App.jsx
import React, { useEffect, useState, createContext, useContext, useCallback } from 'react';
import ContactManager from './components/ContactManager';

const ToastContext = createContext((msg, type) => {});

function UpdateBanner({ onReload }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => setShow(true));
    }
  }, []);
  if (!show) return null;
  return (
    <div className="update-banner">
      <span>App updated.</span>
      <button className="btn" onClick={onReload}>Reload</button>
    </div>
  );
}

function ToastHost() {
  const [items, setItems] = useState([]); // {id, text, type}
  const push = useCallback((text, type = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setItems((it) => [...it, { id, text, type }]);
    setTimeout(() => {
      setItems((it) => it.filter((x) => x.id !== id));
    }, 3000);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      <div className="toasts">
        {items.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>{t.text}</div>
        ))}
      </div>
      {/* children via context consumer in App below */}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

export default function App() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    try { await deferredPrompt.userChoice; } catch {}
    setDeferredPrompt(null);
    setCanInstall(false);
  };

  return (
    <ToastHost>
      <div className="container">
        <header className="app-header">
          <h1>Contact Manager</h1>
          <div className="header-actions">
            {canInstall && (
              <button className="btn" onClick={handleInstall} aria-label="Install app">
                Install App
              </button>
            )}
          </div>
        </header>

        <UpdateBanner onReload={() => window.location.reload()} />

        <main>
          <ContactManager />
        </main>

        <footer className="app-footer" aria-label="App version">
          v1.0.3
        </footer>
      </div>
    </ToastHost>
  );
}
