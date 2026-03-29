import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import AssessmentCard from './AssessmentCard';
import { getLayerPanelSizes } from './assessmentSizes';


/**
 * AssessmentLayerPanel - Renders MULTIPLE layer panels that persist after saving
 * Now uses the new AssessmentCard component for each layer's question UI
 * 
 * Animation flow (v3 — right-centered open, left pyramid stack):
 * 1. Every card opens at the SAME position: RIGHT side, vertically centered (50vh)
 * 2. When all questions answered OR on last question → Save button appears in AssessmentCard
 * 3. Click Save → Phase 1: card COLLAPSES in place (~900ms)
 *                → Phase 2: collapsed card slides to LEFT at its pyramid layer height (~1200ms)
 * 4. User scrolls → next card floats from entity to the same RIGHT center position
 * 5. Saved cards on the LEFT stack at pyramid layer heights (pyramid shape)
 * 6. When layer 4 is saved → all panels float back to entity center (convergence)
 */

// Layer configuration matching pyramid (bottom to top)
const LAYERS = [
  { nameKey: "zelf",     color: "#22c55e", descKey: "zelf" },
  { nameKey: "ander",   color: "#3b82f6", descKey: "ander" },
  { nameKey: "massa",   color: "#a855f7", descKey: "massa" },
  { nameKey: "wereld",  color: "#ef4444", descKey: "wereld" },
  { nameKey: "mysterie",color: "#f97316", descKey: "mysterie" },
];



// Vertical positions for SAVED cards on the LEFT side (pyramid layer heights)
// Follow the pyramid upward trail: bottom layer lowest on screen, top layer highest
const SAVED_LAYER_POSITIONS = [
  68, // Zelf (bottom) - low on screen
  58, // Ander
  48, // Massa - center
  38, // Wereld
  28, // Mysterie (top) - high on screen
];

// Where the 3D pyramid layers ACTUALLY render on screen (vh) — Desktop
// FULL transform chain (post-explosion, explosionProgress=1):
//   coreRef.y = 0.25 - 1.75 + 0.27 = -1.23  (zoomed-in state)
//   worldY = (baseY + (yPos + coreY) × innerScale) × outerScale
//         = (0.45 + (yPos - 1.23) × 0.65) × 0.5
//   Camera fov=40°, z=8, worldZ=1.46 → dist=6.54, halfFrustum=2.38
//   viewportVh = 50 − (worldY / 2.38) × 100   (200% canvas centred)
const PYRAMID_CENTER_Y = [
  71, // Zelf       (3D y=-1.0 → worldY -0.50 → 71vh)
  64, // Ander      (3D y=-0.5 → worldY -0.34 → 64vh)
  57, // Massa      (3D y= 0.0 → worldY -0.17 → 57vh)
  51, // Wereld     (3D y= 0.5 → worldY -0.01 → 51vh)
  44, // Mysterie   (3D y= 1.0 → worldY  0.15 → 44vh)
];

// All OPEN cards sit at the same vertical center on the RIGHT side
const OPEN_Y = 50; // vertically centered in viewport

// Scale factors for saved cards on the left side — all stay full size
const SAVED_SCALES = [
  1.0, // Zelf (bottom)
  1.0, // Ander
  1.0, // Massa
  1.0, // Wereld
  1.0, // Mysterie (top)
];

// Assessment Level Configurations
const LEVEL_CONFIGS = {
  // Beginner - Rapidfire mode with fixed 49s per question
  quick: {
    name: 'Beginner',
    questionsPerLayer: 3,
    timerType: 'fixed',
    fixedTimer: 49,
    allowBacktrack: true,
    allowQuestionJump: true
  },
  // Intermediate/Gevorderd - Quickfire mode with fixed 49s per question
  standard: {
    name: 'Gevorderd',
    questionsPerLayer: 6,
    timerType: 'fixed',
    fixedTimer: 49,
    allowBacktrack: false,
    allowQuestionJump: false
  },
  // Leerling - Vuurproef mode with layer-based pyramid timers
  deep: {
    name: 'Leerling',
    questionsPerLayer: null, // use all questions per layer (9,9,6,6,6)
    timerType: 'layered',
    layerTimers: [111, 90, 72, 60, 49],
    allowBacktrack: false,
    allowQuestionJump: false
  }
};

// Animation timing (ms)
const COLLAPSE_WAIT = 900;   // Wait for card collapse before moving
const MOVE_DURATION = 1200;  // Slide from right to left

