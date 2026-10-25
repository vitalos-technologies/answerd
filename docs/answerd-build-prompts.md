# Answerd prototype build prompts

Eleven prompts, run in order in one Claude Code session in an empty repo. Each block below is one prompt: copy it whole, wait for it to finish and for `pnpm build` to pass, check the new screens in `/hub`, commit, then paste the next. Before P0, save the spec tab exported as Markdown to `docs/answerd-spec.md` and, if you have them, the logo SVGs to `public/brand/`.

| Prompt | Builds | IDs |
| --- | --- | --- |
| P0 | Foundation: stack, tokens, components, shells, mock data, store, screen registry, hub | — |
| P1 | Customer onboarding, sign-in and discovery | C-01 to C-15, C-48 |
| P2 | Listing, call, message, enquiry, booking | C-16 to C-28, C-33 |
| P3 | Bookings, reviews, referrals, account, Ask Answerd | C-29 to C-32, C-34 to C-47, Q-01 to Q-06 |
| P4 | Claim, verification, setup and profile | B-01 to B-17 |
| P5 | Today, inbox, calls, requests, diary, jobs, quotes, reviews, stats | B-18 to B-29 |
| P6 | AI desk, billing, team, settings, desk simulations | B-30 to B-41, D-01 to D-10 |
| P7 | Public website | W-01 to W-12, W-20 to W-27 |
| P8 | Business web dashboard | W-13 to W-19 |
| P9 | Admin console | A-01 to A-23 |
| P10 | End-to-end QA, tests, coverage report | All |

## P0 · Foundation

