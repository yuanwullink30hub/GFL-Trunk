import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, BookOpen, Send, CheckCircle2, MessageSquare, Plus, Trash2,
  ClipboardList, ChevronDown, ChevronUp, Layers, Sparkles,
} from 'lucide-react';
import { clustersData } from './referencesData';
import { sendContactForm } from '@gfl/api-client';
import { useLanguage } from '@gfl/i18n';

// Resolve a { nl, en } value (or plain string) against the active language.
const L = (v, lang) => (v && typeof v === 'object' && !Array.isArray(v)) ? (v[lang] ?? v.nl ?? '') : v;

// Display labels for the certainty badge (logic still keys off the canonical Dutch level).
const CERTAINTY_LABELS = {
  'Hoog': { nl: 'Hoog', en: 'High' },
  'Middel-Hoog': { nl: 'Middel-Hoog', en: 'Medium–High' },
  'Middel': { nl: 'Middel', en: 'Medium' },
  'Laag': { nl: 'Laag', en: 'Low' },
  'Omstreden': { nl: 'Omstreden', en: 'Contested' },
  'Equivoque': { nl: 'Equivoque', en: 'Equivocal' },
  'Verplaatst': { nl: 'Verplaatst', en: 'Relocated' },
};

// Interface chrome strings (headers, labels, placeholders, buttons, alerts, banners).
const UI = {
  methodologyHeader: { nl: 'Onze Methodologische Eerlijkheid', en: 'Our Methodological Honesty' },
  showDetails: { nl: 'Toon details', en: 'Show details' },
  hideDetails: { nl: 'Verberg details', en: 'Hide details' },
  methodologyLead: {
    nl: 'Wat hieronder staat is geen bibliografie — het is de manier waarop het model zijn eigen fundament behandelt, en dat is dezelfde manier waarop het jou leest.',
    en: 'What follows is not a bibliography — it is the way the model treats its own foundation, and that is the same way it reads you.',
  },
  allClusters: { nl: 'Alle Clusters', en: 'All clusters' },
  ownEntry: { nl: 'Eigen Invoer', en: 'Own entries' },
  allClustersTitle: { nl: 'Alle Wetenschappelijke Clusters', en: 'All scientific clusters' },
  allClustersSubtitle: {
    nl: 'Totaaloverzicht van alle neurobiologische en psychologische fundamenten',
    en: 'Complete overview of all neurobiological and psychological foundations',
  },
  ownEntrySubtitle: {
    nl: 'Handmatige toevoegingen en alternatieve hypothesen ter lezing',
    en: 'Manual additions and alternative hypotheses for reading',
  },
  searchPlaceholder: { nl: 'Doorzoek bronnen, claims of afwijkingen...', en: 'Search sources, claims or deviations...' },
  colBron: { nl: 'Bron', en: 'Source' },
  colSource: { nl: 'Referentie', en: 'Reference' },
  colUnderpins: { nl: 'Wat het onderbouwt', en: 'What it underpins' },
  colDeviation: { nl: 'Waar wij afwijken (en waarom)', en: 'Where we deviate (and why)' },
  colCross: { nl: 'Kruisrelatie / Falsifieert', en: 'Cross-relation / Falsifies' },
  colCertainty: { nl: 'Zekerheid', en: 'Certainty' },
  noResults: { nl: '{tr(UI.noResults)}', en: 'No sources found matching your criteria.' },
  remove: { nl: 'Verwijder', en: 'Remove' },
  showDetailsBracket: { nl: '[+ Toon Details]', en: '[+ Show details]' },
  hideDetailsBracket: { nl: '[- Verberg Details]', en: '[- Hide details]' },
  labelUnderpins: { nl: 'Wat het onderbouwt:', en: 'What it underpins:' },
  labelDeviation: { nl: 'Waar wij afwijken (en waarom):', en: 'Where we deviate (and why):' },
  labelCross: { nl: 'Kruisrelatie / Falsifieert:', en: 'Cross-relation / Falsifies:' },
  labelCertainty: { nl: 'Zekerheids-toelichting:', en: 'Certainty note:' },
  tabDialoog: { nl: 'Dialoog', en: 'Dialogue' },
  tabBron: { nl: 'Nieuwe bron', en: 'New source' },
  typeDialoog: { nl: 'Gewikkeld in deze materie? We willen graag in contact met je staan! ', en: 'Caught up in this material? We would love to get in touch with you! ' },
  typeBron: { nl: 'Adviseer ons over de kennis die jij kan onderbouwen, je helpt jezelf, ons en de wereld ermee!', en: 'Advise us on the knowledge you can substantiate — you help yourself, us and the world with it!' },
  fieldName: { nl: 'Naam', en: 'Name' },
  fieldEmail: { nl: 'E-mailadres', en: 'Email address' },
  fieldEmailReq: { nl: 'E-mailadres *', en: 'Email address *' },
  phName: { nl: 'Uw naam', en: 'Your name' },
  phEmail: { nl: 'naam@organisatie.nl', en: 'name@organisation.com' },
  fieldSourceRef: { nl: 'Refererende bron (optioneel)', en: 'Referenced source (optional)' },
  phSourceRef: { nl: 'bijv. Friston (2010)', en: 'e.g. Friston (2010)' },
  fieldMessage: { nl: 'Bericht of Tegenwerping', en: 'Message or objection' },
  phMessage: { nl: 'Deel hier je inhoudelijke tegenwerping, commentaar of fysiologische onderbouwing...', en: 'Share your substantive objection, comment or physiological reasoning here...' },
  fieldAuthor: { nl: 'Auteur & Jaar *', en: 'Author & year *' },
  phAuthor: { nl: 'bijv. Friston, K. (2012)', en: 'e.g. Friston, K. (2012)' },
  fieldTitle: { nl: 'Titel & Tijdschrift', en: 'Title & journal' },
  phTitle: { nl: 'bijv. The Free-Energy Principle, Nature', en: 'e.g. The Free-Energy Principle, Nature' },
  fieldUnderpins: { nl: 'Wat het onderbouwt *', en: 'What it underpins *' },
  phUnderpins: { nl: 'Beschrijf concreet welke stelling of fysiologische laag dit onderbouwt...', en: 'Describe concretely which claim or physiological layer this underpins...' },
  send: { nl: 'Send', en: 'Send' },
  sending: { nl: 'Versturen...', en: 'Sending...' },
  // Alerts & fallbacks
  alertContactReq: { nl: 'Vul alstublieft ten minste uw e-mailadres en bericht in.', en: 'Please fill in at least your email address and message.' },
  alertContactOk: { nl: 'Hartelijk dank voor uw bijdrage! We nemen uw feedback zorgvuldig in beraad.', en: 'Thank you for your contribution! We will consider your feedback carefully.' },
  alertSendFail: { nl: 'Verzenden mislukt. Probeer het later opnieuw.', en: 'Sending failed. Please try again later.' },
  alertBronReq: { nl: 'Vul ten minste je e-mailadres, de auteur/referentie en de onderbouwing in.', en: 'Fill in at least your email address, the author/reference and the reasoning.' },
  alertBronOk: { nl: "Bedankt! Je bron-suggestie is verstuurd en staat hieronder onder 'Eigen Invoer'.", en: "Thank you! Your source suggestion has been sent and appears below under 'Own entries'." },
  fbTitle: { nl: 'Eigen handmatige toevoeging', en: 'Own manual addition' },
  fbDeviation: { nl: 'Geen bewuste afwijkingen gedocumenteerd.', en: 'No deliberate deviations documented.' },
  fbCross: { nl: 'Geen specifieke kruisrelaties opgegeven.', en: 'No specific cross-relations provided.' },
  fbCertainty: { nl: 'Zelfstandige toevoeging door gebruiker.', en: 'Independent addition by the user.' },
};

