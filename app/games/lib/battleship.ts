// Shared pure Battleship rules module — imported by BOTH the server reducer
// (app/games/lib/server/battleshipGame.ts) and the client (vs-computer AI +
// UI). Keep this dependency-free so it works in both environments.

export const BOARD_SIZE = 10;

export type Difficulty = "easy" | "medium" | "hard";

export type FleetSpec = { name: string; size: number }[];

/** Classic Hasbro fleet — used exactly as-is for "Easy — Classic" and as the
 * default/back-compat fleet spec everywhere a caller doesn't pass one. */
export const FLEET: FleetSpec = [
  { name: "Carrier", size: 5 },
  { name: "Battleship", size: 4 },
  { name: "Cruiser", size: 3 },
  { name: "Submarine", size: 3 },
  { name: "Destroyer", size: 2 },
];

/** Fleet Builder catalog (Medium/Hard) — pick any combination under budget.
 * Duplicates of an entry are allowed; display names for the 2nd+ copy get a
 * numeric suffix ("Sub", "Sub 2", "Sub 3", ...). */
export const CATALOG: FleetSpec = [
  { name: "Sub", size: 1 },
  { name: "Patrol", size: 2 },
  { name: "Frigate", size: 3 },
  { name: "Cruiser", size: 3 },
  { name: "Battleship", size: 4 },
  { name: "Carrier", size: 5 },
  { name: "Leviathan", size: 6 },
];

export const FLEET_BUILDER_BUDGET = 17;
export const FLEET_BUILDER_MIN_SHIPS = 3;
export const FLEET_BUILDER_MAX_SHIPS = 7;

const CATALOG_SIZE_BY_NAME = new Map(CATALOG.map((c) => [c.name, c.size]));

/** Resolve a (possibly duplicate-suffixed, e.g. "Sub 2") display name back to
 * its catalog base size, or null if it doesn't correspond to any catalog
 * entry. Used to validate that a fleet-builder placement's declared size
 * actually matches what its name claims to be. */
export function catalogSizeForName(name: string): number | null {
  const direct = CATALOG_SIZE_BY_NAME.get(name);
  if (direct !== undefined) return direct;
  const match = name.match(/^(.+) (\d+)$/);
  if (match && Number(match[2]) >= 2) {
    const base = CATALOG_SIZE_BY_NAME.get(match[1]);
    if (base !== undefined) return base;
  }
  return null;
}

/** Compute the display name for the Nth (1-indexed) copy of a catalog entry
 * already present `existingCount` times in a fleet-in-progress. */
export function nameForCatalogPick(baseName: string, existingCount: number): string {
  return existingCount === 0 ? baseName : `${baseName} ${existingCount + 1}`;
}

/** A placement now self-describes its own cell length via `size` so this
 * module never needs a global name->size lookup — required once fleets can
 * be arbitrary player-built compositions (Fleet Builder) rather than always
 * the fixed classic FLEET. */
export type Placement = { name: string; row: number; col: number; horizontal: boolean; size: number };

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

/** All cells a placement occupies, given its own declared size. Does not
 * validate bounds — callers that need in-bounds guarantees (validatePlacement)
 * check that separately. */
export function cellsForPlacement(placement: Placement): string[] {
  const size = Number.isInteger(placement.size) && placement.size > 0 ? placement.size : 0;
  const cells: string[] = [];
  for (let i = 0; i < size; i++) {
    const row = placement.horizontal ? placement.row : placement.row + i;
    const col = placement.horizontal ? placement.col + i : placement.col;
    cells.push(cellKey(row, col));
  }
  return cells;
}

/**
 * Validate a fleet COMPOSITION (name+size list, independent of board
 * position) against a difficulty's rules:
 *  - "easy": must be exactly the classic FLEET (each ship present once,
 *    matching name+size — order-independent).
 *  - "medium"/"hard": Fleet Builder rules — 3 to 7 ships, total cells <= 17
 *    budget, every ship's name+size must correspond to a real catalog entry
 *    (including duplicate-suffix names like "Sub 2"), and names must be
 *    unique within the fleet.
 */
