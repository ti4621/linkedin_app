"use client";

import { formatSeconds } from "@/lib/time";
import { GAMES } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";

type Player = { id: number; name: string };

type ScoreboardResponse = {
  playerA: { id: number; name: string };
  playerB: { id: number; name: string };
  totals: {
    games: Record<"ZIP" | "MINI_SUDOKU" | "QUEENS", { a: number; b: number }>;
    overall: { a: number; b: number };
  };
  daily: Array<{
    date: string;
    games: Record<
      "ZIP" | "MINI_SUDOKU" | "QUEENS",
      {
        aTime: number | null;
        bTime: number | null;
        winner: "A" | "B" | "TIE" | null;
        points: { a: number; b: number };
      }
    >;
    dayPoints: { a: number; b: number };
    runningTotal: { a: number; b: number };
  }>;
};

const GAME_LABEL = {
  ZIP: "Zip",
  MINI_SUDOKU: "Mini Sudoku",
  QUEENS: "Queens"
} as const;

export default function ScoreboardPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerA, setPlayerA] = useState<number | null>(null);
  const [playerB, setPlayerB] = useState<number | null>(null);
  const [data, setData] = useState<ScoreboardResponse | null>(null);
  const [error, setError] = useState("");

  async function loadPlayers() {
    const res = await fetch("/api/players");
    const body: Player[] = await res.json();
    setPlayers(body);
    if (body.length >= 2) {
      setPlayerA((prev) => prev ?? body[0].id);
      setPlayerB((prev) => prev ?? body[1].id);
    }
  }

  async function loadScoreboard() {
    if (!playerA || !playerB || playerA === playerB) return;
    setError("");
    const res = await fetch(`/api/scoreboard?playerA=${playerA}&playerB=${playerB}`);
    const body = await res.json();
    if (!res.ok) {
      setError(body.error ?? "Failed to load scoreboard.");
      return;
    }
    setData(body);
  }

  useEffect(() => {
    void loadPlayers();
  }, []);

  useEffect(() => {
    void loadScoreboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerA, playerB]);

  const canCompare = useMemo(() => players.length >= 2 && playerA != null && playerB != null && playerA !== playerB, [players, playerA, playerB]);

  return (
    <div className="grid">
      <div className="card">
        <h2>Head-to-Head Scoreboard</h2>
        <p className="muted">Each game per day gives 1 point to the faster player. Ties give 1 point each.</p>
        <div className="grid cols-3">
          <div>
            <label>Player A</label>
            <select value={playerA ?? ""} onChange={(e) => setPlayerA(Number(e.target.value))}>
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Player B</label>
            <select value={playerB ?? ""} onChange={(e) => setPlayerB(Number(e.target.value))}>
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div style={{ alignSelf: "end" }}>
            <button onClick={loadScoreboard} disabled={!canCompare}>
              Refresh
            </button>
          </div>
        </div>
        {!canCompare ? <p className="muted">Choose two different players.</p> : null}
        {error ? <p className="muted">{error}</p> : null}
      </div>

      {data ? (
        <div className="card">
          <h3>
            {data.playerA.name} vs {data.playerB.name}
          </h3>
          <table>
            <thead>
              <tr>
                <th>Game</th>
                <th>{data.playerA.name}</th>
                <th>{data.playerB.name}</th>
              </tr>
            </thead>
            <tbody>
              {GAMES.map((game) => (
                <tr key={game}>
                  <td>{GAME_LABEL[game]}</td>
                  <td>{data.totals.games[game].a}</td>
                  <td>{data.totals.games[game].b}</td>
                </tr>
              ))}
              <tr>
                <td>
                  <strong>Total</strong>
                </td>
                <td>
                  <strong>{data.totals.overall.a}</strong>
                </td>
                <td>
                  <strong>{data.totals.overall.b}</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : null}

      {data?.daily.length ? (
        <div className="card">
          <h3>Daily Breakdown</h3>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Zip</th>
                <th>Mini Sudoku</th>
                <th>Queens</th>
                <th>Day Points</th>
                <th>Running Total</th>
              </tr>
            </thead>
            <tbody>
              {[...data.daily].reverse().map((day) => (
                <tr key={day.date}>
                  <td>{day.date}</td>
                  {GAMES.map((game) => (
                    <td key={`${day.date}-${game}`}>
                      {formatSeconds(day.games[game].aTime)} vs {formatSeconds(day.games[game].bTime)} (
                      {day.games[game].points.a}-{day.games[game].points.b})
                    </td>
                  ))}
                  <td>
                    {day.dayPoints.a}-{day.dayPoints.b}
                  </td>
                  <td>
                    {day.runningTotal.a}-{day.runningTotal.b}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

