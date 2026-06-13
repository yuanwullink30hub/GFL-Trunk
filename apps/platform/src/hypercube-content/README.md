# hypercube-content

Staging area for interactive components that will eventually **live inside the
hypercube**, rather than as standalone map sections.

These modules are intentionally **not mounted** anywhere yet. They are parked
here, fully intact, until we begin inhabiting the hypercube with content.

## Parked components

- **`filosofie/`** — the Filosofie "playbox" (Universal Constants symbol drawer,
  the 3D Sacred Geometry playground, and the Entropy/Negentropy graph).
  Previously rendered by `src/pages/FilosofiePage.jsx`; that wrapper now renders
  nothing. Entry point: `filosofie/index.jsx` (or `filosofie/FilosofiePage.jsx`).

  To re-mount, import the default export and render it where the hypercube
  surfaces its inner content:

  ```jsx
  import FilosofiePlaybox from '../hypercube-content/filosofie';
  // <FilosofiePlaybox isVisible={...} onBack={...} />
  ```
