"use client"
import * as React from "react"
import QRCode from "qrcode"
import { Phone, Smartphone } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Button, ButtonLink } from "@/components/answerd/Button"
import { AppIcon } from "@/components/brand/Mark"
import type { Listing } from "@/lib/types"
import { SITE } from "../data"
import { StoreBadges } from "../ui"

/** QR code drawn from the module matrix, so it renders on the client without a canvas. */
function QrSvg({ value, size = 168 }: { value: string; size?: number }) {
  const path = React.useMemo(() => {
    const qr = QRCode.create(value, { errorCorrectionLevel: "M" })
    const n = qr.modules.size
    let d = ""
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.modules.get(r, c)) d += `M${c + 1} ${r + 1}h1v1h-1z`
    return { d, n }
  }, [value])
  return (
    <svg viewBox={`0 0 ${path.n + 2} ${path.n + 2}`} width={size} height={size} role="img" aria-label={`QR code for ${value.replace(/^https:\/\//, "")}`} shapeRendering="crispEdges">
      <rect width="100%" height="100%" fill="#FFFFFF" />
      <path d={path.d} fill="#0F2D5B" />
    </svg>
  )
}

export type ContinueAction = "message" | "book"

/**
 * App first (design review): on W-06 / W-07, Message and Book continue in the app with the business
 * already selected via the universal link. QR code from 640 px up, store badges below; in the prototype,
 * "Open in app" goes to /app/b/[slug]. Call stays on the web (onCall).
 */
export function ContinueInAppDialog({ listing, action, open, onOpenChange, onCall }: { listing: Listing; action: ContinueAction; open: boolean; onOpenChange: (v: boolean) => void; onCall?: () => void }) {
  const link = `${SITE}/b/${listing.slug}`
  const verb = action === "book" ? "Book" : "Message"
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-[calc(100%-2rem)] overflow-y-auto rounded-3xl border-0 bg-white p-6 shadow-overlay sm:max-w-md">
        <AppIcon size={48} />
        <DialogTitle className="t-heading">Continue in the app</DialogTitle>
        <DialogDescription className="t-body text-slate">
          {verb} {listing.name} in the Answerd app. It opens on their page, and your messages, bookings and reminders stay in one place.
        </DialogDescription>

        {/* Desktop: scan to open on your phone */}
        <div className="flex items-center gap-4 rounded-2xl border border-line p-4 max-sm:hidden">
          <span className="shrink-0 rounded-xl border border-line bg-white p-1.5">
            <QrSvg value={link} size={132} />
          </span>
          <div className="min-w-0">
            <p className="t-label text-navy">Scan with your phone camera</p>
            <p className="mt-1 t-caption text-muted-ink">Opens {listing.name} in the app, or the store if you don&apos;t have it yet.</p>
          </div>
        </div>

        {/* Phone: straight to the store */}
        <div className="sm:hidden">
          <p className="t-label text-navy">Get the free app</p>
          <StoreBadges className="mt-2" />
        </div>

        <div className="grid gap-2">
          <ButtonLink href={`/app/b/${listing.slug}`} aria-label={`Open ${listing.name} in the app`}>
            <Smartphone /> Open in app
          </ButtonLink>
          {onCall && (
            <Button
              variant="secondary"
              onClick={() => {
                onOpenChange(false)
                onCall()
              }}
            >
              <Phone /> Call instead
            </Button>
          )}
        </div>
        <p className="t-caption text-muted-ink">Prototype: Open in app goes to the app screens in this demo.</p>
      </DialogContent>
    </Dialog>
  )
}
