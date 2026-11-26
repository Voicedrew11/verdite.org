// Site-wide settings and the tab bar. Change links here.

export const site = {
  title: "Verdite",
  description:
    "Native ports of the King’s Field games, with downloads, mods, a wiki and an archive.",
  github: "https://github.com/Voicedrew11",
  discord: "https://discord.gg/R4EKCs8RWH",
  wiki: "https://wiki.verdite.org",
};

export interface Tab {
  name: string;
  href: string;
}

// The tabs, in order. A tab is current when the page path starts with its href.
export const tabs: Tab[] = [
  { name: "Home", href: "/" },
  { name: "Downloads", href: "/downloads/" },
  { name: "Mods", href: "/mods/" },
  { name: "Wiki", href: site.wiki },
  { name: "Guides", href: "/guides/" },
  { name: "Archive", href: "/archive/" },
];
