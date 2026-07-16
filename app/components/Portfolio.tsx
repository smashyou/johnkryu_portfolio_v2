"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { FiExternalLink, FiGithub, FiMaximize2 } from "react-icons/fi";
import { useState } from "react";
import { projects, type Project } from "@/app/data/content";
import ProjectLightbox from "@/app/components/shared/ProjectLightbox";

const Portfolio = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [hoveredProject, setHoveredProject] = useState<number | null>(null);
  const [lightboxProject, setLightboxProject] = useState<Project | null>(null);

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
                  onClick={() => setLightboxProject(project)}
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

      {lightboxProject && (
        <ProjectLightbox
          project={lightboxProject}
          onClose={() => setLightboxProject(null)}
        />
      )}
    </section>
  );
};

export default Portfolio;
