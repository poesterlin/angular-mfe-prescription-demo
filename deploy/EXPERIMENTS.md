# Experiments

What was tried while building the hosting setup, with the numbers. All on 2026-11-12, on the
single Linux VM. **Outcome: the apps keep es-module-shims in shim mode, because the shim-less
build does not work in Firefox.** Section 4 has the details.

## Method

- **Page:** the deep link `/prescriptions?q=ibu`, cold cache (new browser context per run).
  "Table visible" = a `table tbody tr` is visible. Median of 5 runs unless noted.
- **Chromium 156** (Playwright): +100 ms latency through CDP
  (`Network.emulateNetworkConditions`, latency only, no bandwidth cap).
- **Firefox 157.0** (Playwright, firefox v1555): has no CDP. The same 100 ms is added to every
  request with a `page.route` delay. Chromium and Firefox times are **not comparable** with
  each other.
- "URLs" = distinct URLs the page requested; "twice" = URLs requested more than once.
- Scripts: `experiments/browser.mjs` (timing, errors, navigation Home → Prescriptions),
  `experiments/firefox-console.mjs` (console output of one page load). Both take the path of
  `e2e/package.json` as first argument, to borrow its Playwright.
- The two variants run on the same host, so the network is a LAN hop. Numbers show the effect
  of the round trips, not real internet speeds.

## Setup under test

Image: `node:26` stage builds `shell/` and `prescription/` (production), `oven/bun:1.4-alpine`
serves them (`server.ts`, `Bun.serve`). Two variants of the same image:

