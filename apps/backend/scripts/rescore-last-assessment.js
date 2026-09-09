#!/usr/bin/env node
/**
 * Rescore the last assessment with the new weighted Support formula
 * and generate a comparison PDF.
 *
 * Usage:  cd backend && node rescore-last-assessment.js
 */
require('dotenv').config();
const { MongoClient } = require('mongodb');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// ── Constants (mirrored from frontend scoring/index.js) ────────────────
const ALL_ARCHETYPE_KEYS = [
  'JUDGE', 'LOVER', 'CAREGIVER', 'INNOCENT',
  'EXPLORER', 'OUTLAW', 'TRICKSTER', 'SAGE',
  'ARTIST', 'MAGICIAN', 'HERO', 'RULER',
];

const SHADOW_PAIRS = {
  JUDGE: 'TRICKSTER', TRICKSTER: 'JUDGE',
  LOVER: 'SAGE', SAGE: 'LOVER',
  CAREGIVER: 'ARTIST', ARTIST: 'CAREGIVER',
  INNOCENT: 'MAGICIAN', MAGICIAN: 'INNOCENT',
  EXPLORER: 'HERO', HERO: 'EXPLORER',
  OUTLAW: 'RULER', RULER: 'OUTLAW',
};

const RED_LINE = {
  JUDGE: 'OUTLAW', OUTLAW: 'JUDGE',
  RULER: 'TRICKSTER', TRICKSTER: 'RULER',
  LOVER: 'ARTIST', ARTIST: 'LOVER',
  CAREGIVER: 'SAGE', SAGE: 'CAREGIVER',
  INNOCENT: 'HERO', HERO: 'INNOCENT',
  EXPLORER: 'MAGICIAN', MAGICIAN: 'EXPLORER',
};

const ARCHETYPE_TO_GROUP = {
  JUDGE: 'RULING', RULER: 'RULING',
  LOVER: 'RELATIONAL', CAREGIVER: 'RELATIONAL',
  INNOCENT: 'SEEKER', EXPLORER: 'SEEKER',
  OUTLAW: 'CHAOS', TRICKSTER: 'CHAOS',
  SAGE: 'ABSTRACT', ARTIST: 'ABSTRACT',
  MAGICIAN: 'AGENCY', HERO: 'AGENCY',
};