/**
 * Bronnen & Verantwoording — restyled to the GFL intro-card aesthetic:
 * purple (#a855f7) corner brackets/accents, green (#22c55e) headings,
 * slate body text, rounded-lg bg-slate-900/30 boxes. Layout/structure ported
 * from the AI-Studio ReferencesPanel; all zinc/white styling replaced.
 */

// Methodology "Toon details" content. Block forms: ['h', text] major heading,
// ['s', text] sub-heading, ['p', text] paragraph, ['a', label, text] anchor.
const METHODOLOGY_BLOCKS = [
  ['h', { nl: 'I. Het Frame — de ankers waar het model nooit van afwijkt', en: 'I. The Frame — the anchors the model never deviates from' }],
  ['p', { nl: 'Een klein aantal toewijdingen draagt de hele constructie. Niet als geloof, maar als werkend materiaal: elk anker is verankerd in de redenering, en elk blijft open voor herziening door bewijs op precies dat punt. Elke koude waarde die het model later uitleest, lost op tegen één of meer van deze. Eerst het frame, dan de bronnen die het verdienen.', en: 'A small number of commitments carries the whole construction. Not as belief, but as working material: each anchor is rooted in the reasoning, and each stays open to revision by evidence on exactly that point. Every cold value the model later reads out resolves against one or more of these. First the frame, then the sources that earn it.' }],
  ['p', { nl: 'Het frame heeft twee lagen. Onderaan ligt het fundament: wat de werkelijkheid is, vóór er iets cognitiefs over te zeggen valt. Daarboven liggen de cognitieve ankers: hoe een begrensde geest binnen dat fundament werkt. De tweede daalt af uit de eerste — macro naar micro, precies zoals ons hele frame is opgebouwd.', en: 'The frame has two layers. At the bottom lies the foundation: what reality is, before anything cognitive can be said about it. Above it lie the cognitive anchors: how a bounded mind works within that foundation. The second descends from the first — macro to micro, exactly as our whole frame is built.' }],
  ['s', { nl: 'I-A. Het fundament — geometrie, relatie, substraat', en: 'I-A. The foundation — geometry, relation, substrate' }],
  ['p', { nl: 'De wijdste schaal. Hier committeert het model alleen aan wat ofwel empirisch verankerd is, ofwel als expliciete metafysische positie wordt benoemd. Algoritmisch minimalisme: niets aannemen wat niet vereist is.', en: 'The widest scale. Here the model commits only to what is either empirically anchored or named as an explicit metaphysical position. Algorithmic minimalism: assume nothing that is not required.' }],
  ['a', 'P1', { nl: 'Geometrie is het patroon van relaties. Er zijn geen dingen-op-zichzelf met relaties er later aan toegevoegd. Relaties zijn primair; wat we objecten noemen, zijn stabiele patronen binnen de relationele structuur. Dit is de wortel van "relaties, geen substantie."', en: 'Geometry is the pattern of relations. There are no things-in-themselves with relations added later. Relations are primary; what we call objects are stable patterns within the relational structure. This is the root of "relations, not substance."' }],
  ['a', 'P2', { nl: 'Wiskunde wordt ontdekt, niet uitgevonden. Een Platonistische positie, hardop benoemd: wiskundige structuren (de taal van geometrie) bestaan onafhankelijk van menselijke cognitie. De convergentie tussen zuivere wiskunde en fysica is geen toeval maar herkenning van dezelfde structuur vanuit twee hoeken.', en: 'Mathematics is discovered, not invented. A Platonist position, named aloud: mathematical structures (the language of geometry) exist independently of human cognition. The convergence between pure mathematics and physics is not coincidence but recognition of the same structure from two angles.' }],
  ['a', 'P3', { nl: 'Bron en projectie zijn wederzijds transformatief. Geen van beide lagen is hiërarchische prior; geen is geïsoleerd van de ander. Gebeurtenissen hier reiken terug — de bron is niet onaangedaan door wat in de geprojecteerde laag gebeurt. Een chemische-reactie-structuur, geen eenrichtings-projectie.', en: 'Source and projection are mutually transformative. Neither layer is hierarchically prior; neither is isolated from the other. Events here reach back — the source is not untouched by what happens in the projected layer. A chemical-reaction structure, not a one-way projection.' }],
  ['a', 'P4', { nl: 'De vouwing ís de relatie, geen proces dat de relatie overkomt. Het raakvlak tussen lokaal patroon en globale structuur is geen apart mechanisme dat ze verbindt. De vouwing is de geometrische daad van het relateren zelf.', en: 'The folding is the relation, not a process that happens to the relation. The interface between local pattern and global structure is not a separate mechanism that connects them. The folding is the geometric act of relating itself.' }],
  ['a', 'P5', { nl: 'Bewustzijn en materie liggen op één spectrum. Niet twee categorieën maar één continuüm van relationele intensiteit of coherentie. Bewustzijn bezet de bovenste regionen, materie de onderste; de parameter is geometrisch — mogelijk integratie, mogelijk topologische complexiteit, mogelijk de diepte van zelf-referentie.', en: 'Consciousness and matter lie on one spectrum. Not two categories but one continuum of relational intensity or coherence. Consciousness occupies the upper regions, matter the lower; the parameter is geometric — possibly integration, possibly topological complexity, possibly the depth of self-reference.' }],
  ['a', 'P6', { nl: 'Wat het substraat níét is. Hier ligt het belangrijkste misverstand om voor te zijn: "substraat" betekent in dit model nooit "materie onderaan, de rest is daarvan afgeleid." Dat zou materialisme zijn — de positie dat geest niets-dan stof in beweging is — en die positie verwerpt het model expliciet. Het substraat is de relationele, geometrische grond; materie is daar één uitdrukking van, aan het laag-coherente einde van het spectrum, niet de bodem eronder. De zenuwstelsel-taal verderop ("hardware", "neuraal", "substraat") is altijd een lezing van de projectie-laag, nooit een claim dat de mens "niets dan neuronen" is. Geen reductie naar beneden, geen materie als grondstof — een gedeelde relationele grond waaruit zowel materie als bewustzijn als wegingen voortkomen.', en: 'What the substrate is not. Here lies the most important misunderstanding to pre-empt: "substrate" in this model never means "matter at the bottom, the rest derived from it." That would be materialism — the position that mind is nothing-but matter in motion — and the model explicitly rejects that position. The substrate is the relational, geometric ground; matter is one expression of it, at the low-coherence end of the spectrum, not the floor beneath it. The nervous-system language further on ("hardware", "neural", "substrate") is always a reading of the projection layer, never a claim that the human is "nothing but neurons." No reduction downward, no matter as raw material — a shared relational ground from which both matter and consciousness and weightings emerge.' }],
  ['a', 'P7', { nl: 'De ziel is een lokaal geometrisch patroon. Geen substantie maar een configuratie van relaties die lokaal coherentie behoudt. Een druppel, niet de oceaan — maar de druppel is intrinsiek verbonden met de golf; isolatie is zelfs in principe niet beschikbaar. Dit is precies wat het model bedoelt met "een configuratie van een eindige modus van substantie."', en: 'The soul is a local geometric pattern. Not a substance but a configuration of relations that locally maintains coherence. A drop, not the ocean — but the drop is intrinsically connected to the wave; isolation is not available even in principle. This is exactly what the model means by "a configuration of a finite mode of substance."' }],
  ['p', { nl: 'Eén belangrijke eerlijkheid: het minimum bevestigde is één 3-manifold plus tijd. Alles daarboven — het hoger-dimensionale substraat, de spectrum-parameter — wordt als metafysische positie gedragen, niet als bewezen fysica. We benoemen de grens tussen wat staat en wat gewogen wordt.', en: 'One important honesty: the minimum confirmed is one 3-manifold plus time. Everything above that — the higher-dimensional substrate, the spectrum parameter — is carried as a metaphysical position, not as proven physics. We name the boundary between what stands and what is weighed.' }],
  ['s', { nl: 'I-B. De cognitieve ankers — hoe een begrensde geest binnen het fundament werkt', en: 'I-B. The cognitive anchors — how a bounded mind works within the foundation' }],
  ['p', { nl: 'Hier daalt het frame af uit het fundament in de werking van een eindige modus: een begrensd zelf dat voorspelt, voelt, en onder druk vervormt. Elk anker is verankerd in een redeneerstap en blijft open voor herziening op precies dat punt.', en: 'Here the frame descends from the foundation into the workings of a finite mode: a bounded self that predicts, feels, and deforms under pressure. Each anchor is rooted in a reasoning step and stays open to revision on exactly that point.' }],
  ['a', 'C1', { nl: 'Perspectief-indexering. De grond laat twee lezingen van één patroon toe: ervaren vanuit het zonder-perspectief, dubbel-aspect vanuit het binnen-perspectief — en geen van beide herleidt tot de ander. Dit is waarom het model in één adem over het gevoelde leven van een configuratie én over haar mechanisme kan spreken, zonder categorie-fout.', en: 'Perspective indexing. The ground allows two readings of one pattern: experienced from the no-perspective, dual-aspect from the inside-perspective — and neither reduces to the other. This is why the model can speak in one breath about both the felt life of a configuration and its mechanism, without category error.' }],
  ['a', 'C2', { nl: 'Coherentie boven maximalisatie. Genest, overlappend, gelijktijdig — toegestaan. Het postulaat dat slechts één maximaal geheel mag bestaan, wordt verworpen als toevoeging, niet als gevolgtrekking. Dit is de toestemming voor de hele matrix: twaalf archetypische wegingen bestaan en nestelen tegelijk in één mens. Zonder deze verwerping is er geen dynamische matrix — alleen een enkele winnaar.', en: 'Coherence over maximisation. Nested, overlapping, simultaneous — permitted. The postulate that only one maximal whole may exist is rejected as an addition, not as a consequence. This is the permission for the whole matrix: twelve archetypal weightings exist and nest at once in one person. Without this rejection there is no dynamic matrix — only a single winner.' }],
  ['a', 'C3', { nl: 'De afdaalgeometrie en de gevoelde trek. De top is de grens waar relatie zelf ineenklapt; er wordt vanaf afgedaald, niet naartoe gebouwd. Affect ontvlamt eronder, op het minimum aan coherentie dat nodig is voor een begrensd zelf om iets op het spel te hebben. Gevoel is de gewaarwording van de drift weg van het leefbare — de trek richting wat zou moeten.', en: 'The descent geometry and the felt pull. The apex is the boundary where relation itself collapses; one descends from it, not builds toward it. Affect ignites beneath it, at the minimum of coherence needed for a bounded self to have something at stake. Feeling is the sensation of the drift away from the liveable — the pull toward what ought to be.' }],
  ['a', 'C4', { nl: 'Anti-essentialisme en de dynamische matrix. Verschil is weging op één gedeeld systeem, niet verschil in soort. Geen archetype bezit een functie; elk archetype is een karakteristieke weging over alle functies. "Je bent een Minnaar" is fout; "je geometrie weegt de Minnaar naar het plafond" is juist. De hele wieldynamiek loopt op deze regel.', en: 'Anti-essentialism and the dynamic matrix. Difference is weighting on one shared system, not difference in kind. No archetype owns a function; each archetype is a characteristic weighting across all functions. "You are a Lover" is wrong; "your geometry weights the Lover toward the ceiling" is right. The whole wheel dynamic runs on this rule.' }],
  ['a', 'C5', { nl: 'De meester-convergentie. Persoonlijkheid is de configuratie van afstem-parameters die de kloof-dichtende motor van de eindige modus bijstuurt; een archetype is een karakteristiek parameter-profiel van die motor. Drie onderzoekstradities — archetypisch, neurobiologisch, trait-psychologisch — komen hier op hetzelfde punt uit.', en: 'The master convergence. Personality is the configuration of tuning parameters that steers the gap-closing engine of the finite mode; an archetype is a characteristic parameter profile of that engine. Three research traditions — archetypal, neurobiological, trait-psychological — arrive here at the same point.' }],
  ['a', 'C6', { nl: 'De drie-traps-afdaling. Zijn differentieert tot een begrensd lokaal zelf (de lens die je bent), waarbinnen gevoel ontvlamt als de lezing van de toestand van dat zelf, dat een categoriserende laag vervolgens uitsnijdt tot noembare emotie. Substraat, affect, concept — in die volgorde, nooit omgekeerd.', en: 'The three-step descent. Being differentiates into a bounded local self (the lens you are), within which feeling ignites as the reading of that self’s state, which a categorising layer then carves into nameable emotion. Substrate, affect, concept — in that order, never reversed.' }],
  ['a', 'C7', { nl: 'Doorlaatbaarheid en kristallisatie. Doorlaatbaarheid is een snelheid, geen positie; volharding kristalliseert stroom tot structuur. De diepe affectieve bodem ligt vast voor het leven — mensen veranderen niet aan de wortel, ze volharden tot ze sterven — terwijl de bovenlagen herzienbaar blijven. Dit is waarom de spannings-curve een vorm heeft en geen momentopname.', en: 'Permeability and crystallisation. Permeability is a rate, not a position; persistence crystallises flow into structure. The deep affective floor is fixed for life — people do not change at the root, they persist until they die — while the upper layers stay revisable. This is why the tension curve has a shape and not a snapshot.' }],
  ['a', 'C8', { nl: 'Schaal-herhaling. Het ene patroon keert terug op elke schaal: geneste grenzen in de ruimte, geneste ritmes in de tijd, dezelfde kloof-dichtende motor van milliseconden tot een mensenleven. Dit is de vergunning om de matrix over schalen te lezen — en tegelijk de stoutste theoretische gok van het project, als zodanig vastgehouden.', en: 'Scale repetition. The one pattern recurs at every scale: nested boundaries in space, nested rhythms in time, the same gap-closing engine from milliseconds to a lifetime. This is the licence to read the matrix across scales — and at the same time the boldest theoretical gamble of the project, held as such.' }],
  ['p', { nl: 'En het blijft open. Het frame sluit zijn eigen vragen niet: of affectieve programma\'s aangeboren zijn of geconstrueerd; of ervaring nestelt over organismen heen of slechts koppelt. De ankers dragen — maar ze dragen als toetsbare posities, niet als dogma. Precies dat is het punt van wat volgt.', en: 'And it stays open. The frame does not close its own questions: whether affective programmes are innate or constructed; whether experience nests across organisms or merely couples. The anchors carry — but they carry as testable positions, not as dogma. That is precisely the point of what follows.' }],
  ['h', { nl: 'II. De Bronnen', en: 'II. The Sources' }, '#22c55e'],
  ['p', { nl: 'Een model leunt op zijn bronnen. De meeste laten het daarbij: een naam, een jaartal, geleende autoriteit. Wij doen het omgekeerd. Bij elke bron staat niet alleen waar we op steunen, maar waar we afwijken, waarom we die stap zetten, en wat hem zou breken.', en: 'A model leans on its sources. Most leave it there: a name, a year, borrowed authority. We do the opposite. With each source we state not only what we rely on, but where we deviate, why we take that step, and what would break it.' }],
  ['p', { nl: 'Dit is geen bekentenis. Het is methode. Een claim die niet kan vallen, draagt niets — dus benoemen we voor elke claim de val. Waar een bron iets net niet zegt wat het frame nodig had, hebben we een brug geslagen; die brug noemen we een brug, en niet een meting. Wie dieper kijkt, vindt hieronder precies waar elke brug ligt, en hoe ver hij draagt.', en: 'This is not a confession. It is method. A claim that cannot fall carries nothing — so for each claim we name the fall. Where a source says not quite what the frame needed, we have built a bridge; that bridge we call a bridge, not a measurement. Anyone who looks deeper finds below exactly where each bridge lies, and how far it carries.' }],
  ['p', { nl: 'De vijf velden zijn telkens dezelfde: wat de bron onderbouwt, waar wij afwijken, wat hij kruis-relateert of falsifieert, en de zekerheid die we eraan toekennen. Hoge zekerheid: stevig verankerd. Lage zekerheid is geen zwakte — het is een gok die hardop wordt benoemd in plaats van weggepoetst.', en: 'The five fields are always the same: what the source underpins, where we deviate, what it cross-relates or falsifies, and the certainty we assign it. High certainty: firmly anchored. Low certainty is not weakness — it is a gamble named aloud instead of papered over.' }],
  ['s', { nl: 'De wet onder de tabel', en: 'The law beneath the table' }, '#a855f7'],
  ['p', { nl: 'Een bron met frictie — omstreden, los geoperationaliseerd, laag in zekerheid — wordt in het model zelf nooit tot fundament verheven. De zwakke schakel blijft zwak, helemaal tot onderin. Hij voedt een voorzichtige neiging, nooit een harde uitspraak. Geen enkele lezing draagt meer zekerheid dan de bron eronder toestaat; de omstreden ankers houden we daarom met opzet níét dragend.', en: 'A source with friction — contested, loosely operationalised, low in certainty — is never raised to a foundation within the model itself. The weak link stays weak, all the way to the bottom. It feeds a cautious tendency, never a hard statement. No reading carries more certainty than the source beneath it allows; we therefore deliberately keep the contested anchors non-load-bearing.' }],
  ['p', { nl: 'Dat is de symmetrie waar alles op rust. Het model behandelt zijn eigen bronnen precies zoals het jouw scores leest — nooit als een vaststaand feit, altijd als een gewogen neiging die kan worden herzien. De frictie is geen scheur die de audit blootlegt. De frictie wordt als frictie vastgehouden, bewust, en nooit stilletjes tot waarheid omgezet.', en: 'That is the symmetry on which everything rests. The model treats its own sources exactly as it reads your scores — never as a settled fact, always as a weighted tendency that can be revised. The friction is not a crack the audit exposes. The friction is held as friction, deliberately, and never quietly turned into truth.' }],
  ['p', { nl: 'Zo leest het model jou. Zo leest het zichzelf. De clusters hieronder zijn daarvan het bewijs — geordend zoals het frame zelf is opgebouwd: van de wijdste schaal naar de diepste, en weer terug.', en: 'This is how the model reads you. This is how it reads itself. The clusters below are the proof of that — ordered as the frame itself is built: from the widest scale to the deepest, and back again.' }],
];

