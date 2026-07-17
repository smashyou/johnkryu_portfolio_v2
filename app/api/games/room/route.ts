import { NextResponse } from "next/server";
import { checkCreateRateLimit, clientIp, createRoom, getRedis } from "@/app/games/lib/server/rooms";
import type { GameType } from "@/app/games/lib/server/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GAME_TYPES: readonly GameType[] = ["baseball", "battleship"];

function isGameType(value: unknown): value is GameType {
  return typeof value === "string" && (GAME_TYPES as readonly string[]).includes(value);
}

// POST /api/games/room { type } -> { roomId, playerToken, seat: 1 }
export async function POST(req: Request) {
  const redis = getRedis();
  if (!redis) return NextResponse.json({ error: "not configured" }, { status: 503 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const { type, options } = (body as { type?: unknown; options?: unknown }) ?? {};
  if (!isGameType(type)) {
    return NextResponse.json({ error: "bad type" }, { status: 400 });
  }

  const withinLimit = await checkCreateRateLimit(clientIp(req));
  if (!withinLimit) {
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  }

  try {
    const { roomId, playerToken } = await createRoom(type, options);
    return NextResponse.json({ roomId, playerToken, seat: 1 });
  } catch {
    return NextResponse.json({ error: "failed to create room" }, { status: 500 });
  }
}
