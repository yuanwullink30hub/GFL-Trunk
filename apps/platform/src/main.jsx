import React from 'react';
import ReactDOM from 'react-dom/client';
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

// Dev-only report-card preview: ?reportpreview=1 mounts the real results modal on the
// replayed generation, with AI requests blocked. See src/dev/ReportPreviewHarness.jsx.
const isReportPreview = import.meta.env.DEV &&
  new URLSearchParams(window.location.search).has('reportpreview');

// Dev-only workspace preview: ?workspacepreview=1 shows the first-run workspace step, the login
// reminder and the tool lock, with an in-memory desktop bridge. See src/dev/WorkspacePreviewHarness.jsx.
const isWorkspacePreview = import.meta.env.DEV &&
  new URLSearchParams(window.location.search).has('workspacepreview');

// Dev-only Werkruimte tab preview (browser view → download gate): ?werkruimtepreview=1.
const isWerkruimtePreview = import.meta.env.DEV &&
  new URLSearchParams(window.location.search).has('werkruimtepreview');

// Password- or email-change confirmation landing (?pwverify / ?emailverify token from the email
// link). Mounts a tiny standalone page that applies the change and shows the result — no heavy
// 3D app, any device.
const _verifySearch = new URLSearchParams(window.location.search);
const isPwVerify = _verifySearch.has('pwverify') || _verifySearch.has('emailverify');

// Bank-window landing after iDEAL (Stripe return_url ?betaling=terug): index.html shows the result
// card and closes the window, so no app is mounted here at all.
const isPaymentReturn = _verifySearch.get('betaling') === 'terug';

// Mobile vs desktop are two fully separate code paths (MobileApp.jsx vs App.jsx).
// Decided once at mount: a mobile viewport mounts ONLY MobileApp, so the heavy
// desktop tree (and its hooks) never even evaluates on mobile — and editing one
// side can never touch the other. Uses the <768px breakpoint the app used before.
const isMobile = window.innerWidth < 768;

const root = ReactDOM.createRoot(rootElement);
if (isPaymentReturn) {
  // Nothing to mount: see the ?betaling=terug branch in index.html.
} else if (isPwVerify) {
  const PasswordVerify = React.lazy(() => import('./pages/PasswordVerify'));
  root.render(
    <LanguageProvider>
      <React.Suspense fallback={null}>
        <PasswordVerify />
      </React.Suspense>
    </LanguageProvider>
  );
} else if (isPdfPreview) {
  const PdfPreviewHarness = React.lazy(() => import('./dev/PdfPreviewHarness'));
  root.render(
    <LanguageProvider>
      <React.Suspense fallback={null}>
        <PdfPreviewHarness />
      </React.Suspense>
    </LanguageProvider>
  );
} else if (isWorkspacePreview) {
  const WorkspacePreviewHarness = React.lazy(() => import('./dev/WorkspacePreviewHarness'));
  root.render(
    <LanguageProvider>
      <React.Suspense fallback={null}>
        <WorkspacePreviewHarness />
      </React.Suspense>
    </LanguageProvider>
  );
} else if (isWerkruimtePreview) {
  const WerkruimtePreviewHarness = React.lazy(() => import('./dev/WerkruimtePreviewHarness'));
  root.render(
    <LanguageProvider>
      <React.Suspense fallback={null}>
        <WerkruimtePreviewHarness />
      </React.Suspense>
    </LanguageProvider>
  );
} else if (isReportPreview) {
  const ReportPreviewHarness = React.lazy(() => import('./dev/ReportPreviewHarness'));
  root.render(
    <LanguageProvider>
      <React.Suspense fallback={null}>
        <ReportPreviewHarness />
      </React.Suspense>
    </LanguageProvider>
  );
} else if (isMobile) {
  const MobileApp = React.lazy(() => import('./MobileApp'));
  root.render(
    <LanguageProvider>
      <React.Suspense fallback={null}>
        <MobileApp />
      </React.Suspense>
    </LanguageProvider>
  );
} else {
  const App = React.lazy(() => import('./App'));
  root.render(
    <LanguageProvider>
      <React.Suspense fallback={null}>
        <App />
      </React.Suspense>
    </LanguageProvider>
  );
}
