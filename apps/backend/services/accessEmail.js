// Toegangs-/welkomstmail bij de download van het volledige (betaalde) rapport.
// Taal wordt bepaald door de taal van de gemaakte test ('nl' | 'en').
// De aanhef toont het archetype ZONDER lidwoord ("De Hervormer" → "Hervormer").

const esc = (s) => String(s || '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// "De Hervormer" / "Het Kind" / "The Reformer" → objective name only
function bareArchetype(name) {
  return String(name || '').trim().replace(/^(de|het|een|the)\s+/i, '');
}

// Copy-write is EXACT (line breaks included) — render verbatim, do not reflow/rewrite.
// '' = blank line. The 2-months rule renders in the MARKED box (purple left border)
// between linesTop and linesBottom.
const COPY = {
  nl: {
    subject: (name) => `Welkom ${name} — je toegang is geactiveerd`,
    linesTop: (name) => [
      `Welkom ${name},`,
      ``,
      `Het afgelopen uur heb je alleen maar juiste keuzes gemaakt,`,
      `en nu begint het echt — allereerst, bedankt!`,
      ``,
      `Door jouw deelname kan ons platform blijven groeien in aanbod — die met jouw`,
      `unieke kristal-signatuur toegankelijk is voor 3 maanden.`,
      `Elk nieuw schaduwprofiel bevat een éénmalige code die de toegang verlengt`,
      `voor dezelfde tijd.`,
      ``,
      `3 maanden is geen random getal, wij weten dat je tijd nodig hebt om daadwerkelijk`,
      `gedrag te integreren, en willen je tegelijkertijd aanmoedigen om straks weer een nieuwe`,
      `test te maken zodat je in-lijn blijft met je missie.`,
    ],
    note: `De actuele toegang kan pas verlengd worden na 2 maanden, de verlenging tellen we uiteraard op bij de laatste geldige toegang — 2 maanden wordt dus nooit 5.`,
    linesBottom: [
      `Heb je 3 testen gemaakt?`,
      `Dan ontvang je de optie voor een abonnement.`,
      `Navigeer naar je hart en dan kom je er vanzelf wel uit, mocht je toch nog vragen hebben`,
      `weet je ons te vinden!`,
      ``,
      ``,
      `Met hartelijke hand,`,
      `Het team van Garden For Life`,
    ],
  },
  en: {
    subject: (name) => `Welcome ${name} — your access is activated`,
    linesTop: (name) => [
      `Welcome ${name},`,
      ``,
      `The past hour you've made nothing but right choices,`,
      `and now it truly begins — first of all, thank you!`,
      ``,
      `Through your participation our platform can keep growing its offering — which with your`,
      `unique crystal signature is accessible for 3 months.`,
      `Every new shadow profile contains a one-time code that extends the access`,
      `for the same period.`,
      ``,
      `3 months is no random number, we know you need time to truly`,
      `integrate behaviour, and at the same time want to encourage you to take a new`,
      `test later on so you stay in-line with your mission.`,
    ],
    note: `The current access can only be extended after 2 months, the extension is of course added to the last valid access — 2 months thus never becomes 5.`,
    linesBottom: [
      `Taken 3 tests?`,
      `Then you'll receive the option of a subscription.`,
      `Navigate by your heart and you'll figure it out, and should you still have questions`,
      `you know where to find us!`,
      ``,
      ``,
      `With a warm hand,`,
      `The Garden For Life team`,
    ],
  },
};

/**
 * @param {object} opts
 * @param {string} opts.archetypeName  e.g. "De Hervormer" (lidwoord wordt gestript)
 * @param {'nl'|'en'} [opts.lang]      taal van de gemaakte test (default 'nl')
 * @returns {{ subject: string, html: string }}
 */
function buildAccessEmail({ archetypeName, lang = 'nl' }) {
  const t = COPY[lang] || COPY.nl;
  const name = esc(bareArchetype(archetypeName));

  // Verbatim rendering: every copy line = one rendered line ('' = blank line).
  // The 2-months rule sits in the marked box between the two blocks.
  const body = `
        <p style="margin:0 0 16px;">${t.linesTop(name).join('<br>\n        ')}</p>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 16px;">
          <tr>
            <td style="background:#f8f9fa;border-left:3px solid #a855f7;border-radius:0 8px 8px 0;padding:12px 16px;">
              <p style="margin:0;font-size:13px;color:#555;line-height:1.6;">${t.note}</p>
            </td>
          </tr>
        </table>
        <p style="margin:0;">${t.linesBottom.join('<br>\n        ')}</p>`;

  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&display=swap" rel="stylesheet">
  <style>
    body, table, td { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    @media only screen and (max-width: 780px) {
      .email-container { width: 100% !important; }
      .header-cell { padding: 20px 16px !important; }
      .header-logo { height: 60px !important; }
      .header-title { font-size: 20px !important; }
      .body-cell { padding: 20px 16px !important; font-size: 14px !important; }
      .footer-cell { padding: 0 16px 20px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;width:100%;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#ffffff;">
<tr><td align="left" style="padding:0;">
  <!-- 760px (vs the house 600px): the copy-write's hard line breaks are part of the
       design — the card must be wide enough that no line soft-wraps before its <br>. -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="760" class="email-container" style="width:760px;max-width:760px;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
    <tr>
      <td class="header-cell" style="background:#121212;padding:28px 30px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td width="80" valign="middle" style="padding-right:16px;">
              <img src="https://gfl-trunk.pages.dev/images/landingpage/logo.png" alt="Garden For Life" class="header-logo" style="height:80px;width:auto;display:block;" />
            </td>
            <td valign="middle">
              <h1 class="header-title" style="color:#bc13fe;margin:0;font-size:26px;font-weight:700;letter-spacing:1.5px;font-family:'Rajdhani','Segoe UI',Tahoma,sans-serif;text-transform:uppercase;">Garden For Life</h1>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td class="body-cell" style="padding:28px 30px;line-height:1.7;color:#333;font-size:15px;">
${body}
      </td>
    </tr>
    <tr>
      <td class="footer-cell" style="padding:0 30px 24px;">
        <div style="border-top:2px solid #bc13fe;padding-top:20px;margin-top:12px;">
          <div style="font-size:12px;line-height:1.6;color:#555;">
            <div>&#9993; <a href="mailto:yuanwullink30@gfl.community" style="color:#1a73e8;text-decoration:none;">yuanwullink30@gfl.community</a></div>
            <div>&#127760; <a href="https://gardenforlife.nl/" style="color:#1a73e8;text-decoration:none;">www.gardenforlife.nl</a></div>
            <div style="margin-top:4px;font-size:11px;color:#888;">KVK: 85125245</div>
          </div>
          <div style="margin-top:16px;padding-top:12px;border-top:1px solid #eee;">
            <p style="margin:0;font-size:11px;color:#999;">&copy; ${new Date().getFullYear()} Garden For Life &middot; Alle rechten voorbehouden</p>
            <p style="margin:4px 0 0;font-size:10px;color:#bbb;">Dit bericht is verstuurd vanuit het Garden For Life Verbindingscentrum</p>
          </div>
        </div>
      </td>
    </tr>
  </table>
</td></tr>
</table>
</body>
</html>`;

  return { subject: t.subject(name), html };
}

module.exports = { buildAccessEmail, bareArchetype };
