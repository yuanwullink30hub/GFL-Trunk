import React from 'react';
import { SciFiButton } from '@gfl/ui';
import { PopupTitle, PURPLE, PURPLE_RGB } from './PopupShell';

const CREAM = '#FFFEF0';
const CREAM_DIM = 'rgba(255, 254, 240, 0.5)';
const BODY_FONT = "'Figtree', sans-serif";
const TEXT = { margin: 0, color: CREAM, fontFamily: BODY_FONT, fontSize: 'max(12px, 0.65vw)', lineHeight: 1.65 };

/**
 * PdfConsentStep — the PDF / AI-prompt consent ("Verantwoording voor gebruik"), the same for both
 * report downloads: the first step of the Essentie pay component (PaywallModal) and the whole
 * pop-up for the free Fundament PDF. Render it inside a PopupShell (fill = over the report card).
 * `lead` is the one line that differs: before paying vs before downloading.
 */
export default function PdfConsentStep({ titleId, t, lead, checked, onCheck, onCancel, onConfirm }) {
  return (
    <>
      <PopupTitle id={titleId}>{t('resultsModal.ui.consentTitle')}</PopupTitle>
      <p style={{ ...TEXT, color: CREAM_DIM }}>{lead}</p>
      <div style={{ borderLeft: `2px solid rgba(${PURPLE_RGB}, 0.5)`, paddingLeft: '0.75rem' }}>
        <p style={TEXT}>{t('resultsModal.ui.consentBody')}</p>
      </div>
      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onCheck(e.target.checked)}
          style={{ marginTop: '0.2rem', width: '0.95rem', height: '0.95rem', accentColor: PURPLE, flexShrink: 0, cursor: 'pointer' }}
        />
        <span style={{ color: CREAM, fontFamily: BODY_FONT, fontSize: 'max(10px, 0.55vw)', lineHeight: 1.6 }}>
          {t('resultsModal.ui.consentCheck')}
        </span>
      </label>
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap', marginTop: '0.25rem' }}>
        <SciFiButton variant="white" size="md" onClick={onCancel}>{t('resultsModal.ui.cancel')}</SciFiButton>
        <SciFiButton variant="purple" size="md" disabled={!checked} onClick={() => { if (checked) onConfirm(); }}>
          {t('resultsModal.ui.consentConfirm')}
        </SciFiButton>
      </div>
    </>
  );
}
