"use client"
import * as React from "react"
import Link from "next/link"
import { use } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, BadgeCheck, Clock, Flag, Globe, Heart, MapPin, MoreHorizontal, Phone, Share2, ShieldCheck, Star, Store, UserPlus } from "lucide-react"
import { AppScreen } from "@/components/shells/AppScreen"
import { ActionBar } from "@/components/answerd/ActionBar"
import { BadgeRow } from "@/components/answerd/Badges"
import { Rating, Stars } from "@/components/answerd/Rating"
import { ListingAvatar, PhotoTile } from "@/components/answerd/Media"
import { MockMap } from "@/components/answerd/MockMap"
import { Banner } from "@/components/answerd/Feedback"
import { Button, IconButton } from "@/components/answerd/Button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ListingNotFound, ShareSheet } from "@/components/app/listing"
import { signInHref } from "@/components/app/helpers"
import { useStore } from "@/lib/store"
import {
  areaFor,
  availabilityFor,
  businessById,
  isDeskLive,
  listingBadges,
  listingBySlug,
  listingRating,
  openStatus,
  replyLine,
  servicesFor,
  verifiedCredentials,
} from "@/lib/selectors"
import { durationLabel, priceWithVat } from "@/lib/format"
import { fmtMiles, milesBetween, lookupPostcode } from "@/lib/geo"
import { fmtClock, fmtDate, fmtDayMonth, parts } from "@/lib/time"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"

const DAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

function Section({ title, children, action, id }: { title: string; children: React.ReactNode; action?: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="border-t border-line bg-white px-4 py-5" aria-labelledby={`${id ?? title}-h`}>
      <div className="mb-3 flex items-center justify-between">
        <h2 id={`${id ?? title}-h`} className="t-heading">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  )
}

