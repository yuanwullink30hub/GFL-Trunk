/**
 * The installed management app's own updates — the counterpart of the client app's update row
 * (apps/platform WorkspaceTab + useAppUpdate). The bridge is window.gflAdmin.update
 * (apps/admin-desktop/src/preload.js); outside the installed app (the browser via `pnpm live`) there
 * is no bridge and nothing renders.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useLanguage } from '@gfl/i18n';
import { SciFiButton } from '@gfl/ui';

/** { state: dev|idle|checking|current|downloading|ready|error, version, current, percent? } + check/install, or null. */
export function useAdminAppUpdate() {
  const bridge = typeof window !== 'undefined' && window.gflAdmin && window.gflAdmin.update ? window.gflAdmin.update : null;
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (!bridge) return undefined;
    let alive = true;
    bridge.status().then((s) => { if (alive) setStatus(s); }).catch(() => {});
    const off = bridge.onStatus((s) => setStatus(s));
    return () => { alive = false; off(); };
  }, [bridge]);

  const check = useCallback(() => (bridge && bridge.check ? bridge.check().then(setStatus).catch(() => {}) : Promise.resolve()), [bridge]);
  const install = useCallback(() => (bridge ? bridge.install() : Promise.resolve(false)), [bridge]);

  if (!bridge) return null;
  return { ...(status || { state: 'idle' }), canCheck: !!bridge.check, check, install };
}

/** Version, update status and the button — for the header's telemetry strip. */
export function AppUpdateControl() {
  const { t, tFunc } = useLanguage();
  const u = useAdminAppUpdate();
  if (!u) return null;

  const label = u.state === 'ready' ? tFunc('admin.app.statusReady')(u.version)
    : u.state === 'downloading' ? tFunc('admin.app.statusDownloading')(u.version, u.percent)
      : u.state === 'checking' ? t('admin.app.statusChecking')
        : u.state === 'current' ? t('admin.app.statusCurrent')
          : u.state === 'error' ? t('admin.app.statusError')
            : u.state === 'dev' ? t('admin.app.statusDev')
              : '';
  const tone = u.state === 'ready' ? '#f97316' : u.state === 'error' ? '#fca5a5' : u.state === 'current' ? '#4ade80' : 'rgba(255, 254, 240, 0.5)';
  const busy = u.state === 'checking' || u.state === 'downloading' || u.state === 'dev';

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.7rem' }}>
      <span>Admin GFL v{u.current || ''}</span>
      {label && <span style={{ color: tone }}>{label}</span>}
      {u.state === 'ready' ? (
        <SciFiButton variant="orange" size="xs" onClick={() => u.install()}>{t('admin.app.restartUpdate')}</SciFiButton>
      ) : u.canCheck && (
        <SciFiButton variant="purple" size="xs" disabled={busy} onClick={() => u.check()}>{t('admin.app.check')}</SciFiButton>
      )}
    </span>
  );
}
