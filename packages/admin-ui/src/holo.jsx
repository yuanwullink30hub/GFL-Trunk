/**
 * HoloPro skin for the management app — the look of the "Futuristisch Administratie Dashboard" reference
 * (cyber-grid void, HUD header, glass cards with a purple/orange HUD corner pair, dual-gradient filter
 * tabs, glowing numeric readouts), expressed in OUR tokens (gfl-design-tokens.json): Lexend Mega chrome,
 * Rajdhani readouts, #FFFEF0 text, #0a0510 void, 0.15rem/0.5rem radii, 135deg gradients, alpha ramps of
 * the purple and orange accents (owner, 2026-09-19: "HoloPro look, our tokens").
 * Admin-only: nothing here is imported by the website or the desktop app.
 */
import React, { useEffect, useState } from 'react';
import { FONT } from '@gfl/ui';

export const PURPLE = '#a855f7';
export const ORANGE = '#f97316';
const P = '168, 85, 247';
const O = '249, 115, 22';
export const DISPLAY = "'Rajdhani', sans-serif"; // tokens: numeric readouts, counters

/** The page: void + cyber grid + the three ambient glows. */
export const HOLO_PAGE_BG = [
  `radial-gradient(circle at 15% 15%, rgba(${P}, 0.1), transparent 45%)`,
  `radial-gradient(circle at 85% 25%, rgba(${O}, 0.1), transparent 40%)`,
  `radial-gradient(circle at 50% 90%, rgba(${P}, 0.06), transparent 50%)`,
  `linear-gradient(to right, rgba(${P}, 0.06) 1px, transparent 1px)`,
  `linear-gradient(to bottom, rgba(${O}, 0.04) 1px, transparent 1px)`,
].join(', ');
export const HOLO_PAGE_BG_SIZE = 'auto, auto, auto, 32px 32px, 32px 32px';

/** Glass bar (header / footer). */
export const HOLO_BAR = {
  backgroundColor: 'rgba(2, 0, 3, 0.3)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
};

/** Table header row: the deep-purple header bar over a purple hairline. */
export const HOLO_TABLE_HEAD = {
  backgroundColor: 'rgba(42, 10, 56, 0.35)',
  borderBottom: `1px solid rgba(${P}, 0.2)`,
  borderRadius: '0.15rem 0.15rem 0 0',
};

/** Chrome text: Lexend Mega, uppercase, tracked. */
export const CHROME = (size = 'max(8px, 0.4vw)', color = 'rgba(255, 254, 240, 0.5)') => ({
  fontFamily: FONT, fontSize: size, color, textTransform: 'uppercase', letterSpacing: '0.1em',
});

/** 135deg gradient text — purple readouts, orange readouts, and the purple→cream→orange title. */
export const gradientText = (stops) => ({
  backgroundImage: `linear-gradient(135deg, ${stops})`,
  WebkitBackgroundClip: 'text', backgroundClip: 'text',
  color: 'transparent', WebkitTextFillColor: 'transparent',
});
export const TITLE_GRADIENT = '#c084fc, #FFFEF0 55%, #fb923c';

const hexRgb = (hex) => {
  const h = String(hex || '').replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(h)) return P;
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(', ');
};

/** Keyframes the skin needs. The sweep and the breathing dot are decorative: they tolerate the
 *  low-gpu freeze (iteration-count 1 → the sweep ends off-card, the dot ends lit). */
export function HoloKeyframes() {
  return (
    <style>{`
      @keyframes holoSweep {
        0%   { transform: translateX(-160%) skewX(-25deg); }
        35%  { transform: translateX(260%) skewX(-25deg); }
        100% { transform: translateX(260%) skewX(-25deg); }
      }
      @keyframes holoPulse {
        0%, 100% { opacity: 1; }
        50%      { opacity: 0.5; }
      }
      @keyframes holoDotBreathe {
        0%, 100% { opacity: 0.55; box-shadow: 0 0 2px rgba(34, 197, 94, 0.35); }
        50%      { opacity: 1;    box-shadow: 0 0 8px 1px rgba(34, 197, 94, 0.7); }
      }
      .holo-scroll::-webkit-scrollbar { width: 3px; height: 3px; }
      .holo-scroll::-webkit-scrollbar-track { background: transparent; }
      .holo-scroll::-webkit-scrollbar-thumb { background: rgba(${P}, 0.6); border-radius: 2px; }
      .holo-scroll::-webkit-scrollbar-thumb:hover { background: rgba(${P}, 0.9); }
      .holo-scroll { scrollbar-width: thin; scrollbar-color: rgba(${P}, 0.6) transparent; }
      .holo-row { transition: background-color 0.2s; }
      .holo-row:hover { background-color: rgba(${P}, 0.06) !important; }
    `}</style>
  );
}

