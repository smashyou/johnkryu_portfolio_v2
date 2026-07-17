import { Redis } from "@upstash/redis";
import { baseballGame } from "./baseballGame";
import { battleshipGame } from "./battleshipGame";
import type { GameReducer, GameType, RoomState, Seat } from "./types";

const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
const ROOM_CODE_LENGTH = 5;
const ROOM_TTL_SECONDS = 86400; // 24h, refreshed on every write
const RATE_LIMIT_WINDOW_SECONDS = 600;
const RATE_LIMIT_MAX_CREATES = 20;
const ROOM_CODE_ALLOCATION_ATTEMPTS = 10;
const CAS_ATTEMPTS = 2; // one initial write attempt + one retry on version conflict

// Atomic compare-and-swap: only writes when the stored state's `version`
// still matches what we read. Runs as a single Lua EVAL on Upstash so there
// is no read-check-then-SET window for a concurrent writer to land in
// (e.g. both players submitting their secret at the same moment).
// Returns: 1 = written, 0 = version mismatch (someone else wrote first),
// -1 = room missing entirely.
const CAS_EVAL_SCRIPT = `
local cur = redis.call('GET', KEYS[1])
if not cur then return -1 end
if cjson.decode(cur).version ~= tonumber(ARGV[1]) then return 0 end
redis.call('SET', KEYS[1], ARGV[2], 'EX', tonumber(ARGV[3]))
return 1
`;

type RegistryEntry = {
  reducer: GameReducer<unknown, unknown>;
  /** Battleship's reducer is a Task 7 stub — moves against it always 501. */
  implemented: boolean;
};

const registry: Record<GameType, RegistryEntry> = {
  baseball: { reducer: baseballGame as GameReducer<unknown, unknown>, implemented: true },
  battleship: { reducer: battleshipGame as GameReducer<unknown, unknown>, implemented: false },
};

// ---------------------------------------------------------------------------
// Redis client — same env-var fallback pattern as app/api/votes/route.ts.
// `setRedisForTesting` lets node verification scripts (and, in principle,
// future unit tests) inject an in-memory fake without touching env vars.
// ---------------------------------------------------------------------------

let redisOverride: Redis | null | undefined;

export function setRedisForTesting(client: Redis | null): void {
  redisOverride = client;
}

export function getRedis(): Redis | null {
  if (redisOverride !== undefined) return redisOverride;
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

function roomKey(type: GameType, roomId: string): string {
  return `game:${type}:${roomId}`;
}

function randomRoomCode(): string {
  let code = "";
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)];
  }
  return code;
}

function randomToken(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback for environments without a global crypto.randomUUID (older Node
  // test harnesses); not used in the nodejs route runtime.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function seatForToken(state: RoomState<unknown>, token: string): Seat | null {
  if (state.tokens[0] === token) return 1;
  if (state.tokens[1] === token) return 2;
  return null;
}

/**
 * Atomically write `updated` under `key` iff the currently stored state's
 * version still equals `expectedVersion`. See CAS_EVAL_SCRIPT above.
 */
async function casWrite(
  redis: Redis,
  key: string,
  expectedVersion: number,
  updated: RoomState<unknown>
): Promise<1 | 0 | -1> {
  const result = await redis.eval<[number, unknown, number], number>(
    CAS_EVAL_SCRIPT,
    [key],
    [expectedVersion, updated, ROOM_TTL_SECONDS]
  );
  return result as 1 | 0 | -1;
}

/**
 * Extract a best-effort client IP from a Request for rate-limiting. Lives
 * here (not in the room route) so it can be imported by both the route and
 * verification scripts without violating Next's route-module export
 * allowlist (route.ts files may only export GET/POST/etc.).
 *
 * x-real-ip (when the proxy sets it) is the most trustworthy single value.
 * Otherwise fall back to x-forwarded-for — but take the LAST entry, not the
 * first: intermediate proxies (Vercel included) APPEND the real client IP
 * to the end of the chain, while the first entry is whatever the client
 * itself sent and is trivially spoofable.
 */
export function clientIp(req: Request): string {
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }
  return "unknown";
}

/**
 * Per-IP create throttle: `games:ratelimit:<ip>` INCR'd with a 10-minute
 * window, capped at 20 creates. Not part of the createRoom() interface
 * (which has no IP parameter) — call this from the room route before
 * invoking createRoom(). Returns true when the request is within budget.
 */
