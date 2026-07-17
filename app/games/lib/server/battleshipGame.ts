import { shoot, validatePlacement, type Difficulty, type Placement } from "@/app/games/lib/battleship";
import type { GameReducer, Seat } from "./types";

export type ShotRecord = { cell: string; result: "hit" | "miss"; sunk: string | null };

export type BattleshipGame = {
  phase: "setup" | "playing" | "done";
  difficulty: Difficulty;
  /** boards[i] = seat (i+1)'s own fleet placements, set once during setup. */
  boards: [Placement[] | null, Placement[] | null];
  /** shotHistory[i] = every shot seat (i+1) has FIRED, in order, with result. */
  shotHistory: [ShotRecord[], ShotRecord[]];
  turn: Seat;
  winner: Seat | null;
};

/**
 * `claimWin` carries `now`/`lastMoveAt` so the reducer stays pure (no
 * internal Date.now() call) — mirrors baseballGame.ts's claimWin exactly.
 * rooms.ts populates these from the authoritative server clock and
 * RoomState.lastMoveAt before invoking the reducer.
 */
export type BattleshipMove =
  | { kind: "placement"; placements: Placement[] }
  | { kind: "shot"; cell: string }
  | { kind: "rematch" }
  | { kind: "claimWin"; now: number; lastMoveAt: number };

export type BattleshipView = {
  phase: BattleshipGame["phase"];
  difficulty: Difficulty;
  turn: Seat;
  myPlacementSet: boolean;
  opponentPlacementSet: boolean;
  /** Own fleet — always visible to the seat that placed it. */
  myBoard: Placement[] | null;
  /** Shots I've fired at the opponent, with results (hit/miss/sunk name).
   * On "hard" difficulty the sunk ship's real name is replaced with a
   * generic "ship" placeholder — Fog of War hides opponent fleet identity
   * even from the player who did the sinking. */
  myShots: ShotRecord[];
  /** Shots the opponent has fired at me, with results against MY board.
   * Never anonymized — it's my own fleet, I always know what I lost. */
  opponentShots: ShotRecord[];
  winner: Seat | null;
  /** Only populated once phase === "done" — the opponent's fleet reveal. */
  opponentBoard: Placement[] | null;
};

const CLAIM_WIN_IDLE_MS = 180000;
const CELL_PATTERN = /^[0-9],[0-9]$/;
const DIFFICULTIES: readonly Difficulty[] = ["easy", "medium", "hard"];

function opponentOf(seat: Seat): Seat {
  return seat === 1 ? 2 : 1;
}

function isDifficulty(value: unknown): value is Difficulty {
  return typeof value === "string" && (DIFFICULTIES as readonly string[]).includes(value);
}

export function isBattleshipMove(value: unknown): value is BattleshipMove {
  if (typeof value !== "object" || value === null || !("kind" in value)) return false;
  const kind = (value as { kind: unknown }).kind;
  if (kind === "rematch" || kind === "claimWin") return true;
  if (kind === "shot") return typeof (value as { cell?: unknown }).cell === "string";
  if (kind === "placement") return Array.isArray((value as { placements?: unknown }).placements);
  return false;
}

function init(options?: unknown): BattleshipGame {
  const requested = (options as { difficulty?: unknown } | undefined)?.difficulty;
  const difficulty: Difficulty = isDifficulty(requested) ? requested : "easy";
  return {
    phase: "setup",
    difficulty,
    boards: [null, null],
    shotHistory: [[], []],
    turn: 1,
    winner: null,
  };
}

function applyMove(
  g: BattleshipGame,
  seat: Seat,
  payload: BattleshipMove
): { next: BattleshipGame; error?: string } {
  switch (payload.kind) {
    case "placement": {
      if (g.phase !== "setup") return { next: g, error: "not in setup phase" };
      if (g.boards[seat - 1] !== null) return { next: g, error: "placement already submitted" };
      if (!validatePlacement(payload.placements, g.difficulty)) {
        return { next: g, error: "invalid fleet placement" };
      }
      const boards: [Placement[] | null, Placement[] | null] = [...g.boards];
      boards[seat - 1] = payload.placements;
      const bothSet = boards[0] !== null && boards[1] !== null;
      return {
        next: {
          ...g,
          boards,
          phase: bothSet ? "playing" : "setup",
        },
      };
    }
    case "shot": {
      if (g.phase !== "playing") return { next: g, error: "game not in progress" };
      if (g.turn !== seat) return { next: g, error: "not your turn" };
      if (!CELL_PATTERN.test(payload.cell)) return { next: g, error: "invalid cell" };

      const opponent = opponentOf(seat);
      const opponentBoard = g.boards[opponent - 1];
      if (!opponentBoard) return { next: g, error: "opponent board not set" };

      const myHistory = g.shotHistory[seat - 1];
      if (myHistory.some((r) => r.cell === payload.cell)) {
        return { next: g, error: "cell already shot" };
      }

      const priorCells = myHistory.map((r) => r.cell);
      const { result, sunk, allSunk } = shoot(opponentBoard, priorCells, payload.cell);

      const shotHistory: [ShotRecord[], ShotRecord[]] = [...g.shotHistory];
      shotHistory[seat - 1] = [...myHistory, { cell: payload.cell, result, sunk }];

      return {
        next: {
          ...g,
          shotHistory,
          turn: allSunk ? g.turn : opponent,
          phase: allSunk ? "done" : "playing",
          winner: allSunk ? seat : null,
        },
      };
    }
    case "claimWin": {
      if (g.phase !== "playing") return { next: g, error: "no game in progress" };
      if (g.turn === seat) return { next: g, error: "it is your turn — cannot claim win" };
      if (payload.now - payload.lastMoveAt <= CLAIM_WIN_IDLE_MS) {
        return { next: g, error: "opponent has not been idle long enough" };
      }
      return { next: { ...g, phase: "done", winner: seat } };
    }
    case "rematch": {
      if (g.phase !== "done") return { next: g, error: "game in progress" };
      return { next: init({ difficulty: g.difficulty }) };
    }
    default:
      return { next: g, error: "unknown move" };
  }
}

function viewFor(g: BattleshipGame, seat: Seat): BattleshipView {
  const opponent = opponentOf(seat);
  const myShots = g.shotHistory[seat - 1];
  // Fog of War (hard): the player who does the sinking never learns the
  // sunk ship's real name — only that "a ship" went down. Their own losses
  // (opponentShots, below) are NEVER anonymized: you always know what you
  // lost, regardless of difficulty.
  const visibleMyShots: ShotRecord[] =
    g.difficulty === "hard" ? myShots.map((s) => (s.sunk ? { ...s, sunk: "ship" } : s)) : myShots;

  return {
    phase: g.phase,
    difficulty: g.difficulty,
    turn: g.turn,
    myPlacementSet: g.boards[seat - 1] !== null,
    opponentPlacementSet: g.boards[opponent - 1] !== null,
    myBoard: g.boards[seat - 1],
    myShots: visibleMyShots,
    opponentShots: g.shotHistory[opponent - 1],
    winner: g.winner,
    opponentBoard: g.phase === "done" ? g.boards[opponent - 1] : null,
  };
}

export const battleshipGame: GameReducer<BattleshipGame, BattleshipMove> = {
  init,
  applyMove,
  viewFor: (g, seat) => viewFor(g, seat),
  validateMove: isBattleshipMove,
};
