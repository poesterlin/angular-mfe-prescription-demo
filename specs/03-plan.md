# Plan

**How** the specification (`specs/02-specification.md`) is built within the
constitution (`specs/01-constitution.md`). Requirement IDs refer to the specification,
rule IDs (`C-…`) to the constitution. Versions and package behaviour below were
checked against a throwaway two-app build (Angular 22.2.6, Native Federation 22.2.5,
Playwright 1.64.0, Node 26.5.1) on 2026-11-12.

## 1. Repository layout

```
/                       root: shared tooling only (fallow, pre-commit hook, prettier, .nvmrc)
  shell/                Shell (Angular app, port 4200)
  prescription/         Prescription Remote + Standalone Harness (Angular app, port 4201)
  e2e/                  Playwright suite (own package.json)
  specs/  docs/         specifications, ADRs, task brief
  GLOSSARY.md  README.md  AGENTS.md
```

- The current root Angular app (with the `@boundary` already in place) **becomes the
  Shell**: `src/`, `public/`, `angular.json`, `tsconfig*.json` and the Angular
  dependencies move to `shell/` with `git mv`, so history is kept. The Angular project
  is renamed to `shell`, because federation uses the project name. (C-A1)
- `prescription/` is scaffolded with the Angular CLI 22.2, same flags as the Shell
  (zoneless, CSS, no SSR, routing). Of the generated extras, its `README.md`,
  `.vscode/` and `.editorconfig` are deleted (the root ones apply), and the unused
  `@angular/forms` dependency is removed.
- The root `package.json` keeps only `fallow` and `prettier` and the `audit` script.
- `.nvmrc` at the root pins Node 26. Nothing enforces it (Node 25 still runs with a
  warning), so the README quick start says `nvm use`. (C-T4)
- `.gitignore`: the root file switches from anchored paths (`/dist`, `/.angular/cache`,
  `/out-tsc`, `/coverage`) to unanchored ones (`dist/`, `.angular/`, `out-tsc/`,
  `coverage/`) so they match inside each project, and adds `e2e/test-results/` and
  `e2e/playwright-report/`. No per-project `.gitignore` files.

### Federation setup

`ng add @angular-architects/native-federation@22.2.5`, then corrected by hand:

| | `prescription/` | `shell/` |
| --- | --- | --- |
| Command | `--type remote --port 4201` | `--type host --port 4200` (emits `initFederation({})`, no manifest file) |
| `exposes` | `'./Component'` → `'./routes': './src/app/prescriptions/prescription.routes.ts'` | none |
| `bootstrap.ts` | kept as generated | rewritten to export `bootstrap(remotes, loader)` |
| Version range | `^22.2.5` → `~22.2.5` (C-T3) | same |

- Shared config stays as generated:
  `fromPackageJson({ singleton: true, strictVersion: true, requiredVersion: 'auto', build: 'package' }).patch(['@angular/*'], …)`.
- `'tslib'` is added to `skip` in both apps; otherwise it is shared too, and C-A7 allows
  only Angular and RxJS. Verified: the built `remoteEntry.json` then lists only
  `@angular/*` and `rxjs`.
- The schematic also adds `es-module-shims` (dependency) and
  `@softarc/native-federation-orchestrator` (devDependency) to both apps. They are
  part of the federation tool (C-T3), and approving this plan approves them (C-T6).

## 2. Shell

```
shell/
  public/remotes.json              Remote Manifest (served by the Shell, AC-M1)
  src/main.ts                      fetch + parse manifest → initFederation({}) → bootstrap
  src/bootstrap.ts                 export bootstrap(remotes, federation): bootstrapApplication(App, createAppConfig(…))
  src/app/remotes/
    remote-definition.ts           RemoteDefinition type + parseManifest(); no Angular imports
    remote-routes.ts               RemoteDefinition[] → Routes (loadChildren + fallback)
    federation-loader.ts           initRemoteEntry + loadRemoteModule → Routes
    remotes.token.ts               REMOTES injection token (feeds the navigation)
    remote-unavailable.ts          generic fallback page, "This Component is currently unavailable" (AC-E1)
  src/app/welcome/welcome.ts       "Welcome" page (AC-S2)
  src/app/app.{ts,html,css}        layout: header, "Main navigation", @boundary + outlet (AC-E2, kept)
  src/app/app.config.ts            createAppConfig(remotes, load); routes = Welcome + remote routes + '**' → ''
```

**Startup.** `main.ts` must not import Angular: Angular is a shared singleton and only
exists after `initFederation` resolves. It fetches `remotes.json`, runs
`parseManifest` (skips and logs invalid entries; non-list or failed fetch → `[]`,
AC-M2), calls `initFederation({}, { hostRemoteEntry: { url: './remoteEntry.json' } })`, then `import('./bootstrap')` and hands it the
parsed list and the federation result.

