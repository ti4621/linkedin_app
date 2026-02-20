import { GAMES, GameKey, ScoreRow } from "@/lib/types";

function avg(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

function dateSortAsc(a: string, b: string): number {
  return a.localeCompare(b);
}

export function buildDailyView(rows: ScoreRow[]) {
  const byDate = new Map<
    string,
    Map<number, { playerId: number; playerName: string; games: Partial<Record<GameKey, number>> }>
  >();

  for (const row of rows) {
    if (!byDate.has(row.date)) byDate.set(row.date, new Map());
    const dateBucket = byDate.get(row.date)!;
    if (!dateBucket.has(row.playerId)) {
      dateBucket.set(row.playerId, { playerId: row.playerId, playerName: row.playerName, games: {} });
    }
    dateBucket.get(row.playerId)!.games[row.game] = row.timeSecs;
  }

  const result = Array.from(byDate.entries())
    .sort(([a], [b]) => dateSortAsc(b, a))
    .map(([date, players]) => {
      const items = Array.from(players.values())
        .sort((a, b) => a.playerName.localeCompare(b.playerName))
        .map((p) => {
          const hasAll = GAMES.every((g) => p.games[g] != null);
          const overall = hasAll ? GAMES.reduce((sum, g) => sum + (p.games[g] ?? 0), 0) : null;
          return {
            ...p,
            overall
          };
        });
      return { date, players: items };
    });

  return result;
}

export function computeStats(rows: ScoreRow[]) {
  const players = new Map<number, string>();
  for (const row of rows) players.set(row.playerId, row.playerName);

  const perPlayer: Record<
    number,
    {
      playerId: number;
      playerName: string;
      games: Record<
        GameKey,
        {
          daysPlayed: number;
          best: number | null;
          worst: number | null;
          average: number | null;
          median: number | null;
          last7Avg: number | null;
          trendVsPrev7: number | null;
        }
      >;
      overall: {
        completeDays: number;
        best: number | null;
        worst: number | null;
        average: number | null;
        median: number | null;
      };
      wins: {
        games: Record<GameKey, number>;
        overall: number;
      };
    }
  > = {};

  for (const [playerId, playerName] of players.entries()) {
    const pid = Number(playerId);
    perPlayer[pid] = {
      playerId: pid,
      playerName,
      games: {
        ZIP: { daysPlayed: 0, best: null, worst: null, average: null, median: null, last7Avg: null, trendVsPrev7: null },
        MINI_SUDOKU: {
          daysPlayed: 0,
          best: null,
          worst: null,
          average: null,
          median: null,
          last7Avg: null,
          trendVsPrev7: null
        },
        QUEENS: { daysPlayed: 0, best: null, worst: null, average: null, median: null, last7Avg: null, trendVsPrev7: null }
      },
      overall: { completeDays: 0, best: null, worst: null, average: null, median: null },
      wins: { games: { ZIP: 0, MINI_SUDOKU: 0, QUEENS: 0 }, overall: 0 }
    };
  }

  for (const game of GAMES) {
    for (const [playerId] of players.entries()) {
      const gameRows = rows
        .filter((r) => r.playerId === playerId && r.game === game)
        .sort((a, b) => dateSortAsc(a.date, b.date));
      const times = gameRows.map((r) => r.timeSecs);
      const current = perPlayer[playerId].games[game];
      current.daysPlayed = times.length;
      current.best = times.length ? Math.min(...times) : null;
      current.worst = times.length ? Math.max(...times) : null;
      current.average = avg(times);
      current.median = median(times);

      const last7 = gameRows.slice(-7).map((r) => r.timeSecs);
      const prev7 = gameRows.slice(Math.max(0, gameRows.length - 14), Math.max(0, gameRows.length - 7)).map((r) => r.timeSecs);
      const last7Avg = avg(last7);
      const prev7Avg = avg(prev7);
      current.last7Avg = last7Avg;
      current.trendVsPrev7 = last7Avg != null && prev7Avg != null ? last7Avg - prev7Avg : null;
    }
  }

  const daily = buildDailyView(rows);
  for (const day of daily) {
    const complete = day.players.filter((p) => p.overall != null);
    for (const p of complete) {
      const stats = perPlayer[p.playerId].overall;
      stats.completeDays += 1;
    }
  }

  for (const [playerId] of players.entries()) {
    const overallTimes = daily
      .flatMap((d) => d.players)
      .filter((p) => p.playerId === playerId && p.overall != null)
      .map((p) => p.overall as number);
    perPlayer[playerId].overall.best = overallTimes.length ? Math.min(...overallTimes) : null;
    perPlayer[playerId].overall.worst = overallTimes.length ? Math.max(...overallTimes) : null;
    perPlayer[playerId].overall.average = avg(overallTimes);
    perPlayer[playerId].overall.median = median(overallTimes);
  }

  for (const day of daily) {
    for (const game of GAMES) {
      const contenders = day.players
        .map((p) => ({ playerId: p.playerId, value: p.games[game] }))
        .filter((p) => p.value != null) as Array<{ playerId: number; value: number }>;
      if (!contenders.length) continue;
      const best = Math.min(...contenders.map((c) => c.value));
      const winners = contenders.filter((c) => c.value === best);
      for (const winner of winners) perPlayer[winner.playerId].wins.games[game] += 1;
    }

    const overallContenders = day.players
      .filter((p) => p.overall != null)
      .map((p) => ({ playerId: p.playerId, value: p.overall as number }));
    if (!overallContenders.length) continue;
    const bestOverall = Math.min(...overallContenders.map((c) => c.value));
    const winners = overallContenders.filter((c) => c.value === bestOverall);
    for (const winner of winners) perPlayer[winner.playerId].wins.overall += 1;
  }

  return {
    players: Object.values(perPlayer).sort((a, b) => a.playerName.localeCompare(b.playerName)),
    daily
  };
}

