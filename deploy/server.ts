// Serves the built Shell and Remote from one Bun process on one port: the Shell at /,
// the Remote's files under /remotes/prescription/.
//   EDGE_HINTS=0  plain static hosting: the baseline
//   EDGE_HINTS=1  the same, plus preload hints written into the HTML (see edge.ts)
import { extname, join, resolve } from 'node:path';
import { createEdge, type EdgeResult } from './edge';

const PORT = Number(process.env.PORT ?? 4200);
/** The origin the browser uses (behind the proxy: https://<host>). */
const PUBLIC_URL = (process.env.PUBLIC_URL ?? `http://localhost:${PORT}`).replace(/\/$/, '');
const REMOTE_PREFIX = '/remotes/prescription';
const EDGE_HINTS = process.env.EDGE_HINTS === '1';

const shellRoot = resolve('shell');
const remoteRoot = resolve('remote');

type RenderHtml = (html: string, pathname: string, stamp: number) => Promise<EdgeResult>;

interface Site {
  root: string;
  /** Replaces a static file. */
  overrides?: Record<string, () => Promise<Response>>;
  /** Fills in the HTML of pages (paths without an extension). Absent: the site has no pages. */
  page?: RenderHtml;
}

/** remotes.json as built points at localhost:4201; the Remote is now under this origin. */
async function publicManifest(): Promise<unknown> {
  const manifest: unknown = await Bun.file(join(shellRoot, 'remotes.json')).json();
  if (!Array.isArray(manifest)) return manifest;
  return manifest.map((item: unknown) => {
    if (typeof item !== 'object' || item === null || !('remoteEntry' in item)) return item;
    const entry = new URL(String(item.remoteEntry));
    return { ...item, remoteEntry: `${PUBLIC_URL}${REMOTE_PREFIX}${entry.pathname}${entry.search}` };
  });
}

const noCache = (path: string): boolean => path.endsWith('.json') || path.endsWith('.html');

function parse(request: Request): Response | { pathname: string } {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method Not Allowed', { status: 405, headers: { allow: 'GET, HEAD' } });
  }
  try {
    return { pathname: decodeURIComponent(new URL(request.url).pathname) };
  } catch {
    return new Response('Bad Request', { status: 400 });
  }
}

const plainPage: RenderHtml = async (html) => ({ html, debug: '' });

async function respond(site: Site, pathname: string): Promise<Response> {
  const override = site.overrides?.[pathname];
  if (override) return override();

  // A path with an extension is a file. Anything else is a page of the single-page app.
  const isPage = extname(pathname) === '';
  if (isPage && !site.page) return new Response('Not Found', { status: 404 });
  const target = resolve(site.root, isPage ? 'index.html' : `.${pathname}`);
  const file = Bun.file(target);
  if (!target.startsWith(`${site.root}/`) || !(await file.exists())) return new Response('Not Found', { status: 404 });

  const headers = new Headers();
  if (noCache(target)) headers.set('cache-control', 'no-cache');
  if (!isPage || !site.page) return new Response(file, { headers });

  const { html, debug } = await site.page(await file.text(), pathname, file.lastModified);
  headers.set('content-type', 'text/html; charset=utf-8');
  if (debug) headers.set('x-edge-hints', debug);
  return new Response(html, { headers });
}

const edge = EDGE_HINTS
  ? createEdge({
      shellRoot,
      remoteInternalUrl: `http://127.0.0.1:${PORT}`,
      publicOrigin: new URL(PUBLIC_URL).origin,
      readManifest: publicManifest,
    })
  : undefined;

const shell: Site = {
  root: shellRoot,
  overrides: {
    '/remotes.json': async () => Response.json(await publicManifest(), { headers: { 'cache-control': 'no-cache' } }),
  },
  page: edge ? edge.render : plainPage,
};
const remote: Site = { root: remoteRoot };

Bun.serve({
  port: PORT,
  async fetch(request) {
    const parsed = parse(request);
    if (parsed instanceof Response) return parsed;
    const underRemote = parsed.pathname.startsWith(`${REMOTE_PREFIX}/`);
    return underRemote
      ? respond(remote, parsed.pathname.slice(REMOTE_PREFIX.length))
      : respond(shell, parsed.pathname);
  },
});
console.log(`serving ${PUBLIC_URL} on :${PORT}, remote under ${REMOTE_PREFIX}/, edge hints ${EDGE_HINTS ? 'on' : 'off'}`);