export async function checkCreateRateLimit(ip: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return true; // caller already 503s when redis is unconfigured
  const key = `games:ratelimit:${ip}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, RATE_LIMIT_WINDOW_SECONDS);
  }
  return count <= RATE_LIMIT_MAX_CREATES;
}

export async function createRoom(type: GameType): Promise<{ roomId: string; playerToken: string }> {
  const redis = getRedis();
  if (!redis) throw new Error("redis not configured");

  const entry = registry[type];
  const playerToken = randomToken();

  let roomId: string | null = null;
  for (let attempt = 0; attempt < ROOM_CODE_ALLOCATION_ATTEMPTS; attempt++) {
    const candidate = randomRoomCode();
    const existing = await redis.get(roomKey(type, candidate));
    if (!existing) {
      roomId = candidate;
      break;
    }
  }
  if (!roomId) throw new Error("failed to allocate a unique room code");

  const now = Date.now();
  const state: RoomState<unknown> = {
    version: 1,
    type,
    roomId,
    createdAt: now,
    lastMoveAt: now,
    tokens: [playerToken, null],
    game: entry.reducer.init(),
  };
  await redis.set(roomKey(type, roomId), state, { ex: ROOM_TTL_SECONDS });

  return { roomId, playerToken };
}

export async function joinRoom(
  type: GameType,
  roomId: string
): Promise<{ playerToken: string; seat: 2 } | { error: string; status: number }> {
  const redis = getRedis();
  if (!redis) return { error: "not configured", status: 503 };

  const key = roomKey(type, roomId);
  const state = await redis.get<RoomState<unknown>>(key);
  if (!state) return { error: "room not found", status: 404 };
  if (state.tokens[1]) return { error: "room is full", status: 409 };

  const playerToken = randomToken();
  const updated: RoomState<unknown> = {
    ...state,
    tokens: [state.tokens[0], playerToken],
    version: state.version + 1,
    lastMoveAt: Date.now(),
  };
  await redis.set(key, updated, { ex: ROOM_TTL_SECONDS });

  return { playerToken, seat: 2 };
}

export async function applyMove(
  type: GameType,
  roomId: string,
  playerToken: string,
  payload: unknown
): Promise<{ ok: true } | { error: string; status: number }> {
  const redis = getRedis();
  if (!redis) return { error: "not configured", status: 503 };

  const entry = registry[type];
  if (!entry.implemented) return { error: "not implemented", status: 501 };

  // Reject a missing/malformed move payload before it ever reaches the
  // reducer — this is what stops e.g. `payload.kind` on `undefined` from
  // throwing an unhandled 500 out of the route handler.
  if (entry.reducer.validateMove && !entry.reducer.validateMove(payload)) {
    return { error: "bad move", status: 400 };
  }

  const key = roomKey(type, roomId);

  for (let attempt = 0; attempt < CAS_ATTEMPTS; attempt++) {
    const state = await redis.get<RoomState<unknown>>(key);
    if (!state) return { error: "room not found", status: 404 };

    const seat = seatForToken(state, playerToken);
    if (!seat) return { error: "invalid player token", status: 403 };

    // Every move gets `now`/`lastMoveAt` merged in (harmless extra fields
    // for most move kinds) so any reducer's time-gated moves — currently
    // only baseball's `claimWin` — can stay pure and testable with a fake
    // clock instead of calling Date.now() internally.
    const now = Date.now();
    const augmentedPayload =
      typeof payload === "object" && payload !== null
        ? { ...payload, now, lastMoveAt: state.lastMoveAt }
        : payload;

    // Reducers are documented as pure and non-throwing, but we don't trust
    // that contract blindly from the caller side — any unexpected throw
    // (e.g. a validateMove gap) becomes a 400, never an unhandled 500.
    let result: { next: unknown; error?: string };
    try {
      result = entry.reducer.applyMove(state.game, seat, augmentedPayload);
    } catch {
      return { error: "bad move", status: 400 };
    }
    const { next, error } = result;
    if (error) return { error, status: 400 };

    const updated: RoomState<unknown> = {
      ...state,
      game: next,
      version: state.version + 1,
      lastMoveAt: now,
    };

    // Atomic compare-and-swap (single Lua EVAL — see CAS_EVAL_SCRIPT) closes
    // the lost-update window a plain read-check-then-SET would leave open
    // (e.g. both players submitting secrets in the same instant): the write
    // only lands if the stored version still matches what we read.
    const casResult = await casWrite(redis, key, state.version, updated);
    if (casResult === 1) return { ok: true };
    if (casResult === -1) return { error: "room not found", status: 404 };
    // casResult === 0: someone else wrote first — retry once against fresh state.
    if (attempt < CAS_ATTEMPTS - 1) continue;
    return { error: "version conflict", status: 409 };
  }

  return { error: "version conflict", status: 409 };
}

export async function getView(
  type: GameType,
  roomId: string,
  playerToken: string
): Promise<
  | { seat: Seat; view: unknown; lastMoveAt: number; opponentJoined: boolean }
  | { error: string; status: number }
> {
  const redis = getRedis();
  if (!redis) return { error: "not configured", status: 503 };

  const key = roomKey(type, roomId);
  const state = await redis.get<RoomState<unknown>>(key);
  if (!state) return { error: "room not found", status: 404 };

  const seat = seatForToken(state, playerToken);
  if (!seat) return { error: "invalid player token", status: 403 };

  const entry = registry[type];
  const view = entry.reducer.viewFor(state.game, seat);

  // `opponentJoined` is additive to the documented interface (seat/view/
  // lastMoveAt stay exactly as specified) — it gives useGameRoom a
  // game-agnostic way to distinguish "waiting for a second player" from
  // "room is live" without peeking into the per-game `view` shape.
  return { seat, view, lastMoveAt: state.lastMoveAt, opponentJoined: state.tokens[1] !== null };
}
