import React, { useCallback, useEffect, useState } from 'react';
import { useLanguage } from '@gfl/i18n';
import { C, FONT, SciFiButton } from '@gfl/ui';

/**
 * Werkruimte — the account page that explains the local workstation and hands out the app.
 *
 * This page is read in two completely different places, so it detects which one it is in:
 *   - in a browser, there is no window.gfl, so it explains the idea and offers the download
 *   - inside the desktop app, window.gfl exists, so it offers the folder grant and status
 *
 * The prose here has to agree with Terms art. 5a/5b and privacy art. 6 — this is the screen
 * where someone decides whether to trust the arrangement, and a promise made here that the
 * policy does not make (or vice versa) is the kind of gap that matters.
 */

/** Body copy is Figtree per the design tokens; Lexend Mega is chrome only. */
const BODY = "'Figtree', sans-serif";

/**
 * Release artefacts. The filenames must match electron-builder.yml's artifactName, and
 * `available` stays false until the installers are actually published — a download button
 * that 404s is worse than one that says "not yet".
 */
const RELEASE = {
  available: false,
  version: '0.1.0',
  base: 'https://gardenforlife.nl/downloads',
  file: {
    win: (v) => `GardenForLife-Setup-${v}.exe`,
    macArm: (v) => `GardenForLife-${v}-arm64.dmg`,
    macIntel: (v) => `GardenForLife-${v}-x64.dmg`,
    linux: (v) => `GardenForLife-${v}.AppImage`,
  },
};

/** Best guess at which build this visitor wants. Wrong guesses cost only a second click. */
function detectPlatform() {
  if (typeof navigator === 'undefined') return 'win';
  const ua = navigator.userAgent || '';
  const platform = navigator.platform || '';
  if (/Mac/i.test(platform) || /Mac OS X/i.test(ua)) {
    // Apple Silicon reports as Intel in the UA string; the core count is the usual tell.
    return (navigator.hardwareConcurrency || 0) >= 8 ? 'macArm' : 'macIntel';
  }
  if (/Linux/i.test(platform) && !/Android/i.test(ua)) return 'linux';
  return 'win';
}

const isDesktopApp = () => typeof window !== 'undefined' && !!window.gfl;

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

export default function WorkspaceTab({ DashboardCard }) {
  const { t } = useLanguage();
  const inApp = isDesktopApp();

  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!isDesktopApp()) return;
    try {
      setStatus(await window.gfl.workspace.status());
    } catch (e) {
      setError(e.message || String(e));
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

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

  const platform = detectPlatform();
  const fileName = RELEASE.file[platform] ? RELEASE.file[platform](RELEASE.version) : null;
  const downloadHref = fileName ? `${RELEASE.base}/${fileName}` : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* ── Why this exists ── */}
      <DashboardCard title={t('clientOrb.workspace.whyTitle')}>
        <Para>{t('clientOrb.workspace.whyLead')}</Para>
        <ul style={{ margin: '0 0 0.5rem', paddingLeft: '1.1rem' }}>
          <Point>{t('clientOrb.workspace.why1')}</Point>
          <Point>{t('clientOrb.workspace.why2')}</Point>
          <Point>{t('clientOrb.workspace.why3')}</Point>
        </ul>
        <Para dim>{t('clientOrb.workspace.whyTail')}</Para>
      </DashboardCard>

      {/* ── What the permission actually grants ── */}
      <DashboardCard title={t('clientOrb.workspace.grantTitle')}>
        <Para>{t('clientOrb.workspace.grantLead')}</Para>
        <ul style={{ margin: '0 0 0.5rem', paddingLeft: '1.1rem' }}>
          <Point>{t('clientOrb.workspace.grant1')}</Point>
          <Point>{t('clientOrb.workspace.grant2')}</Point>
          <Point>{t('clientOrb.workspace.grant3')}</Point>
        </ul>
        <Notice tone="amber">{t('clientOrb.workspace.grantWarning')}</Notice>
      </DashboardCard>

      {/* ── In the browser: get the app ── */}
      {!inApp && (
        <DashboardCard title={t('clientOrb.workspace.getTitle')}>
          <Para>{t('clientOrb.workspace.getLead')}</Para>

          {RELEASE.available && downloadHref ? (
            <>
              <div style={{ marginTop: '0.9rem' }}>
                <SciFiButton
                  variant="orange"
                  onClick={() => { window.location.href = downloadHref; }}
                  title={fileName}
                >
                  {t(`clientOrb.workspace.download.${platform}`)}
                </SciFiButton>
              </div>
              <p style={{
                fontFamily: BODY, fontSize: 'max(10px, 0.5vw)',
                color: 'rgba(255, 254, 240, 0.4)', marginTop: '0.6rem',
              }}>
                {fileName} · v{RELEASE.version}
              </p>
            </>
          ) : (
            <Notice tone="orange">{t('clientOrb.workspace.notYet')}</Notice>
          )}

          <Notice tone="amber">{t('clientOrb.workspace.unsigned')}</Notice>
        </DashboardCard>
      )}

      {/* ── In the app, no folder yet: the grant ── */}
      {inApp && status && !status.connected && (
        <DashboardCard title={t('clientOrb.workspace.chooseTitle')}>
          <Para>{t('clientOrb.workspace.chooseLead')}</Para>
          <div style={{ marginTop: '0.9rem' }}>
            <SciFiButton
              variant="orange"
              onClick={() => run('choose', () => window.gfl.workspace.choose())}
              disabled={busy === 'choose'}
            >
              {busy === 'choose' ? t('clientOrb.workspace.choosing') : t('clientOrb.workspace.chooseButton')}
            </SciFiButton>
          </div>
          {status.error && <Notice tone="orange">{status.error}</Notice>}
        </DashboardCard>
      )}

      {/* ── In the app, folder connected: status and controls ── */}
      {inApp && status && status.connected && (
        <DashboardCard title={t('clientOrb.workspace.connectedTitle')}>
          <Row label={t('clientOrb.workspace.rowFolder')} value={status.root} />
          <Row label={t('clientOrb.workspace.rowLayout')} value={`v${status.schemaVersion}`} />
          <Row label={t('clientOrb.workspace.rowId')} value={status.folderId || '—'} />

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            <SciFiButton size="sm" onClick={() => run('reveal', () => window.gfl.workspace.reveal())}>
              {t('clientOrb.workspace.openFolder')}
            </SciFiButton>
            <SciFiButton size="sm" onClick={() => run('backup', () => window.gfl.workspace.backup())} disabled={busy === 'backup'}>
              {busy === 'backup' ? t('clientOrb.workspace.backingUp') : t('clientOrb.workspace.backup')}
            </SciFiButton>
            <SciFiButton size="sm" variant="danger" onClick={() => run('forget', () => window.gfl.workspace.forget())}>
              {t('clientOrb.workspace.disconnect')}
            </SciFiButton>
          </div>
          <Para dim>{t('clientOrb.workspace.disconnectNote')}</Para>
        </DashboardCard>
      )}

      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.06)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '0.5rem', padding: '0.85rem 1rem',
          fontFamily: BODY, fontSize: 'max(11px, 0.56vw)', color: '#fca5a5',
        }}>⚠ {error}</div>
      )}
    </div>
  );
}
