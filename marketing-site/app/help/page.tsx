import type { Metadata } from "next"
import { pageMeta } from "@/lib/seo"
import { ChevronDown, Mail } from "lucide-react"
import { WebPage } from "@/components/web/page"
import { PageHeader, SectionTitle } from "@/components/web/ui"
import { HelpSearch } from "@/components/web/help-search"
import { focusRing } from "@/components/site/focus"
import { HELP_ARTICLES } from "@/content/help"
import { pages } from "@/content/pages"

export const metadata: Metadata = pageMeta({ title: pages.help.metaTitle, description: pages.help.metaDescription, path: "/help" })

/** W-20: help centre. Articles for customers and businesses, a search filter and how to contact us. */
export default function HelpPage() {
  const h = pages.help
  const groups = [
    { id: "for-customers", title: h.customers, list: HELP_ARTICLES.filter((a) => a.audience === "customers") },
    { id: "for-businesses", title: h.businesses, list: HELP_ARTICLES.filter((a) => a.audience === "businesses") },
  ]
  return (
    <WebPage>
      <PageHeader crumbs={[{ name: pages.common.home, href: "/" }, { name: h.heading, href: "/help" }]} title={h.heading}>
        <HelpSearch targetId="help-articles" label={h.search} placeholder={h.searchPlaceholder} count={h.count} countFor={h.countFor} none={h.none} />
      </PageHeader>
      <div className="container-site grid gap-12 py-12 md:py-16 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-14">
        <div id="help-articles" className="flex min-w-0 flex-col gap-12">
          {groups.map((g) => (
            <section key={g.id} id={g.id} data-help-group="" aria-labelledby={`${g.id}-h`} className="scroll-mt-24">
              <SectionTitle id={`${g.id}-h`} title={g.title} />
              <ul className="mt-5 rounded-2xl border border-line bg-white px-5 shadow-card md:px-7">
                {g.list.map((a) => (
                  <li key={a.slug} data-help={`${a.title} ${a.keywords} ${a.body.join(" ")}`.toLowerCase()} className="border-b border-line last:border-b-0">
                    <details id={a.slug} className="group scroll-mt-24 [&_summary::-webkit-details-marker]:hidden">
                      <summary className={`flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-lg py-4 font-semibold text-navy hover:text-blue ${focusRing}`}>
                        {a.title}
                        <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-sky text-navy transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none">
                          <ChevronDown className="size-[18px]" strokeWidth={2.2} />
                        </span>
                      </summary>
                      <div className="flex flex-col gap-2 pr-10 pb-5">
                        {a.body.map((p) => (
                          <p key={p} className="text-slate">
                            {p}
                          </p>
                        ))}
                      </div>
                    </details>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <section id="contact" aria-labelledby="contact-h" className="card-site p-6 md:p-7">
            <h2 id="contact-h" className="t-card-title">
              {h.contactHeading}
            </h2>
            <p className="mt-2 text-slate">{h.contactBody}</p>
            <a href={`mailto:${h.contactEmail}`} className={`mt-5 inline-flex h-12 items-center gap-2 rounded-full border border-line bg-white px-5 font-semibold text-navy hover:bg-sky ${focusRing}`}>
              <Mail className="size-5 text-blue" aria-hidden /> {h.contactEmail}
            </a>
            <p className="mt-4 text-[14px] leading-5 text-muted-ink">{h.chatHint}</p>
          </section>
        </aside>
      </div>
    </WebPage>
  )
}
