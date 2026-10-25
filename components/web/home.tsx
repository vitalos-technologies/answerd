"use client"
import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { MapPin, Search as SearchIcon, Zap } from "lucide-react"
import { useStore } from "@/lib/store"
import { respondsInstantlyNear } from "@/lib/search"
import { listingRating } from "@/lib/selectors"
import { lookupPostcode, fmtMiles, milesBetween } from "@/lib/geo"
import { ListingAvatar } from "@/components/answerd/Media"
import { Rating } from "@/components/answerd/Rating"
import { Badge } from "@/components/answerd/Badges"
import { EmptyState } from "@/components/answerd/Feedback"
import { DataGate } from "@/components/app/helpers"
import { cn } from "@/lib/utils"

/** "What service do you need?" plus postcode. The postcode is guessed from the connection and editable. */
export function HeroSearch({ className, compact, initialQ = "", initialPostcode, hideHelp }: { className?: string; compact?: boolean; initialQ?: string; initialPostcode?: string | null; hideHelp?: boolean }) {
  const router = useRouter()
  const location = useStore((s) => s.session.location)
  const hydrated = useStore((s) => s.hydrated)
  const [q, setQ] = React.useState(initialQ)
  const [pc, setPc] = React.useState<string | null>(initialPostcode ?? null)
  const [error, setError] = React.useState("")
  const guessed = location ? location.postcode.split(" ")[0]! : "SE25"
  const postcode = pc ?? (hydrated ? guessed : "")
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const found = postcode.trim() ? lookupPostcode(postcode) : null
    if (postcode.trim() && !found) {
      setError("We don't recognise that postcode. Try SE25, CR0, B5 or M14.")
      return
    }
    setError("")
    if (found) useStore.getState().setLocation(found.postcode)
    const p = new URLSearchParams()
    if (q.trim()) p.set("q", q.trim())
    if (found) p.set("postcode", found.district)
    if (q.trim()) useStore.getState().recordSearch(q.trim())
    router.push(`/search${p.toString() ? `?${p}` : ""}`)
  }
  return (
    <form role="search" onSubmit={submit} className={cn("w-full", className)} aria-label="Find a local business">
      <div className={cn("flex flex-col gap-2 rounded-[28px] border border-line bg-white p-2 shadow-card sm:flex-row sm:items-center sm:rounded-full", compact && "shadow-none")}>
        <label className="flex h-12 min-w-0 flex-1 items-center gap-2.5 rounded-full pl-3 sm:pl-4">
          <SearchIcon className="size-5 shrink-0 text-navy" aria-hidden />
          <span className="sr-only">What service do you need?</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="What service do you need?" className="h-full min-w-0 flex-1 bg-transparent t-body text-navy outline-none placeholder:text-muted-ink" />
        </label>
        <span className="hidden h-8 w-px bg-line sm:block" aria-hidden />
        <label className="flex h-12 items-center gap-2 rounded-full bg-sky px-3 sm:w-40 sm:bg-transparent">
          <MapPin className="size-5 shrink-0 text-blue" aria-hidden />
          <span className="sr-only">Postcode</span>
          <input value={postcode} onChange={(e) => setPc(e.target.value)} placeholder="Postcode" aria-invalid={!!error} aria-describedby="hero-pc-help" className="h-full min-w-0 flex-1 bg-transparent t-body uppercase text-navy outline-none placeholder:normal-case placeholder:text-muted-ink" />
        </label>
        <button type="submit" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-blue px-6 t-label font-semibold text-white hover:bg-blue-hover">
          <SearchIcon className="size-5" aria-hidden /> Search
        </button>
      </div>
      <p id="hero-pc-help" className={cn("mt-2 px-3 t-caption", error ? "text-red" : "text-muted-ink", hideHelp && !error && "sr-only")} role={error ? "alert" : undefined}>
        {error || (location ? `Searching near ${location.label}. Change the postcode any time.` : "We guessed SE25 from your connection. Change it if that's wrong.")}
      </p>
    </form>
  )
}

/** "Businesses that respond instantly near you": desk-live listings within 5 miles. */
export function InstantNear() {
  const s = useStore()
  const list = respondsInstantlyNear(s, 5).slice(0, 6)
  const loc = s.session.location
  return (
    <DataGate isEmpty={!list.length} rows={3} empty={<EmptyState title="No instant responders nearby yet" body="Try another postcode, or ask Answerd to find someone." />}>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((l) => {
          const r = listingRating(s, l)
          const cat = s.categories.find((c) => c.id === l.categoryIds[0])
          return (
            <li key={l.id}>
              <Link href={`/b/${l.slug}`} className="card group flex h-full gap-3 p-4 hover:border-blue/40">
                <ListingAvatar listing={l} size={52} />
                <div className="min-w-0 flex-1">
                  <p className="truncate t-subhead group-hover:underline">{l.name}</p>
                  <p className="t-caption text-muted-ink">
                    {cat?.name}
                    {loc && <span className="tnum"> · {fmtMiles(milesBetween(loc, l.geo))}</span>}
                  </p>
                  <Rating value={r.rating} count={r.count} className="mt-1" />
                  <div className="mt-2 flex items-center gap-2">
                    <Badge kind="responds_instantly" />
                  </div>
                  <p className="mt-1.5 flex items-center gap-1 t-caption text-teal-ink">
                    <Zap className="size-3.5" aria-hidden /> Replies in under a minute
                  </p>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </DataGate>
  )
}
