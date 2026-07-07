import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// CRA-origin app: all JSX files renamed .js -> .jsx so plugin-react handles them.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  // @gfl/orb-engine is a CommonJS workspace package (so the Node backend can require() it).
  // pnpm symlinks it to its real path under packages/, outside node_modules, so Vite's default
  // CJS transform (node_modules-only) skips it. Opt it in for build, and pre-bundle it in dev.
  optimizeDeps: {
    include: ['@gfl/orb-engine'],
  },
  build: {
    target: 'es2020',
    sourcemap: true,
    commonjsOptions: {
      include: [/node_modules/, /orb-engine/],
      transformMixedEsModules: true,
      // Force `import X from '@gfl/orb-engine'` → module.exports (the object); the CJS engine
      // has no __esModule marker, so otherwise Rollup finds no default export.
      defaultIsModuleExports: true,
    },
    rollupOptions: {
      output: {
        // Split the heavy 3D libs into SEPARATE chunks (don't bundle them into one
        // mega-chunk). A single 807 kB three+fiber+drei+postprocessing chunk
        // evaluates as one long synchronous main-thread block (freezing the UI /
        // passkey). Separate chunks evaluate as smaller pieces, and preloadUtils'
        // `yieldToMain` between imports lets the browser breathe between them.
        manualChunks(id) {
          // Vite's virtual helper modules (CJS interop, __vitePreload, modulepreload
          // polyfill) are shared by the entry AND heavy vendor chunks. Left to default
          // placement, Rollup hoisted them INTO those vendor chunks — making the boot
          // entry statically import 786 kB of jspdf/html2canvas just to reach a 200-byte
          // helper. Pin every vite/rollup helper into one tiny chunk.
          if (id.includes('commonjsHelpers') || id.includes('vite/preload-helper')
            || id.includes('vite/modulepreload-polyfill')) return 'helpers';
          if (!id.includes('node_modules')) return undefined;
          // React runtime gets its OWN chunk. Without this, Rollup hoisted react +
          // jsx-runtime into the 'three' chunk (both shared), so the boot entry
          // statically imported three-*.js — 1.4 MB of synchronous evaluation while
          // the user stared at a frozen passkey caret, and preloadAll's staged
          // import('three') was already-paid-for. ONLY the react runtime goes here;
          // react-DEPENDENT libs (r3f/drei/react-spring) stay default-chunked (see
          // the grey-screen note below).
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'react-vendor';
          // Split ONLY the pure three.js ecosystem (no React) into its own chunk,
          // so it evaluates as a separate ~1.3 MB block (with a yield before the
          // r3f block) instead of being fused into one ~2.67 MB synchronous freeze.
          //
          // Everything React-dependent (r3f / drei / react-spring / postprocessing
          // / recharts / framer) is LEFT to Vite's default chunking — manually
          // splitting react-spring away from React broke its module-init (grey
          // screen). Default chunking preserves React's interop + init order.
          if (id.includes('/three/') || id.includes('three/build') ||
              id.includes('three-stdlib') || id.includes('three-mesh-bvh') || id.includes('/troika')) {
            return 'three';
          }
          // Pure (non-React) export libs — safe to isolate; only loaded on export.
          if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('jszip') || id.includes('canvg') || id.includes('dompurify')) {
            return 'export-vendor';
          }
          return undefined;
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
