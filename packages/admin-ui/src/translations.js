/** Management-app translations (the `admin` namespace). Registered by ./index.jsx via extendTranslations —
 *  deliberately not in @gfl/i18n, so none of this copy ships with the website or the desktop app. */

/* Shared across the invoice and credit-note documents (identical wording). */
const SPELL_LINE_1 = { nl: 'De luide stilte en de intense kalmte', en: 'The loud silence and the intense calm' };
const SPELL_LINE_2 = { nl: 'Wijzen de euros van jouw Bank naar mijn Hart', en: 'Guide the euros from your Bank to my Heart' };
const SETTLED_OR_REFUNDED = { nl: 'Het bedrag wordt verrekend of teruggestort', en: 'The amount will be offset or refunded' };
const WAITING_FOR = { nl: 'Wachten op', en: 'Waiting for' };
const SIGNATURE_WORD = { nl: 'handtekening', en: 'signature' };
const THANK_YOU = { nl: 'Bedankt voor uw vertrouwen', en: 'Thank you for your trust' };
const SIGNED_BY = { nl: 'Ondertekend door:', en: 'Signed by:' };
const NEW_ITEM = { nl: 'Nieuw Item', en: 'New item' };
const SUBTOTAL = { nl: 'Subtotaal', en: 'Subtotal' };
const VAT_21 = { nl: 'BTW 21%', en: 'VAT 21%' };
const TOTAL_CAPS = { nl: 'TOTAAL', en: 'TOTAL' };
const COL_DESCRIPTION = { nl: 'Omschrijving', en: 'Description' };
const COL_HOURS = { nl: 'Uur', en: 'Hours' };
const COL_RATE = { nl: 'Tarief Ex.-', en: 'Rate excl.-' };
const COL_AMOUNT = { nl: 'Bedrag', en: 'Amount' };
const CLIENT_NAME_PH = { nl: 'Klantnaam', en: 'Client name' };
const CLIENT_ADDRESS_PH = { nl: 'Klant Adres / Contact', en: 'Client address / contact' };
const QUANTITY_PH = { nl: 'Aantal', en: 'Quantity' };
const PRICE_PH = { nl: 'Prijs', en: 'Price' };
const SIGNATURE_HEADING = { nl: 'Handtekening', en: 'Signature' };
const CLEAR = { nl: 'Wissen', en: 'Clear' };
const SAVE = { nl: 'Opslaan', en: 'Save' };
const SAVE_CONTACT = { nl: 'Contact opslaan', en: 'Save contact' };
const NO_SAVED_CONTACTS = { nl: 'Geen opgeslagen contacten', en: 'No saved contacts' };
const ADD_LINE = { nl: 'Regel Toevoegen', en: 'Add Line' };
const DATE_AUTOSYNC = { nl: 'Datum (auto-sync)', en: 'Date (auto-sync)' };
const VAT_OVER_SUBTOTAL = { nl: 'BTW wordt berekend over het subtotaal', en: 'VAT is calculated over the subtotal' };
const PRICES_EXCL_VAT = { nl: 'Prijzen exclusief BTW', en: 'Prices excluding VAT' };
const SEND_EMAIL_HEADING = { nl: 'E-mail Versturen', en: 'Send Email' };
const SUBJECT = { nl: 'Onderwerp', en: 'Subject' };
const RECIPIENT_EMAIL_REQ = { nl: 'Ontvanger E-mail *', en: 'Recipient Email *' };
const EMAIL_PLACEHOLDER = { nl: 'naam@voorbeeld.nl', en: 'name@example.com' };
const CC_PLACEHOLDER = { nl: 'cc@voorbeeld.nl', en: 'cc@example.com' };
const SENT_BANG = { nl: '✓ Verstuurd!', en: '✓ Sent!' };
const SENDING_CAPS = { nl: 'BEZIG MET VERSTUREN...', en: 'SENDING...' };
const SEND_FAILED = { nl: 'Versturen mislukt', en: 'Sending failed' };
const ENTER_EMAIL = { nl: 'Vul een e-mailadres in', en: 'Enter an email address' };
const DATE_LABEL = { nl: 'Datum:', en: 'Date:' };
const DATE_CAPS = { nl: 'DATUM:', en: 'DATE:' };
const PAGE_WORD = { nl: 'Pagina', en: 'Page' };
const LOADING = { nl: 'Laden...', en: 'Loading...' };
const SAVED_CHECK = { nl: '✓ Opgeslagen', en: '✓ Saved' };
const DELETE_WORD = { nl: 'Verwijderen', en: 'Delete' };
const REFRESH_CAPS = { nl: '↻ VERNIEUWEN', en: '↻ REFRESH' };
const TOTAL_WORD = { nl: 'Totaal', en: 'Total' };
const PASSKEYS_WORD = { nl: 'Passkeys', en: 'Passkeys' };

