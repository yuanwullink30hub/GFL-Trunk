import React, { useCallback, useEffect, useState } from 'react';
import { useLanguage } from '@gfl/i18n';
import { C, FONT, SciFiButton } from '@gfl/ui';
import { HardDrive } from 'lucide-react';
import DownloadGate from '../../workspace/DownloadGate';
import useAppUpdate from '../../workspace/useAppUpdate';
import {
  createWorkspace, desktopDownload, detectPlatform, ensureWorkspace, isDesktopApp, linkWorkspace, moveWorkspace, onWorkspaceChange, announceWorkspaceChange,
} from '../../workspace/localWorkspace';

/**
 * Werkruimte — the account page that explains the local workstation and hands out the app.
 *
 * This page is read in two completely different places, so it detects which one it is in:
 *   - in a browser, there is no window.gfl, so it explains the idea and offers the download
 *   - inside the desktop app, window.gfl exists, so it offers the folder grant and status
 *
 * A folder belongs to one account (manifest.accountId). The app creates it on first start in the home
 * folder and binds it to the logged-in account automatically (ensureWorkspace); a second account on the
 * same computer gets its own "Garden For Life 2". Here the user can open, move or back it up, and —
 * when the folder is missing — make a new one or reconnect an existing one.
 *
 * The prose here has to agree with Terms art. 5a/5b and privacy art. 6 — this is the screen
 * where someone decides whether to trust the arrangement, and a promise made here that the
 * policy does not make (or vice versa) is the kind of gap that matters.
 */

/** Body copy is Figtree per the design tokens; Lexend Mega is chrome only. */
const BODY = "'Figtree', sans-serif";

// ── Small presentational pieces, matching the dashboard surface ────────────────

const Para = ({ children, dim }) => (
  <p style={{
    fontFamily: BODY,
    fontSize: 'max(12px, 0.62vw)',
    lineHeight: 1.65,
    whiteSpace: 'pre-line',
    color: dim ? 'rgba(255, 254, 240, 0.55)' : C.text,
    margin: '0 0 0.75rem',
  }}>{children}</p>
);

const Point = ({ children }) => (
  <li style={{
    fontFamily: BODY,
    fontSize: 'max(12px, 0.62vw)',
    lineHeight: 1.6,
    color: C.text,
    marginBottom: '0.7rem',
  }}>{children}</li>
);

const Row = ({ label, value }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', gap: '1rem',
    padding: '0.5rem 0', borderBottom: '1px solid rgba(249, 115, 22, 0.12)',
  }}>
    <span style={{
      fontFamily: FONT, fontSize: 'max(9px, 0.45vw)', textTransform: 'uppercase',
      letterSpacing: '0.12em', color: 'rgba(249, 115, 22, 0.55)', whiteSpace: 'nowrap',
    }}>{label}</span>
    <span style={{
      fontFamily: BODY, fontSize: 'max(11px, 0.55vw)', color: C.text,
      wordBreak: 'break-all', textAlign: 'right',
    }}>{value}</span>
  </div>
);

const Notice = ({ tone = 'amber', children }) => {
  const rgb = tone === 'amber' ? '255, 174, 0' : '249, 115, 22';
  return (
    <div style={{
      background: `rgba(${rgb}, 0.04)`,
      border: `1px solid rgba(${rgb}, 0.25)`,
      borderRadius: '0.5rem',
      padding: '0.85rem 1rem',
      margin: '0.75rem 0 0',
    }}>
      <p style={{
        fontFamily: BODY, fontSize: 'max(11px, 0.56vw)', lineHeight: 1.6, whiteSpace: 'pre-line',
        color: 'rgba(255, 254, 240, 0.8)', margin: 0,
      }}>{children}</p>
    </div>
  );
};

