# verdite.org

The Verdite project website. Plain Hugo, no theme.

## Edit

- Ports on the downloads page: `data/games.toml`. Adding an entry is all it takes.
- Page text: `content/*.md`.
- Look: `assets/css/site.css`. Templates: `layouts/`.

The downloads page asks GitHub for each repo's latest release in the
visitor's browser, so publishing a release updates the site with no rebuild.

## Run locally

    hugo server

## Deploy (Cloudflare Workers)

Connect this repo in the Cloudflare dashboard (Workers & Pages → Create →
Import a repository) and set:

- Build command: `hugo --minify`
- Deploy command: `npx wrangler deploy`
- Environment variable: `HUGO_VERSION=0.165.0` (templates need Hugo 0.156 or newer)

Then add `verdite.org` as a custom domain on the Worker.
