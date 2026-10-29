import { cn } from "@/lib/utils"

export type MarkVariant = "color" | "reversed" | "mono" | "white"

import { ARC_INNER, ARC_INNER_WIDTH, ARC_OUTER, ARC_OUTER_WIDTH, BRAND, BUBBLE, HANDSET, HANDSET_STROKE, HANDSET_TRANSFORM, VIEWBOX } from "./geometry"

// Speech bubble (tail bottom-left) with a handset and two signal arcs: the brand board's mark (geometry.ts).
const VARIANTS: Record<MarkVariant, { bubble: string; handset: string; arcInner: string; arcOuter: string }> = {
  color: { bubble: "url(#answerd-mark-bubble)", handset: BRAND.white, arcInner: BRAND.cyan, arcOuter: BRAND.teal },
  reversed: { bubble: BRAND.white, handset: BRAND.navy, arcInner: BRAND.cyanOnDark, arcOuter: BRAND.teal },
  mono: { bubble: BRAND.navy, handset: BRAND.white, arcInner: BRAND.navy, arcOuter: BRAND.navy },
  white: { bubble: BRAND.white, handset: BRAND.blue, arcInner: BRAND.cyanOnBlue, arcOuter: BRAND.teal },
}

/**
 * The mark's geometry, once per page as <symbol>s (rendered in the root layout). Each <Mark> is then a
 * two-element <svg><use>, which keeps the DOM and the page payload small. Hidden by size, not display:none,
 * so the gradient still resolves.
 */
export function MarkSprite() {
  return (
    <svg aria-hidden width="0" height="0" style={{ position: "absolute", overflow: "hidden" }}>
      <defs>
        <linearGradient id="answerd-mark-bubble" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor={BRAND.blueLight} />
          <stop offset="1" stopColor={BRAND.blueDeep} />
        </linearGradient>
        {(Object.keys(VARIANTS) as MarkVariant[]).map((v) => (
          <symbol key={v} id={`answerd-mark-${v}`} viewBox={VIEWBOX} fill="none">
            <path d={BUBBLE} fill={VARIANTS[v].bubble} />
            <path d={HANDSET} fill={VARIANTS[v].handset} stroke={VARIANTS[v].handset} strokeWidth={HANDSET_STROKE} strokeLinecap="round" strokeLinejoin="round" transform={HANDSET_TRANSFORM} />
            <path d={ARC_INNER} stroke={VARIANTS[v].arcInner} strokeWidth={ARC_INNER_WIDTH} strokeLinecap="round" />
            <path d={ARC_OUTER} stroke={VARIANTS[v].arcOuter} strokeWidth={ARC_OUTER_WIDTH} strokeLinecap="round" />
          </symbol>
        ))}
      </defs>
    </svg>
  )
}

/** The Answerd mark. Needs <MarkSprite /> on the page (the root layout renders it). */
export function Mark({
  size = 32,
  variant = "color",
  className,
  title,
}: {
  size?: number
  variant?: MarkVariant
  className?: string
  title?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={cn("shrink-0", className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <use href={`#answerd-mark-${variant}`} />
    </svg>
  )
}

/** App icon / favicon tile: white mark on blue (brand) or on navy (dark). */
export function AppIcon({ size = 64, dark = false, className }: { size?: number; dark?: boolean; className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center justify-center", dark ? "bg-navy" : "bg-blue", className)}
      style={{ width: size, height: size, borderRadius: size * 0.225 }}
    >
      <Mark size={size * 0.68} variant={dark ? "reversed" : "white"} />
    </span>
  )
}
