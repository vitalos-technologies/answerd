"use client"
import * as React from "react"
import { Copy, Mail, MessageSquare, Share2 } from "lucide-react"
import { BottomSheet } from "@/components/answerd/Sheet"
import { EmptyState } from "@/components/answerd/Feedback"
import { ButtonLink } from "@/components/answerd/Button"
import { ListingAvatar } from "@/components/answerd/Media"
import { useStore } from "@/lib/store"
import { toast } from "@/lib/toast"
import type { Listing } from "@/lib/types"

/** Categories where the customer goes to the business, so no address is needed. */
export const IN_SHOP = new Set(["barbers", "hairdressers", "nail-technicians", "beauty-therapists"])
export function atPremises(l: Pick<Listing, "categoryIds">) {
  return l.categoryIds.some((c) => IN_SHOP.has(c))
}

export function shareUrl(slug: string, code?: string) {
  return `answerd.vitalos.co.uk/b/${slug}${code ? `?ref=${code}` : ""}`
}

/** Mock OS share sheet: Copy link, WhatsApp, Messages, Email. */
export function ShareSheet({ open, onClose, listing, title, message, onShared }: { open: boolean; onClose: () => void; listing: Listing; title?: string; message?: string; onShared?: () => void }) {
  const profile = useStore((s) => s.customerProfiles.find((p) => p.userId === s.session.userId))
  const url = shareUrl(listing.slug, profile?.referralCode)
  const text = message ?? `I recommend ${listing.name} on Answerd: https://${url}`
  const done = (via: string) => {
    onShared?.()
    toast(`Shared via ${via} (prototype)`)
    onClose()
  }
  return (
    <BottomSheet open={open} onClose={onClose} title={title ?? "Share"}>
      <div className="flex items-center gap-3 rounded-2xl bg-sky p-3">
        <ListingAvatar initials={listing.initials} hue={listing.hue} size={44} />
        <div className="min-w-0">
          <p className="t-label text-navy truncate">{listing.name}</p>
          <p className="t-caption text-muted-ink truncate">{url}</p>
        </div>
      </div>
      <p className="mt-3 t-label font-normal text-slate">{text}</p>
      <div className="mt-4 grid grid-cols-4 gap-2">
        {[
          { label: "Copy link", icon: Copy, bg: "bg-sky text-navy", on: () => {
            void navigator.clipboard?.writeText(`https://${url}`).catch(() => {})
            onShared?.()
            toast("Link copied")
            onClose()
          } },
          { label: "WhatsApp", icon: MessageSquare, bg: "bg-[#25D366] text-white", on: () => done("WhatsApp") },
          { label: "Messages", icon: Share2, bg: "bg-[#34C759] text-white", on: () => done("Messages") },
          { label: "Email", icon: Mail, bg: "bg-blue text-white", on: () => done("Email") },
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
  )
}

export function ListingNotFound() {
  return (
    <div className="flex h-full items-center justify-center">
      <EmptyState title="We can't find that business" body="It may have moved or merged with another listing." action={<ButtonLink href="/app/search" size="md">Search again</ButtonLink>} />
    </div>
  )
}

/** Business mini-header used by the booking steps. */
export function ListingMini({ listing, subtitle }: { listing: Listing; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-line bg-white px-4 py-3">
      <ListingAvatar initials={listing.initials} hue={listing.hue} size={40} />
      <div className="min-w-0">
        <p className="t-label font-semibold text-navy truncate">{listing.name}</p>
        {subtitle && <p className="t-caption text-muted-ink truncate">{subtitle}</p>}
      </div>
    </div>
  )
}
