"use client";

import { formatSeconds } from "@/lib/time";
import { GAMES } from "@/lib/types";
import { useEffect, useState } from "react";

type StatsResponse = {
  players: Array<{
    playerId: number;
    playerName: string;
    games: Record<
      "ZIP" | "MINI_SUDOKU" | "QUEENS",
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
      games: Record<"ZIP" | "MINI_SUDOKU" | "QUEENS", number>;
      overall: number;
    };
  }>;
};

const GAME_LABEL = {
  ZIP: "Zip",
  MINI_SUDOKU: "Mini Sudoku",
  QUEENS: "Queens"
} as const;

export default function StatsPage() {
  const [data, setData] = useState<StatsResponse | null>(null);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    const res = await fetch("/api/stats");
    const body = await res.json();
    if (!res.ok) {
      setError(body.error ?? "Failed to load stats.");
      return;
    }
    setData(body);
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="grid">
      <div className="card">
        <h2>Statistics</h2>
        <p className="muted">Per-game metrics, strict-overall metrics (all 3 games), and win counts.</p>
        {error ? <p className="muted">{error}</p> : null}
      </div>

      {(data?.players ?? []).map((player) => (
        <div className="card" key={player.playerId}>
          <h3>{player.playerName}</h3>
          <div className="grid cols-3">
            {GAMES.map((game) => (
              <div className="card" key={game}>
                <h4>{GAME_LABEL[game]}</h4>
                <p>Days played: {player.games[game].daysPlayed}</p>
                <p>Best: {formatSeconds(player.games[game].best)}</p>
                <p>Worst: {formatSeconds(player.games[game].worst)}</p>
                <p>Average: {formatSeconds(player.games[game].average)}</p>
                <p>Median: {formatSeconds(player.games[game].median)}</p>
                <p>Last 7 avg: {formatSeconds(player.games[game].last7Avg)}</p>
                <p>
                  Trend vs prev 7:{" "}
                  {player.games[game].trendVsPrev7 == null
                    ? "-"
                    : `${player.games[game].trendVsPrev7 > 0 ? "+" : "-"}${formatSeconds(Math.abs(player.games[game].trendVsPrev7))}`}
                </p>
                <p>Wins: {player.wins.games[game]}</p>
              </div>
            ))}
          </div>
          <div className="card" style={{ marginTop: 12 }}>
            <h4>Overall (all 3)</h4>
            <p>Complete days: {player.overall.completeDays}</p>
            <p>Best: {formatSeconds(player.overall.best)}</p>
            <p>Worst: {formatSeconds(player.overall.worst)}</p>
            <p>Average: {formatSeconds(player.overall.average)}</p>
            <p>Median: {formatSeconds(player.overall.median)}</p>
            <p>Overall wins: {player.wins.overall}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
