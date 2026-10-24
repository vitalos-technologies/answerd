"use client"
import * as React from "react"
import { Pause, Play, RotateCcw } from "lucide-react"
import { useStore } from "@/lib/store"
import { buildScript } from "@/lib/deskScripts"
import { listingBySlug } from "@/lib/selectors"
import { DeskAvatar, PersonAvatar } from "@/components/answerd/Media"
import { cn } from "@/lib/utils"

const STEP_MS = 1800

/**
 * W-09 desk demo player: plays the D-01 missed-call script for Swift Plumbing & Heating line by line,
 * with the transcript as captions. Props: slug (defaults to swift-plumbing-heating).
 */
export function SampleCall({ slug = "swift-plumbing-heating", className }: { slug?: string; className?: string }) {
  const s = useStore()
  const listing = listingBySlug(s, slug)
  const steps = React.useMemo(() => (listing ? buildScript(s, "D-01", listing, 0).steps : []), [listing, s])
  const [shown, setShown] = React.useState(0)
  const [playing, setPlaying] = React.useState(false)
  const endRef = React.useRef<HTMLDivElement>(null)
  const done = shown >= steps.length && steps.length > 0

  React.useEffect(() => {
    if (!playing) return
    const t = setTimeout(() => {
      if (shown + 1 >= steps.length) {
        setShown(steps.length)
        setPlaying(false)
      } else setShown(shown + 1)
    }, STEP_MS)
    return () => clearTimeout(t)
  }, [playing, shown, steps.length])
  React.useEffect(() => {
    const el = endRef.current?.parentElement
    if (el) el.scrollTop = el.scrollHeight
  }, [shown])

  if (!listing) return null
  const toggle = () => {
    if (done) {
      setShown(1)
      setPlaying(true)
      return
    }
    if (!playing && shown === 0) setShown(1)
    setPlaying((p) => !p)
  }
  const seconds = Math.round((shown * STEP_MS) / 1000)
  const total = Math.round((steps.length * STEP_MS) / 1000)

  return (
    <div className={cn("overflow-hidden rounded-3xl bg-navy text-white shadow-overlay", className)}>
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
        <DeskAvatar size={40} />
        <div className="min-w-0 flex-1">
          <p className="t-subhead text-white">Sample call: {listing.name}</p>
          <p className="t-caption text-white/70">Missed call answered by the Answerd desk · simulated</p>
        </div>
        <button type="button" onClick={toggle} aria-label={playing ? "Pause sample call" : done ? "Replay sample call" : "Play sample call"} className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-blue text-white hover:bg-blue-hover">
          {playing ? <Pause className="size-5" /> : done ? <RotateCcw className="size-5" /> : <Play className="size-5 translate-x-px" />}
        </button>
      </div>
      <div className="flex items-center gap-3 px-5 pt-3">
        <span className="t-caption text-white/70 tnum">0:{String(Math.min(seconds, 59)).padStart(2, "0")}</span>
        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15" role="progressbar" aria-label="Call progress" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={shown}>
          <span className="block h-full rounded-full bg-teal transition-[width] duration-300" style={{ width: `${steps.length ? (shown / steps.length) * 100 : 0}%` }} />
        </span>
        <span className="t-caption text-white/70 tnum">0:{String(Math.min(total, 59)).padStart(2, "0")}</span>
      </div>
      <div className="h-[300px] space-y-3 overflow-y-auto px-5 py-4" aria-live="polite" aria-label="Transcript">
        {shown === 0 && <p className="pt-20 text-center t-label font-normal text-white/80">Press play to hear how the desk answers a missed call, books a job and texts the customer.</p>}
        {steps.slice(0, shown).map((st, i) => {
          const desk = st.speaker === "desk"
          return (
            <div key={i} className={cn("flex items-end gap-2", desk ? "justify-start" : "justify-end")}>
              {desk && <DeskAvatar size={26} />}
              <div className={cn("max-w-[80%] rounded-2xl px-3.5 py-2.5 t-label font-normal", desk ? "rounded-bl-md bg-teal-tint text-navy" : "rounded-br-md bg-white text-navy")}>
                <span className={cn("block t-caption", desk ? "text-teal-ink" : "text-muted-ink")}>{desk ? "Answerd desk" : "Caller"}</span>
                {st.text}
              </div>
              {!desk && <PersonAvatar name="Caller" size={26} />}
            </div>
          )
        })}
        <div ref={endRef} />
      </div>
      <p className="border-t border-white/10 px-5 py-3 t-caption text-white/70">The desk says it&apos;s an AI and that the call is recorded. Powered by AskBridge.</p>
    </div>
  )
}
