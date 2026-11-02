# Answerd

The frontend for **[Answerd](https://answerd.vitalos.co.uk)**, the UK local services app where every business picks up, built by [Vitalos](https://vitalos.co.uk). This repo holds the clickable prototype and the Answerd website (`marketing-site/`). The backend runs on Vitalos Workforce and lives in a separate private repository.

## The prototype

The clickable prototype is built from `docs/answerd-spec.md`. All 155 IDs in the spec are on screen: the customer app, business mode, the business web dashboard, the admin console, the ten AI desk behaviours and Ask Answerd. Everything runs against one shared demo store, so a change on one surface shows up on all the others.

`COVERAGE.md` lists every ID with its route, status and any deviation from the spec.

## Run it

```bash
pnpm install
pnpm dev                 # http://localhost:3000, opens on the hub
pnpm build && pnpm start # production build
pnpm lint
```

Start at **`/hub`**.

**Installing needs a GitHub token.** The Answerd API client (`@vitalos/answerd-client`) comes from GitHub Packages, which asks for a token on every install, even for public packages.
- Create a classic token with only `read:packages` and export it before `pnpm install`: `export NODE_AUTH_TOKEN=<token>`.
- Never commit it. `.npmrc` holds only the `${NODE_AUTH_TOKEN}` placeholder.
- CI and the deploy workflow use the repo's built-in `GITHUB_TOKEN`.
- Cloud sessions need `NODE_AUTH_TOKEN` in the environment's secrets.

## The hub

The hub (`/hub`) drives the demo. From it you can:

- **Personas.** Switch who you are, signed in instantly. The table below lists them.
- **Demo clock.** The clock starts on Mon 26 Oct 2026 at 9am London time. **+2 hours** and **+1 day** move it forward and run everything that's due:
  - reminders;
  - booking requests expiring after 2 hours, with 3 alternatives sent to the customer;
  - desk quote follow-ups at +2 and +7 days;
  - trial countdowns and daily digests;
  - document claims and credentials auto-approving after a day.
- **Preview states.** Shows every list and data screen in its loading, empty or error state.
- **Simulate.** Runs any of the desk behaviours D-01 to D-10 against Swift Plumbing & Heating. D-09 has gas, danger-to-life and power-cut variants, and D-01 has an outside-the-area variant.
- **Trigger monetise gate.** Unlocks paid plans for the current business.
- **Reset demo data.** Restores the seed.
- **Screen index.** Every screen ID, linked, with its build status. Each screen also shows its ID in a corner badge.
- **Clean screenshots.** Add `?clean=1` to any URL to hide the prototype chrome.

| Persona | Who | Lands on |
| --- | --- | --- |
| Guest | Not signed in | C-09 Home; asked to sign in to message or book |
| Tayo A. | Customer in SE25: 3 past bookings, 1 upcoming with Swift Plumbing on Thu 29 Oct at 2pm | C-09 Home |
| Sam Okafor | Owns Swift Plumbing & Heating (desk live); also a customer | B-18 Today in business mode, or W-13 on the web |
| Jo Reid | Staff at Swift: Today, Inbox and Diary only, own jobs only | B-18 Today |
| Ife Bello | Answerd admin, full access | `/admin` |
| Dan Price | Support: read-only except review moderation | `/admin` |

To sign in by hand, any UK mobile number works. Tayo is 07700 900123, Sam is 07700 900456 and Jo is 07700 900457. For any code, **000000 is wrong** and any other 6 digits are right.

## API mode

By default the prototype runs on its mock store. To run it against the real Answerd API, build with `NEXT_PUBLIC_ANSWERD_API_URL` set:

```bash
NEXT_PUBLIC_ANSWERD_API_URL=https://answerd-staging-api.onrender.com pnpm build && pnpm start
```

- **Catalogue.** Listings, services, hours, service areas, credentials, desk status, ratings and reviews come from the API.
  - They're matched to the demo's listings by slug, so personas keep working.
  - Mock listings the API doesn't have are hidden.
  - Google results are never copied into the store.
- **Store actions.** Every store action with an endpoint (37 of them: messages, bookings, quotes, reviews, saves, claims, business settings, the desk, team, admin claim decisions) also calls the API.
  - The action still runs locally first.
  - See `lib/api/bridge.ts`.
- **Realtime.** Events from `/v1/realtime` update the store.
- **Sign-in.** It uses the real phone-code flow (C-06, C-07). On staging only allowlisted test numbers get a code.
- **The hub.** It shows the mode in its header. Its **Data source** panel shows sync state, the API session, realtime, and every API call with its status.
- **The client.** `lib/api/client.ts` stands in for `@vitalos/answerd-client` until the package can be installed (issue #2). `docs/answerd-api-contract.md` lists what's confirmed on staging.
- **Tests.** `pnpm test:e2e:api` runs the API-mode checks against staging. It wakes the API first. The journeys run too when `ANSWERD_STAGING_TEST_PHONES` is set.

Production stays in mock mode: the deploy workflow sets `NEXT_PUBLIC_ANSWERD_API_URL` only from the repo variable `ANSWERD_API_URL_PROTOTYPE`, which is unset. Never point it at staging.

## Surfaces

| Surface | Routes | IDs |
| --- | --- | --- |
| Customer app (in a phone frame) | `/app/…` | C-01 to C-48, Q-01 to Q-06 |
| Business mode (the same app) | `/app/biz/…` | B-01 to B-41 |
| Public website | On the website, `marketing-site/` (its address is `NEXT_PUBLIC_SITE_URL`, which `pnpm deploy:cf:prod` sets to https://answerd.vitalos.co.uk). Old prototype URLs such as `/b/[slug]` redirect there; `/` opens the hub. | W-01 to W-12, W-20 to W-27 |
| Business web dashboard | `/dashboard/…` | W-13 to W-19 |
| Admin console | `/admin/…` | A-01 to A-23 |
| AI desk behaviours | Hub › Simulate, B-33, W-17 | D-01 to D-10 |

## Deploy to Cloudflare Workers

Uses OpenNext (`@opennextjs/cloudflare`); config is in `wrangler.jsonc` and `open-next.config.ts`, and production is `wrangler.production.jsonc` (https://answerd-demo.vitalos.co.uk).

**Production deploys go through GitHub Actions** (`.github/workflows/deploy.yml`):
- When CI passes on `main`, a change to the prototype (anything outside `marketing-site/`, docs, Markdown and tests) deploys it to https://answerd-demo.vitalos.co.uk.
- To deploy by hand, use **Actions → Deploy → Run workflow** and pick `both`, `prototype` or `website`.
- The job runs `pnpm deploy:cf:prod` with the repo's `CLOUDFLARE_API_TOKEN` (secret) and `CLOUDFLARE_ACCOUNT_ID` (variable or secret).
- Production stays in mock mode unless the repo variable `ANSWERD_API_URL_PROTOTYPE` is set.

Locally:

```bash
pnpm preview:cf       # build and run locally in workerd
pnpm deploy:cf:prod   # fallback: deploy production by hand (needs CLOUDFLARE_API_TOKEN with Workers edit rights on the vitalos.co.uk zone, and CLOUDFLARE_ACCOUNT_ID)
```

## Tests

```bash
pnpm build
pnpm test:e2e                 # starts `next start` on port 3300
BASE_URL=http://localhost:3000 pnpm test:e2e   # or against a running server
```

`tests/e2e/` holds:

- **The eight journeys from the spec:**
  - J1 guest books, signs in, owner accepts, completes, customer reviews and recommends
  - J2 missed call to a paused desk, message instead, similar listing
  - J3 out-of-hours message, desk slot card, booked
  - J4 desk call books a job, seen in the inbox, call detail, diary and dashboard
  - J5 claim, setup, desk trial and test call
  - J6 monetise gate and upgrade
  - J7 admin approvals, review removal and audit
  - J8 gas safety card
- **`routes.spec.ts`:** every screen loads as the right persona with no 404, console error or empty link.
- **`a11y.spec.ts`:** axe on every screen at its viewport, with no serious or critical issues.

`pnpm coverage` regenerates `COVERAGE.md`.

## How the code is laid out

- **`lib/`:**
  - `types.ts` holds the entities from the spec's data model.
  - `seed.ts` is the deterministic demo data: 60 listings across claimed, seeded and Places layers, 300 reviews, threads, calls, bookings and quotes.
  - `store.ts` is the zustand store, persisted in localStorage. It holds every action and the demo clock.
  - Helpers: `selectors.ts`, `search.ts`, `time.ts` (London time), `deskScripts.ts` (the D-01 to D-10 scripts), `askAnswerd.ts`, `companiesHouse.ts` (mock register) and `screens.ts` (the ID registry).
- **`components/answerd/`:** the design system: buttons, chat bubbles, slot and quote cards, sheets, OTP input, mock map and so on.
- **`components/shells/`:** the phone frame, app bars and tabs, web header and footer, dashboard and admin shells.
- **`components/biz/`:** business screens written once and used by both the app and the web dashboard:
  - `claim/` for claiming;
  - `profile/` for setup and profile;
  - `ops/` for Today, inbox, calls, diary, quotes and stats;
  - `desk/` for the AI desk;
  - `account/` for billing, team and settings.
- **`components/dashboard/`, `components/admin/`:** the dashboard and admin pieces.
- **`marketing-site/`:** the Answerd website (W-01 to W-12, W-20 to W-27), a standalone Next.js project with its own README. The prototype links to it through `lib/site.ts`.

## From prototype to MVP

The prototype gives every surface the shape and behaviour the MVP needs, using one simulated store instead of real services:

| Prototype | MVP |
| --- | --- |
| `/app` in a phone frame, with a mode switch for business | **One Expo app** (iOS and Android) with customer mode and business mode. Staff accounts open straight into business mode. |
| `marketing-site/` and `/dashboard` | **Next.js web** at answerd.vitalos.co.uk: SEO pages for every category and area, listings, claiming and billing. Message and Book continue in the app. |
| `/admin` | Internal admin console on the same web stack, Google sign-in restricted to vitalos.co.uk. |
| The zustand store and the demo clock | **Workforce backend**: tenants, listings (claimed, seeded from Companies House and OpenStreetMap, Places gap-fill), bookings, threads, calls, quotes, reviews, notifications, billing (Stripe) and the audit log. |
| `lib/deskScripts.ts` | **AI front desk on Workforce**: the voice and SMS desk (missed-call forwarding, tracked numbers, transcripts, handoffs, safety rules) on the telephony and voice stack. |
| `lib/askAnswerd.ts` | **Ask Answerd, powered by Askbridge** (Vitalos's website assistant), in the app and as Chat with Answerd on the web. |
| Mock calls, SMS, audio, maps and checkout | Real telephony, SMS, push, map tiles and Stripe Checkout and Customer Portal. |

The prototype's rules carry over as product requirements:

- The desk never quotes outside the listed prices and never books outside the service area.
- Emergencies get the safety line and no booking.
- Businesses never pay before they've had 10 enquiries from Answerd.
- Every admin write needs a reason and is audited.

---

Proprietary. Copyright Vitalos Technologies Limited. All rights reserved.
