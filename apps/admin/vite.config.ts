import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// The management app — runs only on the management computer, never deployed. No three.js.
// `pnpm --filter @gfl/admin live` talks to the production API; `dev` to a local backend on :8080.
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  define: mode === 'live' ? { 'import.meta.env.VITE_API_URL': JSON.stringify('https://api.gardenforlife.nl/api') } : {},
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
}));
