<img src="assets/icon.svg" width="64" height="64" alt="">

# angular-mfe-prescription-demo

An Angular Shell and a Prescription Remote that are built and run separately. The Shell
loads the Remote at runtime (Native Federation) and mounts it under `/prescriptions`; the
Remote lets staff search, filter and page through prescriptions, with its state in the URL.
The backend is an in-memory mock behind a swappable `PrescriptionApi`.

<!-- Screenshot placeholder: add a screenshot of the Prescriptions view in the Shell. -->

## Structure

| Folder | What it is | Port |
| --- | --- | --- |
| `shell/` | Shell app | 4200 |
| `prescription/` | Prescription Remote and its standalone harness | 4201 |
| `e2e/` | Playwright tests | |

Each folder has its own `package.json` and is installed separately. The root holds only
shared tooling (fallow, prettier, the pre-commit hook).

**Ownership.** The Shell team owns `shell/`: layout, navigation and the Remote Manifest
(`shell/public/remotes.json`), which is read at startup, so adding or moving a Remote
needs no Shell rebuild. The Prescription team owns `prescription/`; its only public
surface is the `./routes` module it exposes (a `Routes` array). The Shell knows nothing
about prescriptions, and the Remote works under any mount path, also on its own in the
Standalone Harness at `/sandbox/prescriptions`. Only Angular and RxJS are shared at runtime.
To use a real backend, change the one provider line in
`prescription/src/app/prescriptions/prescription.routes.ts`.

## Decisions and assumptions

- Architecture decisions: [`docs/adr/`](docs/adr/).
- Requirements, with every assumption tagged: [`specs/02-specification.md`](specs/02-specification.md)
  (constitution, plan and task list are next to it in [`specs/`](specs/)).

## Setup

Requires Node 26.

```sh
nvm use
git config core.hooksPath .githooks

npm install
(cd shell && npm install)
(cd prescription && npm install)
(cd e2e && npm install)
```

## Run

```sh
cd prescription && npm start   # http://localhost:4201/sandbox/prescriptions
cd shell && npm start          # http://localhost:4200
```

## Test

```sh
cd shell && npm test           # unit tests
cd prescription && npm test    # unit tests
cd e2e && npm test             # e2e; starts both apps if they are not running
npm run audit                  # fallow, at the root
```

## Known limits

- `@boundary` (the Shell's error boundary around the page) is a developer preview in
  Angular 22.2, not a stable API.
- If a Remote fails to load, the Shell shows "This Component is currently unavailable"
  until the page is reloaded: the router caches the failed load.

## How AI was used

- The work followed spec-driven gates: grilling, constitution, specification, plan, task
  list, then implementation one phase at a time. A human approved each gate and reviewed each
  phase before the next one started.
- The specs and ADRs are committed on purpose; the specs are the primary artifact, the code
  is their output.
- Agent commits carry the `[agent]` prefix and cite the requirement IDs they cover.
- The Playwright suite in `e2e/` is the acceptance check: each test title starts with the
  requirement ID it verifies.

<!-- Owner's own words go here. -->
