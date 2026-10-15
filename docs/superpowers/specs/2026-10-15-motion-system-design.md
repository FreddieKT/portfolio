# Motion System Design

Date: 2026-10-15
Status: approved (tested on local preview)
Rules for day-to-day work: `docs/MOTION.md`

## Goal

Replace piecemeal motion fixes (#48–#59) with one calm, minimal system. Page changes and interactions
should be visibly smooth on every device, and must never jank or flash.

**Success:** all motion is driven by three tokens and one stylesheet. Navigation crossfades without a
blank frame. Content is never hidden after it paints. Guard checks fail if the rules are broken.

## Root cause this replaces

A deferred GSAP module script hid `[data-animate]` content (`autoAlpha: 0`) after first paint, then
faded it in again, on every full-page navigation. WebKit measured first paint ~12–15ms before the
hide. Removed in #57.

## Approaches considered

| | Approach | Verdict |
|---|---|---|
| A | Native CSS: cross-document view transitions, token-driven interactions, prefetch | **Chosen.** No JS motion, nothing to hide after paint, calm |
| B | Astro `ClientRouter` (SPA) | Rejected. JS router, script lifecycle rewrites, reintroduces JS-timing risk |
| C | CSS per-element entrance only (#58) | Rejected. Blank frame between pages remains, and stacked fades dim (#50/#51) |

## Design

### Tokens (`src/styles/tokens.css`)
`--motion-fast: 150ms`, `--motion-base: 200ms`, `--motion-ease: cubic-bezier(0.2, 0, 0, 1)`.
Under reduced motion the durations become 0. The dead `--lift` and `--nudge` tokens are removed.

### Navigation (`src/styles/motion.css`, `astro.config.mjs`)
- `@view-transition { navigation: auto }`, gated by `prefers-reduced-motion: no-preference`.
- Root crossfade at `--motion-base`. `.site-header` has `view-transition-name` and holds still.
- No per-element entrance animation.
- Astro `prefetch: { prefetchAll: true, defaultStrategy: 'viewport' }`. The next page is usually
  already loaded, so the transition starts at once.

### Interactions
- Every hover, focus and press transition uses the tokens. Color, background and border only.
  Never layout: the `gap` hover on the notes read link is removed.
- `:hover` only under `@media (hover: hover)`. `:focus-visible` and `:active` mirror the hover
  highlight, so keyboard and touch users get the same feedback.
- Hover is removed from non-interactive `.grid-tags` spans.
- Theme switch: `document.startViewTransition` plus a one-frame `.theme-switching` class that pauses
  per-element color transitions. Only the toggle icon turns. The CSP hash is updated.
- The 650ms `light-rays` keyframe is removed. Toggle icons swap at `--motion-base`.
- About timeline: the icon rotates and the panel content fades in at `--motion-base`. The panel
  height snaps.

### Out of scope
- The `body::before` masked grid layer. Revisit only if jank returns on a real iPhone.
- Firefox view transitions. It navigates instantly until it ships support.

## Verification

- `npm test` (`scripts/check-prototype.mjs`):
  - no `gsap` / `data-animate`
  - no hardcoded duration or easing outside `tokens.css`
  - `@view-transition` present
  - no `:hover` outside `@media (hover: hover)`
- `node scripts/check-motion.mjs <baseUrl>`:
  - runs in WebKit (iPhone 15) and Chromium (desktop, new headless, after prefetch settles)
  - the view transition runs, the header box is unchanged, and content opacity never drops
- WebKit probes during design:
  - no animations on load (including light theme)
  - theme switch animates only the toggle icons (19 elements before the fix)
  - timeline content goes from opacity 0 to 1 over ~200ms
- Manual: local preview approved on 2026-10-15. Confirm on a real iPhone after deploy.

## Supersedes

PRs #58 (CSS entrance) and #59 (view transitions + prefetch draft).
