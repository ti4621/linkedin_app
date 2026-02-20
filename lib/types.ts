export const GAMES = ["ZIP", "MINI_SUDOKU", "QUEENS"] as const;

export type GameKey = (typeof GAMES)[number];

export function isGameKey(value: string): value is GameKey {
  return (GAMES as readonly string[]).includes(value);
}

export type ScoreRow = {
  playerId: number;
  playerName: string;
  date: string;
  game: GameKey;
  timeSecs: number;
};
