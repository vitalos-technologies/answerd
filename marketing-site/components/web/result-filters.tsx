"use client"
import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { fill } from "@/lib/fill"
import { focusRing } from "@/components/site/focus"

type Key = "instant" | "verified" | "rated"

/**
 * W-04 quick filters. The results are server-rendered; this island only sets data-f-* on the list (CSS in
 * globals.css hides what doesn't match) and announces how many are showing. Without JS every result shows.
 */
export function ResultFilters({ listId, labels, label, showing, none }: { listId: string; labels: Record<Key, string>; label: string; showing: string; none: string }) {
  const [on, setOn] = React.useState<Record<Key, boolean>>({ instant: false, verified: false, rated: false })
  const [status, setStatus] = React.useState("")

  const toggle = (k: Key) => {
    const next = { ...on, [k]: !on[k] }
    setOn(next)
    const list = document.getElementById(listId)
    if (!list) return
    ;(Object.keys(next) as Key[]).forEach((key) => {
      if (next[key]) list.setAttribute(`data-f-${key}`, "")
      else list.removeAttribute(`data-f-${key}`)
    })
    const items = Array.from(list.children) as HTMLElement[]
    const shown = items.filter((li) => getComputedStyle(li).display !== "none").length
    const any = Object.values(next).some(Boolean)
    setStatus(!any ? "" : shown ? fill(showing, { shown, total: items.length }) : none)
  }

  return (
    <div className="flex flex-col gap-3">
      <div role="group" aria-label={label} className="flex flex-wrap gap-2">
        {(Object.keys(labels) as Key[]).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={on[k]}
            onClick={() => toggle(k)}
            className={cn(
              "inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-[15px] font-medium transition-colors duration-150",
              on[k] ? "border-blue bg-blue-tint text-navy" : "border-line bg-white text-navy hover:border-blue/50",
              focusRing,
            )}
          >
            {on[k] && <Check className="size-4 text-blue" aria-hidden />}
            {labels[k]}
          </button>
        ))}
      </div>
      <p aria-live="polite" className="min-h-5 text-[14px] leading-5 text-muted-ink">
        {status}
      </p>
    </div>
  )
}
