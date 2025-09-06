"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { BsLinkedin, BsGithub, BsInstagram } from "react-icons/bs";
import { FiHeart } from "react-icons/fi";

const Footer = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const navigation = [
    { name: "Home", href: "#home" },
    { name: "About", href: "#about" },
    { name: "Experience", href: "#experience" },
    { name: "Services", href: "#services" },
    { name: "Portfolio", href: "#portfolio" },
    { name: "Contact", href: "#contact" },
  ];

  const socialLinks = [
    {
      name: "LinkedIn",
      href: "https://linkedin.com/in/johnminryu",
      icon: BsLinkedin,
      color: "hover:text-blue-400",
    },
    {
      name: "GitHub",
      href: "https://github.com/smashyou",
      icon: BsGithub,
      color: "hover:text-gray-400",
    },
    {
      name: "Instagram",
      href: "https://instagram.com/johnminryu",
      icon: BsInstagram,
      color: "hover:text-pink-400",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
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
    <footer className="bg-dark-800/50 border-t border-dark-700 mt-20 pb-24">
      <div className="container py-12">
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="text-center"
        >
          {/* Logo/Name */}
          <motion.div variants={itemVariants} className="mb-8">
            <h2 className="text-2xl font-bold gradient-text mb-2">
              John Keunmin Ryu
            </h2>
            <p className="text-dark-300">Full Stack Developer & Entrepreneur</p>
          </motion.div>

          {/* Navigation Links */}
          <motion.nav variants={itemVariants} className="mb-8">
            <ul className="flex flex-wrap justify-center gap-8">
              {navigation.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className="text-dark-300 hover:text-primary-400 transition-colors duration-300 hover:scale-105 transform inline-block"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </motion.nav>

          {/* Social Links */}
          <motion.div variants={itemVariants} className="mb-8">
            <div className="flex justify-center gap-6">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-3 bg-dark-700 rounded-full text-dark-300 ${social.color} transition-all duration-300 hover:scale-110 transform hover:bg-dark-600`}
                >
                  <social.icon size={20} />
                </a>
              ))}
            </div>
          </motion.div>

          {/* Copyright */}
          <motion.div
            variants={itemVariants}
            className="pt-8 border-t border-dark-700"
          >
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 text-dark-400 text-sm">
              <p className="flex items-center gap-1">
                Made with <FiHeart className="text-red-400" size={16} /> by John
                K. Ryu
              </p>
              <p>
                &copy; {new Date().getFullYear()} johnkryu.vercel.app - All
                rights reserved.
              </p>
              <p className="text-xs">Version 2.0.0</p>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent pointer-events-none" />
    </footer>
  );
};

export default Footer;
