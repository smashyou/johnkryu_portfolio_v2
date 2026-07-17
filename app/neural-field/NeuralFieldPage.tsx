"use client";

import { useCallback, useEffect, useState } from "react";
import {
  projects,
  services,
  skills,
  timeline,
  profile,
  type Project,
} from "@/app/data/content";
import ProjectLightbox from "@/app/components/shared/ProjectLightbox";
import SwitchPill from "@/app/components/shared/SwitchPill";
import ResumeModal from "@/app/components/ResumeModal";
import { useContactForm } from "@/app/components/shared/useContactForm";
import { usePrefersReducedMotion } from "@/app/components/shared/usePrefersReducedMotion";
import ParticleField from "./ParticleField";
import styles from "./neural.module.css";

const ACCENT = "#22d3ee";

// Split for mobile: each role phrase gets its own nowrap span so the hero
// badge only wraps between phrases (never mid-phrase) on narrow screens.
const roles = profile.title.split(" · ");

// Verbatim from the componentDidMount typing loop in the reference script.
const TYPED_PHRASES = [
  "> building agentic-AI platforms",
  "> RAG · LangGraph · MCP · Claude Code",
  "> shipping products, not demos",
  "> student of life",
];

// Skill category "tag" labels from the reference script's skillGroups array
// (content.ts skills[] carries titles/skills only, so the short tag is kept
// here alongside it, matched by title).
const SKILL_TAGS: Record<string, string> = {
  "Agentic / AI-Native Development": "AGENT",
  "AI / ML": "AI/ML",
  Frontend: "FE",
  Backend: "BE",
  Databases: "DB",
  "Cloud / On-Prem / DevOps": "OPS",
};

const SERVICE_TAGS: Record<string, string> = {
  "Technical Consulting": "CONSULT",
  "Software Development": "DEV",
  "Social Media & Digital Marketing": "GROWTH",
};

