import { BadgeCheck, Clock, ShieldCheck, Sparkle, Star } from "lucide-react"
import { DeskIcon } from "@/components/brand/DeskIcon"
import type { BadgeKind } from "@/lib/types"
import { cn } from "@/lib/utils"

const LABEL: Record<BadgeKind, string> = {
  responds_instantly: "Responds instantly",
  verified: "Verified",
  gas_safe: "Gas Safe",
  niceic: "NICEIC",
  napit: "NAPIT",
  insured: "Insured",
  dbs: "DBS checked",
  featured: "Featured",
  unclaimed: "Unclaimed",
  open_now: "Open now",
  new: "New",
  desk: "Desk",
}

/** size "sm" (20 high, 11 px) is for compact result cards. */
export function Badge({ kind, className, size = "md" }: { kind: BadgeKind; className?: string; size?: "md" | "sm" }) {
  const base =
    size === "sm"
      ? "inline-flex h-5 shrink-0 items-center gap-1 rounded-full px-2 text-[11px] font-medium leading-4 whitespace-nowrap [&_svg]:size-3"
      : "inline-flex h-6 shrink-0 items-center gap-1 rounded-full px-2.5 t-caption whitespace-nowrap"
  switch (kind) {
    case "responds_instantly":
      return (
        <span className={cn(base, "bg-teal text-navy", className)}>
          <span className="relative inline-flex size-1.5 rounded-full bg-white animate-pulse-dot" aria-hidden />
          {LABEL[kind]}
        </span>
      )
    case "verified":
      return (
        <span className={cn(base, "bg-blue-tint text-navy", className)}>
          <BadgeCheck className="size-3.5 text-blue" aria-hidden />
          {LABEL[kind]}
        </span>
      )
    case "gas_safe":
    case "niceic":
    case "napit":
    case "insured":
    case "dbs":
      return (
        <span className={cn(base, "border border-line bg-white text-navy", className)}>
          <ShieldCheck className="size-3.5 text-teal-ink" aria-hidden />
          {LABEL[kind]}
        </span>
      )
    case "featured":
      return (
        <span className={cn(base, "bg-amber text-navy", className)}>
          <Star className="size-3 fill-navy" aria-hidden />
          {LABEL[kind]}
        </span>
      )
    case "unclaimed":
      return <span className={cn(base, "bg-sky text-muted-ink border border-line", className)}>{LABEL[kind]}</span>
    case "open_now":
      return (
        <span className={cn(base, "px-0 text-teal-ink", className)}>
          <Clock className="size-3.5" aria-hidden />
          {LABEL[kind]}
        </span>
      )
    case "new":
      return (
        <span className={cn(base, "bg-blue-tint text-blue", className)}>
          <Sparkle className="size-3" aria-hidden />
          {LABEL[kind]}
        </span>
      )
    case "desk":
      return (
        <span className={cn(base, "h-5 bg-teal-tint px-2 text-teal-ink", className)}>
          <DeskIcon className="size-3" aria-hidden />
          {LABEL[kind]}
        </span>
      )
  }
}

export function BadgeRow({ kinds, max = 4, className }: { kinds: BadgeKind[]; max?: number; className?: string }) {
  const shown = kinds.slice(0, max)
  const extra = kinds.length - shown.length
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {shown.map((k) => (
        <Badge key={k} kind={k} />
      ))}
      {extra > 0 && <span className="t-caption text-muted-ink">+{extra}</span>}
    </div>
  )
}

export const BADGE_KINDS = Object.keys(LABEL) as BadgeKind[]
export { LABEL as BADGE_LABEL }