```markdown
You are building the Answerd clickable prototype. Answerd is a Vitalos product: a UK local-services marketplace where customers find, call, message, book, refer and review local businesses (plumbers, cleaners, mechanics, couriers, barbers, any service), and businesses list free and can switch on an AI front desk that answers their calls and texts. Tagline: "Every business picks up." It lives at answerd.vitalos.co.uk (a Vitalos subdomain). Its chat assistant, Ask Answerd, is powered by Askbridge (Vitalos's website assistant): show "Powered by Askbridge" in the web footer, the About page and under Ask Answerd (C-38, W-25). The AI front desk runs on Workforce and carries no Askbridge caption.

There is ONE mobile app for customers and businesses. Business mode is a mode of the same app (like Airbnb's "Switch to hosting"), never a second app: same sign-in, a mode switch in Account and More, the last mode remembered, staff-only accounts always open in business mode, and tapping a business notification switches to business mode first.

The full spec is docs/answerd-spec.md. Read all of it before writing code. Screen IDs in it (C-01 to C-48 customer app, B-01 to B-41 business mode, W-01 to W-27 web, A-01 to A-23 admin, D-01 to D-10 desk behaviours, Q-01 to Q-06 Ask Answerd) are the source of truth for every screen, its content, its actions and its states. When this prompt and the spec disagree, the spec wins.

This prompt builds the foundation only: project, design system, shells, mock data, shared store, screen registry and the prototype hub. Later prompts add screens by ID.

## Stack
- Next.js latest stable, App Router, TypeScript strict, Tailwind CSS, shadcn/ui, lucide-react, zustand with persist (localStorage key answerd-demo-v1), date-fns with en-GB locale, recharts, qrcode, @dnd-kit/core. pnpm.
- No backend, no external APIs, no API keys. Everything runs on mock data in the browser so the app deploys to Vercel as-is.
- pnpm build and pnpm lint must pass at the end of every prompt.

## Design tokens (exact values)
Colours: navy #0F2D5B, blue #2563FF, blue-hover #1D4ED8, blue-tint #EAF0FF, teal #14B8A6, teal-ink #0F766E, teal-tint #E6F7F5, sky #F1F5F9, white #FFFFFF, slate #475569, muted #64748B, border #E2E8F0, amber #F59E0B, amber-ink #B45309, amber-tint #FEF3C7, red #DC2626, red-tint #FEE2E2.
Map shadcn variables: primary blue, background sky, card white, foreground navy, muted-foreground muted, border border, destructive red, ring blue.
Contrast rules: never teal or amber text on white (use teal-ink, amber-ink); white text only on blue, navy or red; body text slate.
Font: Inter via next/font (400, 500, 600, 700); tabular-nums for prices, times and counts.
Type utilities (mobile, then md:): t-display 30/36 700 tracking -0.02em (48/56); t-title 24/30 700 (32/40); t-heading 19/26 600 (24/32); t-subhead 16/22 600 (18/26); t-body 15/22 400 (16/24); t-label 14/20 500; t-caption 12/16 500.
Spacing on a 4 px scale; mobile gutter 16; web gutter 24; web max width 1200.
Radius: buttons and chips full pill; inputs 12; cards 16; bottom sheets 24 on top corners.
Shadows: card 0 1px 2px rgba(15,45,91,.06), 0 4px 16px rgba(15,45,91,.06); overlay 0 24px 64px rgba(15,45,91,.18).
Motion: 150 ms taps, 250 ms sheets, ease-out; respect prefers-reduced-motion.
Icons: Lucide, stroke 1.75, 20 px in lists, 24 px in tab bars.

## Brand
If public/brand/answerd-mark.svg and public/brand/answerd-logo.svg exist, use them. Otherwise create components/brand/Mark.tsx: a rounded speech bubble with its tail at bottom-left, filled blue #2563FF, a white phone handset inside, and two teal #14B8A6 signal arcs off its top-right. Create Logo.tsx with variants horizontal (mark + "Answerd" wordmark in Inter 700 navy, tracking -0.02em, optional tagline "Every business picks up." in slate), stacked, mark-only, reversed (white wordmark on navy) and mono (all navy). Clear space equals the mark's height.

## Components
components/ui holds shadcn primitives; components/answerd holds ours. Build each to the spec's Core components table with every variant and state, and show them all on /hub/components:
Button (primary, secondary, ghost, destructive, loading); ActionBar (Call, Message, Book; unclaimed variant Call and Claim this business); SearchBar (pill 52 high, placeholder "What service do you need?", location chip such as "SE25 · 2 mi"); CategoryTile; ResultCard (claimed, unclaimed, featured, Places gap-fill with "Powered by Google" caption); Badges (Responds instantly with a pulsing teal dot, Verified, Gas Safe, NICEIC, Insured, DBS, Featured, Unclaimed, Open now, New, Desk); Rating; ChatBubble (customer, owner, staff, desk labelled "Answerd desk", system) with inline SlotCard, QuoteCard and BookingCard; SlotPicker (date strip plus time pills or windows); BottomSheet; Banner (info, success, warning, error); EmptyState (mark in a blue-tint circle, heading, one sentence, one action); skeletons; Toast (navy pill above the tab bar, optional Undo); StatTile; OTPInput (6 boxes, auto-advance, paste fills all, resend timer); StatusPill (requested, confirmed, on_the_way, arrived, completed, cancelled, declined, no_show, each with icon and text, never colour alone); Stepper; SegmentedControl; MockMap; ScreenIdBadge.
MockMap: no map provider in the prototype. Draw a stylised SVG map (sky ground, white roads, pale green parks, a river), project listing lat/lng into the bounding box, pins are the Mark for desk-enabled listings and blue dots for the rest, clusters show a count, the selected pin grows. Caption "Map: prototype only".

## Shells
- PhoneFrame: every /app route renders inside a 390 x 844 device frame (corner radius 48, status bar showing 9:41, home indicator) centred on a sky backdrop. At 1100 px wide and above, a side panel to the right shows the screen ID and title, the active persona and a jump list of that surface's screens. Below 500 px wide the frame disappears and the app fills the viewport.
- CustomerTabs: Home, Search, Bookings, Messages, Account with count badges.
- BusinessTabs: Today, Inbox, Diary, Desk, More, with a navy header strip showing the business name and a "Business" pill. Staff persona sees only Today, Inbox and Diary.
- WebHeader: logo, Find a business, List your business, How it works, Sign in; compacts on scroll and shows the SearchBar. WebFooter: category and city links, legal links, "Answerd is a Vitalos product · Powered by Askbridge".
- DashboardShell: white 240 px sidebar (Overview, Inbox, Diary, Profile, AI desk, Reviews, Stats, Billing, Team, Settings), top bar with business switcher and avatar.
- AdminShell: navy sidebar, white canvas, dense tables, a role pill (Admin or Support).

## Mock data (lib/seed.ts)
Deterministic: use a seeded PRNG, never Math.random. Demo clock starts Mon 26 Oct 2026 09:00 Europe/London and can be advanced. Launch date 1 Sep 2026.
Phone numbers only from Ofcom drama ranges: mobiles 07700 900000 to 07700 900999, London 020 7946 0000 to 020 7946 0999.
- Categories: the spec's tree (Home trades, Cleaning and domestic, Auto and delivery, Personal and beauty, Everything else) with about 30 leaf categories, each with a Lucide icon.
- 60 listings: 40 around South Norwood and Croydon (SE25, SE19, CR0), 10 in Birmingham, 10 in Manchester. Layers: 18 claimed (6 with desk live), 26 seeded, 16 Places gap-fill. Named listings: Swift Plumbing & Heating (SE25, owner Sam Okafor, Gas Safe and Insured, desk live, 4.9 from 132 reviews, request to book); Sparkle Clean Co (cleaning, desk live, instant booking); Kwame's Mobile Mechanics (auto, request to book); Fade Lab Barbers (beauty, instant booking in fixed 30-minute slots); Fauward Couriers (delivery, claimed and verified, Vitalos's own courier network); Brightwire Electrical (NICEIC, desk paused); Norwood Locksmiths (unclaimed, seeded, 6 tracked calls this month).
- For every claimed listing: services with prices, availability, service area, credentials, photos (use neutral placeholder images or gradients with icons, no real people). 300 short, realistic British reviews spread across listings, some with owner replies. 8 threads, 6 calls with transcripts and summaries, 10 bookings covering every status, 2 quotes, notifications for every persona.
- Personas: Guest; Tayo A. (customer in SE25, 3 past bookings, 1 upcoming with Swift Plumbing on Thu 29 Oct at 2pm); Sam Okafor (owner of Swift Plumbing and also a customer); Jo Reid (staff at Swift Plumbing); Ife Bello (Answerd admin); Dan Price (support agent). Swift Plumbing has had 9 Answerd enquiries, one short of the monetise gate.

## Store (lib/store.ts)
Typed collections for every entity in the spec's Data model, plus session (personaId, mode customer or business, currentBusinessId), clock, offline flag, showScreenIds flag and stateOverride (none, loading, empty, error) for previewing states.
Actions, each writing the Notifications listed in the spec's Notifications table to the right persona and recording an Enquiry where the spec says so: signIn(personaId, method), signOut, setMode, search(query, filters) returning results ranked featured first, then desk-enabled and verified, then claimed, seeded and Places, distance as tie-break; toggleSave; startThread; sendMessage; createBooking; proposeTime; respondToBooking (accept, decline, suggest); updateBookingStatus; reschedule; cancelBooking; markNoShow; sendQuote; respondToQuote; logCall; postReview; replyToReview; report; inviteFriend; claimListing; verifyClaim(method); updateBusiness; upsertService; deleteService; setAvailability; setServiceArea; uploadCredential; startDeskTrial; setDeskStatus; updateDeskConfig; runDeskScript(scriptId, listingId) which plays D-01 to D-10 as timed events creating threads, calls, bookings and handoffs; startSubscription; cancelSubscription; inviteStaff; adminDecide(queue, id, decision, reason) which writes an AuditEvent; advanceClock(hours) which fires 24-hour reminders, expires booking requests unanswered after 2 hours, sends quote follow-ups at 2 and 7 days and ends trials; resetDemo.
Monetise gate: a business sees paid prompts only when its Answerd enquiries are at least 10 and the clock is at least 60 days after launch.

## Screen registry and hub
lib/screens.ts exports every ID below with title, surface and route. Every page renders a small ScreenIdBadge at top-left when showScreenIds is on. Routes that are not built yet render a placeholder that shows the ID and "Built in a later prompt", so nothing ever 404s.
/hub is the prototype home: persona switcher, mode switch, Reset demo data, Show screen IDs, Go offline, Preview states (loading, empty, error), clock with +2 hours and +1 day buttons, a Simulate panel (one button per D-01 to D-10 against Swift Plumbing, plus Customer books Swift Plumbing, Trigger monetise gate), and every screen as a card grouped by surface showing ID, title and built status. A small floating Hub button sits bottom-left on every page except when the URL has ?clean=1.

Customer app, /app inside the phone frame:
C-01 Splash /app/splash; C-02 Welcome /app/welcome; C-03 Location /app/onboarding/location; C-04 Notifications permission /app/onboarding/notifications; C-05 Sign-in sheet /app/sign-in; C-06 Phone number /app/sign-in/phone; C-07 SMS code /app/sign-in/code; C-08 About you /app/sign-in/about-you; C-09 Home /app; C-10 All categories /app/categories; C-11 Search /app/search; C-12 Results list /app/results; C-13 Results map /app/results/map; C-14 Filters sheet /app/results/filters; C-15 Location picker /app/location; C-16 Listing claimed /app/b/[slug]; C-17 Listing unclaimed /app/b/[slug]; C-18 Photo gallery /app/b/[slug]/photos; C-19 Reviews /app/b/[slug]/reviews; C-20 Call sheet /app/b/[slug]/call; C-21 After the call /app/b/[slug]/after-call; C-22 Message thread /app/messages/[threadId]; C-23 New enquiry /app/b/[slug]/enquiry; C-24 Book service /app/b/[slug]/book; C-25 Book time /app/b/[slug]/book/time; C-26 Book details /app/b/[slug]/book/details; C-27 Book confirm /app/b/[slug]/book/confirm; C-28 Booked /app/bookings/[id]/booked; C-29 Bookings /app/bookings; C-30 Booking detail /app/bookings/[id]; C-31 Reschedule /app/bookings/[id]/reschedule; C-32 Cancel /app/bookings/[id]/cancel; C-33 Messages /app/messages; C-34 Write a review /app/bookings/[id]/review; C-35 Review posted /app/bookings/[id]/review/done; C-36 Invite friends /app/account/invite; C-37 Saved /app/saved; C-38 Ask Answerd /app/ask; C-39 Account /app/account; C-40 Edit profile /app/account/profile; C-41 Saved places /app/account/places; C-42 Notification settings /app/account/notifications; C-43 Privacy and data /app/account/privacy; C-44 Help /app/help; C-45 Report /app/report; C-46 Notifications /app/notifications; C-47 Delete account /app/account/delete; C-48 Offline and errors /app/states.

Business mode, /app/biz inside the phone frame:
B-01 Find your business /app/biz/claim; B-02 Is this you /app/biz/claim/[listingId]; B-03 Add your business /app/biz/claim/new; B-04 Verify ownership /app/biz/claim/[listingId]/verify; B-05 Enter code /app/biz/claim/[listingId]/verify/code; B-06 Director check /app/biz/claim/[listingId]/verify/director; B-07 Upload a document /app/biz/claim/[listingId]/verify/document; B-08 You're in /app/biz/claim/[listingId]/done; B-09 Setup checklist /app/biz/setup; B-10 Business details /app/biz/profile/details; B-11 Services and prices /app/biz/profile/services; B-12 Edit service /app/biz/profile/services/[serviceId]; B-13 Hours and availability /app/biz/profile/hours; B-14 Service area /app/biz/profile/area; B-15 Photos /app/biz/profile/photos; B-16 Credentials /app/biz/profile/credentials; B-17 Booking settings /app/biz/profile/booking; B-18 Today /app/biz; B-19 Inbox /app/biz/inbox; B-20 Conversation /app/biz/inbox/[threadId]; B-21 Call detail /app/biz/calls/[callId]; B-22 Booking request /app/biz/requests/[bookingId]; B-23 Diary /app/biz/diary; B-24 Job /app/biz/jobs/[bookingId]; B-25 Add to diary /app/biz/diary/new; B-26 Send quote /app/biz/inbox/[threadId]/quote; B-27 Reviews /app/biz/reviews; B-28 Stats /app/biz/stats; B-29 Share your profile /app/biz/share; B-30 AI desk intro /app/biz/desk/intro; B-31 Desk setup /app/biz/desk/setup; B-32 Desk /app/biz/desk; B-33 Test call /app/biz/desk/test-call; B-34 What the desk knows /app/biz/desk/knowledge; B-35 Handoff rules /app/biz/desk/handoff; B-36 Plan and billing /app/biz/billing; B-37 Featured /app/biz/featured; B-38 Team /app/biz/team; B-39 Business notifications /app/biz/notifications; B-40 Business settings /app/biz/settings; B-41 More /app/biz/more.

Web:
W-01 Home /; W-02 Search results /search; W-03 Category hub /[category]; W-04 Category in area /[category]/[area]; W-05 Area hub /areas/[area]; W-06 Listing claimed /b/[slug]; W-07 Listing unclaimed /b/[slug]; W-08 How it works /how-it-works; W-09 For businesses /for-businesses; W-10 Pricing /pricing; W-11 Claim or add /claim; W-12 Sign in /sign-in; W-13 Dashboard overview /dashboard; W-14 Dashboard inbox /dashboard/inbox; W-15 Dashboard diary /dashboard/diary; W-16 Dashboard profile /dashboard/profile; W-17 Dashboard AI desk /dashboard/desk; W-18 Dashboard billing /dashboard/billing; W-19 Dashboard team and settings /dashboard/team; W-20 Help centre /help; W-21 About /about; W-22 Legal /legal/[doc]; W-23 Cookie banner (component on every web page); W-24 Not found and errors (not-found and error files); W-25 Chat with Answerd (widget on public web pages); W-26 Get the app /get-the-app; W-27 Review from link /review/[token].

Admin, /admin:
A-01 Sign in /admin/sign-in; A-02 Overview /admin; A-03 Listings /admin/listings; A-04 Listing detail /admin/listings/[id]; A-05 Merge /admin/listings/[id]/merge; A-06 Claims queue /admin/claims; A-07 Credentials queue /admin/credentials; A-08 Reviews /admin/reviews; A-09 Reports /admin/reports; A-10 Customers /admin/customers; A-11 Businesses /admin/businesses; A-12 Desk QA /admin/desk-qa; A-13 Imports /admin/imports; A-14 Coverage /admin/coverage; A-15 Taxonomy /admin/taxonomy; A-16 Places spend /admin/places; A-17 Billing /admin/billing; A-18 Monetise gate /admin/gate; A-19 Featured slots /admin/featured; A-20 Content /admin/content; A-21 Admin users /admin/users; A-22 Audit log /admin/audit; A-23 Settings /admin/settings.

Behaviours without routes: D-01 to D-10 run from the hub Simulate panel and B-33; Q-01 to Q-06 run inside C-38 and W-25.

## Definition of done (applies to every prompt)
- Every button, link, tab and row does something real: navigates, changes store state, or opens a sheet. No "#" links, no alert(), no dead ends.
- Every list or data screen has loading, empty and error states, reachable from the hub's Preview states control.
- Copy is British English and comes from the spec wherever the spec gives it. Prices show £ and say whether VAT is included. Dates read "Thu 29 Oct", times "2pm" or "2:30pm".
- App screens work at 390 wide; web pages at 1440, 1024 and 390; admin at 1280. Focus is visible; icon buttons have aria-labels; targets are at least 44 x 44.
- pnpm build and pnpm lint pass. Mark the IDs you built as built in the hub. Commit with a message listing the IDs.

Build the foundation now. Do not build feature screens beyond placeholders.
```

