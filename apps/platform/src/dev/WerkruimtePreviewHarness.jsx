import React, { useEffect } from 'react';
import WorkspaceTab from '../components/assessment/WorkspaceTab';

/**
 * Dev-only preview: ?werkruimtepreview=1 (mounted from main.jsx under import.meta.env.DEV).
 * The Werkruimte tab as a browser visitor sees it (no window.gfl → the download gate), inside a
 * stand-in for the profile card shell on a nebula-ish ground, without logging in.
 */
const SECTION_TITLE = { fontSize: 'max(13px,0.75vw)', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#f59e0b' };
const PanelCard = ({ title, children }) => (
  <div style={{ paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
    {title && <div style={{ ...SECTION_TITLE, marginBottom: '0.8rem' }}>{title}</div>}
    {children}
  </div>
);

const FAKE_TABS = (
  <div style={{ display: 'flex', gap: '0.35rem' }}>
    {['Openbaar', 'Privé', 'Werkruimte', 'Instellingen'].map((l) => (
      <span key={l} style={{ border: '1px solid rgba(168,85,247,0.28)', borderRadius: '0.4rem', padding: '0.42rem 0.85rem', fontSize: 'max(8px,0.46vw)', letterSpacing: '0.06em', textTransform: 'uppercase', color: l === 'Werkruimte' ? '#f59e0b' : 'rgba(255,255,255,0.55)', background: l === 'Werkruimte' ? 'rgba(168,85,247,0.22)' : 'transparent' }}>{l}</span>
    ))}
  </div>
);

export default function WerkruimtePreviewHarness() {
  // The boot overlay from index.html is normally dismissed by App; there is no App here.
  useEffect(() => { const o = document.getElementById('gfl-loading-overlay'); if (o) o.remove(); }, []);
  return (
    <div style={{
      minHeight: '100vh', padding: '4vh 4vw', boxSizing: 'border-box',
      background: 'radial-gradient(ellipse at 20% 30%, rgba(168,85,247,0.35), transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(249,115,22,0.25), transparent 50%), #0a0510',
    }}>
      <div style={{
        maxWidth: '76rem', margin: '0 auto', padding: '0', borderRadius: '0.5rem',
        // Same body model as ProfileCard: a fixed-height flex column the tab grows into.
        height: '82vh', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', overflowY: 'auto',
        background: 'rgba(2, 0, 3, 0.3)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(168, 85, 247, 0.3)',
        boxShadow: '0 6px 30px rgba(0,0,0,0.7), 0 12px 60px rgba(0,0,0,0.5)',
        fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
      }}>
        <div style={{ padding: '1rem 1.25rem 0' }}>{FAKE_TABS}</div>
        <div style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto', padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column' }}>
          <WorkspaceTab DashboardCard={PanelCard} accountId="69a56d1781fb07ec3eb683be" />
        </div>
        <div aria-hidden="true" style={{ padding: '0 1.25rem 1rem', visibility: 'hidden' }}>{FAKE_TABS}</div>
      </div>
    </div>
  );
}
