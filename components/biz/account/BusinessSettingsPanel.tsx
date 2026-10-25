"use client"
import * as React from "react"
import Link from "next/link"
import { ArrowLeftRight, EyeOff, Eye, Plus, Trash2, UserCog } from "lucide-react"
import { Button } from "@/components/answerd/Button"
import { Field, SelectInput } from "@/components/answerd/Fields"
import { ListingAvatar } from "@/components/answerd/Media"
import { useStore } from "@/lib/store"
import { businessById, listingById, membershipsFor } from "@/lib/selectors"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import { SmsConfirmSheet } from "./SmsConfirmSheet"

type Action = "transfer" | "unpublish" | "publish" | "delete"

/**
 * B-40 business settings: switch business, transfer ownership, unpublish listing, delete business.
 * Each sensitive action needs an SMS code. Reused by W-19.
 */
export function BusinessSettingsPanel({ businessId, onSwitched, onTransferred, onDeleted, claimHref = "/app/biz/claim", readOnly }: { businessId: string; onSwitched?: (businessId: string) => void; onTransferred?: () => void; onDeleted?: () => void; claimHref?: string; readOnly?: boolean }) {
  const s = useStore()
  const biz = businessById(s, businessId)
  const listing = listingById(s, biz?.listingId)
  const mems = membershipsFor(s, s.session.userId)
  const staff = s.members.filter((m) => m.businessId === businessId && m.role === "staff" && m.joinedAt)
  const [to, setTo] = React.useState("")
  const [action, setAction] = React.useState<Action | null>(null)
  if (!biz || !listing) return null
  const target = staff.find((m) => m.id === to)

  const run = () => {
    const a = action
    setAction(null)
    if (a === "transfer" && target) {
      s.transferOwnership(businessId, target.id)
      toast(`${target.name} is now the owner. You're staff.`)
      onTransferred?.()
    }
    if (a === "unpublish" || a === "publish") {
      s.setListingPublished(businessId, a === "publish")
      toast(a === "publish" ? "Your listing is live again" : "Your listing is hidden from search")
    }
    if (a === "delete") {
      s.deleteBusiness(businessId)
      toast(`${listing.name} deleted`)
      onDeleted?.()
    }
  }

  return (
    <div className="space-y-4">
      <section aria-labelledby="bs-switch" className="card p-4">
        <h2 id="bs-switch" className="flex items-center gap-2 t-subhead">
          <ArrowLeftRight className="size-5 text-blue" aria-hidden /> Switch business
        </h2>
        <ul className="mt-2 space-y-2">
          {mems.map((m) => {
            const l = s.listings.find((x) => x.businessId === m.businessId)
            const current = m.businessId === businessId
            return (
              <li key={m.id}>
                <button
                  type="button"
                  aria-pressed={current}
                  onClick={() => {
                    if (current) return
                    s.setMode("business", m.businessId)
                    toast(`Switched to ${l?.name}`)
                    onSwitched?.(m.businessId)
                  }}
                  className={cn("flex min-h-14 w-full items-center gap-3 rounded-2xl border p-2.5 text-left", current ? "border-blue bg-blue-tint" : "border-line bg-white hover:border-blue/50")}
                >
                  {l && <ListingAvatar listing={l} size={40} />}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate t-label font-semibold text-navy">{l?.name ?? "Business"}</span>
                    <span className="block t-caption text-muted-ink">
                      {m.role === "owner" ? "Owner" : "Staff"}
                      {current ? " · current" : ""}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
        <Link href={claimHref} className="mt-2 inline-flex min-h-11 items-center gap-1.5 t-label text-blue hover:underline">
          <Plus className="size-4" aria-hidden /> Add another business
        </Link>
      </section>

      {!readOnly && (
        <>
          <section aria-labelledby="bs-transfer" className="card p-4">
            <h2 id="bs-transfer" className="flex items-center gap-2 t-subhead">
              <UserCog className="size-5 text-blue" aria-hidden /> Transfer ownership
            </h2>
            <p className="mt-1 t-label font-normal text-slate">Hand {listing.name} to someone on your team. You&apos;ll stay on as staff.</p>
            {staff.length ? (
              <div className="mt-3 space-y-3">
                <Field label="New owner" htmlFor="new-owner">
                  <SelectInput id="new-owner" value={to} onChange={(e) => setTo(e.target.value)}>
                    <option value="">Choose a team member</option>
                    {staff.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
                <Button variant="secondary" block disabled={!target} onClick={() => setAction("transfer")}>
                  Transfer ownership
                </Button>
              </div>
            ) : (
              <p className="mt-2 t-caption text-muted-ink">Invite someone to your team first. Only staff who have joined can become the owner.</p>
            )}
          </section>

          <section aria-labelledby="bs-publish" className="card p-4">
            <h2 id="bs-publish" className="flex items-center gap-2 t-subhead">
              {listing.unpublished ? <Eye className="size-5 text-blue" aria-hidden /> : <EyeOff className="size-5 text-blue" aria-hidden />} {listing.unpublished ? "Publish listing" : "Unpublish listing"}
            </h2>
            <p className="mt-1 t-label font-normal text-slate">{listing.unpublished ? "Your listing is hidden. Customers can't find, call or book you on Answerd." : "Hide your listing from search and the map. Existing bookings stay in your diary."}</p>
            <Button variant="secondary" block className="mt-3" onClick={() => setAction(listing.unpublished ? "publish" : "unpublish")}>
              {listing.unpublished ? "Publish listing" : "Unpublish listing"}
            </Button>
          </section>

          <section aria-labelledby="bs-delete" className="card border-red/30 p-4">
            <h2 id="bs-delete" className="flex items-center gap-2 t-subhead">
              <Trash2 className="size-5 text-red" aria-hidden /> Delete business
            </h2>
            <p className="mt-1 t-label font-normal text-slate">Removes your business, team, desk and settings. The basic listing goes back to unclaimed. This can&apos;t be undone.</p>
            <Button variant="destructive" block className="mt-3" onClick={() => setAction("delete")}>
              Delete business
            </Button>
          </section>
        </>
      )}

      <SmsConfirmSheet
        open={!!action}
        onClose={() => setAction(null)}
        title={action === "transfer" ? `Make ${target?.name ?? ""} the owner?` : action === "unpublish" ? "Unpublish your listing?" : action === "publish" ? "Publish your listing?" : `Delete ${listing.name}?`}
        body={action === "transfer" ? "They'll control the profile, desk, billing and team. You'll become staff." : action === "unpublish" ? "Customers won't find you on Answerd until you publish again." : action === "publish" ? "Customers can find, call and book you again." : "Your business, team, desk and settings are deleted. This can't be undone."}
        confirmLabel={action === "transfer" ? "Transfer" : action === "unpublish" ? "Unpublish" : action === "publish" ? "Publish" : "Delete business"}
        destructive={action === "delete" || action === "unpublish"}
        onConfirm={run}
      />
    </div>
  )
}