## P1 · Customer onboarding, sign-in and discovery

```markdown
Build the customer app screens C-01 to C-15 and C-48 from docs/answerd-spec.md on the P0 foundation (tokens, components, store, PhoneFrame, CustomerTabs, registry). Follow each screen's row in the spec's Customer app table for content, actions and states.

Specifics
- C-01 shows the stacked logo for 1.2 s, then goes to C-02 on a first visit (no onboarding flag in the store) or C-09 otherwise.
- C-02 has three swipeable slides with dots and the spec's copy, Get started, I have an account, and an "I run a business" text link that opens C-05 with next=/app/biz/claim.
- C-03: Use my location shows a mock OS permission dialog (Allow once, Allow while using the app, Don't allow). Allow sets the location to SE25, South Norwood. Don't allow reveals the postcode field inline.
- C-05 is a bottom-sheet route that accepts ?next= and returns there after sign-in. Anywhere a guest taps Message, Book, Save, Recommend or Review, send them to C-05 with next set to where they were going.
- C-06 accepts UK mobiles in any common format. C-07: any 6 digits are correct except 000000, which is wrong; 5 wrong codes lock that number for 15 minutes on the demo clock; resend timer counts down from 30 s. Apple and Google buttons show a mock OS sheet ("Sign in to Answerd with Apple") then continue. New users go to C-08; existing personas skip it.
- C-09 greets by time of day on the demo clock ("Morning, Tayo"; guests see "Find local help"), 8 category tiles plus All, a "Responds instantly near you" carousel of desk-live listings within 5 miles, Tayo's upcoming Thu 29 Oct booking card, recent searches, and the Ask Answerd card (opens C-38, a placeholder until P3).
- C-11 suggests as you type from categories, listing names and phrases like "plumber near SE25"; recent searches persist and can be cleared.
- C-12 uses store.search: Featured (labelled) first, then desk-enabled and verified, other claimed, seeded, Places. Places cards carry "Powered by Google". Filter chips toggle and update the count. Fewer than 3 results shows the widen-radius banner; none shows the empty state with "Ask Answerd instead".
- C-13 uses MockMap with the same result set; a pin scrolls the bottom carousel to its card and a card highlights its pin; "Search this area" re-runs the search for the visible box.
- C-14 updates "Show 42 results" live as filters change; Reset clears.
- C-15 has a mock postcode lookup for at least 30 postcodes across SE25, SE19, CR0, Birmingham and Manchester, Tayo's saved places (Home SE25, Work EC2), recent areas, and an error for unknown postcodes.
- C-48 is a gallery of the offline banner, retry card, generic error and maintenance screen. The hub's Go offline toggle shows the offline banner on every app screen and queues sends with a clock icon.

Acceptance (click through all of these before finishing)
1. Reset demo, persona Guest: C-01, C-02, C-03 (Allow), C-09 with the carousel filled.
2. Search "boiler": claimed, seeded and Places results are labelled correctly; switch to map, tap a pin, open the card (C-16 placeholder until P2).
3. Apply Gas Safe and 4 stars and up: the count drops, chips show as active, Reset restores.
4. As Guest tap Message on a claimed listing card: C-05 opens; sign in by phone with 123456; you land back where you were.
5. Enter 000000 five times: the lock banner appears.
Mark C-01 to C-15 and C-48 as built in the hub. pnpm build and lint pass. Commit.
```

