import { MapPinned, PhoneCall, ShieldCheck, Star, type LucideIcon } from "lucide-react"
import { Tip } from "./tip"
import { site } from "@/content/site"

const ICONS: Record<(typeof site.trust)[number]["icon"], LucideIcon> = {
  MapPinned,
  ShieldCheck,
  Star,
  PhoneCall,
}

/** Compact band of trust points under the hero. Each icon is a focusable tooltip trigger. */
export function TrustStrip() {
  return (
    <section aria-label={site.trustLabel} className="py-8 md:py-10">
      <div className="container-site">
        <ul className="grid grid-cols-2 gap-x-4 gap-y-6 rounded-2xl border border-line bg-white px-5 py-6 shadow-card sm:gap-x-6 md:px-8 lg:grid-cols-4 lg:gap-8 lg:py-7">
          {site.trust.map((item) => {
            const Icon = ICONS[item.icon]
            return (
              <li key={item.icon} className="relative flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <Tip
                  label={item.label}
                  tip={item.tip}
                  className="grid size-11 shrink-0 place-items-center rounded-full bg-blue-tint text-blue transition-[box-shadow,background-color] duration-150 hover:bg-[#dce6ff] hover:shadow-[0_0_0_4px_rgba(37,99,255,0.08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"
                >
                  <Icon className="size-5" strokeWidth={2} aria-hidden />
                </Tip>
                <span className="t-small font-medium text-navy md:text-[15px] md:leading-[22px]">{item.label}</span>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