/** The keep-a-copy warning as a panel anchored to the bottom-left of the left column (laptop tier and up). */
const WarningPanel = ({ children }) => (
  <div style={{
    marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '1.1rem',
    padding: '1.2rem 1.4rem', borderRadius: '0.5rem',
    background: 'linear-gradient(135deg, rgba(255, 174, 0, 0.07) 0%, rgba(2, 0, 3, 0.2) 55%, rgba(249, 115, 22, 0.05) 100%)',
    border: '1px solid rgba(255, 174, 0, 0.25)',
    boxShadow: 'inset 0 0 12px rgba(255, 174, 0, 0.06), inset 0 0 30px rgba(255, 174, 0, 0.03)',
  }}>
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      width: 'max(38px, 2.2vw)', height: 'max(38px, 2.2vw)', borderRadius: '0.15rem',
      background: 'rgba(255, 174, 0, 0.08)', border: '1px solid rgba(255, 174, 0, 0.35)',
    }}>
      <HardDrive style={{ width: 'max(18px, 1.05vw)', height: 'max(18px, 1.05vw)', color: '#15b315', filter: 'drop-shadow(0 0 4px rgba(21, 179, 21, 0.5))' }} strokeWidth={1.5} />
    </span>
    <p style={{ fontFamily: BODY, fontSize: 'max(12px, 0.62vw)', lineHeight: 1.7, color: 'rgba(255, 254, 240, 0.85)', margin: 0, whiteSpace: 'pre-line' }}>{children}</p>
  </div>
);

// ═══════════════════════════════════════════════════════════
// The tab
// ═══════════════════════════════════════════════════════════