export default {
  admin: {
    /* ═══════════ Management app (apps/admin + apps/admin-desktop) ═══════════ */
    app: {
      updateReady: { nl: 'Nieuwe versie klaar:', en: 'New version ready:' },
      restart: { nl: 'Herstarten', en: 'Restart' },
      // The dashboard header's update control (AppUpdate.jsx) — same wording as the client app.
      statusChecking: { nl: 'Zoeken naar een nieuwe versie…', en: 'Looking for a new version…' },
      statusCurrent: { nl: 'Je hebt de nieuwste versie', en: 'You have the latest version' },
      statusDownloading: {
        nl: (v, p) => `Versie ${v} wordt gedownload${p ? ` (${p}%)` : ''}…`,
        en: (v, p) => `Downloading version ${v}${p ? ` (${p}%)` : ''}…`,
      },
      statusReady: { nl: (v) => `Versie ${v} staat klaar`, en: (v) => `Version ${v} is ready` },
      statusError: { nl: 'Kon niet op updates controleren — ben je online?', en: 'Could not check for updates — are you online?' },
      statusDev: { nl: 'Ontwikkelversie — updates staan uit', en: 'Development build — updates are off' },
      check: { nl: 'Controleren op updates', en: 'Check for updates' },
      restartUpdate: { nl: 'Herstarten en bijwerken', en: 'Restart and update' },
    },

    /* ═══════════ Management app login (apps/admin) ═══════════ */
    login: {
      title: { nl: 'Beheer', en: 'Management' },
      email: { nl: 'E-mailadres', en: 'Email address' },
      password: { nl: 'Wachtwoord', en: 'Password' },
      submit: { nl: 'Inloggen', en: 'Log in' },
      busy: { nl: 'Bezig…', en: 'Working…' },
      failed: { nl: 'Inloggen mislukt', en: 'Login failed' },
      notAllowed: { nl: 'Dit account heeft geen beheerrechten.', en: 'This account has no management rights.' },
    },

    /* ═══════════ Dashboard shell + tabs ═══════════ */
    dashboard: {
      logout: { nl: 'Uitloggen', en: 'Log out' },
      title: { nl: 'Commandocentrum', en: 'Command Center' },
      loading: LOADING,

      tabs: {
        overview: { nl: 'Overzicht', en: 'Overview' },
        users: { nl: 'Gebruikers', en: 'Users' },
        assessments: { nl: 'Assessments', en: 'Assessments' },
        questions: { nl: 'Vragen', en: 'Questions' },
        prompts: { nl: 'Prompts', en: 'Prompts' },
        formulieren: { nl: 'Formulieren', en: 'Forms' },
        passkeys: PASSKEYS_WORD,
        activationCodes: { nl: 'Activatiecodes', en: 'Activation codes' },
        reportUnlocks: { nl: 'Ontgrendelingen', en: 'Unlocks' },
        paymentRecords: { nl: 'Betalingen', en: 'Payments' },
        audit: { nl: 'Audit Log', en: 'Audit Log' },
        feedback: { nl: 'Feedback', en: 'Feedback' },
        contact: { nl: 'Contact', en: 'Contact' },
      },

      /* ── Overview tab ── */
      overview: {
        identityMatrix: { nl: 'Identiteitsmatrix', en: 'Identity Matrix' },
        status: { nl: 'Status', en: 'Status' },
        operational: { nl: 'OPERATIONEEL', en: 'OPERATIONAL' },
        rowUser: { nl: 'Gebruiker', en: 'User' },
        rowEmail: { nl: 'E-mail Protocol', en: 'Email Protocol' },
        rowAccessLevel: { nl: 'Toegangsniveau', en: 'Access Level' },
        rowSession: { nl: 'Sessie', en: 'Session' },
        sessionActive: { nl: 'ACTIEF', en: 'ACTIVE' },

        notesTitle: { nl: 'Admin Notities', en: 'Admin Notes' },
        notePlaceholder: { nl: 'Notitie toevoegen...', en: 'Add a note...' },
        noteSaved: SAVED_CHECK,
        noNotes: { nl: 'Geen notities', en: 'No notes' },

        errorsTitle: { nl: 'Foutmeldingen', en: 'Error Log' },
        errorsCaptured: {
          nl: (n) => `${n} fout${n !== 1 ? 'en' : ''} vastgelegd`,
          en: (n) => `${n} error${n !== 1 ? 's' : ''} captured`,
        },
        clearLog: { nl: 'Log Wissen', en: 'Clear Log' },
        noErrors: { nl: 'Geen fouten gedetecteerd', en: 'No errors detected' },
        noErrorsHint: {
          nl: 'Console- en runtime fouten verschijnen hier',
          en: 'Console and runtime errors appear here',
        },

        apiTitle: { nl: 'API Verbindingen', en: 'API Connections' },
        apiBackend: { nl: 'Backend API', en: 'Backend API' },
        apiBackendDesc: { nl: 'REST / MongoDB', en: 'REST / MongoDB' },
        apiAi: { nl: 'AI Provider', en: 'AI Provider' },
        apiAiDesc: { nl: 'Claude / Analyse', en: 'Claude / Analysis' },
        apiPdf: { nl: 'PDF Service', en: 'PDF Service' },
        apiPdfDesc: { nl: 'Rapportgeneratie', en: 'Report generation' },
        apiEncryption: { nl: 'Encryptie', en: 'Encryption' },
        apiEncryptionDesc: { nl: 'AES-256-GCM / PII', en: 'AES-256-GCM / PII' },

        healthLoading: { nl: 'LADEN...', en: 'LOADING...' },
        healthOnline: { nl: 'ONLINE', en: 'ONLINE' },
        healthOffline: { nl: 'OFFLINE', en: 'OFFLINE' },
        healthNoKey: { nl: 'GEEN SLEUTEL', en: 'NO KEY' },
        healthDisabled: { nl: 'UITGESCHAKELD', en: 'DISABLED' },
        healthUnknown: { nl: 'ONBEKEND', en: 'UNKNOWN' },
        healthOnlineWith: { nl: (x) => `ONLINE · ${x}`, en: (x) => `ONLINE · ${x}` },
        healthActiveWith: { nl: (x) => `ACTIEF · ${x}`, en: (x) => `ACTIVE · ${x}` },

        statUsers: { nl: 'Gebruikers', en: 'Users' },
        statAssessments: { nl: 'Assessments', en: 'Assessments' },
        statErrors: { nl: 'Fouten Vastgelegd', en: 'Errors Captured' },
        statContactRequests: { nl: 'Contactverzoeken', en: 'Contact Requests' },
      },

      /* ── Users tab ── */
      users: {
        created: { nl: 'Aangemaakt:', en: 'Created:' },
        lastLogin: { nl: 'Laatste login:', en: 'Last login:' },
        neverLoggedIn: { nl: 'Nog niet ingelogd', en: 'Never logged in' },
      },

      /* ── Prompts tab ── */
      prompts: {
        levelInDevelopment: {
          nl: 'Prompt configuratie voor dit level is nog in ontwikkeling.',
          en: 'Prompt configuration for this level is still in development.',
        },
        systemPromptHint: {
          nl: 'Dit is de instructie die de AI ontvangt om alle assessment data te interpreteren.',
          en: 'This is the instruction the AI receives to interpret all assessment data.',
        },
        contextDocuments: { nl: 'CONTEXT DOCUMENTEN', en: 'CONTEXT DOCUMENTS' },
        contextDocumentsHint: {
          nl: 'Upload Word, PDF of tekst bestanden. De inhoud wordt automatisch meegestuurd met elk AI verzoek als kennisbank context.',
          en: 'Upload Word, PDF or text files. Their content is automatically sent with every AI request as knowledge-base context.',
        },
        confirmDeleteDoc: {
          nl: (filename) => `Document "${filename}" verwijderen? Dit kan niet ongedaan worden.`,
          en: (filename) => `Delete document "${filename}"? This cannot be undone.`,
        },
        docsWithoutText: {
          nl: (count, names) => `${count} document(en) bevatten geen leesbare tekst: ${names}`,
          en: (count, names) => `${count} document(s) contain no readable text: ${names}`,
        },
        dropZone: {
          nl: 'Sleep bestanden hierheen of klik om te uploaden',
          en: 'Drag files here or click to upload',
        },
        noDocuments: {
          nl: 'Geen documenten geüpload. Upload bestanden om de AI kennisbank te vullen.',
          en: 'No documents uploaded. Upload files to fill the AI knowledge base.',
        },
        docCountTotal: {
          nl: (n, chars) => `${n} document${n !== 1 ? 'en' : ''} · totaal ${chars} tekens`,
          en: (n, chars) => `${n} document${n !== 1 ? 's' : ''} · ${chars} characters total`,
        },
        verified: { nl: '✓ DOCUMENTEN GEVERIFIEERD', en: '✓ DOCUMENTS VERIFIED' },
        saveVerify: { nl: '💾 SAVE & VERIFY DOCUMENTEN', en: '💾 SAVE & VERIFY DOCUMENTS' },
        allVerified: {
          nl: (n) => `✓ Alle ${n} document${n !== 1 ? 'en' : ''} succesvol geverifieerd`,
          en: (n) => `✓ All ${n} document${n !== 1 ? 's' : ''} verified successfully`,
        },
        charsSentAsContext: {
          nl: (chars) => `${chars} tekens worden meegestuurd als AI kennisbank context`,
          en: (chars) => `${chars} characters are sent along as AI knowledge-base context`,
        },
        docChars: {
          nl: (filename, chars) => `${filename} — ${chars} tekens`,
          en: (filename, chars) => `${filename} — ${chars} characters`,
        },
      },

      /* ── Questions tab ── */
      questions: {
        heading: { nl: 'VRAGEN', en: 'QUESTIONS' },
        levelInDevelopment: {
          nl: 'Dit vragenset is nog in ontwikkeling en wordt binnenkort toegevoegd.',
          en: 'This question set is still in development and will be added soon.',
        },
        confirmImportDocx: {
          nl: 'Dit vervangt ALLE bestaande vragen met het Word-document. Doorgaan?',
          en: 'This will replace ALL existing questions with the Word document. Continue?',
        },
        importedAlert: {
          nl: (layers, questions) => `✓ Geïmporteerd: ${layers} lagen, ${questions} vragen`,
          en: (layers, questions) => `✓ Imported: ${layers} layers, ${questions} questions`,
        },
        advancedTotal: {
          nl: (total) => `VRAGEN — ADVANCED (${total} total)`,
          en: (total) => `QUESTIONS — ADVANCED (${total} total)`,
        },
        exporting: { nl: 'EXPORTEREN...', en: 'EXPORTING...' },
        importing: { nl: 'IMPORTEREN...', en: 'IMPORTING...' },
      },

      /* ── Formulieren (forms) tab ── */
      formulieren: {
        templatesStat: { nl: 'Templates', en: 'Templates' },
        documentTemplates: { nl: 'Document Templates', en: 'Document Templates' },
        chooseTemplate: { nl: 'Kies een template', en: 'Choose a template' },
        templateFallback: { nl: 'Template', en: 'Template' },
        download: { nl: 'DOWNLOADEN', en: 'DOWNLOAD' },
        enterEmail: ENTER_EMAIL,
        sendFailed: SEND_FAILED,

        statusReady: { nl: 'gereed', en: 'ready' },
        statusConcept: { nl: 'concept', en: 'draft' },

        templates: {
          factuur: {
            label: { nl: 'Factuur', en: 'Invoice' },
            desc: {
              nl: 'Factuur template voor cliënten en zakelijke partners',
              en: 'Invoice template for clients and business partners',
            },
          },
          creditnota: {
            label: { nl: 'Creditnota', en: 'Credit Note' },
            desc: {
              nl: 'Creditnota template voor correcties en terugbetalingen',
              en: 'Credit note template for corrections and refunds',
            },
          },
          email: {
            label: { nl: 'E-mail', en: 'Email' },
            desc: {
              nl: 'E-mail verzenden met PDF bijlagen',
              en: 'Send email with PDF attachments',
            },
          },
          intake: {
            label: { nl: 'Intake Formulier', en: 'Intake Form' },
            desc: {
              nl: 'Standaard intake formulier voor nieuwe cliënten',
              en: 'Standard intake form for new clients',
            },
          },
          offerte: {
            label: { nl: 'Offerte', en: 'Quotation' },
            desc: {
              nl: 'Offerte template voor diensten en pakketten',
              en: 'Quotation template for services and packages',
            },
          },
          verzoek: {
            label: { nl: 'Verzoek Indienen', en: 'Submit Request' },
            desc: {
              nl: 'Intern verzoekformulier voor aanvragen en goedkeuringen',
              en: 'Internal request form for applications and approvals',
            },
          },
          rapportage: {
            label: { nl: 'Rapportage', en: 'Reporting' },
            desc: {
              nl: 'Rapportage template voor sessie- en voortgangsverslagen',
              en: 'Reporting template for session and progress reports',
            },
          },
          overeenkomst: {
            label: { nl: 'Overeenkomst', en: 'Agreement' },
            desc: {
              nl: 'Contract- en overeenkomst template voor samenwerking',
              en: 'Contract and agreement template for collaboration',
            },
          },
          brief: {
            label: { nl: 'Zakelijke Brief', en: 'Business Letter' },
            desc: {
              nl: 'Standaard brieftemplate met Garden For Life huisstijl',
              en: 'Standard letter template in the Garden For Life house style',
            },
          },
          evaluatie: {
            label: { nl: 'Evaluatie', en: 'Evaluation' },
            desc: {
              nl: 'Evaluatieformulier voor coaching trajecten',
              en: 'Evaluation form for coaching programmes',
            },
          },
        },

        editorTitle: { nl: (label) => `${label} — Template`, en: (label) => `${label} — Template` },
        editorPlaceholder: {
          nl: (label) => `Template-inhoud voor "${label}"...\n\nImporteer of bewerk hier het documentsjabloon. Dit is de template — niet de e-mailtekst.`,
          en: (label) => `Template content for "${label}"...\n\nImport or edit the document template here. This is the template — not the email body.`,
        },
        emailCardTitle: {
          nl: (label) => `✉ E-mail Versturen — ${label}`,
          en: (label) => `✉ Send Email — ${label}`,
        },
        recipientEmail: RECIPIENT_EMAIL_REQ,
        emailPlaceholder: EMAIL_PLACEHOLDER,
        recipientName: { nl: 'Naam Ontvanger', en: 'Recipient Name' },
        optional: { nl: 'Optioneel', en: 'Optional' },
        subject: SUBJECT,
        subjectPlaceholder: {
          nl: (label) => `Garden For Life — ${label}`,
          en: (label) => `Garden For Life — ${label}`,
        },
        bodyPlaceholder: {
          nl: (label) => `Typ hier de e-mailtekst voor "${label}"...\n\nDeze tekst wordt als e-mailinhoud verstuurd naar de ontvanger.`,
          en: (label) => `Type the email body for "${label}" here...\n\nThis text is sent to the recipient as the email content.`,
        },
        charsReady: {
          nl: (n) => `${n} tekens — klaar om te versturen`,
          en: (n) => `${n} characters — ready to send`,
        },
        writeBodyHint: {
          nl: 'Schrijf de e-mailtekst in het veld hierboven',
          en: 'Write the email body in the field above',
        },
        sent: SENT_BANG,
        sending: SENDING_CAPS,
        send: { nl: '✉ VERSTUREN', en: '✉ SEND' },
      },

      /* ── Feedback email settings card ── */
      feedbackEmail: {
        title: { nl: 'Feedback E-mail Instellingen', en: 'Feedback Email Settings' },
        intro: {
          nl: 'Tekst die verschijnt in de bevestigingsmail na het indienen van feedback.',
          en: 'Text shown in the confirmation email after feedback is submitted.',
        },
        messageText: { nl: 'Berichttekst', en: 'Message text' },
        messagePlaceholder: {
          nl: 'Bedankt voor je feedback! Wij zullen die gebruiken om het systeem te verbeteren.',
          en: 'Thanks for your feedback! We will use it to improve the system.',
        },
        saving: { nl: 'Opslaan...', en: 'Saving...' },
        save: SAVE,
        saved: SAVED_CHECK,
      },

      /* ── Contact tab ── */
      contact: {
        clientsSection: {
          nl: (n) => `Detailpagina Klanten (${n})`,
          en: (n) => `Clients With Detail Page (${n})`,
        },
        requestsSection: {
          nl: (n) => `Verzoeken${n > 0 ? ` (${n} nieuw)` : ''}`,
          en: (n) => `Requests${n > 0 ? ` (${n} new)` : ''}`,
        },
        changesSaved: { nl: '✓ Wijzigingen opgeslagen', en: '✓ Changes saved' },
        clientsTitle: { nl: 'Klanten met Detailpagina', en: 'Clients With a Detail Page' },
        edited: { nl: 'Bewerkt', en: 'Edited' },
        editButton: { nl: '✏ Bewerken', en: '✏ Edit' },
        resetButton: { nl: '↩ Reset', en: '↩ Reset' },
        editHeading: { nl: (name) => `✏ Bewerk: ${name}`, en: (name) => `✏ Edit: ${name}` },
        fieldName: { nl: 'Naam', en: 'Name' },
        fieldEmail: { nl: 'E-mail', en: 'Email' },
        fieldTagline: { nl: 'Tagline', en: 'Tagline' },
        fieldDescription: { nl: 'Beschrijving', en: 'Description' },
        saveEdit: { nl: '✓ Opslaan', en: '✓ Save' },
        cancel: { nl: 'Annuleren', en: 'Cancel' },
        requestsTitle: {
          nl: (n) => `Contactverzoeken (${n})`,
          en: (n) => `Contact Requests (${n})`,
        },
        statusNew: { nl: 'Nieuw', en: 'New' },
        statusHandled: { nl: 'Afgehandeld', en: 'Handled' },
        markAsNew: { nl: 'Markeer als nieuw', en: 'Mark as new' },
        markAsHandled: { nl: 'Markeer als afgehandeld', en: 'Mark as handled' },
        noRequests: { nl: 'Geen contactverzoeken', en: 'No contact requests' },
      },

      /* ── Report unlocks / refunds tab ── */
      reportUnlocks: {
        statTotal: TOTAL_WORD,
        statPaid: { nl: 'Betaald', en: 'Paid' },
        statCode: { nl: 'Via code', en: 'By code' },
        statRefunded: { nl: 'Terugbetaald', en: 'Refunded' },
        refresh: REFRESH_CAPS,
        loading: LOADING,
        title: { nl: (n) => `Ontgrendelde rapporten (${n})`, en: (n) => `Unlocked reports (${n})` },
        help: {
          nl: (days) => `Betaalde rapporten zijn ${days} dagen terug te betalen. Terugbetalen blokkeert de kristal-code van dat rapport. Was het de enige lezing van een account, dan wordt dat account verwijderd; anders vervallen alleen die lezing en de toegang die hij gaf. Het e-mailadres komt op de grijze lijst. Dit kan niet ongedaan worden.`,
          en: (days) => `Paid reports can be refunded for ${days} days. A refund blocks that report's crystal code. If it was an account's only reading, that account is deleted; otherwise only that reading and the access it gave lapse. The email address goes on the grey list. This cannot be undone.`,
        },
        greylisted: { nl: (n) => `GRIJZE LIJST ×${n}`, en: (n) => `GREY LIST ×${n}` },
        declined: { nl: (n) => `${n}× geweigerd`, en: (n) => `declined ${n}×` },
        declineAfterReview: { nl: 'WEIGEREN', en: 'DECLINE' },
        hold: { nl: 'BEWAREN', en: 'KEEP' },
        release: { nl: 'VRIJGEVEN', en: 'RELEASE' },
        holdTitle: {
          nl: 'Bewaar de koppeling tussen deze betaling en het rapport 30 dagen langer — bijvoorbeeld zolang een terugbetaling nog verwerkt wordt. Zonder bewaren wordt hij op dag 15 ontkoppeld.',
          en: 'Keep the link between this payment and the report for 30 more days — for example while a refund is still being processed. Without a hold it is unlinked on day 15.',
        },
        releaseTitle: {
          nl: 'Stop met bewaren. Is dag 15 al voorbij, dan wordt de betaling vannacht ontkoppeld.',
          en: 'Stop keeping it. If day 15 has passed, the payment is unlinked tonight.',
        },
        heldUntil: { nl: (d) => `BEWAARD TOT ${d}`, en: (d) => `KEPT UNTIL ${d}` },
        heldTitle: {
          nl: 'Deze betaling blijft aan het rapport gekoppeld tot die datum. Een terugbetaling bewaart automatisch.',
          en: 'This payment stays linked to the report until that date. A refund keeps it automatically.',
        },
        heldResult: { nl: (d) => `Koppeling bewaard tot ${d}.`, en: (d) => `Link kept until ${d}.` },
        releasedResult: { nl: 'Bewaren gestopt.', en: 'Hold released.' },
        unlinked: { nl: 'ONTKOPPELD', en: 'UNLINKED' },
        unlinkedTitle: {
          nl: 'Na dag 15 losgemaakt: de Stripe-betaling is niet meer naar dit rapport te herleiden. De boekhouding staat in Betaalbewijzen.',
          en: 'Released after day 15: the Stripe payment can no longer be traced to this report. The bookkeeping is under payment records.',
        },
        declinedResult: { nl: 'Verzoek geweigerd. De antwoorden zijn bij deze betaling bewaard.', en: 'Request declined. The answers are stored with this payment.' },
        greylistedTitle: {
          nl: (dates) => `Dit e-mailadres kreeg eerder een terugbetaling (${dates}).`,
          en: (dates) => `This email address received an earlier refund (${dates}).`,
        },
        noEmail: { nl: 'geen e-mail', en: 'no email' },
        reviewTitle: { nl: 'Controle door moderator', en: 'Moderator review' },
        reviewLead: {
          nl: 'Dit e-mailadres kreeg al eerder een terugbetaling. Stel de klant eerst deze vragen en noteer de antwoorden. Daarna beslis jij: terugbetalen of weigeren.',
          en: 'This email address already received a refund. Ask the client these questions first and record the answers. Then you decide: refund or decline.',
        },
        qReason: { nl: 'Waarom wil je je geld terug?', en: 'Why do you want your money back?' },
        qReadFully: { nl: 'Heb je het volledige rapport gelezen?', en: 'Did you read the full report?' },
        qExpected: { nl: 'Wat had je anders verwacht?', en: 'What did you expect instead?' },
        reviewNotes: { nl: 'Notitie moderator (optioneel)', en: 'Moderator note (optional)' },
        reviewIncomplete: { nl: 'Vul alle drie de antwoorden in.', en: 'Fill in all three answers.' },
        refundAfterReview: { nl: 'TERUGBETALEN NA CONTROLE', en: 'REFUND AFTER REVIEW' },
        cancel: { nl: 'ANNULEREN', en: 'CANCEL' },
        manualNote: {
          nl: 'Terugbetalen stuurt het bedrag via Stripe terug naar de klant en registreert het hier. Een terugbetaling vanuit het Stripe-dashboard wordt automatisch verwerkt.',
          en: 'Refunding sends the money back to the client through Stripe and records it here. A refund made in the Stripe Dashboard is processed automatically.',
        },
        notDelivered: { nl: 'NIET GEDOWNLOAD', en: 'NOT DOWNLOADED' },
        notDeliveredTitle: {
          nl: 'Betaald, maar de PDF is niet opgeslagen. Is het rapport de klant nooit bereikt, betaal dan terug.',
          en: 'Paid, but the PDF was not saved. If the report never reached the client, refund it.',
        },
        delivered: { nl: (d) => `gedownload ${d}`, en: (d) => `downloaded ${d}` },
        disputed: { nl: (reason) => `BETWISTING${reason ? ` · ${reason}` : ''}`, en: (reason) => `DISPUTE${reason ? ` · ${reason}` : ''}` },
        testmode: { nl: 'TESTMODUS', en: 'TEST MODE' },
        searchPlaceholder: { nl: 'Zoek op betaalreferentie, e-mail of code…', en: 'Search by payment reference, email or code…' },
        empty: { nl: 'Nog geen ontgrendelde rapporten.', en: 'No unlocked reports yet.' },
        colWhen: { nl: 'WANNEER', en: 'WHEN' },
        colMethod: { nl: 'VIA', en: 'VIA' },
        colAccount: { nl: 'ACCOUNT', en: 'ACCOUNT' },
        colStatus: { nl: 'STATUS', en: 'STATUS' },
        colActions: { nl: 'ACTIES', en: 'ACTIONS' },
        methodPayment: { nl: 'Betaling', en: 'Payment' },
        methodCode: { nl: 'Activatiecode', en: 'Activation code' },
        accountLinked: { nl: 'Gekoppeld', en: 'Linked' },
        accountNone: { nl: 'Niet gekoppeld', en: 'Not linked' },
        noCode: { nl: 'Geen code', en: 'No code' },
        statusActive: { nl: '● ACTIEF', en: '● ACTIVE' },
        statusRefunded: { nl: '○ TERUGBETAALD', en: '○ REFUNDED' },
        refundableUntil: { nl: (d) => `terug te betalen t/m ${d}`, en: (d) => `refundable until ${d}` },
        windowClosed: { nl: 'termijn verlopen', en: 'window closed' },
        notRefundable: { nl: 'geen garantie', en: 'not covered' },
        refund: { nl: 'TERUGBETALEN', en: 'REFUND' },
        confirmTitle: { nl: 'Terugbetaling bevestigen', en: 'Confirm refund' },
        confirmBody: {
          nl: 'Stripe betaalt het volledige bedrag terug en de kristal-code wordt geblokkeerd. Is hij aan een account gekoppeld, dan vervallen die lezing en de toegang die hij gaf. Dit kan niet ongedaan worden.',
          en: 'Stripe refunds the full amount and the crystal code is blocked. If it is linked to an account, that reading and the access it gave lapse. This cannot be undone.',
        },
        confirmTypeLabel: { nl: (word) => `Typ ${word} om te bevestigen`, en: (word) => `Type ${word} to confirm` },
        refundedResult: {
          nl: (until) => `Terugbetaald. Code geblokkeerd. E-mailadres op de grijze lijst.${until ? ` Toegang van het account loopt nu tot ${until}.` : ''}`,
          en: (until) => `Refunded. Code blocked. Email address on the grey list.${until ? ` The account's access now runs until ${until}.` : ''}`,
        },
        refundedAccountDeleted: {
          nl: 'Terugbetaald. Code geblokkeerd, het account dat ermee was geopend is verwijderd. E-mailadres op de grijze lijst.',
          en: 'Refunded. Code blocked, the account opened with it has been deleted. Email address on the grey list.',
        },
      },

      /* ── Payment records tab ── */
      paymentRecords: {
        title: { nl: (n) => `Betaalbewijzen (${n})`, en: (n) => `Payment records (${n})` },
        help: {
          nl: 'Elke betaling krijgt bij ontvangst een betaalbewijs als PDF, elke terugbetaling een eigen terugbetalingsbewijs. De documenten worden één keer opgesteld en daarna niet meer gewijzigd. Ze bevatten geen naam of e-mailadres; de betaalreferentie koppelt ze aan de betaling bij Stripe. TEST-nummers komen uit Stripe-testmodus en tellen niet mee in de totalen.',
          en: 'Every payment gets a PDF payment record when it comes in, every refund its own refund record. The documents are issued once and never changed afterwards. They contain no name or email address; the payment reference ties them to the payment at Stripe. TEST numbers come from Stripe test mode and are left out of the totals.',
        },
        configTitle: { nl: 'Betaalinstellingen', en: 'Payment settings' },
        configHelp: {
          nl: 'Op het omslagmoment wisselt de prijs van introductie naar normaal. De landenpoort gaat op dat moment alleen open als "open bij omslag" aan staat — zet dat pas aan als de OSS-registratie actief is. Wijzigingen gelden binnen enkele seconden, zonder deploy.',
          en: 'At the flip moment the price switches from launch to normal. The country gate only opens at that moment when "open at flip" is on — switch it on only once the OSS registration is active. Changes apply within seconds, no deploy.',
        },
        configFlipAt: { nl: 'Omslagmoment (lokale tijd)', en: 'Flip moment (local time)' },
        configOpenAtFlip: { nl: 'Landenpoort openen bij omslag (OSS actief)', en: 'Open the country gate at the flip (OSS active)' },
        configLaunchCountries: { nl: 'Landen vóór omslag', en: 'Countries before the flip' },
        configOpenCountries: { nl: 'Landen na opening', en: 'Countries once open' },
        configSave: { nl: 'OPSLAAN', en: 'SAVE' },
        configSaved: { nl: 'Opgeslagen.', en: 'Saved.' },
        configNow: {
          nl: (enabled, price, countries) => `Nu: betalen ${enabled ? 'actief' : 'NIET actief (Stripe niet geconfigureerd)'} · ${price} · ${countries}`,
          en: (enabled, price, countries) => `Now: payments ${enabled ? 'active' : 'NOT active (Stripe not configured)'} · ${price} · ${countries}`,
        },
        year: { nl: 'Jaar', en: 'Year' },
        allYears: { nl: 'Alle jaren', en: 'All years' },
        received: { nl: 'Ontvangen', en: 'Received' },
        refunded: { nl: 'Terugbetaald', en: 'Refunded' },
        net: { nl: 'Netto', en: 'Net' },
        count: { nl: 'Documenten', en: 'Documents' },
        downloadFolder: { nl: 'DOWNLOAD MAP (ZIP)', en: 'DOWNLOAD FOLDER (ZIP)' },
        downloading: { nl: 'BEZIG…', en: 'WORKING…' },
        empty: { nl: 'Nog geen betalingen.', en: 'No payments yet.' },
        colNumber: { nl: 'NUMMER', en: 'NUMBER' },
        colDate: { nl: 'DATUM', en: 'DATE' },
        colKind: { nl: 'SOORT', en: 'TYPE' },
        colReference: { nl: 'REFERENTIE', en: 'REFERENCE' },
        colAmount: { nl: 'BEDRAG', en: 'AMOUNT' },
        colFile: { nl: 'PDF', en: 'PDF' },
        kindPayment: { nl: 'Betaling', en: 'Payment' },
        kindRefund: { nl: 'Terugbetaling', en: 'Refund' },
        relatesTo: { nl: (n) => `bij ${n}`, en: (n) => `for ${n}` },
        download: { nl: 'DOWNLOAD', en: 'DOWNLOAD' },
        refresh: REFRESH_CAPS,
        loading: LOADING,
      },

      /* ── Activation codes tab ── */
      activationCodes: {
        statActive: { nl: 'Actief', en: 'Active' },
        statUsed: { nl: 'Gebruikt', en: 'Used' },
        statRevoked: { nl: 'Ingetrokken', en: 'Revoked' },
        refresh: REFRESH_CAPS,
        loading: LOADING,
        generateTitle: { nl: 'Nieuwe codes', en: 'New codes' },
        generateHelp: {
          nl: 'Elke code geeft één keer het volledige rapport vrij. Na gebruik stopt hij en verhuist hij naar het logboek.',
          en: 'Each code unlocks the full report once. After use it stops working and moves to the logbook.',
        },
        countLabel: { nl: 'Aantal', en: 'Count' },
        labelLabel: { nl: 'Label (optioneel)', en: 'Label (optional)' },
        labelPlaceholder: { nl: 'bijv. Workshop oktober', en: 'e.g. October workshop' },
        generate: { nl: '+ GENEREER', en: '+ GENERATE' },
        generating: { nl: 'BEZIG…', en: 'WORKING…' },
        newCodesTitle: { nl: (n) => `Nieuw aangemaakt (${n})`, en: (n) => `Just created (${n})` },
        newCodesWarning: {
          nl: 'Kopieer deze codes nu. Ze worden versleuteld opgeslagen en zijn hierna nooit meer zichtbaar.',
          en: 'Copy these codes now. They are stored hashed and can never be shown again.',
        },
        copyAll: { nl: 'KOPIEER ALLE', en: 'COPY ALL' },
        copied: { nl: 'GEKOPIEERD', en: 'COPIED' },
        dismiss: { nl: 'IK HEB ZE', en: 'GOT THEM' },
        activeTitle: { nl: (n) => `Actieve codes (${n})`, en: (n) => `Active codes (${n})` },
        activeEmpty: { nl: 'Geen actieve codes.', en: 'No active codes.' },
        logbookTitle: { nl: (n) => `Logboek (${n})`, en: (n) => `Logbook (${n})` },
        logbookEmpty: { nl: 'Nog geen gebruikte of ingetrokken codes.', en: 'No used or revoked codes yet.' },
        colCode: { nl: 'CODE', en: 'CODE' },
        colLabel: { nl: 'LABEL', en: 'LABEL' },
        colCreated: { nl: 'AANGEMAAKT', en: 'CREATED' },
        colStatus: { nl: 'STATUS', en: 'STATUS' },
        colWhen: { nl: 'WANNEER', en: 'WHEN' },
        colActions: { nl: 'ACTIES', en: 'ACTIONS' },
        statusUsed: { nl: '● GEBRUIKT', en: '● USED' },
        statusRevoked: { nl: '○ INGETROKKEN', en: '○ REVOKED' },
        revoke: { nl: 'INTREKKEN', en: 'REVOKE' },
        confirmRevoke: {
          nl: (hint) => `Code …${hint} intrekken? Hij stopt direct met werken en gaat naar het logboek.`,
          en: (hint) => `Revoke code …${hint}? It stops working immediately and moves to the logbook.`,
        },
      },

      /* ── Passkeys tab ── */
      passkeys: {
        confirmDelete: {
          nl: (code) => `Passkey ${code} verwijderen? Dit kan niet ongedaan worden.`,
          en: (code) => `Delete passkey ${code}? This cannot be undone.`,
        },
        statTotal: TOTAL_WORD,
        statActive: { nl: 'Actief', en: 'Active' },
        statInactive: { nl: 'Inactief', en: 'Inactive' },
        statUsage: { nl: 'Gebruik', en: 'Usage' },
        refresh: REFRESH_CAPS,
        loading: LOADING,
        manageTitle: { nl: (n) => `Passkeys Beheer (${n})`, en: (n) => `Passkey Management (${n})` },
        labelPlaceholder: { nl: 'Label (optioneel)...', en: 'Label (optional)...' },
        generate: { nl: '+ GENEREER PASSKEY', en: '+ GENERATE PASSKEY' },
        empty: {
          nl: 'Geen passkeys — klik op "Genereer Passkey" om er een aan te maken',
          en: 'No passkeys — click "Generate Passkey" to create one',
        },
        colCode: { nl: 'CODE', en: 'CODE' },
        colLabel: { nl: 'LABEL', en: 'LABEL' },
        colStatus: { nl: 'STATUS', en: 'STATUS' },
        colUsage: { nl: 'GEBRUIK', en: 'USAGE' },
        colCreated: { nl: 'AANGEMAAKT', en: 'CREATED' },
        colActions: { nl: 'ACTIES', en: 'ACTIONS' },
        active: { nl: '● ACTIEF', en: '● ACTIVE' },
        inactive: { nl: '○ INACTIEF', en: '○ INACTIVE' },
        usedTimes: { nl: (n) => `${n}× gebruikt`, en: (n) => `used ${n}×` },
        deactivate: { nl: 'Deactiveer', en: 'Deactivate' },
        activate: { nl: 'Activeer', en: 'Activate' },
        removeAdmin: { nl: 'Verwijder admin toegang', en: 'Remove admin access' },
        makeAdmin: {
          nl: 'Maak admin passkey (mobiel portaal)',
          en: 'Make admin passkey (mobile portal)',
        },
        delete: DELETE_WORD,
      },

      /* ── Audit log tab ── */
      audit: {
        hourUnit: { nl: 'u', en: 'h' },
        confirmClear: {
          nl: 'Alle dev-activiteit wissen? Dit kan niet ongedaan worden.',
          en: 'Clear all dev activity? This cannot be undone.',
        },
        statAdmin: { nl: 'Admin', en: 'Admin' },
        statPasskeys: PASSKEYS_WORD,
        statSessions: { nl: 'Sessies', en: 'Sessions' },
        statTotal: TOTAL_WORD,
        statAvgDuration: { nl: 'Gem. Duur', en: 'Avg. Duration' },
        refresh: REFRESH_CAPS,
        loading: LOADING,

        folderAdmin: { nl: '📂 Admin & Toegang', en: '📂 Admin & Access' },
        folderAdminDesc: {
          nl: 'Admin logins & rapportraadplegingen',
          en: 'Admin logins & report views',
        },
        folderPasskeys: { nl: '📂 Passkeys', en: '📂 Passkeys' },
        folderPasskeysDesc: {
          nl: 'Passkey gebruik — alle pogingen (geldig & ongeldig)',
          en: 'Passkey usage — all attempts (valid & invalid)',
        },
        folderSessions: { nl: '📂 Sessies', en: '📂 Sessions' },
        folderSessionsDesc: {
          nl: 'Alle events gegroepeerd per sessie',
          en: 'All events grouped per session',
        },

        adminTitle: {
          nl: (n) => `Admin & Toegang — Logins & Raadplegingen (${n})`,
          en: (n) => `Admin & Access — Logins & Views (${n})`,
        },
        adminEmpty: { nl: 'Nog geen toegang geregistreerd', en: 'No access recorded yet' },
        colTimestamp: { nl: 'TIJDSTIP', en: 'TIMESTAMP' },
        colType: { nl: 'TYPE', en: 'TYPE' },
        colReportId: { nl: 'REPORT ID', en: 'REPORT ID' },
        colAdminDetail: { nl: 'ADMIN / DETAIL', en: 'ADMIN / DETAIL' },
        eventReport: { nl: 'rapport', en: 'report' },
        eventLogin: { nl: 'login', en: 'login' },

        passkeysTitle: {
          nl: (n) => `Passkeys — Gebruik & Pogingen (${n})`,
          en: (n) => `Passkeys — Usage & Attempts (${n})`,
        },
        passkeysEmpty: {
          nl: 'Nog geen passkey gebruik geregistreerd',
          en: 'No passkey usage recorded yet',
        },
        colCode: { nl: 'CODE', en: 'CODE' },
        colValid: { nl: 'GELDIG', en: 'VALID' },
        colName: { nl: 'NAAM', en: 'NAME' },

        sessionsTitle: {
          nl: (n) => `Sessies — Alle Events Gegroepeerd (${n})`,
          en: (n) => `Sessions — All Events Grouped (${n})`,
        },
        sessionsEmpty: { nl: 'Nog geen activiteit geregistreerd', en: 'No activity recorded yet' },
        colDate: { nl: 'DATUM', en: 'DATE' },
        colDuration: { nl: 'DUUR', en: 'DURATION' },
        colEvents: { nl: 'EVENTS', en: 'EVENTS' },
        colTypes: { nl: 'TYPES', en: 'TYPES' },
      },
    },

    /* ═══════════ Invoice document ═══════════ */
    invoice: {
      historyTitle: { nl: 'Factuurgeschiedenis', en: 'Invoice History' },
      emptyTemplate: { nl: 'Leeg template', en: 'Empty template' },
      alwaysAvailable: { nl: 'Altijd beschikbaar', en: 'Always available' },
      load: { nl: 'Laden', en: 'Load' },
      noClient: { nl: '(geen klant)', en: '(no client)' },

      detailsHeading: { nl: 'Factuur Gegevens', en: 'Invoice Details' },
      invoiceNumber: { nl: 'Factuurnummer', en: 'Invoice number' },
      dateAutoSync: DATE_AUTOSYNC,

      infoHeading: { nl: 'Factuur Informatie', en: 'Invoice Information' },
      saveContact: SAVE_CONTACT,
      save: SAVE,
      contactsChoose: {
        nl: (n) => `${n} opgeslagen contact${n !== 1 ? 'en' : ''} — kies een klant`,
        en: (n) => `${n} saved contact${n !== 1 ? 's' : ''} — pick a client`,
      },
      noSavedContacts: NO_SAVED_CONTACTS,
      invoiceFor: { nl: 'Factuur Voor', en: 'Invoice For' },
      clientNamePlaceholder: CLIENT_NAME_PH,
      clientAddressPlaceholder: CLIENT_ADDRESS_PH,

      linesHeading: { nl: 'Factuurregels', en: 'Invoice Lines' },
      linesHeadingMobile1: { nl: 'Factuur', en: 'Invoice' },
      linesHeadingMobile2: { nl: 'regels', en: 'lines' },
      addLine: ADD_LINE,
      dragToMove: { nl: 'Sleep om te verplaatsen', en: 'Drag to move' },
      holdAndDrag: { nl: 'Houd vast en sleep regel', en: 'Hold and drag row' },
      descriptionPlaceholder: COL_DESCRIPTION,
      quantityPlaceholder: QUANTITY_PH,
      pricePlaceholder: PRICE_PH,

      vatToggleOn: { nl: '✓ BTW 21%', en: '✓ VAT 21%' },
      vatToggleOff: VAT_21,
      vatOverSubtotal: VAT_OVER_SUBTOTAL,
      pricesExclVat: PRICES_EXCL_VAT,
      vatShort: { nl: 'BTW', en: 'VAT' },
      totalLabel: TOTAL_WORD,

      signatureHeading: SIGNATURE_HEADING,
      clear: CLEAR,

      /* Preview / PDF document copy */
      docTitle: { nl: 'FACTUUR', en: 'INVOICE' },
      account: { nl: 'Rekening:', en: 'Account:' },
      ref: { nl: 'Ref:', en: 'Ref:' },
      payWithin30: {
        nl: 'gelieve te betalen binnen 30 werkdagen',
        en: 'please pay within 30 working days',
      },
      accountLine: {
        nl: (account, ref) => `Rekening: ${account} (Ref: ${ref})`,
        en: (account, ref) => `Account: ${account} (Ref: ${ref})`,
      },
      nr: { nl: (n) => `Nr: ${n}`, en: (n) => `No: ${n}` },
      dateCaps: { nl: (d) => `DATUM: ${d}`, en: (d) => `DATE: ${d}` },
      dateLabel: DATE_LABEL,
      colDescription: COL_DESCRIPTION,
      colHours: COL_HOURS,
      colRate: COL_RATE,
      colAmount: COL_AMOUNT,
      colDescriptionCaps: { nl: 'OMSCHRIJVING', en: 'DESCRIPTION' },
      colHoursCaps: { nl: 'UUR', en: 'HOURS' },
      colRateCaps: { nl: 'TARIEF Ex.-', en: 'RATE EXCL.-' },
      colAmountCaps: { nl: 'BEDRAG', en: 'AMOUNT' },
      newItem: NEW_ITEM,
      subtotal: SUBTOTAL,
      vat21: VAT_21,
      totalCaps: TOTAL_CAPS,
      invoiceForCaps: { nl: 'FACTUUR VOOR:', en: 'INVOICE FOR:' },
      invoiceForLabel: { nl: 'Factuur voor:', en: 'Invoice for:' },
      spellLine1: SPELL_LINE_1,
      spellLine2: SPELL_LINE_2,
      signedByCaps: { nl: 'ONDERTEKEND DOOR:', en: 'SIGNED BY:' },
      signedBy: SIGNED_BY,
      waitingFor: WAITING_FOR,
      waitingForCaps: { nl: 'WACHTEN OP', en: 'WAITING FOR' },
      signatureWord: SIGNATURE_WORD,
      signatureWordCaps: { nl: 'HANDTEKENING', en: 'SIGNATURE' },
      signatureAlt: SIGNATURE_HEADING,
      thankYou: THANK_YOU,
      page: PAGE_WORD,

      lineCount: {
        nl: (n, total) => `${n} regel${n !== 1 ? 's' : ''} · Totaal: €${total}`,
        en: (n, total) => `${n} line${n !== 1 ? 's' : ''} · Total: €${total}`,
      },
      inclVat: { nl: '(incl. BTW)', en: '(incl. VAT)' },
      downloadPdf: { nl: '📄 DOWNLOAD', en: '📄 DOWNLOAD' },
      saveButton: { nl: '💾 SAVE', en: '💾 SAVE' },
      savedButton: { nl: '✓ SAVED', en: '✓ SAVED' },

      emailHeading: SEND_EMAIL_HEADING,
      recipientEmail: RECIPIENT_EMAIL_REQ,
      emailPlaceholder: EMAIL_PLACEHOLDER,
      ccOptional: { nl: 'CC (optioneel)', en: 'CC (optional)' },
      ccPlaceholder: CC_PLACEHOLDER,
      subject: SUBJECT,
      subjectDefault: {
        nl: (n) => `Garden For Life — Factuur ${n}`,
        en: (n) => `Garden For Life — Invoice ${n}`,
      },
      autofill: { nl: 'Autofill', en: 'Autofill' },
      bodyLabel: { nl: 'E-mailtekst (optioneel)', en: 'Email body (optional)' },
      bodyPlaceholder: {
        nl: (client, number) => `Beste ${client},\n\nBijgevoegd vindt u factuur ${number}.\n\nMet vriendelijke groet,\nGarden For Life`,
        en: (client, number) => `Dear ${client},\n\nPlease find invoice ${number} attached.\n\nKind regards,\nGarden For Life`,
      },
      bodyClientFallback: { nl: 'klant', en: 'client' },
      contentFallback: { nl: (n) => `Factuur ${n}`, en: (n) => `Invoice ${n}` },
      attachmentNote: {
        nl: (file) => `📎 ${file} wordt als bijlage meegestuurd`,
        en: (file) => `📎 ${file} will be sent as an attachment`,
      },
      sent: SENT_BANG,
      sending: SENDING_CAPS,
      sendWithPdf: { nl: 'VERSTUREN MET PDF', en: 'SEND WITH PDF' },
      enterEmail: ENTER_EMAIL,
      sendFailed: SEND_FAILED,
    },

    /* ═══════════ Credit note document ═══════════ */
    creditNote: {
      detailsHeading: { nl: 'Creditnota Gegevens', en: 'Credit Note Details' },
      creditNoteNumber: { nl: 'Creditnotanummer', en: 'Credit note number' },
      originalInvoiceNumber: { nl: 'Origineel Factuurnummer', en: 'Original invoice number' },
      originalInvoicePlaceholder: { nl: 'bijv. 20260002', en: 'e.g. 20260002' },
      dateAutoSync: DATE_AUTOSYNC,

      infoHeading: { nl: 'Creditnota Informatie', en: 'Credit Note Information' },
      saveContact: SAVE_CONTACT,
      save: SAVE,
      contactsChoose: {
        nl: (n) => `${n} opgeslagen contact${n !== 1 ? 'en' : ''} — kies een klant`,
        en: (n) => `${n} saved contact${n !== 1 ? 's' : ''} — pick a client`,
      },
      noSavedContacts: NO_SAVED_CONTACTS,
      creditNoteFor: { nl: 'Creditnota Voor', en: 'Credit Note For' },
      clientNamePlaceholder: CLIENT_NAME_PH,
      clientAddressPlaceholder: CLIENT_ADDRESS_PH,

      linesHeading: { nl: 'Creditnotaregels', en: 'Credit Note Lines' },
      linesHeadingMobile1: { nl: 'Creditnota', en: 'Credit note' },
      linesHeadingMobile2: { nl: 'regels', en: 'lines' },
      addLine: ADD_LINE,
      descriptionPlaceholder: COL_DESCRIPTION,
      quantityPlaceholder: QUANTITY_PH,
      pricePlaceholder: PRICE_PH,

      vatToggleOn: { nl: '✓ BTW 21%', en: '✓ VAT 21%' },
      vatToggleOff: VAT_21,
      vatOverSubtotal: VAT_OVER_SUBTOTAL,
      pricesExclVat: PRICES_EXCL_VAT,
      vatShort: { nl: 'BTW', en: 'VAT' },
      totalLabel: TOTAL_WORD,

      noteHeading: { nl: 'Opmerking creditnota', en: 'Credit note remark' },
      notePlaceholder: {
        nl: 'Het bedrag wordt verrekend met uw openstaande facturen.',
        en: 'The amount will be offset against your outstanding invoices.',
      },
      noteDefault: {
        nl: 'Het bedrag wordt verrekend met uw openstaande facturen.',
        en: 'The amount will be offset against your outstanding invoices.',
      },

      signatureHeading: SIGNATURE_HEADING,
      clear: CLEAR,

      docTitle: { nl: 'CREDITNOTA', en: 'CREDIT NOTE' },
      settledOrRefunded: SETTLED_OR_REFUNDED,
      nr: { nl: (n) => `Nr: ${n}`, en: (n) => `No: ${n}` },
      refInvoice: { nl: (n) => `Ref Factuur: ${n}`, en: (n) => `Ref invoice: ${n}` },
      dateCaps: { nl: (d) => `DATUM: ${d}`, en: (d) => `DATE: ${d}` },
      dateLabel: DATE_LABEL,
      colDescription: COL_DESCRIPTION,
      colHours: COL_HOURS,
      colRate: COL_RATE,
      colAmount: COL_AMOUNT,
      colDescriptionCaps: { nl: 'OMSCHRIJVING', en: 'DESCRIPTION' },
      colHoursCaps: { nl: 'UUR', en: 'HOURS' },
      colRateCaps: { nl: 'TARIEF Ex.-', en: 'RATE EXCL.-' },
      colAmountCaps: { nl: 'BEDRAG', en: 'AMOUNT' },
      newItem: NEW_ITEM,
      subtotal: SUBTOTAL,
      vat21: VAT_21,
      totalCaps: TOTAL_CAPS,
      creditNoteForCaps: { nl: 'CREDITNOTA VOOR:', en: 'CREDIT NOTE FOR:' },
      creditNoteForLabel: { nl: 'Creditnota voor:', en: 'Credit note for:' },
      spellLine1: SPELL_LINE_1,
      spellLine2: SPELL_LINE_2,
      signedByCaps: { nl: 'ONDERTEKEND DOOR:', en: 'SIGNED BY:' },
      signedBy: SIGNED_BY,
      waitingFor: WAITING_FOR,
      waitingForCaps: { nl: 'WACHTEN OP', en: 'WAITING FOR' },
      signatureWord: SIGNATURE_WORD,
      signatureWordCaps: { nl: 'HANDTEKENING', en: 'SIGNATURE' },
      signatureAlt: SIGNATURE_HEADING,
      thankYou: THANK_YOU,
      page: PAGE_WORD,

      lineCount: {
        nl: (n, total) => `${n} regel${n !== 1 ? 's' : ''} · Totaal: €${total}`,
        en: (n, total) => `${n} line${n !== 1 ? 's' : ''} · Total: €${total}`,
      },
      inclVat: { nl: '(incl. BTW)', en: '(incl. VAT)' },
      downloadPdf: { nl: '📄 PDF DOWNLOADEN', en: '📄 DOWNLOAD PDF' },

      emailHeading: SEND_EMAIL_HEADING,
      recipientEmail: RECIPIENT_EMAIL_REQ,
      emailPlaceholder: EMAIL_PLACEHOLDER,
      subject: SUBJECT,
      subjectDefault: {
        nl: (n) => `Garden For Life — Creditnota ${n}`,
        en: (n) => `Garden For Life — Credit Note ${n}`,
      },
      autofill: { nl: 'Autofill', en: 'Autofill' },
      bodyLabel: { nl: 'E-mailtekst (optioneel)', en: 'Email body (optional)' },
      bodyPlaceholder: {
        nl: (client, number) => `Beste ${client},\n\nBijgevoegd vindt u creditnota ${number}.\n\nMet vriendelijke groet,\nGarden For Life`,
        en: (client, number) => `Dear ${client},\n\nPlease find credit note ${number} attached.\n\nKind regards,\nGarden For Life`,
      },
      bodyClientFallback: { nl: 'klant', en: 'client' },
      contentFallback: { nl: (n) => `Creditnota ${n}`, en: (n) => `Credit Note ${n}` },
      attachmentNote: {
        nl: (file) => `📎 ${file} wordt als bijlage meegestuurd`,
        en: (file) => `📎 ${file} will be sent as an attachment`,
      },
      sent: SENT_BANG,
      sending: SENDING_CAPS,
      sendWithPdf: { nl: 'VERSTUREN MET PDF', en: 'SEND WITH PDF' },
      enterEmail: ENTER_EMAIL,
      sendFailed: SEND_FAILED,
    },

    /* ═══════════ Standalone email composer ═══════════ */
    email: {
      heading: SEND_EMAIL_HEADING,
      saveContact: SAVE_CONTACT,
      save: SAVE,
      contactsChoose: {
        nl: (n) => `${n} opgeslagen contact${n !== 1 ? 'en' : ''} — kies een ontvanger`,
        en: (n) => `${n} saved contact${n !== 1 ? 's' : ''} — pick a recipient`,
      },
      noSavedContacts: NO_SAVED_CONTACTS,

      name: { nl: 'Naam', en: 'Name' },
      namePlaceholder: { nl: 'Naam ontvanger', en: 'Recipient name' },
      subject: SUBJECT,
      subjectPlaceholder: { nl: 'Garden For Life', en: 'Garden For Life' },
      recipientEmails: { nl: 'Ontvanger E-mail(s) *', en: 'Recipient Email(s) *' },
      recipientEmailsPlaceholder: {
        nl: 'naam@voorbeeld.nl, naam2@voorbeeld.nl',
        en: 'name@example.com, name2@example.com',
      },
      ccEmails: { nl: 'CC E-mail(s)', en: 'CC Email(s)' },
      ccPlaceholder: CC_PLACEHOLDER,

      bodyLabel: { nl: 'E-mailtekst', en: 'Email body' },
      bodyPlaceholder: {
        nl: 'Beste,\n\nBijgevoegd vindt u de gevraagde documenten.\n\nMet vriendelijke groet,\nGarden For Life',
        en: 'Hello,\n\nPlease find the requested documents attached.\n\nKind regards,\nGarden For Life',
      },

      attachmentsLabel: { nl: 'PDF Bijlagen', en: 'PDF Attachments' },
      addAttachment: { nl: 'Bijlage Toevoegen', en: 'Add Attachment' },
      close: { nl: 'Sluiten', en: 'Close' },
      preview: { nl: 'Voorbeeld', en: 'Preview' },
      remove: DELETE_WORD,
      previewUnavailable: {
        nl: 'Preview niet beschikbaar voor dit bestandstype',
        en: 'Preview not available for this file type',
      },
      previewTitle: { nl: (name) => `Preview: ${name}`, en: (name) => `Preview: ${name}` },

      readError: {
        nl: (name) => `Fout bij inlezen van ${name}`,
        en: (name) => `Error reading ${name}`,
      },
      enterAtLeastOneEmail: {
        nl: 'Vul minimaal één e-mailadres in',
        en: 'Enter at least one email address',
      },
      invalidEmail: {
        nl: (addr) => `Ongeldig e-mailadres: ${addr}`,
        en: (addr) => `Invalid email address: ${addr}`,
      },
      invalidCcEmail: {
        nl: (addr) => `Ongeldig CC e-mailadres: ${addr}`,
        en: (addr) => `Invalid CC email address: ${addr}`,
      },
      noBodyFallback: { nl: '(geen berichttekst)', en: '(no message body)' },

      attachmentCount: {
        nl: (n) => `📎 ${n} bijlage${n > 1 ? 'n' : ''}`,
        en: (n) => `📎 ${n} attachment${n > 1 ? 's' : ''}`,
      },
      noAttachments: { nl: '📭 Geen bijlagen', en: '📭 No attachments' },
      sent: SENT_BANG,
      sending: SENDING_CAPS,
      send: { nl: 'VERSTUREN', en: 'SEND' },
      sendFailed: SEND_FAILED,
    },
  },
};
