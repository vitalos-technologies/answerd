# Flows and security

Snapshot: `42b8c33`, 3 Nov 2026. Back to [README](README.md).

## Key flows

### 1. Sign-in by phone code and realtime (prototype, API mode)

The browser cannot call the API directly because the API's CORS allows only the production website, so the prototype goes through its own same-origin proxy. The realtime socket is relayed as Server-Sent Events for the same reason.

```mermaid
sequenceDiagram
  autonumber
  actor U as Demo user
  participant P as Prototype in the browser
  participant X as Proxy route /api/answerd
  participant A as Answerd API
  participant R as Realtime relay route
  U->>P: Enter mobile number (C-06)
  P->>X: POST v1/auth/otp/start with device id
  X->>A: Forward path, body and allowlisted headers
  A-->>U: SMS code, allowlisted test numbers only on staging
  U->>P: Enter the 6-digit code (C-07)
  P->>X: POST v1/auth/otp/verify
  X->>A: Forward
  A-->>P: Access and refresh tokens
  Note over P: Prototype keeps tokens in localStorage. The Expo app will use the keychain.
  P->>X: GET v1/me to learn the user's businesses
  P->>R: EventSource with the access token
  R->>A: WebSocket upgrade to v1/realtime with a bearer header
  A-->>R: Realtime events
  R-->>P: Server-Sent Events update the store
```

### 2. A booking mirrored to the API (prototype)

Every store action runs locally first, so the demo stays instant and every journey works in mock mode. In API mode, `installBridge` wraps the 37 actions that have an endpoint and mirrors them.

```mermaid
sequenceDiagram
  autonumber
  actor C as Customer persona
  participant S as Demo store
  participant B as API bridge
  participant X as Proxy route /api/answerd
  participant A as Answerd API
  participant H as Hub data source log
  C->>S: Confirm the booking (C-27)
  S->>S: Run the action locally, the UI updates at once
  alt Mock mode, the default
    Note over S,B: The bridge is not installed. Nothing leaves the browser.
  else API mode and the listing has an API id
    S->>B: Wrapped action fires after the local run
    B->>X: POST v1/bookings with the bearer token
    X->>A: Forward, no-store
    A-->>X: Created booking
    X-->>B: Response with allowlisted headers
    Note over B,X: A 401 refreshes the token once and retries.<br/>A 502 to 504 waits for staging to wake.
    B->>B: Map the local id to the API id
    B->>H: Log method, path, status and timing
    A--)S: Later events arrive through the realtime relay
  end
```

### 3. Website contact form to the Vitalos admin inbox

```mermaid
sequenceDiagram
  autonumber
  actor V as Visitor
  participant F as Contact page
  participant T as Cloudflare Turnstile
  participant C as Site route /api/contact
  participant I as Vitalos admin inbox
  V->>F: Fill in topic, name, email and message
  opt Turnstile site key is set
    F->>T: Render the challenge
    T-->>F: Token
  end
  F->>C: POST JSON from the same origin
  C->>C: Check Origin, 32 KB limit and field rules
  alt Enquiry secret not set on the Worker
    C-->>F: 503, the page shows the email address instead
  else Secret set
    C->>I: POST web form with a timestamp and HMAC-SHA256 signature
    I->>I: Verify signature, honeypot, Turnstile and hourly limit
    I-->>C: 201 with a reference, or 200 accepted
    C-->>F: Thank-you with the reference
  end
```

### 4. On-demand revalidation (website, API mode)

```mermaid
sequenceDiagram
  autonumber
  participant A as Answerd API
  participant R as Site route /api/revalidate
  participant N as Next.js cache tags
  actor V as Visitor
  participant W as Website Worker
  Note over A,W: API mode only. Production does not set the API URL, so this path is dormant today.
  A->>R: POST listingSlug or listingId with timestamp and signature
  R->>R: Verify HMAC-SHA256 within a 5 minute window
  alt Missing secret, bad or stale signature
    R-->>A: 503 or 401
  else Valid
    opt Only an id was sent
      R->>A: GET the listing to find its slug
    end
    R->>N: Expire the listing and search tags now
    R-->>A: revalidated true with the tags
  end
  V->>W: Next visit to the listing page
  W->>A: Fetch fresh listing data
  W-->>V: Freshly rendered page
```

### 5. Ask Answerd (prototype)

```mermaid
sequenceDiagram
  autonumber
  actor C as Customer or guest
  participant Q as Ask Answerd chat (C-38)
  participant K as Prototype route /api/ask
  participant M as Anthropic API
  participant S as Scripted agent in lib/askAnswerd.ts
  Q->>K: GET, is the model switched on
  K-->>Q: enabled only when the Worker has an API key
  C->>Q: Describe the job
  Note over C,Q: Guests get 5 messages, then sign in (Q-06)
  alt Model switched on
    Q->>K: POST the first 1000 characters
    K->>M: Structured parse into categories, postcode, urgency and emergency
    M-->>K: Parsed understanding
    K-->>Q: Understanding
  else No key, refusal or error
    K-->>Q: Scripted mode
  end
  Q->>S: askTurn with the store and any understanding
  S-->>C: Matching businesses, or the safety line for gas, danger to life, power cuts or flooding
```

Other journeys are scripted end to end in the Playwright suite (`tests/e2e/j1` to `j10`): the booking loop, a missed call to a paused desk, desk slot booking, a desk call seen everywhere, claim and desk setup, the monetise gate, admin moderation, the gas safety card, super admin pricing and impersonation.

## Trust boundaries