const EXTENDED_ARCHETYPES = {
  // Main: RULER (Positie 12) - #1-11
  RULER_JUDGE:      'The Emperor',
  RULER_SAGE:       'The Sovereign',
  RULER_ARTIST:     'The Designer',
  RULER_EXPLORER:   'The Entrepreneur',
  RULER_INNOCENT:   'The Founder',
  RULER_OUTLAW:     'The Reformer',
  RULER_TRICKSTER:  'The Puppeteer',
  RULER_HERO:       'The Commander',
  RULER_MAGICIAN:   'The Overlord',
  RULER_CAREGIVER:  'The Advocate',
  RULER_LOVER:      'The Patron',

  // Main: JUDGE (Positie 1) - #12-22
  JUDGE_RULER:      'The Arbiter',
  JUDGE_OUTLAW:     'The Whistleblower',
  JUDGE_TRICKSTER:  'The Inquisitor',
  JUDGE_SAGE:       'The Critic',
  JUDGE_ARTIST:     'The Appraiser',
  JUDGE_INNOCENT:   'The Examiner',
  JUDGE_EXPLORER:   'The Auditor',
  JUDGE_HERO:       'The Avenger',
  JUDGE_MAGICIAN:   'The Enforcer',
  JUDGE_CAREGIVER:  'The Mediator',
  JUDGE_LOVER:      'The Reconciler',

  // Main: LOVER (Positie 2) - #23-33
  LOVER_CAREGIVER:  'The Soulmate',
  LOVER_RULER:      'The Companion',
  LOVER_JUDGE:      'The Betrothed',
  LOVER_TRICKSTER:  'The Wingman',
  LOVER_OUTLAW:     'The Libertine',
  LOVER_SAGE:       'The Poet',
  LOVER_ARTIST:     'The Muse',
  LOVER_INNOCENT:   'The Votary',
  LOVER_EXPLORER:   'The Moth',
  LOVER_HERO:       'The Romantic',
  LOVER_MAGICIAN:   'The Spellbinder',

  // Main: CAREGIVER (Positie 3) - #34-44
  CAREGIVER_LOVER:      'The Healer',
  CAREGIVER_RULER:      'The Patriarch/Matriarch',
  CAREGIVER_JUDGE:      'The Defender',
  CAREGIVER_OUTLAW:     'The Cultivator',
  CAREGIVER_TRICKSTER:  'The Empath',
  CAREGIVER_SAGE:       'The Therapist',
  CAREGIVER_ARTIST:     'The Restorer',
  CAREGIVER_EXPLORER:   'The Pilgrim',
  CAREGIVER_INNOCENT:   'The Devotee',
  CAREGIVER_HERO:       'The Guardian',
  CAREGIVER_MAGICIAN:   'The Warden',

  // Main: INNOCENT (Positie 4) - #45-55
  INNOCENT_EXPLORER:   'The Saint',
  INNOCENT_RULER:      'The Shepherd',
  INNOCENT_JUDGE:      'The Traditionalist',
  INNOCENT_TRICKSTER:  'The Free Spirit',
  INNOCENT_OUTLAW:     'The Torchbearer',
  INNOCENT_SAGE:       'The Disciple',
  INNOCENT_ARTIST:     'The Utopian',
  INNOCENT_HERO:       'The Pioneer',
  INNOCENT_MAGICIAN:   'The Illuminator',
  INNOCENT_CAREGIVER:  'The Samaritan',
  INNOCENT_LOVER:      'The Sweetheart',

  // Main: EXPLORER (Positie 5) - #56-66
  EXPLORER_INNOCENT:   'The Navigator',
  EXPLORER_RULER:      'The Networker',
  EXPLORER_JUDGE:      'The Surveyor',
  EXPLORER_OUTLAW:     'The Innovator',
  EXPLORER_TRICKSTER:  'The Scout',
  EXPLORER_SAGE:       'The Philosopher',
  EXPLORER_ARTIST:     'The Bard',
  EXPLORER_HERO:       'The Sailor',
  EXPLORER_MAGICIAN:   'The Nomad',
  EXPLORER_LOVER:      'The Stargazer',
  EXPLORER_CAREGIVER:  'The Pathfinder',

  // Main: HERO (Positie 11) - #67-77
  HERO_MAGICIAN:   'The Legend',
  HERO_RULER:      'The Conqueror',
  HERO_JUDGE:      'The Templar',
  HERO_OUTLAW:     'The Raider',
  HERO_TRICKSTER:  'The Spy',
  HERO_SAGE:       'The Strategist',
  HERO_ARTIST:     'The Duelist',
  HERO_EXPLORER:   'The Astronaut',
  HERO_INNOCENT:   'The Crusader',
  HERO_CAREGIVER:  'The Protector',
  HERO_LOVER:      'The Chevalier',

  // Main: MAGICIAN (Positie 10) - #78-88
  MAGICIAN_HERO:       'The Alchemist',
  MAGICIAN_RULER:      'The Engineer',
  MAGICIAN_JUDGE:      'The Reckoner',
  MAGICIAN_OUTLAW:     'The Protagonist',
  MAGICIAN_TRICKSTER:  'The Enchanter',
  MAGICIAN_SAGE:       'The Sorcerer',
  MAGICIAN_ARTIST:     'The Performer',
  MAGICIAN_INNOCENT:   'The Catalyst',
  MAGICIAN_EXPLORER:   'The Trailblazer',
  MAGICIAN_LOVER:      'The Shaman',
  MAGICIAN_CAREGIVER:  'The Redeemer',

  // Main: OUTLAW (Positie 6) - #89-99
  OUTLAW_TRICKSTER:  'The Anarchist',
  OUTLAW_RULER:      'The Maverick',
  OUTLAW_JUDGE:      'The Contrarian',
  OUTLAW_CAREGIVER:  'The Liberator',
  OUTLAW_LOVER:      'The Instigator',
  OUTLAW_SAGE:       'The Iconoclast',
  OUTLAW_ARTIST:     'The Punk',
  OUTLAW_EXPLORER:   'The Renegade',
  OUTLAW_INNOCENT:   'The Idealist',
  OUTLAW_MAGICIAN:   'The Revolutionary',
  OUTLAW_HERO:       'The Ronin',

  // Main: TRICKSTER (Positie 7) - #100-110
  TRICKSTER_OUTLAW:     'The Fool',
  TRICKSTER_RULER:      'The Gatecrasher',
  TRICKSTER_JUDGE:      "The Devil's Advocate",
  TRICKSTER_LOVER:      'The Seducer',
  TRICKSTER_CAREGIVER:  'The Chameleon',
  TRICKSTER_SAGE:       'The Riddler',
  TRICKSTER_ARTIST:     'The Impressionist',
  TRICKSTER_EXPLORER:   'The Free-runner',
  TRICKSTER_INNOCENT:   'The Joyrider',
  TRICKSTER_MAGICIAN:   'The Shapeshifter',
  TRICKSTER_HERO:       'The Ace',

  // Main: SAGE (Positie 8) - #111-121
  SAGE_ARTIST:     'The Developer',
  SAGE_RULER:      'The Analyst',
  SAGE_JUDGE:      'The Skeptic',
  SAGE_CAREGIVER:  'The Mentor',
  SAGE_LOVER:      'The Guru',
  SAGE_OUTLAW:     'The Hermit',
  SAGE_TRICKSTER:  'The Theorist',
  SAGE_INNOCENT:   'The Enlightened',
  SAGE_EXPLORER:   'The Scholar',
  SAGE_HERO:       'The Detective',
  SAGE_MAGICIAN:   'The Freemason',

  // Main: ARTIST (Positie 9) - #122-132
  ARTIST_SAGE:       'The Demiurge',
  ARTIST_RULER:      'The Architect',
  ARTIST_JUDGE:      'The Editor',
  ARTIST_LOVER:      'The Troubadour',
  ARTIST_CAREGIVER:  'The Storyteller',
  ARTIST_TRICKSTER:  'The Oracle',
  ARTIST_OUTLAW:     'The Provocateur',
  ARTIST_EXPLORER:   'The Visionary',
  ARTIST_INNOCENT:   'The Prodigy',
  ARTIST_MAGICIAN:   'The Craftsman',
  ARTIST_HERO:       'The Forgemaster',
};

