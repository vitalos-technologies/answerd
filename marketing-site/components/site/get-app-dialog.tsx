"use client"
import * as React from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { StoreBadges } from "./store-badges"

/** Loaded on first use (see GetAppProvider), so the dialog code isn't in the first-load bundle. */
export default function GetAppDialog({ title, body, open, onOpenChange, qr }: { title: string; body: string; open: boolean; onOpenChange: (open: boolean) => void; qr: React.ReactNode }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] rounded-2xl p-6 sm:p-8">
        <DialogHeader className="items-center text-center">
          <DialogTitle className="text-2xl font-bold text-navy">{title}</DialogTitle>
          <DialogDescription className="text-base text-slate">{body}</DialogDescription>
        </DialogHeader>
        <div className="mx-auto mt-2 hidden rounded-2xl border border-line p-4 sm:block">{qr}</div>
        <StoreBadges className="mt-2 justify-center" block />
      </DialogContent>
    </Dialog>
  )
}
