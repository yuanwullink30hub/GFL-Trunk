/**
 * Biochemical & Neuro-Integration Deep Dive
 *
 * For each of the 12 archetypes this module provides:
 *   - biochemicalCore   : Stress response & HPA-axis pattern
 *   - gifts             : Neural super-power + tech multiplier
 *   - curses            : Paradoxical shadow + tech multiplier
 *   - integrationPath   : Shadow alchemy, tactical levers & resultant archetype
 *
 * Archetype wheel positions:
 *   1=Judge  2=Lover  3=Caregiver  4=Innocent
 *   5=Explorer  6=Outlaw  7=Trickster  8=Sage
 *   9=Artist  10=Magician  11=Hero  12=Ruler
 */

export const BIOCHEMICAL_PROFILES = {

  // ─── 1. The Judge (De Rechter) ───────────────────────────────────────
  JUDGE: {
    key: 'JUDGE',
    position: 1,
    name: 'De Rechter',
    nameEn: 'The Judge',
    biochemicalCore:
      'De Rechter verwerkt stress met onthechte precisie: cortisol blijft uiterlijk laag via sterke HPA-onderdrukking, waarbij spanning wordt gekanaliseerd in objectieve evaluatie (mentaal onrecht auditen). Dit toont zich als kalme oordelen, maar interne spanning bouwt zwaar op als structurele autoriteit of rechtvaardigheid ontbreekt.',
    gifts: {
      description: 'Onevenaarbare integriteit: Hoge conscientiousness en serotonine-gedreven stabiliteit maken vlijmscherpe morele weging mogelijk. PFC-CEN koppeling ondersteunt objectieve audits.',
      techMultiplier: 'Compliance- en AI-audittools versterken de weging: real-time data-analyse verhoogt serotonine, wat massale ethische controle en onbevooroordeelde handhaving toelaat.',
    },
    curses: {
      description: 'Koude Onthechting & Rigiditeit: Lage agreeableness en ongecontroleerde serotonine leiden tot overkritische oordelen en emotionele onderdrukking (gebrek aan DMN flexibiliteit).',
      techMultiplier: 'Algoritmische scoresystemen intensiveren rigiditeit via geautomatiseerde oordelen; eindeloze digitale ledgers verergeren cortisol-spanning als nuance ontbreekt.',
    },
    integrationPath: {
      shadowArchetype: 'ARTIST',
      shadowName: 'The Artist',
      alchemy: 'De Artist injecteert subjectieve visie en DMN-herverbinding. Het verzacht CEN-objectiviteit met limbische creativiteit en een \'contextuele ziel\'.',
      tacticalLevers: [
        'Genade-rituelen (emotionele context meewegen)',
        'Esthetische reframing van rechtvaardigheid',
        'Imperfectie toestaan in systemen',
      ],
      resultArchetype: 'The Arbiter',
      resultDescription: 'Onbevooroordeeld leiderschap met flexibele genade en menselijkheid.',
    },
  },

  // ─── 2. The Lover (De Minnaar) ──────────────────────────────────────
  LOVER: {
    key: 'LOVER',
    position: 2,
    name: 'De Minnaar',
    nameEn: 'The Lover',
    biochemicalCore:
      'De Lover reageert intens op relationele bedreigingen: cortisol piekt door snelle HPA-activatie bij waargenomen disconnectie (zoals een vertraagd appje). Dit voedt angstige monitoring, codependentie en emotionele fusie, waarbij het limbische systeem de prefrontale regulatie volledig overspoelt.',
    gifts: {
      description: 'Onbegrensde empathie: Hoge oxytocine en serotonine maken diepe emotionele resonantie en binding mogelijk.',
      techMultiplier: 'Dating- en social apps versterken verbindingen; algoritmes die resoneren zorgen voor directe oxytocine/dopamine pieken op grote schaal.',
    },
    curses: {
      description: 'Codependency & Identiteitsverlies: Neuroticisme en oxytocine-overload leiden tot verlatingsangst en het opgeven van het eigen \'ik\' om harmonie te bewaren.',
      techMultiplier: 'Tracking-functies en social feeds intensiveren jaloezie door constante vergelijking en voeden codependente illusies.',
    },
    integrationPath: {
      shadowArchetype: 'MAGICIAN',
      shadowName: 'The Magician',
      alchemy: 'De Magician kanaliseert rauwe emotie in intentionele alchemie. Het introduceert dopamine via visionaire verandering en heractiveert het DMN voor objectieve evaluatie.',
      tacticalLevers: [
        'Mindful reframing (gevoelens vertalen naar acties)',
        'Grenzen stellen',
        'Creatieve uitlaatkleppen vinden',
      ],
      resultArchetype: 'The Soulmate',
      resultDescription: 'Diepe verbinding met behoud van gezonde onafhankelijkheid.',
    },
  },

  // ─── 3. The Caregiver (De Verzorger) ────────────────────────────────
  CAREGIVER: {
    key: 'CAREGIVER',
    position: 3,
    name: 'De Verzorger',
    nameEn: 'The Caregiver',
    biochemicalCore:
      'De Verzorger internaliseert collectieve pijn: cortisol bouwt zich geleidelijk op via aanhoudende HPA-activatie door empathie-overload. Dit uit zich in dwangmatig helpen om dreigingen (pijn van anderen) te mitigeren, maar chronische verhoging resulteert in een martelaars-freeze wanneer eigen behoeften genegeerd worden.',
    gifts: {
      description: 'Grenzeloze gulheid: Hoge oxytocine en serotonine maken diepe empathie en beschermend scannen mogelijk. Limbische-DMN koppeling ondersteunt interpersoonlijke voeding.',
      techMultiplier: 'Gezondheids- en tracking-apps versterken de zorg. Real-time monitoring verhoogt oxytocine-bindingen en maakt gestructureerde genezing op schaal mogelijk.',
    },
    curses: {
      description: 'Martelaarschap & Enabling: Hoog neuroticisme en oxytocine-overload negeren zelfzorg. Serotonine-ontregeling door chronisch geven versterkt geïnternaliseerde wrok en burn-out.',
      techMultiplier: 'Constante connectiviteit (social alerts, telehealth) intensiveert het \'enablen\'. Algoritmische schuldgevoel-feeds verergeren neurotische vermoeidheid en zelfopoffering.',
    },
    integrationPath: {
      shadowArchetype: 'HERO',
      shadowName: 'The Hero',
      alchemy: 'De Hero doet testosteron-gedreven grenzen gelden, wat oxytocine moduleert met het CEN voor zelfbepaalde actie en herstel.',
      tacticalLevers: [
        'Grenzen stellen (ferme "nee" rituelen)',
        'Het kanaliseren van zorg in een zelf-fort',
        'Vechten voor de eigen behoeften',
      ],
      resultArchetype: 'The Healer',
      resultDescription: 'Voedende liefde gecombineerd met krachtige, persoonlijke grenzen.',
    },
  },

  // ─── 4. The Innocent (De Onschuldige) ───────────────────────────────
  INNOCENT: {
    key: 'INNOCENT',
    position: 4,
    name: 'De Onschuldige',
    nameEn: 'The Innocent',
    biochemicalCore:
      'De Onschuldige absorbeert stress met veerkrachtige ontkenning: cortisol blijft laag via een gebufferde HPA-as, waardoor vertrouwen behouden blijft door dreigingssignalen te onderdrukken of te reframen. Dit toont zich als onwankelbare hoop, maar de kwetsbaarheid piekt gewelddadig wanneer het "paradijs" verbrijzelt, wat leidt tot een slachtoffer-freeze of dissociatie.',
    gifts: {
      description: 'Absolute hoop: Hoge oxytocine en serotonine voeden absoluut vertrouwen en een moreel kompas. DMN-koppeling met beloningscircuits maakt veerkrachtig zoeken naar het paradijs mogelijk.',
      techMultiplier: 'Sociale platforms en VR-werelden versterken het paradijs. Gecureerde positiviteit verhoogt oxytocine, wat wereldwijde hoop op schaal mogelijk maakt.',
    },
    curses: {
      description: 'Naïviteit & Slachtofferrol: Laag neuroticisme en serotonine-oververtrouwen negeren reële dreigingen. Oxytocine-dominantie onderdrukt adaptieve waakzaamheid.',
      techMultiplier: 'Algoritmische bubbels verdiepen de naïviteit via gefilterde realiteiten; misinformatie buit het vertrouwen uit en veroorzaakt zware cortisol-crashes als de illusie breekt.',
    },
    integrationPath: {
      shadowArchetype: 'EXPLORER',
      shadowName: 'The Explorer',
      alchemy: 'De Explorer ontsteekt avontuurlijke dopamine en herconfigureert netwerken, waarbij het DMN wordt uitgebreid met het Salience Network voor risicotolerante groei.',
      tacticalLevers: [
        'Nieuwsgierigheidsrituelen',
        'Het bewust verlaten van veiligheidsnetten',
        'Externe ontdekkingstochten',
      ],
      resultArchetype: 'The Pioneer',
      resultDescription: 'Onschuldig geloof gecombineerd met veerkrachtige actie en onafhankelijkheid.',
    },
  },

  // ─── 5. The Explorer (De Ontdekker) ─────────────────────────────────
  EXPLORER: {
    key: 'EXPLORER',
    position: 5,
    name: 'De Ontdekker',
    nameEn: 'The Explorer',
    biochemicalCore:
      'De Explorer kanaliseert stress in beweging: cortisol stijgt via HPA-arousal, wat externe risico\'s en het verleggen van grenzen aanjaagt (bijv. vluchten naar het onbekende om ongemak te vermijden). Dit uit zich in koortsachtig avontuur, maar chronische verhoging leidt tot doelloos dwalen of isolatie-freeze wanneer de nieuwheid is uitgeput.',
    gifts: {
      description: 'Diepe nieuwsgierigheid: Extreem hoge Openness via de dopamine-noradrenaline nieuwigheidsdrang; DMN-Salience koppeling maakt grensverleggende ontdekkingen mogelijk.',
      techMultiplier: 'Mapping- en AR-apps versterken ontdekking: real-time exploratie geeft dopamine-hits, wat massale navigatie voorbij bekende grenzen faciliteert.',
    },
    curses: {
      description: 'Rusteloosheid & Isolatie: Lage conscientiousness en dopamine-verslaving aan verandering creëren doelloze drift. Noradrenaline-overdrive onderdrukt aarding.',
      techMultiplier: 'Eindeloze feeds en virtuele quests voeden rusteloosheid. Algoritmische paden verdiepen het vermijdingsgedrag en de cortisol-gedreven ontkoppeling van de realiteit.',
    },
    integrationPath: {
      shadowArchetype: 'INNOCENT',
      shadowName: 'The Innocent',
      alchemy: 'De Onschuldige biedt oxytocine-serotonine \'thuiskomst\', wat de dopamine-exploratie aardt met DMN-herverbinding voor morele stabiliteit.',
      tacticalLevers: [
        'Vertrouwensrituelen (veilige terugkeer naar een basis)',
        'Wonder-oefeningen',
        'Het verankeren van avonturen in hoop',
      ],
      resultArchetype: 'The Enlightened',
      resultDescription: 'Spirituele ontdekking gecombineerd met stabiele verwondering en een "thuis".',
    },
  },

  // ─── 6. The Outlaw (De Rebel) ───────────────────────────────────────
  OUTLAW: {
    key: 'OUTLAW',
    position: 6,
    name: 'De Rebel',
    nameEn: 'The Outlaw',
    biochemicalCore:
      'De Rebel externaliseert stress agressief: cortisol barst los via HPA-hyperactivatie, wat rebellie of systeem-afbrekende acties voedt. Dit toont zich als moedige waarheidsvinding, maar ongecontroleerde pieken leiden tot destructieve explosies of cynische terugtrekking. Salience Network-dominantie riskeert DMN-ontkoppeling en burn-out door vervreemding.',
    gifts: {
      description: 'Achteloze authenticiteit: Hoge dopamine en testosteron maken instinctieve weerstand mogelijk. Noradrenaline beloont het ontmantelen van corruptie.',
      techMultiplier: 'Activisme-platforms versterken de bevrijding: virale tools geven dopamine voor collectieve weerstand en schalen waarheidsvinding wereldwijd.',
    },
    curses: {
      description: 'Destructiviteit & Cynisme: Hoog neuroticisme en testosteron-overdrive creëren zinloze ruïnes. De dopamine-verslaving aan rebellie onderdrukt het opbouwen van iets nieuws.',
      techMultiplier: 'Echo-kamers intensiveren cynisme via algoritmische verontwaardiging; anonieme tools faciliteren vandalisme, wat cortisol-gedreven rebellie zonder doel verergert.',
    },
    integrationPath: {
      shadowArchetype: 'RULER',
      shadowName: 'The Ruler',
      alchemy: 'De Heerser biedt serotonine-gestructureerde autoriteit, wat de dopamine-rebellie tempert met CEN-herverbinding voor functionele opbouw.',
      tacticalLevers: [
        'Bestuursrituelen (bouwen na het breken)',
        'Verantwoordelijkheid nemen post-revolutie',
        'Het kanaliseren van bevrijding in orde',
      ],
      resultArchetype: 'The Legend',
      resultDescription: 'Rechtvaardige rebellie met loyale bescherming en duurzame structuur.',
    },
  },

  // ─── 7. The Trickster (De Nar) ──────────────────────────────────────
  TRICKSTER: {
    key: 'TRICKSTER',
    position: 7,
    name: 'De Nar',
    nameEn: 'The Trickster',
    biochemicalCore:
      'De Nar buigt stress af door disruptie: cortisol wordt razendsnel ontladen via speelse HPA-modulatie, wat angst omzet in spot of chaos. Dit lijkt op moeiteloze luchtigheid, maar chronische maskering leidt tot een verborgen opbouw en uiteindelijk een "sad clown" ineenstorting als kwetsbaarheid onvermijdelijk wordt.',
    gifts: {
      description: 'Onbedwingbare speelsheid: Hoge Openness via dopamine-gedreven absurditeit en serotonine-gemoduleerde relativiteit. DMN-Salience koppeling maakt creatieve disruptie mogelijk.',
      techMultiplier: 'Memes en virale comedy versterken de disruptie. Instant feedback loops geven enorme dopamine-pieken, waardoor ego\'s wereldwijd worden doorgeprikt.',
    },
    curses: {
      description: 'Irresponsibiliteit & Wreedheid: Lage conscientiousness en dopamine-drang naar chaos creëren oppervlakkige of kwetsende spot. Verborgen neuroticisme onderdrukt echte kwetsbaarheid.',
      techMultiplier: 'Anonimiteit en virale algoritmes intensiveren wreedheid zonder consequenties; eindeloos scrollen verergert de "sad clown" paradox in digitale performances.',
    },
    integrationPath: {
      shadowArchetype: 'SAGE',
      shadowName: 'The Sage',
      alchemy: 'De Sage ankert met prefrontale serotonine-diepte en DMN-herverbinding. Het aardt de dopamine-chaos met zinvolle observatie en waarheidsvinding.',
      tacticalLevers: [
        'Diepte-rituelen (reflectieve pauzes na grappen)',
        'Waarheids-oefeningen (humor die onthult in plaats van afleidt)',
      ],
      resultArchetype: 'The Comedian',
      resultDescription: 'Een satirische waarheidsspreker met intellectuele aarding en oprechte diepgang.',
    },
  },

  // ─── 8. The Sage (De Wijze) ─────────────────────────────────────────
  SAGE: {
    key: 'SAGE',
    position: 8,
    name: 'De Wijze',
    nameEn: 'The Sage',
    biochemicalCore:
      'De Sage internaliseert stress: cortisol stijgt geruisloos via de HPA-as, wat leidt tot intense hyperactiviteit in het Default Mode Network (DMN). Ze bevriezen in een staat van "paralysis-by-analysis", waarbij ze eindeloos variabelen herberekenen om intellectuele controle terug te krijgen, terwijl ze er naar buiten toe angstaanjagend kalm uitzien.',
    gifts: {
      description: 'Glashelder inzicht: Prefrontale dopamine en gebalanceerde serotonine zorgen voor superieure patroonherkenning en inzicht.',
      techMultiplier: 'Digitale tools (AI, data platforms) fungeren als een supercharger voor hun inzicht, waardoor ze patronen op een ongekende schaal kunnen detecteren.',
    },
    curses: {
      description: 'Dogmatisme & Kilte: Lage oxytocine en prefrontale dominantie onderdrukken limbische warmte, wat leidt tot emotionele kilte.',
      techMultiplier: 'Eindeloos scrollen overbelast hun dopamine-zoektocht zonder afsluiting, wat leidt tot chronische cortisol-opbouw en "echo chambers" die hun dogmatisme versterken.',
    },
    integrationPath: {
      shadowArchetype: 'TRICKSTER',
      shadowName: 'The Trickster',
      alchemy: 'De Trickster levert speelse dopamine-bursts en desegregatie van het DMN via absurditeit en humor. Dit breekt de eindeloze analyse-loop.',
      tacticalLevers: [
        'Bewuste absurditeit',
        'Fysieke humor',
        'Offline speelsheid om onzekerheid te leren tolereren',
      ],
      resultArchetype: 'The Enlightened Sage',
      resultDescription: 'Enlightened wisdom die levendig en relationeel is.',
    },
  },

  // ─── 9. The Artist (De Kunstenaar) ──────────────────────────────────
  ARTIST: {
    key: 'ARTIST',
    position: 9,
    name: 'De Kunstenaar',
    nameEn: 'The Artist',
    biochemicalCore:
      'De Kunstenaar ervaart stress als rauwe, versterkte zintuiglijke input. Cortisol piekt via HPA-limbische activatie en kanaliseert turbulentie in creatieve sublimatie of puur escapisme. Het DMN is hyperactief, wat leidt tot visionaire uitbarstingen, maar ook het risico op dissociatie en verlammend perfectionisme met zich meebrengt.',
    gifts: {
      description: 'Pure schepping: Extreem hoge Openness via dopamine-gedreven nieuwsgierigheid en DMN-PFC koppeling stelt hen in staat schoonheid uit chaos te scheppen.',
      techMultiplier: 'Digitale canvassen (AI-art, VR) versnellen manifestatie. Snelle iteratie zorgt voor dopamine-pieken en grensverleggende creaties op schaal.',
    },
    curses: {
      description: 'Perfectionisme & Escapisme: Hoog neuroticisme en serotonine-ontregeling leiden tot obsessieve aanpassingen en het vermijden van de realiteit.',
      techMultiplier: 'Algoritmische feedback (likes, AI-kritiek) versterkt perfectionisme, terwijl eindeloze digitale tools het vluchten in virtuele werelden faciliteren.',
    },
    integrationPath: {
      shadowArchetype: 'JUDGE',
      shadowName: 'The Judge',
      alchemy: 'De Rechter brengt objectieve structuur: introduceert serotonine voor maatvoering en prefrontale dopamine voor evaluatie, wat het DMN aardt.',
      tacticalLevers: [
        'Deadline-rituelen',
        'Objectieve zelf-audits',
        'Het integreren van eerlijkheid in hun visioenen om de serotonine-dopamine balans te herstellen',
      ],
      resultArchetype: 'The Warlock',
      resultDescription: 'Tastbare, ethische en gestructureerde transformaties.',
    },
  },

  // ─── 10. The Magician (De Magiër) ───────────────────────────────────
  MAGICIAN: {
    key: 'MAGICIAN',
    position: 10,
    name: 'De Magiër',
    nameEn: 'The Magician',
    biochemicalCore:
      'De Magiër reframed stress alchemistisch: cortisol wordt uiterlijk geminimaliseerd via HPA-modulatie door dreigingen te zien als transformeerbare energie. Dit manifesteert zich als visionaire kalmte, maar confrontaties met onveranderlijke realiteiten (zoals de dood) triggeren een diepe, interne ineenstorting.',
    gifts: {
      description: 'Machtige manifestatie: Hoge Openness via dopamine-wilskracht voor realiteitsverandering. DMN-PFC koppeling maakt energetische manifestatie mogelijk.',
      techMultiplier: 'AI en simulatieplatformen versterken de alchemie. Code-gebaseerde tools geven dopamine door directe manifestaties en schaalbare paradigmaverschuivingen.',
    },
    curses: {
      description: 'Manipulatie & Arrogantie: Lage agreeableness en ongecontroleerde dopamine kweken een god-complex. Laag uiterlijk neuroticisme onderdrukt materiële aarding.',
      techMultiplier: 'Digitale interfaces verdiepen arrogantie via gesimuleerde controle. Algoritmische onthechting verergert manipulatie en neurotische ineenstorting als virtuele realiteiten falen.',
    },
    integrationPath: {
      shadowArchetype: 'LOVER',
      shadowName: 'The Lover',
      alchemy: 'De Lover aardt met oxytocine-acceptatie. Het verzacht DMN-innovatie met limbische herverbinding voor niet-manipulatieve resonantie.',
      tacticalLevers: [
        'Intimiteitsrituelen (stoppen met veranderen, gewoon verbinden)',
        'Empathie-oefeningen (accepteren "zoals het is")',
      ],
      resultArchetype: 'The Enchanter',
      resultDescription: 'Emotionele transformaties geworteld in veilige, onvoorwaardelijke banden.',
    },
  },

  // ─── 11. The Hero (De Held) ─────────────────────────────────────────
  HERO: {
    key: 'HERO',
    position: 11,
    name: 'De Held',
    nameEn: 'The Hero',
    biochemicalCore:
      'De Hero onderdrukt stress naar buiten toe: cortisol wordt agressief gedownreguleerd via de HPA-as en gekanaliseerd in besluitvaardige actie. Ze zetten angst om in brandstof, maar omzeilen bewuste verwerking. Het Central Executive Network (CEN) overrulet DMN en limbische input, wat op korte termijn veerkracht biedt, maar op lange termijn leidt tot catastrofale burn-out.',
    gifts: {
      description: 'Onmeetbare kracht: Hoge testosteron en dopamine-surges maken extreme wilskracht en prestatie onder druk mogelijk.',
      techMultiplier: 'Productiviteitsapps en metrics geven constante dopamine-hits, wat leidt tot bovenmenselijke discipline en schaalbare systeemverbeteringen.',
    },
    curses: {
      description: 'Arrogantie & Burn-out: Ongecontroleerd testosteron en dopamine-drang naar dominantie onderdrukken empathie. Ze negeren signalen van uitputting volledig.',
      techMultiplier: '24/7 connectiviteit overbelast noradrenaline zonder rust. Algoritmes versterken de "onkwetsbaarheidsmythe", wat emotionele onderdrukking verergert.',
    },
    integrationPath: {
      shadowArchetype: 'CAREGIVER',
      shadowName: 'The Caregiver',
      alchemy: 'De Caregiver introduceert oxytocine-gedreven empathie, wat de CEN-dominantie verzacht met limbische herverbinding en ruimte voor kwetsbaarheid.',
      tacticalLevers: [
        'Bewuste zelfzorg-rituelen',
        'Kwetsbaarheidsoefeningen',
        'Het koesteren van anderen om de testosteron-cortisol balans te resetten',
      ],
      resultArchetype: 'The Legend',
      resultDescription: 'Moedige rechtvaardigheid gecombineerd met diepe compassie.',
    },
  },

  // ─── 12. The Ruler (De Heerser) ─────────────────────────────────────
  RULER: {
    key: 'RULER',
    position: 12,
    name: 'De Heerser',
    nameEn: 'The Ruler',
    biochemicalCore:
      'De Heerser handhaaft uiterlijke kalmte onder druk: cortisol wordt strak gereguleerd via HPA-onderdrukking, waarbij angst wordt omgeleid naar hiërarchische controle en de verdeling van middelen. Dit lijkt op onverstoorbare autoriteit, maar chronische opbouw uit zich in obsessief micromanagement of tirannieke uitbarstingen als de controle wegglipt. CEN-dominantie overrulet de flexibiliteit van het DMN.',
    gifts: {
      description: 'Uitzonderlijke structuur: Hoge serotonine en testosteron sturen ordelijk bestuur en welvaart aan. De PFC-CEN koppeling maakt strategische distributie mogelijk.',
      techMultiplier: 'Management platforms (AI-dashboards, CRM, blockchain) versterken hun soevereiniteit. Real-time data geeft serotonine-stabiliteit, wat massale structuur en optimalisatie mogelijk maakt.',
    },
    curses: {
      description: 'Tirannie & Bevroren Systemen: Lage agreeableness en ongecontroleerd testosteron voeden entitlement. Serotonine-overstabiliteit onderdrukt adaptieve verandering uit angst voor anarchie.',
      techMultiplier: 'Algoritmische controle (surveillance-apps) intensiveert tirannie door constante monitoring, wat leidt tot kille centralisatie zonder empathie.',
    },
    integrationPath: {
      shadowArchetype: 'OUTLAW',
      shadowName: 'The Outlaw',
      alchemy: 'De Outlaw injecteert revolutionaire dopamine en netwerk-desegregatie. Dit daagt het rigide CEN uit met flexibele DMN-activiteit voor adaptieve disruptie.',
      tacticalLevers: [
        'Bewuste regelbrekende oefeningen (creatieve anarchie)',
        'Loslaten van structuren',
        'Waarheidsvinding in machtsdynamieken',
      ],
      resultArchetype: 'The Maverick',
      resultDescription: 'Eerlijk en dynamisch leiderschap waarbij orde evolueert zonder onderdrukking.',
    },
  },
};

