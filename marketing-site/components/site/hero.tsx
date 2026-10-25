import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { site } from "@/content/site"
import { QrCode } from "./qr-code"
import { StoreBadges } from "./store-badges"
import { Phone } from "./phone/device"
import { PhoneFloat, Drift } from "./phone/motion"
import { FloatingBookedCard, FloatingDeskCard, SearchScreen } from "./phone/screens"
import { PulseDot } from "./phone/parts"

/* Fade-up on first paint is CSS (tw-animate-css), so the headline paints without waiting for JS.
   motion-safe: under reduced motion everything is simply there. */
const fadeUp = "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-500 motion-safe:ease-out motion-safe:fill-mode-both"

export function Hero() {
  const h = site.hero
  const notes = h.note.split(" · ")
  return (
    <section id="hero" aria-labelledby="hero-heading" className="relative isolate overflow-hidden">
      {/* Background wash */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#F7F9FD_0%,#FFFFFF_70%)]" />
        <div className="dots-hero absolute inset-0" />
      </div>

      <div className="container-site grid items-center gap-12 pt-8 pb-12 md:pt-12 md:pb-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-8 lg:pt-12 lg:pb-16 xl:gap-16">
        {/* Copy */}
        <div className="max-w-[600px]">
          <p className={cn(fadeUp, "inline-flex items-center gap-2 rounded-full border border-line bg-white/80 py-1.5 pr-3.5 pl-3 text-[14px] leading-5 font-semibold text-navy shadow-card backdrop-blur")}>
            <PulseDot size={8} />
            {site.tagline}
          </p>
          <h1 id="hero-heading" className={cn(fadeUp, "t-hero mt-5 max-w-[13ch] text-balance motion-safe:delay-[60ms] lg:mt-6")}>
            {h.headline}
          </h1>
          <p className={cn(fadeUp, "t-lead mt-5 max-w-[34rem] motion-safe:delay-[120ms] lg:mt-6 lg:text-[20px] lg:leading-[30px]")}>{h.subline}</p>

          <div className={cn(fadeUp, "mt-8 flex items-center gap-6 motion-safe:delay-[180ms] lg:mt-10")}>
            <StoreBadges block className="w-full sm:w-auto lg:flex-col xl:flex-row lg:[&>a]:w-[176px] xl:[&>a]:w-auto" />
            <div className="hidden items-center gap-3 rounded-2xl border border-line bg-white p-2.5 pr-4 shadow-card lg:flex">
              <QrCode size={76} />
              <span className="max-w-[6.5rem] text-[14px] leading-5 font-semibold text-navy">{h.qrLabel}</span>
            </div>
          </div>

          <ul className={cn(fadeUp, "mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[14px] leading-5 text-muted-ink motion-safe:delay-[240ms]")}>
            {notes.map((n) => (
              <li key={n} className="inline-flex items-center gap-1.5">
                <Check className="size-4 text-teal" strokeWidth={2.6} aria-hidden />
                {n}
              </li>
            ))}
          </ul>
        </div>

        {/* Phone */}
        <div className="relative flex justify-center lg:justify-end lg:pr-10 xl:pr-16">
          <div aria-hidden className="pointer-events-none absolute top-1/2 left-1/2 -z-10 size-[560px] -translate-x-1/2 -translate-y-1/2 md:size-[680px] lg:left-[58%]">
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(closest-side,rgba(37,99,255,.24),rgba(37,99,255,0))]" />
            <div className="absolute top-[38%] left-[30%] size-[60%] rounded-full bg-[radial-gradient(closest-side,rgba(20,184,166,.24),rgba(20,184,166,0))]" />
            <div className="absolute top-[8%] left-[44%] size-[46%] rounded-full bg-[radial-gradient(closest-side,rgba(234,240,255,1),rgba(234,240,255,0))]" />
          </div>

          <div className="relative motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-10 motion-safe:duration-700 motion-safe:ease-out motion-safe:fill-mode-both motion-safe:delay-[200ms]">
            <PhoneFloat>
              <Phone size={{ base: 272, md: 304, lg: 320 }} label="The Answerd app showing search results for a boiler service near SE25, with three local businesses, their ratings and badges">
                <SearchScreen />
              </Phone>
            </PhoneFloat>

            <Drift className="absolute top-[34%] -left-[200px] hidden md:block lg:-left-[176px] xl:-left-[204px]" delay={0.6}>
              <div aria-hidden className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left-4 motion-safe:duration-500 motion-safe:fill-mode-both motion-safe:delay-[900ms]">
                <FloatingDeskCard />
              </div>
            </Drift>
            <Drift className="absolute bottom-[12%] -right-[150px] hidden md:block lg:-right-[48px] xl:-right-[92px]" delay={1.8} distance={-5}>
              <div aria-hidden className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-4 motion-safe:duration-500 motion-safe:fill-mode-both motion-safe:delay-[1100ms]">
                <FloatingBookedCard />
              </div>
            </Drift>
          </div>
        </div>
      </div>
    </section>
  )
}
