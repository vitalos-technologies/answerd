// Structured data builders for the SEO and listing pages (ported from the prototype's components/web/data.ts).
import { SITE_URL } from "@/content/site"
import { listingRating, primaryCategory, type Faq } from "./queries"
import type { Listing } from "./types"

export function breadcrumbLd(items: { name: string; href: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: `${SITE_URL}${it.href === "/" ? "" : it.href}` })),
  }
}

export function faqLd(faqs: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  }
}

export function itemListLd(name: string, listings: Listing[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: listings.length,
    itemListElement: listings.map((l, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}/b/${l.slug}`, name: l.name })),
  }
}

export function localBusinessLd(l: Listing) {
  const cat = primaryCategory(l)
  const r = listingRating(l)
  const [street, locality] = l.address.split(", ")
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${SITE_URL}/b/${l.slug}`,
    name: l.name,
    url: `${SITE_URL}/b/${l.slug}`,
    telephone: l.phonePublic,
    description: l.description || `${cat.name} in ${locality ?? l.postcodeDistrict}`,
    address: { "@type": "PostalAddress", streetAddress: street, addressLocality: locality, postalCode: l.postcode, addressCountry: "GB" },
    geo: { "@type": "GeoCoordinates", latitude: l.geo.lat, longitude: l.geo.lng },
    // Only ratings from Answerd's own reviews; Google ratings can't be marked up as ours
    ...(l.layer !== "places" && r.count > 0 ? { aggregateRating: { "@type": "AggregateRating", ratingValue: r.rating, reviewCount: r.count, bestRating: 5 } } : {}),
  }
}
