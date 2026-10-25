// Deterministic mock data for the public site, ported from the prototype's createSeed() (lib/seed.ts) and
// trimmed to listings, businesses, services, hours, service areas, credentials, desks, reviews and the
// enquiries Answerd sent. The random calls run in the same order as the prototype, so names, ratings and
// review dates match it. Server-only: never import this from a client component.
import { DISTRICTS } from "./geo"
import { Rng } from "./prng"
import { DEMO_NOW, LAUNCH_DATE, addDays, addMinutes } from "./time"
import { initials, slugify } from "./format"
import type { Availability, Business, Credential, Desk, Enquiry, Listing, PriceType, Review, Service, ServiceArea } from "./types"

export interface SiteData {
  listings: Listing[]
  businesses: Business[]
  services: Service[]
  availability: Availability[]
  serviceAreas: ServiceArea[]
  credentials: Credential[]
  desks: Desk[]
  reviews: Review[]
  enquiries: Enquiry[]
}

const NOW = DEMO_NOW

const FIRST = ["Priya", "Mark", "Ola", "Leon", "Ben", "Chris", "Grace", "Daniel", "Aisha", "Tom", "Femi", "Hannah", "Kofi", "Sophie", "Raj", "Emma", "Jamal", "Lucy", "Nadia", "George", "Zara", "Sean", "Funmi", "Olivia", "Marcus", "Chloe", "Imran", "Rachel", "Dev", "Megan", "Tunde", "Ellie", "Kwesi", "Holly", "Amir", "Jess", "Bola", "Katie", "Yusuf", "Lauren"]
const LAST = ["Shah", "Thompson", "Bakare", "Hughes", "Clarke", "Patel", "Osei", "Morris", "Khan", "Walker", "Adebayo", "Green", "Mensah", "Turner", "Kaur", "Wright", "Ali", "Evans", "Begum", "Hall", "Ahmed", "Murphy", "Okoro", "Price", "Bennett", "Lewis", "Hussain", "Cooper", "Mistry", "Wood"]

function mobile(n: number) {
  return `07700 900${String(n).padStart(3, "0")}`
}
function landline(n: number) {
  return `020 7946 0${String(n).padStart(3, "0")}`
}
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

