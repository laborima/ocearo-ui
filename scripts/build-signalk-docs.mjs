#!/usr/bin/env node
/**
 * Rebuilds the Signal K documentation shipped in public/docs (Help view).
 *
 *   node scripts/build-signalk-docs.mjs [specVersion] [serverRef]
 *
 * - The specification: the single-page edition published by Signal K
 *   (signalk.org/specification/<version>/doc/print.html).
 * - The server guide: the user-facing pages of signalk-server/docs, in the
 *   order of its documentation site (installation, configuration, security,
 *   guides, support), without the developer section.
 *
 * Each becomes one self-contained HTML page (images inlined, table of
 * contents, light and dark themes) because phone browsers do not show PDF
 * files inside a page. Needs git and pandoc (3.x) on the PATH; development
 * tool only, nothing is added to the app's dependencies.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SPEC_VERSION = process.argv[2] || '1.8.4';
const SERVER_REF = process.argv[3] || 'master';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'docs');
const work = mkdtempSync(join(tmpdir(), 'signalk-docs-'));

const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { stdio: ['ignore', 'pipe', 'inherit'], ...opts }).toString();

// Minimal reading style; follows the device's light / dark setting
const CSS = `
:root{color-scheme:light dark;--bg:#fff;--fg:#1d2329;--muted:#5b6670;--line:#dde2e6;--code:#f3f5f7;--link:#0a6fc2}
@media (prefers-color-scheme:dark){:root{--bg:#121619;--fg:#e4e8eb;--muted:#9aa5ae;--line:#2a3238;--code:#1c2328;--link:#5fb0f0}}
html{-webkit-text-size-adjust:100%}
body{max-width:52rem;margin:0 auto;padding:8px 16px 48px;background:var(--bg);color:var(--fg);font:16px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;overflow-wrap:anywhere}
h1,h2,h3,h4{line-height:1.25;margin:1.6em 0 .5em}
h1{font-size:1.7rem;border-bottom:1px solid var(--line);padding-bottom:.3em}
h2{font-size:1.35rem}h3{font-size:1.12rem}
.subtitle{color:var(--muted);margin-top:-.3em}
a{color:var(--link)}
img{max-width:100%;height:auto}
pre,code{font:13px/1.5 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;background:var(--code);border-radius:6px}
code{padding:.1em .3em}pre{padding:12px;overflow-x:auto}pre code{padding:0;background:none}
table{border-collapse:collapse;display:block;overflow-x:auto;max-width:100%;margin:1em 0}
th,td{border:1px solid var(--line);padding:6px 10px;text-align:left;vertical-align:top}
blockquote{margin:1em 0;padding:.2em 1em;border-left:4px solid var(--line);color:var(--muted)}
nav#TOC{border-bottom:1px solid var(--line);padding-bottom:12px;font-size:15px}
nav#TOC ul{padding-left:1.2em}nav#TOC>ul{padding-left:0;list-style:none}
`;

const pandoc = (input, output, { title, subtitle, from }) => {
    const cssFile = join(work, 'style.css');
    writeFileSync(cssFile, CSS);
    run('pandoc', [
        input, '-f', from, '-t', 'html5', '-s', '--embed-resources', '--toc', '--toc-depth=2',
        '--css', cssFile, '-V', 'document-css=false', '--no-highlight', '--resource-path', dirname(input),
        '-M', `title=${title}`, '-M', `subtitle=${subtitle}`, '-M', 'lang=en',
        '-o', output,
    ]);
};

// ---------- Specification ----------
const specUrl = `https://signalk.org/specification/${SPEC_VERSION}/doc/`;
const printHtml = run('curl', ['-sfL', `${specUrl}print.html`]);
const main = printHtml.match(/<main>([\s\S]*?)<\/main>/)?.[1];
if (!main) throw new Error('Specification print page: no <main> found');
// Images are relative to the doc folder: fetch them next to the extract
for (const src of new Set([...main.matchAll(/<img[^>]+src="([^"]+)"/g)].map(m => m[1]))) {
    if (/^https?:/.test(src)) continue;
    run('curl', ['-sfL', '-o', join(work, src), specUrl + src]);
}
const specIn = join(work, 'spec.html');
// mdBook's anchor links ("#") on every heading would show as stray characters
writeFileSync(specIn, `<html><body>${main.replace(/<a class="header" href="[^"]*">([\s\S]*?)<\/a>/g, '$1')}</body></html>`);
pandoc(specIn, join(OUT, 'signalk-specification.html'), {
    from: 'html',
    title: 'Signal K Specification',
    subtitle: `Version ${SPEC_VERSION} — signalk.org/specification`,
});

// ---------- Server guide ----------
const repo = join(work, 'server');
run('git', ['clone', '-q', '--depth', '1', '--branch', SERVER_REF, 'https://github.com/SignalK/signalk-server.git', repo]);
const docs = join(repo, 'docs');
const version = JSON.parse(readFileSync(join(repo, 'package.json'), 'utf8')).version;

const frontMatter = (text) => {
    const m = text.match(/^---\n([\s\S]*?)\n---\n/);
    return { meta: m ? m[1] : '', body: m ? text.slice(m[0].length) : text };
};
const children = (meta) => [...meta.matchAll(/^\s+-\s+(\S+)/gm)].map(m => m[1]);

// The documentation site's order: each page, then the pages it lists as children
const order = [];
const visit = (file) => {
    if (!existsSync(join(docs, file))) return;
    order.push(file);
    for (const child of children(frontMatter(readFileSync(join(docs, file), 'utf8')).meta)) {
        visit(join(dirname(file), child));
    }
};
['README.md', 'installation/README.md', 'setup/configuration.md', 'security.md',
    'guides/README.md', 'support/help.md'].forEach(visit);

// One markdown file; image paths made relative to docs/ so pandoc finds them
const md = order.map((file) => {
    const { body } = frontMatter(readFileSync(join(docs, file), 'utf8'));
    const dir = dirname(file);
    return body
        .replace(/!\[([^\]]*)\]\((?!https?:)([^)\s]+)\)/g, (_, alt, src) => `![${alt}](${join(dir, src)})`)
        .replace(/<img([^>]*?)src="(?!https?:)([^"]+)"/g, (_, attrs, src) => `<img${attrs}src="${join(dir, src)}"`);
}).join('\n\n');
// Screenshots are inlined: shrink them first (ImageMagick, when installed)
// or the page weighs several megabytes
try {
    const images = run('find', [docs, '-type', 'f', '(', '-name', '*.png', '-o', '-name', '*.jpg', ')']).trim().split('\n').filter(Boolean);
    for (const image of images) {
        const lossy = image.endsWith('.jpg') ? ['-quality', '72'] : ['-colors', '96'];
        run('magick', [image, '-resize', '900x900>', '-strip', ...lossy, image]);
    }
} catch {
    console.warn('ImageMagick not found: images inlined at full size');
}

const serverIn = join(docs, 'ocearo-bundle.md');
writeFileSync(serverIn, md);
pandoc(serverIn, join(OUT, 'signalk-server.html'), {
    from: 'gfm',
    title: 'Signal K Server',
    subtitle: `User guide, version ${version} — github.com/SignalK/signalk-server`,
});

// Help view tabs: the two pages first, their versions in the titles
const indexFile = join(OUT, 'index.json');
const others = JSON.parse(readFileSync(indexFile, 'utf8'))
    .filter(d => !['signalk-specification.html', 'signalk-server.html'].includes(d.file));
writeFileSync(indexFile, JSON.stringify([
    { file: 'signalk-specification.html', title: `Signal K Specification ${SPEC_VERSION}` },
    { file: 'signalk-server.html', title: `Signal K Server ${version}` },
    ...others,
], null, 4) + '\n');

rmSync(work, { recursive: true, force: true });
console.log(`Signal K specification ${SPEC_VERSION} and server ${version} written to public/docs`);
