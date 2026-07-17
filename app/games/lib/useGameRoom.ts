"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GameType, Seat } from "./server/types";

const POLL_INTERVAL_MS = 1500;
const POLL_INTERVAL_IDLE_MS = 4000;
const IDLE_THRESHOLD_MS = 2 * 60 * 1000;

type Status = "idle" | "creating" | "waiting" | "playing" | "error" | "offline";

type StoredRoom = { roomId: string; playerToken: string };

interface UseGameRoomResult<TView> {
  roomId: string | null;
  seat: Seat | null;
  view: TView | null;
  status: Status;
  error: string | null;
  createRoom(): Promise<string | null>;
  joinRoom(roomId: string): Promise<boolean>;
  sendMove(payload: unknown): Promise<boolean>;
  inviteUrl: string | null;
}

function storageKey(type: GameType): string {
  return `jkr_game_${type}`;
}

function readStoredRoom(type: GameType): StoredRoom | null {
  try {
    const raw = localStorage.getItem(storageKey(type));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredRoom>;
    if (typeof parsed.roomId === "string" && typeof parsed.playerToken === "string") {
      return { roomId: parsed.roomId, playerToken: parsed.playerToken };
    }
    return null;
  } catch {
    return null;
  }
}

function writeStoredRoom(type: GameType, room: StoredRoom | null): void {
  try {
    if (room) {
      localStorage.setItem(storageKey(type), JSON.stringify(room));
    } else {
      localStorage.removeItem(storageKey(type));
    }
  } catch {
    /* storage unavailable — in-memory state still proceeds */
  }
}

/**
 * Client hook for the games multiplayer backend (app/api/games/*).
 *
 * Fetch URLs use a trailing slash (e.g. `/api/games/room/`) because
 * next.config.js sets `trailingSlash: true` — a holdover from the
 * static-export era that still normalizes API route URLs, same as
 * app/games/lib/../useVotes.ts already relies on.
 */
