# verdite.org

The Verdite project website. Plain Astro, no theme, no UI framework.

## Edit

- Ports on the downloads page: `src/data/games.ts`. Adding an entry is all it takes.
- Links and tabs: `src/data/site.ts`.
- Page text: `src/pages/` (`index.astro` is the front page; mods, guides and archive are Markdown).
- Look: `src/styles/site.css` (colours and fonts at the top). Nav and footer: `src/layouts/Base.astro`.
- Logo: `src/assets/verdite-project.webp` (white on transparent).
- Downloads logic (GitHub releases, which file is which): `src/scripts/releases.ts`.
- Front-page intro: `src/components/Intro.astro` (markup, styles) and
  `src/scripts/intro.ts` (timing constants at the top). The verdite is the
  King's Field II model in `src/assets/verdite.obj`, drawn live as a wireframe
  by `src/scripts/verdite-render.ts` (the hero's spinning gem uses it too).
  It plays once per browser tab, never with reduced motion, and any click, key
  or scroll skips it.

The downloads page asks GitHub for each repo's latest release in the
visitor's browser, so publishing a release updates the site with no rebuild.

## Run locally

    npm install
    npm run dev        # http://localhost:4321
    npm run check      # type check

## Deploy (Cloudflare Workers)

The Worker serves the static build in `dist/` (see `wrangler.jsonc`). In the
Cloudflare dashboard (Workers & Pages → the verdite-org Worker → Settings → Build) set:

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`

Remove the old `HUGO_VERSION` variable; it is no longer used.