// Single Layer Panel Component - wraps AssessmentCard with positioning logic
const SingleLayerPanel = ({
  layerIndex,
  layer,
  layerQuestions = [],
  answers,
  onAnswerSelect,
  isSaved,
  scrollProgress,
  onSave,
  onLayerAnimationStateChange,
  gatherProgress = 0,
  staircaseStep = -1,
  assessmentLevel,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const currentQuestionIndexRef = useRef(0);
  const { t } = useLanguage();

  // ── Responsive breakpoints ──
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280);
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Track save animation: 'idle' → 'collapsing' → 'moving' → 'done'
  // If already saved on mount (e.g. remount after scroll-back), skip straight to 'done'
  const [savePhase, setSavePhase] = useState(() => isSaved ? 'done' : 'idle');
  // Move progress (0 = still on right, 1 = fully on left)
  // If already saved on mount, start at 1 so card is already in its left position
  const [moveProgress, setMoveProgress] = useState(() => isSaved ? 1 : 0);
  const moveAnimRef = useRef(null);
  const collapseTimerRef = useRef(null);

  // Two-phase save animation:
  //   Phase 1: card collapses in place (COLLAPSE_WAIT ms)
  //   Phase 2: collapsed card slides from right to left (MOVE_DURATION ms)
  //   On completion: directly signals App.js (no useEffect, avoids timing bugs)
  useEffect(() => {
    if (isSaved && savePhase === 'idle') {
      console.log(`[PANEL L${layerIndex}] Starting save animation`);
      setSavePhase('collapsing');
      // Phase 1: wait for collapse animation to finish
      collapseTimerRef.current = setTimeout(() => {
        console.log(`[PANEL L${layerIndex}] Phase 2: moving`);
        setSavePhase('moving');
        // Phase 2: animate slide to left
        const startTime = performance.now();
        const animate = (now) => {
          const elapsed = now - startTime;
          const t = Math.min(1, elapsed / MOVE_DURATION);
          // ease-in-out cubic for a natural feel
          const eased = t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
          setMoveProgress(eased);
          if (t < 1) {
            moveAnimRef.current = requestAnimationFrame(animate);
          } else {
            setSavePhase('done');
            console.log(`[PANEL L${layerIndex}] Animation DONE, signaling false`);
            // Signal App.js directly from animation completion — no useEffect indirection
            if (onLayerAnimationStateChange) {
              onLayerAnimationStateChange(layerIndex, false);
            }
          }
        };
        moveAnimRef.current = requestAnimationFrame(animate);
      }, COLLAPSE_WAIT);
    }
    return () => {
      if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current);
      if (moveAnimRef.current) cancelAnimationFrame(moveAnimRef.current);
    };
  }, [isSaved]); // eslint-disable-line react-hooks/exhaustive-deps
  
  const questions = useMemo(() => {
    const cfg = LEVEL_CONFIGS[assessmentLevel];
    const limit = cfg?.questionsPerLayer || layerQuestions.length;
    return layerQuestions.slice(0, limit);
  }, [layerQuestions, assessmentLevel]);
  const totalQuestions = questions.length;
  
  const answeredCount = questions.filter(q => {
    const a = answers[q.id];
    return Array.isArray(a) ? a.length > 0 : a !== undefined;
  }).length;
  
  // Calculate animation progress for this layer (scroll-based entry from entity)
  const getAnimationProgress = useCallback(() => {
    const totalMovable = 5;
    const rangeStart = layerIndex / totalMovable;
    const rangeEnd = (layerIndex + 1) / totalMovable;
    
    if (scrollProgress >= rangeEnd) return 1;
    if (scrollProgress <= rangeStart) return 0;
    
    return (scrollProgress - rangeStart) / (rangeEnd - rangeStart);
  }, [layerIndex, scrollProgress]);
  
  const animProgress = getAnimationProgress();
  
  // Get panel position and style
  // All cards OPEN at the same right-center position (OPEN_Y vh).
  // When SAVED: first collapse in place, then slide to LEFT at pyramid layer height.
  // Saved cards scale down progressively (pyramid shape).
  const getPanelStyles = useCallback(() => {
    const progress = animProgress;
    const entityCenterX = 50;
    const entityCenterY = 23; // entity center in vh (3D y=0.75 → world 0.775 → ~23vh)
    const savedY = SAVED_LAYER_POSITIONS[layerIndex]; // left-side pyramid Y
    
    // Compute RIGHT-side X position (where cards open — all at same Y)
    // Breakpoint-aware positioning: Desktop / Laptop / Tablet / Mobile
    const vw = window.innerWidth;
    const rightXPercent = vw >= 1800 ? 73 :  // Desktop — balanced
                          vw >= 1079 ? 83 - (5 * 16 / vw * 100) :  // Laptop — 5rem further left
                          vw >= 768  ? 75 :  // Tablet
                          50;                 // Mobile — centered
    
    // Compute LEFT-side X position (where saved cards stack)
    const savedScale = SAVED_SCALES[layerIndex];
    const leftXPercent = vw >= 1800 ? 21 :   // Desktop — snug left of pyramid
                         vw >= 1079 ? 17 + (5 * 16 / vw * 100) :   // Laptop — mirror of right for symmetry
                         vw >= 768  ? 18 :   // Tablet
                         50;                  // Mobile — centered
    
    // ── ABSORB PHASE (staircaseStep=0): all saved cards simultaneously fly
    //    from their saved left positions toward the pyramid center and shrink
    //    to invisible — as if absorbed into their 3D pyramid layers.
    // ── FOLD / DONE (staircaseStep≥1): cards already invisible, hide them.
    if (staircaseStep >= 1) {
      // Already absorbed — fully invisible, keep out of the way
      return {
        position: 'fixed',
        left: '50%',
        right: 'auto',
        top: `${savedY}vh`,
        transform: 'translate(-50%, -50%) scale(0)',
        opacity: 0,
        transition: 'none',
        pointerEvents: 'none',
        zIndex: 140 + layerIndex,
      };
    }

    if (staircaseStep === 0) {
      // Absorb: ALL cards fly simultaneously to their pyramid layer center and shrink.
      // Card 5 (layer 4, just saved) starts from the RIGHT side; cards 0-3 always from LEFT.
      const isLastCard = layerIndex === 4;
      const startX = isLastCard ? rightXPercent : leftXPercent;
      const startY = isLastCard ? OPEN_Y : savedY;
      const endX = entityCenterX; // 50 % — horizontally centered on pyramid
      const endY = PYRAMID_CENTER_Y[layerIndex]; // actual 3D layer screen position (NOT entity)
      const eased = gatherProgress; // already eased in App.js
      const currentX = startX + (endX - startX) * eased;
      const currentY = startY + (endY - startY) * eased;
      // Shrink to ~0.12 at the pyramid (not fully invisible before arriving)
      const scale = Math.max(0, 1 - eased * 0.88);
      const opacity = Math.max(0, 1 - eased * 0.88);

      return {
        position: 'fixed',
        left: `${currentX}%`,
        right: 'auto',
        top: `${currentY}vh`,
        transform: `translate(-50%, -50%) scale(${scale})`,
        opacity,
        transition: 'none',
        pointerEvents: 'none',
        zIndex: 140 + layerIndex,
      };
    }
    
    // Card is saved — determine which phase we're in
    if (isSaved) {
      if (savePhase === 'collapsing') {
        // Phase 1: card is collapsing in place on the right — stay put
        return {
          position: 'fixed',
          left: `${rightXPercent}%`,
          right: 'auto',
          top: `${OPEN_Y}vh`,
          transform: `translate(-50%, -50%)`,
          opacity: 1,
          transition: 'none',
          pointerEvents: 'none',
          zIndex: 150,
        };
      }
      
      // Phase 2 or done: sliding from right → left, and from OPEN_Y → savedY
      const currentX = rightXPercent + (leftXPercent - rightXPercent) * moveProgress;
      const currentY = OPEN_Y + (savedY - OPEN_Y) * moveProgress;
      const currentScale = 1 + (savedScale - 1) * moveProgress;
      
      return {
        position: 'fixed',
        left: `${currentX}%`,
        right: 'auto',
        top: `${currentY}vh`,
        transform: `translate(-50%, -50%) scale(${currentScale})`,
        opacity: 1,
        transition: 'none',
        pointerEvents: 'none',
        zIndex: 140,
      };
    }
    
    // Card is fully arrived and active (open on right side, centered)
    if (progress >= 1) {
      return {
        position: 'fixed',
        left: `${rightXPercent}%`,
        right: 'auto',
        top: `${OPEN_Y}vh`,
        transform: `translate(-50%, -50%)`,
        opacity: 1,
        transition: 'opacity 0.3s ease',
        pointerEvents: 'auto',
        zIndex: 150,
      };
    }
    
    // Card is animating in from entity center → right center position
    const easedProgress = 1 - Math.pow(1 - progress, 2);
    
    const currentX = entityCenterX + (rightXPercent - entityCenterX) * easedProgress;
    const currentY = entityCenterY + (OPEN_Y - entityCenterY) * easedProgress;
    const scale = 0.1 + 0.9 * easedProgress;
    const opacity = Math.min(1, progress * 2);
    
    return {
      position: 'fixed',
      left: `${currentX}%`,
      right: 'auto',
      top: `${currentY}vh`,
      transform: `translate(-50%, -50%) scale(${scale})`,
      opacity,
      transition: 'none',
      pointerEvents: progress > 0.9 ? 'auto' : 'none',
      zIndex: 150,
    };
  }, [layerIndex, animProgress, gatherProgress, staircaseStep, isSaved, savePhase, moveProgress]);

  // Compute layer-aware level config
  const computedLevelConfig = useMemo(() => {
    const baseConfig = LEVEL_CONFIGS[assessmentLevel];
    if (!baseConfig) return {};

    // Beginner: timer only on the first layer (layer 0)
    if (assessmentLevel === 'quick') {
      return {
        ...baseConfig,
        hasTimer: layerIndex === 0,
      };
    }
    // Gevorderd: restrictions only on the last layer (layer 4)
    if (assessmentLevel === 'standard') {
      if (layerIndex === 4) {
        return { ...baseConfig, hasTimer: true };
      }
      return {
        ...baseConfig,
        hasTimer: false,
        allowBacktrack: true,
        allowQuestionJump: true,
      };
    }
    // Leerling: full restrictions on every layer
    return { ...baseConfig, hasTimer: true };
  }, [assessmentLevel, layerIndex]);

  // Answer selection handler - stores selections (no auto-advance)
  const handleAnswerSelect = useCallback((questionId, answerId) => {
    if (isSaved) return;
    
    onAnswerSelect(layerIndex, questionId, answerId);
  }, [layerIndex, isSaved, onAnswerSelect]);

  // Go back one question
  const handleGoBack = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      currentQuestionIndexRef.current = currentQuestionIndex - 1;
    }
  }, [currentQuestionIndex]);

  // Go to next question
  const handleNext = useCallback(() => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      currentQuestionIndexRef.current = currentQuestionIndex + 1;
    }
  }, [currentQuestionIndex, totalQuestions]);

  // Don't render if layer hasn't started animating (except layer 0 and saved layers)
  // Saved layers must ALWAYS render regardless of scroll position
  if (layerIndex > 0 && animProgress === 0 && !isSaved) return null;

  // Guard: don't render if layer data is missing
  if (!layer) return null;

  const panelStyles = getPanelStyles();

  // Build subject object matching what AssessmentCard expects
  const currentSubject = {
    name: t(`layerNames.${layer.nameKey}`) !== `layerNames.${layer.nameKey}` 
      ? t(`layerNames.${layer.nameKey}`) 
      : layer.nameKey,
    color: layer.color,
  };

  // Breakpoint-aware card wrapper width
  const lps = getLayerPanelSizes(windowWidth);
  const cardWrapperWidth = lps.cardWrapperWidth;
  const cardMaxWidth = lps.cardMaxWidth;

  return (
    <div 
      className="z-[150]"
      style={{ ...panelStyles, width: cardWrapperWidth, maxWidth: cardMaxWidth }}
    >
      <AssessmentCard
        key={`${layerIndex}-${assessmentLevel}`}
        questions={questions}
        currentSubject={currentSubject}
        currentSubjectIndex={layerIndex}
        currentQuestionIndex={currentQuestionIndex}
        totalQuestions={totalQuestions}
        answeredCount={answeredCount}
        onSelectAnswer={(questionId, answerId) => {
          handleAnswerSelect(questionId, answerId);
        }}
        onGoBack={computedLevelConfig.allowBacktrack !== false ? handleGoBack : undefined}
        canGoBack={computedLevelConfig.allowBacktrack !== false && currentQuestionIndex > 0}
        onNext={handleNext}
        onComplete={onSave}
        onJumpTo={computedLevelConfig.allowQuestionJump !== false ? (idx) => {
          setCurrentQuestionIndex(idx);
          currentQuestionIndexRef.current = idx;
        } : undefined}
        allAnswers={answers}
        levelConfig={computedLevelConfig}
      />
    </div>
  );
};

