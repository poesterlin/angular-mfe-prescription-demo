# Native Federation composes the Shell and its Remotes at runtime

The Shell and each Remote are separate npm projects (own `package.json`, lockfile,
build and dev server) so a team can release its Remote without rebuilding the Shell.
They are joined in the browser by Native Federation (`@angular-architects/native-federation`):
it works with Angular's esbuild builder, relies on ES modules and import maps, and
shares Angular as a single runtime instance, which a hand-rolled dynamic `import()`
cannot do without breaking dependency injection and the router.

## Considered Options

- **Webpack Module Federation**: needs the webpack builder, which Angular 22 no longer defaults to.
- **Web Components or iframes**: framework-agnostic, but lose the shared router and DI, and iframes isolate layout and navigation.
- **One Angular workspace with several projects**: simpler, but one dependency tree and one install, so releases are not independent.

## Consequences

Angular and RxJS must stay on the same major version across the Shell and all Remotes,
so framework upgrades are coordinated across teams.
