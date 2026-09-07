# Instructions — Freddie K. Portfolio

This file is the working rulebook for editing the portfolio before production. Use it when adding pages, changing copy, updating project data, or asking an AI coding agent to continue the work.

## Current stage

This project is still a prototype and review workspace. It is not the live portfolio replacement yet.

Do not deploy it, rename it as the final source of truth, or replace the existing site without Freddie's explicit approval.

## Editing rules

Keep changes small and reviewable. Prefer in-place edits over duplicate files, alternate versions, or parallel docs that say the same thing differently.

Before changing content, check these files:

- `docs/CONTENT_MAP.md` for approved sections and content scope
- `docs/STYLE_GUIDE.md` for voice and microcopy
- `docs/DESIGN.md` for visual and layout rules
- `docs/READINESS.md` before calling anything production-ready

## Content voice

The voice should feel human, practical, and slightly weird, but still clear. It should sound like Freddie building real tools, not a company selling AI solutions.

Use concrete language:

- current public projects
- hands-on technology experiments
- memory systems
- terminal UX
- visual experiments
- messy workflows
- repeated manual work

Avoid generic portfolio language:

- next-generation solutions
- seamless digital transformation
- innovative productivity platform
- robust end-to-end ecosystem
- empowering modern teams

## Homepage copy rules

The hero should explain what Freddie builds within a few seconds. Keep it short enough to scan on mobile.

The homepage section copy should work as a teaser, not a full explanation. Deeper explanation belongs in `/about`, `/labs/[slug]`, or notes.

Do not leave internal implementation phrases in public copy, such as "route target", "prototype surface", "placeholder", or "for now this anchors".

## Labs project data contract

Project cards and Labs detail pages are driven by `src/data/projects.ts`.

Every project must include:

```ts
title
label
category
date
publisher
summary
problem
does
stack
status
nextStep
command
output
metrics
```

Plain English meaning:

- `date`: publish date for the lab entry, using `YYYY-MM-DD`
- `publisher`: publishing identity shown in metadata, usually `Freddie K.`
- `summary`: one short sentence for cards and metadata
- `problem`: what pain or messy workflow this project responds to
- `does`: what the tool or experiment actually does
- `stack`: technologies or disciplines involved
- `status`: concept build, active lab, prototype, archived, or shipped
- `nextStep`: the next honest improvement, not marketing hype

If a new project does not have enough information for these fields yet, mark it as a sketch and keep the copy honest.

## Labs detail page structure

A project detail page should read like a small case study, not a decorative card expanded onto another page.

Required sections:

- Summary
- Problem
- What it does
- Stack
- Status
- Next step
- Terminal output

Keep each section short. The goal is proof and clarity, not a long sales page.

## Notes rules

Notes can be more personal than project cards. First-person writing is allowed when it adds honesty or context.

Avoid repeating "Here's why" or "Here's how" in every summary. If too many notes use the same pattern, rewrite the summaries so they feel less templated.

Code examples may contain placeholders, but use professional placeholder text like `Write the note body here.` instead of `Your content here...`.

## Visual and UI rules

Keep the dark-first terminal-dashboard identity. Do not remove the grid background, dashed borders, pale-blue accent system, or compact uppercase labels without updating `docs/DESIGN.md` first.

Light mode may exist, but dark mode is the visual source of truth.

Do not copy Honcho assets, mascot, logo, claims, or proprietary wording. The structure can be inspired by developer-tool dashboards; the identity must remain Freddie K..

## Verification before commit

Run these before committing:

```bash
npm test
npm run build
git diff --check
```

If content changes affect visible pages, preview at least:

- `/`
- `/about/`
- `/labs/afterglow/`
- `/contact/`

For local phone review on the same WiFi, run Astro with LAN binding:

```bash
npm run dev -- --host 0.0.0.0 --port 4322
```

Then open the Network URL on the phone.

## Production gate

Before production, confirm:

- Freddie approves the content voice
- project detail fields are filled for every Labs item
- placeholder/demo metrics are clearly marked or removed
- social metadata is final
- build and prototype checks pass
- source-of-truth repo and deployment target are confirmed

No production deploy happens from this workspace without explicit approval.
