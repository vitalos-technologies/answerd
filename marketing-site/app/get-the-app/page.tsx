import type { Metadata } from "next"
import { pageMeta } from "@/lib/seo"
import Link from "next/link"
import { Bell, Briefcase, CalendarCheck, MessageCircle, type LucideIcon } from "lucide-react"
import { WebPage } from "@/components/web/page"
import { AppIcon } from "@/components/brand/Mark"
import { QrCode } from "@/components/site/qr-code"
import { StoreBadges } from "@/components/site/store-badges"
import { GetAppButton } from "@/components/site/get-app"
import { focusRing } from "@/components/site/focus"
import { pages } from "@/content/pages"
import { site } from "@/content/site"

export const metadata: Metadata = pageMeta({ title: pages.getTheApp.metaTitle, description: pages.getTheApp.metaDescription, path: "/get-the-app" })

const ICONS: Record<string, LucideIcon> = { MessageCircle, CalendarCheck, Bell, Briefcase }

/** W-26: get the app. The QR codes on the site point here; on a phone, Get the app goes to the right store. */
export default function GetTheAppPage() {
  const g = pages.getTheApp
  return (
    <WebPage className="bg-sky">
      <div className="container-site py-12 md:py-20">
        <div className="card-site grid items-center gap-10 p-6 md:grid-cols-[1fr_auto] md:p-12">
          <div>
            <AppIcon size={72} />
            <h1 className="mt-6 text-[34px] leading-10 font-bold tracking-[-0.02em] md:text-[48px] md:leading-[56px]">{g.heading}</h1>
            <p className="t-lead mt-3 max-w-xl">{g.body}</p>
            <GetAppButton icon className="mt-8 md:hidden" />
            <StoreBadges className="mt-6 max-md:hidden" />
          </div>
          <figure className="hidden flex-col items-center gap-3 md:flex">
            <div className="rounded-2xl border border-line bg-white p-4">
              <QrCode size={184} />
            </div>
            <figcaption className="max-w-[200px] text-center text-[14px] leading-5 text-muted-ink">{g.scan}</figcaption>
          </figure>
        </div>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {g.features.map((f) => {
            const Icon = ICONS[f.icon] ?? Bell
            return (
              <li key={f.title} className="card-site p-6">
                <Icon className="size-6 text-blue" aria-hidden />
                <h2 className="mt-4 text-[17px] leading-6 font-semibold text-navy">{f.title}</h2>
                <p className="mt-1 text-[15px] leading-6 text-slate">{f.body}</p>
              </li>
            )
          })}
        </ul>
        <p className="mt-8 text-center">
          <Link href="/claim" className={`rounded-sm font-semibold text-blue-hover underline underline-offset-2 hover:text-navy ${focusRing}`}>
            {g.claim}
          </Link>
        </p>
        <p className="mt-2 text-center text-[14px] leading-5 text-slate">{site.hero.note}</p>
      </div>
    </WebPage>
  )
}
