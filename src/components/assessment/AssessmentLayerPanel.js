import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

/**
 * AssessmentLayerPanel - Renders MULTIPLE layer panels that persist after saving
 * 
 * Animation flow:
 * 1. Layer 0 (Foundation) - appears on RIGHT side
 * 2. When all questions answered → Save button appears
 * 3. Click Save → button text changes to "SCROLL", panel stays visible
 * 4. User scrolls → next pyramid layer floats down from entity
 * 5. Layer 1 floats to LEFT, Layer 2 to RIGHT, Layer 3 to LEFT, Layer 4 to RIGHT
 * 6. All saved panels remain visible on screen
 * 7. When layer 4 is saved → all panels float back to entity center (convergence)
 * 8. After convergence → results modal floats out from entity
 */

// Layer configuration matching pyramid (bottom to top) - Updated colors
const LAYERS = [
  { nameKey: "foundation", color: "#22c55e", descKey: "foundation" },
  { nameKey: "emotional", color: "#3b82f6", descKey: "emotional" },
  { nameKey: "mental", color: "#a855f7", descKey: "mental" },
  { nameKey: "spiritual", color: "#ef4444", descKey: "spiritual" },
  { nameKey: "unity", color: "#f97316", descKey: "unity" },
];

const QUESTIONS_PER_LAYER = 18;
const ANSWER_OPTIONS = ['A', 'B', 'C', 'D', '0'];

// Generate questions for each layer (filler text for now)
const generateLayerQuestions = (layerIndex) => {
  return Array.from({ length: QUESTIONS_PER_LAYER }, (_, i) => ({
    id: `layer${layerIndex}_q${i + 1}`,
    text: `Question ${i + 1}`,
    answers: ANSWER_OPTIONS.map(opt => ({
      id: opt,
      text: `Answer ${opt}`,
      value: opt
    }))
  }));
};

// Vertical positions for each layer panel (vh from top)
const LAYER_POSITIONS = [
  72, // Foundation - bottom
  60, // Emotional
  48, // Mental - middle
  36, // Spiritual
  24, // Unity - top
];

// Determine if layer goes to left or right side
const isLayerOnRight = (layerIndex) => layerIndex % 2 === 0;