export function createSeed(): SiteData {
  const rng = new Rng(20261027)
  // The prototype's buildUsers(): 40 customers (each draws an auth provider and a marketing choice)
  const customers = Array.from({ length: 40 }, (_, i) => {
    rng.pick(["phone", "phone", "apple", "google"] as const)
    rng.chance(0.2)
    return { firstName: FIRST[i]!, lastName: LAST[i % LAST.length]! }
  })

  const listings: Listing[] = []
  const businesses: Business[] = []
  const services: Service[] = []
  const availability: Availability[] = []
  const serviceAreas: ServiceArea[] = []
  const credentials: Credential[] = []
  const desks: Desk[] = []
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
      verified: spec.layer === "claimed",
      googleRating: spec.google?.[0],
      googleCount: spec.google?.[1],
      replyMins: spec.replyMins ?? 240,
      initials: initials(spec.name),
      description: spec.description ?? "",
      createdAt: spec.layer === "places" ? "2026-09-19T00:00:00.000Z" : LAUNCH_DATE,
    }
    listings.push(listing)
    if (spec.layer !== "claimed") return

    const bizId = `biz-${slug}`
    listing.businessId = bizId
    businesses.push({
      id: bizId,
      listingId: id,
      legalType: idx % 3 === 0 ? "ltd" : "sole_trader",
      website: `${slug}.example`,
      yearFounded: 2010 + (idx % 12),
      bookingMode: spec.booking ?? "request",
    })

    let order = 0
    for (const cat of spec.cats) {
      for (const t of SERVICE_TEMPLATES[cat] ?? []) {
        services.push({ id: `s-${slug}-${slugify(t[0])}`, businessId: bizId, name: t[0], description: t[6], durationMin: t[1] || 60, priceType: t[2], pricePence: t[3], priceToPence: t[4], vatIncluded: true, bookable: t[5], order: order++ })
      }
    }
    if (slug === "swift-plumbing-heating") {
      services.push({ id: "s-swift-plumbing-heating-emergency-callout", businessId: bizId, name: "Emergency callout", description: "Leaks and no heating, same day where we can.", durationMin: 60, priceType: "from", pricePence: 12000, priceToPence: 16000, vatIncluded: true, bookable: false, order: order++ })
      services.push({ id: "s-swift-plumbing-heating-radiator-bleed-and-check", businessId: bizId, name: "Radiator bleed and check", description: "Bleed, balance and check every radiator.", durationMin: 60, priceType: "fixed", pricePence: 6500, vatIncluded: true, bookable: true, order: order++ })
    }

    const barber = spec.cats.includes("barbers") || spec.cats.includes("nail-technicians")
    availability.push({
      businessId: bizId,
      weeklyHours: Array.from({ length: 7 }, (_, day) => {
        if (barber) return { day, closed: day === 1, open: day === 0 ? "10:00" : "09:00", close: day === 0 ? "16:00" : "19:00" }
        if (day === 0) return { day, closed: true, open: "09:00", close: "17:00" }
        if (day === 6) return { day, closed: false, open: "09:00", close: "14:00" }
        return { day, closed: false, open: "08:00", close: "18:00" }
      }),
      holidays: slug === "addiscombe-decorators" ? [{ from: "2026-10-26", to: "2026-11-01", label: "Half-term break" }] : [],
    })
    serviceAreas.push({
      businessId: bizId,
      basePostcode: pc,
      radiusMiles: barber ? 2 : spec.district.startsWith("M") || spec.district.startsWith("B") ? 6 : 5,
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
        expiresAt: c.expires ?? (c.status === "pending" && c.type === "insurance" ? "2027-11-11T00:00:00.000Z" : undefined),
        status: c.status,
      })
    }
    const desk = spec.desk ?? "off"
    desks.push({ businessId: bizId, status: desk, number: desk === "off" ? "" : landline(700 + idx) })

    // Reviews (same draws as the prototype: day jitter, two aspect ratings on 4 and 5 stars, time of day)
    const n = spec.reviews ?? 0
    const texts = REVIEW_TEXTS[reviewGroup(spec.cats)]!
    const five = Math.round(n * (slug === "swift-plumbing-heating" ? 0.915 : 0.72))
    for (let r = 0; r < n; r++) {
      const isFlagged = slug === "swift-plumbing-heating" && r === n - 1
      const stars = isFlagged ? 1 : r < five ? 5 : r < n - 1 || slug === "swift-plumbing-heating" ? 4 : 3
      const cust = customers[(r * 7 + idx) % customers.length]!
      const daysAgo = Math.floor((r / n) * 50) + rng.int(0, 2)
      if (stars >= 4) {
        rng.int(4, 5)
        rng.int(4, 5)
      }
      const createdAt = addMinutes(addDays(NOW, -daysAgo - 1), -rng.int(60, 600))
      reviews.push({
        id: `r-${slug}-${r}`,
        listingId: id,
        authorName: `${cust.firstName} ${cust.lastName[0]}.`,
        stars,
        text: isFlagged ? "Never turned up and wouldn't answer. Avoid." : stars === 5 ? texts[(r + idx) % texts.length]! : OKAY_TEXTS[r % OKAY_TEXTS.length]!,
        reply: !isFlagged && r % 4 === 1 ? OWNER_REPLIES[r % OWNER_REPLIES.length]! + (slug === "swift-plumbing-heating" ? " Sam" : "") : undefined,
        createdAt,
      })
    }
  })

  // Tayo's own review of Sparkle Clean Co replaces its first review, as in the prototype
  const tayo = reviews.find((r) => r.listingId === "l-sparkle-clean-co")
  if (tayo) Object.assign(tayo, { authorName: "Tayo A.", stars: 5, text: "Our flat has never been this clean. Same cleaner every time and lovely with the cat.", createdAt: "2026-10-03T12:00:00.000Z" })

  // Enquiries: Swift has exactly 9 (one short of the monetise gate)
  const swift: [Enquiry["kind"], string][] = [
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
  for (const [kind, at] of swift) enquiries.push({ listingId: "l-swift-plumbing-heating", kind, at })
  for (const l of listings.filter((x) => x.layer === "claimed" && x.slug !== "swift-plumbing-heating")) {
    const count = l.slug === "sparkle-clean-co" ? 12 : rng.int(2, 8)
    for (let i = 0; i < count; i++) {
      const kind = rng.pick(["call", "message", "booking", "call"] as const)
      const day = addDays(NOW, -rng.int(1, 55))
      enquiries.push({ listingId: l.id, kind, at: addMinutes(day, -rng.int(0, 600) - i) })
    }
  }
  const nl = "l-norwood-locksmiths"
  for (const at of ["2026-10-02T21:10:00.000Z", "2026-10-06T08:05:00.000Z", "2026-10-11T19:40:00.000Z", "2026-10-17T23:15:00.000Z", "2026-10-21T07:30:00.000Z", "2026-10-25T18:00:00.000Z"]) enquiries.push({ listingId: nl, kind: "call", at })
  for (const l of listings.filter((x) => x.layer === "seeded" && x.id !== nl).slice(0, 8)) {
    // The prototype re-draws the bound on every pass; kept so the sequence matches.
    for (let i = 0; i < rng.int(1, 3); i++) enquiries.push({ listingId: l.id, kind: "call", at: addDays(NOW, -rng.int(2, 40)) })
  }

  return { listings, businesses, services, availability, serviceAreas, credentials, desks, reviews, enquiries }
}

let cached: SiteData | null = null
/** The mock data, built once per server process. */
export function seed(): SiteData {
  if (!cached) cached = createSeed()
  return cached
}
