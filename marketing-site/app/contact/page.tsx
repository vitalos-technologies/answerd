import type { Metadata } from "next"
import Link from "next/link"
import { pageMeta } from "@/lib/seo"
import { WebPage } from "@/components/web/page"
import { PageHeader } from "@/components/web/ui"
import { ContactForm } from "@/components/web/contact-form"
import { linkCls } from "@/components/web/form"
import { pages } from "@/content/pages"

export const metadata: Metadata = pageMeta({ title: pages.contact.metaTitle, description: pages.contact.metaDescription, path: "/contact" })

/** Contact form: messages go to the Vitalos admin inbox (Enquiries) through app/api/contact. */
export default function ContactPage() {
  const c = pages.contact
  return (
    <WebPage>
      <PageHeader crumbs={[{ name: pages.common.home, href: "/" }, { name: c.heading, href: "/contact" }]} title={c.heading}>
        <p className="t-lead mt-4 max-w-[46rem]">{c.lead}</p>
      </PageHeader>
      <div className="container-site py-12 md:py-16">
        <div className="mx-auto flex max-w-[44rem] flex-col gap-6">
          <p className="text-slate">
            {c.helpFirst}{" "}
            <Link href="/help" className={linkCls}>
              {c.helpLink}
            </Link>
          </p>
          <div className="card-site relative p-6 md:p-8">
            <ContactForm copy={c} email={pages.about.contactEmail} />
          </div>
        </div>
      </div>
    </WebPage>
  )
}
