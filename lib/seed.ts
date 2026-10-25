// Deterministic demo data. Demo clock starts Mon 26 Oct 2026 09:00 Europe/London.
import { CATEGORIES } from "./categories"
import { DISTRICTS } from "./geo"
import { Rng } from "./prng"
import { DEMO_START, LAUNCH_DATE, addDays, addMinutes, london } from "./time"
import { initials, slugify } from "./format"
import { DEFAULT_PLATFORM, DEFAULT_RULES } from "./selectors"
import type {
  Availability,
  Booking,
  BookingEvent,
  Business,
  BusinessMember,
  Call,
  Claim,
  Credential,
  CustomerProfile,
  DeskConfig,
  Enquiry,
  FeaturedSlot,
  ImportJob,
  Invoice,
  Listing,
  Message,
  Notification,
  PlacesDay,
  Quote,
  Referral,
  Report,
  Review,
  Service,
  ServiceArea,
  Session,
  Settings,
  Subscription,
  Thread,
  User,
  AuditEvent,
  BlockTime,
  PriceType,
  Photo,
  DeskRun,
  DataRequest,
  Integration,
  SignInEvent,
  BookingDraft,
  SupportTicket,
  Category,
} from "./types"

export interface DemoData {
  version: number
  clock: string
  users: User[]
  customerProfiles: CustomerProfile[]
  categories: Category[]
  listings: Listing[]
  businesses: Business[]
  members: BusinessMember[]
  services: Service[]
  availability: Availability[]
  serviceAreas: ServiceArea[]
  credentials: Credential[]
  claims: Claim[]
  threads: Thread[]
  messages: Message[]
  calls: Call[]
  enquiries: Enquiry[]
  bookings: Booking[]
  blocks: BlockTime[]
  bookingEvents: BookingEvent[]
  quotes: Quote[]
  reviews: Review[]
  referrals: Referral[]
  deskConfigs: DeskConfig[]
  subscriptions: Subscription[]
  invoices: Invoice[]
  featuredSlots: FeaturedSlot[]
  notifications: Notification[]
  reports: Report[]
  audit: AuditEvent[]
  tickets: SupportTicket[]
  imports: ImportJob[]
  placesDays: PlacesDay[]
  contested: { listingId: string; startAt: string }[]
  settings: Settings
  session: Session
  draft: BookingDraft | null
  deskRuns: DeskRun[]
  // R2 super admin
  signIns: SignInEvent[]
  dataRequests: DataRequest[]
}

export const SEED_VERSION = 3

const L = london
const NOW = DEMO_START

// ---------------------------------------------------------------- people

const FIRST = ["Priya", "Mark", "Ola", "Leon", "Ben", "Chris", "Grace", "Daniel", "Aisha", "Tom", "Femi", "Hannah", "Kofi", "Sophie", "Raj", "Emma", "Jamal", "Lucy", "Nadia", "George", "Zara", "Sean", "Funmi", "Olivia", "Marcus", "Chloe", "Imran", "Rachel", "Dev", "Megan", "Tunde", "Ellie", "Kwesi", "Holly", "Amir", "Jess", "Bola", "Katie", "Yusuf", "Lauren"]
const LAST = ["Shah", "Thompson", "Bakare", "Hughes", "Clarke", "Patel", "Osei", "Morris", "Khan", "Walker", "Adebayo", "Green", "Mensah", "Turner", "Kaur", "Wright", "Ali", "Evans", "Begum", "Hall", "Ahmed", "Murphy", "Okoro", "Price", "Bennett", "Lewis", "Hussain", "Cooper", "Mistry", "Wood"]

function mobile(n: number) {
  return `07700 900${String(n).padStart(3, "0")}`
}
function landline(n: number) {
  return `020 7946 0${String(n).padStart(3, "0")}`
}

function buildUsers(rng: Rng): User[] {
  const created = "2026-09-04T10:00:00.000Z"
  const users: User[] = [
    { id: "u-tayo", phone: mobile(123), email: "tayo@example.com", firstName: "Tayo", lastName: "Adeyemi", authProviders: ["phone"], marketingConsent: false, createdAt: "2026-09-02T18:20:00.000Z" },
    { id: "u-sam", phone: mobile(456), email: "sam@swiftplumbing.example", firstName: "Sam", lastName: "Okafor", authProviders: ["phone", "google"], marketingConsent: false, createdAt: "2026-08-31T08:10:00.000Z" },
    { id: "u-jo", phone: mobile(457), firstName: "Jo", lastName: "Reid", authProviders: ["phone"], marketingConsent: false, createdAt: "2026-09-11T09:00:00.000Z" },
    { id: "u-ife", phone: mobile(901), email: "ife@vitalos.co.uk", firstName: "Ife", lastName: "Bello", authProviders: ["google"], marketingConsent: false, createdAt: "2026-07-31T09:00:00.000Z", staffRole: "admin", twoFactor: ["authenticator"] },
    { id: "u-dan", phone: mobile(902), email: "dan@vitalos.co.uk", firstName: "Dan", lastName: "Price", authProviders: ["google"], marketingConsent: false, createdAt: "2026-07-31T09:00:00.000Z", staffRole: "support", twoFactor: ["authenticator"] },
    { id: "u-temitope", phone: mobile(900), email: "temitope@vitalos.co.uk", firstName: "Temitope", lastName: "Agbola", authProviders: ["google"], marketingConsent: false, createdAt: "2026-07-01T09:00:00.000Z", staffRole: "super_admin", twoFactor: ["security_key", "authenticator"] },
  ]
  // Customers who book and review
  for (let i = 0; i < 40; i++) {
    users.push({
      id: `u-c${i}`,
      phone: mobile(200 + i),
      firstName: FIRST[i]!,
      lastName: LAST[i % LAST.length]!,
      authProviders: [rng.pick(["phone", "phone", "apple", "google"] as const)],
      marketingConsent: rng.chance(0.2),
      createdAt: created,
    })
  }
  // Business owners (other than Sam)
  const owners = ["Bisi Martins", "Kwame Asante", "Dele Johnson", "Fola Adewale", "Ryan Brightwell", "Nikesh Shah", "Chris Doyle", "Maria Silva", "Paul Okafor", "Lena Novak", "Kim Tran", "Steve Woods", "Gary Pearce", "Tariq Mahmood", "Helen Moss", "Ade Ogun", "Joel Kirby"]
  owners.forEach((n, i) => {
    const [f, l] = n.split(" ")
    users.push({ id: `u-o${i}`, phone: mobile(500 + i), firstName: f!, lastName: l!, authProviders: ["phone"], marketingConsent: false, createdAt: "2026-09-01T10:00:00.000Z" })
  })
  return users
}

// ---------------------------------------------------------------- listings

export type SvcT = [name: string, dur: number, type: PriceType, from: number, to: number | undefined, bookable: boolean, desc: string]

export const SERVICE_TEMPLATES: Record<string, SvcT[]> = {
  plumbers: [
    ["Leaking tap repair", 60, "from", 6000, 9000, true, "Fix a dripping or leaking tap, including washers and cartridges."],
    ["Blocked sink or toilet", 60, "from", 7000, 11000, true, "Clear blockages with rods or a plunger pump."],
    ["Bathroom installation", 0, "quote", 0, undefined, false, "Full bathroom fit. We'll visit and quote."],
  ],
  "heating-engineers": [
    ["Boiler service", 60, "fixed", 8500, undefined, true, "Annual service with a Gas Safe engineer and a service record."],
    ["Boiler repair", 90, "from", 9500, 18000, true, "Diagnose and repair. Parts quoted before we fit them."],
    ["Gas safety certificate (CP12)", 60, "fixed", 7000, undefined, true, "Landlord gas safety record for one appliance."],
  ],
  electricians: [
    ["EICR (electrical safety report)", 120, "fixed", 18000, undefined, true, "Full periodic inspection for homes up to 3 bedrooms."],
    ["Socket install", 60, "from", 7500, 12000, true, "Add a new double socket or replace a damaged one."],
    ["Fault finding", 60, "hourly", 6500, undefined, true, "Tripping circuits, dead sockets, flickering lights."],
    ["Fuse box replacement", 240, "from", 45000, 65000, false, "New consumer unit with RCD protection and certificate."],
  ],
  locksmiths: [
    ["Emergency lockout", 45, "from", 8000, 12000, true, "Non-destructive entry where possible, 24 hours."],
    ["Lock change", 60, "from", 9000, 14000, true, "Supply and fit British Standard locks."],
  ],
  cleaners: [
    ["Regular clean", 120, "hourly", 2200, undefined, true, "Weekly or fortnightly clean. Bring our own products."],
    ["Deep clean", 240, "from", 15000, 25000, true, "Top-to-bottom clean including kitchen and bathrooms."],
  ],
  "end-of-tenancy-cleaners": [
    ["End of tenancy clean (1 to 2 bed)", 300, "from", 18000, 24000, true, "Deposit-back standard, checklist included."],
    ["End of tenancy clean (3 to 4 bed)", 420, "from", 28000, 36000, true, "Deposit-back standard, checklist included."],
  ],
  "oven-cleaners": [["Oven clean", 120, "fixed", 6500, undefined, true, "Single oven, racks and hob."]],
  "carpet-cleaners": [
    ["Carpet clean (per room)", 60, "fixed", 4500, undefined, true, "Hot water extraction, dry in 3 to 4 hours."],
    ["Sofa clean", 90, "from", 6000, 9000, true, "Fabric sofas, two or three seater."],
  ],
  "window-cleaners": [["Window clean (house)", 60, "from", 2000, 4000, true, "Outside windows, frames and sills."]],
  gardeners: [
    ["Garden tidy", 180, "hourly", 3000, undefined, true, "Weeding, pruning, mowing and green waste away."],
    ["Lawn mowing", 60, "from", 3000, 5000, true, "Mow and edge, clippings removed."],
    ["Hedge trimming", 120, "from", 6000, 15000, true, "Shape and trim, waste removed."],
  ],
  "mobile-mechanics": [
    ["Diagnostic visit", 60, "fixed", 5500, undefined, true, "We come to you with a diagnostic reader."],
    ["Battery replacement", 45, "from", 9500, 16000, true, "Supply and fit, old battery recycled."],
    ["Brake pads (front)", 90, "from", 12000, 18000, true, "Pads fitted at your home or work."],
    ["Full service", 180, "from", 16000, 24000, true, "Oil, filters, checks and stamp."],
  ],
  "mot-garages": [["MOT test", 60, "fixed", 5485, undefined, true, "Class 4 MOT at the maximum DVSA fee."]],
  "car-valeting": [["Full valet", 180, "from", 7000, 12000, true, "Inside and out at your door."]],
  couriers: [
    ["Same-day parcel (London)", 120, "from", 1800, 4500, true, "Collected within 60 minutes, delivered same day."],
    ["Business delivery contract", 0, "quote", 0, undefined, false, "Regular runs for shops and offices."],
  ],
  "man-and-van": [["Man and van", 120, "hourly", 4500, undefined, true, "Two-hour minimum. Loading included."]],
  removals: [["House move", 0, "quote", 0, undefined, false, "Survey and fixed quote."]],
  barbers: [
    ["Skin fade", 30, "fixed", 2200, undefined, true, "Clipper fade, finished with a line-up."],
    ["Haircut", 30, "fixed", 1800, undefined, true, "Scissor or clipper cut."],
    ["Beard trim", 30, "fixed", 1200, undefined, true, "Shape, line-up and hot towel."],
    ["Kids cut (under 12)", 30, "fixed", 1400, undefined, true, "Any style."],
  ],
  hairdressers: [["Cut and blow-dry", 60, "from", 4000, 6000, true, "Wash, cut and finish."]],
  "nail-technicians": [
    ["Gel manicure", 45, "fixed", 2800, undefined, true, "Shape, cuticle care and gel colour."],
    ["Acrylic full set", 75, "from", 3500, 4500, true, "Choice of shape and length."],
  ],
  "beauty-therapists": [["Facial", 60, "fixed", 4500, undefined, true, "Cleanse, exfoliate and mask."]],
  "personal-trainers": [["PT session", 60, "fixed", 4000, undefined, true, "One-to-one, at the park or your home."]],
  "painters-decorators": [
    ["Paint a room", 480, "from", 25000, 40000, true, "Walls and ceiling, two coats, materials extra."],
    ["Full redecoration", 0, "quote", 0, undefined, false, "We'll visit and quote."],
  ],
  handymen: [
    ["Handyman hour", 60, "hourly", 4000, undefined, true, "Shelves, curtain poles, flat pack and small fixes."],
    ["Flat pack assembly", 120, "from", 5000, 9000, true, "Wardrobes, beds and desks."],
  ],
  builders: [["Extension or renovation", 0, "quote", 0, undefined, false, "Survey and itemised quote."]],
  roofers: [["Roof repair", 120, "from", 15000, 40000, true, "Slipped tiles, leaks and flashing."]],
  carpenters: [["Door hanging", 120, "from", 9000, 14000, true, "Internal doors hung and adjusted."]],
  plasterers: [["Skim a room", 480, "from", 30000, 50000, true, "Skim walls and ceiling."]],
  "pest-control": [["Mice treatment", 60, "fixed", 12000, undefined, true, "Two visits included."]],
  "appliance-repair": [["Washing machine repair", 60, "from", 7000, 12000, true, "Call-out and diagnosis, parts extra."]],
  "computer-repair": [["Laptop repair", 60, "from", 5000, 15000, true, "Screens, batteries and slow laptops."]],
  "dog-walkers": [["Group walk (1 hour)", 60, "fixed", 1500, undefined, true, "Up to four dogs."]],
  tutors: [["Maths tutoring (1 hour)", 60, "fixed", 4000, undefined, true, "GCSE and A level."]],
}

