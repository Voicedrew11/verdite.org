// The two GitHub API questions the site asks, trimmed to the fields it uses.
// Runs both at build time (for the snapshot baked into pages) and in the
// visitor's browser (for live numbers).

export interface RawAsset {
  name: string;
  url: string;
  size: number;
  downloads: number;
}

export interface RawRelease {
  tag: string;
  published: string;
  page: string;
  assets: RawAsset[];
}

/** Star counts of an owner's repos, keyed by lower-case repo name. */
export type StarCounts = Record<string, number>;

/** What the build saw on GitHub; pages fall back to it when GitHub refuses. */
export interface Snapshot {
  releases: Record<string, RawRelease[]>;
  stars: Record<string, StarCounts>;
}

async function getJson(url: string, token?: string): Promise<unknown> {
  const headers: Record<string, string> = { Accept: "application/vnd.github+json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`GitHub answered ${res.status} for ${url}`);
  return res.json();
}

/** Published releases, newest first. Drafts and pre-releases are left out. */
export async function fetchReleases(repo: string, token?: string): Promise<RawRelease[]> {
  const json = await getJson(`https://api.github.com/repos/${repo}/releases?per_page=50`, token);
  if (!Array.isArray(json)) throw new Error("Unexpected answer from GitHub");
  return json
    .filter((r) => typeof r?.tag_name === "string" && !r.draft && !r.prerelease && Array.isArray(r.assets))
    .map((r) => ({
      tag: r.tag_name,
      published: String(r.published_at ?? ""),
      page: String(r.html_url ?? `https://github.com/${repo}/releases`),
      assets: r.assets.map((a: Record<string, unknown>) => ({
        name: String(a.name),
        url: String(a.browser_download_url),
        size: Number(a.size) || 0,
        downloads: Number(a.download_count) || 0,
      })),
    }));
}

export async function fetchStars(owner: string, token?: string): Promise<StarCounts> {
  const json = await getJson(`https://api.github.com/users/${owner}/repos?per_page=100`, token);
  if (!Array.isArray(json)) throw new Error("Unexpected answer from GitHub");
  const counts: StarCounts = {};
  for (const r of json) {
    if (typeof r?.name === "string") counts[r.name.toLowerCase()] = Number(r.stargazers_count) || 0;
  }
  return counts;
}