**Loading a Remote.** Remotes are registered lazily, on first navigation to their
route, using the non-deprecated API on the `initFederation` result (verified to work
for a Remote not registered at init):

```ts
loadChildren: () => fed.initRemoteEntry(remoteEntry, name)
  .then(f => f.loadRemoteModule(name, exposedModule))
  .then(m => m.default)
  .catch(() => unavailableRoutes())   // AC-E1
```

Lazy registration keeps startup to one fetch (the manifest) and puts each Remote's
failure on its own route. The router caches a `loadChildren` result, so after a
failure the "unavailable" page stays until reload; the README says so.

**Navigation** is one `routerLink` per manifest entry plus "Home" (AC-S3). The
manifest shipped in `public/remotes.json`:

```json
[{ "name": "prescription", "remoteEntry": "http://localhost:4201/remoteEntry.json",
   "exposedModule": "./routes", "routePath": "prescriptions", "label": "Prescriptions" }]
```

## 3. Prescription Remote

```
prescription/src/app/
  prescriptions/
    prescription.routes.ts         PUBLIC: default export Routes; route-level providers (C-A4, C-A6)
    model/                         Prescription, PrescriptionQuery, PrescriptionPage, defaults, validation,
                                   normalizeQuery (invalid → default). No Angular.
    data-access/
      prescription-api.ts          abstract class PrescriptionApi { search(q): Observable<PrescriptionPage> }
      mock-prescription-api.ts     in-memory implementation over the seeded data (AC-D4)
      prescription-seed.ts         seeded generator: 1,000 rows, ~200 Insurants, ~30 Medications (AC-D3)
      query-params.ts              URL ⇄ PrescriptionQuery, with validation and defaults (AC-U1, AC-U5)
    feature/
      prescription-page.ts         container: reads URL, calls API, writes URL, error + Retry (AC-E3)
      page-correction.ts           pure: which page to put in the URL after a past-the-end answer (AC-U6)
    ui/
      prescription-filters.ts      Search, Insurant ID, from/to, Reset, field messages (AC-Q1–Q5)
      filter-diff.ts               pure: which filter fields changed
      prescription-table.ts        table, result count, empty state (AC-F1–F5)
      prescription-paginator.ts    range, position, buttons, "Rows per page" (AC-Q6, AC-Q7)
  app.routes.ts                    harness: 'sandbox/prescriptions' → loadChildren(prescription.routes),
                                   '' → redirect there, '**' → NotFound (AC-H2, AC-H3)
  app.{ts,html}                    harness layout with "Standalone mode" banner
```

Exposed as `'./routes'` with `name: 'prescription'` (AC-I1). The harness loads the same
file through a normal lazy import, so standalone and composed run the same code.

Folder rules (C-K3): `ui/` has only signal inputs and outputs and injects nothing;
`model/` imports nothing from the other folders; only `data-access/` knows the URL
format and the API.

**Swapping the backend** (C-A10) is one line in `prescription.routes.ts`:
`{ provide: PrescriptionApi, useClass: MockPrescriptionApi }` → `HttpPrescriptionApi`.
`search` returns an `Observable` so an `HttpClient` implementation fits unchanged.

### Data flow (one direction, AC-U*)

```
user input → container builds next query → router.navigate([], { relativeTo, queryParams, replaceUrl? })
URL → toSignal(queryParamMap, { requireSync: true }) → computed(parseQuery) → query signal
query signal → rxResource({ params: query, stream: api.search }) → page → ui inputs
```

- Navigation is always relative to the activated route (C-A5, AC-I2).
- `replaceUrl: true` for Search and Filter changes, a new entry for page, page size
  and Reset (AC-U3). Only non-default values go into the URL (AC-U1).
- Page past the end (AC-U6): when the returned `page` differs from the requested one,
  the container navigates with the returned page and `replaceUrl: true`. The resource
  pairs every answer with the query it was loaded for, and `correctedPage` ignores an
  answer for an older query (otherwise a stale answer would undo a click on "Next"),
  and the error state.
- API failure (AC-E3): the container shows the alert and a "Retry" button bound to the
  resource's `reload()`. Built, untested (C-Q1 exception).

### Filter fields and the URL (AC-Q1–Q5, AC-U4)

Plain `[value]` bindings are not enough: Angular only rewrites a field when the bound
value changes, so a field can keep text the URL no longer has. The filters component
therefore holds one **draft** per field:

- Each draft is a `linkedSignal` of the URL value, so any URL change (Back, Forward,
  reload, Reset) overwrites it.
