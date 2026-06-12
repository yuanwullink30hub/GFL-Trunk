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

## Post-migration comparison
Re-capture the same table after the Vite build and compare per-entry. Watch in
particular: three.js chunk size (Vite/rollup tree-shaking should help), main chunk,
and total. Record results below when the migration build is green.
