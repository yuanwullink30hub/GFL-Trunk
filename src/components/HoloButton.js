import React, { useState } from 'react';
import { motion } from 'framer-motion';

/**
 * HoloButton Component
 * 
 * A sci-fi inspired UI element. It uses SVG to draw a perfect circle
 * and an inscribed equilateral triangle where the points touch the border.
 * 
 * Visuals:
 * - Breathing neon animation switching between #ef8616 and rgb(167, 59, 198).
 * - Pulse effect (scale 1 -> 1.1) synchronized with color.
 * - Always-on holographic effects.
 * 
 * @param {number} size - Size of the button in pixels or CSS value
 * @param {number} rotation - Rotation of the triangle in degrees
 * @param {function} onClick - Click handler
 * @param {string} label - Optional label text below the button
 */
const HoloButton = ({ 
  size = 120, 
  rotation = 0, 
  onClick,
  label
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  // Geometry Constants for viewBox 0 0 100 100
  const cx = 50;
  const cy = 50;
  const radius = 46; // Slightly less than 50 to account for stroke width
  
  // Calculate equilateral triangle points
  // 0 degrees starts at 3 o'clock. Points touching the circle border.
  const getPoint = (angleInDegrees) => {
    const angleInRadians = (angleInDegrees * Math.PI) / 180;
    return `${cx + radius * Math.cos(angleInRadians)},${cy + radius * Math.sin(angleInRadians)}`;
  };

  // Standard "Play" orientation: 0, 120, 240 degrees
  const p1 = getPoint(0);
  const p2 = getPoint(120);
  const p3 = getPoint(240);
  const points = `${p1} ${p2} ${p3}`;

  // Breathing stroke animation
  const breatheStroke = {
    animate: {
      stroke: ['#ef8616', 'rgb(167, 59, 198)', '#ef8616']
    },
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  };

  // Breathing filter animation (simplified for mobile performance)
  const breatheFilter = {
    animate: {
      filter: [
        'drop-shadow(0 0 15px rgba(180, 100, 10, 0.8)) drop-shadow(0 0 35px rgba(239, 134, 22, 0.4))',
        'drop-shadow(0 0 15px rgba(120, 40, 150, 0.8)) drop-shadow(0 0 35px rgba(167, 59, 198, 0.4))',
        'drop-shadow(0 0 15px rgba(180, 100, 10, 0.8)) drop-shadow(0 0 35px rgba(239, 134, 22, 0.4))'
      ]
    },
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  };

  // Breathing scale animation (1 -> 1.1 -> 1)
  const breatheScale = {
    animate: {
      scale: [1, 1.1, 1]
    },
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  };

  // Breathing background color
  const breatheBg = {
    animate: {
      backgroundColor: ['#ef8616', 'rgb(167, 59, 198)', '#ef8616']
    },
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  };

  // Breathing box shadow
  const breatheBoxShadow = {
    animate: {
      boxShadow: [
        'inset 0 0 20px #ef8616',
        'inset 0 0 20px rgb(167, 59, 198)',
        'inset 0 0 20px #ef8616'
      ]
    },
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  };

  // Flicker animation for glitch effect (simplified for mobile)
  const flickerAnimation = {
    animate: {
      opacity: [1, 0.9, 1, 0.85, 1],
      filter: [
        'brightness(1) contrast(1)',
        'brightness(1.1) contrast(1.05)',
        'brightness(1) contrast(1)',
        'brightness(1.15) contrast(1.1)',
        'brightness(1) contrast(1)'
      ]
    },
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  };

  // Projector flicker animation (visible effect with longer duration)
  const projectorFlicker = {
    animate: {
      opacity: [1, 0.6, 1, 0.4, 1, 0.7, 1]
    },
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  };

  // Holographic pulse animation
  const holoPulse = {
    animate: {
      opacity: [0.6, 1, 0.6],
      filter: ['blur(3px)', 'blur(2px)', 'blur(3px)']
    },
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  };

  // Parse size for style
  const sizeStyle = typeof size === 'number' ? `${size}px` : size;

  // GPU acceleration for smooth rendering
  const gpuAccelStyle = {
    willChange: 'transform, opacity',
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    perspective: '1000px',
    WebkitPerspective: '1000px',
    transform: 'translateZ(0)',
    WebkitTransform: 'translateZ(0)'
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      gap: '1rem',
      ...gpuAccelStyle
    }}>
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setIsPressed(false);
        }}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: sizeStyle,
          height: sizeStyle,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          outline: 'none',
          userSelect: 'none',
          transition: 'all 0.3s ease-out',
          transform: isPressed ? 'scale(0.9) translateZ(0)' : 'scale(1) translateZ(0)',
          ...gpuAccelStyle,
          filter: isHovered ? 'brightness(1.25)' : 'brightness(1)'
        }}
        aria-label={label || "Holographic Button"}
      >
        {/* 
          Wrapper for visuals to handle breathing scale separately from button click scale.
          This prevents conflict between 'transform' property used in keyframes vs utility classes.
        */}
        <motion.div
          style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            ...gpuAccelStyle
          }}
          {...breatheScale}
        >
          {/* Background "Glow" Blur Container */}
          <motion.div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              opacity: 0.2,
              filter: 'blur(20px)',
              transition: 'opacity 0.5s',
              ...gpuAccelStyle
            }}
            {...breatheBg}
          />

          {/* Static Circle SVG - takes up space in layout */}
          <motion.svg
            viewBox="0 0 100 100"
            style={{
              width: '100%',
              height: '100%',
              overflow: 'visible',
              ...gpuAccelStyle
            }}
            {...breatheFilter}
          >
            {/* 1. The Circle Border */}
            <motion.circle
              cx={cx}
              cy={cy}
              r={radius}
              fill="transparent"
              strokeWidth="3"
              style={{ opacity: 0.9 }}
              {...breatheStroke}
            />
          </motion.svg>

          {/* Rotating Triangle + V SVG */}
          <motion.svg
            viewBox="0 0 100 100"
            style={{
              width: '100%',
              height: '100%',
              overflow: 'visible',
              position: 'absolute',
              top: 0,
              left: 0,
              ...gpuAccelStyle
            }}
            animate={{
              rotate: 360
            }}
            transition={{
              rotate: { duration: 12, repeat: Infinity, ease: 'linear' }
            }}
          >
            {/* 2. The Triangle - inscribed, points touch circle */}
            <motion.polygon
              points={points}
              fill="transparent"
              strokeWidth="3"
              strokeLinejoin="round"
              style={{ opacity: 0.9 }}
              animate={{
                stroke: ['#ef8616', 'rgb(167, 59, 198)', '#ef8616'],
                filter: [
                  'drop-shadow(0 0 15px rgba(180, 100, 10, 0.8)) drop-shadow(0 0 35px rgba(239, 134, 22, 0.4))',
                  'drop-shadow(0 0 15px rgba(120, 40, 150, 0.8)) drop-shadow(0 0 35px rgba(167, 59, 198, 0.4))',
                  'drop-shadow(0 0 15px rgba(180, 100, 10, 0.8)) drop-shadow(0 0 35px rgba(239, 134, 22, 0.4))'
                ]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />

            {/* 3. V shape inside triangle */}
            <motion.path
              d="M 68.5 35 L 27 50 L 68.5 65"
              fill="none"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ opacity: 0.9 }}
              animate={{
                stroke: ['#ef8616', 'rgb(167, 59, 198)', '#ef8616'],
                filter: [
                  'drop-shadow(0 0 15px rgba(180, 100, 10, 0.8)) drop-shadow(0 0 35px rgba(239, 134, 22, 0.4))',
                  'drop-shadow(0 0 15px rgba(120, 40, 150, 0.8)) drop-shadow(0 0 35px rgba(167, 59, 198, 0.4))',
                  'drop-shadow(0 0 15px rgba(180, 100, 10, 0.8)) drop-shadow(0 0 35px rgba(239, 134, 22, 0.4))'
                ]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />

            {/* Holographic inner triangle fill effect */}
            <motion.polygon
              points={points}
              strokeWidth="0"
              style={{ 
                opacity: 0.08,
                mixBlendMode: 'screen'
              }}
              animate={{
                fill: ['#ef8616', 'rgb(167, 59, 198)', '#ef8616']
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />

            {/* Secondary inner glow layer */}
            <motion.polygon
              points={points}
              fill="transparent"
              strokeWidth="1"
              strokeLinejoin="round"
              style={{ opacity: 0.3 }}
              animate={{
                stroke: ['rgba(239, 134, 22, 0.4)', 'rgba(167, 59, 198, 0.4)', 'rgba(239, 134, 22, 0.4)'],
                filter: [
                  'drop-shadow(0 0 3px #ef8616)',
                  'drop-shadow(0 0 3px rgb(167, 59, 198))',
                  'drop-shadow(0 0 3px #ef8616)'
                ]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />
          </motion.svg>

          {/* Holographic Projector Beam Effect (simplified for mobile) */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              overflow: 'visible',
              ...gpuAccelStyle
            }}
          >
            {/* Volumetric outer glow layers - reduced to 4 for performance */}
            {[0, 90, 180, 270].map((rotation, idx) => (
              <motion.div
                key={`holo-cone-${idx}`}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: 0,
                  height: 0,
                  borderLeft: '15px solid transparent',
                  borderRight: '15px solid transparent',
                  borderBottom: '40px solid transparent',
                  borderTopWidth: 0,
                  transform: `translate(-50%, -50%) rotate(${rotation}deg) translateY(-35px)`,
                  transformOrigin: 'center center',
                  filter: 'blur(8px)',
                  opacity: 0.15
                }}
                animate={{
                  borderBottomColor: ['rgba(239, 134, 22, 0.3)', 'rgba(167, 59, 198, 0.3)', 'rgba(239, 134, 22, 0.3)'],
                  opacity: [0.15, 0.25, 0.15]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: idx * 0.05
                }}
                {...projectorFlicker}
              />
            ))}

            {/* Inner radial glow ring - simplified to 1 for performance */}
            <motion.div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: '80%',
                height: '80%',
                borderRadius: '50%',
                transform: 'translate(-50%, -50%)',
                border: '1px solid transparent',
                pointerEvents: 'none'
              }}
              animate={{
                borderColor: [
                  'rgba(239, 134, 22, 0.12)',
                  'rgba(167, 59, 198, 0.12)',
                  'rgba(239, 134, 22, 0.12)'
                ],
                boxShadow: [
                  '0 0 12px rgba(239, 134, 22, 0.08)',
                  '0 0 12px rgba(167, 59, 198, 0.08)',
                  '0 0 12px rgba(239, 134, 22, 0.08)'
                ]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              {...holoPulse}
            />

            {/* Holographic gradient overlay */}
            <motion.div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: 'linear-gradient(to bottom, rgba(255,255,255,0.1), transparent)',
                opacity: 0.1,
                mixBlendMode: 'overlay',
                pointerEvents: 'none'
              }}
              {...projectorFlicker}
            />
          </div>

          {/* Glitch Overlay Effect (Visual Noise) - Always Active */}
          <motion.div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              pointerEvents: 'none'
            }}
            {...flickerAnimation}
          >
            <motion.div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                mixBlendMode: 'screen',
                opacity: 0.2
              }}
              {...breatheBoxShadow}
            />
          </motion.div>
        </motion.div>
      </button>

      {/* Optional Label */}
      {label && (
        <motion.span
          style={{
            fontSize: '0.875rem',
            fontFamily: 'monospace',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            transition: 'all 0.3s'
          }}
          animate={{
            color: ['#ef8616', 'rgb(167, 59, 198)', '#ef8616'],
            textShadow: [
              '0 0 10px #ef8616',
              '0 0 10px rgb(167, 59, 198)',
              '0 0 10px #ef8616'
            ]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          {label}
        </motion.span>
      )}
    </div>
  );
};

export default HoloButton;
