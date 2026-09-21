<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Rollcall

Hackathon project; most of it was written with Claude Code. Read `UI-SPEC.md` and `DESIGN.md` before touching UI, `docs/adr/` before touching the agent.

- `npm run verify` must pass before any commit. `npm run qa:flow` drives the demo path in a browser.
- Custom CSS lives inside `@layer base` / `@layer components` in `app/globals.css`, or it overrides Tailwind utilities.
- Never add a real clinic, person or phone number outside 555-01xx. Never show a number that was not computed from the seed or a recording.
