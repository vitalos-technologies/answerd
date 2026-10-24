import type { Metadata } from "next"
import { ListingView } from "@/components/web/listing/ListingView"
import { JsonLd } from "@/components/web/ui"
import { breadcrumbLd, localBusinessLd, seed } from "@/components/web/data"
import { areaBySlug } from "@/lib/geo"
import { listingBySlug } from "@/lib/selectors"

export function generateStaticParams() {
  return seed().listings.map((l) => ({ slug: l.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const s = seed()
  const l = listingBySlug(s, slug)
  if (!l) return { title: "Business", alternates: { canonical: `/b/${slug}` } }
  const cat = s.categories.find((c) => c.id === l.categoryIds[0])
  const where = areaBySlug(l.area)?.name ?? l.postcodeDistrict
  return {
    title: `${l.name}, ${cat?.name ?? "local business"} in ${where}`,
    description:
      l.layer === "claimed"
        ? `${l.name} on Answerd: ${cat?.name.toLowerCase() ?? "local business"} in ${where}. See prices, reviews and credentials, then call, message or book.`
        : `${l.name}, ${cat?.name.toLowerCase() ?? "local business"} in ${where}. Address, phone and how to get in touch on Answerd.`,
    alternates: { canonical: `/b/${l.slug}` },
    openGraph: { title: l.name, url: `/b/${l.slug}`, siteName: "Answerd", type: "website" },
  }
}

/** W-06 (claimed) and W-07 (unclaimed). Structured data comes from the seed; the page body reads the live store. */
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const s = seed()
  const l = listingBySlug(s, slug)
  const cat = l ? s.categories.find((c) => c.id === l.categoryIds[0]) : undefined
  const area = l ? areaBySlug(l.area) : undefined
  return (
    <>
      {l && (
        <JsonLd
          data={[
            localBusinessLd(s, l),
            breadcrumbLd([
              { name: "Home", href: "/" },
              ...(cat ? [{ name: cat.plural, href: `/${cat.slug}` }] : []),
              ...(cat && area ? [{ name: `${cat.plural} in ${area.name}`, href: `/${cat.slug}/${area.slug}` }] : []),
              { name: l.name, href: `/b/${l.slug}` },
            ]),
          ]}
        />
      )}
      <ListingView slug={slug} />
    </>
  )
}
