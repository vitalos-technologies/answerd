import { Info } from "lucide-react"
import { Header } from "./header"
import { Footer } from "./footer"
import { Askbridge, CookieBanner } from "./islands"

/** Shared frame for the legal placeholder pages (terms, privacy, cookies). */
export function LegalPage({ title, intro, updated, children }: { title: string; intro: string; updated?: string; children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main id="main" className="flex-1 pt-10 pb-20 md:pt-16 md:pb-28">
        <article className="container-site max-w-[808px]">
          <p className="t-small font-semibold tracking-[0.06em] text-blue uppercase">Legal</p>
          <h1 className="mt-3 text-[34px] leading-10 font-bold tracking-[-0.02em] md:text-[44px] md:leading-[52px]">{title}</h1>
          <p className="t-lead mt-4">{intro}</p>
          {updated && <p className="t-small mt-3 text-muted-ink">{updated}</p>}

          <div role="note" className="mt-8 flex gap-3 rounded-2xl border border-blue/20 bg-blue-tint p-5 text-navy">
            <Info className="mt-0.5 size-5 shrink-0 text-blue" aria-hidden />
            <p className="text-[15px] leading-6">
              <strong className="font-semibold">Placeholder: final text to come from Vitalos legal.</strong> The headings below show what this
              document will cover. Nothing on this page is the final legal wording.
            </p>
          </div>

          <div className="mt-10 flex flex-col gap-10">{children}</div>
        </article>
      </main>
      <Footer />
      <Askbridge />
      <CookieBanner />
    </>
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