const EXTENDED_ARCHETYPES_NL = {
  // Main: RULER (Positie 12) - #1-11
  RULER_JUDGE:      'De Keizer',
  RULER_SAGE:       'De Soevereine',
  RULER_ARTIST:     'De Ontwerper',
  RULER_EXPLORER:   'De Ondernemer',
  RULER_INNOCENT:   'De Oprichter',
  RULER_OUTLAW:     'De Hervormer',
  RULER_TRICKSTER:  'De Poppenspeler',
  RULER_HERO:       'De Commandant',
  RULER_MAGICIAN:   'De Oppermeester',
  RULER_CAREGIVER:  'De Advocaat',
  RULER_LOVER:      'De Beschermheer',

  // Main: JUDGE (Positie 1) - #12-22
  JUDGE_RULER:      'De Arbiter',
  JUDGE_OUTLAW:     'De Klokkenluider',
  JUDGE_TRICKSTER:  'De Inquisitoir',
  JUDGE_SAGE:       'De Criticus',
  JUDGE_ARTIST:     'De Taxateur',
  JUDGE_INNOCENT:   'De Examinator',
  JUDGE_EXPLORER:   'De Controleur',
  JUDGE_HERO:       'De Wreker',
  JUDGE_MAGICIAN:   'De Handhaver',
  JUDGE_CAREGIVER:  'De Bemiddelaar',
  JUDGE_LOVER:      'De Verzoener',

  // Main: LOVER (Positie 2) - #23-33
  LOVER_CAREGIVER:  'De Zielsverwant',
  LOVER_RULER:      'De Compagnon',
  LOVER_JUDGE:      'De Verloofde',
  LOVER_TRICKSTER:  'De Wingman',
  LOVER_OUTLAW:     'De Genotzoeker',
  LOVER_SAGE:       'De Dichter',
  LOVER_ARTIST:     'De Muze',
  LOVER_INNOCENT:   'De Getrouwe',
  LOVER_EXPLORER:   'De Nachtvlinder',
  LOVER_HERO:       'De Romanticus',
  LOVER_MAGICIAN:   'De Betoveraar',

  // Main: CAREGIVER (Positie 3) - #34-44
  CAREGIVER_LOVER:      'De Genezer',
  CAREGIVER_RULER:      'De Patriarch / Matriarch',
  CAREGIVER_JUDGE:      'De Verdediger',
  CAREGIVER_OUTLAW:     'De Kweker',
  CAREGIVER_TRICKSTER:  'De Empaat',
  CAREGIVER_SAGE:       'De Therapeut',
  CAREGIVER_ARTIST:     'De Hersteller',
  CAREGIVER_EXPLORER:   'De Pilgrim',
  CAREGIVER_INNOCENT:   'De Toegewijde',
  CAREGIVER_HERO:       'De Beschermer',
  CAREGIVER_MAGICIAN:   'De Bewaker',

  // Main: INNOCENT (Positie 4) - #45-55
  INNOCENT_EXPLORER:   'De Heilige',
  INNOCENT_RULER:      'De Herder',
  INNOCENT_JUDGE:      'De Traditionalist',
  INNOCENT_TRICKSTER:  'De Vrije Geest',
  INNOCENT_OUTLAW:     'De Fakkeldrager',
  INNOCENT_SAGE:       'De Discipel',
  INNOCENT_ARTIST:     'De Utopist',
  INNOCENT_HERO:       'De Pionier',
  INNOCENT_MAGICIAN:   'De Verlichter',
  INNOCENT_CAREGIVER:  'De Samaritaan',
  INNOCENT_LOVER:      'De Lieveling',

  // Main: EXPLORER (Positie 5) - #56-66
  EXPLORER_INNOCENT:   'De Navigator',
  EXPLORER_RULER:      'De Netwerker',
  EXPLORER_JUDGE:      'De Verkenner',
  EXPLORER_OUTLAW:     'De Vernieuwer',
  EXPLORER_TRICKSTER:  'De Scout',
  EXPLORER_SAGE:       'De Filosoof',
  EXPLORER_ARTIST:     'De Bard',
  EXPLORER_HERO:       'De Zeeman',
  EXPLORER_MAGICIAN:   'De Nomade',
  EXPLORER_LOVER:      'De Sterrenkijker',
  EXPLORER_CAREGIVER:  'De Padvinder',

  // Main: HERO (Positie 11) - #67-77
  HERO_MAGICIAN:   'De Legende',
  HERO_RULER:      'De Veroveraar',
  HERO_JUDGE:      'De Tempelier',
  HERO_OUTLAW:     'De Plunderaar',
  HERO_TRICKSTER:  'De Spion',
  HERO_SAGE:       'De Strateeg',
  HERO_ARTIST:     'De Duellist',
  HERO_EXPLORER:   'De Astronaut',
  HERO_INNOCENT:   'De Kruisvaarder',
  HERO_CAREGIVER:  'De Beschermer',
  HERO_LOVER:      'De Ridder',

  // Main: MAGICIAN (Positie 10) - #78-88
  MAGICIAN_HERO:       'De Alchemist',
  MAGICIAN_RULER:      'De Ingenieur',
  MAGICIAN_JUDGE:      'De Berekenaar',
  MAGICIAN_OUTLAW:     'De Hoofdrolspeler',
  MAGICIAN_TRICKSTER:  'De Magiër',
  MAGICIAN_SAGE:       'De Tovenaar',
  MAGICIAN_ARTIST:     'De Presteerder',
  MAGICIAN_INNOCENT:   'De Katalysator',
  MAGICIAN_EXPLORER:   'De Baanbreker',
  MAGICIAN_LOVER:      'De Sjamaan',
  MAGICIAN_CAREGIVER:  'De Verlosser',

  // Main: OUTLAW (Positie 6) - #89-99
  OUTLAW_TRICKSTER:  'De Anarchist',
  OUTLAW_RULER:      'De Eenling',
  OUTLAW_JUDGE:      'De Dwarsligger',
  OUTLAW_CAREGIVER:  'De Bevrijder',
  OUTLAW_LOVER:      'De Aanstichter',
  OUTLAW_SAGE:       'De Beeldenstormer',
  OUTLAW_ARTIST:     'De Punker',
  OUTLAW_EXPLORER:   'De Vogelvrije',
  OUTLAW_INNOCENT:   'De Idealist',
  OUTLAW_MAGICIAN:   'De Revolutionair',
  OUTLAW_HERO:       'De Ronin',

  // Main: TRICKSTER (Positie 7) - #100-110
  TRICKSTER_OUTLAW:     'De Dwaas',
  TRICKSTER_RULER:      'De Poortbreker',
  TRICKSTER_JUDGE:      'De Advocaat van de Duivel',
  TRICKSTER_LOVER:      'De Verleider',
  TRICKSTER_CAREGIVER:  'De Kameleon',
  TRICKSTER_SAGE:       'De Raadselmeester',
  TRICKSTER_ARTIST:     'De Imitator',
  TRICKSTER_EXPLORER:   'De Freerunner',
  TRICKSTER_INNOCENT:   'De Joyrider',
  TRICKSTER_MAGICIAN:   'De Gedaante-verwisselaar',
  TRICKSTER_HERO:       'De Aas / De Uitblinker',

  // Main: SAGE (Positie 8) - #111-121
  SAGE_ARTIST:     'De Ontwikkelaar',
  SAGE_RULER:      'De Analist',
  SAGE_JUDGE:      'De Skepticus',
  SAGE_CAREGIVER:  'De Mentor',
  SAGE_LOVER:      'De Goeroe',
  SAGE_OUTLAW:     'De Kluizenaar',
  SAGE_TRICKSTER:  'De Theoreticus',
  SAGE_INNOCENT:   'De Verlichte',
  SAGE_EXPLORER:   'De Geleerde',
  SAGE_HERO:       'De Speurder',
  SAGE_MAGICIAN:   'De Vrijmetselaar',

  // Main: ARTIST (Positie 9) - #122-132
  ARTIST_SAGE:       'De Demiurg',
  ARTIST_RULER:      'De Architect',
  ARTIST_JUDGE:      'De Redacteur',
  ARTIST_LOVER:      'De Troubadour',
  ARTIST_CAREGIVER:  'De Verhalenverteller',
  ARTIST_TRICKSTER:  'Het Orakel',
  ARTIST_OUTLAW:     'De Provocateur',
  ARTIST_EXPLORER:   'De Visionair',
  ARTIST_INNOCENT:   'Het Wonderkind',
  ARTIST_MAGICIAN:   'De Ambachtsman',
  ARTIST_HERO:       'De Meestersmid',
};

