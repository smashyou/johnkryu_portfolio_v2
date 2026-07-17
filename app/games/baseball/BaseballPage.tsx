"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useGameRoom } from "@/app/games/lib/useGameRoom";
import { isValidCode, scoreGuess } from "@/app/games/lib/baseball";
import { allCodes, filterCandidates, nextGuess, type Difficulty } from "@/app/games/lib/baseballAi";
import type { BaseballView } from "@/app/games/lib/server/baseballGame";
import InviteShare from "@/app/games/lib/InviteShare";
import styles from "./baseball.module.css";

const HOWTO_STORAGE_KEY = "jkr_howto_baseball";

type Mode = "select" | "computer" | "online";
type ComputerPhase = "difficulty" | "secret" | "playing" | "done";
type ScoredGuess = { guess: string; strikes: number; balls: number; out: boolean };
type LocalGuess = ScoredGuess & { seat: 1 | 2 };

const CLAIM_WIN_IDLE_MS = 180000;
const COMPUTER_THINK_MS = 650;

// ---------------------------------------------------------------------------
// Small presentational helpers
// ---------------------------------------------------------------------------

function DigitPad({
  value,
  onChange,
  hidden = false,
  disabled = false,
}: {
  value: string;
  onChange: (next: string) => void;
  hidden?: boolean;
  disabled?: boolean;
}) {
  const digits = "0123456789".split("");

  function tapDigit(d: string) {
    if (disabled || value.length >= 3 || value.includes(d)) return;
    onChange(value + d);
  }

  return (
    <div className={styles.digitPadWrap}>
      <div className={styles.entryDisplay}>
        {[0, 1, 2].map((i) => (
          <span key={i} className={styles.entrySlot}>
            {value[i] ? (hidden ? "•" : value[i]) : ""}
          </span>
        ))}
      </div>
      <div className={styles.digitGrid}>
        {digits.map((d) => (
          <button
            key={d}
            type="button"
            aria-label={`Digit ${d}`}
            className={styles.digitButton}
            disabled={disabled || value.length >= 3 || value.includes(d)}
            onClick={() => tapDigit(d)}
          >
            {d}
          </button>
        ))}
      </div>
      <div className={styles.padActions}>
        <button
          type="button"
          className={styles.padActionButton}
          disabled={disabled || value.length === 0}
          onClick={() => onChange(value.slice(0, -1))}
        >
          ⌫ Back
        </button>
        <button
          type="button"
          className={styles.padActionButton}
          disabled={disabled || value.length === 0}
          onClick={() => onChange("")}
        >
          Clear
        </button>
      </div>
    </div>
  );
}

