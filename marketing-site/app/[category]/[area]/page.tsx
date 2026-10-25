import type { Metadata } from "next"
import { pageMeta } from "@/lib/seo"
import Link from "next/link"
import { notFound } from "next/navigation"
import { MapPin } from "lucide-react"
import { WebPage } from "@/components/web/page"
import { FaqList, JsonLd, PageHeader, SectionTitle } from "@/components/web/ui"
import { ResultCard } from "@/components/web/result-card"
import { ResultFilters } from "@/components/web/result-filters"
import { focusRing } from "@/components/site/focus"
import { breadcrumbLd, faqLd, itemListLd } from "@/lib/data/jsonld"
import { AREAS, LEAF_CATEGORIES, areaBySlug, cardData, categoryFaqs, categoryListings, nearbyAreas, parentArea, priceGuide, priceText, rank } from "@/lib/data/queries"
import { categoryBySlug } from "@/lib/data/categories"
import { fill } from "@/lib/fill"
import { pages } from "@/content/pages"

export const dynamicParams = false

export function generateStaticParams() {
  return LEAF_CATEGORIES.flatMap((c) => AREAS.map((a) => ({ category: c.slug, area: a.slug })))
}

function load(category: string, area: string) {
  const cat = categoryBySlug(category)
  const a = areaBySlug(area)
  if (!cat || !a) return null
  return { cat, area: a, listings: rank(categoryListings(cat.id, a)) }
}

export async function generateMetadata({ params }: PageProps<"/[category]/[area]">): Promise<Metadata> {
  const { category, area } = await params
  const d = load(category, area)
  if (!d) return {}
  const c = pages.categoryArea
  const n = d.listings.length
  const plural = d.cat.plural.toLowerCase()
  const title = fill(c.metaTitle, { plural: d.cat.plural, area: d.area.name })
  const description = n ? fill(c.metaDescription, { count: n, plural: n === 1 ? d.cat.name.toLowerCase() : plural, area: d.area.name }) : fill(c.metaDescriptionEmpty, { plural, area: d.area.name })
  // Areas with nobody in them yet stay out of search indexes (thin pages) but still work for visitors.
  return pageMeta({ title, description, path: `/${d.cat.slug}/${d.area.slug}`, noindex: !n })
}

