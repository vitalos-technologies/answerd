# Answerd website

The only Answerd website, at **answerd.vitalos.co.uk**, app first ("Every business picks up."). The landing page plus the public pages ported from the prototype (`answerd-prototype`, screen IDs from its `docs/answerd-spec.md`): SEO category and area pages, business listings, the claim flow, sign-in and billing mocks, help, about, legal and the review link. Standalone Next.js project inside the prototype repo; it never imports from the prototype.

**Stack:** Next.js (App Router), TypeScript strict, Tailwind v4, shadcn/ui on Base UI, Motion (`motion/react`, chat panel only), lucide-react, `qrcode`, Inter via `next/font`. pnpm.

## Run it

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm build        # production build (about 580 static pages)
pnpm lint
```

## App-first rules

1. "Get the app" is the one primary action on every page: the header button, the mobile smart banner and the home page's sticky bar. On a computer it opens the QR dialog; on a phone it goes straight to the right store (or the dialog with both badges while the store links aren't set).
2. Listing pages: **Call** works on the web (it shows the tracked Answerd number and a `tel:` link). **Message** and **Book** open "Continue in the app": a QR code of the listing's universal link on desktop, store buttons and an "Open in the app" link on a phone. The universal link is `https://answerd.vitalos.co.uk/b/[slug]`.
3. No web booking, no web messaging, no business dashboard. Businesses claim on the web (`/claim`), buy subscriptions on the web (`/billing`), and run everything else in the app.

## Pages

| Route | Screen | What it is |
| --- | --- | --- |
| `/` | W-01 | Landing page, now with "Businesses that respond instantly near you" (6 businesses with a live desk) under Popular services; service tiles link to category pages |
| `/[category]` | W-03 | Category hub (32 categories): cities and their areas, top businesses, "What it costs" from listed prices, related services, FAQs; BreadcrumbList and FAQPage JSON-LD |
| `/[category]/[area]` | W-04 | Category in area (32 × 14): breadcrumbs, quick filters, results, average prices, nearby areas, FAQs; ItemList, BreadcrumbList and FAQPage JSON-LD. Thin areas also list nearby businesses; empty combinations are `noindex` and left out of the sitemap |
| `/areas/[area]` | W-05 | Area hub: every category in the area, child and nearby areas, FAQs |
| `/b/[slug]` | W-06, W-07 | Claimed listing (about, services and prices, reviews, credentials, service area, hours, sticky contact card; sticky Call / Message / Book bar below 1024 px) and unclaimed listing (address, Call, "Is this your business? Claim it free"); LocalBusiness JSON-LD |
| `/claim` | W-11 | Claim or add a business (find, confirm, verify by SMS, call, Companies House director or document, done), ending with "Get the app to run your business", QR and store badges. `?listing=slug` starts at "Is this you?". Every "List your business" link lands here |
| `/sign-in` | W-12 | Mock sign-in for business owners who need billing: phone and code, Google, email link. `?next=` returns you |
| `/billing`, `/billing/checkout?plan=desk\|featured`, `/billing/portal` | W-18 | Plans (public), plus for the signed-in demo owner: current plan, monetise-gate progress, gated plan buttons, mock checkout and portal. Labelled "Prototype checkout, no card needed" |
| `/help` | W-20 | 20 articles for customers and businesses with a search filter; contact by email |
| `/about` | W-21 | Answerd by Vitalos, chat powered by Askbridge, contact |
| `/contact` | — | Contact form (topic, name, email, organisation, message). `app/api/contact` relays it, signed, to the Vitalos admin inbox (admin.vitalos.co.uk › Enquiries) |
| `/terms`, `/privacy`, `/cookies`, `/legal/review-policy`, `/legal/acceptable-use`, `/legal/call-recording` | W-22 | Legal placeholders with shared navigation |
| `/review/[token]` | W-27 | Review from the post-job link. Demo tokens: `bk-tayo-swift-past` (valid), `bk-tayo-sparkle` (already reviewed); anything else shows "expired" |
| `/get-the-app` | W-26 | QR, store badges, what the app does. The site's QR codes point here |
| (every page, phones) | W-26 | Smart app banner at the top, dismissible for the session |
| (every page) | W-25 | Chat with Answerd placeholder; its chips now suggest up to three businesses as cards linking to `/b/[slug]` |
| 404 | W-24 | Not found with links to popular services |

## Where things live

