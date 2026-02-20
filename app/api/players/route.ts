import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

function normalizeNameKey(name: string): string {
  return name.trim().toLowerCase();
}

export async function GET() {
  const players = await db.player.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(players);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const name = String(body?.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });

  const nameKey = normalizeNameKey(name);
  const existing = await db.player.findUnique({ where: { nameKey } });
  if (existing) return NextResponse.json({ error: "Player name must be unique." }, { status: 409 });

  const created = await db.player.create({
    data: { name, nameKey }
  });
  return NextResponse.json(created, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const id = Number(body?.id);
  const name = String(body?.name ?? "").trim();
  if (!id || !name) return NextResponse.json({ error: "id and name are required." }, { status: 400 });

  const nameKey = normalizeNameKey(name);
  const existing = await db.player.findUnique({ where: { nameKey } });
  if (existing && existing.id !== id) {
    return NextResponse.json({ error: "Player name must be unique." }, { status: 409 });
  }

  const updated = await db.player.update({
    where: { id },
    data: { name, nameKey }
  });

  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest) {
  const idParam = request.nextUrl.searchParams.get("id");
  const deleteScores = request.nextUrl.searchParams.get("deleteScores") === "true";
  const id = Number(idParam);
  if (!id) return NextResponse.json({ error: "Valid id required." }, { status: 400 });

  const count = await db.score.count({ where: { playerId: id } });
  if (count > 0 && !deleteScores) {
    return NextResponse.json(
      { error: "Player has scores. Use deleteScores=true to delete player and scores." },
      { status: 409 }
    );
  }

  await db.player.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

