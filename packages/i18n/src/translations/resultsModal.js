/**
 * resultsModal.js — copy for AssessmentResultsModal.jsx
 *
 * Two families live here:
 *   ui   — on-screen strings of the results card (loading, gate, consent, buttons)
 *   pdf  — everything written into the generated report (cover, legal, editorial
 *          pages, OCEAN, dual-core, AI prompt, footer, machine block)
 *
 * "Deltawerken" is a proper name and is NEVER translated.
 */

export default {
  resultsModal: {
    // ── Shared labels (key-findings strip on the card AND in the short PDF) ──
    labels: {
      kern: { nl: 'Kern', en: 'Core' },
      support: { nl: 'Support', en: 'Support' },
      schaduw: { nl: 'Schaduw', en: 'Shadow' },
      blindspot: { nl: 'Blindspot', en: 'Blindspot' },
      polarisatie: { nl: 'Polarisatie', en: 'Polarisation' },
      stilleStemPrefix: { nl: 'De Stille Stem — ', en: 'The Quiet Voice — ' },
    },

    // ── Polarisation band (main vs shadow gap) ──
    bands: {
      suppressed: { nl: 'Schaduw onderdrukt', en: 'Shadow suppressed' },
      healthy: { nl: 'Gezonde spanning', en: 'Healthy tension' },
      integrating: { nl: 'Actieve integratie', en: 'Active integration' },
    },

    // ── Cognitive triangles (structural lookup, surfaced in the machine block) ──
    cog: {
      modes: {
        idealisme: { nl: 'Idealisme Modus', en: 'Idealism Mode' },
        exploratie: { nl: 'Exploratie Modus', en: 'Exploration Mode' },
        impact: { nl: 'Impact Modus', en: 'Impact Mode' },
        engagement: { nl: 'Engagement Modus', en: 'Engagement Mode' },
      },
      networks: {
        cenOpennessDmn: { nl: 'CEN · Openness · DMN', en: 'CEN · Openness · DMN' },
        limbicSalienceAgency: { nl: 'Limbisch · Salience · Agency', en: 'Limbic · Salience · Agency' },
      },
    },

    // ── OCEAN trait names as used in the PDF ──
    ocean: {
      O: { nl: 'Openheid', en: 'Openness' },
      C: { nl: 'Ordelijkheid', en: 'Conscientiousness' },
      E: { nl: 'Extraversie', en: 'Extraversion' },
      A: { nl: 'Meegaandheid', en: 'Agreeableness' },
      N: { nl: 'Neuroticisme', en: 'Neuroticism' },
    },

    // ── Six biological groups: network label + drive (shared by the "taal van de
    //    test" table, the dual-core legend and the machine block) ──
    groups: {
      ruling: {
        network: { nl: 'CEN Dominantie', en: 'CEN Dominance' },
        drive: { nl: 'Externe structuur en orde', en: 'External structure and order' },
      },
      relational: {
        network: { nl: 'Limbic Coupling', en: 'Limbic Coupling' },
        drive: { nl: 'Emotionele fusie en empathie', en: 'Emotional fusion and empathy' },
      },
      seeker: {
        network: { nl: 'Hoge Openness', en: 'High Openness' },
        drive: { nl: 'Zuiverheid en ontdekking', en: 'Purity and discovery' },
      },
      chaos: {
        network: { nl: 'Salience Network', en: 'Salience Network' },
        drive: { nl: 'Disruptie en lage consciëntieusheid', en: 'Disruption and low conscientiousness' },
      },
      abstract: {
        network: { nl: 'DMN Hyper-connectie', en: 'DMN Hyper-connectivity' },
        drive: { nl: 'Interne reflectie en subjectiviteit', en: 'Internal reflection and subjectivity' },
      },
      agency: {
        network: { nl: 'Extraversie / Wilskracht', en: 'Extraversion / Willpower' },
        networkCompact: { nl: 'Extraversie/Wilskracht', en: 'Extraversion/Willpower' },
        drive: { nl: 'Actie en transformatie', en: 'Action and transformation' },
      },
    },

    // ═══════════════════════════════════════════════════════════════════
    // ON-SCREEN UI
    // ═══════════════════════════════════════════════════════════════════
    ui: {
      // Email gate validation
      emailRequired: { nl: 'Vul je e-mailadres in', en: 'Please enter your email address' },
      emailInvalid: { nl: 'Vul een geldig e-mailadres in', en: 'Please enter a valid email address' },
      submitFailed: { nl: 'Verzenden mislukt. Probeer opnieuw.', en: 'Submission failed. Please try again.' },

      // Loading phase
      loadingLine1: { nl: 'We berekenen niet wie je bent.', en: 'We are not calculating who you are.' },
      loadingLine2: {
        nl: 'We berekenen de fysiologische prijs van wie je probeert te zijn.',
        en: 'We are calculating the physiological price of who you are trying to be.',
      },
      timeEstimate: { nl: 'ca. 9 min', en: 'approx. 9 min' },
      aiUnavailable: {
        nl: 'AI analyse niet beschikbaar — basisresultaten beschikbaar.',
        en: 'AI analysis unavailable — basic results are available.',
      },
      retry: { nl: 'Probeer opnieuw', en: 'Try again' },
      continueWithoutAi: { nl: 'Doorgaan zonder AI', en: 'Continue without AI' },

      // Meta-disclaimer above the AI sections
      metaDisclaimerLabel: { nl: 'Meta-Disclaimer:', en: 'Meta-Disclaimer:' },
      metaDisclaimerBody: {
        nl: 'Dit rapport is gegenereerd door het Garden For Life Deltawerken Model — een zelfreflectie-instrument, geen klinische diagnose. De gebruikte neurobiologische termen zijn metaforen binnen dit specifieke model. Raadpleeg een professional voor medisch of psychologisch advies.',
        en: 'This report was generated by the Garden For Life Deltawerken Model — a self-reflection instrument, not a clinical diagnosis. The neurobiological terms used are metaphors within this specific model. Consult a professional for medical or psychological advice.',
      },

      // D-curve caption under the on-card morphology chart
      morphCaption: {
        nl: 'Hoofd en Support tonen elk de absolute kostencurve van het archetype (0–100). Samengesteld is de gecombineerde belasting, genormaliseerd op zijn eigen piek (=100%) — het toont de vorm binnen jouw configuratie, geen absolute vergelijking, en kan daarom boven de losse lijnen liggen.',
        en: 'Main and Support each show the archetype’s absolute cost-curve (0–100). Samengesteld (composed) is the blended load normalised to its own peak (=100%) — it shows the shape within your configuration, not an absolute comparison, so it can sit above the individual lines.',
      },

      // Download teaser
      teaserTitle: { nl: 'Volledig Rapport (3× zoveel data)', en: 'Full Report (3× the data)' },
      teaserBody: {
        nl: 'Dit is een korte samenvatting. Je volledige rapport bevat ongeveer 3× zoveel data — alle secties, de grafieken, de D-curve, het OCEAN-profiel, de complete AI-prompt en de machine-leesbare profieldata. Download de PDF om alles te lezen, wanneer je maar wilt.',
        en: 'This is a short summary. Your full report holds roughly 3× the data — every section, the charts, the D-curve, the OCEAN profile, the complete AI prompt and the machine-readable profile data. Download the PDF to read it all, whenever you like.',
      },

      // Email gate
      emailLabel: { nl: 'E-mailadres', en: 'Email address' },
      emailPlaceholder: { nl: 'jouw@email.nl', en: 'you@email.com' },
      emailNote: {
        nl: 'We sturen je in de toekomst éénmalig een reclamebrief om je te herinneren aan je vooruitgang. De keuze is daarna aan jou om te navigeren in je vernieuwde landschap.',
        en: 'In the future we will send you a single promotional letter to remind you of your progress. After that the choice is yours: how to navigate your renewed landscape.',
      },
      sending: { nl: 'Versturen...', en: 'Sending...' },
      proceed: { nl: 'PROCEED', en: 'PROCEED' },

      // PDF consent micro-modal
      consentTitleShort: { nl: 'Verantwoordelijkheid PDF', en: 'PDF Responsibility' },
      consentTitleFull: { nl: 'Verantwoordelijkheid PDF & AI Prompt', en: 'PDF & AI Prompt Responsibility' },
      consentLead: { nl: 'Lees dit door voordat je de PDF downloadt', en: 'Please read this before downloading the PDF' },
      consentBodyShort: {
        nl: 'Dit is een zelfreflectie-instrument gebaseerd op het Deltawerken model — geen klinische diagnose. De gebruikte termen zijn metaforen binnen dit model.',
        en: 'This is a self-reflection instrument based on the Deltawerken model — not a clinical diagnosis. The terms used are metaphors within this model.',
      },
      consentBodyFull: {
        nl: 'Dit is een zelfreflectie-instrument gebaseerd op het Deltawerken model. De stijlrichtlijnen in deze prompt zijn geen klinisch profiel maar een gedragsmatige reflectievoorkeur. Gebruik in externe AI-tools valt buiten de verantwoordelijkheid van Garden For Life.',
        en: 'This is a self-reflection instrument based on the Deltawerken model. The style guidelines in this prompt are not a clinical profile but a behavioural reflection preference. Use in external AI tools falls outside the responsibility of Garden For Life.',
      },
      consentCheckShort: { nl: 'Ik begrijp het.', en: 'I understand.' },
      consentCheckFull: {
        nl: 'Ik begrijp dat de AI Agent Prompt in deze PDF experimenteel is en aanvaard volledige verantwoordelijkheid voor het gebruik ervan.',
        en: 'I understand that the AI Agent Prompt in this PDF is experimental and I accept full responsibility for its use.',
      },
      cancel: { nl: 'Annuleren', en: 'Cancel' },
      consentConfirm: { nl: 'Begrepen en akkoord — Download PDF', en: 'Understood and agreed — Download PDF' },

      // Footer action buttons
      generating: { nl: 'Generating...', en: 'Generating...' },
      shortVersion: { nl: 'Korte versie', en: 'Short version' },
      downloadNow: { nl: 'Download nu', en: 'Download now' },
      continueBtn: { nl: 'CONTINUE', en: 'CONTINUE' },
      leaveWarning: {
        nl: 'Als je deze pagina verlaat kun je het rapport niet meer downloaden.',
        en: 'If you leave this page you will no longer be able to download the report.',
      },
      fullReport: { nl: 'Volledige rapport', en: 'Full report' },
      price: { nl: '€ 00,00', en: '€ 00,00' },
    },

    // ═══════════════════════════════════════════════════════════════════
    // PDF
    // ═══════════════════════════════════════════════════════════════════
    pdf: {
      // ── Cover ──
      cover: {
        brandLine: { nl: 'GARDEN FOR LIFE: Archetype Analyse', en: 'GARDEN FOR LIFE: Archetype Analysis' },
        datapoints: { nl: 'DELTAWERKEN DATAPUNTEN', en: 'DELTAWERKEN DATA POINTS' },
      },

      // ── Meta-disclaimer block (identity page, full + short report) ──
      metaDisclaimer: {
        nl: 'Meta-Disclaimer: Dit rapport is gegenereerd door het Garden For Life Deltawerken Model — een zelfreflectie-instrument, geen klinische diagnose. De gebruikte neurobiologische termen zijn metaforen binnen dit specifieke model. Raadpleeg een professional voor medisch of psychologisch advies.',
        en: 'Meta-Disclaimer: This report was generated by the Garden For Life Deltawerken Model — a self-reflection instrument, not a clinical diagnosis. The neurobiological terms used are metaphors within this specific model. Consult a professional for medical or psychological advice.',
      },

      // ── Short (free) report ──
      short: {
        fileSuffix: { nl: '_kort', en: '_short' },
        closingTitle: { nl: 'Tot Slot', en: 'In Closing' },
        closingPlaceholder: {
          nl: 'Deze afsluiting wordt binnenkort toegevoegd.',
          en: 'This closing section will be added shortly.',
        },
      },

      // ── Legal / compliance page ──
      legal: {
        pageTitle: { nl: 'Juridische Informatie & Disclaimer', en: 'Legal Information & Disclaimer' },
        c1Title: { nl: '1. Productomschrijving', en: '1. Product Description' },
        c1Body: {
          nl: 'Dit document is gegenereerd door het Garden for Life Assessment System, een zelfreflectie-instrument gebaseerd op het Deltawerken model. De resultaten in dit rapport zijn gebaseerd op een AI-gestuurd archetyperingsmodel en vormen geen klinische diagnose, psychologisch advies of medische beoordeling. Het systeem kent op basis van uw antwoorden een archetypecombinatie toe die bedoeld is als spiegel voor persoonlijke reflectie.',
          en: 'This document was generated by the Garden for Life Assessment System, a self-reflection instrument based on the Deltawerken model. The results in this report are based on an AI-driven archetyping model and do not constitute a clinical diagnosis, psychological advice or medical assessment. On the basis of your answers the system assigns an archetype combination that is intended as a mirror for personal reflection.',
        },
        c2Title: { nl: '2. Metaforisch Kader & Wetenschappelijke Context', en: '2. Metaphorical Framework & Scientific Context' },
        c2Body: {
          nl: 'Dit systeem maakt gebruik van termen en concepten uit de neurowetenschappen, kwantumbiologie en Zero Point Energy (ZPE). Deze worden uitsluitend metaforisch ingezet als denkkader en worden niet gepresenteerd als gevestigde wetenschap. Verwijzingen naar neurotransmitters, kwantumvelden of energetische patronen dienen als beeldspraak om gedragspatronen te duiden, niet als wetenschappelijke claims.',
          en: 'This system uses terms and concepts from neuroscience, quantum biology and Zero Point Energy (ZPE). These are employed strictly metaphorically, as a frame of thought, and are not presented as established science. References to neurotransmitters, quantum fields or energetic patterns serve as imagery for interpreting behavioural patterns, not as scientific claims.',
        },
        c3Title: { nl: '3. AI Agent Prompt — Verantwoordelijkheid', en: '3. AI Agent Prompt — Responsibility' },
        c3Body: {
          nl: 'De AI Agent Prompt die in dit document is opgenomen, is een experimenteel gegenereerd stijlprofiel. De stijlrichtlijnen in deze prompt zijn geen klinisch profiel maar een gedragsmatige reflectievoorkeur. Gebruik in externe AI-tools (zoals ChatGPT, Claude of andere) valt volledig buiten de verantwoordelijkheid van Garden For Life. De gebruiker aanvaardt volledige verantwoordelijkheid voor het gebruik van deze prompt buiten het Garden for Life platform.',
          en: 'The AI Agent Prompt included in this document is an experimentally generated style profile. The style guidelines in this prompt are not a clinical profile but a behavioural reflection preference. Use in external AI tools (such as ChatGPT, Claude or others) falls entirely outside the responsibility of Garden For Life. The user accepts full responsibility for the use of this prompt outside the Garden for Life platform.',
        },
        c4Title: { nl: '4. Gegevensbescherming (AVG/GDPR)', en: '4. Data Protection (GDPR/AVG)' },
        c4Body: {
          nl: 'Garden for Life verwerkt persoonsgegevens in overeenstemming met de Algemene Verordening Gegevensbescherming (AVG/GDPR). Assessment-resultaten worden maximaal 90 dagen bewaard op beveiligde servers binnen de EU (Frankfurt, Duitsland). E-mailadressen en weergavenamen worden versleuteld opgeslagen (AES-256-GCM). Na de bewaartermijn worden gegevens automatisch en onherroepelijk verwijderd. U heeft te allen tijde het recht om uw account en alle bijbehorende gegevens direct te verwijderen via uw profielinstellingen.',
          en: 'Garden for Life processes personal data in accordance with the General Data Protection Regulation (GDPR/AVG). Assessment results are retained for a maximum of 90 days on secure servers within the EU (Frankfurt, Germany). Email addresses and display names are stored encrypted (AES-256-GCM). After the retention period the data is deleted automatically and irrevocably. You have the right at any time to delete your account and all associated data immediately via your profile settings.',
        },
        c5Title: { nl: '5. Intellectueel Eigendom', en: '5. Intellectual Property' },
        c5Body: {
          nl: 'Het Deltawerken model, de archetypenstructuur, het scoringssysteem en alle bijbehorende teksten en visualisaties zijn intellectueel eigendom van Garden For Life. Dit document is uitsluitend bedoeld voor persoonlijk gebruik door de ontvanger. Reproductie, publicatie of commercieel gebruik van (delen van) dit rapport zonder schriftelijke toestemming is niet toegestaan.',
          en: 'The Deltawerken model, the archetype structure, the scoring system and all associated texts and visualisations are the intellectual property of Garden For Life. This document is intended solely for personal use by the recipient. Reproduction, publication or commercial use of (parts of) this report without written permission is not permitted.',
        },
        c6Title: { nl: '6. Aansprakelijkheid', en: '6. Liability' },
        c6Body: {
          nl: 'Garden for Life aanvaardt geen aansprakelijkheid voor beslissingen genomen op basis van de resultaten in dit rapport. Dit instrument is geen vervanging voor professioneel psychologisch, medisch of therapeutisch advies. Bij psychische klachten of zorgen wordt geadviseerd contact op te nemen met een gekwalificeerde zorgverlener. Het gebruik van dit rapport en de daarin opgenomen AI Agent Prompt geschiedt geheel op eigen risico van de gebruiker.',
          en: 'Garden for Life accepts no liability for decisions taken on the basis of the results in this report. This instrument is not a substitute for professional psychological, medical or therapeutic advice. In the event of psychological complaints or concerns, you are advised to contact a qualified healthcare provider. Use of this report and of the AI Agent Prompt it contains is entirely at the user’s own risk.',
        },
        consentTitle: { nl: 'Toestemming bevestigd', en: 'Consent confirmed' },
        consentLine1: {
          nl: 'De gebruiker heeft bij het downloaden van dit document bevestigd kennis te hebben',
          en: 'On downloading this document the user confirmed having taken note of the',
        },
        consentLine2: {
          nl: 'genomen van bovenstaande voorwaarden en de verantwoordelijkheid voor gebruik te aanvaarden.',
          en: 'conditions above and accepting responsibility for its use.',
        },
        contact: {
          nl: 'Vragen of verzoeken? Neem contact op via het Garden for Life platform.',
          en: 'Questions or requests? Get in touch via the Garden for Life platform.',
        },
      },

      // ── Belangrijke Context (editorial page 3) ──
      context: {
        title: { nl: 'Belangrijke Context', en: 'Important Context' },
        intro1: {
          nl: 'Verouderde persoonlijkheidstesten classificeren: ze plaatsen je in een type en tot ziens. Dit model leeft in je voort. Het brengt in kaart hoe jouw zenuwstelsel navigeert tussen aangeboren aanleg en aangeleerde strategie — en, doorslaggevend, hoe die configuratie zich houdt onder toenemende druk.\nNiet een classificatie, maar een dynamisch profiel.',
          en: 'Dated personality tests classify: they put you in a type and wave goodbye. This model lives on in you. It maps how your nervous system navigates between innate disposition and learned strategy — and, decisively, how that configuration holds up under mounting pressure.\nNot a classification, but a dynamic profile.',
        },
        intro2: {
          nl: 'Het rust op drie gouden draden, gesynchroniseerd tot één instrument: de archetypische psychologie van Carl Jung, het neurobiologische Triple Network Model (Menon e.a.), en de Big Five (OCEAN). De synthese meet niet alleen wát je doet, maar vanuit welke neurale laag je het doet.',
          en: 'It rests on three golden threads, synchronised into a single instrument: the archetypal psychology of Carl Jung, the neurobiological Triple Network Model (Menon et al.), and the Big Five (OCEAN). The synthesis measures not only what you do, but from which neural layer you do it.',
        },
        methodTitle: { nl: 'Methodologische noot', en: 'Methodological note' },
        methodBody: {
          nl: 'Een noot vooraf, in lijn met de discipline van het model: de neurowetenschappelijke termen die volgen zijn zuiver mechanistisch — beschrijvingen van verwerkingspatronen, geen klinische claims. Het model leest tendensen, geen vaststaande feiten. Waar het naar neigt, richting weegt, en dus nooit per definitie is.',
          en: 'A note up front, in keeping with the discipline of the model: the neuroscientific terms that follow are purely mechanistic — descriptions of processing patterns, not clinical claims. The model reads tendencies, not settled facts. What it leans towards, the direction it weighs, and therefore never what something is by definition.',
        },
        deltaTitle: { nl: 'Deltawerken', en: 'Deltawerken' },
        deltaBody: {
          nl: "Het Deltawerken model legt de waarde-oriëntatie vast: waarheid, goedheid, schoonheid — Plato's transcendentalia, hier niet als citaat maar als operationele as. Elk archetype navigeert middels deze drie polen. De driehoek bepaalt de dieptelaag: niet het gedrag, maar de oriëntatie eronder — waar een configuratie zich naartoe wendt wanneer het moet.",
          en: "The Deltawerken model fixes the value orientation: truth, goodness, beauty — Plato's transcendentals, here not as a quotation but as an operational axis. Every archetype navigates by means of these three poles. The triangle determines the deep layer: not the behaviour, but the orientation beneath it — where a configuration turns when it has to.",
        },
        wielTitle: { nl: 'Het Triple-Network-Wiel', en: 'The Triple-Network Wheel' },
        wielBody: {
          nl: "Het Triple-Network-Wiel plaatst de twaalf kern-archetypen op een geometrische map, verankerd in de drie hersennetwerken die Menon en collega's beschreven: het Central Executive Network (orde, executie), het Default Mode Network (reflectie, betekenis) en het Salience Network (responsiviteit, adaptatie).\nDe geometrie is een extensie van het oosterse zodiak-wiel — dezelfde interne bruggen, dezelfde logica van magnetisme — maar opnieuw verankerd: niet in sterrenbeelden, in netwerken. De ankers zijn verbonden via vijf lijntypes, elk een ander soort relatie.",
          en: "The Triple-Network Wheel places the twelve core archetypes on a geometric map, anchored in the three brain networks Menon and colleagues described: the Central Executive Network (order, execution), the Default Mode Network (reflection, meaning) and the Salience Network (responsiveness, adaptation).\nThe geometry is an extension of the Eastern zodiac wheel — the same internal bridges, the same logic of magnetism — but re-anchored: not in constellations, in networks. The anchors are connected by five line types, each a different kind of relation.",
        },
        cellsTitle: { nl: 'Cells within Cells', en: 'Cells within Cells' },
        cellsBody: {
          nl: 'Cells within Cells Interlinked levert de schaal-as: de geneste ontologische lagen, van fysiologische basisbehoefte via zelf en gemeenschap naar intimiteit en transcendentie.',
          en: 'Cells within Cells Interlinked supplies the scale axis: the nested ontological layers, from basic physiological need via self and community to intimacy and transcendence.',
        },
        close: {
          nl: 'Daarom meet dit instrument niet alleen persoonlijkheid maar de ontwikkelingslaag — de spanning tussen aanleg en conditionering. Piaget noemde het cognitieve stadia; Jung individuatie. De vraag is alleen: hoe meet je waar iemand op die lagen staat?',
          en: 'That is why this instrument measures not only personality but the developmental layer — the tension between disposition and conditioning. Piaget called it cognitive stages; Jung individuation. The only question is: how do you measure where someone stands on those layers?',
        },
      },

      // ── Van vraag naar verband (editorial page 4) ──
      vanVraag: {
        title: { nl: 'Van vraag naar verband', en: 'From question to connection' },
        imgLabel: { nl: 'Cells within Cells', en: 'Cells within Cells' },
        paras: {
          nl: [
            'Het antwoord begint bij 36 vragen over vijf domeinen: Zelf, Ander, Macht, Wijsheid en Mysterie. Elke vraag biedt zes antwoorden — drie vanuit Nature (het ongedwongen instinct) en drie vanuit Culture (de aangeleerde strategie). Je kiest tussen geen en twee: de eerste is de kern, de tweede resoneert maar weegt minder zwaar. Samen: 72 datapunten.',
            "Het onderscheid Nature/Culture rust op Vervaeke's 4P-model van kennen. Nature = participatory en perspectival knowing: je weet het doordat je het bent. Culture = propositional en procedural knowing: je weet dat je het hebt en hoe je ermee navigeert. Beide antwoorden voelen even authentiek; het verschil zit in de korrel van de taal, niet in de oppervlakte.",
            'Elke keuze distribueert punten naar meerdere vectors, het vloeit door de geometrische verbindingen van het wiel.\nEen Nature-keuze activeert de gedeelde hardware en werpt tegelijk een schaduw naar de 180°-tegenpool.\nEen Culture-keuze activeert het aangeleerde netwerk, de gele driehoek.\nGeen enkel datapunt staat op zichzelf; gedrag resoneert door de netwerken heen, consistent met Menons werk over cross-network connectiviteit en Raichles Default Mode-hypothese.',
            'Het resultaat is geen positie maar een verdeling: een geometrie.\nEn omdat elke keuze door vijf kanalen tegelijk bloedt, convergeren verschillende antwoordpaden vrijwel nooit op dezelfde eindvorm —\nde antwoordruimte telt 30^36 configuraties, een getal van 54 cijfers. Geen twee profielen zijn gelijk, en toch verschuilt zich in die chaos een gedeeld patroon.',
          ],
          en: [
            'The answer begins with 36 questions across five domains: Self, Other, Power, Wisdom and Mystery. Each question offers six answers — three from Nature (unforced instinct) and three from Culture (learned strategy). You pick between none and two: the first is the core, the second resonates but weighs less. Together: 72 data points.',
            "The Nature/Culture distinction rests on Vervaeke's 4P model of knowing. Nature = participatory and perspectival knowing: you know it because you are it. Culture = propositional and procedural knowing: you know that you have it and how to navigate with it. Both answers feel equally authentic; the difference lies in the grain of the language, not on the surface.",
            'Every choice distributes points to several vectors; it flows through the geometric connections of the wheel.\nA Nature choice activates the shared hardware and at the same time casts a shadow towards the 180° opposite.\nA Culture choice activates the learned network, the yellow triangle.\nNo single data point stands alone; behaviour resonates across the networks, consistent with Menon’s work on cross-network connectivity and Raichle’s Default Mode hypothesis.',
            'The result is not a position but a distribution: a geometry.\nAnd because every choice bleeds through five channels at once, different answer paths almost never converge on the same final form —\nthe answer space counts 30^36 configurations, a number of 54 digits. No two profiles are alike, and yet a shared pattern hides inside that chaos.',
          ],
        },
        watTitle: { nl: 'Wat het instrument leest', en: 'What the instrument reads' },
        watBody: {
          nl: 'Want het bovenstaande beschrijft de meting bij rust. De werkelijke diepte ligt in de transformatie-delta: voor elke configuratie modelleren we niet alleen hoe ze (animistische delen) zich uitdrukt bij basislast, maar hoe ze vervormt naarmate de druk oploopt — waar ze het langst standhoudt, op welk punt ze omslaat, en hoe het herstel verloopt.\nDit is de plastische laag: een traject van baseline, via belasting, naar bezwijken, met het mechanisme benoemd bij elke fase.',
          en: 'For the above describes the measurement at rest. The real depth lies in the transformation delta: for every configuration we model not only how it (its animistic parts) expresses itself under baseline load, but how it deforms as pressure mounts — where it holds out longest, at which point it flips, and how recovery unfolds.\nThis is the plastic layer: a trajectory from baseline, through load, to collapse, with the mechanism named at each phase.',
        },
        datTitle: { nl: 'Dat is wat het rapport leest', en: 'That is what the report reads' },
        datBody: {
          nl: 'Dat is wat het rapport hierna doet. Geen typebeschrijving, maar een dynamische analyse van jouw scoreprofiel — geschreven in de taal van je dominante netwerk, gericht op de vorm van je veerkracht: waar je rust, waar je rekt, en wat het je kost om overeind te blijven. Hiervoor moeten we eerst de structuur blootleggen.',
          en: 'That is what the report does from here. Not a type description, but a dynamic analysis of your score profile — written in the language of your dominant network, aimed at the shape of your resilience: where you rest, where you stretch, and what it costs you to stay upright. To get there we first have to lay the structure bare.',
        },
        lijnTitle: { nl: 'De vijf lijntypes', en: 'The five line types' },
        lijnIntro: {
          nl: 'De vijf verbindingen volgen uit de positie op het wiel, en elk routeert punten anders:',
          en: 'The five connections follow from the position on the wheel, and each routes points differently:',
        },
        lines: {
          groenLabel: { nl: 'Groen', en: 'Green' },
          groen: {
            nl: '— gedeelde hardware. Buur-archetypen in dezelfde biologische groep draaien op dezelfde neurale grond. De stevigste, meest moeiteloze koppeling. (Nature)',
            en: '— shared hardware. Neighbouring archetypes in the same biological group run on the same neural ground. The sturdiest, most effortless coupling. (Nature)',
          },
          paarsLabel: { nl: 'Paars', en: 'Purple' },
          paars: {
            nl: '— de schaduw-as (180°). De tegenpool die de configuratie naar zich toe spiegelt. Grootste groeirichting.',
            en: '— the shadow axis (180°). The opposite pole that mirrors the configuration towards itself. The greatest direction of growth.',
          },
          blauwLabel: { nl: 'Blauw', en: 'Blue' },
          blauw: {
            nl: '— de feedback-brug. Kruist de groepen en draagt reorganisatie: een runtime-kanaal dat tegengewicht overbrengt.',
            en: '— the feedback bridge. It crosses the groups and carries reorganisation: a runtime channel that transmits counterweight.',
          },
          geelLabel: { nl: 'Geel', en: 'Yellow' },
          geel: {
            nl: '— de aangeleerde driehoek. Archetypen zonder biologische verwantschap, door conditionering tot één getraind netwerk gesmeed. (Culture)',
            en: '— the learned triangle. Archetypes without biological kinship, forged by conditioning into a single trained network. (Culture)',
          },
          roodLabel: { nl: 'Rood', en: 'Red' },
          rood: {
            nl: '— de frictie-as. De cross-group botsing waar de neurale schaduw zijn oorsprong heeft; de plek waar projectie ontstaat.',
            en: '— the friction axis. The cross-group collision where the neural shadow originates; the place where projection is born.',
          },
        },
      },

      // ── De taal van de test (editorial page) ──
      taal: {
        title: { nl: 'De taal van de test', en: 'The language of the test' },
        p1: {
          nl: 'Want die structuur rust op universele geometrie: eeuwenoude wijsheid, vertaald in spiritualiteit. De numerologie is niet ontworpen maar ontdekt — het resoneert met oude mythologieën én met moderne wetenschap; kwantumfysica, neurobiologie, astronomie. Niet te verwarren met astrologie; dit raakt van nature aan persoonlijkheidspsychologie.',
          en: 'For that structure rests on universal geometry: age-old wisdom, translated into spirituality. The numerology was not designed but discovered — it resonates with ancient mythologies and with modern science alike; quantum physics, neurobiology, astronomy. Not to be confused with astrology; this touches naturally on personality psychology.',
        },
        p2: {
          nl: 'Realiteit wordt pas kenbaar door differentiatie: de splitsing naar twee. Maar wat is determinatie waard wanneer alles vastligt? De derde as is de motor van transformatie — deze verschijning is het patroon van onze gemodelleerde psychologie, de plek waar beweging ontstaat.',
          en: 'Reality only becomes knowable through differentiation: the split into two. But what is determination worth when everything is fixed? The third axis is the engine of transformation — this appearance is the pattern of our modelled psychology, the place where movement arises.',
        },
        p3: {
          nl: 'Westerse neurobiologie wijst op een tweedeling van het brein: een gebalanceerde deling tussen orde en chaos. Waar die twee elkaar raken, kristalliseren zes biologische cognitieve netwerken uit — gehardwired, de grond waarop alles wat volgt is gebouwd:',
          en: 'Western neurobiology points to a division of the brain in two: a balanced split between order and chaos. Where those two meet, six biological cognitive networks crystallise out — hardwired, the ground on which everything that follows is built:',
        },
        groupHeaders: {
          nl: ['GROEP', 'NETWERK', 'ARCHETYPEN', 'DRIJFVEER'],
          en: ['GROUP', 'NETWORK', 'ARCHETYPES', 'DRIVE'],
        },
        depthHeaders: {
          nl: ['Diepte', 'Getal', 'Afleiding', 'Manifestatie'],
          en: ['Depth', 'Number', 'Derivation', 'Manifestation'],
        },
        depthRows: {
          nl: [
            ['0', '3', 'kiem', 'Drievoudig Netwerkmodel (DMN, SN, CEN)'],
            ['1', '6 = 3 × 2', 'polariteitssplitsing', '6 biogroepen, 6 antwoorden, 6 rotatiesleutels'],
            ['2', '12 = 3 × 2²', 'Start van complexiteit', '12 archetypen op het wiel'],
            ['3', '36 = 3² × 2²', '3 in het kwadraat × 4', '36 vragen (3 per archetype)'],
            ['4', '72 = 3² × 2³', 'binaire verdubbeling', '72 keuzes, 72 uitgebreide uitkomsten'],
          ],
          en: [
            ['0', '3', 'seed', 'Triple Network Model (DMN, SN, CEN)'],
            ['1', '6 = 3 × 2', 'polarity split', '6 biogroups, 6 answers, 6 rotation keys'],
            ['2', '12 = 3 × 2²', 'Onset of complexity', '12 archetypes on the wheel'],
            ['3', '36 = 3² × 2²', '3 squared × 4', '36 questions (3 per archetype)'],
            ['4', '72 = 3² × 2³', 'binary doubling', '72 choices, 72 extended outcomes'],
          ],
        },
        atom3Title: { nl: 'Atoom — 3', en: 'Atom — 3' },
        atom3Body: {
          nl: 'Drie is het ware atoom. Al het andere is drie — verdubbeld, gekwadrateerd, of als faculteit berekend: drie netwerken, verdubbeld door polariteit, verdubbeld door individuatie, gekwadrateerd tot vragen, verdubbeld tot keuzes, als faculteit tot punten.',
          en: 'Three is the true atom. Everything else is three — doubled, squared, or taken as a factorial: three networks, doubled by polarity, doubled by individuation, squared into questions, doubled into choices, factorialised into points.',
        },
        atom6Title: { nl: 'Atoom — 6', en: 'Atom — 6' },
        atom6Body: {
          nl: 'Vijf doorbreekt als enige het patroon — maar vijf is zelf twee plus drie: 2×9 vragen, 3×6 domeinen. De triade, herenigd met haar dualiteitsoperator. Het systeem rust op een drie die onophoudelijk in een spiegel kijkt. Zelf-9 en Ander-9 sturen Macht-6, Magie-6 en de gespiegelde Wijsheid-6. Zes is het atoom van het hele systeem, en alles vloeit daaruit voort:',
          en: 'Five alone breaks the pattern — but five is itself two plus three: 2×9 questions, 3×6 domains. The triad, reunited with its duality operator. The system rests on a three that gazes endlessly into a mirror. Self-9 and Other-9 steer Power-6, Magic-6 and the mirrored Wisdom-6. Six is the atom of the whole system, and everything flows from it:',
        },
        angleHeaders: {
          nl: ['Hoeken', 'Toepassing', 'Weergave'],
          en: ['Angles', 'Application', 'Representation'],
        },
        angleRows: {
          nl: [['30° = 360/12', 'Boog per archetype', 'Hoekafstand in het radardiagram']],
          en: [['30° = 360/12', 'Arc per archetype', 'Angular distance in the radar diagram']],
        },
        sacredTitle: { nl: 'Geometrische / heilige verbindingen:', en: 'Geometric / sacred connections:' },
        sacredBullets: {
          nl: [
            '72° = 360°/5 = de hoek van een regelmatige vijfhoek — en we hebben exact 5 lagen',
            '36° = 360°/10 = de helft van een vijfhoekige hoek — tevens 6²',
            '6 is zowel het kleinste perfecte getal (1+2+3 = 6 = 1×2×3) als het enige getal dat zowel een driehoeksgetal als een faculteit is',
          ],
          en: [
            '72° = 360°/5 = the angle of a regular pentagon — and we have exactly 5 layers',
            '36° = 360°/10 = half a pentagonal angle — and also 6²',
            '6 is both the smallest perfect number (1+2+3 = 6 = 1×2×3) and the only number that is both a triangular number and a factorial',
          ],
        },
        kicker: { nl: 'Niet slecht voor een psychologische test.', en: 'Not bad for a personality test.' },
      },

      // ── 72 Archetypes cross-reference page ──
      myth: {
        title: {
          nl: '72 Archetypes — Culturele & Mythologische Kruisverwijzing',
          en: '72 Archetypes — Cultural & Mythological Cross-Reference',
        },
        intro: {
          nl: 'Deze mythologie beschrijft de karakter laag van transformatie — hoe iets beweegt en verandert.\nTwaalf kern-archetypen, elk gedragen door één van zes neurale hardware-groepen, geven tweeënzeventig patronen.',
          en: 'This mythology describes the character layer of transformation — how something moves and changes.\nTwelve core archetypes, each carried by one of six neural hardware groups, yield seventy-two patterns.',
        },
        closer1: {
          nl: 'De traditie komt telkens op hetzelfde getal uit, maar moderne wetenschap verfijnt de resolutie; onder elke transformatie ligt een dieper biologisch detail die de mythologie niet kon meten.',
          en: 'Tradition arrives at the same number time and again, but modern science refines the resolution; beneath every transformation lies a deeper biological detail that mythology could not measure.',
        },
        closer2: {
          nl: 'Precies die laag hebben wij voor jou in kaart gebracht.',
          en: 'That is precisely the layer we have mapped for you.',
        },
        headers: {
          nl: ['Traditie / Discipline', 'Het Concept', 'Betekenis & Belang', 'Thematische Kruisverwijzing'],
          en: ['Tradition / Discipline', 'The Concept', 'Meaning & Significance', 'Thematic Cross-Reference'],
        },
        rows: {
          nl: [
            ['Hellenistische Oudheid', 'De 72 Vertalers (Septuagint)', 'Volgens de Brief van Aristeas koos de hogepriester zes vertalers uit elk van de twaalf stammen — 12 × 6 = 72 — die de Torah in het Grieks vertaalden.', 'Overdracht van Wijsheid'],
            ['Numerologie', 'Oneindige Voltooiing', '8 (Oneindigheid) × 9 (Voltooiing) = 72. Reduceert tot 9 (7+2), het getal van dienstbaarheid.', 'Transformatie & Wedergeboorte'],
            ['Heilige Geometrie', 'De Vijfhoek', '72 graden is de exacte middelpuntshoek van een regelmatige vijfhoek.', 'Goddelijke Architectuur'],
            ['Astronomie', 'Precessie van de equinoxen', 'De zon verplaatst zich elke 72 jaar 1 graad t.o.v. de sterrenbeelden (cyclus van 25.920 jaar).', 'Kosmisch Uurwerk'],
            ['Chinese Mythologie', '72 Transformaties', 'Sun Wukong beheerst 72 Aardse-Demon transformaties voor ultiem aanpassingsvermogen.', 'Controle over Chaos'],
            ['Chinese Filosofie', '72 Discipelen', 'Confucius had 72 kerndiscipelen die zijn werk volledig beheersten.', 'Verspreiding over de Wereld'],
            ['Chinese Mythologie', '72 Grotten', 'De Bloemen-Fruitberg telt 72 grotten, elk met een demonenkoning die eer bewijst.', 'Kosmisch Bestuur'],
            ['Joodse Mystiek', '72 Namen van God', '72 drietallen van Hebreeuwse letters afgeleid uit Exodus, kanalen voor goddelijke transformatie.', 'Goddelijke Architectuur'],
            ['Joodse Mystiek', '72 Engelen', 'De wereld krijgt supervisie van 72 beschermengelen, elk met een specifiek deel van de aarde.', 'Kosmisch Bestuur'],
            ['Westerse Esoterie', 'De 72 Geesten (Ars Goetia)', 'De Ars Goetia somt exact 72 geesten op — bewust gespiegeld aan de 72 engelen van de Shem HaMephorash: licht en schaduw op hetzelfde getal.', 'Kaart van de Schaduw'],
            ['Joodse Mystiek', 'Jakobs ladder', 'De ladder die hemel en aarde verbindt, wordt geïnterpreteerd als hebbende 72 sporten.', 'Verbinding van Werelden'],
            ['Christendom', 'De 72 Discipelen', 'Jezus zendt 72 discipelen uit om zijn leer onder alle naties te verspreiden.', 'Verspreiding over de Wereld'],
            ['Christelijke Mystiek', 'De Wederopstanding', '72 uur vertegenwoordigt de exacte tijd verstreken tussen de kruisiging en de wederopstanding.', 'Transformatie & Wedergeboorte'],
            ['Islamitische Traditie', '72 Metgezellen', 'Imam Hoessein werd vergezeld door 72 volgelingen tijdens de Slag bij Karbala — ultieme toewijding.', 'Opoffering & Toewijding'],
            ['Egyptische Mythologie', 'Het Osiris-complot', '72 samenzweerders spanden samen met Seth om de god Osiris te doden.', 'Transformatie & Wedergeboorte'],
          ],
          en: [
            ['Hellenistic Antiquity', 'The 72 Translators (Septuagint)', 'According to the Letter of Aristeas the high priest chose six translators from each of the twelve tribes — 12 × 6 = 72 — who translated the Torah into Greek.', 'Transmission of Wisdom'],
            ['Numerology', 'Infinite Completion', '8 (Infinity) × 9 (Completion) = 72. Reduces to 9 (7+2), the number of service.', 'Transformation & Rebirth'],
            ['Sacred Geometry', 'The Pentagon', '72 degrees is the exact central angle of a regular pentagon.', 'Divine Architecture'],
            ['Astronomy', 'Precession of the equinoxes', 'The sun shifts 1 degree against the constellations every 72 years (a cycle of 25,920 years).', 'Cosmic Clockwork'],
            ['Chinese Mythology', '72 Transformations', 'Sun Wukong masters 72 Earthly-Demon transformations for ultimate adaptability.', 'Control over Chaos'],
            ['Chinese Philosophy', '72 Disciples', 'Confucius had 72 core disciples who mastered his work completely.', 'Spread across the World'],
            ['Chinese Mythology', '72 Caves', 'The Flower-Fruit Mountain holds 72 caves, each with a demon king who pays homage.', 'Cosmic Governance'],
            ['Jewish Mysticism', '72 Names of God', '72 triads of Hebrew letters derived from Exodus, channels for divine transformation.', 'Divine Architecture'],
            ['Jewish Mysticism', '72 Angels', 'The world is supervised by 72 guardian angels, each with a specific part of the earth.', 'Cosmic Governance'],
            ['Western Esotericism', 'The 72 Spirits (Ars Goetia)', 'The Ars Goetia lists exactly 72 spirits — deliberately mirrored on the 72 angels of the Shem HaMephorash: light and shadow on the same number.', 'Map of the Shadow'],
            ['Jewish Mysticism', "Jacob's ladder", 'The ladder joining heaven and earth is interpreted as having 72 rungs.', 'Joining of Worlds'],
            ['Christianity', 'The 72 Disciples', 'Jesus sends out 72 disciples to spread his teaching among all nations.', 'Spread across the World'],
            ['Christian Mysticism', 'The Resurrection', '72 hours represents the exact time elapsed between the crucifixion and the resurrection.', 'Transformation & Rebirth'],
            ['Islamic Tradition', '72 Companions', 'Imam Hussein was accompanied by 72 followers at the Battle of Karbala — ultimate devotion.', 'Sacrifice & Devotion'],
            ['Egyptian Mythology', 'The Osiris plot', '72 conspirators plotted with Seth to kill the god Osiris.', 'Transformation & Rebirth'],
          ],
        },
      },

      // ── Hoe Het Rapport Ontstaat ──
      ontstaat: {
        title: { nl: 'Hoe Het Rapport Ontstaat', en: 'How the Report Comes About' },
        intro: {
          nl: 'En die map is de aarde van jouw rapport, waarvan er geen twee hetzelfde lezen — niet alleen in inhoud, maar in toon. Taal en structuur worden afgestemd op je dominante netwerk: analytisch en gestructureerd voor CEN, reflectief en associatief voor DMN, direct en responsief voor het Salience Network. Het rapport spreekt, met andere woorden, de taal van het systeem dat het beschrijft.\nWat volgt is geen typebeschrijving uit een printer, maar een hologram die in meerdere stappen uit jouw antwoordprofiel wordt opgebouwd.',
          en: 'And that map is the soil of your report, of which no two read the same — not only in content, but in tone. Language and structure are tuned to your dominant network: analytical and structured for CEN, reflective and associative for DMN, direct and responsive for the Salience Network. In other words, the report speaks the language of the system it describes.\nWhat follows is not a type description off a printer, but a hologram built up out of your answer profile in several steps.',
        },
        s1Lead: { nl: "De geometrische echo's", en: 'The geometric echoes' },
        s1Body: {
          nl: "Na de toetsing berekent het systeem geen rijtje scores maar een gelaagde geometrie. Elke keuze heeft door de vijf kanalen van het wiel gebloed, en dat laat sporen na: schaduwen geworpen naar de tegenpolen, gewicht verschoven naar ondersteunende archetypen, polarisatie tussen wat sterk en wat onderdrukt staat. Deze echo's — niet de kale totalen — vormen de werkelijke vorm die gelezen wordt. Twee mensen met dezelfde top-archetypen kunnen een volstrekt andere geometrie hebben.",
          en: 'After the test the system does not calculate a row of scores but a layered geometry. Every choice has bled through the five channels of the wheel, and that leaves traces: shadows cast towards the opposite poles, weight shifted to supporting archetypes, polarisation between what stands strong and what stands suppressed. These echoes — not the bare totals — form the actual shape that is read. Two people with the same top archetypes can have an entirely different geometry.',
        },
        s2Lead: { nl: 'Main × Support — de relationele lezing', en: 'Main × Support — the relational read' },
        s2Body: {
          nl: 'Je resultaat is geen archetype maar een relatie. Het dominante archetype levert het anker; de resterende, via hen biologische groep, kleuren hoe dit anker zich uitdrukt. Dezelfde Minnaar leest anders met een ordenend support dan met een ontwrichtend support — de gave én de valkuil ontstaan juist in die combinatie, niet in het archetype alleen.\nZo worden twaalf kernen tweeënzeventig configuraties: de relatie is de eenheid van de lezing, niet het etiket.',
          en: 'Your result is not an archetype but a relation. The dominant archetype supplies the anchor; the remainder, through their biological group, colour how that anchor expresses itself. The same Lover reads differently with an ordering support than with a disruptive one — both the gift and the pitfall arise precisely in that combination, not in the archetype alone.\nThat is how twelve cores become seventy-two configurations: the relation is the unit of the read, not the label.',
        },
        s3Lead: { nl: 'De analyse', en: 'The analysis' },
        s3Body: {
          nl: 'Het taalmodel Claude leest dit volledige profiel tegen het complete Deltawerken-framework: de drie bronmodellen, de archetype-profielen, en de tweeënzeventig Extended Archetypes. Is er eigen OCEAN-data aangeleverd, dan wordt die als verdieping geïntegreerd — inclusief, juist op de plekken waar de gemeten persoonlijkheid en de geometrie uiteenlopen.\nDie divergentie wordt niet gladgestreken; ze is vaak het meest verhelderende deel van de lezing.',
          en: 'The language model Claude reads this complete profile against the full Deltawerken framework: the three source models, the archetype profiles, and the seventy-two Extended Archetypes. If your own OCEAN data has been supplied, it is integrated as an added layer — including, and especially, at the points where the measured personality and the geometry diverge.\nThat divergence is not smoothed over; it is often the most illuminating part of the read.',
        },
        s4Lead: { nl: 'De toestand-lezing', en: 'The state read' },
        s4Body: {
          nl: 'Dus, het rapport leest niet alleen wie je bent bij rust, maar hoe je configuratie zich houdt onder druk. Voor elk profiel modelleert het de plastische laag: waar je het sterkst staat, waar je rekt, op welk punt je omslaat, en hoe het herstel verloopt. Dit is wat een statisch type nooit kan tonen — de vorm van je veerkracht, en wat het je kost om overeind te blijven.\n\nWat nu volgt, is precies dat — voor jou.',
          en: 'So the report reads not only who you are at rest, but how your configuration holds up under pressure. For every profile it models the plastic layer: where you stand strongest, where you stretch, at which point you flip, and how recovery unfolds. This is what a static type can never show — the shape of your resilience, and what it costs you to stay upright.\n\nWhat follows now is exactly that — for you.',
        },
      },

      // ── Wetenschappelijke Context ──
      wetenschap: {
        title: { nl: 'Wetenschappelijke Context', en: 'Scientific Context' },
        intro: {
          nl: 'Het Deltawerken Model is een zelfreflectie-instrument, geen klinisch diagnostisch systeem. De neurobiologische termen worden conceptueel ingezet — wetenschappelijk onderzoek als inspiratiebron en denkkader, niet als diagnostische claim.',
          en: 'The Deltawerken Model is a self-reflection instrument, not a clinical diagnostic system. The neurobiological terms are used conceptually — scientific research as a source of inspiration and a frame of thought, not as a diagnostic claim.',
        },
        empiricalTitle: { nl: 'Empirisch fundament', en: 'Empirical foundation' },
        refs: {
          archetypal: { nl: 'Archetypische psychologie', en: 'Archetypal psychology' },
          networks: { nl: 'Neurale netwerken', en: 'Neural networks' },
          dmn: { nl: 'Default Mode & interne simulatie', en: 'Default Mode & internal simulation' },
          predictive: { nl: 'Voorspellend brein', en: 'Predictive brain' },
          dynamics: { nl: 'Netwerkdynamiek & binding', en: 'Network dynamics & binding' },
          entropy: { nl: 'Entropie & herorganisatie', en: 'Entropy & reorganisation' },
          personality: { nl: 'Persoonlijkheidstheorie', en: 'Personality theory' },
          motivation: { nl: 'Motivatie & drijfveer', en: 'Motivation & drive' },
          emotion: { nl: 'Emotie & belichaming', en: 'Emotion & embodiment' },
          perception: { nl: 'Perceptie & hemisferische asymmetrie', en: 'Perception & hemispheric asymmetry' },
          constraint: { nl: 'Beperking & context', en: 'Constraint & context' },
          development: { nl: 'Cognitieve ontwikkeling', en: 'Cognitive development' },
          psychodynamics: { nl: 'Psychodynamiek, empirisch getrieerd', en: 'Psychodynamics, empirically triaged' },
          stress: { nl: 'Stress-neuroplasticiteit', en: 'Stress neuroplasticity' },
          multiscale: { nl: 'Multischaal-biologie', en: 'Multi-scale biology' },
          coregulation: { nl: 'Relationele co-regulatie', en: 'Relational co-regulation' },
          creativity: { nl: 'Creativiteit & neurale integratie', en: 'Creativity & neural integration' },
          consciousness: { nl: 'Bewustzijnstheorie', en: 'Theory of consciousness' },
          oscillatory: { nl: 'Oscillatoir bindingsveld', en: 'Oscillatory binding field' },
          emergence: { nl: 'Emergentie op schaaldrempels', en: 'Emergence at scale thresholds' },
          ontological: { nl: 'Ontologische verankering', en: 'Ontological anchoring' },
        },
        stressSources: {
          nl: 'S. Russo & E. Nestler (2013), Brain reward circuitry in mood disorders, Nat. Rev. Neurosci.; R. Shansky et al. (2009), dendritische hermodellering; R. Duman & G. Aghajanian (2012), Synaptic dysfunction in depression, Science',
          en: 'S. Russo & E. Nestler (2013), Brain reward circuitry in mood disorders, Nat. Rev. Neurosci.; R. Shansky et al. (2009), dendritic remodelling; R. Duman & G. Aghajanian (2012), Synaptic dysfunction in depression, Science',
        },
        frontierNote: {
          nl: 'Theoretische & frontier-ankers — richtinggevend, bewust lichter gewogen; nooit dragend voor een afzonderlijke waarde.',
          en: 'Theoretical & frontier anchors — directional, deliberately weighted more lightly; never load-bearing for any single value.',
        },
        closing: {
          nl: 'Niet elke bron weegt even zwaar. Menon, Friston en de stress-neuroplasticiteit-literatuur dragen het meeste gewicht; de theoretische ankers zijn richtinggevend maar opener, en worden navenant lichter gewogen — nooit als vaststaand fundament behandeld. Volledige bronverantwoording — inclusief waar wij afwijken en wat onze claims zou weerleggen — onder Bronnen & Verantwoording.',
          en: 'Not every source carries the same weight. Menon, Friston and the stress-neuroplasticity literature carry the most; the theoretical anchors are directional but more open-ended, and are weighted correspondingly more lightly — never treated as settled foundation. Full source accountability — including where we depart from the literature and what would refute our claims — under Sources & Accountability.',
        },
      },

      // ── OCEAN page ──
      oceanPage: {
        disclaimerHeavy: {
          nl: 'Er is geen extern OCEAN-rapport geüpload. De lezingen hieronder zijn gehedgde tendensen, gegrond in je geometrie — GEEN gemeten Big Five-scores. Voor een accurate trait-lezing neem je een gevalideerde OCEAN/Big Five-test af.',
          en: 'No external OCEAN report was uploaded. The reads below are hedged tendencies grounded in your geometry — NOT measured Big Five scores. For an accurate trait reading, take a validated OCEAN/Big Five test.',
        },
        disclaimerLight: {
          nl: 'Dit model VERTAALT hoe jouw configuratie elk trait uitdrukt; het meet of certificeert de traits niet. Een accurate trait-lezing vereist een echt OCEAN-instrument.',
          en: 'This model translates how your configuration EXPRESSES each trait; it does not measure or certify the traits themselves. An accurate trait reading requires a real OCEAN instrument.',
        },
        uploadedTableTitle: { nl: 'GEÜPLOADE OCEAN-WAARDEN', en: 'UPLOADED OCEAN VALUES' },
      },

      // ── Plastische Morfologie ──
      morph: {
        caption: {
          nl: 'Hoofd en Support tonen elk de absolute kostencurve van het archetype (0–100). Samengesteld is de gecombineerde belasting, genormaliseerd op zijn eigen piek (=100%) — het toont de VORM binnen jouw configuratie, geen absolute vergelijking, en kan daarom boven de losse lijnen liggen.',
          en: 'Main and Support show each archetype’s absolute cost-curve (0–100). Samengesteld (composed) is the blended load normalised to its own peak (=100%) — it shows the SHAPE within your configuration, not an absolute comparison, so it can sit above the individual lines.',
        },
      },

      // ── Dual-core + radar pages ──
      dualCore: {
        title: { nl: 'Dual-Core Dynamics', en: 'Dual-Core Dynamics' },
      },
      radar: {
        heading: { nl: 'Visuele Analyse — Triple Network Wiel', en: 'Visual Analysis — Triple Network Wheel' },
      },
      groepDyn: {
        heading: {
          nl: 'Groep Dynamiek — Neurobiologische Interpretatie',
          en: 'Group Dynamics — Neurobiological Interpretation',
        },
      },

      // ── AI prompt page ──
      prompt: {
        heading: { nl: 'De volledige AI prompt', en: 'The complete AI prompt' },
        tip: {
          nl: 'Kopieer deze prompt en configureer je ai agent. Voeg de PDF toe als bijlage voor de beste sparringspartner.',
          en: 'Copy this prompt and configure your AI agent. Attach the PDF for the sharpest sparring partner.',
        },
        // Deterministic fallback prompt (used when the model omits its own).
        fallbackCoreName: { nl: 'mijn Kern', en: 'my Core' },
        fallbackSupportName: { nl: 'mijn Support', en: 'my Support' },
        fallbackShadowName: { nl: 'mijn Schaduw', en: 'my Shadow' },
        fallbackBlindspotName: { nl: 'mijn Blindspot', en: 'my Blindspot' },
        fallbackIntro: {
          nl: (ext) => `Je bent mijn persoonlijke reflectie-sparringspartner, afgestemd op mijn Garden For Life Deltawerken-configuratie${ext ? ` (${ext})` : ''}.`,
          en: (ext) => `You are my personal reflection sparring partner, tuned to my Garden For Life Deltawerken configuration${ext ? ` (${ext})` : ''}.`,
        },
        fallbackConfigHeading: { nl: '**Mijn configuratie**', en: '**My configuration**' },
        fallbackCoreLine: {
          nl: (mn) => `- Kern (Main): ${mn}`,
          en: (mn) => `- Core (Main): ${mn}`,
        },
        fallbackSupportLine: {
          nl: (sn) => `- Support: ${sn}`,
          en: (sn) => `- Support: ${sn}`,
        },
        fallbackShadowLine: {
          nl: (shn) => `- Schaduw (180° tegenpool): ${shn}`,
          en: (shn) => `- Shadow (180° opposite): ${shn}`,
        },
        fallbackBlindspotLine: {
          nl: (bn) => `- Blindspot (Rode Lijn): ${bn}`,
          en: (bn) => `- Blindspot (Red Line): ${bn}`,
        },
        fallbackToneHeading: { nl: '**Toon & aanpak**', en: '**Tone & approach**' },
        fallbackToneBody: {
          nl: (mn, sn, shn, bn) => `Spreek mij aan vanuit mijn Kern (${mn}) en ondersteun met de kwaliteiten van mijn Support (${sn}). Daag mijn Schaduw (${shn}) en Blindspot (${bn}) respectvol uit zodra ik in oude patronen verval. Wees direct maar warm; spiegel mij, stuur mij niet.`,
          en: (mn, sn, shn, bn) => `Address me from my Core (${mn}) and support that with the qualities of my Support (${sn}). Challenge my Shadow (${shn}) and Blindspot (${bn}) respectfully the moment I fall back into old patterns. Be direct but warm; mirror me, do not steer me.`,
        },
        fallbackUseHeading: { nl: '**Gebruik**', en: '**Use**' },
        fallbackUseBody: {
          nl: 'Voeg het volledige PDF-rapport toe als context voor de scherpste sparringspartner. Stel telkens één gerichte vraag die mij een stap verder brengt in mijn vernieuwde landschap.',
          en: 'Attach the full PDF report as context for the sharpest sparring partner. Ask one focused question at a time that moves me a step further into my renewed landscape.',
        },
      },

      // ── Footer + closing letter ──
      footer: {
        brand: { nl: 'Garden for Life  •  Archetype Analyse', en: 'Garden for Life  •  Archetype Analysis' },
        score: {
          nl: (total, max) => `Score: ${total} / ${max}`,
          en: (total, max) => `Score: ${total} / ${max}`,
        },
        generatedOn: {
          nl: (date) => `Gegenereerd op ${date}`,
          en: (date) => `Generated on ${date}`,
        },
      },
      closing: {
        l1: { nl: 'Hoogachtende Leerling,', en: 'Esteemed Student,' },
        l2: {
          nl: 'Jouw feedback is uiterst waardevol en in principe is dit jouw gift aan ons project, toch kan ik mijn gretigheid niet bedwingen en reik ik nog één laatste keer uit voor jouw hulp.',
          en: 'Your feedback is extremely valuable and is in principle your gift to our project; even so I cannot contain my eagerness, and I reach out one last time for your help.',
        },
        l3: {
          nl: 'Nodig iedereen uit waarvan je denkt dat ze in staat zijn om het onderzoek volledig te doorlopen, hoe meer data hoe beter wij kunnen optimaliseren.',
          en: 'Invite everyone you believe is able to complete the whole survey; the more data we have, the better we can optimise.',
        },
        l4: {
          nl: 'Zolang de beta-fase loopt is alleen het leerling niveau toegankelijk.',
          en: 'While the beta phase is running, only the student level is accessible.',
        },
        l4b: {
          nl: 'Een donatie is optioneel, maar is meer dan welkom en is directe voeding voor ons project! =)',
          en: 'A donation is optional, but more than welcome, and is direct nourishment for our project! =)',
        },
        l5: {
          nl: 'Anyway- pionier, hartelijk dank voor de tijd en attentie!',
          en: 'Anyway- pioneer, many thanks for your time and attention!',
        },
      },

      // ── Machine-readable PROFIEL DATA block ──
      data: {
        title: { nl: 'PROFIEL DATA VOOR AI VERWERKING', en: 'PROFILE DATA FOR AI PROCESSING' },
        introLine1: {
          nl: 'Deze sectie is machineleesbaar en bedoeld als primaire databron',
          en: 'This section is machine-readable and intended as the primary data source',
        },
        introLine2: {
          nl: 'voor externe AI-agents. Upload het volledige rapport als bijlage.',
          en: 'for external AI agents. Upload the full report as an attachment.',
        },
        orbSection: { nl: 'ORB-SIGNATUUR (LOGIN-CODE)', en: 'ORB SIGNATURE (LOGIN CODE)' },

        identitySection: { nl: 'IDENTITEIT', en: 'IDENTITY' },
        extendedArchetype: { nl: 'Extended Archetype', en: 'Extended Archetype' },
        main: { nl: 'Main', en: 'Main' },
        group: { nl: 'Groep', en: 'Group' },
        network: { nl: 'Netwerk', en: 'Network' },
        support: { nl: 'Support', en: 'Support' },
        shadow: { nl: 'Shadow', en: 'Shadow' },
        blindspot: { nl: 'Blindspot', en: 'Blindspot' },
        shadowNote: { nl: '180 tegenpool van Main', en: '180 opposite of Main' },
        blindspotNote: { nl: 'Rode Lijn van Main', en: 'Red Line of Main' },
        harmonyMatch: { nl: 'Harmony Match', en: 'Harmony Match' },
        yes: { nl: 'Ja', en: 'Yes' },
        no: { nl: 'Nee', en: 'No' },

        scoresSection: { nl: 'SCORES (12-PUNTS WIEL)', en: 'SCORES (12-POINT WHEEL)' },
        basketSection: { nl: '5-MANDJE DECOMPOSITIE', en: '5-BASKET DECOMPOSITION' },
        natCultSection: { nl: 'NATURE / CULTURE VERDELING PER GROEP', en: 'NATURE / CULTURE DISTRIBUTION PER GROUP' },

        indicesSection: { nl: 'AFGELEIDE INDICES', en: 'DERIVED INDICES' },
        authenticityIndex: {
          nl: (nat, pct) => `Authenticity Index: ${nat}/72 Nature (${pct}%)`,
          en: (nat, pct) => `Authenticity Index: ${nat}/72 Nature (${pct}%)`,
        },
        polarizationIndex: {
          nl: (mainTot, shadTot, gap, cat) => `Polarization Index: ${mainTot} (Main) - ${shadTot} (Shadow) = gap ${gap}% -> ${cat}`,
          en: (mainTot, shadTot, gap, cat) => `Polarization Index: ${mainTot} (Main) - ${shadTot} (Shadow) = gap ${gap}% -> ${cat}`,
        },
        totalDatapoints: {
          nl: (total) => `Totaal Deltawerken Datapunten: ${total} / 792`,
          en: (total) => `Total Deltawerken Data Points: ${total} / 792`,
        },
        polHigh: { nl: 'Hoge Polarisatie', en: 'High Polarisation' },
        polMid: { nl: 'Matig', en: 'Moderate' },
        polLow: { nl: 'Hoge Individuatie', en: 'High Individuation' },

        oceanSection: { nl: 'OCEAN PROFIEL (EXTERN GEUPLOAD)', en: 'OCEAN PROFILE (EXTERNALLY UPLOADED)' },
        oceanO: { nl: 'Openheid:', en: 'Openness:' },
        oceanC: { nl: 'Ordelijkheid:', en: 'Conscientiousness:' },
        oceanE: { nl: 'Extraversie:', en: 'Extraversion:' },
        oceanA: { nl: 'Meegaandheid:', en: 'Agreeableness:' },
        oceanN: { nl: 'Neuroticisme:', en: 'Neuroticism:' },

        cogSection: { nl: 'COGNITIEVE DRIEHOEK (YELLOW)', en: 'COGNITIVE TRIANGLE (YELLOW)' },
        activeTriangle: {
          nl: (mode, id) => `Actieve Driehoek: ${mode} (Driehoek ${id})`,
          en: (mode, id) => `Active Triangle: ${mode} (Triangle ${id})`,
        },
        partners: { nl: 'Partners', en: 'Partners' },
        networks: { nl: 'Netwerken', en: 'Networks' },
        superpower: { nl: 'Superkracht', en: 'Superpower' },
        cognitiveTrap: { nl: 'Cognitieve Val', en: 'Cognitive Trap' },
        seeAnalysis: { nl: 'Zie analyse', en: 'See analysis' },
        growthDirection: {
          nl: (mode, id) => `Groeirichting: ${mode} (Driehoek ${id})`,
          en: (mode, id) => `Growth Direction: ${mode} (Triangle ${id})`,
        },
        triangleUnavailable: { nl: 'Driehoekdata niet beschikbaar.', en: 'Triangle data unavailable.' },

        hardwareSection: { nl: 'HARDWARE SIGNALEN', en: 'HARDWARE SIGNALS' },
        strongestGroup: {
          nl: (group, score) => `Sterkste Groep: ${group} (${score})`,
          en: (group, score) => `Strongest Group: ${group} (${score})`,
        },
        hardwareResonance: { nl: 'Hardware Resonantie', en: 'Hardware Resonance' },
        cultureForceSignal: { nl: 'CultureForce Signaal', en: 'CultureForce Signal' },
        hwBoth: {
          nl: (group, a, b, avg) => `Beide leden van ${group} zijn verhoogd (${a} + ${b} > gem. ${avg})`,
          en: (group, a, b, avg) => `Both members of ${group} are elevated (${a} + ${b} > avg. ${avg})`,
        },
        hwSingle: {
          nl: (group) => `${group} groep heeft de hoogste concentratie`,
          en: (group) => `The ${group} group has the highest concentration`,
        },
        cfActive: {
          nl: (pts, mode) => `Yellow bleed actief (${pts}pt) via cognitieve driehoek ${mode}`,
          en: (pts, mode) => `Yellow bleed active (${pts}pt) via cognitive triangle ${mode}`,
        },
        cfLow: {
          nl: (pts) => `Lage cognitieve driehoek activatie (${pts}pt)`,
          en: (pts) => `Low cognitive triangle activation (${pts}pt)`,
        },

        extendedSection: { nl: 'EXTENDED ARCHETYPE PROFIEL', en: 'EXTENDED ARCHETYPE PROFILE' },
        gift: { nl: 'Gift', en: 'Gift' },
        curse: { nl: 'Curse / Trigger', en: 'Curse / Trigger' },
        levensles: { nl: 'Levensles', en: 'Life lesson' },

        kaartSection: { nl: 'KAART MICROCOPY', en: 'CARD MICROCOPY' },

        shadowSection: { nl: 'SHADOW INTEGRATIE', en: 'SHADOW INTEGRATION' },
        shadowArchetype: { nl: 'Shadow Archetype', en: 'Shadow Archetype' },
        integrationPath: { nl: 'Integration Path', en: 'Integration Path' },
        blindspotSection: { nl: 'BLINDSPOT', en: 'BLINDSPOT' },
        blindspotArchetype: { nl: 'Blindspot Archetype', en: 'Blindspot Archetype' },
        coreBehaviour: { nl: 'Kerngedrag', en: 'Core behaviour' },
        seeAiSection: { nl: 'Zie AI analyse sectie', en: 'See AI analysis section' },
        notAvailable: { nl: 'N/A', en: 'N/A' },

        outroLine1: {
          nl: 'Dit blok is automatisch gegenereerd door het Garden For Life',
          en: 'This block was generated automatically by the Garden For Life',
        },
        outroLine2: {
          nl: 'Assessment System. Het Deltawerken-framework is een conceptueel',
          en: 'Assessment System. The Deltawerken framework is a conceptual',
        },
        outroLine3: {
          nl: 'zelfreflectiemodel, geen klinisch diagnostisch systeem.',
          en: 'self-reflection model, not a clinical diagnostic system.',
        },
      },
    },
  },
};
