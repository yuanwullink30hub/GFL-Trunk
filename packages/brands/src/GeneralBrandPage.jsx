import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { 
  Globe, 
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Maximize2, 
  List, 
  X, 
  Mail, 
  Calendar, 
  User, 
  ShoppingBag, 
  Info, 
  ExternalLink, 
  ShieldCheck, 
  MapPin,
  Activity,
  ChevronDown
} from 'lucide-react';
// Note: lucide-react provides icons - ensure it's installed or use alternatives

import { useLanguage } from '@gfl/i18n';

// The smallest text on the brand page: the size of the brand description (Tailwind text-sm). Owner, 14 Oct:
// every label, badge, tab and button on this page reads at least this large.
const FONT_MIN = '0.875rem';
import { BRANDS, fillerMetrics } from './brandData';
import { 
  SectorFrame, 
  TabButton, 
  GlowButton, 
  TechBadge, 
  IconButton,
  Modal
} from './SciFiUI';
import BrandStats from './BrandStats';
import { NICHES, COUNTRIES, PRICE } from './searchOptions';
import MobileDetailPage from './MobileDetailPage';

// Instagram icon component (since lucide doesn't have Instagram)
const Instagram = ({ size = 24, className = '' }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

// Linkedin icon component
const Linkedin = ({ size = 24, className = '' }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect width="4" height="12" x="2" y="9"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
);

// ── Overview → detail (the Gardens page, owner 14 Oct) ─────────────────────────────────────────────────────
// Arriving, the whole wheel stands centred on the screen with no unit lifted, and a small preview card of a
// unit stands to its left. "Bekijk" plays one movement: the wheel sinks and grows into its docked place at
// the bottom, the card grows into the left sector, and the middle and right sectors unfold out of the card.
const UNFOLD_MS = 900;
const UNFOLD_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const reducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Where the overview puts things: the wheel's size and centre, and the preview card left of it (px). */
function overviewGeometry(vpW, vpH) {
  const centerY = Math.round(vpH * 0.53);
  const EDGE = 16; // screen margin
  const GAP = Math.round(Math.max(16, vpW * 0.015)); // between a container and the wheel
  // The containers keep their size (1.25×, owner 14 Oct) and sit outward; the wheel (+15%, owner 14 Oct) takes
  // the room between them, down to a floor — below that (narrow screens) the containers give way instead.
  let cardW = Math.round(Math.min(525, Math.max(375, vpW * 0.275)));
  const wheelTarget = Math.min(vpH * 0.62, vpW * 0.36) * 1.15;
  const wheelFloor = vpH * 0.45;
  let size = Math.min(wheelTarget, vpW - 2 * (cardW + EDGE + GAP));
  if (size < wheelFloor) {
    size = Math.min(wheelTarget, wheelFloor);
    cardW = Math.max(240, Math.floor((vpW - size) / 2 - EDGE - GAP));
  }
  size = Math.round(size);
  const cardLeft = Math.max(EDGE, Math.round(vpW / 2 - size / 2 - GAP - cardW));
  // The search panel mirrors the card on the wheel's right.
  return { size, centerY, cardW, cardLeft, searchLeft: vpW - cardLeft - cardW };
}

// Every unit's image sits in a round container with a glowing grey border (owner, 14 Oct).
const UNIT_FRAME = {
  borderRadius: '50%',
  overflow: 'hidden',
  padding: 0,
  border: '1.5px solid rgba(200, 200, 212, 0.55)',
  boxShadow: '0 0 12px rgba(200, 200, 212, 0.35), inset 0 0 8px rgba(200, 200, 212, 0.12)',
  backgroundColor: 'rgba(10, 5, 16, 0.6)',
};

/** The transform that shows a box with rect `from` at rect `to` (transform-origin 0 0). */
const mapRect = (from, to) => `translate(${to.left - from.left}px, ${to.top - from.top}px) scale(${to.width / from.width}, ${to.height / from.height})`;

// ── The overview's endless wheel (owner, 14 Oct) ─────────────────────────────────────────────────────────────
// Units appear at the centre and travel clockwise outwards, growing, until they fade out at the rim — one endless
// stream through every brand (and fillers while there are few). CSS animations (the low-GPU freeze may stop them);
// the pointer never stops the stream, and scrolling over the wheel speeds it up forwards or backwards.
const RING_TURN_S = 60;
// Two strands, like DNA, spiralling outwards half a turn apart (owner, 14 Oct): units leave the centre in pairs, one
// on each strand; strand A fades out at the bottom centre, strand B at the top centre. Fitted offline before it
// was built (scratchpad dna_fit: every placement checked over a whole cycle, no two units with opacity ≈ 1 closer
// than 0.01 of the wheel, rim units inside the border). At the rim size the owner chose (0.17 of the wheel) the
// most that fit was 28, but that was too many to focus on (owner, 14 Oct): 20 % fewer, 22 (11 per strand), on
// the path re-fitted for the most room — 1¼ windings, quicker through the centre — whose closest gap (0.025 of
// the wheel) is twice the 28-unit layout's. (Just dropping units from the old path made rows collide.)
const SPIRAL = {
  perStrand: 11,    // units on each strand at once
  turns: 1.25,      // windings per strand, centre to rim
  ends: [180, 0],   // where each strand's units have faded out: bottom centre, top centre (clockwise from the top)
  rMin: 0.05,       // start radius, as a share of the wheel's size
  unit: 0.17,       // a unit's size at the rim, as a share of the wheel's size
  startScale: 0.4,  // its size where it appears, relative to the rim
  angleExp: 0.7,    // angle runs as u^angleExp (u = progress 0…1, equal time steps between pairs)
  radiusExp: 0.85,  // radius runs as u^radiusExp
};
SPIRAL.rMax = 0.49 - SPIRAL.unit / 2;              // a rim unit stays inside the border
SPIRAL.durationS = RING_TURN_S * SPIRAL.turns;    // the fitted path's time: a pair leaves the centre every ~6.8 s
// The fade sits one unit position further on (owner, 14 Oct): past the fitted path's end each strand runs one more
// spacing along the rim (rMax, full size, at the end's angular speed, ≈ 29°) and fades there. Checked: the closest
// gap stays 0.025 of the wheel. So a strand holds perStrand + 1 slots, and the pass lasts one spacing longer.
SPIRAL.slotsPerStrand = SPIRAL.perStrand + 1;
SPIRAL.passS = SPIRAL.durationS * (SPIRAL.slotsPerStrand / SPIRAL.perStrand);
SPIRAL.visible = SPIRAL.slotsPerStrand * 2;        // the fewest units the endless stream can run with (24)
// A large head start, so scrolling backwards never reaches the animations' beginning.
const SPIRAL_HEAD_START_S = SPIRAL.passS * 1000; // whole passes, so every slot keeps its place on the path

/**
 * One strand's keyframes, sampled along its path (it is not a straight spiral): the fitted path over u = 0…1, then
 * the rim extension over u = 1…U (U = slotsPerStrand / perStrand). Percentages are u / U.
 */
function strandKeyframes(name, endDeg, rMinPx, rMaxPx) {
  const { turns, startScale, angleExp, radiusExp, perStrand, slotsPerStrand } = SPIRAL;
  const U = slotsPerStrand / perStrand;
  const endRateDeg = turns * 360 * angleExp; // dθ/du at the fitted end, carried on along the rim
  const STEPS = 32;
  const EXTRA = 4;
  const at = (u) => (u <= 1
    ? { deg: endDeg - turns * 360 * (1 - Math.pow(u, angleExp)), r: rMinPx + (rMaxPx - rMinPx) * Math.pow(u, radiusExp), scale: startScale + (1 - startScale) * u }
    : { deg: endDeg + (u - 1) * endRateDeg, r: rMaxPx, scale: 1 });
  const us = [...Array.from({ length: STEPS + 1 }, (_, i) => i / STEPS), ...Array.from({ length: EXTRA }, (_, i) => 1 + ((i + 1) / EXTRA) * (U - 1))];
  const pct = (u) => ((u / U) * 100).toFixed(3);
  const frames = us.map((u, i) => {
    const p = at(u);
    const deg = p.deg.toFixed(2);
    // opacity 0 at both ends; kept in the same frames as the transform, since browsers treat repeated keyframe
    // selectors differently
    const edge = i === 0 || i === us.length - 1 ? ' opacity: 0;' : '';
    return `${pct(u)}% { transform: rotate(${deg}deg) translateY(-${p.r.toFixed(1)}px) rotate(${-deg}deg) scale(${p.scale.toFixed(3)});${edge} }`;
  });
  // fully visible from u = 0.08 until one spacing past where it used to start fading (0.9), then out by the end
  frames.push(`${pct(0.08)}% { opacity: 1; } ${pct(0.9 + 1 / perStrand)}% { opacity: 1; }`);
  return `@keyframes ${name} { ${frames.join(' ')} }`;
}

/**
 * The stream. Each strand has SPIRAL.perStrand slots, evenly spaced in time (negative delays); a slot is one CSS
 * animation (rotate · translate outward · counter-rotate · grow). Units are numbered in the order they leave the
 * centre — pair by pair, strand A first — and the numbering wraps after `total`: the real brands, or the fewest
 * fillers that keep both strands full (SPIRAL.visible) when there are fewer brands. So with 30 brands the stream
 * runs 1…30 and starts again, never through empty fillers; with none it is just enough fillers to stay endless.
 *
 * The pointer never stops it. Scrolling over the wheel speeds it up — forwards (scroll down) or backwards
 * (scroll up) — and it eases back to normal speed once the scrolling stops; the map behind never pans.
 */
const SpiralStream = ({ rMin, rMax, unitSize, labelSize, total, logoOf, pickedUnit, isMatch, onPick }) => {
  const { t } = useLanguage();
  // S slots per strand (the fitted units plus the one fading on the rim), one spacing apart in time.
  const { perStrand, slotsPerStrand: S, durationS, passS, ends } = SPIRAL;
  const spacingS = durationS / perStrand;
  const [passes, setPasses] = useState(() => Array(2 * S).fill(0));
  const rootRef = useRef(null);
  const rateRef = useRef(1);
  // Slot (strand a, position k): k/S of the way along. Order of leaving the centre: pair by pair, A before B.
  const unitOf = (a, k) => {
    const g = passes[a * S + k] * 2 * S + 2 * (S - 1 - k) + a;
    return (((g % total) + total) % total) + 1;
  };

  // Scroll → playback rate: each notch adds speed in its direction (capped); the rate eases back to 1.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    let raf = 0;
    let last = 0;
    const apply = () => {
      root.querySelectorAll('.gfl-spiral-unit').forEach((el) => {
        el.getAnimations?.().forEach((a) => { a.playbackRate = rateRef.current; });
      });
    };
    const settle = (now) => {
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 0.016;
      last = now;
      rateRef.current += (1 - rateRef.current) * (1 - Math.exp(-dt / 0.6));
      if (Math.abs(rateRef.current - 1) < 0.02) {
        rateRef.current = 1;
        apply();
        raf = 0;
        last = 0;
        return;
      }
      apply();
      raf = requestAnimationFrame(settle);
    };
    const onWheel = (e) => {
      e.preventDefault();
      e.stopPropagation(); // neither the map nor the docked wheel's own handler sees it
      const notch = Math.max(-1, Math.min(1, e.deltaY / 100)) || Math.sign(e.deltaY);
      rateRef.current = Math.max(-12, Math.min(12, rateRef.current + notch * 3));
      apply();
      if (!raf) raf = requestAnimationFrame(settle);
    };
    root.addEventListener('wheel', onWheel, { passive: false });
    return () => { root.removeEventListener('wheel', onWheel); if (raf) cancelAnimationFrame(raf); };
  }, []);

  return (
    <div ref={rootRef} className="gfl-spiral absolute inset-0">
      <style>{`
        ${strandKeyframes('gflStrandA', ends[0], rMin, rMax)}
        ${strandKeyframes('gflStrandB', ends[1], rMin, rMax)}
      `}</style>
      {[0, 1].flatMap((a) => Array.from({ length: S }, (_, k) => {
        const n = unitOf(a, k);
        const picked = pickedUnit === n;
        const match = isMatch ? isMatch(n) : null; // null: no search running
        const slot = a * S + k;
        return (
          <div
            key={slot}
            className="gfl-spiral-unit absolute top-1/2 left-1/2 w-0 h-0"
            style={{
              animation: `${a ? 'gflStrandB' : 'gflStrandA'} ${passS}s linear infinite`,
              animationDelay: `${-(SPIRAL_HEAD_START_S + k * spacingS)}s`,
            }}
            onAnimationIteration={() => setPasses((p) => p.map((v, i) => (i === slot ? v + (rateRef.current < 0 ? -1 : 1) : v)))}
          >
            <div style={{ position: 'absolute', top: -unitSize / 2, left: -unitSize / 2, width: unitSize, height: unitSize }}>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onPick?.(n); }}
                aria-label={`${t({ nl: 'Eenheid', en: 'Unit' })} ${unitLabel(n)}`}
                className="w-full h-full flex flex-col items-center justify-center"
                style={{
                  ...UNIT_FRAME,
                  opacity: picked ? 1 : match === false ? 0.25 : 0.85,
                  filter: picked || match === true ? 'none' : 'grayscale(100%)',
                  cursor: 'pointer',
                  transition: 'opacity 300ms, filter 300ms',
                }}
              >
                {logoOf(n) ? (
                  <>
                    <img src={logoOf(n)} alt="" className="object-contain" style={{ width: '62%', height: '62%', backgroundColor: 'transparent' }} />
                    <span style={{ fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif", fontWeight: 'bold', fontSize: labelSize, color: 'rgba(255, 254, 240, 0.8)', lineHeight: 1 }}>
                      {unitLabel(n)}
                    </span>
                  </>
                ) : (
                  // A filler: its number, centred in the frame (owner, 14 Oct), instead of a placeholder image.
                  <span style={{ fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif", fontWeight: 'bold', fontSize: `max(${labelSize}, ${Math.round(unitSize * 0.3)}px)`, color: 'rgba(255, 254, 240, 0.85)', lineHeight: 1, letterSpacing: '0.05em' }}>
                    {unitLabel(n)}
                  </span>
                )}
              </button>
            </div>
          </div>
        );
      }))}
    </div>
  );
};

/**
 * NavWheel - Rotating navigation wheel for brand selection
 * `overview`: the whole wheel centred on screen, every unit equal (clicking one shows it in the preview card,
 * `onPreview`); otherwise docked at the bottom with the active unit lifted. The move between them animates.
 */
const NavWheel = ({ brands, virtualIndex, onUpdateIndex, onBack, locked = false, overview = false, previewIndex = 0, previewUnit = 1, ringTopUnit = 1, previewPicked = false, onPreview, animate = false, onFoldBack, matches = null }) => {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const wheelRef = useRef(null);
  const [vpW, setVpW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1440);
  const [vpH, setVpH] = useState(typeof window !== 'undefined' ? window.innerHeight : 900);

  // Viewport resize listener
  useEffect(() => {
    const onVpResize = () => { setVpW(window.innerWidth); setVpH(window.innerHeight); };
    window.addEventListener('resize', onVpResize);
    return () => window.removeEventListener('resize', onVpResize);
  }, []);

  // Wheel Configuration - dynamically sized from viewport
  const wheelSize = Math.min(1200, Math.round(vpW * 0.92));
  const placementRadius = (wheelSize / 2) * 0.85;
  const visibleWheelH = Math.max(145, Math.round(vpH * 0.187));
  const bottomOffset = -(wheelSize - visibleWheelH);
  const hubSize = Math.max(56, Math.min(74, Math.round(vpW * 0.052)));
  const hubBottom = -Math.round(hubSize * 0.22);
  const sideBottom = Math.max(12, Math.round(hubSize * 0.24));
  const hubHalf = Math.round(hubSize / 2);
  const sideOffset = Math.min(130, Math.round(hubHalf + Math.max(75, vpW * 0.058)));
  const sideOffsetRight = Math.min(142, Math.round(hubHalf + Math.max(82, vpW * 0.063)));
  const listHeight = Math.max(240, Math.round(vpH * 0.30));
  const cardWidth = Math.max(130, Math.round(vpW * 0.109));
  const logoSize = Math.max(58, Math.round(wheelSize * 0.0963));

  // Overview: the docked wheel, moved and scaled so its whole disc stands centred on the screen; the hub button
  // sits in its middle. The move animates both ways when a click asks for it (`animate`: Bekijk, OMHOOG); on
  // arrival by pan it snaps.
  const ov = overviewGeometry(vpW, vpH);
  const dockedCenterY = vpH - visibleWheelH + wheelSize / 2;
  const wheelTransform = overview
    ? `translateX(-50%) translateY(${ov.centerY - dockedCenterY}px) scale(${ov.size / wheelSize})`
    : 'translateX(-50%)';
  const hubShift = overview ? ov.centerY - (vpH - hubBottom - hubSize / 2) : 0;
  const moveTransition = !animate || reducedMotion() ? null : `transform ${UNFOLD_MS}ms ${UNFOLD_EASE}`;
  const withMove = (rest) => [moveTransition, rest].filter(Boolean).join(', ');

  // Calculate continuous rotation
  const rotation = -virtualIndex * (360 / brands.length);
  
  // Handle direct click (shortest path logic)
  // Gardens ring numbering: the unit at slot i, counted from the unit at the top (ringTopUnit), wrapping at UNIT_TOTAL.
  const ringUnitOf = (i) => {
    const top = ((virtualIndex % brands.length) + brands.length) % brands.length;
    const off = ((((i - top) % brands.length) + brands.length + brands.length / 2) % brands.length) - brands.length / 2;
    return ((((ringTopUnit - 1 + off) % UNIT_TOTAL) + UNIT_TOTAL) % UNIT_TOTAL) + 1;
  };

  const handleItemClick = (targetIndex) => {
    if (locked && !onFoldBack) return;
    // Gardens: a click selects that unit (the sectors switch to it) and turns it to the top. Turning alone never selects.
    if (locked) onPreview?.(ringUnitOf(targetIndex));
    const currentMod = ((virtualIndex % brands.length) + brands.length) % brands.length;
    let diff = targetIndex - currentMod;
    if (diff > 6) diff -= 12;
    if (diff < -6) diff += 12;
    onUpdateIndex(virtualIndex + diff);
  };

  // The expanded list is a horizontal strip: the mouse wheel scrolls it sideways (owner, 14 Oct — before, only
  // the scrollbar moved it). The event stops here, so the app's own wheel handling never sees it.
  const listRef = useRef(null);
  useEffect(() => {
    const el = listRef.current;
    if (!el) return undefined;
    const onListWheel = (e) => {
      if (el.scrollWidth <= el.clientWidth) return;
      const d = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      const px = e.deltaMode === 1 ? d * 40 : e.deltaMode === 2 ? d * el.clientWidth : d; // lines / pages → px
      e.preventDefault();
      e.stopPropagation();
      el.scrollLeft += px;
    };
    el.addEventListener('wheel', onListWheel, { passive: false });
    return () => el.removeEventListener('wheel', onListWheel);
  }, []);

  // Scoped Wheel Event Listener
  useEffect(() => {
    const handleWheel = (e) => {
      e.preventDefault();
      const direction = e.deltaY > 0 ? 1 : -1;
      onUpdateIndex(virtualIndex + direction);
    };

    const el = wheelRef.current;
    if (el) {
      el.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      if (el) el.removeEventListener('wheel', handleWheel);
    };
  }, [virtualIndex, onUpdateIndex, locked]);

  return (
    <>
      {/* EXPANDED LIST VIEW OVERLAY */}
      <div
        ref={listRef}
        className={`fixed inset-x-0 bottom-0 z-50 p-8 pt-12 flex items-center overflow-x-auto gap-4 transition-all duration-500 backdrop-blur-xl border-t ${isExpanded ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`}
        style={{ 
          height: `${listHeight}px`,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          borderColor: 'rgba(255, 174, 0, 0.5)'
        }}
      >
        {locked
          ? Array.from({ length: 99 }, (_, i) => (
            <div
              key={`placeholder-${i}`}
              className="flex-shrink-0 h-full border rounded relative overflow-hidden flex items-end p-2"
              style={{
                width: `${cardWidth}px`,
                borderColor: 'rgba(255, 255, 255, 0.08)',
                backgroundColor: 'rgba(255, 255, 255, 0.03)'
              }}
            >
              <span style={{ fontFamily: 'monospace', fontSize: FONT_MIN, color: 'rgba(255,255,255,0.15)', userSelect: 'none' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
            </div>
          ))
          : brands.map((brand, i) => (
          <button 
            key={brand.id}
            onClick={() => { handleItemClick(i); setIsExpanded(false); }}
            className="flex-shrink-0 h-full border rounded relative group overflow-hidden text-left transition-all duration-300"
            style={{
              width: `${cardWidth}px`,
              borderColor: i === ((virtualIndex % brands.length) + brands.length) % brands.length 
                ? '#ffae00' 
                : 'rgba(255, 255, 255, 0.1)',
              backgroundColor: i === ((virtualIndex % brands.length) + brands.length) % brands.length 
                ? 'rgba(255, 174, 0, 0.1)' 
                : 'rgba(255, 255, 255, 0.05)'
            }}
          >
            <img src={brand.heroImageUrl} className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-50 transition-opacity" alt="" />
            <div className="absolute inset-0 p-4 flex flex-col">
              <span className="text-xl font-mono font-bold text-white/20">{brand.id}</span>
              <div className="mt-auto">
                <div className="text-sm uppercase tracking-wider" style={{ color: '#ffae00', fontSize: FONT_MIN }}>{t({ nl: 'Eenheid', en: 'Unit' })} {brand.id}</div>
                <div className="text-sm font-bold text-white truncate">{t(brand.name)}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
      {/* Close — fixed to the screen at the bar's top-right corner, outside the scrolling strip, so it stays in
          reach wherever the list is scrolled (owner, 14 Oct). */}
      <button
        onClick={() => setIsExpanded(false)}
        aria-label={t({ nl: 'Sluiten', en: 'Close' })}
        className={`fixed z-[51] text-white/50 hover:text-amber-400 transition-opacity duration-500 ${isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ right: '1rem', bottom: `${listHeight - 40}px` }}
      >
        <X />
      </button>

      {/* ROTATING WHEEL CONTAINER - Perfectly centered */}
      <div 
        ref={wheelRef}
        className={`fixed z-40 pointer-events-auto transition-opacity duration-300 ${isExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        style={{
          width: `${wheelSize}px`,
          height: `${wheelSize}px`,
          bottom: `${bottomOffset}px`,
          left: '50%',
          transform: wheelTransform,
          transition: withMove('opacity 300ms'),
        }}
      >
        {/* Main Background & Outer Static Orange Border - Semi-transparent */}
        <div 
          className="absolute inset-0 rounded-full backdrop-blur-sm pointer-events-none"
          style={{ 
            border: '2px solid rgba(255, 174, 0, 0.6)',
            backgroundColor: 'rgba(0, 0, 0, 0.6)'
          }}
        ></div>

        {/* Intermittent Purple Border (Close Inside) - Semi-transparent */}
        <div 
          className="absolute inset-2 rounded-full border-2 border-dashed pointer-events-none"
          style={{ 
            borderColor: 'rgba(188, 19, 254, 0.25)',
            animation: 'spin 60s linear infinite'
          }}
        ></div>

        {/* Faint Inner Ring */}
        <div className="absolute inset-6 rounded-full border border-white/5 pointer-events-none"></div>

        {/* Rotating Ring Container */}
        <div 
          className="absolute inset-0 rounded-full transition-transform duration-500"
          style={{ 
            transform: `rotate(${rotation}deg)`,
            transitionTimingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1)'
          }}
        >
          {brands.map((brand, i) => {
            const angle = i * (360 / brands.length);
            const currentIndex = ((virtualIndex % brands.length) + brands.length) % brands.length;
            const isActive = i === currentIndex;

            // Overview: the units run in the spiral stream below, not on this ring.
            if (overview) return null;

            // When locked (Gardens), the ring shows the stream's units around the picked one: the active slot is
            // the picked unit, each slot beside it the next or previous number (wrapping at UNIT_TOTAL). A filler
            // shows its number centred, a real brand its logo (owner, 14 Oct; it used to be the same template
            // image everywhere).
            const ringUnit = ringUnitOf(i);
            const ringSelected = Boolean(onFoldBack) && ringUnit === previewUnit; // marked wherever it has turned to
            const ringFace = isFillerUnit(ringUnit)
              ? (
                <span style={{ fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif", fontWeight: 'bold', fontSize: `max(${FONT_MIN}, ${Math.round(logoSize * 0.3)}px)`, color: 'rgba(255, 254, 240, 0.85)', lineHeight: 1, letterSpacing: '0.05em' }}>
                  {unitLabel(ringUnit)}
                </span>
              )
              : <img src={brands[unitBrandIndex(ringUnit)].logoUrl} className="w-full h-full object-contain" alt="" style={{ backgroundColor: 'transparent' }} />;

            if (locked && !isActive) {
              return (
                <div
                  key={`placeholder-${i}`}
                  className="absolute top-1/2 left-1/2 w-0 h-0"
                  style={{ transform: `rotate(${angle}deg) translateY(-${placementRadius}px)` }}
                >
                  <div
                    onClick={onFoldBack ? (e) => { e.stopPropagation(); handleItemClick(i); } : undefined}
                    style={{ position: 'absolute', top: -(logoSize / 2), left: -(logoSize / 2), width: logoSize, height: logoSize, cursor: onFoldBack ? 'pointer' : undefined }}
                  >
                    <div
                      className="w-full h-full flex items-center justify-center rounded-full"
                      style={{
                        transform: `rotate(${-angle - rotation}deg)`,
                        opacity: ringSelected ? 1 : 0.6,
                        filter: ringSelected ? 'none' : 'grayscale(100%)',
                        ...UNIT_FRAME,
                        ...(ringSelected ? { border: '1.5px solid rgba(255, 174, 0, 0.8)', boxShadow: '0 0 18px rgba(255, 174, 0, 0.55)' } : {}),
                      }}
                    >
                      {ringFace}
                    </div>
                  </div>
                </div>
              );
            }
            
            // All logos render at uniform size/position
            const logoScale = 1;
            const wrapperTranslate = 0;

            return (
              <div 
                key={brand.id}
                className="absolute top-1/2 left-1/2 w-0 h-0"
                style={{ 
                  transform: `rotate(${angle}deg) translateY(-${placementRadius}px)`
                }}
              >
                <div style={{ position: 'absolute', top: -(logoSize / 2), left: -(logoSize / 2), width: logoSize, height: logoSize }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleItemClick(i); }}
                    className={`w-full h-full flex items-center justify-center transition-all duration-300 relative border-0`}
                    style={{ 
                      border: 'none',
                      borderRadius: '50%',
                      backgroundColor: 'transparent',
                      // Gardens: the amber glow marks the selected unit only (the top is just where the ring stands)
                      boxShadow: isActive && (!onFoldBack || ringSelected) ? '0 0 20px rgba(255, 174, 0, 0.8)' : 'none',
                      opacity: isActive ? 1 : 0.5,
                      filter: isActive ? 'none' : 'grayscale(100%)',
                      transform: `rotate(${-angle - rotation}deg) scale(${isActive ? 1.2 : 1})`,
                      zIndex: isActive ? 10 : 1,
                      overflow: 'visible'
                    }}
                  >
                    <div 
                      className="w-full h-full flex items-center justify-center rounded-full"
                      style={{ 
                        transform: `scale(${logoScale}) translateY(${wrapperTranslate}px)`,
                        transformOrigin: 'center',
                        overflow: 'hidden'
                      }}
                    >
                      {locked ? ringFace : <img src={brand.logoUrl} alt={brand.id} className="w-full h-full object-contain" style={{ backgroundColor: 'transparent' }} />}
                    </div>
                    {isActive && (
                      <div
                        className="absolute top-0.5 left-1/2 -translate-x-1/2 z-10 px-2 py-0.5 text-sm font-mono whitespace-nowrap rounded pointer-events-none"
                        style={{
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          border: '1px solid rgba(255, 174, 0, 0.5)',
                          color: '#ffae00',
                          fontSize: FONT_MIN
                        }}
                      >
                        {t({ nl: 'EENHEID', en: 'UNIT' })} {locked ? unitLabel(ringTopUnit) : brand.id}
                      </div>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Overview: the endless spiral stream of units (see SpiralStream). */}
        {overview && (
          <>
            <SpiralStream
              rMin={Math.round(wheelSize * SPIRAL.rMin)}
              rMax={Math.round(wheelSize * SPIRAL.rMax)}
              unitSize={Math.round(wheelSize * SPIRAL.unit)}
              labelSize={`${Math.ceil(14 / (ov.size / wheelSize))}px`}
              total={UNIT_TOTAL}
              logoOf={(n) => (isFillerUnit(n) ? null : brands[unitBrandIndex(n)].logoUrl)}
              pickedUnit={previewPicked ? previewUnit : null}
              isMatch={matches ? (n) => matches.has(unitBrandIndex(n)) : null}
              onPick={onPreview}
            />
          </>
        )}
      </div>

      {/* RETURN BUTTON - Left side of hub button. Hidden when the wheel is locked (e.g. Gardens):
          the global nav "← Terug" handles going back there. */}
      {!locked && (
        <button
          onClick={() => onBack()}
          className={`fixed z-50 flex items-center justify-center transition-all duration-300 border-0 outline-none gap-2 ${isExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          style={{
            backgroundColor: 'transparent',
            bottom: `${sideBottom}px`,
            left: `calc(50% - ${sideOffset}px)`,
            color: '#ffae00',
            fontSize: FONT_MIN,
            fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
            fontWeight: 'bold',
            letterSpacing: '0.1em'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#ffc955';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#ffae00';
          }}
          title={t('brands.backTitle')}
        >
          <ChevronLeft size={16} />
          <span>{t('brands.back')}</span>
        </button>
      )}

      {/* With an overview to return to (Gardens, owner 14 Oct): no OMHOOG and no orange hub — one plain "MENU ↑"
          under the docked wheel folds the sectors back and raises the wheel. Hidden in the overview itself. */}
      {onFoldBack && (
        <button
          type="button"
          onClick={() => onFoldBack()}
          className={`fixed z-50 flex items-center justify-center gap-2 border-0 outline-none transition-opacity duration-300 ${overview ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          style={{
            backgroundColor: 'transparent',
            bottom: `${sideBottom}px`,
            left: '50%',
            transform: 'translateX(-50%)',
            color: '#ffae00',
            fontSize: FONT_MIN,
            fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#ffc955'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#ffae00'; }}
        >
          <span>{t({ nl: 'Menu', en: 'Menu' })}</span>
          <ChevronUp size={16} />
        </button>
      )}

      {!onFoldBack && (<>
      {/* SCROLL BUTTON - Right side of hub button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed z-50 flex items-center justify-center transition-all duration-300 border-0 outline-none gap-2 ${isExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        style={{
          backgroundColor: 'transparent',
          bottom: `${sideBottom}px`,
          right: `calc(50% - ${sideOffsetRight}px)`,
          color: '#ffae00',
          fontSize: FONT_MIN,
          fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
          fontWeight: 'bold',
          letterSpacing: '0.1em'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#ffc955';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#ffae00';
        }}
        title={t({ nl: 'Naar boven', en: 'Scroll to top' })}
      >
        <span>{t({ nl: 'OMHOOG', en: 'SCROLL' })}</span>
        <ChevronUp size={16} />
      </button>

      {/* STATIC HUB BUTTON - Simple centered orange button, no rings, no border */}
      <button
        onClick={() => setIsExpanded(true)}
        className={`fixed z-50 rounded-full flex items-center justify-center transition-all duration-300 border-0 outline-none ${isExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        style={{
          width: `${hubSize}px`,
          height: `${hubSize}px`,
          backgroundColor: '#ffae00',
          boxShadow: '0 0 30px rgba(255, 174, 0, 0.5)',
          bottom: `${hubBottom}px`,
          left: '50%',
          // Overview: in the middle of the centred wheel; it travels down with it on Bekijk.
          transform: `translateX(-50%) translateY(${hubShift}px)`,
          transition: withMove('box-shadow 300ms, opacity 300ms'),
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 0 50px rgba(255, 174, 0, 0.7)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 0 30px rgba(255, 174, 0, 0.5)';
        }}
      >
        <List size={Math.max(24, Math.round(hubSize * 0.43))} className="text-black" />
      </button>
      </>)}
    </>
  );
};

/**
 * Slideshow - Media gallery with image/video support
 */
const Slideshow = ({ items }) => {
  const { t } = useLanguage();
  const [idx, setIdx] = useState(0);
  const next = () => setIdx(prev => (prev + 1) % items.length);
  const prev = () => setIdx(prev => (prev - 1 + items.length) % items.length);
  
  const currentItem = items[idx];

  return (
    <div className="relative w-full h-full group overflow-hidden bg-black rounded-sm">
      {currentItem.type === 'video' ? (
        <video 
          src={t(currentItem.urlI18n) || currentItem.url} 
          className="w-full h-full object-cover opacity-80 transition-opacity duration-500"
          autoPlay
          loop
          muted
          playsInline
        />
      ) : (
        <img
          src={t(currentItem.urlI18n) || currentItem.url}
          alt={t(currentItem.title)}
          className="w-full h-full object-cover opacity-80 transition-opacity duration-500"
        />
      )}
      
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90 pointer-events-none"></div>
      
      <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
        <div className="flex justify-between items-end mb-2">
          <div 
            className="text-sm font-mono uppercase mb-1"
            style={{ color: '#ffae00', fontSize: FONT_MIN }}
          >
            Live Feed // {currentItem.type === 'video' ? 'VID' : 'IMG'}
          </div>
          <div className="flex gap-1">
            {items.map((_, i) => (
              <div 
                key={i} 
                className="h-1 w-4 rounded-full transition-colors"
                style={{ backgroundColor: i === idx ? '#ffae00' : 'rgba(255, 255, 255, 0.2)' }}
              ></div>
            ))}
          </div>
        </div>
        <div className="text-sm font-bold text-white uppercase tracking-wider">{t(currentItem.title)}</div>
      </div>

      <button 
        onClick={prev} 
        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-white/50 hover:text-amber-400 transition-colors pointer-events-auto"
        style={{ backgroundColor: 'transparent' }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 174, 0, 0.1)'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <ChevronLeft/>
      </button>
      <button 
        onClick={next} 
        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white/50 hover:text-amber-400 transition-colors pointer-events-auto"
        style={{ backgroundColor: 'transparent' }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 174, 0, 0.1)'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <ChevronRight/>
      </button>
    </div>
  );
};

// ── Unit search (Gardens overview, right of the wheel; owner 14 Oct) ─────────────────────────────────────────
// A search bar over every field (names included), and three filters, each with its own drop-down: Niche (every
// niche branch, with its own search), Locatie (country | municipality, with its own search) and Kosten (a range
// lever plus a min and max field). Filters AND together; within one filter
// any choice matches. Matches are listed and lit on the wheel. An empty slot (isTemplate) is never listed or
// matched: its texts are placeholders.
export const EMPTY_FILTERS = Object.freeze({ niches: [], countries: [], municipalities: [], price: [PRICE.min, PRICE.max] });

const priceActive = (p) => p[0] > PRICE.min || p[1] < PRICE.max;
const filtersActive = (f) => f.niches.length || f.countries.length || f.municipalities.length || priceActive(f.price);
const ownText = (v) => (typeof v === 'string' ? v : '');
const nicheLabel = (key, t) => { const n = NICHES.find((x) => x.key === key); return n ? t({ nl: n.nl, en: n.en }) : ''; };
const countryLabel = (code, t) => { const c = COUNTRIES.find((x) => x.code === code); return c ? t({ nl: c.nl, en: c.en }) : ''; };

/** Indices of the brands that pass the query and the filters, or null when nothing is being searched. */
export const searchMatches = (brands, query, filters, t) => {
  const q = query.trim().toLowerCase();
  if (!q && !filtersActive(filters)) return null;
  const [pMin, pMax] = filters.price;
  return new Set(brands.flatMap((b, i) => {
    if (b.isTemplate) return [];
    if (filters.niches.length && !filters.niches.includes(b.niche)) return [];
    if (filters.countries.length && !filters.countries.includes(b.country)) return [];
    if (filters.municipalities.length && !filters.municipalities.includes(b.municipality)) return [];
    if (priceActive(filters.price)) {
      if (!b.price) return [];
      const top = pMax >= PRICE.max ? Infinity : pMax; // the top of the lever means "and up"
      if (b.price.max < pMin || b.price.min > top) return [];
    }
    if (q) {
      const hay = [t(b.name), nicheLabel(b.niche, t), countryLabel(b.country, t), ownText(b.municipality)]
        .concat(Array.isArray(b.tags) ? b.tags.map((x) => t(x)) : [])
        .join(' ').toLowerCase();
      if (!hay.includes(q)) return [];
    }
    return [i];
  }));
};

const CHROME = { fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif", fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: FONT_MIN };
const BODY = { fontFamily: "'Figtree', sans-serif", fontSize: FONT_MIN, color: '#FFFEF0' };

/** A text field in the house style: amber focus border, 0.04 fill, 15px glow. */
const SearchField = ({ value, onChange, placeholder, label, autoFocus = false }) => {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type="search"
      value={value}
      autoFocus={autoFocus}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder={placeholder}
      aria-label={label || placeholder}
      style={{
        ...BODY,
        width: '100%',
        padding: '0.5rem 0.7rem',
        borderRadius: '0.15rem',
        outline: 'none',
        border: `1px solid ${focused ? 'rgba(255, 174, 0, 0.5)' : 'rgba(255, 255, 255, 0.15)'}`,
        background: focused ? 'rgba(255, 174, 0, 0.04)' : 'rgba(2, 0, 3, 0.3)',
        boxShadow: focused ? '0 0 15px rgba(255, 174, 0, 0.25)' : 'none',
        transition: 'border-color 0.2s, background 0.2s, box-shadow 0.2s',
      }}
    />
  );
};

/** A list the mouse wheel scrolls by itself (the map never pans under it). */
const ScrollList = ({ children, className = '', style }) => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const stop = (e) => e.stopPropagation();
    el.addEventListener('wheel', stop, { passive: true });
    return () => el.removeEventListener('wheel', stop);
  }, []);
  return <div ref={ref} className={`overflow-y-auto ${className}`} style={{ minHeight: 0, ...style }}>{children}</div>;
};

/** One selectable row: a square check in the accent, then the label. */
const CheckRow = ({ on, onClick, children }) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={on}
    onClick={onClick}
    className="flex items-center gap-2 w-full text-left hover:bg-white/5"
    style={{ ...BODY, padding: '0.3rem 0.4rem', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '0.15rem' }}
  >
    <span style={{ width: '0.85rem', height: '0.85rem', flexShrink: 0, borderRadius: '0.15rem', border: `1px solid ${on ? '#ffae00' : 'rgba(255, 174, 0, 0.45)'}`, backgroundColor: on ? '#ffae00' : 'transparent', boxShadow: on ? '0 0 10px rgba(255, 174, 0, 0.45)' : 'none' }} />
    <span className="truncate">{children}</span>
  </button>
);

const toggleIn = (list, v) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
const euro = (n) => `€${n.toLocaleString('nl-NL')}`;

const UnitSearch = ({ brands, query, onQuery, filters, onFilters, matches, onPick, height }) => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(null); // 'niche' | 'location' | 'cost' | null
  const [inner, setInner] = useState(''); // the open drop-down's own search
  useEffect(() => { setInner(''); }, [open]);
  const set = (patch) => onFilters({ ...filters, ...patch });
  const has = (s) => s.toLowerCase().includes(inner.trim().toLowerCase());

  // What each filter can offer: every niche and country; the municipalities brands actually have.
  const real = brands.filter((b) => !b.isTemplate);
  const municipalities = [...new Set(real.map((b) => ownText(b.municipality)).filter(Boolean))].sort();

  const count = { niche: filters.niches.length, location: filters.countries.length + filters.municipalities.length };
  const chips = [
    { key: 'niche', label: t({ nl: 'Niche', en: 'Niche' }), badge: count.niche || null },
    { key: 'location', label: t({ nl: 'Locatie', en: 'Location' }), badge: count.location || null },
    { key: 'cost', label: t({ nl: 'Kosten', en: 'Cost' }), badge: priceActive(filters.price) ? `${euro(filters.price[0])}–${filters.price[1] >= PRICE.max ? `${euro(PRICE.max)}+` : euro(filters.price[1])}` : null },
  ];
  const clear = { niche: () => set({ niches: [] }), location: () => set({ countries: [], municipalities: [] }), cost: () => set({ price: [PRICE.min, PRICE.max] }) };
  const results = matches ? [...matches] : [];
  const heading = (txt) => <span style={{ ...CHROME, color: 'rgba(255, 174, 0, 0.75)' }}>{txt}</span>;
  const empty = (txt) => <p style={{ ...BODY, color: 'rgba(255, 254, 240, 0.55)', margin: '0.3rem 0.4rem' }}>{txt}</p>;

  const dropdown = () => {
    if (open === 'cost') {
      const [lo, hi] = filters.price;
      const setLo = (v) => set({ price: [Math.max(PRICE.min, Math.min(Number(v) || 0, hi)), hi] });
      const setHi = (v) => set({ price: [lo, Math.min(PRICE.max, Math.max(Number(v) || 0, lo))] });
      const pct = (v) => ((v - PRICE.min) / (PRICE.max - PRICE.min)) * 100;
      const numberField = (value, onChange, label) => (
        <label className="flex flex-col gap-1 flex-1">
          {heading(label)}
          <input
            type="number" min={PRICE.min} max={PRICE.max} step={PRICE.step} value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{ ...BODY, width: '100%', padding: '0.45rem 0.6rem', borderRadius: '0.15rem', outline: 'none', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(2, 0, 3, 0.3)' }}
          />
        </label>
      );
      return (
        <div className="flex flex-col gap-4" style={{ padding: '0.25rem 0.2rem' }}>
          {/* The lever: two thumbs on one track (the higher thumb on top while it sits right of the lower one). */}
          <div className="gfl-range" style={{ position: 'relative', height: '1.6rem' }}>
            <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 4, marginTop: -2, borderRadius: 2, background: 'rgba(255, 255, 255, 0.12)' }} />
            <div style={{ position: 'absolute', left: `${pct(lo)}%`, right: `${100 - pct(hi)}%`, top: '50%', height: 4, marginTop: -2, borderRadius: 2, background: '#ffae00', boxShadow: '0 0 10px rgba(255, 174, 0, 0.5)' }} />
            <input type="range" min={PRICE.min} max={PRICE.max} step={PRICE.step} value={lo} onChange={(e) => setLo(e.target.value)} aria-label={t({ nl: 'Minimum', en: 'Minimum' })}
              style={{ zIndex: lo > PRICE.max * 0.9 ? 3 : 1 }} />
            <input type="range" min={PRICE.min} max={PRICE.max} step={PRICE.step} value={hi} onChange={(e) => setHi(e.target.value)} aria-label={t({ nl: 'Maximum', en: 'Maximum' })} />
          </div>
          <div className="flex gap-3">
            {numberField(lo, setLo, t({ nl: 'Min (€)', en: 'Min (€)' }))}
            {numberField(hi, setHi, t({ nl: 'Max (€)', en: 'Max (€)' }))}
          </div>
          <span style={{ ...BODY, color: 'rgba(255, 254, 240, 0.6)' }}>
            {euro(lo)} – {hi >= PRICE.max ? `${euro(PRICE.max)}+` : euro(hi)}
          </span>
        </div>
      );
    }
    const searchBox = (
      <SearchField value={inner} onChange={setInner} autoFocus
        placeholder={t(open === 'niche' ? { nl: 'Zoek een niche…', en: 'Search a niche…' } : { nl: 'Zoek een land of gemeente…', en: 'Search a country or municipality…' })} />
    );
    if (open === 'niche') {
      const list = NICHES.filter((n) => has(t({ nl: n.nl, en: n.en })));
      return (
        <div className="flex flex-col gap-2 min-h-0 flex-1">
          {searchBox}
          <ScrollList className="flex-1">
            {list.length ? list.map((n) => (
              <CheckRow key={n.key} on={filters.niches.includes(n.key)} onClick={() => set({ niches: toggleIn(filters.niches, n.key) })}>{t({ nl: n.nl, en: n.en })}</CheckRow>
            )) : empty(t({ nl: 'Geen niche gevonden.', en: 'No niche found.' }))}
          </ScrollList>
        </div>
      );
    }
    if (open === 'location') {
      const countries = COUNTRIES.filter((c) => has(t({ nl: c.nl, en: c.en })));
      const munis = municipalities.filter(has);
      return (
        <div className="flex flex-col gap-2 min-h-0 flex-1">
          {searchBox}
          <div className="grid grid-cols-2 gap-3 min-h-0 flex-1">
            <div className="flex flex-col gap-1 min-h-0">
              {heading(t({ nl: 'Land', en: 'Country' }))}
              <ScrollList className="flex-1">
                {countries.length ? countries.map((c) => (
                  <CheckRow key={c.code} on={filters.countries.includes(c.code)} onClick={() => set({ countries: toggleIn(filters.countries, c.code) })}>{t({ nl: c.nl, en: c.en })}</CheckRow>
                )) : empty(t({ nl: 'Geen land gevonden.', en: 'No country found.' }))}
              </ScrollList>
            </div>
            <div className="flex flex-col gap-1 min-h-0">
              {heading(t({ nl: 'Gemeente', en: 'Municipality' }))}
              <ScrollList className="flex-1">
                {munis.length ? munis.map((m) => (
                  <CheckRow key={m} on={filters.municipalities.includes(m)} onClick={() => set({ municipalities: toggleIn(filters.municipalities, m) })}>{m}</CheckRow>
                )) : empty(municipalities.length
                  ? t({ nl: 'Geen gemeente gevonden.', en: 'No municipality found.' })
                  : t({ nl: 'Gemeenten verschijnen zodra merken hun locatie invullen.', en: 'Municipalities appear once brands fill in their location.' }))}
              </ScrollList>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ height: height || 'auto' }}>
      {/* The cost lever: two range inputs stacked on one track; only their thumbs take the pointer. */}
      <style>{`
        .gfl-range input[type=range] { position: absolute; left: 0; top: 0; width: 100%; height: 100%; margin: 0;
          background: transparent; pointer-events: none; -webkit-appearance: none; appearance: none; }
        .gfl-range input[type=range]::-webkit-slider-runnable-track { background: transparent; }
        .gfl-range input[type=range]::-moz-range-track { background: transparent; }
        .gfl-range input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; pointer-events: auto; width: 16px; height: 16px;
          border-radius: 50%; background: #ffae00; border: 2px solid #0a0510; box-shadow: 0 0 10px rgba(255, 174, 0, 0.6); cursor: pointer; }
        .gfl-range input[type=range]::-moz-range-thumb { pointer-events: auto; width: 16px; height: 16px; border-radius: 50%;
          background: #ffae00; border: 2px solid #0a0510; box-shadow: 0 0 10px rgba(255, 174, 0, 0.6); cursor: pointer; }
        .gfl-range input[type=range]:focus-visible::-webkit-slider-thumb { box-shadow: 0 0 0 3px rgba(255, 174, 0, 0.35), 0 0 15px rgba(255, 174, 0, 0.6); }
      `}</style>
      <SectorFrame>
        <div className="flex flex-col gap-3 min-h-0 h-full">
          <span style={{ ...CHROME, color: '#ffae00', letterSpacing: '0.15em' }}>{t({ nl: 'Zoeken', en: 'Search' })}</span>
          <SearchField value={query} onChange={onQuery} placeholder={t({ nl: 'Zoek een merk…', en: 'Search a brand…' })} />
          {/* The three filter tabs share the line's width equally (owner, 14 Oct). */}
          <div className="flex gap-2">
            {chips.map((c) => {
              const isOpen = open === c.key;
              const lit = isOpen || c.badge;
              return (
                <button
                  key={c.key}
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : c.key)}
                  className="flex flex-1 min-w-0 items-center justify-center gap-1"
                  style={{
                    ...CHROME,
                    padding: '0.3rem 0.6rem',
                    borderRadius: '0.15rem',
                    border: `1px solid ${lit ? '#ffae00' : 'rgba(255, 174, 0, 0.35)'}`,
                    backgroundColor: isOpen ? '#ffae00' : c.badge ? 'rgba(255, 174, 0, 0.15)' : 'rgba(255, 174, 0, 0.06)',
                    color: isOpen ? '#000' : '#ffae00',
                    boxShadow: isOpen ? '0 0 20px rgba(255, 174, 0, 0.45)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                  }}
                >
                  <span className="truncate">{c.label}{c.badge ? ` · ${c.badge}` : ''}</span>
                  <ChevronDown size={14} style={{ flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
                </button>
              );
            })}
          </div>

          {open ? (
            <div className="flex flex-col gap-2 min-h-0 flex-1" style={{ borderTop: '1px solid rgba(255, 174, 0, 0.2)', paddingTop: '0.6rem' }}>
              {dropdown()}
              <div className="flex justify-between">
                <button type="button" onClick={clear[open]} style={{ ...CHROME, color: 'rgba(255, 254, 240, 0.6)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  {t({ nl: 'Wissen', en: 'Clear' })}
                </button>
                <button type="button" onClick={() => setOpen(null)} style={{ ...CHROME, color: '#ffae00', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  {t({ nl: 'Klaar', en: 'Done' })}
                </button>
              </div>
            </div>
          ) : matches ? (
            <div className="flex flex-col gap-2 min-h-0 flex-1">
              <span style={{ ...BODY, color: 'rgba(255, 254, 240, 0.6)' }}>
                {results.length === 1
                  ? t({ nl: '1 eenheid gevonden', en: '1 unit found' })
                  : `${results.length} ${t({ nl: 'eenheden gevonden', en: 'units found' })}`}
              </span>
              <ScrollList className="flex flex-col gap-1 flex-1">
                {results.map((i) => (
                  <button
                    key={brands[i].id}
                    type="button"
                    onClick={() => onPick(i)}
                    className="text-left hover:border-amber-400/50"
                    style={{ ...BODY, padding: '0.45rem 0.6rem', borderRadius: '0.15rem', border: '1px solid rgba(255, 255, 255, 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.03)', cursor: 'pointer' }}
                  >
                    <span style={{ ...CHROME, color: '#ffae00', marginRight: '0.5rem' }}>{brands[i].id}</span>
                    {t(brands[i].name)}
                  </button>
                ))}
              </ScrollList>
            </div>
          ) : (
            <p style={{ ...BODY, color: 'rgba(255, 254, 240, 0.55)', margin: 0 }}>
              {t({ nl: 'Zoek op naam, of kies een filter om merken op het wiel te vinden.', en: 'Search by name, or choose a filter to find brands on the wheel.' })}
            </p>
          )}
        </div>
      </SectorFrame>
    </div>
  );
};

// The stream's units (owner, 14 Oct): unit 1…N are the real brands in order; above N, up to the fewest the
// stream needs (SPIRAL.visible), are fillers showing the template. So the count follows the brands: 30 brands →
// the stream runs 1…30 and starts again; none → just the fillers that keep it endless.
const REAL_BRAND_IDX = BRANDS.flatMap((b, i) => (b.isTemplate ? [] : [i]));
const FILLER_IDX = Math.max(0, BRANDS.findIndex((b) => b.isTemplate));
const UNIT_TOTAL = Math.max(SPIRAL.visible, REAL_BRAND_IDX.length);
const unitBrandIndex = (n) => (n <= REAL_BRAND_IDX.length ? REAL_BRAND_IDX[n - 1] : FILLER_IDX);
const isFillerUnit = (n) => n > REAL_BRAND_IDX.length;
// A unit as it is labelled (owner, 14 Oct): a real brand by its position, a filler by a prime — the first filler
// 02, then 03, 05, 07, 11 … (the k-th filler shows the k-th prime). Only the label: order and stream are unchanged.
const PRIMES = (() => {
  const out = [];
  for (let x = 2; out.length < UNIT_TOTAL; x++) if (out.every((p) => p * p > x || x % p !== 0)) out.push(x);
  return out;
})();
const unitLabel = (n) => String(isFillerUnit(n) ? PRIMES[n - REAL_BRAND_IDX.length - 1] : n).padStart(2, '0');

/**
 * GeneralBrandPage - Main brand detail page component
 * This is the base component for all 12 brand pages
 * Uses same fade transition pattern as FilosofiePage and other pages
 */
const GeneralBrandPage = React.memo(({ 
  isVisible, 
  onBack, 
  initialBrandIndex = 0,
  brandSlug = null, // Optional: can specify brand by slug instead
  hideNavWheel = false, // When true, hides the rotating brand selection wheel
  // Build the page while it is still off-screen. Its content is only created when it becomes visible,
  // and on the platform map that moment is the start of the pan towards it — a ~35 ms React mount and
  // its layout landed inside the pan frames (measured: that pan ran at 101 fps against 175 elsewhere).
  // The caller sets this once the app is idle, so arriving is pure movement (same trick as the
  // pre-mounted kook scene in apps/platform/src/App.jsx).
  warm = false,
  // Open on the overview (whole wheel centred, a preview card left of it) and unfold to the three sectors on
  // "Bekijk" — the Gardens page (owner, 14 Oct). Every arrival starts on the overview again.
  overviewFirst = false,
}) => {
  const { t, language } = useLanguage();
  // Use a virtual index for infinite scrolling
  const [virtualIndex, setVirtualIndex] = useState(1008 + initialBrandIndex);
  const [stage, setStage] = useState(overviewFirst ? 'overview' : 'detail');
  const overview = overviewFirst && stage === 'overview';
  const [previewIndex, setPreviewIndex] = useState(initialBrandIndex);
  const [previewPicked, setPreviewPicked] = useState(false);
  // The unit number (1–99 in the stream); the brand data behind it is BRANDS[(unit − 1) mod BRANDS.length].
  const [previewUnit, setPreviewUnit] = useState(initialBrandIndex + 1);
  const previewUnitNo = (n) => { setPreviewUnit(n); setPreviewIndex(unitBrandIndex(n)); setPreviewPicked(true); };
  // The docked wheel turns through the units (owner, 14 Oct): each step brings the next unit to the top, so the
  // numbers move with the rotation; the unit shown in the sectors stays until another unit is clicked.
  const wrapUnit = (n) => ((((n - 1) % UNIT_TOTAL) + UNIT_TOTAL) % UNIT_TOTAL) + 1;
  const [ringTopUnit, setRingTopUnit] = useState(initialBrandIndex + 1);
  const updateIndex = (v) => {
    // Turning moves the ring only; the shown unit changes on a click (owner, 14 Oct: NavWheel handleItemClick).
    if (overviewFirst && !overview && v !== virtualIndex) setRingTopUnit((u) => wrapUnit(u + (v - virtualIndex)));
    setVirtualIndex(v);
  };
  // Clicks (Bekijk, OMHOOG) animate the change of stage; the reset on arrival by pan snaps.
  const [animate, setAnimate] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilters, setSearchFilters] = useState(EMPTY_FILTERS);
  const [cardHeight, setCardHeight] = useState(null); // the search panel takes the preview card's height
  const [activeTab, setActiveTab] = useState('profile');
  const [showContactModal, setShowContactModal] = useState(false);
  const prevVisibleRef = useRef(false);
  
  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Sync virtualIndex ONLY when page transitions from hidden to visible
  // This captures the brand when user clicks "LEARN MORE" and keeps it static
  useEffect(() => {
    const wasHidden = !prevVisibleRef.current;
    const isNowVisible = isVisible;
    
    // Only sync when transitioning from hidden to visible
    if (wasHidden && isNowVisible) {
      setVirtualIndex(1008 + initialBrandIndex);
      if (overviewFirst) {
        setAnimate(false);
        setStage('overview');
        setPreviewIndex(initialBrandIndex);
        setPreviewUnit(initialBrandIndex + 1);
        setPreviewPicked(false);
      }
    }

    prevVisibleRef.current = isVisible;
  }, [isVisible, initialBrandIndex, overviewFirst]);

  // Calculate actual brand index (0-11)
  // When hideNavWheel (locked/template mode), pin to the previewed unit (initialBrandIndex until one is picked
  // in the overview) so scrolling never swaps out the profile content.
  const activeBrandIndex = hideNavWheel
    ? previewIndex
    : ((virtualIndex % BRANDS.length) + BRANDS.length) % BRANDS.length;
  // A previewed filler unit gets its own analysis wheel (fillerMetrics, seeded by its number), so picking another
  // unit visibly changes the card and the left sector.
  const fillerUnit = overviewFirst && hideNavWheel && isFillerUnit(previewUnit) ? previewUnit : null;
  const brand = React.useMemo(
    () => (fillerUnit ? { ...BRANDS[activeBrandIndex], metrics: fillerMetrics(fillerUnit) } : BRANDS[activeBrandIndex]),
    [activeBrandIndex, fillerUnit],
  );

  // ── The unfold: the sectors are laid out where they end; in the overview each one is drawn at the preview
  // card's rect (mapRect, origin 0 0), so "Bekijk" only has to clear the transforms and OMHOOG to put them back.
  // Measured in either stage on boxes the unfold never transforms: the columns' outer wrappers (minus their
  // padding) and the card's resting place (its fixed wrapper, centred, at the card's untransformed height).
  const previewRef = useRef(null);
  const previewWrapRef = useRef(null);
  const searchWrapRef = useRef(null);
  const colRefs = { left: useRef(null), mid: useRef(null), right: useRef(null) };
  const [fold, setFold] = useState(null);
  const measureFold = useCallback(() => {
    if (!overviewFirst || !previewRef.current || !previewWrapRef.current) return;
    const W = previewWrapRef.current.getBoundingClientRect();
    const h = previewRef.current.offsetHeight; // layout height: transforms do not change it
    if (h) setCardHeight((prev) => (prev === h ? prev : h));
    const P = { left: W.left, top: W.top + (W.height - h) / 2, width: W.width, height: h };
    // The sector sits inside its column's padding: its own box is the column's rect minus that padding.
    const innerRect = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const [pl, pr, pt, pb] = ['paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom'].map((p) => parseFloat(cs[p]) || 0);
      return { left: r.left + pl, top: r.top + pt, width: r.width - pl - pr, height: r.height - pt - pb };
    };
    const rects = Object.fromEntries(Object.entries(colRefs).map(([k, r]) => [k, innerRect(r.current)]));
    if (!P.width || !P.height || Object.values(rects).some((r) => !r || !r.width || !r.height)) return;
    // Where each sector folds to (owner, 14 Oct): left and middle ↔ the preview card (the middle unfolds out of
    // the card beside the left one), right ↔ the search panel (the card's mirror: same height and top).
    const SW = searchWrapRef.current ? searchWrapRef.current.getBoundingClientRect() : null;
    const S = SW ? { left: SW.left, top: P.top, width: SW.width, height: h } : P;
    setFold({
      left: mapRect(rects.left, P),
      mid: mapRect(rects.mid, P),
      right: mapRect(rects.right, S),
      card: mapRect(P, rects.left), // the card grows into the left sector as it fades
      search: mapRect(S, rects.right), // the search panel grows into the right sector as it fades
    });
    // colRefs holds stable refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overviewFirst]);
  useLayoutEffect(() => { measureFold(); }, [measureFold, isVisible, warm, language, activeBrandIndex, stage]);
  useEffect(() => {
    if (!overviewFirst || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => measureFold());
    [previewRef, previewWrapRef, searchWrapRef, ...Object.values(colRefs)].forEach((r) => r.current && ro.observe(r.current));
    window.addEventListener('resize', measureFold);
    return () => { ro.disconnect(); window.removeEventListener('resize', measureFold); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overviewFirst, measureFold, isVisible, warm]);

  const unfold = () => {
    setVirtualIndex(1008 + previewIndex); // the docked wheel lifts the unit that was previewed
    setRingTopUnit(previewUnit);          // …numbered from it
    setAnimate(true);
    setStage('detail');
  };
  // OMHOOG: the sectors fold back into the card and the wheel rises to the centre again.
  const foldBack = () => {
    setAnimate(true);
    setStage('overview');
  };
  const searchMatches_ = searchMatches(BRANDS, searchQuery, searchFilters, t);
  const pickFromSearch = (i) => previewUnitNo(REAL_BRAND_IDX.indexOf(i) + 1); // the search lists real brands only
  const reduced = reducedMotion();
  const stageTransition = (rest) => (animate && !reduced ? `transform ${UNFOLD_MS}ms ${UNFOLD_EASE}, ${rest}` : 'none');
  // Sectors: drawn at the card in the overview (hidden), cleared on Bekijk, put back on OMHOOG.
  const sectorStyle = (key) => (overviewFirst ? {
    width: '100%',
    height: '100%',
    transformOrigin: '0 0',
    transform: overview ? (fold?.[key] || 'none') : 'none',
    opacity: overview ? 0 : 1,
    transition: stageTransition('opacity 350ms ease-out'),
    display: 'flex',
    flexDirection: 'column',
  } : { width: '100%', height: '100%', display: 'flex', flexDirection: 'column' });
  const ovGeom = overviewGeometry(typeof window !== 'undefined' ? window.innerWidth : 1440, typeof window !== 'undefined' ? window.innerHeight : 900);

  // Mobile: Use MobileDetailPage component
  if (isMobile) {
    return (
      <MobileDetailPage 
        isVisible={isVisible}
        onBack={onBack}
        brandIndex={initialBrandIndex}
      />
    );
  }

  // Desktop: Smart rendering - full content when visible, placeholder when hidden
  return (
    <div 
      className="absolute inset-0 font-sans text-white"
      style={{ 
        opacity: 1, // Always in DOM for pre-load
      }}
    >
      {(isVisible || warm) ? (
      <>
      {/* Main Content Area - No back button, logo.png is used as return */}
      <main className="fixed top-[12%] left-[5%] w-[90%] h-[75%] z-10 pointer-events-none">
        <div className={`w-full h-full flex gap-6 relative z-10 ${overview ? 'pointer-events-none' : 'pointer-events-auto'}`}>

          {/* LEFT COLUMN: Identity & Tabs */}
          <div ref={colRefs.left} className="w-1/3 flex flex-col gap-4" style={{ height: '106.25%', transform: 'translateY(calc(max(-7.5rem, -8.5vh) + 14.0625vh)) translateX(-2%)', paddingTop: '0.84rem', paddingBottom: '0.36rem' }}>
            <div style={sectorStyle('left')}><SectorFrame>
              {/* Header */}
              <div className="flex gap-6 mb-6 border-b border-white/10 pb-6">
                <div className="min-w-0 flex flex-col justify-center gap-1">
                  <h2 
                    className="text-3xl font-bold uppercase tracking-wider text-white leading-tight truncate"
                    style={{ fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif" }}
                  >
                    {t(brand.name)}
                  </h2>
                  <div className="flex flex-col gap-1 text-base font-mono mt-1 uppercase tracking-widest" style={{ color: '#ffae00' }}>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} />
                      <span>{typeof brand.origin === 'object' ? t(brand.origin) : brand.origin}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      {/* A placeholder ({ nl, en }) shows the word alone; a real year reads "EST. 1998". */}
                      <span>{typeof brand.foundedYear === 'object' ? t(brand.foundedYear) : `EST. ${brand.foundedYear}`}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-white/10 mb-4 bg-white/5 rounded-t-sm">
                <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} label={t({ nl: 'Profiel', en: 'Profile' })} fontSize={FONT_MIN} icon={<Info size={10} />} />
                <TabButton active={activeTab === 'events'} onClick={() => setActiveTab('events')} label={t({ nl: 'Agenda', en: 'Events' })} fontSize={FONT_MIN} icon={<Calendar size={10} />} />
                <TabButton active={activeTab === 'products'} onClick={() => setActiveTab('products')} label={t({ nl: 'Prod.', en: 'Prods' })} fontSize={FONT_MIN} icon={<ShoppingBag size={10} />} />
                <TabButton active={activeTab === 'reviews'} onClick={() => setActiveTab('reviews')} label={t({ nl: 'Rev.', en: 'Rev' })} fontSize={FONT_MIN} icon={<User size={10} />} />
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto pr-1">
                {activeTab === 'profile' && (
                  <div className="animate-fadeIn">
                    {/* House type (owner, 14 Oct): the label as chrome (Lexend Mega, uppercase, tracked), the
                        description as body copy (Figtree, regular, #FFFEF0) — the thin mono read poorly. */}
                    <p className="text-sm leading-relaxed mb-4" style={{ fontFamily: "'Figtree', sans-serif", fontWeight: 400, color: '#FFFEF0' }}>
                      <span className="text-sm mr-2" style={{ color: '#bc13fe', fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif", fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        {'/// BRIEFING:'}
                      </span>
                      {t(brand.description)}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {brand.tags.map((tag, ti) => <TechBadge key={ti} label={t(tag)} fontSize={FONT_MIN} compact />)}
                    </div>
                  </div>
                )}

                {activeTab === 'events' && (
                  <div className="space-y-3 animate-fadeIn">
                    {brand.events.map(e => (
                      <div 
                        key={e.id} 
                        className="p-3 bg-white/5 border border-white/10 rounded-sm hover:border-amber-400/30 transition-colors cursor-pointer"
                      >
                        <div className="flex justify-between items-center mb-1">
                          <div className="text-sm font-mono" style={{ color: '#ffae00', fontSize: FONT_MIN }}>{t(e.date)}</div>
                          <Activity size={10} style={{ color: '#bc13fe' }} />
                        </div>
                        <div className="font-bold text-sm uppercase text-white/90">{t(e.title)}</div>
                        <div className="text-sm text-white/50" style={{ fontSize: FONT_MIN }}>{t(e.location)}</div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'products' && (
                  <div className="space-y-3 animate-fadeIn">
                    {brand.featuredProducts.map(p => (
                      <div 
                        key={p.id} 
                        className="flex gap-3 p-2 bg-white/5 border border-white/10 rounded-sm items-center hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        {p.image && <img src={p.image} className="w-10 h-10 object-cover opacity-80 rounded-sm" alt="" />}
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm uppercase truncate text-white/90">{t(p.name)}</div>
                          <div className="text-sm font-mono" style={{ color: '#bc13fe', fontSize: FONT_MIN }}>{t(p.price)}</div>
                        </div>
                        <ChevronRight size={12} className="text-white/20" />
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div className="space-y-3 animate-fadeIn">
                    {brand.reviews.map(r => (
                      <div key={r.id} className="p-3 bg-white/5 border border-white/10 rounded-sm">
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-sm font-bold flex items-center gap-1" style={{ color: '#ffae00', fontSize: FONT_MIN }}>
                            <User size={10} /> {r.user}
                          </div>
                          <div className="text-sm flex gap-0.5" style={{ color: '#bc13fe', fontSize: FONT_MIN }}>
                            {Array(r.rating).fill('★').join('')}
                          </div>
                        </div>
                        <div className="text-sm text-white/70 italic border-l-2 border-white/10 pl-2" style={{ fontSize: FONT_MIN }}>
                          "{t(r.comment)}"
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Manifesto Button */}
              <div className="pt-4 mt-auto border-t border-white/5">
                <GlowButton variant="secondary" className="w-full !text-sm !py-2" style={{ fontSize: FONT_MIN }}>
                  {t({ nl: 'Lees het manifest', en: 'Read Manifesto' })}
                </GlowButton>
              </div>
            </SectorFrame></div>
          </div>

          {/* CENTER COLUMN: Visuals & Contact */}
          {/* height 105%→99.75% cuts 5% off the BOTTOM only; marginTop unchanged keeps the top line in place */}
          <div ref={colRefs.mid} className="w-1/3 flex flex-col gap-4" style={{ height: '99.75%', marginTop: '-2.5%' }}>
            <div style={sectorStyle('mid')}><SectorFrame>
              <div 
                className="flex-1 relative group rounded-sm overflow-hidden border border-white/10 bg-black"
                style={{ boxShadow: '0 0 50px rgba(0, 0, 0, 0.8)' }}
              >
                <div className="absolute inset-0">
                  <Slideshow items={brand.gallery} />
                </div>
                <div className="absolute top-2 right-2 z-10">
                  <div 
                    className="text-sm font-mono border px-1 backdrop-blur-sm"
                    style={{ 
                      color: 'rgba(255, 174, 0, 0.5)',
                      borderColor: 'rgba(255, 174, 0, 0.3)',
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      fontSize: FONT_MIN
                    }}
                  >
                    SECTOR {brand.id}
                  </div>
                </div>
              </div>

              {/* Bottom Bar: Contact */}
              <div className="h-20 flex items-center justify-between gap-3 rounded-sm pt-4 border-t border-white/10">
                <div className="flex items-center gap-4 overflow-hidden flex-1">
                  <div 
                    className="w-10 h-10 flex items-center justify-center rounded-full shrink-0"
                    style={{
                      backgroundColor: 'rgba(255, 174, 0, 0.1)',
                      color: '#ffae00',
                      border: '1px solid rgba(255, 174, 0, 0.2)'
                    }}
                  >
                    <Mail size={18} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm text-white/40 font-mono uppercase tracking-wider" style={{ fontSize: FONT_MIN }}>{t({ nl: 'Contact', en: 'Contact' })}</span>
                    <span 
                      className="text-sm font-bold text-white truncate w-full hover:text-amber-400 cursor-pointer transition-colors"
                    >
                      {brand.email}
                    </span>
                  </div>
                </div>
                
                {/* Social Buttons */}
                <div className="flex gap-2">
                  <IconButton 
                    icon={<Globe size={24} />} 
                    variant="green" 
                    onClick={() => setShowContactModal(true)}
                  />
                  <IconButton 
                    icon={<Instagram size={24} />} 
                    variant="green" 
                    onClick={() => setShowContactModal(true)}
                  />
                  <IconButton 
                    icon={<Linkedin size={24} />} 
                    variant="green" 
                    onClick={() => setShowContactModal(true)}
                  />
                </div>
              </div>
            </SectorFrame></div>
          </div>

          {/* RIGHT COLUMN: Stats & Product */}
          <div ref={colRefs.right} className="w-1/3 h-full flex flex-col gap-4" style={{ transform: 'translateY(2%) translateX(2%)' }}>
            <div style={sectorStyle('right')}><SectorFrame>
              {/* Radar */}
              <div className="flex-1 flex flex-col min-h-0 border-b border-white/10 pb-4">
                <div className="flex justify-between items-center mb-2">
                  <span 
                    className="text-sm font-mono uppercase tracking-widest"
                    style={{ color: '#ffae00', fontSize: FONT_MIN }}
                  >
                    {t({ nl: 'Analyse', en: 'Analysis' })}
                  </span>
                  <Maximize2 size={10} className="text-white/30" />
                </div>
                <div className="flex-1 min-h-0">
                  <BrandStats metrics={brand.metrics} />
                </div>
              </div>

              {/* Featured Product */}
              <div className="h-[40%] flex flex-col pt-2">
                <span 
                  className="text-sm font-mono uppercase mb-3 tracking-widest border-l-2 pl-2"
                  style={{ color: '#ffae00', fontSize: FONT_MIN, borderColor: '#ffae00' }}
                >
                  {t({ nl: 'Uitgelicht product', en: 'Featured Artifact' })}
                </span>
                
                <div className="flex items-start gap-3 mb-2 flex-1">
                  <div className="w-20 h-20 border border-white/10 bg-black/40 shrink-0 relative group">
                    {brand.featuredProducts[0]?.image && (
                      <img src={brand.featuredProducts[0].image} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="prod" />
                    )}
                    <div className="absolute bottom-0 right-0 p-0.5 bg-black/80">
                      <ExternalLink size={8} style={{ color: '#ffae00' }} />
                    </div>
                  </div>
                  <div className="overflow-hidden flex flex-col h-full">
                    <h4 className="text-white font-bold uppercase tracking-widest text-sm truncate">
                      {t(brand.featuredProducts[0]?.name)}
                    </h4>
                    <div className="text-sm font-mono my-1 font-bold" style={{ color: '#bc13fe' }}>
                      {t(brand.featuredProducts[0]?.price)}
                    </div>
                    <div className="flex gap-1 flex-wrap mt-auto">
                      {brand.featuredProducts[0]?.specs.map((s, si) => (
                        <span
                          key={si}
                          className="text-sm bg-white/5 px-1.5 py-0.5 border border-white/10 text-white/50"
                          style={{ fontSize: FONT_MIN }}
                        >
                          {t(s)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Grey at rest, lit on hover — as "Lees het manifest" (owner, 14 Oct) */}
                <GlowButton variant="secondary" className="w-full !py-2 !px-3 !text-sm mt-auto" style={{ fontSize: FONT_MIN }}>
                  {t({ nl: 'Bekijk aanbiedingen', en: 'View offers' })}
                </GlowButton>
              </div>
            </SectorFrame></div>
          </div>
        </div>
      </main>

      {/* PREVIEW CARD (overview): the previewed unit, enlarged, left of the centred wheel. On Bekijk it grows into
          the left sector (fold.card) and fades while the sectors unfold out of it. */}
      {overviewFirst && (
        <div
          ref={previewWrapRef}
          className="fixed z-20 flex items-center"
          style={{ left: ovGeom.cardLeft, top: 0, height: ovGeom.centerY * 2, width: ovGeom.cardW, pointerEvents: 'none' }}
        >
          <div
            ref={previewRef}
            style={{
              width: '100%',
              transformOrigin: '0 0',
              transform: overview ? 'none' : (fold?.card || 'none'),
              opacity: overview ? 1 : 0,
              pointerEvents: overview ? 'auto' : 'none',
              transition: stageTransition('opacity 450ms ease-out'),
            }}
          >
            <SectorFrame>
              <div className="flex flex-col gap-3">
                <span style={{ color: '#ffae00', fontSize: FONT_MIN, fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif", fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                  {t({ nl: 'Eenheid', en: 'Unit' })} {unitLabel(previewUnit)}
                </span>
                <h2 className="text-2xl font-bold uppercase tracking-wider text-white leading-tight" style={{ fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif" }}>
                  {t(brand.name)}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {brand.tags.map((tag, ti) => <TechBadge key={ti} label={t(tag)} fontSize={FONT_MIN} compact />)}
                </div>
                <p
                  className="leading-relaxed"
                  style={{ margin: 0, padding: '0.6rem 0.75rem', fontFamily: "'Figtree', sans-serif", fontSize: FONT_MIN, color: '#FFFEF0', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '0.15rem', backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                >
                  {t(brand.tagline)}
                </p>
                <div style={{ height: 'clamp(212px, 30vh, 312px)' }}>
                  <BrandStats metrics={brand.metrics} />
                </div>
                <GlowButton variant="primary" className="w-full !py-2 !px-3 !text-sm" style={{ fontSize: FONT_MIN }} onClick={unfold}>
                  {t({ nl: 'Bekijk', en: 'View' })}
                </GlowButton>
              </div>
            </SectorFrame>
          </div>
        </div>
      )}

      {/* SEARCH PANEL (overview): mirrors the card on the wheel's right. On Bekijk it grows into the right sector
          (fold.search) and fades while that sector unfolds out of it; on MENU it takes the sector back in. */}
      {overviewFirst && (
        <div
          ref={searchWrapRef}
          className="fixed z-20 flex items-center"
          style={{ left: ovGeom.searchLeft, top: 0, height: ovGeom.centerY * 2, width: ovGeom.cardW, pointerEvents: 'none' }}
        >
          <div
            style={{
              width: '100%',
              transformOrigin: '0 0',
              transform: overview ? 'none' : (fold?.search || 'none'),
              opacity: overview ? 1 : 0,
              pointerEvents: overview ? 'auto' : 'none',
              transition: stageTransition('opacity 450ms ease-out'),
            }}
          >
            <UnitSearch
              brands={BRANDS}
              query={searchQuery}
              onQuery={setSearchQuery}
              filters={searchFilters}
              onFilters={setSearchFilters}
              height={cardHeight}
              matches={searchMatches_}
              onPick={pickFromSearch}
            />
          </div>
        </div>
      )}

      {/* EXPANDABLE NAV WHEEL */}
      <NavWheel brands={BRANDS} virtualIndex={virtualIndex} onUpdateIndex={updateIndex} onBack={() => onBack()} locked={hideNavWheel}
        overview={overview} previewIndex={previewIndex} previewPicked={previewPicked}
        previewUnit={previewUnit}
        ringTopUnit={ringTopUnit}
        onPreview={previewUnitNo}
        animate={animate}
        onFoldBack={overviewFirst ? foldBack : undefined}
        matches={overview ? searchMatches_ : null} />

      {/* MODAL - Contact */}
      <Modal isOpen={showContactModal} onClose={() => setShowContactModal(false)}>
        <SectorFrame>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ShieldCheck 
              className="w-12 h-12 mb-4"
              style={{ color: '#00ff9d', animation: 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
            />
            <h3 
              className="text-xl font-bold uppercase tracking-widest mb-2"
              style={{ color: '#00ff9d', letterSpacing: '0.2em' }}
            >
              {t({ nl: 'Beveiligde verbinding gemaakt', en: 'Secure Link Established' })}
            </h3>
            <p className="text-white/70 mb-8 font-mono text-sm px-8">
              {t({ nl: 'Versleuteld kanaal gereed. Bevestig je gegevens om contact te leggen.', en: 'Encrypted channel ready for transmission. Verify credentials to initiate contact protocol.' })}
            </p>
            <button 
              onClick={() => setShowContactModal(false)}
              className="px-8 py-3 border font-mono text-sm font-bold uppercase tracking-wider transition-all duration-300"
              style={{
                backgroundColor: 'rgba(0, 255, 157, 0.1)',
                borderColor: '#00ff9d',
                color: '#00ff9d',
                letterSpacing: '0.2em'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#00ff9d';
                e.currentTarget.style.color = '#000';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 255, 157, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 255, 157, 0.1)';
                e.currentTarget.style.color = '#00ff9d';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {t({ nl: 'Begrepen', en: 'Acknowledge' })}
            </button>
          </div>
        </SectorFrame>
      </Modal>
      </>
      ) : (
        <div style={{ width: '100vw', height: '100vh' }} />
      )}
    </div>
  );
});

GeneralBrandPage.displayName = 'GeneralBrandPage';

export default GeneralBrandPage;
