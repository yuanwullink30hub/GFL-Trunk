/**
 * Remove everything Stripe TEST mode left in the database (after the payment gates).
 *
 * Deletes: payments with livemode:false · reportUnlocks with testmode:true · paymentRecords with
 * testmode:true · the TEST- record counters · grey-list refund entries that point at those test
 * PaymentIntents (a grey-list doc left without refunds is removed). Live data is never touched:
 * every query filters on the test markers.
 *
 * Usage (from apps/backend):  node scripts/purge-stripe-test-data.js          (dry run: counts only)
 *                             node scripts/purge-stripe-test-data.js --apply  (deletes)
 */
const { connectDB, closeDB, collections, getDB } = require('../db');

(async () => {
  const apply = process.argv.includes('--apply');
  await connectDB();
  try {
    const testUnlocks = await collections.reportUnlocks().find({ testmode: true }, { projection: { _id: 1, reference: 1 } }).toArray();
    const testRefs = testUnlocks.map((u) => u.reference).filter(Boolean);
    const counts = {
      payments: await collections.payments().countDocuments({ livemode: false }),
      reportUnlocks: testUnlocks.length,
      paymentRecords: await collections.paymentRecords().countDocuments({ testmode: true }),
      counters: await getDB().collection('counters').countDocuments({ _id: /^paymentRecord-test-/ }),
      greylistDocsTouched: testRefs.length ? await collections.refundGreylist().countDocuments({ 'refunds.reference': { $in: testRefs } }) : 0,
    };
    console.log(`${apply ? 'Deleting' : 'Would delete (dry run)'}:`, counts);
    if (!apply) return;

    await collections.payments().deleteMany({ livemode: false });
    await collections.paymentRecords().deleteMany({ testmode: true });
    await collections.reportUnlocks().deleteMany({ testmode: true });
    await getDB().collection('counters').deleteMany({ _id: /^paymentRecord-test-/ });
    if (testRefs.length) {
      await collections.refundGreylist().updateMany({ 'refunds.reference': { $in: testRefs } }, { $pull: { refunds: { reference: { $in: testRefs } } } });
      await collections.refundGreylist().deleteMany({ refunds: { $size: 0 } });
    }
    console.log('Done.');
  } finally {
    await closeDB();
  }
})().catch((e) => { console.error('Purge failed:', e.message); process.exit(1); });
