import type { GameReducer, Seat } from "./types";

/**
 * Registry stub for Task 7. The real Battleship board state, move payloads
 * (placement / shot), and reducer logic land in that task. Until then this
 * reducer exists only so the `app/api/games/*` routes can register
 * "battleship" as a known GameType and respond with a clean 501 instead of
 * a lookup failure.
 */
export type BattleshipGame = Record<string, never>;

export type BattleshipMove = never;

function init(): BattleshipGame {
  return {};
}

function applyMove(
  g: BattleshipGame,
  _seat: Seat,
  _payload: BattleshipMove
): { next: BattleshipGame; error?: string } {
  return { next: g, error: "not implemented" };
}

function viewFor(g: BattleshipGame, _seat: Seat): unknown {
  return g;
}

// Nothing is a valid battleship move yet (Task 7 lands the real payloads) —
// always reject in rooms.ts before applyMove is even reached.
function validateMove(_payload: unknown): _payload is BattleshipMove {
  return false;
}

export const battleshipGame: GameReducer<BattleshipGame, BattleshipMove> = {
  init,
  applyMove,
  viewFor,
  validateMove,
};
