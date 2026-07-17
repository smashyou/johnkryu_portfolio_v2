"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  projects,
  services,
  profile,
  type Project,
} from "@/app/data/content";
import ProjectLightbox from "@/app/components/shared/ProjectLightbox";
import SwitchPill from "@/app/components/shared/SwitchPill";
import ResumeModal from "@/app/components/ResumeModal";
import { useContactForm } from "@/app/components/shared/useContactForm";
import { usePrefersReducedMotion } from "@/app/components/shared/usePrefersReducedMotion";
import TeardownScrubber from "./TeardownScrubber";
import styles from "./machine.module.css";

const ACCENT = "#9a6200";

type Chapter = {
  part: string;
  title: string;
  years: string;
  desc: string;
  align: "left" | "right";
};

// Verbatim from the reference script's `chapters` array (renderVals) in
// design_handoff_portfolio_redesign/Concept 5 - The Machine.dc.html — the
// `ml: "0" | "auto"` alternation is expressed here as `align`.
const CHAPTERS: Chapter[] = [
  {
    part: "PART 01 — CRANIAL DOME",
    title: "The shield comes off",
    years: "2025 — PRESENT · AI ENGINEER",
    desc: "Under the dome, the newest layer: building a governance-first enterprise agentic-AI platform — RAG pipelines, LangGraph flow builder, hybrid search with cross-encoder reranking, 500+ endpoint API. Cloud or fully on-prem.",
    align: "left",
  },
  {
    part: "PART 02 — NEURAL CORE",
    title: "The core logic",
    years: "2017 — 2021 · COMCAST",
    desc: "The compute heart was forged at scale: Xfinity Flex middleware built from the ground up — 1M+ subscriptions in six months, 10× the goal — and the cloud X1 Guide serving 31 million customers.",
    align: "right",
  },
  {
    part: "PART 03 — MEMORY BANKS",
    title: "Fast memory, hard lessons",
    years: "2011 — PRESENT · 3 VENTURES",
    desc: "Fatty Pocket at twenty. Parkgorithm. Roem Ventures, concept to market. Founder instincts wired close to the core — cheap to access, expensive to earn.",
    align: "left",
  },
  {
    part: "PART 04 — SENSORY ARRAYS",
    title: "The foundation",
    years: "2015 · TEMPLE UNIVERSITY / NSF",
    desc: "Where perception was trained: NSF-funded computer-vision research for robot object detection — the 'Supported_By' spatial algorithm — and a BS in Computer Science.",
    align: "right",
  },
  {
    part: "REASSEMBLY",
    title: "Put it back together",
    years: "SCROLL ON",
    desc: "Parts are nothing until they seat. Keep scrolling — watch fifteen years lock back into a single running machine.",
    align: "left",
  },
];

// Short tags continuing the "PART NN" motif for the added Services cards,
// one per content.ts `services` category (in array order).
const SERVICE_TAGS: Record<string, string> = {
  "Technical Consulting": "CONSULT",
  "Software Development": "DEV",
  "Social Media & Digital Marketing": "GROWTH",
};

