import React, { useCallback, useEffect, useState } from 'react';
import { useLanguage } from '@gfl/i18n';
import { SciFiButton } from '@gfl/ui';
import { GRAPHICS_PRESET } from '../../workspace/appProfile';

/**
 * Instellingen → App (desktop app only): settings of THIS computer — screen refresh rate, graphics
 * quality, start in full screen. Stored by the app (settings.json / Windows display settings), never on
 * our servers. Rendered by ProfileDashboard only when window.gfl exists.
 */
const PRESETS = ['high', 'balanced', 'saver'];

const TEXT = { fontFamily: "'Figtree', sans-serif", fontSize: 'max(11px,0.58vw)', color: '#FFFEF0', lineHeight: 1.5 };
const HINT = { fontFamily: "'Figtree', sans-serif", fontSize: 'max(9px,0.5vw)', color: 'rgba(255,254,240,0.5)', lineHeight: 1.5, marginTop: '0.45rem' };
const ROW = { display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' };
const BLOCK = { marginTop: '0.95rem' };

export default function AppSettingsSection({ labelStyle }) {
  const { t } = useLanguage();
  const gfl = window.gfl;
  const SUB = { ...labelStyle, color: 'rgba(255, 174, 0, 0.7)', marginBottom: '0.45rem' };

  const [display, setDisplay] = useState(null);
  const [rateBusy, setRateBusy] = useState(false);
  const [rateError, setRateError] = useState('');
  const [settings, setSettings] = useState(() => (gfl && gfl.settings && gfl.settings.initial) || {});

  const refreshDisplay = useCallback(() => {
    gfl.display.describe().then(setDisplay).catch(() => setDisplay(null));
  }, [gfl]);

  useEffect(() => {
    refreshDisplay();
    gfl.settings.get().then(setSettings).catch(() => {});
    // A change (here or on first start) settles by keep, revert or timeout: show the rate that stuck.
    const offSettled = gfl.display.onSettled(() => { setRateBusy(false); refreshDisplay(); });
    const offPending = gfl.display.onPending(() => { setRateBusy(true); refreshDisplay(); });
    gfl.display.pending().then((p) => setRateBusy(!!p)).catch(() => {});
    return () => { offSettled(); offPending(); };
  }, [gfl, refreshDisplay]);

  const chooseRate = async (hz) => {
    if (!display || hz === display.hz || rateBusy) return;
    setRateError('');
    setRateBusy(true);
    try {
      const res = await gfl.display.setRate(hz);
      if (!res || !res.ok) { setRateBusy(false); setRateError(t('profile.dashboard.settings.app.displayFailed')); }
      else if (res.unchanged) setRateBusy(false);
    } catch {
      setRateBusy(false);
      setRateError(t('profile.dashboard.settings.app.displayFailed'));
    }
  };

  const save = async (patch) => {
    setSettings((s) => ({ ...s, ...patch }));
    try { setSettings(await gfl.settings.set(patch)); } catch { /* keeps the optimistic value */ }
  };

  const graphics = PRESETS.includes(settings.graphics) ? settings.graphics : 'high';
  const startFullscreen = settings.startFullscreen !== false;

  return (
    <div style={{ marginTop: '1.15rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ ...labelStyle, marginBottom: '0.3rem' }}>{t('profile.dashboard.settings.app.title')}</div>
      <div style={{ ...HINT, marginTop: 0 }}>{t('profile.dashboard.settings.app.intro')}</div>

      {/* Refresh rate of the screen the app is on */}
      <div style={BLOCK}>
        <div style={SUB}>{t('profile.dashboard.settings.app.display')}</div>
        {display && (
          <div style={{ ...TEXT, marginBottom: '0.55rem' }}>
            {display.label && !/generic/i.test(display.label) ? `${display.label} · ` : ''}{display.width}×{display.height} · {display.hz} Hz
          </div>
        )}
        {display && display.canChange && display.rates.length > 1 ? (
          <>
            <div style={ROW}>
              {display.rates.map((hz) => (
                <SciFiButton
                  key={hz}
                  variant="purple"
                  size="sm"
                  padding="0.4rem 1.05rem"
                  fontSize="max(9px,0.5vw)"
                  active={hz === display.hz}
                  disabled={rateBusy && hz !== display.hz}
                  onClick={() => chooseRate(hz)}
                >
                  {hz} Hz
                </SciFiButton>
              ))}
            </div>
            <div style={HINT}>{t('profile.dashboard.settings.app.displayHint')}</div>
          </>
        ) : display && (
          <div style={HINT}>{t('profile.dashboard.settings.app.displaySystem')}</div>
        )}
        {rateError && <div style={{ ...HINT, color: '#f87171' }}>{rateError}</div>}
      </div>

      {/* Graphics preset (applies on the next page load) */}
      <div style={BLOCK}>
        <div style={SUB}>{t('profile.dashboard.settings.app.graphics')}</div>
        <div style={ROW}>
          {PRESETS.map((p) => (
            <SciFiButton
              key={p}
              variant="purple"
              size="sm"
              padding="0.4rem 1.05rem"
              fontSize="max(9px,0.5vw)"
              active={p === graphics}
              onClick={() => { if (p !== graphics) save({ graphics: p }); }}
            >
              {t(`profile.dashboard.settings.app.presets.${p}`)}
            </SciFiButton>
          ))}
        </div>
        <div style={HINT}>{t(`profile.dashboard.settings.app.presetInfo.${graphics}`)}</div>
        {graphics !== GRAPHICS_PRESET && (
          <div style={{ ...ROW, marginTop: '0.6rem' }}>
            <span style={{ ...TEXT, fontSize: 'max(9px,0.5vw)', color: 'rgba(255, 174, 0, 0.8)' }}>{t('profile.dashboard.settings.app.reloadNote')}</span>
            <SciFiButton color="#ffae00" rgb="255, 174, 0" size="sm" padding="0.4rem 1.05rem" fontSize="max(9px,0.5vw)" onClick={() => gfl.reload()}>
              {t('profile.dashboard.settings.app.reload')}
            </SciFiButton>
          </div>
        )}
      </div>

      {/* Window at startup */}
      <div style={BLOCK}>
        <div style={SUB}>{t('profile.dashboard.settings.app.startup')}</div>
        <div style={ROW}>
          <SciFiButton variant="purple" size="sm" padding="0.4rem 1.05rem" fontSize="max(9px,0.5vw)" active={startFullscreen} onClick={() => { if (!startFullscreen) save({ startFullscreen: true }); }}>
            {t('profile.dashboard.settings.app.fullscreen')}
          </SciFiButton>
          <SciFiButton variant="purple" size="sm" padding="0.4rem 1.05rem" fontSize="max(9px,0.5vw)" active={!startFullscreen} onClick={() => { if (startFullscreen) save({ startFullscreen: false }); }}>
            {t('profile.dashboard.settings.app.windowed')}
          </SciFiButton>
        </div>
        <div style={HINT}>{t('profile.dashboard.settings.app.startupHint')}</div>
      </div>
    </div>
  );
}
