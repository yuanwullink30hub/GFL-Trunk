import React from 'react';
import { S, PolicyLink } from './policyShared.jsx';

/** English policy documents, part 1 — mirrors the matching keys of POLICY_CONTENT_NL. */
export const POLICY_EN_PART1 = {
  terms: (
    <>
      <p style={S.updated}>Version date: 27 September 2026 | Version: 2.2</p>
      <p style={S.p}>These terms apply to the use of the Garden For Life platform.</p>

      <h2 style={S.h2}>Article 1 — Definitions</h2>
      <p style={S.p}>In these General Terms and Conditions the following terms are used:</p>
      <ul style={S.ul}>
        <li style={S.li}><strong style={S.strong}>Garden For Life:</strong> Trade name of the business established in Zutphen, De Taxushaag 2, 7207MB, registered in the Commercial Register of the Chamber of Commerce under number 85125245. Hereinafter: 'Garden For Life', 'we' or 'us'.</li>
        <li style={S.li}><strong style={S.strong}>Platform:</strong> The website and digital environment of Garden For Life, accessible via https://gardenforlife.nl/, and the Garden For Life desktop application (article 5b).</li>
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
        <li style={S.li}>Taking the analysis and downloading the short Report are free of charge. The full Report costs a one-off € 30.00 excluding VAT per Report (€ 36.30 including 21% VAT); until the spring equinox of March 2027 a launch price of € 12.00 excluding VAT (€ 14.52 including 21% VAT) applies. The User pays the amount including VAT. Payment is handled by Stripe (Stripe Payments Europe, Limited), by iDEAL or credit card. At launch the full Report is only for sale to Users in the Netherlands; a payment from outside the Netherlands is refunded automatically and gives no access to the full Report. The full Report can also be unlocked with an activation code from Garden For Life; an activation code can be used once and cannot be exchanged for money. The full Report is delivered digitally immediately after payment or activation; the User expressly consents to this when paying and thereby loses the statutory right of withdrawal. In addition, Garden For Life offers a money-back guarantee: within 14 days of payment the User can request a full refund through the contact form, without giving reasons. On refund, the crystal code in that Report is blocked: the code no longer gives access to the Platform. If an account was opened with that code and this is that account's only reading, the account is deleted; if the account also holds readings from other Reports, only the reading of the refunded Report is deleted and the access from those other Reports remains in full. On the fifteenth day after payment Garden For Life breaks the link between the payment and the Report; if a refund is being processed at that moment, the link remains for at most 30 days longer (see the Privacy Policy, article 6). Once the link is broken, a payment can no longer be linked to the Report or the crystal code: a chargeback through a bank or credit card then does not block the code. The email address the refund was requested with is recorded. On a later refund request from the same email address, a moderator of Garden For Life first asks a few questions about the request before a decision on the refund is made. Reports unlocked with an activation code are not covered by the guarantee.</li>
        <li style={S.li}>Garden For Life reserves the right to terminate or restrict a User's access, without stating reasons.</li>
      </ol>

      <h2 style={S.h2}>Article 4 — Nature of the Platform & AI-Generated Content</h2>
      <ol style={S.ol} start={8}>
        <li style={S.li}>The Platform offers a self-reflection instrument based on the Garden For Life Deltawerken Model. The Platform is intended solely for personal growth and self-insight.</li>
        <li style={S.li}>The Report is not a clinical diagnosis, not psychological advice and not a medical judgement. It does not replace professional psychological, psychiatric or medical care.</li>
        <li style={S.li}>The Reports are generated fully automatically by an AI model (Claude, developed by Anthropic). Garden For Life is responsible for the configuration of this model, but cannot guarantee that the generated content is in all cases fully accurate or applicable to the individual situation of the User.</li>
        <li style={S.li}>The neurobiological and psychological concepts in the Report are interpretative metaphors within the Garden For Life Deltawerken Model. They do not represent clinically measured characteristics of the User.</li>
        <li style={S.li}>The User is themselves responsible for the interpretation and use of the Report.</li>
        <li style={S.li}>Garden For Life offers the possibility to upload a personality report (such as an OCEAN report as PDF, DOCX or TXT; images are not accepted) to enrich the assessment report. Before the text is read or offered to the AI model, Garden For Life automatically removes names, email addresses, phone numbers, postcodes and dates of birth and replaces the file name with a neutral label; the original file name never leaves the User's device. This automatic removal recognises the common forms but cannot guarantee that every personal reference is found. The remaining content is processed by the Claude AI model (Anthropic, US) and not retained. Garden For Life is not responsible for the personal data or other information that the User includes in uploaded files. The User is themselves responsible for the content of files that he or she uploads and for the consequences thereof. Garden For Life advises against uploading files containing sensitive personal data of third parties.</li>
      </ol>

      <h2 style={S.h2}>Article 5 — The Report, the Crystal Code & the Account</h2>
      <ol style={S.ol} start={14}>
        <li style={S.li}>After completion of the Assessment, the short Report is made available for download free of charge; the full Report can be downloaded once it has been paid for or unlocked with an activation code. The downloaded PDF is the User's only copy, intended for use in the User's own local working environment; Garden For Life does not retain the Report.</li>
        <li style={S.li}>The full profile from which the Report is built (the raw answers, the scores, the archetype decomposition and the generated analysis) exists as a single instance, only in the User's own browser tab (or the application) and only for the duration of the session. To generate the analysis it is sent to Garden For Life's server and to the Claude AI model (Anthropic) for processing; the server processes it in working memory and does not store it — whether or not the User is logged in. Garden For Life, including its administrator, therefore has no access to the User's answers, full profile or Report afterwards and cannot regenerate the Report or make it available again.</li>
        <li style={S.li}>The full Report contains a unique crystal code; the short Report does not. The code only appears in the Report once it has been paid for or unlocked with an activation code — until then it exists only in encrypted form that the User's browser cannot read. If the User leaves the Report page without unlocking the Report (by closing the tab, reloading or navigating away), the Report is deleted in full: the full profile disappears from the tab together with the encrypted code, and the server deletes the card text it held under that code's hash. Only if that deletion signal does not arrive (for example because the connection is lost) does the encrypted code lapse after 24 hours, and the card text is deleted in the nightly sweep at 00:00 (Europe/Amsterdam). A Report that has not been unlocked can therefore never be retrieved later: the full Report can be purchased only once, directly after the Assessment, and a User who wishes to pay or download later must take a new Assessment. An unlocked code remains valid for life but can be redeemed for an account <strong style={S.strong}>only once</strong>. Garden For Life stores only an irreversible hash of the code — never the code itself — so that an already redeemed code cannot be used again. This hash persists for as long as the account exists.</li>
        <li style={S.li}>The User is responsible for safekeeping the PDF and the code it contains. Whoever holds the file can obtain access to the associated account. Garden For Life advises keeping the file as one would keep a password.</li>
        <li style={S.li}>Only a <em>partial profile</em> is stored in the User's account: the archetype names, the render-only orb geometry, the normalised 12-point shape vector, a summary of the basket distribution per archetype (for the wheel on the profile card) and the accompanying card texts. The partial profile contains no raw answers and no full analysis. A complete description is given in the Privacy Policy, article 6.</li>
      </ol>

      <h2 style={S.h2}>Article 5a — Local Working Environment & Future Tools</h2>
      <ol style={S.ol} start={19}>
        <li style={S.li}>Garden For Life provides a local working environment in which the Report, a copy of the partial profile and — once available — the full profile and the output of tools are stored in a folder on the User's own device. Garden For Life has no access to that folder and keeps no copy of it.</li>
        <li style={S.li}>The User grants permission for this once, for one specific folder. That permission applies to that folder alone and can be withdrawn at any time. A folder belongs to one account: when it is chosen, the application links the folder to the User's account, and it refuses a folder already linked to another account.</li>
        <li style={S.li}>Because Garden For Life keeps no copy, the User is responsible for safeguarding the folder. Loss of the folder — through erased data, a failed device or moved files — means irrecoverable loss of its contents. Garden For Life cannot restore this data.</li>
        <li style={S.li}>Garden For Life will offer additional tools that work with the data in that folder, such as drawing up personal plans, goals and tasks. Each tool asks for consent <strong style={S.strong}>separately</strong>, stating in advance which data it uses and which data is sent to Garden For Life in the process. A tool for which no consent has been given is not run. Tools that work with personal data are available only in the application. Where a tool needs Garden For Life's computing power (for example an AI model), the application sends that request <strong style={S.strong}>anonymously</strong>: without login credentials, without cookies and without any data pointing to the User, the account, the device or the folder. Access is proven with single-use, blindly signed access tickets that Garden For Life cannot link to the account they were issued to. The input and output of such a request are not retained. A description is given in the Privacy Policy, article 6.</li>
        <li style={S.li}>The Deltawerken Model, its corpus and the instruction layer remain with Garden For Life and are not placed in the local working environment.</li>
      </ol>

      <h2 style={S.h2}>Article 5b — The Desktop Application</h2>
      <ol style={S.ol} start={24}>
        <li style={S.li}>The desktop application is the full Platform, extended with access to the working folder, and is available for Windows, macOS and Linux. The User downloads and installs it themselves. Using it requires an internet connection. The website remains usable without installation for the Assessment, the Report, the account, the public profile, Verbonden and messages; the working folder and the tools that work with personal data require the application and are locked on the website.</li>
        <li style={S.li}>On first start the application creates one working folder in the User's home folder (&quot;Garden For Life&quot;) and is given access only to that folder. The User can move the working folder to another location or reconnect an existing working folder; the application then works only in that folder. It does not scan the device, does not access other folders, and sends no file listings to Garden For Life. The application remembers only the location of that folder, in its own data directory on the device.</li>
        <li style={S.li}>During the testing phase the application is released <strong style={S.strong}>without a publisher certificate</strong>. Windows and macOS will therefore warn on installation that the publisher cannot be verified. This is a property of the distribution, not an indication of harmful software. Install the application only via the official Garden For Life download link, never from a copy obtained elsewhere.</li>
        <li style={S.li}>The application checks via downloads.gardenforlife.nl on start-up and every four hours thereafter whether a new version exists, downloads it in the background and installs it when the User restarts or closes the application. No account data is sent with this check; as with any internet request, the server sees the IP address and the application version. For as long as the application is released without a publisher certificate, it cannot update itself on macOS; the User then installs a new version themselves via the official download link. Updates may change the layout of the working folder; where they do, a copy of the existing folder is made before the change is applied.</li>
        <li style={S.li}>Removing the application does <strong style={S.strong}>not</strong> remove the working folder. The folder and its contents remain on the User's device until the User erases them.</li>
        <li style={S.li}>Garden For Life is not liable for data loss in the local working environment, nor for damage arising from use of the application on a device the User shares with others or that is not protected by a password.</li>
      </ol>

      <h2 style={S.h2}>Article 6 — Processing of Personal Data</h2>
      <ol style={S.ol} start={30}>
        <li style={S.li}>Garden For Life processes the User's personal data in accordance with the GDPR and the applicable Privacy Policy of Garden For Life, which can be consulted via <PolicyLink to="/privacybeleid">gardenforlife.nl/privacybeleid</PolicyLink>.</li>
        <li style={S.li}>The Assessment generates psychological profile data within the meaning of Article 9 GDPR. The User gives explicit consent for this via the consent screen preceding the Assessment.</li>
        <li style={S.li}>The User has the right to withdraw the consent given at any time via the contact form or by email. Withdrawal leads to deletion of all profile data within 30 days.</li>
        <li style={S.li}>For questions about data processing, the User may make contact via <strong style={S.strong}>yuanwullink30@gfl.community</strong>.</li>
        <li style={S.li}>For a full overview of processing activities, retention periods and rights, we refer to our Privacy Policy via <PolicyLink to="/privacybeleid">gardenforlife.nl/privacybeleid</PolicyLink> and the Data Retention & Deletion page via <PolicyLink to="/gegevensbehoud-en-verwijdering">gardenforlife.nl/gegevensbehoud-en-verwijdering</PolicyLink>.</li>
      </ol>

      <h2 style={S.h2}>Article 7 — Intellectual Property</h2>
      <ol style={S.ol} start={35}>
        <li style={S.li}>All intellectual property rights in the Platform, the assessment methodology, the Garden For Life Deltawerken Model, the archetype system, the visual archetype models and the generated report structure vest exclusively in Garden For Life.</li>
        <li style={S.li}>The generated Report is intended solely for the personal use of the User. Commercial exploitation, reproduction or distribution of the Report or parts thereof without the prior written consent of Garden For Life is not permitted.</li>
        <li style={S.li}>For a full overview of protected works, permitted use and prohibited misuse — including commercial exploitation, manipulative misuse of results and AI training — Garden For Life refers to the Terms of Use & Misuse Policy page via <PolicyLink to="/gebruiksvoorwaarden-misbruik">gardenforlife.nl/gebruiksvoorwaarden-misbruik</PolicyLink> and the Intellectual Property page via <PolicyLink to="/intellectueel-eigendom">gardenforlife.nl/intellectueel-eigendom</PolicyLink>.</li>
        <li style={S.li}>The User grants Garden For Life a limited, non-exclusive licence to process the entered assessment data for the purpose of report generation.</li>
      </ol>

      <h2 style={S.h2}>Article 8 — Liability</h2>
      <ol style={S.ol} start={39}>
        <li style={S.li}>Garden For Life makes every effort to have the Platform function properly, but gives no guarantee of uninterrupted or error-free operation.</li>
        <li style={S.li}>Garden For Life is not liable for damage arising from the use or interpretation of the Report, including but not limited to decisions in the areas of work, relationships, health or personal well-being.</li>
        <li style={S.li}>Garden For Life is not liable for indirect damage, consequential damage or lost profit.</li>
        <li style={S.li}>Insofar as the liability of Garden For Life cannot be fully excluded, it is limited to the amount that the User has paid for the Report concerned. For free use of the Platform, liability is limited to € 0.</li>
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
      <ol style={S.ol} start={44}>
        <li style={S.li}>Garden For Life reserves the right to modify, temporarily suspend or discontinue the Platform, the assessment methodology or the report structure at any time.</li>
        <li style={S.li}>Garden For Life aims for an availability of the Platform of at least 96% per month, but gives no guarantee in this respect.</li>
        <li style={S.li}>Planned maintenance is, where possible, communicated in advance by email.</li>
        <li style={S.li}>For information about the use of cookies, we refer to our Cookie Policy via <PolicyLink to="/cookiebeleid">gardenforlife.nl/cookiebeleid</PolicyLink>.</li>
      </ol>

      <h2 style={S.h2}>Article 11 — Applicable Law & Disputes</h2>
      <ol style={S.ol} start={48}>
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
        Garden For Life — General Terms and Conditions 2.2 — 27 September 2026
      </p>
    </>
  ),

  privacy: (
    <>
      <p style={S.updated}>Version date: 27 September 2026 | Version 2.1</p>
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
        <li style={S.li}>Assessment answers: your choices per question — processed in working memory to calculate your report, never stored (see article 6)</li>
        <li style={S.li}>Communication data: messages to other users and feedback you send us (with the email address you give with it — not linked to your account)</li>
        <li style={S.li}>Payment data (full report only): the email address you request the report with, the payment reference, the amount and the VAT, the date, whether a refund was made, the country you state, the time of your agreement to the terms (with their version) and the time you saved the PDF. You enter your card or account details in the payment form of our payment provider Stripe; we do not receive them</li>
      </ul>
      <h3 style={S.h3}>3.2 Data we collect automatically:</h3>
      <p style={S.p}>Garden For Life uses no analytics, no trackers and no advertising networks. We build no profile of your browsing behaviour. What is recorded automatically is limited to:</p>
      <ul style={S.ul}>
        <li style={S.li}><strong style={S.strong}>Browser type (user agent):</strong> recorded at the moment you give consent and when you submit feedback — as evidence of that moment</li>
        <li style={S.li}><strong style={S.strong}>Technical server logs</strong> kept by our hosting provider, which expire automatically after a short period. Our own log lines contain no email addresses</li>
        <li style={S.li}><strong style={S.strong}>Update check of the desktop application:</strong> on start-up and every four hours thereafter the application asks downloads.gardenforlife.nl whether a new version exists. As with any internet request, the server sees your IP address and the application version — no account data</li>
        <li style={S.li}><strong style={S.strong}>Anonymous tool requests:</strong> without account, cookies or identifiers — see article 6, "Anonymous tools"</li>
      </ul>
      <p style={S.p}>We do not record pages visited, clicks, time spent, geolocation or device identifiers.</p>

      <h3 style={S.h3}>3.3 Assessment Data &amp; Profile Data (Art. 9 GDPR)</h3>
      <p style={S.p}>The following data is processed after explicit consent and falls under Art. 9 GDPR:</p>
      <ul style={S.ul}>
        <li style={S.li}><strong style={S.strong}>Raw assessment answers:</strong> your individual choices per question (responses array) — held only in your own browser tab during the session, never stored by us</li>
        <li style={S.li}><strong style={S.strong}>Subject results per theme:</strong> aggregated scores for each of the 5 themes (subjectResults)</li>
        <li style={S.li}><strong style={S.strong}>Archetype scores:</strong> the calculated score profile per archetype (scores)</li>
        <li style={S.li}><strong style={S.strong}>Archetype details:</strong> the elaborated archetype analysis including the 5-basket decomposition per archetype — Nature Core, Green Hardware, Culture Core, Blue Feedback, Yellow Cognitive, Purple Shadow (archetypeDetails)</li>
        <li style={S.li}><strong style={S.strong}>Full generated report:</strong> including Main/Support Archetype, Extended Archetype, shadow/blindspot analysis, tactical recommendations and AI Agent Prompt</li>
        <li style={S.li}><strong style={S.strong}>Content of uploaded files (uploadedFileContents):</strong> where applicable — the text extracted from a personality report you optionally upload (PDF, DOCX or TXT; images are not accepted). Before the text is read or sent to the AI model, our server removes names, email addresses, phone numbers, postcodes and dates of birth, and the file gets a neutral name — your own file name never leaves your device. Garden For Life does not store the content; it is processed solely by the Claude AI model for report generation. The automatic removal catches the common forms but cannot recognise everything: you remain responsible for what you upload.</li>
      </ul>
      <p style={S.p}>Together with any OCEAN scores, this is your <em>full profile</em>. It exists as a single instance, only in your own browser tab during your session. To generate your report it is sent to our server in Frankfurt and to the Claude AI model (Anthropic) for processing; our server processes it in working memory and <strong style={S.strong}>does not store it</strong> — no database record and no cache, whether or not you are logged in. Garden For Life, including its administrator, therefore has no access to your answers, full profile or report afterwards. What remains in your account is only the <em>partial profile</em> — the data needed to draw your orb and fill your account screen. Article 6 sets out exactly what that is and how long each part persists.</p>

      <h2 style={S.h2}>4. Purposes of Data Processing</h2>
      <p style={S.p}>We process your data for the following purposes:</p>
      <ul style={S.ul}>
        <li style={S.li}>Delivery of Assessment services and generation of personal profile reports</li>
        <li style={S.li}>Account management and authentication</li>
        <li style={S.li}>Communication about the Services</li>
        <li style={S.li}>Handling payments, activation codes and the 14-day money-back guarantee</li>
        <li style={S.li}>System improvements (on the basis of anonymised data)</li>
        <li style={S.li}>Compliance with legal obligations</li>
        <li style={S.li}>Protection against fraud and misuse, including misuse of the money-back guarantee</li>
      </ul>
      <h2 style={S.h2}>5. Legal Basis for Processing</h2>
      <p style={S.p}>The processing of your data is based on:</p>
      <ul style={S.ul}>
        <li style={S.li}>Performance of a contract (use of the Platform, the purchase of the full report and the money-back guarantee)</li>
        <li style={S.li}>Explicit consent (for Art. 9 psychological data)</li>
        <li style={S.li}>Legitimate interest (system security, fraud prevention and the grey list after a refund)</li>
        <li style={S.li}>Compliance with legal obligations (the tax retention obligation for payments)</li>
      </ul>
      <h2 style={S.h2}>6. Storage and Retention Period</h2>
      <p style={S.p}>Garden For Life operates three clearly separated tiers. On our servers only tier 1 is kept, together with the payment data, consent records, feedback, the card text of unlocked reports and the anonymous access ticket data described below. Tier 2 exists only in your own browser tab during your session; tier 3 is never stored.</p>

      <h3 style={S.h3}>Tier 1 — Permanent, for as long as your account exists</h3>
      <table style={S.table}>
        <thead><tr><th style={S.th}>Data</th><th style={S.th}>Why it has to remain</th></tr></thead>
        <tbody>
          <tr><td style={S.td}>Email address and display name (encrypted), password hash</td><td style={S.td}>To let you log in and to recognise your account</td></tr>
          <tr><td style={S.td}>The <strong style={S.strong}>hash</strong> of your crystal code (SHA-256) — never the code itself</td><td style={S.td}>A code stays valid for life but can be redeemed only once. Without this hash the same PDF could open a second account.</td></tr>
          <tr><td style={S.td}><strong style={S.strong}>The partial profile:</strong> the archetype names, the render-only orb geometry, the normalised 12-point shape vector, a summary of the basket distribution per archetype (for the wheel on your card) and the accompanying card texts</td><td style={S.td}>This draws your orb, fills your account screen and — if you set your profile to public — your public card in the Verbonden directory. Other users have to be able to see it, which is why it sits on our server rather than only on your device.</td></tr>
          <tr><td style={S.td}>Received messages (encrypted) — including messages from Garden For Life itself, such as the welcome message for a new account — and connection requests</td><td style={S.td}>These arrive while your device is switched off and have to land somewhere</td></tr>
        </tbody>
      </table>

      <h3 style={S.h3}>Tier 2 — Only during your session (not stored)</h3>
      <p style={S.p}>Your full profile — your raw answers, the results per theme, the scores per archetype, the 5-basket decomposition, any OCEAN scores and the generated analysis — exists as a <strong style={S.strong}>single instance in your own browser tab</strong>, for as long as your session lasts. To build your report it is sent to our server and to the Claude AI model (Anthropic); our server processes it in working memory and does not store it — no database record, no cache, whether or not you are logged in. We, including our administrator, therefore cannot look at your answers, full profile or report afterwards. Each report then ends in one of two ways:</p>
      <ul style={S.ul}>
        <li style={S.li}><strong style={S.strong}>Unlocked</strong> (paid via Stripe or opened with an activation code): only then does the crystal code appear in the full report. You download the PDF; that PDF is your only copy, meant for your own local working folder. The crystal code in it stays valid for life and can be redeemed for an account once.</li>
        <li style={S.li}><strong style={S.strong}>Not unlocked:</strong> as soon as you leave the report page (close the tab, reload or navigate away), the report is deleted in full — your full profile disappears from the tab together with the encrypted crystal code, and our server deletes the card text it held under that code's hash. Only if that deletion signal does not arrive (for example because the connection drops) does the encrypted code expire after 24 hours, and the card text is deleted in the nightly sweep at 00:00 (Europe/Amsterdam).</li>
      </ul>
      <p style={S.p}>An unpaid report can therefore never be retrieved later. The full report can only be bought once, directly after the test; to pay or download later, you take a new test. The short report remains free to download and contains no crystal code.</p>
      <p style={S.p}>Feedback you send us voluntarily (the review form) does not fall under this: we keep it, together with the email address you give, for 90 days, after which it is deleted automatically. Feedback is <strong style={S.strong}>not</strong> linked to your account, and your archetype is not stored with it: we use it only to word the confirmation email.</p>

      <h3 style={S.h3}>Payments, activation codes and refunds</h3>
      <p style={S.p}>The short report is free. For the full report you pay via Stripe (iDEAL or credit card) or use an activation code. The payment form on our page is loaded by Stripe: your card or account details go straight to Stripe and never reach us. At launch the full report is only for sale in the Netherlands.</p>
      <table style={S.table}>
        <thead><tr><th style={S.th}>Data</th><th style={S.th}>How long</th><th style={S.th}>Why</th></tr></thead>
        <tbody>
          <tr><td style={S.td}>Unlock record during the refund period: payment reference, amount and VAT, date, status (paid or refunded), the time you saved the PDF, the proof of your agreement (time, terms version and a hash of the agreement text), any answers to questions from a moderator and the <strong style={S.strong}>hash</strong> of the crystal code in that report</td><td style={S.td}>Until day 15 after payment. If a refund is under way, or an administrator holds the link because a refund is still being processed: at most 30 days longer</td><td style={S.td}>To match a refund or dispute to the right report. The proof of agreement and the download time show, in a dispute, that you agreed and received the report.</td></tr>
          <tr><td style={S.td}>Unlock record after the period — <strong style={S.strong}>unlinked</strong>: only the <strong style={S.strong}>hash</strong> of the crystal code, that the report was unlocked, whether it was refunded, and the date rounded to the month. Payment reference, amount, VAT, proof of agreement, download time, email address and answers have been removed</td><td style={S.td}>For as long as that crystal code remains valid</td><td style={S.td}>Without this record the code opens no account. Because the payment details have been removed, nobody at Garden For Life can see any more which payment belongs to which report or code.</td></tr>
          <tr><td style={S.td}>Bookkeeping: per payment and per refund a numbered payment receipt (PDF, without name or email address) with the payment reference, amount, VAT and the proof of agreement</td><td style={S.td}>7 years</td><td style={S.td}>The law requires us to keep payment records for 7 years. After day 15 this receipt can no longer be linked to your report or your crystal code.</td></tr>
          <tr><td style={S.td}>A payment attempt: internal reference, the hash of the crystal code, the email address (encrypted), the country you state, amount, VAT and status</td><td style={S.td}>Unpaid: 30 days. Paid: until 1 day after the 14-day refund period. Deleted automatically afterwards</td><td style={S.td}>To link the payment to the right report, also when your tab closes while your bank is still processing the payment.</td></tr>
          <tr><td style={S.td}>The email address with a payment (encrypted)</td><td style={S.td}>Until the 14-day refund period has passed (at the latest when the payment is unlinked); deleted automatically afterwards</td><td style={S.td}>To match a refund request to the right payment.</td></tr>
          <tr><td style={S.td}><strong style={S.strong}>Grey list</strong> after a refund: the email address (encrypted) and, per refund, the date and the payment reference</td><td style={S.td}>2 years after the latest refund; deleted automatically afterwards</td><td style={S.td}>To prevent misuse of the money-back guarantee.</td></tr>
          <tr><td style={S.td}>Activation codes</td><td style={S.td}>Until used; afterwards as a logbook line (time only)</td><td style={S.td}>A code can be used once. We record nothing about you when you redeem it.</td></tr>
        </tbody>
      </table>
      <p style={S.p}>If you ask for your money back within 14 days, the crystal code in that report is blocked. If you opened an account with that code and it is the only reading in that account, the account is deleted (as in a regular account deletion). If the account also holds readings from other reports, only the refunded reading is deleted and you keep the full access your other reports give. Your email address goes on the grey list, also if you have an account. That does not stop you from buying: only on a later refund request does a moderator first ask you a few questions and then decide — a person, never an automated system.</p>
      <p style={S.p}><strong style={S.strong}>Unlinking on day 15.</strong> On the fifteenth day after your payment we break the link between the payment and your report: the payment details disappear from the unlock record and remain only in the bookkeeping, where they no longer point to your report or your code. If a refund is under way at that moment, the link remains for at most 30 days longer so the refund can be completed; an administrator can do the same while a refund is still being processed. After unlinking, a chargeback through your bank or credit card can no longer be linked to your report and does not block your code.</p>

      <h3 style={S.h3}>Tier 3 — Never stored</h3>
      <ul style={S.ul}>
        <li style={S.li}>Your raw assessment answers and your full profile (results per theme, scores per archetype, 5-basket decomposition, OCEAN scores and the generated analysis). Our server processes them in working memory only and writes nothing to a database or cache.</li>
        <li style={S.li}>The PDF you upload. It is read in working memory to extract the code and the partial profile, then discarded — no copy is ever written to our servers.</li>
        <li style={S.li}>The contents of a personality report you optionally upload (PDF, DOCX or TXT). Names and contact details are removed before the text is read; nothing is kept afterwards.</li>
        <li style={S.li}>The generated report itself. The PDF you downloaded is the only copy that continues to exist.</li>
        <li style={S.li}>The raw crystal code. With your analysis your browser receives only an encrypted copy it cannot read; the code itself only appears in the full report once it has been paid for or unlocked. We keep only its irreversible hash.</li>
      </ul>

      <h3 style={S.h3}>The card text in your report</h3>
      <p style={S.p}>While your report is being written, the model produces two short texts meant for your profile card in the account — an in-depth description of your gift and a summary of your geometry. Those two texts appear in the data block at the back of the full report (the PDF), together with a digital signature from our server. We do <strong style={S.strong}>not</strong> keep them: until you redeem the code, they exist only in your report.</p>
      <p style={S.p}>When you redeem the code by uploading the PDF, our server reads the texts from the PDF, just like the crystal code itself, and adds them to your account — only if the signature matches. That way no one can replace the text on a public card by editing the PDF; an edited text is ignored. For reports from before 19 September 2026 our server kept these texts separately, linked to the <em>hash</em> of the crystal code and to nothing else. That copy is deleted as soon as the code is redeemed; for a report that was not paid for or unlocked, the nightly sweep at 00:00 (Europe/Amsterdam) deletes it.</p>

      <h3 style={S.h3}>Your own working folder</h3>
      <p style={S.p}>The Garden For Life desktop application is the full platform, with access to one folder on <strong style={S.strong}>your own device</strong>: the application creates it in your home folder, and you control and move it. Your reports (as &lt;date&gt;-&lt;archetype&gt;.pdf) and a copy of your partial profile are stored there, and — once the tools are available — your full profile and what the tools produce for you. A folder belongs to one account: the application refuses a folder already linked to another account. The application remembers only <em>where</em> the folder is, in its own data directory on your device. We have no access to the folder and keep no copy; because we keep no copy, safeguarding it is your own responsibility. Uninstalling the application leaves the folder in place.</p>

      <h3 style={S.h3}>Anonymous tools</h3>
      <p style={S.p}>Tools that work with your personal data run in the application. When they need computing power from us (for example an AI model), that request goes <strong style={S.strong}>anonymously</strong>: without login credentials, without cookies and without any data pointing to you, your account, your device or your folder. To show that you have access, the application uses single-use access tickets that we sign blindly (RFC 9474): we sign them without seeing them, so we cannot trace a spent ticket back to the account that received it. The tickets are stored locally in the application. A tool's input and output are neither logged nor kept; your IP address is visible to our hosting provider but is not recorded on this route.</p>
      <table style={S.table}>
        <thead><tr><th style={S.th}>Data</th><th style={S.th}>How long</th><th style={S.th}>Why</th></tr></thead>
        <tbody>
          <tr><td style={S.td}>Per account the <strong style={S.strong}>number</strong> of access tickets issued in a month (never the tickets themselves)</td><td style={S.td}>Until the end of the following month; deleted automatically afterwards</td><td style={S.td}>To enforce the monthly maximum (300) and to issue tickets only to accounts with access.</td></tr>
          <tr><td style={S.td}>A SHA-256 hash of each spent access ticket, without time or account</td><td style={S.td}>Until the end of the following month; deleted automatically afterwards</td><td style={S.td}>So that a ticket can be used only once.</td></tr>
        </tbody>
      </table>
      <h2 style={S.h2}>7. Recipients / Transfers</h2>
      <table style={S.table}>
        <thead><tr><th style={S.th}>Recipient</th><th style={S.th}>Role</th><th style={S.th}>Data processing agreement</th></tr></thead>
        <tbody>
          <tr><td style={S.td}>Anthropic (Claude API)</td><td style={S.td}>Processor — assessment data is transferred for report generation; an uploaded personality report only after names and contact details have been removed; tool requests without any data about the user</td><td style={S.td}>Automatically in force through acceptance of the Anthropic Commercial Terms of Service — March 2026</td></tr>
          <tr><td style={S.td}>MongoDB Atlas</td><td style={S.td}>Processor — database storage in Frankfurt (EU)</td><td style={S.td}>In place via the Atlas platform DPA (online acceptance)</td></tr>
          <tr><td style={S.td}>Render.com</td><td style={S.td}>Processor — hosting of the application server (Frankfurt region, EU). All requests pass through it; no profile data is retained on the host.</td><td style={S.td}>In place via the Render DPA (online acceptance)</td></tr>
          <tr><td style={S.td}>Cloudflare</td><td style={S.td}>Processor — delivery of the website (CDN) and DNS, and storage and delivery of the desktop application's installers and updates (downloads.gardenforlife.nl)</td><td style={S.td}>Automatically via the Self-Serve Subscription Agreement</td></tr>
          <tr><td style={S.td}>Google Workspace</td><td style={S.td}>Processor — sending of email (confirmations, verification links, the confirmation of your feedback and the access email for your report)</td><td style={S.td}>Covered by the Google Workspace DPA</td></tr>
          <tr><td style={S.td}>Stripe Payments Europe, Limited (Dublin, Ireland, EU)</td><td style={S.td}>Independent controller for the payment — processes your payment details, carries out the payment and any refund, calculates the VAT (Stripe Tax) and runs fraud checks. We pass Stripe the amount, a description, a random internal reference and the country for the VAT calculation; we receive the payment status, the payment reference, the country of your card or billing address and the VAT amount. Stripe may transfer data to Stripe, Inc. in the United States under the EU-US Data Privacy Framework and standard contractual clauses.</td><td style={S.td}>Not applicable: Stripe processes payment data under its own responsibility and its own privacy statement [Verification recommended]</td></tr>
        </tbody>
      </table>
      <p style={S.p}>Report generation runs exclusively through Claude (Anthropic). The platform configuration contains connections for other AI providers; these are not used in the production environment. Should that change, this list will be updated before they are put into use.</p>
      <p style={S.p}>If the user uploads a personality report (PDF, DOCX or TXT), the extracted text is likewise processed by Claude — after our server has removed names, email addresses, phone numbers, postcodes and dates of birth and given the file a neutral name. Images are not accepted and never go to the model. The automatic removal catches the common forms; personal information it does not recognise does reach Anthropic. Garden For Life is not responsible for the personal data that the user includes in uploaded files. Users are alerted to this in the consent screen and at the moment of upload.</p>
      <h2 style={S.h2}>8. Your Rights</h2>
      <p style={S.p}>Under the GDPR you have the following rights:</p>
      <ul style={S.ul}>
        <li style={S.li}><strong style={S.strong}>Right of access:</strong> You can request a copy of your personal data</li>
        <li style={S.li}><strong style={S.strong}>Right to rectification:</strong> You can have inaccurate data corrected</li>
        <li style={S.li}><strong style={S.strong}>Right to erasure:</strong> You can request deletion of your data ("right to be forgotten"). We keep payment records after such a request for as long as the law requires</li>
        <li style={S.li}><strong style={S.strong}>Right to restriction:</strong> You can restrict the processing of your data</li>
        <li style={S.li}><strong style={S.strong}>Right to data portability:</strong> You can receive your data in a structured format</li>
        <li style={S.li}><strong style={S.strong}>Right to object:</strong> You can object to certain processing activities, including your placement on the grey list</li>
      </ul>
      <p style={S.p}>To exercise these rights, send an email to <strong style={S.strong}>yuanwullink30@gfl.community</strong>.</p>
      <h2 style={S.h2}>9. Security</h2>
      <p style={S.p}>We implement the following technical and organisational measures to protect your data:</p>
      <ul style={S.ul}>
        <li style={S.li}><strong style={S.strong}>Encryption in transit:</strong> All connections run via TLS 1.2+ (HTTPS). Database connections are likewise encrypted.</li>
        <li style={S.li}><strong style={S.strong}>Encryption at rest:</strong> All server data is encrypted via AES-256-GCM (MongoDB Atlas standard). In addition, email addresses and display names are further encrypted at field level with AES-256-GCM before they are stored.</li>
        <li style={S.li}><strong style={S.strong}>Access restriction:</strong> The database is protected by credentials and network rules; only the application server and the administrator have access.</li>
        <li style={S.li}><strong style={S.strong}>Consent record:</strong> The moment you give consent is recorded with a timestamp, so that it can be demonstrated that — and for what — you gave consent. These records are kept for 7 years as proof that processing was lawful. The consent at the start of the test contains no account and no email address; the consent when saving your PDF contains the email address you enter there, the type of consent and your browser type.</li>
        <li style={S.li}><strong style={S.strong}>Decoupling in time:</strong> While your report is open, the platform sends no requests carrying your account details; afterwards only after a random delay of 1.5 to 4 minutes. That way a report cannot be linked to your account by its timing. The same applies to tools.</li>
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
      <p style={S.updated}>Version date: 27 September 2026 | Version 2.1 | Language: English</p>
      <p style={S.p}>Garden For Life does not use HTTP cookies. The platform works exclusively with <strong style={S.strong}>localStorage</strong> and <strong style={S.strong}>sessionStorage</strong> — browser storage that resides only on your own device and is never sent automatically to our servers. There is no cookie banner on this website because no consent is legally required for this. This policy applies to the website and to the desktop application (see 2.4).</p>
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
          <tr><td style={S.td}>gfl_token</td><td style={S.td}>Until logout</td><td style={S.td}>JWT authentication token — identifies your logged-in session. Contains no password; it does contain a user ID and your email address. In the desktop application with “Remember my password” ticked you stay logged in for 30 days after your last successful login; without that tick the session ends as soon as you close the application.</td></tr>
          <tr><td style={S.td}>gfl_session_ts</td><td style={S.td}>Until logout</td><td style={S.td}>Time of your last login — a session without a crystal code expires after 24 hours; in the desktop application with “Remember my password” ticked after 30 days.</td></tr>
          <tr><td style={S.td}>gfl_orb_code</td><td style={S.td}>Until logout or a code change</td><td style={S.td}>Your crystal code, after you log in with it or link a new code. This is a login credential: treat the device as trusted.</td></tr>
          <tr><td style={S.td}>gfl_orb_config</td><td style={S.td}>Until logout</td><td style={S.td}>The shape of your orb (for drawing only), so your account shows immediately.</td></tr>
          <tr><td style={S.td}>gfl_client_profile</td><td style={S.td}>Until logout</td><td style={S.td}>Display name, archetype name and — if you gave them — country and age, for the connection menu.</td></tr>
          <tr><td style={S.td}>gfl_boot_lesson</td><td style={S.td}>Until logout</td><td style={S.td}>The life lesson of your archetype, for the start screen after logging in.</td></tr>
          <tr><td style={S.td}>gfl_language_choice</td><td style={S.td}>Locally permanent</td><td style={S.td}>Your language choice (Dutch or English).</td></tr>
          <tr><td style={S.td}>gfl_tool_tickets</td><td style={S.td}>Until used; at most until the end of the following month</td><td style={S.td}>Desktop application only: anonymous, single-use access tickets for tools (see the Privacy Policy, article 6). They contain no account or personal data.</td></tr>
          <tr><td style={S.td}>gfl_remember_login</td><td style={S.td}>Locally permanent</td><td style={S.td}>Desktop application only: your choice for “Remember my password” (on or off). Your password itself is never stored — only the login session (gfl_token).</td></tr>
        </tbody>
      </table>
      <p style={S.p}><strong style={S.strong}>Please note:</strong> local storage holds at most parts of your <em>partial profile</em> (archetype name, orb shape, life lesson) to show your account quickly. Your answers, your full profile and your report are not placed in localStorage or sessionStorage: they exist only in the working memory of your browser tab during your session and disappear when you leave the report page. Leftovers of storage keys from earlier versions of the platform that did hold assessment data (such as gfl_assessment_session, gfl_assessment_history, gfl_pending_assessment, gfl_assessment_id and gfl_analysis_sections) are cleared automatically.</p>

      <h3 style={S.h3}>2.2 Administrator Storage (localStorage)</h3>
      <p style={S.p}>The following items are stored only when the platform is used as an administrator. For ordinary users they are never created.</p>
      <table style={S.table}>
        <thead><tr><th style={S.th}>Key</th><th style={S.th}>Retention</th><th style={S.th}>Purpose</th></tr></thead>
        <tbody>
          <tr><td style={S.td}>gfl_invoice_number</td><td style={S.td}>Locally permanent</td><td style={S.td}>Invoice number counter — stored locally.</td></tr>
        </tbody>
      </table>

      <h3 style={S.h3}>2.3 SessionStorage</h3>
      <p style={S.p}>SessionStorage works identically to localStorage but is automatically cleared as soon as you close the browser window or tab.</p>
      <table style={S.table}>
        <thead><tr><th style={S.th}>Key</th><th style={S.th}>Retention period</th><th style={S.th}>Purpose</th></tr></thead>
        <tbody>
          <tr><td style={S.td}>chunk_reload</td><td style={S.td}>When the browser window or tab closes</td><td style={S.td}>One-time reload safeguard for an outdated deployment version — prevents endless reload loops after a platform update.</td></tr>
          <tr><td style={S.td}>gfl_workspace_reminder_seen</td><td style={S.td}>When the browser window or tab closes</td><td style={S.td}>Remembers that the reminder about your working folder has already been shown in this session.</td></tr>
          <tr><td style={S.td}>gfl_login_alive</td><td style={S.td}>When the application closes</td><td style={S.td}>Desktop application only: marks that you logged in during this launch of the application, so a login without “Remember my password” ends at the next launch.</td></tr>
        </tbody>
      </table>

      <h3 style={S.h3}>2.4 In the Desktop Application</h3>
      <p style={S.p}>The desktop application uses the same local storage as above, under its own address (app://gardenforlife) and only on your device. In addition, the application keeps in its own data directory on your device:</p>
      <ul style={S.ul}>
        <li style={S.li}><strong style={S.strong}>config.json</strong> — only the location of the working folder you chose. The contents of that folder stay in the folder itself.</li>
        <li style={S.li}><strong style={S.strong}>Update cache</strong> — a downloaded new version of the application, until it is installed.</li>
      </ul>
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
      <p style={S.p}>You can clear Garden For Life's local storage at any time via your browser settings. Please note: this removes your login status and, in the desktop application, your unused tool access tickets. Your working folder is not in browser storage and stays where it is. Garden For Life cannot restore erased local data.</p>
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
      <p style={{...S.p, textAlign: 'center', color: '#64748b', fontSize: '0.75rem', marginTop: '2rem', borderTop: '1px solid rgba(168,85,247,0.2)', paddingTop: '1rem'}}>Garden For Life — Cookie Policy & Local Storage | Version 2.1 | 27 September 2026</p>
    </>
  ),

  ai: (
    <>
      <p style={S.updated}>Version date: 27 September 2026 | Version 2.1</p>
      <h2 style={S.h2}>1. EU AI Act Compliance</h2>
      <p style={S.p}>Garden for Life aims for full transparency about the use of artificial intelligence on the platform, in line with the European AI Regulation (AI Act).</p>
      <h2 style={S.h2}>2. What Is AI in Garden for Life?</h2>
      <p style={S.p}>Garden for Life uses two separate parts. Your archetypes, scores and the geometry of your profile are calculated by the <strong style={S.strong}>Deltawerken calculation model</strong>: a fixed calculation on your answers, without AI. The <strong style={S.strong}>report</strong> — the text that explains those results — is written by a language model: Claude, by Anthropic.</p>
      <div style={S.box}>
        <h3 style={S.h3}>⚠️ CRITICAL DISCLAIMER</h3>
        <p style={S.p}><strong style={S.strong}>This report is NOT a clinical diagnosis.</strong> Garden for Life is not a substitute for professional psychological, psychiatric or medical care. Always consult a qualified professional for health-related questions.</p>
      </div>
      <h2 style={S.h2}>3. Which AI Technologies Do We Use?</h2>
      <ul style={S.ul}>
        <li style={S.li}><strong style={S.strong}>Language model (Claude, Anthropic):</strong> writes the report and the short card texts, based on the calculated results and Garden For Life's instructions. It is called through Anthropic's API; Garden For Life does not train or modify the model.</li>
        <li style={S.li}><strong style={S.strong}>Deltawerken calculation model (not AI):</strong> calculates the scores per archetype, the basket distribution, the geometry, your Main and Support archetype and your shadow and blind spot. The same answers always give the same result.</li>
        <li style={S.li}><strong style={S.strong}>Automatic removal of personal data (not AI):</strong> fixed rules that take names and contact details out of an uploaded personality report before the model sees the text.</li>
      </ul>
      <p style={S.p}>Garden For Life uses no self-trained neural networks, no face or voice analysis and no analysis of your behaviour on the platform.</p>
      <h2 style={S.h2}>4. Which Data Is Provided to the AI System?</h2>
      <p style={S.p}>The AI system receives the full assessment data — anonymised (no name/email/IP), but including raw answers. This full profile is sent from your own browser tab, via our server, for processing only: neither our server nor Garden For Life stores it (see the Privacy Policy, article 6).</p>
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
        <p style={{ ...S.p, margin: 0 }}><strong style={{ color: '#fb923c' }}>Uploaded files:</strong> if you upload a personality report (PDF, DOCX or TXT; images are not accepted), its text goes to Claude — after our server has removed names, email addresses, phone numbers, postcodes and dates of birth and given the file a neutral name. This automatic removal catches the common forms; what it does not recognise does reach the servers of Anthropic (US). Garden For Life is not responsible for which personal data or other information the user includes in uploaded files.</p>
      </div>
      <p style={S.p}><strong style={S.strong}>Tools in the desktop application:</strong> when a tool uses an AI model, the request goes anonymously — without login credentials, cookies or any data pointing to you, your account, your device or your working folder. Input and output are not kept (see the Privacy Policy, article 6).</p>
      <h2 style={S.h2}>5. How Does It Work?</h2>
      <h3 style={S.h3}>Step 1: Calculation</h3>
      <p style={S.p}>The Deltawerken calculation model turns your answers into scores per archetype and a geometry. This is a fixed calculation, not AI.</p>
      <h3 style={S.h3}>Step 2: Writing the report</h3>
      <p style={S.p}>The calculated results go, together with Garden For Life's report instructions, to Claude. Claude recalculates nothing: it writes the text that explains the results.</p>
      <h3 style={S.h3}>Step 3: Your profile</h3>
      <p style={S.p}>The calculation places you in a dual-core model with:</p>
      <ul style={S.ul}>
        <li style={S.li}>Primary archetype (dominant personality style)</li>
        <li style={S.li}>Secondary archetype (supporting style)</li>
        <li style={S.li}>Shadow profile (withered or underdeveloped aspects)</li>
        <li style={S.li}>Blind spots (unconscious blind areas)</li>
      </ul>
      <h2 style={S.h2}>6. Training Data & Bias</h2>
      <p style={S.p}>Garden For Life does not train its own AI model and does not use your answers, report or uploads to train models. Claude was trained by Anthropic; under Anthropic's commercial terms, data sent through the API is not used to train Anthropic's models. The Deltawerken model is a self-reflection model built from archetypal patterns; it has not been trained on personal data.</p>
      <p style={S.p}>A language model can carry biases from its own training into how it phrases things. We watch for this in our instructions and work to:</p>
      <ul style={S.ul}>
        <li style={S.li}>Exclude prejudice on the grounds of gender, age, ethnic origin</li>
        <li style={S.li}>Respect cultural differences in communication styles</li>
        <li style={S.li}>Integrate non-Western perspectives</li>
      </ul>
      <h2 style={S.h2}>7. Accuracy & Validation</h2>
      <ul style={S.ul}>
        <li style={S.li}>✅ <strong style={S.strong}>Fixed calculation:</strong> The same answers give the same archetypes, scores and geometry</li>
        <li style={S.li}>⚠️ <strong style={S.strong}>Text can vary:</strong> Because a language model phrases the report, its text can differ slightly each time; the results it rests on do not</li>
        <li style={S.li}>⚠️ <strong style={S.strong}>Not clinically or scientifically validated:</strong> This model is aimed at self-exploration, not diagnostics</li>
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
        <li style={S.li}>Your original answers and full profile exist only in your own browser tab during your session; Garden For Life does not store them</li>
        <li style={S.li}>The AI model processes your answers individually — without name, email address or other direct identifiers from the platform</li>
        <li style={S.li}>No real-time personal monitoring</li>
        <li style={S.li}>While your report is open, the platform sends no requests carrying your account details, so the report cannot be linked to your account by its timing</li>
        <li style={S.li}>The calculated profile is processed in working memory only and is not stored on our servers; a report that is not unlocked is deleted in full as soon as you leave the report page</li>
        <li style={S.li}>No transfer into training data for future models</li>
      </ul>
      <h2 style={S.h2}>10. Improvements</h2>
      <ul style={S.ul}>
        <li style={S.li}>🔄 <strong style={S.strong}>Feedback:</strong> Through the review form you can tell us how well your report fits; we use that feedback (kept for 90 days) to improve the report instructions</li>
        <li style={S.li}>🔄 <strong style={S.strong}>No retraining:</strong> We do not retrain any model; improvements go into the calculation model and the instructions</li>
        <li style={S.li}>🔄 <strong style={S.strong}>Transparent updates:</strong> A change of AI provider or a material change is announced on this page before it is put into use</li>
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
        <li style={S.li}>✅ <strong style={S.strong}>Access:</strong> Which data goes to the model is set out in article 4</li>
        <li style={S.li}>✅ <strong style={S.strong}>Objection:</strong> Against automated profiling — you can always leave the test aside</li>
        <li style={S.li}>✅ <strong style={S.strong}>Erasure:</strong> See the Privacy Policy and the Data Retention &amp; Deletion page</li>
        <li style={S.li}>✅ <strong style={S.strong}>A human look:</strong> You can ask us questions about your report; a Garden For Life team member will take a look. This is not a psychological or clinical assessment</li>
      </ul>
      <h2 style={S.h2}>14. Complaints & Escalation</h2>
      <ol style={S.ol}>
        <li style={S.li}>Email: yuanwullink30@gfl.community</li>
        <li style={S.li}>We respond as soon as possible, at the latest within 30 days</li>
        <li style={S.li}>Lodge a complaint with your national AI supervisory authority</li>
      </ol>
      <h2 style={S.h2}>15. Future AI Improvements</h2>
      <ul style={S.ul}>
        <li style={S.li}>🔮 Multilingual support</li>
        <li style={S.li}>🔮 Cross-cultural validation</li>
        <li style={S.li}>🔮 Anonymous tools in the desktop application</li>
        <li style={S.li}>🔮 Improved explainability (why this profile?)</li>
      </ul>
      <h2 style={S.h2}>16. Contact</h2>
      <p style={S.p}><strong style={S.strong}>Email:</strong> yuanwullink30@gfl.community<br/><strong style={S.strong}>Subject:</strong> "AI transparency question" or "AI objection"<br/><strong style={S.strong}>Expected response:</strong> as soon as possible, at the latest within 30 days</p>
    </>
  ),
};
