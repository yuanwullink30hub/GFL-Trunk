import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@gfl/i18n';
import { getQuestions } from '@gfl/api-client';
import { resolvePortrait } from '@gfl/assessment-core/data/archetypeImages';
import { paymentTestHeaders } from '../services/paymentService';
import AssessmentResultsModal from '../components/assessment/AssessmentResultsModal';

// ──────────────────────────────────────────────────────────────────────────
// Dev-only report-card preview. Mounts the REAL AssessmentResultsModal, visible and
// interactive, starting at the report card — email gate, consent, paywall, PDF, leave
// warning — without a single AI call.
//
// Open with:  http://localhost:3000/?reportpreview=1   (dev build only)
//
// Data: the last real generation captured in localStorage['gfl_pdf_replay'] (the same
// cache the PDF preview uses). Without it, random answers over the live questions and
// no AI text — enough to exercise the card chrome and every pop-up.
//
// Network: every /ai/* request is blocked; calls that write or send mail (review gate,
// report / access emails, discard, activity log) are stubbed with { ok: true }.
// Activation codes: any code starting with TEST is accepted, anything else is invalid.
// Payments go to the REAL local backend: without Stripe keys the paywall shows "not active";
// with Stripe TEST keys the backend mints a throwaway sealed test code (POST /payments/dev-seal,
// 404 in production / with live keys) so the whole Stripe test flow runs here without an AI report.
// Edits hot-reload in place (Fast Refresh keeps the open pop-up); Reset remounts the card.
//
// Portrait: The Sovereign (male) from the portrait manifest, or ?portrait=<file name> from
// public/images/Import ready/, whatever archetype the answers produce; no file → no portrait.
// Reset re-checks.
// ──────────────────────────────────────────────────────────────────────────

const portraitParam = new URLSearchParams(window.location.search).get('portrait');
const PREVIEW_PORTRAIT = portraitParam
  ? { url: encodeURI(`/images/Import ready/${portraitParam}`), fullUrl: encodeURI(`/images/Import ready/${portraitParam}`) }
  : resolvePortrait('RULER', 'SAGE', 'male');

const STUBBED = /\/(ai\/(send-results|send-access-email|discard)|assessment\/(review|report-email)|admin\/sessions\/activity)\b/;
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

if (!window.__GFL_REPORT_PREVIEW_FETCH) {
  const realFetch = window.fetch.bind(window);
  const json = (body, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));
  window.__GFL_REPORT_PREVIEW_FETCH = realFetch;
  window.fetch = (input, init) => {
    const url = typeof input === 'string' ? input : (input?.url || String(input));
    if (/\/activation-codes\/redeem\b/.test(url)) {
      let code = '';
      try { code = JSON.parse(init?.body || '{}').code || ''; } catch (_) { /* malformed → invalid */ }
      return code.toUpperCase().startsWith('TEST') ? json({ unlockId: 'preview-code', orbCode: '' }) : json({ error: 'invalid' }, 404);
    }
    if (STUBBED.test(url)) { console.info('[report preview] stubbed:', url); return json({ ok: true }); }
    if (/\/ai\//.test(url)) {
      console.error('[report preview] blocked AI request:', url);
      return Promise.reject(new Error('AI requests are blocked in the report preview'));
    }
    return realFetch(input, init);
  };
}

const readReplay = () => {
  try { return JSON.parse(localStorage.getItem('gfl_pdf_replay') || 'null'); } catch { return null; }
};

/** One random answer per question, in the { [layerIndex]: { [questionId]: answerId } } shape. */
const randomAnswers = (layers) => Object.fromEntries(layers.map((layer) => [
  layer.layerIndex,
  Object.fromEntries((layer.questions || []).map((q) => [q.id, q.answers[Math.floor(Math.random() * q.answers.length)]?.id])),
]));

const AMBER_RGB = '255, 174, 0';
const UI_FONT = "'Lexend Mega', Arial, Helvetica, sans-serif";
const BTN = {
  background: 'transparent', border: `1px solid rgba(${AMBER_RGB}, 0.4)`, borderRadius: '0.15rem', color: '#ffae00',
  fontFamily: UI_FONT, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 'max(9px, 0.45vw)',
  padding: '0.35rem 0.7rem', cursor: 'pointer',
};

