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
      brand:            { nl: 'Garden For Life', en: 'Garden For Life' },
      passkeyPrompt:    { nl: 'Voer je passkey in om toegang te krijgen.', en: 'Enter your passkey to get access.' },
      passkeyPlaceholder: { nl: 'Passkey...', en: 'Passkey...' },
      unlock:           { nl: 'Unlock', en: 'Unlock' },
      invalidPasskey:   { nl: 'Ongeldige passkey', en: 'Invalid passkey' },
      adminNotFound:    { nl: 'Admin account niet gevonden — neem contact op', en: 'Admin account not found — please get in touch' },
      connectionError:  { nl: 'Verbindingsfout — probeer opnieuw', en: 'Connection error — please try again' },
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
  },
};
