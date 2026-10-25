"use client"
import * as React from "react"
import { Search } from "lucide-react"
import { fill } from "@/lib/fill"

/**
 * W-20 search over the server-rendered articles: hides those that don't contain every word typed (and any
 * group left empty), and announces the count. Without JS all articles show.
 */
export function HelpSearch({ targetId, label, placeholder, count, countFor, none }: { targetId: string; label: string; placeholder: string; count: string; countFor: string; none: string }) {
  const [status, setStatus] = React.useState("")
  const onChange = (q: string) => {
    const root = document.getElementById(targetId)
    if (!root) return
    const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean)
    let shown = 0
    root.querySelectorAll<HTMLElement>("[data-help]").forEach((el) => {
      const hit = words.every((w) => (el.dataset.help ?? "").includes(w))
      el.hidden = !hit
      if (hit) shown++
    })
    root.querySelectorAll<HTMLElement>("[data-help-group]").forEach((g) => {
      g.hidden = !g.querySelector("[data-help]:not([hidden])")
    })
    setStatus(!words.length ? fill(count, { n: shown }) : shown ? fill(countFor, { n: shown, q: q.trim() }) : none)
  }
  return (
    <form role="search" className="mt-6 max-w-2xl" onSubmit={(e) => e.preventDefault()}>
      <label htmlFor="help-q" className="sr-only">
        {label}
      </label>
      <div className="flex h-14 items-center gap-2.5 rounded-full border border-line bg-white px-5 shadow-card focus-within:border-blue focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-blue">
        <Search className="size-5 shrink-0 text-navy" aria-hidden />
        <input id="help-q" type="search" placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="h-full min-w-0 flex-1 bg-transparent text-base text-navy outline-none placeholder:text-muted-ink" />
      </div>
      <p aria-live="polite" className="mt-2 min-h-5 px-5 text-[14px] leading-5 text-muted-ink">
        {status}
      </p>
    </form>
  )
}
