"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/app/components/shared/usePrefersReducedMotion";
import styles from "./graph.module.css";

const MINT = "#8ef7cd";
const VIOLET = "#a78bfa";
const WHITE = "#ece9f7";

// Verbatim from the reference script's `groups` array in
// `design_handoff_portfolio_redesign/Concept 2 - Knowledge Graph.dc.html`
// (componentDidMount) — 6 skill/venture clusters orbiting the core node,
// each with its own leaf nodes.
const GROUPS: { label: string; color: string; leaves: string[] }[] = [
  {
    label: "Agentic AI",
    color: MINT,
    leaves: ["Claude Code", "MCP", "LangGraph", "Multi-Agent", "Prompt Eng", "Agent SDLC"],
  },
  {
    label: "AI / ML",
    color: VIOLET,
    leaves: ["RAG", "Hybrid Search", "Milvus", "PyTorch", "vLLM · Bedrock", "Embeddings"],
  },
  {
    label: "Full Stack",
    color: MINT,
    leaves: ["React · Next.js", "TypeScript", "FastAPI", "Spring Boot", "Node.js", "PostgreSQL"],
  },
  {
    label: "Cloud / DevOps",
    color: VIOLET,
    leaves: ["AWS", "Kubernetes", "Docker", "CI/CD", "On-Prem", "Traefik"],
  },
  {
    label: "Founder",
    color: MINT,
    leaves: ["Roem Ventures", "Parkgorithm", "Fatty Pocket", "MarketScopeAI", "RecompIQ"],
  },
  {
    label: "Comcast X1",
    color: VIOLET,
    leaves: ["31M customers", "1M+ Flex subs", "Middleware", "Distributed Sys"],
  },
];

type GraphNode = {
  label: string;
  size: number;
  color: string;
  core?: boolean;
  group?: boolean;
  theta?: number;
  phi?: number;
  rad?: number;
  x: number;
  y: number;
  z: number;
};

type Projected = { sx: number; sy: number; scale: number; z: number };

/**
 * Verbatim port of the 3D graph script from
 * `design_handoff_portfolio_redesign/Concept 2 - Knowledge Graph.dc.html`
 * (componentDidMount/componentWillUnmount): core "JOHN K. RYU" node, 6 group
 * nodes, ~30 leaf nodes on spherical coordinates, auto-rotating around Y
 * with drag-controlled rotation on both axes (rotX clamped to ±1.2),
 * perspective projection `500/(500+z)`, nearest-first z-sort node draw with
 * hover enlarge + label. Reference used mousedown/mousemove/mouseup; ported
 * to pointer events per task brief for pointer/touch parity.
 */