interface ListingSpec {
  slug?: string
  name: string
  cats: string[]
  layer: "claimed" | "seeded" | "places"
  district: string
  street: string
  phone?: string
  desk?: "live" | "paused" | "off"
  booking?: "instant" | "request"
  creds?: { type: Credential["type"]; status: Credential["status"]; number?: string; expires?: string }[]
  owner?: string
  reviews?: number
  replyMins?: number
  description?: string
  google?: [number, number]
}

const CLAIMED: ListingSpec[] = [
  { slug: "swift-plumbing-heating", name: "Swift Plumbing & Heating", cats: ["plumbers", "heating-engineers"], layer: "claimed", district: "SE25", street: "Portland Road", phone: mobile(321), desk: "live", booking: "request", owner: "u-sam", reviews: 132, replyMins: 1, creds: [{ type: "gas_safe", status: "verified", number: "567890" }, { type: "insurance", status: "verified", expires: "2026-11-11T00:00:00.000Z" }, { type: "insurance", status: "pending" }], description: "Family-run plumbing and heating in South Norwood since 2014. Gas Safe registered, fully insured, and we turn up when we say we will. Boilers, leaks, radiators and bathrooms across SE25, SE19 and Croydon." },
  { name: "Sparkle Clean Co", cats: ["cleaners", "end-of-tenancy-cleaners", "oven-cleaners"], layer: "claimed", district: "SE19", street: "Church Road", phone: mobile(322), desk: "live", booking: "instant", owner: "u-o0", reviews: 30, replyMins: 1, creds: [{ type: "insurance", status: "verified", expires: "2027-03-31T00:00:00.000Z" }, { type: "dbs", status: "pending" }], description: "Friendly, vetted cleaners for homes and end of tenancy. We bring everything and send the same cleaner every week." },
  { name: "Kwame's Mobile Mechanics", cats: ["mobile-mechanics"], layer: "claimed", district: "CR0", street: "Lower Addiscombe Road", phone: mobile(323), desk: "off", booking: "request", owner: "u-o1", reviews: 15, replyMins: 45, creds: [{ type: "insurance", status: "verified", expires: "2027-01-31T00:00:00.000Z" }], description: "Servicing, brakes, batteries and diagnostics at your home or work. 15 years in the trade." },
  { name: "Fade Lab Barbers", cats: ["barbers"], layer: "claimed", district: "SE25", street: "Station Road", phone: landline(331), desk: "off", booking: "instant", owner: "u-o2", reviews: 25, replyMins: 30, description: "Skin fades, line-ups and beard work. Book a 30-minute slot and walk straight in." },
  { name: "Fauward Couriers", cats: ["couriers", "man-and-van"], layer: "claimed", district: "CR0", street: "Purley Way", phone: landline(332), desk: "off", booking: "request", owner: "u-o3", reviews: 12, replyMins: 20, creds: [{ type: "insurance", status: "verified", expires: "2027-06-29T00:00:00.000Z" }], description: "Same-day courier and man-and-van across South London, part of the Vitalos courier network." },
  { name: "Brightwire Electrical", cats: ["electricians"], layer: "claimed", district: "SE25", street: "High Street", phone: mobile(324), desk: "paused", booking: "request", owner: "u-o4", reviews: 14, replyMins: 120, creds: [{ type: "niceic", status: "verified", number: "NIC-448812" }, { type: "insurance", status: "verified", expires: "2027-01-14T00:00:00.000Z" }], description: "NICEIC approved electricians. EICRs, rewires, consumer units and fault finding." },
  { name: "Palace Electrics", cats: ["electricians"], layer: "claimed", district: "SE19", street: "Westow Hill", phone: mobile(325), desk: "live", booking: "request", owner: "u-o5", reviews: 5, replyMins: 1, creds: [{ type: "niceic", status: "verified", number: "NIC-512345" }], description: "Domestic electrics around Crystal Palace. Same-week appointments." },
  { name: "Selhurst Locks & Keys", cats: ["locksmiths"], layer: "claimed", district: "SE25", street: "Selhurst Road", phone: mobile(326), desk: "live", booking: "instant", owner: "u-o6", reviews: 6, replyMins: 1, creds: [{ type: "dbs", status: "verified" }], description: "24-hour locksmith. Lockouts, lock changes and uPVC door repairs." },
  { name: "Green Thumb Gardens", cats: ["gardeners"], layer: "claimed", district: "SE19", street: "Auckland Road", phone: mobile(327), desk: "live", booking: "instant", owner: "u-o7", reviews: 6, replyMins: 1, description: "Garden tidies, mowing and hedges. Green waste always taken away." },
  { name: "Croydon Carpet Care", cats: ["carpet-cleaners"], layer: "claimed", district: "CR0", street: "Wellesley Road", phone: mobile(328), desk: "live", booking: "instant", owner: "u-o8", reviews: 6, replyMins: 1, creds: [{ type: "insurance", status: "verified", expires: "2027-02-28T00:00:00.000Z" }], description: "Carpets and sofas cleaned with hot water extraction. Dry in hours." },
  { name: "Addiscombe Decorators", cats: ["painters-decorators"], layer: "claimed", district: "CR0", street: "Cherry Orchard Road", phone: mobile(329), desk: "off", booking: "request", owner: "u-o9", reviews: 7, replyMins: 180, description: "Painting and decorating, inside and out." },
  { name: "Norwood Nails Studio", cats: ["nail-technicians"], layer: "claimed", district: "SE25", street: "Holmesdale Road", phone: mobile(330), desk: "off", booking: "instant", owner: "u-o10", reviews: 7, replyMins: 60, description: "Gel, acrylics and nail art in a calm studio." },
  { name: "Woodside Handyman Services", cats: ["handymen"], layer: "claimed", district: "SE25", street: "Woodside Green", phone: mobile(331), desk: "off", booking: "request", owner: "u-o11", reviews: 7, replyMins: 90, creds: [{ type: "insurance", status: "verified", expires: "2027-04-30T00:00:00.000Z" }], description: "Shelves, flat pack, curtain poles and small repairs." },
  { name: "Croydon Heating Pros", cats: ["heating-engineers", "plumbers"], layer: "claimed", district: "CR0", street: "London Road", phone: mobile(332), desk: "off", booking: "request", owner: "u-o12", reviews: 7, replyMins: 60, creds: [{ type: "gas_safe", status: "verified", number: "612233" }], description: "Boiler installs, servicing and repairs. Gas Safe registered." },
  { name: "Digbeth Plumbing Co", cats: ["plumbers"], layer: "claimed", district: "B5", street: "Bradford Street", phone: mobile(333), desk: "off", booking: "request", owner: "u-o13", reviews: 7, replyMins: 60, description: "Plumbing across central Birmingham." },
  { name: "Moseley Mobile Valet", cats: ["car-valeting"], layer: "claimed", district: "B13", street: "Alcester Road", phone: mobile(334), desk: "off", booking: "instant", owner: "u-o14", reviews: 6, replyMins: 60, description: "Valets at your door in south Birmingham." },
  { name: "Didsbury Cleaning Collective", cats: ["cleaners"], layer: "claimed", district: "M20", street: "Wilmslow Road", phone: mobile(335), desk: "off", booking: "instant", owner: "u-o15", reviews: 4, replyMins: 60, description: "Eco cleaning for homes in south Manchester." },
  { name: "Northern Quarter Barbers", cats: ["barbers"], layer: "claimed", district: "M4", street: "Oldham Street", phone: mobile(336), desk: "off", booking: "instant", owner: "u-o16", reviews: 4, replyMins: 60, description: "Classic and modern cuts in the Northern Quarter." },
]

const SEEDED: ListingSpec[] = [
  { name: "Norwood Locksmiths", cats: ["locksmiths"], layer: "seeded", district: "SE25", street: "High Street", phone: landline(456) },
  { name: "A1 Drain Services", cats: ["plumbers"], layer: "seeded", district: "SE19", street: "Central Hill", phone: landline(401) },
  { name: "SE19 Roofing", cats: ["roofers"], layer: "seeded", district: "SE19", street: "Gipsy Hill", phone: landline(402) },
  { name: "Thornton Builders", cats: ["builders"], layer: "seeded", district: "CR0", street: "Thornton Road", phone: landline(403) },
  { name: "Portland Road Cleaners", cats: ["cleaners"], layer: "seeded", district: "SE25", street: "Portland Road", phone: landline(404) },
  { name: "Selhurst MOT Centre", cats: ["mot-garages"], layer: "seeded", district: "SE25", street: "Selhurst Road", phone: landline(405) },
  { name: "Norwood Tutors", cats: ["tutors"], layer: "seeded", district: "SE19", street: "Beulah Hill", phone: landline(406) },
  { name: "Pestaway Croydon", cats: ["pest-control"], layer: "seeded", district: "CR0", street: "Brigstock Road", phone: landline(407) },
  { name: "Crystal Palace Hair", cats: ["hairdressers"], layer: "seeded", district: "SE19", street: "Westow Street", phone: landline(408) },
  { name: "Addiscombe Appliance Repairs", cats: ["appliance-repair"], layer: "seeded", district: "CR0", street: "Lower Addiscombe Road", phone: landline(409) },
  { name: "Norwood Man & Van", cats: ["man-and-van"], layer: "seeded", district: "SE25", street: "Clifton Road", phone: landline(410) },
  { name: "Croydon Removals", cats: ["removals"], layer: "seeded", district: "CR0", street: "Mitcham Road", phone: landline(411) },
  { name: "South Norwood Plastering", cats: ["plasterers"], layer: "seeded", district: "SE25", street: "Albert Road", phone: landline(412) },
  { name: "Shirley Carpentry", cats: ["carpenters"], layer: "seeded", district: "CR0", street: "Wickham Road", phone: landline(413) },
  { name: "Woodside Windows", cats: ["window-cleaners"], layer: "seeded", district: "SE25", street: "Tennison Road", phone: landline(414) },
  { name: "Upper Norwood Dog Walking", cats: ["dog-walkers"], layer: "seeded", district: "SE19", street: "Harold Road", phone: landline(415) },
  { name: "Brum Electrics", cats: ["electricians"], layer: "seeded", district: "B1", street: "Corporation Street", phone: mobile(601) },
  { name: "Edgbaston Locksmiths", cats: ["locksmiths"], layer: "seeded", district: "B15", street: "Hagley Road", phone: mobile(602) },
  { name: "Moseley Cleaners", cats: ["cleaners"], layer: "seeded", district: "B13", street: "Woodbridge Road", phone: mobile(603) },
  { name: "B5 Barbers", cats: ["barbers"], layer: "seeded", district: "B5", street: "Digbeth High Street", phone: mobile(604) },
  { name: "Balsall Heath Builders", cats: ["builders"], layer: "seeded", district: "B12", street: "Ladypool Road", phone: mobile(605) },
  { name: "Chorlton Plumbing", cats: ["plumbers"], layer: "seeded", district: "M21", street: "Barlow Moor Road", phone: mobile(606) },
  { name: "Fallowfield Fixers", cats: ["handymen"], layer: "seeded", district: "M14", street: "Wilmslow Road", phone: mobile(607) },
  { name: "Manchester Mobile Mechanics", cats: ["mobile-mechanics"], layer: "seeded", district: "M1", street: "Portland Street", phone: mobile(608) },
  { name: "NQ Nails", cats: ["nail-technicians"], layer: "seeded", district: "M4", street: "Tib Street", phone: mobile(609) },
  { name: "Didsbury Gardeners", cats: ["gardeners"], layer: "seeded", district: "M20", street: "School Lane", phone: mobile(610) },
]

