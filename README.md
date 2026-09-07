# freddie-portfolio

Personal portfolio for **Freddie K.** It collects current projects, experiments, and notes about technology I have tried.

**[freddie-portfolio.pages.dev](https://freddie-portfolio.pages.dev)**

## Stack

Astro · TypeScript · CSS design tokens · GSAP

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build      # outputs to dist/
npm test           # runs prototype checks
```

## Deploy

Hosted on Cloudflare Pages. Pushes to `main` auto-deploy.

```text
Framework preset:  Astro
Build command:     npm run build
Build output:      dist
```

## Project structure

```
src/
  components/   — Astro components (Hero, Header, Footer, cards)
  data/         — projects, metrics
  layouts/      — page layout shells
  pages/        — routes (index, about, notes, labs, contact)
  content/      — notes (markdown collection)
public/         — static assets, security headers, robots.txt
docs/           — design system, content map, risk/readiness
```

## License

MIT