/** C-16 (claimed) and C-17 (unclaimed) share /app/b/[slug] and switch on listing.layer. */
export default function ListingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const router = useRouter()
  const s = useStore()
  const listing = listingBySlug(s, slug)
  const [share, setShare] = React.useState<null | "recommend" | "join">(null)
  const viewed = React.useRef(false)
  React.useEffect(() => {
    if (listing && !viewed.current) {
      viewed.current = true
      s.recordProfileView(listing.id)
    }
  }, [listing, s])

  if (!listing)
    return (
      <AppScreen id="C-16" header={<TopBack />}>
        <ListingNotFound />
      </AppScreen>
    )

  const userId = s.session.userId
  const profile = s.customerProfiles.find((p) => p.userId === userId)
  const saved = !!profile?.savedListingIds.includes(listing.id)
  const cat = s.categories.find((c) => c.id === listing.categoryIds[0])
  const loc = s.session.location
  const dist = loc ? milesBetween(loc, listing.geo) : null
  const rating = listingRating(s, listing)
  const claimed = listing.layer === "claimed"
  const existingThread = s.threads.find((t) => t.listingId === listing.id && t.customerId === userId && userId && t.channel === "app")
  const messageHref = existingThread ? `/app/messages/${existingThread.id}` : `/app/b/${slug}/enquiry`
  const guarded = (href: string) => (userId ? href : signInHref(href))

  const toggleSave = () => {
    if (!userId) return router.push(signInHref(`/app/b/${slug}`))
    const nowSaved = s.toggleSave(listing.id)
    toast(nowSaved ? "Saved" : "Removed from saved", () => s.toggleSave(listing.id))
  }
  const recommend = () => {
    if (!userId) return router.push(signInHref(`/app/b/${slug}`))
    setShare("recommend")
  }

  if (!claimed) return <Unclaimed listingSlug={slug} share={share} setShare={setShare} dist={dist} />

  const biz = businessById(s, listing.businessId)!
  const services = servicesFor(s, biz.id)
  const bookable = services.some((x) => x.bookable)
  const status = openStatus(s, listing, s.clock)
  const desk = isDeskLive(s, listing)
  const badges = listingBadges(s, listing, s.clock)
  const reviews = s.reviews.filter((r) => r.listingId === listing.id && r.status === "live").sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const creds = verifiedCredentials(s, biz.id, s.clock)
  const area = areaFor(s, biz.id)
  const base = area ? lookupPostcode(area.basePostcode) : null
  const avail = availabilityFor(s, biz.id)
  const cover = biz.photos.find((p) => p.id === biz.coverPhotoId) ?? biz.photos[0]
  const today = parts(s.clock).dow

  return (
    <AppScreen
      id="C-16"
      footer={
        <ActionBar
          businessName={listing.name}
          callHref={`/app/b/${slug}/call`}
          messageHref={guarded(messageHref)}
          bookHref={status.holiday ? undefined : guarded(`/app/b/${slug}/book`)}
          showBook={bookable && !status.holiday}
        />
      }
    >
      <div className="relative">
        {cover ? <PhotoTile hue={cover.hue} icon={cover.icon} rounded="rounded-none" className="h-44 w-full" label={cover.caption} /> : <div className="h-44 bg-blue-tint" />}
        <div className="absolute inset-x-0 top-0 flex items-center gap-2 p-3">
          <IconButton label="Back" tone="white" onClick={() => (window.history.length > 1 ? router.back() : router.push("/app"))}>
            <ArrowLeft />
          </IconButton>
          <span className="flex-1" />
          <IconButton label={saved ? `Remove ${listing.name} from saved` : `Save ${listing.name}`} tone="white" onClick={toggleSave} aria-pressed={saved}>
            <Heart className={cn(saved && "fill-red text-red")} />
          </IconButton>
          <IconButton label={`Recommend ${listing.name}`} tone="white" onClick={recommend}>
            <Share2 />
          </IconButton>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <IconButton label="More options" tone="white">
                <MoreHorizontal />
              </IconButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-auto min-w-52">
              <DropdownMenuItem onSelect={() => router.push(`/app/report?target=listing&id=${listing.id}`)}>
                <Flag className="size-4" /> Report this business
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => router.push(`/app/b/${slug}/photos`)}>See all photos</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="relative bg-white px-4 pb-5">
        <div className="-mt-8 mb-2 inline-flex rounded-2xl border-4 border-white bg-white shadow-card">
          <ListingAvatar initials={listing.initials} hue={listing.hue} size={64} />
        </div>
        <h1 className="t-title">{listing.name}</h1>
        <p className="t-label font-normal text-slate">
          {cat?.name}
          {dist !== null && <span className="tnum"> · {fmtMiles(dist)} away</span>}
        </p>
        <Link href={`/app/b/${slug}/reviews`} className="mt-1.5 inline-flex min-h-8 items-center">
          <Rating value={rating.rating} count={rating.count} />
        </Link>
        <BadgeRow kinds={badges} max={6} className="mt-2" />
        <div className="mt-3 space-y-1">
          <p className={cn("flex items-center gap-1.5 t-label", desk ? "text-teal-ink" : "text-slate")}>
            <Clock className="size-4" aria-hidden /> {replyLine(s, listing)}
          </p>
          <p className={cn("flex items-center gap-1.5 t-label", status.open ? "text-teal-ink" : "text-slate")}>
            <Store className="size-4" aria-hidden /> {status.open ? "Open now · " : ""}
            {status.label}
          </p>
        </div>
        {(() => {
          // A tracked call over 60 s also allows a review (spec: Review a business)
          const call = s.calls.find((c) => c.listingId === listing.id && c.customerId === userId && userId && c.durationSec > 60 && !s.reviews.some((r) => r.callId === c.id))
          return call ? (
            <Link href={`/app/b/${slug}/review?call=${call.id}`} className="mt-3 flex items-center gap-2 rounded-xl bg-blue-tint px-3 py-2.5 t-label text-blue hover:underline">
              <Star className="size-4 fill-blue" aria-hidden /> You called {listing.name}. How did it go? Leave a review
            </Link>
          ) : null
        })()}
        {status.holiday && (
          <Banner tone="warning" className="mt-3" title={`${status.label}`}>
            {listing.name} is away ({status.holiday.toLowerCase()}). You can still message them{desk ? " and their Answerd desk will reply" : ""}.
          </Banner>
        )}
      </div>

      <nav className="no-scrollbar sticky top-0 z-10 flex gap-1 overflow-x-auto border-y border-line bg-white/95 px-3 py-2 backdrop-blur" aria-label="Sections">
        {[
          ["about", "About"],
          ["services", "Services"],
          ["photos", "Photos"],
          ["reviews", "Reviews"],
          ["credentials", "Credentials"],
          ["area", "Area"],
          ["hours", "Hours"],
        ].map(([id, label]) => (
          <button key={id} type="button" onClick={() => document.getElementById(id!)?.scrollIntoView({ behavior: "smooth" })} className="inline-flex h-9 shrink-0 items-center rounded-full px-3 t-label text-slate hover:bg-sky hover:text-navy">
            {label}
          </button>
        ))}
      </nav>

      <Section title="About" id="about">
        <p className="t-body text-slate">{listing.description || biz.description || "No description yet."}</p>
        <ul className="mt-3 space-y-1.5 t-label font-normal text-slate">
          <li className="flex items-center gap-2">
            <MapPin className="size-4 text-muted-ink" aria-hidden /> {listing.address}, {listing.postcode}
          </li>
          {biz.website && (
            <li className="flex items-center gap-2">
              <Globe className="size-4 text-muted-ink" aria-hidden /> {biz.website}
            </li>
          )}
          {biz.yearFounded && (
            <li className="flex items-center gap-2">
              <BadgeCheck className="size-4 text-muted-ink" aria-hidden /> Trading since {biz.yearFounded}
            </li>
          )}
        </ul>
      </Section>

      <Section title="Services and prices" id="services">
        <ul className="divide-y divide-line">
          {services.map((x) => (
            <li key={x.id} className="flex items-start gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="t-label text-navy">{x.name}</p>
                <p className="t-caption text-muted-ink">
                  {x.priceType === "quote" ? "Priced after a visit" : durationLabel(x.durationMin)}
                  {!x.bookable && " · Message to arrange"}
                </p>
              </div>
              <p className="shrink-0 text-right t-label text-navy tnum">{priceWithVat(x)}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Photos" id="photos" action={<Link href={`/app/b/${slug}/photos`} className="inline-flex min-h-11 items-center t-label text-blue">See all</Link>}>
        <div className="grid grid-cols-3 gap-2">
          {biz.photos.slice(0, 6).map((p, i) => (
            <Link key={p.id} href={`/app/b/${slug}/photos?i=${i}`} aria-label={`Photo ${i + 1}: ${p.caption}`}>
              <PhotoTile hue={p.hue} icon={p.icon} className="aspect-square w-full" />
            </Link>
          ))}
        </div>
      </Section>

      <Section title="Reviews" id="reviews" action={<Link href={`/app/b/${slug}/reviews`} className="inline-flex min-h-11 items-center t-label text-blue">See all {rating.count}</Link>}>
        {reviews.length ? (
          <ul className="space-y-4">
            {reviews.slice(0, 3).map((r) => (
              <li key={r.id}>
                <div className="flex items-center gap-2">
                  <Stars value={r.stars} />
                  <span className="t-label text-navy">{r.authorName}</span>
                  <span className="t-caption text-muted-ink">· {fmtDayMonth(r.createdAt)}</span>
                </div>
                <p className="mt-1 t-body text-slate">{r.text}</p>
                {r.reply && <p className="mt-2 rounded-xl bg-sky px-3 py-2 t-label font-normal text-slate"><span className="font-semibold text-navy">Reply from {listing.name}:</span> {r.reply.body}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="t-body text-slate">No reviews yet. Be the first after your booking.</p>
        )}
      </Section>

      <Section title="Credentials" id="credentials">
        {creds.length ? (
          <ul className="space-y-2">
            {creds.map((c) => (
              <li key={c.id} className="flex items-center gap-3 rounded-xl border border-line p-3">
                <ShieldCheck className="size-5 text-teal-ink" aria-hidden />
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

      <Section title="Service area" id="area">
        {area && base ? (
          <>
            <MockMap points={[]} circle={{ lat: base.lat, lng: base.lng, radiusMiles: area.radiusMiles }} height={180} showSearchArea={false} ariaLabel={`Service area: ${area.radiusMiles} miles around ${area.basePostcode}`} />
            <p className="mt-2 t-label font-normal text-slate">
              {area.mode === "districts" ? `Covers ${area.districts.join(", ")}` : `Within ${area.radiusMiles} miles of ${area.basePostcode.split(" ")[0]}`}. {area.travelNote}
            </p>
          </>
        ) : (
          <p className="t-body text-slate">At {listing.address}.</p>
        )}
      </Section>

      <Section title="Hours" id="hours">
        <dl className="grid grid-cols-[1fr_auto] gap-y-1.5">
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
        <Link href={`/app/report?target=listing&id=${listing.id}`} className="mt-5 inline-flex min-h-11 items-center gap-1.5 t-label text-muted-ink hover:text-navy">
          <Flag className="size-4" aria-hidden /> Report this business
        </Link>
      </Section>

      <ShareSheet
        open={share === "recommend"}
        onClose={() => setShare(null)}
        listing={listing}
        title={`Recommend ${listing.name}`}
        onShared={() => s.recommend(listing.id)}
      />
    </AppScreen>
  )
}

function TopBack() {
  const router = useRouter()
  return (
    <div className="flex items-center bg-white px-2 py-1">
      <IconButton label="Back" onClick={() => router.back()}>
        <ArrowLeft />
      </IconButton>
    </div>
  )
}

/** C-17: unclaimed listings get the reduced layout. */
function Unclaimed({ listingSlug, share, setShare, dist }: { listingSlug: string; share: null | "recommend" | "join"; setShare: (v: null | "recommend" | "join") => void; dist: number | null }) {
  const s = useStore()
  const router = useRouter()
  const listing = listingBySlug(s, listingSlug)!
  const cat = s.categories.find((c) => c.id === listing.categoryIds[0])
  const r = listingRating(s, listing)
  const places = listing.layer === "places"
  return (
    <AppScreen
      id="C-17"
      header={
        <div className="flex items-center gap-1 border-b border-line bg-white px-2 py-1">
          <IconButton label="Back" onClick={() => (window.history.length > 1 ? router.back() : router.push("/app"))}>
            <ArrowLeft />
          </IconButton>
          <span className="flex-1 truncate t-subhead">{listing.name}</span>
          <IconButton label="Report this listing" onClick={() => router.push(`/app/report?target=listing&id=${listing.id}`)}>
            <Flag />
          </IconButton>
        </div>
      }
      footer={<ActionBar variant="unclaimed" businessName={listing.name} callHref={`/app/b/${listingSlug}/call`} claimHref={`/app/biz/claim?listing=${listing.id}`} />}
    >
      <div className="bg-white px-4 pb-5 pt-4">
        <div className="flex items-start gap-3">
          <ListingAvatar initials={listing.initials} hue={listing.hue} size={64} />
          <div className="min-w-0">
            <h1 className="t-title">{listing.name}</h1>
            <p className="t-label font-normal text-slate">
              {cat?.name}
              {dist !== null && <span className="tnum"> · {fmtMiles(dist)} away</span>}
            </p>
          </div>
        </div>
        <BadgeRow kinds={["unclaimed"]} className="mt-3" />
        <ul className="mt-4 space-y-2 t-label font-normal text-slate">
          <li className="flex items-center gap-2">
            <MapPin className="size-4 text-muted-ink" aria-hidden /> {listing.address}, {listing.postcode}
          </li>
          <li className="flex items-center gap-2">
            <Phone className="size-4 text-muted-ink" aria-hidden /> <span className="tnum">{listing.phonePublic}</span>
          </li>
        </ul>
        {places && r.count > 0 && (
          <div className="mt-4 rounded-xl border border-line p-3">
            <Rating value={r.rating} count={r.count} google />
            <p className="mt-1 text-[11px] leading-4 text-muted-ink">Rating and details from Google. Powered by Google.</p>
          </div>
        )}
      </div>
      <div className="mt-2 bg-white px-4 py-4">
        <MockMap points={[{ id: listing.id, lat: listing.geo.lat, lng: listing.geo.lng, label: listing.name }]} center={listing.geo} spanMiles={1.5} height={180} showSearchArea={false} ariaLabel={`Map showing ${listing.name}`} />
      </div>
      <div className="mt-2 space-y-3 bg-white px-4 py-5">
        <div className="rounded-2xl bg-sky p-4">
          <p className="t-subhead">This business hasn&apos;t joined Answerd yet</p>
          <p className="mt-1 t-label font-normal text-slate">You can still call them. Calls go through an Answerd number so they know you found them here.</p>
        </div>
        <Link href={`/app/biz/claim?listing=${listing.id}`} className="card flex items-center gap-3 p-4 hover:border-blue">
          <Store className="size-5 text-blue" aria-hidden />
          <span className="flex-1">
            <span className="block t-label text-navy">Is this your business? Claim it</span>
            <span className="block t-caption text-muted-ink">Free. See who&apos;s been trying to reach you.</span>
          </span>
        </Link>
        <Button variant="secondary" block onClick={() => setShare("join")}>
          <UserPlus /> Ask them to join
        </Button>
      </div>
      <ShareSheet
        open={share === "join"}
        onClose={() => setShare(null)}
        listing={listing}
        title="Ask them to join"
        message={`Hi! I found you on Answerd. Claim your free listing so customers can message and book you: https://answerd.vitalos.co.uk/claim?listing=${listing.slug}`}
      />
    </AppScreen>
  )
}
