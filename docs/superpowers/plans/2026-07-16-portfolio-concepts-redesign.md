# Multi-Concept Portfolio Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the portfolio as a gateway at `/` offering 7 vote-able experiences (6 new concept routes ported pixel-perfectly from HTML references + the current site at `/classic`), each preserving Services, all 7 project galleries, the EmailJS contact form, and the dual resume system.

**Architecture:** Shared typed content in `app/data/content.ts` feeds classic components and all concept pages. Shared client components/hooks (`ProjectLightbox`, `useContactForm`, `useVotes`, `SwitchPill`, `usePrefersReducedMotion`) carry preserved behavior. Each concept is its own route folder; reference `<script type="text/x-dc">` logic ports into `useRef`/`useEffect` client components. Votes persist via Upstash Redis (`/api/votes`), silently falling back to localStorage.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, Tailwind (arbitrary values) + per-concept CSS modules, framer-motion (classic only), `@emailjs/browser`, react-hook-form, `@upstash/redis`, `sharp` (one-time script), `next/font/google`.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-16-portfolio-concepts-redesign-design.md`. Reference bundle: `design_handoff_portfolio_redesign/` (NEVER ship it; it stays gitignored).
- Pixel-perfect fidelity: copy, hex colors, spacing, font choices, and animation timings come verbatim from the reference `.dc.html` files. Do not "improve" copy or colors.
- Extract any reference's logic script with:
  `awk '/text\/x-dc/{flag=1;next} /<\/script>/{flag=0} flag' "design_handoff_portfolio_redesign/<file>.dc.html"`
  The reference markup is everything between `<x-dc>`'s `<helmet>` (CSS) and the script tag. `style-hover="..."` attributes = CSS `:hover` rules; `{expr}` = template bindings; `forEach=` = `.map()`.
- Routes: `/`, `/classic`, `/neural-field`, `/knowledge-graph`, `/operator-console`, `/aurora-glass`, `/the-machine`, `/the-exchange`. Vote ids `c1`–`c7` (c7 = Classic, accent `#7dd6f5`).
- Every concept page adds, styled in its own visual language: full Services content, all 7 projects opening `ProjectLightbox`, EmailJS contact form, Resume nav link + contact button opening `ResumeModal`, and a `SwitchPill` back to `/`.
- All external links `target="_blank" rel="noopener noreferrer"`.
- Every canvas/interval effect: cleanup on unmount (`cancelAnimationFrame`, remove listeners, `clearInterval`) and skip/pause when `usePrefersReducedMotion()` returns true.
- No test runner exists in this repo. Verification per task = `npx tsc --noEmit` (must be clean) + the task's listed manual/browser checks against `npm run dev` (port 3000). Use the `webapp-testing` skill (Playwright) or `compound-engineering:agent-browser` for screenshots.
- TypeScript strict: no `any` unless ported math genuinely needs a cast; prefer typed refs (`useRef<HTMLCanvasElement | null>(null)`).
- Commit after every task with the given message + `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

---

### Task 1: Gitignore bundle + shared content data layer

**Files:**
- Modify: `.gitignore`
- Create: `app/data/content.ts`
- Modify: `app/components/Portfolio.tsx` (import `projects`)
- Modify: `app/components/Services.tsx` (import `services`)

**Interfaces:**
- Produces (exact exports of `app/data/content.ts`):
```ts
export type Project = { id: number; title: string; subtitle: string; images: string[]; github?: string; demo: string; tags: string[] };
export type ServiceItem = { label: string; subitems: string[] };
export type ServiceCategory = { title: string; items: ServiceItem[] };
export type TimelineEntry = { period: string; title: string; org: string; desc: string };
export type SkillCategory = { title: string; skills: string[] };
export type ConceptId = "c1" | "c2" | "c3" | "c4" | "c5" | "c6" | "c7";
export type ConceptMeta = { id: ConceptId; slug: string; tag: string; accent: string; glow: string; title: string; desc: string; notes: string };
export const projects: Project[];
export const services: ServiceCategory[];
export const timeline: TimelineEntry[];
export const skills: SkillCategory[];
export const profile: { name: string; title: string; location: string; email: string; github: string; linkedin: string; mantras: [string, string] };
export const concepts: ConceptMeta[]; // 7 entries, c1–c7
```

- [ ] **Step 1: Ignore the design bundle.** Append to `.gitignore`:
```
# design references (never ship)
design_handoff_portfolio_redesign/
```
- [ ] **Step 2: Create `app/data/content.ts`** with the types above and:
  - `projects`: move the entire array literal from `app/components/Portfolio.tsx` lines 30–165 verbatim (all 7 projects, all image paths).
  - `services`: move the entire array literal from `app/components/Services.tsx` lines 17–144 verbatim (3 categories).
  - `timeline`: 7 entries transcribed from the Journey section of `design_handoff_portfolio_redesign/Concept 1 - Neural Field.dc.html` (find with `grep -n "Journey\|2011\|2015\|2016\|2017\|2022\|2025" <file>`) — period, title, org, desc copied verbatim.
  - `skills`: the 6 categories from Neural Field's Skills section (titles + pill chips verbatim).
  - `profile`: `{ name: "John K. Ryu", title: "AI Engineer · Full Stack · Entrepreneur", location: "Bellevue, WA", email: "johnminryu@gmail.com", github: "https://github.com/smashyou", linkedin: "https://linkedin.com/in/johnminryu", mantras: ["Make sure the choices you make are worth the losses you will take", "Be the energy you want to attract"] }`.
  - `concepts`: the 6 objects from the gateway script's `concepts` array (id, tag, accent, glow, title, desc, notes verbatim; replace `href` with `slug`: `"neural-field"`, `"knowledge-graph"`, `"operator-console"`, `"aurora-glass"`, `"the-machine"`, `"the-exchange"`), plus a 7th: `{ id: "c7", slug: "classic", tag: "07 · CLASSIC", accent: "#7dd6f5", glow: "rgba(125,214,245,.12)", title: "Classic", desc: "The original johnkryu.vercel.app experience — hero, services, full project galleries, and the résumé vault, exactly as shipped.", notes: "original · complete" }`.
- [ ] **Step 3: Refactor consumers.** In `Portfolio.tsx`: delete the local `Project` type + `projects` array, add `import { projects, type Project } from "@/app/data/content";`. In `Services.tsx`: delete local `services` array, add `import { services } from "@/app/data/content";`.
- [ ] **Step 4: Verify.** Run `npx tsc --noEmit` → clean. Run `npm run dev`, load `http://localhost:3000` → Services and Portfolio render identically (7 cards, galleries clickable).
- [ ] **Step 5: Commit** — `git add -A && git commit -m "Extract shared content data layer; ignore design bundle"`.

