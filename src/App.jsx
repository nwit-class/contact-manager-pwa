// src/App.jsx
import React, { useEffect, useState } from 'react';
import ContactManager from './components/ContactManager';

function UpdateBanner({ onReload }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Show a banner when a new SW takes control (app updated)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setShow(true);
      });
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

export default function App() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    // Capture beforeinstallprompt to show our own Install button
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
    try {
      await deferredPrompt.userChoice;
    } catch {}
    setDeferredPrompt(null);
    setCanInstall(false);
  };

  return (
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
  v1.0.1
</footer>

    </div>
  );
}
