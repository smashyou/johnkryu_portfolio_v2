// Sudoku leaderboard: Upstash-persisted daily (per UTC day) + all-time
// (per difficulty) boards. No new database — reuses the same Redis
// instance/env-var pattern as the multiplayer rooms backend.
//
// Identity/privacy, for the WHOLE file (every Redis key this module
// writes):
//   - The default identity is a salted SHA-256 hash of the submitter's
//     client IP (`ipIdentity`). The salt itself is never committed to
//     source — see `getSalt` below — and the raw IP is NEVER stored
//     anywhere, in any key, only the hash.
//   - The per-IP submit rate-limit key is ALSO keyed by that same hashed
//     identity (`checkSubmitRateLimit`), not the raw IP — there is no
//     Redis key anywhere in this module that contains a raw IP address.
//   - Visitors who decline IP-based tracking instead provide a
//     city/state/zip `location`, and their identity is a SHA-256 hash of
//     their normalized name+location (`nameLocationIdentity`) — no IP
//     involved at all for that path. Because that hash is fully
//     recomputable by anyone from the public leaderboard display (name +
//     location are shown), opt-out identities are additionally protected
//     by an entry-token ownership check (see `submitScore`) so a third
//     party can't hijack an existing entry by resubmitting the same
//     name+location with a fabricated fast time.
//   - Either way, one leaderboard entry exists per identity per board; a
//     worse time never overwrites a better one (Redis `ZADD LT`).

import { createHash, randomBytes } from "crypto";
import type { Redis } from "@upstash/redis";
import { dailyNumber } from "../sudoku";
import { getRedis } from "./rooms";

export type LeaderboardDifficulty = "easy" | "medium" | "hard";
export type LeaderboardScope = "daily" | "alltime";

export const DAILY_TOP_N = 10;
export const ALLTIME_TOP_N = 25;
export const ALLTIME_CAP = 100;

const DAILY_TTL_SECONDS = 35 * 86400; // ~35 days, per spec
// Individual profile (name/location display data) TTL: long-lived and
// refreshed on every submit for that identity, so active players' display
// data survives indefinitely while genuinely stale identities eventually
// fall out of Redis instead of accumulating forever.
const PROFILE_TTL_SECONDS = 400 * 86400;

export const MIN_TIME_MS = 15_000; // 15s — faster is not a legitimate solve
export const MAX_TIME_MS = 86_400_000; // 24h — anything slower is noise

const SUBMIT_RATE_WINDOW_SECONDS = 600;
const SUBMIT_RATE_MAX = 20;

const DIFFICULTIES: readonly LeaderboardDifficulty[] = ["easy", "medium", "hard"];

export function isDifficulty(value: unknown): value is LeaderboardDifficulty {
  return typeof value === "string" && (DIFFICULTIES as readonly string[]).includes(value);
}

function dailyKey(day: number): string {
  return `sudoku:lb:daily:${day}`;
}

function alltimeKey(difficulty: LeaderboardDifficulty): string {
  return `sudoku:lb:alltime:${difficulty}`;
}

function profileKey(identity: string): string {
  return `sudoku:lb:profile:${identity}`;
}

/** Rate-limit key is namespaced by the HASHED ip identity, never the raw IP. */
function rateKey(hashedIp: string): string {
  return `sudoku:lb:ratelimit:${hashedIp}`;
}

const SALT_KEY = "sudoku:lb:salt";

// Per-lambda-instance cache of the shared app salt, so a warm instance
// only pays the Redis round-trip once. Every cold instance still
// converges on the SAME salt via the SETNX below (first writer wins;
// everyone else reads back what actually landed) — the cache is purely
// an optimization, never a source of divergence.
let cachedSalt: string | null = null;

/**
 * Returns the shared app-wide salt used by `ipIdentity`, creating it once
 * in Redis (SETNX-style: `SET ... NX`) if it doesn't exist yet, using
 * `crypto.randomBytes` as the bootstrap-value generator. This is
 * deliberately NOT a source-committed constant: a salt baked into the
 * repo is readable by anyone with source access and lets them
 * brute-force `ipIdentity` offline for any candidate IP (e.g. their own,
 * to find/spoof their own entry, or a known pool of IPs). Generating and
 * storing the salt only in Redis raises that bar to "has Redis access" —
 * a materially different (and, for this app, unreachable-without-
 * already-owning-the-data) threat. Tradeoff: this protects against
 * offline brute-force from the public source; it does NOT protect
 * against an attacker who has already compromised Redis (at that point
 * they have the raw ZSET/HSET leaderboard data directly and computing
 * `ipIdentity` themselves adds nothing) — that threat is out of scope.
 */
