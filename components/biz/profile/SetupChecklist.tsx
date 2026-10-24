"use client"
import * as React from "react"
import Link from "next/link"
import { Check, ChevronRight, Clock } from "lucide-react"
import { Banner } from "@/components/answerd/Feedback"
import { setupProgress, setupSteps, type SetupStep } from "@/components/app/biz"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import type { Claim } from "@/lib/types"

/** Steps and progress for a business, computed from real data. */
export function useSetup(businessId: string | null | undefined) {
  const s = useStore()
  const biz = s.businesses.find((b) => b.id === businessId)
  const listing = s.listings.find((l) => l.id === biz?.listingId)
  if (!biz || !listing) return null
  const steps = setupSteps(s, biz, listing)
  const claim = s.claims.filter((c) => c.listingId === listing.id && c.status !== "disputed").sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] as Claim | undefined
  return { biz, listing, steps, progress: setupProgress(steps), claim }
}

export function ProgressRing({ value, size = 88, stroke = 8, label }: { value: number; size?: number; stroke?: number; label?: string }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }} role="img" aria-label={label ?? `${value}% complete`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-blue-tint)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={value >= 100 ? "var(--color-teal)" : "var(--color-blue)"} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} className="transition-[stroke-dashoffset] duration-500 ease-out motion-reduce:transition-none" />
      </svg>
      <span className={cn("absolute font-bold text-navy tnum", size >= 72 ? "text-[20px]" : "text-[13px]")} aria-hidden>
        {value}%
      </span>
    </span>
  )
}

/** Verification pending / not approved banner for a business whose claim is still being checked. */
export function VerificationBanner({ businessId, documentHref, className }: { businessId: string; documentHref?: (listingId: string) => string; className?: string }) {
  const setup = useSetup(businessId)
  if (!setup || setup.biz.status !== "pending") return null
  const { claim, listing } = setup
  const href = (documentHref ?? ((id) => `/app/biz/claim/${id}/verify/document`))(listing.id)
  if (claim?.status === "rejected" || claim?.status === "more_info")
    return (
      <Banner
        tone={claim.status === "rejected" ? "error" : "warning"}
        className={className}
        title={claim.status === "rejected" ? "Verification not approved" : "We need a bit more to verify you"}
        action={
          <Link href={href} className="inline-flex h-9 items-center rounded-full bg-white px-4 t-label text-navy hover:bg-sky">
            Upload again
          </Link>
        }
      >
        {claim.reason ?? "We couldn't match your document to the business."}
      </Banner>
    )
  return (
    <Banner tone="warning" className={className} icon={<Clock className="size-5" aria-hidden />} title="Verification pending">
      We&apos;re checking your {claim?.evidenceKind?.toLowerCase() ?? "document"} and will text you within 1 working day. Carry on setting up meanwhile.
    </Banner>
  )
}

/** B-09: progress ring and steps, each with a done tick. */
export function SetupChecklist({ businessId, hrefFor, documentHref, className }: { businessId: string; hrefFor?: (step: SetupStep) => string; documentHref?: (listingId: string) => string; className?: string }) {
  const setup = useSetup(businessId)
  if (!setup) return null
  const { steps, progress, listing } = setup
  const required = steps.filter((x) => !x.optional)
  const done = required.filter((x) => x.done).length
  return (
    <div className={cn("space-y-4", className)}>
      <VerificationBanner businessId={businessId} documentHref={documentHref} />
      <div className="card flex items-center gap-4 p-4">
        <ProgressRing value={progress} label={`Setup ${progress}% complete`} />
        <div className="min-w-0">
          <h2 className="t-heading">{progress >= 100 ? "You're all set" : "Finish your profile"}</h2>
          <p className="mt-0.5 t-label font-normal text-slate tnum">
            {done} of {required.length} done.{" "}
            {progress >= 100 ? `${listing.name} is ready for customers.` : "Complete profiles get more enquiries."}
          </p>
        </div>
      </div>
      <ol className="card divide-y divide-line overflow-hidden" aria-label="Setup steps">
        {steps.map((st) => (
          <li key={st.key}>
            <Link href={hrefFor ? hrefFor(st) : st.href} className="flex min-h-16 items-center gap-3 px-4 py-3 hover:bg-sky">
              <span className={cn("inline-flex size-8 shrink-0 items-center justify-center rounded-full border-2", st.done ? "border-teal bg-teal text-navy" : "border-line bg-white text-muted-ink")}>
                {st.done ? <Check className="size-4" aria-hidden /> : <span className="size-1.5 rounded-full bg-line" aria-hidden />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block t-label text-navy">
                  {st.label}
                  {st.optional && <span className="font-normal text-muted-ink"> (optional)</span>}
                  <span className="sr-only">{st.done ? ", done" : ", to do"}</span>
                </span>
                <span className="block truncate t-caption text-muted-ink">{st.sub}</span>
              </span>
              <ChevronRight className="size-5 shrink-0 text-muted-ink" aria-hidden />
            </Link>
          </li>
        ))}
      </ol>
    </div>
  )
}

/** Compact checklist card for B-18 Today (and W-13): hidden once setup is complete. */
export function SetupChecklistCard({ businessId, href = "/app/biz/setup", hrefFor, className }: { businessId: string; href?: string; hrefFor?: (step: SetupStep) => string; className?: string }) {
  const setup = useSetup(businessId)
  if (!setup || setup.progress >= 100) return null
  const required = setup.steps.filter((x) => !x.optional)
  const next = required.find((x) => !x.done)
  return (
    <section className={cn("card p-4", className)} aria-labelledby="setup-card-title">
      <div className="flex items-center gap-3">
        <ProgressRing value={setup.progress} size={52} stroke={6} label={`Setup ${setup.progress}% complete`} />
        <div className="min-w-0 flex-1">
          <h2 id="setup-card-title" className="t-subhead">
            Finish setting up
          </h2>
          <p className="t-caption text-muted-ink tnum">
            {required.filter((x) => x.done).length} of {required.length} done{setup.biz.status === "pending" ? " · verification pending" : ""}
          </p>
        </div>
        <Link href={href} className="inline-flex h-11 items-center rounded-full px-3 t-label text-blue hover:bg-blue-tint">
          See all
        </Link>
      </div>
      {next && (
        <Link href={hrefFor ? hrefFor(next) : next.href} className="mt-3 flex min-h-12 items-center gap-3 rounded-xl bg-sky px-3 py-2 hover:bg-blue-tint">
          <span className="min-w-0 flex-1">
            <span className="block t-label text-navy">Next: {next.label}</span>
            <span className="block truncate t-caption text-muted-ink">{next.sub}</span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-muted-ink" aria-hidden />
        </Link>
      )}
    </section>
  )
}
