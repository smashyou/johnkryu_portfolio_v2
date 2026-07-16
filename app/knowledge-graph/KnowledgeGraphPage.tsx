"use client";

import { useCallback, useState } from "react";
import { projects, services, timeline, profile, type Project } from "@/app/data/content";
import ProjectLightbox from "@/app/components/shared/ProjectLightbox";
import SwitchPill from "@/app/components/shared/SwitchPill";
import ResumeModal from "@/app/components/ResumeModal";
import { useContactForm } from "@/app/components/shared/useContactForm";
import GraphCanvas from "./GraphCanvas";
import styles from "./graph.module.css";

const ACCENT = "#8ef7cd";
const VIOLET = "#a78bfa";

export default function KnowledgeGraphPage() {
  const [lightboxProject, setLightboxProject] = useState<Project | null>(null);
  const [resumeOpen, setResumeOpen] = useState(false);

  const closeLightbox = useCallback(() => setLightboxProject(null), []);

  const { register, errors, onSubmit, isSubmitting, submitMessage } =
    useContactForm();

  return (
    <div className={styles.page}>
      {/* Switch experience — reference's fixed top-left anchor, replaced
          with the shared SwitchPill per interface contract. */}
      <SwitchPill accent={ACCENT} className={styles.switchPill} />

      {/* RESUME (added) — mirrors the switch pill's fixed corner treatment
          on the opposite side. */}
      <button
        type="button"
        onClick={() => setResumeOpen(true)}
        className={styles.resumePill}
      >
        RESUME
      </button>

      {/* side dot nav */}
      <nav className={styles.dotNav}>
        <a href="#home" title="Home" className={`${styles.dot} ${styles.dotActive}`} />
        <a href="#universe" title="Universe" className={styles.dot} />
        <a href="#path" title="Path" className={styles.dot} />
        <a href="#services" title="Services" className={styles.dot} />
        <a href="#work" title="Work" className={styles.dot} />
        <a href="#contact" title="Contact" className={styles.dot} />
      </nav>

      {/* HERO with 3D graph */}
      <section id="home" className={styles.hero}>
        <div className={styles.heroCopy}>
          <div className={styles.heroEyebrow}>EXPLORING THE GRAPH OF</div>
          <h1 className={styles.heroTitle}>
            John
            <br />
            K. Ryu
            <span className={styles.accentDot}>.</span>
          </h1>
          <p className={styles.heroLede}>
            AI Engineer, full-stack builder, and entrepreneur. Everything I
            know is connected — <span className={styles.heroLedeStrong}>drag the graph</span>{" "}
            to explore how.
          </p>
          <p className={styles.heroNote}>
            // hover a node · drag to rotate · it never stops orbiting
          </p>
          <div className={styles.heroCtas}>
            <a href="#work" className={styles.ctaPrimary}>
              See the work
            </a>
            <a href="#contact" className={styles.ctaSecondary}>
              Contact
            </a>
          </div>
        </div>
        <div className={styles.graphStage}>
          <GraphCanvas />
        </div>
      </section>

      {/* UNIVERSE / about */}
      <section id="universe" className={styles.section}>
        <div className={styles.eyebrow}>NODE: SELF</div>
        <h2 className={styles.sectionTitle}>The person behind the graph</h2>
        <div className={styles.universeGrid}>
          <div className={styles.universeCopy}>
            <p className={styles.bodyText}>
              The graph starts at Temple CS — NSF-funded computer-vision
              research for robot object detection. It grows through startups
              (Fatty Pocket at 20, Parkgorithm) and four years at Comcast,
              where the Xfinity Flex platform hit 1M+ subscriptions in six
              months — 10× target — and the cloud X1 Guide reached 31 million
              customers. Today the densest cluster: AI Engineer at TecAce,
              architecting a governance-first enterprise agentic-AI platform
              — RAG, LangGraph workflows, hybrid cloud/on-prem — built
              AI-natively with Claude Code. Anthropic CCA-F certified.
            </p>
            <p className={styles.bodyText}>
              A &quot;student of life&quot; — consuming knowledge is the hobby.
              The mantra:{" "}
              <span className={styles.accentText}>
                make sure the choices you make are worth the losses you will
                take.
              </span>
            </p>
            <div className={styles.tagRow}>
              <span className={styles.tag}>ex-Comcast · 31M customers</span>
              <span className={styles.tag}>3× founder</span>
              <span className={styles.tag}>NSF CV research</span>
              <span className={styles.tag}>Anthropic CCA-F</span>
              <span className={styles.tag}>AI-native workflow</span>
            </div>
          </div>
          <div className={styles.portraitWrap}>
            <div className={styles.portraitRing} />
            <div className={styles.portraitCard}>
              <img
                src="/images/profile/hero.png"
                alt="John K. Ryu"
                className={styles.portraitImg}
              />
            </div>
          </div>
        </div>
        <div className={styles.hikingStrip}>
          <img
            src="/images/profile/hiking.jpg"
            alt="John hiking above the clouds"
            className={styles.hikingImg}
          />
          <div className={styles.hikingOverlay} />
          <div className={styles.hikingCaption}>
            <div className={styles.eyebrow}>NODE: OFF_THE_CLOCK</div>
            <div className={styles.hikingText}>
              Consuming knowledge is the hobby — mountains included.
            </div>
          </div>
        </div>
      </section>

      {/* PATH */}
      <section id="path" className={styles.section}>
        <div className={styles.eyebrow}>EDGES: TRAVERSED</div>
        <h2 className={styles.sectionTitle}>The path through the graph</h2>
        <div className={styles.pathList}>
          {timeline.map((t, i) => (
            <div key={t.period + t.title} className={styles.pathItem}>
              <div className={styles.pathYears}>{t.period}</div>
              <div className={styles.pathDotCol}>
                <div
                  className={styles.pathDot}
                  style={{
                    background: i % 2 === 0 ? ACCENT : VIOLET,
                    boxShadow: `0 0 12px ${i % 2 === 0 ? ACCENT : VIOLET}`,
                  }}
                />
                {i < timeline.length - 1 && <div className={styles.pathLine} />}
              </div>
              <div className={styles.pathBody}>
                <div className={styles.pathHead}>
                  <h3 className={styles.pathRole}>{t.title}</h3>
                  <span className={styles.pathOrg}>{t.org}</span>
                </div>
                <p className={styles.pathDesc}>{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SERVICES (added) */}
      <section id="services" className={styles.section}>
        <div className={styles.eyebrow}>NODES: OFFERED</div>
        <h2 className={styles.sectionTitle}>What the graph can do for you</h2>
        <div className={styles.servicesList}>
          {services.map((category) => (
            <div key={category.title} className={styles.serviceCard}>
              <h3 className={styles.serviceCardTitle}>{category.title}</h3>
              <div className={styles.serviceItems}>
                {category.items.map((item) => (
                  <div key={item.label} className={styles.serviceItem}>
                    <h4 className={styles.serviceItemTitle}>{item.label}</h4>
                    <ul className={styles.serviceChecklist}>
                      {item.subitems.map((subitem) => (
                        <li key={subitem} className={styles.serviceCheckRow}>
                          <span className={styles.checkIcon}>◆</span>
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

      {/* WORK */}
      <section id="work" className={`${styles.section} ${styles.workSection}`}>
        <div className={styles.eyebrow}>NODES: SHIPPED</div>
        <h2 className={styles.sectionTitle}>Orbiting projects</h2>
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
                <div className={styles.workImageOverlay} />
                <div className={styles.workRole}>{project.tags[0]}</div>
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

      {/* CONTACT */}
      <section id="contact" className={styles.contactSection}>
        <div className={styles.eyebrow}>NODE: YOU</div>
        <h2 className={styles.contactTitle}>Add yourself to the graph</h2>
        <p className={styles.contactCopy}>
          Every good collaboration starts as a new edge. Say hi.
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
          © 2026 John K. Ryu — every node was earned
        </div>
      </section>

      <ProjectLightbox project={lightboxProject} onClose={closeLightbox} />
      {resumeOpen && <ResumeModal onClose={() => setResumeOpen(false)} />}
    </div>
  );
}
