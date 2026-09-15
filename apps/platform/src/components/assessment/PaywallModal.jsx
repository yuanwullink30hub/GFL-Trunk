import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SciFiButton } from '@gfl/ui';
import { PopupShell, PopupTitle, POP_MS, PURPLE, PURPLE_RGB } from './PopupShell';
import PdfConsentStep from './PdfConsentStep';
import StripeCheckout from './StripeCheckout';
import { formatCents, formatLaunchPriceEnd, formatNetPrice, formatPrice, netFromGross, REGULAR_PRICE, VAT_RATE } from '../../config/pricing';
import { getPaymentConfig, getPaymentStatus, redeemActivationCode, UNSUCCESSFUL_STATUSES } from '../../services/paymentService';

/**
 * PaywallModal — the pay component for the full report (Essentie).
 *
 * Opened by the "Essentie" button. The short report (Fundament) stays free.
 *
 * The first step is the PDF / AI-prompt consent: consent comes BEFORE payment, so the PDF can
 * download automatically the moment the payment / activation code is confirmed. `onConsent`
 * fires when it is given (the parent logs it).
 *
 * Payment: Stripe Payment Element in the summary step (StripeCheckout.jsx), confirmed on the server.
 * Price, country gate and whether paying is possible at all come from GET /api/payments/config;
 * when that can't be loaded, paying is disabled — never a stale price with a live Pay button.
 * The report only exists in this tab's memory, so nothing here navigates the tab: iDEAL opens the
 * bank in a separate window and this tab polls the server-confirmed status (with the seal), then
 * hands over: onPaid(ref, orbCode).
 *
 * The alternative path is a one-time activation code (issued in the admin console). It is
 * redeemed server-side and works whether or not payments are enabled; on success it hands over
 * exactly like a payment does: onPaid(unlockId, orbCode). The crystal code only exists here from
 * that moment on — before it, the tab holds nothing but the sealed copy.
 *
 * Shell = the assessment flow's pop-up pattern (see POP_KEYFRAMES / Bracket below): purple
 * SectorFrame brackets, 0.55 glass + blur(32px) with low-GPU fallback, sector shadow + purple
 * inset, centred purple title over a hairline rule, scale expand / contract. Content follows
 * gfl-design-tokens.json: Lexend Mega uppercase chrome on fluid max(px, vw) steps, Figtree cream
 * body copy, amber focus treatment, functional loader carries .keep-spinning.
 *
 * `fill`: render as a black card covering the report card exactly (PopupShell fill mode) instead
 * of a floating pop-up. The parent must render it inside the report card's positioned wrapper.
 */

const AMBER = '#ffae00';
const AMBER_RGB = '255, 174, 0';
const ORANGE = '#f97316'; // the report card's "Volledig rapport" teaser heading
const ORANGE_RGB = '249, 115, 22';
const CYAN = '#22d3ee'; // the platform's blue (colors.accent.cyan)
const CYAN_RGB = '34, 211, 238';
const CREAM = '#FFFEF0';
const CREAM_DIM = 'rgba(255, 254, 240, 0.5)';
const UI_FONT = "'Lexend Mega', Arial, Helvetica, sans-serif";
const BODY_FONT = "'Figtree', sans-serif";
const POLL_MS = 2500;
const CODE_LEN = 12;

/** Typed or pasted input -> "ABCD-EFGH-IJKL" as the user goes (the server normalises again). */
const formatCodeInput = (value) => value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LEN)
  .replace(/(.{4})(?=.)/g, '$1-');

