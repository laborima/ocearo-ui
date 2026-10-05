#!/usr/bin/env node
/**
 * Builds the Ocearo website (www/dist) from plain HTML templates, with no
 * dependencies: `node www/build.mjs`.
 *
 * - src/pages/*.html are rendered once per language (English at /, French at /fr/).
 * - {{t.key.path}} inserts a string from src/i18n/<lang>.json, {{> name}} a partial
 *   from src/partials, {{lang}}, {{base}}, {{site}}, {{url}}, {{alt.<lang>}}, {{year}}
 *   are page variables, and {{#each t.list}}…{{/each}} repeats a block over an
 *   array ({{.field}} inside).
 * - Root-absolute URLs in templates are moved under the path of SITE_URL, so the
 *   same templates serve laborima.github.io/ocearo-ui/ and a custom domain.
 * - Screenshots come straight from ../docs/screenshots, the logo from ../docs/logo
 *   and the favicons from ../public, so the site never drifts from the app.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(ROOT, '..');
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, process.env.OUT_DIR || 'dist');
const SITE = (process.env.SITE_URL || 'https://laborima.github.io/ocearo-ui').replace(/\/$/, '');
/** Path the site is served under ('/ocearo-ui' on GitHub project pages, '' on its own domain). */
const BASE = new URL(SITE).pathname.replace(/\/$/, '');
const LANGS = ['en', 'fr', 'pt'];
const PKG = JSON.parse(fs.readFileSync(path.join(REPO, 'package.json'), 'utf8'));

/** Pages and their slug in each language. */
const PAGES = [
  { tpl: 'index', slug: { en: '', fr: '', pt: '' }, priority: '1.0' },
  { tpl: 'demo', slug: { en: 'demo/', fr: 'demo/', pt: 'demo/' }, priority: '0.8' },
  { tpl: 'brand', slug: { en: 'brand/', fr: 'charte-graphique/', pt: 'marca/' }, priority: '0.4' },
];

const read = (p) => fs.readFileSync(p, 'utf8');
const i18n = Object.fromEntries(LANGS.map((l) => [l, JSON.parse(read(path.join(SRC, 'i18n', `${l}.json`)))]));
const partials = Object.fromEntries(
  fs.readdirSync(path.join(SRC, 'partials')).map((f) => [path.basename(f, '.html'), read(path.join(SRC, 'partials', f))]),
);

const prefix = (lang) => (lang === 'en' ? '/' : `/${lang}/`);
const pageUrl = (page, lang) => `${prefix(lang)}${page.slug[lang]}`;

/** BCP 47 tag of a language, for <html lang> and hreflang (the pt pages are pt-BR). */
const tag = (code) => i18n[code].html_lang || code;

/** Language switcher and hreflang entries for one page, the current language marked. */
const langNav = (page, current) => LANGS.map((code) => ({
  code: tag(code),
  label: code.toUpperCase(),
  path: pageUrl(page, code),
  url: `${SITE}${pageUrl(page, code)}`,
  current: String(code === current),
}));

function lookup(obj, key) {
  return key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

function render(tpl, vars, depth = 0) {
  if (depth > 8) throw new Error('Partial recursion too deep');
  let out = tpl.replace(/{{>\s*([\w-]+)\s*}}/g, (_, name) => {
    if (!(name in partials)) throw new Error(`Unknown partial: ${name}`);
    return render(partials[name], vars, depth + 1);
  });
  out = out.replace(/{{#each\s+([\w.]+)\s*}}([\s\S]*?){{\/each}}/g, (_, key, block) => {
    const list = lookup(vars, key);
    if (!Array.isArray(list)) throw new Error(`Not a list: ${key}`);
    return list
      .map((item, i) => block.replace(/{{\.([\w.]+)}}/g, (m, k) => (k === 'index' ? String(i + 1) : lookup(item, k) ?? '')))
      .join('');
  });
  return out.replace(/{{\s*([\w.]+)\s*}}/g, (m, key) => {
    const v = lookup(vars, key);
    if (v === undefined) throw new Error(`Missing value for {{${key}}} (${vars.lang})`);
    return typeof v === 'object' ? JSON.stringify(v) : String(v);
  });
}

/** Structured data for search engines, as a ready-to-inline <script> block. */
function jsonLd(page, lang, url) {
  const t = i18n[lang];
  const graph = [];
  if (page.tpl === 'index') {
    graph.push({
      '@type': 'SoftwareApplication',
      name: 'Ocearo',
      alternateName: 'Ocearo UI',
      description: t.pages.index.description,
      url,
      applicationCategory: 'TravelApplication',
      applicationSubCategory: 'Marine navigation display',
      operatingSystem: 'Signal K server (Linux, Raspberry Pi), any web browser',
      softwareVersion: PKG.version,
      license: 'https://www.apache.org/licenses/LICENSE-2.0',
      image: `${SITE}/assets/shots/hero.jpg`,
      screenshot: ['hero', 'colregs', 'bathymetry', 'dashboard-dark'].map((s) => `${SITE}/assets/shots/${s}.jpg`),
      downloadUrl: 'https://www.npmjs.com/package/ocearo-ui',
      codeRepository: 'https://github.com/laborima/ocearo-ui',
      inLanguage: ['en', 'fr', 'de', 'es', 'it', 'nl', 'pt', 'da', 'sv', 'fi', 'pl', 'el'],
      author: { '@type': 'Person', name: 'Matthieu Laborie' },
    });
    graph.push({
      '@type': 'FAQPage',
      mainEntity: t.faq.items.map((q) => ({ '@type': 'Question', name: q.q, acceptedAnswer: { '@type': 'Answer', text: q.a } })),
    });
    graph.push({ '@type': 'WebSite', name: 'Ocearo', url: `${SITE}${prefix(lang)}`, inLanguage: tag(lang) });
  } else {
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Ocearo', item: `${SITE}${prefix(lang)}` },
        { '@type': 'ListItem', position: 2, name: t.pages[page.tpl].crumb, item: url },
      ],
    });
  }
  const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
  return `<script type="application/ld+json">${json}</script>`;
}

