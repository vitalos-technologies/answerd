import type { Metadata } from "next"
import { pageMeta } from "@/lib/seo"
import Link from "next/link"
import { Building2, HeartHandshake, Mail, MessagesSquare, type LucideIcon } from "lucide-react"
import { WebPage } from "@/components/web/page"
import { JsonLd, PageHeader } from "@/components/web/ui"
import { focusRing } from "@/components/site/focus"
import { pages } from "@/content/pages"
import { SITE_URL, site } from "@/content/site"

export const metadata: Metadata = pageMeta({ title: pages.about.metaTitle, description: pages.about.metaDescription, path: "/about" })

const ICONS: Record<string, LucideIcon> = { Building2, MessagesSquare, HeartHandshake }

/** W-21: about Answerd, by Vitalos, chat powered by Askbridge. */
export default function AboutPage() {
  const a = pages.about
  return (
    <WebPage>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Organization", name: site.name, url: SITE_URL, slogan: site.tagline, parentOrganization: { "@type": "Organization", name: "Vitalos Technologies", url: "https://vitalos.co.uk" } }} />
      <PageHeader crumbs={[{ name: pages.common.home, href: "/" }, { name: a.metaTitle, href: "/about" }]} eyebrow={site.tagline} title={a.heading}>
        <p className="t-lead mt-4 max-w-[46rem]">{a.body}</p>
      </PageHeader>
      <div className="container-site py-12 md:py-16">
        <ul className="grid gap-5 md:grid-cols-3">
          {a.cards.map((c) => {
            const Icon = ICONS[c.icon] ?? Building2
            return (
              <li key={c.title} className="card-site p-6 md:p-7">
                <span aria-hidden className="grid size-12 place-items-center rounded-xl bg-blue-tint text-blue">
                  <Icon className="size-6" />
                </span>
                <h2 className="t-card-title mt-5">{c.title}</h2>
                <p className="mt-2 text-slate">{c.body}</p>
              </li>
            )
          })}
        </ul>
        <section aria-labelledby="about-contact" className="card-site mt-8 flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-10">
          <div>
            <h2 id="about-contact" className="t-card-title">
              {a.contactHeading}
            </h2>
            <p className="mt-2 text-slate">{a.contactBody}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a href={`mailto:${a.contactEmail}`} className={`inline-flex h-12 items-center justify-center gap-2 rounded-full border border-line bg-white px-6 font-semibold text-navy hover:bg-sky ${focusRing}`}>
              <Mail className="size-5 text-blue" aria-hidden /> {a.contactEmail}
            </a>
            <Link href="/help" className={`inline-flex h-12 items-center justify-center rounded-full border border-line bg-white px-6 font-semibold text-navy hover:bg-sky ${focusRing}`}>
              {a.help}
            </Link>
          </div>
        </section>
      </div>
    </WebPage>
  )
}
