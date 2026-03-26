import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { isNatureSlot } from '../../pages/assessment/assessmentData';

/** Strip admin metadata tags [xxx] and (xxx) from display text */
function stripMeta(text) {
  if (!text) return '';
  return text.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').replace(/\s{2,}/g, ' ').trim();
}

/** Parse color markers {PURPLE>word}, {ORANGE>word}, and *word* and convert to JSX spans, after stripping metadata.
 *  For *word* markers, color is determined by the answer's slot position via isNatureSlot:
 *  Nature slots → purple (#a855f7), Culture slots → orange (#f97316).
 */
function parseColoredText(text, questionId, answerIdx) {
  if (!text) return '';
  
  // First strip metadata
  const cleanText = stripMeta(text);
  
  // Determine the fallback color for *word* markers based on slot routing
  const slotColor = (questionId != null && answerIdx != null)
    ? (isNatureSlot(questionId, answerIdx) ? '#a855f7' : '#f97316')
    : '#a855f7';
  
  const parts = [];
  let lastIndex = 0;
  // Match both {PURPLE>word} / {ORANGE>word} and *word* (non-greedy)
  const regex = /\{(PURPLE|ORANGE)>(.*?)\}|\*(.*?)\*/g;
  let match;
  
  while ((match = regex.exec(cleanText)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(cleanText.substring(lastIndex, match.index));
    }
    
    if (match[1]) {
      // {PURPLE>word} or {ORANGE>word}
      const color = match[1] === 'PURPLE' ? '#a855f7' : '#f97316';
      parts.push(
        <span key={`${match[1]}-${match.index}`} style={{ color }}>
          {match[2]}
        </span>
      );
    } else {
      // *word* — color from slot position
      parts.push(
        <span key={`star-${match.index}`} style={{ color: slotColor }}>
          {match[3]}
        </span>
      );
    }
    
    lastIndex = regex.lastIndex;
  }
  
  // Add remaining text
  if (lastIndex < cleanText.length) {
    parts.push(cleanText.substring(lastIndex));
  }
  
  return parts.length === 0 ? cleanText : parts;
}

// ═══ DEV AUTO-FILL: 72-OUTCOME WEIGHTED SYSTEM ═══
// 12 main archetypes × 6 support groups = 72 possible outcomes
// Target persists across layers; resets on layer 0 AUTO click
const DEV_ALL_ARCHETYPES = [
  'JUDGE','LOVER','CAREGIVER','INNOCENT','EXPLORER','OUTLAW',
  'TRICKSTER','SAGE','ARTIST','MAGICIAN','HERO','RULER'
];
const DEV_ALL_GROUPS = ['RULING','RELATIONAL','SEEKER','CHAOS','ABSTRACT','AGENCY'];
const DEV_GROUP_MEMBERS = {
  RULING: ['JUDGE','RULER'], RELATIONAL: ['LOVER','CAREGIVER'],
  SEEKER: ['INNOCENT','EXPLORER'], CHAOS: ['OUTLAW','TRICKSTER'],
  ABSTRACT: ['SAGE','ARTIST'], AGENCY: ['MAGICIAN','HERO'],
};
const DEV_EXTENDED_NAMES = {
  JUDGE_RULING:'Arbiter', JUDGE_RELATIONAL:'Mediator', JUDGE_SEEKER:'Examiner',
  JUDGE_CHAOS:'Whistleblower', JUDGE_ABSTRACT:'Critic', JUDGE_AGENCY:'Avenger',
  LOVER_RULING:'Companion', LOVER_RELATIONAL:'Soulmate', LOVER_SEEKER:'Poet',
  LOVER_CHAOS:'Seducer', LOVER_ABSTRACT:'Mystic', LOVER_AGENCY:'Romantic',
  CAREGIVER_RULING:'Advocate', CAREGIVER_RELATIONAL:'Healer', CAREGIVER_SEEKER:'Pathfinder',
  CAREGIVER_CHAOS:'Cultivator', CAREGIVER_ABSTRACT:'Therapist', CAREGIVER_AGENCY:'Protector',
  INNOCENT_RULING:'Shepherd', INNOCENT_RELATIONAL:'Samaritan', INNOCENT_SEEKER:'Saint',
  INNOCENT_CHAOS:'Free Spirit', INNOCENT_ABSTRACT:'Disciple', INNOCENT_AGENCY:'Pioneer',
  EXPLORER_RULING:'Scout', EXPLORER_RELATIONAL:'Networker', EXPLORER_SEEKER:'Navigator',
  EXPLORER_CHAOS:'Innovator', EXPLORER_ABSTRACT:'Scholar', EXPLORER_AGENCY:'Sailor',
  OUTLAW_RULING:'Reformer', OUTLAW_RELATIONAL:'Liberator', OUTLAW_SEEKER:'Renegade',
  OUTLAW_CHAOS:'Anarchist', OUTLAW_ABSTRACT:'Iconoclast', OUTLAW_AGENCY:'Revolutionary',
  TRICKSTER_RULING:'Jester', TRICKSTER_RELATIONAL:'Clown', TRICKSTER_SEEKER:'Shapeshifter',
  TRICKSTER_CHAOS:'Fool', TRICKSTER_ABSTRACT:'Comedian', TRICKSTER_AGENCY:'Saboteur',
  SAGE_RULING:'Analyst', SAGE_RELATIONAL:'Mentor', SAGE_SEEKER:'Dreamer',
  SAGE_CHAOS:'Hermit', SAGE_ABSTRACT:'Enlightened', SAGE_AGENCY:'Detective',
  ARTIST_RULING:'Architect', ARTIST_RELATIONAL:'Storyteller', ARTIST_SEEKER:'Visionary',
  ARTIST_CHAOS:'Illusionist', ARTIST_ABSTRACT:'Demiurge', ARTIST_AGENCY:'Forgemaster',
  MAGICIAN_RULING:'Engineer', MAGICIAN_RELATIONAL:'Shaman', MAGICIAN_SEEKER:'Oracle',
  MAGICIAN_CHAOS:'Enchanter', MAGICIAN_ABSTRACT:'Sorcerer', MAGICIAN_AGENCY:'Alchemist',
  HERO_RULING:'Commander', HERO_RELATIONAL:'Guardian', HERO_SEEKER:'Inventor',
  HERO_CHAOS:'Ronin', HERO_ABSTRACT:'Strategist', HERO_AGENCY:'Legend',
  RULER_RULING:'Emperor', RULER_RELATIONAL:'Patriarch/Matriarch', RULER_SEEKER:'Entrepreneur',
  RULER_CHAOS:'Maverick', RULER_ABSTRACT:'Philosopher-King', RULER_AGENCY:'Conqueror',
};

