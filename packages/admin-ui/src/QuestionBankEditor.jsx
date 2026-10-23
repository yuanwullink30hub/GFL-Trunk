/**
 * The two-layer question bank editor (owner, 16 Oct 2026), laid out after the owner's Leerling Assessment
 * Sheet: a sticky index of the 36 positions, then one card per question. Inside a card every hardware group is
 * one row: its Layer-1 direction on the left, forking into its two Layer-2 archetypes on the right. The editor
 * always shows the canonical order; what a respondent sees comes from the rotation sequence and the shuffle.
 *
 * Every field saves on its own as a draft (700 ms after the last keystroke, or on leaving the field), pinned to
 * the version the editor last saw. A stale save takes the stored draft (fields not being typed in follow it)
 * and is sent again. Nothing reaches respondents until "Publiceer naar de test" (routes/questions.js, /bank).
 */
import React, { createContext, memo, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '@gfl/i18n';
import { getQuestionBank, saveQuestionBankEntry, publishQuestionBank } from '@gfl/api-client';
import { C, FONT, SciFiButton } from '@gfl/ui';
import { CHROME, DISPLAY, HOLO_BAR } from './holo';

// ── Structure of the instrument (not data) ──
const SUBJECTS = [
  { key: 'zelf_zonde', label: 'Zelf / Zonde' },
  { key: 'ander_attentie', label: 'Ander / Attentie' },
  { key: 'massa_macht', label: 'Massa / Macht' },
  { key: 'wereld_wijsheid', label: 'Wereld / Wijsheid' },
  { key: 'mysterie_magie', label: 'Mysterie / Magie' },
];
const NETWORK = { Ruling: 'CEN', Relational: 'Limbic', Seeker: 'Openness', Chaos: 'Salience', Abstract: 'DMN', Agency: 'Will' };
const WHEEL = { Judge: 1, Lover: 2, Caregiver: 3, Innocent: 4, Explorer: 5, Outlaw: 6, Trickster: 7, Sage: 8, Artist: 9, Magician: 10, Hero: 11, Ruler: 12 };
const REFUSAL_LABEL = 'Geen van deze past';
const SAVE_DELAY = 700;
const BODY = "'Figtree', sans-serif";
const O = '249, 115, 22'; // the dashboard accent (orange); tints from its alpha ramp 0.04 / 0.1 / 0.2 / 0.5
const P = '168, 85, 247';

const FitCtx = createContext(0); // bumps on window resize, so every box re-fits its text

// ── Field values: { text, l1: { group: text }, l2: { archetype: text } }, addressed as 'text' / 'l1.Ruling' ──
const valuesOf = (q) => ({ text: q.text || '', l1: { ...(q.l1 || {}) }, l2: { ...(q.l2 || {}) } });
const getField = (v, f) => (f === 'text' ? v.text : (v[f.slice(0, 2)][f.slice(3)] || ''));
const setField = (v, f, val) => (f === 'text' ? { ...v, text: val } : { ...v, [f.slice(0, 2)]: { ...v[f.slice(0, 2)], [f.slice(3)]: val } });
const patchOf = (f, val) => (f === 'text' ? { text: val } : { [f.slice(0, 2)]: { [f.slice(3)]: val } });
const fieldsOf = (layout) => ['text', ...layout.flatMap((g) => [`l1.${g.group}`, ...g.archetypes.map((a) => `l2.${a.name}`)])];
const filled = (s) => Boolean(String(s || '').trim());

/** Incoming stored values, except in fields being typed in (dirty or focused). */
function mergeIncoming(cur, q, dirty, focused, layout) {
  let next = cur;
  for (const f of fieldsOf(layout)) {
    if (dirty.has(f) || focused === f) continue;
    const v = getField(valuesOf(q), f);
    if (getField(next, f) !== v) next = setField(next, f, v);
  }
  return next;
}

const STYLES = `
.qb { container-type: inline-size; display: flex; flex-direction: column; gap: 1rem; font-family: ${BODY}; color: ${C.text}; }
.qb-index { position: sticky; top: 0; z-index: 6; display: flex; flex-direction: column; gap: 0.5rem; padding: 0.6rem 0.2rem;
  background-color: ${HOLO_BAR.backgroundColor}; backdrop-filter: ${HOLO_BAR.backdropFilter}; -webkit-backdrop-filter: ${HOLO_BAR.backdropFilter};
  border-bottom: 1px solid rgba(${P}, 0.2); }
.qb-progress { display: flex; flex-wrap: wrap; gap: 0.3rem 1rem; align-items: baseline; font-family: ${FONT}; font-size: max(9px, 0.45vw);
  text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255, 254, 240, 0.5); }
.qb-progress b { font-family: ${DISPLAY}; font-size: max(13px, 0.7vw); letter-spacing: 0.02em; color: ${C.text}; font-weight: 600; }
.qb-progress .qb-unpub { color: ${C.gold}; }
.qb-progress .qb-unpub b { color: ${C.gold}; }
.qb-chips { display: flex; flex-wrap: wrap; gap: 0.4rem 1.1rem; }
.qb-chipgroup { display: flex; align-items: center; gap: 0.25rem; flex-wrap: wrap; }
.qb-chipgroup > span { font-family: ${FONT}; font-size: max(8px, 0.4vw); letter-spacing: 0.14em; text-transform: uppercase; color: rgba(255, 254, 240, 0.4); margin-right: 0.25rem; }
.qb-chip { width: 1.75rem; height: 1.45rem; display: inline-grid; place-items: center; padding: 0; cursor: pointer; border-radius: 0.15rem;
  font-family: ${DISPLAY}; font-size: max(11px, 0.6vw); font-weight: 600; font-variant-numeric: tabular-nums;
  background: transparent; border: 1px solid rgba(255, 254, 240, 0.15); color: rgba(255, 254, 240, 0.45); transition: all 0.2s ease; }
.qb-chip[data-state="partial"] { border-color: rgba(${O}, 0.5); color: ${C.gold}; }
.qb-chip[data-state="full"] { border-color: rgba(${O}, 0.5); background: rgba(${O}, 0.2); color: ${C.text}; }
.qb-chip:hover { background: ${C.gold}; border-color: ${C.gold}; color: #000; box-shadow: 0 0 20px rgba(${O}, 0.5); }
.qb-chip:focus-visible { outline: none; border-color: rgba(${O}, 0.5); box-shadow: 0 0 15px rgba(${O}, 0.2); }

.qb-subject { display: flex; align-items: baseline; gap: 0.8rem; flex-wrap: wrap; margin-top: 0.6rem; scroll-margin-top: calc(var(--qb-index-h, 5rem) + 0.5rem); }
.qb-subject h3 { margin: 0; font-family: ${FONT}; font-size: max(11px, 0.6vw); letter-spacing: 0.16em; text-transform: uppercase; color: ${C.gold}; }
.qb-subject span { font-family: ${FONT}; font-size: max(8px, 0.4vw); letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255, 254, 240, 0.4); }

.qb-card { display: flex; flex-direction: column; gap: 0.8rem; padding: 0 1.1rem 1rem; border-radius: 0.5rem; min-width: 0;
  background-color: rgba(2, 0, 3, 0.3); border: 1px solid rgba(${P}, 0.2); scroll-margin-top: calc(var(--qb-index-h, 5rem) + 0.5rem); }
.qb-top { position: sticky; top: var(--qb-index-h, 5rem); z-index: 4; display: flex; flex-direction: column; gap: 0.5rem;
  margin: 0 -1.1rem; padding: 0.8rem 1.1rem 0.5rem; border-radius: 0.5rem 0.5rem 0 0;
  background-color: ${HOLO_BAR.backgroundColor}; backdrop-filter: ${HOLO_BAR.backdropFilter}; -webkit-backdrop-filter: ${HOLO_BAR.backdropFilter}; }
.qb-head { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.3rem 0.9rem; }
.qb-num { font-family: ${FONT}; font-weight: bold; font-size: max(12px, 0.65vw); letter-spacing: 0.08em; color: ${C.gold}; }
.qb-id { font-family: ${FONT}; font-size: max(8px, 0.4vw); letter-spacing: 0.08em; text-transform: uppercase; color: rgba(255, 254, 240, 0.4); }
.qb-count { margin-left: auto; font-family: ${DISPLAY}; font-weight: 600; font-size: max(12px, 0.65vw); color: rgba(255, 254, 240, 0.7); font-variant-numeric: tabular-nums; }
.qb-state { font-family: ${FONT}; font-size: max(8px, 0.4vw); letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255, 254, 240, 0.4); min-width: 9ch; text-align: right; }
.qb-state[data-s="err"] { color: #fca5a5; }
.qb-state .qb-notlive { color: ${C.gold}; margin-right: 0.6rem; }

.qb-field { width: 100%; box-sizing: border-box; display: block; resize: none; overflow: hidden; margin: 0;
  font-family: ${BODY}; font-size: max(12px, 0.65vw); line-height: 1.45; color: ${C.text};
  background-color: rgba(0, 0, 0, 0.4); border: 1px solid rgba(${O}, 0.2); border-radius: 0.15rem; padding: 0.5rem 0.65rem;
  min-height: calc(5 * 1.45em + 1rem + 2px); outline: none; transition: border-color 0.25s ease, background-color 0.25s ease, box-shadow 0.25s ease; }
.qb-field::placeholder { color: rgba(255, 254, 240, 0.3); }
.qb-field:hover { border-color: rgba(${O}, 0.5); }
.qb-field:focus { border-color: rgba(${O}, 0.5); background-color: rgba(${O}, 0.04); box-shadow: 0 0 15px rgba(${O}, 0.2); }
.qb-question { font-weight: 600; font-size: max(16px, 0.9vw); line-height: 1.35; min-height: 0; padding: 0.3rem 0.45rem;
  background-color: transparent; border-color: transparent; }
.qb-l1 { flex: 1; max-height: 24rem; }

.qb-layers, .qb-row { display: grid; grid-template-columns: minmax(0, 5fr) 2.5rem minmax(0, 7fr); }
.qb-layers { align-items: end; }
.qb-layers > div { display: flex; align-items: center; gap: 0.6rem; font-family: ${FONT}; font-size: max(8px, 0.4vw); letter-spacing: 0.16em; text-transform: uppercase; color: rgba(255, 254, 240, 0.5); }
.qb-layers > div::after { content: ""; flex: 1; border-top: 1px solid rgba(${P}, 0.2); }
.qb-layers > div:last-child { grid-column: 3; }
.qb-row { align-items: stretch; padding: 0.9rem 0; border-top: 1px solid rgba(${P}, 0.12); }
.qb-row:first-child { border-top: 0; padding-top: 0.2rem; }
.qb-gcell { display: flex; flex-direction: column; gap: 0.4rem; min-width: 0; }
.qb-ghead { display: flex; justify-content: space-between; align-items: baseline; gap: 0.5rem; }
.qb-gname { font-family: ${FONT}; font-weight: bold; font-size: max(9px, 0.45vw); letter-spacing: 0.14em; text-transform: uppercase; color: ${C.text}; }
.qb-gnet { font-family: ${FONT}; font-size: max(8px, 0.4vw); letter-spacing: 0.08em; text-transform: uppercase; color: rgba(255, 254, 240, 0.4); }
.qb-fork { position: relative; }
.qb-fork::before { content: ""; position: absolute; left: 0; width: 50%; top: 50%; border-top: 1px solid rgba(${O}, 0.5); }
.qb-fork::after { content: ""; position: absolute; left: 50%; right: 0; top: 25%; bottom: 25%; border: 1px solid rgba(${O}, 0.5); border-right: 0; }
.qb-acells { display: flex; flex-direction: column; gap: 0.6rem; min-width: 0; }
.qb-acell { display: grid; grid-template-columns: 6.5rem minmax(0, 1fr); gap: 0.6rem; align-items: start; min-width: 0; }
.qb-aname { display: flex; gap: 0.4rem; align-items: baseline; padding-top: 0.5rem; font-family: ${BODY}; font-weight: 600; font-size: max(12px, 0.65vw); }
.qb-aname i { font-style: normal; font-family: ${DISPLAY}; font-size: max(11px, 0.6vw); color: rgba(255, 254, 240, 0.4); }
.qb-refusal { border-top: 1px dashed rgba(${P}, 0.2); padding-top: 0.6rem; font-family: ${FONT}; font-size: max(8px, 0.4vw); letter-spacing: 0.08em; text-transform: uppercase; color: rgba(255, 254, 240, 0.4); }

.qb-banner { border: 1px dashed rgba(${O}, 0.5); border-radius: 0.15rem; padding: 0.6rem 0.8rem; font-size: max(12px, 0.65vw); color: rgba(255, 254, 240, 0.8); }
.qb-banner[data-kind="err"] { border-color: rgba(239, 68, 68, 0.5); color: #fca5a5; }
.qb-banner ul { margin: 0.4rem 0 0; padding-left: 1.1rem; }
.qb-copybox { width: 100%; box-sizing: border-box; min-height: 10rem; font-family: monospace; font-size: max(10px, 0.5vw); color: ${C.text};
  background-color: rgba(0, 0, 0, 0.4); border: 1px solid rgba(${O}, 0.2); border-radius: 0.15rem; padding: 0.5rem; }

@container (max-width: 640px) {
  .qb-layers, .qb-fork { display: none; }
  .qb-row { grid-template-columns: minmax(0, 1fr); }
  .qb-acells { margin-top: 0.6rem; padding-left: 0.7rem; border-left: 1px solid rgba(${O}, 0.5); }
  .qb-acell { grid-template-columns: minmax(0, 1fr); gap: 0.25rem; }
  .qb-aname { padding-top: 0; }
  /* phones: 16px in the boxes, or iOS zooms the page on every tap into one (owner, 23 Oct 2026: admin on a phone) */
  .qb-field { font-size: 16px; }
  .qb-question { font-size: 17px; }
}
`;

/** A textarea that grows with its text. `stretch`: fills its row (a direction box stays as tall as its archetypes). */
const AutoText = memo(function AutoText({ field, value, onChange, onFocus, onBlur, stretch, className, ...rest }) {
  const ref = useRef(null);
  const epoch = useContext(FitCtx);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (stretch) {
      el.style.flex = 'none'; el.style.minHeight = ''; el.style.height = 'auto';
      const h = el.scrollHeight + 2;
      el.style.height = ''; el.style.flex = '';
      el.style.minHeight = `max(${h}px, calc(5 * 1.45em + 1rem + 2px))`;
    } else {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight + 2}px`;
    }
  }, [value, epoch, stretch]);
  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      className={className}
      onChange={(e) => onChange(field, e.target.value)}
      onFocus={() => onFocus(field)}
      onBlur={() => onBlur(field)}
      {...rest}
    />
  );
});

/** One question: its own field values, saves and save state. Reports its counts and publish state upward. */
const QuestionCard = memo(function QuestionCard({ level, question, subjectLabel, layout, live, onCount, onLive, onError, register }) {
  const { t, tFunc } = useLanguage();
  const qid = question.question_id;
  const [values, setValues] = useState(() => valuesOf(question));
  const [saveState, setSaveState] = useState('');
  const valuesRef = useRef(values);
  valuesRef.current = values;
  const version = useRef(question.version);
  const dirty = useRef(new Set());
  const focused = useRef(null);
  const timers = useRef({});
  const chain = useRef(Promise.resolve());
  const inFlight = useRef(0);

  useEffect(() => register(qid, {
    body: () => valuesRef.current,
    pending: () => dirty.current.size > 0 || inFlight.current > 0, // typed and not yet stored
  }), [qid, register]);

  useEffect(() => () => Object.values(timers.current).forEach(clearTimeout), []);

  // Counts for the index (per layer and the question text).
  useEffect(() => {
    onCount(qid, {
      text: filled(values.text) ? 1 : 0,
      l1: layout.filter((g) => filled(values.l1[g.group])).length,
      l2: layout.reduce((n, g) => n + g.archetypes.filter((a) => filled(values.l2[a.name])).length, 0),
    });
  }, [values, qid, layout, onCount]);

  // A newer stored version (reload, another tab): take it in every field not being typed in.
  useEffect(() => {
    if (question.version <= version.current) return;
    version.current = question.version;
    setValues((cur) => mergeIncoming(cur, question, dirty.current, focused.current, layout));
  }, [question, layout]);

  const save = useCallback((field) => {
    if (timers.current[field]) { clearTimeout(timers.current[field]); delete timers.current[field]; }
    inFlight.current += 1;
    setSaveState('busy');
    chain.current = chain.current.then(async () => {
      const sent = getField(valuesRef.current, field);
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const { question: q } = await saveQuestionBankEntry(level, qid, version.current, patchOf(field, sent));
          version.current = q.version;
          onLive(qid, q.live);
          if (getField(valuesRef.current, field) === sent) dirty.current.delete(field);
          setSaveState('ok');
          return;
        } catch (e) {
          if (e.status === 409 && e.current && attempt === 0) {
            // Someone saved this question meanwhile: take theirs in the other fields, send ours again.
            version.current = e.current.version;
            setValues((cur) => mergeIncoming(cur, e.current, dirty.current, focused.current, layout));
            continue;
          }
          setSaveState('err');
          onError(tFunc('admin.dashboard.questionBank.saveFailed')(question.position, e.message));
          return;
        }
      }
    }).finally(() => { inFlight.current -= 1; });
  }, [level, qid, question.position, layout, onLive, onError, tFunc]);

  const handleChange = useCallback((field, value) => {
    setValues((cur) => setField(cur, field, value));
    dirty.current.add(field);
    clearTimeout(timers.current[field]);
    timers.current[field] = setTimeout(() => { delete timers.current[field]; save(field); }, SAVE_DELAY);
  }, [save]);
  const handleFocus = useCallback((field) => { focused.current = field; }, []);
  const handleBlur = useCallback((field) => {
    if (focused.current === field) focused.current = null;
    if (timers.current[field]) save(field); // typed but not yet sent: send now
  }, [save]);

  const count = layout.filter((g) => filled(values.l1[g.group])).length
    + layout.reduce((n, g) => n + g.archetypes.filter((a) => filled(values.l2[a.name])).length, 0);
  const stateText = { busy: t('admin.dashboard.questionBank.saving'), ok: t('admin.dashboard.questionBank.saved'), err: t('admin.dashboard.questionBank.notSaved') }[saveState] || '';
  const field = (f) => ({ field: f, value: getField(values, f), onChange: handleChange, onFocus: handleFocus, onBlur: handleBlur });

  return (
    <article className="qb-card" id={`qb-${qid}`}>
      <div className="qb-top">
        <div className="qb-head">
          <span className="qb-num">Q{question.position}</span>
          <span className="qb-id">{subjectLabel} · {qid}</span>
          <span className="qb-count">{count} / 18</span>
          <span className="qb-state" data-s={saveState} aria-live="polite">
            {!live && <span className="qb-notlive">{t('admin.dashboard.questionBank.notLive')}</span>}
            {stateText}
          </span>
        </div>
        <AutoText
          {...field('text')}
          className="qb-field qb-question"
          placeholder={t('admin.dashboard.questionBank.questionPlaceholder')}
          aria-label={`Q${question.position}`}
        />
      </div>
      <div className="qb-layers">
        <div>{t('admin.dashboard.questionBank.layer1')}</div>
        <div>{t('admin.dashboard.questionBank.layer2')}</div>
      </div>
      <div>
        {layout.map((g) => (
          <section className="qb-row" key={g.group} aria-label={g.group}>
            <div className="qb-gcell">
              <div className="qb-ghead">
                <span className="qb-gname">{g.group}</span>
                <span className="qb-gnet">{NETWORK[g.group]} · {g.archetypes.map((a) => WHEEL[a.name]).join(' / ')}</span>
              </div>
              <AutoText
                {...field(`l1.${g.group}`)}
                stretch
                className="qb-field qb-l1"
                placeholder={tFunc('admin.dashboard.questionBank.l1Placeholder')(g.group)}
                aria-label={`Q${question.position} · ${g.group}`}
              />
            </div>
            <div className="qb-fork" aria-hidden="true" />
            <div className="qb-acells">
              {g.archetypes.map((a) => (
                <div className="qb-acell" key={a.name}>
                  <label className="qb-aname" htmlFor={`qb-${qid}-${a.name}`}>{a.name} <i>{WHEEL[a.name]}</i></label>
                  <AutoText
                    {...field(`l2.${a.name}`)}
                    id={`qb-${qid}-${a.name}`}
                    className="qb-field"
                    placeholder={tFunc('admin.dashboard.questionBank.l2Placeholder')(a.name)}
                  />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
      <div className="qb-refusal">{t('admin.dashboard.questionBank.refusal')}</div>
    </article>
  );
});

const LEVEL_LABELS = { leerling: 'Leerling', gevorderd: 'Gevorderd', beginner: 'Beginner' };

export default function QuestionBankEditor({ level = 'leerling' }) {
  const { t, tFunc, language } = useLanguage();
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [counts, setCounts] = useState({});
  const [live, setLive] = useState({});
  const [banner, setBanner] = useState(null); // { kind: 'info' | 'err', text, list? }
  const [publishing, setPublishing] = useState(false);
  const [copyText, setCopyText] = useState('');
  const [epoch, setEpoch] = useState(0);
  const [indexH, setIndexH] = useState(0);
  const cards = useRef(new Map());
  const indexRef = useRef(null);

  const take = useCallback((d) => {
    setData(d);
    setLive(Object.fromEntries(d.questions.map((q) => [q.question_id, q.live])));
  }, []);
  const load = useCallback(() => getQuestionBank(level).then(take), [level, take]);

  useEffect(() => { load().catch((e) => setLoadError(e.message)); }, [load]);

  // Back in this window: pick up what another tab saved (fields being typed in keep their text).
  useEffect(() => {
    const onFocus = () => { load().catch(() => {}); };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [load]);

  // Boxes re-fit when the window width changes.
  useEffect(() => {
    let timer;
    const onResize = () => { clearTimeout(timer); timer = setTimeout(() => setEpoch((n) => n + 1), 150); };
    window.addEventListener('resize', onResize);
    return () => { clearTimeout(timer); window.removeEventListener('resize', onResize); };
  }, []);

  // The card headers pin under the index, whatever its height.
  useEffect(() => {
    const el = indexRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => setIndexH(Math.round(el.getBoundingClientRect().height)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [data]);

  const anyPending = () => [...cards.current.values()].some((c) => c.pending());

  useEffect(() => {
    const onLeave = (e) => { if (anyPending()) { e.preventDefault(); e.returnValue = t('admin.dashboard.questionBank.unsavedLeave'); } };
    window.addEventListener('beforeunload', onLeave);
    return () => window.removeEventListener('beforeunload', onLeave);
  }, [t]);

  const register = useCallback((qid, api) => {
    cards.current.set(qid, api);
    return () => cards.current.delete(qid);
  }, []);
  const onCount = useCallback((qid, c) => {
    setCounts((prev) => {
      const p = prev[qid];
      return p && p.text === c.text && p.l1 === c.l1 && p.l2 === c.l2 ? prev : { ...prev, [qid]: c };
    });
  }, []);
  const onLive = useCallback((qid, isLive) => setLive((prev) => (prev[qid] === isLive ? prev : { ...prev, [qid]: isLive })), []);
  const onError = useCallback((text) => setBanner({ kind: 'err', text }), []);

  const layout = useMemo(() => (data ? data.groups.map((group) => ({
    group,
    archetypes: data.archetypes.filter((a) => a.group === group),
  })) : []), [data]);

  const bySubject = useMemo(() => (data ? SUBJECTS.map((s) => ({
    ...s,
    questions: data.questions.filter((q) => q.subject === s.key),
  })).filter((s) => s.questions.length) : []), [data]);

  if (loadError) return <div className="qb-banner" data-kind="err">{loadError}</div>;
  if (!data) return <div style={CHROME('max(9px, 0.45vw)')}>…</div>;

  const totals = Object.values(counts).reduce((a, c) => ({ l1: a.l1 + c.l1, l2: a.l2 + c.l2 }), { l1: 0, l2: 0 });
  const nQ = data.questions.length;
  const complete = data.questions.filter((q) => { const c = counts[q.question_id]; return c && c.text && c.l1 === 6 && c.l2 === 12; }).length;
  const unpublished = data.questions.filter((q) => live[q.question_id] === false).length;
  const fmtDate = (d) => new Date(d).toLocaleString(language === 'en' ? 'en-GB' : 'nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const serving = data.serving && data.serving.kind === 'published'
    ? tFunc('admin.dashboard.questionBank.servingPublished')(data.serving.revision, fmtDate(data.serving.publishedAt))
    : t('admin.dashboard.questionBank.servingFile');

  const handlePublish = async () => {
    if (anyPending()) { setBanner({ kind: 'info', text: t('admin.dashboard.questionBank.waitForSaves') }); return; }
    if (!window.confirm(tFunc('admin.dashboard.questionBank.confirmPublish')(unpublished))) return;
    setPublishing(true);
    setBanner(null);
    try {
      const r = await publishQuestionBank(level);
      setBanner({ kind: 'info', text: tFunc('admin.dashboard.questionBank.published')(r.revision, Boolean(r.file && r.file.published)) });
      await load();
    } catch (e) {
      if (e.problems) {
        const shown = e.problems.slice(0, 12);
        const more = e.problems.length - shown.length;
        setBanner({ kind: 'err', text: t('admin.dashboard.questionBank.publishBlocked'), list: more > 0 ? [...shown, tFunc('admin.dashboard.questionBank.andMore')(more)] : shown });
      } else setBanner({ kind: 'err', text: e.message });
    } finally {
      setPublishing(false);
    }
  };

  const handleCopy = async () => {
    const bank = {
      level,
      l1_refusal_label: REFUSAL_LABEL,
      questions: data.questions.map((q) => {
        const v = cards.current.get(q.question_id)?.body() || valuesOf(q);
        return {
          question_id: q.question_id, level, subject: q.subject, position: q.position, text: v.text,
          l1_answers: layout.map((g) => ({ group: g.group, text: v.l1[g.group] || '' })),
          l2_answers: layout.flatMap((g) => g.archetypes.map((a) => ({ archetype: a.name, group: g.group, text: v.l2[a.name] || '' }))),
        };
      }),
    };
    const json = JSON.stringify(bank, null, 1);
    try {
      await navigator.clipboard.writeText(json);
      setCopyText('');
      setBanner({ kind: 'info', text: t('admin.dashboard.questionBank.copied') });
    } catch {
      setCopyText(json);
      setBanner({ kind: 'info', text: t('admin.dashboard.questionBank.copyFallback') });
    }
  };

  return (
    <FitCtx.Provider value={epoch}>
      <style>{STYLES}</style>
      <div className="qb" style={{ '--qb-index-h': `${indexH}px` }}>
        <header style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <div style={{ ...CHROME('max(11px, 0.6vw)', C.gold), fontWeight: 'bold', letterSpacing: '0.16em' }}>
            {tFunc('admin.dashboard.questionBank.title')(LEVEL_LABELS[level] || level)}
          </div>
          <p style={{ margin: 0, maxWidth: '72ch', fontSize: 'max(12px, 0.65vw)', lineHeight: 1.5, color: 'rgba(255, 254, 240, 0.6)' }}>
            {t('admin.dashboard.questionBank.lede')}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.6rem 0.9rem' }}>
            <SciFiButton onClick={handlePublish} disabled={publishing || unpublished === 0}>
              {publishing ? t('admin.dashboard.questionBank.publishing') : t('admin.dashboard.questionBank.publish')}
            </SciFiButton>
            <SciFiButton onClick={handleCopy} variant="white">{t('admin.dashboard.questionBank.copyJson')}</SciFiButton>
            <span style={CHROME('max(8px, 0.4vw)')}>{serving}</span>
          </div>
          {banner && (
            <div className="qb-banner" data-kind={banner.kind}>
              {banner.text}
              {banner.list && <ul>{banner.list.map((x) => <li key={x}>{x}</li>)}</ul>}
            </div>
          )}
          {copyText && <textarea className="qb-copybox" readOnly value={copyText} onFocus={(e) => e.target.select()} autoFocus />}
        </header>

        <nav className="qb-index" ref={indexRef} aria-label={t('admin.dashboard.tabs.questions')}>
          <div className="qb-progress">
            <span><b>{totals.l1 + totals.l2}</b> / {nQ * 18} {t('admin.dashboard.questionBank.answers')}</span>
            <span>{t('admin.dashboard.questionBank.layer1Count')} <b>{totals.l1}</b> / {nQ * 6}</span>
            <span>{t('admin.dashboard.questionBank.layer2Count')} <b>{totals.l2}</b> / {nQ * 12}</span>
            <span><b>{complete}</b> / {nQ} {t('admin.dashboard.questionBank.complete')}</span>
            {unpublished > 0 && <span className="qb-unpub"><b>{unpublished}</b> {tFunc('admin.dashboard.questionBank.unpublished')(unpublished)}</span>}
          </div>
          <div className="qb-chips">
            {bySubject.map((s) => (
              <div className="qb-chipgroup" key={s.key}>
                <span>{s.label.split(' / ')[0]}</span>
                {s.questions.map((q) => {
                  const c = counts[q.question_id];
                  const n = c ? c.l1 + c.l2 : 0;
                  return (
                    <button
                      type="button"
                      key={q.question_id}
                      className="qb-chip"
                      data-state={n === 0 ? 'empty' : n === 18 && c.text ? 'full' : 'partial'}
                      onClick={() => document.getElementById(`qb-${q.question_id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                      aria-label={`Q${q.position}`}
                    >
                      {q.position}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </nav>

        {bySubject.map((s) => (
          <React.Fragment key={s.key}>
            <div className="qb-subject">
              <h3>{s.label}</h3>
              <span>{tFunc('admin.dashboard.questionBank.subjectRange')(s.questions[0].position, s.questions[s.questions.length - 1].position, s.questions.length)}</span>
            </div>
            {s.questions.map((q) => (
              <QuestionCard
                key={q.question_id}
                level={level}
                question={q}
                subjectLabel={s.label}
                layout={layout}
                live={live[q.question_id] !== false}
                onCount={onCount}
                onLive={onLive}
                onError={onError}
                register={register}
              />
            ))}
          </React.Fragment>
        ))}
      </div>
    </FitCtx.Provider>
  );
}
