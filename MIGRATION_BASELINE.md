# Migration bundle baseline (pre-Vite)

Captured before starting MIGRATION_PLAN.md (DEV_PATHGUIDE task 8 / plan Phase 2),
on branch `feat/hypercube-datapage` at commit `b499c7e`, after the hypercube
landing + tasks 2–7a. CRA `react-scripts build`, sizes are **gzipped**.

## Totals
- **~1.41 MB** gzipped JS across all listed chunks
- **main chunk: 81.55 kB** (was 99.53 kB before task 3 split out NebulaBackground)
- CSS: `main` 7.8 kB

## Largest chunks (gzipped)
| size | chunk | likely contents (unverified) |
|------|-------|------------------------------|
| 330.77 kB | `628.*.chunk.js` | three.js core (hypercube + HoloEarth scenes) |
| 169.16 kB | `408.*.chunk.js` | three add-ons / drei |
| 128.09 kB | `389.*.chunk.js` | — |
| 100.90 kB | `950.*.chunk.js` | — |
|  81.55 kB | `main.*.js`      | app shell (lazy boundaries keep three out) |
|  47.16 kB | `948.*.chunk.js` | — |
|  46.36 kB | `239.*.chunk.js` | — |
|  43.73 kB | `455.*.chunk.js` | — |
|  41.97 kB | `379.*.chunk.js` | — |
|  41.37 kB | `674.*.chunk.js` | — |

(Full table is in the build output; chunk→source attribution needs source-map
analysis, to be done as part of the migration's measurement step.)

## Post-migration (Vite — apps/platform)
Captured after Phase 5 (`vite build`, target es2020). Gzipped.

| chunk | raw | gzip | notes |
|-------|-----|------|-------|
| `index.js` (app shell) | 106.6 kB | **31.6 kB** | was CRA `main` 81.55 kB gz |
| `index.css` | 41.3 kB | 7.55 kB | |
| `motion-vendor` | 114.3 kB | 37.8 kB | framer-motion |
| `index.es` | 150.8 kB | 51.6 kB | (PDF/export sub-dep) |
| `chart-vendor` | 322.6 kB | 97.1 kB | recharts |
| `export-vendor` | 622.9 kB | 186.2 kB | jspdf + html2canvas + jszip (lazy) |
| `three-vendor` | 2,666.6 kB | **807.3 kB** | three + r3f + drei + postprocessing |
| + lazy page chunks | | | DataPage, FilosofiePage, GardensPage, EyedentityPage, AssessmentIntro/ResultsModal, AdminDashboardModal, NebulaBackground … |

### Diff vs pre-migration
- **App shell:** CRA `main` 81.55 kB gz → Vite `index.js` **31.6 kB gz** (−61%). three/pdf/charts now isolated in lazy vendor chunks.
- three.js is now a single `three-vendor` chunk (807 kB gz) loaded only by WebGL routes, vs being spread across CRA chunks.
- Modern target (es2020) vs CRA's ES5 — less transpilation weight.
- Marketing (P6) and admin (P7) were **deferred** (embedded in platform — GardensPage renders brands, LoginPage launches admin), so this is single-app `apps/platform`; the 3-app split is a later incremental step.

### Notes
- Root `pnpm build` script assumes a global `pnpm` shim; in this env builds run via `corepack pnpm@9.0.0 --filter @gfl/platform build` (per-app, green).
- Platform `tsc --noEmit` reports a parser quirk on `AssessmentQuestions.jsx` (valid JSX — Vite/esbuild bundles it fine); a pre-existing JS-origin typecheck artifact, not a build blocker.
