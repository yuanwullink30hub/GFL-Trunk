# Worktree Notes - Slideshow Visibility & Logo Behavior

## Current Implementation Status

### Slideshow Visibility Logic
**File:** `src/data/mobile/App.js`

**State Variable:** `slideshowOpacity` (initialized to 0)

**Scroll Handler Logic (lines ~365-380):**
```javascript
if (slideshowContainerRef?.current) {
  const rect = slideshowContainerRef.current.getBoundingClientRect();
  const containerTop = rect.top;
  
  // Fully hidden if top of container is 120px above viewport top
  if (containerTop <= -120) {
    setSlideshowOpacity(0);
    return;
  }
  
  // Fully visible if top is within 750px
  if (containerTop < 750) {
    setSlideshowOpacity(1);
    return;
  }
  
  // Fully hidden otherwise
  setSlideshowOpacity(0);
}
```

**Applied to:**
- GARDENS title
- Slideshow container (gallery)
- Dots pagination
- See More button

### Logo Behavior
**File:** `src/styles/mobile-header.css`

**Current Fade Effects:**
- Fade out (0ms instant): `.mobile-header.logo-fade-out`
- Fade in (333ms smooth): `.mobile-header.logo-fade-in`
- Footer logo matching behavior

**Current State Variables in App.js:**
- `isScrolledPastH1` - logo positioning based on video header center
- `slideshowOpacity` - visibility threshold for slideshow elements

### Mini Logo Hide Content Effect
**Status:** NOT IMPLEMENTED

**Issue:** Attempted to add clip-path/mask to hide content behind mini logo, but it didn't work as expected.

**Potential Approaches:**
1. Use `clip-path` to create circular mask around mini logo
2. Use CSS `mask-image` with radial gradient
3. Add pseudo-element with `box-shadow` to darken area behind logo
4. Explore if it was merged from another branch that should be restored

## To Investigate Later
1. Check if mini logo hide effect was previously implemented in another branch
2. Review git history for related changes
3. Test clip-path vs mask-image approach for content hiding
4. Consider z-index stacking context and whether content is underneath

## Parameters Reference
- Slideshow hidden threshold: `containerTop <= -120`
- Slideshow visible threshold: `containerTop < 750`
- Logo fade-out timing: 0ms (instant)
- Logo fade-in timing: 333ms (smooth)
- Mini logo size: 123px × 123px
- Mini logo position: bottom-center with 30px padding
