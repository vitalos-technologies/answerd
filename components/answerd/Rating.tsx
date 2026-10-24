import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

export function Stars({ value, size = 14, className }: { value: number; size?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - (i - 1)))
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <Star className="absolute inset-0 text-line fill-line" style={{ width: size, height: size }} strokeWidth={1.5} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className="text-amber fill-amber" style={{ width: size, height: size }} strokeWidth={1.5} />
            </span>
          </span>
        )
      })}
    </span>
  )
}

/** Five amber stars at 14, value in Label, count in muted. */
export function Rating({ value, count, google, className, compact }: { value: number; count: number; google?: boolean; className?: string; compact?: boolean }) {
  if (!count) return <span className={cn("t-caption text-muted-ink", className)}>No reviews yet</span>
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)} aria-label={`Rated ${value.toFixed(1)} out of 5 from ${count} ${google ? "Google " : ""}reviews`}>
      {compact ? <Star className="size-3.5 fill-amber text-amber" aria-hidden /> : <Stars value={value} />}
      <span className="t-label text-navy tnum">{value.toFixed(1)}</span>
      <span className="t-caption text-muted-ink tnum">
        ({count}){google ? " on Google" : ""}
      </span>
    </span>
  )
}
