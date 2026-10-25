import { site } from "@/content/site"
import { AppIcon } from "@/components/brand/Mark"
import { QrCode } from "./qr-code"
import { StoreBadges } from "./store-badges"
import { Reveal } from "./reveal"
import { Phone } from "./phone/device"
import { ChatScreen } from "./phone/screens"

export function DownloadBand() {
  const d = site.download
  return (
    <section id={d.id} aria-labelledby="download-heading" className="relative isolate scroll-mt-20 overflow-hidden bg-navy">
      {/* Glows and texture */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="dots-navy absolute inset-0" />
        <div className="absolute -top-[30%] right-[-10%] size-[900px] rounded-full bg-[radial-gradient(closest-side,rgba(37,99,255,.45),rgba(37,99,255,0))]" />
        <div className="absolute -bottom-[45%] left-[-15%] size-[760px] rounded-full bg-[radial-gradient(closest-side,rgba(20,184,166,.22),rgba(20,184,166,0))]" />
      </div>

      <div className="container-site grid items-center gap-10 pt-16 md:pt-24 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-8 lg:pt-0">
        <Reveal className="lg:py-24">
          <AppIcon size={56} className="shadow-[0_10px_30px_-10px_rgba(37,99,255,.8)] ring-1 ring-white/15" />
          <h2 id="download-heading" className="t-section mt-6 !text-white text-balance md:max-w-[15ch] lg:text-[44px] lg:leading-[52px]">
            {d.headline}
          </h2>
          <p className="t-lead mt-4 max-w-[30rem] !text-white/85">{d.line}</p>

          <div className="mt-8 flex items-center gap-6 lg:mt-10">
            <StoreBadges block className="w-full sm:w-auto [&_a]:ring-white/30 [&_a:focus-visible]:outline-white" />
            <div className="hidden items-center gap-3 rounded-2xl bg-white p-2.5 pr-4 shadow-overlay lg:flex">
              <QrCode size={76} />
              <span className="max-w-[6.5rem] text-[14px] leading-5 font-semibold text-navy">{site.hero.qrLabel}</span>
            </div>
          </div>
        </Reveal>

        {/* Angled phone, cropped by the band's bottom edge */}
        <div className="relative h-[360px] md:h-[440px] lg:h-[580px]">
          <div aria-hidden className="pointer-events-none absolute top-[45%] left-1/2 size-[440px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(94,234,212,.28),rgba(37,99,255,.18)_55%,transparent)] md:size-[560px]" />
          <Reveal className="absolute top-2 left-1/2 -translate-x-1/2 md:top-4 lg:top-16" delay={0.1}>
            <div className="rotate-[8deg]">
              <Phone size={{ base: 236, md: 270, lg: 300 }} label="The Answerd app showing a chat where the Answerd desk for Swift Plumbing & Heating offers boiler service slots on Thursday">
                <ChatScreen />
              </Phone>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
