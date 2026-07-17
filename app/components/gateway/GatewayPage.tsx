"use client";

import Link from "next/link";
import { concepts, profile } from "@/app/data/content";
import { useVotes } from "@/app/components/shared/useVotes";
import StarfieldCanvas from "./StarfieldCanvas";
import styles from "./gateway.module.css";

// CSS custom property used to drive the per-card accent color in :hover
// rules defined in gateway.module.css (border-color / color: var(--accent)).
type AccentVars = React.CSSProperties & { "--accent"?: string };

// Split for mobile: each role phrase gets its own nowrap span so the
// eyebrow line only wraps between phrases (never mid-phrase) on narrow
// screens. Desktop keeps rendering the joined profile.title string.
const roles = profile.title.split(" · ");

export default function GatewayPage() {
  const { votes, votedFor, castVote } = useVotes();

  const votedName = votedFor
    ? concepts.find((c) => c.id === votedFor)?.title ?? votedFor
    : null;
  const pollMsg = votedName
    ? `You voted for ${votedName}. Tap ▲ on another card to change your vote.`
    : "Tap ▲ on a card to vote for your favorite experience — one vote per visitor.";

  return (
    <div className={styles.page}>
      <StarfieldCanvas />

      <div className={styles.content}>
        <div className={styles.avatarWrap}>
          <div className={styles.avatarGlow} />
          <div className={styles.avatarFrame}>
            <img
              src="/images/profile/hero.png"
              alt="John K. Ryu"
              className={styles.avatarImg}
            />
          </div>
        </div>

        <div className={styles.eyebrow}>
          <span className={styles.eyebrowNameLine}>
            <span className={styles.dot} />
            {profile.name}
          </span>
          <span className={styles.eyebrowSep}>{" — "}</span>
          <span className={styles.eyebrowRoles}>
            {roles.map((role, i) => (
              <span className={styles.eyebrowRole} key={role}>
                {role}
                {i < roles.length - 1 ? " · " : ""}
              </span>
            ))}
          </span>
        </div>

        <h1 className={styles.headline}>Choose your experience.</h1>
        <p className={styles.intro}>
          One portfolio, six ways in. Each is a fully different world — same
          engineer underneath. Pick whichever matches your energy.
        </p>

        <div className={styles.grid}>
          {concepts.map((c) => {
            const voted = votedFor === c.id;
            const voteColor = voted ? c.accent : "#8d97ab";
            const voteBorder = voted ? c.accent : "#1c2233";
            return (
              <Link
                key={c.id}
                href={`/${c.slug}`}
                className={styles.card}
                style={{ "--accent": c.accent } as AccentVars}
              >
                <div
                  className={styles.cardHairline}
                  style={{
                    background: `linear-gradient(90deg,transparent,${c.accent},transparent)`,
                  }}
                />
                <div
                  className={styles.cardGlow}
                  style={{
                    background: `radial-gradient(circle,${c.glow},transparent 70%)`,
                  }}
                />
                <div className={styles.cardHead}>
                  <span className={styles.cardTag} style={{ color: c.accent }}>
                    {c.tag}
                  </span>
                  <span
                    className={styles.cardDot}
                    style={{ background: c.accent, boxShadow: `0 0 14px ${c.accent}` }}
                  />
                </div>
                <h2 className={styles.cardTitle}>{c.title}</h2>
                <p className={styles.cardDesc}>{c.desc}</p>
                <div className={styles.cardFooter}>
                  <span className={styles.cardNotes}>{c.notes}</span>
                  <div className={styles.cardActions}>
                    <button
                      type="button"
                      onClick={castVote(c.id)}
                      className={styles.voteBtn}
                      style={
                        {
                          color: voteColor,
                          borderColor: voteBorder,
                          "--accent": c.accent,
                        } as AccentVars
                      }
                    >
                      ▲ {votes[c.id] || 0}
                      {voted ? " ✓" : ""}
                    </button>
                    <span className={styles.enter} style={{ color: c.accent }}>
                      enter →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className={styles.poll}>
          <div className={styles.pollLabel}>VISITOR POLL</div>
          <div className={styles.pollMsg}>{pollMsg}</div>
        </div>

        <div className={styles.footerLinks}>
          <a
            href={profile.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.footerLink}
          >
            LinkedIn
          </a>
          <a
            href={profile.github}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.footerLink}
          >
            GitHub
          </a>
          <a href={`mailto:${profile.email}`} className={styles.footerLink}>
            {profile.email}
          </a>
        </div>
        <div className={styles.copyright}>
          © 2026 John K. Ryu — be the energy you want to attract
        </div>
      </div>
    </div>
  );
}
