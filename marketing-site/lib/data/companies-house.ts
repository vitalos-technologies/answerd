// Mock Companies House officer lookup for the director check (B-06). No network calls.

export interface Officer {
  name: string
  role: "director" | "secretary"
  born: string // MM/YYYY
}

export interface Company {
  number: string
  name: string
  status: "active" | "dissolved"
  officers: Officer[]
}

export const COMPANIES: Company[] = [
  { number: "09876543", name: "Swift Plumbing & Heating Ltd", status: "active", officers: [{ name: "Samuel Okafor", role: "director", born: "03/1985" }, { name: "Grace Okafor", role: "secretary", born: "08/1987" }] },
  { number: "11223344", name: "Norwood Locksmiths Ltd", status: "active", officers: [{ name: "Graham Pike", role: "director", born: "07/1971" }] },
  { number: "12345678", name: "Fauward Couriers Ltd", status: "active", officers: [{ name: "Fola Adewale", role: "director", born: "11/1988" }, { name: "Tunde Bakare", role: "director", born: "02/1990" }] },
]

const norm = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, " ").replace(/\b(ltd|limited)\b/g, "").trim()

export function findCompany(nameOrNumber: string): Company | undefined {
  const n = norm(nameOrNumber)
  return COMPANIES.find((c) => c.number === nameOrNumber.trim() || norm(c.name) === n || norm(c.name).startsWith(n) || n.startsWith(norm(c.name)))
}

/** Matches a director by full name (first name may be shortened, e.g. Sam for Samuel) and month/year of birth. */
export function matchDirector(company: Company | undefined, fullName: string, born: string): Officer | null {
  if (!company) return null
  const [first = "", ...rest] = norm(fullName).split(" ")
  const last = rest.at(-1) ?? ""
  return (
    company.officers.find((o) => {
      if (o.role !== "director" || o.born !== born.trim()) return false
      const [of = "", ...or] = norm(o.name).split(" ")
      return or.at(-1) === last && (of === first || of.startsWith(first) || first.startsWith(of.slice(0, 3)))
    }) ?? null
  )
}
