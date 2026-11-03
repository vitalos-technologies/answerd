# Answerd architecture

Answerd is Vitalos's UK local services marketplace, where every business picks up. This repository holds two front ends: the clickable prototype, which covers every screen in the product spec (customer app, business mode, business web dashboard, admin console, AI desk and Ask Answerd), and the Answerd website in `marketing-site/`. Both are Next.js 16 apps deployed to Cloudflare Workers through OpenNext. By default the prototype runs on a mock store in the browser and the website on build-time seed data. With an API URL set, both talk to the Answerd API, which lives in the Workforce backend (a separate private repository).

Snapshot: `vitalos-technologies/answerd` at `42b8c33`, 3 Nov 2026.

## Views

| View | File | What it shows |
| --- | --- | --- |
| Visual page | [index.html](index.html) | Every view below on one page, with a hand-drawn container diagram, light and dark themes, and expandable diagrams |
| Context and containers | [01-context-containers.md](01-context-containers.md) | Who uses the system, what it depends on, and the deployable parts |
| Data model | [02-data-model.md](02-data-model.md) | The entity model from `lib/types.ts` and the spec, where each piece of data lives today, and the rules on it |
| Deployment and CI/CD | [03-deployment-cicd.md](03-deployment-cicd.md) | Cloudflare Workers, environments, the CI and deploy workflows |
| Flows and security | [04-flows-security.md](04-flows-security.md) | Sign-in, bookings, the contact relay, revalidation and Ask Answerd, then trust boundaries, controls and risks |

## Key facts

| | |
| --- | --- |
| Stack | Next.js 16.4 (App Router), React 19.3, TypeScript, Tailwind 4, zustand (prototype), shadcn/ui |
| Hosting | Cloudflare Workers through `@opennextjs/cloudflare`, custom domains on the vitalos.co.uk zone |
| Apps | `answerd-prototype` (repo root) at answerd-demo.vitalos.co.uk; `answerd-site` (`marketing-site/`) at answerd.vitalos.co.uk |
| Data stores in this repo | None server-side. The prototype persists a zustand store in `localStorage`; the website prerenders from `lib/data/seed.ts`. The Workers use only a read-only static-assets cache (no D1, KV, R2 or Durable Objects) |
| Backend | Answerd API (`/v1`) in the Workforce `modules/marketplace` module. Staging runs on Render's free tier; production stays in mock mode until the owner sets the API URL variables |
| Providers | Cloudflare (Workers, Turnstile), Askbridge (chat widget), Vitalos admin inbox (contact relay), Anthropic API (optional), GitHub Actions and Packages |
| Scale | 165 of 165 spec screen IDs built, 138 prototype pages, 23 website page templates (about 580 prerendered pages), 13 Playwright journey and route specs plus 1 API-mode spec |

## Viewing the visual page

Open `arch/index.html` in a browser. Every diagram is pre-rendered into the page in light and dark versions, so it works offline and in app file viewers; a diagram edited without re-baking renders live from jsDelivr (`mermaid@11.4.1`) instead. Use Theme to switch between light and dark, Expand to open a diagram full screen, and Source to see its Mermaid code. After editing a Mermaid diagram, re-bake the page with the Vitalos archkit bake script so it keeps working offline.

## Updating

1. Change the Mermaid code in the Markdown file and paste the same code into the matching `<script type="text/plain" class="mmd">` block in `index.html` (the page swaps the `classDef` lines for theme-aware ones when it renders).
2. Update counts in the Overview tiles from the repository (for example `find app -name page.tsx | wc -l`).
3. Update the snapshot SHA and date in this file, in the page header and in the page footer.

A portfolio map of all Vitalos projects is kept in a private Vitalos repository.
