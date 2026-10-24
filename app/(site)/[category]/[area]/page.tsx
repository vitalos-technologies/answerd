import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { MapPin } from "lucide-react"
import { ScreenMeta } from "@/components/shells/ScreenMeta"
import { AreaResults } from "@/components/web/AreaResults"
import { Breadcrumbs, Container, Faqs, JsonLd } from "@/components/web/ui"
import { AREAS, areaBySlug } from "@/lib/geo"
import { LEAF_CATEGORIES } from "@/lib/categories"
import { breadcrumbLd, categoryBySlug, categoryFaqs, categoryListings, faqLd, itemListLd, nearbyAreas, parentArea, priceGuide, priceText, rankForSeo, seed } from "@/components/web/data"

export function generateStaticParams() {
  return LEAF_CATEGORIES.flatMap((c) => AREAS.map((a) => ({ category: c.slug, area: a.slug })))
}

function load(category: string, area: string) {
  const cat = categoryBySlug(category)
  const a = areaBySlug(area)
  if (!cat || !a) return null
  return { cat, area: a, listings: rankForSeo(seed(), categoryListings(seed(), cat.id, a)) }
}

export async function generateMetadata({ params }: { params: Promise<{ category: string; area: string }> }): Promise<Metadata> {
  const { category, area } = await params
  const d = load(category, area)
  if (!d) return {}
  const n = d.listings.length
  const plural = d.cat.plural.toLowerCase()
  return {
    title: `${d.cat.plural} in ${d.area.name}`,
    description: n
      ? `Compare ${n} ${n === 1 ? d.cat.name.toLowerCase() : plural} in ${d.area.name} on Answerd. See prices, reviews and who responds instantly, then call, message or book.`
      : `Find ${plural} covering ${d.area.name} and nearby areas on Answerd. Call, message or book in two taps.`,
    alternates: { canonical: `/${d.cat.slug}/${d.area.slug}` },
  }
}

/** W-04: Category in area, e.g. /plumbers/croydon. */
export default async function Page({ params }: { params: Promise<{ category: string; area: string }> }) {
  const { category, area } = await params
  const d = load(category, area)
  if (!d) notFound()
  const { cat, area: a, listings } = d
  const s = seed()
  const parent = parentArea(a)
  const crumbs = [
    { name: "Home", href: "/" },
    { name: cat.plural, href: `/${cat.slug}` },
    ...(parent ? [{ name: `${cat.plural} in ${parent.name}`, href: `/${cat.slug}/${parent.slug}` }] : []),
    { name: `${cat.plural} in ${a.name}`, href: `/${cat.slug}/${a.slug}` },
  ]
  const faqs = categoryFaqs(cat, a)
  const prices = priceGuide(s, cat.id, a)
  const cityPrices = prices.length ? prices : priceGuide(s, cat.id)
  const nearby = nearbyAreas(a)
  const plural = cat.plural.toLowerCase()

  return (
    <>
      <ScreenMeta id="W-04" />
      <JsonLd data={[breadcrumbLd(crumbs), itemListLd(`${cat.plural} in ${a.name}`, listings), faqLd(faqs)]} />
      <div className="border-b border-line bg-white">
        <Container className="py-8 md:py-10">
          <Breadcrumbs items={crumbs} />
          <h1 className="t-display mt-4">
            {cat.plural} in {a.name}
          </h1>
          <p className="mt-2 max-w-2xl t-body text-slate">
            <span className="font-semibold text-navy tnum">
              {listings.length} {listings.length === 1 ? cat.name.toLowerCase() : plural}
            </span>{" "}
            on Answerd covering {a.districts.join(", ")}. Compare prices and reviews, and see who responds instantly.
          </p>
        </Container>
      </div>

      <Container className="grid gap-10 py-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="min-w-0" aria-label="Results">
          <AreaResults categoryId={cat.id} areaSlug={a.slug} />
        </section>
        <aside className="space-y-6">
          <section className="card p-5" aria-labelledby="avg-h">
            <h2 id="avg-h" className="t-subhead">
              Average prices
            </h2>
            {cityPrices.length ? (
              <>
                <p className="mt-1 t-caption text-muted-ink">{prices.length ? `Listed by ${plural} in ${a.name}.` : `Not enough listed in ${a.name} yet, so these are from ${plural} across Answerd.`}</p>
                <dl className="mt-3 divide-y divide-line">
                  {cityPrices.map((p) => (
                    <div key={p.name} className="flex items-start justify-between gap-3 py-2.5">
                      <dt className="t-label font-normal text-slate">{p.name}</dt>
                      <dd className="shrink-0 text-right t-label text-navy tnum">{priceText(p)}</dd>
                    </div>
                  ))}
                </dl>
              </>
            ) : (
              <p className="mt-2 t-label font-normal text-slate">No prices listed yet. Message a business for a quote.</p>
            )}
          </section>
          {nearby.length > 0 && (
            <section className="card p-5" aria-labelledby="nearby-h">
              <h2 id="nearby-h" className="t-subhead">
                Nearby areas
              </h2>
              <ul className="mt-2">
                {nearby.map((n) => (
                  <li key={n.slug}>
                    <Link href={`/${cat.slug}/${n.slug}`} className="flex min-h-11 items-center gap-2 t-label text-navy hover:text-blue">
                      <MapPin className="size-4 text-blue" aria-hidden /> {cat.plural} in {n.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <Link href={`/areas/${a.slug}`} className="flex min-h-11 items-center t-label text-blue hover:underline">
            All services in {a.name}
          </Link>
        </aside>
        <div className="lg:col-span-2">
          <Faqs faqs={faqs} />
        </div>
      </Container>
    </>
  )
}
