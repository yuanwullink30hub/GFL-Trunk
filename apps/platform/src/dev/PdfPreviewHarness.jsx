import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@gfl/i18n';
import AssessmentResultsModal from '../components/assessment/AssessmentResultsModal';

// ──────────────────────────────────────────────────────────────────────────
// Dev-only PDF live-preview.  Mounts the REAL AssessmentResultsModal in
// preview mode, replaying the last real AI generation (captured to
// localStorage['gfl_pdf_replay'] when a report is generated). The modal builds
// the PDF and hands back a blob URL, which we show in a full-window <iframe>.
// Editing the PDF code hot-reloads the modal module → we remount + rebuild.
//
// Open with:  http://localhost:3000/?pdfpreview=1   (dev build only)
// First populate the replay cache by generating one full report in the app.
// ──────────────────────────────────────────────────────────────────────────
export default function PdfPreviewHarness() {
  const { t } = useLanguage();
  const [data] = useState(() => {
    try { return JSON.parse(localStorage.getItem('gfl_pdf_replay') || 'null'); }
    catch { return null; }
  });
  const [url, setUrl] = useState(null);
  const [genKey, setGenKey] = useState(0);
  const [building, setBuilding] = useState(true);

  // Expose the captured analysis/cRuntime so the modal's generation effect
  // replays it instead of hitting the API.
  if (data) {
    window.__GFL_PDF_REPLAY = {
      analysis: data.analysis,
      cRuntime: data.cRuntime,
      uploadedOceanScores: data.uploadedOceanScores,
    };
  }

  const regenerate = useCallback(() => {
    setUrl((old) => { if (old) { try { URL.revokeObjectURL(old); } catch (_) {} } return null; });
    setBuilding(true);
    setGenKey((k) => k + 1);
  }, []);

  // Rebuild whenever the PDF-building module hot-updates.
  useEffect(() => {
    if (import.meta.hot) {
      import.meta.hot.accept('../components/assessment/AssessmentResultsModal.jsx', () => regenerate());
    }
  }, [regenerate]);

  const onReady = useCallback((u) => { setUrl(u); setBuilding(false); }, []);

  const bar = { flex: '0 0 auto', padding: '6px 12px', background: '#11111c', color: '#c4b5fd', fontFamily: 'monospace', fontSize: 12, display: 'flex', gap: 14, alignItems: 'center', borderBottom: '1px solid #2a2a3a' };
  const btn = { background: 'rgba(168,85,247,0.16)', border: '1px solid rgba(168,85,247,0.45)', color: '#c4b5fd', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontFamily: 'monospace', fontSize: 12 };

  if (!data) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#0a0a14', color: '#e2e8f0', fontFamily: 'monospace', fontSize: 13, padding: 40, lineHeight: 1.6 }}>
        <h2 style={{ color: '#c4b5fd' }}>PDF live-preview — no replay data yet</h2>
        <p>Generate one full report in the app first (a real AI run). That captures the
          result + AI text + cRuntime into <code>localStorage['gfl_pdf_replay']</code>.</p>
        <p>Then reload <code>?pdfpreview=1</code> and the PDF will render here, hot-reloading as you edit the builder.</p>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0a0a14' }}>
      {/* Hidden behind the overlay: the real modal renders its radar/morphology
          canvases and builds the PDF. The opaque overlay covers its visible UI. */}
      <div aria-hidden="true">
        <AssessmentResultsModal
          key={genKey}
          previewMode
          onPreviewReady={onReady}
          layerAnswers={data.layerAnswers}
          liveSubjects={data.liveSubjects}
          uploadedFiles={[]}
          resultsLoadingProgress={1}
          resultsModalProgress={1}
          onClose={() => {}}
          onDownload={() => {}}
          onCreateAccount={() => {}}
          onAiReady={() => {}}
          t={t}
        />
      </div>

      {/* Full-window overlay on top of the modal */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 2147483000, background: '#0a0a14', display: 'flex', flexDirection: 'column' }}>
        <div style={bar}>
          <strong style={{ color: '#a855f7' }}>PDF live preview</strong>
          <button style={btn} onClick={regenerate}>↻ Regenerate</button>
          <span>{building ? 'building…' : 'ready'}</span>
          <span style={{ opacity: 0.6 }}>replay captured {new Date(data.savedAt).toLocaleString()}</span>
          {url && <a style={{ ...btn, textDecoration: 'none', marginLeft: 'auto' }} href={url} target="_blank" rel="noreferrer">open ↗</a>}
        </div>
        <div style={{ flex: '1 1 0', position: 'relative' }}>
          {url
            ? <iframe title="pdf-preview" src={url} style={{ width: '100%', height: '100%', border: 0 }} />
            : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontFamily: 'monospace' }}>building PDF…</div>}
        </div>
      </div>
    </div>
  );
}