---

### Task 2: Shared components & hooks

**Files:**
- Create: `app/components/shared/ProjectLightbox.tsx`
- Create: `app/components/shared/useContactForm.ts`
- Create: `app/components/shared/SwitchPill.tsx`
- Create: `app/components/shared/usePrefersReducedMotion.ts`
- Modify: `app/components/Portfolio.tsx` (use `ProjectLightbox`)
- Modify: `app/components/Contact.tsx` (use `useContactForm`)

**Interfaces:**
- Produces:
```ts
// ProjectLightbox.tsx ("use client")
export default function ProjectLightbox(props: { project: Project | null; onClose: () => void }): JSX.Element;
// always mounted; AnimatePresence inside; renders nothing when project is null; manages its own index state; Escape/←/→ keys; body scroll lock; counter "n / total"

// useContactForm.ts
export function useContactForm(): {
  register: UseFormRegister<{ name: string; email: string; message: string }>;
  errors: FieldErrors<{ name: string; email: string; message: string }>;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>; // handleSubmit-wrapped
  isSubmitting: boolean;
  submitMessage: string; // "" | success | error text
};

// SwitchPill.tsx ("use client" not needed — it's a Link)
export default function SwitchPill(props: { accent: string; className?: string }): JSX.Element;
// renders <Link href="/">⇄ SWITCH</Link>, 1px border in `accent`, mono font, fixed styling via className passthrough

// usePrefersReducedMotion.ts ("use client")
export function usePrefersReducedMotion(): boolean; // matchMedia("(prefers-reduced-motion: reduce)"), listens for changes
```

