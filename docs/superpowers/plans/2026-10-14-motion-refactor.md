# Motion Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the per-navigation GSAP fade and all moving motion so that taps and navigation never stutter on iPhone Safari. Motion becomes colour-only feedback.

**Architecture:** Pages paint in their final state with no JS animation. Interactive elements change only colour or background, through one token, `--motion-fast` (150 ms). Hover rules are gated on `@media (hover: hover)`, and each one has a matching `:active` rule for touch. A static guard in `npm test` keeps GSAP, `data-animate` and moving transitions from coming back. A second PR swaps the fixed, masked background grid layer for plain body background layers.

**Tech Stack:** Astro 7, CSS custom properties, Playwright (Chromium + WebKit) for measurement, Node assert scripts for tests.

**Spec:** `docs/superpowers/specs/2026-10-14-motion-refactor-design.md`

## Global Constraints

- Allowed transition properties: `color`, `background-color` / `background`, `border-color`, `outline-color`, `opacity` (only on small icons/dots). Never `transform`, `gap`, `width`, `height`, `all`.
- Every transition duration is `var(--motion-fast)` = `150ms`, with easing `ease`.
- Reduced motion is handled in one place only: `--motion-fast: 0ms` under `@media (prefers-reduced-motion: reduce)` in `src/styles/tokens.css`.
- Every `:hover` rule lives inside `@media (hover: hover)`. Each interactive element gets an `:active` rule with the same colour change. `:focus-visible` is never placed inside the hover media query.
- The CSP in `public/_headers` stays hash-based (no `'unsafe-inline'`). `npm run csp` must pass.
- Out of scope: ClientRouter or view transitions, and content, layout or palette changes.
- Branches: PR1 `refactor/motion-feedback-only`, PR2 `refactor/static-grid-background`, each from `origin/main`. Pushing to `main` auto-deploys to production, so merge only after Freddie confirms on a real iPhone.
- Before each push run `npm test`, `npm run build`, `npm run csp`, `npm run check` and `git diff --check`.

## Review Focus

1. **Keyboard focus on touch-capable laptops.** `:focus-visible` must still show the accent state with a mouse that has no hover. Keep focus-visible outside `@media (hover: hover)`. The Task 4 guard check pins this.
2. **iOS `:active` without a touch listener.** Without the passive `touchstart` listener, tapping shows no feedback on iPhone. Task 4 asserts the listener exists in SiteHead, and the Task 5 iPhone check confirms it.
3. **Theme toggle with a stored light theme.** The icon must show the sun immediately on load with no animation. Task 3 keeps the `is-light` / `is-dark` class swap and only removes transforms and keyframes.
4. **JS disabled.** With no GSAP, content is visible without JS. Task 2's build check confirms there are no inline `opacity:0` or `visibility:hidden` styles in dist HTML.
5. **Long pages after PR2.** The grid fade is computed against the full body height, not the viewport. Task 6 compares screenshots of a long page (`/about/`) at the top and after scrolling, and Freddie approves.

---

## PR1: feedback-only motion (`refactor/motion-feedback-only`)

### Task 1: Static motion guard (fails first)

**Files:**
- Modify: `scripts/check-prototype.mjs` (lines 65, 69, 93-94, and append after line 136, the `sourceFiles` definition)

**Interfaces:**
- Consumes: the existing `read()`, `walk()`, `pkg`, `themeToggle`, `sourceFiles` in `scripts/check-prototype.mjs`.
- Produces: the `npm test` failures that Tasks 2–4 must turn green.

- [ ] **Step 1: Create the branch**

```bash
git fetch origin && git switch -c refactor/motion-feedback-only origin/main
```

- [ ] **Step 2: Replace the assertions that require animation**

Make these replacements in `scripts/check-prototype.mjs`:

Line 65:
```js
assert.match(themeToggle, /sun-rays/, 'theme toggle should include animated light-mode rays');
```
becomes
```js
assert.match(themeToggle, /sun-rays/, 'theme toggle should include light-mode rays');
```

Line 69:
```js
assert.match(themeToggle, /transition:/, 'theme toggle icon should animate between light and dark states');
```
becomes
```js
assert.doesNotMatch(themeToggle, /@keyframes|animation:/, 'theme toggle icon swaps instantly (motion is colour-only)');
```