// components.input tokens on the platform blue (cyan) instead of amber — the code field matches the guarantee accent.
const INPUT_STYLE = {
  width: '100%', boxSizing: 'border-box', padding: '0.7rem 0.9rem',
  background: 'rgba(0, 0, 0, 0.4)', border: `1px solid rgba(${CYAN_RGB}, 0.2)`, borderRadius: '0.15rem',
  color: CREAM, fontFamily: UI_FONT, fontSize: 'max(14px, 0.8vw)', letterSpacing: '0.2em', textAlign: 'center',
  outline: 'none', transition: 'all 0.25s ease',
};
const INPUT_FOCUS = { borderColor: `rgba(${CYAN_RGB}, 0.5)`, background: `rgba(${CYAN_RGB}, 0.04)`, boxShadow: `0 0 15px rgba(${CYAN_RGB}, 0.15)` };
const INPUT_BLUR = { borderColor: `rgba(${CYAN_RGB}, 0.2)`, background: 'rgba(0, 0, 0, 0.4)', boxShadow: 'none' };

const OTHER_COUNTRY = 'OTHER';

const PaywallModal = ({ open, onClose, onPaid, onConsent, language, t, sealedOrbCode = '', email = '', origin = 'center center', fill = false }) => {
  const [step, setStep] = useState('consent'); // consent | summary | awaiting | processing | paid | failed | rejected | codeAccepted
  const [consentChecked, setConsentChecked] = useState(false);
  // Activation code: an inline form under "Heb je een activatiecode?" (summary step).
  const [codeOpen, setCodeOpen] = useState(false);
  const [codeHover, setCodeHover] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const codeInputRef = useRef(null);
  const [waiverChecked, setWaiverChecked] = useState(false);
  const [payConfig, setPayConfig] = useState(null); // null = loading
  const [country, setCountry] = useState('NL');
  const [payError, setPayError] = useState('');
  const [redirectUrl, setRedirectUrl] = useState('');
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [errorText, setErrorText] = useState('');
  const paymentRefRef = useRef('');
  const pollRef = useRef(null);
  const dialogRef = useRef(null);

  // The server's price when it has one; the static label only while loading / when paying is off.
  const priceCents = payConfig?.enabled ? payConfig.grossCents : null;
  const price = priceCents != null ? formatCents(language, priceCents, payConfig.currency) : formatPrice(language);
  const netPrice = priceCents != null ? formatCents(language, netFromGross(priceCents), payConfig.currency) : formatNetPrice(language);
  const launch = payConfig?.enabled ? payConfig.launch : Date.now() < new Date('2027-03-20T20:25:00Z').getTime();
  const allowedCountries = useMemo(() => (payConfig?.allowedCountries?.length ? payConfig.allowedCountries : ['NL']), [payConfig]);
  const regionName = useMemo(() => {
    try {
      const names = new Intl.DisplayNames([language === 'en' ? 'en' : 'nl'], { type: 'region' });
      return (c) => names.of(c) || c;
    } catch { return (c) => c; }
  }, [language]);
  const countriesLabel = (list) => (list || allowedCountries).map(regionName).join(', ');

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  // Contract animation before the parent unmounts us.
  const [closing, setClosing] = useState(false);
  const closeTimerRef = useRef(null);
  useEffect(() => () => clearTimeout(closeTimerRef.current), []);

  // Fresh state every time the component opens.
  useEffect(() => {
    if (!open) { stopPolling(); return; }
    clearTimeout(closeTimerRef.current); setClosing(false);
    setStep('consent'); setConsentChecked(false); setWaiverChecked(false); setErrorText('');
    setPayError(''); setRedirectUrl(''); setPopupBlocked(false);
    setCodeOpen(false); setCodeHover(false); setRedeeming(false); setCode(''); setCodeError('');
    paymentRefRef.current = '';
    requestAnimationFrame(() => dialogRef.current?.focus());
    let live = true;
    setPayConfig(null);
    getPaymentConfig().then((cfg) => {
      if (!live) return;
      setPayConfig(cfg);
      if (cfg?.allowedCountries?.length) setCountry(cfg.allowedCountries[0]);
    });
    return () => { live = false; };
  }, [open, stopPolling]);

  useEffect(() => stopPolling, [stopPolling]);

  const close = useCallback(() => {
    stopPolling();
    setClosing(true);
    clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(onClose, POP_MS);
  }, [onClose, stopPolling]);

  // Steps the user cannot back out of: a request is in flight or the hand-over is running.
  const busy = redeeming || step === 'codeAccepted' || step === 'paid';

  // Escape closes, except while busy.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape' && !busy) close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, busy, close]);

  const checkStatus = useCallback(async () => {
    const ref = paymentRefRef.current;
    if (!ref) return;
    try {
      const { status, orbCode } = await getPaymentStatus(ref, sealedOrbCode);
      if (status === 'paid') {
        stopPolling();
        setStep('paid');
        setTimeout(() => onPaid(ref, orbCode), 900);
      } else if (status === 'rejected_country') {
        stopPolling();
        setStep('rejected');
      } else if (UNSUCCESSFUL_STATUSES.includes(status) || status === 'refunded') {
        stopPolling();
        setStep('failed');
      }
    } catch { /* transient — the next poll retries */ }
  }, [onPaid, sealedOrbCode, stopPolling]);

  // Re-check immediately when the user comes back from the bank window.
  useEffect(() => {
    if (step !== 'awaiting' && step !== 'processing') return undefined;
    const onFocus = () => { checkStatus(); };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [step, checkStatus]);

  /** StripeCheckout handed over a payment: follow it until the server says how it ended. */
  const onPaymentStarted = useCallback(({ ref, redirectUrl: bankUrl = '', popupBlocked: blocked = false, message = '' }) => {
    paymentRefRef.current = ref;
    setRedirectUrl(bankUrl);
    setPopupBlocked(blocked);
    setErrorText(message);
    setStep(bankUrl ? 'awaiting' : 'processing');
    stopPolling();
    checkStatus();
    pollRef.current = setInterval(checkStatus, POLL_MS);
  }, [checkStatus, stopPolling]);

  const payErrorMessage = (res) => {
    switch (res.error) {
      case 'country_not_allowed': return t('resultsModal.paywall.countryNotAvailable').replace('{countries}', countriesLabel(res.allowedCountries));
      case 'payment_failed': return t('resultsModal.paywall.paymentDeclined');
      case 'already_unlocked': return t('resultsModal.paywall.alreadyUnlocked');
      case 'report_expired': return t('resultsModal.paywall.reportExpired');
      case 'consent_required': return t('resultsModal.paywall.consentRequired');
      case 'unavailable': return t('resultsModal.paywall.unavailableBody');
      default: return t('resultsModal.paywall.paymentError');
    }
  };

  const toggleCode = () => {
    const next = !codeOpen;
    setCodeOpen(next);
    if (next) requestAnimationFrame(() => codeInputRef.current?.focus()); // focus also scrolls it into view
  };

  const redeem = async (e) => {
    e?.preventDefault();
    if (code.replace(/-/g, '').length !== CODE_LEN || redeeming) return;
    setRedeeming(true); setCodeError('');
    const res = await redeemActivationCode(code, sealedOrbCode);
    if (res.unlockId) {
      setStep('codeAccepted');
      setTimeout(() => onPaid(res.unlockId, res.orbCode), 900);
      return;
    }
    const key = {
      malformed: 'codeInvalid', invalid: 'codeInvalid', used: 'codeUsed',
      rate_limited: 'codeRateLimited', network: 'codeNetwork', report_expired: 'codeReportExpired',
    }[res.error] || 'codeServer';
    setCodeError(t(`resultsModal.paywall.${key}`));
    setRedeeming(false);
    requestAnimationFrame(() => codeInputRef.current?.focus());
  };

  if (!open) return null;

  const title = (text, color, rgb) => <PopupTitle id="gfl-paywall-title" color={color} rgb={rgb}>{text}</PopupTitle>;
  const body = (text, extra = {}) => (
    <p style={{ margin: 0, color: CREAM, fontFamily: BODY_FONT, fontSize: 'max(12px, 0.65vw)', lineHeight: 1.65, ...extra }}>{text}</p>
  );
  const spinner = (
    <div className="keep-spinning" aria-hidden="true" style={{
      width: '2.25rem', height: '2.25rem', borderRadius: '50%',
      border: `2px solid rgba(${AMBER_RGB}, 0.2)`, borderTopColor: AMBER,
      animation: 'spin 0.9s linear infinite', margin: '0.25rem auto',
    }} />
  );
  const actions = (children) => (
    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap', marginTop: '0.25rem' }}>{children}</div>
  );
  // The waiver as shown — the exact same words are sent as consentText (the server stores their hash).
  const consentText = `${t('resultsModal.paywall.waiver')} ${t('resultsModal.paywall.termsLink')}`;
  const waiver = (
    <label style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', cursor: 'pointer' }}>
      <input
        type="checkbox"
        checked={waiverChecked}
        onChange={(e) => setWaiverChecked(e.target.checked)}
        style={{ marginTop: '0.2rem', width: '0.95rem', height: '0.95rem', accentColor: PURPLE, flexShrink: 0, cursor: 'pointer' }}
      />
      <span style={{ color: CREAM, fontFamily: BODY_FONT, fontSize: 'max(10px, 0.55vw)', lineHeight: 1.6 }}>
        {t('resultsModal.paywall.waiver')}{' '}
        <a
          href="/?page=algemene-voorwaarden"
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          style={{ color: ORANGE, textDecoration: 'underline', textUnderlineOffset: '2px' }}
        >
          {t('resultsModal.paywall.termsLink')}
        </a>
      </span>
    </label>
  );
  // Secondary route: activation code, under a hairline separator. The question is the toggle
  // (glows + grows on hover / keyboard focus); the form opens below it, absolutely positioned so
  // it drops into the free space under the card content instead of re-centring (pushing up) the
  // column. It still extends the pay card's scroll area when the viewport is short.
  const codeOption = (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div aria-hidden="true" style={{ height: '1px', background: `rgba(${PURPLE_RGB}, 0.1)` }} />
      <button
        type="button"
        onClick={toggleCode}
        onMouseEnter={() => setCodeHover(true)}
        onMouseLeave={() => setCodeHover(false)}
        onFocus={() => setCodeHover(true)}
        onBlur={() => setCodeHover(false)}
        aria-expanded={codeOpen}
        aria-controls={codeOpen ? 'gfl-activation-code-form' : undefined}
        style={{
          alignSelf: 'flex-start', padding: 0, margin: 0, background: 'none', border: 'none', outline: 'none', cursor: 'pointer',
          color: codeHover ? CREAM : CREAM_DIM, fontFamily: BODY_FONT, fontSize: 'max(10px, 0.55vw)',
          textShadow: codeHover ? `0 0 20px rgba(${PURPLE_RGB}, 0.6), 0 0 8px rgba(${PURPLE_RGB}, 0.4)` : 'none',
          transform: codeHover ? 'scale(1.12)' : 'scale(1)', transformOrigin: 'left center',
          transition: 'color 0.25s ease, text-shadow 0.25s ease, transform 0.25s ease',
        }}
      >
        {t('resultsModal.paywall.haveCode')}
      </button>
      {codeOpen && (
        // gflPopFadeIn is defined by PopupShell, which always wraps this component.
        <form id="gfl-activation-code-form" onSubmit={redeem} style={{
          position: 'absolute', top: '100%', left: 0, right: 0, paddingTop: '0.75rem',
          display: 'flex', flexDirection: 'column', gap: '0.75rem', margin: 0, animation: 'gflPopFadeIn 0.25s ease',
        }}>
          <div>
            <label htmlFor="gfl-activation-code" style={{
              display: 'block', marginBottom: '0.3rem', color: `rgba(${PURPLE_RGB}, 0.6)`, fontFamily: UI_FONT,
              textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 'max(9px, 0.48vw)',
            }}>
              {t('resultsModal.paywall.codeLabel')}
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <input
                id="gfl-activation-code"
                ref={codeInputRef}
                value={code}
                onChange={(e) => { setCode(formatCodeInput(e.target.value)); if (codeError) setCodeError(''); }}
                onFocus={(e) => Object.assign(e.target.style, INPUT_FOCUS)}
                onBlur={(e) => Object.assign(e.target.style, INPUT_BLUR)}
                placeholder="XXXX-XXXX-XXXX"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                disabled={redeeming}
                aria-invalid={!!codeError}
                aria-describedby={codeError ? 'gfl-activation-code-error' : undefined}
                style={{ ...INPUT_STYLE, width: 'auto', minWidth: 0, flex: '1 1 12rem' }}
              />
              <SciFiButton type="submit" variant="purple" size="md" disabled={redeeming || code.replace(/-/g, '').length !== CODE_LEN}>
                {redeeming ? t('resultsModal.paywall.codeChecking') : t('resultsModal.paywall.codeActivate')}
              </SciFiButton>
            </div>
          </div>
          {codeError && (
            <div id="gfl-activation-code-error" role="alert" style={{
              padding: '0.5rem 0.7rem', borderLeft: '2px solid rgba(239, 68, 68, 0.6)', background: 'rgba(239, 68, 68, 0.08)',
              color: '#fca5a5', fontFamily: BODY_FONT, fontSize: 'max(10px, 0.5vw)',
            }}>
              {codeError}
            </div>
          )}
        </form>
      )}
    </div>
  );

  return (
    <PopupShell
      closing={closing}
      onDismiss={() => { if (!busy) close(); }}
      origin={origin}
      labelledBy="gfl-paywall-title"
      panelRef={dialogRef}
      fill={fill}
    >
        {step === 'consent' && (
          <PdfConsentStep
            titleId="gfl-paywall-title"
            t={t}
            lead={t('resultsModal.ui.consentLeadPay')}
            checked={consentChecked}
            onCheck={setConsentChecked}
            onCancel={close}
            onConfirm={() => { onConsent?.(); setStep('summary'); }}
          />
        )}

        {step === 'summary' && (
          <>
            {title(t('resultsModal.paywall.title'), ORANGE, ORANGE_RGB)}
            <ul style={{ margin: 0, paddingLeft: '1.1rem', color: CREAM, fontFamily: BODY_FONT, fontSize: 'max(12px, 0.65vw)', lineHeight: 1.7 }}>
              <li>{t('resultsModal.paywall.includesReport')}</li>
              <li>{t('resultsModal.paywall.includesPrompt')}</li>
              <li>
                {t('resultsModal.paywall.includesPlatform')}
                <ul style={{ margin: 0, paddingLeft: '1.1rem', listStyleType: 'circle', color: ORANGE }}>
                  {['platformTools', 'platformMedia', 'platformStorage'].map((k) => (
                    <li key={k}>{t(`resultsModal.paywall.${k}`)}</li>
                  ))}
                </ul>
              </li>
            </ul>

            <div style={{
              display: 'flex', flexDirection: 'column', gap: '0.45rem',
              padding: '0.9rem 1rem', borderRadius: '0.15rem',
              background: `linear-gradient(135deg, rgba(${PURPLE_RGB}, 0.03), rgba(${PURPLE_RGB}, 0.06))`,
              border: `1px solid rgba(${PURPLE_RGB}, 0.2)`,
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <span style={{ color: PURPLE, fontFamily: UI_FONT, fontWeight: 'bold', fontSize: 'max(28px, 1.26vw)', letterSpacing: '0.04em' }}>{price}</span>
                <span style={{ color: CREAM_DIM, fontFamily: UI_FONT, textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: 'max(9px, 0.45vw)' }}>
                  {t('resultsModal.paywall.priceNote').replace('{rate}', VAT_RATE)}
                </span>
              </div>
              <span style={{ color: ORANGE, fontFamily: BODY_FONT, fontSize: 'max(10px, 0.55vw)', marginTop: '-0.25rem' }}>
                {t('resultsModal.paywall.netPrice').replace('{net}', netPrice)}
              </span>
              {launch && (
                <span style={{ color: CREAM, fontFamily: BODY_FONT, fontSize: 'max(10px, 0.55vw)', lineHeight: 1.5 }}>
                  {t('resultsModal.paywall.launchPrice')
                    .replace('{end}', formatLaunchPriceEnd(language))
                    .replace('{regular}', formatPrice(language, REGULAR_PRICE))
                    .replace('{regularNet}', formatNetPrice(language, REGULAR_PRICE))}
                </span>
              )}
            </div>

            {body(t('resultsModal.paywall.methods'), { color: CREAM_DIM, fontSize: 'max(10px, 0.5vw)' })}

            <div style={{ borderLeft: `2px solid rgba(${CYAN_RGB}, 0.5)`, paddingLeft: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <span style={{ color: CYAN, fontFamily: UI_FONT, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: 'max(9px, 0.45vw)' }}>
                {t('resultsModal.paywall.guaranteeTitle')}
              </span>
              {body(t('resultsModal.paywall.guaranteeBody'), { fontSize: 'max(10px, 0.55vw)', lineHeight: 1.6 })}
            </div>

            {payConfig === null && body(t('resultsModal.paywall.paymentLoading'), { color: CREAM_DIM, fontSize: 'max(10px, 0.55vw)' })}

            {payConfig?.enabled && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <label htmlFor="gfl-pay-country" style={{
                    color: `rgba(${PURPLE_RGB}, 0.6)`, fontFamily: UI_FONT, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 'max(9px, 0.48vw)',
                  }}>
                    {t('resultsModal.paywall.countryLabel')}
                  </label>
                  <select
                    id="gfl-pay-country"
                    value={country}
                    onChange={(e) => { setCountry(e.target.value); setPayError(''); }}
                    onFocus={(e) => Object.assign(e.target.style, INPUT_FOCUS)}
                    onBlur={(e) => Object.assign(e.target.style, INPUT_BLUR)}
                    style={{ ...INPUT_STYLE, textAlign: 'left', letterSpacing: '0.02em', fontFamily: BODY_FONT, cursor: 'pointer' }}
                  >
                    {allowedCountries.map((c) => <option key={c} value={c} style={{ background: '#0a0510' }}>{regionName(c)}</option>)}
                    <option value={OTHER_COUNTRY} style={{ background: '#0a0510' }}>{t('resultsModal.paywall.countryOther')}</option>
                  </select>
                  {country === OTHER_COUNTRY && body(
                    t('resultsModal.paywall.countryNotAvailable').replace('{countries}', countriesLabel()),
                    { color: ORANGE, fontSize: 'max(10px, 0.55vw)' },
                  )}
                </div>

                {country !== OTHER_COUNTRY && (
                  <StripeCheckout
                    t={t}
                    language={language}
                    config={payConfig}
                    country={country}
                    price={price}
                    sealedOrbCode={sealedOrbCode}
                    email={email}
                    canPayReason={!waiverChecked ? 'consent' : ''}
                    consentText={consentText}
                    consentNode={waiver}
                    onCancel={close}
                    onStarted={onPaymentStarted}
                    onError={setPayError}
                    errorMessageFor={payErrorMessage}
                  />
                )}
                {country === OTHER_COUNTRY && actions(
                  <SciFiButton variant="white" size="md" onClick={close}>{t('resultsModal.ui.cancel')}</SciFiButton>
                )}
                {payError && (
                  <div role="alert" style={{
                    padding: '0.5rem 0.7rem', borderLeft: '2px solid rgba(239, 68, 68, 0.6)', background: 'rgba(239, 68, 68, 0.08)',
                    color: '#fca5a5', fontFamily: BODY_FONT, fontSize: 'max(10px, 0.5vw)',
                  }}>
                    {payError}
                  </div>
                )}
              </>
            )}

            {payConfig && !payConfig.enabled && (
              <>
                <div style={{ borderLeft: `2px solid rgba(${ORANGE_RGB}, 0.5)`, paddingLeft: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <span style={{ color: ORANGE, fontFamily: UI_FONT, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: 'max(9px, 0.45vw)' }}>
                    {t('resultsModal.paywall.unavailableTitle')}
                  </span>
                  {body(t('resultsModal.paywall.unavailableBody'), { fontSize: 'max(10px, 0.55vw)', lineHeight: 1.6 })}
                </div>
                {actions(
                  <>
                    <SciFiButton variant="white" size="md" onClick={close}>{t('resultsModal.ui.cancel')}</SciFiButton>
                    {/* Local development only: exercises the paid hand-over end to end. Vite strips
                        this branch from production builds (import.meta.env.DEV === false). */}
                    {import.meta.env.DEV && (
                      <SciFiButton variant="purple" size="md" onClick={() => onPaid('dev-simulated')}>
                        {t('resultsModal.paywall.devSimulate')}
                      </SciFiButton>
                    )}
                  </>
                )}
              </>
            )}

            {codeOption}
          </>
        )}

        {step === 'codeAccepted' && (
          <>
            {title(t('resultsModal.paywall.codeAcceptedTitle'))}
            {body(t('resultsModal.paywall.paidBody'))}
          </>
        )}

        {step === 'awaiting' && (
          <>
            {title(t('resultsModal.paywall.awaitingTitle'))}
            {spinner}
            {body(t(popupBlocked ? 'resultsModal.paywall.popupBlocked' : 'resultsModal.paywall.awaitingBody'), { textAlign: 'center' })}
            {body(t('resultsModal.paywall.stayOnPage'), { color: CREAM_DIM, textAlign: 'center', fontSize: 'max(10px, 0.5vw)' })}
            {actions(
              <>
                <SciFiButton variant="white" size="md" onClick={close}>{t('resultsModal.ui.cancel')}</SciFiButton>
                {redirectUrl && (
                  <SciFiButton variant="purple" size="md" onClick={() => { window.open(redirectUrl, '_blank', 'noopener'); setPopupBlocked(false); }}>
                    {t(popupBlocked ? 'resultsModal.paywall.openBankPage' : 'resultsModal.paywall.reopen')}
                  </SciFiButton>
                )}
              </>
            )}
          </>
        )}

        {step === 'processing' && (
          <>
            {title(t('resultsModal.paywall.processingTitle'))}
            {spinner}
            {body(t('resultsModal.paywall.processingBody'), { textAlign: 'center' })}
            {body(t('resultsModal.paywall.stayOnPage'), { color: CREAM_DIM, textAlign: 'center', fontSize: 'max(10px, 0.5vw)' })}
          </>
        )}

        {step === 'rejected' && (
          <>
            {title(t('resultsModal.paywall.rejectedTitle'))}
            {body(t('resultsModal.paywall.rejectedBody').replace('{countries}', countriesLabel()))}
            {actions(
              <SciFiButton variant="white" size="md" onClick={close}>{t('resultsModal.paywall.close')}</SciFiButton>
            )}
          </>
        )}

        {step === 'paid' && (
          <>
            {title(t('resultsModal.paywall.paidTitle'))}
            {body(t('resultsModal.paywall.paidBody'))}
          </>
        )}

        {step === 'failed' && (
          <>
            {title(t('resultsModal.paywall.failedTitle'))}
            {body(errorText || t('resultsModal.paywall.failedBody'))}
            {actions(
              <>
                <SciFiButton variant="white" size="md" onClick={close}>{t('resultsModal.ui.cancel')}</SciFiButton>
                <SciFiButton variant="purple" size="md" onClick={() => { setErrorText(''); setPayError(''); setStep('summary'); }}>
                  {t('resultsModal.paywall.retry')}
                </SciFiButton>
              </>
            )}
          </>
        )}
    </PopupShell>
  );
};

export default PaywallModal;
