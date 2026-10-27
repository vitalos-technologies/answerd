"use client"
import * as React from "react"
import { Phone } from "lucide-react"
import { googleResults, type LiveResult } from "@/lib/api/actions"
import { focusRing } from "@/components/site/focus"
import { fill } from "@/lib/fill"
import { pages } from "@/content/pages"
import { SectionTitle } from "./ui"

/*
 * API mode only. Google (places) results for a search, fetched after the page loads through a Server Action
 * (no-store), so Google details never end up in a cached or prerendered page. Every result shows Google's
 * attribution. Places results have no Answerd listing page: the only action is Call.
 */
export function GoogleResults({ query, heading }: { query: Parameters<typeof googleResults>[0]; heading: string }) {
  const [items, setItems] = React.useState<LiveResult[] | null>(null)
  const key = JSON.stringify(query)

  React.useEffect(() => {
    let live = true
    googleResults(JSON.parse(key)).then((r) => live && setItems(r.ok ? r.data : []))
    return () => {
      live = false
    }
  }, [key])

  const g = pages.google
  if (items === null)
    return (
      <p className="mt-10 text-[14px] leading-5 text-muted-ink" aria-live="polite">
        {g.loading}
      </p>
    )
  if (!items.length) return null
  return (
    <section className="mt-12" aria-labelledby="google-res-h" data-google-results="">
      <SectionTitle id="google-res-h" title={heading} />
      <p className="mt-1 text-[14px] leading-5 text-muted-ink">{g.intro}</p>
      <ul className="mt-5 grid gap-3">
        {items.map((i) => (
          <li key={i.key} className="flex min-w-0 items-center gap-4 rounded-2xl border border-line bg-white/70 p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[17px] leading-6 font-semibold text-navy">{i.name}</p>
              <p className="truncate text-[14px] leading-5 text-muted-ink">
                {i.categoryName}
                {i.distanceMiles != null && ` · ${fill(g.distance, { miles: i.distanceMiles.toFixed(1) })}`}
              </p>
              {i.rating != null && (
                <p className="tnum text-[14px] leading-5 text-slate">
                  {i.rating.toFixed(1)}★ ({i.reviewCount} · {g.attribution})
                </p>
              )}
            </div>
            {i.phone && (
              <a href={`tel:${i.phone}`} className={`inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border border-line px-4 font-semibold text-navy hover:border-blue ${focusRing}`}>
                <Phone className="size-4" aria-hidden /> {g.call}
              </a>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-right text-[12px] leading-4 text-muted-ink">{g.attribution}</p>
    </section>
  )
}
