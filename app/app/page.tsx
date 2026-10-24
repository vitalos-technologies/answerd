"use client"
import * as React from "react"
import Link from "next/link"
import { ArrowRight, Bell, ChevronRight, Clock, MapPin, Sparkles } from "lucide-react"
import { AppScreen } from "@/components/shells/AppScreen"
import { SearchBar, CategoryTile } from "@/components/answerd/Search"
import { Badge } from "@/components/answerd/Badges"
import { Rating } from "@/components/answerd/Rating"
import { ListingAvatar } from "@/components/answerd/Media"
import { StatusPill } from "@/components/answerd/Status"
import { ErrorState, Skeleton } from "@/components/answerd/Feedback"
import { Mark } from "@/components/brand/Mark"
import { useStore } from "@/lib/store"
import { respondsInstantlyNear } from "@/lib/search"
import { listingRating, serviceById, unreadCount } from "@/lib/selectors"
import { fmtMiles, milesBetween } from "@/lib/geo"
import { fmtRelDay, fmtTime, greeting, ms } from "@/lib/time"

function HomeSkeleton() {
  return (
    <div className="space-y-6 px-4 pt-4" role="status" aria-label="Loading">
      <div className="grid grid-cols-5 gap-3">
        {Array.from({ length: 10 }, (_, i) => (
          <Skeleton key={i} className="h-[92px] rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-6 w-48" />
      <div className="flex gap-3">
        <Skeleton className="h-36 w-56 rounded-2xl" />
        <Skeleton className="h-36 w-56 rounded-2xl" />
      </div>
      <Skeleton className="h-24 w-full rounded-2xl" />
    </div>
  )
}

/** C-09 Home */
export default function HomePage() {
  const s = useStore()
  const user = s.users.find((u) => u.id === s.session.userId)
  const loc = s.session.location
  const profile = s.customerProfiles.find((p) => p.userId === s.session.userId)
  const recent = profile ? profile.recentSearches : s.session.guestRecentSearches
  const override = s.stateOverride
  const carousel = override === "empty" ? [] : respondsInstantlyNear(s, 5)
  const upcoming = user
    ? s.bookings
        .filter((b) => b.customerId === user.id && ["requested", "confirmed", "on_the_way", "arrived"].includes(b.status) && ms(b.endAt) > ms(s.clock))
        .sort((a, b) => ms(a.startAt) - ms(b.startAt))[0]
    : undefined
  const unread = unreadCount(s, s.session.userId)
  const cats = s.settings.homeCategoryOrder.map((id) => s.categories.find((c) => c.id === id)!).filter(Boolean)

  return (
    <AppScreen id="C-09" tabs="customer">
      <div className="bg-white px-4 pb-4 pt-3">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="t-title">{user ? `${greeting(s.clock)}, ${user.firstName}` : "Find local help"}</p>
            <Link href="/app/location?next=/app" className="mt-0.5 inline-flex min-h-8 items-center gap-1 t-label text-slate hover:text-navy" aria-label={`Location: ${loc ? loc.label : "not set"}. Change`}>
              <MapPin className="size-4 text-blue" aria-hidden />
              {loc ? (
                <span className="tnum">
                  {loc.postcode.split(" ")[0]} · {loc.label}
                </span>
              ) : (
                "Set your location"
              )}
              <ChevronRight className="size-4 text-muted-ink" aria-hidden />
            </Link>
          </div>
          <Link href={user ? "/app/notifications" : "/app/sign-in?next=%2Fapp%2Fnotifications"} className="relative inline-flex size-11 items-center justify-center rounded-full text-navy hover:bg-sky" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}>
            <Bell className="size-5" />
            {!!unread && <span className="absolute right-2 top-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red px-1 text-[10px] font-semibold text-white tnum">{unread}</span>}
          </Link>
        </div>
        <SearchBar className="mt-3" href="/app/search" locationLabel={loc ? `${loc.postcode.split(" ")[0]} · 5 mi` : undefined} locationHref="/app/location?next=/app" />
      </div>

      {override === "loading" ? (
        <HomeSkeleton />
      ) : override === "error" ? (
        <ErrorState onRetry={() => s.setStateOverride("none")} />
      ) : (
        <div className="space-y-6 px-4 pb-6 pt-4">
          {!loc && (
            <Link href="/app/location?next=/app" className="card flex items-center gap-3 p-4 hover:border-blue">
              <span className="inline-flex size-11 items-center justify-center rounded-full bg-blue-tint text-blue">
                <MapPin className="size-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block t-subhead">Add your postcode</span>
                <span className="block t-caption text-slate">So we can show who&apos;s nearby and how far away they are.</span>
              </span>
              <ChevronRight className="size-5 text-muted-ink" aria-hidden />
            </Link>
          )}

          <section aria-labelledby="cats">
            <h2 id="cats" className="sr-only">
              Categories
            </h2>
            <div className="grid grid-cols-5 gap-x-1 gap-y-3">
              {cats.slice(0, 8).map((c) => (
                <CategoryTile key={c.id} icon={c.icon} label={c.plural === "Man and van" ? "Man & van" : c.plural.replace("Mobile mechanics", "Mechanics")} href={`/app/results?category=${c.id}`} className="[&>span:first-child]:size-[64px]" />
              ))}
              <CategoryTile icon="LayoutGrid" label="All" href="/app/categories" className="[&>span:first-child]:size-[64px]" />
            </div>
          </section>

          {upcoming && (
            <section aria-labelledby="upcoming">
              <h2 id="upcoming" className="t-heading mb-3">
                Upcoming
              </h2>
              {(() => {
                const l = s.listings.find((x) => x.id === upcoming.listingId)!
                const svc = serviceById(s, upcoming.serviceId)
                return (
                  <Link href={`/app/bookings/${upcoming.id}`} className="card flex items-center gap-3 p-4 hover:border-blue">
                    <ListingAvatar initials={l.initials} hue={l.hue} size={48} />
                    <span className="min-w-0 flex-1">
                      <span className="block t-subhead truncate">{svc?.name}</span>
                      <span className="block t-label font-normal text-slate truncate">{l.name}</span>
                      <span className="mt-0.5 flex items-center gap-1 t-label text-navy tnum">
                        <Clock className="size-4 text-blue" aria-hidden />
                        {fmtRelDay(upcoming.startAt, s.clock)}, {fmtTime(upcoming.startAt)}
                      </span>
                    </span>
                    <StatusPill status={upcoming.status} />
                  </Link>
                )
              })()}
            </section>
          )}

          <section aria-labelledby="instant">
            <div className="mb-3 flex items-center justify-between">
              <h2 id="instant" className="t-heading">
                Responds instantly near you
              </h2>
              <Link href="/app/results?instant=1" className="inline-flex min-h-11 items-center t-label text-blue">
                See all
              </Link>
            </div>
            {carousel.length ? (
              <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
                {carousel.map((l) => {
                  const r = listingRating(s, l)
                  const cat = s.categories.find((c) => c.id === l.categoryIds[0])
                  const d = loc ? milesBetween(loc, l.geo) : null
                  return (
                    <Link key={l.id} href={`/app/b/${l.slug}`} className="card flex w-56 shrink-0 snap-start flex-col p-3.5 hover:border-blue">
                      <div className="flex items-center gap-2.5">
                        <ListingAvatar initials={l.initials} hue={l.hue} size={44} />
                        <span className="min-w-0">
                          <span className="block t-label font-semibold text-navy truncate">{l.name}</span>
                          <span className="block t-caption text-muted-ink">
                            {cat?.name}
                            {d !== null && <span className="tnum"> · {fmtMiles(d)}</span>}
                          </span>
                        </span>
                      </div>
                      <Rating value={r.rating} count={r.count} compact className="mt-2" />
                      <Badge kind="responds_instantly" className="mt-2 self-start" />
                    </Link>
                  )
                })}
              </div>
            ) : (
              <p className="card p-4 t-label font-normal text-slate">No desk-enabled businesses within 5 miles yet. Try a wider search.</p>
            )}
          </section>

          {recent.length > 0 && (
            <section aria-labelledby="recent">
              <h2 id="recent" className="t-heading mb-3">
                Recent searches
              </h2>
              <div className="flex flex-wrap gap-2">
                {recent.map((q) => (
                  <Link key={q} href={`/app/results?q=${encodeURIComponent(q)}`} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-white px-3.5 t-label text-navy hover:border-blue">
                    <Clock className="size-3.5 text-muted-ink" aria-hidden /> {q}
                  </Link>
                ))}
              </div>
            </section>
          )}

          <Link href="/app/ask" className="flex items-center gap-3 rounded-2xl bg-navy p-4 text-white hover:bg-[#163a72]">
            <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-white">
              <Mark size={34} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 t-subhead text-white">
                Not sure who you need? <Sparkles className="size-4 text-teal" aria-hidden />
              </span>
              <span className="block t-label font-normal text-white/85">Ask Answerd and we&apos;ll find the right business.</span>
            </span>
            <ArrowRight className="size-5 shrink-0" aria-hidden />
          </Link>
        </div>
      )}
    </AppScreen>
  )
}
