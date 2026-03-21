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
  uploadPromptDocument,
  getPromptDocuments,
  deletePromptDocument,
  verifyPromptDocuments,
  getQuestions,
  seedQuestions,
  updateQuestion,
  exportQuestions,
  importQuestions,
  exportQuestionsDocx,
  importQuestionsDocx,
  getApiStatus,
  getProviders,
  sendFormDirect,
  getSessions,
  getAdminReviews,
  logActivity,
  getAccessLog,
  getConsentLog,
  clearSessions,
} from '../../utils/apiClient';
import {
  BTN, LABEL, TEXTAREA, INPUT_SM, TAB_STYLE,
  hover, C, FONT, SciFiButton,
} from './dashboardStyles';
import { BRANDS } from '../../pages/GeneralBrandPage/brandData';
import InvoiceTemplate from './InvoiceTemplate';
import CreditNoteTemplate from './CreditNoteTemplate';
import EmailTemplate from './EmailTemplate';

// ── Mobile detection context ──
const MobileCtx = React.createContext(false);

// Mobile-only tab style (standalone, no BTN spread)
const MOBILE_TAB_STYLE = (active) => ({
  fontSize: 'max(10px, 0.55vw)',
  padding: '0.3rem 0',
  letterSpacing: '0.02em',
  width: '100%',
  textAlign: 'center',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'visible',
  background: active
    ? 'linear-gradient(135deg, rgba(255, 174, 0, 0.2), rgba(255, 174, 0, 0.3))'
    : 'linear-gradient(135deg, rgba(255, 174, 0, 0.03), rgba(255, 174, 0, 0.06))',
  border: '1px solid',
  borderColor: active ? 'rgba(255, 174, 0, 0.7)' : 'rgba(255, 174, 0, 0.2)',
  color: C.gold,
  borderRadius: 'max(2px, 0.15vw)',
  cursor: 'pointer',
  fontFamily: FONT,
  transition: 'all 0.3s',
  textTransform: 'uppercase',
  fontWeight: 'bold',
});

// ═══════════════════════════════════════════════════════════
// DashboardCard — inline-style version of HoloAuth's HoloCard
// Supports 'gold' (primary) and 'purple' (secondary) themes
// ═══════════════════════════════════════════════════════════
const CARD_COLORS = {
  gold: {
    border: '#f97316',
    shadow: '0 0 15px rgba(249, 115, 22, 0.3)',
    titleColor: '#f97316',
    dimText: 'rgba(249, 115, 22, 0.35)',
    rowBorder: 'rgba(249, 115, 22, 0.12)',
    cardBg: 'rgba(249, 115, 22, 0.04)',
    iconBg: 'rgba(249, 115, 22, 0.08)',
  },
  purple: {
    border: '#a855f7',
    shadow: '0 0 15px rgba(168, 85, 247, 0.3)',
    titleColor: '#a855f7',
    dimText: 'rgba(168, 85, 247, 0.35)',
    rowBorder: 'rgba(168, 85, 247, 0.12)',
    cardBg: 'rgba(168, 85, 247, 0.04)',
    iconBg: 'rgba(168, 85, 247, 0.08)',
  },
  green: {
    border: '#4ade80',
    shadow: '0 0 15px rgba(74, 222, 128, 0.3)',
    titleColor: '#4ade80',
    dimText: 'rgba(74, 222, 128, 0.35)',
    rowBorder: 'rgba(74, 222, 128, 0.12)',
    cardBg: 'rgba(74, 222, 128, 0.04)',
    iconBg: 'rgba(74, 222, 128, 0.08)',
  },
  cyan: {
    border: '#06b6d4',
    shadow: '0 0 15px rgba(6, 182, 212, 0.3)',
    titleColor: '#06b6d4',
    dimText: 'rgba(6, 182, 212, 0.35)',
    rowBorder: 'rgba(6, 182, 212, 0.12)',
    cardBg: 'rgba(6, 182, 212, 0.04)',
    iconBg: 'rgba(6, 182, 212, 0.08)',
  },
};

