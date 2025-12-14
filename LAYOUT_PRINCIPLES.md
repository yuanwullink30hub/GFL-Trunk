# Container Layout & Scale Principles

## Overview
This document defines the universal principles used for all container layout, positioning, and scaling across the application. **Use these principles for any new containers - NOT hardcoded numbers.**

---

## 1. TEXT CONTAINERS (Headers & Paragraphs)

### Principles
- **Font sizing**: Always use `clamp(MIN, VIEWPORT%, MAX)` for responsive text
- **Responsive spacing**: Use `clamp()` for margins and padding
- **Line height**: 
  - Headers: `1.2`
  - Body text: `1.4`
- **Width**: `100%` for full viewport responsiveness
- **Text wrapping**: Enable `whiteSpace: 'normal'`, `wordWrap: 'break-word'`, `overflowWrap: 'break-word'`

### Example
```jsx
<h1 style={{
  fontSize: 'clamp(23.4px, 5.2vw, 46.8px)',  // min, viewport%, max
  marginBottom: 'clamp(26px, 6.5vw, 45.5px)', // responsive margin
  lineHeight: '1.2',
  width: '100%'
}}>
  Header Text
</h1>

<p style={{
  fontSize: 'clamp(14px, 3.5vw, 28px)',
  lineHeight: '1.4',
  width: '100%'
}}>
  Body Text
</p>
```

### Common `clamp()` Patterns
- Heading font: `clamp(23.4px, 5.2vw, 46.8px)`
- Body font: `clamp(14px, 3.5vw, 28px)`
- Heading margin: `clamp(26px, 6.5vw, 45.5px)`
- Body spacing: `clamp(20px, 5vw, 35px)`

---

## 2. MEDIA CONTAINERS (Images/Videos)

### Principles
- **Max-width constraint**: `clamp(400px, 90vw, 1200px)` (minimum readability, maximum usability)
- **Responsive gap**: 
  - Tight: `clamp(10px, 2vw, 20px)`
  - Medium: `clamp(20px, 5vw, 60px)`
  - Large: `clamp(30px, 7vw, 80px)`
- **Display**: `flex` with `flex-start` or `center` alignment
- **Positioning**: `relative` for container, `absolute` for overlays
- **Overflow**: `visible` to allow absolutely positioned items
- **Video scale factor**: `0.81` (65% of button scale 1.2 for proportion)
- **Transform origin**: `top left` for predictable absolute positioning

### Example
```jsx
<div style={{
  display: 'flex',
  alignItems: 'flex-start',
  gap: 'clamp(10px, 2vw, 20px)',
  position: 'relative',
  width: '100%',
  maxWidth: 'clamp(400px, 90vw, 1200px)',
  margin: '0 auto',
  overflow: 'visible'
}}>
  {/* Child items */}
</div>
```

### Video Positioning Example
```jsx
<video style={{
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
}} />
```

---

## 3. SVG BUTTON CONTAINERS

### Principles
- **Base scale**: `scale(1.2)` ALWAYS applied first (non-negotiable)
- **Size**: `clamp(60px, 28vw, 220px)` for both width and height
- **Parent container**:
  - Layout: `flex row`
  - Gap: `clamp(20px, 5vw, 60px)`
  - Alignment: `center`
  - Justification: `center`
- **Each button**: Add unique `rotation` + `translation` offsets to base scale
- **Transitions**: `'all 0.3s ease'`
- **Stroke width**: `clamp(8px, 2vw, 15px)`
- **Pointer events**: `none` on SVG, `all` on interactive paths

### Example - Parent Container
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

### Example - SVG Button
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
    // PRINCIPLE: base scale + unique rotation/translation
    transform: 'scale(1.2) rotate(-21deg) translateY(18px) translateX(-21px)'
  }}
>
  {/* SVG content */}
</svg>
```

### Existing Button Transforms
- **Button 1**: `scale(1.2) rotate(40deg) translateX(-77px) translateY(185px)`
- **Button 2**: `scale(1.2) rotate(-21deg) translateY(18px) translateX(-21px)`
- **Button 3**: `scale(1.2) rotate(40deg) translateX(-50px) translateY(15px)`

---

## 4. TEXT POSITIONING (Wrapper Containers)

### Principles
- **Width**: `100%` for full responsiveness
- **Margin calculation**: Use `calc()` with multiple components when positioning overlays
- **Components in calc()**:
  - Video/element offset adjustments
  - Section padding adjustments
  - Header padding adjustments
  - Breathing room for responsiveness
- **Pattern**: Combine offsets with `+ - * /` operations for dynamic positioning

### Example
```jsx
<div style={{
  marginTop: 'calc(-9px - 200px + 75px - 100px + 25px)',
  width: '100%'
}}>
  {/* Content that needs precise overlay positioning */}