- [ ] **Step 1: Create `ProjectLightbox.tsx`** by moving the lightbox JSX + `stepLightbox`/keyboard/scroll-lock logic out of `Portfolio.tsx` (lines 167–196 and 345–419) into the new component. Internal state: `const [index, setIndex] = useState(0)`. Keep framer-motion `AnimatePresence` inside the component (render `null` when closed is handled by parent conditional).
- [ ] **Step 2: Create `useContactForm.ts`** by moving `Contact.tsx` lines 24–72 (react-hook-form setup + EmailJS `onSubmit` with `templateParams { name, email, to_email: "johnminryu@gmail.com", message }`, env vars `NEXT_PUBLIC_EMAILJS_SERVICE_ID/TEMPLATE_ID/PUBLIC_KEY`, success/error copy verbatim) into the hook. Return the interface above (`onSubmit` = `handleSubmit(submitFn)`).
- [ ] **Step 3: Create `SwitchPill.tsx` and `usePrefersReducedMotion.ts`**:
```tsx
// SwitchPill.tsx
import Link from "next/link";
export default function SwitchPill({ accent, className = "" }: { accent: string; className?: string }) {
  return (
    <Link href="/" aria-label="Switch experience"
      className={`font-mono text-[12px] tracking-[.08em] px-[14px] py-[7px] rounded-full border transition-colors ${className}`}
      style={{ borderColor: accent, color: accent }}>
      ⇄ SWITCH
    </Link>
  );
}
```
```ts
// usePrefersReducedMotion.ts
"use client";
import { useEffect, useState } from "react";
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}
```
- [ ] **Step 4: Refactor `Portfolio.tsx`** — lightbox state becomes `useState<Project | null>(null)`; render `<ProjectLightbox project={lightboxProject} onClose={closeLightbox} />` (unconditional, with `closeLightbox = useCallback(() => setLightboxProject(null), [])`). Refactor `Contact.tsx` to consume `useContactForm` (identical rendered markup).
- [ ] **Step 5: Verify.** `npx tsc --noEmit` clean. In the browser: open a gallery on `/` (arrows, Escape, counter work), submit the contact form empty (validation errors appear).
- [ ] **Step 6: Commit** — `"Extract shared ProjectLightbox, useContactForm, SwitchPill, reduced-motion hook"`.

---

### Task 3: Move current site to /classic

**Files:**
- Create: `app/classic/page.tsx` (moved content of `app/page.tsx`)
- Modify: `app/page.tsx` (temporary re-export)
- Modify: `app/components/Nav.tsx` (add SwitchPill)

**Interfaces:**
- Produces: route `/classic` rendering the exact current single-page site + SWITCH control.

- [ ] **Step 1:** `git mv` semantics: copy current `app/page.tsx` content into `app/classic/page.tsx` unchanged. Replace `app/page.tsx` body with:
```tsx
export { default } from "./classic/page";
```
(`/` keeps working until Task 6 replaces it with the gateway.)
- [ ] **Step 2:** In `Nav.tsx`, add `<SwitchPill accent="#7dd6f5" className="ml-4" />` alongside the existing nav items (import from `@/app/components/shared/SwitchPill`).
- [ ] **Step 3: Verify.** `npx tsc --noEmit` clean; `/classic/` renders the full site; SWITCH pill navigates to `/`.
- [ ] **Step 4: Commit** — `"Move classic site to /classic with SWITCH control"`.

---

### Task 4: Votes API + useVotes hook

**Files:**
- Create: `app/api/votes/route.ts`
- Create: `app/components/shared/useVotes.ts`
- Modify: `package.json` (`npm i @upstash/redis`)

**Interfaces:**
- Produces:
```ts
// GET /api/votes → 200 { c1: number, ..., c7: number } | 503 { error: "not configured" }
// POST /api/votes { vote: ConceptId, unvote?: ConceptId | null } → same 200 shape | 400 | 503
export function useVotes(): {
  votes: Record<string, number>;
  votedFor: string | null;
  live: boolean;                      // true once API responded
  castVote: (id: ConceptId) => (e: React.MouseEvent) => void;
};
```

- [ ] **Step 1:** `npm i @upstash/redis`
- [ ] **Step 2: Create `app/api/votes/route.ts`:**
```ts
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const IDS = ["c1", "c2", "c3", "c4", "c5", "c6", "c7"] as const;
type Id = (typeof IDS)[number];

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

async function allVotes(redis: Redis) {
  const vals = await redis.mget<(number | null)[]>(...IDS.map((id) => `poll:${id}`));
  return Object.fromEntries(IDS.map((id, i) => [id, Number(vals[i]) || 0]));
}

export async function GET() {
  const redis = getRedis();
  if (!redis) return NextResponse.json({ error: "not configured" }, { status: 503 });
  return NextResponse.json(await allVotes(redis));
}

export async function POST(req: Request) {
  const redis = getRedis();
  if (!redis) return NextResponse.json({ error: "not configured" }, { status: 503 });
  let body: { vote?: string; unvote?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const vote = body.vote as Id;
  if (!IDS.includes(vote)) return NextResponse.json({ error: "bad id" }, { status: 400 });
  await redis.incr(`poll:${vote}`);
  const unvote = body.unvote as Id | null | undefined;
  if (unvote && IDS.includes(unvote)) {
    const n = await redis.decr(`poll:${unvote}`);
    if (n < 0) await redis.set(`poll:${unvote}`, 0);
  }
  return NextResponse.json(await allVotes(redis));
}
```
- [ ] **Step 3: Create `useVotes.ts`** — direct port of the gateway reference script's voting adapter (state init from `localStorage.getItem("jkr_poll_votes"|"jkr_poll_voted")` inside `useEffect` to stay SSR-safe; `fetchVotes` on mount; `castVote(id)` returns a click handler doing optimistic local update + localStorage write + fire-and-forget POST `{ vote: id, unvote: prev || null }`, adopting server counts when `r.ok`; all fetch errors swallowed silently).
- [ ] **Step 4: Verify.** `npx tsc --noEmit` clean. `curl -s localhost:3000/api/votes` → `{"error":"not configured"}` (503, no env vars locally — fallback path). If Upstash env vars are present in `.env.local`, expect zeroed counts instead.
- [ ] **Step 5: Commit** — `"Add votes API (Upstash Redis) and useVotes adapter with localStorage fallback"`.

