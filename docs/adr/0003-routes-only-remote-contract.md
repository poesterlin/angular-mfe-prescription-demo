# A Remote exposes only its `Routes`; the Shell finds it through a runtime manifest

The contract between the Shell and a Remote is deliberately small:

- The Remote exposes exactly one module, whose default export is an Angular `Routes`
  array. It provides its own services at route level and navigates only relative to
  where it is mounted, so it works under any path.
- The Shell learns about Remotes at runtime from a Remote Manifest it serves, and
  builds its navigation from it. Adding, moving or rolling back a Remote is a
  configuration change, not a Shell release.
- Only Angular and RxJS are shared, as singletons on the same major version. There is
  no shared store, component library or utility package; state that must cross the
  boundary travels in the URL.

## Considered Options

- **Exposing a component**: the Shell would own the Remote's sub-routes and providers.
- **Remote URLs fixed at Shell build time**: every Remote move would need a Shell release.
- **A shared library or store**: convenient, but each one becomes a lockstep release between teams.
