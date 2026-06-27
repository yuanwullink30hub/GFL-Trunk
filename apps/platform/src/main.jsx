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

// Dev-only PDF live-preview route: ?pdfpreview=1 mounts a harness that replays
// the last real generation and renders the PDF in an iframe (hot-reloads on edit),
// instead of booting the full 3D app. See src/dev/PdfPreviewHarness.jsx.
const isPdfPreview = import.meta.env.DEV &&
  new URLSearchParams(window.location.search).has('pdfpreview');

const root = ReactDOM.createRoot(rootElement);
if (isPdfPreview) {
  const PdfPreviewHarness = React.lazy(() => import('./dev/PdfPreviewHarness'));
  root.render(
    <LanguageProvider>
      <React.Suspense fallback={null}>
        <PdfPreviewHarness />
      </React.Suspense>
    </LanguageProvider>
  );
} else {
  root.render(
    <LanguageProvider>
      <App />
    </LanguageProvider>
  );
}