// ── Geometric Bleed Routing Constants ──────────────────────────
const GREEN_LINE = {
  JUDGE: 'RULER', RULER: 'JUDGE',
  LOVER: 'CAREGIVER', CAREGIVER: 'LOVER',
  INNOCENT: 'EXPLORER', EXPLORER: 'INNOCENT',
  OUTLAW: 'TRICKSTER', TRICKSTER: 'OUTLAW',
  SAGE: 'ARTIST', ARTIST: 'SAGE',
  MAGICIAN: 'HERO', HERO: 'MAGICIAN',
};
const PURPLE_LINE = {
  JUDGE: 'TRICKSTER', TRICKSTER: 'JUDGE',
  LOVER: 'SAGE', SAGE: 'LOVER',
  CAREGIVER: 'ARTIST', ARTIST: 'CAREGIVER',
  INNOCENT: 'MAGICIAN', MAGICIAN: 'INNOCENT',
  EXPLORER: 'HERO', HERO: 'EXPLORER',
  OUTLAW: 'RULER', RULER: 'OUTLAW',
};
const YELLOW_LINES = {
  JUDGE: ['EXPLORER', 'ARTIST'], LOVER: ['OUTLAW', 'MAGICIAN'],
  CAREGIVER: ['TRICKSTER', 'HERO'], INNOCENT: ['SAGE', 'RULER'],
  EXPLORER: ['JUDGE', 'ARTIST'], OUTLAW: ['LOVER', 'MAGICIAN'],
  TRICKSTER: ['CAREGIVER', 'HERO'], SAGE: ['INNOCENT', 'RULER'],
  ARTIST: ['JUDGE', 'EXPLORER'], MAGICIAN: ['LOVER', 'OUTLAW'],
  HERO: ['CAREGIVER', 'TRICKSTER'], RULER: ['INNOCENT', 'SAGE'],
};
const ROTATION_KEYS = {
  1: ['JUDGE', 'TRICKSTER', 'LOVER', 'SAGE', 'INNOCENT', 'HERO'],
  2: ['EXPLORER', 'ARTIST', 'JUDGE', 'TRICKSTER', 'LOVER', 'MAGICIAN'],
  3: ['CAREGIVER', 'HERO', 'INNOCENT', 'ARTIST', 'JUDGE', 'TRICKSTER'],
  4: ['LOVER', 'RULER', 'EXPLORER', 'HERO', 'OUTLAW', 'SAGE'],
  5: ['INNOCENT', 'MAGICIAN', 'OUTLAW', 'RULER', 'CAREGIVER', 'ARTIST'],
  6: ['OUTLAW', 'SAGE', 'CAREGIVER', 'MAGICIAN', 'EXPLORER', 'RULER'],
};
function getKeyForQuestion(questionNum) { return ((questionNum - 1) % 6) + 1; }
function isStandardMode(questionNum) {
  const block = Math.floor((questionNum - 1) / 6);
  const posInBlock = (questionNum - 1) % 6;
  return (posInBlock % 2) === (block % 2);
}
function isNatureSlot(questionNum, slotPos) {
  const standard = isStandardMode(questionNum);
  const isEvenSlot = slotPos % 2 === 0;
  return standard ? isEvenSlot : !isEvenSlot;
}

