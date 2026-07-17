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
type Highlight = "valid" | "invalid";

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
// "your fleet", and "enemy waters" boards alike. `highlightCells` overlays a
// valid/invalid drag-preview on top of the normal cell states (used only by
// the placement board while a ship is being dragged).
// ---------------------------------------------------------------------------

function BoardGrid({
  grid,
  onCellClick,
  interactive,
  ariaLabel,
  highlightCells,
}: {
  grid: CellState[][];
  onCellClick?: (row: number, col: number) => void;
  interactive: boolean;
  ariaLabel: string;
  highlightCells?: Map<string, Highlight>;
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
            const highlight = highlightCells?.get(cellKey(r, c));
            const highlightClass =
              highlight === "valid" ? styles.cell_highlightValid : highlight === "invalid" ? styles.cell_highlightInvalid : "";
            return (
              <button
                key={c}
                type="button"
                role="gridcell"
                data-row={r}
                data-col={c}
                data-state={cellState}
                disabled={disabled}
                className={`${styles.cell} ${stateClass} ${highlightClass}`}
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

type DragVisual = {
  name: string;
  size: number;
  horizontal: boolean;
  x: number;
  y: number;
  hoverCell: { row: number; col: number } | null;
  valid: boolean;
};

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
  const sessionRef = useRef<DragSession | null>(null);
  const shakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [drag, setDrag] = useState<DragVisual | null>(null);
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

  const cellFromPoint = useCallback((clientX: number, clientY: number): { row: number; col: number } | null => {
    const el = boardRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    if (clientX < rect.left || clientX >= rect.right || clientY < rect.top || clientY >= rect.bottom) return null;
    const col = Math.floor(((clientX - rect.left) / rect.width) * BOARD_SIZE);
    const row = Math.floor(((clientY - rect.top) / rect.height) * BOARD_SIZE);
    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return null;
    return { row, col };
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
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const session = sessionRef.current;
      if (!session || e.pointerId !== session.pointerId) return;
      const dx = e.clientX - session.startX;
      const dy = e.clientY - session.startY;
      if (!session.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD_PX) {
        session.moved = true;
        if (session.source === "board") setDraggingName(session.name);
      }
      if (!session.moved) return;

      const hoverCell = cellFromPoint(e.clientX, e.clientY);
      const others = session.source === "board" ? placements.filter((p) => p.name !== session.name) : placements;
      let valid = false;
      if (hoverCell) {
        const candidate: Placement = { name: session.name, size: session.size, row: hoverCell.row, col: hoverCell.col, horizontal: session.horizontal };
        valid = candidateValid(candidate, others);
      }
      setDrag({ name: session.name, size: session.size, horizontal: session.horizontal, x: e.clientX, y: e.clientY, hoverCell, valid });
    },
    [cellFromPoint, placements]
  );

  const endDrag = useCallback(
    (e: { pointerId: number; clientX: number; clientY: number }) => {
      const session = sessionRef.current;
      if (!session || e.pointerId !== session.pointerId) return;
      sessionRef.current = null;
      const wasMoved = session.moved;
      setDrag(null);
      setDraggingName(null);

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

      const hoverCell = cellFromPoint(e.clientX, e.clientY);
      const others = placements.filter((p) => p.name !== session.name);
      if (hoverCell) {
        const candidate: Placement = { name: session.name, size: session.size, row: hoverCell.row, col: hoverCell.col, horizontal: session.horizontal };
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
        setDrag((prev) => {
          if (!prev) return prev;
          const others = session.source === "board" ? placements.filter((p) => p.name !== session.name) : placements;
          let valid = false;
          if (prev.hoverCell) {
            const candidate: Placement = { name: session.name, size: session.size, row: prev.hoverCell.row, col: prev.hoverCell.col, horizontal: session.horizontal };
            valid = candidateValid(candidate, others);
          }
          return { ...prev, horizontal: session.horizontal, valid };
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

  const grid = shipGrid(placements.filter((p) => p.name !== draggingName));
  const highlightCells = useMemo(() => {
    if (!drag || !drag.hoverCell) return undefined;
    const candidate: Placement = { name: drag.name, size: drag.size, row: drag.hoverCell.row, col: drag.hoverCell.col, horizontal: drag.horizontal };
    const map = new Map<string, Highlight>();
    for (const cell of cellsForPlacement(candidate)) {
      const [r, c] = parseCellKey(cell);
      if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
        map.set(cell, drag.valid ? "valid" : "invalid");
      }
    }
    return map;
  }, [drag]);

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
                    setDrag({ name: ship.name, size: ship.size, horizontal, x: e.clientX, y: e.clientY, hoverCell: null, valid: false });
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
            <BoardGrid grid={grid} interactive={false} ariaLabel="Fleet placement board" highlightCells={highlightCells} />
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

      {drag && (
        <div className={styles.dragGhost} style={{ left: drag.x, top: drag.y }} aria-hidden="true">
          <div className={styles.ghostCells} style={{ flexDirection: drag.horizontal ? "row" : "column" }}>
            {Array.from({ length: drag.size }).map((_, i) => (
              <span key={i} className={`${styles.ghostCell} ${drag.hoverCell ? (drag.valid ? styles.ghostCellValid : styles.ghostCellInvalid) : ""}`} />
            ))}
          </div>
        </div>
      )}
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
