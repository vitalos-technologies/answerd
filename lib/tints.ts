import { CATEGORIES, categoryById } from "./categories"

/**
 * Brand tints for avatars, placeholder photos and listing covers (design review, 25 Oct 2026).
 * Only blue-tint, teal-tint, amber-tint and sky; chosen by category so a business keeps its colour.
 * Initials sit in navy on every tint (AA on all four); icons use the tint ink.
 */
export const BRAND_TINTS = ["blue-tint", "teal-tint", "amber-tint", "sky"] as const
export type BrandTint = (typeof BRAND_TINTS)[number]

const CLASSES: Record<BrandTint, { bg: string; border: string; ink: string; icon: string }> = {
  "blue-tint": { bg: "bg-blue-tint", border: "", ink: "text-navy", icon: "text-blue" },
  "teal-tint": { bg: "bg-teal-tint", border: "", ink: "text-navy", icon: "text-teal-ink" },
  "amber-tint": { bg: "bg-amber-tint", border: "", ink: "text-navy", icon: "text-amber-ink" },
  // Sky sits on sky screens, so it carries a hairline border
  sky: { bg: "bg-sky", border: "border border-line", ink: "text-navy", icon: "text-navy" },
}

function hash(key: string) {
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0
  return h
}

const LEAF_ORDER = CATEGORIES.filter((c) => c.parentId).map((c) => c.id)

/** The tint for a category: leaf order in the taxonomy (neighbours differ), else a stable hash of the id. */
export function categoryTint(categoryId: string | null | undefined): BrandTint {
  if (!categoryId) return "sky"
  const i = LEAF_ORDER.indexOf(categoryId)
  return BRAND_TINTS[(i >= 0 ? i : hash(categoryId)) % BRAND_TINTS.length]!
}

/** A listing's tint comes from its main category. */
export function listingTint(listing: { categoryIds?: string[] } | null | undefined): BrandTint {
  return categoryTint(listing?.categoryIds?.[0])
}

/** For things with no category (a business's own photos): spread the stored hue over the four tints. */
export function hueTint(hue: number): BrandTint {
  return BRAND_TINTS[Math.abs(Math.round(hue / 47)) % BRAND_TINTS.length]!
}

/** Class names for a tint: background, text (initials) and icon colour. */
export function tintClasses(t: BrandTint) {
  return CLASSES[t]
}

/** The category's own icon for covers without a photo (falls back to the parent group's icon, then a storefront). */
export function categoryIcon(categoryId: string | null | undefined) {
  const c = categoryId ? categoryById(categoryId) : undefined
  return c?.icon ?? (c?.parentId ? categoryById(c.parentId)?.icon : undefined) ?? "Store"
}
