"use client"
import * as React from "react"
import Link from "next/link"
import { use } from "react"
import { Flag } from "lucide-react"
import { AppScreen, TopBar } from "@/components/shells/AppScreen"
import { Rating, Stars } from "@/components/answerd/Rating"
import { EmptyState } from "@/components/answerd/Feedback"
import { Chip } from "@/components/answerd/Fields"
import { DataGate } from "@/components/app/helpers"
import { useStore } from "@/lib/store"
import { listingBySlug, listingRating } from "@/lib/selectors"
import { fmtDateYear } from "@/lib/time"

/** C-19: average, distribution, filter by stars, sort, review cards with business replies. */
export default function ReviewsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const s = useStore()
  const listing = listingBySlug(s, slug)
  const [stars, setStars] = React.useState<number | null>(null)
  const [sort, setSort] = React.useState<"new" | "high" | "low">("new")
  const [limit, setLimit] = React.useState(20)
  if (!listing) return <AppScreen id="C-19" header={<TopBar title="Reviews" back />}>{null}</AppScreen>
  const all = s.reviews.filter((r) => r.listingId === listing.id && r.status === "live")
  const rating = listingRating(s, listing)
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, c: all.filter((r) => r.stars === n).length }))
  const list = all
    .filter((r) => !stars || r.stars === stars)
    .sort((a, b) => (sort === "new" ? b.createdAt.localeCompare(a.createdAt) : sort === "high" ? b.stars - a.stars : a.stars - b.stars))

  return (
    <AppScreen id="C-19" header={<TopBar title="Reviews" subtitle={listing.name} back />}>
      {listing.layer === "places" ? (
        <div className="p-4">
          <div className="card p-4">
            <Rating value={rating.rating} count={rating.count} google />
            <p className="mt-2 t-label font-normal text-slate">These ratings come from Google. Answerd reviews appear once the business joins.</p>
            <p className="mt-1 text-[11px] text-muted-ink">Powered by Google</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3 p-4">
          <div className="card flex gap-5 p-4">
            <div className="text-center">
              <p className="text-[40px] font-bold leading-none text-navy tnum">{rating.count ? rating.rating.toFixed(1) : "–"}</p>
              <Stars value={rating.rating} className="mt-1.5" />
              <p className="mt-1 t-caption text-muted-ink tnum">{rating.count} reviews</p>
            </div>
            <ul className="flex-1 space-y-1" aria-label="Rating distribution">
              {dist.map(({ n, c }) => (
                <li key={n} className="flex items-center gap-2 t-caption text-slate">
                  <span className="w-3 tnum">{n}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-sky">
                    <span className="block h-full rounded-full bg-amber" style={{ width: `${all.length ? (c / all.length) * 100 : 0}%` }} />
                  </span>
                  <span className="w-7 text-right tnum">{c}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
            <Chip active={stars === null} onClick={() => setStars(null)}>
              All
            </Chip>
            {[5, 4, 3, 2, 1].map((n) => (
              <Chip key={n} active={stars === n} onClick={() => setStars(stars === n ? null : n)}>
                {n}★
              </Chip>
            ))}
            <label className="ml-auto inline-flex shrink-0 items-center gap-1 t-caption text-muted-ink">
              <span className="sr-only">Sort</span>
              <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="h-9 rounded-full border border-line bg-white px-3 t-label text-navy">
                <option value="new">Newest</option>
                <option value="high">Highest</option>
                <option value="low">Lowest</option>
              </select>
            </label>
          </div>
          <DataGate isEmpty={!list.length} empty={<EmptyState title={all.length ? "No reviews with that rating" : "No reviews yet"} body={all.length ? "Try another filter." : "Be the first after your booking."} />}>
            <ul className="space-y-3">
              {list.slice(0, limit).map((r) => (
                <li key={r.id} className="card p-4">
                  <div className="flex items-center gap-2">
                    <Stars value={r.stars} />
                    <span className="t-label text-navy">{r.authorName}</span>
                    <span className="ml-auto t-caption text-muted-ink">{fmtDateYear(r.createdAt)}</span>
                  </div>
                  <p className="mt-2 t-body text-slate">{r.text}</p>
                  {r.aspects && (
                    <p className="mt-2 t-caption text-muted-ink tnum">
                      Quality {r.aspects.quality ?? "–"} · Punctuality {r.aspects.punctuality ?? "–"} · Value {r.aspects.value ?? "–"} · Communication {r.aspects.communication ?? "–"}
                    </p>
                  )}
                  {r.reply && (
                    <div className="mt-3 rounded-xl bg-sky px-3 py-2">
                      <p className="t-caption text-navy">Reply from {listing.name}</p>
                      <p className="t-label font-normal text-slate">{r.reply.body}</p>
                    </div>
                  )}
                  <Link href={`/app/report?target=review&id=${r.id}`} className="mt-2 inline-flex min-h-11 items-center gap-1 t-caption text-muted-ink hover:text-navy">
                    <Flag className="size-3.5" aria-hidden /> Report review
                  </Link>
                </li>
              ))}
            </ul>
            {list.length > limit && (
              <button type="button" onClick={() => setLimit((l) => l + 20)} className="mt-2 h-11 w-full rounded-full border border-line bg-white t-label text-navy hover:bg-sky">
                Show more reviews
              </button>
            )}
          </DataGate>
        </div>
      )}
    </AppScreen>
  )
}
