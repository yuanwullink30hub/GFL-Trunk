import { useCallback, useEffect, useState } from 'react';
import { isDesktopApp } from './localWorkspace';

/**
 * The desktop app's update state (apps/desktop/src/updater.js), or null in a browser.
 * { state: dev|idle|checking|current|downloading|ready|error, version, current, percent? }
 * plus check() and install() — install restarts the app into the downloaded version.
 */
export default function useAppUpdate() {
  const bridge = isDesktopApp() && window.gfl.update ? window.gfl.update : null;
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (!bridge) return undefined;
    let alive = true;
    bridge.status().then((s) => { if (alive) setStatus(s); }).catch(() => {});
    const off = bridge.onStatus((s) => setStatus(s));
    return () => { alive = false; off(); };
  }, [bridge]);

  const check = useCallback(() => (bridge ? bridge.check().then(setStatus).catch(() => {}) : Promise.resolve()), [bridge]);
  const install = useCallback(() => (bridge ? bridge.install() : Promise.resolve(false)), [bridge]);

  if (!bridge) return null;
  return { ...(status || { state: 'idle' }), check, install };
}