const PLACES: ListingSpec[] = [
  { name: "Rapid Response Plumbing Ltd", cats: ["plumbers"], layer: "places", district: "CR0", street: "North End", phone: landline(501), google: [4.3, 87] },
  { name: "Croydon Boiler Repairs", cats: ["heating-engineers", "plumbers"], layer: "places", district: "CR0", street: "George Street", phone: landline(502), google: [4.1, 42] },
  { name: "Electric Avenue SE25", cats: ["electricians"], layer: "places", district: "SE25", street: "Whitehorse Lane", phone: landline(503), google: [4.6, 19] },
  { name: "Spotless Homes London", cats: ["cleaners", "end-of-tenancy-cleaners"], layer: "places", district: "SE19", street: "Anerley Hill", phone: landline(504), google: [4.4, 133] },
  { name: "Quick Keys 24hr", cats: ["locksmiths"], layer: "places", district: "CR0", street: "Church Street", phone: landline(505), google: [3.9, 61] },
  { name: "Thornton Heath Tyres & Mechanics", cats: ["mobile-mechanics", "mot-garages"], layer: "places", district: "CR0", street: "Brigstock Road", phone: landline(506), google: [4.5, 210] },
  { name: "Palace Cuts", cats: ["barbers"], layer: "places", district: "SE19", street: "Church Road", phone: landline(507), google: [4.7, 340] },
  { name: "Croydon Courier Express", cats: ["couriers"], layer: "places", district: "CR0", street: "Wellesley Road", phone: landline(508), google: [4.0, 25] },
  { name: "SE25 Gardening Co", cats: ["gardeners"], layer: "places", district: "SE25", street: "Grange Road", phone: landline(509), google: [4.8, 12] },
  { name: "Norwood Oven Doctor", cats: ["oven-cleaners"], layer: "places", district: "SE25", street: "Warminster Road", phone: landline(510), google: [4.9, 48] },
  { name: "Midlands Heating Services", cats: ["heating-engineers"], layer: "places", district: "B15", street: "Broad Street", phone: mobile(701), google: [4.2, 77] },
  { name: "Jewellery Quarter Cleaning", cats: ["cleaners"], layer: "places", district: "B1", street: "Vyse Street", phone: mobile(702), google: [4.5, 31] },
  { name: "Hall Green Mechanics", cats: ["mobile-mechanics"], layer: "places", district: "B13", street: "Stratford Road", phone: mobile(703), google: [4.3, 54] },
  { name: "Mancunian Electrics", cats: ["electricians"], layer: "places", district: "M1", street: "Deansgate", phone: mobile(704), google: [4.6, 66] },
  { name: "Rusholme Plumbers", cats: ["plumbers"], layer: "places", district: "M14", street: "Wilmslow Road", phone: mobile(705), google: [4.1, 29] },
  { name: "Withington Window Cleaning", cats: ["window-cleaners"], layer: "places", district: "M20", street: "Burton Road", phone: mobile(706), google: [4.7, 18] },
]

const AREA_FOR: Record<string, string> = {
  SE25: "south-norwood",
  SE19: "upper-norwood",
  CR0: "croydon-town",
  B1: "birmingham-city-centre",
  B5: "digbeth",
  B12: "digbeth",
  B13: "moseley",
  B15: "edgbaston",
  M1: "manchester-city-centre",
  M4: "manchester-city-centre",
  M14: "fallowfield",
  M20: "didsbury",
  M21: "chorlton",
}

const CITY_FOR = (d: string): Listing["city"] => (d.startsWith("M") ? "manchester" : d.startsWith("B") && !d.startsWith("BR") ? "birmingham" : "london")

const POSTCODE_SUFFIX = ["4XE", "1QX", "2RB", "5BN", "3NP", "6EP", "2AT", "1NX", "6JS", "4AA", "9HE", "2TT"]

// ---------------------------------------------------------------- reviews

const REVIEW_TEXTS: Record<string, string[]> = {
  plumbing: [
    "Turned up on time, fixed the leak under the sink in half an hour and left everything clean. Will use again.",
    "Boiler service done properly and explained what they checked. Fair price and no upselling.",
    "Replied within a minute on a Sunday evening and came out first thing Monday. Brilliant.",
    "Sorted our radiators that hadn't worked in years. Friendly and tidy.",
    "Quoted exactly what they charged. Really refreshing.",
    "Found the fault quickly when another firm couldn't. Highly recommend.",
    "Sam was polite, careful with our new floor and very reasonable.",
    "Booked through the app, got a slot the next day. No fuss at all.",
    "Great communication from start to finish. Texted when they were on the way.",
    "Fixed a dripping tap and a running toilet in one visit. Good value.",
    "Very professional, wore shoe covers and cleaned up after.",
    "Our boiler packed up in a cold snap and they had us warm by lunchtime.",
  ],
  cleaning: [
    "House was spotless and they even did the skirting boards. Lovely team.",
    "Got our full deposit back after the end of tenancy clean. Worth every penny.",
    "Same cleaner every fortnight, always on time and thorough.",
    "Oven looks brand new. Couldn't believe it.",
    "Easy to book and they brought all their own products.",
    "Really friendly and trustworthy. We leave a key and never worry.",
    "Kitchen and bathrooms gleaming. Booked again for next month.",
    "Replied straight away with a price and a slot. Very easy.",
  ],
  auto: [
    "Came to my work car park and fitted new brake pads in an hour. Great service.",
    "Diagnosed a fault the main dealer missed. Honest and fair.",
    "Battery died on a Monday morning and they were with me by ten.",
    "Clear prices up front and kept me updated. Recommended.",
    "Delivered our parcels across London the same afternoon. Reliable.",
    "Friendly driver, careful with our furniture. Would book again.",
  ],
  beauty: [
    "Best skin fade I've had in South London. Booking a slot is so easy.",
    "Always on time, never waiting around. Great atmosphere.",
    "Neat line-up and a proper hot towel. Top barber.",
    "My nails lasted three weeks without chipping. Lovely studio.",
    "Took care to get exactly what I asked for. Will be back.",
  ],
  general: [
    "Quick to reply, turned up when they said and did a great job.",
    "Fair price, tidy work and very friendly. Recommended.",
    "Really pleased with the result. Easy to book through Answerd.",
    "Professional from the first message to the finished job.",
    "Good communication and no surprises on the bill.",
    "Did exactly what was promised. Would use again.",
    "Slightly late but called ahead to let me know. Good work.",
    "Solid job, reasonable price. Booked them again already.",
  ],
}
const OKAY_TEXTS = [
  "Good work overall but had to chase for a time slot.",
  "Job done well, though a bit pricier than I expected.",
  "Arrived a little late but sorted the problem.",
]

function reviewGroup(cats: string[]) {
  const c = cats[0]!
  if (["plumbers", "heating-engineers"].includes(c)) return "plumbing"
  if (c.includes("clean") || c === "gardeners") return "cleaning"
  if (["mobile-mechanics", "couriers", "man-and-van", "car-valeting"].includes(c)) return "auto"
  if (["barbers", "nail-technicians", "hairdressers"].includes(c)) return "beauty"
  return "general"
}

const OWNER_REPLIES = [
  "Thanks so much, really glad we could help. See you next time!",
  "Thank you for the kind words. It was a pleasure.",
  "Cheers for taking the time to leave a review. Much appreciated.",
  "Thank you! Give us a shout whenever you need us.",
]

// ---------------------------------------------------------------- build

