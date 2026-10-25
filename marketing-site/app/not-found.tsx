import type { Metadata } from "next"
import Link from "next/link"
import { WebPage } from "@/components/web/page"
import { focusRing } from "@/components/site/focus"
import { pages } from "@/content/pages"
import { site } from "@/content/site"

export const metadata: Metadata = { title: pages.notFound.metaTitle, robots: { index: false, follow: true } }

/** W-24: not found, with a way back to popular services. */
export default function NotFound() {
  const n = pages.notFound
  return (
    <WebPage>
      <div className="container-site py-16 text-center md:py-24">
        <h1 className="text-[32px] leading-[38px] font-bold tracking-[-0.02em] md:text-[44px] md:leading-[52px]">{n.heading}</h1>
        <p className="t-lead mx-auto mt-4 max-w-[36rem]">{n.body}</p>
        <ul className="mx-auto mt-8 flex max-w-[640px] flex-wrap justify-center gap-2">
          {site.services.items.map((s) => (
            <li key={s.href}>
              <Link href={s.href} className={`inline-flex h-11 items-center rounded-full border border-line bg-white px-4 text-[15px] font-medium text-navy hover:border-blue ${focusRing}`}>
                {s.label}
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/" className={`mt-8 inline-flex min-h-11 items-center rounded-sm font-semibold text-blue underline underline-offset-2 ${focusRing}`}>
          {n.home}
        </Link>
      </div>
    </WebPage>
  )
}