export default function NeuralFieldPage() {
  const reducedMotion = usePrefersReducedMotion();
  const [typed, setTyped] = useState("");
  const [lightboxProject, setLightboxProject] = useState<Project | null>(null);
  const [resumeOpen, setResumeOpen] = useState(false);

  const closeLightbox = useCallback(() => setLightboxProject(null), []);

  const { register, errors, onSubmit, isSubmitting, submitMessage } =
    useContactForm();

  // Typing loop — verbatim timings from the reference script: 55ms per
  // typed character, 26ms per deleted character, 2s hold at full phrase.
  useEffect(() => {
    if (reducedMotion) {
      setTyped(TYPED_PHRASES[0]);
      return;
    }

    let pi = 0;
    let ci = 0;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      const phrase = TYPED_PHRASES[pi];
      if (!deleting) {
        ci++;
        if (ci === phrase.length) {
          deleting = true;
          setTyped(phrase);
          timer = setTimeout(tick, 2000);
          return;
        }
      } else {
        ci--;
        if (ci === 0) {
          deleting = false;
          pi = (pi + 1) % TYPED_PHRASES.length;
        }
      }
      setTyped(phrase.slice(0, ci));
      timer = setTimeout(tick, deleting ? 26 : 55);
    };

    tick();

    return () => clearTimeout(timer);
  }, [reducedMotion]);

  const scrollTo = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className={styles.page}>
      <ParticleField />

      {/* NAV */}
      <nav className={styles.nav}>
        <div className={styles.navLeft}>
          <a href="#home" onClick={scrollTo("home")} className={styles.navBrand}>
            jkr<span className={styles.navBrandAccent}>.dev</span>
          </a>
          <SwitchPill accent={ACCENT} />
        </div>
        <div className={styles.navLinks}>
          <a href="#about" onClick={scrollTo("about")} className={styles.navLink}>
            About
          </a>
          <a href="#skills" onClick={scrollTo("skills")} className={styles.navLink}>
            Skills
          </a>
          <a
            href="#journey"
            onClick={scrollTo("journey")}
            className={styles.navLink}
          >
            Journey
          </a>
          <a href="#work" onClick={scrollTo("work")} className={styles.navLink}>
            Work
          </a>
          <button
            type="button"
            onClick={() => setResumeOpen(true)}
            className={styles.navLink}
          >
            Resume
          </button>
          <a href="#contact" className={styles.navCta}>
            Let&apos;s Talk
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section id="home" className={styles.hero}>
        <div className={styles.heroBadge}>
          <span className={styles.badgeDot} />
          <span className={styles.badgeRoles}>
            {roles.map((role, i) => (
              <span className={styles.badgeRole} key={role}>
                {role}
                {i < roles.length - 1 ? " · " : ""}
              </span>
            ))}
          </span>
        </div>
        <h1 className={styles.heroTitle}>{profile.name}</h1>
        <p className={styles.heroLede}>
          I build <span className={styles.heroLedeAccent}>agentic-AI platforms</span>{" "}
          — RAG pipelines, multi-agent workflows, and the full stack around
          them. From Comcast&apos;s X1 platform to enterprise AI studios, I turn
          ideas into products people actually use.
        </p>
        <div className={styles.heroTyped}>
          {typed}
          <span className={styles.caret}>▊</span>
        </div>
        <div className={styles.heroCtas}>
          <a href="#work" onClick={scrollTo("work")} className={styles.ctaPrimary}>
            View My Work
          </a>
          <a
            href="#contact"
            onClick={scrollTo("contact")}
            className={styles.ctaSecondary}
          >
            Get In Touch
          </a>
        </div>
        <div className={styles.heroImageWrap}>
          <div className={styles.heroGlow} />
          <img src="/images/profile/hero.png" alt="John K. Ryu" className={styles.heroImg} />
          <div className={styles.heroLine} />
        </div>
        <div className={styles.scrollHint}>SCROLL ▼</div>
      </section>

      {/* ABOUT */}
      <section id="about" className={styles.section}>
        <div className={styles.sectionEyebrow}>01 / ABOUT</div>
        <h2 className={styles.sectionTitle}>Student of life.</h2>
        <div className={styles.aboutGrid}>
          <div className={styles.aboutPhotoWrap}>
            <img
              src="/images/profile/hiking.jpg"
              alt="John hiking"
              className={styles.aboutPhoto}
            />
            <div className={styles.aboutPhotoOverlay} />
          </div>
          <div className={styles.aboutCopy}>
            <p className={styles.aboutText}>
              Temple CS grad who started as an NSF-funded computer-vision
              researcher, founded startups along the way, and spent four years
              at Comcast building the Xfinity Flex platform and the
              cloud-based X1 Guide — software serving{" "}
              <span className={styles.heroLedeAccent}>31 million customers</span>.
              Flex passed 1M subscriptions in six months, 10× the target. Now
              an AI Engineer at TecAce in Bellevue, architecting a
              governance-first enterprise agentic-AI platform — RAG
              pipelines, LangGraph workflows, hybrid cloud/on-prem — with
              Claude Code at the center of an AI-native workflow.
            </p>
            <div className={styles.statGrid}>
              <div className={styles.statCard}>
                <div className={styles.statValue}>31M</div>
                <div className={styles.statLabel}>customers reached at Comcast</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>1M+</div>
                <div className={styles.statLabel}>
                  Flex subs in 6 months — 10× target
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>CCA-F</div>
                <div className={styles.statLabel}>Anthropic certified</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>∞</div>
                <div className={styles.statLabel}>student of life</div>
              </div>
            </div>
            <blockquote className={styles.quote}>
              &quot;{profile.mantras[0]}.&quot; — and {profile.mantras[1].toLowerCase()}.
            </blockquote>
          </div>
        </div>
      </section>

      {/* SKILLS */}
      <section id="skills" className={styles.section}>
        <div className={styles.sectionEyebrow}>02 / SKILLS</div>
        <h2 className={styles.sectionTitle}>The stack.</h2>
        <p className={styles.sectionLede}>
          Six domains, one workflow — agent-first.
        </p>
        <div className={styles.skillsGrid}>
          {skills.map((group) => (
            <div key={group.title} className={styles.skillCard}>
              <div className={styles.skillCardHead}>
                <div className={styles.skillTag}>
                  {SKILL_TAGS[group.title] ?? group.title.slice(0, 4).toUpperCase()}
                </div>
                <h3 className={styles.skillCardTitle}>{group.title}</h3>
              </div>
              <div className={styles.skillPills}>
                {group.skills.map((skill) => (
                  <span key={skill} className={styles.skillPill}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SERVICES (added) */}
      <section id="services" className={styles.section}>
        <div className={styles.sectionEyebrow}>03 / SERVICES</div>
        <h2 className={styles.sectionTitle}>How I can help.</h2>
        <p className={styles.sectionLede}>
          Consulting, full-stack builds, and growth — same rigor as the
          platforms above.
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

      {/* JOURNEY */}
      <section id="journey" className={`${styles.section} ${styles.journeySection}`}>
        <div className={styles.sectionEyebrow}>04 / JOURNEY</div>
        <h2 className={styles.sectionTitle}>The path so far.</h2>
        <div className={styles.timeline}>
          <div className={styles.timelineLine} />
          {timeline.map((t) => (
            <div key={t.period + t.title} className={styles.timelineItem}>
              <div className={styles.timelineDot} />
              <div className={styles.timelinePeriod}>{t.period}</div>
              <div className={styles.timelineHead}>
                <h3 className={styles.timelineTitle}>{t.title}</h3>
                <span className={styles.timelineOrg}>{t.org}</span>
              </div>
              <p className={styles.timelineDesc}>{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* WORK */}
      <section id="work" className={styles.section}>
        <div className={styles.sectionEyebrow}>05 / WORK</div>
        <h2 className={styles.sectionTitle}>Selected projects.</h2>
        <div className={styles.workList}>
          {projects.map((project) => (
            <div key={project.id} className={styles.workRow}>
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
                <div className={styles.workImageOverlay}>
                  <span className={styles.workImageOverlayText}>
                    screenshots [{project.images.length}]
                  </span>
                </div>
              </button>
              <div className={styles.workContent}>
                <div className={styles.workHead}>
                  <h3 className={styles.workTitle}>{project.title}</h3>
                  <span className={styles.workBadge}>{project.tags[0]}</span>
                </div>
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

      {/* CONTACT */}
      <section id="contact" className={`${styles.section} ${styles.contactSection}`}>
        <div className={styles.sectionEyebrow}>06 / CONTACT</div>
        <h2 className={styles.contactTitle}>Let&apos;s build something.</h2>
        <p className={styles.contactCopy}>
          Open to AI engineering roles, consulting, and interesting
          collaborations.
        </p>
        <div className={styles.contactCtas}>
          <a href={`mailto:${profile.email}`} className={styles.mailBtn}>
            {profile.email}
          </a>
          <button
            type="button"
            className={styles.resumeBtn}
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

        <div className={styles.copyright}>
          © 2026 John K. Ryu — be the energy you want to attract
        </div>
      </section>

      <ProjectLightbox project={lightboxProject} onClose={closeLightbox} />
      {resumeOpen && <ResumeModal onClose={() => setResumeOpen(false)} />}
    </div>
  );
}
