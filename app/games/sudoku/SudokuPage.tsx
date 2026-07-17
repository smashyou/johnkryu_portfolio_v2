"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
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

// ---------------------------------------------------------------------------
// Leaderboard (R4): daily board keyed by today's dailyNumber, all-time
// boards keyed per difficulty. See app/games/lib/server/leaderboard.ts for
// the server-side identity/validation rules this client mirrors loosely
// (client-side checks are just UX guardrails — the server re-validates
// everything).
// ---------------------------------------------------------------------------

type LeaderboardScope = "daily" | "alltime";

type LeaderboardEntry = {
  rank: number;
  name: string;
  location?: string;
  timeMs: number;
};

type LeaderboardResponse = {
  entries: LeaderboardEntry[];
  total: number;
  me?: { rank: number; timeMs: number };
};

const IDENTITY_KEY = "jkr_sudoku_identity";
const SUBMIT_NAME_KEY = "jkr_sudoku_name";
const SUBMIT_USE_IP_KEY = "jkr_sudoku_use_ip";
const SUBMIT_LOCATION_KEY = "jkr_sudoku_location";
// Opt-out (name+location) identities are ownership-protected server-side:
// the first submission for a given name+location mints this token and the
// server only accepts later submissions for that same identity if they
// present it back. Never used/needed for the useIp=true path.
const ENTRY_TOKEN_KEY = "jkr_sudoku_entry_token";
const HOWTO_KEY = "jkr_howto_sudoku";

type FetchOutcome =
  | { ok: true; data: LeaderboardResponse }
  | { ok: false; warming: boolean };

async function fetchLeaderboard(
  scope: LeaderboardScope,
  opts: { day?: number; difficulty?: Difficulty; me?: string | null }
): Promise<FetchOutcome> {
  try {
    const params = new URLSearchParams({ scope });
    if (opts.day != null) params.set("day", String(opts.day));
    if (opts.difficulty) params.set("difficulty", opts.difficulty);
    if (opts.me) params.set("me", opts.me);
    const res = await fetch(`/api/sudoku/leaderboard/?${params.toString()}`);
    if (res.status === 503) return { ok: false, warming: true };
    if (!res.ok) return { ok: false, warming: false };
    const data = (await res.json()) as LeaderboardResponse;
    return { ok: true, data };
  } catch {
    return { ok: false, warming: true };
  }
}

type SubmitBody = {
  scope: LeaderboardScope;
  day?: number;
  difficulty?: Difficulty;
  name: string;
  timeMs: number;
  useIp: boolean;
  location?: string;
  entryToken?: string;
};

type SubmitOutcome =
  | { ok: true; identity: string; rank: number; total: number; entryToken?: string }
  | { ok: false; warming: boolean; nameTaken?: boolean };

