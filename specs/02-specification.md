# Specification

**What** the Shell and the Prescription Remote do, as observable behaviour. Bound by
`specs/01-constitution.md`; terms as in `GLOSSARY.md`.

Every requirement has a stable ID, a source tag (`[PDF]` = stated in the brief,
`[assumption]` = ours) and the test level that verifies it. Playwright test titles
start with the ID. Requirements about the mock's data are verified through what the
view shows, since the mock has no other observable surface. "Both targets" means the Remote in its Standalone Harness and the
Remote composed into the Shell (C-Q2).

## 1. Shell

| ID | Requirement | Source | Verified by |
| --- | --- | --- | --- |
| AC-S1 | The Shell shows a persistent layout: a header with the app name and a navigation landmark labelled "Main navigation", and a content area below it. | `[PDF]` | e2e |
| AC-S2 | `/` shows a minimal Welcome page with the heading "Welcome". The navigation has a "Home" link to it. | `[assumption]` | e2e |
| AC-S3 | The navigation has one link per Remote Manifest entry, using its label and route path. With the shipped manifest that is one link, "Prescriptions", to `/prescriptions`. | `[PDF]` navigation, `[assumption]` manifest | e2e |
| AC-S4 | Opening a Remote's route path loads the Remote at runtime and shows its view inside the content area, with the Shell's header and navigation still visible. Direct entry and reload of that URL work too. | `[PDF]` | e2e |
| AC-S5 | Unknown paths redirect to `/`. | `[assumption]` | e2e |

## 2. Remote Manifest

| ID | Requirement | Source | Verified by |
| --- | --- | --- | --- |
| AC-M1 | The Shell reads its Remote Manifest at startup from its own origin. Each entry has a name, the URL of the Remote's entry file, the exposed module, a route path and a navigation label. | `[assumption]` | e2e |
| AC-M2 | Entries with missing or wrongly typed fields are skipped and logged to the console; valid entries still work. A manifest that is missing, unreadable or not a list means "no Remotes": the Shell still starts and shows Welcome. | `[assumption]` | e2e |
| AC-M3 | Changing a Remote's URL or route path in the manifest takes effect on the next page load, without rebuilding the Shell. | `[assumption]` | e2e |

## 3. Integration contract

| ID | Requirement | Source | Verified by |
| --- | --- | --- | --- |
| AC-I1 | The Remote's federation entry declares the name `prescription` and exposes exactly one module, `./routes`, whose default export is an Angular `Routes` array. | `[assumption]` | e2e |
| AC-I2 | The Remote works under any mount path: everything in sections 5 to 7 behaves the same at `/prescriptions` in the Shell and at `/sandbox/prescriptions` in the Standalone Harness. | `[assumption]` | e2e, both targets |
| AC-I3 | The Remote's view looks the same in both targets: its table and form have the same computed styles standalone and composed, and the Shell's header and navigation look the same with and without the Remote loaded. | `[assumption]` | e2e, both targets |

## 4. Standalone Harness

| ID | Requirement | Source | Verified by |
| --- | --- | --- | --- |
| AC-H1 | `npm start` in `prescription/` serves the Standalone Harness on port 4201, independently of the Shell. `npm start` in `shell/` serves the Shell on port 4200. | `[PDF]` | e2e |
| AC-H2 | The harness mounts the Remote's routes at `/sandbox/prescriptions` and shows a banner "Standalone mode". `/` redirects there. | `[assumption]` | e2e |
| AC-H3 | Any other path shows "Not found" instead of redirecting. The harness has no further error handling. | `[assumption]` | e2e |

## 5. Prescription table

| ID | Requirement | Source | Verified by |
| --- | --- | --- | --- |
| AC-F1 | The view has the heading "Prescriptions" and a table with these column headers, in order: Medication, Insurant, Birth date, Insurant ID, Prescribed on. | `[PDF]` columns, `[assumption]` labels | e2e, both targets |
| AC-F2 | Dates are shown as `dd.MM.yyyy`. | `[assumption]` | e2e |
| AC-F3 | Rows are ordered by Prescription Date, newest first. There is no sorting by the user. | `[assumption]` | e2e |
| AC-F4 | A result count above the table shows the total number of matches, formatted like "1,000 results" or "1 result". | `[assumption]` | e2e |
| AC-F5 | When nothing matches, the table is replaced by the message "No prescriptions match your search." | `[assumption]` | e2e |

## 6. Search, Filter and paging

All three are done by the `PrescriptionApi` (C-A9); the Remote only displays the Page
it gets back.

