import React from 'react';
import { ChevronRight, Brain, Sparkles, Eye, Heart } from 'lucide-react';

function IntroScreen({ onStart }) {
  const features = [
    { icon: <Brain className="w-5 h-5" />, title: "5-Layer Analysis", description: "Explore Foundation, Emotional, Mental, Spiritual, and Unity layers", color: "#22d3ee" },
    { icon: <Eye className="w-5 h-5" />, title: "Shadow Integration", description: "Based on the deltawerken framework of FM/MF dynamics", color: "#a855f7" },
    { icon: <Heart className="w-5 h-5" />, title: "Research-Backed", description: "Informed by quantum panpsychism, morphogenesis, and alchemy", color: "#f472b6" },
    { icon: <Sparkles className="w-5 h-5" />, title: "AI Training Ready", description: "Generate prompts to harmonize your AI agents with your psychology", color: "#fbbf24" },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto animate-fadeIn" style={{ transform: 'scale(1.2)', transformOrigin: 'top center', position: 'relative', padding: '16px' }}>
      {/* Purple corner borders */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: 28, height: 28, borderTop: '2px solid #a855f7', borderLeft: '2px solid #a855f7' }} />
      <div style={{ position: 'absolute', top: 0, right: 0, width: 28, height: 28, borderTop: '2px solid #a855f7', borderRight: '2px solid #a855f7' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: 28, height: 28, borderBottom: '2px solid #a855f7', borderLeft: '2px solid #a855f7' }} />
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderBottom: '2px solid #a855f7', borderRight: '2px solid #a855f7' }} />

      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-purple-500/30 mb-6">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-xs uppercase tracking-wider text-purple-300">AAA+</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-light mb-4 holo-text">AAA+</h1>
        <h2 className="text-xl md:text-2xl font-light text-slate-400 mb-2">A+ Archetype Analyse</h2>

        <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          A comprehensive psychological assessment integrating biochemistry, physics,
          alchemy, and quantum panpsychism to reveal your unique consciousness signature.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="glass rounded-lg p-5 border border-slate-700 hover:border-slate-600 transition-colors"
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
              style={{ backgroundColor: `${feature.color}20`, color: feature.color }}
            >
              {feature.icon}
            </div>
            <h3 className="text-lg font-medium text-slate-200 mb-1">{feature.title}</h3>
            <p className="text-sm text-slate-500">{feature.description}</p>
          </div>
        ))}
      </div>

      <div className="mb-12">
        <h2 className="text-center text-lg text-slate-300 mb-6">The Five Layers of Being</h2>
        <div className="flex flex-col items-center gap-2">
          {[
            { name: "Unity", color: "#f97316", desc: "Bewustzijn" },
            { name: "Spiritual", color: "#fbbf24", desc: "Resonance" },
            { name: "Mental", color: "#f472b6", desc: "Geometric Cognition" },
            { name: "Emotional", color: "#a855f7", desc: "Shadow Integration" },
            { name: "Foundation", color: "#22d3ee", desc: "Biochemical Resonance" },
          ].map((layer, index) => (
            <div
              key={layer.name}
              className="flex items-center gap-4 px-6 py-3 rounded-lg border"
              style={{
                width: `${200 + index * 40}px`,
                borderColor: `${layer.color}40`,
                backgroundColor: `${layer.color}10`,
              }}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: layer.color, boxShadow: `0 0 10px ${layer.color}` }}
              />
              <div>
                <span className="text-sm font-medium" style={{ color: layer.color }}>{layer.name}</span>
                <span className="text-xs text-slate-500 ml-2">{layer.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={onStart}
          className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-lg text-white font-medium text-lg hover:from-cyan-500 hover:to-purple-500 transition-all overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity" />
          <span className="relative z-10">Begin Assessment</span>
          <ChevronRight className="relative z-10 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-purple-400" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-purple-400" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-purple-400" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-purple-400" />
        </button>
        <p className="mt-4 text-xs text-slate-500">Assessment • ~15 minutes • Optional file upload</p>
      </div>

      <div className="mt-16 text-center">
        <p className="text-xs text-slate-600">Based on research in quantum panpsychism, morphogenesis, and alchemical traditions</p>
        <p className="text-xs text-slate-700 mt-1">www.gardenforlife.nl</p>
      </div>
    </div>
  );
}

export default IntroScreen;
