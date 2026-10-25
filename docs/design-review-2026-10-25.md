# Answerd prototype design review

Oct 25, 2026 · Temitope Agbola

Review of the deployed prototype against the Answerd Product and Design Spec (docs/answerd-spec.md) and the brand board.

## Top fixes, in order

1. **One website, app first.** Make the standalone site (marketing-site/) the only website; port the prototype's SEO pages, listing pages, claim and help pages into it, and turn web Message and Book into "Continue in the app".
2. **Add the super admin tier.** No owner-level view of revenue, costs, growth, roles, pricing rules or integrations. Ten screens are specified under Admin.
3. **Customer app density.** Result cards show only 1.5 businesses per screen, the home category grid is cramped, and key text truncates on Home and Today.
4. **Phone-frame polish.** Desktop scrollbars show inside the frame, the home indicator sits on top of bottom buttons, and the listing cover uses a delivery-van icon for a plumber.
5. **Two copy bugs.** Billing says "Available after 10 enquiries" when the business already has 10 of 10 (it is the day-60 date that is missing), and the admin desk voice setting is labelled "AskBridge Voice".

## Brand and design system fit

| Issue | Where | Fix |
| --- | --- | --- |
| Avatar colours are random pastels (pink, peach, yellow, lavender) | Result cards, listings, "Responds instantly near you" | Pick from brand tints only (blue-tint, teal-tint, amber-tint, sky), chosen by category so they are stable |
| Chart series in orange and green | Dashboard enquiries chart (W-13), likely B-28 | Calls blue, messages teal, bookings navy; amber only for highlights |
| Red "now" line | Today timeline (B-18), diary (W-15, B-23) | Blue line; red stays for errors and destructive actions |
| Robot icon for the AI desk | B-30, B-32, W-17 | Use the Answerd mark; the desk is "Answerd desk", not a robot |
| Two spellings: AskBridge and Askbridge | Prototype vs standalone site | Use "Askbridge" everywhere (matches askbridge.vitalos.co.uk) |

Askbridge is the website chat widget; the desk's voice comes from the telephony and voice stack under Workforce. Rename the admin setting "Desk voice" with telephony providers, and keep "Powered by Askbridge" only on the chat assistant (Ask Answerd and Chat with Answerd) and the footer.

## Customer app

| Severity | Screen | Finding | Fix |
| --- | --- | --- | --- |
| High | C-12 Results | Each result card is about 190 px tall with its own Call and Message row, so only 1.5 businesses fit on screen; a "+1" badge overflow sits on its own line | Compact card (about 104 px): avatar, name, category and distance, rating, one badge row capped at 2 plus "+n" inline, reply-time line, chevron; a single small Call icon button on the right; Message moves to the listing |
| High | C-09 Home | Category grid is 5 across with 48 px tiles; labels like "Electricians" and "Locksmiths" run into each other, and the second row leaves a gap | 4 across with the spec's 72 px tiles (8 categories in two rows), "All categories" as a text link under the grid |
| High | All app screens | Desktop scrollbars show inside the phone frame (vertical on every screen, horizontal on the C-25 date strip) | Hide scrollbars inside the frame (scrollbar-width: none and the WebKit equivalent) while keeping scroll |
| High | C-16, C-26, C-27, C-28 | The home indicator is drawn over the bottom action bar and full-width buttons | Add bottom safe-area padding (34 px) under sticky bars and bottom CTAs |
| Medium | C-09 Home | Search bar repeats the location already shown in the header ("SE25 · 5 mi" chip) and truncates the placeholder to "What service do you..." | Drop the chip on Home; keep it on C-11 and C-12 |
| Medium | C-09 Home | Upcoming booking card truncates the job ("Leaking tap r...") and business name because the status pill shares the row | Status pill on its own line under the date; allow two-line titles |
| Medium | C-12 Results | Header truncates to "Near SE25 · South Nor..." next to the List/Map toggle | "SE25 · 5 mi" in the header; full area name in the location picker |
| Medium | C-13 Map | Map opens zoomed in on one pin with empty roads around it | Fit the map to all results on open, with 48 px padding; keep the synced bottom carousel |
| Medium | C-16 Listing, W-06 | Cover is a flat gradient with a delivery-van icon on a plumber's listing | Use the business's cover photo; without one, a short 120 px band with the category's own icon |
| Low | C-26 Book details | Continue sits at the end of the form instead of sticky like the other steps | Sticky bottom Continue, same as C-24, C-25, C-27 |
| Low | C-24 | Disabled Continue is a pale blue that reads as enabled-but-faded | Disabled style: sky fill, muted text, no shadow |

