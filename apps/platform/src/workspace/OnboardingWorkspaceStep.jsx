import React, { useCallback, useState } from 'react';
import { useLanguage } from '@gfl/i18n';
import { FONT, SciFiButton } from '@gfl/ui';
import { connectWorkspace, desktopDownload, isDesktopApp } from './localWorkspace';
import DesktopDownloadButton from './DesktopDownloadButton';

/**
 * The first thing asked of a new account: the local workstation. Rendered inside the onboarding
 * card on LoginPage, right after the account exists (and after email verification, when that
 * is on) — before the Levensles and the boot into the platform.
 *
 *   browser → why the folder exists, what it means for them, and the desktop app download
 *   app     → the same why, then the folder picker; the report they just uploaded and a copy of
 *             their partial profile go straight into the chosen folder
 *
 * Either way they can continue: the account, public card and Verbonden work without a folder,
 * the personal-data tools stay locked until one is connected (and a reminder shows on login).
 */

/** Body copy is Figtree per the design tokens; Lexend Mega (FONT) is chrome only. */
const BODY = "'Figtree', sans-serif";

const para = { fontFamily: BODY, fontSize: 'max(11px, 0.56vw)', lineHeight: 1.6, color: '#FFFEF0', margin: '0 0 0.6rem' };
const dim = { ...para, color: 'rgba(255, 254, 240, 0.55)' };

const Notice = ({ rgb, children }) => (
  <div style={{ background: `rgba(${rgb}, 0.04)`, border: `1px solid rgba(${rgb}, 0.25)`, borderRadius: '0.5rem', padding: '0.7rem 0.85rem', margin: '0.7rem 0 0' }}>
    <p style={{ ...para, margin: 0, color: 'rgba(255, 254, 240, 0.82)' }}>{children}</p>
  </div>
);

export default function OnboardingWorkspaceStep({ accountId, account, reportFile, reportLabel, onContinue }) {
  const { t, tFunc } = useLanguage();
  const inApp = isDesktopApp();
  const download = desktopDownload();

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(null); // { reportName }

  const choose = useCallback(async () => {
    setBusy(true); setErr('');
    try {
      const r = await connectWorkspace({ accountId, reportFile, reportLabel, account });
      if (r.connected) setDone({ reportName: r.report && r.report.name ? r.report.name : '' });
    } catch (e) {
      setErr(e.message || String(e));
    } finally {
      setBusy(false);
    }
  }, [accountId, reportFile, reportLabel, account]);

  return (
    <div>
      <p style={{ ...dim, margin: '0.35rem 0 0.9rem' }}>{t('auth.onboarding.workspaceIntro')}</p>

      {/* Why — the same explanation as the Werkruimte tab (Terms 5a/5b, privacy 6). */}
      <p style={para}>{t('clientOrb.modal.workspace.whyLead')}</p>
      <ul style={{ margin: '0 0 0.4rem', paddingLeft: '1.05rem' }}>
        {['why1', 'why2', 'why3'].map((k) => (
          <li key={k} style={{ ...para, margin: '0 0 0.35rem' }}>{t(`clientOrb.modal.workspace.${k}`)}</li>
        ))}
      </ul>
      <Notice rgb="255, 174, 0">{t('clientOrb.modal.workspace.grantWarning')}</Notice>

      {inApp ? (
        <div style={{ marginTop: '1rem' }}>
          {done ? (
            <p style={{ ...para, color: '#4ade80', margin: 0 }}>✓ {tFunc('auth.onboarding.workspaceDone')(done.reportName)}</p>
          ) : (
            <>
              <p style={para}>{t('auth.onboarding.workspaceInApp')}</p>
              <SciFiButton onClick={choose} disabled={busy} variant="orange" size="sm">
                {busy ? t('auth.onboarding.workspaceChoosing') : t('auth.onboarding.workspaceChoose')}
              </SciFiButton>
            </>
          )}
        </div>
      ) : (
        <div style={{ marginTop: '1rem' }}>
          <p style={para}>{t('clientOrb.modal.workspace.getLead')}</p>
          <DesktopDownloadButton />
          {download.available && <Notice rgb="255, 174, 0">{t('clientOrb.modal.workspace.unsigned')}</Notice>}
        </div>
      )}

      {err && (
        <div style={{ margin: '0.7rem 0 0', padding: '0.6rem 0.8rem', borderRadius: '0.5rem', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.06)', fontFamily: BODY, fontSize: 'max(10px, 0.52vw)', color: '#fca5a5' }}>
          ⚠ {err}
        </div>
      )}

      {!done && <p style={{ ...dim, margin: '0.9rem 0 0' }}>{t('auth.onboarding.workspaceLocked')}</p>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.1rem' }}>
        {done ? <span /> : (
          <button type="button" onClick={onContinue} disabled={busy}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: busy ? 'default' : 'pointer', fontSize: 'max(9px,0.45vw)', fontFamily: FONT, textDecoration: 'underline', textUnderlineOffset: '3px', padding: 0 }}>
            {t('auth.onboarding.workspaceLater')}
          </button>
        )}
        <SciFiButton onClick={onContinue} disabled={busy} size="md">
          {t('auth.onboarding.workspaceContinue')}
        </SciFiButton>
      </div>
    </div>
  );
}
