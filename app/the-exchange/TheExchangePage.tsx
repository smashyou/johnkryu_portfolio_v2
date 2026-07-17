"use client";

import { useCallback, useState } from "react";
import { projects, services, skills, profile, type Project } from "@/app/data/content";
import ProjectLightbox from "@/app/components/shared/ProjectLightbox";
import SwitchPill from "@/app/components/shared/SwitchPill";
import ResumeModal from "@/app/components/ResumeModal";
import { useContactForm } from "@/app/components/shared/useContactForm";
import CandlestickChart from "./CandlestickChart";
import styles from "./exchange.module.css";

const ACCENT = "#f5b942";

// Verbatim from the reference script's `ticker` array in
// design_handoff_portfolio_redesign/Concept 6 - The Exchange.dc.html
// (renderVals) — doubled below for the seamless 40s scroll loop.
const TICKER: { sym: string; val: string; color: string }[] = [
  { sym: "RYU", val: "▲ +1,540%", color: "#2fd575" },
  { sym: "AGENTIC-AI", val: "▲ OVERWEIGHT", color: "#2fd575" },
  { sym: "COMCAST.X1", val: "31M USERS", color: "#8d97ab" },
  { sym: "FLEX", val: "▲ 10× TARGET", color: "#2fd575" },
  { sym: "RAG", val: "▲ PROD", color: "#2fd575" },
  { sym: "LANGGRAPH", val: "▲ PROD", color: "#2fd575" },
  { sym: "CCA-F", val: "CERTIFIED", color: "#f5b942" },
  { sym: "VENTURES", val: "3 FOUNDED", color: "#f5b942" },
  { sym: "CLAUDE.CODE", val: "▲ DAILY DRIVER", color: "#2fd575" },
  { sym: "SLEEP", val: "▼ UNDERWEIGHT", color: "#e05252" },
];
const TICKER_LOOP = [...TICKER, ...TICKER];

// Verbatim from the reference script's `thesis` array.
const THESIS = [
  {
    num: "α",
    title: "Scale-proven engineering",
    desc: "Four years on Comcast X1 — middleware for Xfinity Flex built from scratch, 1M+ subscriptions in six months, cloud guide software serving 31M customers.",
  },
  {
    num: "β",
    title: "Founder-grade ownership",
    desc: "Three ventures since age twenty. Understands unit economics, acquisition costs, and shipping under constraint — an engineer who reads a P&L.",
  },
  {
    num: "γ",
    title: "AI-native operating model",
    desc: "Builds with Claude Code, MCP, and multi-agent orchestration daily. Anthropic CCA-F certified. Architecting governance-first enterprise agentic-AI at TecAce.",
  },
];

// Allocation/trend figures transcribed verbatim from the reference script's
// `holdings` array, keyed by the matching `skills[].title` from
// @/app/data/content so the row content itself is sourced from the shared
// data layer (positions = skills[].skills.join(" · ")).
const HOLDINGS_META: Record<string, { alloc: number; allocW: string; trend: string }> = {
  "Agentic / AI-Native Development": { alloc: 24, allocW: "96%", trend: "▲▲▲" },
  "AI / ML": { alloc: 22, allocW: "88%", trend: "▲▲▲" },
  Frontend: { alloc: 14, allocW: "56%", trend: "▲▲" },
  Backend: { alloc: 18, allocW: "72%", trend: "▲▲" },
  Databases: { alloc: 11, allocW: "44%", trend: "▲" },
  "Cloud / On-Prem / DevOps": { alloc: 11, allocW: "44%", trend: "▲▲" },
};

// $TICKER + status badges for the Deals grid. The first four are verbatim
// from the reference script's `deals` array (matched by project id); the
// remaining four projects aren't in that reference (which only showed 4 of
// the 8), so tickers/status are invented in the same naming style per the
// task brief (e.g. $RCTJS for React.js Presentation, $K8S for Cosmic
// Kitchen).
const DEALS_META: Record<number, { sym: string; status: string }> = {
  8: { sym: "$STUDIO", status: "ENTERPRISE · LIVE" },
  1: { sym: "$SCOPE", status: "SAAS · LIVE" },
  2: { sym: "$RECMP", status: "SAAS · LIVE" },
  3: { sym: "$PLNTH", status: "EDTECH · LIVE" },
  4: { sym: "$JKPOT", status: "SAAS · LIVE" },
  5: { sym: "$GUIDE", status: "TRAVEL · LIVE" },
  6: { sym: "$RCTJS", status: "TALK · LIVE" },
  7: { sym: "$K8S", status: "TALK · LIVE" },
};

