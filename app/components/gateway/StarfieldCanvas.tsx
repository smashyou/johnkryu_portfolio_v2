"use client";
import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/app/components/shared/usePrefersReducedMotion";

export default function StarfieldCanvas() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let W = 0, H = 0, raf = 0;
    type Star = { x: number; y: number; r: number; ph: number; sp: number; hue: number };
    let stars: Star[] = [];
    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    resize();
    const N = Math.min(160, Math.floor((W * H) / 11000));
    for (let i = 0; i < N; i++) stars.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.3 + 0.3, ph: Math.random() * Math.PI * 2, sp: 0.4 + Math.random() * 0.8, hue: [187, 160, 268][i % 3] });
    // 30fps cap — star positions are static and the twinkle is an
    // absolute-time sine, so a lower tick rate is visually identical and
    // halves the repaint work.
    const FRAME_MS = 1000 / 30;
    let lastFrame = 0;
    const draw = (t: number) => {
      if (t - lastFrame >= FRAME_MS || reduced) {
        lastFrame = t;
        ctx.clearRect(0, 0, W, H);
        for (const s of stars) {
          const a = 0.12 + 0.3 * (0.5 + 0.5 * Math.sin(t * 0.001 * s.sp + s.ph));
          ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${s.hue},80%,70%,${a.toFixed(3)})`; ctx.fill();
        }
      }
      if (!reduced) raf = requestAnimationFrame(draw);
    };
    // Resizing resets the canvas bitmap (clearing it). The animated path
    // picks the new size up on its next RAF frame automatically, but the
    // reduced-motion path has no running loop, so redraw the static frame
    // explicitly here.
    const onResize = () => {
      resize();
      if (reduced) draw(performance.now());
    };
    window.addEventListener("resize", onResize);
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, [reduced]);
  return <canvas ref={ref} className="fixed inset-0" aria-hidden />;
}
