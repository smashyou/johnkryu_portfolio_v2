"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/app/components/shared/usePrefersReducedMotion";
import styles from "./machine.module.css";

// Frames prepared for this route (Task 7): public/images/teardown/frame_001.jpg
// … frame_110.jpg, 1280×720 JPEG. The reference script
// (design_handoff_portfolio_redesign/Concept 5 - The Machine.dc.html,
// componentDidMount) assumed 240 frames named uploads/.../ezgif-frame-NNN.jpg;
// adapted here to the actual asset count/path while porting the rest of the
// scrub engine verbatim (easing, thresholds, loading strategy, draw settings).
const FRAME_COUNT = 110;
// Matched to the frames' own studio-backdrop edge tone (sampled ~#a8abaf–#b0b4b7,
// shifted slightly by the contrast(1.04) draw filter) so the sequence blends
// into the page instead of reading as a rectangle.
const BG = "#aeb1b5";
const framePath = (i: number) =>
  `/images/teardown/frame_${String(i + 1).padStart(3, "0")}.jpg`;

// Verbatim from the reference script's `ease` helper.
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export default function TeardownScrubber() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pctRef = useRef<HTMLSpanElement | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const N = FRAME_COUNT;
    const frames: (HTMLImageElement | undefined)[] = new Array(N);
    const loaded: boolean[] = new Array(N).fill(false);

    let W = 0;
    let H = 0;
    let dirty = true;
    let lastDrawn = -1;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * DPR;
      canvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      dirty = true;
    };
    resize();

    // Paint the bg once before any frame is available so the canvas is never
    // blank while frames stream in.
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);

    // Draw settings ported verbatim from the reference script's draw(): fit
    // the frame to the viewport, cap at 1.2x native width, center it, high
    // quality smoothing, contrast/saturation bump.
    const draw = (idx: number) => {
      const img = frames[idx];
      if (!img || !img.naturalWidth) return;
      const ir = img.naturalWidth / img.naturalHeight;
      const cr = W / H;
      let dw: number;
      let dh: number;
      if (cr > ir) {
        dw = W;
        dh = W / ir;
      } else {
        dh = H;
        dw = H * ir;
      }
      const maxW = img.naturalWidth * 1.2;
      if (dw > maxW) {
        dh *= maxW / dw;
        dw = maxW;
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);
      ctx.filter = "contrast(1.04) saturate(1.05)";
      const dx = (W - dw) / 2;
      const dy = (H - dh) / 2;
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.filter = "none";
      featherEdges(dx, dy, dw, dh);
      lastDrawn = idx;
      dirty = false;
    };

    // Fade the drawn frame's borders into the page background so the image
    // never reads as a hard rectangle over the backdrop.
    const featherEdges = (dx: number, dy: number, dw: number, dh: number) => {
      const f = Math.max(24, Math.min(dw, dh) * 0.1);
      const sides: [number, number, number, number, number, number, number, number][] = [
        // [gx0, gy0, gx1, gy1, rx, ry, rw, rh]
        [dx, 0, dx + f, 0, dx, dy, f, dh], // left
        [dx + dw, 0, dx + dw - f, 0, dx + dw - f, dy, f, dh], // right
        [0, dy, 0, dy + f, dx, dy, dw, f], // top
        [0, dy + dh, 0, dy + dh - f, dx, dy + dh - f, dw, f], // bottom
      ];
      for (const [gx0, gy0, gx1, gy1, rx, ry, rw, rh] of sides) {
        const g = ctx.createLinearGradient(gx0, gy0, gx1, gy1);
        g.addColorStop(0, BG);
        g.addColorStop(1, "rgba(174, 177, 181, 0)");
        ctx.fillStyle = g;
        ctx.fillRect(rx, ry, rw, rh);
      }
    };

    // Nearest-loaded search ported verbatim from the reference script.
    const nearestLoaded = (idx: number): number => {
      if (loaded[idx]) return idx;
      for (let d = 1; d < N; d++) {
        if (idx - d >= 0 && loaded[idx - d]) return idx - d;
        if (idx + d < N && loaded[idx + d]) return idx + d;
      }
      return -1;
    };

    if (reducedMotion) {
      // Static: load and draw the assembled frame (index 0) once, no scroll
      // listener, no progressive loading of the rest of the sequence.
      const img = new Image();
      img.onload = () => {
        loaded[0] = true;
        draw(0);
      };
      img.src = framePath(0);
      frames[0] = img;

      const onResize = () => {
        resize();
        if (loaded[0]) draw(0);
      };
      window.addEventListener("resize", onResize);
      return () => {
        window.removeEventListener("resize", onResize);
      };
    }

    // Explode-factor + frame-index math + chapter-independent scrub, ported
    // verbatim from the reference script's tick(), driven by a passive scroll
    // listener instead of a requestAnimationFrame loop (no RAF/interval loops
    // run on this route).
    const updateFromScroll = () => {
      const doc = document.documentElement;
      const total = doc.scrollHeight - window.innerHeight;
      const s = total > 0 ? window.scrollY / total : 0;
      let f: number;
      if (s < 0.08) f = 0;
      else if (s < 0.55) f = ease((s - 0.08) / 0.47);
      else if (s < 0.88) f = 1 - ease((s - 0.55) / 0.33);
      else f = 0;
      const pct = Math.round(f * 100);
      if (pctRef.current) pctRef.current.textContent = `${pct}%`;
      const target = Math.round(f * (N - 1));
      const idx = nearestLoaded(target);
      if (idx >= 0 && (idx !== lastDrawn || dirty)) draw(idx);
    };

    // Progressive loading: every 8th frame first (coarse pass), then halve
    // the stride until every frame is queued, all under a 6-concurrent cap —
    // ported verbatim from the reference script's order-building loop + kick().
    const seen = new Set<number>();
    const order: number[] = [];
    for (let stride = 8; stride >= 1; stride = Math.floor(stride / 2)) {
      for (let i = 0; i < N; i += stride) {
        if (!seen.has(i)) {
          seen.add(i);
          order.push(i);
        }
      }
      if (stride === 1) break;
    }

    let qi = 0;
    let inFlight = 0;
    let cancelled = false;
    const kick = () => {
      while (!cancelled && inFlight < 6 && qi < order.length) {
        const idx = order[qi++];
        const img = new Image();
        inFlight++;
        img.onload = () => {
          if (cancelled) return;
          loaded[idx] = true;
          inFlight--;
          dirty = true;
          updateFromScroll();
          kick();
        };
        img.onerror = () => {
          inFlight--;
          kick();
        };
        img.src = framePath(idx);
        frames[idx] = img;
      }
    };
    kick();

    const onResize = () => {
      resize();
      updateFromScroll();
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", updateFromScroll, { passive: true });
    updateFromScroll();

    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", updateFromScroll);
    };
  }, [reducedMotion]);

  return (
    <div className={styles.stage} aria-hidden>
      <canvas ref={canvasRef} className={styles.stageCanvas} />
      <div className={styles.stageVignette} />
      <div className={styles.badge}>
        TEARDOWN: <span ref={pctRef} className={styles.badgeValue}>0%</span>
      </div>
    </div>
  );
}
