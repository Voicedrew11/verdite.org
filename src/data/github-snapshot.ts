// Build time: asks GitHub once for every port's releases and stars, so pages
// can carry a copy to show when a visitor's browser can't reach GitHub.
// Set GITHUB_TOKEN in the build environment (a token with no scopes is
// enough) or GitHub may refuse a busy build machine; without an answer the
// build still succeeds and pages simply carry less.

import { games } from "./games";
import { fetchReleases, fetchStars, type Snapshot } from "../scripts/github";

let pending: Promise<Snapshot> | undefined;

/** The snapshot, fetched on the first call of a build and shared after. */
export function githubSnapshot(): Promise<Snapshot> {
  pending ??= load();
  return pending;
}

async function load(): Promise<Snapshot> {
  const token = process.env.GITHUB_TOKEN || undefined;
  const snapshot: Snapshot = { releases: {}, stars: {} };
  const owners = new Set(games.map((g) => g.repo.split("/")[0] ?? ""));

  await Promise.all([
    ...games.map(async (game) => {
      try {
        snapshot.releases[game.repo] = await fetchReleases(game.repo, token);
      } catch (err) {
        console.warn(`[github-snapshot] no releases for ${game.repo}: ${String(err)}`);
      }
    }),
    ...[...owners].map(async (owner) => {
      try {
        const all = await fetchStars(owner, token);
        // Keep only the ports' repos; the owner may have many others.
        const ports = games.filter((g) => g.repo.startsWith(`${owner}/`));
        snapshot.stars[owner] = Object.fromEntries(
          ports.map((g) => g.repo.split("/")[1]?.toLowerCase() ?? "")
            .filter((name) => name in all)
            .map((name) => [name, all[name] ?? 0]),
        );
      } catch (err) {
        console.warn(`[github-snapshot] no stars for ${owner}: ${String(err)}`);
      }
    }),
  ]);
  return snapshot;
}
