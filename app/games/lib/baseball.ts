// Shared pure scoring module — imported by BOTH the server reducer
// (app/games/lib/server/baseballGame.ts) and the client vs-computer AI
// (Task 6). Keep this dependency-free so it works in both environments.

export type ScoreResult = { strikes: number; balls: number; out: boolean };

/**
 * Classic Bulls & Cows scoring for the Baseball game.
 * secret/guess are 3-character strings of distinct digits 0-9.
 *
 * Truth table (spec): secret 357 →
 *   guess 735 → 3 balls
 *   guess 153 → 1 strike, 1 ball
 *   guess 210 → out (0 strikes, 0 balls)
 */
export function scoreGuess(secret: string, guess: string): ScoreResult {
  let strikes = 0,
    balls = 0;
  for (let i = 0; i < 3; i++) {
    if (guess[i] === secret[i]) strikes++;
    else if (secret.includes(guess[i])) balls++;
  }
  return { strikes, balls, out: strikes === 0 && balls === 0 };
}

/** True iff `value` is exactly 3 characters, each a digit 0-9, all distinct. */
export function isValidCode(value: unknown): value is string {
  if (typeof value !== "string" || value.length !== 3) return false;
  if (!/^[0-9]{3}$/.test(value)) return false;
  return new Set(value).size === 3;
}