Lines 93-94:
```js
assert.ok(pkg.dependencies?.gsap, 'gsap dependency must be installed');
assert.match(index, /gsap/i, 'page must load GSAP animation script');
```
become
```js
assert.ok(!pkg.dependencies?.gsap && !pkg.devDependencies?.gsap, 'gsap must not be installed: motion is CSS colour-only (see docs/superpowers/specs/2026-10-14-motion-refactor-design.md)');
```

- [ ] **Step 3: Append the motion guard after the `sourceFiles` line**

Insert directly after `const sourceFiles = walk('src').filter((file) => /\.(astro|css|ts)$/.test(file));`:

```js
// Motion guard: colour-only feedback. See docs/superpowers/specs/2026-10-14-motion-refactor-design.md
const motionSpec = 'docs/superpowers/specs/2026-10-14-motion-refactor-design.md';
for (const file of sourceFiles) {
  const text = read(file);
  assert.doesNotMatch(text, /\bgsap\b|data-animate/, `${file}: entrance animations are not allowed (${motionSpec})`);
  for (const [, value] of text.matchAll(/transition:\s*([^;]+);/g)) {
    assert.doesNotMatch(value, /\b(transform|gap|width|height|all)\b/, `${file}: transition must be colour/opacity only, got "${value.trim()}" (${motionSpec})`);
  }
  for (const [, body] of text.matchAll(/:(?:hover|active)[^{]*\{([^}]*)\}/g)) {
    assert.doesNotMatch(body, /\b(transform|gap)\s*:/, `${file}: hover/active must not move elements (${motionSpec})`);
  }
}
```

- [ ] **Step 4: Run the test and confirm it fails**

Run: `npm test`
Expected: FAIL with `gsap must not be installed: motion is CSS colour-only`

- [ ] **Step 5: Commit**

```bash
git add scripts/check-prototype.mjs
git commit -m "test: guard motion to colour-only feedback (currently red)"
```

### Task 2: Remove GSAP and entrance animations

**Files:**
- Modify: `package.json`, `package-lock.json` (via npm)
- Modify: `src/layouts/PageLayout.astro` (delete the `<script>` block that imports gsap)
- Modify: `src/pages/index.astro` (delete the `<script>` block that imports gsap)
- Modify: every file containing `data-animate`: `src/components/Hero.astro`, `src/components/ProjectCard.astro`, `src/components/PageSidebar.astro`, `src/pages/404.astro`, `src/pages/contact.astro`, `src/pages/about.astro`, `src/pages/notes.astro`, `src/pages/notes/[slug].astro`, `src/pages/labs/index.astro`, `src/pages/labs/[slug].astro`, `src/pages/index.astro`
- Modify: `AGENTS.md:16`, `README.md:9`

**Interfaces:**
- Consumes: the Task 1 guard.
- Produces: a site with no JS animation, which Task 5 measures.

- [ ] **Step 1: Uninstall gsap**

```bash
npm uninstall gsap
```
Expected: `package.json` has no `gsap`, and the lockfile drops it.

- [ ] **Step 2: Delete the two GSAP script blocks**

In `src/layouts/PageLayout.astro`, delete the whole block from `    <script>\n      import { gsap } from 'gsap';` through its closing `    </script>` (13 lines, just before `  </body>`).

In `src/pages/index.astro`, delete the whole block from `    <script>\n      import { gsap } from 'gsap';` through its closing `    </script>` (just before `  </body>`).

- [ ] **Step 3: Strip every `data-animate` attribute**

```bash
perl -pi -e 's/ data-animate="[^"]*"//g' $(grep -rl 'data-animate' src)
grep -rn 'data-animate' src || echo "none left"
```
Expected: `none left`. In `Hero.astro`, `<div data-animate="hero-eyebrow">` becomes a plain `<div>` wrapper, which is fine.

- [ ] **Step 4: Update the stack docs**

`AGENTS.md` line 16: delete `- GSAP`.
`README.md` line 9: change `Astro · TypeScript · CSS design tokens · GSAP` to `Astro · TypeScript · CSS design tokens`.

- [ ] **Step 5: Build and confirm that nothing in the HTML is hidden**

```bash
npm run build && grep -rlE 'style="[^"]*(opacity:\s*0|visibility:\s*hidden)' dist --include=*.html || echo "no hidden content"
ls dist/_astro/*.js 2>/dev/null | grep -i gsap || echo "no gsap bundle"
```
Expected: `no hidden content` and `no gsap bundle`.

- [ ] **Step 6: Run the tests**

