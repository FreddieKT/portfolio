# Motion refactor: feedback-only, CSS-only

Date: 2026-10-14
Status: approved design, awaiting spec review

## Problem

On a real iPhone (Safari), every tap or navigation stutters "in sync with the animations".

On 2026-10-14 we tested on an iPhone and compared two Cloudflare preview deploys:
- yesterday's build, `6fa1ec6`
- today's build, `ca7b319`

Both stuttered. So the cause predates that day's PRs (#48–#55). Static review confirmed this: the motion JS bundles are byte-identical across the two builds, dependencies are unchanged, and CSP is clean.

The likely cause is the mechanism that every page shares:
- Each tap is a full page load.
- The page paints first.
- Then a deferred GSAP module script sets `autoAlpha: 0` on all `[data-animate]` content and fades it back in.
- On WebKit this full-page fade runs above `body::before`, a fixed, masked, full-viewport grid layer.

Chromium phone emulation does not reproduce the stutter, so verification must use WebKit or a real iPhone. PRs #50, #51, #54 and #55 each patched a symptom of this mechanism. This refactor removes the mechanism instead.

## Goal

Tapping, navigating and scrolling on iPhone Safari never stutters. Motion is a single, small, CSS-only system that a static check can verify.

Success criteria:
1. Real iPhone, on the Cloudflare preview: About → Contact → Labs → Home taps and scrolling feel instant. Freddie confirms.
2. Playwright WebKit with the iPhone 13 profile: every element has opacity 1 and no transform from the first paint frame; frame gaps over 50 ms in the 1.5 s after navigation are 0; layout shift is 0.
3. `npm test` fails if GSAP, `data-animate`, or `transform` in a transition comes back.

## Decisions (from brainstorming)

- **Purpose of motion: feedback only.** There are no entrance animations, and pages paint in their final state.
- **Page transition (added 2026-10-15 at Freddie's request):** a native cross-document opacity cross-fade. It is browser-driven and needs no JS (see F).
- **Feedback style: colour only.** Hover and press change `color`, `background-color` and `border-color`. Nothing moves, lifts or scales.
- **Small effects:** Freddie delegated these. The theme icon swaps instantly. The Education expand stays instant. The background grid is kept, but rendered more cheaply (see C).

## Design

### A. Motion rules

- Only `color`, `background-color`, `border-color`, `outline-color` and small-icon `opacity` may transition.
- Every transition uses `var(--motion-fast)` (150 ms) with `ease`.
- `transform` is never animated and never applied on hover or press. Static decorative transforms are allowed, for example the Education toggle's `::after` rotate that draws the plus sign.

### B. Removals (PR1)

| What | Where |
|---|---|
| `gsap` dependency | `package.json`, lockfile |
| GSAP entrance scripts | `src/layouts/PageLayout.astro`, `src/pages/index.astro` |
| `data-animate` attributes | Hero, ProjectCard, PageSidebar, 404, contact, about, notes, notes/[slug], labs/index, labs/[slug], index |
| Tokens `--motion-base`, `--lift`, `--nudge` | `src/styles/tokens.css` (both the default and the reduced-motion blocks) |
| Theme icon rotate/scale transitions and `light-rays` keyframes | `src/components/ThemeToggle.astro`. Icons switch by `opacity` with no transition, so the swap is instant. |
| Education toggle `.is-open` rotate | `src/pages/about.astro`. The plus becomes a minus by hiding `::after`, with no rotation. |
| GSAP mentions | `AGENTS.md` Stack, `README.md` stack line |

Change `--motion-fast` from 160 ms to 150 ms.

### C. Feedback (PR1)

- Wrap every `:hover` rule in `@media (hover: hover)`, so a tap does not leave a sticky hover tint.
- Every interactive element gets an `:active` rule with the same colour change as its hover. The interactive elements are:
  - nav-link and brand
  - nav-pill
  - project row
  - contact row and about link-row
  - sidebar item
  - footer links
  - section-pointer
  - Education head
  - theme toggle
  - note card, return link, and note links
- iOS Safari applies `:active` only when a touch listener exists. Add `document.addEventListener('touchstart', () => {}, { passive: true });` to the inline theme script in `src/components/SiteHead.astro`, and update its hash in `public/_headers`. `npm run csp` verifies the hash.
- Keep `-webkit-tap-highlight-color: transparent`. `:active` replaces it.

### D. Background grid (PR2)

- Replace the `body::before` layer, which is `position: fixed` + `mask-image` + `opacity`, with `body` background layers.
- The same four grid-line gradients go under a `radial-gradient(circle at center, transparent 35%, var(--background) 100%)` overlay. This approximates the mask fade without masking or compositing a fixed layer.
- The grid now scrolls with the page instead of staying fixed. Freddie accepted this trade-off.
- It must look visually equivalent in both themes. Check this with before/after screenshots at 375 px and 1280 px.

### E. Reduced motion

`@media (prefers-reduced-motion: reduce)` sets `--motion-fast: 0ms`, and the page transition is only enabled under `prefers-reduced-motion: no-preference`.

### F. Page transition

- `@view-transition { navigation: auto; }` sits inside `@media (prefers-reduced-motion: no-preference)` in `global.css`.
- The browser cross-fades page snapshots using its default opacity fade over `--motion-page` (200 ms). The real DOM never animates, so nothing paints and then moves.
- The header has `view-transition-name: site-header`. Its group, old and new pseudos have no animation, so the header holds still while the content fades.
- Any `@keyframes` in `src/` may animate only `opacity`, and the `npm test` guard enforces this.
- Support: Safari 18.2+ and Chromium 126+, headed. Headless Chromium does not run cross-document transitions. Other browsers navigate instantly.

## Verification

1. **Static guard in `scripts/check-prototype.mjs`.** Replace the assertions that currently require GSAP and an animated theme toggle (lines 65, 69, 93, 94) with these:
   - `package.json` has no `gsap`.
   - No file under `src/` contains `gsap` or `data-animate`.
   - No `transition` declaration under `src/` lists `transform`.
   - No `:hover` rule sets `transform`.
2. **WebKit check.** Extend `scripts/measure-dim.mjs` rather than adding a new script. Add a WebKit iPhone 13 mode that measures the criteria in Goal 2.
   - This needs `npx playwright install webkit`, which is a download. Ask Freddie before running it.
   - Also declare `sharp` in devDependencies, because measure-dim imports it.
3. **Real iPhone.** Test each PR's Cloudflare preview URL before merging. This is the deciding test.
4. **Standard checks.** `npm test`, `npm run build`, `npm run csp`, `npm run check` and `git diff --check`.

## Rollout

- **PR1:** sections A, B, C and E, plus the static guard. Test on iPhone, then merge.
- **PR2:** section D. Compare screenshots, test on iPhone, then merge.
- Close the open PR #52 (touch hover lift). PR1 makes it obsolete.

## Out of scope

- Client-side routing (ClientRouter). Slide or transform page transitions.
- Content, layout and palette changes.
- The `/labs` redirect rule in AGENTS.md, the unlinked `/notes`, and the OS light-mode preference.
