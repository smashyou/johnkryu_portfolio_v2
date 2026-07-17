# Running the games API against a local Redis (dev only)

`app/api/games/*` and `app/api/votes/route.ts` both read Redis connection
info from `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` (or the
`KV_REST_API_URL`/`KV_REST_API_TOKEN` fallback pair). Without either pair set,
`getRedis()` returns `null` and every route responds `503 { error: "not
configured" }` — this is the default, zero-setup state and is exactly what CI
and fresh clones see.

To exercise the **online** (Redis-backed) code path locally, point those env
vars at a local REST-compatible Redis instead of real Upstash:

## Option A — `serverless-redis-http` + local Redis (recommended)

```bash
# 1. Start a local Redis
redis-server --port 6379 &

# 2. Start the Upstash-REST-compatible proxy in front of it
docker run -d --name srh -p 8079:80 \
  -e SRH_MODE=env \
  -e SRH_TOKEN=dev-token \
  -e SRH_CONNECTION_STRING="redis://host.docker.internal:6379" \
  hiett/serverless-redis-http:latest

# 3. Point the app at it
export UPSTASH_REDIS_REST_URL=http://localhost:8079
export UPSTASH_REDIS_REST_TOKEN=dev-token

# 4. Run the app
PORT=4202 npm run dev
```

Any REST call the routes make (`redis.get/set/incr/expire`) now round-trips
through the local Redis exactly like it would against real Upstash.

## Option B — `upstash-redis-mock` npm dev server

If Docker isn't available, an in-process mock REST server (e.g.
`upstash-redis-mock` or an equivalent tiny Express shim that implements
`GET/POST /` for the subset of commands used here — `GET`, `SET` with `EX`,
`INCR`, `EXPIRE`) can be pointed at the same two env vars. This repo does not
vendor one; add it as a throwaway dev dependency only if Option A isn't
feasible in your environment.

> **Update (Task 8 integration audit):** this is exactly the path used for
> the two-context online e2e verification of Baseball and Battleship, since
> Docker had no running daemon in that environment. Rather than an npm
> dependency, a ~150-line Node `http` server was written from scratch,
> implementing precisely the wire shapes `@upstash/redis`'s Node client
> actually sends: `POST /pipeline` with a JSON array of command arrays (the
> SDK defaults to `enableAutoPipelining: true`, so even a single
> `redis.get(...)` call goes through the pipeline endpoint, not `POST /`
> with one command — this tripped up the first version of the shim, worth
> knowing up front), plus `EVAL` handled by hardcoding the one CAS script
> `rooms.ts` actually sends (a real Lua VM wasn't needed for a single,
> known script). Full protocol notes and e2e results are in
> `.superpowers/sdd/task-8-report.md`; the shim script itself was
> throwaway (scratch directory, not vendored here) — reconstructing it
> from the wire-shape notes above takes a few minutes if needed again.

## Option C — unit-style node scripts (no server needed)

`app/games/lib/server/rooms.ts` exports `setRedisForTesting(client)`, a
module-level override that replaces whatever `getRedis()` would otherwise
construct from env vars. This is the path used for this task's own
verification (`scripts/verify-baseball.ts`, run via `npx tsx`): a small
in-memory fake implementing just `get`/`set`/`incr`/`expire` (JSON-round-
tripping values, like the real REST client's automatic serialization) is
injected via `setRedisForTesting(fake as unknown as Redis)`, then
`createRoom`/`joinRoom`/`applyMove`/`getView` are called directly — no HTTP
server, no Docker, no network required. Prefer this for fast reducer/CAS
tests; use Option A when you need to verify the actual route handlers
end-to-end (e.g. with `curl`) against a real Redis wire protocol.

## Verifying the "unconfigured" (offline) path

Just don't set the env vars — `npm run dev` (or `PORT=4202 npm run dev`) with
a clean environment is sufficient:

```bash
curl -s -o /dev/null -w '%{http_code}\n' -X POST http://localhost:4202/api/games/room/ \
  -H 'Content-Type: application/json' -d '{"type":"baseball"}'
# => 503
```