/** "1 Strike" / "2 Strikes" — full word, correctly pluralized. */
function pluralize(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

function chipsFor(g: ScoredGuess) {
  if (g.out) return <span className={`${styles.chip} ${styles.chipOut}`}>OUT</span>;
  return (
    <>
      {g.strikes > 0 && (
        <span className={`${styles.chip} ${styles.chipStrike}`}>{pluralize(g.strikes, "Strike")}</span>
      )}
      {g.balls > 0 && (
        <span className={`${styles.chip} ${styles.chipBall}`}>{pluralize(g.balls, "Ball")}</span>
      )}
    </>
  );
}

function GuessTable({ title, guesses }: { title: string; guesses: ScoredGuess[] }) {
  return (
    <div className={styles.guessTable}>
      <h3 className={styles.guessTableTitle}>{title}</h3>
      {guesses.length === 0 ? (
        <p className={styles.emptyState}>No guesses yet.</p>
      ) : (
        <div className={styles.guessList}>
          {guesses
            .slice()
            .reverse()
            .map((g, i) => (
              <div key={guesses.length - 1 - i} className={styles.guessRow}>
                <span className={styles.guessCode}>{g.guess}</span>
                <div className={styles.chips}>{chipsFor(g)}</div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

function HowToPlayModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className={styles.howToBackdrop} onClick={onClose}>
      <div
        className={styles.howToModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="baseball-howto-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className={styles.howToClose}
          aria-label="Close how to play"
          onClick={onClose}
        >
          ✕
        </button>
        <h2 id="baseball-howto-title" className={styles.subheading}>
          How to play Baseball
        </h2>
        <div className={styles.howToBody}>
          <p>
            Set a secret 3-digit code using <strong>3 different digits</strong> (0–9,
            no repeats) — your opponent never sees it. Then take turns guessing each
            other&apos;s secret, one guess per turn.
          </p>
          <p>Every guess gets scored against the opponent&apos;s secret:</p>
          <ul>
            <li>
              <strong>Strike</strong> — a digit in your guess is the right digit in the
              right position.
            </li>
            <li>
              <strong>Ball</strong> — a digit in your guess is in the secret, but in the
              wrong position.
            </li>
            <li>
              <strong>Out</strong> — none of your guessed digits appear in the secret at
              all.
            </li>
          </ul>
          <p className={styles.howToExample}>
            If the secret is <strong>357</strong>: guessing <strong>735</strong> → 3
            Balls · guessing <strong>153</strong> → 1 Strike, 1 Ball · guessing{" "}
            <strong>210</strong> → OUT. First to 3 Strikes wins.
          </p>
          <p>
            <strong>vs Computer</strong> offers three difficulties — Easy guesses at
            random, Normal narrows candidates down using your feedback, and Hard plays
            a tighter, minimax-style strategy.
          </p>
          <p>
            <strong>Online Room</strong> gives you a 5-character room code and invite
            link so a friend can join and play head-to-head — turns alternate, and both
            secrets stay hidden on the server until the game ends.
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function BaseballPage() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("select");
  const [entry, setEntry] = useState("");
  const [showHowTo, setShowHowTo] = useState(false);

  // Auto-open the rules on a visitor's first-ever visit to this game, then
  // never again — tracked via a localStorage flag. Wrapped in try/catch
  // since localStorage can throw in privacy-locked-down browsers.
  useEffect(() => {
    try {
      if (!window.localStorage.getItem(HOWTO_STORAGE_KEY)) {
        window.localStorage.setItem(HOWTO_STORAGE_KEY, "1");
        setShowHowTo(true);
      }
    } catch {
      /* localStorage unavailable — skip auto-open, button still works */
    }
  }, []);

  // ---- vs Computer state ----
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [computerPhase, setComputerPhase] = useState<ComputerPhase>("difficulty");
  const [playerSecret, setPlayerSecret] = useState<string | null>(null);
  const [computerSecret, setComputerSecret] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<string[]>(() => allCodes());
  const [turn, setTurn] = useState<1 | 2>(1);
  const [playerGuesses, setPlayerGuesses] = useState<LocalGuess[]>([]);
  const [computerGuesses, setComputerGuesses] = useState<LocalGuess[]>([]);
  const [winner, setWinner] = useState<1 | 2 | null>(null);
  const [thinking, setThinking] = useState(false);

  // ---- Online room state ----
  const room = useGameRoom<BaseballView>("baseball");
  const [joinCode, setJoinCode] = useState("");
  const autoJoinedRef = useRef(false);
  const lastViewJsonRef = useRef<string | null>(null);
  const lastViewChangeAtRef = useRef<number>(Date.now());
  const [, forceClaimRecheck] = useState(0);

  // `?room=CODE` in the URL auto-joins once, on mount, per the spec's invite
  // flow — only fires while idle so a page refresh mid-game doesn't try to
  // re-join and stomp the restored-from-localStorage room.
  useEffect(() => {
    const roomParam = searchParams.get("room");
    if (roomParam && !autoJoinedRef.current && room.status === "idle") {
      autoJoinedRef.current = true;
      setMode("online");
      void room.joinRoom(roomParam.toUpperCase());
    }
  }, [searchParams, room.status, room.joinRoom]);

  // Proactive backend-availability probe: useGameRoom only learns "offline"
  // once an actual create/join/move is attempted, but the spec wants the
  // "warming up" message (and hidden room controls) as soon as the player
  // enters online mode — before they've clicked anything. `/api/games/state/`
  // checks Redis configuration before it even looks at query params, so an
  // empty-param GET is a side-effect-free 503 probe when unconfigured (and a
  // harmless 400 "bad request" when configured, still with no state written).
  const [backendProbe, setBackendProbe] = useState<"unknown" | "offline" | "available">("unknown");
  useEffect(() => {
    if (mode !== "online" || room.status !== "idle") return;
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
  }, [mode, room.status]);

  const showOfflineNotice = room.status === "offline" || (room.status === "idle" && backendProbe === "offline");
  const showIdleRoomControls = room.status === "idle" && backendProbe === "available";

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

  // Re-render every few seconds so the 3-minute idle threshold above gets
  // re-evaluated even when nothing else changes (opponent gone silent).
  useEffect(() => {
    const id = setInterval(() => forceClaimRecheck((t) => t + 1), 5000);
    return () => clearInterval(id);
  }, []);

  const canClaimWin =
    room.status === "playing" &&
    room.view !== null &&
    room.view.phase === "playing" &&
    room.seat !== null &&
    room.view.turn !== room.seat &&
    Date.now() - lastViewChangeAtRef.current > CLAIM_WIN_IDLE_MS;

  // The computer's automatic guess against the player's secret.
  useEffect(() => {
    if (mode !== "computer" || computerPhase !== "playing" || turn !== 2 || !playerSecret) return;
    setThinking(true);
    const id = setTimeout(() => {
      const guess = nextGuess(candidates, difficulty);
      const result = scoreGuess(playerSecret, guess);
      setComputerGuesses((prev) => [...prev, { seat: 2, guess, ...result }]);
      setCandidates((prev) => filterCandidates(prev, guess, result));
      setThinking(false);
      if (result.strikes === 3) {
        setWinner(2);
        setComputerPhase("done");
      } else {
        setTurn(1);
      }
    }, COMPUTER_THINK_MS);
    return () => clearTimeout(id);
  }, [mode, computerPhase, turn, playerSecret, candidates, difficulty]);

  function startComputerMode() {
    setMode("computer");
    setComputerPhase("difficulty");
  }

  function chooseDifficulty(d: Difficulty) {
    setDifficulty(d);
    setComputerPhase("secret");
    setEntry("");
  }

  function confirmPlayerSecret() {
    if (!isValidCode(entry)) return;
    const codes = allCodes();
    const cSecret = codes[Math.floor(Math.random() * codes.length)];
    setPlayerSecret(entry);
    setComputerSecret(cSecret);
    setCandidates(codes);
    setPlayerGuesses([]);
    setComputerGuesses([]);
    setWinner(null);
    setTurn(1);
    setEntry("");
    setComputerPhase("playing");
  }

  function submitPlayerGuess() {
    if (!isValidCode(entry) || turn !== 1 || computerPhase !== "playing" || !computerSecret) return;
    const result = scoreGuess(computerSecret, entry);
    setPlayerGuesses((prev) => [...prev, { seat: 1, guess: entry, ...result }]);
    setEntry("");
    if (result.strikes === 3) {
      setWinner(1);
      setComputerPhase("done");
    } else {
      setTurn(2);
    }
  }

  function playAgainComputer() {
    setComputerPhase("secret");
    setPlayerSecret(null);
    setComputerSecret(null);
    setCandidates(allCodes());
    setPlayerGuesses([]);
    setComputerGuesses([]);
    setWinner(null);
    setTurn(1);
    setEntry("");
  }

  function backToModeSelect() {
    setMode("select");
    setComputerPhase("difficulty");
    setPlayerSecret(null);
    setComputerSecret(null);
    setEntry("");
  }

  async function handleCreateRoom() {
    setMode("online");
    setEntry("");
    await room.createRoom();
  }

  async function handleJoinRoom() {
    if (!joinCode.trim()) return;
    setMode("online");
    setEntry("");
    await room.joinRoom(joinCode.trim().toUpperCase());
  }

  async function submitOnlineSecret() {
    if (!isValidCode(entry)) return;
    const value = entry;
    setEntry("");
    await room.sendMove({ kind: "secret", value });
  }

  async function submitOnlineGuess() {
    if (!isValidCode(entry)) return;
    const value = entry;
    setEntry("");
    await room.sendMove({ kind: "guess", value });
  }

  async function claimWin() {
    await room.sendMove({ kind: "claimWin" });
  }

  async function rematch() {
    await room.sendMove({ kind: "rematch" });
  }

  const showOnlineGameArea =
    (room.status === "waiting" || room.status === "playing") && room.view !== null;

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <nav className={styles.nav}>
          <Link href="/games" className={styles.backLink}>
            ← ARCADE
          </Link>
          <div className={styles.navRight}>
            <span className={styles.brand}>⚾ BASEBALL</span>
            <button
              type="button"
              className={styles.howToButton}
              onClick={() => setShowHowTo(true)}
            >
              How to play
            </button>
          </div>
        </nav>

        {showHowTo && <HowToPlayModal onClose={() => setShowHowTo(false)} />}

        {mode === "select" && (
          <div className={styles.hero}>
            <h1 className={styles.heading}>Baseball</h1>
            <p className={styles.lead}>
              Classic Bulls &amp; Cows. Set a secret 3-digit code, then crack your
              opponent&apos;s before they crack yours.
            </p>
            <div className={styles.modeButtons}>
              <button type="button" className={styles.modeButton} onClick={startComputerMode}>
                vs Computer
              </button>
              <button type="button" className={styles.modeButton} onClick={() => setMode("online")}>
                Online Room
              </button>
            </div>
          </div>
        )}

        {mode === "computer" && (
          <div className={styles.gameArea}>
            <button type="button" className={styles.changeModeLink} onClick={backToModeSelect}>
              ⟵ change mode
            </button>

            {computerPhase === "difficulty" && (
              <div className={styles.panel}>
                <h2 className={styles.subheading}>Choose difficulty</h2>
                <div className={styles.difficultyButtons}>
                  {(["easy", "normal", "hard"] as Difficulty[]).map((d) => (
                    <button
                      key={d}
                      type="button"
                      className={styles.modeButton}
                      onClick={() => chooseDifficulty(d)}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {computerPhase === "secret" && (
              <div className={styles.panel}>
                <h2 className={styles.subheading}>Set your secret code</h2>
                <p className={styles.lead}>
                  3 distinct digits, hidden from the computer. ({difficulty})
                </p>
                <DigitPad value={entry} onChange={setEntry} hidden />
                <button
                  type="button"
                  className={styles.modeButton}
                  disabled={!isValidCode(entry)}
                  onClick={confirmPlayerSecret}
                >
                  Start Game
                </button>
              </div>
            )}

            {computerPhase === "playing" && (
              <div className={styles.panel}>
                <p className={styles.turnIndicator}>
                  {turn === 1 ? "Your turn" : thinking ? "Computer is thinking…" : "Computer's turn"}
                </p>
                {turn === 1 && (
                  <div className={styles.guessEntry}>
                    <DigitPad value={entry} onChange={setEntry} />
                    <button
                      type="button"
                      className={styles.modeButton}
                      disabled={!isValidCode(entry)}
                      onClick={submitPlayerGuess}
                    >
                      Guess
                    </button>
                  </div>
                )}
                <div className={styles.tablesGrid}>
                  <GuessTable title="Your guesses" guesses={playerGuesses} />
                  <GuessTable title="Computer's guesses" guesses={computerGuesses} />
                </div>
              </div>
            )}

            {computerPhase === "done" && (
              <div className={styles.panel}>
                <h2 className={styles.subheading}>{winner === 1 ? "You win!" : "Computer wins."}</h2>
                <p className={styles.revealText}>
                  Your secret: <strong>{playerSecret}</strong> · Computer&apos;s secret:{" "}
                  <strong>{computerSecret}</strong>
                </p>
                <div className={styles.tablesGrid}>
                  <GuessTable title="Your guesses" guesses={playerGuesses} />
                  <GuessTable title="Computer's guesses" guesses={computerGuesses} />
                </div>
                <div className={styles.resultActions}>
                  <button type="button" className={styles.modeButton} onClick={playAgainComputer}>
                    Play Again
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {mode === "online" && (
          <div className={styles.gameArea}>
            <button type="button" className={styles.changeModeLink} onClick={() => setMode("select")}>
              ⟵ change mode
            </button>

            {showOfflineNotice && (
              <div className={styles.panel}>
                <p className={styles.statusText}>Online play is warming up — try vs computer.</p>
              </div>
            )}

            {room.status === "idle" && !showOfflineNotice && !showIdleRoomControls && (
              <div className={styles.panel}>
                <p className={styles.statusText}>Checking connection…</p>
              </div>
            )}

            {showIdleRoomControls && (
              <div className={styles.panel}>
                <h2 className={styles.subheading}>Online Room</h2>
                <button type="button" className={styles.modeButton} onClick={handleCreateRoom}>
                  Create Room
                </button>
                <div className={styles.joinRow}>
                  <input
                    className={styles.joinInput}
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="ROOM CODE"
                    maxLength={5}
                    aria-label="Room code"
                  />
                  <button type="button" className={styles.modeButton} onClick={handleJoinRoom}>
                    Join
                  </button>
                </div>
              </div>
            )}

            {room.status === "creating" && (
              <div className={styles.panel}>
                <p className={styles.statusText}>Connecting…</p>
              </div>
            )}

            {room.status === "error" && (
              <div className={styles.panel}>
                <p className={styles.statusText}>{room.error || "Something went wrong."}</p>
                <button type="button" className={styles.modeButton} onClick={() => setMode("select")}>
                  Back
                </button>
              </div>
            )}

            {(room.status === "waiting" || room.status === "playing") && room.roomId && (
              <div className={styles.roomInfoBar}>
                <span className={styles.roomCode}>ROOM {room.roomId}</span>
                {room.inviteUrl && (
                  <div className={styles.inviteRow}>
                    <InviteShare
                      url={`${typeof window !== "undefined" ? window.location.origin : ""}${room.inviteUrl}`}
                      gameName="⚾ Baseball"
                      buttonClassName={styles.copyButton}
                      primaryButtonClassName={styles.invitePrimaryButton}
                    />
                  </div>
                )}
              </div>
            )}

            {room.status === "waiting" && !room.view && (
              <div className={styles.panel}>
                <p className={styles.statusText}>Waiting for opponent to join…</p>
              </div>
            )}

            {showOnlineGameArea && room.view && (
              <div className={styles.panel}>
                {room.status === "waiting" && (
                  <p className={styles.statusText}>
                    Waiting for opponent to join — you can set your secret now.
                  </p>
                )}

                {room.error && <p className={styles.errorText}>{room.error}</p>}

                {room.view.phase === "setup" &&
                  (!room.view.mySecretSet ? (
                    <div className={styles.secretEntry}>
                      <h3 className={styles.subheading}>Set your secret code</h3>
                      <DigitPad value={entry} onChange={setEntry} hidden />
                      <button
                        type="button"
                        className={styles.modeButton}
                        disabled={!isValidCode(entry)}
                        onClick={submitOnlineSecret}
                      >
                        Lock in secret
                      </button>
                    </div>
                  ) : (
                    <p className={styles.statusText}>
                      {room.view.opponentSecretSet
                        ? "Starting…"
                        : "Waiting for opponent to set their secret…"}
                    </p>
                  ))}

                {room.view.phase === "playing" && (
                  <>
                    <p className={styles.turnIndicator}>
                      {room.view.turn === room.seat ? "Your turn" : "Opponent's turn"}
                    </p>
                    {room.view.turn === room.seat ? (
                      <div className={styles.guessEntry}>
                        <DigitPad value={entry} onChange={setEntry} />
                        <button
                          type="button"
                          className={styles.modeButton}
                          disabled={!isValidCode(entry)}
                          onClick={submitOnlineGuess}
                        >
                          Guess
                        </button>
                      </div>
                    ) : (
                      canClaimWin && (
                        <button type="button" className={styles.claimButton} onClick={claimWin}>
                          Claim win (opponent inactive)
                        </button>
                      )
                    )}
                    <div className={styles.tablesGrid}>
                      <GuessTable
                        title="Your guesses"
                        guesses={room.view.guesses.filter((g) => g.seat === room.seat)}
                      />
                      <GuessTable
                        title="Opponent's guesses"
                        guesses={room.view.guesses.filter((g) => g.seat !== room.seat)}
                      />
                    </div>
                  </>
                )}

                {room.view.phase === "done" && (
                  <>
                    <h2 className={styles.subheading}>
                      {room.view.winner === room.seat
                        ? "You win!"
                        : room.view.winner
                        ? "You lose."
                        : "Game over."}
                    </h2>
                    {room.view.opponentSecret && (
                      <p className={styles.revealText}>
                        Opponent&apos;s secret: <strong>{room.view.opponentSecret}</strong>
                      </p>
                    )}
                    <div className={styles.tablesGrid}>
                      <GuessTable
                        title="Your guesses"
                        guesses={room.view.guesses.filter((g) => g.seat === room.seat)}
                      />
                      <GuessTable
                        title="Opponent's guesses"
                        guesses={room.view.guesses.filter((g) => g.seat !== room.seat)}
                      />
                    </div>
                    <div className={styles.resultActions}>
                      <button type="button" className={styles.modeButton} onClick={rematch}>
                        Rematch
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
