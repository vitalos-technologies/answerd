// The mark as one self-contained inline SVG (no sprite, no hooks), for the generated icon and social images.
import { ARC_INNER, ARC_INNER_WIDTH, ARC_OUTER, ARC_OUTER_WIDTH, BRAND, BUBBLE, HANDSET, HANDSET_STROKE, HANDSET_TRANSFORM, VIEWBOX } from "./geometry"

/** `white`: the tile version, white bubble with a blue handset (on brand blue). Otherwise full colour. */
export function MarkSvg({ size, white = false }: { size: number; white?: boolean }) {
  const handset = white ? BRAND.blue : BRAND.white
  return (
    <svg width={size} height={size} viewBox={VIEWBOX} fill="none">
      <defs>
        <linearGradient id="b" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor={BRAND.blueLight} />
          <stop offset="1" stopColor={BRAND.blueDeep} />
        </linearGradient>
      </defs>
      <path d={BUBBLE} fill={white ? BRAND.white : "url(#b)"} />
      <path d={HANDSET} fill={handset} stroke={handset} strokeWidth={HANDSET_STROKE} strokeLinecap="round" strokeLinejoin="round" transform={HANDSET_TRANSFORM} />
      <path d={ARC_INNER} stroke={white ? BRAND.cyanOnBlue : BRAND.cyan} strokeWidth={ARC_INNER_WIDTH} strokeLinecap="round" />
      <path d={ARC_OUTER} stroke={BRAND.teal} strokeWidth={ARC_OUTER_WIDTH} strokeLinecap="round" />
    </svg>
  )
}
