"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { FiX, FiDownload, FiLock } from "react-icons/fi";
import PasswordModal from "./PasswordModal";

interface ResumeModalProps {
  onClose: () => void;
}

const ResumeModal = ({ onClose }: ResumeModalProps) => {
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [onClose]);

  const handleDownloadPDF = () => {
    // Download public version (sanitized)
    const link = document.createElement('a');
    link.href = '/John_K_Ryu_Resume.pdf';
    link.download = 'John_K_Ryu_Resume_Public.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadFullPDF = () => {
    // PasswordModal verifies the password server-side and downloads the file itself.
    setShowPasswordModal(false);
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 50 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: 50,
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <>
    <motion.div
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] md:max-h-[90vh] max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 md:px-6 py-2 md:py-3 border-b border-gray-300">
          <div>
            <h3 className="text-base md:text-lg font-semibold text-gray-900">Resume</h3>
            <p className="text-xs text-gray-600">John K Ryu</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 md:p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Resume Content — embeds the public PDF so the preview always matches the real resume */}
        <div className="bg-gray-100" style={{ height: "calc(85vh - 110px)" }}>
          <object
            data="/John_K_Ryu_Resume.pdf#toolbar=0&navpanes=0"
            type="application/pdf"
            className="w-full h-full"
            aria-label="John K Ryu resume preview"
          >
            <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
              <p className="text-gray-700 text-sm">
                Your browser can&apos;t display PDFs inline.
              </p>
              <a
                href="/John_K_Ryu_Resume.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gray-800 text-white rounded-md text-sm hover:bg-gray-700 transition-colors"
              >
                Open the resume
              </a>
            </div>
          </object>
        </div>
        {/* Footer */}
        <div className="flex flex-col md:flex-row items-center justify-between px-4 md:px-6 py-3 border-t border-gray-300 bg-gray-50 gap-3">
          <p className="text-xs text-gray-600 hidden md:block">Press ESC to close</p>
          <div className="flex flex-wrap gap-2 justify-center w-full md:w-auto">
            <button 
              onClick={onClose} 
              className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-3 py-1.5 text-sm bg-gray-600 text-white hover:bg-gray-700 rounded-md transition-colors flex items-center"
              title="Download public version (contact info hidden)"
            >
              <FiDownload className="mr-1.5" size={14} />
              Public Version
            </button>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors flex items-center"
              title="Download with full contact information (password required)"
            >
              <FiLock className="mr-1.5" size={14} />
              Full Version
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>

    {/* Password Modal */}
    <PasswordModal
      isOpen={showPasswordModal}
      onClose={() => setShowPasswordModal(false)}
      onSuccess={handleDownloadFullPDF}
    />
  </>
  );
};

export default ResumeModal;