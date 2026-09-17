import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '@gfl/i18n';
import { FONT } from '@gfl/ui';
import { DESKTOP_PLATFORMS, desktopDownload } from './localWorkspace';

const BODY = "'Figtree', sans-serif";
// Arrow icons use the platform's provenance green — the same as the sync/date footer on the profile card.
const MINT = '#15b315';
// Accent per surface (design tokens: pick ONE per surface). Orange = dashboard/form, amber = brand.
export const ACCENTS = {
  orange: { hex: '#f97316', rgb: '249, 115, 22' },
  amber: { hex: '#ffae00', rgb: '255, 174, 0' },
};

/** Tray-arrow download glyph, provenance green. */
const DownloadIcon = () => (
  <svg width="1.15em" height="1.15em" viewBox="0 0 24 24" fill="none" stroke={MINT} strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0, filter: 'drop-shadow(0 0 4px rgba(21, 179, 21, 0.5))' }}>
    <path d="M12 3v12" />
    <path d="M7 10l5 5 5-5" />
    <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
  </svg>
);

const Chevron = ({ open }) => (
  <svg width="1.15em" height="1.15em" viewBox="0 0 24 24" fill="none" stroke={MINT} strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    style={{ transition: 'transform 0.25s', transform: open ? 'rotate(180deg)' : 'none', filter: 'drop-shadow(0 0 4px rgba(21, 179, 21, 0.5))' }}>
    <path d="M3.5 7.5l8.5 8.5 8.5-8.5" />
  </svg>
);

const corners = (col, size, w) => [
  { top: -3, left: -5, borderTop: `${w} solid ${col}`, borderLeft: `${w} solid ${col}`, borderTopLeftRadius: 3 },
  { top: -3, right: -5, borderTop: `${w} solid ${col}`, borderRight: `${w} solid ${col}`, borderTopRightRadius: 3 },
  { bottom: -3, left: -5, borderBottom: `${w} solid ${col}`, borderLeft: `${w} solid ${col}`, borderBottomLeftRadius: 3 },
  { bottom: -3, right: -5, borderBottom: `${w} solid ${col}`, borderRight: `${w} solid ${col}`, borderBottomRightRadius: 3 },
].map((s) => ({ ...s, width: size, height: size }));

/**
 * The desktop-app download as one house button (SciFiButton look: corner brackets, accent glow),
 * split by a clear divider:
 *   [ ˅ WINDOWS ┃ APP DOWNLOADEN ⤓ ]
 * the left part IS the choice — it shows the system (guessed from the browser) and opens a menu that
 * swaps it for Windows, Mac (Apple Silicon / Intel) or Linux; the right part starts the download.
 * `prominent` = the call-to-action version: larger, a tinted 135° fill and a slow breathing glow
 * (decorative; frozen on low-gpu, still reads as a lit button).
 * Until the installers are on R2 (DESKTOP_RELEASE.available) a click downloads nothing.
 */
