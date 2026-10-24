import type { PriceType, Service } from "./types"

/** £85, £85.50 */
export function gbp(pence: number) {
  const pounds = pence / 100
  return `£${Number.isInteger(pounds) ? pounds.toLocaleString("en-GB") : pounds.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function priceLabel(s: Pick<Service, "priceType" | "pricePence" | "priceToPence">) {
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
export function priceWithVat(s: Pick<Service, "priceType" | "pricePence" | "priceToPence" | "vatIncluded">) {
  if (s.priceType === "quote") return "Quote on request"
  return `${priceLabel(s)} ${s.vatIncluded ? "inc VAT" : "ex VAT"}`
}

/** Range the desk may quote: "£80 to £120" */
export function priceRange(s: Pick<Service, "priceType" | "pricePence" | "priceToPence" | "vatIncluded">) {
  if (s.priceType === "quote") return "a quote after a look at the job"
  const vat = s.vatIncluded ? "including VAT" : "plus VAT"
  if (s.priceType === "fixed") return `${gbp(s.pricePence)} ${vat}`
  if (s.priceType === "hourly") return `${gbp(s.pricePence)} an hour ${vat}`
  if (s.priceToPence) return `${gbp(s.pricePence)} to ${gbp(s.priceToPence)} ${vat}`
  return `from ${gbp(s.pricePence)} ${vat}`
}

export function durationLabel(min: number) {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h} hr ${m} min` : `${h} hr${h > 1 ? "s" : ""}`
}

export function plural(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`
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

/** Normalise a UK mobile in any common format to "07700 900123", or null. */
export function normaliseUkMobile(input: string) {
  let d = input.replace(/[^\d+]/g, "")
  if (d.startsWith("+44")) d = "0" + d.slice(3)
  else if (d.startsWith("0044")) d = "0" + d.slice(4)
  else if (d.startsWith("44") && d.length === 12) d = "0" + d.slice(2)
  else if (d.startsWith("7") && d.length === 10) d = "0" + d
  if (!/^07\d{9}$/.test(d)) return null
  return `${d.slice(0, 5)} ${d.slice(5)}`
}

export function maskPhone(phone: string) {
  const d = phone.replace(/\s/g, "")
  return `${d.slice(0, 5)} •••${d.slice(-3)}`
}

export function isLandline(phone: string) {
  return /^0(1|2)/.test(phone.replace(/\s/g, ""))
}
