import { Reveal, Stagger, StaggerItem } from "./reveal"
import { site } from "@/content/site"

const { id, heading, intro, steps } = site.howItWorks

export function HowItWorks() {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="py-16 md:py-24">
      <div className="container-site">
        <Reveal className="mx-auto max-w-[640px] text-center">
          <h2 id={`${id}-title`} className="t-section">
            {heading}
          </h2>
          <p className="t-lead mt-4">{intro}</p>
        </Reveal>

        <div className="relative mt-12 md:mt-16">
          {/* Connecting line between the step numbers (desktop only); it shows in the gaps between cards. */}
          <div
            aria-hidden
            className="pointer-events-none absolute top-[60px] right-[12%] left-[12%] hidden h-0 border-t-2 border-dashed border-blue/30 lg:block"
          />
          <Stagger stagger={0.1}>
            <ol className="relative grid gap-5 md:grid-cols-3 md:gap-6 lg:gap-12">
              {steps.map((step, i) => (
                <li key={step.title}>
                  <StaggerItem className="h-full">
                    <div className="card-site flex h-full items-start gap-5 p-6 transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lift motion-reduce:transition-none motion-reduce:hover:translate-y-0 md:block md:p-8">
                      <span
                        aria-hidden
                        className="tnum grid size-12 shrink-0 place-items-center md:size-14 rounded-full bg-blue-tint text-2xl font-bold text-blue"
                      >
                        {i + 1}
                      </span>
                      <div>
                        <h3 className="t-card-title md:mt-6">
                          <span className="sr-only">Step {i + 1}: </span>
                          {step.title}
                        </h3>
                        <p className="mt-1 md:mt-2">{step.body}</p>
                      </div>
                    </div>
                  </StaggerItem>
                </li>
              ))}
            </ol>
          </Stagger>
        </div>
      </div>
    </section>
  )
}
