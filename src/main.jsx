// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register SW only for production builds
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('/sw.js').then(
    reg => console.log('SW registered', reg),
    err => console.warn('SW registration failed', err)
  );
}
// Apply saved theme before React mounts (optional)
const saved = localStorage.getItem('theme');
if (saved === 'dark') {
  document.documentElement.classList.add('dark');
}

