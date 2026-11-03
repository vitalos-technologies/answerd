# Data model

Snapshot: `42b8c33`, 3 Nov 2026. Back to [README](README.md).

This repo has no database. The entity model below comes from `lib/types.ts`, which follows the data model section of `docs/answerd-spec.md`. Today these entities live in three places:

| Where | What | Source |
| --- | --- | --- |
| Prototype, in the browser | One zustand store persisted to `localStorage` (key `answerd-demo-v1`): every entity, the session, the demo clock and the hub's settings. Seeded deterministically: 60 listings across the claimed, seeded and Places layers, 300 reviews, threads, calls, bookings and quotes. Reset demo data restores the seed | `lib/store.ts`, `lib/seed.ts` |
| Website, at build time | A server-only port of the same seed (same random sequence, so names and ratings match) renders the SEO and listing pages. Mock sign-in and billing keep their state in `sessionStorage` | `marketing-site/lib/data/seed.ts`, `marketing-site/lib/demo-session.ts` |
| MVP, in Workforce | Postgres inside the Workforce marketplace module. A Business maps one to one to a Workforce tenant (`Business.tenantId`). Staging uses a Supabase free project | `docs/answerd-spec.md` (Data model), Workforce `infrastructure/answerd/README.md` |

## Accounts, listings and businesses

```mermaid
erDiagram
  USER ||--o| CUSTOMER_PROFILE : "has"
  USER ||--o{ BUSINESS_MEMBER : "joins as"
  USER ||--o{ CLAIM : "starts"
  CATEGORY |o--o{ CATEGORY : "parent of"
  CATEGORY }o--o{ LISTING : "classifies"
  LISTING ||--o{ SOURCE_REF : "sourced from"
  LISTING ||--o{ CLAIM : "claimed through"
  LISTING ||--o| BUSINESS : "becomes on claim"
  BUSINESS ||--o{ BUSINESS_MEMBER : "has"
  BUSINESS ||--o{ SERVICE : "offers"
  BUSINESS ||--|| AVAILABILITY : "sets"
  BUSINESS ||--|| SERVICE_AREA : "covers"
  BUSINESS ||--o{ CREDENTIAL : "holds"
  USER {
    ID id PK
    string phone
    string_array authProviders
    StaffRole staffRole
    boolean marketingConsent
  }
  CUSTOMER_PROFILE {
    ID userId PK
    ID_array savedListingIds
    string referralCode
    int noShowCount
  }
  CATEGORY {
    ID id PK
    string slug UK
    ID parentId FK
    string_array sicCodes
    string_array placesTypes
  }
  LISTING {
    ID id PK
    string slug UK
    Layer layer
    ID_array categoryIds
    string postcodeDistrict
    ID businessId FK
    string placeId
  }
  SOURCE_REF {
    ID listingId FK
    string source
    string externalId
    ISO fetchedAt
  }
  CLAIM {
    ID id PK
    ID listingId FK
    ID userId FK
    string method
    string status
    ID decidedBy FK
  }
  BUSINESS {
    ID id PK
    ID listingId FK
    string tenantId
    string legalType
    string status
    string bookingMode
  }
  BUSINESS_MEMBER {
    ID id PK
    ID businessId FK
    ID userId FK
    string role
  }
  SERVICE {
    ID id PK
    ID businessId FK
    PriceType priceType
    int pricePence
    boolean bookable
  }
  AVAILABILITY {
    ID businessId PK
    string slotMode
    int leadTimeMin
    int maxPerDay
  }
  SERVICE_AREA {
    ID businessId PK
    string basePostcode
    string mode
    int radiusMiles
  }
  CREDENTIAL {
    ID id PK
    ID businessId FK
    CredentialType type
    string status
    ISO expiresAt
  }
```

- A Listing is what customers see. A Business exists only once a listing is claimed.
- Listings come in three layers: `claimed`, `seeded` (from Companies House and OpenStreetMap) and `places` (Google gap-fill). Places listings keep only the `placeId`; everything else is fetched at display time.

## Conversations, bookings and reviews

```mermaid
erDiagram
  LISTING ||--o{ THREAD : "receives"
  USER |o--o{ THREAD : "customer in"
  THREAD ||--o{ MESSAGE : "contains"
  THREAD ||--o{ QUOTE : "carries"
  LISTING ||--o{ CALL : "tracked number"
  LISTING ||--o{ ENQUIRY : "counts toward gate"
  LISTING ||--o{ BOOKING : "takes"
  SERVICE ||--o{ BOOKING : "booked as"
  QUOTE |o--o{ BOOKING : "accepted into"
  BOOKING ||--o{ BOOKING_EVENT : "timeline"
  BOOKING |o--o| REVIEW : "reviewed in"
  CALL |o--o| REVIEW : "reviewed in"
  LISTING ||--o{ REVIEW : "has"
  USER ||--o{ REFERRAL : "refers"
  THREAD {
    ID id PK
    ID listingId FK
    ID customerId FK
    string channel
    string status
    boolean deskActive
  }
  MESSAGE {
    ID id PK
    ID threadId FK
    MessageAuthor author
    MessageCard card
    ISO createdAt
  }
  CALL {
    ID id PK
    ID listingId FK
    string trackedNumber
    string callerMasked
    string outcome
    int durationSec
  }
  ENQUIRY {
    ID id PK
    ID listingId FK
    string kind
    Layer layer
    ISO at
  }
  QUOTE {
    ID id PK
    ID threadId FK
    int totalPence
    ISO validUntil
    string status
  }
  BOOKING {
    ID id PK
    ID listingId FK
    ID serviceId FK
    ID customerId FK
    BookingStatus status
    string createdBy
    ISO startAt
  }
  BOOKING_EVENT {
    ID id PK
    ID bookingId FK
    string type
    string actor
    ISO at
  }
  REVIEW {
    ID id PK
    ID listingId FK
    ID bookingId FK
    ID callId FK
    int stars
    string status
  }
  REFERRAL {
    ID id PK
    ID referrerUserId FK
    string kind
    string code
  }
```

