"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { FiExternalLink, FiGithub } from "react-icons/fi";
import { useState } from "react";

const Portfolio = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [hoveredProject, setHoveredProject] = useState<number | null>(null);

  const projects = [
    {
      id: 1,
      title: "React.js Presentation",
      subtitle:
        "An engaging presentation powered by React.js and Next.js, featuring interactive demos.",
      image: "/images/projects/reactjs-presentation.png",
      github: "https://www.github.com/smashyou/reactjs-presentation",
      demo: "https://reactjs-presentation.vercel.app",
      tags: ["React", "Next.js", "TypeScript", "Tailwind"],
    },
    {
      id: 2,
      title: "Jackpot Teller AI",
      subtitle:
        "Provides AI‑driven jackpot number predictions, generates winning frequency graphs for each number, and includes a manual combination generator for creating custom sets of numbers.",
      image: "/images/projects/jackpot-teller.png",
      github: "https://github.com/smashyou/AI_Jackpot_Generator",
      demo: "https://www.jackpotteller.com",
      tags: ["AI", "Python", "Flask", "Machine Learning"],
    },
    {
      id: 3,
      title: "Cosmic Kitchen: Kubernetes Presentation",
      subtitle:
        "Explaining Kubernetes with Cosmic Kitchen Analogy featuring interactive demos",
      image: "/images/projects/cosmic-kitchen.png",
      github: "https://www.github.com/smashyou/kubernetes_presentation",
      demo: "https://k8s-presentation.vercel.app",
      tags: ["Kubernetes", "Docker", "DevOps", "React"],
    },
  ];

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
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              variants={itemVariants}
              className="group relative"
              onMouseEnter={() => setHoveredProject(project.id)}
              onMouseLeave={() => setHoveredProject(null)}
            >
              <div className="card h-full flex flex-col hover:scale-105 transform transition-all duration-300 overflow-hidden">
                {/* Project Image/Preview */}
                <div className="relative h-48 bg-primary-600 rounded-lg mb-6 flex items-center justify-center overflow-hidden">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback if image doesn't exist
                      e.currentTarget.style.display = "none";
                      const fallback = e.currentTarget
                        .nextElementSibling as HTMLElement;
                      if (fallback) {
                        fallback.style.display = "flex";
                      }
                    }}
                  />
                  {/* <div className="w-full h-full bg-primary-600 flex items-center justify-center" style={{ display: 'none' }}>
                    <div className="text-6xl opacity-80">
                      {project.id === 1 ? '🎨' : project.id === 2 ? '🎰' : '🚀'}
                    </div>
                  </div> */}

                  {/* Hover overlay */}
                  <div
                    className={`absolute inset-0 bg-black/60 flex items-center justify-center space-x-4 transition-opacity duration-300 ${
                      hoveredProject === project.id
                        ? "opacity-100"
                        : "opacity-0"
                    }`}
                  >
                    <a
                      href={project.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-dark-800 rounded-full text-white hover:bg-primary-600 transition-colors duration-300"
                    >
                      <FiGithub size={20} />
                    </a>
                    <a
                      href={project.demo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-dark-800 rounded-full text-white hover:bg-primary-600 transition-colors duration-300"
                    >
                      <FiExternalLink size={20} />
                    </a>
                  </div>
                </div>

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
                    <a
                      href={project.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline flex-1 text-center"
                    >
                      <FiGithub className="mr-2" size={16} />
                      Code
                    </a>
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
    </section>
  );
};

export default Portfolio;
