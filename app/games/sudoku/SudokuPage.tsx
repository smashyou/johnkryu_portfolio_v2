"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "./sudoku.module.css";
import {
  type Difficulty,
  dailyNumber,
  dailySeed,
  generate,
  isBoardSolved,
  mulberry32,
} from "../lib/sudoku";

type Mode = Difficulty | "daily";

type PencilMarks = (Set<number> | null)[];

type GameState = {
  puzzle: number[];
  solution: number[];
  board: number[];
  pencil: PencilMarks;
  history: { board: number[]; pencil: PencilMarks }[];
  elapsed: number;
  completed: boolean;
  finalTime: number | null;
};

const MODES: { key: Mode; label: string }[] = [
  { key: "daily", label: "DAILY" },
  { key: "easy", label: "EASY" },
  { key: "medium", label: "MEDIUM" },
  { key: "hard", label: "HARD" },
];

const DAILY_DIFFICULTY: Difficulty = "medium";
const HISTORY_LIMIT = 50;

function makeGame(mode: Mode): GameState {
  const difficulty: Difficulty = mode === "daily" ? DAILY_DIFFICULTY : mode;
  const seed =
    mode === "daily"
      ? dailySeed(new Date())
      : (Math.floor(Math.random() * 0xffffffff) ^ Date.now()) >>> 0;
  const rng = mulberry32(seed);
  const { puzzle, solution } = generate(difficulty, rng);

  return {
    puzzle,
    solution,
    board: puzzle.slice(),
    pencil: new Array(81).fill(null) as PencilMarks,
    history: [],
    elapsed: 0,
    completed: false,
    finalTime: null,
  };
}

function togglePencilMark(pencil: PencilMarks, idx: number, digit: number): PencilMarks {
  const next = pencil.slice();
  const existing = next[idx];
  const set = existing ? new Set(existing) : new Set<number>();
  if (set.has(digit)) {
    set.delete(digit);
  } else {
    set.add(digit);
  }
  next[idx] = set.size ? set : null;
  return next;
}