Run: `npm test`
Expected: still FAIL, but now on a transition or `transform` message from ThemeToggle or about. That proves the gsap and data-animate parts are green and Task 3 is next. If it passes, check that the guard loop runs (`sourceFiles` must include `.astro` files).

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src AGENTS.md README.md
git commit -m "refactor: remove GSAP entrance animations and data-animate"
```

### Task 3: Tokens and the remaining moving motion

**Files:**
- Modify: `src/styles/tokens.css:67-70` and `:147-153`
- Modify: `src/components/ThemeToggle.astro:102-168`
- Modify: `src/pages/about.astro` (`.timeline-row.is-open .timeline-toggle` rule, around line 499)
- Modify: `src/pages/notes.astro:138`, `:164`, `:167-169`
- Modify: `src/pages/notes/[slug].astro:304`

**Interfaces:**
- Produces: `--motion-fast` is the only motion token (150ms). `--motion-base`, `--lift` and `--nudge` no longer exist.

- [ ] **Step 1: Tokens**

In `src/styles/tokens.css`, replace
```css
  --motion-fast: 160ms;
  --motion-base: 200ms;
  --lift: -3px;
  --nudge: 4px;
```
with
```css
  --motion-fast: 150ms;
```
and replace the reduced-motion block
```css
@media (prefers-reduced-motion: reduce) {
  :root {
    --motion-fast: 0ms;
    --motion-base: 0ms;
    --lift: 0px;
    --nudge: 0px;
  }
}
```
with
```css
@media (prefers-reduced-motion: reduce) {
  :root {
    --motion-fast: 0ms;
  }
}
```
Verify: `grep -rn "motion-base\|--lift\|--nudge" src` prints nothing.

- [ ] **Step 2: ThemeToggle icon swaps instantly**

In `src/components/ThemeToggle.astro`, replace everything from `  .sun-icon,\n  .moon-icon,\n  .sun-rays {` down to the end of the `@media (prefers-reduced-motion: reduce) { ... }` block (just before `</style>`) with:

```css
  .sun-icon {
    opacity: 0;
  }

  .moon-icon {
    opacity: 1;
  }

  .theme-toggle.is-light .sun-icon {
    opacity: 1;
  }

  .theme-toggle.is-light .moon-icon {
    opacity: 0;
  }
```
The `is-dark` rules are no longer needed, because the defaults above are the dark state. Keep the SVG markup and the `.theme-icon-svg` rule unchanged.

- [ ] **Step 3: Education toggle: the plus becomes a minus**

In `src/pages/about.astro`, replace
```css
  .timeline-row.is-open .timeline-toggle {
    transform: rotate(45deg);
  }
```
with
```css
  .timeline-row.is-open .timeline-toggle::after {
    display: none;
  }
```
The static `.timeline-toggle::after { transform: rotate(90deg); }` stays. It draws the vertical bar of the plus and is not animated.

- [ ] **Step 4: Notes "read" link uses no layout motion**

In `src/pages/notes.astro`, delete the line `    transition: gap var(--motion-fast) ease;` (line 164), and replace
```css
  .note-read-link:hover {
    gap: 0.75rem;
  }
```
with
```css
  .note-read-link:active {
    text-decoration: underline;
  }

  @media (hover: hover) {
    .note-read-link:hover {
      text-decoration: underline;
    }
  }
```
Replace `transition: color 160ms ease;` with `transition: color var(--motion-fast) ease;` in `src/pages/notes.astro:138` and in `src/pages/notes/[slug].astro:304`.

- [ ] **Step 5: Run the tests**

Run: `npm test`
Expected: PASS (`prototype checks passed`).

- [ ] **Step 6: Commit**

```bash
git add src/styles/tokens.css src/components/ThemeToggle.astro src/pages/about.astro src/pages/notes.astro "src/pages/notes/[slug].astro"
git commit -m "refactor: single 150ms colour token; theme icon and education toggle swap instantly"
```

### Task 4: Feedback: hover gated, `:active` for touch, iOS touch listener

**Files:**
- Modify: `src/styles/global.css` (rules at ~60, ~140, ~208-215)
- Modify: `src/components/ThemeToggle.astro:83-87`, `src/components/Header.astro:79-80` and `:96-101`, `src/components/FooterStatus.astro:67-73`, `src/components/PageSidebar.astro:87-99`, `src/components/ProjectCard.astro:48-50` and `:73`
- Modify: `src/pages/404.astro:41-43`, `src/pages/notes.astro:89-91` and `:141-143`, `src/pages/notes/[slug].astro:287-289` and `:307-309`, `src/pages/contact.astro:85-86`, `src/pages/index.astro:133-137`, `src/pages/about.astro:348-353` and `:459-462`
- Modify: `src/components/SiteHead.astro` (inline theme script), `public/_headers` (CSP hash)
- Modify: `scripts/check-prototype.mjs` (2 assertions)

**Interfaces:**
- Consumes: `--motion-fast`, `--accent`, `--accent-soft`, `--interactive-overlay`, `--accent-strong` from tokens.
- Produces: the touch feedback that the Task 5 iPhone check relies on.

- [ ] **Step 1: Add the failing assertions**

Append to the motion guard block in `scripts/check-prototype.mjs`:

```js
assert.match(siteHead, /addEventListener\('touchstart',\s*\(\)\s*=>\s*\{\},\s*\{\s*passive:\s*true\s*\}\)/, 'SiteHead must register a passive touchstart listener so iOS Safari applies :active');
for (const file of sourceFiles.filter((f) => f.endsWith('.astro') || f.endsWith('.css'))) {
  const text = read(file);
  const ungated = text.replace(/@media\s*\(hover:\s*hover\)\s*\{[\s\S]*?\n\s*\}\s*\n\s*\}/g, '').match(/[^\n]*:hover[^\n]*/g) ?? [];
  assert.deepEqual(ungated, [], `${file}: :hover must live inside @media (hover: hover)`);
}
```
Run: `npm test`
Expected: FAIL with `SiteHead must register a passive touchstart listener`.

- [ ] **Step 2: Apply the hover/active pattern to every rule**

The pattern is the same for every rule: `:focus-visible` and `:active` share the declarations, and `:hover` repeats them inside `@media (hover: hover)`. Make these exact replacements.

`src/styles/global.css`:
```css
a:hover,
a:focus-visible {
  color: var(--accent);
}
```
→
```css
a:focus-visible,
a:active {
  color: var(--accent);
}

