// Asks GitHub about a port's repo, in the visitor's browser: its releases
// (newest first, with the files people download) and its star count.
// A page of four port cards makes five requests: one per repo for releases,
// and one for all the star counts.
// Publishing a release on GitHub updates the site with no rebuild.
// Answers are cached for 10 minutes per tab, so moving between pages
// doesn't spend GitHub's 60-requests-an-hour allowance.

export type Os = "windows" | "macos" | "linux" | "android" | "ios";

export interface FileKind {
  test: RegExp;
  label: string;
  os: Os;
}

// Order matters: the first matching rule names the file.
// Files that match no rule (deltas, checksums, debug symbols) are not shown.
export const KINDS: FileKind[] = [
  { test: /-setup\.exe$/i, label: "Windows installer", os: "windows" },
  { test: /-win-x64\.zip$/i, label: "Windows, portable zip", os: "windows" },
  { test: /\.AppImage$/i, label: "Linux AppImage", os: "linux" },
  { test: /-macos-arm64\.zip$/i, label: "macOS, Apple silicon", os: "macos" },
  { test: /\.apk$/i, label: "Android APK", os: "android" },
  { test: /\.ipa$/i, label: "iOS (sideload)", os: "ios" },
];

export interface ReleaseFile {
  name: string;
  url: string;
  bytes: number;
  kind: FileKind;
}

export interface Release {
  tag: string;
  published: string;
  /** The release's page on GitHub, with its notes. */
  page: string;
  /** Downloads of every file in the release, shown or not. */
  downloads: number;
  files: ReleaseFile[];
}

interface RawAsset {
  name: string;
  url: string;
  size: number;
  downloads: number;
}

interface RawRelease {
  tag: string;
  published: string;
  page: string;
  assets: RawAsset[];
}

const CACHE_MS = 10 * 60 * 1000;
const API = "https://api.github.com/repos/";

export function visitorOs(): Os | null {
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return "android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1) return "ios";
  if (/Windows/i.test(ua)) return "windows";
  if (/Macintosh|Mac OS X/i.test(ua)) return "macos";
  if (/Linux|X11/i.test(ua)) return "linux";
  return null;
}

/** Published releases, newest first. Drafts and pre-releases are left out. */
export async function releases(repo: string): Promise<Release[]> {
  const raw = await cached(`releases:${repo}`, () => fetchReleases(repo));
  return raw.map(toRelease);
}

/** A repo's star count. One request covers every repo of the same owner. */
export async function stars(repo: string): Promise<number> {
  const [owner, name] = repo.split("/");
  const counts = await starsByOwner(owner ?? "");
  const count = counts[(name ?? "").toLowerCase()];
  if (count === undefined) throw new Error(`No repo ${repo}`);
  return count;
}

// Shared between callers so cards that load together make one request.
const ownerRequests = new Map<string, Promise<Record<string, number>>>();

function starsByOwner(owner: string): Promise<Record<string, number>> {
  let request = ownerRequests.get(owner);
  if (!request) {
    request = cached(`stars:${owner}`, () => fetchStars(owner));
    request.catch(() => ownerRequests.delete(owner));
    ownerRequests.set(owner, request);
  }
  return request;
}

/** The file for the visitor's system that should be the big button, if any. */
export function fileFor(release: Release, os: Os | null): ReleaseFile | undefined {
  return os ? release.files.find((f) => f.kind.os === os) : undefined;
}

export function totalDownloads(list: Release[]): number {
  return list.reduce((sum, r) => sum + r.downloads, 0);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function formatMegabytes(bytes: number): string {
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export function formatCount(n: number): string {
  return n.toLocaleString(undefined, { notation: n >= 10000 ? "compact" : "standard", maximumFractionDigits: 1 });
}

function toRelease(raw: RawRelease): Release {
  const files: ReleaseFile[] = [];
  let downloads = 0;
  for (const asset of raw.assets) {
    downloads += asset.downloads;
    const kind = KINDS.find((k) => k.test.test(asset.name));
    if (kind) files.push({ name: asset.name, url: asset.url, bytes: asset.size, kind });
  }
  return { tag: raw.tag, published: raw.published, page: raw.page, downloads, files };
}

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
  if (!res.ok) throw new Error(`GitHub answered ${res.status}`);
  return res.json();
}

async function fetchReleases(repo: string): Promise<RawRelease[]> {
  const json = await getJson(`${API}${repo}/releases?per_page=50`);
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

async function fetchStars(owner: string): Promise<Record<string, number>> {
  const json = await getJson(`https://api.github.com/users/${owner}/repos?per_page=100`);
  if (!Array.isArray(json)) throw new Error("Unexpected answer from GitHub");
  const counts: Record<string, number> = {};
  for (const r of json) {
    if (typeof r?.name === "string") counts[r.name.toLowerCase()] = Number(r.stargazers_count) || 0;
  }
  return counts;
}

async function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = readCache<T>(key);
  if (hit !== null) return hit;
  const value = await load();
  writeCache(key, value);
  return value;
}

function readCache<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (Date.now() - entry.saved_ms > CACHE_MS) return null;
    return entry.value as T;
  } catch {
    return null;
  }
}

function writeCache(key: string, value: unknown): void {
  try {
    sessionStorage.setItem(key, JSON.stringify({ saved_ms: Date.now(), value }));
  } catch { /* storage unavailable; fine */ }
}