async function getSalt(redis: Redis): Promise<string> {
  if (cachedSalt) return cachedSalt;
  const candidate = randomBytes(32).toString("hex");
  const setResult = await redis.set(SALT_KEY, candidate, { nx: true });
  if (setResult === "OK") {
    cachedSalt = candidate;
  } else {
    // Another instance won the race — read back its value. Falls back to
    // the locally generated candidate only in the practically-impossible
    // case the key vanished between the failed SETNX and this GET.
    cachedSalt = (await redis.get<string>(SALT_KEY)) ?? candidate;
  }
  return cachedSalt;
}

/** Strips ASCII control characters (incl. DEL) and trims surrounding whitespace. */
function cleanString(value: string): string {
  // eslint-disable-next-line no-control-regex -- intentional: stripping control chars
  return value.replace(/[\x00-\x1f\x7f]/g, "").trim();
}

/** Sanitizes a display name: 1-20 chars after cleaning, or null if it doesn't fit. */
export function sanitizeName(raw: string): string | null {
  const cleaned = cleanString(raw).slice(0, 20);
  if (cleaned.length < 1) return null;
  return cleaned;
}

/** Sanitizes an opt-out location string: 2-40 chars after cleaning, or null. */
export function sanitizeLocation(raw: string): string | null {
  const cleaned = cleanString(raw).slice(0, 40);
  if (cleaned.length < 2) return null;
  return cleaned;
}

/** Case/whitespace-insensitive normalization used only for identity hashing. */
function normalizeForIdentity(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

/**
 * Default identity path: salted hash of the client IP. The raw IP is
 * never stored anywhere — only this hash — and the salt itself lives
 * only in Redis (see `getSalt`), never in source. Requires a live Redis
 * client because the salt fetch is Redis-backed; both callers of this
 * function (`submitScore`, `checkSubmitRateLimit`) only run once their
 * caller has already confirmed Redis is configured.
 */
export async function ipIdentity(ip: string, redis: Redis): Promise<string> {
  const salt = await getSalt(redis);
  return sha256Hex(`${ip}::${salt}`);
}

/** Opt-out identity path: hash of normalized name+location, no IP involved. */
export function nameLocationIdentity(name: string, location: string): string {
  return sha256Hex(`${normalizeForIdentity(name)}|${normalizeForIdentity(location)}`);
}

export async function checkSubmitRateLimit(ip: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return true; // caller already 503s when redis is unconfigured
  const hashedIp = await ipIdentity(ip, redis);
  const key = rateKey(hashedIp);
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, SUBMIT_RATE_WINDOW_SECONDS);
  }
  return count <= SUBMIT_RATE_MAX;
}

export type SubmitParams = {
  scope: LeaderboardScope;
  day?: number;
  difficulty?: LeaderboardDifficulty;
  name: string;
  timeMs: number;
  useIp: boolean;
  location?: string;
  /**
   * Required to update an EXISTING opt-out (name+location) identity;
   * ignored for the useIp=true path. See the ownership check below.
   */
  entryToken?: string;
  ip: string;
};

export type SubmitResult =
  | { identity: string; rank: number; total: number; entryToken?: string }
  | { error: string; status: number };