// Direct source links (DOI / arXiv / publisher), keyed by the exact `author` string in
// referencesData. Papers → DOI/arXiv; books → publisher or stable reference page.
const SOURCE_LINKS = {
  // Cluster E
  'Bohm (1980)': 'https://www.routledge.com/9780415289795',
  'Verlinde (2016)': 'https://arxiv.org/abs/1611.02269',
  "D'Ariano & Faggin (2021)": 'https://arxiv.org/abs/2012.06580',
  'Kastrup (2019)': 'https://doi.org/10.17514/JNDS-2019-37-3-p185-200',
  // Cluster A
  'Friston (2010)': 'https://doi.org/10.1038/nrn2787',
  'Buzsáki (2019)': 'https://global.oup.com/academic/product/9780190905385',
  'Menon (2011)': 'https://doi.org/10.1016/j.tics.2011.08.003',
  'Bassett (2011, 2017)': 'https://doi.org/10.1073/pnas.1018985108',
  'Carhart-Harris & Friston (2019)': 'https://doi.org/10.1124/pr.118.017160',
  'Carhart-Harris (2014)': 'https://doi.org/10.3389/fnhum.2014.00020',
  'Christoff (2016)': 'https://doi.org/10.1038/nrn.2016.113',
  'Buckner (2008)': 'https://doi.org/10.1196/annals.1440.011',
  'Aston-Jones & Cohen (2005)': 'https://doi.org/10.1146/annurev.neuro.28.061604.135709',
  'DeYoung (2015)': 'https://doi.org/10.1016/j.jrp.2014.07.004',
  // Cluster C
  'Gray (1987, herzien 2000)': 'https://doi.org/10.1093/acprof:oso/9780198522713.001.0001',
  'Panksepp (1998)': 'https://global.oup.com/academic/product/9780195096736',
  // Cluster B
  'Barrett (2017)': 'https://www.hachettebookgroup.com/titles/lisa-feldman-barrett/how-emotions-are-made/9780544133310/',
  'Solms (2021)': 'https://wwnorton.com/books/9780393542011',
  'Damasio (2003)': 'https://www.harpercollins.com/products/looking-for-spinoza-antonio-damasio',
  'Seth (2021)': 'https://www.penguinrandomhouse.com/books/566315/being-you-by-anil-seth/',
  'Fuchs (2018)': 'https://global.oup.com/academic/product/9780199646883',
  'Robertson & Ivry (1998)': 'https://mitpress.mit.edu/9780262090346/',
  'Juarrero (2023)': 'https://mitpress.mit.edu/9780262047715/',
  // Cluster H
  'Buzsáki & Wang (2012)': 'https://doi.org/10.1146/annurev-neuro-062111-150444',
  'McFadden (2020)': 'https://doi.org/10.1093/nc/niaa016',
  // Cluster I
  'Albantakis & Tononi e.a. (2023)': 'https://doi.org/10.1371/journal.pcbi.1011465',
  'Cogitate Consortium (2025)': 'https://doi.org/10.1038/s41586-025-08888-1',
  // Cluster J
  'Levin (2019)': 'https://doi.org/10.3389/fpsyg.2019.02688',
  'Russo & Nestler (2013)': 'https://doi.org/10.1038/nrn3381',
  'Shansky e.a. (2009)': 'https://doi.org/10.1093/cercor/bhp003',
  'Duman & Aghajanian (2012)': 'https://doi.org/10.1126/science.1222939',
  // Cluster K
  'Porges (2011)': 'https://wwnorton.com/books/9780393707007',
  'Grossman (2023)': 'https://doi.org/10.1016/j.biopsycho.2023.108589',
  'Coutinho e.a. (2021)': 'https://doi.org/10.1111/psyp.13739',
  'Palumbo e.a. (2017)': 'https://doi.org/10.1177/1088868316628405',
  // Cluster D
  'Piaget (1970)': 'https://www.google.com/books/edition/Genetic_Epistemology/_/?gbpv=0&bsq=isbn:9780393005967',
  'Kegan (1994)': 'https://www.hup.harvard.edu/books/9780674445888',
  // Cluster G
  'Westen (1999)': 'https://doi.org/10.1037/0033-2909.124.3.333',
  // Cluster F
  'Wei e.a. (2022)': 'https://arxiv.org/abs/2206.07682',
  'Schaeffer, Miranda & Koyejo (2023)': 'https://arxiv.org/abs/2304.15004',
  'Templeton e.a., Anthropic (2024)': 'https://transformer-circuits.pub/2024/scaling-monosemanticity/',
};

