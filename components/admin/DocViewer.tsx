"use client"
import * as React from "react"
import { FileText, RotateCw, ZoomIn, ZoomOut } from "lucide-react"
import { IconButton } from "@/components/answerd/Button"
import { fmtDate } from "@/lib/time"

/**
 * Mock document viewer for claim evidence and credential certificates.
 * Draws a neutral, fictional document (no real brands) addressed to the business.
 */
export function DocViewer({ kind, fileName, name, business, address, date, lines = [] }: { kind: string; fileName?: string; name: string; business: string; address: string; date: string; lines?: [string, string][] }) {
  const [zoom, setZoom] = React.useState(1)
  const [turn, setTurn] = React.useState(0)
  return (
    <figure className="overflow-hidden rounded-2xl border border-line bg-sky">
      <div className="flex items-center gap-1 border-b border-line bg-white px-2">
        <FileText className="ml-2 size-4 text-blue" aria-hidden />
        <figcaption className="min-w-0 flex-1 truncate px-1 t-label text-navy">{fileName ?? `${kind}.pdf`}</figcaption>
        <IconButton label="Zoom out" onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))} disabled={zoom <= 0.6}>
          <ZoomOut />
        </IconButton>
        <span className="w-10 text-center t-caption text-muted-ink tnum">{Math.round(zoom * 100)}%</span>
        <IconButton label="Zoom in" onClick={() => setZoom((z) => Math.min(1.6, z + 0.2))} disabled={zoom >= 1.6}>
          <ZoomIn />
        </IconButton>
        <IconButton label="Rotate" onClick={() => setTurn((t) => (t + 90) % 360)}>
          <RotateCw />
        </IconButton>
      </div>
      <div className="flex h-[380px] items-center justify-center overflow-auto p-6">
        <div
          className="w-[300px] shrink-0 bg-white p-6 text-[11px] leading-4 text-slate shadow-card transition-transform duration-150"
          style={{ transform: `scale(${zoom}) rotate(${turn}deg)` }}
          aria-label={`${kind} for ${business}`}
          role="img"
        >
          <div className="flex items-center justify-between border-b border-line pb-2">
            <span className="text-[12px] font-bold text-navy">{kind}</span>
            <span>{fmtDate(date)}</span>
          </div>
          <p className="mt-3 font-semibold text-navy">{name}</p>
          <p>{business}</p>
          <p>{address}</p>
          <div className="mt-4 space-y-1">
            {lines.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2 border-b border-dashed border-line pb-1">
                <span>{k}</span>
                <span className="font-medium text-navy">{v}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 h-2 w-3/4 rounded bg-sky" />
          <div className="mt-1.5 h-2 w-2/3 rounded bg-sky" />
          <div className="mt-1.5 h-2 w-1/2 rounded bg-sky" />
          <p className="mt-4 text-[9px] text-muted-ink">Prototype document. Not a real record.</p>
        </div>
      </div>
    </figure>
  )
}