| What | Where |
| --- | --- |
| Landing page copy, links, store URLs, `SITE_URL` | `content/site.ts` |
| Copy for every ported page | `content/pages.ts` |
| Help articles, legal placeholders | `content/help.ts`, `content/legal.ts` |
| Mock data (deterministic, server-only) | `lib/data/seed.ts` (ported from the prototype's `createSeed`, same random sequence, so names, ratings and review dates match), `lib/data/queries.ts` (selectors, ranking, price guide, FAQs, view models), `lib/data/jsonld.ts` |
| Landing page sections | `components/site/*.tsx` (composed in `app/page.tsx`) |
| Ported page building blocks | `components/web/*` (server components; client islands are `listing-actions`, `listing-dialogs`, `result-filters`, `claim-flow`, `sign-in-flow`, `billing`, `review-form`, `help-search`) |
| Per-page metadata (canonical, Open Graph) | `lib/seo.ts` |
| Design tokens, type scale, CSS motion, filter and banner rules | `app/globals.css` |
| Sitemap, robots | `app/sitemap.ts`, `app/robots.ts` |

## Mock data and mock flows

- SEO and listing pages render at build time from `lib/data/seed.ts` (60 businesses in Croydon, Birmingham and Manchester, 300 reviews). The demo clock is Mon 26 Oct 2026, 9am, so derived values (credential expiry, the Addiscombe Decorators holiday banner, the monetise gate) are the same on every build.
- Prices in the "What it costs" and "Average prices" panels come only from services the mock businesses list. No invented figures.
- Claim, sign-in, billing and review are mocks. They keep state in the component or in `sessionStorage` (`lib/demo-session.ts`); nothing is sent anywhere. Each is labelled as a prototype where it would otherwise look real. Signing in always makes you "Sam Okafor, Swift Plumbing & Heating" (9 of 10 enquiries, gate date Fri 30 Oct, as in the prototype); the billing page has a "Prototype: preview the gate as … Gate reached" switch so the checkout can be tried.
- Client components get copy as props from server pages or wrappers (`components/site/islands.tsx`), so the content modules never ship to the browser.

## Environment variables

| Variable | Purpose | If unset |
| --- | --- | --- |
| `NEXT_PUBLIC_ANSWERD_API_URL` | Turns on API mode (see below), e.g. `https://answerd-staging-api.onrender.com` | Static fallback data, as before |
| `ANSWERD_REVALIDATE_SECRET` | Secret for the signed `POST /api/revalidate` (API mode). Set it on the Worker as a secret, and on the API | `/api/revalidate` answers 503 |
| `NEXT_PUBLIC_ASKBRIDGE_SITE_KEY` | The Answerd workspace's public site key in Askbridge (`pk_…`). Loads the real Askbridge widget, `askbridge.vitalos.co.uk/widget/v1/askbridge.js`, only after the visitor accepts all cookies. Build time: the deploy reads the repo variable `ASKBRIDGE_SITE_KEY` | The local chat placeholder shows |
| `VITALOS_ENQUIRY_SECRET` | Secret for the `/contact` form's relay to the Vitalos admin inbox (the admin's `INBOUND_WEBHOOK_SECRET`). Set it on the Worker as a secret | The form says it can't send and shows the email address |
| `VITALOS_ENQUIRY_URL` | The admin inbox's web-form endpoint | `https://admin.vitalos.co.uk/api/inbound/web-form` |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile on `/contact`. Needed only when the admin inbox has `TURNSTILE_SECRET_KEY` set: use the site key paired with that secret, with `answerd.vitalos.co.uk` in its hostnames. Build time: repo variable `TURNSTILE_SITE_KEY` | No check on the form |
| `APP_STORE_URL` | App Store listing for badges, QR flow and "Get the app" on iPhone | Links go to `/#download` |
| `PLAY_STORE_URL` | Google Play listing, same uses on Android | Links go to `/#download` |

The store URLs are inlined at build time, so rebuild after changing them. The canonical domain is `SITE_URL` in `content/site.ts` (`https://answerd.vitalos.co.uk`); canonical URLs, JSON-LD, the sitemap, QR codes and the listing universal links all derive from it.

## API mode

Set `NEXT_PUBLIC_ANSWERD_API_URL` and the site reads the Answerd API instead of `lib/data/seed.ts`. It's off by default, and production doesn't set it.

- **Pages.** Search (`/search`, W-02), category in area, area and listing pages come from the API.
  - All but search are cached with incremental static regeneration: hourly (`s-maxage=3600`), and at once when the API calls `POST /api/revalidate` for a changed listing.
  - The data layer is `lib/data/source.ts`, with view models in `lib/data/listing-view.ts`.
  - Category hubs (`/[category]`) and the home page still use the static data.
- **Google results.** Results with `poweredByGoogle` are never put in a cached or prerendered page.
  - `components/web/google-results.tsx` fetches them after load through a no-store Server Action.
  - It always shows "Powered by Google".