---

### Task 5: Fonts module

**Files:**
- Create: `app/fonts.ts`
- Modify: `app/layout.tsx`

**Interfaces:**
- Produces: CSS variables usable in any route/CSS module: `--font-space-grotesk`, `--font-jetbrains-mono`, `--font-sora`, `--font-ibm-plex-mono`, `--font-instrument-serif`, `--font-outfit`, `--font-archivo`.

- [ ] **Step 1: Create `app/fonts.ts`** using `next/font/google`: `Space_Grotesk` (400–700), `JetBrains_Mono` (400,500), `Sora` (400–700), `IBM_Plex_Mono` (400,500), `Instrument_Serif` (400, styles normal+italic), `Outfit` (300–600), `Archivo` (400–800). Each with `subsets: ["latin"]`, `variable: "--font-<name>"`, `display: "swap"`. Export `fontVariables` = joined `.variable` classnames.
- [ ] **Step 2:** In `app/layout.tsx`, add `fontVariables` to the `<html>` (or `<body>`) className. (Font files only download on routes whose text actually uses the face.)
- [ ] **Step 3: Verify.** `npx tsc --noEmit`; view page source → `--font-*` variables present on html/body.
- [ ] **Step 4: Commit** — `"Add Google font variables for concept routes"`.

---

### Task 6: Gateway page at /

**Files:**
- Create: `app/components/gateway/StarfieldCanvas.tsx`
- Create: `app/components/gateway/GatewayPage.tsx`
- Modify: `app/page.tsx` (render gateway)
- Modify: `app/layout.tsx` (metadata title "Portfolio Concepts — John K. Ryu" if reference `<title>` differs — check reference)

**Interfaces:**
- Consumes: `concepts`, `profile` from content.ts; `useVotes`; font variables.
- Produces: `/` = gateway. `GatewayPage` is the default export client component.

- [ ] **Step 1: Port `StarfieldCanvas`** from the gateway script's `componentDidMount` (star count `Math.min(160, W*H/11000)`, radius `.3–1.6`, hues `[187,160,268][i%3]`, alpha `.12 + .3*(0.5+0.5*sin(t*.001*sp+ph))`, resize listener, rAF loop, full cleanup; skip loop when `usePrefersReducedMotion()` — draw one static frame instead):
```tsx
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
    window.addEventListener("resize", resize);
    const N = Math.min(160, Math.floor((W * H) / 11000));
    for (let i = 0; i < N; i++) stars.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.3 + 0.3, ph: Math.random() * Math.PI * 2, sp: 0.4 + Math.random() * 0.8, hue: [187, 160, 268][i % 3] });
    const draw = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      for (const s of stars) {
        const a = 0.12 + 0.3 * (0.5 + 0.5 * Math.sin(t * 0.001 * s.sp + s.ph));
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${s.hue},80%,70%,${a.toFixed(3)})`; ctx.fill();
      }
      if (!reduced) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, [reduced]);
  return <canvas ref={ref} className="fixed inset-0" aria-hidden />;
}
```
- [ ] **Step 2: Build `GatewayPage.tsx`** by transcribing the reference body markup (`Portfolio Concepts.dc.html` between `</helmet>` and the script tag) into JSX: `#05060c` page, Space Grotesk, portrait `public/images/profile/hero.png` with conic-gradient glow ring, headline "Choose your experience.", intro copy, then `concepts.map(...)` cards (top accent hairline, radial `glow` background, `tag`, `title`, `desc`, `notes`, vote button `▲ {votes[c.id] || 0}{votedFor===c.id ? " ✓" : ""}` styled per script's `voteColor`/`voteBorder` logic, "enter →" link → `/${c.slug}`), poll status line = script's `pollMsg` logic **with names map extended**: `c7: "Classic"`. Wire `useVotes`. Cards are `<Link>` wrappers; vote button stops propagation (already in ported handler).
- [ ] **Step 3:** Replace `app/page.tsx` with `import GatewayPage from "./components/gateway/GatewayPage"; export default function Page() { return <GatewayPage />; }`.
- [ ] **Step 4: Verify.** `npx tsc --noEmit` + `npm run build` clean. Browser: `/` shows starfield + 7 cards matching reference side-by-side (open the `.dc.html` file directly in a browser to compare); vote on a card → count increments with ✓, persists on reload (localStorage); vote on another card → moves; every card's "enter" navigates (concept routes 404 until later tasks — `/classic` works now); poll line reads correctly.
- [ ] **Step 5: Commit** — `"Add gateway page with starfield, 7 concept cards, and voting"`.

