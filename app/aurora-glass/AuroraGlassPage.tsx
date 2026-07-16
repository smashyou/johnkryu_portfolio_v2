"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  projects,
  services,
  timeline,
  profile,
  type Project,
} from "@/app/data/content";
import ProjectLightbox from "@/app/components/shared/ProjectLightbox";
import SwitchPill from "@/app/components/shared/SwitchPill";
import ResumeModal from "@/app/components/ResumeModal";
import { useContactForm } from "@/app/components/shared/useContactForm";
import { usePrefersReducedMotion } from "@/app/components/shared/usePrefersReducedMotion";
import AuroraCanvas from "./AuroraCanvas";
import styles from "./aurora.module.css";

const ACCENT = "#c9a6ff";

type Craft = { num: string; title: string; desc: string; tags: string[] };

// Verbatim from the reference script's `crafts` array (renderVals) in
// design_handoff_portfolio_redesign/Concept 4 - Aurora Glass.dc.html
const CRAFTS: Craft[] = [
  {
    num: "I",
    title: "Agentic & AI/ML",
    desc: "Governance-first agent platforms: governed RAG, hybrid search with cross-encoder reranking, LangGraph workflows, MCP — built AI-natively with Claude Code (Anthropic CCA-F).",
    tags: ["Claude Code", "MCP", "LangGraph", "RAG", "Milvus", "vLLM · Bedrock", "PyTorch"],
  },
  {
    num: "II",
    title: "Full Stack",
    desc: "A decade in production — from Comcast's X1 Guide serving 31 million customers to modern SaaS with React, FastAPI, and Spring Boot on hybrid cloud.",
    tags: ["React · Next.js", "TypeScript", "Python · FastAPI", "Java · Spring Boot", "PostgreSQL", "K8s · AWS"],
  },
  {
    num: "III",
    title: "Founder",
    desc: "Three ventures founded since age twenty — coupon marketing, parking tech, e-commerce — plus four AI products live today.",
    tags: ["Roem Ventures", "Parkgorithm", "Fatty Pocket", "SaaS", "Growth"],
  },
];

// Continues the Craft section's roman-numeral motif (I–III) for the added
// Services section (IV–VI), one numeral per `services` category.
const SERVICE_NUMERALS = ["IV", "V", "VI"];

