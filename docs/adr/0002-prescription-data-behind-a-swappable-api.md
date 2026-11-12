# Prescription data comes from a swappable `PrescriptionApi`, mocked in memory

The brief assumes a REST backend but asks for it to be mocked. Instead of writing
`HttpClient` code and faking the transport, the Remote depends on an abstract
`PrescriptionApi` (one `search(query) → Page` call) and provides an in-memory
`MockPrescriptionApi` at route level. The mock does the Search, Filter and paging
itself over a fixed, seeded dataset, so the Remote never filters or slices data, as
it would not against a real server. Replacing it with an HTTP implementation is one
provider change in the Remote; the Shell is unaffected.

## Consequences

- No HTTP code, URL or CORS exists yet. The query and Page shapes mirror the assumed
  REST endpoint so the later HTTP implementation is a mapping, not a redesign.
- The mock has no latency and no failure mode, so loading and error states are not
  observable in the running demo.
