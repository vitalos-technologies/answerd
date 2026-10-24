import { cn } from "@/lib/utils"

export type MarkVariant = "color" | "reversed" | "mono" | "white"

// Speech bubble (tail bottom-left) with a handset and two signal arcs, drawn from the brand board.
const BUBBLE = "M20.6 53.2 A21 21 0 1 0 9.6 41.4 L5.2 59.2 Z"
const HANDSET =
  "M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"
const ARC_INNER = "M39.05 10.16 A19.5 19.5 0 0 1 52.84 23.95"
const ARC_OUTER = "M40.86 3.4 A26.5 26.5 0 0 1 59.6 22.14"

const VARIANTS: Record<MarkVariant, { bubble: string; handset: string; arcInner: string; arcOuter: string }> = {
  color: { bubble: "url(#answerd-mark-bubble)", handset: "#FFFFFF", arcInner: "url(#answerd-mark-arc)", arcOuter: "#14B8A6" },
  reversed: { bubble: "#FFFFFF", handset: "#0F2D5B", arcInner: "url(#answerd-mark-arc)", arcOuter: "#14B8A6" },
  mono: { bubble: "#0F2D5B", handset: "#FFFFFF", arcInner: "#0F2D5B", arcOuter: "#0F2D5B" },
  white: { bubble: "#FFFFFF", handset: "#2563FF", arcInner: "#FFFFFF", arcOuter: "#14B8A6" },
}

/**
 * The mark's geometry, once per page as <symbol>s (rendered in the root layout). Each <Mark> is then a
 * two-element <svg><use>, which keeps the DOM and the page payload small. Hidden by size, not display:none,
 * so the gradients still resolve.
 */
export function MarkSprite() {
  return (
    <svg aria-hidden width="0" height="0" style={{ position: "absolute", overflow: "hidden" }}>
      <defs>
        <linearGradient id="answerd-mark-bubble" x1="48" y1="14" x2="10" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3B7BFF" />
          <stop offset="1" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id="answerd-mark-arc" x1="38" y1="10" x2="54" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2B8CF5" />
          <stop offset="1" stopColor="#14B8A6" />
        </linearGradient>
        {(Object.keys(VARIANTS) as MarkVariant[]).map((v) => (
          <symbol key={v} id={`answerd-mark-${v}`} viewBox="0 0 64 64" fill="none">
            <path d={BUBBLE} fill={VARIANTS[v].bubble} />
            <path d={HANDSET} fill={VARIANTS[v].handset} transform="translate(14.6 19.4) scale(1.22)" />
            <path d={ARC_INNER} stroke={VARIANTS[v].arcInner} strokeWidth="5.2" strokeLinecap="round" />
            <path d={ARC_OUTER} stroke={VARIANTS[v].arcOuter} strokeWidth="5.2" strokeLinecap="round" />
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
