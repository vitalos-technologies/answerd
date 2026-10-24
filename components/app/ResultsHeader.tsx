"use client"
import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, List, Map as MapIcon, SlidersHorizontal } from "lucide-react"
import { Chip } from "@/components/answerd/Fields"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { activeFilterCount, buildResultsParams, type ResultsQuery } from "./results"

export function resultsTitle(q: ResultsQuery, categories: { id: string; plural: string }[]) {
  if (q.q) return q.q.charAt(0).toUpperCase() + q.q.slice(1)
  if (q.category) return categories.find((c) => c.id === q.category)?.plural ?? "Results"
  return "All businesses"
}

/** Query and location header, List/Map toggle and filter chips (shared by C-12 and C-13). */
export function ResultsHeader({ query, view }: { query: ResultsQuery; view: "list" | "map" }) {
  const router = useRouter()
  const cats = useStore((s) => s.categories)
  const loc = useStore((s) => s.session.location)
  const f = query.filters
  const set = (patch: Partial<ResultsQuery["filters"]>) => {
    const next = { ...query, filters: { ...f, ...patch, bbox: view === "map" ? f.bbox : null } }
    router.replace(`/app/results${view === "map" ? "/map" : ""}${buildResultsParams(next)}`)
  }
  const params = buildResultsParams(query)
  const count = activeFilterCount(f)

  return (
    <div className="shrink-0 border-b border-line bg-white">
      <div className="flex items-center gap-1 px-2 pt-1">
        <button type="button" onClick={() => router.push("/app/search")} className="inline-flex size-11 items-center justify-center rounded-full text-navy hover:bg-sky" aria-label="Back to search">
          <ArrowLeft className="size-5" />
        </button>
        <Link href="/app/search" className="min-w-0 flex-1 rounded-xl px-1 py-1 hover:bg-sky">
          <h1 className="truncate t-subhead">{resultsTitle(query, cats)}</h1>
          <p className="truncate t-caption text-muted-ink">
            {loc ? `Near ${loc.postcode.split(" ")[0]} · ${loc.label}` : "Anywhere in the UK"}
            {f.withinMiles ? ` · within ${f.withinMiles} mi` : ""}
          </p>
        </Link>
        <div className="mr-1 inline-flex rounded-full bg-sky p-1" role="group" aria-label="View">
          <Link href={`/app/results${params}`} aria-current={view === "list" ? "page" : undefined} className={cn("inline-flex h-9 items-center gap-1 rounded-full px-3 t-label", view === "list" ? "bg-white text-navy shadow-card" : "text-slate")}>
            <List className="size-4" aria-hidden /> List
          </Link>
          <Link href={`/app/results/map${params}`} aria-current={view === "map" ? "page" : undefined} className={cn("inline-flex h-9 items-center gap-1 rounded-full px-3 t-label", view === "map" ? "bg-white text-navy shadow-card" : "text-slate")}>
            <MapIcon className="size-4" aria-hidden /> Map
          </Link>
        </div>
      </div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-2.5">
        <Link
          href={`/app/results/filters${params}${params ? "&" : "?"}from=${view}`}
          className={cn("inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 t-label", count ? "border-blue bg-blue-tint text-blue" : "border-line bg-white text-navy")}
        >
          <SlidersHorizontal className="size-4" aria-hidden /> Filters{count ? ` · ${count}` : ""}
        </Link>
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
        <Chip active={f.withinMiles === 5} onClick={() => set({ withinMiles: f.withinMiles === 5 ? undefined : 5 })}>
          Within 5 mi
        </Chip>
      </div>
    </div>
  )
}
