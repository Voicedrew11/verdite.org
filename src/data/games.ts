// One entry per port. The downloads page lists them in this order and asks
// GitHub for each repo's latest release in the visitor's browser.
// To add a port, add an entry here; nothing else needs to change.

export interface Game {
  name: string;
  repo: string;
  game: string;
  edition: string;
  needs: string;
}

export const games: Game[] = [
  {
    name: "Verdite1",
    repo: "Voicedrew11/verdite1",
    game: "King’s Field",
    edition: "Japan, PlayStation",
    needs: "SLPS-00017",
  },
  {
    name: "Verdite2",
    repo: "Voicedrew11/verdite2",
    game: "King’s Field",
    edition: "North America, PlayStation; King’s Field II in Japan",
    needs: "SLUS-00158",
  },
  {
    name: "Verdite3",
    repo: "Voicedrew11/verdite3",
    game: "King’s Field II",
    edition: "North America, PlayStation; King’s Field III in Japan",
    needs: "SLUS-00255",
  },
  {
    name: "Holyland",
    repo: "Voicedrew11/holyland",
    game: "King’s Field: The Ancient City",
    edition: "North America, PlayStation 2",
    needs: "SLUS-20318",
  },
];

// The anchor id a game's section has on the downloads page.
export function gameAnchor(game: Game): string {
  return game.name.toLowerCase();
}