function clearPencilForCell(pencil: PencilMarks, idx: number): PencilMarks {
  if (!pencil[idx]) return pencil;
  const next = pencil.slice();
  next[idx] = null;
  return next;
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function bestTimeKey(mode: Mode): string {
  return `jkr_sudoku_best_${mode}`;
}

export default function SudokuPage() {
  const [mode, setMode] = useState<Mode>("daily");
  const [games, setGames] = useState<Partial<Record<Mode, GameState>>>({});
  const [selected, setSelected] = useState<number | null>(null);
  const [pencilMode, setPencilMode] = useState(false);
  const [mistakeMode, setMistakeMode] = useState(false);
  const [bestTimes, setBestTimes] = useState<Partial<Record<Mode, number>>>({});
  const [dismissed, setDismissed] = useState<Partial<Record<Mode, boolean>>>({});
  const [copied, setCopied] = useState(false);

  const cur = games[mode];

  // Lazily create a puzzle for each mode the first time it's visited.
  // Runs client-only (Date/Math.random are non-deterministic across
  // server/client render), so the board never causes a hydration mismatch.
  useEffect(() => {
    setGames((g) => (g[mode] ? g : { ...g, [mode]: makeGame(mode) }));
  }, [mode]);

  // Load best times from localStorage once on mount.
  useEffect(() => {
    try {
      const loaded: Partial<Record<Mode, number>> = {};
      for (const { key } of MODES) {
        const raw = localStorage.getItem(bestTimeKey(key));
        if (raw != null) loaded[key] = Number(raw);
      }
      setBestTimes(loaded);
    } catch {
      // localStorage unavailable (private mode / disabled) — best times
      // simply won't persist this session.
    }
  }, []);

  // Timer: ticks once per second for whichever mode is active, no-ops
  // once that mode's game is completed.
  useEffect(() => {
    const id = setInterval(() => {
      setGames((g) => {
        const active = g[mode];
        if (!active || active.completed) return g;
        return { ...g, [mode]: { ...active, elapsed: active.elapsed + 1 } };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [mode]);

  // Persist a new best time when a game transitions to completed.
  useEffect(() => {
    if (!cur || !cur.completed || cur.finalTime == null) return;
    const key = bestTimeKey(mode);
    try {
      const raw = localStorage.getItem(key);
      const prevBest = raw != null ? Number(raw) : null;
      if (prevBest === null || cur.finalTime < prevBest) {
        localStorage.setItem(key, String(cur.finalTime));
        setBestTimes((b) => ({ ...b, [mode]: cur.finalTime as number }));
      } else if (bestTimes[mode] !== prevBest) {
        setBestTimes((b) => ({ ...b, [mode]: prevBest }));
      }
    } catch {
      // ignore — best time just won't be saved this session
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, cur?.completed, cur?.finalTime]);

  function applyValue(idx: number, digit: number) {
    setGames((g) => {
      const active = g[mode];
      if (!active || active.completed) return g;
      if (active.puzzle[idx] !== 0) return g;

      const historyEntry = { board: active.board, pencil: active.pencil };
      let board = active.board;
      let pencil = active.pencil;

      if (pencilMode) {
        if (active.board[idx] !== 0) return g;
        pencil = togglePencilMark(active.pencil, idx, digit);
      } else {
        board = active.board.slice();
        board[idx] = digit;
        pencil = clearPencilForCell(active.pencil, idx);
      }

      const history = [...active.history, historyEntry].slice(-HISTORY_LIMIT);
      const completedNow = !pencilMode && isBoardSolved(board, active.solution);

      return {
        ...g,
        [mode]: {
          ...active,
          board,
          pencil,
          history,
          completed: active.completed || completedNow,
          finalTime: completedNow ? active.elapsed : active.finalTime,
        },
      };
    });
  }

  function clearCell(idx: number) {
    setGames((g) => {
      const active = g[mode];
      if (!active || active.completed) return g;
      if (active.puzzle[idx] !== 0) return g;
      if (active.board[idx] === 0 && !active.pencil[idx]) return g;

      const historyEntry = { board: active.board, pencil: active.pencil };
      const board = active.board.slice();
      board[idx] = 0;
      const pencil = clearPencilForCell(active.pencil, idx);
      const history = [...active.history, historyEntry].slice(-HISTORY_LIMIT);

      return { ...g, [mode]: { ...active, board, pencil, history } };
    });
  }

  function undo() {
    setGames((g) => {
      const active = g[mode];
      if (!active || active.history.length === 0) return g;
      const prev = active.history[active.history.length - 1];
      const history = active.history.slice(0, -1);
      return {
        ...g,
        [mode]: {
          ...active,
          board: prev.board,
          pencil: prev.pencil,
          history,
          completed: false,
          finalTime: null,
        },
      };
    });
    setDismissed((d) => ({ ...d, [mode]: false }));
  }

  function newGame() {
    if (mode === "daily") return;
    setGames((g) => ({ ...g, [mode]: makeGame(mode) }));
    setSelected(null);
    setDismissed((d) => ({ ...d, [mode]: false }));
  }

  function dismissOverlay() {
    setDismissed((d) => ({ ...d, [mode]: true }));
  }

  function moveSelection(dr: number, dc: number) {
    setSelected((sel) => {
      const base = sel ?? 0;
      const row = Math.max(0, Math.min(8, Math.floor(base / 9) + dr));
      const col = Math.max(0, Math.min(8, (base % 9) + dc));
      return row * 9 + col;
    });
  }

  // Keyboard input: digits enter values (or pencil marks in pencil mode),
  // Backspace/Delete/0 clears, arrows move the selection, "p" toggles
  // pencil mode. Registered at window level so focus doesn't need to sit
  // on any particular cell.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!cur) return;
      if (e.key >= "1" && e.key <= "9") {
        if (selected != null) applyValue(selected, Number(e.key));
        e.preventDefault();
      } else if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") {
        if (selected != null) clearCell(selected);
        e.preventDefault();
      } else if (e.key === "ArrowUp") {
        moveSelection(-1, 0);
        e.preventDefault();
      } else if (e.key === "ArrowDown") {
        moveSelection(1, 0);
        e.preventDefault();
      } else if (e.key === "ArrowLeft") {
        moveSelection(0, -1);
        e.preventDefault();
      } else if (e.key === "ArrowRight") {
        moveSelection(0, 1);
        e.preventDefault();
      } else if (e.key.toLowerCase() === "p") {
        setPencilMode((p) => !p);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur, selected, mode, pencilMode]);

  const shareSnippet = useMemo(() => {
    if (!cur || !cur.completed || cur.finalTime == null) return "";
    return `Sudoku #${dailyNumber(new Date())} — ${formatTime(
      cur.finalTime
    )} — johnkryu.vercel.app/games/sudoku`;
  }, [cur]);

  async function handleShare() {
    if (!shareSnippet) return;
    try {
      if (!navigator.clipboard?.writeText) throw new Error("no clipboard api");
      await navigator.clipboard.writeText(shareSnippet);
    } catch {
      // Fallback path for browsers/contexts without Clipboard API access
      // (older mobile browsers, non-HTTPS dev, or automated test runners).
      const el = document.createElement("textarea");
      el.value = shareSnippet;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.focus();
      el.select();
      try {
        document.execCommand("copy");
      } catch {
        // Nothing more we can do — the snippet is still visible on screen.
      }
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const selRow = selected != null ? Math.floor(selected / 9) : null;
  const selCol = selected != null ? selected % 9 : null;
  const selBox =
    selected != null
      ? Math.floor(Math.floor(selected / 9) / 3) * 3 + Math.floor((selected % 9) / 3)
      : null;
  const selectedValue = selected != null && cur ? cur.board[selected] : 0;

  const showOverlay = !!cur?.completed && !dismissed[mode];

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <nav className={styles.nav}>
          <span className={styles.brand}>THE ARCADE</span>
          <Link href="/games" className={styles.backLink}>
            ← ARCADE
          </Link>
        </nav>

        <div className={styles.hero}>
          <h1 className={styles.heading}>Sudoku</h1>
          <p className={styles.lead}>
            Solo puzzle. Pencil marks, mistake highlighting, and a daily seeded
            board everyone gets the same copy of.
          </p>
        </div>

        <div className={styles.controls}>
          <div className={styles.tabs}>
            {MODES.map((m) => (
              <button
                key={m.key}
                type="button"
                className={`${styles.tab} ${mode === m.key ? styles.tabActive : ""}`}
                onClick={() => {
                  setMode(m.key);
                  setSelected(null);
                }}
              >
                {m.label}
                {m.key === "daily" ? ` #${dailyNumber(new Date())}` : ""}
              </button>
            ))}
          </div>

          <div className={styles.toolbar}>
            <button
              type="button"
              className={`${styles.toggleButton} ${pencilMode ? styles.toggleActive : ""}`}
              onClick={() => setPencilMode((p) => !p)}
              aria-pressed={pencilMode}
            >
              PENCIL
            </button>
            <button
              type="button"
              className={`${styles.toggleButton} ${mistakeMode ? styles.toggleActive : ""}`}
              onClick={() => setMistakeMode((m) => !m)}
              aria-pressed={mistakeMode}
            >
              MISTAKES
            </button>
            <button
              type="button"
              className={styles.iconButton}
              onClick={undo}
              disabled={!cur || cur.history.length === 0}
            >
              UNDO
            </button>
            {mode !== "daily" && (
              <button type="button" className={styles.iconButton} onClick={newGame}>
                NEW GAME
              </button>
            )}
            <span className={styles.timer}>{formatTime(cur?.elapsed ?? 0)}</span>
          </div>

          {bestTimes[mode] != null && (
            <span className={styles.lead}>
              Best ({mode}): {formatTime(bestTimes[mode] as number)}
            </span>
          )}
        </div>

        <div className={styles.boardWrap}>
          {!cur ? (
            <div className={styles.loading}>Generating puzzle…</div>
          ) : (
            <div className={styles.board}>
              {cur.board.map((val, idx) => {
                const row = Math.floor(idx / 9);
                const col = idx % 9;
                const box = Math.floor(row / 3) * 3 + Math.floor(col / 3);
                const isClue = cur.puzzle[idx] !== 0;
                const isSelected = selected === idx;
                const isPeer =
                  selected != null &&
                  idx !== selected &&
                  (row === selRow || col === selCol || box === selBox);
                const isSameValue =
                  selected != null &&
                  idx !== selected &&
                  val !== 0 &&
                  selectedValue !== 0 &&
                  val === selectedValue;
                const isWrong =
                  mistakeMode && !isClue && val !== 0 && val !== cur.solution[idx];
                const marks = cur.pencil[idx];

                const classNames = [styles.cell];
                if (col % 3 === 2 && col !== 8) classNames.push(styles.thickRight);
                if (row % 3 === 2 && row !== 8) classNames.push(styles.thickBottom);
                if (isClue) classNames.push(styles.cellClue);
                if (isPeer) classNames.push(styles.cellPeer);
                if (isSameValue) classNames.push(styles.cellSameValue);
                if (isSelected) classNames.push(styles.cellSelected);
                if (isWrong) classNames.push(styles.cellWrong);

                return (
                  <button
                    key={idx}
                    type="button"
                    className={classNames.join(" ")}
                    onClick={() => setSelected(idx)}
                    aria-label={`Row ${row + 1}, column ${col + 1}${
                      val !== 0 ? `, value ${val}` : ", empty"
                    }`}
                  >
                    {val !== 0 ? (
                      val
                    ) : marks ? (
                      <span className={styles.pencilGrid}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
                          <span
                            key={d}
                            className={`${styles.pencilDigit} ${
                              marks.has(d) ? styles.pencilDigitActive : ""
                            }`}
                          >
                            {marks.has(d) ? d : ""}
                          </span>
                        ))}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className={styles.numberPad}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
            <button
              key={d}
              type="button"
              className={styles.numberButton}
              onClick={() => selected != null && applyValue(selected, d)}
              disabled={selected == null}
            >
              {d}
            </button>
          ))}
          <button
            type="button"
            className={styles.eraseButton}
            onClick={() => selected != null && clearCell(selected)}
            disabled={selected == null}
          >
            ERASE
          </button>
        </div>

        {showOverlay && cur && (
          <div className={styles.overlay}>
            <div className={styles.overlayCard}>
              <p className={styles.overlayKicker}>SOLVED</p>
              <p className={styles.overlayTime}>{formatTime(cur.finalTime ?? cur.elapsed)}</p>
              {bestTimes[mode] != null && (
                <p className={styles.overlayBest}>
                  Best: {formatTime(bestTimes[mode] as number)}
                  {bestTimes[mode] === cur.finalTime ? " — new best!" : ""}
                </p>
              )}

              {mode === "daily" && (
                <div className={styles.shareBox}>
                  <code className={styles.shareSnippet}>{shareSnippet}</code>
                  <button type="button" className={styles.shareButton} onClick={handleShare}>
                    {copied ? "Copied!" : "Copy & Share"}
                  </button>
                </div>
              )}

              <div className={styles.overlayActions}>
                {mode !== "daily" && (
                  <button type="button" className={styles.newGameButton} onClick={newGame}>
                    New Game
                  </button>
                )}
                <button type="button" className={styles.closeButton} onClick={dismissOverlay}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
