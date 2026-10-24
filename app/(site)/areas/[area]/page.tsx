import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { MapPin } from "lucide-react"
import { ScreenMeta } from "@/components/shells/ScreenMeta"
import { Icon } from "@/components/answerd/Icon"
import { Breadcrumbs, Container, Faqs, JsonLd } from "@/components/web/ui"
import { AREAS, areaBySlug } from "@/lib/geo"
import { CATEGORY_GROUPS, LEAF_CATEGORIES } from "@/lib/categories"
import { areaFaqs, breadcrumbLd, categoryListings, childAreas, faqLd, listingsInArea, nearbyAreas, parentArea, seed } from "@/components/web/data"

export function generateStaticParams() {
  return AREAS.map((a) => ({ area: a.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ area: string }> }): Promise<Metadata> {
  const { area } = await params
  const a = areaBySlug(area)
  if (!a) return {}
  const n = listingsInArea(seed(), a).length
  return {
    title: `Local services in ${a.name}`,
    description: `${n} local businesses in ${a.name} on Answerd: plumbers, electricians, cleaners, mechanics, barbers and more. Call, message or book in two taps.`,
    alternates: { canonical: `/areas/${a.slug}` },
  }
}

/** W-05: Area hub, e.g. /areas/croydon. */
export default async function Page({ params }: { params: Promise<{ area: string }> }) {
  const { area } = await params
  const a = areaBySlug(area)
  if (!a) notFound()
  const s = seed()
  const parent = parentArea(a)
  const crumbs = [{ name: "Home", href: "/" }, ...(parent ? [{ name: parent.name, href: `/areas/${parent.slug}` }] : []), { name: a.name, href: `/areas/${a.slug}` }]
  const total = listingsInArea(s, a).length
  const faqs = areaFaqs(a)
  const kids = childAreas(a)
  const nearby = nearbyAreas(a).filter((n) => !kids.some((k) => k.slug === n.slug))

  return (
    <>
      <ScreenMeta id="W-05" />
      <JsonLd data={[breadcrumbLd(crumbs), faqLd(faqs)]} />
      <div className="border-b border-line bg-white">
        <Container className="py-8 md:py-12">
          <Breadcrumbs items={crumbs} />
          <h1 className="t-display mt-4">Local services in {a.name}</h1>
          <p className="mt-2 max-w-2xl t-body text-slate">
            <span className="font-semibold text-navy tnum">{total} businesses</span> on Answerd in {a.districts.join(", ")}. Pick a service to compare who covers {a.name}.
          </p>
          {kids.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-2" aria-label={`Areas in ${a.name}`}>
              {kids.map((k) => (
                <li key={k.slug}>
                  <Link href={`/areas/${k.slug}`} className="inline-flex h-11 items-center gap-1.5 rounded-full border border-line bg-white px-4 t-label text-navy hover:border-blue">
                    <MapPin className="size-4 text-blue" aria-hidden /> {k.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Container>
      </div>
      <Container className="space-y-10 py-10">
        {CATEGORY_GROUPS.map((g) => {
          const cats = LEAF_CATEGORIES.filter((c) => c.parentId === g.id)
          return (
            <section key={g.id} aria-labelledby={`g-${g.id}`}>
              <h2 id={`g-${g.id}`} className="t-heading">
                {g.name}
              </h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {cats.map((c) => {
                  const n = categoryListings(s, c.id, a).length
                  return (
                    <li key={c.id}>
                      <Link href={`/${c.slug}/${a.slug}`} className="card group flex min-h-16 items-center gap-3 p-4 hover:border-blue/40">
                        <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-blue-tint text-blue">
                          <Icon name={c.icon} size={20} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block t-label text-navy group-hover:underline">
                            {c.plural} in {a.name}
                          </span>
                          <span className="block t-caption text-muted-ink tnum">{n ? `${n} ${n === 1 ? "business" : "businesses"}` : "Nearby areas covered"}</span>
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
        {nearby.length > 0 && (
          <section aria-labelledby="near-h">
            <h2 id="near-h" className="t-heading">
              Nearby areas
            </h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {nearby.map((n) => (
                <li key={n.slug}>
                  <Link href={`/areas/${n.slug}`} className="inline-flex h-11 items-center rounded-full border border-line bg-white px-4 t-label text-navy hover:border-blue">
                    {n.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        <Faqs faqs={faqs} />
      </Container>
    </>
  )
}
