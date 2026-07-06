import React, { useEffect, useRef } from 'react';
import { useLanguage } from '@gfl/i18n';

/**
 * ClientSubnav — the header's "SCHADUW WERK // V.4.9" line, turned into a nav.
 *   · Opens the page menu on CLICK only.
 *   · Hovering the logo OR header lights the subheader text (colour highlight) — no open.
 *   · The dropdown is a plain COLUMN of pages (no boxes).
 *   · "← Terug" steps back one step. Page list (items) differs per interface (visitor vs client).
 */

const GOLD = '#f59e0b';

export default function ClientSubnav({ activeSection, items = [], onNavigate, onBack, canBack, open, onToggle, onClose, hovered }) {
  const { t } = useLanguage();
  const rootRef = useRef(null);
  const activeKey = activeSection || 'main';
  // The subheader tag reads the CURRENT page (falls back to the brand version-text label).
  const currentLabel = (items.find((i) => i.key === activeKey) || {}).label || t('header.versionText');
  const lit = hovered || open;

  // Click-outside closes the menu.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (rootRef.current && !rootRef.current.contains(e.target)) onClose?.(); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open, onClose]);

  const go = (key) => { onClose?.(); onNavigate(key); };

  return (
    <div ref={rootRef} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: 'clamp(0.25rem, 0.5vw, 0.5rem)', fontFamily: "'Figtree', sans-serif" }}>
      {/* Toggle — opens on CLICK. Text highlights when the logo/header is hovered (or open). */}
      <div
        onClick={onToggle}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer', color: lit ? '#fff' : 'rgb(156,163,175)', fontSize: 'clamp(0.5rem, 0.53vw, 0.85rem)', letterSpacing: '0.1em', transition: 'color 0.15s' }}
      >
        <span className="rounded-full bg-green-500" style={{ width: 'clamp(0.35rem,0.5vw,0.5rem)', height: 'clamp(0.35rem,0.5vw,0.5rem)', animation: 'dotBreathe 4s ease-in-out infinite', flexShrink: 0 }} />
        <span style={{ textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{currentLabel} {'//'} V.4.9</span>
        <svg
          viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
          style={{ width: 'clamp(0.95rem, 1.3vw, 1.15rem)', height: 'clamp(0.95rem, 1.3vw, 1.15rem)', filter: `drop-shadow(0 0 4px ${GOLD}88)`, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none', flexShrink: 0 }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>

      <span style={{ width: 1, height: '0.9rem', background: 'rgba(255,255,255,0.15)' }} />

      <button
        type="button"
        onClick={() => { onClose?.(); onNavigate('main'); }}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'rgb(156,163,175)', fontFamily: 'inherit', fontSize: 'clamp(0.6rem, 0.63vw, 1rem)', letterSpacing: '0.08em', transition: 'color 0.15s' }}
        onMouseEnter={(e) => { e.currentTarget.style.color = GOLD; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'rgb(156,163,175)'; }}
      >
        ↑ P.O.V.
      </button>

      {/* Dropdown — a plain COLUMN of pages (no per-item boxes). */}
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '0.6rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.15rem', background: '#000', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', boxShadow: '0 12px 40px rgba(0,0,0,0.6)', zIndex: 2147483647 }}>
          {items.map((item) => {
            const active = item.key === activeKey;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => go(item.key)}
                style={{ textAlign: 'left', background: 'none', border: 'none', padding: '0.25rem 0', cursor: 'pointer', color: active ? GOLD : 'rgba(255,255,255,0.72)', fontFamily: 'inherit', fontSize: 'clamp(0.82rem, 1vw, 0.98rem)', letterSpacing: '0.04em', textShadow: '0 1px 8px rgba(0,0,0,0.85)', whiteSpace: 'nowrap', transition: 'color 0.12s' }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.72)'; }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