export async function submitScore(params: SubmitParams): Promise<SubmitResult> {
  const redis = getRedis();
  if (!redis) return { error: "not configured", status: 503 };

  if (
    typeof params.timeMs !== "number" ||
    !Number.isFinite(params.timeMs) ||
    params.timeMs < MIN_TIME_MS ||
    params.timeMs > MAX_TIME_MS
  ) {
    return { error: "bad time", status: 400 };
  }

  const name = sanitizeName(params.name);
  if (!name) return { error: "bad name", status: 400 };

  let key: string;
  if (params.scope === "daily") {
    // The day must match TODAY's server-computed daily number — this is
    // what stops a client from backdating a fast time onto an already-
    // closed board (or forward-dating onto tomorrow's before it exists).
    if (typeof params.day !== "number" || params.day !== dailyNumber(new Date())) {
      return { error: "bad day", status: 400 };
    }
    key = dailyKey(params.day);
  } else if (params.scope === "alltime") {
    if (!isDifficulty(params.difficulty)) return { error: "bad difficulty", status: 400 };
    key = alltimeKey(params.difficulty);
  } else {
    return { error: "bad scope", status: 400 };
  }

  let identity: string;
  let location: string | null = null;
  let newEntryToken: string | null = null;

  if (params.useIp) {
    identity = await ipIdentity(params.ip, redis);
  } else {
    const loc = params.location != null ? sanitizeLocation(params.location) : null;
    if (!loc) return { error: "bad location", status: 400 };
    location = loc;
    identity = nameLocationIdentity(name, loc);

    // Ownership check: the opt-out identity hash is recomputable by
    // anyone from the public leaderboard (name + location are both
    // displayed), so unlike the IP path — where identity derives from
    // something only the real requester possesses — it needs an explicit
    // proof-of-ownership token to stop a third party from "claiming" an
    // existing entry with a fabricated fast time. First submission for a
    // brand new identity mints a random token and stores only its hash;
    // every subsequent submission for that same identity must present
    // the matching token.
    const existingTokenHash = await redis.hget<string>(profileKey(identity), "tokenHash");
    if (existingTokenHash) {
      const providedHash = params.entryToken ? sha256Hex(params.entryToken) : null;
      if (!providedHash || providedHash !== existingTokenHash) {
        return { error: "name taken", status: 409 };
      }
    } else {
      newEntryToken = randomBytes(16).toString("hex");
    }
  }

  // LT: only ever improves an existing entry's score; always adds a brand
  // new one. This is the "better time updates it, worse time doesn't" rule.
  await redis.zadd(key, { lt: true }, { score: params.timeMs, member: identity });

  if (params.scope === "daily") {
    await redis.expire(key, DAILY_TTL_SECONDS);
  } else {
    // Keep only the best ALLTIME_CAP (rank 0..CAP-1, ascending = fastest
    // first); trim anything worse than that off the tail.
    await redis.zremrangebyrank(key, ALLTIME_CAP, -1);
  }

  const profileFields: Record<string, string> = { name, location: location ?? "" };
  if (newEntryToken) profileFields.tokenHash = sha256Hex(newEntryToken);
  await redis.hset(profileKey(identity), profileFields);
  await redis.expire(profileKey(identity), PROFILE_TTL_SECONDS);

  const [rankRaw, total] = await Promise.all([
    redis.zrank<string>(key, identity),
    redis.zcard(key),
  ]);

  // rankRaw can only be null here if the all-time trim above just evicted
  // this identity for not being competitive enough to make the top 100 —
  // report it as "just past the cutoff" rather than crashing on null.
  const rank = rankRaw == null ? total + 1 : rankRaw + 1;

  return newEntryToken
    ? { identity, rank, total, entryToken: newEntryToken }
    : { identity, rank, total };
}

export type LeaderboardEntry = {
  rank: number;
  name: string;
  location?: string;
  timeMs: number;
};

export type GetParams = {
  scope: LeaderboardScope;
  day?: number;
  difficulty?: LeaderboardDifficulty;
  me?: string;
};

export type GetResult =
  | { entries: LeaderboardEntry[]; total: number; me?: { rank: number; timeMs: number } }
  | { error: string; status: number };

type Profile = { name?: string; location?: string };

export async function getLeaderboard(params: GetParams): Promise<GetResult> {
  const redis = getRedis();
  if (!redis) return { error: "not configured", status: 503 };

  let key: string;
  let topN: number;
  if (params.scope === "daily") {
    if (typeof params.day !== "number" || !Number.isFinite(params.day)) {
      return { error: "bad day", status: 400 };
    }
    key = dailyKey(params.day);
    topN = DAILY_TOP_N;
  } else if (params.scope === "alltime") {
    if (!isDifficulty(params.difficulty)) return { error: "bad difficulty", status: 400 };
    key = alltimeKey(params.difficulty);
    topN = ALLTIME_TOP_N;
  } else {
    return { error: "bad scope", status: 400 };
  }

  const [raw, total] = await Promise.all([
    redis.zrange<string[]>(key, 0, topN - 1, { withScores: true }),
    redis.zcard(key),
  ]);

  // withScores flattens to [member, score, member, score, ...].
  const pairs: { identity: string; timeMs: number }[] = [];
  for (let i = 0; i < raw.length; i += 2) {
    pairs.push({ identity: String(raw[i]), timeMs: Number(raw[i + 1]) });
  }

  const profiles = await Promise.all(
    pairs.map((p) => redis.hgetall<Profile>(profileKey(p.identity)))
  );

  const entries: LeaderboardEntry[] = pairs.map((p, i) => {
    const profile = profiles[i];
    // Re-sanitize on read too, defensively, in case of any pre-existing
    // stored data that predates a validation tightening.
    const name = sanitizeName(profile?.name ?? "") ?? "Anonymous";
    const location = profile?.location ? sanitizeLocation(profile.location) : null;
    const entry: LeaderboardEntry = { rank: i + 1, name, timeMs: p.timeMs };
    if (location) entry.location = location;
    return entry;
  });

  let me: { rank: number; timeMs: number } | undefined;
  if (params.me) {
    const [rankRaw, scoreRaw] = await Promise.all([
      redis.zrank<string>(key, params.me),
      redis.zscore<string>(key, params.me),
    ]);
    if (rankRaw != null && scoreRaw != null) {
      me = { rank: rankRaw + 1, timeMs: Number(scoreRaw) };
    }
  }

  return me ? { entries, total, me } : { entries, total };
}
