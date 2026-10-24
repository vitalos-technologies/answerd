"use client"
import Link from "next/link"
import { ChevronRight, ListChecks } from "lucide-react"
import { useStore } from "@/lib/store"
import { setupProgress, setupSteps } from "@/components/app/biz"
import type { Business, Listing } from "@/lib/types"
import { useOpsLinks } from "./links"

/**
 * B-18's setup checklist card, shown until setup is complete.
 * Stand-in for B-09's SetupChecklistCard (components/biz/profile/) so the lead can swap it in.
 */
export function SetupCard({ biz, listing }: { biz: Business; listing: Listing }) {
  const s = useStore()
  const links = useOpsLinks()
  const steps = setupSteps(s, biz, listing)
  const pct = setupProgress(steps)
  if (pct >= 100) return null
  const req = steps.filter((x) => !x.optional)
  const next = req.find((x) => !x.done)
  return (
    <section className="card p-4" aria-labelledby="setup-card">
      <div className="flex items-center gap-3">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-tint text-blue">
          <ListChecks className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="setup-card" className="t-subhead">
            Finish setting up
          </h2>
          <p className="t-caption text-muted-ink tnum">
            {req.filter((x) => x.done).length} of {req.length} done · {pct}%
          </p>
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-sky" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Setup progress">
        <div className="h-full rounded-full bg-blue" style={{ width: `${pct}%` }} />
      </div>
      {next && (
        <Link href={next.href} className="mt-3 flex min-h-11 items-center gap-2 rounded-xl bg-sky px-3 hover:bg-blue-tint">
          <span className="flex-1 t-label text-navy">
            Next: {next.label}
            <span className="block t-caption font-normal text-muted-ink">{next.sub}</span>
          </span>
          <ChevronRight className="size-4 text-muted-ink" aria-hidden />
        </Link>
      )}
      <Link href={links.setup} className="mt-2 inline-flex min-h-11 items-center t-label text-blue hover:underline">
        See the full checklist
      </Link>
    </section>
  )
}
