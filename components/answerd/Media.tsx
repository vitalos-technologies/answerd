import { Icon } from "./Icon"
import { cn } from "@/lib/utils"
import { Mark } from "@/components/brand/Mark"

/** Neutral placeholder imagery: a soft gradient with an icon. No real people. */
export function PhotoTile({ hue, icon = "Wrench", className, label, rounded = "rounded-xl" }: { hue: number; icon?: string; className?: string; label?: string; rounded?: string }) {
  return (
    <div
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("relative flex items-center justify-center overflow-hidden", rounded, className)}
      style={{ background: `linear-gradient(135deg, hsl(${hue} 70% 92%), hsl(${(hue + 40) % 360} 60% 80%))` }}
    >
      <span style={{ color: `hsl(${hue} 45% 32%)` }}>
        <Icon name={icon} size={28} />
      </span>
    </div>
  )
}

/** 56 avatar: initials on a tinted square, or the mark for desk avatars. */
export function ListingAvatar({ initials, hue, size = 56, className }: { initials: string; hue: number; size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-flex shrink-0 items-center justify-center rounded-xl font-bold tracking-tight", className)}
      style={{ width: size, height: size, fontSize: size * 0.34, background: `hsl(${hue} 75% 94%)`, color: `hsl(${hue} 55% 30%)` }}
    >
      {initials}
    </span>
  )
}

export function PersonAvatar({ name, size = 32, className, tone = "sky" }: { name: string; size?: number; className?: string; tone?: "sky" | "navy" | "blue" }) {
  const ini = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("")
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold",
        tone === "sky" && "bg-sky text-navy border border-line",
        tone === "navy" && "bg-navy text-white",
        tone === "blue" && "bg-blue-tint text-blue",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.max(11, size * 0.38) }}
    >
      {ini}
    </span>
  )
}

export function DeskAvatar({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <span aria-hidden className={cn("inline-flex shrink-0 items-center justify-center rounded-full bg-white border border-line", className)} style={{ width: size, height: size }}>
      <Mark size={size * 0.68} />
    </span>
  )
}
