import { NextResponse } from "next/server";
import { clientIp, getRedis } from "@/app/games/lib/server/rooms";
import {
  checkSubmitRateLimit,
  getLeaderboard,
  isDifficulty,
  submitScore,
  type LeaderboardScope,
} from "@/app/games/lib/server/leaderboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isScope(value: unknown): value is LeaderboardScope {
  return value === "daily" || value === "alltime";
}

// GET /api/sudoku/leaderboard/?scope=daily&day=N
// GET /api/sudoku/leaderboard/?scope=alltime&difficulty=easy|medium|hard
// optional &me=<identity> -> { entries, total, me? }
export async function GET(req: Request) {
  if (!getRedis()) return NextResponse.json({ error: "not configured" }, { status: 503 });

  const url = new URL(req.url);
  const scope = url.searchParams.get("scope");
  if (!isScope(scope)) return NextResponse.json({ error: "bad scope" }, { status: 400 });

  const dayParam = url.searchParams.get("day");
  const difficultyParam = url.searchParams.get("difficulty");
  const me = url.searchParams.get("me");

  const result = await getLeaderboard({
    scope,
    day: dayParam != null && dayParam !== "" ? Number(dayParam) : undefined,
    difficulty: isDifficulty(difficultyParam) ? difficultyParam : undefined,
    me: me || undefined,
  });

  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json(result);
}

// POST /api/sudoku/leaderboard/
// { scope, day?, difficulty?, name, timeMs, useIp, location?, entryToken? }
// -> { identity, rank, total, entryToken? } | 409 { error: "name taken" }
//    when an opt-out (name+location) identity is already claimed and the
//    entryToken doesn't match (or wasn't sent).
export async function POST(req: Request) {
  if (!getRedis()) return NextResponse.json({ error: "not configured" }, { status: 503 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const b = body as {
    scope?: unknown;
    day?: unknown;
    difficulty?: unknown;
    name?: unknown;
    timeMs?: unknown;
    useIp?: unknown;
    location?: unknown;
    entryToken?: unknown;
  };

  if (!isScope(b.scope)) return NextResponse.json({ error: "bad scope" }, { status: 400 });
  if (typeof b.name !== "string") return NextResponse.json({ error: "bad name" }, { status: 400 });
  if (typeof b.timeMs !== "number") return NextResponse.json({ error: "bad time" }, { status: 400 });
  if (typeof b.useIp !== "boolean") return NextResponse.json({ error: "bad useIp" }, { status: 400 });
  if (!b.useIp && typeof b.location !== "string") {
    return NextResponse.json({ error: "bad location" }, { status: 400 });
  }

  const ip = clientIp(req);
  const withinLimit = await checkSubmitRateLimit(ip);
  if (!withinLimit) return NextResponse.json({ error: "rate limited" }, { status: 429 });

  const result = await submitScore({
    scope: b.scope,
    day: typeof b.day === "number" ? b.day : undefined,
    difficulty: isDifficulty(b.difficulty) ? b.difficulty : undefined,
    name: b.name,
    timeMs: b.timeMs,
    useIp: b.useIp,
    location: typeof b.location === "string" ? b.location : undefined,
    entryToken: typeof b.entryToken === "string" ? b.entryToken : undefined,
    ip,
  });

  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json(result);
}