export function createSeed(): DemoData {
  const rng = new Rng(20261027)
  const users = buildUsers(rng)
  const customers = users.filter((u) => u.id.startsWith("u-c"))

  const listings: Listing[] = []
  const businesses: Business[] = []
  const members: BusinessMember[] = []
  const services: Service[] = []
  const availability: Availability[] = []
  const serviceAreas: ServiceArea[] = []
  const credentials: Credential[] = []
  const deskConfigs: DeskConfig[] = []
  const subscriptions: Subscription[] = []
  const reviews: Review[] = []
  const enquiries: Enquiry[] = []

  const all = [...CLAIMED, ...SEEDED, ...PLACES]
  all.forEach((spec, idx) => {
    const d = DISTRICTS[spec.district]!
    const slug = spec.slug ?? slugify(spec.name)
    const id = `l-${slug}`
    const pc = `${spec.district} ${POSTCODE_SUFFIX[idx % POSTCODE_SUFFIX.length]}`
    const geo = {
      lat: +(d.lat + (rng.float() - 0.5) * 0.016).toFixed(5),
      lng: +(d.lng + (rng.float() - 0.5) * 0.024).toFixed(5),
    }
    const createdAt = spec.layer === "places" ? "2026-09-19T00:00:00.000Z" : LAUNCH_DATE
    const sourceRefs: Listing["sourceRefs"] =
      spec.layer === "places"
        ? [{ listingId: id, source: "places", externalId: `ChIJ${slug.replace(/-/g, "").slice(0, 12)}Xq`, fetchedAt: "2026-10-25T06:00:00.000Z" }]
        : [
            { listingId: id, source: "companies_house", externalId: String(10000000 + idx * 7919), fetchedAt: "2026-08-27T03:00:00.000Z" },
            { listingId: id, source: "osm", externalId: `node/${880000000 + idx * 104729}`, fetchedAt: "2026-08-27T03:00:00.000Z" },
          ]
    const listing: Listing = {
      id,
      slug,
      name: spec.name,
      categoryIds: spec.cats,
      layer: spec.layer,
      address: `${10 + ((idx * 7) % 180)} ${spec.street}, ${d.label}`,
      postcode: pc,
      postcodeDistrict: spec.district,
      area: AREA_FOR[spec.district] ?? "croydon",
      city: CITY_FOR(spec.district),
      geo,
      phonePublic: spec.phone ?? mobile(800 + idx),
      badges: spec.layer === "claimed" ? ["verified"] : [],
      sourceRefs,
      placeId: spec.layer === "places" ? sourceRefs[0]!.externalId : undefined,
      googleRating: spec.google?.[0],
      googleCount: spec.google?.[1],
      replyMins: spec.replyMins ?? 240,
      hue: (idx * 47) % 360,
      initials: initials(spec.name),
      description: spec.description ?? "",
      createdAt,
    }
    listings.push(listing)

    if (spec.layer !== "claimed") return

    const bizId = `biz-${slug}`
    listing.businessId = bizId
    listing.sourceRefs.push({ listingId: id, source: "owner", externalId: bizId, fetchedAt: "2026-09-09T10:00:00.000Z" })
    const photos: Photo[] = Array.from({ length: 5 }, (_, i) => ({
      id: `ph-${slug}-${i}`,
      caption: ["Our van", "Recent job", "Before and after", "The team", "Finished work"][i]!,
      hue: (listing.hue + i * 28) % 360,
      icon: ["Truck", "Wrench", "Sparkles", "Users", "BadgeCheck"][i]!,
    }))
    businesses.push({
      id: bizId,
      listingId: id,
      tenantId: `wf-tenant-${1000 + idx}`,
      legalType: idx % 3 === 0 ? "ltd" : "sole_trader",
      companyNumber: idx % 3 === 0 ? String(10000000 + idx * 7919) : undefined,
      tradingName: spec.name,
      description: listing.description,
      email: `hello@${slug}.example`,
      website: `${slug}.example`,
      socials: "",
      yearFounded: 2010 + (idx % 12),
      verifiedAt: "2026-09-09T10:00:00.000Z",
      status: "live",
      bookingMode: spec.booking ?? "request",
      cancellationPolicy: "24h",
      customerReminders: true,
      photos,
      coverPhotoId: photos[0]!.id,
      emergencyCallout: spec.cats.includes("plumbers") || spec.cats.includes("locksmiths"),
      notificationPrefs: { newEnquiry: true, handoff: true, bookingRequest: true, dailyDigest: true, reviewPosted: true, push: true, sms: true, email: true },
      createdAt: "2026-09-09T10:00:00.000Z",
    })
    members.push({ id: `m-${slug}-owner`, businessId: bizId, userId: spec.owner!, name: users.find((u) => u.id === spec.owner)!.firstName + " " + users.find((u) => u.id === spec.owner)!.lastName, phone: users.find((u) => u.id === spec.owner)!.phone, role: "owner", invitedAt: "2026-09-09T10:00:00.000Z", joinedAt: "2026-09-09T10:00:00.000Z" })

    // Services
    let order = 0
    for (const cat of spec.cats) {
      for (const t of SERVICE_TEMPLATES[cat] ?? []) {
        services.push({
          id: `s-${slug}-${slugify(t[0])}`,
          businessId: bizId,
          name: t[0],
          description: t[6],
          durationMin: t[1] || 60,
          priceType: t[2],
          pricePence: t[3],
          priceToPence: t[4],
          vatIncluded: true,
          bookable: t[5],
          order: order++,
        })
      }
    }
    if (slug === "swift-plumbing-heating") {
      services.push({ id: "s-swift-plumbing-heating-emergency-callout", businessId: bizId, name: "Emergency callout", description: "Leaks and no heating, same day where we can.", durationMin: 60, priceType: "from", pricePence: 12000, priceToPence: 16000, vatIncluded: true, bookable: false, order: order++ })
      services.push({ id: "s-swift-plumbing-heating-radiator-bleed-and-check", businessId: bizId, name: "Radiator bleed and check", description: "Bleed, balance and check every radiator.", durationMin: 60, priceType: "fixed", pricePence: 6500, vatIncluded: true, bookable: true, order: order++ })
    }

    // Availability
    const barber = spec.cats.includes("barbers") || spec.cats.includes("nail-technicians")
    const weekly = Array.from({ length: 7 }, (_, day) => {
      if (barber) return { day, closed: day === 1, open: day === 0 ? "10:00" : "09:00", close: day === 0 ? "16:00" : "19:00" }
      if (day === 0) return { day, closed: true, open: "09:00", close: "17:00" }
      if (day === 6) return { day, closed: false, open: "09:00", close: "14:00" }
      return { day, closed: false, open: "08:00", close: "18:00" }
    })
    availability.push({
      businessId: bizId,
      weeklyHours: weekly,
      slotMode: spec.cats.includes("cleaners") || spec.cats.includes("gardeners") ? "windows" : "slots",
      slotLengthMin: barber ? 30 : 60,
      leadTimeMin: barber ? 30 : 120,
      bufferMin: barber ? 0 : 30,
      maxPerDay: barber ? 16 : 5,
      holidays: slug === "addiscombe-decorators" ? [{ id: "hol-1", from: "2026-10-26", to: "2026-11-01", label: "Half-term break" }] : [],
    })
    serviceAreas.push({
      businessId: bizId,
      basePostcode: pc,
      mode: "radius",
      radiusMiles: barber ? 2 : spec.district.startsWith("M") || spec.district.startsWith("B") ? 6 : 5,
      districts: [],
      travelNote: barber ? "" : "No travel charge inside the area.",
    })
    for (const [ci, c] of (spec.creds ?? []).entries()) {
      const labels: Record<string, string> = { gas_safe: "Gas Safe register", niceic: "NICEIC approved contractor", napit: "NAPIT", insurance: "Public liability insurance (£2m)", dbs: "Enhanced DBS check", qualification: "Qualification" }
      credentials.push({
        id: `cr-${slug}-${ci}`,
        businessId: bizId,
        type: c.type,
        label: labels[c.type]!,
        number: c.number ?? "",
        fileUrl: `${c.type}-certificate.pdf`,
        expiresAt: c.expires ?? (c.status === "pending" && c.type === "insurance" ? "2027-11-11T00:00:00.000Z" : undefined),
        status: c.status,
        submittedAt: c.status === "pending" ? "2026-10-24T16:40:00.000Z" : "2026-09-10T10:00:00.000Z",
      })
    }
    const desk = spec.desk ?? "off"
    deskConfigs.push({
      businessId: bizId,
      status: desk,
      number: desk === "off" ? "" : landline(700 + idx),
      voice: "Ellie",
      greeting: `Hi, you've reached ${spec.name}. I'm their Answerd assistant and this call is recorded. How can I help?`,
      permissions: { calls: true, sms: true, book: true, quotes: true, reviews: true },
      handoffRules: { emergencies: true, complaints: true, priceNegotiation: true, namedRequests: true, custom: "" },
      quietHours: { enabled: true, from: "21:00", to: "07:00" },
      alertWho: ["owner"],
      qna: slug === "swift-plumbing-heating" ? [{ id: "qa-1", q: "Do you cover Beckenham?", a: "Yes, we cover BR3 as part of our 5-mile area." }, { id: "qa-2", q: "Do you fit new boilers?", a: "Yes. Sam visits first and gives a fixed quote." }] : [],
      neverSay: ["Promise a fixed time of arrival to the minute"],
      trialEndsAt: desk === "off" ? undefined : addDays("2026-10-19T09:00:00.000Z", slug === "sparkle-clean-co" ? 10 : 14),
      trialUsed: desk !== "off",
      forwardingDetected: desk !== "off",
      setupStep: desk === "off" ? 0 : 6,
      pausedFrom: desk === "paused" ? "live" : undefined,
    })
    subscriptions.push({ id: `sub-${slug}-free`, businessId: bizId, plan: "free", status: "active", stripeId: "", currentPeriodEnd: "2026-11-26T00:00:00.000Z", pricePence: 0 })
    if (desk !== "off") {
      subscriptions.push({ id: `sub-${slug}-desk`, businessId: bizId, plan: "desk", status: "trialing", stripeId: `sub_test_${slug.slice(0, 10)}`, currentPeriodEnd: deskConfigs.at(-1)!.trialEndsAt!, pricePence: 4900 })
    }

    // Reviews
    const n = spec.reviews ?? 0
    const group = reviewGroup(spec.cats)
    const texts = REVIEW_TEXTS[group]!
    const five = Math.round(n * (slug === "swift-plumbing-heating" ? 0.915 : 0.72))
    for (let r = 0; r < n; r++) {
      const isFlagged = slug === "swift-plumbing-heating" && r === n - 1
      const stars = isFlagged ? 1 : r < five ? 5 : r < n - 1 || slug === "swift-plumbing-heating" ? 4 : 3
      const cust = customers[(r * 7 + idx) % customers.length]!
      const daysAgo = Math.floor((r / n) * 50) + rng.int(0, 2)
      reviews.push({
        id: `r-${slug}-${r}`,
        listingId: id,
        customerId: cust.id,
        authorName: `${cust.firstName} ${cust.lastName[0]}.`,
        stars,
        aspects: stars >= 4 ? { quality: stars, punctuality: rng.int(4, 5), value: rng.int(4, 5), communication: 5 } : undefined,
        text: isFlagged ? "Never turned up and wouldn't answer. Avoid." : stars === 5 ? texts[(r + idx) % texts.length]! : OKAY_TEXTS[r % OKAY_TEXTS.length]!,
        photos: [],
        status: "live",
        flagged: isFlagged || undefined,
        flagReason: isFlagged ? "Owner says this customer never booked: possible fake" : undefined,
        reply: !isFlagged && r % 4 === 1 ? { body: OWNER_REPLIES[r % OWNER_REPLIES.length]!, at: addDays(NOW, -daysAgo + 1) } : undefined,
        createdAt: addMinutes(addDays(NOW, -daysAgo - 1), -rng.int(60, 600)),
      })
    }
  })

  const lid = (slug: string) => `l-${slug}`
  const bid = (slug: string) => `biz-${slug}`

  // Tayo's own review of Sparkle (counts within the 300)
  const tayoSparkle = reviews.find((r) => r.listingId === lid("sparkle-clean-co"))!
  Object.assign(tayoSparkle, { id: "r-tayo-sparkle", customerId: "u-tayo", authorName: "Tayo A.", stars: 5, bookingId: "bk-tayo-sparkle", text: "Our flat has never been this clean. Same cleaner every time and lovely with the cat.", createdAt: "2026-10-03T12:00:00.000Z" })

  // Swift reply from Sam on recent reviews
  reviews.filter((r) => r.listingId === lid("swift-plumbing-heating") && r.reply).forEach((r) => (r.reply!.body = `${r.reply!.body} Sam`))

  // ---------------------------------------------------------- bookings
  const svc = (slug: string, name: string) => `s-${slug}-${slugify(name)}`
  const bookings: Booking[] = [
    { id: "bk-tayo-upcoming", listingId: lid("swift-plumbing-heating"), customerId: "u-tayo", customerName: "Tayo A.", customerPhone: mobile(123), serviceId: svc("swift-plumbing-heating", "Leaking tap repair"), startAt: L(2026, 10, 29, 14), endAt: L(2026, 10, 29, 15), address: "12 Elm Rd, London", postcode: "SE25 4AA", accessNotes: "Side gate is open", notes: "Kitchen mixer tap dripping constantly.", photos: [], status: "confirmed", createdBy: "customer", policy: "Free to cancel until 24 hours before", priceText: "From £60 inc VAT", createdAt: "2026-10-23T18:46:00.000Z" },
    { id: "bk-tayo-swift-past", listingId: lid("swift-plumbing-heating"), customerId: "u-tayo", customerName: "Tayo A.", customerPhone: mobile(123), serviceId: "s-swift-plumbing-heating-radiator-bleed-and-check", startAt: L(2026, 10, 12, 10), endAt: L(2026, 10, 12, 11), address: "12 Elm Rd, London", postcode: "SE25 4AA", accessNotes: "", notes: "Two radiators cold at the top.", photos: [], status: "completed", createdBy: "customer", policy: "Free to cancel until 24 hours before", priceText: "£65 inc VAT", reviewRequested: true, createdAt: "2026-10-08T09:12:00.000Z" },
    { id: "bk-tayo-sparkle", listingId: lid("sparkle-clean-co"), customerId: "u-tayo", customerName: "Tayo A.", customerPhone: mobile(123), serviceId: svc("sparkle-clean-co", "Regular clean"), startAt: L(2026, 10, 2, 9), endAt: L(2026, 10, 2, 11), address: "12 Elm Rd, London", postcode: "SE25 4AA", accessNotes: "", notes: "", photos: [], status: "completed", createdBy: "desk", policy: "Free to cancel until 24 hours before", priceText: "£22/hour inc VAT", reviewId: "r-tayo-sparkle", reviewRequested: true, createdAt: "2026-09-28T20:10:00.000Z" },
    { id: "bk-tayo-fade", listingId: lid("fade-lab-barbers"), customerId: "u-tayo", customerName: "Tayo A.", customerPhone: mobile(123), serviceId: svc("fade-lab-barbers", "Skin fade"), startAt: L(2026, 10, 17, 11), endAt: L(2026, 10, 17, 11, 30), address: "Fade Lab Barbers, Station Road", postcode: "SE25 5BN", accessNotes: "", notes: "", photos: [], status: "cancelled", cancelledBy: "customer", cancelReason: "My plans changed", createdBy: "customer", policy: "Free to cancel until 24 hours before", priceText: "£22 inc VAT", createdAt: "2026-10-14T08:00:00.000Z" },
    { id: "bk-priya", listingId: lid("swift-plumbing-heating"), customerId: "u-c0", customerName: "Priya S.", customerPhone: mobile(200), serviceId: "", startAt: L(2026, 10, 26, 9, 30), endAt: L(2026, 10, 26, 11), address: "48 Ross Road, London", postcode: "SE25 6RS", accessNotes: "Parking on the drive", notes: "Boiler losing pressure every day.", photos: [], status: "on_the_way", createdBy: "desk", policy: "Free to cancel until 24 hours before", priceText: "From £95 inc VAT", createdAt: "2026-10-24T19:15:00.000Z" },
    { id: "bk-mark", listingId: lid("swift-plumbing-heating"), customerId: "u-c1", customerName: "Mark T.", customerPhone: mobile(201), serviceId: "", startAt: L(2026, 10, 26, 13), endAt: L(2026, 10, 26, 14), address: "7 Birchanger Road, London", postcode: "SE25 5BN", accessNotes: "", notes: "Annual service, Worcester combi.", photos: [], status: "confirmed", createdBy: "customer", policy: "Free to cancel until 24 hours before", priceText: "£85 inc VAT", assignedTo: "u-jo", reminderSent: true, createdAt: "2026-10-19T10:00:00.000Z" },
    { id: "bk-ola", listingId: lid("swift-plumbing-heating"), customerId: "u-c2", customerName: "Ola B.", customerPhone: mobile(202), serviceId: "", startAt: L(2026, 10, 28, 9), endAt: L(2026, 10, 28, 10), address: "21 Oliver Grove, London", postcode: "SE25 6EP", accessNotes: "Flat 2, buzzer broken: call on arrival", notes: "Boiler due a service, last one was 2024.", photos: [], status: "requested", createdBy: "customer", policy: "Free to cancel until 24 hours before", priceText: "£85 inc VAT", requestExpiresAt: L(2026, 10, 26, 10, 30), createdAt: L(2026, 10, 26, 8, 30) },
    { id: "bk-ben", listingId: lid("kwames-mobile-mechanics"), customerId: "u-c4", customerName: "Ben C.", customerPhone: mobile(204), serviceId: svc("kwames-mobile-mechanics", "Brake pads (front)"), startAt: L(2026, 10, 23, 10), endAt: L(2026, 10, 23, 11, 30), address: "3 Lebanon Road, Croydon", postcode: "CR0 6JS", accessNotes: "", notes: "Squealing when braking.", photos: [], status: "declined", declineReason: "Fully booked that day", createdBy: "customer", policy: "Free to cancel until 24 hours before", priceText: "From £120 inc VAT", createdAt: "2026-10-21T19:30:00.000Z" },
    { id: "bk-chris", listingId: lid("swift-plumbing-heating"), customerId: "u-c5", customerName: "Chris P.", customerPhone: mobile(205), serviceId: svc("swift-plumbing-heating", "Leaking tap repair"), startAt: L(2026, 10, 21, 15), endAt: L(2026, 10, 21, 16), address: "90 Holmesdale Road, London", postcode: "SE25 6RS", accessNotes: "", notes: "", photos: [], status: "no_show", createdBy: "customer", policy: "Free to cancel until 24 hours before", priceText: "From £60 inc VAT", createdAt: "2026-10-19T12:00:00.000Z" },
    { id: "bk-grace", listingId: lid("sparkle-clean-co"), customerId: "u-c6", customerName: "Grace O.", customerPhone: mobile(206), serviceId: svc("sparkle-clean-co", "Deep clean"), startAt: L(2026, 10, 26, 8), endAt: L(2026, 10, 26, 12), address: "15 Fox Hill, London", postcode: "SE19 2AT", accessNotes: "", notes: "Moving in this weekend.", photos: [], status: "arrived", createdBy: "desk", policy: "Free to cancel until 24 hours before", priceText: "From £150 inc VAT", createdAt: "2026-10-22T21:05:00.000Z" },
  ]
  bookings.find((b) => b.id === "bk-priya")!.serviceId = svc("swift-plumbing-heating", "Boiler repair")
  bookings.find((b) => b.id === "bk-mark")!.serviceId = svc("swift-plumbing-heating", "Boiler service")
  bookings.find((b) => b.id === "bk-ola")!.serviceId = svc("swift-plumbing-heating", "Boiler service")

  const ev = (bookingId: string, type: BookingEvent["type"], actor: BookingEvent["actor"], at: string, reason?: string): BookingEvent => ({ id: `be-${bookingId}-${type}-${at.slice(5, 16)}`, bookingId, type, actor, at, reason })
  const bookingEvents: BookingEvent[] = [
    ev("bk-tayo-upcoming", "requested", "customer", "2026-10-23T18:46:00.000Z"),
    ev("bk-tayo-upcoming", "confirmed", "owner", "2026-10-23T19:02:00.000Z"),
    ev("bk-tayo-swift-past", "requested", "customer", "2026-10-08T09:12:00.000Z"),
    ev("bk-tayo-swift-past", "confirmed", "owner", "2026-10-08T09:40:00.000Z"),
    ev("bk-tayo-swift-past", "on_the_way", "owner", "2026-10-12T09:35:00.000Z"),
    ev("bk-tayo-swift-past", "arrived", "owner", "2026-10-12T09:58:00.000Z"),
    ev("bk-tayo-swift-past", "completed", "owner", "2026-10-12T10:55:00.000Z"),
    ev("bk-tayo-swift-past", "review_requested", "desk", "2026-10-12T11:00:00.000Z"),
    ev("bk-tayo-sparkle", "confirmed", "desk", "2026-09-28T20:10:00.000Z"),
    ev("bk-tayo-sparkle", "completed", "owner", "2026-10-02T11:05:00.000Z"),
    ev("bk-tayo-sparkle", "reviewed", "customer", "2026-10-03T12:00:00.000Z"),
    ev("bk-tayo-fade", "confirmed", "system", "2026-10-14T08:00:00.000Z"),
    ev("bk-tayo-fade", "cancelled", "customer", "2026-10-15T19:00:00.000Z", "My plans changed"),
    ev("bk-priya", "confirmed", "desk", "2026-10-24T19:15:00.000Z"),
    ev("bk-priya", "on_the_way", "owner", "2026-10-26T08:55:00.000Z"),
    ev("bk-mark", "requested", "customer", "2026-10-19T10:00:00.000Z"),
    ev("bk-mark", "confirmed", "owner", "2026-10-19T10:31:00.000Z"),
    ev("bk-ola", "requested", "customer", L(2026, 10, 26, 8, 30)),
    ev("bk-ben", "requested", "customer", "2026-10-21T19:30:00.000Z"),
    ev("bk-ben", "declined", "owner", "2026-10-21T20:10:00.000Z", "Fully booked that day"),
    ev("bk-chris", "confirmed", "owner", "2026-10-19T12:30:00.000Z"),
    ev("bk-chris", "no_show", "owner", "2026-10-21T15:40:00.000Z"),
    ev("bk-grace", "confirmed", "desk", "2026-10-22T21:05:00.000Z"),
    ev("bk-grace", "on_the_way", "owner", "2026-10-26T07:40:00.000Z"),
    ev("bk-grace", "arrived", "owner", "2026-10-26T08:02:00.000Z"),
  ]

  // ---------------------------------------------------------- threads, messages, quotes
  const threads: Thread[] = [
    { id: "t-tayo-swift", listingId: lid("swift-plumbing-heating"), customerId: "u-tayo", customerName: "Tayo A.", channel: "app", status: "open", deskActive: true, createdAt: "2026-10-23T18:38:00.000Z", updatedAt: "2026-10-26T08:41:00.000Z", unreadCustomer: 1, unreadBusiness: 0 },
    { id: "t-tayo-sparkle", listingId: lid("sparkle-clean-co"), customerId: "u-tayo", customerName: "Tayo A.", channel: "app", status: "closed", deskActive: true, createdAt: "2026-09-28T20:02:00.000Z", updatedAt: "2026-10-02T11:10:00.000Z", unreadCustomer: 0, unreadBusiness: 0 },
    { id: "t-priya-swift", listingId: lid("swift-plumbing-heating"), customerId: "u-c0", customerName: "Priya S.", customerPhone: mobile(200), channel: "call", status: "open", deskActive: true, createdAt: "2026-10-24T19:12:00.000Z", updatedAt: "2026-10-24T19:16:00.000Z", unreadCustomer: 0, unreadBusiness: 0 },
    { id: "t-leon-swift", listingId: lid("swift-plumbing-heating"), customerId: "u-c3", customerName: "Leon H.", customerPhone: mobile(203), channel: "sms", status: "needs_owner", handoffReason: "Wants to talk about price", deskActive: true, createdAt: "2026-10-26T07:48:00.000Z", updatedAt: "2026-10-26T07:52:00.000Z", unreadCustomer: 0, unreadBusiness: 2 },
    { id: "t-ola-swift", listingId: lid("swift-plumbing-heating"), customerId: "u-c2", customerName: "Ola B.", channel: "app", status: "open", deskActive: true, createdAt: L(2026, 10, 26, 8, 25), updatedAt: L(2026, 10, 26, 8, 31), unreadCustomer: 0, unreadBusiness: 1 },
    { id: "t-tayo-fade", listingId: lid("fade-lab-barbers"), customerId: "u-tayo", customerName: "Tayo A.", channel: "app", status: "closed", deskActive: false, createdAt: "2026-10-15T18:50:00.000Z", updatedAt: "2026-10-15T19:20:00.000Z", unreadCustomer: 0, unreadBusiness: 0 },
    { id: "t-ben-kwame", listingId: lid("kwames-mobile-mechanics"), customerId: "u-c4", customerName: "Ben C.", channel: "app", status: "open", deskActive: false, createdAt: "2026-10-18T17:00:00.000Z", updatedAt: "2026-10-20T09:00:00.000Z", unreadCustomer: 0, unreadBusiness: 0 },
    { id: "t-daniel-brightwire", listingId: lid("brightwire-electrical"), customerId: "u-c7", customerName: "Daniel M.", channel: "app", status: "open", deskActive: false, createdAt: "2026-10-21T12:00:00.000Z", updatedAt: "2026-10-22T16:00:00.000Z", unreadCustomer: 0, unreadBusiness: 0 },
  ]

  const m = (threadId: string, author: Message["author"], at: string, body: string, extra: Partial<Message> = {}): Message => ({ id: `msg-${threadId}-${at.slice(5, 19)}-${author}`, threadId, author, body, attachments: [], createdAt: at, ...extra })
  const quotes: Quote[] = [
    { id: "q-daniel", threadId: "t-daniel-brightwire", listingId: lid("brightwire-electrical"), lines: [{ id: "ql1", label: "Full rewire, 2-bed flat", pricePence: 280000 }, { id: "ql2", label: "Consumer unit and certificate", pricePence: 40000 }], vatIncluded: false, vatPence: 64000, totalPence: 384000, validUntil: "2026-11-21T00:00:00.000Z", message: "Here's the quote we talked about. Happy to answer anything.", status: "sent", sentAt: "2026-10-22T16:00:00.000Z", followUpsAt: ["2026-10-24T16:00:00.000Z", "2026-10-29T16:00:00.000Z"], followUpsSent: 1 },
    { id: "q-ben", threadId: "t-ben-kwame", listingId: lid("kwames-mobile-mechanics"), lines: [{ id: "ql3", label: "Clutch replacement (Ford Focus)", pricePence: 42000 }], vatIncluded: true, vatPence: 7000, totalPence: 42000, validUntil: "2026-11-18T00:00:00.000Z", message: "Parts and labour, done at your drive.", status: "accepted", sentAt: "2026-10-19T10:00:00.000Z", followUpsAt: [], followUpsSent: 0 },
  ]
  const messages: Message[] = [
    m("t-tayo-swift", "customer", "2026-10-23T18:38:00.000Z", "Hi, our kitchen tap's been dripping for a week. Are you free this week?"),
    m("t-tayo-swift", "desk", "2026-10-23T18:38:40.000Z", "Hi Tayo, I'm Swift Plumbing & Heating's Answerd assistant. A leaking tap repair is £60 to £90 including VAT, depending on the part. Sam's next free times are below.", { card: { kind: "slot", slots: [L(2026, 10, 29, 10), L(2026, 10, 29, 14)], serviceId: svc("swift-plumbing-heating", "Leaking tap repair") } }),
    m("t-tayo-swift", "customer", "2026-10-23T18:45:00.000Z", "Thursday 2pm please"),
    m("t-tayo-swift", "system", "2026-10-23T18:46:00.000Z", "Booking requested", { card: { kind: "booking", bookingId: "bk-tayo-upcoming" } }),
    m("t-tayo-swift", "owner", "2026-10-23T19:02:00.000Z", "Thanks Tayo, that's confirmed for Thursday at 2pm. Sam", { authorName: "Sam Okafor" }),
    m("t-tayo-swift", "owner", "2026-10-26T08:41:00.000Z", "Morning Tayo, just checking: is it the mixer tap or the cold tap? I'll bring the right cartridge.", { authorName: "Sam Okafor" }),

    m("t-tayo-sparkle", "customer", "2026-09-28T20:02:00.000Z", "Hi, could you do a 2-hour clean this Friday morning?"),
    m("t-tayo-sparkle", "desk", "2026-09-28T20:02:30.000Z", "Hi Tayo, I'm Sparkle Clean Co's Answerd assistant. Yes: a regular clean is £22 an hour including VAT. Friday morning is free.", { card: { kind: "slot", slots: [L(2026, 10, 2, 9), L(2026, 10, 2, 13)], serviceId: svc("sparkle-clean-co", "Regular clean") } }),
    m("t-tayo-sparkle", "system", "2026-09-28T20:10:00.000Z", "Booked", { card: { kind: "booking", bookingId: "bk-tayo-sparkle" } }),
    m("t-tayo-sparkle", "owner", "2026-10-02T11:10:00.000Z", "Thanks Tayo! Bisi", { authorName: "Bisi Martins" }),

    m("t-priya-swift", "system", "2026-10-24T19:12:00.000Z", "Call answered by the Answerd desk · 3:24"),
    m("t-priya-swift", "desk", "2026-10-24T19:16:00.000Z", "Hi Priya, it's Swift Plumbing & Heating's Answerd assistant. You're booked for a boiler repair on Mon 26 Oct at 9:30am. Sam will text when he's on his way.", { card: { kind: "booking", bookingId: "bk-priya" } }),

    m("t-leon-swift", "customer", "2026-10-26T07:48:00.000Z", "How much to replace a bath and tiles? Could you do it for £2,000 cash?"),
    m("t-leon-swift", "desk", "2026-10-26T07:48:30.000Z", "Hi Leon, I'm Swift Plumbing & Heating's Answerd assistant. Bathroom installations are quoted after a visit, so I can't agree a price. I'll get Sam to call you back within the hour."),
    m("t-leon-swift", "system", "2026-10-26T07:52:00.000Z", "Handed to Sam: wants to talk about price"),

    m("t-ola-swift", "customer", L(2026, 10, 26, 8, 25), "Hi, can you service my boiler Wednesday morning?"),
    m("t-ola-swift", "desk", L(2026, 10, 26, 8, 25, ), "Hi Ola, I'm Swift Plumbing & Heating's Answerd assistant. A boiler service is £85 including VAT. Wednesday at 9am is free; Sam confirms requests within 2 hours.", { card: { kind: "slot", slots: [L(2026, 10, 28, 9), L(2026, 10, 28, 11)], serviceId: svc("swift-plumbing-heating", "Boiler service") } }),
    m("t-ola-swift", "system", L(2026, 10, 26, 8, 30), "Booking requested", { card: { kind: "booking", bookingId: "bk-ola" } }),

    m("t-tayo-fade", "customer", "2026-10-15T18:50:00.000Z", "Sorry, I need to cancel Saturday."),
    m("t-tayo-fade", "owner", "2026-10-15T19:20:00.000Z", "No worries, see you next time. Dele", { authorName: "Dele Johnson" }),

    m("t-ben-kwame", "customer", "2026-10-18T17:00:00.000Z", "Clutch is slipping on my 2015 Focus. Can you quote?"),
    m("t-ben-kwame", "owner", "2026-10-19T10:00:00.000Z", "Here you go Ben.", { authorName: "Kwame Asante", card: { kind: "quote", quoteId: "q-ben" } }),
    m("t-ben-kwame", "customer", "2026-10-20T09:00:00.000Z", "Accepted, thanks. When can you do it?"),

    m("t-daniel-brightwire", "customer", "2026-10-21T12:00:00.000Z", "Looking for a full rewire on a 2-bed flat in SE25. Can you quote?"),
    m("t-daniel-brightwire", "owner", "2026-10-22T16:00:00.000Z", "Here's the quote we talked about. Happy to answer anything.", { authorName: "Ryan Brightwell", card: { kind: "quote", quoteId: "q-daniel" } }),
    m("t-daniel-brightwire", "desk", "2026-10-24T16:00:00.000Z", "Hi Daniel, just checking you got Brightwire Electrical's quote for the rewire. Happy to book a time?"),
  ]

  // ---------------------------------------------------------- calls
  const calls: Call[] = [
    {
      id: "call-priya", listingId: lid("swift-plumbing-heating"), trackedNumber: landline(700), callerMasked: "07700 •••200", customerId: "u-c0", customerName: "Priya S.", startedAt: "2026-10-24T19:12:00.000Z", durationSec: 204, outcome: "desk", recordingUrl: "recording-priya.mp3", bookingId: "bk-priya", threadId: "t-priya-swift", scriptId: "D-01",
      summary: "Priya, SE25 6RS: boiler losing pressure daily, no leak visible. Booked boiler repair Mon 26 Oct 9:30am.",
      transcript: [
        { speaker: "desk", text: "Hi, you've reached Swift Plumbing & Heating. I'm their Answerd assistant and this call is recorded. How can I help?", atSec: 0 },
        { speaker: "caller", text: "Hi, my boiler keeps losing pressure. I have to top it up every day.", atSec: 9 },
        { speaker: "desk", text: "Sorry to hear that. Is there any water leaking, or a smell of gas?", atSec: 16 },
        { speaker: "caller", text: "No, nothing like that. It's just the pressure.", atSec: 22 },
        { speaker: "desk", text: "Thanks. What's your postcode?", atSec: 27 },
        { speaker: "caller", text: "SE25 6RS.", atSec: 31 },
        { speaker: "desk", text: "That's in Sam's area. A boiler repair is £95 to £180 including VAT, and parts are quoted before they're fitted. The next free times are Monday at 9:30am or Tuesday at 2pm.", atSec: 35 },
        { speaker: "caller", text: "Monday 9:30 is great.", atSec: 52 },
        { speaker: "desk", text: "You're booked for Monday 26 October at 9:30am. I'll text you a confirmation now, and Sam will message when he's on his way.", atSec: 56 },
      ],
    },
    {
      id: "call-danny", listingId: lid("swift-plumbing-heating"), trackedNumber: landline(700), callerMasked: "07700 •••209", customerId: "u-c9", customerName: "Tom W.", startedAt: "2026-10-25T11:05:00.000Z", durationSec: 96, outcome: "desk", recordingUrl: "recording-tom.mp3", scriptId: "D-08",
      summary: "Tom, CR0: wants Sam by name about a new combi boiler install. Handed over: call back today.",
      transcript: [
        { speaker: "desk", text: "Hi, you've reached Swift Plumbing & Heating. I'm their Answerd assistant and this call is recorded. How can I help?", atSec: 0 },
        { speaker: "caller", text: "Is Sam there? He did my mum's boiler and I want him to quote for mine.", atSec: 8 },
        { speaker: "desk", text: "Sam's on a job right now. New boiler installs are quoted after a visit. I'll get Sam to call you back within the hour. Is this the best number?", atSec: 15 },
        { speaker: "caller", text: "Yes, that's fine.", atSec: 26 },
        { speaker: "desk", text: "Great. I've passed your details to Sam. Thanks for calling.", atSec: 29 },
      ],
    },
    {
      id: "call-grace", listingId: lid("sparkle-clean-co"), trackedNumber: landline(701), callerMasked: "07700 •••206", customerId: "u-c6", customerName: "Grace O.", startedAt: "2026-10-22T21:01:00.000Z", durationSec: 142, outcome: "desk", recordingUrl: "recording-grace.mp3", bookingId: "bk-grace", scriptId: "D-01",
      summary: "Grace, SE19 2AT: deep clean before moving in. Booked Mon 26 Oct, 8am to 12pm.",
      transcript: [
        { speaker: "desk", text: "Hi, you've reached Sparkle Clean Co. I'm their Answerd assistant and this call is recorded. How can I help?", atSec: 0 },
        { speaker: "caller", text: "I need a deep clean before we move in next week.", atSec: 7 },
        { speaker: "desk", text: "A deep clean is £150 to £250 including VAT depending on size. What's your postcode?", atSec: 12 },
        { speaker: "caller", text: "SE19 2AT.", atSec: 20 },
        { speaker: "desk", text: "Lovely, that's covered. Monday morning from 8am is free. Shall I book it?", atSec: 23 },
        { speaker: "caller", text: "Yes please.", atSec: 30 },
        { speaker: "desk", text: "Done. You're booked for Monday 26 October from 8am. I'll text you the details.", atSec: 32 },
      ],
    },
    {
      id: "call-lockout", listingId: lid("selhurst-locks-and-keys"), trackedNumber: landline(707), callerMasked: "07700 •••211", customerId: "u-c11", customerName: "Hannah G.", startedAt: "2026-10-25T22:40:00.000Z", durationSec: 118, outcome: "desk", recordingUrl: "recording-hannah.mp3", scriptId: "D-01",
      summary: "Hannah, SE25 4XE: locked out, keys inside. Emergency lockout booked for 11:15pm.",
      transcript: [
        { speaker: "desk", text: "Hi, you've reached Selhurst Locks & Keys. I'm their Answerd assistant and this call is recorded. How can I help?", atSec: 0 },
        { speaker: "caller", text: "I've locked myself out and my keys are inside.", atSec: 6 },
        { speaker: "desk", text: "Are you somewhere safe and warm while you wait?", atSec: 11 },
        { speaker: "caller", text: "Yes, I'm at my neighbour's.", atSec: 15 },
        { speaker: "desk", text: "Good. An emergency lockout is £80 to £120 including VAT. Someone can be with you by 11:15pm. Shall I book it?", atSec: 18 },
        { speaker: "caller", text: "Yes, please.", atSec: 28 },
      ],
    },
    {
      id: "call-palace", listingId: lid("palace-electrics"), trackedNumber: landline(706), callerMasked: "07700 •••213", customerId: "u-c13", customerName: "Sophie T.", startedAt: "2026-10-25T15:20:00.000Z", durationSec: 87, outcome: "desk", recordingUrl: "recording-sophie.mp3", scriptId: "D-01",
      summary: "Sophie, SE19 3NP: kitchen sockets dead after a trip. Offered Tue 9am, she'll message to confirm.",
      transcript: [
        { speaker: "desk", text: "Hi, you've reached Palace Electrics. I'm their Answerd assistant and this call is recorded. How can I help?", atSec: 0 },
        { speaker: "caller", text: "The kitchen sockets stopped working after the trip switch went.", atSec: 6 },
        { speaker: "desk", text: "Is there any burning smell or sparks?", atSec: 12 },
        { speaker: "caller", text: "No, nothing.", atSec: 15 },
        { speaker: "desk", text: "Fault finding is £65 an hour including VAT. The next free time is Tuesday at 9am. Would that work?", atSec: 17 },
        { speaker: "caller", text: "I'll check and message you.", atSec: 29 },
      ],
    },
    {
      id: "call-spam", listingId: lid("swift-plumbing-heating"), trackedNumber: landline(700), callerMasked: "020 •••999", customerId: null, customerName: "Unknown caller", startedAt: "2026-10-25T09:14:00.000Z", durationSec: 31, outcome: "desk", recordingUrl: "recording-spam.mp3", spam: true, scriptId: "D-10",
      summary: "Sales call about business energy rates. Ended politely, logged as spam.",
      transcript: [
        { speaker: "desk", text: "Hi, you've reached Swift Plumbing & Heating. I'm their Answerd assistant and this call is recorded. How can I help?", atSec: 0 },
        { speaker: "caller", text: "Hi, I'm calling about your business energy contract, could I speak to the owner?", atSec: 6 },
        { speaker: "desk", text: "Thanks, but Swift Plumbing & Heating doesn't take sales calls on this line. Goodbye.", atSec: 13 },
      ],
    },
  ]

  // ---------------------------------------------------------- enquiries
  let enqN = 0
  const enq = (listingId: string, kind: Enquiry["kind"], at: string, layer: Listing["layer"] = "claimed"): Enquiry => ({ id: `e-${++enqN}`, listingId, kind, at, layer })
  // Swift: exactly 9 Answerd enquiries (one short of the monetise gate)
  const swiftEnq: [Enquiry["kind"], string][] = [
    ["call", "2026-09-13T10:00:00.000Z"],
    ["message", "2026-09-21T19:00:00.000Z"],
    ["booking", "2026-10-08T09:12:00.000Z"],
    ["call", "2026-10-10T08:20:00.000Z"],
    ["booking", "2026-10-19T10:00:00.000Z"],
    ["message", "2026-10-23T18:38:00.000Z"],
    ["call", "2026-10-24T19:12:00.000Z"],
    ["call", "2026-10-25T11:05:00.000Z"],
    ["message", "2026-10-26T07:48:00.000Z"],
  ]
  for (const [k, at] of swiftEnq) enquiries.push(enq(lid("swift-plumbing-heating"), k, at))
  // Other claimed listings
  for (const l of listings.filter((x) => x.layer === "claimed" && x.slug !== "swift-plumbing-heating")) {
    const count = l.slug === "sparkle-clean-co" ? 12 : rng.int(2, 8)
    for (let i = 0; i < count; i++) {
      enquiries.push(enq(l.id, rng.pick(["call", "message", "booking", "call"] as const), addMinutes(addDays(NOW, -rng.int(1, 55)), -rng.int(0, 600) - i)))
    }
  }
  // Norwood Locksmiths: 6 tracked calls this month
  const nl = lid("norwood-locksmiths")
  ;["2026-10-02T21:10:00.000Z", "2026-10-06T08:05:00.000Z", "2026-10-11T19:40:00.000Z", "2026-10-17T23:15:00.000Z", "2026-10-21T07:30:00.000Z", "2026-10-25T18:00:00.000Z"].forEach((at) => enquiries.push(enq(nl, "call", at, "seeded")))
  // A few calls to other seeded listings
  for (const l of listings.filter((x) => x.layer === "seeded" && x.id !== nl).slice(0, 8)) {
    for (let i = 0; i < rng.int(1, 3); i++) enquiries.push(enq(l.id, "call", addDays(NOW, -rng.int(2, 40)), "seeded"))
  }
  // Profile views and search appearances for stats (8 weeks)
  for (const l of listings.filter((x) => x.layer === "claimed")) {
    const perWeek = l.slug === "swift-plumbing-heating" ? 26 : rng.int(4, 14)
    for (let w = 0; w < 8; w++) {
      const n = Math.max(1, Math.round(perWeek * (0.6 + w * 0.08)))
      for (let i = 0; i < n; i++) enquiries.push(enq(l.id, "profile_view", addMinutes(addDays(NOW, -(7 * (7 - w)) - rng.int(0, 6)), -rng.int(0, 900) - i)))
      for (let i = 0; i < n * 3; i++) enquiries.push(enq(l.id, "search_appearance", addMinutes(addDays(NOW, -(7 * (7 - w)) - rng.int(0, 6)), -i)))
    }
  }

  // ---------------------------------------------------------- notifications
  const nt = (id: string, userId: string, mode: Notification["mode"], event: string, title: string, body: string, href: string, at: string, read: boolean, businessId?: string, channels: Notification["channels"] = ["push"]): Notification => ({ id, userId, mode, event, title, body, href, at, readAt: read ? at : undefined, businessId, channels })
  const notifications: Notification[] = [
    nt("n-1", "u-tayo", "customer", "new_message", "Swift Plumbing & Heating", "Morning Tayo, just checking: is it the mixer tap or the cold tap?", "/app/messages/t-tayo-swift", "2026-10-26T08:41:00.000Z", false),
    nt("n-2", "u-tayo", "customer", "review_request", "How did Swift Plumbing & Heating do?", "Tap to leave a quick review of your radiator visit.", "/app/bookings/bk-tayo-swift-past/review", "2026-10-12T11:00:00.000Z", false),
    nt("n-3", "u-tayo", "customer", "booking_confirmed", "You're booked", "You're booked with Swift Plumbing & Heating, Thu 29 Oct, 2pm", "/app/bookings/bk-tayo-upcoming", "2026-10-23T19:02:00.000Z", true, undefined, ["push", "sms", "email"]),
    nt("n-4", "u-tayo", "customer", "desk_replied", "Sparkle Clean Co's Answerd desk replied", "Yes: a regular clean is £22 an hour including VAT.", "/app/messages/t-tayo-sparkle", "2026-09-28T20:02:30.000Z", true),
    nt("n-5", "u-sam", "business", "booking_request", "New booking request", "New booking request: boiler service, Wed 9am. Reply within 2 hours.", "/app/biz/requests/bk-ola", L(2026, 10, 26, 8, 30), false, "biz-swift-plumbing-heating", ["push", "sms"]),
    nt("n-6", "u-sam", "business", "handoff", "Leon needs you", "Leon needs you: wants to talk about price. Call back within the hour.", "/app/biz/inbox/t-leon-swift", "2026-10-26T07:52:00.000Z", false, "biz-swift-plumbing-heating", ["push", "sms"]),
    nt("n-7", "u-sam", "business", "desk_call", "Your desk took a call", "Your desk took a call from Priya: boiler losing pressure, SE25. Booked Mon 9:30am.", "/app/biz/calls/call-priya", "2026-10-24T19:16:00.000Z", true, "biz-swift-plumbing-heating"),
    nt("n-8", "u-sam", "business", "credential_expiring", "Insurance expiring", "Your insurance expires on 11 Nov. Upload the new certificate.", "/app/biz/profile/credentials", "2026-10-12T09:00:00.000Z", true, "biz-swift-plumbing-heating", ["push", "email"]),
    nt("n-9", "u-sam", "business", "new_review", "New review", "New 5★ review from Priya", "/app/biz/reviews", "2026-10-25T20:00:00.000Z", true, "biz-swift-plumbing-heating"),
    nt("n-10", "u-sam", "business", "desk_call", "Tom needs you", "Tom needs you: wants you by name about a new boiler. Call back within the hour.", "/app/biz/calls/call-danny", "2026-10-25T11:06:00.000Z", true, "biz-swift-plumbing-heating", ["push", "sms"]),
    nt("n-11", "u-jo", "business", "reminder", "Today 1pm", "Today 1pm: Mark T., boiler service at 7 Birchanger Road", "/app/biz/jobs/bk-mark", L(2026, 10, 25, 13), false, "biz-swift-plumbing-heating"),
    nt("n-12", "u-sam", "customer", "welcome", "Welcome to Answerd", "Find, call, message and book local businesses.", "/app", "2026-08-31T08:10:00.000Z", true),
  ]

  // ---------------------------------------------------------- the rest
  const customerProfiles: CustomerProfile[] = users
    .filter((u) => !u.staffRole)
    .map((u) => ({
      userId: u.id,
      savedPlaces: u.id === "u-tayo" ? [{ id: "sp-home", label: "Home", line1: "12 Elm Rd", postcode: "SE25 4AA", area: "South Norwood" }, { id: "sp-work", label: "Work", line1: "40 Paul Street", postcode: "EC2A 4BX", area: "Shoreditch" }] : [],
      savedListingIds: u.id === "u-tayo" ? [lid("swift-plumbing-heating"), lid("sparkle-clean-co"), lid("fade-lab-barbers")] : [],
      referralCode: u.id === "u-tayo" ? "TAYO-7K2" : `${u.firstName.toUpperCase().slice(0, 4)}-${u.id.slice(-3).toUpperCase()}`,
      recentSearches: u.id === "u-tayo" ? ["boiler service", "end of tenancy clean", "skin fade"] : [],
      notificationPrefs: { bookingPush: true, bookingSms: true, messagesPush: true, reminders: true, reviewRequests: true, offers: false },
      noShowCount: u.id === "u-c5" ? 2 : 0,
    }))

  const referrals: Referral[] = [
    { id: "ref-1", referrerUserId: "u-tayo", kind: "invite", code: "TAYO-7K2", at: "2026-10-25T20:00:00.000Z", joinsAt: "2026-10-27T09:00:00.000Z", joinedName: "Ade" },
    { id: "ref-2", referrerUserId: "u-tayo", kind: "recommend", listingId: lid("sparkle-clean-co"), code: "TAYO-7K2", at: "2026-10-03T12:05:00.000Z" },
  ]

  const featuredCats = ["plumbers", "heating-engineers", "cleaners", "electricians", "locksmiths", "barbers"]
  const featuredSlots: FeaturedSlot[] = featuredCats.flatMap((c) =>
    ([1, 2, 3] as const).map((p) => ({
      id: `fs-${c}-croydon-${p}`,
      categoryId: c,
      areaCode: "croydon",
      position: p,
      businessId: p === 1 && (c === "plumbers" || c === "heating-engineers") ? bid("croydon-heating-pros") : undefined,
      startsAt: p === 1 && (c === "plumbers" || c === "heating-engineers") ? "2026-09-30T00:00:00.000Z" : undefined,
      waitlist: [],
    })),
  )
  subscriptions.push({ id: "sub-croydon-heating-pros-featured", businessId: bid("croydon-heating-pros"), plan: "featured", status: "active", stripeId: "sub_test_chp_feat", currentPeriodEnd: "2026-10-31T00:00:00.000Z", pricePence: 2900 })
  const invoices: Invoice[] = [
    { id: "inv-1", businessId: bid("croydon-heating-pros"), at: "2026-09-30T00:00:00.000Z", description: "Featured · Heating engineers · Croydon", amountPence: 3480, status: "paid" },
  ]

  const claims: Claim[] = [
    { id: "cl-thornton", listingId: lid("thornton-builders"), userId: "u-c24", method: "document", status: "pending", evidenceUrl: "thornton-utility-bill.pdf", evidenceKind: "Utility bill", createdAt: "2026-10-25T14:00:00.000Z" },
    { id: "cl-dispute", listingId: lid("fade-lab-barbers"), userId: "u-c26", method: "document", status: "disputed", evidenceUrl: "lease-extract.pdf", evidenceKind: "Lease", details: "I own Fade Lab. The person who claimed it was a former employee.", createdAt: "2026-10-24T10:30:00.000Z" },
    { id: "cl-swift", listingId: lid("swift-plumbing-heating"), userId: "u-sam", method: "sms", status: "approved", createdAt: "2026-09-09T09:50:00.000Z", decidedAt: "2026-09-09T10:00:00.000Z" },
  ]

  const reports: Report[] = [
    { id: "rep-1", target: "listing", targetId: lid("croydon-removals"), reason: "Closed", details: "Their phone line says the business has closed.", status: "open", reporterId: "u-c8", at: "2026-10-24T13:00:00.000Z" },
    { id: "rep-2", target: "review", targetId: reviews.find((r) => r.flagged)!.id, reason: "Fake", details: "This person never booked with us. Sam", status: "open", reporterId: "u-sam", at: "2026-10-25T08:00:00.000Z" },
  ]

  const imports: ImportJob[] = [
    { id: "imp-1", source: "companies_house", ranAt: "2026-10-26T03:00:00.000Z", added: 214, updated: 1830, errors: 0, status: "ok" },
    { id: "imp-2", source: "osm", ranAt: "2026-10-26T03:30:00.000Z", added: 96, updated: 640, errors: 3, status: "ok" },
    { id: "imp-3", source: "companies_house", ranAt: "2026-10-25T03:00:00.000Z", added: 188, updated: 1712, errors: 0, status: "ok" },
    { id: "imp-4", source: "osm", ranAt: "2026-10-25T03:30:00.000Z", added: 0, updated: 0, errors: 1, status: "failed" },
  ]

  const placesDays: PlacesDay[] = Array.from({ length: 30 }, (_, i) => {
    const date = addDays(NOW, i - 29)
    const calls = 600 + Math.round(Math.sin(i / 3) * 120) + i * 9
    return { date: date.slice(0, 10), spendPence: Math.round(calls * 1.7), calls, cacheHits: Math.round(calls * (0.62 + (i % 5) * 0.02)) }
  })

  const settings: Settings = {
    featuredOn: true,
    gapFillOn: true,
    voiceProvider: "Twilio Voice",
    killSwitch: false,
    placesCapPence: 2000,
    gateOverrides: [],
    launchDate: LAUNCH_DATE,
    homeCategoryOrder: ["plumbers", "electricians", "cleaners", "mobile-mechanics", "barbers", "locksmiths", "gardeners", "couriers"],
    homeBanner: "",
    seoIntroTemplate: "Find trusted {category} in {area}. Compare reviews, see who responds instantly, then call, message or book in two taps.",
    // R2 super admin: v1 of the rules reproduces the launch behaviour exactly
    ruleVersions: [{ id: "rv-1", version: 1, rules: { ...DEFAULT_RULES }, reason: "Launch pricing and rules", effectiveAt: LAUNCH_DATE, by: "u-temitope", at: "2026-08-25T10:00:00.000Z" }],
    platform: { ...DEFAULT_PLATFORM },
    accessReviewAt: "2026-10-02T10:00:00.000Z",
    budgets: { telephony: 15000, sms: 5000, ai: 20000, places: 60000, hosting: 25000 },
    integrations: INTEGRATIONS,
  }

  const audit: AuditEvent[] = [
    { id: "au-1", actorId: "u-ife", action: "claim.approve", targetType: "claim", targetId: "cl-swift", reason: "SMS code matched listed number", at: "2026-09-09T10:00:00.000Z" },
    { id: "au-2", actorId: "u-ife", action: "credential.approve", targetType: "credential", targetId: "cr-swift-plumbing-heating-0", reason: "Checked on the Gas Safe register", at: "2026-09-10T10:30:00.000Z" },
  ]

  const blocks: BlockTime[] = [
    { id: "blk-1", businessId: bid("swift-plumbing-heating"), startAt: L(2026, 10, 27, 12), endAt: L(2026, 10, 27, 14), reason: "Merchant pick-up", repeat: "none" },
  ]

  const session: Session = {
    personaId: "guest",
    userId: null,
    mode: "customer",
    currentBusinessId: null,
    location: null,
    onboarded: false,
    notificationsAsked: false,
    pushEnabled: false,
    askCount: 0,
    failedCodes: {},
    lockedUntil: {},
    cookieConsent: null,
    adminSignedIn: false,
    supportViewBusinessId: null,
    recentAreas: ["SE25 · South Norwood", "CR0 · Croydon"],
    guestRecentSearches: [],
  }

  return {
    version: SEED_VERSION,
    clock: NOW,
    users,
    customerProfiles,
    categories: CATEGORIES,
    listings,
    businesses,
    members: [...members, { id: "m-swift-jo", businessId: bid("swift-plumbing-heating"), userId: "u-jo", name: "Jo Reid", phone: mobile(457), role: "staff", invitedAt: "2026-09-11T09:00:00.000Z", joinedAt: "2026-09-11T09:20:00.000Z" }],
    services,
    availability,
    serviceAreas,
    credentials,
    claims,
    threads,
    messages,
    calls,
    enquiries,
    bookings,
    blocks,
    bookingEvents,
    quotes,
    reviews,
    referrals,
    deskConfigs,
    subscriptions,
    invoices,
    featuredSlots,
    notifications,
    reports,
    audit,
    tickets: [],
    imports,
    placesDays,
    contested: [{ listingId: lid("fade-lab-barbers"), startAt: L(2026, 10, 29, 15) }],
    settings,
    session,
    draft: null,
    deskRuns: [],
    signIns: SIGN_INS,
    dataRequests: DATA_REQUESTS,
  }
}

