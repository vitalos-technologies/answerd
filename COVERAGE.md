# Coverage

Every ID in `docs/answerd-spec.md`, generated from `lib/screens.ts` by `pnpm coverage`.

**165 of 165 built.** Customer app: 48/48 · Business mode: 41/41 · Web: 27/27 · Admin console: 23/23 · Super admin: 10/10 · AI desk behaviours: 10/10 · Ask Answerd: 6/6

## Prototype-wide decisions

- Demo calendar: the spec's example dates (Mon 27 Oct, Thu 30 Oct 2026) fall on the wrong weekdays, so the demo uses the real 2026 calendar. The clock starts on Mon 26 Oct 2026 at 9am London time, and "Thu" in the journeys is Thu 29 Oct.
- Codes: 000000 is always the wrong code; any other 6 digits are accepted.
- No real calls, texts, payments or audio: calls, SMS, Stripe and voice are simulated in the shared store.

## Customer app

| ID | Screen | Route or trigger | Status | Deviation from the spec |
| --- | --- | --- | --- | --- |
| C-01 | Splash | `/app/splash` | Built |  |
| C-02 | Welcome | `/app/welcome` | Built |  |
| C-03 | Location | `/app/onboarding/location` | Built |  |
| C-04 | Notifications permission | `/app/onboarding/notifications` | Built |  |
| C-05 | Sign-in sheet | `/app/sign-in` | Built |  |
| C-06 | Phone number | `/app/sign-in/phone` | Built |  |
| C-07 | SMS code | `/app/sign-in/code` | Built |  |
| C-08 | About you | `/app/sign-in/about-you` | Built |  |
| C-09 | Home | `/app` | Built |  |
| C-10 | All categories | `/app/categories` | Built |  |
| C-11 | Search | `/app/search` | Built |  |
| C-12 | Results list | `/app/results` | Built |  |
| C-13 | Results map | `/app/results/map` | Built |  |
| C-14 | Filters sheet | `/app/results/filters` | Built |  |
| C-15 | Location picker | `/app/location` | Built |  |
| C-16 | Listing (claimed) | `/app/b/[slug]` | Built |  |
| C-17 | Listing (unclaimed) | `/app/b/[slug]` | Built |  |
| C-18 | Photo gallery | `/app/b/[slug]/photos` | Built |  |
| C-19 | Reviews | `/app/b/[slug]/reviews` | Built |  |
| C-20 | Call sheet | `/app/b/[slug]/call` | Built |  |
| C-21 | After the call | `/app/b/[slug]/after-call` | Built |  |
| C-22 | Message thread | `/app/messages/[threadId]` | Built |  |
| C-23 | New enquiry | `/app/b/[slug]/enquiry` | Built |  |
| C-24 | Book: service | `/app/b/[slug]/book` | Built |  |
| C-25 | Book: time | `/app/b/[slug]/book/time` | Built |  |
| C-26 | Book: details | `/app/b/[slug]/book/details` | Built |  |
| C-27 | Book: confirm | `/app/b/[slug]/book/confirm` | Built |  |
| C-28 | Booked | `/app/bookings/[id]/booked` | Built |  |
| C-29 | Bookings | `/app/bookings` | Built |  |
| C-30 | Booking detail | `/app/bookings/[id]` | Built |  |
| C-31 | Reschedule | `/app/bookings/[id]/reschedule` | Built |  |
| C-32 | Cancel | `/app/bookings/[id]/cancel` | Built |  |
| C-33 | Messages | `/app/messages` | Built |  |
| C-34 | Write a review | `/app/bookings/[id]/review` | Built |  |
| C-35 | Review posted | `/app/bookings/[id]/review/done` | Built |  |
| C-36 | Invite friends | `/app/account/invite` | Built |  |
| C-37 | Saved | `/app/saved` | Built |  |
| C-38 | Ask Answerd | `/app/ask` | Built |  |
| C-39 | Account | `/app/account` | Built |  |
| C-40 | Edit profile | `/app/account/profile` | Built |  |
| C-41 | Saved places | `/app/account/places` | Built |  |
| C-42 | Notification settings | `/app/account/notifications` | Built |  |
| C-43 | Privacy and data | `/app/account/privacy` | Built |  |
| C-44 | Help | `/app/help` | Built |  |
| C-45 | Report | `/app/report` | Built |  |
| C-46 | Notifications | `/app/notifications` | Built |  |
| C-47 | Delete account | `/app/account/delete` | Built |  |
| C-48 | Offline and errors | `/app/states` | Built |  |

