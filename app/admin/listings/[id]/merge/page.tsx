"use client"
import * as React from "react"
import { use } from "react"
import { useRouter } from "next/navigation"
import { GitMerge } from "lucide-react"
import { AdminPage, NoAccess, Panel, Pill, ReasonButton, adminInput } from "@/components/admin/kit"
import { Banner } from "@/components/answerd/Feedback"
import { useStore } from "@/lib/store"
import { milesBetween } from "@/lib/geo"
import { listingRating } from "@/lib/selectors"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { Listing } from "@/lib/types"

type FieldKey = "name" | "phonePublic" | "address" | "postcode" | "description" | "categoryIds"
const FIELDS: { key: FieldKey; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "phonePublic", label: "Phone" },
  { key: "address", label: "Address" },
  { key: "postcode", label: "Postcode" },
  { key: "categoryIds", label: "Categories" },
  { key: "description", label: "Description" },
]

function words(s: string) {
  return new Set(s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !["ltd", "and", "the", "services"].includes(w)))
}

/** A-05: side-by-side duplicates; choose the surviving value per field; reviews, enquiries and threads move to the survivor. */
export default function AdminMerge({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const s = useStore()
  const base = s.listings.find((l) => l.id === id && !l.mergedInto)
  const candidates = React.useMemo(() => {
    if (!base) return []
    const w = words(base.name)
    return s.listings
      .filter((l) => l.id !== base.id && !l.mergedInto)
      .map((l) => {
        const shared = [...words(l.name)].filter((x) => w.has(x)).length
        const near = milesBetween(base.geo, l.geo)
        const sameCat = l.categoryIds.some((c) => base.categoryIds.includes(c))
        return { l, score: shared * 3 + (sameCat ? 2 : 0) + (near < 1 ? 2 : near < 3 ? 1 : 0) - (l.layer === "claimed" && base.layer === "claimed" ? 4 : 0), near }
      })
      .sort((a, b) => b.score - a.score || a.near - b.near)
  }, [s.listings, base])
  const [otherId, setOtherId] = React.useState<string>("")
  const other = s.listings.find((l) => l.id === (otherId || candidates[0]?.l.id))
  const [survivorSide, setSurvivorSide] = React.useState<"a" | "b" | null>(null)
  const [pick, setPick] = React.useState<Partial<Record<FieldKey, "a" | "b">>>({})

  if (!base) {
    return (
      <AdminPage id="A-05" title="Merge" back={{ href: "/admin/listings", label: "Listings" }}>
        <NoAccess />
      </AdminPage>
    )
  }
  const a = base
  const b = other
  const defaultSurvivor: "a" | "b" = b && b.layer === "claimed" && a.layer !== "claimed" ? "b" : "a"
  const side = survivorSide ?? defaultSurvivor
  const survivor = side === "a" ? a : b
  const loser = side === "a" ? b : a
  const bothClaimed = a.layer === "claimed" && b?.layer === "claimed"
  const fmt = (l: Listing, k: FieldKey) => (k === "categoryIds" ? l.categoryIds.map((c) => s.categories.find((x) => x.id === c)?.name ?? c).join(", ") : String(l[k] ?? "") || "—")
  const choice = (k: FieldKey) => pick[k] ?? side

  const counts = (l: Listing) => ({
    reviews: s.reviews.filter((r) => r.listingId === l.id).length,
    enquiries: s.enquiries.filter((e) => e.listingId === l.id).length,
    threads: s.threads.filter((t) => t.listingId === l.id).length,
  })

  return (
    <AdminPage id="A-05" title="Merge duplicates" perm="merge" back={{ href: `/admin/listings/${a.id}`, label: a.name }} description="Choose the surviving value for each field. Reviews, enquiries, calls and threads move to the survivor and the other listing redirects to it.">
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <label className="flex min-w-[360px] flex-col gap-1.5">
          <span className="t-label text-navy">Possible duplicate of {a.name}</span>
          <select
            value={b?.id ?? ""}
            onChange={(e) => {
              setOtherId(e.target.value)
              setPick({})
              setSurvivorSide(null)
            }}
            className={adminInput}
          >
            {candidates.map(({ l, near }) => (
              <option key={l.id} value={l.id}>
                {l.name} · {l.layer} · {l.postcodeDistrict} · {near.toFixed(1)} mi
              </option>
            ))}
          </select>
        </label>
      </div>
      {!b ? (
        <p className="t-body text-slate">No other listings to merge with.</p>
      ) : (
        <>
          {bothClaimed && (
            <Banner tone="warning" title="Both listings are claimed" className="mb-4">
              Two businesses own these listings. Resolve ownership in the claims queue before merging.
            </Banner>
          )}
          <Panel title="Choose surviving values">
            <table className="w-full table-fixed text-[13.5px]" aria-label="Fields to merge">
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="w-36 py-2 font-semibold text-navy">Field</th>
                  {([["a", a], ["b", b]] as const).map(([k, l]) => (
                    <th key={k} className="py-2 pr-4 font-semibold text-navy">
                      <div className="flex flex-wrap items-center gap-2">
                        <span>{l.name}</span>
                        <Pill tone={l.layer === "claimed" ? "good" : l.layer === "seeded" ? "info" : "plain"}>{l.layer}</Pill>
                        <label className="ml-auto inline-flex min-h-11 cursor-pointer items-center gap-2 font-normal text-slate">
                          <input type="radio" name="survivor" checked={side === k} onChange={() => setSurvivorSide(k)} className="size-4 accent-blue" />
                          Survives
                        </label>
                      </div>
                      <p className="t-caption font-normal text-muted-ink">
                        {(() => {
                          const c = counts(l)
                          const r = listingRating(s, l)
                          return `${c.reviews} reviews · ${c.enquiries} enquiries · ${c.threads} threads${r.count ? ` · ${r.rating.toFixed(1)}★` : ""}`
                        })()}
                      </p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FIELDS.map((f) => (
                  <tr key={f.key} className="border-b border-line align-top last:border-0">
                    <th scope="row" className="py-2 text-left font-medium text-muted-ink">
                      {f.label}
                    </th>
                    {([["a", a], ["b", b]] as const).map(([k, l]) => (
                      <td key={k} className="py-1.5 pr-4">
                        <label className={cn("flex min-h-11 cursor-pointer items-start gap-2 rounded-lg border px-3 py-2", choice(f.key) === k ? "border-blue bg-blue-tint/60" : "border-line hover:border-blue/50")}>
                          <input type="radio" name={`f-${f.key}`} checked={choice(f.key) === k} onChange={() => setPick((p) => ({ ...p, [f.key]: k }))} className="mt-0.5 size-4 shrink-0 accent-blue" aria-label={`Keep ${f.label.toLowerCase()} from ${l.name}`} />
                          <span className="line-clamp-3 text-navy">{fmt(l, f.key)}</span>
                        </label>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
          <div className="mt-4 flex items-center justify-end gap-3">
            <p className="t-label font-normal text-slate">
              {loser!.name} will redirect to {survivor!.name}.
            </p>
            <ReasonButton
              perm="merge"
              size="md"
              variant="primary"
              label="Merge"
              icon={<GitMerge aria-hidden />}
              disabled={bothClaimed}
              showDenied
              title={`Merge into ${survivor!.name}?`}
              description={`${loser!.name}'s reviews, enquiries, calls and threads move to ${survivor!.name}. This can't be undone.`}
              confirmLabel="Merge listings"
              presets={["Duplicate from import", "Same business, two listings"]}
              onConfirm={(reason) => {
                const fields: Partial<Listing> = {}
                for (const f of FIELDS) {
                  const src = choice(f.key) === "a" ? a : b
                  ;(fields as Record<string, unknown>)[f.key] = f.key === "categoryIds" ? [...src.categoryIds] : src[f.key]
                }
                useStore.getState().mergeListings(survivor!.id, loser!.id, fields, reason)
                toast(`Merged into ${survivor!.name}`)
                router.push(`/admin/listings/${survivor!.id}`)
              }}
            />
          </div>
        </>
      )}
    </AdminPage>
  )
}
