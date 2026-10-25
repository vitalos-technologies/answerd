import type { MetadataRoute } from "next"
import { SITE_URL } from "@/content/site"
import { LEGAL_NAV } from "@/content/legal"
import { AREAS, LEAF_CATEGORIES, categoryListings } from "@/lib/data/queries"
import { seed } from "@/lib/data/seed"

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()
  const page = (path: string, priority: number, changeFrequency: "weekly" | "monthly" | "yearly" = "weekly") => ({ url: `${SITE_URL}${path}`, lastModified, changeFrequency, priority })
  return [
    page("", 1),
    ...["/claim", "/billing", "/help", "/about", "/get-the-app"].map((p) => page(p, 0.6, "monthly")),
    ...LEAF_CATEGORIES.map((c) => page(`/${c.slug}`, 0.8)),
    // Category-in-area pages with at least one business (empty ones are noindex)
    ...LEAF_CATEGORIES.flatMap((c) => AREAS.filter((a) => categoryListings(c.id, a).length > 0).map((a) => page(`/${c.slug}/${a.slug}`, 0.7))),
    ...AREAS.map((a) => page(`/areas/${a.slug}`, 0.6)),
    ...seed().listings.map((l) => page(`/b/${l.slug}`, 0.5)),
    ...LEGAL_NAV.map((d) => page(d.href, 0.3, "yearly")),
  ]
}
