import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '@gfl/i18n';
import { FONT } from '@gfl/ui';
import { DESKTOP_PLATFORMS, desktopDownload } from './localWorkspace';

const BODY = "'Figtree', sans-serif";
// Dashboard surface → orange accent (design tokens: pick ONE per surface).
const ACCENT = '#f97316';
const RGB = '249, 115, 22';

/** Tray-arrow download glyph, drawn in the current text colour. */
const DownloadIcon = () => (
  <svg width="1.15em" height="1.15em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
    <path d="M12 3v12" />
    <path d="M7 10l5 5 5-5" />
    <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
  </svg>
);

const Chevron = ({ open }) => (
  <svg width="0.9em" height="0.9em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    style={{ transition: 'transform 0.25s', transform: open ? 'rotate(180deg)' : 'none' }}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const CORNER = '0.65rem';
const corners = (col) => [
  { top: -2, left: -4, borderTop: `1px solid ${col}`, borderLeft: `1px solid ${col}`, borderTopLeftRadius: 2 },
  { top: -2, right: -4, borderTop: `1px solid ${col}`, borderRight: `1px solid ${col}`, borderTopRightRadius: 2 },
  { bottom: -2, left: -4, borderBottom: `1px solid ${col}`, borderLeft: `1px solid ${col}`, borderBottomLeftRadius: 2 },
  { bottom: -2, right: -4, borderBottom: `1px solid ${col}`, borderRight: `1px solid ${col}`, borderBottomRightRadius: 2 },
];

const segment = (lit) => ({
  background: 'transparent', border: 'none', outline: 'none', cursor: 'pointer',
  fontFamily: FONT, fontSize: 'max(11px, 0.55vw)', fontWeight: 'bold',
  textTransform: 'uppercase', letterSpacing: '0.12em',
  color: lit ? ACCENT : `rgba(${RGB}, 0.7)`,
  textShadow: lit ? `0 0 8px rgba(${RGB}, 0.4)` : 'none',
  transition: 'color 0.25s, text-shadow 0.25s',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
});

/**
 * The desktop-app download as one house button (SciFiButton look: transparent body, corner
 * brackets, orange glow on hover), split by a clear divider:
 *   [ ⤓ DOWNLOAD VOOR ┃ WINDOWS ˅ ]
 * the left part starts the download, the right part IS the choice — it shows the system (guessed
 * from the browser) and opens a menu that swaps it for Windows, Mac (Apple Silicon / Intel) or Linux.
 * Until the installers are on R2 (DESKTOP_RELEASE.available) a click downloads nothing.
 */
export default function DesktopDownloadButton({ fullWidth = true }) {
  const { t } = useLanguage();
  const [chosen, setChosen] = useState(null);
  const [open, setOpen] = useState(false);
  const [hovMain, setHovMain] = useState(false);
  const [hovMenu, setHovMenu] = useState(false);
  const [hovItem, setHovItem] = useState(null);
  const rootRef = useRef(null);
  const menuRef = useRef(null);
  const [menuPos, setMenuPos] = useState(null); // { top, right, width } in viewport px

  const download = desktopDownload(chosen);
  const ext = download.fileName ? download.fileName.split('.').pop() : '';
  const lit = hovMain || hovMenu || open;
  const bracket = lit ? ACCENT : `rgba(${RGB}, 0.45)`;

  // The menu is portalled to <body>: the card around this button is itself a backdrop-filter glass
  // panel, and a nested backdrop-filter only blurs inside that panel — so in place the menu would
  // not blur the text behind it. Fixed position, kept under the button on scroll and resize.
  useLayoutEffect(() => {
    if (!open) return undefined;
    const place = () => {
      const r = rootRef.current && rootRef.current.getBoundingClientRect();
      if (r) setMenuPos({ top: r.bottom + 7, right: window.innerWidth - r.right, width: r.width });
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: fullWidth ? 'stretch' : 'flex-start', gap: '0.6rem', margin: '1rem 0.25rem 0.4rem' }}>
      <div ref={rootRef} style={{ position: 'relative', display: fullWidth ? 'flex' : 'inline-flex' }}>
        {/* Button body: main segment + divider + chevron segment, one bracket frame around both */}
        <div style={{
          position: 'relative', display: 'flex', alignItems: 'stretch', width: '100%',
          borderRadius: '0.15rem', background: lit ? `rgba(${RGB}, 0.06)` : 'transparent',
          boxShadow: lit ? `0 0 20px rgba(${RGB}, 0.12)` : 'none', transition: 'background 0.25s, box-shadow 0.25s',
        }}>
          <button
            type="button"
            onClick={start}
            onMouseEnter={() => setHovMain(true)}
            onMouseLeave={() => setHovMain(false)}
            title={download.available ? download.fileName : undefined}
            style={{ ...segment(hovMain), flex: 1, gap: '0.6rem', padding: '0.6rem 1.2rem', minWidth: 0 }}
          >
            <DownloadIcon />
            <span style={{ minWidth: 0 }}>{t('clientOrb.modal.workspace.download.for')}</span>
          </button>
          <span aria-hidden="true" style={{
            width: 3, flexShrink: 0, margin: '0.3rem 0', borderRadius: 2,
            background: `rgba(${RGB}, ${lit ? 0.85 : 0.55})`,
            boxShadow: lit ? `0 0 8px rgba(${RGB}, 0.5)` : 'none',
            transition: 'background 0.25s, box-shadow 0.25s',
          }} />
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={open}
            aria-label={t('clientOrb.modal.workspace.download.other')}
            title={t('clientOrb.modal.workspace.download.other')}
            onClick={() => setOpen((o) => !o)}
            onMouseEnter={() => setHovMenu(true)}
            onMouseLeave={() => setHovMenu(false)}
            style={{ ...segment(hovMenu || open), flex: 1, gap: '0.55rem', padding: '0.6rem 1.2rem', minWidth: 0 }}
          >
            <span style={{ minWidth: 0 }}>{t(`clientOrb.modal.workspace.download.short.${download.platform}`)}</span>
            <Chevron open={open} />
          </button>
          {corners(bracket).map((s, i) => (
            <div key={i} style={{ position: 'absolute', width: CORNER, height: CORNER, pointerEvents: 'none', transition: 'border-color 0.25s', ...s }} />
          ))}
        </div>

        {/* Platform menu */}
        {open && menuPos && createPortal(
          <div ref={menuRef} role="menu" style={{
            position: 'fixed', top: menuPos.top, right: menuPos.right, zIndex: 2147483000,
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

      <span style={{ fontFamily: BODY, fontSize: 'max(9px, 0.48vw)', color: 'rgba(255, 254, 240, 0.4)', textAlign: fullWidth ? 'center' : 'left' }}>
        v{download.version}{ext ? ` · .${ext}` : ''}
      </span>
    </div>
  );
}