export default function ReportPreviewHarness() {
  const { t } = useLanguage();
  const [data, setData] = useState(() => {
    const replay = readReplay();
    return replay ? { ...replay, source: 'replay' } : null;
  });
  const [loadError, setLoadError] = useState('');
  const [mountKey, setMountKey] = useState(0);
  const [cardReady, setCardReady] = useState(false);
  const [portrait, setPortrait] = useState(null);
  const [devSeal, setDevSeal] = useState(undefined); // undefined = asking the backend, '' = none

  // A fresh sealed test code per mount (Reset = a new "report"), only when the backend runs Stripe test keys.
  useEffect(() => {
    let live = true;
    setDevSeal(undefined);
    fetch(`${API_BASE}/payments/dev-seal`, { method: 'POST', headers: paymentTestHeaders() })
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => { if (live) setDevSeal(body?.sealedOrbCode || ''); })
      .catch(() => { if (live) setDevSeal(''); });
    return () => { live = false; };
  }, [mountKey]);

  // Use the preview portrait only if it exists (Vite answers a missing file with index.html,
  // which fails to decode). Re-checked on Reset, so a file saved meanwhile shows up.
  useEffect(() => {
    let live = true;
    if (!PREVIEW_PORTRAIT.url) return undefined;
    const img = new Image();
    img.onload = () => { if (live) setPortrait(PREVIEW_PORTRAIT); };
    img.onerror = () => { if (live) { setPortrait(null); console.info('[report preview] no portrait at', PREVIEW_PORTRAIT.url); } };
    img.src = `${PREVIEW_PORTRAIT.url}?v=${mountKey}`;
    return () => { live = false; };
  }, [mountKey]);

  // index.html paints a boot loading screen until the app signals ready (App.jsx does this after
  // its preload); there is no 3D app here, so signal right away.
  useEffect(() => { window.__gflAppReady?.(); }, []);

  // No captured replay: random answers over the live questions, no AI text.
  useEffect(() => {
    if (data) return;
    getQuestions()
      .then((res) => {
        if (!res.layers?.length) throw new Error('no questions seeded');
        setData({
          layerAnswers: randomAnswers(res.layers),
          liveSubjects: res.layers,
          // Empty analysis would take the modal's "AI failed" path; one placeholder section lands on the card.
          analysis: '## Report preview\n\nNo replay captured: random answers, no AI text. Generate one real report in the app to preview the full text here.',
          cRuntime: null,
          source: 'random',
        });
      })
      .catch((err) => setLoadError(err.message));
  }, [data]);

  // The modal's generation effect reads this instead of calling the API (replay path).
  // The replay's own sealedOrbCode is left out on purpose (a stale seal would fire a real discard on
  // unmount); the throwaway dev seal is used instead when the backend provides one.
  if (data) {
    window.__GFL_PDF_REPLAY = { analysis: data.analysis, cRuntime: data.cRuntime, enginePayload: data.enginePayload, uploadedOceanScores: data.uploadedOceanScores, ...(devSeal ? { sealedOrbCode: devSeal } : {}) };
  }

  const reset = useCallback(() => { setCardReady(false); setMountKey((k) => k + 1); }, []);

  if (!data || devSeal === undefined) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#0a0510', color: '#FFFEF0', fontFamily: "'Figtree', sans-serif", padding: '2.5rem', lineHeight: 1.6 }}>
        {loadError ? `Report preview: could not load questions (${loadError}). Is the backend running on :8080?` : 'Report preview: loading…'}
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0a0510' }}>
      <AssessmentResultsModal
        key={mountKey}
        layerAnswers={data.layerAnswers}
        liveSubjects={data.liveSubjects}
        uploadedFiles={[]}
        resultsLoadingProgress={cardReady ? 1 : 0}
        resultsModalProgress={1}
        onClose={() => {}}
        onDownload={() => {}}
        onAiReady={() => setCardReady(true)}
        portraitOverride={portrait}
        t={t}
      />

      <div style={{
        position: 'fixed', left: '1rem', bottom: '1rem', zIndex: 2147483000,
        display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem',
        background: 'rgba(2, 0, 3, 0.3)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid rgba(${AMBER_RGB}, 0.2)`, borderRadius: '0.5rem',
        fontFamily: UI_FONT, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 'max(9px, 0.45vw)', color: 'rgba(255, 254, 240, 0.7)',
      }}>
        <span style={{ color: '#ffae00', fontWeight: 'bold' }}>Report preview</span>
        <span>
          {data.source === 'replay'
            ? `replay · ${new Date(data.savedAt).toLocaleString()}`
            : 'no replay · random answers · no AI text'}
        </span>
        <span>no AI calls</span>
        <span>{devSeal ? 'stripe test mode' : 'payments off'}</span>
        <button type="button" style={BTN} onClick={reset}>Reset</button>
      </div>
    </div>
  );
}
