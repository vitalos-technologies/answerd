"use client"
import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { SlidersHorizontal, X } from "lucide-react"
import { useStore } from "@/lib/store"
import { search, placesHidden, type SearchFilters } from "@/lib/search"
import { isDeskLive } from "@/lib/selectors"
import { lookupPostcode } from "@/lib/geo"
import type { PriceType } from "@/lib/types"
import { parseResultsParams, buildResultsParams, activeFilterCount, type ResultsQuery } from "@/components/app/results"
import { MockMap } from "@/components/answerd/MockMap"
import { Chip } from "@/components/answerd/Fields"
import { Banner, EmptyState, ErrorState, ListSkeleton } from "@/components/answerd/Feedback"
import { Button } from "@/components/answerd/Button"
import { WebResultCard } from "./WebResultCard"
import { HeroSearch } from "./home"
import { AskAnswerdButton } from "./chrome"
import { Container } from "./ui"
import { cn } from "@/lib/utils"

const CREDS: [NonNullable<SearchFilters["credentials"]>[number], string][] = [
  ["gas_safe", "Gas Safe"],
  ["niceic", "NICEIC"],
  ["insurance", "Insured"],
  ["dbs", "DBS checked"],
]
const PRICES: [PriceType, string][] = [
  ["fixed", "Fixed price"],
  ["from", "From price"],
  ["hourly", "Hourly"],
  ["quote", "Quote"],
]
const toggle = <T,>(list: T[] | undefined, v: T) => (list?.includes(v) ? list.filter((x) => x !== v) : [...(list ?? []), v])

