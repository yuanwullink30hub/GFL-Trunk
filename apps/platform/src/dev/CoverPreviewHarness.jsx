import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLanguage } from '@gfl/i18n';
import { EXTENDED_ARCHETYPES } from '@gfl/assessment-core/data/scoring/index.js';
import { resolvePortrait, PORTRAIT_VARIANTS } from '@gfl/assessment-core/data/archetypeImages';
import { getArchetypeQuote } from '@gfl/assessment-core/data/archetypeQuotes';
import { drawCoverPage } from '../components/assessment/coverPage';

// ──────────────────────────────────────────────────────────────────────────
// Dev-only cover preview — page 1 of the report PDF, nothing else.
//
//   http://localhost:3000/?coverpreview=1
//
// It calls drawCoverPage() — the same function the report's PDF builder calls — so what is on
// screen here is what ships. Built for judging ONE thing: where the levensles lands on the art.
//
// Pick any of the 132 archetypes, flip male/female, and step through with the arrow keys. The
// levensles is the real one for that combination (archetypeQuotes.js), in the chosen language.
//
// Lesson mode mirrors the report's own dev switch (window.__GFL_PDF_REPLAY.lessonMode):
//   auto  whichever of the two lays out better — what a reader gets
//   open  beside the figure, in the open part of the scene
//   flow  along a pole of the figure
//
// Subtitle matters for the geometry: with one the portrait is 225.5 mm tall, without it 234 mm
// (the taller case, and the one the 2764 px print tier is cut for).
//
// CAVEAT worth knowing while judging: the levensles is shaped by the portrait's depth map, and
// only the two Ronin maps exist so far. Every other portrait falls back to placement from the
// alpha silhouette alone — level, one size. The banner says which of the two you are looking at.
// ──────────────────────────────────────────────────────────────────────────

const A = '#ffae00';
const KEYS = Object.keys(EXTENDED_ARCHETYPES);

const box = {
  background: 'rgba(2,0,3,0.3)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: `1px solid rgba(255,174,0,0.25)`,
  borderRadius: '0.5rem',
  boxShadow: '0 0 40px rgba(0,0,0,0.6)',
};
const chrome = {
  fontFamily: "'Lexend Mega', system-ui, sans-serif",
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  fontWeight: 700,
};
const ctl = {
  ...chrome,
  fontSize: 'max(10px, 0.7vw)',
  background: 'rgba(255,174,0,0.06)',
  color: '#FFFEF0',
  border: '1px solid rgba(255,174,0,0.4)',
  borderRadius: '0.15rem',
  padding: '0.45rem 0.6rem',
  cursor: 'pointer',
  outline: 'none',
};

