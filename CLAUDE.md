# GFL-Trunk

pnpm monorepo. Build check: `corepack pnpm@9.0.0 --filter @gfl/platform build`. Dev: platform on :3000 (Vite), backend on :8080 (Express + MongoDB, needs restart for route changes).

## Design tokens — binding for all UI work

**Every new or modified component MUST follow [gfl-design-tokens.json](gfl-design-tokens.json).** Read it before writing any UI code. It encodes the house style (dark sci-fi glassmorphism) as exact values: colors, alpha ramps, fluid `max(px, vw)` font steps, radii, corner brackets, shadows, blurs, gradients, motion, breakpoints.

Non-negotiables (full checklist in the file under `rules.newBuildChecklist`):

- Background is always `#0a0510`; panels are glass `rgba(2,0,3,0.3)` + `blur(20-24px)` + sector shadow — never opaque.
- Chrome text: Lexend Mega, uppercase, tracked (0.1–0.2em), bold. Body copy: Figtree, sentence case, `#FFFEF0` (never pure white).
- UI font sizes use the named fluid steps (`max(px, vw)`) — never bare px.
- Buttons/inputs radius `0.15rem`; panels `0.5rem`; corner brackets per `borders.cornerBrackets`.
- Accent tints are alpha ramps of a base RGB (`colors.alphaRamps`) — do not invent new hexes.
- Gradients at 135deg. Hover = solid accent flip (text → `#000`) + 20px glow. Focus = amber border 0.5 + 0.04 fill + 15px glow.
- Respect the 4-tier breakpoints (mobile <768 / tablet ≥768 / laptop ≥1079 / desktop ≥1800) and the low-gpu freeze contract (decorative infinite animations must tolerate being frozen; functional loaders carry `.keep-spinning`).
- Always pair `backdrop-filter` with `-webkit-backdrop-filter`.

Known contradiction (see `meta.knownContradiction`): `C.gold` is `#f97316` but frames/hovers use `#ffae00`. Per surface pick ONE: amber `#ffae00` for brand/frame/marketing, orange `#f97316` for dashboard/form.

## Hard constraints

- Raw `LC_ORB` codes are login credentials: never store or return them from the backend (SHA-256 hash only); `publicOrb` is render-only.
- Nebula palette stays purple/orange/amber/violet with curvy cloud formations.
