"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/app/components/shared/usePrefersReducedMotion";

type Blob = {
  hue: number;
  sat: number;
  r: number;
  sx: number;
  sy: number;
  spx: number;
  spy: number;
  ph: number;
};

// Verbatim from the reference script's `blobs` array in
// design_handoff_portfolio_redesign/Concept 4 - Aurora Glass.dc.html
// (componentDidMount) — 4 radial-gradient aurora blobs drifting via sine/cosine.
const BLOBS: Blob[] = [
  { hue: 195, sat: 90, r: 420, sx: 0.22, sy: 0.3, spx: 0.00019, spy: 0.00023, ph: 0 },
  { hue: 268, sat: 75, r: 480, sx: 0.75, sy: 0.25, spx: 0.00016, spy: 0.0002, ph: 2 },
  { hue: 325, sat: 70, r: 380, sx: 0.55, sy: 0.8, spx: 0.00021, spy: 0.00017, ph: 4 },
  { hue: 210, sat: 85, r: 340, sx: 0.12, sy: 0.85, spx: 0.00018, spy: 0.00025, ph: 1 },
];

/**
 * Verbatim port of the aurora-blob canvas script from
 * `design_handoff_portfolio_redesign/Concept 4 - Aurora Glass.dc.html`
 * (componentDidMount/componentWillUnmount): 4 radial-gradient blobs
 * composited with `globalCompositeOperation = "lighter"` for an additive
 * aurora glow, drifting via sine/cosine driven by the RAF timestamp. Fixed
 * full-viewport canvas rendered behind all page content. Reduced motion: one
 * static frame at t=0, no RAF loop started at all (matches the
 * ParticleField.tsx / GraphCanvas.tsx precedent from app/neural-field and
 * app/knowledge-graph).
 */
export default function AuroraCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Performance: the aurora is pure soft gradient, so it is rendered into a
    // tiny internal bitmap (~1/8 viewport, GPU-upscaled by CSS) instead of a
    // full-resolution canvas — visually identical for blurred gradients while
    // cutting per-frame rasterization work ~64×. This matters doubly here:
    // every glass element on the page uses backdrop-filter, and each canvas
    // repaint forces those blurs to recompute.
    const SCALE = 0.125;
    let W = 0;
    let H = 0;
    // Effective scale actually applied (differs from SCALE when the minimum
    // internal size floor kicks in on small viewports) — blob radii must use
    // this so their size relative to the viewport never changes.
    let effScale = SCALE;

    const resize = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      W = canvas.width = Math.max(160, Math.round(vw * SCALE));
      H = canvas.height = Math.max(90, Math.round(vh * SCALE));
      effScale = (W / vw + H / vh) / 2;
    };
    resize();

    // Renders one frame of the aurora at timestamp `t` in internal (scaled)
    // coordinates. Does not schedule anything itself — safe to call once for
    // the reduced-motion static frame or repeatedly from the RAF loop below.
    const renderFrame = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      for (const b of BLOBS) {
        const x = W * b.sx + Math.sin(t * b.spx + b.ph) * W * 0.14;
        const y = H * b.sy + Math.cos(t * b.spy + b.ph) * H * 0.12;
        const r = b.r * effScale;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `hsla(${b.hue},${b.sat}%,60%,.14)`);
        g.addColorStop(1, `hsla(${b.hue},${b.sat}%,60%,0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
    };

    if (reducedMotion) {
      renderFrame(0);
      // No RAF loop is running to pick up the new size after a resize
      // resets the canvas bitmap — redraw the static frame explicitly.
      const onResize = () => {
        resize();
        renderFrame(0);
      };
      window.addEventListener("resize", onResize);
      return () => {
        window.removeEventListener("resize", onResize);
      };
    }

    window.addEventListener("resize", resize);

    let raf = 0;
    // 30fps cap: the drift speeds (~0.0002 rad/ms) are far too slow for 60fps
    // to be distinguishable, and every skipped frame also skips a re-blur of
    // all the backdrop-filter glass elements above this canvas.
    const FRAME_MS = 1000 / 30;
    let lastFrame = 0;
    const tick = (t: number) => {
      if (t - lastFrame >= FRAME_MS) {
        lastFrame = t;
        renderFrame(t);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
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
        // Own compositor layer: the low-res bitmap upscale happens on the GPU
        // and repaints don't invalidate the rest of the page.
        transform: "translateZ(0)",
      }}
      aria-hidden
    />
  );
}