## P2 · Listing, call, message, enquiry, booking

```markdown
Build C-16 to C-28 and C-33 from docs/answerd-spec.md on the P0 foundation. The business side (P5) reads the same records, so use store actions, never local component state, for threads, messages, calls, bookings, referrals and enquiries.

Specifics
- C-16 and C-17 share /app/b/[slug] and switch on listing.layer. Every view records a profile_view Enquiry. Claimed: cover, logo, badges, rating, distance from the active location, reply-time line ("Usually replies in 1 min" for desk-live listings, otherwise from seed), open status from availability and the demo clock, sections About, Services and prices, Photos, Reviews (top 3 with See all), Credentials, Service area (MockMap with radius), Hours; Save and Recommend icons; Report in the overflow menu; sticky ActionBar. Hide Book when the business has no bookable services. Unclaimed: the spec's reduced layout; Claim this business opens /app/biz/claim/[listingId] (placeholder until P4); Ask them to join opens the share sheet.
- Share sheet: a mock OS sheet with Copy link (answerd.vitalos.co.uk/b/[slug]?ref=[code]), WhatsApp, Messages, Email. Recommend creates a Referral of kind recommend.
- C-20 call sheet, then an in-frame "Calling Swift Plumbing" screen with a timer and three demo outcome buttons: They answered, Answerd desk answered (desk-live listings only), No answer. Each calls store.logCall (owner, desk or missed), which records a Call and an Enquiry, then opens C-21. Answerd desk answered also runs the D-01 script so the business gets a call summary.
- C-21 per the spec. "Yes, booked it" opens a short form (service, date, time) that creates a confirmed booking with createdBy customer.
- C-22: bubbles per the ChatBubble variants. For desk-live listings, if the owner hasn't replied 2 s after a customer message, the desk replies with a typing indicator ("Answerd desk is replying...") using lib/deskScripts.ts keyed on intent words (price, availability, area, emergency), quoting the business's real price ranges and offering SlotCards from its real availability. A SlotCard opens C-27 prefilled. QuoteCards show Accept and Decline (respondToQuote). When the business is offline, show its reply-time line.
- C-23 creates a thread whose first message is the enquiry (photos as placeholders) and opens C-22.
- C-24 to C-27 is one booking flow with a draft in the store. Times come from the listing's availability, lead time, buffer, max jobs per day and existing bookings. Swift Plumbing is request to book; Sparkle Clean and Fade Lab are instant. Seed one contested slot (Fade Lab, Thu 29 Oct 3pm): confirming it shows the "slot just taken" sheet with the next 3 slots. A postcode outside the service area on C-26 shows the error and 3 listings that do cover it.
- C-28 says "You're booked" (instant) or "Request sent" (request), with Add to calendar (downloads an .ics), Message business and Done. The first booking ever triggers C-04.
- C-33 lists threads newest first with unread dots and an "Answerd desk" tag when the last reply came from the desk.

Acceptance
1. As Tayo, Book Swift Plumbing "Boiler service" Thu 29 Oct 10am: C-28 says Request sent; the store holds a requested booking and a notification for Sam.
2. As Tayo, message Sparkle Clean "How much for a 3-bed end of tenancy clean?": the desk replies within 2 s with the listed price range and two SlotCards; tap one, confirm, booked instantly.
3. As Guest, call Norwood Locksmiths (unclaimed) and choose No answer: C-21 offers Try similar, and Message is not offered.
4. Book the contested Fade Lab slot: the sheet appears and the booking completes on an alternative time.
Mark the IDs built in the hub. pnpm build and lint pass. Commit.
```

