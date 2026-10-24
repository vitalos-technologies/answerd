"use client"
import * as React from "react"
import Link from "next/link"
import QRCode from "qrcode"
import { Copy, Download, Mail, MessageSquare, Printer, Share2 } from "lucide-react"
import { useStore } from "@/lib/store"
import { Button } from "@/components/answerd/Button"
import { BottomSheet } from "@/components/answerd/Sheet"
import { Stars } from "@/components/answerd/Rating"
import { Mark } from "@/components/brand/Mark"
import { listingRating } from "@/lib/selectors"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { Business, Listing } from "@/lib/types"
import { useOpsLinks } from "./links"

/** The business's own referral code, so visits from its QR code and shares are attributed. */
export function profileRef(biz: Pick<Business, "id">) {
  return biz.id.replace(/^biz-/, "").split("-")[0]!
}

export function profileUrl(listing: Pick<Listing, "slug">, biz: Pick<Business, "id">) {
  return `answerd.vitalos.co.uk/b/${listing.slug}?ref=${profileRef(biz)}`
}

/** A real, scannable QR code drawn as SVG (qrcode library). */
export function QrSvg({ text, size = 160, className, title }: { text: string; size?: number; className?: string; title?: string }) {
  const qr = React.useMemo(() => QRCode.create(text, { errorCorrectionLevel: "M" }), [text])
  const n = qr.modules.size
  const quiet = 2
  let d = ""
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.modules.get(r, c)) d += `M${c + quiet} ${r + quiet}h1v1h-1z`
  return (
    <svg viewBox={`0 0 ${n + quiet * 2} ${n + quiet * 2}`} width={size} height={size} className={className} role="img" aria-label={title ?? `QR code for ${text}`} shapeRendering="crispEdges">
      <rect width="100%" height="100%" fill="#FFFFFF" />
      <path d={d} fill="#0F2D5B" />
    </svg>
  )
}

