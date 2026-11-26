// Site-wide settings and the tab bar. Change links here.

export const site = {
  title: "Verdite",
  description:
    "Native ports of classic games, starting with King’s Field, with downloads, mods, a wiki, and an archive.",
  github: "https://github.com/Voicedrew11",
  discord: "https://discord.gg/R4EKCs8RWH",
  wiki: "https://wiki.verdite.org",
};

export interface Tab {
  name: string;
  href: string;
  /** Shown as a link in the nav bar. Home is the logo; Downloads is the green button. */
  inNav: boolean;
}

// The site's pages, in order. A tab is current when the page path starts with its href.
export const tabs: Tab[] = [
  { name: "Home", href: "/", inNav: false },
  { name: "Downloads", href: "/downloads/", inNav: false },
  { name: "Mods", href: "/mods/", inNav: true },
  { name: "Wiki", href: site.wiki, inNav: true },
  { name: "Guides", href: "/guides/", inNav: true },
  { name: "Archive", href: "/archive/", inNav: true },
];
