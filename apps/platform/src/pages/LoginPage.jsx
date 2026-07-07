import React, { memo, useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '@gfl/i18n';
import { login, register, getMe, logout, getToken, setToken, logActivity, saveAssessment, orbLoginFromPdf, orbLinkCode, getHistory, getAssessment } from '@gfl/api-client';
import { setClientOrbCode, setClientOrbConfig, setClientProfile, clearClientMode, getClientOrbCode, getClientOrbConfig } from '../clientMode';
import ClientOrbExperience from '../components/assessment/ClientOrbExperience';
import ProfileDashboard from '../components/assessment/ProfileDashboard';
import AdminDashboardModal from '@gfl/admin-ui';
import {
  C, INPUT, FIELD_LABEL, ERROR_STYLE, SciFiButton,
  PAGE_WRAPPER, SEPARATOR, inputFocus, inputBlur, FONT,
} from '@gfl/ui';
import { OrbSphere3D, LeverDashboard, PaletteDashboard, decodeDNA, decodeOrb3, deriveOrb3, encodeOrb3, orbCodeFromResult, ORB3D_PRESETS } from '../orb';
import { getArchetypeKeyByName } from '@gfl/assessment-core/data/archetypeImages';
import { getArchetypeQuoteByKey } from '@gfl/assessment-core/data/archetypeQuotes';

// localStorage key the reload's loading screen (index.html) reads to show the archetype
// Levensles while the app boots — see index.html's gate script.
const BOOT_LESSON_KEY = 'gfl_boot_lesson';

// Resolve the Levensles for a stored archetype name in the given language and stash it so
// index.html's loading screen can display it across the reload. Empty string clears it.
function stashBootLesson(archetypeName, lang) {
  let lesson = '';
  try {
    const key = archetypeName ? getArchetypeKeyByName(archetypeName) : null;
    lesson = (key ? getArchetypeQuoteByKey(key, lang === 'en' ? 'en' : 'nl') : '') || '';
    localStorage.setItem(BOOT_LESSON_KEY, lesson);
  } catch (_) { /* ignore */ }
  return lesson;
}

/* After a non-admin logs in with email/password, regenerate their crystal-code from the account's
   latest saved assessment (same derivation ClientOrbExperience uses), stash it as the client-mode
   flag + profile, and hard-refresh so App boots into the CLIENT interface — matching the PDF/orb-code
   login path. Returns true if it entered client mode (caller should stop). */
async function enterClientModeFromAccount(user, lang = 'nl') {
  try {
    const h = await getHistory({ limit: 1 });
    const latest = (h.assessments || [])[0];
    if (!latest) return false;
    const d = await getAssessment(latest._id);
    const vec = deriveOrb3(d.archetypeDetails || []);
    const code = (vec ? encodeOrb3(vec) : '') || orbCodeFromResult(d) || '';
    if (!code) return false;
    let me = null; try { me = await getMe(); } catch (_) {}
    setClientOrbCode(code);
    const archetypeName = d.extendedArchetypeName || d.archetypeKey || '';
    setClientProfile({
      displayName: me?.displayName || user?.displayName || '',
      archetypeName,
      country: me?.country || '',
      age: me?.age ?? '',
    });
    stashBootLesson(archetypeName, lang);
    window.location.reload();
    return true;
  } catch (_) {
    return false;
  }
}

// Generic placeholder orb shown on the logged-out login screen (Relational template).
// The user's real crystal is only resolved from their assessment after login. The
// palette panel morphs this to any hardware-group template; Relational is the default.
// 3D template orb — the Agency hardware-group preset (matches the verbindingsmenu login
// icon). The palette panel morphs it to any of the six group templates (ORB3D_PRESETS).
const TEMPLATE_ORB = ORB3D_PRESETS.Agency;
const SESSION_TS_KEY = 'gfl_session_ts';
const SESSION_MAX_AGE = 24 * 60 * 60 * 1000; // 24h

/* If the user completed the assessment, hit "create account" while logged out, and
   just registered/logged in, link that stashed profile to the now-authenticated
   account. Runs once after auth (the token is already set by register()/login()). */
async function linkPendingAssessment() {
  let pending;
  try { pending = localStorage.getItem('gfl_pending_assessment'); } catch (_) { return; }
  if (!pending) return;
  try {
    const saved = await saveAssessment(JSON.parse(pending));
    if (saved?.id) localStorage.setItem('gfl_assessment_id', String(saved.id));
    localStorage.removeItem('gfl_pending_assessment');
    console.log('[GFL] Linked pending assessment to account, id:', saved?.id);
  } catch (err) {
    console.warn('[GFL] Could not link pending assessment:', err?.message);
    // Leave it in storage so a later successful auth can still pick it up.
  }
}

/* ═══════════════════════════════════════════════════════════════════════
   LoginFrame — bespoke translucent container for the login modal.
   Reproduces the EXACT SectorFrame DOM structure used on the Gardens
   landing page (src/pages/GeneralBrandPage/SciFiUI.js).

   The SectorFrame Tailwind classes translate to:
     backdrop-blur-xl  =  backdrop-filter: blur(24px)
     rounded-lg        =  border-radius: 0.5rem
     overflow-hidden    (on inner panel only — corners live outside)
     bg rgba(2,0,3,0.3)
     -top-0.5 / -left-0.5 etc = -0.125rem offsets on corner divs
     w-4 h-4           =  1rem  for corner brackets
     p-5               =  1.25rem content padding

   Structure mirrors SectorFrame exactly:
   ┌ outer (position ctx, NO bg, NO overflow — corners rendered here)
   │  ├ 4 × corner L-brackets (absolute, unclipped)
   │  └ inner panel (bg + blur + shadow + overflow:hidden)
   │       ├ holoSheen overlay
   │       ├ holoScanline overlay
   │       ├ noise overlay
   │       ├ title bar
   │       └ content (z-10 relative, p-5)
   └
   ═══════════════════════════════════════════════════════════════════════ */

const SF_SHADOW =
  '0 6px 30px rgba(0,0,0,0.7), ' +
  '0 0 80px rgba(0,0,0,0.35)';

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

const LoginFrame = ({ title, children, topRight, topLeft, style }) => {
  const mob = typeof window !== 'undefined' && window.innerWidth < 768;
  return (
  <div style={{ position: 'relative', width: mob ? '92vw' : 'min(46vw, 480px)', maxWidth: '480px', minHeight: 'min(23vw, 240px)', display: 'flex', flexDirection: 'column', ...style }}>
    {/* Corner brackets — outside overflow:hidden so they're never clipped */}
    <div style={CORNER('tl')} />
    <div style={CORNER('tr')} />
    <div style={CORNER('bl')} />
    <div style={CORNER('br')} />

    {/* Inner panel — SectorFrame exact */}
    <div style={{
      position: 'relative',
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'rgba(2, 0, 3, 0.3)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderRadius: '0.5rem',
      overflow: 'hidden',
      boxShadow: SF_SHADOW,
      color: C.text,
      fontFamily: FONT,
      fontSize: 'max(12px, 0.65vw)',
    }}>
      {/* Decorative overlays removed for performance */}

      {/* Title bar */}
      {title != null && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0.55rem 1rem',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          backgroundColor: 'rgba(42, 10, 56, 0.35)',
          position: 'relative', zIndex: 2,
        }}>
          {topLeft || <span style={{
            fontFamily: FONT, fontSize: 'max(10px, 0.55vw)',
            textTransform: 'uppercase', letterSpacing: '0.2em',
            fontWeight: 'bold', color: C.gold,
          }}>{title}</span>}
          <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 3, alignItems: 'center' }}>
            {topRight || (
              <>
                <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: C.gold }} />
                <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: C.purple }} />
                <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)' }} />
              </>
            )}
          </div>
        </div>
      )}

      {/* Content — SectorFrame uses z-10 relative p-5 flex-col */}
      <div style={{
        position: 'relative', zIndex: 10,
        padding: '0.95rem',
        display: 'flex', flexDirection: 'column',
        flex: 1,
        height: '100%',
      }}>
        {children}
      </div>
    </div>
  </div>
  );
};

