import type { Metadata } from "next"
import { pageMeta } from "@/lib/seo"
import Link from "next/link"
import { notFound } from "next/navigation"
import { BadgeCheck, CalendarOff, Clock, Globe, MapPin, Phone, Store } from "lucide-react"
import { WebPage } from "@/components/web/page"
import { Avatar, Breadcrumbs, JsonLd, Rating, toneClasses } from "@/components/web/ui"
import { Badge, BadgeRow } from "@/components/web/result-card"
import { CategoryIcon } from "@/components/web/category-icon"
import { SpriteIcon } from "@/components/web/sprite"
import { ListingActions, type ListingActionsProps } from "@/components/web/listing-actions"
import { GetAppButton } from "@/components/site/get-app"
import { QrCode } from "@/components/site/qr-code"
import { focusRing } from "@/components/site/focus"
import { breadcrumbLd, localBusinessLd } from "@/lib/data/jsonld"
import {
  areaBySlug,
  availabilityFor,
  businessFor,
  isDeskLive,
  listingBadges,
  listingBySlug,
  listingRating,
  primaryCategory,
  replyLine,
  reviewsFor,
  serviceAreaFor,
  servicesFor,
  toneFor,
  trackedNumber,
  verifiedCredentials,
} from "@/lib/data/queries"
import { seed } from "@/lib/data/seed"
import { durationLabel, priceWithVat } from "@/lib/data/format"
import { DEMO_NOW, addDays, fmtClock, fmtDate, fmtDayMonth } from "@/lib/data/time"
import { fill } from "@/lib/fill"
import { cn } from "@/lib/utils"
import { pages } from "@/content/pages"
import { APP_STORE_URL, PLAY_STORE_URL, listingUrl } from "@/content/site"

export const dynamicParams = false

export function generateStaticParams() {
  return seed().listings.map((l) => ({ slug: l.slug }))
}

export async function generateMetadata({ params }: PageProps<"/b/[slug]">): Promise<Metadata> {
  const l = listingBySlug((await params).slug)
  if (!l) return {}
  const c = pages.listing
  const cat = primaryCategory(l)
  const where = areaBySlug(l.area)?.name ?? l.postcodeDistrict
  const values = { name: l.name, category: cat.name.toLowerCase(), area: where }
  const title = fill(c.metaTitle, values)
  const description = fill(l.layer === "claimed" ? c.metaClaimed : c.metaUnclaimed, values)
  return pageMeta({ title, description, path: `/b/${l.slug}` })
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="card-site scroll-mt-24 p-5 md:p-7">
      <h2 id={`${id}-h`} className="t-card-title mb-4">
        {title}
      </h2>
      {children}
    </section>
  )
}

