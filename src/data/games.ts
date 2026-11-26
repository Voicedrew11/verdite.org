// One entry per port. The home and downloads pages list them in this order,
// and each gets its own page at /games/<name>/. Release details come from
// GitHub in the visitor's browser.
// To add a port, add an entry here and its 256px icon in src/assets/ports/;
// nothing else needs to change.

import type { ImageMetadata } from "astro";
import verdite1Icon from "../assets/ports/verdite1.png";
import verdite2Icon from "../assets/ports/verdite2.png";
import verdite3Icon from "../assets/ports/verdite3.png";
import holylandIcon from "../assets/ports/holyland.png";
import holylandIdol from "../assets/ports/holyland-idol.png";

/** A cut-out picture, turned and mirrored freely, rim-lit with `glow` (a CSS
    colour) so dark objects still read on a dark page. */
export interface Backdrop {
  image: ImageMetadata;
  glow: string;
}

export interface Game {
  name: string;
  repo: string;
  game: string;
  edition: string;
  needs: string;
  /** The port's app icon, square. */
  icon: ImageMetadata;
  /** "pixel" art gets hard pixel edges when shown at iconPixels or larger. */
  iconArt: "pixel" | "painted";
  /** The art's own resolution (a 64-pixel sprite scaled up to 256 is 64). */
  iconPixels: number;
  /** Scattered in backgrounds in place of the icon, for icons that carry
      their own background. */
  backdrop?: Backdrop;
  /** Names src/styles/themes/<theme>.css, which restyles the port's own page. */
  theme?: string;
  /** One or two sentences for the port's own page. */
  summary: string;
}

export const games: Game[] = [
  {
    name: "Verdite1",
    repo: "Voicedrew11/verdite1",
    theme: "verdite1",
    icon: verdite1Icon,
    iconArt: "pixel",
    iconPixels: 64,
    game: "King’s Field JP",
    edition: "Japan, PlayStation",
    needs: "SLPS-00017",
    summary: "King’s Field JP, the first in the series, released only in Japan in 1994, as a native program.",
  },
  {
    name: "Verdite2",
    repo: "Voicedrew11/verdite2",
    theme: "verdite2",
    icon: verdite2Icon,
    iconArt: "pixel",
    iconPixels: 64,
    game: "King’s Field",
    edition: "North America, PlayStation; King’s Field II in Japan",
    needs: "SLUS-00158",
    summary: "The King’s Field that reached North America, known as King’s Field II in Japan, as a native program.",
  },
  {
    name: "Verdite3",
    repo: "Voicedrew11/verdite3",
    theme: "verdite3",
    icon: verdite3Icon,
    iconArt: "pixel",
    iconPixels: 64,
    game: "King’s Field II",
    edition: "North America, PlayStation; King’s Field III in Japan",
    needs: "SLUS-00255",
    summary: "King’s Field II for North America, King’s Field III in Japan, as a native program.",
  },
  {
    name: "Holyland",
    repo: "Voicedrew11/holyland",
    icon: holylandIcon,
    iconArt: "painted",
    iconPixels: 256,
    // The Idol of Sorrow, cut out of the icon's glowing background.
    backdrop: { image: holylandIdol, glow: "rgba(233, 148, 74, 0.65)" },
    theme: "holyland",
    game: "King’s Field: The Ancient City",
    edition: "North America, PlayStation 2",
    needs: "SLUS-20318",
    summary: "King’s Field: The Ancient City, the series’ PlayStation 2 entry, as a native program.",
  },
];

// The URL part of a port's own page: /games/<slug>/.
export function gameSlug(game: Game): string {
  return game.name.toLowerCase();
}

export function gamePath(game: Game): string {
  return `/games/${gameSlug(game)}/`;
}