/** HUD corner pair: purple top-left, orange bottom-right (tokens cornerAccents: 10px, -1px, 2px). */
export function HoloCorners() {
  const base = { position: 'absolute', width: '10px', height: '10px', pointerEvents: 'none', zIndex: 3 };
  return (
    <>
      <div style={{ ...base, top: -1, left: -1, borderTop: `2px solid ${PURPLE}`, borderLeft: `2px solid ${PURPLE}` }} />
      <div style={{ ...base, bottom: -1, right: -1, borderBottom: `2px solid ${ORANGE}`, borderRight: `2px solid ${ORANGE}` }} />
    </>
  );
}

/** The holographic sweep across a KPI tile. The parent needs position:relative + overflow:hidden. */
export function HoloSheen() {
  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', borderRadius: 'inherit' }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '60%', height: '100%',
        background: `linear-gradient(135deg, transparent 0%, rgba(${P}, 0.1) 30%, rgba(${O}, 0.2) 50%, rgba(${P}, 0.1) 70%, transparent 100%)`,
        animation: 'holoSweep 7s ease-in-out infinite',
        willChange: 'transform',
      }} />
    </div>
  );
}

/** Glass card surface + hover (border flips to orange, soft orange glow). */
export const holoCardStyle = (hov, accentRgb = P) => ({
  position: 'relative',
  backgroundColor: 'rgba(2, 0, 3, 0.3)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: `1px solid ${hov ? `rgba(${O}, 0.5)` : `rgba(${accentRgb}, 0.2)`}`,
  borderRadius: '0.5rem',
  boxShadow: hov
    ? `0 8px 24px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 20px rgba(${O}, 0.2), 0 0 8px rgba(${P}, 0.2)`
    : `0 8px 24px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 0 8px rgba(${P}, 0.2)`,
  transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
});

/** Breathing status dot (tokens components.statusDot). */
export function StatusDot({ color = '#22c55e', breathe = true, size = '0.5rem' }) {
  return (
    <span aria-hidden style={{
      display: 'inline-block', width: size, height: size, borderRadius: '50%', flexShrink: 0,
      backgroundColor: color, boxShadow: `0 0 6px ${color}`,
      animation: breathe ? 'holoDotBreathe 2.4s ease-in-out infinite' : undefined,
    }} />
  );
}

/** Live clock for the telemetry strip — Amsterdam time. Its own component, so the tick re-renders nothing else. */
export function HoloClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);
  const time = now.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Europe/Amsterdam' });
  const zone = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Amsterdam', timeZoneName: 'short' })
    .formatToParts(now).find((p) => p.type === 'timeZoneName')?.value || '';
  return (
    <span style={{
      fontFamily: DISPLAY, fontWeight: 700, fontSize: 'max(11px, 0.6vw)', letterSpacing: '0.08em', color: ORANGE,
      padding: '0.1rem 0.5rem', borderRadius: '0.15rem', background: `rgba(${O}, 0.1)`, border: `1px solid rgba(${O}, 0.2)`,
    }}>
      {time} <span style={{ fontSize: 'max(8px, 0.4vw)', opacity: 0.8 }}>{zone}</span>
    </span>
  );
}

