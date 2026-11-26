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

export interface Game {
  name: string;
  repo: string;
  game: string;
  edition: string;
  needs: string;
  /** The port's app icon, square. */
  icon: ImageMetadata;
  /** Names src/styles/themes/<theme>.css, which restyles the port's own page. */
  theme?: string;
  /** One or two sentences for the port's own page. */
  summary: string;
}

export const games: Game[] = [
  {
    name: "Verdite1",
    repo: "Voicedrew11/verdite1",
    icon: verdite1Icon,
    game: "King’s Field",
    edition: "Japan, PlayStation",
    needs: "SLPS-00017",
    summary: "The first King’s Field, released only in Japan in 1994, as a native program.",
  },
  {
    name: "Verdite2",
    repo: "Voicedrew11/verdite2",
    theme: "verdite2",
    icon: verdite2Icon,
    game: "King’s Field",
    edition: "North America, PlayStation; King’s Field II in Japan",
    needs: "SLUS-00158",
    summary: "The King’s Field that reached North America, known as King’s Field II in Japan, as a native program.",
  },
  {
    name: "Verdite3",
    repo: "Voicedrew11/verdite3",
    icon: verdite3Icon,
    game: "King’s Field II",
    edition: "North America, PlayStation; King’s Field III in Japan",
    needs: "SLUS-00255",
    summary: "King’s Field II for North America, King’s Field III in Japan, as a native program.",
  },
  {
    name: "Holyland",
    repo: "Voicedrew11/holyland",
    icon: holylandIcon,
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
