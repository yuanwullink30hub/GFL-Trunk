import React, { memo, useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '@gfl/i18n';
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
  logReportView,
  getAccessLog,
  clearSessions,
  getFeedbackEmailSettings,
  updateFeedbackEmailSettings,
  getActivationCodes,
  createActivationCodes,
  revokeActivationCode,
  getReportUnlocks,
  refundReportUnlock,
  declineReportRefund,
  holdReportPaymentLink,
  getPaymentRecords,
  downloadPaymentRecord,
  downloadPaymentRecordsArchive,
  getPaymentConfigAdmin,
  updatePaymentConfigAdmin,
} from '@gfl/api-client';
import {
  BTN, LABEL, FIELD_LABEL, TEXTAREA, INPUT_SM,
  C, FONT, SciFiButton,
} from '@gfl/ui';
import { BRANDS } from '@gfl/brands';
import InvoiceTemplate from './InvoiceTemplate';
import CreditNoteTemplate from './CreditNoteTemplate';
import EmailTemplate from './EmailTemplate';
import {
  HoloKeyframes, HoloCorners, HoloTab, HoloClock, BrandMark, StatusDot, KpiTile, holoCardStyle,
  HOLO_PAGE_BG, HOLO_PAGE_BG_SIZE, HOLO_BAR, HOLO_PANEL, HOLO_TABLE_HEAD, CHROME, gradientText, TITLE_GRADIENT, PURPLE,
} from './holo';
import { AppUpdateControl } from './AppUpdate';

// ── Responsive context ──
const MobileCtx = React.createContext(false);
const DashSizeCtx = React.createContext({});

// Mobile-only tab style (standalone, no BTN spread)
// eslint-disable-next-line no-unused-vars
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

// HoloPro skin (holo.jsx): glass card, purple/orange HUD corners, border flips to orange on hover.
// The card's `color` tints its idle border and the title's accent bar.
const CARD_RGB = { gold: '249, 115, 22', purple: '168, 85, 247', green: '74, 222, 128', cyan: '6, 182, 212' };

function DashboardCard({ children, title, color = 'gold', className, style = {} }) {
  const isMobile = React.useContext(MobileCtx);
  const cc = CARD_COLORS[color] || CARD_COLORS.gold;
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        ...holoCardStyle(hov, CARD_RGB[color] || CARD_RGB.gold),
        padding: '1.25rem',
        fontFamily: FONT,
        color: C.text,
        fontSize: 'max(12px, 0.65vw)',
        ...(isMobile ? { maxWidth: '100%', boxSizing: 'border-box' } : {}),
        ...style,
      }}
    >
      <HoloCorners />
      {!isMobile && title && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          marginBottom: '0.8rem',
          paddingBottom: '0.6rem',
          borderBottom: '1px solid rgba(168, 85, 247, 0.1)',
        }}>
          <div style={{
            width: '3px', height: '1rem',
            backgroundColor: cc.border,
            boxShadow: `0 0 8px ${cc.border}`,
            borderRadius: '1px',
          }} />
          <span style={{
            fontSize: 'max(10px, 0.5vw)',
            fontWeight: 'bold',
            color: C.text,
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
          }}>{title}</span>
        </div>
      )}

      {children}
    </div>
  );
}


/** A tab that throws while rendering shows its error in place instead of unmounting the whole dashboard.
 *  Keyed by the tab, so switching tabs starts clean. */
class TabBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error) {
    console.error('[admin] tab crashed:', error);
  }
  render() {
    if (this.state.error) return <ErrorBox msg={String(this.state.error?.message || this.state.error)} />;
    return this.props.children;
  }
}

/**
 * Admin Dashboard — HoloPro skin (holo.jsx), in our tokens
 *
 * Layout (full window):
 *   HUD header  →  telemetry strip (status, signed-in account, Amsterdam time) + brand row + filter-style tabs
 *   main        →  the active tab, scrolling, max 1600px wide
 *   footer      →  telemetry line
 */

