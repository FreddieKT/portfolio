# Design System — Freddie K. Portfolio

## Design Target

The visual target is the generated prototype saved at:

`assets/reference/prototype-honcho-architecture.png`

We are not copying Honcho. We are adapting the **UI/UX architecture** into original Freddie K. identity:

- dark, terminal-dashboard portfolio shell
- retro terminal feel
- neo-brutalist structure
- mono / pixel typography
- checkered/grid canvas
- dashed-border navigation and cards
- calm pale-blue technical accent
- playful pixel/mascot-like identity layer
- CLI-first developer credibility

## Design Principle

The portfolio should feel like a **developer lab interface**, not a generic portfolio template.

Core impression:

> A personal record of current projects, experiments, and notes.

The copy should support that impression without sounding like a startup landing page. Freddie's voice is curious, practical, and direct. Describe current public work in plain language and avoid claims that the repository cannot support.

## Visual Language

### Layout

- Desktop-first single-page dashboard with responsive mobile stacking.
- Fixed or sticky top navigation with strong border line.
- Centered max-width content inside a full-width grid/checker background.
- Hero area uses a two-column layout: large claim on the left, terminal/profile panels on the right.
- Project modules are displayed as bordered system cards.
- A metrics/system strip and footer reinforce the “live operating system” feel.

### Typography

Preferred feel:

- Logo/display: blocky pixel or bold monospace style.
- Headline: heavy uppercase display treatment.
- Body: readable mono or mono-adjacent sans.
- Labels: uppercase, small, tracked, terminal-like.

Rules:

- Avoid generic corporate sans-only design.
- Use strong hierarchy through size, spacing, and borders.
- Keep text concise and scannable.

### Color Tokens

The prototype is **dark-first**. Light mode may exist later, but workers should match the dark reference before adding alternate themes.

Dark mode base:

```css
--background: #0b0d10;
--surface: #11151a;
--surface-raised: #151b22;
--foreground: #f4f7fb;
--muted: #8a96a8;
--grid-line: rgba(181, 217, 253, 0.08);
--border: rgba(244, 247, 251, 0.34);
--border-strong: rgba(181, 217, 253, 0.72);
--accent: #b5d9fd;
--accent-strong: #79bdf2;
--success: #7ee787;
```

Optional light mode base, only after dark visual fidelity is acceptable:

```css
--background: #fafafa;
--surface: #ffffff;
--surface-raised: #f4f7fb;
--foreground: #181818;
--muted: #737373;
--grid-line: #e5e5e5;
--border: rgba(24, 24, 24, 0.7);
--border-strong: #79bdf2;
--accent: #b5d9fd;
--accent-strong: #79bdf2;
--success: #16803c;
```

### Components

- Header: 68px target height, bordered bottom, pixel-style `Freddie K.` mark, `~/home/freddie` path label.
- Nav buttons: dashed borders, uppercase mono labels.
- CTA: `> CONTACT` style with pale-blue border/text.
- Theme toggle: visible but simple; must have an accessible label.
- Hero: huge uppercase claim with pale-blue cursor/dot accent.
- Category row: compact labels such as `AI INFRA`, `SYSTEMS`, `TERMINAL UX`, `OPEN SOURCE`.
- Terminal card: command prompt style, output rows, pale-blue cursor/highlight, bottom status line.
- Profile/status card: original Freddie K. pixel avatar/mascot, Freddie identity, `BUILDING` status.
- Project cards: dashed/solid border mix, index number, icon, label/category, description, command snippet, optional clearly-labelled demo metrics.
- Labs detail pages: compact case-study structure with Summary, Problem, What it does, Stack, Status, Next step, and Terminal output.
- Metrics strip: system-dashboard band with small charts or static visual indicators.
- Footer/status bar: `Freddie K.`, social/contact links, timestamp or build label, operational status.

## Must Match From Prototype

- Overall dashboard page structure.
- Dark-first grid/checkered background.
- Dashed border system.
- Pale-blue accent.
- CLI demo card.
- Right-side profile/status card.
- Modular project card layout.
- System metrics strip.
- Footer/status bar.
- Bold uppercase hero tone.

## Must Not Copy

- Honcho logo.
- Honcho mascot exactly.
- Honcho text or claims.
- Honcho visual assets.
- Any proprietary brand wording.

## Content Integrity Rules

- Use original Freddie K. wording from `docs/CONTENT_MAP.md` and `docs/STYLE_GUIDE.md`.
- Follow `docs/INSTRUCTIONS.md` before changing page copy, Labs project data, or pre-production readiness language.
- Do not present placeholder metrics as live facts unless Freddie supplies real numbers.
- Demo terminal output may be illustrative, but should be treated as prototype copy until verified.
- Public copy must not include internal implementation wording such as `route target`, `placeholder`, `prototype surface`, or `for now this anchors`.
- Every Labs project in `src/data/projects.ts` must include `summary`, `problem`, `does`, `stack`, `status`, `nextStep`, `command`, and `output` so detail pages do not become empty shells.

## Production Readiness Copy Rules

- Treat all concept projects as honest prototypes unless a project has shipped proof.
- Use `concept build`, `active lab`, `prototype`, `archived`, or `shipped` for project status labels.
- Keep project detail sections short. The page should give proof and direction, not a long sales pitch.
- Do not add KTM Cargo, private n8n workflows, logistics pricing, personal finance, or unrelated business automation content to this portfolio.
