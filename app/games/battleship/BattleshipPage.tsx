"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  BOARD_SIZE,
  FLEET,
  cellKey,
  cellsForPlacement,
  parseCellKey,
  shoot,
  validatePlacement,
  type Placement,
} from "@/app/games/lib/battleship";
import { nextShot, randomPlacement } from "@/app/games/lib/battleshipAi";
import { useGameRoom } from "@/app/games/lib/useGameRoom";
import type { BattleshipView, ShotRecord } from "@/app/games/lib/server/battleshipGame";
import styles from "./battleship.module.css";

type Mode = "computer" | "online" | null;
type CellState = "empty" | "ship" | "hit" | "miss";

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

function canPlace(existing: Placement[], candidate: Placement): boolean {
  const ship = FLEET.find((f) => f.name === candidate.name);
  if (!ship) return false;
  if (candidate.horizontal && candidate.col + ship.size > BOARD_SIZE) return false;
  if (!candidate.horizontal && candidate.row + ship.size > BOARD_SIZE) return false;
  if (candidate.row < 0 || candidate.col < 0) return false;
  const cells = cellsForPlacement(candidate);
  const occupied = new Set(existing.flatMap((p) => cellsForPlacement(p)));
  return cells.every((c) => !occupied.has(c));
}

// ---------------------------------------------------------------------------
// Board grid — shared read/interactive board rendering for placement,
// "your fleet", and "enemy waters" boards alike.
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