## P3 · Bookings, reviews, referrals, account, Ask Answerd

```markdown
Build C-29 to C-32, C-34 to C-47 and Ask Answerd (C-38 with behaviours Q-01 to Q-06) from docs/answerd-spec.md.

Specifics
- C-29 tabs Upcoming and Past from the store. C-30 shows a status timeline from BookingEvents; the Review button appears only when the booking is completed and not yet reviewed. A tracked call over 60 s also allows a review: /app/b/[slug]/review?call=[callId] reuses C-34.
- C-31 records a change request (BookingEvent change_requested) that the business answers in P5. C-32 shows the business's cancellation policy and warns inside the window.
- C-34 needs stars and at least 20 characters; aspects optional. postReview updates the listing's rating and count immediately and notifies the owner; then C-35 offers Recommend.
- C-36 shows Tayo's code TAYO-7K2 and link; after the hub's +1 day, "Ade joined" appears.
- C-38 Ask Answerd: header with the mark, title "Ask Answerd", caption "Powered by Askbridge", opening line "Need a local service? I'll help you find the right business." and four suggestion chips. Build lib/askAnswerd.ts as a scripted agent: map free text to a category with a keyword table of at least 60 phrases (boiler, leak, tap, fuse, rewire, deep clean, end of tenancy, oven clean, MOT, battery flat, puncture, skin fade, nails, parcel, man and van and so on); pick up a postcode if given; ask at most two follow-ups (postcode if unknown; "Is water leaking right now?" for plumbing); then show up to 3 ResultCards from store.search, each with a one-line reason built from real fields ("Gas Safe, replies in a minute, free tomorrow 9am") and Call, Message, Book buttons that open the normal flows. Message pre-fills C-23 with what the customer already said. Emergency phrases (smell gas, gas leak, sparks, flooding, carbon monoxide) return the safety card from D-09 and Q-05 ("Call the National Gas Emergency Service on 0800 111 999" for gas, "Call 999" when life is at risk) with no booking buttons. Guests get 5 messages, then C-05. Optional: if the server environment variable ANTHROPIC_API_KEY is set, run the understanding step through a Next.js route handler that calls Claude and returns the same shape; otherwise stay scripted. Never expose a key to the browser.
- C-39 Account: "Switch to business mode" for personas with a business membership, "List or claim your business" for everyone else. C-40 to C-43 write to the store; Download my data shows a toast. C-47 needs DELETE typed plus an SMS code, is blocked if a booking is today, and returns to C-02 as Guest.
- C-45 is one report sheet reused for listings, reviews and users; it creates a Report that appears in admin (P9).
- C-46 lists the persona's notifications; tapping marks read and opens the screen; business-tagged notifications switch to business mode first.

Acceptance
1. Hub +3 days. As Tayo open the completed booking, post a 5-star review, recommend: the listing's rating updates and Sam has a "New review" notification.
2. Ask Answerd "my boiler's making a banging noise, SE25": at most one follow-up, 3 matches with reasons, Book on the first opens C-24.
3. Ask Answerd "I can smell gas": safety card with 0800 111 999 and no business cards.
4. Guest sends a 6th message to Ask Answerd: the sign-in sheet opens.
5. Delete a fresh test account: back to C-02 as Guest.
Mark the IDs built in the hub. pnpm build and lint pass. Commit.
```

## P4 · Claim, verification, setup and profile

