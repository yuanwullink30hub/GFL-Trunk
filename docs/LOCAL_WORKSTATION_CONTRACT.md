# Local Workstation Contract

**Status:** draft v0.3 — 2026-09-17 (v0.2 2026-09-16, v0.1 2026-09-09) · §7a anonymous tool calls is binding
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
│     └─ 2026-09-27-usurper.pdf  # <date>-<slug>.pdf; same name again → -2, -3 …
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
- Report files are named by the app, never by the page: the date from the clock, a slug derived
  from an optional label (the archetype name, article dropped, ASCII only, ≤ 40 characters), and
  a numeric suffix when the name is taken. Only PDF bytes are accepted.

---

## 3. manifest.json

```jsonc
{
  "schemaVersion": 1,          // integer, incremented on breaking layout change
  "folderId": "uuid",          // generated once, identifies this folder
  "accountId": "…",            // the account this folder belongs to — bound at the first grant
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

**One folder, one account.** `accountId` is set when the logged-in user chooses the folder. The
same account again is a no-op; a different account is refused, and the platform forgets that
folder again rather than read or write someone else's data (shared computers). A folder counts as
*ready* only when it is connected AND bound to the account that is logged in.

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
- **In the browser:** not shipped (decision 2026-09-16). A browser has no folder access; the
  personal-data tools stay locked there and the page offers the desktop app instead. (A browser
  path would have been `showDirectoryPicker()` — Chromium only, re-permission on every visit.)

At the grant moment the user is told, in plain language: what gets written there, that
Garden For Life cannot see it, that it is not backed up anywhere, and that keeping it
safe is theirs to do.

### 5a. First run (decided 2026-09-16)

1. The report PDF is uploaded → the orb is activated → the account card (name, email, password,
   consents) → email verification when it is on.
2. **The first thing asked after that is the workstation**, with the reason: the same
   explanation as the Werkruimte tab (Terms 5a/5b, privacy 6), the responsibility warning, then
   - in a browser: the desktop app download for their OS (installers on Cloudflare R2,
     `downloads.gardenforlife.nl` — Pages caps files at 25 MB);
   - in the app: the folder picker. On a grant the uploaded report goes straight into
     `profile/reports/` and a copy of the partial profile into `profile/partial.json`.
3. They may continue without a folder. The account, public card and Verbonden work at once;
   **every tool that works with personal data stays locked** until this account's folder is
   ready, and a reminder explains why once per session.

Later report uploads (Privé) are saved into the folder too when it is ready.

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

## 7a. Anonymous tool calls — binding for every tool (decided 2026-09-17)

The report is decoupled from the account; tool use is decoupled the same way. **Every request a
tool sends to the platform — a model call, an engine run, anything — must be untraceable to the
account, the device and the folder.** A tool that cannot follow this rule does not ship.

### The rules

1. **One road.** A tool reaches the server only through `callTool(toolId, input)`
   (`packages/api-client/src/toolTickets.js`). No tool code calls `fetch` to the API itself, and no
   tool adds an endpoint outside the gateway.
2. **No account on the wire.** Tool requests carry no account token and no cookies
   (`credentials: 'omit'`). The gateway (`POST /api/tools/run/:toolId`, `apps/backend/routes/tools.js`)
   refuses any request that has either.
3. **Access is proven with anonymous tickets.** The app holds blind-signed one-use tickets
   (RFC 9474, RSABSSA-SHA384-PSS-Randomized). Tickets are signed without the server seeing them, so a
   spent ticket cannot be linked to the account that fetched it. Fetching tickets
   (`POST /api/tools/tickets`) is the only account-bound step; it records a monthly **count** per
   account, never the tickets.
4. **No identifiers in the input.** Input is what the tool computes on — never an account id,
   folder id, device id, e-mail, token, crystal code or the person's name. `callTool` refuses such
   fields before anything is sent; free text is scrubbed of names the same way uploads are
   (`apps/backend/services/uploadRedaction.js`) when a tool accepts free text.
5. **Timing is decoupled.** Tickets are fetched in batches at quiet moments (a random delay after
   the folder is ready, then on an idle timer) — never as part of a tool call. While a tool call
   runs, the private window is open: no account request goes out, and background account calls
   resume only after a random delay.
6. **The server keeps nothing that points back.** Tool handlers are pure — `handler(input)` gets
   the JSON input and nothing else (no request, headers, IP, user; `apps/backend/services/toolRegistry.js`).
   They do not log or store input or output. Model calls carry no user metadata. The gateway keeps
   only SHA-256 hashes of spent tickets (against replay), expiring with their month. No request
   logging with IP addresses on the tool routes.
7. **Results come back to the folder.** Output is written to `tools/<id>/` by the app. Nothing is
   stored server-side.
8. **Sharing is the exception, and it is visible.** Anything a user deliberately publishes to the
   network (Verbonden, the public card) is account-bound by nature. A tool that offers sharing
   makes it a separate, clearly labelled step through the normal account API — never a side effect
   of a tool call.

### How it works

| Step | Who | Account-bound? | Stored server-side |
|---|---|---|---|
| `GET /api/tools/key` | app | no | the month's key pair (private key encrypted) |
| `POST /api/tools/tickets` — blinded values | app, logged in | **yes** | `{ userId, epoch, count }`, expires with the month |
| unblind, keep tickets locally | app | — | — |
| `POST /api/tools/run/:toolId` + `X-GFL-Ticket` | app, anonymous | no | `{ hash }` of the spent ticket, expires |

- Keys rotate monthly (`epoch` = `YYYY-MM`); tickets of the current and previous month redeem.
- Limit: 300 tickets per account per month (`TICKETS_PER_EPOCH`), max 50 per request. Accounts
  whose access has expired get no tickets.
- A new tool registers with `registerTool({ id, handler, maxInputBytes })` and calls
  `callTool(id, input)` from the app. `ping` is the built-in end-to-end check.

### Not yet covered

- **IP address.** The host still sees the connecting IP. Tool routes log none; the stronger step
  is Oblivious HTTP (a relay that sees the IP but not the content, e.g. Cloudflare Privacy
  Gateway). Planned, not built.
- **Content fingerprinting.** Unusual input can itself be recognisable. Tools send the smallest
  input that does the job.

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
