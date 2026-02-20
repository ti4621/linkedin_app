import { GAMES, GameKey, ScoreRow } from "@/lib/types";

type Winner = "A" | "B" | "TIE" | null;

type DailyGameResult = {
  aTime: number | null;
  bTime: number | null;
  winner: Winner;
  points: { a: number; b: number };
};

export type HeadToHeadScoreboard = {
  playerA: { id: number; name: string };
  playerB: { id: number; name: string };
  totals: {
    games: Record<GameKey, { a: number; b: number }>;
    overall: { a: number; b: number };
  };
  daily: Array<{
    date: string;
    games: Record<GameKey, DailyGameResult>;
    dayPoints: { a: number; b: number };
    runningTotal: { a: number; b: number };
  }>;
};

export function computeHeadToHeadScoreboard(
  rows: ScoreRow[],
  playerA: { id: number; name: string },
  playerB: { id: number; name: string }
): HeadToHeadScoreboard {
  const byDate = new Map<
    string,
    {
      A: Partial<Record<GameKey, number>>;
      B: Partial<Record<GameKey, number>>;
    }
  >();

  for (const row of rows) {
    if (!byDate.has(row.date)) {
      byDate.set(row.date, { A: {}, B: {} });
    }

    const dateBucket = byDate.get(row.date)!;
    if (row.playerId === playerA.id) dateBucket.A[row.game] = row.timeSecs;
    if (row.playerId === playerB.id) dateBucket.B[row.game] = row.timeSecs;
  }

  const totals: HeadToHeadScoreboard["totals"] = {
    games: {
      ZIP: { a: 0, b: 0 },
      MINI_SUDOKU: { a: 0, b: 0 },
      QUEENS: { a: 0, b: 0 }
    },
    overall: { a: 0, b: 0 }
  };

  const daily = Array.from(byDate.keys())
    .sort((a, b) => a.localeCompare(b))
    .map((date) => {
      const bucket = byDate.get(date)!;
      const games = {} as Record<GameKey, DailyGameResult>;
      let dayA = 0;
      let dayB = 0;

      for (const game of GAMES) {
        const aTime = bucket.A[game] ?? null;
        const bTime = bucket.B[game] ?? null;

        let winner: Winner = null;
        let points = { a: 0, b: 0 };

        if (aTime != null && bTime != null) {
          if (aTime < bTime) {
            winner = "A";
            points = { a: 1, b: 0 };
          } else if (bTime < aTime) {
            winner = "B";
            points = { a: 0, b: 1 };
          } else {
            // Tie counts as 1 point for both players.
            winner = "TIE";
            points = { a: 1, b: 1 };
          }
        }

        games[game] = { aTime, bTime, winner, points };
        dayA += points.a;
        dayB += points.b;
        totals.games[game].a += points.a;
        totals.games[game].b += points.b;
      }

      totals.overall.a += dayA;
      totals.overall.b += dayB;

      return {
        date,
        games,
        dayPoints: { a: dayA, b: dayB },
        runningTotal: { a: totals.overall.a, b: totals.overall.b }
      };
    });

  return {
    playerA,
    playerB,
    totals,
    daily
  };
}

