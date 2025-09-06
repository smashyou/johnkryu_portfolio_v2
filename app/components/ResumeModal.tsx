"use client";

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { FiX, FiDownload } from "react-icons/fi";

interface ResumeModalProps {
  onClose: () => void;
}

const ResumeModal = ({ onClose }: ResumeModalProps) => {
  const resumeRef = useRef<HTMLDivElement>(null);

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
    // Create a link element
    const link = document.createElement('a');
    link.href = '/John_K_Ryu_Resume.pdf';
    link.download = 'John_K_Ryu_Resume.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

        {/* Resume Content */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 100px)' }}>
          <div ref={resumeRef} className="px-3 md:px-8 py-3 md:py-5 text-black bg-white text-xs md:text-base">
            {/* Resume Header */}
            <div className="text-center pb-1 md:pb-2 mb-2 md:mb-3 border-b md:border-b-2 border-gray-700">
              <h1 className="text-base md:text-xl font-bold tracking-wider mb-0.5 md:mb-1">JOHN K RYU</h1>
              <div className="text-[8px] md:text-[10px] leading-tight">
                <div className="flex flex-wrap justify-center gap-x-1 md:gap-x-2">
                  <span><strong>Email:</strong> jkr@gmail.com</span>
                  <span className="hidden md:inline">|</span>
                  <span><strong>Phone:</strong> (206) 777-8888</span>
                  <span className="hidden md:inline">|</span>
                  <span><strong>Location:</strong> Bellevue, WA</span>
                </div>
                <div className="flex flex-wrap justify-center gap-x-1 md:gap-x-2">
                  <span><strong>GitHub:</strong> github.com/smashyou</span>
                  <span className="hidden md:inline">|</span>
                  <span><strong>Website:</strong> johnminryu.vercel.app</span>
                </div>
              </div>
            </div>

            {/* Professional Experience */}
            <div className="mb-1.5 md:mb-2">
              <h2 className="text-[10px] md:text-xs font-bold uppercase border-b border-gray-600 pb-0.5 mb-1 md:mb-1.5">
                Professional Experience
              </h2>

              {/* AI Engineer */}
              <div className="mb-1.5 md:mb-2">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                  <div className="text-[9px] md:text-[11px]">
                    <span className="font-bold italic">AI Engineer</span>
                    <span> | </span>
                    <span className="font-bold italic">TecAce Software Ltd</span>
                  </div>
                  <span className="text-[8px] md:text-[9px] italic text-gray-600">Bellevue, WA | April 2025 - Present</span>
                </div>
                <ul className="ml-2 md:ml-3 mt-0.5 space-y-[2px]">
                  <li className="text-[8px] md:text-[9px] leading-snug md:leading-tight">
                    <strong>Architected enterprise-grade AI chatbot builder platform</strong> with a retrieval-augmented generation (RAG) pipeline utilizing LangChain, LangSmith, and LangGraph for advanced document processing and retrieval
                  </li>
                  <li className="text-[8px] md:text-[9px] leading-snug md:leading-tight">
                    <strong>Developed hybrid search optimization</strong> implementing RRF reranking, cross-encoder reranking, and score fusion techniques for enhanced search relevance
                  </li>
                  <li className="text-[8px] md:text-[9px] leading-snug md:leading-tight">
                    <strong>Built vector database architecture</strong> with embeddings and semantic search capabilities, managing dense/sparse retrieval systems for enterprise knowledge management
                  </li>
                  <li className="text-[8px] md:text-[9px] leading-snug md:leading-tight">
                    <strong>Designed configurable AI chatbot builder</strong> with intelligent parsers, chunkers, and search methods supporting multi-modal query processing
                  </li>
                </ul>
              </div>

              {/* e-Commerce Engineer */}
              <div className="mb-1.5 md:mb-2">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                  <div className="text-[9px] md:text-[11px]">
                    <span className="font-bold italic">e-Commerce Engineer/Owner</span>
                    <span> | </span>
                    <span className="font-bold italic">Roem Ventures LLC</span>
                  </div>
                  <span className="text-[8px] md:text-[9px] italic text-gray-600">Seattle, WA | May 2022 - Present</span>
                </div>
                <ul className="ml-2 md:ml-3 mt-0.5 space-y-[2px]">
                  <li className="text-[8px] md:text-[9px] leading-snug md:leading-tight">
                    <strong>Founded and developed e-commerce brand from concept to market launch</strong> including comprehensive product development, logistics coordination, and business operations management
                  </li>
                  <li className="text-[8px] md:text-[9px] leading-snug md:leading-tight">
                    <strong>Engineered custom Shopify solutions using Liquid programming</strong> developing tailored plugins and functionality enhancements for optimized user experience
                  </li>
                  <li className="text-[8px] md:text-[9px] leading-snug md:leading-tight">
                    <strong>Implemented integrated marketing campaign strategies</strong> utilizing Google AdWords and Facebook Advertising platforms for targeted customer acquisition and conversion optimization
                  </li>
                  <li className="text-[8px] md:text-[9px] leading-snug md:leading-tight">
                    <strong>Orchestrated end-to-end supply chain and logistics operations</strong> managing vendor relationships, inventory systems, and order fulfillment processes
                  </li>
                </ul>
              </div>

              {/* Software Engineer - Comcast */}
              <div className="mb-1.5 md:mb-2">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                  <div className="text-[9px] md:text-[11px]">
                    <span className="font-bold italic">Software Engineer - Xfinity X1 & Flex</span>
                    <span> | </span>
                    <span className="font-bold italic">Comcast</span>
                  </div>
                  <span className="text-[8px] md:text-[9px] italic text-gray-600">Philadelphia, PA | Oct 2017 - Nov 2021</span>
                </div>
                <ul className="ml-2 md:ml-3 mt-0.5 space-y-[2px]">
                  <li className="text-[8px] md:text-[9px] leading-snug md:leading-tight">
                    <strong>Successfully developed and maintained Xfinity Flex Streaming product from ground up</strong> building key middleware APIs that power core Flex features, resulting in positive customer feedback
                  </li>
                  <li className="text-[8px] md:text-[9px] leading-snug md:leading-tight">
                    <strong>Exceeded subscription acquisition targets by 1000%</strong> surpassing initial goal of 100K subscriptions within six months by acquiring over 1 million subscriptions
                  </li>
                  <li className="text-[8px] md:text-[9px] leading-snug md:leading-tight">
                    <strong>Developed and maintained core features for cloud-based X1 Guide interface</strong> directly impacting over 31 million customers across Xfinity TV platform
                  </li>
                  <li className="text-[8px] md:text-[9px] leading-snug md:leading-tight">
                    <strong>Implemented scalable backend architecture</strong> using distributed systems design principles to support millions of concurrent streaming users
                  </li>
                </ul>
              </div>

              {/* Startup Founder */}
              <div className="mb-1.5 md:mb-2">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                  <div className="text-[9px] md:text-[11px]">
                    <span className="font-bold italic">Startup Founder</span>
                    <span> | </span>
                    <span className="font-bold italic">Parkgorithm</span>
                  </div>
                  <span className="text-[8px] md:text-[9px] italic text-gray-600">Philadelphia, PA | May 2016 - Jun 2017</span>
                </div>
                <ul className="ml-2 md:ml-3 mt-0.5 space-y-[2px]">
                  <li className="text-[8px] md:text-[9px] leading-snug md:leading-tight">
                    <strong>Founded startup company with vision to resolve urban street parking challenges</strong> through innovative mobile technology solutions
                  </li>
                  <li className="text-[8px] md:text-[9px] leading-snug md:leading-tight">
                    <strong>Led cross-functional development team</strong> managing product roadmap and technical implementation for Android mobile application MVP
                  </li>
                  <li className="text-[8px] md:text-[9px] leading-snug md:leading-tight">
                    <strong>Executed comprehensive market research and user validation</strong> conducting stakeholder interviews and competitive analysis for product-market fit assessment
                  </li>
                </ul>
              </div>

              {/* Software Engineer - Graphite */}
              <div className="mb-1.5 md:mb-2">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                  <div className="text-[9px] md:text-[11px]">
                    <span className="font-bold italic">Software Engineer</span>
                    <span> | </span>
                    <span className="font-bold italic">Graphite GTC</span>
                  </div>
                  <span className="text-[8px] md:text-[9px] italic text-gray-600">Bryn Mawr, PA | May 2015 - May 2016</span>
                </div>
                <ul className="ml-2 md:ml-3 mt-0.5 space-y-[2px]">
                  <li className="text-[8px] md:text-[9px] leading-snug md:leading-tight">
                    <strong>Developed client-side applications for Android and Web platforms</strong> implementing responsive user interfaces and cross-platform compatibility solutions
                  </li>
                  <li className="text-[8px] md:text-[9px] leading-snug md:leading-tight">
                    <strong>Contributed to development of proprietary Graphite software platform</strong> focusing on user experience optimization and performance enhancement
                  </li>
                  <li className="text-[8px] md:text-[9px] leading-snug md:leading-tight">
                    <strong>Collaborated on full-stack development initiatives</strong> ensuring seamless integration between mobile applications and web-based systems
                  </li>
                </ul>
              </div>

              {/* Undergraduate Researcher */}
              <div className="mb-1.5 md:mb-2">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                  <div className="text-[9px] md:text-[11px]">
                    <span className="font-bold italic">Undergraduate Researcher</span>
                    <span> | </span>
                    <span className="font-bold italic">Temple University</span>
                  </div>
                  <span className="text-[8px] md:text-[9px] italic text-gray-600">Philadelphia, PA | Jun 2015 - Oct 2015</span>
                </div>
                <ul className="ml-2 md:ml-3 mt-0.5 space-y-[2px]">
                  <li className="text-[8px] md:text-[9px] leading-snug md:leading-tight">
                    <strong>Conducted computer vision research under NSF funding</strong> developing machine learning algorithms for mobile robot object detection and recognition systems
                  </li>
                  <li className="text-[8px] md:text-[9px] leading-snug md:leading-tight">
                    <strong>Developed innovative "Supported_By" algorithm in MATLAB</strong> enabling spatial relationship detection for autonomous robotics applications
                  </li>
                  <li className="text-[8px] md:text-[9px] leading-snug md:leading-tight">
                    <strong>Published research findings and presented technical solutions</strong> contributing to advancement of computer vision and robotics field knowledge
                  </li>
                </ul>
              </div>

              {/* Founder/Sales Director */}
              <div className="mb-1.5 md:mb-2">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                  <div className="text-[9px] md:text-[11px]">
                    <span className="font-bold italic">Founder/Sales Director</span>
                    <span> | </span>
                    <span className="font-bold italic">Fatty Pocket</span>
                  </div>
                  <span className="text-[8px] md:text-[9px] italic text-gray-600">Norristown, PA | Sept 2011 - Jul 2013</span>
                </div>
                <ul className="ml-2 md:ml-3 mt-0.5 space-y-[2px]">
                  <li className="text-[8px] md:text-[9px] leading-snug md:leading-tight">
                    <strong>Founded and scaled digital marketing platform</strong> collaborating with local businesses to develop and execute targeted coupon marketing campaigns across multiple industries
                  </li>
                  <li className="text-[8px] md:text-[9px] leading-snug md:leading-tight">
                    <strong>Led business development and sales operations</strong> managing marketing professionals and sales teams to identify growth opportunities and maintain strategic vendor relationships
                  </li>
                  <li className="text-[8px] md:text-[9px] leading-snug md:leading-tight">
                    <strong>Executed data-driven marketing strategies</strong> utilizing consultative approach to demonstrate value proposition and ensure seamless campaign execution from concept through performance analysis
                  </li>
                </ul>
              </div>
            </div>

            {/* Technical Skills */}
            <div className="mb-1.5 md:mb-2">
              <h2 className="text-[10px] md:text-xs font-bold uppercase border-b border-gray-600 pb-0.5 mb-1 md:mb-1.5">
                Technical Skills
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1 md:gap-2 text-[8px] md:text-[9px]">
                <div className="space-y-1">
                  <div>
                    <strong className="block">AI/Machine Learning:</strong>
                    <span className="text-gray-700 leading-tight">
                      RAG Pipeline Architecture • Hybrid Search Systems • Vector Databases • LangChain • PyTorch • AI Chatbot Development • Intent Classification • Cross-encoder Reranking • Semantic Search
                    </span>
                  </div>
                  <div>
                    <strong className="block">Frontend:</strong>
                    <span className="text-gray-700 leading-tight">
                      React.js • Next.js 14 • TypeScript • JavaScript ES6+ • HTML5/CSS3 • Tailwind CSS • Responsive Design
                    </span>
                  </div>
                  <div>
                    <strong className="block">Backend:</strong>
                    <span className="text-gray-700 leading-tight">
                      Java • Spring Boot • Node.js/Express • Python • Flask/FastAPI • RESTful APIs • GraphQL • Microservices
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div>
                    <strong className="block">Databases:</strong>
                    <span className="text-gray-700 leading-tight">
                      PostgreSQL • MySQL • DynamoDB • MongoDB • Vector Databases (Milvus) • Redis
                    </span>
                  </div>
                  <div>
                    <strong className="block">Cloud/DevOps:</strong>
                    <span className="text-gray-700 leading-tight">
                      AWS (EC2, S3, Lambda, EKS, Bedrock) • Docker • Kubernetes • CI/CD Pipelines • GitHub Actions
                    </span>
                  </div>
                  <div>
                    <strong className="block">Tools:</strong>
                    <span className="text-gray-700 leading-tight">
                      Git/GitHub • JIRA • Agile Methodology • API Testing • Performance Optimization
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Projects */}
            <div className="mb-1.5 md:mb-2">
              <h2 className="text-[10px] md:text-xs font-bold uppercase border-b border-gray-600 pb-0.5 mb-1 md:mb-1.5">
                Key Projects
              </h2>
              
              <div className="mb-1 md:mb-1.5">
                <div className="text-[9px] md:text-[10px] font-bold">AI Chat Builder Platform - Enterprise RAG System</div>
                <div className="text-[8px] md:text-[9px] ml-2 md:ml-3 text-gray-700 leading-snug md:leading-tight">
                  Hybrid search system combining BM25 sparse retrieval with dense vector embeddings. Multi-modal architecture supporting document search and real-time processing. Tech: Python, FastAPI, LangChain, AWS Bedrock, Milvus
                </div>
              </div>

              <div className="mb-1 md:mb-1.5">
                <div className="text-[9px] md:text-[10px] font-bold">iOS Application: FitLifePal</div>
                <div className="text-[8px] md:text-[9px] ml-2 md:ml-3 text-gray-700 leading-snug md:leading-tight">
                  Fitness application tracking daily estimated calories burned and consumed to help users reach fitness goals. Consumes Nutritionix REST API and retrieves JSON nutrition facts
                </div>
              </div>

              <div className="mb-1 md:mb-1.5">
                <div className="text-[9px] md:text-[10px] font-bold">Java Application: EZ-Doc</div>
                <div className="text-[8px] md:text-[9px] ml-2 md:ml-3 text-gray-700 leading-snug md:leading-tight">
                  Web document generator with four main components: GUI, file manager, file translator, and script interpreter. Designed to simplify HTML report creation process
                </div>
              </div>

              <div className="mb-1 md:mb-1.5">
                <div className="text-[9px] md:text-[10px] font-bold">Capstone Project: Proximity Marketing Platform - Marko Promo</div>
                <div className="text-[8px] md:text-[9px] ml-2 md:ml-3 text-gray-700 leading-snug md:leading-tight">
                  Four-component system including Web Application (LAMP stack), Cloud component, Embedded component (Raspberry Pi), and Mobile Application. Web application hosted on AWS
                </div>
              </div>
            </div>

            {/* Education */}
            <div>
              <h2 className="text-[10px] md:text-xs font-bold uppercase border-b border-gray-600 pb-0.5 mb-1 md:mb-1.5">
                Education
              </h2>
              <div className="text-[9px] md:text-[10px]">
                <strong>Bachelor of Science in Computer Science</strong><br />
                <span className="text-[8px] md:text-[9px]">Temple University | College of Science & Technology | Philadelphia, PA</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-300 bg-gray-50">
          <p className="text-xs text-gray-600">Press ESC to close</p>
          <div className="flex gap-2">
            <button 
              onClick={onClose} 
              className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors flex items-center"
            >
              <FiDownload className="mr-1.5" size={14} />
              Download PDF
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ResumeModal;