export default function TheMachinePage() {
  const reducedMotion = usePrefersReducedMotion();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [lightboxProject, setLightboxProject] = useState<Project | null>(null);
  const [resumeOpen, setResumeOpen] = useState(false);

  const closeLightbox = useCallback(() => setLightboxProject(null), []);

  const { register, errors, onSubmit, isSubmitting, submitMessage } =
    useContactForm();

  // Chapter-card scroll reveal. The reference script re-evaluates
  // getBoundingClientRect() for every `[data-chapter]` node on every
  // requestAnimationFrame tick; ported here as a single IntersectionObserver
  // (reveal-once, matching the established convention in AuroraGlassPage.tsx)
  // so no RAF/interval loop runs on this route. Reduced motion: everything is
  // marked revealed immediately and no observer is created — the `.reveal`
  // class's CSS transition is disabled and forced visible regardless (see
  // machine.module.css's trailing prefers-reduced-motion block), so visibility
  // never depends on this effect's timing.
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const nodes = root.querySelectorAll<HTMLElement>("[data-reveal]");

    if (reducedMotion) {
      nodes.forEach((el) => el.classList.add(styles.revealed));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.revealed);
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12 }
    );
    nodes.forEach((el) => io.observe(el));

    return () => io.disconnect();
  }, [reducedMotion]);

  const scrollTo = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className={styles.page} ref={containerRef}>
      <TeardownScrubber />

      <SwitchPill accent={ACCENT} className={styles.switchPill} />

      {/* NAV */}
      <nav className={styles.nav}>
        <a href="#hero" onClick={scrollTo("hero")} className={styles.navItemActive}>
          Home
        </a>
        <a href="#services" onClick={scrollTo("services")} className={styles.navItem}>
          Services
        </a>
        <a href="#work" onClick={scrollTo("work")} className={styles.navItem}>
          Work
        </a>
        <button
          type="button"
          onClick={() => setResumeOpen(true)}
          className={styles.navResumeBtn}
        >
          Resume
        </button>
        <a href="#contact" onClick={scrollTo("contact")} className={styles.navItemCta}>
          Contact
        </a>
      </nav>

      {/* SCROLL STORY */}
      <div className={styles.story}>
        {/* HERO */}
        <section id="hero" className={styles.heroSection}>
          <div className={styles.heroCard}>
            <div className={styles.heroEyebrow}>
              <span className={styles.heroEyebrowName}>JOHN K. RYU</span>
              <span className={styles.heroEyebrowSep}> — </span>
              <span className={styles.heroEyebrowSub}>
                TEARDOWN OF AN ENGINEER
              </span>
            </div>
            <h1 className={styles.heroTitle}>
              Every machine
              <br />
              has a story inside.
            </h1>
            <p className={styles.heroLede}>
              Scroll to take the machine mind apart — layer by layer, era by
              era — and watch it come back together.
            </p>
            <div className={styles.heroScrollHint}>SCROLL TO DISASSEMBLE ▼</div>
          </div>
        </section>

        {/* CHAPTERS */}
        {CHAPTERS.map((ch) => (
          <section key={ch.part} className={styles.chapterSection}>
            <div
              data-reveal
              className={`${styles.chapterCard} ${
                ch.align === "right" ? styles.chapterRight : styles.chapterLeft
              } ${styles.reveal}`}
            >
              <div className={styles.chapterEyebrow}>{ch.part}</div>
              <h2 className={styles.chapterTitle}>{ch.title}</h2>
              <div className={styles.chapterYears}>{ch.years}</div>
              <p className={styles.chapterDesc}>{ch.desc}</p>
            </div>
          </section>
        ))}

        {/* SERVICES (added) */}
        <section id="services" className={styles.addedSection}>
          <div className={styles.addedEyebrow}>PART 05 — SERVICE MODULES</div>
          <h2 className={styles.addedTitle}>What else this machine runs.</h2>
          <p className={styles.addedLede}>
            Consulting, full-stack builds, and growth — same rigor as the
            platforms in the chapters above.
          </p>
          <div className={styles.servicesList}>
            {services.map((category) => (
              <div key={category.title} className={styles.serviceCard}>
                <div className={styles.serviceCardHead}>
                  <div className={styles.serviceTag}>
                    {SERVICE_TAGS[category.title] ?? "SVC"}
                  </div>
                  <h3 className={styles.serviceCardTitle}>{category.title}</h3>
                </div>
                <div className={styles.serviceItems}>
                  {category.items.map((item) => (
                    <div key={item.label} className={styles.serviceItem}>
                      <h4 className={styles.serviceItemTitle}>{item.label}</h4>
                      <ul className={styles.serviceChecklist}>
                        {item.subitems.map((subitem) => (
                          <li key={subitem} className={styles.serviceCheckRow}>
                            <span className={styles.checkIcon}>▸</span>
                            <span>{subitem}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* WORK (added) */}
        <section id="work" className={styles.addedSection}>
          <div className={styles.addedEyebrow}>PART 06 — SHIPPED UNITS</div>
          <h2 className={styles.addedTitle}>Machines already in production.</h2>
          <p className={styles.addedLede}>
            Eight builds running today — agentic platforms, SaaS products, and
            the tools that got them there.
          </p>
          <div className={styles.workGrid}>
            {projects.map((project) => (
              <div key={project.id} className={styles.workCard}>
                <button
                  type="button"
                  className={styles.workImageBtn}
                  onClick={() => setLightboxProject(project)}
                  aria-label={`View ${project.title} screenshots`}
                >
                  <img
                    src={project.images[0]}
                    alt=""
                    aria-hidden
                    className={styles.workImageBackdrop}
                  />
                  <img
                    src={project.images[0]}
                    alt={project.title}
                    className={styles.workImage}
                  />
                  <div className={styles.workImageTag}>
                    <span className={styles.workImageTagText}>
                      {project.tags[0]}
                    </span>
                  </div>
                  <div className={styles.workImageOverlay}>
                    <span className={styles.workImageOverlayText}>
                      screenshots [{project.images.length}]
                    </span>
                  </div>
                </button>
                <div className={styles.workContent}>
                  <h3 className={styles.workTitle}>{project.title}</h3>
                  <p className={styles.workDesc}>{project.subtitle}</p>
                  <div className={styles.workTags}>
                    {project.tags.map((tag) => (
                      <span key={tag} className={styles.workTag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className={styles.workFooter}>
                    <a
                      href={project.demo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.workLink}
                    >
                      Live demo ↗
                    </a>
                    {project.github && (
                      <a
                        href={project.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.workLink}
                      >
                        GitHub ↗
                      </a>
                    )}
                    <button
                      type="button"
                      className={styles.workLink}
                      onClick={() => setLightboxProject(project)}
                    >
                      Screenshots [{project.images.length}]
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FINALE */}
        <section className={styles.finaleSection}>
          <div data-reveal className={`${styles.finaleCard} ${styles.reveal}`}>
            <div className={styles.finaleEyebrow}>REASSEMBLY COMPLETE</div>
            <h2 className={styles.finaleTitle}>All parts, one machine.</h2>
            <p className={styles.finaleDesc}>
              Research, scale, ventures, and agentic AI — assembled into one
              engineer. Currently running production workloads, always
              compiling what&apos;s next.
            </p>
          </div>
        </section>

        {/* CONTACT */}
        <section id="contact" className={styles.contactSection}>
          <div className={styles.contactCard}>
            <h2 className={styles.contactTitle}>Want to see it run?</h2>
            <p className={styles.contactCopy}>
              Open to AI engineering roles, consulting, and collaborations
              worth the leap.
            </p>
            <div className={styles.contactCtas}>
              <a href={`mailto:${profile.email}`} className={styles.contactMailBtn}>
                {profile.email}
              </a>
              <button
                type="button"
                className={styles.contactResumeBtn}
                onClick={() => setResumeOpen(true)}
              >
                View résumé
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
            </div>
            <div className={styles.copyright}>
              © 2026 John K. Ryu — every part earned its slot
            </div>

            <div className={styles.formWrap}>
              <h3 className={styles.formTitle}>Send a message</h3>
              <form onSubmit={onSubmit} className={styles.form}>
                <div className={styles.field}>
                  <input
                    {...register("name", { required: "Name is required" })}
                    type="text"
                    placeholder="Your Full Name"
                    className={styles.input}
                  />
                  {errors.name && (
                    <p className={styles.fieldError}>{errors.name.message}</p>
                  )}
                </div>
                <div className={styles.field}>
                  <input
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address",
                      },
                    })}
                    type="email"
                    placeholder="your@email.com"
                    className={styles.input}
                  />
                  {errors.email && (
                    <p className={styles.fieldError}>{errors.email.message}</p>
                  )}
                </div>
                <div className={styles.field}>
                  <textarea
                    {...register("message", { required: "Message is required" })}
                    rows={5}
                    placeholder="Your Message"
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
                  {isSubmitting ? "Sending…" : "Send Message"}
                </button>
                {submitMessage && (
                  <p className={styles.submitMsg}>{submitMessage}</p>
                )}
              </form>
            </div>
          </div>
        </section>
      </div>

      <ProjectLightbox project={lightboxProject} onClose={closeLightbox} />
      {resumeOpen && <ResumeModal onClose={() => setResumeOpen(false)} />}
    </div>
  );
}
