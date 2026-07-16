"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/app/components/shared/usePrefersReducedMotion";

type Particle = { x: number; y: number; vx: number; vy: number; r: number };

/**
 * Verbatim port of the particle-field script from
 * `design_handoff_portfolio_redesign/Concept 1 - Neural Field.dc.html`
 * (see the componentDidMount/componentWillUnmount pair in the extracted
 * <script type="text/x-dc"> block): ~110 particles sized from viewport
 * area, mutual link lines under 130px, cursor repulsion under 140px.
 */
export default function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0;
    let H = 0;
    const particles: Particle[] = [];

    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    resize();

    const N = Math.min(110, Math.floor((W * H) / 16000));
    for (let i = 0; i < N; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.6 + 0.6,
      });
    }

    // Renders one frame. When `animate` is false, particles are drawn at
    // their current rest positions with no motion/repel math applied —
    // used for the single static reduced-motion frame.
    const renderFrame = (mouse: { x: number; y: number }, animate: boolean) => {
      ctx.clearRect(0, 0, W, H);
      for (const p of particles) {
        if (animate) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0 || p.x > W) p.vx *= -1;
          if (p.y < 0 || p.y > H) p.vy *= -1;
          const dm = Math.hypot(p.x - mouse.x, p.y - mouse.y);
          if (dm < 140) {
            p.x += ((p.x - mouse.x) / dm) * 0.6;
            p.y += ((p.y - mouse.y) / dm) * 0.6;
          }
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(34,211,238,.55)";
        ctx.fill();
      }
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 130) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(34,211,238,${(0.14 * (1 - d / 130)).toFixed(3)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
    };

    if (reducedMotion) {
      renderFrame({ x: -9999, y: -9999 }, false);
      // No RAF loop is running to pick up the new size after a resize
      // resets the canvas bitmap — redraw the static frame explicitly.
      const onResize = () => {
        resize();
        renderFrame({ x: -9999, y: -9999 }, false);
      };
      window.addEventListener("resize", onResize);
      return () => {
        window.removeEventListener("resize", onResize);
      };
    }

    window.addEventListener("resize", resize);

    const mouse = { x: -9999, y: -9999 };
    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener("mousemove", onMove);

    let raf = 0;
    const draw = () => {
      renderFrame(mouse, true);
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", resize);
    };
  }, [reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        pointerEvents: "none",
      }}
      aria-hidden
    />
  );
}