// ── Helpers ────────────────────────────────────────────────────
function getExtended(main, support) {
  return EXTENDED_ARCHETYPES[`${main}_${support}`] || `${main} / ${support}`;
}
function getExtendedNl(main, support) {
  return EXTENDED_ARCHETYPES_NL[`${main}_${support}`] || `${main} / ${support}`;
}

// ── Scoring Engine (full recompute from raw responses) ─────────
function computeScores(responses) {
  const scores = {};
  ALL_ARCHETYPE_KEYS.forEach(key => {
    scores[key] = {
      nature_core: 0, green_hw: 0, culture_core: 0,
      blue_fb: 0, yellow_cog: 0, purple_shadow: 0,
    };
  });

  function getSlotPos(questionNum, archetype) {
    const key = getKeyForQuestion(questionNum);
    const slots = ROTATION_KEYS[key];
    return slots ? slots.indexOf(archetype) : 0;
  }

  const questionResponses = {};
  for (const r of responses) {
    const qId = typeof r.questionId === 'number' ? r.questionId : parseInt(String(r.questionId), 10);
    if (!qId || qId < 1) continue;
    if (!questionResponses[qId]) questionResponses[qId] = [];
    questionResponses[qId].push(r);
  }

  Object.entries(questionResponses).forEach(([qIdStr, picks]) => {
    const questionNum = parseInt(qIdStr, 10);
    picks.sort((a, b) => (a.pickOrder || 0) - (b.pickOrder || 0));
    picks.forEach((response, pickIdx) => {
      const archetype = response.archetype;
      if (!archetype || !scores[archetype]) return;
      const isFirstPick = pickIdx === 0;
      const slotPos = getSlotPos(questionNum, archetype);
      const isNature = isNatureSlot(questionNum, slotPos);

      if (isNature) {
        scores[archetype].nature_core += isFirstPick ? 9 : 6;
        const greenPartner = GREEN_LINE[archetype];
        if (greenPartner && scores[greenPartner]) {
          scores[greenPartner].green_hw += isFirstPick ? 3 : 1;
        }
        if (isFirstPick && greenPartner && scores[greenPartner]) {
          scores[greenPartner].blue_fb += 2;
        }
        if (isFirstPick) {
          const shadowPartner = PURPLE_LINE[archetype];
          if (shadowPartner && scores[shadowPartner]) {
            scores[shadowPartner].purple_shadow += 1;
          }
        }
      } else {
        scores[archetype].culture_core += isFirstPick ? 8 : 4;
        if (isFirstPick) {
          const bluePartner = GREEN_LINE[archetype];
          if (bluePartner && scores[bluePartner]) {
            scores[bluePartner].blue_fb += 1;
          }
        }
        const yellowPartners = YELLOW_LINES[archetype];
        if (yellowPartners) {
          const yellowPts = isFirstPick ? 2 : 1;
          for (const yp of yellowPartners) {
            if (scores[yp]) scores[yp].yellow_cog += yellowPts;
          }
        }
      }
    });
  });

  ALL_ARCHETYPE_KEYS.forEach(key => {
    const s = scores[key];
    s.total = s.nature_core + s.green_hw + s.culture_core + s.blue_fb + s.yellow_cog + s.purple_shadow;
    s.supportScore = s.nature_core + s.culture_core + s.yellow_cog + s.purple_shadow
                   + 0.5 * s.green_hw + 0.3 * s.blue_fb;
  });

  return scores;
}

