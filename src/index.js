import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { LanguageProvider } from './contexts/LanguageContext';
import './index.css';

// Suppress benign ResizeObserver loop error (Recharts / R3F)
const ro = 'ResizeObserver loop';
window.addEventListener('error', e => { if (e.message?.includes(ro)) e.stopImmediatePropagation(); });
window.addEventListener('unhandledrejection', e => { if (e.reason?.message?.includes(ro)) e.stopImmediatePropagation(); });

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <LanguageProvider>
    <App />
  </LanguageProvider>
);
