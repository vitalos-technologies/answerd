import { ArrowRight, CalendarCheck, CircleCheck, MessageSquareText, PhoneIncoming, type LucideIcon } from "lucide-react"
import { Mark } from "@/components/brand/Mark"
import { GetAppButton } from "./get-app"
import { Reveal } from "./reveal"
import { site } from "@/content/site"

const { id, headline, points, note, primary, secondary, visual } = site.business

const VISUAL_ICONS: Record<(typeof visual)[number]["key"], { icon: LucideIcon; tone: string }> = {
  enquiry: { icon: MessageSquareText, tone: "bg-blue-tint text-blue" },
  booked: { icon: CalendarCheck, tone: "bg-teal-tint text-teal-ink" },
  answered: { icon: PhoneIncoming, tone: "bg-blue-tint text-blue" },
}

// Alternating offsets for the stacked cards: a gentle cascade, not a grid.
const STACK = ["self-start", "self-end", "self-start ml-6"]

export function ForBusinesses() {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="overflow-hidden bg-sky py-20 md:py-28">
      <div className="container-site grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:gap-20">
        <Reveal>
          <h2 id={`${id}-title`} className="t-section max-w-[560px]">
            {headline}
          </h2>
          <ul className="mt-8 flex flex-col gap-4">
            {points.map((point) => (
              <li key={point} className="flex items-start gap-3 text-navy">
                <CircleCheck className="mt-0.5 size-6 shrink-0 text-teal md:mt-[2px]" strokeWidth={2} aria-hidden />
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <p className="t-small mt-6 max-w-[580px] text-slate md:text-[15px] md:leading-[22px]">{note}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={primary.href}
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-blue px-6 text-base font-semibold whitespace-nowrap text-white transition-[background-color,transform] duration-150 hover:bg-blue-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue active:scale-[0.98]"
            >
              {primary.label}
              <ArrowRight
                className="size-[18px] transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transition-none"
                aria-hidden
              />
            </a>
            <GetAppButton variant="secondary" label={secondary} />
          </div>
        </Reveal>

        <Reveal delay={0.1} className="relative hidden lg:block" aria-hidden>
          {/* Soft brand glow behind the stack */}
          <div className="pointer-events-none absolute -inset-10 rounded-full bg-[radial-gradient(closest-side,rgba(37,99,255,0.14),rgba(20,184,166,0.06)_60%,transparent)]" />
          <div className="relative flex flex-col gap-4">
            {visual.map((card, i) => {
              const { icon: Icon, tone } = VISUAL_ICONS[card.key]
              return (
                <div key={card.key} className={`card-site relative flex w-[400px] max-w-[88%] items-start gap-4 p-5 shadow-lift ${STACK[i] ?? ""}`}>
                  <span className={`grid size-11 shrink-0 place-items-center rounded-full ${tone}`}>
                    <Icon className="size-5" strokeWidth={2} />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="flex items-center gap-2 text-base leading-6 font-semibold text-navy">
                      {card.title}
                      {i === 0 && <span className="size-2 rounded-full bg-teal" />}
                    </span>
                    <span className="t-small mt-1 text-slate">{card.body}</span>
                  </span>
                </div>
              )
            })}
            <div className="mt-5 ml-auto flex items-center gap-2 rounded-full border border-line bg-white py-1.5 pr-4 pl-2 shadow-card">
              <Mark size={22} />
              <span className="t-small font-semibold text-navy">{site.name}</span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