- Desk messages always carry `author = desk`, so AI-written content is labelled everywhere.
- Enquiries (calls, messages, bookings, profile views, search appearances) feed stats, unclaimed digests and the monetise gate: a business is never asked to pay before 10 enquiries.
- A review needs a completed booking or a tracked call of more than 60 seconds.

## Desk, billing and platform

```mermaid
erDiagram
  BUSINESS ||--|| DESK_CONFIG : "configures"
  BUSINESS ||--o{ SUBSCRIPTION : "pays through"
  BUSINESS ||--o{ INVOICE : "is billed"
  BUSINESS |o--o{ FEATURED_SLOT : "holds"
  CATEGORY ||--o{ FEATURED_SLOT : "offers per area"
  USER ||--o{ NOTIFICATION : "receives"
  USER ||--o{ AUDIT_EVENT : "acts in"
  USER |o--o{ REPORT : "files"
  USER ||--o{ DATA_REQUEST : "requests"
  SETTINGS ||--o{ RULE_VERSION : "versions pricing rules"
  SETTINGS ||--o{ INTEGRATION : "tracks"
  DESK_CONFIG {
    ID businessId PK
    DeskStatus status
    string number
    string voice
    json handoffRules
    ISO trialEndsAt
  }
  SUBSCRIPTION {
    ID id PK
    ID businessId FK
    string plan
    string status
    string stripeId
  }
  INVOICE {
    ID id PK
    ID businessId FK
    int amountPence
    string status
  }
  FEATURED_SLOT {
    ID id PK
    ID categoryId FK
    string areaCode
    int position
    ID businessId FK
  }
  NOTIFICATION {
    ID id PK
    ID userId FK
    string event
    Mode mode
    ISO readAt
  }
  AUDIT_EVENT {
    ID id PK
    ID actorId FK
    string action
    string targetType
    string reason
  }
  REPORT {
    ID id PK
    string target
    ID targetId
    string status
  }
  DATA_REQUEST {
    ID id PK
    ID userId FK
    string kind
    string status
  }
  SETTINGS {
    boolean killSwitch
    int placesCapPence
    json platform
  }
  RULE_VERSION {
    ID id PK
    int version
    json rules
    ISO effectiveAt
  }
  INTEGRATION {
    ID id PK
    string name
    string status
    ISO lastRotatedAt
  }
```

- Every admin write needs a reason and creates an AuditEvent.
- Settings hold the platform switches, including the desk kill switch and the daily Places spend cap; pricing rules are versioned.

## Rules on the data

| Rule | Where it is enforced today |
| --- | --- |
| Money is stored in pence as integers, with VAT stated | `Service.pricePence`, `Quote.totalPence`, `Invoice.amountPence` |
| Google results are never stored or cached into a page; only place IDs are kept, and Places coordinates expire after 30 days | Spec; `marketing-site/components/web/google-results.tsx` fetches them after load with no-store |
| Times are London time; the demo clock starts Mon 26 Oct 2026, 9am | `lib/time.ts`, `lib/store.ts` (`advanceClock`, `tick`) |
| Due work runs when the demo clock advances: reminders, two-hour booking-request expiry with three alternatives, quote follow-ups at 2 and 7 days, trial countdowns, digests, auto-approvals | `lib/store.ts` (`tick`) |
| Demo phone numbers are drawn from the Ofcom drama range | `lib/seed.ts`, README personas |

## Type inventory (`lib/types.ts`, 50 interfaces)

| Group | Interfaces |
| --- | --- |
| Accounts and sessions | User, SavedPlace, CustomerProfile, Session, Impersonation, SignInEvent, DataRequest |
| Catalogue | Category, Listing, SourceRef, Photo |
| Business setup | Business, BusinessMember, Service, DayHours, Holiday, Availability, ServiceArea, Credential, Claim, BlockTime |
| Conversations | Thread, Message, TranscriptLine, Call, Enquiry, Quote, QuoteLine |
| Bookings and reviews | Booking, BookingEvent, BookingDraft, Review, Referral |
| AI desk | QnA, DeskConfig, DeskRun |
| Billing and rules | Subscription, Invoice, FeaturedSlot, PricingRules, RuleVersion |
| Platform and admin | Notification, Report, AuditEvent, SupportTicket, ImportJob, PlacesDay, Settings, PlatformSwitches, Integration |

The API's own types for API mode are in `lib/api/types.ts` and `marketing-site/lib/api/types.ts`; the observed contract is in `docs/answerd-api-contract.md`.
