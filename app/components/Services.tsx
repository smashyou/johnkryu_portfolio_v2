"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { BiCheck, BiCheckboxSquare } from "react-icons/bi";
import { useState, useRef, useEffect } from "react";
import { services } from "@/app/data/content";

const Services = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const scrollRefs = useRef<HTMLDivElement[]>([]);
  const [scrollStates, setScrollStates] = useState<boolean[]>([]);

  useEffect(() => {
    const updateScrollStates = () => {
      const newStates = scrollRefs.current.map((ref) => {
        if (!ref) return false;
        const { scrollTop, scrollHeight, clientHeight } = ref;
        return scrollTop + clientHeight >= scrollHeight - 1;
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
    <section id="services" className="py-20 lg:py-32 relative">
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
            What I Offer
          </motion.h5>
          <motion.h2 variants={itemVariants} className="section-title">
            Services
          </motion.h2>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {services.map((service, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="bg-dark-800/50 border border-dark-700 rounded-2xl overflow-hidden group hover:border-dark-600 transition-all duration-300 hover:scale-105 transform"
            >
              {/* Header */}
              <div className="bg-primary-600 p-6">
                <h3 className="text-white font-semibold text-lg text-center">
                  {service.title}
                </h3>
              </div>

              {/* Content */}
              <div className="relative">
                <div
                  ref={(el) => {
                    if (el) scrollRefs.current[index] = el;
                  }}
                  className="max-h-96 overflow-y-auto p-6 scrollbar-thin space-y-4"
                >
                  {service.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="space-y-3">
                      <div className="flex items-start gap-3">
                        <BiCheck className="text-primary-400 text-lg mt-1 flex-shrink-0" />
                        <p className="text-white font-medium">{item.label}</p>
                      </div>
                      {item.subitems && (
                        <div className="ml-6 space-y-2">
                          {item.subitems.map((subitem, subIndex) => (
                            <div
                              key={subIndex}
                              className="flex items-start gap-2"
                            >
                              <BiCheckboxSquare className="text-primary-400/70 text-sm mt-1 flex-shrink-0" />
                              <p className="text-dark-300 text-sm">{subitem}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Fade indicator */}
                <div
                  className={`absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-dark-800 to-transparent pointer-events-none transition-opacity duration-300 ${
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

export default Services;
