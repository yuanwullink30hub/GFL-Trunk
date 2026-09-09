# @gfl/desktop

The Garden For Life desktop app: the platform UI plus the one thing a browser cannot give
it — a real folder on the user's own machine, chosen by them, that we never see.

See [docs/LOCAL_WORKSTATION_CONTRACT.md](../../docs/LOCAL_WORKSTATION_CONTRACT.md) for what
lives in that folder and why, and Terms art. 5a/5b for what the user was told.

## Running it

```bash
cd apps/desktop
pnpm install --ignore-workspace     # NOT a plain `pnpm install` — see below
pnpm run start
```

`pnpm run start` syncs the built platform UI into `ui/` and launches Electron. Build the
platform first if you haven't:

```bash
corepack pnpm@9.0.0 --filter @gfl/platform build
```

## Two things that will waste your time if nobody tells you

**`pnpm install` alone does nothing here.** This package is deliberately excluded from the
workspace in `pnpm-workspace.yaml`, because Electron is a ~200MB devDependency that every
Cloudflare and Render build would otherwise download for a build that never touches it.
A plain `pnpm install` walks up to the workspace root, sees this is not a member, and
installs nothing. Use `--ignore-workspace`.

**`ELECTRON_RUN_AS_NODE` breaks the launch.** Some terminals and IDE integrations set it.
With it set, Electron runs as plain Node, `require('electron')` returns a *path string*
instead of the API, and you get `Cannot read properties of undefined (reading 'isPackaged')`
— which looks like an app bug and is not. Clear it for the launch:

```bash
env -u ELECTRON_RUN_AS_NODE pnpm run start     # bash
$env:ELECTRON_RUN_AS_NODE=$null; pnpm run start # PowerShell
```

## Layout

```
src/paths.js       containment — validates every path component, REFUSES symlinks
src/workspace.js   the folder contract: named operations only, no arbitrary paths
src/main.js        window, security posture, the complete IPC surface
src/preload.js     the bridge — read this as the security contract
scripts/sync-ui.js copies platform/dist in, strips maps, injects the CSP
test/              51 cases, written from the attacks rather than the happy path
```

## Why there is no `read(path)` / `write(path)`

There was. Two rounds of adversarial review found twenty-two ways to abuse the path
argument — traversal, NTFS alternate data streams, Windows reserved device names,
symlink-following deletes, extension bypasses. Every one of them existed only because the
renderer could name a path, and nothing the product does requires that.

So the bridge names things instead of locating them: `saveReport`, `readProfile`,
`writeToolState`, `revokeConsent`. The only caller-supplied identifiers that reach disk are
a tool id and a report or output name, each validated as a single plain segment. The attack
class is absent rather than defended against.

If you add an operation, add it as a **named** one. Do not reintroduce a path parameter.

## Packaging

```bash
pnpm run dist:win     # NSIS installer
pnpm run dist:mac     # dmg, arm64 + x64
```

Both are **unsigned** during the beta, so Windows shows a SmartScreen warning and macOS
Gatekeeper blocks the app until the user allows it in System Settings. That is stated in
Terms art. 5b rather than hidden. To sign, add credentials to `electron-builder.yml`:
Apple needs a Developer ID and notarisation; Windows needs an OV certificate or Azure
Trusted Signing.

`RELEASE.available` in
[WorkspaceTab.jsx](../platform/src/components/assessment/WorkspaceTab.jsx) stays `false`
until the installers are actually published — flip it, and check the filenames still match
`artifactName` in `electron-builder.yml`.
