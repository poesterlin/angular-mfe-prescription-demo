// The stateful part of the optimised variant: reads the site's own files and the Remote's
// manifest, keeps the caches and the timeouts. Hints are only an optimisation: whatever
// fails here costs a missed hint, never a broken page.
import { join } from 'node:path';
import {
  crawl,
  injectHints,
  parseFederationInfo,
  parseManifest,
  remoteForPath,
  shimScripts,
  type Hints,
  type RemoteRef,
} from './hints';

/** Longest a cold request waits for a Remote's manifest before it is served without. */
const REMOTE_WAIT_MS = 300;
/** Age after which a Remote's hints are refreshed in the background. */
const REFRESH_MS = 30_000;
const FETCH_TIMEOUT_MS = 2_000;

export interface EdgeOptions {
  shellRoot: string;
  /** Where this process reaches its own files (the browser uses the public URL). */
  remoteInternalUrl: string;
  /** The origin the browser sees. A Remote on the same origin needs no preconnect. */
  publicOrigin: string;
  /** The Remote Manifest as the browser sees it. */
  readManifest: () => Promise<unknown>;
}

export interface EdgeResult {
  html: string;
  debug: string;
}

export function createEdge({ shellRoot, remoteInternalUrl, publicOrigin, readManifest }: EdgeOptions) {
  let shellCache: { stamp: number; modules: string[] } | undefined;
  const remoteCache = new Map<string, { modules: string[]; at: number }>();
  const inflight = new Map<string, Promise<string[]>>();

  async function readLocal(file: string): Promise<string | null> {
    return Bun.file(join(shellRoot, file)).text().catch(() => null);
  }

  async function shellModules(html: string, stamp: number): Promise<string[]> {
    if (shellCache?.stamp === stamp) return shellCache.modules;
    const info = parseFederationInfo(JSON.parse((await readLocal('remoteEntry.json')) ?? 'null'));
    const modules = await crawl([...shimScripts(html), ...(info?.shared ?? [])], { read: readLocal });
    shellCache = { stamp, modules };
    return modules;
  }

  async function fetchRemote(url: URL): Promise<Response | null> {
    return fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }).then(
      (response) => (response.ok ? response : null),
      () => null,
    );
  }

  /** Public URLs of every module of the Remote's exposed file, found by crawling it. */
  async function computeRemote(remote: RemoteRef): Promise<string[]> {
    const entry = new URL(remote.remoteEntry);
    const internalEntry = new URL(entry.pathname, remoteInternalUrl);
    const response = await fetchRemote(internalEntry);
    const info = parseFederationInfo(response ? await response.json().catch(() => null) : null);
    const exposed = info?.exposes.find(({ key }) => key === remote.exposedModule);
    if (!info || !exposed) throw new Error('remote manifest unusable');
    const files = await crawl([exposed.file], {
      internal: info.internal,
      read: async (file) => (await fetchRemote(new URL(file, internalEntry)))?.text() ?? null,
    });
    return files.map((file) => new URL(file, entry).href);
  }

  function refresh(remote: RemoteRef): Promise<string[]> {
    const key = remote.remoteEntry;
    const running = inflight.get(key);
    if (running) return running;
    const job = computeRemote(remote)
      .catch(() => remoteCache.get(key)?.modules ?? [])
      .then((modules) => {
        remoteCache.set(key, { modules, at: Date.now() });
        inflight.delete(key);
        return modules;
      });
    inflight.set(key, job);
    return job;
  }

  /** Cached hints at once; stale ones are refreshed behind the response. */
  async function remoteModules(remote: RemoteRef): Promise<string[]> {
    const cached = remoteCache.get(remote.remoteEntry);
    if (cached) {
      if (Date.now() - cached.at > REFRESH_MS) void refresh(remote);
      return cached.modules;
    }
    const timeout = new Promise<string[]>((resolve) => setTimeout(resolve, REMOTE_WAIT_MS, []));
    return Promise.race([refresh(remote), timeout]);
  }

  return {
    async render(html: string, pathname: string, stamp: number): Promise<EdgeResult> {
      const modules = await shellModules(html, stamp);
      const remote = remoteForPath(pathname, parseManifest(await readManifest()));
      const hints: Hints = { origins: [], fetches: ['remotes.json', 'remoteEntry.json'], modules };
      let remoteCount = 0;
      if (remote) {
        const remoteHints = await remoteModules(remote);
        remoteCount = remoteHints.length;
        const origin = new URL(remote.remoteEntry).origin;
        if (origin !== publicOrigin) hints.origins.push(origin);
        hints.fetches.push(remote.remoteEntry);
        hints.modules = [...modules, ...remoteHints];
      }
      return { html: injectHints(html, hints), debug: `shell=${modules.length}; remote=${remoteCount}` };
    },
  };
}
