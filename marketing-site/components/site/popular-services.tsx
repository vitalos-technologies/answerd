import Link from "next/link"
import { Car, Package, Plus, Scissors, Sparkles, Trees, Truck, Wrench, Zap, type LucideIcon } from "lucide-react"
import { Reveal, Stagger, StaggerItem } from "./reveal"
import { focusRing } from "./focus"
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

/**
 * Eight service tiles, each linking to its category page (W-03). Two across below 420 px (2 × 4) and four
 * across from 420 px (4 × 2); tiles stack icon over label so they fit at four across on a phone.
 */
export function PopularServices() {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="bg-sky py-16 md:py-24">
      <div className="container-site">
        <Reveal className="mx-auto max-w-[640px] text-center">
          <h2 id={`${id}-title`} className="t-section">
            {heading}
          </h2>
          <p className="t-lead mt-4">{intro}</p>
        </Reveal>

        <Stagger stagger={0.03} className="mt-10 md:mt-14">
          <ul className="grid grid-cols-2 gap-3 min-[420px]:grid-cols-4 sm:gap-4 lg:gap-6">
            {items.map((item) => {
              const Icon = ICONS[item.icon]
              return (
                <li key={item.label}>
                  <StaggerItem className="h-full">
                    <Link
                      href={item.href}
                      className={`card-site flex h-full flex-col items-start gap-3 p-4 min-[420px]:items-center min-[420px]:px-2 min-[420px]:text-center sm:p-5 md:items-start md:p-6 md:text-left ${lift} ${focusRing}`}
                    >
                      <span aria-hidden className="grid size-11 place-items-center rounded-xl bg-blue-tint text-blue md:size-12">
                        <Icon className="size-[22px] md:size-6" strokeWidth={1.9} />
                      </span>
                      <span className="text-base leading-6 font-semibold text-navy min-[420px]:text-[14px] min-[420px]:leading-5 sm:text-base sm:leading-6 md:text-lg md:leading-7">{item.label}</span>
                    </Link>
                  </StaggerItem>
                </li>
              )
            })}
            <li className="col-span-2 min-[420px]:col-span-4">
              <StaggerItem className="h-full">
                <div className={`flex h-full items-center gap-4 rounded-2xl border border-dashed border-blue/40 bg-blue-tint p-5 md:p-6 lg:justify-center lg:py-5 ${lift}`}>
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