// Single Layer Panel Component - renders one layer's panel
const SingleLayerPanel = ({
  layerIndex,
  layer,
  answers,
  onAnswerSelect,
  isSaved,
  isCurrentLayer,
  scrollProgress,
  onSave,
  convergenceProgress = 0, // 0-1 progress for floating back to entity center
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const { t } = useLanguage();
  
  const questions = useMemo(() => generateLayerQuestions(layerIndex), [layerIndex]);
  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = QUESTIONS_PER_LAYER;
  
  const allAnswered = questions.every(q => answers[q.id] !== undefined);
  
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
    const finalXPercent = onRight ? 85 : 15;
    
    // During convergence, animate from final position back to entity center
    if (convergenceProgress > 0) {
      // Ease the convergence (smooth deceleration)
      const eased = 1 - Math.pow(1 - convergenceProgress, 2);
      
      // Interpolate from final position to entity center
      const currentX = finalXPercent + (entityCenterX - finalXPercent) * eased;
      const currentY = finalY + (entityCenterY - finalY) * eased;
      const scale = 1 - 0.9 * eased; // Shrink to 0.1
      const opacity = 1 - eased; // Fade out
      
      return {
        position: 'fixed',
        left: `${currentX}%`,
        right: 'auto',
        top: `${currentY}vh`,
        transform: `translate(-50%, -50%) scale(${scale})`,
        opacity,
        transition: 'none',
        pointerEvents: 'none',
      };
    }
    
    if (isFirstLayer || progress >= 1) {
      return {
        position: 'fixed',
        ...(onRight ? { right: '2rem', left: 'auto' } : { left: '2rem', right: 'auto' }),
        top: `${finalY}vh`,
        transform: 'translateY(-50%)',
        opacity: 1,
        transition: 'opacity 0.3s ease',
        pointerEvents: 'auto',
      };
    }
    
    const currentX = entityCenterX + (finalXPercent - entityCenterX) * progress;
    const currentY = entityCenterY + (finalY - entityCenterY) * progress;
    const scale = 0.1 + 0.9 * progress;
    const opacity = progress;
    
    return {
      position: 'fixed',
      left: `${currentX}%`,
      right: 'auto',
      top: `${currentY}vh`,
      transform: `translate(-50%, -50%) scale(${scale})`,
      opacity,
      transition: 'none',
      pointerEvents: progress > 0.9 ? 'auto' : 'none',
    };
  }, [layerIndex, animProgress, convergenceProgress]);
  
  // Navigation handlers
  const goToPrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  }, [currentQuestionIndex]);

  const goToNext = useCallback(() => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  }, [currentQuestionIndex, totalQuestions]);

  // Answer selection handler
  const handleAnswerSelect = useCallback((questionId, answerId) => {
    if (isSaved) return; // Can't change saved answers
    
    onAnswerSelect(layerIndex, questionId, answerId);
    
    if (currentQuestionIndex < totalQuestions - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1);
      }, 300);
    }
  }, [layerIndex, isSaved, onAnswerSelect, currentQuestionIndex, totalQuestions]);

  // Don't render if layer hasn't started animating (except layer 0)
  if (layerIndex > 0 && animProgress === 0) return null;

  const panelStyles = getPanelStyles();

  return (
    <div 
      className="w-72 z-[150]"
      style={panelStyles}
    >
      {/* Panel Container - SectorFrame style */}
      <div 
        className="relative rounded-lg backdrop-blur-sm"
        style={{ backgroundColor: 'rgba(8, 2, 12, 0.95)' }}
      >
        {/* Corner Borders */}
        <div className="absolute -top-0.5 -left-0.5 w-4 h-4" style={{
          border: '1.5px solid #ffae00',
          borderRadius: '10px 0 0 0',
          borderBottom: 'none',
          borderRight: 'none'
        }}></div>
        <div className="absolute -top-0.5 -right-0.5 w-4 h-4" style={{
          border: '1.5px solid #ffae00',
          borderRadius: '0 10px 0 0',
          borderBottom: 'none',
          borderLeft: 'none'
        }}></div>
        <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4" style={{
          border: '1.5px solid #ffae00',
          borderRadius: '0 0 0 10px',
          borderTop: 'none',
          borderRight: 'none'
        }}></div>
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4" style={{
          border: '1.5px solid #ffae00',
          borderRadius: '0 0 10px 0',
          borderTop: 'none',
          borderLeft: 'none'
        }}></div>

        {/* Content */}
        <div className="relative z-10 p-4">
          {/* Header with Layer Subject */}
          <div 
            className="text-center py-2 px-4 rounded mb-3"
            style={{ 
              backgroundColor: `${layer.color}15`,
              borderBottom: `2px solid ${layer.color}`
            }}
          >
            <h3 
              className="text-base font-bold tracking-wider uppercase"
              style={{ color: layer.color }}
            >
              {t(`layerNames.${layer.nameKey}`)}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{t(`assessmentIntro.layers.${layer.descKey}.desc`)}</p>
          </div>

          {/* Navigation Header */}
          <div className="flex items-center justify-between mb-3">
            {/* Left Arrow */}
            <button
              onClick={goToPrevious}
              disabled={currentQuestionIndex === 0}
              className={`p-1.5 rounded transition-all ${
                currentQuestionIndex === 0 
                  ? 'opacity-30 cursor-not-allowed' 
                  : 'hover:bg-slate-800 opacity-100'
              }`}
              style={{ color: layer.color }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Question Counter */}
            <div className="text-center">
              <span 
                className="text-lg font-mono font-bold"
                style={{ color: layer.color }}
              >
                {currentQuestionIndex + 1}
              </span>
              <span className="text-slate-500 mx-1">/</span>
              <span className="text-slate-400 font-mono text-sm">{totalQuestions}</span>
            </div>

            {/* Right Arrow */}
            <button
              onClick={goToNext}
              disabled={currentQuestionIndex === totalQuestions - 1}
              className={`p-1.5 rounded transition-all ${
                currentQuestionIndex === totalQuestions - 1 
                  ? 'opacity-30 cursor-not-allowed' 
                  : 'hover:bg-slate-800 opacity-100'
              }`}
              style={{ color: layer.color }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Question Text */}
          <div className="mb-3 p-2.5 rounded bg-slate-900/50 border border-slate-800">
            <p className="text-white text-sm leading-relaxed">
              {currentQuestion?.text || t('assessmentLayerPanel.loading')}
            </p>
          </div>

          {/* Answer Options - Horizontal layout for A B C D 0 */}
          <div className="flex justify-center gap-1.5 mb-3">
            {currentQuestion?.answers.map((answer) => {
              const isSelected = answers[currentQuestion.id] === answer.id;
              return (
                <button
                  key={answer.id}
                  onClick={() => handleAnswerSelect(currentQuestion.id, answer.id)}
                  disabled={isSaved}
                  className={`
                    w-9 h-9 rounded-lg font-bold text-sm transition-all duration-200
                    flex items-center justify-center
                    ${isSelected ? 'scale-110' : 'hover:scale-105'}
                    ${isSaved ? 'cursor-default' : ''}
                  `}
                  style={{
                    backgroundColor: isSelected ? layer.color : 'rgba(30, 20, 40, 0.8)',
                    color: isSelected ? '#000' : layer.color,
                    border: `2px solid ${isSelected ? layer.color : `${layer.color}40`}`,
                    boxShadow: isSelected ? `0 0 15px ${layer.color}50` : 'none'
                  }}
                >
                  {answer.id}
                </button>
              );
            })}
          </div>

          {/* Progress Dots */}
          <div className="flex justify-center gap-0.5 mb-3 flex-wrap max-w-full px-1">
            {questions.map((q, idx) => (
              <div
                key={q.id}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                  idx === currentQuestionIndex ? 'scale-125' : ''
                }`}
                style={{
                  backgroundColor: answers[q.id] 
                    ? layer.color 
                    : idx === currentQuestionIndex 
                      ? `${layer.color}80` 
                      : 'rgba(100, 100, 100, 0.3)'
                }}
              />
            ))}
          </div>

          {/* Save / Scroll Button - shows when all answered */}
          {allAnswered && (
            <button
              onClick={!isSaved ? onSave : undefined}
              disabled={isSaved}
              className={`w-full py-2.5 rounded-lg font-bold uppercase tracking-wider transition-all duration-300 relative overflow-hidden text-sm ${
                isSaved ? 'cursor-default opacity-70' : ''
              }`}
              style={{
                backgroundColor: !isSaved ? layer.color : 'transparent',
                color: !isSaved ? '#000' : layer.color,
                border: `2px solid ${layer.color}`
              }}
            >
              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 opacity-50" style={{ borderColor: !isSaved ? '#000' : layer.color }}></div>
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 opacity-50" style={{ borderColor: !isSaved ? '#000' : layer.color }}></div>
              
              {!isSaved ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {t('assessmentLayerPanel.save')}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  {t('assessmentLayerPanel.scroll')}
                </span>
              )}
            </button>
          )}

          {/* Layer Progress Indicator */}
          <div className="mt-3 flex justify-center gap-1.5">
            {LAYERS.map((l, idx) => (
              <div
                key={l.nameKey}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  idx === layerIndex ? 'ring-2 ring-offset-1 ring-offset-transparent' : ''
                }`}
                style={{
                  backgroundColor: idx <= layerIndex ? l.color : 'rgba(100, 100, 100, 0.3)',
                  ringColor: idx === layerIndex ? l.color : 'transparent',
                  opacity: idx <= layerIndex ? 1 : 0.4
                }}
                title={l.nameKey}
              />
            ))}
          </div>
        </div>
      </div>
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
