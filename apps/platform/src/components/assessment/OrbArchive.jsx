import React, { memo, useRef } from 'react';
import { C, FONT } from '@gfl/ui';
import { OrbSphere3D } from '../../orb';

/* ════════════════════════════════════════════════════════════════════════
   OrbArchive — the "crystal history" strip. Shows a user's PAST orbs (older
   linked codes) oldest→newest as a horizontally-scrollable, looped row of small
   STATIC thumbnails. Each past orb is a stored screenshot (entry.image); entries
   that don't have a captured image yet fall back to a static (active=false) orb
   rendered from the saved config. The most recent orb is the active profile orb,
   shown large elsewhere, so the parent passes only the older entries here.
   ════════════════════════════════════════════════════════════════════════ */

const MAX_SHOWN = 24; // images are cheap; only the (few) imageless fallbacks are live WebGL

function fmtDate(at) {
  if (!at) return '';
  try { return new Date(at).toLocaleDateString('nl-NL', { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return ''; }
}

const OrbArchive = memo(({ entries, size = 44, title = 'Kristal-geschiedenis', accent = C.purple }) => {
  const list = (entries || []).filter(Boolean);
  const scrollRef = useRef(null);
  if (list.length === 0) return null;
  const shown = list.slice(-MAX_SHOWN);

  // Wheel → horizontal scroll, looped: wrap to the other end when you hit a boundary.
  const onWheel = (e) => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    if (max <= 0) return;
    e.preventDefault();
    const delta = e.deltaY || e.deltaX;
    let next = el.scrollLeft + delta;
    if (next > max) next = next - max;        // past the end → loop to start
    else if (next < 0) next = max + next;     // before the start → loop to end
    el.scrollLeft = next;
  };

  return (
    <div style={{ fontFamily: FONT, width: '100%' }}>
      <div style={{ fontSize: 'max(9px,0.5vw)', letterSpacing: '0.16em', textTransform: 'uppercase', color: accent, marginBottom: '0.45rem', textAlign: 'center' }}>
        {title}
      </div>
      <div
        ref={scrollRef}
        onWheel={onWheel}
        className="purple-scrollbar"
        style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', overflowY: 'hidden', paddingBottom: '0.35rem', scrollbarWidth: 'thin', WebkitOverflowScrolling: 'touch' }}
      >
        {shown.map((e, i) => (
          <div
            key={i}
            title={[e.archetypeName, fmtDate(e.at)].filter(Boolean).join(' · ')}
            style={{ flex: '0 0 auto', width: size, height: size }}
          >
            {e.image
              ? <img src={e.image} alt={e.archetypeName || 'kristal'} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: `1px solid ${accent}55`, display: 'block' }} />
              : e.orb
                ? <OrbSphere3D config={e.orb} active={false} size={size} style={{ pointerEvents: 'none' }} />
                : <div style={{ width: size, height: size, borderRadius: '50%', border: '1px dashed rgba(255,255,255,0.12)' }} />}
          </div>
        ))}
      </div>
    </div>
  );
});

OrbArchive.displayName = 'OrbArchive';
export default OrbArchive;
