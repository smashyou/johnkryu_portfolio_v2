// Shared content data layer for the portfolio site and all redesign concepts.
// Content is transcribed verbatim from the original components (Portfolio.tsx,
// Services.tsx) and from the design reference bundle (design_handoff_portfolio_redesign/).
// Do not rewrite, summarize, or "fix" copy here — this is the single source of truth.

export type Project = {
  id: number;
  title: string;
  subtitle: string;
  images: string[];
  github?: string;
  demo: string;
  tags: string[];
};

export type ServiceItem = { label: string; subitems: string[] };
export type ServiceCategory = { title: string; items: ServiceItem[] };
export type TimelineEntry = { period: string; title: string; org: string; desc: string };
export type SkillCategory = { title: string; skills: string[] };
export type ConceptId = "c1" | "c2" | "c3" | "c4" | "c5" | "c6" | "c7";
export type ConceptMeta = {
  id: ConceptId;
  slug: string;
  tag: string;
  accent: string;
  glow: string;
  title: string;
  desc: string;
  notes: string;
};

export const projects: Project[] = [
  {
    id: 8,
    title: "TecAce AI Agent Studio",
    subtitle:
      "Governance-first, privacy-first enterprise agentic-AI platform — build AI agents with roles and goals, orchestrate them into automated multi-agent workflows, and ground them in your knowledge with governed RAG. A dedicated conversation-memory layer (short & long-term) makes agents self-improving across sessions, with guardrails, a RAGAS/LLM-judge evaluation & quality system, Slack/Teams integrations, and a public developer API built in. Runs on hybrid infrastructure — cloud (AWS) or fully on-prem — so regulated teams keep sensitive data inside their own perimeter, including self-hosted/on-prem model serving. Built 80–90% of the platform including the complete UI/UX and full-stack implementation.",
    images: [
      "/images/projects/ai-studio-dark.png",
      "/images/projects/ai-studio-light.png",
      "/images/projects/ai-studio-dashboard-dark.png",
      "/images/projects/ai-studio-dashboard-light.png",
      "/images/projects/ai-studio-flow-builder-dark.png",
      "/images/projects/ai-studio-flow-builder-light.png",
      "/images/projects/ai-studio-rags-dark.png",
      "/images/projects/ai-studio-rags-light.png",
      "/images/projects/ai-studio-prompts-dark.png",
      "/images/projects/ai-studio-prompts-light.png",
      "/images/projects/ai-studio-agents-dark.png",
      "/images/projects/ai-studio-agents-light.png",
      "/images/projects/ai-studio-guardrails-dark.png",
      "/images/projects/ai-studio-guardrails-light.png",
      "/images/projects/ai-studio-integrations-dark.png",
      "/images/projects/ai-studio-integrations-light.png",
    ],
    demo: "https://app.builder.aipoc.tecace.com",
    tags: ["AI Agents", "RAG", "LangGraph", "Hybrid Cloud/On-Prem", "Governance"],
  },
  {
    id: 1,
    title: "MarketScopeAI (Omnidora)",
    subtitle:
      "AI marketing automation SaaS — an AI Command Center with a lead pipeline, conversion funnel, and AI employees that qualify leads, nurture prospects, make sales calls, and run marketing playbooks 24/7 for small businesses.",
    images: [
      "/images/projects/marketscope-ai.png",
      "/images/projects/omnidora-dashboard.png",
      "/images/projects/omnidora-ai-employees.png",
      "/images/projects/omnidora-ai-employee-overview.png",
      "/images/projects/omnidora-ai-employee-knowledge.png",
      "/images/projects/omnidora-ai-employee-personality.png",
      "/images/projects/omnidora-ai-employee-goals.png",
      "/images/projects/omnidora-automations-all-workflows.png",
      "/images/projects/omnidora-automations-ai-builder.png",
      "/images/projects/omnidora-automations-auto-pilot.png",
    ],
    demo: "https://www.omnidora.com",
    tags: ["AI Agents", "SaaS", "Next.js", "Marketing Automation"],
  },
  {
    id: 2,
    title: "RecompIQ",
    subtitle:
      "A coach for your body recomposition data — tracks peptide protocols, nutrition, biomarkers, and workouts with evidence-graded insights, weight projections, a multi-stream timeline, and an AI coach backed by a multi-provider model stack. Educational by design; it never prescribes.",
    images: [
      "/images/projects/recompiq.png",
      "/images/projects/recompiq-dashboard.png",
      "/images/projects/recompiq-goals.png",
      "/images/projects/recompiq-projections.png",
      "/images/projects/recompiq-timeline.png",
      "/images/projects/recompiq-labs.png",
      "/images/projects/recompiq-coach.png",
      "/images/projects/recompiq-peptides.png",
      "/images/projects/recompiq-protocol-library.png",
      "/images/projects/recompiq-inventory.png",
      "/images/projects/recompiq-workouts.png",
      "/images/projects/recompiq-admin.png",
    ],
    demo: "https://www.recompiq.com",
    tags: ["AI", "Health Tech", "Next.js", "Data Visualization"],
  },
  {
    id: 3,
    title: "PlinthPrep — CCA-F Exam Prep",
    subtitle:
      "Exam-prep platform for Anthropic's Claude Certified Architect: Foundational (CCA-F) — 1,207+ practice questions, a full 60-question mock at official domain weighting, a weak-spot drill that learns from your answers, and 493+ Leitner flashcards. Built by people who passed.",
    images: [
      "/images/projects/plinthprep-ccaf.png",
      "/images/projects/plinthprep-dashboard.png",
      "/images/projects/plinthprep-modules.png",
      "/images/projects/plinthprep-quiz.png",
      "/images/projects/plinthprep-mock-exam.png",
      "/images/projects/plinthprep-flashcards.png",
      "/images/projects/plinthprep-drill.png",
      "/images/projects/plinthprep-history.png",
    ],
    demo: "https://www.plinthprep.com",
    tags: ["AI", "EdTech", "Claude API", "Next.js"],
  },
  {
    id: 4,
    title: "Jackpot Teller AI",
    subtitle:
      "Play the lottery like it's your data — 12 AI prediction methods, a 6-model ML ensemble (RF, XGB, LSTM, TCNN, Transformer, FP-Growth), auto-matching against every draw, historical frequency analytics, and a full admin backend with revenue, ML pipeline, and LLM-router controls.",
    images: [
      "/images/projects/jackpot-teller.png",
      "/images/projects/jackpotteller-home.png",
      "/images/projects/jackpotteller-dashboard.png",
      "/images/projects/jackpotteller-predictions.png",
      "/images/projects/jackpotteller-patterns.png",
      "/images/projects/jackpotteller-match-tracker.png",
      "/images/projects/jackpotteller-admin.png",
      "/images/projects/jackpotteller-admin-ml-engine.png",
      "/images/projects/jackpotteller-admin-data-pipeline.png",
    ],
    demo: "https://www.jackpotteller.com",
    tags: ["AI", "ML Ensemble", "Analytics", "Python", "SaaS"],
  },
  {
    id: 5,
    title: "John's Guide (lore)",
    subtitle:
      "Curated city travel guide — hand-picked must-go spots, interactive map, category browsing, and an auto-built 2-day plan, aware of local events during your dates.",
    images: ["/images/projects/johns-guide.png"],
    demo: "https://johnsguide.vercel.app",
    tags: ["Next.js", "Maps", "Travel", "UX"],
  },
  {
    id: 6,
    title: "React.js Presentation",
    subtitle:
      "An engaging presentation powered by React.js and Next.js, featuring interactive demos.",
    images: ["/images/projects/reactjs-presentation.png"],
    github: "https://www.github.com/smashyou/reactjs-presentation",
    demo: "https://reactjs-presentation.vercel.app",
    tags: ["React", "Next.js", "TypeScript", "Tailwind"],
  },
  {
    id: 7,
    title: "Cosmic Kitchen: Kubernetes Presentation",
    subtitle:
      "Explaining Kubernetes with Cosmic Kitchen Analogy featuring interactive demos",
    images: ["/images/projects/cosmic-kitchen.png"],
    github: "https://www.github.com/smashyou/kubernetes_presentation",
    demo: "https://k8s-presentation.vercel.app",
    tags: ["Kubernetes", "Docker", "DevOps", "React"],
  },
];