- Typing updates the draft. Valid drafts are emitted (Search after a 300 ms debounce);
  invalid drafts show their field message.
- **Invalid edit removes the filter**: editing an applied Insurant ID or date into an
  invalid value emits "no filter" for that field, so the URL never keeps a value the
  field no longer shows ("is not applied", AC-Q2, AC-Q4).
- **URL echo**: when the component itself caused a URL change, the draft keeps what the
  user typed instead of taking the URL's (normalised) value. Without this, an invalid
  Insurant ID would be wiped from the field the moment its filter is removed.
- **A "to" before "from"** drops only the "to" bound; "from" stays applied.
- **Reset** clears every draft explicitly, cancels a pending Search debounce, then
  emits reset. This covers the cases where the URL value does not change (`''` to `''`)
  or a debounced value would land after Reset.
- Plain inputs and signals, not `@angular/forms` (C-T6).

### Signal syntax (C-K2a)

| Concern | Used | Not used |
| --- | --- | --- |
| Component inputs and outputs | `input()`, `input.required()`, `output()` | `@Input`, `@Output`, `EventEmitter` |
| Field drafts | `linkedSignal()` from the URL value | `[(ngModel)]`, form controls |
| Host bindings and listeners | `host: { … }` metadata | `@HostBinding`, `@HostListener` |
| Derived state | `computed()` | getters, Subjects |
| URL to state | `toSignal(route.queryParamMap, { requireSync: true })` → `computed(parseQuery)` | `subscribe` in `ngOnInit` |
| Data loading | `rxResource({ params, stream })` with `value()`, `status()`, `error()`, `reload()` | manual `subscribe`, `async` pipe |
| Side effects | `effect()` only for non-view effects (AC-U6 URL correction) | `ngOnChanges` |
| DI | `inject()` | constructor parameters |

The Search debounce is the one RxJS pipeline in a component:
`toObservable(draft) → debounceTime(300) → takeUntil(reset) → outputFromObservable(…)`,
so the component's public API is still a signal-style `output()`.

### Formatting

Default `en-US` locale: `DecimalPipe` gives "1,000" (AC-F4, AC-Q6), `DatePipe` with
the explicit format `dd.MM.yyyy` (AC-F2). Dates travel as ISO `yyyy-MM-dd` strings in
the model and the URL; the first table test confirms there is no timezone shift.

### Seeded data (AC-D3)

A small PRNG (mulberry32, ~10 lines) with a fixed seed picks from in-code lists of
first names, last names and Medications. Generated once per page load, sorted by
Prescription Date descending, then id (AC-F3).

## 4. CSS (C-S1–C-S4)

Verified: an unlayered Remote rule beats the Shell's `@layer shell` rule, but anything
the Remote does **not** set itself is inherited from whichever page hosts it, which
breaks AC-I3. So:

- Shell `styles.css`: a reset inside `@layer shell { … }`. Layout and navigation styles
  live in the Shell's components with `shell-` classes.
- Remote: all styles in its components with `rx-` classes. The page component's
  `:host` sets every inherited or reset-affected property it relies on: `font-family`,
  `font-size`, `line-height`, `color`, `box-sizing`, and the margins of its headings,
  paragraphs and table.
- The Remote's `styles.css` sets only the harness page's `body` margin and background,
  nothing the Remote inherits.
- AC-I3 compares exactly those properties on the heading, a table header cell, a body
  cell and the Search input, standalone vs composed.
- No `ViewEncapsulation.None`, no `::ng-deep`.

## 5. Testing (C-Q1–C-Q5)

```
e2e/
  package.json                     @playwright/test 1.64.0 (exact); script "test"
  playwright.config.ts             webServer: [npm start in ../prescription, npm start in ../shell]
                                   projects (testMatch per project):
                                     standalone  4201, mountPath /sandbox/prescriptions: tests/remote/**, tests/harness.spec.ts
                                     composed    4200, mountPath /prescriptions:         tests/remote/**, tests/shell/**
                                     contract    no baseURL:                             tests/contract.spec.ts
  fixtures.ts                      `mountPath` option fixture
  tests/remote/view.ts             locators and helpers for the Remote specs
  tests/remote/*.spec.ts           table-and-data, search-filter-paging, url-state: AC-F*, AC-Q*, AC-U*, AC-D*, AC-I2
  tests/shell/*.spec.ts            AC-S*, AC-M*, AC-E1
  tests/harness.spec.ts            AC-H*
  tests/contract.spec.ts           AC-I1 (fetch remoteEntry.json), AC-I3 (both apps in one test)
```

- Each test title starts with its requirement ID. AC-I2 has its own test (after paging
  and filtering, the URL path is still `mountPath`), which runs in both projects.
