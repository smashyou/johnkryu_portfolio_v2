"use client";

import Link from "next/link";
import { jarvis } from "@/app/data/content";
import SwitchPill from "@/app/components/shared/SwitchPill";
import styles from "./jarvis.module.css";

const ACCENT = "#7dd6f5";

export default function JarvisPage() {
  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <nav className={styles.nav}>
          <span className={styles.brand}>JARVIS</span>
          <SwitchPill accent={ACCENT} />
        </nav>

        <header className={styles.hero}>
          <span className={styles.eyebrow}>{jarvis.eyebrow}</span>
          <h1 className={styles.title}>{jarvis.title}</h1>
          <p className={styles.lead}>{jarvis.line}</p>
          <a
            href={jarvis.hqUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.hqBtn}
          >
            Visit RYUCO HQ →
          </a>
          <div className={styles.shot}>
            <img
              src="/images/jarvis/ryuco-hq.jpg"
              alt="RyuCo HQ, Jarvis's home base"
              className={styles.shotImg}
            />
          </div>
        </header>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>What it is</h2>
          <p className={styles.sectionText}>
            JARVIS is the chief of staff for everything I run. It sits one
            level above my own day-to-day work and above every business
            underneath it — reading signal, setting priorities, and making
            sure nothing that matters falls through the cracks.
          </p>
          <p className={styles.sectionText}>
            I don&apos;t manage each business by hand. I manage Jarvis, and
            Jarvis manages the work — surfacing what needs a decision from
            me and letting everything else keep moving on its own.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>How it&apos;s built</h2>
          <p className={styles.sectionText}>
            Jarvis isn&apos;t a single model doing everything — it&apos;s a
            small organization of agents, structured the way a real company
            is. What follows is the shape of that org chart, not the
            machinery underneath it.
          </p>

          <div className={styles.diagram}>
            <div className={styles.diagRow}>
              <div className={`${styles.diagBox} ${styles.diagYou}`}>
                <span className={styles.diagLabel}>YOU</span>
                <span className={styles.diagSub}>
                  sets direction &amp; priorities
                </span>
              </div>
            </div>

            <div className={styles.diagConnector}>↓</div>

            <div className={styles.diagRow}>
              <div className={`${styles.diagBox} ${styles.diagJarvis}`}>
                <span className={styles.diagLabel}>JARVIS</span>
                <span className={styles.diagSub}>
                  chief of staff, always on
                </span>
              </div>
            </div>

            <div className={styles.diagConnector}>↓</div>

            <div className={styles.diagRow}>
              <div className={styles.diagBox}>
                <span className={styles.diagLabel}>EXECUTIVE TIER</span>
                <span className={styles.diagSub}>
                  planning &amp; oversight agents
                </span>
              </div>
              <div className={styles.diagBox}>
                <span className={styles.diagLabel}>WORKER TIER</span>
                <span className={styles.diagSub}>
                  specialist agents that execute
                </span>
              </div>
            </div>

            <div className={styles.diagConnector}>↓</div>

            <div className={styles.diagRow}>
              <div className={`${styles.diagBox} ${styles.diagSpine}`}>
                <span className={styles.diagLabel}>KANBAN SPINE</span>
                <span className={styles.diagSub}>
                  the coordination layer work moves through
                </span>
              </div>
            </div>

            <div className={styles.diagConnector}>↓</div>

            <div className={styles.diagRow}>
              <div className={styles.diagBox}>
                <span className={styles.diagLabel}>VAULTS</span>
                <span className={styles.diagSub}>
                  per-business knowledge, one per company
                </span>
              </div>
              <div className={styles.diagBox}>
                <span className={styles.diagLabel}>BUSINESSES</span>
                <span className={styles.diagSub}>
                  the orgs actually running
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>A day with Jarvis</h2>
          <ul className={styles.dayList}>
            <li className={styles.dayItem}>
              <span className={styles.dayLabel}>Morning brief</span> — a
              rollup of what happened overnight across every business,
              ranked by what actually needs me.
            </li>
            <li className={styles.dayItem}>
              <span className={styles.dayLabel}>Routing</span> — new work
              gets triaged and handed to the right business, not stacked in
              one inbox.
            </li>
            <li className={styles.dayItem}>
              <span className={styles.dayLabel}>Oversight</span> — Jarvis
              watches the board all day, escalating anything stalled instead
              of waiting for a status meeting.
            </li>
            <li className={styles.dayItem}>
              <span className={styles.dayLabel}>Evening report</span> — a
              summary of what moved, what&apos;s blocked, and what decision
              I owe by tomorrow.
            </li>
          </ul>
        </section>

        <footer className={styles.footer}>
          <h2 className={styles.footerTitle}>See it live</h2>
          <div className={styles.footerActions}>
            <a
              href={jarvis.hqUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.hqBtn}
            >
              Visit RYUCO HQ →
            </a>
            <Link href="/" className={styles.backLink}>
              ← Back to the gateway
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
