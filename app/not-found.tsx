import Link from "next/link"
import { WebHeader, WebFooter } from "@/components/shells/Web"
import { ScreenMeta } from "@/components/shells/ScreenMeta"
import { Mark } from "@/components/brand/Mark"
import { HeroSearch } from "@/components/web/home"
import { SiteChrome, SmartBanner } from "@/components/web/chrome"

/** W-24: 404 with search. */
export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-sky">
      <ScreenMeta id="W-24" />
      <SmartBanner />
      <WebHeader />
      <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col items-center px-6 py-16 text-center max-sm:px-4 md:py-20">
        <span className="inline-flex size-20 items-center justify-center rounded-full bg-blue-tint">
          <Mark size={44} />
        </span>
        <h1 className="t-title mt-5">We couldn&apos;t find that page</h1>
        <p className="mt-2 max-w-md t-body text-slate">The link may be old or mistyped. Search for a service instead.</p>
        <HeroSearch className="mt-6 max-w-2xl text-left" hideHelp />
        <ul className="mt-6 flex flex-wrap justify-center gap-2">
          {[
            ["/", "Home"],
            ["/plumbers", "Plumbers"],
            ["/cleaners", "Cleaners"],
            ["/help", "Help centre"],
            ["/claim", "Claim your business"],
          ].map(([href, label]) => (
            <li key={href}>
              <Link href={href!} className="inline-flex h-11 items-center rounded-full border border-line bg-white px-4 t-label text-navy hover:border-blue">
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <WebFooter />
      <SiteChrome />
    </div>
  )
}
