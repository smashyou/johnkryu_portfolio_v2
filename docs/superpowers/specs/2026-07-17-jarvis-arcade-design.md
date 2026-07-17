# Jarvis Showcase + The Arcade — Design Spec

**Date:** 2026-07-17
**Status:** Approved (banner + /jarvis page; all three games with full multiplayer; Arcade as 8th gateway card)

## Goal

Two additions to the multi-concept portfolio (johnkryu.vercel.app):
1. **Jarvis showcase** — a gateway feature banner plus a dedicated `/jarvis`
   story page for John's personal AI chief-of-staff system (public site:
   https://ryuco.tech), presented as something above/beside the portfolio,
   NOT as a portfolio project card.
2. **The Arcade** — a `/games` hub (8th gateway card) with three playable
   games: Baseball (Bulls & Cows), Battleship, and Sudoku — vs-computer AND
   online room-code multiplayer (Baseball, Battleship), designed to make
   visitors invite friends (traffic driver).

## Decisions (user-confirmed)

- Jarvis: gateway banner AND dedicated page; ryuco.tech is public-safe to
  link directly.
- Games: all three at launch, full multiplayer where applicable.
- Arcade: styled as an 8th gateway card with accent `#ff4fd8`, `PLAY →`
  instead of a vote button (not part of the c1–c7 poll).
- Multiplayer backend: Upstash Redis via the existing `/api` pattern —
  **provisioning Upstash in Vercel is a launch prerequisite for online mode**
  (same integration the voting poll uses). Online mode degrades gracefully
  when unconfigured; vs-computer/solo always works.

## 1. Jarvis showcase

### Asset
- Capture a high-res (2x) screenshot of https://ryuco.tech main view at build
  prep time (one-time, committed): `public/images/jarvis/ryuco-hq.png`
  (~1600×1000 viewport, deviceScaleFactor 2, compressed ≤400KB via sharp).

### Gateway banner (`app/components/gateway/JarvisBanner.tsx`)
- Placement: between the intro block and the concept-cards grid in
  `GatewayPage.tsx`.
- Full-width card, distinct from concept cards: the RyuCo screenshot as a
  dimmed/glowing backdrop (CSS overlay gradient toward `#05060c`), thin
  cyan-violet gradient hairline border.
- Copy (verbatim):
  - Eyebrow: `PERSONAL PROJECT · ALWAYS ON`
  - Title: `JARVIS — my personal AI chief of staff`
  - Line: `A multi-agent AI company that runs my holding company's
    operations — agents, vaults, and businesses orbiting one core.`
  - Actions: `Visit RYUCO HQ →` (https://ryuco.tech, `_blank noopener`),
    `The story →` (`/jarvis`).
- Mobile: stacks, backdrop stays legible, actions full-width tappable.

### `/jarvis` page (`app/jarvis/`)
Gateway visual language (Space Grotesk, `#05060c`, starfield NOT reused —
static subtle background; SwitchPill back to `/`). Sections:
1. Hero: title, one-liner, full screenshot (lightbox-free `<img>`), CTA to
   ryuco.tech.
2. **What it is** — chief-of-staff agent that sits above the individual
   businesses and John's personal workflow.
3. **How it's built** — conceptual only: executive tier (planning/oversight
   agents), worker tier (specialist agents), a kanban coordination spine,
   knowledge vaults per business, one personal agent above them all.
   Rendered as a simple styled diagram (HTML/CSS boxes, no canvas).
   **Hard rule: NO infrastructure details** — no hosts, vendors, IPs,
   model names, repo paths, schedules, or business-internal specifics.
   Copy drafted from the public-safe conceptual layer of the Company-HQ
   docs; John reviews before ship.
4. **A day with Jarvis** — 3-4 bullets (morning brief, routing work into
   business orgs, oversight/reporting).
5. Footer CTA: `Visit RYUCO HQ →` + back to gateway.
- Metadata: title "JARVIS — John K. Ryu".

## 2. The Arcade

### Gateway card
- `concepts`-style card appended to the grid (data in `content.ts` as a
  separate `arcade` const or an entry flagged `playable: true` — NOT in the
  `c1–c7` vote ids; poll code untouched).
- Tag `08 · THE ARCADE`, accent `#ff4fd8`, glow `rgba(255,79,216,.12)`,
  title `The Arcade`, desc: `Three games, zero downloads. Challenge the
  computer — or send a friend an invite link and settle it head-to-head.`,
  notes `play · multiplayer`, footer `PLAY →` (no vote button).

### `/games` hub (`app/games/`)
- Retro-neon arcade identity: dark `#0a0612`, neon magenta `#ff4fd8` +
  cyan `#4fd8ff` accents, arcade-style display font (Google font added to
  `app/fonts.ts`, e.g. "Press Start 2P" used sparingly for headings; body
  stays Space Grotesk), glowing cabinet cards for the three games. No
  scanlines (Operator Console owns that motif).
