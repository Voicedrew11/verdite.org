// Asks GitHub for a repo's latest release, in the visitor's browser, and sorts
// its files into the ones people download. Publishing a release on GitHub
// updates the site with no rebuild. Results are cached for 10 minutes per tab.

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
  files: ReleaseFile[];
}

interface CachedAsset {
  name: string;
  url: string;
  size: number;
}

interface CachedRelease {
  tag: string;
  published: string;
  assets: CachedAsset[];
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

export async function latestRelease(repo: string): Promise<Release> {
  const raw = readCache(repo) ?? (await fetchRaw(repo));
  const files: ReleaseFile[] = [];
  for (const asset of raw.assets) {
    const kind = KINDS.find((k) => k.test.test(asset.name));
    if (kind) files.push({ name: asset.name, url: asset.url, bytes: asset.size, kind });
  }
  return { tag: raw.tag, published: raw.published, files };
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function formatMegabytes(bytes: number): string {
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

async function fetchRaw(repo: string): Promise<CachedRelease> {
  const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!res.ok) throw new Error(`GitHub answered ${res.status}`);
  const json = await res.json();
  if (typeof json?.tag_name !== "string" || !Array.isArray(json.assets)) {
    throw new Error("Unexpected answer from GitHub");
  }
  const release: CachedRelease = {
    tag: json.tag_name,
    published: String(json.published_at ?? ""),
    assets: json.assets.map((a: { name: string; browser_download_url: string; size: number }) => ({
      name: String(a.name),
      url: String(a.browser_download_url),
      size: Number(a.size) || 0,
    })),
  };
  writeCache(repo, release);
  return release;
}

function readCache(repo: string): CachedRelease | null {
  try {
    const raw = sessionStorage.getItem(`release:${repo}`);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (Date.now() - entry.saved_ms > CACHE_MS) return null;
    return entry.release as CachedRelease;
  } catch {
    return null;
  }
}

function writeCache(repo: string, release: CachedRelease): void {
  try {
    sessionStorage.setItem(`release:${repo}`, JSON.stringify({ saved_ms: Date.now(), release }));
  } catch { /* storage unavailable; fine */ }
}
