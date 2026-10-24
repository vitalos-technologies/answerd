"use client"
import * as React from "react"
import Link from "next/link"
import { ArrowDown, ArrowUp, ChevronRight, Plus } from "lucide-react"
import { ButtonLink, Button, IconButton } from "@/components/answerd/Button"
import { Switch } from "@/components/ui/switch"
import { DataGate } from "@/components/app/helpers"
import { useStore } from "@/lib/store"
import { SERVICE_TEMPLATES } from "@/lib/seed"
import { servicesFor } from "@/lib/selectors"
import { durationLabel, priceWithVat } from "@/lib/format"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import { FormSkeleton, useBizRecord } from "./fields"

/** Suggested services for a listing's categories (used when the list is empty). */
export function suggestedServices(categoryIds: string[]) {
  return categoryIds.flatMap((c) => SERVICE_TEMPLATES[c] ?? []).slice(0, 5)
}

/**
 * B-11: services with duration and price, a bookable toggle per row, reorder, Add service.
 * Rows link to the editor via `hrefFor` (B-12 in the app; a dashboard can pass its own).
 */
export function ServicesList({ businessId, hrefFor = (id) => `/app/biz/profile/services/${id}`, className }: { businessId: string; hrefFor?: (serviceId: string | "new") => string; className?: string }) {
  const { hydrated, biz, listing } = useBizRecord(businessId)
  const s = useStore()
  const [reorder, setReorder] = React.useState(false)
  if (!hydrated || !biz || !listing) return <FormSkeleton rows={4} />
  const services = servicesFor(s, biz.id)
  const suggestions = suggestedServices(listing.categoryIds).filter((t) => !services.some((x) => x.name.toLowerCase() === t[0].toLowerCase()))

  const move = (i: number, dir: -1 | 1) => {
    const ids = services.map((x) => x.id)
    const j = i + dir
    if (j < 0 || j >= ids.length) return
    ;[ids[i], ids[j]] = [ids[j]!, ids[i]!]
    s.reorderServices(biz.id, ids)
    toast("Order saved")
  }

  return (
    <div className={className ?? "space-y-4 px-4 py-5"}>
      <DataGate
        isEmpty={services.length === 0}
        empty={
          <div className="space-y-4">
            <div className="card p-4 text-center">
              <h2 className="t-heading">Add your first service</h2>
              <p className="mt-1 t-body text-slate">Customers book and the AI desk quotes from this list. Start with a suggestion or add your own.</p>
            </div>
            {suggestions.length > 0 && (
              <section aria-labelledby="sugg-h">
                <h3 id="sugg-h" className="mb-2 t-subhead">
                  Suggested for you
                </h3>
                <ul className="card divide-y divide-line overflow-hidden">
                  {suggestions.map((t) => (
                    <li key={t[0]} className="flex items-center gap-3 px-4 py-3">
                      <span className="min-w-0 flex-1">
                        <span className="block t-label text-navy">{t[0]}</span>
                        <span className="block t-caption text-muted-ink">
                          {t[2] === "quote" ? "Quote on request" : `${t[1] ? durationLabel(t[1]) + " · " : ""}${priceWithVat({ priceType: t[2], pricePence: t[3], vatIncluded: true })}`}
                        </span>
                      </span>
                      <Button
                        size="sm"
                        variant="tint"
                        aria-label={`Add ${t[0]}`}
                        onClick={() => {
                          s.upsertService(biz.id, { name: t[0], durationMin: t[1] || 60, priceType: t[2], pricePence: t[3], priceToPence: t[4], bookable: t[5], description: t[6], vatIncluded: true })
                          toast(`${t[0]} added`)
                        }}
                      >
                        <Plus /> Add
                      </Button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        }
      >
        <div className="mb-2 flex items-center justify-between">
          <p className="t-caption text-muted-ink tnum">
            {services.length} service{services.length === 1 ? "" : "s"} · {services.filter((x) => x.bookable).length} bookable online
          </p>
          {services.length > 1 && (
            <Button size="sm" variant="ghost" onClick={() => setReorder((v) => !v)} aria-pressed={reorder} className="h-11">
              {reorder ? "Done" : "Reorder"}
            </Button>
          )}
        </div>
        <ul className="card divide-y divide-line overflow-hidden" aria-label="Your services">
          {services.map((svc, i) => (
            <li key={svc.id} className="flex items-center gap-2 py-1.5 pl-2 pr-3">
              <Link href={hrefFor(svc.id)} className="flex min-h-14 min-w-0 flex-1 items-center gap-2 rounded-xl px-2 hover:bg-sky">
                <span className="min-w-0 flex-1">
                  <span className="block truncate t-label text-navy">{svc.name}</span>
                  <span className="block truncate t-caption text-muted-ink tnum">
                    {svc.priceType === "quote" ? "" : `${durationLabel(svc.durationMin)} · `}
                    {priceWithVat(svc)}
                  </span>
                </span>
                {!reorder && <ChevronRight className="size-5 shrink-0 text-muted-ink" aria-hidden />}
              </Link>
              {reorder ? (
                <div className="flex">
                  <IconButton label={`Move ${svc.name} up`} onClick={() => move(i, -1)} disabled={i === 0}>
                    <ArrowUp />
                  </IconButton>
                  <IconButton label={`Move ${svc.name} down`} onClick={() => move(i, 1)} disabled={i === services.length - 1}>
                    <ArrowDown />
                  </IconButton>
                </div>
              ) : (
                <label className="flex min-h-11 min-w-14 cursor-pointer flex-col items-center justify-center gap-1">
                  <Switch
                    checked={svc.bookable}
                    aria-label={`${svc.name} bookable online`}
                    onCheckedChange={(v) => {
                      s.upsertService(biz.id, { id: svc.id, name: svc.name, bookable: v })
                      toast(v ? `${svc.name} can be booked online` : `${svc.name} is enquiry only`)
                    }}
                    className="data-[state=checked]:bg-blue"
                  />
                  <span className={cn("text-[11px] leading-4", svc.bookable ? "text-blue" : "text-muted-ink")} aria-hidden>
                    {svc.bookable ? "Bookable" : "Enquiry"}
                  </span>
                </label>
              )}
            </li>
          ))}
        </ul>
      </DataGate>
      <ButtonLink href={hrefFor("new")} block variant={services.length ? "secondary" : "primary"}>
        <Plus /> Add service
      </ButtonLink>
    </div>
  )
}
