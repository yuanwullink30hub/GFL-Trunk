import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// Thin admin app — renders the shared @gfl/admin-ui dashboard. No three.js.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  server: { port: 3002 },
  build: {
    target: 'es2020',
    sourcemap: true,
    // jspdf/jspdf-autotable/recharts are transitive via @gfl/admin-ui/@gfl/brands —
    // let Vite auto-split rather than naming them as manualChunk entries.
  },
});