// Author label for the Bron/Referentie column — a new-tab hyperlink when a source has a
// known link, otherwise plain bold text (e.g. user-added custom sources).
function renderSourceAuthor(source) {
  const href = SOURCE_LINKS[source.author];
  if (!href) return <strong className="text-slate-100 font-bold">{source.author}</strong>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="text-slate-100 font-bold underline decoration-2 decoration-green-500 underline-offset-2 hover:text-[#a855f7] transition-colors w-fit cursor-pointer"
    >
      {source.author}
    </a>
  );
}

function renderMethBlock([type, a, b], i, lang) {
  if (type === 'h') { const c = b || '#a855f7'; return <h4 key={i} className="font-mono uppercase tracking-wider mt-3" style={{ color: c, fontSize: '0.8rem', textShadow: `0 0 8px ${c}4d` }}>{L(a, lang)}</h4>; }
  if (type === 's') { const c = b || '#f97316'; return <h5 key={i} className="font-mono uppercase tracking-wide mt-2" style={{ color: c, fontSize: '0.8rem' }}>{L(a, lang)}</h5>; }
  if (type === 'a') return <p key={i} className="leading-relaxed"><span style={{ color: '#3b82f6', fontWeight: 700 }}>{a} — </span><span className="text-slate-400">{L(b, lang)}</span></p>;
  return <p key={i} className="text-slate-400 leading-relaxed">{L(a, lang)}</p>;
}

