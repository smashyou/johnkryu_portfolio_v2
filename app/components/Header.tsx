"use client";

import { motion } from "framer-motion";
import { BsLinkedin, BsGithub, BsInstagram } from "react-icons/bs";
import { HiArrowDown } from "react-icons/hi";
import { useState } from "react";
import ResumeModal from "./ResumeModal";

const Header = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    hidden: { opacity: 0, y: 50 },
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

  const socialVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        delay: 0.8,
        type: "spring",
        stiffness: 100,
      },
    },
  };

  return (
    <section
      id="home"
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
    >
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl animate-pulse animation-delay-1000"></div>
      </div>

      {/* Social Links */}
      <motion.div
        variants={socialVariants}
        initial="hidden"
        animate="visible"
        className="fixed left-6 bottom-16 z-10 hidden lg:flex flex-col items-center space-y-4"
      >
        <a
          href="https://linkedin.com/in/johnminryu"
          target="_blank"
          rel="noopener noreferrer"
          className="text-dark-400 hover:text-primary-400 transition-colors duration-300 p-2 hover:scale-110 transform"
        >
          <BsLinkedin size={20} />
        </a>
        <a
          href="https://github.com/smashyou"
          target="_blank"
          rel="noopener noreferrer"
          className="text-dark-400 hover:text-primary-400 transition-colors duration-300 p-2 hover:scale-110 transform"
        >
          <BsGithub size={20} />
        </a>
        <a
          href="https://instagram.com/johnminryu"
          target="_blank"
          rel="noopener noreferrer"
          className="text-dark-400 hover:text-primary-400 transition-colors duration-300 p-2 hover:scale-110 transform"
        >
          <BsInstagram size={20} />
        </a>
        <div className="w-px h-16 bg-dark-600"></div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0, rotate: 0 }}
        animate={{ opacity: 1, rotate: 0 }}
        transition={{ delay: 1.2 }}
        className="fixed right-6 bottom-16 z-10 hidden lg:flex flex-col items-center space-y-2"
      >
        <span className="text-sm text-dark-400 font-light writing-mode-vertical-rl text-orientation-mixed">
          Scroll Down
        </span>
        <button
          onClick={() => {
            const aboutSection = document.getElementById("about");
            if (aboutSection) {
              aboutSection.scrollIntoView({ behavior: "smooth" });
            }
          }}
          className="text-primary-400 hover:text-primary-300 transition-colors duration-300 cursor-pointer"
        >
          <HiArrowDown className="rotate-0" size={16} />
        </button>
      </motion.div>

      {/* Main Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="container text-center relative z-10"
      >
        <motion.div variants={itemVariants}>
          <h5 className="text-lg text-dark-300 mb-2">Hello, I'm</h5>
        </motion.div>

        <motion.h1
          variants={itemVariants}
          className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-4"
        >
          <span className="gradient-text">John K. Ryu</span>
        </motion.h1>

        <motion.h2
          variants={itemVariants}
          className="text-xl sm:text-2xl text-dark-300 mb-12"
        >
          Full Stack Developer & Entrepreneur
        </motion.h2>

        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
        >
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-outline hover:scale-105 transform"
          >
            View Resume
          </button>
          <a
            href="#contact"
            className="btn btn-primary hover:scale-105 transform"
          >
            Let's Talk
          </a>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="relative mx-auto max-w-sm"
        >
          <div className="relative py-8">
            <div className="absolute inset-2 h-96 bg-gradient-to-b from-primary-400 to-primary-600 rounded-t-full blur opacity-75 animate-pulse"></div>
            <div className="relative w-80 h-96 mx-auto">
              <div className="relative w-full h-full rounded-t-full overflow-hidden">
                <img
                  src="/images/profile/hero.png"
                  alt="John Ryu"
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
                <div
                  className="w-full h-full bg-gradient-to-b from-dark-700 to-dark-800 flex items-center justify-center"
                  style={{ display: "none" }}
                >
                  <div className="text-6xl text-primary-400">JR</div>
                </div>
                {/* Gradient fade at bottom of image only */}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-dark-900 via-dark-900/60 to-transparent pointer-events-none"></div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Resume Modal */}
      {isModalOpen && <ResumeModal onClose={() => setIsModalOpen(false)} />}
    </section>
  );
};

export default Header;
