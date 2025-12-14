# Container Layout Principles - Visual Guide

## 🎨 Visual Breakdown of Container Types

### 1. TEXT CONTAINERS (Headers & Paragraphs)

```
┌─────────────────────────────────────┐
│                                     │
│  Header (font size clamps)          │
│  clamp(23.4px, 5.2vw, 46.8px)      │
│                                     │
│  Margin spacing clamps              │
│  clamp(26px, 6.5vw, 45.5px)        │
│                                     │
│  Paragraph (font size clamps)       │
│  clamp(14px, 3.5vw, 28px)          │
│  Line height: 1.4                   │
│                                     │
└─────────────────────────────────────┘
        Width: 100%
```

**Principle**: All text sizes/spacing use `clamp()` for viewport responsiveness
- Header line height: `1.2`
- Body line height: `1.4`
- All widths: `100%`

---

### 2. MEDIA CONTAINERS (Images/Videos)

```
                ┌────────────────────────────────┐
                │      Responsive Gap            │
                │  clamp(10px, 2vw, 20px)       │
                ├────────────────────────────────┤
  ┌───────┐     │  ┌──────────────────────────┐  │
  │ Image │     │  │      Video Overlay       │  │
  │       │     │  │    scale(0.81)           │  │
  │ w-full│     │  │    mixBlendMode: screen  │  │
  │ h-auto│     │  └──────────────────────────┘  │
  └───────┘     │                                │
                └────────────────────────────────┘
     Display: flex
     Align: flex-start
     Max-width: clamp(400px, 90vw, 1200px)
```

**Principle**: Flex layout with responsive gaps and max-width constraints
- Gap options:
  - Tight: `clamp(10px, 2vw, 20px)`
  - Medium: `clamp(20px, 5vw, 60px)`
- Max-width: `clamp(400px, 90vw, 1200px)` (always)
- Positioning: `relative` container, `absolute` overlays

---

### 3. SVG BUTTON CONTAINERS (Parent)

```
    ┌─────────────────────────────────────┐
    │    Display: flex, centered          │
    │    Gap: clamp(20px, 5vw, 60px)     │
    │    Width: 100%                      │
    │    Max-width: clamp(...)            │
    │                                     │
    │  ┌────┐  ┌────┐  ┌────┐           │
    │  │ 🔷 │  │ 🔷 │  │ 🔷 │           │
    │  │Btn1│  │Btn2│  │Btn3│           │
    │  └────┘  └────┘  └────┘           │
    │                                     │
    └─────────────────────────────────────┘
    Max-width: clamp(400px, 90vw, 1200px)
```

**Principle**: Flex row layout with consistent spacing
- Layout: `flex-direction: row`
- Justification: `center`
- Alignment: `center`
- Gap: `clamp(20px, 5vw, 60px)` (medium spacing)

---

### 4. SVG BUTTONS (Individual)

```
Each Button:

        ┌─────────────────┐
        │   Size: clamp   │
        │  (60px, 28vw,   │
        │   220px)        │
        │                 │
        │   Transform:    │
        │  scale(1.2) +   │
        │ rotation +      │
        │ translation     │
        │                 │
        │ ┌─────────────┐ │
        │ │   🔷 Logo   │ │
        │ │             │ │
        │ └─────────────┘ │
        │                 │
        └─────────────────┘

Base Formula:
transform: 'scale(1.2) rotate(XXdeg) translateX(XXpx) translateY(XXpx)'
                 ↑           ↑                ↑              ↑
            Always      Unique per      Individual       Individual
            scale       button          offset X         offset Y
```

**Principle**: Base scale(1.2) + unique individual transforms
- **Always start with `scale(1.2)`**
- Size: `clamp(60px, 28vw, 220px)`
- Stroke: `clamp(8px, 2vw, 15px)`
- Existing transforms:
  - Button 1: `rotate(40deg) translateX(-77px) translateY(185px)`
  - Button 2: `rotate(-21deg) translateY(18px) translateX(-21px)`
  - Button 3: `rotate(40deg) translateX(-50px) translateY(15px)`

---

### 5. VIDEO OVERLAY POSITIONING

```
Background Video Layer (zIndex: 1)
├─ Full viewport coverage
└─ Position: relative

Text Layer (zIndex: 2)
├─ Content on top
└─ Position: relative

Media Container (zIndex: 8)
├─ SVG Buttons
├─ Position: relative
└─ Overflow: visible

Video Overlay (zIndex: 4)
├─ Positioned absolutely
├─ scale(0.81) at top-left origin
├─ transform: 'scale(0.81) translate(calc(...), -10%)'
└─ Position: absolute, top: -130px
```

**Principle**: Layered absolute positioning with calculated transforms
- Scale: `0.81` (≈ 65% of button scale 1.2)
- Origin: `top left` for predictable positioning
- Transform: `translate(calc(clamp(30px, 7vw, 80px) + 8%), -10%)`
- Positioned: `absolute` with `top: -130px`

---

### 6. CONTENT SECTIONS

