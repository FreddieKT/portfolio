# Architecture — Astro Portfolio

## Goal

Build a static-first Astro portfolio prototype with a strong design-system foundation, original Freddie K. content, and minimal JavaScript.

## Scope

This repository is currently a **planning/prototype workspace**. Do not replace the live portfolio, deploy the site, or scaffold Astro until the docs-review parent task is complete.

## Stack

- Astro for routing and static generation.
- TypeScript for component props and content typing.
- CSS variables for theme tokens.
- Plain CSS or scoped Astro styles for exact visual control.
- Optional MD/MDX content later, but not required for MVP.

## Proposed Structure

```text
freddie-portfolio/
  src/
    components/
      Header.astro
      Hero.astro
      TerminalCard.astro
      ProfileStatusCard.astro
      ProjectCard.astro
      MetricsStrip.astro
      FooterStatus.astro
      SectionLabel.astro
      ThemeToggle.astro
    data/
      projects.ts
      metrics.ts
    layouts/
      BaseLayout.astro
    pages/
      index.astro
    styles/
      global.css
      tokens.css
  public/
    assets/
      logo.svg
      avatar.svg
  docs/
  assets/reference/
```

## Page Architecture

### `index.astro`

Primary portfolio landing page.

Sections:

1. Header/navigation
2. Hero claim and category row
3. CLI/demo terminal panel
4. Profile/status card
5. Project modules
6. Systems/metrics dashboard strip
7. Footer/status bar and contact/social links

## Data Model

Project cards should be data-driven:

```ts
export const projects = [
  {
    index: '01',
    title: 'X-LAB AGENT PLATFORM',
    label: 'agent control plane',
    category: 'AI PLATFORM',
    summary: 'A control plane for running reviewed AI agent products across separate organizations.',
    status: 'active development',
    sourceUrl: 'https://github.com/FreddieKT/xlab-agent-platform'
  }
];
```

Do not show project metrics unless a current public source supports them:

```ts
export const demoMetrics = [
  { label: 'TOOLS BUILT', value: '4', verified: false }
];
```

## Performance Rules

- No heavy animation libraries for MVP.
- CSS-only grid/checker background.
- SVG/pixel mark should be lightweight.
- Use system-safe font fallback if custom font is not added yet.
- Prefer static Astro components over client-side islands unless interaction requires JavaScript.

## Accessibility Rules

- All nav controls must have visible text.
- Contrast must stay readable in the dark reference theme first, then optional light mode.
- Theme toggle must have `aria-label`.
- Keyboard focus states must be visible.
- Do not encode important meaning by color alone.
- Project cards that are clickable must be keyboard-focusable and have descriptive labels.
