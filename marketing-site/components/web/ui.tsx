// Server-rendered building blocks for the pages ported from the prototype (SEO pages, listings, help, legal).
// No hooks and no client code: these add HTML, not JavaScript.
import Link from "next/link"
import { ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { focusRing } from "@/components/site/focus"
import { pages } from "@/content/pages"
import type { Faq, Tone } from "@/lib/data/queries"

export function Breadcrumbs({ items, className }: { items: { name: string; href: string }[]; className?: string }) {
  return (
    <nav aria-label={pages.common.breadcrumb} className={cn("min-w-0", className)}>
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-0.5 text-[14px] leading-5 text-muted-ink">
        {items.map((it, i) => {
          const last = i === items.length - 1
          return (
            <li key={it.href} className="inline-flex items-center gap-1">
              {last ? (
                <span aria-current="page" className="font-medium text-navy">
                  {it.name}
                </span>
              ) : (
                <>
                  <Link href={it.href} className={`inline-flex min-h-8 items-center rounded-sm hover:text-navy hover:underline ${focusRing}`}>
                    {it.name}
                  </Link>
                  <ChevronRight className="size-3.5 shrink-0" aria-hidden />
                </>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

/** Structured data. Escapes "<" so the JSON can't close the script tag. */
export function JsonLd({ data }: { data: object | object[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />
}

/** Page intro band used by the SEO, help and about pages. */
export function PageHeader({ crumbs, eyebrow, title, children, className }: { crumbs?: { name: string; href: string }[]; eyebrow?: string; title: React.ReactNode; children?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("border-b border-line bg-[linear-gradient(180deg,#F7F9FD_0%,#FFFFFF_100%)]", className)}>
      <div className="container-site pt-4 pb-10 md:pt-6 md:pb-14">
        {crumbs && <Breadcrumbs items={crumbs} />}
        {eyebrow && <p className="t-small mt-6 font-semibold tracking-[0.06em] text-blue uppercase">{eyebrow}</p>}
        <h1 className={cn("text-[32px] leading-[38px] font-bold tracking-[-0.02em] text-balance md:text-[44px] md:leading-[52px]", eyebrow ? "mt-3" : "mt-5")}>{title}</h1>
        {children}
      </div>
    </div>
  )
}

export function SectionTitle({ id, title, intro, className }: { id: string; title: string; intro?: string; className?: string }) {
  return (
    <div className={className}>
      <h2 id={id} className="text-[22px] leading-[30px] font-bold tracking-[-0.01em] md:text-[26px] md:leading-[34px]">
        {title}
      </h2>
      {intro && <p className="mt-1.5 text-slate">{intro}</p>}
    </div>
  )
}

/** FAQs as native disclosure widgets: no JavaScript, works with the keyboard and screen readers. */
export function FaqList({ faqs, title = pages.common.faqsHeading, id = "faqs" }: { faqs: Faq[]; title?: string; id?: string }) {
  return (
    <section aria-labelledby={`${id}-h`}>
      <SectionTitle id={`${id}-h`} title={title} />
      <div className="mt-5 rounded-2xl border border-line bg-white px-5 shadow-card md:px-7">
        {faqs.map((f) => (
          <details key={f.q} className="group border-b border-line last:border-b-0 [&_summary::-webkit-details-marker]:hidden">
            <summary className={`flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-lg py-4 text-base leading-6 font-semibold text-navy hover:text-blue md:text-[17px] ${focusRing}`}>
              {f.q}
              <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-sky text-navy transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none">
                <ChevronDown className="size-[18px]" strokeWidth={2.2} />
              </span>
            </summary>
            <p className="pr-10 pb-5 text-slate">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

const TONES: Record<Tone, string> = {
  blue: "bg-blue-tint text-blue-hover",
  teal: "bg-teal-tint text-teal-ink",
  amber: "bg-amber-tint text-amber-ink",
  sky: "bg-sky text-navy",
}

/** Initials avatar on a brand tint chosen by category (never a random colour). */
export function Avatar({ initials, tone, size = 56, className }: { initials: string; tone: Tone; size?: number; className?: string }) {
  return (
    <span aria-hidden className={cn("inline-flex shrink-0 items-center justify-center rounded-xl font-bold tracking-tight", TONES[tone], className)} style={{ width: size, height: size, fontSize: Math.round(size * 0.34) }}>
      {initials}
    </span>
  )
}

export function toneClasses(tone: Tone) {
  return TONES[tone]
}

/** "★ 4.9 (132 reviews)". The star is decorative; the number carries the meaning. */
export function Rating({ rating, count, google, className }: { rating: number; count: number; google?: boolean; className?: string }) {
  if (!count) return <p className={cn("text-[14px] leading-5 text-muted-ink", className)}>{pages.common.noReviews}</p>
  return (
    <p className={cn("flex items-center gap-1 text-[14px] leading-5", className)}>
      <svg aria-hidden className="size-4 shrink-0 text-amber">
        <use href="#i-star" />
      </svg>
      <span className="tnum font-semibold text-navy">{rating.toFixed(1)}</span>
      <span className="tnum text-muted-ink">
        ({count} {count === 1 ? pages.common.reviewsOne : pages.common.reviewsMany}
        {google ? ` · ${pages.common.poweredByGoogle}` : ""})
      </span>
    </p>
  )
}