const AdminDashboardModal = memo(({ user, onLogout }) => {
  const { t, language } = useLanguage();
  const [tab, setTab] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280);
  useEffect(() => {
    const h = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  const isMobile = windowWidth < 768;

  // Breakpoint-based sizing — Desktop(≥1800) / Laptop(≥1079) / Tablet(≥768) / Mobile(<768)
  const ds = windowWidth >= 1800 ? {
    shellWidth: '90vw', shellMaxWidth: '1280px', shellHeight: '85vh', shellPad: 0,
    titleBarPad: '0.3rem 0.7rem',
    contentPad: '1.5rem', contentGap: '1.5rem',
    headerPb: '0.8rem', headerFont: 'max(22px, 1.53vw)',
    tabGap: '0.4rem',
    avatarSize: '3.5rem', avatarFont: '1.5rem',
    infoGap: '0.4rem', infoMt: '0.5rem',
    rowPb: '0.35rem',
    noteListMaxH: '220px', noteGap: '0.35rem',
    notePad: '0.4rem 0.6rem', noteInputPad: '0.4rem 0.6rem',
    borderRadius: 'max(4px, 0.5vw)',
  } : windowWidth >= 1079 ? {
    shellWidth: '90vw', shellMaxWidth: '1280px', shellHeight: '85vh', shellPad: 0,
    titleBarPad: '0.3rem 0.7rem',
    contentPad: '1.5rem', contentGap: '1.5rem',
    headerPb: '0.8rem', headerFont: 'max(18px, 1.53vw)',
    tabGap: '0.4rem',
    avatarSize: '3.5rem', avatarFont: '1.5rem',
    infoGap: '0.4rem', infoMt: '0.5rem',
    rowPb: '0.35rem',
    noteListMaxH: '220px', noteGap: '0.35rem',
    notePad: '0.4rem 0.6rem', noteInputPad: '0.4rem 0.6rem',
    borderRadius: 'max(4px, 0.5vw)',
  } : windowWidth >= 768 ? {
    shellWidth: '94vw', shellMaxWidth: '1280px', shellHeight: '85vh', shellPad: 0,
    titleBarPad: 'max(0.4rem, 0.55vw) max(0.7rem, 1vw)',
    contentPad: '1.25rem', contentGap: '1.25rem',
    headerPb: '0.6rem', headerFont: 'max(20px, 1.4vw)',
    tabGap: '0.35rem',
    avatarSize: '3rem', avatarFont: '1.25rem',
    infoGap: '0.35rem', infoMt: '0.4rem',
    rowPb: '0.3rem',
    noteListMaxH: '180px', noteGap: '0.3rem',
    notePad: '0.35rem 0.5rem', noteInputPad: '0.35rem 0.5rem',
    borderRadius: 'max(4px, 0.5vw)',
  } : {
    shellWidth: '96vw', shellMaxWidth: '1280px', shellHeight: '82vh', shellPad: '0.6rem',
    titleBarPad: 'max(0.4rem, 0.55vw) max(0.7rem, 1vw)',
    contentPad: 'max(1rem, 1.5vw) max(1.4rem, 2.5vw)', contentGap: 'max(1rem, 1.5vw)',
    headerPb: '0.5rem', headerFont: 'max(18px, 1.4vw)',
    tabGap: '0.3rem',
    avatarSize: 'max(2.5rem, 3.5vw)', avatarFont: 'max(1rem, 1.5vw)',
    infoGap: 'max(0.25rem, 0.4vw)', infoMt: 'max(0.3rem, 0.5vw)',
    rowPb: 'max(0.25rem, 0.35vw)',
    noteListMaxH: '30vh', noteGap: 'max(0.25rem, 0.35vw)',
    notePad: 'max(0.3rem, 0.4vw) max(0.4rem, 0.6vw)', noteInputPad: 'max(0.6rem, 0.8vw) max(0.6rem, 0.9vw)',
    borderRadius: 'max(4px, 0.5vw)',
  };


  const desktopTabs = [
    { key: 'overview', label: t('admin.dashboard.tabs.overview') },
    { key: 'users', label: t('admin.dashboard.tabs.users') },
    { key: 'assessments', label: t('admin.dashboard.tabs.assessments') },
    { key: 'questions', label: t('admin.dashboard.tabs.questions') },
    { key: 'prompts', label: t('admin.dashboard.tabs.prompts') },
    { key: 'formulieren', label: t('admin.dashboard.tabs.formulieren') },
    { key: 'activationCodes', label: t('admin.dashboard.tabs.activationCodes') },
    { key: 'reportUnlocks', label: t('admin.dashboard.tabs.reportUnlocks') },
    { key: 'paymentRecords', label: t('admin.dashboard.tabs.paymentRecords') },
    { key: 'audit', label: t('admin.dashboard.tabs.audit') },
    { key: 'contact', label: t('admin.dashboard.tabs.contact') },
  ];
  const mobileTabs = [
    ...desktopTabs.slice(0, 10),
    { key: 'feedback', label: t('admin.dashboard.tabs.feedback') },
    desktopTabs[10],
  ];
  const activeMobileTab = mobileTabs.find(mt => mt.key === tab) || mobileTabs[0];
  // Header, content and footer share one side gutter; the shell itself caps the width (75% of the window).
  const gutter = ds.contentPad;
  const today = new Date().toLocaleDateString(language === 'en' ? 'en-GB' : 'nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <MobileCtx.Provider value={isMobile}>
    <DashSizeCtx.Provider value={ds}>
    <HoloKeyframes />
    {/* The page — void, cyber grid and ambient glows — with the shell centred on it: 75% of the window
        from tablet up (owner, 2026-09-19), the whole screen on a phone. Inside the shell the header and
        footer stay put and the middle scrolls. */}
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: '#0a0510',
      backgroundImage: HOLO_PAGE_BG,
      backgroundSize: HOLO_PAGE_BG_SIZE,
    }}>
    <div style={{ position: 'relative', width: isMobile ? '100%' : '75vw', height: isMobile ? '100%' : '75vh' }}>
    {!isMobile && <HoloCorners frame />}
    <div style={{
      ...HOLO_PANEL,
      ...(isMobile ? { border: 'none', borderRadius: 0 } : {}),
      height: '100%',
      display: 'flex', flexDirection: 'column',
      color: C.text,
      fontFamily: FONT,
      fontSize: 'max(12px, 0.65vw)',
    }}>
      {/* ── HUD header ── */}
      <header style={{
        ...HOLO_BAR,
        position: 'relative', zIndex: 30, flexShrink: 0,
        borderBottom: '1px solid rgba(168, 85, 247, 0.2)',
        padding: isMobile ? '0.7rem 1rem' : `0.7rem ${gutter} 0.8rem`,
      }}>
        {/* Telemetry strip — live status, who is signed in, Amsterdam time */}
        {!isMobile && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap',
            paddingBottom: '0.5rem', marginBottom: '0.7rem',
            borderBottom: '1px solid rgba(168, 85, 247, 0.1)',
            ...CHROME(),
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
              <StatusDot />
              <span style={{ color: C.text, fontWeight: 'bold' }}>{t('admin.dashboard.overview.operational')}</span>
              <span style={{ color: 'rgba(168, 85, 247, 0.4)' }}>|</span>
              <span style={{ color: '#c084fc', textTransform: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
              {/* Installed app only: its version, update status and the check / restart button */}
              <AppUpdateControl />
              <HoloClock />
            </div>
          </div>
        )}

        {/* Brand row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', minWidth: 0 }}>
            {!isMobile && <BrandMark />}
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h1 style={{
                  margin: 0, fontFamily: FONT, fontWeight: 'bold',
                  fontSize: isMobile ? 'max(13px, 0.7vw)' : ds.headerFont,
                  textTransform: 'uppercase', letterSpacing: isMobile ? '0.12em' : '0.2em',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0,
                  ...gradientText(TITLE_GRADIENT),
                }}>
                  {t('admin.dashboard.title')}
                </h1>
                {!isMobile && (
                  <span style={{
                    ...CHROME('max(7px, 0.35vw)', '#c084fc'), fontWeight: 'bold',
                    padding: '0.15rem 0.45rem', borderRadius: '0.15rem',
                    background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)',
                  }}>
                    {(user?.role || 'admin').toUpperCase()}
                  </span>
                )}
              </div>
              {!isMobile && (
                <div style={{ ...CHROME('max(8px, 0.4vw)'), marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <span>{user?.displayName || '—'}</span>
                  <span style={{ color: 'rgba(168, 85, 247, 0.6)' }}>•</span>
                  <span style={{ color: 'rgba(249, 115, 22, 0.5)' }}>{today}</span>
                </div>
              )}
            </div>
          </div>
          <SciFiButton onClick={onLogout} variant="danger" size="sm" padding="0.35rem 1rem" fontSize="max(9px, 0.48vw)">{t('admin.dashboard.logout')}</SciFiButton>
        </div>

        {/* Navigation — filter-style tabs */}
        {!isMobile && (
          <nav style={{ display: 'flex', gap: ds.tabGap, flexWrap: 'wrap', marginTop: '0.8rem' }}>
            {desktopTabs.map(({ key, label, disabled }) => (
              <HoloTab key={key} onClick={() => !disabled && setTab(key)} disabled={disabled} active={tab === key}>
                {label}
              </HoloTab>
            ))}
          </nav>
        )}
      </header>

      {/* ── Scrollable content ── */}
      <main className="holo-scroll" style={{
        position: 'relative', zIndex: 1,
        flex: 1, minHeight: 0,
        overflowY: 'auto',
        ...(isMobile ? { overflowX: 'hidden' } : {}),
      }}>
        <div style={{
          padding: ds.contentPad,
          display: 'flex', flexDirection: 'column', gap: ds.contentGap,
          ...(isMobile ? { maxWidth: '100%', wordBreak: 'break-word' } : {}),
        }}>
          {/* Mobile navigation — the active tab opens the list */}
          {isMobile && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              <HoloTab onClick={() => setMobileMenuOpen(v => !v)} active={mobileMenuOpen} fullWidth>
                {`${activeMobileTab.label} ${mobileMenuOpen ? '▲' : '▼'}`}
              </HoloTab>
              {mobileMenuOpen && mobileTabs.map(({ key, label, disabled }) => (
                <HoloTab
                  key={key}
                  onClick={() => {
                    if (disabled) return;
                    setTab(key);
                    setMobileMenuOpen(false);
                  }}
                  disabled={disabled}
                  active={tab === key}
                  fullWidth
                >
                  {label}
                </HoloTab>
              ))}
            </div>
          )}

          {/* ── Tab content — a tab that throws shows its error here; header and tabs stay usable ── */}
          <TabBoundary key={tab}>
          {tab === 'overview' && <OverviewTab user={user} />}
          {tab === 'users' && <UsersTab currentUserId={user.id} />}
          {tab === 'assessments' && <AssessmentsTab adminEmail={user?.email} />}
          {tab === 'questions' && <QuestionsTab />}
          {tab === 'prompts' && <PromptsTab />}
          {tab === 'formulieren' && <FormulierenTab />}
          {tab === 'activationCodes' && <ActivationCodesTab />}
          {tab === 'reportUnlocks' && <ReportUnlocksTab />}
          {tab === 'paymentRecords' && <PaymentRecordsTab />}
          {tab === 'audit' && <AuditLogTab />}
          {tab === 'contact' && <ContactTab />}
          </TabBoundary>
        </div>
      </main>

      {/* ── Footer telemetry ── */}
      <footer style={{
        ...HOLO_BAR,
        position: 'relative', zIndex: 30, flexShrink: 0,
        borderTop: '1px solid rgba(168, 85, 247, 0.2)',
        padding: isMobile ? '0.5rem 1rem' : `0.55rem ${gutter}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap',
        ...CHROME('max(7px, 0.38vw)'),
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <StatusDot color={PURPLE} breathe={false} size="0.4rem" />
          GARDEN FOR LIFE // ADMIN GFL
        </span>
        <span>
          {t('admin.dashboard.overview.rowSession')}: <span style={{ color: '#4ade80' }}>{t('admin.dashboard.overview.sessionActive')}</span>
        </span>
      </footer>
    </div>
    </div>
    </div>
    </DashSizeCtx.Provider>
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
  const { t, tFunc } = useLanguage();
  const isMobile = React.useContext(MobileCtx);
  const ds = React.useContext(DashSizeCtx);
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
    backend:    { status: t('admin.dashboard.overview.healthLoading'), color: C.gold },
    ai:         { status: t('admin.dashboard.overview.healthLoading'), color: C.gold },
    pdf:        { status: t('admin.dashboard.overview.healthLoading'), color: C.gold },
    encryption: { status: t('admin.dashboard.overview.healthLoading'), color: C.gold },
  });

  useEffect(() => {
    /* 1. Backend API */
    getAdminStats()
      .then((s) => {
        setStats(s);
        setApiHealth((h) => ({ ...h, backend: { status: t('admin.dashboard.overview.healthOnline'), color: '#4ade80' } }));
      })
      .catch((e) => {
        setError(e.message);
        setApiHealth((h) => ({ ...h, backend: { status: t('admin.dashboard.overview.healthOffline'), color: '#ef4444' } }));
      });

    /* 2. AI Provider API — check if any provider has a real key configured */
    getProviders()
      .then((data) => {
        const configured = data?.providers?.filter(p => p.key && p.defaultModel) || [];
        if (configured.length > 0) {
          const names = configured.map(p => p.name).join(', ');
          setApiHealth((h) => ({ ...h, ai: { status: tFunc('admin.dashboard.overview.healthOnlineWith')(names), color: '#4ade80' } }));
        } else {
          setApiHealth((h) => ({ ...h, ai: { status: t('admin.dashboard.overview.healthNoKey'), color: '#f59e0b' } }));
        }
      })
      .catch(() => setApiHealth((h) => ({ ...h, ai: { status: t('admin.dashboard.overview.healthOffline'), color: '#ef4444' } })));

    /* 3. PDF Service + Encryption status — from /api/status */
    getApiStatus()
      .then((data) => {
        setApiHealth((h) => ({ ...h, pdf: { status: t('admin.dashboard.overview.healthOnline'), color: '#4ade80' } }));
        // Check encryption status from the same endpoint
        if (data?.encryption && data.encryption !== 'disabled') {
          setApiHealth((h) => ({ ...h, encryption: { status: tFunc('admin.dashboard.overview.healthActiveWith')(data.encryption), color: '#4ade80' } }));
        } else {
          setApiHealth((h) => ({ ...h, encryption: { status: t('admin.dashboard.overview.healthDisabled'), color: '#f59e0b' } }));
        }
      })
      .catch(() => {
        setApiHealth((h) => ({ ...h, pdf: { status: t('admin.dashboard.overview.healthOffline'), color: '#ef4444' } }));
        setApiHealth((h) => ({ ...h, encryption: { status: t('admin.dashboard.overview.healthUnknown'), color: '#ef4444' } }));
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
        ? { display: 'flex', flexDirection: 'column', gap: ds.contentGap }
        : { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: ds.contentGap }
      }>
        {/* Kaart 1: Identiteitsmatrix (goud) — gebruikersprofiel */}
        <DashboardCard title={t('admin.dashboard.overview.identityMatrix')} color="gold">
          <div style={{ display: 'flex', flexDirection: 'column', gap: ds.infoGap }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: ds.infoGap }}>
              <div style={{
                width: ds.avatarSize, height: ds.avatarSize, borderRadius: '50%',
                backgroundColor: tc.iconBg, border: `1px solid ${tc.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: ds.avatarFont,
              }}>🛡</div>
              <div>
                <div style={{ fontSize: 'max(9px, 0.45vw)', color: tc.dimText, textTransform: 'uppercase' }}>{t('admin.dashboard.overview.status')}</div>
                <div style={{ color: C.gold, fontWeight: 'bold' }}>{t('admin.dashboard.overview.operational')}</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: ds.infoGap, marginTop: ds.infoMt }}>
              {[
                [t('admin.dashboard.overview.rowUser'), user.displayName || '—'],
                [t('admin.dashboard.overview.rowEmail'), user.email],
                [t('admin.dashboard.overview.rowAccessLevel'), (user.role || 'client').toUpperCase()],
                [t('admin.dashboard.overview.rowSession'), t('admin.dashboard.overview.sessionActive')],
              ].map(([label, value]) => (
                <div key={label} style={{
                  display: 'flex', justifyContent: 'space-between',
                  borderBottom: `1px solid ${tc.rowBorder}`, paddingBottom: ds.rowPb,
                }}>
                  <span style={{ color: tc.dimText, fontSize: 'max(9px, 0.45vw)', textTransform: 'uppercase', ...(isMobile ? { flexShrink: 0, width: '30%' } : {}) }}>{label}</span>
                  <span style={{ fontSize: 'max(10px, 0.5vw)', fontFamily: FONT, ...(isMobile ? { textAlign: 'right', flex: 1 } : {}) }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </DashboardCard>

        {/* Kaart 2: Admin Notities (paars) — opslaan van notities */}
        <DashboardCard title={t('admin.dashboard.overview.notesTitle')} color="purple">
          <div style={{ display: 'flex', flexDirection: 'column', gap: ds.noteGap }}>
            <div style={{ display: 'flex', gap: ds.noteGap }}>
              <input
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addNote(); }}
                placeholder={t('admin.dashboard.overview.notePlaceholder')}
                style={{
                  flex: 1,
                  padding: ds.noteInputPad,
                  ...(isMobile ? { minHeight: '2.5rem' } : {}),
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  border: `1px solid ${pc.rowBorder}`,
                  borderRadius: ds.borderRadius,
                  color: C.text, fontFamily: FONT,
                  fontSize: 'max(9px, 0.45vw)',
                  outline: 'none',
                }}
                onFocus={(e) => { e.target.style.borderColor = C.purple; }}
                onBlur={(e) => { e.target.style.borderColor = pc.rowBorder; }}
              />
              <SciFiButton onClick={addNote} variant="purple" size="sm" padding={ds.notePad} fontSize="max(9px, 0.45vw)">+</SciFiButton>
            </div>
            {notesSaved && (
              <div style={{ fontSize: 'max(8px, 0.4vw)', color: '#4ade80', textTransform: 'uppercase' }}>
                {t('admin.dashboard.overview.noteSaved')}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: ds.noteGap, maxHeight: ds.noteListMaxH, overflowY: 'auto' }}>
              {notes.length > 0 ? notes.map((n) => (
                <div key={n.id} style={{
                  padding: ds.notePad,
                  backgroundColor: pc.cardBg,
                  border: `1px solid ${pc.rowBorder}`,
                  borderRadius: ds.borderRadius,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: ds.noteGap,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 'max(10px, 0.5vw)', wordBreak: 'break-word' }}>{n.text}</div>
                    <div style={{ fontSize: 'max(7px, 0.35vw)', color: pc.dimText, marginTop: ds.noteGap }}>
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
                  {t('admin.dashboard.overview.noNotes')}
                </div>
              )}
            </div>
          </div>
        </DashboardCard>

        {/* Kaart 3: Foutmeldingen — Fout/Bug Audit Log (goud) */}
        <DashboardCard title={t('admin.dashboard.overview.errorsTitle')} color="gold">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {errorLog.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'max(8px, 0.4vw)', color: tc.dimText, textTransform: 'uppercase' }}>
                  {tFunc('admin.dashboard.overview.errorsCaptured')(errorLog.length)}
                </span>
                <SciFiButton onClick={clearLog} variant="danger" size="xs" padding="0.2rem 0.4rem" fontSize="max(7px, 0.38vw)">{t('admin.dashboard.overview.clearLog')}</SciFiButton>
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
                    {t('admin.dashboard.overview.noErrors')}
                  </div>
                  <div style={{ color: tc.dimText, fontSize: 'max(8px, 0.4vw)' }}>
                    {t('admin.dashboard.overview.noErrorsHint')}
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
            { label: t('admin.dashboard.overview.apiBackend'), key: 'backend', desc: t('admin.dashboard.overview.apiBackendDesc') },
            { label: t('admin.dashboard.overview.apiAi'), key: 'ai', desc: t('admin.dashboard.overview.apiAiDesc') },
            { label: t('admin.dashboard.overview.apiPdf'), key: 'pdf', desc: t('admin.dashboard.overview.apiPdfDesc') },
            { label: t('admin.dashboard.overview.apiEncryption'), key: 'encryption', desc: t('admin.dashboard.overview.apiEncryptionDesc') },
          ].map(({ label, key, desc }) => (
            <DashboardCard key={key} color="gold" style={{ padding: '1rem 1.25rem' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
              }}>
                <StatusDot color={apiHealth[key].color} breathe={apiHealth[key].color === '#4ade80'} />
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
        <DashboardCard title={t('admin.dashboard.overview.apiTitle')} color="gold" style={{ padding: '1rem 1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            {[
              { label: t('admin.dashboard.overview.apiBackend'), key: 'backend', desc: t('admin.dashboard.overview.apiBackendDesc') },
              { label: t('admin.dashboard.overview.apiAi'), key: 'ai', desc: t('admin.dashboard.overview.apiAiDesc') },
              { label: t('admin.dashboard.overview.apiPdf'), key: 'pdf', desc: t('admin.dashboard.overview.apiPdfDesc') },
              { label: t('admin.dashboard.overview.apiEncryption'), key: 'encryption', desc: t('admin.dashboard.overview.apiEncryptionDesc') },
            ].map(({ label, key, desc }) => (
              <div key={key} className="holo-row" style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                padding: '0.6rem 0.8rem', borderRadius: '0.35rem',
                backgroundColor: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(168, 85, 247, 0.2)',
              }}>
                <StatusDot color={apiHealth[key].color} breathe={apiHealth[key].color === '#4ade80'} />
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
        ? { display: 'flex', flexDirection: 'column', gap: ds.noteGap }
        : { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: ds.infoGap }
      }>
        {[
          { label: t('admin.dashboard.overview.statUsers'), value: stats.userCount, color: '#c084fc', glyph: '◆' },
          { label: t('admin.dashboard.overview.statAssessments'), value: stats.assessmentCount, color: '#fb923c', glyph: '◈' },
          { label: t('admin.dashboard.overview.statErrors'), value: errorLog.length, color: errorLog.length > 0 ? '#fca5a5' : '#4ade80', glyph: '!' },
          { label: t('admin.dashboard.overview.statContactRequests'), value: stats.contactCount ?? 0, color: '#c084fc', glyph: '✉' },
        ].map((stat, i) => (
          <KpiTile key={i} label={stat.label} value={stat.value} color={stat.color} glyph={stat.glyph} />
        ))}
      </div>
    </>
  );
});

const UsersTab = memo(({ currentUserId }) => {
  const { t } = useLanguage();
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
              {u.email} · {t('admin.dashboard.users.created')} {new Date(u.createdAt).toLocaleDateString('nl-NL')}
              {u.lastLogin && <> · {t('admin.dashboard.users.lastLogin')} {new Date(u.lastLogin).toLocaleString('nl-NL', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</>}
              {!u.lastLogin && <> · <span style={{ color: '#f59e0b' }}>{t('admin.dashboard.users.neverLoggedIn')}</span></>}
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
      logReportView({ reportId: String(id), reportType: 'assessment' })
        .catch((e) => console.warn('[GFL] report-view log failed:', e));
      
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span>{new Date(review.timestamp).toLocaleString()} · {review.userId ? '👤 Registered' : '👤 Anonymous'}</span>
                    {review.starRating != null && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                        {[...Array(9)].map((_, i) => (
                          <span key={i} style={{ fontSize: 'max(8px, 0.4vw)', color: i < review.starRating ? '#f59e0b' : 'rgba(245,158,11,0.2)' }}>★</span>
                        ))}
                        <span style={{ marginLeft: '0.2rem', color: '#f59e0b' }}>{review.starRating}/9</span>
                      </span>
                    )}
                  </div>
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
  const { t } = useLanguage();
  const [promptLevel, setPromptLevel] = useState('advanced');

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
            {t('admin.dashboard.prompts.levelInDevelopment')}
          </div>
        </div>
      )}
    </div>
  );
});

