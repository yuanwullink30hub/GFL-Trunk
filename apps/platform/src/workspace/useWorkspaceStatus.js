import { useCallback, useEffect, useState } from 'react';
import { ensureWorkspace, onWorkspaceChange } from './localWorkspace';

/**
 * Live folder status for an account (see getWorkspaceStatus). `null` until the first read —
 * callers must treat null as "unknown", not as "locked" or "ready", so nothing flashes.
 * Re-reads whenever any part of the platform announces a folder change, and on window focus
 * (the user may have moved or deleted the folder outside the app). In the app it also binds the
 * account's folder on the way (ensureWorkspace), so a logged-in account never has to link it by hand.
 */
export default function useWorkspaceStatus(accountId, enabled = true) {
  const [status, setStatus] = useState(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      setStatus(await ensureWorkspace(accountId));
    } catch {
      setStatus({ inApp: true, connected: false, ready: false, error: 'status unavailable' });
    }
  }, [accountId, enabled]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => onWorkspaceChange(refresh), [refresh]);
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return undefined;
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, [refresh, enabled]);

  return status;
}