/** W-06 (claimed) and W-07 (unclaimed) share /b/[slug]: two columns with a sticky contact card. */
export default async function ListingPage({ params }: PageProps<"/b/[slug]">) {
  const l = listingBySlug((await params).slug)
  if (!l) notFound()
  const c = pages.listing
  const cat = primaryCategory(l)
  const tone = toneFor(cat)
  const area = areaBySlug(l.area)
  const crumbs = [
    { name: pages.common.home, href: "/" },
    { name: cat.plural, href: `/${cat.slug}` },
    ...(area ? [{ name: fill(pages.category.inArea, { plural: cat.plural, area: area.name }), href: `/${cat.slug}/${area.slug}` }] : []),
    { name: l.name, href: `/b/${l.slug}` },
  ]
  const r = listingRating(l)
  const desk = isDeskLive(l)
  const claimed = l.layer === "claimed"
  const services = servicesFor(l)
  const bookable = services.some((s) => s.bookable)
  const actions: Omit<ListingActionsProps, "variant"> = {
    name: l.name,
    number: trackedNumber(l),
    desk,
    claimed,
    bookable,
    appUrl: listingUrl(l.slug),
    qr: <QrCode size={168} url={listingUrl(l.slug)} label={fill(c.continueDialog.scan, { name: l.name })} />,
    appStoreUrl: APP_STORE_URL,
    playStoreUrl: PLAY_STORE_URL,
    labels: { call: c.call, message: c.message, book: c.book },
    copy: { call: c.callDialog, cont: c.continueDialog },
  }

  const header = (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
      <Avatar initials={l.initials} tone={tone} size={72} className="border-4 border-white shadow-card" />
      <div className="min-w-0 flex-1">
        <h1 className="text-[28px] leading-[34px] font-bold tracking-[-0.02em] break-words md:text-[34px] md:leading-[42px]">{l.name}</h1>
        <p className="mt-1 text-[15px] leading-6 text-slate">
          {cat.name} · {l.address.split(", ").at(-1)}
        </p>
        <Rating rating={r.rating} count={r.count} google={r.google} className="mt-1.5" />
        <BadgeRow kinds={listingBadges(l)} max={8} className="mt-3" />
      </div>
    </div>
  )

  // ---------------------------------------------------------------- W-07 unclaimed
  if (!claimed) {
    const u = c.unclaimed
    const claimHref = `/claim?listing=${l.slug}`
    return (
      <WebPage>
        <JsonLd data={[localBusinessLd(l), breadcrumbLd(crumbs)]} />
        <div className="container-site pt-4 pb-16 md:pt-6 md:pb-24">
          <Breadcrumbs items={crumbs} />
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
            <div className="flex min-w-0 flex-col gap-6">
              <div className="card-site p-5 md:p-7">
                {header}
                <ul className="mt-5 flex flex-col gap-2 text-[15px] leading-6 text-slate">
                  <li className="flex items-start gap-2">
                    <MapPin className="mt-1 size-4 shrink-0 text-muted-ink" aria-hidden /> {l.address}, {l.postcode}
                  </li>
                  <li className="flex items-start gap-2">
                    <Phone className="mt-1 size-4 shrink-0 text-muted-ink" aria-hidden /> {c.callVia}
                  </li>
                </ul>
              </div>
              <div className="rounded-2xl border-2 border-blue bg-blue-tint p-5 md:p-7">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-full bg-white text-blue">
                    <Store className="size-6" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="t-card-title">{u.claimHeading}</h2>
                    <p className="mt-1 text-[15px] leading-6 text-slate">{u.claimBody}</p>
                  </div>
                  <Link href={claimHref} className={`inline-flex h-12 shrink-0 items-center justify-center rounded-full border border-blue bg-white px-6 font-semibold text-navy hover:bg-blue hover:text-white ${focusRing}`}>
                    {u.claim}
                  </Link>
                </div>
              </div>
            </div>
            <aside className="max-lg:hidden">
              <div className="card-site sticky top-24 p-6">
                <p className="text-[17px] leading-6 font-semibold text-navy">{u.heading}</p>
                <p className="mt-1 text-[15px] leading-6 text-slate">{u.body}</p>
                <div className="mt-5">
                  <ListingActions {...actions} variant="card" />
                </div>
              </div>
            </aside>
          </div>
        </div>
        <div data-listing-bar="" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] supports-backdrop-filter:backdrop-blur-xl lg:hidden">
          <div className="mx-auto max-w-[720px]">
            <ListingActions {...actions} variant="bar" />
          </div>
        </div>
      </WebPage>
    )
  }

  // ---------------------------------------------------------------- W-06 claimed
  const biz = businessFor(l)!
  const reviews = reviewsFor(l)
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, count: reviews.filter((x) => x.stars === n).length }))
  const creds = verifiedCredentials(l)
  const sa = serviceAreaFor(l)
  const avail = availabilityFor(l)
  const today = DEMO_NOW.slice(0, 10)
  const holiday = avail?.holidays.find((h) => today >= h.from && today <= h.to)

  return (
    <WebPage>
      <JsonLd data={[localBusinessLd(l), breadcrumbLd(crumbs)]} />
      {/* No cover photo in the mock data: a 120 px band with the category's own icon */}
      <div aria-hidden className={cn("flex h-[120px] items-center justify-center", toneClasses(tone))}>
        <CategoryIcon name={cat.icon} className="size-10 opacity-80" strokeWidth={1.6} />
      </div>
      <div className="container-site pb-16 md:pb-24">
        <div className="card-site relative -mt-8 p-5 md:p-7">
          <Breadcrumbs items={crumbs} className="mb-4" />
          {header}
          {holiday && (
            <p className="mt-5 flex items-start gap-2 rounded-xl bg-amber-tint p-4 text-[15px] leading-6 text-navy">
              <CalendarOff className="mt-0.5 size-5 shrink-0 text-amber-ink" aria-hidden />
              {fill(c.away, { label: holiday.label, date: fmtDate(addDays(`${holiday.to}T12:00:00.000Z`, 1)) })}
            </p>
          )}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
          <div className="flex min-w-0 flex-col gap-6">
            <Section id="about" title={c.sections.about}>
              <p className="text-slate">{l.description || c.noDescription}</p>
              <ul className="mt-4 grid gap-2 text-[15px] leading-6 text-slate sm:grid-cols-2">
                <li className="flex items-start gap-2">
                  <MapPin className="mt-1 size-4 shrink-0 text-muted-ink" aria-hidden /> {l.address}, {l.postcode}
                </li>
                <li className="flex items-start gap-2">
                  <Phone className="mt-1 size-4 shrink-0 text-muted-ink" aria-hidden /> {c.callVia}
                </li>
                <li className="flex items-start gap-2">
                  <Globe className="mt-1 size-4 shrink-0 text-muted-ink" aria-hidden /> {biz.website}
                </li>
                {biz.yearFounded && (
                  <li className="flex items-start gap-2">
                    <BadgeCheck className="mt-1 size-4 shrink-0 text-muted-ink" aria-hidden /> {fill(c.tradingSince, { year: biz.yearFounded })}
                  </li>
                )}
              </ul>
            </Section>

            <Section id="services" title={c.sections.services}>
              {services.length ? (
                <ul className="divide-y divide-line">
                  {services.map((s) => (
                    <li key={s.id} className="flex flex-wrap items-start gap-x-4 gap-y-1 py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-navy">{s.name}</p>
                        {s.description && <p className="text-[15px] leading-6 text-slate">{s.description}</p>}
                        <p className="text-[14px] leading-5 text-muted-ink">
                          {s.priceType === "quote" ? c.priceAfterVisit : durationLabel(s.durationMin)}
                          {!s.bookable && ` · ${c.messageToArrange}`}
                        </p>
                      </div>
                      <p className="tnum shrink-0 text-right font-semibold text-navy">{priceWithVat(s)}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate">{c.noServices}</p>
              )}
            </Section>

            <Section id="reviews" title={c.sections.reviews}>
              {reviews.length ? (
                <>
                  <div className="grid gap-5 sm:grid-cols-[150px_1fr]">
                    <div>
                      <p className="tnum text-[40px] leading-none font-bold text-navy">{r.rating.toFixed(1)}</p>
                      <p className="tnum mt-2 text-[14px] leading-5 text-muted-ink">{fill(c.reviewsCount, { count: r.count })}</p>
                    </div>
                    <dl className="flex flex-col gap-1.5">
                      {dist.map(({ n, count }) => (
                        <div key={n} className="flex items-center gap-2">
                          <dt className="tnum w-14 shrink-0 text-[14px] leading-5 text-navy">{fill(c.starRow, { n })}</dt>
                          <dd className="flex flex-1 items-center gap-2">
                            <span aria-hidden className="h-2 flex-1 overflow-hidden rounded-full bg-sky">
                              <span className="block h-full rounded-full bg-amber" style={{ width: `${(count / reviews.length) * 100}%` }} />
                            </span>
                            <span className="tnum w-8 text-right text-[14px] leading-5 text-muted-ink">{count}</span>
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                  <ul className="mt-6 flex flex-col">
                    {reviews.slice(0, 5).map((rv) => (
                      <li key={rv.id} className="border-t border-line py-5 last:pb-0">
                        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px]">
                          <span className="inline-flex items-center gap-1 font-semibold text-navy">
                            <SpriteIcon id="star" className="size-4 text-amber" />
                            <span className="tnum">{rv.stars}</span>
                            <span className="sr-only">{c.outOf5}</span>
                          </span>
                          <span className="font-semibold text-navy">{rv.authorName}</span>
                          <span className="text-muted-ink">· {fmtDayMonth(rv.createdAt)}</span>
                        </p>
                        <p className="mt-1 text-slate">{rv.text}</p>
                        {rv.reply && (
                          <p className="mt-2 rounded-xl bg-sky px-4 py-2.5 text-[15px] leading-6 text-slate">
                            <span className="font-semibold text-navy">{fill(c.replyFrom, { name: l.name })}</span> {rv.reply}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                  {reviews.length > 5 && <GetAppButton variant="secondary" size="sm" label={fill(c.moreReviews, { count: reviews.length })} className="mt-5 whitespace-normal" />}
                </>
              ) : (
                <p className="text-slate">{pages.common.noReviews}</p>
              )}
            </Section>

            <Section id="credentials" title={c.sections.credentials}>
              {creds.length ? (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {creds.map((cr) => (
                    <li key={cr.id} className="flex items-start gap-3 rounded-xl border border-line p-4">
                      <SpriteIcon id="shield" className="mt-0.5 size-5 shrink-0 text-teal-ink" />
                      <div className="min-w-0">
                        <p className="font-semibold text-navy">{cr.label}</p>
                        <p className="text-[14px] leading-5 text-muted-ink">
                          {c.credsChecked}
                          {cr.number ? ` · ${cr.number}` : ""}
                          {cr.expiresAt ? ` · ${fill(c.credsValidTo, { date: fmtDate(cr.expiresAt) })}` : ""}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate">{c.noCreds}</p>
              )}
            </Section>

            <div className="grid gap-6 md:grid-cols-2">
              <Section id="area" title={c.sections.area}>
                <p className="flex items-start gap-2 text-slate">
                  <MapPin className="mt-1 size-4 shrink-0 text-blue" aria-hidden />
                  <span>
                    {sa ? fill(c.within, { miles: sa.radiusMiles, district: sa.basePostcode.split(" ")[0]! }) : l.address} {sa?.travelNote}
                  </span>
                </p>
              </Section>
              <Section id="hours" title={c.sections.hours}>
                <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 text-[15px] leading-6">
                  {[1, 2, 3, 4, 5, 6, 0].map((d) => {
                    const h = avail?.weeklyHours.find((x) => x.day === d)
                    return (
                      <div key={d} className="contents">
                        <dt className="text-slate">{c.days[d]}</dt>
                        <dd className="tnum text-right font-medium text-navy">{!h || h.closed ? c.closed : fill(c.hoursRange, { open: fmtClock(h.open), close: fmtClock(h.close) })}</dd>
                      </div>
                    )
                  })}
                </dl>
              </Section>
            </div>
          </div>

          <aside className="max-lg:hidden">
            <div className="card-site sticky top-24 p-6">
              <div className="flex items-center gap-3">
                <Avatar initials={l.initials} tone={tone} size={44} />
                <div className="min-w-0">
                  <p className="truncate text-[17px] leading-6 font-semibold text-navy">{l.name}</p>
                  <Rating rating={r.rating} count={r.count} />
                </div>
              </div>
              {desk && (
                <div className="mt-4">
                  <Badge kind="responds_instantly" />
                </div>
              )}
              <p className={cn("mt-3 flex items-center gap-1.5 text-[15px] leading-6", desk ? "font-medium text-teal-ink" : "text-slate")}>
                <Clock className="size-4 shrink-0" aria-hidden /> {replyLine(l)}
              </p>
              <div className="mt-5">
                <ListingActions {...actions} variant="card" />
              </div>
              <p className="mt-4 text-[14px] leading-5 text-muted-ink">
                {biz.bookingMode === "instant" ? c.bookingInstant : c.bookingRequest} {c.payDirect} {c.appNote}
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* Phones and tablets: the contact card becomes a sticky action bar */}
      <div data-listing-bar="" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] supports-backdrop-filter:backdrop-blur-xl lg:hidden">
        <div className="mx-auto max-w-[720px]">
          <ListingActions {...actions} variant="bar" />
        </div>
      </div>
    </WebPage>
  )
}
