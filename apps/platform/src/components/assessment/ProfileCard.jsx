import React, { memo, useRef, useState, useEffect } from 'react';
import { C, FONT, useViewport } from '@gfl/ui';
import { OrbSphere3D } from '../../orb';
import { getCardMicrocopy } from './profileCardMicrocopy';
import { getReadingThumb } from './getReadingThumb';
import { leadFor } from './presetKernels';
import WheelGlyph from '../WheelGlyph';

/* ════════════════════════════════════════════════════════════════════════
   ProfileCard — the public profile card (Openbaar render).
   Spec: profile_card_dev_handoff (LOCKED) + profile_card_extraction_spec.
   Consumes ONLY a cardPayload.v1 (allowlist projection) — both the owner's
   Openbaar tab and the public ?u= view render this same component from the
   same payload (SR-5 owner symmetry).

   Register separation (SR-7) — readable without labels:
     instrument-derived → visual-first, Lexend Mega/Rajdhani, amber (+ green
                          provenance), corner brackets
     self-declared      → text-first, Figtree, purple, left-edge bar
   ════════════════════════════════════════════════════════════════════════ */

const AMBER = '#ffae00';
const PURPLE = '#a855f7';
const CREAM = '#FFFEF0';
const DIM = 'rgba(255, 254, 240, 0.5)';
const GREEN = '#15b315';
const FIGTREE = "'Figtree', sans-serif";
const RAJDHANI = "'Rajdhani', sans-serif";

// Fluid font steps (gfl-design-tokens typography.fluidSizePattern)
const FS = {
  xs: 'max(8px, 0.4vw)',
  sm: 'max(9px, 0.45vw)',
  base: 'max(12px, 0.65vw)',
  xl: 'max(13px, 0.7vw)',
  '2xl': 'max(16px, 0.9vw)',
  '3xl': 'max(18px, 1vw)',
  '4xl': 'max(28px, 1.26vw)',
};

// Shared line box for the two column headers (archetype name 3xl · "Transparant profiel" 2xl).
// Both render in a line box of THIS height so the content below each header starts at the
// same y — cross-column alignment by construction, not by margin arithmetic.
const HEADER_LINE = 'max(24px, 1.25vw)';

// OD-1 (OPEN — do not resolve implicitly): public radar is SHAPE-ONLY. The axis-value
// layer is built behind this flag and stays off until OD-1 resolves.
const SHOW_RADAR_VALUES = false;

// ── date helpers (Dutch) ──
const fmtLong = (d) => { if (!d) return '—'; try { return new Date(d).toLocaleDateString('nl-NL', { year: 'numeric', month: 'long', day: 'numeric' }); } catch { return '—'; } };
const p2 = (n) => String(n).padStart(2, '0');
const fmtChip = (d) => { if (!d) return ''; try { const x = new Date(d); return `${p2(x.getDate())}·${p2(x.getMonth() + 1)}·${String(x.getFullYear()).slice(-2)}`; } catch { return ''; } };
const fmtProv = (d) => { if (!d) return '—'; try { const x = new Date(d); return `${p2(x.getDate())}·${p2(x.getMonth() + 1)}·${x.getFullYear()}`; } catch { return '—'; } };

// Amber-label style (zone labels in the instrument register)
const zoneLabel = (color = AMBER, opacity = 0.7) => ({
  fontFamily: FONT, fontSize: FS.xs, fontWeight: 700, letterSpacing: '0.15em',
  textTransform: 'uppercase', color, opacity,
});

// *fragment* → amber semibold (expression-body emphasis)
function renderEmphasized(text) {
  return String(text || '').split(/\*([^*]+)\*/g).map((part, i) => (
    i % 2 === 1
      ? <span key={i} style={{ color: AMBER, fontWeight: 600 }}>{part}</span>
      : <React.Fragment key={i}>{part}</React.Fragment>
  ));
}

/* ── 12-axis radar glyph — shape-only until OD-1 resolves ──
   shapeVector12 absent (null) → neutral placeholder polygon (constant radius),
   clearly a shape, never fabricated per-user values. */
