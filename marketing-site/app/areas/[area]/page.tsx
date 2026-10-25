import type { Metadata } from "next"
import { pageMeta } from "@/lib/seo"
import Link from "next/link"
import { notFound } from "next/navigation"
import { MapPin } from "lucide-react"
import { WebPage } from "@/components/web/page"
import { FaqList, JsonLd, PageHeader, SectionTitle } from "@/components/web/ui"
import { CategoryIcon } from "@/components/web/category-icon"
import { focusRing } from "@/components/site/focus"
import { breadcrumbLd, faqLd } from "@/lib/data/jsonld"
import { AREAS, CATEGORY_GROUPS, LEAF_CATEGORIES, areaBySlug, areaFaqs, categoryListings, childAreas, listingsInArea, nearbyAreas, parentArea } from "@/lib/data/queries"
import { fill } from "@/lib/fill"
import { pages } from "@/content/pages"

export const dynamicParams = false

export function generateStaticParams() {
  return AREAS.map((a) => ({ area: a.slug }))
}

export async function generateMetadata({ params }: PageProps<"/areas/[area]">): Promise<Metadata> {
  const a = areaBySlug((await params).area)
  if (!a) return {}
  const c = pages.area
  const title = fill(c.metaTitle, { area: a.name })
  const description = fill(c.metaDescription, { count: listingsInArea(a).length, area: a.name })
  return pageMeta({ title, description, path: `/areas/${a.slug}` })
}

/** W-05: area hub, e.g. /areas/croydon: every category in the area. */
export default async function AreaPage({ params }: PageProps<"/areas/[area]">) {
  const a = areaBySlug((await params).area)
  if (!a) notFound()
  const c = pages.area
  const parent = parentArea(a)
  const crumbs = [{ name: pages.common.home, href: "/" }, ...(parent ? [{ name: parent.name, href: `/areas/${parent.slug}` }] : []), { name: a.name, href: `/areas/${a.slug}` }]
  const total = listingsInArea(a).length
  const faqs = areaFaqs(a)
  const kids = childAreas(a)
  const nearby = nearbyAreas(a).filter((n) => !kids.some((k) => k.slug === n.slug))
  const chip = `inline-flex h-11 items-center gap-1.5 rounded-full border border-line bg-white px-4 text-[15px] font-medium text-navy hover:border-blue ${focusRing}`

  return (
    <WebPage>
      <JsonLd data={[breadcrumbLd(crumbs), faqLd(faqs)]} />
      <PageHeader crumbs={crumbs} title={fill(c.heading, { area: a.name })}>
        <p className="t-lead mt-4 max-w-[46rem]">
          <span className="tnum font-semibold text-navy">
            {total} {total === 1 ? pages.common.businessesOne : pages.common.businessesMany}
          </span>{" "}
          {fill(c.intro, { districts: a.districts.join(", "), area: a.name })}
        </p>
        {kids.length > 0 && (
          <ul className="mt-6 flex flex-wrap gap-2" aria-label={fill(c.areasIn, { area: a.name })}>
            {kids.map((k) => (
              <li key={k.slug}>
                <Link href={`/areas/${k.slug}`} className={chip}>
                  <MapPin className="size-4 text-blue" aria-hidden /> {k.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PageHeader>

      <div className="container-site flex flex-col gap-14 py-12 md:py-16">
        {CATEGORY_GROUPS.map((g) => (
          <section key={g.id} aria-labelledby={`g-${g.id}`}>
            <SectionTitle id={`g-${g.id}`} title={g.name} />
            <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {LEAF_CATEGORIES.filter((x) => x.parentId === g.id).map((x) => {
                const n = categoryListings(x.id, a).length
                return (
                  <li key={x.id}>
                    <Link href={`/${x.slug}/${a.slug}`} className={`card-site group flex min-h-[72px] items-center gap-3 p-4 transition-colors hover:border-blue/40 ${focusRing}`}>
                      <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-full bg-blue-tint text-blue">
                        <CategoryIcon name={x.icon} className="size-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] leading-6 font-semibold text-navy group-hover:underline">{fill(pages.category.inArea, { plural: x.plural, area: a.name })}</span>
                        <span className="tnum block text-[14px] leading-5 text-muted-ink">{n ? `${n} ${n === 1 ? pages.common.businessesOne : pages.common.businessesMany}` : c.nearbyCovered}</span>
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
        {nearby.length > 0 && (
          <section aria-labelledby="near-h">
            <SectionTitle id="near-h" title={c.nearbyHeading} />
            <ul className="mt-5 flex flex-wrap gap-2">
              {nearby.map((n) => (
                <li key={n.slug}>
                  <Link href={`/areas/${n.slug}`} className={chip}>
                    {n.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        <FaqList faqs={faqs} />
      </div>
    </WebPage>
  )
}
