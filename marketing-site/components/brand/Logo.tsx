import { cn } from "@/lib/utils"
import { Mark } from "./Mark"

export type LogoVariant = "horizontal" | "stacked" | "mark" | "reversed" | "mono"

/**
 * Answerd lockups from the brand board. Clear space equals the mark's height;
 * callers should leave that much room around the logo.
 */
export function Logo({
  variant = "horizontal",
  tagline = false,
  size = 32,
  className,
  layout,
}: {
  variant?: LogoVariant
  tagline?: boolean
  size?: number
  className?: string
  /** Reversed and mono default to stacked; pass "horizontal" for a one-line lockup. */
  layout?: "horizontal" | "stacked"
}) {
  if (variant === "mark") return <Mark size={size} className={className} title="Answerd" />
  const reversed = variant === "reversed"
  const mono = variant === "mono"
  const stacked = layout ? layout === "stacked" : variant === "stacked" || reversed || mono
  const word = reversed ? "text-white" : "text-navy"
  const tag = reversed ? "text-white/85" : "text-slate"
  const markVariant = reversed ? "reversed" : mono ? "mono" : "color"

  if (stacked) {
    return (
      <span className={cn("inline-flex flex-col items-center", className)} aria-label="Answerd">
        <Mark size={size * 1.6} variant={markVariant} />
        <span
          className={cn("font-extrabold leading-none tracking-[-0.035em]", word)}
          style={{ fontSize: size * 1.2, marginTop: size * 0.18 }}
        >
          Answerd
        </span>
        {tagline && " "}
        {tagline && (
          <span className={cn("font-normal", tag)} style={{ fontSize: size * 0.42, marginTop: size * 0.16 }}>
            Every business picks up.
          </span>
        )}
      </span>
    )
  }

  return (
    <span className={cn("inline-flex items-center", className)} style={{ gap: size * 0.28 }} aria-label="Answerd">
      <Mark size={tagline ? size * 1.35 : size} variant={markVariant} />
      <span className="flex flex-col">
        <span
          className={cn("font-extrabold leading-none tracking-[-0.035em]", word)}
          style={{ fontSize: size * 0.78 }}
        >
          Answerd
        </span>
        {tagline && " "}
        {tagline && (
          <span className={cn("font-normal leading-tight", tag)} style={{ fontSize: size * 0.34, marginTop: size * 0.1 }}>
            Every business picks up.
          </span>
        )}
      </span>
    </span>
  )
}
