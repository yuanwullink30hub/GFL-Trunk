/**
 * Extended Archetype OCEAN Profiles — 72 Combinations
 *
 * Each core archetype (12) × each support group (6) = 72 extended archetypes.
 * Provides the OCEAN trait shifts and stress triggers for every combination.
 *
 * Support Groups:
 *   Ruling     — CEN Dominantie
 *   Relational — Limbische Koppeling
 *   Seeker     — Openness / Vertrouwen & Beweging
 *   Chaos      — Salience Network
 *   Abstract   — DMN Hyper-connectie
 *   Agency     — Extraversie & Wilskracht
 */

export const EXTENDED_OCEAN_PROFILES = {

  // ═══════════════════════════════════════════════════════════════════
  // 1. JUDGE — Extended Archetypes
  // ═══════════════════════════════════════════════════════════════════
  JUDGE: {
    RULING: {
      name: 'Arbiter',
      supportGroup: 'Ruling',
      harmony: true,
      harmonyBonus: 69,
      ocean: { O: 'Laag-Gemiddeld', C: 'Extreem Hoog', E: 'Laag-Gemiddeld', A: 'Laag', N: 'Onrecht / Systeemfouten' },
      stressTrigger: 'Gestrest door het moeten oplossen van onrecht of systeemfouten.',
    },
    RELATIONAL: {
      name: 'Mediator',
      supportGroup: 'Relational',
      harmony: false,
      ocean: { O: 'Hoog', C: 'Gemiddeld-Laag', E: 'Hoog', A: 'Extreem Hoog', N: 'Emotionele afstand' },
      stressTrigger: 'Gevoelig voor waargenomen afstand bij partners.',
    },
    SEEKER: {
      name: 'Examiner',
      supportGroup: 'Seeker',
      harmony: false,
      ocean: { O: 'Hoog', C: 'Gemiddeld-Hoog', E: 'Gemiddeld', A: 'Hoog', N: 'Verlies van zuiverheid / Stagnatie' },
      stressTrigger: 'Psychologische basislijn is zeer gevoelig voor stagnatie in onderzoek.',
    },
    CHAOS: {
      name: 'Whistleblower',
      supportGroup: 'Chaos',
      harmony: false,
      ocean: { O: 'Hoog', C: 'Gemiddeld', E: 'Gemiddeld', A: 'Laag', N: 'Diepe corruptie / Hypocrisie' },
      stressTrigger: 'Gewelddadige piek bij het ontdekken van diepe corruptie in de top.',
    },
    ABSTRACT: {
      name: 'Critic',
      supportGroup: 'Abstract',
      harmony: false,
      ocean: { O: 'Extreem Hoog', C: 'Hoog', E: 'Laag', A: 'Laag-Gemiddeld', N: 'Intellectuele fouten' },
      stressTrigger: 'Internaliseert angst in eindeloos piekeren (rumination) over intellectuele fouten.',
    },
    AGENCY: {
      name: 'Avenger',
      supportGroup: 'Agency',
      harmony: false,
      ocean: { O: 'Gemiddeld-Laag', C: 'Extreem Hoog', E: 'Hoog', A: 'Laag-Gemiddeld', N: 'Onmacht / Inactie' },
      stressTrigger: 'Enorme stresstolerantie, maar onderdrukt stress agressief naar binnen toe.',
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // 2. LOVER — Extended Archetypes
  // ═══════════════════════════════════════════════════════════════════
  LOVER: {
    RULING: {
      name: 'Companion',
      supportGroup: 'Ruling',
      harmony: false,
      ocean: { O: 'Gemiddeld', C: 'Hoog', E: 'Gemiddeld', A: 'Hoog', N: 'Instabiliteit / Verlies van kaders' },
      stressTrigger: 'Intern bang voor instabiliteit of het verlies van relationele kaders.',
    },
    RELATIONAL: {
      name: 'Soulmate',
      supportGroup: 'Relational',
      harmony: true,
      harmonyBonus: 69,
      ocean: { O: 'Hoog', C: 'Gemiddeld-Laag', E: 'Hoog', A: 'Extreem Hoog', N: 'Verlatingsangst / Afstand' },
      stressTrigger: 'Zeer gevoelig voor waargenomen afstand van anderen en verlatingsangst.',
    },
    SEEKER: {
      name: 'Poet',
      supportGroup: 'Seeker',
      harmony: false,
      ocean: { O: 'Extreem Hoog', C: 'Laag', E: 'Gemiddeld', A: 'Hoog', N: 'Verlies van inspiratie' },
      stressTrigger: 'Kwetsbaar voor extreme emotionele turbulentie en verlies van inspiratie.',
    },
    CHAOS: {
      name: 'Seducer',
      supportGroup: 'Chaos',
      harmony: false,
      ocean: { O: 'Hoog', C: 'Laag', E: 'Extreem Hoog', A: 'Gemiddeld-Hoog', N: 'Relationele beknelling' },
      stressTrigger: 'Getriggerd door relationele beknelling of verlies van authentieke expressie.',
    },
    ABSTRACT: {
      name: 'Mystic',
      supportGroup: 'Abstract',
      harmony: false,
      ocean: { O: 'Extreem Hoog', C: 'Gemiddeld', E: 'Laag-Gemiddeld', A: 'Hoog', N: 'Spirituele onrust' },
      stressTrigger: 'Internaliseert verlatingsangst in complex piekeren of spirituele onrust.',
    },
    AGENCY: {
      name: 'Romantic',
      supportGroup: 'Agency',
      harmony: false,
      ocean: { O: 'Hoog', C: 'Gemiddeld-Laag', E: 'Extreem Hoog', A: 'Hoog', N: 'Eenzaamheid' },
      stressTrigger: 'Onderdrukt eenzaamheid agressief door constante fysieke of sociale actie.',
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // 3. CAREGIVER — Extended Archetypes
  // ═══════════════════════════════════════════════════════════════════
  CAREGIVER: {
    RULING: {
      name: 'Advocate',
      supportGroup: 'Ruling',
      harmony: false,
      ocean: { O: 'Laag-Gemiddeld', C: 'Extreem Hoog', E: 'Gemiddeld-Hoog', A: 'Laag-Gemiddeld', N: 'Anarchie / Systeem-instabiliteit' },
      stressTrigger: 'Rots van stabiliteit, maar intern doodsbang voor anarchie.',
    },
    RELATIONAL: {
      name: 'Healer',
      supportGroup: 'Relational',
      harmony: true,
      harmonyBonus: 69,
      ocean: { O: 'Hoog', C: 'Laag', E: 'Hoog', A: 'Extreem Hoog', N: 'Emotionele disharmonie' },
      stressTrigger: 'Gevoelig voor waargenomen afstand of emotionele disharmonie.',
    },
    SEEKER: {
      name: 'Pathfinder',
      supportGroup: 'Seeker',
      harmony: false,
      ocean: { O: 'Hoog', C: 'Gemiddeld-Hoog', E: 'Gemiddeld', A: 'Extreem Hoog', N: 'Blokkade van de reis/vrijheid' },
      stressTrigger: 'Stress piekt wanneer de vrijheid van degenen die ze beschermen wordt geblokkeerd.',
    },
    CHAOS: {
      name: 'Cultivator',
      supportGroup: 'Chaos',
      harmony: false,
      ocean: { O: 'Extreem Hoog', C: 'Laag-Gemiddeld', E: 'Gemiddeld', A: 'Gemiddeld', N: 'Emotionele turbulentie / Tegenslag' },
      stressTrigger: 'Zeer gevoelig voor emotionele turbulentie en tegenslagen.',
    },
    ABSTRACT: {
      name: 'Therapist',
      supportGroup: 'Abstract',
      harmony: false,
      ocean: { O: 'Hoog', C: 'Hoog', E: 'Laag', A: 'Laag-Gemiddeld', N: 'Psychologische chaos' },
      stressTrigger: 'Internaliseert angst in piekeren en berekent worst-case scenario\'s.',
    },
    AGENCY: {
      name: 'Protector',
      supportGroup: 'Agency',
      harmony: false,
      ocean: { O: 'Gemiddeld-Laag', C: 'Extreem Hoog', E: 'Hoog', A: 'Laag-Gemiddeld', N: 'Onmacht om te beschermen' },
      stressTrigger: 'Enorme stresstolerantie, maar onderdrukt angst naar buiten toe.',
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // 4. INNOCENT — Extended Archetypes
  // ═══════════════════════════════════════════════════════════════════
  INNOCENT: {
    RULING: {
      name: 'Shepherd',
      supportGroup: 'Ruling',
      harmony: false,
      ocean: { O: 'Laag', C: 'Extreem Hoog', E: 'Gemiddeld-Hoog', A: 'Laag-Gemiddeld', N: 'Verandering / Verlies van basis' },
      stressTrigger: 'Rots van stabiliteit, maar is intern doodsbang voor verandering.',
    },
    RELATIONAL: {
      name: 'Samaritan',
      supportGroup: 'Relational',
      harmony: false,
      ocean: { O: 'Hoog', C: 'Hoog', E: 'Hoog', A: 'Extreem Hoog', N: 'Emotionele pijn / Disconnectie' },
      stressTrigger: 'Gevoelig voor waargenomen afstand of emotionele pijn.',
    },
    SEEKER: {
      name: 'Saint',
      supportGroup: 'Seeker',
      harmony: true,
      harmonyBonus: 69,
      ocean: { O: 'Hoog', C: 'Hoog', E: 'Gemiddeld', A: 'Extreem Hoog', N: '"Fout" zijn / Bestraffing' },
      stressTrigger: 'Gewelddadige reactie op "fout" zijn of het idee gestraft te worden.',
    },
    CHAOS: {
      name: 'Free Spirit',
      supportGroup: 'Chaos',
      harmony: false,
      ocean: { O: 'Extreem Hoog', C: 'Laag', E: 'Gemiddeld', A: 'Hoog', N: 'Rigide autoriteit' },
      stressTrigger: 'Gewelddadige reactie wanneer de "bubbel" wordt doorprikt door rigide autoriteit.',
    },
    ABSTRACT: {
      name: 'Disciple',
      supportGroup: 'Abstract',
      harmony: false,
      ocean: { O: 'Gemiddeld', C: 'Hoog', E: 'Laag', A: 'Hoog', N: 'Ambiguïteit / Gebrek aan waarheid' },
      stressTrigger: 'Begint onrustig de "juiste" variabelen te berekenen bij ambiguïteit.',
    },
    AGENCY: {
      name: 'Pioneer',
      supportGroup: 'Agency',
      harmony: false,
      ocean: { O: 'Hoog', C: 'Hoog', E: 'Hoog', A: 'Gemiddeld', N: 'Stagnatie / Verlies van momentum' },
      stressTrigger: 'Stresstolerantie gevoed door hun doel; angst wordt niet getoond.',
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // 5. EXPLORER — Extended Archetypes
  // ═══════════════════════════════════════════════════════════════════
  EXPLORER: {
    RULING: {
      name: 'Scout',
      supportGroup: 'Ruling',
      harmony: false,
      ocean: { O: 'Laag-Gemiddeld', C: 'Extreem Hoog', E: 'Gemiddeld-Hoog', A: 'Laag-Gemiddeld', N: 'Controleverlies' },
      stressTrigger: 'Rots van stabiliteit, maar is doodsbang voor controleverlies.',
    },
    RELATIONAL: {
      name: 'Networker',
      supportGroup: 'Relational',
      harmony: false,
      ocean: { O: 'Hoog', C: 'Laag', E: 'Hoog', A: 'Extreem Hoog', N: 'Sociale afstand' },
      stressTrigger: 'Gevoelig voor waargenomen disconnectie of sociale afstand.',
    },
    SEEKER: {
      name: 'Navigator',
      supportGroup: 'Seeker',
      harmony: true,
      harmonyBonus: 69,
      ocean: { O: 'Extreem Hoog', C: 'Gemiddeld', E: 'Laag', A: 'Laag-Gemiddeld', N: 'Stagnatie / Stilstand' },
      stressTrigger: 'Vreest stagnatie en begint wanhopig variabelen te berekenen.',
    },
    CHAOS: {
      name: 'Innovator',
      supportGroup: 'Chaos',
      harmony: false,
      ocean: { O: 'Extreem Hoog', C: 'Laag', E: 'Contextueel', A: 'Gemiddeld', N: 'Vastgeroeste ideeën' },
      stressTrigger: 'Zeer gevoelig en kwetsbaar voor emotionele turbulentie en vastgeroeste ideeën.',
    },
    ABSTRACT: {
      name: 'Scholar',
      supportGroup: 'Abstract',
      harmony: false,
      ocean: { O: 'Hoog', C: 'Gemiddeld-Hoog', E: 'Gemiddeld', A: 'Extreem Hoog', N: 'Verraad van de theorie' },
      stressTrigger: 'Gewelddadige reactie wanneer hun theorie verraden wordt.',
    },
    AGENCY: {
      name: 'Sailor',
      supportGroup: 'Agency',
      harmony: false,
      ocean: { O: 'Hoog', C: 'Laag', E: 'Hoog', A: 'Extreem Laag', N: 'Opsluiting / Restricties' },
      stressTrigger: 'Stress wordt omgezet in woede over opsluiting of systemische restricties.',
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // 6. OUTLAW — Extended Archetypes
  // ═══════════════════════════════════════════════════════════════════
  OUTLAW: {
    RULING: {
      name: 'Reformer',
      supportGroup: 'Ruling',
      harmony: false,
      ocean: { O: 'Laag-Gemiddeld', C: 'Extreem Hoog', E: 'Gemiddeld-Hoog', A: 'Laag-Gemiddeld', N: 'Controleverlies' },
      stressTrigger: 'Rots van stabiliteit, maar is intern doodsbang voor complete anarchie.',
    },
    RELATIONAL: {
      name: 'Liberator',
      supportGroup: 'Relational',
      harmony: false,
      ocean: { O: 'Gemiddeld', C: 'Hoog', E: 'Gemiddeld', A: 'Extreem Hoog', N: 'Compassiemoeheid / Lijden' },
      stressTrigger: 'Vatbaar voor chronische angst en zware compassiemoeheid.',
    },
    SEEKER: {
      name: 'Renegade',
      supportGroup: 'Seeker',
      harmony: false,
      ocean: { O: 'Extreem Hoog', C: 'Laag', E: 'Contextueel', A: 'Gemiddeld', N: 'Verraad van de visie' },
      stressTrigger: 'Gewelddadig neuroticisme wanneer de pure visie verraden wordt.',
    },
    CHAOS: {
      name: 'Anarchist',
      supportGroup: 'Chaos',
      harmony: true,
      harmonyBonus: 69,
      ocean: { O: 'Hoog', C: 'Laag', E: 'Hoog', A: 'Extreem Laag', N: 'Systeemcorruptie' },
      stressTrigger: 'Woede en stress worden gevoed door diepgewortelde systemische corruptie.',
    },
    ABSTRACT: {
      name: 'Iconoclast',
      supportGroup: 'Abstract',
      harmony: false,
      ocean: { O: 'Hoog', C: 'Gemiddeld', E: 'Laag', A: 'Laag', N: 'Valse idolen / Leugens' },
      stressTrigger: 'Internaliseert angst in piekeren en opstellen van worst-case scenario\'s.',
    },
    AGENCY: {
      name: 'Revolutionary',
      supportGroup: 'Agency',
      harmony: false,
      ocean: { O: 'Hoog', C: 'Gemiddeld-Hoog', E: 'Gemiddeld', A: 'Extreem Hoog', N: 'Verraad van de visie' },
      stressTrigger: 'Blinde stress-reactie als bondgenoten de strijd en visie verraden.',
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // 7. TRICKSTER — Extended Archetypes
  // ═══════════════════════════════════════════════════════════════════
  TRICKSTER: {
    RULING: {
      name: 'Jester',
      supportGroup: 'Ruling',
      harmony: false,
      ocean: { O: 'Laag-Gemiddeld', C: 'Extreem Hoog', E: 'Gemiddeld-Hoog', A: 'Laag-Gemiddeld', N: 'Onveiligheid' },
      stressTrigger: 'Rots van stabiliteit, maar vreest stiekem absolute anarchie.',
    },
    RELATIONAL: {
      name: 'Clown',
      supportGroup: 'Relational',
      harmony: false,
      ocean: { O: 'Hoog', C: 'Gemiddeld-Laag', E: 'Hoog', A: 'Extreem Hoog', N: 'Disconnectie' },
      stressTrigger: 'Zeer gevoelig voor disconnectie met hun partner of hun publiek.',
    },
    SEEKER: {
      name: 'Shapeshifter',
      supportGroup: 'Seeker',
      harmony: false,
      ocean: { O: 'Extreem Hoog', C: 'Gemiddeld-Laag', E: 'Gemiddeld', A: 'Gemiddeld', N: 'Creatieve stagnatie' },
      stressTrigger: 'Hun psychologische basislijn is uiterst gevoelig en instabiel.',
    },
    CHAOS: {
      name: 'Fool',
      supportGroup: 'Chaos',
      harmony: true,
      harmonyBonus: 69,
      ocean: { O: 'Hoog', C: 'Gemiddeld-Hoog', E: 'Gemiddeld', A: 'Extreem Hoog', N: 'Verraad van de bubbel' },
      stressTrigger: 'Gewelddadige paniekreactie wanneer het veilige "paradijs" verraden wordt.',
    },
    ABSTRACT: {
      name: 'Comedian',
      supportGroup: 'Abstract',
      harmony: false,
      ocean: { O: 'Extreem Hoog', C: 'Hoog', E: 'Laag', A: 'Laag-Gemiddeld', N: 'Donkere realiteit' },
      stressTrigger: 'Internaliseert angst over de realiteit in donker, obsessief piekeren.',
    },
    AGENCY: {
      name: 'Saboteur',
      supportGroup: 'Agency',
      harmony: false,
      ocean: { O: 'Gemiddeld-Laag', C: 'Extreem Hoog', E: 'Hoog', A: 'Laag-Gemiddeld', N: 'Onderdrukte paniek' },
      stressTrigger: 'Heeft een hoge stresstolerantie doordat ze interne paniek agressief onderdrukken.',
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // 8. SAGE — Extended Archetypes
  // ═══════════════════════════════════════════════════════════════════
  SAGE: {
    RULING: {
      name: 'Analyst',
      supportGroup: 'Ruling',
      harmony: false,
      ocean: { O: 'Gemiddeld', C: 'Extreem Hoog', E: 'Laag', A: 'Laag', N: 'Ambiguïteit' },
      stressTrigger: 'Onrustig door ambiguïteit of onkwantificeerbare variabelen.',
    },
    RELATIONAL: {
      name: 'Mentor',
      supportGroup: 'Relational',
      harmony: false,
      ocean: { O: 'Hoog', C: 'Hoog', E: 'Gemiddeld', A: 'Zeer Hoog', N: 'Falen van de student' },
      stressTrigger: 'Een gereguleerd anker, maar vreest het falen of verlies van hun student.',
    },
    SEEKER: {
      name: 'Dreamer',
      supportGroup: 'Seeker',
      harmony: false,
      ocean: { O: 'Extreem Hoog', C: 'Gemiddeld', E: 'Gemiddeld', A: 'Gemiddeld', N: 'Vernietiging van de theorie' },
      stressTrigger: 'Uiterst volatiel; direct getriggerd door de vernietiging van de theorie.',
    },
    CHAOS: {
      name: 'Hermit',
      supportGroup: 'Chaos',
      harmony: false,
      ocean: { O: 'Hoog', C: 'Laag', E: 'Laag', A: 'Laag', N: 'Sociale druk / Fobie' },
      stressTrigger: 'Tweeledige grens: deelt diepe vrede, maar ervaart ernstige fobie voor sociale druk.',
    },
    ABSTRACT: {
      name: 'Enlightened',
      supportGroup: 'Abstract',
      harmony: true,
      harmonyBonus: 69,
      ocean: { O: 'Extreem Hoog', C: 'Gemiddeld', E: 'Laag', A: 'Hoog', N: 'Materiële beknelling' },
      stressTrigger: 'Naar buiten toe rustig; getriggerd door materiële beknelling of trivialiteit.',
    },
    AGENCY: {
      name: 'Detective',
      supportGroup: 'Agency',
      harmony: false,
      ocean: { O: 'Hoog', C: 'Uitzonderlijk Hoog', E: 'Gemiddeld', A: 'Zeer Laag', N: 'Onopgeloste anomalieën' },
      stressTrigger: 'Raakt geobsedeerd en gestrest door onopgeloste anomalieën.',
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // 9. ARTIST — Extended Archetypes
  // ═══════════════════════════════════════════════════════════════════
  ARTIST: {
    RULING: {
      name: 'Architect',
      supportGroup: 'Ruling',
      harmony: false,
      ocean: { O: 'Hoog', C: 'Extreem Hoog', E: 'Gemiddeld', A: 'Laag-Gemiddeld', N: 'Controleverlies' },
      stressTrigger: 'Getriggerd door controleverlies of dreigende systemische anarchie.',
    },
    RELATIONAL: {
      name: 'Storyteller',
      supportGroup: 'Relational',
      harmony: false,
      ocean: { O: 'Hoog', C: 'Gemiddeld-Laag', E: 'Hoog', A: 'Extreem Hoog', N: 'Groeps-disharmonie' },
      stressTrigger: 'Extreem gevoelig voor waargenomen afstand of disharmonie in de groep.',
    },
    SEEKER: {
      name: 'Visionary',
      supportGroup: 'Seeker',
      harmony: false,
      ocean: { O: 'Hoog', C: 'Hoog', E: 'Laag', A: 'Laag-Gemiddeld', N: 'Inperking van verbeelding' },
      stressTrigger: 'Gewelddadige reactie wanneer de verbeelding wordt ingeperkt door de harde realiteit.',
    },
    CHAOS: {
      name: 'Illusionist',
      supportGroup: 'Chaos',
      harmony: false,
      ocean: { O: 'Extreem Hoog', C: 'Laag', E: 'Gemiddeld', A: 'Gemiddeld', N: 'Emotionele turbulentie' },
      stressTrigger: 'Volatiel; getriggerd door emotionele turbulentie in het breken van kaders.',
    },
    ABSTRACT: {
      name: 'Demiurge',
      supportGroup: 'Abstract',
      harmony: true,
      harmonyBonus: 69,
      ocean: { O: 'Extreem Hoog', C: 'Variabel', E: 'Gemiddeld', A: 'Gemiddeld-Laag', N: 'Vaste beperkingen' },
      stressTrigger: 'Gevoelig voor overdenken, piekeren of "analyse verlamming".',
    },
    AGENCY: {
      name: 'Forgemaster',
      supportGroup: 'Agency',
      harmony: false,
      ocean: { O: 'Hoog', C: 'Gemiddeld-Laag', E: 'Hoog', A: 'Laag-Gemiddeld', N: 'Tunnelvisie' },
      stressTrigger: 'Hoge stresstolerantie, maar onderdrukt angst agressief door een tunnelvisie te creëren.',
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // 10. MAGICIAN — Extended Archetypes
  // ═══════════════════════════════════════════════════════════════════
  MAGICIAN: {
    RULING: {
      name: 'Engineer',
      supportGroup: 'Ruling',
      harmony: false,
      ocean: { O: 'Laag-Gemiddeld', C: 'Extreem Hoog', E: 'Gemiddeld-Hoog', A: 'Laag-Gemiddeld', N: 'Anarchie' },
      stressTrigger: 'Rots van stabiliteit, maar intern doodsbang voor anarchie.',
    },
    RELATIONAL: {
      name: 'Shaman',
      supportGroup: 'Relational',
      harmony: false,
      ocean: { O: 'Hoog', C: 'Laag', E: 'Hoog', A: 'Extreem Hoog', N: 'Afwijzing' },
      stressTrigger: 'Uiterst gevoelig voor de kleinste tekenen van disconnectie of afwijzing.',
    },
    SEEKER: {
      name: 'Oracle',
      supportGroup: 'Seeker',
      harmony: false,
      ocean: { O: 'Hoog', C: 'Gemiddeld-Hoog', E: 'Gemiddeld', A: 'Extreem Hoog', N: 'Verlies van voorspelbaarheid' },
      stressTrigger: 'Piekt gewelddadig wanneer de voorspelbaarheid wordt doorprikt.',
    },
    CHAOS: {
      name: 'Enchanter',
      supportGroup: 'Chaos',
      harmony: false,
      ocean: { O: 'Extreem Hoog', C: 'Laag-Gemiddeld', E: 'Gemiddeld', A: 'Laag-Gemiddeld', N: 'Angst onder vuur' },
      stressTrigger: 'Naar buiten toe kalm; hoge stresstolerantie onder vuur en onderdrukt interne angst.',
    },
    ABSTRACT: {
      name: 'Sorcerer',
      supportGroup: 'Abstract',
      harmony: false,
      ocean: { O: 'Extreem Hoog', C: 'Gemiddeld-Hoog', E: 'Laag', A: 'Laag-Gemiddeld', N: 'Onbuigzame realiteit' },
      stressTrigger: 'Raakt gestrest en begint snel variabelen en worst-case scenario\'s te berekenen.',
    },
    AGENCY: {
      name: 'Alchemist',
      supportGroup: 'Agency',
      harmony: true,
      harmonyBonus: 69,
      ocean: { O: 'Extreem Hoog', C: 'Laag-Gemiddeld', E: 'Gemiddeld', A: 'Laag-Gemiddeld', N: 'Wil-conflict' },
      stressTrigger: 'Psychologische instorting als de realiteit zich niet wil aanpassen aan hun wil.',
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // 11. HERO — Extended Archetypes
  // ═══════════════════════════════════════════════════════════════════
  HERO: {
    RULING: {
      name: 'Commander',
      supportGroup: 'Ruling',
      harmony: false,
      ocean: { O: 'Laag', C: 'Extreem Hoog', E: 'Hoog', A: 'Laag', N: 'Verlies van hiërarchie' },
      stressTrigger: 'Intern doodsbang voor anarchie of het verlies van hiërarchische controle.',
    },
    RELATIONAL: {
      name: 'Guardian',
      supportGroup: 'Relational',
      harmony: false,
      ocean: { O: 'Gemiddeld-Laag', C: 'Extreem Hoog', E: 'Gemiddeld', A: 'Zeer Hoog', N: 'Emotioneel lijden van ander' },
      stressTrigger: 'Internaliseert het emotionele lijden van degenen die ze beschermen.',
    },
    SEEKER: {
      name: 'Inventor',
      supportGroup: 'Seeker',
      harmony: false,
      ocean: { O: 'Hoog', C: 'Gemiddeld', E: 'Hoog', A: 'Gemiddeld-Laag', N: 'Innovatie-blokkade' },
      stressTrigger: 'Zeer gevoelig voor creatieve tegenslagen of onoverkomelijke innovatie-blokkades.',
    },
    CHAOS: {
      name: 'Ronin',
      supportGroup: 'Chaos',
      harmony: false,
      ocean: { O: 'Gemiddeld', C: 'Hoog', E: 'Gemiddeld', A: 'Hoog', N: 'Moreel verraad' },
      stressTrigger: 'Gewelddadige, agressieve reactie op moreel verraad of stagnerende beperkingen.',
    },
    ABSTRACT: {
      name: 'Strategist',
      supportGroup: 'Abstract',
      harmony: false,
      ocean: { O: 'Gemiddeld', C: 'Extreem Hoog', E: 'Gemiddeld', A: 'Laag', N: 'Worst-case scenario\'s' },
      stressTrigger: 'Rend intern om direct alle worst-case scenario\'s in kaart te brengen.',
    },
    AGENCY: {
      name: 'Legend',
      supportGroup: 'Agency',
      harmony: true,
      harmonyBonus: 69,
      ocean: { O: 'Gemiddeld', C: 'Hoog', E: 'Hoog', A: 'Laag', N: 'Corruptie / Tegenwerking' },
      stressTrigger: 'Stress slaat om in woede over corruptie of tegenwerking.',
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // 12. RULER — Extended Archetypes
  // ═══════════════════════════════════════════════════════════════════
  RULER: {
    RULING: {
      name: 'Emperor',
      supportGroup: 'Ruling',
      harmony: true,
      harmonyBonus: 69,
      ocean: { O: 'Laag-Gemiddeld', C: 'Uitzonderlijk Hoog', E: 'Gemiddeld-Hoog', A: 'Laag-Gemiddeld', N: 'Pure anarchie' },
      stressTrigger: 'Rots van stabiliteit, maar is intern doodsbang voor pure anarchie.',
    },
    RELATIONAL: {
      name: 'Patriarch/Matriarch',
      supportGroup: 'Relational',
      harmony: false,
      ocean: { O: 'Gemiddeld', C: 'Hoog', E: 'Gemiddeld', A: 'Extreem Hoog', N: 'Emotioneel gewicht' },
      stressTrigger: 'Wordt gestrest door het dragen van het emotionele gewicht van afhankelijken.',
    },
    SEEKER: {
      name: 'Entrepreneur',
      supportGroup: 'Seeker',
      harmony: false,
      ocean: { O: 'Hoog', C: 'Gemiddeld-Laag', E: 'Gemiddeld', A: 'Laag-Gemiddeld', N: 'Markt-onmacht' },
      stressTrigger: 'Volatiel vanbinnen; direct getriggerd door het onvermogen om de markt te sturen.',
    },
    CHAOS: {
      name: 'Maverick',
      supportGroup: 'Chaos',
      harmony: false,
      ocean: { O: 'Hoog', C: 'Gemiddeld-Hoog', E: 'Gemiddeld', A: 'Uitzonderlijk Hoog', N: 'Bureaucratie / Verraad' },
      stressTrigger: 'Gewelddadige reactie op bureaucratie, intern verraad of persoonlijke fouten.',
    },
    ABSTRACT: {
      name: 'Philosopher-King',
      supportGroup: 'Abstract',
      harmony: false,
      ocean: { O: 'Gemiddeld-Hoog', C: 'Hoog', E: 'Gemiddeld', A: 'Laag-Gemiddeld', N: 'Irrationaliteit' },
      stressTrigger: 'Raakt gestrest en gefrustreerd door systemische onwetendheid.',
    },
    AGENCY: {
      name: 'Conqueror',
      supportGroup: 'Agency',
      harmony: false,
      ocean: { O: 'Laag-Gemiddeld', C: 'Uitzonderlijk Hoog', E: 'Hoog', A: 'Laag', N: 'Zwakheid / Falen' },
      stressTrigger: 'Enorme stresstolerantie; angst wordt agressief onderdrukt.',
    },
  },
};

/**
 * Look up the extended OCEAN profile for a specific Main + Support Group combination.
 * @param {string} mainKey — e.g. 'JUDGE', 'SAGE'
 * @param {string} supportGroup — e.g. 'RULING', 'RELATIONAL', 'SEEKER', 'CHAOS', 'ABSTRACT', 'AGENCY'
 * @returns {object|undefined}
 */
export function getExtendedOceanProfile(mainKey, supportGroup) {
  const group = EXTENDED_OCEAN_PROFILES[mainKey];
  return group ? group[supportGroup] : undefined;
}

/**
 * Get all 6 extended profiles for a core archetype.
 * @param {string} mainKey
 * @returns {object|undefined}
 */
export function getExtendedOceanProfiles(mainKey) {
  return EXTENDED_OCEAN_PROFILES[mainKey];
}
