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
  build: {
    target: 'es2020',
    sourcemap: true,
    rollupOptions: {
      output: {
        // Split the heavy 3D libs into SEPARATE chunks (don't bundle them into one
        // mega-chunk). A single 807 kB three+fiber+drei+postprocessing chunk
        // evaluates as one long synchronous main-thread block (freezing the UI /
        // passkey). Separate chunks evaluate as smaller pieces, and preloadUtils'
        // `yieldToMain` between imports lets the browser breathe between them.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          // Keep the three.js ecosystem together (three + its stdlib/bvh extend
          // and depend on three's internals — splitting them apart breaks init
          // order). Split it from the r3f/drei half so each evaluates as its own
          // (smaller) block with a yield between, instead of one 2.67 MB freeze.
          if (id.includes('/three/') || id.includes('three/build') ||
              id.includes('three-stdlib') || id.includes('three-mesh-bvh') || id.includes('/troika')) {
            return 'three';
          }
          if (id.includes('@react-three/postprocessing') || id.includes('/postprocessing/') || id.includes('/n8ao/')) return 'postprocessing';
          if (id.includes('@react-three')) return 'r3f';
          if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('jszip') || id.includes('canvg') || id.includes('dompurify')) return 'export-vendor';
          if (id.includes('recharts') || id.includes('/d3-') || id.includes('victory')) return 'chart-vendor';
          if (id.includes('framer-motion') || id.includes('motion-dom') || id.includes('motion-utils')) return 'motion-vendor';
          return undefined;
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