async function submitScore(body: SubmitBody): Promise<SubmitOutcome> {
  try {
    const res = await fetch("/api/sudoku/leaderboard/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.status === 503) return { ok: false, warming: true };
    if (res.status === 409) return { ok: false, warming: false, nameTaken: true };
    if (!res.ok) return { ok: false, warming: false };
    const data = (await res.json()) as {
      identity: string;
      rank: number;
      total: number;
      entryToken?: string;
    };
    return { ok: true, ...data };
  } catch {
    return { ok: false, warming: true };
  }
}

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

function LeaderboardList({
  entries,
  meRank,
}: {
  entries: LeaderboardEntry[];
  meRank?: number;
}) {
  if (entries.length === 0) {
    return <p className={styles.lbEmpty}>No times yet — be the first!</p>;
  }
  return (
    <ol className={styles.lbList}>
      {entries.map((entry) => (
        <li
          key={entry.rank}
          className={`${styles.lbRow} ${entry.rank === meRank ? styles.lbRowMe : ""}`}
        >
          <span className={styles.lbRank}>#{entry.rank}</span>
          <span className={styles.lbName}>
            {entry.name}
            {entry.location ? (
              <span className={styles.lbLocation}> · {entry.location}</span>
            ) : null}
          </span>
          <span className={styles.lbTime}>{formatTime(Math.round(entry.timeMs / 1000))}</span>
        </li>
      ))}
    </ol>
  );
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

  // How-to-play overlay (R2): auto-opens on first visit, remembered via
  // localStorage so it never auto-opens again on this device.
  const [howtoOpen, setHowtoOpen] = useState(false);

  // Leaderboard submit form (R4), lives inside the completion overlay.
  const [identity, setIdentity] = useState<string | null>(null);
  const [entryToken, setEntryToken] = useState<string | null>(null);
  const [submitName, setSubmitName] = useState("");
  const [submitUseIp, setSubmitUseIp] = useState(true);
  const [submitLocation, setSubmitLocation] = useState("");
  const [submitPhase, setSubmitPhase] = useState<
    "form" | "submitting" | "success" | "warming" | "invalid" | "taken"
  >("form");
  const [submitBoard, setSubmitBoard] = useState<LeaderboardResponse | null>(null);

  // Leaderboard panel (R4): standalone Daily/All-time viewer.
  const [lbOpen, setLbOpen] = useState(false);
  const [lbScope, setLbScope] = useState<LeaderboardScope>("daily");
  const [lbDifficulty, setLbDifficulty] = useState<Difficulty>("medium");
  const [lbData, setLbData] = useState<LeaderboardResponse | null>(null);
  const [lbPhase, setLbPhase] = useState<"idle" | "loading" | "ready" | "warming" | "error">(
    "idle"
  );

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

  // Load leaderboard identity/prefill data, and decide whether the how-to
  // overlay should auto-open (first visit only, per device).
  useEffect(() => {
    try {
      const storedIdentity = localStorage.getItem(IDENTITY_KEY);
      if (storedIdentity) setIdentity(storedIdentity);
      const storedName = localStorage.getItem(SUBMIT_NAME_KEY);
      if (storedName) setSubmitName(storedName);
      const storedUseIp = localStorage.getItem(SUBMIT_USE_IP_KEY);
      if (storedUseIp != null) setSubmitUseIp(storedUseIp !== "false");
      const storedLocation = localStorage.getItem(SUBMIT_LOCATION_KEY);
      if (storedLocation) setSubmitLocation(storedLocation);
      const storedEntryToken = localStorage.getItem(ENTRY_TOKEN_KEY);
      if (storedEntryToken) setEntryToken(storedEntryToken);

      if (!localStorage.getItem(HOWTO_KEY)) setHowtoOpen(true);
    } catch {
      // localStorage unavailable — how-to just won't auto-open, and
      // leaderboard prefs won't persist across visits.
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

  function closeHowto() {
    setHowtoOpen(false);
    try {
      localStorage.setItem(HOWTO_KEY, "1");
    } catch {
      // localStorage unavailable — it'll just auto-open again next visit.
    }
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
      // A modal is up front — don't let digit/arrow keys leak through to
      // the board underneath while how-to or the leaderboard panel is open.
      if (howtoOpen || lbOpen) return;
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
  }, [cur, selected, mode, pencilMode, howtoOpen, lbOpen]);

  // Escape closes whichever overlay is currently on top (how-to takes
  // priority over the leaderboard panel, matching stacking order below).
  useEffect(() => {
    if (!howtoOpen && !lbOpen) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (howtoOpen) closeHowto();
      else if (lbOpen) setLbOpen(false);
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [howtoOpen, lbOpen]);

  // Reset the leaderboard submit form each time a fresh completion happens
  // (new finalTime) or the active mode changes, so a stale success/warming
  // state from a previous puzzle never lingers on the next one.
  useEffect(() => {
    setSubmitPhase("form");
    setSubmitBoard(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, cur?.finalTime]);

  // Fetch the leaderboard panel's data whenever it's open and the
  // scope/difficulty selection changes.
  useEffect(() => {
    if (!lbOpen) return;
    let cancelled = false;
    setLbPhase("loading");
    const opts =
      lbScope === "daily"
        ? { day: dailyNumber(new Date()), me: identity }
        : { difficulty: lbDifficulty, me: identity };
    fetchLeaderboard(lbScope, opts).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setLbPhase(result.warming ? "warming" : "error");
        return;
      }
      setLbData(result.data);
      setLbPhase("ready");
    });
    return () => {
      cancelled = true;
    };
  }, [lbOpen, lbScope, lbDifficulty, identity]);

  async function handleSubmitScore(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!cur || cur.finalTime == null) return;

    const trimmedName = submitName.trim();
    const trimmedLocation = submitLocation.trim();
    if (!trimmedName) {
      setSubmitPhase("invalid");
      return;
    }
    if (!submitUseIp && trimmedLocation.length < 2) {
      setSubmitPhase("invalid");
      return;
    }

    setSubmitPhase("submitting");

    // Opt-out (name+location) identities are ownership-protected server
    // side — send back whatever entryToken we have on file for a matching
    // resubmission; the useIp path ignores this field entirely.
    const body: SubmitBody =
      mode === "daily"
        ? {
            scope: "daily",
            day: dailyNumber(new Date()),
            name: trimmedName,
            timeMs: cur.finalTime * 1000,
            useIp: submitUseIp,
            location: submitUseIp ? undefined : trimmedLocation,
            entryToken: submitUseIp ? undefined : entryToken ?? undefined,
          }
        : {
            scope: "alltime",
            difficulty: mode,
            name: trimmedName,
            timeMs: cur.finalTime * 1000,
            useIp: submitUseIp,
            location: submitUseIp ? undefined : trimmedLocation,
            entryToken: submitUseIp ? undefined : entryToken ?? undefined,
          };

    const result = await submitScore(body);
    if (!result.ok) {
      // A 409 means this name+location is already claimed by someone else
      // (or by us, but on a device that doesn't have the saved token) —
      // that's a distinct, actionable outcome from "leaderboard is down".
      setSubmitPhase(result.nameTaken ? "taken" : "warming");
      return;
    }

    try {
      localStorage.setItem(IDENTITY_KEY, result.identity);
      localStorage.setItem(SUBMIT_NAME_KEY, trimmedName);
      localStorage.setItem(SUBMIT_USE_IP_KEY, String(submitUseIp));
      if (!submitUseIp) localStorage.setItem(SUBMIT_LOCATION_KEY, trimmedLocation);
      if (result.entryToken) {
        localStorage.setItem(ENTRY_TOKEN_KEY, result.entryToken);
        setEntryToken(result.entryToken);
      }
    } catch {
      // localStorage unavailable — identity/prefs just won't persist.
    }
    setIdentity(result.identity);

    const board = await fetchLeaderboard(body.scope, {
      day: body.scope === "daily" ? body.day : undefined,
      difficulty: body.scope === "alltime" ? body.difficulty : undefined,
      me: result.identity,
    });
    if (board.ok) setSubmitBoard(board.data);

    setSubmitPhase("success");
  }

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
          <div className={styles.navActions}>
            <button
              type="button"
              className={styles.navActionButton}
              onClick={() => setHowtoOpen(true)}
            >
              HOW TO PLAY
            </button>
            <button
              type="button"
              className={styles.navActionButton}
              onClick={() => setLbOpen(true)}
            >
              LEADERBOARD
            </button>
            <Link href="/games" className={styles.backLink}>
              ← ARCADE
            </Link>
          </div>
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

              <div className={styles.lbSubmit}>
                {submitPhase === "success" && submitBoard ? (
                  <div className={styles.lbSubmitSuccess}>
                    <p className={styles.lbSubmitRank}>
                      {submitBoard.me
                        ? `Your rank: #${submitBoard.me.rank} of ${submitBoard.total}`
                        : "Score submitted!"}
                    </p>
                    <LeaderboardList
                      entries={submitBoard.entries.slice(0, 10)}
                      meRank={submitBoard.me?.rank}
                    />
                    <button
                      type="button"
                      className={styles.lbViewFullButton}
                      onClick={() => {
                        if (mode === "daily") {
                          setLbScope("daily");
                        } else {
                          setLbScope("alltime");
                          setLbDifficulty(mode);
                        }
                        setLbOpen(true);
                      }}
                    >
                      View full leaderboard
                    </button>
                  </div>
                ) : submitPhase === "warming" ? (
                  <p className={styles.lbWarming}>
                    Leaderboard is warming up — your time is saved above, submission skipped.
                  </p>
                ) : (
                  <form className={styles.submitForm} onSubmit={handleSubmitScore}>
                    <p className={styles.submitKicker}>ADD TO LEADERBOARD</p>
                    <label className={styles.submitLabel}>
                      Name
                      <input
                        type="text"
                        className={styles.submitInput}
                        value={submitName}
                        onChange={(e) => setSubmitName(e.target.value)}
                        maxLength={20}
                        placeholder="Your name"
                      />
                    </label>
                    <label className={styles.submitCheckboxRow}>
                      <input
                        type="checkbox"
                        checked={submitUseIp}
                        onChange={(e) => setSubmitUseIp(e.target.checked)}
                      />
                      Rank me anonymously by network id
                    </label>
                    <p className={styles.submitPrivacyNote}>
                      we store only a salted hash, never your IP
                    </p>
                    {!submitUseIp && (
                      <label className={styles.submitLabel}>
                        City, state, or zip
                        <input
                          type="text"
                          className={styles.submitInput}
                          value={submitLocation}
                          onChange={(e) => setSubmitLocation(e.target.value)}
                          maxLength={40}
                          placeholder="e.g. Austin, TX"
                        />
                      </label>
                    )}
                    {submitPhase === "invalid" && (
                      <p className={styles.submitError}>
                        {submitUseIp
                          ? "Enter a name."
                          : "Enter a name and a city/state/zip (2+ characters)."}
                      </p>
                    )}
                    {submitPhase === "taken" && (
                      <p className={styles.submitError}>
                        That name &amp; location is already ranked by someone else — tweak
                        your name to distinguish yourself.
                      </p>
                    )}
                    <button
                      type="submit"
                      className={styles.submitButton}
                      disabled={submitPhase === "submitting"}
                    >
                      {submitPhase === "submitting" ? "Submitting…" : "Submit score"}
                    </button>
                  </form>
                )}
              </div>

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

        {lbOpen && (
          <div className={styles.overlay} onClick={() => setLbOpen(false)}>
            <div
              className={styles.lbCard}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Sudoku leaderboard"
            >
              <p className={styles.overlayKicker}>LEADERBOARD</p>
              <div className={styles.lbTabs}>
                <button
                  type="button"
                  className={`${styles.lbTab} ${lbScope === "daily" ? styles.lbTabActive : ""}`}
                  onClick={() => setLbScope("daily")}
                >
                  DAILY #{dailyNumber(new Date())}
                </button>
                <button
                  type="button"
                  className={`${styles.lbTab} ${lbScope === "alltime" ? styles.lbTabActive : ""}`}
                  onClick={() => setLbScope("alltime")}
                >
                  ALL-TIME
                </button>
              </div>

              {lbScope === "alltime" && (
                <div className={styles.lbDifficultyRow}>
                  {(["easy", "medium", "hard"] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      className={`${styles.lbDifficultyButton} ${
                        lbDifficulty === d ? styles.lbDifficultyActive : ""
                      }`}
                      onClick={() => setLbDifficulty(d)}
                    >
                      {d.toUpperCase()}
                    </button>
                  ))}
                </div>
              )}

              <div className={styles.lbBody}>
                {lbPhase === "loading" || lbPhase === "idle" ? (
                  <p className={styles.lbLoading}>Loading…</p>
                ) : lbPhase === "warming" ? (
                  <p className={styles.lbWarming}>
                    Leaderboard is warming up — check back soon.
                  </p>
                ) : lbPhase === "error" ? (
                  <p className={styles.lbWarming}>Couldn&apos;t load the leaderboard right now.</p>
                ) : lbData ? (
                  <>
                    <LeaderboardList entries={lbData.entries} meRank={lbData.me?.rank} />
                    {lbData.me && !lbData.entries.some((entry) => entry.rank === lbData.me?.rank) && (
                      <p className={styles.lbMeRow}>
                        Your rank: #{lbData.me.rank} —{" "}
                        {formatTime(Math.round(lbData.me.timeMs / 1000))}
                      </p>
                    )}
                  </>
                ) : null}
              </div>

              <div className={styles.overlayActions}>
                <button type="button" className={styles.closeButton} onClick={() => setLbOpen(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {howtoOpen && (
          <div className={styles.overlay} onClick={closeHowto}>
            <div
              className={styles.howtoCard}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="How to play Sudoku"
            >
              <p className={styles.overlayKicker}>HOW TO PLAY</p>
              <div className={styles.howtoBody}>
                <section className={styles.howtoSection}>
                  <h3 className={styles.howtoTitle}>The rules</h3>
                  <p className={styles.howtoText}>
                    Fill the 9×9 grid so every row, column, and 3×3 box contains the digits
                    1-9 exactly once. Clue digits (bold, locked) can&apos;t be changed.
                  </p>
                </section>
                <section className={styles.howtoSection}>
                  <h3 className={styles.howtoTitle}>Pencil marks</h3>
                  <p className={styles.howtoText}>
                    Toggle PENCIL, then tap a cell and a digit to jot down candidates
                    instead of committing to a value — handy for tracking possibilities.
                    Entering a real value clears that cell&apos;s pencil marks automatically.
                  </p>
                </section>
                <section className={styles.howtoSection}>
                  <h3 className={styles.howtoTitle}>Mistake highlighting</h3>
                  <p className={styles.howtoText}>
                    Toggle MISTAKES to highlight any filled-in digit that conflicts with
                    the solution in red — catch errors as you go instead of only at the end.
                  </p>
                </section>
                <section className={styles.howtoSection}>
                  <h3 className={styles.howtoTitle}>Daily puzzle &amp; leaderboard</h3>
                  <p className={styles.howtoText}>
                    DAILY is seeded by the UTC date — every visitor gets the exact same
                    board each day, numbered #N. Solve it and submit your time to the
                    daily leaderboard (or the all-time board for EASY/MEDIUM/HARD
                    practice puzzles), ranked anonymously by a salted hash of your
                    network id, or by name + city if you&apos;d rather skip that.
                  </p>
                </section>
              </div>
              <div className={styles.overlayActions}>
                <button type="button" className={styles.closeButton} onClick={closeHowto}>
                  Got it
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