/** Old formula: Support = rank #2 by total (all baskets × 1.0) */
function oldSupport(scores) {
  const sorted = ALL_ARCHETYPE_KEYS
    .map(k => ({ key: k, total: scores[k]?.total ?? 0, nc: scores[k]?.nature_core ?? 0 }))
    .sort((a, b) => (b.total - a.total) || (b.nc - a.nc));
  return { main: sorted[0].key, support: sorted[1].key };
}

/** New formula: Support = rank #2 by weighted supportScore */
function newSupport(scores) {
  const sortedByTotal = ALL_ARCHETYPE_KEYS
    .map(k => ({ key: k, total: scores[k]?.total ?? 0, nc: scores[k]?.nature_core ?? 0 }))
    .sort((a, b) => (b.total - a.total) || (b.nc - a.nc));
  const main = sortedByTotal[0].key;

  const supportRank = ALL_ARCHETYPE_KEYS
    .filter(k => k !== main)
    .map(k => {
      const s = scores[k] || {};
      return { key: k, ss: s.supportScore ?? 0, nc: s.nature_core ?? 0 };
    })
    .sort((a, b) => (b.ss - a.ss) || (b.nc - a.nc));

  return { main, support: supportRank[0].key };
}

// ── PDF Generation ─────────────────────────────────────────────
const PAGE_W = 595.28;
const MARGIN = 50;
const CONTENT_W = PAGE_W - MARGIN * 2;
const PURPLE = '#a855f7';
const CYAN = '#22d3ee';
const ORANGE = '#f97316';
const GREEN = '#00b46e';
const RED = '#dc3c3c';
const BLACK = '#1e1e1e';
const GRAY = '#646464';
const LIGHT_GRAY = '#b4b4b4';

