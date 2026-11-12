# Tasks

The plan (`specs/03-plan.md`) as an ordered checklist. Boxes are ticked only after the
phase's exit check passes; then the phase is committed and work stops for review.

Task states: `[ ]` open, `[~]` in progress, `[x]` done. **Before doing anything else on a
task, the agent marks it `[~]` in this file.** A `[~]` task becomes `[x]` only when the
phase's exit check passes; if work stops early, it stays `[~]`, so the next session can
see where to resume.
Requirement IDs refer to `specs/02-specification.md`, rule IDs to
`specs/01-constitution.md`.

Commands run under Node 26 (`nvm use`). "Audit" means `npm run audit` at the root.
"ID check" means:

```sh
for id in $(grep -oE 'AC-[A-Z][0-9]+' specs/02-specification.md | sort -u | grep -vxE 'AC-E2|AC-E3'); do
  grep -rqE "test\(['\"]$id[ :]" e2e/tests || echo "uncovered: $id"; done
```

It must print nothing.

## Phase 1: Repository, Remote and Standalone Harness

- [x] 1.1 Add `.nvmrc` (`26`). (C-T4)
- [x] 1.2 `git mv` `src/`, `public/`, `angular.json`, `tsconfig*.json` into `shell/`; move the Angular dependencies and scripts (`ng`, `start`, `build`, `watch`, `test`) from the root `package.json` into a new `shell/package.json`; regenerate both lockfiles. Root keeps `fallow`, `prettier`, `audit`. (C-A1)
- [x] 1.3 Rename the Angular project to `shell` in `shell/angular.json`; fix paths. `shell/` builds and its existing Vitest passes.
- [x] 1.4 `.gitignore`: unanchor `dist/`, `.angular/`, `out-tsc/`, `coverage/`; add `e2e/test-results/`, `e2e/playwright-report/`.
- [x] 1.5 Scaffold `prescription/` with `@angular/cli@22.2` (zoneless, CSS, no SSR, routing, no git, no AI config). Delete its `README.md`, `.vscode/`, `.editorconfig`; remove `@angular/forms`.
- [x] 1.6 `ng add @angular-architects/native-federation@22.2.5 --type remote --port 4201` in `prescription/`. Fix the range to `~22.2.5`; expose `'./routes'` instead of `'./Component'`; add `'tslib'` to `skip`. (C-T3, C-A7, AC-I1)
- [x] 1.7 `prescriptions/prescription.routes.ts`: default export `Routes` with one empty page component titled "Prescriptions". (C-A4)
- [x] 1.8 Harness: `app.routes.ts` with `sandbox/prescriptions` → lazy `prescription.routes`, `''` → redirect, `'**'` → "Not found" component; `app.html` with the "Standalone mode" banner; `styles.css` limited to `body` margin and background. (AC-H2, AC-H3, C-S2)
- [x] 1.9 `e2e/`: `package.json` with `@playwright/test` `1.64.0` exact and a `test` script; `playwright.config.ts` with both web servers and the `standalone`, `composed`, `contract` projects and their `testMatch`; `fixtures.ts` with the `mountPath` option.
- [x] 1.10 Tests: `harness.spec.ts` (AC-H1, AC-H2, AC-H3); `contract.spec.ts` AC-I1 (fetch `remoteEntry.json`: name `prescription`, exposes only `./routes`).
- [x] 1.11 `.fallowrc.json`: add `"**/src/styles.css"` to `entry`; `ignoreDependencies` for `es-module-shims` and `@softarc/native-federation-orchestrator`; drop `ignoreBinaries` if the audit stays clean.

**Exit check:** `npm run build` in `shell/` and `prescription/`; `npm test` in `shell/`;
`npx playwright test --project standalone --project contract -g "AC-H|AC-I1"` in `e2e/`; audit.

## Phase 2: Shell

- [x] 2.1 `ng add @angular-architects/native-federation@22.2.5 --type host --port 4200` in `shell/`. Fix the range to `~22.2.5`; add `'tslib'` to `skip`. (C-T3, C-A7)
- [x] 2.2 `remotes/remote-definition.ts`: `RemoteDefinition` and `parseManifest` (skip and log invalid entries; non-list → `[]`). No Angular imports. Vitest spec. (AC-M1, AC-M2)
- [x] 2.3 `main.ts`: fetch `remotes.json` (failure → `[]`), parse, `initFederation({})`, `import('./bootstrap')`. `bootstrap.ts` exports `bootstrap(remotes, federation)`. (AC-M2)
- [x] 2.4 `remotes/remote-routes.ts` and `remote-unavailable.ts`: one lazy route per definition via `initRemoteEntry` + `loadRemoteModule`, `.then(m => m.default)`, fallback routes showing "<label> is currently unavailable". Vitest spec for the route building. (AC-S4, AC-E1)
- [x] 2.5 `public/remotes.json` with the `prescription` entry. (AC-S3)
- [x] 2.6 Layout in `app.html`/`app.css`: header with the app name, `nav` labelled "Main navigation" with "Home" and one link per definition; `@boundary` around the outlet kept. `shell-` classes. (AC-S1, AC-S3, AC-E2, C-S4)
- [x] 2.7 `welcome/welcome.ts` with heading "Welcome"; routes: `''` → Welcome, remote routes, `'**'` → `''`. (AC-S2, AC-S5)
- [x] 2.8 `styles.css`: minimal reset inside `@layer shell`. (C-S3)
- [x] 2.9 Tests in `tests/shell/`: AC-S1, AC-S2, AC-S3, AC-S4 (direct entry and reload), AC-S5, AC-M1, AC-M2 (invalid entry skipped; non-list and failed fetch → Welcome still works), AC-M3 (`page.route` serves a changed route path), AC-E1 (`page.route` aborts `remoteEntry.json`).