```markdown
Build business mode screens B-01 to B-17 from docs/answerd-spec.md inside the PhoneFrame. Claim and verification steps are full-screen without tabs; setup and profile screens use the navy business header. Remember: this is the same app as the customer screens, switched into business mode.

Specifics
- B-01 searches all three layers by name and postcode. A listing already claimed by someone else shows "Already claimed" and a Dispute this claim form that creates a Claim with status disputed (it appears in A-06 in P9).
- B-02 shows the listing as customers see it plus the teaser from real Enquiry records ("6 people tried to reach you this month").
- B-03 creates a new listing owned by the current user; duplicate detection by name similarity and postcode shows "Is it one of these?" first.
- B-04 to B-07: Text a code is hidden when the listed number is a landline (020); Call me with a code works for landlines; 000000 is wrong, any other 6 digits are right. Director check uses lib/companiesHouse.ts with mock officers (Swift Plumbing & Heating Ltd, director Samuel Okafor, born 03/1985, plus two other companies). Document upload accepts any file or a mock camera capture, sets the claim to pending and lands on B-09 with a "Verification pending" banner until an admin approves in A-06 or the hub's +1 day auto-approves it.
- B-08 reveals the enquiry history and creates the Business (with tenantId), the owner BusinessMember and a DeskConfig set to off. The listing's layer becomes claimed immediately everywhere (C-12, C-16, W-06). The app switches to business mode and remembers it.
- B-09 progress is computed from real data: a step is done when its fields are filled. The checklist also shows as a card on B-18 until complete.
- B-10 to B-17 edit the store; every save shows a toast and is reflected at once on C-16. B-12 supports Fixed, From, Hourly and Quote only price types, a VAT-included toggle and a bookable toggle. B-13 validates overlapping hours and supports holidays. B-14 has radius and postcode-district modes on MockMap. B-15 supports drag to reorder and choosing a cover. B-16 status chips Pending, Verified, Rejected (with reason), Expired, Expires soon; verified credentials become listing badges.
- Entry points into business mode must all work: C-02 "I run a business", C-39 "List or claim your business", C-17 "Claim this business" (and W-11 in P7).

Acceptance
1. As Sam, from C-17 on Norwood Locksmiths, claim with Call me with a code: B-08 shows 6 calls; C-12 now shows the listing as claimed.
2. Complete the checklist: 2 services, hours, a 3-mile radius, 2 photos, an insurance upload: progress reaches 100% and C-16 shows the new services (the Insured badge appears once approved).
3. As a new user, add "Ade's Gardening": the duplicate check runs; upload a document: pending banner; hub +1 day clears it.
Mark the IDs built in the hub. pnpm build and lint pass. Commit.
```

## P5 · Today, inbox, calls, requests, diary, jobs, quotes, reviews, stats

```markdown
Build B-18 to B-29 from docs/answerd-spec.md. These screens read and write the same records the customer screens created in P2 and P3; the loop must work both ways.

Specifics
- B-18 Today: desk status pill (Live, Paused, Off) linking to B-32; stat row from today's real data; Needs you lists threads with status needs_owner, booking requests and change requests; today's jobs on a timeline using the demo clock; the monetise-gate card when the store's gate rule is met.
- B-19 filters All, Needs you, Desk handled, Calls, Booking requests; rows show a channel icon and a Desk tag.
- B-20: Take over sets thread.deskActive false and shows "You're replying. The desk is paused for this conversation." Propose times opens SlotPicker and posts a SlotCard. Send quote opens B-26. A customer panel lists past bookings with this business. Anything sent here appears in the customer's C-22 when you switch persona.
- B-21: mock audio player (play, scrub, 1x and 1.5x, no real audio) with the transcript highlighting the current line, the desk summary, and a Booked link when the call produced a booking.
- B-22: Accept, Decline with reason, Suggest another time. A countdown shows what is left of the 2-hour window on the demo clock; at zero (hub +2 hours) the request expires and the customer gets the declined notification with 3 alternatives.
- B-23 Diary: Day, Week and List; jobs coloured by status with text labels; blocked time hatched; tapping empty space opens B-25 at that time.
- B-24 status stepper Confirmed, On my way, Arrived, Completed; each step notifies the customer per the Notifications table; Completed queues the D-06 review request; Mark no-show asks to confirm.
- B-25 segmented Booking or Block time, with a clash warning.
- B-26 line items, VAT, total, valid until; sending posts a QuoteCard into the thread and schedules D-05 follow-ups at +2 and +7 days on the demo clock.
- B-27 one public reply per review, shown on C-19 and W-06.
- B-28 recharts stacked bars by week (calls, messages, bookings) from Enquiry and Booking records, plus profile views, search appearances, conversion and desk-handled share; range 4 weeks, 12 weeks, all.
- B-29 profile link with ?ref=, a real QR code (qrcode library) and a printable "Review us on Answerd" card on a print-styled page.
- Staff persona Jo sees only Today, Inbox and Diary, only jobs assigned to Jo, plus the shared inbox.

Acceptance (the full loop)
1. As Tayo request Swift Plumbing boiler service Thu 10am. Switch to Sam: it is in Needs you; Accept on B-22. Switch to Tayo: C-30 says Confirmed and C-46 has the notification.
2. As Sam on Tayo's thread, Take over and send a £95 inc VAT quote. Hub +2 days: Tayo gets the desk follow-up and accepts the quote in C-22.
3. On Thu, Sam moves the job through On my way, Arrived, Completed; Tayo gets each update and then the review request.
4. Leave a new request unanswered, hub +2 hours: it expires and the customer sees alternatives.
5. As Jo: only the Today, Inbox and Diary tabs.
Mark the IDs built in the hub. pnpm build and lint pass. Commit.
```

## P6 · AI desk, billing, team, settings, desk simulations

