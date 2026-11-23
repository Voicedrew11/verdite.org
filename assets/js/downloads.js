// Fills each <section data-repo> on the downloads page with that repo's
// latest GitHub release, and marks the files that match the visitor's system.
// Without JavaScript the page still links to each release on GitHub.

(function () {
  "use strict";

  // Order matters: the first matching rule names the file.
  // Files that match no rule (deltas, checksums, debug symbols) are not shown.
  var KINDS = [
    { test: /-setup\.exe$/i, label: "Windows installer", os: "windows" },
    { test: /-win-x64\.zip$/i, label: "Windows, portable zip", os: "windows" },
    { test: /\.AppImage$/i, label: "Linux, AppImage", os: "linux" },
    { test: /-macos-arm64\.zip$/i, label: "macOS, Apple silicon", os: "macos" },
    { test: /\.apk$/i, label: "Android", os: "android" },
    { test: /\.ipa$/i, label: "iOS (sideload)", os: "ios" }
  ];

  var CACHE_MS = 10 * 60 * 1000;

  function visitorOs() {
    var ua = navigator.userAgent;
    if (/Android/i.test(ua)) return "android";
    if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
    if (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1) return "ios";
    if (/Windows/i.test(ua)) return "windows";
    if (/Macintosh|Mac OS X/i.test(ua)) return "macos";
    if (/Linux|X11/i.test(ua)) return "linux";
    return "";
  }

  function kindOf(name) {
    for (var i = 0; i < KINDS.length; i++) {
      if (KINDS[i].test.test(name)) return KINDS[i];
    }
    return null;
  }

  function megabytes(bytes) {
    return (bytes / 1048576).toFixed(1) + " MB";
  }

  function readCache(repo) {
    try {
      var raw = sessionStorage.getItem("release:" + repo);
      if (!raw) return null;
      var entry = JSON.parse(raw);
      if (Date.now() - entry.saved_ms > CACHE_MS) return null;
      return entry.release;
    } catch (e) {
      return null;
    }
  }

  function writeCache(repo, release) {
    try {
      sessionStorage.setItem("release:" + repo,
        JSON.stringify({ saved_ms: Date.now(), release: release }));
    } catch (e) { /* storage unavailable; fine */ }
  }

  function fetchRelease(repo) {
    var cached = readCache(repo);
    if (cached) return Promise.resolve(cached);
    return fetch("https://api.github.com/repos/" + repo + "/releases/latest", {
      headers: { Accept: "application/vnd.github+json" }
    }).then(function (res) {
      if (!res.ok) throw new Error("GitHub answered " + res.status);
      return res.json();
    }).then(function (json) {
      var release = {
        tag: json.tag_name,
        published: json.published_at,
        assets: json.assets.map(function (a) {
          return { name: a.name, url: a.browser_download_url, size: a.size };
        })
      };
      writeCache(repo, release);
      return release;
    });
  }

  function render(section, release, os) {
    var date = new Date(release.published).toLocaleDateString(undefined,
      { year: "numeric", month: "short", day: "numeric" });
    section.querySelector(".release").textContent = release.tag + " · " + date;

    var list = section.querySelector(".assets");
    var mine = [];
    var others = [];
    release.assets.forEach(function (asset) {
      var kind = kindOf(asset.name);
      if (!kind) return;
      (kind.os === os ? mine : others).push({ asset: asset, kind: kind });
    });

    mine.concat(others).forEach(function (entry) {
      var li = document.createElement("li");
      if (entry.kind.os === os) li.className = "yours";
      var a = document.createElement("a");
      a.href = entry.asset.url;
      a.textContent = entry.kind.label;
      var size = document.createElement("span");
      size.className = "size";
      size.textContent = " " + megabytes(entry.asset.size);
      li.appendChild(a);
      li.appendChild(size);
      list.appendChild(li);
    });
  }

  var os = visitorOs();
  document.querySelectorAll("section[data-repo]").forEach(function (section) {
    fetchRelease(section.dataset.repo)
      .then(function (release) { render(section, release, os); })
      .catch(function () {
        section.querySelector(".release").textContent =
          "(could not reach GitHub; use the link below)";
      });
  });
})();
