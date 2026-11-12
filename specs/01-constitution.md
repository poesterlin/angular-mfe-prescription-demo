# Constitution

The rules every later artifact (specification, plan, tasks, code) must obey. A change
here needs human approval. Terms are defined in `GLOSSARY.md`; decisions with real
trade-offs are recorded in `docs/adr/`.

Each rule is tagged `[PDF]` when the task brief (`docs/task/`) states it, or
`[assumption]` when it is our choice.

## 1. Purpose

| ID | Rule |
| --- | --- |
| C-P1 | Show a micro-frontend architecture in which one Shell and one Remote ("Prescription") are built, released and run independently, and are joined at runtime by routing. `[PDF]` |
| C-P2 | Architecture and reasoning come before features and polish. UI, styling, accessibility and error handling stay minimal. `[PDF]` |
| C-P3 | The specification is the primary artifact. Code is its output, and the e2e suite is its executable form. `[assumption]` |

## 2. Technology baseline

Verified with `npm view` on 2026-11-12.

| ID | Rule |
| --- | --- |
| C-T1 | Angular and TypeScript. `[PDF]` |
| C-T2 | Angular `~22.2` (22.2.6 at time of writing) with the esbuild builder, TypeScript `~6.0`, RxJS `~7.8`. `[assumption]` |
| C-T3 | Composition with `@angular-architects/native-federation` `~22.2` (ADR 0001). `[assumption]` |
| C-T4 | Node 26 (pinned in `.nvmrc`). Angular 22.2 supports `^22.22.3 \|\| ^24.15.0 \|\| >=26`, so the host's default Node 25 is not supported. `[assumption]` |
| C-T5 | Unit tests: Vitest (already in the scaffold). E2E: `@playwright/test` pinned to exactly `1.64.0`, whose Chromium build is already cached on this machine (1.65 needs a new download). `[assumption]` |
| C-T6 | No new runtime or dev dependency beyond C-T2 to C-T5 without asking. `[assumption]` |

## 3. Architecture

| ID | Rule |
| --- | --- |
| C-A1 | One repo with separate projects: `shell/`, `prescription/`, `e2e/`. Each has its own `package.json`, lockfile, build and `npm start`. None imports from another. `[PDF]` independence, `[assumption]` layout |
| C-A2 | The Shell owns the global layout and the navigation, and mounts Remotes under routes. It knows nothing about prescriptions. `[PDF]` |
| C-A3 | The Shell discovers Remotes at runtime from a Remote Manifest it serves, and builds its navigation from it (ADR 0003). `[assumption]` |
| C-A4 | A Remote exposes exactly one module, whose default export is an Angular `Routes` array. Nothing else is public (ADR 0003). `[assumption]` |
| C-A5 | A Remote navigates only relative to where it is mounted, so it works under any route path. `[assumption]` |
| C-A6 | A Remote provides its own services at route level and never relies on providers from the Shell. `[assumption]` |
| C-A7 | Only Angular and RxJS are shared at runtime, as singletons on the same major version. No shared store, component library, design system or utility package. `[assumption]` |
| C-A8 | State that has to survive reload, Back or a shared link lives in the URL. The URL is the single source of truth for the view's state. `[assumption]` |
| C-A9 | The Remote reads data only through the `PrescriptionApi` interface. The in-memory mock does the Search, Filter and paging itself; the Remote never filters or slices data (ADR 0002). `[PDF]` backend-based, `[assumption]` mechanism |
| C-A10 | Swapping the mock for a real HTTP implementation must touch only the Remote's provider configuration. `[assumption]` |

## 4. Styling and CSS isolation

| ID | Rule |
| --- | --- |
| C-S1 | Component styles only, with Angular's default emulated encapsulation. Never `ViewEncapsulation.None`, never `::ng-deep`. `[assumption]` |
| C-S2 | The Remote ships no global CSS that it depends on. Its `styles.css` is used by the Standalone Harness only. `[assumption]` |
| C-S3 | The Shell's global CSS is a minimal reset inside `@layer shell`, so unlayered component styles always win over it. `[assumption]` |
| C-S4 | CSS class names are prefixed per app: `shell-` in the Shell, `rx-` in the Remote. `[assumption]` |

## 5. Code

| ID | Rule |
| --- | --- |
| C-K1 | Strict TypeScript. No `any`, no `@ts-ignore`. `[assumption]` |
| C-K2 | Modern Angular only: standalone components, zoneless, signals, `OnPush`, `inject()`, `input()` / `output()`, built-in control flow (`@if`, `@for`). No NgModules. `[assumption]` |
| C-K3 | Small, single-purpose files. Presentational components get data through inputs and report through outputs; they inject no services. `[assumption]` |
| C-K4 | Each app's code passes `npm run build`, its tests and `npm run audit` (fallow), and the pre-commit hook is never bypassed. `[assumption]` |

## 6. Testing

| ID | Rule |
| --- | --- |
| C-Q1 | Every requirement ID in the specification has at least one Playwright test, with the ID in the test title. Exception: failure-handling requirements that the running app gives no way to trigger may stay untested, because the brief does not require error handling. The specification marks them "untested (C-Q1 exception)". `[assumption]` |
| C-Q2 | The e2e suite runs against two targets: the Remote in its Standalone Harness, and the Remote composed into the Shell. `[PDF]` isolation and integration, `[assumption]` mechanism |
| C-Q3 | Vitest covers only what e2e cannot reach cheaply, such as the mock's paging edge cases and Remote Manifest parsing. It is optional and does not replace the Playwright test that C-Q1 requires. `[assumption]` |
| C-Q4 | Tests rely on the mock's fixed seed, so counts and rows are deterministic. `[assumption]` |
| C-Q5 | If a test and the specification disagree, work stops and the human decides. `[assumption]` |

## 7. Documentation

| ID | Rule |
| --- | --- |
| C-D1 | A minimal README: what it is with a screenshot placeholder, quick start, structure and ownership, a link to `docs/adr/` for decisions, a link to the specification for assumptions, and a "How AI was used" section. `[PDF]` |
| C-D2 | "How AI was used" lists the facts (spec-driven gates, committed specs and ADRs, `[agent]` commits, e2e as the acceptance check). The owner writes the prose. `[PDF]` |
| C-D3 | No testing, migration or presentation material in the repo; that is covered in the interview. `[assumption]` |

## 8. Out of scope

Authentication and authorization `[PDF]`; sorting; writes (create or edit); i18n; a
design system; deployment pipelines; a real backend; simulated latency or failures in
the mock. `[assumption]` unless marked.