/* ═══════════════════════════════════════════════════ */

const LoginPage = memo(({ isVisible, onBack }) => {
  const { t, language } = useLanguage();
  const [mode, setMode] = useState('login');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Covers the beat between a successful login and the hard-refresh into the client interface —
  // without it the login card visibly freezes. Same dark overlay + setup as the logout flow below.
  const [entering, setEntering] = useState(false);
  const [bootLesson, setBootLesson] = useState('');

  // Enter the client interface: resolve the archetype Levensles (in the selected language),
  // show it on the dark overlay, stash it for index.html's loading screen, then hard-refresh.
  // The overlay is held ~3s so the lesson is readable; the loading screen carries the same text
  // through the boot, so it reads as one continuous ~6s screen instead of a freeze.
  const bootIntoClient = useCallback((archetypeName) => {
    const lesson = stashBootLesson(archetypeName, language);
    setBootLesson(lesson);
    setEntering(true);
    setTimeout(() => window.location.reload(), 3000);
  }, [language]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const [showConsent, setShowConsent] = useState(false);
  const [consentA, setConsentA] = useState(false);
  const [consentB, setConsentB] = useState(false);

  // PDF-code login: the report's LC_ORB_ code is the credential.
  const [usePassword, setUsePassword] = useState(false); // admin fallback to email/password
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadErr, setUploadErr] = useState('');
  const [orbCodeStr, setOrbCodeStr] = useState('');
  // First-time PDF onboarding: the account-creation card that emerges from the orb.
  const [onboarding, setOnboarding] = useState(false);
  const [obUsername, setObUsername] = useState('');
  const [obEmail, setObEmail] = useState('');
  const [obPassword, setObPassword] = useState('');
  const [obShowPassword, setObShowPassword] = useState(false);
  const [obAge, setObAge] = useState('');
  const [obCountry, setObCountry] = useState('');
  const [obArchetype, setObArchetype] = useState(''); // extended archetype name read from the PDF
  const [obReading, setObReading] = useState(null);   // extracted reading (main/support + shape vector) from the PDF
  const [obConsent, setObConsent] = useState(false);
  const [obErr, setObErr] = useState('');
  const [obBusy, setObBusy] = useState(false);
  const [verifyPending, setVerifyPending] = useState(false); // waiting for the email link to be clicked
  const verifyPollRef = useRef(null);
  const [absorbing, setAbsorbing] = useState(false);   // panels + login card floating INTO the orb
  const [emerged, setEmerged] = useState(false);       // account card flowing OUT of the orb
  const [playCfg, setPlayCfg] = useState(() => ({ ...TEMPLATE_ORB, palette: 'Agency' })); // lever-lab orb
  const fileInputRef = useRef(null);

  // ── Flow-animation timers: absorb → grow → emerge, and the exact reverse. Tracked so leaving
  //    the section (or reversing) can cancel any pending step. ──
  const flowTimers = useRef([]);
  const clearFlowTimers = useCallback(() => { flowTimers.current.forEach(clearTimeout); flowTimers.current = []; }, []);
  const scheduleFlow = useCallback((ms, fn) => { flowTimers.current.push(setTimeout(fn, ms)); }, []);

  // Validate that a crystal-code decodes (LC_ORB3_ = 3D, LC_ORB2_/LC_ORB_ = legacy 2D) and keep
  // it for onboarding. The user's real orb is NOT shown here — the template orb stays until the
  // account is created and the hard-refresh loads client mode.
  const acceptOrbCode = useCallback((raw) => {
    const code = String(raw || '').trim();
    if (!code) return false;
    const cfg = code.startsWith('LC_ORB3_') ? decodeOrb3(code) : decodeDNA(code);
    if (!cfg) { setUploadErr('Code kon niet ontcijferd worden.'); return false; }
    setUploadErr(''); setOrbCodeStr(code);
    return true;
  }, []);

  const handleOrbUpload = useCallback(async (file) => {
    if (!file) return;
    setUploadErr(''); setUploadBusy(true);
    setAbsorbing(true);   // the two side panels + login card float INTO the template orb
    try {
      // Run the backend read alongside the absorb animation so the panels have fully flowed
      // into the orb (same easing as the assessment cards) before the account card emerges.
      const [res] = await Promise.all([
        orbLoginFromPdf(file),
        new Promise((r) => setTimeout(r, 950)),
      ]);
      // Linked code → recognised (the code IS the login): persist the session + code and
      // hard-refresh into client mode (skip onboarding).
      if (res.linked && res.token) {
        setToken(res.token);
        setClientOrbCode(res.code);
        // Identity for the client-mode verbindingsmenu (name from the account, archetype from the PDF).
        setClientProfile({ displayName: res.user?.displayName || '', archetypeName: res.archetypeName || '', country: res.user?.country || '', age: res.user?.age ?? '' });
        bootIntoClient(res.archetypeName);
        return;
      }
      // First-time (unlinked) code → the account-creation card flows OUT of the orb.
      if (!acceptOrbCode(res.code)) throw new Error('Code kon niet ontcijferd worden.');
      setObEmail(''); setObPassword(''); setObUsername(''); setObAge(''); setObCountry('');
      setObArchetype(res.archetypeName || '');
      setObReading(res.reading || null);
      setObConsent(false); setObErr('');
      setOnboarding(true);                              // orb grows to full size
      clearFlowTimers();
      scheduleFlow(820, () => setEmerged(true));       // card flows out as the grow finishes
    } catch (err) {
      setUploadErr(err.message || 'Upload mislukt.');
      setAbsorbing(false);   // return the panels/card on failure
    } finally {
      setUploadBusy(false);
    }
  }, [acceptOrbCode, clearFlowTimers, scheduleFlow, bootIntoClient]);

  // "← Terug" on the account card — the EXACT reverse of the forward flow:
  //   1. card flows back INTO the orb  →  2. orb shrinks to template  →  3. panels flow back out.
  const handleOnboardingBack = useCallback(() => {
    clearFlowTimers();
    setEmerged(false);                                                  // 1. card back into the orb
    scheduleFlow(950, () => setOnboarding(false));                      // 2. orb shrinks to template
    scheduleFlow(1900, () => { setAbsorbing(false); setObErr(''); });   // 3. panels flow back out
  }, [clearFlowTimers, scheduleFlow]);

  // Leaving the login section (back to the HoloEarth position) resets the whole structure so a
  // later return is fresh: template orb, panels out, no onboarding.
  useEffect(() => {
    if (isVisible) return;
    clearFlowTimers();
    if (verifyPollRef.current) { clearTimeout(verifyPollRef.current); verifyPollRef.current = null; }
    setAbsorbing(false); setOnboarding(false); setEmerged(false); setVerifyPending(false); setObBusy(false);
    setOrbCodeStr(''); setUploadErr('');
    setObUsername(''); setObEmail(''); setObPassword(''); setObAge(''); setObCountry(''); setObConsent(false); setObErr('');
  }, [isVisible, clearFlowTimers]);

  // Clear any pending flow / verification-poll timers on unmount.
  useEffect(() => () => {
    clearFlowTimers();
    if (verifyPollRef.current) clearTimeout(verifyPollRef.current);
  }, [clearFlowTimers]);

  // Link the crystal-code + stash identity, then hard-refresh into client mode. Called once the
  // account is usable (register-without-verification, or after the email link is confirmed).
  const proceedIntoClient = useCallback(() => {
    setClientOrbCode(orbCodeStr);
    setClientProfile({ displayName: obUsername, archetypeName: obArchetype, country: obCountry, age: obAge });
    bootIntoClient(obArchetype);
  }, [orbCodeStr, obUsername, obArchetype, obCountry, obAge, bootIntoClient]);

  // Poll /login until the emailed verification link is clicked (login stays 403 needsVerification
  // until then). The moment it succeeds, the gate is passed → boot into the client interface.
  const pollVerification = useCallback(() => {
    const tryOnce = async () => {
      try {
        await login({ email: obEmail, password: obPassword });
        proceedIntoClient();
      } catch (e) {
        if (e.needsVerification) {
          verifyPollRef.current = setTimeout(tryOnce, 3500); // still unverified — keep waiting
        } else {
          setObErr(e.message || 'Er ging iets mis bij het bevestigen.');
          setVerifyPending(false); setObBusy(false);
        }
      }
    };
    tryOnce();
  }, [obEmail, obPassword, proceedIntoClient]);

  // Create the account. With email verification on, register does NOT return a session — it sends a
  // confirmation link and we wait (polling /login) until the user clicks it, THEN boot into client.
  const handleCreateAccount = useCallback(async () => {
    if (!obUsername || !obEmail || !obPassword) { setObErr('Vul gebruikersnaam, e-mail en wachtwoord in.'); return; }
    if (!obConsent) { setObErr('Bevestig de voorwaarden om verder te gaan.'); return; }
    setObErr(''); setObBusy(true);
    try {
      const data = await register({ email: obEmail, password: obPassword, displayName: obUsername, age: obAge, country: obCountry, orbCode: orbCodeStr, archetypeName: obArchetype, reading: obReading });
      if (data && data.needsVerification) {
        setVerifyPending(true);   // show "check your inbox" and start polling; keep obBusy
        pollVerification();
        return;
      }
      proceedIntoClient();        // dev / no-SMTP: already logged in
    } catch (e) {
      setObErr(e.message || 'Account aanmaken mislukt.');
      setObBusy(false);
    }
  }, [obUsername, obEmail, obPassword, obAge, obCountry, obArchetype, obConsent, orbCodeStr, pollVerification, proceedIntoClient]);

  // Responsive size for the template orb on the logged-out screen.
  const [vp, setVp] = useState(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 1280,
    h: typeof window !== 'undefined' ? window.innerHeight : 800,
  }));
  useEffect(() => {
    const on = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  const templateOrbSize = Math.round(Math.max(200, Math.min(vp.h * 0.40, vp.w * 0.38, 440)));
  // Same flow easing as the assessment/holopyramid cards (cubic-bezier 0.23,1,0.32,1).
  const FLOW_TRANSITION = 'transform 0.95s cubic-bezier(0.23,1,0.32,1), opacity 0.95s cubic-bezier(0.23,1,0.32,1)';
  // The template orb grows to this "full" size behind the account card during onboarding.
  const orbSizeGrown = Math.round(Math.max(280, Math.min(vp.h * 0.64, vp.w * 0.46, 720)));
  const orbGrow = templateOrbSize > 0 ? Math.round((orbSizeGrown / templateOrbSize) * 100) / 100 : 1;

  // Session resume → the profile dashboard. In CLIENT mode the orb-code is the persistent
  // credential, so always resume from the token. Visitors keep the 24h cache.
  useEffect(() => {
    const inClient = !!getClientOrbConfig();
    let ts = 0; try { ts = parseInt(localStorage.getItem(SESSION_TS_KEY) || '0', 10); } catch (_) {}
    const fresh = getToken() && (inClient || (ts && Date.now() - ts < SESSION_MAX_AGE));
    if (!fresh) { setLoading(false); return; }
    getMe().then(async (u) => {
      // A logged-in client whose orb isn't stored locally (e.g. email/password login on a new
      // device) → boot the client interface. Prefer the account's stored orb config from getMe;
      // fall back to regenerating from the assessment. Guarded so it runs at most once.
      if (u && u.role !== 'admin' && !getClientOrbConfig()) {
        if (u.orb) {
          setClientOrbConfig(u.orb);
          setClientProfile({ displayName: u.displayName || '', archetypeName: u.archetypeName || '', country: u.country || '', age: u.age ?? '' });
          bootIntoClient(u.archetypeName);
          return;
        }
        const entered = await enterClientModeFromAccount(u, language);
        if (entered) return; // reloading into clientMode
      }
      setUser(u);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const stampSession = () => { try { localStorage.setItem(SESSION_TS_KEY, String(Date.now())); } catch (_) {} };

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError('');
    if (mode === 'register') {
      setShowConsent(true);
      return;
    }
    setLoading(true);
    try {
      const data = await login({ email, password });
      stampSession();
      // Claim a crystal-code the user uploaded this session to their account (adds to the timeline).
      if (orbCodeStr) orbLinkCode(orbCodeStr, data.archetypeName, obReading).catch(() => {});
      await linkPendingAssessment();
      if (data.user?.role === 'admin') {
        logActivity({
          type: 'admin_login',
          userId: data.user.id,
          email: data.user.email,
        }).catch(() => {});
        setUser(data.user);
        setEmail(''); setPassword('');
        return;
      }
      // Client: enter the client interface (clientMode). Preferred path — the backend returns the
      // account's render-only orb config directly; stash it + profile and hard-refresh so App boots
      // into the orb interface. Fallback (older accounts w/o a stored orb) regenerates from the
      // assessment; final fallback is the in-place client experience.
      setEmail(''); setPassword('');
      if (data.orb) {
        setClientOrbConfig(data.orb);
        setClientProfile({
          displayName: data.user?.displayName || '',
          archetypeName: data.archetypeName || '',
          country: data.country || '',
          age: data.age ?? '',
        });
        bootIntoClient(data.archetypeName);
        return;
      }
      setEntering(true); // enterClientModeFromAccount reloads internally on success
      const entered = await enterClientModeFromAccount(data.user, language);
      if (!entered) { setEntering(false); setUser(data.user); }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [mode, email, password, orbCodeStr, language, bootIntoClient]);

  const handleConsentConfirm = useCallback(async () => {
    setLoading(true);
    try {
      const data = await register({ email, password, displayName });
      stampSession();
      logActivity({ type: 'consent_given', consentType: 'registration' }).catch(() => {});
      setUser(data.user);
      // Claim a crystal-code the user uploaded this session to their new account (adds to the timeline).
      if (orbCodeStr) orbLinkCode(orbCodeStr, obArchetype, obReading).catch(() => {});
      await linkPendingAssessment();
      setEmail(''); setPassword(''); setDisplayName('');
      setShowConsent(false);
      setConsentA(false); setConsentB(false);
    } catch (err) {
      setError(err.message);
      setShowConsent(false);
    }
    finally { setLoading(false); }
  }, [email, password, displayName, orbCodeStr]);

  // Logout must clear ALL auth state, not just the token: the client-mode flag (gfl_orb_code +
  // profile), the 24h session stamp, and the admin flag. Clearing the token alone leaves the orb
  // code behind, so App.jsx keeps booting the orb/client interface and logout appears to do nothing.
  // The hard-refresh makes App re-evaluate clientMode as false and boot the visitor interface.
  const [loggingOut, setLoggingOut] = useState(false);
  const handleLogout = useCallback(() => {
    // Paint an instant overlay first — the reboot below takes a beat and without feedback the
    // button reads as broken/frozen. Two rAFs guarantees the overlay renders before reload().
    setLoggingOut(true);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      logout();
      clearClientMode();
      try {
        localStorage.removeItem(SESSION_TS_KEY);
        localStorage.removeItem('gfl_admin_mode');
      } catch (_) { /* ignore */ }
      window.location.reload();
    }));
  }, []);

  // Portaled to <body> (not inside the login section) so it escapes that stacking context and sits
  // above the fixed DELTAWERKEN header. Background matches index.html's #gfl-loading-overlay exactly
  // (rgba(0,0,0,0.98)) so the hand-off into the reload's loading screen is a seamless, invisible switch.
  const logoutOverlay = (loggingOut && typeof document !== 'undefined') ? createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 2147483647, background: 'rgba(0, 0, 0, 0.98)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.3rem' }}>
      <div className="animate-spin" style={{ width: '3rem', height: '3rem', borderRadius: '50%', border: '3px solid rgba(168,85,247,0.25)', borderTopColor: '#a855f7' }} />
      <div style={{ fontFamily: "'Figtree', sans-serif", color: '#c4b5fd', letterSpacing: '0.24em', textTransform: 'uppercase', fontSize: 'max(12px, 0.7vw)' }}>Uitloggen…</div>
    </div>,
    document.body
  ) : null;

  // Login → client boot overlay. Identical setup to logoutOverlay (portaled to <body>, same
  // rgba(0,0,0,0.98) as index.html's #gfl-loading-overlay) so the hand-off into the reload's
  // loading screen is a seamless, invisible switch instead of a visible freeze.
  const enterOverlay = (entering && typeof document !== 'undefined') ? createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 2147483647, background: 'rgba(0, 0, 0, 0.98)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      {/* SAME card as index.html's #gfl-loading-modal, so the pre-reload Levensles looks identical
          to the post-reload boot screen (seamless hand-off across the refresh). */}
      <div style={{ position: 'relative', background: 'rgba(8, 2, 12, 0.9)', padding: '2.5rem 3rem', minWidth: 'min(380px, 88vw)', maxWidth: '500px', border: '1px solid rgba(147, 51, 234, 0.3)', borderRadius: '0.5rem', boxShadow: '0 0 30px rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column', alignItems: 'center', boxSizing: 'border-box' }}>
        {/* Corner accents */}
        <div style={{ position: 'absolute', top: -1, left: -1, width: '1.25rem', height: '1.25rem', border: '1.5px solid #a855f7', borderRadius: '10px 0 0 0', borderBottom: 'none', borderRight: 'none' }} />
        <div style={{ position: 'absolute', top: -1, right: -1, width: '1.25rem', height: '1.25rem', border: '1.5px solid #a855f7', borderRadius: '0 10px 0 0', borderBottom: 'none', borderLeft: 'none' }} />
        <div style={{ position: 'absolute', bottom: -1, left: -1, width: '1.25rem', height: '1.25rem', border: '1.5px solid #a855f7', borderRadius: '0 0 0 10px', borderTop: 'none', borderRight: 'none' }} />
        <div style={{ position: 'absolute', bottom: -1, right: -1, width: '1.25rem', height: '1.25rem', border: '1.5px solid #a855f7', borderRadius: '0 0 10px 0', borderTop: 'none', borderLeft: 'none' }} />

        {/* Spinner — same as index.html (#gfl-loading-spinner) */}
        <div className="animate-spin" style={{ width: '3rem', height: '3rem', borderRadius: '50%', border: '2px solid #a855f7', borderTopColor: 'transparent', margin: '0 auto 1.5rem' }} />

        {bootLesson ? (
          <div style={{ width: '100%', maxWidth: '440px', textAlign: 'center' }}>
            {/* .gfl-lesson-label */}
            <div style={{ margin: '0 0 0.9rem', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.28em', fontFamily: "'Rajdhani', sans-serif", fontSize: '0.72rem', color: '#c4b5fd' }}>Levensles</div>
            {/* .gfl-lesson-slide */}
            <div style={{ margin: 0, textAlign: 'center', letterSpacing: '0.02em', color: 'rgba(255, 254, 240, 0.9)', fontFamily: "'Rajdhani', sans-serif", fontSize: '1rem', lineHeight: 1.6, animation: 'gfl-fade-in 0.6s ease-out both' }}>{bootLesson}</div>
          </div>
        ) : (
          <div style={{ margin: 0, textAlign: 'center', fontFamily: "'Rajdhani', sans-serif", color: 'rgba(255, 254, 240, 0.9)', letterSpacing: '0.05em', fontSize: '1rem' }}>{t('pages.loginPage.loading') || 'Inloggen…'}</div>
        )}

        {/* Noise overlay */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: '0.5rem', backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')", opacity: 0.05, mixBlendMode: 'overlay' }} />
      </div>
    </div>,
    document.body
  ) : null;

  // ── Authenticated ──
  if (user) {
    const isAdmin = user.role === 'admin';
    // A client counts as "in client" if we have EITHER the raw code (PDF login) or a stored orb
    // config (email/password login). Checking only the code sent email-login clients to the legacy
    // ClientOrbExperience (empty orb) instead of the real ProfileDashboard.
    const inClient = !!getClientOrbConfig();
    return (
      <div style={{
        ...PAGE_WRAPPER(isVisible),
      }}>
        {isAdmin
          ? <AdminDashboardModal user={user} onLogout={handleLogout} onClose={onBack} />
          : inClient
            ? <ProfileDashboard user={user} active={isVisible} onLogout={handleLogout} onClose={onBack} />
            : <ClientOrbExperience user={user} active={isVisible} onLogout={handleLogout} onClose={onBack} />}
        {logoutOverlay}
      </div>
    );
  }

  // ── Consent step ──
  if (showConsent) {
    return (
      <div style={PAGE_WRAPPER(isVisible)}>
        <LoginFrame
          title=""
          topRight={
            <SciFiButton onClick={() => { setShowConsent(false); setError(''); }} size="xs" padding="0.2rem 0.6rem" fontSize="max(8px, 0.42vw)">
              TERUG
            </SciFiButton>
          }
        >
          {/* Growing content */}
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: '1.2rem' }}>
              <div style={{ fontSize: 'max(16px, 0.9vw)', fontWeight: 'bold', letterSpacing: '0.15em', color: C.gold }}>
                BEVESTIG AANMELDING
              </div>
            </div>

            <p style={{ fontSize: 'max(10px, 0.52vw)', color: C.textDim, marginBottom: '1.2rem', lineHeight: 1.6 }}>
              Blah blah, dit lees je toch niet, maar misschien zou je dat eens een keer moeten doen. Data is het nieuwe goud.
            </p>

            <label style={{ display: 'flex', gap: '0.7rem', alignItems: 'flex-start', marginBottom: '0.9rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={consentA} onChange={(e) => setConsentA(e.target.checked)}
                style={{ marginTop: '0.2rem', accentColor: C.gold, flexShrink: 0 }} />
              <span style={{ fontSize: 'max(10px, 0.5vw)', color: C.textDim, lineHeight: 1.55 }}>
                Ik ga akkoord met de{' '}
                <a href="/?page=algemene-voorwaarden" target="_blank" rel="noopener noreferrer" style={{ color: C.gold, textDecoration: 'underline' }}>Algemene Voorwaarden</a>
                {' '}en het{' '}
                <a href="/?page=privacybeleid" target="_blank" rel="noopener noreferrer" style={{ color: C.gold, textDecoration: 'underline' }}>Privacybeleid</a>
                , inclusief de verwerking van mijn accountgegevens.
              </span>
            </label>

            <label style={{ display: 'flex', gap: '0.7rem', alignItems: 'flex-start', marginBottom: '1.2rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={consentB} onChange={(e) => setConsentB(e.target.checked)}
                style={{ marginTop: '0.2rem', accentColor: C.gold, flexShrink: 0 }} />
              <span style={{ fontSize: 'max(10px, 0.5vw)', color: C.textDim, lineHeight: 1.55 }}>
                Ik begrijp dat dit een beta-platform is. Alle data wordt verwijderd vóór 27-09-2026.
                Assessment-antwoorden worden anoniem verwerkt door Claude AI — zonder naam, e-mail of IP.
              </span>
            </label>

            {error && (
              <div style={{ ...ERROR_STYLE, marginBottom: '0.8rem' }}>
                <span style={{ fontSize: '0.8rem' }}>⚠</span> {error}
              </div>
            )}
          </div>

          {/* Clamped bottom */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '1rem' }}>
            <SciFiButton
              onClick={handleConsentConfirm}
              disabled={!consentA || !consentB || loading}
              size="md"
            >
              {loading ? t('pages.loginPage.loading') : 'BEVESTIG & AANMELDEN'}
            </SciFiButton>
          </div>

          <div style={{ ...SEPARATOR }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.6rem' }}>
            <span style={{ fontSize: '0.65rem', opacity: 0.3 }}>🛡</span>
            <span style={{ fontSize: 'max(8px, 0.4vw)', opacity: 0.25, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              Versleutelde Verbinding
            </span>
          </div>
        </LoginFrame>
      </div>
    );
  }

  // ── Login / Register ── template orb + simple login card below ──
  return (
    <>
      {enterOverlay}
      {/* Back to Deltawerken — top-center of the screen (login sits directly below the main page) */}
      <div style={{ position: 'absolute', top: '6rem', left: '50%', transform: 'translateX(-50%)', zIndex: 200, pointerEvents: isVisible ? 'auto' : 'none' }}>
        <SciFiButton onClick={onBack} variant="purple" size="sm">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '0.875rem', height: '0.875rem' }}>
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            DELTAWERKEN
          </span>
        </SciFiButton>
      </div>
    <div style={{ ...PAGE_WRAPPER(isVisible), flexDirection: 'column', gap: 'clamp(8px, 2vh, 26px)', overflow: 'visible' }}>
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(8px, 2vh, 26px)', overflow: 'visible' }}>
        {/* Crystal lab — symmetric panels flanking the centered orb/card column,
            each spanning orb-top → card-bottom. Levers left, palettes right. */}
        {vp.w >= 768 ? (
          <>
            <div style={{ position: 'absolute', right: 'calc(100% + clamp(14px, 2vw, 44px) + 3rem)', top: 0, bottom: 0, display: 'flex', transition: FLOW_TRANSITION, transformOrigin: 'right center', transform: absorbing ? 'translateX(150%) scale(0.06)' : 'none', opacity: absorbing ? 0 : 1 }}>
              <LeverDashboard cfg={playCfg} onChange={setPlayCfg} fullHeight />
            </div>
            <div style={{ position: 'absolute', left: 'calc(100% + clamp(14px, 2vw, 44px) + 3rem)', top: 0, bottom: 0, display: 'flex', transition: FLOW_TRANSITION, transformOrigin: 'left center', transform: absorbing ? 'translateX(-150%) scale(0.06)' : 'none', opacity: absorbing ? 0 : 1 }}>
              <PaletteDashboard cfg={playCfg} onChange={setPlayCfg} fullHeight />
            </div>
          </>
        ) : (
          <>
            <div style={{ transition: FLOW_TRANSITION, transformOrigin: 'center', transform: absorbing ? 'scale(0.08)' : 'none', opacity: absorbing ? 0 : 1 }}>
              <LeverDashboard cfg={playCfg} onChange={setPlayCfg} mobile />
            </div>
            <div style={{ transition: FLOW_TRANSITION, transformOrigin: 'center', transform: absorbing ? 'scale(0.08)' : 'none', opacity: absorbing ? 0 : 1 }}>
              <PaletteDashboard cfg={playCfg} onChange={setPlayCfg} mobile />
            </div>
          </>
        )}
        <div style={{ transition: FLOW_TRANSITION, transformOrigin: 'center', transform: onboarding ? `scale(${orbGrow})` : 'scale(1)', pointerEvents: onboarding ? 'none' : 'auto' }}>
          <OrbSphere3D config={playCfg} active={isVisible} size={templateOrbSize} style={{ opacity: 0.95, filter: 'drop-shadow(0 0 64px rgba(120,80,200,0.16))' }} />
        </div>

        {/* First-time onboarding — one continuous orb: panels/card absorb → the SAME orb grows to
            full size → the account card flows OUT of the enlarged orb (no remount, no size pop). */}
        {onboarding && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div style={{ width: 'min(440px, 72vw)', maxHeight: '68vh', overflowY: 'auto', background: 'rgba(2,0,3,0.66)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: `1px solid ${C.purple}`, borderRadius: '0.7rem', boxShadow: `0 0 46px -12px ${C.purple}, 0 12px 50px rgba(0,0,0,0.6)`, fontFamily: FONT, color: C.text, padding: '1.4rem 1.5rem', transformOrigin: 'center center', transform: emerged ? 'scale(1.3)' : 'scale(0.25)', opacity: emerged ? 1 : 0, transition: FLOW_TRANSITION }}>
              <div style={{ fontSize: 'max(15px,0.85vw)', fontWeight: 700, letterSpacing: '0.1em', color: C.gold }}>{verifyPending ? 'Bevestig je e-mail' : 'Maak je account'}</div>
              {obErr && <div style={{ ...ERROR_STYLE, margin: '0.6rem 0' }}><span style={{ fontSize: '0.8rem' }}>⚠</span> {obErr}</div>}
              {verifyPending ? (
                <div style={{ textAlign: 'center', padding: '0.4rem 0 0.2rem' }}>
                  <div className="animate-spin" style={{ width: '2.4rem', height: '2.4rem', margin: '0.8rem auto 1rem', borderRadius: '50%', border: '2px solid #a855f7', borderTopColor: 'transparent' }} />
                  <div style={{ fontSize: 'max(9px,0.5vw)', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                    We hebben een bevestigingslink gestuurd naar<br /><b style={{ color: '#FFFEF0' }}>{obEmail}</b>.<br />
                    Klik erop om je account te activeren — dit venster gaat daarna automatisch verder.
                  </div>
                  <button type="button" onClick={handleOnboardingBack} style={{ marginTop: '1.2rem', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 'max(9px,0.45vw)', fontFamily: FONT, textDecoration: 'underline', textUnderlineOffset: '3px', padding: 0 }}>← Annuleren</button>
                </div>
              ) : (
              <>
              <div style={{ fontSize: 'max(9px,0.5vw)', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5, margin: '0.35rem 0 1rem' }}>
                Je kristal is uniek. Koppel het aan een account om het platform te betreden — je code wordt je sleutel.
              </div>
              {/* Real <form> — password managers skip fields that live outside one. Enter
                  submits; the SciFiButton below stays type=button and calls the handler itself. */}
              <form id="onboardForm" onSubmit={(e) => { e.preventDefault(); handleCreateAccount(); }} style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                <div>
                  <div style={FIELD_LABEL}><span>👤</span> Gebruikersnaam</div>
                  {/* nickname, NOT username: login is by email — managers must not save this as the identifier */}
                  <input type="text" name="nickname" id="onboard-nickname" autoComplete="nickname" value={obUsername} onChange={(e) => setObUsername(e.target.value)} style={INPUT} onFocus={inputFocus} onBlur={inputBlur} />
                </div>
                <div>
                  <div style={FIELD_LABEL}><span>✉</span> E-mail</div>
                  <input type="email" name="email" id="onboard-email" autoComplete="username" value={obEmail} onChange={(e) => setObEmail(e.target.value)} style={INPUT} onFocus={inputFocus} onBlur={inputBlur} />
                </div>
                <div>
                  <div style={FIELD_LABEL}><span>🔑</span> Wachtwoord</div>
                  <div style={{ position: 'relative' }}>
                    <input type={obShowPassword ? 'text' : 'password'} name="new-password" id="onboard-password" autoComplete="new-password" value={obPassword} onChange={(e) => setObPassword(e.target.value)} style={{ ...INPUT, paddingRight: '2.4rem' }} onFocus={inputFocus} onBlur={inputBlur} />
                    <button
                      type="button"
                      onClick={() => setObShowPassword((v) => !v)}
                      aria-label={obShowPassword ? 'Verberg wachtwoord' : 'Toon wachtwoord'}
                      title={obShowPassword ? 'Verberg wachtwoord' : 'Toon wachtwoord'}
                      style={{ position: 'absolute', top: '50%', right: '0.6rem', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 0, color: 'rgba(255,255,255,0.5)', display: 'inline-flex' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = C.gold)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
                    >
                      {obShowPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '1rem', height: '1rem' }}>
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '1rem', height: '1rem' }}>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.55rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={FIELD_LABEL}>Leeftijd</div>
                    <input type="number" name="age" min="0" autoComplete="off" value={obAge} onChange={(e) => setObAge(e.target.value)} style={INPUT} onFocus={inputFocus} onBlur={inputBlur} />
                  </div>
                  <div style={{ flex: 2 }}>
                    <div style={FIELD_LABEL}>Land</div>
                    <input type="text" name="country" autoComplete="country-name" value={obCountry} onChange={(e) => setObCountry(e.target.value)} style={INPUT} onFocus={inputFocus} onBlur={inputBlur} />
                  </div>
                </div>
                <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', marginTop: '0.3rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={obConsent} onChange={(e) => setObConsent(e.target.checked)} style={{ marginTop: '0.2rem', accentColor: C.gold, flexShrink: 0 }} />
                  <span style={{ fontSize: 'max(9px,0.46vw)', color: 'rgba(255,255,255,0.5)', lineHeight: 1.45 }}>
                    Ik ga akkoord met de{' '}
                    <a href="/?page=algemene-voorwaarden" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ color: C.gold, textDecoration: 'underline' }}>Algemene Voorwaarden</a>
                    {' '}en het{' '}
                    <a href="/?page=privacybeleid" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ color: C.gold, textDecoration: 'underline' }}>Privacybeleid</a>.
                  </span>
                </label>
              </form>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.1rem' }}>
                <button type="button" onClick={handleOnboardingBack} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 'max(9px,0.45vw)', fontFamily: FONT, textDecoration: 'underline', textUnderlineOffset: '3px', padding: 0 }}>← Terug</button>
                <SciFiButton onClick={handleCreateAccount} disabled={obBusy} size="md">{obBusy ? 'Aanmaken…' : 'Betreed platform'}</SciFiButton>
              </div>
              </>
              )}
            </div>
          </div>
        )}
        <LoginFrame
        title={mode === 'login' ? 'Inloggen' : ''}
        style={{ marginTop: '3rem', transition: FLOW_TRANSITION, transformOrigin: 'center top', transform: absorbing ? 'translateY(-72%) scale(0.06)' : 'none', opacity: absorbing ? 0 : 1 }}
      >

        {/* Growing content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: usePassword ? 'flex-start' : 'center', ...(!usePassword && { alignItems: 'center', textAlign: 'center' }) }}>
          {!usePassword && (
            <div style={{ fontFamily: FONT, fontSize: 'max(9px, 0.5vw)', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5, marginBottom: '0.8rem' }}>
              Synchroniseer hier jouw essentie en ontgrendel<br />
              3 maanden gebruik van het platform zijn intelligentie.
            </div>
          )}

          {!usePassword ? (
            <>
              {uploadErr && (
                <div style={{ ...ERROR_STYLE, marginBottom: '0.6rem' }}>
                  <span style={{ fontSize: '0.8rem' }}>⚠</span> {uploadErr}
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="application/pdf,.pdf" style={{ display: 'none' }}
                onChange={(e) => { handleOrbUpload(e.target.files?.[0]); e.target.value = ''; }} />
              <SciFiButton onClick={() => fileInputRef.current?.click()} disabled={uploadBusy} size="md" style={{ alignSelf: 'center' }}>
                {uploadBusy ? 'Kristal ontcijferen…' : '⬆  Upload je rapport (PDF)'}
              </SciFiButton>
            </>
          ) : (
            <>
              {error && (
                <div style={{ ...ERROR_STYLE, marginBottom: '0.8rem' }}>
                  <span style={{ fontSize: '0.8rem' }}>⚠</span> {error}
                </div>
              )}
              <form id="loginForm" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                <div>
                  <div style={FIELD_LABEL}><span>✉</span> {t('pages.loginPage.email') || 'E-mail'}</div>
                  {/* name/id + autocomplete="username": password managers key on these to
                      recognize the login form (and to offer saving in the first place). */}
                  <input type="email" name="email" id="login-email" {...(process.env.NODE_ENV === 'production' && { required: true })} autoComplete="username"
                    placeholder={t('pages.loginPage.email')}
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    style={INPUT} onFocus={inputFocus} onBlur={inputBlur} />
                </div>
                <div>
                  <div style={FIELD_LABEL}><span>🔑</span> {t('pages.loginPage.password') || 'Wachtwoord'}</div>
                  <input type="password" name="password" id="login-password" {...(process.env.NODE_ENV === 'production' && { required: true, minLength: 6 })}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    placeholder={t('pages.loginPage.password')}
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    style={INPUT} onFocus={inputFocus} onBlur={inputBlur} />
                </div>
                {mode === 'register' && (
                  <div>
                    <div style={FIELD_LABEL}><span>👤</span> {t('pages.loginPage.displayName') || 'Naam'}</div>
                    <input type="text" name="name" id="login-name" autoComplete="name"
                      placeholder={t('pages.loginPage.displayName')}
                      value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                      style={INPUT} onFocus={inputFocus} onBlur={inputBlur} />
                  </div>
                )}
              </form>
            </>
          )}
        </div>

        {/* Clamped bottom */}
        <div style={{ display: 'flex', justifyContent: !usePassword ? 'center' : 'space-between', alignItems: 'flex-end', marginBottom: '0.4rem', gap: '0.5rem' }}>
          {!usePassword ? (
            <button type="button" onClick={() => { setUsePassword(true); setUploadErr(''); }}
              style={{ background: 'none', border: 'none', color: 'rgba(255,174,0,0.6)', cursor: 'pointer', fontSize: 'max(9px, 0.45vw)', fontFamily: FONT, textDecoration: 'underline', textUnderlineOffset: '3px', padding: 0 }}
              onMouseEnter={(e) => e.target.style.color = 'rgba(255,174,0,0.9)'}
              onMouseLeave={(e) => e.target.style.color = 'rgba(255,174,0,0.6)'}>
              Al een account? login
            </button>
          ) : (
            <>
              <button type="button" onClick={() => { setUsePassword(false); setError(''); }}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 'max(9px, 0.45vw)', fontFamily: FONT, textDecoration: 'underline', textUnderlineOffset: '3px', padding: 0 }}
                onMouseEnter={(e) => e.target.style.color = 'rgba(255,255,255,0.7)'}
                onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.4)'}>
                ← Terug
              </button>
              <SciFiButton onClick={() => { const f = document.getElementById('loginForm'); if (f) f.requestSubmit(); }} disabled={loading} size="md">
                {loading ? t('pages.loginPage.loading') : 'IDENTIFICEER'}
              </SciFiButton>
            </>
          )}
        </div>

      </LoginFrame>
      </div>
    </div>
    </>
  );
});

LoginPage.displayName = 'LoginPage';

export default LoginPage;
