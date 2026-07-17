import { isValidCode, scoreGuess } from "@/app/games/lib/baseball";
import type { GameReducer, Seat } from "./types";

export type BaseballGuess = {
  seat: Seat;
  guess: string;
  strikes: number;
  balls: number;
  out: boolean;
};

export type BaseballGame = {
  phase: "setup" | "playing" | "done";
  secrets: [string | null, string | null];
  turn: Seat;
  guesses: BaseballGuess[];
  winner: Seat | null;
};

/**
 * `claimWin` carries `now`/`lastMoveAt` so the reducer stays pure (no
 * internal Date.now() call) while still being able to enforce the 3-minute
 * abandonment rule. `rooms.ts` is responsible for populating these from the
 * authoritative server clock and RoomState.lastMoveAt before invoking the
 * reducer; test scripts may supply their own values directly to exercise a
 * fake clock.
 */
export type BaseballMove =
  | { kind: "secret"; value: string }
  | { kind: "guess"; value: string }
  | { kind: "rematch" }
  | { kind: "claimWin"; now: number; lastMoveAt: number };

export type BaseballView = {
  phase: BaseballGame["phase"];
  turn: Seat;
  mySecretSet: boolean;
  opponentSecretSet: boolean;
  guesses: BaseballGuess[];
  winner: Seat | null;
  /** Only populated once phase === "done". */
  opponentSecret: string | null;
};

const CLAIM_WIN_IDLE_MS = 180000;

function opponentOf(seat: Seat): Seat {
  return seat === 1 ? 2 : 1;
}

export function isBaseballMove(value: unknown): value is BaseballMove {
  if (typeof value !== "object" || value === null || !("kind" in value)) return false;
  const kind = (value as { kind: unknown }).kind;
  return kind === "secret" || kind === "guess" || kind === "rematch" || kind === "claimWin";
}

function init(): BaseballGame {
  return {
    phase: "setup",
    secrets: [null, null],
    turn: 1,
    guesses: [],
    winner: null,
  };
}

function applyMove(
  g: BaseballGame,
  seat: Seat,
  payload: BaseballMove
): { next: BaseballGame; error?: string } {
  switch (payload.kind) {
    case "secret": {
      if (g.phase !== "setup") return { next: g, error: "not in setup phase" };
      if (!isValidCode(payload.value)) {
        return { next: g, error: "secret must be 3 distinct digits 0-9" };
      }
      const secrets: [string | null, string | null] = [...g.secrets];
      secrets[seat - 1] = payload.value;
      const bothSet = secrets[0] !== null && secrets[1] !== null;
      return {
        next: {
          ...g,
          secrets,
          phase: bothSet ? "playing" : "setup",
        },
      };
    }
    case "guess": {
      if (g.phase !== "playing") return { next: g, error: "game not in progress" };
      if (g.turn !== seat) return { next: g, error: "not your turn" };
      if (!isValidCode(payload.value)) {
        return { next: g, error: "guess must be 3 distinct digits 0-9" };
      }
      const opponent = opponentOf(seat);
      const opponentSecret = g.secrets[opponent - 1];
      if (!opponentSecret) return { next: g, error: "opponent secret not set" };

      const { strikes, balls, out } = scoreGuess(opponentSecret, payload.value);
      const guesses = [...g.guesses, { seat, guess: payload.value, strikes, balls, out }];
      const won = strikes === 3;
      return {
        next: {
          ...g,
          guesses,
          turn: won ? g.turn : opponent,
          phase: won ? "done" : "playing",
          winner: won ? seat : null,
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
      return { next: init() };
    }
    default:
      return { next: g, error: "unknown move" };
  }
}

function viewFor(g: BaseballGame, seat: Seat): BaseballView {
  const opponent = opponentOf(seat);
  return {
    phase: g.phase,
    turn: g.turn,
    mySecretSet: g.secrets[seat - 1] !== null,
    opponentSecretSet: g.secrets[opponent - 1] !== null,
    guesses: g.guesses,
    winner: g.winner,
    opponentSecret: g.phase === "done" ? g.secrets[opponent - 1] : null,
  };
}

export const baseballGame: GameReducer<BaseballGame, BaseballMove> = {
  init,
  applyMove,
  viewFor: (g, seat) => viewFor(g, seat),
};
