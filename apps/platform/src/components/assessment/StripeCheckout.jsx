import React, { useMemo, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js/pure';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { SciFiButton } from '@gfl/ui';
import { TERMS_VERSION } from '../../config/pricing';
import { payFullReport } from '../../services/paymentService';

/**
 * StripeCheckout — the Payment Element inside the paywall (Essentie).
 *
 * Server-side confirmation: the Element produces a ConfirmationToken, the backend checks the
 * country gate / consent / report and creates + confirms the PaymentIntent
 * (apps/backend/services/payments.js). Why not stripe.confirmPayment: for iDEAL it redirects THIS
 * tab to the bank, and the report only lives in this tab's memory. Instead:
 *   - redirect methods (iDEAL…): a window is opened synchronously on click (popup blockers) and sent
 *     to the bank URL the server returns; this tab keeps the report and polls;
 *   - cards: 3D Secure runs in-page via stripe.handleNextAction (a modal, no redirect).
 *
 * The browser never sends the email to Stripe (the Element does not collect it) and Stripe.js is
 * loaded from js.stripe.com on first use (`/pure`), not bundled.
 */

const CYAN_RGB = '34, 211, 238';
const PURPLE_RGB = '168, 85, 247';

// Payment methods that leave the page for the bank / provider.
const REDIRECT_METHODS = new Set(['ideal', 'bancontact', 'eps', 'p24', 'klarna', 'paypal', 'revolut_pay', 'amazon_pay', 'twint', 'mobilepay']);

const stripePromises = new Map();
function getStripePromise(publishableKey) {
  if (!stripePromises.has(publishableKey)) stripePromises.set(publishableKey, loadStripe(publishableKey));
  return stripePromises.get(publishableKey);
}

// Elements Appearance API, from gfl-design-tokens.json: void background, cream Figtree text, Lexend Mega
// labels, 0.15rem radius, cyan input focus (matches the activation-code field), purple selection.
const APPEARANCE = {
  theme: 'night',
  variables: {
    colorPrimary: '#a855f7',
    colorBackground: '#07030b',
    colorText: '#FFFEF0',
    colorTextSecondary: '#9e9d94',
    colorTextPlaceholder: '#6f6e68',
    colorDanger: '#fca5a5',
    colorIcon: '#b3b2aa',
    fontFamily: "'Figtree', sans-serif",
    fontSizeBase: '14px',
    borderRadius: '2px',
    spacingUnit: '3px',
  },
  rules: {
    '.Input': { backgroundColor: 'rgba(0, 0, 0, 0.4)', border: `1px solid rgba(${CYAN_RGB}, 0.2)`, boxShadow: 'none' },
    '.Input:focus': { border: `1px solid rgba(${CYAN_RGB}, 0.5)`, boxShadow: `0 0 15px rgba(${CYAN_RGB}, 0.15)` },
    '.Label': { fontFamily: "'Lexend Mega', sans-serif", textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '10px', color: `rgba(${PURPLE_RGB}, 0.6)` },
    '.AccordionItem': { backgroundColor: 'rgba(2, 0, 3, 0.3)', border: `1px solid rgba(${PURPLE_RGB}, 0.2)`, boxShadow: 'none' },
    '.AccordionItem--selected': { border: `1px solid rgba(${PURPLE_RGB}, 0.5)` },
  },
};
const FONTS = [{ cssSrc: 'https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600&family=Lexend+Mega:wght@700&display=swap' }];

function CheckoutForm({
  t, language, config, country, canPayReason, consentText, sealedOrbCode, email, price,
  cancelLabel, onCancel, onStarted, onError, errorMessageFor,
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [ready, setReady] = useState(false);
  const [complete, setComplete] = useState(false);
  const [methodType, setMethodType] = useState('');
  const [busy, setBusy] = useState(false);

  const canPay = !!stripe && !!elements && ready && complete && !canPayReason && !busy;

  const pay = async () => {
    if (!canPay) return;
    // Opened inside the click so no popup blocker stops it; only for methods that need it.
    let win = null;
    if (REDIRECT_METHODS.has(methodType)) {
      win = window.open('', '_blank');
      try {
        if (win) {
          win.document.title = 'Garden For Life';
          win.document.body.style.cssText = 'margin:0;height:100vh;display:grid;place-items:center;background:#0a0510;color:#FFFEF0;font-family:Figtree,sans-serif';
          win.document.body.textContent = t('resultsModal.paywall.paying');
        }
      } catch { /* cross-origin quirks: the window still navigates below */ }
    }
    const fail = (message) => {
      try { win?.close(); } catch { /* already closed */ }
      setBusy(false);
      onError(message);
    };

    setBusy(true);
    onError('');
    const { error: submitError } = await elements.submit();
    if (submitError) return fail(submitError.message);
    const { error: tokenError, confirmationToken } = await stripe.createConfirmationToken({ elements });
    if (tokenError) return fail(tokenError.message);

    const res = await payFullReport({
      confirmationTokenId: confirmationToken.id,
      sealedOrbCode,
      email,
      country,
      consent: true,
      consentText,
      termsVersion: TERMS_VERSION,
      language,
    });
    if (res.error) return fail(errorMessageFor(res));

    if (res.status === 'requires_action' && res.redirectUrl) {
      const blocked = !win || win.closed;
      if (!blocked) {
        try { win.opener = null; } catch { /* ignore */ }
        win.location.href = res.redirectUrl;
      }
      setBusy(false);
      return onStarted({ ref: res.ref, redirectUrl: res.redirectUrl, popupBlocked: blocked });
    }
    try { win?.close(); } catch { /* not opened */ }

    if (res.status === 'requires_action' && res.clientSecret) {
      const { error: actionError } = await stripe.handleNextAction({ clientSecret: res.clientSecret });
      setBusy(false);
      return onStarted({ ref: res.ref, message: actionError?.message || '' });
    }
    setBusy(false);
    return onStarted({ ref: res.ref });
  };

  return (
    <>
      <div style={{ minHeight: ready ? undefined : '3rem' }}>
        {!ready && (
          <p style={{ margin: 0, color: 'rgba(255, 254, 240, 0.5)', fontFamily: "'Figtree', sans-serif", fontSize: 'max(10px, 0.55vw)' }}>
            {t('resultsModal.paywall.paymentLoading')}
          </p>
        )}
        <PaymentElement
          key={country}
          options={{
            layout: { type: 'accordion', defaultCollapsed: false, radios: 'always', spacedAccordionItems: false },
            defaultValues: { billingDetails: { address: { country } } },
            business: { name: 'Garden For Life' },
            terms: { card: 'never', ideal: 'never' },
          }}
          onReady={() => setReady(true)}
          onChange={(e) => { setComplete(!!e.complete); setMethodType(e.value?.type || ''); }}
        />
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap', marginTop: '0.25rem' }}>
        <SciFiButton variant="white" size="md" onClick={onCancel} disabled={busy}>{cancelLabel || t('resultsModal.ui.cancel')}</SciFiButton>
        <SciFiButton variant="purple" size="lg" onClick={pay} disabled={!canPay}>
          {busy ? t('resultsModal.paywall.paying') : `${t('resultsModal.paywall.pay')} ${price}`}
        </SciFiButton>
      </div>
    </>
  );
}

/**
 * The report lives only in this tab's memory, so a Stripe.js failure (an IntegrationError thrown while
 * the Element mounts, a failed script load) must not unmount the report with it: the paywall shows
 * the generic payment error instead and the customer can close it.
 */
class PaymentFormBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error('[Payments] Payment form failed:', error);
    this.props.onError(this.props.t('resultsModal.paywall.paymentError'));
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
        <SciFiButton variant="white" size="md" onClick={this.props.onCancel}>{this.props.cancelLabel || this.props.t('resultsModal.ui.cancel')}</SciFiButton>
      </div>
    );
  }
}

export default function StripeCheckout(props) {
  const { config, language, t, onError, onCancel, cancelLabel } = props;
  const stripePromise = useMemo(() => getStripePromise(config.publishableKey), [config.publishableKey]);
  const options = useMemo(() => ({
    mode: 'payment',
    amount: config.grossCents,
    currency: String(config.currency || 'EUR').toLowerCase(),
    paymentMethodCreation: 'manual',
    appearance: APPEARANCE,
    fonts: FONTS,
    locale: language === 'en' ? 'en' : 'nl',
  }), [config.grossCents, config.currency, language]);

  return (
    <PaymentFormBoundary t={t} onError={onError} onCancel={onCancel} cancelLabel={cancelLabel}>
      <Elements stripe={stripePromise} options={options}>
        <CheckoutForm {...props} />
      </Elements>
    </PaymentFormBoundary>
  );
}