/** W-04: category in area, e.g. /plumbers/croydon. Thin areas also list businesses covering nearby areas. */
export default async function CategoryAreaPage({ params }: PageProps<"/[category]/[area]">) {
  const { category, area } = await params
  const d = load(category, area)
  if (!d) notFound()
  const { cat, area: a, listings } = d
  const c = pages.categoryArea
  const plural = cat.plural.toLowerCase()
  const parent = parentArea(a)
  const crumbs = [
    { name: pages.common.home, href: "/" },
    { name: cat.plural, href: `/${cat.slug}` },
    ...(parent ? [{ name: fill(pages.category.inArea, { plural: cat.plural, area: parent.name }), href: `/${cat.slug}/${parent.slug}` }] : []),
    { name: fill(pages.category.inArea, { plural: cat.plural, area: a.name }), href: `/${cat.slug}/${a.slug}` },
  ]
  const faqs = categoryFaqs(cat, a)
  const local = priceGuide(cat.id, a)
  const prices = local.length ? local : priceGuide(cat.id)
  const nearby = nearbyAreas(a)
  const thin = listings.length < 3
  const near = thin
    ? nearby
        .flatMap((n) => rank(categoryListings(cat.id, n)).map((l) => ({ l, n })))
        .filter((x, i, all) => !listings.some((l) => l.id === x.l.id) && all.findIndex((y) => y.l.id === x.l.id) === i)
        .slice(0, 6)
    : []
  const cards = listings.map(cardData)
  const countLabel = `${listings.length} ${listings.length === 1 ? cat.name.toLowerCase() : plural}`

  return (
    <WebPage>
      <JsonLd data={[breadcrumbLd(crumbs), itemListLd(fill(pages.category.inArea, { plural: cat.plural, area: a.name }), listings), faqLd(faqs)]} />
      <PageHeader crumbs={crumbs} title={fill(pages.category.inArea, { plural: cat.plural, area: a.name })}>
        <p className="t-lead mt-4 max-w-[46rem]">
          <span className="tnum font-semibold text-navy">{countLabel}</span> {fill(c.count, { districts: a.districts.join(", ") })}
        </p>
      </PageHeader>

      <div className="container-site grid gap-12 py-10 md:py-14 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-14">
        <section className="min-w-0" aria-label={fill(pages.category.inArea, { plural: cat.plural, area: a.name })}>
          {cards.length > 0 && (
            <>
              <ResultFilters listId="area-results" labels={c.filters} label={c.filtersLabel} showing={c.showing} none={c.noneMatch} />
              <ul id="area-results" data-results="" className="mt-2 grid gap-4">
                {cards.map((card) => (
                  <li key={card.slug} className="min-w-0" data-instant={card.desk || undefined} data-verified={card.badges.includes("verified") || undefined} data-rated={card.count > 0 && card.rating >= 4 ? "" : undefined}>
                    <ResultCard c={card} headingLevel="h2" />
                  </li>
                ))}
              </ul>
            </>
          )}
          {near.length > 0 && (
            <section className={cards.length ? "mt-12" : ""} aria-labelledby="nearby-res-h">
              <SectionTitle id="nearby-res-h" title={cards.length ? c.nearbyResults : fill(c.nearbyResultsEmpty, { area: a.name })} />
              <ul className="mt-5 grid gap-4">
                {near.map(({ l, n }) => (
                  <li key={l.id} className="min-w-0">
                    <p className="mb-1.5 text-[14px] leading-5 text-muted-ink">
                      {c.inPlace}{" "}
                      <Link href={`/${cat.slug}/${n.slug}`} className={`rounded-sm font-medium text-blue hover:underline ${focusRing}`}>
                        {n.name}
                      </Link>
                    </p>
                    <ResultCard c={cardData(l)} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </section>

        <aside className="flex flex-col gap-6">
          <section className="card-site p-6" aria-labelledby="avg-h">
            <h2 id="avg-h" className="t-card-title">
              {c.avgHeading}
            </h2>
            {prices.length ? (
              <>
                <p className="mt-1 text-[14px] leading-5 text-muted-ink">{local.length ? fill(c.avgLocal, { plural, area: a.name }) : fill(c.avgWider, { plural, area: a.name })}</p>
                <dl className="mt-3 divide-y divide-line">
                  {prices.map((p) => (
                    <div key={p.name} className="flex items-start justify-between gap-3 py-3 text-[15px] leading-6">
                      <dt className="text-slate">{p.name}</dt>
                      <dd className="tnum shrink-0 text-right font-medium text-navy">{priceText(p)}</dd>
                    </div>
                  ))}
                </dl>
              </>
            ) : (
              <p className="mt-2 text-[15px] leading-6 text-slate">{c.avgEmpty}</p>
            )}
          </section>
          {nearby.length > 0 && (
            <section className="card-site p-6" aria-labelledby="nearby-h">
              <h2 id="nearby-h" className="t-card-title">
                {c.nearbyHeading}
              </h2>
              <ul className="mt-2">
                {nearby.map((n) => (
                  <li key={n.slug}>
                    <Link href={`/${cat.slug}/${n.slug}`} className={`flex min-h-11 items-center gap-2 rounded-lg text-[15px] font-medium text-navy hover:text-blue ${focusRing}`}>
                      <MapPin className="size-4 shrink-0 text-blue" aria-hidden /> {fill(pages.category.inArea, { plural: cat.plural, area: n.name })}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <Link href={`/areas/${a.slug}`} className={`inline-flex min-h-11 items-center self-start rounded-sm text-[15px] font-semibold text-blue hover:underline ${focusRing}`}>
            {fill(c.allInArea, { area: a.name })}
          </Link>
        </aside>

        <div className="lg:col-span-2">
          <FaqList faqs={faqs} />
        </div>
      </div>
    </WebPage>
  )
}
