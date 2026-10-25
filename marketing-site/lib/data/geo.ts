import type { City } from "./types"

// Mock geography ported from the prototype (lib/geo.ts): districts, areas and distances. No map provider.

/** District centroids, used when only an outward code is typed. */
export const DISTRICTS: Record<string, { label: string; lat: number; lng: number }> = {
  SE25: { label: "South Norwood", lat: 51.3975, lng: -0.0745 },
  SE19: { label: "Upper Norwood", lat: 51.4185, lng: -0.0855 },
  SE20: { label: "Penge", lat: 51.4115, lng: -0.0565 },
  SE27: { label: "West Norwood", lat: 51.4315, lng: -0.1025 },
  CR0: { label: "Croydon", lat: 51.3765, lng: -0.0985 },
  CR7: { label: "Thornton Heath", lat: 51.3985, lng: -0.1065 },
  BR3: { label: "Beckenham", lat: 51.4055, lng: -0.0305 },
  B1: { label: "Birmingham city centre", lat: 52.4797, lng: -1.9086 },
  B5: { label: "Digbeth", lat: 52.474, lng: -1.889 },
  B12: { label: "Balsall Heath", lat: 52.465, lng: -1.885 },
  B13: { label: "Moseley", lat: 52.444, lng: -1.885 },
  B15: { label: "Edgbaston", lat: 52.46, lng: -1.93 },
  M1: { label: "Manchester city centre", lat: 53.479, lng: -2.237 },
  M4: { label: "Northern Quarter", lat: 53.484, lng: -2.23 },
  M14: { label: "Fallowfield", lat: 53.444, lng: -2.22 },
  M20: { label: "Didsbury", lat: 53.417, lng: -2.231 },
  M21: { label: "Chorlton", lat: 53.44, lng: -2.277 },
  EC2: { label: "City of London", lat: 51.52, lng: -0.081 },
}

export interface Area {
  slug: string
  name: string
  city: City
  districts: string[]
  parent?: string
  neighbours: string[]
}

export const AREAS: Area[] = [
  { slug: "croydon", name: "Croydon", city: "london", districts: ["CR0", "SE25", "SE19"], neighbours: ["south-norwood", "upper-norwood"] },
  { slug: "south-norwood", name: "South Norwood", city: "london", districts: ["SE25"], parent: "croydon", neighbours: ["upper-norwood", "croydon-town"] },
  { slug: "upper-norwood", name: "Upper Norwood", city: "london", districts: ["SE19"], parent: "croydon", neighbours: ["south-norwood", "croydon-town"] },
  { slug: "croydon-town", name: "Croydon town centre", city: "london", districts: ["CR0"], parent: "croydon", neighbours: ["south-norwood", "upper-norwood"] },
  { slug: "birmingham", name: "Birmingham", city: "birmingham", districts: ["B1", "B5", "B12", "B13", "B15"], neighbours: [] },
  { slug: "digbeth", name: "Digbeth", city: "birmingham", districts: ["B5", "B12"], parent: "birmingham", neighbours: ["birmingham-city-centre", "moseley"] },
  { slug: "birmingham-city-centre", name: "Birmingham city centre", city: "birmingham", districts: ["B1"], parent: "birmingham", neighbours: ["digbeth", "edgbaston"] },
  { slug: "moseley", name: "Moseley", city: "birmingham", districts: ["B13"], parent: "birmingham", neighbours: ["digbeth", "edgbaston"] },
  { slug: "edgbaston", name: "Edgbaston", city: "birmingham", districts: ["B15"], parent: "birmingham", neighbours: ["birmingham-city-centre", "moseley"] },
  { slug: "manchester", name: "Manchester", city: "manchester", districts: ["M1", "M4", "M14", "M20", "M21"], neighbours: [] },
  { slug: "manchester-city-centre", name: "Manchester city centre", city: "manchester", districts: ["M1", "M4"], parent: "manchester", neighbours: ["fallowfield", "chorlton"] },
  { slug: "fallowfield", name: "Fallowfield", city: "manchester", districts: ["M14"], parent: "manchester", neighbours: ["didsbury", "chorlton"] },
  { slug: "didsbury", name: "Didsbury", city: "manchester", districts: ["M20"], parent: "manchester", neighbours: ["fallowfield", "chorlton"] },
  { slug: "chorlton", name: "Chorlton", city: "manchester", districts: ["M21"], parent: "manchester", neighbours: ["didsbury", "fallowfield"] },
]

export function areaBySlug(slug: string) {
  return AREAS.find((a) => a.slug === slug)
}

export function milesBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 3958.8
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export function fmtMiles(mi: number) {
  if (mi < 0.1) return "0.1 mi"
  return mi < 10 ? `${mi.toFixed(1)} mi` : `${Math.round(mi)} mi`
}
