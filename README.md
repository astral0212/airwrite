# Claude YT Video Generator

This repository contains the Claude rule components for website design recreation.

## Files

- `claude.md` — top-level index pointing at the rule components
- `rules/claude-workflow.md` — workflow steps for generating, screenshotting, comparing, and iterating
- `rules/claude-technical-defaults.md` — technical defaults and environment assumptions
- `rules/claude-rules.md` — strict design and comparison rules

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Use the rule files as the canonical source for how to work with design recreation tasks.

## Scripts

- `npm run screenshot`
  - Runs Puppeteer to screenshot `index.html` using the command defined in the workflow.
- `npm run preview`
  - Serves the current directory at `http://localhost:8080` for previewing HTML files.

## Notes

- Keep `claude.md` as an index only; all detailed rules should live under `rules/`.
- Use Tailwind via CDN as described in the technical defaults.
- Avoid committing generated files or local editor state.
