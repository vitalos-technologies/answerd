import type { Category } from "./types"

type Leaf = [id: string, name: string, plural: string, icon: string, sic: string, osm: string, places: string]

const GROUPS: { id: string; name: string; icon: string; leaves: Leaf[] }[] = [
  {
    id: "home-trades",
    name: "Home trades",
    icon: "House",
    leaves: [
      ["plumbers", "Plumber", "Plumbers", "Wrench", "43220", "craft=plumber", "plumber"],
      ["electricians", "Electrician", "Electricians", "Zap", "43210", "craft=electrician", "electrician"],
      ["heating-engineers", "Heating engineer", "Heating engineers", "Flame", "43220", "craft=hvac", "plumber"],
      ["locksmiths", "Locksmith", "Locksmiths", "KeyRound", "80200", "craft=locksmith", "locksmith"],
      ["builders", "Builder", "Builders", "HardHat", "41202", "craft=builder", "general_contractor"],
      ["roofers", "Roofer", "Roofers", "House", "43910", "craft=roofer", "roofing_contractor"],
      ["painters-decorators", "Painter and decorator", "Painters and decorators", "PaintRoller", "43341", "craft=painter", "painter"],
      ["carpenters", "Carpenter", "Carpenters", "Hammer", "43320", "craft=carpenter", "general_contractor"],
      ["handymen", "Handyman", "Handymen", "Drill", "43390", "craft=handyman", "general_contractor"],
      ["plasterers", "Plasterer", "Plasterers", "Layers", "43310", "craft=plasterer", "general_contractor"],
    ],
  },
  {
    id: "cleaning-domestic",
    name: "Cleaning and domestic",
    icon: "Sparkles",
    leaves: [
      ["cleaners", "Cleaner", "Cleaners", "Sparkles", "81210", "office=cleaning", "house_cleaning_service"],
      ["end-of-tenancy-cleaners", "End of tenancy cleaner", "End of tenancy cleaners", "Building2", "81210", "office=cleaning", "house_cleaning_service"],
      ["carpet-cleaners", "Carpet cleaner", "Carpet cleaners", "Sofa", "81229", "shop=dry_cleaning", "house_cleaning_service"],
      ["window-cleaners", "Window cleaner", "Window cleaners", "AppWindow", "81221", "office=cleaning", "house_cleaning_service"],
      ["oven-cleaners", "Oven cleaner", "Oven cleaners", "CookingPot", "81229", "office=cleaning", "house_cleaning_service"],
      ["gardeners", "Gardener", "Gardeners", "Trees", "81300", "craft=gardener", "landscaper"],
    ],
  },
  {
    id: "auto-delivery",
    name: "Auto and delivery",
    icon: "Car",
    leaves: [
      ["mobile-mechanics", "Mobile mechanic", "Mobile mechanics", "Car", "45200", "shop=car_repair", "car_repair"],
      ["mot-garages", "MOT garage", "MOT garages", "ClipboardCheck", "71200", "shop=car_repair", "car_repair"],
      ["car-valeting", "Car valeter", "Car valeting", "Droplets", "45200", "amenity=car_wash", "car_wash"],
      ["couriers", "Courier", "Couriers", "Package", "53202", "office=courier", "courier_service"],
      ["man-and-van", "Man and van", "Man and van", "Truck", "49410", "office=moving_company", "moving_company"],
      ["removals", "Removals firm", "Removals", "Boxes", "49420", "office=moving_company", "moving_company"],
    ],
  },
  {
    id: "personal-beauty",
    name: "Personal and beauty",
    icon: "Scissors",
    leaves: [
      ["barbers", "Barber", "Barbers", "Scissors", "96020", "shop=hairdresser", "barber_shop"],
      ["hairdressers", "Hairdresser", "Hairdressers", "Brush", "96020", "shop=hairdresser", "hair_salon"],
      ["nail-technicians", "Nail technician", "Nail technicians", "Hand", "96020", "shop=beauty", "nail_salon"],
      ["beauty-therapists", "Beauty therapist", "Beauty therapists", "Flower2", "96020", "shop=beauty", "beauty_salon"],
      ["personal-trainers", "Personal trainer", "Personal trainers", "Dumbbell", "93130", "leisure=fitness_centre", "gym"],
    ],
  },
  {
    id: "everything-else",
    name: "Everything else",
    icon: "Store",
    leaves: [
      ["pest-control", "Pest controller", "Pest control", "Bug", "81291", "office=pest_control", "pest_control_service"],
      ["appliance-repair", "Appliance repairer", "Appliance repair", "WashingMachine", "95220", "craft=electronics_repair", "electrician"],
      ["computer-repair", "Computer repairer", "Computer repair", "Laptop", "95110", "craft=computer_repair", "electronics_store"],
      ["dog-walkers", "Dog walker", "Dog walkers", "Dog", "96090", "shop=pet_grooming", "pet_care"],
      ["tutors", "Tutor", "Tutors", "GraduationCap", "85590", "office=tutoring", "tutoring_service"],
    ],
  },
]

export const CATEGORIES: Category[] = GROUPS.flatMap((g) => [
  { id: g.id, name: g.name, plural: g.name, slug: g.id, parentId: null, icon: g.icon, sicCodes: [], osmTags: [], placesTypes: [] },
  ...g.leaves.map(([id, name, pl, icon, sic, osm, places]) => ({
    id,
    name,
    plural: pl,
    slug: id,
    parentId: g.id,
    icon,
    sicCodes: [sic],
    osmTags: [osm],
    placesTypes: [places],
  })),
])

export const CATEGORY_GROUPS = GROUPS.map((g) => ({ id: g.id, name: g.name, icon: g.icon }))
export const LEAF_CATEGORIES = CATEGORIES.filter((c) => c.parentId)

/** The 8 Home tiles before "All" */
export const HOME_CATEGORIES = ["plumbers", "electricians", "cleaners", "mobile-mechanics", "barbers", "locksmiths", "gardeners", "couriers"]

export function categoryById(id: string, cats: Category[] = CATEGORIES) {
  return cats.find((c) => c.id === id)
}
