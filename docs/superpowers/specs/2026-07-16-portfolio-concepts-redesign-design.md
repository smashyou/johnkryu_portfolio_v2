# Portfolio "Choose Your Experience" Redesign — Design Spec

**Date:** 2026-07-16
**Status:** Approved (Approach A — shared data layer + per-concept routes)
**Reference bundle:** `design_handoff_portfolio_redesign/` (7 `.dc.html` design references, `VOTING_HANDOFF.md`, `README.md`, `uploads/ai-brain-frames/` — 110 PNG frames, 96MB)

## Goal

Rebuild johnkryu.vercel.app as a multi-experience portfolio: a gateway page at `/`
where visitors choose between 7 portfolio experiences (6 new concepts from the
design references + the current site as "Classic"), vote for their favorite, and
switch freely. Recreate the 6 concepts pixel-perfectly from the reference HTML
while preserving all existing functionality: Services content, dual resume
system, full project screenshot galleries, and the EmailJS contact form.

## Decisions (user-confirmed)

1. **Current site survives as a 7th concept.** It moves unchanged to `/classic`
   and appears as a 7th card on the gateway (vote id `c7`, accent `#7dd6f5` —
   the gateway's "brand home" hue). The 6 new concepts each also get the
   preserved features, restyled per concept.
2. **All 7 projects on every concept page**, each opening the full screenshot
   lightbox (galleries up to 16 images).
3. **Resume access on every concept**: "Resume" link in each concept's nav AND
   a button in its contact section, both opening the existing
   ResumeModal → PasswordModal → `POST /api/resume` flow. Modals keep their
   current visual design on all routes (they are overlays, not part of the
   concept canvas).
4. **Services section with all details** (3 categories, every item and subitem
   verbatim from `app/components/Services.tsx`) added to each of the 6 concept
   pages, styled in that concept's visual language.
5. **Every contact section uses the EmailJS API** (same service/template/public
   key env vars as today). Reference contact headline/copy and mailto link are
   kept; the working form is added beneath.

## Routes

| Route | Source reference | Notes |
|---|---|---|
| `/` | `Portfolio Concepts.dc.html` | Gateway: starfield canvas (160 stars, hues 187/160/268), portrait w/ conic glow ring, "Choose your experience.", 7 concept cards (2-col grid), voting poll. Card accents: c1 `#22d3ee`, c2 `#8ef7cd`, c3 `#00ff9c`, c4 `#c9a6ff`, c5 `#ffb454`, c6 `#f5b942`, c7 `#7dd6f5`. Classic card follows the reference card anatomy (top hairline, radial glow, tag, title, desc, vote button `▲ N`, "enter →"). |
| `/classic` | current `app/page.tsx` | Moved as-is (Nav/Header/About/Experience/Services/Portfolio/Contact/Footer) + "⇄ SWITCH" pill → `/`. |
| `/neural-field` | Concept 1 | Cyan `#22d3ee` on `#05070f`. Particle network canvas (~110 particles, links <130px, mouse repel <140px), typing-loop hero (4 phrases, 55ms/26ms, 2s hold), About + stats, Skills (6 categories), Journey timeline (7 entries), Work, Contact. |
| `/knowledge-graph` | Concept 2 | Mint `#8ef7cd` + violet `#a78bfa` on `#07060e`. Canvas 3D graph (core + 6 groups + ~30 leaves, spherical coords, auto-rotate 0.0032 rad/frame, drag w/ rotX clamp ±1.2, hover labels, perspective 500/(500+z)), Universe, Path timeline, Work, Contact, fixed right dot-nav. |
| `/operator-console` | Concept 3 | Green `#00ff9c` on `#020604`, all JetBrains Mono. CRT scanlines + drifting band (7s) + vignette + 9s flicker, boot sequence (7 log lines @230ms) → hero, status bar, Profile (readme + Operator ID cards), Commit history (7 entries), Loaded modules (11 progress bars, 120ms stagger), Deploys, Uplink (contact). |
| `/aurora-glass` | Concept 4 | Instrument Serif + Outfit on `#060310`, gradient `#9ae8ff→#c9a6ff→#ff9ad5`. Aurora canvas (4 radial blobs, `lighter` composite, sine drift), floating glass pill nav (blur 18px), IntersectionObserver reveals (threshold .12, translateY 36→0), Story, Craft (I/II/III glass cards), Journey, Work, Contact. |
| `/the-machine` | Concept 5 | Light `#c9ccce`, ink `#191b1c`, amber `#9a6200`. Scroll-driven frame-scrub teardown (see Frames below), "TEARDOWN: N%" badge, 5 frosted-glass story chapters alternating over 120vh sections + finale + contact card. |
| `/the-exchange` | Concept 6 | Amber `#f5b942` / green `#2fd575` / red `#e05252` on `#080b11`, Archivo + IBM Plex Mono. Ticker tape (duplicated list, 40s loop), stock-card hero, Thesis (α/β/γ), candlestick canvas (10 career candles 2011–2026, hover labels), Holdings table, Deals, Invest (contact + disclaimer). |

Every concept page has a "⇄ SWITCH" control returning to `/`. All external
project links open in `_blank`.

### Per-concept additions (beyond the references)

Each of the 6 concept pages adds, in its own visual language:
- **Services** section (full content) — placed between the skills/work areas
  where each layout naturally allows (e.g. Operator Console renders it as
  `services --list` mono output; Exchange as a "Products & Services" desk
  sheet; Aurora as glass cards). Content verbatim; only presentation varies.
- **All 7 projects** in the concept's work-section card/row style. Projects
  beyond the reference's curated set reuse the same row/card markup. Each
  project opens the shared lightbox (all screenshots, keyboard nav).
- **EmailJS contact form** in the contact section.
- **Resume** nav link + contact-section button → shared modal flow.

## Architecture

### Shared data layer — `app/data/content.ts`

Single source of truth exported as typed constants:
- `projects` (7 entries: title, subtitle, images[], demo, github?, tags — moved
  from `Portfolio.tsx`)
- `services` (3 categories — moved from `Services.tsx`)
- `timeline` (7 career entries per README content source)
- `skills` (6 categories, as in Neural Field skills section)
- `profile` (name, title, location, email, socials, mantras)
- `concepts` (id `c1`–`c7`, slug, name, tag, description, accent — drives
  gateway cards and vote ids)

`Portfolio.tsx` and `Services.tsx` (classic) are refactored to import from this
module — content stated once, rendered 7 ways.

### Shared components/hooks — `app/components/shared/`

- `ProjectLightbox.tsx` — extracted from `Portfolio.tsx` (fullscreen viewer,
  arrow/Escape keys, counter). Used by classic Portfolio and all 6 concepts.
- `useContactForm.ts` — EmailJS submit logic extracted from `Contact.tsx`
  (react-hook-form + `@emailjs/browser`, loading/success/error state). Each
  concept styles its own form markup around the hook.
- `ResumeModal.tsx` / `PasswordModal.tsx` — existing components reused as-is.
- `useVotes.ts` — poll adapter: `GET/POST /api/votes`, optimistic update,
  silent localStorage fallback (`jkr_poll_votes`, `jkr_poll_voted`), one vote
  per visitor, changeable (POST `{vote, unvote}`).
- `usePrefersReducedMotion.ts` — pauses particle/aurora/scanline/ticker loops
  (enhancement required by handoff README).
- `SwitchPill.tsx` — the "⇄ SWITCH" → `/` control (styled via props).

### Concept pages

Each concept: `app/<slug>/page.tsx` (+ colocated client components under
`app/<slug>/components/` where a page has multiple canvases/effects). Animation
logic ported verbatim from the reference `<script>` sections into
`useRef`/`useEffect` with proper cleanup (cancelAnimationFrame, listener
removal) on unmount.

### Styling

- Tailwind with arbitrary values for exact hex/spacing (repo pattern).
- One CSS module per concept for keyframes, scanline/vignette pseudo-elements,
  and other non-utility CSS.
- Fonts via `next/font/google` (Space Grotesk, JetBrains Mono, Sora, IBM Plex
  Mono, Instrument Serif, Outfit, Archivo) — declared centrally, applied
  per-route so each concept only uses its own faces. No shared global palette
  by design; each route is its own world.

## Voting API

`VOTING_HANDOFF.md` recommends Vercel KV — **no longer offered by Vercel**.
Substitute: **Upstash Redis via Vercel Marketplace** (free tier), `@upstash/redis`
client, same REST env-var pattern (`UPSTASH_REDIS_REST_URL`/`_TOKEN` or the
KV-compatible names the integration injects — route reads whichever is present).

`app/api/votes/route.ts`:
- `GET` → `{ c1: n, …, c7: n }`
- `POST { vote, unvote }` → validates ids against `c1`–`c7`, `INCR`/`DECR`
  (floor 0), returns all counts
- Missing env vars or Redis failure → 5xx JSON; the frontend adapter silently
  falls back to localStorage (already designed in the reference JS — port
  as-is into `useVotes`).
- One-vote-per-visitor enforced client-side (per handoff: sufficient for a
  portfolio poll).

Existing `POST /api/resume` is untouched.

## The Machine — frames

Reality check vs. README: the bundle contains **110 frames** named
`frame_001.png`…`frame_110.png` (not 240 / `frame-NNN.png`). Adaptations:
- Frame index = `Math.round(f * (N - 1))` with `N = 110` (constant in one place).
- Explode factor over scroll `s`: `f = 0` for `s < .08`; ease `((s−.08)/.47)`
  to 1 at `.55`; back to 0 by `.88` (easeInOutQuad) — per reference.
- **Pre-commit compressed copies** (not build-time): one-time script
  `scripts/compress-frames.mjs` using `sharp` (devDependency) — resize to
  1600px wide, JPEG q70 → `public/images/teardown/frame_001.jpg`… Committed to
  the repo; raw `uploads/` never ships. Expected ~15–25MB total.
- Progressive loading: every 8th frame first, then fill at 6 concurrent; draw
  nearest-loaded frame; background painted once so canvas is never cleared
  empty. Draw: fit ≤1.2× native width, `imageSmoothingQuality: "high"`,
  `filter: contrast(1.04) saturate(1.05)`. "TEARDOWN: N%" fixed badge.

## Content source of truth

Resume-verified content from the handoff README (title, TecAce, Roem Ventures,
Comcast, Parkgorithm, Graphite GTC, Temple/NSF, Fatty Pocket, CCA-F cert,
mantras) + existing repo content for projects/services. Copy, colors, and
fonts exactly as in the references for the reference sections. Public email
shown on concept pages follows the references (`johnminryu@gmail.com`).

## Assets

- `public/images/profile/hero.png`, `hiking.jpg`, `about.jpg` (existing)
- `public/images/projects/*` (existing, from repo)
- `public/images/teardown/*.jpg` (new, compressed)
- Old chip sequence / MP4 — do not ship. The `design_handoff_portfolio_redesign/`
  folder stays untracked/ignored (reference only, 96MB).

## Error handling

- Votes API unreachable/unconfigured → silent localStorage fallback.
- EmailJS failure → existing error state pattern from `Contact.tsx`.
- Frames still loading → nearest-loaded-frame drawing, no blank canvas.
- Resume: wrong password → 401 w/ 800ms delay (existing); source unavailable → 502.

## Verification

- `npx tsc --noEmit`, `npm run lint`, `npm run build` clean.
- Playwright (webapp-testing) pass per route against the reference HTML opened
  side-by-side: layout/color/typography fidelity, animations run, reduced-motion
  respected.
- Functional checks: voting (fallback and API paths), lightbox on every concept,
  resume flow (public view + wrong/right password), contact form submit on at
  least one concept + classic, SWITCH controls, external links `_blank`.
- Mobile viewport spot-check per route (references are responsive via clamp()).

## Out of scope

- IP-hashed vote dedupe / rate limiting (noted in handoff as optional).
- Changing modal visual design per concept.
- Any content rewrite beyond the references + existing repo content.
