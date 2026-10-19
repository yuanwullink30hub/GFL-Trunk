/**
 * Wake the server from the dashboard (owner, 19 Oct): a host that sleeps or restarts after a deploy answers late
 * or not at all, and the tabs then show errors. This button asks /api/health (checkServerHealth, which waits long
 * enough for a host waking from sleep) and, once the server answers, has the open tab load again — the session
 * stays as it is. Works in the installed app and in the browser alike.
 */
import React, { useCallback, useState } from 'react';
import { useLanguage } from '@gfl/i18n';
import { SciFiButton } from '@gfl/ui';
import { checkServerHealth } from '@gfl/api-client';

/** The server's state and the button that wakes it, for the header's telemetry strip. */
export function ServerWakeControl({ onAwake }) {
  const { t } = useLanguage();
  const [state, setState] = useState('idle'); // idle | waking | awake | down

  const wake = useCallback(async () => {
    setState('waking');
    const ok = await checkServerHealth();
    setState(ok ? 'awake' : 'down');
    if (ok && onAwake) onAwake();
  }, [onAwake]);

  const label = state === 'waking' ? t('admin.server.waking')
    : state === 'awake' ? t('admin.server.awake')
      : state === 'down' ? t('admin.server.down')
        : '';
  const tone = state === 'awake' ? '#4ade80' : state === 'down' ? '#fca5a5' : 'rgba(255, 254, 240, 0.5)';

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.7rem' }}>
      {label && <span style={{ color: tone }}>{label}</span>}
      <SciFiButton variant="purple" size="xs" disabled={state === 'waking'} onClick={wake} title={t('admin.server.wakeHint')}>
        {t('admin.server.wake')}
      </SciFiButton>
    </span>
  );
}