// Small typewriter effect for the contact invitation — types the sentence out, holds when
// finished, then restarts on a loop.
function Typewriter({ text, speed = 32, pause = 2000, className, style }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let intervalId;
    let timeoutId;
    const start = () => {
      setN(0);
      intervalId = setInterval(() => {
        setN((prev) => {
          if (prev >= text.length) {
            clearInterval(intervalId);
            timeoutId = setTimeout(start, pause); // freeze on the full sentence, then re-type
            return prev;
          }
          return prev + 1;
        });
      }, speed);
    };
    start();
    return () => { clearInterval(intervalId); clearTimeout(timeoutId); };
  }, [text, speed, pause]);
  const done = n >= text.length;
  return (
    <p className={className} style={style}>
      {text.slice(0, n)}
      <span className="animate-pulse" style={{ opacity: done ? 0.55 : 1 }}>▌</span>
    </p>
  );
}

export default function ReferencesPanel({ bodyFont = '0.75rem' }) {
  const { language } = useLanguage();
  const tr = (v) => L(v, language); // resolve { nl, en } (or string) against the active language
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClusterId, setSelectedClusterId] = useState('All');
  const [selectedCertainty] = useState('All');
  const [expandedSourceId, setExpandedSourceId] = useState(null);

  const [isClusterDropdownOpen, setIsClusterDropdownOpen] = useState(false);
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);
  const methodologyRef = useRef(null);
  const methScrollTopRef = useRef(0);

  // Nearest actually-scrollable ancestor of the methodology card (the panel's scroll area,
  // not the page).
  const getMethScrollContainer = () => {
    let sc = methodologyRef.current?.parentElement;
    while (sc && sc !== document.body) {
      const oy = getComputedStyle(sc).overflowY;
      if ((oy === 'auto' || oy === 'scroll') && sc.scrollHeight > sc.clientHeight) return sc;
      sc = sc.parentElement;
    }
    return null;
  };

  // Open/close the methodology details. The scrolling done *inside* the open details is
  // treated as transient: we remember the scroll position at open time, and on close we
  // restore it so the content simply folds back beneath a fixed header — the view flows
  // with the fold instead of being yanked or stranded mid-scroll.
  const toggleMethodology = () => {
    const sc = getMethScrollContainer();
    if (!isMethodologyOpen) {
      if (sc) methScrollTopRef.current = sc.scrollTop;
      setIsMethodologyOpen(true);
    } else {
      setIsMethodologyOpen(false);
      // Restore synchronously on the still-expanded DOM, before the collapse animates;
      // the header lands back where it was and the details fold up beneath it.
      if (sc) sc.scrollTop = methScrollTopRef.current;
    }
  };

  const [customSources, setCustomSources] = useState([]);
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [hubTab, setHubTab] = useState('dialoog');

  const [addForm, setAddForm] = useState({
    name: '', email: '', author: '', titleAndJournal: '', underpins: '', deviation: '',
    crossRelation: '', certainty: '', certaintyLevel: 'Middel',
  });
  const [contactForm, setContactForm] = useState({ name: '', email: '', sourceReference: '', message: '' });
  const [formSubmitted, setFormSubmitted] = useState(false);

  const clusterCounts = useMemo(() => {
    const counts = { All: 0, custom: customSources.length };
    let total = 0;
    clustersData.forEach((c) => { counts[c.id] = c.sources.length; total += c.sources.length; });
    counts.All = total + customSources.length;
    return counts;
  }, [customSources]);

  const filteredSources = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const has = (v) => String(tr(v) || '').toLowerCase().includes(q);
    const match = (src) =>
      has(src.author) ||
      has(src.titleAndJournal) ||
      has(src.underpins) ||
      has(src.deviation) ||
      has(src.crossRelation) ||
      has(src.certainty);

    const result = [];
    clustersData.forEach((cluster) => {
      if (selectedClusterId !== 'All' && cluster.id !== selectedClusterId) return;
      cluster.sources.forEach((src) => {
        if (selectedCertainty !== 'All' && src.certaintyLevel !== selectedCertainty) return;
        if (match(src)) result.push({ source: src, clusterName: cluster.name });
      });
    });
    customSources.forEach((src) => {
      if (selectedClusterId !== 'All' && selectedClusterId !== 'custom') return;
      if (selectedCertainty !== 'All' && src.certaintyLevel !== selectedCertainty) return;
      if (match(src)) result.push({ source: src, clusterName: tr(UI.ownEntry) });
    });
    return result;
  }, [searchQuery, selectedClusterId, selectedCertainty, customSources, language]);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!contactForm.email || !contactForm.message) {
      alert(tr(UI.alertContactReq));
      return;
    }
    setFormSubmitted(true);
    try {
      await sendContactForm({ type: 'dialoog', ...contactForm });
      setContactForm({ name: '', email: '', sourceReference: '', message: '' });
      alert(tr(UI.alertContactOk));
    } catch (err) {
      alert(err.message || tr(UI.alertSendFail));
    } finally {
      setFormSubmitted(false);
    }
  };

  const handleAddSourceSubmit = async (e) => {
    e.preventDefault();
    if (!addForm.email || !addForm.author || !addForm.underpins) {
      alert(tr(UI.alertBronReq));
      return;
    }
    setFormSubmitted(true);
    try {
      await sendContactForm({ type: 'bron', ...addForm });
      // Local preview so the contributor sees their entry immediately under 'Own entries'.
      const newSource = {
        id: `custom-${Date.now()}`,
        author: addForm.author,
        titleAndJournal: addForm.titleAndJournal || tr(UI.fbTitle),
        underpins: addForm.underpins,
        deviation: addForm.deviation || tr(UI.fbDeviation),
        crossRelation: addForm.crossRelation || tr(UI.fbCross),
        certainty: addForm.certainty || tr(UI.fbCertainty),
        certaintyLevel: addForm.certaintyLevel,
      };
      setCustomSources((prev) => [newSource, ...prev]);
      setAddForm({ name: '', email: '', author: '', titleAndJournal: '', underpins: '', deviation: '', crossRelation: '', certainty: '', certaintyLevel: 'Middel' });
      alert(tr(UI.alertBronOk));
    } catch (err) {
      alert(err.message || tr(UI.alertSendFail));
    } finally {
      setFormSubmitted(false);
    }
  };

  const handleDeleteCustomSource = (id, e) => {
    e.stopPropagation();
    setCustomSources((prev) => prev.filter((s) => s.id !== id));
  };

  const getCertaintyBadge = (level) => {
    switch (level) {
      case 'Hoog': return 'bg-[#a855f7]/10 text-[#a855f7] border-[#a855f7]/30';
      case 'Middel-Hoog': return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      case 'Middel': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      case 'Laag': return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'Equivoque': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'Verplaatst': return 'bg-slate-500/10 text-slate-400 border-slate-500/40';
      case 'Omstreden':
      default: return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    }
  };

  const activeClusterInfo = useMemo(() => {
    if (selectedClusterId === 'All') return { name: tr(UI.allClustersTitle), subtitle: tr(UI.allClustersSubtitle) };
    if (selectedClusterId === 'custom') return { name: tr(UI.ownEntry), subtitle: tr(UI.ownEntrySubtitle) };
    const found = clustersData.find((c) => c.id === selectedClusterId);
    return found ? { name: found.name, subtitle: tr(found.subtitle) } : { name: '', subtitle: '' };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClusterId, language]);

  // Restyle tokens (card aesthetic)
  const box = 'rounded-lg bg-slate-900/30 border border-slate-700/40 backdrop-blur-md';
  const inputCls = 'bg-black/40 border border-[rgba(168,85,247,0.22)] rounded px-2.5 py-1.5  text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#a855f7] transition-colors';
  const labelCls = ' font-mono text-slate-500 uppercase tracking-wider font-bold';

  return (
    <div className="relative z-10 w-full mx-auto flex flex-col gap-6 pb-2" style={{ animation: 'fadeIn 0.3s ease', fontSize: bodyFont }}>

      {/* Click-catcher for the cluster dropdown */}
      {isClusterDropdownOpen && (
        <div className="fixed inset-0 z-30 cursor-default" onClick={() => setIsClusterDropdownOpen(false)} />
      )}

      {/* Intro / methodology card */}
      <div ref={methodologyRef} className={`p-6 md:p-7 ${box} flex flex-col gap-4`} style={{ scrollMarginTop: '1rem' }}>
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-mono uppercase tracking-wider text-slate-100 flex items-center gap-2.5 select-none" style={{ fontSize: '0.85rem' }}>
            <BookOpen className="w-4 h-4 text-[#a855f7]" />
            {tr(UI.methodologyHeader)}
          </h2>
          <button
            type="button"
            onClick={toggleMethodology}
            className="flex items-center gap-2 py-1.5 px-3.5 rounded-lg bg-black/40 border border-[rgba(168,85,247,0.3)] text-slate-300 hover:text-white hover:border-[#a855f7] transition-all cursor-pointer  font-mono font-semibold uppercase tracking-wider select-none shrink-0"
          >
            <span>{isMethodologyOpen ? tr(UI.hideDetails) : tr(UI.showDetails)}</span>
            {isMethodologyOpen ? <ChevronUp className="w-[18px] h-[18px]" /> : <ChevronDown className="w-[18px] h-[18px]" />}
          </button>
        </div>

        <p className="  text-slate-400 leading-relaxed">
          {tr(UI.methodologyLead)}
        </p>

        <AnimatePresence initial={false}>
          {isMethodologyOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="  text-slate-400 flex flex-col gap-3 leading-relaxed border-t border-slate-700/40 pt-4 mt-1">
                {METHODOLOGY_BLOCKS.map((blk, i) => renderMethBlock(blk, i, language))}
                <div className="flex justify-center pt-3 mt-1 border-t border-slate-700/40">
                  <button
                    type="button"
                    onClick={toggleMethodology}
                    className="flex items-center gap-2 py-1.5 px-3.5 rounded-lg bg-black/40 border border-[rgba(168,85,247,0.3)] text-slate-300 hover:text-white hover:border-[#a855f7] transition-all cursor-pointer  font-mono font-semibold uppercase tracking-wider select-none"
                  >
                    <span>{tr(UI.hideDetails)}</span>
                    <ChevronUp className="w-[18px] h-[18px]" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Filter row */}
      <div className="flex flex-col gap-5 relative z-40">
        <div className={`flex flex-col md:flex-row gap-4 p-3 ${box} items-center relative z-30 w-full`}>
          {/* Cluster dropdown */}
          <div className="relative w-full md:w-2/3 z-40">
            <button
              type="button"
              onClick={() => setIsClusterDropdownOpen((p) => !p)}
              className={`w-full py-2 px-4 rounded-lg bg-black/40 border  font-mono text-slate-300 hover:text-white flex items-center justify-between gap-2 cursor-pointer transition-colors ${isClusterDropdownOpen ? 'border-[#a855f7] text-white' : 'border-[rgba(168,85,247,0.22)] hover:border-[rgba(168,85,247,0.5)]'}`}
            >
              <span className="flex items-center gap-2 truncate">
                <Layers className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="truncate">
                  {selectedClusterId === 'All' ? tr(UI.allClusters) : selectedClusterId === 'custom' ? tr(UI.ownEntry) : `Cluster ${selectedClusterId}`}
                </span>
              </span>
              {isClusterDropdownOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-500 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
            </button>

            <AnimatePresence>
              {isClusterDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.12 }}
                  className="absolute left-0 top-full mt-1.5 z-50 w-full max-h-[380px] overflow-y-auto bg-[rgba(4,5,12,0.98)] border border-[rgba(168,85,247,0.25)] rounded-xl shadow-2xl p-1.5 flex flex-col gap-1 backdrop-blur-md purple-scrollbar"
                >
                  <button
                    type="button"
                    onClick={() => { setSelectedClusterId('All'); setIsClusterDropdownOpen(false); }}
                    className={`w-full text-left py-2 px-3 rounded-lg  font-mono transition-all flex items-center justify-between cursor-pointer ${selectedClusterId === 'All' ? 'bg-[rgba(168,85,247,0.14)] text-[#c4b5fd] font-bold border border-[rgba(168,85,247,0.4)]' : 'bg-[#101838] text-slate-300 hover:bg-[#1b2656] hover:text-slate-200'}`}
                  >
                    <span>{tr(UI.allClusters)}</span>
                    <span className={` px-1.5 rounded ${selectedClusterId === 'All' ? 'bg-[rgba(168,85,247,0.25)] text-[#c4b5fd]' : 'bg-[rgba(168,85,247,0.1)] text-slate-400'}`}>{clusterCounts.All}</span>
                  </button>

                  {clustersData.map((cluster) => (
                    <button
                      key={cluster.id}
                      type="button"
                      onClick={() => { setSelectedClusterId(cluster.id); setIsClusterDropdownOpen(false); }}
                      className={`w-full text-left py-2 px-3 rounded-lg  transition-all flex flex-col gap-0.5 cursor-pointer group ${selectedClusterId === cluster.id ? 'bg-[rgba(168,85,247,0.14)] text-[#c4b5fd] font-bold border border-[rgba(168,85,247,0.4)]' : 'bg-[#101838] text-slate-300 hover:bg-[#1b2656] hover:text-slate-200'}`}
                    >
                      <div className="flex items-center justify-between w-full font-mono">
                        <span className=" font-semibold">{cluster.name}</span>
                        <span className={` px-1.5 rounded ${selectedClusterId === cluster.id ? 'bg-[rgba(168,85,247,0.25)] text-[#c4b5fd]' : 'bg-[rgba(168,85,247,0.1)] text-slate-400'}`}>{clusterCounts[cluster.id] || 0}</span>
                      </div>
                      <span className={` font-light truncate ${selectedClusterId === cluster.id ? 'text-[#a855f7]/70' : 'text-slate-500 group-hover:text-slate-400'}`}>{tr(cluster.subtitle)}</span>
                    </button>
                  ))}

                  <div className="h-px bg-[rgba(168,85,247,0.18)] my-0.5" />

                  <button
                    type="button"
                    onClick={() => { setSelectedClusterId('custom'); setIsClusterDropdownOpen(false); }}
                    className={`w-full text-left py-2 px-3 rounded-lg  font-mono tracking-wide transition-all flex items-center justify-between cursor-pointer ${selectedClusterId === 'custom' ? 'bg-[rgba(168,85,247,0.14)] text-[#c4b5fd] font-bold border border-[rgba(168,85,247,0.4)]' : 'bg-[#101838] text-slate-300 hover:bg-[#1b2656] hover:text-slate-200'}`}
                  >
                    <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> {tr(UI.ownEntry)}</span>
                    <span className={` px-1.5 rounded ${selectedClusterId === 'custom' ? 'bg-[rgba(168,85,247,0.25)] text-[#c4b5fd]' : 'bg-[rgba(168,85,247,0.1)] text-slate-400'}`}>{clusterCounts.custom}</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-1/3">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder={tr(UI.searchPlaceholder)}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-[rgba(168,85,247,0.22)] rounded-lg py-2 pl-9 pr-4  text-slate-300 placeholder-slate-600 focus:outline-none focus:border-[#a855f7] transition-colors"
            />
          </div>
        </div>

        {/* Active cluster banner */}
        <div className={`p-4 ${box} flex flex-col gap-1`}>
          <h3 className=" font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
            {activeClusterInfo.name}
          </h3>
          <p className=" text-slate-500 leading-relaxed">{activeClusterInfo.subtitle}</p>
        </div>

        {/* Table (desktop) / accordion (mobile) */}
        <div className="border border-slate-700/40 rounded-2xl bg-slate-900/20 overflow-hidden relative z-10">
          <div className="hidden md:block overflow-x-auto purple-scrollbar">
            <table className="w-full table-fixed text-left border-collapse border border-[#2a2a30] [&_th]:border [&_th]:border-[#2a2a30] [&_td]:border [&_td]:border-[#2a2a30] [&_th]:break-words [&_td]:break-words">
              <thead>
                <tr className="bg-slate-900/40 text-white font-mono tracking-wider  uppercase">
                  <th className="p-4 w-[25%]">{tr(UI.colBron)} / <span className="underline decoration-2 decoration-green-500 underline-offset-2">Link</span> / {tr(UI.colSource)}</th>
                  <th className="p-4 w-[25%]">{tr(UI.colUnderpins)}</th>
                  <th className="p-4 w-[25%]">{tr(UI.colDeviation)}</th>
                  <th className="p-4 w-[15%]">{tr(UI.colCross)}</th>
                  <th className="p-4 w-[10%] text-center">{tr(UI.colCertainty)}</th>
                </tr>
              </thead>
              <tbody>
                {filteredSources.length === 0 ? (
                  <tr><td colSpan={5} className="p-12 text-center text-slate-500 italic">{tr(UI.noResults)}</td></tr>
                ) : filteredSources.map(({ source, clusterName }) => (
                  <tr key={source.id} className="hover:bg-slate-800/20 transition-colors group">
                    <td className="p-4 align-top">
                      <div className="flex flex-col gap-1">
                        <span className=" font-mono text-slate-500 uppercase tracking-wider font-semibold">{clusterName}</span>
                        {renderSourceAuthor(source)}
                        <span className="text-slate-500  italic leading-tight">{tr(source.titleAndJournal)}</span>
                        {source.id.startsWith('custom-') && (
                          <button type="button" onClick={(e) => handleDeleteCustomSource(source.id, e)} className="text-rose-400 hover:text-rose-300  font-mono mt-1.5 text-left flex items-center gap-1 cursor-pointer w-fit">
                            <Trash2 className="w-3 h-3" /> {tr(UI.remove)}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="p-4 align-top text-slate-400 leading-relaxed ">{tr(source.underpins)}</td>
                    <td className="p-4 align-top bg-slate-900/30 text-slate-400 leading-relaxed">{tr(source.deviation)}</td>
                    <td className="p-4 align-top text-slate-400 leading-relaxed ">{tr(source.crossRelation)}</td>
                    <td className="p-4 align-top text-center">
                      <div className="flex flex-col items-center gap-1 justify-center">
                        <span className={`px-2 py-0.5 rounded border  font-mono font-medium whitespace-nowrap ${getCertaintyBadge(source.certaintyLevel)}`}>{tr(CERTAINTY_LABELS[source.certaintyLevel]) || source.certaintyLevel}</span>
                        <span className=" text-slate-500 italic block max-w-[90px] leading-tight">{tr(source.certainty)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile accordion */}
          <div className="md:hidden flex flex-col divide-y divide-slate-800/60">
            {filteredSources.length === 0 ? (
              <div className="p-8 text-center text-slate-500 italic">{tr(UI.noResults)}</div>
            ) : filteredSources.map(({ source, clusterName }) => {
              const isExpanded = expandedSourceId === source.id;
              return (
                <div key={source.id} className="p-4 flex flex-col gap-2.5">
                  <div onClick={() => setExpandedSourceId(isExpanded ? null : source.id)} className="flex justify-between items-start gap-4 cursor-pointer">
                    <div className="flex flex-col gap-1">
                      <span className=" font-mono text-slate-500 uppercase tracking-widest font-semibold">{clusterName}</span>
                      {renderSourceAuthor(source)}
                      <span className="text-slate-500  italic leading-snug">{tr(source.titleAndJournal)}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded border  font-mono whitespace-nowrap ${getCertaintyBadge(source.certaintyLevel)}`}>{tr(CERTAINTY_LABELS[source.certaintyLevel]) || source.certaintyLevel}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <button type="button" onClick={() => setExpandedSourceId(isExpanded ? null : source.id)} className="text-left  font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1 cursor-pointer hover:text-slate-200">
                      {isExpanded ? tr(UI.hideDetailsBracket) : tr(UI.showDetailsBracket)}
                    </button>
                    {source.id.startsWith('custom-') && (
                      <button type="button" onClick={(e) => handleDeleteCustomSource(source.id, e)} className="text-rose-400 hover:text-rose-300  font-mono uppercase tracking-widest flex items-center gap-1 cursor-pointer">
                        <Trash2 className="w-3 h-3" /> {tr(UI.remove)}
                      </button>
                    )}
                  </div>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden flex flex-col gap-3 mt-2 pl-2 border-l border-slate-700/50  text-slate-400">
                        <div className="flex flex-col gap-1 mt-1">
                          <span className={labelCls}>{tr(UI.labelUnderpins)}</span>
                          <p className="leading-relaxed ">{tr(source.underpins)}</p>
                        </div>
                        <div className="flex flex-col gap-1 p-2.5 rounded bg-slate-900/40 border border-slate-700/40">
                          <span className={labelCls}>{tr(UI.labelDeviation)}</span>
                          <p className="leading-relaxed italic ">{tr(source.deviation)}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className={labelCls}>{tr(UI.labelCross)}</span>
                          <p className="leading-relaxed ">{tr(source.crossRelation)}</p>
                        </div>
                        <div className="flex flex-col gap-0.5 pt-1">
                          <span className={labelCls}>{tr(UI.labelCertainty)}</span>
                          <p className="font-mono  text-slate-500">{tr(source.certainty)}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Contact card — one card, two tabs: Dialoog / Nieuwe bron */}
      <div className="mt-6 pt-8 border-t border-slate-700/40">
        <div className={`p-6 ${box} flex flex-col gap-4`}>
          {/* Tabs */}
          <div className="flex gap-2">
            {[
              { id: 'dialoog', label: tr(UI.tabDialoog), Icon: MessageSquare },
              { id: 'bron', label: tr(UI.tabBron), Icon: ClipboardList },
            ].map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setHubTab(id)}
                className={`flex-1 py-2 px-4 rounded-lg font-mono uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all border ${hubTab === id ? 'bg-[rgba(168,85,247,0.14)] text-[#c4b5fd] border-[rgba(168,85,247,0.4)] font-bold' : 'text-slate-400 border-transparent hover:text-slate-200 hover:border-[rgba(168,85,247,0.2)]'}`}
              >
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-4" style={{ minHeight: '21rem' }}>
          {hubTab === 'dialoog' ? (
            <>
              <Typewriter text={tr(UI.typeDialoog)} className="text-slate-300 leading-relaxed" style={{ color: '#c4b5fd' }} />
              <form onSubmit={handleContactSubmit} className="flex flex-col gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1"><label className={labelCls}>{tr(UI.fieldName)}</label><input type="text" required value={contactForm.name} onChange={(e) => setContactForm((p) => ({ ...p, name: e.target.value }))} placeholder={tr(UI.phName)} className={inputCls} /></div>
                  <div className="flex flex-col gap-1"><label className={labelCls}>{tr(UI.fieldEmail)}</label><input type="email" required value={contactForm.email} onChange={(e) => setContactForm((p) => ({ ...p, email: e.target.value }))} placeholder={tr(UI.phEmail)} className={inputCls} /></div>
                </div>
                <div className="flex flex-col gap-1"><label className={labelCls}>{tr(UI.fieldSourceRef)}</label><input type="text" value={contactForm.sourceReference} onChange={(e) => setContactForm((p) => ({ ...p, sourceReference: e.target.value }))} placeholder={tr(UI.phSourceRef)} className={inputCls} /></div>
                <div className="flex flex-col gap-1"><label className={labelCls}>{tr(UI.fieldMessage)}</label><textarea rows={3} required value={contactForm.message} onChange={(e) => setContactForm((p) => ({ ...p, message: e.target.value }))} placeholder={tr(UI.phMessage)} className={`${inputCls} resize-none`} /></div>
                <div className="flex justify-end">
                  <button type="submit" disabled={formSubmitted} className="py-1.5 px-4 rounded-lg border border-[rgba(168,85,247,0.4)] bg-[rgba(168,85,247,0.14)] text-[#c4b5fd] font-mono uppercase tracking-wider font-bold hover:bg-[rgba(168,85,247,0.25)] hover:text-white transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
                    {formSubmitted ? (<><CheckCircle2 className="w-3.5 h-3.5 animate-bounce" /> {tr(UI.sending)}</>) : (<><Send className="w-3.5 h-3.5" /> {tr(UI.send)}</>)}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              <Typewriter text={tr(UI.typeBron)} className="leading-relaxed" style={{ color: '#c4b5fd' }} />
              <form onSubmit={handleAddSourceSubmit} className="flex flex-col gap-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1"><label className={labelCls}>{tr(UI.fieldAuthor)}</label><input type="text" required value={addForm.author} onChange={(e) => setAddForm((p) => ({ ...p, author: e.target.value }))} placeholder={tr(UI.phAuthor)} className={inputCls} /></div>
                  <div className="flex flex-col gap-1"><label className={labelCls}>{tr(UI.fieldTitle)}</label><input type="text" value={addForm.titleAndJournal} onChange={(e) => setAddForm((p) => ({ ...p, titleAndJournal: e.target.value }))} placeholder={tr(UI.phTitle)} className={inputCls} /></div>
                </div>
                <div className="flex flex-col gap-1"><label className={labelCls}>{tr(UI.fieldUnderpins)}</label><textarea rows={2} required value={addForm.underpins} onChange={(e) => setAddForm((p) => ({ ...p, underpins: e.target.value }))} placeholder={tr(UI.phUnderpins)} className={`${inputCls} resize-none`} /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1"><label className={labelCls}>{tr(UI.fieldName)}</label><input type="text" value={addForm.name} onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))} placeholder={tr(UI.phName)} className={inputCls} /></div>
                  <div className="flex flex-col gap-1"><label className={labelCls}>{tr(UI.fieldEmailReq)}</label><input type="email" required value={addForm.email} onChange={(e) => setAddForm((p) => ({ ...p, email: e.target.value }))} placeholder={tr(UI.phEmail)} className={inputCls} /></div>
                </div>
                <div className="flex justify-end">
                  <button type="submit" disabled={formSubmitted} className="py-1.5 px-4 rounded-lg border border-[rgba(168,85,247,0.4)] bg-[rgba(168,85,247,0.14)] text-[#c4b5fd] font-mono uppercase tracking-wider font-bold hover:bg-[rgba(168,85,247,0.25)] hover:text-white transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
                    {formSubmitted ? (<><CheckCircle2 className="w-3.5 h-3.5 animate-bounce" /> {tr(UI.sending)}</>) : (<><Send className="w-3.5 h-3.5" /> {tr(UI.send)}</>)}
                  </button>
                </div>
              </form>
            </>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
