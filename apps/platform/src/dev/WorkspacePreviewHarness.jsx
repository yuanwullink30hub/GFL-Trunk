import React, { useState } from 'react';
import { useLanguage } from '@gfl/i18n';
import { C, FONT, SciFiButton } from '@gfl/ui';
import { Lock } from 'lucide-react';
import OnboardingWorkspaceStep from '../workspace/OnboardingWorkspaceStep';

/**
 * Dev-only preview: ?workspacepreview=1 (mounted from main.jsx under import.meta.env.DEV).
 *
 * Shows the first-run workspace step inside the same card shell as LoginPage's onboarding card,
 * plus the login reminder, without creating an account or uploading a PDF. "Simulate the app"
 * installs an in-memory window.gfl so the desktop branch (folder picker → saved report) can be
 * looked at in a normal browser. Nothing is written anywhere.
 */

const FAKE_ACCOUNT = { id: '69a56d1781fb07ec3eb683be', displayName: 'Preview', archetypeName: 'De Troonrover', orbHistory: [] };

function installFakeBridge() {
  let root = null;
  let accountId = null;
  const today = new Date().toISOString().slice(0, 10);
  window.gfl = {
    workspace: {
      status: async () => (root ? { connected: true, root, schemaVersion: 1, folderId: 'preview', accountId } : { connected: false }),
      choose: async () => { await new Promise((r) => setTimeout(r, 600)); root = 'C:\\Users\\you\\Documents\\Garden For Life'; return { connected: true, root }; },
      forget: async () => { root = null; accountId = null; return { connected: false }; },
      create: async (id) => { await new Promise((r) => setTimeout(r, 400)); root = 'C:\\Users\\you\\Garden For Life'; accountId = id; return { connected: true, root }; },
      move: async () => { await new Promise((r) => setTimeout(r, 600)); root = 'D:\\Garden For Life'; return { moved: true, root }; },
      linkAccount: async (id) => { accountId = id; return { linked: true, accountId: id, changed: true }; },
    },
    reports: { save: async () => ({ saved: `profile/reports/${today}-troonrover.pdf`, name: `${today}-troonrover.pdf` }) },
    profile: { write: async () => ({ saved: 'profile/partial.json' }) },
  };
}

export default function WorkspacePreviewHarness() {
  const { t, language, setLanguage } = useLanguage();
  const [inApp, setInApp] = useState(false);
  const [key, setKey] = useState(0);
  const [continued, setContinued] = useState(0);

  const toggleApp = () => {
    if (inApp) delete window.gfl; else installFakeBridge();
    setInApp(!inApp);
    setKey((k) => k + 1);
  };
  const fakePdf = new Blob(['%PDF-1.7\n%preview\n%%EOF\n'], { type: 'application/pdf' });

  return (
    <div style={{ minHeight: '100vh', background: '#0a0510', color: C.text, fontFamily: FONT, padding: '2rem', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.5rem' }}>
        <SciFiButton size="sm" variant="purple" onClick={toggleApp}>{inApp ? 'Simulating the app — switch to browser' : 'Browser — simulate the app'}</SciFiButton>
        <SciFiButton size="sm" variant="purple" onClick={() => setLanguage && setLanguage(language === 'en' ? 'nl' : 'en')}>{language === 'en' ? 'EN → NL' : 'NL → EN'}</SciFiButton>
        <SciFiButton size="sm" variant="white" onClick={() => setKey((k) => k + 1)}>Reset step</SciFiButton>
        {continued > 0 && <span style={{ fontSize: 'max(10px,0.5vw)', color: '#4ade80' }}>“Continue / Later” clicked ×{continued} (would boot into the platform)</span>}
      </div>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Same shell as LoginPage's onboarding card (scale 1.3 in the real flow). */}
        <div style={{ width: 'min(620px, 72vw, 68vh)', height: 'min(620px, 72vw, 68vh)', overflowY: 'auto', background: 'rgba(2,0,3,0.66)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: `1px solid ${C.purple}`, borderRadius: '0.5rem', boxShadow: `0 0 46px -12px ${C.purple}, 0 12px 50px rgba(0,0,0,0.6)`, padding: '1.4rem 1.5rem' }}>
          <div style={{ fontSize: 'max(15px,0.85vw)', fontWeight: 700, letterSpacing: '0.1em', color: C.gold }}>{t('auth.onboarding.workspaceTitle')}</div>
          <OnboardingWorkspaceStep key={key} accountId={FAKE_ACCOUNT.id} account={FAKE_ACCOUNT} reportFile={fakePdf} reportLabel="De Troonrover" onContinue={() => setContinued((n) => n + 1)} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: 'min(34rem, 80vw)' }}>
          {/* Login reminder, as DesktopLayout renders it */}
          <div style={{ position: 'relative', background: 'rgba(2, 0, 3, 0.3)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(168, 85, 247, 0.45)', borderRadius: '0.5rem', boxShadow: '0 0 30px -10px rgba(168, 85, 247, 0.55), 0 10px 40px rgba(0, 0, 0, 0.55)', padding: '0.9rem 1.1rem', display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
            <Lock style={{ width: 'max(16px, 1vw)', height: 'max(16px, 1vw)', color: '#f59e0b', flexShrink: 0 }} strokeWidth={1.5} />
            <span style={{ flex: 1, fontFamily: "'Figtree', sans-serif", fontSize: 'max(11px, 0.58vw)', lineHeight: 1.5, color: '#FFFEF0' }}>{t('desktopLayout.workspaceReminder')}</span>
            <SciFiButton variant="purple" size="sm">{t('desktopLayout.workspaceReminderAction')}</SciFiButton>
            <span style={{ color: 'rgba(255, 254, 240, 0.45)', fontSize: 'max(14px, 0.8vw)' }}>×</span>
          </div>

          {/* Kook-eiland container lock, as DesktopLayout renders it */}
          <div style={{ position: 'relative', height: '19.22vh', minHeight: '9rem', border: '1px solid rgba(168, 85, 247, 0.35)', borderRadius: '0.5rem', background: 'rgba(1, 0, 2, 0.3)' }}>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', borderRadius: '0.5rem', background: 'rgba(1, 0, 2, 0.15)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5vw' }}>
                <Lock style={{ width: '2.25vw', height: '2.25vw', minWidth: 22, minHeight: 22, color: '#f59e0b' }} strokeWidth={1.5} />
                <span style={{ fontFamily: "'Figtree', sans-serif", lineHeight: 1.5, color: 'rgba(245, 158, 11, 0.8)', fontSize: 'max(9px, 0.5vw)', letterSpacing: '0.05em' }}>{t('desktopLayout.workspaceLocked')}</span>
                <SciFiButton variant="purple" size="xs">{t('desktopLayout.workspaceWhy')}</SciFiButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
