import React from 'react';

function PyramidVisualizer({ activeLayer, progress }) {
  const layers = [
    { name: "Foundation", color: "#22d3ee" },
    { name: "Emotional", color: "#a855f7" },
    { name: "Mental", color: "#f472b6" },
    { name: "Spiritual", color: "#fbbf24" },
    { name: "Unity", color: "#f97316" },
  ];

  return (
    <div className="w-full h-[200px] md:h-[250px] flex items-center justify-center">
      <div className="relative">
        <div className="flex flex-col items-center gap-1">
          {layers.map((layer, index) => {
            const isActive = index === activeLayer;
            const isCompleted = index < activeLayer;
            const width = 60 + index * 40;

            return (
              <div
                key={layer.name}
                className="h-8 rounded-sm flex items-center justify-center text-[10px] uppercase tracking-wider font-mono transition-all duration-500"
                style={{
                  width: `${width}px`,
                  backgroundColor: isActive ? `${layer.color}40` : isCompleted ? `${layer.color}20` : "rgba(30,30,40,0.5)",
                  border: `1px solid ${isActive || isCompleted ? layer.color : "#333"}`,
                  boxShadow: isActive ? `0 0 15px ${layer.color}50` : "none",
                  color: isActive || isCompleted ? layer.color : "#555",
                }}
              >
                {layer.name}
              </div>
            );
          })}
        </div>

        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full animate-pulse"
          style={{ 
            backgroundColor: layers[activeLayer]?.color || "#22d3ee",
            boxShadow: `0 0 30px ${layers[activeLayer]?.color || "#22d3ee"}`,
          }}
        />
      </div>
    </div>
  );
}

export default PyramidVisualizer;
