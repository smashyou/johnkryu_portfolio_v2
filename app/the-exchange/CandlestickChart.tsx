"use client";

import { useEffect, useRef } from "react";

type Candle = { label: string; o: number; c: number; l: number; h: number };

// Verbatim from the `drawChart()` method in the reference script (see
// design_handoff_portfolio_redesign/Concept 6 - The Exchange.dc.html,
// <script type="text/x-dc"> block) — 10 career candles, 2011 through the
// present, values are unitless "price" points used only to shape the chart.
const CANDLES: Candle[] = [
  { label: "Fatty Pocket '11", o: 10, c: 18, l: 7, h: 21 },
  { label: "Temple / NSF '15", o: 18, c: 30, l: 15, h: 33 },
  { label: "Graphite '15", o: 30, c: 36, l: 27, h: 39 },
  { label: "Parkgorithm '16", o: 36, c: 33, l: 28, h: 42 },
  { label: "Comcast '17", o: 33, c: 55, l: 31, h: 58 },
  { label: "Flex 1M+ '19", o: 55, c: 72, l: 52, h: 76 },
  { label: "X1 · 31M '21", o: 72, c: 80, l: 68, h: 84 },
  { label: "Roem '22", o: 80, c: 86, l: 74, h: 90 },
  { label: "AI pivot '24", o: 86, c: 95, l: 82, h: 98 },
  { label: "TecAce '25", o: 95, c: 108, l: 92, h: 112 },
];

const PAD = { l: 40, r: 16, t: 18, b: 34 };
const MAX_V = 118;
const MIN_V = 0;
const GREEN = "#2fd575";
const RED = "#e05252";
const AMBER = "#f5b942";
const GRID = "#141a26";
const AXIS = "#5d6880";

/**
 * Verbatim port of the candlestick chart script from
 * `design_handoff_portfolio_redesign/Concept 6 - The Exchange.dc.html`
 * (Component#drawChart / componentDidMount ref callback + componentWillUnmount
 * listener teardown implied by the class lifecycle): 10 career candles,
 * hover hit-test on mousemove highlights the candle body amber and draws its
 * label above the wick.
 *
 * The reference has no RAF/interval loop at all — it renders once on mount
 * and again only from mousemove/mouseleave. That on-demand model already
 * satisfies the "never animate under reduced motion" rule with no branching
 * needed; resize handling (not present in the reference) is added here so
 * the canvas stays crisp and correctly scaled across viewport changes,
 * re-rendering the current (or reset) hover state on-demand exactly the
 * same way.
 */
export default function CandlestickChart() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0;
    let H = 0;
    let cw = 0;
    let hover = -1;

    const y = (v: number) =>
      PAD.t + (H - PAD.t - PAD.b) * (1 - (v - MIN_V) / (MAX_V - MIN_V));

    const render = () => {
      ctx.clearRect(0, 0, W, H);

      ctx.strokeStyle = GRID;
      ctx.lineWidth = 1;
      for (let g = 0; g <= 4; g++) {
        const gy = PAD.t + ((H - PAD.t - PAD.b) * g) / 4;
        ctx.beginPath();
        ctx.moveTo(PAD.l, gy);
        ctx.lineTo(W - PAD.r, gy);
        ctx.stroke();
      }

      CANDLES.forEach((cd, i) => {
        const x = PAD.l + cw * i + cw / 2;
        const up = cd.c >= cd.o;
        const col = up ? GREEN : RED;
        ctx.strokeStyle = col;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, y(cd.h));
        ctx.lineTo(x, y(cd.l));
        ctx.stroke();

        ctx.fillStyle = hover === i ? AMBER : col;
        const bw = Math.min(26, cw * 0.5);
        ctx.fillRect(
          x - bw / 2,
          y(Math.max(cd.o, cd.c)),
          bw,
          Math.max(3, Math.abs(y(cd.o) - y(cd.c)))
        );

        if (hover === i) {
          ctx.font = "600 12px 'IBM Plex Mono', monospace";
          ctx.fillStyle = AMBER;
          ctx.textAlign = "center";
          ctx.fillText(cd.label, Math.max(70, Math.min(W - 70, x)), y(cd.h) - 10);
        }
      });

      ctx.font = "10px 'IBM Plex Mono', monospace";
      ctx.fillStyle = AXIS;
      ctx.textAlign = "center";
      ctx.fillText("2011", PAD.l + cw / 2, H - 12);
      ctx.fillText("2026", W - PAD.r - cw / 2, H - 12);
    };

    const resize = () => {
      const DPR = window.devicePixelRatio || 1;
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = W * DPR;
      canvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      cw = (W - PAD.l - PAD.r) / CANDLES.length;
      render();
    };
    resize();
    window.addEventListener("resize", resize);

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const i = Math.floor((e.clientX - rect.left - PAD.l) / cw);
      const next = i >= 0 && i < CANDLES.length ? i : -1;
      if (next !== hover) {
        hover = next;
        render();
      }
    };
    const onMouseLeave = () => {
      if (hover !== -1) {
        hover = -1;
        render();
      }
    };
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);

    return () => {
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "340px", display: "block" }}
      aria-hidden
    />
  );
}
