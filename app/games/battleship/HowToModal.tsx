"use client";

import { useEffect } from "react";
import styles from "./battleship.module.css";

/**
 * Arcade-styled "How to play" rules overlay for Battleship. The page shell
 * owns the open/dismissed state (incl. the `jkr_howto_battleship` localStorage
 * flag) — this component is purely presentational plus the Escape-key
 * listener, so it can't leak any state logic into the page's other effects.
 */
export default function HowToModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.modalBackdrop} onClick={onClose} role="presentation">
      <div
        className={styles.modalCard}
        role="dialog"
        aria-modal="true"
        aria-labelledby="battleship-howto-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <span id="battleship-howto-title" className={styles.modalTitle}>
            HOW TO PLAY — BATTLESHIP
          </span>
          <button type="button" className={styles.modalClose} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className={styles.modalBody}>
          <section className={styles.modalSection}>
            <h3>Placement</h3>
            <p>
              Drag each ship from the tray onto the board — a ghost follows your finger or cursor, and the board
              lights up cyan where it fits, red where it doesn&apos;t. Let go to snap it into place. Tap a placed
              ship (or press <kbd className={styles.kbd}>R</kbd>) to rotate it; an invalid rotation shakes and stays
              put. <strong>Random</strong> auto-places your whole fleet; <strong>Clear</strong> starts over.
            </p>
          </section>
          <section className={styles.modalSection}>
            <h3>Turns</h3>
            <p>Players alternate firing one shot per turn. On your turn, tap a cell in &quot;Enemy waters.&quot;</p>
          </section>
          <section className={styles.modalSection}>
            <h3>Hit, miss, sunk</h3>
            <p>
              A shot on an occupied cell is a <strong>HIT</strong>; empty water is a <strong>MISS</strong>. Once
              every cell of a ship has been hit, it&apos;s <strong>SUNK</strong> — the ship is announced by name
              (except in Fog of War, below).
            </p>
          </section>
          <section className={styles.modalSection}>
            <h3>Win condition</h3>
            <p>First player to sink every ship in the opponent&apos;s fleet wins.</p>
          </section>
          <section className={styles.modalSection}>
            <h3>Fleet rules (difficulty)</h3>
            <ul className={styles.modalList}>
              <li>
                <strong>Easy — Classic:</strong> both fleets are the standard 5-ship set — Carrier 5, Battleship 4,
                Cruiser 3, Submarine 3, Destroyer 2.
              </li>
              <li>
                <strong>Medium — Fleet Builder:</strong> secretly build your own fleet from a catalog (Sub 1 up to
                Leviathan 6) under a 17-cell budget, 3-7 ships. Your opponent&apos;s composition stays hidden, but
                sunk ships are still announced by name.
              </li>
              <li>
                <strong>Hard — Fog of War:</strong> Fleet Builder rules, plus total fog — no enemy remaining-ship
                tray, and sinking one of their ships just says &quot;You sunk a ship!&quot; with no name. You&apos;ll
                always see the names of your own ships when they&apos;re lost.
              </li>
            </ul>
          </section>
          <section className={styles.modalSection}>
            <h3>Online rooms</h3>
            <p>
              Create a room to get a 5-character code and an invite link — share it (native share sheet, email,
              text, or copy link) and once a friend joins, both fleets are placed in secret and the battle begins.
              The server adjudicates every shot, so neither side can peek at the other&apos;s board.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
