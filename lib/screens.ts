// Screen registry: every ID in docs/answerd-spec.md with its route and an example URL for the hub.

export type Surface = "customer" | "business" | "web" | "admin" | "desk" | "ask"

export interface ScreenDef {
  id: string
  title: string
  surface: Surface
  route: string
  example: string
}

const EX: Record<string, string> = {
  "[slug]": "swift-plumbing-heating",
  "[threadId]": "t-tayo-swift",
  "[id]": "bk-tayo-upcoming",
  "[listingId]": "l-norwood-locksmiths",
  "[serviceId]": "s-swift-plumbing-heating-boiler-service",
  "[callId]": "call-priya",
  "[bookingId]": "bk-ola",
  "[category]": "plumbers",
  "[area]": "croydon",
  "[doc]": "terms",
  "[token]": "bk-tayo-swift-past",
}

const EX_OVERRIDE: Record<string, string> = {
  "C-17": "/app/b/norwood-locksmiths",
  "W-07": "/b/norwood-locksmiths",
  "W-05": "/areas/croydon",
  "B-24": "/app/biz/jobs/bk-mark",
  "C-28": "/app/bookings/bk-tayo-upcoming/booked",
  "C-34": "/app/bookings/bk-tayo-swift-past/review",
  "C-35": "/app/bookings/bk-tayo-swift-past/review/done",
  "A-04": "/admin/listings/l-swift-plumbing-heating",
  "A-05": "/admin/listings/l-swift-plumbing-heating/merge",
  "B-20": "/app/biz/inbox/t-leon-swift",
  "B-26": "/app/biz/inbox/t-tayo-swift/quote",
  "W-24": "/this-page-does-not-exist",
  "W-23": "/?cookies=reset",
  "W-25": "/?chat=open",
}

