import type { Metadata } from "next"
import Link from "next/link"
import { Bell, Briefcase, CalendarCheck, MessageCircle } from "lucide-react"
import { ScreenMeta } from "@/components/shells/ScreenMeta"
import { AppIcon } from "@/components/brand/Mark"
import { AppQr } from "@/components/web/AppQr"
import { Container, StoreBadges } from "@/components/web/ui"

export const metadata: Metadata = {
  title: "Get the app",
  description: "Answerd: local services. Book local pros, or list your business free. One app on iPhone and Android.",
  alternates: { canonical: "/get-the-app" },
}

/** W-26: Get the app. The smart banner on mobile is part of every public page (components/web/chrome). */
export default function Page() {
  return (
    <>
      <ScreenMeta id="W-26" />
      <Container className="py-12 md:py-20">
        <div className="card grid items-center gap-10 p-6 md:grid-cols-[1fr_auto] md:p-12">
          <div>
            <AppIcon size={72} />
            <h1 className="t-display mt-6">Answerd: local services</h1>
            <p className="mt-3 max-w-xl t-body text-slate">Book local pros. Or list your business free. One app for customers and businesses, on iPhone and Android.</p>
            <StoreBadges className="mt-6" />
            <p className="mt-3 t-caption text-muted-ink">Prototype: the badges open the app inside this demo.</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <AppQr size={200} />
            <p className="max-w-[200px] text-center t-caption text-muted-ink">On a computer? Scan to download on your phone.</p>
          </div>
        </div>
        <ul className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            [MessageCircle, "Replies in one place", "Messages from businesses and their Answerd desk."],
            [CalendarCheck, "Book in two taps", "Pick a time from their real diary."],
            [Bell, "Updates that matter", "Confirmations, “on my way” and reminders."],
            [Briefcase, "Run your business", "Switch to business mode: inbox, diary and the AI desk."],
          ].map(([I, t, b]) => {
            const Icon = I as typeof Bell
            return (
              <li key={t as string} className="card p-5">
                <Icon className="size-6 text-blue" aria-hidden />
                <h2 className="mt-3 t-subhead">{t as string}</h2>
                <p className="mt-1 t-label font-normal text-slate">{b as string}</p>
              </li>
            )
          })}
        </ul>
        <p className="mt-8 text-center t-label font-normal text-slate">
          Rather use the web?{" "}
          <Link href="/search" className="text-blue hover:underline">
            Find a business
          </Link>{" "}
          or{" "}
          <Link href="/claim" className="text-blue hover:underline">
            claim your listing
          </Link>
          .
        </p>
      </Container>
    </>
  )
}