const PromptsTabContent = memo(() => {
  const { t } = useLanguage();
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
          {t('admin.dashboard.prompts.systemPromptHint')}
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
        <div style={mLABEL}>{t('admin.dashboard.prompts.contextDocuments')}</div>
        <div style={{ fontSize: isMobile ? '13px' : 'max(9px, 0.45vw)', opacity: 0.4, marginBottom: '0.5rem' }}>
          {t('admin.dashboard.prompts.contextDocumentsHint')}
        </div>

        <ContextDocumentsSection />
      </div>
    </div>
  );
});

// ── Context Documents Sub-component ──
const ContextDocumentsSection = memo(() => {
  const { t, tFunc } = useLanguage();
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
    if (!window.confirm(tFunc('admin.dashboard.prompts.confirmDeleteDoc')(filename))) return;
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
        setError(tFunc('admin.dashboard.prompts.docsWithoutText')(invalid.length, invalid.map((d) => d.filename).join(', ')));
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
          {uploading ? 'Uploading...' : t('admin.dashboard.prompts.dropZone')}
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
          {t('admin.dashboard.prompts.noDocuments')}
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
            {tFunc('admin.dashboard.prompts.docCountTotal')(documents.length, documents.reduce((s, d) => s + (d.charCount || 0), 0).toLocaleString())}
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
                {verifying ? '⏳ VERIFYING...' : verified?.verified ? t('admin.dashboard.prompts.verified') : t('admin.dashboard.prompts.saveVerify')}
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
                {tFunc('admin.dashboard.prompts.allVerified')(verified.totalDocuments)}
              </div>
              <div style={{ opacity: 0.5, fontSize: isMobile ? '12px' : 'max(8px, 0.4vw)' }}>
                {tFunc('admin.dashboard.prompts.charsSentAsContext')(verified.totalChars?.toLocaleString())}
              </div>
              {verified.documents?.map((doc) => (
                <div key={doc._id} style={{ marginTop: '0.3rem', padding: '0.3rem', background: 'rgba(0,255,157,0.03)', borderRadius: '4px' }}>
                  <div style={{ color: C.gold, fontSize: isMobile ? '12px' : 'max(8px, 0.4vw)', fontWeight: 600 }}>
                    {tFunc('admin.dashboard.prompts.docChars')(doc.filename, doc.charCount?.toLocaleString())}
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
  const { t } = useLanguage();
  const [level, setLevel] = useState('advanced');

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
            {t('admin.dashboard.questions.heading')} — {level.toUpperCase()}
          </div>
          <div style={{ fontSize: 'max(11px, 0.55vw)', opacity: 0.4, maxWidth: '400px', margin: '0 auto' }}>
            {t('admin.dashboard.questions.levelInDevelopment')}
          </div>
        </div>
      )}
    </div>
  );
});

