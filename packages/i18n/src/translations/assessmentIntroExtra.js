/** assessmentIntroExtra translations — see translations/index.js
 *
 *  Copy for AssessmentIntro.jsx that is NOT already covered by the existing
 *  `assessmentIntro` namespace in ../translations.js (which owns badgeText,
 *  title, description, features, pricing, layers, levels, footer*, references*,
 *  oceanInfo*, …). Only genuinely new strings live here.
 *
 *  Inline markup understood by renderCopy() in AssessmentIntro.jsx:
 *    \n                → line break
 *    {b|text}          → <strong> in accent lilac (#c4b5fd)
 *    {a|text}          → <strong> in amber (#fdba74)
 *    {g:#rrggbb|text}  → coloured semibold span
 *    {link:slug|text}  → clickable policy link (opens the redirect confirm)
 */
export default {
  assessmentIntroExtra: {
    // ── Intro card chrome ──
    headline: {
      nl: 'De meest complete en complexe analyse van de relatie tussen jouw essentie en intelligentie.\nMet veilige operationele controle over jouw eigen waardevolle data.',
      en: 'The most complete and complex analysis of the relationship between your essence and intelligence.\nWith secure operational control over your own valuable data.',
    },
    readMe: {
      nl: 'Lees mij!',
      en: 'Read me!',
    },
    infoTitle: {
      nl: 'Info',
      en: 'Info',
    },
    uploadInfoTitle: {
      nl: 'Upload informatie',
      en: 'Upload information',
    },
    uploadWarningLabel: {
      nl: 'Let op: ',
      en: 'Note: ',
    },
    uploadWarningText: {
      nl: 'De volledige tekst van dit bestand wordt meegestuurd naar het Claude AI-model (Anthropic, VS). Als dit bestand persoonlijke informatie bevat — zoals uw naam — bereikt die informatie de servers van Anthropic. Garden For Life is niet verantwoordelijk voor persoonsgegevens die u in geüploade bestanden opneemt.',
      en: 'The full text of this file is sent along to the Claude AI model (Anthropic, USA). If this file contains personal information — such as your name — that information reaches Anthropic’s servers. Garden For Life is not responsible for personal data you include in uploaded files.',
    },
    removeFileTitle: {
      nl: 'Remove file',
      en: 'Remove file',
    },
    orDivider: {
      nl: 'of',
      en: 'or',
    },
    scoresSaved: {
      nl: '✓ Scores opgeslagen',
      en: '✓ Scores saved',
    },
    manualScores: {
      nl: 'Handmatig',
      en: 'Manual',
    },
    levelInfo: {
      nl: 'Level keuze is irrelevant voor jouw account.\nDeze keuze helpt ons gepaste vragen te stellen naar jouw verhouding.',
      en: 'Your level choice is irrelevant to your account.\nIt only helps us ask questions that suit your relationship to the material.',
    },

    // ── Leave-the-test confirmation ──
    leaveConfirm: {
      question: {
        nl: 'Je verlaat de test, weet je het zeker?',
        en: 'You are leaving the test — are you sure?',
      },
      back: {
        nl: 'Terug',
        en: 'Back',
      },
      proceed: {
        nl: 'Door',
        en: 'Go on',
      },
    },

    // ── Policy redirect confirmation ──
    policyRedirect: {
      text: {
        nl: 'Je verlaat deze pagina',
        en: 'You are leaving this page',
      },
      back: {
        nl: 'Terug',
        en: 'Back',
      },
      proceed: {
        nl: 'Doorgaan',
        en: 'Continue',
      },
    },

    // ── Consent overlay (GDPR Art. 9 consent, age declaration, AI disclosure) ──
    consent: {
      title: {
        nl: 'Toestemming & Transparantie',
        en: 'Consent & Transparency',
      },
      subtitle: {
        nl: 'Lees dit door voordat je begint — je hebt het recht dit te weten',
        en: 'Read this before you begin — you have the right to know this',
      },
      // Always-visible summary; the full disclosure (whatWeDo + bullets) sits in a foldable section.
      keyPointsLabel: {
        nl: 'Het belangrijkste',
        en: 'The essentials',
      },
      keyPoints: {
        nl: [
          'Je rapport is een zelfreflectie-instrument — {b|geen klinische diagnose} en geen medisch oordeel. Het vervangt geen professionele begeleiding.',
          '{b|Wij bewaren je antwoorden en je volledige profiel niet.} Je rapport bestaat alleen in deze sessie en in de PDF die je zelf betaalt.',
          'Het volledige rapport kun je {b|eenmalig, direct na je test} kopen. Als je de rapportpagina verlaat, verwijderen wij de data volgens onze eigen interne dataregulering. Bedenk je dus goed, en maak anders een nieuwe test wanneer je eruit bent.',
        ],
        en: [
          'Your report is a self-reflection instrument — {b|not a clinical diagnosis} and not a medical judgement. It does not replace professional guidance.',
          '{b|We do not keep your answers or your full profile.} Your report exists only in this session and in the PDF you pay for yourself.',
          'You can buy the full report {b|once, right after your test}. When you leave the report page, we delete the data according to our own internal data regulation. So think it over carefully, and otherwise take a new test once you have made up your mind.',
        ],
      },
      detailsShow: {
        nl: 'Alle details lezen',
        en: 'Read all details',
      },
      detailsHide: {
        nl: 'Details verbergen',
        en: 'Hide details',
      },
      whatWeDoLabel: {
        nl: 'Wat we doen',
        en: 'What we do',
      },
      whatWeDoP1: {
        nl: 'Je antwoorden worden verwerkt door het AI-model {b|Claude van Anthropic} om een persoonlijk zelfreflectierapport te genereren op basis van het Garden For Life Deltawerken Model. Dit rapport is uitsluitend bedoeld als persoonlijk zelfinzichtinstrument — {b|geen klinische diagnose, geen medisch oordeel}.',
        en: 'Your answers are processed by the AI model {b|Claude by Anthropic} in order to generate a personal self-reflection report based on the Garden For Life Deltawerken Model. This report is intended solely as a personal self-insight instrument — {b|not a clinical diagnosis, not a medical judgement}.',
      },
      whatWeDoP2: {
        nl: 'Je volledige profiel en rapport worden {b|nergens opgeslagen} — niet op onze servers en niet in de opslag van je browser, ook niet als je bent ingelogd. Ze bestaan alleen in dit tabblad. Geef je het volledige rapport vrij, dan download je het als PDF met je levenslang geldige kristal-code. Verlaat je de rapportpagina zonder vrijgave, dan wordt alles verwijderd, inclusief de code — ook wij kunnen het daarna niet meer ophalen of opnieuw genereren.',
        en: 'Your full profile and report are {b|stored nowhere} — not on our servers and not in your browser storage, even when you are logged in. They exist only in this tab. If you unlock the full report, you download it as a PDF with your lifetime-valid crystal code. If you leave the report page without unlocking it, everything is deleted, the code included — after that not even we can retrieve or regenerate it.',
      },
      checkboxTerms: {
        nl: 'Ik heb de {link:algemene-voorwaarden|Algemene Voorwaarden} en het {link:privacybeleid|Privacybeleid} gelezen en ga hiermee akkoord. Ik verklaar dat ik {b|16 jaar of ouder} ben. Ik begrijp dat Garden For Life mijn e-mailadres en accountgegevens verwerkt om de dienst te leveren.',
        en: 'I have read and agree to the {link:algemene-voorwaarden|Terms and Conditions} and the {link:privacybeleid|Privacy Policy}. I declare that I am {b|16 years of age or older}. I understand that Garden For Life processes my email address and account details in order to provide the service.',
      },
      checkboxArt9: {
        nl: 'Ik geef uitdrukkelijke toestemming voor de verwerking van mijn {b|persoonlijkheidsprofieldata} zoals bedoeld in artikel 9 van de AVG. Ik begrijp dat:',
        en: 'I give explicit consent for the processing of my {b|personality profile data} within the meaning of Article 9 of the GDPR. I understand that:',
      },
      bullets: {
        nl: [
          'Mijn antwoorden en het berekende scoreprofiel alleen tijdens mijn sessie worden verwerkt — door de server van Garden For Life en het Claude AI-model (Anthropic), voor rapportgeneratie — en {b|nergens worden opgeslagen}, ook niet als ik ben ingelogd',
          'Het AI-model ontvangt mijn antwoorden, scores en profieldata — maar geen naam, e-mailadres of andere directe identificatoren vanuit het platform',
          'Als ik een persoonlijkheidsrapport upload (PDF, DOCX of TXT), wordt de tekst daarvan meegestuurd naar Claude — nadat de server er namen, e-mailadressen, telefoonnummers, postcodes en geboortedata uit heeft verwijderd. Die automatische verwijdering herkent niet alles: ik ben zelf verantwoordelijk voor welke informatie ik in geüploade bestanden opneem. Garden For Life is niet verantwoordelijk voor persoonsgegevens die ik daarin opneem.',
          'Dit profiel psychologische kenmerken bevat zoals {b|archetypepatronen}, {b|gedragstendensen} en {b|persoonlijkheidsoriëntaties}',
          'Mijn volledige profiel en rapport {b|alleen in mijn eigen browsertabblad} bestaan — Garden For Life, ook de beheerder, heeft er geen toegang toe en kan ze niet opnieuw ophalen of genereren',
          'Ik het volledige rapport {b|eenmalig, direct na mijn test} kan vrijgeven (betaling of activatiecode). Verlaat ik de rapportpagina zonder vrijgave, dan wordt het rapport volledig verwijderd — inclusief de versleutelde kristal-code en de bijbehorende kaarttekst op de server. Komt dat verwijdersignaal technisch niet aan, dan vervalt de code na 24 uur en wist de nachtelijke opruiming (00:00 Europe/Amsterdam) de kaarttekst',
          '{b|De kristal-code in een vrijgegeven rapport nooit verloopt} — mijn PDF blijft van mij en de code blijft altijd één keer inwisselbaar',
          'Als ik een account aanmaak blijft daarin uitsluitend een {b|gedeeltelijk profiel} bewaard — mijn archetype-naam, de render-only orb-geometrie, de genormaliseerde 12-punts vormvector, de scoreverdeling en de bijbehorende kaartteksten. Dat gedeeltelijke profiel bevat geen ruwe antwoorden en geen volledig rapport, en blijft bestaan zolang mijn account bestaat',
          'Mijn profiel en rapport ook niet in de opslag van mijn browser worden bewaard — de PDF die ik download is het enige exemplaar',
          'Ik het recht heb mijn toestemming op elk moment in te trekken via yuanwullink30@gfl.community',
          'Intrekking betekent dat mijn account, inclusief het gedeeltelijke profiel, binnen 30 dagen wordt verwijderd',
          'Dit rapport geen klinische diagnose is en professionele psychologische of medische begeleiding niet vervangt',
        ],
        en: [
          'My answers and the calculated score profile are processed only during my session — by the Garden For Life server and the Claude AI model (Anthropic), to generate the report — and are {b|stored nowhere}, even when I am logged in',
          'The AI model receives my answers, scores and profile data — but no name, email address or other direct identifiers from the platform',
          'If I upload a personality report (PDF, DOCX or TXT), its text is sent along to Claude — after the server has removed names, email addresses, phone numbers, postcodes and dates of birth. That automatic removal does not recognise everything: I am myself responsible for the information I include in uploaded files. Garden For Life is not responsible for personal data I include in them.',
          'This profile contains psychological characteristics such as {b|archetype patterns}, {b|behavioural tendencies} and {b|personality orientations}',
          'My full profile and report exist {b|only in my own browser tab} — Garden For Life, the administrator included, has no access to them and cannot retrieve or regenerate them',
          'I can unlock the full report {b|once, right after my test} (payment or activation code). If I leave the report page without unlocking it, the report is deleted in full — including the encrypted crystal code and the matching card text on the server. If that deletion signal does not arrive for technical reasons, the code lapses after 24 hours and the nightly sweep (00:00 Europe/Amsterdam) erases the card text',
          '{b|The crystal code in an unlocked report never expires} — my PDF stays mine and the code can always be redeemed once',
          'If I create an account, all that is retained in it is a {b|partial profile} — my archetype name, the render-only orb geometry, the normalised 12-point shape vector, the score distribution and the accompanying card texts. That partial profile contains no raw answers and no full report, and it persists for as long as my account exists',
          'My profile and report are not kept in my browser storage either — the PDF I download is the only copy',
          'I have the right to withdraw my consent at any time via yuanwullink30@gfl.community',
          'Withdrawal means that my account, including the partial profile, is deleted within 30 days',
          'This report is not a clinical diagnosis and does not replace professional psychological or medical guidance',
        ],
      },
      cancel: {
        nl: 'Annuleren',
        en: 'Cancel',
      },
      agree: {
        nl: 'Ik ga akkoord — Start',
        en: 'I agree — Start',
      },
    },

    // ── Synthetic .txt built from the manual OCEAN scores and sent to the AI ──
    oceanFile: {
      fileName: {
        nl: 'OCEAN_scores_handmatig.txt',
        en: 'OCEAN_scores_manual.txt',
      },
      header: {
        nl: '=== OCEAN Persoonlijkheidsscores (handmatig ingevoerd) ===',
        en: '=== OCEAN personality scores (entered manually) ===',
      },
      agreeableness: {
        nl: (v) => `A — Meegaandheid (Agreeableness): ${v}/100`,
        en: (v) => `A — Agreeableness: ${v}/100`,
      },
      compassion: {
        nl: (v) => `   ↳ Compassie: ${v}/100`,
        en: (v) => `   ↳ Compassion: ${v}/100`,
      },
      politeness: {
        nl: (v) => `   ↳ Beleefdheid: ${v}/100`,
        en: (v) => `   ↳ Politeness: ${v}/100`,
      },
      conscientiousness: {
        nl: (v) => `C — Consciëntieusheid (Conscientiousness): ${v}/100`,
        en: (v) => `C — Conscientiousness: ${v}/100`,
      },
      industriousness: {
        nl: (v) => `   ↳ IJver: ${v}/100`,
        en: (v) => `   ↳ Industriousness: ${v}/100`,
      },
      orderliness: {
        nl: (v) => `   ↳ Ordelijkheid: ${v}/100`,
        en: (v) => `   ↳ Orderliness: ${v}/100`,
      },
      extraversion: {
        nl: (v) => `E — Extraversie (Extraversion): ${v}/100`,
        en: (v) => `E — Extraversion: ${v}/100`,
      },
      enthusiasm: {
        nl: (v) => `   ↳ Enthousiasme: ${v}/100`,
        en: (v) => `   ↳ Enthusiasm: ${v}/100`,
      },
      assertiveness: {
        nl: (v) => `   ↳ Assertiviteit: ${v}/100`,
        en: (v) => `   ↳ Assertiveness: ${v}/100`,
      },
      neuroticism: {
        nl: (v) => `N — Neuroticisme (Neuroticism): ${v}/100`,
        en: (v) => `N — Neuroticism: ${v}/100`,
      },
      withdrawal: {
        nl: (v) => `   ↳ Terughoudendheid: ${v}/100`,
        en: (v) => `   ↳ Withdrawal: ${v}/100`,
      },
      volatility: {
        nl: (v) => `   ↳ Volatiliteit: ${v}/100`,
        en: (v) => `   ↳ Volatility: ${v}/100`,
      },
      openness: {
        nl: (v) => `O — Openheid voor Ervaringen (Openness): ${v}/100`,
        en: (v) => `O — Openness to Experience: ${v}/100`,
      },
      intellect: {
        nl: (v) => `   ↳ Intellect: ${v}/100`,
        en: (v) => `   ↳ Intellect: ${v}/100`,
      },
      aesthetics: {
        nl: (v) => `   ↳ Esthetiek: ${v}/100`,
        en: (v) => `   ↳ Aesthetics: ${v}/100`,
      },
      honestyHumility: {
        nl: (v) => `H — Eerlijkheid-Nederigheid (Honesty-Humility): ${v}/100`,
        en: (v) => `H — Honesty-Humility: ${v}/100`,
      },
      scaleNote: {
        nl: 'Scores zijn op een schaal van 0 tot 100 (hoger = meer aanwezig).',
        en: 'Scores are on a scale from 0 to 100 (higher = more present).',
      },
    },

    // ── "Lees mij!" essay overlay ──
    leesmij: {
      title: {
        nl: 'Achter de Analyse — De Symetrische Synergie',
        en: 'Behind the Analysis — The Symmetrical Synergy',
      },

      notATest: {
        heading: {
          nl: 'Waarom dit geen persoonlijkheidstest is',
          en: 'Why this is not a personality test',
        },
        p1: {
          nl: 'De meeste tests geven je een hokje. Vier letters, een kleur, een dier — een etiket dat je meedraagt en dat nooit verandert, hoe het leven ook aan je trekt.',
          en: 'Most tests hand you a box. Four letters, a colour, an animal — a label you carry with you that never changes, however hard life pulls at you.',
        },
        p2: {
          nl: 'Dit model vraagt iets anders. Niet ‘’wat ben je’’ maar ‘’hoe navigeer je’’ — tussen instinct en aanleg, wie je van nature bent en wie je hebt leren zijn. \n En belangrijker: wat kost dat je wanneer de druk oploopt. Want een mens is geen vast punt. Een mens is een vorm die buigt, aan ons de kunst om jou te vertellen waar, hoe ver en wat er overeind blijft.',
          en: 'This model asks something else. Not ‘’what are you’’ but ‘’how do you navigate’’ — between instinct and disposition, who you are by nature and who you have learned to be. \n And more importantly: what that costs you when the pressure rises. Because a human being is not a fixed point. A human being is a shape that bends; ours is the art of telling you where it bends, how far, and what stays standing.',
        },
        p3: {
          nl: 'Daarvoor bouwen we op drie originele modellen — elk bezielt op zeer intieme wijze de schoonheid van onze tuin.',
          en: 'For that we build on three original models — each one animates, in a deeply intimate way, the beauty of our garden.',
        },
      },

      wheel: {
        heading: {
          nl: 'Het wiel — Archetype landschap',
          en: 'The wheel — archetype landscape',
        },
        p1: {
          nl: 'We hebben het wiel niet opnieuw uitgevonden. Zijn voorganger is het antieke oosterse zodiak wiel — exact dezelfde geometrie, dezelfde aantallen en dezelfde regels dat elke relatie of conversatie een transformatie is voor beide.',
          en: 'We did not reinvent the wheel. Its predecessor is the ancient eastern zodiac wheel — exactly the same geometry, the same numbers, and the same rule that every relationship or conversation is a transformation for both parties.',
        },
        p2: {
          nl: 'De oude kaart had de vorm goed, wij hebben de wetenschap zijn werk laten doen. De twaalf posities zitten nu geketend op de drie grote hersennetwerken die ‘’Vinod Menon’’ beschreef: het netwerk dat plant en beslist (Central Executive Network), het netwerk dat reflecteert en betekenis geeft (Default Mode Network), en het netwerk dat bepaalt wat aandacht verdient (Salience Network). Dezelfde eeuwenoude geometrie — nu verankerd in de neurobiologie van het brein.',
          en: 'The old map had the shape right; we let science do its work. The twelve positions are now chained to the three great brain networks that ‘’Vinod Menon’’ described: the network that plans and decides (Central Executive Network), the network that reflects and gives meaning (Default Mode Network), and the network that determines what deserves attention (Salience Network). The same age-old geometry — now anchored in the neurobiology of the brain.',
        },
        p3: {
          nl: 'Ja — dit is een bewuste knipoog naar de omstreden astrologie. Niet naar de verscholen sterren, maar naar haar belichaming: het idee dat een mens onderdeel is van een groot geordend wiel en haar onderlinge relaties. \nDe astrologie had die intuïtie eeuwen geleden al, en ze blijkt gevaarlijker dan haar reputatie. Dus wij namen de geometrie serieus en gaven haar een grond die de oude kaart niet had.',
          en: 'Yes — this is a deliberate nod to much-contested astrology. Not to the hidden stars, but to what it embodies: the idea that a human being is part of one large ordered wheel and of the relationships within it. \nAstrology already had that intuition centuries ago, and it turns out to be more dangerous than its reputation suggests. So we took the geometry seriously and gave it a ground the old map never had.',
        },
        p4: {
          nl: 'Zoals een astroloog een geboortekaart leest, lezen wij de verbanden recht van die geometrie af:',
          en: 'Just as an astrologer reads a birth chart, we read the connections straight off that geometry:',
        },
        hardware: {
          nl: 'Wie naast je staat, deelt je {g:#22c55e|hardware}. Buur-archetypen in dezelfde biologische groep draaien op exact dezelfde neurale grond — je stevigste, meest moeiteloze kracht.',
          en: 'Whoever stands beside you shares your {g:#22c55e|hardware}. Neighbouring archetypes in the same biological group run on exactly the same neural ground — your sturdiest, most effortless strength.',
        },
        shadow: {
          nl: 'Wie tegenover je staat, is je {g:#a855f7|schaduw}. De 180°-tegenpool: alles wat je niet bent, en juist daarom je grootste groeirichting. Niet omdat zij de tegenovergestelde hardware hebben, maar omdat ze deze naar jou toe spiegelen.',
          en: 'Whoever stands opposite you is your {g:#a855f7|shadow}. The 180° counterpole: everything you are not, and for exactly that reason your greatest direction of growth. Not because they have the opposite hardware, but because they mirror it back towards you.',
        },
        bridge: {
          nl: 'Sommige verbindingen kruisen het wiel als een {g:#3b82f6|brug}. Archetypen uit verschillende groepen die elkaars tegengewicht dragen — een spanning die, wie haar kan houden, in beweging zet.',
          en: 'Some connections cross the wheel like a {g:#3b82f6|bridge}. Archetypes from different groups that carry each other’s counterweight — a tension that sets whoever can hold it in motion.',
        },
        friction: {
          nl: 'Tegenstrijdigheid is hier geen politiek maar {g:#ef4444|contrasterende} hardware, de natuur die een keuze heeft gemaakt en de mens die dit moet respecteren.',
          en: 'Contradiction here is not politics but {g:#ef4444|contrasting} hardware: nature having made a choice, and the human being having to respect it.',
        },
        learned: {
          nl: 'En over alles heen ligt wat je hebt {g:#eab308|geléérd}. Driehoeken van archetypen die biologisch niets delen, maar die jaren van vorming tot één aangeleerd netwerk hebben gesmeed — de software die je schreef om te overleven.',
          en: 'And over all of it lies what you have {g:#eab308|learned}. Triangles of archetypes that share nothing biologically, but that years of formation have forged into a single learned network — the software you wrote in order to survive.',
        },
        closing: {
          nl: 'Geen van deze verbindingen is verzonnen, ze presenteerden zichzelf. Dit is de synchronisatie tussen determinatie en vrije wil.',
          en: 'None of these connections was invented; they presented themselves. This is the synchronization between determination and free will.',
        },
      },

      triangle: {
        heading: {
          nl: 'De driehoek — waar het om draait',
          en: 'The triangle — what it comes down to',
        },
        p1: {
          nl: 'In het wiel ligt een driehoek, en die transfigureert een oude vraag: In welke mate trekt een waarde je richting bepaald gedrag wanneer keuze schaars voelt?',
          en: 'Inside the wheel lies a triangle, and it transfigures an old question: to what extent does a value pull you towards particular behaviour when choice feels scarce?',
        },
        p2: {
          nl: 'Het zijn de drie waarden die Plato herkende als het hoogste waar een mens zich naar kan richten. Wij citeren hem niet — we zetten zijn intuïtie voort. De Deltawerken is de moderne gestalte van diezelfde platonische geest: niet drie idealen aan een hemel, maar drie geneste richtingen waarin een levend mens zich wendt. \nElk archetype navigeert hierop — niet als externe uitstraling, maar als waar je je naartoe keert wanneer het er werkelijk toe doet. De driehoek bepaalt de diepte: niet alleen wat je doet, maar waarvoor en voor wie.',
          en: 'These are the three values Plato recognized as the highest a human being can orient towards. We do not quote him — we carry his intuition forward. The Deltawerken is the modern shape of that same Platonic spirit: not three ideals hung in a heaven, but three nested directions in which a living human being turns. \nEvery archetype navigates by them — not as an outward radiance, but as what you turn towards when it truly matters. The triangle sets the depth: not only what you do, but what for and for whom.',
        },
      },

      cells: {
        heading: {
          nl: 'Cellen in cellen — hoe diep het gaat',
          en: 'Cells within cells — how deep it goes',
        },
        p1: {
          nl: 'Kijk goed naar dit beeld, het is het patroon dat de wetenschap als geheel probeert te ontvouwen: dezelfde nesten, dezelfde geometrie van vorm-binnen-vorm, die terugkeert van het kleinste naar het grootste. \nDe chemie vindt het in moleculen, de biologie in cellen, de fysica in velden, de kosmologie en astronomie in de structuur van het heelal — en de psychologie in jou. \nEén substraat, uitgedrukt op verschillende frequenties.',
          en: 'Look closely at this image: it is the pattern science as a whole is trying to unfold — the same nesting, the same geometry of form-within-form, recurring from the smallest scale to the largest. \nChemistry finds it in molecules, biology in cells, physics in fields, cosmology and astronomy in the structure of the universe — and psychology in you. \nOne substrate, expressed at different frequencies.',
        },
        p2: {
          nl: 'Een mens is daar geen uitzondering op, maar een instantie ervan: genest in lagen, van het lijf dat ademt tot de betekenis die je zoekt — van de eerste fysiologische behoefte, via zelf en gemeenschap, naar intimiteit en wat daarboven uitreikt. \nDaarom raakt deze test niet alleen je persoonlijkheid maar jouw levensverhaal: de intense spanning tussen je natuurlijke aanleg en wat de cultuur van je maakte. Piaget noemde het cognitieve stadia. Jung noemde het individuatie. Wij brengen het in kaart als een dynamiek — niet een eindpunt, maar een beweging die nooit stopt.',
          en: 'A human being is no exception to this but an instance of it: nested in layers, from the body that breathes to the meaning you look for — from the first physiological need, by way of self and community, to intimacy and whatever reaches beyond it. \nThat is why this test touches not only your personality but your life story: the intense tension between your natural disposition and what culture made of you. Piaget called it cognitive stages. Jung called it individuation. We map it as a dynamic — not an end point, but a movement that never stops.',
        },
      },

      carries: {
        heading: {
          nl: 'Wat dit model draagt, en de meeste niet',
          en: 'What this model carries, and most do not',
        },
        p1: {
          nl: 'Een gewone test vraagt je een paar vinkjes en geeft je wat data terug. Hier kies je tweeledig op zesendertig vragen, die onderscheid maken tussen aangeleerd gedrag en de essentie — en elke keuze stroomt niet naar één punt, maar door de geometrie van het hele wiel. Tweeënzeventig datapunten waarvan er geen één op zichzelf staat.',
          en: 'An ordinary test asks you for a few ticks and hands you back some data. Here you choose twice on thirty-six questions that separate learned behaviour from essence — and every choice flows not to a single point, but through the geometry of the whole wheel. Seventy-two data points, not one of which stands on its own.',
        },
        p2: {
          nl: 'Tel je uit hoeveel verschillende geometrieën daaruit kunnen ontstaan, dan kom je op een getal van vierenvijftig cijfers: 30³⁶ — meer dan honderdvijftig quadriljard maal een biljoen. Meer dan er sterren aan de hemel staan, meer dan er atomen in je lichaam zitten.',
          en: 'Work out how many different geometries can arise from that and you land on a fifty-four-digit number: 30³⁶ — more than a hundred and fifty quadrillion times a trillion. More than there are stars in the sky, more than there are atoms in your body.',
        },
        p3: {
          nl: 'Dit is geen losse statistiek: het is een gevolg van hoe het model leest. Elke keuze stroomt niet naar één oceaan, maar verspreidt zich in vijf afzonderlijke geometrische kanalen — gedeelde hardware, bruggen, schaduw, aangeleerde driehoeken, frictie. \nGeen etiket, een vingerafdruk.',
          en: 'This is not a loose statistic: it follows from the way the model reads. Every choice flows not into one ocean, but spreads across five separate geometric channels — shared hardware, bridges, shadow, learned triangles, friction. \nNot a label — a fingerprint.',
        },
        p4: {
          nl: '\nToch zit de diepte niet eens in hoeveel vormen er mogelijk zijn. Ze zit in wat we eruit lezen. Dit model reikt tot het oog van de storm: hoe jouw specifieke configuratie zich houdt wanneer de druk oploopt, waar ze het langst standhoudt — waar en op welk punt ze breekt. Niet om je een diagnose te geven, maar om je de vorm van je eigen veerkracht te tonen: waar je rust, waar je rekt, en wat je het kost om overeind te blijven.',
          en: '\nAnd yet the depth does not even lie in how many shapes are possible. It lies in what we read from them. This model reaches all the way into the eye of the storm: how your specific configuration holds when the pressure rises, where it holds out longest — where and at what point it breaks. Not to give you a diagnosis, but to show you the shape of your own resilience: where you rest, where you stretch, and what it costs you to stay standing.',
        },
        p5: {
          nl: 'Een etiket zegt wie je bent, een kaart laat zien hoe je in die headspace kan bewegen.',
          en: 'A label says who you are; a map shows how you can move inside that headspace.',
        },
      },
    },
  },
};