---

### Task 7: Compress teardown frames

**Files:**
- Create: `scripts/compress-frames.mjs`
- Create: `public/images/teardown/frame_001.jpg` … `frame_110.jpg` (generated)
- Modify: `package.json` (sharp devDependency + `"compress-frames"` script)

**Interfaces:**
- Produces: 110 JPEGs at `public/images/teardown/frame_NNN.jpg` (NNN = 001–110), 1600px wide, q70, flattened.

- [ ] **Step 1:** `npm i -D sharp`
- [ ] **Step 2: Create `scripts/compress-frames.mjs`:**
```js
import sharp from "sharp";
import { readdir, mkdir } from "node:fs/promises";
import path from "node:path";

const SRC = "design_handoff_portfolio_redesign/uploads/ai-brain-frames";
const OUT = "public/images/teardown";
// Flatten color = The Machine page background. Verify against the canvas bg
// constant in Concept 5's extracted script; default per spec:
const BG = "#c9ccce";

await mkdir(OUT, { recursive: true });
const files = (await readdir(SRC)).filter((f) => f.endsWith(".png")).sort();
let done = 0;
for (const f of files) {
  const out = path.join(OUT, f.replace(".png", ".jpg"));
  await sharp(path.join(SRC, f))
    .resize({ width: 1600, withoutEnlargement: true })
    .flatten({ background: BG })
    .jpeg({ quality: 70, mozjpeg: true })
    .toFile(out);
  if (++done % 20 === 0) console.log(`${done}/${files.length}`);
}
console.log(`done: ${done} frames → ${OUT}`);
```
Add `"compress-frames": "node scripts/compress-frames.mjs"` to package.json scripts. **Before running:** extract Concept 5's script and check its background fill color; if it differs from `#c9ccce`, update `BG`.
- [ ] **Step 3:** Run `npm run compress-frames`. Expected: `done: 110 frames`. Check `du -sh public/images/teardown` — target well under 30MB; if over, re-run at width 1280.
- [ ] **Step 4: Commit** — `"Add compressed teardown frame sequence + compression script"` (frames are committed; sharp stays devDependency).

---

### Task 8: Neural Field — /neural-field

**Files:**
- Create: `app/neural-field/page.tsx` (metadata + renders client page)
- Create: `app/neural-field/NeuralFieldPage.tsx`
- Create: `app/neural-field/ParticleField.tsx`
- Create: `app/neural-field/neural.module.css`

**Interfaces:**
- Consumes: `projects`, `services`, `skills`, `timeline`, `profile`, `ProjectLightbox`, `useContactForm`, `ResumeModal` (`app/components/ResumeModal.tsx`, prop `onClose: () => void`), `SwitchPill`, `usePrefersReducedMotion`, font vars.
- Produces: complete `/neural-field` route. **This task also establishes the canonical patterns reused by Tasks 9–13** — read this task before any of them:
  1. **Page shell pattern:** `page.tsx` is a server file exporting `metadata` (title from reference `<title>`/h1) and rendering the `"use client"` `<Concept>Page` component.
  2. **Canvas effect pattern:** each effect = its own client component, `useRef` canvas, all reference script math verbatim inside one `useEffect`, cleanup returns, reduced-motion = static single frame.
  3. **Added-sections pattern (identical composition on every concept, restyled):**
     - *Services:* full `services` data (3 categories, every item + subitem) rendered in concept-native card/row markup.
     - *Work:* `projects.map(...)` — all 7 — in the concept's work layout; clicking a card's image/screenshots control sets `lightboxProject`; render `<ProjectLightbox project={lightboxProject} onClose={closeLightbox} />` (always mounted, `closeLightbox` memoized with useCallback) at page root.
     - *Contact:* reference contact section markup kept (headline, copy, mailto button) + a form (`name`, `email`, `message` inputs + submit) wired to `useContactForm`, styled with the concept's borders/accent; render `submitMessage` below; disable submit while `isSubmitting`.
     - *Resume:* nav gets a `RESUME` item and contact section a resume button, both `onClick={() => setResumeOpen(true)}`; `{resumeOpen && <ResumeModal onClose={() => setResumeOpen(false)} />}` at page root.
     - *Switch:* `<SwitchPill accent={<concept accent>} />` in the fixed nav.

