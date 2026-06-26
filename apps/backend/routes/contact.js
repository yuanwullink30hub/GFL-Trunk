/**
 * Public contact endpoint for the "Bronnen & Verantwoording" panel.
 * Two form types land in the same inbox (config.email.contactTo):
 *   - 'dialoog' : feedback / discussion
 *   - 'bron'    : a suggested scientific source
 * No DB storage, no auth — just sends the mail. Reply-To is the submitter.
 */
const express = require('express');
const nodemailer = require('nodemailer');
const config = require('../config');

const router = express.Router();

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const row = (label, value) => value
  ? `<tr><td style="padding:4px 10px 4px 0;color:#888;vertical-align:top;white-space:nowrap"><strong>${esc(label)}</strong></td><td style="padding:4px 0">${esc(value)}</td></tr>`
  : '';

router.post('/', async (req, res) => {
  try {
    const b = req.body || {};
    const type = b.type === 'bron' ? 'bron' : 'dialoog';
    const name = (b.name || '').trim();
    const email = (b.email || '').trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Een geldig e-mailadres is vereist.' });
    }
    if (type === 'dialoog' && !(b.message || '').trim()) {
      return res.status(400).json({ error: 'Een bericht is vereist.' });
    }
    if (type === 'bron' && !(b.author || '').trim()) {
      return res.status(400).json({ error: 'Auteur/referentie is vereist.' });
    }

    if (!config.email.user || !config.email.pass) {
      return res.status(503).json({ error: 'E-mail is niet geconfigureerd op de server.' });
    }

    const transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: { user: config.email.user, pass: config.email.pass },
    });

    let subject;
    let rows;
    if (type === 'bron') {
      subject = `Bron-suggestie — ${name || email}`;
      rows = [
        row('Type', 'Nieuwe bron-suggestie'),
        row('Naam', name), row('E-mail', email),
        row('Auteur & jaar', b.author),
        row('Titel & tijdschrift', b.titleAndJournal),
        row('Wat het onderbouwt', b.underpins),
        row('Waar wij afwijken', b.deviation),
        row('Kruisrelatie / falsificatie', b.crossRelation),
        row('Zekerheidstoelichting', b.certainty),
        row('Zekerheidsniveau', b.certaintyLevel),
      ].join('');
    } else {
      subject = `Dialoog / feedback — ${name || email}`;
      rows = [
        row('Type', 'Dialoog / feedback'),
        row('Naam', name), row('E-mail', email),
        row('Refererende bron', b.sourceReference),
        row('Bericht', b.message),
      ].join('');
    }

    const html = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#222">
      <h2 style="margin:0 0 12px">Bronnen &amp; Verantwoording — ${type === 'bron' ? 'Bron-suggestie' : 'Dialoog'}</h2>
      <table style="border-collapse:collapse">${rows}</table>
    </div>`;

    await transporter.sendMail({
      from: `"Garden For Life" <${config.email.from}>`,
      to: config.email.contactTo,
      replyTo: name ? `"${name}" <${email}>` : email,
      subject,
      html,
    });

    res.json({ success: true });
  } catch (err) {
    console.error('[Contact] send error:', err.message);
    res.status(500).json({ error: 'Verzenden mislukt. Probeer het later opnieuw.' });
  }
});

module.exports = router;
