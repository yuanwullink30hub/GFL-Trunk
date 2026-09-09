import React from 'react';
import { S, PolicyLink } from './policyShared.jsx';

/** English policy documents, part 1 — mirrors the matching keys of POLICY_CONTENT_NL. */
export const POLICY_EN_PART1 = {
  terms: (
    <>
      <p style={S.updated}>Version date: 27 September 2026 | Version: 2.0</p>
      <p style={S.p}>These terms apply to the use of the Garden For Life platform.</p>

      <h2 style={S.h2}>Article 1 — Definitions</h2>
      <p style={S.p}>In these General Terms and Conditions the following terms are used:</p>
      <ul style={S.ul}>
        <li style={S.li}><strong style={S.strong}>Garden For Life:</strong> Trade name of the business established in Zutphen, De Taxushaag 2, 7207MB, registered in the Commercial Register of the Chamber of Commerce under number 85125245. Hereinafter: 'Garden For Life', 'we' or 'us'.</li>
        <li style={S.li}><strong style={S.strong}>Platform:</strong> The website and digital environment of Garden For Life, accessible via https://gardenforlife.nl/.</li>
        <li style={S.li}><strong style={S.strong}>User:</strong> Any natural person aged 16 years or older who uses the Platform.</li>
        <li style={S.li}><strong style={S.strong}>Assessment:</strong> The digital questionnaire of 36 questions (72 picks — 2 choices per question) based on the Garden For Life Deltawerken Model, which the User completes in order to generate a personal self-reflection report.</li>
        <li style={S.li}><strong style={S.strong}>Report:</strong> The AI-generated personal self-reflection report that is created after completion of the Assessment on the basis of the User's answers.</li>
        <li style={S.li}><strong style={S.strong}>GDPR:</strong> The General Data Protection Regulation (EU) 2016/679.</li>
      </ul>

      <h2 style={S.h2}>Article 2 — Applicability</h2>
      <ol style={S.ol}>
        <li style={S.li}>These General Terms and Conditions apply to all use of the Platform. By using the Platform, the User declares that they have read and accept these terms.</li>
        <li style={S.li}>Garden For Life reserves the right to amend these terms. Registered users will be notified of this by email.</li>
        <li style={S.li}>These terms have been drawn up in Dutch. In the event of any translation, the Dutch text prevails.</li>
      </ol>

      <h2 style={S.h2}>Article 3 — Access</h2>
      <ol style={S.ol} start={4}>
        <li style={S.li}>The User must be at least 16 years old. By using the Platform the User declares that they meet this age requirement. Garden For Life does not verify the age given, but will delete an account as soon as it emerges that the User is under 16.</li>
        <li style={S.li}>Use of the Platform is free of charge.</li>
        <li style={S.li}>The feedback confirmation email contains an optional donation link via Tikkie (KNAB). Donations are entirely voluntary, non-refundable and confer no additional rights, access or services. The assessment, the results and the PDF are offered unconditionally and free of charge, regardless of whether a donation is made.</li>
        <li style={S.li}>Garden For Life reserves the right to terminate or restrict a User's access, without stating reasons.</li>
      </ol>

      <h2 style={S.h2}>Article 4 — Nature of the Platform & AI-Generated Content</h2>
      <ol style={S.ol} start={8}>
        <li style={S.li}>The Platform offers a self-reflection instrument based on the Garden For Life Deltawerken Model. The Platform is intended solely for personal growth and self-insight.</li>
        <li style={S.li}>The Report is not a clinical diagnosis, not psychological advice and not a medical judgement. It does not replace professional psychological, psychiatric or medical care.</li>
        <li style={S.li}>The Reports are generated fully automatically by an AI model (Claude, developed by Anthropic). Garden For Life is responsible for the configuration of this model, but cannot guarantee that the generated content is in all cases fully accurate or applicable to the individual situation of the User.</li>
        <li style={S.li}>The neurobiological and psychological concepts in the Report are interpretative metaphors within the Garden For Life Deltawerken Model. They do not represent clinically measured characteristics of the User.</li>
        <li style={S.li}>The User is themselves responsible for the interpretation and use of the Report.</li>
        <li style={S.li}>Garden For Life offers the possibility to upload files (such as an OCEAN report in PDF format) to enrich the assessment report. The content of uploaded files is processed by the Claude AI model (Anthropic, US). Garden For Life is not responsible for the personal data or other information that the User includes in uploaded files. The User is themselves responsible for the content of files that he or she uploads and for the consequences thereof. Garden For Life advises against uploading files containing sensitive personal data of third parties.</li>
      </ol>

      <h2 style={S.h2}>Article 5 — The Report, the Crystal Code & the Account</h2>
      <ol style={S.ol} start={14}>
        <li style={S.li}>After completion of the Assessment, the Report is made available for download. The downloaded PDF is the User's copy; Garden For Life does not retain the full Report.</li>
        <li style={S.li}>The computed profile from which the Report is built exists on Garden For Life's servers for a maximum of 24 hours and is then deleted automatically, including by an automated sweep each night at 00:00 (Europe/Amsterdam). After that moment Garden For Life cannot regenerate the Report or make it available again.</li>
        <li style={S.li}>The Report contains a unique crystal code. That code remains valid for life but can be redeemed for an account <strong style={S.strong}>only once</strong>. Garden For Life stores only an irreversible hash of the code — never the code itself — so that an already redeemed code cannot be used again. This hash persists for as long as the account exists.</li>
        <li style={S.li}>The User is responsible for safekeeping the PDF and the code it contains. Whoever holds the file can obtain access to the associated account. Garden For Life advises keeping the file as one would keep a password.</li>
        <li style={S.li}>Only a <em>partial profile</em> is stored in the User's account: the archetype name, the render-only orb geometry, the normalised 12-point shape vector and the accompanying card texts. The partial profile contains no raw answers and no full analysis. A complete description is given in the Privacy Policy, article 6.</li>
      </ol>

      <h2 style={S.h2}>Article 5a — Local Working Environment & Future Tools</h2>
      <ol style={S.ol} start={19}>
        <li style={S.li}>Garden For Life provides a local working environment in which the Report, the full profile and the output of tools are stored in a folder on the User's own device. Garden For Life has no access to that folder and keeps no copy of it.</li>
        <li style={S.li}>The User grants permission for this once, for one specific folder. That permission applies to that folder alone and can be withdrawn at any time.</li>
        <li style={S.li}>Because Garden For Life keeps no copy, the User is responsible for safeguarding the folder. Loss of the folder — through erased data, a failed device or moved files — means irrecoverable loss of its contents. Garden For Life cannot restore this data.</li>
        <li style={S.li}>Garden For Life will offer additional tools that work with the data in that folder, such as drawing up personal plans, goals and tasks. Each tool asks for consent <strong style={S.strong}>separately</strong>, stating in advance which data it uses and which data is sent to Garden For Life in the process. A tool for which no consent has been given is not run.</li>
        <li style={S.li}>The Deltawerken Model, its corpus and the instruction layer remain with Garden For Life and are not placed in the local working environment.</li>
      </ol>

      <h2 style={S.h2}>Article 6 — Processing of Personal Data</h2>
      <ol style={S.ol} start={24}>
        <li style={S.li}>Garden For Life processes the User's personal data in accordance with the GDPR and the applicable Privacy Policy of Garden For Life, which can be consulted via <PolicyLink to="/privacybeleid">gardenforlife.nl/privacybeleid</PolicyLink>.</li>
        <li style={S.li}>The Assessment generates psychological profile data within the meaning of Article 9 GDPR. The User gives explicit consent for this via the consent screen preceding the Assessment.</li>
        <li style={S.li}>The User has the right to withdraw the consent given at any time via the contact form or by email. Withdrawal leads to deletion of all profile data within 30 days.</li>
        <li style={S.li}>For questions about data processing, the User may make contact via <strong style={S.strong}>yuanwullink30@gfl.community</strong>.</li>
        <li style={S.li}>For a full overview of processing activities, retention periods and rights, we refer to our Privacy Policy via <PolicyLink to="/privacybeleid">gardenforlife.nl/privacybeleid</PolicyLink> and the Data Retention & Deletion page via <PolicyLink to="/gegevensbehoud-en-verwijdering">gardenforlife.nl/gegevensbehoud-en-verwijdering</PolicyLink>.</li>
      </ol>

      <h2 style={S.h2}>Article 7 — Intellectual Property</h2>
      <ol style={S.ol} start={29}>
        <li style={S.li}>All intellectual property rights in the Platform, the assessment methodology, the Garden For Life Deltawerken Model, the archetype system, the visual archetype models and the generated report structure vest exclusively in Garden For Life.</li>
        <li style={S.li}>The generated Report is intended solely for the personal use of the User. Commercial exploitation, reproduction or distribution of the Report or parts thereof without the prior written consent of Garden For Life is not permitted.</li>
        <li style={S.li}>For a full overview of protected works, permitted use and prohibited misuse — including commercial exploitation, manipulative misuse of results and AI training — Garden For Life refers to the Terms of Use & Misuse Policy page via <PolicyLink to="/gebruiksvoorwaarden-misbruik">gardenforlife.nl/gebruiksvoorwaarden-misbruik</PolicyLink> and the Intellectual Property page via <PolicyLink to="/intellectueel-eigendom">gardenforlife.nl/intellectueel-eigendom</PolicyLink>.</li>
        <li style={S.li}>The User grants Garden For Life a limited, non-exclusive licence to process the entered assessment data for the purpose of report generation.</li>
      </ol>

      <h2 style={S.h2}>Article 8 — Liability</h2>
      <ol style={S.ol} start={33}>
        <li style={S.li}>Garden For Life makes every effort to have the Platform function properly, but gives no guarantee of uninterrupted or error-free operation.</li>
        <li style={S.li}>Garden For Life is not liable for damage arising from the use or interpretation of the Report, including but not limited to decisions in the areas of work, relationships, health or personal well-being.</li>
        <li style={S.li}>Garden For Life is not liable for indirect damage, consequential damage or lost profit.</li>
        <li style={S.li}>Insofar as the liability of Garden For Life cannot be fully excluded, it is limited to the amount that the User has paid for the use of the Platform. As the Platform is offered free of charge, liability is limited to € 0.</li>
        <li style={S.li}>The User indemnifies Garden For Life against claims by third parties arising from the User's use of the Platform.</li>
      </ol>

      <h2 style={S.h2}>Article 9 — Rules of Conduct & Prohibited Use</h2>
      <p style={S.p}>The User is not permitted to use the Platform for:</p>
      <ul style={S.ul}>
        <li style={S.li}>Purposes contrary to the law or public order</li>
        <li style={S.li}>Automated reading, copying or scraping of content</li>
        <li style={S.li}>Circumventing security measures</li>
        <li style={S.li}>Sharing login credentials with third parties</li>
        <li style={S.li}>Commercial exploitation of the report content without consent</li>
      </ul>
      <p style={S.p}>In the event of a breach, Garden For Life reserves the right to terminate the User's access immediately.</p>

      <h2 style={S.h2}>Article 10 — Availability & Changes</h2>
      <ol style={S.ol} start={38}>
        <li style={S.li}>Garden For Life reserves the right to modify, temporarily suspend or discontinue the Platform, the assessment methodology or the report structure at any time.</li>
        <li style={S.li}>Garden For Life aims for an availability of the Platform of at least 96% per month, but gives no guarantee in this respect.</li>
        <li style={S.li}>Planned maintenance is, where possible, communicated in advance by email.</li>
        <li style={S.li}>For information about the use of cookies, we refer to our Cookie Policy via <PolicyLink to="/cookiebeleid">gardenforlife.nl/cookiebeleid</PolicyLink>.</li>
      </ol>

      <h2 style={S.h2}>Article 11 — Applicable Law & Disputes</h2>
      <ol style={S.ol} start={42}>
        <li style={S.li}>Dutch law applies to these General Terms and Conditions and to all agreements between Garden For Life and the User.</li>
        <li style={S.li}>Disputes will in the first instance be resolved through consultation. If this does not succeed, disputes will be submitted to the competent court in the district of Zutphen.</li>
        <li style={S.li}>Without prejudice to the foregoing, the User has the right to lodge a complaint with the Dutch Data Protection Authority (Autoriteit Persoonsgegevens, AP) via www.autoriteitpersoonsgegevens.nl.</li>
      </ol>

      <h2 style={S.h2}>Article 12 — Related Policy Documents</h2>
      <p style={S.p}>In addition to these General Terms and Conditions, Garden For Life applies the following policy documents. These documents form part of the agreement between Garden For Life and the User:</p>
      <table style={S.table}>
        <thead>
          <tr><th style={S.th}>Document</th><th style={S.th}>URL</th></tr>
        </thead>
        <tbody>
          <tr><td style={S.td}>Privacy Policy</td><td style={S.td}><PolicyLink to="/privacybeleid">gardenforlife.nl/privacybeleid</PolicyLink></td></tr>
          <tr><td style={S.td}>Cookie Policy</td><td style={S.td}><PolicyLink to="/cookiebeleid">gardenforlife.nl/cookiebeleid</PolicyLink></td></tr>
          <tr><td style={S.td}>Data Retention & Deletion</td><td style={S.td}><PolicyLink to="/gegevensbehoud-en-verwijdering">gardenforlife.nl/gegevensbehoud-en-verwijdering</PolicyLink></td></tr>
          <tr><td style={S.td}>AI Transparency</td><td style={S.td}><PolicyLink to="/ai-transparantie">gardenforlife.nl/ai-transparantie</PolicyLink></td></tr>
          <tr><td style={S.td}>Intellectual Property</td><td style={S.td}><PolicyLink to="/intellectueel-eigendom">gardenforlife.nl/intellectueel-eigendom</PolicyLink></td></tr>
          <tr><td style={S.td}>Terms of Use & Misuse Policy</td><td style={S.td}><PolicyLink to="/gebruiksvoorwaarden-misbruik">gardenforlife.nl/gebruiksvoorwaarden-misbruik</PolicyLink></td></tr>
          <tr><td style={S.td}>Record of Processing Activities (Art. 30 GDPR)</td><td style={S.td}><PolicyLink to="/verwerkingsregister">gardenforlife.nl/verwerkingsregister</PolicyLink></td></tr>
        </tbody>
      </table>
      <p style={S.p}>By using the Platform, the User declares that they have taken note of all of the above documents.</p>

      <h2 style={S.h2}>Article 13 — Contact</h2>
      <p style={S.p}>For questions about these General Terms and Conditions or the Platform:</p>
      <ul style={S.ul}>
        <li style={S.li}><strong style={S.strong}>Email:</strong> yuanwullink30@gfl.community</li>
        <li style={S.li}><strong style={S.strong}>Address:</strong> De Taxushaag 2, Zutphen, 7207MB</li>
        <li style={S.li}><strong style={S.strong}>Chamber of Commerce number:</strong> 85125245</li>
        <li style={S.li}><strong style={S.strong}>VAT number:</strong> NL004054423B17</li>
      </ul>
      <p style={{...S.p, marginTop: '2rem', borderTop: '1px solid rgba(255,174,0,0.15)', paddingTop: '1rem', opacity: 0.5, fontSize: 'max(9px, 0.4vw)'}}>
        Garden For Life — General Terms and Conditions 1.0 — 8 September 2026
      </p>
    </>
  ),

  privacy: (
    <>
      <p style={S.updated}>Version date: 27 September 2026 | Version 2.0</p>
      <h2 style={S.h2}>1. Introduction</h2>
      <p style={S.p}>Garden for Life respects your privacy and is committed to protecting your personal data. This Privacy Policy describes how we collect, use, store and protect your data in accordance with the General Data Protection Regulation (GDPR) and other applicable legislation.</p>
      <h2 style={S.h2}>2. Controller</h2>
      <p style={S.p}><strong style={S.strong}>Garden for Life</strong> is responsible for the processing of your personal data.</p>
      <p style={S.p}>For questions about your data or your rights, please contact us:</p>
      <ul style={S.ul}>
        <li style={S.li}>Email: yuanwullink30@gfl.community</li>
        <li style={S.li}>Website: www.gardenforlife.nl</li>
      </ul>
      <h2 style={S.h2}>3. What Data Do We Collect?</h2>
      <h3 style={S.h3}>3.1 Data you actively provide:</h3>
      <ul style={S.ul}>
        <li style={S.li}>Registration data: display name, email address, password</li>
        <li style={S.li}>Profile data: language preference and, optionally, age and country</li>
        <li style={S.li}>Assessment answers: your choices per question — processed to calculate your report, not retained as a result (see article 6)</li>
        <li style={S.li}>Communication data: messages to other users and feedback you send us</li>
      </ul>
      <h3 style={S.h3}>3.2 Data we collect automatically:</h3>
      <p style={S.p}>Garden For Life uses no analytics, no trackers and no advertising networks. We build no profile of your browsing behaviour. What is recorded automatically is limited to:</p>
      <ul style={S.ul}>
        <li style={S.li}><strong style={S.strong}>Browser type (user agent):</strong> recorded at the moment you give consent and when you submit feedback — as evidence of that moment</li>
        <li style={S.li}><strong style={S.strong}>IP address:</strong> solely when entering a beta access code, to protect against abuse. Not linked to your profile data.</li>
        <li style={S.li}><strong style={S.strong}>Technical server logs</strong> kept by our hosting provider, which expire automatically after a short period</li>
      </ul>
      <p style={S.p}>We do not record pages visited, clicks, time spent, geolocation or device identifiers.</p>

      <h3 style={S.h3}>3.3 Assessment Data &amp; Profile Data (Art. 9 GDPR)</h3>
      <p style={S.p}>The following data is processed after explicit consent and falls under Art. 9 GDPR:</p>
      <ul style={S.ul}>
        <li style={S.li}><strong style={S.strong}>Raw assessment answers:</strong> your individual choices per question (responses array) — stored as part of the assessment session</li>
        <li style={S.li}><strong style={S.strong}>Subject results per theme:</strong> aggregated scores for each of the 5 themes (subjectResults)</li>
        <li style={S.li}><strong style={S.strong}>Archetype scores:</strong> the calculated score profile per archetype (scores)</li>
        <li style={S.li}><strong style={S.strong}>Archetype details:</strong> the elaborated archetype analysis including the 5-basket decomposition per archetype — Nature Core, Green Hardware, Culture Core, Blue Feedback, Yellow Cognitive, Purple Shadow (archetypeDetails)</li>
        <li style={S.li}><strong style={S.strong}>Full generated report:</strong> including Main/Support Archetype, Extended Archetype, shadow/blindspot analysis, tactical recommendations and AI Agent Prompt</li>
        <li style={S.li}><strong style={S.strong}>Content of uploaded files (uploadedFileContents):</strong> where applicable — the text extracted from files that the user optionally uploads (e.g. an OCEAN report as a PDF). Garden For Life does not store this content — it is processed solely by the Claude AI model for report generation. The user is themselves responsible for the content of uploaded files.</li>
      </ul>
      <p style={S.p}>The above data is processed on secure servers in Frankfurt for the purpose of report generation. It is <strong style={S.strong}>not retained as a result</strong>: the computed profile exists for a maximum of 24 hours as a processing cache and is then erased automatically. What remains in your account is only the <em>partial profile</em> — the data needed to draw your orb and fill your account screen. Article 6 sets out exactly what that is and how long each part persists.</p>

      <h2 style={S.h2}>4. Purposes of Data Processing</h2>
      <p style={S.p}>We process your data for the following purposes:</p>
      <ul style={S.ul}>
        <li style={S.li}>Delivery of Assessment services and generation of personal profile reports</li>
        <li style={S.li}>Account management and authentication</li>
        <li style={S.li}>Communication about the Services</li>
        <li style={S.li}>System improvements (on the basis of anonymised data)</li>
        <li style={S.li}>Compliance with legal obligations</li>
        <li style={S.li}>Protection against fraud and misuse</li>
      </ul>
      <h2 style={S.h2}>5. Legal Basis for Processing</h2>
      <p style={S.p}>The processing of your data is based on:</p>
      <ul style={S.ul}>
        <li style={S.li}>Performance of a contract (use of the Platform)</li>
        <li style={S.li}>Explicit consent (for Art. 9 psychological data)</li>
        <li style={S.li}>Legitimate interest (system security, fraud prevention)</li>
        <li style={S.li}>Compliance with legal obligations</li>
      </ul>
      <h2 style={S.h2}>6. Storage and Retention Period</h2>
      <p style={S.p}>Garden For Life operates three clearly separated tiers. Anything that does not fall under tier 1 or tier 2 is not stored.</p>

      <h3 style={S.h3}>Tier 1 — Permanent, for as long as your account exists</h3>
      <table style={S.table}>
        <thead><tr><th style={S.th}>Data</th><th style={S.th}>Why it has to remain</th></tr></thead>
        <tbody>
          <tr><td style={S.td}>Email address and display name (encrypted), password hash</td><td style={S.td}>To let you log in and to recognise your account</td></tr>
          <tr><td style={S.td}>The <strong style={S.strong}>hash</strong> of your crystal code (SHA-256) — never the code itself</td><td style={S.td}>A code stays valid for life but can be redeemed only once. Without this hash the same PDF could open a second account.</td></tr>
          <tr><td style={S.td}><strong style={S.strong}>The partial profile:</strong> archetype name, the render-only orb geometry, the normalised 12-point shape vector and the accompanying card texts</td><td style={S.td}>This draws your orb, fills your account screen and — if you set your profile to public — your public card in the Verbonden directory. Other users have to be able to see it, which is why it sits on our server rather than only on your device.</td></tr>
          <tr><td style={S.td}>Received messages and connection requests</td><td style={S.td}>These arrive while your device is switched off and have to land somewhere</td></tr>
        </tbody>
      </table>

      <h3 style={S.h3}>Tier 2 — A maximum of 24 hours (processing cache)</h3>
      <p style={S.p}>The full computed profile — your raw answers, the scores per archetype, the 5-basket decomposition and the generated analysis — exists only for as long as it takes to build your report and show it to you. It is erased in two independent ways:</p>
      <ul style={S.ul}>
        <li style={S.li}>An automated sweep deletes every computed profile <strong style={S.strong}>each night at 00:00 (Europe/Amsterdam)</strong>.</li>
        <li style={S.li}>Independently, the database deletes each computed profile automatically <strong style={S.strong}>24 hours</strong> after creation, even if the nightly sweep were skipped due to a fault.</li>
      </ul>
      <p style={S.p}>Feedback you send us voluntarily (the review form) does not fall under this: we keep it for 90 days, after which it is deleted automatically.</p>

      <h3 style={S.h3}>Tier 3 — Never stored</h3>
      <ul style={S.ul}>
        <li style={S.li}>The PDF you upload. It is read in working memory to extract the code and the partial profile, then discarded — no copy is ever written to our servers.</li>
        <li style={S.li}>The contents of other files you optionally upload (for example an OCEAN report).</li>
        <li style={S.li}>The generated report itself. The PDF you downloaded is the only copy that continues to exist.</li>
        <li style={S.li}>The raw crystal code. We keep only its irreversible hash.</li>
      </ul>

      <h3 style={S.h3}>Your own working folder</h3>
      <p style={S.p}>Garden For Life provides a local working environment in which your report, your full profile and everything future tools produce for you are stored on <strong style={S.strong}>your own device</strong>, in a folder you choose and control. We have no access to it and keep no copy. Once that folder is set up you can have the remaining data deleted from our servers in a single action; what then remains is only tier 1 above. Because we keep no copy, safeguarding that folder is your own responsibility.</p>
      <h2 style={S.h2}>7. Recipients / Transfers</h2>
      <table style={S.table}>
        <thead><tr><th style={S.th}>Recipient</th><th style={S.th}>Role</th><th style={S.th}>Data processing agreement</th></tr></thead>
        <tbody>
          <tr><td style={S.td}>Anthropic (Claude API)</td><td style={S.td}>Processor — assessment data is transferred for report generation</td><td style={S.td}>Automatically in force through acceptance of the Anthropic Commercial Terms of Service — March 2026</td></tr>
          <tr><td style={S.td}>MongoDB Atlas</td><td style={S.td}>Processor — database storage in Frankfurt (EU)</td><td style={S.td}>In place via the Atlas platform DPA (online acceptance)</td></tr>
          <tr><td style={S.td}>Render.com</td><td style={S.td}>Processor — hosting of the application server (Frankfurt region, EU). All requests pass through it; no profile data is retained on the host.</td><td style={S.td}>In place via the Render DPA (online acceptance)</td></tr>
          <tr><td style={S.td}>Cloudflare</td><td style={S.td}>Processor — delivery of the website (CDN) and DNS</td><td style={S.td}>Automatically via the Self-Serve Subscription Agreement</td></tr>
          <tr><td style={S.td}>Google Workspace</td><td style={S.td}>Processor — sending of email (confirmations, verification links)</td><td style={S.td}>Covered by the Google Workspace DPA</td></tr>
        </tbody>
      </table>
      <p style={S.p}>Report generation runs exclusively through Claude (Anthropic). The platform configuration contains connections for other AI providers; these are not used in the production environment. Should that change, this list will be updated before they are put into use.</p>
      <p style={S.p}>If the user uploads a file (e.g. an OCEAN report), the text extracted from that file is likewise processed by Claude. If that file contains personal information, that information is transferred to Anthropic. Garden For Life is not responsible for the personal data that the user includes in uploaded files. Users are alerted to this in the consent screen and at the moment of upload.</p>
      <p style={S.p}>The feedback confirmation email contains an optional donation link via Tikkie (KNAB). Garden For Life does not receive, process or store any payment data of the User in connection with donations. The entire transaction runs via Tikkie and is subject to the privacy policy of Tikkie/KNAB (ABN AMRO). No personal data is linked to donations by Garden For Life.</p>
      <h2 style={S.h2}>8. Your Rights</h2>
      <p style={S.p}>Under the GDPR you have the following rights:</p>
      <ul style={S.ul}>
        <li style={S.li}><strong style={S.strong}>Right of access:</strong> You can request a copy of your personal data</li>
        <li style={S.li}><strong style={S.strong}>Right to rectification:</strong> You can have inaccurate data corrected</li>
        <li style={S.li}><strong style={S.strong}>Right to erasure:</strong> You can request deletion of your data ("right to be forgotten")</li>
        <li style={S.li}><strong style={S.strong}>Right to restriction:</strong> You can restrict the processing of your data</li>
        <li style={S.li}><strong style={S.strong}>Right to data portability:</strong> You can receive your data in a structured format</li>
        <li style={S.li}><strong style={S.strong}>Right to object:</strong> You can object to certain processing activities</li>
      </ul>
      <p style={S.p}>To exercise these rights, send an email to <strong style={S.strong}>yuanwullink30@gfl.community</strong>.</p>
      <h2 style={S.h2}>9. Security</h2>
      <p style={S.p}>We implement the following technical and organisational measures to protect your data:</p>
      <ul style={S.ul}>
        <li style={S.li}><strong style={S.strong}>Encryption in transit:</strong> All connections run via TLS 1.2+ (HTTPS). Database connections are likewise encrypted.</li>
        <li style={S.li}><strong style={S.strong}>Encryption at rest:</strong> All server data is encrypted via AES-256-GCM (MongoDB Atlas standard). In addition, email addresses and display names are further encrypted at field level with AES-256-GCM before they are stored.</li>
        <li style={S.li}><strong style={S.strong}>Access restriction:</strong> The database is protected by credentials and network rules; only the application server and the administrator have access.</li>
        <li style={S.li}><strong style={S.strong}>Audit logging:</strong> Consents, administrator access and automated sweeps are recorded with a timestamp at application level.</li>
        <li style={S.li}><strong style={S.strong}>Server location:</strong> All server data is stored on servers in Frankfurt, Germany (EU).</li>
        <li style={S.li}><strong style={S.strong}>Password protection:</strong> Passwords are stored encrypted via bcrypt and are never readable by Garden For Life.</li>
        <li style={S.li}><strong style={S.strong}>Authentication:</strong> The platform uses JWT bearer tokens for authentication — no traditional session cookies.</li>
        <li style={S.li}><strong style={S.strong}>CSRF protection:</strong> CSRF resistance via JWT bearer token authentication (no session cookies).</li>
      </ul>
      <h2 style={S.h2}>10. Complaints</h2>
      <p style={S.p}>Do you have a complaint about our data processing? Contact us or lodge a complaint with your national supervisory authority.</p>
      <h2 style={S.h2}>11. Changes to this Policy</h2>
      <p style={S.p}>We may amend this Privacy Policy at any time. Changes will be posted on this page and you will be notified of substantial changes.</p>
    </>
  ),

  cookies: (
    <>
      <p style={S.updated}>Version date: 27 September 2026 | Version 2.0 | Language: English</p>
      <p style={S.p}>Garden For Life does not use HTTP cookies. The platform works exclusively with <strong style={S.strong}>localStorage</strong> and <strong style={S.strong}>sessionStorage</strong> — browser storage that resides only on your own device and is never sent automatically to our servers. There is no cookie banner on this website because no consent is legally required for this.</p>
      <h2 style={S.h2}>1. No Cookies — But Local Browser Storage</h2>
      <p style={S.p}>A traditional cookie is a small file that a website places on your device and that is automatically sent back to the server on every visit. Garden For Life uses no HTTP cookies of any kind whatsoever.</p>
      <p style={S.p}>Instead, Garden For Life makes use of <strong style={S.strong}>localStorage</strong> and <strong style={S.strong}>sessionStorage</strong> — two storage mechanisms built into your browser by default. The essential difference:</p>
      <ul style={S.ul}>
        <li style={S.li}>Local storage stays on your device. It is never sent to our servers.</li>
        <li style={S.li}>The data is readable only by the Garden For Life website itself — not by third parties.</li>
        <li style={S.li}>You have full control: you can clear the storage at any time via your browser settings.</li>
      </ul>
      <p style={S.p}><strong style={S.strong}>Legal basis:</strong> Although localStorage is not a cookie in the traditional sense, the storage of personal data on a device falls under Article 11.7a of the Dutch Telecommunications Act (Telecommunicatiewet) and the ePrivacy Directive. No consent is required for strictly necessary storage. Garden For Life uses local storage solely for the operation of the platform.</p>
      <h2 style={S.h2}>2. What Do We Store in Your Browser?</h2>
      <h3 style={S.h3}>2.1 Strictly Necessary Storage (localStorage)</h3>
      <p style={S.p}>The following items are stored to make the platform work. Without this storage the platform cannot function.</p>
      <table style={S.table}>
        <thead><tr><th style={S.th}>Key</th><th style={S.th}>Retention</th><th style={S.th}>Purpose</th></tr></thead>
        <tbody>
          <tr><td style={S.td}>gfl_token</td><td style={S.td}>Until logout</td><td style={S.td}>JWT authentication token — identifies your logged-in session. Contains no password; it does contain a user ID and your email address.</td></tr>
          <tr><td style={S.td}>gfl_assessment_session</td><td style={S.td}>Until a new assessment is started</td><td style={S.td}>The assessment in progress, so you can resume where you left off.</td></tr>
          <tr><td style={S.td}>gfl_assessment_history</td><td style={S.td}>Locally permanent</td><td style={S.td}>Your most recent assessment sessions, on your own device only, for your own reference.</td></tr>
          <tr><td style={S.td}>gfl_pending_assessment</td><td style={S.td}>Until the account is created</td><td style={S.td}><strong style={S.strong}>Contains your full computed profile.</strong> Held locally when you create an account from the results screen, so the result is not lost during registration.</td></tr>
          <tr><td style={S.td}>gfl_assessment_id</td><td style={S.td}>Until a new assessment is started</td><td style={S.td}>Reference to your most recently stored result, so the corresponding report can be retrieved.</td></tr>
          <tr><td style={S.td}>gfl_pdf_replay</td><td style={S.td}>Until a new report is generated</td><td style={S.td}><strong style={S.strong}>Contains the composition of your report.</strong> Allows the PDF to be rebuilt without recomputing it.</td></tr>
          <tr><td style={S.td}>gfl_analysis_sections</td><td style={S.td}>Until a new report is generated</td><td style={S.td}>The sections of the generated analysis, so the results screen can display them.</td></tr>
        </tbody>
      </table>
      <p style={S.p}><strong style={S.strong}>Please note:</strong> three of these items — gfl_pending_assessment, gfl_pdf_replay and gfl_analysis_sections — contain your psychological profile data. They reside on your own device only and are never sent to our servers of their own accord. To remove them, clear local storage as described in article 4.</p>

      <h3 style={S.h3}>2.2 Administrator Storage (localStorage)</h3>
      <p style={S.p}>The following items are stored only when the platform is used as an administrator. For ordinary users they are never created.</p>
      <table style={S.table}>
        <thead><tr><th style={S.th}>Key</th><th style={S.th}>Retention</th><th style={S.th}>Purpose</th></tr></thead>
        <tbody>
          <tr><td style={S.td}>gfl_admin_mode</td><td style={S.td}>Locally permanent</td><td style={S.td}>Remembers that the administrator view is active.</td></tr>
          <tr><td style={S.td}>gfl_saved_invoices</td><td style={S.td}>Locally permanent</td><td style={S.td}>Saved invoices — local to the administrator's device.</td></tr>
          <tr><td style={S.td}>gfl_invoice_number</td><td style={S.td}>Locally permanent</td><td style={S.td}>Invoice number counter — stored locally.</td></tr>
        </tbody>
      </table>

      <h3 style={S.h3}>2.3 Beta Access (localStorage)</h3>
      <p style={S.p}>During the closed testing period, access to the platform was gated by an access code, which stored <em>gfl_beta_access</em> and <em>gfl_beta_access_time</em> locally. With the platform now open, this gate is removed and these items are no longer created.</p>

      <h3 style={S.h3}>2.4 SessionStorage</h3>
      <p style={S.p}>SessionStorage works identically to localStorage but is automatically cleared as soon as you close the browser window or tab.</p>
      <table style={S.table}>
        <thead><tr><th style={S.th}>Key</th><th style={S.th}>Retention period</th><th style={S.th}>Purpose</th></tr></thead>
        <tbody>
          <tr><td style={S.td}>chunk_reload</td><td style={S.td}>When the browser window or tab closes</td><td style={S.td}>One-time reload safeguard for an outdated deployment version — prevents endless reload loops after a platform update.</td></tr>
        </tbody>
      </table>
      <h2 style={S.h2}>3. What We Do Not Use</h2>
      <p style={S.p}>Garden For Life uses none of the following:</p>
      <ul style={S.ul}>
        <li style={S.li}>HTTP cookies of any kind whatsoever</li>
        <li style={S.li}>Google Analytics, Google Tag Manager or other Google trackers</li>
        <li style={S.li}>Facebook Pixel or other social media tracking</li>
        <li style={S.li}>Sentry or other external error logging services</li>
        <li style={S.li}>Advertising networks or retargeting</li>
        <li style={S.li}>Third-party embeds that place storage</li>
      </ul>
      <p style={S.p}><strong style={S.strong}>Future analytics:</strong> Garden For Life may consider adding Plausible Analytics — a cookieless, privacy-friendly analytics service that processes no personal data and places no storage on your device. Upon implementation, this policy will be updated. Plausible requires no consent.</p>
      <h2 style={S.h2}>4. Clearing Local Storage</h2>
      <p style={S.p}>You can clear Garden For Life's local storage at any time via your browser settings. Please note: this removes your login status, local notes, contacts, calendar and other locally stored workspace data. Garden For Life cannot restore this data.</p>
      <ul style={S.ul}>
        <li style={S.li}><strong style={S.strong}>Chrome:</strong> Settings → Privacy and security → Delete browsing data → Cookies and other site data</li>
        <li style={S.li}><strong style={S.strong}>Firefox:</strong> Settings → Privacy &amp; Security → Cookies and Site Data → Clear Data</li>
        <li style={S.li}><strong style={S.strong}>Safari:</strong> Preferences → Privacy → Manage Website Data → gardenforlife.nl → Remove</li>
        <li style={S.li}><strong style={S.strong}>Edge:</strong> Settings → Privacy, search, and services → Clear browsing data</li>
      </ul>
      <p style={S.p}>You can also clear the Garden For Life storage specifically via your browser's Developer Tools (F12 → Application → Local Storage → gardenforlife.nl).</p>
      <h2 style={S.h2}>5. Changes to This Policy</h2>
      <ol style={S.ol}>
        <li style={S.li}>Garden For Life reserves the right to amend this policy upon extension of the platform's functionality.</li>
        <li style={S.li}>If services are added that require tracking or non-essential storage, an appropriate consent mechanism will be implemented before the change takes effect.</li>
        <li style={S.li}>The version date at the top of this document indicates when the policy was last amended.</li>
      </ol>
      <h2 style={S.h2}>6. Contact</h2>
      <p style={S.p}>For questions about this policy:</p>
      <p style={S.p}><strong style={S.strong}>Email:</strong> yuanwullink30@gfl.community<br/><strong style={S.strong}>Address:</strong> De Taxushaag 2, Zutphen, 7207MB</p>
      <p style={S.p}>This policy forms part of the broader privacy policy of Garden For Life, which can be consulted via <PolicyLink to="/privacybeleid">Privacy Policy</PolicyLink>.</p>
      <p style={{...S.p, textAlign: 'center', color: '#64748b', fontSize: '0.75rem', marginTop: '2rem', borderTop: '1px solid rgba(168,85,247,0.2)', paddingTop: '1rem'}}>Garden For Life — Cookie Policy & Local Storage | Version 2.0 | 27 September 2026</p>
    </>
  ),

  ai: (
    <>
      <p style={S.updated}>Version date: 27 September 2026 | Version 2.0</p>
      <h2 style={S.h2}>1. EU AI Act Compliance</h2>
      <p style={S.p}>Garden for Life complies with the European AI Regulation (AI Act) through full transparency about artificial intelligence in our assessment platform.</p>
      <h2 style={S.h2}>2. What Is AI in Garden for Life?</h2>
      <p style={S.p}>Garden for Life uses advanced machine learning models to analyse your assessment answers and to generate a personality and archetype profile.</p>
      <div style={S.box}>
        <h3 style={S.h3}>⚠️ CRITICAL DISCLAIMER</h3>
        <p style={S.p}><strong style={S.strong}>This report is NOT a clinical diagnosis.</strong> Garden for Life is not a substitute for professional psychological, psychiatric or medical care. Always consult a qualified professional for health-related questions.</p>
      </div>
      <h2 style={S.h2}>3. Which AI Technologies Do We Use?</h2>
      <ul style={S.ul}>
        <li style={S.li}><strong style={S.strong}>Natural Language Processing (NLP):</strong> Analysis of text answers</li>
        <li style={S.li}><strong style={S.strong}>Pattern Recognition:</strong> Identification of behavioural patterns and tendencies</li>
        <li style={S.li}><strong style={S.strong}>Neural Networks:</strong> Deep learning for archetype classification</li>
        <li style={S.li}><strong style={S.strong}>Statistical Modeling:</strong> Shadow and blind spot analysis</li>
      </ul>
      <h2 style={S.h2}>4. Which Data Is Provided to the AI System?</h2>
      <p style={S.p}>The AI system receives the full assessment data — anonymised (no name/email/IP), but including raw answers.</p>
      <table style={S.table}>
        <thead><tr><th style={S.th}>Data</th><th style={S.th}>Explanation</th></tr></thead>
        <tbody>
          <tr><td style={S.td}>responses</td><td style={S.td}>The raw answer series — your individual choices per question (A–F) for all 36 questions (72 picks)</td></tr>
          <tr><td style={S.td}>subjectResults</td><td style={S.td}>Aggregated scores for each of the 5 themes (Self, Other, Mass, World, Mystery)</td></tr>
          <tr><td style={S.td}>scores</td><td style={S.td}>The calculated score profile per archetype</td></tr>
          <tr><td style={S.td}>archetypeDetails</td><td style={S.td}>Elaborated archetype analysis including the 5-basket decomposition per archetype (Nature Core, Green Hardware, Culture Core, Blue Feedback, Yellow Cognitive, Purple Shadow)</td></tr>
          <tr><td style={S.td}>OCEAN scores (if provided)</td><td style={S.td}>Self-reported personality scores — optional</td></tr>
          <tr><td style={S.td}>uploadedFileContents (if a file is uploaded)</td><td style={S.td}>The text extracted from uploaded files, such as an OCEAN report in PDF format. The user decides which files are uploaded and is responsible for the content thereof.</td></tr>
          <tr><td style={S.td}>System instructions</td><td style={S.td}>The Garden For Life report instructions — contain no personal data</td></tr>
        </tbody>
      </table>
      <p style={S.p}>What the AI system by default does <strong style={S.strong}>NOT</strong> receive from the platform: your name, email address, IP address, account details, location data or browser data.</p>
      <div style={S.warn}>
        <p style={{ ...S.p, margin: 0 }}><strong style={{ color: '#fb923c' }}>Exception:</strong> if you upload a file (e.g. an OCEAN report as a PDF), the full text of that file is sent to Claude. If that file contains personal information — such as your name — that information reaches the servers of Anthropic (US). Garden For Life is not responsible for which personal data or other information the user includes in uploaded files.</p>
      </div>
      <h2 style={S.h2}>5. How Does the AI Model Work?</h2>
      <h3 style={S.h3}>Step 1: Input processing</h3>
      <p style={S.p}>Your answers are normalised and converted into numerical values that the AI model can process.</p>
      <h3 style={S.h3}>Step 2: Feature extraction</h3>
      <p style={S.p}>The model identifies important "features" that are indicative of your personality, behavioural style and psychological orientation.</p>
      <h3 style={S.h3}>Step 3: Archetype classification</h3>
      <p style={S.p}>On the basis of these features you are classified in a dual-core model with:</p>
      <ul style={S.ul}>
        <li style={S.li}>Primary archetype (dominant personality style)</li>
        <li style={S.li}>Secondary archetype (supporting style)</li>
        <li style={S.li}>Shadow profile (withered or underdeveloped aspects)</li>
        <li style={S.li}>Blind spots (unconscious blind areas)</li>
      </ul>
      <h2 style={S.h2}>6. Training Data & Bias</h2>
      <p style={S.p}>Our AI model has been trained on:</p>
      <ul style={S.ul}>
        <li style={S.li}>Thousands of anonymised assessment results</li>
        <li style={S.li}>Validated psychological datasets</li>
        <li style={S.li}>Archetypal patterns from Jungian psychology</li>
      </ul>
      <p style={S.p}>We actively monitor for bias and work to:</p>
      <ul style={S.ul}>
        <li style={S.li}>Exclude prejudice on the grounds of gender, age, ethnic origin</li>
        <li style={S.li}>Respect cultural differences in communication styles</li>
        <li style={S.li}>Integrate non-Western perspectives</li>
      </ul>
      <h2 style={S.h2}>7. Accuracy & Validation</h2>
      <ul style={S.ul}>
        <li style={S.li}>✅ <strong style={S.strong}>Internal consistency:</strong> The same answers give the same profiles</li>
        <li style={S.li}>✅ <strong style={S.strong}>Test-retest reliability:</strong> Users obtain comparable results on retesting</li>
        <li style={S.li}>✅ <strong style={S.strong}>Convergent validity:</strong> Results correlate with recognised personality measures</li>
        <li style={S.li}>⚠️ <strong style={S.strong}>Not clinically validated:</strong> This model is aimed at self-exploration, not diagnostics</li>
      </ul>
      <h2 style={S.h2}>8. Limitations of the AI Model</h2>
      <div style={S.warn}>
        <h3 style={{...S.h3, color: '#f97316'}}>🔴 This AI model CANNOT:</h3>
        <ul style={S.ul}>
          <li style={S.li}>Make clinical diagnoses (ADHD, depression, anxiety disorder, etc.)</li>
          <li style={S.li}>Predict future behaviour with certainty</li>
          <li style={S.li}>Detect medical or psychiatric conditions</li>
          <li style={S.li}>Replace counselling or psychotherapy</li>
          <li style={S.li}>Be universally valid for all cultures and contexts</li>
          <li style={S.li}>Solve interpersonal or business problems</li>
        </ul>
      </div>
      <h2 style={S.h2}>9. Privacy & AI Transparency</h2>
      <ul style={S.ul}>
        <li style={S.li}>Original answers are separated from your profile</li>
        <li style={S.li}>The AI model processes anonymised batch data</li>
        <li style={S.li}>No real-time personal monitoring</li>
        <li style={S.li}>90-day retention with automatic deletion</li>
        <li style={S.li}>No transfer into training data for future models</li>
      </ul>
      <h2 style={S.h2}>10. AI Improvements & Retraining</h2>
      <ul style={S.ul}>
        <li style={S.li}>🔄 <strong style={S.strong}>Anonymous feedback:</strong> Users can rate the accuracy of their profile</li>
        <li style={S.li}>🔄 <strong style={S.strong}>Periodic retraining:</strong> The model is retrained annually with new insights</li>
        <li style={S.li}>🔄 <strong style={S.strong}>Transparent updates:</strong> Major changes are announced and documented</li>
      </ul>
      <h2 style={S.h2}>11. Protection against AI Misuse</h2>
      <ul style={S.ul}>
        <li style={S.li}>🛡️ <strong style={S.strong}>No commercial profiling:</strong> Results are not sold to advertisers</li>
        <li style={S.li}>🛡️ <strong style={S.strong}>No AI training:</strong> Your data does not feed competing AI models</li>
        <li style={S.li}>🛡️ <strong style={S.strong}>No manipulation:</strong> AI may not be used to manipulate you</li>
        <li style={S.li}>🛡️ <strong style={S.strong}>No personality hacking:</strong> The model may not be used to discover means of exploitation</li>
      </ul>
      <h2 style={S.h2}>12. Lawful Basis</h2>
      <ul style={S.ul}>
        <li style={S.li}><strong style={S.strong}>Your consent:</strong> Explicit opt-in for psychological profiling (Art. 9 GDPR)</li>
        <li style={S.li}><strong style={S.strong}>Performance of a contract:</strong> You accept that AI delivers the assessment service</li>
        <li style={S.li}><strong style={S.strong}>Legitimate interest:</strong> Product improvement (anonymised)</li>
      </ul>
      <h2 style={S.h2}>13. Your Rights with AI Processing</h2>
      <ul style={S.ul}>
        <li style={S.li}>✅ <strong style={S.strong}>Access:</strong> See exactly which features the model used</li>
        <li style={S.li}>✅ <strong style={S.strong}>Objection:</strong> Against automated profiling</li>
        <li style={S.li}>✅ <strong style={S.strong}>Erasure:</strong> All your data permanently deleted</li>
        <li style={S.li}>✅ <strong style={S.strong}>Human review:</strong> By a qualified counsellor, not AI alone</li>
      </ul>
      <h2 style={S.h2}>14. Complaints & Escalation</h2>
      <ol style={S.ol}>
        <li style={S.li}>Email: ai-transparency@gardenforlife.nl</li>
        <li style={S.li}>Receive a response from our AI ethics team within 48 hours</li>
        <li style={S.li}>Lodge a complaint with your national AI supervisory authority</li>
      </ol>
      <h2 style={S.h2}>15. Future AI Improvements</h2>
      <ul style={S.ul}>
        <li style={S.li}>🔮 Multilingual support</li>
        <li style={S.li}>🔮 Cross-cultural validation</li>
        <li style={S.li}>🔮 Neuroscientific integration (where appropriate)</li>
        <li style={S.li}>🔮 Improved explainability (why this profile?)</li>
      </ul>
      <h2 style={S.h2}>16. Contact</h2>
      <p style={S.p}><strong style={S.strong}>Email:</strong> ai-transparency@gardenforlife.nl<br/><strong style={S.strong}>Subject:</strong> "AI transparency question" or "AI objection"<br/><strong style={S.strong}>Expected response:</strong> 48 hours</p>
    </>
  ),
};
