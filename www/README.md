# Ocearo website

The public site at <https://laborima.github.io/ocearo-ui/>: plain HTML, CSS and JavaScript, English at `/`, French at `/fr/` and Brazilian Portuguese at `/pt/` (declared as `pt-BR` through `html_lang`), with the live demo (the app itself) served under `app/`.

```sh
node www/build.mjs                 # writes www/dist
cd www/dist && python3 -m http.server 8765
```

For a local preview, build with `SITE_URL=http://localhost:8765 node www/build.mjs` so the links start at `/`. The demo page needs the app next to the site: copy a production build (`npm run build`, then `out/`) to `www/dist/app/` and move `www/dist/app/_next` to `www/dist/ocearo-ui/_next` (the app's assetPrefix). The GitHub workflow assembles all this on every push to `main`.

- `src/pages/` — page templates, rendered once per language.
- `src/partials/` — head, navigation and footer.
- `src/i18n/<lang>.json` — every text of the site, titles and descriptions for search engines included. Keep the files in step. `media_lang` picks the language of the feature clips (`en` where no dubbed clip exists).
- A new language: add its file, its code to `LANGS` and its slugs in `build.mjs`, and a 1200×630 `assets/img/og-<lang>.jpg`; the switcher, hreflang links and sitemap follow.
- `assets/` — stylesheet, script, fonts (Geist, SIL OFL), short feature clips and the social-sharing images.
- Screenshots come from `docs/screenshots/`, the logo from `docs/logo/` and the favicons from `public/`: update them there and the site follows.

**YouTube.** Once the tour is published, put the video id (the part after `v=`) in `video.youtube_id` of each language file. Until then the player shows “Coming soon on YouTube”.

**Domain.** `SITE_URL` (default `https://laborima.github.io/ocearo-ui`) sets canonical links, the sitemap and the path the pages are served under. To move to a domain of your own, set `SITE_URL=https://your.domain` in the workflow (a `CNAME` file is then written), add a DNS `CNAME` record to `laborima.github.io`, and serve the app's `_next` from `/ocearo-ui/_next` (or rebuild the app with a matching assetPrefix).