function RadarGlyph({ vector, size }) {
  const cx = size / 2, cy = size / 2, R = size / 2 - 4;
  const vals = Array.isArray(vector) && vector.length === 12
    ? vector.map((v) => Math.max(0.08, Math.min(1, Number(v) || 0)))
    : Array(12).fill(0.62); // PLACEHOLDER shape — real vector ships with the C-magnitude work
  const pt = (i, r) => {
    const a = (Math.PI * 2 * i) / 12 - Math.PI / 2;
    return `${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`;
  };
  const poly = vals.map((v, i) => pt(i, v * R)).join(' ');
  const ring = (f) => Array.from({ length: 12 }, (_, i) => pt(i, R * f)).join(' ');
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" style={{ flexShrink: 0 }}>
      {/* Grid + shape colour matches the PDF/result-card radar (SciFiRadarChart): cyan #a5f3fc grid
          at 0.15 (rings + radial lines), cyan shape stroke + faint cyan fill. */}
      {[0.33, 0.66, 1].map((f) => (
        <polygon key={f} points={ring(f)} fill="none" stroke="rgba(165, 243, 252, 0.15)" strokeWidth="1" />
      ))}
      {Array.from({ length: 12 }, (_, i) => {
        const [x, y] = pt(i, R).split(',');
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(165, 243, 252, 0.15)" strokeWidth="1" />;
      })}
      <polygon points={poly} fill="rgba(165, 243, 252, 0.14)" stroke="#a5f3fc" strokeWidth="1.5" strokeLinejoin="round" />
      {SHOW_RADAR_VALUES && null /* value layer lands here when OD-1 resolves */}
    </svg>
  );
}

/* ── SectorFrame corner brackets (card shell) — box size equals the border radius, so only
   the outer curve renders (no straight arms running along the edges). ── */
function ShellBrackets() {
  const base = { position: 'absolute', width: '10px', height: '10px', border: `1.5px solid ${PURPLE}`, pointerEvents: 'none' };
  return (
    <>
      <div style={{ ...base, top: '-0.125rem', left: '-0.125rem', borderRight: 'none', borderBottom: 'none', borderRadius: '10px 0 0 0' }} />
      <div style={{ ...base, top: '-0.125rem', right: '-0.125rem', borderLeft: 'none', borderBottom: 'none', borderRadius: '0 10px 0 0' }} />
      <div style={{ ...base, bottom: '-0.125rem', left: '-0.125rem', borderRight: 'none', borderTop: 'none', borderRadius: '0 0 0 10px' }} />
      <div style={{ ...base, bottom: '-0.125rem', right: '-0.125rem', borderLeft: 'none', borderTop: 'none', borderRadius: '0 0 10px 0' }} />
    </>
  );
}

/* ── Small amber corner brackets (derived block — SciFi md scale) ── */
function BlockBrackets() {
  const base = { position: 'absolute', width: '0.55rem', height: '0.55rem', border: `2px solid ${AMBER}`, pointerEvents: 'none' };
  return (
    <>
      <div style={{ ...base, top: -2, left: -3, borderRight: 'none', borderBottom: 'none', borderRadius: '2px 0 0 0' }} />
      <div style={{ ...base, top: -2, right: -3, borderLeft: 'none', borderBottom: 'none', borderRadius: '0 2px 0 0' }} />
      <div style={{ ...base, bottom: -2, left: -3, borderRight: 'none', borderTop: 'none', borderRadius: '0 0 0 2px' }} />
      <div style={{ ...base, bottom: -2, right: -3, borderLeft: 'none', borderTop: 'none', borderRadius: '0 0 2px 0' }} />
    </>
  );
}

/* ── Individuatiepad chip (mini-orb + date) — renders via getReadingThumb (OD-6).
   Size comes from the parent so exactly CHIPS_PER_ROW fit side by side in the rail.
   Hover opens the reading's tendens/expressie overlay (fixed-position: the scroll strip
   would clip an absolutely-positioned tooltip). ── */
