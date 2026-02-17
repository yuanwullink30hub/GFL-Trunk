import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import AssessmentCard from './AssessmentCard';

/**
 * AssessmentLayerPanel - Renders MULTIPLE layer panels that persist after saving
 * Now uses the new AssessmentCard component for each layer's question UI
 * 
 * Animation flow:
 * 1. Layer 0 (Foundation) - appears on RIGHT side
 * 2. When all 12 questions answered → Save button appears in AssessmentCard
 * 3. Click Save → card collapses, shows "SCROLL"
 * 4. User scrolls → next pyramid layer floats down from entity
 * 5. Layer 1 floats to LEFT, Layer 2 to RIGHT, Layer 3 to LEFT, Layer 4 to RIGHT
 * 6. All saved panels remain visible on screen (collapsed)
 * 7. When layer 4 is saved → all panels float back to entity center (convergence)
 * 8. After convergence → results modal floats out from entity
 */

// Layer configuration matching pyramid (bottom to top)
const LAYERS = [
  { nameKey: "foundation", color: "#22c55e", descKey: "foundation" },
  { nameKey: "emotional", color: "#3b82f6", descKey: "emotional" },
  { nameKey: "mental", color: "#a855f7", descKey: "mental" },
  { nameKey: "spiritual", color: "#ef4444", descKey: "spiritual" },
  { nameKey: "unity", color: "#f97316", descKey: "unity" },
];

const QUESTIONS_PER_LAYER = 12;

// Standard answer options for layer questions
const STANDARD_ANSWERS = [
  { id: 'strongly_agree', text: 'Strongly Agree', value: 6 },
  { id: 'agree', text: 'Agree', value: 5 },
  { id: 'neutral', text: 'Neutral', value: 4 },
  { id: 'disagree', text: 'Disagree', value: 3 },
  { id: 'strongly_disagree', text: 'Strongly Disagree', value: 2 },
  { id: 'no_opinion', text: 'No Opinion', value: 1 },
];

// Generate questions for each layer
const generateLayerQuestions = (layerIndex) => {
  const layerName = LAYERS[layerIndex]?.nameKey || 'unknown';
  return Array.from({ length: QUESTIONS_PER_LAYER }, (_, i) => ({
    id: `layer${layerIndex}_q${i + 1}`,
    text: `${layerName.charAt(0).toUpperCase() + layerName.slice(1)} Question ${i + 1}`,
    domain: layerName,
    answers: STANDARD_ANSWERS
  }));
};

// Vertical positions for each layer panel (vh from top)
// Follow the pyramid upward trail: bottom layer lowest on screen, top layer highest
const LAYER_POSITIONS = [
  68, // Foundation (bottom) - low on screen
  58, // Emotional
  48, // Mental - center
  38, // Spiritual
  28, // Unity (top) - high on screen
];

// Rotation angles - keep cards straight (no tilt)
const LAYER_ROTATIONS = [
  0,   // Foundation (right)
  0,   // Emotional (left)
  0,   // Mental (right)
  0,   // Spiritual (left)
  0,   // Unity (right)
];

// Determine if layer goes to left or right side
// Layer 0: right, 1: left, 2: right, 3: left, 4: right
const isLayerOnRight = (layerIndex) => layerIndex % 2 === 0;

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
  
  const questions = useMemo(() => generateLayerQuestions(layerIndex), [layerIndex]);
  const totalQuestions = QUESTIONS_PER_LAYER;
  
  const answeredCount = questions.filter(q => answers[q.id] !== undefined).length;
  
  // Calculate animation progress for this layer
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
  
  // Get panel position and style - includes convergence animation
  const getPanelStyles = useCallback(() => {
    const progress = animProgress;
    const isFirstLayer = layerIndex === 0;
    const onRight = isLayerOnRight(layerIndex);
    
    const entityCenterX = 50;
    const entityCenterY = 35;
    const finalY = LAYER_POSITIONS[layerIndex];
    const finalXPercent = onRight ? 60 : 40;
    const rotation = LAYER_ROTATIONS[layerIndex] || 0;
    
    // During convergence, animate from final position back to entity center
    if (convergenceProgress > 0) {
      const eased = 1 - Math.pow(1 - convergenceProgress, 2);
      const currentX = finalXPercent + (entityCenterX - finalXPercent) * eased;
      const currentY = finalY + (entityCenterY - finalY) * eased;
      const scale = 1 - 0.9 * eased;
      const opacity = 1 - eased;
      const currentRotation = rotation * (1 - eased);
      
      return {
        position: 'fixed',
        left: `${currentX}%`,
        right: 'auto',
        top: `${currentY}vh`,
        transform: `translate(-50%, -50%) scale(${scale}) rotate(${currentRotation}deg)`,
        opacity,
        transition: 'none',
        pointerEvents: 'none',
      };
    }
    
    if (isFirstLayer || progress >= 1) {
      return {
        position: 'fixed',
        ...(onRight 
          ? { right: '7rem', left: 'auto' } 
          : { left: '7rem', right: 'auto' }),
        top: `${finalY}vh`,
        transform: `translateY(-50%) rotate(${rotation}deg)`,
        opacity: 1,
        transition: 'opacity 0.3s ease',
        pointerEvents: 'auto',
      };
    }
    
    const currentX = entityCenterX + (finalXPercent - entityCenterX) * progress;
    const currentY = entityCenterY + (finalY - entityCenterY) * progress;
    const scale = 0.1 + 0.9 * progress;
    const opacity = progress;
    const currentRotation = rotation * progress;
    
    return {
      position: 'fixed',
      left: `${currentX}%`,
      right: 'auto',
      top: `${currentY}vh`,
      transform: `translate(-50%, -50%) scale(${scale}) rotate(${currentRotation}deg)`,
      opacity,
      transition: 'none',
      pointerEvents: progress > 0.9 ? 'auto' : 'none',
    };
  }, [layerIndex, animProgress, convergenceProgress]);

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
  // - All saved layers (they persist)
  // - Current layer (active layer being worked on)
  const layersToRender = new Set([...savedLayers, currentLayerIndex]);

  return (
    <>
      {Array.from(layersToRender).sort((a, b) => a - b).map(layerIndex => (
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
