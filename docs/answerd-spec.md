# Answerd Product and Design Spec

Oct 24, 2026 · @Temitope Agbola

Answerd is the UK marketplace where every local service business picks up: customers find, call, message, book, refer and review; businesses list free and switch on an AI front desk. This spec defines every screen, flow, sign-in and action for the prototype and the MVP.

## Product summary

Answerd has four surfaces and one promise. The **customer app** (iOS and Android) finds, contacts, books and reviews any local service. **Business mode**, inside the same app, lets an owner claim a listing, run an inbox and diary, and switch on the **AI front desk**, a Workforce Receptionist agent that answers calls and texts. The **web** carries SEO listing pages, the claim flow and a desktop dashboard. The **admin console** runs moderation, data imports and support. Product rules from the [marketplace brief](https://claude.ai/artifact/VPHe3HjXAzaVhYB9rZZph6) apply throughout: free listing, three-layer supply, nothing charged before day 60 and 10 enquiries.

Every screen has an ID (C customer, B business, D desk, Q Ask Answerd, W web, A admin). The prototype prompts build screens by ID, and the coverage check at the end counts them.

Answerd lives at **answerd.vitalos.co.uk**, a Vitalos subdomain like Workforce. Its chat assistant (Ask Answerd in the app, Chat with Answerd on the web) is **powered by Askbridge**, Vitalos's website assistant; the AI front desk runs on Workforce. "Powered by Askbridge" appears on Ask Answerd, Chat with Answerd and the web footer, and nowhere on desk screens.

**One app, two modes.** There is a single Answerd app in the App Store and Google Play, for customers and businesses alike. Business mode is a mode of that app, the way Airbnb has "Switch to hosting" inside one app, not a second download.

| Question | How the one app handles it |
| --- | --- |
| How does a business owner get in? | Same download. Welcome screen (C-02) has "I run a business", Account (C-39) has "List or claim your business", and the web claim flow (W-11) ends with "Open in the app". Claiming adds a business membership to the same account. |
| How does the app know which mode to open? | It remembers the last mode. Staff-only accounts always open in business mode. Owners switch from Account or More with one tap, and the navy business header makes the mode obvious. |
| What changes between modes? | Tab bar (Home, Search, Bookings, Messages, Account vs Today, Inbox, Diary, Desk, More), the header colour, and which data loads. Same sign-in, same notifications inbox, same settings screens where they overlap. |
| What about notifications? | Each notification is tagged customer or business; tapping one switches to the right mode first, then opens the screen (a booking request opens B-22 even if the owner was browsing as a customer). |
| Deep links and the web? | answerd.vitalos.co.uk/b/swift-plumbing opens C-16; links from business emails and SMS (/biz/…) open business mode. |
| Does it bloat the customer app? | Business screens load on demand, so a customer never downloads or sees them. One store listing, one review queue, one codebase, one release train. |
| Store listing | Title "Answerd: local services", subtitle "Book local pros. Or list your business free." Screenshots show both sides. |

Design principles:

1. **Two taps to a human.** From any result, a customer reaches the business in two taps: call, message or book. Unclaimed listings still get Call.
2. **Show what was answered.** Response is the product. "Responds instantly" badges, reply times and "Answered by Answerd desk" labels are visible everywhere a choice is made.
3. **The AI is always labelled.** Every message, call summary or booking made by the desk says so, and a human can take over in one tap.
4. **Value before payment.** A business sees its enquiry history on first visit and is never asked to pay before the monetise gate.
5. **Light and spacious.** Sky backgrounds, white cards, generous spacing, one strong blue action per screen, in the brand board's style.
6. **Plain British English.** Short sentences, no jargon, prices with £ and VAT stated, dates as Sat 24 Oct, times as 2:30pm.

## Design system

The six brand colours, Inter and the speech-bubble handset mark come straight from the brand board; everything marked *derived* is added here so the palette works for states and passes WCAG AA. Contrast was checked: white on Electric Blue is 4.9:1 (passes for text and buttons), Teal on white is 2.5:1 and Amber on white is about 2:1, so neither is ever used for text on white.

**Colour tokens**

| Token | Hex | Use | Never |
| --- | --- | --- | --- |
| `navy` | #0F2D5B | Headings, wordmark, dark surfaces (reversed logo, business app header, footer) | Body copy at small sizes on Sky (use slate) |
| `blue` | #2563FF | The one primary action per screen, links, selected tab, active map pin | Large background fills |
| `blue-hover` *derived* | #1D4ED8 | Pressed and hover state of blue |  |
| `blue-tint` *derived* | #EAF0FF | Selected chips, info banners, customer chat bubble |  |
| `teal` | #14B8A6 | "Responds instantly" dot and badge fill, online status, success icons, signal arcs | Text on white; white text on teal |
| `teal-ink` *derived* | #0F766E | Teal text: "Online now", "Confirmed" |  |
| `teal-tint` *derived* | #E6F7F5 | AI desk chat bubble, success banners |  |
| `sky` | #F1F5F9 | App and page background |  |
| `white` | #FFFFFF | Cards, sheets, inputs |  |
| `slate` | #475569 | Body text, secondary icons |  |
| `muted` *derived* | #64748B | Captions, placeholders, timestamps |  |
| `border` *derived* | #E2E8F0 | Card borders, dividers, input borders |  |
| `amber` | #F59E0B | Rating stars, Featured badge fill, highlights | Text on white |
| `amber-ink` *derived* | #B45309 | Amber text: "Featured", "Expires soon" |  |
| `amber-tint` *derived* | #FEF3C7 | Warning banners, pending states |  |
| `red` *derived* | #DC2626 | Errors, destructive actions, cancelled |  |
| `red-tint` *derived* | #FEE2E2 | Error banners |  |

**Type** — Inter (Regular 400, Medium 500, Semibold 600, Bold 700), tabular numbers for prices and times, British English. Mobile sizes first, web in brackets.

| Style | Size / line | Weight | Use |
| --- | --- | --- | --- |
| Display | 30/36 (48/56) | 700, tracking −2% | Onboarding and web hero ("Local help, just a message away.") |
| Title | 24/30 (32/40) | 700 | Screen titles, business name on listing |
| Heading | 19/26 (24/32) | 600 | Section heads |
| Subhead | 16/22 (18/26) | 600 | Card titles, result names |
| Body | 15/22 (16/24) | 400 | Paragraphs, chat |
| Label | 14/20 | 500 | Buttons, chips, form labels |
| Caption | 12/16 | 500 | Meta lines, timestamps, badges |

**Space, shape, depth** — 4 px spacing scale; screen side gutter 16 (web 24, max content width 1200). Radius: buttons and chips full pill, inputs 12, cards 16, bottom sheets 24 top corners, app icon per OS. Cards are white on Sky with a 1 px `border` and shadow `0 1px 2px rgba(15,45,91,.06), 0 4px 16px rgba(15,45,91,.06)`; sheets and dialogs add `0 24px 64px rgba(15,45,91,.18)`. Motion 150 ms for taps, 250 ms for sheets, ease-out; respect reduced motion.

**Logo and icon** — Horizontal lockup (mark + wordmark + "Every business picks up.") on web header and marketing; stacked lockup on splash; mark only for app icon, favicon, map pins of desk-enabled businesses and the Ask Answerd avatar; reversed version on navy; monochrome navy where colour is unavailable. Clear space equals the mark's height. App icons: brand (white mark on blue) as default, dark (on navy) as alternate. Interface icons: Lucide, 1.75 px stroke, 20 px in lists and 24 px in tab bars.

**Core components**

| Component | Spec |
| --- | --- |
| Button | Primary blue pill 48 high (web 44), white Label text; Secondary white with `border` and navy text; Ghost navy text; Destructive red; full width on mobile forms; loading shows a spinner in place of the label |
| Action bar | Sticky bottom bar on listings: Call (secondary), Message (secondary), Book (primary); unclaimed listings show Call and Claim this business only |
| Search bar | White pill 52 high, search icon, placeholder "What service do you need?", location chip on the right ("SE25 · 2 mi") |
| Category tile | 72 square white card, Lucide icon in blue-tint circle, Label under it |
| Result card | Photo or initials avatar 56, name (Subhead), category · distance, star rating + count, badges row, one-line "Replies in under a minute" or opening status, chevron; unclaimed cards are flat with an "Unclaimed" chip |
| Badges | Pill 24 high, Caption text: Responds instantly (teal fill, navy text, live dot), Verified (blue-tint, blue check), Gas Safe / NICEIC / Insured / DBS (white, border, shield icon), Featured (amber fill, navy text), Unclaimed (sky, muted), Open now (teal-ink text), New (blue-tint) |
| Rating | Five amber stars at 14, value in Label, count in muted |
| Chat bubble | Customer: blue, white text, right. Business human: white with border, left, owner initials. AI desk: teal-tint, left, mark avatar, label "Answerd desk" above the first bubble of each turn |
| Slot picker | Horizontal date strip (Mon 26) then a grid of time pills; unavailable slots muted and struck; selected slot blue |
| Bottom sheet | White, 24 top radius, grabber, title row with close; used for filters, call confirm, report, share |
| Banner | Full-width rounded 12 card with icon: info (blue-tint), success (teal-tint), warning (amber-tint), error (red-tint) |
| Empty state | Mark illustration in a blue-tint circle, Heading, one sentence, one primary action |
| Toast | Navy pill, white text, bottom above tab bar, 4 s, optional Undo |
| Stat tile | White card, Caption label, Title value with tabular numbers, delta in teal-ink or red |
| OTP input | Six 48 boxes, auto-advance, paste fills all, resend timer "Resend in 0:30" |

**Voice** — warm, plain, local. Lines from the board are the anchors: "Every business picks up.", "Local services always within reach.", "Local help, just a message away.", "What service do you need?", "Need a local service? I'll help you find the right business.", "Local businesses. Happier customers. A stronger community." Buttons are verbs (Call, Message, Book, Claim this business). Errors say what happened and what to do next. Never "Oops".

## Roles and sign-in

One Answerd account can be a customer and a business owner at once; Account → Switch to business mode flips the app, and the choice is remembered. Accounts live in Workforce auth, so a business owner's Answerd login is also their Workforce login.

| Role | Who | Signs in with | Lands on |
| --- | --- | --- | --- |
| Guest | Anyone who has not signed in | Nothing | C-09 Home; prompted to sign in at Message, Book, Review, Save, Recommend |
| Customer | Someone who books or contacts businesses | Phone number + 6-digit SMS code (default), Sign in with Apple, Sign in with Google | C-09 Home |
| Business owner | The person who claimed or created a listing | Same customer account, then business verification (B-04); web dashboard also offers Google and an email sign-in link | B-18 Today (app) or W-13 Overview (web) |
| Business staff | Someone the owner invites | Invite link by SMS or email → phone + SMS code | B-18 Today, limited to their jobs and the inbox |
| Support agent | Vitalos staff answering tickets | Google Workspace SSO on vitalos.co.uk + authenticator app | A-02 Overview, read-only tenant views |
| Admin | Vitalos staff running the marketplace | Google Workspace SSO on vitalos.co.uk + authenticator app | A-02 Overview |

Session rules: app sessions last 90 days with silent refresh; web dashboard 30 days; admin 12 hours. Sensitive business actions (billing, transfer ownership, delete business, change payout phone) re-ask for an SMS code. Five wrong codes lock that number for 15 minutes. Signing in on a new device sends an SMS notice.

**Permissions**

| Action | Guest | Customer | Staff | Owner | Support | Admin |
| --- | --- | --- | --- | --- | --- | --- |
| Search, view listings, read reviews | Yes | Yes | Yes | Yes | Yes | Yes |
| Call a business (tracked) | Yes | Yes | — | — | — | — |
| Use Ask Answerd | Yes, 5 messages then sign in | Yes | — | — | — | — |
| Message, book, save, recommend | Sign in first | Yes | — | — | — | — |
| Review a business | No | After a completed booking or a tracked call over 60 s | — | — | — | — |
| Claim or create a listing | Sign in first | Yes | — | — | — | Yes |
| Reply to messages, manage diary and bookings | — | — | Own jobs and shared inbox | All | Read only | Read only |
| Edit profile, services, hours, photos, documents | — | — | No | Yes | No | Yes |
| Turn AI desk on, off or pause; edit desk rules | — | — | Pause only | Yes | No | Yes |
| Reply to reviews | — | — | No | Yes | No | Remove only |
| Billing, plan, Featured | — | — | No | Yes, with SMS re-check | View | Yes |
| Invite or remove staff | — | — | No | Yes | No | Yes |
| Transfer ownership, unpublish, delete business | — | — | No | Yes, with SMS re-check | No | Yes |
| Approve claims, documents, reviews; merge listings | — | — | — | — | Reviews only | Yes |
| Run imports, edit taxonomy, set Places cap | — | — | — | — | No | Yes |
| View a tenant as support (audited) | — | — | — | — | Yes | Yes |

## Information architecture

&#91;embedded content: sitemap · one app in two modes, web, admin, one backend\]

Customers and business owners use the same app; the web carries search pages and the desktop dashboard; admin is for Vitalos staff; all four read and write one store on the Workforce backend, with Ask Answerd powered by Askbridge.

## Sign-in and claim flows

&#91;embedded content: sign-in and claim flows · customer left, business right\]

Sign-in is asked for only at the moment it is needed and always returns the person to what they tapped; claiming a business is the only way into business mode, and it ends with the enquiry history the marketplace has already logged.

## Customer app

48 screens. Tab bar on main screens: Home, Search, Bookings, Messages, Account (Bookings and Messages show a count badge). Frame 390 × 844; Sky background; safe areas respected.

| ID | Screen | What is on it | Actions → where they go | States |
| --- | --- | --- | --- | --- |
| C-01 | Splash | Stacked logo on white, tagline "Every business picks up." | Auto → C-02 first launch, C-09 returning | — |
| C-02 | Welcome | 3 swipeable slides: "Local services always within reach." / "Call, message or book in two taps." / "Businesses that actually pick up."; dots; Get started; I have an account; I run a business (text link) | Get started → C-03; I have an account → C-05; I run a business → C-05 then B-01 | — |
| C-03 | Location | Map pin illustration, "Find businesses near you", Use my location, Enter a postcode | Use my location → OS prompt → C-09; Enter a postcode → C-15 | Denied → postcode field inline |
| C-04 | Notifications | "Know when a business replies", Turn on, Not now (shown after first message or booking, not at launch) | Turn on → OS prompt → back; Not now → back | — |
| C-05 | Sign in sheet | Mark, "Sign in to message and book", Continue with phone, Continue with Apple, Continue with Google, Continue as guest, terms and privacy links | Phone → C-06; Apple/Google → OS sheet → C-08 if new else back to the action; Guest → back | Error banner if Apple/Google fails |
| C-06 | Phone number | +44 prefix, number field (07…), Send code | Send code → C-07 | Invalid number inline error; rate limit banner |
| C-07 | SMS code | 6 OTP boxes, "Sent to 07700 900123", Resend in 0:30, Change number | Correct code → C-08 new / resumes the action that asked | Wrong code shake + "That code didn't match"; locked after 5 → 15 min banner |
| C-08 | About you | First name (required), last name, email (optional, for receipts), marketing consent checkbox unticked, Continue | Continue → the action that asked, else C-09 | Field errors |
| C-09 | Home | Greeting "Morning, Tayo", location chip, search bar, category grid (8 + All), "Responds instantly near you" carousel, upcoming booking card, recent searches, Ask Answerd card "Not sure who you need? Ask Answerd" | Search bar → C-11; tile → C-12 filtered; carousel card → C-16; booking card → C-30; Ask card → C-38; chip → C-15 | Loading skeletons; no location → postcode prompt card |
| C-10 | All categories | Grouped list: Home trades, Cleaning and domestic, Auto and delivery, Personal and beauty, Everything else; search within | Row → C-12 | — |
| C-11 | Search | Focused search field, suggestions as you type (services, businesses, "plumber near SE25"), recent searches with clear, popular near you | Suggestion → C-12 or C-16 | No match → "Ask Answerd instead" row |
| C-12 | Results list | Query and location header, List/Map toggle, filter chips (Open now, Responds instantly, Verified, 4★+, Within 5 mi), sort (Best match, Nearest, Top rated), result cards; Featured cards first (labelled); unclaimed cards after claimed; gap-fill cards show "Powered by Google" | Card → C-16 or C-17; Map → C-13; chip → toggle; Filters → C-14 | Skeleton; fewer than 3 → widen radius banner; none → empty with Ask Answerd |
| C-13 | Results map | Google map with pins (mark pin for desk-enabled, dot for others), cluster counts, Search this area, bottom card carousel synced with pins | Pin → highlight card; card → C-16/C-17; List → C-12 | Location off → centred on postcode |
| C-14 | Filters sheet | Distance slider 1–25 mi, availability (Today, This week), rating, credentials (Gas Safe, NICEIC, Insured, DBS), price type, Reset, Show 42 results | Show → C-12 | Live count |
| C-15 | Location picker | Use current location, postcode field with lookup, saved places (Home, Work), recent areas | Pick → back to the screen that opened it | Unknown postcode error |
| C-16 | Listing (claimed) | Cover photo, logo, name, category, badges, rating, distance, "Usually replies in 1 min", open status; tabs or sections: About, Services and prices, Photos, Reviews, Credentials, Service area, Hours; Recommend and Save icons; Report in overflow; sticky action bar Call / Message / Book | Call → C-20; Message → C-22 (sign in first); Book → C-24 (sign in first); Photos → C-18; See all reviews → C-19; Recommend → share sheet; Report → C-45 | Book hidden if no bookable services; closed → "Opens 8am" |
| C-17 | Listing (unclaimed) | Name, category, address, phone, Google rating with attribution if gap-fill, map, "This business hasn't joined Answerd yet", Call, Is this your business? Claim it, Ask them to join (share) | Call → C-20; Claim → B-01 prefilled; Ask them to join → share sheet | — |
| C-18 | Photo gallery | Full-screen swipe, counter, caption | Close → back | — |
| C-19 | Reviews | Average, distribution bars, filter by stars, sort, review cards with business replies | Report review → C-45 | No reviews → "Be the first after your booking" |
| C-20 | Call sheet | Business name, "You'll call via an Answerd number so they know you found them here", note if desk-enabled "If they're busy, their Answerd desk will pick up", Call now, Cancel | Call now → OS dialer, then C-21 on return | — |
| C-21 | After the call | "Did you get through?" Yes, booked it / Yes, not booked / No answer | Booked → add booking details form → C-30; Not booked → Message or Back; No answer → Message, Try similar (C-12) | Shown once per call |
| C-22 | Message thread | Header with business, online dot, Call icon; bubbles (customer, business, AI desk labelled); inline cards for proposed slots, quotes and booking confirmations; composer with photo attach and quick replies ("Are you free this week?", "How much for…"); "Answerd desk is replying…" typing | Slot card → C-27 prefilled; quote card → accept/decline; Call → C-20 | First message → C-23 template; business offline → "Usually replies in 2 hours" |
| C-23 | New enquiry | "What do you need?" text, photos (up to 5), postcode, when (ASAP, this week, flexible), Send | Send → C-22 | Validation |
| C-24 | Book: service | Business mini-header, list of bookable services with duration and price (£85, From £60, Quote), Continue | Continue → C-25 | — |
| C-25 | Book: time | Date strip, time pills or windows (Morning 8–12), "Times shown in the business's availability" | Pick → C-26 | No slots this week → next available + Message instead |
| C-26 | Book: details | Address (saved or new, postcode lookup), access notes, job description, photos, contact phone (prefilled) | Continue → C-27 | Outside service area → error and alternatives |
| C-27 | Book: confirm | Summary card (service, date, time, address, price), cancellation policy, "Instant" or "Request — they'll confirm within 2 hours", Confirm booking | Confirm → C-28 | Slot taken while booking → sheet with next 3 slots |
| C-28 | Booked | Tick animation, "You're booked" or "Request sent", summary, Add to calendar, Message business, Done | Done → C-30; triggers C-04 first time | — |
| C-29 | Bookings | Tabs Upcoming / Past; cards with status pill (Requested, Confirmed, On the way, Completed, Cancelled, Declined) | Card → C-30 | Empty → "No bookings yet" + Find a service |
| C-30 | Booking detail | Status timeline, business card, service, date, time, address with map, price, notes; actions Message, Call, Reschedule, Cancel, Get directions, Get help; Review button after completion | Reschedule → C-31; Cancel → C-32; Review → C-34; Message → C-22 | Declined → banner with similar businesses |
| C-31 | Reschedule | Slot picker, reason (optional), Send request | Send → C-30 with "Change requested" | — |
| C-32 | Cancel | Reason list, policy reminder ("Free to cancel until 24 hours before"), Cancel booking (destructive) | Confirm → C-30 cancelled + toast | Inside policy window → warning |
| C-33 | Messages | Thread list: avatar, name, last line, time, unread dot, "Answerd desk" tag when last reply was AI | Row → C-22 | Empty → "Message a business and replies land here" |
| C-34 | Write a review | Stars (required), quality, punctuality, value, communication (1–5 each), text (min 20 chars), photos, "Post publicly as Tayo A." | Post → C-35 | — |
| C-35 | Review posted | Thanks, "Recommend Swift Plumbing to a friend?" Share, Done | Share → share sheet; Done → C-30 | — |
| C-36 | Invite friends | Personal link and code, Share, list of friends who joined | Share → share sheet | — |
| C-37 | Saved | Saved businesses grid with quick Call/Message | Card → C-16 | Empty state |
| C-38 | Ask Answerd | Chat with the Answerd mark: "Need a local service? I'll help you find the right business." Suggested prompts; Answerd asks follow-ups (postcode, urgency), then shows up to 3 business cards with why each fits and Call / Message / Book | Card actions → C-20 / C-22 / C-24 | Guest limit 5 messages → C-05; emergency → safety card (Q-05) |
| C-39 | Account | Name and phone, Saved, Saved places, Invite friends, Notifications, Privacy and data, Help, List or claim your business / Switch to business mode, Sign out | Rows → C-37, C-41, C-36, C-42, C-43, C-44, B-01 or B-18 | Guest → sign-in card at top |
| C-40 | Edit profile | Photo, first, last, email, phone (change needs new code) | Save → C-39 | — |
| C-41 | Saved places | Home, Work, add place | Add → C-15 | — |
| C-42 | Notification settings | Toggles: booking updates (push, SMS), messages (push), reminders, review requests, offers (off by default) | Instant save | — |
| C-43 | Privacy and data | Marketing consent toggle, Download my data, Delete account, privacy policy | Download → confirmation toast (email sent); Delete → C-47 | — |
| C-44 | Help | Search FAQs, top questions, Contact support (in-app ticket), Report a problem | Contact → form → toast | — |
| C-45 | Report | Sheet: reason list (wrong info, closed, fake, offensive, safety), details, Send | Send → toast "Thanks, we'll review it" | — |
| C-46 | Notifications | Activity feed: replies, confirmations, reminders, review requests | Row → relevant screen | Empty state |
| C-47 | Delete account | What will be deleted, upcoming bookings warning, type DELETE, SMS code, Delete | Confirm → C-02 | Blocks if a booking is today |
| C-48 | Offline and errors | Offline banner, retry cards, "Something went wrong" with Try again, maintenance screen | Try again → reload | — |

## Business mode

41 screens. A navy header strip with the business name and a "Business" pill tells the owner which mode they are in. Tab bar: Today, Inbox, Diary, Desk, More. Staff see Today, Inbox and Diary only.

| ID | Screen | What is on it | Actions → where they go | States |
| --- | --- | --- | --- | --- |
| B-01 | Find your business | "Let's find your business", name field, postcode, Search; results from all three layers with address and source hint; "Can't see it? Add your business" | Result → B-02; Add → B-03 | Already claimed by someone else → "Dispute this claim" form |
| B-02 | Is this you? | Listing preview as customers see it, enquiries waiting teaser ("6 people tried to reach you this month"), Yes, claim it; Not mine | Claim → B-04; Not mine → B-01 | — |
| B-03 | Add your business | Business name, category (searchable), phone, postcode or service area, sole trader / partnership / limited company (Companies House number if Ltd) | Continue → B-04 | Duplicate found → "Is it one of these?" |
| B-04 | Verify ownership | Methods: Text a code to 0208 … 123 (the listed number), Call me with a code, Confirm as a company director (Ltd only), Upload a document | Text/Call → B-05; Director → B-06; Upload → B-07 | Listed number is a landline → Text hidden |
| B-05 | Enter code | 6 OTP boxes, resend timer | Correct → B-08 | Wrong code; locked |
| B-06 | Director check | Director full name, month and year of birth, matched against Companies House officers | Match → B-08; no match → B-07 | — |
| B-07 | Upload a document | Utility bill, bank letter, insurance schedule or HMRC letter in the business name; camera or file; "We'll check it within 1 working day" | Submit → pending screen → B-09 with banner "Verification pending" | Rejected → reason + upload again |
| B-08 | You're in | Confetti-free success: "Swift Plumbing is yours", enquiry history card ("14 calls and 3 messages from Answerd since 1 Oct"), Set up your profile | Continue → B-09 | — |
| B-09 | Setup checklist | Progress ring and steps: Details, Services, Hours, Service area, Photos, Credentials, Booking settings, Try the AI desk; each with done tick | Step → B-10 … B-17, B-30 | Shown on B-18 until complete |
| B-10 | Business details | Name, trading name, description (500 chars), categories (up to 3), phone shown to customers, email, website, social links, year founded | Save → back + toast | Validation |
| B-11 | Services and prices | List with duration and price; Add service; reorder; bookable toggle per row | Row → B-12; Add → B-12 empty | Empty → suggested services for the category |
| B-12 | Edit service | Name, description, duration, price type (Fixed £, From £, Hourly £, Quote only), VAT included toggle, bookable online, photo, Delete | Save → B-11 | — |
| B-13 | Hours and availability | Weekly opening hours, booking windows or fixed slots, lead time (e.g. 2 hours), buffer between jobs, max jobs per day, holidays | Save | Overlap errors |
| B-14 | Service area | Radius from base postcode (slider) or pick postcode districts on a map; travel charge note | Save | — |
| B-15 | Photos | Grid upload, set cover, reorder, captions | Save | Max 30 |
| B-16 | Credentials | Cards: Gas Safe (registration number), NICEIC or NAPIT, public liability insurance (upload, expiry), DBS, qualifications; status chips Pending, Verified, Expired, Expires soon | Add → form with upload; Verified shows badge on listing | Rejected with reason |
| B-17 | Booking settings | Instant booking or Request to book (respond within 2 hours), cancellation policy (free until 24 h / 48 h / custom), reminders to customer, deposit (Phase 3, disabled) | Save | — |
| B-18 | Today | Greeting, desk status pill (Live / Paused / Off), stat row (New enquiries, Jobs today, Desk handled, Profile views), Needs you list, today's jobs timeline, setup checklist card, monetise-gate card when reached | Rows → B-20 / B-24; desk pill → B-32 | No jobs → "Clear day" |
| B-19 | Inbox | Filters: All, Needs you, Desk handled, Calls, Booking requests; rows show channel icon (call, SMS, app), customer, summary, time, "Desk" tag | Row → B-20 / B-21 / B-22 | Empty per filter |
| B-20 | Conversation | Bubbles with AI desk turns labelled, Take over toggle (pauses desk for this thread), Mark as mine, quick replies, Propose times, Send quote, customer details panel (past bookings, notes) | Propose → slot picker → card sent; Quote → B-26; Call → dialer | Desk paused banner |
| B-21 | Call detail | Caller (masked), time, duration, outcome (Answered by you / Answered by desk / Missed), desk summary, recording player with transcript, Booked? link, Call back, Message | Call back → dialer; booking link → B-24 | No recording if desk off |
| B-22 | Booking request | Customer, service, requested time, address, notes, photos; Accept, Decline (reason), Suggest another time | Accept → B-24 confirmed; Decline → B-19; Suggest → slot picker | Expires in 2 h countdown |
| B-23 | Diary | Day / Week / List toggle, jobs as blocks coloured by status, blocked time hatched, today line; tap empty slot | Job → B-24; empty → B-25 | — |
| B-24 | Job | Customer, phone (call/message), address with Navigate, service, price, notes, photos, status stepper Confirmed → On my way → Arrived → Completed; Reschedule, Cancel, Mark no-show | Status taps notify the customer; Completed → desk sends review request | Cancelled read-only |
| B-25 | Add to diary | Segmented: Booking (customer, service, time) or Block time (reason, repeat) | Save → B-23 | Clash warning |
| B-26 | Send quote | Line items, total incl. VAT, valid until, message, Send | Send → B-20 with quote card | — |
| B-27 | Reviews | Average, list, Reply (one public reply per review), Report | Reply → inline composer | — |
| B-28 | Stats | Range picker; chart of enquiries by week split into calls, messages, bookings; profile views, search appearances, conversion, desk-handled share, response time | — | Under 7 days of data note |
| B-29 | Share your profile | Profile link, QR code, "Review us on Answerd" printable card, share to WhatsApp | Share → share sheet; download card | — |
| B-30 | AI desk intro | What it does in four lines, play a sample call, "£49/month after your free trial. You won't pay anything before you've had 10 enquiries from Answerd." Start 14-day free trial | Start → B-31 | Already trialled → Upgrade → B-36 |
| B-31 | Desk setup | Six steps: 1 your Answerd number (assigned 020 …) and how to forward missed calls from your mobile (EE, O2, Vodafone, Three codes); 2 greeting and voice; 3 what the desk may do (answer calls, reply to texts, book jobs, follow up quotes, ask for reviews); 4 handoff rules; 5 test call; 6 go live | Finish → B-32 live | Forwarding not detected → warning, can still go live for texts |
| B-32 | Desk | Status Live / Paused with toggle, today: calls answered, messages replied, jobs booked, handed to you; recent conversations; trial days left | Row → B-20 / B-21; Pause → confirm sheet | Trial ending banner |
| B-33 | Test call | Phone-call style screen simulating a customer call to the desk with live transcript and the desk's actions (slot offered, booking made) | End → B-32 | — |
| B-34 | What the desk knows | Pulled from profile (services, prices, area, hours) with edit links; custom Q&A list; things it must never say | Add Q&A | — |
| B-35 | Handoff rules | Always hand over: emergencies, complaints, price negotiation, named requests; quiet hours; who gets alerts (owner, staff) | Save | — |
| B-36 | Plan and billing | Current plan card (Free listing / Desk trial / AI desk £49 / Featured £29), monetise-gate progress ("7 of 10 enquiries"), payment method, invoices, Manage on web | Upgrade → web checkout (W-18) in browser; Cancel → confirm with SMS re-check | Payment failed banner |
| B-37 | Featured | Availability for your categories and areas ("2 of 3 slots free in Plumbers · Croydon"), what you get, £29/month | Get Featured → W-18 | Not yet available → "Coming when your area has 20+ businesses" |
| B-38 | Team | Members with role, Invite (name, phone, role Staff), remove | Invite → SMS sent toast | — |
| B-39 | Business notifications | New enquiry, desk handoff, booking request, daily digest 7am, review posted; channels push, SMS, email | Instant save | — |
| B-40 | Business settings | Switch business (if several), transfer ownership, unpublish listing, delete business | Each sensitive action → SMS re-check | — |
| B-41 | More | Profile and services, Stats, Reviews, Share profile, Plan and billing, Featured, Team, Notifications, Settings, Help, Switch to customer mode | Rows → B-10…B-40; switch → C-09 | — |

## AI front desk and Ask Answerd

Two AI agents, both always labelled. The desk runs on Workforce; Ask Answerd runs on Askbridge, Vitalos's website assistant, and is captioned "Powered by Askbridge". The **desk** speaks for one business and knows only that business's profile, diary and Q&A. **Ask Answerd** speaks for the marketplace, helps a customer choose, and never books on a business's behalf without the customer tapping Book.

**Desk conversations (D)** — these are behaviours, not screens; in the prototype each one is a scripted simulation the owner can play from B-33 and the customer sees in C-22.

| ID | Trigger | What the desk does | Hands to a human when | Ends with |
| --- | --- | --- | --- | --- |
| D-01 | Call to the business's Answerd number unanswered after 15 s, or outside hours | Greets: "Hi, you've reached Swift Plumbing. I'm their Answerd assistant and this call is recorded. How can I help?" Takes the job, postcode and urgency; checks the service area; offers the next two free slots | Caller asks for the owner by name, sounds distressed, or the job is outside listed services | SMS to caller confirming what happens next; B-21 log with summary |
| D-02 | Inbound SMS to the Answerd number | Replies within 30 s from the profile; offers slots; books on a clear yes | Price negotiation, complaint, more than 3 unanswered questions | Thread in B-20 |
| D-03 | In-app message (C-22) when the owner hasn't replied in 2 minutes | Same as D-02, inside the app thread, labelled "Answerd desk" | Owner taps Take over | — |
| D-04 | Customer agrees a time on a call or text | Writes the booking to the diary (instant or request per B-17), sends confirmation and calendar invite | Slot conflict the rules can't solve | Booking in C-30 and B-24 |
| D-05 | Owner marks a job Quoted | Follows up at 2 days and 7 days: "Hi Sam, just checking you got Swift Plumbing's quote for the boiler service. Happy to book a time?" | Customer asks questions not in the quote | Accepted quote → D-04 |
| D-06 | Job marked Completed | One review request by push or SMS with a link to C-34 | Never asks twice | — |
| D-07 | 7:00 each day | SMS digest to owner: today's jobs, overnight enquiries, what needs them | — | — |
| D-08 | Any handoff rule | Tells the customer "I'll get Sam to call you back within the hour", alerts the owner by push and SMS with the summary | — | B-19 "Needs you" |
| D-09 | Emergency words (gas smell, flooding, sparks, no heating with a vulnerable person) | Gas: "Please leave the property and call the National Gas Emergency Service on 0800 111 999 now." Danger to life: "Please call 999." Power cut: "Call 105." Then offers the business's emergency callout if listed | Always alerts the owner immediately | Never books before safety advice is given |
| D-10 | Abuse, spam, sales calls | Politely ends; logs as spam | — | Hidden from Needs you |

Desk hard rules: never invents a price outside the business's listed ranges; never confirms a job outside the service area; never shares the owner's personal number; says it is an AI if asked and at the start of every call; every action is reversible from the owner's inbox; recording notice on every call.

**Ask Answerd (Q)** — the concierge from the brand board ("Chat with Answerd"), in the app (C-38) and as a web widget (W-25).

| ID | Step | Behaviour |
| --- | --- | --- |
| Q-01 | Open | "Need a local service? I'll help you find the right business." Chips: "Boiler not working", "End of tenancy clean", "Car won't start", "Haircut today" |
| Q-02 | Understand | Turns free text into a category, urgency and location; asks at most two questions ("What's your postcode?", "Is water leaking now?") |
| Q-03 | Match | Searches the three layers, ranks desk-enabled and verified businesses first, shows up to 3 cards with one line each on why it fits ("Gas Safe, replies in a minute, free tomorrow 9am") and "Businesses are online" status |
| Q-04 | Act | Card buttons Call, Message, Book open the normal flows; Ask Answerd can pre-fill the enquiry (C-23) with the details already given |
| Q-05 | Safety | Same emergency rules as D-09; no medical, legal or financial advice; refers to 999 when life is at risk |
| Q-06 | Limits | Guests get 5 messages then C-05; never claims to be a business; says when it found nothing nearby and offers to widen the radius |

## Web

27 screens at answerd.vitalos.co.uk. Header from the board: logo, Find a business, List your business, How it works, Sign in; on scroll it compacts and adds the search bar. Breakpoints 1440, 1024, 768, 390; every public page works at phone width and offers the app through a smart banner.

| ID | Page | What is on it | Actions → where they go | States |
| --- | --- | --- | --- | --- |
| W-01 | Home | Hero "Local help, just a message away." with search ("What service do you need?" + postcode), popular categories, How it works in three steps, "Businesses that respond instantly near you", For businesses band ("Every business picks up." + List your business), app download, footer with category and city links | Search → W-02; category → W-03; List → W-09; Chat with Answerd → W-25 | Location from IP, editable |
| W-02 | Search results | List left, Google map right (stacked on mobile), filters as on C-14, result cards | Card → W-06 / W-07 | Empty with Ask Answerd |
| W-03 | Category hub | /plumbers: intro, top cities, what it costs guide, FAQs, featured businesses | City → W-04 | — |
| W-04 | Category in area | /plumbers/croydon: H1 "Plumbers in Croydon", count, filters, results, average prices, FAQs, nearby areas; structured data for local business lists | Card → W-06 / W-07 | Thin area → includes neighbouring areas |
| W-05 | Area hub | /areas/croydon: all categories in the area | Category → W-04 | — |
| W-06 | Listing (claimed) | Same content as C-16 in two columns; sticky right card with Call, Message, Book (opens app or web booking), Responds instantly badge | Book → web booking (same steps as C-24 to C-28); Message → sign in → thread | — |
| W-07 | Listing (unclaimed) | Same content as C-17; prominent "Is this your business? Claim it free" | Claim → W-11 | — |
| W-08 | How it works | For customers: find, contact, book, review; trust and verification explained | Download app; search | — |
| W-09 | For businesses | "Every business picks up." hero, free listing, enquiries you can see, AI front desk demo player, testimonials (real only, none at launch), pricing preview, FAQs | Claim or add → W-11; See pricing → W-10 | — |
| W-10 | Pricing | Free listing £0, AI desk £49/month with 14-day trial, Featured £29/month, all ex VAT; "You'll never pay before you've had 10 enquiries from Answerd" | Start → W-11 | — |
| W-11 | Claim or add | Desktop version of B-01 to B-08 in a centred card stepper | Done → W-13 | Same states as B-01 to B-08 |
| W-12 | Sign in | Phone + SMS code, Continue with Google, Email me a sign-in link | → W-13 (business) or account page (customer) | Errors as C-07 |
| W-13 | Dashboard: Overview | Left sidebar (Overview, Inbox, Diary, Profile, AI desk, Reviews, Stats, Billing, Team, Settings); stat row, Needs you, today's jobs, enquiries chart | Items → W-14…W-19 | Setup checklist banner |
| W-14 | Dashboard: Inbox | Three panes: filters, thread list, conversation (as B-19, B-20, B-21) | — | — |
| W-15 | Dashboard: Diary | Week calendar with drag to reschedule, job side panel (B-24) | — | — |
| W-16 | Dashboard: Profile | Tabs: Details, Services, Hours, Service area, Photos, Credentials, Booking settings (B-10 to B-17) | Save per tab | — |
| W-17 | Dashboard: AI desk | B-31 to B-35 laid out as tabs: Overview, Setup, Knowledge, Handoff, Test call | — | — |
| W-18 | Dashboard: Billing | Plan cards, monetise-gate progress, Stripe Checkout for AI desk and Featured, Stripe customer portal for card and invoices, cancel | Checkout → Stripe hosted page → back with success toast | Payment failed banner |
| W-19 | Dashboard: Team and settings | B-38 to B-40 | — | — |
| W-20 | Help centre | Search, articles for customers and businesses, contact form | — | — |
| W-21 | About | Answerd by Vitalos, chat powered by Askbridge, mission line "Local businesses. Happier customers. A stronger community.", contact | — | — |
| W-22 | Legal | Terms, privacy notice, cookie policy, review policy, acceptable use, desk call-recording notice | — | — |
| W-23 | Cookie banner | Accept all, Reject non-essential (equal weight), Manage | Choice saved | Defaults to essential only |
| W-24 | Not found and errors | 404 with search, 500 with retry | — | — |
| W-25 | Chat with Answerd | Floating pill button bottom right ("Chat with Answerd"), opens a 380-wide panel running Q-01 to Q-06 | Card actions → W-06 | Guest limit |
| W-26 | Get the app | QR code, App Store and Google Play badges, smart banner on mobile | — | — |
| W-27 | Review from link | Opened from the D-06 SMS or email: stars, text, photos without installing the app (signed link) | Post → thank-you with app prompt | Expired link → sign in |

## Admin console

23 screens at answerd.vitalos.co.uk/admin for Vitalos staff. Desktop only (1280+), navy sidebar, white canvas, dense tables. Every write action asks for a reason and lands in the audit log (A-22).

| ID | Screen | What is on it | Actions | States |
| --- | --- | --- | --- | --- |
| A-01 | Sign in | "Sign in with Google" restricted to vitalos.co.uk, then authenticator code | → A-02 | Wrong domain error |
| A-02 | Overview | KPIs: listings by layer (claimed, seeded, Places), claims today, bookings this week, desks live, trials, paying desks, MRR, Places spend vs daily cap; coverage gaps count; queue counts | KPI → its screen | — |
| A-03 | Listings | Table: name, category, area, layer, claimed, verified, desk, rating, last activity; filters; bulk suspend or recategorise | Row → A-04 | — |
| A-04 | Listing detail | Fields by source (Companies House, OSM, Places ID, owner edits), history, enquiries, reviews, documents; Edit, Suspend, Unpublish, Merge | Merge → A-05 | Suspended banner |
| A-05 | Merge | Side-by-side duplicates, choose surviving fields, Merge | Confirm with reason | — |
| A-06 | Claims queue | Pending document claims and disputes; document viewer; Approve, Reject (reason), Ask for more | — | SLA timer 1 working day |
| A-07 | Credentials queue | Gas Safe, NICEIC/NAPIT, insurance, DBS submissions with register lookup links; Approve, Reject, set expiry | — | Expiring in 30 days list |
| A-08 | Reviews | Flagged and new reviews; Keep, Remove (policy reason), Contact reviewer | — | — |
| A-09 | Reports | Listing and user reports with reason; resolve actions | — | — |
| A-10 | Customers | Search by phone or name; profile, bookings, reports; Suspend; data export and deletion requests | — | — |
| A-11 | Businesses | Tenants with plan, desk status, gate progress; View as support (read-only, banner, audited) | View as → business screens read-only | — |
| A-12 | Desk QA | Random sample of desk conversations with transcript; mark Good, Wrong info, Bad handoff, Unsafe; feed to prompt fixes | — | — |
| A-13 | Imports | Companies House and OpenStreetMap jobs: last run, rows added, updated, errors; Run now | — | Failed job banner |
| A-14 | Coverage | Heatmap grid of 121 postcode areas × core categories, cell = result count, red under 5; click to seed | Cell → filtered A-03 | — |
| A-15 | Taxonomy | Category tree with mappings to SIC codes, OSM tags and Google Places types; add, rename, merge | — | — |
| A-16 | Places spend | Daily spend chart, cap, cache hit rate, calls by SKU; change cap | — | Cap reached → gap-fill off banner |
| A-17 | Billing | Subscriptions, trials ending, failed payments, refunds (link to Stripe) | — | — |
| A-18 | Monetise gate | Launch date, day-60 date, per-business enquiry counter, manual overrides with reason | — | — |
| A-19 | Featured slots | Grid of category × area with 3 slots each, holders, waitlist | — | — |
| A-20 | Content | Home categories order, banners, SEO page intro templates, FAQs | — | — |
| A-21 | Admin users | Staff with role Admin or Support; invite, remove | — | — |
| A-22 | Audit log | Who did what, when, to which record, reason; filter and export | — | — |
| A-23 | Settings | Feature flags (Featured on, gap-fill on, desk voice provider), emergency kill switch for the desk | Kill switch → confirm with code | — |

## Core flow end to end

&#91;embedded content: core booking flow · customer, desk and business lanes\]

A call or message that the owner misses goes to the desk, which can book directly; a booking request goes to the owner, who has 2 hours to answer. Either way the customer gets one confirmation, the job-day updates, one review request, and the review updates the rating on every surface. What happens when a step fails (slot taken, request expires, outside the area, no-show) is in the edge-case table under States.

## Notifications

Every notification is transactional, about something the recipient started or owns, so none needs marketing consent. Push first, SMS when push is off or the matter is time-critical, email for receipts and digests. Marketing messages are separate, off by default, and never sent to sole traders without consent (PECR).

| Event | Recipient | Push | SMS | Email | Copy (push) | Opens |
| --- | --- | --- | --- | --- | --- | --- |
| New message | Customer / business | Yes | If push off | — | "Swift Plumbing: We can do Tuesday 9am" | C-22 / B-20 |
| Desk replied to customer | Customer | Yes | — | — | "Swift Plumbing's Answerd desk replied" | C-22 |
| Missed call answered by desk | Business | Yes | — | — | "Your desk took a call from Sam: leaking tap, SE25. Booked Tue 9am." | B-21 |
| Handoff to you | Business | Yes | Yes | — | "Sam needs you: wants to talk about price. Call back within the hour." | B-20 |
| Booking request | Business | Yes | Yes | — | "New booking request: boiler service, Thu 2pm. Reply within 2 hours." | B-22 |
| Booking confirmed | Customer | Yes | Yes | Yes (receipt + calendar file) | "You're booked with Swift Plumbing, Thu 29 Oct, 2pm" | C-30 |
| Booking declined or expired | Customer | Yes | Yes | — | "Swift Plumbing can't make it. Here are 3 others free that day." | C-30 |
| New time proposed | Customer | Yes | — | — | "Swift Plumbing suggested Fri 10am instead" | C-22 |
| Reminder 24 h before | Customer and business | Yes | Customer only | — | "Tomorrow 2pm: Swift Plumbing at 12 Elm Rd" | C-30 / B-24 |
| On my way | Customer | Yes | Yes | — | "Sam from Swift Plumbing is on the way" | C-30 |
| Cancelled by either side | The other side | Yes | Yes | Yes | "Your Thu 2pm booking was cancelled" | C-30 / B-24 |
| Review request (D-06) | Customer | Yes | If push off | — | "How did Swift Plumbing do?" | C-34 / W-27 |
| New review | Business | Yes | — | Weekly roundup | "New 5★ review from Priya" | B-27 |
| Reply to your review | Customer | Yes | — | — | "Swift Plumbing replied to your review" | C-19 |
| Daily digest (D-07) | Business | — | Yes, 7am | — | — | B-18 |
| Claim verified or rejected | Business | Yes | Yes | Yes | "You're verified. Swift Plumbing is live on Answerd." | B-09 |
| Credential verified, rejected or expiring in 30 days | Business | Yes | — | Yes | "Your insurance expires on 12 Nov. Upload the new certificate." | B-16 |
| Desk trial started, 3 days left, ended | Business | Yes | — | Yes | "3 days left on your AI desk trial" | B-36 |
| Monetise gate reached | Business | Yes | — | Yes | "Answerd sent you 10 enquiries. Keep your desk for £49/month." | B-36 |
| Payment failed | Business | Yes | Yes | Yes | "We couldn't take this month's payment. Update your card to keep your desk." | W-18 |
| Enquiries for an unclaimed listing | Limited companies only | — | — | Monthly, with opt-out | — | W-11 |
| Friend joined from your invite | Customer | Yes | — | — | "Ade joined Answerd from your invite" | C-36 |
| New sign-in on another device | Any user | — | Yes | — | — | — |

## Data model

The prototype keeps these as typed mock collections in one client store; the MVP keeps them in Postgres inside the Workforce marketplace module. A **Listing** is what customers see; a **Business** exists only once a listing is claimed, and it maps one-to-one to a Workforce tenant.

| Entity | Key fields | Notes |
| --- | --- | --- |
| User | id, phone, email, firstName, lastName, authProviders\[\], marketingConsent, createdAt | One user can hold a CustomerProfile and BusinessMemberships |
| CustomerProfile | userId, savedPlaces\[\], savedListingIds\[\], referralCode |  |
| Listing | id, slug, name, categoryIds\[\], layer (claimed / seeded / places), address, postcodeDistrict, geo (lat, lng), phonePublic, rating, reviewCount, badges\[\], businessId?, sourceRefs | Places listings store only placeId; everything else fetched at display time |
| SourceRef | listingId, source (companies\_house / osm / places / owner), externalId, fetchedAt | lat/lng from Places expires after 30 days |
| Business | id, listingId, tenantId, legalType (sole\_trader / partnership / ltd), companyNumber?, description, website, verifiedAt, status (pending / live / suspended) | Created on claim |
| BusinessMember | businessId, userId, role (owner / staff), invitedAt, joinedAt |  |
| Category | id, name, parentId, icon, sicCodes\[\], osmTags\[\], placesTypes\[\] | One tree, edited in A-15 |
| Service | id, businessId, name, description, durationMin, priceType (fixed / from / hourly / quote), pricePence, vatIncluded, bookable |  |
| Availability | businessId, weeklyHours, slotMode (slots / windows), leadTimeMin, bufferMin, maxPerDay, holidays\[\] |  |
| ServiceArea | businessId, basePostcode, radiusMiles or districts\[\] |  |
| Credential | id, businessId, type (gas\_safe / niceic / napit / insurance / dbs / qualification), number, fileUrl, expiresAt, status (pending / verified / rejected / expired) | Verified ones become badges |
| Claim | id, listingId, userId, method (sms / call / director / document), status, evidenceUrl?, decidedBy?, reason? |  |
| Thread | id, listingId, customerId, channel (app / sms / call), status (open / needs\_owner / closed), deskActive |  |
| Message | id, threadId, author (customer / owner / staff / desk / system), body, attachments\[\], cards (slot / quote / booking), createdAt | Desk messages always author = desk |
| Call | id, listingId, trackedNumber, callerMasked, startedAt, durationSec, outcome (owner / desk / missed), recordingUrl?, transcript?, summary? | Counts as an enquiry |
| Enquiry | id, listingId, kind (call / message / booking / profile\_view), at, layer | Feeds stats, unclaimed digests and the monetise gate |
| Booking | id, listingId, customerId, serviceId, startAt, endAt, address, notes, photos\[\], status (requested / confirmed / on\_the\_way / arrived / completed / cancelled / declined / no\_show), createdBy (customer / owner / desk), policy |  |
| BookingEvent | bookingId, type, actor, at, reason? | Timeline in C-30 and B-24 |
| Quote | id, threadId, lines\[\], totalPence, validUntil, status (sent / accepted / declined / expired) | Follow-ups by D-05 |
| Review | id, listingId, bookingId or callId, customerId, stars, aspects{quality, punctuality, value, communication}, text, photos\[\], status (live / removed), reply?, createdAt |  |
| Referral | id, referrerUserId, kind (invite / recommend), listingId?, code, joinedUserId? |  |
| DeskConfig | businessId, status (off / trial / live / paused), number, voice, greeting, permissions{calls, sms, book, quotes, reviews}, handoffRules, qna\[\], trialEndsAt |  |
| Subscription | businessId, plan (free / desk / featured), status (trialing / active / past\_due / cancelled), stripeId, currentPeriodEnd |  |
| FeaturedSlot | categoryId, areaCode, position (1–3), businessId?, startsAt |  |
| Notification | id, userId, event, channel, body, readAt |  |
| Report | id, target (listing / review / user), reason, details, status |  |
| AuditEvent | id, actorId, action, targetType, targetId, reason, at | Every admin write |

## States, accessibility and analytics

Every list and data screen has four states: loading (skeletons shaped like the content, never spinners on full screens), empty (mark illustration, one sentence, one action), error (what happened, Try again) and offline (sticky banner "You're offline. We'll send it when you're back."; messages queue with a clock icon). Edge cases the prototype must show:

| Case | Behaviour |
| --- | --- |
| Slot taken during booking | C-27 sheet with the next 3 free slots; booking not lost |
| Request not answered in 2 hours | Booking expires, customer notified with 3 similar businesses free at that time |
| Business at holiday or closed | Book disabled with "Back on Mon 3 Nov"; Message still works; desk says when they're back |
| Customer outside service area | C-26 error with businesses that do cover the postcode |
| Desk paused or trial ended | Customer sees normal reply times; no "Responds instantly" badge; owner sees banner on B-32 |
| Listing claimed by someone else | B-01 dispute flow → A-06 |
| Credential expired | Badge removed automatically, owner alerted |
| Places daily cap reached | Gap-fill results hidden; results come from claimed and seeded layers only; admin banner |
| No-show | Owner marks no-show on B-24; customer can dispute within 48 hours; repeated no-shows flag the customer in A-10 |
| Duplicate listings | Admin merge (A-05); reviews and enquiries move to the survivor |
| Review without a qualifying booking or call | Not allowed; Review button hidden |
| Account deletion with bookings | Blocked if a booking is today; otherwise future bookings cancelled with notice |

**Accessibility (WCAG 2.2 AA)** — contrast as in the token table (no teal or amber text on white); touch targets at least 44 × 44; Dynamic Type and browser zoom to 200% without loss; every icon button has a label ("Call Swift Plumbing"); status never shown by colour alone (pill text plus icon); focus order follows reading order and focus is visible (2 px blue ring); OTP fields announce as one group; map content mirrored in the list view; reduced motion turns off the booked tick animation; captions and transcripts for every desk recording.

**Analytics events** (each carries userId or anonymous id, listingId, layer, surface, timestamp):

| Event | Fired when |
| --- | --- |
| search\_performed | Query or category submitted (query, location, result count by layer) |
| result\_viewed / listing\_viewed | Result card enters view / listing opens |
| call\_tapped / call\_connected | Call sheet confirmed / tracked call bridged (duration, outcome) |
| message\_started / message\_sent | First message in a thread / every message (author) |
| booking\_started / booking\_submitted / booking\_confirmed / booking\_cancelled | Each step of C-24 to C-32 and B-22 |
| review\_submitted / recommend\_shared / invite\_shared | C-34 / C-35 / C-36 |
| ask\_answerd\_started / ask\_answerd\_match\_shown / ask\_answerd\_action | Q-01 / Q-03 / Q-04 |
| claim\_started / claim\_verified / claim\_rejected | B-01 / B-08 / A-06 |
| setup\_step\_completed | Each B-09 step |
| desk\_trial\_started / desk\_live / desk\_paused | B-30 / B-31 / B-32 |
| desk\_call\_handled / desk\_message\_handled / desk\_booking\_made / desk\_handoff | D-01 to D-08 |
| gate\_reached / upgrade\_viewed / subscription\_started / subscription\_cancelled | Monetise gate and billing |
| places\_call | Every Google Places request (SKU, cache hit) |

## Prototype build prompts

Eleven prompts build the whole prototype in order, in one Claude Code session, and they live in the Build prompts tab. Run them like this:

1. Create an empty repo (for example `answerd-prototype` in the vitalos-technologies GitHub org) and open Claude Code in it.
2. Export this spec tab as Markdown and save it as `docs/answerd-spec.md`; the prompts build every screen by its ID from that file. Put the logo SVGs from the brand board in `public/brand/` if you have them.
3. Paste P0. When it finishes, open `/hub`, check the components page and the persona switcher, commit.
4. Paste P1 to P9 one at a time. After each, click through the new IDs in the hub before moving on.
5. Paste P10 last: it walks the eight end-to-end journeys, adds Playwright tests, screenshots every screen and writes `COVERAGE.md` listing all 155 IDs.
6. Deploy to Vercel from the repo to get one shareable review link.

Assumption to flag: the prototype is a Next.js web app with the mobile screens inside a phone frame, not an Expo app. That gives one URL where all four surfaces talk to the same mock data, which is what makes the cross-surface flows (a customer books, the owner accepts, the desk answers) clickable. The MVP then rebuilds the screens in Expo and Next.js from the same spec, copy and tokens.
