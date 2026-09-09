/**
 * End-to-end API test: Generate 60 random answers → score → call Claude
 *
 * Usage: cd backend && node test-assessment-e2e.js
 */
require('dotenv').config();
const config = require('./config');
const { callAI } = require('./services/aiProviders');

// ── Import question data (CommonJS-compatible) ──
// The assessmentData uses ES module exports, so we load it via a small trick:
// We'll define the 60 questions inline from the known structure.

// Each question has 6 answers: positions 0-5, IDs like "1a","1b"..."1f"
// We'll pick random answers A-F (positions 0-5) for each question.

const ARCHETYPE_PATTERNS = {
  // Odd questions use patterns 1 or 3, Even use patterns 2 or 4
  // Pattern 1: A:Sage B:Hero C:Lover D:Artist E:Ruler F:Innocent
  // Pattern 2: A:Magician B:Judge C:Trickster D:Explorer E:Outlaw F:Caregiver
  // Pattern 3: A:Innocent B:Ruler C:Artist D:Lover E:Hero F:Sage
  // Pattern 4: A:Caregiver B:Outlaw C:Explorer D:Trickster E:Judge F:Magician
  1: ['SAGE', 'HERO', 'LOVER', 'ARTIST', 'RULER', 'INNOCENT'],
  2: ['MAGICIAN', 'JUDGE', 'TRICKSTER', 'EXPLORER', 'OUTLAW', 'CAREGIVER'],
  3: ['INNOCENT', 'RULER', 'ARTIST', 'LOVER', 'HERO', 'SAGE'],
  4: ['CAREGIVER', 'OUTLAW', 'EXPLORER', 'TRICKSTER', 'JUDGE', 'MAGICIAN'],
};

function getPattern(questionNum) {
  const isOdd = questionNum % 2 === 1;
  const cycle = Math.floor((questionNum - 1) / 2) % 2; // alternates 0,1
  if (isOdd) return cycle === 0 ? 1 : 3;
  return cycle === 0 ? 2 : 4;
}

function getArchetypeForAnswer(questionNum, pos) {
  const pattern = getPattern(questionNum);
  return ARCHETYPE_PATTERNS[pattern][pos];
}

// ── Shadow pairs (180° on wheel) ──
const SHADOW_PAIRS = {
  JUDGE: 'TRICKSTER', TRICKSTER: 'JUDGE',
  LOVER: 'SAGE', SAGE: 'LOVER',
  CAREGIVER: 'ARTIST', ARTIST: 'CAREGIVER',
  INNOCENT: 'MAGICIAN', MAGICIAN: 'INNOCENT',
  EXPLORER: 'HERO', HERO: 'EXPLORER',
  OUTLAW: 'RULER', RULER: 'OUTLAW',
};

// ── Red Line pairs (neural conflict) ──
const RED_LINE = {
  JUDGE: 'OUTLAW', OUTLAW: 'JUDGE',
  RULER: 'TRICKSTER', TRICKSTER: 'RULER',
  LOVER: 'ARTIST', ARTIST: 'LOVER',
  CAREGIVER: 'SAGE', SAGE: 'CAREGIVER',
  INNOCENT: 'HERO', HERO: 'INNOCENT',
  EXPLORER: 'MAGICIAN', MAGICIAN: 'EXPLORER',
};

// ── Complementary pairs (Green Line — same biological pillar) ──
const COMPLEMENTARY_PAIRS = {
  JUDGE: 'RULER', RULER: 'JUDGE',
  LOVER: 'CAREGIVER', CAREGIVER: 'LOVER',
  INNOCENT: 'EXPLORER', EXPLORER: 'INNOCENT',
  OUTLAW: 'TRICKSTER', TRICKSTER: 'OUTLAW',
  SAGE: 'ARTIST', ARTIST: 'SAGE',
  MAGICIAN: 'HERO', HERO: 'MAGICIAN',
};

const GROUP_FOR = {
  JUDGE: 'RULING', RULER: 'RULING',
  LOVER: 'RELATIONAL', CAREGIVER: 'RELATIONAL',
  INNOCENT: 'SEEKER', EXPLORER: 'SEEKER',
  OUTLAW: 'CHAOS', TRICKSTER: 'CHAOS',
  SAGE: 'ABSTRACT', ARTIST: 'ABSTRACT',
  MAGICIAN: 'AGENCY', HERO: 'AGENCY',
};