/** Templates use root-absolute URLs (/assets/…); move them under BASE. */
function withBase(html) {
  if (!BASE) return html;
  return html
    .replace(/(\s(?:href|src|poster|data-demo)=")\/(?!\/)/g, `$1${BASE}/`)
    .replace(/url\('\/(?!\/)/g, `url('${BASE}/`);
}

function copyDir(from, to, filter = () => true) {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const s = path.join(from, e.name);
    const d = path.join(to, e.name);
    if (e.isDirectory()) copyDir(s, d, filter);
    else if (filter(e.name)) fs.copyFileSync(s, d);
  }
}

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

for (const page of PAGES) {
  const tpl = read(path.join(SRC, 'pages', `${page.tpl}.html`));
  for (const lang of LANGS) {
    const alt = Object.fromEntries(LANGS.map((l) => [l, `${SITE}${pageUrl(page, l)}`]));
    const altPath = Object.fromEntries(LANGS.map((l) => [l, pageUrl(page, l)]));
    const links = Object.fromEntries(PAGES.map((p) => [p.tpl, pageUrl(p, lang)]));
    const t = i18n[lang];
    const vars = {
      t,
      meta: t.pages[page.tpl],
      jsonld: jsonLd(page, lang, `${SITE}${pageUrl(page, lang)}`),
      lang,
      base: prefix(lang),
      site: SITE,
      url: `${SITE}${pageUrl(page, lang)}`,
      path: pageUrl(page, lang),
      page: page.tpl,
      alt,
      altPath,
      langs: langNav(page, lang),
      links,
      year: new Date().getFullYear(),
      version: PKG.version,
    };
    const html = render(tpl, vars);
    const file = path.join(DIST, pageUrl(page, lang), 'index.html');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, withBase(html));
  }
}

// 404, served by GitHub Pages for every unknown path (English, links to both languages)
fs.writeFileSync(
  path.join(DIST, '404.html'),
  withBase(render(read(path.join(SRC, 'pages', '404.html')), {
    t: i18n.en, tfr: i18n.fr, meta: i18n.en.pages['404'], jsonld: '', version: PKG.version, lang: 'en', base: '/', site: SITE, url: `${SITE}/404.html`, path: '/404.html', page: '404',
    alt: { en: SITE + '/', fr: SITE + '/fr/' }, altPath: { en: '/', fr: '/fr/' }, langs: langNav(PAGES[0], 'en'), links: { index: '/', demo: '/demo/', brand: '/brand/' }, year: new Date().getFullYear(),
  })),
);

// Assets
copyDir(path.join(ROOT, 'assets'), path.join(DIST, 'assets'));
copyDir(path.join(REPO, 'docs', 'screenshots'), path.join(DIST, 'assets', 'shots'), (n) => /\.(jpe?g|png|webp)$/i.test(n));
copyDir(path.join(REPO, 'docs', 'logo'), path.join(DIST, 'assets', 'logo'), (n) => n.endsWith('.svg'));
for (const f of ['favicon.ico', 'favicon.svg', 'favicon-96x96.png', 'apple-touch-icon.png']) {
  fs.copyFileSync(path.join(REPO, 'public', f), path.join(DIST, f));
}
copyDir(path.join(REPO, 'public', 'icons'), path.join(DIST, 'icons'), (n) => /^(favicon|icon)-.*\.png$/.test(n));

// SEO files
const today = new Date().toISOString().slice(0, 10);
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  ...PAGES.flatMap((page) =>
    LANGS.map((lang) => [
      '  <url>',
      `    <loc>${SITE}${pageUrl(page, lang)}</loc>`,
      `    <lastmod>${today}</lastmod>`,
      `    <priority>${page.priority}</priority>`,
      ...LANGS.map((l) => `    <xhtml:link rel="alternate" hreflang="${tag(l)}" href="${SITE}${pageUrl(page, l)}"/>`),
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}${pageUrl(page, 'en')}"/>`,
      '  </url>',
    ].join('\n')),
  ),
  '</urlset>',
  '',
].join('\n');
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), sitemap);
fs.writeFileSync(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: ${BASE}/app/\n\nSitemap: ${SITE}/sitemap.xml\n`);
const host = new URL(SITE).hostname;
if (!host.endsWith('github.io')) fs.writeFileSync(path.join(DIST, 'CNAME'), `${host}\n`);
fs.writeFileSync(path.join(DIST, '.nojekyll'), '');

console.log(`Built ${PAGES.length * LANGS.length + 1} pages into ${path.relative(REPO, DIST)} for ${SITE}`);
