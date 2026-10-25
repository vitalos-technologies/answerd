"use client"
import * as React from "react"
import dynamic from "next/dynamic"
import { CalendarPlus, MessageCircle, Phone } from "lucide-react"
import { cn } from "@/lib/utils"
import { focusRing } from "@/components/site/focus"
import type { ListingDialogCopy } from "./listing-dialogs"

// Both dialogs load on first tap, so they cost nothing on first load.
const ListingDialogs = dynamic(() => import("./listing-dialogs"), { ssr: false })

export type ListingActionsProps = {
  name: string
  number: string
  desk: boolean
  /** Unclaimed listings: Call only (claiming is a plain link beside this island). */
  claimed: boolean
  bookable: boolean
  /** The listing's universal link (https://answerd.vitalos.co.uk/b/[slug]) */
  appUrl: string
  /** Server-rendered QR code of appUrl */
  qr: React.ReactNode
  appStoreUrl: string
  playStoreUrl: string
  labels: { call: string; message: string; book: string }
  copy: ListingDialogCopy
  variant: "card" | "bar"
}

const btn = "inline-flex h-12 min-w-0 items-center justify-center gap-2 rounded-full border border-line bg-white px-4 text-[15px] font-semibold text-navy transition-colors duration-150 hover:border-blue/40 hover:bg-sky [&_svg]:size-[18px] [&_svg]:shrink-0 [&_svg]:text-blue"

/**
 * Call, Message and Book for a listing (W-06, W-07). Call opens the tracked number and works on the web.
 * Message and Book open "Continue in the app": a QR code on desktop, store buttons on a phone, and the
 * listing's universal link so the app opens on this business when it is installed.
 */
export function ListingActions(p: ListingActionsProps) {
  const [open, setOpen] = React.useState<null | "call" | "message" | "book">(null)
  const [used, setUsed] = React.useState(false)
  const show = (d: "call" | "message" | "book") => {
    setUsed(true)
    setOpen(d)
  }
  const call = (
    <button type="button" onClick={() => show("call")} aria-label={`${p.labels.call} ${p.name}`} className={cn(btn, focusRing)}>
      <Phone aria-hidden /> {p.labels.call}
    </button>
  )
  return (
    <>
      {p.variant === "card" ? (
        <div className="grid gap-2">
          {p.claimed && p.bookable && (
            <button type="button" onClick={() => show("book")} aria-label={`${p.labels.book} ${p.name}`} className={cn(btn, focusRing)}>
              <CalendarPlus aria-hidden /> {p.labels.book}
            </button>
          )}
          <div className={cn("grid gap-2", p.claimed && "grid-cols-2")}>
            {call}
            {p.claimed && (
              <button type="button" onClick={() => show("message")} aria-label={`${p.labels.message} ${p.name}`} className={cn(btn, focusRing)}>
                <MessageCircle aria-hidden /> {p.labels.message}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex gap-2 [&>button]:flex-1 [&>button]:px-2">
          {call}
          {p.claimed && (
            <button type="button" onClick={() => show("message")} aria-label={`${p.labels.message} ${p.name}`} className={cn(btn, focusRing)}>
              <MessageCircle aria-hidden /> {p.labels.message}
            </button>
          )}
          {p.claimed && p.bookable && (
            <button type="button" onClick={() => show("book")} aria-label={`${p.labels.book} ${p.name}`} className={cn(btn, focusRing)}>
              <CalendarPlus aria-hidden /> {p.labels.book}
            </button>
          )}
        </div>
      )}
      {used && <ListingDialogs {...p} open={open} onClose={() => setOpen(null)} />}
    </>
  )
}
