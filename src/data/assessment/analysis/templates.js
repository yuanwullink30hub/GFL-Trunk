/**
 * Analysis Text Templates
 * 
 * Pre-written analysis sections per archetype that the API agent
 * will use as seed text for personalized result generation.
 * 
 * Structure: ANALYSIS_TEMPLATES[archetypeKey] → { sections: [...] }
 * 
 * 12-archetype system:
 *   Set A (Odd):  SAGE, HERO, LOVER, ARTIST, RULER, INNOCENT
 *   Set B (Even): EXPLORER, OUTLAW, CAREGIVER, MAGICIAN, JUDGE, TRICKSTER
 * 
 * Complementary Pairs (Harmony Bonus):
 *   Sage ↔ Explorer, Hero ↔ Outlaw, Lover ↔ Caregiver,
 *   Artist ↔ Magician, Ruler ↔ Judge, Innocent ↔ Trickster
 * 
 * Shadow Pairs (Integration Point):
 *   Sage ↔ Trickster, Ruler ↔ Outlaw, Hero ↔ Caregiver,
 *   Innocent ↔ Explorer, Artist ↔ Judge, Magician ↔ Lover
 * 
 * The API agent should:
 * 1. Select the template matching the user's primary archetype
 * 2. Blend in elements from the supporting archetype
 * 3. Reference the shadow partner for growth insights
 * 4. Personalize based on specific answer patterns
 * 5. Return 3 analysis sections (system, tactical, trajectory)
 */

