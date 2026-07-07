// Test send of the paid-report access/welcome email (services/accessEmail.js).
// Usage: node scripts/send-access-email-test.js [to] [archetype] [lang]
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const nodemailer = require('nodemailer');
const config = require('../config');
const { buildAccessEmail } = require('../services/accessEmail');

const to = process.argv[2] || 'yuanwullink30@gfl.community';
const archetype = process.argv[3] || 'De Hervormer';
const lang = process.argv[4] || 'nl';

(async () => {
  const { subject, html } = buildAccessEmail({ archetypeName: archetype, lang });
  const transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure,
    auth: { user: config.email.user, pass: config.email.pass },
  });
  await transporter.sendMail({
    from: `"Garden For Life" <${config.email.from}>`,
    to,
    subject: `[TEST] ${subject}`,
    html,
  });
  console.log(`Sent "${subject}" (${lang}) to ${to}`);
})().catch((err) => { console.error('Send failed:', err.message); process.exit(1); });
