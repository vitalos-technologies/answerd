import Link from "next/link"
import { Info } from "lucide-react"
import { WebPage } from "@/components/web/page"
import { Breadcrumbs } from "@/components/web/ui"
import { pages } from "@/content/pages"
import { LEGAL_NAV } from "@/content/legal"
import { cn } from "@/lib/utils"
import { focusRing } from "./focus"

/** Shared frame for the six legal placeholder pages (W-22), with navigation between them. */
export function LegalPage({ title, intro, href, updated, children }: { title: string; intro: string; href: string; updated?: string; children: React.ReactNode }) {
  const l = pages.legal
  return (
    <WebPage className="pt-4 pb-16 md:pt-6 md:pb-24">
      <div className="container-site">
        <Breadcrumbs
          items={[
            { name: pages.common.home, href: "/" },
            { name: title, href },
          ]}
        />
        <div className="mt-6 grid gap-10 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-16">
          <nav aria-label={l.nav} className="lg:sticky lg:top-24 lg:self-start">
            <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
              {LEGAL_NAV.map((x) => (
                <li key={x.href}>
                  <Link
                    href={x.href}
                    aria-current={x.href === href ? "page" : undefined}
                    className={cn("inline-flex min-h-11 items-center rounded-full px-4 text-[15px] font-medium lg:flex lg:rounded-xl", x.href === href ? "bg-blue-tint text-navy" : "text-slate hover:bg-sky hover:text-navy", focusRing)}
                  >
                    {x.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <article className="max-w-[760px] min-w-0">
            <p className="t-small font-semibold tracking-[0.06em] text-blue uppercase">{l.eyebrow}</p>
            <h1 className="mt-3 text-[34px] leading-10 font-bold tracking-[-0.02em] md:text-[44px] md:leading-[52px]">{title}</h1>
            <p className="t-lead mt-4">{intro}</p>
            {updated && <p className="t-small mt-3 text-muted-ink">{updated}</p>}

            <div role="note" className="mt-8 flex gap-3 rounded-2xl border border-blue/20 bg-blue-tint p-5 text-navy">
              <Info className="mt-0.5 size-5 shrink-0 text-blue" aria-hidden />
              <p className="text-[15px] leading-6">
                <strong className="font-semibold">{l.placeholderTitle}</strong> {l.placeholderBody}
              </p>
            </div>

            <div className="mt-10 flex flex-col gap-10">{children}</div>
          </article>
        </div>
      </div>
    </WebPage>
  )
}

export function LegalSection({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-h` : undefined} className="flex flex-col gap-3">
      <h2 id={id ? `${id}-h` : undefined} className="text-[22px] leading-8 font-bold tracking-[-0.01em] md:text-2xl">
        {title}
      </h2>
      <div className="flex flex-col gap-3 text-slate">{children}</div>
    </section>
  )
}
