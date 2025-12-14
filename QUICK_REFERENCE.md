# Container Layout - Quick Reference

## The Golden Rule
**Use principles (clamp, flex, relative positioning) - NEVER hardcoded pixel values for responsive sizes**

---

## Copy-Paste Templates

### 1. Text Container (Header)
```jsx
<h1 style={{
  fontSize: 'clamp(23.4px, 5.2vw, 46.8px)',
  marginBottom: 'clamp(26px, 6.5vw, 45.5px)',
  lineHeight: '1.2',
  width: '100%',
  whiteSpace: 'normal',
  wordWrap: 'break-word',
  overflowWrap: 'break-word'
}}>
  Header Text Here
</h1>
```

### 2. Text Container (Body)
```jsx
<p style={{
  fontSize: 'clamp(14px, 3.5vw, 28px)',
  lineHeight: '1.4',
  width: '100%',
  whiteSpace: 'normal',
  wordWrap: 'break-word',
  overflowWrap: 'break-word'
}}>
  Body text here
</p>
```

### 3. Media Container (Flex Layout)
```jsx
<div style={{
  display: 'flex',
  alignItems: 'flex-start',
  gap: 'clamp(10px, 2vw, 20px)',      // or clamp(20px, 5vw, 60px)
  position: 'relative',
  width: '100%',
  maxWidth: 'clamp(400px, 90vw, 1200px)',
  margin: '0 auto',
  overflow: 'visible'
}}>
  {/* Media items */}
</div>
```

### 4. SVG Button Container (Parent)
```jsx
<div style={{
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 'clamp(20px, 5vw, 60px)',
  width: '100%',
  maxWidth: 'clamp(400px, 90vw, 1200px)',
  margin: '0 auto'
}}>
  {/* SVG buttons */}
</div>
```

### 5. SVG Button (Individual)
```jsx
<svg
  width="clamp(60px, 28vw, 220px)"
  height="clamp(60px, 28vw, 220px)"
  viewBox="0 0 300 300"
  preserveAspectRatio="xMidYMid meet"
  style={{
    display: 'block',
    transition: 'all 0.3s ease',
    pointerEvents: 'none',
    transform: 'scale(1.2) rotate(-21deg) translateY(18px) translateX(-21px)'
    // CHANGE: rotation angle, translateX, translateY for your button
  }}
>
  {/* SVG paths and content */}
</svg>
```

### 6. Video Overlay Container
```jsx
<video
  autoPlay loop muted playsInline
  style={{
    display: 'block',
    width: 'auto',
    height: 'auto',
    mixBlendMode: 'screen',
    backgroundColor: 'transparent',
    transform: 'scale(0.81) translate(calc(clamp(30px, 7vw, 80px) + 8%), -10%)',
    transformOrigin: 'top left',
    position: 'absolute',
    top: '-130px',
    zIndex: 4
  }}
>
  <source src="your-video.mp4" type="video/mp4" />
</video>
```

### 7. Text Positioning Wrapper
```jsx
<div style={{
  marginTop: 'calc(-9px - 200px + 75px - 100px + 25px)',
  // Breakdown: -9px (border) - 200px (video offset) + 75px (adjustment) - 100px (header) + 25px (breathing room)
  width: '100%'
}}>
  {/* Content */}
</div>
```

### 8. Content Section
```jsx
<section className="pt-52 pb-20 px-6">
  <div className="container mx-auto max-w-4xl">
    <div className="space-y-6">
      {/* Blocks with consistent spacing */}
    </div>
  </div>
</section>
```

---

## Responsive Spacing Presets

```javascript
// COPY THESE - Don't invent new values
const SPACING = {
  TIGHT:       'clamp(10px, 2vw, 20px)',
  SMALL:       'clamp(15px, 3vw, 30px)',
  MEDIUM:      'clamp(20px, 5vw, 60px)',
  LARGE:       'clamp(30px, 7vw, 80px)',
  EXTRA_LARGE: 'clamp(40px, 10vw, 100px)'
};

// COPY THESE - Don't invent new font sizes
const FONT_SIZES = {
  HEADING: 'clamp(23.4px, 5.2vw, 46.8px)',
  BODY:    'clamp(14px, 3.5vw, 28px)',
  SMALL:   'clamp(12px, 2.5vw, 18px)'
};

// COPY THIS - SVG size is always the same
const SVG_SIZE = 'clamp(60px, 28vw, 220px)';

// COPY THIS - Button scale never changes
const BUTTON_SCALE = 'scale(1.2)';

// COPY THIS - Video scale is always proportional
const VIDEO_SCALE = 'scale(0.81)';

// COPY THIS - Max-width constraint is consistent
const MAX_WIDTH = 'clamp(400px, 90vw, 1200px)';
```

---

## Common Mistakes ❌

```javascript
// ❌ WRONG - Hardcoded responsive value
fontSize: '24px'
marginBottom: '30px'
width: '90%'
gap: '20px'

// ✅ CORRECT - Using clamp()
fontSize: 'clamp(14px, 3.5vw, 28px)'
marginBottom: 'clamp(20px, 5vw, 60px)'
width: '100%'
gap: 'clamp(20px, 5vw, 60px)'
```

```javascript
// ❌ WRONG - Missing scale(1.2) on SVG
transform: 'rotate(-21deg) translateY(18px) translateX(-21px)'

// ✅ CORRECT - scale(1.2) always first
transform: 'scale(1.2) rotate(-21deg) translateY(18px) translateX(-21px)'
```

```javascript
// ❌ WRONG - No max-width on media container
maxWidth: '100%'

// ✅ CORRECT - Consistent max-width
maxWidth: 'clamp(400px, 90vw, 1200px)'
```

---

## Decision Tree

```
Is this a container that changes size with viewport?
├─ YES → Use clamp(MIN, VW%, MAX)
└─ NO  → Can use fixed value

Is this an SVG button?
├─ YES → Apply scale(1.2) as BASE transform
└─ NO  → Continue

Is this a media/image container?
├─ YES → Apply maxWidth: clamp(400px, 90vw, 1200px) and responsive gap
└─ NO  → Continue

Is this text?
├─ YES → Use responsive font sizes + proper line-height
└─ NO  → Apply section padding (pt-52 pb-20 px-6)
```

---

## Existing Scales Reference

Keep consistent with these:

| Scale Type | Value | Purpose |
|-----------|-------|---------|
| SVG Button (all) | `scale(1.2)` | Base size multiplier |
| Video Overlay | `scale(0.81)` | Proportional to button (0.81/1.2 ≈ 0.67) |
| Button Stroke | `clamp(8px, 2vw, 15px)` | Responsive line width |

---

## Need to Add a New Container?

1. **Identify type**: Text? Media? Button? Section?
2. **Check templates above** - Copy the appropriate template
3. **Replace YOUR_VALUE placeholders** with actual content
4. **Use clamp() for any responsive sizing**
5. **Apply scale(1.2) if it's an SVG button**
6. **Reference LAYOUT_PRINCIPLES.md** if confused
7. **Never hardcode pixel values for responsive properties**

---

## File Locations

- **Principle Documentation**: `LAYOUT_PRINCIPLES.md` (detailed guide)
- **Code Examples**: `src/data/mobile/App.js` (inline comments with principles)
- **This File**: `QUICK_REFERENCE.md` (copy-paste templates)
