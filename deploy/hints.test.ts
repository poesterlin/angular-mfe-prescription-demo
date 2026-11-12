import { expect, test } from 'bun:test';
import { crawl, injectHints, remoteForPath, scanImports } from './hints';

test('scanImports finds static, side-effect, re-export and dynamic imports', () => {
  const source = 'import{a as b}from"./one.js";import"./two.js";export*from"./three.js";import("./four.js");import x from"rxjs"';
  expect(scanImports(source)).toEqual(['./one.js', './two.js', './three.js', './four.js', 'rxjs']);
});

test('crawl follows relative and internal imports, skips bare ones, and stops at the limit', async () => {
  const files: Record<string, string> = {
    'main.js': 'import"./a.js";import("./sub/b.js");import"@angular/core";import"@nf-internal/c"',
    'a.js': 'import"./main.js"',
    'sub/b.js': 'import"../d.js"',
    'c-file.js': '',
    'd.js': '',
  };
  const read = async (file: string) => files[file] ?? null;
  const internal = { '@nf-internal/c': 'c-file.js' };
  expect(await crawl(['main.js'], { read, internal })).toEqual(['main.js', 'a.js', 'sub/b.js', 'c-file.js', 'd.js']);
  expect(await crawl(['main.js'], { read, internal, limit: 2 })).toEqual(['main.js', 'a.js']);
});

test('injectHints adds the block before </head> and turns modulepreload into the shim kind', () => {
  const html = '<html><head><link rel="modulepreload" href="x.js"></head><body></body></html>';
  const out = injectHints(html, { origins: ['http://r'], fetches: ['remotes.json'], modules: ['x.js', 'y.js'] });
  expect(out.match(/href="x\.js"/g)).toHaveLength(1);
  expect(out).toContain('<link rel="modulepreload-shim" href="x.js">');
  expect(out).not.toContain('rel="modulepreload"');
  expect(out).toContain('<link rel="preconnect" href="http://r" crossorigin>');
  expect(out).toContain('<link rel="preload" as="fetch" href="remotes.json" crossorigin>');
  expect(out).toContain('<link rel="modulepreload-shim" href="y.js">\n</head>');
});

test('remoteForPath matches the route and its sub-paths only', () => {
  const remotes = [{ remoteEntry: 'http://r/remoteEntry.json', exposedModule: './routes', routePath: 'prescriptions' }];
  expect(remoteForPath('/prescriptions', remotes)).toBe(remotes[0]);
  expect(remoteForPath('/prescriptions/7', remotes)).toBe(remotes[0]);
  expect(remoteForPath('/prescriptions-old', remotes)).toBeUndefined();
  expect(remoteForPath('/', remotes)).toBeUndefined();
});