export function validateFleetComposition(fleet: FleetSpec, difficulty: Difficulty): boolean {
  if (!Array.isArray(fleet)) return false;
  for (const ship of fleet) {
    if (
      typeof ship !== "object" ||
      ship === null ||
      typeof (ship as { name?: unknown }).name !== "string" ||
      typeof (ship as { size?: unknown }).size !== "number" ||
      !Number.isInteger(ship.size)
    ) {
      return false;
    }
  }

  if (difficulty === "easy") {
    if (fleet.length !== FLEET.length) return false;
    const remaining = [...FLEET];
    for (const ship of fleet) {
      const idx = remaining.findIndex((f) => f.name === ship.name && f.size === ship.size);
      if (idx === -1) return false;
      remaining.splice(idx, 1);
    }
    return remaining.length === 0;
  }

  // medium / hard — Fleet Builder rules.
  if (fleet.length < FLEET_BUILDER_MIN_SHIPS || fleet.length > FLEET_BUILDER_MAX_SHIPS) return false;
  const totalCells = fleet.reduce((sum, s) => sum + s.size, 0);
  if (totalCells > FLEET_BUILDER_BUDGET) return false;

  const seenNames = new Set<string>();
  for (const ship of fleet) {
    if (seenNames.has(ship.name)) return false;
    seenNames.add(ship.name);
    const catalogSize = catalogSizeForName(ship.name);
    if (catalogSize === null || catalogSize !== ship.size) return false;
  }
  return true;
}

/**
 * Full-fleet placement validation: a legal fleet composition for the given
 * difficulty (see validateFleetComposition), every placement in bounds, and
 * no overlapping cells between ships (touching is allowed — classic Hasbro
 * rules, no adjacency restriction).
 *
 * Accepts `unknown`-shaped input defensively (the type signature says
 * `Placement[]` per the shared interface, but callers on the server side
 * are deserializing untrusted JSON cast to this type, so runtime shape
 * checks still matter — this function must never throw).
 */
export function validatePlacement(placements: Placement[], difficulty: Difficulty = "easy"): boolean {
  if (!Array.isArray(placements)) return false;

  for (const raw of placements) {
    const p = raw as Partial<Placement> | null;
    if (
      typeof p !== "object" ||
      p === null ||
      typeof p.name !== "string" ||
      typeof p.row !== "number" ||
      typeof p.col !== "number" ||
      typeof p.horizontal !== "boolean" ||
      typeof p.size !== "number" ||
      !Number.isInteger(p.row) ||
      !Number.isInteger(p.col) ||
      !Number.isInteger(p.size) ||
      p.size < 1
    ) {
      return false;
    }
  }

  const fleet: FleetSpec = placements.map((p) => ({ name: p.name, size: p.size }));
  if (!validateFleetComposition(fleet, difficulty)) return false;

  const occupied = new Set<string>();
  for (const placement of placements) {
    if (placement.horizontal && placement.col + placement.size > BOARD_SIZE) return false;
    if (!placement.horizontal && placement.row + placement.size > BOARD_SIZE) return false;
    if (placement.row < 0 || placement.col < 0) return false;

    const cells = cellsForPlacement(placement);
    for (const cell of cells) {
      const [r, c] = parseCellKey(cell);
      if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) return false;
      if (occupied.has(cell)) return false;
      occupied.add(cell);
    }
  }

  return true;
}

/**
 * Fire `cell` at `board` (the defending fleet's placements), given the
 * shooter's prior shot cells against this board (`shots`, NOT including
 * `cell` itself). Pure — never mutates its inputs. Fleet-agnostic: works for
 * any board of Placement[] regardless of which difficulty built it, since
 * each placement now carries its own size.
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
