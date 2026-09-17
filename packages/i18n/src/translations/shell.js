/**
 * shell.js — app shell copy: App.jsx, MobileApp.jsx, DesktopLayout.jsx, MobileLayout.jsx.
 *
 * Merged into the root translations object by ./index.js under the `shell` key.
 * Brand/code-style chrome (DELTAWERKEN, DATA_STREAM, GARDENFORLIFE.NL, TIME SYNC,
 * "Voluntas Amor, Elefthéros Fati") stays untranslated and is NOT listed here.
 */
export default {
  shell: {
    // ── App.jsx: nav labels handed to ClientNav/ClientSubnav ──
    nav: {
      identity:    { nl: 'Liquid Crystal identiteit', en: 'Liquid Crystal identity' },
      filosofie:   { nl: 'Filosofie',                 en: 'Philosophy' },
      data:        { nl: 'Data',                      en: 'Data' },
      gardens:     { nl: 'Gardens',                   en: 'Gardens' },
      winkel:      { nl: 'Winkel',                    en: 'Shop' },
      kook:        { nl: 'Kook-eiland',               en: 'Kitchen Island' },
      verbonden:   { nl: 'Verbonden',                 en: 'Connected' },
      profiel:     { nl: 'Profiel',                   en: 'Profile' },
      schaduwWerk: { nl: 'Schaduw Werk',              en: 'Shadow Work' },
      voorwaarden: { nl: 'Voorwaarden',               en: 'Terms' },
      inloggen:    { nl: 'Inloggen',                  en: 'Log in' },
    },

    // ── App.jsx: logo tooltip ──
    backToLanding: { nl: 'Back to Landing', en: 'Back to Landing' },

    // ── MobileApp.jsx: passkey gate ──
    mobile: {
      brand: { nl: 'Garden For Life', en: 'Garden For Life' },
      title: { nl: 'Open op een computer', en: 'Open on a computer' },
      body: {
        nl: 'Het platform werkt op een computer, via de website en onze app. Open gardenforlife.nl op je computer om te beginnen.',
        en: 'The platform works on a computer, through the website and our app. Open gardenforlife.nl on your computer to begin.',
      },
    },

    // ── DesktopLayout.jsx ──
    desktop: {
      // Winkel container
      winkelTitle:       { nl: 'WINKEL', en: 'SHOP' },
      productPlaceholder: { nl: 'Productnaam — korte beschrijving…', en: 'Product name — short description…' },
      viewShop:          { nl: 'Bekijk winkel', en: 'View shop' },

      // Kook-eiland container
      open:              { nl: 'Openen', en: 'Open' },

      // Contacten container
      contactsTitle:     { nl: 'CONTACTEN', en: 'CONTACTS' },
      messages:          { nl: 'Berichten', en: 'Messages' },
      contactList:       { nl: 'Contactlijst', en: 'Contact list' },
      send:              { nl: 'Versturen', en: 'Send' },
      noMessages:        { nl: 'Geen berichten', en: 'No messages' },
      noContacts:        { nl: 'Geen contacten', en: 'No contacts' },
      toPlaceholder:     { nl: 'Aan', en: 'To' },
      subjectPlaceholder: { nl: 'Onderwerp', en: 'Subject' },
      bodyPlaceholder:   { nl: 'Bericht…', en: 'Message…' },
      composeMissing:    { nl: 'Vul ontvanger en bericht in.', en: 'Fill in a recipient and a message.' },
      composeSent:       { nl: 'Verstuurd ✓', en: 'Sent ✓' },
      composeFailed:     { nl: 'Versturen mislukt', en: 'Sending failed' },

      // Berichten overlay
      messageTitle:      { nl: 'Bericht', en: 'Message' },
      done:              { nl: 'Gereed', en: 'Done' },
      bodyEditorPlaceholder: { nl: 'Schrijf hier je bericht…', en: 'Write your message here…' },
      unknownSender:     { nl: 'Onbekend', en: 'Unknown' },
      noSubject:         { nl: '(geen onderwerp)', en: '(no subject)' },
      selectMessage:     { nl: 'Selecteer een bericht', en: 'Select a message' },
      unreadAlert:       { nl: 'Ongelezen bericht', en: 'Unread message' },
      // System messages (from Garden for Life), worded here by kind
      systemMessages: {
        'welcome-workspace': {
          title: { nl: 'Welkom — Download eerst onze software', en: 'Welcome — Download our software first' },
          body: {
            // {faq} renders as a link that pans to Profiel → Instellingen (policies, later the FAQ).
            nl: "Welkom Tuinierder,\n\nHieronder vind je de sleutel tot de software van ons platform.\nDe applicatie gebruikt precies dezelfde interface als de website, maar dan zonder het gevaar van een grootschalig data-lek.\n\nWij hebben het volste vertrouwen dat je de weg tussen de sterren snel hebt gevonden, is de nebulae te dik? raadpleeg dan de {faq} of reik uit naar een moderator in het netwerk.\n\n\n— Voluntas Amor, Elefthéros Fati",
            en: "Welcome Gardener,\n\nBelow you will find the key to our platform's software.\nThe application uses exactly the same interface as the website, but without the risk of a large-scale data leak.\n\nWe have every confidence that you will quickly find your way between the stars. Is the nebula too thick? Then consult the {faq} or reach out to a moderator in the network.\n\n\n— Voluntas Amor, Elefthéros Fati",
          },
        },
      },
      faqLink: { nl: 'FAQ', en: 'FAQ' },
      messageAction: {
        workspace: { nl: 'Naar je werkruimte →', en: 'Go to your workspace →' },
      },

      // Verbond (alliance) requests
      verbondRequest:    { nl: (from) => `Verbond-verzoek — ${from}`, en: (from) => `Alliance request — ${from}` },
      verbondRequests:   { nl: (n) => `Verbond-verzoeken · ${n}`, en: (n) => `Alliance requests · ${n}` },
      verbondWants:      { nl: 'wil een verbond aangaan', en: 'wants to form an alliance' },
      accept:            { nl: 'Accepteren', en: 'Accept' },
      decline:           { nl: 'Afwijzen', en: 'Decline' },
      declinePlaceholder: { nl: 'Afwijzen kan niet zonder bericht — schrijf waarom…', en: 'You cannot decline without a message — write why…' },
      sendDecline:       { nl: 'Verstuur afwijzing', en: 'Send decline' },
      verbondAccepted:   { nl: 'Verbond geaccepteerd ✓', en: 'Alliance accepted ✓' },
      verbondDeclined:   { nl: 'Afgewezen — bericht verstuurd', en: 'Declined — message sent' },
      verbondFailed:     { nl: 'Beantwoorden mislukt', en: 'Could not answer' },

      // Contactlijst overlay destinations
      destPage:          { nl: 'Pagina', en: 'Page' },
      destProfile:       { nl: 'Profiel', en: 'Profile' },

      // Gardens slideshow arrows
      previousSlide:     { nl: 'Previous slide', en: 'Previous slide' },
      nextSlide:         { nl: 'Next slide', en: 'Next slide' },
    },

    // ── Desktop app: refresh-rate confirmation (workspace/DisplayRateConfirm.jsx) ──
    displayConfirm: {
      title: { nl: 'Beeldfrequentie', en: 'Refresh rate' },
      firstRun: {
        nl: (to, from) => `We hebben je scherm op ${to} Hz gezet — de hoogste stand die het ondersteunt (was ${from} Hz). Beweegt alles soepel en ziet het beeld er goed uit?`,
        en: (to, from) => `We set your screen to ${to} Hz — the highest rate it supports (was ${from} Hz). Does everything move smoothly and look right?`,
      },
      changed: {
        nl: (to, from) => `Je scherm staat nu op ${to} Hz (was ${from} Hz). Ziet het beeld er goed uit?`,
        en: (to, from) => `Your screen now runs at ${to} Hz (was ${from} Hz). Does it look right?`,
      },
      countdown: {
        nl: (from, s) => `Zonder antwoord gaat je scherm over ${s} s terug naar ${from} Hz.`,
        en: (from, s) => `Without an answer your screen returns to ${from} Hz in ${s} s.`,
      },
      where: { nl: 'Je kunt dit altijd wijzigen in Profiel → Instellingen → App.', en: 'You can change this any time in Profile → Settings → App.' },
      keep: { nl: 'Houden', en: 'Keep' },
      revert: { nl: 'Terugzetten', en: 'Revert' },
    },
  },
};
