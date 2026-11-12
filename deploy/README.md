# Hosting with Docker

One image, run twice, to compare how fast the composed app loads.

```sh
cp deploy/.env.example deploy/.env   # then set the two hostnames
docker compose -f deploy/docker-compose.yml up -d --build
```

| Variant | URL | What it does |
| --- | --- | --- |
| `baseline` | `https://$BASELINE_HOST` | Plain static hosting. |
| `edge` | `https://$EDGE_HOST` | Same files, plus preload hints written into the HTML. |

Traefik routes each hostname to its container over `traefik_web` (labels in
`docker-compose.yml`). The hostnames come from `deploy/.env` (git-ignored; copy
`.env.example` and set `BASELINE_HOST` and `EDGE_HOST`); compose refuses to start without them. Nothing is published on the host, and no hostname is added to the Cloudflare
tunnel, so both are reachable on the LAN and tailnet only.

Each variant is a single Bun server (`server.ts`, `Bun.serve`, port 4200) running the
production builds of `shell/` and `prescription/` from **one origin**: the Shell at `/`, the
Remote's files under `/remotes/prescription/` (no pages there, so no Standalone Harness).
`remotes.json` is rewritten at request time to point there, from `PUBLIC_URL`.

## The optimisation

Without hints the browser finds the app one round trip at a time: `index.html`, `main.js`,
`remotes.json`, `remoteEntry.json` (Shell), `remoteEntry.json` (Remote), the Angular chunks,
the Remote's chunks. The edge already knows all of it, so it lists it in the HTML and the
browser starts every download at once. Both variants run the same apps (es-module-shims in shim mode, see `EXPERIMENTS.md` for why).

For a page navigation (`GET` without a file extension) the edge:

1. crawls the Shell's module graph from the page's script and the shared packages in its
   `remoteEntry.json`; cached until `index.html` changes;
2. on a Remote's route (`/prescriptions…`) fetches the Remote's `remoteEntry.json` and crawls
   its exposed `./routes` file;
3. adds `preconnect` (only for another origin), `preload as=fetch` and `modulepreload-shim` links
   before `</head>`, and turns Angular's own `modulepreload` into the `-shim` kind (the app runs
   es-module-shims in shim mode, so a native one would download every module twice);
4. replies with `no-cache` and an `x-edge-hints: shell=<n>; remote=<n>` header.

Hints can only cost a wasted request, never break a page: the runtime still reads the
manifests itself, a cold request waits at most 300 ms for the Remote, and a Remote's hints are
refreshed in the background after 30 s.

| File | Job |
| --- | --- |
| `hints.ts` | Pure functions: `scanImports`, `crawl`, `injectHints`, `remoteForPath`, parsers. Tested in `hints.test.ts` (`bun test deploy/`). |
| `edge.ts` | Reads files and the Remote's manifest; caches, timeouts. |
| `server.ts` | Static files, the Remote prefix, the `remotes.json` rewrite, `EDGE_HINTS=0|1`. |

## Limits

- `scanImports` is a regex tuned to esbuild's minified output; `crawl` stops at 80 modules.
- Caches live in the process. Not done: 103 Early Hints, `immutable` caching of hashed files,
  hints for lazy routes that are not on the current page.
- The `e2e/` suite targets the dev servers on 4200/4201 and the Standalone Harness, so it does not run against this setup.
