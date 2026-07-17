import { NextResponse } from "next/server";
import { getRedis, getView } from "@/app/games/lib/server/rooms";
import type { GameType } from "@/app/games/lib/server/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GAME_TYPES: readonly GameType[] = ["baseball", "battleship"];

function isGameType(value: unknown): value is GameType {
  return typeof value === "string" && (GAME_TYPES as readonly string[]).includes(value);
}

// GET /api/games/state?type=&roomId=&playerToken= -> { seat, view, lastMoveAt }
export async function GET(req: Request) {
  const redis = getRedis();
  if (!redis) return NextResponse.json({ error: "not configured" }, { status: 503 });

  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const roomId = url.searchParams.get("roomId");
  const playerToken = url.searchParams.get("playerToken");

  if (!isGameType(type) || !roomId || !playerToken) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const result = await getView(type, roomId, playerToken);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result);
}
