#!/usr/bin/env node
/**
 * Copies package.json, the READMEs and the CHANGELOG into out/ (the published
 * package), with READMEs that read outside GitHub.
 *
 * The Signal K App Store shows the README of the npm package: it escapes HTML,
 * so the centred <picture> logo showed as raw tags, and it resolves relative
 * paths against the package on unpkg, where docs/ is not published, so every
 * screenshot was broken. In the copies:
 *   - the <picture> logo becomes a plain Markdown image;
 *   - relative images point to raw.githubusercontent.com and relative links to
 *     github.com, both at the commit being published.
 *
 * Usage: node scripts/prepare-npm-package.mjs   (GITHUB_SHA, or git HEAD)
 */
import { execSync } from 'node:child_process';
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO = 'laborima/ocearo-ui';
const OUT = 'out';
const ref = process.env.GITHUB_SHA || execSync('git rev-parse HEAD').toString().trim();
const raw = (path) => `https://raw.githubusercontent.com/${REPO}/${ref}/${path}`;
const blob = (path) => `https://github.com/${REPO}/blob/${ref}/${path}`;
const isRelative = (url) => !/^([a-z]+:|#|\/\/)/i.test(url);

export function rewriteReadme(markdown) {
    return markdown
        // <p align="center"><picture>…<img src="x" alt="y">…</picture></p>
        .replace(/<p align="center">\s*<picture>[\s\S]*?<img src="([^"]+)" alt="([^"]*)"[^>]*>\s*<\/picture>\s*<\/p>/g,
            (_, src, alt) => `![${alt}](${isRelative(src) ? raw(src) : src})`)
        // Images first (![alt](path)), then links ([text](path))
        .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g,
            (m, alt, url) => isRelative(url) ? `![${alt}](${raw(url)})` : m)
        .replace(/(^|[^!])\[([^\]]+)\]\(([^)\s]+)\)/g,
            (m, pre, text, url) => isRelative(url) ? `${pre}[${text}](${blob(url)})` : m)
        // Linked badges: [![alt](image)](path)
        .replace(/\)\]\(([^)\s]+)\)/g,
            (m, url) => isRelative(url) ? `)](${blob(url)})` : m);
}

copyFileSync('package.json', join(OUT, 'package.json'));
copyFileSync('CHANGELOG.md', join(OUT, 'CHANGELOG.md'));
for (const name of ['README.md', 'README.fr.md']) {
    writeFileSync(join(OUT, name), rewriteReadme(readFileSync(name, 'utf8')));
}
console.log(`package files in ${OUT}/, README links at ${ref}`);
