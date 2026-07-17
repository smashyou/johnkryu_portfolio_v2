// Pure vs-computer AI for the Baseball (Bulls & Cows) game — no dependency
// on React/DOM so it can run in a plain Node script for verification. Uses
// the shared `scoreGuess` so the AI's notion of feedback is identical to the
// server reducer's (app/games/lib/server/baseballGame.ts).

import { scoreGuess } from "./baseball";

export type Difficulty = "easy" | "normal" | "hard";

/** How many candidate guesses `nextGuess("hard", ...)` evaluates per turn.
 * Bounds the O(sample * candidates) minimax scan for perf — candidates can
 * be as large as 720 on the AI's first guess. */
const HARD_SAMPLE_CAP = 60;

/** All 720 three-digit codes with distinct digits 0-9, position matters. */
export function allCodes(): string[] {
  const codes: string[] = [];
  for (let a = 0; a <= 9; a++) {
    for (let b = 0; b <= 9; b++) {
      if (b === a) continue;
      for (let c = 0; c <= 9; c++) {
        if (c === a || c === b) continue;
        codes.push(`${a}${b}${c}`);
      }
    }
  }
  return codes;
}

/**
 * Narrow `cands` to only those codes that would have produced `result`
 * (strikes/balls) if they were the secret and `guess` was played against
 * them. This is the standard Bulls & Cows elimination step.
 */
export function filterCandidates(
  cands: string[],
  guess: string,
  result: { strikes: number; balls: number }
): string[] {
  return cands.filter((candidate) => {
    const scored = scoreGuess(candidate, guess);
    return scored.strikes === result.strikes && scored.balls === result.balls;
  });
}

function randomElement<T>(arr: readonly T[], rng: () => number): T {
  const index = Math.min(arr.length - 1, Math.floor(rng() * arr.length));
  return arr[index];
}

/** Partial Fisher-Yates: returns up to `cap` elements sampled from `arr`
 * without replacement, using `rng` for shuffling. */
function sampleWithoutReplacement<T>(arr: readonly T[], cap: number, rng: () => number): T[] {
  if (arr.length <= cap) return arr.slice();
  const copy = arr.slice();
  const take = Math.min(cap, copy.length);
  for (let i = 0; i < take; i++) {
    const j = i + Math.floor(rng() * (copy.length - i));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, take);
}

/**
 * Minimax-style pick: for each candidate guess (sample-capped), partition
 * the remaining candidate secrets by the (strikes,balls) bucket a real
 * secret in that bucket would produce, then choose the guess whose worst
 * (largest) bucket is smallest — the classic Knuth "minimize the maximum
 * remaining candidate set" heuristic, restricted to guessing from the
 * candidate pool itself (keeps every guess consistent with the feedback
 * seen so far, matching the "hard" difficulty contract).
 */
function pickHardGuess(cands: string[], rng: () => number): string {
  if (cands.length <= 2) return cands[0];

  const guessPool = sampleWithoutReplacement(cands, HARD_SAMPLE_CAP, rng);
  let best = guessPool[0];
  let bestWorstCase = Infinity;

  for (const guess of guessPool) {
    const buckets = new Map<string, number>();
    for (const candidate of cands) {
      const { strikes, balls } = scoreGuess(candidate, guess);
      const key = `${strikes}-${balls}`;
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
    let worstCase = 0;
    for (const count of buckets.values()) {
      if (count > worstCase) worstCase = count;
    }
    // Tie-break randomly so repeated games against the same candidate set
    // don't always pick the same guess.
    if (worstCase < bestWorstCase || (worstCase === bestWorstCase && rng() < 0.5)) {
      bestWorstCase = worstCase;
      best = guess;
    }
  }

  return best;
}

/**
 * Pick the AI's next guess.
 * - easy: a random valid code (any of the 720 — not narrowed by feedback).
 * - normal: a random candidate still consistent with all feedback so far.
 * - hard: candidate-minimizing pick over the consistent candidate pool
 *   (sample-capped — see HARD_SAMPLE_CAP).
 *
 * `cands` should be the caller-maintained pool of codes still consistent
 * with every (guess, result) pair seen so far (start at `allCodes()`,
 * narrow each turn via `filterCandidates`). `easy` ignores `cands` and
 * draws from the full code space instead, matching the "no elimination"
 * behavior of that difficulty.
 */
export function nextGuess(cands: string[], difficulty: Difficulty, rng: () => number = Math.random): string {
  if (difficulty === "easy") {
    return randomElement(allCodes(), rng);
  }
  const pool = cands.length > 0 ? cands : allCodes();
  if (difficulty === "normal") {
    return randomElement(pool, rng);
  }
  return pickHardGuess(pool, rng);
}
