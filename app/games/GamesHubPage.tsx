"use client";

import Link from "next/link";
import SwitchPill from "@/app/components/shared/SwitchPill";
import styles from "./games.module.css";

// CSS custom properties driving each cabinet card's accent color and
// ambient glow shadow color (see games.module.css `cabinetPulse` keyframe
// and `.cabinetTitle` / `.cabinetEmoji`).
type CabinetVars = React.CSSProperties & {
  "--accent"?: string;
  "--accent-glow"?: string;
};

type Cabinet = {
  slug: "baseball" | "battleship" | "sudoku";
  emoji: string;
  title: string;
  mode: string;
  accent: string;
  glow: string;
};

const cabinets: Cabinet[] = [
  {
    slug: "baseball",
    emoji: "⚾",
    title: "Baseball",
    mode: "vs computer · online room",
    accent: "#ff4fd8",
    glow: "rgba(255,79,216,.45)",
  },
  {
    slug: "battleship",
    emoji: "🚢",
    title: "Battleship",
    mode: "vs computer · online room",
    accent: "#4fd8ff",
    glow: "rgba(79,216,255,.45)",
  },
  {
    slug: "sudoku",
    emoji: "🔢",
    title: "Sudoku",
    mode: "solo · daily puzzle",
    accent: "#ff4fd8",
    glow: "rgba(255,79,216,.45)",
  },
];

export default function GamesHubPage() {
  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <nav className={styles.nav}>
          <span className={styles.brand}>THE ARCADE</span>
          <SwitchPill accent="#ff4fd8" />
        </nav>

        <div className={styles.hero}>
          <h1 className={styles.heading}>Pick your game.</h1>
          <p className={styles.lead}>
            Three games, zero downloads. Challenge the computer — or send a
            friend an invite link and settle it head-to-head.
          </p>
        </div>

        <div className={styles.cabinets}>
          {cabinets.map((c) => (
            <Link
              key={c.slug}
              href={`/games/${c.slug}`}
              className={styles.cabinetCard}
              style={
                {
                  "--accent": c.accent,
                  "--accent-glow": c.glow,
                } as CabinetVars
              }
            >
              <span className={styles.cabinetEmoji}>{c.emoji}</span>
              <h2 className={styles.cabinetTitle}>{c.title}</h2>
              <span className={styles.cabinetMode}>{c.mode}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