/**
 * Look up a single archetype's biochemical profile by key.
 * @param {string} key — e.g. 'SAGE', 'HERO'
 * @returns {object|undefined}
 */
export function getBiochemicalProfile(key) {
  return BIOCHEMICAL_PROFILES[key];
}

/**
 * Return the full integration-path text block for an archetype,
 * ready for AI prompt injection.
 * @param {string} key
 * @returns {string}
 */
export function getBiochemicalPromptBlock(key) {
  const p = BIOCHEMICAL_PROFILES[key];
  if (!p) return '';
  const ip = p.integrationPath;
  return [
    `── Biochemical Deep Dive: ${p.nameEn} (${p.name}) ──`,
    `Stress Response: ${p.biochemicalCore}`,
    ``,
    `Neurale Superkracht: ${p.gifts.description}`,
    `Tech Multiplier (Gift): ${p.gifts.techMultiplier}`,
    ``,
    `Paradoxale Schaduw: ${p.curses.description}`,
    `Tech Multiplier (Curse): ${p.curses.techMultiplier}`,
    ``,
    `Integration via ${ip.shadowName} Shadow:`,
    `  Alchemie: ${ip.alchemy}`,
    `  Tactische Levers: ${ip.tacticalLevers.join('; ')}`,
    `  Resultaat: ${ip.resultArchetype} — ${ip.resultDescription}`,
  ].join('\n');
}