const RAW: [Surface, string][] = [
  ["customer", `C-01 Splash /app/splash
C-02 Welcome /app/welcome
C-03 Location /app/onboarding/location
C-04 Notifications permission /app/onboarding/notifications
C-05 Sign-in sheet /app/sign-in
C-06 Phone number /app/sign-in/phone
C-07 SMS code /app/sign-in/code
C-08 About you /app/sign-in/about-you
C-09 Home /app
C-10 All categories /app/categories
C-11 Search /app/search
C-12 Results list /app/results
C-13 Results map /app/results/map
C-14 Filters sheet /app/results/filters
C-15 Location picker /app/location
C-16 Listing (claimed) /app/b/[slug]
C-17 Listing (unclaimed) /app/b/[slug]
C-18 Photo gallery /app/b/[slug]/photos
C-19 Reviews /app/b/[slug]/reviews
C-20 Call sheet /app/b/[slug]/call
C-21 After the call /app/b/[slug]/after-call
C-22 Message thread /app/messages/[threadId]
C-23 New enquiry /app/b/[slug]/enquiry
C-24 Book: service /app/b/[slug]/book
C-25 Book: time /app/b/[slug]/book/time
C-26 Book: details /app/b/[slug]/book/details
C-27 Book: confirm /app/b/[slug]/book/confirm
C-28 Booked /app/bookings/[id]/booked
C-29 Bookings /app/bookings
C-30 Booking detail /app/bookings/[id]
C-31 Reschedule /app/bookings/[id]/reschedule
C-32 Cancel /app/bookings/[id]/cancel
C-33 Messages /app/messages
C-34 Write a review /app/bookings/[id]/review
C-35 Review posted /app/bookings/[id]/review/done
C-36 Invite friends /app/account/invite
C-37 Saved /app/saved
C-38 Ask Answerd /app/ask
C-39 Account /app/account
C-40 Edit profile /app/account/profile
C-41 Saved places /app/account/places
C-42 Notification settings /app/account/notifications
C-43 Privacy and data /app/account/privacy
C-44 Help /app/help
C-45 Report /app/report
C-46 Notifications /app/notifications
C-47 Delete account /app/account/delete
C-48 Offline and errors /app/states`],
  ["business", `B-01 Find your business /app/biz/claim
B-02 Is this you? /app/biz/claim/[listingId]
B-03 Add your business /app/biz/claim/new
B-04 Verify ownership /app/biz/claim/[listingId]/verify
B-05 Enter code /app/biz/claim/[listingId]/verify/code
B-06 Director check /app/biz/claim/[listingId]/verify/director
B-07 Upload a document /app/biz/claim/[listingId]/verify/document
B-08 You're in /app/biz/claim/[listingId]/done
B-09 Setup checklist /app/biz/setup
B-10 Business details /app/biz/profile/details
B-11 Services and prices /app/biz/profile/services
B-12 Edit service /app/biz/profile/services/[serviceId]
B-13 Hours and availability /app/biz/profile/hours
B-14 Service area /app/biz/profile/area
B-15 Photos /app/biz/profile/photos
B-16 Credentials /app/biz/profile/credentials
B-17 Booking settings /app/biz/profile/booking
B-18 Today /app/biz
B-19 Inbox /app/biz/inbox
B-20 Conversation /app/biz/inbox/[threadId]
B-21 Call detail /app/biz/calls/[callId]
B-22 Booking request /app/biz/requests/[bookingId]
B-23 Diary /app/biz/diary
B-24 Job /app/biz/jobs/[bookingId]
B-25 Add to diary /app/biz/diary/new
B-26 Send quote /app/biz/inbox/[threadId]/quote
B-27 Reviews /app/biz/reviews
B-28 Stats /app/biz/stats
B-29 Share your profile /app/biz/share
B-30 AI desk intro /app/biz/desk/intro
B-31 Desk setup /app/biz/desk/setup
B-32 Desk /app/biz/desk
B-33 Test call /app/biz/desk/test-call
B-34 What the desk knows /app/biz/desk/knowledge
B-35 Handoff rules /app/biz/desk/handoff
B-36 Plan and billing /app/biz/billing
B-37 Featured /app/biz/featured
B-38 Team /app/biz/team
B-39 Business notifications /app/biz/notifications
B-40 Business settings /app/biz/settings
B-41 More /app/biz/more`],
  ["web", `W-01 Home /
W-02 Search results /search
W-03 Category hub /[category]
W-04 Category in area /[category]/[area]
W-05 Area hub /areas/[area]
W-06 Listing (claimed) /b/[slug]
W-07 Listing (unclaimed) /b/[slug]
W-08 How it works /how-it-works
W-09 For businesses /for-businesses
W-10 Pricing /pricing
W-11 Claim or add /claim
W-12 Sign in /sign-in
W-13 Dashboard: Overview /dashboard
W-14 Dashboard: Inbox /dashboard/inbox
W-15 Dashboard: Diary /dashboard/diary
W-16 Dashboard: Profile /dashboard/profile
W-17 Dashboard: AI desk /dashboard/desk
W-18 Dashboard: Billing /dashboard/billing
W-19 Dashboard: Team and settings /dashboard/team
W-20 Help centre /help
W-21 About /about
W-22 Legal /legal/[doc]
W-23 Cookie banner /
W-24 Not found and errors /404
W-25 Chat with Answerd /
W-26 Get the app /get-the-app
W-27 Review from link /review/[token]`],
  ["admin", `A-01 Sign in /admin/sign-in
A-02 Overview /admin
A-03 Listings /admin/listings
A-04 Listing detail /admin/listings/[id]
A-05 Merge /admin/listings/[id]/merge
A-06 Claims queue /admin/claims
A-07 Credentials queue /admin/credentials
A-08 Reviews /admin/reviews
A-09 Reports /admin/reports
A-10 Customers /admin/customers
A-11 Businesses /admin/businesses
A-12 Desk QA /admin/desk-qa
A-13 Imports /admin/imports
A-14 Coverage /admin/coverage
A-15 Taxonomy /admin/taxonomy
A-16 Places spend /admin/places
A-17 Billing /admin/billing
A-18 Monetise gate /admin/gate
A-19 Featured slots /admin/featured
A-20 Content /admin/content
A-21 Admin users /admin/users
A-22 Audit log /admin/audit
A-23 Settings /admin/settings`],
  ["desk", `D-01 Missed call answered /hub#simulate
D-02 Text message /hub#simulate
D-03 In-app message /hub#simulate
D-04 Customer agrees a time /hub#simulate
D-05 Quote follow-up /hub#simulate
D-06 Review request /hub#simulate
D-07 Daily digest /hub#simulate
D-08 Handoff to owner /hub#simulate
D-09 Emergency /hub#simulate
D-10 Spam and sales calls /hub#simulate`],
  ["ask", `Q-01 Open /app/ask
Q-02 Understand /app/ask
Q-03 Match /app/ask
Q-04 Act /app/ask
Q-05 Safety /app/ask
Q-06 Limits /app/ask`],
]