export default function GraphCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoverLabel, setHoverLabel] = useState("");
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const DPR = window.devicePixelRatio || 1;
    let W = 0;
    let H = 0;

    const resize = () => {
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = W * DPR;
      canvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // nodes: core + categories + leaves
    const nodes: GraphNode[] = [
      { label: "JOHN K. RYU", size: 7, color: WHITE, core: true, x: 0, y: 0, z: 0 },
    ];
    const links: [number, number][] = [];
    GROUPS.forEach((g, gi) => {
      const gIdx = nodes.length;
      nodes.push({
        label: g.label,
        size: 5,
        color: g.color,
        group: true,
        theta: (gi / GROUPS.length) * Math.PI * 2,
        phi: Math.PI / 2 + (gi % 2 ? 0.5 : -0.5),
        rad: 95,
        x: 0,
        y: 0,
        z: 0,
      });
      links.push([0, gIdx]);
      g.leaves.forEach((leaf, li) => {
        const idx = nodes.length;
        nodes.push({
          label: leaf,
          size: 3,
          color: g.color,
          theta: (gi / GROUPS.length) * Math.PI * 2 + (li - g.leaves.length / 2) * 0.42,
          phi: Math.PI / 2 + (gi % 2 ? 0.5 : -0.5) + ((li % 3) - 1) * 0.5,
          rad: 170 + (li % 2) * 34,
          x: 0,
          y: 0,
          z: 0,
        });
        links.push([gIdx, idx]);
      });
    });
    // 3D positions
    nodes.forEach((n) => {
      if (n.core) return;
      const theta = n.theta as number;
      const phi = n.phi as number;
      const rad = n.rad as number;
      n.x = rad * Math.sin(phi) * Math.cos(theta);
      n.y = rad * Math.cos(phi);
      n.z = rad * Math.sin(phi) * Math.sin(theta);
    });

    let rotY = 0;
    let rotX = -0.15;
    const autoSpeed = 0.0032;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let mx = -9999;
    let my = -9999;

    const project = (n: GraphNode): Projected => {
      // rotate around Y then X
      const cy = Math.cos(rotY);
      const sy = Math.sin(rotY);
      const cx = Math.cos(rotX);
      const sx = Math.sin(rotX);
      const x = n.x * cy + n.z * sy;
      let z = -n.x * sy + n.z * cy;
      const y = n.y * cx - z * sx;
      z = n.y * sx + z * cx;
      const persp = 500 / (500 + z);
      return { sx: W / 2 + x * persp, sy: H / 2 + y * persp, scale: persp, z };
    };

    const onPointerDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      canvas.style.cursor = "grabbing";
    };
    const onPointerUp = () => {
      dragging = false;
      canvas.style.cursor = "grab";
    };
    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mx = e.clientX - rect.left;
      my = e.clientY - rect.top;
      if (dragging) {
        rotY += (e.clientX - lastX) * 0.006;
        rotX += (e.clientY - lastY) * 0.006;
        rotX = Math.max(-1.2, Math.min(1.2, rotX));
        lastX = e.clientX;
        lastY = e.clientY;
      }
    };
    canvas.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointermove", onPointerMove);

    let raf = 0;
    let lastHoverLabel = "";

    const draw = () => {
      // Reduced motion: no autonomous rotation, but drag-driven rotY/rotX
      // changes above still redraw here, so drag + hover stay fully live.
      if (!dragging && !reducedMotion) rotY += autoSpeed;
      ctx.clearRect(0, 0, W, H);
      const proj = nodes.map(project);

      // links
      for (const [a, b] of links) {
        const A = proj[a];
        const B = proj[b];
        ctx.beginPath();
        ctx.moveTo(A.sx, A.sy);
        ctx.lineTo(B.sx, B.sy);
        const alpha = 0.1 + 0.12 * Math.min(A.scale, B.scale);
        ctx.strokeStyle = `rgba(142,247,205,${alpha.toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // nodes (far first)
      const order = proj.map((_, i) => i).sort((a, b) => proj[b].z - proj[a].z);
      let hovered: string | null = null;
      for (const i of order) {
        const n = nodes[i];
        const p = proj[i];
        const size = n.size * p.scale;
        const dh = Math.hypot(p.sx - mx, p.sy - my);
        const isHover = dh < Math.max(12, size * 2.4);
        if (isHover) hovered = n.label;
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, size * (isHover ? 1.6 : 1), 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.shadowColor = n.color;
        ctx.shadowBlur = isHover ? 22 : 10;
        ctx.fill();
        ctx.shadowBlur = 0;
        if (n.core || n.group || isHover || p.scale > 1.06) {
          ctx.font = `${n.core ? "700 13px" : n.group ? "600 12px" : "400 10.5px"} 'IBM Plex Mono', monospace`;
          ctx.fillStyle = n.core
            ? "#ece9f7"
            : isHover
              ? "#ffffff"
              : `rgba(236,233,247,${(0.35 + 0.5 * (p.scale - 0.7)).toFixed(2)})`;
          ctx.textAlign = "center";
          ctx.fillText(n.label, p.sx, p.sy - size - 8);
        }
      }

      const label = hovered ? `[ ${hovered} ]` : "";
      if (label !== lastHoverLabel) {
        lastHoverLabel = label;
        setHoverLabel(label);
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, [reducedMotion]);

  return (
    <>
      <canvas ref={canvasRef} className={styles.graphCanvas} aria-hidden />
      <div className={styles.hoverLabel}>{hoverLabel}</div>
    </>
  );
}
