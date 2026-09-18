import React from 'react';
import { useLanguage } from '@gfl/i18n';
import { FONT } from '@gfl/ui';
import { MonitorSmartphone, FolderLock, RefreshCw } from 'lucide-react';
import DesktopDownloadButton from './DesktopDownloadButton';
import { desktopDownload } from './localWorkspace';

const BODY = "'Figtree', sans-serif";
const AMBER = '#ffae00';
const AMBER_RGB = '255, 174, 0';
const PURPLE_RGB = '168, 85, 247';

/**
 * The final gate before the download — the one place on the Werkruimte tab that should feel like
 * a threshold rather than a settings row. A glass panel (amber brand accent, plain 1px amber border
 * without corner brackets, amber inset glow), a slowly turning
 * crystal emblem, the lead, three short promises, and the prominent split
 * download button. Decorative motion (ring spin, sheen, scanline, button breathe) all tolerates the
 * low-gpu freeze: frozen, the panel still reads complete.
 */

/** Liquid-crystal emblem: a purple faceted hexagon inside two slowly turning dashed rings (outer purple,
 *  inner amber), with a download mark. */
const CrystalEmblem = () => (
  <div aria-hidden="true" style={{ position: 'relative', width: 'max(96px, 5.6vw)', height: 'max(96px, 5.6vw)', margin: '0 auto' }}>
    <div style={{ position: 'absolute', inset: '-18%', borderRadius: '50%', background: `radial-gradient(circle, rgba(${AMBER_RGB}, 0.22) 0%, rgba(${PURPLE_RGB}, 0.10) 45%, transparent 70%)` }} />
    <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', animation: 'gflGateSpin 40s linear infinite' }}>
      {/* outer ring purple, inner ring amber */}
      <circle cx="50" cy="50" r="46" fill="none" stroke={`rgba(${PURPLE_RGB}, 0.6)`} strokeWidth="0.8" strokeDasharray="2 5" />
      <circle cx="50" cy="50" r="40" fill="none" stroke={`rgba(${AMBER_RGB}, 0.55)`} strokeWidth="0.6" strokeDasharray="14 6" />
    </svg>
    <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', filter: `drop-shadow(0 0 10px rgba(${PURPLE_RGB}, 0.55))` }}>
      <defs>
        <linearGradient id="gflGateCrystal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={`rgba(${PURPLE_RGB}, 0.6)`} />
          <stop offset="55%" stopColor={`rgba(${PURPLE_RGB}, 0.12)`} />
          <stop offset="100%" stopColor={`rgba(${PURPLE_RGB}, 0.45)`} />
        </linearGradient>
      </defs>
      <polygon points="50,20 76,35 76,65 50,80 24,65 24,35" fill="url(#gflGateCrystal)" stroke="#a855f7" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M50 20 L50 44 M24 35 L50 44 L76 35 M50 44 L50 80" fill="none" stroke={`rgba(${PURPLE_RGB}, 0.45)`} strokeWidth="0.8" />
      <path d="M50 49 V63 M44 57 L50 63 L56 57" fill="none" stroke="#15b315" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 3px rgba(21, 179, 21, 0.7))' }} />
    </svg>
  </div>
);

const Promise = ({ Icon, label, last }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.62rem 0.9rem',
    borderBottom: last ? 'none' : `1px solid rgba(${AMBER_RGB}, 0.1)`,
  }}>
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      width: 'max(26px, 1.55vw)', height: 'max(26px, 1.55vw)', borderRadius: '0.15rem',
      background: `rgba(${AMBER_RGB}, 0.08)`, border: `1px solid rgba(${AMBER_RGB}, 0.28)`,
    }}>
      <Icon style={{ width: 'max(14px, 0.8vw)', height: 'max(14px, 0.8vw)', color: AMBER }} strokeWidth={1.6} />
    </span>
    <span style={{ fontFamily: FONT, fontSize: 'max(9px, 0.45vw)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255, 254, 240, 0.85)' }}>{label}</span>
  </div>
);

