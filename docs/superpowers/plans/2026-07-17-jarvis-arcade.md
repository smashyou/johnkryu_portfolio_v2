# Jarvis Showcase + The Arcade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the Jarvis showcase (gateway banner + `/jarvis` story page) and The Arcade (`/games` hub with Baseball, Battleship, Sudoku — vs-computer/solo plus server-authoritative online rooms for Baseball & Battleship) per the spec.

**Architecture:** Pure game logic lives in `app/games/lib/` (client) and `app/games/lib/server/` (server reducers shared by API routes). One generic room API (`/api/games/*`) on Upstash Redis handles both online games via per-game reducer registry. UI pages are client components using a shared `useGameRoom` polling hook. Jarvis is static content + one committed screenshot asset.

**Tech Stack:** Existing stack (Next 14 App Router, TS strict, CSS modules, `@upstash/redis`, playwright devDep). One new Google font ("Press Start 2P" → `--font-arcade`).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-17-jarvis-arcade-design.md` — **the authority for all copy, rules, endpoints, schemas, and UX details.** Every task below implicitly includes its section of the spec.
- Baseball scoring truth table (from the user): secret `357` → guess `735` = 3 Balls; `153` = 1 Strike 1 Ball; `210` = Out. Secrets AND guesses are 3 distinct digits 0–9. First to 3 Strikes wins.
- Codebase rules: TS strict no `any`; compound `a.className` anchor color rules after any `.page :global(a)` rule; every CSS module's `@media (prefers-reduced-motion: reduce)` block stays last and disables new animations; API fetches use trailing slashes; mobile no-horizontal-overflow at 360/390/768 for every new route; desktop of EXISTING pages unchanged.
- `/jarvis` content: conceptual only — NO hosts, vendors, IPs, model names, repo paths, schedules, or business internals.
- No test runner: verification = `npx tsc --noEmit` + `npm run build` + Playwright checks listed per task (prod server; unique ports).
- Redis env vars may be absent locally → API returns 503 `{ error: "not configured" }`; UI degrades per spec. For online-game e2e verification without env vars, use `scripts/dev-redis-mock.md` approach defined in Task 4.
- Commits end with: Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>

---

### Task 1: Assets, fonts, and content metadata

**Files:**
- Create: `public/images/jarvis/ryuco-hq.png`
- Modify: `app/fonts.ts` (add Press_Start_2P → `--font-arcade`, weight "400", subsets latin, display swap; append to `fontVariables`)
- Modify: `app/data/content.ts`

**Interfaces (produces):**
```ts
// content.ts additions
export type ArcadeMeta = { slug: "games"; tag: string; accent: string; glow: string; title: string; desc: string; notes: string };
export const arcade: ArcadeMeta; // values verbatim from spec §"Gateway card"
export const jarvis: { eyebrow: string; title: string; line: string; hqUrl: "https://ryuco.tech"; storyPath: "/jarvis" }; // copy verbatim from spec §"Gateway banner"
```

- [ ] **Step 1:** Screenshot capture: Playwright, `https://ryuco.tech`, viewport 1600×1000, deviceScaleFactor 2, `waitUntil: networkidle` + 2500ms settle. Save raw, then `sharp` (devDep already installed): resize width 2400, png `{ compressionLevel: 9, palette: true }` — if >400KB, fall back to quality-80 JPEG at `ryuco-hq.jpg` and use that path everywhere.
- [ ] **Step 2:** Add font + content exports per Interfaces (copy strings verbatim from spec).
- [ ] **Step 3:** Verify `npx tsc --noEmit` clean; asset exists and <400KB.
- [ ] **Step 4:** Commit `"Add Jarvis/Arcade assets, arcade font, content metadata"`.

---

### Task 2: Jarvis banner + /jarvis page

