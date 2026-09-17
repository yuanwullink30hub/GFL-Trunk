import './mockAppBridge';
import React, { useEffect } from 'react';
import AppSettingsSection from '../components/assessment/AppSettingsSection';
import DisplayRateConfirm from '../workspace/DisplayRateConfirm';

/**
 * Dev-only preview: ?appsettingspreview=1 (Instellingen → App section) or ?appsettingspreview=firstrun
 * (plus the first-start refresh-rate dialog). Uses the in-memory bridge from mockAppBridge.js.
 */
const LABEL = { fontSize: 'max(9px,0.48vw)', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#f59e0b', marginBottom: '0.28rem' };

export default function AppSettingsPreviewHarness() {
  useEffect(() => { const o = document.getElementById('gfl-loading-overlay'); if (o) o.remove(); }, []);
  return (
    <div style={{
      minHeight: '100vh', padding: '4vh 4vw', boxSizing: 'border-box',
      background: 'radial-gradient(ellipse at 20% 30%, rgba(168,85,247,0.35), transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(249,115,22,0.25), transparent 50%), #0a0510',
    }}>
      <div style={{
        maxWidth: '52rem', margin: '0 auto', padding: '1.5rem 1.75rem', borderRadius: '0.5rem',
        background: 'rgba(2, 0, 3, 0.3)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(168, 85, 247, 0.3)',
        fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
      }}>
        <AppSettingsSection labelStyle={LABEL} />
      </div>
      <DisplayRateConfirm />
    </div>
  );
}