**Exit check:** `npm run build` and `npm test` in `shell/`;
`npx playwright test --project composed -g "AC-S|AC-M|AC-E1"` in `e2e/`; audit.

## Phase 3: Prescription view

Model and data

- [ ] 3.1 `model/`: `Prescription`, `PrescriptionQuery`, `PrescriptionPage`, defaults (page 1, page size 20, sizes 10/20/50). (AC-D1, AC-D2)
- [ ] 3.2 `data-access/prescription-seed.ts`: mulberry32 with a fixed seed; 1,000 Prescriptions, ~200 Insurants, ~30 Medications, dates in 2024–2025, Insurant IDs `[A-Z]\d{9}`. (AC-D2, AC-D3)
- [ ] 3.3 `data-access/prescription-api.ts` (abstract) and `mock-prescription-api.ts`: Search, Filters, order (date desc, then id), paging, clamping a page past the end; returns `of(page)`. Vitest spec. (AC-D1, AC-D4, AC-F3)
- [ ] 3.4 `data-access/query-params.ts`: `parseQuery` (defaults for invalid values, `to` before `from` ignored) and `toQueryParams` (non-defaults only). Vitest spec. (AC-U1, AC-U5)
- [ ] 3.5 `prescription.routes.ts`: provide `{ provide: PrescriptionApi, useClass: MockPrescriptionApi }` at route level. (C-A6, C-A10)

View

- [ ] 3.6 `ui/prescription-table.ts`: columns, `dd.MM.yyyy`, result count, empty state. (AC-F1, AC-F2, AC-F4, AC-F5)
- [ ] 3.7 `ui/prescription-paginator.ts`: range, position, First/Previous/Next/Last with disabled states, "Rows per page" 10/20/50. (AC-Q6, AC-Q7)
- [ ] 3.8 `ui/prescription-filters.ts`: `linkedSignal` drafts per field; Search debounce 300 ms with `takeUntil(reset)`; Insurant ID and date validation with field messages; an invalid edit emits removal of that filter; Reset clears drafts, cancels the debounce, emits reset. (AC-Q1–Q5, AC-U4)
- [ ] 3.9 `feature/prescription-page.ts`: `toSignal(queryParamMap)` → `parseQuery` → `rxResource`; relative `navigate` with `replaceUrl` for Search/Filter, push for page, page size and Reset; page 1 on Search/Filter/size change; AC-U6 correction via `effect` only when a value exists; error alert with "Retry" → `reload()`. (AC-Q8, AC-U2, AC-U3, AC-U6, AC-E3, AC-I2)
- [ ] 3.10 CSS: `rx-` classes; page `:host` sets `font-family`, `font-size`, `line-height`, `color`, `box-sizing` and heading, paragraph and table margins. (C-S1, C-S4, AC-I3)
- [ ] 3.11 Check by grep that no forbidden syntax exists in either app: `@Input`, `@Output`, `@ViewChild`, `@HostBinding`, `@HostListener`, `EventEmitter`, `BehaviorSubject`, `| async`, `ngModel`, `ViewEncapsulation.None`, `::ng-deep`. (C-K2a, C-S1)

Tests (`tests/remote/`, both projects, unless noted)

- [ ] 3.12 Table and data: AC-F1, AC-F2 (also no timezone shift), AC-F3, AC-F4, AC-F5, AC-D1, AC-D2, AC-D3 (two loads, same rows), AC-D4.
- [ ] 3.13 Search, Filter, paging: AC-Q1, AC-Q2 (including removal of an applied filter), AC-Q3, AC-Q4 (including removal), AC-Q5 (including Reset during the debounce and with invalid text), AC-Q6, AC-Q7, AC-Q8.
- [ ] 3.14 URL: AC-U1, AC-U2, AC-U3, AC-U4, AC-U5, AC-U6; AC-I2 (path stays under `mountPath`).
- [ ] 3.15 `contract.spec.ts`: AC-I3 (fixed property list on heading, header cell, body cell and Search input, standalone vs composed; Shell header and nav with and without the Remote).

**Exit check:** `npm run build` and `npm test` in `prescription/` and `shell/`;
`npx playwright test` in `e2e/` (all projects); ID check; audit.

## Phase 4: README and spec sync

- [ ] 4.1 README: what it is, screenshot placeholder, quick start (`nvm use`, install and start per project, e2e command), structure and ownership, link to `docs/adr/`, link to the specification for assumptions, "How AI was used" with the facts listed and room for the owner's prose; note `@boundary` is developer preview and that a failed Remote load stays until reload. (C-D1, C-D2, C-D3)
- [ ] 4.2 Sync `specs/01–04` and `GLOSSARY.md` with the code as built; record any deviation.
- [ ] 4.3 Remove scratch files; `git status` clean apart from intended changes.

**Exit check:** the owner reviews the README; every spec statement matches the code; full
e2e suite, Vitest and audit still green.
