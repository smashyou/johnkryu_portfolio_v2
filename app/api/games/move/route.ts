import { NextResponse } from "next/server";
import { applyMove, getRedis } from "@/app/games/lib/server/rooms";
import type { GameType } from "@/app/games/lib/server/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GAME_TYPES: readonly GameType[] = ["baseball", "battleship"];

function isGameType(value: unknown): value is GameType {
  return typeof value === "string" && (GAME_TYPES as readonly string[]).includes(value);
}

// POST /api/games/move { type, roomId, playerToken, payload } -> { ok: true }
export async function POST(req: Request) {
  const redis = getRedis();
  if (!redis) return NextResponse.json({ error: "not configured" }, { status: 503 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const { type, roomId, playerToken, payload } =
    (body as { type?: unknown; roomId?: unknown; playerToken?: unknown; payload?: unknown }) ?? {};
  if (
    !isGameType(type) ||
    typeof roomId !== "string" ||
    !roomId ||
    typeof playerToken !== "string" ||
    !playerToken
  ) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const result = await applyMove(type, roomId, playerToken, payload);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result);
}
