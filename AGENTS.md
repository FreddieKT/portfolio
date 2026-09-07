# Project Context

Freddie Portfolio is a personal site for Freddie K. It presents current public projects, experiments, and notes based on verified repository evidence.

## Public Site

- Production site: `freddie-portfolio.pages.dev`
- Hosted on Cloudflare Pages.
- Pushes to `main` auto-deploy.

## Stack

- Astro
- TypeScript
- CSS design tokens
- GSAP

## Commands

- Install: `npm install`
- Dev server: `npm run dev`
- Build: `npm run build`
- Test: `npm test`

## Structure

- `src/components/`: Astro components such as Hero, Header, Footer, cards
- `src/data/`: projects and metrics
- `src/layouts/`: page layout shells
- `src/pages/`: routes
- `src/content/`: markdown notes
- `public/`: static assets, security headers, robots.txt
- `docs/`: design system, content map, risk/readiness

## Workflow

- Use feature/fix/docs branches for changes.
- Open PRs into `main`; `main` is the production deploy branch.
- Run `npm test`, `npm run build`, and `git diff --check` before merging code changes.
- For docs-only changes, run `git diff --check` at minimum.
- Keep `/labs` as a fallback redirect; primary navigation should point to the canonical lab detail route.

## Portfolio Rules

- Use real data only.
- Public/private material must be gated correctly.
- State delivery status exactly: local, committed, pushed, PR, or deployed.
- Do not expose private notes, credentials, customer data, finance notes, or relationship context.

## Memory Boundary

Keep portfolio structure, commands, deploy behavior, and content rules here. Global Hermes memory should only keep high-level user preferences, not portfolio implementation details.

## Review guidelines
- Don't expose private notes, credentials, or relationship context in public code.
- Ensure no hardcoded API keys or secrets in source files.
- Check for broken internal links in Astro pages and components.
- Flag missing error handling on async functions.
- Verify `public/` and `src/content/` don't contain sensitive data.
