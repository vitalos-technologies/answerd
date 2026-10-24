import { Car, Package, Plus, Scissors, Sparkles, Trees, Truck, Wrench, Zap, type LucideIcon } from "lucide-react"
import { Reveal, Stagger, StaggerItem } from "./reveal"
import { site } from "@/content/site"

const { id, heading, intro, items, more, moreBody } = site.services

const ICONS: Record<(typeof items)[number]["icon"], LucideIcon> = {
  Wrench,
  Zap,
  Sparkles,
  Car,
  Scissors,
  Trees,
  Truck,
  Package,
}

const lift =
  "transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lift motion-reduce:transition-none motion-reduce:hover:translate-y-0"

export function PopularServices() {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="bg-sky py-20 md:py-28">
      <div className="container-site">
        <Reveal className="mx-auto max-w-[640px] text-center">
          <h2 id={`${id}-title`} className="t-section">
            {heading}
          </h2>
          <p className="t-lead mt-4">{intro}</p>
        </Reveal>

        <Stagger stagger={0.05} className="mt-12 md:mt-16">
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4 lg:gap-6">
            {items.map((item) => {
              const Icon = ICONS[item.icon]
              return (
                <li key={item.label}>
                  <StaggerItem className="h-full">
                    <div className={`card-site flex h-full flex-col gap-4 p-5 md:p-6 ${lift}`}>
                      <span aria-hidden className="grid size-12 place-items-center rounded-xl bg-blue-tint text-blue">
                        <Icon className="size-6" strokeWidth={1.9} />
                      </span>
                      <span className="text-base leading-6 font-semibold text-navy md:text-lg md:leading-7">{item.label}</span>
                    </div>
                  </StaggerItem>
                </li>
              )
            })}
            <li className="col-span-2 md:col-span-1 lg:col-span-4">
              <StaggerItem className="h-full">
                <div
                  className={`flex h-full items-center gap-4 rounded-2xl border border-dashed border-blue/40 bg-blue-tint p-5 md:flex-col md:items-start md:p-6 lg:flex-row lg:items-center lg:justify-center lg:py-5 ${lift}`}
                >
                  <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-xl bg-white text-blue shadow-card">
                    <Plus className="size-6" strokeWidth={2} />
                  </span>
                  <span className="flex flex-col lg:flex-row lg:items-baseline lg:gap-3">
                    <span className="text-base leading-6 font-semibold text-navy md:text-lg md:leading-7">{more}</span>
                    <span className="t-small text-slate md:text-[15px] md:leading-[22px]">{moreBody}</span>
                  </span>
                </div>
              </StaggerItem>
            </li>
          </ul>
        </Stagger>
      </div>
    </section>
  )
}