```
┌─────────────────────────────────────────────────────────┐
│  Section Padding: pt-52 pb-20 px-6                     │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Container: max-w-4xl, mx-auto                      │ │
│  │ ┌──────────────────────────────────────────────┐  │ │
│  │ │ Block 1 (image/video/text)                  │  │ │
│  │ │ border-radius: rounded-2xl                  │  │ │
│  │ │ overflow: overflow-hidden                   │  │ │
│  │ └──────────────────────────────────────────────┘  │ │
│  │ spacing: space-y-6 (24px)                         │ │
│  │ ┌──────────────────────────────────────────────┐  │ │
│  │ │ Block 2 (image/video/text)                  │  │ │
│  │ │ w-full h-auto for images                    │  │ │
│  │ │ aspect-video for videos                     │  │ │
│  │ └──────────────────────────────────────────────┘  │ │
│  │ spacing: space-y-6                                │ │
│  │ ┌──────────────────────────────────────────────┐  │ │
│  │ │ Block 3 (CTA button)                        │  │ │
│  │ │ transform hover:scale-105                   │  │ │
│  │ └──────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Principle**: Structured content sections with consistent spacing
- Padding: `pt-52 pb-20 px-6` (Tailwind)
- Max-width: `max-w-4xl` (readable width)
- Centering: `mx-auto`
- Block spacing: `space-y-6` (24px gap)
- Image/video: `rounded-2xl overflow-hidden`

---

## 📐 Responsive Scaling Hierarchy

```
VIEWPORT SIZE  →  Scaling Effect

Mobile (375px)     TIGHT           TIGHT              TIGHT
                   gap             sizing              font
                   min ↓           min ↓              min ↓
                  10px            60px             14px
                   │               │                 │
Tablet (768px)     │ MEDIUM        │ MEDIUM          │ MEDIUM
                   │ gap           │ sizing          │ font
                   ├→ clamp(20px,  ├→ clamp(60px,    ├→ clamp(14px,
                   │   5vw, 60px)  │   28vw, 220px)  │   3.5vw, 28px)
                   │               │                 │
Desktop (1440px)   ↑ WIDE          ↑ WIDE            ↑ WIDE
                  60px            220px             28px
                   max             max               max
```

**Principle**: Use viewport-relative sizing with clamp()
- All responsive values use: `clamp(MIN, VW%, MAX)`
- Example: `clamp(10px, 2vw, 20px)`
  - Won't go below 10px (mobile)
  - Won't go above 20px (desktop)
  - Scales smoothly between based on 2% of viewport width

---

## 🔄 Transform Chain Order

```
For SVG Buttons:

1. BASE SCALE (always first)
   └─→ scale(1.2)

2. ROTATION (unique per button)
   └─→ rotate(-21deg)  OR  rotate(40deg)

3. TRANSLATION X (unique positioning)
   └─→ translateX(-21px)  OR  translateX(-77px)

4. TRANSLATION Y (unique positioning)
   └─→ translateY(18px)  OR  translateY(185px)

Final: transform: 'scale(1.2) rotate(-21deg) translateX(-21px) translateY(18px)'
                                      ↑            ↑                  ↑
                                 Unique      Individual offsets per button
```

**Principle**: Order matters! Scale first, then rotation, then translation

---

## 📊 Responsive Spacing Presets (Ready to Copy)

```javascript
// TIGHT spacing (use for adjacent items)
gap: 'clamp(10px, 2vw, 20px)'
│    └─ Mobile: 10px  │  Desktop: 20px

// MEDIUM spacing (most common)
gap: 'clamp(20px, 5vw, 60px)'
│    └─ Mobile: 20px  │  Desktop: 60px

// LARGE spacing (big offsets)
gap: 'clamp(30px, 7vw, 80px)'
│    └─ Mobile: 30px  │  Desktop: 80px

// EXTRA LARGE spacing (major sections)
gap: 'clamp(40px, 10vw, 100px)'
     └─ Mobile: 40px  │  Desktop: 100px
```

---

## ✨ Key Takeaways

```
┌─────────────────────────────────────────────────────────┐
│ PRINCIPLE #1: Use clamp() for RESPONSIVE values        │
│ └─ NOT: fontSize: '24px'                               │
│ YES: fontSize: 'clamp(14px, 3.5vw, 28px)'             │
├─────────────────────────────────────────────────────────┤
│ PRINCIPLE #2: SVG buttons ALWAYS start with scale(1.2) │
│ └─ NOT: transform: 'rotate(...) translate(...)'        │
│ YES: transform: 'scale(1.2) rotate(...) translate(...)' │
├─────────────────────────────────────────────────────────┤
│ PRINCIPLE #3: Media containers ALWAYS constrain width  │
│ └─ NOT: maxWidth: '100%'                               │
│ YES: maxWidth: 'clamp(400px, 90vw, 1200px)'           │
├─────────────────────────────────────────────────────────┤
│ PRINCIPLE #4: Use flex for ALIGNMENT consistency       │
│ └─ NOT: margin hacks and absolute positioning          │
│ YES: display: 'flex', justifyContent: 'center'         │
├─────────────────────────────────────────────────────────┤
│ PRINCIPLE #5: Document positioning CALCULATIONS        │
│ └─ NOT: marginTop: -309px  /* magic number */          │
│ YES: marginTop: 'calc(-9px - 200px + 75px - 100px + 25px)' │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 When Adding a New Container, Ask:

1. **Is this size/spacing responsive?**
   - YES → Use `clamp(MIN, VW%, MAX)`
   - NO → Use fixed value

2. **Is this an SVG button?**
   - YES → Start with `scale(1.2)`
   - NO → Continue

3. **Is this text?**
   - YES → Use responsive font sizes + line heights
   - NO → Continue

4. **Is this media?**
   - YES → Apply `clamp(400px, 90vw, 1200px)` max-width
   - NO → Apply section padding `pt-52 pb-20 px-6`

---

## 📚 Reference Files

- **LAYOUT_PRINCIPLES.md** - Detailed explanations
- **QUICK_REFERENCE.md** - Copy-paste templates
- **src/data/mobile/App.js** - Real code examples
- **This file** - Visual guide

**Choose the file that helps you most!**
