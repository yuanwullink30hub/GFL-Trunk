// Headless assessment data + scoring (no React, no bundled assets).
// archetypeImages exposes /images/... public-path strings (served by the
// consuming app's public/ dir), not bundled imports. Its entries are ALL null
// right now - the 72-era portraits were retired with the 72-matrix and the 132
// artwork is still in production, so no portrait renders anywhere.
export * from './data/index.js';
