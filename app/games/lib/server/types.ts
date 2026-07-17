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
  init(): G;
  applyMove(g: G, seat: Seat, payload: M): { next: G; error?: string };
  /** Player-scoped public view — must hide information the given seat
   * should not see (e.g. opponent's secret before the game ends). */
  viewFor(g: G, seat: Seat): unknown;
};