- [ ] **Step 1:** Extract the reference script (`awk` command, Global Constraints) and read the full body markup of `Concept 1 - Neural Field.dc.html`.
- [ ] **Step 2: Create `ParticleField.tsx`** porting the particle script verbatim: ~110 particles, connect lines at distance <130px, mouse repel radius <140px, cyan `#22d3ee` on `#05070f`; fixed full-viewport canvas behind content (`position:fixed; inset:0; z-index:0`); mousemove listener on window; cleanup + reduced-motion static frame.
- [ ] **Step 3: Create `neural.module.css`** for the reference `<helmet>` CSS that isn't inline (body colors, keyframes, `:hover` rules from `style-hover` attributes, typing caret blink).
- [ ] **Step 4: Create `NeuralFieldPage.tsx`:** transcribe hero (typing loop: 4 phrases from reference, 55ms type / 26ms delete, 2s hold — `useEffect` with timeouts, cleanup), About (photo `about.jpg` + 4 stat cards + mantra quote), Skills (6 categories from `skills`), **Services (added)**, Journey (7 `timeline` entries, vertical line + dots), Work (reference wide-row style × all 7 `projects`), Contact (reference + form + resume button). Top nav (reference items + RESUME + SwitchPill).
- [ ] **Step 5: Create `page.tsx`** (metadata: title from reference).
- [ ] **Step 6: Verify.** `npx tsc --noEmit` clean. Browser vs. reference file side-by-side: hero typing timing, particle repel, colors/spacing; all 7 projects present; lightbox opens with full gallery; Services shows every subitem; contact form validates + shows status; ResumeModal opens from nav and contact; SWITCH returns to `/`; external links open new tabs.
- [ ] **Step 7: Commit** — `"Add Neural Field concept route"`.

---

### Task 9: Knowledge Graph — /knowledge-graph

**Files:**
- Create: `app/knowledge-graph/page.tsx`, `KnowledgeGraphPage.tsx`, `GraphCanvas.tsx`, `graph.module.css`

**Interfaces:** Consumes Task 8's canonical patterns (page shell, canvas effect, added-sections). Produces complete `/knowledge-graph` route.

