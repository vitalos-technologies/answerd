# Answerd API contract, as observed on staging

**Status: a stand-in.** The source of truth is `docs/answerd/backend-spec.md` in the private `workforce` repo, plus the OpenAPI contract inside `@vitalos/answerd-client`. Neither could be read from this repo yet (issue #2). When the spec arrives:
- copy it here as `docs/backend-spec.md`;
- delete this file;
- swap the hand-written clients for the package. They are `lib/api/client.ts` and `marketing-site/lib/api/client.ts`.

This file records what was confirmed against `https://answerd-staging-api.onrender.com` on 27 Oct 2026.
- **Public routes** were checked against live responses.
- **Authenticated routes** were only confirmed to exist. They answer 401 before validating, so their request bodies are unverified.

## Basics

- **Base:** `/v1`, JSON.
- **Errors:** `application/problem+json`, in the shape `{ type, title, status, code, detail, errors?: [{ path, message }] }`.
- **Codes seen:** `NOT_FOUND`, `VALIDATION_FAILED`, `UNAUTHENTICATED`, `LOCATION_REQUIRED`, `POSTCODE_NOT_FOUND`, `LISTING_NOT_FOUND`.
- **Auth:** `Authorization: Bearer <accessToken>`.
- **CORS:** only `https://answerd.vitalos.co.uk` is allowed. The prototype and localhost go through a same-origin proxy (`app/api/answerd/[...path]`).
- **Hosting:** staging runs on Render's free tier. It sleeps after 15 minutes idle and takes about a minute to wake.

## Public (verified)

| Route | Notes |
| --- | --- |
| `GET /v1/categories` | `{ items: [{ id, slug, name, plural, parentId, icon }] }`, same slugs as the prototype's taxonomy |
| `GET /v1/search` | Query: `q`, `category` (slug), `postcode` or `lat` + `lng`, `radiusMiles` (default 5), `sort` = `best` \| `nearest` \| `top_rated`, `cursor`, `limit`. Needs a location (`LOCATION_REQUIRED`). Returns `{ query, items, nextCursor, counts: { claimed, seeded, places }, gapFill }` |
| `GET /v1/listings/{slug or id}` | Full listing: services (pence), hours, `serviceArea`, credentials, photos, `reviewSummary.distribution` (index 0 = 1 star), `poweredByGoogle`, `attribution` |
| `GET /v1/listings/{id}/reviews` | `{ items: [{ id, authorName, stars, aspects, body, photos, reply, createdAt }] }` (id must be a UUID) |
| `GET /v1/listings/{id}/availability` | Query: `serviceId`, `from`, `to` (dates). Returns `{ serviceId, days: [{ date, slots: [{ startAt, endAt, label, window }] }] }` |
| `GET /v1/suggest?q=` | `{ items: [{ kind: "service" \| "business", label, categorySlug? , listingSlug? }] }` |
| `POST /v1/tools/search` | `{ query }`, the public search tool for Chat with Answerd. Put the place in the text ("… near SE25"); with no place it returns no items |

Search items carry `layer` (`claimed`, `seeded` or `places`).
- `places` items are Google results. They have no `id` or `slug`, only `placeId`, and `poweredByGoogle: true`.
- Store their place IDs only.
- Render them with Google attribution.
- Never cache them into a page.

## Auth (verified shapes)

| Route | Body |
| --- | --- |
| `POST /v1/auth/otp/start` | `{ phone (E.164), deviceId }` → `{ expiresAt, resendAfterSec }` |
| `POST /v1/auth/otp/verify` | `{ phone, code, deviceId }` → session (tokens). Staging accepts `123456` for allowlisted test numbers only |
| `POST /v1/auth/refresh` | `{ refreshToken }` |
| `POST /v1/auth/logout` | authenticated |
| `GET /v1/realtime` | WebSocket; "Connect with a valid access token". The token parameter isn't confirmed; the prototype sends `?access_token=` |

## Authenticated routes (exist; bodies unverified)

- **Me:** `GET|PATCH|DELETE /v1/me`, `GET /v1/me/saved`, `GET /v1/me/referrals`, `POST /v1/me/data-export`, `GET /v1/notifications`, `POST /v1/notifications/{id}/read`.
- **Threads and quotes:** `GET|POST /v1/threads`, `GET|POST /v1/threads/{id}/messages`, `POST /v1/threads/{id}/quotes`, `POST /v1/quotes/{id}/accept|decline`.
- **Bookings:** `GET|POST /v1/bookings`, `GET /v1/bookings/{id}`, `POST /v1/bookings/{id}/cancel|reschedule|accept|decline|no-show|status`.
- **Reviews:** `POST /v1/reviews`, `POST /v1/reviews/{id}/reply`.
- **Listing actions:** `POST /v1/listings/{id}/save|report|recommend`.
- **Claims:** `POST /v1/claims`, `GET /v1/claims/{id}`, `POST /v1/claims/{id}/verify/sms|call|director|document`, `POST /v1/claims/{id}/dispute`.
- **Businesses:**
  - `POST /v1/businesses`, `GET|PATCH /v1/businesses/{id}`;
  - `…/services` (`GET|POST`), `…/services/{id}` (`PATCH|DELETE`);
  - `…/availability`, `…/service-area` (`GET|PUT`), `…/credentials`, `…/photos` (`GET|POST`);
  - `…/desk` (`GET|PATCH`), `…/desk/qna` (`GET|POST`), `…/desk/qna/{id}` (`PATCH|DELETE`), `…/desk/trial`, `…/desk/test-call`;
  - `…/members` (`GET|POST`), `…/members/{id}` (`DELETE`), `…/transfer`, `…/inbox`, `…/stats`, `…/featured`.
- **Invites:** `POST /v1/invites/{id}/accept`.
- **Billing:** `GET /v1/businesses/{id}/billing`, `POST …/billing/checkout-session`, `POST …/billing/portal-session`.
- **Uploads and devices:** `POST /v1/uploads`, `POST /v1/devices`.
- **Admin:** `GET /v1/admin/claims|credentials|reviews|reports|listings|audit|settings`, `POST /v1/admin/claims/{id}/decide`.

`lib/api/bridge.ts` maps the prototype's store actions onto these routes.