Keep: the four-step booking stepper, the "Request: they'll confirm within 2 hours" note on C-27, Ask Answerd's three matches with a reason each and the "Not on Answerd yet, call only" card, and "Powered by Askbridge · Answerd's assistant, not a business" under the chat box.

## Business mode

| Severity | Screen | Finding | Fix |
| --- | --- | --- | --- |
| High | B-36 Billing | Gate progress shows "10 of 10 enquiries" yet the AI desk button says "Available after 10 enquiries" (the real blocker is the day-60 date, Fri 30 Oct) | Button copy follows whichever half is missing: "Available from Fri 30 Oct" or "Available after 10 enquiries"; when both are met, "Keep your desk for £49/month" |
| Medium | B-18 Today, W-13 | Needs-you rows lead with "Booking request: ..." and truncate the customer's name | Title = customer and job ("Tayo A. · Boiler service"), subtitle = type and time ("Booking request · Thu 5 Nov, 10am"), countdown on the right |
| Medium | B-30, B-32 | Desk shown with a robot icon | Answerd mark |
| Low | B-18 | Red "now" line on the timeline | Blue |
| Low | B-18 | Stat tile labels wrap onto two lines in narrow tiles | Shorter labels ("Enquiries", "Jobs", "Desk", "Views") or a 2 × 2 grid |

## Web: two sites become one, app first

The standalone site (marketing-site/) becomes **the** website at answerd.vitalos.co.uk. It takes over the useful pages the prototype built, and anything you can do in the app (message, book, manage a business) points to the app.

| From the standalone site (the base) | From the prototype's web pages (port in, restyled to the site) |
| --- | --- |
| Header with "Get the app" as the one primary button | Category hub, category-in-area and area pages (W-03 to W-05) with breadcrumbs, average prices panel, FAQs, JSON-LD |
| Hero: phone mockup with the floating desk bubble and "Booked" toast, store badges, QR "Scan to download" | Claimed and unclaimed listing pages (W-06, W-07) with sticky contact card |
| Trust strip, numbered How it works with dashed connectors | "Businesses that respond instantly near you" grid |
| Service cards with "And hundreds more" | Claim flow (W-11) as the web entry for businesses |
| Why Answerd cards with live phone snippets | Help centre (W-20), About (W-21), legal pages (W-22) |
| Navy download band, business band with floating notification cards | Smart app banner on mobile (W-26), review-from-link page (W-27) |
| FAQ accordion, footer with store badges | Chat with Answerd results (Askbridge) with business cards |
| Compact bottom-left cookie banner | Stripe checkout and portal pages for paid plans (W-18), because subscriptions are bought on the web, not in the app |

App-first rules for the merged site:

1. Every page has one primary action: "Get the app" (desktop opens the QR dialog; mobile goes to the right store).
2. On listing pages, Call works on the web (it is a tracked number); Message and Book open a "Continue in the app" sheet with the business already selected via a deep link.
3. No web booking flow, no web messaging, and no web business dashboard (inbox, diary, desk) for the MVP. Businesses claim on the web if they arrive there, then run everything in business mode in the app; the web keeps only the claim and billing pages.
4. Admin stays a web tool at /admin (staff only).

Fix on the standalone site while merging:

| Finding | Fix |
| --- | --- |
| Large empty gaps: about 200 px under the hero, after Popular services and after Why Answerd | Section padding 96 px desktop / 64 px mobile; hero height fits its content |
| Scroll-reveal animations leave cards half-faded while already on screen (Gardeners tile, step 3) | Trigger reveals earlier (viewport amount 0.15, small negative bottom margin) and finish within 400 ms |
| "List your business" goes nowhere useful yet | Point to the claim flow (W-11) once ported |