const CHIPS_PER_ROW = 8;
function ReadingChip({ reading, size, onHover, onLeave }) {
  const thumb = getReadingThumb(reading);
  return (
    <div
      style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', cursor: 'default' }}
      onMouseEnter={(e) => onHover(e, reading)}
      onMouseLeave={onLeave}
    >
      {/* dashed like the ghosts — the ACTIVE profile is already shown full-size above, so no
          chip gets a highlighting solid border */}
      <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', border: '1px dashed rgba(21, 179, 21, 0.35)', background: '#0a0510' }}>
        {thumb.kind === 'image' && <img src={thumb.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
        {thumb.kind === 'orb' && <OrbSphere3D config={thumb.orb} active={false} size={size} style={{ pointerEvents: 'none' }} />}
      </div>
      {/* no date under the chip — the reading date lives on the hover card */}
    </div>
  );
}

function GhostChip({ size }) {
  // Empty upcoming slot — dashed circle only, no projected date underneath.
  return (
    <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
      <div style={{ width: size, height: size, borderRadius: '50%', border: '1px dashed rgba(21, 179, 21, 0.35)' }} />
    </div>
  );
}

/* ── Social icons (declared channel; all optional, edited in Privé).
   Values may be full URLs or bare handles — hrefs are normalized per platform. ── */
const SOCIALS = [
  {
    key: 'instagram', label: 'Instagram', href: (v) => `https://instagram.com/${v.replace(/^@/, '')}`,
    icon: <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></g>,
  },
  {
    key: 'youtube', label: 'YouTube', href: (v) => (v.startsWith('@') ? `https://youtube.com/${v}` : `https://youtube.com/@${v}`),
    icon: <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" /><polygon points="10 15 15 12 10 9 10 15" /></g>,
  },
  {
    key: 'tiktok', label: 'TikTok', href: (v) => `https://tiktok.com/@${v.replace(/^@/, '')}`,
    icon: <path fill="currentColor" d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />,
  },
  {
    key: 'x', label: 'X', href: (v) => `https://x.com/${v.replace(/^@/, '')}`,
    icon: <path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />,
  },
  {
    key: 'linkedin', label: 'LinkedIn', href: (v) => (v.includes('/') ? `https://linkedin.com/${v.replace(/^\//, '')}` : `https://linkedin.com/in/${v.replace(/^@/, '')}`),
    icon: <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></g>,
  },
];

function SocialRow({ socials }) {
  // ALL five icons render at all times, in terminal green — three states:
  //   empty        → dimmed, inert (the slot exists)
  //   claimed      → medium green, clickable (handle typed, ownership not proven)
  //   synchronised → full green + glow (ownership verified via the platform's own OAuth)
  return (
    <div style={{ display: 'flex', gap: '0.45rem', marginLeft: 'auto', alignItems: 'center' }}>
      {SOCIALS.map((s) => {
        const raw = socials && socials[s.key];
        const v = raw ? String(typeof raw === 'object' ? raw.handle || '' : raw).trim() : '';
        const verified = !!(raw && typeof raw === 'object' && raw.verified);
        const box = {
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: '1.9rem', height: '1.9rem', borderRadius: '0.15rem',
          background: 'linear-gradient(135deg, rgba(21,179,21,0.04), rgba(21,179,21,0.09))',
        };
        if (!v) {
          return (
            <span key={s.key} title={s.label} aria-label={`${s.label} — niet gekoppeld`}
              style={{ ...box, color: 'rgba(21, 179, 21, 0.32)', border: '1px solid rgba(21, 179, 21, 0.18)', cursor: 'default' }}>
              <svg viewBox="0 0 24 24" style={{ width: '1.05rem', height: '1.05rem' }}>{s.icon}</svg>
            </span>
          );
        }
        const href = /^https?:\/\//i.test(v) ? v : s.href(v);
        const style = verified
          ? { ...box, color: GREEN, border: '1px solid rgba(21, 179, 21, 0.8)', boxShadow: '0 0 8px rgba(21, 179, 21, 0.45)' }
          : { ...box, color: 'rgba(21, 179, 21, 0.62)', border: '1px solid rgba(21, 179, 21, 0.4)' };
        return (
          <a key={s.key} href={href} target="_blank" rel="noopener noreferrer" aria-label={s.label}
            title={`${s.label}${verified ? ' — gesynchroniseerd' : ''}`} style={style}>
            <svg viewBox="0 0 24 24" style={{ width: '1.05rem', height: '1.05rem' }}>{s.icon}</svg>
          </a>
        );
      })}
    </div>
  );
}

const ProfileCard = memo(({ payload, tabsRow = null, orbConfigOverride = null, active = true, orbBoxRef = null, children = null, wheelBaskets = null }) => {
  const { width: vpW } = useViewport();
  const stacked = vpW < 900;
  const chipsRef = useRef(null);

  // Chip hover: while a chip is hovered, its reading REPLACES the orb zone at the top of
  // the rail (orb + configuration name + date + tendens) — no floating tooltip.
  const [hoverReading, setHoverReading] = useState(null);
  const onChipHover = (_e, reading) => setHoverReading(reading);
  const onChipLeave = () => setHoverReading(null);

  const derived = payload?.derived || {};
  const declared = payload?.declared || {};
  const latest = derived.latest || null;
  const readings = Array.isArray(derived.readings) ? derived.readings : [];
  const readingCount = derived.readingCount || readings.length;
  const micro = getCardMicrocopy(latest?.archetypePrimaryId);

  // Orb: owner's live client-mode config wins (freshest), else the payload's render ref.
  const orbConfig = orbConfigOverride || latest?.orbRenderRef?.orb || null;
  const orbImage = latest?.orbRenderRef?.image || null;
  const orbSize = Math.round(Math.min(300, vpW * (stacked ? 0.4 : 0.125)));

  // Chip size: exactly CHIPS_PER_ROW chips fill the rail's inner width
  // (card = min(88vw, 1500px); rail 32% of it; 1.25rem padding each side; 0.6rem gaps).
  const cardW = Math.min(vpW * 0.88, 1500);
  const railInner = (stacked ? cardW : cardW * 0.32) - 40;
  const chipSize = Math.max(24, Math.floor((railInner - (CHIPS_PER_ROW - 1) * 9.6) / CHIPS_PER_ROW));

  // The strip fills toward the RIGHT: the newest reading sits at the right edge; once the
  // row is full the oldest chips are pushed out of view on the left (scroll back to see them).
  useEffect(() => {
    const el = chipsRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [readings.length, chipSize]);

  // Ghost chips: pad the row to a full CHIPS_PER_ROW slots — empty dashed circles for the
  // readings still to come. Once the path holds 8+ readings, no ghosts remain.
  const ghosts = [];
  for (let i = 0; i < Math.max(0, CHIPS_PER_ROW - readings.length); i++) ghosts.push(i);

  const identityLine = [
    declared.age != null ? String(declared.age) : null,
    declared.country || null,
    Array.isArray(declared.languages) && declared.languages.length ? declared.languages.join(' / ') : null,
  ].filter(Boolean).join(' · ');

  const links = Array.isArray(declared.links) ? declared.links.filter(Boolean) : [];
  const hrefFor = (u) => (/^https?:\/\//i.test(u) ? u : `https://${u}`);

  // Provenance strip segments — activity spine: last reading + last time online.
  const provSegments = [
    `LAATSTE LEZING ${fmtProv(latest?.readingDate)}`,
    `LAATST ONLINE ${fmtProv(declared.lastSeen)}`,
  ];

  // Chips row: wheel → horizontal scroll.
  const onChipsWheel = (e) => {
    const el = chipsRef.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    e.preventDefault();
    el.scrollLeft += e.deltaY || e.deltaX;
  };

  return (
    <div style={{
      position: 'relative',
      width: 'min(88vw, 1500px)',
      height: stacked ? 'auto' : '68vh', // spec 85vh − 20%
      maxHeight: stacked ? 'none' : '100%', // fits inside header-cleared parents (owner dashboard)
      minHeight: stacked ? 0 : 'min(512px, 100%)',
      display: 'flex',
      flexDirection: 'column',
      background: 'rgba(2, 0, 3, 0.3)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRadius: '0.5rem',
      boxShadow: '0 6px 30px rgba(0,0,0,0.7), 0 12px 60px rgba(0,0,0,0.5), 0 0 80px rgba(0,0,0,0.35), 0 0 120px rgba(0,0,0,0.15), inset 0 0 12px rgba(168, 85, 247, 0.06), inset 0 0 30px rgba(168, 85, 247, 0.03)',
      color: CREAM,
      fontFamily: FIGTREE,
      boxSizing: 'border-box',
    }}>
      <ShellBrackets />

      {/* holo overlays (house panel decor — freeze-tolerant under the low-gpu contract) */}
      <div style={{ position: 'absolute', inset: 0, borderRadius: '0.5rem', pointerEvents: 'none', background: 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.015) 30%, transparent 50%, rgba(255,255,255,0.01) 70%, transparent 100%)', backgroundSize: '400% 400%', animation: 'holoSheen 45s ease-in-out infinite', mixBlendMode: 'screen' }} />
      <div style={{ position: 'absolute', inset: 0, borderRadius: '0.5rem', pointerEvents: 'none', background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.008) 48%, rgba(255,255,255,0.015) 50%, rgba(255,255,255,0.008) 52%, transparent 100%)', backgroundSize: '100% 300%', animation: 'holoScanline 14s linear infinite' }} />

      {/* Row 1: tabs (owner view) */}
      {tabsRow && <div style={{ position: 'relative', zIndex: 3, padding: '1rem 1.25rem 0' }}>{tabsRow}</div>}

      {/* Body: when `children` is provided (owner Privé/Instellingen), it swaps in HERE — same shell,
          same footprint, only the inner content changes. Otherwise the Openbaar/public layout renders. */}
      {children ? (
        <div className="purple-scrollbar" style={{ position: 'relative', zIndex: 1, flex: '1 1 auto', minHeight: 0, overflowY: 'auto', padding: '1.5rem 1.75rem', boxSizing: 'border-box' }}>
          {children}
        </div>
      ) : (
      <>
      {/* Row 2: rail | main */}
      <div style={{ position: 'relative', zIndex: 1, flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: stacked ? 'column' : 'row' }}>

        {/* ── Left rail (32%) — identity spine ── */}
        <div style={{ flex: stacked ? '0 0 auto' : '0 0 32%', minWidth: 0, minHeight: 0, overflowY: stacked ? 'visible' : 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderRight: stacked ? 'none' : '1px solid rgba(168, 85, 247, 0.15)', boxSizing: 'border-box' }} className="purple-scrollbar">

          {/* Orb zone — caption belongs to the ORB, not the person (SR-1).
              Hovering an individuatiepad chip REPLACES this whole zone with that reading:
              its orb still, configuration name, date, and tendens. */}
          {(() => {
            const hoverThumb = hoverReading ? getReadingThumb(hoverReading) : null;
            const hoverMicro = hoverReading ? getCardMicrocopy(hoverReading.archetypePrimaryId) : null;
            if (hoverReading) {
              return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.7rem' }}>
                  {/* caption ABOVE the orb (archetype + date + text), orb below.
                      zIndex lift: the orb canvas is drawn 1.35× and overflows UP over this
                      caption — the text must paint on a higher layer or the canvas covers it. */}
                  <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', width: '100%' }}>
                    <div style={{ fontFamily: FONT, fontSize: FS['3xl'], color: AMBER, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700, lineHeight: HEADER_LINE }}>{hoverMicro.configurationName}</div>
                    {/* date is placed at the orb's top-right (below the archetype text) — see the orb wrapper below */}
                    {/* same container grammar as the expressieprofiel block (instrument register) */}
                    {/* marginTop 1rem matches the main column's title→block gap, so this box
                      top-aligns with the expressieprofiel container across the divider */}
                  <div style={{ position: 'relative', width: '100%', marginTop: '1rem', padding: '0.9rem 0.85rem', boxSizing: 'border-box' }}>
                      <div style={{ fontFamily: FIGTREE, fontSize: FS.base, color: CREAM, fontStyle: 'italic', lineHeight: 1.5 }}>{hoverReading.giftMicro || (hoverReading.levensles ? `“${hoverReading.levensles}”` : hoverMicro.tendency)}</div>
                    </div>
                  </div>
                  {/* fixed layout footprint (flexShrink 0) — the oversized canvas overflows
                      visually without pushing the caption above it out of alignment */}
                  <div style={{ position: 'relative', zIndex: 1, width: orbSize, height: orbSize, flexShrink: 0, overflow: 'visible' }}>
                    <div style={{ width: orbSize, height: orbSize, borderRadius: '50%', overflow: 'hidden', background: '#0a0510' }}>
                      {hoverThumb.kind === 'image'
                        ? <img src={hoverThumb.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        : hoverThumb.kind === 'orb'
                          ? <OrbSphere3D config={hoverThumb.orb} active={false} size={orbSize} style={{ pointerEvents: 'none' }} />
                          : <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: '1px dashed rgba(255,255,255,0.12)' }} />}
                    </div>
                    {/* reading date — top-right of the orb (below the archetype text above it) */}
                    <div style={{ position: 'absolute', top: 0, right: 0, fontFamily: RAJDHANI, fontSize: FS.xl, fontWeight: 600, color: CREAM, letterSpacing: '0.06em', background: 'rgba(2, 0, 3, 0.7)', border: '1px solid rgba(255, 174, 0, 0.3)', borderRadius: '0.2rem', padding: '0.2rem 0.5rem', whiteSpace: 'nowrap' }}>{fmtChip(hoverReading.readingDate)}</div>
                  </div>
                </div>
              );
            }
            return (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.7rem' }}>
                {/* caption ABOVE the orb: archetype name + gift text at full rail width.
                    zIndex lift: the orb canvas below is drawn 1.35× and overflows UP over
                    this caption — the text must paint on a higher layer than the canvas. */}
                <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', width: '100%' }}>
                  {/* 3xl, not 4xl: all-caps + 0.2em tracking reads a size bigger than it is */}
                  <div style={{ fontFamily: FONT, fontSize: FS['3xl'], color: AMBER, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700, lineHeight: HEADER_LINE }}>{micro.configurationName}</div>
                  {/* Tendens (gift microcopy → levensles → placeholder) — in the SAME container
                      grammar as the expressieprofiel block (instrument register, amber brackets). */}
                  {/* marginTop 1rem matches the main column's title→block gap, so this box
                      top-aligns with the expressieprofiel container across the divider */}
                  <div style={{ position: 'relative', width: '100%', marginTop: '1rem', padding: '0.9rem 0.85rem', boxSizing: 'border-box' }}>
                    <div style={{ fontFamily: FIGTREE, fontSize: FS.base, color: CREAM, fontStyle: 'italic', lineHeight: 1.5 }}>{latest?.giftMicro || (latest?.levensles ? `“${latest.levensles}”` : micro.tendency)}</div>
                  </div>
                </div>
                {/* fixed layout footprint (width/height pinned, flexShrink 0, overflow visible):
                    the canvas overflows the box VISUALLY only — it can never push the caption
                    up or shift the rail's vertical rhythm against the main column. */}
                <div ref={orbBoxRef || undefined} style={{ position: 'relative', zIndex: 1, width: orbSize, height: orbSize, flexShrink: 0, overflow: 'visible' }}>
                  {orbConfig
                    ? <OrbSphere3D config={orbConfig} active={active} size={orbSize} capturable style={{ filter: 'drop-shadow(0 0 60px rgba(120,80,200,0.2))', pointerEvents: 'none' }} />
                    : orbImage
                      ? <img src={orbImage} alt="" style={{ width: orbSize, height: orbSize, borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
                      : <div style={{ width: orbSize, height: orbSize, borderRadius: '50%', border: '1px dashed rgba(255,255,255,0.12)' }} />}
                </div>
              </div>
            );
          })()}

          {/* Name block — personal register only (no archetype label here).
              zIndex lift: the orb canvas above overflows DOWN over this block too. */}
          <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
            <div style={{ fontFamily: FONT, fontSize: FS['4xl'], color: PURPLE, fontWeight: 700, lineHeight: 1.05, overflowWrap: 'break-word' }}>{declared.displayName || 'Reiziger'}</div>
            {declared.roleLine && <div style={{ fontFamily: FIGTREE, fontSize: 'max(11px, 0.6vw)', color: 'rgba(255,254,240,0.75)', marginTop: '0.35rem' }}>{declared.roleLine}</div>}
            {identityLine && <div style={{ fontFamily: FIGTREE, fontSize: FS.sm, color: DIM, marginTop: '0.3rem', letterSpacing: '0.04em' }}>{identityLine}</div>}
            <div style={{ fontFamily: FIGTREE, fontSize: FS.sm, color: 'rgba(255,254,240,0.35)', marginTop: '0.3rem' }}>Lid sinds {fmtLong(declared.memberSince)}</div>
          </div>

          {/* Individuatiepad — practice-claim only (SR-20); no arrows/deltas (SR-10) */}
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            <div style={zoneLabel()}>
              SCHADUWPROFIELEN · {readingCount} {readingCount === 1 ? 'LEZING' : 'LEZINGEN'}
            </div>
            {/* Scrollable strip — sized so exactly CHIPS_PER_ROW fit; fills toward the RIGHT
                (newest at the right edge). When full, the oldest chips get pushed out of view
                on the left — still reachable by scrolling (wheel or drag). */}
            <div ref={chipsRef} onWheel={onChipsWheel} onScroll={onChipLeave} className="purple-scrollbar" style={{ display: 'flex', gap: '0.6rem', overflowX: 'auto', overflowY: 'hidden', paddingBottom: '0.3rem', scrollbarWidth: 'thin', maxWidth: '100%' }}>
              {readings.map((r) => <ReadingChip key={r.readingId} reading={r} size={chipSize} onHover={onChipHover} onLeave={onChipLeave} />)}
              {ghosts.map((d, i) => <GhostChip key={`g${i}`} size={chipSize} />)}
            </div>
          </div>
        </div>

        {/* ── Main column (68%) ── */}
        <div style={{ flex: '1 1 auto', minWidth: 0, minHeight: 0, overflowY: stacked ? 'visible' : 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxSizing: 'border-box' }} className="purple-scrollbar">

          {/* Title */}
          <div style={{ fontFamily: FONT, fontSize: FS['2xl'], color: AMBER, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700, lineHeight: HEADER_LINE }}>Transparant profiel</div>

          {/* Derived block — instrument register (corner brackets, amber) */}
          {/* alignItems flex-start (not center): the block's first text line must sit at a
              FIXED offset below the title so it stays aligned with the rail's gift box —
              centering made the text top float with content height. */}
          <div style={{ position: 'relative', flex: '0 0 auto', minHeight: stacked ? 0 : '24%', padding: '0.9rem 1rem', display: 'flex', gap: '1rem', alignItems: 'flex-start', boxSizing: 'border-box' }}>
            {/* Left column — the Expressieprofiel header (main + support archetype on their
                own lines) stacked ABOVE the radar wheel. */}
            <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={zoneLabel()}>Expressieprofiel</div>
                {latest?.archetypeMainId && (
                  <div style={{ fontFamily: FONT, fontSize: FS.xs, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255, 174, 0, 0.55)' }}>
                    {latest.archetypeMainId}
                  </div>
                )}
                {latest?.archetypeSupportId && (
                  <div style={{ fontFamily: FONT, fontSize: FS.xs, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255, 174, 0, 0.55)' }}>
                    + {latest.archetypeSupportId}
                  </div>
                )}
              </div>
              {(() => {
                const radarSize = Math.round(Math.min(150, Math.max(96, vpW * 0.075)));
                // Owner view carries the reading's 5-mandje baskets → the full split-colour wheel
                // (identical to the PDF radar). No baskets (public card / pre-extractor) → shape-only glyph.
                return Array.isArray(wheelBaskets) && wheelBaskets.length === 12
                  ? <div style={{ width: radarSize, height: radarSize, flexShrink: 0 }}><WheelGlyph baskets={wheelBaskets} /></div>
                  : <RadarGlyph vector={latest?.shapeVector12} size={radarSize} />;
              })()}
            </div>
            {/* Body column — sits where the header block used to: expression text at the top. */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {/* Body: the AI-authored geometry summary (canon language) wins → then the
                  extracted Gift one-liner → then the placeholder microcopy. */}
              <div style={{ fontFamily: FIGTREE, fontSize: FS.base, lineHeight: 1.6, color: CREAM }}>{renderEmphasized(latest?.geomSummary || (latest?.gift ? `*Gift* — ${latest.gift}.` : micro.expression))}</div>
              {/* Model-note: ships with the block in every render — not a tooltip, not removable. */}
              <div style={{ fontFamily: FIGTREE, fontSize: FS.sm, color: DIM, fontStyle: 'italic' }}>Binnen dit model: een waarschijnlijke tendens, geen bepaling.</div>
            </div>
          </div>

          {/* Declared row — self-write register (left-edge bar, purple; NEVER corner brackets).
              v1.1: each block = the self-written text + a SEPARATE readable section block of
              the user's own §6b question answers (small-caps purple lead-in per answer). */}
          <div style={{ flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: stacked ? 'column' : 'row', gap: '1rem' }}>
            {[
              { block: 'description', label: 'Profiel beschrijving', value: declared.description, empty: 'Nog geen beschrijving — voeg er een toe onder Privé.' },
              { block: 'intention', label: 'Intentie', value: declared.intention, empty: 'Wat zoek je hier? Samenwerking, werk, uitwisseling — schrijf het in je eigen woorden.' },
            ].map((col) => {
              // v1.1 {text, sections} with back-compat for plain v1 strings
              const v = col.value && typeof col.value === 'object' ? col.value : { text: col.value || '', sections: [] };
              const text = v.text || '';
              const sections = Array.isArray(v.sections) ? v.sections.filter((s) => s && s.key && s.text) : [];
              return (
                <div key={col.label} style={{ flex: '1 1 0', minWidth: 0, minHeight: 0, borderLeft: `2px solid ${PURPLE}`, padding: '0.9rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', boxSizing: 'border-box' }}>
                  <div style={zoneLabel(PURPLE, 0.85)}>{col.label}</div>
                  <div className="purple-scrollbar" style={{ flex: 1, minHeight: stacked ? 'auto' : 0, overflowY: 'auto' }}>
                    <div style={{ fontFamily: FIGTREE, fontSize: FS.base, lineHeight: 1.7, whiteSpace: 'pre-wrap', color: text || sections.length ? CREAM : 'rgba(255,254,240,0.35)' }}>
                      {text || (sections.length ? null : col.empty)}
                    </div>
                    {sections.length > 0 && (
                      <div style={{ marginTop: text ? '0.9rem' : 0, paddingTop: text ? '0.9rem' : 0, borderTop: text ? '1px dashed rgba(168, 85, 247, 0.25)' : 'none', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                        {sections.map((s) => (
                          <div key={s.key}>
                            <div style={{ fontFamily: FONT, fontSize: FS.xs, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: PURPLE, opacity: 0.85, marginBottom: '0.2rem' }}>{leadFor(col.block, s.key)}</div>
                            <div style={{ fontFamily: FIGTREE, fontSize: FS.base, lineHeight: 1.6, whiteSpace: 'pre-wrap', color: CREAM }}>{s.text}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* Row 3: provenance strip — fixed spine (SR-9); instrument metadata left, the link
          pill (full-row width styling) + social icons right-aligned inside the sync line. */}
      <div style={{ position: 'relative', zIndex: 1, borderTop: '1px solid rgba(21, 179, 21, 0.35)', background: 'rgba(21, 179, 21, 0.025)', padding: '0.5rem 1.25rem', fontFamily: RAJDHANI, fontSize: FS.sm, color: GREEN, letterSpacing: '0.12em', textTransform: 'uppercase', display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: '0.6rem', rowGap: '0.2rem', borderRadius: '0 0 0.5rem 0.5rem' }}>
        {provSegments.map((seg, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span style={{ opacity: 0.55 }}>//</span>}
            <span>{seg}</span>
          </React.Fragment>
        ))}
        {/* Link + socials — terminal green, at the right end of the strip. The pill keeps the
            padding it had on its own row above the line. */}
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {(() => {
            const pill = {
              fontFamily: FONT, fontSize: FS.sm, textDecoration: 'none', borderRadius: '0.15rem',
              padding: '0.3rem 0.7rem', letterSpacing: '0.06em', wordBreak: 'break-all', textTransform: 'none',
              background: 'linear-gradient(135deg, rgba(21,179,21,0.04), rgba(21,179,21,0.09))',
            };
            if (!links.length) {
              return (
                <span style={{ ...pill, color: 'rgba(21, 179, 21, 0.32)', border: '1px solid rgba(21, 179, 21, 0.18)', cursor: 'default' }}>
                  https://jouweigenlink.nl
                </span>
              );
            }
            return links.map((l) => (
              <a key={l} href={hrefFor(l)} target="_blank" rel="noopener noreferrer"
                style={{ ...pill, color: GREEN, border: '1px solid rgba(21, 179, 21, 0.65)', boxShadow: '0 0 6px rgba(21, 179, 21, 0.25)' }}>
                {l}
              </a>
            ));
          })()}
          <SocialRow socials={declared.socials} />
        </span>
      </div>
      </>
      )}
    </div>
  );
});

ProfileCard.displayName = 'ProfileCard';
export default ProfileCard;