const EXTENDED_MATRIX = {
  // Main: RULER (Positie 12) - #1-11
  RULER_JUDGE:      'Emperor',
  RULER_SAGE:       'Sovereign',
  RULER_ARTIST:     'Designer',
  RULER_EXPLORER:   'Entrepreneur',
  RULER_INNOCENT:   'Founder',
  RULER_OUTLAW:     'Reformer',
  RULER_TRICKSTER:  'Puppeteer',
  RULER_HERO:       'Commander',
  RULER_MAGICIAN:   'Overlord',
  RULER_CAREGIVER:  'Advocate',
  RULER_LOVER:      'Patron',

  // Main: JUDGE (Positie 1) - #12-22
  JUDGE_RULER:      'Arbiter',
  JUDGE_OUTLAW:     'Whistleblower',
  JUDGE_TRICKSTER:  'Inquisitor',
  JUDGE_SAGE:       'Critic',
  JUDGE_ARTIST:     'Appraiser',
  JUDGE_INNOCENT:   'Examiner',
  JUDGE_EXPLORER:   'Auditor',
  JUDGE_HERO:       'Avenger',
  JUDGE_MAGICIAN:   'Enforcer',
  JUDGE_CAREGIVER:  'Mediator',
  JUDGE_LOVER:      'Reconciler',

  // Main: LOVER (Positie 2) - #23-33
  LOVER_CAREGIVER:  'Soulmate',
  LOVER_RULER:      'Companion',
  LOVER_JUDGE:      'Betrothed',
  LOVER_TRICKSTER:  'Wingman',
  LOVER_OUTLAW:     'Libertine',
  LOVER_SAGE:       'Poet',
  LOVER_ARTIST:     'Muse',
  LOVER_INNOCENT:   'Votary',
  LOVER_EXPLORER:   'Moth',
  LOVER_HERO:       'Romantic',
  LOVER_MAGICIAN:   'Spellbinder',

  // Main: CAREGIVER (Positie 3) - #34-44
  CAREGIVER_LOVER:      'Healer',
  CAREGIVER_RULER:      'Patriarch/Matriarch',
  CAREGIVER_JUDGE:      'Defender',
  CAREGIVER_OUTLAW:     'Cultivator',
  CAREGIVER_TRICKSTER:  'Empath',
  CAREGIVER_SAGE:       'Therapist',
  CAREGIVER_ARTIST:     'Restorer',
  CAREGIVER_EXPLORER:   'Pilgrim',
  CAREGIVER_INNOCENT:   'Devotee',
  CAREGIVER_HERO:       'Guardian',
  CAREGIVER_MAGICIAN:   'Warden',

  // Main: INNOCENT (Positie 4) - #45-55
  INNOCENT_EXPLORER:   'Saint',
  INNOCENT_RULER:      'Shepherd',
  INNOCENT_JUDGE:      'Traditionalist',
  INNOCENT_TRICKSTER:  'Free Spirit',
  INNOCENT_OUTLAW:     'Torchbearer',
  INNOCENT_SAGE:       'Disciple',
  INNOCENT_ARTIST:     'Utopian',
  INNOCENT_HERO:       'Pioneer',
  INNOCENT_MAGICIAN:   'Illuminator',
  INNOCENT_CAREGIVER:  'Samaritan',
  INNOCENT_LOVER:      'Sweetheart',

  // Main: EXPLORER (Positie 5) - #56-66
  EXPLORER_INNOCENT:   'Navigator',
  EXPLORER_RULER:      'Networker',
  EXPLORER_JUDGE:      'Surveyor',
  EXPLORER_OUTLAW:     'Innovator',
  EXPLORER_TRICKSTER:  'Scout',
  EXPLORER_SAGE:       'Philosopher',
  EXPLORER_ARTIST:     'Bard',
  EXPLORER_HERO:       'Sailor',
  EXPLORER_MAGICIAN:   'Nomad',
  EXPLORER_LOVER:      'Stargazer',
  EXPLORER_CAREGIVER:  'Pathfinder',

  // Main: HERO (Positie 11) - #67-77
  HERO_MAGICIAN:   'Legend',
  HERO_RULER:      'Conqueror',
  HERO_JUDGE:      'Templar',
  HERO_OUTLAW:     'Raider',
  HERO_TRICKSTER:  'Spy',
  HERO_SAGE:       'Strategist',
  HERO_ARTIST:     'Duelist',
  HERO_EXPLORER:   'Astronaut',
  HERO_INNOCENT:   'Crusader',
  HERO_CAREGIVER:  'Protector',
  HERO_LOVER:      'Chevalier',

  // Main: MAGICIAN (Positie 10) - #78-88
  MAGICIAN_HERO:       'Alchemist',
  MAGICIAN_RULER:      'Engineer',
  MAGICIAN_JUDGE:      'Reckoner',
  MAGICIAN_OUTLAW:     'Protagonist',
  MAGICIAN_TRICKSTER:  'Enchanter',
  MAGICIAN_SAGE:       'Sorcerer',
  MAGICIAN_ARTIST:     'Performer',
  MAGICIAN_INNOCENT:   'Catalyst',
  MAGICIAN_EXPLORER:   'Trailblazer',
  MAGICIAN_LOVER:      'Shaman',
  MAGICIAN_CAREGIVER:  'Redeemer',

  // Main: OUTLAW (Positie 6) - #89-99
  OUTLAW_TRICKSTER:  'Anarchist',
  OUTLAW_RULER:      'Maverick',
  OUTLAW_JUDGE:      'Contrarian',
  OUTLAW_CAREGIVER:  'Liberator',
  OUTLAW_LOVER:      'Instigator',
  OUTLAW_SAGE:       'Iconoclast',
  OUTLAW_ARTIST:     'Punk',
  OUTLAW_EXPLORER:   'Renegade',
  OUTLAW_INNOCENT:   'Idealist',
  OUTLAW_MAGICIAN:   'Revolutionary',
  OUTLAW_HERO:       'Ronin',

  // Main: TRICKSTER (Positie 7) - #100-110
  TRICKSTER_OUTLAW:     'Fool',
  TRICKSTER_RULER:      'Gatecrasher',
  TRICKSTER_JUDGE:      "Devil's Advocate",
  TRICKSTER_LOVER:      'Seducer',
  TRICKSTER_CAREGIVER:  'Chameleon',
  TRICKSTER_SAGE:       'Riddler',
  TRICKSTER_ARTIST:     'Impressionist',
  TRICKSTER_EXPLORER:   'Free-runner',
  TRICKSTER_INNOCENT:   'Joyrider',
  TRICKSTER_MAGICIAN:   'Shapeshifter',
  TRICKSTER_HERO:       'Ace',

  // Main: SAGE (Positie 8) - #111-121
  SAGE_ARTIST:     'Developer',
  SAGE_RULER:      'Analyst',
  SAGE_JUDGE:      'Skeptic',
  SAGE_CAREGIVER:  'Mentor',
  SAGE_LOVER:      'Guru',
  SAGE_OUTLAW:     'Hermit',
  SAGE_TRICKSTER:  'Theorist',
  SAGE_INNOCENT:   'Enlightened',
  SAGE_EXPLORER:   'Scholar',
  SAGE_HERO:       'Detective',
  SAGE_MAGICIAN:   'Freemason',

  // Main: ARTIST (Positie 9) - #122-132
  ARTIST_SAGE:       'Demiurge',
  ARTIST_RULER:      'Architect',
  ARTIST_JUDGE:      'Editor',
  ARTIST_LOVER:      'Troubadour',
  ARTIST_CAREGIVER:  'Storyteller',
  ARTIST_TRICKSTER:  'Oracle',
  ARTIST_OUTLAW:     'Provocateur',
  ARTIST_EXPLORER:   'Visionary',
  ARTIST_INNOCENT:   'Prodigy',
  ARTIST_MAGICIAN:   'Craftsman',
  ARTIST_HERO:       'Forgemaster',
};