export default function DownloadGate({ notice = null, stretch = false }) {
  const { t } = useLanguage();
  const download = desktopDownload();

  return (
    <section style={{
      position: 'relative', borderRadius: '0.5rem', padding: '1.6rem 1.4rem 1.4rem', overflow: 'visible',
      // stretch: fill the grid row (as tall as the left column) and spread the content evenly.
      ...(stretch ? { alignSelf: 'stretch', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' } : {}),
      background: `radial-gradient(ellipse at 50% 0%, rgba(${AMBER_RGB}, 0.12) 0%, transparent 62%), radial-gradient(ellipse at 100% 100%, rgba(${PURPLE_RGB}, 0.10) 0%, transparent 55%), rgba(2, 0, 3, 0.3)`,
      border: `1px solid rgba(${AMBER_RGB}, 0.22)`,
      // No outer drop shadow: inside the dashboard card it painted a dark halo around the gate.
      boxShadow: `inset 0 0 12px rgba(${AMBER_RGB}, 0.06), inset 0 0 30px rgba(${AMBER_RGB}, 0.03)`,
    }}>
      <style>{`
        @keyframes gflGateSpin { to { transform: rotate(360deg); } }
        @keyframes gflGateScan { 0% { background-position: 0 -100%; } 100% { background-position: 0 200%; } }
        @keyframes gflGateDot { 0%, 100% { opacity: 0.45; } 50% { opacity: 1; } }
      `}</style>

      {/* Holo scanline (tokens: effects.holoOverlays.scanline), clipped to the panel */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, borderRadius: '0.5rem', overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.012) 48%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.012) 52%, transparent 100%)', backgroundSize: '100% 300%', animation: 'gflGateScan 14s linear infinite' }} />
      </div>

      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '1.05rem', ...(stretch ? { flex: 1, justifyContent: 'space-evenly' } : {}) }}>
        {/* Status chip */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.7rem', padding: '0.4rem 0.9rem', borderRadius: '0.15rem',
            border: `1px solid rgba(${AMBER_RGB}, 0.3)`, background: `rgba(${AMBER_RGB}, 0.06)`,
            fontFamily: FONT, fontSize: 'max(14px, 0.85vw)', fontWeight: 700, letterSpacing: '0.16em', lineHeight: 1.35, textAlign: 'center', textTransform: 'uppercase', color: `rgba(${AMBER_RGB}, 0.9)`,
          }}>
            <span style={{ width: 9, height: 9, flexShrink: 0, borderRadius: '50%', background: AMBER, boxShadow: `0 0 8px rgba(${AMBER_RGB}, 0.9)`, animation: 'gflGateDot 2.4s ease-in-out infinite' }} />
            {t('clientOrb.modal.workspace.gate.chip')} · v{download.version}
          </span>
        </div>

        <CrystalEmblem />

        <p style={{ margin: 0, fontFamily: BODY, fontSize: 'max(12px, 0.62vw)', lineHeight: 1.7, color: 'rgba(255, 254, 240, 0.85)', whiteSpace: 'pre-line', textAlign: 'center' }}>
          {t('clientOrb.modal.workspace.getLead')}
        </p>

        <div style={{
          borderRadius: '0.35rem', border: `1px solid rgba(${AMBER_RGB}, 0.16)`,
          background: `linear-gradient(135deg, rgba(${AMBER_RGB}, 0.05) 0%, rgba(2, 0, 3, 0.25) 55%, rgba(${PURPLE_RGB}, 0.06) 100%)`,
        }}>
          <Promise Icon={MonitorSmartphone} label={t('clientOrb.modal.workspace.gate.sameInterface')} />
          <Promise Icon={FolderLock} label={t('clientOrb.modal.workspace.gate.ownFolder')} />
          <Promise Icon={RefreshCw} label={t('clientOrb.modal.workspace.gate.autoUpdate')} last />
        </div>

        <DesktopDownloadButton accent="amber" prominent />

        {notice}
      </div>
    </section>
  );
}
