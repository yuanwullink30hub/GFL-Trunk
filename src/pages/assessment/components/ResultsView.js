import React, { useState } from 'react';
import { Download, RotateCcw, Sparkles, Brain, Eye, Heart } from 'lucide-react';
import { ARCHETYPES } from '../assessmentTypes';
import { generatePDF } from '../pdfGenerator';

function ResultsView({ result, onReset }) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      await generatePDF(result);
    } finally {
      setIsGenerating(false);
    }
  };

  const archetypeInfo = ARCHETYPES[result.overallArchetype];

  return (
    <div className="w-full max-w-4xl mx-auto animate-fadeIn">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 mb-4">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="text-xs uppercase tracking-wider text-cyan-300">Assessment Complete</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-light mb-2 holo-text">Your Consciousness Profile</h1>
        <p className="text-slate-400 text-sm">Generated on {result.timestamp.toLocaleDateString()}</p>
      </div>

      <div className="space-y-6">
        <div className="glass rounded-xl p-6 md:p-8 border border-cyan-500/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-6 h-6 text-cyan-400" />
              <h2 className="text-xl font-light text-cyan-300">Primary Archetype</h2>
            </div>
            <h3 className="text-3xl md:text-4xl font-light mb-3 text-white">
              {archetypeInfo?.name || result.overallArchetype}
            </h3>
            <p className="text-slate-300 leading-relaxed mb-4">{archetypeInfo?.description}</p>
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-300">
                <span className="font-semibold">Shadow Aspect:</span> {archetypeInfo?.shadow}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard icon={<Heart className="w-5 h-5" />} label="Harmony Score" value={`${result.harmonyScore}%`} color="#22d3ee" />
          <StatCard icon={<Eye className="w-5 h-5" />} label="Consciousness Level" value={result.consciousnessLevel} color="#a855f7" />
          <StatCard icon={<Sparkles className="w-5 h-5" />} label="Profile ID" value={result.id.split("-")[1]} color="#fbbf24" />
        </div>

        <div className="glass rounded-xl p-6 border border-purple-500/30">
          <h3 className="text-lg font-light text-purple-300 mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Quantum Resonance
          </h3>
          <p className="text-slate-300 leading-relaxed italic">&ldquo;{result.quantumResonance}&rdquo;</p>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-light text-slate-300 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400" />
            Layer Analysis
          </h3>
          {result.subjectResults.map((subject, index) => (
            <SubjectResultCard key={subject.subjectId} result={subject} index={index} />
          ))}
        </div>

        <div className="glass rounded-xl p-6 border border-orange-500/30">
          <h3 className="text-lg font-light text-orange-300 mb-3 flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI Training Prompt
          </h3>
          <p className="text-xs text-slate-500 mb-3">Use this prompt to train your AI agents:</p>
          <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-700">
            <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">{result.aiTrainingPrompt}</pre>
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(result.aiTrainingPrompt)}
            className="mt-3 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Copy to clipboard
          </button>
        </div>

        {result.uploadedFiles && result.uploadedFiles.length > 0 && (
          <div className="glass rounded-xl p-6 border border-slate-700">
            <h3 className="text-lg font-light text-slate-300 mb-3">Enhanced With</h3>
            <div className="flex flex-wrap gap-2">
              {result.uploadedFiles.map((file, index) => (
                <span key={index} className="px-3 py-1 bg-slate-800 rounded-full text-xs text-slate-400">{file.name}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
        <button
          onClick={handleDownloadPDF}
          disabled={isGenerating}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-lg text-white font-medium hover:from-cyan-500 hover:to-purple-500 transition-all disabled:opacity-50"
        >
          <Download className="w-5 h-5" />
          {isGenerating ? "Generating..." : "Download PDF Report"}
        </button>
        <button
          onClick={onReset}
          className="flex items-center justify-center gap-2 px-6 py-3 border border-slate-600 rounded-lg text-slate-300 hover:border-slate-400 hover:text-white transition-all"
        >
          <RotateCcw className="w-5 h-5" />
          Start New Assessment
        </button>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="glass rounded-xl p-4 border text-center" style={{ borderColor: `${color}30` }}>
      <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2" style={{ backgroundColor: `${color}20`, color }}>
        {icon}
      </div>
      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-xl font-light" style={{ color }}>{value}</p>
    </div>
  );
}

function SubjectResultCard({ result, index }) {
  const colors = ["#22d3ee", "#a855f7", "#f472b6", "#fbbf24", "#f97316"];
  const color = colors[index % colors.length];

  return (
    <div className="glass rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }} />
          <h4 className="font-medium text-slate-200">{result.subjectName}</h4>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Integration:</span>
          <span className="text-sm font-mono" style={{ color }}>{result.percentage}%</span>
        </div>
      </div>

      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-3">
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${result.percentage}%`, backgroundColor: color }} />
      </div>

      <div className="text-xs text-slate-400 mb-2">
        Archetype: <span className="text-slate-300">{result.dominantArchetype}</span>
      </div>

      <div className="space-y-2 mb-3">
        {result.insights.map((insight, i) => (
          <p key={i} className="text-xs text-slate-400 leading-relaxed">• {insight}</p>
        ))}
      </div>

      <div className="pt-3 border-t border-slate-700/50">
        <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Recommendations</p>
        <div className="space-y-1">
          {result.recommendations.map((rec, i) => (
            <p key={i} className="text-xs text-cyan-400/80 leading-relaxed">→ {rec}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ResultsView;