export default function CoverPreviewHarness() {
  const { language, t } = useLanguage();
  const [i, setI] = useState(0);
  const [variant, setVariant] = useState('female');
  const [lessonMode, setLessonMode] = useState('auto');
  const [withSubtitle, setWithSubtitle] = useState(false);
  const [url, setUrl] = useState(null);
  const [status, setStatus] = useState('');
  const [ready, setReady] = useState(null);       // Set of slot names already cut, or null while unknown
  const [depthSet, setDepthSet] = useState(null); // Set of slots that actually HAVE a depth map on disk
  const lastUrl = useRef(null);

  // Poll which slots exist while the ingest is still cutting tiers, so the picker can say so.
  useEffect(() => {
    let dead = false;
    const load = async () => {
      try {
        const r = await fetch('/dev-portraits/index.json', { cache: 'no-store' });
        const j = await r.json();
        if (dead) return;
        setReady(new Set(j.slots || []));
        setDepthSet(new Set(j.depth || []));
      } catch { /* middleware absent — treat every slot as present */ }
    };
    load();
    const id = setInterval(load, 8000);
    return () => { dead = true; clearInterval(id); };
  }, []);

  const key = KEYS[i];
  const [mainKey, support] = useMemo(() => {
    const s = key.lastIndexOf('_');
    return [key.slice(0, s), key.slice(s + 1)];
  }, [key]);

  // The print copy comes from R2 in production. Locally nothing is uploaded yet, so point it at the
  // dev middleware over portraits/print/ (vite.config.ts) — otherwise the cover silently falls back to
  // the 1100 px card copy and the preview shows a softer cover than the one that ships.
  const portrait = useMemo(() => {
    const p = resolvePortrait(mainKey, support, variant, { fallback: false });
    if (!p.printUrl) return p;
    const slot = p.printUrl.slice(p.printUrl.lastIndexOf('/') + 1);
    return { ...p, printUrl: `/dev-portraits/print/${slot}` };
  }, [mainKey, support, variant]);
  const name = EXTENDED_ARCHETYPES[key];
  const lesson = useMemo(() => getArchetypeQuote(mainKey, support, language), [mainKey, support, language]);

  // Redraw the cover whenever anything it depends on changes.
  useEffect(() => {
    let dead = false;
    (async () => {
      setStatus('drawing…');
      window.__GFL_PDF_REPLAY = { ...(window.__GFL_PDF_REPLAY || {}), lessonMode };
      try {
        const { default: JsPDF } = await import('jspdf');
        const pdf = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
        // The report clamps every text size to 8 pt; the cover inherits that, so the preview must too
        // or the smallest levensles steps would render larger here than in the real PDF.
        const orig = pdf.setFontSize.bind(pdf);
        pdf.setFontSize = (s) => orig(Math.max(s, 8));

        await drawCoverPage(pdf, {
          y: 18, W: 210, H: 297, margin: 18, contentW: 174,
          // Same tuples as the report's PDF palette; bg (#030012) is the page and the levensles halo.
          colors: { orange: [249, 115, 22], purple: [168, 85, 247], white: [209, 213, 219], bg: [3, 0, 18] },
          t, language,
          extName: name,
          result: {
            name,
            extendedSubtitle: withSubtitle ? (language === 'en' ? 'Support: the shape it takes' : 'Ondersteuning: de vorm die het aanneemt') : '',
            levensles: lesson,
          },
          portrait,
        });
        if (dead) return;
        const blob = pdf.output('blob');
        if (lastUrl.current) URL.revokeObjectURL(lastUrl.current);
        lastUrl.current = URL.createObjectURL(blob);
        setUrl(lastUrl.current);
        setStatus('');
      } catch (err) {
        if (!dead) setStatus(`failed: ${err.message}`);
        console.error('[cover preview]', err);
      }
    })();
    return () => { dead = true; };
  }, [key, variant, lessonMode, withSubtitle, language, name, lesson, portrait, t]);

  const slotOf = useCallback((k, v) => `${k.toLowerCase().replace(/_/g, '-')}-${v}`, []);
  const isCut = useCallback(
    (k, v) => !ready || ready.has(slotOf(k, v)) || ready.has(slotOf(k, 'shared')),
    [ready, slotOf],
  );

  // Plain step, and a step that skips slots whose art has not been cut yet.
  const step = useCallback((d) => setI((n) => (n + d + KEYS.length) % KEYS.length), []);
  const stepReady = useCallback((d) => setI((n) => {
    for (let k = 1; k <= KEYS.length; k++) {
      const c = (n + d * k + KEYS.length * KEYS.length) % KEYS.length;
      if (isCut(KEYS[c], variant)) return c;
    }
    return n;
  }), [isCut, variant]);
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'SELECT') return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); step(1); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); step(-1); }
      if (e.key === ' ') { e.preventDefault(); setVariant((v) => (v === 'male' ? 'female' : 'male')); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step]);

  const hasArt = !!portrait.url;
  const cut = isCut(key, variant);
  // The manifest points every slot at a depth file whether one exists or not, so portrait.depthUrl
  // proves nothing. Only the directory listing does.
  const hasDepth = depthSet
    ? depthSet.has(slotOf(key, variant)) || depthSet.has(slotOf(key, 'shared'))
    : !!portrait.depthUrl;

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0510', color: '#FFFEF0',
      fontFamily: "'Figtree', system-ui, sans-serif",
      display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 22rem', gap: '1rem', padding: '1rem',
    }}>
      <div style={{ ...box, overflow: 'hidden', minHeight: '85vh' }}>
        {url
          ? <iframe key={url} title="cover" src={`${url}#toolbar=0&navpanes=0&view=Fit`} style={{ width: '100%', height: '100%', border: 0, minHeight: '85vh' }} />
          : <div style={{ padding: '2rem', opacity: 0.6 }}>{status || 'drawing…'}</div>}
      </div>

      <div style={{ ...box, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.9rem', alignSelf: 'start' }}>
        <div style={{ ...chrome, fontSize: 'max(13px, 0.95vw)', color: A }}>Cover preview</div>

        <div style={{ fontSize: 'max(12px,0.8vw)', lineHeight: 1.45 }}>
          <div style={{ ...chrome, fontSize: 'max(9px,0.6vw)', opacity: 0.55 }}>{i + 1} / {KEYS.length} &nbsp;·&nbsp; {key}</div>
          <div style={{ fontSize: 'max(16px,1.1vw)', marginTop: '0.2rem' }}>{name}</div>
        </div>

        <select value={key} onChange={(e) => setI(KEYS.indexOf(e.target.value))}
          style={{ ...ctl, textTransform: 'none', letterSpacing: 0, fontFamily: 'inherit', width: '100%' }}>
          {KEYS.map((k, n) => (
            <option key={k} value={k} style={{ background: '#0a0510' }}>
              {isCut(k, variant) ? '' : '· '}{n + 1}. {EXTENDED_ARCHETYPES[k]}{isCut(k, variant) ? '' : '  (not cut yet)'}
            </option>
          ))}
        </select>

        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button style={{ ...ctl, flex: 1 }} onClick={() => step(-1)}>← prev</button>
          <button style={{ ...ctl, flex: 1 }} onClick={() => step(1)}>next →</button>
        </div>
        {ready && ready.size < KEYS.length && (
          <button style={{ ...ctl, width: '100%' }} onClick={() => stepReady(1)}>next with art →</button>
        )}

        <Row label="Variant">
          {PORTRAIT_VARIANTS.map((v) => (
            <button key={v} onClick={() => setVariant(v)}
              style={{ ...ctl, flex: 1, background: variant === v ? A : 'rgba(255,174,0,0.06)', color: variant === v ? '#000' : '#FFFEF0' }}>{v}</button>
          ))}
        </Row>

        <Row label="Lesson mode">
          {['auto', 'open', 'flow'].map((m) => (
            <button key={m} onClick={() => setLessonMode(m)}
              style={{ ...ctl, flex: 1, background: lessonMode === m ? A : 'rgba(255,174,0,0.06)', color: lessonMode === m ? '#000' : '#FFFEF0' }}>{m}</button>
          ))}
        </Row>

        <Row label="Subtitle">
          {[['off', false], ['on', true]].map(([l, v]) => (
            <button key={l} onClick={() => setWithSubtitle(v)}
              style={{ ...ctl, flex: 1, background: withSubtitle === v ? A : 'rgba(255,174,0,0.06)', color: withSubtitle === v ? '#000' : '#FFFEF0' }}>{l}</button>
          ))}
        </Row>

        <div style={{ fontSize: 'max(11px,0.72vw)', lineHeight: 1.5, opacity: 0.85, borderTop: '1px solid rgba(255,174,0,0.2)', paddingTop: '0.7rem' }}>
          <Flag ok={hasArt && cut}
            on={`portrait ${variant} ready`}
            off={hasArt ? `art not cut yet — the ingest has not reached this slot` : `no ${variant} portrait for this slot`} />
          <Flag ok={hasDepth}
            on="depth map present — lesson is depth-shaped"
            off="no depth map — lesson placed from the silhouette only" />
          {ready && (
            <div style={{ marginTop: '0.5rem', opacity: 0.75 }}>
              {ready.size} / {KEYS.length} slots cut{ready.size < KEYS.length ? ' — the rest are still generating' : ''}
            </div>
          )}
          <div style={{ marginTop: '0.5rem', opacity: 0.6 }}>
            Portrait is {withSubtitle ? '225.5' : '234'} mm tall here. Arrows step, space flips variant.
          </div>
          {status && <div style={{ marginTop: '0.5rem', color: '#ff6b6b' }}>{status}</div>}
        </div>

        <div style={{ fontSize: 'max(11px,0.72vw)', lineHeight: 1.5, opacity: 0.7, borderTop: '1px solid rgba(255,174,0,0.2)', paddingTop: '0.7rem' }}>
          <div style={{ ...chrome, fontSize: 'max(9px,0.6vw)', opacity: 0.6, marginBottom: '0.3rem' }}>Levensles ({language})</div>
          {lesson || <em style={{ opacity: 0.5 }}>none for this combination</em>}
        </div>
      </div>
    </div>
  );
}

const Row = ({ label, children }) => (
  <div>
    <div style={{ ...chrome, fontSize: 'max(9px,0.6vw)', opacity: 0.55, marginBottom: '0.3rem' }}>{label}</div>
    <div style={{ display: 'flex', gap: '0.4rem' }}>{children}</div>
  </div>
);

const Flag = ({ ok, on, off }) => (
  <div style={{ color: ok ? '#7CFFB2' : '#ffae00' }}>{ok ? '✓' : '!'} {ok ? on : off}</div>
);
