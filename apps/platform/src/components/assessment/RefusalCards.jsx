import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@gfl/i18n';
import { getRefusalConsent, submitRefusalTexts } from '@gfl/api-client';

/**
 * N1 — refusal cards (Backend Instruction Privacy & Consent v0.1.1 §4.2), shown in the loading panel while
 * the two-layer report is written. Only questions where Layer 1 had a pick and Layer 2 stayed empty qualify;
 * at most `maxCards` of them (sampled at random). Each card: the question, the Layer-2 answers that were
 * shown, one free-text field; every card may stay empty.
 *
 * Opt-in: the consent text and its version come from the server (GET /api/refusal-text/consent) and are
 * rendered verbatim; the box starts unticked and is separate from every other consent. When the server
 * offers no step (503: no store; 404: no approved text for this language) nothing renders. The texts go
 * up anonymously (submitRefusalTexts: no token, no cookies, no session id; each text carries only its
 * question's bank id). Declining,
 * skipping or a failed send changes nothing for the test or the report, and nothing here is stored locally
 * or logged.
 */

const PURPLE = '#a855f7';
const FS = { sm: 'max(9px, 0.45vw)', md: 'max(10px, 0.5vw)', base: 'max(12px, 0.65vw)' };

function shuffled(items) {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Questions with a Layer-1 pick and an empty Layer 2, each with the Layer-2 answers that were shown. */
function emptyLayerTwo(plan, layerAnswers) {
  return plan.subjects.flatMap((subject, layerIndex) => subject.questions.flatMap((q) => {
    const rec = layerAnswers?.[layerIndex]?.[q.id];
    if (!rec || rec.refusal || rec.timeout || !rec.l1?.length || rec.l2?.length) return [];
    const groups = rec.l1.map((p) => p.group);
    return [{ q, shown: q.l2.filter((a) => groups.includes(a.group)) }];
  }));
}

const buttonStyle = (hover, disabled) => ({
  padding: '0.4rem 0.9rem',
  borderRadius: '0.15rem',
  border: `1px solid rgba(168, 85, 247, ${disabled ? 0.2 : 0.5})`,
  background: hover && !disabled ? PURPLE : 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(168, 85, 247, 0.05))',
  color: hover && !disabled ? '#000' : PURPLE,
  boxShadow: hover && !disabled ? '0 0 20px rgba(168, 85, 247, 0.6)' : 'none',
  opacity: disabled ? 0.45 : 1,
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
  fontSize: FS.md,
  fontWeight: 'bold',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  transition: 'all 0.3s',
});