@media (hover: hover) {
  a:hover {
    color: var(--accent);
  }
}
```
```css
.nav-pill:hover,
.nav-pill:focus-visible {
  color: var(--accent);
  border-color: var(--accent);
  background: var(--accent-soft);
}
```
→
```css
.nav-pill:focus-visible,
.nav-pill:active {
  color: var(--accent);
  border-color: var(--accent);
  background: var(--accent-soft);
}

@media (hover: hover) {
  .nav-pill:hover {
    color: var(--accent);
    border-color: var(--accent);
    background: var(--accent-soft);
  }
}
```
```css
.grid-tags > span:hover {
  background: var(--accent-soft);
}

.grid-tags > span:hover .tag-dot {
  background: currentColor;
  opacity: 1;
}
```
→ (tags are not interactive, so no `:active`)
```css
@media (hover: hover) {
  .grid-tags > span:hover {
    background: var(--accent-soft);
  }

  .grid-tags > span:hover .tag-dot {
    background: currentColor;
    opacity: 1;
  }
}
```

`src/components/ThemeToggle.astro`:
```css
  .theme-toggle:hover,
  .theme-toggle:focus-visible {
    border-color: var(--accent);
    background: var(--accent-soft);
  }
```
→
```css
  .theme-toggle:focus-visible,
  .theme-toggle:active {
    border-color: var(--accent);
    background: var(--accent-soft);
  }

  @media (hover: hover) {
    .theme-toggle:hover {
      border-color: var(--accent);
      background: var(--accent-soft);
    }
  }
```

`src/components/Header.astro` (the `:active` rules at lines 86 and 102 already exist; keep them):
```css
  .nav-link:hover { color: var(--accent); }
  .brand-mark:hover { color: var(--accent); }
```
→
```css
  @media (hover: hover) {
    .nav-link:hover { color: var(--accent); }
    .brand-mark:hover { color: var(--accent); }
  }
```
```css
  .theme-control :global(.theme-toggle:hover),
  .theme-control :global(.theme-toggle:focus-visible) {
    color: var(--accent);
    background: var(--interactive-overlay);
    box-shadow: none;
  }
```
→
```css
  .theme-control :global(.theme-toggle:focus-visible) {
    color: var(--accent);
    background: var(--interactive-overlay);
    box-shadow: none;
  }
  @media (hover: hover) {
    .theme-control :global(.theme-toggle:hover) {
      color: var(--accent);
      background: var(--interactive-overlay);
      box-shadow: none;
    }
  }
