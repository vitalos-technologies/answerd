"use client"
import * as React from "react"
import { AdminPage, Pill, ReasonButton, adminInput } from "@/components/admin/kit"
import { DataGate } from "@/components/app/helpers"
import { EmptyState } from "@/components/answerd/Feedback"
import { useStore } from "@/lib/store"
import { fmtDate } from "@/lib/time"
import { gbp } from "@/lib/format"
import { rulesFor } from "@/lib/selectors"
import { toast } from "@/lib/toast"
import type { FeaturedSlot } from "@/lib/types"

function useCandidates(slot: FeaturedSlot) {
  const s = useStore()
  const taken = new Set(s.featuredSlots.filter((f) => f.categoryId === slot.categoryId && f.areaCode === slot.areaCode && f.businessId).map((f) => f.businessId))
  return s.listings.filter((l) => l.businessId && l.layer === "claimed" && !l.suspended && l.city === "london" && l.categoryIds.includes(slot.categoryId) && !taken.has(l.businessId)).map((l) => ({ id: l.businessId!, name: l.name }))
}

function Assign({ slot, label = "Assign", op = "assign" }: { slot: FeaturedSlot; label?: string; op?: "assign" | "waitlist_add" }) {
  const options = useCandidates(slot).filter((o) => op === "assign" || !slot.waitlist.includes(o.id))
  const [biz, setBiz] = React.useState(slot.waitlist[0] ?? options[0]?.id ?? "")
  const chosen = options.some((o) => o.id === biz) ? biz : options[0]?.id ?? ""
  return (
    <ReasonButton
      perm="featured"
      label={label}
      variant={op === "assign" ? "tint" : "ghost"}
      disabled={!options.length}
      title={op === "assign" ? `Assign slot ${slot.position}` : "Add to the waitlist"}
      description={op === "assign" ? `The business shows first in this category and area. Featured is ${gbp(rulesFor(useStore.getState()).featuredPricePence)}/month ex VAT, billed in Stripe.` : "They get the next free slot."}
      confirmLabel={op === "assign" ? "Assign slot" : "Add"}
      presets={op === "assign" ? ["Next on the waitlist", "Sold by sales team"] : ["Asked for a slot"]}
      validate={() => (!chosen ? "Choose a business." : null)}
      onConfirm={(reason) => {
        useStore.getState().adminFeatured(slot.id, op, chosen, reason)
        toast(op === "assign" ? "Slot assigned" : "Added to the waitlist")
      }}
    >
      <label className="flex flex-col gap-1.5">
        <span className="t-label text-navy">Business</span>
        <select value={chosen} onChange={(e) => setBiz(e.target.value)} className={adminInput}>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
              {slot.waitlist.includes(o.id) ? " (waitlist)" : ""}
            </option>
          ))}
        </select>
      </label>
    </ReasonButton>
  )
}

/** A-19: category × area grid with 3 slots each, holders and waitlist. */
export default function FeaturedSlots() {
  const s = useStore()
  const areas = [...new Set(s.featuredSlots.map((f) => f.areaCode))]
  const [area, setArea] = React.useState(areas[0] ?? "")
  const cats = [...new Set(s.featuredSlots.filter((f) => f.areaCode === area).map((f) => f.categoryId))]
  const nameOf = (bid?: string) => s.listings.find((l) => l.businessId === bid)?.name ?? "—"
  // R2: S-06 sets how many slots each category and area sells (default 3)
  const open = rulesFor(s).featuredSlotsPerArea
  return (
    <AdminPage id="A-19" title="Featured slots" perm="featured" description={`${open === 3 ? "Three" : open === 2 ? "Two" : "One"} paid slot${open === 1 ? "" : "s"} per category and area (set in Pricing and rules). ${s.settings.featuredOn ? "Featured is on." : "Featured is switched off in Settings, so slots don't show to customers."}`}>
      <div className="mb-3 flex items-center gap-2">
        <label className="flex items-center gap-2">
          <span className="t-label text-navy">Area</span>
          <select value={area} onChange={(e) => setArea(e.target.value)} className={`${adminInput} w-52 capitalize`}>
            {areas.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
      </div>
      <DataGate isEmpty={cats.length === 0} empty={<EmptyState title="No Featured slots" body="Slots appear once Featured launches in an area." />}>
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full text-[13.5px]" aria-label={`Featured slots in ${area}`}>
            <thead className="bg-sky">
              <tr className="text-left text-navy">
                <th className="px-3 py-2.5 font-semibold">Category</th>
                {[1, 2, 3].map((p) => (
                  <th key={p} className="px-3 py-2.5 font-semibold">Slot {p}</th>
                ))}
                <th className="px-3 py-2.5 font-semibold">Waitlist</th>
              </tr>
            </thead>
            <tbody>
              {cats.map((cid) => {
                const slots = s.featuredSlots.filter((f) => f.areaCode === area && f.categoryId === cid).sort((a, b) => a.position - b.position)
                const waitlist = [...new Set(slots.flatMap((f) => f.waitlist))]
                const firstFree = slots.find((f) => !f.businessId) ?? slots[0]!
                return (
                  <tr key={cid} className="border-t border-line align-top">
                    <th scope="row" className="px-3 py-3 text-left font-medium text-navy">{s.categories.find((c) => c.id === cid)?.plural ?? cid}</th>
                    {slots.map((f) => (
                      <td key={f.id} className="px-3 py-2">
                        {f.position > open && !f.businessId ? (
                          <Pill>Closed by pricing rules</Pill>
                        ) : f.businessId ? (
                          <div className="space-y-1">
                            <p className="font-medium text-navy">{nameOf(f.businessId)}</p>
                            <p className="t-caption text-muted-ink">Since {f.startsAt ? fmtDate(f.startsAt) : "—"}{f.position > open ? " · hidden: over the slot limit" : ""}</p>
                            <ReasonButton perm="featured" label="Release" title={`Release slot ${f.position}?`} description="The business stops showing as Featured here." presets={["Subscription cancelled", "Owner request"]} onConfirm={(r) => { useStore.getState().adminDecide("featured", f.id, "release", r); toast("Slot released") }} />
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <Pill>Free</Pill>
                            <div>
                              <Assign key={`${f.id}-${waitlist.join()}`} slot={f} />
                            </div>
                          </div>
                        )}
                      </td>
                    ))}
                    <td className="px-3 py-2">
                      {waitlist.length ? (
                        <ul className="mb-1 space-y-1">
                          {waitlist.map((b) => {
                            const holder = slots.find((f) => f.waitlist.includes(b))!
                            return (
                              <li key={b} className="flex items-center gap-1">
                                <span className="flex-1">{nameOf(b)}</span>
                                <ReasonButton perm="featured" label="Remove" variant="ghost" title={`Remove ${nameOf(b)} from the waitlist?`} onConfirm={(r) => { useStore.getState().adminFeatured(holder.id, "waitlist_remove", b, r); toast("Removed from the waitlist") }} />
                              </li>
                            )
                          })}
                        </ul>
                      ) : (
                        <p className="t-caption text-muted-ink">Nobody waiting</p>
                      )}
                      <Assign key={`${firstFree.id}-wl-${waitlist.join()}`} slot={firstFree} op="waitlist_add" label="Add to waitlist" />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </DataGate>
    </AdminPage>
  )
}