```mermaid
flowchart LR
  subgraph untrusted["Untrusted: browsers"]
    v(["Visitor or demo user"]):::person
    ls[("Browser storage<br/>demo data, prototype API tokens")]:::db
  end
  subgraph edge["Trusted: Cloudflare Workers"]
    site["Website routes<br/>origin check, validation, HMAC"]:::svc
    proto["Prototype routes<br/>v1-only proxy, header allowlist, ask"]:::svc
    wsec["Worker secrets<br/>never sent to the browser"]:::sec
  end
  subgraph vitalos["Other Vitalos systems"]
    api["Answerd API<br/>bearer tokens, CORS to the website only"]:::ext
    inbox["Admin inbox<br/>verifies signature and Turnstile"]:::ext
  end
  subgraph third["Third parties"]
    askb["Askbridge widget"]:::ext
    claude["Anthropic API"]:::ext
  end
  v -- "TLS" --> site
  v -- "TLS" --> proto
  site -- "HMAC-signed relay" --> inbox
  site -- "tokens from httpOnly cookies" --> api
  proto -- "bearer token" --> api
  proto -- "server-side key" --> claude
  v -. "only after consent" .-> askb
classDef person fill:#081a2a,stroke:#081a2a,color:#ffffff
classDef svc fill:#e6f4f2,stroke:#007e76,color:#081a2a
classDef db fill:#fff6e0,stroke:#9a6700,color:#081a2a
classDef ext fill:#f1f3f5,stroke:#536273,color:#26333f,stroke-dasharray:4 3
classDef sec fill:#fdecea,stroke:#c9372c,color:#081a2a
```

## Controls

| Area | How it works | Source |
| --- | --- | --- |
| Authentication, mock mode | Personas sign in instantly from the hub. Any UK mobile works; 000000 is always wrong and any other six digits pass. Five wrong codes lock that number for 15 minutes in the store | `README.md`, `lib/store.ts` |
| Authentication, API mode | Phone number and SMS code through the Answerd API (`/v1/auth/otp/*`). On staging only allowlisted test numbers get a code. Clients refresh the token once on a 401 | `lib/api/client.ts`, `marketing-site/lib/api/client.ts` |
| Session storage | Website: access and refresh tokens in httpOnly cookies (`answerd_at` 1 hour, `answerd_rt` 30 days, SameSite Lax, Secure in production), set only by Server Actions. Prototype: tokens in `localStorage`, as a stand-in for the Expo app's keychain | `marketing-site/lib/api/actions.ts`, `lib/api/session.ts` |
| Authorisation | Enforced by the Answerd API in API mode. The prototype mirrors the spec's permission table (guest, customer, staff, owner, support, admin) in the UI only, which is not a security boundary; it holds no real data. Every admin write needs a reason and is audited | `docs/answerd-spec.md` (Roles and sign-in), `lib/store.ts` |
| Proxy hardening | Forwards only paths under `/v1`, rejects `..` and empty segments, passes an allowlist of request and response headers, never caches, times out after 100 seconds. Off when no API URL is set | `app/api/answerd/[...path]/route.ts` |
| Inbound webhook | `/api/revalidate` checks an HMAC-SHA256 signature over the timestamp and raw body with a constant-time compare and a 5 minute window; answers 503 when no secret is set | `marketing-site/app/api/revalidate/route.ts`, `marketing-site/lib/api/signature.ts` |
| Outbound relay | `/api/contact` checks the Origin, caps the body at 32 KB, validates every field and rejects control characters, keeps a honeypot, forwards an optional Turnstile token, signs the relay with HMAC-SHA256 and never logs the body | `marketing-site/app/api/contact/route.ts`, `marketing-site/lib/enquiry.ts` |
| Secrets | Worker secrets for the contact relay and revalidation (website) and an optional model key (prototype); GitHub Actions secrets for the Cloudflare token and staging test numbers; GitHub variables for the account id and API URLs. The deploy checks they exist without printing them. `NEXT_PUBLIC_*` values (site keys, URLs) are public by design | `.github/workflows/deploy.yml`, `marketing-site/README.md` |
| Privacy and consent | The cookie banner gives equal weight to Accept all, Reject non-essential and Manage. The Askbridge widget loads only after the visitor allows chat; nothing third-party loads before a choice. Google results carry attribution and are never cached into a page | `marketing-site/components/site/askbridge.tsx`, `marketing-site/components/site/cookie-banner.tsx` |
| AI safety rules | The desk never quotes outside listed prices or books outside the service area; emergencies get the safety line and no booking; AI-written messages are always labelled. The optional model only parses a message into fields; the reply always comes from the scripted agent | `lib/deskScripts.ts`, `lib/askAnswerd.ts`, `app/api/ask/route.ts` |
| Supply chain | `deploy.yml` pins third-party actions to commit SHAs. CI runs on GitHub-hosted runners with `contents: read` and `packages: read` | `.github/workflows/` |

## Risks and gaps

| Risk | Notes |
| --- | --- |
| No security headers | Neither `next.config.ts` sets a Content-Security-Policy, frame or referrer policy, and there is no `_headers` file; only Cloudflare's defaults apply |
| Prototype token handling | In API mode the prototype keeps tokens in `localStorage` and passes the access token to its realtime relay in the query string, because `EventSource` cannot set headers. Acceptable for a demo that runs in mock mode in production; it must not carry over to the MVP |
| Unpinned actions | `ci.yml` and `update-answerd-client.yml` use version tags rather than commit SHAs |
| API contract not confirmed | Authenticated request bodies are unverified because staging answers 401 before validating. The two hand-written clients stand in for `@vitalos/answerd-client` until the package can be installed (issue #2), so they can drift from the backend |
| Staging cold starts | Render's free tier sleeps after 15 minutes, so the first API-mode call can take about a minute; clients wait up to 90 seconds |
