"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { BsPatchCheckFill } from "react-icons/bs";
import { useState, useRef, useEffect } from "react";

const Experience = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const scrollRefs = useRef<HTMLDivElement[]>([]);
  const [scrollStates, setScrollStates] = useState<boolean[]>([]);

  const categories = [
    {
      title: "Frontend Engineering",
      skills: [
        { name: "React.js", level: "Experienced" },
        { name: "Next.js 14", level: "Experienced" },
        { name: "TypeScript", level: "Experienced" },
        { name: "JavaScript ES6+", level: "Experienced" },
        { name: "Tailwind CSS", level: "Experienced" },
        { name: "HTML5/CSS3", level: "Experienced" },
        { name: "Responsive Design", level: "Experienced" },
        { name: "Framer Motion", level: "Intermediate" },
        { name: "Bootstrap 5", level: "Intermediate" },
      ],
    },
    {
      title: "Backend & AI Engineering",
      skills: [
        { name: "Java", level: "Experienced" },
        { name: "Spring Boot", level: "Intermediate" },
        { name: "Node.js/Express", level: "Intermediate" },
        { name: "Python", level: "Intermediate" },
        { name: "Flask/FastAPI", level: "Intermediate" },
        { name: "RESTful APIs", level: "Experienced" },
        { name: "GraphQL", level: "Intermediate" },
        {
          name: "RAG Pipeline Architecture",
          level: "Experienced",
          extra: "Document injection, Query enhancement, Intent classification",
        },
        {
          name: "Hybrid Search Systems",
          level: "Experienced",
          extra: "Score fusion, RRF reranking, Cross-encoder reranking",
        },
        {
          name: "Vector Databases",
          level: "Experienced",
          extra: "Embeddings, Semantic search, Dense/Sparse retrieval",
        },
        { name: "LangChain", level: "Intermediate" },
        { name: "PyTorch", level: "Intermediate" },
        {
          name: "AI Chatbot Builder",
          level: "Experienced",
          extra: "Configurable parsers, chunkers, search methods",
        },
        {
          name: "NoSQL Databases",
          level: "Intermediate",
          extra: "DynamoDB, MongoDB, Cassandra",
        },
        {
          name: "SQL Databases",
          level: "Experienced",
          extra: "PostgreSQL, MySQL, SQLite",
        },
      ],
    },
    {
      title: "Cloud & DevOps",
      skills: [
        { name: "Docker", level: "Experienced" },
        { name: "Kubernetes (K8s)", level: "Intermediate" },
        {
          name: "AWS Services",
          level: "Intermediate",
          extra: "EC2, S3, Lambda, EKS, ECR, Route 53",
        },
        { name: "CI/CD Pipelines", level: "Intermediate" },
        { name: "GitHub Actions", level: "Intermediate" },
        { name: "Infrastructure as Code", level: "Intermediate" },
        { name: "Microservices", level: "Intermediate" },
        { name: "Linux/Unix", level: "Intermediate" },
      ],
    },
  ];

  useEffect(() => {
    const updateScrollStates = () => {
      const newStates = scrollRefs.current.map((ref) => {
        if (!ref) return false;
        const { scrollTop, scrollHeight, clientHeight } = ref;
        const isNotScrollable = scrollHeight <= clientHeight;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;
        return isNotScrollable || isAtBottom;
      });
      setScrollStates(newStates);
    };

    scrollRefs.current.forEach((ref) => {
      if (ref) {
        ref.addEventListener("scroll", updateScrollStates);
      }
    });

    updateScrollStates();

    return () => {
      scrollRefs.current.forEach((ref) => {
        if (ref) {
          ref.removeEventListener("scroll", updateScrollStates);
        }
      });
    };
  }, []);

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Experienced":
        return "text-green-400";
      case "Intermediate":
        return "text-yellow-400";
      case "Beginner":
        return "text-orange-400";
      default:
        return "text-blue-400";
    }
  };

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
    <section id="experience" className="py-20 lg:py-32 relative">
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
            My Tools
          </motion.h5>
          <motion.h2 variants={itemVariants} className="section-title">
            My Experience
          </motion.h2>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {categories.map((category, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="card group hover:scale-105 transform transition-all duration-300 overflow-hidden"
            >
              {/* Header */}
              <div className="bg-primary-600 p-6 -m-6 mb-6 rounded-t-xl">
                <h3 className="text-white font-semibold text-lg text-center">
                  {category.title}
                </h3>
              </div>

              {/* Skills List */}
              <div className="relative">
                <div
                  ref={(el) => {
                    if (el) scrollRefs.current[index] = el;
                  }}
                  className="max-h-80 overflow-y-auto pr-2 scrollbar-thin space-y-4"
                >
                  {category.skills.map((skill, skillIndex) => (
                    <div key={skillIndex} className="flex items-start gap-3">
                      <BsPatchCheckFill className="text-primary-400 text-sm mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="font-medium text-white">{skill.name}</h4>
                        {skill.extra && (
                          <p className="text-xs text-dark-300 mt-1">
                            {skill.extra}
                          </p>
                        )}
                        <small
                          className={`text-xs font-medium ${getLevelColor(
                            skill.level
                          )}`}
                        >
                          {skill.level}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Fade indicator */}
                <div
                  className={`absolute bottom-0 left-0 right-2 h-12 bg-gradient-to-t from-dark-800 to-transparent pointer-events-none transition-opacity duration-300 ${
                    scrollStates[index] ? "opacity-0" : "opacity-100"
                  }`}
                />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Experience;
