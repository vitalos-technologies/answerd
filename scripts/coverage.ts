// Writes COVERAGE.md from lib/screens.ts: every ID in docs/answerd-spec.md with its route or trigger, status and any
// deviation from the spec. Run with `pnpm coverage`.
import { writeFileSync } from "node:fs"
import { BUILT, ON_SITE, SCREENS, SURFACES } from "../lib/screens"

const TRIGGERS: Record<string, string> = {
  "D-01": "Hub › Simulate › D-01 (also B-33 test call, B-31 step 5, W-17 test call)",
  "D-02": "Hub › Simulate › D-02",
  "D-03": "Hub › Simulate › D-03; also any in-app message to a desk-live business (C-22, C-23)",
  "D-04": "Hub › Simulate › D-04",
  "D-05": "Hub › Simulate › D-05; also automatic at +2 and +7 days after a quote (B-26)",
  "D-06": "Hub › Simulate › D-06; also automatic when a job is marked Completed (B-24)",
  "D-07": "Hub › Simulate › D-07; also automatic each morning on the demo clock",
  "D-08": "Hub › Simulate › D-08",
  "D-09": "Hub › Simulate › D-09 gas, danger to life, power cut",
  "D-10": "Hub › Simulate › D-10",
  "Q-01": "/app/ask (C-38); the web chat panel (W-25) is on the website",
  "Q-02": "/app/ask: free-text understanding",
  "Q-03": "/app/ask: up to 3 matches with reasons",
  "Q-04": "/app/ask: Call, Message, Book from a match",
  "Q-05": "/app/ask: gas, danger to life, power cut safety cards",
  "Q-06": "/app/ask: 5 questions as a guest, then sign in",
}

const NOTES: Record<string, string> = {
  "B-13": "The data model has one opening range per day, so the overlap check covers a closing time at or before the opening time and overlapping holidays. Split shifts are not supported.",
  "B-16": "As well as A-07 approval, credentials uploaded during the demo are auto-verified on the hub's +1 day so the badge can be shown without the admin console.",
  "B-28": "Conversion is calls and messages that led to a booking. Bookings come from Booking records; calls and messages from Enquiry records.",
  "B-29": "The printable card opens at /print/review-card (A6 print styling).",
  "B-36": "Upgrade and Get Featured open the web checkout at /dashboard/billing/checkout (W-18). The gated button names the missing half of the gate: \"Available after 10 enquiries\" (also when both halves are missing), \"Available from Fri 30 Oct\" when only the date is missing, and \"Keep your desk for £49/month\" once open (same on B-37 and W-18). Numbers and prices come from S-06.",
  "D-04": "Follows the business's B-17 booking mode: Request to book creates a request that expires in 2 hours.",
  "W-11": "On the website. Businesses that start there finish setup in the app.",
  "A-06": "List with a detail pane, so the evidence sits beside the actions.",
  "A-07": "List with a detail pane; the Expiring in 30 days view uses the data table.",
  "A-12": "List with a detail pane showing the transcript.",
  "A-14": "A cell click filters A-03 (per the build prompt) rather than seeding the area.",
  "A-21": "Invited admin users appear in the list, but only the hub personas Temitope, Ife and Dan can sign in through A-01. Only a super admin can change a super admin.",
  "S-01": "Live figures are counted from store records. App installs, unit costs (S-03) and the price test (S-02) aren't in the demo data, so they are modelled or simulated from the seed and labelled as such.",
  "S-05": "The permissions matrix edits what Admin and Support may do (useCan reads it); super-admin-only areas are fixed.",
  "S-06": "Rules are versioned in Settings.ruleVersions with a reason and an effective date. The version in force on the demo clock drives the monetise gate, request expiry, trial length, plan prices (B-36, B-37, W-18 and checkout; W-10 is on the website), Featured slots and review rules.",
  "S-07": "Switches are checked in one place (platformFor in lib/selectors.ts). Gap-fill is the A-23 flag; the desk kill switch stays in A-23.",
  "S-09": "Business views reuse the support view (read-only banner); customer views open the app as the customer with every control disabled. Both end on the demo clock or on returning to the console, and are audited.",
  "S-10": "Admin console sign-ins are recorded in the store (A-01 and the hub persona switch); the rest comes from the audit log.",
  "A-23": "The desk kill switch accepts any 6-digit code except 000000, like every other code in the prototype.",
}

const GLOBAL = [
  "Demo calendar: the spec's example dates (Mon 27 Oct, Thu 30 Oct 2026) fall on the wrong weekdays, so the demo uses the real 2026 calendar. The clock starts on Mon 26 Oct 2026 at 9am London time, and \"Thu\" in the journeys is Thu 29 Oct.",
  "Codes: 000000 is always the wrong code; any other 6 digits are accepted.",
  "No real calls, texts, payments or audio: calls, SMS, Stripe and voice are simulated in the shared store.",
  "One website, app first (design review, 25 Oct 2026): the public web pages live on the website (marketing-site/), not in the prototype. Their old prototype URLs redirect there and \"/\" opens the hub. The website is a separate app, so it doesn't share the prototype's demo state (S-06 prices, S-07 switches).",
]

const surfaceName = Object.fromEntries(SURFACES.map((s) => [s.id, s.name]))
const rows = SCREENS.map((s) => {
  const where = ON_SITE[s.id] ? `Website: \`${ON_SITE[s.id]}\`` : (TRIGGERS[s.id] ?? `\`${s.route}\``)
  const status = BUILT.has(s.id) ? "Built" : "Missing"
  return `| ${s.id} | ${s.title} | ${where} | ${status} | ${NOTES[s.id] ?? ""} |`
})
const built = SCREENS.filter((s) => BUILT.has(s.id)).length

const md = `# Coverage

Every ID in \`docs/answerd-spec.md\`, generated from \`lib/screens.ts\` by \`pnpm coverage\`.

**${built} of ${SCREENS.length} built.** ${SURFACES.map((s) => `${s.name}: ${SCREENS.filter((x) => x.surface === s.id && BUILT.has(x.id)).length}/${s.count}`).join(" · ")}

## Prototype-wide decisions

${GLOBAL.map((g) => `- ${g}`).join("\n")}

${SURFACES.map(
  (sf) => `## ${surfaceName[sf.id]}

| ID | Screen | Route or trigger | Status | Deviation from the spec |
| --- | --- | --- | --- | --- |
${rows.filter((_, i) => SCREENS[i]!.surface === sf.id).join("\n")}
`,
).join("\n")}`

writeFileSync(new URL("../COVERAGE.md", import.meta.url), md)
console.log(`COVERAGE.md: ${built}/${SCREENS.length} built`)