## Admin and the missing super admin

| Finding | Fix |
| --- | --- |
| 23 sidebar items in one flat list; the list scrolls and "Audit log" is cut off; the Hub button covers the sidebar footer | Group into collapsible sections: Overview; Trust (Claims, Credentials, Reviews, Reports); People (Customers, Businesses, Desk QA); Marketplace data (Listings, Imports, Coverage, Taxonomy, Places spend); Money (Billing, Monetise gate, Featured slots); System (Content, Admin users, Audit log, Settings) |
| "Desk voice provider: AskBridge Voice" | Rename to "Desk voice" with telephony-stack providers |

**Super admin (new tier, S-01 to S-10).** Role order becomes Super admin > Admin > Support. Super admin is for Vitalos leadership: everything Admin can do, plus the owner's view of the business and the controls nobody else should touch. Signs in with Google on vitalos.co.uk plus a security key or authenticator; sessions last 8 hours; every action is audited.

| ID | Screen | What is on it |
| --- | --- | --- |
| S-01 | Super admin overview | MRR and run-rate, paying businesses, trial-to-paid conversion, churn, gross margin per desk, enquiries sent to businesses this week, bookings, active customers (weekly and monthly), app installs; funnel from search to contact to booking to review; alerts (failed payments, desk error rate, Places cap, kill switch status) |
| S-02 | Revenue and plans | MRR by plan (AI desk, Featured), trials ending this week, gate status across businesses, price-test results (£39 / £49 / £69), refunds and credits |
| S-03 | Costs and margins | Monthly cost by line: telephony numbers and minutes, SMS, AI reasoning, Google Places, hosting; cost and margin per desk; budgets with caps and alerts |
| S-04 | Growth | Customers, installs, searches, contact rate, booking rate, referrals; the claim funnel (unclaimed → claimed → setup done → desk trial → paid); the same by focus city (London, Birmingham, Manchester) and category |
| S-05 | Team and roles | All staff with role (Super admin, Admin, Support), last sign-in, 2FA status; invite, change role, remove; an editable permissions matrix; quarterly access review |
| S-06 | Pricing and rules | Plan prices, trial length, monetise-gate thresholds (10 enquiries, 60 days), Featured slots per category and area, request expiry (2 hours), review rules; every change versioned with a reason and an effective date |
| S-07 | Platform switches | Kill switches beyond the desk: new sign-ups, claims, Google gap-fill, payments, Ask Answerd; maintenance mode with a customer message |
| S-08 | Integrations | Status, last error and owner for Stripe, telephony, Google Maps and Places, Askbridge, Workforce, email and push; secrets are never shown, only "rotate" and "last rotated" |
| S-09 | Impersonate and data requests | View as any customer, business or staff member, time-limited and audited with a banner; approve GDPR export and deletion requests |
| S-10 | Security log | Staff sign-ins, impersonations, exports, role changes, switch flips; filters and export; alerts for unusual activity |

The prototype needs a seventh persona (Super admin, Vitalos) and a "Super admin" section at the top of the admin sidebar that only that persona sees.

## Accessibility and responsiveness

| Finding | Fix |
| --- | --- |
| Screen ID badge sits on top of the logo on web, dashboard and admin pages | Move the badge to the top-right corner, outside the header content |
| The floating Hub button covers sidebar footers (admin, dashboard) and content on narrow web pages | Collapse it to a 40 px circle and move it to the top-right on dashboard and admin shells |
| True 390 px layouts | App at 390 × 844 and web at 390; on the web, the 8-tile service row wraps to 4 × 2 below 600 px |

## Prompt for answerd-prototype

