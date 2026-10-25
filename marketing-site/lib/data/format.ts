// Formatting helpers ported from the prototype (lib/format.ts), trimmed to what the site uses.
import type { PriceType, Service } from "./types"

/** £85, £85.50 */
export function gbp(pence: number) {
  const pounds = pence / 100
  return `£${Number.isInteger(pounds) ? pounds.toLocaleString("en-GB") : pounds.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function priceLabel(s: Pick<Service, "priceType" | "pricePence">) {
  switch (s.priceType as PriceType) {
    case "fixed":
      return gbp(s.pricePence)
    case "from":
      return `From ${gbp(s.pricePence)}`
    case "hourly":
      return `${gbp(s.pricePence)}/hour`
    case "quote":
      return "Quote"
  }
}

/** "£85 inc VAT" / "From £60 ex VAT" / "Quote on request" */
export function priceWithVat(s: Pick<Service, "priceType" | "pricePence" | "vatIncluded">) {
  if (s.priceType === "quote") return "Quote on request"
  return `${priceLabel(s)} ${s.vatIncluded ? "inc VAT" : "ex VAT"}`
}

export function durationLabel(min: number) {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h} hr ${m} min` : `${h} hr${h > 1 ? "s" : ""}`
}

export function initials(name: string) {
  return name
    .replace(/&/g, " ")
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("")
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export function maskPhone(phone: string) {
  const d = phone.replace(/\s/g, "")
  return `${d.slice(0, 5)} •••${d.slice(-3)}`
}

export function isLandline(phone: string) {
  return /^0(1|2)/.test(phone.replace(/\s/g, ""))
}