- Nav: brand, SwitchPill back to `/`, links to each game.
- Cabinet cards: ⚾ Baseball (`/games/baseball`), 🚢 Battleship
  (`/games/battleship`), 🔢 Sudoku (`/games/sudoku`) — each with a mode
  line (`vs computer · online room` / `solo · daily puzzle`).

### Game 1 — Baseball (`/games/baseball`)
Rules (user-specified; classic Bulls & Cows):
- Each player sets a secret 3-digit code, digits 0–9, **all distinct**
  (position matters). Turns alternate; each turn a player guesses the
  opponent's 3 digits.
- Scoring per guess: digit correct + position correct = **Strike**; digit
  present + wrong position = **Ball**; no guessed digit present = **Out**.
  Result reported as counts (order-independent), e.g. secret 357: guess
  735 → 3 Balls; 153 → 1 Strike 1 Ball; 210 → Out. First to 3 Strikes wins.
- Modes:
  - **vs Computer**: 3 difficulties — Easy (random consistent guesses),
    Normal (eliminates candidates inconsistent with feedback), Hard
    (minimax-style candidate reduction over the 720 permutations).
    Computer's secret generated & scored client-side.
  - **Online room**: create → 5-char room code + invite link
    (`/games/baseball?room=ABC12`); both players submit secrets; turns
    alternate; server computes all feedback (server-authoritative — the
    opponent's secret never reaches the client until game end reveal).
- UI: digit pad entry, guess history table per side (guess → S/B/Out),
  turn indicator, rematch button, "copy invite link" with copied state.

### Game 2 — Battleship (`/games/battleship`)
- 10×10 grid; fleet: Carrier 5, Battleship 4, Cruiser 3, Submarine 3,
  Destroyer 2. Placement: drag-free tap/click + rotate button + random
  placement; no adjacent-cell restriction (classic Hasbro rules).
- Turns: one shot per turn; feedback hit/miss/sunk (announce ship on sink).
  Win = all opponent ships sunk.
- Modes: vs Computer (hunt/target AI: random parity hunt → target mode with
  direction lock after 2nd hit); Online room (same room flow as Baseball;
  server stores both boards, adjudicates shots; opponent board cells only
  revealed as shot).
- UI: dual boards (yours + tracking), mobile-first tap targets, sunk-ship
  tray, turn indicator, rematch.

### Game 3 — Sudoku (`/games/sudoku`)
- Solo. Generator with unique-solution guarantee (backtracking generator +
  digger, difficulty by clue count/technique: Easy ~40 clues, Medium ~32,
  Hard ~26). Client-side only.
- Features: pencil marks, mistake highlighting (toggle), timer,
  keyboard + tap input, undo, new game per difficulty.
- **Daily Puzzle**: seeded by UTC date (deterministic PRNG) — same board for
  every visitor each day; completion screen with time + a copyable share
  snippet (`Sudoku #N — 07:42 — johnkryu.vercel.app/games/sudoku` style).
  Local best-times in localStorage.

### Multiplayer backend (`app/api/games/`)
- Storage: Upstash Redis (same env vars as `/api/votes`:
  `UPSTASH_REDIS_REST_URL/TOKEN` or `KV_REST_API_*`). Key
  `game:<type>:<roomId>` → JSON state; `EX` TTL 24h, refreshed on writes.
- Anonymous identity: on room create/join the server issues a
  `playerToken` (uuid) returned once and kept in localStorage; all
  subsequent moves carry it; server maps token → seat.
- Endpoints (route handlers, `runtime nodejs`, trailing-slash fetches):
  - `POST /api/games/room` `{ type: "baseball"|"battleship" }` →
    `{ roomId, playerToken, seat: 1 }`
  - `POST /api/games/room/join` `{ type, roomId }` → `{ playerToken, seat: 2 }`
    (409 if full/started; 404 unknown/expired)
  - `POST /api/games/move` `{ type, roomId, playerToken, payload }` —
    payload per game (secret submission / guess / board placement / shot).
    Server validates turn order + move legality, computes feedback,
    advances state. Optimistic-concurrency via a `version` field
    (WATCH-free: single Redis `SET` of full state after read-check; last
    writer with stale version → 409 retry).
  - `GET /api/games/state?type=&roomId=&playerToken=` → player-scoped view
    (own secret/board + opponent's public info only). Clients poll ~1.5s
    while it's the opponent's turn; back off to 4s after 2 min idle.
- Unconfigured Redis → 503 `{ error: "not configured" }`; UI shows
  "Online play is warming up — try vs computer" and hides room controls.
- Abandonment: `lastMoveAt` timestamp; UI offers "claim win" after 3 min of
  opponent silence (server enforces the 3 min).
- Abuse: rooms capped (state size validated), room codes unambiguous
  alphabet (no 0/O/1/I), light per-IP create throttle (Redis INCR window).

## Shared / integration

- Fonts: add the arcade display font to `app/fonts.ts` (variable
  `--font-arcade`).
- `content.ts`: `arcade` card metadata (outside `concepts` poll array) +
  export type. Gateway renders concept cards then the Arcade card.
- All new pages: mobile responsive from day one (360/390/768 no-overflow
  rule), reduced-motion respected (neon pulse/glow animations disabled),
  the two CSS rules honored (compound `a.className`; RM block last).
- Games are client components + small pure-logic modules
  (`app/games/lib/*.ts`) — scoring, generators, AIs unit-testable by
  design; verification via Playwright flows (no test runner in repo).
- CLAUDE.md updated with routes, `/api/games/*`, and Upstash prerequisite.

## Error handling

- Room 404/expired → friendly screen with "create new room".
- Version conflict on move → transparent refetch + retry once.
- Redis down mid-game → banner "connection hiccup — retrying", polling
  continues; moves fail loudly (no silent loss).
- Sudoku generator worst-case: time-boxed; regenerate on rare failure.

## Verification

- `tsc`/lint/build clean.
- Playwright: Baseball vs computer full game (win path, feedback math
  spot-checked against the user's examples: 357 vs 735=3B, 153=1S1B,
  210=Out); Battleship vs computer to a sunk ship; Sudoku daily puzzle
  determinism (same seed same board) + entry/pencil/mistake flows; online
  Baseball AND Battleship end-to-end with two browser contexts (create,
  invite-link join, secrets/placement, turns, win, rematch) against local
  dev with Upstash env vars if available, else against a Redis mock module
  in dev — final online verification on the production deployment.
- Mobile pass per new route; reduced-motion pass.

## Out of scope (this release)

- Accounts, leaderboards, spectating, chat, matchmaking (random opponent),
  Sudoku multiplayer/race mode, Battleship per-ship special abilities,
  push/email notifications, og-image generation for invite links.

---

# v2 Refinements (2026-07-17, user-requested)

## R1. Baseball wording
All scoring UI spells out terms: chips/history read "STRIKE"/"BALL"/"OUT" (e.g. "2 Strikes · 1 Ball"), never bare S/B/O.

## R2. How-to-play on all games
Each game page gets a "How to play" button opening an arcade-styled rules overlay, auto-opened on first visit (localStorage `jkr_howto_<game>`), dismissible. Content: full rules with a worked example (Baseball uses the 357 truth-table example). Pattern implemented per-game (consistent UX, per-module styling like arcade tokens).

## R3. Battleship revamp
- Placement is DRAG & DROP: ship tray with to-scale draggable pieces → snap to grid; click/tap placed ship or R rotates; re-drag moves; invalid drop bounces with shake; pointer-events for touch. Random/Clear remain.
- Difficulties (chosen at room create; invite carries it; server validates fleets):
  - Easy — Classic: both players identical standard fleet (5/4/3/3/2). (vs-computer default)
  - Medium — Fleet Builder: secret fleet from catalog under 17-cell budget, min 3 / max 7 ships. Catalog: Sub 1, Patrol 2, Frigate 3, Cruiser 3, Battleship 4, Carrier 5, Leviathan 6. Opponent's total cells known; composition hidden.
  - Hard — Fog of War: Fleet Builder rules + opponent's remaining-ship tray hidden and sunk announcements anonymized ("sunk a ship", no name).
- Server: room create accepts options { difficulty }; reducer init parameterized; fleet validation per difficulty; viewFor respects fog rules. vs-computer supports all three (AI builds a legal random fleet).

## R4. Sudoku leaderboard (Upstash-persisted; no new database)
- Boards: Daily (per-day ZSET, ~35-day TTL) + All-time top-100 per difficulty.
- Entry on completion: name (≤20 chars, sanitized). Identity for dedupe: salted SHA-256 of client IP (raw IP never stored). Opt-out path: visitor declines IP tracking → provides city/state/zip (≤40 chars) and identity = hash(name+location).
- One entry per identity per board; better time updates it (ZADD LT). Server sanity-checks times (reject implausibly fast/slow). Display top 10 (daily) / top 25 displayed, top 100 stored (all-time) + "your rank".
- API: app/api/sudoku/leaderboard/ GET (scope=daily|alltime) / POST (submit). 503 degradation like other Redis routes.

## R5. Invite-a-friend sharing (online rooms)
Shared component `app/games/lib/InviteShare.tsx` (props: url, gameName, buttonClassName, primaryButtonClassName?) renders: native Web Share button (mobile OS share sheet — messaging/email/etc.; only when navigator.share exists), prefilled Email (mailto:) and Text (sms:) fallbacks, and Copy-link with copied state. Both Baseball and Battleship waiting-room screens replace/augment their copy-link button with this row. Message: "Play me in <game> on The Arcade! Join my room: <url>".
