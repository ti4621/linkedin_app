"use client";

import { GAMES } from "@/lib/types";
import { formatSeconds, todayIsoDate } from "@/lib/time";
import { useEffect, useMemo, useState } from "react";

type Player = { id: number; name: string };
type ScoreApiRow = {
  playerId: number;
  date: string;
  game: (typeof GAMES)[number];
  timeSecs: number;
  player: Player;
};

const GAME_LABEL: Record<(typeof GAMES)[number], string> = {
  ZIP: "Zip",
  MINI_SUDOKU: "Mini Sudoku",
  QUEENS: "Queens"
};

export default function TodayPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [date, setDate] = useState(todayIsoDate());
  const [times, setTimes] = useState<Record<(typeof GAMES)[number], string>>({
    ZIP: "",
    MINI_SUDOKU: "",
    QUEENS: ""
  });
  const [allScores, setAllScores] = useState<ScoreApiRow[]>([]);
  const [status, setStatus] = useState("");
  const [newPlayerName, setNewPlayerName] = useState("");

  async function loadPlayers() {
    const res = await fetch("/api/players");
    const data: Player[] = await res.json();
    setPlayers(data);
    if (data.length && !selectedPlayerId) setSelectedPlayerId(data[0].id);
  }

  async function loadDayScores(targetDate: string) {
    const res = await fetch(`/api/scores?date=${targetDate}`);
    if (!res.ok) return;
    const data: ScoreApiRow[] = await res.json();
    setAllScores(data);
  }

  useEffect(() => {
    void loadPlayers();
  }, []);

  useEffect(() => {
    void loadDayScores(date);
  }, [date]);

  useEffect(() => {
    if (!selectedPlayerId) return;
    const mine = allScores.filter((s) => s.playerId === selectedPlayerId);
    setTimes({
      ZIP: mine.find((s) => s.game === "ZIP") ? formatSeconds(mine.find((s) => s.game === "ZIP")!.timeSecs) : "",
      MINI_SUDOKU: mine.find((s) => s.game === "MINI_SUDOKU")
        ? formatSeconds(mine.find((s) => s.game === "MINI_SUDOKU")!.timeSecs)
        : "",
      QUEENS: mine.find((s) => s.game === "QUEENS") ? formatSeconds(mine.find((s) => s.game === "QUEENS")!.timeSecs) : ""
    });
  }, [allScores, selectedPlayerId]);

  const daySummary = useMemo(() => {
    const byPlayer = new Map<number, { name: string; games: Partial<Record<(typeof GAMES)[number], number>> }>();
    for (const s of allScores) {
      if (!byPlayer.has(s.playerId)) byPlayer.set(s.playerId, { name: s.player.name, games: {} });
      byPlayer.get(s.playerId)!.games[s.game] = s.timeSecs;
    }

    const rows = Array.from(byPlayer.entries()).map(([id, item]) => {
      const overall = GAMES.every((g) => item.games[g] != null) ? GAMES.reduce((sum, g) => sum + (item.games[g] ?? 0), 0) : null;
      return { playerId: id, name: item.name, games: item.games, overall };
    });

    return rows.sort((a, b) => a.name.localeCompare(b.name));
  }, [allScores]);

  async function saveScores() {
    if (!selectedPlayerId) return;
    setStatus("");
    const res = await fetch("/api/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerId: selectedPlayerId,
        date,
        times
      })
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus(`Error: ${data.error ?? "Failed to save."}`);
      return;
    }
    setStatus("Saved.");
    await loadDayScores(date);
  }

  async function addPlayer() {
    const name = newPlayerName.trim();
    if (!name) return;
    const res = await fetch("/api/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus(`Error: ${data.error ?? "Could not add player."}`);
      return;
    }
    setNewPlayerName("");
    await loadPlayers();
    setSelectedPlayerId(data.id);
    setStatus("Player created.");
  }

  return (
    <div className="grid">
      <div className="card">
        <h2>Today Entry</h2>
        <p className="muted">Record one time per game for a player on a specific date.</p>
        <div className="grid cols-3">
          <div>
            <label>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label>Player</label>
            <select
              value={selectedPlayerId ?? ""}
              onChange={(e) => setSelectedPlayerId(Number(e.target.value))}
              disabled={!players.length}
            >
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid cols-3" style={{ marginTop: 12 }}>
          {GAMES.map((game) => (
            <div key={game}>
              <label>{GAME_LABEL[game]}</label>
              <input
                placeholder="3:42"
                value={times[game]}
                onChange={(e) => setTimes((prev) => ({ ...prev, [game]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12 }}>
          <button onClick={saveScores}>Save Scores</button>
        </div>
        {status ? (
          <p className={status.startsWith("Error") ? "muted" : "ok"} style={{ marginTop: 10 }}>
            {status}
          </p>
        ) : null}
      </div>

      <div className="card">
        <h3>Add Player</h3>
        <div className="grid cols-3">
          <div>
            <label>New player name</label>
            <input value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} />
          </div>
          <div style={{ alignSelf: "end" }}>
            <button onClick={addPlayer}>Create Player</button>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>{date} Results</h3>
        {!daySummary.length ? (
          <p className="muted">No scores saved for this date.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Player</th>
                <th>Zip</th>
                <th>Mini Sudoku</th>
                <th>Queens</th>
                <th>Overall (all 3)</th>
              </tr>
            </thead>
            <tbody>
              {daySummary.map((row) => (
                <tr key={row.playerId}>
                  <td>{row.name}</td>
                  <td>{formatSeconds(row.games.ZIP)}</td>
                  <td>{formatSeconds(row.games.MINI_SUDOKU)}</td>
                  <td>{formatSeconds(row.games.QUEENS)}</td>
                  <td>{formatSeconds(row.overall)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

