import React from 'react';
import { FONT } from '@gfl/ui';
import { PALETTES } from './engine';
import { ORB3D_LEVERS, ORB3D_PRESETS } from './orb3d';

/**
 * Crystal-lab panels — two symmetric, controlled containers that flank the 3D orb:
 *   LeverDashboard   (left)  — the 10 render levers of the 3D orb.
 *   PaletteDashboard (right) — the six hardware-group templates (morph the whole orb).
 * Parent owns the config + the orb.
 *
 * SECURITY: these panels never encode or display an LC_ORB_ signature. The template orb is a
 * throw-away visual only — no code is generated client-side.
 */

const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const sup = (n) => String(n).split('').map((d) => SUP[d] || d).join('');

// Shared panel chrome so both sides stay perfectly symmetric.
const shell = (fullHeight, mobile) => ({
  width: mobile ? '92vw' : 'clamp(228px, 20.4vw, 300px)',
  height: fullHeight ? '100%' : 'auto', flexShrink: 0, boxSizing: 'border-box',
  display: 'flex', flexDirection: 'column', padding: '0.9rem 1rem',
  background: 'rgba(2,0,3,0.82)',
  border: '1px solid rgba(176,77,198,0.20)', borderRadius: '0.5rem', fontFamily: FONT,
  boxShadow: '0 8px 40px rgba(0,0,0,0.45)', overflowY: 'auto',
});

const Header = ({ title, subtitle }) => (
  <div style={{ flexShrink: 0 }}>
    <div style={{ fontSize: 'max(12px,0.7vw)', letterSpacing: '0.22em', fontWeight: 'bold', color: '#e8d088', textTransform: 'uppercase' }}>{title}</div>
    {subtitle && (
      <div style={{ fontSize: 'max(9px,0.5vw)', color: 'rgba(255,255,255,0.42)', marginTop: '0.25rem', marginBottom: '0.7rem', lineHeight: 1.4 }}>{subtitle}</div>
    )}
  </div>
);

const fillCol = (fullHeight) => ({
  flex: fullHeight ? 1 : 'none', display: 'flex', flexDirection: 'column',
  justifyContent: fullHeight ? 'space-between' : 'flex-start', gap: fullHeight ? 0 : '0.5rem', minHeight: 0,
});

/* ── Left panel: the 3D render levers ───────────────────────────────────── */
export function LeverDashboard({ cfg, onChange, fullHeight = false, mobile = false }) {
  const setLever = (k, v) => onChange({ ...cfg, [k]: v });
  return (
    <div style={shell(fullHeight, mobile)}>
      <Header title="Vloeibaar-kristal" subtitle={`Visueel hologram van jouw antwoordprofiel. 10${sup(28)}+ unieke combinaties.`} />

      <div style={fillCol(fullHeight)}>
        {ORB3D_LEVERS.map((lev) => {
          const val = cfg[lev.key];
          return (
            <div key={lev.key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
                <span style={{ fontSize: 'max(9.5px,0.5vw)', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase' }}>{lev.label}</span>
                <span style={{ fontSize: 'max(9.5px,0.5vw)', color: '#b04dc6', fontVariantNumeric: 'tabular-nums' }}>{lev.int ? Math.round(val) : Number(val).toFixed(2)}</span>
              </div>
              <input type="range" min={lev.min} max={lev.max} step={lev.step} value={val}
                onChange={(e) => setLever(lev.key, parseFloat(e.target.value))}
                style={{ width: '100%', height: 3, accentColor: '#b04dc6', cursor: 'pointer', display: 'block' }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Right panel: the six hardware-group templates ──────────────────────── */
export function PaletteDashboard({ cfg, onChange, fullHeight = false, mobile = false }) {
  return (
    <div style={shell(fullHeight, mobile)}>
      <Header title="Hardwaregroep" subtitle="Ontdek de kleurtypes voor elke groep." />

      <div style={fillCol(fullHeight)}>
        {Object.entries(PALETTES).map(([name, cols]) => {
          const sel = cfg.palette === name;
          return (
            <button key={name} type="button"
              onClick={() => onChange(ORB3D_PRESETS[name]
                ? { ...ORB3D_PRESETS[name], palette: name }   // morph the whole orb to the group's template
                : { ...cfg, colors: cols, palette: name })}
              style={{
                width: '100%', textAlign: 'left', cursor: 'pointer', padding: '0.45rem 0.55rem', borderRadius: 5,
                background: sel ? 'rgba(232,208,136,0.06)' : 'transparent',
                border: sel ? '1px solid rgba(232,208,136,0.5)' : '1px solid rgba(255,255,255,0.08)',
                fontFamily: FONT, transition: 'border-color 0.15s, background 0.15s',
              }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 'max(10px,0.52vw)', letterSpacing: '0.06em', color: sel ? '#e8d088' : 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>{name}</span>
                {sel && <span style={{ fontSize: 'max(8px,0.42vw)', color: '#e8d088' }}>●</span>}
              </div>
              <div style={{ height: 16, borderRadius: 3, background: `linear-gradient(90deg, ${cols.join(', ')})`, boxShadow: sel ? '0 0 8px rgba(232,208,136,0.4)' : 'none' }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default LeverDashboard;