function DashboardCard({ children, title, color = 'gold', className, style = {} }) {
  const isMobile = React.useContext(MobileCtx);
  const t = CARD_COLORS[color] || CARD_COLORS.gold;
  return (
    <div style={{
      position: 'relative',
      backgroundColor: 'rgba(1, 0, 2, 0.3)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: `1px solid ${t.border}`,
      boxShadow: t.shadow,
      borderRadius: '0.5rem',
      padding: '1.25rem',
      fontFamily: FONT,
      color: C.text,
      fontSize: 'max(12px, 0.65vw)',
      ...(isMobile
        ? { overflow: 'hidden', maxWidth: '100%', boxSizing: 'border-box' }
        : { overflow: 'hidden' }
      ),
      ...style,
    }}>
      {!isMobile && title && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          marginBottom: '0.8rem',
          paddingBottom: '0.6rem',
          borderBottom: `1px solid ${t.border}`,
        }}>
          <div style={{
            width: '3px', height: '1rem',
            backgroundColor: t.border,
            borderRadius: '1px',
          }} />
          <span style={{
            fontSize: 'max(10px, 0.5vw)',
            fontWeight: 'bold',
            color: t.titleColor,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}>{title}</span>
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

const CORNER = (pos, mobile) => {
  const off = mobile ? '0.475rem' : '-0.125rem';
  return {
    position: 'absolute',
    width: 'max(0.7rem, 1vw)', height: 'max(0.7rem, 1vw)',
    border: '1.5px solid #a855f7',
    pointerEvents: 'none', zIndex: 3,
    ...(pos === 'tl' && { top: off, left: off, borderRadius: '10px 0 0 0', borderBottom: 'none', borderRight: 'none' }),
    ...(pos === 'tr' && { top: off, right: off, borderRadius: '0 10px 0 0', borderBottom: 'none', borderLeft: 'none' }),
    ...(pos === 'bl' && { bottom: off, left: off, borderRadius: '0 0 0 10px', borderTop: 'none', borderRight: 'none' }),
    ...(pos === 'br' && { bottom: off, right: off, borderRadius: '0 0 10px 0', borderTop: 'none', borderLeft: 'none' }),
  };
};

const AdminDashboardModal = memo(({ user, onLogout, onClose }) => {
  useLanguage();
  const [tab, setTab] = useState('overview');

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const tabStyle = isMobile ? MOBILE_TAB_STYLE : TAB_STYLE;

  return (
    <MobileCtx.Provider value={isMobile}>
    <style>{`
      @keyframes dashHoloSheen {
        0%   { background-position: 200% 200%; }
        50%  { background-position: 0% 0%; }
        100% { background-position: 200% 200%; }
      }
      @keyframes dashHoloScanline {
        0%   { background-position: 0 -200%; }
        100% { background-position: 0 200%; }
      }
    `}</style>
    {/* Outer shell — fixed size, positioning context for corners */}
    <div style={{ position: 'relative', width: isMobile ? '96vw' : '90vw', maxWidth: '1280px', height: isMobile ? '82vh' : '85vh', padding: isMobile ? '0.6rem' : 0 }}>
      {/* Corner brackets — positioned on the inner panel edge */}
      <div style={CORNER('tl', isMobile)} />
      <div style={CORNER('tr', isMobile)} />
      <div style={CORNER('bl', isMobile)} />
      <div style={CORNER('br', isMobile)} />

      {/* Inner panel — fills fixed outer shell */}
      <div style={{
        position: 'relative',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'rgba(1, 0, 2, 0.3)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: 'max(4px, 0.5vw)',
        boxShadow: '0 6px 30px rgba(0,0,0,0.7), 0 12px 60px rgba(0,0,0,0.5), 0 0 80px rgba(0,0,0,0.35), 0 0 120px rgba(0,0,0,0.15), inset 0 0 12px rgba(168,85,247,0.06), inset 0 0 30px rgba(168,85,247,0.03)',
        color: C.text,
        fontFamily: FONT,
        fontSize: 'max(12px, 0.65vw)',
        ...(isMobile ? {} : { overflow: 'hidden' }),
      }}>
        {/* Holographic sheen — Eyedentity glass skin */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 'max(4px, 0.5vw)', pointerEvents: 'none', zIndex: 1,
          background: 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.015) 30%, transparent 50%, rgba(255,255,255,0.01) 70%, transparent 100%)',
          backgroundSize: '400% 400%',
          animation: 'dashHoloSheen 45s ease-in-out infinite',
          mixBlendMode: 'screen',
        }} />
        {/* Scanline sweep */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 'max(4px, 0.5vw)', pointerEvents: 'none', zIndex: 1,
          background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.008) 48%, rgba(255,255,255,0.015) 50%, rgba(255,255,255,0.008) 52%, transparent 100%)',
          backgroundSize: '100% 300%',
          animation: 'dashHoloScanline 12s linear infinite',
        }} />

        {/* Title bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: isMobile ? 'max(0.4rem, 0.55vw) max(0.7rem, 1vw)' : '0.3rem 0.7rem',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          backgroundColor: 'rgba(42, 10, 56, 0.35)',
          position: 'relative', zIndex: 2,
        }}>
          {isMobile ? (
            <>
              <div />
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <SciFiButton onClick={onClose} size="sm" padding="0.35rem 1rem" fontSize="max(9px, 0.48vw)">← Terug</SciFiButton>
                <SciFiButton onClick={onLogout} variant="danger" size="sm" padding="0.35rem 1rem" fontSize="max(9px, 0.48vw)">Uitloggen</SciFiButton>
              </div>
            </>
          ) : (
            <>
              <div />
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <SciFiButton onClick={onClose} size="sm" padding="0.35rem 1rem" fontSize="max(9px, 0.48vw)">← Terug</SciFiButton>
                <SciFiButton onClick={onLogout} variant="danger" size="sm" padding="0.35rem 1rem" fontSize="max(9px, 0.48vw)">Uitloggen</SciFiButton>
              </div>
            </>
          )}
        </div>

        {/* Scrollable content area — fills remaining space */}
        <div style={{
          position: 'relative', zIndex: 10,
          padding: isMobile ? 'max(1rem, 1.5vw) max(1.4rem, 2.5vw)' : '1.5rem',
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          ...(isMobile ? { overflowX: 'hidden', maxWidth: '100%', wordBreak: 'break-word' } : {}),
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? 'max(1rem, 1.5vw)' : '1.5rem',
        }}>
      {/* ── Koptekst — HoloAuth Dashboard structuur ── */}
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid rgba(168, 85, 247, 0.15)',
        paddingBottom: isMobile ? 'max(0.8rem, 1.2vw)' : '0.8rem',
      }}>
        <div>
          <h1 style={{
            fontSize: isMobile ? 'max(18px, 1.4vw)' : 'max(22px, 1.4vw)', fontWeight: 'bold',
            color: C.gold, textTransform: 'uppercase',
            letterSpacing: '0.2em', fontFamily: FONT, margin: 0,
            textShadow: '0 0 5px #f97316, 0 0 10px #f97316',
          }}>
            Commandocentrum
          </h1>
        </div>
      </header>

      {/* ── Tab Navigatie ── */}
      {isMobile ? (() => {
        const topRows = [
          { key: 'overview', label: 'Overzicht' },
          { key: 'users', label: 'Gebruikers' },
          { key: 'questions', label: 'Vragen' },
          { key: 'prompts', label: 'Prompts' },
        ];
        const bottomRow = [
          { key: 'assessments', label: 'Assessments' },
          { key: 'formulieren', label: 'Formulieren' },
          { key: 'audit', label: 'Audit Log' },
          { key: 'feedback', label: 'Feedback' },
          { key: 'contact', label: 'Contact' },
        ];
        const renderBtn = ({ key, label, disabled }) => (
          <SciFiButton key={key} onClick={() => !disabled && setTab(key)} disabled={disabled} active={tab === key} fullWidth>
            {label.toUpperCase()}
          </SciFiButton>
        );
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.9rem' }}>
              {topRows.map(renderBtn)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.9rem', width: '100%' }}>
              {bottomRow.map(renderBtn)}
            </div>
          </div>
        );
      })() : (
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {[
            { key: 'overview', label: 'Overzicht' },
            { key: 'users', label: 'Gebruikers' },
            { key: 'assessments', label: 'Assessments' },
            { key: 'questions', label: 'Vragen' },
            { key: 'prompts', label: 'Prompts' },
            { key: 'formulieren', label: 'Formulieren' },
            { key: 'audit', label: 'Audit Log' },
            { key: 'contact', label: 'Contact' },
          ].map(({ key, label, disabled }) => (
            <SciFiButton key={key} onClick={() => !disabled && setTab(key)} disabled={disabled} active={tab === key}>
              {label.toUpperCase()}
            </SciFiButton>
          ))}
        </div>
      )}

      {/* ── Tab Inhoud ── */}
      {tab === 'overview' && <OverviewTab user={user} />}
      {tab === 'users' && <UsersTab currentUserId={user.id} />}
      {tab === 'assessments' && <AssessmentsTab adminEmail={user?.email} />}
      {tab === 'questions' && <QuestionsTab />}
      {tab === 'prompts' && <PromptsTab />}
      {tab === 'formulieren' && <FormulierenTab />}
      {tab === 'audit' && <AuditLogTab />}
      {tab === 'contact' && <ContactTab />}
        </div>

      </div>
    </div>
    </MobileCtx.Provider>
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
  const isMobile = React.useContext(MobileCtx);
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
    const iv = setInterval(() => setErrorLog(getStoredErrors()), 30000);
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
      <div style={isMobile
        ? { display: 'flex', flexDirection: 'column', gap: 'max(1rem, 1.5vw)' }
        : { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }
      }>
        {/* Kaart 1: Identiteitsmatrix (goud) — gebruikersprofiel */}
        <DashboardCard title="Identiteitsmatrix" color="gold">
          <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 'max(0.5rem, 0.8vw)' : '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 'max(0.5rem, 0.8vw)' : '0.8rem' }}>
              <div style={{
                width: isMobile ? 'max(2.5rem, 3.5vw)' : '3.5rem', height: isMobile ? 'max(2.5rem, 3.5vw)' : '3.5rem', borderRadius: '50%',
                backgroundColor: tc.iconBg, border: `1px solid ${tc.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: isMobile ? 'max(1rem, 1.5vw)' : '1.5rem',
              }}>🛡</div>
              <div>
                <div style={{ fontSize: 'max(9px, 0.45vw)', color: tc.dimText, textTransform: 'uppercase' }}>Status</div>
                <div style={{ color: C.gold, fontWeight: 'bold' }}>OPERATIONEEL</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 'max(0.25rem, 0.4vw)' : '0.4rem', marginTop: isMobile ? 'max(0.3rem, 0.5vw)' : '0.5rem' }}>
              {[
                ['Gebruiker', user.displayName || '—'],
                ['E-mail Protocol', user.email],
                ['Toegangsniveau', (user.role || 'client').toUpperCase()],
                ['Sessie', 'ACTIEF'],
              ].map(([label, value]) => (
                <div key={label} style={{
                  display: 'flex', justifyContent: 'space-between',
                  borderBottom: `1px solid ${tc.rowBorder}`, paddingBottom: isMobile ? 'max(0.25rem, 0.35vw)' : '0.35rem',
                }}>
                  <span style={{ color: tc.dimText, fontSize: 'max(9px, 0.45vw)', textTransform: 'uppercase', ...(isMobile ? { flexShrink: 0, width: '30%' } : {}) }}>{label}</span>
                  <span style={{ fontSize: 'max(10px, 0.5vw)', fontFamily: FONT, ...(isMobile ? { textAlign: 'right', flex: 1 } : {}) }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </DashboardCard>

        {/* Kaart 2: Admin Notities (paars) — opslaan van notities */}
        <DashboardCard title="Admin Notities" color="purple">
          <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 'max(0.35rem, 0.5vw)' : '0.5rem' }}>
            <div style={{ display: 'flex', gap: isMobile ? 'max(0.25rem, 0.4vw)' : '0.4rem' }}>
              <input
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addNote(); }}
                placeholder="Notitie toevoegen..."
                style={{
                  flex: 1,
                  padding: isMobile ? 'max(0.6rem, 0.8vw) max(0.6rem, 0.9vw)' : '0.4rem 0.6rem',
                  ...(isMobile ? { minHeight: '2.5rem' } : {}),
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  border: `1px solid ${pc.rowBorder}`,
                  borderRadius: isMobile ? 'max(2px, 0.25vw)' : '0.25rem',
                  color: C.text, fontFamily: FONT,
                  fontSize: 'max(9px, 0.45vw)',
                  outline: 'none',
                }}
                onFocus={(e) => { e.target.style.borderColor = C.purple; }}
                onBlur={(e) => { e.target.style.borderColor = pc.rowBorder; }}
              />
              <SciFiButton onClick={addNote} variant="purple" size="sm" padding={isMobile ? 'max(0.25rem, 0.35vw) max(0.4rem, 0.6vw)' : '0.35rem 0.6rem'} fontSize="max(9px, 0.45vw)">+</SciFiButton>
            </div>
            {notesSaved && (
              <div style={{ fontSize: 'max(8px, 0.4vw)', color: '#4ade80', textTransform: 'uppercase' }}>
                ✓ Opgeslagen
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 'max(0.25rem, 0.35vw)' : '0.35rem', maxHeight: isMobile ? '30vh' : '220px', overflowY: 'auto' }}>
              {notes.length > 0 ? notes.map((n) => (
                <div key={n.id} style={{
                  padding: isMobile ? 'max(0.3rem, 0.4vw) max(0.4rem, 0.6vw)' : '0.4rem 0.6rem',
                  backgroundColor: pc.cardBg,
                  border: `1px solid ${pc.rowBorder}`,
                  borderRadius: isMobile ? 'max(2px, 0.25vw)' : '0.25rem',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: isMobile ? 'max(0.25rem, 0.4vw)' : '0.4rem',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 'max(10px, 0.5vw)', wordBreak: 'break-word' }}>{n.text}</div>
                    <div style={{ fontSize: 'max(7px, 0.35vw)', color: pc.dimText, marginTop: isMobile ? 'max(0.15rem, 0.2vw)' : '0.2rem' }}>
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
                <SciFiButton onClick={clearLog} variant="danger" size="xs" padding="0.2rem 0.4rem" fontSize="max(7px, 0.38vw)">Log Wissen</SciFiButton>
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
      {isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {[
            { label: 'Backend API', key: 'backend', desc: 'REST / MongoDB' },
            { label: 'AI Provider', key: 'ai', desc: 'Gemini / Analyse' },
            { label: 'PDF Service', key: 'pdf', desc: 'Rapportgeneratie' },
            { label: 'Encryptie', key: 'encryption', desc: 'AES-256-GCM / PII' },
          ].map(({ label, key, desc }) => (
            <DashboardCard key={key} color="gold" style={{ padding: '1rem 1.25rem' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
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
            </DashboardCard>
          ))}
        </div>
      ) : (
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
      )}

      {/* ── 4-Kolommen Statistieken Voettekst ── */}
      <div style={isMobile
        ? { display: 'flex', flexDirection: 'column', gap: '0.6rem' }
        : { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.8rem' }
      }>
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
  const isMobile = React.useContext(MobileCtx);
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
              {u.email} · Aangemaakt: {new Date(u.createdAt).toLocaleDateString('nl-NL')}
              {u.lastLogin && <> · Laatste login: {new Date(u.lastLogin).toLocaleString('nl-NL', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</>}
              {!u.lastLogin && <> · <span style={{ color: '#f59e0b' }}>Nog niet ingelogd</span></>}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', ...(isMobile ? { flexWrap: 'wrap' } : {}) }}>
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
                <SciFiButton onClick={() => toggleRole(u._id, u.role || 'client')} disabled={busy === u._id} size="xs" padding="0.2rem 0.5rem" fontSize="max(8px, 0.4vw)">
                  {u.role === 'admin' ? '→ CLIENT' : '→ ADMIN'}
                </SciFiButton>
                <SciFiButton onClick={() => handleDeleteUser(u._id, u.displayName || u.email)} disabled={deleting === u._id} variant="danger" size="xs" padding="0.2rem 0.5rem" fontSize="max(8px, 0.4vw)">
                  {deleting === u._id ? '...' : '✕'}
                </SciFiButton>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
});

const AssessmentsTab = memo(({ adminEmail }) => {
  const isMobile = React.useContext(MobileCtx);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState(null); // full assessment detail
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [deleting, setDeleting] = useState(null); // id being deleted
  const [reviews, setReviews] = useState([]); // reviews for this assessment

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
    setReviews([]);
    try {
      const d = await getAdminAssessment(id);
      setDetail(d);

      // Audit log: record which assessment report was viewed
      logActivity({
        type: 'report_view',
        reportId: String(id),
        reportType: 'assessment',
        message: d?.archetypeKey || '',
        email: adminEmail || '',
      }).catch((e) => console.warn('[GFL] logActivity failed:', e));
      
      // Fetch reviews for this assessment
      try {
        const reviewsData = await getAdminReviews({ limit: 100 });
        const assessmentReviews = reviewsData.reviews.filter(r => r.assessmentId === id);
        setReviews(assessmentReviews);
      } catch (err) {
        console.warn('[AssessmentsTab] Could not fetch reviews:', err.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingDetail(false);
    }
  }, [adminEmail]);

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
          <SciFiButton onClick={() => setDetail(null)} size="xs" padding="0.2rem 0.6rem" fontSize="max(8px, 0.4vw)">← BACK</SciFiButton>
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
        <div style={{ display: 'flex', gap: '0.4rem', ...(isMobile ? { flexWrap: 'wrap' } : {}) }}>
          <SciFiButton onClick={() => handleDownloadPdf(d._id)} size="sm" padding="0.3rem 0.7rem" fontSize="max(8px, 0.4vw)">PDF ↓</SciFiButton>
          <SciFiButton onClick={() => handleDelete(d._id)} disabled={deleting === d._id} variant="danger" size="sm" padding="0.3rem 0.7rem" fontSize="max(8px, 0.4vw)">
            {deleting === d._id ? 'DELETING...' : 'DELETE'}
          </SciFiButton>
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

        {/* User Feedback / Reviews */}
        {reviews.length > 0 && (
          <div>
            <div style={LABEL}>USER FEEDBACK ({reviews.length})</div>
            {reviews.map((review, idx) => (
              <div key={review._id || idx} style={{
                padding: '0.5rem', marginBottom: '0.4rem',
                borderRadius: '0.2rem',
                border: '1px solid rgba(100, 200, 100, 0.15)',
                backgroundColor: 'rgba(100, 200, 100, 0.04)',
              }}>
                <div style={{ fontSize: 'max(9px, 0.45vw)', opacity: 0.6, marginBottom: '0.3rem' }}>
                  <div>{new Date(review.timestamp).toLocaleString()} · {review.userId ? '👤 Registered' : '👤 Anonymous'}</div>
                </div>

                {review.whatWorked && (
                  <div style={{ marginBottom: '0.25rem' }}>
                    <div style={{ ...LABEL, fontSize: 'max(9px, 0.45vw)', marginBottom: '0.1rem' }}>✓ WHAT WORKED</div>
                    <div style={{
                      padding: '0.3rem 0.4rem', fontSize: 'max(8px, 0.42vw)',
                      backgroundColor: 'rgba(100, 200, 100, 0.08)',
                      borderRadius: '0.15rem', lineHeight: 1.4,
                    }}>
                      {review.whatWorked}
                    </div>
                  </div>
                )}

                {review.whatDidntWork && (
                  <div style={{ marginBottom: '0.25rem' }}>
                    <div style={{ ...LABEL, fontSize: 'max(9px, 0.45vw)', marginBottom: '0.1rem' }}>✗ WHAT DIDN'T WORK</div>
                    <div style={{
                      padding: '0.3rem 0.4rem', fontSize: 'max(8px, 0.42vw)',
                      backgroundColor: 'rgba(239, 68, 68, 0.08)',
                      borderRadius: '0.15rem', lineHeight: 1.4,
                    }}>
                      {review.whatDidntWork}
                    </div>
                  </div>
                )}

                {review.suggestions && (
                  <div>
                    <div style={{ ...LABEL, fontSize: 'max(9px, 0.45vw)', marginBottom: '0.1rem' }}>💡 SUGGESTIONS</div>
                    <div style={{
                      padding: '0.3rem 0.4rem', fontSize: 'max(8px, 0.42vw)',
                      backgroundColor: 'rgba(59, 130, 246, 0.08)',
                      borderRadius: '0.15rem', lineHeight: 1.4,
                    }}>
                      {review.suggestions}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {reviews.length === 0 && (
          <div style={{ padding: '0.5rem', fontSize: 'max(9px, 0.45vw)', opacity: 0.4, textAlign: 'center' }}>
            No user feedback yet
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
              <SciFiButton onClick={() => viewDetail(a._id)} disabled={loadingDetail} size="xs" padding="0.15rem 0.5rem" fontSize="max(8px, 0.4vw)">VIEW</SciFiButton>
              <SciFiButton onClick={() => handleDelete(a._id)} disabled={deleting === a._id} variant="danger" size="xs" padding="0.15rem 0.5rem" fontSize="max(8px, 0.4vw)">
                {deleting === a._id ? '...' : '✕'}
              </SciFiButton>
            </div>
          </div>
        ))
      )}
    </div>
  );
});

const PromptsTab = memo(() => {
  const isMobile = React.useContext(MobileCtx);
  const [promptLevel, setPromptLevel] = useState('advanced');
  const subTabStyle = isMobile ? MOBILE_TAB_STYLE : TAB_STYLE;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
      {/* Level sub-tabs */}
      <div style={{ display: 'flex', gap: '0.4rem' }}>
        {LEVEL_TABS.map(({ key, label }) => (
          <SciFiButton key={key} onClick={() => setPromptLevel(key)} active={promptLevel === key}>
            {label.toUpperCase()}
          </SciFiButton>
        ))}
      </div>

      {/* Level content */}
      {promptLevel === 'advanced' ? (
        <PromptsTabContent />
      ) : (
        <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <div style={{ fontSize: 'max(16px, 0.9vw)', fontWeight: 'bold', color: C.gold, marginBottom: '0.8rem' }}>
            PROMPTS — {promptLevel.toUpperCase()}
          </div>
          <div style={{ fontSize: 'max(11px, 0.55vw)', opacity: 0.4, maxWidth: '400px', margin: '0 auto' }}>
            Prompt configuratie voor dit level is nog in ontwikkeling.
          </div>
        </div>
      )}
    </div>
  );
});

const PromptsTabContent = memo(() => {
  const isMobile = React.useContext(MobileCtx);
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

  const mLABEL = isMobile ? { ...LABEL, fontSize: '13px' } : LABEL;
  const mTEXTAREA = isMobile ? { ...TEXTAREA, fontSize: '14px', padding: '0.6rem' } : TEXTAREA;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
      <div style={mLABEL}>AI PROMPT CONFIGURATION</div>
      <div style={{ fontSize: isMobile ? '13px' : 'max(9px, 0.45vw)', opacity: 0.4 }}>
        These templates control what the AI model receives. Only admins can edit this.
      </div>

      {error && <ErrorBox msg={error} />}

      <div>
        <div style={mLABEL}>SYSTEM PROMPT</div>
        <div style={{ fontSize: isMobile ? '12px' : 'max(8px, 0.4vw)', opacity: 0.3, marginBottom: '0.3rem' }}>
          Dit is de instructie die de AI ontvangt om alle assessment data te interpreteren.
        </div>
        <textarea
          value={config.systemPromptTemplate || ''}
          onChange={(e) => update('systemPromptTemplate', e.target.value)}
          style={{ ...mTEXTAREA, minHeight: '160px' }}
        />
      </div>

      <SciFiButton onClick={handleSave} disabled={saving} fullWidth size="lg" style={{ marginTop: '0.3rem' }} active={saved}>
        {saving ? 'SAVING...' : saved ? '✓ SAVED' : 'SAVE PROMPT CONFIG'}
      </SciFiButton>

      {/* ── Context Documents Section ── */}
      <div style={{ marginTop: '1.2rem', borderTop: '1px solid rgba(255,174,0,0.15)', paddingTop: '1rem' }}>
        <div style={mLABEL}>CONTEXT DOCUMENTEN</div>
        <div style={{ fontSize: isMobile ? '13px' : 'max(9px, 0.45vw)', opacity: 0.4, marginBottom: '0.5rem' }}>
          Upload Word, PDF of tekst bestanden. De inhoud wordt automatisch meegestuurd met elk AI verzoek als kennisbank context.
        </div>

        <ContextDocumentsSection />
      </div>
    </div>
  );
});

// ── Context Documents Sub-component ──
const ContextDocumentsSection = memo(() => {
  const isMobile = React.useContext(MobileCtx);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(null); // null | { verified, documents, totalChars }
  const fileInputRef = React.useRef(null);

  const loadDocuments = useCallback(async () => {
    try {
      setError('');
      const { documents: docs } = await getPromptDocuments();
      setDocuments(docs || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDocuments(); }, [loadDocuments]);

  const handleUpload = useCallback(async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError('');
    setVerified(null); // Reset verification status on new upload
    try {
      for (const file of files) {
        await uploadPromptDocument(file);
      }
      await loadDocuments();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }, [loadDocuments]);

  const handleDelete = useCallback(async (docId, filename) => {
    if (!window.confirm(`Document "${filename}" verwijderen? Dit kan niet ongedaan worden.`)) return;
    try {
      setError('');
      await deletePromptDocument(docId);
      setDocuments((prev) => prev.filter((d) => d._id !== docId));
      setVerified(null); // Reset verification status after change
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const handleVerify = useCallback(async () => {
    setVerifying(true);
    setError('');
    setVerified(null);
    try {
      const result = await verifyPromptDocuments();
      setVerified(result);
      if (!result.verified && result.totalDocuments > 0) {
        const invalid = result.documents.filter((d) => !d.hasText);
        setError(`${invalid.length} document(en) bevatten geen leesbare tekst: ${invalid.map((d) => d.filename).join(', ')}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setVerifying(false);
    }
  }, []);

  const handleFileInput = (e) => {
    handleUpload(Array.from(e.target.files));
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(Array.from(e.dataTransfer.files));
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const fileIcon = (mimetype) => {
    if (mimetype === 'application/pdf') return '📄';
    if (mimetype?.includes('word')) return '📝';
    return '📃';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {error && <ErrorBox msg={error} />}

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? 'rgba(255,174,0,0.7)' : 'rgba(255,174,0,0.2)'}`,
          borderRadius: '8px',
          padding: '1rem',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragOver ? 'rgba(255,174,0,0.05)' : 'transparent',
          transition: 'all 0.2s',
        }}
      >
        <div style={{ fontSize: 'max(18px, 1vw)', marginBottom: '0.3rem' }}>
          {uploading ? '⏳' : '📁'}
        </div>
        <div style={{ fontSize: isMobile ? '14px' : 'max(10px, 0.5vw)', color: C.gold, opacity: 0.7 }}>
          {uploading ? 'Uploading...' : 'Sleep bestanden hierheen of klik om te uploaden'}
        </div>
        <div style={{ fontSize: isMobile ? '12px' : 'max(8px, 0.4vw)', opacity: 0.3, marginTop: '0.2rem' }}>
          PDF, Word (.docx), TXT — max 20 MB
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.doc,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />
      </div>

      {/* Document list */}
      {loading ? (
        <Loading />
      ) : documents.length === 0 ? (
        <div style={{ fontSize: isMobile ? '13px' : 'max(9px, 0.45vw)', opacity: 0.3, textAlign: 'center', padding: '0.5rem' }}>
          Geen documenten geüpload. Upload bestanden om de AI kennisbank te vullen.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          {documents.map((doc) => (
            <div
              key={doc._id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.4rem 0.6rem',
                background: 'rgba(255,174,0,0.04)',
                border: '1px solid rgba(255,174,0,0.1)',
                borderRadius: '6px',
                fontSize: isMobile ? '13px' : 'max(9px, 0.45vw)',
              }}
            >
              <span style={{ fontSize: isMobile ? '18px' : 'max(14px, 0.7vw)' }}>{fileIcon(doc.mimetype)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: C.gold, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {doc.filename}
                </div>
                <div style={{ opacity: 0.4, fontSize: isMobile ? '12px' : 'max(8px, 0.38vw)' }}>
                  {formatSize(doc.size)} · {doc.charCount?.toLocaleString()} tekens · {new Date(doc.uploadedAt).toLocaleDateString('nl-NL')}
                </div>
              </div>
              <SciFiButton onClick={() => handleDelete(doc._id, doc.filename)} variant="danger" size="xs" padding="0.15rem 0.4rem" fontSize={isMobile ? '12px' : 'max(8px, 0.4vw)'}>✕</SciFiButton>
            </div>
          ))}
          <div style={{ fontSize: isMobile ? '12px' : 'max(8px, 0.38vw)', opacity: 0.3, textAlign: 'right' }}>
            {documents.length} document{documents.length !== 1 ? 'en' : ''} · totaal {documents.reduce((s, d) => s + (d.charCount || 0), 0).toLocaleString()} tekens
          </div>
        </div>
      )}

      {/* Verify / Save button */}
      {documents.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.3rem' }}>
              <SciFiButton
                onClick={handleVerify}
                disabled={verifying}
                fullWidth size="lg"
                color={verified?.verified ? '#00ff9d' : undefined}
                rgb={verified?.verified ? '0, 255, 157' : undefined}
                active={verified?.verified}
              >
                {verifying ? '⏳ VERIFYING...' : verified?.verified ? '✓ DOCUMENTEN GEVERIFIEERD' : '💾 SAVE & VERIFY DOCUMENTEN'}
              </SciFiButton>

          {/* Verification result */}
          {verified && verified.verified && (
            <div style={{
              padding: '0.5rem 0.7rem',
              background: 'rgba(0,255,157,0.06)',
              border: '1px solid rgba(0,255,157,0.2)',
              borderRadius: '6px',
              fontSize: isMobile ? '13px' : 'max(9px, 0.45vw)',
            }}>
              <div style={{ color: '#00ff9d', fontWeight: 600, marginBottom: '0.3rem' }}>
                ✓ Alle {verified.totalDocuments} document{verified.totalDocuments !== 1 ? 'en' : ''} succesvol geverifieerd
              </div>
              <div style={{ opacity: 0.5, fontSize: isMobile ? '12px' : 'max(8px, 0.4vw)' }}>
                {verified.totalChars?.toLocaleString()} tekens worden meegestuurd als AI kennisbank context
              </div>
              {verified.documents?.map((doc) => (
                <div key={doc._id} style={{ marginTop: '0.3rem', padding: '0.3rem', background: 'rgba(0,255,157,0.03)', borderRadius: '4px' }}>
                  <div style={{ color: C.gold, fontSize: isMobile ? '12px' : 'max(8px, 0.4vw)', fontWeight: 600 }}>
                    {doc.filename} — {doc.charCount?.toLocaleString()} tekens
                  </div>
                  <div style={{ opacity: 0.4, fontSize: isMobile ? '11px' : 'max(7px, 0.35vw)', marginTop: '0.1rem', fontStyle: 'italic' }}>
                    "{doc.preview}"
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

const LEVEL_TABS = [
  { key: 'beginner', label: 'Beginner' },
  { key: 'intermediate', label: 'Intermediate' },
  { key: 'advanced', label: 'Advanced' },
];

const QuestionsTab = memo(() => {
  const isMobile = React.useContext(MobileCtx);
  const [level, setLevel] = useState('advanced');
  const subTabStyle = isMobile ? MOBILE_TAB_STYLE : TAB_STYLE;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
      {/* Level sub-tabs */}
      <div style={{ display: 'flex', gap: '0.4rem' }}>
        {LEVEL_TABS.map(({ key, label }) => (
          <SciFiButton key={key} onClick={() => setLevel(key)} active={level === key}>
            {label.toUpperCase()}
          </SciFiButton>
        ))}
      </div>

      {/* Level content */}
      {level === 'advanced' ? (
        <QuestionsTabAdvanced />
      ) : (
        <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <div style={{ fontSize: 'max(16px, 0.9vw)', fontWeight: 'bold', color: C.gold, marginBottom: '0.8rem' }}>
            VRAGEN — {level.toUpperCase()}
          </div>
          <div style={{ fontSize: 'max(11px, 0.55vw)', opacity: 0.4, maxWidth: '400px', margin: '0 auto' }}>
            Dit vragenset is nog in ontwikkeling en wordt binnenkort toegevoegd.
          </div>
        </div>
      )}
    </div>
  );
});

const QuestionsTabAdvanced = memo(() => {
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
        <SciFiButton onClick={handleSeed} disabled={seeding} size="lg">
          {seeding ? 'SEEDING...' : 'SEED DEFAULT QUESTIONS'}
        </SciFiButton>
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
          <SciFiButton onClick={() => setEditingQuestion(null)} size="xs" padding="0.2rem 0.6rem" fontSize="max(8px, 0.4vw)">← BACK</SciFiButton>
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

        <SciFiButton onClick={handleSaveQuestion} disabled={saving} fullWidth size="lg" style={{ marginTop: '0.3rem' }} active={saved}>
          {saving ? 'SAVING...' : saved ? '✓ SAVED' : 'SAVE QUESTION'}
        </SciFiButton>
      </div>
    );
  }

  // Import JSON view
  if (showImport) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={LABEL}>IMPORT QUESTIONS (JSON)</div>
          <SciFiButton onClick={() => { setShowImport(false); setImportJson(''); }} size="xs" padding="0.2rem 0.6rem" fontSize="max(8px, 0.4vw)">← BACK</SciFiButton>
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
        <SciFiButton onClick={handleImport} disabled={importing || !importJson.trim()} fullWidth size="lg">
          {importing ? 'IMPORTING...' : 'IMPORT & REPLACE ALL'}
        </SciFiButton>
      </div>
    );
  }

  // Layer list view
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={LABEL}>VRAGEN — ADVANCED ({data.layers.reduce((s, l) => s + l.questions.length, 0)} total)</div>
      </div>

      {/* Toolbar: export / import / force re-seed */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        <SciFiButton onClick={handleExportDocx} disabled={exportingDocx} variant="purple" size="sm" padding="0.3rem 0.7rem" fontSize="max(8px, 0.4vw)">
          {exportingDocx ? 'EXPORTEREN...' : '📄 EXPORT WORD'}
        </SciFiButton>
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
        <SciFiButton onClick={handleExport} size="sm" padding="0.3rem 0.7rem" fontSize="max(8px, 0.4vw)" style={{ opacity: 0.6 }}>EXPORT JSON</SciFiButton>
        <SciFiButton onClick={() => setShowImport(true)} size="sm" padding="0.3rem 0.7rem" fontSize="max(8px, 0.4vw)" style={{ opacity: 0.6 }}>IMPORT JSON</SciFiButton>
        <SciFiButton onClick={handleForceReseed} disabled={seeding} variant="danger" size="sm" padding="0.3rem 0.7rem" fontSize="max(8px, 0.4vw)">
          {seeding ? 'RE-SEEDING...' : 'FORCE RE-SEED'}
        </SciFiButton>
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
                  <SciFiButton onClick={() => startEdit(layer.layerIndex, q)} size="xs" padding="0.15rem 0.5rem" fontSize="max(8px, 0.4vw)" style={{ marginLeft: '0.4rem' }}>EDIT</SciFiButton>
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
// Formulieren Tab — document templates (invoices, inquiries, requests)
// ═══════════════════════════════════════════════════════════

const FORM_TEMPLATES = [
  { id: 'factuur', label: 'Factuur', icon: '🧾', type: 'excel', desc: 'Factuur template voor cliënten en zakelijke partners', status: 'gereed' },
  { id: 'creditnota', label: 'Creditnota', icon: '📋', type: 'excel', desc: 'Creditnota template voor correcties en terugbetalingen', status: 'gereed' },
  { id: 'email', label: 'E-mail', icon: '📧', type: 'word', desc: 'E-mail verzenden met PDF bijlagen', status: 'gereed' },
  { id: 'intake', label: 'Intake Formulier', icon: '📋', type: 'word', desc: 'Standaard intake formulier voor nieuwe cliënten', status: 'gereed' },
  { id: 'offerte', label: 'Offerte', icon: '📄', type: 'word', desc: 'Offerte template voor diensten en pakketten', status: 'concept' },
  { id: 'verzoek', label: 'Verzoek Indienen', icon: '📨', type: 'word', desc: 'Intern verzoekformulier voor aanvragen en goedkeuringen', status: 'gereed' },
  { id: 'rapportage', label: 'Rapportage', icon: '📊', type: 'pdf', desc: 'Rapportage template voor sessie- en voortgangsverslagen', status: 'concept' },
  { id: 'overeenkomst', label: 'Overeenkomst', icon: '📝', type: 'word', desc: 'Contract- en overeenkomst template voor samenwerking', status: 'gereed' },
  { id: 'brief', label: 'Zakelijke Brief', icon: '✉️', type: 'word', desc: 'Standaard brieftemplate met Garden For Life huisstijl', status: 'concept' },
  { id: 'evaluatie', label: 'Evaluatie', icon: '🔍', type: 'word', desc: 'Evaluatieformulier voor coaching trajecten', status: 'concept' },
];

const TYPE_COLORS = {
  word: { bg: 'rgba(37, 99, 235, 0.12)', text: '#60a5fa', label: 'WORD' },
  pdf: { bg: 'rgba(239, 68, 68, 0.12)', text: '#f87171', label: 'PDF' },
  excel: { bg: 'rgba(34, 197, 94, 0.12)', text: '#4ade80', label: 'EXCEL' },
};

const PassThrough = ({ children }) => children;

const FormulierenTab = memo(() => {
  const isMobile = React.useContext(MobileCtx);
  const CardWrap = isMobile ? PassThrough : DashboardCard;
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [editorContent, setEditorContent] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [sendingState, setSendingState] = useState(null); // null | 'sending' | 'sent' | 'error'
  const [sendError, setSendError] = useState('');
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const tc = CARD_COLORS.gold;

  // When selecting a template, reset editor
  const handleSelectTemplate = (tmplId) => {
    if (selectedTemplate === tmplId) {
      setSelectedTemplate(null);
      return;
    }
    setSelectedTemplate(tmplId);
    setEditorContent('');
    setEmailBody('');
    setRecipientEmail('');
    setRecipientName('');
    setEmailSubject('');
    setSendingState(null);
    setSendError('');
  };

  // Send via email directly (no DB save)
  const handleSend = async () => {
    const tmpl = FORM_TEMPLATES.find(t => t.id === selectedTemplate);
    if (!tmpl || !emailBody.trim()) return;
    if (!recipientEmail.trim()) { setSendError('Vul een e-mailadres in'); return; }
    setSendingState('sending');
    setSendError('');
    try {
      await sendFormDirect({
        templateId: tmpl.id,
        templateLabel: tmpl.label,
        type: tmpl.type,
        content: emailBody,
        recipientEmail,
        subject: emailSubject || undefined,
      });
      setSendingState('sent');
      setTimeout(() => setSendingState(null), 3000);
    } catch (err) {
      console.error('Send error:', err);
      setSendError(err.message || 'Versturen mislukt');
      setSendingState('error');
      setTimeout(() => setSendingState(null), 4000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Stats bar */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{
          flex: 1, minWidth: '120px', padding: '0.6rem 0.8rem',
          backgroundColor: 'rgba(255, 174, 0, 0.04)', borderRadius: '0.3rem',
          borderLeft: `2px solid ${C.gold}`,
        }}>
          <div style={{ fontSize: 'max(8px, 0.4vw)', color: tc.dimText, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Templates</div>
          <div style={{ fontSize: 'max(16px, 0.9vw)', fontWeight: 'bold', color: C.gold }}>{FORM_TEMPLATES.length}</div>
        </div>
      </div>

      {/* Template selector */}
      {isMobile ? (
        <div>
          {/* Toggle button */}
          <button
            onClick={() => setShowTemplateMenu(!showTemplateMenu)}
            style={{
              width: '100%', padding: '0.6rem 0.8rem',
              backgroundColor: 'rgba(255, 174, 0, 0.06)',
              border: `1px solid ${showTemplateMenu ? 'rgba(255, 174, 0, 0.5)' : 'rgba(255, 174, 0, 0.2)'}`,
              borderRadius: '0.3rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              color: C.gold, fontFamily: FONT, fontSize: 'max(11px, 0.55vw)',
              fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em',
              transition: 'all 0.2s',
            }}
          >
            <span>{selectedTemplate
              ? `${FORM_TEMPLATES.find(t => t.id === selectedTemplate)?.icon || ''} ${FORM_TEMPLATES.find(t => t.id === selectedTemplate)?.label || 'Template'}`
              : 'Kies een template'}</span>
            <span style={{ fontSize: '0.7rem', transition: 'transform 0.2s', transform: showTemplateMenu ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
          </button>
          {/* Slide menu */}
          <div style={{
            maxHeight: showTemplateMenu ? '50vh' : '0',
            overflow: showTemplateMenu ? 'auto' : 'hidden',
            transition: 'max-height 0.3s ease',
            display: 'flex', flexDirection: 'column', gap: '0.35rem',
            marginTop: showTemplateMenu ? '0.4rem' : '0',
          }}>
            {FORM_TEMPLATES.map((tmpl) => {
              const typeStyle = TYPE_COLORS[tmpl.type] || TYPE_COLORS.word;
              const isSelected = selectedTemplate === tmpl.id;
              return (
                <button
                  key={tmpl.id}
                  onClick={() => { handleSelectTemplate(tmpl.id); setShowTemplateMenu(false); }}
                  style={{
                    textAlign: 'left', cursor: 'pointer', border: 'none',
                    padding: '0.55rem 0.8rem',
                    backgroundColor: isSelected ? 'rgba(255, 174, 0, 0.1)' : tc.cardBg,
                    borderRadius: '0.25rem',
                    borderLeft: `2px solid ${isSelected ? C.gold : tc.border}`,
                    transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    color: C.text, fontFamily: FONT,
                  }}
                >
                  <span style={{ fontSize: 'max(14px, 0.75vw)' }}>{tmpl.icon}</span>
                  <span style={{ fontWeight: 'bold', fontSize: 'max(10px, 0.55vw)', color: C.gold, flex: 1 }}>{tmpl.label}</span>
                  <span style={{
                    fontSize: 'max(7px, 0.38vw)', padding: '0.1rem 0.3rem',
                    borderRadius: '0.1rem', backgroundColor: typeStyle.bg,
                    color: typeStyle.text, fontWeight: 'bold', textTransform: 'uppercase',
                  }}>{typeStyle.label}</span>
                  <span style={{
                    fontSize: 'max(7px, 0.38vw)', padding: '0.1rem 0.3rem',
                    borderRadius: '0.1rem',
                    backgroundColor: tmpl.status === 'gereed' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(250, 204, 21, 0.12)',
                    color: tmpl.status === 'gereed' ? '#4ade80' : '#facc15',
                    fontWeight: 'bold', textTransform: 'uppercase',
                  }}>{tmpl.status}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <CardWrap title="Document Templates" color="gold">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(220px, 100%), 1fr))',
            gap: '0.6rem',
          }}>
            {FORM_TEMPLATES.map((tmpl) => {
              const typeStyle = TYPE_COLORS[tmpl.type] || TYPE_COLORS.word;
              const isSelected = selectedTemplate === tmpl.id;
              return (
                <button
                  key={tmpl.id}
                  onClick={() => handleSelectTemplate(tmpl.id)}
                  style={{
                    textAlign: 'left', cursor: 'pointer', border: 'none',
                    padding: '0.7rem 0.8rem',
                    backgroundColor: isSelected ? 'rgba(255, 174, 0, 0.08)' : tc.cardBg,
                    borderRadius: '0.3rem',
                    borderLeft: `2px solid ${isSelected ? C.gold : tc.border}`,
                    transition: 'all 0.2s',
                    display: 'flex', flexDirection: 'column', gap: '0.35rem',
                    color: C.text,
                  }}
                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(255, 174, 0, 0.05)'; }}
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = tc.cardBg; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: 'max(14px, 0.75vw)' }}>{tmpl.icon}</span>
                      <span style={{ fontWeight: 'bold', fontSize: 'max(10px, 0.55vw)', color: C.gold }}>{tmpl.label}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span style={{
                        fontSize: 'max(7px, 0.35vw)', padding: '0.1rem 0.3rem',
                        borderRadius: '0.1rem', backgroundColor: typeStyle.bg,
                        color: typeStyle.text, fontWeight: 'bold', textTransform: 'uppercase',
                      }}>{typeStyle.label}</span>
                      <span style={{
                        fontSize: 'max(7px, 0.35vw)', padding: '0.1rem 0.3rem',
                        borderRadius: '0.1rem',
                        backgroundColor: tmpl.status === 'gereed' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(250, 204, 21, 0.12)',
                        color: tmpl.status === 'gereed' ? '#4ade80' : '#facc15',
                        fontWeight: 'bold', textTransform: 'uppercase',
                      }}>{tmpl.status}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 'max(8px, 0.42vw)', color: tc.dimText, lineHeight: 1.5 }}>
                    {tmpl.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </CardWrap>
      )}

      {/* Editor panel — shows when a template is selected */}
      {selectedTemplate && (() => {
        const tmpl = FORM_TEMPLATES.find(t => t.id === selectedTemplate);
        if (!tmpl) return null;
        const typeStyle = TYPE_COLORS[tmpl.type] || TYPE_COLORS.word;

        // ── Factuur uses dedicated InvoiceTemplate component ──
        if (selectedTemplate === 'factuur') {
          return (
            <CardWrap title={`${tmpl.icon} ${tmpl.label}`} color="gold">
              <InvoiceTemplate isMobile={isMobile} />
            </CardWrap>
          );
        }

        // ── Creditnota uses dedicated CreditNoteTemplate component ──
        if (selectedTemplate === 'creditnota') {
          return (
            <CardWrap title={`${tmpl.icon} ${tmpl.label}`} color="gold">
              <CreditNoteTemplate isMobile={isMobile} />
            </CardWrap>
          );
        }

        // ── Email uses dedicated EmailTemplate component ──
        if (selectedTemplate === 'email') {
          return (
            <CardWrap title={`${tmpl.icon} ${tmpl.label}`} color="gold">
              <EmailTemplate isMobile={isMobile} />
            </CardWrap>
          );
        }

        // ── All other templates use the generic textarea editor ──
        return (
          <>
          <CardWrap title={`${tmpl.icon} ${tmpl.label} — Template`} color="gold">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {/* Toolbar */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.4rem 0.6rem',
                backgroundColor: 'rgba(255, 174, 0, 0.04)',
                borderRadius: '0.2rem',
                borderBottom: `1px solid ${tc.border}`,
                flexWrap: 'wrap', gap: '0.3rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                    fontSize: 'max(7px, 0.35vw)', padding: '0.1rem 0.3rem',
                    borderRadius: '0.1rem', backgroundColor: typeStyle.bg,
                    color: typeStyle.text, fontWeight: 'bold',
                  }}>{typeStyle.label} TEMPLATE</span>
                  <span style={{ fontSize: 'max(8px, 0.42vw)', color: tc.dimText }}>
                    {tmpl.label}.{tmpl.type === 'excel' ? 'xlsx' : tmpl.type === 'word' ? 'docx' : 'pdf'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.3rem' }}>
                  <SciFiButton onClick={() => {
                    if (!editorContent.trim()) return;
                    const blob = new Blob([editorContent], { type: 'text/plain;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = `${tmpl.label}.txt`;
                    document.body.appendChild(a); a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }} disabled={!editorContent.trim()} size="xs" padding="0.2rem 0.5rem" fontSize="max(8px, 0.4vw)">DOWNLOADEN</SciFiButton>
                </div>
              </div>

              {/* Template content area */}
              <textarea
                value={editorContent}
                onChange={(e) => setEditorContent(e.target.value)}
                placeholder={`Template-inhoud voor "${tmpl.label}"...\n\nImporteer of bewerk hier het documentsjabloon. Dit is de template — niet de e-mailtekst.`}
                style={{
                  width: '100%', minHeight: '250px', padding: '0.8rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  color: C.text, border: `1px solid ${tc.border}`,
                  borderRadius: '0.2rem', outline: 'none',
                  fontFamily: FONT, fontSize: 'max(10px, 0.5vw)',
                  lineHeight: 1.7, resize: 'vertical',
                }}
              />
            </div>
          </CardWrap>

          {/* E-mail versturen — below the template editor */}
          <CardWrap title={`✉ E-mail Versturen — ${tmpl.label}`} color="gold">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {/* Recipient fields */}
              <div style={isMobile
                ? { display: 'flex', flexDirection: 'column', gap: '0.4rem' }
                : { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem' }
              }>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                  <label style={{ fontSize: 'max(7px, 0.35vw)', color: tc.dimText, textTransform: 'uppercase' }}>Ontvanger E-mail *</label>
                  <input
                    type="email" value={recipientEmail}
                    onChange={(e) => { setRecipientEmail(e.target.value); setSendError(''); }}
                    placeholder="naam@voorbeeld.nl"
                    style={{
                      padding: '0.3rem 0.4rem', fontSize: 'max(9px, 0.45vw)',
                      backgroundColor: 'rgba(255,255,255,0.03)', color: C.text,
                      border: `1px solid ${sendError && !recipientEmail ? '#f87171' : tc.border}`,
                      borderRadius: '0.15rem', outline: 'none',
                      fontFamily: FONT,
                    }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                  <label style={{ fontSize: 'max(7px, 0.35vw)', color: tc.dimText, textTransform: 'uppercase' }}>Naam Ontvanger</label>
                  <input
                    type="text" value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Optioneel"
                    style={{
                      padding: '0.3rem 0.4rem', fontSize: 'max(9px, 0.45vw)',
                      backgroundColor: 'rgba(255,255,255,0.03)', color: C.text,
                      border: `1px solid ${tc.border}`,
                      borderRadius: '0.15rem', outline: 'none',
                      fontFamily: FONT,
                    }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                  <label style={{ fontSize: 'max(7px, 0.35vw)', color: tc.dimText, textTransform: 'uppercase' }}>Onderwerp</label>
                  <input
                    type="text" value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder={`Garden For Life — ${tmpl.label}`}
                    style={{
                      padding: '0.3rem 0.4rem', fontSize: 'max(9px, 0.45vw)',
                      backgroundColor: 'rgba(255,255,255,0.03)', color: C.text,
                      border: `1px solid ${tc.border}`,
                      borderRadius: '0.15rem', outline: 'none',
                      fontFamily: FONT,
                    }}
                  />
                </div>
              </div>

              {sendError && (
                <div style={{ fontSize: 'max(8px, 0.4vw)', color: '#f87171' }}>
                  ✗ {sendError}
                </div>
              )}

              {/* Email body textarea */}
              <textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder={`Typ hier de e-mailtekst voor "${tmpl.label}"...\n\nDeze tekst wordt als e-mailinhoud verstuurd naar de ontvanger.`}
                style={{
                  width: '100%', minHeight: '180px', padding: '0.8rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  color: C.text, border: `1px solid ${tc.border}`,
                  borderRadius: '0.2rem', outline: 'none',
                  fontFamily: FONT, fontSize: 'max(10px, 0.5vw)',
                  lineHeight: 1.7, resize: 'vertical',
                }}
              />

              {/* Send button row */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.5rem 0.6rem',
                backgroundColor: 'rgba(188, 19, 254, 0.03)',
                borderRadius: '0.2rem',
                border: '1px solid rgba(188, 19, 254, 0.1)',
              }}>
                <div style={{ fontSize: 'max(8px, 0.42vw)', color: tc.dimText }}>
                  {emailBody.trim()
                    ? `${emailBody.trim().length} tekens — klaar om te versturen`
                    : 'Schrijf de e-mailtekst in het veld hierboven'}
                  {sendingState === 'sent' && <span style={{ marginLeft: '0.5rem', color: '#4ade80', fontWeight: 'bold' }}>✓ Verstuurd!</span>}
                </div>
                <SciFiButton onClick={handleSend} disabled={sendingState === 'sending' || !emailBody.trim() || !recipientEmail.trim()} variant="purple" size="sm" padding="0.3rem 0.8rem" fontSize="max(9px, 0.45vw)">{sendingState === 'sending' ? 'BEZIG MET VERSTUREN...' : '✉ VERSTUREN'}</SciFiButton>
              </div>
            </div>
          </CardWrap>
          </>
        );
      })()}
    </div>
  );
});


// ═══════════════════════════════════════════════════════════
// Feedback Tab — audit log only (no inquiry form)
// ═══════════════════════════════════════════════════════════

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
          <SciFiButton key={key} onClick={() => setSection(key)} active={section === key}>
            {label}
          </SciFiButton>
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
                        <SciFiButton onClick={() => startEdit(brand)} size="xs" padding="0.25rem 0.5rem" fontSize="max(8px, 0.4vw)">✏ Bewerken</SciFiButton>
                        {hasEdits && (
                          <SciFiButton onClick={() => resetBrand(brand.id)} variant="danger" size="xs" padding="0.25rem 0.5rem" fontSize="max(8px, 0.4vw)">↩ Reset</SciFiButton>
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
                        <SciFiButton onClick={saveEdit} size="sm" fontSize="max(9px, 0.45vw)">✓ Opslaan</SciFiButton>
                        <SciFiButton onClick={() => setEditingBrand(null)} variant="white" size="sm" fontSize="max(9px, 0.45vw)">Annuleren</SciFiButton>
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

// ═══════════════════════════════════════════════════════════
// Audit Log Tab — categorized audit trail with folder sub-tabs
// ═══════════════════════════════════════════════════════════

function formatDuration(ms) {
  if (!ms || ms <= 0) return '< 1m';
  const totalSec = Math.floor(ms / 1000);
  if (totalSec < 60) return `${totalSec}s`;
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min < 60) return `${min}m ${sec}s`;
  const hr = Math.floor(min / 60);
  const rm = min % 60;
  return `${hr}u ${rm}m`;
}

const EVENT_ICONS  = { edit: '✏️', commit: '📦', push: '🚀', admin_login: '🔐', report_view: '📋', consent_given: '✅' };
const EVENT_COLORS = { edit: '#60a5fa', commit: '#4ade80', push: '#c084fc', admin_login: '#f59e0b', report_view: '#34d399', consent_given: '#06b6d4' };

const AUDIT_FOLDERS = [
  { key: 'admin',   label: '📂 Admin & Toegang',  icon: '🔐', color: '#f59e0b', desc: 'Admin logins & rapportraadplegingen' },
  { key: 'compliance', label: '📂 Compliance',     icon: '✅', color: '#06b6d4', desc: 'Toestemmingsregistratie (AVG Art. 7)' },
  { key: 'sessions', label: '📂 Sessies',          icon: '📊', color: C.gold,    desc: 'Alle events gegroepeerd per sessie' },
];

const AuditLogTab = memo(() => {
  const [folder, setFolder] = useState('admin');
  const [sessions, setSessions] = useState([]);
  const [accessEvents, setAccessEvents] = useState([]);
  const [consentEvents, setConsentEvents] = useState([]);
  const [totalEvents, setTotalEvents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedIdx, setExpandedIdx] = useState(null);
  const tc = CARD_COLORS.gold;

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sessRes, accRes, conRes] = await Promise.all([
        getSessions(200).catch(() => ({ sessions: [], totalEvents: 0 })),
        getAccessLog(500).catch(() => ({ events: [] })),
        getConsentLog(500).catch(() => ({ events: [] })),
      ]);
      setSessions(sessRes.sessions || []);
      setTotalEvents(sessRes.totalEvents || 0);
      setAccessEvents(accRes.events || []);
      setConsentEvents(conRes.events || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // eslint-disable-next-line no-unused-vars
  const handleClear = async () => {
    if (!window.confirm('Alle dev-activiteit wissen? Dit kan niet ongedaan worden.')) return;
    try {
      await clearSessions();
      setSessions([]);
      setTotalEvents(0);
    } catch (err) {
      setError(err.message);
    }
  };

  // Folder counts for badges
  const folderCounts = {
    admin: accessEvents.length,
    compliance: consentEvents.length,
    sessions: sessions.length,
  };

  // Stats
  const totalSessions = sessions.length;
  const totalDuration = sessions.reduce((a, s) => a + (s.durationMs || 0), 0);
  const avgDuration = totalSessions > 0 ? totalDuration / totalSessions : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.6rem' }}>
        {[
          { label: 'Admin', value: accessEvents.length, color: '#f59e0b' },
          { label: 'Compliance', value: consentEvents.length, color: '#06b6d4' },
          { label: 'Sessies', value: totalSessions, color: C.gold },
          { label: 'Totaal', value: totalEvents, color: '#60a5fa' },
          { label: 'Gem. Duur', value: formatDuration(avgDuration), color: '#4ade80' },
        ].map((stat, i) => (
          <div key={i} style={{
            padding: '0.6rem 0.8rem',
            backgroundColor: 'rgba(255, 174, 0, 0.04)',
            borderRadius: '0.3rem',
            borderLeft: `2px solid ${stat.color}`,
          }}>
            <div style={{ fontSize: 'max(8px, 0.4vw)', color: tc.dimText, textTransform: 'uppercase', marginBottom: '0.2rem' }}>{stat.label}</div>
            <div style={{ fontSize: 'max(16px, 0.9vw)', fontWeight: 'bold', color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Folder tabs */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {AUDIT_FOLDERS.map(f => {
          const active = folder === f.key;
          return (
            <button key={f.key} onClick={() => { setFolder(f.key); setExpandedIdx(null); }}
              style={{
                padding: '0.35rem 0.7rem', fontSize: 'max(9px, 0.45vw)',
                backgroundColor: active ? `${f.color}18` : 'rgba(255,255,255,0.03)',
                color: active ? f.color : '#888',
                border: `1px solid ${active ? `${f.color}40` : 'rgba(255,255,255,0.06)'}`,
                borderRadius: '0.2rem', cursor: 'pointer',
                fontWeight: active ? 'bold' : 'normal',
                textTransform: 'uppercase', letterSpacing: '0.03em',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!active) e.target.style.backgroundColor = `${f.color}10`; }}
              onMouseLeave={e => { if (!active) e.target.style.backgroundColor = 'rgba(255,255,255,0.03)'; }}>
              {f.label}
              <span style={{
                marginLeft: '0.4rem', padding: '0.05rem 0.3rem',
                backgroundColor: `${f.color}25`, borderRadius: '0.1rem',
                fontSize: 'max(7px, 0.35vw)', fontWeight: 'bold',
              }}>{folderCounts[f.key]}</span>
            </button>
          );
        })}

        <SciFiButton onClick={fetchAll} size="xs" padding="0.25rem 0.6rem" fontSize="max(8px, 0.4vw)" style={{ marginLeft: 'auto' }}>↻ VERNIEUWEN</SciFiButton>
      </div>

      {/* Folder description */}
      <div style={{ fontSize: 'max(8px, 0.4vw)', color: '#888', fontStyle: 'italic', marginTop: '-0.6rem' }}>
        {AUDIT_FOLDERS.find(f => f.key === folder)?.desc}
      </div>

      {error && <ErrorBox msg={error} />}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: tc.dimText, fontSize: 'max(10px, 0.5vw)' }}>Laden...</div>
      ) : (
        <>
          {/* ────── Admin & Toegang ────── */}
          {folder === 'admin' && (
            <DashboardCard title={`Admin & Toegang — Logins & Raadplegingen (${accessEvents.length})`} color="green">
              {accessEvents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1rem', color: '#4ade8060', fontSize: 'max(10px, 0.5vw)' }}>Nog geen toegang geregistreerd</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', maxHeight: '55vh', overflowY: 'auto' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 0.5fr 1fr 1.6fr', gap: '0.3rem', padding: '0.3rem 0.5rem', borderBottom: '1px solid rgba(74,222,128,0.15)' }}>
                    {['TIJDSTIP', 'TYPE', 'REPORT ID', 'ADMIN / DETAIL'].map(h => (
                      <div key={h} style={{ fontSize: 'max(7px, 0.35vw)', color: '#4ade8080', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.05em' }}>{h}</div>
                    ))}
                  </div>
                  {accessEvents.map((ev, i) => (
                    <div key={i} style={{
                      display: 'grid', gridTemplateColumns: '1.6fr 0.5fr 1fr 1.6fr',
                      gap: '0.3rem', padding: '0.3rem 0.5rem', alignItems: 'center',
                      backgroundColor: i % 2 === 0 ? 'rgba(74,222,128,0.02)' : 'transparent',
                      borderLeft: `2px solid ${EVENT_COLORS[ev.type] || '#888'}`,
                      borderRadius: '0 0.15rem 0.15rem 0',
                    }}>
                      <div style={{ fontSize: 'max(8px, 0.42vw)', color: '#cbd5e1' }}>
                        {new Date(ev.timestamp).toLocaleString('nl-NL', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                      <div style={{ fontSize: 'max(8px, 0.42vw)', color: EVENT_COLORS[ev.type], fontWeight: 'bold', textTransform: 'uppercase' }}>
                        {EVENT_ICONS[ev.type]} {ev.type === 'report_view' ? 'rapport' : 'login'}
                      </div>
                      <div style={{ fontSize: 'max(7px, 0.38vw)', color: '#34d399', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ev.reportId || (ev.message && ev.type !== 'report_view' ? ev.message : '—')}
                      </div>
                      <div style={{ fontSize: 'max(7px, 0.38vw)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ev.email ? (
                          <span style={{ color: '#f59e0b' }}>👤 {ev.email}{ev.message && ev.type === 'report_view' ? <span style={{ color: '#64748b' }}> · {ev.message}</span> : null}</span>
                        ) : (
                          <span style={{ color: '#64748b' }}>{ev.message || '—'}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </DashboardCard>
          )}

          {/* ────── Compliance ────── */}
          {folder === 'compliance' && (
            <DashboardCard title={`Compliance — Toestemmingsregistratie (${consentEvents.length})`} color="cyan">
              {consentEvents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1rem', color: '#06b6d460', fontSize: 'max(10px, 0.5vw)' }}>Nog geen toestemmingen geregistreerd</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', maxHeight: '55vh', overflowY: 'auto' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.5fr 0.8fr 0.6fr 1.5fr', gap: '0.3rem', padding: '0.3rem 0.5rem', borderBottom: '1px solid rgba(6,182,212,0.15)' }}>
                    {['TIJDSTIP', 'EMAIL', 'TYPE TOESTEMMING', 'NIVEAU', 'USER AGENT'].map(h => (
                      <div key={h} style={{ fontSize: 'max(7px, 0.35vw)', color: '#06b6d480', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.05em' }}>{h}</div>
                    ))}
                  </div>
                  {consentEvents.map((ev, i) => (
                    <div key={i} style={{
                      display: 'grid', gridTemplateColumns: '1.6fr 1.5fr 0.8fr 0.6fr 1.5fr',
                      gap: '0.3rem', padding: '0.3rem 0.5rem', alignItems: 'center',
                      backgroundColor: i % 2 === 0 ? 'rgba(6,182,212,0.02)' : 'transparent',
                      borderLeft: '2px solid #06b6d4',
                      borderRadius: '0 0.15rem 0.15rem 0',
                    }}>
                      <div style={{ fontSize: 'max(8px, 0.42vw)', color: '#cbd5e1' }}>
                        {new Date(ev.timestamp).toLocaleString('nl-NL', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                      <div style={{ fontSize: 'max(8px, 0.42vw)', color: '#f59e0b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ev.email || <span style={{ color: '#64748b' }}>—</span>}
                      </div>
                      <div style={{ fontSize: 'max(8px, 0.42vw)', color: '#06b6d4', fontWeight: 'bold' }}>
                        ✅ {ev.consentType || 'art9_assessment'}
                      </div>
                      <div style={{ fontSize: 'max(8px, 0.42vw)', color: '#c084fc', fontWeight: 'bold', textTransform: 'uppercase' }}>
                        {ev.level || '—'}
                      </div>
                      <div style={{ fontSize: 'max(7px, 0.35vw)', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ev.userAgent || '—'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </DashboardCard>
          )}

          {/* ────── Sessions (all events grouped) ────── */}
          {folder === 'sessions' && (
            <DashboardCard title={`Sessies — Alle Events Gegroepeerd (${totalSessions})`} color="gold">
              {sessions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: tc.dimText, fontSize: 'max(10px, 0.5vw)' }}>Nog geen activiteit geregistreerd</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', maxHeight: '55vh', overflowY: 'auto' }}>
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1.4fr 0.8fr 0.5fr 1.2fr',
                    gap: '0.3rem', padding: '0.35rem 0.5rem',
                    borderBottom: `1px solid ${tc.border}`,
                  }}>
                    {['DATUM', 'DUUR', 'EVENTS', 'TYPES'].map(h => (
                      <div key={h} style={{ fontSize: 'max(7px, 0.35vw)', color: tc.dimText, textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.05em' }}>{h}</div>
                    ))}
                  </div>
                  {sessions.map((s, idx) => {
                    const startDate = new Date(s.startedAt);
                    const endDate = new Date(s.endedAt);
                    const events = s.events || [];
                    const types = {};
                    events.forEach(e => { types[e.type] = (types[e.type] || 0) + 1; });
                    const isExpanded = expandedIdx === idx;

                    return (
                      <div key={idx}>
                        <div
                          onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                          style={{
                            display: 'grid', gridTemplateColumns: '1.4fr 0.8fr 0.5fr 1.2fr',
                            gap: '0.3rem', padding: '0.4rem 0.5rem',
                            backgroundColor: isExpanded ? 'rgba(255, 174, 0, 0.06)' : tc.cardBg,
                            borderLeft: `2px solid ${C.gold}`,
                            borderRadius: '0 0.15rem 0.15rem 0',
                            alignItems: 'center',
                            cursor: 'pointer',
                            transition: 'background-color 0.15s',
                          }}>
                          <div style={{ fontSize: 'max(9px, 0.45vw)', color: C.text }}>
                            {startDate.toLocaleString('nl-NL', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            {' → '}
                            {endDate.toLocaleString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div style={{ fontSize: 'max(9px, 0.45vw)', color: C.gold, fontWeight: 'bold' }}>
                            {formatDuration(s.durationMs)}
                          </div>
                          <div style={{ fontSize: 'max(9px, 0.45vw)', color: tc.dimText }}>
                            {events.length}
                          </div>
                          <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                            {Object.entries(types).map(([type, count]) => (
                              <span key={type} style={{
                                fontSize: 'max(7px, 0.35vw)', padding: '0.05rem 0.3rem', borderRadius: '0.1rem',
                                backgroundColor: `${EVENT_COLORS[type] || '#888'}20`,
                                color: EVENT_COLORS[type] || '#888',
                                fontWeight: 'bold', textTransform: 'uppercase',
                              }}>{EVENT_ICONS[type] || ''} {type} ×{count}</span>
                            ))}
                          </div>
                        </div>

                        {isExpanded && (
                          <div style={{
                            padding: '0.4rem 0.5rem 0.4rem 1.2rem',
                            backgroundColor: 'rgba(255, 174, 0, 0.03)',
                            borderLeft: `2px solid rgba(255, 174, 0, 0.15)`,
                            display: 'flex', flexDirection: 'column', gap: '0.2rem',
                          }}>
                            {events.map((ev, ei) => (
                              <div key={ei} style={{
                                display: 'flex', gap: '0.5rem', alignItems: 'center',
                                fontSize: 'max(8px, 0.42vw)', color: tc.dimText,
                                padding: '0.15rem 0',
                                borderBottom: ei < events.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                              }}>
                                <span style={{ color: EVENT_COLORS[ev.type] || '#888', minWidth: '1.5em' }}>{EVENT_ICONS[ev.type] || '•'}</span>
                                <span style={{ color: '#888', minWidth: '4.5em' }}>
                                  {new Date(ev.timestamp).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                                <span style={{ color: EVENT_COLORS[ev.type] || '#888', fontWeight: 'bold', textTransform: 'uppercase', minWidth: '3.5em' }}>
                                  {ev.type}
                                </span>
                                {ev.branch && <span style={{ color: '#60a5fa' }}>⎇ {ev.branch}</span>}
                                {ev.hash && <span style={{ color: '#888', fontFamily: 'monospace' }}>{ev.hash}</span>}
                                {ev.message && <span style={{ color: C.text, fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '20vw' }}>"{ev.message}"</span>}
                                {ev.email && <span style={{ color: '#f59e0b' }}>👤 {ev.email}</span>}
                                {ev.reportId && <span style={{ color: '#34d399', fontFamily: 'monospace', fontSize: 'max(7px, 0.34vw)' }}>ID: {ev.reportId}</span>}
                                {ev.reportType && <span style={{ color: '#34d399', textTransform: 'uppercase' }}>{ev.reportType}</span>}
                                {ev.consentType && <span style={{ color: '#06b6d4' }}>✅ {ev.consentType}</span>}
                                {ev.level && <span style={{ color: '#c084fc', textTransform: 'uppercase' }}>{ev.level}</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </DashboardCard>
          )}
        </>
      )}
    </div>
  );
});

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