- **baseline:** plain static files.
- **edge:** same, but page navigations get preload hints in the HTML (`edge.ts`, `hints.ts`).
  On `/prescriptions` it reports `x-edge-hints: shell=17; remote=3` (17 modules of the Shell
  graph, 3 of the Remote's).

## 1. Two ports on localhost (shim mode)

Shell on :4200 and Remote on :4201 (baseline), :4210 and :4211 (edge).

| Variant | Table visible (ms) | Runs | URLs | twice |
| --- | --- | --- | --- | --- |
| baseline | **2068** | 2063, 2066, 2068, 2070, 2101 | 48 | 1 |
| edge | **1086** | 1068, 1069, 1086, 1092, 1094 | 54 | 0 |

- Playwright e2e suite (65 tests) against the baseline container: 65 passed.
- Same suite against the edge variant (throwaway container on 4200/4201): 65 passed.
- Unit tests of the hint logic (`bun test deploy/`): 4 passed.
- Robustness checks: `POST` → 405, missing file → 404, `/../etc/passwd` and encoded variants
  → no file outside the site root (the first returns the app's `index.html`, the others 404).
- After refactoring `server.ts` for the audit, rebuilt and re-ran: curl checks as above,
  e2e 65 passed again.

## 2. One origin behind Traefik (shim mode)

Shell at `/`, Remote under `/remotes/prescription/`, one hostname per variant on
`traefik_web`. `remotes.json` is rewritten at request time. No port published.

| Variant | Table visible (ms) | Runs | URLs | twice |
| --- | --- | --- | --- | --- |
| baseline | **2085** | 2079, 2082, 2085, 2089, 2128 | 48 | 1 |
| edge | **1128** | 1109, 1112, 1128, 1140, 1144 | 54 | 0 |

- HTTP/2 through Traefik, certificate accepted, Home → Prescriptions navigation works, no
  console errors.
- Remote pages under `/remotes/prescription/` (no extension) → 404 (no Standalone Harness).
- Public exposure: `dig +short <host> @1.1.1.1` returned nothing for both hostnames. Nothing
  was added to the Cloudflare tunnel.
- The e2e suite targets the dev servers (4200/4201 and the harness) and was not run against
  this layout.

## 3. Native import maps, no es-module-shims (rejected)

Change: `polyfills: ["es-module-shims"]` removed from `angular.json`,
`esmsInitOptions: { "shimMode": false }` on the federation `build` and `serve` targets,
`shimMode: false` in both `initFederation` calls, `es-module-shims` uninstalled. The exact diff
is `experiments/native-import-maps.patch` (`git apply` it to reproduce).

**3a. Dev servers.** First e2e run: almost all of the 65 tests failed after 5.5 min. Cause: only
the `build` target had `esmsInitOptions`; `ng serve` still wrote `shimMode: true` and
`type="module-shim"` into `index.html` with no shim loaded. After adding the option to the
`serve` target: 65 passed (Chromium). Unit tests: shell 7, prescription 51, passed.

**3b. Production, Chromium, baseline.** Works.

| Variant | Table visible (ms) | Runs | URLs | twice |
| --- | --- | --- | --- | --- |
| baseline (native) | **1580** | 1575, 1580, 1580, 1588, 1629 | 26 | 0 |

A second run gave a median of 1586 ms. So in Chromium the shim cost roughly 500 ms and
22 requests on the baseline (reason not investigated).

**3c. Edge with native `modulepreload` hints.** Broken in Chromium. The table never appears:

```
TypeError: Failed to resolve module specifier "@angular/platform-browser".
Relative references must start with either "/", "./", or "../".
```

A native `modulepreload` resolves a module's bare imports (`@angular/*`, `rxjs`) when the hint
is processed, before the import map exists, and the browser remembers the failure. This is
why the shim variant needs `modulepreload-shim`.

**3d. Edge with `<link rel="preload" as="script" crossorigin>` hints.** Works in Chromium.

| Variant | Table visible (ms) | Runs | URLs | twice |
| --- | --- | --- | --- | --- |
| edge (native, preload as=script) | **642** | 634, 639, 642, 643, 644 | 32 | 0 |

Chromium warned that 6 of the 20 preloaded files were never used (32 URLs against 26 on the
baseline), so they download for nothing.

**3e. Firefox 157.0, native build. Does not work, for either variant.**

| Variant | Loaded | Notes |
| --- | --- | --- |
| baseline `/prescriptions?q=ibu` | 0 / 3 | empty page |
| edge `/prescriptions?q=ibu` | 0 / 3 | empty page |
| baseline `/` (home) | fails | empty page, so not specific to the Remote |

```
JavaScript Warning: "Import maps are not allowed after a module load or preload has started."
  {file: ".../main-AG7RHYI7.js" line: 4}
TypeError: The specifier “@angular/platform-browser” was a bare specifier, but was not
  remapped to anything. Relative module specifiers must start with “./”, “../” or “/”.
```

Cause: the Native Federation runtime builds the import map in JavaScript, after `main.js` is
already running, and adds it to the page. Firefox 157 rejects an import map once any module
load has started; Chromium 156 accepts and merges it. The hints are not involved (the
baseline fails the same way). **An earlier statement that Firefox 138+ merges late import maps
was wrong; it was never tested.** This is what the es-module-shims shim mode avoids.

## 4. Decision and revert

Native mode was reverted: `git checkout -- shell prescription`, `npm ci` in both apps, the
fallow `ignoreDependencies` entry restored, and the hints returned to `modulepreload-shim`
(Angular's own `modulepreload` links are converted to the shim kind).

After the revert (shim mode, behind Traefik, 5 runs):

| Browser | Variant | Table visible (ms) | Runs | URLs | twice | Home → Prescriptions |
| --- | --- | --- | --- | --- | --- | --- |
| Chromium 156 | baseline | **2080** | 2128, 2106, 2078, 2080, 2079 | 48 | 1 | ok |
| Chromium 156 | edge | **1113** | 1107, 1113, 1118, 1123, 1091 | 54 | 0 | ok |
| Firefox 157 | baseline | **2164** | 2556, 2164, 2159, 2171, 2156 | 27 | 1 | ok |
| Firefox 157 | edge | **1211** | 1229, 1196, 1205, 1222, 1211 | 33 | 1 | ok |

No console or page errors in any run. Firefox loads 20 rows in both variants and the hints
help there too (about 0.95 s, in the same emulated 100 ms). In Firefox the first run is
slower (2556 ms, warm-up); the "twice" count of 1 also appears on the baseline, so it is not
caused by the hints (the URL was not identified).

Also re-run on the reverted code: e2e on the dev servers (Chromium) 65 passed; unit tests
shell 7 and prescription 51 passed.

## Not tried

- Writing the import map into the HTML at the edge (it knows the shared files of the Shell and
  the Remote), so it exists before the first module loads. This might make native mode work in
  Firefox. Untested.
- Other browsers (Safari), other Firefox versions, real network conditions.
- Why the shim adds 22 requests and about 500 ms in Chromium.
- Pruning the 6 hinted files that are never used.