/** Filters as on C-14 (distance, availability, rating, credentials, price type) in a desktop layout. */
function FilterBar({ query, update, reset }: { query: ResultsQuery; update: (p: Partial<SearchFilters>) => void; reset: () => void }) {
  const [more, setMore] = React.useState(false)
  const f = query.filters
  const n = activeFilterCount(f)
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Quick filters">
        <Chip active={!!f.openNow} onClick={() => update({ openNow: !f.openNow })}>
          Open now
        </Chip>
        <Chip active={!!f.respondsInstantly} onClick={() => update({ respondsInstantly: !f.respondsInstantly })}>
          Responds instantly
        </Chip>
        <Chip active={!!f.verified} onClick={() => update({ verified: !f.verified })}>
          Verified
        </Chip>
        <Chip active={f.minRating === 4} onClick={() => update({ minRating: f.minRating === 4 ? undefined : 4 })}>
          4★ and up
        </Chip>
        <Chip active={f.withinMiles === 5} onClick={() => update({ withinMiles: f.withinMiles === 5 ? undefined : 5 })}>
          Within 5 mi
        </Chip>
        <button type="button" onClick={() => setMore((m) => !m)} aria-expanded={more} aria-controls="all-filters" className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-white px-3.5 t-label text-navy hover:border-blue">
          <SlidersHorizontal className="size-4" aria-hidden /> All filters{n ? <span className="tnum"> ({n})</span> : null}
        </button>
        {n > 0 && (
          <button type="button" onClick={reset} className="inline-flex h-9 items-center gap-1 rounded-full px-3 t-label text-blue hover:bg-blue-tint">
            <X className="size-4" aria-hidden /> Clear
          </button>
        )}
      </div>
      {more && (
        <div id="all-filters" className="card mt-3 grid gap-5 p-5 md:grid-cols-2 lg:grid-cols-3">
          <fieldset>
            <legend className="t-label text-navy">Distance</legend>
            <label className="mt-2 flex items-center gap-3">
              <input type="range" min={1} max={25} step={1} value={f.withinMiles ?? 25} onChange={(e) => update({ withinMiles: Number(e.target.value) === 25 ? undefined : Number(e.target.value) })} className="w-full accent-[#2563FF]" aria-label="Distance in miles" />
              <span className="w-14 shrink-0 text-right t-label text-navy tnum">{f.withinMiles ?? 25} mi</span>
            </label>
          </fieldset>
          <fieldset>
            <legend className="t-label text-navy">Availability</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              <Chip active={f.availability === "today"} onClick={() => update({ availability: f.availability === "today" ? null : "today" })}>
                Today
              </Chip>
              <Chip active={f.availability === "this_week"} onClick={() => update({ availability: f.availability === "this_week" ? null : "this_week" })}>
                This week
              </Chip>
            </div>
          </fieldset>
          <fieldset>
            <legend className="t-label text-navy">Rating</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {[3, 4, 4.5].map((r) => (
                <Chip key={r} active={f.minRating === r} onClick={() => update({ minRating: f.minRating === r ? undefined : r })}>
                  {r}★ and up
                </Chip>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="t-label text-navy">Credentials</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {CREDS.map(([k, label]) => (
                <Chip key={k} active={!!f.credentials?.includes(k)} onClick={() => update({ credentials: toggle(f.credentials, k) })}>
                  {label}
                </Chip>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="t-label text-navy">Price type</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {PRICES.map(([k, label]) => (
                <Chip key={k} active={!!f.priceTypes?.includes(k)} onClick={() => update({ priceTypes: toggle(f.priceTypes, k) })}>
                  {label}
                </Chip>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="t-label text-navy">Sort</legend>
            <select value={f.sort ?? "best"} onChange={(e) => update({ sort: e.target.value as SearchFilters["sort"] })} className="mt-2 h-11 w-full rounded-xl border border-line bg-white px-3 t-label text-navy">
              <option value="best">Best match</option>
              <option value="nearest">Nearest</option>
              <option value="top">Top rated</option>
            </select>
          </fieldset>
        </div>
      )}
    </div>
  )
}

/** W-02: list left, map right at 1024 and up (stacked on mobile); same ranking and filters as C-12. */
function SearchInner() {
  const router = useRouter()
  const sp = useSearchParams()
  const query = React.useMemo(() => parseResultsParams(new URLSearchParams(sp.toString())), [sp])
  const postcodeParam = sp.get("postcode")
  const s = useStore()
  const [sel, setSel] = React.useState<string | null>(null)

  // A shared link with ?postcode= sets the search location once the store has loaded.
  React.useEffect(() => {
    if (!s.hydrated || !postcodeParam) return
    const pc = lookupPostcode(postcodeParam)
    if (pc && s.session.location?.postcode.split(" ")[0] !== pc.district) s.setLocation(pc.postcode)
  }, [s, postcodeParam])

  const results = React.useMemo(() => search(s, query.q, query.filters), [s, query])
  const override = s.stateOverride
  const shown = override === "empty" ? [] : results
  const within = query.filters.withinMiles ?? 25
  const extra = postcodeParam ? `&postcode=${encodeURIComponent(postcodeParam)}` : ""
  const go = (q: ResultsQuery) => {
    const qs = buildResultsParams(q)
    router.replace(`/search${qs}${qs ? extra : extra.replace("&", "?")}`, { scroll: false })
  }
  const update = (patch: Partial<SearchFilters>) => go({ ...query, filters: { ...query.filters, ...patch } })
  const reset = () => go({ q: query.q, category: query.category, filters: { categoryId: query.category } })
  const cat = query.category ? s.categories.find((c) => c.id === query.category) : null
  const loc = s.session.location
  const heading = query.q ? `“${query.q}”` : cat ? cat.plural : "All local businesses"
  const center = loc ? { lat: loc.lat, lng: loc.lng } : undefined

  return (
    <>
      <div className="border-b border-line bg-white">
        <Container className="py-5">
          <HeroSearch key={`${query.q}|${postcodeParam ?? ""}`} initialQ={query.q} initialPostcode={postcodeParam} compact hideHelp className="max-w-3xl" />
        </Container>
      </div>
      <Container className="py-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="t-title break-words">{heading}</h1>
            <p className="mt-1 t-label font-normal text-slate tnum" aria-live="polite">
              {override === "loading" ? "Searching…" : `${shown.length} ${shown.length === 1 ? "result" : "results"}`}
              {loc ? ` near ${loc.label} (${loc.postcode.split(" ")[0]})` : " across the UK"}
            </p>
          </div>
        </div>
        <div className="mt-4">
          <FilterBar query={query} update={update} reset={reset} />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px] xl:grid-cols-[minmax(0,1fr)_480px]">
          <div className="min-w-0 lg:order-1">
            {override === "loading" ? (
              <ListSkeleton rows={4} />
            ) : override === "error" ? (
              <ErrorState onRetry={() => s.setStateOverride("none")} />
            ) : shown.length === 0 ? (
              <div className="card">
                <EmptyState
                  title="No businesses match yet"
                  body="Try fewer filters or a wider area, or describe the job and Answerd will find someone."
                  action={
                    <div className="flex flex-col items-center gap-2">
                      <AskAnswerdButton query={query.q}>Ask Answerd instead</AskAnswerdButton>
                      {activeFilterCount(query.filters) > 0 && (
                        <Button variant="ghost" size="md" onClick={reset}>
                          Clear filters
                        </Button>
                      )}
                    </div>
                  }
                />
              </div>
            ) : (
              <>
                {shown.length < 3 && within < 25 && (
                  <Banner tone="info" className="mb-4" title={`Only ${shown.length} within ${within} miles`} action={<Button size="sm" variant="secondary" onClick={() => update({ withinMiles: within < 10 ? 10 : 25 })}>Widen to {within < 10 ? 10 : 25} miles</Button>} />
                )}
                {shown.length < 3 && within >= 25 && (
                  <Banner tone="info" className="mb-4" title={`Only ${shown.length} nearby`}>
                    Few businesses cover this yet. Try a nearby postcode or ask Answerd.
                  </Banner>
                )}
                {placesHidden(s) && (
                  <Banner tone="warning" className="mb-4" title="Showing Answerd businesses only">
                    Google results are paused for today.
                  </Banner>
                )}
                <ul className="space-y-3">
                  {shown.map((r) => (
                    <li key={r.listing.id}>
                      <WebResultCard r={r} id={`card-${r.listing.id}`} selected={sel === r.listing.id} onSelect={() => setSel(r.listing.id)} />
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
          <div className={cn("-order-1 lg:order-2", override !== "none" && "max-lg:hidden")}>
            <div className="lg:sticky lg:top-24">
              <div className="h-[260px] sm:h-[320px] lg:h-[calc(100dvh-8rem)]">
              <MockMap
                height="100%"
                center={shown.length ? undefined : center}
                spanMiles={6}
                points={shown.map((r) => ({ id: r.listing.id, lat: r.listing.geo.lat, lng: r.listing.geo.lng, desk: isDeskLive(s, r.listing), label: `${r.listing.name}${r.distance !== null ? `, ${r.distance.toFixed(1)} miles` : ""}` }))}
                selectedId={sel}
                onSelect={(id) => {
                  setSel(id)
                  document.getElementById(`card-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })
                }}
                onSearchArea={(box) => update({ bbox: box })}
                ariaLabel="Map of results. The list has the same businesses."
              />
              </div>
              {query.filters.bbox && (
                <button type="button" onClick={() => update({ bbox: null })} className="mt-2 inline-flex h-11 items-center gap-1 rounded-full px-3 t-label text-blue hover:bg-blue-tint">
                  <X className="size-4" aria-hidden /> Clear map area
                </button>
              )}
            </div>
          </div>
        </div>
      </Container>
    </>
  )
}

export function SearchPage() {
  return (
    <React.Suspense fallback={<Container className="py-10"><ListSkeleton rows={4} /></Container>}>
      <SearchInner />
    </React.Suspense>
  )
}