```markdown
Fix pass on the Answerd prototype after the 25 Oct 2026 design review. Keep everything that works; change only what is listed. docs/answerd-spec.md stays the reference, plus the additions here.

1. Customer app
- C-12: compact result card about 104 px tall: avatar 48, name, category and distance, rating, one badge row capped at 2 badges plus an inline "+n", reply-time line, chevron, and one small Call icon button on the right. Remove the per-card Call/Message row. At least 4 results must fit on a 390 x 844 screen.
- C-09: category grid 4 across with 72 px tiles (8 categories in two rows) and an "All categories" text link below; remove the location chip from the Home search bar so the placeholder fits; Upcoming card puts the status pill on its own line and allows two-line titles.
- C-12 header shows "SE25 · 5 mi" instead of the truncated area name.
- C-13: fit the map to all results on open with 48 px padding.
- C-16 and W-06: use the cover photo; without one, a 120 px band with the business's own category icon (never a fixed icon).
- C-26: sticky bottom Continue like the other booking steps. Disabled primary buttons: sky fill, muted text.
- PhoneFrame: hide scrollbars inside the frame (scrollbar-width none plus the WebKit rule) while keeping scrolling; add 34 px bottom safe-area padding under every sticky bar and bottom CTA so the home indicator never overlaps a button.
- Avatars: background from brand tints only (blue-tint, teal-tint, amber-tint, sky), chosen by category.

2. Business mode
- B-36: the AI desk button follows whichever gate half is missing: "Available from Fri 30 Oct" when enquiries are met but the date isn't, "Available after 10 enquiries" when the date is met but enquiries aren't, "Keep your desk for £49/month" when both are met. Same logic for Featured and on W-18.
- B-18 and W-13 Needs you rows: title "Tayo A. · Boiler service", subtitle "Booking request · Thu 5 Nov, 10am", countdown on the right.
- B-18 stat labels: Enquiries, Jobs, Desk, Views.
- Use the Answerd mark, not a robot icon, for the desk on B-30, B-32 and W-17.
- The "now" line on B-18, B-23 and W-15 is blue, not red.

3. Brand
- Charts: calls blue #2563FF, messages teal #14B8A6, bookings navy #0F2D5B.
- Spell it "Askbridge" everywhere. "Powered by Askbridge" appears only on Ask Answerd (C-38), Chat with Answerd (W-25) and the web footer. Remove it from desk screens: the desk runs on Workforce and the telephony stack.
- A-23: rename "Desk voice provider" to "Desk voice" with options for the telephony voice stack (for example Twilio Voice, Vonage Voice), not Askbridge.

4. Admin navigation
Group the admin sidebar into collapsible sections: Overview; Trust (Claims, Credentials, Reviews, Reports); People (Customers, Businesses, Desk QA); Marketplace data (Listings, Imports, Coverage, Taxonomy, Places spend); Money (Billing, Monetise gate, Featured slots); System (Content, Admin users, Audit log, Settings). Nothing may be cut off at 1280 x 720.

5. Super admin tier (new)
- Roles become Super admin > Admin > Support. Add persona "Temitope A. · Super admin (Vitalos)". Only this persona sees a "Super admin" section at the top of the admin sidebar; Admins cannot see it, cannot change a super admin's role, and cannot use S-06 to S-09.
- Build S-01 to S-10 at /admin/super/...: S-01 Overview (MRR, run-rate, paying businesses, trial-to-paid, churn, gross margin per desk, enquiries sent, bookings, weekly and monthly active customers, installs, a search to contact to booking to review funnel, alerts); S-02 Revenue and plans (MRR by plan, trials ending, gate status, price-test results for £39/£49/£69, refunds and credits); S-03 Costs and margins (telephony, SMS, AI reasoning, Places, hosting; cost and margin per desk; budgets with caps); S-04 Growth (customers, installs, searches, contact and booking rates, referrals, claim funnel unclaimed to claimed to setup to trial to paid, split by London, Birmingham, Manchester and by category); S-05 Team and roles (staff, role, last sign-in, 2FA, invite, change role, remove, editable permissions matrix); S-06 Pricing and rules (plan prices, trial length, gate thresholds, Featured slots per area, request expiry, review rules; versioned with reason and effective date, and the change flows through to B-36, W-10 and the gate logic); S-07 Platform switches (kill switches for sign-ups, claims, gap-fill, payments, Ask Answerd; maintenance mode with a message shown in the app and web); S-08 Integrations (status, last error, owner and last-rotated date for Stripe, telephony, Google Maps and Places, Askbridge, Workforce, email, push; never show secrets); S-09 Impersonate and data requests (view as any persona, time-limited, read-only by default, banner, audited; approve GDPR export and deletion requests); S-10 Security log (staff sign-ins, impersonations, exports, role changes, switch flips, with filters and export).
- Mock data deterministic from the existing seed; charts with recharts in brand colours.
- Add S-01 to S-10 to lib/screens.ts, the hub (new "Super admin" group) and COVERAGE.md.

6. App-first web
The standalone site will become the only website; the prototype's web pages are reference only. On W-06 and W-07, Message and Book open a "Continue in the app" sheet (QR on desktop, store links on mobile, and in the prototype an "Open in app" button that goes to /app/b/[slug]). Call stays on the web. Mark W-13 to W-17 and W-19 as "Deferred: app first" in the hub (keep the code); keep W-11 claim and W-18 checkout.

7. Prototype chrome
Move the screen ID badge to the top-right corner, clear of logos. Collapse the floating Hub button to a 40 px circle, top-right on dashboard and admin shells.

8. Tests
Add Playwright journeys: J9 super admin changes the AI desk price in S-06 and B-36, W-10 and W-18 show the new price; J10 super admin views Sam's business as support from S-09, cannot edit, and the action appears in S-10. Re-run all journeys.

pnpm build, lint and every test pass. Commit with the list of IDs changed.
```

