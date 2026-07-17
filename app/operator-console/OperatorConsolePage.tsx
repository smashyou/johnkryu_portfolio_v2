"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { projects, services, profile, type Project } from "@/app/data/content";
import ProjectLightbox from "@/app/components/shared/ProjectLightbox";
import SwitchPill from "@/app/components/shared/SwitchPill";
import ResumeModal from "@/app/components/ResumeModal";
import { useContactForm } from "@/app/components/shared/useContactForm";
import { usePrefersReducedMotion } from "@/app/components/shared/usePrefersReducedMotion";
import BootSequence from "./BootSequence";
import styles from "./console.module.css";

const ACCENT = "#00ff9c";

type CommitEntry = { hash: string; years: string; title: string; desc: string };

// Verbatim from the reference script's `commits` array (renderVals) in
// design_handoff_portfolio_redesign/Concept 3 - Operator Console.dc.html —
// career history rendered as `git log --career`.
const COMMITS: CommitEntry[] = [
  {
    hash: "a1f2c3d",
    years: "2025 — now",
    title: "feat(tecace): AI Engineer — enterprise agentic-AI platform",
    desc: "RAG pipelines · LangGraph flow builder · Slack/Teams gateway · RRF + cross-encoder reranking · 500+ endpoint public API · cloud or fully on-prem",
  },
  {
    hash: "b4e5f6a",
    years: "2022 — now",
    title: "feat(roem): e-commerce brand from concept to market",
    desc: "custom Shopify (Liquid) · logistics · Google/Facebook campaigns",
  },
  {
    hash: "c7a8b9c",
    years: "2017 — 2021",
    title: "feat(comcast): Xfinity Flex + cloud X1 Guide",
    desc: "Flex middleware from scratch → 1M+ subs in 6 months (10× goal) · X1 Guide serving 31M customers · distributed systems at scale",
  },
  {
    hash: "d0c1d2e",
    years: "2016 — 2017",
    title: "init(parkgorithm): founder — urban parking startup",
    desc: "cross-functional team · Android MVP",
  },
  {
    hash: "e3f4a5b",
    years: "2015 — 2016",
    title: "feat(graphite): Android + web client engineering",
    desc: "responsive UIs · cross-platform",
  },
  {
    hash: "f6b7c8d",
    years: "2015",
    title: "research(temple/NSF): computer vision for robotics",
    desc: "'Supported_By' spatial-relationship algorithm · BS Computer Science, Temple University",
  },
  {
    hash: "0d9e0f1",
    years: "2011 — 2013",
    title: "init(fatty_pocket): first venture, age 20",
    desc: "coupon-marketing platform · sales teams · vendor partnerships",
  },
];

type ModuleEntry = { name: string; pct: number; note: string };

// Verbatim from the reference script's `mods` array (renderVals) — the
// "Loaded modules" progress bars.
const MODULES: ModuleEntry[] = [
  { name: "claude_code.agent", pct: 97, note: "CCA-F" },
  { name: "multi_agent_orch.so", pct: 95, note: "daily" },
  { name: "mcp_servers.so", pct: 93, note: "prod" },
  { name: "rag_hybrid_search.so", pct: 94, note: "prod" },
  { name: "langgraph_langchain.so", pct: 92, note: "prod" },
  { name: "vllm_bedrock.ko", pct: 90, note: "prod" },
  { name: "react_next_ts.so", pct: 93, note: "prod" },
  { name: "python_fastapi.so", pct: 92, note: "prod" },
  { name: "java_spring.jar", pct: 89, note: "prod" },
  { name: "milvus_postgres.db", pct: 90, note: "prod" },
  { name: "k8s_docker_aws.ko", pct: 89, note: "hybrid" },
];

const BAR_STAGGER_MS = 120;
const BAR_TRANSITION = "width 1.2s cubic-bezier(.2,.8,.2,1)";

/**
 * The 11 "Loaded modules" progress bars. Reference animates each bar's width
 * from 0% to its target percentage on mount with a 120ms stagger; here that
 * trigger is gated behind an IntersectionObserver so the bars only animate
 * once the section scrolls into view. Reduced motion: bars render at their
 * final width immediately, no observer/transition.
 */
