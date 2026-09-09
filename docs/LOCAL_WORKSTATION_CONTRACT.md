# Local Workstation Contract

**Status:** draft v0.1 — 2026-09-09
**Scope:** the boundary between the Garden For Life platform and the client's own machine.

The platform owns the model. The client owns their data. This document is the seam:
what lives where, what crosses it, and what every future tool may assume.

---

## 1. The boundary

| Side | Holds | Never holds |
|---|---|---|
| **Platform (server)** | Deltawerken corpus, prompt/instruction layer, any computation that needs the corpus, the partial profile, the spent-code ledger, credentials, mailbox | The report, raw answers, computed profiles, tool output, anything in the client folder |
| **App (client machine)** | The client folder — report PDFs, full profile, all tool output, plans, goals, tasks | Corpus, prompt layer, other users' data |
| **The wire** | Derived inputs up, results down | Raw records, ever |

Two rules follow, and every tool is held to them:

1. **Minimum viable input.** A tool sends up the smallest derived value that lets the
   server compute — the normalised 12-point shape vector, never the raw answer log.
2. **No retention.** Anything received to compute a result is discarded when the response
   is written. Nothing a tool sends up is stored.

---

## 2. Folder layout

The user picks (or the app creates) one directory. Everything lives under it. Flat and
readable — a person must be able to open this folder and understand what they own.

```
Garden For Life/
├─ manifest.json              # schema version, folder id, created/updated, tool ledger
├─ profile/
│  ├─ partial.json            # mirror of the server-side account profile
│  ├─ full.json               # the complete computed profile (server never keeps this)
│  └─ reports/
│     └─ 2026-09-27-maverick.pdf
├─ tools/
│  └─ <tool-id>/              # one directory per tool, owned by that tool
│     ├─ state.json
│     └─ output/
├─ consent/
│  └─ ledger.json             # append-only record of what was granted, when
└─ .backups/
   └─ <iso-timestamp>/        # pre-migration copies, see §4
```

**Rules**

- Every file is JSON or PDF. No binary formats, no databases, nothing that needs our
  software to read. If Garden For Life disappears, the folder is still legible.
- A tool writes only inside `tools/<its-own-id>/`. It reads `profile/` and its own
  directory. It never writes another tool's directory.
- No file is required for the app to boot. A missing or corrupt file degrades that one
  feature; it never blocks the workstation.

---

## 3. manifest.json

```jsonc
{
  "schemaVersion": 1,          // integer, incremented on breaking layout change
  "folderId": "uuid",          // generated once, identifies this folder
  "accountId": "…",            // the account this folder belongs to
  "createdAt": "2026-09-27T…",
  "updatedAt": "2026-09-27T…",
  "appVersion": "0.1.0",       // last app version that wrote here
  "tools": {                   // per-tool footprint
    "hypercube": { "schemaVersion": 1, "lastRun": "…" }
  }
}
```

`schemaVersion` is checked on every open. Newer folder than the app → refuse to write and
tell the user to update. Older folder → migrate (§4).

---

## 4. Migration — the rule that matters most

The folder is the only copy. There is no server-side backup and there never will be. So:

1. **Never overwrite in place during a migration.** Copy the whole folder into
   `.backups/<iso-timestamp>/` first, then write the new version.
2. **Migrations are forward-only and idempotent.** `v1 → v2 → v3`, each step re-runnable.
3. **A failed migration leaves the original intact.** Write to a temp path, verify it
   parses, then swap.
4. **Keep the last three backups**, prune older ones. Small files, cheap insurance.
5. **A tool changing its own format** bumps only `tools.<id>.schemaVersion` and migrates
   only its own directory.

---

## 5. Permission

One directory handle, granted once.

- **In the app (Electron):** native filesystem access. The user picks the folder at
  first run; the path is stored in app config. No re-prompt, no expiry.
- **In the browser (if ever shipped):** `showDirectoryPicker()`, handle persisted in
  IndexedDB, `requestPermission({mode:'readwrite'})` on every load, re-pick flow treated
  as a normal state rather than an error. Chromium only.

At the grant moment the user is told, in plain language: what gets written there, that
Garden For Life cannot see it, that it is not backed up anywhere, and that keeping it
safe is theirs to do.

---

## 6. Consent ledger

Art. 9 consent must be specific to a purpose. "Generate my report" does not cover
"build me a three-month plan". Each tool records its own grant, append-only:

```jsonc
{
  "entries": [
    {
      "toolId": "three-month-plan",
      "purpose": "Build a personal plan from your profile and stated goals",
      "dataUsed": ["profile.shapeVector12", "tools/three-month-plan/goals"],
      "sendsToServer": ["shapeVector12"],
      "grantedAt": "2026-10-04T…",
      "revokedAt": null
    }
  ]
}
```

Mirrored on the account so consent survives a lost folder. A tool with no entry does not
run. Revocation deletes that tool's directory.

---

## 7. What crosses the wire

| Direction | Payload | Retained |
|---|---|---|
| Up (tool → platform) | Derived vectors only — shape, position, magnitude | No |
| Down (platform → app) | Computed results, tool code, corpus-derived output | Written to the folder |
| Up (account sync) | Partial profile changes — display name, listed flag | Yes, that is the account |

The partial profile is the sole exception to "nothing is stored". It stays server-side
permanently because other people read it: the public card, the Verbonden directory, the
connection layer. It is render data — shape geometry, archetype name, display name — and
carries no answers, no scores, no analysis.

---

## 8. Client-side vs server-side

| Runs locally | Runs on the platform |
|---|---|
| Orb rendering (`orb-engine`) | Anything reading `deltawerken_corpus.json` |
| Geometry, shape math, `lineType` | Report generation (model call) |
| File handling, migrations, backups | The prompt/instruction layer |
| Anything not needing the corpus | `cMagnitude`, `cRuntime`, `connectionMatrix` |

The test: **does it need the corpus?** If no, it runs on the user's machine and the data
never leaves. If yes, it stays server-side and receives a derived vector — because
shipping the corpus to the browser would put 620KB of proprietary model in the network tab.

---

## 9. Cloud purge

Once the folder is established the user may purge server-side data. This deletes:

- the full computed profile and any cached assessment data
- pre-account artefacts (`kaartDrafts`)
- generated report references

It **keeps**, and says so plainly at the button:

- credentials — email, password hash
- the spent code hash — otherwise the PDF could mint a second account
- the partial profile — otherwise the user disappears from the Verbonden directory
- the mailbox — messages arrive while the machine is off

Total erasure is a different action: account deletion, which removes all of the above.

---

## 10. Open decisions

- Does a purged user stay listed in the Verbonden directory? *(assumed yes — the card is
  render-only and the directory depends on it)*
- Does PDF-upload login stay a permanent, unrevocable credential once an account exists?
- Multi-device: silos, home-device, or encrypted blob. *(silos assumed for launch)*
