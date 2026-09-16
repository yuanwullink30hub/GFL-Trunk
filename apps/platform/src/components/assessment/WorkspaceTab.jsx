import React, { useCallback, useEffect, useState } from 'react';
import { useLanguage } from '@gfl/i18n';
import { C, FONT, SciFiButton } from '@gfl/ui';
import DesktopDownloadButton from '../../workspace/DesktopDownloadButton';
import {
  connectWorkspace, desktopDownload, getWorkspaceStatus, isDesktopApp, linkWorkspace, onWorkspaceChange, announceWorkspaceChange,
} from '../../workspace/localWorkspace';

/**
 * Werkruimte — the account page that explains the local workstation and hands out the app.
 *
 * This page is read in two completely different places, so it detects which one it is in:
 *   - in a browser, there is no window.gfl, so it explains the idea and offers the download
 *   - inside the desktop app, window.gfl exists, so it offers the folder grant and status
 *
 * A folder belongs to one account (manifest.accountId). Choosing a folder here binds it to the
 * logged-in account; a connected folder that is unbound can be linked; one bound to someone else
 * is shown as such and never used.
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
    marginBottom: '0.5rem',
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
        fontFamily: BODY, fontSize: 'max(11px, 0.56vw)', lineHeight: 1.6,
        color: 'rgba(255, 254, 240, 0.8)', margin: 0,
      }}>{children}</p>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// The tab
// ═══════════════════════════════════════════════════════════

export default function WorkspaceTab({ DashboardCard, accountId = null }) {
  const { t } = useLanguage();
  const inApp = isDesktopApp();

  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!isDesktopApp()) return;
    try {
      setStatus(await getWorkspaceStatus(accountId));
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
  const choose = () => run('choose', () => connectWorkspace({ accountId }));

  // Laptop tier and up (design tokens: ≥ 1079px): the explanation takes two thirds of the width,
  // the app box the remaining third, so nothing is pushed below the fold. Narrower: stacked.
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1079);
  useEffect(() => {
    const on = () => setWide(window.innerWidth >= 1079);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: wide ? 'minmax(0, 2fr) minmax(0, 1fr)' : 'minmax(0, 1fr)', gap: '1.5rem 2.5rem', alignItems: 'start' }}>

      {/* ── Why this exists + what the permission covers — one box, one heading ── */}
      <DashboardCard title={t('clientOrb.modal.workspace.whyTitle')}>
        <Para>{t('clientOrb.modal.workspace.whyLead')}</Para>
        <ul style={{ margin: '0 0 0.9rem', paddingLeft: '1.1rem' }}>
          <Point>{t('clientOrb.modal.workspace.why1')}</Point>
          <Point>{t('clientOrb.modal.workspace.why2')}</Point>
          <Point>{t('clientOrb.modal.workspace.why3')}</Point>
        </ul>
        <Para>{t('clientOrb.modal.workspace.grantLead')}</Para>
        <ul style={{ margin: '0 0 0.9rem', paddingLeft: '1.1rem' }}>
          <Point>{t('clientOrb.modal.workspace.grant1')}</Point>
          <Point>{t('clientOrb.modal.workspace.grant2')}</Point>
          <Point>{t('clientOrb.modal.workspace.grant3')}</Point>
        </ul>
        <Para dim>{t('clientOrb.modal.workspace.whyTail')}</Para>
      </DashboardCard>

      {/* ── In the browser: get the app ── */}
      {!inApp && (
        <DashboardCard title={t('clientOrb.modal.workspace.getTitle')}>
          <Para>{t('clientOrb.modal.workspace.getLead')}</Para>

          <DesktopDownloadButton />
          {download.available && <Notice tone="amber">{t('clientOrb.modal.workspace.unsigned')}</Notice>}
        </DashboardCard>
      )}

      {/* ── In the app, no folder yet: the grant ── */}
      {inApp && status && !status.connected && (
        <div style={{ gridColumn: '1 / -1' }}>
        <DashboardCard title={t('clientOrb.modal.workspace.chooseTitle')}>
          <Para>{t('clientOrb.modal.workspace.chooseLead')}</Para>
          <div style={{ marginTop: '0.9rem' }}>
            <SciFiButton variant="orange" onClick={choose} disabled={busy === 'choose' || !accountId}>
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
            <SciFiButton variant="orange" size="sm" onClick={choose} disabled={busy === 'choose' || !accountId}>
              {busy === 'choose' ? t('clientOrb.modal.workspace.choosing') : t('clientOrb.modal.workspace.chooseOwn')}
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
            <SciFiButton size="sm" onClick={() => run('backup', () => window.gfl.workspace.backup())} disabled={busy === 'backup'}>
              {busy === 'backup' ? t('clientOrb.modal.workspace.backingUp') : t('clientOrb.modal.workspace.backup')}
            </SciFiButton>
            <SciFiButton size="sm" variant="danger" onClick={() => run('forget', async () => { await window.gfl.workspace.forget(); announceWorkspaceChange(); })}>
              {t('clientOrb.modal.workspace.disconnect')}
            </SciFiButton>
          </div>
          <Para dim>{t('clientOrb.modal.workspace.disconnectNote')}</Para>
        </DashboardCard>
        </div>
      )}

      {/* ── The responsibility warning — last, across the full width ── */}
      <div style={{ gridColumn: '1 / -1' }}>
        <Notice tone="amber">{t('clientOrb.modal.workspace.grantWarning')}</Notice>
      </div>

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
