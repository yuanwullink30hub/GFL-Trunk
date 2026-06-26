/**
 * Reference corpus for "Bronnen & Verantwoording" — Source Ledger Part II.
 * Clusters are ordered wijdste → diepste → terug: E, A, C, B, H, I, J, K, D, G, F.
 *
 * Source shape: { id, author, titleAndJournal, underpins, deviation,
 *                 crossRelation, certainty, certaintyLevel }
 * Translatable fields (titleAndJournal, underpins, deviation, crossRelation,
 *   certainty, and cluster subtitle) are { nl, en } objects; resolve with the
 *   `L()` helper in ReferencesPanel. id / author / certaintyLevel stay plain.
 * certaintyLevel ∈ 'Hoog' | 'Middel-Hoog' | 'Middel' | 'Laag' | 'Omstreden'
 *                  | 'Equivoque' | 'Verplaatst'  (drives the badge colour)
 */

export const clustersData = [
  {
    id: 'E',
    name: 'Cluster E',
    subtitle: {
      nl: 'Ontologie & kosmologie — de wijdste schaal: het substantie-kader. Hier raakt het fundament uit het Frame de bronnen die het verankeren — gedragen als positie, niet als bewijs. De meest filosofische laag; elke claim hier is een gewogen stelling, geen meting.',
      en: 'Ontology & cosmology — the widest scale: the substance frame. Here the foundation from the Frame meets the sources that anchor it — carried as a position, not as proof. The most philosophical layer; every claim here is a weighted proposition, not a measurement.',
    },
    sources: [
      {
        id: 'e1',
        author: 'Bohm (1980)',
        titleAndJournal: {
          nl: 'Impliciete / expliciete orde · Wholeness and the Implicate Order',
          en: 'Implicate / explicate order · Wholeness and the Implicate Order',
        },
        underpins: {
          nl: 'Het sterkste fysica-analoog voor Spinoza-substantie: één ingevouwen (impliciete) orde, archetypen als expliciete ontvouwingen van een impliciet substraat.',
          en: 'The strongest physics analogue for Spinoza substance: one enfolded (implicate) order, with archetypes as explicate unfoldings of an implicit substrate.',
        },
        deviation: {
          nl: 'Wij dragen dit expliciet als analoog, niet als fysica. Het draagt geen empirisch gewicht in enige cel-afleiding — het geeft de vorm van het denken, niet het bewijs ervan.',
          en: 'We carry this explicitly as an analogy, not as physics. It bears no empirical weight in any cell derivation — it gives the shape of the thinking, not its proof.',
        },
        crossRelation: {
          nl: 'Grondt de relationele substraat-lezing (P1, P5 uit het Frame).',
          en: 'Grounds the relational-substrate reading (P1, P5 from the Frame).',
        },
        certainty: {
          nl: 'Laag als fysica · structureel nuttig als kader',
          en: 'Low as physics · structurally useful as a frame',
        },
        certaintyLevel: 'Laag',
      },
      {
        id: 'e2',
        author: 'Verlinde (2016)',
        titleAndJournal: {
          nl: 'Emergente zwaartekracht · Emergent Gravity and the Dark Universe',
          en: 'Emergent gravity · Emergent Gravity and the Dark Universe',
        },
        underpins: {
          nl: 'Zwaartekracht als entropisch/informationeel verschijnsel — dezelfde thermodynamische logica als de vrije-energie-grond, maar op kosmologische schaal. Sluit de multischaal-lus aan de bovenkant.',
          en: 'Gravity as an entropic/informational phenomenon — the same thermodynamic logic as the free-energy ground, but at cosmological scale. Closes the multiscale loop at the top.',
        },
        deviation: {
          nl: 'Omstreden fysica; we behandelen het niet als gevestigde zwaartekrachttheorie. Het omkadert de multischaal-claim, het bewijst hem niet. We benoemen het als bracket, niet als bodem.',
          en: 'Contested physics; we do not treat it as established gravitational theory. It brackets the multiscale claim, it does not prove it. We name it as a bracket, not a bedrock.',
        },
        crossRelation: {
          nl: 'Paart met Levin (Cluster J) die de lus aan de onderkant sluit. Falsifieert de multischaal-brug niet — begrenst hem.',
          en: 'Pairs with Levin (Cluster J) which closes the loop at the bottom. Does not falsify the multiscale bridge — it bounds it.',
        },
        certainty: {
          nl: 'Laag als fysica (omstreden), als bovenkant-analoog gehouden',
          en: 'Low as physics (contested), held as a top-end analogue',
        },
        certaintyLevel: 'Laag',
      },
      {
        id: 'e3',
        author: "D'Ariano & Faggin (2021)",
        titleAndJournal: {
          nl: 'Quantum-informatie-panpsychisme · Hard Problem and Free Will',
          en: 'Quantum-information panpsychism · Hard Problem and Free Will',
        },
        underpins: {
          nl: 'Bewustzijn als fundamentele eigenschap van informatie; het onderscheid tussen ontisch (van-binnen-ervaren) en epistemisch (van-buiten-voorspeld).',
          en: 'Consciousness as a fundamental property of information; the distinction between ontic (experienced from within) and epistemic (predicted from without).',
        },
        deviation: {
          nl: 'Theoretische steiger, geen anker: Middel als formalisme, Laag als gevestigde bewustzijnswetenschap. We houden het naast Kastrup als productieve spanning — beide plaatsen bewustzijn fundamenteel, maar twisten over substantie versus relatie.',
          en: 'Theoretical scaffolding, not an anchor: Medium as a formalism, Low as established consciousness science. We hold it next to Kastrup as a productive tension — both place consciousness as fundamental, but dispute substance versus relation.',
        },
        crossRelation: {
          nl: 'Gepaard met Kastrup als bewust onopgeloste spanning.',
          en: 'Paired with Kastrup as a deliberately unresolved tension.',
        },
        certainty: {
          nl: 'Middel (formalisme) · Laag (als wetenschap)',
          en: 'Medium (formalism) · Low (as science)',
        },
        certaintyLevel: 'Middel',
      },
      {
        id: 'e4',
        author: 'Kastrup (2019)',
        titleAndJournal: {
          nl: 'Analytisch idealisme · Reasonable Inferences From Quantum Mechanics',
          en: 'Analytic idealism · Reasonable Inferences From Quantum Mechanics',
        },
        underpins: {
          nl: 'Verdedigt QM-gegronde inferentie tegen naïef lokaal realisme (non-contextualiteit is empirisch weerlegd: Aspect; Hensen 2015; BIG Bell Test 2018).',
          en: 'Defends QM-grounded inference against naive local realism (non-contextuality is empirically refuted: Aspect; Hensen 2015; BIG Bell Test 2018).',
        },
        deviation: {
          nl: 'De geciteerde experimenten zijn solide; de idealistische inkleuring houden we als spanning, niet als anker. De publicatie-plek is niet-mainstream — voor de empirische punten verwijzen we liever direct naar de Bell-test-literatuur.',
          en: 'The cited experiments are solid; the idealist framing we keep as tension, not as an anchor. The venue is non-mainstream — for the empirical points we prefer to cite the Bell-test literature directly.',
        },
        crossRelation: {
          nl: 'De Bell-experimenten zijn Hoog; de idealistische lezing draagt niets in de cel-afleiding.',
          en: 'The Bell experiments are High; the idealist reading bears nothing in the cell derivation.',
        },
        certainty: {
          nl: 'Experimenten Hoog · idealistisch kader als spanning',
          en: 'Experiments High · idealist frame held as tension',
        },
        certaintyLevel: 'Middel-Hoog',
      },
    ],
  },
  {
    id: 'A',
    name: 'Cluster A',
    subtitle: {
      nl: 'Actieve inferentie, netwerken & het voorspellende substraat — het fundament onder "een archetype is een configuratie van verwachtingen, geen vaste eigenschap." De architectuur van hoe een begrensd systeem de wereld voorspelt in plaats van ondergaat.',
      en: 'Active inference, networks & the predictive substrate — the foundation under "an archetype is a configuration of expectations, not a fixed trait." The architecture of how a bounded system predicts the world rather than merely undergoing it.',
    },
    sources: [
      {
        id: 'a1',
        author: 'Friston (2010)',
        titleAndJournal: {
          nl: 'Free-energy principle / actieve inferentie · Nature Reviews Neuroscience',
          en: 'Free-energy principle / active inference · Nature Reviews Neuroscience',
        },
        underpins: {
          nl: 'De hele voorspellende architectuur: het brein minimaliseert verrassing via top-down verwachtingen (priors). De formele basis voor "archetype = configuratie van priors."',
          en: 'The whole predictive architecture: the brain minimises surprise via top-down expectations (priors). The formal basis for "archetype = configuration of priors."',
        },
        deviation: {
          nl: 'Het raamwerk is algemeen; de vertaling naar één archetype per cel is onze constructie, geen meting. We dragen actieve inferentie als aangenomen substraat — niet per archetype apart geverifieerd.',
          en: 'The framework is general; the translation to one archetype per cell is our construction, not a measurement. We carry active inference as an assumed substrate — not verified per archetype.',
        },
        crossRelation: {
          nl: 'Falsifieert als de per-archetype prior-toewijzing geen voorspellende waarde blijkt te hebben. Draagt het hele B-component.',
          en: 'Falsifies if the per-archetype prior assignment turns out to have no predictive value. Carries the entire B-component.',
        },
        certainty: {
          nl: 'Hoog als raamwerk · Middel voor cel-toepassing',
          en: 'High as a framework · Medium for the cell application',
        },
        certaintyLevel: 'Middel-Hoog',
      },
      {
        id: 'a2',
        author: 'Buzsáki (2019)',
        titleAndJournal: {
          nl: 'The Brain from Inside Out · Oxford UP',
          en: 'The Brain from Inside Out · Oxford UP',
        },
        underpins: {
          nl: 'De omkering: archetypen zijn geen reactieve circuits maar actieve generatoren die de wereld op fitness testen. Grondt "de configuratie neigt zich te uiten als…"',
          en: 'The inversion: archetypes are not reactive circuits but active generators that test the world for fitness. Grounds "the configuration tends to express itself as…"',
        },
        deviation: {
          nl: 'We nemen een sterke interpretatieve positie ("inside-out") als uitgangspunt, terwijl het een synthese is, geen enkele meting. We kiezen bewust de kant van het zelf-organiserende brein.',
          en: 'We take a strong interpretive position ("inside-out") as our starting point, while it is a synthesis, not a single measurement. We deliberately side with the self-organising brain.',
        },
        crossRelation: {
          nl: 'Kruisrelateert met de dynamische-matrix-lezing (priors als actieve generatoren).',
          en: 'Cross-relates with the dynamic-matrix reading (priors as active generators).',
        },
        certainty: { nl: 'Middel–Hoog', en: 'Medium–High' },
        certaintyLevel: 'Middel-Hoog',
      },
      {
        id: 'a3',
        author: 'Menon (2011)',
        titleAndJournal: {
          nl: 'Triple Network Model / CEN–DMN-competitie · Trends in Cognitive Sciences',
          en: 'Triple Network Model / CEN–DMN competition · Trends in Cognitive Sciences',
        },
        underpins: {
          nl: 'De netwerk-competitiestructuur: CEN houdt orde deels door DMN te onderdrukken; het Salience Network schakelt ertussen. Onderbouwt de zes-groepen-naar-netwerk-mapping.',
          en: 'The network-competition structure: the CEN maintains order partly by suppressing the DMN; the Salience Network switches between them. Underpins the six-groups-to-network mapping.',
        },
        deviation: {
          nl: 'De schone driedeling is een vereenvoudiging — echte netwerkgrenzen lopen vloeiend in elkaar over. We trekken de kaart strakker dan het terrein, en weten dat.',
          en: 'The clean tripartite split is a simplification — real network boundaries blur into one another. We draw the map tighter than the terrain, and we know it.',
        },
        crossRelation: {
          nl: 'Bevestigd door onze eigen Fase-2-bevinding (CEN⊥DMN: Ruler/Judge-dalen = Sage/Artist-pieken).',
          en: 'Confirmed by our own Phase-2 finding (CEN⊥DMN: Ruler/Judge troughs = Sage/Artist peaks).',
        },
        certainty: {
          nl: 'Hoog (fundamenteel, veelvuldig gerepliceerd)',
          en: 'High (fundamental, widely replicated)',
        },
        certaintyLevel: 'Hoog',
      },
      {
        id: 'a4',
        author: 'Bassett (2011, 2017)',
        titleAndJournal: {
          nl: 'Dynamische netwerk-herconfiguratie · PNAS',
          en: 'Dynamic network reconfiguration · PNAS',
        },
        underpins: {
          nl: 'Het onderscheid tussen snelle, omkeerbare aanpassing (D2) en tragere structurele verandering (D3) in de spannings-curve — de snelheid waarmee netwerken loskoppelen en hercombineren onder druk.',
          en: 'The distinction between fast, reversible adaptation (D2) and slower structural change (D3) in the tension curve — the speed at which networks decouple and recombine under pressure.',
        },
        deviation: {
          nl: 'De flexibiliteits-metingen zijn correlationeel; het koppelen ervan aan onze toestandsklassen (D2/D3) is interpretatie, geen directe afleiding.',
          en: 'The flexibility measures are correlational; tying them to our state classes (D2/D3) is interpretation, not direct derivation.',
        },
        crossRelation: {
          nl: 'Onderbouwt de D2→D3-overgang; specifiek de Chaos-groep (Outlaw/Trickster).',
          en: 'Underpins the D2→D3 transition; specifically the Chaos group (Outlaw/Trickster).',
        },
        certainty: { nl: 'Hoog (robuust, gerepliceerd)', en: 'High (robust, replicated)' },
        certaintyLevel: 'Hoog',
      },
      {
        id: 'a5',
        author: 'Carhart-Harris & Friston (2019)',
        titleAndJournal: {
          nl: 'REBUS / het anarchische brein · Pharmacological Reviews',
          en: 'REBUS / the anarchic brain · Pharmacological Reviews',
        },
        underpins: {
          nl: 'Het mechanisme van schaduw-integratie: onder hoge DMN-activiteit/entropie ontspannen rigide verwachtingen. Geeft de richting voor de schaduw-as.',
          en: 'The mechanism of shadow integration: under high DMN activity/entropy, rigid expectations relax. Gives the direction for the shadow axis.',
        },
        deviation: {
          nl: 'Het model is farmacologisch gegrond (psychedelica). Het als algemeen mechanisme voor schaduw-ontspanning gebruiken is een analogische uitbreiding — een brug die we slaan, geen meting.',
          en: 'The model is pharmacologically grounded (psychedelics). Using it as a general mechanism for shadow relaxation is an analogical extension — a bridge we build, not a measurement.',
        },
        crossRelation: {
          nl: 'Gekoppeld aan Carhart-Harris (2014); samen dragen ze de REBUS-richting.',
          en: 'Linked to Carhart-Harris (2014); together they carry the REBUS direction.',
        },
        certainty: { nl: 'Middel–Hoog', en: 'Medium–High' },
        certaintyLevel: 'Middel-Hoog',
      },
      {
        id: 'a6',
        author: 'Carhart-Harris (2014)',
        titleAndJournal: {
          nl: 'Het entropische brein · Frontiers in Human Neuroscience',
          en: 'The entropic brain · Frontiers in Human Neuroscience',
        },
        underpins: {
          nl: 'Het rigiditeit↔chaos-spectrum: hersentoestanden liggen op een meetbare entropie-as; hoge entropie lost rigide priors op. Anker voor de entropische dynamiek van de Chaos-groep.',
          en: 'The rigidity↔chaos spectrum: brain states lie on a measurable entropy axis; high entropy dissolves rigid priors. Anchor for the entropic dynamics of the Chaos group.',
        },
        deviation: {
          nl: 'Entropie-als-flexibiliteit is één specifieke operationalisatie; de koppeling aan archetype-toestanden is interpretatie.',
          en: 'Entropy-as-flexibility is one specific operationalisation; the link to archetype states is interpretation.',
        },
        crossRelation: { nl: 'Paart met REBUS (entry hierboven).', en: 'Pairs with REBUS (entry above).' },
        certainty: { nl: 'Middel–Hoog', en: 'Medium–High' },
        certaintyLevel: 'Middel-Hoog',
      },
      {
        id: 'a7',
        author: 'Christoff (2016)',
        titleAndJournal: {
          nl: 'Ongebonden DMN-incubatie · Nature Reviews Neuroscience',
          en: 'Unconstrained DMN incubation · Nature Reviews Neuroscience',
        },
        underpins: {
          nl: 'Het DMN bereikt zijn maximale generatieve capaciteit pas wanneer het níét door het CEN wordt ingeperkt. Anker voor de naar-binnen-spiraal van de Abstract-groep.',
          en: 'The DMN reaches its maximal generative capacity only when it is not constrained by the CEN. Anchor for the inward spiral of the Abstract group.',
        },
        deviation: {
          nl: 'De inperkings-dimensies zijn een raamwerk; onze D3-piek-mapping erop is interpretatie.',
          en: 'The constraint dimensions are a framework; our D3-peak mapping onto them is interpretation.',
        },
        crossRelation: {
          nl: 'Onderbouwt de Abstract-groep (Sage/Artist) curve.',
          en: 'Underpins the Abstract group (Sage/Artist) curve.',
        },
        certainty: { nl: 'Middel–Hoog', en: 'Medium–High' },
        certaintyLevel: 'Middel-Hoog',
      },
      {
        id: 'a8',
        author: 'Buckner (2008)',
        titleAndJournal: {
          nl: 'Het default-netwerk / mentale tijdreis · Annals NYAS',
          en: 'The default network / mental time travel · Annals NYAS',
        },
        underpins: {
          nl: 'Het DMN is sterk actief bij herinneren, toekomst-simulatie en het invoelen van anderen — het constructieve-simulatie-substraat. Grondt de naar-binnen-gerichte Abstract-functie.',
          en: 'The DMN is strongly active during remembering, future simulation and empathising with others — the constructive-simulation substrate. Grounds the inward-facing Abstract function.',
        },
        deviation: {
          nl: '— (directe toepassing; geen materiële afwijking)',
          en: '— (direct application; no material deviation)',
        },
        crossRelation: {
          nl: 'Fundamentele DMN-review; consistent over geheugen, vooruitkijken en mentaliseren.',
          en: 'Foundational DMN review; consistent across memory, prospection and mentalising.',
        },
        certainty: { nl: 'Hoog (fundamenteel, gerepliceerd)', en: 'High (fundamental, replicated)' },
        certaintyLevel: 'Hoog',
      },
      {
        id: 'a9',
        author: 'Aston-Jones & Cohen (2005)',
        titleAndJournal: {
          nl: 'LC-NE faseschakeling · Annual Review of Neuroscience',
          en: 'LC-NE mode switching · Annual Review of Neuroscience',
        },
        underpins: {
          nl: 'De verken/benut-afweging als fysiologische regelknop (tonische vs. fasische LC-NE-vuring). Het mechanisme achter de ontdekkingsdrang van de Seeker-groep en hun gebufferde inzakking.',
          en: 'The explore/exploit trade-off as a physiological control knob (tonic vs. phasic LC-NE firing). The mechanism behind the Seeker group’s drive to discover and their buffered collapse.',
        },
        deviation: {
          nl: '— (een van onze best-gegronde ankers; geen materiële afwijking)',
          en: '— (one of our best-grounded anchors; no material deviation)',
        },
        crossRelation: {
          nl: 'Onderbouwt de Seeker-groep (Innocent/Explorer) en de gebufferde-crash-curve.',
          en: 'Underpins the Seeker group (Innocent/Explorer) and the buffered-crash curve.',
        },
        certainty: {
          nl: 'Hoog (robuuste systeem-neurowetenschap)',
          en: 'High (robust systems neuroscience)',
        },
        certaintyLevel: 'Hoog',
      },
      {
        id: 'a10',
        author: 'DeYoung (2015)',
        titleAndJournal: {
          nl: 'Cybernetic Big Five / Openheid–dopamine · Journal of Research in Personality',
          en: 'Cybernetic Big Five / Openness–dopamine · Journal of Research in Personality',
        },
        underpins: {
          nl: 'Koppelt de exploratieve drive aan dopamine-gelinkte hoge Openheid; levert het trait-substraat voor de Openheid-primaire archetypen (Seeker/Abstract).',
          en: 'Links the exploratory drive to dopamine-related high Openness; supplies the trait substrate for the Openness-primary archetypes (Seeker/Abstract).',
        },
        deviation: {
          nl: 'Dit is onze zwakste schakel in de fundamentele set, en we benoemen het als zodanig. De link Openheid–dopamine is omstreden (zie o.a. Gurven et al.). We houden de Openheid-primairen bewust op verlaagde zekerheid.',
          en: 'This is our weakest link in the foundational set, and we name it as such. The Openness–dopamine link is contested (see e.g. Gurven et al.). We deliberately keep the Openness-primaries at reduced certainty.',
        },
        crossRelation: {
          nl: 'Het trait→neurotransmitter-verband is het kwetsbaarste punt. Falsifieert als Openheid-als-dopamine cross-cultureel niet standhoudt.',
          en: 'The trait→neurotransmitter link is the most vulnerable point. Falsifies if Openness-as-dopamine does not hold up cross-culturally.',
        },
        certainty: {
          nl: 'Middel — bewust verlaagd, open gemarkeerd',
          en: 'Medium — deliberately lowered, openly flagged',
        },
        certaintyLevel: 'Middel',
      },
    ],
  },
  {
    id: 'C',
    name: 'Cluster C',
    subtitle: {
      nl: 'Motivatie- & drijfveer-systemen — wat de configuratie beweegt: de drang onder het gedrag, vóór het gevoel en vóór de structuur.',
      en: 'Motivation & drive systems — what moves the configuration: the urge beneath behaviour, prior to feeling and prior to structure.',
    },
    sources: [
      {
        id: 'c1',
        author: 'Gray (1987, herzien 2000)',
        titleAndJournal: {
          nl: 'Reinforcement Sensitivity Theory · The Neuropsychology of Anxiety',
          en: 'Reinforcement Sensitivity Theory · The Neuropsychology of Anxiety',
        },
        underpins: {
          nl: 'Motivatie gesplitst in een rem-systeem (dreiging/inhibitie) en een toenaderings-/drive-systeem, plus vecht-vlucht-bevries. De drijfveer-architectuur achter de toenaderings-dominante archetypen.',
          en: 'Motivation split into an inhibition system (threat/inhibition) and an approach/drive system, plus fight-flight-freeze. The drive architecture behind the approach-dominant archetypes.',
        },
        deviation: {
          nl: '— (foundationeel motivatie-neurowetenschap; geen materiële afwijking)',
          en: '— (foundational motivation neuroscience; no material deviation)',
        },
        crossRelation: {
          nl: 'Onderbouwt de drive-as die door de hele Agency-groep loopt.',
          en: 'Underpins the drive axis running through the whole Agency group.',
        },
        certainty: { nl: 'Hoog (foundationeel)', en: 'High (foundational)' },
        certaintyLevel: 'Hoog',
      },
      {
        id: 'c2',
        author: 'Panksepp (1998)',
        titleAndJournal: {
          nl: 'Het ZOEK-systeem · Affective Neuroscience',
          en: 'The SEEKING system · Affective Neuroscience',
        },
        underpins: {
          nl: 'Het dopaminerge ZOEK-systeem als biologische basis van toenaderings-motivatie/"wilskracht." Onderbouwt de Beweging/Realisatie-drive en de wilskracht van Magician/Hero.',
          en: 'The dopaminergic SEEKING system as the biological basis of approach motivation / "willpower." Underpins the Movement/Realisation drive and the willpower of Magician/Hero.',
        },
        deviation: {
          nl: 'We gebruiken alleen het ZOEK-anker; Panksepps bredere taxonomie van primaire-proces-emoties is ruimer dan wat we inroepen. We nemen één systeem, niet het hele schema.',
          en: 'We use only the SEEKING anchor; Panksepp’s broader taxonomy of primary-process emotions is wider than what we invoke. We take one system, not the whole scheme.',
        },
        crossRelation: {
          nl: 'Paart met Gray (drive-architectuur) en Damasio (conatus, Cluster B).',
          en: 'Pairs with Gray (drive architecture) and Damasio (conatus, Cluster B).',
        },
        certainty: { nl: 'Hoog', en: 'High' },
        certaintyLevel: 'Hoog',
      },
    ],
  },
  {
    id: 'B',
    name: 'Cluster B',
    subtitle: {
      nl: 'Emotie, belichaming & het bewustzijns-substraat — hoe gevoel ontstaat en hoe het brein de wereld construeert; onder de waarderende functies en de affectieve bodem van de spannings-curve.',
      en: 'Emotion, embodiment & the consciousness substrate — how feeling arises and how the brain constructs the world; beneath the appraising functions and the affective floor of the tension curve.',
    },
    sources: [
      {
        id: 'b1',
        author: 'Barrett (2017)',
        titleAndJournal: {
          nl: 'Geconstrueerde emotie · How Emotions Are Made',
          en: 'Constructed emotion · How Emotions Are Made',
        },
        underpins: {
          nl: 'Emoties zijn geen ingebouwde modules maar concepten die het brein construeert om affect te categoriseren. Onderbouwt de waarderende functies (Interpretatie, Herkenning) als constructief, niet detecterend.',
          en: 'Emotions are not built-in modules but concepts the brain constructs to categorise affect. Underpins the appraising functions (Interpretation, Recognition) as constructive, not detecting.',
        },
        deviation: {
          nl: 'We kiezen bewust de constructionistische kant van een levend debat; de sterke vorm van Barretts claim is omstreden tegenover basis-emotie-theoretici. We nemen die positie met open ogen in.',
          en: 'We deliberately take the constructionist side of a live debate; the strong form of Barrett’s claim is contested by basic-emotion theorists. We adopt that position with eyes open.',
        },
        crossRelation: {
          nl: 'Falsifieert als er toch consistente biomarkers voor discrete basis-emoties blijken te bestaan.',
          en: 'Falsifies if consistent biomarkers for discrete basic emotions turn out to exist after all.',
        },
        certainty: { nl: 'Middel–Hoog', en: 'Medium–High' },
        certaintyLevel: 'Middel-Hoog',
      },
      {
        id: 'b2',
        author: 'Solms (2021)',
        titleAndJournal: {
          nl: 'Thermodynamica van affect / hersenstam-bewustzijn · The Hidden Spring',
          en: 'Thermodynamics of affect / brainstem consciousness · The Hidden Spring',
        },
        underpins: {
          nl: 'Bewustzijn en affect ontstaan in de hersenstam; gevoel is de bewuste uitzending van een energie-toestand. Grondt de affect-als-thermodynamica-lezing en de hersenstam-bodem van de curve.',
          en: 'Consciousness and affect arise in the brainstem; feeling is the conscious broadcast of an energy state. Grounds the affect-as-thermodynamics reading and the brainstem floor of the curve.',
        },
        deviation: {
          nl: 'Hersenstam-primaat is een sterke claim tégen de cortico-centrische visie. We leunen op de minderheidspositie omdat ze het beste past bij een energie-model — en benoemen dat als gok.',
          en: 'Brainstem primacy is a strong claim against the cortico-centric view. We lean on the minority position because it best fits an energy model — and name that as a gamble.',
        },
        crossRelation: {
          nl: 'Empirische tegenhanger van Westen (psychodynamiek, Cluster G); paart met Damasio.',
          en: 'Empirical counterpart to Westen (psychodynamics, Cluster G); pairs with Damasio.',
        },
        certainty: { nl: 'Middel–Hoog', en: 'Medium–High' },
        certaintyLevel: 'Middel-Hoog',
      },
      {
        id: 'b3',
        author: 'Damasio (2003)',
        titleAndJournal: {
          nl: 'Spinoza–neurowetenschap-brug · Looking for Spinoza',
          en: 'Spinoza–neuroscience bridge · Looking for Spinoza',
        },
        underpins: {
          nl: 'Somatische markers en conatus (de biologische drang tot voortbestaan) als gemeten drive. Dé neurobiologische verankering van de Spinoza-ontologie ("een configuratie van een eindige modus van substantie").',
          en: 'Somatic markers and conatus (the biological drive to persist) as measured drive. The neurobiological anchoring of the Spinoza ontology ("a configuration of a finite mode of substance").',
        },
        deviation: {
          nl: 'De somatische-marker-basis is solide, maar de Spinoza-inkleuring is interpretatie — wíj slaan de brug naar de filosofische ontologie. Structureel cruciaal: zonder deze bron had de ontologie geen neuro-anker.',
          en: 'The somatic-marker basis is solid, but the Spinoza framing is interpretation — we build the bridge to the philosophical ontology. Structurally crucial: without this source the ontology would have no neuro-anchor.',
        },
        crossRelation: {
          nl: 'Draagt de hele substantie-ontologie op neuro-niveau; paart met de drive/kosten-laag.',
          en: 'Carries the whole substance ontology at the neuro level; pairs with the drive/cost layer.',
        },
        certainty: { nl: 'Middel–Hoog', en: 'Medium–High' },
        certaintyLevel: 'Middel-Hoog',
      },
      {
        id: 'b4',
        author: 'Seth (2021)',
        titleAndJournal: {
          nl: 'Gecontroleerde hallucinatie · Being You',
          en: 'Controlled hallucination · Being You',
        },
        underpins: {
          nl: 'Waarneming als top-down voorspellende constructie ("gecontroleerde hallucinatie"), begrensd door voorspellingsfout. Versterkt de voorspellende-prior-lezing van de Perceptie-functie.',
          en: 'Perception as top-down predictive construction ("controlled hallucination"), bounded by prediction error. Reinforces the predictive-prior reading of the Perception function.',
        },
        deviation: {
          nl: 'Een populaire synthese van een goed-onderbouwd programma; voor details verwijzen we liever naar de onderliggende predictive-processing-literatuur dan naar het overzichtswerk.',
          en: 'A popular synthesis of a well-supported programme; for details we prefer to cite the underlying predictive-processing literature rather than the overview work.',
        },
        crossRelation: {
          nl: 'Deelt de constructie-framing met Friston en Buzsáki (Cluster A).',
          en: 'Shares the construction framing with Friston and Buzsáki (Cluster A).',
        },
        certainty: { nl: 'Middel–Hoog', en: 'Medium–High' },
        certaintyLevel: 'Middel-Hoog',
      },
      {
        id: 'b5',
        author: 'Fuchs (2018)',
        titleAndJournal: {
          nl: '4E-cognitie / inter-affectieve resonantie · Ecology of the Brain',
          en: '4E cognition / inter-affective resonance · Ecology of the Brain',
        },
        underpins: {
          nl: 'Het brein als orgaan van resonantie tussen belichaamd organisme en omgeving. Onderbouwt de co-regulatie van de Relational-groep (Lover/Caregiver) en de "verlengde geest"-buffer.',
          en: 'The brain as an organ of resonance between embodied organism and environment. Underpins the co-regulation of the Relational group (Lover/Caregiver) and the "extended mind" buffer.',
        },
        deviation: {
          nl: 'Een theoretische synthese: resonantie is goed gemotiveerd maar los geoperationaliseerd. We laten het de fenomenologische kant van co-regulatie dragen — het aanvult, vervangt niet, de synchronie-ankers.',
          en: 'A theoretical synthesis: resonance is well motivated but loosely operationalised. We let it carry the phenomenological side of co-regulation — it complements, it does not replace, the synchrony anchors.',
        },
        crossRelation: {
          nl: 'Paart met de synchronie-metingen (Cluster K) als de invoelbare kant van hetzelfde mechanisme.',
          en: 'Pairs with the synchrony measures (Cluster K) as the felt side of the same mechanism.',
        },
        certainty: { nl: 'Middel', en: 'Medium' },
        certaintyLevel: 'Middel',
      },
      {
        id: 'b6',
        author: 'Robertson & Ivry (1998)',
        titleAndJournal: {
          nl: 'Dubbele filtering door frequentie · The Two Sides of Perception',
          en: 'Dual filtering by frequency · The Two Sides of Perception',
        },
        underpins: {
          nl: 'Rechterhemisfeer → globale/contextuele waarneming; linker → lokaal/detail. Mechanistisch anker voor de rechts-bias van de Perceptie-functie, met precisie op perceptueel niveau.',
          en: 'Right hemisphere → global/contextual perception; left → local/detail. Mechanistic anchor for the right-bias of the Perception function, precise at the perceptual level.',
        },
        deviation: {
          nl: 'Het perceptuele mechanisme is stevig — maar we trekken het bewust níét door naar de brede "hemisferisch karakter"-claims (à la McGilchrist). Dat zou over-extensie zijn.',
          en: 'The perceptual mechanism is solid — but we deliberately do not extend it to the broad "hemispheric character" claims (à la McGilchrist). That would be over-extension.',
        },
        crossRelation: {
          nl: 'De bredere hemisfeer-generalisatie houden we apart op Middel.',
          en: 'We keep the broader hemisphere generalisation separate, at Medium.',
        },
        certainty: { nl: 'Hoog (op perceptueel niveau)', en: 'High (at the perceptual level)' },
        certaintyLevel: 'Hoog',
      },
      {
        id: 'b7',
        author: 'Juarrero (2023)',
        titleAndJournal: {
          nl: 'Contextuele beperkingen · Context Changes Everything',
          en: 'Contextual constraints · Context Changes Everything',
        },
        underpins: {
          nl: 'Identiteit- en support-netwerken leggen top-down beperkingen op in plaats van directe oorzaken — de formele rechtvaardiging van de Component-C-methodiek (C als begrenzing, niet als kracht).',
          en: 'Identity and support networks impose top-down constraints rather than direct causes — the formal justification of the Component-C methodology (C as constraint, not as force).',
        },
        deviation: {
          nl: '— (filosofisch anker, geen empirische claim; het is de methodologische rechtvaardiging zelf)',
          en: '— (philosophical anchor, not an empirical claim; it is the methodological justification itself)',
        },
        crossRelation: {
          nl: 'Draagt de "vrijgegeven-niet-gepoort"-logica: support beperkt vrijgegeven functies, dwingt ze niet af.',
          en: 'Carries the "released-not-gated" logic: support constrains released functions, it does not force them.',
        },
        certainty: {
          nl: 'Hoog voor de C-logica (methodologisch); mechanisme n.v.t.',
          en: 'High for the C-logic (methodological); mechanism n/a',
        },
        certaintyLevel: 'Hoog',
      },
    ],
  },
  {
    id: 'H',
    name: 'Cluster H',
    subtitle: {
      nl: 'Elektromagnetische / oscillatoire binding — hoe het systeem samenhangt: het bindingsmechanisme dat losse activiteit tot één toestand maakt. Een bewust begrensd paar — van behoudend tot speculatief, nooit één zonder de ander.',
      en: 'Electromagnetic / oscillatory binding — how the system coheres: the binding mechanism that turns scattered activity into a single state. A deliberately bounded pair — from conservative to speculative, never one without the other.',
    },
    sources: [
      {
        id: 'h1',
        author: 'Buzsáki & Wang (2012)',
        titleAndJournal: {
          nl: 'Kruis-frequentie-koppeling / gamma-mechanismen · Annual Review of Neuroscience',
          en: 'Cross-frequency coupling / gamma mechanisms · Annual Review of Neuroscience',
        },
        underpins: {
          nl: 'De oscillatoire hiërarchie als het rigoureuze empirische substraat voor informatie-binding: theta-fase moduleert gamma-amplitude over hippocampaal–corticale circuits.',
          en: 'The oscillatory hierarchy as the rigorous empirical substrate for information binding: theta phase modulates gamma amplitude across hippocampal–cortical circuits.',
        },
        deviation: {
          nl: '— (stevig empirisch; geen materiële afwijking — dit is het behoudende anker van het paar)',
          en: '— (solidly empirical; no material deviation — this is the conservative anchor of the pair)',
        },
        crossRelation: {
          nl: 'Gepaard met McFadden om de EM-vraag te begrenzen; los geciteerd zou het de speculatieve kant niet dekken.',
          en: 'Paired with McFadden to bound the EM question; cited alone it would not cover the speculative side.',
        },
        certainty: { nl: 'Hoog', en: 'High' },
        certaintyLevel: 'Hoog',
      },
      {
        id: 'h2',
        author: 'McFadden (2020)',
        titleAndJournal: {
          nl: 'CEMI-veldtheorie · Neuroscience of Consciousness',
          en: 'CEMI field theory · Neuroscience of Consciousness',
        },
        underpins: {
          nl: 'Het endogene EM-veld van het brein als bindings-/bewustzijnssubstraat — de speculatief-theoretische tegenhanger van Buzsáki & Wangs oscillatoire koppeling.',
          en: 'The brain’s endogenous EM field as a binding/consciousness substrate — the speculative-theoretical counterpart to Buzsáki & Wang’s oscillatory coupling.',
        },
        deviation: {
          nl: 'Expliciet de speculatieve kant. We citeren dit nooit alleen als bindingsmechanisme — het hoort altijd náást het behoudende anker, als de bovengrens van wat denkbaar is, niet van wat vaststaat.',
          en: 'Explicitly the speculative side. We never cite this alone as a binding mechanism — it always belongs next to the conservative anchor, as the upper bound of what is conceivable, not of what is established.',
        },
        crossRelation: {
          nl: 'Begrenst de EM-vraag samen met Buzsáki & Wang; draagt geen celwaarde alleen.',
          en: 'Bounds the EM question together with Buzsáki & Wang; bears no cell value on its own.',
        },
        certainty: {
          nl: 'Laag–Middel (peer-reviewed maar omstreden)',
          en: 'Low–Medium (peer-reviewed but contested)',
        },
        certaintyLevel: 'Laag',
      },
    ],
  },
  {
    id: 'I',
    name: 'Cluster I',
    subtitle: {
      nl: 'Bewustzijnstheorie (equivoque gehouden) — een levend theoretisch anker, geen onderschrijving, gehouden op precies de rand van wat het veld heeft beslist. Hier toont het model zijn discipline het scherpst: het houdt een theorie open in plaats van haar te kiezen.',
      en: 'Consciousness theory (held equivocal) — a live theoretical anchor, not an endorsement, held at exactly the edge of what the field has decided. Here the model shows its discipline most sharply: it keeps a theory open rather than choosing it.',
    },
    sources: [
      {
        id: 'i1',
        author: 'Albantakis & Tononi e.a. (2023)',
        titleAndJournal: {
          nl: 'Integrated Information Theory 4.0 · IIT 4.0',
          en: 'Integrated Information Theory 4.0 · IIT 4.0',
        },
        underpins: {
          nl: 'Bewustzijn als maximaal-onherleidbare oorzaak-gevolg-structuur; fenomenale axioma\'s geformaliseerd als eisen waaraan een substraat moet voldoen. Levert de geometrische vorm van ervaring.',
          en: 'Consciousness as a maximally irreducible cause-effect structure; phenomenal axioms formalised as requirements a substrate must meet. Supplies the geometric form of experience.',
        },
        deviation: {
          nl: 'Gehouden als levend theoretisch anker zónder onderschrijving — momenteel veld-equivoque. Het is geen anker voor enige celwaarde; het exclusie-postulaat verwerpen we zelfs expliciet (zie C2/F4 in het Frame).',
          en: 'Held as a live theoretical anchor without endorsement — currently field-equivocal. It is not an anchor for any cell value; we even explicitly reject the exclusion postulate (see C2/F4 in the Frame).',
        },
        crossRelation: {
          nl: 'Moet samen met Cogitate gelezen worden; nooit een anker voor een celwaarde.',
          en: 'Must be read together with Cogitate; never an anchor for a cell value.',
        },
        certainty: {
          nl: 'Equivoque gehouden — geen onderschrijving',
          en: 'Held equivocal — no endorsement',
        },
        certaintyLevel: 'Equivoque',
      },
      {
        id: 'i2',
        author: 'Cogitate Consortium (2025)',
        titleAndJournal: {
          nl: 'Adversariële test IIT vs GNWT · Adversarial testing',
          en: 'Adversarial test IIT vs GNWT · Adversarial testing',
        },
        underpins: {
          nl: 'Een vooraf-geregistreerde, theorie-neutrale, multicentrische adversariële test (>250 deelnemers; iEEG+fMRI+MEG). Gemengd resultaat — IIT\'s voorspelling van aanhoudende synchronisatie faalde.',
          en: 'A pre-registered, theory-neutral, multi-site adversarial test (>250 participants; iEEG+fMRI+MEG). Mixed result — IIT’s prediction of sustained synchronisation failed.',
        },
        deviation: {
          nl: 'Het empirische resultaat is Hoog; de implicatie voor ons is: houd IIT open. De methodologische les — adversariële samenwerking — telt voor het project mogelijk zwaarder dan het bewustzijns-oordeel zelf.',
          en: 'The empirical result is High; the implication for us is: keep IIT open. The methodological lesson — adversarial collaboration — may matter to the project more than the consciousness verdict itself.',
        },
        crossRelation: {
          nl: 'Bevestigt de equivoque status van IIT empirisch.',
          en: 'Empirically confirms the equivocal status of IIT.',
        },
        certainty: {
          nl: 'Resultaat Hoog · implicatie: open houden',
          en: 'Result High · implication: keep open',
        },
        certaintyLevel: 'Hoog',
      },
    ],
  },
  {
    id: 'J',
    name: 'Cluster J',
    subtitle: {
      nl: 'Stress-neuroplasticiteit — de diepste micro-laag: het cellulaire substraat van de instorting. Waar de spannings-curve van D3 naar D5 valt, gebeurt dit fysiek — in synapsen, dendrieten, circuits. Hoog-vertrouwen, empirisch; de stevigste grond van het hele bouwwerk.',
      en: 'Stress neuroplasticity — the deepest micro-layer: the cellular substrate of the collapse. Where the tension curve falls from D3 to D5, this happens physically — in synapses, dendrites, circuits. High-confidence, empirical; the firmest ground of the whole structure.',
    },
    sources: [
      {
        id: 'j1',
        author: 'Levin (2019)',
        titleAndJournal: {
          nl: "Teleologische bio-elektriciteit · The computational boundary of a 'self'",
          en: "Teleological bioelectricity · The computational boundary of a 'self'",
        },
        underpins: {
          nl: 'Verankert psychologische drijfveren (bijv. de orde-behoefte van de Ruler) omlaag in cellulaire/weefsel-doelen — bio-elektrisch patroon als proto-doel. Sluit de multischaal-lus aan de onderkant.',
          en: 'Anchors psychological drives (e.g. the Ruler’s need for order) downward into cellular/tissue goals — bioelectric pattern as proto-goal. Closes the multiscale loop at the bottom.',
        },
        deviation: {
          nl: 'Het cellulaire bewijs is sterk; de sprong naar psychologische drive is interpretatieve steiger. We laten de bio-elektriciteit dragen wat ze meet, en benoemen de sprong omhoog als sprong.',
          en: 'The cellular evidence is strong; the leap to psychological drive is interpretive scaffolding. We let the bioelectricity carry what it measures, and name the leap upward as a leap.',
        },
        crossRelation: {
          nl: 'Paart met Verlinde (Cluster E) die de lus aan de bovenkant sluit.',
          en: 'Pairs with Verlinde (Cluster E) which closes the loop at the top.',
        },
        certainty: {
          nl: 'Hoog op bio-elektrisch niveau · psychologische extrapolatie is analoog',
          en: 'High at the bioelectric level · the psychological extrapolation is analogical',
        },
        certaintyLevel: 'Hoog',
      },
      {
        id: 'j2',
        author: 'Russo & Nestler (2013)',
        titleAndJournal: {
          nl: 'Stress-geïnduceerde plasticiteit van beloning/stemming · Nature Reviews Neuroscience',
          en: 'Stress-induced plasticity of reward/mood · Nature Reviews Neuroscience',
        },
        underpins: {
          nl: 'Chronische sociale-nederlaag-stress drijft glutamaterge synaptische aanpassing + BDNF-TrkB-veranderingen in de VTA-NAc-route — het maladaptieve-plasticiteit-substraat van de curve-afdaling.',
          en: 'Chronic social-defeat stress drives glutamatergic synaptic adaptation + BDNF-TrkB changes in the VTA-NAc pathway — the maladaptive-plasticity substrate of the curve’s descent.',
        },
        deviation: {
          nl: 'Knaagdier-model-basis; menselijke extrapolatie is de standaard van het veld — we volgen die standaard en benoemen de basis.',
          en: 'Rodent-model basis; human extrapolation is the field standard — we follow that standard and name the basis.',
        },
        crossRelation: {
          nl: 'Onderbouwt het fysieke mechanisme onder D3→D5.',
          en: 'Underpins the physical mechanism under D3→D5.',
        },
        certainty: { nl: 'Hoog', en: 'High' },
        certaintyLevel: 'Hoog',
      },
      {
        id: 'j3',
        author: 'Shansky e.a. (2009)',
        titleAndJournal: {
          nl: 'Circuit-specifieke dendritische hermodellering in mPFC · Stress-Induced Dendritic Remodeling',
          en: 'Circuit-specific dendritic remodeling in mPFC · Stress-Induced Dendritic Remodeling',
        },
        underpins: {
          nl: 'De fysieke structurele kost bij D3–D5: dendrieten trekken zich circuit-specifiek terug. De verandering is echte architectuur, geen louter signalering.',
          en: 'The physical structural cost at D3–D5: dendrites retract in a circuit-specific way. The change is real architecture, not mere signalling.',
        },
        deviation: {
          nl: '— (geen materiële afwijking; een van de stevigste ankers)',
          en: '— (no material deviation; one of the firmest anchors)',
        },
        crossRelation: {
          nl: 'Geeft de letterlijke structurele kost achter de curve.',
          en: 'Gives the literal structural cost behind the curve.',
        },
        certainty: { nl: 'Hoog', en: 'High' },
        certaintyLevel: 'Hoog',
      },
      {
        id: 'j4',
        author: 'Duman & Aghajanian (2012)',
        titleAndJournal: {
          nl: 'Synaptisch verlies bij depressie / herstel-synaptogenese · Synaptic Dysfunction in Depression',
          en: 'Synaptic loss in depression / recovery synaptogenesis · Synaptic Dysfunction in Depression',
        },
        underpins: {
          nl: 'Het D5-gebied van synaptisch verlies, en het herstelmechanisme/de tijdschaal (weken–maanden typisch; snelle synaptogenese de uitzondering).',
          en: 'The D5 region of synaptic loss, and the recovery mechanism/timescale (weeks–months typically; rapid synaptogenesis the exception).',
        },
        deviation: { nl: '— (geen materiële afwijking)', en: '— (no material deviation)' },
        crossRelation: {
          nl: 'Grondt de bodem van de curve én het herstelpad eruit.',
          en: 'Grounds the floor of the curve and the recovery path out of it.',
        },
        certainty: { nl: 'Hoog', en: 'High' },
        certaintyLevel: 'Hoog',
      },
    ],
  },
  {
    id: 'K',
    name: 'Cluster K',
    subtitle: {
      nl: 'Relationele co-regulatie — terug naar buiten: twee zenuwstelsels die koppelen. De meetbare kant van verbinding — en het scherpste voorbeeld van de wet onder de tabel, want hier hebben we een bron actief verplaatst.',
      en: 'Relational co-regulation — back outward: two nervous systems coupling. The measurable side of connection — and the sharpest example of the law beneath the table, because here we have actively relocated a source.',
    },
    sources: [
      {
        id: 'k1',
        author: 'Porges (2011)',
        titleAndJournal: {
          nl: 'Polyvagaaltheorie — VERPLAATST · The Polyvagal Theory',
          en: 'Polyvagal theory — RELOCATED · The Polyvagal Theory',
        },
        underpins: {
          nl: 'Het ventraal-vagale sociale-betrokkenheids-verhaal van relationele co-regulatie.',
          en: 'The ventral-vagal social-engagement account of relational co-regulation.',
        },
        deviation: {
          nl: 'VERPLAATST onder Rosetta v1.1. Behouden voor herkomst, niet als levend anker. We citeren het niet meer als mechanisme; resterende "ventraal-vagale" termen in matrix-sporen zijn herschreven naar "vagaal-gemedieerd / HRV-synchronie." Dit is het model dat zichzelf corrigeert — de verplaatsing is zichtbaar, niet weggepoetst.',
          en: 'RELOCATED under Rosetta v1.1. Kept for provenance, not as a live anchor. We no longer cite it as a mechanism; remaining "ventral-vagal" terms in matrix traces are rewritten to "vagally mediated / HRV synchrony." This is the model correcting itself — the relocation is visible, not papered over.',
        },
        crossRelation: {
          nl: 'Vervangen door Coutinho; de verplaatsing zelf wordt gerechtvaardigd door Grossman.',
          en: 'Replaced by Coutinho; the relocation itself is justified by Grossman.',
        },
        certainty: {
          nl: 'Verplaatst — geen mechanisme-anker meer',
          en: 'Relocated — no longer a mechanism anchor',
        },
        certaintyLevel: 'Verplaatst',
      },
      {
        id: 'k2',
        author: 'Grossman (2023)',
        titleAndJournal: {
          nl: 'Weerlegging van polyvagale premissen · Fundamental challenges...',
          en: 'Refutation of polyvagal premises · Fundamental challenges...',
        },
        underpins: {
          nl: 'De rechtvaardiging voor de verplaatsing: stelt vast dat het polyvagale mechanisme-verhaal weerlegd is, wat de her-verankering van co-regulatie vergunt.',
          en: 'The justification for the relocation: it establishes that the polyvagal mechanism account is refuted, which licenses the re-anchoring of co-regulation.',
        },
        deviation: {
          nl: 'Cruciaal onderscheid: het weerlegt het mechanisme, niet het verschijnsel van co-regulatie. Dat onderscheid is de hele basis waarom de her-verankering dezelfde celwaarden mocht behouden.',
          en: 'Crucial distinction: it refutes the mechanism, not the phenomenon of co-regulation. That distinction is the whole basis for why the re-anchoring could keep the same cell values.',
        },
        crossRelation: {
          nl: 'Onderbouwt de verplaatsing van Porges.',
          en: 'Underpins the relocation of Porges.',
        },
        certainty: {
          nl: 'Hoog (consensus-conforme fysiologische kritiek)',
          en: 'High (consensus-conforming physiological critique)',
        },
        certaintyLevel: 'Hoog',
      },
      {
        id: 'k3',
        author: 'Coutinho e.a. (2021)',
        titleAndJournal: {
          nl: 'Cardiale synchronie als dyadische co-regulatie · When our hearts beat together',
          en: 'Cardiac synchrony as dyadic co-regulation · When our hearts beat together',
        },
        underpins: {
          nl: 'Het vervangende anker voor relationele co-regulatie: dyadische co-regulatie gemeten via interpersoonlijke HR/HRV-koppeling tussen mensen.',
          en: 'The replacement anchor for relational co-regulation: dyadic co-regulation measured via interpersonal HR/HRV coupling between people.',
        },
        deviation: {
          nl: 'Beter onderbouwd dan het verplaatste polyvagale model, maar we dragen het met een bewuste verlaagde-zekerheid-markering.',
          en: 'Better supported than the relocated polyvagal model, but we carry it with a deliberate reduced-certainty flag.',
        },
        crossRelation: {
          nl: 'Falsifieert: ongeldig als interpersoonlijke HR/HRV-koppeling niet blijkt samen te hangen met co-regulatie-uitkomsten.',
          en: 'Falsifies: invalid if interpersonal HR/HRV coupling turns out not to relate to co-regulation outcomes.',
        },
        certainty: {
          nl: 'Hoog (beter dan het verplaatste anker) · met verlaagde-zekerheid-vlag',
          en: 'High (better than the relocated anchor) · with a reduced-certainty flag',
        },
        certaintyLevel: 'Middel-Hoog',
      },
      {
        id: 'k4',
        author: 'Palumbo e.a. (2017)',
        titleAndJournal: {
          nl: 'Interpersoonlijke autonome fysiologie (review) · Interpersonal Autonomic Physiology',
          en: 'Interpersonal autonomic physiology (review) · Interpersonal Autonomic Physiology',
        },
        underpins: {
          nl: 'De systematische-review-onderbouwing dat interpersoonlijke fysiologische synchronie een echte, meetbare klasse van verschijnselen is over relatie-contexten heen.',
          en: 'The systematic-review support that interpersonal physiological synchrony is a real, measurable class of phenomena across relationship contexts.',
        },
        deviation: {
          nl: 'De review vestigt de breedte van het verschijnsel; effectgrootte-heterogeniteit tussen studies benoemen we — niet elke studie meet hetzelfde even sterk.',
          en: 'The review establishes the breadth of the phenomenon; we name the effect-size heterogeneity between studies — not every study measures the same thing equally strongly.',
        },
        crossRelation: {
          nl: "Onderbouwt de breedte achter Coutinho's anker.",
          en: "Underpins the breadth behind Coutinho's anchor.",
        },
        certainty: {
          nl: 'Hoog als review-niveau steun',
          en: 'High as review-level support',
        },
        certaintyLevel: 'Hoog',
      },
    ],
  },
  {
    id: 'D',
    name: 'Cluster D',
    subtitle: {
      nl: 'Ontwikkeling & rijping — de levensloop-schaal: hoe de geconfigureerde zelf door stadia verandert. De tijd-as die de spannings-curve een geschiedenis geeft.',
      en: 'Development & maturation — the life-course scale: how the configured self changes through stages. The time axis that gives the tension curve a history.',
    },
    sources: [
      {
        id: 'd1',
        author: 'Piaget (1970)',
        titleAndJournal: {
          nl: 'Genetische epistemologie · Genetic Epistemology',
          en: 'Genetic epistemology · Genetic Epistemology',
        },
        underpins: {
          nl: 'Assimilatie/accommodatie als het ontwikkelings-substraat voor archetype-rijping; het formeel-operationele stadium verankert het cognitieve plafond van de Gele Driehoeken.',
          en: 'Assimilation/accommodation as the developmental substrate for archetype maturation; the formal-operational stage anchors the cognitive ceiling of the Yellow Triangles.',
        },
        deviation: {
          nl: 'We gebruiken de volgorde, niet de starre leeftijd-stadium-timing. De strikte stadiumgrenzen zijn door neo-Piagetiaans werk achterhaald; de sequentie houdt, de leeftijdsklok niet.',
          en: 'We use the sequence, not the rigid age-stage timing. The strict stage boundaries are outdated by neo-Piagetian work; the sequence holds, the age clock does not.',
        },
        crossRelation: {
          nl: 'Onderbouwt de rijpings-as; paart met Kegan als volwassen-vervolg.',
          en: 'Underpins the maturation axis; pairs with Kegan as the adult continuation.',
        },
        certainty: {
          nl: 'Middel–Hoog (sequentie robuust; starre grenzen achterhaald)',
          en: 'Medium–High (sequence robust; rigid boundaries outdated)',
        },
        certaintyLevel: 'Middel-Hoog',
      },
      {
        id: 'd2',
        author: 'Kegan (1994)',
        titleAndJournal: {
          nl: 'Constructief-ontwikkelingstheorie · In Over Our Heads',
          en: 'Constructive-developmental theory · In Over Our Heads',
        },
        underpins: {
          nl: 'Bewustzijns-ordes als het volwassen vervolg op Piaget; brengt schaduw-integratie-trajecten in kaart (groeps-ingebedde versus zelf-auteurende expressie).',
          en: 'Orders of consciousness as the adult continuation of Piaget; maps shadow-integration trajectories (group-embedded versus self-authoring expression).',
        },
        deviation: {
          nl: 'We brengen dit op de individuatie-boog in kaart als analoog, niet als een gemeten traject — de meting is interview-gebaseerd en interpretatief.',
          en: 'We map this onto the individuation arc as an analogy, not as a measured trajectory — the measurement is interview-based and interpretive.',
        },
        crossRelation: {
          nl: 'Verlengt Piaget naar volwassenheid; analoog voor de schaduw-integratie-boog.',
          en: 'Extends Piaget into adulthood; an analogue for the shadow-integration arc.',
        },
        certainty: {
          nl: 'Middel (ordening goed gemotiveerd; meting interpretatief)',
          en: 'Medium (ordering well motivated; measurement interpretive)',
        },
        certaintyLevel: 'Middel',
      },
    ],
  },
  {
    id: 'G',
    name: 'Cluster G',
    subtitle: {
      nl: 'Psychodynamiek, empirisch getrieerd — de geïntegreerde persoon: psychodynamische inzichten, gefilterd op precies wat het bewijs draagt en wat niet.',
      en: 'Psychodynamics, empirically triaged — the integrated person: psychodynamic insights, filtered on exactly what the evidence carries and what it does not.',
    },
    sources: [
      {
        id: 'g1',
        author: 'Westen (1999)',
        titleAndJournal: {
          nl: 'Wetenschappelijke status van onbewuste processen · Is Freud Really Dead?',
          en: 'Scientific status of unconscious processes · Is Freud Really Dead?',
        },
        underpins: {
          nl: 'De empirische triage van psychodynamische mechanismen — welke steun hebben (onbewuste verwerking, afweer, overdracht, conflict) en welke niet (de klassieke drifttheorie). Wij nemen alleen het ondersteunde deel.',
          en: 'The empirical triage of psychodynamic mechanisms — which have support (unconscious processing, defence, transference, conflict) and which do not (classical drive theory). We take only the supported part.',
        },
        deviation: {
          nl: 'Vintage 1999: de brede triage houdt, maar specifiek mechanisme-bewijs is sindsdien bewogen. We dragen het als het triage-kader, en verversen de details waar nodig — niet als laatste woord.',
          en: 'Vintage 1999: the broad triage holds, but specific mechanism evidence has moved since. We carry it as the triage framework, and refresh the details where needed — not as the last word.',
        },
        crossRelation: {
          nl: 'Paart met Solms (Cluster B) als empirische evaluatie-laag; filtert wat van Freud overeind blijft.',
          en: 'Pairs with Solms (Cluster B) as the empirical evaluation layer; filters what of Freud still stands.',
        },
        certainty: {
          nl: 'Hoog (als triage-autoriteit) · details verversbaar',
          en: 'High (as a triage authority) · details refreshable',
        },
        certaintyLevel: 'Hoog',
      },
    ],
  },
  {
    id: 'F',
    name: 'Cluster F',
    subtitle: {
      nl: 'Emergentie op de drempel — de coda: hoe niveaus nieuwe niveaus worden. Het schaal-sprong-principe dat de hele lus sluit, en de plek waar het model het strengst is over zijn eigen liefste idee. Het paar Wei«»Schaeffer is verplicht: één ervan alleen citeren is misbruik.',
      en: 'Emergence at the threshold — the coda: how levels become new levels. The scale-jump principle that closes the whole loop, and the place where the model is strictest about its own favourite idea. The Wei«»Schaeffer pair is mandatory: citing one alone is misuse.',
    },
    sources: [
      {
        id: 'f1',
        author: 'Wei e.a. (2022)',
        titleAndJournal: {
          nl: "Emergente vermogens van LLM's · Emergent Abilities of Large Language Models",
          en: 'Emergent abilities of LLMs · Emergent Abilities of Large Language Models',
        },
        underpins: {
          nl: 'Niet-lineaire capaciteits-fase-overgangen bij schaal-drempels — het directe analoog voor de fase-mechanica van de spannings-curve (zelfde niet-lineaire-overgang-logica, ander substraat).',
          en: 'Non-linear capability phase transitions at scale thresholds — the direct analogue for the phase mechanics of the tension curve (same non-linear-transition logic, different substrate).',
        },
        deviation: {
          nl: 'De "emergentie"-claim is op metriek-niveau omstreden; we houden hem alleen als gepaarde spanning, nooit als bevestiging op zichzelf.',
          en: 'The "emergence" claim is contested at the metric level; we keep it only as a paired tension, never as confirmation on its own.',
        },
        crossRelation: { nl: 'Moet met Schaeffer gelezen worden.', en: 'Must be read with Schaeffer.' },
        certainty: {
          nl: 'Middel — alleen als deel van het paar',
          en: 'Medium — only as part of the pair',
        },
        certaintyLevel: 'Middel',
      },
      {
        id: 'f2',
        author: 'Schaeffer, Miranda & Koyejo (2023)',
        titleAndJournal: {
          nl: 'De "luchtspiegeling"-weerlegging · Are Emergent Abilities a Mirage?',
          en: 'The "mirage" refutation · Are Emergent Abilities a Mirage?',
        },
        underpins: {
          nl: 'Emergentie als artefact van niet-lineaire metriek-keuze, niet als echte fase-overgang. De vereiste tegenkracht tegen Wei — toetst of enige "fase-overgang"-claim (LLM óf archetype) standhoudt.',
          en: 'Emergence as an artefact of non-linear metric choice, not a real phase transition. The required counterforce to Wei — it tests whether any "phase-transition" claim (LLM or archetype) holds up.',
        },
        deviation: {
          nl: 'We omarmen deze weerlegging als noodzakelijke discipline. Het paar Wei«»Schaeffer is structureel verplicht; één ervan alleen citeren is misbruik — dat is de regel die we onszelf opleggen.',
          en: 'We embrace this refutation as necessary discipline. The Wei«»Schaeffer pair is structurally mandatory; citing one alone is misuse — that is the rule we impose on ourselves.',
        },
        crossRelation: {
          nl: 'Toetst elke fase-overgang-claim in het model, inclusief de onze.',
          en: 'Tests every phase-transition claim in the model, including our own.',
        },
        certainty: {
          nl: 'Hoog als methodologische waarschuwing',
          en: 'High as a methodological caution',
        },
        certaintyLevel: 'Hoog',
      },
      {
        id: 'f3',
        author: 'Templeton e.a., Anthropic (2024)',
        titleAndJournal: {
          nl: 'Schaling van monosemanticiteit · Scaling Monosemanticity',
          en: 'Scaling monosemanticity · Scaling Monosemanticity',
        },
        underpins: {
          nl: 'Interpreteerbare kenmerken emergeren op schaal binnen een superpositie-substraat; identificeerbare circuits kristalliseren bij een drempel. Een empirische greep op wat emergentie-op-de-drempel kan betekenen.',
          en: 'Interpretable features emerge at scale within a superposition substrate; identifiable circuits crystallise at a threshold. An empirical grip on what emergence-at-the-threshold can mean.',
        },
        deviation: {
          nl: 'Analogie over substraten heen; geen claim over menselijke archetypen direct. De archetype-attractor-analogie is interpretatief, en we benoemen haar als analogie.',
          en: 'An analogy across substrates; no direct claim about human archetypes. The archetype-attractor analogy is interpretive, and we name it as an analogy.',
        },
        crossRelation: {
          nl: 'Geeft een empirisch handvat bij het emergentie-paar.',
          en: 'Gives an empirical handle alongside the emergence pair.',
        },
        certainty: {
          nl: 'Middel–Hoog (als interpreteerbaarheids-resultaat) · analogie interpretatief',
          en: 'Medium–High (as an interpretability result) · analogy interpretive',
        },
        certaintyLevel: 'Middel-Hoog',
      },
    ],
  },
];

export default clustersData;