export default function DesktopDownloadButton({ fullWidth = true, accent = 'orange', prominent = false, showMeta = true }) {
  const { t } = useLanguage();
  const { hex: ACCENT, rgb: RGB } = ACCENTS[accent] || ACCENTS.orange;
  const [chosen, setChosen] = useState(null);
  const [open, setOpen] = useState(false);
  const [hovMain, setHovMain] = useState(false);
  const [hovMenu, setHovMenu] = useState(false);
  const [hovItem, setHovItem] = useState(null);
  const rootRef = useRef(null);
  const menuRef = useRef(null);
  const [menuPos, setMenuPos] = useState(null); // { top, left, width } in viewport px

  const download = desktopDownload(chosen);
  const ext = download.fileName ? download.fileName.split('.').pop() : '';
  const lit = hovMain || hovMenu || open;
  const bracket = lit ? ACCENT : `rgba(${RGB}, ${prominent ? 0.75 : 0.45})`;

  // The menu is portalled to <body>: the card around this button is itself a backdrop-filter glass
  // panel, and a nested backdrop-filter only blurs inside that panel — so in place the menu would
  // not blur the text behind it. Fixed position, kept under the button on scroll and resize.
  useLayoutEffect(() => {
    if (!open) return undefined;
    const place = () => {
      const r = rootRef.current && rootRef.current.getBoundingClientRect();
      if (r) setMenuPos({ top: r.bottom + 7, left: r.left, width: r.width });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => { window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); };
  }, [open]);

  // Close on a click outside or Escape.
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      const inside = (rootRef.current && rootRef.current.contains(e.target)) || (menuRef.current && menuRef.current.contains(e.target));
      if (!inside) setOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const start = () => { if (download.available) window.location.href = download.href; };

  const pad = prominent ? '0.95rem 0.8rem' : '0.6rem 1.2rem';
  const fontSize = prominent ? 'max(11px, 0.6vw)' : 'max(11px, 0.55vw)';
  const segment = (hot) => ({
    background: hot ? `rgba(${RGB}, 0.14)` : 'transparent', border: 'none', outline: 'none', cursor: 'pointer',
    fontFamily: FONT, fontSize, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: prominent ? '0.12em' : '0.14em', whiteSpace: 'nowrap',
    color: hot ? ACCENT : prominent ? `rgba(${RGB}, 0.92)` : `rgba(${RGB}, 0.7)`,
    textShadow: hot || prominent ? `0 0 10px rgba(${RGB}, ${hot ? 0.55 : 0.3})` : 'none',
    transition: 'color 0.25s, text-shadow 0.25s, background 0.25s',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: pad, minWidth: 0,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: fullWidth ? 'stretch' : 'flex-start', gap: '0.6rem', margin: prominent ? '0.4rem 0.35rem 0' : '1rem 0.25rem 0.4rem' }}>
      {prominent && (
        <style>{`@keyframes gflGateBreathe { 0%, 100% { box-shadow: 0 0 18px rgba(${RGB}, 0.18), inset 0 0 18px rgba(${RGB}, 0.06); } 50% { box-shadow: 0 0 34px rgba(${RGB}, 0.42), inset 0 0 22px rgba(${RGB}, 0.12); } }`}</style>
      )}
      <div ref={rootRef} style={{ position: 'relative', display: fullWidth ? 'flex' : 'inline-flex' }}>
        {/* Button body: main segment + divider + OS segment, one bracket frame around both */}
        <div style={{
          position: 'relative', display: 'flex', alignItems: 'stretch', width: '100%', borderRadius: '0.15rem',
          background: prominent
            ? `linear-gradient(135deg, rgba(${RGB}, ${lit ? 0.2 : 0.13}) 0%, rgba(${RGB}, 0.04) 55%, rgba(168, 85, 247, ${lit ? 0.12 : 0.07}) 100%)`
            : (lit ? `rgba(${RGB}, 0.06)` : 'transparent'),
          border: prominent ? `1px solid rgba(${RGB}, ${lit ? 0.7 : 0.4})` : 'none',
          boxShadow: prominent ? (lit ? `0 0 34px rgba(${RGB}, 0.5)` : undefined) : (lit ? `0 0 20px rgba(${RGB}, 0.12)` : 'none'),
          animation: prominent && !lit ? 'gflGateBreathe 3.6s ease-in-out infinite' : 'none',
          transition: 'background 0.25s, box-shadow 0.25s, border-color 0.25s',
        }}>
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={open}
            aria-label={t('clientOrb.modal.workspace.download.other')}
            title={t('clientOrb.modal.workspace.download.other')}
            onClick={() => setOpen((o) => !o)}
            onMouseEnter={() => setHovMenu(true)}
            onMouseLeave={() => setHovMenu(false)}
            style={{ ...segment(hovMenu || open), flex: '1 1 auto', gap: '0.45rem' }}
          >
            <span style={{ display: 'inline-flex', flexShrink: 0 }}><Chevron open={open} /></span>
            <span style={{ minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t(`clientOrb.modal.workspace.download.short.${download.platform}`)}</span>
          </button>
          <span aria-hidden="true" style={{
            width: 3, flexShrink: 0, margin: prominent ? '0.45rem 0' : '0.3rem 0', borderRadius: 2,
            background: `rgba(${RGB}, ${lit ? 0.9 : 0.6})`,
            boxShadow: `0 0 ${lit ? 10 : 6}px rgba(${RGB}, ${lit ? 0.6 : 0.35})`,
            transition: 'background 0.25s, box-shadow 0.25s',
          }} />
          <button
            type="button"
            onClick={start}
            onMouseEnter={() => setHovMain(true)}
            onMouseLeave={() => setHovMain(false)}
            title={download.available ? download.fileName : undefined}
            style={{ ...segment(hovMain), flex: prominent ? '0 0 auto' : 1, gap: '0.55rem', padding: prominent ? '0.95rem 1.2rem' : pad }}
          >
            <span style={{ minWidth: 0 }}>{t('clientOrb.modal.workspace.download.cta')}</span>
            <DownloadIcon />
          </button>
          {corners(bracket, prominent ? '0.85rem' : '0.65rem', prominent ? '1.5px' : '1px').map((s, i) => (
            <div key={i} style={{ position: 'absolute', pointerEvents: 'none', transition: 'border-color 0.25s', ...s }} />
          ))}
        </div>

        {/* Platform menu */}
        {open && menuPos && createPortal(
          <div ref={menuRef} role="menu" style={{
            position: 'fixed', top: menuPos.top, left: menuPos.left, zIndex: 2147483000,
            width: Math.min(Math.max(menuPos.width / 2, 224), menuPos.width), padding: '0.3rem',
            background: 'rgba(2, 0, 3, 0.3)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
            border: `1px solid rgba(${RGB}, 0.3)`, borderRadius: '0.5rem',
            boxShadow: `0 8px 32px rgba(0, 0, 0, 0.5), 0 0 20px rgba(${RGB}, 0.08)`,
          }}>
            {DESKTOP_PLATFORMS.map((p) => {
              const selected = p === download.platform;
              const hov = hovItem === p;
              return (
                <button
                  key={p}
                  type="button"
                  role="menuitemradio"
                  aria-checked={selected}
                  onClick={() => { setChosen(p); setOpen(false); }}
                  onMouseEnter={() => setHovItem(p)}
                  onMouseLeave={() => setHovItem(null)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
                    width: '100%', padding: '0.5rem 0.7rem', border: 'none', outline: 'none', cursor: 'pointer',
                    borderRadius: '0.15rem', fontFamily: FONT, fontSize: 'max(9px, 0.45vw)', fontWeight: 'bold',
                    textTransform: 'uppercase', letterSpacing: '0.12em', textAlign: 'left',
                    background: hov ? ACCENT : 'transparent',
                    color: hov ? '#000' : selected ? ACCENT : 'rgba(255, 254, 240, 0.75)',
                    boxShadow: hov ? `0 0 20px rgba(${RGB}, 0.6)` : 'none',
                    transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
                  }}
                >
                  {t(`clientOrb.modal.workspace.download.short.${p}`)}
                  {selected && <span aria-hidden="true">✓</span>}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
      </div>

      {showMeta && (
        <span style={{ fontFamily: BODY, fontSize: 'max(9px, 0.48vw)', color: 'rgba(255, 254, 240, 0.4)', textAlign: fullWidth ? 'center' : 'left' }}>
          v{download.version}{ext ? ` · .${ext}` : ''}
        </span>
      )}
    </div>
  );
}