export const services: ServiceCategory[] = [
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

// Transcribed verbatim from the Journey section of
// design_handoff_portfolio_redesign/Concept 1 - Neural Field.dc.html
export const timeline: TimelineEntry[] = [
  {
    period: "2025 — PRESENT",
    title: "AI Engineer",
    org: "TecAce Software · Bellevue, WA",
    desc: "Architecting a governance-first enterprise agentic-AI platform: RAG pipelines, LangGraph visual flow builder, Slack/Teams gateway, hybrid search with RRF + cross-encoder reranking, an end-to-end LLM evaluation system (RAGAS test sets, NDCG/MRR, LLM-as-judge), and a 500+ endpoint public API — deployable cloud or fully on-prem.",
  },
  {
    period: "2022 — PRESENT",
    title: "e-Commerce Engineer / Owner",
    org: "Roem Ventures · Seattle, WA",
    desc: "Founded and built an e-commerce brand end to end — custom Shopify (Liquid) engineering, logistics, and Google/Facebook ad campaigns.",
  },
  {
    period: "2017 — 2021",
    title: "Software Engineer, X1 & Flex",
    org: "Comcast · Philadelphia, PA",
    desc: "Built Xfinity Flex middleware from the ground up — 1M+ subscriptions in six months, 10× the goal — and core features of the cloud X1 Guide serving 31M customers.",
  },
  {
    period: "2016 — 2017",
    title: "Startup Founder",
    org: "Parkgorithm",
    desc: "Founded a startup tackling urban street parking; led a cross-functional team to an Android MVP.",
  },
  {
    period: "2015 — 2016",
    title: "Software Engineer",
    org: "Graphite GTC · Bryn Mawr, PA",
    desc: "Client-side Android and web applications on the Graphite no-code platform.",
  },
  {
    period: "2015",
    title: "Undergraduate Researcher (NSF)",
    org: "Temple University",
    desc: "Computer-vision research for mobile robot object detection — built the 'Supported_By' spatial-relationship algorithm. BS in Computer Science.",
  },
  {
    period: "2011 — 2013",
    title: "Founder / Sales Director",
    org: "Fatty Pocket · Norristown, PA",
    desc: "First venture at 20 — a local coupon-marketing platform; led sales teams and vendor partnerships.",
  },
];

// Transcribed verbatim from the Skills section of
// design_handoff_portfolio_redesign/Concept 1 - Neural Field.dc.html
export const skills: SkillCategory[] = [
  {
    title: "Agentic / AI-Native Development",
    skills: [
      "Claude Code · Codex",
      "Multi-Agent Orchestration",
      "MCP (Model Context Protocol)",
      "LangGraph Workflows",
      "Prompt Engineering",
      "Agent-Assisted SDLC",
    ],
  },
  {
    title: "AI / ML",
    skills: [
      "RAG Pipeline Architecture",
      "Hybrid Search (Sparse + Dense)",
      "Embeddings & Semantic Search",
      "Cross-encoder Reranking",
      "LLM Evaluation (RAGAS · LLM-as-Judge)",
      "Retrieval Metrics (NDCG · MRR)",
      "vLLM · AWS Bedrock",
      "PyTorch · Transformers",
      "LangChain · LangSmith",
      "Intent Classification",
    ],
  },
  {
    title: "Frontend",
    skills: [
      "React.js",
      "Next.js 14",
      "TypeScript",
      "JavaScript ES6+",
      "Tailwind CSS",
      "Responsive Design",
    ],
  },
  {
    title: "Backend",
    skills: [
      "Python",
      "FastAPI / Flask",
      "Java · Spring Boot",
      "Node.js / Express",
      "RESTful APIs · SSE Streaming",
      "GraphQL",
      "Microservices",
      "OpenAPI / Swagger",
    ],
  },
  {
    title: "Databases",
    skills: [
      "PostgreSQL",
      "MySQL",
      "DynamoDB",
      "MongoDB",
      "Milvus (Vector DB)",
      "Redis / Valkey",
    ],
  },
  {
    title: "Cloud / On-Prem / DevOps",
    skills: [
      "Hybrid Cloud & On-Prem",
      "AI Governance & Data Privacy",
      "AWS (EC2·S3·Lambda·EKS·Bedrock)",
      "Docker · Kubernetes",
      "CI/CD · GitHub Actions",
      "Traefik",
      "Observability / Tracing",
    ],
  },
];

export const profile: {
  name: string;
  title: string;
  location: string;
  email: string;
  github: string;
  linkedin: string;
  mantras: [string, string];
} = {
  name: "John K. Ryu",
  title: "AI Engineer · Full Stack · Entrepreneur",
  location: "Bellevue, WA",
  email: "johnminryu@gmail.com",
  github: "https://github.com/smashyou",
  linkedin: "https://linkedin.com/in/johnminryu",
  mantras: [
    "Make sure the choices you make are worth the losses you will take",
    "Be the energy you want to attract",
  ],
};

// Transcribed verbatim from the gateway script's `concepts` array in
// design_handoff_portfolio_redesign/Portfolio Concepts.dc.html, with `href`
// replaced by `slug`, plus a 7th entry for the classic site.
export const concepts: ConceptMeta[] = [
  {
    id: "c1",
    slug: "neural-field",
    tag: "01 · NEURAL FIELD",
    accent: "#22d3ee",
    glow: "rgba(34,211,238,.12)",
    title: "Neural Field",
    desc: "A living particle network reacts to your cursor while a terminal types out the mission. Electric cyan on near-black — clean, credible AI-engineer energy.",
    notes: "ambient · reactive",
  },
  {
    id: "c2",
    slug: "knowledge-graph",
    tag: "02 · KNOWLEDGE GRAPH",
    accent: "#8ef7cd",
    glow: "rgba(142,247,205,.12)",
    title: "3D Knowledge Graph",
    desc: "Skills, ventures, and history orbit as a draggable 3D constellation. Grab it, spin it, hover the nodes — everything is connected.",
    notes: "interactive · 3D",
  },
  {
    id: "c3",
    slug: "operator-console",
    tag: "03 · OPERATOR CONSOLE",
    accent: "#00ff9c",
    glow: "rgba(0,255,156,.12)",
    title: "Operator Console",
    desc: "RYU.OS boots in front of you — CRT scanlines, live module bars, a career rendered as git log. The boldest, most personality-forward way in.",
    notes: "terminal · cinematic",
  },
  {
    id: "c4",
    slug: "aurora-glass",
    tag: "04 · AURORA GLASS",
    accent: "#c9a6ff",
    glow: "rgba(201,166,255,.12)",
    title: "Aurora Glass",
    desc: "Aurora light drifts behind holographic glass and serif editorial type. The most elegant room in the house — slow scroll recommended.",
    notes: "editorial · serene",
  },
  {
    id: "c5",
    slug: "the-machine",
    tag: "05 · THE MACHINE",
    accent: "#ffb454",
    glow: "rgba(255,180,84,.12)",
    title: "The Machine",
    desc: "A 3D processor tears itself apart as you scroll — each layer a career chapter — then reassembles into one running machine. Full WebGL.",
    notes: "3D teardown · scroll-driven",
  },
  {
    id: "c6",
    slug: "the-exchange",
    tag: "06 · THE EXCHANGE",
    accent: "#f5b942",
    glow: "rgba(245,185,66,.12)",
    title: "The Exchange",
    desc: "$RYU as a publicly traded asset: live ticker tape, a candlestick chart of fifteen years, skills as portfolio holdings, products as active deals.",
    notes: "markets · terminal",
  },
  {
    id: "c7",
    slug: "classic",
    tag: "07 · CLASSIC",
    accent: "#7dd6f5",
    glow: "rgba(125,214,245,.12)",
    title: "Classic",
    desc: "The original johnkryu.vercel.app experience — hero, services, full project galleries, and the résumé vault, exactly as shipped.",
    notes: "original · complete",
  },
];

// Gateway card for the Arcade, appended to the concepts grid outside the
// c1–c7 vote ids (poll code untouched). See spec §"Gateway card".
export type ArcadeMeta = {
  slug: "games";
  tag: string;
  accent: string;
  glow: string;
  title: string;
  desc: string;
  notes: string;
};
export const arcade: ArcadeMeta = {
  slug: "games",
  tag: "08 · THE ARCADE",
  accent: "#ff4fd8",
  glow: "rgba(255,79,216,.12)",
  title: "The Arcade",
  desc: "Three games, zero downloads. Challenge the computer — or send a friend an invite link and settle it head-to-head.",
  notes: "play · multiplayer",
};

// Copy for the Jarvis gateway banner, verbatim from spec §"Gateway banner".
export const jarvis: {
  eyebrow: string;
  title: string;
  line: string;
  hqUrl: "https://ryuco.tech";
  storyPath: "/jarvis";
} = {
  eyebrow: "PERSONAL PROJECT · ALWAYS ON",
  title: "JARVIS — my personal AI chief of staff",
  line: "A multi-agent AI company that runs my holding company's operations — agents, vaults, and businesses orbiting one core.",
  hqUrl: "https://ryuco.tech",
  storyPath: "/jarvis",
};