**Files:**
- Create: `app/components/gateway/JarvisBanner.tsx`, `app/jarvis/page.tsx`, `app/jarvis/JarvisPage.tsx`, `app/jarvis/jarvis.module.css`
- Modify: `app/components/gateway/GatewayPage.tsx` (render `<JarvisBanner />` between intro block and cards grid), `app/components/gateway/gateway.module.css` (banner styles may live here or in the component's own module — pick one, keep it consistent)

**Interfaces:** Consumes `jarvis` const from content.ts; SwitchPill; fonts. Banner links: HQ `_blank noopener`, story via next/link.

- [ ] **Step 1:** Banner per spec §"Gateway banner": screenshot backdrop dimmed with overlay gradient to `#05060c`, gradient hairline border, eyebrow/title/line verbatim, two actions. Mobile ≤600px: stacked, full-width tappable actions.
- [ ] **Step 2:** `/jarvis` page per spec §"/jarvis page": hero + 4 sections + footer CTA; conceptual HTML/CSS org diagram (boxes: YOU → JARVIS → executive tier / worker tier / kanban spine / vaults / businesses); SwitchPill; metadata title "JARVIS — John K. Ryu". Copy drafted from spec's conceptual descriptions ONLY (content rule above).
- [ ] **Step 3:** Verify: tsc/build clean; Playwright 390+1440: banner renders on `/`, actions navigate (HQ link has correct href+rel, story → /jarvis/), /jarvis renders all sections, no overflow at 360/390/768, desktop gateway otherwise unchanged.
- [ ] **Step 4:** Commit `"Add Jarvis gateway banner and /jarvis story page"`.

---

### Task 3: Arcade gateway card + /games hub shell

**Files:**
- Create: `app/games/page.tsx`, `app/games/GamesHubPage.tsx`, `app/games/games.module.css`
- Modify: `app/components/gateway/GatewayPage.tsx` (+ its CSS) — Arcade card appended after concept cards

**Interfaces:** Consumes `arcade` from content.ts. Produces the arcade visual language (CSS module tokens: bg `#0a0612`, magenta `#ff4fd8`, cyan `#4fd8ff`, `--font-arcade` headings) that Tasks 6–8 reuse via their own modules (copy the token comment block).

- [ ] **Step 1:** Gateway card: same card anatomy as concepts but footer shows `PLAY →` (no vote button); links to `/games`. Do NOT touch the poll (`concepts`/`useVotes` untouched).
- [ ] **Step 2:** Hub per spec §"/games hub": nav (brand, SwitchPill accent `#ff4fd8`), heading, three glowing cabinet cards (⚾ `/games/baseball` `vs computer · online room`; 🚢 `/games/battleship` `vs computer · online room`; 🔢 `/games/sudoku` `solo · daily puzzle`). Neon glow via box-shadow/keyframe pulse — disabled under reduced motion. No scanlines.
- [ ] **Step 3:** Verify: tsc/build; Playwright: card on gateway → /games/, three cabinets link (game routes 404 until later tasks — fine), mobile 360/390/768 no overflow, poll still works on `/`.
- [ ] **Step 4:** Commit `"Add Arcade gateway card and games hub"`.

---

### Task 4: Games rooms API + client hook

**Files:**
- Create: `app/games/lib/server/rooms.ts` (redis access + room lifecycle), `app/games/lib/server/types.ts`, `app/api/games/room/route.ts`, `app/api/games/room/join/route.ts`, `app/api/games/move/route.ts`, `app/api/games/state/route.ts`, `app/games/lib/useGameRoom.ts`
- Create: `app/games/lib/server/baseballGame.ts`, `app/games/lib/server/battleshipGame.ts` (server reducers — Task 4 defines their INTERFACE + baseball implementation; battleship reducer body lands in Task 7 but the file + types land here as a registry stub that returns 501 for battleship until then)

**Interfaces (produces — later tasks depend on these exactly):**
```ts
// server/types.ts
export type GameType = "baseball" | "battleship";
export type Seat = 1 | 2;
export type RoomState<G> = { version: number; type: GameType; roomId: string; createdAt: number; lastMoveAt: number; tokens: [string, string | null]; game: G };
export type GameReducer<G, M> = {
  init(): G;
  applyMove(g: G, seat: Seat, payload: M): { next: G; error?: string }; // pure; throws nothing
  viewFor(g: G, seat: Seat): unknown; // player-scoped public view
};
// rooms.ts
export function getRedis(): Redis | null; // same env fallback pattern as /api/votes
export async function createRoom(type: GameType): Promise<{ roomId: string; playerToken: string }>;
export async function joinRoom(type: GameType, roomId: string): Promise<{ playerToken: string; seat: 2 } | { error: string; status: number }>;
export async function applyMove(type: GameType, roomId: string, playerToken: string, payload: unknown): Promise<{ ok: true } | { error: string; status: number }>; // version check + retry-once
export async function getView(type: GameType, roomId: string, playerToken: string): Promise<{ seat: Seat; view: unknown; lastMoveAt: number } | { error: string; status: number }>;
// useGameRoom.ts ("use client")
export function useGameRoom<TView>(type: GameType): {
  roomId: string | null; seat: Seat | null; view: TView | null;
  status: "idle" | "creating" | "waiting" | "playing" | "error" | "offline";
  error: string | null;
  createRoom(): Promise<string | null>; // returns roomId
  joinRoom(roomId: string): Promise<boolean>;
  sendMove(payload: unknown): Promise<boolean>;
  inviteUrl: string | null; // /games/<type>?room=<id>
};
// polls GET state every 1.5s while waiting/opponent turn (4s after 2min idle);
// stores { roomId, playerToken } in localStorage key `jkr_game_<type>`;
// 503 from API → status "offline".
```
Baseball server game state (documented for Task 6's view typing):
```ts
type BaseballGame = {
  phase: "setup" | "playing" | "done";
  secrets: [string | null, string | null]; // "357" style, 3 distinct digits
  turn: Seat; guesses: { seat: Seat; guess: string; strikes: number; balls: number; out: boolean }[];
  winner: Seat | null;
};
// moves: { kind: "secret", value: string } | { kind: "guess", value: string } | { kind: "rematch" }
// viewFor hides opponent secret until phase === "done".
```
- Room codes: 5 chars from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`; key `game:<type>:<roomId>`, `EX 86400` refreshed each write; per-IP create throttle: `INCR games:ratelimit:<ip>` EX 600, reject >20.
- Scoring lives in a SHARED pure module `app/games/lib/baseball.ts` (`scoreGuess(secret, guess)`) imported by BOTH the server reducer and the client AI (Task 6):
```ts
export function scoreGuess(secret: string, guess: string): { strikes: number; balls: number; out: boolean } {
  let strikes = 0, balls = 0;
  for (let i = 0; i < 3; i++) {
    if (guess[i] === secret[i]) strikes++;
    else if (secret.includes(guess[i])) balls++;
  }
  return { strikes, balls, out: strikes === 0 && balls === 0 };
}
```

- [ ] **Step 1:** Implement types, rooms.ts, the four routes (thin: parse → rooms.ts → NextResponse; 503 when `getRedis()` null), baseball reducer (validate distinct digits, turn order, phase transitions, first-to-3-strikes → `winner`, rematch resets, and `{ kind: "claimWin" }` — valid only when it is the opponent's turn and `now - lastMoveAt > 180000`, awards `winner` to claimant), registry with battleship stub (501 "not implemented").
- [ ] **Step 2:** `useGameRoom` hook per interface (visibility-aware polling: pause when `document.hidden`).
- [ ] **Step 3:** Write `scripts/dev-redis-mock.md`: instructions used by later verification — run dev with `UPSTASH_REDIS_REST_URL=http://localhost:8079` + [`upstash-redis-mock` npm dev server OR `docker run -p 8079:80 hiett/serverless-redis-http` + local redis]. If neither is feasible in the environment, verification of online mode falls to unit-style node scripts calling rooms.ts functions with a stubbed Redis object — implement `rooms.ts` so `getRedis()` is injectable for that purpose (optional param or module-level setter used only in scripts).
- [ ] **Step 4:** Verify: tsc/build clean; node script exercising the baseball reducer directly against the spec truth table (357/735→3B, 153→1S1B, 210→Out, win at 3S, turn-order rejection, non-distinct digits rejected); curl the four routes locally → 503 without env vars.
- [ ] **Step 5:** Commit `"Add games room API, baseball server logic, and room client hook"`.

---

### Task 5: Sudoku (`/games/sudoku`)

**Files:**
- Create: `app/games/lib/sudoku.ts`, `app/games/sudoku/page.tsx`, `app/games/sudoku/SudokuPage.tsx`, `app/games/sudoku/sudoku.module.css`

**Interfaces (produces):**
```ts
// lib/sudoku.ts (pure, seedable)
export type Difficulty = "easy" | "medium" | "hard";
export function mulberry32(seed: number): () => number; // deterministic PRNG
export function generate(difficulty: Difficulty, rng: () => number): { puzzle: number[]; solution: number[] }; // 81-length arrays, 0 = empty; unique solution guaranteed (solver-count check ≤ 2 aborts digging)
export function dailySeed(dateUtc: Date): number; // YYYYMMDD-based
export function dailyNumber(dateUtc: Date): number; // #N since 2026-07-17
```
- [ ] **Step 1:** Generator: backtracking fill (rng-shuffled candidates) → dig cells while `countSolutions(grid, cap=2) === 1`; clue targets per spec (Easy ~40, Medium ~32, Hard ~26); time-box digging (retry with fresh fill on rare failure).
- [ ] **Step 2:** UI per spec: 9×9 grid, keyboard + tap number pad, pencil-mark mode toggle, mistake highlighting toggle, timer, undo stack, difficulty picker, **Daily Puzzle** tab (seeded via `dailySeed`), completion overlay with time + copyable share snippet (`Sudoku #N — MM:SS — johnkryu.vercel.app/games/sudoku`), localStorage best times. Arcade visual language.
- [ ] **Step 3:** Verify: tsc/build; node script: `generate` determinism for same seed, unique-solution property on 10 boards per difficulty; Playwright: daily board identical across two page loads, enter digits/pencil/mistake flows, completion overlay via prefilled near-solved board (drive `localStorage`/inputs), mobile 360/390 no overflow.
- [ ] **Step 4:** Commit `"Add Sudoku with daily puzzle"`.

---

### Task 6: Baseball (`/games/baseball`)

**Files:**
- Create: `app/games/lib/baseballAi.ts`, `app/games/baseball/page.tsx`, `app/games/baseball/BaseballPage.tsx`, `app/games/baseball/baseball.module.css`

**Interfaces:** Consumes `scoreGuess` (Task 4), `useGameRoom<BaseballView>`, arcade tokens.
```ts
// baseballAi.ts (pure)
export function allCodes(): string[]; // 720 distinct-digit codes
export function filterCandidates(cands: string[], guess: string, result: { strikes: number; balls: number }): string[];
export function nextGuess(cands: string[], difficulty: "easy" | "normal" | "hard", rng?: () => number): string;
// easy: random candidate; normal: random consistent candidate; hard: min-max expected remaining candidates (sample-capped for perf)
```
- [ ] **Step 1:** AI module + node-script sanity: hard AI always wins ≤ 8 guesses across 50 random secrets; all difficulties only guess consistent candidates (normal/hard) or valid codes (easy).
- [ ] **Step 2:** Page per spec: mode select (vs Computer w/ difficulty · Online room); secret entry via digit pad (distinct enforced, hidden entry); guess history tables both sides (S/B/Out chips); turn indicator; win/reveal + rematch. Online: create/join via `useGameRoom`, `?room=` param auto-join, copy-invite-link button, waiting states, offline (503) message per spec, claim-win after 3min opponent silence (server move `{ kind: "claimWin" }` — add to Task 4's reducer if not present: valid only when `now - lastMoveAt > 180000` and it's opponent's turn).
- [ ] **Step 3:** Verify: tsc/build; Playwright vs computer: full game on easy (script the player side reading feedback; assert user truth-table via a fixed known secret path by seeding — expose a dev-only `?secret=` query guarded by `process.env.NODE_ENV !== "production"` for the test, or assert scoring via on-screen chips against lib calls); online: two browser contexts end-to-end per Task 4's mock strategy; mobile no-overflow.
- [ ] **Step 4:** Commit `"Add Baseball game (vs computer + online rooms)"`.

---

### Task 7: Battleship (`/games/battleship`)

**Files:**
- Create: `app/games/lib/battleship.ts`, `app/games/lib/battleshipAi.ts`, `app/games/battleship/page.tsx`, `app/games/battleship/BattleshipPage.tsx`, `app/games/battleship/battleship.module.css`
- Modify: `app/games/lib/server/battleshipGame.ts` (real reducer replacing 501 stub)

**Interfaces:** Consumes Task 4 room infra.
```ts
// lib/battleship.ts (pure, shared client/server)
export const FLEET: { name: string; size: number }[]; // Carrier5 Battleship4 Cruiser3 Submarine3 Destroyer2
export type Placement = { name: string; row: number; col: number; horizontal: boolean };
export function validatePlacement(placements: Placement[]): boolean; // in-bounds, no overlap, full fleet
export function shoot(board: Placement[], shots: string[], cell: string): { result: "hit" | "miss"; sunk: string | null; allSunk: boolean }; // cell "r,c"
// battleshipAi.ts: randomPlacement(rng), nextShot(shots, hits, rng) — parity hunt → target mode w/ direction lock
```
Server game: phases setup(placements) → playing(alternating shots) → done; viewFor exposes own board + opponent shot map only; rematch; claimWin same rule as baseball.
- [ ] **Step 1:** Pure modules + node-script checks (placement validation cases; AI sinks a random fleet in <90 shots over 20 trials; direction-lock behavior after 2 hits).
- [ ] **Step 2:** Server reducer (replace stub) mirroring baseball's phase pattern; node-script truth tests (turn order, illegal shot rejection, sunk announcement, win).
- [ ] **Step 3:** Page per spec: placement UI (tap cell + rotate + random + clear), dual boards, hit/miss/sunk markers, sunk-ship tray, modes (vs computer / online) with same room UX as baseball. Mobile-first tap targets (min 32px cells at 360px via responsive sizing).
- [ ] **Step 4:** Verify: tsc/build; Playwright vs computer to at least one sunk ship + full-game win using random placement on both sides (loop shots programmatically); online two-context e2e per mock strategy; mobile no-overflow.
- [ ] **Step 5:** Commit `"Add Battleship game (vs computer + online rooms)"`.

---

### Task 8: Final integration audit

**Files:** Modify anything failing audit; Modify `CLAUDE.md`.

- [ ] **Step 1:** Full pass (prod build + Playwright): gateway (banner + Arcade card + poll unaffected), /jarvis, /games hub, all three games' happy paths, invite-link join flow, 503 degradation messaging with env vars absent, reduced-motion audit on new routes (neon pulses off, no new RAF loops), mobile 360/390/768 no-overflow on all 5 new routes, existing 8 routes unregressed (spot-check / + /aurora-glass/).
- [ ] **Step 2:** Lint + tsc + build clean.
- [ ] **Step 3:** CLAUDE.md: add /jarvis, /games routes, `/api/games/*` contract summary, Upstash prerequisite note (multiplayer + votes), games lib layout.
- [ ] **Step 4:** Commit `"Finalize Jarvis showcase and Arcade: docs and integration audit"`.
- [ ] **Step 5:** Deployment note to user: Upstash Redis provisioning required for online play + voting persistence.