export const ANALYSIS_TEMPLATES = {
  // ═══════ SET A — Odd Questions ═══════

  SAGE: {
    sections: [
      {
        title: 'De Alchemie van Individuatie',
        content: 'Het subject demonstreert een zeldzame integratie van analytisch vermogen en diep reflectief bewustzijn. De Wijze-signatuur wijst op een geest die voortdurend patronen zoekt in de stroom van informatie — niet om te controleren, maar om te begrijpen. Je cognitieve architectuur is geoptimaliseerd voor patroonherkenning op meta-niveau: waar anderen data zien, zie jij wetmatigheden. Jouw complementaire partner is de Ontdekker (Explorer) — samen vormen jullie de volledige as van Waarheidsvinding: jij zoekt de waarheid intern via logica, de Explorer zoekt haar extern door grenzen te verleggen.',
      },
      {
        title: 'Het Neurale Schakelbord',
        content: 'Jouw operationele kracht ligt in het vermogen om complexe problemen te vereenvoudigen door ze te doorgronden. In elke context ben je de adviseur naar wie anderen toekomen voor inzicht en perspectief. Je logische scherpte is je zwaard, je reflectie je schild. De schaduwzijde manifesteert zich via de spanning met je schaduwpartner de Nar (Trickster) — Ernst vs. Absurditeit. Je neigt ertoe de wereld te serieus te nemen; de Trickster vult je schaduw met de relativering die je nodig hebt om niet te verstijven in je eigen analyse.',
      },
      {
        title: 'Ontologische Evolutie',
        content: 'Je wijsheidspad bereikt een stadium waar kennis overdragen je primaire missie wordt. De data suggereert dat je klaar bent om van student naar leraar te evolueren — niet door les te geven, maar door te zijn. Integreer de speelsheid van de Trickster om je wijsheid toegankelijk te maken. Omarm het niet-weten als de hoogste vorm van wijsheid. De Sage die lacht om zijn eigen ernst is de meest verlichte van allen.',
      },
    ],
  },

  HERO: {
    sections: [
      {
        title: 'De Alchemie van Individuatie',
        content: 'Het subject vertoont een krachtige actie-oriëntatie gedreven door discipline, moed en de wil om te presteren. De Held-signatuur wijst op een innerlijk vuur dat niet slechts brandt, maar gericht is — als een laserstraal die obstakels doorsnijdt. Jouw complementaire partner is de Rebel (Outlaw) — samen vormen jullie de as van Transformatie door Actie: jij verbetert het systeem door kracht, de Outlaw breekt het systeem om vrijheid te creëren.',
      },
      {
        title: 'Het Neurale Schakelbord',
        content: 'Je bent de motor in elk team, de kartrekker die twee keer zo hard werkt als de rest. Je competentie definieert je eigenwaarde. In crisissituaties ben je onmisbaar — je staat op wanneer het erop aankomt. Je schaduwpartner is de Verzorger (Caregiver) — Kracht vs. Kwetsbaarheid. De Hero wil winnen en presteren, maar de Caregiver herinnert je eraan dat zelfopoffering en zorg ook kracht zijn. Leer je pantser af te leggen zonder je kracht te verliezen.',
      },
      {
        title: 'Ontologische Evolutie',
        content: 'Je beschermende instinct evolueert van het individuele naar het collectieve. De data wijst op een transitie van strijder naar leider — van iemand die vecht naar iemand die inspireert. Integreer de zachtheid van de Caregiver om je kracht te verdiepen. Ware heldhaftigheid is dienstbaarheid, niet dominantie. De sterkste held is degene die weet wanneer het zwaard neergelegd moet worden.',
      },
    ],
  },

  LOVER: {
    sections: [
      {
        title: 'De Alchemie van Individuatie',
        content: 'Het subject straalt een diepe emotionele frequentie uit die alle lagen van het bewustzijn doordringt. De Minnaar-signatuur wijst op een hart dat als een seismograaf de fijnste trillingen van menselijke verbinding registreert. Jouw complementaire partner is de Verzorger (Caregiver) — samen vormen jullie de as van Relatie & Verbinding: jij zoekt de intensiteit van versmelting, de Caregiver biedt de stabiliteit van voeding.',
      },
      {
        title: 'Het Neurale Schakelbord',
        content: 'In elke setting ben je de verbinder die zorgt dat de sfeer goed is en iedereen zich gezien voelt. Je intuïtie voor emotionele dynamieken maakt je onmisbaar. Je schaduwpartner is de Magiër (Magician) — Resonantie vs. Intentie. Jij voelt alles en versmelt met de ander; de Magician leert je om die emotionele verstrengeling om te zetten in werkelijke verandering. Combineer je empathie met transformatieve kracht.',
      },
      {
        title: 'Ontologische Evolutie',
        content: 'Je liefdescapaciteit evolueert van het persoonlijke naar het universele. De komende fase vraagt om het uitbreiden van je verbindingsveld zonder de intimiteit te verliezen. Integreer het transformatieve vermogen van de Magician als beschermende structuur die je toestaat steeds meer lief te hebben zonder je eigen bron uit te putten.',
      },
    ],
  },

  ARTIST: {
    sections: [
      {
        title: 'De Alchemie van Individuatie',
        content: 'Het subject bezit een uitzonderlijk creatief bewustzijn dat de werkelijkheid niet accepteert maar voortdurend herschept. De Kunstenaar-signatuur wijst op een innerlijk landschap van beelden, visioenen en esthetische impulsen die naar expressie zoeken. Jouw complementaire partner is de Magiër (Magician) — samen vormen jullie de as van Manifestatie & Creatie: jij geeft vorm aan innerlijke beelden, de Magician verandert de interface van de werkelijkheid zelf.',
      },
      {
        title: 'Het Neurale Schakelbord',
        content: 'Jij bent de vernieuwer die leven in de brouwerij brengt met frisse ideeën en onorthodoxe oplossingen. Je eigenzinnigheid is je kracht en je valkuil. Je schaduwpartner is de Rechter (Judge) — Expressie vs. Evaluatie. Je creëert zonder filter; de Judge is de noodzakelijke schaduw die structuur, maat en oordeel aanbrengt bij je vrije expressie. Leer van de Judge zonder je vuur te doven.',
      },
      {
        title: 'Ontologische Evolutie',
        content: 'Je creatieve pad bereikt een punt waar het persoonlijke het universele raakt. De data suggereert dat je visioenen steeds meer resoneren met een collectieve behoefte aan schoonheid en betekenis. Integreer het oordeelsvermogen van de Judge om je kunst een structuur te geven die door de tijd heen standhoudt. Het mooiste kunstwerk is dat wat anderen inspireert om zelf te scheppen.',
      },
    ],
  },

  RULER: {
    sections: [
      {
        title: 'De Alchemie van Individuatie',
        content: 'Het subject demonstreert een natuurlijk vermogen voor structuur, leiderschap en het bewaken van orde. De Heerser-signatuur wijst op een geest die niet alleen systemen begrijpt, maar ze actief vormgeeft en beheert. Jouw complementaire partner is de Rechter (Judge) — samen vormen jullie de as van Autoriteit & Structuur: jij bewaakt de orde en soevereiniteit, de Judge bewaakt de morele integriteit en de weging van die orde.',
      },
      {
        title: 'Het Neurale Schakelbord',
        content: 'In elk team neem je de rol van leider aan — je deelt taken uit, bewaakt de structuur en houdt het overzicht. Je competentie straalt autoriteit uit. Je schaduwpartner is de Rebel (Outlaw) — Orde vs. Chaos. Je bent doodsbang voor anarchie, maar de Outlaw is de kracht die nodig is om een gestold systeem open te breken. De beste leider is niet hij die het hardst stuurt, maar hij die de ruimte schept waarin anderen excelleren.',
      },
      {
        title: 'Ontologische Evolutie',
        content: 'Je leiderschapspad evolueert van management naar visionair bestuur. De data wijst op een groeiende capaciteit om niet alleen systemen te beheren, maar ze fundamenteel te herontwerpen. Integreer de rebellie-energie van de Outlaw om je structuren levend te houden en te voorkomen dat ze verstenen. Ware macht is geleend en tijdelijk — gebruik het wijs.',
      },
    ],
  },

  INNOCENT: {
    sections: [
      {
        title: 'De Alchemie van Individuatie',
        content: 'Het subject vertoont een fundamenteel vertrouwen in het goede dat zeldzaam en krachtig is. De Onschuldige-signatuur wijst op een zuiver bewustzijn dat de wereld benadert zonder cynisme of wantrouwen. Jouw complementaire partner is de Nar (Trickster) — samen vormen jullie de as van Eerlijkheid & Perspectief: jij belichaamt de zuivere waarheid, de Trickster onthult de waarheid door de absurditeit van de leugen te tonen.',
      },
      {
        title: 'Het Neurale Schakelbord',
        content: 'Je bent het loyale lid dat onvoorwaardelijk steunt, de trouwe kracht die vertrouwt op de goede bedoelingen van de groep. Je openheid maakt je tot een veilige haven voor anderen. Je schaduwpartner is de Ontdekker (Explorer) — Veiligheid vs. Risico. Je blijft in het paradijs terwijl de Explorer de drang belichaamt om het bekende te verlaten voor het onbekende. Vertrouwen is mooi, maar vertrouwen gepaard met ervaring is onverwoestbaar.',
      },
      {
        title: 'Ontologische Evolutie',
        content: 'Je pad van zuiverheid bereikt een fase waarin je onschuld getest zal worden door de complexiteit van het leven. De data suggereert dat je klaar bent om je vertrouwen te verdiepen — niet door het blind te behouden, maar door het bewust te kiezen. Integreer het avontuur van de Explorer om je wereld te vergroten zonder je zuiverheid te verliezen. De ware onschuldige is niet hij die het kwaad niet kent, maar hij die het kent en toch vertrouwt.',
      },
    ],
  },

  // ═══════ SET B — Even Questions ═══════

  EXPLORER: {
    sections: [
      {
        title: 'De Alchemie van Individuatie',
        content: 'Het subject bezit een onverzadigbare nieuwsgierigheid die de grenzen van het bekende voortdurend verlegt. De Ontdekker-signatuur wijst op een bewustzijn dat niet rust bij het vertrouwde maar voortdurend nieuwe territoria zoekt. Jouw complementaire partner is de Wijze (Sage) — samen vormen jullie de as van Waarheidsvinding: jij zoekt de waarheid extern door grenzen te verleggen, de Sage zoekt haar intern via reflectie.',
      },
      {
        title: 'Het Neurale Schakelbord',
        content: 'Je bent de pionier die niches vindt waar niemand anders durft te kijken. Je autonomie is heilig — je bepaalt je eigen koers. Je schaduwpartner is de Onschuldige (Innocent) — Zoektocht vs. Thuiskomst. Je hebt de Innocent nodig om een moreel kompas en innerlijke rust te behouden tijdens de reis. Niet elke horizon hoeft bereikt te worden; soms is de schat onder je voeten. Documenteer je ontdekkingen en deel ze.',
      },
      {
        title: 'Ontologische Evolutie',
        content: 'Je ontdekkingsreis staat op een kantelpunt waar diepte belangrijker wordt dan breedte. Integreer de innerlijke rust en het vertrouwen van de Innocent om je verkenningen te verankeren in betekenisvolle resultaten. De wijsheid die je zoekt is al aanwezig — stop met zoeken en begin met vinden.',
      },
    ],
  },

  OUTLAW: {
    sections: [
      {
        title: 'De Alchemie van Individuatie',
        content: 'Het subject vertoont een fundamentele weigering om zich te conformeren aan opgelegde structuren en regels. De Rebel-signatuur wijst op een autonome kracht die niet vernietigt om te vernietigen, maar om ruimte te maken voor het nieuwe. Jouw complementaire partner is de Held (Hero) — samen vormen jullie de as van Transformatie door Actie: jij breekt het systeem, de Hero bouwt het betere alternatief.',
      },
      {
        title: 'Het Neurale Schakelbord',
        content: 'Je bent degene die de gevestigde orde omverwerpt door het totaal anders te doen. Je kracht ligt in het bevrijden van vastgeroeste patronen. Je schaduwpartner is de Heerser (Ruler) — Vernieling vs. Constructie. Je hebt de Ruler nodig om te voorkomen dat je rebellie zinloze destructie wordt. Kanaliseer je rebellie in gerichte actie die niet alleen omverwerpt, maar ook opbouwt.',
      },
      {
        title: 'Ontologische Evolutie',
        content: 'Je revolutionaire pad evolueert van verzet naar visionair leiderschap. De data wijst op een groeiende capaciteit om niet alleen tegen te zijn, maar voor iets te staan. Integreer de structurele kracht van de Ruler om je radicale vrijheidsdrang te verankeren in duurzame verandering. De grootste rebel is uiteindelijk degene die zichzelf transformeert.',
      },
    ],
  },

  CAREGIVER: {
    sections: [
      {
        title: 'De Alchemie van Individuatie',
        content: 'Het subject bezit een diep altruïstisch vermogen dat zich manifesteert als een onvoorwaardelijke drang om te zorgen. De Verzorger-signatuur wijst op een hart dat de pijn van anderen als de zijne draagt. Jouw complementaire partner is de Minnaar (Lover) — samen vormen jullie de as van Relatie & Verbinding: jij biedt de stabiliteit van veilige zorg, de Lover brengt de intensiteit van versmelting en passie.',
      },
      {
        title: 'Het Neurale Schakelbord',
        content: 'Je bent degene die er onvoorwaardelijk is en mensen helpt groeien. In crisissituaties gebruik je je resterende energie om anderen te ondersteunen. Je schaduwpartner is de Held (Hero) — Dienstbaarheid vs. Zelfbeschikking. Je hebt de Hero nodig om grenzen te stellen en niet opgebrand te raken door anderen. De beste verzorger is degene die anderen leert voor zichzelf te zorgen.',
      },
      {
        title: 'Ontologische Evolutie',
        content: 'Je zorgcapaciteit evolueert van het persoonlijke naar het systemische. De data suggereert dat je klaar bent om van individuele zorg naar gemeenschapsopbouw te evolueren. Integreer de moed en kracht van de Hero om je zorg op grotere schaal impact te geven en om grenzen te bewaken. Je warmte is je superkracht — geef het structuur en het verandert de wereld.',
      },
    ],
  },

  MAGICIAN: {
    sections: [
      {
        title: 'De Alchemie van Individuatie',
        content: 'Het subject demonstreert een buitengewoon transformatief vermogen. De Magiër-signatuur wijst op een bewustzijn dat de werkelijkheid niet als vaststaand beschouwt maar als kneedbaar. Jouw complementaire partner is de Kunstenaar (Artist) — samen vormen jullie de as van Manifestatie & Creatie: jij verandert de interface van de werkelijkheid, de Artist geeft er tastbare vorm aan.',
      },
      {
        title: 'Het Neurale Schakelbord',
        content: 'Je bent degene die situaties verandert en problemen als sneeuw voor de zon laat verdwijnen. Je ziet het perfecte moment voor radicale transformatie. Je schaduwpartner is de Minnaar (Lover) — Transformatie vs. Acceptatie. Jij wilt de werkelijkheid veranderen; de Lover herinnert je eraan dat de werkelijkheid ook simpelweg bemind kan worden. Combineer je visionair vermogen met emotionele aarding voor werkelijke impact.',
      },
      {
        title: 'Ontologische Evolutie',
        content: 'Je transformatieve kracht bereikt een cruciaal convergentiepunt. De volgende fase vraagt om de Rubedo — het Rode Werk — waarbij je innerlijke goud zich manifesteert in de buitenwereld. Integreer de emotionele diepte van de Lover om je visioenen te verankeren in menselijke verbinding. De grootste magie is niet het veranderen van de werkelijkheid, maar het veranderen van het bewustzijn dat de werkelijkheid waarneemt.',
      },
    ],
  },

  JUDGE: {
    sections: [
      {
        title: 'De Alchemie van Individuatie',
        content: 'Het subject vertoont een scherp moreel bewustzijn dat alles weegt tegen een innerlijk kompas van integriteit en waarheid. De Rechter-signatuur wijst op een geest die de morele architectuur van situaties doorziet. Jouw complementaire partner is de Heerser (Ruler) — samen vormen jullie de as van Autoriteit & Structuur: jij geeft het morele gewicht aan de troon waarop de Ruler zit.',
      },
      {
        title: 'Het Neurale Schakelbord',
        content: 'Je bent degene die precies wil weten wie of wat de oorzaak is en hoe het rechtgezet moet worden. Je duidelijkheid en rechtvaardigheid zijn onmisbaar. Je schaduwpartner is de Kunstenaar (Artist) — Objectiviteit vs. Subjectiviteit. Je kille oordeel heeft de bezieling en visie van de Artist nodig om tot werkelijke wijsheid te komen. De beste rechter is niet de strengste, maar de wijste.',
      },
      {
        title: 'Ontologische Evolutie',
        content: 'Je morele pad evolueert van het toetsen van recht naar het vormgeven van rechtvaardigheid. De data wijst op een groeiende capaciteit om niet alleen te oordelen, maar te verzoenen. Integreer de creatieve expressie van de Artist om je moraliteit te verdiepen voorbij het zwart-wit denken. Ware gerechtigheid is niet straf, maar herstel.',
      },
    ],
  },

  TRICKSTER: {
    sections: [
      {
        title: 'De Alchemie van Individuatie',
        content: 'Het subject bezit een uniek vermogen om door de illusies van het conventionele heen te prikken via humor en absurditeit. De Nar-signatuur wijst op een bewustzijn dat de ernst van het leven relativeert — en juist daardoor dieper ziet dan de meeste anderen. Jouw complementaire partner is de Onschuldige (Innocent) — samen vormen jullie de as van Eerlijkheid & Perspectief: de ernst van de Innocent versus jouw relativering houden de psyche in balans.',
      },
      {
        title: 'Het Neurale Schakelbord',
        content: 'Je bent degene die mensen laat lachen en de zwaarte relativeert, die de spanning breekt en de opgeblazen ego\'s doorprikt. Je humor is een chirurgisch instrument. Je schaduwpartner is de Wijze (Sage) — Spot vs. Diepgang. Je hebt de Sage nodig om te voorkomen dat je grappen oppervlakkig en betekenisloos worden. Combineer je ontwrichtende vermogen met intellectuele diepte voor maximale impact.',
      },
      {
        title: 'Ontologische Evolutie',
        content: 'Je pad van de heilige gek bereikt een fase waarin je speelsheid een diepere laag krijgt. De data suggereert dat je humor evolueert van reactief naar visionair — je lach wordt het medium waardoor fundamentele waarheden zich openbaren. Integreer de wijsheid van de Sage om je grappen een filosofisch fundament te geven. De wijste nar is degene die zichzelf het hardst uitlacht.',
      },
    ],
  },
};

/**
 * Get analysis template for a given archetype key.
 * @param {string} archetypeKey
 * @returns {{ sections: Array<{ title: string, content: string }> } | undefined}
 */
export function getAnalysisTemplate(archetypeKey) {
  return ANALYSIS_TEMPLATES[archetypeKey];
}

/**
 * Blend two archetype templates (primary + secondary) for richer analysis.
 * Returns primary sections with subtle secondary influences noted.
 * This is a placeholder — the API agent will do sophisticated blending.
 * 
 * @param {string} primaryKey
 * @param {string} secondaryKey
 * @returns {{ sections: Array<{ title: string, content: string }> }}
 */
export function blendAnalysisTemplates(primaryKey, secondaryKey) {
  const primary = ANALYSIS_TEMPLATES[primaryKey];
  const secondary = ANALYSIS_TEMPLATES[secondaryKey];
  
  if (!primary) return secondary || { sections: [] };
  if (!secondary) return primary;
  
  // For now, return primary sections.
  // The API agent will perform sophisticated blending.
  return primary;
}