// ---------------------------------------------------------------- R2 super admin

const INTEGRATIONS: Integration[] = [
  { id: "int-stripe", name: "Stripe", purpose: "Subscriptions, checkout and the billing portal", status: "ok", owner: "Temitope Agbola", lastRotatedAt: "2026-09-28T10:00:00.000Z" },
  { id: "int-telephony", name: "Telephony (Twilio Voice)", purpose: "Answerd numbers, call forwarding, desk voice and SMS", status: "degraded", owner: "Ife Bello", lastError: "Status callback timed out for 3 calls; retried and delivered", lastErrorAt: "2026-10-25T21:14:00.000Z", lastRotatedAt: "2026-08-30T09:00:00.000Z" },
  { id: "int-places", name: "Google Maps and Places", purpose: "Maps, geocoding and gap-fill results", status: "ok", owner: "Ife Bello", lastError: "OVER_QUERY_LIMIT on Text Search; served from cache", lastErrorAt: "2026-10-22T18:02:00.000Z", lastRotatedAt: "2026-10-01T09:00:00.000Z" },
  { id: "int-askbridge", name: "Askbridge", purpose: "Ask Answerd and Chat with Answerd", status: "ok", owner: "Temitope Agbola", lastRotatedAt: "2026-09-15T09:00:00.000Z" },
  { id: "int-workforce", name: "Workforce", purpose: "AI desk receptionist agents, one tenant per business", status: "ok", owner: "Temitope Agbola", lastRotatedAt: "2026-09-15T09:00:00.000Z" },
  { id: "int-email", name: "Email", purpose: "Receipts, digests and sign-in links", status: "ok", owner: "Dan Price", lastRotatedAt: "2026-07-20T09:00:00.000Z" },
  { id: "int-push", name: "Push (APNs and FCM)", purpose: "App notifications for customers and businesses", status: "ok", owner: "Dan Price", lastError: "12 tokens expired; removed", lastErrorAt: "2026-10-24T07:00:00.000Z", lastRotatedAt: "2026-06-30T09:00:00.000Z" },
]

