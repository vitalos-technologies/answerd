// Phrase → category table shared by search (C-11, C-12) and Ask Answerd (Q-02).
// Longer phrases are matched first.

export interface KeywordRule {
  phrase: string
  categories: string[]
  urgent?: boolean
  followUp?: "leak"
}

export const KEYWORDS: KeywordRule[] = [
  // Plumbing and heating
  { phrase: "boiler", categories: ["heating-engineers", "plumbers"] },
  { phrase: "boiler service", categories: ["heating-engineers", "plumbers"] },
  { phrase: "boiler not working", categories: ["heating-engineers", "plumbers"], urgent: true },
  { phrase: "no heating", categories: ["heating-engineers", "plumbers"], urgent: true },
  { phrase: "no hot water", categories: ["heating-engineers", "plumbers"], urgent: true },
  { phrase: "radiator", categories: ["heating-engineers", "plumbers"] },
  { phrase: "central heating", categories: ["heating-engineers", "plumbers"] },
  { phrase: "banging noise", categories: ["heating-engineers", "plumbers"] },
  { phrase: "leak", categories: ["plumbers"], followUp: "leak" },
  { phrase: "leaking", categories: ["plumbers"], followUp: "leak" },
  { phrase: "dripping", categories: ["plumbers"] },
  { phrase: "tap", categories: ["plumbers"] },
  { phrase: "toilet", categories: ["plumbers"] },
  { phrase: "blocked drain", categories: ["plumbers"] },
  { phrase: "blocked sink", categories: ["plumbers"] },
  { phrase: "shower", categories: ["plumbers"] },
  { phrase: "burst pipe", categories: ["plumbers"], urgent: true },
  { phrase: "pipe", categories: ["plumbers"] },
  { phrase: "plumber", categories: ["plumbers"] },
  { phrase: "plumbing", categories: ["plumbers"] },
  { phrase: "gas safe", categories: ["heating-engineers", "plumbers"] },
  // Electrical
  { phrase: "fuse", categories: ["electricians"] },
  { phrase: "fuse box", categories: ["electricians"] },
  { phrase: "rewire", categories: ["electricians"] },
  { phrase: "socket", categories: ["electricians"] },
  { phrase: "light fitting", categories: ["electricians"] },
  { phrase: "lights keep tripping", categories: ["electricians"], urgent: true },
  { phrase: "tripping", categories: ["electricians"] },
  { phrase: "eicr", categories: ["electricians"] },
  { phrase: "ev charger", categories: ["electricians"] },
  { phrase: "electrician", categories: ["electricians"] },
  { phrase: "electrics", categories: ["electricians"] },
  // Locks and building
  { phrase: "locked out", categories: ["locksmiths"], urgent: true },
  { phrase: "lock", categories: ["locksmiths"] },
  { phrase: "locksmith", categories: ["locksmiths"] },
  { phrase: "lost keys", categories: ["locksmiths"], urgent: true },
  { phrase: "extension", categories: ["builders"] },
  { phrase: "builder", categories: ["builders"] },
  { phrase: "roof", categories: ["roofers"] },
  { phrase: "gutter", categories: ["roofers"] },
  { phrase: "paint", categories: ["painters-decorators"] },
  { phrase: "decorating", categories: ["painters-decorators"] },
  { phrase: "wallpaper", categories: ["painters-decorators"] },
  { phrase: "shelves", categories: ["handymen", "carpenters"] },
  { phrase: "flat pack", categories: ["handymen"] },
  { phrase: "odd jobs", categories: ["handymen"] },
  { phrase: "handyman", categories: ["handymen"] },
  { phrase: "door", categories: ["carpenters", "handymen"] },
  { phrase: "plaster", categories: ["plasterers"] },
  // Cleaning and domestic
  { phrase: "deep clean", categories: ["cleaners"] },
  { phrase: "end of tenancy", categories: ["end-of-tenancy-cleaners", "cleaners"] },
  { phrase: "moving out clean", categories: ["end-of-tenancy-cleaners", "cleaners"] },
  { phrase: "regular clean", categories: ["cleaners"] },
  { phrase: "cleaner", categories: ["cleaners"] },
  { phrase: "cleaning", categories: ["cleaners"] },
  { phrase: "oven clean", categories: ["oven-cleaners", "cleaners"] },
  { phrase: "oven", categories: ["oven-cleaners"] },
  { phrase: "carpet", categories: ["carpet-cleaners"] },
  { phrase: "windows", categories: ["window-cleaners"] },
  { phrase: "window cleaner", categories: ["window-cleaners"] },
  { phrase: "garden", categories: ["gardeners"] },
  { phrase: "lawn", categories: ["gardeners"] },
  { phrase: "hedge", categories: ["gardeners"] },
  { phrase: "gardener", categories: ["gardeners"] },
  // Auto and delivery
  { phrase: "mot", categories: ["mot-garages", "mobile-mechanics"] },
  { phrase: "car won't start", categories: ["mobile-mechanics"], urgent: true },
  { phrase: "car wont start", categories: ["mobile-mechanics"], urgent: true },
  { phrase: "battery flat", categories: ["mobile-mechanics"], urgent: true },
  { phrase: "flat battery", categories: ["mobile-mechanics"], urgent: true },
  { phrase: "puncture", categories: ["mobile-mechanics"] },
  { phrase: "brakes", categories: ["mobile-mechanics"] },
  { phrase: "car service", categories: ["mobile-mechanics", "mot-garages"] },
  { phrase: "mechanic", categories: ["mobile-mechanics"] },
  { phrase: "valet", categories: ["car-valeting"] },
  { phrase: "car wash", categories: ["car-valeting"] },
  { phrase: "parcel", categories: ["couriers"] },
  { phrase: "same day delivery", categories: ["couriers"] },
  { phrase: "courier", categories: ["couriers"] },
  { phrase: "delivery", categories: ["couriers"] },
  { phrase: "man and van", categories: ["man-and-van"] },
  { phrase: "man with a van", categories: ["man-and-van"] },
  { phrase: "moving house", categories: ["removals", "man-and-van"] },
  { phrase: "removals", categories: ["removals"] },
  // Personal and beauty
  { phrase: "skin fade", categories: ["barbers"] },
  { phrase: "haircut", categories: ["barbers", "hairdressers"] },
  { phrase: "beard", categories: ["barbers"] },
  { phrase: "barber", categories: ["barbers"] },
  { phrase: "hairdresser", categories: ["hairdressers"] },
  { phrase: "braids", categories: ["hairdressers"] },
  { phrase: "nails", categories: ["nail-technicians"] },
  { phrase: "gel nails", categories: ["nail-technicians"] },
  { phrase: "lashes", categories: ["beauty-therapists"] },
  { phrase: "facial", categories: ["beauty-therapists"] },
  { phrase: "personal trainer", categories: ["personal-trainers"] },
  // Everything else
  { phrase: "mice", categories: ["pest-control"] },
  { phrase: "rats", categories: ["pest-control"] },
  { phrase: "wasps", categories: ["pest-control"] },
  { phrase: "pest", categories: ["pest-control"] },
  { phrase: "washing machine", categories: ["appliance-repair"] },
  { phrase: "fridge", categories: ["appliance-repair"] },
  { phrase: "laptop", categories: ["computer-repair"] },
  { phrase: "dog walker", categories: ["dog-walkers"] },
  { phrase: "tutor", categories: ["tutors"] },
]

