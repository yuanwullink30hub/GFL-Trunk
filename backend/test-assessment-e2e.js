/**
 * End-to-end API test: Generate 60 random answers → score → call Gemini
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
  JUDGE_RULING: 'Arbiter', JUDGE_RELATIONAL: 'Mediator', JUDGE_SEEKER: 'Examiner',
  JUDGE_CHAOS: 'Whistleblower', JUDGE_ABSTRACT: 'Critic', JUDGE_AGENCY: 'Avenger',
  LOVER_RULING: 'Companion', LOVER_RELATIONAL: 'Soulmate', LOVER_SEEKER: 'Poet',
  LOVER_CHAOS: 'Seducer', LOVER_ABSTRACT: 'Mystic', LOVER_AGENCY: 'Romantic',
  CAREGIVER_RULING: 'Advocate', CAREGIVER_RELATIONAL: 'Healer', CAREGIVER_SEEKER: 'Pathfinder',
  CAREGIVER_CHAOS: 'Cultivator', CAREGIVER_ABSTRACT: 'Therapist', CAREGIVER_AGENCY: 'Protector',
  INNOCENT_RULING: 'Shepherd', INNOCENT_RELATIONAL: 'Samaritan', INNOCENT_SEEKER: 'Saint',
  INNOCENT_CHAOS: 'Free Spirit', INNOCENT_ABSTRACT: 'Disciple', INNOCENT_AGENCY: 'Pioneer',
  EXPLORER_RULING: 'Scout', EXPLORER_RELATIONAL: 'Networker', EXPLORER_SEEKER: 'Navigator',
  EXPLORER_CHAOS: 'Innovator', EXPLORER_ABSTRACT: 'Scholar', EXPLORER_AGENCY: 'Sailor',
  OUTLAW_RULING: 'Reformer', OUTLAW_RELATIONAL: 'Liberator', OUTLAW_SEEKER: 'Renegade',
  OUTLAW_CHAOS: 'Anarchist', OUTLAW_ABSTRACT: 'Iconoclast', OUTLAW_AGENCY: 'Revolutionary',
  TRICKSTER_RULING: 'Jester', TRICKSTER_RELATIONAL: 'Clown', TRICKSTER_SEEKER: 'Shapeshifter',
  TRICKSTER_CHAOS: 'Fool', TRICKSTER_ABSTRACT: 'Comedian', TRICKSTER_AGENCY: 'Saboteur',
  SAGE_RULING: 'Analyst', SAGE_RELATIONAL: 'Mentor', SAGE_SEEKER: 'Dreamer',
  SAGE_CHAOS: 'Hermit', SAGE_ABSTRACT: 'Enlightened', SAGE_AGENCY: 'Detective',
  ARTIST_RULING: 'Architect', ARTIST_RELATIONAL: 'Storyteller', ARTIST_SEEKER: 'Visionary',
  ARTIST_CHAOS: 'Illusionist', ARTIST_ABSTRACT: 'Demiurge', ARTIST_AGENCY: 'Forgemaster',
  MAGICIAN_RULING: 'Engineer', MAGICIAN_RELATIONAL: 'Shaman', MAGICIAN_SEEKER: 'Oracle',
  MAGICIAN_CHAOS: 'Enchanter', MAGICIAN_ABSTRACT: 'Sorcerer', MAGICIAN_AGENCY: 'Alchemist',
  HERO_RULING: 'Commander', HERO_RELATIONAL: 'Guardian', HERO_SEEKER: 'Inventor',
  HERO_CHAOS: 'Ronin', HERO_ABSTRACT: 'Strategist', HERO_AGENCY: 'Legend',
  RULER_RULING: 'Emperor', RULER_RELATIONAL: 'Patriarch/Matriarch', RULER_SEEKER: 'Entrepreneur',
  RULER_CHAOS: 'Maverick', RULER_ABSTRACT: 'Philosopher-King', RULER_AGENCY: 'Conqueror',
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
  const blindspotKey = SHADOW_PAIRS[supportKey];
  const extendedName = EXTENDED_MATRIX[`${mainKey}_${supportGroup}`] || mainKey;

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
// STEP 3: Call Gemini API
// ═════════════════════════════════════════════

async function callAssessmentAPI(result) {
  // Build the same params the frontend sends
  const params = {
    provider: 'gemini',
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
    provider: 'gemini',
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
  console.log('  Model: ' + config.ai.gemini.defaultModel);
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
  console.log('\n── CALLING GEMINI 2.5 PRO ──');
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