let devAutoFillTarget = null;

function devPickRandomTarget() {
  const main = DEV_ALL_ARCHETYPES[Math.floor(Math.random() * 12)];
  const supportGroup = DEV_ALL_GROUPS[Math.floor(Math.random() * 6)];
  const members = DEV_GROUP_MEMBERS[supportGroup];
  const opts = members.filter(a => a !== main);
  const support = opts.length > 0 ? opts[Math.floor(Math.random() * opts.length)] : members[0];
  const extended = DEV_EXTENDED_NAMES[`${main}_${supportGroup}`] || main;
  return { mainArchetype: main, supportArchetype: support, supportGroup, extended };
}

function devRandomExcluding(max, exclude) {
  let idx;
  do { idx = Math.floor(Math.random() * max); } while (exclude.includes(idx));
  return idx;
}

/**
 * AssessmentCard - Question card matching SectorFrame styling
 * 
 * Responsive tiers: Desktop (≥1441) / Laptop (≥1024) / Tablet (≥768) / Mobile (<768)
 * 
 * Features:
 * - SectorFrame-style background (rgba(8,2,12,0.95)) with colored corner accents
 * - 6 answer options (A-F) with skewed connectors
 * - Dual-pick system: pick 1st and 2nd choice per question
 * - Click to select 1st pick; click again for 2nd pick; click selected to deselect
 * - Manual "Next" button below question indicators
 * - Save button on last question or when all answered → collapses to header-only with "Scroll"
 */
