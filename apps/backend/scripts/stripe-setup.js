/**
 * Stripe setup for the full report ("Essentie") — idempotent, safe to run repeatedly.
 *
 * Creates (or finds) ONE Product with the electronically-supplied-services tax code and the two
 * tax-inclusive EUR Prices, identified by lookup key:
 *   essentie_launch  € 14,52 incl. BTW  (until flipAt, services/paymentConfig.js)
 *   essentie_normal  € 36,30 incl. BTW  (from flipAt)
 * and prints the env lines for apps/backend/.env.
 *
 * Run once with the TEST secret key now, and again with the LIVE key when the account is
 * activated — same lookup keys, different price IDs.
 *
 * Usage (from apps/backend):  node scripts/stripe-setup.js            (uses STRIPE_SECRET_KEY from .env)
 *                             node scripts/stripe-setup.js --dry-run  (only reports what exists)
 *
 * Prices are immutable in Stripe: if a lookup key exists with a different amount, the script
 * stops and says so rather than guessing.
 */
const Stripe = require('stripe');
const config = require('../config');
const { API_VERSION } = require('../services/stripe');

const PRODUCT_MARKER = 'essentie';
const TAX_CODE = 'txcd_10000000'; // General - Electronically Supplied Services
const PRICES = [
  { lookupKey: 'essentie_launch', unitAmount: 1452, nickname: 'Essentie — introductieprijs (incl. BTW)', env: 'STRIPE_PRICE_LAUNCH' },
  { lookupKey: 'essentie_normal', unitAmount: 3630, nickname: 'Essentie — normale prijs (incl. BTW)', env: 'STRIPE_PRICE_NORMAL' },
];

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  if (!config.stripe.secretKey) {
    console.error('STRIPE_SECRET_KEY is not set (apps/backend/.env).');
    process.exit(1);
  }
  const stripe = new Stripe(config.stripe.secretKey, { apiVersion: API_VERSION });
  const mode = config.stripe.secretKey.startsWith('sk_live_') ? 'LIVE' : 'TEST';
  console.log(`Stripe ${mode} mode${dryRun ? ' (dry run)' : ''}`);

  // Existing prices by lookup key tell us the product too.
  const existing = await stripe.prices.list({ lookup_keys: PRICES.map((p) => p.lookupKey), expand: ['data.product'], limit: 10 });
  const byKey = new Map(existing.data.map((p) => [p.lookup_key, p]));

  let product = existing.data.find((p) => p.product && typeof p.product === 'object')?.product || null;
  if (!product) {
    const found = await stripe.products.search({ query: `metadata['gfl_product']:'${PRODUCT_MARKER}'` }).catch(() => ({ data: [] }));
    product = found.data[0] || null;
  }
  if (!product) {
    if (dryRun) { console.log('Product: missing (would create)'); } else {
      product = await stripe.products.create({
        name: 'Essentie — volledig rapport',
        description: 'Het volledige Garden For Life rapport: alle secties, de AI-prompt en de kristal-code.',
        tax_code: TAX_CODE,
        metadata: { gfl_product: PRODUCT_MARKER },
      });
      console.log(`Product created: ${product.id}`);
    }
  } else {
    console.log(`Product: ${product.id} (tax_code ${product.tax_code || 'none'})`);
    if (product.tax_code !== TAX_CODE && !dryRun) {
      product = await stripe.products.update(product.id, { tax_code: TAX_CODE });
      console.log(`Product tax_code set to ${TAX_CODE}`);
    }
  }

  const envLines = [];
  for (const spec of PRICES) {
    const price = byKey.get(spec.lookupKey);
    if (price) {
      const ok = price.unit_amount === spec.unitAmount && price.currency === 'eur' && price.tax_behavior === 'inclusive' && price.active;
      console.log(`Price ${spec.lookupKey}: ${price.id} — ${price.unit_amount} ${price.currency} ${price.tax_behavior}${price.active ? '' : ' (INACTIVE)'} ${ok ? '✓' : '✗ MISMATCH'}`);
      if (!ok) {
        console.error(`  Expected ${spec.unitAmount} eur inclusive and active. Prices are immutable: create a new one with this lookup key (transfer_lookup_key) in the Dashboard, then rerun.`);
        process.exitCode = 1;
      }
      envLines.push(`${spec.env}=${price.id}`);
      continue;
    }
    if (dryRun || !product) { console.log(`Price ${spec.lookupKey}: missing (would create)`); continue; }
    const created = await stripe.prices.create({
      product: product.id,
      currency: 'eur',
      unit_amount: spec.unitAmount,
      tax_behavior: 'inclusive',
      lookup_key: spec.lookupKey,
      nickname: spec.nickname,
    });
    console.log(`Price ${spec.lookupKey} created: ${created.id}`);
    envLines.push(`${spec.env}=${created.id}`);
  }

  if (envLines.length) {
    console.log('\nPut these in apps/backend/.env:');
    envLines.forEach((l) => console.log(`  ${l}`));
  }
  console.log('\nDashboard checklist: enable iDEAL + cards · Stripe Tax on with the NL registration · register the payment method domain (Apple/Google Pay) · webhook endpoint → STRIPE_WEBHOOK_SECRET');
}

main().catch((e) => { console.error('Stripe setup failed:', e.message); process.exit(1); });
