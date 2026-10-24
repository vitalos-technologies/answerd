// Mock geography: postcodes, areas and distances. No map provider in the prototype.

export interface Postcode {
  postcode: string
  district: string
  label: string
  lat: number
  lng: number
}

export const POSTCODES: Postcode[] = [
  { postcode: "SE25 4AA", district: "SE25", label: "South Norwood", lat: 51.3978, lng: -0.0742 },
  { postcode: "SE25 4XE", district: "SE25", label: "South Norwood", lat: 51.3952, lng: -0.0789 },
  { postcode: "SE25 5BN", district: "SE25", label: "South Norwood", lat: 51.4012, lng: -0.0701 },
  { postcode: "SE25 5QQ", district: "SE25", label: "South Norwood", lat: 51.3996, lng: -0.0668 },
  { postcode: "SE25 6EP", district: "SE25", label: "Woodside", lat: 51.3901, lng: -0.0712 },
  { postcode: "SE25 6RS", district: "SE25", label: "Selhurst", lat: 51.3925, lng: -0.0855 },
  { postcode: "SE19 1QX", district: "SE19", label: "Upper Norwood", lat: 51.4155, lng: -0.0905 },
  { postcode: "SE19 2AT", district: "SE19", label: "Crystal Palace", lat: 51.4195, lng: -0.0772 },
  { postcode: "SE19 2HG", district: "SE19", label: "Crystal Palace", lat: 51.4212, lng: -0.0821 },
  { postcode: "SE19 3NP", district: "SE19", label: "Upper Norwood", lat: 51.4146, lng: -0.0838 },
  { postcode: "CR0 1NX", district: "CR0", label: "Croydon", lat: 51.3746, lng: -0.0982 },
  { postcode: "CR0 2RB", district: "CR0", label: "Broad Green", lat: 51.3851, lng: -0.1072 },
  { postcode: "CR0 3EE", district: "CR0", label: "Thornton Heath", lat: 51.3889, lng: -0.1018 },
  { postcode: "CR0 6JS", district: "CR0", label: "Addiscombe", lat: 51.3798, lng: -0.0728 },
  { postcode: "CR0 7AA", district: "CR0", label: "Shirley", lat: 51.3735, lng: -0.0555 },
  { postcode: "B1 1AA", district: "B1", label: "Birmingham city centre", lat: 52.4797, lng: -1.9086 },
  { postcode: "B5 4BU", district: "B5", label: "Digbeth", lat: 52.474, lng: -1.889 },
  { postcode: "B12 0YA", district: "B12", label: "Balsall Heath", lat: 52.465, lng: -1.885 },
  { postcode: "B13 9HE", district: "B13", label: "Moseley", lat: 52.444, lng: -1.885 },
  { postcode: "B15 2TT", district: "B15", label: "Edgbaston", lat: 52.46, lng: -1.93 },
  { postcode: "M1 1AE", district: "M1", label: "Manchester city centre", lat: 53.479, lng: -2.237 },
  { postcode: "M4 1HN", district: "M4", label: "Northern Quarter", lat: 53.484, lng: -2.23 },
  { postcode: "M14 6HR", district: "M14", label: "Fallowfield", lat: 53.444, lng: -2.22 },
  { postcode: "M20 2RN", district: "M20", label: "Didsbury", lat: 53.417, lng: -2.231 },
  { postcode: "M21 9AS", district: "M21", label: "Chorlton", lat: 53.44, lng: -2.277 },
  { postcode: "EC2A 4BX", district: "EC2", label: "Shoreditch", lat: 51.523, lng: -0.08 },
  { postcode: "EC2M 7PY", district: "EC2", label: "Liverpool Street", lat: 51.5175, lng: -0.0823 },
  { postcode: "SE20 7EU", district: "SE20", label: "Penge", lat: 51.4115, lng: -0.0565 },
  { postcode: "SE27 9QF", district: "SE27", label: "West Norwood", lat: 51.4315, lng: -0.1025 },
  { postcode: "CR7 8LE", district: "CR7", label: "Thornton Heath", lat: 51.3985, lng: -0.1065 },
  { postcode: "BR3 1HT", district: "BR3", label: "Beckenham", lat: 51.4055, lng: -0.0305 },
]

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
  city: "london" | "birmingham" | "manchester"
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

export function normalisePostcode(input: string) {
  const s = input.toUpperCase().replace(/\s+/g, "")
  if (s.length > 4) return `${s.slice(0, -3)} ${s.slice(-3)}`
  return s
}

/** Mock lookup: full postcode, or outward code (district). */
export function lookupPostcode(input: string): Postcode | null {
  const pc = normalisePostcode(input)
  if (!pc) return null
  const exact = POSTCODES.find((p) => p.postcode === pc)
  if (exact) return exact
  const outward = pc.split(" ")[0]!
  const d = DISTRICTS[outward]
  if (d && (pc === outward || /^[0-9][A-Z]{2}$/.test(pc.split(" ")[1] ?? ""))) {
    return { postcode: pc, district: outward, label: d.label, lat: d.lat, lng: d.lng }
  }
  return null
}

export function districtOf(postcode: string) {
  return normalisePostcode(postcode).split(" ")[0]!
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