// ═════════════════════════════════════════════
// STEP 1: Generate 60 random answers
// ═════════════════════════════════════════════

function generateRandomAnswers() {
  const answers = [];
  for (let q = 1; q <= 60; q++) {
    const pos = Math.floor(Math.random() * 6); // 0-5 = A-F
    const letter = String.fromCharCode(97 + pos);
    const answerId = `${q}${letter}`;
    const archetype = getArchetypeForAnswer(q, pos);
    answers.push({ questionNum: q, pos, answerId, archetype });
  }
  return answers;
}

// ═════════════════════════════════════════════
// STEP 2: Score the answers
// ═════════════════════════════════════════════

function scoreAnswers(answers) {
  const scores = {};
  const counts = {};
  const ALL_KEYS = ['JUDGE','LOVER','CAREGIVER','INNOCENT','EXPLORER','OUTLAW',
                    'TRICKSTER','SAGE','ARTIST','MAGICIAN','HERO','RULER'];
  ALL_KEYS.forEach(k => { scores[k] = 0; counts[k] = 0; });

  const answerLog = [];

  for (const a of answers) {
    scores[a.archetype] += 5;
    counts[a.archetype] += 1;
    answerLog.push({
      questionId: a.questionNum,
      archetype: a.archetype,
      answerId: a.answerId,
    });
  }

  // Determine Main & Support
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const mainKey = sorted[0][0];
  const supportKey = sorted[1][0];
  const supportGroup = GROUP_FOR[supportKey];
  
  // Check bonuses (Geometric Bleed — no separate counters)
  const harmonyActive = false;
  const shadowBonusActive = SHADOW_PAIRS[mainKey] === supportKey;

  const shadowKey = SHADOW_PAIRS[mainKey];
  const blindspotKey = RED_LINE[mainKey];
  const extendedName = EXTENDED_MATRIX[`${mainKey}_${supportKey}`] || mainKey;

  return {
    mainKey,
    supportKey,
    supportGroup,
    extendedName,
    shadowKey,
    blindspotKey,
    harmonyActive,
    shadowBonusActive,
    scores,
    counts,
    answerLog,
    totalScore: Object.values(scores).reduce((s, v) => s + v, 0),
  };
}

