"use client"
import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AppScreen } from "@/components/shells/AppScreen"
import { RouteSheet } from "@/components/app/RouteSheet"
import { Button } from "@/components/answerd/Button"
import { Chip } from "@/components/answerd/Fields"
import { Slider } from "@/components/ui/slider"
import { withSuspense } from "@/components/app/helpers"
import { parseResultsParams, buildResultsParams, type ResultsQuery } from "@/components/app/results"
import { useStore } from "@/lib/store"
import { search, type SearchFilters } from "@/lib/search"
import type { PriceType } from "@/lib/types"

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-b border-line py-4 last:border-0">
      <legend className="mb-3 t-subhead">{title}</legend>
      {children}
    </fieldset>
  )
}

/** C-14: live count as filters change; Reset clears. */
function FiltersSheet() {
  const router = useRouter()
  const sp = useSearchParams()
  const from = sp.get("from") === "map" ? "/map" : ""
  const initial = React.useMemo(() => parseResultsParams(new URLSearchParams(sp.toString())), [sp])
  const [f, setF] = React.useState<SearchFilters>(initial.filters)
  const s = useStore()
  const query: ResultsQuery = { ...initial, filters: f }
  const count = React.useMemo(() => search(s, initial.q, f).length, [s, initial.q, f])
  const set = (patch: Partial<SearchFilters>) => setF((x) => ({ ...x, ...patch }))
  const toggle = <T extends string>(arr: T[] | undefined, v: T) => (arr?.includes(v) ? arr.filter((x) => x !== v) : [...(arr ?? []), v])
  const close = () => router.replace(`/app/results${from}${buildResultsParams(initial)}`)

  return (
    <AppScreen id="C-14">
      <RouteSheet
        title="Filters"
        onClose={close}
        backdrop={<div className="h-full bg-sky" />}
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setF({ categoryId: initial.filters.categoryId, sort: f.sort })}>
              Reset
            </Button>
            <Button className="flex-[2] tnum" onClick={() => router.replace(`/app/results${from}${buildResultsParams(query)}`)}>
              Show {count} {count === 1 ? "result" : "results"}
            </Button>
          </div>
        }
      >
        <Group title="Distance">
          <div className="flex items-center justify-between t-label text-navy">
            <span>Within</span>
            <span className="tnum">{f.withinMiles ?? 25} miles</span>
          </div>
          <Slider className="mt-3 [&_[data-slot=slider-range]]:bg-blue [&_[data-slot=slider-thumb]]:size-6 [&_[data-slot=slider-thumb]]:border-blue" min={1} max={25} step={1} value={[f.withinMiles ?? 25]} onValueChange={([v]) => set({ withinMiles: v === 25 ? undefined : v })} aria-label="Distance in miles" />
          <div className="mt-1 flex justify-between t-caption text-muted-ink">
            <span>1 mi</span>
            <span>25 mi</span>
          </div>
        </Group>
        <Group title="Availability">
          <div className="flex flex-wrap gap-2">
            <Chip active={f.availability === "today"} onClick={() => set({ availability: f.availability === "today" ? null : "today" })}>
              Today
            </Chip>
            <Chip active={f.availability === "this_week"} onClick={() => set({ availability: f.availability === "this_week" ? null : "this_week" })}>
              This week
            </Chip>
            <Chip active={!!f.openNow} onClick={() => set({ openNow: !f.openNow })}>
              Open now
            </Chip>
            <Chip active={!!f.respondsInstantly} onClick={() => set({ respondsInstantly: !f.respondsInstantly })}>
              Responds instantly
            </Chip>
          </div>
        </Group>
        <Group title="Rating">
          <div className="flex flex-wrap gap-2">
            {[undefined, 3, 4, 4.5].map((r) => (
              <Chip key={String(r)} active={f.minRating === r} onClick={() => set({ minRating: r })}>
                {r ? `${r}★ and up` : "Any"}
              </Chip>
            ))}
          </div>
        </Group>
        <Group title="Credentials">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["gas_safe", "Gas Safe"],
                ["niceic", "NICEIC"],
                ["insurance", "Insured"],
                ["dbs", "DBS checked"],
              ] as const
            ).map(([k, label]) => (
              <Chip key={k} active={!!f.credentials?.includes(k)} onClick={() => set({ credentials: toggle(f.credentials, k) })}>
                {label}
              </Chip>
            ))}
            <Chip active={!!f.verified} onClick={() => set({ verified: !f.verified })}>
              Verified business
            </Chip>
          </div>
        </Group>
        <Group title="Price type">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["fixed", "Fixed price"],
                ["from", "From price"],
                ["hourly", "Hourly"],
                ["quote", "Quote"],
              ] as [PriceType, string][]
            ).map(([k, label]) => (
              <Chip key={k} active={!!f.priceTypes?.includes(k)} onClick={() => set({ priceTypes: toggle(f.priceTypes, k) })}>
                {label}
              </Chip>
            ))}
          </div>
        </Group>
      </RouteSheet>
    </AppScreen>
  )
}

export default withSuspense(FiltersSheet)