const SIGN_INS: SignInEvent[] = [
  { id: "si-1", userId: "u-ife", email: "ife@vitalos.co.uk", at: "2026-10-26T08:42:00.000Z", method: "Google + authenticator", ok: true },
  { id: "si-2", userId: null, email: "admin.answerd@gmail.com", at: "2026-10-25T02:13:00.000Z", method: "Google + authenticator", ok: false, detail: "Not a vitalos.co.uk account" },
  { id: "si-3", userId: "u-dan", email: "dan@vitalos.co.uk", at: "2026-10-25T17:05:00.000Z", method: "Google + authenticator", ok: true },
  { id: "si-4", userId: "u-dan", email: "dan@vitalos.co.uk", at: "2026-10-25T17:03:00.000Z", method: "Google + authenticator", ok: false, detail: "Wrong authenticator code" },
  { id: "si-5", userId: "u-temitope", email: "temitope@vitalos.co.uk", at: "2026-10-23T16:30:00.000Z", method: "Google + security key", ok: true },
  { id: "si-6", userId: "u-ife", email: "ife@vitalos.co.uk", at: "2026-10-23T08:51:00.000Z", method: "Google + authenticator", ok: true },
]

const DATA_REQUESTS: DataRequest[] = [
  { id: "dr-1", userId: "u-c12", kind: "export", status: "pending", requestedAt: "2026-10-24T11:20:00.000Z" },
  { id: "dr-2", userId: "u-c17", kind: "delete", status: "pending", requestedAt: "2026-10-25T19:45:00.000Z" },
  { id: "dr-3", userId: "u-c3", kind: "export", status: "approved", requestedAt: "2026-10-09T15:00:00.000Z", decidedAt: "2026-10-12T10:00:00.000Z", decidedBy: "u-temitope", reason: "Identity confirmed by email" },
]

