/** assessmentCard translations — see translations/index.js
 *
 *  Namespace for AssessmentCard: the two full-screen briefing overlays
 *  ("Voordat je begint" for subject 0, the layer intro for every layer),
 *  plus the card header/footer chrome.
 *
 *  Inline markup used by renderOverlayText() in AssessmentCard.jsx:
 *    \n                → line break
 *    {c:#rrggbb|text}  → coloured span
 *    {c:accent|text}   → span in the current layer colour
 *    {cb:…|text}       → same, bold
 */
export default {
  assessmentCard: {
    // ── "Voordat je begint" briefing (subject 0) ──
    intro: {
      title: {
        nl: 'Voordat je begint',
        en: 'Before you begin',
      },
      words: {
        nl: 'Elk {c:#f97316|woord} is met {c:#a855f7|intentie} gezet. Twee opties die op elkaar lijken kunnen fundamenteel anders zijn. Lees niet alleen wát er staat, maar hoe het {c:#a855f7|voelt}. De timer is er om je hoofd uit te schakelen.',
        en: 'Every {c:#f97316|word} has been placed with {c:#a855f7|intention}. Two options that look alike can be fundamentally different. Read not only what is written, but how it {c:#a855f7|feels}. The timer is there to switch off your head.',
      },
      picks: {
        nl: 'Zes antwoorden per vraag. Kies eerst wat het dichtst bij je {c:#a855f7|kern} zit. Kies daarna wat je ook raakt, maar minder.\nLet op: Dus twee antwoorden kiezen!\n \n{c:#f97316|Geen antwoord is ook een antwoord...} één mag ook. dit verandert verder niks aan de verdeling van het puntensysteem, onze data is dynamisch, net zoals jij.',
        en: 'Six answers per question. First choose what sits closest to your {c:#a855f7|core}. Then choose what also touches you, but less.\nNote: so pick two answers!\n \n{c:#f97316|No answer is an answer too...} one is fine as well. this changes nothing about how the point system is distributed, our data is dynamic, just like you.',
      },
      resonance: {
        nl: 'Elke keuze resoneert door naar verbonden punten op het wiel. Een eerste keuze weegt zwaarder dan een tweede. Het resultaat is geen plat getal maar een gelaagd profiel.',
        en: 'Every choice resonates onward to connected points on the wheel. A first choice weighs more than a second. The result is not a flat number but a layered profile.',
      },
      timerIntro: {
        nl: '36 vragen over 5 onderwerpen.\nTimer per onderwerp:',
        en: '36 questions across 5 subjects.\nTimer per subject:',
      },
      timerOutro: {
        nl: '\n \nBij het aflopen van de timer gaat de vraag automatisch door, ook met 0 of 1 antwoord. Je kunt altijd zelf doorklikken,\nniet terug, alleen voorwaartse beweging.',
        en: '\n \nWhen the timer runs out the question advances automatically, even with 0 or 1 answer. You can always click ahead yourself,\nnot back — forward movement only.',
      },
      honesty: {
        nl: 'Er zijn geen {c:#f97316|goede} of {c:#f97316|foute} antwoorden. Er is alleen {c:#a855f7|eerlijkheid}.',
        en: 'There are no {c:#f97316|right} or {c:#f97316|wrong} answers. There is only {c:#a855f7|honesty}.',
      },
      continueLabel: {
        nl: 'Verder',
        en: 'Continue',
      },
    },

    // ── Layer intro overlay (every layer, plus the second subject-0 overlay) ──
    layerIntro: {
      fallbackName: {
        nl: (n) => `Laag ${n}`,
        en: (n) => `Layer ${n}`,
      },
      secondsPerQuestion: {
        nl: (sec) => `${sec}s per vraag`,
        en: (sec) => `${sec}s per question`,
      },
      questionCount: {
        nl: (n) => `${n} vragen`,
        en: (n) => `${n} questions`,
      },
      attention: {
        nl: 'LET OP!',
        en: 'ATTENTION!',
      },
      body: {
        nl: 'Er is geen één maat voor allen. Kies dus wat het meest synchroniseert.\n{c:accent|Gekleurde woorden} zijn een middel voor de eerste snelle scan, dit is geen waarde systeem voor de punten telling.',
        en: 'There is no one size that fits all, so choose what synchronizes most.\n{c:accent|Coloured words} are a means for the first quick scan; they are not a value system for the point count.',
      },
      stereotypeLabel: {
        nl: 'Stereotype vergroot om het archetype te onderscheiden:',
        en: 'Stereotype enlarged to set the archetype apart:',
      },
      stereotypes: {
        intentionPotential: { nl: 'intentie en potentie', en: 'intention and potential' },
        attentionAction: { nl: 'aandacht en actie', en: 'attention and action' },
        projection: { nl: 'projectie', en: 'projection' },
        hardening: { nl: 'verharding', en: 'hardening' },
        extremism: { nl: 'extremisme', en: 'extremism' },
      },
      start: {
        nl: 'Start',
        en: 'Start',
      },
    },

    // ── Card chrome ──
    header: {
      section: {
        nl: 'SECTION //',
        en: 'SECTION //',
      },
      fallbackLayer: {
        nl: (n) => `LAYER ${n}`,
        en: (n) => `LAYER ${n}`,
      },
      scroll: {
        nl: 'Scroll',
        en: 'Scroll',
      },
    },
    footer: {
      next: {
        nl: 'Doorgaan',
        en: 'Continue',
      },
    },
  },
};
