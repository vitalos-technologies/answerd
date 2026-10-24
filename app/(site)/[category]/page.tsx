import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronRight } from "lucide-react"
import { ScreenMeta } from "@/components/shells/ScreenMeta"
import { Icon } from "@/components/answerd/Icon"
import { CategoryTop } from "@/components/web/AreaResults"
import { Breadcrumbs, Container, Faqs, JsonLd, SectionHead } from "@/components/web/ui"
import { AREAS } from "@/lib/geo"
import { LEAF_CATEGORIES } from "@/lib/categories"
import { breadcrumbLd, categoryBySlug, categoryFaqs, categoryListings, childAreas, CITY_AREAS, faqLd, groupOf, priceGuide, priceText, seed } from "@/components/web/data"

export function generateStaticParams() {
  return LEAF_CATEGORIES.map((c) => ({ category: c.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params
  const cat = categoryBySlug(category)
  if (!cat) return {}
  const count = categoryListings(seed(), cat.id).length
  return {
    title: `${cat.plural} near you`,
    description: `Compare ${count} ${cat.plural.toLowerCase()} on Answerd across Croydon, Birmingham and Manchester. See prices, reviews and who responds instantly, then call, message or book.`,
    alternates: { canonical: `/${cat.slug}` },
  }
}

/** W-03: Category hub. */
export default async function Page({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params
  const cat = categoryBySlug(category)
  if (!cat) notFound()
  const s = seed()
  const group = groupOf(cat)
  const plural = cat.plural.toLowerCase()
  const prices = priceGuide(s, cat.id)
  const faqs = categoryFaqs(cat)
  const crumbs = [
    { name: "Home", href: "/" },
    { name: cat.plural, href: `/${cat.slug}` },
  ]
  const cities = CITY_AREAS.map((a) => ({ area: a, count: categoryListings(s, cat.id, a).length, children: childAreas(a).map((c) => ({ area: c, count: categoryListings(s, cat.id, c).length })) }))
  const related = LEAF_CATEGORIES.filter((c) => c.parentId === cat.parentId && c.id !== cat.id)

  return (
    <>
      <ScreenMeta id="W-03" />
      <JsonLd data={[breadcrumbLd(crumbs), faqLd(faqs)]} />
      <div className="border-b border-line bg-white">
        <Container className="py-8 md:py-12">
          <Breadcrumbs items={crumbs} />
          <div className="mt-4 flex items-start gap-4">
            <span className="inline-flex size-14 shrink-0 items-center justify-center rounded-2xl bg-blue-tint text-blue max-sm:hidden">
              <Icon name={cat.icon} size={28} />
            </span>
            <div className="min-w-0">
              <h1 className="t-display">{cat.plural}</h1>
              <p className="mt-2 max-w-2xl t-body text-slate">
                Find {plural} near you on Answerd. Compare prices and reviews, see who replies fastest, and call, message or book in two taps. {group ? `Part of ${group.name.toLowerCase()}.` : ""}
              </p>
            </div>
          </div>
        </Container>
      </div>

      <Container className="grid gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-12">
          <section aria-labelledby="cities-h">
            <SectionHead id="cities-h" title={`${cat.plural} by city`} sub="Choose your area to see who covers it." />
            <ul className="mt-5 grid gap-3 md:grid-cols-3">
              {cities.map(({ area, count, children }) => (
                <li key={area.slug} className="card p-4">
                  <Link href={`/${cat.slug}/${area.slug}`} className="group flex min-h-11 items-center justify-between gap-2">
                    <span>
                      <span className="block t-subhead group-hover:underline">
                        {cat.plural} in {area.name}
                      </span>
                      <span className="block t-caption text-muted-ink tnum">
                        {count} {count === 1 ? "business" : "businesses"}
                      </span>
                    </span>
                    <ChevronRight className="size-5 text-muted-ink" aria-hidden />
                  </Link>
                  <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                    {children.map((c) => (
                      <li key={c.area.slug}>
                        <Link href={`/${cat.slug}/${c.area.slug}`} className="inline-flex min-h-8 items-center t-caption text-blue hover:underline">
                          {c.area.name} <span className="ml-1 text-muted-ink tnum">({c.count})</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="featured-h">
            <SectionHead id="featured-h" title={`Featured ${plural}`} sub="Claimed businesses ranked like search: desk-enabled and verified first." />
            <div className="mt-5">
              <CategoryTop categoryId={cat.id} />
            </div>
          </section>

          <Faqs faqs={faqs} />
        </div>

        <aside className="space-y-6">
          <section className="card p-5" aria-labelledby="cost-h">
            <h2 id="cost-h" className="t-subhead">
              What it costs
            </h2>
            {prices.length ? (
              <>
                <p className="mt-1 t-caption text-muted-ink">Price ranges listed by {plural} on Answerd. Each business sets its own prices.</p>
                <dl className="mt-3 divide-y divide-line">
                  {prices.map((p) => (
                    <div key={p.name} className="flex items-start justify-between gap-3 py-2.5">
                      <dt className="t-label font-normal text-slate">{p.name}</dt>
                      <dd className="shrink-0 text-right t-label text-navy tnum">{priceText(p)}</dd>
                    </div>
                  ))}
                </dl>
              </>
            ) : (
              <p className="mt-2 t-label font-normal text-slate">No {plural} on Answerd have listed prices yet. Message a business for a quote.</p>
            )}
          </section>
          {related.length > 0 && (
            <section className="card p-5" aria-labelledby="related-h">
              <h2 id="related-h" className="t-subhead">
                Related services
              </h2>
              <ul className="mt-2">
                {related.map((c) => (
                  <li key={c.id}>
                    <Link href={`/${c.slug}`} className="flex min-h-11 items-center gap-2 t-label text-navy hover:text-blue">
                      <Icon name={c.icon} size={18} className="text-blue" /> {c.plural}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <p className="t-caption text-muted-ink">Areas covered: {AREAS.filter((a) => !a.parent).map((a) => a.name).join(", ")}.</p>
        </aside>
      </Container>
    </>
  )
}
