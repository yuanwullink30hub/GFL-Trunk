import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import AssessmentCard from './AssessmentCard';
import { assessmentSubjects } from '../../pages/assessment/assessmentData';

/**
 * AssessmentLayerPanel - Renders MULTIPLE layer panels that persist after saving
 * Now uses the new AssessmentCard component for each layer's question UI
 * 
 * Animation flow (v3 — right-centered open, left pyramid stack):
 * 1. Every card opens at the SAME position: RIGHT side, vertically centered (50vh)
 * 2. When all 12 questions answered → Save button appears in AssessmentCard
 * 3. Click Save → Phase 1: card COLLAPSES in place (~900ms)
 *                → Phase 2: collapsed card slides to LEFT at its pyramid layer height (~1200ms)
 * 4. User scrolls → next card floats from entity to the same RIGHT center position
 * 5. Saved cards on the LEFT stack at pyramid layer heights (pyramid shape)
 * 6. When layer 4 is saved → all panels float back to entity center (convergence)
 */

// Layer configuration matching pyramid (bottom to top)
// Colors synced with assessmentData.js canonical source
const LAYERS = [
  { nameKey: "foundation", color: assessmentSubjects[0]?.color || "#22d3ee", descKey: "foundation" },
  { nameKey: "emotional", color: assessmentSubjects[1]?.color || "#a855f7", descKey: "emotional" },
  { nameKey: "mental", color: assessmentSubjects[2]?.color || "#f472b6", descKey: "mental" },
  { nameKey: "spiritual", color: assessmentSubjects[3]?.color || "#fbbf24", descKey: "spiritual" },
  { nameKey: "unity", color: assessmentSubjects[4]?.color || "#f97316", descKey: "unity" },
];

// Get real questions for each layer from assessmentData
const getLayerQuestions = (layerIndex) => {
  const layer = assessmentSubjects[layerIndex];
  if (!layer) return [];
  return layer.questions;
};

// Vertical positions for SAVED cards on the LEFT side (pyramid layer heights)
// Follow the pyramid upward trail: bottom layer lowest on screen, top layer highest
const SAVED_LAYER_POSITIONS = [
  68, // Foundation (bottom) - low on screen
  58, // Emotional
  48, // Mental - center
  38, // Spiritual
  28, // Unity (top) - high on screen
];

// All OPEN cards sit at the same vertical center on the RIGHT side
const OPEN_Y = 50; // vertically centered in viewport

// Scale factors for saved cards on the left side — smaller toward the top (pyramid shape)
const SAVED_SCALES = [
  0.60, // Foundation (bottom) — widest
  0.55, // Emotional
  0.50, // Mental
  0.45, // Spiritual
  0.40, // Unity (top) — narrowest
];

// Animation timing (ms)
const COLLAPSE_WAIT = 900;   // Wait for card collapse before moving
const MOVE_DURATION = 1200;  // Slide from right to left

