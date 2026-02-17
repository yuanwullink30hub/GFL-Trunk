import React from 'react';

function ProgressBar({ progress, currentSubject, totalSubjects }) {
  const layers = [
    { name: "Foundation", color: "#22d3ee" },
    { name: "Emotional", color: "#a855f7" },
    { name: "Mental", color: "#f472b6" },
    { name: "Spiritual", color: "#fbbf24" },
    { name: "Unity", color: "#f97316" },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <div className="flex justify-between mb-2">
        {layers.map((layer, index) => (
          <div key={layer.name} className="flex flex-col items-center" style={{ opacity: index <= currentSubject ? 1 : 0.3 }}>
            <div
              className="w-3 h-3 rounded-full mb-1"
              style={{
                backgroundColor: layer.color,
                boxShadow: index <= currentSubject ? `0 0 10px ${layer.color}` : "none",
              }}
            />
            <span className="text-[10px] uppercase tracking-wider hidden sm:block" style={{ color: layer.color }}>
              {layer.name}
            </span>
          </div>
        ))}
      </div>

      <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full rounded-full transition-all duration-500"
          style={{
            width: `${progress}%`,
            background: `linear-gradient(90deg, ${layers[currentSubject]?.color || "#22d3ee"}, ${layers[Math.min(currentSubject + 1, 4)]?.color || "#f97316"})`,
          }}
        />
      </div>

      <div className="flex justify-between mt-2 text-xs text-slate-400 font-mono">
        <span>PROGRESS: {Math.round(progress)}%</span>
        <span>LAYER {currentSubject + 1}/{totalSubjects}</span>
      </div>
    </div>
  );
}

export default ProgressBar;