/** Personas shown in the hub switcher */
export const PERSONAS: { id: Exclude<import("./types").PersonaId, "custom">; name: string; role: string; userId: string | null; description: string }[] = [
  { id: "guest", name: "Guest", role: "Not signed in", userId: null, description: "Browses, searches and calls. Prompted to sign in to message or book." },
  { id: "tayo", name: "Tayo A.", role: "Customer · SE25", userId: "u-tayo", description: "3 past bookings, 1 upcoming with Swift Plumbing on Thu 29 Oct at 2pm." },
  { id: "sam", name: "Sam Okafor", role: "Owner · Swift Plumbing", userId: "u-sam", description: "Owns Swift Plumbing & Heating (desk live). Also a customer." },
  { id: "jo", name: "Jo Reid", role: "Staff · Swift Plumbing", userId: "u-jo", description: "Staff-only account: Today, Inbox and Diary, own jobs only." },
  { id: "ife", name: "Ife Bello", role: "Answerd admin", userId: "u-ife", description: "Full admin console access." },
  { id: "dan", name: "Dan Price", role: "Support agent", userId: "u-dan", description: "Read-only admin, can moderate reviews." },
  { id: "temitope", name: "Temitope A.", role: "Super admin · Vitalos", userId: "u-temitope", description: "Everything Admin can do, plus revenue, costs, roles, pricing rules, switches and integrations." },
]
