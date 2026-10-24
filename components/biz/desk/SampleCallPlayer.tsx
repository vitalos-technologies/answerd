"use client"
import * as React from "react"
import { Pause, Play, RotateCcw } from "lucide-react"
import { Button } from "@/components/answerd/Button"
import { fmtDuration } from "@/lib/time"
import { cn } from "@/lib/utils"
import { TranscriptView, type TranscriptItem } from "./common"

/**
 * B-30 sample call: plays a D-01 transcript line by line (no audio), with a play/pause control,
 * a progress bar and a running clock. Captions are the transcript itself.
 */
export function SampleCallPlayer({ lines, callerName, title = "Sample call", stepMs = 1700, className }: { lines: TranscriptItem[]; callerName: string; title?: string; stepMs?: number; className?: string }) {
  const [shown, setShown] = React.useState(0)
  const [playing, setPlaying] = React.useState(false)
  const [typing, setTyping] = React.useState(false)
  const done = shown >= lines.length

  React.useEffect(() => {
    if (!playing) return
    if (shown >= lines.length) {
      const t = setTimeout(() => setPlaying(false), 0)
      return () => clearTimeout(t)
    }
    const t1 = setTimeout(() => setTyping(true), Math.round(stepMs * 0.25))
    const t2 = setTimeout(() => {
      setTyping(false)
      setShown((n) => n + 1)
    }, stepMs)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [playing, shown, lines.length, stepMs])

  const toggle = () => {
    if (done) {
      setShown(0)
      setPlaying(true)
      return
    }
    setPlaying((p) => !p)
    setTyping(false)
  }
  const seconds = Math.round((shown / Math.max(1, lines.length)) * (lines.length * 6))
  const next = lines[shown]

  return (
    <div className={cn("card overflow-hidden", className)}>
      <div className="flex items-center gap-3 border-b border-line px-4 py-3">
        <button
          type="button"
          onClick={toggle}
          aria-label={done ? "Replay sample call" : playing ? "Pause sample call" : "Play sample call"}
          className="relative inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-blue text-white hover:bg-blue-hover"
        >
          {playing && <span className="absolute inset-0 animate-ping rounded-full bg-blue/30" aria-hidden />}
          {done ? <RotateCcw className="size-5" /> : playing ? <Pause className="size-5" /> : <Play className="ml-0.5 size-5" />}
        </button>
        <div className="min-w-0 flex-1">
          <p className="t-label font-semibold text-navy">{title}</p>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#E7ECF3]" role="progressbar" aria-label="Sample call progress" aria-valuemin={0} aria-valuemax={lines.length} aria-valuenow={shown}>
              <div className="h-full rounded-full bg-teal transition-[width] duration-500 ease-out" style={{ width: `${(shown / Math.max(1, lines.length)) * 100}%` }} />
            </div>
            <span className="t-caption text-muted-ink tnum">{fmtDuration(seconds)}</span>
          </div>
        </div>
        {playing && (
          <span className="flex h-6 items-end gap-0.5" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="w-1 animate-bounce rounded-full bg-teal" style={{ height: `${10 + ((i * 7) % 12)}px`, animationDelay: `${i * 110}ms` }} />
            ))}
          </span>
        )}
      </div>
      <div data-transcript-scroll className="max-h-80 overflow-y-auto bg-sky px-4 py-3">
        <TranscriptView lines={lines.slice(0, shown)} callerName={callerName} typing={playing && typing && next ? (next.speaker === "desk" ? "desk" : "caller") : null} emptyText="Tap play to hear how the desk answers a missed call. No sound: the transcript plays line by line." />
      </div>
      {!playing && shown > 0 && !done && (
        <div className="border-t border-line px-4 py-2">
          <Button variant="ghost" size="sm" onClick={() => setShown(lines.length)}>
            Show the full transcript
          </Button>
        </div>
      )}
    </div>
  )
}