const AssessmentCard = ({ 
  questions,
  currentSubject,
  currentSubjectIndex,
  currentQuestionIndex,
  totalQuestions,
  answeredCount,
  onSelectAnswer,
  onGoBack,
  canGoBack,
  onNext,
  onComplete,
  onJumpTo,
  allAnswers = {},
  levelConfig = {}
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showScrollMode, setShowScrollMode] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [showIntro, setShowIntro] = useState(true);
  const [started, setStarted] = useState(false);
  const levelConfigRef = useRef(levelConfig);
  levelConfigRef.current = levelConfig;
  const { t } = useLanguage();

  // ── Responsive breakpoints (matches DesktopLayout pattern) ──
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280);
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Breakpoint-based sizing:  Desktop(≥1441) / Laptop(≥1024) / Tablet(≥768) / Mobile(<768)
  const s = windowWidth >= 1441 ? {
    // ── Desktop ── original full-size
    cardMaxWidth: '42rem',
    maxH: '82vh',
    headerPad: '0.75rem 1.25rem',
    badgeSize: '2.25rem',
    badgeFont: '0.875rem',
    contentMinH: '32rem',
    contentPad: '1rem 1.25rem',
    questionFont: '1rem',
    questionMinH: '4.5rem',
    answerMinH: '3.5rem',
    answerFont: '0.875rem',
    letterBadgeW: '2.5rem',
    footerPad: '0.75rem 1.25rem',
    indicatorSize: '1.75rem',
  } : windowWidth >= 1024 ? {
    // ── Laptop ── vw-based ×1.3
    cardMaxWidth: '33.9vw',
    maxH: '80vh',
    headerPad: '0.57vw 0.95vw',
    badgeSize: '1.89vw',
    badgeFont: '0.85vw',
    contentMinH: '26.4vw',
    contentPad: '0.75vw 0.95vw',
    questionFont: '1.13vw',
    questionMinH: '3.77vw',
    answerMinH: '3.02vw',
    answerFont: '0.95vw',
    letterBadgeW: '2.08vw',
    footerPad: '0.57vw 0.95vw',
    indicatorSize: '1.51vw',
  } : windowWidth >= 768 ? {
    // ── Tablet ── 0.65x
    cardMaxWidth: '27rem',
    maxH: '80vh',
    headerPad: '0.5rem 0.8rem',
    badgeSize: '1.5rem',
    badgeFont: '0.65rem',
    contentMinH: '21rem',
    contentPad: '0.65rem 0.8rem',
    questionFont: '0.8rem',
    questionMinH: '3rem',
    answerMinH: '2.3rem',
    answerFont: '0.7rem',
    letterBadgeW: '1.6rem',
    footerPad: '0.5rem 0.8rem',
    indicatorSize: '1.15rem',
  } : {
    // ── Mobile ── viewport-fitting, touch-friendly
    cardMaxWidth: '94vw',
    maxH: '82vh',
    headerPad: '0.5rem 0.65rem',
    badgeSize: '1.6rem',
    badgeFont: '0.7rem',
    contentMinH: '0',
    contentPad: '0.5rem 0.65rem',
    questionFont: '0.82rem',
    questionMinH: '2.5rem',
    answerMinH: '2.6rem',
    answerFont: '0.75rem',
    letterBadgeW: '1.75rem',
    footerPad: '0.45rem 0.65rem',
    indicatorSize: '1.25rem',
  };

  const currentQuestion = questions[currentQuestionIndex];
  const questionNumber = currentQuestionIndex + 1;
  
  // Layer colors matching GFL main page
  const layerColors = ['#22c55e', '#3b82f6', '#a855f7', '#ef4444', '#f97316'];
  const subjectColor = currentSubject?.color || layerColors[currentSubjectIndex] || '#22c55e';

  // Check if all questions in this card have been answered (at least 1 choice each)
  const isAllAnswered = answeredCount >= totalQuestions;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  
  // Current question's selection: array of 0-2 answer IDs (dual-pick: 1st & 2nd choice)
  const currentSelections = (() => {
    const val = allAnswers[currentQuestion?.id];
    if (!val) return [];
    if (Array.isArray(val)) return val.slice(0, 2);
    return [val]; // legacy single-value compat
  })();

  // Trigger content animation when question changes
  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 250);
    return () => clearTimeout(timer);
  }, [currentQuestion?.id]);

  // Calculate and countdown timer based on level configuration
  const hasTimer = levelConfig.hasTimer !== false;

  useEffect(() => {
    const cfg = levelConfigRef.current;
    if (!hasTimer || !started) {
      // No timer for this layer or not started yet — disable countdown
      setTimeRemaining(null);
      return;
    }

    // Determine the initial timer value
    let initialTime = 0;
    
    if (cfg.timerType === 'layered' && cfg.layerTimers) {
      // Leerling: Use layer-based timer
      initialTime = cfg.layerTimers[currentSubjectIndex] || 30;
    } else if (cfg.timerType === 'fixed' && cfg.fixedTimer) {
      // Beginner & Intermediate: Use fixed timer
      initialTime = cfg.fixedTimer;
    } else {
      // Fallback: 45 seconds
      initialTime = 45;
    }
    
    setTimeRemaining(initialTime);
    
    // Set up countdown interval
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev !== null && prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev !== null ? prev - 1 : null;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [currentQuestion?.id, currentSubjectIndex, hasTimer, started, levelConfig.timerType, levelConfig.fixedTimer, levelConfig.layerTimers]);

  // Auto-advance when timer runs out (with or without answer selected)
  useEffect(() => {
    if (hasTimer && timeRemaining !== null && timeRemaining === 0) {
      if (isLastQuestion) {
        handleSave();
      } else if (onNext) {
        onNext();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining]);

  // Answer click handler: dual-pick system (1st choice, then 2nd choice)
  const handleAnswerClick = useCallback((answerId) => {
    const val = allAnswers[currentQuestion?.id];
    const current = !val ? [] : Array.isArray(val) ? [...val] : [val];
    
    const idx = current.indexOf(answerId);
    if (idx !== -1) {
      // Clicking a selected answer: remove it, shift remaining up
      current.splice(idx, 1);
    } else if (current.length < 2) {
      // Add as next pick (1st or 2nd)
      current.push(answerId);
    } else {
      // Already 2 picks — replace 2nd pick
      current[1] = answerId;
    }
    
    onSelectAnswer(currentQuestion.id, current);
  }, [currentQuestion, allAnswers, onSelectAnswer]);

  const handleSave = () => {
    setIsCollapsed(true);
    setTimeout(() => {
      setShowScrollMode(true);
    }, 700);
    if (onComplete) onComplete();
  };

  // AUTO-fill all questions (DEV only) — 80/20 weighted toward a target outcome
  // On layer 0: picks 1 of 72 possible outcomes (12 archetypes × 6 groups)
  // On subsequent layers: reuses the same target
  const handleAutoFill = useCallback(() => {
    if (!questions) return;

    // Layer 0 always picks a fresh target; other layers reuse
    if (currentSubjectIndex === 0 || !devAutoFillTarget) {
      devAutoFillTarget = devPickRandomTarget();
      console.log(
        `[DEV AUTO-FILL] Target: ${devAutoFillTarget.mainArchetype} + ${devAutoFillTarget.supportGroup} ` +
        `(support: ${devAutoFillTarget.supportArchetype}) → "${devAutoFillTarget.extended}"`
      );
    }

    const { mainArchetype, supportArchetype, supportGroup } = devAutoFillTarget;
    const groupMembers = DEV_GROUP_MEMBERS[supportGroup];

    questions.forEach((q) => {
      const ans = q.answers;
      const mainIdx = ans.findIndex(a => a.archetype === mainArchetype);
      const supportIdx = ans.findIndex(a => a.archetype === supportArchetype);
      const altSupportIdx = ans.findIndex(a =>
        groupMembers.includes(a.archetype) && a.archetype !== mainArchetype
      );

      let pick1, pick2;

      if (Math.random() < 0.8) {
        // ── 80% path: primary = main archetype ──
        if (mainIdx >= 0) {
          pick1 = mainIdx;
          pick2 = supportIdx >= 0 ? supportIdx
                : altSupportIdx >= 0 ? altSupportIdx
                : devRandomExcluding(ans.length, [pick1]);
        } else if (supportIdx >= 0) {
          pick1 = supportIdx;
          pick2 = devRandomExcluding(ans.length, [pick1]);
        } else if (altSupportIdx >= 0) {
          pick1 = altSupportIdx;
          pick2 = devRandomExcluding(ans.length, [pick1]);
        } else {
          pick1 = Math.floor(Math.random() * ans.length);
          pick2 = devRandomExcluding(ans.length, [pick1]);
        }
      } else {
        // ── 20% path: primary = support archetype ──
        if (supportIdx >= 0) {
          pick1 = supportIdx;
          pick2 = mainIdx >= 0 ? mainIdx : devRandomExcluding(ans.length, [pick1]);
        } else if (altSupportIdx >= 0) {
          pick1 = altSupportIdx;
          pick2 = mainIdx >= 0 ? mainIdx : devRandomExcluding(ans.length, [pick1]);
        } else if (mainIdx >= 0) {
          pick1 = mainIdx;
          pick2 = devRandomExcluding(ans.length, [pick1]);
        } else {
          pick1 = Math.floor(Math.random() * ans.length);
          pick2 = devRandomExcluding(ans.length, [pick1]);
        }
      }

      onSelectAnswer(q.id, [ans[pick1].id, ans[pick2].id]);
    });
  }, [questions, onSelectAnswer, currentSubjectIndex]);

  const handleJumpToQuestion = useCallback((idx) => {
    if (onJumpTo) onJumpTo(idx);
  }, [onJumpTo]);

  if (!currentQuestion) {
    return (
      <div className="text-center p-8">
        <p style={{ color: 'rgba(255, 254, 240, 0.5)', fontFamily: "'Figtree', sans-serif" }}>{t('assessmentQuestions.loadingQuestions')}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full mx-auto" style={{ maxWidth: s.cardMaxWidth }}>
      {/* ── First Overlay — "Voordat je begint" for subject 0, layer intro for others ── */}
      {showIntro && !started && !isCollapsed && (
        <div
          className="absolute inset-0 z-[210] flex flex-col items-center justify-center rounded-lg"
          style={{
            backgroundColor: 'rgba(1, 0, 2, 1)',
            border: `1px solid ${subjectColor}30`,
            overflow: 'hidden',
          }}
        >
          <div className="absolute -top-0.5 -left-0.5 w-4 h-4 pointer-events-none" style={{ border: `1.5px solid ${subjectColor}`, borderRadius: '10px 0 0 0', borderBottom: 'none', borderRight: 'none' }} />
          <div className="absolute -top-0.5 -right-0.5 w-4 h-4 pointer-events-none" style={{ border: `1.5px solid ${subjectColor}`, borderRadius: '0 10px 0 0', borderBottom: 'none', borderLeft: 'none' }} />
          <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 pointer-events-none" style={{ border: `1.5px solid ${subjectColor}`, borderRadius: '0 0 0 10px', borderTop: 'none', borderRight: 'none' }} />
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 pointer-events-none" style={{ border: `1.5px solid ${subjectColor}`, borderRadius: '0 0 10px 0', borderTop: 'none', borderLeft: 'none' }} />

          {currentSubjectIndex === 0 ? (
            /* ── Subject 0: "Voordat je begint" briefing with → arrow ── */
            <div style={{
              padding: windowWidth >= 1024 ? '2rem 2rem 1.5rem' : '1.5rem 1.25rem 1rem',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: windowWidth >= 1024 ? '1rem' : '0.75rem',
            }}>
              <h3 style={{
                fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
                fontSize: windowWidth >= 1024 ? '1.15rem' : '1rem',
                color: '#f97316',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                marginBottom: '0.25rem',
                textAlign: 'center',
              }}>
                Voordat je begint
              </h3>

              <p style={{
                fontFamily: "'Figtree', sans-serif",
                fontSize: windowWidth >= 1024 ? '0.85rem' : '0.78rem',
                color: 'rgba(255, 254, 240, 0.6)',
                textAlign: 'center',
                lineHeight: 1.7,
              }}>
                Elk <span style={{ color: '#f97316' }}>woord</span> is met <span style={{ color: '#a855f7' }}>intentie</span> gezet. Twee opties die op elkaar lijken kunnen fundamenteel anders zijn.
                Lees niet alleen wát er staat, maar hoe het <span style={{ color: '#a855f7' }}>voelt</span>.
                De timer is er om je hoofd uit te schakelen.
              </p>

              <p style={{
                fontFamily: "'Figtree', sans-serif",
                fontSize: windowWidth >= 1024 ? '0.85rem' : '0.78rem',
                color: 'rgba(255, 254, 240, 0.6)',
                textAlign: 'center',
                lineHeight: 1.7,
              }}>
                Zes antwoorden per vraag. Kies eerst wat het dichtst bij je <span style={{ color: '#a855f7' }}>kern</span> zit.
                Kies daarna wat je ook raakt, maar minder.
                <br/>Let op: Dus twee antwoorden kiezen!
                <br/>&nbsp;
                <br/><span style={{ color: '#f97316' }}>Geen antwoord is ook een antwoord...</span> dit verandert verder niks aan het puntensysteem, onze data is dynamisch.
              </p>

              <p style={{
                fontFamily: "'Figtree', sans-serif",
                fontSize: windowWidth >= 1024 ? '0.85rem' : '0.78rem',
                color: 'rgba(255, 254, 240, 0.6)',
                textAlign: 'center',
                lineHeight: 1.7,
              }}>
                Elke keuze resoneert door naar verbonden punten op het wiel.
                Een eerste keuze weegt zwaarder dan een tweede.
                Het resultaat is geen plat getal maar een gelaagd profiel.
              </p>

              <p style={{
                fontFamily: "'Figtree', sans-serif",
                fontSize: windowWidth >= 1024 ? '0.85rem' : '0.78rem',
                color: 'rgba(255, 254, 240, 0.5)',
                textAlign: 'center',
                lineHeight: 1.7,
              }}>
                36 vragen over 5 onderwerpen.
                <br />
                Timer per onderwerp:
                <br />
                <span style={{ color: '#a855f7' }}>
                {levelConfig.timerType === 'layered' && levelConfig.layerTimers
                  ? <>{levelConfig.layerTimers.join('s → ')}s</>
                  : <>90s → 75s → 60s → 45s → 30s</>
                }
                </span>
                <br />
                &nbsp;
                <br />
                Bij het aflopen van de timer gaat de vraag automatisch door, ook met 0 of 1 antwoord.
                Je kunt altijd zelf doorklikken,
                <br />
                niet terug, alleen voorwaartse beweging.
              </p>

              <p style={{
                fontFamily: "'Figtree', sans-serif",
                fontSize: windowWidth >= 1024 ? '0.9rem' : '0.82rem',
                color: 'rgba(255, 254, 240, 0.75)',
                textAlign: 'center',
                lineHeight: 1.7,
                fontStyle: 'italic',
                marginTop: '0.25rem',
              }}>
                Er zijn geen <span style={{ color: '#f97316' }}>goede</span> of <span style={{ color: '#f97316' }}>foute</span> antwoorden. Er is alleen <span style={{ color: '#a855f7' }}>eerlijkheid</span>.
              </p>

              <button
                onClick={() => setShowIntro(false)}
                className="px-8 py-2.5 rounded font-bold uppercase tracking-wider transition-all duration-300"
                style={{
                  fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
                  fontSize: windowWidth >= 1024 ? '1.1rem' : '0.95rem',
                  backgroundColor: 'rgba(168, 85, 247, 0.12)',
                  border: '2px solid #a855f7',
                  color: '#a855f7',
                  boxShadow: '0 0 20px rgba(168, 85, 247, 0.15)',
                  marginTop: '0.5rem',
                  minWidth: '4rem',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.25)';
                  e.currentTarget.style.boxShadow = '0 0 30px rgba(168, 85, 247, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.12)';
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(168, 85, 247, 0.15)';
                }}
              >
                →
              </button>
            </div>
          ) : (
            /* ── Subjects 1-4: layer intro with → arrow ── */
            <div style={{
              padding: windowWidth >= 1024 ? '2rem 2rem 1.5rem' : '1.5rem 1.25rem 1rem',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: windowWidth >= 1024 ? '0.75rem' : '0.5rem',
            }}>
              <h3 style={{
                fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
                fontSize: windowWidth >= 1024 ? '1.15rem' : '1rem',
                color: subjectColor,
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                textAlign: 'center',
                marginBottom: '0.25rem',
              }}>
                {currentSubject?.name || `Laag ${currentSubjectIndex + 1}`}
              </h3>

              {levelConfig.timerType === 'layered' && levelConfig.layerTimers && (
                <div style={{
                  fontFamily: "'Figtree', sans-serif",
                  fontSize: windowWidth >= 1024 ? '0.85rem' : '0.75rem',
                  color: 'rgba(255, 254, 240, 0.5)',
                  textAlign: 'center',
                  lineHeight: '1.7',
                }}>
                  <span style={{ color: subjectColor }}>{levelConfig.layerTimers[currentSubjectIndex] || 30}s per vraag</span>
                  {' · '}{totalQuestions} vragen
                </div>
              )}

              <p style={{
                fontFamily: "'Figtree', sans-serif",
                fontSize: windowWidth >= 1024 ? '0.85rem' : '0.78rem',
                color: 'rgba(255, 254, 240, 0.55)',
                textAlign: 'center',
                lineHeight: 1.7,
                maxWidth: '26rem',
                marginTop: '0.25rem',
              }}>
                <span style={{ color: '#f97316', fontWeight: 'bold', fontSize: '1rem' }}>LET OP!</span>
                <br />
                Er is geen één maat voor allen. Kies dus wat het meest synchroniseert.
                <br />
                <span style={{ color: subjectColor }}>Gekleurde woorden</span> zijn een middel voor de eerste snelle scan, dit is geen waarde systeem voor de punten telling.
                <br /><br />
                <em style={{ color: 'rgba(255, 254, 240, 0.55)' }}>Stereotype vergroot om het archetype te onderscheiden:</em>
                <br />
                {currentSubjectIndex === 1 && <span style={{ color: subjectColor, fontWeight: 'bold' }}>aandacht en actie</span>}
                {currentSubjectIndex === 2 && <span style={{ color: subjectColor, fontWeight: 'bold' }}>projectie</span>}
                {currentSubjectIndex === 3 && <span style={{ color: subjectColor, fontWeight: 'bold' }}>verharding</span>}
                {currentSubjectIndex === 4 && <span style={{ color: subjectColor, fontWeight: 'bold' }}>extremisme</span>}
              </p>

              <button
                onClick={() => {
                  setShowIntro(false);
                  setStarted(true);
                }}
                className="px-8 py-2.5 rounded font-bold uppercase tracking-wider transition-all duration-300"
                style={{
                  fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
                  fontSize: windowWidth >= 1024 ? '1.1rem' : '0.95rem',
                  backgroundColor: `${subjectColor}12`,
                  border: `2px solid ${subjectColor}`,
                  color: subjectColor,
                  boxShadow: `0 0 20px ${subjectColor}25`,
                  marginTop: '0.75rem',
                  minWidth: '4rem',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${subjectColor}30`;
                  e.currentTarget.style.boxShadow = `0 0 30px ${subjectColor}50`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = `${subjectColor}12`;
                  e.currentTarget.style.boxShadow = `0 0 20px ${subjectColor}25`;
                }}
              >
                Start
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Second Overlay (subject 0 only) — layer info + Start button ── */}
      {!showIntro && !started && !isCollapsed && (
        <div
          className="absolute inset-0 z-[200] flex flex-col items-center justify-center rounded-lg"
          style={{
            backgroundColor: 'rgba(1, 0, 2, 1)',
            border: `1px solid ${subjectColor}30`,
            overflow: 'hidden',
          }}
        >
          <div className="absolute -top-0.5 -left-0.5 w-4 h-4 pointer-events-none" style={{ border: `1.5px solid ${subjectColor}`, borderRadius: '10px 0 0 0', borderBottom: 'none', borderRight: 'none' }} />
          <div className="absolute -top-0.5 -right-0.5 w-4 h-4 pointer-events-none" style={{ border: `1.5px solid ${subjectColor}`, borderRadius: '0 10px 0 0', borderBottom: 'none', borderLeft: 'none' }} />
          <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 pointer-events-none" style={{ border: `1.5px solid ${subjectColor}`, borderRadius: '0 0 0 10px', borderTop: 'none', borderRight: 'none' }} />
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 pointer-events-none" style={{ border: `1.5px solid ${subjectColor}`, borderRadius: '0 0 10px 0', borderTop: 'none', borderLeft: 'none' }} />

          <div style={{
            padding: windowWidth >= 1024 ? '2rem 2rem 1.5rem' : '1.5rem 1.25rem 1rem',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: windowWidth >= 1024 ? '0.75rem' : '0.5rem',
          }}>
            <h3 style={{
              fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
              fontSize: windowWidth >= 1024 ? '1.15rem' : '1rem',
              color: subjectColor,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              textAlign: 'center',
              marginBottom: '0.25rem',
            }}>
              {currentSubject?.name || `Laag ${currentSubjectIndex + 1}`}
            </h3>

            {levelConfig.timerType === 'layered' && levelConfig.layerTimers && (
              <div style={{
                fontFamily: "'Figtree', sans-serif",
                fontSize: windowWidth >= 1024 ? '0.85rem' : '0.75rem',
                color: 'rgba(255, 254, 240, 0.5)',
                textAlign: 'center',
                lineHeight: '1.7',
              }}>
                <span style={{ color: subjectColor }}>{levelConfig.layerTimers[currentSubjectIndex] || 30}s per vraag</span>
                {' · '}{totalQuestions} vragen
              </div>
            )}

            <p style={{
              fontFamily: "'Figtree', sans-serif",
              fontSize: windowWidth >= 1024 ? '0.85rem' : '0.78rem',
              color: 'rgba(255, 254, 240, 0.55)',
              textAlign: 'center',
              lineHeight: 1.7,
              maxWidth: '26rem',
              marginTop: '0.25rem',
            }}>
              <span style={{ color: '#f97316', fontWeight: 'bold', fontSize: '1rem' }}>LET OP!</span>
              <br />
              Er is geen één maat voor allen. Kies dus wat het meest synchroniseert.
              <br />
              <span style={{ color: subjectColor }}>Gekleurde woorden</span> zijn een middel voor de eerste snelle scan, dit is geen waarde systeem voor de punten telling.
              <br /><br />
              <em style={{ color: 'rgba(255, 254, 240, 0.55)' }}>Stereotype vergroot om het archetype te onderscheiden:</em>
              <br />
              <span style={{ color: subjectColor, fontWeight: 'bold' }}>intentie en potentie</span>
            </p>

            <button
              onClick={() => setStarted(true)}
              className="px-8 py-2.5 rounded font-bold uppercase tracking-wider transition-all duration-300"
              style={{
                fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
                fontSize: windowWidth >= 1024 ? '0.95rem' : '0.8rem',
                backgroundColor: `${subjectColor}12`,
                border: `2px solid ${subjectColor}`,
                color: subjectColor,
                boxShadow: `0 0 20px ${subjectColor}25`,
                marginTop: '0.75rem',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${subjectColor}30`;
                e.currentTarget.style.boxShadow = `0 0 30px ${subjectColor}50`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = `${subjectColor}12`;
                e.currentTarget.style.boxShadow = `0 0 20px ${subjectColor}25`;
              }}
            >
              Start
            </button>
          </div>
        </div>
      )}

      {/* Main Card - SectorFrame style */}
      <div 
        className={`
          relative rounded-lg overflow-hidden flex flex-col
          transition-[max-height] duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]
          ${isCollapsed ? 'max-h-[80px]' : ''}
        `}
        style={{ backgroundColor: 'rgba(2, 0, 3, 0.3)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', maxHeight: isCollapsed ? '80px' : s.maxH, boxShadow: `0 6px 30px rgba(0,0,0,0.7), 0 12px 60px rgba(0,0,0,0.5), 0 0 80px rgba(0,0,0,0.35), 0 0 120px rgba(0,0,0,0.15), inset 0 0 12px ${subjectColor}10, inset 0 0 30px ${subjectColor}08` }}
      >
        {/* Corner Accents - SectorFrame style */}
        <div className="absolute -top-0.5 -left-0.5 w-4 h-4 pointer-events-none z-20" style={{
          border: `1.5px solid ${subjectColor}`,
          borderRadius: '10px 0 0 0',
          borderBottom: 'none',
          borderRight: 'none'
        }} />
        <div className="absolute -top-0.5 -right-0.5 w-4 h-4 pointer-events-none z-20" style={{
          border: `1.5px solid ${subjectColor}`,
          borderRadius: '0 10px 0 0',
          borderBottom: 'none',
          borderLeft: 'none'
        }} />
        <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 pointer-events-none z-20" style={{
          border: `1.5px solid ${subjectColor}`,
          borderRadius: '0 0 0 10px',
          borderTop: 'none',
          borderRight: 'none'
        }} />
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 pointer-events-none z-20" style={{
          border: `1.5px solid ${subjectColor}`,
          borderRadius: '0 0 10px 0',
          borderTop: 'none',
          borderLeft: 'none'
        }} />

        {/* Holographic sheen */}
        <div className="absolute inset-0 rounded-lg pointer-events-none" style={{
          background: 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.015) 30%, transparent 50%, rgba(255,255,255,0.01) 70%, transparent 100%)',
          backgroundSize: '400% 400%',
          backgroundRepeat: 'no-repeat',
          animation: 'holoSheen 45s ease-in-out infinite',
          mixBlendMode: 'screen',
        }} />

        {/* Scanline sweep */}
        <div className="absolute inset-0 rounded-lg pointer-events-none" style={{
          background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.008) 48%, rgba(255,255,255,0.015) 50%, rgba(255,255,255,0.008) 52%, transparent 100%)',
          backgroundSize: '100% 300%',
          animation: 'holoScanline 14s linear infinite',
        }} />

        {/* Noise texture overlay */}
        <div className="absolute inset-0 rounded-lg pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />

        {/* --- Header Section --- */}
        <header 
          className="relative shrink-0 z-10 transition-all duration-700"
          style={{ borderBottom: isCollapsed ? 'none' : `1px solid ${subjectColor}30`, padding: s.headerPad }}
        >
          <div className="flex items-center justify-between">
            {/* Left: Question number badge */}
            <div className={`
              flex items-center gap-3 transition-all duration-500
              ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}
            `}>
              <div 
                className="flex items-center justify-center rounded font-bold"
                style={{
                  width: s.badgeSize,
                  height: s.badgeSize,
                  fontSize: s.badgeFont,
                  backgroundColor: `${subjectColor}20`,
                  color: subjectColor,
                  border: `1px solid ${subjectColor}40`,
                  fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
                }}
              >
                {String(questionNumber).padStart(2, '0')}
              </div>
              <div className="flex flex-col items-start gap-0.5">
                <span className="text-xs" style={{ color: '#FFFEF0', opacity: 0.5, fontFamily: "'Figtree', sans-serif" }}>
                  Q{questionNumber}/{totalQuestions}
                </span>
                {hasTimer && (
                <div className="flex items-center gap-1.5" style={{ fontSize: s.badgeFont }}>
                  <span style={{ color: (timeRemaining !== null && timeRemaining <= 10) ? '#ef4444' : subjectColor, fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif", fontWeight: 'bold' }}>
                    {timeRemaining !== null ? String(timeRemaining).padStart(2, '0') : '--'}s
                  </span>
                  <div style={{
                    width: '30px',
                    height: '4px',
                    backgroundColor: `${subjectColor}20`,
                    borderRadius: '2px',
                    border: `1px solid ${subjectColor}40`,
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${timeRemaining !== null ? (timeRemaining / (levelConfig.timerType === 'layered' ? (levelConfig.layerTimers?.[currentSubjectIndex] || 30) : (levelConfig.fixedTimer || 45))) * 100 : 100}%`,
                      height: '100%',
                      backgroundColor: (timeRemaining !== null && timeRemaining <= 10) ? '#ef4444' : subjectColor,
                      transition: 'width 1s linear'
                    }} />
                  </div>
                </div>
                )}
              </div>
            </div>

            {/* Center/Right: Subject Group */}
            <div className={`
              flex flex-col transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]
              ${isCollapsed ? 'items-center flex-1' : 'items-end'}
            `}>
              <span className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: `${subjectColor}80`, fontFamily: "'Figtree', sans-serif" }}>
                SECTION //
              </span>
              <h2 className="text-base font-bold tracking-wider" style={{ color: subjectColor, fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif" }}>
                {currentSubject?.name?.toUpperCase() || `LAYER ${currentSubjectIndex + 1}`}
              </h2>
            </div>

            {/* Scroll indicator in collapsed mode */}
            {isCollapsed && showScrollMode && (
              <div className="flex items-center gap-1" style={{ color: subjectColor }}>
                <span className="text-xs font-bold uppercase tracking-widest" style={{ fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif" }}>
                  Scroll
                </span>
                <ChevronDown className="w-4 h-4" />
              </div>
            )}
          </div>
        </header>

        {/* --- Main Content Section --- */}
        <div 
          className={`
            relative z-10 flex-1 flex flex-col gap-3 overflow-y-auto
            transition-opacity duration-500 ease-in-out
            ${isCollapsed ? 'opacity-0 h-0 py-0 overflow-hidden pointer-events-none' : 'opacity-100'}
            ${isAnimating && !isCollapsed ? 'opacity-0' : ''}
          `}
          style={{ minHeight: isCollapsed ? 0 : s.contentMinH, padding: isCollapsed ? 0 : s.contentPad }}
        >
          {/* Question Text */}
            <div className="relative pl-3" style={{ minHeight: s.questionMinH }}>
            <div className="absolute left-0 top-1 bottom-1 w-[2px]" style={{ background: `linear-gradient(to bottom, ${subjectColor}, transparent)` }} />
            <p style={{ fontSize: s.questionFont, lineHeight: 1.5, color: '#FFFEF0', fontFamily: "'Figtree', sans-serif" }}>
              {stripMeta(t(`questions.${currentQuestion.id}`) !== `questions.${currentQuestion.id}` 
                ? t(`questions.${currentQuestion.id}`) 
                : currentQuestion.text)}
            </p>
          </div>

          {/* Answer Options (A-F) — dual-pick: 1st & 2nd choice */}
          <div className="flex flex-col gap-2">
            {currentQuestion.answers.map((answer, idx) => {
              const pickIndex = currentSelections.indexOf(answer.id); // -1=not picked, 0=1st, 1=2nd
              const isSelected = pickIndex !== -1;
              const pickLabel = pickIndex === 0 ? '1' : pickIndex === 1 ? '2' : String.fromCharCode(65 + idx);
              return (
                <button
                  key={answer.id}
                  onClick={() => handleAnswerClick(answer.id)}
                  className={`
                    relative group flex items-stretch text-left transition-all duration-200 w-full
                    ${isSelected ? 'translate-x-1' : 'hover:translate-x-0.5'}
                  `}
                  style={{ minHeight: s.answerMinH }}
                >
                  {/* Pick Badge — shows "1" (1st pick), "2" (2nd pick), or letter (A-F) */}
                  <div 
                    className="flex items-center justify-center font-bold border-y border-l rounded-l-sm transition-colors duration-300"
                    style={{
                      width: s.letterBadgeW,
                      fontSize: s.answerFont,
                      fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
                      backgroundColor: pickIndex === 0 ? subjectColor : pickIndex === 1 ? `${subjectColor}60` : 'rgba(8, 2, 12, 0.95)',
                      color: isSelected ? '#0f172a' : '#FFFEF0',
                      borderColor: isSelected ? subjectColor : `${subjectColor}30`,
                    }}
                  >
                    {pickLabel}
                  </div>

                  {/* Connector line */}
                  <div 
                    className="w-5 border-y relative overflow-visible"
                    style={{
                      borderColor: isSelected ? subjectColor : `${subjectColor}30`,
                      backgroundColor: isSelected ? `${subjectColor}15` : 'transparent'
                    }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-[1px]" style={{ backgroundColor: isSelected ? subjectColor : `${subjectColor}20` }} />
                    </div>
                  </div>

                  {/* Answer Text */}
                  <div 
                    className="flex-1 px-3 py-2 border-y border-r rounded-r-sm flex items-center transition-all duration-300"
                    style={{
                      backgroundColor: isSelected ? `${subjectColor}20` : 'rgba(8, 2, 12, 0.95)',
                      borderColor: isSelected ? subjectColor : `${subjectColor}30`,
                      color: isSelected ? '#FFFEF0' : 'rgba(255, 254, 240, 0.7)',
                      boxShadow: isSelected ? `0 0 12px ${subjectColor}30` : 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = `${subjectColor}60`;
                        e.currentTarget.style.color = '#FFFEF0';
                        e.currentTarget.style.backgroundColor = `${subjectColor}10`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = `${subjectColor}30`;
                        e.currentTarget.style.color = 'rgba(255, 254, 240, 0.7)';
                        e.currentTarget.style.backgroundColor = 'rgba(8, 2, 12, 0.95)';
                      }
                    }}
                  >
                    <span style={{ fontSize: s.answerFont, fontFamily: "'Figtree', sans-serif" }}>
                      {parseColoredText(t(`answers.${answer.id}`) !== `answers.${answer.id}` 
                        ? t(`answers.${answer.id}`) 
                        : answer.text, currentQuestion.id, idx)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* --- Footer --- */}
        <footer 
          className={`
            relative shrink-0 z-10 transition-all duration-500
            ${isCollapsed ? 'h-0 py-0 overflow-hidden opacity-0' : ''}
          `}
          style={{ borderTop: isCollapsed ? 'none' : `1px solid ${subjectColor}20`, padding: isCollapsed ? 0 : s.footerPad }}
        >
          {/* Question Indicators - click to jump (disabled if no backtrack allowed) */}
          <div className="flex items-center justify-center gap-1 mb-2 flex-wrap">
            {questions.map((q, idx) => {
              const isActive = idx === currentQuestionIndex;
              const qAnswers = allAnswers[q.id];
              const isAnswered = Array.isArray(qAnswers) ? qAnswers.length > 0 : qAnswers !== undefined;
              const canClick = levelConfig.allowQuestionJump !== false; // Default to true if not specified
              return (
                <button
                  key={q.id}
                  onClick={() => canClick && handleJumpToQuestion(idx)}
                  className={`relative flex-shrink-0 flex items-center justify-center transition-all duration-200 ${!canClick ? 'cursor-not-allowed' : ''}`}
                  style={{
                    width: s.indicatorSize,
                    height: s.indicatorSize,
                    border: `1.5px solid ${isActive ? subjectColor : isAnswered ? `${subjectColor}50` : `${subjectColor}20`}`,
                    backgroundColor: isActive ? `${subjectColor}25` : isAnswered ? `${subjectColor}10` : 'rgba(8, 2, 12, 0.6)',
                    color: isActive ? '#FFFEF0' : isAnswered ? `${subjectColor}` : 'rgba(255, 254, 240, 0.35)',
                    borderRadius: '3px',
                    boxShadow: isActive ? `0 0 8px ${subjectColor}40` : 'none',
                    transform: isActive ? 'scale(1.15)' : 'scale(1)',
                    opacity: canClick ? 1 : 0.5,
                  }}
                  disabled={!canClick}
                >
                  <span className="text-[10px] font-bold" style={{ fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif" }}>{idx + 1}</span>
                </button>
              );
            })}
          </div>

          {/* Next + AUTO Buttons — manual advance (not all answered) */}
          {!isAllAnswered && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => isLastQuestion ? handleSave() : (onNext && onNext())}
                className="flex items-center justify-center gap-1.5 px-4 py-1.5 rounded transition-all duration-200"
                style={{
                  fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
                  fontSize: s.answerFont,
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  backgroundColor: `${subjectColor}15`,
                  border: `1px solid ${subjectColor}40`,
                  color: subjectColor,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${subjectColor}30`;
                  e.currentTarget.style.borderColor = subjectColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = `${subjectColor}15`;
                  e.currentTarget.style.borderColor = `${subjectColor}40`;
                }}
              >
                Doorgaan
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              {process.env.NODE_ENV !== 'production' && (
                <button
                  onClick={handleAutoFill}
                  className="flex items-center justify-center gap-1 px-3 py-1.5 rounded transition-all duration-200"
                  style={{
                    fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
                    fontSize: s.answerFont,
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    backgroundColor: 'rgba(250, 204, 21, 0.12)',
                    border: '1px solid rgba(250, 204, 21, 0.4)',
                    color: '#facc15',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(250, 204, 21, 0.25)';
                    e.currentTarget.style.borderColor = '#facc15';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(250, 204, 21, 0.12)';
                    e.currentTarget.style.borderColor = 'rgba(250, 204, 21, 0.4)';
                  }}
                  title={devAutoFillTarget
                    ? `DEV: Re-fill → ${devAutoFillTarget.mainArchetype} / ${devAutoFillTarget.supportGroup} ("${devAutoFillTarget.extended}")`
                    : 'DEV: Auto-fill → picks 1 of 72 outcomes (80/20 weighted)'}
                >
                  AUTO
                </button>
              )}
            </div>
          )}

          {/* Save Button — appears on last question OR when all answered */}
          {(isAllAnswered || isLastQuestion) && (
            <button
              onClick={handleSave}
              className="w-full py-2.5 rounded font-bold uppercase tracking-wider transition-all duration-300 relative overflow-hidden text-sm mb-1"
              style={{
                fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
                backgroundColor: subjectColor,
                color: '#0f172a',
                border: `2px solid ${subjectColor}`,
                boxShadow: `0 0 20px ${subjectColor}40`,
              }}
            >
              {/* Corner accents on save button */}
              <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 opacity-50" style={{ borderColor: '#0f172a' }} />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 opacity-50" style={{ borderColor: '#0f172a' }} />
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save
              </span>
            </button>
          )}
        </footer>
      </div>
    </div>
  );
};

export default AssessmentCard;