</div>
```

**Note**: This pattern keeps positioning maintainable by documenting each component's purpose.

---

## 5. CONTENT SECTIONS

### Principles
- **Container max-width**: `max-w-4xl` with `mx-auto` (Tailwind classes)
- **Spacing between blocks**: `space-y-6` (Tailwind class)
- **Image containers**: 
  - Overflow: `overflow-hidden`
  - Border radius: `rounded-2xl`
  - Image: `w-full h-auto`
- **Video containers**: 
  - Border radius: `rounded-2xl`
  - Aspect ratio: `aspect-video`
  - iFrame: `w-full h-full`
- **Section padding**:
  - Horizontal: `px-6`
  - Top: `pt-52` (after header)
  - Bottom: `pb-20`

### Example
```jsx
<section className="pt-52 pb-20 px-6">
  <div className="container mx-auto max-w-4xl">
    <div className="space-y-6">
      {/* Content blocks with consistent spacing */}
    </div>
  </div>
</section>
```

---

## 6. RESPONSIVE SPACING HIERARCHY

Use these predefined `clamp()` values for consistency:

| Category | Value | Use Case |
|----------|-------|----------|
| Tight | `clamp(10px, 2vw, 20px)` | Gap between adjacent items |
| Small | `clamp(15px, 3vw, 30px)` | Small margins/padding |
| Medium | `clamp(20px, 5vw, 60px)` | Standard gaps (most common) |
| Large | `clamp(30px, 7vw, 80px)` | Large offsets, translations |
| Extra Large | `clamp(40px, 10vw, 100px)` | Major section spacing |

---

## 7. APPLYING PRINCIPLES TO NEW CONTAINERS

### Checklist
- [ ] Use `clamp()` for ANY size/spacing that changes with viewport
- [ ] Apply `scale(1.2)` to SVG containers as base transform
- [ ] Use `100%` width for flexible content blocks
- [ ] Maintain `max-width: clamp(400px, 90vw, 1200px)` for readability
- [ ] Keep responsive gap between flex items
- [ ] Use flex centering for alignment consistency
- [ ] Enable text wrapping properties for text containers
- [ ] Use `transition: 'all 0.3s ease'` for interactive elements

### When to Use `calc()`
- Complex positioning involving multiple layout layers
- Overlay positioning calculations
- Combining clamp() values with static offsets

### When to Use `clamp()`
- Font sizes
- Margins and padding
- Gaps between flex items
- Viewport-dependent widths
- Transform translations

---

## 8. Z-INDEX LAYERING

- **Background video**: `zIndex: 1`
- **Text content**: `zIndex: 2`
- **Media container**: `zIndex: 8`
- **Overlay video**: `zIndex: 4`
- **Header**: `zIndex: 9999` (always on top)

---

## Summary Table

| Element | Key Properties | Example Value |
|---------|---|---|
| Text (Header) | fontSize, lineHeight, width | `clamp(23.4px, 5.2vw, 46.8px)`, `1.2`, `100%` |
| Text (Body) | fontSize, lineHeight, width | `clamp(14px, 3.5vw, 28px)`, `1.4`, `100%` |
| Media Container | display, gap, maxWidth | `flex`, `clamp(10px, 2vw, 20px)`, `clamp(400px, 90vw, 1200px)` |
| SVG Button | size, scale, stroke | `clamp(60px, 28vw, 220px)`, `scale(1.2)`, `clamp(8px, 2vw, 15px)` |
| Video | scale, mixBlendMode, transform | `0.81`, `screen`, `scale(0.81) translate(calc(...))` |
| Section | padding, maxWidth | `pt-52 pb-20 px-6`, `max-w-4xl` |

---

## Questions?

When adding new containers, ask:
1. Does this size/spacing change with viewport? → Use `clamp()`
2. Is this an SVG button? → Apply `scale(1.2)` base transform
3. Is this a media container? → Use responsive gap + max-width constraint
4. Is this text? → Use responsive font sizing + proper line height
5. Does this need overlay positioning? → Use `calc()` with documented components
