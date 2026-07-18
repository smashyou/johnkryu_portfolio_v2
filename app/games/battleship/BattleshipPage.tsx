"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  BOARD_SIZE,
  CATALOG,
  FLEET,
  FLEET_BUILDER_BUDGET,
  FLEET_BUILDER_MAX_SHIPS,
  FLEET_BUILDER_MIN_SHIPS,
  cellKey,
  cellsForPlacement,
  nameForCatalogPick,
  parseCellKey,
  shoot,
  validateFleetComposition,
  validatePlacement,
  type Difficulty,
  type FleetSpec,
  type Placement,
} from "@/app/games/lib/battleship";
import { buildRandomFleet, nextShot, randomPlacement } from "@/app/games/lib/battleshipAi";
import { useGameRoom } from "@/app/games/lib/useGameRoom";
import InviteShare from "@/app/games/lib/InviteShare";
import type { BattleshipView, ShotRecord } from "@/app/games/lib/server/battleshipGame";
import HowToModal from "./HowToModal";
import styles from "./battleship.module.css";

type Mode = "computer" | "online" | null;
type CellState = "empty" | "ship" | "hit" | "miss";

const CLAIM_WIN_IDLE_MS = 180000;
const DRAG_THRESHOLD_PX = 5;
const SHAKE_DURATION_MS = 420;
const HOWTO_STORAGE_KEY = "jkr_howto_battleship";

function emptyGrid(): CellState[][] {
  return Array.from({ length: BOARD_SIZE }, () => Array<CellState>(BOARD_SIZE).fill("empty"));
}

function shipGrid(placements: Placement[] | null): CellState[][] {
  const grid = emptyGrid();
  if (!placements) return grid;
  for (const ship of placements) {
    for (const cell of cellsForPlacement(ship)) {
      const [r, c] = parseCellKey(cell);
      grid[r][c] = "ship";
    }
  }
  return grid;
}

function overlayShots(grid: CellState[][], shots: ShotRecord[]): CellState[][] {
  const next = grid.map((row) => [...row]);
  for (const shot of shots) {
    const [r, c] = parseCellKey(shot.cell);
    next[r][c] = shot.result;
  }
  return next;
}

function sunkNamesFrom(shots: ShotRecord[]): Set<string> {
  return new Set(shots.filter((s) => s.sunk).map((s) => s.sunk as string));
}

/** In-bounds + no-overlap check for a candidate placement against a list of
 * other (already-placed) ships. Fleet-agnostic — every Placement now
 * self-describes its size, so this needs no ship-name lookup table. */
function candidateValid(candidate: Placement, others: Placement[]): boolean {
  if (candidate.horizontal && candidate.col + candidate.size > BOARD_SIZE) return false;
  if (!candidate.horizontal && candidate.row + candidate.size > BOARD_SIZE) return false;
  if (candidate.row < 0 || candidate.col < 0) return false;
  const cells = cellsForPlacement(candidate);
  const occupied = new Set(others.flatMap((p) => cellsForPlacement(p)));
  return cells.every((c) => !occupied.has(c));
}

/** Ready-to-play gate: every ship in `fleetSpec` (and only those ships) is
 * placed, each in a legal spot. */
function isFleetReady(placements: Placement[], fleetSpec: FleetSpec, difficulty: Difficulty): boolean {
  if (placements.length !== fleetSpec.length) return false;
  const remaining = [...fleetSpec];
  for (const p of placements) {
    const idx = remaining.findIndex((f) => f.name === p.name && f.size === p.size);
    if (idx === -1) return false;
    remaining.splice(idx, 1);
  }
  if (remaining.length !== 0) return false;
  return validatePlacement(placements, difficulty);
}

function baseNameOf(name: string): string {
  const match = name.match(/^(.+) (\d+)$/);
  return match ? match[1] : name;
}

function difficultyLabel(d: Difficulty): string {
  if (d === "easy") return "Easy — Classic";
  if (d === "medium") return "Medium — Fleet Builder";
  return "Hard — Fog of War";
}

// ---------------------------------------------------------------------------
// Board grid — shared read/interactive board rendering for placement,
// "your fleet", and "enemy waters" boards alike. The placement board's
// drag preview is NOT rendered per-cell here — it's a single absolutely
// positioned overlay (see PlacementEditor's `dragOverlay`) so the ghost and
// the "which cells will this land on" preview can never disagree.
// ---------------------------------------------------------------------------