// Single Layer Panel Component - wraps AssessmentCard with positioning logic
const SingleLayerPanel = ({
  layerIndex,
  layer,
  answers,
  onAnswerSelect,
  isSaved,
  isCurrentLayer,
  scrollProgress,
  onSave,
  convergenceProgress = 0,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const currentQuestionIndexRef = useRef(0);
  const { t } = useLanguage();
  
  // Track save animation: 'idle' → 'collapsing' → 'moving' → 'done'
  const [savePhase, setSavePhase] = useState('idle');
  // Move progress (0 = still on right, 1 = fully on left)
  const [moveProgress, setMoveProgress] = useState(0);
  const moveAnimRef = useRef(null);
  const collapseTimerRef = useRef(null);

  // Two-phase save animation:
  //   Phase 1: card collapses in place (COLLAPSE_WAIT ms)
  //   Phase 2: collapsed card slides from right to left (MOVE_DURATION ms)
  useEffect(() => {
    if (isSaved && savePhase === 'idle') {
      setSavePhase('collapsing');
      // Phase 1: wait for collapse animation to finish
      collapseTimerRef.current = setTimeout(() => {
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
  
  const questions = useMemo(() => getLayerQuestions(layerIndex), [layerIndex]);
  const totalQuestions = questions.length;
  
  const answeredCount = questions.filter(q => answers[q.id] !== undefined).length;
  
  // Calculate animation progress for this layer (scroll-based entry from entity)
  const getAnimationProgress = useCallback(() => {
    if (layerIndex === 0) return 1;
    
    const totalMovable = 4;
    const rangeStart = (layerIndex - 1) / totalMovable;
    const rangeEnd = layerIndex / totalMovable;
    
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
    const isFirstLayer = layerIndex === 0;
    
    const entityCenterX = 50;
    const entityCenterY = 28; // entity center in vh
    const savedY = SAVED_LAYER_POSITIONS[layerIndex]; // left-side pyramid Y
    
    // Compute RIGHT-side X position (where cards open — all at same Y)
    const vw = window.innerWidth;
    const remPx = 16;
    const edgeOffset = 11 * remPx; // 176px from edge
    const cardWidth = Math.min(480, vw * 0.45);
    const rightXPercent = ((vw - edgeOffset - cardWidth / 2) / vw) * 100;
    
    // Compute LEFT-side X position (where saved cards stack)
    const savedScale = SAVED_SCALES[layerIndex];
    const leftEdgeOffset = 6 * remPx;
    const leftXPercent = ((leftEdgeOffset + (cardWidth * savedScale) / 2) / vw) * 100;
    
    // During convergence, animate from current position back to entity center
    if (convergenceProgress > 0) {
      const isOnLeft = savePhase === 'done' || savePhase === 'moving';
      const currentBaseX = isOnLeft ? leftXPercent : rightXPercent;
      const currentBaseY = isOnLeft ? savedY : OPEN_Y;
      const currentBaseScale = isOnLeft ? savedScale : 1;
      const eased = 1 - Math.pow(1 - convergenceProgress, 2);
      const currentX = currentBaseX + (entityCenterX - currentBaseX) * eased;
      const currentY = currentBaseY + (entityCenterY - currentBaseY) * eased;
      const scale = currentBaseScale * (1 - 0.9 * eased);
      const opacity = 1 - eased;
      
      return {
        position: 'fixed',
        left: `${currentX}%`,
        right: 'auto',
        top: `${currentY}vh`,
        transform: `translate(-50%, -50%) scale(${scale})`,
        opacity,
        transition: 'none',
        pointerEvents: 'none',
        zIndex: isSaved ? 140 : 150,
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
    if (isFirstLayer || progress >= 1) {
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
  }, [layerIndex, animProgress, convergenceProgress, isSaved, savePhase, moveProgress]);

  // Answer selection handler - auto-advances to next question
  const handleAnswerSelect = useCallback((questionId, answerId) => {
    if (isSaved) return;
    
    onAnswerSelect(layerIndex, questionId, answerId);
    
    // Auto-advance handled by AssessmentCard internally via selectedAnswer state
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

  // Don't render if layer hasn't started animating (except layer 0)
  if (layerIndex > 0 && animProgress === 0) return null;

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

  return (
    <div 
      className="w-[480px] max-w-[45vw] z-[150]"
      style={panelStyles}
    >
      <AssessmentCard
        questions={questions}
        currentSubject={currentSubject}
        currentSubjectIndex={layerIndex}
        currentQuestionIndex={currentQuestionIndex}
        totalQuestions={totalQuestions}
        answeredCount={answeredCount}
        onSelectAnswer={(questionId, answerId) => {
          handleAnswerSelect(questionId, answerId);
          // Auto-advance after brief delay using ref for current index
          if (currentQuestionIndexRef.current < totalQuestions - 1) {
            const nextIndex = currentQuestionIndexRef.current + 1;
            setTimeout(() => {
              setCurrentQuestionIndex(nextIndex);
              currentQuestionIndexRef.current = nextIndex;
            }, 400);
          }
        }}
        onGoBack={handleGoBack}
        canGoBack={currentQuestionIndex > 0}
        onNext={handleNext}
        onComplete={onSave}
        onJumpTo={(idx) => {
          setCurrentQuestionIndex(idx);
          currentQuestionIndexRef.current = idx;
        }}
        allAnswers={answers}
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
  convergenceProgress = 0, // 0-1 progress for panels floating back to entity
  isVisible = true,
}) => {
  // Store answers for ALL layers persistently
  const [allLayerAnswers, setAllLayerAnswers] = useState({});
  const [savedLayers, setSavedLayers] = useState([]);

  // Handle answer selection for any layer
  const handleAnswerSelect = useCallback((layerIndex, questionId, answerId) => {
    setAllLayerAnswers(prev => ({
      ...prev,
      [layerIndex]: {
        ...(prev[layerIndex] || {}),
        [questionId]: answerId
      }
    }));
  }, []);

  // Handle save for a specific layer
  const handleSave = useCallback((layerIndex) => {
    const layerAnswers = allLayerAnswers[layerIndex] || {};
    onLayerComplete?.(layerIndex, layerAnswers);
    setSavedLayers(prev => [...prev, layerIndex]);
    
    // If this is the last layer (index 4), trigger convergence
    if (layerIndex === 4) {
      onAllLayersComplete?.(allLayerAnswers);
    } else {
      onScrollEnabled?.(true);
    }
  }, [allLayerAnswers, onLayerComplete, onScrollEnabled, onAllLayersComplete]);

  if (!isVisible) return null;
  
  // Hide panels once convergence is complete
  if (convergenceProgress >= 1) return null;

  // Determine which layers to render:
  // - All saved layers (they persist as collapsed cards)
  // - Current layer (the active layer being worked on)
  // - Any layer whose scroll animation range has begun (so it animates in from entity)
  //   Layer N (N>0) starts animating at scrollProgress > (N-1)/4
  const layersToRender = new Set([...savedLayers, currentLayerIndex]);
  for (let i = 1; i <= 4; i++) {
    const rangeStart = (i - 1) / 4;
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
          answers={allLayerAnswers[layerIndex] || {}}
          onAnswerSelect={handleAnswerSelect}
          isSaved={savedLayers.includes(layerIndex)}
          isCurrentLayer={layerIndex === currentLayerIndex}
          scrollProgress={scrollProgress}
          onSave={() => handleSave(layerIndex)}
          convergenceProgress={convergenceProgress}
        />
      ))}
    </>
  );
};

export default AssessmentLayerPanel;