export const SCREENS: ScreenDef[] = RAW.flatMap(([surface, block]) =>
  block.split("\n").map((line) => {
    const m = line.trim().match(/^([A-Z]-\d{2}) (.+) (\/\S*)$/)!
    const [, id, title, route] = m
    const example = EX_OVERRIDE[id!] ?? route!.replace(/\[[a-zA-Z]+\]/g, (k) => EX[k] ?? k)
    return { id: id!, title: title!, surface, route: route!, example }
  }),
)

export const SURFACES: { id: Surface; name: string; count: number }[] = [
  { id: "customer", name: "Customer app", count: 48 },
  { id: "business", name: "Business mode", count: 41 },
  { id: "web", name: "Web", count: 27 },
  { id: "admin", name: "Admin console", count: 23 },
  { id: "desk", name: "AI desk behaviours", count: 10 },
  { id: "ask", name: "Ask Answerd", count: 6 },
]

/** IDs built so far. Each build prompt adds its IDs here. */
export const BUILT = new Set<string>([
  // P1
  ...["C-01", "C-02", "C-03", "C-04", "C-05", "C-06", "C-07", "C-08", "C-09", "C-10", "C-11", "C-12", "C-13", "C-14", "C-15", "C-48"],
  // P2
  ...["C-16", "C-17", "C-18", "C-19", "C-20", "C-21", "C-22", "C-23", "C-24", "C-25", "C-26", "C-27", "C-28", "C-33"],
  // P3
  ...["C-29", "C-30", "C-31", "C-32", "C-34", "C-35", "C-36", "C-37", "C-38", "C-39", "C-40", "C-41", "C-42", "C-43", "C-44", "C-45", "C-46", "C-47"],
  ...["Q-01", "Q-02", "Q-03", "Q-04", "Q-05", "Q-06"],
  // P4
  ...Array.from({ length: 17 }, (_, i) => `B-${String(i + 1).padStart(2, "0")}`),
  // P5
  ...Array.from({ length: 12 }, (_, i) => `B-${i + 18}`),
  // P6
  ...Array.from({ length: 12 }, (_, i) => `B-${i + 30}`),
  ...Array.from({ length: 10 }, (_, i) => `D-${String(i + 1).padStart(2, "0")}`),
  // P7
  ...Array.from({ length: 12 }, (_, i) => `W-${String(i + 1).padStart(2, "0")}`),
  ...Array.from({ length: 8 }, (_, i) => `W-${i + 20}`),
  // P8
  ...Array.from({ length: 7 }, (_, i) => `W-${i + 13}`),
  // P9
  ...Array.from({ length: 23 }, (_, i) => `A-${String(i + 1).padStart(2, "0")}`),
])

export function screenById(id: string) {
  return SCREENS.find((s) => s.id === id)
}

/** Find the screen for a pathname (dynamic segments match anything). */
export function screenForPath(pathname: string, hint?: string) {
  if (hint) return screenById(hint)
  const parts = pathname.split("?")[0]!.split("/").filter(Boolean)
  const matches = SCREENS.filter((s) => {
    if (s.surface === "desk" || s.surface === "ask") return false
    const rp = s.route.split("/").filter(Boolean)
    if (rp.length !== parts.length) return false
    return rp.every((seg, i) => seg.startsWith("[") || seg === parts[i])
  })
  // Prefer the most specific (fewest dynamic segments)
  return matches.sort((a, b) => (a.route.match(/\[/g)?.length ?? 0) - (b.route.match(/\[/g)?.length ?? 0))[0]
}
