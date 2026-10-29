"use client"
import * as React from "react"
import { CalendarCheck, Play, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import type { pages } from "@/content/pages"
import { Mark } from "@/components/brand/Mark"
import { btnSecondary } from "./form"

type Copy = (typeof pages)["forBusinesses"]

/**
 * W-09 AI desk demo player: a sample call as a transcript that plays line by line. No audio and no real call;
 * it is labelled as a sample. Under reduced motion, or before Play, the whole transcript is readable at once.
 */
export function DeskDemo({ copy }: { copy: Copy }) {
  const lines = copy.demoLines
  const [shown, setShown] = React.useState<number>(lines.length)
  const [played, setPlayed] = React.useState(false)
  const playing = shown < lines.length

  // Reveal one line at a time while playing; the timer's callback, not the effect, sets state.
  React.useEffect(() => {
    if (!playing) return
    const t = window.setTimeout(() => setShown((n) => n + 1), shown === 0 ? 300 : 1400)
    return () => window.clearTimeout(t)
  }, [playing, shown])

  const play = () => {
    setPlayed(true)
    setShown(window.matchMedia("(prefers-reduced-motion: reduce)").matches ? lines.length : 0)
  }
  const done = shown >= lines.length

  return (
    <div className="card-site p-5 md:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="inline-flex items-center gap-2 rounded-full bg-amber-tint px-3 py-1 text-[14px] font-semibold text-amber-ink">{copy.demoLabel}</p>
        <button type="button" onClick={play} disabled={playing} className={cn(btnSecondary, "h-11")}>
          {played ? <RotateCcw aria-hidden /> : <Play aria-hidden />}
          {played ? copy.demoReplay : copy.demoPlay}
        </button>
      </div>
      <ol className="mt-5 flex min-h-[360px] flex-col gap-3" aria-live="polite">
        {lines.slice(0, shown).map((l, i) => {
          const desk = l.who === "desk"
          return (
            <li key={i} className={cn("flex max-w-[88%] items-end gap-2", desk ? "self-start" : "flex-row-reverse self-end")}>
              {desk && <Mark size={28} />}
              <div className={cn("rounded-2xl px-4 py-3 text-[15px] leading-6", desk ? "rounded-bl-md bg-sky text-navy" : "rounded-br-md bg-blue text-white")}>
                <span className="sr-only">{desk ? copy.demoDesk : copy.demoCaller}: </span>
                {l.text}
              </div>
            </li>
          )
        })}
        {done && (
          <li className="mt-1 inline-flex items-center gap-2 self-start rounded-full bg-teal-tint px-3 py-1.5 text-[14px] font-semibold text-teal-ink">
            <CalendarCheck className="size-4" aria-hidden /> {copy.demoResult}
          </li>
        )}
      </ol>
    </div>
  )
}
