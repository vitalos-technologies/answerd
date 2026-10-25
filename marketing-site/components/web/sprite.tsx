import { BadgeCheck, ChevronRight, ShieldCheck, Star } from "lucide-react"

/**
 * Icons repeated on every result card (star, badge check, shield, chevron) as <symbol>s, rendered once per
 * page by WebPage and drawn with <svg><use href="#i-…" /></svg>. Same approach as the brand mark sprite.
 */
export function WebSprite() {
  return (
    <svg aria-hidden width="0" height="0" style={{ position: "absolute", overflow: "hidden" }}>
      <defs>
        <symbol id="i-star" viewBox="0 0 24 24">
          <Star fill="currentColor" strokeWidth={1.5} />
        </symbol>
        <symbol id="i-verified" viewBox="0 0 24 24">
          <BadgeCheck strokeWidth={2} />
        </symbol>
        <symbol id="i-shield" viewBox="0 0 24 24">
          <ShieldCheck strokeWidth={2} />
        </symbol>
        <symbol id="i-chevron" viewBox="0 0 24 24">
          <ChevronRight strokeWidth={2} />
        </symbol>
      </defs>
    </svg>
  )
}

export function SpriteIcon({ id, className }: { id: "star" | "verified" | "shield" | "chevron"; className?: string }) {
  return (
    <svg aria-hidden className={className}>
      <use href={`#i-${id}`} />
    </svg>
  )
}
