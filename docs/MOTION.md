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
   per-element entrance on top of it, because stacked fades read as a dim (#50, #51). The header has
   `view-transition-name` so it holds still.
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
