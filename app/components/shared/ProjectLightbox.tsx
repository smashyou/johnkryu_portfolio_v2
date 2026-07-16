"use client";

import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useCallback, useEffect, useState } from "react";
import { type Project } from "@/app/data/content";

const ProjectLightbox = ({
  project,
  onClose,
}: {
  project: Project | null;
  onClose: () => void;
}) => {
  const [index, setIndex] = useState(0);

  const stepLightbox = useCallback(
    (delta: number) => {
      if (!project) return;
      setIndex((current) => {
        const count = project.images.length;
        return (current + delta + count) % count;
      });
    },
    [project]
  );

  useEffect(() => {
    if (!project) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") stepLightbox(-1);
      if (e.key === "ArrowRight") stepLightbox(1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [project, onClose, stepLightbox]);

  useEffect(() => {
    if (project) {
      setIndex(0);
    }
  }, [project?.id]);

  return (
    <AnimatePresence>
      {project && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 md:p-10"
          onClick={onClose}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-3 bg-dark-800 rounded-full text-white hover:bg-primary-600 transition-colors duration-300 z-10"
            aria-label="Close screenshots"
          >
            <FiX size={22} />
          </button>

          {project.images.length > 1 && (
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
              src={project.images[index]}
              alt={`${project.title} screenshot ${index + 1}`}
              className="w-full max-h-[80vh] object-contain rounded-xl border border-dark-600 shadow-2xl"
            />
            <div className="mt-4 flex items-center justify-between text-sm text-dark-300">
              <span className="font-medium text-white">{project.title}</span>
              {project.images.length > 1 && (
                <span>
                  {index + 1} / {project.images.length}
                </span>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProjectLightbox;
