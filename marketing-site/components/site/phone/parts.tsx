import { BadgeCheck, ShieldCheck, Star } from "lucide-react"
import { Mark } from "@/components/brand/Mark"
import { cn } from "@/lib/utils"
import { site } from "@/content/site"

/* Small building blocks shared by the phone screens and snippets. All decorative. */

export type Tone = "blue" | "navy" | "teal"

const TONES: Record<Tone, string> = {
  blue: "linear-gradient(145deg,#4C86FF 0%,#2563FF 55%,#1D4ED8 100%)",
  navy: "linear-gradient(145deg,#2A4E86 0%,#0F2D5B 100%)",
  teal: "linear-gradient(145deg,#1FC2AF 0%,#0F766E 100%)",
}

export function Avatar({ initials, tone = "blue", size = 44, radius, className }: { initials: string; tone?: Tone | string; size?: number; radius?: number; className?: string }) {
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center font-bold tracking-[-0.02em] text-white", className)}
      style={{ width: size, height: size, borderRadius: radius ?? size * 0.3, background: TONES[(tone as Tone) in TONES ? (tone as Tone) : "blue"], fontSize: size * 0.34 }}
    >
      {initials}
    </span>
  )
}

/** The Answerd desk avatar: the mark in a soft white disc. */
export function DeskAvatar({ size = 26, className }: { size?: number; className?: string }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-line", className)} style={{ width: size, height: size }}>
      <Mark size={size * 0.72} />
    </span>
  )
}

export function Stars({ rating, size = 11, className }: { rating: string; size?: number; className?: string }) {
  const full = Math.round(Number(rating))
  return (
    <span className={cn("inline-flex items-center gap-[1.5px]", className)}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} strokeWidth={0} className={i < full ? "fill-amber" : "fill-line"} style={{ width: size, height: size }} />
      ))}
    </span>
  )
}

/** Teal dot that pulses softly (CSS, off under reduced motion). */
export function PulseDot({ size = 6, className }: { size?: number; className?: string }) {
  return (
    <span className={cn("relative inline-flex shrink-0", className)} style={{ width: size, height: size }}>
      <span className="absolute inset-0 rounded-full bg-teal opacity-0 motion-safe:animate-ping motion-safe:opacity-50 motion-safe:[animation-duration:2.2s]" />
      <span className="relative size-full rounded-full bg-teal" />
    </span>
  )
}

export function InstantBadge({ className, small = false }: { className?: string; small?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-[5px] rounded-full bg-teal-tint font-semibold whitespace-nowrap text-teal-ink",
        small ? "h-[20px] px-[7px] text-[10px]" : "h-[22px] px-[8px] text-[10.5px]",
        className,
      )}
    >
      <PulseDot size={small ? 5 : 6} />
      {site.demo.respondsInstantly}
    </span>
  )
}

export function CredBadge({ label, className, small = false }: { label: string; className?: string; small?: boolean }) {
  const Icon = label === "Insured" ? BadgeCheck : ShieldCheck
  return (
    <span
      className={cn(
        "inline-flex items-center gap-[4px] rounded-full bg-blue-tint font-semibold whitespace-nowrap text-navy",
        small ? "h-[20px] px-[7px] text-[10px]" : "h-[22px] px-[8px] text-[10.5px]",
        className,
      )}
    >
      <Icon className="text-blue" style={{ width: small ? 11 : 12, height: small ? 11 : 12 }} strokeWidth={2.4} />
      {label}
    </span>
  )
}
