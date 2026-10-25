"use client"
import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AppScreen } from "@/components/shells/AppScreen"
import { ResultsHeader } from "@/components/app/ResultsHeader"
import { ResultRow, parseResultsParams, buildResultsParams } from "@/components/app/results"
import { MockMap } from "@/components/answerd/MockMap"
import { EmptyState } from "@/components/answerd/Feedback"
import { ButtonLink } from "@/components/answerd/Button"
import { withSuspense } from "@/components/app/helpers"
import { useStore } from "@/lib/store"
import { search } from "@/lib/search"
import { isDeskLive } from "@/lib/selectors"
import { DISTRICTS } from "@/lib/geo"

/** C-13: same result set as C-12; pins and the bottom carousel stay in sync. */
function ResultsMap() {
  const router = useRouter()
  const sp = useSearchParams()
  const query = React.useMemo(() => parseResultsParams(new URLSearchParams(sp.toString())), [sp])
  const s = useStore()
  const results = React.useMemo(() => search(s, query.q, query.filters), [s, query])
  const [selected, setSelected] = React.useState<string | null>(null)
  const sel = selected ?? results[0]?.listing.id ?? null
  const rail = React.useRef<HTMLDivElement>(null)
  const loc = s.session.location
  // Fit to all results on open (48 px padding, plus the carousel at the bottom); with none, centre on the location
  const center = results.length ? undefined : loc ? { lat: loc.lat, lng: loc.lng } : DISTRICTS.SE25

  const pick = (id: string) => {
    setSelected(id)
    const el = document.getElementById(`card-${id}`)
    if (el && rail.current) rail.current.scrollTo({ left: el.offsetLeft - 16, behavior: "smooth" })
  }

  return (
    <AppScreen id="C-13" tabs="customer" header={<ResultsHeader query={query} view="map" />} bodyClassName="overflow-hidden">
      <div className="relative h-full">
        <MockMap
          className="absolute inset-0 rounded-none border-0"
          height="100%"
          center={center}
          spanMiles={4}
          // 48 px padding, plus the pin height above each point, the zoom buttons on the right and the carousel below
          fitPadding={{ top: 48 + 32, right: 48 + 16, bottom: 48 + 128, left: 48 }}
          points={results.map((r) => ({ id: r.listing.id, lat: r.listing.geo.lat, lng: r.listing.geo.lng, desk: isDeskLive(s, r.listing), label: `${r.listing.name}${r.distance !== null ? `, ${r.distance.toFixed(1)} miles` : ""}` }))}
          selectedId={sel}
          onSelect={pick}
          onSearchArea={(box) => router.replace(`/app/results/map${buildResultsParams({ ...query, filters: { ...query.filters, bbox: box } })}`)}
        />
        {query.filters.bbox && (
          <button
            type="button"
            onClick={() => router.replace(`/app/results/map${buildResultsParams({ ...query, filters: { ...query.filters, bbox: null } })}`)}
            className="absolute left-3 top-3 z-10 inline-flex h-9 items-center rounded-full bg-navy px-3.5 t-caption text-white shadow-card"
          >
            Searching this area · Clear
          </button>
        )}
        <div className="absolute inset-x-0 bottom-3 z-10">
          {results.length ? (
            <div ref={rail} className="no-scrollbar relative flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1" aria-label="Results">
              {results.map((r) => (
                <div
                  key={r.listing.id}
                  id={`card-${r.listing.id}`}
                  className="w-[300px] shrink-0 snap-center"
                  onPointerEnter={() => setSelected(r.listing.id)}
                  onFocusCapture={() => setSelected(r.listing.id)}
                >
                  <ResultRow r={r} selected={sel === r.listing.id} />
                </div>
              ))}
            </div>
          ) : (
            <div className="mx-4 card">
              <EmptyState title="Nothing in this area" body="Move the map or zoom out, then search this area." action={<ButtonLink href={`/app/ask${query.q ? `?q=${encodeURIComponent(query.q)}` : ""}`} size="md">Ask Answerd instead</ButtonLink>} className="py-6" />
            </div>
          )}
        </div>
      </div>
    </AppScreen>
  )
}

export default withSuspense(ResultsMap)