/** "Review us on Answerd" card, used on B-29 and the print page. */
export function ReviewUsCard({ listing, url, className }: { listing: Listing; url: string; className?: string }) {
  const s = useStore()
  const r = listingRating(s, listing)
  return (
    <div className={cn("mx-auto flex w-full max-w-[340px] flex-col items-center rounded-3xl border-2 border-navy bg-white p-6 text-center", className)}>
      <div className="flex items-center gap-2">
        <Mark size={28} />
        <span className="text-[20px] font-bold tracking-tight text-navy">Answerd</span>
      </div>
      <p className="mt-4 t-heading">Review us on Answerd</p>
      <p className="mt-1 t-label font-normal text-slate">Scan to tell your neighbours how {listing.name} did.</p>
      <QrSvg text={`https://${url}`} size={168} className="mt-4" title={`QR code: review ${listing.name} on Answerd`} />
      <p className="mt-3 t-subhead">{listing.name}</p>
      {r.count > 0 && (
        <p className="mt-1 flex items-center gap-1.5 t-caption text-slate">
          <Stars value={r.rating} /> <span className="tnum">{r.rating.toFixed(1)} from {r.count} reviews</span>
        </p>
      )}
      <p className="mt-3 break-all t-caption text-muted-ink">{url}</p>
    </div>
  )
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** Draws the card to a PNG and downloads it. */
export function downloadCardPng(listing: Listing, url: string) {
  const W = 1200
  const H = 1700
  const c = document.createElement("canvas")
  c.width = W
  c.height = H
  const ctx = c.getContext("2d")
  if (!ctx) return false
  ctx.fillStyle = "#FFFFFF"
  ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = "#0F2D5B"
  ctx.lineWidth = 8
  roundRect(ctx, 40, 40, W - 80, H - 80, 64)
  ctx.stroke()
  ctx.textAlign = "center"
  ctx.fillStyle = "#2563FF"
  ctx.font = "700 72px Inter, Arial, sans-serif"
  ctx.fillText("Answerd", W / 2, 200)
  ctx.fillStyle = "#0F2D5B"
  ctx.font = "700 84px Inter, Arial, sans-serif"
  ctx.fillText("Review us on Answerd", W / 2, 360)
  ctx.fillStyle = "#475569"
  ctx.font = "400 44px Inter, Arial, sans-serif"
  ctx.fillText("Scan to tell your neighbours how we did.", W / 2, 440)
  const qr = QRCode.create(`https://${url}`, { errorCorrectionLevel: "M" })
  const n = qr.modules.size
  const box = 720
  const cell = Math.floor(box / n)
  const ox = (W - cell * n) / 2
  const oy = 520
  ctx.fillStyle = "#0F2D5B"
  for (let r = 0; r < n; r++) for (let col = 0; col < n; col++) if (qr.modules.get(r, col)) ctx.fillRect(ox + col * cell, oy + r * cell, cell, cell)
  ctx.font = "700 60px Inter, Arial, sans-serif"
  ctx.fillText(listing.name, W / 2, oy + cell * n + 130)
  ctx.fillStyle = "#64748B"
  ctx.font = "500 34px Inter, Arial, sans-serif"
  ctx.fillText(url, W / 2, oy + cell * n + 200)
  const a = document.createElement("a")
  a.href = c.toDataURL("image/png")
  a.download = `${listing.slug}-review-card.png`
  document.body.appendChild(a)
  a.click()
  a.remove()
  return true
}

/** B-29: profile link with ?ref=, QR code, printable "Review us on Answerd" card, share to WhatsApp. */
export function ShareProfile({ biz, listing, className }: { biz: Business; listing: Listing; className?: string }) {
  const links = useOpsLinks()
  const [share, setShare] = React.useState(false)
  const url = profileUrl(listing, biz)
  const copy = () => {
    void navigator.clipboard?.writeText(`https://${url}`).catch(() => {})
    toast("Link copied")
  }
  const shared = (via: string) => {
    toast(`Shared via ${via} (prototype)`)
    setShare(false)
  }
  return (
    <div className={cn("space-y-4", className)}>
      <section className="card p-4" aria-labelledby="sp-link">
        <h2 id="sp-link" className="t-subhead">
          Your profile link
        </h2>
        <p className="mt-1 t-caption text-muted-ink">Visits from this link count towards your Answerd stats.</p>
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-sky p-3">
          <p className="min-w-0 flex-1 break-all t-label text-navy">{url}</p>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={copy}>
            <Copy /> Copy link
          </Button>
          <Button onClick={() => setShare(true)}>
            <Share2 /> Share
          </Button>
        </div>
      </section>

      <section className="card p-4" aria-labelledby="sp-card">
        <h2 id="sp-card" className="t-subhead">
          &ldquo;Review us on Answerd&rdquo; card
        </h2>
        <p className="mt-1 t-caption text-muted-ink">Leave it with customers after a job, or stick it in your van. The QR code opens your profile.</p>
        <ReviewUsCard listing={listing} url={url} className="mt-4 bg-white" />
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link href={links.printCard} target="_blank" className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-line bg-white px-4 t-label font-semibold text-navy hover:bg-sky">
            <Printer className="size-5" aria-hidden /> Print card
          </Link>
          <Button variant="secondary" onClick={() => downloadCardPng(listing, url) && toast("Card downloaded")}>
            <Download /> Download
          </Button>
        </div>
      </section>

      <BottomSheet open={share} onClose={() => setShare(false)} title="Share your profile">
        <p className="t-label font-normal text-slate">Book {listing.name} on Answerd: https://{url}</p>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {[
            { label: "WhatsApp", icon: MessageSquare, bg: "bg-[#25D366] text-white", on: () => shared("WhatsApp") },
            { label: "Messages", icon: Share2, bg: "bg-[#34C759] text-white", on: () => shared("Messages") },
            { label: "Email", icon: Mail, bg: "bg-blue text-white", on: () => shared("Email") },
            { label: "Copy link", icon: Copy, bg: "bg-sky text-navy", on: () => (copy(), setShare(false)) },
          ].map((o) => (
            <button key={o.label} type="button" onClick={o.on} className="flex flex-col items-center gap-1.5 rounded-xl py-2 hover:bg-sky">
              <span className={`inline-flex size-12 items-center justify-center rounded-2xl ${o.bg}`}>
                <o.icon className="size-5" aria-hidden />
              </span>
              <span className="t-caption text-navy">{o.label}</span>
            </button>
          ))}
        </div>
      </BottomSheet>
    </div>
  )
}
