import { db } from "@/lib/db";
import { computeHeadToHeadScoreboard } from "@/lib/scoreboard";
import { isGameKey, ScoreRow } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const aId = Number(request.nextUrl.searchParams.get("playerA"));
  const bId = Number(request.nextUrl.searchParams.get("playerB"));

  if (!aId || !bId || aId === bId) {
    return NextResponse.json({ error: "playerA and playerB are required and must be different." }, { status: 400 });
  }

  const [playerA, playerB] = await Promise.all([
    db.player.findUnique({ where: { id: aId } }),
    db.player.findUnique({ where: { id: bId } })
  ]);

  if (!playerA || !playerB) {
    return NextResponse.json({ error: "One or both players were not found." }, { status: 404 });
  }

  const scores = await db.score.findMany({
    where: { playerId: { in: [aId, bId] } },
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

  return NextResponse.json(
    computeHeadToHeadScoreboard(
      rows,
      { id: playerA.id, name: playerA.name },
      { id: playerB.id, name: playerB.name }
    )
  );
}

