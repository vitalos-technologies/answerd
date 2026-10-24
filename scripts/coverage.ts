// Writes COVERAGE.md from lib/screens.ts: every ID in docs/answerd-spec.md with its route or trigger, status and any
// deviation from the spec. Run with `pnpm coverage`.
import { writeFileSync } from "node:fs"
import { BUILT, SCREENS, SURFACES } from "../lib/screens"

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
  "Q-01": "/app/ask (C-38) and the web chat panel (W-25)",
  "Q-02": "/app/ask: free-text understanding",
  "Q-03": "/app/ask: up to 3 matches with reasons",
  "Q-04": "/app/ask: Call, Message, Book from a match",
  "Q-05": "/app/ask: gas, danger to life, power cut safety cards",
  "Q-06": "/app/ask: 5 questions as a guest, then sign in",
  "W-23": "Every public page on first visit (/?cookies=reset to show it again)",
  "W-25": "Every public page (/?chat=open)",
}

const NOTES: Record<string, string> = {
  "B-13": "The data model has one opening range per day, so the overlap check covers a closing time at or before the opening time and overlapping holidays. Split shifts are not supported.",
  "B-16": "As well as A-07 approval, credentials uploaded during the demo are auto-verified on the hub's +1 day so the badge can be shown without the admin console.",
  "B-28": "Conversion is calls and messages that led to a booking. Bookings come from Booking records; calls and messages from Enquiry records.",
  "B-29": "The printable card opens at /print/review-card (A6 print styling).",
  "B-36": "Upgrade and Get Featured open the web checkout at /dashboard/billing/checkout (W-18).",
  "D-04": "Follows the business's B-17 booking mode: Request to book creates a request that expires in 2 hours.",
  "W-11": "Guests sign in through W-12 first (with next=), which handles the new-account name step.",
  "W-27": "A review token is the ID of a completed booking and is valid for 30 days after the job.",
  "A-06": "List with a detail pane, so the evidence sits beside the actions.",
  "A-07": "List with a detail pane; the Expiring in 30 days view uses the data table.",
  "A-12": "List with a detail pane showing the transcript.",
  "A-14": "A cell click filters A-03 (per the build prompt) rather than seeding the area.",
  "A-21": "Invited admin users appear in the list, but only the hub personas Ife and Dan can sign in through A-01.",
  "A-23": "The desk kill switch accepts any 6-digit code except 000000, like every other code in the prototype.",
}

const GLOBAL = [
  "Demo calendar: the spec's example dates (Mon 27 Oct, Thu 30 Oct 2026) fall on the wrong weekdays, so the demo uses the real 2026 calendar. The clock starts on Mon 26 Oct 2026 at 9am London time, and \"Thu\" in the journeys is Thu 29 Oct.",
  "Codes: 000000 is always the wrong code; any other 6 digits are accepted.",
  "No real calls, texts, payments or audio: calls, SMS, Stripe and voice are simulated in the shared store.",
]

const surfaceName = Object.fromEntries(SURFACES.map((s) => [s.id, s.name]))
const rows = SCREENS.map((s) => {
  const where = TRIGGERS[s.id] ?? `\`${s.route}\``
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
