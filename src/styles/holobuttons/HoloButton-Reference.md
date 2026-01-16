# HoloButton Component Reference

A sci-fi themed, holographic button component featuring geometric SVG construction and neon glow effects.

---

## Overview

The HoloButton is a React component that creates a visually striking holographic button with:
- Breathing neon animation (orange ↔ purple color cycling)
- Pulse effect (scale 1 → 1.1) synchronized with color
- Always-on holographic effects
- Geometric SVG construction (circle + inscribed triangle)

---

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `number \| string` | `120` | Size of the button (pixels or CSS value) |
| `rotation` | `number` | `0` | Rotation of the triangle in degrees |
| `onClick` | `function` | - | Click handler callback |
| `label` | `string` | - | Optional label text below the button |

---

## Color Palette

```javascript
const colors = {
  orange: '#ef8616',
  purple: 'rgb(167, 59, 198)'
};
```

---

## Animation Keyframes

### Breathing Stroke
Cycles the stroke color between orange and purple over 4 seconds.

```css
@keyframes breatheStroke {
  0%, 100% { stroke: #ef8616; }
  50% { stroke: rgb(167, 59, 198); }
}
```

### Breathing Filter (Glow)
Cycles the drop-shadow glow between orange and purple.

```css
@keyframes breatheFilter {
  0%, 100% { 
    filter: drop-shadow(0 0 8px #ef8616) drop-shadow(0 0 15px #ef8616); 
  }
  50% { 
    filter: drop-shadow(0 0 8px rgb(167, 59, 198)) drop-shadow(0 0 15px rgb(167, 59, 198)); 
  }
}
```

### Breathing Scale
Subtle scale pulse synchronized with color breathing.

```css
@keyframes breatheScale {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
```

### Holographic Flicker
Creates a glitch/interference effect.

```css
@keyframes flicker {
  0%, 19.999%, 22%, 62.999%, 64%, 64.999%, 70%, 100% {
    opacity: 1;
    filter: brightness(1) contrast(1);
  }
  20%, 21.999%, 63%, 63.999%, 65%, 69.999% {
    opacity: 0.8;
    filter: brightness(1.2) contrast(1.2);
  }
}
```

---

## SVG Geometry

### Circle
- Center: `(50, 50)` in viewBox `0 0 100 100`
- Radius: `46` (slightly less than 50 to account for stroke width)

### Inscribed Equilateral Triangle
Points calculated to touch the circle border at 0°, 120°, and 240°.

```javascript
const getPoint = (angleInDegrees) => {
  const angleInRadians = (angleInDegrees * Math.PI) / 180;
  return `${cx + radius * Math.cos(angleInRadians)},${cy + radius * Math.sin(angleInRadians)}`;
};

const p1 = getPoint(0);   // Right point
const p2 = getPoint(120); // Bottom-left point  
const p3 = getPoint(240); // Top-left point
```

---

## Component Structure

```
HoloButton
├── Container (flex column)
│   ├── Button
│   │   └── Motion Wrapper (breathing scale)
│   │       ├── Background Glow Blur
│   │       ├── Static Circle SVG (breathing filter)
│   │       │   └── Circle border
│   │       ├── Rotating Triangle SVG
│   │       │   ├── Triangle polygon
│   │       │   ├── V shape path
│   │       │   ├── Inner fill effect
│   │       │   ├── Grid pattern (clipped to circle)
│   │       │   └── Secondary glow layer
│   │       ├── Decorative Spinning Circle SVG
│   │       │   └── Dashed circle (tech details)
│   │       ├── Holographic Projector Effects
│   │       │   ├── Volumetric cone beams (8x)
│   │       │   ├── Radial glow rings (3x)
│   │       │   └── Gradient overlay
│   │       └── Glitch Overlay Effect
│   └── Optional Label
```

---

## Usage Example

```jsx
import HoloButton from './components/HoloButton';

function App() {
  return (
    <HoloButton 
      size={180} 
      rotation={30}
      onClick={() => console.log('Clicked!')}
      label="ENTER"
    />
  );
}
```

---

## GPU Acceleration

The component uses these CSS properties for smooth rendering:

```javascript
const gpuAccelStyle = {
  willChange: 'transform, opacity',
  backfaceVisibility: 'hidden',
  WebkitBackfaceVisibility: 'hidden',
  perspective: '1000px',
  WebkitPerspective: '1000px',
  transform: 'translateZ(0)',
  WebkitTransform: 'translateZ(0)'
};
```

---

## Tailwind CSS Configuration (Standalone)

If using in a standalone project with Tailwind:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        holo: {
          orange: '#ef8616',
          purple: 'rgb(167, 59, 198)',
        }
      },
      animation: {
        'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'holo-flicker': 'flicker 3s infinite',
        'spin-slow': 'spin 12s linear infinite',
        'breathe-stroke': 'breatheStroke 4s ease-in-out infinite',
        'breathe-filter': 'breatheFilter 4s ease-in-out infinite',
        'breathe-scale': 'breatheScale 4s ease-in-out infinite',
      }
    }
  }
}
```
