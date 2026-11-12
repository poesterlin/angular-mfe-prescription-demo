// Pure functions that work out which files the browser is about to fetch and render
// them as <link> hints. No I/O here, so every function is unit-testable.

export interface RemoteRef {
  remoteEntry: string;
  exposedModule: string;
  routePath: string;
}

export interface FederationInfo {
  shared: string[]; // files of the shared packages
  exposes: { key: string; file: string }[];
  internal: Record<string, string>; // "@nf-internal/<chunk>" -> file
}

export interface Hints {
  origins: string[];
  fetches: string[];
  modules: string[];
}

type Json = Record<string, unknown>;

function isRecord(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

/** Reads the Remote Manifest, skipping entries that are not usable. */
export function parseManifest(json: unknown): RemoteRef[] {
  if (!Array.isArray(json)) return [];
  return json.flatMap((item): RemoteRef[] => {
    if (!isRecord(item)) return [];
    const { remoteEntry, exposedModule, routePath } = item;
    if (typeof remoteEntry !== 'string' || typeof exposedModule !== 'string') return [];
    if (typeof routePath !== 'string' || !URL.canParse(remoteEntry)) return [];
    return [{ remoteEntry, exposedModule, routePath }];
  });
}

function records(value: unknown): Json[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

/** Reads a Native Federation `remoteEntry.json` (v4). Returns null if it is not one. */
export function parseFederationInfo(json: unknown): FederationInfo | null {
  if (!isRecord(json)) return null;
  const shared = records(json.shared).flatMap(({ entries }) => (isRecord(entries) ? strings(Object.values(entries)) : []));
  const exposes = records(json.exposes).filter((e) => typeof e.key === 'string' && typeof e.outFileName === 'string');
  const internal = exposes.flatMap(({ chunks }) => (isRecord(chunks) ? Object.entries(chunks) : []));
  return {
    shared,
    exposes: exposes.map((e) => ({ key: String(e.key), file: String(e.outFileName) })),
    internal: Object.fromEntries(internal.flatMap(([name, chunk]) => (isRecord(chunk) && typeof chunk.file === 'string' ? [[name, chunk.file]] : []))),
  };
}

const IMPORT_SPECIFIER = /(?:\bfrom|\bimport)\s*\(?\s*["']([^"']+)["']/g;

/**
 * Every string that follows `from`, `import` or `import(`. A regex, not a parser: it is
 * tuned to esbuild's minified output and may return the odd false positive.
 */
export function scanImports(source: string): string[] {
  return [...source.matchAll(IMPORT_SPECIFIER)].map((match) => match[1]);
}

/** Turns an import specifier into a file name relative to the site root, or null. */
function resolveSpecifier(specifier: string, from: string, internal: Record<string, string>): string | null {
  if (specifier.startsWith('.')) return new URL(specifier, `http://x/${from}`).pathname.slice(1);
  return internal[specifier] ?? null;
}

export interface CrawlOptions {
  read: (file: string) => Promise<string | null>;
  internal?: Record<string, string>;
  limit?: number;
}

/**
 * Follows relative imports (static and dynamic) breadth-first from the seed files and
 * returns every file found, seeds first. Bare specifiers (shared packages) are skipped.
 * Stops at `limit` files.
 */
export async function crawl(seeds: string[], options: CrawlOptions): Promise<string[]> {
  const { read, internal = {}, limit = 80 } = options;
  const found = [...new Set(seeds)];
  const seen = new Set(found);
  let level = [...found];
  while (level.length > 0 && found.length < limit) {
    const sources = await Promise.all(level.map(read));
    const next: string[] = [];
    sources.forEach((source, index) => {
      for (const specifier of source === null ? [] : scanImports(source)) {
        const file = resolveSpecifier(specifier, level[index], internal);
        if (file === null || seen.has(file) || found.length >= limit) continue;
        seen.add(file);
        found.push(file);
        next.push(file);
      }
    });
    level = next;
  }
  return found;
}

/** The Remote whose route the path is on, if any. */
export function remoteForPath(pathname: string, remotes: RemoteRef[]): RemoteRef | undefined {
  return remotes.find(({ routePath }) => {
    const prefix = `/${routePath}`;
    return pathname === prefix || pathname.startsWith(`${prefix}/`);
  });
}

/** The module scripts of the page (es-module-shims runs them as `module-shim`). */
export function shimScripts(html: string): string[] {
  return [...html.matchAll(/<script\b[^>]*>/g)]
    .map((match) => match[0])
    .filter((tag) => /\btype="module-shim"/.test(tag))
    .flatMap((tag) => /\bsrc="([^"]+)"/.exec(tag)?.[1] ?? []);
}

function renderHints({ origins, fetches, modules }: Hints): string {
  return [
    ...origins.map((href) => `<link rel="preconnect" href="${href}" crossorigin>`),
    ...fetches.map((href) => `<link rel="preload" as="fetch" href="${href}" crossorigin>`),
    ...modules.map((href) => `<link rel="modulepreload-shim" href="${href}">`),
  ].join('\n');
}

/**
 * Puts the hints before `</head>`. The app runs es-module-shims in shim mode, so a native
 * `modulepreload` would download every module twice: Angular's own ones become shim
 * hints, and modules the page already lists are not repeated.
 */
export function injectHints(html: string, hints: Hints): string {
  const listed = new Set([...html.matchAll(/<link\b[^>]*\brel="modulepreload"[^>]*\bhref="([^"]+)"/g)].map((m) => m[1]));
  const block = renderHints({ ...hints, modules: hints.modules.filter((href) => !listed.has(href)) });
  return html.replace(/\brel="modulepreload"/g, 'rel="modulepreload-shim"').replace('</head>', `${block}\n</head>`);
}
