import React, { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Check, Lock, Sparkles } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

/**
 * AssessmentLabel - Enhanced HoloLabel with full assessment integration
 * Replaces the simple input with a question-based assessment flow
 */
const AssessmentLabel = ({ 
    layerIndex = 0, 
    layerData = null,
    questions = [],
    onComplete = () => {},
    showButton = true, 
    isLast = false,
    alignment = 'right',
    onSend = () => {},
    isSent = false,
    isLocked = false,
    layerResponses = [],
    onAnswerSelect = () => {},
}) => {
  const isRight = alignment === 'right';
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useLanguage();
  
  // Default layer data if not provided
  const layer = layerData || {
    name: `Layer ${layerIndex + 1}`,
    title: 'LAYER TITLE',
    subtitle: 'Layer Subtitle',
    color: '#22d3ee',
    description: 'Layer description...',
    fundamental: 'Key Principle'
  };
  
  const layerQuestions = questions.filter(q => 
    q.id > layerIndex * 6 && q.id <= (layerIndex + 1) * 6
  );
  
  const currentQuestion = layerQuestions[currentQuestionIndex];
  const answeredCount = layerResponses.length;
  const isLayerComplete = answeredCount >= layerQuestions.length;
  const progress = layerQuestions.length > 0 ? (answeredCount / layerQuestions.length) * 100 : 0;

  const handleAnswerClick = useCallback((answerId) => {
    if (!currentQuestion || isLocked) return;
    
    onAnswerSelect(currentQuestion.id, answerId);
    
    // Auto-advance to next question
    if (currentQuestionIndex < layerQuestions.length - 1) {
      setTimeout(() => setCurrentQuestionIndex(prev => prev + 1), 300);
    } else {
      // Layer complete
      setTimeout(() => {
        onComplete(layerIndex);
        if (isLast) {
          onSend();
        }
      }, 500);
    }
  }, [currentQuestion, currentQuestionIndex, layerQuestions.length, isLocked, onAnswerSelect, onComplete, layerIndex, isLast, onSend]);

  const goToPrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < layerQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  // Check if current question is already answered
  const currentAnswer = layerResponses.find(r => r.questionId === currentQuestion?.id);

  return (
    <div className={`select-none flex items-center ${isRight ? 'flex-row' : 'flex-row-reverse'} group`}>
      {/* Connecting Line */}
      <div 
        className="opacity-70 shadow-[0_0_10px_rgba(34,211,238,0.8)] transition-all duration-300" 
        style={{
          width: isExpanded ? 'clamp(2.8rem, 5.6vw, 5.6rem)' : 'clamp(5.6rem, 14vw, 11.2rem)', 
          height: '0.35rem',
          backgroundColor: layer.color,
          marginRight: isRight ? 0 : undefined,
          marginLeft: !isRight ? 0 : undefined,
          transformOrigin: isRight ? 'left' : 'right'
        }}
      />
      
      {/* Main Card */}
      <div 
        className={`relative backdrop-blur-md rounded-sm shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all duration-500 ${isRight ? 'text-left' : 'text-right'}`} 
        style={{
          padding: 'clamp(2.1rem, 4.2vw, 3.5rem)',
          width: isExpanded ? 'clamp(56rem, 85vw, 89.6rem)' : 'clamp(42rem, 70vw, 70rem)',
          maxHeight: isExpanded ? '80vh' : 'auto',
          background: 'rgba(15, 7, 22, 0.95)',
          border: `1px solid ${layer.color}50`,
          overflowY: isExpanded ? 'auto' : 'visible'
        }}
      >
        
        {/* Corner Accents */}
        <div className="absolute top-0 left-0 border-t-2 border-l-2" style={{width: 'clamp(1.4rem, 2.8vw, 2.8rem)', height: 'clamp(1.4rem, 2.8vw, 2.8rem)', borderColor: layer.color}}></div>
        <div className="absolute top-0 right-0 border-t-2 border-r-2" style={{width: 'clamp(1.4rem, 2.8vw, 2.8rem)', height: 'clamp(1.4rem, 2.8vw, 2.8rem)', borderColor: layer.color}}></div>
        <div className="absolute bottom-0 left-0 border-b-2 border-l-2" style={{width: 'clamp(1.4rem, 2.8vw, 2.8rem)', height: 'clamp(1.4rem, 2.8vw, 2.8rem)', borderColor: layer.color}}></div>
        <div className="absolute bottom-0 right-0 border-b-2 border-r-2" style={{width: 'clamp(1.4rem, 2.8vw, 2.8rem)', height: 'clamp(1.4rem, 2.8vw, 2.8rem)', borderColor: layer.color}}></div>

        {/* Header */}
        <div 
          className={`flex items-center border-b ${isRight ? 'justify-between' : 'flex-row-reverse justify-between'}`} 
          style={{
            marginBottom: 'clamp(1.4rem, 2.8vw, 2.1rem)', 
            paddingBottom: 'clamp(0.7rem, 1.4vw, 1.4rem)',
            borderColor: `${layer.color}30`
          }}
        >
          <div className="flex flex-col">
            <span className="font-bold tracking-widest uppercase" style={{fontSize: 'max(28px, 1.26vw)', color: layer.color}}>
              {layer.name.toUpperCase()} {'//'} {layer.fundamental}
            </span>
            <span className="text-white/80 font-light" style={{fontSize: 'max(31px, 1.4vw)'}}>
              {layer.title}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isLocked ? (
              <Lock className="w-8 h-8 text-orange-400" />
            ) : isLayerComplete ? (
              <Check className="w-8 h-8 text-green-400" />
            ) : (
              <Sparkles className="w-8 h-8 animate-pulse" style={{color: layer.color}} />
            )}
            <span className="animate-pulse" style={{fontSize: 'max(31px, 1.4vw)', color: isSent ? '#fbbf24' : isLayerComplete ? '#22c55e' : isLocked ? '#9ca3af' : '#f97316'}}>
              ● {isSent ? t('assessmentLabel.transmitted') : isLayerComplete ? t('assessmentLabel.complete') : isLocked ? t('assessmentLabel.locked') : showButton ? t('assessmentLabel.active') : t('assessmentLabel.standby')}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, backgroundColor: layer.color }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs font-mono text-slate-500">
            <span>{answeredCount}/{layerQuestions.length} COMPLETE</span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Content Area */}
        {!isExpanded ? (
          /* Collapsed View - Summary */
          <div className="space-y-6">
            <p className="text-slate-400 leading-relaxed" style={{fontSize: 'max(28px, 1.26vw)'}}>
              {layer.description}
            </p>
            
            {showButton && !isLocked && !isLayerComplete && (
              <button 
                onClick={() => setIsExpanded(true)}
                className="w-full font-mono tracking-wider uppercase transition-colors duration-200 flex items-center cursor-pointer"
                style={{
                  marginTop: 'clamp(1.4rem, 2.8vw, 2.1rem)', 
                  padding: 'clamp(1.12rem, 1.96vw, 1.68rem) clamp(1.68rem, 3.36vw, 2.8rem)',
                  gap: 'clamp(0.84rem, 1.4vw, 1.4rem)', 
                  fontSize: 'max(28px, 1.26vw)',
                  backgroundColor: `${layer.color}20`,
                  border: `1px solid ${layer.color}40`,
                  color: layer.color,
                  justifyContent: isRight ? 'flex-start' : 'flex-end',
                  flexDirection: isRight ? 'row' : 'row-reverse'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${layer.color}30`;
                  e.currentTarget.style.borderColor = layer.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = `${layer.color}20`;
                  e.currentTarget.style.borderColor = `${layer.color}40`;
                }}
              >
                <span>{t('assessmentLabel.beginAssessment')}</span>
                <ChevronRight className="w-8 h-8" />
              </button>
            )}
            
            {isLayerComplete && !isSent && (
              <div 
                className="w-full font-mono text-center border"
                style={{
                  marginTop: 'clamp(1.4rem, 2.8vw, 2.1rem)', 
                  padding: 'clamp(0.84rem, 1.4vw, 1.4rem)', 
                  fontSize: 'max(28px, 1.26vw)',
                  borderColor: '#22c55e40',
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                  color: '#22c55e'
                }}
              >
                {t('assessmentLabel.layerAssessmentComplete')}
              </div>
            )}
            
            {isSent && (
              <div 
                className="w-full font-mono text-center border"
                style={{
                  marginTop: 'clamp(1.4rem, 2.8vw, 2.1rem)', 
                  padding: 'clamp(0.84rem, 1.4vw, 1.4rem)', 
                  fontSize: 'max(28px, 1.26vw)',
                  borderColor: '#fbbf2440',
                  backgroundColor: 'rgba(251, 191, 36, 0.1)',
                  color: '#fbbf24'
                }}
              >
                {t('assessmentLabel.coreResonanceActive')}
              </div>
            )}
          </div>
        ) : (
          /* Expanded View - Question Interface */
          <div className="space-y-8">
            {currentQuestion && (
              <>
                {/* Question Navigation */}
                <div className="flex items-center justify-between mb-6">
                  <button 
                    onClick={goToPrevQuestion}
                    disabled={currentQuestionIndex === 0}
                    className="p-3 rounded transition-colors disabled:opacity-30"
                    style={{ color: layer.color }}
                  >
                    <ChevronLeft className="w-8 h-8" />
                  </button>
                  <span className="text-slate-400 text-base font-mono">
                    Q{currentQuestionIndex + 1}/{layerQuestions.length}
                  </span>
                  <button 
                    onClick={goToNextQuestion}
                    disabled={currentQuestionIndex >= layerQuestions.length - 1}
                    className="p-3 rounded transition-colors disabled:opacity-30"
                    style={{ color: layer.color }}
                  >
                    <ChevronRight className="w-8 h-8" />
                  </button>
                </div>

                {/* Domain Tag */}
                <div 
                  className="inline-block px-6 py-2 rounded text-base font-mono uppercase tracking-wider mb-6"
                  style={{
                    backgroundColor: `${layer.color}20`,
                    color: layer.color,
                    border: `1px solid ${layer.color}40`
                  }}
                >
                  {currentQuestion.domain}
                </div>

                {/* Question Text */}
                <p className="text-white/90 leading-relaxed" style={{fontSize: 'max(31px, 1.4vw)'}}>
                  {currentQuestion.text}
                </p>

                {/* Answer Options */}
                <div className="space-y-6 mt-8">
                  {currentQuestion.answers.map((answer, idx) => {
                    const isSelected = currentAnswer?.answerId === answer.id;
                    return (
                      <button
                        key={answer.id}
                        onClick={() => handleAnswerClick(answer.id)}
                        disabled={isLocked}
                        className={`w-full text-left p-6 rounded transition-all duration-200 border ${isRight ? '' : 'text-right'}`}
                        style={{
                          backgroundColor: isSelected ? `${layer.color}30` : 'rgba(30, 20, 40, 0.6)',
                          borderColor: isSelected ? layer.color : `${layer.color}20`,
                          opacity: isLocked ? 0.5 : 1
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected && !isLocked) {
                            e.currentTarget.style.borderColor = `${layer.color}60`;
                            e.currentTarget.style.backgroundColor = `${layer.color}15`;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = `${layer.color}20`;
                            e.currentTarget.style.backgroundColor = 'rgba(30, 20, 40, 0.6)';
                          }
                        }}
                      >
                        <div className={`flex items-start gap-6 ${isRight ? '' : 'flex-row-reverse'}`}>
                          <span 
                            className="flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-base font-mono"
                            style={{
                              backgroundColor: isSelected ? layer.color : `${layer.color}20`,
                              color: isSelected ? '#050510' : layer.color,
                              border: `1px solid ${layer.color}40`
                            }}
                          >
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="text-slate-300 text-sm leading-relaxed flex-1">
                            {answer.text}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Collapse Button */}
                <button
                  onClick={() => setIsExpanded(false)}
                  className="w-full mt-8 py-3 text-base font-mono text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {t('assessmentLabel.collapse')}
                </button>
              </>
            )}
          </div>
        )}

        {/* Glowing Background Effect */}
        <div className="absolute inset-0 z-[-1] animate-pulse" style={{backgroundColor: `${layer.color}05`}}></div>
      </div>
    </div>
  );
};

export default AssessmentLabel;