/** Emergency phrases handled by D-09 / Q-05. */
export const EMERGENCIES: { phrase: string; kind: "gas" | "life" | "power" | "flood" }[] = [
  { phrase: "smell gas", kind: "gas" },
  { phrase: "smell of gas", kind: "gas" },
  { phrase: "gas leak", kind: "gas" },
  { phrase: "gas smell", kind: "gas" },
  { phrase: "carbon monoxide", kind: "gas" },
  { phrase: "co alarm", kind: "gas" },
  { phrase: "sparks", kind: "life" },
  { phrase: "electric shock", kind: "life" },
  { phrase: "fire", kind: "life" },
  { phrase: "smoke", kind: "life" },
  { phrase: "unconscious", kind: "life" },
  { phrase: "power cut", kind: "power" },
  { phrase: "flooding", kind: "flood" },
  { phrase: "flooded", kind: "flood" },
]

export function matchKeywords(text: string): KeywordRule[] {
  const t = ` ${text.toLowerCase().replace(/[^a-z0-9' ]/g, " ")} `
  return [...KEYWORDS]
    .sort((a, b) => b.phrase.length - a.phrase.length)
    .filter((k) => t.includes(` ${k.phrase}`) || t.includes(`${k.phrase} `))
}

export function categoriesForText(text: string): string[] {
  const out: string[] = []
  for (const rule of matchKeywords(text)) for (const c of rule.categories) if (!out.includes(c)) out.push(c)
  return out
}

export function emergencyIn(text: string) {
  const t = text.toLowerCase()
  return EMERGENCIES.find((e) => t.includes(e.phrase))?.kind ?? null
}
