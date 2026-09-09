/** auth translations — see translations/index.js */
export default {
  auth: {
    // ── Shared legal link labels (Algemene Voorwaarden / Privacybeleid) ──
    legal: {
      terms: { nl: 'Algemene Voorwaarden', en: 'Terms and Conditions' },
      privacy: { nl: 'Privacybeleid', en: 'Privacy Policy' },
    },

    // ── LoginPage: errors ──
    errors: {
      codeUndecipherable: { nl: 'Code kon niet ontcijferd worden.', en: 'This code could not be deciphered.' },
      uploadFailed: { nl: 'Upload mislukt.', en: 'Upload failed.' },
      confirmFailed: { nl: 'Er ging iets mis bij het bevestigen.', en: 'Something went wrong while confirming.' },
      fillFields: { nl: 'Vul gebruikersnaam, e-mail en wachtwoord in.', en: 'Enter a username, email address and password.' },
      confirmTerms: { nl: 'Bevestig beide vinkjes om verder te gaan.', en: 'Confirm both checkboxes to continue.' },
      createAccountFailed: { nl: 'Account aanmaken mislukt.', en: 'Could not create your account.' },
    },

    // ── LoginPage: overlays ──
    overlay: {
      loggingOut: { nl: 'Uitloggen…', en: 'Logging out…' },
      lifeLesson: { nl: 'Levensles', en: 'Life lesson' },
    },

    // ── LoginPage: consent step (email/password registration) ──
    consent: {
      back: { nl: 'TERUG', en: 'BACK' },
      title: { nl: 'BEVESTIG AANMELDING', en: 'CONFIRM SIGN-UP' },
      // NOTE: placeholder copy in the source — kept verbatim, to be replaced by the owner.
      intro: {
        nl: 'Blah blah, dit lees je toch niet, maar misschien zou je dat eens een keer moeten doen. Data is het nieuwe goud.',
        en: "Blah blah, you're not reading this anyway, but maybe you should some time. Data is the new gold.",
      },
      // Checkbox A is composed around two inline links: [prefix] <terms> [middle] <privacy> [suffix]
      aPrefix: { nl: 'Ik ga akkoord met de', en: 'I agree to the' },
      aMiddle: { nl: 'en het', en: 'and the' },
      aSuffix: {
        nl: ', inclusief de verwerking van mijn accountgegevens. Ik verklaar dat ik 16 jaar of ouder ben.',
        en: ', including the processing of my account data. I declare that I am 16 years or older.',
      },
      b: {
        nl: 'Ik begrijp dat assessment-antwoorden anoniem worden verwerkt door Claude AI — zonder naam, e-mail of IP.',
        en: 'I understand that assessment answers are processed anonymously by Claude AI — without name, email address or IP.',
      },
      submit: { nl: 'BEVESTIG & AANMELDEN', en: 'CONFIRM & SIGN UP' },
      encrypted: { nl: 'Versleutelde Verbinding', en: 'Encrypted Connection' },
    },

    // ── LoginPage: PDF onboarding card ──
    onboarding: {
      verifyTitle: { nl: 'Bevestig je e-mail', en: 'Confirm your email' },
      createTitle: { nl: 'Maak je account', en: 'Create your account' },
      verifySentTo: { nl: 'We hebben een bevestigingslink gestuurd naar', en: 'We sent a confirmation link to' },
      verifyClick: {
        nl: 'Klik erop om je account te activeren — dit venster gaat daarna automatisch verder.',
        en: 'Click it to activate your account — this window continues automatically afterwards.',
      },
      cancel: { nl: '← Annuleren', en: '← Cancel' },
      intro: {
        nl: 'Je kristal is uniek. Koppel het aan een account om het platform te betreden — je code wordt je sleutel.',
        en: 'Your crystal is unique. Link it to an account to enter the platform — your code becomes your key.',
      },
      username: { nl: 'Gebruikersnaam', en: 'Username' },
      age: { nl: 'Leeftijd', en: 'Age' },
      country: { nl: 'Land', en: 'Country' },
      // Checkbox A: [prefix] <terms> [middle] <privacy> [suffix]. Mirrors auth.consent.a*,
      // so both account-creation routes ask for the same thing.
      consentPrefix: { nl: 'Ik ga akkoord met de', en: 'I agree to the' },
      consentMiddle: { nl: 'en het', en: 'and the' },
      consentSuffix: {
        nl: ', inclusief de verwerking van mijn accountgegevens. Ik verklaar dat ik 16 jaar of ouder ben.',
        en: ', including the processing of my account data. I declare that I am 16 years or older.',
      },
      // Checkbox B: explicit Art. 9 consent for the partial profile this route stores.
      // This is the only route that writes users.archetypeName + orbHistory, and the
      // Art. 30 register puts that under Art. 9(2)(a) — so it is asked for separately.
      consentArt9: {
        nl: 'Ik geef uitdrukkelijke toestemming om een gedeeltelijk profiel in mijn account te bewaren: mijn archetype-naam, de render-only orb-geometrie, de genormaliseerde 12-punts vormvector, de scoreverdeling en de bijbehorende kaartteksten — psychologische kenmerken in de zin van artikel 9 AVG. Het bevat geen ruwe antwoorden en geen volledig rapport, blijft bewaard zolang mijn account bestaat, en verdwijnt zodra ik mijn account verwijder.',
        en: 'I give explicit consent to keep a partial profile in my account: my archetype name, the render-only orb geometry, the normalised 12-point shape vector, the score distribution and the accompanying card texts — psychological characteristics within the meaning of Article 9 GDPR. It contains no raw answers and no full report, it persists for as long as my account exists, and it is gone as soon as I delete my account.',
      },
      back: { nl: '← Terug', en: '← Back' },
      creating: { nl: 'Aanmaken…', en: 'Creating…' },
      enter: { nl: 'Betreed platform', en: 'Enter platform' },
    },

    // ── LoginPage: login card ──
    login: {
      title: { nl: 'Inloggen', en: 'Log in' },
      pitchLine1: { nl: 'Synchroniseer hier jouw essentie en ontgrendel', en: 'Sync your essence here and unlock' },
      pitchLine2: { nl: '3 maanden gebruik van het platform zijn intelligentie.', en: '3 months of access to the platform’s intelligence.' },
      decoding: { nl: 'Kristal ontcijferen…', en: 'Deciphering crystal…' },
      upload: { nl: '⬆  Upload je rapport (PDF)', en: '⬆  Upload your report (PDF)' },
      haveAccount: { nl: 'Al een account? login', en: 'Already have an account? log in' },
      back: { nl: '← Terug', en: '← Back' },
      submit: { nl: 'IDENTIFICEER', en: 'IDENTIFY' },
      hidePassword: { nl: 'Verberg wachtwoord', en: 'Hide password' },
      showPassword: { nl: 'Toon wachtwoord', en: 'Show password' },
    },

    // ── PasswordVerify (standalone ?pwverify / ?emailverify landing page) ──
    verify: {
      invalidLink: { nl: 'Ongeldige of ontbrekende link.', en: 'Invalid or missing link.' },
      emailOk: {
        nl: 'Je nieuwe e-mailadres is bevestigd. Je kunt nu inloggen met je nieuwe e-mailadres.',
        en: 'Your new email address is confirmed. You can now log in with your new email address.',
      },
      passwordOk: {
        nl: 'Je nieuwe wachtwoord is geactiveerd. Je kunt nu inloggen met je nieuwe wachtwoord.',
        en: 'Your new password is active. You can now log in with your new password.',
      },
      failedMsg: { nl: 'Bevestiging mislukt.', en: 'Confirmation failed.' },
      busy: { nl: 'Bevestigen…', en: 'Confirming…' },
      emailTitle: { nl: 'E-mailadres bevestigd ✓', en: 'Email address confirmed ✓' },
      passwordTitle: { nl: 'Wachtwoord bevestigd ✓', en: 'Password confirmed ✓' },
      failedTitle: { nl: 'Bevestiging mislukt', en: 'Confirmation failed' },
      home: { nl: 'Naar Garden For Life', en: 'To Garden For Life' },
    },
  },
};