## Prompt for answerd-site

```markdown
Make this site the only Answerd website, app first, at answerd.vitalos.co.uk. Keep this site's design system (shadcn/ui on Base UI, Motion, the current tokens and components) and restyle anything you port to match it. The source for ported pages is the prototype repo answerd-prototype (screen IDs from its docs/answerd-spec.md); copy the code and the mock data you need into this repo rather than linking the repos.

1. Fix first
- Remove the large empty gaps under the hero, after Popular services and after Why Answerd: section padding 96 px desktop, 64 px mobile; the hero is only as tall as its content.
- Scroll reveals: trigger earlier (viewport amount 0.15 with a small negative bottom margin) and finish within 400 ms, so nothing is half-faded while on screen. Reduced motion still shows everything instantly.
- Spell it "Askbridge" everywhere.

2. Port these pages from the prototype
- Home gets one new section under Popular services: "Businesses that respond instantly near you" (6 cards, from the prototype's W-01).
- SEO pages: /[category] (W-03), /[category]/[area] (W-04) with breadcrumbs, filters, results, the average prices panel and FAQs, /areas/[area] (W-05). Keep generateMetadata, canonical URLs on answerd.vitalos.co.uk and JSON-LD (ItemList, LocalBusiness). Footer category and city links resolve to these.
- Listing pages /b/[slug] for claimed and unclaimed businesses (W-06, W-07) with the sticky contact card.
- Claim flow /claim (W-11), ending with "Get the app to run your business" plus the QR and store links. Every "List your business" button goes here.
- Sign-in /sign-in (W-12: phone and code, Google, email link; mocks) for businesses who need billing.
- Billing /billing, /billing/checkout and /billing/portal (W-18 mocks, clearly labelled "Prototype checkout, no card needed"), because subscriptions are bought on the web, not in the app.
- Help centre /help (W-20), About /about (W-21), legal pages (W-22: terms, privacy, cookies, review policy, acceptable use, call recording), review from link /review/[token] (W-27), and the smart app banner on mobile (W-26).

3. App-first rules
- "Get the app" stays the one primary action on every page (desktop opens the QR dialog, mobile goes to the right store).
- On listing pages, Call works on the web. Message and Book open a "Continue in the app" dialog: QR code on desktop, store buttons on mobile, using the universal link https://answerd.vitalos.co.uk/b/[slug] so the app opens on that business when installed.
- No web booking flow, no web messaging, no business dashboard (inbox, diary, desk). Businesses run everything in the app.
- Chat with Answerd (Askbridge placeholder) shows suggested businesses as cards linking to /b/[slug].

4. Quality
Responsive at 1440, 1024, 768 and 390 (the service grid wraps to 4 x 2 below 600 px and 2 x 4 below 420 px); WCAG 2.2 AA; Lighthouse 95+ on every template; every internal link resolves; pnpm build and lint pass. List what you ported, what you left out on purpose, and any placeholders.
```
