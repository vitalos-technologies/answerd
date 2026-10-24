"use client"
import * as React from "react"
import { Minus, Plus, RotateCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { Mark } from "@/components/brand/Mark"
import { mulberry32 } from "@/lib/prng"

export interface MapPoint {
  id: string
  lat: number
  lng: number
  desk?: boolean
  label: string
}

export interface BBox {
  north: number
  south: number
  east: number
  west: number
}

const W = 1000

function fitBox(points: { lat: number; lng: number }[], center?: { lat: number; lng: number }, spanMiles = 3): BBox {
  if (!points.length || center) {
    const c = center ?? points[0] ?? { lat: 51.3975, lng: -0.0745 }
    // Box in the map's 1000:640 aspect, measured in miles
    const dLat = (spanMiles * 0.64) / 69
    const dLng = spanMiles / (69 * Math.cos((c.lat * Math.PI) / 180))
    return { north: c.lat + dLat / 2, south: c.lat - dLat / 2, east: c.lng + dLng / 2, west: c.lng - dLng / 2 }
  }
  let north = -90,
    south = 90,
    east = -180,
    west = 180
  for (const p of points) {
    north = Math.max(north, p.lat)
    south = Math.min(south, p.lat)
    east = Math.max(east, p.lng)
    west = Math.min(west, p.lng)
  }
  const padLat = Math.max(0.006, (north - south) * 0.2)
  const padLng = Math.max(0.009, (east - west) * 0.2)
  return { north: north + padLat, south: south - padLat, east: east + padLng, west: west - padLng }
}

/** Stylised SVG map (no map provider in the prototype). */
export function MockMap({
  points,
  selectedId,
  onSelect,
  onSearchArea,
  circle,
  center,
  spanMiles,
  className,
  height = 320,
  showSearchArea = true,
  ariaLabel = "Map of results",
}: {
  points: MapPoint[]
  selectedId?: string | null
  onSelect?: (id: string) => void
  onSearchArea?: (box: BBox) => void
  circle?: { lat: number; lng: number; radiusMiles: number }
  center?: { lat: number; lng: number }
  spanMiles?: number
  className?: string
  height?: number | string
  showSearchArea?: boolean
  ariaLabel?: string
}) {
  const initial = React.useMemo(
    () => (circle ? fitBox([], { lat: circle.lat, lng: circle.lng }, (circle.radiusMiles * 2.5) / 0.64) : fitBox(points, center, spanMiles)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [circle?.lat, circle?.lng, circle?.radiusMiles, center?.lat, center?.lng, points.length],
  )
  const [box, setBox] = React.useState<BBox>(initial)
  const [moved, setMoved] = React.useState(false)
  const [initialKey, setInitialKey] = React.useState(initial)
  if (initial !== initialKey) {
    setInitialKey(initial)
    setBox(initial)
    setMoved(false)
  }
  const drag = React.useRef<{ x: number; y: number; box: BBox } | null>(null)
  const svgRef = React.useRef<SVGSVGElement>(null)

  const H = 640
  const proj = (lat: number, lng: number) => ({ x: ((lng - box.west) / (box.east - box.west)) * W, y: ((box.north - lat) / (box.north - box.south)) * H })

  // Decorative geography in lat/lng so it pans with the pins
  const geo = React.useMemo(() => {
    const cLat = Math.round(((initial.north + initial.south) / 2) * 50) / 50
    const cLng = Math.round(((initial.east + initial.west) / 2) * 50) / 50
    const r = mulberry32(Math.round(cLat * 1000 + cLng * 1000))
    const roads: { a: [number, number]; b: [number, number]; major: boolean }[] = []
    for (let i = -8; i <= 8; i++) {
      const off = i * 0.006 + (r() - 0.5) * 0.002
      roads.push({ a: [cLat + off, cLng - 0.12], b: [cLat + off + (r() - 0.5) * 0.01, cLng + 0.12], major: i % 4 === 0 })
      const offL = i * 0.009 + (r() - 0.5) * 0.003
      roads.push({ a: [cLat - 0.08, cLng + offL], b: [cLat + 0.08, cLng + offL + (r() - 0.5) * 0.015], major: i % 4 === 2 })
    }
    roads.push({ a: [cLat - 0.07, cLng - 0.1], b: [cLat + 0.07, cLng + 0.1], major: true })
    const parks = Array.from({ length: 6 }, () => ({ lat: cLat + (r() - 0.5) * 0.06, lng: cLng + (r() - 0.5) * 0.09, w: 0.004 + r() * 0.006, h: 0.003 + r() * 0.004 }))
    const river = Array.from({ length: 13 }, (_, i) => [cLat + 0.022 + Math.sin(i * 0.9) * 0.004, cLng - 0.12 + i * 0.02] as [number, number])
    return { roads, parks, river }
  }, [initial])

  // Cluster pins within ~28px
  const clusters = React.useMemo(() => {
    const out: { x: number; y: number; items: MapPoint[] }[] = []
    for (const p of points) {
      const { x, y } = proj(p.lat, p.lng)
      if (x < -40 || x > W + 40 || y < -40 || y > H + 40) continue
      const near = p.id === selectedId ? undefined : out.find((c) => !c.items.some((i) => i.id === selectedId) && Math.hypot(c.x - x, c.y - y) < 64)
      if (near) near.items.push(p)
      else out.push({ x, y, items: [p] })
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, box, selectedId])

  const zoom = (f: number) => {
    setMoved(true)
    setBox((b) => {
      const cLat = (b.north + b.south) / 2
      const cLng = (b.east + b.west) / 2
      const hLat = ((b.north - b.south) / 2) * f
      const hLng = ((b.east - b.west) / 2) * f
      return { north: cLat + hLat, south: cLat - hLat, east: cLng + hLng, west: cLng - hLng }
    })
  }

  const path = (pts: [number, number][]) => pts.map(([la, ln], i) => `${i ? "L" : "M"}${proj(la, ln).x.toFixed(1)},${proj(la, ln).y.toFixed(1)}`).join(" ")

  return (
    <div className={cn("relative overflow-hidden rounded-2xl border border-line bg-sky", className)} style={{ height }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 size-full touch-none select-none"
        role="img"
        aria-label={`${ariaLabel}. The same results are listed in the list view.`}
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, y: e.clientY, box }
          ;(e.target as Element).setPointerCapture?.(e.pointerId)
        }}
        onPointerMove={(e) => {
          if (!drag.current || !svgRef.current) return
          const rect = svgRef.current.getBoundingClientRect()
          const dx = (e.clientX - drag.current.x) / rect.width
          const dy = (e.clientY - drag.current.y) / rect.height
          if (Math.abs(dx) + Math.abs(dy) < 0.01) return
          const b = drag.current.box
          const wLng = b.east - b.west
          const hLat = b.north - b.south
          setMoved(true)
          setBox({ north: b.north + dy * hLat, south: b.south + dy * hLat, east: b.east - dx * wLng, west: b.west - dx * wLng })
        }}
        onPointerUp={() => (drag.current = null)}
      >
        <rect width={W} height={H} fill="#EEF2F7" />
        {geo.parks.map((p, i) => {
          const a = proj(p.lat + p.h, p.lng - p.w)
          const b = proj(p.lat - p.h, p.lng + p.w)
          return <rect key={i} x={a.x} y={a.y} width={Math.max(4, b.x - a.x)} height={Math.max(4, b.y - a.y)} rx={18} fill="#D9F2E1" />
        })}
        <path d={path(geo.river)} stroke="#CFE3FA" strokeWidth={22} fill="none" strokeLinecap="round" />
        {geo.roads.map((r, i) => {
          const a = proj(r.a[0], r.a[1])
          const b = proj(r.b[0], r.b[1])
          return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#FFFFFF" strokeWidth={r.major ? 12 : 6} strokeLinecap="round" />
        })}
        {circle &&
          (() => {
            const c = proj(circle.lat, circle.lng)
            const edge = proj(circle.lat, circle.lng + circle.radiusMiles / (69 * Math.cos((circle.lat * Math.PI) / 180)))
            const rad = Math.abs(edge.x - c.x)
            return (
              <g>
                <circle cx={c.x} cy={c.y} r={rad} fill="rgba(37,99,255,0.10)" stroke="#2563FF" strokeWidth={3} strokeDasharray="10 8" />
                <circle cx={c.x} cy={c.y} r={9} fill="#2563FF" stroke="#fff" strokeWidth={4} />
              </g>
            )
          })()}
      </svg>

      {/* Pins as HTML for crisp marks and real buttons */}
      <div className="pointer-events-none absolute inset-0">
        {clusters.map((c) => {
          const left = `${(c.x / W) * 100}%`
          const top = `${(c.y / H) * 100}%`
          if (c.items.length > 1) {
            return (
              <button
                key={c.items.map((i) => i.id).join("-")}
                type="button"
                className="pointer-events-auto absolute flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-white bg-navy t-label text-white shadow-card tnum"
                style={{ left, top }}
                onClick={() => {
                  onSelect?.(c.items[0]!.id)
                  zoom(0.6)
                }}
                aria-label={`${c.items.length} businesses here. Zoom in`}
              >
                {c.items.length}
              </button>
            )
          }
          const p = c.items[0]!
          const sel = p.id === selectedId
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect?.(p.id)}
              aria-label={p.label}
              aria-pressed={sel}
              className={cn("pointer-events-auto absolute flex min-h-6 min-w-6 -translate-x-1/2 -translate-y-full items-center justify-center transition-transform duration-150", sel && "z-10 scale-[1.35]")}
              style={{ left, top }}
            >
              {p.desk ? (
                <span className={cn("flex items-center justify-center rounded-full bg-white p-1 shadow-card", sel && "ring-2 ring-blue")}>
                  <Mark size={26} />
                </span>
              ) : (
                <span className={cn("block size-4 rounded-full border-[3px] border-white bg-blue shadow-card", sel && "size-5 bg-navy")} />
              )}
            </button>
          )
        })}
      </div>

      <div className="absolute right-3 top-3 flex flex-col overflow-hidden rounded-xl border border-line bg-white shadow-card">
        <button type="button" onClick={() => zoom(0.7)} aria-label="Zoom in" className="inline-flex size-10 items-center justify-center text-navy hover:bg-sky">
          <Plus className="size-4" />
        </button>
        <button type="button" onClick={() => zoom(1.4)} aria-label="Zoom out" className="inline-flex size-10 items-center justify-center border-t border-line text-navy hover:bg-sky">
          <Minus className="size-4" />
        </button>
      </div>
      {showSearchArea && onSearchArea && moved && (
        <button
          type="button"
          onClick={() => {
            onSearchArea(box)
            setMoved(false)
          }}
          className="absolute left-1/2 top-3 inline-flex h-10 -translate-x-1/2 items-center gap-1.5 rounded-full bg-white px-4 t-label text-navy shadow-card hover:bg-blue-tint"
        >
          <RotateCw className="size-4 text-blue" aria-hidden /> Search this area
        </button>
      )}
      <span className="absolute bottom-2 left-2 rounded-md bg-white/85 px-1.5 py-0.5 text-[10px] font-medium text-muted-ink">Map: prototype only</span>
    </div>
  )
}
