"use client"
import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { BadgeCheck, CalendarPlus, ChevronLeft, ChevronRight, Clock, Flag, Globe, Heart, MapPin, MessageCircle, Phone, Share2, ShieldCheck, Smartphone, Store, UserPlus } from "lucide-react"
import { ScreenMeta } from "@/components/shells/ScreenMeta"
import { BadgeRow, Badge } from "@/components/answerd/Badges"
import { Rating, Stars } from "@/components/answerd/Rating"
import { ListingAvatar, ListingCover, PhotoTile } from "@/components/answerd/Media"
import { MockMap } from "@/components/answerd/MockMap"
import { Banner, EmptyState } from "@/components/answerd/Feedback"
import { Button, ButtonLink } from "@/components/answerd/Button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { useStore } from "@/lib/store"
import { areaFor, availabilityFor, businessById, isDeskLive, listingBadges, listingBySlug, listingRating, openStatus, replyLine, servicesFor, verifiedCredentials } from "@/lib/selectors"
import { durationLabel, priceWithVat } from "@/lib/format"
import { areaBySlug, fmtMiles, lookupPostcode, milesBetween } from "@/lib/geo"
import { fmtClock, fmtDate, fmtDayMonth, parts } from "@/lib/time"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { Listing } from "@/lib/types"
import { Breadcrumbs, Container } from "../ui"
import { SITE_HOST } from "../data"
import { CallDialog, ReportDialog } from "./dialogs"
import { ContinueInAppDialog, type ContinueAction } from "./ContinueInApp"

const DAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

function signInFor(next: string) {
  return `/sign-in?next=${encodeURIComponent(next)}`
}

