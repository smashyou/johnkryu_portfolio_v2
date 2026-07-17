// Shared server-side types for the games multiplayer backend.
// Later tasks (5-7) depend on these signatures exactly — do not change
// shapes without checking downstream usage in the client hook / game UIs.

export type GameType = "baseball" | "battleship";

export type Seat = 1 | 2;

/**
 * Full room state as persisted in Redis under `game:<type>:<roomId>`.
 * `game` is the game-specific reducer state (e.g. BaseballGame).
 */
export type RoomState<G> = {
  version: number;
  type: GameType;
  roomId: string;
  createdAt: number;
  lastMoveAt: number;
  /** tokens[0] = seat 1's playerToken, tokens[1] = seat 2's playerToken or null until joined */
  tokens: [string, string | null];
  game: G;
};

/**
 * Pure game reducer contract implemented per game type. Reducers must be
 * pure and MUST NOT throw — invalid moves are reported via `error` on the
 * returned object, leaving `next` unchanged (or a copy of `g`).
 */
export type GameReducer<G, M> = {
  /**
   * `options` is additive (game-specific, e.g. battleship's
   * `{ difficulty: "easy" | "medium" | "hard" }`) and optional — reducers
   * that don't need init-time configuration (baseball) simply ignore it.
   */
  init(options?: unknown): G;
  applyMove(g: G, seat: Seat, payload: M): { next: G; error?: string };
  /** Player-scoped public view — must hide information the given seat
   * should not see (e.g. opponent's secret before the game ends). */
  viewFor(g: G, seat: Seat): unknown;
  /**
   * Optional shape guard for the raw `unknown` payload coming off the wire.
   * When present, rooms.ts calls this BEFORE invoking applyMove and rejects
   * a false result with 400 `{ error: "bad move" }` — this is what keeps a
   * missing/malformed move payload (e.g. `payload.kind` on `undefined`)
   * from ever reaching the reducer and throwing an unhandled 500.
   */
  validateMove?(payload: unknown): payload is M;
};