function FleetTray({ label, sunkNames }: { label: string; sunkNames: Set<string> }) {
  return (
    <div className={styles.fleetTray}>
      <span className={styles.fleetTrayLabel}>{label}</span>
      <div className={styles.fleetChips}>
        {FLEET.map((ship) => (
          <span
            key={ship.name}
            className={`${styles.fleetChip} ${sunkNames.has(ship.name) ? styles.fleetChipSunk : ""}`}
          >
            {ship.name}
          </span>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Placement editor — shared between vs-computer and online setup.
// ---------------------------------------------------------------------------

function PlacementEditor({
  placements,
  onChange,
  onReady,
  readyLabel,
}: {
  placements: Placement[];
  onChange: (next: Placement[]) => void;
  onReady: () => void;
  readyLabel: string;
}) {
  const [horizontal, setHorizontal] = useState(true);
  const placedNames = useMemo(() => new Set(placements.map((p) => p.name)), [placements]);
  const firstUnplaced = FLEET.find((f) => !placedNames.has(f.name)) ?? null;
  const [selectedShipName, setSelectedShipName] = useState<string | null>(firstUnplaced?.name ?? null);

  const grid = shipGrid(placements);
  const ready = validatePlacement(placements);

  function selectShip(name: string) {
    if (placedNames.has(name)) {
      // Tapping a placed ship's chip picks it back up for re-placement.
      onChange(placements.filter((p) => p.name !== name));
      setSelectedShipName(name);
    } else {
      setSelectedShipName(name);
    }
  }

  function onCellClick(row: number, col: number) {
    const key = cellKey(row, col);
    const existingShip = placements.find((p) => cellsForPlacement(p).includes(key));
    if (existingShip) {
      onChange(placements.filter((p) => p.name !== existingShip.name));
      setSelectedShipName(existingShip.name);
      return;
    }
    if (!selectedShipName) return;
    const candidate: Placement = { name: selectedShipName, row, col, horizontal };
    if (!canPlace(placements, candidate)) return;
    const updated = [...placements, candidate];
    onChange(updated);
    const placedAfter = new Set(updated.map((p) => p.name));
    const next = FLEET.find((f) => !placedAfter.has(f.name));
    setSelectedShipName(next ? next.name : null);
  }

  function handleRandom() {
    onChange(randomPlacement(Math.random));
    setSelectedShipName(null);
  }

  function handleClear() {
    onChange([]);
    setSelectedShipName(FLEET[0].name);
  }

  return (
    <div>
      <p className={styles.statusLine}>
        Tap a cell to place the <strong>{selectedShipName ?? "—"}</strong> ({horizontal ? "horizontal" : "vertical"}
        ). Tap a placed ship to pick it back up.
      </p>
      <div className={styles.shipChips}>
        {FLEET.map((ship) => (
          <button
            key={ship.name}
            type="button"
            className={`${styles.shipChip} ${selectedShipName === ship.name ? styles.shipChipSelected : ""} ${
              placedNames.has(ship.name) ? styles.shipChipPlaced : ""
            }`}
            onClick={() => selectShip(ship.name)}
          >
            {ship.name} ({ship.size})
          </button>
        ))}
      </div>
      <div className={styles.placementControls}>
        <button type="button" className={styles.secondaryButton} onClick={() => setHorizontal((h) => !h)}>
          Rotate ({horizontal ? "H" : "V"})
        </button>
        <button type="button" className={styles.secondaryButton} onClick={handleRandom}>
          Random placement
        </button>
        <button type="button" className={styles.secondaryButton} onClick={handleClear}>
          Clear
        </button>
      </div>
      <div className={styles.boardBlock}>
        <BoardGrid grid={grid} onCellClick={onCellClick} interactive ariaLabel="Fleet placement board" />
      </div>
      <div className={styles.placementControls} style={{ marginTop: 16 }}>
        <button type="button" className={styles.primaryButton} disabled={!ready} onClick={onReady}>
          {readyLabel}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Battle UI — mode-agnostic rendering of the dual-board fight once both
// fleets are placed. Both vs-computer and online drive this with normalized
// props so the JSX (and its Playwright selectors) stay identical either way.
// ---------------------------------------------------------------------------

type BattleUIProps = {
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
  claimWinError?: string | null;
};

function BattleUI({
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
  claimWinError,
}: BattleUIProps) {
  const [log, setLog] = useState<string[]>([]);
  const myShotsLenRef = useRef(0);
  const oppShotsLenRef = useRef(0);

  useEffect(() => {
    if (myShots.length > myShotsLenRef.current) {
      const fresh = myShots.slice(myShotsLenRef.current);
      myShotsLenRef.current = myShots.length;
      const messages = fresh.filter((s) => s.sunk).map((s) => `You sank the enemy ${s.sunk}!`);
      if (messages.length) setLog((prev) => [...prev, ...messages]);
    }
  }, [myShots]);

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
          <BoardGrid
            grid={trackingGrid}
            onCellClick={onTrackingClick}
            interactive={trackingInteractive}
            ariaLabel="Enemy waters — your shots"
          />
          <FleetTray label="Enemy fleet" sunkNames={enemySunk} />
        </div>

        <div className={styles.boardBlock}>
          <span className={styles.boardLabel}>YOUR FLEET</span>
          <BoardGrid grid={myGrid} interactive={false} ariaLabel="Your fleet — incoming shots" />
          <FleetTray label="Your fleet" sunkNames={mySunk} />
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
      {claimWinError && <p className={styles.errorText}>{claimWinError}</p>}
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
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [game, setGame] = useState<LocalGame>(initialLocalGame);

  function handleReady() {
    if (!validatePlacement(placements)) return;
    const aiBoard = randomPlacement(Math.random);
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

  if (game.phase === "setup") {
    return (
      <div className={styles.panel}>
        <PlacementEditor
          placements={placements}
          onChange={setPlacements}
          onReady={handleReady}
          readyLabel="Start battle"
        />
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <BattleUI
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
  const [copied, setCopied] = useState(false);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [claimWinError, setClaimWinError] = useState<string | null>(null);

  useEffect(() => {
    const roomParam = searchParams.get("room");
    if (roomParam && !autoJoinedRef.current && room.status === "idle") {
      autoJoinedRef.current = true;
      void room.joinRoom(roomParam.toUpperCase());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, room.status]);

  const copyInvite = useCallback(() => {
    if (!room.inviteUrl) return;
    const fullUrl = `${window.location.origin}${room.inviteUrl}`;
    void navigator.clipboard.writeText(fullUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [room.inviteUrl]);

  async function handleClaimWin() {
    setClaimWinError(null);
    const ok = await room.sendMove({ kind: "claimWin" });
    if (!ok && room.error) setClaimWinError(room.error);
  }

  if (room.status === "offline") {
    return (
      <div className={styles.panel}>
        <p className={styles.offlineNotice}>
          Online play is warming up — try vs computer instead. (Multiplayer requires the arcade&apos;s backend to
          be configured.)
        </p>
      </div>
    );
  }

  if (room.status === "idle" || room.status === "creating" || room.status === "error") {
    return (
      <div className={styles.panel}>
        <p className={styles.statusLine}>Create a room and send a friend the invite link, or join theirs.</p>
        <div className={styles.roomActions}>
          <button
            type="button"
            className={styles.primaryButton}
            disabled={room.status === "creating"}
            onClick={() => void room.createRoom()}
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
    return (
      <div className={styles.panel}>
        <p className={styles.statusLine}>Waiting for an opponent to join…</p>
        <div className={styles.roomCodeDisplay}>{room.roomId}</div>
        <div className={styles.inviteRow}>
          <span className={styles.inviteLinkText}>{room.inviteUrl}</span>
          <button type="button" className={styles.secondaryButton} onClick={copyInvite}>
            {copied ? "Copied!" : "Copy invite link"}
          </button>
        </div>
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
      return (
        <div className={styles.panel}>
          <PlacementEditor
            placements={placements}
            onChange={setPlacements}
            onReady={() => void room.sendMove({ kind: "placement", placements })}
            readyLabel="Submit fleet"
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

  return (
    <div className={styles.panel}>
      <BattleUI
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
        onClaimWin={handleClaimWin}
        claimWinAvailable={!isMyTurn}
        claimWinError={claimWinError}
      />
      {room.error && !claimWinError && <p className={styles.errorText}>{room.error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page shell — mode selection + routing to ComputerGame / OnlineGame.
// ---------------------------------------------------------------------------

export default function BattleshipPage() {
  const [mode, setMode] = useState<Mode>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("room")) setMode("online");
  }, [searchParams]);

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <nav className={styles.nav}>
          <Link href="/games" className={styles.backLink}>
            ← ARCADE
          </Link>
          <span className={styles.brand}>BATTLESHIP</span>
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
    </div>
  );
}