- The ID coverage check is a one-line shell command in the exit check: every `AC-…` ID
  in the specification except AC-E2 and AC-E3 appears in a test title.
- Manifest variations (AC-M2, AC-M3, AC-E1) use `page.route` to serve a different
  `remotes.json` or to abort `remoteEntry.json`; no test-only code in the apps.
- Data tests avoid seed-specific magic numbers: they assert "1,000 results", that every
  visible row matches the Search or Filter, and that two loads show the same rows (AC-D3).
- **Vitest is planned, not optional, for the branching logic**: `parseManifest`,
  `query-params.ts`, `normalizeQuery`, the mock's search and paging, and the pure helpers
  `changedFilters` and `correctedPage` (plus the filters' draft handling). fallow's complexity gate (CRAP
  score, C-K4) fails untested functions of cyclomatic complexity ≥ 5, and these are the
  functions that reach it. They also make edge cases (AC-U5, AC-D4) cheaper to pin than
  through the browser. The Shell's existing `app.spec.ts` (covering the `@boundary`)
  is kept.

## 6. Tooling changes

Applied in the phase where the finding first appears, not up front:

- `.fallowrc.json`:
  - `entry` adds `"**/src/styles.css"` (global stylesheets, referenced only from `angular.json`).
  - `ignoreDependencies: ["es-module-shims", "@softarc/native-federation-orchestrator"]`
    (loaded by the federation builder, never imported).
  - `ignoreBinaries: ["playwright"]` is removed once `e2e/` has Playwright installed,
    if fallow stays clean without it.
  - `ignoreUnresolvedImports` stays empty: Remotes are loaded by URL.
- `fallow workspaces` already detects `shell`, `prescription` and `e2e` without a
  `workspaces` field, and the existing `entry` globs match both apps.
- The pre-commit hook stays as is.

## 7. Phases

Each phase ends with its exit check passing, a commit, and a stop for review.

| Phase | Builds | Requirements | Exit check |
| --- | --- | --- | --- |
| 1 | Move the scaffold to `shell/`, scaffold `prescription/` with federation, harness routes, banner and an empty Prescriptions page; `e2e/` with Playwright and config; `.nvmrc`, `.gitignore`, fallow | AC-H1–H3, AC-I1 | Both apps `npm run build`; those e2e tests pass; `npm run audit` clean |
| 2 | Shell federation, manifest, layout, navigation, Welcome, fallback; `@boundary` kept | AC-S1–S5, AC-M1–M3, AC-E1, AC-E2 | Those e2e tests and the Shell's Vitest pass; audit clean |
| 3 | Model, seeded mock, `PrescriptionApi`, table, filters, paginator, URL state, error + Retry, CSS isolation | AC-F1–F5, AC-D1–D4, AC-Q1–Q8, AC-U1–U6, AC-E3, AC-I2, AC-I3 | Full e2e suite and Vitest green; ID coverage check passes; audit clean |
| 4 | README (C-D1, C-D2) and spec sync | — | README review by the owner; specs match the code |

## 8. Risks

| Risk | Mitigation |
| --- | --- |
| Native Federation's dev cache gets mixed up when a production build runs next to `ng serve` (`ngDevMode is not defined`) | Do not build while serving; restart `ng serve` if it appears |
| A shared version mismatch silently loads a second copy (run-time strictness flags default to off) | Same Angular version range in both apps; the README does not claim it "fails loudly" |
| Remote load failure is cached by the router | "Unavailable" until reload; stated in the README |
| CORS for a real deployment | The dev builder already sends `Access-Control-Allow-Origin: *`; a real host must allow the Shell origin on the Remote's static files |
| `@boundary` is developer preview (AC-E2) | Stated in the README; untested by C-Q1 exception |

## 9. Deviations from the original plan

Recorded when the code was built:

- The Shell's fallback for a failed Remote is generic ("This Component is currently
  unavailable") and no longer uses the manifest label (owner's decision: simpler).
  AC-E1, the tests and the Shell's `RemoteUnavailable` follow.
- `withComponentInputBinding()` is not used in the Shell.
- `normalizeQuery` (in `model/`) is the one place that turns invalid values into defaults,
  used by both `parseQuery` and the mock (AC-U5, AC-D4).
- The paging controls are hidden when nothing matches (AC-F5).
- Two small pure helpers, `changedFilters` and `correctedPage`, were split out to keep
  components under fallow's complexity gate.
- Every Remote component sets `box-sizing` itself: the page's `:host *` rule does not
  reach child components, and the Shell's reset would otherwise change them when composed
  (found by AC-I3).
- The Standalone Harness' root selector is `app-root`; the Shell's is `shell-root`.