export default function AuroraGlassPage() {
  const reducedMotion = usePrefersReducedMotion();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [lightboxProject, setLightboxProject] = useState<Project | null>(null);
  const [resumeOpen, setResumeOpen] = useState(false);

  const closeLightbox = useCallback(() => setLightboxProject(null), []);

  const { register, errors, onSubmit, isSubmitting, submitMessage } =
    useContactForm();

  // Scroll reveals — verbatim behavior from the reference script's
  // componentDidMount: a single IntersectionObserver (threshold .12) watches
  // every `[data-reveal]` node; on intersect it's marked revealed and
  // unobserved. Reduced motion: everything is marked revealed immediately, no
  // observer is created, and `.reveal`'s CSS transition is disabled (see
  // aurora.module.css's trailing prefers-reduced-motion block).
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
      <AuroraCanvas />

      <SwitchPill accent={ACCENT} className={styles.switchPill} />

      {/* NAV */}
      <nav className={styles.nav}>
        <a href="#home" onClick={scrollTo("home")} className={styles.navItemActive}>
          Home
        </a>
        <a href="#story" onClick={scrollTo("story")} className={styles.navItem}>
          Story
        </a>
        <a href="#craft" onClick={scrollTo("craft")} className={styles.navItem}>
          Craft
        </a>
        <a href="#services" onClick={scrollTo("services")} className={styles.navItem}>
          Services
        </a>
        <a href="#journey" onClick={scrollTo("journey")} className={styles.navItem}>
          Journey
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

      {/* HERO */}
      <section id="home" className={styles.hero}>
        <div className={styles.heroPortraitWrap}>
          <div className={styles.heroPortraitGlow} />
          <div className={styles.heroPortraitInner}>
            <img
              src="/images/profile/hero.png"
              alt={profile.name}
              className={styles.heroPortraitImg}
            />
          </div>
        </div>
        <div className={styles.heroLabel}>{profile.name}</div>
        <h1 className={`${styles.heroTitle} ${styles.serif}`}>
          Engineering{" "}
          <em className={styles.heroTitleAccent}>intelligence</em>
          <br />
          into products people love.
        </h1>
        <p className={styles.heroLede}>
          AI engineer, full-stack builder, and three-time founder. From
          Comcast&apos;s X1 platform to enterprise agentic-AI studios — a
          decade of shipping.
        </p>
        <div className={styles.heroCtas}>
          <a href="#work" onClick={scrollTo("work")} className={styles.ctaPrimary}>
            Explore the work
          </a>
          <a href="#story" onClick={scrollTo("story")} className={styles.ctaSecondary}>
            The story
          </a>
        </div>
        <div className={styles.heroScrollLine} />
      </section>

      {/* STORY */}
      <section id="story" className={styles.storySection}>
        <div data-reveal className={`${styles.storyGrid} ${styles.reveal}`}>
          <div>
            <div className={styles.eyebrow}>The story</div>
            <h2 className={`${styles.sectionHeading} ${styles.serif} ${styles.storyHeading}`}>
              A student of life
              <br />
              who happens to ship software.
            </h2>
            <p className={styles.storyText}>
              It starts with NSF-funded computer-vision research at Temple,
              and a first venture at twenty. Four years at Comcast building
              Xfinity Flex — 1M+ subscriptions in six months, ten times the
              goal — and the cloud X1 Guide reaching 31 million customers.
              Then founder mode again with Roem Ventures. Today: AI Engineer
              at TecAce, architecting a governance-first enterprise
              agentic-AI platform — RAG, LangGraph, hybrid cloud/on-prem —
              built AI-natively with Claude Code. Anthropic CCA-F certified.
            </p>
            <p className={`${styles.storyQuote} ${styles.serif}`}>
              &quot;{profile.mantras[0]}.&quot;
            </p>
          </div>
          <div className={styles.storyImageWrap}>
            <div className={styles.storyImageGlow} />
            <img
              src="/images/profile/hiking.jpg"
              alt="John hiking"
              className={styles.storyImage}
            />
          </div>
        </div>
      </section>

      {/* CRAFT */}
      <section id="craft" className={styles.craftSection}>
        <div data-reveal className={styles.reveal}>
          <div className={styles.centerHead}>
            <div className={styles.eyebrow}>The craft</div>
            <h2 className={`${styles.sectionHeading} ${styles.serif}`}>
              Three orbits of expertise.
            </h2>
          </div>
          <div className={styles.craftGrid}>
            {CRAFTS.map((c) => (
              <div key={c.num} className={styles.craftCard}>
                <div className={`${styles.craftNum} ${styles.serif}`}>{c.num}</div>
                <h3 className={styles.craftTitle}>{c.title}</h3>
                <p className={styles.craftDesc}>{c.desc}</p>
                <div className={styles.craftTags}>
                  {c.tags.map((tag) => (
                    <span key={tag} className={styles.craftTag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES (added — same glass-card language as Craft, IV–VI) */}
      <section id="services" className={styles.servicesSection}>
        <div data-reveal className={styles.reveal}>
          <div className={styles.centerHead}>
            <div className={styles.eyebrow}>How I can help</div>
            <h2 className={`${styles.sectionHeading} ${styles.serif}`}>
              Three more orbits.
            </h2>
          </div>
          <div className={styles.craftGrid}>
            {services.map((category, i) => (
              <div key={category.title} className={styles.craftCard}>
                <div className={`${styles.craftNum} ${styles.serif}`}>
                  {SERVICE_NUMERALS[i]}
                </div>
                <h3 className={styles.craftTitle}>{category.title}</h3>
                <div className={styles.serviceItems}>
                  {category.items.map((item) => (
                    <div key={item.label} className={styles.serviceItemBlock}>
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
        </div>
      </section>

      {/* JOURNEY */}
      <section id="journey" className={styles.journeySection}>
        <div data-reveal className={styles.reveal}>
          <div className={styles.centerHead}>
            <div className={styles.eyebrow}>The journey</div>
            <h2 className={`${styles.sectionHeading} ${styles.serif}`}>
              Fifteen years of chapters.
            </h2>
          </div>
          <div className={styles.journeyList}>
            {timeline.map((t) => (
              <div key={t.period + t.title} className={styles.journeyRow}>
                <div className={`${styles.journeyYears} ${styles.serif}`}>
                  {t.period}
                </div>
                <div>
                  <div className={styles.journeyHead}>
                    <h3 className={styles.journeyRole}>{t.title}</h3>
                    <span className={styles.journeyOrg}>{t.org}</span>
                  </div>
                  <p className={styles.journeyDesc}>{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WORK */}
      <section id="work" className={styles.workSection}>
        <div data-reveal className={styles.reveal}>
          <div className={styles.centerHead}>
            <div className={styles.eyebrow}>Selected work</div>
            <h2 className={`${styles.sectionHeading} ${styles.serif}`}>
              Products, not demos.
            </h2>
          </div>
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
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className={styles.contactSection}>
        <div data-reveal className={styles.reveal}>
          <div className={styles.eyebrow}>Contact</div>
          <h2 className={`${styles.contactHeading} ${styles.serif}`}>
            Be the energy
            <br />
            you want to attract.
          </h2>
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
            <h3 className={`${styles.formTitle} ${styles.serif}`}>
              Send a message
            </h3>
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
              <button type="submit" disabled={isSubmitting} className={styles.submitBtn}>
                {isSubmitting ? "Sending…" : "Send Message"}
              </button>
              {submitMessage && <p className={styles.submitMsg}>{submitMessage}</p>}
            </form>
          </div>

          <div className={styles.copyright}>© 2026 John K. Ryu</div>
        </div>
      </section>

      <ProjectLightbox project={lightboxProject} onClose={closeLightbox} />
      {resumeOpen && <ResumeModal onClose={() => setResumeOpen(false)} />}
    </div>
  );
}
