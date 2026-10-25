"use client"
import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronRight, Plus, Search, ShieldAlert } from "lucide-react"
import { AppScreen, TopBar } from "@/components/shells/AppScreen"
import { Button } from "@/components/answerd/Button"
import { BottomSheet } from "@/components/answerd/Sheet"
import { EmptyState } from "@/components/answerd/Feedback"
import { Field, TextArea, TextInput, inputCls } from "@/components/answerd/Fields"
import { ListingAvatar } from "@/components/answerd/Media"
import { useClaimAuth, sourceHint, claimState, nameSimilarity } from "@/components/app/claim"
import { withSuspense } from "@/components/app/helpers"
import { useStore } from "@/lib/store"
import { districtOf, lookupPostcode } from "@/lib/geo"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { Listing } from "@/lib/types"

/** B-01: search all three layers by name and postcode. ?listing= (from C-17) or ?name=&postcode= prefill and search. */
function FindBusiness() {
  const sp = useSearchParams()
  const qs = sp.toString()
  useClaimAuth(qs ? `/app/biz/claim?${qs}` : "/app/biz/claim")
  const router = useRouter()
  const s = useStore()
  const prefill = s.listings.find((l) => l.id === sp.get("listing"))
  const [name, setName] = React.useState(prefill?.name ?? sp.get("name") ?? "")
  const [postcode, setPostcode] = React.useState(prefill?.postcode ?? sp.get("postcode") ?? "")
  const [searched, setSearched] = React.useState(!!prefill || !!sp.get("name"))
  const [dispute, setDispute] = React.useState<Listing | null>(null)
  const closeDispute = React.useCallback(() => setDispute(null), [])
  const [details, setDetails] = React.useState("")
  const [evidence, setEvidence] = React.useState("")

  const district = postcode.trim() ? (lookupPostcode(postcode)?.district ?? districtOf(postcode)) : null
  const results = searched
    ? s.listings
        .filter((l) => !l.mergedInto)
        .map((l) => ({ l, score: (name.trim() ? (l.name.toLowerCase().includes(name.trim().toLowerCase()) ? 1 : nameSimilarity(name, l.name)) : 0.5) + (district && l.postcodeDistrict === district ? 0.5 : 0) }))
        .filter((x) => x.score >= (name.trim() ? 0.5 : 1) && (!district || x.l.postcodeDistrict === district || x.score >= 1))
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)
        .map((x) => x.l)
    : []

  return (
    <AppScreen id="B-01" bg="white" header={<TopBar title="List your business" back />}>
      <div className="px-4 pb-6 pt-2">
        <h1 className="t-title">Let&apos;s find your business</h1>
        <p className="mt-1 t-body text-slate">Many businesses are already on Answerd from public records. Claim yours for free.</p>
        <form
          className="mt-5 space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            setSearched(true)
          }}
        >
          <Field label="Business name" htmlFor="bn">
            <TextInput id="bn" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Norwood Locksmiths" autoFocus />
          </Field>
          <Field label="Postcode" htmlFor="bpc" optional>
            <TextInput id="bpc" value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder="SE25 4AA" className="uppercase" />
          </Field>
          <Button block type="submit" disabled={!name.trim() && !postcode.trim()}>
            <Search /> Search
          </Button>
        </form>

        {searched && (
          <section className="mt-6" aria-labelledby="res">
            <h2 id="res" className="t-subhead">
              {results.length ? `${results.length} possible match${results.length > 1 ? "es" : ""}` : "No matches"}
            </h2>
            {results.length ? (
              <ul className="mt-3 space-y-2">
                {results.map((l) => {
                  const st = claimState(s, l)
                  return (
                    <li key={l.id}>
                      {st === "taken" ? (
                        <div className="flex items-center gap-3 rounded-2xl border border-line p-3">
                          <ListingAvatar listing={l} size={44} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate t-label text-navy">{l.name}</p>
                            <p className="truncate t-caption text-muted-ink">{l.address}</p>
                            <p className="mt-0.5 inline-flex items-center gap-1 t-caption text-amber-ink">
                              <ShieldAlert className="size-3.5" aria-hidden /> Already claimed
                            </p>
                          </div>
                          <Button size="sm" variant="secondary" onClick={() => setDispute(l)} aria-label={`Dispute this claim on ${l.name}`}>
                            Dispute
                          </Button>
                        </div>
                      ) : (
                        <Link href={st === "mine" ? "/app/biz" : `/app/biz/claim/${l.id}`} onClick={() => st === "mine" && s.setMode("business", l.businessId)} className="flex items-center gap-3 rounded-2xl border border-line p-3 hover:border-blue">
                          <ListingAvatar listing={l} size={44} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate t-label text-navy">{l.name}</p>
                            <p className="truncate t-caption text-muted-ink">
                              {l.address}, {l.postcode}
                            </p>
                            <p className={cn("mt-0.5 t-caption", st === "mine" ? "text-teal-ink" : "text-muted-ink")}>{st === "mine" ? "Yours: open business mode" : sourceHint(l)}</p>
                          </div>
                          <ChevronRight className="size-5 text-muted-ink" aria-hidden />
                        </Link>
                      )}
                    </li>
                  )
                })}
              </ul>
            ) : (
              <EmptyState title="We couldn't find it" body="Add your business and it'll be live in a few minutes." className="py-6" />
            )}
          </section>
        )}
        <button type="button" onClick={() => router.push(`/app/biz/claim/new?name=${encodeURIComponent(name)}&postcode=${encodeURIComponent(postcode)}`)} className="mt-6 flex min-h-14 w-full items-center gap-3 rounded-2xl bg-sky px-4 text-left hover:bg-blue-tint">
          <Plus className="size-5 text-blue" aria-hidden />
          <span className="flex-1">
            <span className="block t-label text-navy">Can&apos;t see it? Add your business</span>
            <span className="block t-caption text-muted-ink">Takes about two minutes</span>
          </span>
        </button>
      </div>

      <BottomSheet open={!!dispute} onClose={closeDispute} title="Dispute this claim">
        <p className="t-body text-slate">Someone has already claimed {dispute?.name}. Tell us why it&apos;s yours and our team will check within 1 working day.</p>
        <form
          className="mt-4 space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (!dispute || details.trim().length < 10) return toast("Add a few details so we can check")
            s.disputeClaim(dispute.id, details.trim(), evidence || "no-file")
            toast("Dispute sent. We'll be in touch.")
            setDispute(null)
            setDetails("")
            setEvidence("")
          }}
        >
          <Field label="Why is it yours?" htmlFor="dd">
            <TextArea id="dd" rows={3} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="e.g. I'm the director; the previous claim was a former employee" />
          </Field>
          <Field label="Supporting document" htmlFor="ev" optional hint="Utility bill, lease or HMRC letter in the business name">
            <input id="ev" type="file" onChange={(e) => setEvidence(e.target.files?.[0]?.name ?? "")} className={cn(inputCls, "py-2.5 file:mr-3 file:rounded-full file:border-0 file:bg-blue-tint file:px-3 file:py-1 file:t-label file:text-blue")} />
          </Field>
          <Button block type="submit">
            Send dispute
          </Button>
        </form>
      </BottomSheet>
    </AppScreen>
  )
}

export default withSuspense(FindBusiness)
