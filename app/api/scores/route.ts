import { db } from "@/lib/db";
import { GAMES, GameKey } from "@/lib/types";
import { parseTimeToSeconds } from "@/lib/time";
import { NextRequest, NextResponse } from "next/server";

function validIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date");
  if (!date || !validIsoDate(date)) {
    return NextResponse.json({ error: "date (YYYY-MM-DD) is required." }, { status: 400 });
  }

  const scores = await db.score.findMany({
    where: { date },
    include: { player: true },
    orderBy: [{ player: { name: "asc" } }, { game: "asc" }]
  });

  return NextResponse.json(scores);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const playerId = Number(body?.playerId);
  const date = String(body?.date ?? "");
  const times = body?.times ?? {};

  if (!playerId) return NextResponse.json({ error: "playerId is required." }, { status: 400 });
  if (!validIsoDate(date)) return NextResponse.json({ error: "date must be YYYY-MM-DD." }, { status: 400 });

  const player = await db.player.findUnique({ where: { id: playerId } });
  if (!player) return NextResponse.json({ error: "Player not found." }, { status: 404 });

  const ops = [];
  for (const game of GAMES) {
    const raw = String(times[game] ?? "").trim();
    if (!raw) {
      ops.push(
        db.score.deleteMany({
          where: { playerId, date, game }
        })
      );
      continue;
    }

    const parsed = parseTimeToSeconds(raw);
    if (parsed == null || parsed < 0) {
      return NextResponse.json({ error: `Invalid time for ${game}. Use mm:ss, hh:mm:ss, or seconds.` }, { status: 400 });
    }

    ops.push(
      db.score.upsert({
        where: { playerId_date_game: { playerId, date, game } },
        update: { timeSecs: parsed },
        create: { playerId, date, game, timeSecs: parsed }
      })
    );
  }

  await db.$transaction(ops);

  const updated = await db.score.findMany({
    where: { playerId, date },
    orderBy: { game: "asc" }
  });

  return NextResponse.json({ ok: true, scores: updated });
}
