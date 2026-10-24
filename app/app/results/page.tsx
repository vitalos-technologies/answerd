"use client"
import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AppScreen } from "@/components/shells/AppScreen"
import { ResultsHeader } from "@/components/app/ResultsHeader"
import { ResultRow, parseResultsParams, buildResultsParams } from "@/components/app/results"
import { Banner, EmptyState, ErrorState, ListSkeleton } from "@/components/answerd/Feedback"
import { Button, ButtonLink } from "@/components/answerd/Button"
import { withSuspense } from "@/components/app/helpers"
import { useStore } from "@/lib/store"
import { search, placesHidden } from "@/lib/search"
import type { SearchFilters } from "@/lib/search"

function SortSelect({ value, onChange }: { value: SearchFilters["sort"]; onChange: (v: SearchFilters["sort"]) => void }) {
  return (
    <label className="inline-flex items-center gap-1.5 t-caption text-muted-ink">
      Sort
      <select value={value ?? "best"} onChange={(e) => onChange(e.target.value as SearchFilters["sort"])} className="h-9 rounded-full border border-line bg-white px-3 t-label text-navy">
        <option value="best">Best match</option>
        <option value="nearest">Nearest</option>
        <option value="top">Top rated</option>
      </select>
    </label>
  )
}

/** C-12: Featured first (labelled), then desk-enabled and verified, other claimed, seeded and Places. */
function ResultsList() {
  const router = useRouter()
  const sp = useSearchParams()
  const query = React.useMemo(() => parseResultsParams(new URLSearchParams(sp.toString())), [sp])
  const s = useStore()
  const results = React.useMemo(() => search(s, query.q, query.filters), [s, query])
  const override = s.stateOverride
  const shown = override === "empty" ? [] : results
  const within = query.filters.withinMiles ?? 25
  const update = (patch: Partial<SearchFilters>) => router.replace(`/app/results${buildResultsParams({ ...query, filters: { ...query.filters, ...patch } })}`)

  return (
    <AppScreen id="C-12" tabs="customer" header={<ResultsHeader query={query} view="list" />}>
      <div className="px-4 py-3">
        {override === "loading" ? (
          <ListSkeleton rows={4} />
        ) : override === "error" ? (
          <ErrorState onRetry={() => s.setStateOverride("none")} />
        ) : shown.length === 0 ? (
          <EmptyState
            title="No businesses match yet"
            body="Try fewer filters or a wider area, or describe the job and Answerd will find someone."
            action={
              <div className="flex flex-col gap-2">
                <ButtonLink href={`/app/ask${query.q ? `?q=${encodeURIComponent(query.q)}` : ""}`} size="md">
                  Ask Answerd instead
                </ButtonLink>
                <Button variant="ghost" size="md" onClick={() => router.replace(`/app/results${buildResultsParams({ q: query.q, category: query.category, filters: { categoryId: query.category } })}`)}>
                  Clear filters
                </Button>
              </div>
            }
          />
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between">
              <p className="t-label text-navy tnum" aria-live="polite">
                {shown.length} {shown.length === 1 ? "result" : "results"}
              </p>
              <SortSelect value={query.filters.sort} onChange={(v) => update({ sort: v })} />
            </div>
            {shown.length < 3 && within < 25 && (
              <Banner
                tone="info"
                className="mb-3"
                title={`Only ${shown.length} within ${within} miles`}
                action={
                  <Button size="sm" variant="secondary" onClick={() => update({ withinMiles: within < 10 ? 10 : 25 })}>
                    Widen to {within < 10 ? 10 : 25} miles
                  </Button>
                }
              />
            )}
            {shown.length < 3 && within >= 25 && (
              <Banner tone="info" className="mb-3" title={`Only ${shown.length} nearby`} action={<ButtonLink href="/app/location?next=/app/results" size="sm" variant="secondary">Change location</ButtonLink>}>
                Few businesses cover this yet. Try a nearby postcode or ask Answerd.
              </Banner>
            )}
            {placesHidden(s) && (
              <Banner tone="warning" className="mb-3" title="Showing Answerd businesses only">
                Google results are paused for today.
              </Banner>
            )}
            <ul className="space-y-3">
              {shown.map((r) => (
                <li key={r.listing.id}>
                  <ResultRow r={r} />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </AppScreen>
  )
}

export default withSuspense(ResultsList)