/** The logo tile: a blurred purple→orange ring behind a void square, a pulsing orange dot on its corner. */
export function BrandMark({ label = 'GFL' }) {
  return (
    <div style={{ position: 'relative', flexShrink: 0, width: 'max(2.4rem, 2.2vw)', height: 'max(2.4rem, 2.2vw)' }}>
      <div aria-hidden style={{
        position: 'absolute', inset: '-3px', borderRadius: '0.5rem', opacity: 0.75, filter: 'blur(4px)',
        background: `linear-gradient(135deg, ${PURPLE}, ${ORANGE}, ${PURPLE})`,
      }} />
      <div style={{
        position: 'relative', width: '100%', height: '100%', borderRadius: '0.35rem',
        backgroundColor: '#0a0510', border: `1px solid rgba(${P}, 0.4)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: FONT, fontWeight: 700, fontSize: 'max(10px, 0.5vw)', letterSpacing: '0.08em',
        color: ORANGE, textShadow: `0 0 8px rgba(${O}, 0.4)`,
      }}>{label}</div>
      <span aria-hidden style={{
        position: 'absolute', right: -2, bottom: -2, width: 6, height: 6, borderRadius: '50%',
        backgroundColor: ORANGE, animation: 'holoPulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }} />
    </div>
  );
}

/** Filter-style tab: idle glass + purple hairline; active = purple→orange 135deg gradient, orange border, glow. */
export function HoloTab({ children, active = false, onClick, disabled = false, fullWidth = false, count }) {
  const [hov, setHov] = useState(false);
  const lit = active || hov;
  return (
    <button
      type="button" onClick={onClick} disabled={disabled}
      onMouseEnter={() => !disabled && setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
        width: fullWidth ? '100%' : undefined,
        padding: '0.4rem 0.9rem', borderRadius: '0.15rem', cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: FONT, fontSize: 'max(10px, 0.5vw)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em',
        color: lit ? '#FFFEF0' : 'rgba(255, 254, 240, 0.5)',
        background: active
          ? `linear-gradient(135deg, rgba(${P}, 0.3), rgba(${O}, 0.2))`
          : hov ? `rgba(${P}, 0.1)` : 'rgba(0, 0, 0, 0.4)',
        border: `1px solid ${active ? `rgba(${O}, 0.5)` : hov ? `rgba(${P}, 0.5)` : `rgba(${P}, 0.2)`}`,
        boxShadow: active ? `0 0 15px rgba(${O}, 0.2)` : 'none',
        opacity: disabled ? 0.4 : 1,
        transition: 'all 0.2s',
      }}
    >
      {children}
      {count != null && (
        <span style={{
          fontSize: 'max(8px, 0.4vw)', padding: '0.05rem 0.35rem', borderRadius: '0.15rem',
          background: active ? `rgba(${O}, 0.5)` : `rgba(${P}, 0.2)`, color: active ? '#FFFEF0' : '#c084fc',
        }}>{count}</span>
      )}
    </button>
  );
}

/** KPI readout tile: glass card, HUD corners, sweep, label + glowing Rajdhani number in the stat's colour. */
export function KpiTile({ label, value, color = PURPLE, glyph, footer, style }) {
  const [hov, setHov] = useState(false);
  const rgb = hexRgb(color);
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ ...holoCardStyle(hov, rgb), padding: '0.8rem 1rem', ...style }}
    >
      <HoloCorners />
      <HoloSheen />
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
        {glyph && (
          <span aria-hidden style={{
            width: 'max(1.4rem, 1.4vw)', height: 'max(1.4rem, 1.4vw)', borderRadius: '0.35rem', flexShrink: 0,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: `rgba(${rgb}, 0.1)`, border: `1px solid rgba(${rgb}, 0.4)`, color,
            fontSize: 'max(10px, 0.5vw)',
          }}>{glyph}</span>
        )}
        <span style={CHROME('max(8px, 0.4vw)')}>{label}</span>
      </div>
      <div style={{
        position: 'relative', fontFamily: DISPLAY, fontWeight: 700, lineHeight: 1.1,
        fontSize: 'max(22px, 1.26vw)', color, textShadow: `0 0 8px rgba(${rgb}, 0.4)`,
      }}>{value}</div>
      {footer && (
        <div style={{ position: 'relative', marginTop: '0.5rem', paddingTop: '0.4rem', borderTop: `1px solid rgba(${P}, 0.1)`, ...CHROME('max(7px, 0.35vw)') }}>
          {footer}
        </div>
      )}
    </div>
  );
}