function Section({ id, title, children, action }: { id: string; title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section id={id} className="card scroll-mt-28 p-5 md:p-6" aria-labelledby={`${id}-h`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id={`${id}-h`} className="t-heading">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  )
}

/** Reads ?call=1, ?message=1 and ?book=1 (links from result cards and Ask Answerd) without pulling the whole page out of server rendering. */
function QueryOpeners({ onCall, onApp }: { onCall: () => void; onApp: (action: ContinueAction) => void }) {
  const sp = useSearchParams()
  const hydrated = useStore((s) => s.hydrated)
  const call = sp.get("call")
  const message = sp.get("message")
  const book = sp.get("book")
  React.useEffect(() => {
    if (!hydrated) return
    if (call === "1") onCall()
    if (message === "1") onApp("message")
    if (book === "1") onApp("book")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, call, message, book])
  return null
}

function crumbsFor(s: ReturnType<typeof useStore.getState>, l: Listing) {
  const cat = s.categories.find((c) => c.id === l.categoryIds[0])
  const area = areaBySlug(l.area)
  return [
    { name: "Home", href: "/" },
    ...(cat ? [{ name: cat.plural, href: `/${cat.slug}` }] : []),
    ...(cat && area ? [{ name: `${cat.plural} in ${area.name}`, href: `/${cat.slug}/${area.slug}` }] : []),
    { name: l.name, href: `/b/${l.slug}` },
  ]
}

/** W-06 (claimed) and W-07 (unclaimed) share /b/[slug]: a two-column C-16 / C-17 with a sticky contact card. */
export function ListingView({ slug }: { slug: string }) {
  const s = useStore()
  const router = useRouter()
  const listing = listingBySlug(s, slug)
  const [dialog, setDialog] = React.useState<null | "call" | "report" | "photos">(null)
  // App first: Message and Book continue in the app; there's no web messaging or web booking from here
  const [appSheet, setAppSheet] = React.useState<ContinueAction | null>(null)
  const [photoIdx, setPhotoIdx] = React.useState(0)
  const [reviewsShown, setReviewsShown] = React.useState(5)
  const [starFilter, setStarFilter] = React.useState<number | null>(null)
  const viewed = React.useRef(false)
  React.useEffect(() => {
    if (listing && s.hydrated && !viewed.current) {
      viewed.current = true
      s.recordProfileView(listing.id)
    }
  }, [listing, s])

  if (!listing) {
    return (
      <Container className="py-16">
        <ScreenMeta id="W-06" />
        <div className="card">
          <EmptyState title="We can't find that business" body="It may have moved or merged with another listing." action={<ButtonLink href="/search" size="md">Search again</ButtonLink>} />
        </div>
      </Container>
    )
  }

  const userId = s.session.userId
  const here = `/b/${listing.slug}`
  const claimedListing = listing.layer === "claimed"
  const openApp = (action: ContinueAction) => {
    if (claimedListing) setAppSheet(action)
  }
  const openers = (
    <React.Suspense fallback={null}>
      <QueryOpeners onCall={() => setDialog("call")} onApp={openApp} />
    </React.Suspense>
  )
  const cat = s.categories.find((c) => c.id === listing.categoryIds[0])
  const loc = s.session.location
  const dist = loc ? milesBetween(loc, listing.geo) : null
  const rating = listingRating(s, listing)
  const crumbs = crumbsFor(s, listing)
  const profile = s.customerProfiles.find((p) => p.userId === userId)
  const saved = !!profile?.savedListingIds.includes(listing.id)

  if (listing.layer !== "claimed") {
    const places = listing.layer === "places"
    return (
      <>
        <ScreenMeta id="W-07" />
        {openers}
        <Container className="py-6 md:py-8">
          <Breadcrumbs items={crumbs} />
          <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0 space-y-6">
              <div className="card p-5 md:p-6">
                <div className="flex items-start gap-4">
                  <ListingAvatar listing={listing} size={72} />
                  <div className="min-w-0">
                    <h1 className="t-title break-words">{listing.name}</h1>
                    <p className="t-label font-normal text-slate">
                      {cat?.name}
                      {dist !== null && <span className="tnum"> · {fmtMiles(dist)} away</span>}
                    </p>
                    <BadgeRow kinds={["unclaimed"]} className="mt-2" />
                  </div>
                </div>
                <ul className="mt-5 space-y-2 t-label font-normal text-slate">
                  <li className="flex items-center gap-2">
                    <MapPin className="size-4 shrink-0 text-muted-ink" aria-hidden /> {listing.address}, {listing.postcode}
                  </li>
                  <li className="flex items-center gap-2">
                    <Phone className="size-4 shrink-0 text-muted-ink" aria-hidden /> <span className="tnum">{listing.phonePublic}</span>
                  </li>
                </ul>
                {places && rating.count > 0 && (
                  <div className="mt-4 rounded-xl border border-line p-3">
                    <Rating value={rating.rating} count={rating.count} google />
                    <p className="mt-1 text-[11px] leading-4 text-muted-ink">Rating and details from Google. Powered by Google.</p>
                  </div>
                )}
              </div>
              <div className="rounded-2xl border-2 border-blue bg-blue-tint p-5 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-white text-blue">
                    <Store className="size-6" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="t-heading">Is this your business? Claim it free</h2>
                    <p className="mt-1 t-body text-slate">See who&apos;s been trying to reach you, add your prices and photos, and let customers message and book you.</p>
                  </div>
                  <ButtonLink href={`/claim?listing=${listing.slug}`} className="shrink-0">
                    Claim this business
                  </ButtonLink>
                </div>
              </div>
              <div className="card p-5">
                <h2 className="t-heading">Location</h2>
                <MockMap className="mt-4" points={[{ id: listing.id, lat: listing.geo.lat, lng: listing.geo.lng, label: listing.name }]} center={listing.geo} spanMiles={1.5} height={260} showSearchArea={false} ariaLabel={`Map showing ${listing.name}`} />
              </div>
            </div>
            <aside className="lg:sticky lg:top-28 lg:self-start">
              <div className="card p-5">
                <p className="t-subhead">This business hasn&apos;t joined Answerd yet</p>
                <p className="mt-1 t-label font-normal text-slate">You can still call them. Calls go through an Answerd number so they know you found them here.</p>
                <div className="mt-4 grid gap-2">
                  <Button onClick={() => setDialog("call")}>
                    <Phone /> Call
                  </Button>
                  <ButtonLink href={`/claim?listing=${listing.slug}`} variant="secondary">
                    <Store /> Claim this business
                  </ButtonLink>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      void navigator.clipboard?.writeText(`https://${SITE_HOST}/claim?listing=${listing.slug}`).catch(() => {})
                      toast("Invite link copied. Send it to them.")
                    }}
                  >
                    <UserPlus /> Ask them to join
                  </Button>
                </div>
                <button type="button" onClick={() => setDialog("report")} className="mt-3 inline-flex min-h-11 items-center gap-1.5 t-label text-muted-ink hover:text-navy">
                  <Flag className="size-4" aria-hidden /> Report this listing
                </button>
              </div>
            </aside>
          </div>
        </Container>
        <CallDialog listing={listing} open={dialog === "call"} onOpenChange={(v) => setDialog(v ? "call" : null)} />
        <ReportDialog listing={listing} open={dialog === "report"} onOpenChange={(v) => setDialog(v ? "report" : null)} />
      </>
    )
  }

  const biz = businessById(s, listing.businessId)!
  const services = servicesFor(s, biz?.id)
  const bookable = services.some((x) => x.bookable)
  const status = openStatus(s, listing, s.clock)
  const desk = isDeskLive(s, listing)
  const badges = listingBadges(s, listing, s.clock)
  const allReviews = s.reviews.filter((r) => r.listingId === listing.id && r.status === "live").sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const reviews = starFilter ? allReviews.filter((r) => r.stars === starFilter) : allReviews
  const dist5 = [5, 4, 3, 2, 1].map((n) => ({ n, c: allReviews.filter((r) => r.stars === n).length }))
  const creds = verifiedCredentials(s, biz?.id, s.clock)
  const area = areaFor(s, biz?.id)
  const base = area ? lookupPostcode(area.basePostcode) : null
  const avail = availabilityFor(s, biz?.id)
  const photos = biz?.photos ?? []
  // The owner's cover photo if set; otherwise a 120 px band with the category's own icon
  const cover = photos.find((p) => p.id === biz?.coverPhotoId)
  const today = parts(s.clock).dow
  const canBook = bookable && !status.holiday

  const toggleSave = () => {
    if (!userId) return router.push(signInFor(here))
    const nowSaved = s.toggleSave(listing.id)
    toast(nowSaved ? "Saved" : "Removed from saved", () => s.toggleSave(listing.id))
  }
  const recommend = () => {
    if (!userId) return router.push(signInFor(here))
    const url = `https://${SITE_HOST}/b/${listing.slug}${profile?.referralCode ? `?ref=${profile.referralCode}` : ""}`
    void navigator.clipboard?.writeText(url).catch(() => {})
    s.recommend(listing.id)
    toast("Link copied. Share it with a friend.")
  }

  const contact = (
    <div className="card p-5">
      <div className="flex items-center gap-3">
        <ListingAvatar listing={listing} size={44} />
        <div className="min-w-0">
          <p className="truncate t-subhead">{listing.name}</p>
          <Rating value={rating.rating} count={rating.count} />
        </div>
      </div>
      {desk && (
        <div className="mt-3">
          <Badge kind="responds_instantly" />
        </div>
      )}
      <p className={cn("mt-3 flex items-center gap-1.5 t-label", desk ? "text-teal-ink" : "text-slate")}>
        <Clock className="size-4" aria-hidden /> {replyLine(s, listing)}
      </p>
      <p className={cn("mt-1 flex items-center gap-1.5 t-label", status.open ? "text-teal-ink" : "text-slate")}>
        <Store className="size-4" aria-hidden /> {status.open ? "Open now · " : ""}
        {status.label}
      </p>
      <div className="mt-4 grid gap-2">
        {canBook && (
          <Button onClick={() => openApp("book")} aria-label={`Book ${listing.name}`} aria-haspopup="dialog">
            <CalendarPlus /> Book
          </Button>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => setDialog("call")} aria-label={`Call ${listing.name}`}>
            <Phone /> Call
          </Button>
          <Button variant="secondary" onClick={() => openApp("message")} aria-label={`Message ${listing.name}`} aria-haspopup="dialog">
            <MessageCircle /> Message
          </Button>
        </div>
      </div>
      <p className="mt-2 t-caption text-muted-ink">Message and Book continue in the Answerd app. Calls work from here.</p>
      {!canBook && bookable && status.holiday && <p className="mt-2 t-caption text-muted-ink">Booking is paused: {status.label}. You can still message them.</p>}
      {biz && <p className="mt-3 t-caption text-muted-ink">{biz.bookingMode === "instant" ? "Instant booking: you're confirmed straight away." : "Request to book: they confirm within 2 hours."} You pay the business directly.</p>}
      <Link href={`/app/b/${listing.slug}`} className="mt-3 flex min-h-11 items-center gap-2 t-label text-blue hover:underline">
        <Smartphone className="size-4" aria-hidden /> Open in the app
      </Link>
    </div>
  )

  return (
    <>
      <ScreenMeta id="W-06" />
      {openers}
      <div className="relative">
        <ListingCover listing={listing} photo={cover} className="h-40 md:h-56" />
      </div>
      <Container className="pb-24 lg:pb-12">
        <div className="relative -mt-10 card p-5 md:p-6">
          <Breadcrumbs items={crumbs} />
          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-start">
            <ListingAvatar listing={listing} size={72} className="border-4 border-white shadow-card" />
            <div className="min-w-0 flex-1">
              <h1 className="t-title break-words">{listing.name}</h1>
              <p className="t-label font-normal text-slate">
                {cat?.name} · {listing.address.split(", ").at(-1)}
                {dist !== null && <span className="tnum"> · {fmtMiles(dist)} away</span>}
              </p>
              <a href="#reviews" className="mt-1.5 inline-flex min-h-8 items-center">
                <Rating value={rating.rating} count={rating.count} />
              </a>
              <BadgeRow kinds={badges} max={8} className="mt-2" />
            </div>
            <div className="flex gap-1">
              <button type="button" onClick={toggleSave} aria-pressed={saved} aria-label={saved ? `Remove ${listing.name} from saved` : `Save ${listing.name}`} className="inline-flex size-11 items-center justify-center rounded-full border border-line text-navy hover:bg-sky">
                <Heart className={cn("size-5", saved && "fill-red text-red")} />
              </button>
              <button type="button" onClick={recommend} aria-label={`Recommend ${listing.name}`} className="inline-flex size-11 items-center justify-center rounded-full border border-line text-navy hover:bg-sky">
                <Share2 className="size-5" />
              </button>
              <button type="button" onClick={() => setDialog("report")} aria-label={`Report ${listing.name}`} className="inline-flex size-11 items-center justify-center rounded-full border border-line text-navy hover:bg-sky">
                <Flag className="size-5" />
              </button>
            </div>
          </div>
          {status.holiday && (
            <Banner tone="warning" className="mt-4" title={status.label}>
              {listing.name} is away ({status.holiday.toLowerCase()}). You can still message them{desk ? " and their Answerd desk will reply" : ""}.
            </Banner>
          )}
        </div>

        <nav className="no-scrollbar sticky top-16 z-10 -mx-1 mt-4 flex gap-1 overflow-x-auto rounded-full border border-line bg-white/95 px-2 py-1.5 backdrop-blur lg:hidden" aria-label="Sections">
          {[
            ["about", "About"],
            ["services", "Services"],
            ["photos", "Photos"],
            ["reviews", "Reviews"],
            ["credentials", "Credentials"],
            ["area", "Area"],
            ["hours", "Hours"],
          ].map(([id, label]) => (
            <a key={id} href={`#${id}`} className="inline-flex h-9 shrink-0 items-center rounded-full px-3 t-label text-slate hover:bg-sky hover:text-navy">
              {label}
            </a>
          ))}
        </nav>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-6">
            <Section id="about" title="About">
              <p className="t-body text-slate">{listing.description || biz?.description || "No description yet."}</p>
              <ul className="mt-4 grid gap-2 t-label font-normal text-slate sm:grid-cols-2">
                <li className="flex items-center gap-2">
                  <MapPin className="size-4 shrink-0 text-muted-ink" aria-hidden /> {listing.address}, {listing.postcode}
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="size-4 shrink-0 text-muted-ink" aria-hidden /> Call via Answerd
                </li>
                {biz?.website && (
                  <li className="flex items-center gap-2">
                    <Globe className="size-4 shrink-0 text-muted-ink" aria-hidden /> {biz.website}
                  </li>
                )}
                {biz?.yearFounded && (
                  <li className="flex items-center gap-2">
                    <BadgeCheck className="size-4 shrink-0 text-muted-ink" aria-hidden /> Trading since {biz.yearFounded}
                  </li>
                )}
              </ul>
            </Section>

            <Section id="services" title="Services and prices">
              {services.length ? (
                <ul className="divide-y divide-line">
                  {services.map((x) => (
                    <li key={x.id} className="flex flex-wrap items-start gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="t-label text-navy">{x.name}</p>
                        {x.description && <p className="t-caption text-slate">{x.description}</p>}
                        <p className="t-caption text-muted-ink">
                          {x.priceType === "quote" ? "Priced after a visit" : durationLabel(x.durationMin)}
                          {!x.bookable && " · Message to arrange"}
                        </p>
                      </div>
                      <p className="shrink-0 text-right t-label text-navy tnum">{priceWithVat(x)}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="t-body text-slate">No services listed yet. Message them for a price.</p>
              )}
            </Section>

            <Section id="photos" title="Photos" action={photos.length ? <span className="t-caption text-muted-ink tnum">{photos.length} photos</span> : undefined}>
              {photos.length ? (
                <div className="grid grid-cols-3 gap-2 md:grid-cols-4">
                  {photos.slice(0, 8).map((p, i) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setPhotoIdx(i)
                        setDialog("photos")
                      }}
                      aria-label={`Open photo ${i + 1}: ${p.caption}`}
                      className="rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"
                    >
                      <PhotoTile hue={p.hue} icon={p.icon} className="aspect-square w-full" />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="t-body text-slate">No photos yet.</p>
              )}
            </Section>

            <Section id="reviews" title="Reviews">
              {allReviews.length ? (
                <>
                  <div className="grid gap-5 sm:grid-cols-[160px_1fr]">
                    <div>
                      <p className="text-[40px] font-bold leading-none text-navy tnum">{rating.rating.toFixed(1)}</p>
                      <Stars value={rating.rating} size={16} className="mt-2" />
                      <p className="mt-1 t-caption text-muted-ink tnum">{rating.count} reviews</p>
                    </div>
                    <div className="space-y-1">
                      {dist5.map(({ n, c }) => (
                        <button key={n} type="button" onClick={() => setStarFilter(starFilter === n ? null : n)} aria-pressed={starFilter === n} className={cn("flex w-full items-center gap-2 rounded-lg px-1 py-0.5 text-left hover:bg-sky", starFilter === n && "bg-blue-tint")}>
                          <span className="w-10 t-caption text-navy tnum">{n} star</span>
                          <span className="h-2 flex-1 overflow-hidden rounded-full bg-sky">
                            <span className="block h-full rounded-full bg-amber" style={{ width: `${(c / allReviews.length) * 100}%` }} />
                          </span>
                          <span className="w-8 text-right t-caption text-muted-ink tnum">{c}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <ul className="mt-6 space-y-5">
                    {reviews.slice(0, reviewsShown).map((r) => (
                      <li key={r.id} className="border-t border-line pt-5">
                        <div className="flex flex-wrap items-center gap-2">
                          <Stars value={r.stars} />
                          <span className="t-label text-navy">{r.authorName}</span>
                          <span className="t-caption text-muted-ink">· {fmtDayMonth(r.createdAt)}</span>
                        </div>
                        <p className="mt-1 t-body text-slate">{r.text}</p>
                        {r.reply && (
                          <p className="mt-2 rounded-xl bg-sky px-3 py-2 t-label font-normal text-slate">
                            <span className="font-semibold text-navy">Reply from {listing.name}:</span> {r.reply.body}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                  {reviews.length > reviewsShown && (
                    <Button variant="secondary" size="md" className="mt-5" onClick={() => setReviewsShown((n) => n + 10)}>
                      Show more reviews
                    </Button>
                  )}
                  {!reviews.length && <p className="mt-4 t-body text-slate">No {starFilter}-star reviews.</p>}
                </>
              ) : (
                <p className="t-body text-slate">No reviews yet. Be the first after your booking.</p>
              )}
            </Section>

            <Section id="credentials" title="Credentials">
              {creds.length ? (
                <ul className="grid gap-2 sm:grid-cols-2">
                  {creds.map((c) => (
                    <li key={c.id} className="flex items-center gap-3 rounded-xl border border-line p-3">
                      <ShieldCheck className="size-5 shrink-0 text-teal-ink" aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="t-label text-navy">{c.label}</p>
                        <p className="t-caption text-muted-ink">
                          Checked by Answerd{c.number ? ` · ${c.number}` : ""}
                          {c.expiresAt ? ` · valid to ${fmtDate(c.expiresAt)}` : ""}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="t-body text-slate">No credentials checked yet.</p>
              )}
            </Section>

            <Section id="area" title="Service area">
              {area && base ? (
                <>
                  <MockMap points={[]} circle={{ lat: base.lat, lng: base.lng, radiusMiles: area.radiusMiles }} height={260} showSearchArea={false} ariaLabel={`Service area: ${area.radiusMiles} miles around ${area.basePostcode}`} />
                  <p className="mt-3 t-label font-normal text-slate">
                    {area.mode === "districts" ? `Covers ${area.districts.join(", ")}` : `Within ${area.radiusMiles} miles of ${area.basePostcode.split(" ")[0]}`}. {area.travelNote}
                  </p>
                </>
              ) : (
                <p className="t-body text-slate">At {listing.address}.</p>
              )}
            </Section>

            <Section id="hours" title="Hours">
              <dl className="grid max-w-md grid-cols-[1fr_auto] gap-y-1.5">
                {[1, 2, 3, 4, 5, 6, 0].map((d) => {
                  const h = avail?.weeklyHours.find((x) => x.day === d)
                  return (
                    <React.Fragment key={d}>
                      <dt className={cn("t-label font-normal", d === today ? "font-semibold text-navy" : "text-slate")}>{DAY[d]}</dt>
                      <dd className={cn("t-label tnum", d === today ? "text-navy" : "font-normal text-slate")}>{!h || h.closed ? "Closed" : `${fmtClock(h.open)} to ${fmtClock(h.close)}`}</dd>
                    </React.Fragment>
                  )
                })}
              </dl>
            </Section>
          </div>

          <aside className="max-lg:hidden">
            <div className="sticky top-28 space-y-3">{contact}</div>
          </aside>
        </div>
      </Container>

      {/* Phone and tablet: the contact card becomes a sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-[720px] gap-2">
          <Button variant="secondary" className="flex-1 px-3" onClick={() => setDialog("call")} aria-label={`Call ${listing.name}`}>
            <Phone /> Call
          </Button>
          <Button variant="secondary" className="flex-1 px-3" onClick={() => openApp("message")} aria-label={`Message ${listing.name}`} aria-haspopup="dialog">
            <MessageCircle /> Message
          </Button>
          {canBook && (
            <Button className="flex-1 px-3" onClick={() => openApp("book")} aria-label={`Book ${listing.name}`} aria-haspopup="dialog">
              <CalendarPlus /> Book
            </Button>
          )}
        </div>
      </div>

      <CallDialog listing={listing} open={dialog === "call"} onOpenChange={(v) => setDialog(v ? "call" : null)} onMessage={() => openApp("message")} />
      <ReportDialog listing={listing} open={dialog === "report"} onOpenChange={(v) => setDialog(v ? "report" : null)} />
      <Dialog open={dialog === "photos"} onOpenChange={(v) => setDialog(v ? "photos" : null)}>
        <DialogContent className="max-w-[calc(100%-2rem)] rounded-3xl border-0 bg-white p-4 shadow-overlay sm:max-w-3xl">
          <DialogTitle className="t-subhead">
            {photos[photoIdx]?.caption} <span className="t-caption text-muted-ink tnum">· {photoIdx + 1} of {photos.length}</span>
          </DialogTitle>
          {photos[photoIdx] && <PhotoTile hue={photos[photoIdx]!.hue} icon={photos[photoIdx]!.icon} className="aspect-[4/3] w-full" label={photos[photoIdx]!.caption} rounded="rounded-2xl" />}
          <div className="flex justify-between">
            <Button variant="secondary" size="md" onClick={() => setPhotoIdx((i) => (i - 1 + photos.length) % photos.length)} aria-label="Previous photo">
              <ChevronLeft /> Previous
            </Button>
            <Button variant="secondary" size="md" onClick={() => setPhotoIdx((i) => (i + 1) % photos.length)} aria-label="Next photo">
              Next <ChevronRight />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <ContinueInAppDialog listing={listing} action={appSheet ?? "message"} open={!!appSheet} onOpenChange={(v) => !v && setAppSheet(null)} onCall={() => setDialog("call")} />
    </>
  )
}
