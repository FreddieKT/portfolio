# Motion

Calm and minimal. Motion confirms an action or joins two pages. It never decorates.

## Tokens (`src/styles/tokens.css`)

| Token | Value | Use |
|---|---|---|
| `--motion-fast` | 150ms | hover, focus, press: color, background, border, opacity |
| `--motion-base` | 200ms | page crossfade, icon rotate/swap |
| `--motion-ease` | `cubic-bezier(0.2, 0, 0, 1)` | everything |

Under `prefers-reduced-motion: reduce` the durations become 0 and view transitions are off.
`npm test` fails on any hardcoded duration or easing outside `tokens.css`.

## Rules

1. **Never hide content from JS after it paints.** No GSAP-style `set(opacity: 0)` and then fade in.
   That was the iPhone jank root cause (#57).
2. **Page navigation is one native crossfade** (`src/styles/motion.css`, `@view-transition`). No
   per-element entrance on top of it, because stacked fades read as a dim (#50, #51). Don't give the
   sticky header a `view-transition-name`. A named element is a backdrop root, which kills the
   glass blur, and it morphs between its stuck and top states. Identical header pixels already hold
   still in the root crossfade.
8. **Sticky header: transparent at the top, liquid-glass pill once scrolled.** The pill fades in
   over the first 4rem through a CSS scroll timeline. It follows Apple's "regular" Liquid Glass
   variant: near-neutral tint, blur plus saturation, rim, top specular and sheen (`--glass-*`
   tokens). It has no SVG refraction, because Safari drops `url()` backdrop filters. Under
   `prefers-contrast: more` or reduced transparency it becomes an opaque panel. Never put a
   `filter`, `opacity`, `mask` or `clip-path` on an ancestor of the header. Each of those is a
   backdrop root too.
3. **Animate opacity and transform only.** Color, background and border transitions are fine on
   hover/focus. Never animate layout (`gap`, `width`, `height`, `margin`).
4. **Focus outlines appear instantly.** Keyboard focus and touch press (`:focus-visible`, `:active`)
   get the same highlight as hover.
5. **Hover only under `@media (hover: hover)`.** On touch screens `:hover` sticks after a tap and
   then shows up in the view-transition snapshot. Only interactive elements get hover styles.
6. **Theme switch is one crossfade.** The toggle wraps the change in `document.startViewTransition`
   and pauses per-element color transitions for that frame (`.theme-switching`), so the page does
   not change color piece by piece. The toggle icon still turns.
7. **No JS animation libraries.** Browsers without cross-document view transitions (Firefox today)
   simply navigate instantly.

## Checking

- `npm test`: token-only timing, `@view-transition` present, every `:hover` gated, no `gsap` /
  `data-animate`.
- `node scripts/check-motion.mjs <baseUrl>` (run against `npm run preview`): WebKit (iPhone) and
  desktop Chromium. The view transition runs, the header stays still, and content opacity never drops.
  Chromium's `isMobile` emulation skips view transitions, so it is tested at desktop size, in the new
  headless mode, after prefetch has settled. If the next page still has to be fetched on click,
  headless Chromium often skips the transition. Prefetch is part of what makes navigation smooth.
- Confirm on a real iPhone before merging motion changes. WebKit emulation has missed jank before.
