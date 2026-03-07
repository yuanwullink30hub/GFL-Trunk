import React, { memo, useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { getHistory, getAssessment, downloadPdf } from '../../utils/apiClient';
import { BTN, TAB_STYLE, ERROR_STYLE, hover, C, FONT } from './dashboardStyles';
import { getArchetypeImage } from '../../data/assessment/archetypeImages';

// ═══════════════════════════════════════════════════════════
// DashboardCard — same as AdminDashboardModal (no corner accents)
// ═══════════════════════════════════════════════════════════
const CARD_COLORS = {
  gold: {
    border: 'rgba(255, 174, 0, 0.25)',
    shadow: '0 0 15px rgba(255, 174, 0, 0.05), inset 0 0 30px rgba(255, 174, 0, 0.02)',
    titleColor: '#ffae00',
    dimText: 'rgba(255, 174, 0, 0.45)',
    rowBorder: 'rgba(255, 174, 0, 0.1)',
    cardBg: 'rgba(255, 174, 0, 0.04)',
    iconBg: 'rgba(255, 174, 0, 0.08)',
  },
  purple: {
    border: 'rgba(188, 19, 254, 0.25)',
    shadow: '0 0 15px rgba(188, 19, 254, 0.05), inset 0 0 30px rgba(188, 19, 254, 0.02)',
    titleColor: '#bc13fe',
    dimText: 'rgba(188, 19, 254, 0.45)',
    rowBorder: 'rgba(188, 19, 254, 0.1)',
    cardBg: 'rgba(188, 19, 254, 0.04)',
    iconBg: 'rgba(188, 19, 254, 0.08)',
  },
};

function DashboardCard({ children, title, color = 'gold', style = {} }) {
  const t = CARD_COLORS[color] || CARD_COLORS.gold;
  return (
    <div style={{
      position: 'relative',
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      border: `1px solid ${t.border}`,
      boxShadow: t.shadow,
      borderRadius: '0.5rem',
      padding: '1.25rem',
      fontFamily: FONT,
      color: C.text,
      fontSize: 'max(12px, 0.65vw)',
      ...style,
    }}>
      {title && (
        <div style={{
          position: 'absolute', top: '-0.6rem', left: '1.25rem',
          padding: '0 0.5rem',
          backgroundColor: '#0a0510',
          color: t.titleColor, fontSize: 'max(9px, 0.45vw)',
          fontWeight: 'bold', textTransform: 'uppercase',
          letterSpacing: '0.15em', fontFamily: FONT,
          border: `1px solid ${t.border}`,
        }}>
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════
const Loading = () => (
  <div style={{ textAlign: 'center', padding: '3rem 0', color: C.gold, fontFamily: FONT, fontSize: 'max(12px, 0.6vw)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
    Laden...
  </div>
);
const ErrorBox = ({ msg }) => (
  <div style={ERROR_STYLE}>⚠ {msg}</div>
);

const CORNER = (pos) => ({
  position: 'absolute',
  width: '1rem', height: '1rem',
  border: '1.5px solid #ffae00',
  pointerEvents: 'none', zIndex: 3,
  ...(pos === 'tl' && { top: '-0.125rem', left: '-0.125rem', borderRadius: '10px 0 0 0', borderBottom: 'none', borderRight: 'none' }),
  ...(pos === 'tr' && { top: '-0.125rem', right: '-0.125rem', borderRadius: '0 10px 0 0', borderBottom: 'none', borderLeft: 'none' }),
  ...(pos === 'bl' && { bottom: '-0.125rem', left: '-0.125rem', borderRadius: '0 0 0 10px', borderTop: 'none', borderRight: 'none' }),
  ...(pos === 'br' && { bottom: '-0.125rem', right: '-0.125rem', borderRadius: '0 0 10px 0', borderTop: 'none', borderLeft: 'none' }),
});

/**
 * Client Profile Modal — same layout as AdminDashboardModal,
 * but without admin rights (no user management, question editing, prompt config).
 * Tabs: overview, assessments
 */
const ClientProfileModal = memo(({ user, onLogout, onClose }) => {
  useLanguage();
  const [tab, setTab] = useState('overview');

  return (
    /* Outer shell — fixed size */
    <div style={{ position: 'relative', width: '90vw', maxWidth: '1280px', height: '85vh' }}>
      <div style={CORNER('tl')} />
      <div style={CORNER('tr')} />
      <div style={CORNER('bl')} />
      <div style={CORNER('br')} />

      {/* Inner panel */}
      <div style={{
        position: 'relative',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'rgba(2, 0, 3, 0.12)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        borderRadius: '0.5rem',
        overflow: 'hidden',
        boxShadow: '0 6px 30px rgba(0,0,0,0.7), 0 0 80px rgba(0,0,0,0.35)',
        color: C.text,
        fontFamily: FONT,
        fontSize: 'max(12px, 0.65vw)',
      }}>
        {/* Decorative overlays removed for performance */}

        {/* Title bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.55rem 1rem',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          backgroundColor: 'rgba(42, 10, 56, 0.35)',
          position: 'relative', zIndex: 2,
        }}>
          <span style={{
            fontFamily: FONT, fontSize: 'max(10px, 0.55vw)',
            textTransform: 'uppercase', letterSpacing: '0.2em',
            fontWeight: 'bold', color: C.gold,
          }}>Profiel Dashboard</span>
          <div style={{ display: 'flex', gap: 3 }}>
            <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: C.gold }} />
            <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: C.purple }} />
            <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)' }} />
          </div>
        </div>

        {/* Scrollable content area */}
        <div style={{
          position: 'relative', zIndex: 10,
          padding: '1.5rem',
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}>
          {/* ── Header ── */}
          <header style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderBottom: '1px solid rgba(255, 174, 0, 0.15)',
            paddingBottom: '1.2rem',
          }}>
            <div>
              <h1 style={{
                fontSize: 'max(22px, 1.4vw)', fontWeight: 'bold',
                color: C.gold, textTransform: 'uppercase',
                letterSpacing: '0.2em', fontFamily: FONT, margin: 0,
                textShadow: '0 0 5px #ffae00, 0 0 10px #ffae00',
              }}>
                Profiel Dashboard
              </h1>
              <p style={{
                color: 'rgba(255, 174, 0, 0.35)', fontSize: 'max(10px, 0.55vw)',
                marginTop: '0.25rem', fontFamily: FONT,
              }}>
                GEBRUIKER: {user.displayName} {'·'} ROL: {(user.role || 'client').toUpperCase()} {'·'} {user.email}
              </p>
            </div>
          </header>

          {/* ── Tab Navigation (client-level only) ── */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {[
              { key: 'overview', label: 'Overzicht' },
              { key: 'assessments', label: 'Assessments' },
              { key: 'feedback', label: 'Feedback' },
              { key: 'inbox', label: 'Inbox' },
              { key: 'contacten', label: 'Contacten' },
              { key: 'agenda', label: 'Agenda' },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setTab(key)} style={TAB_STYLE(tab === key)}
                onMouseEnter={(e) => { if (tab !== key) e.target.style.background = 'rgba(255, 174, 0, 0.15)'; }}
                onMouseLeave={(e) => { if (tab !== key) e.target.style.background = TAB_STYLE(false).background; }}>
                {label}
              </button>
            ))}
          </div>

          {/* ── Tab Content ── */}
          {tab === 'overview' && <ClientOverviewTab user={user} />}
          {tab === 'assessments' && <ClientAssessmentsTab />}
          {tab === 'feedback' && <ClientFeedbackTab user={user} />}
          {tab === 'inbox' && <InboxTab />}
          {tab === 'contacten' && <ContactenTab />}
          {tab === 'agenda' && <AgendaTab />}
        </div>

        {/* Footer — return + logout */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          backgroundColor: 'rgba(42, 10, 56, 0.35)',
          position: 'relative', zIndex: 2,
        }}>
          <button onClick={onClose} style={{
            ...BTN, width: 'auto', padding: '0.35rem 1rem',
            fontSize: 'max(9px, 0.48vw)',
          }}
            onMouseEnter={(e) => hover(e, true)}
            onMouseLeave={(e) => hover(e, false)}>
            ← Terug
          </button>
          <button onClick={onLogout} style={{
            ...BTN, width: 'auto', padding: '0.35rem 1rem',
            fontSize: 'max(9px, 0.48vw)',
            borderColor: 'rgba(239, 68, 68, 0.5)', color: '#fca5a5',
          }}
            onMouseEnter={(e) => { e.target.style.background = 'rgba(239, 68, 68, 0.2)'; }}
            onMouseLeave={(e) => { e.target.style.background = BTN.background; e.target.style.color = '#fca5a5'; }}>
            Uitloggen
          </button>
        </div>
      </div>
    </div>
  );
});

ClientProfileModal.displayName = 'ClientProfileModal';
export default ClientProfileModal;


// ═══════════════════════════════════════════════════════════
// Client Overview Tab — full-width profile, 2-col row, 4-stat footer
// ═══════════════════════════════════════════════════════════
const ClientOverviewTab = memo(({ user }) => {
  const [history, setHistory] = useState(null);
  const [error, setError] = useState('');

  /* Personal Notes (persisted to localStorage) */
  const NOTES_KEY = 'gfl_client_notes';
  const [notes, setNotes] = useState(() => {
    try { const raw = localStorage.getItem(NOTES_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
  });
  const [noteInput, setNoteInput] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);

  const addNote = () => {
    if (!noteInput.trim()) return;
    const updated = [{ id: Date.now(), text: noteInput.trim(), ts: new Date().toISOString() }, ...notes].slice(0, 50);
    setNotes(updated);
    localStorage.setItem(NOTES_KEY, JSON.stringify(updated));
    setNoteInput('');
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 1500);
  };
  const removeNote = (id) => {
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    localStorage.setItem(NOTES_KEY, JSON.stringify(updated));
  };

  useEffect(() => {
    getHistory({ limit: 10 })
      .then((d) => setHistory(d.assessments || []))
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <ErrorBox msg={error} />;
  if (!history) return <Loading />;

  const tc = CARD_COLORS.gold;
  const pc = CARD_COLORS.purple;

  /* Derive stats from history */
  const totalAssessments = history.length;
  const latestArchetype = history.length > 0 ? (history[0].extendedArchetypeName || history[0].archetypeKey || '—') : '—';
  const avgHarmony = history.length > 0
    ? Math.round(history.reduce((sum, a) => sum + (a.harmonyScore || 0), 0) / history.length)
    : 0;

  /* Resolve archetype portrait from latest assessment */
  const latest = history.length > 0 ? history[0] : null;
  const archetypeImg = latest ? getArchetypeImage(latest.archetypeKey, latest.supportGroup) : null;

  return (
    <>
      {/* ── Row 1: Full-width Profile Card ── */}
      <DashboardCard title="Identiteitsmatrix" color="gold">
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
          {/* Archetype portrait */}
          <div style={{
            flexShrink: 0,
            width: 'max(100px, 7vw)', height: 'max(100px, 7vw)',
            borderRadius: '0.5rem',
            overflow: 'hidden',
            border: `1px solid ${tc.border}`,
            backgroundColor: tc.iconBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(255, 174, 0, 0.15)',
          }}>
            {archetypeImg ? (
              <img
                src={archetypeImg}
                alt={latestArchetype}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span style={{ fontSize: 'max(36px, 2.5vw)', opacity: 0.4 }}>👤</span>
            )}
          </div>

          {/* Profile info */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <div>
                <div style={{ fontSize: 'max(16px, 0.85vw)', fontWeight: 'bold', color: C.gold, fontFamily: FONT }}>
                  {user.displayName || '—'}
                </div>
                <div style={{ fontSize: 'max(9px, 0.45vw)', color: tc.dimText, textTransform: 'uppercase', marginTop: '0.15rem' }}>
                  {latestArchetype !== '—' ? latestArchetype : 'Geen archetype'}
                </div>
              </div>
              <div style={{
                marginLeft: 'auto',
                padding: '0.2rem 0.6rem', borderRadius: '0.2rem',
                backgroundColor: 'rgba(74, 222, 128, 0.1)', border: '1px solid rgba(74, 222, 128, 0.25)',
                color: '#4ade80', fontSize: 'max(9px, 0.45vw)', fontWeight: 'bold',
                textTransform: 'uppercase', letterSpacing: '0.1em',
              }}>
                ACTIEF
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem 1.5rem', marginTop: '0.3rem' }}>
              {[
                ['Gebruiker', user.displayName || '—'],
                ['E-mail', user.email],
                ['Toegangsniveau', (user.role || 'client').toUpperCase()],
                ['Assessments', String(totalAssessments)],
                ['Archetype', latestArchetype],
                ['Harmonie', avgHarmony > 0 ? `${avgHarmony}%` : '—'],
              ].map(([label, value]) => (
                <div key={label} style={{
                  display: 'flex', justifyContent: 'space-between',
                  borderBottom: `1px solid ${tc.rowBorder}`, paddingBottom: '0.35rem',
                }}>
                  <span style={{ color: tc.dimText, fontSize: 'max(9px, 0.45vw)', textTransform: 'uppercase' }}>{label}</span>
                  <span style={{ fontSize: 'max(10px, 0.5vw)', fontFamily: FONT }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardCard>

      {/* ── Row 2: Two-column grid (notes + recent assessments) ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem',
      }}>
        {/* Card 2: Persoonlijke Notities (purple) */}
        <DashboardCard title="Persoonlijke Notities" color="purple">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <input
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addNote(); }}
                placeholder="Notitie toevoegen..."
                style={{
                  flex: 1, padding: '0.4rem 0.6rem',
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  border: `1px solid ${pc.rowBorder}`,
                  borderRadius: '0.25rem',
                  color: C.text, fontFamily: FONT,
                  fontSize: 'max(9px, 0.45vw)',
                  outline: 'none',
                }}
                onFocus={(e) => { e.target.style.borderColor = C.purple; }}
                onBlur={(e) => { e.target.style.borderColor = pc.rowBorder; }}
              />
              <button onClick={addNote} style={{
                ...BTN, borderColor: C.purple, color: C.purple,
                fontSize: 'max(9px, 0.45vw)', padding: '0.35rem 0.6rem',
              }}
                onMouseEnter={(e) => { e.target.style.background = 'rgba(188, 19, 254, 0.2)'; }}
                onMouseLeave={(e) => { e.target.style.background = BTN.background; }}>
                +
              </button>
            </div>
            {notesSaved && (
              <div style={{ fontSize: 'max(8px, 0.4vw)', color: '#4ade80', textTransform: 'uppercase' }}>
                ✓ Opgeslagen
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '220px', overflowY: 'auto' }}>
              {notes.length > 0 ? notes.map((n) => (
                <div key={n.id} style={{
                  padding: '0.4rem 0.6rem',
                  backgroundColor: pc.cardBg,
                  border: `1px solid ${pc.rowBorder}`,
                  borderRadius: '0.25rem',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.4rem',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 'max(10px, 0.5vw)', wordBreak: 'break-word' }}>{n.text}</div>
                    <div style={{ fontSize: 'max(7px, 0.35vw)', color: pc.dimText, marginTop: '0.2rem' }}>
                      {new Date(n.ts).toLocaleString('nl-NL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <button onClick={() => removeNote(n.id)} style={{
                    background: 'none', border: 'none', color: 'rgba(239,68,68,0.5)',
                    cursor: 'pointer', fontSize: 'max(10px, 0.5vw)', padding: '0 0.2rem', flexShrink: 0,
                  }}
                    onMouseEnter={(e) => { e.target.style.color = '#ef4444'; }}
                    onMouseLeave={(e) => { e.target.style.color = 'rgba(239,68,68,0.5)'; }}>
                    ✕
                  </button>
                </div>
              )) : (
                <div style={{ textAlign: 'center', color: pc.dimText, padding: '1.5rem 0', textTransform: 'uppercase', fontSize: 'max(9px, 0.45vw)' }}>
                  Geen notities
                </div>
              )}
            </div>
          </div>
        </DashboardCard>

        {/* Card 3: Recente Assessments (gold) */}
        <DashboardCard title="Recente Assessments" color="gold">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
            {history.length > 0 ? history.slice(0, 8).map((a) => (
              <div key={a._id} style={{
                padding: '0.5rem 0.6rem',
                backgroundColor: tc.cardBg,
                borderLeft: `2px solid ${tc.border}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 'bold', fontSize: 'max(10px, 0.5vw)' }}>
                    {a.extendedArchetypeName || a.archetypeKey}
                  </span>
                  <span style={{
                    fontSize: 'max(8px, 0.4vw)', padding: '0.1rem 0.3rem', borderRadius: '0.15rem',
                    backgroundColor: 'rgba(255, 174, 0, 0.08)', textTransform: 'uppercase',
                  }}>
                    {a.supportGroup || '—'}
                  </span>
                </div>
                <div style={{
                  width: '100%', height: '4px', backgroundColor: 'rgba(255, 174, 0, 0.1)',
                  borderRadius: '2px', overflow: 'hidden', marginTop: '0.3rem', marginBottom: '0.3rem',
                }}>
                  <div style={{
                    height: '100%', borderRadius: '2px',
                    width: `${a.harmonyScore || 50}%`,
                    backgroundColor: C.gold,
                    boxShadow: '0 0 10px rgba(255, 174, 0, 0.6)',
                  }} />
                </div>
                <div style={{ fontSize: 'max(8px, 0.42vw)', color: tc.dimText }}>
                  {new Date(a.createdAt).toLocaleDateString('nl-NL')}
                </div>
              </div>
            )) : (
              <div style={{ textAlign: 'center', color: tc.dimText, padding: '1.5rem 0', textTransform: 'uppercase', fontSize: 'max(9px, 0.45vw)' }}>
                Geen assessments gevonden
              </div>
            )}
          </div>
        </DashboardCard>
      </div>

      {/* ── Row 3: 4-Column Stats Footer ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.8rem',
      }}>
        {[
          { label: 'Assessments', value: totalAssessments },
          { label: 'Laatste Archetype', value: latestArchetype, small: true },
          { label: 'Gem. Harmonie', value: `${avgHarmony}%` },
          { label: 'Account', value: 'ACTIEF', color: '#4ade80' },
        ].map((stat, i) => (
          <DashboardCard key={i} color="gold" style={{ padding: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 'max(8px, 0.4vw)', color: CARD_COLORS.gold.dimText, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{stat.label}</div>
              <div style={{
                fontSize: stat.small ? 'max(12px, 0.65vw)' : 'max(18px, 1vw)',
                fontWeight: 'bold', fontFamily: FONT,
                color: stat.color || C.text,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{stat.value}</div>
            </div>
          </DashboardCard>
        ))}
      </div>
    </>
  );
});


// ═══════════════════════════════════════════════════════════
// Client Assessments Tab — history list with detail view + PDF
// ═══════════════════════════════════════════════════════════
const ClientAssessmentsTab = memo(() => {
  const [history, setHistory] = useState(null);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    getHistory({ limit: 30 })
      .then((d) => setHistory(d.assessments || []))
      .catch((e) => setError(e.message));
  }, []);

  const viewDetail = useCallback(async (id) => {
    setLoadingDetail(true);
    setError('');
    try {
      const d = await getAssessment(id);
      setDetail(d);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const tc = CARD_COLORS.gold;

  if (error) return <ErrorBox msg={error} />;
  if (!history) return <Loading />;

  /* ── Detail view ── */
  if (detail) {
    const d = detail;
    return (
      <DashboardCard title="Assessment Detail" color="gold">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 'max(14px, 0.75vw)', fontWeight: 'bold' }}>
              {d.extendedArchetypeName || d.archetypeKey}
            </div>
            <button onClick={() => setDetail(null)} style={BTN}
              onMouseEnter={(e) => hover(e, true)} onMouseLeave={(e) => hover(e, false)}>
              ← Terug
            </button>
          </div>

          {/* Summary */}
          <div style={{ fontSize: 'max(10px, 0.5vw)', opacity: 0.5, lineHeight: 1.6 }}>
            <div>Archetype: {d.archetypeKey} · Support Group: {d.supportGroup || '—'}</div>
            {d.harmonyScore != null && <div>Harmony Score: {d.harmonyScore}%</div>}
            {d.consciousnessLevel && <div>Bewustzijnsniveau: {d.consciousnessLevel}</div>}
            {d.overallShadow && <div>Schaduw: {d.overallShadow}</div>}
            <div>Datum: {new Date(d.createdAt).toLocaleString('nl-NL')}</div>
          </div>

          {/* OCEAN Scores */}
          {d.oceanScores && (
            <div>
              <div style={{ fontSize: 'max(10px, 0.5vw)', fontWeight: 'bold', opacity: 0.6, marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                OCEAN Scores
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {Object.entries(d.oceanScores).map(([key, val]) => (
                  <span key={key} style={{
                    padding: '0.2rem 0.5rem', borderRadius: '0.2rem', fontSize: 'max(10px, 0.5vw)',
                    backgroundColor: 'rgba(255, 174, 0, 0.08)', border: '1px solid rgba(255, 174, 0, 0.12)',
                  }}>
                    {key}: {val}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Layer results */}
          {d.subjectResults && d.subjectResults.length > 0 && (
            <div>
              <div style={{ fontSize: 'max(10px, 0.5vw)', fontWeight: 'bold', opacity: 0.6, marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                Laag Resultaten
              </div>
              {d.subjectResults.map((sr) => (
                <div key={sr.subjectId || sr.subjectName} style={{
                  padding: '0.4rem 0.5rem', marginBottom: '0.2rem',
                  border: `1px solid ${tc.rowBorder}`,
                  borderRadius: '0.2rem', fontSize: 'max(10px, 0.5vw)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span style={{ fontWeight: 'bold' }}>{sr.subjectName}</span>
                    <span style={{ opacity: 0.5 }}>{sr.percentage}% · {sr.dominantArchetype}</span>
                  </div>
                  <div style={{
                    height: '4px', borderRadius: '2px',
                    backgroundColor: 'rgba(255, 174, 0, 0.1)',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%', borderRadius: '2px',
                      width: `${sr.percentage}%`,
                      backgroundColor: C.gold,
                      boxShadow: '0 0 10px rgba(255, 174, 0, 0.6)',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* AI Analysis */}
          {d.analysis && (
            <div>
              <div style={{ fontSize: 'max(10px, 0.5vw)', fontWeight: 'bold', opacity: 0.6, marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                AI Analyse
              </div>
              <div style={{
                padding: '0.5rem', borderRadius: '0.2rem',
                border: `1px solid ${tc.rowBorder}`,
                fontSize: 'max(10px, 0.5vw)', opacity: 0.7,
                whiteSpace: 'pre-wrap', maxHeight: '150px', overflowY: 'auto',
              }}>
                {d.analysis}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '0.3rem' }}>
            <button onClick={() => downloadPdf(d._id).catch((e) => setError(e.message))} style={BTN}
              onMouseEnter={(e) => hover(e, true)} onMouseLeave={(e) => hover(e, false)}>
              PDF ↓
            </button>
            <button onClick={() => setDetail(null)} style={BTN}
              onMouseEnter={(e) => hover(e, true)} onMouseLeave={(e) => hover(e, false)}>
              Terug
            </button>
          </div>
        </div>
      </DashboardCard>
    );
  }

  /* ── History list ── */
  return (
    <DashboardCard title="Assessment Geschiedenis" color="gold">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {history.length === 0 ? (
          <div style={{ textAlign: 'center', color: tc.dimText, padding: '2rem 0', textTransform: 'uppercase', fontSize: 'max(9px, 0.45vw)' }}>
            Geen assessments gevonden
          </div>
        ) : (
          history.map((a) => (
            <div key={a._id} style={{
              padding: '0.5rem 0.6rem',
              border: `1px solid ${tc.rowBorder}`,
              borderRadius: '0.25rem', fontSize: 'max(10px, 0.5vw)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              transition: 'background-color 0.2s',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = tc.cardBg; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <div>
                <div style={{ fontWeight: 'bold' }}>{a.extendedArchetypeName || a.archetypeKey}</div>
                <div style={{ opacity: 0.4, fontSize: 'max(8px, 0.42vw)', marginTop: '0.1rem' }}>
                  {a.aiProvider && `${a.aiProvider} · `}{new Date(a.createdAt).toLocaleDateString('nl-NL')}
                  {a.harmonyScore != null && ` · ${a.harmonyScore}%`}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                <button
                  onClick={() => viewDetail(a._id)}
                  disabled={loadingDetail}
                  style={{ ...BTN, padding: '0.3rem 0.6rem', fontSize: 'max(9px, 0.4vw)' }}
                  onMouseEnter={(e) => hover(e, true)} onMouseLeave={(e) => hover(e, false)}>
                  DETAIL
                </button>
                <button
                  onClick={() => downloadPdf(a._id).catch((e) => setError(e.message))}
                  style={{ ...BTN, padding: '0.3rem 0.6rem', fontSize: 'max(9px, 0.4vw)' }}
                  onMouseEnter={(e) => hover(e, true)} onMouseLeave={(e) => hover(e, false)}>
                  PDF ↓
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardCard>
  );
});


// ═══════════════════════════════════════════════════════════
// Client Feedback Tab — inquiry form + reviews/feedback view
// ═══════════════════════════════════════════════════════════
const CLIENT_FEEDBACK_KEY = 'gfl_admin_feedback'; // writes to same store admin reads
const ClientFeedbackTab = memo(({ user }) => {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem(CLIENT_FEEDBACK_KEY) || '[]'); } catch { return []; }
  });
  const [form, setForm] = useState({ bericht: '', type: 'feedback' });
  const [saved, setSaved] = useState(false);

  const tc = CARD_COLORS.gold;
  const pc = CARD_COLORS.purple;

  const submit = () => {
    if (!form.bericht.trim()) return;
    const entry = {
      id: Date.now(),
      naam: user.displayName || 'Client',
      email: user.email || '—',
      bericht: form.bericht.trim(),
      type: form.type,
      ts: new Date().toISOString(),
      status: 'nieuw',
    };
    const updated = [entry, ...items].slice(0, 200);
    setItems(updated);
    localStorage.setItem(CLIENT_FEEDBACK_KEY, JSON.stringify(updated));
    setForm({ bericht: '', type: 'feedback' });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  /* Show all feedback (own + from others) as reviews */
  const allFeedback = items.filter((it) => it.status === 'gelezen' || it.email === user.email);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Inquiry form */}
      <DashboardCard title="Feedback Versturen" color="purple">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.2rem' }}>
            {[
              { key: 'feedback', label: 'Feedback' },
              { key: 'review', label: 'Review' },
              { key: 'vraag', label: 'Vraag' },
              { key: 'bug', label: 'Bug Report' },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setForm({ ...form, type: key })} style={{
                ...BTN,
                padding: '0.2rem 0.5rem',
                fontSize: 'max(8px, 0.4vw)',
                borderColor: form.type === key ? C.purple : 'rgba(255,255,255,0.1)',
                color: form.type === key ? C.purple : 'rgba(255,255,255,0.4)',
                backgroundColor: form.type === key ? 'rgba(188, 19, 254, 0.1)' : 'transparent',
              }}
                onMouseEnter={(e) => { if (form.type !== key) e.target.style.background = 'rgba(188, 19, 254, 0.08)'; }}
                onMouseLeave={(e) => { if (form.type !== key) e.target.style.background = form.type === key ? 'rgba(188, 19, 254, 0.1)' : 'transparent'; }}>
                {label}
              </button>
            ))}
          </div>
          <textarea
            value={form.bericht}
            onChange={(e) => setForm({ ...form, bericht: e.target.value })}
            placeholder="Schrijf je feedback, review of vraag..."
            rows={3}
            style={{
              padding: '0.4rem 0.6rem',
              backgroundColor: 'rgba(0,0,0,0.4)',
              border: `1px solid ${pc.rowBorder}`,
              borderRadius: '0.25rem',
              color: C.text, fontFamily: FONT,
              fontSize: 'max(9px, 0.45vw)',
              outline: 'none', resize: 'vertical',
            }}
            onFocus={(e) => { e.target.style.borderColor = C.purple; }}
            onBlur={(e) => { e.target.style.borderColor = pc.rowBorder; }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button onClick={submit} style={{
              ...BTN, borderColor: C.purple, color: C.purple,
              fontSize: 'max(9px, 0.45vw)', padding: '0.35rem 0.8rem',
            }}
              onMouseEnter={(e) => { e.target.style.background = 'rgba(188, 19, 254, 0.2)'; }}
              onMouseLeave={(e) => { e.target.style.background = BTN.background; }}>
              Versturen
            </button>
            {saved && (
              <span style={{ fontSize: 'max(8px, 0.4vw)', color: '#4ade80', textTransform: 'uppercase' }}>
                ✓ Feedback verzonden
              </span>
            )}
          </div>
        </div>
      </DashboardCard>

      {/* Reviews / feedback overzicht */}
      <DashboardCard title={`Reviews & Feedback (${allFeedback.length})`} color="gold">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {allFeedback.length > 0 ? allFeedback.map((it) => (
            <div key={it.id} style={{
              padding: '0.5rem 0.6rem',
              backgroundColor: it.email === user.email ? 'rgba(188, 19, 254, 0.04)' : tc.cardBg,
              borderLeft: `2px solid ${it.email === user.email ? C.purple : tc.border}`,
              borderRadius: '0 0.15rem 0.15rem 0',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontWeight: 'bold', fontSize: 'max(10px, 0.5vw)' }}>{it.naam}</span>
                  {it.email === user.email && (
                    <span style={{
                      fontSize: 'max(7px, 0.35vw)', padding: '0.05rem 0.25rem', borderRadius: '0.1rem',
                      backgroundColor: 'rgba(188, 19, 254, 0.2)', color: C.purple,
                      textTransform: 'uppercase',
                    }}>Jij</span>
                  )}
                  {it.type && (
                    <span style={{
                      fontSize: 'max(7px, 0.35vw)', padding: '0.05rem 0.25rem', borderRadius: '0.1rem',
                      backgroundColor: 'rgba(255, 174, 0, 0.12)', color: C.gold,
                      textTransform: 'uppercase',
                    }}>{it.type}</span>
                  )}
                </div>
                <span style={{ fontSize: 'max(7px, 0.35vw)', color: tc.dimText }}>
                  {new Date(it.ts).toLocaleString('nl-NL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div style={{ fontSize: 'max(9px, 0.45vw)', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {it.bericht}
              </div>
            </div>
          )) : (
            <div style={{ textAlign: 'center', color: tc.dimText, padding: '2rem 0', textTransform: 'uppercase', fontSize: 'max(9px, 0.45vw)' }}>
              Geen feedback of reviews
            </div>
          )}
        </div>
      </DashboardCard>
    </div>
  );
});


// ═══════════════════════════════════════════════════════════
// Inbox Tab — berichten / meldingen
// ═══════════════════════════════════════════════════════════
const INBOX_KEY = 'gfl_client_inbox';
const InboxTab = memo(() => {
  const [messages, setMessages] = useState(() => {
    try { const raw = localStorage.getItem(INBOX_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
  });

  const pc = CARD_COLORS.purple;

  const markRead = (id) => {
    const updated = messages.map((m) => m.id === id ? { ...m, read: true } : m);
    setMessages(updated);
    localStorage.setItem(INBOX_KEY, JSON.stringify(updated));
  };
  const deleteMsg = (id) => {
    const updated = messages.filter((m) => m.id !== id);
    setMessages(updated);
    localStorage.setItem(INBOX_KEY, JSON.stringify(updated));
  };

  const unread = messages.filter((m) => !m.read).length;

  return (
    <DashboardCard title={`Inbox${unread > 0 ? ` (${unread} nieuw)` : ''}`} color="purple">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: pc.dimText, padding: '2rem 0', textTransform: 'uppercase', fontSize: 'max(9px, 0.45vw)' }}>
            📭 Geen berichten
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} style={{
              padding: '0.6rem 0.8rem',
              border: `1px solid ${m.read ? pc.rowBorder : C.purple}`,
              borderRadius: '0.25rem',
              backgroundColor: m.read ? 'transparent' : pc.cardBg,
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem',
              transition: 'background-color 0.2s',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                  {!m.read && <span style={{
                    width: 6, height: 6, borderRadius: '50%', backgroundColor: C.purple, flexShrink: 0,
                  }} />}
                  <span style={{ fontWeight: m.read ? 'normal' : 'bold', fontSize: 'max(10px, 0.5vw)' }}>
                    {m.subject || 'Bericht'}
                  </span>
                </div>
                <div style={{ fontSize: 'max(9px, 0.45vw)', opacity: 0.6, wordBreak: 'break-word' }}>
                  {m.body || ''}
                </div>
                <div style={{ fontSize: 'max(7px, 0.35vw)', color: pc.dimText, marginTop: '0.2rem' }}>
                  {m.ts ? new Date(m.ts).toLocaleString('nl-NL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}
                  {m.from && ` · ${m.from}`}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0 }}>
                {!m.read && (
                  <button onClick={() => markRead(m.id)} style={{ ...BTN, padding: '0.25rem 0.5rem', fontSize: 'max(8px, 0.4vw)', borderColor: C.purple, color: C.purple }}
                    onMouseEnter={(e) => { e.target.style.background = 'rgba(188, 19, 254, 0.2)'; }}
                    onMouseLeave={(e) => { e.target.style.background = BTN.background; }}>
                    Gelezen
                  </button>
                )}
                <button onClick={() => deleteMsg(m.id)} style={{ ...BTN, padding: '0.25rem 0.5rem', fontSize: 'max(8px, 0.4vw)', borderColor: 'rgba(239,68,68,0.5)', color: '#fca5a5' }}
                  onMouseEnter={(e) => { e.target.style.background = 'rgba(239, 68, 68, 0.2)'; }}
                  onMouseLeave={(e) => { e.target.style.background = BTN.background; }}>
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardCard>
  );
});


// ═══════════════════════════════════════════════════════════
// Contacten Tab — contactenlijst
// ═══════════════════════════════════════════════════════════
const CONTACTS_KEY = 'gfl_client_contacts';
const ContactenTab = memo(() => {
  const [contacts, setContacts] = useState(() => {
    try { const raw = localStorage.getItem(CONTACTS_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
  });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ naam: '', email: '', notitie: '' });

  const tc = CARD_COLORS.gold;

  const addContact = () => {
    if (!form.naam.trim()) return;
    const updated = [{ id: Date.now(), ...form, ts: new Date().toISOString() }, ...contacts].slice(0, 100);
    setContacts(updated);
    localStorage.setItem(CONTACTS_KEY, JSON.stringify(updated));
    setForm({ naam: '', email: '', notitie: '' });
    setShowForm(false);
  };
  const removeContact = (id) => {
    const updated = contacts.filter((c) => c.id !== id);
    setContacts(updated);
    localStorage.setItem(CONTACTS_KEY, JSON.stringify(updated));
  };

  const inputStyle = {
    width: '100%', padding: '0.4rem 0.6rem',
    backgroundColor: 'rgba(0,0,0,0.4)',
    border: `1px solid ${tc.rowBorder}`,
    borderRadius: '0.25rem',
    color: C.text, fontFamily: FONT,
    fontSize: 'max(9px, 0.45vw)',
    outline: 'none',
  };

  return (
    <DashboardCard title={`Contacten (${contacts.length})`} color="gold">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {/* Add contact button / form */}
        {!showForm ? (
          <button onClick={() => setShowForm(true)} style={{ ...BTN, alignSelf: 'flex-start', fontSize: 'max(9px, 0.45vw)' }}
            onMouseEnter={(e) => hover(e, true)} onMouseLeave={(e) => hover(e, false)}>
            + Contact Toevoegen
          </button>
        ) : (
          <div style={{ padding: '0.8rem', border: `1px solid ${tc.rowBorder}`, borderRadius: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <input value={form.naam} onChange={(e) => setForm({ ...form, naam: e.target.value })} placeholder="Naam *" style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = C.gold; }} onBlur={(e) => { e.target.style.borderColor = tc.rowBorder; }} />
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="E-mail" style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = C.gold; }} onBlur={(e) => { e.target.style.borderColor = tc.rowBorder; }} />
            <input value={form.notitie} onChange={(e) => setForm({ ...form, notitie: e.target.value })} placeholder="Notitie" style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = C.gold; }} onBlur={(e) => { e.target.style.borderColor = tc.rowBorder; }} />
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button onClick={addContact} style={{ ...BTN, fontSize: 'max(9px, 0.45vw)' }}
                onMouseEnter={(e) => hover(e, true)} onMouseLeave={(e) => hover(e, false)}>Opslaan</button>
              <button onClick={() => { setShowForm(false); setForm({ naam: '', email: '', notitie: '' }); }}
                style={{ ...BTN, fontSize: 'max(9px, 0.45vw)', borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.4)' }}
                onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.05)'; }}
                onMouseLeave={(e) => { e.target.style.background = BTN.background; }}>Annuleren</button>
            </div>
          </div>
        )}

        {/* Contact list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '400px', overflowY: 'auto' }}>
          {contacts.length === 0 ? (
            <div style={{ textAlign: 'center', color: tc.dimText, padding: '2rem 0', textTransform: 'uppercase', fontSize: 'max(9px, 0.45vw)' }}>
              👥 Geen contacten
            </div>
          ) : (
            contacts.map((c) => (
              <div key={c.id} style={{
                padding: '0.5rem 0.6rem',
                border: `1px solid ${tc.rowBorder}`,
                borderRadius: '0.25rem',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                transition: 'background-color 0.2s',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = tc.cardBg; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 'bold', fontSize: 'max(10px, 0.5vw)' }}>{c.naam}</div>
                  <div style={{ fontSize: 'max(8px, 0.42vw)', opacity: 0.5, marginTop: '0.1rem' }}>
                    {c.email && `${c.email} · `}{c.notitie || ''}
                  </div>
                </div>
                <button onClick={() => removeContact(c.id)} style={{
                  background: 'none', border: 'none', color: 'rgba(239,68,68,0.5)',
                  cursor: 'pointer', fontSize: 'max(10px, 0.5vw)', padding: '0 0.3rem',
                }}
                  onMouseEnter={(e) => { e.target.style.color = '#ef4444'; }}
                  onMouseLeave={(e) => { e.target.style.color = 'rgba(239,68,68,0.5)'; }}>
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardCard>
  );
});


// ═══════════════════════════════════════════════════════════
// Agenda Tab — afspraken / planning
// ═══════════════════════════════════════════════════════════
const AGENDA_KEY = 'gfl_client_agenda';
const AgendaTab = memo(() => {
  const [events, setEvents] = useState(() => {
    try { const raw = localStorage.getItem(AGENDA_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
  });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ titel: '', datum: '', tijd: '', notitie: '' });

  const tc = CARD_COLORS.gold;

  const addEvent = () => {
    if (!form.titel.trim() || !form.datum) return;
    const updated = [...events, { id: Date.now(), ...form }]
      .sort((a, b) => `${a.datum}${a.tijd}`.localeCompare(`${b.datum}${b.tijd}`))
      .slice(0, 100);
    setEvents(updated);
    localStorage.setItem(AGENDA_KEY, JSON.stringify(updated));
    setForm({ titel: '', datum: '', tijd: '', notitie: '' });
    setShowForm(false);
  };
  const removeEvent = (id) => {
    const updated = events.filter((e) => e.id !== id);
    setEvents(updated);
    localStorage.setItem(AGENDA_KEY, JSON.stringify(updated));
  };

  /* Split into upcoming and past */
  const now = new Date().toISOString().slice(0, 10);
  const upcoming = events.filter((e) => e.datum >= now);
  const past = events.filter((e) => e.datum < now);

  const inputStyle = {
    width: '100%', padding: '0.4rem 0.6rem',
    backgroundColor: 'rgba(0,0,0,0.4)',
    border: `1px solid ${tc.rowBorder}`,
    borderRadius: '0.25rem',
    color: C.text, fontFamily: FONT,
    fontSize: 'max(9px, 0.45vw)',
    outline: 'none',
  };

  const renderEvent = (ev, isPast) => (
    <div key={ev.id} style={{
      padding: '0.5rem 0.8rem',
      border: `1px solid ${isPast ? 'rgba(255,255,255,0.08)' : tc.rowBorder}`,
      borderLeft: `3px solid ${isPast ? 'rgba(255,255,255,0.15)' : C.gold}`,
      borderRadius: '0.25rem',
      opacity: isPast ? 0.5 : 1,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      transition: 'background-color 0.2s',
    }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = tc.cardBg; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 'bold', fontSize: 'max(10px, 0.5vw)' }}>{ev.titel}</div>
        <div style={{ fontSize: 'max(8px, 0.42vw)', color: tc.dimText, marginTop: '0.1rem' }}>
          📅 {ev.datum}{ev.tijd && ` · 🕐 ${ev.tijd}`}
          {ev.notitie && ` · ${ev.notitie}`}
        </div>
      </div>
      <button onClick={() => removeEvent(ev.id)} style={{
        background: 'none', border: 'none', color: 'rgba(239,68,68,0.5)',
        cursor: 'pointer', fontSize: 'max(10px, 0.5vw)', padding: '0 0.3rem',
      }}
        onMouseEnter={(e) => { e.target.style.color = '#ef4444'; }}
        onMouseLeave={(e) => { e.target.style.color = 'rgba(239,68,68,0.5)'; }}>
        ✕
      </button>
    </div>
  );

  return (
    <DashboardCard title={`Agenda (${upcoming.length} aankomend)`} color="gold">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {/* Add event button / form */}
        {!showForm ? (
          <button onClick={() => setShowForm(true)} style={{ ...BTN, alignSelf: 'flex-start', fontSize: 'max(9px, 0.45vw)' }}
            onMouseEnter={(e) => hover(e, true)} onMouseLeave={(e) => hover(e, false)}>
            + Afspraak Toevoegen
          </button>
        ) : (
          <div style={{ padding: '0.8rem', border: `1px solid ${tc.rowBorder}`, borderRadius: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <input value={form.titel} onChange={(e) => setForm({ ...form, titel: e.target.value })} placeholder="Titel *" style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = C.gold; }} onBlur={(e) => { e.target.style.borderColor = tc.rowBorder; }} />
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <input type="date" value={form.datum} onChange={(e) => setForm({ ...form, datum: e.target.value })} style={{ ...inputStyle, flex: 1 }}
                onFocus={(e) => { e.target.style.borderColor = C.gold; }} onBlur={(e) => { e.target.style.borderColor = tc.rowBorder; }} />
              <input type="time" value={form.tijd} onChange={(e) => setForm({ ...form, tijd: e.target.value })} style={{ ...inputStyle, flex: 1 }}
                onFocus={(e) => { e.target.style.borderColor = C.gold; }} onBlur={(e) => { e.target.style.borderColor = tc.rowBorder; }} />
            </div>
            <input value={form.notitie} onChange={(e) => setForm({ ...form, notitie: e.target.value })} placeholder="Notitie" style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = C.gold; }} onBlur={(e) => { e.target.style.borderColor = tc.rowBorder; }} />
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button onClick={addEvent} style={{ ...BTN, fontSize: 'max(9px, 0.45vw)' }}
                onMouseEnter={(e) => hover(e, true)} onMouseLeave={(e) => hover(e, false)}>Opslaan</button>
              <button onClick={() => { setShowForm(false); setForm({ titel: '', datum: '', tijd: '', notitie: '' }); }}
                style={{ ...BTN, fontSize: 'max(9px, 0.45vw)', borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.4)' }}
                onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.05)'; }}
                onMouseLeave={(e) => { e.target.style.background = BTN.background; }}>Annuleren</button>
            </div>
          </div>
        )}

        {/* Upcoming events */}
        {upcoming.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div style={{ fontSize: 'max(8px, 0.4vw)', color: tc.dimText, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Aankomend</div>
            {upcoming.map((ev) => renderEvent(ev, false))}
          </div>
        )}

        {/* Past events */}
        {past.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div style={{ fontSize: 'max(8px, 0.4vw)', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Verlopen</div>
            {past.map((ev) => renderEvent(ev, true))}
          </div>
        )}

        {events.length === 0 && (
          <div style={{ textAlign: 'center', color: tc.dimText, padding: '2rem 0', textTransform: 'uppercase', fontSize: 'max(9px, 0.45vw)' }}>
            📅 Geen afspraken
          </div>
        )}
      </div>
    </DashboardCard>
  );
});

