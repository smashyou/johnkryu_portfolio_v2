"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { BiCheck, BiCheckboxSquare } from "react-icons/bi";
import { useState, useRef, useEffect } from "react";

const Services = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const scrollRefs = useRef<HTMLDivElement[]>([]);
  const [scrollStates, setScrollStates] = useState<boolean[]>([]);

  const services = [
    {
      title: "Technical Consulting",
      items: [
        {
          label: "E-Commerce Solutions",
          subitems: [
            "Shopify store setup, customization (Liquid), and optimization",
            "Payment gateway integration, logistics, and marketing automation",
            "Analytics tracking, SEO best practices, and conversion optimization",
          ],
        },
        {
          label: "Project & Product Management Support",
          subitems: [
            "Agile/Scrum methodologies for cross-functional teams",
            "Backlog grooming, sprint planning, and stakeholder communication",
            "Risk assessment, scope management, and quality assurance",
          ],
        },
        {
          label: "Cloud & DevOps Consulting",
          subitems: [
            "AWS deployment and infrastructure setup (EC2, S3, RDS, etc.)",
            "Docker containerization and Kubernetes orchestration",
            "CI/CD pipelines and automated testing",
          ],
        },
        {
          label: "Technical Consulting & Mentorship",
          subitems: [
            "Code reviews and technical architecture guidance",
            "Best practices for version control (Git/GitHub) and documentation",
            "Training teams on new technologies and tools",
          ],
        },
      ],
    },
    {
      title: "Software Development",
      items: [
        {
          label: "Full-Stack Web Application Development",
          subitems: [
            "Front-End: React (JavaScript), HTML/CSS",
            "Back-End: Java (Spring Boot), RESTful API design, Microservices architecture",
            "Databases: RDBMS (MySQL), NoSQL (MongoDB, DynamoDB)",
          ],
        },
        {
          label: "Mobile Application Development",
          subitems: [
            "Native iOS (Swift) and Android (Java/Kotlin)",
            "Cross-functional integration of RESTful APIs and cloud services",
          ],
        },
        {
          label: "Microservices Architecture & Distributed Systems",
          subitems: [
            "Designing loosely coupled, scalable services",
            "Integrating message queues or event-driven systems",
            "Ensuring high availability and fault tolerance",
          ],
        },
      ],
    },
    {
      title: "Social Media & Digital Marketing",
      items: [
        {
          label: "Paid Advertising Campaigns",
          subitems: [
            "Google Ads (Search, Display)",
            "Facebook & Instagram Ads",
            "Audience targeting, budget optimization, and conversion tracking",
          ],
        },
        {
          label: "Content Strategy & Creation",
          subitems: [
            "Developing engaging, brand-aligned posts and copywriting",
            "Planning a content calendar for consistent, on-brand messaging",
            "Using visuals (images, short videos) to increase engagement",
          ],
        },
        {
          label: "Analytics & Performance Tracking",
          subitems: [
            "Setting up and interpreting platform analytics (e.g., Facebook Insights, Google Analytics)",
            "Identifying KPIs (click-through rate, conversion rate, return on ad spend)",
            "Generating actionable insights to fine-tune campaigns",
          ],
        },
        {
          label: "Audience Segmentation & Growth",
          subitems: [
            "Building custom audience lists, lookalike audiences, or retargeting campaigns",
            "Community management (responding to comments, messages)",
            "Influencer outreach and partnership strategies",
          ],
        },
        {
          label: "E-Commerce Integration",
          subitems: [
            "Driving traffic to online stores (e.g., Shopify) and optimizing landing pages",
            "Designing remarketing funnels to recover abandoned carts and boost sales",
            "Syncing product catalogs with social commerce platforms",
          ],
        },
        {
          label: "Brand Positioning & Reputation Management",
          subitems: [
            "Developing or refining brand voice and visual identity for social channels",
            "Monitoring brand mentions, managing customer feedback, and resolving issues proactively",
            "Ensuring consistent, positive representation of the brand across platforms",
          ],
        },
        {
          label: "Growth Hacking Techniques",
          subitems: [
            "A/B testing of ad creatives, landing pages, and marketing messages",
            "Implementing viral loops, referral incentives, or limited-time offers",
            "Experimenting with emerging platforms or features (Reels, Stories, etc.)",
          ],
        },
      ],
    },
  ];

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
