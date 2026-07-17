// Pure vs-computer AI for Battleship — random placement + a hunt/target
// shooter. No dependency on React or the server; `rng` is injected so both
// the client (Math.random) and verification scripts (seeded PRNG) can drive
// it deterministically.

import { BOARD_SIZE, FLEET, cellKey, cellsForPlacement, parseCellKey, type Placement } from "./battleship";

function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

/** Random full-fleet placement respecting classic Hasbro rules (in bounds,
 * no overlap, ships may touch). Retries per-ship until a non-overlapping
 * spot is found; 10x10 with only 17 total ship cells makes exhaustion
 * practically impossible within the attempt budget. */
export function randomPlacement(rng: () => number): Placement[] {
  const placements: Placement[] = [];
  const occupied = new Set<string>();

  for (const ship of FLEET) {
    let attempts = 0;
    while (attempts < 2000) {
      attempts++;
      const horizontal = rng() < 0.5;
      const row = Math.floor(rng() * BOARD_SIZE);
      const col = Math.floor(rng() * BOARD_SIZE);
      if (horizontal && col + ship.size > BOARD_SIZE) continue;
      if (!horizontal && row + ship.size > BOARD_SIZE) continue;

      const candidate: Placement = { name: ship.name, row, col, horizontal };
      const cells = cellsForPlacement(candidate);
      if (cells.some((c) => occupied.has(c))) continue;

      cells.forEach((c) => occupied.add(c));
      placements.push(candidate);
      break;
    }
  }

  return placements;
}

/**
 * Pick the AI's next shot cell.
 *
 * - `shots`: every cell the AI has already fired (hit or miss) against the
 *   opponent's board — never re-fired.
 * - `hits`: cells that are confirmed hits but belong to a ship NOT YET
 *   announced sunk (the caller is expected to drop a ship's hit cells from
 *   this list once its sinking is confirmed, since a sunk ship needs no
 *   further targeting).
 *
 * Mode selection:
 *  - 0 active hits  -> hunt mode: parity ("checkerboard") search, since the
 *    smallest ship is 2 cells long, every ship must occupy at least one
 *    parity cell.
 *  - 1 active hit    -> target mode: try the four orthogonal neighbors.
 *  - 2+ active hits  -> direction lock: if the active hits are collinear,
 *    extend along that line from both open ends; falls back to plain
 *    neighbor search if the line is exhausted (e.g. both ends already shot).
 */
export function nextShot(shots: string[], hits: string[], rng: () => number): string {
  const shotSet = new Set(shots);
  let candidates: string[] = [];

  if (hits.length >= 2) {
    const parsed = hits.map(parseCellKey);
    const sameRow = parsed.every((p) => p[0] === parsed[0][0]);
    const sameCol = parsed.every((p) => p[1] === parsed[0][1]);

    if (sameRow) {
      const row = parsed[0][0];
      const cols = parsed.map((p) => p[1]);
      const minCol = Math.min(...cols);
      const maxCol = Math.max(...cols);
      if (inBounds(row, minCol - 1) && !shotSet.has(cellKey(row, minCol - 1))) {
        candidates.push(cellKey(row, minCol - 1));
      }
      if (inBounds(row, maxCol + 1) && !shotSet.has(cellKey(row, maxCol + 1))) {
        candidates.push(cellKey(row, maxCol + 1));
      }
    } else if (sameCol) {
      const col = parsed[0][1];
      const rows = parsed.map((p) => p[0]);
      const minRow = Math.min(...rows);
      const maxRow = Math.max(...rows);
      if (inBounds(minRow - 1, col) && !shotSet.has(cellKey(minRow - 1, col))) {
        candidates.push(cellKey(minRow - 1, col));
      }
      if (inBounds(maxRow + 1, col) && !shotSet.has(cellKey(maxRow + 1, col))) {
        candidates.push(cellKey(maxRow + 1, col));
      }
    }
  }

  if (candidates.length === 0 && hits.length > 0) {
    // Single active hit, or the locked line is exhausted — fall back to
    // orthogonal neighbors of any active hit.
    const found = new Set<string>();
    for (const hit of hits) {
      const [r, c] = parseCellKey(hit);
      const neighbors: [number, number][] = [
        [r - 1, c],
        [r + 1, c],
        [r, c - 1],
        [r, c + 1],
      ];
      for (const [nr, nc] of neighbors) {
        if (!inBounds(nr, nc)) continue;
        const key = cellKey(nr, nc);
        if (!shotSet.has(key)) found.add(key);
      }
    }
    candidates = [...found];
  }

  if (candidates.length === 0) {
    // Hunt mode: parity checkerboard.
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if ((r + c) % 2 === 0) {
          const key = cellKey(r, c);
          if (!shotSet.has(key)) candidates.push(key);
        }
      }
    }
  }

  if (candidates.length === 0) {
    // Parity cells exhausted (late game) — any remaining unshot cell.
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const key = cellKey(r, c);
        if (!shotSet.has(key)) candidates.push(key);
      }
    }
  }

  if (candidates.length === 0) {
    // Board fully shot — should be unreachable (game ends before this),
    // but never throw: return a stable fallback cell.
    return shots[0] ?? cellKey(0, 0);
  }

  return candidates[Math.floor(rng() * candidates.length)];
}
