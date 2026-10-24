import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ScreenMeta } from "@/components/shells/ScreenMeta"
import { Breadcrumbs, Container } from "@/components/web/ui"
import { LEGAL_DOCS, legalDoc } from "@/components/web/legal"
import { cn } from "@/lib/utils"

export function generateStaticParams() {
  return LEGAL_DOCS.map((d) => ({ doc: d.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ doc: string }> }): Promise<Metadata> {
  const { doc } = await params
  const d = legalDoc(doc)
  if (!d) return {}
  return { title: d.title, description: d.summary, alternates: { canonical: `/legal/${d.slug}` } }
}

/** W-22: Legal pages, clearly marked as placeholder text. */
export default async function Page({ params }: { params: Promise<{ doc: string }> }) {
  const { doc } = await params
  const d = legalDoc(doc)
  if (!d) notFound()
  return (
    <>
      <ScreenMeta id="W-22" />
      <Container className="py-10 md:py-14">
        <Breadcrumbs
          items={[
            { name: "Home", href: "/" },
            { name: d.title, href: `/legal/${d.slug}` },
          ]}
        />
        <div className="mt-6 grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
          <nav aria-label="Legal" className="lg:sticky lg:top-28 lg:self-start">
            <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
              {LEGAL_DOCS.map((x) => (
                <li key={x.slug}>
                  <Link href={`/legal/${x.slug}`} aria-current={x.slug === d.slug ? "page" : undefined} className={cn("inline-flex min-h-11 items-center rounded-full px-4 t-label lg:flex lg:rounded-xl", x.slug === d.slug ? "bg-blue-tint text-navy" : "text-slate hover:bg-white hover:text-navy")}>
                    {x.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <article className="card min-w-0 p-6 md:p-10">
            <p className="inline-flex rounded-full bg-amber-tint px-3 py-1 t-caption text-amber-ink">Placeholder: not the final legal text</p>
            <h1 className="t-title mt-4">{d.title}</h1>
            <p className="mt-2 t-body text-slate">{d.summary}</p>
            <p className="mt-1 t-caption text-muted-ink">Answerd is a Vitalos product · answerd.vitalos.co.uk</p>
            {d.sections.map((sec, i) => (
              <section key={sec.heading} className="mt-8" aria-labelledby={`sec-${i}`}>
                <h2 id={`sec-${i}`} className="t-heading">
                  {i + 1}. {sec.heading}
                </h2>
                <p className="mt-2 t-body text-slate">{sec.body}</p>
              </section>
            ))}
          </article>
        </div>
      </Container>
    </>
  )
}
