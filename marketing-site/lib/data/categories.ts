// Category taxonomy, ported from the prototype (lib/categories.ts) without the import-source columns.
import type { Category } from "./types"

type Leaf = [id: string, name: string, plural: string, icon: string]

const GROUPS: { id: string; name: string; icon: string; leaves: Leaf[] }[] = [
  {
    id: "home-trades",
    name: "Home trades",
    icon: "House",
    leaves: [
      ["plumbers", "Plumber", "Plumbers", "Wrench"],
      ["electricians", "Electrician", "Electricians", "Zap"],
      ["heating-engineers", "Heating engineer", "Heating engineers", "Flame"],
      ["locksmiths", "Locksmith", "Locksmiths", "KeyRound"],
      ["builders", "Builder", "Builders", "HardHat"],
      ["roofers", "Roofer", "Roofers", "House"],
      ["painters-decorators", "Painter and decorator", "Painters and decorators", "PaintRoller"],
      ["carpenters", "Carpenter", "Carpenters", "Hammer"],
      ["handymen", "Handyman", "Handymen", "Drill"],
      ["plasterers", "Plasterer", "Plasterers", "Layers"],
    ],
  },
  {
    id: "cleaning-domestic",
    name: "Cleaning and domestic",
    icon: "Sparkles",
    leaves: [
      ["cleaners", "Cleaner", "Cleaners", "Sparkles"],
      ["end-of-tenancy-cleaners", "End of tenancy cleaner", "End of tenancy cleaners", "Building2"],
      ["carpet-cleaners", "Carpet cleaner", "Carpet cleaners", "Sofa"],
      ["window-cleaners", "Window cleaner", "Window cleaners", "AppWindow"],
      ["oven-cleaners", "Oven cleaner", "Oven cleaners", "CookingPot"],
      ["gardeners", "Gardener", "Gardeners", "Trees"],
    ],
  },
  {
    id: "auto-delivery",
    name: "Auto and delivery",
    icon: "Car",
    leaves: [
      ["mobile-mechanics", "Mobile mechanic", "Mobile mechanics", "Car"],
      ["mot-garages", "MOT garage", "MOT garages", "ClipboardCheck"],
      ["car-valeting", "Car valeter", "Car valeting", "Droplets"],
      ["couriers", "Courier", "Couriers", "Package"],
      ["man-and-van", "Man and van", "Man and van", "Truck"],
      ["removals", "Removals firm", "Removals", "Boxes"],
    ],
  },
  {
    id: "personal-beauty",
    name: "Personal and beauty",
    icon: "Scissors",
    leaves: [
      ["barbers", "Barber", "Barbers", "Scissors"],
      ["hairdressers", "Hairdresser", "Hairdressers", "Brush"],
      ["nail-technicians", "Nail technician", "Nail technicians", "Hand"],
      ["beauty-therapists", "Beauty therapist", "Beauty therapists", "Flower2"],
      ["personal-trainers", "Personal trainer", "Personal trainers", "Dumbbell"],
    ],
  },
  {
    id: "everything-else",
    name: "Everything else",
    icon: "Store",
    leaves: [
      ["pest-control", "Pest controller", "Pest control", "Bug"],
      ["appliance-repair", "Appliance repairer", "Appliance repair", "WashingMachine"],
      ["computer-repair", "Computer repairer", "Computer repair", "Laptop"],
      ["dog-walkers", "Dog walker", "Dog walkers", "Dog"],
      ["tutors", "Tutor", "Tutors", "GraduationCap"],
    ],
  },
]

export const CATEGORIES: Category[] = GROUPS.flatMap((g) => [
  { id: g.id, name: g.name, plural: g.name, slug: g.id, parentId: null, icon: g.icon },
  ...g.leaves.map(([id, name, pl, icon]) => ({ id, name, plural: pl, slug: id, parentId: g.id, icon })),
])

export const CATEGORY_GROUPS = GROUPS.map((g) => ({ id: g.id, name: g.name, icon: g.icon }))
export const LEAF_CATEGORIES = CATEGORIES.filter((c) => c.parentId)


export function categoryById(id: string) {
  return CATEGORIES.find((c) => c.id === id)
}

export function categoryBySlug(slug: string) {
  return LEAF_CATEGORIES.find((c) => c.slug === slug)
}
