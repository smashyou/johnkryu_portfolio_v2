"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { FiExternalLink, FiGithub, FiX, FiChevronLeft, FiChevronRight, FiMaximize2 } from "react-icons/fi";
import { useCallback, useEffect, useState } from "react";
import { projects, type Project } from "@/app/data/content";

const Portfolio = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [hoveredProject, setHoveredProject] = useState<number | null>(null);
  const [lightbox, setLightbox] = useState<{
    project: Project;
    index: number;
  } | null>(null);

  const closeLightbox = useCallback(() => setLightbox(null), []);

  const stepLightbox = useCallback(
    (delta: number) => {
      setLightbox((current) => {
        if (!current) return current;
        const count = current.project.images.length;
        return {
          project: current.project,
          index: (current.index + delta + count) % count,
        };
      });
    },
    []
  );

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") stepLightbox(-1);
      if (e.key === "ArrowRight") stepLightbox(1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox, closeLightbox, stepLightbox]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10,
      },
    },
  };

  return (
    <section id="portfolio" className="py-20 lg:py-32 relative">
      <div className="container">
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="text-center mb-16"
        >
          <motion.h5
            variants={itemVariants}
            className="text-primary-400 uppercase tracking-wider mb-2"
          >
            My Recent Work
          </motion.h5>
          <motion.h2 variants={itemVariants} className="section-title">
            Portfolio
          </motion.h2>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {projects.map((project) => (
            <motion.div
              key={project.id}
              variants={itemVariants}
              className="group relative"
              onMouseEnter={() => setHoveredProject(project.id)}
              onMouseLeave={() => setHoveredProject(null)}
            >
              <div className="card h-full flex flex-col hover:scale-105 transform transition-all duration-300 overflow-hidden">
                {/* Project Image/Preview — click to view full screenshots */}
                <button
                  type="button"
                  onClick={() => setLightbox({ project, index: 0 })}
                  className="relative h-48 bg-primary-600 rounded-lg mb-6 flex items-center justify-center overflow-hidden w-full cursor-zoom-in"
                  aria-label={`View ${project.title} screenshots`}
                >
                  <img
                    src={project.images[0]}
                    alt={project.title}
                    className="w-full h-full object-cover object-top"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />

                  {/* Hover overlay */}
                  <div
                    className={`absolute inset-0 bg-black/60 flex items-center justify-center space-x-4 transition-opacity duration-300 ${
                      hoveredProject === project.id
                        ? "opacity-100"
                        : "opacity-0"
                    }`}
                  >
                    <span className="p-3 bg-dark-800 rounded-full text-white">
                      <FiMaximize2 size={20} />
                    </span>
                    {project.images.length > 1 && (
                      <span className="px-3 py-1 bg-dark-800 rounded-full text-white text-xs">
                        {project.images.length} screenshots
                      </span>
                    )}
                  </div>
                </button>

                {/* Project Info */}
                <div className="flex-1 flex flex-col">
                  <h3 className="text-xl font-semibold mb-3 text-white group-hover:text-primary-400 transition-colors duration-300">
                    {project.title}
                  </h3>

                  <p className="text-dark-300 text-sm mb-4 flex-1 leading-relaxed">
                    {project.subtitle}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {project.tags.map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="px-3 py-1 bg-dark-700 text-primary-400 text-xs rounded-full border border-dark-600 hover:border-primary-400 transition-colors duration-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-3">
                    {project.github && (
                      <a
                        href={project.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline flex-1 text-center"
                      >
                        <FiGithub className="mr-2" size={16} />
                        Code
                      </a>
                    )}
                    <a
                      href={project.demo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary flex-1 text-center"
                    >
                      <FiExternalLink className="mr-2" size={16} />
                      Live Demo
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Screenshot lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 md:p-10"
            onClick={closeLightbox}
          >
            <button
              type="button"
              onClick={closeLightbox}
              className="absolute top-4 right-4 p-3 bg-dark-800 rounded-full text-white hover:bg-primary-600 transition-colors duration-300 z-10"
              aria-label="Close screenshots"
            >
              <FiX size={22} />
            </button>

            {lightbox.project.images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    stepLightbox(-1);
                  }}
                  className="absolute left-4 md:left-8 p-3 bg-dark-800 rounded-full text-white hover:bg-primary-600 transition-colors duration-300 z-10"
                  aria-label="Previous screenshot"
                >
                  <FiChevronLeft size={22} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    stepLightbox(1);
                  }}
                  className="absolute right-4 md:right-8 p-3 bg-dark-800 rounded-full text-white hover:bg-primary-600 transition-colors duration-300 z-10"
                  aria-label="Next screenshot"
                >
                  <FiChevronRight size={22} />
                </button>
              </>
            )}

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 22 }}
              className="max-w-6xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={lightbox.project.images[lightbox.index]}
                alt={`${lightbox.project.title} screenshot ${
                  lightbox.index + 1
                }`}
                className="w-full max-h-[80vh] object-contain rounded-xl border border-dark-600 shadow-2xl"
              />
              <div className="mt-4 flex items-center justify-between text-sm text-dark-300">
                <span className="font-medium text-white">
                  {lightbox.project.title}
                </span>
                {lightbox.project.images.length > 1 && (
                  <span>
                    {lightbox.index + 1} / {lightbox.project.images.length}
                  </span>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default Portfolio;
