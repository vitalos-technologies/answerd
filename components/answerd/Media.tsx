import { Icon } from "./Icon"
import { cn } from "@/lib/utils"
import { Mark } from "@/components/brand/Mark"
import type { Photo } from "@/lib/types"
import { categoryIcon, hueTint, listingTint, tintClasses, type BrandTint } from "@/lib/tints"

/** Neutral placeholder imagery: a brand tint with an icon. No real people. */
export function PhotoTile({ hue, icon = "Wrench", className, label, rounded = "rounded-xl", tint }: { hue: number; icon?: string; className?: string; label?: string; rounded?: string; tint?: BrandTint }) {
  const t = tintClasses(tint ?? hueTint(hue))
  return (
    <div
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("relative flex items-center justify-center overflow-hidden", t.bg, t.border, rounded, className)}
    >
      <span className={t.icon}>
        <Icon name={icon} size={28} />
      </span>
    </div>
  )
}

/**
 * Listing cover (C-16, W-06): the business's chosen cover photo; without one, a 120 px band
 * in the category's tint with the category's own icon (never a fixed icon).
 * Props: listing (for the category), photo (the cover, if set), className (size of the photo version).
 */
export function ListingCover({ listing, photo, className, bandClassName }: { listing: { categoryIds: string[] }; photo?: Photo; className?: string; bandClassName?: string }) {
  if (photo) return <PhotoTile hue={photo.hue} icon={photo.icon} rounded="rounded-none" className={cn("h-44 w-full", className)} label={photo.caption} />
  const t = tintClasses(listingTint(listing))
  return (
    <div aria-hidden className={cn("flex h-[120px] w-full items-center justify-center", t.bg, bandClassName)}>
      <span className={t.icon}>
        <Icon name={categoryIcon(listing.categoryIds[0])} size={40} />
      </span>
    </div>
  )
}

/** Initials on a brand tint chosen by the listing's category (lib/tints). Navy initials pass AA on every tint. */
export function ListingAvatar({ listing, size = 56, className }: { listing: { initials: string; categoryIds?: string[] }; size?: number; className?: string }) {
  const t = tintClasses(listingTint(listing))
  return (
    <span
      aria-hidden
      className={cn("inline-flex shrink-0 items-center justify-center rounded-xl font-bold tracking-tight", t.bg, t.border, t.ink, className)}
      style={{ width: size, height: size, fontSize: size * 0.34 }}
    >
      {listing.initials}
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