```

`src/components/FooterStatus.astro`:
```css
  .footer-links a:hover,
  .footer-links a:focus-visible {
    color: var(--accent);
    background: var(--interactive-overlay);
    outline: 1px dashed var(--accent);
    outline-offset: 2px;
  }
```
→
```css
  .footer-links a:focus-visible {
    color: var(--accent);
    background: var(--interactive-overlay);
    outline: 1px dashed var(--accent);
    outline-offset: 2px;
  }

  .footer-links a:active {
    color: var(--accent);
    background: var(--interactive-overlay);
  }

  @media (hover: hover) {
    .footer-links a:hover {
      color: var(--accent);
      background: var(--interactive-overlay);
      outline: 1px dashed var(--accent);
      outline-offset: 2px;
    }
  }
```

`src/components/PageSidebar.astro`:
```css
  .sidebar-item:hover,
  .sidebar-item:focus-visible {
    color: var(--accent);
    background: var(--accent-soft);
    border-left-color: var(--accent);
    outline: none;
  }

  .sidebar-item:hover .sidebar-num,
  .sidebar-item:focus-visible .sidebar-num {
    color: var(--accent);
    border-right-color: var(--accent);
  }
```
→
```css
  .sidebar-item:focus-visible,
  .sidebar-item:active {
    color: var(--accent);
    background: var(--accent-soft);
    border-left-color: var(--accent);
    outline: none;
  }

  .sidebar-item:focus-visible .sidebar-num,
  .sidebar-item:active .sidebar-num {
    color: var(--accent);
    border-right-color: var(--accent);
  }

  @media (hover: hover) {
    .sidebar-item:hover {
      color: var(--accent);
      background: var(--accent-soft);
      border-left-color: var(--accent);
    }

    .sidebar-item:hover .sidebar-num {
      color: var(--accent);
      border-right-color: var(--accent);
    }
  }
```

`src/components/ProjectCard.astro`:
```css
  .row-link:hover {
    background: var(--accent-soft);
  }
```
→
```css
  .row-link:active {
    background: var(--accent-soft);
  }

  @media (hover: hover) {
    .row-link:hover {
      background: var(--accent-soft);
    }
  }
```
```css
  .row-link:hover .row-dot { background: var(--accent); opacity: 1; }
```
→
```css
  .row-link:active .row-dot { background: var(--accent); opacity: 1; }

  @media (hover: hover) {
    .row-link:hover .row-dot { background: var(--accent); opacity: 1; }
  }
```

`src/pages/404.astro`:
```css
  .return-link:hover {
    text-decoration: underline;
  }
```
→
```css
  .return-link:active {
    text-decoration: underline;
  }

  @media (hover: hover) {
    .return-link:hover {
      text-decoration: underline;
    }
  }
```

`src/pages/notes.astro`:
```css
  .note-card:hover {
    border-color: var(--accent);
  }
```
→
```css
  .note-card:active {
    border-color: var(--accent);
  }

  @media (hover: hover) {
    .note-card:hover {
      border-color: var(--accent);
    }
  }
```
```css
  .note-title a:hover {
    color: var(--accent);
  }
```
→
```css
  .note-title a:active {
    color: var(--accent);
  }

  @media (hover: hover) {
    .note-title a:hover {
      color: var(--accent);
    }
  }
```

`src/pages/notes/[slug].astro`:
```css
  .prose :global(a:hover) {
    text-decoration: underline;
  }
```
→
```css
  .prose :global(a:active) {
    text-decoration: underline;
  }

  @media (hover: hover) {
    .prose :global(a:hover) {
      text-decoration: underline;
    }
  }
```
```css
  .back-link:hover {
    color: var(--accent);
  }
```
→
```css
  .back-link:active {
    color: var(--accent);
  }

  @media (hover: hover) {
    .back-link:hover {
      color: var(--accent);
    }
  }
```

`src/pages/contact.astro`:
```css
  .contact-row:hover { background: var(--accent-soft); }
  .contact-row:hover .contact-dot { background: var(--accent); opacity: 1; }
```
→
```css
  .contact-row:active { background: var(--accent-soft); }
  .contact-row:active .contact-dot { background: var(--accent); opacity: 1; }

  @media (hover: hover) {
    .contact-row:hover { background: var(--accent-soft); }
    .contact-row:hover .contact-dot { background: var(--accent); opacity: 1; }
  }
