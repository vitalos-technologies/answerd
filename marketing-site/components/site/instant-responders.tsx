import { ResultCard } from "@/components/web/result-card"
import { instantResponders } from "@/lib/data/queries"
import { site } from "@/content/site"
import { Reveal, Stagger, StaggerItem } from "./reveal"

const { id, heading, intro } = site.instant

/** W-01 "Businesses that respond instantly near you": six businesses with a live Answerd desk. Server-only HTML. */
export function InstantResponders() {
  const cards = instantResponders(6)
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="bg-sky pb-16 md:pb-24">
      <div className="container-site">
        <Reveal className="max-w-[640px]">
          <h2 id={`${id}-title`} className="t-section">
            {heading}
          </h2>
          <p className="t-lead mt-4">{intro}</p>
        </Reveal>
        <Stagger stagger={0.03} className="mt-10 md:mt-12">
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {cards.map((c) => (
              <li key={c.slug} className="min-w-0">
                <StaggerItem className="h-full">
                  <ResultCard c={c} />
                </StaggerItem>
              </li>
            ))}
          </ul>
        </Stagger>
      </div>
    </section>
  )
}