| ID | Requirement | Source | Verified by |
| --- | --- | --- | --- |
| AC-Q1 | A "Search" field matches its text, case-insensitively and as a substring, against Medication name, Insurant name and Insurant ID. Input is debounced by 300 ms. | `[PDF]` search, `[assumption]` semantics | e2e |
| AC-Q2 | An "Insurant ID" field filters to an exact, case-insensitive Insurant ID. A value that is not one letter followed by nine digits shows the field message "Enter one letter followed by nine digits" and is not applied. | `[PDF]` filter, `[assumption]` semantics | e2e |
| AC-Q3 | "Prescribed from" and "Prescribed to" date fields filter by Prescription Date, both bounds inclusive; either may be empty. | `[PDF]` filter, `[assumption]` semantics | e2e |
| AC-Q4 | If "Prescribed to" is before "Prescribed from", the "to" field shows "Must not be before the from date" and the range is not applied. | `[assumption]` | e2e |
| AC-Q5 | A "Reset" button clears Search and all Filters and returns to page 1 with the default page size. | `[assumption]` | e2e |
| AC-Q6 | Paging controls show the range ("1–20 of 1,000") and the position ("Page 1 of 50"), and offer First, Previous, Next and Last buttons. Buttons that cannot move are disabled. | `[PDF]` paging, `[assumption]` controls | e2e |
| AC-Q7 | A "Rows per page" select offers 10, 20 and 50; the default is 20. | `[assumption]` | e2e |
| AC-Q8 | Any change to Search, a Filter or the page size returns to page 1. | `[assumption]` | e2e |

## 7. URL state

| ID | Requirement | Source | Verified by |
| --- | --- | --- | --- |
| AC-U1 | The view's state lives in the query string as `q`, `insurantId`, `from`, `to`, `page` and `pageSize`. Only values that differ from the default are written. | `[assumption]` | e2e |
| AC-U2 | Opening or reloading a URL with these parameters restores Search, Filters, page and page size, both in the fields and in the table. | `[assumption]` | e2e, both targets |
| AC-U3 | Typing in Search or a Filter replaces the current history entry. Changing page or page size and Reset each add one. | `[assumption]` | e2e |
| AC-U4 | Back and Forward restore the previous state, and the form fields always show the values in the URL. | `[assumption]` | e2e |
| AC-U5 | Invalid query values (non-numeric or non-positive `page`, a `pageSize` other than 10, 20 or 50, a malformed date or Insurant ID, `to` before `from`) are ignored and their defaults used. No error is shown for them. | `[assumption]` | e2e |
| AC-U6 | A `page` beyond the last page shows the last page and corrects `page` in the URL, replacing the history entry. | `[assumption]` | e2e |

## 8. Failure handling

| ID | Requirement | Source | Verified by |
| --- | --- | --- | --- |
| AC-E1 | If a Remote cannot be loaded (entry file unreachable or broken), its route shows the alert "Prescriptions is currently unavailable" (using the manifest label). The Shell's header, navigation and Welcome page keep working. | `[assumption]` | e2e |
| AC-E2 | If a page throws while rendering, the Shell's `@boundary` around the outlet shows the alert "This page stopped working" with a "Try again" button; the navigation stays usable. `@boundary` is in developer preview in Angular 22.2, not stable. | `[assumption]` | untested (C-Q1 exception) |
| AC-E3 | If the `PrescriptionApi` fails, the Remote shows the alert "Prescriptions could not be loaded" with a "Retry" button that repeats the request without a reload. | `[assumption]` | untested (C-Q1 exception) |

## 9. Prescription data

These describe the mock behind `PrescriptionApi`, so the swap to a real backend
(C-A10) knows what to honour.

| ID | Requirement | Source | Verified by |
| --- | --- | --- | --- |
| AC-D1 | `PrescriptionApi` takes a query (Search text, Insurant ID, from date, to date, page, page size) and returns a Page: the Prescriptions on it, page, page size, total matches and total pages. The shape mirrors the assumed REST call `GET /api/prescriptions?q&insurantId&from&to&page&pageSize`. | `[PDF]` REST assumed, `[assumption]` shape | e2e |
| AC-D2 | Each Prescription has an id, Medication name, Insurant name, Insurant birth date, Insurant ID (one uppercase letter and nine digits) and Prescription Date. | `[PDF]` fields, `[assumption]` id and format | e2e |
| AC-D3 | The mock generates 1,000 Prescriptions from a fixed seed, for about 200 Insurants and about 30 Medications, so the same rows appear on every load and an Insurant has several Prescriptions. Prescription Dates fall in 2024–2025. | `[assumption]` | e2e |
| AC-D4 | The mock applies Search, Filters, ordering (Prescription Date descending, then id) and paging itself, answers immediately and never fails. It treats out-of-range input like AC-U5: invalid values fall back to defaults, and a page past the end returns the last page. | `[PDF]` backend-based, `[assumption]` rest | e2e |

## 10. Out of scope

As in constitution section 8: authentication and authorization, sorting, writes,
i18n, a design system, deployment pipelines, a real backend, latency or failure
simulation in the mock. Loading indicators are not specified, because the mock
answers immediately.