// Main Component - renders all visible layer panels
const AssessmentLayerPanel = ({ 
  currentLayerIndex = 0,
  scrollProgress = 0,
  onLayerComplete,
  onScrollEnabled,
  onAllLayersComplete, // Callback when layer 4 is saved - triggers convergence
  onLayerAnimationStateChange, // Callback to notify App.js when any layer is animating
  gatherProgress = 0,    // 0-1 progress within current staircase step
  convergenceProgress = 0, // 0-1 progress for assembled pyramid floating to entity
  staircaseStep = -1,      // -1=waiting, 0-3=current staircase step, 4=fully assembled
  isVisible = true,
  assessmentLevel,
  liveSubjects = [],
}) => {
  // Store answers for ALL layers persistently
  const [allLayerAnswers, setAllLayerAnswers] = useState({});
  const [savedLayers, setSavedLayers] = useState([]);

  // Handle answer selection for any layer — stores dual-pick arrays [firstPick, secondPick]
  const handleAnswerSelect = useCallback((layerIndex, questionId, selections) => {
    const picks = Array.isArray(selections) ? selections : (selections ? [selections] : []);
    if (picks.length === 0) {
      // Deselection — remove this question's answer
      setAllLayerAnswers(prev => {
        const layerData = { ...(prev[layerIndex] || {}) };
        delete layerData[questionId];
        return { ...prev, [layerIndex]: layerData };
      });
      return;
    }
    setAllLayerAnswers(prev => ({
      ...prev,
      [layerIndex]: {
        ...(prev[layerIndex] || {}),
        [questionId]: picks  // array: [firstPick] or [firstPick, secondPick]
      }
    }));
  }, []);

  // Handle save for a specific layer
  const handleSave = useCallback((layerIndex) => {
    // Guard: prevent double-save for the same layer
    if (savedLayers.includes(layerIndex)) {
      console.log(`[SAVE] handleSave layer=${layerIndex} SKIPPED — already saved`);
      return;
    }
    const layerAnswers = allLayerAnswers[layerIndex] || {};
    onLayerComplete?.(layerIndex, layerAnswers);
    setSavedLayers(prev => [...prev, layerIndex]);
    
    // If this is the last layer (index 4), trigger convergence
    if (layerIndex === 4) {
      onAllLayersComplete?.(allLayerAnswers);
    } else {
      // Mark layer as animating — scroll stays disabled.
      // When animation completes, App.js will advance to next layer + enable scroll.
      console.log(`[SAVE] handleSave layer=${layerIndex}, marking animating`);
      onLayerAnimationStateChange?.(layerIndex, true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allLayerAnswers, savedLayers, onLayerComplete, onScrollEnabled, onAllLayersComplete, onLayerAnimationStateChange]);

  if (!isVisible) return null;
  
  // Hide panels once cards are absorbed into pyramid layers (fold is handled in 3D)
  if (staircaseStep >= 1) return null;
  // Fallback: hide when convergence is fully done
  if (convergenceProgress >= 1) return null;

  // Determine which layers to render:
  // - All saved layers (they persist as collapsed cards)
  // - Current layer (the active layer being worked on)
  // - Any layer whose scroll animation range has begun (so it animates in from entity)
  //   Layer N starts animating at scrollProgress > N/5
  const layersToRender = new Set([...savedLayers, currentLayerIndex]);
  for (let i = 0; i <= 4; i++) {
    const rangeStart = i / 5;
    if (scrollProgress > rangeStart) {
      layersToRender.add(i);
    }
  }

  return (
    <>
      {Array.from(layersToRender).sort((a, b) => a - b).filter(i => LAYERS[i]).map(layerIndex => (
        <SingleLayerPanel
          key={layerIndex}
          layerIndex={layerIndex}
          layer={LAYERS[layerIndex]}
          layerQuestions={liveSubjects[layerIndex]?.questions ?? []}
          answers={allLayerAnswers[layerIndex] || {}}
          onAnswerSelect={handleAnswerSelect}
          isSaved={savedLayers.includes(layerIndex)}
          scrollProgress={scrollProgress}
          onSave={() => handleSave(layerIndex)}
          onLayerAnimationStateChange={onLayerAnimationStateChange}
          gatherProgress={gatherProgress}
          staircaseStep={staircaseStep}
          assessmentLevel={assessmentLevel}
        />
      ))}
    </>
  );
};

export default AssessmentLayerPanel;