function BoardGrid({
  grid,
  onCellClick,
  interactive,
  ariaLabel,
}: {
  grid: CellState[][];
  onCellClick?: (row: number, col: number) => void;
  interactive: boolean;
  ariaLabel: string;
}) {
  return (
    <div className={styles.board} role="grid" aria-label={ariaLabel}>
      {grid.map((rowCells, r) => (
        <div className={styles.boardRow} role="row" key={r}>
          {rowCells.map((cellState, c) => {
            const disabled = !interactive || cellState === "hit" || cellState === "miss";
            const stateClass =
              cellState === "empty"
                ? styles.cell_empty
                : cellState === "ship"
                  ? styles.cell_ship
                  : cellState === "hit"
                    ? styles.cell_hit
                    : styles.cell_miss;
            return (
              <button
                key={c}
                type="button"
                role="gridcell"
                data-row={r}
                data-col={c}
                data-state={cellState}
                disabled={disabled}
                className={`${styles.cell} ${stateClass}`}
                onClick={() => onCellClick?.(r, c)}
                aria-label={`row ${r + 1} column ${c + 1}: ${cellState}`}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

function FleetTray({
  label,
  ships,
  sunkNames,
  hint,
}: {
  label: string;
  ships: { name: string }[];
  sunkNames: Set<string>;
  hint?: string;
}) {
  return (
    <div className={styles.fleetTray}>
      <span className={styles.fleetTrayLabel}>
        {label}
        {hint ? <span className={styles.fleetTrayHint}> — {hint}</span> : null}
      </span>
      <div className={styles.fleetChips}>
        {ships.length === 0 && hint ? (
          <span className={styles.fleetTrayHint}>none yet</span>
        ) : (
          ships.map((ship) => (
            <span key={ship.name} className={`${styles.fleetChip} ${sunkNames.has(ship.name) ? styles.fleetChipSunk : ""}`}>
              {ship.name}
            </span>
          ))
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fleet rules (difficulty) picker — shared by vs-computer and online
// room-create. Purely presentational; the "AI toughness" note clarifies that
// this only governs fleet composition, not the computer's hunt/target skill.
// ---------------------------------------------------------------------------

function DifficultyPicker({ onSelect, selected }: { onSelect: (d: Difficulty) => void; selected?: Difficulty }) {
  const options: { value: Difficulty; title: string; desc: string }[] = [
    {
      value: "easy",
      title: "Easy — Classic",
      desc: "Standard 5-ship fleet for both sides: Carrier 5 · Battleship 4 · Cruiser 3 · Submarine 3 · Destroyer 2.",
    },
    {
      value: "medium",
      title: "Medium — Fleet Builder",
      desc: `Secretly build a fleet from a catalog under a ${FLEET_BUILDER_BUDGET}-cell budget (${FLEET_BUILDER_MIN_SHIPS}-${FLEET_BUILDER_MAX_SHIPS} ships). Composition stays hidden; sunk ships are still named.`,
    },
    {
      value: "hard",
      title: "Hard — Fog of War",
      desc: "Fleet Builder rules, plus total fog: no enemy fleet tray, and sinking a ship stays anonymous.",
    },
  ];
  return (
    <div>
      <p className={styles.statusLine}>Fleet rules</p>
      <div className={styles.difficultyGrid}>
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`${styles.difficultyCard} ${selected === opt.value ? styles.difficultyCardSelected : ""}`}
            onClick={() => onSelect(opt.value)}
          >
            <span className={styles.difficultyTitle}>{opt.title}</span>
            <span className={styles.difficultyDesc}>{opt.desc}</span>
          </button>
        ))}
      </div>
      <p className={styles.difficultyNote}>
        This only changes fleet composition — the computer&apos;s aim (hunt/target AI) is the same at every level.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fleet Builder — Medium/Hard secret-fleet assembly step, before placement.
// ---------------------------------------------------------------------------

function FleetBuilder({
  difficulty,
  fleet,
  onChange,
  onConfirm,
  onBack,
}: {
  difficulty: Difficulty;
  fleet: FleetSpec;
  onChange: (next: FleetSpec) => void;
  onConfirm: () => void;
  onBack?: () => void;
}) {
  const totalCells = fleet.reduce((sum, s) => sum + s.size, 0);
  const canConfirm = validateFleetComposition(fleet, difficulty);

  function addShip(entryName: string, size: number) {
    if (fleet.length >= FLEET_BUILDER_MAX_SHIPS) return;
    if (totalCells + size > FLEET_BUILDER_BUDGET) return;
    const count = fleet.filter((s) => baseNameOf(s.name) === entryName).length;
    onChange([...fleet, { name: nameForCatalogPick(entryName, count), size }]);
  }

  function removeShip(name: string) {
    onChange(fleet.filter((s) => s.name !== name));
  }

  return (
    <div>
      <p className={styles.statusLine}>
        Build your secret fleet — pick ships from the catalog under a {FLEET_BUILDER_BUDGET}-cell budget (
        {FLEET_BUILDER_MIN_SHIPS}-{FLEET_BUILDER_MAX_SHIPS} ships).
      </p>
      <div className={styles.budgetMeter}>
        <span className={totalCells > FLEET_BUILDER_BUDGET ? styles.budgetOver : ""}>
          {totalCells} / {FLEET_BUILDER_BUDGET} cells
        </span>
        <span>
          {fleet.length} / {FLEET_BUILDER_MAX_SHIPS} ships (min {FLEET_BUILDER_MIN_SHIPS})
        </span>
      </div>
      <div className={styles.catalogGrid}>
        {CATALOG.map((entry) => {
          const disabled = fleet.length >= FLEET_BUILDER_MAX_SHIPS || totalCells + entry.size > FLEET_BUILDER_BUDGET;
          return (
            <button
              key={entry.name}
              type="button"
              className={styles.catalogButton}
              disabled={disabled}
              onClick={() => addShip(entry.name, entry.size)}
            >
              {entry.name} ({entry.size})
            </button>
          );
        })}
      </div>
      <div className={styles.fleetList}>
        {fleet.length === 0 && <span className={styles.fleetTrayHint}>No ships yet — add some from the catalog above.</span>}
        {fleet.map((ship) => (
          <span key={ship.name} className={styles.fleetListItem}>
            {ship.name} ({ship.size})
            <button type="button" className={styles.removeShipButton} onClick={() => removeShip(ship.name)} aria-label={`Remove ${ship.name}`}>
              ✕
            </button>
          </span>
        ))}
      </div>
      <div className={styles.placementControls}>
        {onBack && (
          <button type="button" className={styles.secondaryButton} onClick={onBack}>
            ← Fleet rules
          </button>
        )}
        <button type="button" className={styles.secondaryButton} onClick={() => onChange(buildRandomFleet(Math.random, difficulty))}>
          Random fleet
        </button>
        <button type="button" className={styles.secondaryButton} onClick={() => onChange([])}>
          Clear
        </button>
        <button type="button" className={styles.primaryButton} disabled={!canConfirm} onClick={onConfirm}>
          Confirm fleet — start placing
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Placement editor — pointer-events-based drag & drop. Shared between
// vs-computer and online setup. Works with mouse AND touch: pointer events
// unify both, and setPointerCapture keeps drag/rotate gestures glued to the
// element that started them even as the pointer leaves it.
// ---------------------------------------------------------------------------

type DragSession = {
  pointerId: number;
  source: "tray" | "board";
  name: string;
  size: number;
  horizontal: boolean;
  startX: number;
  startY: number;
  moved: boolean;
};

/** Single source of truth for the active drag's visuals. When `onBoard` is
 * true, (row, col, size, horizontal) fully determine BOTH the snap-highlight
 * AND the ghost fill — they're rendered as one element (`dragSnapOverlay`),
 * so they can never disagree. When `onBoard` is false the pointer is off the
 * board (e.g. still over the tray); only `size`/`horizontal` matter, for the
 * small cursor-following badge (its pixel position is tracked via a ref, not
 * state — see `badgeRef`). */
type DragOverlayState = {
  size: number;
  horizontal: boolean;
  onBoard: boolean;
  row: number;
  col: number;
  valid: boolean;
};

/** Board cell centers captured once at drag-start from the live DOM (so the
 * pointer→cell mapping is exact regardless of the grid's `gap`, container
 * width, or any sub-pixel rounding the browser applies to the CSS grid —
 * far more robust than assuming a uniform `boardWidth / BOARD_SIZE` pitch). */
type BoardGeometry = {
  xs: number[];
  ys: number[];
  colLeft: number[];
  colRight: number[];
  rowTop: number[];
  rowBottom: number[];
  rect: DOMRect;
};

function nearestIndex(centers: number[], value: number): number {
  let bestIdx = 0;
  let bestDist = Infinity;
  for (let i = 0; i < centers.length; i++) {
    const d = Math.abs(centers[i] - value);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  }
  return bestIdx;
}

/** Keep a ship's placement anchor fully on the board given its length and
 * orientation, so the drag preview is always exactly `size` contiguous
 * cells — never clipped at the board edge. */
function clampToBoard(row: number, col: number, size: number, horizontal: boolean): { row: number; col: number } {
  return {
    row: horizontal ? row : Math.min(row, BOARD_SIZE - size),
    col: horizontal ? Math.min(col, BOARD_SIZE - size) : col,
  };
}

/** Pixel-exact CSS for the drag snap overlay, derived from the SAME captured
 * cell rects used to resolve pointer→cell (see `captureGeometry` /
 * `cellFromPoint`) — not from a `col/BOARD_SIZE * 100%` approximation, which
 * (like the old bug) would silently ignore the grid's `gap` and drift by a
 * few px per column/row. Falls back to the percentage approximation only if
 * geometry hasn't been captured yet (should not happen once a drag is over
 * the board, since capture happens at drag-start). */
function overlayPixelStyle(target: DragOverlayState, geo: BoardGeometry | null): React.CSSProperties {
  if (!geo) {
    return {
      left: `${(target.col / BOARD_SIZE) * 100}%`,
      top: `${(target.row / BOARD_SIZE) * 100}%`,
      width: `${((target.horizontal ? target.size : 1) / BOARD_SIZE) * 100}%`,
      height: `${((target.horizontal ? 1 : target.size) / BOARD_SIZE) * 100}%`,
    };
  }
  const lastCol = target.horizontal ? target.col + target.size - 1 : target.col;
  const lastRow = target.horizontal ? target.row : target.row + target.size - 1;
  return {
    left: geo.colLeft[target.col] - geo.rect.left,
    top: geo.rowTop[target.row] - geo.rect.top,
    width: geo.colRight[lastCol] - geo.colLeft[target.col],
    height: geo.rowBottom[lastRow] - geo.rowTop[target.row],
  };
}

function PlacementEditor({
  fleetSpec,
  placements,
  onChange,
  onReady,
  readyLabel,
  difficulty,
}: {
  fleetSpec: FleetSpec;
  placements: Placement[];
  onChange: (next: Placement[]) => void;
  onReady: () => void;
  readyLabel: string;
  difficulty: Difficulty;
}) {
  const boardRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<DragSession | null>(null);
  const shakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // rAF-throttled pointermove pipeline: only the latest pointer position is
  // kept (`pendingPointRef`), at most one frame is scheduled at a time
  // (`rafIdRef`), and `lastAppliedRef` lets `processPointerMove` skip the
  // `setDragOverlay` call entirely when the computed target hasn't actually
  // changed cell/orientation/validity — this is what keeps drag smooth: the
  // 100-cell board only re-renders when the snapped target really moves,
  // not on every pixel of pointer travel.
  const rafIdRef = useRef<number | null>(null);
  const pendingPointRef = useRef<{ clientX: number; clientY: number } | null>(null);
  const lastAppliedRef = useRef<DragOverlayState | null>(null);
  const geometryRef = useRef<BoardGeometry | null>(null);

  const [dragOverlay, setDragOverlay] = useState<DragOverlayState | null>(null);
  const [draggingName, setDraggingName] = useState<string | null>(null);
  const [shakingShip, setShakingShip] = useState<string | null>(null);
  const [selectedShipName, setSelectedShipName] = useState<string | null>(null);
  const [trayOrientations, setTrayOrientations] = useState<Record<string, boolean>>({});

  useEffect(() => () => {
    if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
  }, []);

  const placedNames = useMemo(() => new Set(placements.map((p) => p.name)), [placements]);
  const unplaced = fleetSpec.filter((s) => !placedNames.has(s.name));
  const ready = isFleetReady(placements, fleetSpec, difficulty);

  const triggerShake = useCallback((name: string) => {
    setShakingShip(name);
    if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
    shakeTimerRef.current = setTimeout(() => setShakingShip(null), SHAKE_DURATION_MS);
  }, []);

  // Snapshot every cell's screen-space center from the live DOM. Captured
  // once at drag-start (not per-move): the board's layout doesn't change
  // mid-drag, so this is cheap to gather up front and then reused for every
  // pointermove — no per-frame getBoundingClientRect() calls, no assumption
  // about a uniform `width / BOARD_SIZE` pitch that would silently ignore
  // the grid's `gap`.
  const captureGeometry = useCallback(() => {
    const el = boardRef.current;
    if (!el) return;
    const xs = new Array<number>(BOARD_SIZE).fill(0);
    const ys = new Array<number>(BOARD_SIZE).fill(0);
    const colLeft = new Array<number>(BOARD_SIZE).fill(0);
    const colRight = new Array<number>(BOARD_SIZE).fill(0);
    const rowTop = new Array<number>(BOARD_SIZE).fill(0);
    const rowBottom = new Array<number>(BOARD_SIZE).fill(0);
    const cellEls = el.querySelectorAll<HTMLElement>("button[data-row][data-col]");
    cellEls.forEach((cellEl) => {
      const row = Number(cellEl.dataset.row);
      const col = Number(cellEl.dataset.col);
      const r = cellEl.getBoundingClientRect();
      if (row === 0) {
        xs[col] = r.left + r.width / 2;
        colLeft[col] = r.left;
        colRight[col] = r.right;
      }
      if (col === 0) {
        ys[row] = r.top + r.height / 2;
        rowTop[row] = r.top;
        rowBottom[row] = r.bottom;
      }
    });
    geometryRef.current = { xs, ys, colLeft, colRight, rowTop, rowBottom, rect: el.getBoundingClientRect() };
  }, []);

  const cellFromPoint = useCallback((clientX: number, clientY: number): { row: number; col: number } | null => {
    const geo = geometryRef.current;
    if (!geo) return null;
    const { rect, xs, ys, colLeft, colRight } = geo;
    // Magnetic edges: treat a pointer within ~one cell outside the board as
    // still targeting the nearest edge cells, so the snap preview doesn't
    // abruptly flip to the free-floating carry ghost right at the boundary.
    const margin = (colRight[0] - colLeft[0]) * 1.1;
    if (
      clientX < rect.left - margin ||
      clientX >= rect.right + margin ||
      clientY < rect.top - margin ||
      clientY >= rect.bottom + margin
    ) {
      return null;
    }
    return { row: nearestIndex(ys, clientY), col: nearestIndex(xs, clientX) };
  }, []);

  const startDrag = useCallback(
    (e: { pointerId: number; clientX: number; clientY: number }, source: "tray" | "board", name: string, size: number, horizontal: boolean) => {
      sessionRef.current = {
        pointerId: e.pointerId,
        source,
        name,
        size,
        horizontal,
        startX: e.clientX,
        startY: e.clientY,
        moved: false,
      };
      captureGeometry();
      lastAppliedRef.current = null;
    },
    [captureGeometry]
  );

  // Recompute the single-source-of-truth drag target for the latest pending
  // pointer position. Runs at most once per animation frame (scheduled by
  // `handlePointerMove` below), and only calls `setDragOverlay` — the state
  // update that re-renders the board — when the computed target actually
  // changed cell, orientation, or validity. The off-board badge's raw pixel
  // position is written straight to the DOM via `badgeRef`, bypassing React
  // state entirely, since that's pure cursor-following and never needs to
  // trigger a component re-render.
  const processPointerMove = useCallback(
    (session: DragSession) => {
      const point = pendingPointRef.current;
      if (!point) return;
      const dx = point.clientX - session.startX;
      const dy = point.clientY - session.startY;
      if (!session.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD_PX) {
        session.moved = true;
        if (session.source === "board") setDraggingName(session.name);
      }
      if (!session.moved) return;

      const rawCell = cellFromPoint(point.clientX, point.clientY);
      const others = session.source === "board" ? placements.filter((p) => p.name !== session.name) : placements;

      let next: DragOverlayState;
      if (rawCell) {
        const { row, col } = clampToBoard(rawCell.row, rawCell.col, session.size, session.horizontal);
        const candidate: Placement = { name: session.name, size: session.size, row, col, horizontal: session.horizontal };
        next = { size: session.size, horizontal: session.horizontal, onBoard: true, row, col, valid: candidateValid(candidate, others) };
      } else {
        next = { size: session.size, horizontal: session.horizontal, onBoard: false, row: 0, col: 0, valid: false };
      }

      const last = lastAppliedRef.current;
      const changed =
        !last ||
        last.onBoard !== next.onBoard ||
        last.row !== next.row ||
        last.col !== next.col ||
        last.horizontal !== next.horizontal ||
        last.valid !== next.valid;
      if (changed) {
        lastAppliedRef.current = next;
        setDragOverlay(next);
      }

      const badge = badgeRef.current;
      if (badge) {
        if (rawCell) {
          badge.style.display = "none";
        } else {
          badge.style.display = "block";
          badge.style.transform = `translate3d(${point.clientX}px, ${point.clientY}px, 0) translate(-50%, -50%)`;
        }
      }
    },
    [cellFromPoint, placements]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const session = sessionRef.current;
      if (!session || e.pointerId !== session.pointerId) return;
      pendingPointRef.current = { clientX: e.clientX, clientY: e.clientY };
      if (rafIdRef.current != null) return;
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        const activeSession = sessionRef.current;
        if (activeSession) processPointerMove(activeSession);
      });
    },
    [processPointerMove]
  );

  const endDrag = useCallback(
    (e: { pointerId: number; clientX: number; clientY: number }) => {
      const session = sessionRef.current;
      if (!session || e.pointerId !== session.pointerId) return;
      sessionRef.current = null;
      if (rafIdRef.current != null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      pendingPointRef.current = null;
      lastAppliedRef.current = null;
      const wasMoved = session.moved;
      setDragOverlay(null);
      setDraggingName(null);
      if (badgeRef.current) badgeRef.current.style.display = "none";

      if (!wasMoved) {
        if (session.source === "tray") {
          setSelectedShipName(session.name);
          return;
        }
        // Board ship tapped (no drag) — rotate in place.
        const original = placements.find((p) => p.name === session.name);
        if (!original) return;
        setSelectedShipName(session.name);
        const rotated: Placement = { ...original, horizontal: !original.horizontal };
        const others = placements.filter((p) => p.name !== session.name);
        if (candidateValid(rotated, others)) {
          onChange(placements.map((p) => (p.name === session.name ? rotated : p)));
        } else {
          triggerShake(session.name);
        }
        return;
      }

      // Recomputed fresh from the final pointer position (not read back from
      // React state) so the commit can never lag a frame behind what was
      // last rendered — it lands exactly on whatever cell the pointer is
      // over right now, matching the snap overlay the player was looking at.
      const rawCell = cellFromPoint(e.clientX, e.clientY);
      const others = placements.filter((p) => p.name !== session.name);
      if (rawCell) {
        const { row, col } = clampToBoard(rawCell.row, rawCell.col, session.size, session.horizontal);
        const candidate: Placement = { name: session.name, size: session.size, row, col, horizontal: session.horizontal };
        if (candidateValid(candidate, others)) {
          onChange([...others, candidate]);
          return;
        }
      }
      triggerShake(session.name);
    },
    [cellFromPoint, onChange, placements, triggerShake]
  );

  // Keyboard "R": rotate the active drag (live preview only) or the current
  // selection (a placed ship rotates in place; an unplaced tray ship just
  // flips the orientation it'll be dropped in next).
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() !== "r") return;
      const session = sessionRef.current;
      if (session) {
        session.horizontal = !session.horizontal;
        setDragOverlay((prev) => {
          if (!prev) return prev;
          let next: DragOverlayState;
          if (!prev.onBoard) {
            next = { ...prev, horizontal: session.horizontal };
          } else {
            const others = session.source === "board" ? placements.filter((p) => p.name !== session.name) : placements;
            const { row, col } = clampToBoard(prev.row, prev.col, session.size, session.horizontal);
            const candidate: Placement = { name: session.name, size: session.size, row, col, horizontal: session.horizontal };
            next = { ...prev, horizontal: session.horizontal, row, col, valid: candidateValid(candidate, others) };
          }
          lastAppliedRef.current = next;
          return next;
        });
        return;
      }
      if (!selectedShipName) return;
      const placed = placements.find((p) => p.name === selectedShipName);
      if (placed) {
        const rotated: Placement = { ...placed, horizontal: !placed.horizontal };
        const others = placements.filter((p) => p.name !== selectedShipName);
        if (candidateValid(rotated, others)) {
          onChange(placements.map((p) => (p.name === selectedShipName ? rotated : p)));
        } else {
          triggerShake(selectedShipName);
        }
      } else {
        setTrayOrientations((prev) => ({ ...prev, [selectedShipName]: !(prev[selectedShipName] ?? true) }));
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [placements, onChange, selectedShipName, triggerShake]);

  function handleRandom() {
    onChange(randomPlacement(Math.random, fleetSpec));
    setSelectedShipName(null);
  }

  function handleClear() {
    onChange([]);
    setSelectedShipName(null);
  }

  const grid = useMemo(() => shipGrid(placements.filter((p) => p.name !== draggingName)), [placements, draggingName]);

  return (
    <div>
      <p className={styles.statusLine}>
        Drag a ship from the tray onto the board. Tap a placed ship (or press <kbd className={styles.kbd}>R</kbd>) to rotate it.
      </p>

      <div className={styles.placementLayout}>
        <div className={styles.trayColumn}>
          <span className={styles.fleetTrayLabel}>SHIP TRAY</span>
          <div className={styles.tray}>
            {unplaced.map((ship) => {
              const horizontal = trayOrientations[ship.name] ?? true;
              return (
                <div
                  key={ship.name}
                  className={`${styles.trayPiece} ${selectedShipName === ship.name ? styles.trayPieceSelected : ""} ${
                    shakingShip === ship.name ? styles.shake : ""
                  }`}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                    startDrag(e, "tray", ship.name, ship.size, horizontal);
                    const initial: DragOverlayState = { size: ship.size, horizontal, onBoard: false, row: 0, col: 0, valid: false };
                    lastAppliedRef.current = initial;
                    setDragOverlay(initial);
                    if (badgeRef.current) {
                      badgeRef.current.style.display = "block";
                      badgeRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
                    }
                  }}
                  onPointerMove={handlePointerMove}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                >
                  <div className={styles.trayPieceCells} style={{ flexDirection: horizontal ? "row" : "column" }}>
                    {Array.from({ length: ship.size }).map((_, i) => (
                      <span key={i} className={styles.trayPieceCell} />
                    ))}
                  </div>
                  <span className={styles.trayPieceLabel}>
                    {ship.name} ({ship.size})
                  </span>
                </div>
              );
            })}
            {unplaced.length === 0 && <span className={styles.fleetTrayHint}>Fleet fully placed.</span>}
          </div>
        </div>

        <div className={styles.boardColumn}>
          <div className={styles.boardStage} ref={boardRef}>
            <BoardGrid grid={grid} interactive={false} ariaLabel="Fleet placement board" />
            {placements
              .filter((p) => p.name !== draggingName)
              .map((ship) => {
                const left = (ship.col / BOARD_SIZE) * 100;
                const top = (ship.row / BOARD_SIZE) * 100;
                const width = ((ship.horizontal ? ship.size : 1) / BOARD_SIZE) * 100;
                const height = ((ship.horizontal ? 1 : ship.size) / BOARD_SIZE) * 100;
                return (
                  <div
                    key={ship.name}
                    role="button"
                    tabIndex={0}
                    aria-label={`${ship.name}, placed. Drag to move, tap or press R to rotate.`}
                    className={`${styles.placedShipOverlay} ${shakingShip === ship.name ? styles.shake : ""}`}
                    style={{ left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%` }}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                      startDrag(e, "board", ship.name, ship.size, ship.horizontal);
                    }}
                    onPointerMove={handlePointerMove}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
                  />
                );
              })}
            {/* Single source of truth for the live drag preview: one block
                spanning (row, col, size, orientation), positioned from the
                same captured cell rects the pointer→cell math uses (see
                `overlayPixelStyle`), so the "ghost" fill and the "which
                cells will this land on" preview are literally the same
                element — they cannot disagree, and the run is always
                exactly `size` contiguous cells. */}
            {dragOverlay && dragOverlay.onBoard && (
              <div
                aria-hidden="true"
                className={`${styles.dragSnapOverlay} ${dragOverlay.valid ? styles.dragSnapValid : styles.dragSnapInvalid}`}
                style={{
                  ...overlayPixelStyle(dragOverlay, geometryRef.current),
                  flexDirection: dragOverlay.horizontal ? "row" : "column",
                }}
              >
                {Array.from({ length: dragOverlay.size }).map((_, i) => (
                  <span key={i} className={styles.dragSnapCell} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.placementControls}>
        <button type="button" className={styles.secondaryButton} onClick={handleRandom}>
          Random placement
        </button>
        <button type="button" className={styles.secondaryButton} onClick={handleClear}>
          Clear
        </button>
      </div>
      <div className={styles.placementControls} style={{ marginTop: 4 }}>
        <button type="button" className={styles.primaryButton} disabled={!ready} onClick={onReady}>
          {readyLabel}
        </button>
      </div>

      {/* Small cursor-following badge — shown ONLY while the drag is off the
          board (over the tray or elsewhere). Its position is written
          directly to the DOM via `badgeRef` in the pointermove pipeline
          above, not through React state, so pure cursor-following never
          triggers a re-render. Never shown while hovering the board — there
          the `dragSnapOverlay` above is the only ghost, snapped to the grid. */}
      <div ref={badgeRef} className={styles.dragBadge} aria-hidden="true">
        <div className={styles.badgeCells} style={{ flexDirection: dragOverlay?.horizontal ? "row" : "column" }}>
          {dragOverlay && Array.from({ length: dragOverlay.size }).map((_, i) => <span key={i} className={styles.badgeCell} />)}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Battle UI — mode-agnostic rendering of the dual-board fight once both
// fleets are placed. Both vs-computer and online drive this with normalized
// props so the JSX (and its Playwright selectors) stay identical either way.
// Difficulty gates the fog-of-war rules: on "hard" the enemy fleet tray is
// hidden and sink announcements for shots I fired are anonymized.
// ---------------------------------------------------------------------------

type BattleUIProps = {
  difficulty: Difficulty;
  myBoard: Placement[];
  myShots: ShotRecord[];
  oppShots: ShotRecord[];
  opponentBoard: Placement[] | null;
  isMyTurn: boolean;
  phase: "playing" | "done";
  winner: "me" | "opponent" | null;
  waitingLabel: string;
  onFire: (cell: string) => void;
  onRematch: () => void;
  onClaimWin?: () => void;
  claimWinAvailable: boolean;
};

function BattleUI({
  difficulty,
  myBoard,
  myShots,
  oppShots,
  opponentBoard,
  isMyTurn,
  phase,
  winner,
  waitingLabel,
  onFire,
  onRematch,
  onClaimWin,
  claimWinAvailable,
}: BattleUIProps) {
  const [log, setLog] = useState<string[]>([]);
  const myShotsLenRef = useRef(0);
  const oppShotsLenRef = useRef(0);

  useEffect(() => {
    if (myShots.length > myShotsLenRef.current) {
      const fresh = myShots.slice(myShotsLenRef.current);
      myShotsLenRef.current = myShots.length;
      const messages = fresh.filter((s) => s.sunk).map((s) => (difficulty === "hard" ? "You sunk a ship!" : `You sank the enemy ${s.sunk}!`));
      if (messages.length) setLog((prev) => [...prev, ...messages]);
    }
  }, [myShots, difficulty]);

  useEffect(() => {
    if (oppShots.length > oppShotsLenRef.current) {
      const fresh = oppShots.slice(oppShotsLenRef.current);
      oppShotsLenRef.current = oppShots.length;
      const messages = fresh.filter((s) => s.sunk).map((s) => `Opponent sank your ${s.sunk}!`);
      if (messages.length) setLog((prev) => [...prev, ...messages]);
    }
  }, [oppShots]);

  const myGrid = overlayShots(shipGrid(myBoard), oppShots);
  const trackingGrid = overlayShots(shipGrid(opponentBoard), myShots);

  const enemySunk = sunkNamesFrom(myShots);
  const mySunk = sunkNamesFrom(oppShots);

  const revealed = phase === "done" && opponentBoard !== null;
  const enemyShips: { name: string }[] = revealed
    ? (opponentBoard as Placement[]).map((p) => ({ name: p.name }))
    : difficulty === "easy"
      ? FLEET
      : [...enemySunk].map((name) => ({ name }));
  const showEnemyTray = revealed || difficulty !== "hard";
  const enemyHint = revealed || difficulty === "easy" ? undefined : "composition hidden";

  const trackingInteractive = phase === "playing" && isMyTurn;

  function onTrackingClick(row: number, col: number) {
    if (!trackingInteractive) return;
    onFire(cellKey(row, col));
  }

  return (
    <div>
      {phase === "done" && winner && (
        <div className={`${styles.resultBanner} ${winner === "me" ? styles.resultWin : styles.resultLose}`}>
          {winner === "me" ? "VICTORY — you sank the enemy fleet!" : "DEFEAT — your fleet was sunk."}
        </div>
      )}

      {phase === "playing" && (
        <p className={styles.statusLine} data-testid="turn-indicator">
          {isMyTurn ? <strong>Your turn — fire at enemy waters</strong> : waitingLabel}
        </p>
      )}

      <div className={styles.boardsWrap}>
        <div className={styles.boardBlock}>
          <span className={styles.boardLabel}>ENEMY WATERS — TAP TO FIRE</span>
          <BoardGrid grid={trackingGrid} onCellClick={onTrackingClick} interactive={trackingInteractive} ariaLabel="Enemy waters — your shots" />
          {showEnemyTray && <FleetTray label="Enemy fleet" ships={enemyShips} sunkNames={enemySunk} hint={enemyHint} />}
        </div>

        <div className={styles.boardBlock}>
          <span className={styles.boardLabel}>YOUR FLEET</span>
          <BoardGrid grid={myGrid} interactive={false} ariaLabel="Your fleet — incoming shots" />
          <FleetTray label="Your fleet" ships={myBoard.map((p) => ({ name: p.name }))} sunkNames={mySunk} />
        </div>
      </div>

      {log.length > 0 && (
        <ul className={styles.log} aria-live="polite">
          {log.map((entry, i) => (
            <li key={i}>{entry}</li>
          ))}
        </ul>
      )}

      <div className={styles.placementControls} style={{ marginTop: 16 }}>
        {phase === "done" && (
          <button type="button" className={styles.primaryButton} onClick={onRematch}>
            Rematch
          </button>
        )}
        {phase === "playing" && claimWinAvailable && onClaimWin && (
          <button type="button" className={styles.secondaryButton} onClick={onClaimWin}>
            Claim win (opponent AFK)
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// vs-Computer mode — fully local state, no network.
// ---------------------------------------------------------------------------

type LocalGame = {
  phase: "setup" | "playing" | "done";
  myBoard: Placement[] | null;
  aiBoard: Placement[] | null;
  myShots: ShotRecord[];
  aiShots: ShotRecord[];
  aiActiveHits: string[];
  turn: "me" | "ai";
  winner: "me" | "ai" | null;
};

function initialLocalGame(): LocalGame {
  return {
    phase: "setup",
    myBoard: null,
    aiBoard: null,
    myShots: [],
    aiShots: [],
    aiActiveHits: [],
    turn: "me",
    winner: null,
  };
}

function ComputerGame() {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [fleetSpec, setFleetSpec] = useState<FleetSpec | null>(null);
  const [buildingFleet, setBuildingFleet] = useState<FleetSpec>([]);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [game, setGame] = useState<LocalGame>(initialLocalGame);

  function chooseDifficulty(d: Difficulty) {
    setDifficulty(d);
    if (d === "easy") {
      setFleetSpec(FLEET);
    } else {
      setBuildingFleet([]);
      setFleetSpec(null);
    }
    setPlacements([]);
  }

  function handleReady() {
    if (!difficulty || !fleetSpec) return;
    if (!validatePlacement(placements, difficulty)) return;
    const aiFleet = difficulty === "easy" ? FLEET : buildRandomFleet(Math.random, difficulty);
    const aiBoard = randomPlacement(Math.random, aiFleet);
    setGame({
      phase: "playing",
      myBoard: placements,
      aiBoard,
      myShots: [],
      aiShots: [],
      aiActiveHits: [],
      turn: "me",
      winner: null,
    });
  }

  function handleFire(cell: string) {
    setGame((prev) => {
      if (prev.phase !== "playing" || prev.turn !== "me" || !prev.aiBoard) return prev;
      if (prev.myShots.some((s) => s.cell === cell)) return prev;
      const priorCells = prev.myShots.map((s) => s.cell);
      const { result, sunk, allSunk } = shoot(prev.aiBoard, priorCells, cell);
      const myShots = [...prev.myShots, { cell, result, sunk }];
      if (allSunk) {
        return { ...prev, myShots, phase: "done", winner: "me" };
      }
      return { ...prev, myShots, turn: "ai" };
    });
  }

  // Drive the AI's turn: pick a shot, apply it, hand the turn back.
  useEffect(() => {
    if (game.phase !== "playing" || game.turn !== "ai") return;
    const timer = setTimeout(() => {
      setGame((prev) => {
        if (prev.phase !== "playing" || prev.turn !== "ai" || !prev.myBoard) return prev;
        const shotsSoFar = prev.aiShots.map((s) => s.cell);
        const cell = nextShot(shotsSoFar, prev.aiActiveHits, Math.random);
        const { result, sunk, allSunk } = shoot(prev.myBoard, shotsSoFar, cell);
        const aiShots = [...prev.aiShots, { cell, result, sunk }];
        let aiActiveHits = prev.aiActiveHits;
        if (result === "hit") {
          aiActiveHits = [...aiActiveHits, cell];
          if (sunk) {
            const sunkShip = prev.myBoard.find((p) => p.name === sunk);
            const sunkCells = new Set(sunkShip ? cellsForPlacement(sunkShip) : []);
            aiActiveHits = aiActiveHits.filter((c) => !sunkCells.has(c));
          }
        }
        if (allSunk) {
          return { ...prev, aiShots, aiActiveHits, phase: "done", winner: "ai" };
        }
        return { ...prev, aiShots, aiActiveHits, turn: "me" };
      });
    }, 550);
    return () => clearTimeout(timer);
  }, [game.phase, game.turn]);

  function handleRematch() {
    setPlacements([]);
    setGame(initialLocalGame());
  }

  function changeFleetRules() {
    setDifficulty(null);
    setFleetSpec(null);
    setBuildingFleet([]);
    setPlacements([]);
    setGame(initialLocalGame());
  }

  if (!difficulty) {
    return (
      <div className={styles.panel}>
        <DifficultyPicker onSelect={chooseDifficulty} />
      </div>
    );
  }

  if (game.phase === "setup") {
    if (!fleetSpec) {
      return (
        <div className={styles.panel}>
          <FleetBuilder
            difficulty={difficulty}
            fleet={buildingFleet}
            onChange={setBuildingFleet}
            onConfirm={() => setFleetSpec(buildingFleet)}
            onBack={() => setDifficulty(null)}
          />
        </div>
      );
    }
    return (
      <div className={styles.panel}>
        <p className={styles.statusLine}>
          Fleet rules: <strong>{difficultyLabel(difficulty)}</strong>{" "}
          <button type="button" className={styles.linkButton} onClick={changeFleetRules}>
            change
          </button>
        </p>
        <PlacementEditor
          fleetSpec={fleetSpec}
          placements={placements}
          onChange={setPlacements}
          onReady={handleReady}
          readyLabel="Start battle"
          difficulty={difficulty}
        />
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <BattleUI
        difficulty={difficulty}
        myBoard={game.myBoard as Placement[]}
        myShots={game.myShots}
        oppShots={game.aiShots}
        opponentBoard={game.phase === "done" ? game.aiBoard : null}
        isMyTurn={game.turn === "me"}
        phase={game.phase === "done" ? "done" : "playing"}
        winner={game.winner === "me" ? "me" : game.winner === "ai" ? "opponent" : null}
        waitingLabel="Computer is thinking…"
        onFire={handleFire}
        onRematch={handleRematch}
        claimWinAvailable={false}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Online mode — room create/join + server-authoritative moves.
// ---------------------------------------------------------------------------

function OnlineGame() {
  const room = useGameRoom<BattleshipView>("battleship");
  const searchParams = useSearchParams();
  const autoJoinedRef = useRef(false);
  const [joinCode, setJoinCode] = useState("");
  const [createDifficulty, setCreateDifficulty] = useState<Difficulty>("easy");
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [committedFleet, setCommittedFleet] = useState<FleetSpec | null>(null);
  const [buildingFleet, setBuildingFleet] = useState<FleetSpec>([]);
  const lastViewJsonRef = useRef<string | null>(null);
  const lastViewChangeAtRef = useRef<number>(Date.now());
  const lastPhaseRef = useRef<string | null>(null);
  const [, forceClaimRecheck] = useState(0);

  useEffect(() => {
    const roomParam = searchParams.get("room");
    if (roomParam && !autoJoinedRef.current && room.status === "idle") {
      autoJoinedRef.current = true;
      void room.joinRoom(roomParam.toUpperCase());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, room.status]);

  // Track the last time the room's game-relevant state actually changed
  // (deep-compared, not just a new poll response object) so "claim win"
  // can be offered once the opponent has gone quiet for 3 minutes — the
  // hook itself doesn't expose this, so this component tracks it locally.
  useEffect(() => {
    if (!room.view) return;
    const json = JSON.stringify(room.view);
    if (json !== lastViewJsonRef.current) {
      lastViewJsonRef.current = json;
      lastViewChangeAtRef.current = Date.now();
    }
  }, [room.view]);

  // Reset local placement/fleet-builder state whenever a fresh round starts
  // (rematch flips the server phase back to "setup").
  useEffect(() => {
    const phase = room.view?.phase ?? null;
    if (phase === "setup" && lastPhaseRef.current === "done") {
      setPlacements([]);
      setCommittedFleet(null);
      setBuildingFleet([]);
    }
    lastPhaseRef.current = phase;
  }, [room.view?.phase]);

  // Re-render every few seconds so the 3-minute idle threshold above gets
  // re-evaluated even when nothing else changes (opponent gone silent).
  useEffect(() => {
    const id = setInterval(() => forceClaimRecheck((t) => t + 1), 5000);
    return () => clearInterval(id);
  }, []);

  // Proactive backend-availability probe: useGameRoom only learns "offline"
  // once an actual create/join/move is attempted, but the spec wants the
  // "warming up" message (and hidden room controls) as soon as the player
  // enters online mode — before they've clicked anything. `/api/games/state/`
  // checks Redis configuration before it even looks at query params, so an
  // empty-param GET is a side-effect-free 503 probe when unconfigured (and a
  // harmless 400 "bad request" when configured, still with no state written).
  const [backendProbe, setBackendProbe] = useState<"unknown" | "offline" | "available">("unknown");
  useEffect(() => {
    if (room.status !== "idle") return;
    let cancelled = false;
    fetch("/api/games/state/")
      .then((r) => {
        if (cancelled) return;
        setBackendProbe(r.status === 503 ? "offline" : "available");
      })
      .catch(() => {
        if (!cancelled) setBackendProbe("available"); // network hiccup — let real actions surface errors
      });
    return () => {
      cancelled = true;
    };
  }, [room.status]);

  const showOfflineNotice = room.status === "offline" || (room.status === "idle" && backendProbe === "offline");
  const showIdleRoomControls = room.status === "idle" && backendProbe === "available";

  if (showOfflineNotice) {
    return (
      <div className={styles.panel}>
        <p className={styles.offlineNotice}>
          Online play is warming up — try vs computer instead. (Multiplayer requires the arcade&apos;s backend to
          be configured.)
        </p>
      </div>
    );
  }

  if (room.status === "idle" && !showIdleRoomControls) {
    return (
      <div className={styles.panel}>
        <p className={styles.statusLine}>Checking connection…</p>
      </div>
    );
  }

  if (showIdleRoomControls || room.status === "creating" || room.status === "error") {
    return (
      <div className={styles.panel}>
        <p className={styles.statusLine}>Create a room and send a friend the invite link, or join theirs.</p>
        <DifficultyPicker onSelect={setCreateDifficulty} selected={createDifficulty} />
        <div className={styles.roomActions}>
          <button
            type="button"
            className={styles.primaryButton}
            disabled={room.status === "creating"}
            onClick={() => void room.createRoom({ difficulty: createDifficulty })}
          >
            Create room
          </button>
          <input
            className={styles.roomCodeInput}
            placeholder="CODE"
            maxLength={5}
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          />
          <button
            type="button"
            className={styles.secondaryButton}
            disabled={joinCode.length !== 5 || room.status === "creating"}
            onClick={() => void room.joinRoom(joinCode)}
          >
            Join room
          </button>
        </div>
        {room.error && <p className={styles.errorText}>{room.error}</p>}
      </div>
    );
  }

  if (room.status === "waiting") {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const fullInviteUrl = room.inviteUrl ? `${origin}${room.inviteUrl}` : "";
    return (
      <div className={styles.panel}>
        <p className={styles.statusLine}>Waiting for an opponent to join…</p>
        <div className={styles.roomCodeDisplay}>{room.roomId}</div>
        <div className={styles.inviteRow}>
          <span className={styles.inviteLinkText}>{room.inviteUrl}</span>
        </div>
        {fullInviteUrl && (
          <div className={styles.inviteShareRow}>
            <InviteShare url={fullInviteUrl} gameName="🚢 Battleship" buttonClassName={styles.secondaryButton} primaryButtonClassName={styles.primaryButton} />
          </div>
        )}
      </div>
    );
  }

  // "playing" — room.view is populated (server-authoritative BattleshipView).
  const view = room.view;
  if (!view) {
    return (
      <div className={styles.panel}>
        <p className={styles.statusLine}>Loading room…</p>
      </div>
    );
  }

  if (view.phase === "setup") {
    if (!view.myPlacementSet) {
      if (view.difficulty !== "easy" && !committedFleet) {
        return (
          <div className={styles.panel}>
            <FleetBuilder
              difficulty={view.difficulty}
              fleet={buildingFleet}
              onChange={setBuildingFleet}
              onConfirm={() => setCommittedFleet(buildingFleet)}
            />
          </div>
        );
      }
      const fleetSpec = view.difficulty === "easy" ? FLEET : (committedFleet as FleetSpec);
      return (
        <div className={styles.panel}>
          <PlacementEditor
            fleetSpec={fleetSpec}
            placements={placements}
            onChange={setPlacements}
            onReady={() => void room.sendMove({ kind: "placement", placements })}
            readyLabel="Submit fleet"
            difficulty={view.difficulty}
          />
          {room.error && <p className={styles.errorText}>{room.error}</p>}
        </div>
      );
    }
    return (
      <div className={styles.panel}>
        <p className={styles.statusLine}>
          Fleet submitted —{" "}
          {view.opponentPlacementSet ? "starting battle…" : "waiting for your opponent to place their fleet…"}
        </p>
      </div>
    );
  }

  const mySeat = room.seat;
  const isMyTurn = view.turn === mySeat;
  const winner: "me" | "opponent" | null = view.winner === null ? null : view.winner === mySeat ? "me" : "opponent";

  const canClaimWin =
    view.phase === "playing" &&
    mySeat !== null &&
    !isMyTurn &&
    Date.now() - lastViewChangeAtRef.current > CLAIM_WIN_IDLE_MS;

  return (
    <div className={styles.panel}>
      <BattleUI
        difficulty={view.difficulty}
        myBoard={view.myBoard ?? []}
        myShots={view.myShots}
        oppShots={view.opponentShots}
        opponentBoard={view.opponentBoard}
        isMyTurn={isMyTurn}
        phase={view.phase === "done" ? "done" : "playing"}
        winner={winner}
        waitingLabel="Waiting for opponent's move…"
        onFire={(cell) => void room.sendMove({ kind: "shot", cell })}
        onRematch={() => void room.sendMove({ kind: "rematch" })}
        onClaimWin={() => void room.sendMove({ kind: "claimWin" })}
        claimWinAvailable={canClaimWin}
      />
      {room.error && <p className={styles.errorText}>{room.error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page shell — mode selection + routing to ComputerGame / OnlineGame.
// ---------------------------------------------------------------------------

export default function BattleshipPage() {
  const [mode, setMode] = useState<Mode>(null);
  const [showHowTo, setShowHowTo] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("room")) setMode("online");
  }, [searchParams]);

  useEffect(() => {
    try {
      if (!localStorage.getItem(HOWTO_STORAGE_KEY)) setShowHowTo(true);
    } catch {
      /* localStorage unavailable — skip auto-open, button still works */
    }
  }, []);

  const closeHowTo = useCallback(() => {
    setShowHowTo(false);
    try {
      localStorage.setItem(HOWTO_STORAGE_KEY, "1");
    } catch {
      /* storage unavailable — modal just won't remember dismissal */
    }
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <nav className={styles.nav}>
          <Link href="/games" className={styles.backLink}>
            ← ARCADE
          </Link>
          <span className={styles.brand}>BATTLESHIP</span>
          <button type="button" className={styles.howToButton} onClick={() => setShowHowTo(true)}>
            How to play
          </button>
        </nav>

        <h1 className={styles.heading}>Sink the enemy fleet.</h1>

        {mode === null && (
          <div className={styles.modeGrid}>
            <button type="button" className={styles.modeCard} onClick={() => setMode("computer")}>
              <span className={styles.modeCardEmoji}>🖥️</span>
              vs Computer
            </button>
            <button type="button" className={styles.modeCard} onClick={() => setMode("online")}>
              <span className={styles.modeCardEmoji}>🌐</span>
              Online room
            </button>
          </div>
        )}

        {mode === "computer" && <ComputerGame />}
        {mode === "online" && <OnlineGame />}
      </div>
      <HowToModal open={showHowTo} onClose={closeHowTo} />
    </div>
  );
}