const RefusalCards = ({ plan, layerAnswers }) => {
  const { language, t } = useLanguage();
  const candidates = useMemo(() => (plan ? emptyLayerTwo(plan, layerAnswers) : []), [plan, layerAnswers]);
  const [consent, setConsent] = useState(null);
  const [cards, setCards] = useState([]);
  const [texts, setTexts] = useState({});
  const [agreed, setAgreed] = useState(false);
  const [phase, setPhase] = useState('open'); // open | sending | sent | failed | closed
  const [hover, setHover] = useState(null);
  const [focus, setFocus] = useState(null);

  useEffect(() => {
    if (!candidates.length) return undefined;
    let live = true;
    getRefusalConsent(language === 'en' ? 'en' : 'nl').then((c) => {
      if (!live || !c?.version) return;
      setConsent(c);
      setCards(shuffled(candidates).slice(0, Math.max(1, Math.min(5, c.maxCards || 5))));
    });
    return () => { live = false; };
    // The sample is drawn once, when the step opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidates.length > 0, language]);

  if (!consent || !cards.length || phase === 'closed') return null;

  const filled = cards
    .map((c) => ({ question_id: c.q.id, text: (texts[c.q.id] || '').trim().slice(0, 2000) }))
    .filter((c) => c.text);
  const canSend = agreed && filled.length > 0;
  const pick = (item) => (language === 'en' && item.textEn) || item.text;

  if (phase === 'sent' || phase === 'failed') {
    return (
      <p style={{ fontFamily: "'Figtree', sans-serif", fontSize: FS.base, color: phase === 'sent' ? '#FFFEF0' : 'rgba(255, 254, 240, 0.6)', margin: 0 }}>
        {t(phase === 'sent' ? 'resultsModal.refusalCards.thanks' : 'resultsModal.refusalCards.failed')}
      </p>
    );
  }

  return (
    <div style={{ width: '100%', textAlign: 'left', borderTop: '1px solid rgba(168, 85, 247, 0.2)', paddingTop: '1rem' }}>
      <div style={{ maxHeight: '45vh', overflowY: 'auto', paddingRight: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <h3 style={{ margin: 0, fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif", fontSize: FS.md, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.15em', color: PURPLE }}>
          {consent.title}
        </h3>
        {(consent.body || []).map((para, i) => (
          <p key={i} style={{ margin: 0, fontFamily: "'Figtree', sans-serif", fontSize: FS.base, lineHeight: 1.6, color: 'rgba(255, 254, 240, 0.8)' }}>{para}</p>
        ))}
        {cards.map(({ q, shown }) => (
          <div key={q.id} style={{ border: '1px dashed rgba(168, 85, 247, 0.3)', borderRadius: '0.15rem', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <p style={{ margin: 0, fontFamily: "'Figtree', sans-serif", fontSize: FS.base, lineHeight: 1.5, color: '#FFFEF0' }}>{pick(q)}</p>
            <p style={{ margin: 0, fontFamily: "'Figtree', sans-serif", fontSize: FS.sm, color: 'rgba(255, 254, 240, 0.55)' }}>{t('resultsModal.refusalCards.shown')}</p>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontFamily: "'Figtree', sans-serif", fontSize: FS.sm, lineHeight: 1.5, color: 'rgba(255, 254, 240, 0.7)' }}>
              {shown.map((a) => <li key={a.archetype}>{pick(a)}</li>)}
            </ul>
            <textarea
              aria-label={t('resultsModal.refusalCards.field')}
              placeholder={t('resultsModal.refusalCards.field')}
              maxLength={2000}
              rows={3}
              value={texts[q.id] || ''}
              onChange={(e) => setTexts((prev) => ({ ...prev, [q.id]: e.target.value }))}
              onFocus={() => setFocus(q.id)}
              onBlur={() => setFocus(null)}
              autoComplete="off"
              style={{
                width: '100%',
                resize: 'vertical',
                padding: '0.5rem',
                borderRadius: '0.15rem',
                fontFamily: "'Figtree', sans-serif",
                fontSize: FS.base,
                color: '#FFFEF0',
                outline: 'none',
                border: `1px solid ${focus === q.id ? 'rgba(255, 174, 0, 0.5)' : 'rgba(168, 85, 247, 0.25)'}`,
                background: focus === q.id ? 'rgba(255, 174, 0, 0.04)' : 'rgba(2, 0, 3, 0.3)',
                boxShadow: focus === q.id ? '0 0 15px rgba(255, 174, 0, 0.25)' : 'none',
              }}
            />
          </div>
        ))}
        <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', cursor: 'pointer', fontFamily: "'Figtree', sans-serif", fontSize: FS.base, lineHeight: 1.5, color: 'rgba(255, 254, 240, 0.8)' }}>
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ marginTop: '0.25rem', accentColor: PURPLE, flexShrink: 0 }} />
          <span>{consent.checkbox}</span>
        </label>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem' }}>
        <button type="button" onClick={() => setPhase('closed')} onMouseEnter={() => setHover('skip')} onMouseLeave={() => setHover(null)} style={buttonStyle(hover === 'skip', false)}>
          {consent.skip}
        </button>
        <button
          type="button"
          disabled={!canSend || phase === 'sending'}
          onClick={() => {
            if (!canSend || phase === 'sending') return;
            setPhase('sending');
            // Only a 204 counts as stored; anything else says so plainly. Never touches the report.
            submitRefusalTexts(consent.version, filled).then((ok) => setPhase(ok ? 'sent' : 'failed'));
          }}
          onMouseEnter={() => setHover('send')}
          onMouseLeave={() => setHover(null)}
          style={buttonStyle(hover === 'send', !canSend)}
        >
          {t('resultsModal.refusalCards.send')}
        </button>
      </div>
    </div>
  );
};

export default RefusalCards;
