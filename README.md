# verdite.org

The Verdite project website. Plain Astro, no theme, no UI framework.

## Edit

- Ports: `src/data/games.ts`, plus a 256px icon in `src/assets/ports/`. Each entry
  appears in the hero chips, the port cards (home and downloads) and gets its own
  page at `/games/<name>/` (`src/pages/games/[slug].astro`).
- Links and tabs: `src/data/site.ts`.
- Page text: `src/pages/` (`index.astro` is the front page; mods, guides and archive are Markdown).
  The port cards with live GitHub numbers are `src/components/PortsSection.astro`.
- Look: `src/styles/site.css` (colours and fonts at the top). Nav and footer: `src/layouts/Base.astro`.
- Logo: `src/assets/verdite-project.webp` (white on transparent).
- Downloads logic (GitHub releases, which file is which): `src/scripts/releases.ts`.
- Front-page intro: `src/components/Intro.astro` (markup, styles) and
  `src/scripts/intro.ts` (timing constants at the top). The verdite is the
  King's Field II model in `src/assets/verdite.obj`, drawn live as a wireframe
  by `src/scripts/verdite-render.ts` (the hero's spinning gem uses it too).
  It plays once per browser tab, never with reduced motion, and any click, key
  or scroll skips it.

Port cards and port pages ask GitHub for releases, download counts and stars
in the visitor's browser, so publishing a release updates the site with no
rebuild. GitHub allows each visitor's address 60 requests an hour; a page of
cards uses five, and answers are kept in the browser for 10 minutes across tabs.
When GitHub refuses, pages show the browser's older copy, or else a snapshot
the build baked into the page (`src/data/github-snapshot.ts`), so numbers can
be stale but never missing.

## Run locally

    npm install
    npm run dev        # http://localhost:4321
    npm run check      # type check

## Deploy (Cloudflare Workers)

The Worker serves the static build in `dist/` (see `wrangler.jsonc`). In the
Cloudflare dashboard (Workers & Pages → the verdite-org Worker → Settings → Build) set:

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Variable `GITHUB_TOKEN`: a GitHub token with no scopes (fine-grained,
  public repositories, read-only). Without it GitHub often refuses shared build
  machines, and pages ship without a snapshot. The token is only used during
  the build and never reaches the pages.

Remove the old `HUGO_VERSION` variable; it is no longer used.
