import type { Metadata } from "next"
import { pageMeta } from "@/lib/seo"
import Link from "next/link"
import { notFound } from "next/navigation"
import { WebPage } from "@/components/web/page"
import { FaqList, JsonLd, PageHeader, SectionTitle } from "@/components/web/ui"
import { ResultCard } from "@/components/web/result-card"
import { CategoryIcon } from "@/components/web/category-icon"
import { SpriteIcon } from "@/components/web/sprite"
import { focusRing } from "@/components/site/focus"
import { breadcrumbLd, faqLd } from "@/lib/data/jsonld"
import { CITY_AREAS, LEAF_CATEGORIES, cardData, categoryFaqs, categoryListings, childAreas, priceGuide, priceText, rank } from "@/lib/data/queries"
import { categoryBySlug } from "@/lib/data/categories"
import { fill } from "@/lib/fill"
import { pages } from "@/content/pages"

export const dynamicParams = false

export function generateStaticParams() {
  return LEAF_CATEGORIES.map((c) => ({ category: c.slug }))
}

export async function generateMetadata({ params }: PageProps<"/[category]">): Promise<Metadata> {
  const cat = categoryBySlug((await params).category)
  if (!cat) return {}
  const c = pages.category
  const title = fill(c.metaTitle, { plural: cat.plural })
  const description = fill(c.metaDescription, { count: categoryListings(cat.id).length, plural: cat.plural.toLowerCase() })
  return pageMeta({ title, description, path: `/${cat.slug}` })
}

/** W-03: category hub, e.g. /plumbers. */
export default async function CategoryPage({ params }: PageProps<"/[category]">) {
  const cat = categoryBySlug((await params).category)
  if (!cat) notFound()
  const c = pages.category
  const plural = cat.plural.toLowerCase()
  const crumbs = [
    { name: pages.common.home, href: "/" },
    { name: cat.plural, href: `/${cat.slug}` },
  ]
  const faqs = categoryFaqs(cat)
  const prices = priceGuide(cat.id)
  const cities = CITY_AREAS.map((a) => ({ area: a, count: categoryListings(cat.id, a).length, children: childAreas(a).map((k) => ({ area: k, count: categoryListings(cat.id, k).length })) }))
  const top = rank(categoryListings(cat.id).filter((l) => l.layer === "claimed")).slice(0, 4).map(cardData)
  const related = LEAF_CATEGORIES.filter((x) => x.parentId === cat.parentId && x.id !== cat.id)
  const count = (n: number) => `${n} ${n === 1 ? pages.common.businessesOne : pages.common.businessesMany}`

  return (
    <WebPage>
      <JsonLd data={[breadcrumbLd(crumbs), faqLd(faqs)]} />
      <PageHeader
        crumbs={crumbs}
        title={
          <span className="flex items-center gap-4">
            <span aria-hidden className="hidden size-14 shrink-0 place-items-center rounded-2xl bg-blue-tint text-blue sm:grid">
              <CategoryIcon name={cat.icon} className="size-7" />
            </span>
            {cat.plural}
          </span>
        }
      >
        <p className="t-lead mt-4 max-w-[46rem]">{fill(c.intro, { plural })}</p>
      </PageHeader>

      <div className="container-site grid gap-12 py-12 md:py-16 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-14">
        <div className="flex min-w-0 flex-col gap-14">
          <section aria-labelledby="cities-h">
            <SectionTitle id="cities-h" title={fill(c.citiesHeading, { plural: cat.plural })} intro={c.citiesIntro} />
            <ul className="mt-5 grid gap-4 md:grid-cols-3">
              {cities.map(({ area, count: n, children }) => (
                <li key={area.slug} className="card-site p-5">
                  <Link href={`/${cat.slug}/${area.slug}`} className={`group flex min-h-11 items-center justify-between gap-2 rounded-lg ${focusRing}`}>
                    <span>
                      <span className="block text-[17px] leading-6 font-semibold text-navy group-hover:underline">{fill(c.inArea, { plural: cat.plural, area: area.name })}</span>
                      <span className="tnum block text-[14px] leading-5 text-muted-ink">{count(n)}</span>
                    </span>
                    <SpriteIcon id="chevron" className="size-5 shrink-0 text-muted-ink" />
                  </Link>
                  <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
                    {children.map((k) => (
                      <li key={k.area.slug}>
                        <Link href={`/${cat.slug}/${k.area.slug}`} className={`inline-flex min-h-8 items-center rounded-sm text-[14px] leading-5 font-medium text-blue hover:underline ${focusRing}`}>
                          {k.area.name}
                          <span className="tnum ml-1 font-normal text-muted-ink">({k.count})</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="top-h">
            <SectionTitle id="top-h" title={fill(c.topHeading, { plural })} intro={c.topIntro} />
            {top.length ? (
              <ul className="mt-5 grid gap-4 md:grid-cols-2">
                {top.map((card) => (
                  <li key={card.slug} className="min-w-0">
                    <ResultCard c={card} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-5 rounded-2xl border border-line bg-white p-5 text-slate">{fill(c.topEmpty, { plural })}</p>
            )}
          </section>

          <FaqList faqs={faqs} />
        </div>

        <aside className="flex flex-col gap-6">
          <section className="card-site p-6" aria-labelledby="cost-h">
            <h2 id="cost-h" className="t-card-title">
              {c.costHeading}
            </h2>
            {prices.length ? (
              <>
                <p className="mt-1 text-[14px] leading-5 text-muted-ink">{fill(c.costIntro, { plural })}</p>
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
              <p className="mt-2 text-[15px] leading-6 text-slate">{fill(c.costEmpty, { plural })}</p>
            )}
          </section>
          {related.length > 0 && (
            <section className="card-site p-6" aria-labelledby="related-h">
              <h2 id="related-h" className="t-card-title">
                {c.relatedHeading}
              </h2>
              <ul className="mt-2">
                {related.map((x) => (
                  <li key={x.id}>
                    <Link href={`/${x.slug}`} className={`flex min-h-11 items-center gap-2.5 rounded-lg text-[15px] font-medium text-navy hover:text-blue ${focusRing}`}>
                      <CategoryIcon name={x.icon} className="size-[18px] text-blue" /> {x.plural}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </WebPage>
  )
}
