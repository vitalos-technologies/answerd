import { site } from "@/content/site"
import { cn } from "@/lib/utils"
import { Reveal, Stagger, StaggerItem } from "./reveal"
import { FEATURE_SNIPPETS } from "./phone/snippets"

/* Each card gets its own soft panel colour behind the phone snippet. */
const PANELS: Record<string, { bg: string; glow: string }> = {
  pickup: { bg: "bg-[linear-gradient(180deg,#EAF0FF_0%,#F6F8FE_100%)]", glow: "rgba(20,184,166,.22)" },
  verified: { bg: "bg-[linear-gradient(180deg,#E9F7F5_0%,#F5FBFA_100%)]", glow: "rgba(37,99,255,.18)" },
  book: { bg: "bg-[linear-gradient(180deg,#F1F5F9_0%,#F8FAFC_100%)]", glow: "rgba(37,99,255,.2)" },
  ask: { bg: "bg-[linear-gradient(180deg,#EAF0FF_0%,#F1FAF9_100%)]", glow: "rgba(20,184,166,.2)" },
}

export function WhyAnswerd() {
  const w = site.why
  return (
    <section id={w.id} aria-labelledby="why-heading" className="scroll-mt-20 py-16 md:py-24">
      <div className="container-site">
        <Reveal>
          <h2 id="why-heading" className="t-section">
            {w.heading}
          </h2>
        </Reveal>

        <Stagger className="mt-10 grid gap-5 md:mt-12 md:grid-cols-2 md:gap-6" stagger={0.08}>
          {w.features.map((f) => {
            const Snippet = FEATURE_SNIPPETS[f.key]
            const panel = PANELS[f.key] ?? PANELS.book
            return (
              <StaggerItem key={f.key} className="h-full">
                <article className="card-site h-full overflow-hidden transition-[translate,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lift motion-reduce:hover:translate-y-0">
                  <div className={cn("relative flex h-[272px] justify-center overflow-hidden border-b border-line pt-6 md:h-[300px] md:pt-8", panel.bg)}>
                    <div
                      aria-hidden
                      className="pointer-events-none absolute top-[30%] left-1/2 size-[340px] -translate-x-1/2 rounded-full"
                      style={{ background: `radial-gradient(closest-side, ${panel.glow}, transparent)` }}
                    />
                    {Snippet && <Snippet />}
                  </div>
                  <div className="p-6 md:p-8">
                    <h3 className="t-card-title">{f.title}</h3>
                    <p className="mt-2 text-slate">{f.body}</p>
                  </div>
                </article>
              </StaggerItem>
            )
          })}
        </Stagger>
      </div>
    </section>
  )
}
