import React, { memo, useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  getAdminStats,
  getAdminUsers,
  setUserRole,
  deleteUser,
  getAdminAssessments,
  getAdminAssessment,
  deleteAssessment,
  downloadPdf,
  getPromptConfig,
  updatePromptConfig,
  getQuestions,
  seedQuestions,
  updateQuestion,
  exportQuestions,
  importQuestions,
  exportQuestionsDocx,
  importQuestionsDocx,
  getApiStatus,
  getProviders,
} from '../../utils/apiClient';
import {
  BTN, LABEL, TEXTAREA, INPUT_SM, TAB_STYLE,
  hover, C, FONT,
} from './dashboardStyles';
import { BRANDS } from '../../pages/GeneralBrandPage/brandData';

// ═══════════════════════════════════════════════════════════
// DashboardCard — inline-style version of HoloAuth's HoloCard
// Supports 'gold' (primary) and 'purple' (secondary) themes
// ═══════════════════════════════════════════════════════════
const CARD_COLORS = {
  gold: {
    border: '#ffae00',
    shadow: '0 0 15px rgba(255, 174, 0, 0.3)',
    titleColor: '#ffae00',
    dimText: 'rgba(255, 174, 0, 0.35)',
    rowBorder: 'rgba(255, 174, 0, 0.12)',
    cardBg: 'rgba(255, 174, 0, 0.04)',
    iconBg: 'rgba(255, 174, 0, 0.08)',
  },
  purple: {
    border: '#bc13fe',
    shadow: '0 0 15px rgba(188, 19, 254, 0.3)',
    titleColor: '#bc13fe',
    dimText: 'rgba(188, 19, 254, 0.35)',
    rowBorder: 'rgba(188, 19, 254, 0.12)',
    cardBg: 'rgba(188, 19, 254, 0.04)',
    iconBg: 'rgba(188, 19, 254, 0.08)',
  },
};

function DashboardCard({ children, title, color = 'gold', className, style = {} }) {
  const t = CARD_COLORS[color] || CARD_COLORS.gold;
  return (
    <div style={{
      position: 'relative',
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: `1px solid ${t.border}`,
      boxShadow: t.shadow,
      borderRadius: '0.5rem',
      padding: '1.25rem',
      fontFamily: FONT,
      color: C.text,
      fontSize: 'max(12px, 0.65vw)',
      ...style,
    }}>


      {/* Title badge — positioned above top border like HoloCard */}
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


/**
 * Admin Dashboard — HoloAuth Dashboard layout
 *
 * Layout:
 *   Fixed modal frame (same translucent style as LoginFrame)
 *   header  →  Commandocentrum title + user info + buttons
 *   3-col grid  →  DashboardCards (overview) or full-width tab content
 *   4-col stats footer
 */

/* SectorFrame exact box-shadow */
const SF_SHADOW =
  '0 6px 30px rgba(0,0,0,0.7), ' +
  '0 12px 60px rgba(0,0,0,0.5), ' +
  '0 0 80px rgba(0,0,0,0.35), ' +
  '0 0 120px rgba(0,0,0,0.15), ' +
  'inset 0 0 12px rgba(245, 158, 11, 0.06), ' +
  'inset 0 0 30px rgba(245, 158, 11, 0.03)';

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

const AdminDashboardModal = memo(({ user, onLogout, onClose }) => {
  const { t: _t } = useLanguage();
  const [tab, setTab] = useState('overview');

  return (
    /* Outer shell — fixed size, positioning context for corners */
    <div style={{ position: 'relative', width: '90vw', maxWidth: '1280px', height: '85vh' }}>
      {/* Corner brackets */}
      <div style={CORNER('tl')} />
      <div style={CORNER('tr')} />
      <div style={CORNER('bl')} />
      <div style={CORNER('br')} />

      {/* Inner panel — fills fixed outer shell */}
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
        boxShadow: SF_SHADOW,
        color: C.text,
        fontFamily: FONT,
        fontSize: 'max(12px, 0.65vw)',
      }}>
        {/* Holographic sheen */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '0.5rem',
          pointerEvents: 'none', zIndex: 1,
          background: 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.015) 30%, transparent 50%, rgba(255,255,255,0.01) 70%, transparent 100%)',
          backgroundSize: '400% 400%', backgroundRepeat: 'no-repeat',
          animation: 'holoSheen 45s ease-in-out infinite',
          mixBlendMode: 'screen',
        }} />
        {/* Scanline sweep */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '0.5rem',
          pointerEvents: 'none', zIndex: 1,
          background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.008) 48%, rgba(255,255,255,0.015) 50%, rgba(255,255,255,0.008) 52%, transparent 100%)',
          backgroundSize: '100% 300%',
          animation: 'holoScanline 14s linear infinite',
        }} />
        {/* Noise texture */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '0.5rem',
          pointerEvents: 'none', zIndex: 1,
          backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')",
          opacity: 0.01, mixBlendMode: 'overlay',
        }} />

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
          }}>Commandocentrum</span>
          <div style={{ display: 'flex', gap: 3 }}>
            <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: C.gold }} />
            <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: C.purple }} />
            <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)' }} />
          </div>
        </div>

        {/* Scrollable content area — fills remaining space */}
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
      {/* ── Koptekst — HoloAuth Dashboard structuur ── */}
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
            Commandocentrum
          </h1>
          <p style={{
            color: 'rgba(255, 174, 0, 0.35)', fontSize: 'max(10px, 0.55vw)',
            marginTop: '0.25rem', fontFamily: FONT,
          }}>
            GEBRUIKER: {user.displayName} {'·'} ROL: {(user.role || 'client').toUpperCase()} {'·'} {user.email}
          </p>
        </div>
      </header>

      {/* ── Tab Navigatie ── */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        {[
          { key: 'overview', label: 'Overzicht' },
          { key: 'users', label: 'Gebruikers' },
          { key: 'assessments', label: 'Assessments' },
          { key: 'questions', label: 'Vragen' },
          { key: 'prompts', label: 'Prompts' },
          { key: 'feedback', label: 'Feedback' },
          { key: 'contact', label: 'Contact' },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)} style={TAB_STYLE(tab === key)}
            onMouseEnter={(e) => { if (tab !== key) e.target.style.background = 'rgba(255, 174, 0, 0.15)'; }}
            onMouseLeave={(e) => { if (tab !== key) e.target.style.background = TAB_STYLE(false).background; }}>
            {label.toUpperCase()}
          </button>
        ))}
      </div>

      {/* ── Tab Inhoud ── */}
      {tab === 'overview' && <OverviewTab user={user} />}
      {tab === 'users' && <UsersTab currentUserId={user.id} />}
      {tab === 'assessments' && <AssessmentsTab />}
      {tab === 'questions' && <QuestionsTab />}
      {tab === 'prompts' && <PromptsTab />}
      {tab === 'feedback' && <FeedbackTab />}
      {tab === 'contact' && <ContactTab />}
        </div>{/* end scrollable content */}

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
      </div>{/* end inner panel */}
    </div>/* end outer shell */
  );
});

AdminDashboardModal.displayName = 'AdminDashboardModal';
export default AdminDashboardModal;

// ═══════════════════════════════════════════════════════════
// Tabs
// ═══════════════════════════════════════════════════════════

/* ── Global Error Capture — persisted to localStorage, shared across sessions ── */
const ERR_LOG_KEY = 'gfl_error_audit_log';
const MAX_LOG = 100;

function getStoredErrors() {
  try { return JSON.parse(localStorage.getItem(ERR_LOG_KEY) || '[]'); } catch { return []; }
}
function pushError(entry) {
  const log = [...getStoredErrors(), entry].slice(-MAX_LOG);
  localStorage.setItem(ERR_LOG_KEY, JSON.stringify(log));
  return log;
}