```

`src/pages/index.astro`:
```css
  .section-pointer:hover,
  .section-pointer:focus-visible {
    text-decoration: underline;
    text-underline-offset: 0.25rem;
  }
```
→
```css
  .section-pointer:focus-visible,
  .section-pointer:active {
    text-decoration: underline;
    text-underline-offset: 0.25rem;
  }

  @media (hover: hover) {
    .section-pointer:hover {
      text-decoration: underline;
      text-underline-offset: 0.25rem;
    }
  }
```

`src/pages/about.astro`:
```css
  .link-row:hover {
    background: var(--accent-soft);
    color: var(--accent);
  }

  .link-row:hover .link-dot { background: var(--accent); opacity: 1; }
```
→
```css
  .link-row:active {
    background: var(--accent-soft);
    color: var(--accent);
  }

  .link-row:active .link-dot { background: var(--accent); opacity: 1; }

  @media (hover: hover) {
    .link-row:hover {
      background: var(--accent-soft);
      color: var(--accent);
    }

    .link-row:hover .link-dot { background: var(--accent); opacity: 1; }
  }
```
```css
  .timeline-head:hover .timeline-text,
  .timeline-head:focus-visible .timeline-text {
    color: var(--accent);
  }
```
→
```css
  .timeline-head:focus-visible .timeline-text,
  .timeline-head:active .timeline-text {
    color: var(--accent);
  }

  @media (hover: hover) {
    .timeline-head:hover .timeline-text {
      color: var(--accent);
    }
  }