```markdown
Build B-30 to B-41 and the desk behaviours D-01 to D-10 from docs/answerd-spec.md. The desk runs on Workforce; desk screens carry no Askbridge caption.

Desk scripts (lib/deskScripts.ts)
Write each of D-01 to D-10 as a timed script: a list of turns (caller or customer line, desk line) plus side effects (create thread, log a call with transcript and summary, create a booking with createdBy desk, set a thread to needs_owner, send notifications). Desk lines follow the spec: the greeting says it is the business's Answerd assistant and that the call is recorded; it never quotes a price outside the business's listed ranges; it never confirms a job outside the service area; D-09 says "Please leave the property and call the National Gas Emergency Service on 0800 111 999 now." for gas, "Please call 999." when life is at risk and "Call 105." for a power cut, alerts the owner at once and books nothing; D-10 ends politely and logs spam. Scripts read the business's real services, prices, hours and area so they work for any claimed listing. The hub Simulate panel runs any script against Swift Plumbing; B-33 runs one for the current business.

Screens
- B-30: sample call player (animated D-01 transcript), the four-line explanation, the spec's price line, Start 14-day free trial (startDeskTrial). If already trialled, show Upgrade instead.
- B-31: six steps with a progress bar. Step 1 assigns a number from 020 7946 0xxx and shows missed-call forwarding with the standard codes (**61*number# no answer, **67*number# busy, **62*number# unreachable, **004*number# all three), a note to check with your network, and an "I've set it up" button with a mock detection result. Step 2 greeting text and three voices with an animated play button (no audio). Step 3 permission toggles. Step 4 handoff rules prefilled from the spec. Step 5 runs B-33 inline. Step 6 Go live sets DeskConfig live.
- B-32: status with Pause and Resume (confirm sheet), today's counts from real records, recent desk conversations, trial days left banner.
- B-33: a phone-call screen (avatar, timer, mute, speaker, end) with a script picker; the transcript streams line by line and side effects land in the inbox and diary as they happen.
- B-34: what the desk knows from the profile with edit links to B-10 to B-17; custom Q&A add, edit, delete; a "never say" list. B-35: handoff rules and quiet hours.
- B-36: plan card, monetise-gate progress ("9 of 10 enquiries"), payment method, invoices. Upgrade and Get Featured open the web checkout at /dashboard/billing/checkout (built in P8; placeholder until then). Until the gate is met, paid buttons read "Available after 10 enquiries" and are disabled. Cancel needs an SMS code sheet.
- B-37: slot availability for the business's categories and areas from FeaturedSlot records, or "Coming when your area has 20+ businesses".
- B-38: invite staff by name and phone (pending member; the hub can accept as Jo); remove with confirm. B-39 notification toggles. B-40 switch business, transfer ownership, unpublish, delete business, each behind an SMS code sheet. B-41 More menu, including Switch to customer mode.

Acceptance
1. As Sam on Norwood Locksmiths (claimed in P4): start the trial, complete setup, run the D-01 test call: a desk-made booking appears in B-23.
2. Hub: run D-01 on Swift Plumbing as a new caller: B-19 Desk handled, B-21 transcript, B-23 job, Sam notified.
3. Hub: run D-09 (gas): owner alerted, no booking, the safety line is in the transcript.
4. Hub: Trigger monetise gate: the B-18 gate card appears and B-36 Upgrade becomes active.
5. Pause the desk: the listing loses the Responds instantly badge in C-12 and C-16; Resume restores it.
Mark the IDs built in the hub. pnpm build and lint pass. Commit.
```

## P7 · Public website

```markdown
Build the public website W-01 to W-12 and W-20 to W-27 from docs/answerd-spec.md with WebHeader, WebFooter ("Answerd is a Vitalos product · Powered by Askbridge") and the shared store. The site lives at answerd.vitalos.co.uk; use that host in canonical URLs, share links and structured data.

Specifics
- W-01: hero "Local help, just a message away." with SearchBar and postcode; popular categories; How it works in three steps; "Businesses that respond instantly near you"; For businesses band with "Every business picks up." and List your business; app download; footer category and city links that resolve to W-03 and W-04.
- W-02: list and MockMap side by side at 1024 and up, stacked on mobile; same filters and ranking as C-12.
- W-03, W-04, W-05: generate pages for every category slug and the seed's areas (croydon, south-norwood, birmingham, manchester and their districts). Each has generateMetadata (for example title "Plumbers in Croydon | Answerd" and a description with the count), breadcrumbs, FAQs, average price ranges from service data, and JSON-LD (ItemList on W-04, LocalBusiness on W-06). Thin areas include neighbouring areas.
- W-06 and W-07 share /b/[slug]: a two-column version of C-16 and C-17 with a sticky contact card. Book on the web reuses the booking flow at /b/[slug]/book with the same store actions in a desktop layout. Message requires sign-in (W-12) and opens the thread in a side panel.
- W-08, W-09, W-10: marketing pages with the spec's copy; no testimonials (none exist yet); W-09 includes the desk sample-call player; W-10 states all prices ex VAT and the line "You'll never pay before you've had 10 enquiries from Answerd".
- W-11: claim stepper reusing the B-01 to B-08 logic in a centred desktop card, ending with Go to dashboard (W-13) and Open in the app.
- W-12: phone and code, Continue with Google (mock), Email me a sign-in link (shows "Check your inbox" then an "Open the link" demo button). Businesses go to /dashboard; customers to a simple account page.
- W-20 help centre with search over 20 seeded articles. W-21 About: Answerd by Vitalos, chat powered by Askbridge, mission line "Local businesses. Happier customers. A stronger community." W-22 legal pages as clearly marked placeholder text with headings for terms, privacy notice, cookies, review policy, acceptable use and the desk call-recording notice.
- W-23 cookie banner: Accept all and Reject non-essential with equal visual weight, Manage opens toggles; the choice is stored; nothing non-essential runs before a choice.
- W-24 custom not-found with search, and an error boundary with Try again.
- W-25: floating "Chat with Answerd" pill opening a 380-wide panel that runs the same lib/askAnswerd.ts as C-38, captioned "Powered by Askbridge".
- W-26: QR code and store badges; a smart banner at mobile widths on every public page ("Open in the Answerd app").
- W-27: /review/[token] with tokens seeded for Tayo's completed bookings; posts through postReview; an expired token shows sign-in.

Acceptance
1. Home: search "boiler" with "SE25", open Swift Plumbing, book on the web as Tayo: Sam sees the request in B-22.
2. /plumbers/croydon renders the right title, breadcrumbs and JSON-LD; every footer link resolves.
3. Open an unclaimed listing on W-07, claim it through W-11 as a new user, arrive at the dashboard.
4. Reject non-essential cookies: the banner does not return until Reset demo data.
5. Chat with Answerd "deep clean SE19" returns 3 cleaners with reasons.
Mark the IDs built in the hub. pnpm build and lint pass. Commit.
```

## P8 · Business web dashboard

