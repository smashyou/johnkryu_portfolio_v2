"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { FaAward, FaChartLine } from "react-icons/fa";
import { BsLinkedin } from "react-icons/bs";
import { ImBooks } from "react-icons/im";
import { useState, useRef, useEffect } from "react";

const About = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(false);

  // Calculate years of experience dynamically (started in 2015)
  const startYear = 2015;
  const currentYear = new Date().getFullYear();
  const yearsOfExperience = currentYear - startYear - 1;

  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        const isBottom = Math.abs(scrollTop + clientHeight - scrollHeight) <= 1;
        setIsAtBottom(isBottom);
      }
    };

    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener("scroll", handleScroll);
      return () => scrollElement.removeEventListener("scroll", handleScroll);
    }
  }, []);

  const aboutCards = [
    {
      icon: FaAward,
      title: "Experience",
      subtitle: `${yearsOfExperience}+ years as an engineering professional`,
    },
    {
      icon: FaChartLine,
      title: "Entrepreneur",
      subtitle: "2 successful E-Commerce exits",
    },
    {
      icon: ImBooks,
      title: "Student of life",
      subtitle: "Consuming knowledge is my hobby",
    },
  ];

  const aboutParagraphs = [
    `John Ryu is a software engineer and aspiring Entrepreneur with a proven track record of turning innovative ideas into impactful products. After earning his Bachelor of Science in Computer Science from Temple University, he dove headfirst into roles at both startups and major tech companies, including Comcast, where he helped develop the Xfinity Flex streaming platform and enhance the cloud-based X1 Guide interface for millions of customers. Alongside these industry achievements, John has also launched his own e-commerce venture and led multiple cross-functional projects, consistently demonstrating a can-do attitude, grit, and a relentless drive for learning new technologies.`,

    `Guided by the mindset of a "student of life," John embodies the principle of lifelong learning, taking joy in every opportunity to acquire new skills and tackle fresh challenges. He believes in "being the energy you want to attract," maintaining a positive, growth-oriented perspective to inspire collaboration and innovation within his teams. His personal mantra—"make sure the choices you make are worth the losses you will take"—reflects his commitment to thoughtful decision-making and resilience. By merging technical expertise with a genuine passion for continuous improvement, John strives to create solutions that positively impact businesses and end-users alike.`,
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
    <section id="about" className="py-20 lg:py-32 relative">
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
            Get To Know
          </motion.h5>
          <motion.h2 variants={itemVariants} className="section-title">
            About Me
          </motion.h2>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Profile Image */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            className="relative"
          >
            <div className="relative mx-auto w-80 h-96 lg:w-96 lg:h-[520px]">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-primary-600 rounded-2xl blur opacity-20 animate-pulse"></div>
              <div className="relative bg-dark-800 border border-primary-400/30 rounded-2xl overflow-hidden transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <img
                  src="/images/profile/hiking.jpg"
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
                {/* <div className="w-full h-full bg-gradient-to-b from-dark-700 to-dark-800 flex items-center justify-center" style={{ display: 'none' }}>
                  <div className="text-8xl text-primary-400">🏔️</div>
                </div> */}
              </div>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            className="space-y-8"
          >
            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {aboutCards.map((card, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="card text-center group hover:scale-105 transform transition-all duration-300"
                >
                  <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-primary-600 flex items-center justify-center">
                    <card.icon className="text-white text-xl" />
                  </div>
                  <h5 className="font-semibold mb-2">{card.title}</h5>
                  <small className="text-dark-300 text-sm">
                    {card.subtitle}
                  </small>
                </motion.div>
              ))}
            </div>

            {/* Bio Text */}
            <motion.div
              variants={itemVariants}
              className="relative card rounded-xl overflow-hidden p-0"
            >
              <div
                ref={scrollRef}
                className="max-h-80 overflow-y-auto px-6 py-6 scrollbar-thin space-y-4"
                style={{ scrollbarWidth: "thin" }}
              >
                {aboutParagraphs.map((paragraph, index) => (
                  <p key={index} className="text-dark-300 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Fade indicator */}
              <div
                className={`absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-dark-800 via-dark-800/50 to-transparent pointer-events-none rounded-b-xl transition-opacity duration-300 ${
                  isAtBottom ? "opacity-0" : "opacity-100"
                }`}
              />
            </motion.div>

            {/* CTA Button */}
            <motion.div
              variants={itemVariants}
              className="flex justify-center lg:justify-start"
            >
              <a
                href="https://www.linkedin.com/in/johnminryu"
                className="btn btn-primary"
              >
                Let's Connect&nbsp;
                <BsLinkedin size={20} />
              </a>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default About;