```

Verify that no ungated hover is left:
```bash
grep -rn ":hover" src | grep -v "@media (hover: hover)"
```
Every remaining line must sit inside a `@media (hover: hover) {` block. Read each match in context.

- [ ] **Step 3: iOS touch listener in the theme script**

In `src/components/SiteHead.astro`, replace
```html
<script is:inline>
  const t = localStorage.getItem('freddie-portfolio-theme');
  if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
</script>
```
with
```html
<script is:inline>
  const t = localStorage.getItem('freddie-portfolio-theme');
  if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
  document.addEventListener('touchstart', () => {}, { passive: true });
</script>
```

- [ ] **Step 4: Update the CSP hash**

```bash
npm run build && npm run csp
```
Expected: FAIL with `CSP is missing 1 inline script hash(es): 'sha256-NEW='`. In `public/_headers`, replace the old theme-script hash `'sha256-HTHENTaiCZy6JYTMbtaCMlrDkEkYUkNDK79FzIisUMQ='` with the printed new hash. Then:
```bash
npm run build && npm run csp
```
Expected: `CSP verified: 3 inline script hash(es) match the build output`.

- [ ] **Step 5: Run everything**

```bash
npm test && npm run check && git diff --check
```
Expected: `prototype checks passed`, `0 errors`, no diff-check output.

- [ ] **Step 6: Commit**

```bash
git add src public/_headers scripts/check-prototype.mjs
git commit -m "feat: colour-only feedback — hover gated to hover devices, :active for touch, iOS touch listener"
```

### Task 5: WebKit measurement, then PR1

**Files:**
- Modify: `scripts/measure-dim.mjs` (replace the whole file)
- Modify: `package.json` / `package-lock.json` (add `sharp` to devDependencies)

**Interfaces:**
- Consumes: the built site from Tasks 2–4.
- Produces: `node scripts/measure-dim.mjs <baseUrl> [webkit|chromium]`, which prints one JSON line per route.

- [ ] **Step 1: Ask Freddie, then install WebKit**

Ask Freddie in chat: "OK to download Playwright WebKit (`npx playwright install webkit`, from Playwright's CDN, ~80 MB)?" Wait for a yes. Then:
```bash
npx playwright install webkit
```

- [ ] **Step 2: Declare sharp**

```bash
npm install --save-dev sharp@0.35.3
```
Expected: `sharp` appears under devDependencies (it is already in the lockfile via Astro).

- [ ] **Step 3: Replace `scripts/measure-dim.mjs`**

```js
// Usage: node scripts/measure-dim.mjs <baseUrl> [webkit|chromium]
// Taps through routes on an iPhone profile. Per navigation it reports frame gaps
// over 50ms, layout shift, and whether any content painted below full opacity or
// moved after first paint. Pass criteria: docs/superpowers/specs/2026-10-14-motion-refactor-design.md
import { chromium, webkit, devices } from '@playwright/test';

const [base, engine = 'webkit'] = process.argv.slice(2);
if (!base) throw new Error('usage: node scripts/measure-dim.mjs <baseUrl> [webkit|chromium]');
const browser = await (engine === 'chromium' ? chromium : webkit).launch();
const ctx = await browser.newContext({ ...devices['iPhone 13'] });
await ctx.addInitScript(() => {
  const t0 = performance.now();
  const log = (window.__motion = { gaps: [], shift: 0, dimmed: false, moved: false });
  let last = t0;
  let firstTop;
  const tick = (t) => {
    if (t - last > 50) log.gaps.push(Math.round(t - last));
    last = t;
    // .page-section / .section-panel are the content blocks GSAP used to fade (classes stay after the refactor)
    const el = document.querySelector('.page-section, .section-panel');
    if (el) {
      const top = el.getBoundingClientRect().top + scrollY;
      firstTop ??= top;
      if (Math.abs(top - firstTop) > 0.5) log.moved = true;
      if (getComputedStyle(el).opacity !== '1') log.dimmed = true;
    }
    if (t - t0 < 1500) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  new PerformanceObserver((list) => list.getEntries().forEach((e) => { log.shift += e.value; })).observe({ type: 'layout-shift', buffered: true });
});
const page = await ctx.newPage();
const routes = [
  ['/about/', 'a.nav-link[href="/contact"]'],
  ['/contact/', 'a.nav-link[href="/labs"]'],
  ['/labs/', 'a.brand-mark'],
  ['/', 'a.row-link'],
];
let failed = false;
for (const [from, selector] of routes) {
  await page.goto(base + from, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.locator(selector).first().tap();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1600);
  const m = await page.evaluate(() => window.__motion);
  const ok = m.gaps.length === 0 && m.shift === 0 && !m.dimmed && !m.moved;
  failed ||= !ok;
  console.log(JSON.stringify({ engine, from, to: page.url().replace(base, ''), ok, ...m }));
}
await browser.close();
process.exit(failed ? 1 : 0);
```

- [ ] **Step 4: Measure production as the baseline (expected to fail)**

```bash
node scripts/measure-dim.mjs https://freddie-portfolio.pages.dev webkit
```
Expected: exit 1, with `dimmed: true` on at least the inner-page routes (the GSAP fade). Record the output for the PR description.

- [ ] **Step 5: Measure the branch (expected to pass)**

```bash
npm run build && (npx astro preview --port 4391 &) && sleep 3
node scripts/measure-dim.mjs http://localhost:4391 webkit; echo "exit $?"
pkill -f "astro preview --port 4391"
```
Expected: four lines with `"ok":true` and `exit 0`. If `gaps` is non-empty on localhost only for the first route, that is the cold start. Re-run once before treating it as real.

- [ ] **Step 6: Commit, push, open PR1**

```bash
git add scripts/measure-dim.mjs package.json package-lock.json
git commit -m "test: WebKit iPhone motion measurement in measure-dim"
npm test && npm run build && npm run csp && npm run check && git diff --check
git push -u origin refactor/motion-feedback-only
gh pr create --base main --title "refactor: colour-only motion (fixes iPhone tap stutter)" --body-file -
```
The PR body includes:
- the spec link
- the before/after WebKit output from Steps 4–5
- the list of removed motion
- "Check on a real iPhone at the Cloudflare preview URL before merging"
- the attribution line `🤖 Generated with [Claude Code](https://claude.com/claude-code)`

- [ ] **Step 7: iPhone gate**

Give Freddie the Cloudflare preview URL from the PR's Pages comment. Freddie taps About → Contact → Labs → Home and back on iPhone Safari. Merge only after Freddie confirms it no longer stutters and says to merge.

---

## PR2: static grid background (`refactor/static-grid-background`)

### Task 6: Replace the fixed, masked grid layer with body background layers

**Files:**
- Modify: `src/styles/global.css` (the `body` and `body::before` rules, ~lines 26-53)

**Interfaces:**
- Consumes: `--grid-line`, `--grid-line-strong`, `--background` tokens (existing, both themes).

- [ ] **Step 1: Branch from the updated main (after PR1 is merged)**

```bash
git fetch origin && git switch -c refactor/static-grid-background origin/main
```

- [ ] **Step 2: Capture "before" screenshots**

```bash
SHOTS="${TMPDIR:-/tmp}/grid-shots"; mkdir -p "$SHOTS" && cat > scripts/.shoot.tmp.mjs <<'EOF'
import { chromium } from '@playwright/test';
const [base, tag, out] = process.argv.slice(2);
const browser = await chromium.launch();
for (const theme of ['dark', 'light']) for (const [w, h] of [[375, 812], [1280, 800]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.addInitScript((t) => localStorage.setItem('freddie-portfolio-theme', t), theme);
  await page.goto(base + '/about/', { waitUntil: 'networkidle' });
  await page.screenshot({ path: `${out}/${tag}-${theme}-${w}-top.png` });
  await page.evaluate(() => scrollTo(0, 1200));
  await page.screenshot({ path: `${out}/${tag}-${theme}-${w}-scrolled.png` });
  await page.close();
}
await browser.close();
EOF
node scripts/.shoot.tmp.mjs https://freddie-portfolio.pages.dev before "$SHOTS"
```
Expected: 8 PNGs in `$SHOTS`. (The script lives in `scripts/` only so it can resolve `@playwright/test`; it is deleted in Step 4.)

- [ ] **Step 3: Replace the rules**

In `src/styles/global.css`, replace the `body { ... }` rule and the whole `body::before { ... }` rule with:

```css
body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  color: var(--foreground);
  /* Grid drawn as plain background layers: no fixed, masked layer for WebKit to recomposite.
   * The top layer fades the grid toward the edges (was a mask-image at 0.75 opacity). */
  background:
    radial-gradient(circle at center,
      color-mix(in srgb, var(--background) 25%, transparent) 35%,
      color-mix(in srgb, var(--background) 47.5%, transparent) 72%,
      var(--background) 100%),
    linear-gradient(var(--grid-line) 1px, transparent 1px) -1px -1px / 18px 18px,
    linear-gradient(90deg, var(--grid-line) 1px, transparent 1px) -1px -1px / 18px 18px,
    linear-gradient(var(--grid-line-strong) 1px, transparent 1px) -1px -1px / 90px 90px,
    linear-gradient(90deg, var(--grid-line-strong) 1px, transparent 1px) -1px -1px / 90px 90px,
    linear-gradient(rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0.02)),
    linear-gradient(90deg, transparent 0, transparent calc(100% - 1px), rgba(255, 255, 255, 0.03) calc(100% - 1px)),
    var(--background);
}
```

- [ ] **Step 4: Capture "after" screenshots and compare**

```bash
npm run build && (npx astro preview --port 4391 &) && sleep 3
node scripts/.shoot.tmp.mjs http://localhost:4391 after "$SHOTS"
pkill -f "astro preview --port 4391"; rm scripts/.shoot.tmp.mjs
```
Open each `before-*` / `after-*` pair. The `top` shots should look equivalent: grid visible in the centre and fading at the edges. The `scrolled` shots will differ, because the fade now follows the page height. Send Freddie the pairs, using `SendUserFile` with `display: render`, and wait for approval. If Freddie rejects the scrolled look, stop and report back. The fallback is to keep `body::before` but change `position: fixed` to `position: absolute` on a `position: relative` body. That still removes the fixed layer, and it is a new decision for Freddie.

- [ ] **Step 5: WebKit measurement, checks, PR2**

```bash
npm run build && (npx astro preview --port 4391 &) && sleep 3
node scripts/measure-dim.mjs http://localhost:4391 webkit; echo "exit $?"
pkill -f "astro preview --port 4391"
npm test && npm run csp && npm run check && git diff --check
git add src/styles/global.css
git commit -m "perf: draw background grid as body layers instead of a fixed masked layer"
git push -u origin refactor/static-grid-background
gh pr create --base main --title "perf: static background grid (no fixed masked layer)" --body-file -
```
Expected: `exit 0` and all checks pass. The PR body includes the screenshot comparison note, an iPhone preview gate, and the attribution line.

- [ ] **Step 6: iPhone gate**

Same as Task 5 Step 7. In addition, Freddie scrolls a long page (`/about/`) on the iPhone.

### Task 7: Housekeeping

- [ ] **Step 1: Ask about #52**

Ask Freddie: "PR #52 (touch hover lift) is obsolete after PR1. OK to close it?" On a yes:
```bash
gh pr close 52 --comment "Superseded by the colour-only motion refactor (docs/superpowers/specs/2026-10-14-motion-refactor-design.md)."
```
