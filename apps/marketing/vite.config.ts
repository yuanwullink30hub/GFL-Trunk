import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// Thin marketing app — renders the shared @gfl/brands pages. No three.js.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  server: { port: 3001 },
  build: {
    target: 'es2020',
    sourcemap: true,
    // framer-motion/recharts are transitive via @gfl/brands — let Vite
    // auto-split them rather than naming them as manualChunk entries.
  },
});