```markdown
Build the business web dashboard W-13 to W-19 from docs/answerd-spec.md in DashboardShell, signed in as Sam by default (others sign in through W-12). It is the desktop face of business mode: reuse the store actions and, where possible, the same form components as B-10 to B-40, laid out for 1280 and up.

Specifics
- W-13: stat row, Needs you, today's jobs, the enquiries chart (same data as B-28), setup checklist banner until complete, monetise-gate card when met.
- W-14: three panes (filters, thread list, conversation) with Take over, Propose times, Send quote and call detail with transcript.
- W-15: week calendar with drag to reschedule (@dnd-kit); dropping onto a clash shows a warning and snaps back; a job side panel with the status stepper.
- W-16: tabs Details, Services, Hours, Service area, Photos, Credentials, Booking settings.
- W-17: tabs Overview, Setup, Knowledge, Handoff, Test call (the test call runs in a side panel with a streaming transcript).
- W-18: plan cards and gate progress. Upgrade and Get Featured open /dashboard/billing/checkout, a mock hosted checkout clearly labelled "Prototype checkout, no card needed" showing plan, price ex VAT, VAT and total, with Confirm calling startSubscription and returning with a success toast. "Manage payment method and invoices" opens /dashboard/billing/portal, a mock portal with invoices and Cancel (SMS code required).
- W-19: team, notifications and settings as B-38 to B-40.
- Any change here appears in business mode in the app and the reverse, because both use the same store.

Acceptance
1. Drag Tayo's job from Thu 10am to Fri 9am: Tayo is notified and C-30 shows the new time.
2. Hub Trigger monetise gate, then Upgrade to the AI desk on W-18: subscription active, and B-36 matches.
3. Reply in W-14, switch to the app as Tayo: the reply is in C-22.
Mark the IDs built in the hub. pnpm build and lint pass. Commit.
```

## P9 · Admin console

```markdown
Build the admin console A-01 to A-23 from docs/answerd-spec.md in AdminShell at /admin. Personas: Ife Bello (Admin, full access) and Dan Price (Support: read-only except review moderation, per the spec's permissions table). Every write opens a reason dialog and records an AuditEvent.

Specifics
- A-01: mock "Sign in with Google" that only accepts vitalos.co.uk personas, then a 6-digit authenticator step.
- Tables use the shadcn data table with sorting, filters, column visibility, pagination, and row selection where there are bulk actions.
- A-02: KPIs computed from the store, each linking to its screen.
- A-04: fields grouped by source (Companies House, OpenStreetMap, Places with place_id only and the note "details fetched at display time", owner edits), plus history.
- A-05: choose the surviving value per field; reviews, enquiries and threads move to the survivor; the other listing redirects to it.
- A-06 and A-07: Approve, Reject with reason, Ask for more. Approvals propagate: an approved claim clears the B-09 pending banner; an approved credential adds its badge on C-16 and W-06; a rejection notifies the owner with the reason.
- A-08: Remove hides the review everywhere and recalculates the rating.
- A-11: View as support opens business screens read-only under a banner "Viewing as support (audited)".
- A-12: sample desk conversations with transcripts; rate Good, Wrong info, Bad handoff, Unsafe.
- A-13: mock import history; Run now adds 5 seeded listings.
- A-14: heatmap of UK postcode areas against core categories, counts from the seed and mock values elsewhere; cells under 5 use red-tint with red text; a cell click filters A-03.
- A-16: daily spend chart, cap input, cache hit rate; a cap below today's spend hides Places results in C-12 and W-02 and shows the admin banner.
- A-18: launch date, day-60 date, per-business counters, manual override with reason.
- A-23: feature flags and a desk kill switch (needs a code) that pauses every DeskConfig; listings lose the Responds instantly badge.

Acceptance
1. As Ife approve Ade's Gardening's document claim from P4: the owner's pending banner clears and the audit log has the entry.
2. Approve Swift Plumbing's insurance credential: the Insured badge shows on C-16.
3. Remove a flagged review: the rating recalculates on C-16.
4. As Dan, approving a claim is disabled with "Support can't approve claims".
5. Kill switch on, then off.
Mark the IDs built in the hub. pnpm build and lint pass. Commit.
```

## P10 · End-to-end QA, tests, coverage

```markdown
Final pass over the whole Answerd prototype against docs/answerd-spec.md. Add no new features; close gaps.

1. Coverage: write COVERAGE.md listing all 155 IDs (C-01 to C-48, B-01 to B-41, W-01 to W-27, A-01 to A-23, D-01 to D-10, Q-01 to Q-06) with route or trigger, status and any deviation from the spec. Build anything missing until every row is built.
2. Dead ends: crawl every route in lib/screens.ts with Playwright and click every button, link and tab; fail on any 404, console error, "#" href, or control with no effect. Fix them all.
3. Journeys: add Playwright tests for these eight, each starting from Reset demo data.
   J1 Guest searches "boiler", books Swift Plumbing, signs in by phone, request sent; Sam accepts; Tayo notified; +3 days; Sam completes; Tayo reviews 5 stars and recommends.
   J2 Tayo calls Brightwire (desk paused), no answer, messages instead, then opens a similar listing.
   J3 Tayo messages Sparkle Clean out of hours; the desk replies with slots; Tayo books from a slot card.
   J4 Hub runs D-01 on Swift Plumbing; the desk books; the job shows in B-19, B-21, B-23 and W-15.
   J5 Sam claims Norwood Locksmiths by phone code, completes setup, starts the desk trial, runs a test call.
   J6 Trigger monetise gate; Sam upgrades on W-18; plan active on B-36.
   J7 Ife approves a claim and a credential and removes a review; badges and rating update; audit entries exist.
   J8 Ask Answerd "I can smell gas" shows the safety card with 0800 111 999 and no booking buttons.
4. One app: from Account, More and a business notification, the mode switch lands on the right screen and is remembered after reload; staff open in business mode.
5. Accessibility: run axe on every route and fix all serious and critical issues; confirm no teal or amber text on white, labelled icon buttons, visible focus and 44 x 44 targets.
6. Screenshots: save a PNG of every screen at its viewport (app 390 x 844, web 1440 and 390, admin 1280) to docs/screens/[ID].png using ?clean=1.
7. Consistency: one primary action per screen, British English, VAT stated with prices, the "Answerd desk" label on every AI message, "Powered by Askbridge" only where the spec puts it.
8. README.md: how to run, personas, the hub and simulations, and how the prototype maps to the MVP (one Expo app with business mode, Next.js web at answerd.vitalos.co.uk, Workforce backend and AI desk, Ask Answerd powered by Askbridge).
pnpm build, lint and all tests pass. Commit.
```