- **Browser calls.** Chat with Answerd uses the public search tool (`POST /v1/tools/search`).
  - It asks for a postcode when the message has none.
  - Sign-in (phone code), claim and billing (Stripe Checkout and Portal) go through Server Actions in `lib/api/actions.ts`, because the API's CORS only allows the production origin.
  - Tokens are kept in httpOnly cookies.
- **The client.** `lib/api/client.ts` stands in for `@vitalos/answerd-client` until the package can be installed (issue #2). It retries once and waits up to 90 s, because staging sleeps on Render's free tier.
- **Revalidate signature.**
  - Header `x-answerd-timestamp`: unix seconds.
  - Header `x-answerd-signature`: `sha256=` + hex HMAC-SHA256 of `"<timestamp>.<raw body>"`, keyed with `ANSWERD_REVALIDATE_SECRET`.
  - Body: `{"listingSlug"}` or `{"listingId"}`.
  - The window is 5 minutes.
- **On Cloudflare.** `open-next.config.ts` uses the read-only static-assets cache, which needs no paid Cloudflare product. In API mode, pages render on request and aren't kept between requests. A persistent ISR cache (R2) needs a paid Cloudflare subscription, so it isn't planned.

## Performance notes

- Motion is used for the chat panel only, which loads on first open. Scroll reveals (15% in view, a 24 px bottom margin, finished within 400 ms), the phone float, the header shrink and the banner and app-bar transitions are CSS, driven by small observers (`components/site/reveal.tsx`, `header-client.tsx`).
- The Get the app dialog, the mobile menu, the chat panel and the listing Call / Continue in the app dialogs load on first use (`next/dynamic`).
- New templates are server-rendered HTML. Their only client code is small islands: W-04 filters and the help search toggle attributes on server-rendered lists (CSS hides what doesn't match), and FAQs use native `<details>`.
- Icons repeated on result cards (star, badge check, shield, chevron), the brand mark and the phone status bar are SVG `<symbol>`s drawn with `<use>`.
- Home page sections below the fold use `content-visibility: auto` and their own `<Suspense>` boundaries.

## Deploy to Cloudflare Workers

Uses OpenNext (`@opennextjs/cloudflare`); config is in `wrangler.jsonc` and `open-next.config.ts`, and production is `wrangler.production.jsonc` (https://answerd.vitalos.co.uk).

**Production deploys go through GitHub Actions** (`.github/workflows/deploy.yml`):
- When CI passes on `main`, a change to `marketing-site/` (Markdown aside) deploys it to https://answerd.vitalos.co.uk.
- To deploy by hand, use **Actions → Deploy → Run workflow** and pick `both`, `prototype` or `website`.
- The job runs `pnpm deploy:cf:prod` with the repo's `CLOUDFLARE_API_TOKEN` (secret) and `CLOUDFLARE_ACCOUNT_ID` (variable or secret).
- Production stays in mock mode unless the repo variable `ANSWERD_API_URL_SITE` is set.

Locally:

```bash
pnpm preview:cf       # build and run locally in workerd
pnpm deploy:cf:prod   # fallback: deploy production by hand (needs CLOUDFLARE_API_TOKEN with Workers edit rights on the vitalos.co.uk zone, and CLOUDFLARE_ACCOUNT_ID)
```

Every page is static except `/review/[token]` for unknown tokens (rendered on request to show the expired state).

## Placeholders to replace before launch

- **Mock data.** Every business, review, price and enquiry count is mock data from the prototype seed. Replace `lib/data/seed.ts` with the Workforce backend before launch.
- **Mock flows.** Claim, sign-in (Workforce auth), billing and checkout (Stripe Checkout and the Stripe customer portal), and the review link post nothing. Each says so on the page.
- **Universal links.** `/b/[slug]` only opens the app once the site serves `/.well-known/apple-app-site-association` and `/.well-known/assetlinks.json` with the real app IDs. Neither file exists yet.
- **Tracked numbers.** Call shows the desk number from the mock data, or the shared line `020 7946 0800` (an Ofcom drama number).
- Store badges link to `/#download` until `APP_STORE_URL` and `PLAY_STORE_URL` are set, and use placeholder artwork (swap for the official Apple and Google badges).
- Legal pages carry placeholder text and a notice saying so.
- The Askbridge chat is a local preview panel until `NEXT_PUBLIC_ASKBRIDGE_SITE_KEY` is set; its suggested businesses come from the mock data.
- `/contact` sends real messages: they arrive in the Vitalos admin inbox (admin.vitalos.co.uk › Enquiries) as website-form enquiries, headed "Sent from the Answerd website contact form" with the chosen topic.
- Contact is a `mailto:` link (hello@vitalos.co.uk).
- Listing covers are a category-icon band (the mock data has no photos).
- Analytics: none is loaded. The cookie banner already gates non-essential scripts behind "Accept all".
