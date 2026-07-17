// Pure, dependency-free Sudoku engine shared by the client game and any
// verification scripts. No DOM/React/localStorage access here — keep it
// deterministic and side-effect-free so `generate(difficulty, rng)` always
// produces the same board for the same seed.

export type Difficulty = "easy" | "medium" | "hard";

/** Target clue (given) counts per difficulty, per the arcade design spec. */
export const CLUE_TARGETS: Record<Difficulty, number> = {
  easy: 40,
  medium: 32,
  hard: 26,
};

/**
 * Deterministic PRNG (mulberry32). Same seed → same sequence of floats
 * in [0, 1), forever, across platforms — required for the daily puzzle
 * to render identically for every visitor and across reloads.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates shuffle driven by the supplied rng (does not mutate input). */
function shuffled<T>(items: readonly T[], rng: () => number): T[] {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** True iff placing `val` at `idx` (0-80) breaks no row/col/box rule. */
export function isValidPlacement(grid: readonly number[], idx: number, val: number): boolean {
  const row = Math.floor(idx / 9);
  const col = idx % 9;

  for (let c = 0; c < 9; c++) {
    const i = row * 9 + c;
    if (i !== idx && grid[i] === val) return false;
  }
  for (let r = 0; r < 9; r++) {
    const i = r * 9 + col;
    if (i !== idx && grid[i] === val) return false;
  }
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      const i = r * 9 + c;
      if (i !== idx && grid[i] === val) return false;
    }
  }
  return true;
}

/** Backtracking full-grid fill with rng-shuffled candidate order per cell. */
function fillGrid(rng: () => number): number[] {
  const grid = new Array<number>(81).fill(0);
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  function solve(pos: number): boolean {
    if (pos === 81) return true;
    for (const val of shuffled(digits, rng)) {
      if (isValidPlacement(grid, pos, val)) {
        grid[pos] = val;
        if (solve(pos + 1)) return true;
        grid[pos] = 0;
      }
    }
    return false;
  }

  solve(0);
  return grid;
}

/** Index (0-80) of the empty cell with fewest legal candidates, or -1 if full. */
function pickMostConstrained(grid: readonly number[]): number {
  let best = -1;
  let bestCount = 10;
  for (let i = 0; i < 81; i++) {
    if (grid[i] !== 0) continue;
    let count = 0;
    for (let v = 1; v <= 9; v++) {
      if (isValidPlacement(grid, i, v)) count++;
    }
    if (count < bestCount) {
      bestCount = count;
      best = i;
      if (count === 0) return i;
    }
  }
  return best;
}

/**
 * Counts solutions to `grid` up to `cap` (then stops early — we only ever
 * need to distinguish 0/1/2+ solutions, never the exact count for large
 * boards, so capping keeps digging fast).
 */
export function countSolutions(grid: readonly number[], cap: number): number {
  const g = grid.slice();
  let count = 0;

  function solve(): boolean {
    const idx = pickMostConstrained(g);
    if (idx === -1) {
      count++;
      return count >= cap;
    }
    for (let v = 1; v <= 9; v++) {
      if (isValidPlacement(g, idx, v)) {
        g[idx] = v;
        if (solve()) return true;
        g[idx] = 0;
      }
    }
    return false;
  }

  solve();
  return count;
}

/** Removes cells from a full `solution` while keeping the solution unique. */
function digHoles(solution: readonly number[], rng: () => number, targetClues: number): number[] {
  const puzzle = solution.slice();
  const order = shuffled(
    Array.from({ length: 81 }, (_, i) => i),
    rng
  );
  let clues = 81;

  for (const idx of order) {
    if (clues <= targetClues) break;
    if (puzzle[idx] === 0) continue;

    const backup = puzzle[idx];
    puzzle[idx] = 0;
    // cap=2: as soon as a second solution is found, digging this cell is
    // rejected — this is what guarantees the final puzzle has exactly one
    // solution without paying for a full solution count.
    if (countSolutions(puzzle, 2) === 1) {
      clues--;
    } else {
      puzzle[idx] = backup;
    }
  }

  return puzzle;
}

/**
 * Generates a puzzle/solution pair for `difficulty` using `rng`.
 * `puzzle` is an 81-length array (row-major, 0 = empty cell) guaranteed to
 * have exactly one solution; `solution` is the fully solved 81-length grid.
 * Retries with a fresh fill on the rare occasion digging stalls badly.
 */
export function generate(
  difficulty: Difficulty,
  rng: () => number
): { puzzle: number[]; solution: number[] } {
  const target = CLUE_TARGETS[difficulty];
  const maxAttempts = 5;
  let last: { puzzle: number[]; solution: number[] } | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const solution = fillGrid(rng);
    const puzzle = digHoles(solution, rng, target);
    last = { puzzle, solution };
    if (countSolutions(puzzle, 2) === 1) {
      return last;
    }
  }

  // Should be unreachable in practice, but never throw from a pure fn —
  // return the last attempt even if digging under-shot the clue target.
  return last as { puzzle: number[]; solution: number[] };
}

/** YYYYMMDD integer seed for the UTC calendar date of `dateUtc`. */
export function dailySeed(dateUtc: Date): number {
  const y = dateUtc.getUTCFullYear();
  const m = dateUtc.getUTCMonth() + 1;
  const d = dateUtc.getUTCDate();
  return y * 10000 + m * 100 + d;
}

/** Daily puzzle number #N, where day 1 is 2026-07-17 (UTC). */
export function dailyNumber(dateUtc: Date): number {
  const epoch = Date.UTC(2026, 6, 17);
  const current = Date.UTC(
    dateUtc.getUTCFullYear(),
    dateUtc.getUTCMonth(),
    dateUtc.getUTCDate()
  );
  const diffDays = Math.round((current - epoch) / 86400000);
  return diffDays + 1;
}

/** True iff every cell is filled (does not check correctness). */
export function isBoardFull(board: readonly number[]): boolean {
  return board.every((v) => v !== 0);
}

/** True iff `board` filled and matches `solution` cell-for-cell. */
export function isBoardSolved(board: readonly number[], solution: readonly number[]): boolean {
  return isBoardFull(board) && board.every((v, i) => v === solution[i]);
}
