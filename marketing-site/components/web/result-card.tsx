import Link from "next/link"
import { cn } from "@/lib/utils"
import { focusRing } from "@/components/site/focus"
import { pages } from "@/content/pages"
import type { CardData } from "@/lib/data/queries"
import type { BadgeKind } from "@/lib/data/types"
import { Avatar, Rating } from "./ui"
import { SpriteIcon } from "./sprite"

const CREDS: BadgeKind[] = ["gas_safe", "niceic", "napit", "insured", "dbs"]

/** Badge pills from the spec: status is always text plus an icon, never colour alone. */
export function Badge({ kind }: { kind: BadgeKind }) {
  const base = "inline-flex h-6 shrink-0 items-center gap-1 rounded-full px-2.5 text-[12px] leading-4 font-medium whitespace-nowrap"
  const label = pages.badges[kind]
  if (kind === "responds_instantly")
    return (
      <span className={cn(base, "bg-teal text-navy")}>
        <span aria-hidden className="size-1.5 rounded-full bg-white" />
        {label}
      </span>
    )
  if (kind === "verified")
    return (
      <span className={cn(base, "bg-blue-tint text-navy")}>
        <SpriteIcon id="verified" className="size-3.5 text-blue" />
        {label}
      </span>
    )
  if (CREDS.includes(kind))
    return (
      <span className={cn(base, "border border-line bg-white text-navy")}>
        <SpriteIcon id="shield" className="size-3.5 text-teal-ink" />
        {label}
      </span>
    )
  if (kind === "unclaimed") return <span className={cn(base, "border border-line bg-sky text-slate")}>{label}</span>
  return <span className={cn(base, "bg-blue-tint text-blue-hover")}>{label}</span>
}

/** One row of badges, capped with an inline "+n". */
export function BadgeRow({ kinds, max = 3, className }: { kinds: BadgeKind[]; max?: number; className?: string }) {
  if (!kinds.length) return null
  const shown = kinds.slice(0, max)
  const extra = kinds.length - shown.length
  return (
    <ul className={cn("flex flex-wrap items-center gap-1.5", className)} aria-label={pages.common.badges}>
      {shown.map((k) => (
        <li key={k}>
          <Badge kind={k} />
        </li>
      ))}
      {extra > 0 && <li className="text-[12px] leading-4 font-medium text-muted-ink">+{extra}</li>}
    </ul>
  )
}

/**
 * Result card (W-03, W-04, the home W-01 grid): the whole card links to the listing, where Call works on
 * the web and Message and Book continue in the app. Unclaimed cards are flat, per the spec.
 */
export function ResultCard({ c, headingLevel: H = "h3" }: { c: CardData; headingLevel?: "h2" | "h3" }) {
  const flat = c.layer !== "claimed"
  return (
    <Link
      href={`/b/${c.slug}`}
      className={cn(
        "group flex h-full min-w-0 gap-4 rounded-2xl border border-line p-4 transition-[box-shadow,border-color,translate] duration-200 ease-out hover:-translate-y-0.5 hover:border-blue/30 motion-reduce:hover:translate-y-0 md:p-5",
        flat ? "bg-white/70" : "bg-white shadow-card hover:shadow-lift",
        focusRing,
      )}
    >
      <Avatar initials={c.initials} tone={c.tone} size={52} />
      <div className="min-w-0 flex-1">
        <H className="truncate text-[17px] leading-6 font-semibold text-navy group-hover:underline">{c.name}</H>
        <p className="truncate text-[14px] leading-5 text-muted-ink">
          {c.categoryName} · {c.place}
        </p>
        <Rating rating={c.rating} count={c.count} google={c.google} className="mt-1" />
        <BadgeRow kinds={c.badges} className="mt-2" />
        <p className={cn("mt-2 text-[14px] leading-5", c.desk ? "font-medium text-teal-ink" : "text-slate")}>{c.reply}</p>
      </div>
      <SpriteIcon id="chevron" className="mt-4 size-5 shrink-0 text-muted-ink transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}