const QuestionsTabAdvanced = memo(() => {
  const { t, tFunc } = useLanguage();
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
    if (!window.confirm(t('admin.dashboard.questions.confirmImportDocx'))) return;
    setImportingDocx(true);
    setError('');
    try {
      const result = await importQuestionsDocx(file);
      load();
      window.alert(tFunc('admin.dashboard.questions.importedAlert')(result.layersImported, result.questionsImported));
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
        <div style={LABEL}>{tFunc('admin.dashboard.questions.advancedTotal')(data.layers.reduce((s, l) => s + l.questions.length, 0))}</div>
      </div>

      {/* Toolbar: export / import / force re-seed */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        <SciFiButton onClick={handleExportDocx} disabled={exportingDocx} variant="purple" size="sm" padding="0.3rem 0.7rem" fontSize="max(8px, 0.4vw)">
          {exportingDocx ? t('admin.dashboard.questions.exporting') : '📄 EXPORT WORD'}
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
            {importingDocx ? t('admin.dashboard.questions.importing') : '📄 IMPORT WORD'}
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
  const { t, tFunc } = useLanguage();
  const tmplLabel = (id) => t(`admin.dashboard.formulieren.templates.${id}.label`);
  const tmplDesc = (id) => t(`admin.dashboard.formulieren.templates.${id}.desc`);
  const tmplStatus = (s) => (s === 'gereed' ? t('admin.dashboard.formulieren.statusReady') : t('admin.dashboard.formulieren.statusConcept'));
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
    const tmpl = FORM_TEMPLATES.find(ft => ft.id === selectedTemplate);
    if (!tmpl || !emailBody.trim()) return;
    if (!recipientEmail.trim()) { setSendError(t('admin.dashboard.formulieren.enterEmail')); return; }
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
      setSendError(err.message || t('admin.dashboard.formulieren.sendFailed'));
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
          <div style={{ fontSize: 'max(8px, 0.4vw)', color: tc.dimText, textTransform: 'uppercase', marginBottom: '0.2rem' }}>{t('admin.dashboard.formulieren.templatesStat')}</div>
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
              ? `${FORM_TEMPLATES.find(ft => ft.id === selectedTemplate)?.icon || ''} ${tmplLabel(selectedTemplate) || t('admin.dashboard.formulieren.templateFallback')}`
              : t('admin.dashboard.formulieren.chooseTemplate')}</span>
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
                  <span style={{ fontWeight: 'bold', fontSize: 'max(10px, 0.55vw)', color: C.gold, flex: 1 }}>{tmplLabel(tmpl.id)}</span>
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
                  }}>{tmplStatus(tmpl.status)}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <CardWrap title={t('admin.dashboard.formulieren.documentTemplates')} color="gold">
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
                      <span style={{ fontWeight: 'bold', fontSize: 'max(10px, 0.55vw)', color: C.gold }}>{tmplLabel(tmpl.id)}</span>
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
                      }}>{tmplStatus(tmpl.status)}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 'max(8px, 0.42vw)', color: tc.dimText, lineHeight: 1.5 }}>
                    {tmplDesc(tmpl.id)}
                  </div>
                </button>
              );
            })}
          </div>
        </CardWrap>
      )}

      {/* Editor panel — shows when a template is selected */}
      {selectedTemplate && (() => {
        const tmpl = FORM_TEMPLATES.find(ft => ft.id === selectedTemplate);
        if (!tmpl) return null;
        const typeStyle = TYPE_COLORS[tmpl.type] || TYPE_COLORS.word;

        // ── Factuur uses dedicated InvoiceTemplate component ──
        if (selectedTemplate === 'factuur') {
          return (
            <CardWrap title={`${tmpl.icon} ${tmplLabel(tmpl.id)}`} color="gold">
              <InvoiceTemplate isMobile={isMobile} />
            </CardWrap>
          );
        }

        // ── Creditnota uses dedicated CreditNoteTemplate component ──
        if (selectedTemplate === 'creditnota') {
          return (
            <CardWrap title={`${tmpl.icon} ${tmplLabel(tmpl.id)}`} color="gold">
              <CreditNoteTemplate isMobile={isMobile} />
            </CardWrap>
          );
        }

        // ── Email uses dedicated EmailTemplate component ──
        if (selectedTemplate === 'email') {
          return (
            <CardWrap title={`${tmpl.icon} ${tmplLabel(tmpl.id)}`} color="gold">
              <EmailTemplate isMobile={isMobile} />
            </CardWrap>
          );
        }

        // ── All other templates use the generic textarea editor ──
        return (
          <>
          <CardWrap title={`${tmpl.icon} ${tmplLabel(tmpl.id)} — Template`} color="gold">
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
                    {tmplLabel(tmpl.id)}.{tmpl.type === 'excel' ? 'xlsx' : tmpl.type === 'word' ? 'docx' : 'pdf'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.3rem' }}>
                  <SciFiButton onClick={() => {
                    if (!editorContent.trim()) return;
                    const blob = new Blob([editorContent], { type: 'text/plain;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = `${tmplLabel(tmpl.id)}.txt`;
                    document.body.appendChild(a); a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }} disabled={!editorContent.trim()} size="xs" padding="0.2rem 0.5rem" fontSize="max(8px, 0.4vw)">{t('admin.dashboard.formulieren.download')}</SciFiButton>
                </div>
              </div>

              {/* Template content area */}
              <textarea
                value={editorContent}
                onChange={(e) => setEditorContent(e.target.value)}
                placeholder={tFunc('admin.dashboard.formulieren.editorPlaceholder')(tmplLabel(tmpl.id))}
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
          <CardWrap title={tFunc('admin.dashboard.formulieren.emailCardTitle')(tmplLabel(tmpl.id))} color="gold">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {/* Recipient fields */}
              <div style={isMobile
                ? { display: 'flex', flexDirection: 'column', gap: '0.4rem' }
                : { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem' }
              }>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                  <label style={{ fontSize: 'max(7px, 0.35vw)', color: tc.dimText, textTransform: 'uppercase' }}>{t('admin.dashboard.formulieren.recipientEmail')}</label>
                  <input
                    type="email" value={recipientEmail}
                    onChange={(e) => { setRecipientEmail(e.target.value); setSendError(''); }}
                    placeholder={t('admin.dashboard.formulieren.emailPlaceholder')}
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
                  <label style={{ fontSize: 'max(7px, 0.35vw)', color: tc.dimText, textTransform: 'uppercase' }}>{t('admin.dashboard.formulieren.recipientName')}</label>
                  <input
                    type="text" value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder={t('admin.dashboard.formulieren.optional')}
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
                  <label style={{ fontSize: 'max(7px, 0.35vw)', color: tc.dimText, textTransform: 'uppercase' }}>{t('admin.dashboard.formulieren.subject')}</label>
                  <input
                    type="text" value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder={tFunc('admin.dashboard.formulieren.subjectPlaceholder')(tmplLabel(tmpl.id))}
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
                placeholder={tFunc('admin.dashboard.formulieren.bodyPlaceholder')(tmplLabel(tmpl.id))}
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
                    ? tFunc('admin.dashboard.formulieren.charsReady')(emailBody.trim().length)
                    : t('admin.dashboard.formulieren.writeBodyHint')}
                  {sendingState === 'sent' && <span style={{ marginLeft: '0.5rem', color: '#4ade80', fontWeight: 'bold' }}>{t('admin.dashboard.formulieren.sent')}</span>}
                </div>
                <SciFiButton onClick={handleSend} disabled={sendingState === 'sending' || !emailBody.trim() || !recipientEmail.trim()} variant="purple" size="sm" padding="0.3rem 0.8rem" fontSize="max(9px, 0.45vw)">{sendingState === 'sending' ? t('admin.dashboard.formulieren.sending') : t('admin.dashboard.formulieren.send')}</SciFiButton>
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

// ═══════════════════════════════════════════════════════════
// FeedbackEmailSettingsCard — edit confirmation email text
// ═══════════════════════════════════════════════════════════
const FeedbackEmailSettingsCard = memo(() => {
  const { t } = useLanguage();
  const [text, setText] = useState('');
  const [status, setStatus] = useState(null); // null | 'saving' | 'saved' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  const pc = CARD_COLORS.purple;

  // Load on mount
  useEffect(() => {
    getFeedbackEmailSettings()
      .then((s) => { setText(s.text || ''); })
      .catch(() => {});
  }, []);

  const save = async () => {
    setStatus('saving');
    setErrorMsg('');
    try {
      await updateFeedbackEmailSettings({ text });
      setStatus('saved');
      setTimeout(() => setStatus(null), 2500);
    } catch (err) {
      setErrorMsg(err.message);
      setStatus('error');
    }
  };

  const fieldLabelStyle = {
    fontSize: 'max(7px, 0.38vw)', color: pc.dimText,
    textTransform: 'uppercase', letterSpacing: '0.08em',
    marginBottom: '0.25rem',
  };
  const inputBase = {
    width: '100%', padding: '0.4rem 0.6rem', boxSizing: 'border-box',
    backgroundColor: 'rgba(0,0,0,0.4)', border: `1px solid ${pc.rowBorder}`,
    borderRadius: '0.25rem', color: C.text, fontFamily: FONT,
    fontSize: 'max(9px, 0.45vw)', outline: 'none',
    transition: 'border-color 0.2s',
  };

  return (
    <DashboardCard title={t('admin.dashboard.feedbackEmail.title')} color="purple">
      <p style={{ fontSize: 'max(8px, 0.42vw)', color: pc.dimText, marginTop: 0, marginBottom: '0.75rem' }}>
        {t('admin.dashboard.feedbackEmail.intro')}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {/* Text */}
        <div>
          <div style={fieldLabelStyle}>{t('admin.dashboard.feedbackEmail.messageText')}</div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('admin.dashboard.feedbackEmail.messagePlaceholder')}
            rows={4}
            style={{ ...inputBase, resize: 'vertical' }}
            onFocus={(e) => { e.target.style.borderColor = C.purple; }}
            onBlur={(e) => { e.target.style.borderColor = pc.rowBorder; }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <SciFiButton onClick={save} disabled={status === 'saving'} size="sm" fontSize="max(9px, 0.45vw)">
            {status === 'saving' ? t('admin.dashboard.feedbackEmail.saving') : t('admin.dashboard.feedbackEmail.save')}
          </SciFiButton>
          {status === 'saved' && (
            <span style={{ fontSize: 'max(8px, 0.4vw)', color: '#4ade80', textTransform: 'uppercase' }}>{t('admin.dashboard.feedbackEmail.saved')}</span>
          )}
          {(status === 'error' || errorMsg) && (
            <span style={{ fontSize: 'max(8px, 0.4vw)', color: '#ef4444' }}>{errorMsg}</span>
          )}
        </div>
      </div>
    </DashboardCard>
  );
});
FeedbackEmailSettingsCard.displayName = 'FeedbackEmailSettingsCard';

const ContactTab = memo(() => {
  const { t, tFunc, language } = useLanguage();
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

  /* Load brand with any saved edits. The brand copy is bilingual ({ nl, en }, packages/brands) — rendering
     the object itself crashed the whole dashboard — so each text field resolves to the active language;
     saved edits are plain strings and pass through. */
  const inLang = (v) => (v && typeof v === 'object' ? (v[language] ?? v.en ?? v.nl ?? '') : v);
  const getBrand = (brand) => {
    const saved = edits[brand.id];
    const b = saved ? { ...brand, ...saved } : brand;
    return {
      ...b,
      name: inLang(b.name),
      tagline: inLang(b.tagline),
      description: inLang(b.description),
      tags: Array.isArray(b.tags) ? b.tags.map(inLang) : b.tags,
    };
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
      {/* Feedback email settings */}
      <FeedbackEmailSettingsCard />

      {/* Section toggles */}
      <div style={{ display: 'flex', gap: '0.4rem' }}>
        {[
          { key: 'clients', label: tFunc('admin.dashboard.contact.clientsSection')(BRANDS.length) },
          { key: 'requests', label: tFunc('admin.dashboard.contact.requestsSection')(nieuwRequests) },
        ].map(({ key, label }) => (
          <SciFiButton key={key} onClick={() => setSection(key)} active={section === key}>
            {label}
          </SciFiButton>
        ))}
      </div>

      {editSaved && (
        <div style={{ fontSize: 'max(8px, 0.4vw)', color: '#4ade80', textTransform: 'uppercase', textAlign: 'center' }}>
          {t('admin.dashboard.contact.changesSaved')}
        </div>
      )}

      {section === 'clients' && (
        <DashboardCard title={t('admin.dashboard.contact.clientsTitle')} color="gold">
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
                            }}>{t('admin.dashboard.contact.edited')}</span>
                          )}
                        </div>
                        <div style={{ fontSize: 'max(9px, 0.45vw)', opacity: 0.5, marginBottom: '0.15rem' }}>{b.tagline}</div>
                        <div style={{ fontSize: 'max(8px, 0.42vw)', color: tc.dimText }}>
                          {b.origin} · {b.foundedYear} · {b.email || '—'}
                          {b.tags && ` · ${b.tags.join(', ')}`}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0 }}>
                        <SciFiButton onClick={() => startEdit(brand)} size="xs" padding="0.25rem 0.5rem" fontSize="max(8px, 0.4vw)">{t('admin.dashboard.contact.editButton')}</SciFiButton>
                        {hasEdits && (
                          <SciFiButton onClick={() => resetBrand(brand.id)} variant="danger" size="xs" padding="0.25rem 0.5rem" fontSize="max(8px, 0.4vw)">{t('admin.dashboard.contact.resetButton')}</SciFiButton>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Edit mode */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ fontSize: 'max(9px, 0.45vw)', color: C.gold, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        {tFunc('admin.dashboard.contact.editHeading')(b.name)}
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 'max(7px, 0.38vw)', color: tc.dimText, textTransform: 'uppercase', marginBottom: '0.15rem' }}>{t('admin.dashboard.contact.fieldName')}</div>
                          <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} style={inputStyle}
                            onFocus={(e) => { e.target.style.borderColor = C.gold; }} onBlur={(e) => { e.target.style.borderColor = tc.rowBorder; }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 'max(7px, 0.38vw)', color: tc.dimText, textTransform: 'uppercase', marginBottom: '0.15rem' }}>{t('admin.dashboard.contact.fieldEmail')}</div>
                          <input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} style={inputStyle}
                            onFocus={(e) => { e.target.style.borderColor = C.gold; }} onBlur={(e) => { e.target.style.borderColor = tc.rowBorder; }} />
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 'max(7px, 0.38vw)', color: tc.dimText, textTransform: 'uppercase', marginBottom: '0.15rem' }}>{t('admin.dashboard.contact.fieldTagline')}</div>
                        <input value={editForm.tagline} onChange={(e) => setEditForm({ ...editForm, tagline: e.target.value })} style={inputStyle}
                          onFocus={(e) => { e.target.style.borderColor = C.gold; }} onBlur={(e) => { e.target.style.borderColor = tc.rowBorder; }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 'max(7px, 0.38vw)', color: tc.dimText, textTransform: 'uppercase', marginBottom: '0.15rem' }}>{t('admin.dashboard.contact.fieldDescription')}</div>
                        <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          rows={3}
                          style={{ ...inputStyle, resize: 'vertical' }}
                          onFocus={(e) => { e.target.style.borderColor = C.gold; }} onBlur={(e) => { e.target.style.borderColor = tc.rowBorder; }} />
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <SciFiButton onClick={saveEdit} size="sm" fontSize="max(9px, 0.45vw)">{t('admin.dashboard.contact.saveEdit')}</SciFiButton>
                        <SciFiButton onClick={() => setEditingBrand(null)} variant="white" size="sm" fontSize="max(9px, 0.45vw)">{t('admin.dashboard.contact.cancel')}</SciFiButton>
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
          <DashboardCard title={tFunc('admin.dashboard.contact.requestsTitle')(requests.length)} color="gold">
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
                        }}>{t('admin.dashboard.contact.statusNew')}</span>
                      )}
                      {r.status === 'afgehandeld' && (
                        <span style={{
                          fontSize: 'max(7px, 0.35vw)', padding: '0.05rem 0.25rem', borderRadius: '0.1rem',
                          backgroundColor: 'rgba(74, 222, 128, 0.15)', color: '#4ade80',
                          textTransform: 'uppercase',
                        }}>{t('admin.dashboard.contact.statusHandled')}</span>
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
                      }} title={r.status === 'afgehandeld' ? t('admin.dashboard.contact.markAsNew') : t('admin.dashboard.contact.markAsHandled')}>
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
                  {t('admin.dashboard.contact.noRequests')}
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
  const { t } = useLanguage();
  return <div style={{ textAlign: 'center', opacity: 0.4, padding: '1.5rem 0' }}>{t('admin.dashboard.loading')}</div>;
}

