import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { LanguageProvider } from '@gfl/i18n';
import './index.css';

// Suppress benign ResizeObserver loop error (Recharts / R3F)
const ro = 'ResizeObserver loop';
const hideOverlay = () => {
  const overlay = document.getElementById('webpack-dev-server-client-overlay');
  const overlayDiv = document.getElementById('webpack-dev-server-client-overlay-div');
  if (overlay) overlay.style.display = 'none';
  if (overlayDiv) overlayDiv.style.display = 'none';
};
window.addEventListener('error', e => {
  if (e.message?.includes(ro)) { e.stopImmediatePropagation(); setTimeout(hideOverlay, 0); }
});
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
