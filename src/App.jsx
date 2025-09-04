// src/App.jsx
import React from 'react';
import AuthBar from './components/AuthBar.jsx';

export const ToastContext = React.createContext(() => {});
export function useToast() { return React.useContext(ToastContext); }

export default function App() {
  const [toasts, setToasts] = React.useState([]);

  const pushToast = (msg, type='info') => {
    const id = crypto.randomUUID();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  };

  return (
    <ToastContext.Provider value={pushToast}>
      <main style={{ maxWidth: 960, margin: '0 auto', padding: 16 }}>
        <h1>Contact Manager</h1>
        <AuthBar />

        {/* placeholder for your ContactManager UI */}
        <div style={{ marginTop: 12 }}>Add your ContactManager component here after smoke test.</div>

        {/* Toasts */}
        <div style={{ position:'fixed', right:16, bottom:16, display:'flex', flexDirection:'column', gap:8 }}>
          {toasts.map(t => (
            <div key={t.id} style={{
              background: t.type==='success' ? '#16a34a' : t.type==='error' ? '#dc2626' : '#2563eb',
              color:'#fff', padding:'10px 12px', borderRadius:8, minWidth:220,
              boxShadow:'0 4px 16px rgba(0,0,0,0.15)'
            }}>
              {t.msg}
            </div>
          ))}
        </div>
      </main>
    </ToastContext.Provider>
  );
}
