import { db } from "@/lib/db";
import { computeStats } from "@/lib/stats";
import { isGameKey, ScoreRow } from "@/lib/types";
import { NextResponse } from "next/server";

export async function GET() {
  const scores = await db.score.findMany({
    include: { player: true },
    orderBy: [{ date: "asc" }, { game: "asc" }]
  });

  const rows: ScoreRow[] = scores
    .filter((s) => isGameKey(s.game))
    .map((s) => ({
      playerId: s.playerId,
      playerName: s.player.name,
      date: s.date,
      game: s.game,
      timeSecs: s.timeSecs
    }));

  return NextResponse.json(computeStats(rows));
}