function generateComparisonPdf(assessment, oldResult, newResult, allScores) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
      info: {
        Title: 'GFL — Support Scoring Comparison',
        Author: 'Garden For Life Scoring Engine',
      },
    });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    let y = MARGIN;

    // ── Header ──
    doc.fontSize(8).fillColor(LIGHT_GRAY)
      .text('GARDEN FOR LIFE', MARGIN, y, { width: CONTENT_W, align: 'center', characterSpacing: 5 });
    y += 16;
    doc.fontSize(7).fillColor(GRAY)
      .text('Support Scoring Formula — Before / After Comparison', MARGIN, y, { width: CONTENT_W, align: 'center', characterSpacing: 2 });
    y += 24;

    // ── Assessment metadata ──
    doc.fontSize(9).fillColor(BLACK);
    const meta = [
      `Assessment ID: ${assessment._id}`,
      `Created: ${assessment.createdAt?.toLocaleString('nl-NL') || '—'}`,
      `Stored archetype: ${assessment.archetypeKey}`,
      `Stored support group: ${assessment.supportGroup || '—'}`,
      `Stored extended name: ${assessment.extendedArchetypeName || '—'}`,
    ];
    meta.forEach(line => {
      doc.text(line, MARGIN, y, { width: CONTENT_W });
      y = doc.y + 2;
    });
    y += 10;

    // ── Divider ──
    doc.moveTo(MARGIN, y).lineTo(MARGIN + CONTENT_W, y).strokeColor(PURPLE).lineWidth(1).stroke();
    y += 16;

    // ── OLD result ──
    doc.fontSize(12).fillColor(ORANGE).font('Helvetica-Bold')
      .text('OLD FORMULA  (all baskets × 1.0)', MARGIN, y, { width: CONTENT_W });
    y = doc.y + 8;
    doc.fontSize(10).fillColor(BLACK).font('Helvetica');
    const oldExt = getExtended(oldResult.main, oldResult.support);
    const oldExtNl = getExtendedNl(oldResult.main, oldResult.support);
    const oldShadow = SHADOW_PAIRS[oldResult.main] || '—';
    const oldBlind = RED_LINE[oldResult.main] || '—';
    [
      `Main:      ${oldResult.main}`,
      `Support:   ${oldResult.support}  (group: ${ARCHETYPE_TO_GROUP[oldResult.support]})`,
      `Extended:  ${oldExt}  /  ${oldExtNl}`,
      `Shadow:    ${oldShadow}    Blindspot: ${oldBlind}`,
    ].forEach(line => { doc.text(line, MARGIN, y, { width: CONTENT_W }); y = doc.y + 2; });
    y += 14;

    // ── NEW result ──
    doc.fontSize(12).fillColor(GREEN).font('Helvetica-Bold')
      .text('NEW FORMULA  (NK + CK + Y + P + 0.5×HW + 0.3×FB)', MARGIN, y, { width: CONTENT_W });
    y = doc.y + 8;
    doc.fontSize(10).fillColor(BLACK).font('Helvetica');
    const newExt = getExtended(newResult.main, newResult.support);
    const newExtNl = getExtendedNl(newResult.main, newResult.support);
    const newShadow = SHADOW_PAIRS[newResult.main] || '—';
    const newBlind = RED_LINE[newResult.main] || '—';
    const changed = oldResult.support !== newResult.support;
    [
      `Main:      ${newResult.main}`,
      `Support:   ${newResult.support}  (group: ${ARCHETYPE_TO_GROUP[newResult.support]})${changed ? '  ← CHANGED' : '  (unchanged)'}`,
      `Extended:  ${newExt}  /  ${newExtNl}`,
      `Shadow:    ${newShadow}    Blindspot: ${newBlind}`,
    ].forEach(line => { doc.text(line, MARGIN, y, { width: CONTENT_W }); y = doc.y + 2; });
    y += 14;

    if (changed) {
      doc.fontSize(11).fillColor(RED).font('Helvetica-Bold')
        .text(`⚠  SUPPORT CHANGED:  ${oldResult.support} → ${newResult.support}`, MARGIN, y, { width: CONTENT_W });
      y = doc.y + 4;
      doc.fontSize(10).fillColor(RED).font('Helvetica')
        .text(`Extended name changed:  ${oldExtNl} → ${newExtNl}`, MARGIN, y, { width: CONTENT_W });
      y = doc.y + 14;
    } else {
      doc.fontSize(10).fillColor(GREEN).font('Helvetica-Bold')
        .text('✓  Support archetype unchanged — new weights didn\'t flip the runner-up.', MARGIN, y, { width: CONTENT_W });
      y = doc.y + 14;
    }

    // ── Divider ──
    doc.moveTo(MARGIN, y).lineTo(MARGIN + CONTENT_W, y).strokeColor(PURPLE).lineWidth(0.5).stroke();
    y += 14;

    // ── Full ranking table ──
    doc.fontSize(11).fillColor(PURPLE).font('Helvetica-Bold')
      .text('FULL RANKING — All 12 Archetypes', MARGIN, y, { width: CONTENT_W });
    y = doc.y + 10;

    // Table header
    const col = { key: MARGIN, total: MARGIN + 90, nc: MARGIN + 145, ck: MARGIN + 195, hw: MARGIN + 245, fb: MARGIN + 285, yc: MARGIN + 320, ps: MARGIN + 355, ss: MARGIN + 395, rank: MARGIN + 450 };
    doc.fontSize(7).fillColor(GRAY).font('Helvetica-Bold');
    doc.text('Archetype', col.key, y);
    doc.text('Total', col.total, y);
    doc.text('NK', col.nc, y);
    doc.text('CK', col.ck, y);
    doc.text('HW×0.5', col.hw, y);
    doc.text('FB×0.3', col.fb, y);
    doc.text('Y', col.yc, y);
    doc.text('P', col.ps, y);
    doc.text('SupScore', col.ss, y);
    doc.text('Rank', col.rank, y);
    y += 12;
    doc.moveTo(MARGIN, y).lineTo(MARGIN + CONTENT_W, y).strokeColor(LIGHT_GRAY).lineWidth(0.3).stroke();
    y += 4;

    // Sort by supportScore for ranking
    const ranked = ALL_ARCHETYPE_KEYS.map(k => {
      const s = allScores[k] || {};
      const nc = s.nature_core ?? 0;
      const ck = s.culture_core ?? 0;
      const hw = s.green_hw ?? 0;
      const fb = s.blue_fb ?? 0;
      const yc = s.yellow_cog ?? 0;
      const ps = s.purple_shadow ?? 0;
      const total = s.total ?? 0;
      const ss = nc + ck + yc + ps + 0.5 * hw + 0.3 * fb;
      return { key: k, total, nc, ck, hw, fb, yc, ps, ss };
    }).sort((a, b) => (b.ss - a.ss) || (b.nc - a.nc));

    doc.font('Helvetica').fontSize(7).fillColor(BLACK);
    ranked.forEach((r, i) => {
      const isMain = r.key === newResult.main;
      const isSup = r.key === newResult.support;
      const color = isMain ? PURPLE : isSup ? GREEN : BLACK;
      const label = isMain ? '★ MAIN' : isSup ? '★ SUP' : `#${i + 1}`;
      doc.fillColor(color);
      doc.text(r.key, col.key, y);
      doc.text(String(r.total), col.total, y);
      doc.text(String(r.nc), col.nc, y);
      doc.text(String(r.ck), col.ck, y);
      doc.text((0.5 * r.hw).toFixed(1), col.hw, y);
      doc.text((0.3 * r.fb).toFixed(1), col.fb, y);
      doc.text(String(r.yc), col.yc, y);
      doc.text(String(r.ps), col.ps, y);
      doc.text(r.ss.toFixed(1), col.ss, y);
      doc.text(label, col.rank, y);
      y += 12;
    });

    y += 10;

    // ── Formula explanation ──
    doc.fontSize(8).fillColor(GRAY).font('Helvetica');
    doc.text('Support(a) = NK(a) + CK(a) + Y(a) + P(a) + 0.5 × HW(a) + 0.3 × FB(a)', MARGIN, y, { width: CONTENT_W });
    y = doc.y + 4;
    doc.text('NK = Natuur Kern (×1.0)  |  CK = Cultuur Kern (×1.0)  |  Y = Cognitief Yellow (×1.0)', MARGIN, y, { width: CONTENT_W });
    y = doc.y + 2;
    doc.text('P = Schaduw Purple (×1.0)  |  HW = Hardware Green (×0.5)  |  FB = HW Feedback Blue (×0.3)', MARGIN, y, { width: CONTENT_W });

    // ── Footer ──
    y = doc.y + 20;
    doc.moveTo(MARGIN, y).lineTo(MARGIN + CONTENT_W, y).strokeColor(PURPLE).lineWidth(0.5).stroke();
    y += 8;
    doc.fontSize(7).fillColor(LIGHT_GRAY)
      .text(`Generated ${new Date().toLocaleString('nl-NL')}  •  Garden For Life Scoring Engine`, MARGIN, y, { width: CONTENT_W, align: 'center' });

    doc.end();
  });
}

