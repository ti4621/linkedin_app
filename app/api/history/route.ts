import { db } from "@/lib/db";
import { buildDailyView } from "@/lib/stats";
import { isGameKey, ScoreRow } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

function isValidIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function GET(request: NextRequest) {
  const dateFrom = request.nextUrl.searchParams.get("dateFrom");
  const dateTo = request.nextUrl.searchParams.get("dateTo");

  if (!dateFrom || !dateTo || !isValidIsoDate(dateFrom) || !isValidIsoDate(dateTo)) {
    return NextResponse.json({ error: "dateFrom and dateTo are required in YYYY-MM-DD format." }, { status: 400 });
  }

  const scores = await db.score.findMany({
    where: {
      date: {
        gte: dateFrom,
        lte: dateTo
      }
    },
    include: { player: true },
    orderBy: [{ date: "desc" }, { player: { name: "asc" } }, { game: "asc" }]
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

  return NextResponse.json(buildDailyView(rows));
}
