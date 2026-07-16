"use client";

import { useCallback, useEffect, useState } from "react";
import type { MouseEvent } from "react";
import type { ConceptId } from "@/app/data/content";

const VOTES_KEY = "jkr_poll_votes";
const VOTED_KEY = "jkr_poll_voted";

interface UseVotesResult {
  votes: Record<string, number>;
  votedFor: string | null;
  live: boolean;
  castVote: (id: ConceptId) => (e: MouseEvent) => void;
}

export function useVotes(): UseVotesResult {
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [votedFor, setVotedFor] = useState<string | null>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(VOTES_KEY);
      setVotes(raw ? JSON.parse(raw) : {});
    } catch {
      setVotes({});
    }
    setVotedFor(localStorage.getItem(VOTED_KEY));

    async function fetchVotes() {
      try {
        const r = await fetch("/api/votes");
        if (r.ok) {
          setVotes(await r.json());
          setLive(true);
        }
      } catch {
        // swallow — fall back to localStorage state
      }
    }
    fetchVotes();
  }, []);

  const castVote = useCallback(
    (id: ConceptId) => (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (votedFor === id) return;

      const prev = votedFor;
      const next = { ...votes };
      if (prev) next[prev] = Math.max(0, (next[prev] || 0) - 1);
      next[id] = (next[id] || 0) + 1;

      localStorage.setItem(VOTES_KEY, JSON.stringify(next));
      localStorage.setItem(VOTED_KEY, id);
      setVotes(next);
      setVotedFor(id);

      (async () => {
        try {
          const r = await fetch("/api/votes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ vote: id, unvote: prev || null }),
          });
          if (r.ok) {
            setVotes(await r.json());
            setLive(true);
          }
        } catch {
          // swallow — optimistic local state stands
        }
      })();
    },
    [votes, votedFor]
  );

  return { votes, votedFor, live, castVote };
}
