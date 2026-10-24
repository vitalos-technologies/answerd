"use client"
import * as React from "react"
import Link from "next/link"
import { useStore } from "@/lib/store"
import { search, type SearchFilters } from "@/lib/search"
import { areaBySlug } from "@/lib/geo"
import { Chip } from "@/components/answerd/Fields"
import { EmptyState } from "@/components/answerd/Feedback"
import { DataGate } from "@/components/app/helpers"
import { WebResultCard } from "./WebResultCard"
import { AskAnswerdButton } from "./chrome"
import { nearbyAreas } from "./data"

const EVERYWHERE = 100_000

/**
 * W-04 results: live store data for a category in an area, with C-12 ranking and quick filters.
 * Thin areas (fewer than 3) also list businesses from neighbouring areas.
 */
export function AreaResults({ categoryId, areaSlug }: { categoryId: string; areaSlug: string }) {
  const s = useStore()
  const area = areaBySlug(areaSlug)!
  const [f, setF] = React.useState<SearchFilters>({})
  const all = search(s, "", { ...f, categoryId, withinMiles: EVERYWHERE })
  const inArea = all.filter((r) => area.districts.includes(r.listing.postcodeDistrict))
  const thin = inArea.length < 3
  const near = thin
    ? nearbyAreas(area).flatMap((a) => all.filter((r) => a.districts.includes(r.listing.postcodeDistrict) && !inArea.some((x) => x.listing.id === r.listing.id)).map((r) => ({ r, a })))
    : []
  const nearUnique = near.filter((x, i) => near.findIndex((y) => y.r.listing.id === x.r.listing.id) === i).slice(0, 6)
  const cat = s.categories.find((c) => c.id === categoryId)
  const set = (p: Partial<SearchFilters>) => setF((x) => ({ ...x, ...p }))

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filters">
        <Chip active={!!f.openNow} onClick={() => set({ openNow: !f.openNow })}>
          Open now
        </Chip>
        <Chip active={!!f.respondsInstantly} onClick={() => set({ respondsInstantly: !f.respondsInstantly })}>
          Responds instantly
        </Chip>
        <Chip active={!!f.verified} onClick={() => set({ verified: !f.verified })}>
          Verified
        </Chip>
        <Chip active={f.minRating === 4} onClick={() => set({ minRating: f.minRating === 4 ? undefined : 4 })}>
          4★ and up
        </Chip>
        <label className="ml-auto inline-flex items-center gap-2 t-caption text-muted-ink">
          Sort
          <select value={f.sort ?? "best"} onChange={(e) => set({ sort: e.target.value as SearchFilters["sort"] })} className="h-9 rounded-full border border-line bg-white px-3 t-label text-navy">
            <option value="best">Best match</option>
            <option value="nearest">Nearest</option>
            <option value="top">Top rated</option>
          </select>
        </label>
      </div>
      <p className="mt-4 t-label text-navy tnum" aria-live="polite">
        {inArea.length} {inArea.length === 1 ? (cat?.name.toLowerCase() ?? "business") : (cat?.plural.toLowerCase() ?? "businesses")} in {area.name}
      </p>
      <div className="mt-3">
        <DataGate
          isEmpty={!inArea.length && !nearUnique.length}
          rows={3}
          empty={
            <div className="card">
              <EmptyState title={`No ${cat?.plural.toLowerCase() ?? "businesses"} match yet`} body="Try fewer filters, or ask Answerd to look further afield." action={<AskAnswerdButton query={`${cat?.name ?? ""} ${area.name}`} />} />
            </div>
          }
        >
          <ul className="space-y-3">
            {inArea.map((r) => (
              <li key={r.listing.id}>
                <WebResultCard r={r} />
              </li>
            ))}
          </ul>
          {thin && nearUnique.length > 0 && (
            <section className="mt-8" aria-labelledby="nearby-res-h">
              <h2 id="nearby-res-h" className="t-subhead">
                {inArea.length ? "Also covering nearby areas" : `Nothing in ${area.name} yet. These cover nearby areas`}
              </h2>
              <ul className="mt-3 space-y-3">
                {nearUnique.map(({ r, a }) => (
                  <li key={r.listing.id}>
                    <p className="mb-1 t-caption text-muted-ink">
                      In <Link href={`/${cat?.slug}/${a.slug}`} className="text-blue hover:underline">{a.name}</Link>
                    </p>
                    <WebResultCard r={r} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </DataGate>
      </div>
    </div>
  )
}

/** W-03 "Featured businesses": the top-ranked claimed businesses in the category, live from the store. */
export function CategoryTop({ categoryId }: { categoryId: string }) {
  const s = useStore()
  const list = search(s, "", { categoryId, withinMiles: EVERYWHERE }).filter((r) => r.listing.layer === "claimed").slice(0, 4)
  return (
    <DataGate isEmpty={!list.length} rows={2} empty={<div className="card"><EmptyState title="No businesses have joined yet" body="Businesses from public records are listed by area below." /></div>}>
      <ul className="grid gap-3 md:grid-cols-2">
        {list.map((r) => (
          <li key={r.listing.id}>
            <WebResultCard r={r} />
          </li>
        ))}
      </ul>
    </DataGate>
  )
}