export default function WorkspaceTab({ DashboardCard, accountId = null }) {
  const { t, tFunc } = useLanguage();
  const inApp = isDesktopApp();

  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!isDesktopApp()) return;
    try {
      setStatus(await ensureWorkspace(accountId));
    } catch (e) {
      setError(e.message || String(e));
    }
  }, [accountId]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => onWorkspaceChange(refresh), [refresh]);

  const run = useCallback(async (key, fn) => {
    setBusy(key); setError('');
    try {
      await fn();
      await refresh();
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setBusy('');
    }
  }, [refresh]);

  const download = desktopDownload();
  const update = useAppUpdate();
  // Reconnect an existing folder (e.g. one moved outside the app, or on an external drive): the picked
  // folder is bound to this account right away.
  const choose = () => run('choose', async () => {
    const chosen = await window.gfl.workspace.choose();
    if (chosen && chosen.connected) await ensureWorkspace(accountId);
  });
  const create = () => run('create', () => createWorkspace(accountId));
  const move = () => run('move', () => moveWorkspace());

  // Laptop tier and up (design tokens: ≥ 1079px): the explanation takes two thirds of the width,
  // the app box the remaining third, so nothing is pushed below the fold. Narrower: stacked.
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1079);
  useEffect(() => {
    const on = () => setWide(window.innerWidth >= 1079);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);

  return (
    // flex: '1 0 auto' — fill the card body's height; on wide screens in a browser the one row then
    // stretches, so the gate runs to the bottom and the warning sits bottom-left.
    <div style={{ display: 'grid', gridTemplateColumns: wide ? 'minmax(0, 3fr) minmax(0, 2fr)' : 'minmax(0, 1fr)', gap: '1.5rem 2.5rem', alignItems: 'start', flex: '1 0 auto', alignContent: wide && !inApp ? 'stretch' : 'start' }}>

      {/* ── Left column: why this exists + what the permission covers, and (wide) the keep-a-copy
          warning filling the space below it, level with the download gate on the right ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem', alignSelf: wide ? 'stretch' : 'auto', minWidth: 0 }}>
      <DashboardCard title={t('clientOrb.modal.workspace.whyTitle')}>
        <div style={{ marginBottom: '1.1rem' }}><Para>{t('clientOrb.modal.workspace.whyLead')}</Para></div>
        <ul style={{ margin: '0 0 1.1rem', paddingLeft: '1.1rem' }}>
          <Point>{t('clientOrb.modal.workspace.why1')}</Point>
          <Point>{t('clientOrb.modal.workspace.why2')}</Point>
          <Point>{t('clientOrb.modal.workspace.why3')}</Point>
        </ul>
        <ul style={{ margin: '0 0 1.1rem', paddingLeft: '1.1rem' }}>
          <Point>{t('clientOrb.modal.workspace.grant1')}</Point>
          <Point>{t('clientOrb.modal.workspace.grant2')}</Point>
          <Point>{t('clientOrb.modal.workspace.grant3')}</Point>
        </ul>
        <Para dim>{t('clientOrb.modal.workspace.whyTail')}</Para>
      </DashboardCard>
      {wide && <WarningPanel>{t('clientOrb.modal.workspace.grantWarning')}</WarningPanel>}
      </div>

      {/* ── In the app: its version and updates (same slot as the download card in a browser) ── */}
      {inApp && update && (
        <DashboardCard title={t('clientOrb.modal.workspace.appTitle')}>
          <Row label={t('clientOrb.modal.workspace.appVersion')} value={`v${update.current || ''}`} />
          <Row label={t('clientOrb.modal.workspace.appUpdate')} value={
            update.state === 'ready' ? tFunc('clientOrb.modal.workspace.updateReady')(update.version)
              : update.state === 'downloading' ? tFunc('clientOrb.modal.workspace.updateDownloading')(update.version, update.percent)
              : update.state === 'checking' ? t('clientOrb.modal.workspace.updateChecking')
              : update.state === 'current' ? t('clientOrb.modal.workspace.updateCurrent')
              : update.state === 'error' ? t(/^mac/.test(detectPlatform()) ? 'clientOrb.modal.workspace.updateErrorMac' : 'clientOrb.modal.workspace.updateError')
              : update.state === 'dev' ? t('clientOrb.modal.workspace.updateDev')
              : '—'
          } />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.9rem' }}>
            {update.state === 'ready' ? (
              <SciFiButton variant="orange" size="sm" onClick={() => update.install()}>{t('clientOrb.modal.workspace.updateRestart')}</SciFiButton>
            ) : (
              <SciFiButton size="sm" onClick={() => update.check()} disabled={update.state === 'checking' || update.state === 'downloading' || update.state === 'dev'}>
                {t('clientOrb.modal.workspace.updateCheck')}
              </SciFiButton>
            )}
          </div>
          <Para dim>{t('clientOrb.modal.workspace.updateNote')}</Para>
        </DashboardCard>
      )}

      {/* ── In the browser: get the app ── */}
      {!inApp && (
        <DownloadGate stretch={wide} notice={download.available ? <Notice tone="amber">{t('clientOrb.modal.workspace.unsigned')}</Notice> : null} />
      )}

      {/* ── In the app, no folder yet: the grant ── */}
      {inApp && status && !status.connected && (
        <div style={{ gridColumn: '1 / -1' }}>
        <DashboardCard title={t('clientOrb.modal.workspace.chooseTitle')}>
          <Para>{t('clientOrb.modal.workspace.chooseLead')}</Para>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.9rem' }}>
            <SciFiButton variant="orange" onClick={create} disabled={!!busy || !accountId}>
              {busy === 'create' ? t('clientOrb.modal.workspace.choosing') : t('clientOrb.modal.workspace.createButton')}
            </SciFiButton>
            <SciFiButton onClick={choose} disabled={!!busy || !accountId}>
              {busy === 'choose' ? t('clientOrb.modal.workspace.choosing') : t('clientOrb.modal.workspace.chooseButton')}
            </SciFiButton>
          </div>
          {status.error && <Notice tone="orange">{status.error}</Notice>}
        </DashboardCard>
        </div>
      )}

      {/* ── In the app, a folder not bound to any account yet ── */}
      {inApp && status && status.connected && status.unlinked && (
        <div style={{ gridColumn: '1 / -1' }}>
        <DashboardCard title={t('clientOrb.modal.workspace.linkTitle')}>
          <Para>{t('clientOrb.modal.workspace.linkLead')}</Para>
          <Row label={t('clientOrb.modal.workspace.rowFolder')} value={status.root} />
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            <SciFiButton variant="orange" size="sm" onClick={() => run('link', () => linkWorkspace(accountId))} disabled={busy === 'link' || !accountId}>
              {busy === 'link' ? t('clientOrb.modal.workspace.choosing') : t('clientOrb.modal.workspace.linkButton')}
            </SciFiButton>
            <SciFiButton size="sm" onClick={choose} disabled={busy === 'choose' || !accountId}>
              {t('clientOrb.modal.workspace.chooseOwn')}
            </SciFiButton>
          </div>
        </DashboardCard>
        </div>
      )}

      {/* ── In the app, a folder that belongs to another account: never used ── */}
      {inApp && status && status.connected && status.foreign && (
        <div style={{ gridColumn: '1 / -1' }}>
        <DashboardCard title={t('clientOrb.modal.workspace.foreignTitle')}>
          <Para>{t('clientOrb.modal.workspace.foreignLead')}</Para>
          <div style={{ marginTop: '0.9rem' }}>
            <SciFiButton variant="orange" size="sm" onClick={create} disabled={!!busy || !accountId}>
              {busy === 'create' ? t('clientOrb.modal.workspace.choosing') : t('clientOrb.modal.workspace.createOwn')}
            </SciFiButton>
          </div>
        </DashboardCard>
        </div>
      )}

      {/* ── In the app, this account's folder: status and controls ── */}
      {inApp && status && status.ready && (
        <div style={{ gridColumn: '1 / -1' }}>
        <DashboardCard title={t('clientOrb.modal.workspace.connectedTitle')}>
          <Row label={t('clientOrb.modal.workspace.rowFolder')} value={status.root} />
          <Row label={t('clientOrb.modal.workspace.rowAccount')} value={t('clientOrb.modal.workspace.rowAccountLinked')} />
          <Row label={t('clientOrb.modal.workspace.rowLayout')} value={`v${status.schemaVersion}`} />
          <Row label={t('clientOrb.modal.workspace.rowId')} value={status.folderId || '—'} />

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            <SciFiButton size="sm" onClick={() => run('reveal', () => window.gfl.workspace.reveal())}>
              {t('clientOrb.modal.workspace.openFolder')}
            </SciFiButton>
            <SciFiButton size="sm" onClick={move} disabled={!!busy}>
              {busy === 'move' ? t('clientOrb.modal.workspace.moving') : t('clientOrb.modal.workspace.move')}
            </SciFiButton>
            <SciFiButton size="sm" onClick={() => run('backup', () => window.gfl.workspace.backup())} disabled={busy === 'backup'}>
              {busy === 'backup' ? t('clientOrb.modal.workspace.backingUp') : t('clientOrb.modal.workspace.backup')}
            </SciFiButton>
            <SciFiButton size="sm" variant="danger" onClick={() => run('forget', async () => { await window.gfl.workspace.forget(); announceWorkspaceChange(); })}>
              {t('clientOrb.modal.workspace.disconnect')}
            </SciFiButton>
          </div>
          <Para dim>{t('clientOrb.modal.workspace.moveNote')}</Para>
          <Para dim>{t('clientOrb.modal.workspace.disconnectNote')}</Para>
        </DashboardCard>
        </div>
      )}

      {/* ── Narrow screens: the responsibility warning last, across the full width ── */}
      {!wide && (
        <div style={{ gridColumn: '1 / -1' }}>
          <Notice tone="amber">{t('clientOrb.modal.workspace.grantWarning')}</Notice>
        </div>
      )}

      {error && (
        <div style={{ gridColumn: '1 / -1' }}>
        <div style={{
          background: 'rgba(239, 68, 68, 0.06)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '0.5rem', padding: '0.85rem 1rem',
          fontFamily: BODY, fontSize: 'max(11px, 0.56vw)', color: '#fca5a5',
        }}>⚠ {error}</div>
        </div>
      )}
    </div>
  );
}
