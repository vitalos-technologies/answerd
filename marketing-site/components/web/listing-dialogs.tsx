"use client"
import * as React from "react"
import { PhoneCall, Smartphone } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { StoreBadges } from "@/components/site/store-badges"
import { focusRing } from "@/components/site/focus"
import { fill } from "@/lib/fill"
import type { ListingActionsProps } from "./listing-actions"

export type ListingDialogCopy = {
  call: { title: string; body: string; desk: string; number: string; callNow: string; close: string }
  cont: { title: { message: string; book: string }; body: { message: string; book: string }; scan: string; open: string; noApp: string }
}

const pill = "inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-base font-semibold transition-colors duration-150 [&_svg]:size-5"

/** Loaded on first tap (see ListingActions). */
export default function ListingDialogs({ name, number, desk, appUrl, qr, copy, open, onClose }: ListingActionsProps & { open: null | "call" | "message" | "book"; onClose: () => void }) {
  const intent = open === "book" ? "book" : "message"
  return (
    <>
      <Dialog open={open === "call"} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-[440px] gap-5 rounded-2xl p-6 sm:p-8">
          <DialogHeader>
            <span aria-hidden className="mb-2 grid size-12 place-items-center rounded-full bg-blue-tint text-blue">
              <PhoneCall className="size-6" />
            </span>
            <DialogTitle className="text-2xl leading-8 font-bold text-navy">{fill(copy.call.title, { name })}</DialogTitle>
            <DialogDescription className="text-base text-slate">{copy.call.body}</DialogDescription>
          </DialogHeader>
          {desk && <p className="rounded-xl bg-teal-tint p-3 text-[15px] leading-6 text-navy">{copy.call.desk}</p>}
          <p className="text-[15px] text-slate">
            {copy.call.number}: <span className="tnum font-semibold text-navy">{number}</span>
          </p>
          <a href={`tel:${number.replace(/\s/g, "")}`} className={`${pill} bg-blue text-white hover:bg-blue-hover ${focusRing}`}>
            <PhoneCall aria-hidden /> {copy.call.callNow}
          </a>
        </DialogContent>
      </Dialog>

      <Dialog open={open === "message" || open === "book"} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-[440px] gap-5 rounded-2xl p-6 sm:p-8">
          <DialogHeader className="items-center text-center">
            <DialogTitle className="text-2xl leading-8 font-bold text-balance text-navy">{fill(copy.cont.title[intent], { name })}</DialogTitle>
            <DialogDescription className="text-base text-slate">{fill(copy.cont.body[intent], { name })}</DialogDescription>
          </DialogHeader>
          {/* Desktop: scan to open this business in the app on your phone */}
          <figure className="mx-auto hidden flex-col items-center gap-3 sm:flex">
            <div className="rounded-2xl border border-line p-4">{qr}</div>
            <figcaption className="max-w-[18rem] text-center text-[14px] leading-5 text-muted-ink">{fill(copy.cont.scan, { name })}</figcaption>
          </figure>
          {/* Phone: the universal link opens the app on this business when it is installed */}
          <a href={appUrl} className={`${pill} bg-blue text-white hover:bg-blue-hover sm:hidden ${focusRing}`}>
            <Smartphone aria-hidden /> {fill(copy.cont.open, { name })}
          </a>
          <p className="text-center text-[14px] leading-5 text-muted-ink sm:hidden">{copy.cont.noApp}</p>
          <StoreBadges className="justify-center" block size="sm" />
        </DialogContent>
      </Dialog>
    </>
  )
}