- [ ] **Step 1:** Extract script + markup from `Concept 2 - Knowledge Graph.dc.html`.
- [ ] **Step 2: `GraphCanvas.tsx`:** port 3D graph verbatim — core node "JOHN K. RYU", 6 group nodes, ~30 leaves on spherical coordinates; auto-rotate 0.0032 rad/frame; pointer drag rotates (clamp `rotX` ±1.2); hover enlarges node + label; projection `500/(500+z)`; mint `#8ef7cd` / violet `#a78bfa` on `#07060e`. Pointer listeners (`pointerdown/move/up`) with cleanup; reduced motion → no auto-rotate (drag still works).
- [ ] **Step 3: Page:** Universe (story + portrait card with spinning dashed ring + full-width `hiking.jpg` strip), Path (7 timeline entries, alternating dot colors), **Services (added, glass-card style of this concept)**, Work (reference card style × all 7 projects + lightbox), Contact (+ form + resume). Fixed right dot-nav (anchor links incl. new Services section). Nav/SwitchPill per pattern.
- [ ] **Step 4: Verify** (same checklist as Task 8 Step 6, this concept's visuals). `npx tsc --noEmit` clean.
- [ ] **Step 5: Commit** — `"Add Knowledge Graph concept route"`.

---

### Task 10: Operator Console — /operator-console

**Files:**
- Create: `app/operator-console/page.tsx`, `OperatorConsolePage.tsx`, `BootSequence.tsx`, `console.module.css`

**Interfaces:** Consumes Task 8 patterns. Produces complete `/operator-console` route.

- [ ] **Step 1:** Extract script + markup from `Concept 3 - Operator Console.dc.html`.
- [ ] **Step 2: `console.module.css`:** CRT overlays as reference — repeating scanlines, drifting scan band (7s keyframe), vignette, 9s flicker keyframe. All overlays `pointer-events:none`. Reduced motion: animation `none` via `@media (prefers-reduced-motion: reduce)`.
- [ ] **Step 3: `BootSequence.tsx`:** 7 log lines typed at 230ms/line (exact strings from reference), then reveals children (hero). `useEffect` interval + cleanup; reduced motion → render all lines immediately.
- [ ] **Step 4: Page:** status bar (RYU.OS v3.0, nav + RESUME + SwitchPill, ● ONLINE), Profile (readme card + Operator ID card with green-filtered portrait + field-log strip), Commit history (`git log --career`, 7 entries, amber hashes), Loaded modules (11 progress bars animating on scroll into view, 120ms stagger), **Services (added — render as `$ services --list` mono tree: category headers + `+` items + `-` subitems, all verbatim)**, Deploys (all 7 projects as deploy rows: `▲ vercel deploy` style, name, tags, LIVE link + `screenshots [n]` button → lightbox), Uplink (contact + form styled as terminal prompt + resume button).
- [ ] **Step 5: Verify** (Task 8 checklist; boot plays once, scanlines animate). `npx tsc --noEmit` clean.
- [ ] **Step 6: Commit** — `"Add Operator Console concept route"`.

---

### Task 11: Aurora Glass — /aurora-glass

**Files:**
- Create: `app/aurora-glass/page.tsx`, `AuroraGlassPage.tsx`, `AuroraCanvas.tsx`, `aurora.module.css`

**Interfaces:** Consumes Task 8 patterns. Produces complete `/aurora-glass` route.

- [ ] **Step 1:** Extract script + markup from `Concept 4 - Aurora Glass.dc.html`.
- [ ] **Step 2: `AuroraCanvas.tsx`:** 4 radial-gradient blobs, `globalCompositeOperation = "lighter"`, sine drift per reference constants, on `#060310`. Cleanup + reduced-motion static frame.
- [ ] **Step 3: Page:** floating glass pill nav (blur 18px; + RESUME + SwitchPill), circular portrait with conic glow, reveal-on-scroll via `IntersectionObserver` (`[data-reveal]`, threshold .12, translateY 36→0 — one `useEffect` observing all nodes, disconnect on unmount), Story (serif headline + italic mantra + floating photo), Craft (3 numbered glass cards I/II/III), **Services (added — glass cards matching Craft styling, numbered IV/V/VI or reference-consistent variant, full content)**, Journey (7 glass rows), Work (reference cards × all 7 + lightbox), Contact ("Be the energy you want to attract." + form + resume). Fonts: Instrument Serif + Outfit via vars.
- [ ] **Step 4: Verify** (Task 8 checklist; reveals fire once per section). `npx tsc --noEmit` clean.
- [ ] **Step 5: Commit** — `"Add Aurora Glass concept route"`.

---

### Task 12: The Machine — /the-machine

**Files:**
- Create: `app/the-machine/page.tsx`, `TheMachinePage.tsx`, `TeardownScrubber.tsx`, `machine.module.css`

**Interfaces:** Consumes Task 8 patterns + `public/images/teardown/frame_NNN.jpg` (Task 7). Produces complete `/the-machine` route.

- [ ] **Step 1:** Extract script + markup from `Concept 5 - The Machine.dc.html`.
- [ ] **Step 2: `TeardownScrubber.tsx`:** fixed full-viewport canvas + "TEARDOWN: N%" badge. Port scrub math with **N = 110** (`const FRAME_COUNT = 110`; frame paths `/images/teardown/frame_${String(i + 1).padStart(3, "0")}.jpg`):
  - explode factor `f` over page scroll fraction `s`: `f = 0` for `s < .08`; `easeInOutQuad((s - .08) / .47)` clamped to 1 by `s = .55`; eases back to 0 by `s = .88` (exact piecewise from reference script).
  - frame index `Math.round(f * (FRAME_COUNT - 1))`.
  - progressive loading: every 8th frame first, then fill remaining at 6 concurrent; keep `loaded: (HTMLImageElement | undefined)[]`; draw nearest loaded frame (search outward from target index); paint bg color once before first frame so canvas is never blank.
  - draw: fit ≤1.2× native width, centered; `ctx.imageSmoothingQuality = "high"`; `ctx.filter = "contrast(1.04) saturate(1.05)"`.
  - scroll listener (passive) + resize + cleanup. Reduced motion: render frame 0 statically, badge hidden.
- [ ] **Step 3: Page:** light theme `#c9ccce` / ink `#191b1c` / amber `#9a6200`; 5 frosted-glass chapter cards (`rgba(249,248,246,.82)`, blur 10px) alternating left/right over 120vh sections (Cranial Dome/2025 AI Engineer, Neural Core/Comcast, Memory Banks/3 ventures, Sensory Arrays/Temple NSF, Reassembly) + finale + contact card (+ form + resume). **Services (added — frosted card set in same glass style, full content)** and **Work (added — all 7 projects as frosted cards + lightbox)** placed between Reassembly and finale (or per reference flow if it has a work area). Nav + RESUME + SwitchPill per pattern (ink-on-light styling).
- [ ] **Step 4: Verify.** `npx tsc --noEmit` + `npm run build` clean (frames in bundle OK). Browser: scroll drives teardown smoothly 0→100→0; badge tracks; no blank canvas during fast scroll; chapters alternate; galleries/form/resume work.
- [ ] **Step 5: Commit** — `"Add The Machine scroll-scrub teardown route"`.

---

### Task 13: The Exchange — /the-exchange

**Files:**
- Create: `app/the-exchange/page.tsx`, `TheExchangePage.tsx`, `CandlestickChart.tsx`, `exchange.module.css`

**Interfaces:** Consumes Task 8 patterns. Produces complete `/the-exchange` route.

- [ ] **Step 1:** Extract script + markup from `Concept 6 - The Exchange.dc.html`.
- [ ] **Step 2: `exchange.module.css`:** ticker tape keyframes — duplicated list, 40s linear infinite; pause via reduced-motion media query. Amber `#f5b942` / green `#2fd575` / red `#e05252` on `#080b11`; Archivo + IBM Plex Mono vars.
- [ ] **Step 3: `CandlestickChart.tsx`:** canvas candlestick chart, 10 career candles 2011–2026 (exact OHLC-style data + labels from reference script), hover highlights candle + shows label (mousemove hit test), colors per reference. Cleanup on unmount.
- [ ] **Step 4: Page:** fixed ticker tape, stock-card hero (portrait + 3-stat footer 31M / 10× / 3), Thesis (α/β/γ cards), Price history (chart), Holdings (skills table: sector/positions/allocation bar/trend — from `skills`), **Services (added — "Desk Services" table section in same table styling, full content)**, Deals (all 7 projects as deal cards w/ $TICKER badges — invent tickers only for the 2 presentation projects following reference naming style, e.g. `$RCTJS`, `$K8S` — plus lightbox), Invest (contact + form + resume + disclaimer footer verbatim). Nav + RESUME + SwitchPill.
- [ ] **Step 5: Verify** (Task 8 checklist; ticker loops seamlessly; candle hover labels). `npx tsc --noEmit` clean.
- [ ] **Step 6: Commit** — `"Add The Exchange concept route"`.

---

### Task 14: Final audit, docs, and full verification

**Files:**
- Modify: `CLAUDE.md` (architecture section: new routes, data layer, votes API, teardown frames)
- Modify: any files failing the audit below

- [ ] **Step 1: Reduced-motion audit.** With macOS "Reduce Motion" on (or Playwright `reducedMotion: "reduce"`), visit all 8 routes: no running rAF loops (static frames OK), CSS animations paused, boot sequence instant.
- [ ] **Step 2: Full functional pass** (use webapp-testing/Playwright): for each of the 8 routes — renders without console errors; lightbox on a multi-image project (arrows + Escape); Services subitems present (spot-check "Shopify store setup" and "A/B testing of ad creatives" strings on every concept); contact form validation + (once, on one route) real submit; ResumeModal opens, wrong password → error, PDF public view works; SWITCH → `/`; vote flow on `/`.
- [ ] **Step 3: Build + lint.** `npm run build` and `npm run lint` clean. `npx tsc --noEmit` clean.
- [ ] **Step 4: Update `CLAUDE.md`:** document the route map, `app/data/content.ts` as content source of truth, shared components dir, `/api/votes` + Upstash env vars (`UPSTASH_REDIS_REST_URL/TOKEN` or `KV_REST_API_URL/TOKEN`), frames pipeline (`npm run compress-frames`), and that `design_handoff_portfolio_redesign/` is reference-only and gitignored.
- [ ] **Step 5: Commit** — `"Finalize multi-concept redesign: docs, reduced-motion, verification"`.
- [ ] **Step 6: Deployment note for the user** (do not do it for them): create Upstash Redis via Vercel Marketplace and link the project so `/api/votes` goes live; voting works via localStorage until then.
