// src/main.jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// (If vite-plugin-pwa is configured with injectRegister: 'auto', you don't need to register SW manually here.)

createRoot(document.getElementById('root')).render(<App />);
