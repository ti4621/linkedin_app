"use client";

import { formatSeconds, todayIsoDate } from "@/lib/time";
import { useEffect, useState } from "react";

type Row = {
  date: string;
  players: Array<{
    playerId: number;
    playerName: string;
    games: Partial<Record<"ZIP" | "MINI_SUDOKU" | "QUEENS", number>>;
    overall: number | null;
  }>;
};

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function HistoryPage() {
  const [dateFrom, setDateFrom] = useState(daysAgoIso(30));
  const [dateTo, setDateTo] = useState(todayIsoDate());
  const [data, setData] = useState<Row[]>([]);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    const res = await fetch(`/api/history?dateFrom=${dateFrom}&dateTo=${dateTo}`);
    const body = await res.json();
    if (!res.ok) {
      setError(body.error ?? "Failed to load history.");
      return;
    }
    setData(body);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid">
      <div className="card">
        <h2>History</h2>
        <div className="grid cols-3">
          <div>
            <label>Date from</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label>Date to</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div style={{ alignSelf: "end" }}>
            <button onClick={load}>Apply</button>
          </div>
        </div>
        {error ? <p className="muted">{error}</p> : null}
      </div>

      {data.map((day) => (
        <div key={day.date} className="card">
          <h3>{day.date}</h3>
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
              {day.players.map((p) => (
                <tr key={`${day.date}-${p.playerId}`}>
                  <td>{p.playerName}</td>
                  <td>{formatSeconds(p.games.ZIP)}</td>
                  <td>{formatSeconds(p.games.MINI_SUDOKU)}</td>
                  <td>{formatSeconds(p.games.QUEENS)}</td>
                  <td>{formatSeconds(p.overall)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