// ── Main ───────────────────────────────────────────────────────
async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('MONGODB_URI not set in .env'); process.exit(1); }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  console.log('[DB] Connected to', db.databaseName);

  // Fetch the most recent assessment
  const assessment = await db.collection('assessments')
    .find({})
    .sort({ createdAt: -1 })
    .limit(1)
    .next();

  if (!assessment) { console.error('No assessments found'); await client.close(); process.exit(1); }

  console.log(`\n[Assessment] ID: ${assessment._id}`);
  console.log(`  Created:   ${assessment.createdAt}`);
  console.log(`  Archetype: ${assessment.archetypeKey}`);
  console.log(`  Support:   ${assessment.supportGroup}`);
  console.log(`  Extended:  ${assessment.extendedArchetypeName}`);
  console.log(`  Responses: ${assessment.responses?.length || 0}`);

  if (!assessment.responses || assessment.responses.length === 0) {
    console.error('Assessment has no stored responses — cannot rescore.');
    await client.close();
    process.exit(1);
  }

  // Recompute all baskets from raw responses
  const scores = computeScores(assessment.responses);

  // Compute old and new
  const oldRes = oldSupport(scores);
  const newRes = newSupport(scores);

  console.log('\n── OLD (equal weights) ──');
  console.log(`  Main: ${oldRes.main}  |  Support: ${oldRes.support}`);
  console.log(`  Extended: ${getExtended(oldRes.main, oldRes.support)}  /  ${getExtendedNl(oldRes.main, oldRes.support)}`);

  console.log('\n── NEW (weighted support) ──');
  console.log(`  Main: ${newRes.main}  |  Support: ${newRes.support}`);
  console.log(`  Extended: ${getExtended(newRes.main, newRes.support)}  /  ${getExtendedNl(newRes.main, newRes.support)}`);

  if (oldRes.support !== newRes.support) {
    console.log(`\n⚠  SUPPORT CHANGED: ${oldRes.support} → ${newRes.support}`);
  } else {
    console.log('\n✓  Support archetype unchanged.');
  }

  // Print full ranking
  console.log('\n── Full ranking (by supportScore) ──');
  const ranked = ALL_ARCHETYPE_KEYS.map(k => {
    const s = scores[k] || {};
    const nc = s.nature_core ?? 0; const ck = s.culture_core ?? 0;
    const hw = s.green_hw ?? 0; const fb = s.blue_fb ?? 0;
    const yc = s.yellow_cog ?? 0; const ps = s.purple_shadow ?? 0;
    const total = s.total ?? 0;
    const ss = nc + ck + yc + ps + 0.5 * hw + 0.3 * fb;
    return { key: k, total, nc, ck, hw, fb, yc, ps, ss };
  }).sort((a, b) => (b.ss - a.ss) || (b.nc - a.nc));

  console.log('  #   Archetype    Total  NK   CK   HW×.5  FB×.3  Y    P    SupScore');
  ranked.forEach((r, i) => {
    const tag = r.key === newRes.main ? '★M' : r.key === newRes.support ? '★S' : `${i+1}`.padStart(2);
    console.log(`  ${tag}  ${r.key.padEnd(12)} ${String(r.total).padStart(5)}  ${String(r.nc).padStart(3)}  ${String(r.ck).padStart(3)}  ${(0.5*r.hw).toFixed(1).padStart(5)}  ${(0.3*r.fb).toFixed(1).padStart(5)}  ${String(r.yc).padStart(3)}  ${String(r.ps).padStart(3)}  ${r.ss.toFixed(1).padStart(7)}`);
  });

  // Generate PDF
  const pdfBuf = await generateComparisonPdf(assessment, oldRes, newRes, scores);
  const outPath = path.join(__dirname, 'rescore-comparison.pdf');
  fs.writeFileSync(outPath, pdfBuf);
  console.log(`\n📄 PDF saved: ${outPath}  (${(pdfBuf.length / 1024).toFixed(1)} KB)`);

  await client.close();
}

main().catch(err => { console.error(err); process.exit(1); });
