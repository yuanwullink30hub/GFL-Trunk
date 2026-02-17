import React from 'react';
import { ChevronLeft } from 'lucide-react';

function QuestionCard({
  question,
  subjectName,
  subjectColor,
  questionNumber,
  totalQuestions,
  onSelectAnswer,
  onGoBack,
  canGoBack,
}) {
  return (
    <div className="w-full max-w-3xl mx-auto animate-fadeIn">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="px-3 py-1 rounded text-xs font-mono uppercase tracking-wider"
              style={{
                backgroundColor: `${subjectColor}20`,
                color: subjectColor,
                border: `1px solid ${subjectColor}40`,
              }}
            >
              {subjectName}
            </div>
            <span className="text-slate-500 text-xs font-mono">
              Q{questionNumber}/{totalQuestions}
            </span>
          </div>
          {canGoBack && (
            <button
              onClick={onGoBack}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              BACK
            </button>
          )}
        </div>

        <h2 className="text-xl md:text-2xl font-light leading-relaxed text-white">
          {question.text}
        </h2>
      </div>

      <div className="space-y-3">
        {question.answers.map((answer, index) => (
          <button
            key={answer.id}
            onClick={() => onSelectAnswer(answer.id)}
            className="w-full text-left p-4 md:p-5 rounded-lg border transition-all duration-300 group relative overflow-hidden hover:scale-[1.02]"
            style={{
              backgroundColor: "rgba(15, 7, 22, 0.8)",
              borderColor: `${subjectColor}30`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = subjectColor;
              e.currentTarget.style.boxShadow = `0 0 20px ${subjectColor}30`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = `${subjectColor}30`;
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div
              className="absolute top-0 left-0 w-2 h-2 border-t border-l opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ borderColor: subjectColor }}
            />
            <div
              className="absolute bottom-0 right-0 w-2 h-2 border-b border-r opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ borderColor: subjectColor }}
            />

            <div className="relative z-10 flex items-start gap-4">
              <span
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono"
                style={{
                  backgroundColor: `${subjectColor}20`,
                  color: subjectColor,
                  border: `1px solid ${subjectColor}40`,
                }}
              >
                {String.fromCharCode(65 + index)}
              </span>
              <span className="text-sm md:text-base leading-relaxed text-slate-200 group-hover:text-white transition-colors">
                {answer.text}
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-6 flex justify-center">
        <span className="text-[10px] uppercase tracking-[0.3em] text-slate-600 font-mono">
          Domain: {question.domain}
        </span>
      </div>
    </div>
  );
}

export default QuestionCard;
