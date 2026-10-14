import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '@gfl/i18n';
import { isNatureSlot } from '@gfl/assessment-core/assessmentData';
import { getExtendedArchetype } from '@gfl/assessment-core/data';
import { pingBackend } from '@gfl/api-client';
import { getCardSizes } from './assessmentSizes';
import { isIntegratedGPU } from '@gfl/utils';

import HoloOverlays from '../HoloOverlays';

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

/** Render translated overlay copy that carries inline colour markers.
 *  \n -> <br/>, {c:#rrggbb|text} / {c:accent|text} -> coloured span, {cb:...|text} -> bold.
 */
const OVERLAY_MARK = /\{(c|cb):(accent|#[0-9a-fA-F]{6})\|([^}]*)\}/g;
function renderOverlayText(text, accent) {
  const out = [];
  String(text).split('\n').forEach((line, li) => {
    if (li > 0) out.push(<br key={`obr-${li}`} />);
    let last = 0;
    let m;
    OVERLAY_MARK.lastIndex = 0;
    while ((m = OVERLAY_MARK.exec(line)) !== null) {
      if (m.index > last) out.push(line.slice(last, m.index));
      const color = m[2] === 'accent' ? accent : m[2];
      out.push(
        <span key={`om-${li}-${m.index}`} style={m[1] === 'cb' ? { color, fontWeight: 'bold' } : { color }}>
          {m[3]}
        </span>
      );
      last = OVERLAY_MARK.lastIndex;
    }
    if (last < line.length) out.push(line.slice(last));
  });
  return out;
}

// ═══ DEV AUTO-FILL: 132-OUTCOME WEIGHTED SYSTEM ═══
// 12 main archetypes × 11 support archetypes = 132 possible outcomes
// Target persists across layers; resets on layer 0 AUTO click
const DEV_ALL_ARCHETYPES = [
  'JUDGE','LOVER','CAREGIVER','INNOCENT','EXPLORER','OUTLAW',
  'TRICKSTER','SAGE','ARTIST','MAGICIAN','HERO','RULER'
];
const DEV_GROUP_FOR = {
  JUDGE: 'RULING', RULER: 'RULING', LOVER: 'RELATIONAL', CAREGIVER: 'RELATIONAL',
  INNOCENT: 'SEEKER', EXPLORER: 'SEEKER', OUTLAW: 'CHAOS', TRICKSTER: 'CHAOS',
  SAGE: 'ABSTRACT', ARTIST: 'ABSTRACT', MAGICIAN: 'AGENCY', HERO: 'AGENCY',
};

let devAutoFillTarget = null;

function devPickRandomTarget() {
  const main = DEV_ALL_ARCHETYPES[Math.floor(Math.random() * 12)];
  const supports = DEV_ALL_ARCHETYPES.filter(a => a !== main);
  const support = supports[Math.floor(Math.random() * supports.length)];
  const supportGroup = DEV_GROUP_FOR[support];
  const extended = (getExtendedArchetype(main, support) || main).replace(/^The\s+/, '');
  return { mainArchetype: main, supportArchetype: support, supportGroup, extended };
}

function devRandomExcluding(max, exclude) {
  let idx;
  do { idx = Math.floor(Math.random() * max); } while (exclude.includes(idx));
  return idx;
}

// ═══ TWO-LAYER TEST (Leerling, scoring_version v2_two_layer) ═══
// Per question: Layer 1 shows the six group answers in the rotation sequence's slot order A–F (pick one or
// two, or "Geen van deze past"); the card then switches to Layer 2, the archetype answers of the picked
// group(s) — 2 or 4, shuffled at render, at most two picks, none is allowed. The next question switches
// back to Layer 1. The record per question (App.jsx turns it into the response record the server scores):
//   { l1: [{group, slot}], l2: [archetype], refusal: bool, timeout: bool }
const EMPTY_TWO_LAYER = Object.freeze({ l1: [], l2: [], refusal: false, timeout: false });
// The switch takes 1.5 s (owner, 13 Oct: the 3D turn distracted): only the content — the question and its
// answers — fades out and back in, on one symmetric ease. The card itself, its header (number, layer,
// timer, subject) and its buttons stay; the header's number and layer change at the swap, while the content
// is invisible. A layer's timer and button lock start only once the content has settled.
const FADE_OUT_MS = 750;
const FADE_IN_MS = 750;
const FADE_EASE = 'cubic-bezier(0.45, 0, 0.55, 1)';

/** Layer 2 has no key: its order is shuffled once per question and pick, then kept while the card is shown. */
function shuffled(items) {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * DEV: answer this subject's questions towards one Main × Support, with some fallbacks and refusals. Like
 * the old test's AUTO, the target is drawn on the first subject and kept for the others.
 */
function devTwoLayerRecords(questions, subjectIndex) {
  if (subjectIndex === 0 || !devAutoFillTarget) devAutoFillTarget = devPickRandomTarget();
  const title = (k) => k.charAt(0) + k.slice(1).toLowerCase();
  const main = title(devAutoFillTarget.mainArchetype);
  const support = title(devAutoFillTarget.supportArchetype);
  console.log(`[DEV AUTO-FILL] two-layer target: ${main} × ${support} → "${devAutoFillTarget.extended}"`);
  return questions.map((q) => {
    const groupOf = (a) => q.l2.find((x) => x.archetype === a)?.group;
    if (Math.random() < 0.03) return [q.id, { ...EMPTY_TWO_LAYER, refusal: true }];
    const groups = [groupOf(main)];
    if (Math.random() < 0.5 && groupOf(support) !== groups[0]) groups.push(groupOf(support));
    const l1 = groups.map((g) => ({ group: g, slot: q.l1.find((a) => a.group === g).slot }));
    const r = Math.random();
    const l2 = r < 0.6 ? [main] : r < 0.85 ? [main, support].filter((a) => groups.includes(groupOf(a))) : [];
    return [q.id, { ...EMPTY_TWO_LAYER, l1, l2 }];
  });
}

/**
 * AssessmentCard - Question card matching SectorFrame styling
 * 
 * Responsive tiers: Desktop (≥1800) / Laptop (≥1079) / Tablet (≥768) / Mobile (<768)
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
  levelConfig = {},
  // Two-layer test: questions carry `l1` (slot order A–F) and `l2`, answers are two-layer records.
  twoLayer = false,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showScrollMode, setShowScrollMode] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [showIntro, setShowIntro] = useState(true);
  const [started, setStarted] = useState(false);
  const [buttonLockSeconds, setButtonLockSeconds] = useState(process.env.NODE_ENV === 'production' ? 3 : 0);
  const levelConfigRef = useRef(levelConfig);
  levelConfigRef.current = levelConfig;
  const { t, tFunc, language } = useLanguage();

  // Questions and answers come from the API, which carries both `text` (Dutch)
  // and `textEn`. A local translations override still wins if one exists, then
  // the API's English, then Dutch.
  const apiText = (key, item) => {
    const override = t(key);
    if (override !== key) return override;
    if (language === 'en' && item?.textEn) return item.textEn;
    return item?.text;
  };

  // Layer descriptors come from the same API documents (name / nameEn).
  const subjectName = (language === 'en' && currentSubject?.nameEn) || currentSubject?.name;

  // ── Responsive breakpoints (matches DesktopLayout pattern) ──
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280);
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Breakpoint-based sizing:  Desktop(≥1800) / Laptop(≥1079) / Tablet(≥768) / Mobile(<768)
  const s = getCardSizes(windowWidth);
  const laptopBlur = isIntegratedGPU() ? 'none' : 'blur(32px)';
  const isLowGpu = isIntegratedGPU();

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

  // ── Two-layer test: which layer is up, and the card turning over between faces ──
  // The layer belongs to the question it was set on: a new question always opens on Layer 1.
  const [layerState, setLayerState] = useState({ qid: null, layer: 1 });
  const layer = twoLayer && currentQuestion && layerState.qid === currentQuestion.id ? layerState.layer : 1;
  const recordOf = useCallback((qid) => {
    const v = allAnswers[qid];
    return v && !Array.isArray(v) ? v : EMPTY_TWO_LAYER;
  }, [allAnswers]);
  const currentRecord = twoLayer && currentQuestion ? recordOf(currentQuestion.id) : EMPTY_TWO_LAYER;

  // `face` is what the card shows; it follows (question, layer) through the change. Phase 'out' fades the
  // content out, it swaps while invisible, 'in-start' holds the new content at zero and 'in' fades it in.
  // While a change runs, a newer target waits and is taken at the swap.
  const [face, setFace] = useState({ q: currentQuestion, layer: 1 });
  const [flip, setFlip] = useState('idle');
  const targetRef = useRef({ q: currentQuestion, layer: 1 });
  const flipTimers = useRef([]);
  targetRef.current = { q: currentQuestion, layer };
  useEffect(() => () => flipTimers.current.forEach(clearTimeout), []);
  useEffect(() => {
    if (!twoLayer || !currentQuestion) return;
    if (face.q?.id === currentQuestion.id && face.layer === layer) return;
    if (flip !== 'idle') return; // the swap below takes the latest target
    if (!face.q || prefersReducedMotion() || !started) { setFace(targetRef.current); return; }
    setFlip('out');
    flipTimers.current.push(setTimeout(() => {
      setFace(targetRef.current);
      setFlip('in-start');
      requestAnimationFrame(() => requestAnimationFrame(() => setFlip('in')));
      flipTimers.current.push(setTimeout(() => setFlip('idle'), FADE_IN_MS + 40));
    }, FADE_OUT_MS));
  }, [twoLayer, currentQuestion, layer, face, flip, started]);

  const contentFade = !twoLayer || flip === 'idle' ? {} : {
    opacity: flip === 'in' ? 1 : 0,
    transition: flip === 'out' ? `opacity ${FADE_OUT_MS}ms ${FADE_EASE}`
      : flip === 'in' ? `opacity ${FADE_IN_MS}ms ${FADE_EASE}` : 'none',
    willChange: 'opacity',
  };

  /** Layer 1: one or two groups (a third replaces the second), or the refusal, which excludes them. */
  const handleGroupClick = useCallback((answer) => {
    const rec = recordOf(currentQuestion.id);
    const l1 = rec.l1.slice();
    const idx = l1.findIndex((p) => p.group === answer.group);
    if (idx !== -1) l1.splice(idx, 1);
    else if (l1.length < 2) l1.push({ group: answer.group, slot: answer.slot });
    else l1[1] = { group: answer.group, slot: answer.slot };
    const inGroups = (a) => l1.some((p) => p.group === currentQuestion.l2.find((x) => x.archetype === a)?.group);
    onSelectAnswer(currentQuestion.id, l1.length ? { ...EMPTY_TWO_LAYER, l1, l2: rec.l2.filter(inGroups) } : null);
  }, [currentQuestion, recordOf, onSelectAnswer]);

  const handleRefusalClick = useCallback(() => {
    const rec = recordOf(currentQuestion.id);
    onSelectAnswer(currentQuestion.id, rec.refusal ? null : { ...EMPTY_TWO_LAYER, refusal: true });
  }, [currentQuestion, recordOf, onSelectAnswer]);

  /** Layer 2: at most two archetypes, all inside the picked groups (a third replaces the second). */
  const handleArchetypeClick = useCallback((archetype) => {
    const rec = recordOf(currentQuestion.id);
    const l2 = rec.l2.slice();
    const idx = l2.indexOf(archetype);
    if (idx !== -1) l2.splice(idx, 1);
    else if (l2.length < 2) l2.push(archetype);
    else l2[1] = archetype;
    onSelectAnswer(currentQuestion.id, { ...rec, l2 });
  }, [currentQuestion, recordOf, onSelectAnswer]);

  // The Layer-2 order per question and pick, shuffled once (Rotation Sequence §1: no key, never stored).
  const l2Orders = useRef(new Map());
  const layer2Answers = (q, rec) => {
    const groups = rec.l1.map((p) => p.group);
    const key = `${q.id}|${[...groups].sort().join(',')}`;
    if (!l2Orders.current.has(key)) l2Orders.current.set(key, shuffled(q.l2.filter((a) => groups.includes(a.group))));
    return l2Orders.current.get(key);
  };

  // Each layer of a two-layer question runs its own timer and button lock, starting only once the card has
  // settled: no flip running and the face showing this question's current layer.
  const timerKey = twoLayer ? `${currentQuestion?.id}:${layer}` : currentQuestion?.id;
  const cardSettled = !twoLayer || (flip === 'idle' && face.q?.id === currentQuestion?.id && face.layer === layer);

  // Trigger content animation when question changes (the two-layer card fades its content itself, above)
  useEffect(() => {
    if (twoLayer) return undefined;
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 250);
    return () => clearTimeout(timer);
  }, [currentQuestion?.id, twoLayer]);

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
    if (!cardSettled) return undefined; // full time on show, counting starts when the flip has ended

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
  }, [timerKey, cardSettled, currentSubjectIndex, hasTimer, started, levelConfig.timerType, levelConfig.fixedTimer, levelConfig.layerTimers]);

  // Auto-advance when timer runs out (with or without answer selected)
  useEffect(() => {
    if (hasTimer && timeRemaining !== null && timeRemaining === 0 && twoLayer) {
      handleTwoLayerTimeout();
    } else if (hasTimer && timeRemaining !== null && timeRemaining === 0) {
      if (isLastQuestion) {
        handleSave();
      } else if (onNext) {
        onNext();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining]);

  // 3-second trigger lock: block Doorgaan on every new question to prevent accidental skipping
  useEffect(() => {
    if (!started) return;
    if (process.env.NODE_ENV !== 'production') return; // disabled on localhost
    setButtonLockSeconds(3);
    if (!cardSettled) return; // held at 3 while the card turns
    const interval = setInterval(() => {
      setButtonLockSeconds(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerKey, cardSettled, started]);

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
    pingBackend();
  };

  // ── Two-layer advance: Layer 1 → its Layer 2 (a refusal skips it), Layer 2 → the next question ──
  const advanceQuestion = () => (isLastQuestion ? handleSave() : onNext && onNext());
  const canContinueTwoLayer = layer === 2 || currentRecord.l1.length > 0 || currentRecord.refusal;
  const handleTwoLayerNext = () => {
    if (layer === 2 || currentRecord.refusal) advanceQuestion();
    else if (currentRecord.l1.length) setLayerState({ qid: currentQuestion.id, layer: 2 });
  };
  // The layer's timer ran out: Layer 1 with a pick turns to its Layer 2; with nothing picked the question is
  // recorded as a timeout (zero points, never the same as a refusal) and the test moves on.
  const handleTwoLayerTimeout = () => {
    if (layer === 1 && !currentRecord.l1.length && !currentRecord.refusal) {
      onSelectAnswer(currentQuestion.id, { ...EMPTY_TWO_LAYER, timeout: true });
      advanceQuestion();
    } else {
      handleTwoLayerNext();
    }
  };
  const handleTwoLayerAutoFill = () => {
    devTwoLayerRecords(questions, currentSubjectIndex).forEach(([qid, rec]) => onSelectAnswer(qid, rec));
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

    const { mainArchetype, supportArchetype } = devAutoFillTarget;

    questions.forEach((q) => {
      const ans = q.answers;
      const mainIdx = ans.findIndex(a => a.archetype === mainArchetype);
      const supportIdx = ans.findIndex(a => a.archetype === supportArchetype);
      // 132-matrix: the support ARCHETYPE itself is the target — no group-partner
      // stand-in (that would bias the score toward a different extension).
      const altSupportIdx = -1;

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
    <div className="relative mx-auto" style={{ width: isCollapsed ? s.cardBaseWidth : s.cardMaxWidth, maxWidth: '96vw' }}>
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
              padding: s.introPad,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: s.introGap,
            }}>
              <h3 style={{
                fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
                fontSize: s.introTitleFont,
                color: '#f97316',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                marginBottom: '0.25rem',
                textAlign: 'center',
              }}>
                {t('assessmentCard.intro.title')}
              </h3>

              <p style={{
                fontFamily: "'Figtree', sans-serif",
                fontSize: s.introDescFont,
                color: 'rgba(255, 254, 240, 0.6)',
                textAlign: 'center',
                lineHeight: 1.7,
              }}>
                {renderOverlayText(t('assessmentCard.intro.words'), subjectColor)}
              </p>

              <p style={{
                fontFamily: "'Figtree', sans-serif",
                fontSize: s.introDescFont,
                color: 'rgba(255, 254, 240, 0.6)',
                textAlign: 'center',
                lineHeight: 1.7,
              }}>
                {renderOverlayText(t(twoLayer ? 'assessmentCard.twoLayer.picks' : 'assessmentCard.intro.picks'), subjectColor)}
              </p>

              <p style={{
                fontFamily: "'Figtree', sans-serif",
                fontSize: s.introDescFont,
                color: 'rgba(255, 254, 240, 0.6)',
                textAlign: 'center',
                lineHeight: 1.7,
              }}>
                {renderOverlayText(t(twoLayer ? 'assessmentCard.twoLayer.resonance' : 'assessmentCard.intro.resonance'), subjectColor)}
              </p>

              <p style={{
                fontFamily: "'Figtree', sans-serif",
                fontSize: s.introDescFont,
                color: 'rgba(255, 254, 240, 0.5)',
                textAlign: 'center',
                lineHeight: 1.7,
              }}>
                {renderOverlayText(t('assessmentCard.intro.timerIntro'), subjectColor)}
                <br />
                <span style={{ color: '#a855f7' }}>
                {levelConfig.timerType === 'layered' && levelConfig.layerTimers
                  ? <>{levelConfig.layerTimers.join('s → ')}s</>
                  : <>111s → 90s → 72s → 60s → 49s</>
                }
                </span>
                {renderOverlayText(t(twoLayer ? 'assessmentCard.twoLayer.timerOutro' : 'assessmentCard.intro.timerOutro'), subjectColor)}
              </p>

              <p style={{
                fontFamily: "'Figtree', sans-serif",
                fontSize: s.introItalicFont,
                color: 'rgba(255, 254, 240, 0.75)',
                textAlign: 'center',
                lineHeight: 1.7,
                fontStyle: 'italic',
                marginTop: '0.25rem',
              }}>
                {renderOverlayText(t('assessmentCard.intro.honesty'), subjectColor)}
              </p>

              <button
                onClick={() => setShowIntro(false)}
                aria-label={t('assessmentCard.intro.continueLabel')}
                className="px-8 py-2.5 rounded font-bold uppercase tracking-wider transition-all duration-300"
                style={{
                  fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
                  fontSize: s.introBtnFont,
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
              padding: s.layerIntroPad,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: s.layerIntroGap,
            }}>
              <h3 style={{
                fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
                fontSize: s.layerTitleFont,
                color: subjectColor,
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                textAlign: 'center',
                marginBottom: '0.25rem',
              }}>
                {subjectName || tFunc('assessmentCard.layerIntro.fallbackName')(currentSubjectIndex + 1)}
              </h3>

              {levelConfig.timerType === 'layered' && levelConfig.layerTimers && (
                <div style={{
                  fontFamily: "'Figtree', sans-serif",
                  fontSize: s.layerTimerFont,
                  color: 'rgba(255, 254, 240, 0.5)',
                  textAlign: 'center',
                  lineHeight: '1.7',
                }}>
                  <span style={{ color: subjectColor }}>{tFunc('assessmentCard.layerIntro.secondsPerQuestion')(levelConfig.layerTimers[currentSubjectIndex] || 30)}</span>
                  {' · '}{tFunc('assessmentCard.layerIntro.questionCount')(totalQuestions)}
                </div>
              )}

              <p style={{
                fontFamily: "'Figtree', sans-serif",
                fontSize: s.layerDescFont,
                color: 'rgba(255, 254, 240, 0.55)',
                textAlign: 'center',
                lineHeight: 1.7,
                maxWidth: '26rem',
                marginTop: '0.25rem',
              }}>
                <span style={{ color: '#f97316', fontWeight: 'bold', fontSize: '1rem' }}>{t('assessmentCard.layerIntro.attention')}</span>
                <br />
                {renderOverlayText(t('assessmentCard.layerIntro.body'), subjectColor)}
                <br /><br />
                <em style={{ color: 'rgba(255, 254, 240, 0.55)' }}>{t('assessmentCard.layerIntro.stereotypeLabel')}</em>
                <br />
                {currentSubjectIndex === 1 && <span style={{ color: subjectColor, fontWeight: 'bold' }}>{t('assessmentCard.layerIntro.stereotypes.attentionAction')}</span>}
                {currentSubjectIndex === 2 && <span style={{ color: subjectColor, fontWeight: 'bold' }}>{t('assessmentCard.layerIntro.stereotypes.projection')}</span>}
                {currentSubjectIndex === 3 && <span style={{ color: subjectColor, fontWeight: 'bold' }}>{t('assessmentCard.layerIntro.stereotypes.hardening')}</span>}
                {currentSubjectIndex === 4 && <span style={{ color: subjectColor, fontWeight: 'bold' }}>{t('assessmentCard.layerIntro.stereotypes.extremism')}</span>}
              </p>

              <button
                onClick={() => {
                  setShowIntro(false);
                  setStarted(true);
                }}
                className="px-8 py-2.5 rounded font-bold uppercase tracking-wider transition-all duration-300"
                style={{
                  fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
                  fontSize: s.layerBtnFont,
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
                {t('assessmentCard.layerIntro.start')}
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
            padding: s.layerIntroPad,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: s.layerIntroGap,
          }}>
            <h3 style={{
              fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
              fontSize: s.layerTitleFont,
              color: subjectColor,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              textAlign: 'center',
              marginBottom: '0.25rem',
            }}>
              {subjectName || tFunc('assessmentCard.layerIntro.fallbackName')(currentSubjectIndex + 1)}
            </h3>

            {levelConfig.timerType === 'layered' && levelConfig.layerTimers && (
              <div style={{
                fontFamily: "'Figtree', sans-serif",
                fontSize: s.layerTimerFont,
                color: 'rgba(255, 254, 240, 0.5)',
                textAlign: 'center',
                lineHeight: '1.7',
              }}>
                <span style={{ color: subjectColor }}>{tFunc('assessmentCard.layerIntro.secondsPerQuestion')(levelConfig.layerTimers[currentSubjectIndex] || 30)}</span>
                {' · '}{tFunc('assessmentCard.layerIntro.questionCount')(totalQuestions)}
              </div>
            )}

            <p style={{
              fontFamily: "'Figtree', sans-serif",
              fontSize: s.layerDescFont,
              color: 'rgba(255, 254, 240, 0.55)',
              textAlign: 'center',
              lineHeight: 1.7,
              maxWidth: '26rem',
              marginTop: '0.25rem',
            }}>
              <span style={{ color: '#f97316', fontWeight: 'bold', fontSize: '1rem' }}>{t('assessmentCard.layerIntro.attention')}</span>
              <br />
              {renderOverlayText(t('assessmentCard.layerIntro.body'), subjectColor)}
              <br /><br />
              <em style={{ color: 'rgba(255, 254, 240, 0.55)' }}>{t('assessmentCard.layerIntro.stereotypeLabel')}</em>
              <br />
              <span style={{ color: subjectColor, fontWeight: 'bold' }}>{t('assessmentCard.layerIntro.stereotypes.intentionPotential')}</span>
            </p>

            <button
              onClick={() => setStarted(true)}
              className="px-8 py-2.5 rounded font-bold uppercase tracking-wider transition-all duration-300"
              style={{
                fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
                fontSize: s.layerStartBtnFont,
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
              {t('assessmentCard.layerIntro.start')}
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
        style={{ backgroundColor: isLowGpu ? 'rgba(10, 3, 18, 0.9)' : 'rgba(2, 0, 3, 0.3)', backdropFilter: laptopBlur, WebkitBackdropFilter: laptopBlur, maxHeight: isCollapsed ? '80px' : s.maxH, boxShadow: `0 6px 30px rgba(0,0,0,0.7), 0 12px 60px rgba(0,0,0,0.5), 0 0 80px rgba(0,0,0,0.35), 0 0 120px rgba(0,0,0,0.15), inset 0 0 12px ${subjectColor}10, inset 0 0 30px ${subjectColor}08` }}
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

        {/* Holographic sheen + scanline sweep (compositor-only) */}
        <HoloOverlays />

        {/* Noise texture overlay */}
        <div className="absolute inset-0 rounded-lg pointer-events-none bg-[url('/images/noise.svg')] opacity-[0.03] mix-blend-overlay" />

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
                {String(twoLayer ? (face.q?.position ?? questionNumber) : questionNumber).padStart(2, '0')}
              </div>
              <div className="flex flex-col items-start gap-0.5">
                <span className="text-xs" style={{ color: '#FFFEF0', opacity: 0.5, fontFamily: "'Figtree', sans-serif" }}>
                  Q{twoLayer ? (face.q?.position ?? questionNumber) : questionNumber}/{totalQuestions}
                  {twoLayer && (
                    <span style={{ marginLeft: '0.5rem', color: subjectColor, opacity: 1, fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif", letterSpacing: '0.12em', fontWeight: 'bold' }}>
                      {tFunc('assessmentCard.twoLayer.layer')(face.layer)}
                    </span>
                  )}
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
                {t('assessmentCard.header.section')}
              </span>
              <h2 className="text-base font-bold tracking-wider" style={{ color: subjectColor, fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif" }}>
                {subjectName?.toUpperCase() || tFunc('assessmentCard.header.fallbackLayer')(currentSubjectIndex + 1)}
              </h2>
            </div>

            {/* Scroll indicator in collapsed mode */}
            {isCollapsed && showScrollMode && (
              <div className="flex items-center gap-1" style={{ color: subjectColor }}>
                <span className="text-xs font-bold uppercase tracking-widest" style={{ fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif" }}>
                  {t('assessmentCard.header.scroll')}
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
          style={{ minHeight: isCollapsed ? 0 : s.contentMinH, padding: isCollapsed ? 0 : s.contentPad, pointerEvents: twoLayer && flip !== 'idle' ? 'none' : undefined, ...contentFade }}
        >
          {twoLayer ? face.q && (() => {
            // ── Two-layer face: the question, then Layer 1 (six groups + refusal) or Layer 2 (2 or 4 archetypes) ──
            const q = face.q;
            const rec = recordOf(q.id);
            const answerText = (r) => (language === 'en' && r.textEn) || r.text;
            const renderLayer = (layerNo) => {
            const rows = layerNo === 1
              ? q.l1.map((a) => ({ key: a.slot, badge: a.slot, text: a.text, textEn: a.textEn, selected: rec.l1.some((p) => p.group === a.group), onClick: () => handleGroupClick(a) }))
              : layer2Answers(q, rec).map((a, i) => ({ key: a.archetype, badge: String.fromCharCode(65 + i), text: a.text, textEn: a.textEn, selected: rec.l2.includes(a.archetype), onClick: () => handleArchetypeClick(a.archetype) }));
            return (
              <>
                <div className="relative pl-3" style={{ minHeight: s.questionMinH }}>
                  <div className="absolute left-0 top-1 bottom-1 w-[2px]" style={{ background: `linear-gradient(to bottom, ${subjectColor}, transparent)` }} />
                  <p style={{ fontSize: s.questionFont, lineHeight: 1.5, color: '#FFFEF0', fontFamily: "'Figtree', sans-serif" }}>
                    {stripMeta((language === 'en' && q.textEn) || q.text)}
                  </p>
                  <p style={{ fontSize: s.answerFont, marginTop: '0.35rem', color: `${subjectColor}`, opacity: 0.85, fontFamily: "'Figtree', sans-serif" }}>
                    {t(layerNo === 1 ? 'assessmentCard.twoLayer.l1Hint' : 'assessmentCard.twoLayer.l2Hint')}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {rows.map((r) => (
                    <button
                      key={r.key}
                      onClick={r.onClick}
                      aria-pressed={r.selected}
                      className={`relative group flex items-stretch text-left transition-all duration-200 w-full ${r.selected ? 'translate-x-1' : 'hover:translate-x-0.5'}`}
                      style={{ minHeight: s.answerMinH }}
                    >
                      <div
                        className="flex items-center justify-center font-bold border-y border-l rounded-l-sm transition-colors duration-300"
                        style={{
                          width: s.letterBadgeW,
                          fontSize: s.answerFont,
                          fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
                          backgroundColor: r.selected ? subjectColor : 'rgba(8, 2, 12, 0.95)',
                          color: r.selected ? '#000' : '#FFFEF0',
                          borderColor: r.selected ? subjectColor : `${subjectColor}30`,
                        }}
                      >
                        {r.badge}
                      </div>
                      <div className="w-5 border-y relative overflow-visible" style={{ borderColor: r.selected ? subjectColor : `${subjectColor}30`, backgroundColor: r.selected ? `${subjectColor}15` : 'transparent' }}>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-full h-[1px]" style={{ backgroundColor: r.selected ? subjectColor : `${subjectColor}20` }} />
                        </div>
                      </div>
                      <div
                        className="flex-1 px-3 py-2 border-y border-r rounded-r-sm flex items-center transition-all duration-300"
                        style={{
                          backgroundColor: r.selected ? `${subjectColor}20` : 'rgba(8, 2, 12, 0.95)',
                          borderColor: r.selected ? subjectColor : `${subjectColor}30`,
                          color: r.selected ? '#FFFEF0' : 'rgba(255, 254, 240, 0.7)',
                          boxShadow: r.selected ? `0 0 12px ${subjectColor}30` : 'none',
                        }}
                      >
                        <span style={{ fontSize: s.answerFont, fontFamily: "'Figtree', sans-serif" }}>
                          {parseColoredText(answerText(r), null, null)}
                        </span>
                      </div>
                    </button>
                  ))}
                  {layerNo === 1 && (
                    <button
                      onClick={handleRefusalClick}
                      aria-pressed={rec.refusal}
                      className="w-full px-3 py-2 rounded-sm text-center transition-all duration-200"
                      style={{
                        minHeight: s.answerMinH,
                        marginTop: '0.25rem',
                        fontSize: s.answerFont,
                        fontFamily: "'Figtree', sans-serif",
                        border: `1px dashed ${rec.refusal ? '#f97316' : 'rgba(249, 115, 22, 0.35)'}`,
                        backgroundColor: rec.refusal ? 'rgba(249, 115, 22, 0.15)' : 'rgba(8, 2, 12, 0.95)',
                        color: rec.refusal ? '#FFFEF0' : 'rgba(255, 254, 240, 0.6)',
                        boxShadow: rec.refusal ? '0 0 12px rgba(249, 115, 22, 0.25)' : 'none',
                      }}
                    >
                      {t('assessmentCard.twoLayer.refusal')}
                    </button>
                  )}
                </div>
              </>
            );
            };
            // Layer 2 keeps Layer 1's size (owner, 13 Oct): an invisible copy of this question's Layer 1 shares the
            // grid cell, so the card holds the larger layer's height at every vw step, language and question length.
            // visibility:hidden also takes the copy out of the tab order and out of reach of clicks.
            return (
              <div className="grid">
                {face.layer === 2 && (
                  <div aria-hidden="true" className="flex flex-col gap-3" style={{ gridArea: '1 / 1', visibility: 'hidden' }}>
                    {renderLayer(1)}
                  </div>
                )}
                <div className="flex flex-col gap-3" style={{ gridArea: '1 / 1' }}>
                  {renderLayer(face.layer)}
                </div>
              </div>
            );
          })() : (<>
          {/* Question Text */}
            <div className="relative pl-3" style={{ minHeight: s.questionMinH }}>
            <div className="absolute left-0 top-1 bottom-1 w-[2px]" style={{ background: `linear-gradient(to bottom, ${subjectColor}, transparent)` }} />
            <p style={{ fontSize: s.questionFont, lineHeight: 1.5, color: '#FFFEF0', fontFamily: "'Figtree', sans-serif" }}>
              {stripMeta(apiText(`questions.${currentQuestion.id}`, currentQuestion))}
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
                      {parseColoredText(apiText(`answers.${answer.id}`, answer), currentQuestion.id, idx)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
          </>)}
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
              // The two-layer test only moves forward (and never skips a question), so its markers only show progress.
              const canClick = !twoLayer && levelConfig.allowQuestionJump !== false; // Default to true if not specified
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
                    opacity: canClick || twoLayer ? 1 : 0.5,
                    cursor: twoLayer ? 'default' : undefined,
                  }}
                  disabled={!canClick}
                >
                  <span className="text-[10px] font-bold" style={{ fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif" }}>{twoLayer ? q.position : idx + 1}</span>
                </button>
              );
            })}
          </div>

          {/* Next + AUTO Buttons — manual advance */}
          {(twoLayer || !isAllAnswered || isLastQuestion) && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => {
                  if (process.env.NODE_ENV === 'production' && buttonLockSeconds > 0) return;
                  if (twoLayer) {
                    if (flip === 'idle' && canContinueTwoLayer) handleTwoLayerNext();
                    return;
                  }
                  isLastQuestion ? handleSave() : (onNext && onNext());
                }}
                disabled={twoLayer && !canContinueTwoLayer}
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
                  opacity: twoLayer && !canContinueTwoLayer ? 0.4 : 1,
                  cursor: twoLayer && !canContinueTwoLayer ? 'not-allowed' : undefined,
                }}
                onMouseEnter={(e) => {
                  if (e.currentTarget.disabled) return;
                  e.currentTarget.style.backgroundColor = `${subjectColor}30`;
                  e.currentTarget.style.borderColor = subjectColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = `${subjectColor}15`;
                  e.currentTarget.style.borderColor = `${subjectColor}40`;
                }}
              >
                {t('assessmentCard.footer.next')}
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              {process.env.NODE_ENV !== 'production' && (
                <button
                  onClick={() => { if (twoLayer) handleTwoLayerAutoFill(); else handleAutoFill(); handleSave(); }}
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
                    : 'DEV: Auto-fill → picks 1 of 132 outcomes (80/20 weighted)'}
                >
                  AUTO
                </button>
              )}
            </div>
          )}

        </footer>
      </div>
    </div>
  );
};

export default AssessmentCard;
