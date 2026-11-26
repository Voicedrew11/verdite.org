// Release data for the visitor's browser: each repo's releases (newest
// first, with the files people download) and its star count.
// Publishing a release on GitHub updates the site with no rebuild.
//
// Where an answer comes from, in order:
//   1. this browser's copy, if under 10 minutes old (shared across tabs);
//   2. GitHub itself (60 requests an hour per visitor's address; a page of
//      port cards uses five);
//   3. this browser's older copy, then the snapshot the build put in the page.
// So when GitHub refuses, pages show slightly old numbers instead of none.

import {
  fetchReleases, fetchStars, type RawRelease, type Snapshot, type StarCounts,
} from "./github";

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

const CACHE_MS = 10 * 60 * 1000;

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
  const raw = await cached(`releases:${repo}`, () => fetchReleases(repo), (snap) => snap.releases[repo]);
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
const ownerRequests = new Map<string, Promise<StarCounts>>();

function starsByOwner(owner: string): Promise<StarCounts> {
  let request = ownerRequests.get(owner);
  if (!request) {
    request = cached(`stars:${owner}`, () => fetchStars(owner), (snap) => snap.stars[owner]);
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

async function cached<T>(
  key: string,
  load: () => Promise<T>,
  fromSnapshot: (snapshot: Snapshot) => T | undefined,
): Promise<T> {
  const saved = readSaved<T>(key);
  if (saved && Date.now() - saved.saved_ms < CACHE_MS) return saved.value;
  try {
    const value = await load();
    writeSaved(key, value);
    return value;
  } catch (err) {
    const fallback = saved?.value ?? fromSnapshot(pageSnapshot());
    if (fallback === undefined) throw err;
    return fallback;
  }
}

interface Saved<T> {
  saved_ms: number;
  value: T;
}

const STORAGE_PREFIX = "github:";

function readSaved<T>(key: string): Saved<T> | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    return typeof entry?.saved_ms === "number" ? (entry as Saved<T>) : null;
  } catch {
    return null;
  }
}

function writeSaved(key: string, value: unknown): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify({ saved_ms: Date.now(), value }));
  } catch { /* storage unavailable; fine */ }
}

let snapshot: Snapshot | undefined;

/** The build's snapshot from <script id="github-snapshot">, or an empty one. */
function pageSnapshot(): Snapshot {
  if (snapshot) return snapshot;
  snapshot = { releases: {}, stars: {} };
  try {
    const text = document.getElementById("github-snapshot")?.textContent;
    if (text) snapshot = JSON.parse(text) as Snapshot;
  } catch { /* a broken snapshot is the same as none */ }
  return snapshot;
}