## Business mode

| ID | Screen | Route or trigger | Status | Deviation from the spec |
| --- | --- | --- | --- | --- |
| B-01 | Find your business | `/app/biz/claim` | Built |  |
| B-02 | Is this you? | `/app/biz/claim/[listingId]` | Built |  |
| B-03 | Add your business | `/app/biz/claim/new` | Built |  |
| B-04 | Verify ownership | `/app/biz/claim/[listingId]/verify` | Built |  |
| B-05 | Enter code | `/app/biz/claim/[listingId]/verify/code` | Built |  |
| B-06 | Director check | `/app/biz/claim/[listingId]/verify/director` | Built |  |
| B-07 | Upload a document | `/app/biz/claim/[listingId]/verify/document` | Built |  |
| B-08 | You're in | `/app/biz/claim/[listingId]/done` | Built |  |
| B-09 | Setup checklist | `/app/biz/setup` | Built |  |
| B-10 | Business details | `/app/biz/profile/details` | Built |  |
| B-11 | Services and prices | `/app/biz/profile/services` | Built |  |
| B-12 | Edit service | `/app/biz/profile/services/[serviceId]` | Built |  |
| B-13 | Hours and availability | `/app/biz/profile/hours` | Built | The data model has one opening range per day, so the overlap check covers a closing time at or before the opening time and overlapping holidays. Split shifts are not supported. |
| B-14 | Service area | `/app/biz/profile/area` | Built |  |
| B-15 | Photos | `/app/biz/profile/photos` | Built |  |
| B-16 | Credentials | `/app/biz/profile/credentials` | Built | As well as A-07 approval, credentials uploaded during the demo are auto-verified on the hub's +1 day so the badge can be shown without the admin console. |
| B-17 | Booking settings | `/app/biz/profile/booking` | Built |  |
| B-18 | Today | `/app/biz` | Built |  |
| B-19 | Inbox | `/app/biz/inbox` | Built |  |
| B-20 | Conversation | `/app/biz/inbox/[threadId]` | Built |  |
| B-21 | Call detail | `/app/biz/calls/[callId]` | Built |  |
| B-22 | Booking request | `/app/biz/requests/[bookingId]` | Built |  |
| B-23 | Diary | `/app/biz/diary` | Built |  |
| B-24 | Job | `/app/biz/jobs/[bookingId]` | Built |  |
| B-25 | Add to diary | `/app/biz/diary/new` | Built |  |
| B-26 | Send quote | `/app/biz/inbox/[threadId]/quote` | Built |  |
| B-27 | Reviews | `/app/biz/reviews` | Built |  |
| B-28 | Stats | `/app/biz/stats` | Built | Conversion is calls and messages that led to a booking. Bookings come from Booking records; calls and messages from Enquiry records. |
| B-29 | Share your profile | `/app/biz/share` | Built | The printable card opens at /print/review-card (A6 print styling). |
| B-30 | AI desk intro | `/app/biz/desk/intro` | Built |  |
| B-31 | Desk setup | `/app/biz/desk/setup` | Built |  |
| B-32 | Desk | `/app/biz/desk` | Built |  |
| B-33 | Test call | `/app/biz/desk/test-call` | Built |  |
| B-34 | What the desk knows | `/app/biz/desk/knowledge` | Built |  |
| B-35 | Handoff rules | `/app/biz/desk/handoff` | Built |  |
| B-36 | Plan and billing | `/app/biz/billing` | Built | Upgrade and Get Featured open the web checkout at /dashboard/billing/checkout (W-18). The gated button names the missing half of the gate: "Available after 10 enquiries" (also when both halves are missing), "Available from Fri 30 Oct" when only the date is missing, and "Keep your desk for £49/month" once open (same on B-37 and W-18). Numbers and prices come from S-06. |
| B-37 | Featured | `/app/biz/featured` | Built |  |
| B-38 | Team | `/app/biz/team` | Built |  |
| B-39 | Business notifications | `/app/biz/notifications` | Built |  |
| B-40 | Business settings | `/app/biz/settings` | Built |  |
| B-41 | More | `/app/biz/more` | Built |  |

