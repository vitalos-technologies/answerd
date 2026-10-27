// Structured data builders for the SEO and listing pages (ported from the prototype's components/web/data.ts).
import { SITE_URL } from "@/content/site"
import type { Faq } from "./queries"
import type { ListingView } from "./listing-view"

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

export function itemListLd(name: string, listings: { slug: string; name: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: listings.length,
    itemListElement: listings.map((l, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}/b/${l.slug}`, name: l.name })),
  }
}

export function localBusinessLd(v: ListingView) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${SITE_URL}/b/${v.slug}`,
    name: v.name,
    url: `${SITE_URL}/b/${v.slug}`,
    telephone: v.phonePublic,
    description: v.description || `${v.category.name} in ${v.locality || v.postcode}`,
    address: { "@type": "PostalAddress", streetAddress: v.street, addressLocality: v.locality, postalCode: v.postcode, addressCountry: "GB" },
    geo: { "@type": "GeoCoordinates", latitude: v.geo.lat, longitude: v.geo.lng },
    // Only ratings from Answerd's own reviews; Google ratings can't be marked up as ours
    ...(v.layer !== "places" && !v.rating.google && v.rating.count > 0 ? { aggregateRating: { "@type": "AggregateRating", ratingValue: v.rating.rating, reviewCount: v.rating.count, bestRating: 5 } } : {}),
  }
}
