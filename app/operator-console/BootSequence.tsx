"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePrefersReducedMotion } from "@/app/components/shared/usePrefersReducedMotion";
import styles from "./console.module.css";

// Verbatim from the reference script's `seq` array in componentDidMount of
// design_handoff_portfolio_redesign/Concept 3 - Operator Console.dc.html.
const BOOT_LINES: string[] = [
  "[ 0.001s ] RYU.OS v3.0 — kernel loaded",
  "[ 0.142s ] mounting /experience .......... OK  (10+ yrs)",
  "[ 0.303s ] loading module: comcast_x1 .... OK  (31M customers)",
  "[ 0.461s ] loading module: founder_mode .. OK  (3 ventures)",
  "[ 0.688s ] loading module: agentic_ai .... OK  (RAG · LangGraph · MCP)",
  "[ 0.845s ] verifying cert: anthropic_cca_f ........ VALID",
  "[ 1.020s ] all systems nominal. launching operator…",
];

const LINE_INTERVAL_MS = 230;

/**
 * Boot terminal window for the Operator Console hero. Types the reference's
 * 7 boot log lines at 230ms/line, then reveals `children` (the hero copy).
 * Reduced motion: all lines and children render immediately, no interval.
 */
export default function BootSequence({ children }: { children: ReactNode }) {
  const reducedMotion = usePrefersReducedMotion();
  const [lines, setLines] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (reducedMotion) {
      setLines(BOOT_LINES);
      setDone(true);
      return;
    }

    setLines([]);
    setDone(false);

    let i = 0;
    const interval = setInterval(() => {
      i++;
      setLines(BOOT_LINES.slice(0, i));
      if (i >= BOOT_LINES.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, LINE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [reducedMotion]);

  return (
    <div className={styles.bootWindow}>
      <div className={styles.bootWindowHeader}>
        <span className={`${styles.bootDot} ${styles.bootDotRed}`} />
        <span className={`${styles.bootDot} ${styles.bootDotYellow}`} />
        <span className={`${styles.bootDot} ${styles.bootDotGreen}`} />
        <span className={styles.bootWindowTitle}>
          john@ryu-os: ~/portfolio — initializing
        </span>
      </div>
      <div className={styles.bootBody}>
        {lines.map((line, i) => (
          <div key={i} className={styles.bootLine}>
            {line}
          </div>
        ))}
        {done && <div className={styles.bootReveal}>{children}</div>}
      </div>
    </div>
  );
}