function ModuleBars({ reducedMotion }: { reducedMotion: boolean }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);
  const animatedRef = useRef(false);

  useEffect(() => {
    if (reducedMotion) {
      barRefs.current.forEach((el, i) => {
        if (el) el.style.width = `${MODULES[i].pct}%`;
      });
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || animatedRef.current) return;
        animatedRef.current = true;
        barRefs.current.forEach((el, i) => {
          if (!el) return;
          timers.push(
            setTimeout(() => {
              el.style.transition = BAR_TRANSITION;
              el.style.width = `${MODULES[i].pct}%`;
            }, i * BAR_STAGGER_MS)
          );
        });
        observer.disconnect();
      },
      { threshold: 0.2 }
    );
    observer.observe(container);

    return () => {
      observer.disconnect();
      timers.forEach(clearTimeout);
    };
  }, [reducedMotion]);

  return (
    <div ref={containerRef} className={styles.modulesCard}>
      {MODULES.map((m, i) => (
        <div key={m.name} className={styles.moduleRow}>
          <span className={styles.moduleName}>{m.name}</span>
          <div className={styles.moduleBarTrack}>
            <div
              ref={(el) => {
                barRefs.current[i] = el;
              }}
              className={styles.moduleBarFill}
              style={{ width: reducedMotion ? `${m.pct}%` : "0%" }}
            />
          </div>
          <span className={styles.moduleMeta}>
            {m.pct}% · {m.note}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function OperatorConsolePage() {
  const reducedMotion = usePrefersReducedMotion();
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
      {/* CRT overlays */}
      <div className={styles.scanlines} aria-hidden />
      <div className={styles.scanBand} aria-hidden />
      <div className={styles.vignette} aria-hidden />

      {/* STATUS BAR */}
      <div className={styles.statusBar}>
        <div className={styles.statusLeft}>
          <span className={styles.statusBrand}>RYU.OS v3.0</span>
          <span className={styles.statusOperator}>{"// operator: john_k_ryu"}</span>
          <SwitchPill accent={ACCENT} />
        </div>
        <nav className={styles.statusNav}>
          {/* Tilde links live in their own scrollable strip so on narrow
              viewports this row can scroll horizontally instead of wrapping
              onto multiple lines, while RESUME (below, a nav sibling) stays
              pinned and always reachable without scrolling. */}
          <div className={styles.statusNavScroll}>
            <a href="#boot" onClick={scrollTo("boot")} className={styles.statusLink}>
              ~/boot
            </a>
            <a
              href="#profile"
              onClick={scrollTo("profile")}
              className={styles.statusLink}
            >
              ~/profile
            </a>
            <a href="#log" onClick={scrollTo("log")} className={styles.statusLink}>
              ~/log
            </a>
            <a href="#stack" onClick={scrollTo("stack")} className={styles.statusLink}>
              ~/stack
            </a>
            <a
              href="#services"
              onClick={scrollTo("services")}
              className={styles.statusLink}
            >
              ~/services
            </a>
            <a
              href="#deploys"
              onClick={scrollTo("deploys")}
              className={styles.statusLink}
            >
              ~/deploys
            </a>
            <a
              href="#uplink"
              onClick={scrollTo("uplink")}
              className={styles.statusLink}
            >
              ~/uplink
            </a>
          </div>
          <button
            type="button"
            onClick={() => setResumeOpen(true)}
            className={styles.statusResumeBtn}
          >
            RESUME
          </button>
        </nav>
        <div className={styles.statusRight}>
          STATUS: <span className={styles.statusOnline}>● ONLINE</span>
        </div>
      </div>

      {/* BOOT / HERO */}
      <section id="boot" className={styles.bootSection}>
        <BootSequence>
          <h1 className={styles.heroTitle}>{profile.name}</h1>
          <div className={styles.heroTagline}>
            &gt; {profile.title}
            <span className={styles.caret}>_</span>
          </div>
          <div className={styles.heroCtas}>
            <a
              href="#deploys"
              onClick={scrollTo("deploys")}
              className={styles.ctaPrimary}
            >
              $ ls ~/deploys
            </a>
            <a
              href="#uplink"
              onClick={scrollTo("uplink")}
              className={styles.ctaSecondary}
            >
              $ open uplink
            </a>
          </div>
        </BootSequence>
      </section>

      {/* PROFILE */}
      <section id="profile" className={styles.section}>
        <div className={styles.sectionPrompt}>$ cat ~/profile/readme.md</div>
        <h2 className={styles.sectionTitle}>{"// PROFILE"}</h2>
        <div className={styles.profileGrid}>
          <div className={styles.readmeCard}>
            <p className={styles.readmeText}>
              <span className={styles.readmeHash}># </span>
              Temple CS + NSF computer-vision research → startups (Fatty
              Pocket at 20, Parkgorithm) → Comcast X1 &amp; Flex: middleware
              from the ground up, 1M+ Flex subscriptions in 6 months (10×
              goal), cloud X1 Guide serving 31M customers → founder again
              (Roem Ventures) → AI Engineer @ TecAce, Bellevue:
              governance-first enterprise agentic-AI platform. RAG,
              LangGraph, MCP, hybrid cloud/on-prem, Claude Code as daily
              driver. Anthropic CCA-F certified.
            </p>
            <div className={styles.readmeMeta}>
              <span className={styles.readmeMetaLabel}>mantra:</span>
              <span className={styles.readmeMetaValue}>
                &quot;{profile.mantras[0].toLowerCase()}&quot;
              </span>
              <span className={styles.readmeMetaLabel}>energy:</span>
              <span className={styles.readmeMetaValue}>
                &quot;{profile.mantras[1].toLowerCase()}&quot;
              </span>
              <span className={styles.readmeMetaLabel}>mode:</span>
              <span className={styles.readmeMetaValue}>
                student_of_life = true
              </span>
              <span className={styles.readmeMetaLabel}>uptime:</span>
              <span className={styles.readmeMetaValue}>
                10+ years in production
              </span>
            </div>
          </div>
          <div className={styles.idCard}>
            <div className={styles.idCardHeader}>
              <span>OPERATOR ID</span>
              <span className={styles.idCardClearance}>CLEARANCE: CCA-F</span>
            </div>
            <div className={styles.idCardPhotoWrap}>
              <img
                src="/images/profile/hero.png"
                alt="John K. Ryu"
                className={styles.idCardPhoto}
              />
            </div>
            <div className={styles.idCardFooter}>
              id: john_k_ryu
              <br />
              loc: bellevue_wa
              <br />
              role: ai_engineer · founder×3
            </div>
          </div>
        </div>
        <div className={styles.fieldStrip}>
          <img
            src="/images/profile/hiking.jpg"
            alt="John hiking"
            className={styles.fieldPhoto}
          />
          <div className={styles.fieldCaption}>
            <span>img_0231.raw — operator in the field</span>
            <span>student_of_life = true</span>
          </div>
        </div>
      </section>

      {/* COMMIT HISTORY */}
      <section id="log" className={styles.section}>
        <div className={styles.sectionPrompt}>
          $ git log --career --reverse=false
        </div>
        <h2 className={styles.sectionTitle}>{"// COMMIT HISTORY"}</h2>
        <div className={styles.commitLog}>
          {COMMITS.map((c) => (
            <div key={c.hash} className={styles.commitRow}>
              <span className={styles.commitHash}>{c.hash}</span>
              <span className={styles.commitYears}>{c.years}</span>
              <div>
                <div className={styles.commitTitle}>{c.title}</div>
                <div className={styles.commitDesc}>{c.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* LOADED MODULES */}
      <section id="stack" className={styles.section}>
        <div className={styles.sectionPrompt}>$ htop --modules</div>
        <h2 className={styles.sectionTitle}>{"// LOADED MODULES"}</h2>
        <ModuleBars reducedMotion={reducedMotion} />
      </section>

      {/* SERVICES (added) */}
      <section id="services" className={styles.section}>
        <div className={styles.sectionPrompt}>$ services --list</div>
        <h2 className={styles.sectionTitle}>{"// SERVICES"}</h2>
        <div className={styles.servicesCard}>
          {services.map((category) => (
            <div key={category.title} className={styles.serviceCategory}>
              <div className={styles.serviceCategoryTitle}>
                {"// "}
                {category.title}
              </div>
              {category.items.map((item) => (
                <div key={item.label} className={styles.serviceItemBlock}>
                  <div className={styles.serviceItemLine}>+ {item.label}</div>
                  {item.subitems.map((subitem) => (
                    <div key={subitem} className={styles.serviceSubitemLine}>
                      - {subitem}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* DEPLOYS (added — all 8 projects) */}
      <section id="deploys" className={styles.section}>
        <div className={styles.sectionPrompt}>
          $ ls -la ~/deploys --sort=impact
        </div>
        <h2 className={styles.sectionTitle}>{"// PRODUCTION DEPLOYS"}</h2>
        <div className={styles.deployList}>
          {projects.map((project) => (
            <div key={project.id} className={styles.deployRow}>
              <button
                type="button"
                className={styles.deployThumbBtn}
                onClick={() => setLightboxProject(project)}
                aria-label={`View ${project.title} screenshots`}
              >
                <img
                  src={project.images[0]}
                  alt=""
                  aria-hidden
                  className={styles.deployThumbBackdrop}
                />
                <img
                  src={project.images[0]}
                  alt={project.title}
                  className={styles.deployThumbImg}
                />
                <div className={styles.deployThumbOverlay}>
                  <span className={styles.deployThumbOverlayText}>
                    screenshots [{project.images.length}]
                  </span>
                </div>
              </button>
              <div className={styles.deployContent}>
                <div className={styles.deployHead}>
                  <span className={styles.deployTag}>▲ vercel deploy</span>
                  <h3 className={styles.deployTitle}>{project.title}</h3>
                </div>
                <p className={styles.deployDesc}>{project.subtitle}</p>
                <div className={styles.deployTags}>
                  {project.tags.map((tag) => (
                    <span key={tag} className={styles.deployTagPill}>
                      {tag}
                    </span>
                  ))}
                </div>
                <div className={styles.deployFooter}>
                  <a
                    href={project.demo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.deployLiveLink}
                  >
                    ● LIVE ↗
                  </a>
                  {project.github && (
                    <a
                      href={project.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.deployLiveLink}
                    >
                      GitHub ↗
                    </a>
                  )}
                  <button
                    type="button"
                    className={styles.deployScreenshotsBtn}
                    onClick={() => setLightboxProject(project)}
                  >
                    screenshots [{project.images.length}]
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* UPLINK */}
      <section id="uplink" className={styles.section}>
        <div className={styles.sectionPrompt}>$ ssh guest@johnkryu.dev</div>
        <h2 className={styles.sectionTitle}>{"// OPEN UPLINK"}</h2>
        <div className={styles.uplinkCard}>
          <p className={styles.uplinkCopy}>
            Connection accepted. Open to AI engineering roles, consulting
            engagements, and interesting collaborations. Response latency:
            low.
          </p>
          <div className={styles.uplinkCtas}>
            <a
              href={`mailto:${profile.email}`}
              className={styles.uplinkMailBtn}
            >
              $ mail {profile.email}
            </a>
            <button
              type="button"
              className={styles.uplinkResumeBtn}
              onClick={() => setResumeOpen(true)}
            >
              $ cat resume.pdf
            </button>
          </div>
          <div className={styles.uplinkSocialRow}>
            <a
              href={profile.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.uplinkSocialLink}
            >
              [linkedin]
            </a>
            <a
              href={profile.github}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.uplinkSocialLink}
            >
              [github]
            </a>
            <a
              href="https://instagram.com/johnminryu"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.uplinkSocialLink}
            >
              [instagram]
            </a>
          </div>

          <div className={styles.uplinkFormWrap}>
            <div className={styles.uplinkFormTitle}>
              $ compose --to {profile.email}
            </div>
            <form onSubmit={onSubmit} className={styles.uplinkForm}>
              <div className={styles.uplinkField}>
                <label className={styles.uplinkFieldLabel}>&gt; name:</label>
                <input
                  {...register("name", { required: "Name is required" })}
                  type="text"
                  placeholder="operator_name"
                  className={styles.uplinkInput}
                />
                {errors.name && (
                  <p className={styles.uplinkFieldError}>
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div className={styles.uplinkField}>
                <label className={styles.uplinkFieldLabel}>&gt; email:</label>
                <input
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
                    },
                  })}
                  type="email"
                  placeholder="you@domain.com"
                  className={styles.uplinkInput}
                />
                {errors.email && (
                  <p className={styles.uplinkFieldError}>
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div className={styles.uplinkField}>
                <label className={styles.uplinkFieldLabel}>
                  &gt; message:
                </label>
                <textarea
                  {...register("message", { required: "Message is required" })}
                  rows={5}
                  placeholder="transmit payload..."
                  className={styles.uplinkTextarea}
                />
                {errors.message && (
                  <p className={styles.uplinkFieldError}>
                    {errors.message.message}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className={styles.uplinkSubmitBtn}
              >
                {isSubmitting ? "$ sending..." : "$ send --message"}
              </button>
              {submitMessage && (
                <p className={styles.uplinkSubmitMsg}>{submitMessage}</p>
              )}
            </form>
          </div>
        </div>
        <div className={styles.copyright}>
          © 2026 RYU.OS — session logged · be the energy you want to attract
        </div>
      </section>

      <ProjectLightbox project={lightboxProject} onClose={closeLightbox} />
      {resumeOpen && <ResumeModal onClose={() => setResumeOpen(false)} />}
    </div>
  );
}
