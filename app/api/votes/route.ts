import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const IDS = ["c1", "c2", "c3", "c4", "c5", "c6", "c7"] as const;
type Id = (typeof IDS)[number];

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

async function allVotes(redis: Redis) {
  const vals = await redis.mget<(number | null)[]>(...IDS.map((id) => `poll:${id}`));
  return Object.fromEntries(IDS.map((id, i) => [id, Number(vals[i]) || 0]));
}

export async function GET() {
  const redis = getRedis();
  if (!redis) return NextResponse.json({ error: "not configured" }, { status: 503 });
  return NextResponse.json(await allVotes(redis));
}

export async function POST(req: Request) {
  const redis = getRedis();
  if (!redis) return NextResponse.json({ error: "not configured" }, { status: 503 });
  let body: { vote?: string; unvote?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const vote = body.vote as Id;
  if (!IDS.includes(vote)) return NextResponse.json({ error: "bad id" }, { status: 400 });
  await redis.incr(`poll:${vote}`);
  const unvote = body.unvote as Id | null | undefined;
  if (unvote && IDS.includes(unvote)) {
    const n = await redis.decr(`poll:${unvote}`);
    if (n < 0) await redis.set(`poll:${unvote}`, 0);
  }
  return NextResponse.json(await allVotes(redis));
}
