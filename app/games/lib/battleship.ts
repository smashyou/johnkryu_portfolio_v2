// Shared pure Battleship rules module — imported by BOTH the server reducer
// (app/games/lib/server/battleshipGame.ts) and the client (vs-computer AI +
// UI). Keep this dependency-free so it works in both environments.

export const BOARD_SIZE = 10;

export const FLEET: { name: string; size: number }[] = [
  { name: "Carrier", size: 5 },
  { name: "Battleship", size: 4 },
  { name: "Cruiser", size: 3 },
  { name: "Submarine", size: 3 },
  { name: "Destroyer", size: 2 },
];

export type Placement = { name: string; row: number; col: number; horizontal: boolean };

export type ShotResult = { result: "hit" | "miss"; sunk: string | null; allSunk: boolean };

/** "r,c" key for a board cell — the canonical cell identifier used everywhere
 * (shot lists, occupied sets, wire payloads). */
export function cellKey(row: number, col: number): string {
  return `${row},${col}`;
}

export function parseCellKey(cell: string): [number, number] {
  const [r, c] = cell.split(",").map(Number);
  return [r, c];
}

function shipSize(name: string): number | null {
  const ship = FLEET.find((f) => f.name === name);
  return ship ? ship.size : null;
}

/** All cells a placement occupies, given its declared ship size. Does not
 * validate bounds — callers that need in-bounds guarantees (validatePlacement)
 * check that separately. */
export function cellsForPlacement(placement: Placement): string[] {
  const size = shipSize(placement.name) ?? 0;
  const cells: string[] = [];
  for (let i = 0; i < size; i++) {
    const row = placement.horizontal ? placement.row : placement.row + i;
    const col = placement.horizontal ? placement.col + i : placement.col;
    cells.push(cellKey(row, col));
  }
  return cells;
}

/**
 * Full-fleet validation: exactly one placement per FLEET ship, each in
 * bounds, and no overlapping cells between ships (touching is allowed —
 * classic Hasbro rules, no adjacency restriction).
 *
 * Accepts `unknown`-shaped input defensively (the type signature says
 * `Placement[]` per the shared interface, but callers on the server side
 * are deserializing untrusted JSON cast to this type, so runtime shape
 * checks still matter — this function must never throw).
 */
export function validatePlacement(placements: Placement[]): boolean {
  if (!Array.isArray(placements)) return false;
  if (placements.length !== FLEET.length) return false;

  const seenNames = new Set<string>();
  const occupied = new Set<string>();

  for (const raw of placements) {
    const p = raw as Partial<Placement> | null;
    if (
      typeof p !== "object" ||
      p === null ||
      typeof p.name !== "string" ||
      typeof p.row !== "number" ||
      typeof p.col !== "number" ||
      typeof p.horizontal !== "boolean" ||
      !Number.isInteger(p.row) ||
      !Number.isInteger(p.col)
    ) {
      return false;
    }

    const size = shipSize(p.name);
    if (size === null) return false;
    if (seenNames.has(p.name)) return false;
    seenNames.add(p.name);

    const placement: Placement = { name: p.name, row: p.row, col: p.col, horizontal: p.horizontal };
    const cells = cellsForPlacement(placement);
    for (const cell of cells) {
      const [r, c] = parseCellKey(cell);
      if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) return false;
    }
    for (const cell of cells) {
      if (occupied.has(cell)) return false;
      occupied.add(cell);
    }
  }

  return seenNames.size === FLEET.length;
}

/**
 * Fire `cell` at `board` (the defending fleet's placements), given the
 * shooter's prior shot cells against this board (`shots`, NOT including
 * `cell` itself). Pure — never mutates its inputs.
 */
export function shoot(board: Placement[], shots: string[], cell: string): ShotResult {
  const allShots = [...shots, cell];

  let hitShip: Placement | null = null;
  for (const ship of board) {
    if (cellsForPlacement(ship).includes(cell)) {
      hitShip = ship;
      break;
    }
  }

  if (!hitShip) {
    return { result: "miss", sunk: null, allSunk: false };
  }

  const shipCells = cellsForPlacement(hitShip);
  const sunk = shipCells.every((c) => allShots.includes(c));
  const allSunk = board.every((ship) => cellsForPlacement(ship).every((c) => allShots.includes(c)));

  return { result: "hit", sunk: sunk ? hitShip.name : null, allSunk };
}
