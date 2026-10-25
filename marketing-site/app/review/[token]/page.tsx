import type { Metadata } from "next"
import { pageMeta } from "@/lib/seo"
import Link from "next/link"
import { WebPage } from "@/components/web/page"
import { Avatar } from "@/components/web/ui"
import { ReviewForm } from "@/components/web/review-form"
import { StoreBadges } from "@/components/site/store-badges"
import { btnSecondary } from "@/components/web/form"
import { listingBySlug, primaryCategory, toneFor } from "@/lib/data/queries"
import { fmtDate } from "@/lib/data/time"
import { fill } from "@/lib/fill"
import { pages } from "@/content/pages"

export const metadata: Metadata = { ...pageMeta({ title: pages.review.metaTitle, description: pages.review.metaDescription, path: "/review" }), robots: { index: false, follow: false } }

export function generateStaticParams() {
  return Object.keys(pages.review.demoTokens).map((token) => ({ token }))
}

/**
 * W-27: review from the signed link sent after a job (D-06). Prototype: the demo tokens stand in for signed
 * links; any other token shows the expired state.
 */
export default async function ReviewPage({ params }: PageProps<"/review/[token]">) {
  const r = pages.review
  const t = r.demoTokens[(await params).token]
  const l = t ? listingBySlug(t.slug) : undefined
  return (
    <WebPage className="bg-sky">
      <div className="container-site py-10 md:py-16">
        <div className="card-site mx-auto w-full max-w-xl p-6 md:p-8">
          {!t || !l ? (
            <>
              <h1 className="text-[28px] leading-9 font-bold text-navy">{r.expired}</h1>
              <p className="mt-2 text-slate">{r.expiredBody}</p>
              <div className="mt-6">
                <StoreBadges size="sm" />
              </div>
            </>
          ) : (
            <>
              <div className="mb-6 flex items-center gap-3">
                <Avatar initials={l.initials} tone={toneFor(primaryCategory(l))} size={52} />
                <div className="min-w-0">
                  <p className="truncate text-[17px] leading-6 font-semibold text-navy">{l.name}</p>
                  <p className="text-[14px] leading-5 text-muted-ink">
                    {t.service} · {fmtDate(t.date)}
                  </p>
                </div>
              </div>
              {t.state === "reviewed" ? (
                <>
                  <h1 className="text-[28px] leading-9 font-bold text-navy">{r.reviewed}</h1>
                  <p className="mt-2 text-slate">{fill(r.reviewedBody, { name: l.name })}</p>
                  <Link href={`/b/${l.slug}#reviews`} className={`${btnSecondary} mt-6`}>
                    {r.seeReviews}
                  </Link>
                </>
              ) : (
                <ReviewForm copy={r} name={l.name} slug={l.slug} customer={t.customer} badges={<StoreBadges size="sm" />} />
              )}
            </>
          )}
        </div>
      </div>
    </WebPage>
  )
}
