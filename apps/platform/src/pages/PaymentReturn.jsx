import React, { useEffect } from 'react';
import { useLanguage } from '@gfl/i18n';

/**
 * PaymentReturn — where the bank window lands after iDEAL (?betaling=terug&ref=…).
 *
 * The payment is never confirmed here: the report tab that opened this window polls the server
 * (and Stripe's webhook confirms independently). This page only tells the client to go back, and
 * closes itself — a window opened by script may close itself. Mounted standalone from main.jsx,
 * without the 3D app. Styled per gfl-design-tokens.json (void background, glass panel, Lexend Mega
 * chrome, Figtree cream body).
 */
export default function PaymentReturn() {
  const { t } = useLanguage();

  useEffect(() => {
    const timer = setTimeout(() => { try { window.close(); } catch { /* not script-opened */ } }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0a0510', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{
        maxWidth: '28rem', padding: '2rem', textAlign: 'center', borderRadius: '0.5rem',
        background: 'rgba(2, 0, 3, 0.3)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(168, 85, 247, 0.3)',
        boxShadow: '0 6px 30px rgba(0,0,0,0.7), inset 0 0 12px rgba(168, 85, 247, 0.06)',
      }}>
        <h1 style={{
          margin: '0 0 1rem', color: '#a855f7', fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif", fontWeight: 'bold',
          textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: 'max(13px, 0.7vw)',
        }}>
          {t('resultsModal.paywall.returnTitle')}
        </h1>
        <p style={{ margin: '0 0 1.5rem', color: '#FFFEF0', fontFamily: "'Figtree', sans-serif", fontSize: 'max(12px, 0.65vw)', lineHeight: 1.65 }}>
          {t('resultsModal.paywall.returnBody')}
        </p>
        <button
          type="button"
          onClick={() => window.close()}
          style={{
            padding: '0.5rem 1.2rem', background: 'transparent', color: '#a855f7', cursor: 'pointer',
            border: '1px solid rgba(168, 85, 247, 0.45)', borderRadius: '0.15rem',
            fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif", fontWeight: 'bold', textTransform: 'uppercase',
            letterSpacing: '0.12em', fontSize: 'max(10px, 0.5vw)',
          }}
        >
          {t('resultsModal.paywall.returnClose')}
        </button>
      </div>
    </div>
  );
}