## Web

| ID | Screen | Route or trigger | Status | Deviation from the spec |
| --- | --- | --- | --- | --- |
| W-01 | Home | `/` | Built |  |
| W-02 | Search results | `/search` | Built |  |
| W-03 | Category hub | `/[category]` | Built |  |
| W-04 | Category in area | `/[category]/[area]` | Built |  |
| W-05 | Area hub | `/areas/[area]` | Built |  |
| W-06 | Listing (claimed) | `/b/[slug]` | Built |  |
| W-07 | Listing (unclaimed) | `/b/[slug]` | Built |  |
| W-08 | How it works | `/how-it-works` | Built |  |
| W-09 | For businesses | `/for-businesses` | Built |  |
| W-10 | Pricing | `/pricing` | Built |  |
| W-11 | Claim or add | `/claim` | Built | Guests sign in through W-12 first (with next=), which handles the new-account name step. |
| W-12 | Sign in | `/sign-in` | Built |  |
| W-13 | Dashboard: Overview | `/dashboard` | Built |  |
| W-14 | Dashboard: Inbox | `/dashboard/inbox` | Built |  |
| W-15 | Dashboard: Diary | `/dashboard/diary` | Built |  |
| W-16 | Dashboard: Profile | `/dashboard/profile` | Built |  |
| W-17 | Dashboard: AI desk | `/dashboard/desk` | Built |  |
| W-18 | Dashboard: Billing | `/dashboard/billing` | Built |  |
| W-19 | Dashboard: Team and settings | `/dashboard/team` | Built |  |
| W-20 | Help centre | `/help` | Built |  |
| W-21 | About | `/about` | Built |  |
| W-22 | Legal | `/legal/[doc]` | Built |  |
| W-23 | Cookie banner | Every public page on first visit (/?cookies=reset to show it again) | Built |  |
| W-24 | Not found and errors | `/404` | Built |  |
| W-25 | Chat with Answerd | Every public page (/?chat=open) | Built |  |
| W-26 | Get the app | `/get-the-app` | Built |  |
| W-27 | Review from link | `/review/[token]` | Built | A review token is the ID of a completed booking and is valid for 30 days after the job. |

## Admin console

| ID | Screen | Route or trigger | Status | Deviation from the spec |
| --- | --- | --- | --- | --- |
| A-01 | Sign in | `/admin/sign-in` | Built |  |
| A-02 | Overview | `/admin` | Built |  |
| A-03 | Listings | `/admin/listings` | Built |  |
| A-04 | Listing detail | `/admin/listings/[id]` | Built |  |
| A-05 | Merge | `/admin/listings/[id]/merge` | Built |  |
| A-06 | Claims queue | `/admin/claims` | Built | List with a detail pane, so the evidence sits beside the actions. |
| A-07 | Credentials queue | `/admin/credentials` | Built | List with a detail pane; the Expiring in 30 days view uses the data table. |
| A-08 | Reviews | `/admin/reviews` | Built |  |
| A-09 | Reports | `/admin/reports` | Built |  |
| A-10 | Customers | `/admin/customers` | Built |  |
| A-11 | Businesses | `/admin/businesses` | Built |  |
| A-12 | Desk QA | `/admin/desk-qa` | Built | List with a detail pane showing the transcript. |
| A-13 | Imports | `/admin/imports` | Built |  |
| A-14 | Coverage | `/admin/coverage` | Built | A cell click filters A-03 (per the build prompt) rather than seeding the area. |
| A-15 | Taxonomy | `/admin/taxonomy` | Built |  |
| A-16 | Places spend | `/admin/places` | Built |  |
| A-17 | Billing | `/admin/billing` | Built |  |
| A-18 | Monetise gate | `/admin/gate` | Built |  |
| A-19 | Featured slots | `/admin/featured` | Built |  |
| A-20 | Content | `/admin/content` | Built |  |
| A-21 | Admin users | `/admin/users` | Built | Invited admin users appear in the list, but only the hub personas Temitope, Ife and Dan can sign in through A-01. Only a super admin can change a super admin. |
| A-22 | Audit log | `/admin/audit` | Built |  |
| A-23 | Settings | `/admin/settings` | Built | The desk kill switch accepts any 6-digit code except 000000, like every other code in the prototype. |

