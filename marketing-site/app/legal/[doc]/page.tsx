import type { Metadata } from "next"
import { pageMeta } from "@/lib/seo"
import { notFound } from "next/navigation"
import { LegalPage, LegalSection } from "@/components/site/legal-page"
import { LEGAL_DOCS, legalDoc } from "@/content/legal"

export const dynamicParams = false

export function generateStaticParams() {
  return LEGAL_DOCS.map((d) => ({ doc: d.slug }))
}

export async function generateMetadata({ params }: PageProps<"/legal/[doc]">): Promise<Metadata> {
  const d = legalDoc((await params).doc)
  if (!d) return {}
  return pageMeta({ title: `${d.title} · Answerd`, description: `${d.summary} Placeholder: the final text will come from Vitalos legal.`, path: `/legal/${d.slug}` })
}

/** W-22: review policy, acceptable use and the desk call-recording notice (placeholder text). */
export default async function LegalDocPage({ params }: PageProps<"/legal/[doc]">) {
  const d = legalDoc((await params).doc)
  if (!d) notFound()
  return (
    <LegalPage href={`/legal/${d.slug}`} title={d.title} intro={d.summary}>
      {d.sections.map((s) => (
        <LegalSection key={s.heading} title={s.heading}>
          <p>{s.body}</p>
        </LegalSection>
      ))}
    </LegalPage>
  )
}