// Flattened Desk Services rows (added section) — full content verbatim from
// @/app/data/content `services`, one row per offering; detail joins that
// offering's subitems the same way the Holdings "positions" column joins
// skills.
const SERVICE_ROWS = services.flatMap((category) =>
  category.items.map((item) => ({
    desk: category.title,
    offering: item.label,
    detail: item.subitems.join(" · "),
  }))
);

export default function TheExchangePage() {
  const [lightboxProject, setLightboxProject] = useState<Project | null>(null);
  const [resumeOpen, setResumeOpen] = useState(false);

  const closeLightbox = useCallback(() => setLightboxProject(null), []);

  const { register, errors, onSubmit, isSubmitting, submitMessage } =
    useContactForm();

  const scrollTo = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className={styles.page}>
      {/* TICKER TAPE */}
      <div className={styles.ticker}>
        <div className={styles.tickerTrack}>
          {TICKER_LOOP.map((t, i) => (
            <span key={i} className={styles.tickerItem}>
              <span className={styles.tickerSym}>{t.sym}</span>{" "}
              <span style={{ color: t.color }}>{t.val}</span>
            </span>
          ))}
        </div>
      </div>

      {/* NAV */}
      <nav className={styles.nav}>
        <div className={styles.navLeft}>
          <span className={styles.navBrand}>
            RYU<span className={styles.navBrandAccent}>:NYSE</span>
          </span>
          <SwitchPill accent={ACCENT} />
        </div>
        <div className={styles.navLinks}>
          <a href="#thesis" onClick={scrollTo("thesis")} className={styles.navLink}>
            Thesis
          </a>
          <a href="#chart" onClick={scrollTo("chart")} className={styles.navLink}>
            Chart
          </a>
          <a href="#holdings" onClick={scrollTo("holdings")} className={styles.navLink}>
            Holdings
          </a>
          <a href="#services" onClick={scrollTo("services")} className={styles.navLink}>
            Services
          </a>
          <a href="#deals" onClick={scrollTo("deals")} className={styles.navLink}>
            Deals
          </a>
          <button
            type="button"
            onClick={() => setResumeOpen(true)}
            className={styles.navResumeBtn}
          >
            Resume
          </button>
          <a href="#invest" onClick={scrollTo("invest")} className={styles.navCta}>
            Invest
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section id="hero" className={styles.hero}>
        <div className={styles.heroCopy}>
          <div className={styles.heroBadge}>
            ▲ RYU +1,540% ALL-TIME · MARKET OPEN
          </div>
          <h1 className={styles.heroTitle}>
            The best asset
            <br />
            I ever built
            <br />
            is <span className={styles.heroTitleAccent}>compounding.</span>
          </h1>
          <p className={styles.heroLede}>
            {profile.name} — AI engineer with a founder&apos;s P&amp;L. Fifteen
            years of compounding skills: NSF research → Comcast scale → three
            ventures → enterprise agentic AI. Dividends paid in shipped
            products.
          </p>
          <div className={styles.heroCtas}>
            <a href="#deals" onClick={scrollTo("deals")} className={styles.ctaPrimary}>
              View the deals
            </a>
            <a href="#chart" onClick={scrollTo("chart")} className={styles.ctaSecondary}>
              Growth chart
            </a>
          </div>
        </div>
        <div className={styles.heroCard}>
          <div className={styles.stockCard}>
            <div className={styles.stockCardHead}>
              <span className={styles.stockCardTicker}>
                RYU — {profile.name.toUpperCase()}, COMMON STOCK
              </span>
              <span className={styles.stockCardLive}>● LIVE</span>
            </div>
            <div className={styles.stockCardImgWrap}>
              <img
                src="/images/profile/hero.png"
                alt={profile.name}
                className={styles.stockCardImg}
              />
            </div>
            <div className={styles.stockCardStats}>
              <div className={styles.statCell}>
                <div className={styles.statValue}>31M</div>
                <div className={styles.statLabel}>users reached</div>
              </div>
              <div className={styles.statCell}>
                <div className={styles.statValue}>10×</div>
                <div className={styles.statLabel}>target beaten</div>
              </div>
              <div className={styles.statCell}>
                <div className={styles.statValue}>3</div>
                <div className={styles.statLabel}>ventures founded</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* THESIS */}
      <section id="thesis" className={styles.section}>
        <div className={styles.sectionEyebrow}>01 · INVESTMENT THESIS</div>
        <h2 className={styles.sectionTitle}>Why RYU outperforms.</h2>
        <div className={styles.thesisGrid}>
          {THESIS.map((t) => (
            <div key={t.num} className={styles.thesisCard}>
              <div className={styles.thesisNum}>{t.num}</div>
              <h3 className={styles.thesisTitle}>{t.title}</h3>
              <p className={styles.thesisDesc}>{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CHART */}
      <section id="chart" className={styles.section}>
        <div className={styles.sectionEyebrow}>02 · PRICE HISTORY</div>
        <h2 className={styles.sectionTitle}>Fifteen years, one direction.</h2>
        <div className={styles.chartCard}>
          <CandlestickChart />
          <div className={styles.chartHint}>
            HOVER THE CHART — EACH CANDLE IS A CAREER CHAPTER
          </div>
        </div>
      </section>

      {/* HOLDINGS */}
      <section id="holdings" className={styles.section}>
        <div className={styles.sectionEyebrow}>03 · PORTFOLIO HOLDINGS</div>
        <h2 className={styles.sectionTitle}>Skill allocation.</h2>
        <div className={styles.tableWrap}>
          <div className={styles.tableScroll}>
            <div className={`${styles.tableHeadRow} ${styles.holdingsHeadRow}`}>
              <span>SECTOR</span>
              <span>POSITIONS</span>
              <span style={{ textAlign: "right" }}>ALLOCATION</span>
              <span style={{ textAlign: "right" }}>TREND</span>
            </div>
            {skills.map((group) => {
              const meta = HOLDINGS_META[group.title] ?? {
                alloc: 0,
                allocW: "0%",
                trend: "—",
              };
              return (
                <div
                  key={group.title}
                  className={`${styles.tableRow} ${styles.holdingsRow}`}
                >
                  <span className={styles.holdingSector}>{group.title}</span>
                  <span className={styles.holdingPositions}>
                    {group.skills.join(" · ")}
                  </span>
                  <div className={styles.holdingAllocCol}>
                    <span className={styles.holdingAllocValue}>{meta.alloc}%</span>
                    <div className={styles.allocBarTrack}>
                      <div
                        className={styles.allocBarFill}
                        style={{ width: meta.allocW }}
                      />
                    </div>
                  </div>
                  <span className={styles.holdingTrend}>{meta.trend}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* DESK SERVICES (added) */}
      <section id="services" className={styles.section}>
        <div className={styles.sectionEyebrow}>04 · DESK SERVICES</div>
        <h2 className={styles.sectionTitle}>What the desk covers.</h2>
        <div className={styles.tableWrap}>
          <div className={styles.tableScroll}>
            <div className={`${styles.tableHeadRow} ${styles.servicesHeadRow}`}>
              <span>DESK</span>
              <span>OFFERING</span>
              <span>DETAIL</span>
            </div>
            {SERVICE_ROWS.map((row, i) => (
              <div
                key={`${row.desk}-${row.offering}-${i}`}
                className={`${styles.tableRow} ${styles.servicesRow}`}
              >
                <span className={styles.serviceDesk}>{row.desk}</span>
                <span className={styles.serviceOffering}>{row.offering}</span>
                <span className={styles.serviceDetail}>{row.detail}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEALS */}
      <section id="deals" className={styles.section}>
        <div className={styles.sectionEyebrow}>05 · ACTIVE DEALS</div>
        <h2 className={styles.sectionTitle}>Products in the market.</h2>
        <div className={styles.dealsGrid}>
          {projects.map((project) => {
            const meta = DEALS_META[project.id] ?? {
              sym: "$RYU",
              status: "LIVE",
            };
            return (
              <div key={project.id} className={styles.dealCard}>
                <button
                  type="button"
                  className={styles.dealImageBtn}
                  onClick={() => setLightboxProject(project)}
                  aria-label={`View ${project.title} screenshots`}
                >
                  <img
                    src={project.images[0]}
                    alt={project.title}
                    className={styles.dealImage}
                  />
                  <div className={styles.dealImageGradient} />
                  <div className={styles.dealImageMeta}>
                    <span className={styles.dealSym}>{meta.sym}</span>
                    <span className={styles.dealStatus}>{meta.status}</span>
                  </div>
                  <span className={styles.dealShotsHint}>
                    screenshots [{project.images.length}]
                  </span>
                </button>
                <div className={styles.dealContent}>
                  <h3 className={styles.dealTitle}>{project.title}</h3>
                  <p className={styles.dealDesc}>{project.subtitle}</p>
                  <div className={styles.dealFooter}>
                    <a
                      href={project.demo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.dealLink}
                    >
                      Live demo ↗
                    </a>
                    {project.github && (
                      <a
                        href={project.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.dealLink}
                      >
                        GitHub ↗
                      </a>
                    )}
                    <button
                      type="button"
                      className={styles.dealLink}
                      onClick={() => setLightboxProject(project)}
                    >
                      Screenshots [{project.images.length}]
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* INVEST / CONTACT */}
      <section id="invest" className={styles.invest}>
        <div className={styles.investEyebrow}>06 · OPEN POSITION</div>
        <h2 className={styles.investTitle}>Buy-side interest?</h2>
        <p className={styles.investCopy}>
          Accepting term sheets: AI engineering roles, consulting engagements,
          and collaborations with asymmetric upside.
        </p>
        <div className={styles.investCtas}>
          <a href={`mailto:${profile.email}`} className={styles.mailBtn}>
            {profile.email}
          </a>
          <button
            type="button"
            className={styles.investResumeBtn}
            onClick={() => setResumeOpen(true)}
          >
            View Resume
          </button>
        </div>
        <div className={styles.socialRow}>
          <a
            href={profile.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.socialLink}
          >
            LinkedIn
          </a>
          <a
            href={profile.github}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.socialLink}
          >
            GitHub
          </a>
          <a
            href="https://instagram.com/johnminryu"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.socialLink}
          >
            Instagram
          </a>
        </div>

        <div className={styles.formWrap}>
          <h3 className={styles.formTitle}>&gt; SUBMIT AN ORDER</h3>
          <form onSubmit={onSubmit} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="exchange-name">
                NAME
              </label>
              <input
                id="exchange-name"
                {...register("name", { required: "Name is required" })}
                type="text"
                placeholder="Your full name"
                className={styles.input}
              />
              {errors.name && (
                <p className={styles.fieldError}>{errors.name.message}</p>
              )}
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="exchange-email">
                EMAIL
              </label>
              <input
                id="exchange-email"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                })}
                type="email"
                placeholder="you@company.com"
                className={styles.input}
              />
              {errors.email && (
                <p className={styles.fieldError}>{errors.email.message}</p>
              )}
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="exchange-message">
                MESSAGE
              </label>
              <textarea
                id="exchange-message"
                {...register("message", { required: "Message is required" })}
                rows={5}
                placeholder="Terms, timeline, or just say hi."
                className={styles.textarea}
              />
              {errors.message && (
                <p className={styles.fieldError}>{errors.message.message}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className={styles.submitBtn}
            >
              {isSubmitting ? "Submitting…" : "Submit inquiry"}
            </button>
            {submitMessage && (
              <p className={styles.submitMsg}>{submitMessage}</p>
            )}
          </form>
        </div>

        <div className={styles.disclaimer}>
          © 2026 JOHN K. RYU · PAST PERFORMANCE IS INDICATIVE OF RELENTLESS
          FUTURE RESULTS
        </div>
      </section>

      <ProjectLightbox project={lightboxProject} onClose={closeLightbox} />
      {resumeOpen && <ResumeModal onClose={() => setResumeOpen(false)} />}
    </div>
  );
}