export function useGameRoom<TView>(type: GameType): UseGameRoomResult<TView> {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [seat, setSeat] = useState<Seat | null>(null);
  const [view, setView] = useState<TView | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const playerTokenRef = useRef<string | null>(null);
  const lastChangeAtRef = useRef<number>(Date.now());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollSeqRef = useRef(0);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const poll = useCallback(async () => {
    const currentRoomId = roomId;
    const token = playerTokenRef.current;
    if (!currentRoomId || !token) return;

    const seq = ++pollSeqRef.current;
    try {
      const params = new URLSearchParams({ type, roomId: currentRoomId, playerToken: token });
      const r = await fetch(`/api/games/state/?${params.toString()}`);
      if (seq !== pollSeqRef.current) return; // superseded by a newer poll/action

      if (r.status === 503) {
        setStatus("offline");
        return;
      }
      if (!r.ok) {
        const body = (await r.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error || `request failed (${r.status})`);
        setStatus("error");
        return;
      }

      const data = (await r.json()) as {
        seat: Seat;
        view: TView;
        lastMoveAt: number;
        opponentJoined: boolean;
      };
      if (data.lastMoveAt !== lastChangeAtRef.current) {
        lastChangeAtRef.current = data.lastMoveAt;
      }
      setSeat(data.seat);
      setView(data.view);
      setError(null);
      setStatus(data.seat === 1 && !data.opponentJoined ? "waiting" : "playing");
    } catch {
      if (seq !== pollSeqRef.current) return;
      // Transient network failure — keep prior state, don't flip to "error".
    }
  }, [roomId, type]);

  const schedulePoll = useCallback(() => {
    clearTimer();
    if (!roomId || !playerTokenRef.current) return;
    if (typeof document !== "undefined" && document.hidden) {
      // Paused while tab is hidden; visibilitychange listener resumes it.
      return;
    }
    const idleFor = Date.now() - lastChangeAtRef.current;
    const delay = idleFor > IDLE_THRESHOLD_MS ? POLL_INTERVAL_IDLE_MS : POLL_INTERVAL_MS;
    timerRef.current = setTimeout(async () => {
      await poll();
      schedulePoll();
    }, delay);
  }, [clearTimer, poll, roomId]);

  // (Re)start the poll loop whenever we have an active room + token. The
  // loop keeps retrying through "offline"/"error" states too (a transient
  // outage recovering shouldn't require a page reload).
  useEffect(() => {
    if (!roomId || !playerTokenRef.current) return;
    schedulePoll();
    return clearTimer;
  }, [roomId, schedulePoll, clearTimer]);

  // Pause polling while the tab is hidden; resume immediately on return.
  useEffect(() => {
    function onVisibility() {
      if (document.hidden) {
        clearTimer();
      } else {
        void poll();
        schedulePoll();
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [clearTimer, poll, schedulePoll]);

  // Restore a room from localStorage on mount.
  useEffect(() => {
    const stored = readStoredRoom(type);
    if (!stored) {
      setStatus("idle");
      return;
    }
    playerTokenRef.current = stored.playerToken;
    setRoomId(stored.roomId);
    (async () => {
      const params = new URLSearchParams({
        type,
        roomId: stored.roomId,
        playerToken: stored.playerToken,
      });
      try {
        const r = await fetch(`/api/games/state/?${params.toString()}`);
        if (r.status === 503) {
          setStatus("offline");
          return;
        }
        if (!r.ok) {
          // Stale/expired room — drop it and go back to idle.
          writeStoredRoom(type, null);
          playerTokenRef.current = null;
          setRoomId(null);
          setStatus("idle");
          return;
        }
        const data = (await r.json()) as {
          seat: Seat;
          view: TView;
          lastMoveAt: number;
          opponentJoined: boolean;
        };
        lastChangeAtRef.current = data.lastMoveAt;
        setSeat(data.seat);
        setView(data.view);
        setStatus(data.seat === 1 && !data.opponentJoined ? "waiting" : "playing");
      } catch {
        setStatus("offline");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const createRoom = useCallback(async (): Promise<string | null> => {
    setStatus("creating");
    setError(null);
    try {
      const r = await fetch("/api/games/room/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (r.status === 503) {
        setStatus("offline");
        return null;
      }
      if (!r.ok) {
        const body = (await r.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error || `request failed (${r.status})`);
        setStatus("error");
        return null;
      }
      const data = (await r.json()) as { roomId: string; playerToken: string; seat: 1 };
      playerTokenRef.current = data.playerToken;
      writeStoredRoom(type, { roomId: data.roomId, playerToken: data.playerToken });
      lastChangeAtRef.current = Date.now();
      setSeat(1);
      setRoomId(data.roomId);
      setStatus("waiting");
      return data.roomId;
    } catch {
      setStatus("error");
      setError("network error");
      return null;
    }
  }, [type]);

  const joinRoom = useCallback(
    async (roomIdToJoin: string): Promise<boolean> => {
      setStatus("creating");
      setError(null);
      try {
        const r = await fetch("/api/games/room/join/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, roomId: roomIdToJoin }),
        });
        if (r.status === 503) {
          setStatus("offline");
          return false;
        }
        if (!r.ok) {
          const body = (await r.json().catch(() => null)) as { error?: string } | null;
          setError(body?.error || `request failed (${r.status})`);
          setStatus("error");
          return false;
        }
        const data = (await r.json()) as { playerToken: string; seat: 2 };
        playerTokenRef.current = data.playerToken;
        writeStoredRoom(type, { roomId: roomIdToJoin, playerToken: data.playerToken });
        lastChangeAtRef.current = Date.now();
        setSeat(2);
        setRoomId(roomIdToJoin);
        setStatus("playing");
        return true;
      } catch {
        setStatus("error");
        setError("network error");
        return false;
      }
    },
    [type]
  );

  const sendMove = useCallback(
    async (payload: unknown): Promise<boolean> => {
      const token = playerTokenRef.current;
      if (!roomId || !token) return false;
      try {
        const r = await fetch("/api/games/move/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, roomId, playerToken: token, payload }),
        });
        if (r.status === 503) {
          setStatus("offline");
          return false;
        }
        if (!r.ok) {
          const body = (await r.json().catch(() => null)) as { error?: string } | null;
          setError(body?.error || `request failed (${r.status})`);
          return false;
        }
        setError(null);
        lastChangeAtRef.current = Date.now();
        // Intentional: sendMove doesn't set `status` itself — the
        // immediately-following poll() re-derives it from the fresh view
        // (e.g. "playing" vs "waiting"), which is the single source of
        // truth for status everywhere else in this hook.
        await poll();
        return true;
      } catch {
        setError("network error");
        return false;
      }
    },
    [poll, roomId, type]
  );

  const inviteUrl = roomId ? `/games/${type}?room=${roomId}` : null;

  return { roomId, seat, view, status, error, createRoom, joinRoom, sendMove, inviteUrl };
}