## Super admin

| ID | Screen | Route or trigger | Status | Deviation from the spec |
| --- | --- | --- | --- | --- |
| S-01 | Super admin overview | `/admin/super` | Built | Live figures are counted from store records. App installs, unit costs (S-03) and the price test (S-02) aren't in the demo data, so they are modelled or simulated from the seed and labelled as such. |
| S-02 | Revenue and plans | `/admin/super/revenue` | Built |  |
| S-03 | Costs and margins | `/admin/super/costs` | Built |  |
| S-04 | Growth | `/admin/super/growth` | Built |  |
| S-05 | Team and roles | `/admin/super/team` | Built | The permissions matrix edits what Admin and Support may do (useCan reads it); super-admin-only areas are fixed. |
| S-06 | Pricing and rules | `/admin/super/pricing` | Built | Rules are versioned in Settings.ruleVersions with a reason and an effective date. The version in force on the demo clock drives the monetise gate, request expiry, trial length, plan prices (B-36, B-37, W-10, W-18 and checkout), Featured slots and review rules. |
| S-07 | Platform switches | `/admin/super/switches` | Built | Switches are checked in one place (platformFor in lib/selectors.ts). Gap-fill is the A-23 flag; the desk kill switch stays in A-23. |
| S-08 | Integrations | `/admin/super/integrations` | Built |  |
| S-09 | Impersonate and data requests | `/admin/super/impersonate` | Built | Business views reuse the support view (read-only banner); customer views open the app as the customer with every control disabled. Both end on the demo clock or on returning to the console, and are audited. |
| S-10 | Security log | `/admin/super/security` | Built | Admin console sign-ins are recorded in the store (A-01 and the hub persona switch); the rest comes from the audit log. |

## AI desk behaviours

| ID | Screen | Route or trigger | Status | Deviation from the spec |
| --- | --- | --- | --- | --- |
| D-01 | Missed call answered | Hub › Simulate › D-01 (also B-33 test call, B-31 step 5, W-17 test call) | Built |  |
| D-02 | Text message | Hub › Simulate › D-02 | Built |  |
| D-03 | In-app message | Hub › Simulate › D-03; also any in-app message to a desk-live business (C-22, C-23) | Built |  |
| D-04 | Customer agrees a time | Hub › Simulate › D-04 | Built | Follows the business's B-17 booking mode: Request to book creates a request that expires in 2 hours. |
| D-05 | Quote follow-up | Hub › Simulate › D-05; also automatic at +2 and +7 days after a quote (B-26) | Built |  |
| D-06 | Review request | Hub › Simulate › D-06; also automatic when a job is marked Completed (B-24) | Built |  |
| D-07 | Daily digest | Hub › Simulate › D-07; also automatic each morning on the demo clock | Built |  |
| D-08 | Handoff to owner | Hub › Simulate › D-08 | Built |  |
| D-09 | Emergency | Hub › Simulate › D-09 gas, danger to life, power cut | Built |  |
| D-10 | Spam and sales calls | Hub › Simulate › D-10 | Built |  |

## Ask Answerd

| ID | Screen | Route or trigger | Status | Deviation from the spec |
| --- | --- | --- | --- | --- |
| Q-01 | Open | /app/ask (C-38) and the web chat panel (W-25) | Built |  |
| Q-02 | Understand | /app/ask: free-text understanding | Built |  |
| Q-03 | Match | /app/ask: up to 3 matches with reasons | Built |  |
| Q-04 | Act | /app/ask: Call, Message, Book from a match | Built |  |
| Q-05 | Safety | /app/ask: gas, danger to life, power cut safety cards | Built |  |
| Q-06 | Limits | /app/ask: 5 questions as a guest, then sign in | Built |  |