// ═════════════════════════════════════════════
// STEP 3: Call Claude API
// ═════════════════════════════════════════════

async function callAssessmentAPI(result) {
  // Build the same params the frontend sends
  const params = {
    provider: 'claude',
    archetypeKey: result.mainKey,
    supportArchetype: result.supportKey,
    supportGroup: result.supportGroup,
    mainGroup: GROUP_FOR[result.mainKey],
    extendedArchetypeName: result.extendedName,
    shadowArchetype: result.shadowKey,
    blindspotArchetype: result.blindspotKey,
    isIndividuated: result.shadowBonusActive,
    hasHarmonyBonus: false,
    harmonyBonusApplied: 0,
    scores: result.scores,
    responses: result.answerLog,
    level: 'advanced',
    maxTokens: 16384,
    temperature: 0.7,
  };

  // Call the backend AI service directly (bypass HTTP)
  const { buildSystemPrompt, buildUserMessage } = require('./prompts/advanced');

  // Fetch context documents from DB (if available)
  let contextDocs = [];
  try {
    const { getDB } = require('./db');
    const db = getDB();
    if (db) {
      contextDocs = await db.collection('promptDocuments').find({}).toArray();
    }
  } catch (e) {
    console.log('(No DB connection — skipping context docs)');
  }

  const promptData = {
    ...params,
    contextDocs,
  };

  const system = buildSystemPrompt(promptData);
  const user = buildUserMessage(promptData);

  console.log('\n─── SYSTEM PROMPT SIZE ───');
  console.log(`${system.length} chars / ~${Math.round(system.length / 4)} tokens`);
  console.log('\n─── USER MESSAGE ───');
  console.log(user);
  console.log('─────────────────────\n');

  const aiResult = await callAI({
    provider: 'claude',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    maxTokens: 16384,
    temperature: 0.7,
  });

  return aiResult;
}

// ═════════════════════════════════════════════
// MAIN
// ═════════════════════════════════════════════

async function main() {
  console.log('═══════════════════════════════════════');
  console.log('  GFL Assessment E2E API Test');
  console.log('  Model: ' + config.ai.claude.defaultModel);
  console.log('═══════════════════════════════════════\n');

  // Step 1: Generate answers
  const answers = generateRandomAnswers();
  console.log('── GENERATED 60 RANDOM ANSWERS ──');
  console.log('Q  | Ans | Archetype');
  console.log('---|-----|----------');
  for (const a of answers) {
    console.log(`${String(a.questionNum).padStart(2)} |  ${a.answerId.padEnd(3)} | ${a.archetype}`);
  }

  // Step 2: Score
  const result = scoreAnswers(answers);
  console.log('\n── SCORING RESULTS ──');
  console.log(`Main:     ${result.mainKey} (${result.scores[result.mainKey]} pts)`);
  console.log(`Support:  ${result.supportKey} (${result.scores[result.supportKey]} pts) — Group: ${result.supportGroup}`);
  console.log(`Extended: ${result.extendedName}`);
  console.log(`Shadow:   ${result.shadowKey}`);
  console.log(`Blindspot:${result.blindspotKey}`);
  console.log(`Shadow Integration: ${result.shadowBonusActive ? 'YES' : 'No'}`);
  console.log(`Total:    ${result.totalScore} pts`);
  console.log('\nAll scores:');
  Object.entries(result.scores)
    .sort((a, b) => b[1] - a[1])
    .forEach(([k, v]) => console.log(`  ${k.padEnd(12)} ${v} pts (${result.counts[k]} selections)`));

  // Step 3: Call API
  console.log('\n── CALLING CLAUDE ──');
  console.log('(This may take 30-60 seconds...)\n');

  const startTime = Date.now();
  try {
    const aiResult = await callAssessmentAPI(result);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('═══════════════════════════════════════');
    console.log(`  AI RESPONSE (${elapsed}s)`);
    console.log(`  Model: ${aiResult.model}`);
    console.log(`  Tokens: ${aiResult.promptTokens} in / ${aiResult.completionTokens} out`);
    console.log('═══════════════════════════════════════\n');
    console.log(aiResult.analysis);
  } catch (err) {
    console.error('API ERROR:', err.message);
  }
}

main();
