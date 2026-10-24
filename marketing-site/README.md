# Answerd marketing site

The public site for Answerd ("Every business picks up."): one landing page plus placeholder Terms, Privacy and Cookies pages. Standalone Next.js project inside the prototype repo.

**Stack:** Next.js (App Router), TypeScript strict, Tailwind v4, shadcn/ui on Base UI, Motion (`motion/react`), lucide-react, `qrcode`, Inter via `next/font`. pnpm.

## Run it

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm build        # production build
pnpm lint
```

## Where things live

| What | Where |
| --- | --- |
| All copy, links and store URLs | `content/site.ts` |
| Page sections | `components/site/*.tsx` (composed in `app/page.tsx`) |
| Phone mockups | `components/site/phone/*` |
| Brand mark and logo | `components/brand/*` |
| Design tokens, type scale, CSS motion | `app/globals.css` |
| SEO: metadata, OG image, JSON-LD, sitemap, robots | `app/layout.tsx`, `app/opengraph-image.tsx`, `components/site/json-ld.tsx`, `app/sitemap.ts`, `app/robots.ts` |

## Environment variables

| Variable | Purpose | If unset |
| --- | --- | --- |
| `NEXT_PUBLIC_ASKBRIDGE_SITE_ID` | Loads the real Askbridge chat embed (only after the visitor accepts all cookies) | The local chat placeholder shows |
| `APP_STORE_URL` | App Store listing for badges, QR and "Get the app" on iPhone | Links go to `/#download` |
| `PLAY_STORE_URL` | Google Play listing, same uses on Android | Links go to `/#download` |

The store URLs are inlined at build time, so rebuild after changing them. The canonical domain is `SITE_URL` in `content/site.ts` (currently `https://answerd.vitalos.co.uk`).

## Performance notes

- First-load JS is about 205 KB gzipped. Motion is used for the chat panel only, which loads on first open. Scroll reveals, the phone float, the header shrink and the banner and app-bar transitions are CSS, driven by small observers (`components/site/reveal.tsx`, `header-client.tsx`).
- The Get the app dialog, the mobile menu and the chat panel load on first use (`next/dynamic`).
- Client components get their copy as props from server wrappers (`components/site/islands.tsx`), so `content/site.ts` never ships to the browser.
- The brand mark and phone status-bar glyphs are SVG `<symbol>`s rendered once in the layout and drawn with `<use>`.
- Below-the-fold sections use `content-visibility: auto` and their own `<Suspense>` boundaries, so hydration runs in short tasks.

## Deploy to Cloudflare Workers

Uses OpenNext (`@opennextjs/cloudflare`); config is in `wrangler.jsonc` and `open-next.config.ts`.

```bash
pnpm preview:cf   # build and run locally in workerd
pnpm deploy:cf    # build and deploy (needs CLOUDFLARE_API_TOKEN with Workers edit rights, and CLOUDFLARE_ACCOUNT_ID)
```

## Placeholders to replace before launch

- Store badges link to `/#download` until `APP_STORE_URL` and `PLAY_STORE_URL` are set.
- Terms, Privacy and Cookies pages carry placeholder text and a notice saying so.
- The Askbridge chat is a local preview panel until `NEXT_PUBLIC_ASKBRIDGE_SITE_ID` is set.
- Contact is a `mailto:` link.
- Analytics: none is loaded. The cookie banner already gates non-essential scripts behind "Accept all".
