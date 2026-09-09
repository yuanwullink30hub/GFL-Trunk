import React from 'react';

/**
 * Shared presentation primitives for the policy documents.
 * Both the Dutch (policyContent.jsx) and English (policyContent.en.jsx)
 * document sets render through these, so the two stay visually identical.
 */
const S = {
  h2: { color: '#a855f7', fontSize: '1.1rem', marginTop: '1.75rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Lexend Mega', sans-serif", fontWeight: 'bold' },
  h3: { color: '#c4b5fd', fontSize: '0.9rem', marginTop: '1.25rem', marginBottom: '0.5rem', fontFamily: "'Lexend Mega', sans-serif", fontWeight: 'bold' },
  p: { marginBottom: '0.75rem', color: '#cbd5e1', fontFamily: "'Figtree', sans-serif", fontSize: '0.85rem', lineHeight: 1.8 },
  ul: { marginLeft: '1.5rem', marginBottom: '0.75rem', listStyleType: 'disc' },
  ol: { marginLeft: '1.5rem', marginBottom: '0.75rem' },
  li: { marginBottom: '0.35rem', color: '#cbd5e1', fontFamily: "'Figtree', sans-serif", fontSize: '0.85rem', lineHeight: 1.6 },
  strong: { color: '#c4b5fd' },
  updated: { color: '#94a3b8', fontSize: '0.75rem', marginBottom: '1.5rem', fontStyle: 'italic', fontFamily: "'Figtree', sans-serif" },
  box: { background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: '0.35rem', padding: '1rem', margin: '1rem 0' },
  warn: { background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: '0.35rem', padding: '1rem', margin: '1rem 0' },
  table: { width: '100%', borderCollapse: 'collapse', margin: '1rem 0', fontSize: '0.8rem' },
  th: { border: '1px solid rgba(168,85,247,0.2)', padding: '0.5rem', textAlign: 'left', color: '#c4b5fd', fontWeight: 'bold', background: 'rgba(168,85,247,0.1)', fontFamily: "'Figtree', sans-serif", fontSize: '0.8rem' },
  td: { border: '1px solid rgba(168,85,247,0.2)', padding: '0.5rem', color: '#cbd5e1', fontFamily: "'Figtree', sans-serif", fontSize: '0.8rem' },
};

const PolicyLink = ({ to, children }) => (
  <span
    role="link"
    tabIndex={0}
    style={{ color: '#c4b5fd', cursor: 'pointer', textDecoration: 'underline' }}
    onClick={(e) => { e.preventDefault(); window.history.pushState(null, '', to); window.dispatchEvent(new PopStateEvent('popstate')); }}
    onKeyDown={(e) => { if (e.key === 'Enter') { window.history.pushState(null, '', to); window.dispatchEvent(new PopStateEvent('popstate')); } }}
  >{children}</span>
);

/**
 * All copy for RetentionForm, as { nl, en } pairs.
 * The language is handed in as a prop by the two document sets, so this file
 * deliberately does not touch the i18n hook.
 */
const RETENTION_COPY = {
  subjectPrefix: { nl: 'Verwijderingsverzoek', en: 'Erasure request' },
  subjectPlaceholder: { nl: '[uw e-mailadres]', en: '[your email address]' },
  title: { nl: 'Garden For Life — Uw data, uw rechten', en: 'Garden For Life — Your data, your rights' },
  version: { nl: 'Versiedatum: 27 september 2026', en: 'Version date: 27 September 2026' },
  versionNo: { nl: 'Versie 1.0', en: 'Version 1.0' },
  langLabel: { nl: 'Taal: Nederlands', en: 'Language: English' },
  intro: {
    nl: 'U heeft het recht uw gegevens in te zien, te corrigeren of te laten verwijderen. Op deze pagina vindt u een volledig overzicht van wat wij bewaren, hoe lang, en hoe u een verwijderingsverzoek kunt indienen. Wij verwerken uw verzoek binnen 30 dagen.',
    en: 'You have the right to access, correct or have your data erased. On this page you will find a full overview of what we retain, for how long, and how you can submit an erasure request. We process your request within 30 days.',
  },
  h2Submit: { nl: 'Direct een Verwijderingsverzoek Indienen', en: 'Submit an Erasure Request Directly' },
  submitLead: { nl: 'Wilt u uw gegevens laten verwijderen? Stuur een e-mail naar:', en: 'Would you like your data erased? Send an email to:' },
  subjectLabel: { nl: 'Onderwerp: Verwijderingsverzoek —', en: 'Subject: Erasure request —' },
  emailPlaceholder: { nl: 'uw@e-mailadres.nl', en: 'your@email-address.com' },
  openEmail: { nl: 'E-MAIL OPENEN →', en: 'OPEN EMAIL →' },
  hint: {
    nl: 'Vul uw e-mailadres in om het onderwerp automatisch in te vullen, en klik op "E-MAIL OPENEN".',
    en: 'Enter your email address to fill in the subject line automatically, then click "OPEN EMAIL".',
  },
  stateInEmail: { nl: 'Vermeld in uw e-mail:', en: 'State in your email:' },
  stateItem1: { nl: 'Het e-mailadres waarmee u bent geregistreerd', en: 'The email address you registered with' },
  stateItem2: {
    nl: 'Wat u wilt laten verwijderen — uw volledige account, alleen het rapport, of specifieke gegevens',
    en: 'What you want erased — your entire account, only the report, or specific data',
  },
  stateItem3: { nl: 'Optioneel: de reden voor uw verzoek', en: 'Optional: the reason for your request' },
  confirmA: { nl: 'Garden For Life bevestigt ontvangst binnen ', en: 'Garden For Life confirms receipt within ' },
  confirmDays: { nl: '2 werkdagen', en: '2 working days' },
  confirmB: { nl: ' en voert de verwijdering uit binnen ', en: ' and carries out the erasure within ' },
  confirmThirty: { nl: '30 dagen', en: '30 days' },
  confirmC: { nl: '. U ontvangt een bevestiging zodra uw gegevens zijn verwijderd.', en: '. You will receive a confirmation once your data has been erased.' },

  h2What: { nl: '1. Wat Bewaren Wij en Hoe Lang?', en: '1. What Do We Retain and For How Long?' },
  whatLead: {
    nl: 'Garden For Life maakt onderscheid tussen twee typen opslag: gegevens op onze servers en gegevens in uw eigen browser.',
    en: 'Garden For Life distinguishes between two types of storage: data on our servers and data in your own browser.',
  },
  h3Server: { nl: '1.1 Serveropslag — Gegevens bij Garden For Life', en: '1.1 Server Storage — Data Held by Garden For Life' },
  thCategory: { nl: 'Categorie', en: 'Category' },
  thRetention: { nl: 'Bewaartermijn', en: 'Retention period' },
  thOnDeletion: { nl: 'Wat gebeurt er bij verwijdering?', en: 'What happens on erasure?' },
  srvRow1a: { nl: 'E-mailadres & accountgegevens', en: 'Email address & account data' },
  srvRow1b: { nl: 'Zolang uw account actief is', en: 'For as long as your account is active' },
  srvRow1c: { nl: 'Permanent verwijderd binnen 30 dagen na verzoek', en: 'Permanently erased within 30 days of the request' },
  srvRow2a: { nl: 'Assessmentdata (responses, scores, archetypeDetails)', en: 'Assessment data (responses, scores, archetypeDetails)' },
  srvRow2b: { nl: 'Niet opgeslagen na rapportgeneratie', en: 'Not stored after report generation' },
  srvRow2c: { nl: 'Maximaal 24 uur — elke nacht om 00:00 automatisch gewist', en: 'A maximum of 24 hours — erased automatically each night at 00:00' },
  srvRow3a: { nl: 'Volledig rapport', en: 'Full report' },
  srvRow3b: { nl: 'Éénmalig downloadbaar', en: 'Downloadable once' },
  srvRow3c: { nl: 'Niet bewaard na download', en: 'Not retained after download' },
  srvRow4a: { nl: 'Gedeeltelijk profiel — archetype-naam, orb-geometrie, vormvector, kaartteksten', en: 'Partial profile — archetype name, orb geometry, shape vector, card texts' },
  srvRow4b: { nl: 'Zolang het account actief is', en: 'For as long as the account is active' },
  srvRow4c: { nl: 'Permanent verwijderd binnen 30 dagen na verzoek', en: 'Permanently erased within 30 days of the request' },
  srvRow5a: { nl: 'Toestemmingsregistratie', en: 'Consent record' },
  srvRow5b: { nl: 'Zolang het account bestaat', en: 'For as long as the account exists' },
  srvRow5c: { nl: 'Verwijderd bij accountverwijdering', en: 'Deleted when the account is deleted' },

  h3Local: { nl: '1.2 Lokale Browseropslag — Gegevens op Uw Eigen Apparaat', en: '1.2 Local Browser Storage — Data on Your Own Device' },
  localLeadA: { nl: 'Garden For Life gebruikt geen HTTP-cookies maar wel ', en: 'Garden For Life does not use HTTP cookies, but it does use ' },
  localLeadB: {
    nl: ' — browseropslag die uitsluitend op uw apparaat staat. Garden For Life heeft geen toegang tot deze gegevens en kan ze ook niet voor u verwijderen.',
    en: ' — browser storage that resides solely on your device. Garden For Life has no access to this data and cannot erase it for you either.',
  },
  thKey: { nl: 'Sleutel', en: 'Key' },
  thHowDelete: { nl: 'Hoe verwijderen?', en: 'How to delete?' },
  locRow1a: { nl: 'gfl_token (inlogtoken)', en: 'gfl_token (login token)' },
  locRow1b: { nl: 'Tot uitloggen', en: 'Until logout' },
  locRow1c: { nl: 'Automatisch bij uitloggen', en: 'Automatically on logout' },
  locRow2a: { nl: 'gfl_assessment_session', en: 'gfl_assessment_session' },
  locRow2b: { nl: 'Tot nieuwe assessment', en: 'Until a new assessment' },
  locRow2c: { nl: 'Automatisch overschreven', en: 'Automatically overwritten' },
  locRow3a: { nl: 'gfl_assessment_history', en: 'gfl_assessment_history' },
  locRow3b: { nl: 'Lokaal permanent', en: 'Permanent locally' },
  locRow3c: { nl: 'Zelf wissen via browserinstellingen', en: 'Erase yourself via your browser settings' },
  locRow4a: { nl: 'Werkruimtedata (notities, contacten, agenda)', en: 'Workspace data (notes, contacts, calendar)' },
  locRow4b: { nl: 'Lokaal permanent', en: 'Permanent locally' },
  locRow4c: { nl: 'Zelf wissen via browserinstellingen', en: 'Erase yourself via your browser settings' },
  clearLead: { nl: 'Lokale opslag wissen via uw browser:', en: 'Clearing local storage via your browser:' },
  chrome: {
    nl: 'Instellingen → Privacy en beveiliging → Browsegegevens verwijderen → Cookies en andere sitegegevens → gardenforlife.nl',
    en: 'Settings → Privacy and security → Delete browsing data → Cookies and other site data → gardenforlife.nl',
  },
  firefox: {
    nl: 'Instellingen → Privacy & Beveiliging → Cookies en sitegegevens → gardenforlife.nl → Verwijder',
    en: 'Settings → Privacy & Security → Cookies and Site Data → gardenforlife.nl → Remove',
  },
  safari: {
    nl: 'Voorkeuren → Privacy → Beheer websitegegevens → gardenforlife.nl → Verwijder',
    en: 'Preferences → Privacy → Manage Website Data → gardenforlife.nl → Remove',
  },
  edge: {
    nl: 'Instellingen → Privacy, zoeken en services → Browsegegevens wissen',
    en: 'Settings → Privacy, search and services → Clear browsing data',
  },
  warnLabel: { nl: 'Let op:', en: 'Please note:' },
  warnBody: {
    nl: ' het wissen van lokale opslag verwijdert ook uw inlogstatus, werkruimtedata en assessmentgeschiedenis. Deze gegevens zijn daarna niet herstelbaar — ook niet door Garden For Life.',
    en: ' clearing local storage also removes your login status, workspace data and assessment history. This data cannot be recovered afterwards — not even by Garden For Life.',
  },

  h2Rights: { nl: '2. Al Uw Rechten op een Rij', en: '2. All Your Rights at a Glance' },
  rightsLeadA: { nl: 'Op grond van de AVG heeft u de volgende rechten. U kunt ze allemaal uitoefenen via ', en: 'Under the GDPR you have the following rights. You can exercise all of them via ' },
  rightsLeadB: { nl: ':', en: ':' },
  thRight: { nl: 'Recht', en: 'Right' },
  thWhatCanYouDo: { nl: 'Wat kunt u doen?', en: 'What can you do?' },
  thTerm: { nl: 'Termijn', en: 'Time limit' },
  within30: { nl: 'Binnen 30 dagen', en: 'Within 30 days' },
  rgt1a: { nl: 'Inzage (Art. 15)', en: 'Access (Art. 15)' },
  rgt1b: { nl: 'Opvragen welke servergegevens wij over u hebben opgeslagen', en: 'Request which server data we have stored about you' },
  rgt2a: { nl: 'Rectificatie (Art. 16)', en: 'Rectification (Art. 16)' },
  rgt2b: { nl: 'Onjuiste gegevens laten corrigeren', en: 'Have inaccurate data corrected' },
  rgt3a: { nl: 'Verwijdering (Art. 17)', en: 'Erasure (Art. 17)' },
  rgt3b: { nl: 'Uw volledige account en serverdata laten verwijderen', en: 'Have your entire account and server data erased' },
  rgt4a: { nl: 'Beperking (Art. 18)', en: 'Restriction (Art. 18)' },
  rgt4b: { nl: 'Verwerking tijdelijk laten pauzeren tijdens een bezwaarprocedure', en: 'Have processing temporarily paused during an objection procedure' },
  rgt5a: { nl: 'Dataportabiliteit (Art. 20)', en: 'Data portability (Art. 20)' },
  rgt5b: { nl: 'Uw opgeslagen serverdata opvragen als JSON-bestand', en: 'Request your stored server data as a JSON file' },
  rgt6a: { nl: 'Bezwaar (Art. 21)', en: 'Objection (Art. 21)' },
  rgt6b: { nl: 'Bezwaar maken tegen verwerking op basis van gerechtvaardigd belang', en: 'Object to processing on the basis of legitimate interest' },
  rgt7a: { nl: 'Toestemming intrekken (Art. 7 & 9)', en: 'Withdrawal of consent (Art. 7 & 9)' },
  rgt7b: { nl: 'Toestemming voor verwerking van psychologische profieldata intrekken', en: 'Withdraw consent for the processing of psychological profile data' },
  rgt7c: { nl: 'Direct van kracht — data verwijderd binnen 30 dagen', en: 'Effective immediately — data erased within 30 days' },
  complaintA: {
    nl: 'Klacht indienen: Bent u niet tevreden met hoe Garden For Life omgaat met uw gegevens? U kunt een klacht indienen bij de ',
    en: 'Lodging a complaint: Are you dissatisfied with how Garden For Life handles your data? You can lodge a complaint with the ',
  },
  authority: { nl: 'Autoriteit Persoonsgegevens', en: 'Dutch Data Protection Authority (Autoriteit Persoonsgegevens)' },
  complaintB: { nl: ' via ', en: ' via ' },
  complaintC: { nl: ' of 088 – 1805 250.', en: ' or 088 – 1805 250.' },

  h2Delete: { nl: '3. Uw Volledige Account Verwijderen', en: '3. Deleting Your Entire Account' },
  deleteLead: {
    nl: 'Bij een volledig accountverwijderingsverzoek verwijdert Garden For Life het volgende van onze servers:',
    en: 'On a full account deletion request, Garden For Life deletes the following from our servers:',
  },
  del1: { nl: 'Uw e-mailadres en accountgegevens', en: 'Your email address and account data' },
  del2: { nl: 'Uw gedeeltelijke profiel — archetype-naam, orb-geometrie, vormvector en kaartteksten', en: 'Your partial profile — archetype name, orb geometry, shape vector and card texts' },
  del3: { nl: 'De hash van elke aan uw account gekoppelde kristal-code, waarna de code van uw PDF weer inwisselbaar wordt', en: 'The hash of every crystal code linked to your account, after which the code in your PDF becomes redeemable again' },
  del4: { nl: 'Uw openbare kaart en verbindingen, uw verzonden en ontvangen berichten, uw feedbackinzendingen en alle gekoppelde toestemmingsregistraties', en: 'Your public card and connections, the messages you sent and received, your feedback submissions and all linked consent records' },
  notAuto: { nl: 'Wat niet automatisch wordt verwijderd bij accountverwijdering:', en: 'What is not automatically deleted on account deletion:' },
  notAutoItem: {
    nl: 'Uw lokale browseropslag (localStorage) — dit staat op uw eigen apparaat en kunt u zelf wissen zoals beschreven in Artikel 1.2',
    en: 'Your local browser storage (localStorage) — this resides on your own device and you can erase it yourself as described in Article 1.2',
  },
  notAutoItem2: {
    nl: 'Uw lokale werkmap en het gedownloade rapport — deze staan op uw eigen apparaat. Wij hebben er geen toegang toe en kunnen ze dus ook niet verwijderen; dat doet u zelf door de map te wissen.',
    en: 'Your local working folder and the report you downloaded — these are on your own device. We have no access to them and therefore cannot delete them; you remove them yourself by erasing the folder.',
  },
  afterDeletion: {
    nl: 'Na volledige verwijdering ontvangt u een bevestigingse-mail. Uw account kan daarna niet worden hersteld.',
    en: 'After full deletion you will receive a confirmation email. Your account cannot be restored afterwards.',
  },
  boxA: { nl: 'Wilt u uw data laten verwijderen? Dien een verwijderingsverzoek in via ', en: 'Would you like your data erased? Submit an erasure request via ' },
  boxB: {
    nl: ' — wij verwijderen uw data binnen 30 dagen na ontvangst van uw verzoek.',
    en: ' — we erase your data within 30 days of receiving your request.',
  },
};

const RetentionForm = ({ language = 'nl' }) => {
  const L = language === 'en' ? 'en' : 'nl';
  const t = (key) => RETENTION_COPY[key][L];
  const [email, setEmail] = React.useState('');
  const fullSubject = `${t('subjectPrefix')} — ${email || t('subjectPlaceholder')}`;
  const mailtoHref = `mailto:yuanwullink30@gfl.community?subject=${encodeURIComponent(fullSubject)}`;
  const cyanBox = { background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: '0.5rem', padding: '1.25rem', margin: '1rem 0' };
  return (
    <>
      <h2 style={{ color: '#e2e8f0', fontSize: '1.05rem', marginBottom: '0.3rem', fontFamily: "'Lexend Mega', sans-serif", fontWeight: 'bold', textTransform: 'none', letterSpacing: '0.01em' }}>{t('title')}</h2>
      <p style={S.updated}>{t('version')}&nbsp;&nbsp;|&nbsp;&nbsp;{t('versionNo')}&nbsp;&nbsp;|&nbsp;&nbsp;{t('langLabel')}</p>
      <p style={S.p}>{t('intro')}</p>

      <h2 style={S.h2}>{t('h2Submit')}</h2>
      <p style={S.p}>{t('submitLead')}</p>
      <div style={cyanBox}>
        <p style={{ ...S.p, margin: '0 0 0.5rem', color: '#00d4ff', fontWeight: 'bold' }}>📧 yuanwullink30@gfl.community</p>
        <p style={{ ...S.p, margin: '0 0 0.75rem' }}>{t('subjectLabel')} <strong style={S.strong}>{t('subjectPlaceholder')}</strong></p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.5rem 0 0.75rem' }}>
          <input
            type="email"
            placeholder={t('emailPlaceholder')}
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ flex: 1, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0,212,255,0.35)', borderRadius: '0.35rem', padding: '0.5rem 0.75rem', color: '#e2e8f0', fontFamily: "'Figtree', sans-serif", fontSize: '0.82rem', outline: 'none' }}
          />
          <a
            href={mailtoHref}
            style={{ display: 'inline-block', background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.4)', borderRadius: '0.35rem', padding: '0.5rem 1rem', color: '#00d4ff', fontFamily: "'Lexend Mega', sans-serif", fontSize: '0.72rem', textDecoration: 'none', whiteSpace: 'nowrap' }}
          >
            {t('openEmail')}
          </a>
        </div>
        <p style={{ ...S.p, margin: 0, fontSize: '0.76rem', color: '#94a3b8' }}>{t('hint')}</p>
      </div>
      <p style={S.p}>{t('stateInEmail')}</p>
      <ul style={S.ul}>
        <li style={S.li}>{t('stateItem1')}</li>
        <li style={S.li}>{t('stateItem2')}</li>
        <li style={S.li}>{t('stateItem3')}</li>
      </ul>
      <p style={S.p}>{t('confirmA')}<strong style={S.strong}>{t('confirmDays')}</strong>{t('confirmB')}<strong style={S.strong}>{t('confirmThirty')}</strong>{t('confirmC')}</p>

      <h2 style={S.h2}>{t('h2What')}</h2>
      <p style={S.p}>{t('whatLead')}</p>

      <h3 style={S.h3}>{t('h3Server')}</h3>
      <table style={S.table}>
        <thead><tr><th style={S.th}>{t('thCategory')}</th><th style={S.th}>{t('thRetention')}</th><th style={S.th}>{t('thOnDeletion')}</th></tr></thead>
        <tbody>
          <tr><td style={S.td}>{t('srvRow1a')}</td><td style={S.td}>{t('srvRow1b')}</td><td style={S.td}>{t('srvRow1c')}</td></tr>
          <tr><td style={S.td}>{t('srvRow2a')}</td><td style={S.td}>{t('srvRow2b')}</td><td style={S.td}>{t('srvRow2c')}</td></tr>
          <tr><td style={S.td}>{t('srvRow3a')}</td><td style={S.td}>{t('srvRow3b')}</td><td style={S.td}>{t('srvRow3c')}</td></tr>
          <tr><td style={S.td}>{t('srvRow4a')}</td><td style={S.td}>{t('srvRow4b')}</td><td style={S.td}>{t('srvRow4c')}</td></tr>
          <tr><td style={S.td}>{t('srvRow5a')}</td><td style={S.td}>{t('srvRow5b')}</td><td style={S.td}>{t('srvRow5c')}</td></tr>
        </tbody>
      </table>

      <h3 style={{ ...S.h3, marginTop: '1.5rem' }}>{t('h3Local')}</h3>
      <p style={S.p}>{t('localLeadA')}<strong style={S.strong}>localStorage</strong>{t('localLeadB')}</p>
      <table style={S.table}>
        <thead><tr><th style={S.th}>{t('thKey')}</th><th style={S.th}>{t('thRetention')}</th><th style={S.th}>{t('thHowDelete')}</th></tr></thead>
        <tbody>
          <tr><td style={S.td}>{t('locRow1a')}</td><td style={S.td}>{t('locRow1b')}</td><td style={S.td}>{t('locRow1c')}</td></tr>
          <tr><td style={S.td}>{t('locRow2a')}</td><td style={S.td}>{t('locRow2b')}</td><td style={S.td}>{t('locRow2c')}</td></tr>
          <tr><td style={S.td}>{t('locRow3a')}</td><td style={S.td}>{t('locRow3b')}</td><td style={S.td}>{t('locRow3c')}</td></tr>
          <tr><td style={S.td}>{t('locRow4a')}</td><td style={S.td}>{t('locRow4b')}</td><td style={S.td}>{t('locRow4c')}</td></tr>
        </tbody>
      </table>
      <p style={{ ...S.p, marginTop: '0.75rem' }}>{t('clearLead')}</p>
      <ul style={S.ul}>
        <li style={S.li}><strong style={S.strong}>Chrome:</strong> {t('chrome')}</li>
        <li style={S.li}><strong style={S.strong}>Firefox:</strong> {t('firefox')}</li>
        <li style={S.li}><strong style={S.strong}>Safari:</strong> {t('safari')}</li>
        <li style={S.li}><strong style={S.strong}>Edge:</strong> {t('edge')}</li>
      </ul>
      <div style={S.warn}>
        <p style={{ ...S.p, margin: 0 }}><strong style={{ color: '#fb923c' }}>{t('warnLabel')}</strong>{t('warnBody')}</p>
      </div>

      <h2 style={S.h2}>{t('h2Rights')}</h2>
      <p style={S.p}>{t('rightsLeadA')}<strong style={{ color: '#00d4ff' }}>yuanwullink30@gfl.community</strong>{t('rightsLeadB')}</p>
      <table style={S.table}>
        <thead><tr><th style={S.th}>{t('thRight')}</th><th style={S.th}>{t('thWhatCanYouDo')}</th><th style={S.th}>{t('thTerm')}</th></tr></thead>
        <tbody>
          <tr><td style={S.td}>{t('rgt1a')}</td><td style={S.td}>{t('rgt1b')}</td><td style={S.td}>{t('within30')}</td></tr>
          <tr><td style={S.td}>{t('rgt2a')}</td><td style={S.td}>{t('rgt2b')}</td><td style={S.td}>{t('within30')}</td></tr>
          <tr><td style={S.td}>{t('rgt3a')}</td><td style={S.td}>{t('rgt3b')}</td><td style={S.td}>{t('within30')}</td></tr>
          <tr><td style={S.td}>{t('rgt4a')}</td><td style={S.td}>{t('rgt4b')}</td><td style={S.td}>{t('within30')}</td></tr>
          <tr><td style={S.td}>{t('rgt5a')}</td><td style={S.td}>{t('rgt5b')}</td><td style={S.td}>{t('within30')}</td></tr>
          <tr><td style={S.td}>{t('rgt6a')}</td><td style={S.td}>{t('rgt6b')}</td><td style={S.td}>{t('within30')}</td></tr>
          <tr><td style={S.td}>{t('rgt7a')}</td><td style={S.td}>{t('rgt7b')}</td><td style={S.td}>{t('rgt7c')}</td></tr>
        </tbody>
      </table>
      <p style={S.p}>{t('complaintA')}<strong style={S.strong}>{t('authority')}</strong>{t('complaintB')}<a href="https://www.autoriteitpersoonsgegevens.nl" target="_blank" rel="noopener noreferrer" style={{ color: '#00d4ff' }}>www.autoriteitpersoonsgegevens.nl</a>{t('complaintC')}</p>

      <h2 style={S.h2}>{t('h2Delete')}</h2>
      <p style={S.p}>{t('deleteLead')}</p>
      <ul style={S.ul}>
        <li style={S.li}>{t('del1')}</li>
        <li style={S.li}>{t('del2')}</li>
        <li style={S.li}>{t('del3')}</li>
        <li style={S.li}>{t('del4')}</li>
      </ul>
      <p style={S.p}><strong style={S.strong}>{t('notAuto')}</strong></p>
      <ul style={S.ul}>
        <li style={S.li}>{t('notAutoItem')}</li>
        <li style={S.li}>{t('notAutoItem2')}</li>
      </ul>
      <p style={S.p}>{t('afterDeletion')}</p>
      <div style={S.box}>
        <p style={{ ...S.p, margin: 0 }}>{t('boxA')}<strong style={{ color: '#00d4ff' }}>yuanwullink30@gfl.community</strong>{t('boxB')}</p>
      </div>
    </>
  );
};

export { S, PolicyLink, RetentionForm };