/* Install global error listeners ONCE on first import */
if (!window.__gflErrorCapture) {
  window.__gflErrorCapture = true;
  const origError = console.error;
  const origWarn = console.warn;

  console.error = (...args) => {
    origError.apply(console, args);
    const stack = new Error().stack || '';
    const callerLine = stack.split('\n').slice(2, 3).join('').trim();
    pushError({
      id: Date.now() + Math.random(),
      type: 'console.error',
      message: args.map((a) => (typeof a === 'string' ? a : (a instanceof Error ? a.message : JSON.stringify(a)))).join(' ').slice(0, 300),
      element: callerLine.replace(/^at\s+/, '').slice(0, 120),
      ts: new Date().toISOString(),
    });
  };

  console.warn = (...args) => {
    origWarn.apply(console, args);
    const msg = args.join(' ');
    if (msg.includes('error') || msg.includes('Error') || msg.includes('fail') || msg.includes('404') || msg.includes('500')) {
      pushError({
        id: Date.now() + Math.random(),
        type: 'waarschuwing',
        message: msg.slice(0, 300),
        element: '',
        ts: new Date().toISOString(),
      });
    }
  };

  window.addEventListener('error', (event) => {
    pushError({
      id: Date.now() + Math.random(),
      type: 'runtime',
      message: (event.message || 'Onbekende fout').slice(0, 300),
      element: event.filename ? `${event.filename.split('/').pop()}:${event.lineno}:${event.colno}` : '',
      ts: new Date().toISOString(),
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    pushError({
      id: Date.now() + Math.random(),
      type: 'promise',
      message: (reason instanceof Error ? reason.message : String(reason)).slice(0, 300),
      element: reason instanceof Error ? (reason.stack || '').split('\n').slice(1, 2).join('').trim().replace(/^at\s+/, '').slice(0, 120) : '',
      ts: new Date().toISOString(),
    });
  });
}


const OverviewTab = memo(({ user }) => {
  const [stats, setStats] = useState(null);
  const [, setRecentUsers] = useState([]);
  const [error, setError] = useState('');

  /* ── Admin Notities (opgeslagen in localStorage) ── */
  const NOTES_KEY = 'gfl_admin_notes';
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

  /* ── Foutmeldingen Audit Log (uit localStorage — gevuld door globale listener) ── */
  const [errorLog, setErrorLog] = useState(getStoredErrors);

  /* Poll localStorage every 3s so new errors from other components show up */
  useEffect(() => {
    const iv = setInterval(() => setErrorLog(getStoredErrors()), 3000);
    return () => clearInterval(iv);
  }, []);

  const clearLog = () => {
    localStorage.removeItem(ERR_LOG_KEY);
    setErrorLog([]);
  };

  /* ── API Gezondheidscheck — 3 gekoppelde API's + encryptie ── */
  const [apiHealth, setApiHealth] = useState({
    backend:    { status: 'LADEN...', color: C.gold },
    ai:         { status: 'LADEN...', color: C.gold },
    pdf:        { status: 'LADEN...', color: C.gold },
    encryption: { status: 'LADEN...', color: C.gold },
  });

  useEffect(() => {
    /* 1. Backend API */
    getAdminStats()
      .then((s) => {
        setStats(s);
        setApiHealth((h) => ({ ...h, backend: { status: 'ONLINE', color: '#4ade80' } }));
      })
      .catch((e) => {
        setError(e.message);
        setApiHealth((h) => ({ ...h, backend: { status: 'OFFLINE', color: '#ef4444' } }));
      });

    /* 2. AI Provider API — check if any provider has a real key configured */
    getProviders()
      .then((data) => {
        const configured = data?.providers?.filter(p => p.key && p.defaultModel) || [];
        if (configured.length > 0) {
          const names = configured.map(p => p.name).join(', ');
          setApiHealth((h) => ({ ...h, ai: { status: `ONLINE · ${names}`, color: '#4ade80' } }));
        } else {
          setApiHealth((h) => ({ ...h, ai: { status: 'GEEN SLEUTEL', color: '#f59e0b' } }));
        }
      })
      .catch(() => setApiHealth((h) => ({ ...h, ai: { status: 'OFFLINE', color: '#ef4444' } })));

    /* 3. PDF Service + Encryption status — from /api/status */
    getApiStatus()
      .then((data) => {
        setApiHealth((h) => ({ ...h, pdf: { status: 'ONLINE', color: '#4ade80' } }));
        // Check encryption status from the same endpoint
        if (data?.encryption && data.encryption !== 'disabled') {
          setApiHealth((h) => ({ ...h, encryption: { status: `ACTIEF · ${data.encryption}`, color: '#4ade80' } }));
        } else {
          setApiHealth((h) => ({ ...h, encryption: { status: 'UITGESCHAKELD', color: '#f59e0b' } }));
        }
      })
      .catch(() => {
        setApiHealth((h) => ({ ...h, pdf: { status: 'OFFLINE', color: '#ef4444' } }));
        setApiHealth((h) => ({ ...h, encryption: { status: 'ONBEKEND', color: '#ef4444' } }));
      });

    getAdminUsers({ limit: 5 }).then((d) => setRecentUsers(d.users || [])).catch(() => {});
  }, []);

  if (error) return <ErrorBox msg={error} />;
  if (!stats) return <Loading />;

  const tc = CARD_COLORS.gold;
  const pc = CARD_COLORS.purple;

  return (
    <>
      {/* ── 3-Kolommen Raster ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem',
      }}>
        {/* Kaart 1: Identiteitsmatrix (goud) — gebruikersprofiel */}
        <DashboardCard title="Identiteitsmatrix" color="gold">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <div style={{
                width: '3.5rem', height: '3.5rem', borderRadius: '50%',
                backgroundColor: tc.iconBg, border: `1px solid ${tc.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem',
              }}>🛡</div>
              <div>
                <div style={{ fontSize: 'max(9px, 0.45vw)', color: tc.dimText, textTransform: 'uppercase' }}>Status</div>
                <div style={{ color: C.gold, fontWeight: 'bold' }}>OPERATIONEEL</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
              {[
                ['Gebruiker', user.displayName || '—'],
                ['E-mail Protocol', user.email],
                ['Toegangsniveau', (user.role || 'client').toUpperCase()],
                ['Sessie', 'ACTIEF'],
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
        </DashboardCard>

        {/* Kaart 2: Admin Notities (paars) — opslaan van notities */}
        <DashboardCard title="Admin Notities" color="purple">
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

        {/* Kaart 3: Foutmeldingen — Fout/Bug Audit Log (goud) */}
        <DashboardCard title="Foutmeldingen" color="gold">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {errorLog.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'max(8px, 0.4vw)', color: tc.dimText, textTransform: 'uppercase' }}>
                  {errorLog.length} fout{errorLog.length !== 1 ? 'en' : ''} vastgelegd
                </span>
                <button onClick={clearLog} style={{
                  ...BTN, fontSize: 'max(7px, 0.38vw)', padding: '0.2rem 0.4rem',
                  borderColor: 'rgba(239,68,68,0.4)', color: '#fca5a5',
                }}
                  onMouseEnter={(e) => { e.target.style.background = 'rgba(239,68,68,0.2)'; }}
                  onMouseLeave={(e) => { e.target.style.background = BTN.background; }}>
                  Log Wissen
                </button>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '280px', overflowY: 'auto' }}>
              {errorLog.length > 0 ? errorLog.slice().reverse().map((entry) => (
                <div key={entry.id} style={{
                  padding: '0.45rem 0.6rem',
                  backgroundColor: tc.cardBg,
                  borderLeft: `2px solid ${entry.type === 'runtime' || entry.type === 'promise' ? 'rgba(239,68,68,0.8)' : 'rgba(239,68,68,0.4)'}`,
                  borderRadius: '0 0.15rem 0.15rem 0',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                    <span style={{
                      fontSize: 'max(7px, 0.38vw)', padding: '0.1rem 0.3rem', borderRadius: '0.15rem',
                      backgroundColor: entry.type === 'runtime' ? 'rgba(239,68,68,0.15)' : entry.type === 'promise' ? 'rgba(251,146,60,0.15)' : 'rgba(239,68,68,0.08)',
                      color: entry.type === 'runtime' ? '#fca5a5' : entry.type === 'promise' ? '#fdba74' : '#fca5a5',
                      textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.05em',
                    }}>
                      {entry.type}
                    </span>
                    <span style={{ fontSize: 'max(7px, 0.35vw)', color: tc.dimText, fontFamily: FONT }}>
                      {new Date(entry.ts).toLocaleString('nl-NL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ fontSize: 'max(9px, 0.45vw)', color: '#fca5a5', wordBreak: 'break-word' }}>
                    {entry.message}
                  </div>
                  {entry.element && (
                    <div style={{ fontSize: 'max(7px, 0.38vw)', color: tc.dimText, marginTop: '0.2rem', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      📍 {entry.element}
                    </div>
                  )}
                </div>
              )) : (
                <div style={{ textAlign: 'center', padding: '1.5rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ fontSize: 'max(18px, 1vw)', opacity: 0.4 }}>✓</div>
                  <div style={{ color: '#4ade80', textTransform: 'uppercase', fontSize: 'max(9px, 0.45vw)' }}>
                    Geen fouten gedetecteerd
                  </div>
                  <div style={{ color: tc.dimText, fontSize: 'max(8px, 0.4vw)' }}>
                    Console- en runtime fouten verschijnen hier
                  </div>
                </div>
              )}
            </div>
          </div>
        </DashboardCard>
      </div>

      {/* ── API Gezondheid — 4 gekoppelde services ── */}
      <DashboardCard title="API Verbindingen" color="gold" style={{ padding: '1rem 1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          {[
            { label: 'Backend API', key: 'backend', desc: 'REST / MongoDB' },
            { label: 'AI Provider', key: 'ai', desc: 'Gemini / Analyse' },
            { label: 'PDF Service', key: 'pdf', desc: 'Rapportgeneratie' },
            { label: 'Encryptie', key: 'encryption', desc: 'AES-256-GCM / PII' },
          ].map(({ label, key, desc }) => (
            <div key={key} style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              padding: '0.6rem 0.8rem', borderRadius: '0.3rem',
              backgroundColor: 'rgba(0,0,0,0.3)', border: `1px solid ${tc.rowBorder}`,
            }}>
              <div style={{
                width: '0.5rem', height: '0.5rem', borderRadius: '50%',
                backgroundColor: apiHealth[key].color,
                boxShadow: `0 0 6px ${apiHealth[key].color}`,
                flexShrink: 0,
              }} />
              <div>
                <div style={{ fontSize: 'max(9px, 0.45vw)', fontWeight: 'bold', textTransform: 'uppercase' }}>{label}</div>
                <div style={{ fontSize: 'max(7px, 0.38vw)', color: tc.dimText }}>{desc}</div>
              </div>
              <div style={{
                marginLeft: 'auto', fontSize: 'max(8px, 0.42vw)', fontWeight: 'bold',
                color: apiHealth[key].color, fontFamily: FONT,
              }}>
                {apiHealth[key].status}
              </div>
            </div>
          ))}
        </div>
      </DashboardCard>

      {/* ── 4-Kolommen Statistieken Voettekst ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.8rem',
      }}>
        {[
          { label: 'Gebruikers', value: stats.userCount },
          { label: 'Assessments', value: stats.assessmentCount },
          { label: 'Fouten Vastgelegd', value: errorLog.length, color: errorLog.length > 0 ? '#fca5a5' : '#4ade80' },
          { label: 'Contactverzoeken', value: stats.contactCount ?? 0 },
        ].map((stat, i) => (
          <DashboardCard key={i} color="gold" style={{ padding: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 'max(8px, 0.4vw)', color: CARD_COLORS.gold.dimText, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{stat.label}</div>
              <div style={{ fontSize: 'max(18px, 1vw)', fontWeight: 'bold', fontFamily: FONT, color: stat.color || C.text }}>{stat.value}</div>
            </div>
          </DashboardCard>
        ))}
      </div>
    </>
  );
});

const UsersTab = memo(({ currentUserId }) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null); // userId being toggled
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(() => {
    setError('');
    getAdminUsers({ limit: 100 })
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleRole = useCallback(async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'client' : 'admin';
    setBusy(userId);
    try {
      await setUserRole(userId, newRole);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  }, [load]);

  const handleDeleteUser = useCallback(async (userId, displayName) => {
    if (!window.confirm(`Permanently delete user "${displayName}" and all their assessments? This cannot be undone.`)) return;
    setDeleting(userId);
    setError('');
    try {
      await deleteUser(userId);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(null);
    }
  }, [load]);

  if (error) return <ErrorBox msg={error} />;
  if (!data) return <Loading />;

  return (
    <div>
      <div style={LABEL}>ALL USERS ({data.total})</div>
      {data.users.map((u) => (
        <div key={u._id} style={{
          padding: '0.4rem 0.6rem', marginBottom: '0.3rem',
          border: '1px solid rgba(255, 174, 0, 0.12)',
          borderRadius: '0.25rem', fontSize: 'max(10px, 0.5vw)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontWeight: 'bold' }}>{u.displayName || u.email}</div>
            <div style={{ opacity: 0.4, fontSize: 'max(9px, 0.4vw)' }}>
              {u.email} · {new Date(u.createdAt).toLocaleDateString()}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              padding: '0.15rem 0.4rem', borderRadius: '0.2rem',
              fontSize: 'max(8px, 0.4vw)',
              backgroundColor: u.role === 'admin' ? 'rgba(255, 174, 0, 0.15)' : 'rgba(188, 19, 254, 0.1)',
              border: `1px solid ${u.role === 'admin' ? 'rgba(255, 174, 0, 0.4)' : 'rgba(188, 19, 254, 0.3)'}`,
              color: u.role === 'admin' ? C.gold : C.purple,
            }}>
              {(u.role || 'client').toUpperCase()}
            </span>
            {u._id !== currentUserId && (
              <>
                <button
                  onClick={() => toggleRole(u._id, u.role || 'client')}
                  disabled={busy === u._id}
                  style={{ ...BTN, padding: '0.2rem 0.5rem', fontSize: 'max(8px, 0.4vw)', opacity: busy === u._id ? 0.4 : 1 }}
                  onMouseEnter={(e) => hover(e, true)} onMouseLeave={(e) => hover(e, false)}
                >
                  {u.role === 'admin' ? '→ CLIENT' : '→ ADMIN'}
                </button>
                <button
                  onClick={() => handleDeleteUser(u._id, u.displayName || u.email)}
                  disabled={deleting === u._id}
                  style={{
                    ...BTN, padding: '0.2rem 0.5rem', fontSize: 'max(8px, 0.4vw)',
                    borderColor: 'rgba(239, 68, 68, 0.4)', color: '#fca5a5',
                    opacity: deleting === u._id ? 0.4 : 1,
                  }}
                  onMouseEnter={(e) => { e.target.style.background = 'rgba(239, 68, 68, 0.15)'; }}
                  onMouseLeave={(e) => { e.target.style.background = 'linear-gradient(135deg, rgba(255, 174, 0, 0.1), rgba(255, 174, 0, 0.2))'; e.target.style.color = '#fca5a5'; }}
                >
                  {deleting === u._id ? '...' : '✕'}
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
});

const AssessmentsTab = memo(() => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState(null); // full assessment detail
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [deleting, setDeleting] = useState(null); // id being deleted

  const load = useCallback(() => {
    setError('');
    getAdminAssessments({ limit: 50 })
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => { load(); }, [load]);

  const viewDetail = useCallback(async (id) => {
    setLoadingDetail(true);
    setError('');
    try {
      const d = await getAdminAssessment(id);
      setDetail(d);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm('Permanently delete this assessment? This cannot be undone.')) return;
    setDeleting(id);
    setError('');
    try {
      await deleteAssessment(id);
      setDetail(null);
      load(); // refresh list
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(null);
    }
  }, [load]);

  const handleDownloadPdf = useCallback(async (id) => {
    try {
      await downloadPdf(id);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  if (error && !data && !detail) return <ErrorBox msg={error} />;
  if (!data && !detail) return <Loading />;

  // ── Detail view ──
  if (detail) {
    const d = detail;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={LABEL}>ASSESSMENT DETAIL</div>
          <button onClick={() => setDetail(null)}
            style={{ ...BTN, padding: '0.2rem 0.6rem', fontSize: 'max(8px, 0.4vw)' }}
            onMouseEnter={(e) => hover(e, true)} onMouseLeave={(e) => hover(e, false)}>
            ← BACK
          </button>
        </div>

        {error && <ErrorBox msg={error} />}

        {/* Summary card */}
        <div style={{
          padding: '0.6rem', borderRadius: '0.3rem',
          border: '1px solid rgba(255, 174, 0, 0.15)',
          backgroundColor: 'rgba(255, 174, 0, 0.04)',
        }}>
          <div style={{ fontWeight: 'bold', fontSize: 'max(12px, 0.6vw)', marginBottom: '0.3rem' }}>
            {d.extendedArchetypeName || d.archetypeKey}
          </div>
          <div style={{ fontSize: 'max(9px, 0.45vw)', opacity: 0.5, lineHeight: 1.6 }}>
            <div>User: {d.userDisplayName || d.userEmail || d.userId}</div>
            <div>Archetype: {d.archetypeKey} · Support: {d.supportGroup || '—'}</div>
            <div>Provider: {d.aiProvider || '—'} · Model: {d.aiModel || '—'}</div>
            <div>Harmony: {d.harmonyScore != null ? `${d.harmonyScore}%` : '—'} · Level: {d.consciousnessLevel || '—'}</div>
            <div>Shadow: {d.overallShadow || '—'}</div>
            <div>Date: {new Date(d.createdAt).toLocaleString()}</div>
          </div>

          {/* OCEAN scores */}
          {d.oceanScores && (
            <div style={{ marginTop: '0.4rem' }}>
              <div style={{ ...LABEL, marginBottom: '0.2rem' }}>OCEAN SCORES</div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {Object.entries(d.oceanScores).map(([key, val]) => (
                  <span key={key} style={{
                    padding: '0.15rem 0.4rem', borderRadius: '0.2rem', fontSize: 'max(9px, 0.45vw)',
                    backgroundColor: 'rgba(255, 174, 0, 0.08)', border: '1px solid rgba(255, 174, 0, 0.12)',
                  }}>
                    {key}: {val}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button onClick={() => handleDownloadPdf(d._id)}
            style={{ ...BTN, padding: '0.3rem 0.7rem', fontSize: 'max(8px, 0.4vw)' }}
            onMouseEnter={(e) => hover(e, true)} onMouseLeave={(e) => hover(e, false)}>
            PDF ↓
          </button>
          <button onClick={() => handleDelete(d._id)} disabled={deleting === d._id}
            style={{
              ...BTN, padding: '0.3rem 0.7rem', fontSize: 'max(8px, 0.4vw)',
              borderColor: 'rgba(239, 68, 68, 0.5)', color: '#fca5a5',
              opacity: deleting === d._id ? 0.4 : 1,
            }}
            onMouseEnter={(e) => { e.target.style.background = 'rgba(239, 68, 68, 0.2)'; }}
            onMouseLeave={(e) => { e.target.style.background = 'linear-gradient(135deg, rgba(255, 174, 0, 0.1), rgba(255, 174, 0, 0.2))'; e.target.style.color = '#fca5a5'; }}>
            {deleting === d._id ? 'DELETING...' : 'DELETE'}
          </button>
        </div>

        {/* Per-layer results */}
        {d.subjectResults && d.subjectResults.length > 0 && (
          <div>
            <div style={LABEL}>LAYER RESULTS</div>
            {d.subjectResults.map((sr) => (
              <div key={sr.subjectId || sr.subjectName} style={{
                padding: '0.4rem 0.5rem', marginBottom: '0.25rem',
                border: '1px solid rgba(255, 174, 0, 0.08)',
                borderRadius: '0.2rem', fontSize: 'max(9px, 0.45vw)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 'bold' }}>{sr.subjectName}</span>
                  <span style={{ opacity: 0.5 }}>{sr.percentage}% · {sr.dominantArchetype}</span>
                </div>
                {/* Progress bar */}
                <div style={{
                  height: '4px', borderRadius: '2px',
                  backgroundColor: 'rgba(255, 174, 0, 0.1)',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', borderRadius: '2px',
                    width: `${sr.percentage}%`,
                    backgroundColor: 'rgba(255, 174, 0, 0.5)',
                    transition: 'width 0.3s',
                  }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Individual question responses */}
        {d.responses && d.responses.length > 0 && (
          <div>
            <div style={LABEL}>QUESTION RESPONSES ({d.responses.length})</div>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {d.responses.map((r, i) => (
                <div key={r.questionId || r.questionNumber || i} style={{
                  padding: '0.4rem 0.5rem', marginBottom: '0.3rem',
                  border: '1px solid rgba(255, 174, 0, 0.1)',
                  borderRadius: '0.25rem', fontSize: 'max(9px, 0.45vw)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span style={{ opacity: 0.4, fontWeight: 'bold' }}>Q{r.questionNumber || r.questionId}</span>
                      <span style={{
                        padding: '0.1rem 0.3rem', borderRadius: '0.15rem',
                        backgroundColor: 'rgba(255, 174, 0, 0.08)', fontSize: 'max(8px, 0.4vw)',
                      }}>
                        {r.archetypeName || r.archetype}
                      </span>
                      {r.layerName && (
                        <span style={{ opacity: 0.3, fontSize: 'max(8px, 0.4vw)' }}>
                          {r.layerName}
                        </span>
                      )}
                    </div>
                    <span style={{ opacity: 0.5 }}>pos: {r.answerPosition || r.value}</span>
                  </div>
                  {r.questionText && (
                    <div style={{ opacity: 0.7, fontSize: 'max(8px, 0.42vw)', marginBottom: '0.15rem', lineHeight: 1.3, paddingLeft: '0.3rem' }}>
                      {r.questionText}
                    </div>
                  )}
                  {r.answerText && (
                    <div style={{
                      fontSize: 'max(8px, 0.42vw)', paddingLeft: '0.3rem',
                      color: '#ffae00', fontStyle: 'italic',
                    }}>
                      → {r.answerText}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Analysis text */}
        {d.analysis && (
          <div>
            <div style={LABEL}>AI ANALYSIS</div>
            <div style={{
              padding: '0.5rem', borderRadius: '0.2rem',
              border: '1px solid rgba(255, 174, 0, 0.08)',
              fontSize: 'max(9px, 0.45vw)', opacity: 0.7,
              whiteSpace: 'pre-wrap', maxHeight: '200px', overflowY: 'auto',
            }}>
              {d.analysis}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── List view ──
  return (
    <div>
      <div style={LABEL}>ALL ASSESSMENTS ({data.total})</div>
      {data.assessments.length === 0 ? (
        <div style={{ textAlign: 'center', opacity: 0.4, padding: '1rem 0' }}>No assessments yet</div>
      ) : (
        data.assessments.map((a) => (
          <div key={a._id} style={{
            padding: '0.4rem 0.6rem', marginBottom: '0.3rem',
            border: '1px solid rgba(255, 174, 0, 0.12)',
            borderRadius: '0.25rem', fontSize: 'max(10px, 0.5vw)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold' }}>{a.extendedArchetypeName || a.archetypeKey}</div>
              <div style={{ opacity: 0.4, fontSize: 'max(9px, 0.4vw)' }}>
                User: {a.userId?.slice?.(-6) || a.userId} · {a.aiProvider || '—'} · {new Date(a.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{
                padding: '0.15rem 0.4rem', borderRadius: '0.2rem',
                fontSize: 'max(8px, 0.4vw)',
                backgroundColor: 'rgba(255, 174, 0, 0.08)',
                border: '1px solid rgba(255, 174, 0, 0.15)',
              }}>
                {a.supportGroup || '—'}
              </span>
              <button onClick={() => viewDetail(a._id)} disabled={loadingDetail}
                style={{ ...BTN, padding: '0.15rem 0.5rem', fontSize: 'max(8px, 0.4vw)' }}
                onMouseEnter={(e) => hover(e, true)} onMouseLeave={(e) => hover(e, false)}>
                VIEW
              </button>
              <button onClick={() => handleDelete(a._id)} disabled={deleting === a._id}
                style={{
                  ...BTN, padding: '0.15rem 0.5rem', fontSize: 'max(8px, 0.4vw)',
                  borderColor: 'rgba(239, 68, 68, 0.4)', color: '#fca5a5',
                  opacity: deleting === a._id ? 0.4 : 1,
                }}
                onMouseEnter={(e) => { e.target.style.background = 'rgba(239, 68, 68, 0.15)'; }}
                onMouseLeave={(e) => { e.target.style.background = 'linear-gradient(135deg, rgba(255, 174, 0, 0.1), rgba(255, 174, 0, 0.2))'; e.target.style.color = '#fca5a5'; }}>
                {deleting === a._id ? '...' : '✕'}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
});

const PromptsTab = memo(() => {
  const [config, setConfig] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getPromptConfig().then(setConfig).catch((e) => setError(e.message));
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      const updated = await updatePromptConfig({
        systemPromptTemplate: config.systemPromptTemplate,
        userPromptTemplate: config.userPromptTemplate,
        defaultProvider: config.defaultProvider,
        defaultModel: config.defaultModel,
        temperature: parseFloat(config.temperature) || 0.7,
        maxTokens: parseInt(config.maxTokens) || 2048,
      });
      setConfig(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }, [config]);

  const update = (key, value) => setConfig((prev) => ({ ...prev, [key]: value }));

  if (error && !config) return <ErrorBox msg={error} />;
  if (!config) return <Loading />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
      <div style={LABEL}>AI PROMPT CONFIGURATION</div>
      <div style={{ fontSize: 'max(9px, 0.45vw)', opacity: 0.4 }}>
        These templates control what the AI model receives. Only admins can edit this.
      </div>

      {error && <ErrorBox msg={error} />}

      <div>
        <div style={LABEL}>SYSTEM PROMPT TEMPLATE</div>
        <textarea
          value={config.systemPromptTemplate || ''}
          onChange={(e) => update('systemPromptTemplate', e.target.value)}
          style={{ ...TEXTAREA, minHeight: '120px' }}
        />
      </div>

      <div>
        <div style={LABEL}>USER PROMPT TEMPLATE</div>
        <textarea
          value={config.userPromptTemplate || ''}
          onChange={(e) => update('userPromptTemplate', e.target.value)}
          style={TEXTAREA}
        />
        <div style={{ fontSize: 'max(8px, 0.4vw)', opacity: 0.3, marginTop: '0.2rem' }}>
          Variables: {'{archetypeKey}'}, {'{supportGroup}'}, {'{extendedArchetypeName}'}, {'{oceanScores}'}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        <div>
          <div style={LABEL}>DEFAULT PROVIDER</div>
          <select
            value={config.defaultProvider || 'openai'}
            onChange={(e) => update('defaultProvider', e.target.value)}
            style={INPUT_SM}
          >
            <option value="openai">OpenAI</option>
            <option value="gemini">Google Gemini</option>
            <option value="grok">xAI Grok</option>
          </select>
        </div>
        <div>
          <div style={LABEL}>DEFAULT MODEL</div>
          <input
            value={config.defaultModel || ''}
            onChange={(e) => update('defaultModel', e.target.value)}
            style={INPUT_SM}
            placeholder="gpt-4o"
          />
        </div>
        <div>
          <div style={LABEL}>TEMPERATURE</div>
          <input
            type="number" step="0.1" min="0" max="2"
            value={config.temperature ?? 0.7}
            onChange={(e) => update('temperature', e.target.value)}
            style={INPUT_SM}
          />
        </div>
        <div>
          <div style={LABEL}>MAX TOKENS</div>
          <input
            type="number" step="256" min="256" max="16384"
            value={config.maxTokens ?? 2048}
            onChange={(e) => update('maxTokens', e.target.value)}
            style={INPUT_SM}
          />
        </div>
      </div>

      <button onClick={handleSave} disabled={saving}
        style={{ ...BTN, width: '100%', marginTop: '0.3rem', opacity: saving ? 0.5 : 1,
          borderColor: saved ? 'rgba(255, 174, 0, 0.8)' : undefined }}
        onMouseEnter={(e) => hover(e, true)} onMouseLeave={(e) => hover(e, false)}
      >
        {saving ? 'SAVING...' : saved ? '✓ SAVED' : 'SAVE PROMPT CONFIG'}
      </button>
    </div>
  );
});

const QuestionsTab = memo(() => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [expandedLayer, setExpandedLayer] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null); // { layerIndex, question }
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [importing, setImporting] = useState(false);
  const [exportingDocx, setExportingDocx] = useState(false);
  const [importingDocx, setImportingDocx] = useState(false);

  const load = useCallback(() => {
    setError('');
    getQuestions().then(setData).catch((e) => setError(e.message));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSeed = useCallback(async () => {
    setSeeding(true);
    setError('');
    try {
      await seedQuestions();
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSeeding(false);
    }
  }, [load]);

  const handleForceReseed = useCallback(async () => {
    if (!window.confirm('This will WIPE all current questions and replace them with the backend defaults. Continue?')) return;
    setSeeding(true);
    setError('');
    try {
      await seedQuestions({ force: true });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSeeding(false);
    }
  }, [load]);

  const handleExport = useCallback(async () => {
    setError('');
    try {
      const layers = await exportQuestions();
      const json = JSON.stringify(layers, null, 2);
      // Copy to clipboard + download
      navigator.clipboard?.writeText(json);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gfl-questions-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const handleImport = useCallback(async () => {
    setImporting(true);
    setError('');
    try {
      const parsed = JSON.parse(importJson);
      const layers = Array.isArray(parsed) ? parsed : parsed.layers;
      if (!layers) throw new Error('JSON must be an array of layers or { layers: [...] }');
      await importQuestions(layers);
      setShowImport(false);
      setImportJson('');
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  }, [importJson, load]);

  const handleExportDocx = useCallback(async () => {
    setExportingDocx(true);
    setError('');
    try {
      const blob = await exportQuestionsDocx();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gfl-vragen-${Date.now()}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setExportingDocx(false);
    }
  }, []);

  const handleImportDocx = useCallback(async (file) => {
    if (!file) return;
    if (!window.confirm('Dit vervangt ALLE bestaande vragen met het Word-document. Doorgaan?')) return;
    setImportingDocx(true);
    setError('');
    try {
      const result = await importQuestionsDocx(file);
      load();
      window.alert(`✓ Geïmporteerd: ${result.layersImported} lagen, ${result.questionsImported} vragen`);
    } catch (err) {
      setError(err.message);
    } finally {
      setImportingDocx(false);
    }
  }, [load]);

  const startEdit = useCallback((layerIndex, question) => {
    setEditingQuestion({
      layerIndex,
      questionId: question.id,
      text: question.text,
      domain: question.domain,
      answers: question.answers.map(a => ({ ...a })),
    });
    setSaved(false);
  }, []);

  const updateEditField = useCallback((field, value) => {
    setEditingQuestion(prev => ({ ...prev, [field]: value }));
  }, []);

  const updateAnswerText = useCallback((answerIndex, text) => {
    setEditingQuestion(prev => {
      const answers = [...prev.answers];
      answers[answerIndex] = { ...answers[answerIndex], text };
      return { ...prev, answers };
    });
  }, []);

  const handleSaveQuestion = useCallback(async () => {
    if (!editingQuestion) return;
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      await updateQuestion(editingQuestion.questionId, {
        text: editingQuestion.text,
        domain: editingQuestion.domain,
        answers: editingQuestion.answers.map(a => ({ text: a.text })),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      load(); // refresh data
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }, [editingQuestion, load]);

  if (error && !data) return <ErrorBox msg={error} />;
  if (!data) return <Loading />;

  // Not seeded yet — show seed button
  if (!data.seeded || data.layers.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem 0' }}>
        <div style={{ ...LABEL, marginBottom: '0.8rem' }}>QUESTIONS NOT YET IN DATABASE</div>
        <div style={{ fontSize: 'max(10px, 0.5vw)', opacity: 0.5, marginBottom: '1rem' }}>
          Click below to import the 60 default questions into MongoDB.
          <br />Once seeded, you can edit them directly from this panel.
        </div>
        <button onClick={handleSeed} disabled={seeding}
          style={{ ...BTN, padding: '0.6rem 1.5rem', opacity: seeding ? 0.5 : 1 }}
          onMouseEnter={(e) => hover(e, true)} onMouseLeave={(e) => hover(e, false)}>
          {seeding ? 'SEEDING...' : 'SEED DEFAULT QUESTIONS'}
        </button>
        {error && <div style={{ marginTop: '0.5rem' }}><ErrorBox msg={error} /></div>}
      </div>
    );
  }

  // Editing a single question
  if (editingQuestion) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={LABEL}>EDITING Q{editingQuestion.questionId}</div>
          <button onClick={() => setEditingQuestion(null)}
            style={{ ...BTN, padding: '0.2rem 0.6rem', fontSize: 'max(8px, 0.4vw)' }}
            onMouseEnter={(e) => hover(e, true)} onMouseLeave={(e) => hover(e, false)}>
            ← BACK
          </button>
        </div>

        {error && <ErrorBox msg={error} />}

        <div>
          <div style={LABEL}>QUESTION TEXT</div>
          <textarea
            value={editingQuestion.text}
            onChange={(e) => updateEditField('text', e.target.value)}
            style={{ ...TEXTAREA, minHeight: '80px' }}
          />
        </div>

        <div>
          <div style={LABEL}>DOMAIN</div>
          <input
            value={editingQuestion.domain}
            onChange={(e) => updateEditField('domain', e.target.value)}
            style={INPUT_SM}
          />
        </div>

        <div style={LABEL}>ANSWERS (A-F)</div>
        {editingQuestion.answers.map((a, i) => (
          <div key={a.id} style={{ display: 'flex', gap: '0.4rem', alignItems: 'flex-start', marginBottom: '0.3rem' }}>
            <div style={{
              minWidth: '55px', padding: '0.3rem 0.4rem',
              fontSize: 'max(8px, 0.4vw)', opacity: 0.5,
              border: '1px solid rgba(255, 174, 0, 0.1)',
              borderRadius: '0.2rem', textAlign: 'center',
            }}>
              {String.fromCharCode(65 + i)} · {a.archetype}
            </div>
            <textarea
              value={a.text}
              onChange={(e) => updateAnswerText(i, e.target.value)}
              style={{ ...TEXTAREA, minHeight: '50px', flex: 1 }}
            />
          </div>
        ))}

        <button onClick={handleSaveQuestion} disabled={saving}
          style={{ ...BTN, width: '100%', marginTop: '0.3rem', opacity: saving ? 0.5 : 1,
            borderColor: saved ? 'rgba(255, 174, 0, 0.8)' : undefined }}
          onMouseEnter={(e) => hover(e, true)} onMouseLeave={(e) => hover(e, false)}>
          {saving ? 'SAVING...' : saved ? '✓ SAVED' : 'SAVE QUESTION'}
        </button>
      </div>
    );
  }

  // Import JSON view
  if (showImport) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={LABEL}>IMPORT QUESTIONS (JSON)</div>
          <button onClick={() => { setShowImport(false); setImportJson(''); }}
            style={{ ...BTN, padding: '0.2rem 0.6rem', fontSize: 'max(8px, 0.4vw)' }}
            onMouseEnter={(e) => hover(e, true)} onMouseLeave={(e) => hover(e, false)}>
            ← BACK
          </button>
        </div>
        <div style={{ fontSize: 'max(9px, 0.45vw)', opacity: 0.4 }}>
          Paste the full JSON export below. This will REPLACE all existing questions.
        </div>
        {error && <ErrorBox msg={error} />}
        <textarea
          value={importJson}
          onChange={(e) => setImportJson(e.target.value)}
          placeholder='[{ "layerIndex": 0, "name": "...", "questions": [...] }, ...]'
          style={{ ...TEXTAREA, minHeight: '200px', fontFamily: 'monospace', fontSize: 'max(9px, 0.45vw)' }}
        />
        <button onClick={handleImport} disabled={importing || !importJson.trim()}
          style={{ ...BTN, width: '100%', opacity: (importing || !importJson.trim()) ? 0.4 : 1 }}
          onMouseEnter={(e) => hover(e, true)} onMouseLeave={(e) => hover(e, false)}>
          {importing ? 'IMPORTING...' : 'IMPORT & REPLACE ALL'}
        </button>
      </div>
    );
  }

  // Layer list view
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={LABEL}>ASSESSMENT QUESTIONS ({data.layers.reduce((s, l) => s + l.questions.length, 0)} total)</div>
      </div>

      {/* Toolbar: export / import / force re-seed */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        <button onClick={handleExportDocx} disabled={exportingDocx}
          style={{ ...BTN, padding: '0.3rem 0.7rem', fontSize: 'max(8px, 0.4vw)',
            borderColor: 'rgba(188, 19, 254, 0.5)', opacity: exportingDocx ? 0.4 : 1 }}
          onMouseEnter={(e) => hover(e, true)} onMouseLeave={(e) => hover(e, false)}>
          {exportingDocx ? 'EXPORTEREN...' : '📄 EXPORT WORD'}
        </button>
        <label style={{ display: 'inline-flex' }}>
          <input type="file" accept=".docx" style={{ display: 'none' }}
            onChange={(e) => { handleImportDocx(e.target.files[0]); e.target.value = ''; }}
            disabled={importingDocx} />
          <span style={{ ...BTN, padding: '0.3rem 0.7rem', fontSize: 'max(8px, 0.4vw)',
            borderColor: 'rgba(188, 19, 254, 0.5)', opacity: importingDocx ? 0.4 : 1,
            cursor: importingDocx ? 'wait' : 'pointer', display: 'inline-block' }}
            onMouseEnter={(e) => { e.target.style.background = 'rgba(255, 174, 0, 0.15)'; }}
            onMouseLeave={(e) => { e.target.style.background = BTN.background; }}>
            {importingDocx ? 'IMPORTEREN...' : '📄 IMPORT WORD'}
          </span>
        </label>
        <div style={{ borderLeft: '1px solid rgba(255,174,0,0.15)', margin: '0 0.1rem' }} />
        <button onClick={handleExport}
          style={{ ...BTN, padding: '0.3rem 0.7rem', fontSize: 'max(8px, 0.4vw)', opacity: 0.6 }}
          onMouseEnter={(e) => hover(e, true)} onMouseLeave={(e) => hover(e, false)}>
          EXPORT JSON
        </button>
        <button onClick={() => setShowImport(true)}
          style={{ ...BTN, padding: '0.3rem 0.7rem', fontSize: 'max(8px, 0.4vw)', opacity: 0.6 }}
          onMouseEnter={(e) => hover(e, true)} onMouseLeave={(e) => hover(e, false)}>
          IMPORT JSON
        </button>
        <button onClick={handleForceReseed} disabled={seeding}
          style={{ ...BTN, padding: '0.3rem 0.7rem', fontSize: 'max(8px, 0.4vw)',
            borderColor: 'rgba(239, 68, 68, 0.4)', opacity: seeding ? 0.4 : 1 }}
          onMouseEnter={(e) => hover(e, true)} onMouseLeave={(e) => hover(e, false)}>
          {seeding ? 'RE-SEEDING...' : 'FORCE RE-SEED'}
        </button>
      </div>

      {error && <ErrorBox msg={error} />}

      {data.layers.map((layer) => (
        <div key={layer.layerIndex} style={{
          border: '1px solid rgba(255, 174, 0, 0.12)',
          borderRadius: '0.3rem',
          overflow: 'hidden',
        }}>
          {/* Layer header — click to expand */}
          <button
            onClick={() => setExpandedLayer(expandedLayer === layer.layerIndex ? null : layer.layerIndex)}
            style={{
              width: '100%', padding: '0.5rem 0.7rem',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'rgba(255, 174, 0, 0.04)',
              border: 'none', color: '#FFFEF0', cursor: 'pointer',
              fontFamily: "'Lexend Mega', Arial, sans-serif",
              fontSize: 'max(10px, 0.5vw)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                width: '10px', height: '10px', borderRadius: '50%',
                backgroundColor: layer.color, display: 'inline-block',
              }} />
              <span style={{ fontWeight: 'bold' }}>{layer.name}</span>
              <span style={{ opacity: 0.4 }}>{layer.title}</span>
            </div>
            <span style={{ opacity: 0.3 }}>
              {expandedLayer === layer.layerIndex ? '▼' : '►'} {layer.questions.length} Q
            </span>
          </button>

          {/* Expanded: show questions */}
          {expandedLayer === layer.layerIndex && (
            <div style={{ padding: '0.3rem 0.5rem' }}>
              {layer.questions.map((q) => (
                <div key={q.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.3rem 0.4rem', marginBottom: '0.2rem',
                  border: '1px solid rgba(255, 174, 0, 0.06)',
                  borderRadius: '0.2rem', fontSize: 'max(9px, 0.45vw)',
                }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ opacity: 0.4, marginRight: '0.4rem' }}>Q{q.id}</span>
                    {q.text.length > 80 ? q.text.slice(0, 80) + '...' : q.text}
                  </div>
                  <button
                    onClick={() => startEdit(layer.layerIndex, q)}
                    style={{ ...BTN, padding: '0.15rem 0.5rem', fontSize: 'max(8px, 0.4vw)', marginLeft: '0.4rem' }}
                    onMouseEnter={(e) => hover(e, true)} onMouseLeave={(e) => hover(e, false)}>
                    EDIT
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
});

// ═══════════════════════════════════════════════════════════
// Feedback Tab — audit log only (no inquiry form)
// ═══════════════════════════════════════════════════════════
const FEEDBACK_KEY = 'gfl_admin_feedback';

const FeedbackTab = memo(() => {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem(FEEDBACK_KEY) || '[]'); } catch { return []; }
  });

  const tc = CARD_COLORS.gold;

  const markRead = (id) => {
    const updated = items.map((it) => it.id === id ? { ...it, status: it.status === 'gelezen' ? 'nieuw' : 'gelezen' } : it);
    setItems(updated);
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(updated));
  };

  const remove = (id) => {
    const updated = items.filter((it) => it.id !== id);
    setItems(updated);
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(updated));
  };

  const nieuwCount = items.filter((it) => it.status === 'nieuw').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Feedback audit log */}
      <DashboardCard title={`Ontvangen Feedback (${items.length})`} color="gold">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {nieuwCount > 0 && (
            <div style={{
              fontSize: 'max(8px, 0.4vw)', color: C.purple, textTransform: 'uppercase',
              marginBottom: '0.3rem',
            }}>
              {nieuwCount} nieuw{nieuwCount !== 1 ? 'e' : ''} bericht{nieuwCount !== 1 ? 'en' : ''}
            </div>
          )}
          {items.length > 0 ? items.map((it) => (
            <div key={it.id} style={{
              padding: '0.5rem 0.6rem',
              backgroundColor: it.status === 'nieuw' ? 'rgba(188, 19, 254, 0.04)' : tc.cardBg,
              borderLeft: `2px solid ${it.status === 'nieuw' ? C.purple : tc.border}`,
              borderRadius: '0 0.15rem 0.15rem 0',
              transition: 'background-color 0.2s',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontWeight: 'bold', fontSize: 'max(10px, 0.5vw)' }}>{it.naam}</span>
                  {it.status === 'nieuw' && (
                    <span style={{
                      fontSize: 'max(7px, 0.35vw)', padding: '0.05rem 0.25rem', borderRadius: '0.1rem',
                      backgroundColor: 'rgba(188, 19, 254, 0.2)', color: C.purple,
                      textTransform: 'uppercase', fontWeight: 'bold',
                    }}>Nieuw</span>
                  )}
                  {it.type && (
                    <span style={{
                      fontSize: 'max(7px, 0.35vw)', padding: '0.05rem 0.25rem', borderRadius: '0.1rem',
                      backgroundColor: 'rgba(255, 174, 0, 0.12)', color: C.gold,
                      textTransform: 'uppercase',
                    }}>{it.type}</span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ fontSize: 'max(7px, 0.35vw)', color: tc.dimText }}>
                    {new Date(it.ts).toLocaleString('nl-NL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <button onClick={() => markRead(it.id)} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 'max(9px, 0.45vw)', color: it.status === 'gelezen' ? tc.dimText : '#4ade80',
                    padding: '0 0.2rem',
                  }} title={it.status === 'gelezen' ? 'Markeer als nieuw' : 'Markeer als gelezen'}>
                    {it.status === 'gelezen' ? '○' : '●'}
                  </button>
                  <button onClick={() => remove(it.id)} style={{
                    background: 'none', border: 'none', color: 'rgba(239,68,68,0.5)',
                    cursor: 'pointer', fontSize: 'max(9px, 0.45vw)', padding: '0 0.2rem',
                  }}
                    onMouseEnter={(e) => { e.target.style.color = '#ef4444'; }}
                    onMouseLeave={(e) => { e.target.style.color = 'rgba(239,68,68,0.5)'; }}>
                    ✕
                  </button>
                </div>
              </div>
              {it.email !== '—' && it.email && (
                <div style={{ fontSize: 'max(8px, 0.4vw)', color: tc.dimText, marginBottom: '0.15rem' }}>{it.email}</div>
              )}
              <div style={{ fontSize: 'max(9px, 0.45vw)', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {it.bericht}
              </div>
            </div>
          )) : (
            <div style={{ textAlign: 'center', color: tc.dimText, padding: '2rem 0', textTransform: 'uppercase', fontSize: 'max(9px, 0.45vw)' }}>
              Geen feedback ontvangen
            </div>
          )}
        </div>
      </DashboardCard>
    </div>
  );
});


// ═══════════════════════════════════════════════════════════
// Contact Tab — clients met detailpages + verzoeken + bewerkfunctie
// ═══════════════════════════════════════════════════════════
const CONTACT_REQUESTS_KEY = 'gfl_contact_requests';
const BRAND_EDITS_KEY = 'gfl_brand_edits';

const ContactTab = memo(() => {
  const [requests, setRequests] = useState(() => {
    try { return JSON.parse(localStorage.getItem(CONTACT_REQUESTS_KEY) || '[]'); } catch { return []; }
  });
  const [edits, setEdits] = useState(() => {
    try { return JSON.parse(localStorage.getItem(BRAND_EDITS_KEY) || '{}'); } catch { return {}; }
  });
  const [editingBrand, setEditingBrand] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', tagline: '', description: '', email: '' });
  const [section, setSection] = useState('clients'); // clients | requests
  const [editSaved, setEditSaved] = useState(false);

  const tc = CARD_COLORS.gold;

  /* Load brand with any saved edits */
  const getBrand = (brand) => {
    const saved = edits[brand.id];
    return saved ? { ...brand, ...saved } : brand;
  };

  /* Start editing a brand */
  const startEdit = (brand) => {
    const b = getBrand(brand);
    setEditForm({ name: b.name, tagline: b.tagline, description: b.description, email: b.email || '' });
    setEditingBrand(brand.id);
  };

  /* Save brand edits */
  const saveEdit = () => {
    const updated = { ...edits, [editingBrand]: { ...editForm } };
    setEdits(updated);
    localStorage.setItem(BRAND_EDITS_KEY, JSON.stringify(updated));
    setEditingBrand(null);
    setEditSaved(true);
    setTimeout(() => setEditSaved(false), 2000);
  };

  /* Reset brand to original */
  const resetBrand = (brandId) => {
    const updated = { ...edits };
    delete updated[brandId];
    setEdits(updated);
    localStorage.setItem(BRAND_EDITS_KEY, JSON.stringify(updated));
  };

  const removeRequest = (id) => {
    const updated = requests.filter((r) => r.id !== id);
    setRequests(updated);
    localStorage.setItem(CONTACT_REQUESTS_KEY, JSON.stringify(updated));
  };

  const markRequestRead = (id) => {
    const updated = requests.map((r) => r.id === id ? { ...r, status: r.status === 'nieuw' ? 'afgehandeld' : 'nieuw' } : r);
    setRequests(updated);
    localStorage.setItem(CONTACT_REQUESTS_KEY, JSON.stringify(updated));
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

  const nieuwRequests = requests.filter((r) => r.status === 'nieuw').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Section toggles */}
      <div style={{ display: 'flex', gap: '0.4rem' }}>
        {[
          { key: 'clients', label: `Detailpagina Klanten (${BRANDS.length})` },
          { key: 'requests', label: `Verzoeken${nieuwRequests > 0 ? ` (${nieuwRequests} nieuw)` : ''}` },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setSection(key)} style={TAB_STYLE(section === key)}
            onMouseEnter={(e) => { if (section !== key) e.target.style.background = 'rgba(255, 174, 0, 0.15)'; }}
            onMouseLeave={(e) => { if (section !== key) e.target.style.background = TAB_STYLE(false).background; }}>
            {label}
          </button>
        ))}
      </div>

      {editSaved && (
        <div style={{ fontSize: 'max(8px, 0.4vw)', color: '#4ade80', textTransform: 'uppercase', textAlign: 'center' }}>
          ✓ Wijzigingen opgeslagen
        </div>
      )}

      {section === 'clients' && (
        <DashboardCard title="Klanten met Detailpagina" color="gold">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {BRANDS.map((brand) => {
              const b = getBrand(brand);
              const isEditing = editingBrand === brand.id;
              const hasEdits = !!edits[brand.id];

              return (
                <div key={brand.id} style={{
                  padding: '0.6rem 0.8rem',
                  border: `1px solid ${tc.rowBorder}`,
                  borderLeft: `3px solid ${brand.accentColor || C.gold}`,
                  borderRadius: '0 0.25rem 0.25rem 0',
                  transition: 'background-color 0.2s',
                }}
                  onMouseEnter={(e) => { if (!isEditing) e.currentTarget.style.backgroundColor = tc.cardBg; }}
                  onMouseLeave={(e) => { if (!isEditing) e.currentTarget.style.backgroundColor = 'transparent'; }}>

                  {!isEditing ? (
                    /* Display mode */
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                          <span style={{ fontWeight: 'bold', fontSize: 'max(11px, 0.55vw)', color: C.text }}>{b.name}</span>
                          <span style={{
                            fontSize: 'max(7px, 0.35vw)', padding: '0.05rem 0.3rem', borderRadius: '0.1rem',
                            backgroundColor: `${brand.accentColor || C.gold}22`, color: brand.accentColor || C.gold,
                            textTransform: 'uppercase',
                          }}>#{brand.id}</span>
                          {hasEdits && (
                            <span style={{
                              fontSize: 'max(7px, 0.35vw)', padding: '0.05rem 0.25rem', borderRadius: '0.1rem',
                              backgroundColor: 'rgba(74, 222, 128, 0.15)', color: '#4ade80',
                              textTransform: 'uppercase',
                            }}>Bewerkt</span>
                          )}
                        </div>
                        <div style={{ fontSize: 'max(9px, 0.45vw)', opacity: 0.5, marginBottom: '0.15rem' }}>{b.tagline}</div>
                        <div style={{ fontSize: 'max(8px, 0.42vw)', color: tc.dimText }}>
                          {b.origin} · {b.foundedYear} · {b.email || '—'}
                          {b.tags && ` · ${b.tags.join(', ')}`}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0 }}>
                        <button onClick={() => startEdit(brand)}
                          style={{ ...BTN, padding: '0.25rem 0.5rem', fontSize: 'max(8px, 0.4vw)' }}
                          onMouseEnter={(e) => hover(e, true)} onMouseLeave={(e) => hover(e, false)}>
                          ✏ Bewerken
                        </button>
                        {hasEdits && (
                          <button onClick={() => resetBrand(brand.id)}
                            style={{ ...BTN, padding: '0.25rem 0.5rem', fontSize: 'max(8px, 0.4vw)', borderColor: 'rgba(239,68,68,0.5)', color: '#fca5a5' }}
                            onMouseEnter={(e) => { e.target.style.background = 'rgba(239, 68, 68, 0.2)'; }}
                            onMouseLeave={(e) => { e.target.style.background = BTN.background; }}>
                            ↩ Reset
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Edit mode */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ fontSize: 'max(9px, 0.45vw)', color: C.gold, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        ✏ Bewerk: {brand.name}
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 'max(7px, 0.38vw)', color: tc.dimText, textTransform: 'uppercase', marginBottom: '0.15rem' }}>Naam</div>
                          <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} style={inputStyle}
                            onFocus={(e) => { e.target.style.borderColor = C.gold; }} onBlur={(e) => { e.target.style.borderColor = tc.rowBorder; }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 'max(7px, 0.38vw)', color: tc.dimText, textTransform: 'uppercase', marginBottom: '0.15rem' }}>E-mail</div>
                          <input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} style={inputStyle}
                            onFocus={(e) => { e.target.style.borderColor = C.gold; }} onBlur={(e) => { e.target.style.borderColor = tc.rowBorder; }} />
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 'max(7px, 0.38vw)', color: tc.dimText, textTransform: 'uppercase', marginBottom: '0.15rem' }}>Tagline</div>
                        <input value={editForm.tagline} onChange={(e) => setEditForm({ ...editForm, tagline: e.target.value })} style={inputStyle}
                          onFocus={(e) => { e.target.style.borderColor = C.gold; }} onBlur={(e) => { e.target.style.borderColor = tc.rowBorder; }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 'max(7px, 0.38vw)', color: tc.dimText, textTransform: 'uppercase', marginBottom: '0.15rem' }}>Beschrijving</div>
                        <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          rows={3}
                          style={{ ...inputStyle, resize: 'vertical' }}
                          onFocus={(e) => { e.target.style.borderColor = C.gold; }} onBlur={(e) => { e.target.style.borderColor = tc.rowBorder; }} />
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button onClick={saveEdit} style={{ ...BTN, fontSize: 'max(9px, 0.45vw)' }}
                          onMouseEnter={(e) => hover(e, true)} onMouseLeave={(e) => hover(e, false)}>✓ Opslaan</button>
                        <button onClick={() => setEditingBrand(null)}
                          style={{ ...BTN, fontSize: 'max(9px, 0.45vw)', borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.4)' }}
                          onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.05)'; }}
                          onMouseLeave={(e) => { e.target.style.background = BTN.background; }}>Annuleren</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </DashboardCard>
      )}

      {section === 'requests' && (
        <>
          <DashboardCard title={`Contactverzoeken (${requests.length})`} color="gold">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {requests.length > 0 ? requests.map((r) => (
                <div key={r.id} style={{
                  padding: '0.5rem 0.6rem',
                  backgroundColor: r.status === 'nieuw' ? 'rgba(188, 19, 254, 0.04)' : tc.cardBg,
                  borderLeft: `2px solid ${r.status === 'nieuw' ? C.purple : tc.border}`,
                  borderRadius: '0 0.15rem 0.15rem 0',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontWeight: 'bold', fontSize: 'max(10px, 0.5vw)' }}>{r.naam}</span>
                      {r.status === 'nieuw' && (
                        <span style={{
                          fontSize: 'max(7px, 0.35vw)', padding: '0.05rem 0.25rem', borderRadius: '0.1rem',
                          backgroundColor: 'rgba(188, 19, 254, 0.2)', color: C.purple,
                          textTransform: 'uppercase', fontWeight: 'bold',
                        }}>Nieuw</span>
                      )}
                      {r.status === 'afgehandeld' && (
                        <span style={{
                          fontSize: 'max(7px, 0.35vw)', padding: '0.05rem 0.25rem', borderRadius: '0.1rem',
                          backgroundColor: 'rgba(74, 222, 128, 0.15)', color: '#4ade80',
                          textTransform: 'uppercase',
                        }}>Afgehandeld</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span style={{ fontSize: 'max(7px, 0.35vw)', color: tc.dimText }}>
                        {new Date(r.ts).toLocaleString('nl-NL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <button onClick={() => markRequestRead(r.id)} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: 'max(9px, 0.45vw)', color: r.status === 'afgehandeld' ? tc.dimText : '#4ade80',
                        padding: '0 0.2rem',
                      }} title={r.status === 'afgehandeld' ? 'Markeer als nieuw' : 'Markeer als afgehandeld'}>
                        {r.status === 'afgehandeld' ? '○' : '●'}
                      </button>
                      <button onClick={() => removeRequest(r.id)} style={{
                        background: 'none', border: 'none', color: 'rgba(239,68,68,0.5)',
                        cursor: 'pointer', fontSize: 'max(9px, 0.45vw)', padding: '0 0.2rem',
                      }}
                        onMouseEnter={(e) => { e.target.style.color = '#ef4444'; }}
                        onMouseLeave={(e) => { e.target.style.color = 'rgba(239,68,68,0.5)'; }}>
                        ✕
                      </button>
                    </div>
                  </div>
                  {r.email !== '—' && r.email && (
                    <div style={{ fontSize: 'max(8px, 0.4vw)', color: tc.dimText, marginBottom: '0.15rem' }}>{r.email}</div>
                  )}
                  <div style={{ fontSize: 'max(9px, 0.45vw)', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {r.bericht}
                  </div>
                </div>
              )) : (
                <div style={{ textAlign: 'center', color: tc.dimText, padding: '2rem 0', textTransform: 'uppercase', fontSize: 'max(9px, 0.45vw)' }}>
                  Geen contactverzoeken
                </div>
              )}
            </div>
          </DashboardCard>
        </>
      )}
    </div>
  );
});


// ═══════════════════════════════════════════════════════════
// Gedeelde UI-elementen
// ═══════════════════════════════════════════════════════════

function Loading() {
  return <div style={{ textAlign: 'center', opacity: 0.4, padding: '1.5rem 0' }}>Laden...</div>;
}

function ErrorBox({ msg }) {
  return (
    <div style={{
      padding: '0.4rem', borderRadius: '0.25rem',
      backgroundColor: 'rgba(239, 68, 68, 0.15)',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      color: '#fca5a5', fontSize: 'max(10px, 0.5vw)', textAlign: 'center',
    }}>
      {msg}
    </div>
  );
}
