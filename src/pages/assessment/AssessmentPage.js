import React, { useState } from 'react';
import { useAssessment } from './useAssessment';
import IntroScreen from './components/IntroScreen';
import ProgressBar from './components/ProgressBar';
import QuestionCard from './components/QuestionCard';
import FileUpload from './components/FileUpload';
import ResultsView from './components/ResultsView';
import PyramidVisualizer from './components/PyramidVisualizer';
import { FileUp, Sparkles } from 'lucide-react';

function AssessmentPage() {
  const [appState, setAppState] = useState("intro"); // "intro" | "assessment" | "upload" | "results"
  const {
    subjects,
    questionsReady,
    questionsError,
    currentSubject,
    currentQuestion,
    currentSubjectIndex,
    currentQuestionIndex,
    progress,
    responses,
    uploadedFiles,
    selectAnswer,
    goBack,
    addFile,
    removeFile,
    calculateResults,
    reset,
    totalQuestions,
    answeredQuestions,
  } = useAssessment();

  const handleStart = () => setAppState("assessment");

  const handleAnswerSelect = (answerId) => {
    selectAnswer(answerId);
    const isLastQuestion =
      currentSubjectIndex === subjects.length - 1 &&
      currentQuestionIndex === currentSubject.questions.length - 1;
    if (isLastQuestion) setAppState("upload");
  };

  const handleContinueToResults = () => setAppState("results");

  const handleReset = () => {
    reset();
    setAppState("intro");
  };

  const currentQuestionNumber =
    subjects.slice(0, currentSubjectIndex).reduce((acc, s) => acc + s.questions.length, 0) +
    currentQuestionIndex +
    1;

  return (
    <main className="min-h-screen bg-[#050510] text-white relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-fuchsia-500/5 rounded-full blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(34, 211, 238, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 211, 238, 0.5) 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 p-4 md:p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-medium text-white">Garden for Life</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Consciousness Profile</p>
            </div>
          </div>
          {appState === "assessment" && (
            <div className="text-right">
              <p className="text-xs text-slate-400">Question {currentQuestionNumber} of {totalQuestions}</p>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <div className="relative z-10 px-4 md:px-6 pb-12">
        <div className="max-w-4xl mx-auto">
          {/* Loading / Error states */}
          {!questionsReady && !questionsError && (
            <div className="text-center py-24 animate-pulse">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-600/20 mb-4">
                <Sparkles className="w-8 h-8 text-cyan-400 animate-spin" />
              </div>
              <p className="text-slate-400 text-sm">Loading assessment...</p>
            </div>
          )}

          {questionsError && (
            <div className="text-center py-24">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-4">
                <Sparkles className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-lg font-medium text-red-300 mb-2">Assessment Unavailable</h2>
              <p className="text-slate-400 text-sm max-w-md mx-auto">{questionsError}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-6 px-5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 text-sm hover:bg-slate-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {questionsReady && !questionsError && appState === "intro" && <IntroScreen onStart={handleStart} />}

          {appState === "assessment" && (
            <div className="space-y-8 animate-fadeIn">
              <PyramidVisualizer activeLayer={currentSubjectIndex} progress={progress} />
              <ProgressBar progress={progress} currentSubject={currentSubjectIndex} totalSubjects={subjects.length} />
              <QuestionCard
                question={currentQuestion}
                subjectName={currentSubject.name}
                subjectColor={currentSubject.color}
                questionNumber={currentQuestionNumber}
                totalQuestions={totalQuestions}
                onSelectAnswer={handleAnswerSelect}
                onGoBack={goBack}
                canGoBack={answeredQuestions > 0}
              />
            </div>
          )}

          {appState === "upload" && (
            <div className="space-y-8 animate-fadeIn">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 mb-4">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-light text-white mb-2">Assessment Complete</h2>
                <p className="text-slate-400">You&apos;ve answered all {totalQuestions} questions</p>
              </div>

              <FileUpload files={uploadedFiles} onAddFile={addFile} onRemoveFile={removeFile} />

              <div className="text-center">
                <button
                  onClick={handleContinueToResults}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-lg text-white font-medium hover:from-cyan-500 hover:to-purple-500 transition-all"
                >
                  <FileUp className="w-5 h-5" />
                  Generate Your Profile
                </button>
                <p className="mt-3 text-xs text-slate-500">Or skip upload and continue to results</p>
              </div>
            </div>
          )}

          {appState === "results" && <ResultsView result={calculateResults} onReset={handleReset} />}
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center">
        <p className="text-xs text-slate-700">Garden for Life • Cells within Cells Interlinked</p>
      </footer>
    </main>
  );
}

export default AssessmentPage;
