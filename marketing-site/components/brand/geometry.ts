// The Answerd mark's geometry, from the brand board's vector files (the same paths as the app's
// apps/answerd/assets/brand/answerd-mark-*.svg). No hooks, so the OG and icon routes can use it too.
// Drawn on a 120 grid; VIEWBOX crops it to a square around the mark.

export const VIEWBOX = "8 11 98 98"
export const BUBBLE = "M41 34C51 33 57 38 63 44C69 50 77 56 81 62C84 67 85 72 84.5 77C83.5 89 72 98 59 99.5C49 100.5 41 99 34 97.5L14 102L19.5 86.5C15.5 79 14 70 14.5 61C15 46 26 35.5 41 34Z"
/** The handset, drawn on its own 24 grid: place it with HANDSET_TRANSFORM, filled and stroked. */
export const HANDSET =
  "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
export const HANDSET_TRANSFORM = "translate(27 44) scale(1.9)"
export const HANDSET_STROKE = 3.7
export const ARC_INNER = "M64 33A27 27 0 0 1 85 56.5"
export const ARC_OUTER = "M65 18.5A43 43 0 0 1 99 57"
export const ARC_INNER_WIDTH = 8.5
export const ARC_OUTER_WIDTH = 9

export const BRAND = {
  navy: "#0F2D5B",
  blue: "#2563FF",
  blueLight: "#2F6BFF",
  blueDeep: "#1D52EE",
  teal: "#14B8A6",
  cyan: "#1AA3E8",
  cyanOnDark: "#2B8CF0",
  cyanOnBlue: "#7FD3FF",
  white: "#FFFFFF",
} as const