// ═══════════════════════════════════════════════════════════
// Audit Log Tab — categorized audit trail with folder sub-tabs
// ═══════════════════════════════════════════════════════════

function formatDuration(ms, hUnit = 'u') {
  if (!ms || ms <= 0) return '< 1m';
  const totalSec = Math.floor(ms / 1000);
  if (totalSec < 60) return `${totalSec}s`;
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min < 60) return `${min}m ${sec}s`;
  const hr = Math.floor(min / 60);
  const rm = min % 60;
  return `${hr}${hUnit} ${rm}m`;
}

const EVENT_ICONS  = { edit: '✏️', commit: '📦', push: '🚀', admin_login: '🔐', report_view: '📋' };
const EVENT_COLORS = { edit: '#60a5fa', commit: '#4ade80', push: '#c084fc', admin_login: '#f59e0b', report_view: '#34d399' };

// ═══════════════════════════════════════════════════════════
// Activation Codes Tab
// ═══════════════════════════════════════════════════════════

// One-time codes that unlock a full report instead of paying. The backend stores only a
// hash, so a code's plaintext is visible exactly once: in the "just created" panel below,
// until the admin dismisses it. Used and revoked codes are the logbook.
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('nl-NL', {
  day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit',
}) : '—');

const CODE_GRID = '1fr 1.6fr 1fr 0.8fr';

const ActivationCodesTab = memo(() => {
  const { t, tFunc } = useLanguage();
  const [active, setActive] = useState([]);
  const [logbook, setLogbook] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [count, setCount] = useState(1);
  const [label, setLabel] = useState('');
  const [generating, setGenerating] = useState(false);
  const [justCreated, setJustCreated] = useState([]);
  const [copied, setCopied] = useState(false);
  const tc = CARD_COLORS.gold;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getActivationCodes();
      setActive(res.active || []);
      setLogbook(res.logbook || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Plaintext codes must not outlive their panel: leaving the tab drops them from memory.
  useEffect(() => () => setJustCreated([]), []);

  const handleGenerate = async () => {
    const n = Math.min(50, Math.max(1, Number.parseInt(count, 10) || 1));
    setGenerating(true);
    setError(null);
    try {
      const res = await createActivationCodes({ count: n, label });
      setJustCreated(res.codes || []);
      setCopied(false);
      setLabel('');
      await fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(justCreated.map(c => c.code).join('\n'));
      setCopied(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRevoke = async (id, hint) => {
    if (!window.confirm(tFunc('admin.dashboard.activationCodes.confirmRevoke')(hint))) return;
    try {
      await revokeActivationCode(id);
      await fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const usedCount = logbook.filter(c => c.status === 'used').length;
  const headerRow = (cols) => (
    <div style={{ display: 'grid', gridTemplateColumns: CODE_GRID, gap: '0.3rem', padding: '0.4rem 0.5rem', ...HOLO_TABLE_HEAD }}>
      {cols.map(h => (
        <div key={h} style={{ fontSize: 'max(7px, 0.35vw)', color: tc.dimText, textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.05em' }}>{h}</div>
      ))}
    </div>
  );
  const rowStyle = (i, accent) => ({
    display: 'grid', gridTemplateColumns: CODE_GRID, gap: '0.3rem', padding: '0.4rem 0.5rem', alignItems: 'center',
    backgroundColor: i % 2 === 0 ? 'rgba(168, 85, 247, 0.03)' : 'transparent',
    borderLeft: `2px solid ${accent}`, borderRadius: '0 0.15rem 0.15rem 0',
  });
  const hintCell = (hint) => (
    <div style={{ fontSize: 'max(11px, 0.55vw)', fontFamily: 'monospace', color: '#FFFEF0', fontWeight: 'bold', letterSpacing: '0.12em' }}>
      ····-····-{hint}
    </div>
  );
  const labelCell = (text) => (
    <div style={{ fontSize: 'max(8px, 0.42vw)', color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
      {text || <span style={{ color: '#64748b', fontStyle: 'italic' }}>—</span>}
    </div>
  );
  const smallCell = (text, color = '#cbd5e1') => (
    <div style={{ fontSize: 'max(8px, 0.42vw)', color }}>{text}</div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.6rem' }}>
        {[
          { label: t('admin.dashboard.activationCodes.statActive'), value: active.length, color: '#4ade80' },
          { label: t('admin.dashboard.activationCodes.statUsed'), value: usedCount, color: '#60a5fa' },
          { label: t('admin.dashboard.activationCodes.statRevoked'), value: logbook.length - usedCount, color: '#f87171' },
        ].map((stat, i) => (
          <KpiTile key={i} label={stat.label} value={stat.value} color={stat.color} />
        ))}
      </div>

      {error && <ErrorBox msg={error} />}

      {/* Generate */}
      <DashboardCard title={t('admin.dashboard.activationCodes.generateTitle')} color="gold">
        <div style={{ fontSize: 'max(10px, 0.5vw)', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '0.8rem' }}>
          {t('admin.dashboard.activationCodes.generateHelp')}
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', flexDirection: 'column', width: '5rem' }}>
            <span style={FIELD_LABEL}>{t('admin.dashboard.activationCodes.countLabel')}</span>
            <input type="number" min={1} max={50} value={count} onChange={e => setCount(e.target.value)} style={INPUT_SM} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', flex: '1 1 12rem' }}>
            <span style={FIELD_LABEL}>{t('admin.dashboard.activationCodes.labelLabel')}</span>
            <input type="text" maxLength={80} value={label} onChange={e => setLabel(e.target.value)}
              placeholder={t('admin.dashboard.activationCodes.labelPlaceholder')} style={INPUT_SM} />
          </label>
          <SciFiButton onClick={handleGenerate} disabled={generating}>
            {generating ? t('admin.dashboard.activationCodes.generating') : t('admin.dashboard.activationCodes.generate')}
          </SciFiButton>
        </div>

        {justCreated.length > 0 && (
          <div style={{
            marginTop: '1rem', padding: '0.8rem', borderRadius: '0.15rem',
            border: '1px solid rgba(74, 222, 128, 0.35)', background: 'rgba(74, 222, 128, 0.05)',
          }}>
            <div style={{ ...LABEL, color: '#4ade80', opacity: 1 }}>
              {tFunc('admin.dashboard.activationCodes.newCodesTitle')(justCreated.length)}
            </div>
            <div style={{ fontSize: 'max(10px, 0.5vw)', color: '#fca5a5', margin: '0.3rem 0 0.7rem' }}>
              {t('admin.dashboard.activationCodes.newCodesWarning')}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(11rem, 1fr))', gap: '0.4rem', marginBottom: '0.8rem' }}>
              {justCreated.map(c => (
                <div key={c._id} style={{
                  fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '0.12em', color: '#FFFEF0',
                  fontSize: 'max(12px, 0.62vw)', padding: '0.35rem 0.5rem', background: 'rgba(0,0,0,0.4)', borderRadius: '0.15rem',
                  userSelect: 'all',
                }}>{c.code}</div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <SciFiButton size="sm" onClick={handleCopyAll}>
                {copied ? t('admin.dashboard.activationCodes.copied') : t('admin.dashboard.activationCodes.copyAll')}
              </SciFiButton>
              <SciFiButton size="sm" variant="white" onClick={() => setJustCreated([])}>
                {t('admin.dashboard.activationCodes.dismiss')}
              </SciFiButton>
            </div>
          </div>
        )}
      </DashboardCard>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <SciFiButton onClick={fetchData} size="xs" padding="0.25rem 0.6rem" fontSize="max(8px, 0.4vw)">{t('admin.dashboard.activationCodes.refresh')}</SciFiButton>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: tc.dimText, fontSize: 'max(10px, 0.5vw)' }}>{t('admin.dashboard.activationCodes.loading')}</div>
      ) : (
        <>
          {/* Active */}
          <DashboardCard title={tFunc('admin.dashboard.activationCodes.activeTitle')(active.length)} color="gold">
            {active.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: '#ffffff40', fontSize: 'max(10px, 0.5vw)' }}>
                {t('admin.dashboard.activationCodes.activeEmpty')}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', maxHeight: '40vh', overflowY: 'auto' }}>
                {headerRow([
                  t('admin.dashboard.activationCodes.colCode'), t('admin.dashboard.activationCodes.colLabel'),
                  t('admin.dashboard.activationCodes.colCreated'), t('admin.dashboard.activationCodes.colActions'),
                ])}
                {active.map((c, i) => (
                  <div key={c._id} className="holo-row" style={rowStyle(i, '#4ade80')}>
                    {hintCell(c.hint)}
                    {labelCell(c.label)}
                    {smallCell(fmtDateTime(c.createdAt))}
                    <div>
                      <SciFiButton size="xs" variant="danger" onClick={() => handleRevoke(c._id, c.hint)}>
                        {t('admin.dashboard.activationCodes.revoke')}
                      </SciFiButton>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DashboardCard>

          {/* Logbook */}
          <DashboardCard title={tFunc('admin.dashboard.activationCodes.logbookTitle')(logbook.length)} color="gold">
            {logbook.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: '#ffffff40', fontSize: 'max(10px, 0.5vw)' }}>
                {t('admin.dashboard.activationCodes.logbookEmpty')}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', maxHeight: '55vh', overflowY: 'auto' }}>
                {headerRow([
                  t('admin.dashboard.activationCodes.colCode'), t('admin.dashboard.activationCodes.colLabel'),
                  t('admin.dashboard.activationCodes.colWhen'), t('admin.dashboard.activationCodes.colStatus'),
                ])}
                {logbook.map((c, i) => {
                  const used = c.status === 'used';
                  return (
                    <div key={c._id} className="holo-row" style={{ ...rowStyle(i, used ? '#60a5fa' : '#f87171'), opacity: 0.85 }}>
                      {hintCell(c.hint)}
                      {labelCell(c.label)}
                      {smallCell(fmtDateTime(used ? c.usedAt : c.revokedAt))}
                      {smallCell(
                        used ? t('admin.dashboard.activationCodes.statusUsed') : t('admin.dashboard.activationCodes.statusRevoked'),
                        used ? '#60a5fa' : '#f87171',
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </DashboardCard>
        </>
      )}
    </div>
  );
});

// ═══════════════════════════════════════════════════════════
// Report Unlocks Tab — the 14-day money-back guarantee
// ═══════════════════════════════════════════════════════════

const UNLOCK_GRID = '1fr 1.3fr 0.9fr 1.3fr 0.9fr';
const UNLOCK_BADGE = { display: 'inline-block', padding: '0.05rem 0.35rem', borderRadius: '0.15rem', border: '1px solid', fontSize: 'max(7px, 0.35vw)', fontWeight: 'bold', letterSpacing: '0.1em' };
const fmtEuro = (cents, currency = 'EUR') => new Intl.NumberFormat('nl-NL', { style: 'currency', currency }).format((cents || 0) / 100);
const fmtDay = (d) => (d ? new Date(d).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '');

// A refund cannot be undone (Stripe pays out, the code is blocked), so the admin types this word first.
const REFUND_CONFIRM_WORD = 'Terugbetalen';

function RefundConfirm({ label, amount, email, busy, onCancel, onConfirm }) {
  const { t, tFunc } = useLanguage();
  const [typed, setTyped] = useState('');
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);
  const matches = typed.trim().toLowerCase() === REFUND_CONFIRM_WORD.toLowerCase();

  return (
    <div role="alertdialog" aria-labelledby="gfl-refund-confirm-title" style={{
      display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.7rem 0.8rem',
      borderLeft: '2px solid rgba(248, 113, 113, 0.7)', background: 'rgba(248, 113, 113, 0.06)', borderRadius: '0 0.15rem 0.15rem 0',
    }}>
      <div id="gfl-refund-confirm-title" style={{ fontSize: 'max(9px, 0.45vw)', fontWeight: 'bold', color: '#fca5a5', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {t('admin.dashboard.reportUnlocks.confirmTitle')}
      </div>
      <div style={{ fontSize: 'max(10px, 0.5vw)', color: '#FFFEF0', overflowWrap: 'anywhere' }}>
        <span style={{ fontFamily: 'monospace' }}>{label}</span>{amount ? ` · ${amount}` : ''}{email ? ` · ${email}` : ''}
      </div>
      <div style={{ fontSize: 'max(10px, 0.5vw)', color: '#cbd5e1', lineHeight: 1.6 }}>{t('admin.dashboard.reportUnlocks.confirmBody')}</div>
      <form
        onSubmit={(e) => { e.preventDefault(); if (matches && !busy) onConfirm(); }}
        style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', flexWrap: 'wrap', margin: 0 }}
      >
        <label style={{ display: 'flex', flexDirection: 'column', flex: '1 1 12rem' }}>
          <span style={FIELD_LABEL}>{tFunc('admin.dashboard.reportUnlocks.confirmTypeLabel')(REFUND_CONFIRM_WORD)}</span>
          <input ref={inputRef} value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={REFUND_CONFIRM_WORD}
            autoComplete="off" spellCheck={false} disabled={busy} style={INPUT_SM} />
        </label>
        <SciFiButton type="button" size="sm" variant="white" onClick={onCancel} disabled={busy}>{t('admin.dashboard.reportUnlocks.cancel')}</SciFiButton>
        <SciFiButton type="submit" size="sm" variant="danger" disabled={!matches || busy}>{t('admin.dashboard.reportUnlocks.refund')}</SciFiButton>
      </form>
    </div>
  );
}

const ReportUnlocksTab = memo(() => {
  const { t, tFunc } = useLanguage();
  const [unlocks, setUnlocks] = useState([]);
  const [windowDays, setWindowDays] = useState(14);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState(null);
  // Moderator review for a grey-listed email: { unlock, answers: {reason, readFully, expected}, notes }
  const [review, setReview] = useState(null);
  // Typed confirmation before any refund: { unlock, reviewPayload? }
  const [confirming, setConfirming] = useState(null);
  const tc = CARD_COLORS.gold;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getReportUnlocks();
      setUnlocks(res.unlocks || []);
      if (res.refundWindowDays) setWindowDays(res.refundWindowDays);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // An unlinked payment (refund window closed) carries no Stripe id any more — shown as a dash.
  const refLabel = (u) => (u.method === 'payment' ? (u.paymentUnlinked ? '—' : (u.reference || '—')) : `····-····-${u.referenceHint || '····'}`);
  const searchText = (u) => `${refLabel(u)} ${u.email || ''}`;

  const REVIEW_KEYS = [['reason', 'qReason'], ['readFully', 'qReadFully'], ['expected', 'qExpected']];

  // Grey-listed email → moderator review first; every refund then waits for the typed confirmation.
  const handleRefund = (u, reviewPayload) => {
    if (u.greylisted && !reviewPayload) {
      setConfirming(null);
      setReview({ unlock: u, answers: { reason: '', readFully: '', expected: '' }, notes: '' });
      return;
    }
    setError(null);
    setConfirming({ unlock: u, reviewPayload });
  };

  const toggleHold = async (u, hold) => {
    setBusyId(u._id);
    setError(null);
    setNotice('');
    try {
      const res = await holdReportPaymentLink(u._id, hold);
      setNotice(hold ? tFunc('admin.dashboard.reportUnlocks.heldResult')(fmtDay(res.linkHeldUntil)) : t('admin.dashboard.reportUnlocks.releasedResult'));
      await fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const confirmRefund = async () => {
    if (!confirming) return;
    const { unlock: u, reviewPayload } = confirming;
    setBusyId(u._id);
    setError(null);
    setNotice('');
    try {
      const res = await refundReportUnlock(u._id, reviewPayload);
      const effect = res.accountEffect;
      if (effect && effect.accountDeleted) {
        setNotice(t('admin.dashboard.reportUnlocks.refundedAccountDeleted'));
      } else {
        const until = effect && !effect.accountMissing && effect.accessUntilAfter ? fmtDay(effect.accessUntilAfter) : '';
        setNotice(tFunc('admin.dashboard.reportUnlocks.refundedResult')(until));
      }
      setReview(null);
      await fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setConfirming(null);
      setBusyId(null);
    }
  };

  const confirmBox = (u) => (
    <RefundConfirm
      key={`confirm-${u._id}`}
      label={refLabel(u)}
      amount={u.method === 'payment' ? fmtEuro(u.amountCents, u.currency) : ''}
      email={u.email || ''}
      busy={busyId === u._id}
      onCancel={() => setConfirming(null)}
      onConfirm={confirmRefund}
    />
  );

  const reviewComplete = () => {
    const complete = REVIEW_KEYS.every(([k]) => review.answers[k].trim());
    if (!complete) setError(t('admin.dashboard.reportUnlocks.reviewIncomplete'));
    return complete;
  };

  const submitReview = () => {
    if (!reviewComplete()) return;
    handleRefund(review.unlock, { answers: review.answers, notes: review.notes });
  };

  const submitDecline = async () => {
    if (!reviewComplete()) return;
    setBusyId(review.unlock._id);
    setError(null);
    setNotice('');
    try {
      await declineReportRefund(review.unlock._id, { answers: review.answers, notes: review.notes });
      setNotice(t('admin.dashboard.reportUnlocks.declinedResult'));
      setReview(null);
      await fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const q = query.trim().toLowerCase();
  const shown = q ? unlocks.filter(u => searchText(u).toLowerCase().includes(q)) : unlocks;
  const now = Date.now();
  const paid = unlocks.filter(u => u.method === 'payment');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.6rem' }}>
        {[
          { label: t('admin.dashboard.reportUnlocks.statTotal'), value: unlocks.length, color: C.gold },
          { label: t('admin.dashboard.reportUnlocks.statPaid'), value: paid.length, color: '#4ade80' },
          { label: t('admin.dashboard.reportUnlocks.statCode'), value: unlocks.length - paid.length, color: '#60a5fa' },
          { label: t('admin.dashboard.reportUnlocks.statRefunded'), value: unlocks.filter(u => u.status === 'refunded').length, color: '#f87171' },
        ].map((stat, i) => (
          <KpiTile key={i} label={stat.label} value={stat.value} color={stat.color} />
        ))}
      </div>

      {error && <ErrorBox msg={error} />}
      {notice && (
        <div role="status" style={{ padding: '0.5rem 0.7rem', borderLeft: '2px solid rgba(74, 222, 128, 0.6)', background: 'rgba(74, 222, 128, 0.08)', color: '#86efac', fontSize: 'max(10px, 0.5vw)' }}>
          {notice}
        </div>
      )}

      {review && (
        <DashboardCard title={t('admin.dashboard.reportUnlocks.reviewTitle')} color="gold">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
            <div style={{ fontSize: 'max(10px, 0.5vw)', color: '#cbd5e1', lineHeight: 1.6 }}>
              <strong style={{ color: '#FFFEF0' }}>{review.unlock.email || refLabel(review.unlock)}</strong>
              {' · '}{tFunc('admin.dashboard.reportUnlocks.greylistedTitle')((review.unlock.previousRefunds || []).map(fmtDay).join(', '))}
            </div>
            <div style={{ fontSize: 'max(10px, 0.5vw)', color: '#cbd5e1', lineHeight: 1.6 }}>{t('admin.dashboard.reportUnlocks.reviewLead')}</div>
            {REVIEW_KEYS.map(([k, labelKey]) => (
              <label key={k} style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={FIELD_LABEL}>{t(`admin.dashboard.reportUnlocks.${labelKey}`)}</span>
                <textarea rows={2} maxLength={1000} value={review.answers[k]}
                  onChange={e => setReview(r => ({ ...r, answers: { ...r.answers, [k]: e.target.value } }))}
                  style={{ ...TEXTAREA, minHeight: '3.2rem', fontFamily: 'inherit' }} />
              </label>
            ))}
            <label style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={FIELD_LABEL}>{t('admin.dashboard.reportUnlocks.reviewNotes')}</span>
              <textarea rows={2} maxLength={2000} value={review.notes}
                onChange={e => setReview(r => ({ ...r, notes: e.target.value }))}
                style={{ ...TEXTAREA, minHeight: '3.2rem', fontFamily: 'inherit' }} />
            </label>
            {confirming?.reviewPayload && confirming.unlock._id === review.unlock._id ? confirmBox(review.unlock) : (
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <SciFiButton size="sm" variant="white" onClick={() => setReview(null)}>{t('admin.dashboard.reportUnlocks.cancel')}</SciFiButton>
                <SciFiButton size="sm" variant="purple" disabled={busyId === review.unlock._id} onClick={submitDecline}>
                  {t('admin.dashboard.reportUnlocks.declineAfterReview')}
                </SciFiButton>
                <SciFiButton size="sm" variant="danger" disabled={busyId === review.unlock._id} onClick={submitReview}>
                  {t('admin.dashboard.reportUnlocks.refundAfterReview')}
                </SciFiButton>
              </div>
            )}
          </div>
        </DashboardCard>
      )}

      <DashboardCard title={tFunc('admin.dashboard.reportUnlocks.title')(unlocks.length)} color="gold">
        <div style={{ fontSize: 'max(10px, 0.5vw)', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '0.4rem' }}>
          {tFunc('admin.dashboard.reportUnlocks.help')(windowDays)}
        </div>
        <div style={{ fontSize: 'max(9px, 0.45vw)', color: tc.dimText, lineHeight: 1.6, marginBottom: '0.8rem' }}>
          {t('admin.dashboard.reportUnlocks.manualNote')}
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.8rem' }}>
          <input type="search" value={query} onChange={e => setQuery(e.target.value)}
            placeholder={t('admin.dashboard.reportUnlocks.searchPlaceholder')} style={{ ...INPUT_SM, flex: '1 1 14rem' }} />
          <SciFiButton onClick={fetchData} size="xs" padding="0.25rem 0.6rem" fontSize="max(8px, 0.4vw)">{t('admin.dashboard.reportUnlocks.refresh')}</SciFiButton>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: tc.dimText, fontSize: 'max(10px, 0.5vw)' }}>{t('admin.dashboard.reportUnlocks.loading')}</div>
        ) : shown.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: '#ffffff40', fontSize: 'max(10px, 0.5vw)' }}>{t('admin.dashboard.reportUnlocks.empty')}</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', minWidth: '36rem', maxHeight: '60vh', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: UNLOCK_GRID, gap: '0.3rem', padding: '0.4rem 0.5rem', ...HOLO_TABLE_HEAD }}>
                {['colWhen', 'colMethod', 'colAccount', 'colStatus', 'colActions'].map(k => (
                  <div key={k} style={{ fontSize: 'max(7px, 0.35vw)', color: tc.dimText, textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.05em' }}>{t(`admin.dashboard.reportUnlocks.${k}`)}</div>
                ))}
              </div>
              {shown.map((u, i) => {
                const refunded = u.status === 'refunded';
                const linkHeld = !!u.linkHeldUntil && new Date(u.linkHeldUntil) > new Date();
                const isPayment = u.method === 'payment';
                const inWindow = isPayment && u.refundableUntil && new Date(u.refundableUntil).getTime() > now;
                return (
                  <React.Fragment key={u._id}>
                  <div className="holo-row" style={{
                    display: 'grid', gridTemplateColumns: UNLOCK_GRID, gap: '0.3rem', padding: '0.4rem 0.5rem', alignItems: 'center',
                    backgroundColor: i % 2 === 0 ? 'rgba(168, 85, 247, 0.03)' : 'transparent',
                    borderLeft: `2px solid ${refunded ? '#f87171' : isPayment ? '#4ade80' : '#60a5fa'}`,
                    borderRadius: '0 0.15rem 0.15rem 0', opacity: refunded ? 0.75 : 1,
                  }}>
                    <div style={{ fontSize: 'max(8px, 0.42vw)', color: '#cbd5e1' }}>{fmtDateTime(u.unlockedAt)}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 'max(8px, 0.42vw)', color: '#FFFEF0', fontWeight: 'bold' }}>
                        {isPayment ? `${t('admin.dashboard.reportUnlocks.methodPayment')} · ${fmtEuro(u.amountCents, u.currency)}` : t('admin.dashboard.reportUnlocks.methodCode')}
                      </div>
                      <div style={{ fontSize: 'max(8px, 0.4vw)', fontFamily: 'monospace', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{refLabel(u)}</div>
                      {isPayment && (
                        <div style={{ fontSize: 'max(8px, 0.4vw)', color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {u.email || <span style={{ color: '#64748b', fontStyle: 'italic' }}>{t('admin.dashboard.reportUnlocks.noEmail')}</span>}
                        </div>
                      )}
                      {u.greylisted && (
                        <div title={tFunc('admin.dashboard.reportUnlocks.greylistedTitle')((u.previousRefunds || []).map(fmtDay).join(', '))}
                          style={{ display: 'inline-block', marginTop: '0.2rem', padding: '0.05rem 0.35rem', borderRadius: '0.15rem', border: '1px solid rgba(148, 163, 184, 0.5)', background: 'rgba(148, 163, 184, 0.12)', color: '#cbd5e1', fontSize: 'max(7px, 0.35vw)', fontWeight: 'bold', letterSpacing: '0.1em' }}>
                          {tFunc('admin.dashboard.reportUnlocks.greylisted')((u.previousRefunds || []).length)}
                        </div>
                      )}
                      {(u.moderatorReviews || []).some(v => v.decision === 'declined') && (
                        <div style={{ fontSize: 'max(7px, 0.35vw)', color: '#c4b5fd', marginTop: '0.15rem' }}>
                          {tFunc('admin.dashboard.reportUnlocks.declined')((u.moderatorReviews || []).filter(v => v.decision === 'declined').length)}
                        </div>
                      )}
                      {/* Download log + provider flags (Stripe payments) */}
                      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
                        {isPayment && !refunded && !u.deliveredAt && (
                          <span title={t('admin.dashboard.reportUnlocks.notDeliveredTitle')} style={{ ...UNLOCK_BADGE, borderColor: 'rgba(249, 115, 22, 0.6)', background: 'rgba(249, 115, 22, 0.12)', color: '#fdba74' }}>
                            {t('admin.dashboard.reportUnlocks.notDelivered')}
                          </span>
                        )}
                        {u.disputedAt && (
                          <span style={{ ...UNLOCK_BADGE, borderColor: 'rgba(239, 68, 68, 0.6)', background: 'rgba(239, 68, 68, 0.12)', color: '#fca5a5' }}>
                            {tFunc('admin.dashboard.reportUnlocks.disputed')(u.disputeReason || '')}
                          </span>
                        )}
                        {isPayment && u.paymentUnlinked && (
                          <span title={t('admin.dashboard.reportUnlocks.unlinkedTitle')} style={{ ...UNLOCK_BADGE, borderColor: 'rgba(148, 163, 184, 0.5)', background: 'rgba(148, 163, 184, 0.1)', color: '#cbd5e1' }}>
                            {t('admin.dashboard.reportUnlocks.unlinked')}
                          </span>
                        )}
                        {isPayment && !u.paymentUnlinked && linkHeld && (
                          <span title={t('admin.dashboard.reportUnlocks.heldTitle')} style={{ ...UNLOCK_BADGE, borderColor: 'rgba(255, 174, 0, 0.6)', background: 'rgba(255, 174, 0, 0.1)', color: '#ffae00' }}>
                            {tFunc('admin.dashboard.reportUnlocks.heldUntil')(fmtDay(u.linkHeldUntil))}
                          </span>
                        )}
                        {u.testmode && (
                          <span style={{ ...UNLOCK_BADGE, borderColor: 'rgba(34, 211, 238, 0.5)', background: 'rgba(34, 211, 238, 0.1)', color: '#67e8f9' }}>
                            {t('admin.dashboard.reportUnlocks.testmode')}
                          </span>
                        )}
                      </div>
                      {isPayment && u.deliveredAt && (
                        <div style={{ fontSize: 'max(7px, 0.35vw)', color: '#94a3b8', marginTop: '0.15rem' }}>
                          {tFunc('admin.dashboard.reportUnlocks.delivered')(fmtDateTime(u.deliveredAt))}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: 'max(8px, 0.42vw)', color: u.accountLinked ? '#4ade80' : '#94a3b8' }}>
                      {!u.hasCode ? t('admin.dashboard.reportUnlocks.noCode') : u.accountLinked ? t('admin.dashboard.reportUnlocks.accountLinked') : t('admin.dashboard.reportUnlocks.accountNone')}
                    </div>
                    <div style={{ fontSize: 'max(8px, 0.42vw)' }}>
                      <div style={{ fontWeight: 'bold', color: refunded ? '#f87171' : '#4ade80' }}>
                        {refunded ? t('admin.dashboard.reportUnlocks.statusRefunded') : t('admin.dashboard.reportUnlocks.statusActive')}
                      </div>
                      <div style={{ color: '#94a3b8' }}>
                        {refunded ? fmtDateTime(u.refundedAt)
                          : !isPayment ? t('admin.dashboard.reportUnlocks.notRefundable')
                          : inWindow ? tFunc('admin.dashboard.reportUnlocks.refundableUntil')(fmtDay(u.refundableUntil))
                          : t('admin.dashboard.reportUnlocks.windowClosed')}
                      </div>
                    </div>
                    <div>
                      {!refunded && inWindow && (
                        <SciFiButton size="xs" variant="danger" disabled={busyId === u._id} onClick={() => handleRefund(u)}>
                          {t('admin.dashboard.reportUnlocks.refund')}
                        </SciFiButton>
                      )}
                      {isPayment && !u.paymentUnlinked && (
                        <SciFiButton size="xs" disabled={busyId === u._id} onClick={() => toggleHold(u, !linkHeld)}
                          title={t(linkHeld ? 'admin.dashboard.reportUnlocks.releaseTitle' : 'admin.dashboard.reportUnlocks.holdTitle')}
                          style={{ marginTop: '0.25rem' }}>
                          {t(linkHeld ? 'admin.dashboard.reportUnlocks.release' : 'admin.dashboard.reportUnlocks.hold')}
                        </SciFiButton>
                      )}
                    </div>
                  </div>
                  {confirming && !confirming.reviewPayload && confirming.unlock._id === u._id && confirmBox(u)}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}
      </DashboardCard>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════
// Payment Records Tab — stored PDF per payment / refund, single + folder download
// ═══════════════════════════════════════════════════════════

const RECORD_GRID = '1fr 1fr 0.9fr 1.3fr 0.8fr 0.8fr';

/** ISO instant → value for <input type="datetime-local"> in the admin's local time, and back. */
const toLocalInput = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};
const parseCountries = (s) => String(s || '').split(/[\s,;]+/).map(c => c.trim().toUpperCase()).filter(Boolean);

/**
 * Payment settings — the flip moment and the country gate (apps/backend/services/paymentConfig.js).
 * Read at request time by the backend, so a save takes effect within seconds, without a deploy.
 */
const PaymentConfigCard = memo(() => {
  const { t, tFunc } = useLanguage();
  const [data, setData] = useState(null);
  const [form, setForm] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);

  const apply = useCallback((res) => {
    setData(res);
    setForm({
      flipAt: toLocalInput(res.stored.flipAt),
      openAtFlip: !!res.stored.gate.openAtFlip,
      launchCountries: res.stored.gate.launchCountries.join(', '),
      openCountries: res.stored.gate.openCountries.join(', '),
    });
  }, []);

  useEffect(() => { getPaymentConfigAdmin().then(apply).catch(err => setError(err.message)); }, [apply]);

  const save = async () => {
    setSaving(true); setError(null); setNotice('');
    try {
      const res = await updatePaymentConfigAdmin({
        flipAt: new Date(form.flipAt).toISOString(),
        gate: { openAtFlip: form.openAtFlip, launchCountries: parseCountries(form.launchCountries), openCountries: parseCountries(form.openCountries) },
      });
      apply(res);
      setNotice(t('admin.dashboard.paymentRecords.configSaved'));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const eff = data?.effective;
  return (
    <DashboardCard title={t('admin.dashboard.paymentRecords.configTitle')} color="gold">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
        <div style={{ fontSize: 'max(10px, 0.5vw)', color: '#cbd5e1', lineHeight: 1.6 }}>{t('admin.dashboard.paymentRecords.configHelp')}</div>
        {error && <ErrorBox msg={error} />}
        {eff && (
          <div style={{ fontSize: 'max(9px, 0.45vw)', color: eff.enabled ? '#86efac' : '#fdba74', fontFamily: 'monospace' }}>
            {tFunc('admin.dashboard.paymentRecords.configNow')(eff.enabled, fmtEuro(eff.grossCents, eff.currency), (eff.allowedCountries || []).join(', '))}
          </div>
        )}
        {form && (
          <>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <label style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={FIELD_LABEL}>{t('admin.dashboard.paymentRecords.configFlipAt')}</span>
                <input type="datetime-local" value={form.flipAt} onChange={e => setForm(f => ({ ...f, flipAt: e.target.value }))} style={{ ...INPUT_SM, minWidth: '13rem' }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', flex: '1 1 8rem' }}>
                <span style={FIELD_LABEL}>{t('admin.dashboard.paymentRecords.configLaunchCountries')}</span>
                <input value={form.launchCountries} onChange={e => setForm(f => ({ ...f, launchCountries: e.target.value }))} style={INPUT_SM} />
              </label>
            </div>
            <label style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={FIELD_LABEL}>{t('admin.dashboard.paymentRecords.configOpenCountries')}</span>
              <input value={form.openCountries} onChange={e => setForm(f => ({ ...f, openCountries: e.target.value }))} style={INPUT_SM} />
            </label>
            <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: 'max(10px, 0.5vw)', color: '#FFFEF0', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.openAtFlip} onChange={e => setForm(f => ({ ...f, openAtFlip: e.target.checked }))} style={{ accentColor: C.gold }} />
              {t('admin.dashboard.paymentRecords.configOpenAtFlip')}
            </label>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', justifyContent: 'flex-end' }}>
              {notice && <span style={{ fontSize: 'max(9px, 0.45vw)', color: '#86efac' }}>{notice}</span>}
              <SciFiButton size="sm" disabled={saving || !form.flipAt} onClick={save}>{t('admin.dashboard.paymentRecords.configSave')}</SciFiButton>
            </div>
          </>
        )}
      </div>
    </DashboardCard>
  );
});

const PaymentRecordsTab = memo(() => {
  const { t, tFunc } = useLanguage();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [year, setYear] = useState('all');
  const [busy, setBusy] = useState(null); // record id | 'zip'
  const tc = CARD_COLORS.gold;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPaymentRecords();
      setRecords(res.records || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const years = [...new Set(records.map(r => r.year))].sort((a, b) => b - a);
  const shown = year === 'all' ? records : records.filter(r => r.year === Number(year));
  // Stripe test-mode records (TEST- numbers) never count as money.
  const received = shown.filter(r => r.kind === 'payment' && !r.testmode).reduce((n, r) => n + r.amountCents, 0);
  const refunded = shown.filter(r => r.kind === 'refund' && !r.testmode).reduce((n, r) => n + r.amountCents, 0);

  const run = async (key, fn) => {
    setBusy(key);
    setError(null);
    try { await fn(); } catch (err) { setError(err.message); } finally { setBusy(null); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.6rem' }}>
        {[
          { label: t('admin.dashboard.paymentRecords.received'), value: fmtEuro(received), color: '#4ade80' },
          { label: t('admin.dashboard.paymentRecords.refunded'), value: fmtEuro(refunded), color: '#f87171' },
          { label: t('admin.dashboard.paymentRecords.net'), value: fmtEuro(received + refunded), color: C.gold },
          { label: t('admin.dashboard.paymentRecords.count'), value: shown.length, color: '#60a5fa' },
        ].map((stat, i) => (
          <KpiTile key={i} label={stat.label} value={stat.value} color={stat.color} />
        ))}
      </div>

      {error && <ErrorBox msg={error} />}

      <PaymentConfigCard />

      <DashboardCard title={tFunc('admin.dashboard.paymentRecords.title')(shown.length)} color="gold">
        <div style={{ fontSize: 'max(10px, 0.5vw)', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '0.8rem' }}>
          {t('admin.dashboard.paymentRecords.help')}
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '0.8rem' }}>
          <label style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={FIELD_LABEL}>{t('admin.dashboard.paymentRecords.year')}</span>
            <select value={year} onChange={e => setYear(e.target.value)} style={{ ...INPUT_SM, minWidth: '8rem' }}>
              <option value="all">{t('admin.dashboard.paymentRecords.allYears')}</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>
          <SciFiButton disabled={busy === 'zip' || shown.length === 0}
            onClick={() => run('zip', () => downloadPaymentRecordsArchive(year === 'all' ? undefined : Number(year)))}>
            {busy === 'zip' ? t('admin.dashboard.paymentRecords.downloading') : t('admin.dashboard.paymentRecords.downloadFolder')}
          </SciFiButton>
          <SciFiButton onClick={fetchData} size="xs" padding="0.25rem 0.6rem" fontSize="max(8px, 0.4vw)">{t('admin.dashboard.paymentRecords.refresh')}</SciFiButton>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: tc.dimText, fontSize: 'max(10px, 0.5vw)' }}>{t('admin.dashboard.paymentRecords.loading')}</div>
        ) : shown.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: '#ffffff40', fontSize: 'max(10px, 0.5vw)' }}>{t('admin.dashboard.paymentRecords.empty')}</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', minWidth: '38rem', maxHeight: '60vh', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: RECORD_GRID, gap: '0.3rem', padding: '0.4rem 0.5rem', ...HOLO_TABLE_HEAD }}>
                {['colNumber', 'colDate', 'colKind', 'colReference', 'colAmount', 'colFile'].map(k => (
                  <div key={k} style={{ fontSize: 'max(7px, 0.35vw)', color: tc.dimText, textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.05em' }}>{t(`admin.dashboard.paymentRecords.${k}`)}</div>
                ))}
              </div>
              {shown.map((r, i) => {
                const refund = r.kind === 'refund';
                return (
                  <div key={r._id} className="holo-row" style={{
                    display: 'grid', gridTemplateColumns: RECORD_GRID, gap: '0.3rem', padding: '0.4rem 0.5rem', alignItems: 'center',
                    backgroundColor: i % 2 === 0 ? 'rgba(168, 85, 247, 0.03)' : 'transparent',
                    borderLeft: `2px solid ${refund ? '#f87171' : '#4ade80'}`, borderRadius: '0 0.15rem 0.15rem 0',
                  }}>
                    <div style={{ fontSize: 'max(9px, 0.45vw)', fontFamily: 'monospace', color: '#FFFEF0', fontWeight: 'bold' }}>{r.number}</div>
                    <div style={{ fontSize: 'max(8px, 0.42vw)', color: '#cbd5e1' }}>{fmtDateTime(r.issuedAt)}</div>
                    <div style={{ fontSize: 'max(8px, 0.42vw)', color: refund ? '#f87171' : '#4ade80' }}>
                      {refund ? t('admin.dashboard.paymentRecords.kindRefund') : t('admin.dashboard.paymentRecords.kindPayment')}
                      {refund && r.relatesTo && <div style={{ color: '#94a3b8' }}>{tFunc('admin.dashboard.paymentRecords.relatesTo')(r.relatesTo)}</div>}
                    </div>
                    <div style={{ fontSize: 'max(8px, 0.4vw)', fontFamily: 'monospace', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.reference || '—'}</div>
                    <div style={{ fontSize: 'max(8px, 0.42vw)', color: '#FFFEF0', fontWeight: 'bold' }}>{fmtEuro(r.amountCents, r.currency)}</div>
                    <div>
                      <SciFiButton size="xs" disabled={busy === r._id} onClick={() => run(r._id, () => downloadPaymentRecord(r._id))}>
                        {t('admin.dashboard.paymentRecords.download')}
                      </SciFiButton>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </DashboardCard>
    </div>
  );
});

const AUDIT_FOLDERS = [
  { key: 'admin',    labelKey: 'admin.dashboard.audit.folderAdmin',    icon: '🔐', color: '#f59e0b', descKey: 'admin.dashboard.audit.folderAdminDesc' },
  { key: 'sessions', labelKey: 'admin.dashboard.audit.folderSessions', icon: '📊', color: C.gold,    descKey: 'admin.dashboard.audit.folderSessionsDesc' },
];

const AuditLogTab = memo(() => {
  const { t, tFunc } = useLanguage();
  const [folder, setFolder] = useState('admin');
  const [sessions, setSessions] = useState([]);
  const [accessEvents, setAccessEvents] = useState([]);
  const [totalEvents, setTotalEvents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedIdx, setExpandedIdx] = useState(null);
  const tc = CARD_COLORS.gold;

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sessRes, accRes] = await Promise.all([
        getSessions(200).catch(() => ({ sessions: [], totalEvents: 0 })),
        getAccessLog(500).catch(() => ({ events: [] })),
      ]);
      setSessions(sessRes.sessions || []);
      setTotalEvents(sessRes.totalEvents || 0);
      setAccessEvents(accRes.events || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // eslint-disable-next-line no-unused-vars
  const handleClear = async () => {
    if (!window.confirm(t('admin.dashboard.audit.confirmClear'))) return;
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
          { label: t('admin.dashboard.audit.statAdmin'), value: accessEvents.length, color: '#f59e0b' },
          { label: t('admin.dashboard.audit.statSessions'), value: totalSessions, color: C.gold },
          { label: t('admin.dashboard.audit.statTotal'), value: totalEvents, color: '#60a5fa' },
          { label: t('admin.dashboard.audit.statAvgDuration'), value: formatDuration(avgDuration, t('admin.dashboard.audit.hourUnit')), color: '#4ade80' },
        ].map((stat, i) => (
          <KpiTile key={i} label={stat.label} value={stat.value} color={stat.color} />
        ))}
      </div>

      {/* Folder tabs */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {AUDIT_FOLDERS.map(f => (
          <HoloTab key={f.key} active={folder === f.key} count={folderCounts[f.key]}
            onClick={() => { setFolder(f.key); setExpandedIdx(null); }}>
            {t(f.labelKey)}
          </HoloTab>
        ))}

        <SciFiButton onClick={fetchAll} size="xs" padding="0.25rem 0.6rem" fontSize="max(8px, 0.4vw)" style={{ marginLeft: 'auto' }}>{t('admin.dashboard.audit.refresh')}</SciFiButton>
      </div>

      {/* Folder description */}
      <div style={{ fontSize: 'max(8px, 0.4vw)', color: '#888', fontStyle: 'italic', marginTop: '-0.6rem' }}>
        {t(AUDIT_FOLDERS.find(f => f.key === folder)?.descKey || '')}
      </div>

      {error && <ErrorBox msg={error} />}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: tc.dimText, fontSize: 'max(10px, 0.5vw)' }}>{t('admin.dashboard.audit.loading')}</div>
      ) : (
        <>
          {/* ────── Admin & Toegang ────── */}
          {folder === 'admin' && (
            <DashboardCard title={tFunc('admin.dashboard.audit.adminTitle')(accessEvents.length)} color="green">
              {accessEvents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1rem', color: '#4ade8060', fontSize: 'max(10px, 0.5vw)' }}>{t('admin.dashboard.audit.adminEmpty')}</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', maxHeight: '55vh', overflowY: 'auto' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 0.5fr 1fr 1.6fr', gap: '0.3rem', padding: '0.4rem 0.5rem', ...HOLO_TABLE_HEAD }}>
                    {[t('admin.dashboard.audit.colTimestamp'), t('admin.dashboard.audit.colType'), t('admin.dashboard.audit.colReportId'), t('admin.dashboard.audit.colAdminDetail')].map(h => (
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
                        {EVENT_ICONS[ev.type]} {ev.type === 'report_view' ? t('admin.dashboard.audit.eventReport') : t('admin.dashboard.audit.eventLogin')}
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

          {/* ────── Sessions (all events grouped) ────── */}
          {folder === 'sessions' && (
            <DashboardCard title={tFunc('admin.dashboard.audit.sessionsTitle')(totalSessions)} color="gold">
              {sessions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: tc.dimText, fontSize: 'max(10px, 0.5vw)' }}>{t('admin.dashboard.audit.sessionsEmpty')}</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', maxHeight: '55vh', overflowY: 'auto' }}>
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1.4fr 0.8fr 0.5fr 1.2fr',
                    gap: '0.3rem', padding: '0.4rem 0.5rem',
                    ...HOLO_TABLE_HEAD,
                  }}>
                    {[t('admin.dashboard.audit.colDate'), t('admin.dashboard.audit.colDuration'), t('admin.dashboard.audit.colEvents'), t('admin.dashboard.audit.colTypes')].map(h => (
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
                          className="holo-row"
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
                            {formatDuration(s.durationMs, t('admin.dashboard.audit.hourUnit'))}
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
